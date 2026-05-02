from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from .models import Perfil, Receta, PasoReceta, Ingrediente, RecetaIngrediente, PlanComida, Valoracion


class PasoRecetaInline(admin.TabularInline):
    model = PasoReceta
    extra = 0


class RecetaIngredienteInline(admin.TabularInline):
    model = RecetaIngrediente
    extra = 0


@admin.register(Receta)
class RecetaAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'creador', 'estado', 'categoria', 'fecha_creacion']
    list_filter = ['estado', 'categoria']
    search_fields = ['titulo', 'creador__username']
    list_editable = ['estado']
    ordering = ['-fecha_creacion']
    inlines = [RecetaIngredienteInline, PasoRecetaInline]
    actions = ['aprobar_recetas', 'rechazar_recetas']

    def aprobar_recetas(self, request, queryset):
        updated = queryset.filter(creador__isnull=False).update(estado='aprobada')
        self.message_user(request, f'{updated} receta(s) aprobada(s).')
    aprobar_recetas.short_description = 'Aprobar recetas seleccionadas'

    def rechazar_recetas(self, request, queryset):
        updated = queryset.filter(creador__isnull=False).update(estado='rechazada')
        self.message_user(request, f'{updated} receta(s) rechazada(s).')
    rechazar_recetas.short_description = 'Rechazar recetas seleccionadas'


@admin.register(Ingrediente)
class IngredienteAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'unidad_medida']
    search_fields = ['nombre']


@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):
    list_display = ['user', 'tiempo_cocina', 'categoria_favorita', 'objetivo_calorias', 'onboarding_completado']
    search_fields = ['user__username']


@admin.register(PlanComida)
class PlanComidaAdmin(admin.ModelAdmin):
    list_display = ['user', 'receta', 'fecha', 'tipo_comida']
    list_filter = ['tipo_comida']


@admin.register(Valoracion)
class ValoracionAdmin(admin.ModelAdmin):
    list_display = ['user', 'receta', 'puntuacion', 'fecha']
    list_filter = ['puntuacion']
    search_fields = ['user__username', 'receta__titulo']
    ordering = ['-fecha']


admin.site.unregister(User)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'date_joined', 'is_active', 'is_staff']
    list_filter = ['is_active', 'is_staff']
    actions = ['desactivar_usuarios', 'activar_usuarios']

    def desactivar_usuarios(self, request, queryset):
        updated = queryset.exclude(pk=request.user.pk).update(is_active=False)
        self.message_user(request, f'{updated} cuenta(s) desactivada(s).')
    desactivar_usuarios.short_description = 'Desactivar cuentas seleccionadas'

    def activar_usuarios(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} cuenta(s) activada(s).')
    activar_usuarios.short_description = 'Activar cuentas seleccionadas'
