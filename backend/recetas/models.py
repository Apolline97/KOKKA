from django.db import models
from django.contrib.auth.models import User

# Perfil: (id_perfil, id_user, preferencias, alergias)
class Perfil(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    preferencias = models.TextField(blank=True, null=True, help_text="Ej: Vegano, sin gluten")
    alergias = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Perfil de {self.user.username}"

# Receta: (id_receta, titulo, descripcion, tiempo_prep, calorias, imagen_url, fecha_creacion)
class Receta(models.Model):
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    tiempo_prep = models.PositiveIntegerField(help_text="Tiempo en minutos")
    calorias = models.PositiveIntegerField()
    imagen_url = models.URLField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titulo

# Ingrediente: (id_ingrediente, nombre, unidad_medida)
class Ingrediente(models.Model):
    nombre = models.CharField(max_length=100)
    unidad_medida = models.CharField(max_length=50, help_text="Ej: gramos, ml, unidades")

    def __str__(self):
        return self.nombre

# Receta_Ingrediente: (id, id_receta, id_ingrediente, cantidad)
class RecetaIngrediente(models.Model):
    receta = models.ForeignKey(Receta, on_delete=models.CASCADE)
    ingrediente = models.ForeignKey(Ingrediente, on_delete=models.CASCADE)
    cantidad = models.DecimalField(max_digits=6, decimal_places=2)

    def __str__(self):
        return f"{self.cantidad} {self.ingrediente.unidad_medida} de {self.ingrediente.nombre} en {self.receta.titulo}"

# PlanComida: (id_plan, id_user, id_receta, fecha, tipo_comida)
class PlanComida(models.Model):
    TIPOS_COMIDA = [
        ('Almuerzo', 'Almuerzo'),
        ('Cena', 'Cena'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    receta = models.ForeignKey(Receta, on_delete=models.CASCADE)
    fecha = models.DateField()
    tipo_comida = models.CharField(max_length=20, choices=TIPOS_COMIDA)

    def __str__(self):
        return f"{self.tipo_comida} el {self.fecha} para {self.user.username}"