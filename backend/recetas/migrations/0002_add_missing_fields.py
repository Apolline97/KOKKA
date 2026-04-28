from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('recetas', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Añadir campos que faltan en Receta
        migrations.AddField(
            model_name='receta',
            name='categoria',
            field=models.CharField(
                choices=[
                    ('Desayuno', 'Desayuno'),
                    ('Almuerzo', 'Almuerzo'),
                    ('Cena', 'Cena'),
                    ('Merienda', 'Merienda'),
                    ('Postre', 'Postre'),
                ],
                default='Almuerzo',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='receta',
            name='imagen',
            field=models.ImageField(blank=True, null=True, upload_to='recetas/'),
        ),
        migrations.AddField(
            model_name='receta',
            name='creador',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='recetas_creadas',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Crear modelo PasoReceta
        migrations.CreateModel(
            name='PasoReceta',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('numero', models.PositiveIntegerField()),
                ('descripcion', models.TextField()),
                ('receta', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='pasos',
                    to='recetas.receta',
                )),
            ],
            options={
                'ordering': ['numero'],
            },
        ),
        # Crear modelo Favorito
        migrations.CreateModel(
            name='Favorito',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('receta', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    to='recetas.receta',
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'unique_together': {('user', 'receta')},
            },
        ),
    ]
