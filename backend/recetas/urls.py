from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (UserViewSet, PerfilViewSet, RecetaViewSet, 
                    IngredienteViewSet, RecetaIngredienteViewSet, PlanComidaViewSet)

router = DefaultRouter()
router.register(r'usuarios', UserViewSet)
router.register(r'perfiles', PerfilViewSet)
router.register(r'recetas', RecetaViewSet) 
router.register(r'ingredientes', IngredienteViewSet)
router.register(r'receta-ingredientes', RecetaIngredienteViewSet)
router.register(r'planes-comida', PlanComidaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]