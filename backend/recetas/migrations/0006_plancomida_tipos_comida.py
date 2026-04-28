from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('recetas', '0005_perfil_foto'),
    ]

    operations = [
        migrations.AlterField(
            model_name='plancomida',
            name='tipo_comida',
            field=models.CharField(
                choices=[
                    ('Desayuno', 'Desayuno'),
                    ('Almuerzo', 'Almuerzo'),
                    ('Merienda', 'Merienda'),
                    ('Cena', 'Cena'),
                ],
                max_length=20,
            ),
        ),
    ]
