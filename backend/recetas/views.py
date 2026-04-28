from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import Perfil, Receta, PasoReceta, Ingrediente, RecetaIngrediente, PlanComida, Favorito, Valoracion
from .serializers import (
    PerfilSerializer, RecetaSerializer, RecetaListSerializer, PasoRecetaSerializer,
    IngredienteSerializer, RecetaIngredienteSerializer, PlanComidaSerializer, FavoritoSerializer,
    ValoracionSerializer, MiValoracionSerializer
)


class RegistroView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'username y password son obligatorios'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Ese nombre de usuario ya existe'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(username=username, email=email, password=password)
        Perfil.objects.create(user=user)
        token, _ = Token.objects.get_or_create(user=user)

        return Response({'token': token.key, 'user_id': user.id, 'username': user.username},
                        status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)

        if not user:
            return Response(
                {'error': 'Credenciales incorrectas'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user_id': user.id, 'username': user.username})


class RecetaViewSet(viewsets.ModelViewSet):
    """CRUD completo para recetas. Soporta ?search= y ?categoria="""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ('list', 'recomendadas', 'mis_recetas'):
            return RecetaListSerializer
        return RecetaSerializer

    def get_queryset(self):
        queryset = Receta.objects.prefetch_related(
            'pasos', 'recetaingrediente_set__ingrediente', 'valoracion_set'
        ).select_related('creador')
        categoria = self.request.query_params.get('categoria')
        search = self.request.query_params.get('search')
        if categoria:
            queryset = queryset.filter(categoria=categoria)
        if search:
            queryset = queryset.filter(
                Q(titulo__icontains=search) |
                Q(recetaingrediente__ingrediente__nombre__icontains=search)
            ).distinct()
        return queryset.order_by('titulo')

    def perform_create(self, serializer):
        serializer.save(creador=self.request.user)

    @action(detail=False, methods=['get'], url_path='recomendadas')
    def recomendadas(self, request):
        recetas = Receta.objects.filter(tiempo_prep__lt=30, calorias__lt=600)
        serializer = self.get_serializer(recetas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='mis-recetas')
    def mis_recetas(self, request):
        recetas = Receta.objects.filter(creador=request.user)
        serializer = self.get_serializer(recetas, many=True)
        return Response(serializer.data)


class IngredienteViewSet(viewsets.ModelViewSet):
    """CRUD completo para ingredientes."""
    queryset = Ingrediente.objects.all()
    serializer_class = IngredienteSerializer
    permission_classes = [permissions.IsAuthenticated]


class PasoRecetaViewSet(viewsets.ModelViewSet):
    """CRUD para los pasos de elaboración de una receta."""
    queryset = PasoReceta.objects.all()
    serializer_class = PasoRecetaSerializer
    permission_classes = [permissions.IsAuthenticated]


class RecetaIngredienteViewSet(viewsets.ModelViewSet):
    """CRUD para la relación receta-ingrediente."""
    queryset = RecetaIngrediente.objects.all()
    serializer_class = RecetaIngredienteSerializer
    permission_classes = [permissions.IsAuthenticated]


class PlanComidaViewSet(viewsets.ModelViewSet):
    """Plan de comidas del usuario autenticado. Soporta ?fecha=YYYY-MM-DD"""
    serializer_class = PlanComidaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = PlanComida.objects.filter(user=self.request.user)
        fecha = self.request.query_params.get('fecha')
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PerfilViewSet(viewsets.ModelViewSet):
    """CRUD para perfiles de usuario."""
    queryset = Perfil.objects.all()
    serializer_class = PerfilSerializer
    permission_classes = [permissions.IsAuthenticated]


class FavoritosView(APIView):
    """Listar, añadir y quitar favoritos del usuario autenticado."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        favoritos = Favorito.objects.filter(user=request.user)
        serializer = FavoritoSerializer(favoritos, many=True)
        return Response(serializer.data)

    def post(self, request):
        receta_id = request.data.get('receta_id')
        try:
            receta = Receta.objects.get(id=receta_id)
        except Receta.DoesNotExist:
            return Response({'error': 'Receta no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        favorito, creado = Favorito.objects.get_or_create(user=request.user, receta=receta)
        serializer = FavoritoSerializer(favorito)
        return Response(serializer.data, status=status.HTTP_201_CREATED if creado else status.HTTP_200_OK)

    def delete(self, request):
        receta_id = request.data.get('receta_id')
        Favorito.objects.filter(user=request.user, receta_id=receta_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MiPerfilView(APIView):
    """Ver y editar el perfil del usuario autenticado."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        perfil = Perfil.objects.get(user=request.user)
        serializer = PerfilSerializer(perfil, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        perfil = Perfil.objects.get(user=request.user)

        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        if username and username != request.user.username:
            if User.objects.filter(username=username).exclude(pk=request.user.pk).exists():
                return Response({'error': 'Ese nombre de usuario ya existe'}, status=status.HTTP_400_BAD_REQUEST)
            request.user.username = username
        if email:
            request.user.email = email
        request.user.save()

        serializer = PerfilSerializer(perfil, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            perfil.user.refresh_from_db()
            return Response(PerfilSerializer(perfil, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ValoracionesView(APIView):
    """Obtener y crear/actualizar valoraciones de una receta."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        receta_id = request.query_params.get('receta_id')
        if receta_id:
            valoraciones = Valoracion.objects.filter(receta_id=receta_id).select_related('user')
            return Response(ValoracionSerializer(valoraciones, many=True).data)
        valoraciones = Valoracion.objects.filter(user=request.user).select_related('receta')
        return Response(MiValoracionSerializer(valoraciones, many=True).data)

    def post(self, request):
        receta_id = request.data.get('receta_id')
        puntuacion = request.data.get('puntuacion')
        comentario = request.data.get('comentario', '')

        if not receta_id or not puntuacion:
            return Response({'error': 'receta_id y puntuacion son obligatorios'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            receta = Receta.objects.get(id=receta_id)
        except Receta.DoesNotExist:
            return Response({'error': 'Receta no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        valoracion, _ = Valoracion.objects.update_or_create(
            user=request.user,
            receta=receta,
            defaults={'puntuacion': int(puntuacion), 'comentario': comentario}
        )
        return Response(ValoracionSerializer(valoracion).data, status=status.HTTP_201_CREATED)
