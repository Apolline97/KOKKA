from rest_framework import viewsets
from django.contrib.auth.models import User
from .models import Perfil, Receta, Ingrediente, RecetaIngrediente, PlanComida
from .serializers import (UserSerializer, PerfilSerializer, RecetaSerializer, 
                          IngredienteSerializer, RecetaIngredienteSerializer, PlanComidaSerializer)

# ViewSet para Usuarios
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

# ViewSet para Perfiles
class PerfilViewSet(viewsets.ModelViewSet):
    queryset = Perfil.objects.all()
    serializer_class = PerfilSerializer

# ViewSet para Recetas (Este es el más importante para el RF-03 de Lucas)
class RecetaViewSet(viewsets.ModelViewSet):
    queryset = Receta.objects.all()
    serializer_class = RecetaSerializer

# ViewSet para Ingredientes
class IngredienteViewSet(viewsets.ModelViewSet):
    queryset = Ingrediente.objects.all()
    serializer_class = IngredienteSerializer

# ViewSet para la relación Receta-Ingrediente
class RecetaIngredienteViewSet(viewsets.ModelViewSet):
    queryset = RecetaIngrediente.objects.all()
    serializer_class = RecetaIngredienteSerializer

# ViewSet para los Planes de Comida (Calendario)
class PlanComidaViewSet(viewsets.ModelViewSet):
    queryset = PlanComida.objects.all()
    serializer_class = PlanComidaSerializer