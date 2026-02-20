from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Perfil, Receta, Ingrediente, RecetaIngrediente, PlanComida
from .serializers import (UserSerializer, PerfilSerializer, RecetaSerializer,
                          IngredienteSerializer, RecetaIngredienteSerializer, PlanComidaSerializer)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class PerfilViewSet(viewsets.ModelViewSet):
    queryset = Perfil.objects.all()
    serializer_class = PerfilSerializer

# --- AQUÍ ESTÁ LA MAGIA DEL RF-06 ---


class RecetaViewSet(viewsets.ModelViewSet):
    queryset = Receta.objects.all()
    serializer_class = RecetaSerializer

    # Creamos una ruta personalizada: /api/recetas/recomendadas/
    @action(detail=False, methods=['get'])
    def recomendadas(self, request):
        # Filtramos recetas rápidas (<= 30 min) y bajas en calorías (< 600 kcal)
        recetas_filtradas = self.queryset.filter(
            tiempo_prep__lte=30, calorias__lt=600)

        # Si no hay ninguna que cumpla esa condición, devolvemos 3 recetas aleatorias (?)
        if not recetas_filtradas.exists():
            recetas_filtradas = self.queryset.order_by('?')[:3]

        # Convertimos las recetas a JSON y las enviamos al Frontend
        serializer = self.get_serializer(recetas_filtradas, many=True)
        return Response(serializer.data)
# -----------------------------------


class IngredienteViewSet(viewsets.ModelViewSet):
    queryset = Ingrediente.objects.all()
    serializer_class = IngredienteSerializer


class RecetaIngredienteViewSet(viewsets.ModelViewSet):
    queryset = RecetaIngrediente.objects.all()
    serializer_class = RecetaIngredienteSerializer


class PlanComidaViewSet(viewsets.ModelViewSet):
    queryset = PlanComida.objects.all()
    serializer_class = PlanComidaSerializer
