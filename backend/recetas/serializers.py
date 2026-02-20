from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Perfil, Receta, Ingrediente, RecetaIngrediente, PlanComida

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil
        fields = '__all__'

class IngredienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingrediente
        fields = '__all__'

class RecetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receta
        fields = '__all__'

class RecetaIngredienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecetaIngrediente
        fields = '__all__'

class PlanComidaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanComida
        fields = '__all__'