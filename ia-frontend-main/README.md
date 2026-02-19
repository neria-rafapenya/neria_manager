# Chatbot

Este chatbot puede funcionar con o sin login.

- **Sin login:** las conversaciones **no se guardan ni persisten**.
- **Con login local:** las conversaciones se guardan en backend y se recuperan al volver.

---

## Modos de autenticación

### 1. Chat **sin login**

En el **frontend** (Vite/React), configura:

```
VITE_CHAT_AUTH_MODE=none
```

En este modo:
- No se muestra el formulario de login.
- No se almacena ningún token.
- Las conversaciones no se persisten en base de datos.

---

### 2. Chat **con login local**

En el **frontend**:

```
VITE_CHAT_AUTH_MODE=local
```

En el **backend (Manager)**, el modo debe coincidir:

```
CHAT_AUTH_MODE=local
# o, para desactivar login:
# CHAT_AUTH_MODE=none
```

> Es importante que `VITE_CHAT_AUTH_MODE` (frontend) y `CHAT_AUTH_MODE` (backend) estén alineados para que el flujo de autenticación funcione correctamente.

---

## Personalización del aspecto

Para configurar el aspecto visual del chatbot (anchura, altura, bordes, colores, etc.) hay que editar el archivo:

```
src/core/domain/constants/chatTheme.tsx
```

Desde este archivo se pueden ajustar, entre otros:

- Tamaño del panel (width, height).
- Border radius del contenedor.
- Colores del header.
- Colores de fondo y texto de las burbujas de:
  - Mensajes del usuario.
  - Mensajes del bot.
- Aspecto de la burbuja flotante (widget) y del logo/emoticono del header.

---

## Instalación y puesta en marcha

### 1. Requisitos

- Node.js LTS instalado.
- Gestor de paquetes `yarn`.
- Backend del Manager levantado en `http://localhost:3000` (o la URL que definamos).

### 2. Instalar dependencias (frontend)

```
yarn install
```

### 3. Configurar variables de entorno (frontend)

Crear un fichero `.env.local` (o el que usemos por entorno) en el proyecto frontend con, al menos:

```
VITE_API_MANAGER=http://localhost:3000
VITE_API_URL=http://localhost:3000
VITE_API_KEY=...
VITE_TENANT_ID=...
VITE_SERVICE_CODE=...
VITE_SERVICE_ID=...
VITE_PROVIDER_ID=...
VITE_MODEL=...
VITE_CHAT_ENDPOINT=persisted
VITE_CHAT_AUTH_MODE=local    # o none, según el caso
VITE_PORT=8620
```

Notas:
- `VITE_API_MANAGER` es la URL del backend del Manager (para login, conversaciones, etc.).
- `VITE_API_URL` es la URL base de la API del servicio del tenant (para mostrar endpoints concatenados).
- `VITE_API_KEY`, `VITE_TENANT_ID`, `VITE_SERVICE_CODE` y `VITE_SERVICE_ID` deben venir de la asignación de servicio en el Manager.
- El frontend consulta `/tenant/chat/auth/login`, `/chat/services` y `/chat/services/{serviceCode}/endpoints` usando `x-api-key`, `x-tenant-id` y el `x-chat-token` obtenido en login.

### 4. Levantar el frontend

```
yarn dev
```

Por defecto, la app se servirá en algo como:

```
http://localhost:8620
```

(según la configuración de Vite que tengamos).

### 5. Backend IMPORTANTE!

El servidor debe estar arrancado o levantado bien en localhost o bien en una API que se pueda llamar desde el `.env`

Este chatbot no funcionará si el backend no está levantado y funcionando en API REST


# Build para producción

## Uso en cualquier web / CMS (Drupal, WordPress, etc.)

El objetivo es que el cliente pueda incrustar el chatbot en **cualquier web** (Drupal, WordPress, site estático, etc.) simplemente añadiendo un `<script>`.

1. **Compilar el proyecto** para obtener el bundle:

   ```
   yarn build
   ```

   Esto generará un archivo principal, por ejemplo:

   ```
   dist/index.js
   ```

2. **Subir ese `dist/index.js`** al servidor donde se hospede la web (o a un CDN).  
   - Se puede mantener la ruta por defecto (`/dist/index.js`) o mover el archivo donde se quiera.
   - Lo importante es que sea accesible vía HTTP/HTTPS.

3. En la página donde se deba mostrar el chatbot (por ejemplo `index.html` del CMS o tema):

   ```
   <!-- Llama al bundle del chatbot -->
   <script src="/dist/index.js" defer></script>
   ```

   > Si se aloja en otra ruta, ajustar la URL. Por ejemplo:
   >
   > ```
   > <script src="https://cdn.midominio.com/chatbot/index.js" defer></script>
   > ```

4. El script se encargará de **inyectar el widget del chatbot** (burbuja en la esquina inferior derecha y panel de chat al abrirlo) sin que el integrador tenga que escribir más código.

En resumen:

- Para cargar el chatbot en **Drupal, WordPress o cualquier website**, basta con **exponer el `dist/index.js`** (o el nombre de bundle que se use) y **llamarlo desde el `index.html`** (o plantilla principal) con una etiqueta `<script>`. 
