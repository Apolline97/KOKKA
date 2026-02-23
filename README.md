# 🥑 KOKKA - Backend

¡Hola Lucas! Aquí tienes las instrucciones para levantar el servidor local del Backend (API REST) en tu ordenador y poder conectar la aplicación de React Native.

## 🛠️ 1. Instalación y Preparación (Solo la primera vez)

Antes de empezar, asegúrate de tener **Python** instalado en tu ordenador.

**Paso 1: Abre la terminal y entra a la carpeta del backend**
\`\`\`bash
cd backend
\`\`\`

**Paso 2: Crea un entorno virtual**
Esto creará una burbuja segura para instalar las dependencias sin afectar a tu ordenador.
\`\`\`bash
python -m venv venv
\`\`\`

**Paso 3: Activa el entorno virtual**
Siempre debes activarlo antes de trabajar. Sabrás que está activo porque verás `(venv)` al principio de tu línea de comandos.
* **En Windows (PowerShell/CMD):**
  \`\`\`bash
  .\venv\Scripts\activate
  \`\`\`
* **En Mac/Linux:**
  \`\`\`bash
  source venv/bin/activate
  \`\`\`

**Paso 4: Instalar las dependencias**
Instala Django, Django REST Framework y todo lo necesario con este comando:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

**Paso 5: Sincronizar la base de datos**
Asegúrate de que las tablas de la base de datos (SQLite) están creadas y actualizadas:
\`\`\`bash
python manage.py migrate
\`\`\`

---

## 🚀 2. Iniciar el Servidor (Tu día a día)

Cada vez que vayas a programar en el Frontend y necesites que la API funcione, sigue estos dos sencillos pasos:

1. Asegúrate de estar en la carpeta `backend` y de tener el entorno virtual activado (`.\venv\Scripts\activate`).
2. Enciende el motor con este comando:
\`\`\`bash
python manage.py runserver
\`\`\`

¡Listo! Si no ves errores en rojo, el servidor está funcionando. No cierres esa terminal mientras estés programando.

## 🔗 3. Enlaces Útiles (Endpoints)

Una vez que el servidor esté corriendo, puedes usar estos enlaces en tu navegador o en el código de React Native para hacer las peticiones:

* **Raíz de la API:** [http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/)
* **Lista de Recetas (GET):** [http://127.0.0.1:8000/api/recetas/](http://127.0.0.1:8000/api/recetas/)
* **Recetas Recomendadas (RF-06):** [http://127.0.0.1:8000/api/recetas/recomendadas/](http://127.0.0.1:8000/api/recetas/recomendadas/)
* **Panel de Administrador:** [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/) *(Pídele las credenciales a Alberto si necesitas añadir datos de prueba).*
