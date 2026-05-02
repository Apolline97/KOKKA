from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('recetas', '0008_plancomida_unique_together'),
    ]

    operations = [
        migrations.AddField(
            model_name='receta',
            name='estado',
            field=models.CharField(
                choices=[('pendiente', 'Pendiente'), ('aprobada', 'Aprobada'), ('rechazada', 'Rechazada')],
                default='aprobada',
                max_length=20,
            ),
        ),
    ]
