# Backend Sandbox

Backend de pruebas para exponer endpoints de servicios (sandbox) conectados a la misma base de datos que `backend-java`.

## Autenticacion

El sandbox exige autenticacion en todas las rutas (salvo que se cambie el guard). Hay tres formas soportadas:

### 1) API key de servicio (recomendada)

Envia el header:

```
x-api-key: <API_KEY_DEL_SERVICIO>
```

Esta key no caduca y es adecuada para llamadas server-to-server.

### 2) JWT de chat (cookie `ia_chat_access_token`)

Si quieres usar el token de chat, debes configurar en Railway/local:

```
CHAT_JWT_SECRET=<mismo valor que en backend-java>
```

Luego puedes enviar:

```
Authorization: Bearer <ia_chat_access_token>
```

o dejar la cookie `ia_chat_access_token` si llamas desde navegador.

### 3) Header personalizado (ej. `my_token`)

Si un cliente utiliza un header propio, puedes declararlo con:

```
AUTH_TOKEN_HEADERS=my_token
```

Y entonces enviar:

```
my_token: <token>
```

Si el token viene en cookies con nombre distinto, puedes declarar:

```
AUTH_TOKEN_COOKIES=my_token
```

---

## Variables de entorno minimas

```
AUTH_JWT_SECRET=...          # secreto principal (auth)
CHAT_JWT_SECRET=...          # opcional, para validar ia_chat_access_token
DB_HOST=...
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=provider_manager
```

---

## Debug de llamadas a endpoints (backend-java)

Para ver en consola del navegador si el backend llamo a un endpoint y con que resultado:

```
CHAT_ENDPOINT_DEBUG=true
```

Con esto, el backend emite eventos SSE `debug` y el frontend los imprime en consola:

```
[ChatRepository] endpoint:debug [...]
```

