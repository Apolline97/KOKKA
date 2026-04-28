import re
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

UNIDADES_MAP = {
    # cucharadas
    'tablespoon': 'cucharada', 'tablespoons': 'cucharadas',
    'tbsp': 'cucharada', 'tblsp': 'cucharada', 'tbs': 'cucharada',
    # cucharaditas
    'teaspoon': 'cucharadita', 'teaspoons': 'cucharaditas',
    'tsp': 'cucharadita',
    # tazas
    'cup': 'taza', 'cups': 'tazas',
    # peso
    'g': 'g', 'gr': 'g', 'gram': 'g', 'grams': 'g',
    'kg': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
    'oz': 'oz', 'ounce': 'onza', 'ounces': 'onzas',
    'lb': 'libra', 'lbs': 'libras', 'pound': 'libra', 'pounds': 'libras',
    # volumen
    'ml': 'ml', 'milliliter': 'ml', 'milliliters': 'ml', 'millilitre': 'ml',
    'l': 'l', 'liter': 'l', 'liters': 'l', 'litre': 'l',
    'fl oz': 'fl oz',
    # pequeñas cantidades
    'pinch': 'pizca', 'pinches': 'pizcas',
    'dash': 'chorrito', 'splash': 'chorrito', 'drizzle': 'chorrito',
    # unidades físicas
    'piece': 'pieza', 'pieces': 'piezas',
    'slice': 'rebanada', 'slices': 'rebanadas',
    'can': 'lata', 'cans': 'latas',
    'tin': 'lata', 'tins': 'latas',
    'packet': 'paquete', 'packets': 'paquetes',
    'bag': 'bolsa', 'bags': 'bolsas',
    'jar': 'tarro', 'jars': 'tarros',
    'bottle': 'botella', 'bottles': 'botellas',
    'bunch': 'manojo', 'bunches': 'manojos',
    'handful': 'puñado', 'handfuls': 'puñados',
    'sprig': 'ramita', 'sprigs': 'ramitas',
    'stalk': 'tallo', 'stalks': 'tallos',
    'leaf': 'hoja', 'leaves': 'hojas',
    'head': 'cabeza', 'heads': 'cabezas',
    'clove': 'diente', 'cloves': 'dientes',
    'knob': 'nuez', 'scoop': 'cucharón', 'scoops': 'cucharones',
    'fillet': 'filete', 'fillets': 'filetes',
    'rasher': 'loncha', 'rashers': 'lonchas',
    'strip': 'tira', 'strips': 'tiras',
    'block': 'bloque', 'stick': 'barra', 'sticks': 'barras',
    'sheet': 'hoja', 'sheets': 'hojas',
    # tamaños
    'large': 'grande', 'medium': 'mediano', 'small': 'pequeño',
    # preparación (cuando aparecen como unidad)
    'minced': 'picado', 'chopped': 'picado', 'diced': 'en dados',
    'grated': 'rallado', 'sliced': 'en lonchas', 'crushed': 'machacado',
    'separated': 'separado', 'beaten': 'batido', 'softened': 'ablandado',
    'melted': 'derretido', 'cooked': 'cocido', 'coarsely': 'grueso',
    'finely': 'fino', 'freshly': 'recién', 'ground': 'molido',
    'halved': 'partido', 'quartered': 'en cuartos', 'whole': 'entero',
    'frozen': 'congelado', 'fresh': 'fresco', 'dried': 'seco',
    # para servir
    'to serve': 'para servir', 'to taste': 'al gusto',
    'as needed': 'al gusto', 'as required': 'al gusto',
    'optional': 'opcional', 'for garnish': 'para decorar',
    'for frying': 'para freír', 'for greasing': 'para engrasar',
}


def traducir_unidad(unidad_en):
    if not unidad_en:
        return 'al gusto'
    lower = unidad_en.lower().strip()
    if lower in UNIDADES_MAP:
        return UNIDADES_MAP[lower]
    # buscar coincidencia parcial por palabra clave
    for clave, valor in UNIDADES_MAP.items():
        if clave in lower:
            return valor
    return unidad_en  # dejar en inglés si no se encuentra


PASO_CABECERA = re.compile(
    r'^(step\s*\d+|paso\s*\d+|etapa\s*\d+|\d+\.?\s*)$',
    re.IGNORECASE
)


def traducir(texto):
    if not texto:
        return ''
    try:
        resultado = translator.translate(texto[:4999])
        return resultado[0].upper() + resultado[1:] if resultado else ''
    except Exception:
        return texto


