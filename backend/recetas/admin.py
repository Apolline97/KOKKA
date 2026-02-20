from django.contrib import admin
from .models import Perfil, Receta, Ingrediente, RecetaIngrediente, PlanComida

# Registramos nuestros modelos para que aparezcan en el panel /admin
admin.site.register(Perfil)
admin.site.register(Receta)
admin.site.register(Ingrediente)
admin.site.register(RecetaIngrediente)
admin.site.register(PlanComida)
