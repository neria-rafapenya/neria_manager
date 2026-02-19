# neria_manager
Neria Manager


## arranque maven en localhost
backend-java/scripts/run-local.sh

## OCR (Tesseract)

### Instalación

**macOS (Homebrew)**
```bash
brew install tesseract
brew install tesseract-lang
```

**Ubuntu / Debian**
```bash
sudo apt update
sudo apt install -y tesseract-ocr tesseract-ocr-spa tesseract-ocr-cat tesseract-ocr-eng
```

**Fedora / RHEL**
```bash
sudo dnf install -y tesseract tesseract-langpack-spa tesseract-langpack-cat tesseract-langpack-eng
```

**Arch Linux**
```bash
sudo pacman -S tesseract tesseract-data-spa tesseract-data-cat tesseract-data-eng
```

### Variables de entorno

Ejemplos (ajusta la ruta según el host):
```
TESSDATA_PREFIX=/opt/homebrew/share/tessdata
TESSERACT_LANG=spa+cat+eng
```

Rutas típicas de `tessdata`:
- Apple Silicon: `/opt/homebrew/share/tessdata`
- Intel macOS: `/usr/local/share/tessdata`
- Linux (depende de distro): `/usr/share/tesseract-ocr/4.00/tessdata` o `/usr/share/tesseract-ocr/5/tessdata`

### Verificación rápida
```bash
tesseract --list-langs
```

### Troubleshooting
- **Error de idiomas**: verifica que `tesseract --list-langs` incluya `spa`, `cat`, `eng`.
- **No encuentra tessdata**: revisa `TESSDATA_PREFIX` y que la ruta contenga los `.traineddata`.
- **OCR vacío en PDFs**: algunos PDFs escaneados requieren mejor DPI; se usa `OCR_DPI=200` por defecto en backend. Si necesitas ajustar, dímelo y lo hago configurable.

## Suscripciones (Stripe)

Requisitos para habilitar cobros recurrentes con Stripe Billing.

### Variables de entorno
Define estas variables en el backend (Railway / local):
```
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=https://tu-frontend/billing/success?session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=https://tu-frontend/billing/cancel
STRIPE_PORTAL_RETURN_URL=https://tu-frontend/billing
BILLING_TAX_RATE=0.21
```

Notas:
- No hagas commit de claves en el repositorio.
- Usa claves `test` en desarrollo y `live` en producción.

## Emails (SMTP)

Para enviar emails transaccionales (por ejemplo, links de pago):
```
SMTP_HOST=smtp.tu-proveedor.com
SMTP_PORT=587
SMTP_USERNAME=usuario
SMTP_PASSWORD=clave
SMTP_FROM=billing@tu-dominio.com
SMTP_USE_TLS=true
SMTP_USE_SSL=false
```
