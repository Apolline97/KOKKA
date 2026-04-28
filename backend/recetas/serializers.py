from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Perfil, Receta, PasoReceta, Ingrediente, RecetaIngrediente, PlanComida, Favorito


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class PerfilSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Perfil
        fields = ['id', 'user', 'preferencias', 'alergias']


class IngredienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingrediente
        fields = ['id', 'nombre', 'unidad_medida']


class PasoRecetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PasoReceta
        fields = ['id', 'numero', 'descripcion']


class RecetaIngredienteSerializer(serializers.ModelSerializer):
    ingrediente = IngredienteSerializer(read_only=True)
    ingrediente_id = serializers.PrimaryKeyRelatedField(
        queryset=Ingrediente.objects.all(), source='ingrediente', write_only=True
    )

    class Meta:
        model = RecetaIngrediente
        fields = ['id', 'ingrediente', 'ingrediente_id', 'cantidad']


class RecetaListSerializer(serializers.ModelSerializer):
    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model = Receta
        fields = ['id', 'titulo', 'tiempo_prep', 'calorias', 'categoria', 'imagen_url']

    def get_imagen_url(self, obj):
        if obj.imagen:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.imagen.url)
        return obj.imagen_url


class RecetaSerializer(serializers.ModelSerializer):
    ingredientes = RecetaIngredienteSerializer(
        source='recetaingrediente_set', many=True, read_only=True
    )
    pasos = PasoRecetaSerializer(many=True, read_only=True)
    creador = UserSerializer(read_only=True)
    pasos_nuevos = serializers.CharField(write_only=True, required=False, allow_blank=True)
    imagen = serializers.ImageField(write_only=True, required=False)
    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model = Receta
        fields = [
            'id', 'titulo', 'descripcion', 'tiempo_prep',
            'calorias', 'categoria', 'imagen_url', 'imagen', 'fecha_creacion',
            'creador', 'ingredientes', 'pasos', 'pasos_nuevos'
        ]

    def get_imagen_url(self, obj):
        if obj.imagen:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.imagen.url)
        return obj.imagen_url

    def create(self, validated_data):
        import json
        pasos_raw = validated_data.pop('pasos_nuevos', '[]')
        try:
            pasos_data = json.loads(pasos_raw) if isinstance(pasos_raw, str) else pasos_raw
        except (json.JSONDecodeError, TypeError):
            pasos_data = []
        receta = Receta.objects.create(**validated_data)
        for paso in pasos_data:
            if paso.get('descripcion'):
                PasoReceta.objects.create(
                    receta=receta,
                    numero=paso.get('numero', 1),
                    descripcion=paso['descripcion']
                )
        return receta

    def update(self, instance, validated_data):
        import json
        pasos_raw = validated_data.pop('pasos_nuevos', None)
        instance = super().update(instance, validated_data)
        if pasos_raw is not None:
            try:
                pasos_data = json.loads(pasos_raw) if isinstance(pasos_raw, str) else pasos_raw
            except (json.JSONDecodeError, TypeError):
                pasos_data = []
            instance.pasos.all().delete()
            for paso in pasos_data:
                if paso.get('descripcion'):
                    PasoReceta.objects.create(
                        receta=instance,
                        numero=paso.get('numero', 1),
                        descripcion=paso['descripcion']
                    )
        return instance


class FavoritoSerializer(serializers.ModelSerializer):
    receta = RecetaSerializer(read_only=True)
    receta_id = serializers.PrimaryKeyRelatedField(
        queryset=Receta.objects.all(), source='receta', write_only=True
    )

    class Meta:
        model = Favorito
        fields = ['id', 'receta', 'receta_id']


class PlanComidaSerializer(serializers.ModelSerializer):
    receta = RecetaSerializer(read_only=True)
    receta_id = serializers.PrimaryKeyRelatedField(
        queryset=Receta.objects.all(), source='receta', write_only=True
    )

    class Meta:
        model = PlanComida
        fields = ['id', 'receta', 'receta_id', 'fecha', 'tipo_comida']
