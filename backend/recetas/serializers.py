from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Avg
from .models import Perfil, Receta, PasoReceta, Ingrediente, RecetaIngrediente, PlanComida, Favorito, Valoracion


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class PerfilSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    foto = serializers.ImageField(required=False, allow_null=True)
    foto_url = serializers.SerializerMethodField()

    class Meta:
        model = Perfil
        fields = [
            'id', 'user', 'preferencias', 'alergias', 'foto', 'foto_url',
            'tiempo_cocina', 'categoria_favorita', 'objetivo_calorias', 'onboarding_completado',
        ]

    def get_foto_url(self, obj):
        if obj.foto:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.foto.url)
        return None


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
        fields = ['id', 'ingrediente', 'ingrediente_id', 'cantidad', 'unidad_medida']


class ValoracionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Valoracion
        fields = ['id', 'username', 'puntuacion', 'comentario', 'fecha']


class MiValoracionSerializer(serializers.ModelSerializer):
    receta_id = serializers.IntegerField(source='receta.id', read_only=True)
    receta_titulo = serializers.CharField(source='receta.titulo', read_only=True)
    receta_imagen = serializers.SerializerMethodField()

    class Meta:
        model = Valoracion
        fields = ['id', 'receta_id', 'receta_titulo', 'receta_imagen', 'puntuacion', 'comentario', 'fecha']

    def get_receta_imagen(self, obj):
        return obj.receta.imagen_url


class RecetaListSerializer(serializers.ModelSerializer):
    imagen_url = serializers.SerializerMethodField()
    media_valoracion = serializers.SerializerMethodField()

    class Meta:
        model = Receta
        fields = ['id', 'titulo', 'tiempo_prep', 'calorias', 'categoria', 'imagen_url', 'media_valoracion', 'estado']

    def get_imagen_url(self, obj):
        if obj.imagen:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.imagen.url)
        return obj.imagen_url

    def get_media_valoracion(self, obj):
        result = obj.valoracion_set.aggregate(media=Avg('puntuacion'))
        media = result['media']
        return round(media, 1) if media else None


class RecetaSerializer(serializers.ModelSerializer):
    ingredientes = RecetaIngredienteSerializer(
        source='recetaingrediente_set', many=True, read_only=True
    )
    pasos = PasoRecetaSerializer(many=True, read_only=True)
    creador = UserSerializer(read_only=True)
    pasos_nuevos = serializers.CharField(write_only=True, required=False, allow_blank=True)
    ingredientes_nuevos = serializers.CharField(write_only=True, required=False, allow_blank=True)
    imagen = serializers.ImageField(write_only=True, required=False)
    imagen_url = serializers.SerializerMethodField()
    media_valoracion = serializers.SerializerMethodField()

    class Meta:
        model = Receta
        fields = [
            'id', 'titulo', 'descripcion', 'tiempo_prep',
            'calorias', 'categoria', 'imagen_url', 'imagen', 'fecha_creacion',
            'creador', 'ingredientes', 'pasos', 'pasos_nuevos', 'ingredientes_nuevos', 'media_valoracion', 'estado'
        ]

    def get_media_valoracion(self, obj):
        result = obj.valoracion_set.aggregate(media=Avg('puntuacion'))
        media = result['media']
        return round(media, 1) if media else None

    def get_imagen_url(self, obj):
        if obj.imagen:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.imagen.url)
        return obj.imagen_url

    def create(self, validated_data):
        import json
        pasos_raw = validated_data.pop('pasos_nuevos', '[]')
        ingredientes_raw = validated_data.pop('ingredientes_nuevos', '[]')
        try:
            pasos_data = json.loads(pasos_raw) if isinstance(pasos_raw, str) else pasos_raw
        except (json.JSONDecodeError, TypeError):
            pasos_data = []
        try:
            ingredientes_data = json.loads(ingredientes_raw) if isinstance(ingredientes_raw, str) else ingredientes_raw
        except (json.JSONDecodeError, TypeError):
            ingredientes_data = []

        receta = Receta.objects.create(**validated_data)

        for paso in pasos_data:
            if paso.get('descripcion'):
                PasoReceta.objects.create(
                    receta=receta,
                    numero=paso.get('numero', 1),
                    descripcion=paso['descripcion']
                )

        for ing in ingredientes_data:
            nombre = ing.get('nombre', '').strip()
            if not nombre:
                continue
            unidad = ing.get('unidad', '').strip()
            cantidad = min(float(ing.get('cantidad', 1) or 1), 9999.99)
            ingrediente, _ = Ingrediente.objects.get_or_create(
                nombre=nombre,
                defaults={'unidad_medida': unidad}
            )
            RecetaIngrediente.objects.create(
                receta=receta,
                ingrediente=ingrediente,
                cantidad=cantidad,
                unidad_medida=unidad
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
    receta = RecetaListSerializer(read_only=True)
    receta_id = serializers.PrimaryKeyRelatedField(
        queryset=Receta.objects.all(), source='receta', write_only=True
    )

    class Meta:
        model = Favorito
        fields = ['id', 'receta', 'receta_id']


class PlanComidaSerializer(serializers.ModelSerializer):
    receta = RecetaListSerializer(read_only=True)
    receta_id = serializers.PrimaryKeyRelatedField(
        queryset=Receta.objects.all(), source='receta', write_only=True
    )

    class Meta:
        model = PlanComida
        fields = ['id', 'receta', 'receta_id', 'fecha', 'tipo_comida']
