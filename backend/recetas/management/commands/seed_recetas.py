from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from recetas.models import Receta, PasoReceta, Ingrediente, RecetaIngrediente


RECETAS_DATA = [
    {
        'titulo': 'Tortilla de patatas',
        'descripcion': 'La clásica tortilla española con patatas y huevo, jugosa por dentro.',
        'tiempo_prep': 25,
        'calorias': 350,
        'categoria': 'Almuerzo',
        'imagen_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Tortilla_de_patata.jpg/320px-Tortilla_de_patata.jpg',
        'pasos': [
            'Pelar y cortar las patatas en láminas finas.',
            'Freír las patatas en aceite de oliva a fuego medio hasta que estén blandas.',
            'Batir los huevos con sal y añadir las patatas escurridas.',
            'Cuajar la mezcla en una sartén con un poco de aceite, dar la vuelta con un plato y terminar de cuajar.',
        ],
        'ingredientes': [
            ('Patata', 'gramos', 400),
            ('Huevo', 'unidades', 4),
            ('Aceite de oliva', 'ml', 80),
            ('Sal', 'gramos', 5),
        ],
    },
    {
        'titulo': 'Gazpacho andaluz',
        'descripcion': 'Sopa fría de tomate y verduras, perfecta para el verano.',
        'tiempo_prep': 15,
        'calorias': 120,
        'categoria': 'Almuerzo',
        'imagen_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/GazpachoMesaySopa.jpg/320px-GazpachoMesaySopa.jpg',
        'pasos': [
            'Lavar y trocear los tomates, pepino, pimiento y ajo.',
            'Añadir el pan remojado, el aceite, el vinagre y la sal.',
            'Triturar todo con la batidora hasta obtener una mezcla homogénea.',
            'Colar y enfriar en la nevera al menos 1 hora antes de servir.',
        ],
        'ingredientes': [
            ('Tomate', 'gramos', 600),
            ('Pepino', 'gramos', 100),
            ('Pimiento verde', 'gramos', 50),
            ('Ajo', 'dientes', 1),
            ('Aceite de oliva', 'ml', 60),
            ('Vinagre', 'ml', 20),
            ('Pan del día anterior', 'gramos', 50),
        ],
    },
    {
        'titulo': 'Tostadas con aguacate',
        'descripcion': 'Desayuno rápido y nutritivo con aguacate, limón y especias.',
        'tiempo_prep': 10,
        'calorias': 280,
        'categoria': 'Desayuno',
        'imagen_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Avocado_toast.jpg/320px-Avocado_toast.jpg',
        'pasos': [
            'Tostar las rebanadas de pan.',
            'Chafar el aguacate con un tenedor y añadir zumo de limón, sal y pimienta.',
            'Extender el aguacate sobre las tostadas.',
            'Añadir semillas de sésamo o pimiento rojo al gusto.',
        ],
        'ingredientes': [
            ('Pan integral', 'rebanadas', 2),
            ('Aguacate', 'unidades', 1),
            ('Limón', 'unidades', 0.5),
            ('Sal', 'gramos', 3),
            ('Pimienta negra', 'gramos', 1),
        ],
    },
    {
        'titulo': 'Pollo al horno con limón',
        'descripcion': 'Muslos de pollo jugosos marinados con limón, ajo y hierbas.',
        'tiempo_prep': 45,
        'calorias': 420,
        'categoria': 'Cena',
        'imagen_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/320px-Good_Food_Display_-_NCI_Visuals_Online.jpg',
        'pasos': [
            'Marinar el pollo con zumo de limón, ajo picado, romero, sal y pimienta durante 30 minutos.',
            'Precalentar el horno a 200°C.',
            'Colocar el pollo en una bandeja con un chorrito de aceite.',
            'Hornear 35-40 minutos hasta que esté dorado y bien cocido.',
        ],
        'ingredientes': [
            ('Muslos de pollo', 'unidades', 4),
            ('Limón', 'unidades', 2),
            ('Ajo', 'dientes', 3),
            ('Romero', 'gramos', 5),
            ('Aceite de oliva', 'ml', 30),
            ('Sal', 'gramos', 5),
        ],
    },
    {
        'titulo': 'Pasta carbonara',
        'descripcion': 'Pasta cremosa con panceta, huevo y queso parmesano, receta italiana clásica.',
        'tiempo_prep': 20,
        'calorias': 520,
        'categoria': 'Cena',
        'imagen_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Fresh_made_pasta_carbonara.jpg/320px-Fresh_made_pasta_carbonara.jpg',
        'pasos': [
            'Cocer la pasta en agua con sal según las instrucciones del paquete.',
            'Sofreír la panceta en cubitos en una sartén sin aceite hasta que esté crujiente.',
            'Batir los huevos con el queso parmesano rallado y pimienta negra.',
            'Mezclar la pasta caliente fuera del fuego con la panceta y la mezcla de huevo. Remover rápido para que no se cuaje.',
        ],
        'ingredientes': [
            ('Espaguetis', 'gramos', 200),
            ('Panceta', 'gramos', 100),
            ('Huevo', 'unidades', 2),
            ('Parmesano', 'gramos', 50),
            ('Pimienta negra', 'gramos', 2),
            ('Sal', 'gramos', 5),
        ],
    },
    {
        'titulo': 'Ensalada César',
        'descripcion': 'Ensalada fresca con lechuga romana, pollo, crutones y salsa César.',
        'tiempo_prep': 20,
        'calorias': 320,
        'categoria': 'Almuerzo',
        'imagen_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Classic_caesar_salad.jpg/320px-Classic_caesar_salad.jpg',
        'pasos': [
            'Cortar la lechuga en trozos y lavar bien.',
            'Cocinar el pollo a la plancha con sal y pimienta, dejar enfriar y laminar.',
            'Hacer los crutones tostando dados de pan en el horno con aceite y ajo.',
            'Mezclar todo y aliñar con salsa César, añadir parmesano rallado.',
        ],
        'ingredientes': [
            ('Lechuga romana', 'gramos', 200),
            ('Pechuga de pollo', 'gramos', 150),
            ('Pan', 'gramos', 60),
            ('Parmesano', 'gramos', 30),
            ('Salsa César', 'ml', 50),
        ],
    },
    {
        'titulo': 'Porridge de avena',
        'descripcion': 'Desayuno caliente de avena con leche, miel y frutas del bosque.',
        'tiempo_prep': 10,
        'calorias': 310,
        'categoria': 'Desayuno',
        'imagen_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Poridge.jpg/320px-Poridge.jpg',
        'pasos': [
            'Hervir la leche en un cazo a fuego medio.',
            'Añadir los copos de avena y remover constantemente durante 5 minutos.',
            'Retirar del fuego, añadir miel y servir con frutas del bosque por encima.',
        ],
        'ingredientes': [
            ('Copos de avena', 'gramos', 80),
            ('Leche', 'ml', 250),
            ('Miel', 'gramos', 15),
            ('Frutas del bosque', 'gramos', 60),
        ],
    },
    {
        'titulo': 'Brownie de chocolate',
        'descripcion': 'Brownie húmedo y denso de chocolate negro, crujiente por fuera.',
        'tiempo_prep': 35,
        'calorias': 480,
        'categoria': 'Postre',
        'imagen_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Chocolate_Brownie.jpg/320px-Chocolate_Brownie.jpg',
        'pasos': [
            'Derretir el chocolate con la mantequilla al baño maría.',
            'Batir los huevos con el azúcar hasta obtener una mezcla espumosa.',
            'Incorporar la mezcla de chocolate y añadir la harina tamizada.',
            'Verter en un molde engrasado y hornear a 175°C durante 20-25 minutos.',
        ],
        'ingredientes': [
            ('Chocolate negro', 'gramos', 150),
            ('Mantequilla', 'gramos', 100),
            ('Huevo', 'unidades', 3),
            ('Azúcar', 'gramos', 150),
            ('Harina', 'gramos', 80),
        ],
    },
    {
        'titulo': 'Crema de calabaza',
        'descripcion': 'Crema suave y reconfortante de calabaza con cebolla y un toque de nata.',
        'tiempo_prep': 30,
        'calorias': 180,
        'categoria': 'Cena',
        'imagen_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Pumpkin_cream_soup.jpg/320px-Pumpkin_cream_soup.jpg',
        'pasos': [
            'Pelar y trocear la calabaza y la cebolla.',
            'Sofreír la cebolla en aceite de oliva hasta transparentar.',
            'Añadir la calabaza y el caldo de verduras, cocer 20 minutos.',
            'Triturar, añadir nata al gusto, salpimentar y servir.',
        ],
        'ingredientes': [
            ('Calabaza', 'gramos', 500),
            ('Cebolla', 'unidades', 1),
            ('Caldo de verduras', 'ml', 400),
            ('Nata para cocinar', 'ml', 50),
            ('Aceite de oliva', 'ml', 20),
            ('Sal', 'gramos', 4),
        ],
    },
    {
        'titulo': 'Smoothie de plátano y fresa',
        'descripcion': 'Batido fresco y energético con plátano, fresas y leche de avena.',
        'tiempo_prep': 5,
        'calorias': 220,
        'categoria': 'Merienda',
        'imagen_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Raspberry_smoothie.jpg/320px-Raspberry_smoothie.jpg',
        'pasos': [
            'Pelar el plátano y lavar las fresas.',
            'Introducir todos los ingredientes en la batidora.',
            'Triturar hasta obtener una textura homogénea y servir frío.',
        ],
        'ingredientes': [
            ('Plátano', 'unidades', 1),
            ('Fresa', 'gramos', 100),
            ('Leche de avena', 'ml', 200),
            ('Miel', 'gramos', 10),
        ],
    },
]


