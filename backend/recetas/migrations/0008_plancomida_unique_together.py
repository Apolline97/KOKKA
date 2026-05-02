from django.conf import settings
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('recetas', '0007_perfil_onboarding'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='plancomida',
            unique_together={('user', 'fecha', 'tipo_comida')},
        ),
    ]