def parsear_medida(cantidad_str):
    """Extrae (cantidad, unidad_es) de strings como '200 ml', '1 tsp', '1/2 cup'."""
    s = cantidad_str.strip()
    if not s or s.lower() in ('to taste', 'as needed', 'al gusto'):
        return 1.0, 'al gusto'

    # Fracciones como "1/2" o "1 1/2"
    fraccion = re.match(r'^(\d+)\s+(\d+)/(\d+)', s)
    if fraccion:
        entero, num, den = int(fraccion.group(1)), int(fraccion.group(2)), int(fraccion.group(3))
        cantidad = entero + num / den
        unidad_en = s[fraccion.end():].strip()
        return min(cantidad, 9999.99), traducir_unidad(unidad_en)

    solo_fraccion = re.match(r'^(\d+)/(\d+)', s)
    if solo_fraccion:
        num, den = int(solo_fraccion.group(1)), int(solo_fraccion.group(2))
        unidad_en = s[solo_fraccion.end():].strip()
        return min(num / den, 9999.99), traducir_unidad(unidad_en)

    numero = re.match(r'^(\d+\.?\d*)', s)
    if numero:
        cantidad = min(float(numero.group(1)), 9999.99)
        unidad_en = s[numero.end():].strip()
        return cantidad, traducir_unidad(unidad_en)

    return 1.0, traducir_unidad(s)


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
        # Borrar recetas importadas previamente (sin creador) para evitar duplicados
        eliminadas = Receta.objects.filter(creador__isnull=True).count()
        Receta.objects.filter(creador__isnull=True).delete()
        if eliminadas:
            self.stdout.write(f'Eliminadas {eliminadas} recetas antiguas.')

        # Borrar también las de kokka_admin (recetas de prueba)
        Receta.objects.filter(creador__username='kokka_admin').delete()

        categorias_api = list(CATEGORIA_MAP.keys())
        ids_vistos = set()
        total = 0

        for cat_en in categorias_api:
            cat_es = CATEGORIA_MAP[cat_en]
            self.stdout.write(f'Importando categoría: {cat_en} → {cat_es}')

            ids = obtener_ids_por_categoria(cat_en)

            for meal_id in ids:
                if meal_id in ids_vistos:
                    continue
                ids_vistos.add(meal_id)

                meal = obtener_detalle(meal_id)
                if not meal:
                    continue

                titulo_en = meal.get('strMeal', '')
                titulo = traducir(titulo_en)
                area_en = meal.get('strArea', '')
                area_es = traducir(area_en) if area_en and area_en != 'Unknown' else ''
                if area_es:
                    descripcion = f"Receta tradicional de cocina {area_es.lower()}, categoría {cat_es.lower()}."
                else:
                    descripcion = f"Receta de {cat_es.lower()}."
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

                # Pasos: filtrar cabeceras vacías como "STEP 1", "Paso 2"
                instrucciones = meal.get('strInstructions', '')
                pasos_raw = [p.strip() for p in instrucciones.split('\n') if p.strip()]
                if len(pasos_raw) <= 2:
                    pasos_raw = [p.strip() for p in instrucciones.split('.') if len(p.strip()) > 10]

                numero = 1
                for paso_en in pasos_raw[:10]:
                    if PASO_CABECERA.match(paso_en.strip()):
                        continue
                    paso_es = traducir(paso_en)
                    if not paso_es or len(paso_es) < 5:
                        continue
                    PasoReceta.objects.create(receta=receta, numero=numero, descripcion=paso_es)
                    numero += 1

                # Ingredientes: extraer cantidad y unidad correctamente
                for j in range(1, 21):
                    nombre_en = meal.get(f'strIngredient{j}', '')
                    cantidad_str = meal.get(f'strMeasure{j}', '').strip()
                    if not nombre_en or not nombre_en.strip():
                        break

                    nombre_es = traducir(nombre_en.strip())
                    cantidad, unidad = parsear_medida(cantidad_str)

                    ingrediente, creado = Ingrediente.objects.get_or_create(
                        nombre=nombre_es,
                        defaults={'unidad_medida': unidad}
                    )
                    if not creado and ingrediente.unidad_medida == 'al gusto' and unidad != 'al gusto':
                        ingrediente.unidad_medida = unidad
                        ingrediente.save()

                    RecetaIngrediente.objects.create(
                        receta=receta,
                        ingrediente=ingrediente,
                        cantidad=cantidad,
                    )

                total += 1
                self.stdout.write(f'  ✓ {titulo}')

        self.stdout.write(self.style.SUCCESS(f'\nImportadas {total} recetas correctamente.'))
