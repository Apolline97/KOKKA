import os
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):

    def handle(self, *args, **kwargs):
        username = os.environ.get('SUPERUSER_USERNAME')
        email = os.environ.get('SUPERUSER_EMAIL', '')
        password = os.environ.get('SUPERUSER_PASSWORD')

        if not username or not password:
            self.stdout.write('SUPERUSER_USERNAME o SUPERUSER_PASSWORD no definidos. Saltando.')
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(f'Superusuario "{username}" ya existe. Saltando.')
            return

        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(f'Superusuario "{username}" creado correctamente.')
