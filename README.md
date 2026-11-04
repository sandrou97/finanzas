# Finanzas (PWA) · Fase 1

App web instalable: Inicio, Registro (gastos/ingresos/traspasos por ciclo de cobro) y Ajustes. Claro/oscuro automático.
Sin Firebase configurado funciona en **modo demo** (datos en tu navegador). Prueba local: `python3 -m http.server` y abre http://localhost:8000

## 1. Crear Firebase (5 min)
1. https://console.firebase.google.com → **Añadir proyecto** (sin Analytics).
2. **Compilación → Authentication → Comenzar → Google** → activar y guardar.
3. **Compilación → Firestore Database → Crear base de datos** (modo producción, región `eur3` o `europe-west`).
4. Pestaña **Reglas** → pega el contenido de `firestore.rules` → **Publicar**.
5. **Configuración del proyecto (⚙) → Tus apps → `</>` Web** → registra la app → copia el objeto `firebaseConfig`.
6. Pégalo en `firebase-config.js` (sustituye los PEGA_AQUI).

## 2. Subir a GitHub Pages
1. Crea un repo en GitHub (puede ser privado si tu plan permite Pages; si no, público: no hay secretos, la seguridad son las reglas).
2. Sube todos los archivos de esta carpeta a la raíz del repo.
3. **Settings → Pages → Deploy from a branch → main / (root)**. Tu URL: `https://TU_USUARIO.github.io/NOMBRE_REPO/`

## 3. Autorizar el dominio
Firebase → Authentication → **Settings → Dominios autorizados → Añadir** `TU_USUARIO.github.io`.

## 4. Instalar en el móvil
- Android (Chrome): menú ⋮ → **Instalar aplicación**.
- iPhone (Safari): Compartir → **Añadir a pantalla de inicio**.

Entra con tu cuenta de Google: tus datos quedan en `users/<tu uid>/` y solo tú puedes leerlos.

## Notas
- Si cambias archivos, sube la versión en `sw.js` (`fin-v1` → `fin-v2`) para que el móvil se actualice.
- Importes en céntimos; el ciclo empieza el día de cobro (Ajustes).
