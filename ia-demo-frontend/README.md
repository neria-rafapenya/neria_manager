# IA Demo Frontend

App unica para navegar entre demos de servicios. Cada demo define su configuracion y la app carga el chatbot o un iframe segun el modo.

## Como funciona

- El listado se carga desde `public/demos.json` por defecto.
- Puedes sobreescribirlo con `VITE_DEMO_CONFIG_URL` (URL remota) o `VITE_DEMO_CONFIG` (JSON embebido).
- Al abrir una demo, se aplica la configuracion en runtime y se renderiza:
  - `mode = chat`: chatbot
  - `mode = email`: placeholder (o usa `embedUrl`)
  - `mode = surveys` o `embed`: iframe

## Campos de una demo

Ejemplo minimo:

```json
{
  "code": "chat-ocr",
  "name": "Chat OCR",
  "mode": "chat",
  "apiBaseUrl": "https://backend.example.com",
  "apiKey": "REEMPLAZA_API_KEY",
  "chatAuthMode": "none"
}
```

Campos soportados:
- `code` (string) identificador interno y URL.
- `name` (string) titulo visible.
- `description` (string) texto opcional.
- `mode` (`chat | email | surveys | embed`).
- `apiBaseUrl` (string) base URL del backend.
- `apiKey` (string) API key del servicio.
- `tenantId` (string) tenant para cabecera `x-tenant-id`.
- `serviceCode` (string) codigo del servicio.
- `serviceId` (string) id del servicio.
- `providerId` (string) proveedor.
- `model` (string) modelo.
- `chatEndpoint` (string) endpoint del chat (p.ej. `persisted`).
- `chatAuthMode` (`local | none`).
- `embedUrl` (string) URL para iframes.
- `chatbotOpened`, `chatbotRestricted`, `captchaEnabled`, `recaptchaSiteKey` (booleans/strings opcionales).

## Variables de entorno

- `VITE_DEMO_CONFIG_URL` URL remota con el JSON de demos.
- `VITE_DEMO_CONFIG` JSON embebido en una sola linea.
- `VITE_DEMO_CONFIG_PATH` ruta relativa (por defecto `/demos.json`).
- `VITE_API_BASE_URL` fallback si la demo no define `apiBaseUrl`.
- `VITE_API_KEY` fallback si la demo no define `apiKey`.
- `VITE_CHAT_AUTH_MODE` fallback si la demo no define `chatAuthMode`.

## Ejecutar en local

```bash
yarn install
yarn dev
```

## Build

```bash
yarn build
```


## Modo surveys

El modo `surveys` muestra una interfaz exclusiva con listado de encuestas y creacion publica (demo).
No necesita `embedUrl`; los enlaces publicos se generan de forma mock en la UI.
