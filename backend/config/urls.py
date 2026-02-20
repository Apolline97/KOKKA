from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Esto conecta el proyecto principal con las rutas de tu app 'recetas'
    path('api/', include('recetas.urls')), 
]