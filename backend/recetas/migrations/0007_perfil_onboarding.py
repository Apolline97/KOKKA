from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('recetas', '0006_plancomida_tipos_comida'),
    ]

    operations = [
        migrations.AddField(
            model_name='perfil',
            name='tiempo_cocina',
            field=models.CharField(blank=True, default='', max_length=20),
        ),
        migrations.AddField(
            model_name='perfil',
            name='categoria_favorita',
            field=models.CharField(blank=True, default='', max_length=20),
        ),
        migrations.AddField(
            model_name='perfil',
            name='objetivo_calorias',
            field=models.CharField(blank=True, default='', max_length=20),
        ),
        migrations.AddField(
            model_name='perfil',
            name='onboarding_completado',
            field=models.BooleanField(default=False),
        ),
    ]