class Command(BaseCommand):
    help = 'Puebla la base de datos con recetas de ejemplo'

    def handle(self, *args, **kwargs):
        admin, _ = User.objects.get_or_create(username='kokka_admin', defaults={
            'email': 'admin@kokka.app',
            'is_staff': True,
            'is_superuser': True,
        })
        if not admin.password or admin.password == '':
            admin.set_password('KOKKATFG2024')
            admin.save()

        creadas = 0
        for data in RECETAS_DATA:
            if Receta.objects.filter(titulo=data['titulo']).exists():
                continue

            receta = Receta.objects.create(
                titulo=data['titulo'],
                descripcion=data['descripcion'],
                tiempo_prep=data['tiempo_prep'],
                calorias=data['calorias'],
                categoria=data['categoria'],
                imagen_url=data['imagen_url'],
                creador=admin,
            )

            for i, descripcion_paso in enumerate(data['pasos'], start=1):
                PasoReceta.objects.create(receta=receta, numero=i, descripcion=descripcion_paso)

            for nombre, unidad, cantidad in data['ingredientes']:
                ingrediente, _ = Ingrediente.objects.get_or_create(
                    nombre=nombre,
                    defaults={'unidad_medida': unidad}
                )
                RecetaIngrediente.objects.create(receta=receta, ingrediente=ingrediente, cantidad=cantidad)

            creadas += 1

        self.stdout.write(self.style.SUCCESS(f'{creadas} recetas creadas correctamente.'))
