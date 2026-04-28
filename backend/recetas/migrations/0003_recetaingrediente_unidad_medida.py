from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('recetas', '0002_add_missing_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='recetaingrediente',
            name='unidad_medida',
            field=models.CharField(max_length=100, default=''),
        ),
    ]
