from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('recetas', '0004_valoracion'),
    ]

    operations = [
        migrations.AddField(
            model_name='perfil',
            name='foto',
            field=models.ImageField(blank=True, null=True, upload_to='perfiles/'),
        ),
    ]
