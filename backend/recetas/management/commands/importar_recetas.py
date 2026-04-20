import requests
import random
from django.core.management.base import BaseCommand
from deep_translator import GoogleTranslator
from recetas.models import Receta, PasoReceta, Ingrediente, RecetaIngrediente

translator = GoogleTranslator(source='en', target='es')

CATEGORIA_MAP = {
    'Breakfast': 'Desayuno',
    'Dessert': 'Postre',
    'Side': 'Merienda',
    'Starter': 'Merienda',
    'Beef': 'Almuerzo',
    'Chicken': 'Almuerzo',
    'Lamb': 'Cena',
    'Pork': 'Cena',
    'Seafood': 'Cena',
    'Pasta': 'Almuerzo',
    'Vegetarian': 'Almuerzo',
    'Vegan': 'Almuerzo',
    'Miscellaneous': 'Almuerzo',
}

TIEMPO_POR_CATEGORIA = {
    'Desayuno': (10, 25),
    'Merienda': (10, 20),
    'Almuerzo': (20, 50),
    'Cena': (25, 55),
    'Postre': (15, 40),
}

CALORIAS_POR_CATEGORIA = {
    'Desayuno': (250, 450),
    'Merienda': (150, 350),
    'Almuerzo': (400, 700),
    'Cena': (350, 650),
    'Postre': (300, 600),
}


def traducir(texto):
    if not texto:
        return ''
    try:
        resultado = translator.translate(texto[:4999])
        return resultado[0].upper() + resultado[1:] if resultado else ''
    except Exception:
        return texto


def obtener_ids_por_categoria(categoria_en):
    url = f'https://www.themealdb.com/api/json/v1/1/filter.php?c={categoria_en}'
    res = requests.get(url, timeout=10)
    meals = res.json().get('meals') or []
    return [m['idMeal'] for m in meals[:5]]


def obtener_detalle(meal_id):
    url = f'https://www.themealdb.com/api/json/v1/1/lookup.php?i={meal_id}'
    res = requests.get(url, timeout=10)
    meals = res.json().get('meals') or []
    return meals[0] if meals else None


class Command(BaseCommand):
    help = 'Importa recetas desde TheMealDB y las traduce al español'

    def handle(self, *args, **kwargs):
        categorias_api = list(CATEGORIA_MAP.keys())
        total = 0

        for cat_en in categorias_api:
            cat_es = CATEGORIA_MAP[cat_en]
            self.stdout.write(f'Importando categoría: {cat_en} → {cat_es}')

            ids = obtener_ids_por_categoria(cat_en)

            for meal_id in ids:
                meal = obtener_detalle(meal_id)
                if not meal:
                    continue

                titulo_en = meal.get('strMeal', '')
                if Receta.objects.filter(titulo=titulo_en).exists():
                    self.stdout.write(f'  Ya existe: {titulo_en}')
                    continue

                titulo = traducir(titulo_en)
                descripcion = traducir(meal.get('strInstructions', '')[:500])
                imagen_url = meal.get('strMealThumb', '')

                tiempo_min, tiempo_max = TIEMPO_POR_CATEGORIA[cat_es]
                cal_min, cal_max = CALORIAS_POR_CATEGORIA[cat_es]
                tiempo_prep = random.randint(tiempo_min, tiempo_max)
                calorias = random.randint(cal_min, cal_max)

                receta = Receta.objects.create(
                    titulo=titulo,
                    descripcion=descripcion,
                    tiempo_prep=tiempo_prep,
                    calorias=calorias,
                    categoria=cat_es,
                    imagen_url=imagen_url,
                )

                # Pasos: dividimos las instrucciones por líneas o puntos
                instrucciones = meal.get('strInstructions', '')
                pasos_raw = [p.strip() for p in instrucciones.split('\n') if p.strip()]
                if len(pasos_raw) <= 2:
                    pasos_raw = [p.strip() for p in instrucciones.split('.') if len(p.strip()) > 10]

                for i, paso_en in enumerate(pasos_raw[:8], start=1):
                    paso_es = traducir(paso_en)
                    if not paso_es:
                        continue
                    PasoReceta.objects.create(receta=receta, numero=i, descripcion=paso_es)

                # Ingredientes
                for j in range(1, 21):
                    nombre_en = meal.get(f'strIngredient{j}', '')
                    cantidad_str = meal.get(f'strMeasure{j}', '').strip()
                    if not nombre_en or not nombre_en.strip():
                        break

                    nombre_es = traducir(nombre_en.strip())
                    ingrediente, _ = Ingrediente.objects.get_or_create(
                        nombre=nombre_es,
                        defaults={'unidad_medida': 'al gusto'}
                    )

                    try:
                        cantidad = float(''.join(c for c in cantidad_str if c.isdigit() or c == '.') or '1')
                    except ValueError:
                        cantidad = 1.0

                    RecetaIngrediente.objects.create(
                        receta=receta,
                        ingrediente=ingrediente,
                        cantidad=cantidad,
                    )

                total += 1
                self.stdout.write(f'  ✓ {titulo}')

        self.stdout.write(self.style.SUCCESS(f'\nImportadas {total} recetas correctamente.'))
