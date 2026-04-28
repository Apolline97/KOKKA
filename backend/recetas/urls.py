from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RecetaViewSet, PasoRecetaViewSet, IngredienteViewSet,
    RecetaIngredienteViewSet, PlanComidaViewSet, PerfilViewSet,
    RegistroView, LoginView, MiPerfilView, FavoritosView
)

router = DefaultRouter()
router.register(r'recetas', RecetaViewSet, basename='receta')
router.register(r'pasos', PasoRecetaViewSet)
router.register(r'ingredientes', IngredienteViewSet)
router.register(r'receta-ingredientes', RecetaIngredienteViewSet)
router.register(r'planes', PlanComidaViewSet, basename='plancomida')
router.register(r'perfiles', PerfilViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/registro/', RegistroView.as_view()),
    path('auth/login/', LoginView.as_view()),
    path('auth/perfil/', MiPerfilView.as_view()),
    path('favoritos/', FavoritosView.as_view()),
]
