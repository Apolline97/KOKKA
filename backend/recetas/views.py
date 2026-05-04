from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from .models import Perfil, Receta, PasoReceta, Ingrediente, RecetaIngrediente, PlanComida, Favorito, Valoracion
from .serializers import (
    PerfilSerializer, RecetaSerializer, RecetaListSerializer, PasoRecetaSerializer,
    IngredienteSerializer, RecetaIngredienteSerializer, PlanComidaSerializer, FavoritoSerializer,
    ValoracionSerializer, MiValoracionSerializer
)


def recetas_visibles_qs():
    """Queryset base de recetas públicamente visibles: aprobadas o pendientes con más de 5 días."""
    cinco_dias_atras = timezone.now() - timedelta(days=5)
    return Q(estado='aprobada') | (Q(estado='pendiente') & Q(fecha_creacion__lte=cinco_dias_atras))


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

        if email and User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Ese correo electrónico ya está registrado'},
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
        ).select_related('creador').filter(recetas_visibles_qs())
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
        titulo = serializer.validated_data.get('titulo', '')
        if Receta.objects.filter(creador=self.request.user, titulo__iexact=titulo).exists():
            raise ValidationError({'titulo': 'Ya tienes una receta con ese nombre.'})
        serializer.save(creador=self.request.user, estado='pendiente')

    def destroy(self, request, *args, **kwargs):
        try:
            receta = Receta.objects.get(pk=kwargs['pk'])
        except Receta.DoesNotExist:
            return Response({'error': 'Receta no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        if receta.creador != request.user:
            return Response(
                {'error': 'No tienes permiso para eliminar esta receta'},
                status=status.HTTP_403_FORBIDDEN
            )
        receta.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='recomendadas')
    def recomendadas(self, request):
        import random
        try:
            perfil = Perfil.objects.get(user=request.user)
        except Perfil.DoesNotExist:
            perfil = None

        qs = Receta.objects.prefetch_related('valoracion_set').select_related('creador').filter(
            recetas_visibles_qs()
        )

        if perfil and perfil.onboarding_completado:
            if perfil.tiempo_cocina == 'rapido':
                qs = qs.filter(tiempo_prep__lte=20)
            elif perfil.tiempo_cocina == 'medio':
                qs = qs.filter(tiempo_prep__lte=45)

            if perfil.categoria_favorita:
                qs = qs.filter(categoria=perfil.categoria_favorita)

            if perfil.objetivo_calorias == 'ligero':
                qs = qs.filter(calorias__lte=400)
            elif perfil.objetivo_calorias == 'equilibrado':
                qs = qs.filter(calorias__lte=600)
        else:
            qs = qs.filter(tiempo_prep__lt=30, calorias__lt=600)

        ids = list(qs.values_list('id', flat=True))
        if len(ids) < 6:
            ids = list(Receta.objects.filter(recetas_visibles_qs()).values_list('id', flat=True))
        if len(ids) > 12:
            ids = random.sample(ids, 12)

        recetas = Receta.objects.prefetch_related('valoracion_set').filter(id__in=ids)
        serializer = self.get_serializer(recetas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='mis-recetas')
    def mis_recetas(self, request):
        recetas = Receta.objects.filter(creador=request.user).prefetch_related('valoracion_set')
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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        receta = serializer.validated_data['receta']
        fecha = serializer.validated_data['fecha']
        tipo_comida = serializer.validated_data['tipo_comida']
        plan, created = PlanComida.objects.update_or_create(
            user=request.user,
            fecha=fecha,
            tipo_comida=tipo_comida,
            defaults={'receta': receta},
        )
        out = PlanComidaSerializer(plan, context={'request': request})
        return Response(out.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


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
        serializer = FavoritoSerializer(favoritos, many=True, context={'request': request})
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
        if email and email != request.user.email:
            if User.objects.filter(email=email).exclude(pk=request.user.pk).exists():
                return Response({'error': 'Ese correo electrónico ya está registrado'}, status=status.HTTP_400_BAD_REQUEST)
            request.user.email = email
        request.user.save()

        serializer = PerfilSerializer(perfil, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            perfil.user.refresh_from_db()
            return Response(PerfilSerializer(perfil, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EliminarCuentaView(APIView):
    """El usuario autenticado elimina su propia cuenta y todos sus datos."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user = request.user
        Receta.objects.filter(creador=user).delete()
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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
            puntuacion_int = int(puntuacion)
        except (ValueError, TypeError):
            return Response({'error': 'La puntuación debe ser un número'}, status=status.HTTP_400_BAD_REQUEST)

        if not (1 <= puntuacion_int <= 5):
            return Response({'error': 'La puntuación debe estar entre 1 y 5'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            receta = Receta.objects.get(id=receta_id)
        except Receta.DoesNotExist:
            return Response({'error': 'Receta no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        valoracion, created = Valoracion.objects.update_or_create(
            user=request.user,
            receta=receta,
            defaults={'puntuacion': puntuacion_int, 'comentario': comentario}
        )
        return Response(
            ValoracionSerializer(valoracion).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
