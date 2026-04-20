from django.contrib import admin
from .models import Perfil, Receta, PasoReceta, Ingrediente, RecetaIngrediente, PlanComida


class PasoRecetaInline(admin.TabularInline):
    model = PasoReceta
    extra = 3


class RecetaIngredienteInline(admin.TabularInline):
    model = RecetaIngrediente
    extra = 3


@admin.register(Receta)
class RecetaAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'categoria', 'tiempo_prep', 'calorias', 'fecha_creacion']
    list_filter = ['categoria']
    search_fields = ['titulo']
    inlines = [RecetaIngredienteInline, PasoRecetaInline]


@admin.register(Ingrediente)
class IngredienteAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'unidad_medida']
    search_fields = ['nombre']


@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):
    list_display = ['user', 'preferencias', 'alergias']


@admin.register(PlanComida)
class PlanComidaAdmin(admin.ModelAdmin):
    list_display = ['user', 'receta', 'fecha', 'tipo_comida']
    list_filter = ['tipo_comida']
