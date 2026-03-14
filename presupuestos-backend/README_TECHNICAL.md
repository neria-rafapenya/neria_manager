
Lo plantearemos como **SaaS multi-tenant de generación automática de presupuestos con IA**.

Stack:

* **Backend:** Java Spring Boot
* **Frontend:** React + Vite + TypeScript
* **DB:** MySQL
* **IA:** OpenAI (usaremos -env para definir credenciales)
* **API:** **REST** 
* **Arquitectura:** SaaS multi-tenant, hexagonal para frontend

---

# 1. Visión del producto

Producto:

**AI Quote Automation Platform**

Permite a empresas automatizar la generación de presupuestos desde:

* email
* formularios web
* chat

Funciona para múltiples sectores:

* imprentas
* talleres mecánicos
* servicios domésticos
* carpintería
* reformas
* etc.

---

# 2. Arquitectura general

Arquitectura de alto nivel:

```
                +----------------------+
                |   React Frontend     |
                |  (Backoffice + UI)   |
                +----------+-----------+
                           |
                           |
                       REST API
                           |
                           v
+------------------------------------------------+
|                Spring Boot API                  |
|                                                |
|  Modules:                                      |
|                                                |
|  - Auth Module                                 |
|  - Tenant Management                           |
|  - Products / Pricing                          |
|  - Quote Engine                                |
|  - AI Parsing Service                          |
|  - Email Processing                            |
|  - CRM / Leads                                 |
+------------------------------------------------+
                           |
                           v
                    MySQL Database
                           |
                           v
                        OpenAI
```

---

# 3. REST vs GraphQL

Decisión:

**REST API**

Motivos:

1️⃣ Más simple para MVP
2️⃣ Más estándar en Spring Boot
3️⃣ Mejor para SaaS B2B CRUD intensivo
4️⃣ GraphQL no aporta ventaja clara aquí

---

# 4. Multi-tenant (clave)

Cada empresa tiene su configuración.

Ejemplo:

```
Tenant 1 → imprenta
Tenant 2 → taller
Tenant 3 → fontanero
```

Cada tenant define:

* productos
* precios
* variables
* plantillas de email

---

# 5. Modelo de datos (MySQL)

## 5.1 Tenants

```
tenants
```

| campo      | tipo     |
| ---------- | -------- |
| id         | UUID     |
| name       | varchar  |
| sector     | varchar  |
| created_at | datetime |
| active     | boolean  |

---

## 5.2 Users

Usuarios del sistema.

```
users
```

| campo         | tipo                |
| ------------- | ------------------- |
| id            | UUID                |
| tenant_id     | UUID                |
| email         | varchar             |
| password_hash | varchar             |
| role          | enum (ADMIN, STAFF) |
| created_at    | datetime            |

---

## 5.3 Customers (clientes finales)

Opcionalmente pueden registrarse.

```
customers
```

| campo      | tipo     |
| ---------- | -------- |
| id         | UUID     |
| tenant_id  | UUID     |
| email      | varchar  |
| name       | varchar  |
| phone      | varchar  |
| created_at | datetime |

---

# 6. Productos y precios

## products

```
products
```

| campo        | tipo    |
| ------------ | ------- |
| id           | UUID    |
| tenant_id    | UUID    |
| name         | varchar |
| description  | text    |
| base_price   | decimal |
| pricing_type | enum    |

pricing_type puede ser:

```
FIXED
UNIT
FORMULA
```

---

## product_options

Opciones configurables.

Ejemplo imprenta:

```
tamaño
papel
color
```

```
product_options
```

| campo      | tipo    |
| ---------- | ------- |
| id         | UUID    |
| product_id | UUID    |
| name       | varchar |
| type       | enum    |

types:

```
SELECT
NUMBER
BOOLEAN
```

---

## option_values

```
option_values
```

| campo          | tipo    |
| -------------- | ------- |
| id             | UUID    |
| option_id      | UUID    |
| value          | varchar |
| price_modifier | decimal |

Ejemplo:

```
A5 → +0
A4 → +0.10
```

---

# 7. Quotes (presupuestos)

## quotes

```
quotes
```

| campo       | tipo     |
| ----------- | -------- |
| id          | UUID     |
| tenant_id   | UUID     |
| customer_id | UUID     |
| status      | enum     |
| total_price | decimal  |
| created_at  | datetime |

status:

```
DRAFT
SENT
ACCEPTED
REJECTED
```

---

## quote_items

```
quote_items
```

| campo      | tipo    |
| ---------- | ------- |
| id         | UUID    |
| quote_id   | UUID    |
| product_id | UUID    |
| quantity   | int     |
| unit_price | decimal |
| total      | decimal |

---

## quote_item_options

```
quote_item_options
```

| campo          | tipo    |
| -------------- | ------- |
| id             | UUID    |
| quote_item_id  | UUID    |
| option_id      | UUID    |
| value          | varchar |
| price_modifier | decimal |

---

# 8. AI Parsing

Tabla para logs de interpretación.

```
ai_requests
```

| campo       | tipo     |
| ----------- | -------- |
| id          | UUID     |
| tenant_id   | UUID     |
| input_text  | text     |
| parsed_json | json     |
| confidence  | float    |
| created_at  | datetime |

---

# 9. Emails

```
emails
```

| campo          | tipo     |
| -------------- | -------- |
| id             | UUID     |
| tenant_id      | UUID     |
| customer_email | varchar  |
| subject        | varchar  |
| body           | text     |
| processed      | boolean  |
| created_at     | datetime |

---

# 10. Endpoints REST

## Auth

```
POST /auth/login
POST /auth/register
POST /auth/logout
```

---

## Tenants

```
GET /tenant
PUT /tenant/settings
```

---

## Products

```
GET /products
POST /products
PUT /products/{id}
DELETE /products/{id}
```

---

## Product Options

```
GET /products/{id}/options
POST /products/{id}/options
```

---

## Quotes

```
GET /quotes
POST /quotes
GET /quotes/{id}
PUT /quotes/{id}
```

---

## Quote calculation

```
POST /quote/calculate
```

Body:

```
{
 productId,
 quantity,
 options
}
```

Respuesta:

```
{
 totalPrice,
 breakdown
}
```

---

# 11. AI Parsing Endpoint

```
POST /ai/parse-request
```

Input:

```
{
 text: "Necesito 2000 flyers A5..."
}
```

Output:

```
{
 product: "flyers",
 quantity: 2000,
 options: {
   size: "A5",
   paper: "135g"
 }
}
```

---

# 12. Email automation

Servicio:

```
EmailWatcherService
```

Flujo:

```
Email recibido
      ↓
guardar email
      ↓
OpenAI parse
      ↓
crear quote
      ↓
generar respuesta
      ↓
enviar email
```

---

# 13. Backoffice (React)

Pantallas principales.

### Dashboard

* leads
* presupuestos
* tasa conversión

---

### Products

CRUD de productos.

---

### Pricing

configuración de:

* base price
* modifiers
* formulas

---

### Quotes

Listado.

```
DRAFT
SENT
ACCEPTED
```

---

### Email templates

plantillas configurables.

---

# 14. Frontend arquitectura

```
src
 ├ api
 ├ pages
 ├ components
 ├ hooks
 ├ contexts
 ├ services
 └ types
```

---

# 15. Seguridad

* JWT authentication
* tenant isolation
* rate limiting
* email validation

---

# 16. OpenAI integration

Prompt ejemplo:

```
Extract structured quote parameters.

Products available:
- flyers
- posters
- business cards

Return JSON only.
```

---

# 17. Motor de precios

Clase central:

```
QuotePricingEngine
```

Responsabilidades:

* aplicar modifiers
* validar opciones
* calcular total

---

# 18. MVP roadmap

### fase 1

* auth
* tenants
* products
* quotes manuales

---

### fase 2

* AI parsing
* email automation

---

### fase 3

* CRM
* analytics
* multi sector templates

---

# 19. Infraestructura

Para MVP:

```
Backend → Railway / AWS
DB → MySQL
Frontend → Vercel
```

---

# 20. Escalabilidad

Separar servicios en futuro:

```
AI service
Quote service
Email service
```

---

CREA DTOs para JAVA bckend y interfaces/models apara frontend, es muy importante que lo hagas.









---

# 1. ESQUEMA SQL COMPLETO ( RECUERDA REBAUTIZAR LAS TABLAS CON presupuestos_)

## 1.1 Tenants

```sql
CREATE TABLE tenants (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    created_at DATETIME NOT NULL,
    active BOOLEAN DEFAULT TRUE
);
```

---

## 1.2 Users

```sql
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role ENUM('ADMIN','STAFF'),
    created_at DATETIME NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

---

## 1.3 Customers

```sql
CREATE TABLE customers (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at DATETIME NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

---

# 2. PRODUCTOS Y CONFIGURACIÓN

## 2.1 Products

```sql
CREATE TABLE products (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    pricing_type ENUM('FIXED','UNIT','FORMULA'),
    base_price DECIMAL(10,2),
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

---

## 2.2 Product Options

Ejemplo:

* tamaño
* papel
* color

```sql
CREATE TABLE product_options (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    option_type ENUM('SELECT','NUMBER','BOOLEAN'),
    required BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

---

## 2.3 Option Values

```sql
CREATE TABLE option_values (
    id CHAR(36) PRIMARY KEY,
    option_id CHAR(36) NOT NULL,
    value VARCHAR(255),
    price_modifier DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (option_id) REFERENCES product_options(id)
);
```

Ejemplo:

| option | value | modifier |
| ------ | ----- | -------- |
| size   | A4    | +0.10    |
| size   | A5    | 0        |

---

# 3. PRESUPUESTOS

## 3.1 Quotes

```sql
CREATE TABLE quotes (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    customer_id CHAR(36),
    status ENUM('DRAFT','SENT','ACCEPTED','REJECTED'),
    total_price DECIMAL(10,2),
    created_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

---

## 3.2 Quote Items

```sql
CREATE TABLE quote_items (
    id CHAR(36) PRIMARY KEY,
    quote_id CHAR(36) NOT NULL,
    product_id CHAR(36),
    quantity INT,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    FOREIGN KEY (quote_id) REFERENCES quotes(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

---

## 3.3 Quote Item Options

```sql
CREATE TABLE quote_item_options (
    id CHAR(36) PRIMARY KEY,
    quote_item_id CHAR(36),
    option_id CHAR(36),
    value VARCHAR(255),
    price_modifier DECIMAL(10,2),
    FOREIGN KEY (quote_item_id) REFERENCES quote_items(id),
    FOREIGN KEY (option_id) REFERENCES product_options(id)
);
```

---

# 4. EMAIL Y AI

## Emails recibidos

```sql
CREATE TABLE emails (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36),
    customer_email VARCHAR(255),
    subject VARCHAR(255),
    body TEXT,
    processed BOOLEAN DEFAULT FALSE,
    created_at DATETIME
);
```

---

## Logs de AI

```sql
CREATE TABLE ai_requests (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36),
    input_text TEXT,
    parsed_json JSON,
    confidence FLOAT,
    created_at DATETIME
);
```

---

# 5. DIAGRAMA ER

Representación conceptual.

```
TENANTS
   │
   ├── USERS
   │
   ├── CUSTOMERS
   │
   ├── PRODUCTS
   │      │
   │      ├── PRODUCT_OPTIONS
   │      │        │
   │      │        └── OPTION_VALUES
   │
   ├── QUOTES
   │      │
   │      ├── QUOTE_ITEMS
   │      │        │
   │      │        └── QUOTE_ITEM_OPTIONS
   │
   └── EMAILS

AI_REQUESTS
```

---

# 6. ESTRUCTURA DE PAQUETES SPRING BOOT

Arquitectura recomendada: **Hexagonal / Clean**

```
com.company.quoteai
│
├── config
│     ├── security
│     ├── openai
│
├── controller
│     ├── auth
│     ├── products
│     ├── quotes
│     ├── ai
│     ├── email
│
├── service
│     ├── tenant
│     ├── product
│     ├── quote
│     ├── pricing
│     ├── ai
│     ├── email
│
├── repository
│     ├── tenant
│     ├── product
│     ├── quote
│
├── model
│     ├── entity
│     ├── dto
│
├── pricing
│     ├── engine
│     ├── strategies
│
├── ai
│     ├── parser
│     ├── prompts
│
└── util
```

---

# 7. ARQUITECTURA DEL MOTOR DE PRECIOS

Esta es **la pieza crítica del sistema**.

Debe ser:

* determinística
* extensible
* configurable

---

## Flujo

```
AI parse
     ↓
quote request DTO
     ↓
pricing engine
     ↓
price breakdown
     ↓
quote response
```

---

# 8. Pricing Engine

Clase central:

```java
QuotePricingEngine
```

Responsabilidades:

* validar opciones
* calcular precio
* aplicar modifiers

---

## Strategy Pattern

Cada tipo de pricing usa estrategia distinta.

```
PricingStrategy
   │
   ├── FixedPricingStrategy
   ├── UnitPricingStrategy
   └── FormulaPricingStrategy
```

---

## Interfaz

```java
public interface PricingStrategy {

    PriceResult calculate(
        Product product,
        int quantity,
        Map<String, String> options
    );

}
```

---

## Fixed pricing

```java
price = base_price
```

---

## Unit pricing

```java
price = base_price * quantity
```

---

## Formula pricing

Ejemplo imprenta:

```
price = base_price
      + (quantity * unit_price)
      + paper_modifier
      + color_modifier
```

---

# 9. PriceResult

```java
public class PriceResult {

    BigDecimal basePrice;

    BigDecimal modifiers;

    BigDecimal total;

}
```

---

# 10. Quote Calculation Flow

```
Request quote
     ↓
Load product
     ↓
Load options
     ↓
Apply pricing strategy
     ↓
Create quote entity
     ↓
Return breakdown
```

---

# 11. Ejemplo cálculo real

Pedido:

```
2000 flyers
A5
135g
2 caras
```

Motor:

```
base price = 10€
unit cost = 0.03€

2000 * 0.03 = 60€

color modifier = +10€
paper modifier = +5€

TOTAL = 85€
```

---

# 12. Validaciones del motor

El motor debe validar:

```
producto existe
opciones válidas
cantidad mínima
opciones obligatorias
```

---

# 13. Donde entra la IA

La IA **solo hace esto**:

```
email texto
    ↓
JSON estructurado
```

Ejemplo:

```
{
 product: flyers,
 quantity: 2000,
 options: {size:A5,paper:135g}
}
```

Luego:

```
pricing engine
```

---

# 14. Seguridad importante

Nunca permitir:

```
IA → generar precio
```

Siempre:

```
IA → interpretar pedido
backend → calcular precio
```

---

# 15. Escalabilidad futura

Separar servicios:

```
AI parsing service
pricing service
email ingestion service
```

---

# 16. MVP estimado

Con este diseño:

MVP funcional en:

```
6–8 semanas
```

Equipo:

```
1 backend
1 frontend
```

---

EN UNA SEGUNDA FASE HAREMOS:


A continuación tienes el **anexo técnico de producto** para completar el sistema de **automatización de presupuestos con IA**.
Está pensado para que un equipo pueda **diseñar el backoffice, implementar prompts robustos y desplegar el sistema de ingestión de emails en producción**.



# 1. DISEÑO DEL BACKOFFICE (UX + PANTALLAS)

El backoffice debe ser **muy simple**, porque el usuario típico será:

* imprenta
* taller
* empresa de servicios
* pyme

No son usuarios técnicos.

Objetivo UX:

```
Configurar productos → recibir solicitudes → enviar presupuestos
```

---

# 1.1 Layout general

Layout estándar SaaS.

```
┌──────────────────────────────────────────┐
│ Top bar                                  │
│ Tenant name | Notifications | Profile    │
├───────────────┬──────────────────────────┤
│ Sidebar       │ Main content             │
│               │                          │
│ Dashboard     │                          │
│ Quotes        │                          │
│ Leads         │                          │
│ Products      │                          │
│ Pricing       │                          │
│ AI Settings   │                          │
│ Email         │                          │
│ Settings      │                          │
└───────────────┴──────────────────────────┘
```

---

# 1.2 Dashboard

Objetivo: **visión rápida del negocio**

Componentes:

* total presupuestos hoy
* conversion rate
* leads nuevos
* presupuestos pendientes

Widgets:

```
Presupuestos hoy
Presupuestos enviados
Presupuestos aceptados
Ingresos estimados
```

Gráficas:

* presupuestos por día
* conversión a ventas

---

# 1.3 Quotes (Presupuestos)

Pantalla principal del sistema.

Tabla:

```
ID
cliente
producto
precio
estado
fecha
acciones
```

Estados:

```
DRAFT
SENT
ACCEPTED
REJECTED
```

Acciones:

* ver
* editar
* reenviar
* convertir a pedido

---

# 1.4 Vista detalle del presupuesto

Se muestra:

```
Cliente
Email
Producto
Opciones
Cantidad
Precio
```

Breakdown:

```
Base price
Modifiers
Total
```

Botones:

```
Enviar presupuesto
Editar
Descargar PDF
```

---

# 1.5 Leads

Lista de solicitudes recibidas.

```
Email
Producto detectado
Confidence IA
Estado
```

Estados:

```
NEW
PARSED
QUOTE_GENERATED
```

---

# 1.6 Products

CRUD completo.

Tabla:

```
Nombre
Sector
Tipo pricing
Activo
```

Formulario:

```
Nombre
Descripción
Pricing type
Precio base
```

---

# 1.7 Product Options

Ejemplo imprenta:

```
Tamaño
Papel
Color
```

Vista:

```
Option name
Type
Required
```

---

# 1.8 Option Values

Ejemplo:

```
A4 +0.10€
A5 +0€
A6 -0.05€
```

---

# 1.9 Pricing

Pantalla clave.

Muestra:

```
Base price
Unit price
Modifiers
```

Para pricing tipo fórmula:

```
Base price
Price per unit
Modifiers
```

---

# 1.10 AI Settings

Configuración del parsing.

Campos:

```
AI enabled
Confidence threshold
Fallback behaviour
```

Ejemplo:

```
confidence < 0.8 → revisión manual
```

---

# 1.11 Email Settings

Configuración del email ingestion.

Campos:

```
IMAP server
Email account
Polling interval
```

Opciones:

```
Auto generate quote
Auto send response
Manual approval
```

---

# 1.12 Settings

Configuración general del tenant.

Campos:

```
Company name
Sector
Default currency
Quote expiration
```

---

# 2. PROMPTS REALES PARA OPENAI

El objetivo es **extraer datos estructurados de solicitudes**.

Principio clave:

```
LLM = parser semántico
NO calculadora
```

---

# 2.1 Prompt base

System prompt:

```
You are an assistant that extracts structured quote requests.

Return ONLY valid JSON.

Never invent products.

If information is missing, return null.
```

---

# 2.2 Prompt dinámico con productos

Ejemplo:

```
Available products:

- Flyers
- Posters
- Business cards

Available options:

size: A3,A4,A5,A6
paper: 90g,135g,200g
color: single,double

Extract quote parameters from the request.
```

---

# 2.3 Input ejemplo

Cliente:

```
Hola necesito presupuesto para 2000 flyers A5 en papel de 135g
```

---

# 2.4 Output esperado

```
{
 "product": "flyers",
 "quantity": 2000,
 "options": {
   "size": "A5",
   "paper": "135g",
   "color": null
 }
}
```

---

# 2.5 Prompt robusto (recomendado)

```
Extract the quote parameters.

Rules:

- Do not infer values not mentioned
- If quantity missing return null
- Only use values from allowed lists
- Return JSON only
```

---

# 2.6 Prompt para múltiples sectores

Ejemplo:

```
Products available:

- oil change
- brake replacement
- tire change
```

Input:

```
Necesito cambiar las pastillas de freno de mi coche
```

Output:

```
{
 "product":"brake replacement"
}
```

---

# 3. ARQUITECTURA DE EMAIL AUTOMATION

Procesar emails requiere **pipeline asíncrono**.

Nunca hacerlo en request HTTP.

---

# 3.1 Flujo completo

```
Email inbox
   ↓
IMAP ingestion
   ↓
Queue
   ↓
AI parser
   ↓
Quote generator
   ↓
Email response
```

---

# 3.2 Componentes

Servicios:

```
EmailWatcherService
EmailProcessingWorker
AIParserService
QuoteService
EmailSenderService
```

---

# 3.3 IMAP ingestion

Servicio:

```
EmailWatcherService
```

Funcionamiento:

```
poll every 30 seconds
fetch new emails
store in DB
push job to queue
```

---

# 3.4 Cola de procesamiento

Recomendado:

```
RabbitMQ
```

Alternativas:

```
Redis queue
Kafka
```

Para MVP:

```
RabbitMQ
```

---

# 3.5 Job de parsing

Worker:

```
EmailProcessingWorker
```

Flujo:

```
receive email
call OpenAI
save structured result
create quote
```

---

# 3.6 Pseudocódigo

```
email = loadEmail()

parsed = aiParser.parse(email.body)

quote = quoteService.generate(parsed)

sendEmail(customer, quote)
```

---

# 3.7 Tabla estado procesamiento

Agregar campo:

```
emails.status
```

Estados:

```
NEW
PARSING
PARSED
QUOTE_CREATED
FAILED
```

---

# 3.8 Manejo de errores

Ejemplos:

```
AI confidence low
producto no reconocido
opciones faltantes
```

Acción:

```
manual review
```

---

# 3.9 Escalabilidad

Separar workers:

```
email ingestion
ai parsing
quote generation
email sending
```

---

# 4. ARQUITECTURA FINAL

```
Frontend React
       │
REST API
       │
Spring Boot Backend
       │
MySQL
       │
RabbitMQ
       │
Email workers
       │
OpenAI
```

---

# 5. ROADMAP MVP

Semana 1–2

```
Auth
Products
Quotes
Pricing engine
```

Semana 3–4

```
AI parser
email ingestion
auto quote
```

Semana 5–6

```
backoffice
analytics
PDF quotes
```

---

# 6. RESULTADO

El sistema final permite:

```
email → presupuesto automático
```

Ejemplo:

Cliente envía:

```
Necesito presupuesto para 2000 flyers
```

Sistema responde automáticamente en segundos.

---

 **anexo técnico para el modelo SaaS multi-tenant y el modelo de pricing del producto**. Está pensado para que el equipo pueda **implementar el aislamiento de datos, seguridad y facturación**, y definir cómo monetizar el producto en el rango **100–300 €/mes por cliente**.

---

# 1. MODELO SAAS MULTI-TENANT

## 1.1 Estrategias posibles de multi-tenant

Hay tres modelos clásicos:

| modelo                        | descripción                        | pros              | contras               |
| ----------------------------- | ---------------------------------- | ----------------- | --------------------- |
| Shared DB / Shared schema     | todos los tenants en mismas tablas | simple            | riesgo de aislamiento |
| Shared DB / Schema por tenant | un schema por cliente              | buen aislamiento  | gestión compleja      |
| DB por tenant                 | base de datos por cliente          | aislamiento total | caro                  |

Para este producto recomiendo:

**Shared DB + Tenant ID**

Es el estándar para SaaS B2B.

---

# 1.2 Tenant Isolation

Todas las tablas deben incluir:

```id="s8w5hm"
tenant_id
```

Ejemplo:

```sql id="q7ub3c"
SELECT * 
FROM quotes 
WHERE tenant_id = :tenantId
```

Esto se aplica a:

```
customers
products
quotes
emails
ai_requests
```

---

# 1.3 Tenant Context en Spring Boot

Cada request debe resolver el tenant.

Opciones:

1️⃣ JWT claim
2️⃣ subdomain
3️⃣ header

Recomendado:

```id="cdg5v0"
JWT + tenant_id
```

---

## JWT ejemplo

```json id="w38j0q"
{
  "user_id": "123",
  "tenant_id": "abc",
  "role": "ADMIN"
}
```

---

# 1.4 Tenant Filter

Spring Boot debe aplicar filtro automático.

Ejemplo conceptual:

```java id="0jqf6p"
@Where(clause = "tenant_id = :tenantId")
```

O mediante interceptor.

---

# 1.5 Tenant Resolution

Middleware:

```id="jvuh5s"
Request
  ↓
JWT decode
  ↓
TenantContext.setTenantId()
  ↓
Repository queries
```

---

# 1.6 Seguridad entre tenants

Nunca permitir:

```id="h3gx3c"
GET /quotes/{id}
```

Sin validar tenant.

Siempre:

```id="m8t4mq"
SELECT * FROM quotes
WHERE id = :id
AND tenant_id = :tenantId
```

---

# 1.7 Roles

Roles recomendados:

```id="24ltc4"
ADMIN
STAFF
```

ADMIN:

* configuración
* productos
* pricing

STAFF:

* ver leads
* enviar presupuestos

---

# 2. SEGURIDAD

## 2.1 Autenticación

JWT authentication.

Endpoints:

```
POST /auth/login
POST /auth/register
```

---

## 2.2 Rate Limiting

Evitar abuso del parsing AI.

Ejemplo:

```id="22g9h6"
100 requests / minute / tenant
```

Implementación:

* Redis
* Bucket4j

---

## 2.3 Protección OpenAI

Nunca exponer API key al frontend.

Siempre:

```id="7lpm0i"
Frontend → backend → OpenAI
```

---

# 3. BILLING

Para facturación hay tres opciones:

| opción         | dificultad |
| -------------- | ---------- |
| Stripe         | baja       |
| Paddle         | media      |
| Billing propio | alta       |

Recomendado:

**Stripe**

---

# 3.1 Tabla subscriptions

```sql id="tv5p4k"
CREATE TABLE subscriptions (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36),
    plan ENUM('STARTER','PRO','BUSINESS'),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    status ENUM('ACTIVE','PAUSED','CANCELLED'),
    created_at DATETIME
);
```

---

# 3.2 Uso mensual

Necesitamos trackear uso.

Tabla:

```sql id="xre3ee"
usage_metrics
```

```sql id="9g20c1"
CREATE TABLE usage_metrics (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36),
    metric_type VARCHAR(100),
    value INT,
    created_at DATETIME
);
```

Tipos:

```
quotes_generated
emails_processed
ai_requests
```

---

# 3.3 Stripe Webhooks

Backend debe escuchar:

```
invoice.paid
invoice.payment_failed
customer.subscription.deleted
```

Flujo:

```id="6dtos9"
Stripe webhook
     ↓
Update subscription table
     ↓
Enable/disable tenant
```

---

# 4. LIMITES POR PLAN

Ejemplo:

| plan     | precio | quotes    | emails    | AI parsing |
| -------- | ------ | --------- | --------- | ---------- |
| Starter  | 99€    | 200       | 500       | incluido   |
| Pro      | 199€   | 1000      | 2000      | incluido   |
| Business | 299€   | ilimitado | ilimitado | incluido   |

---

# 5. DISEÑO DE PRICING DEL PRODUCTO

Para SaaS B2B pequeño el modelo ideal es:

```id="07v45y"
precio fijo + volumen
```

---

# 5.1 Plan STARTER

Para pequeñas empresas.

```id="lyv9bm"
99 €/mes
```

Incluye:

```
1 usuario
200 presupuestos / mes
automatización email
backoffice
```

---

# 5.2 Plan PRO

Más popular.

```id="ihzbtv"
199 €/mes
```

Incluye:

```
5 usuarios
1000 presupuestos
integración email
AI parsing
analytics
```

---

# 5.3 Plan BUSINESS

Empresas grandes.

```id="q6md5k"
299 €/mes
```

Incluye:

```
usuarios ilimitados
presupuestos ilimitados
soporte prioritario
custom AI prompts
```

---

# 6. ADDONS (muy rentable)

Puedes cobrar extras.

Ejemplo:

| addon              | precio |
| ------------------ | ------ |
| extra emails       | 20€    |
| extra users        | 10€    |
| AI premium parsing | 30€    |

---

# 7. COSTES DE IA

Ejemplo OpenAI:

```id="f4mmom"
0.002€ por request
```

1000 requests:

```
2 €
```

Cobras:

```
199 €
```

Margen enorme.

---

# 8. COSTE INFRA

Ejemplo mensual:

| recurso | coste |
| ------- | ----- |
| server  | 50€   |
| db      | 30€   |
| queue   | 20€   |

Total:

```
100 €/mes
```

---

# 9. ECONOMÍA DEL PRODUCTO

Supón:

```
100 clientes
plan medio 199€
```

Ingresos:

```id="7smrrl"
19.900 €/mes
```

Costes:

```
infra 200€
IA 100€
```

Margen enorme.

---

# 10. MÉTRICAS CLAVE

Debes medir:

```id="g9m0tf"
MRR
conversion rate
quotes generated
quotes accepted
```

---

# 11. ROADMAP DE MONETIZACIÓN

Fase 1

```
MVP gratis para 10 empresas
```

Fase 2

```
Starter 99€
```

Fase 3

```
Pro 199€
```

Fase 4

```
Enterprise deals
```

---

# 12. GO-TO MARKET

Clientes ideales:

```
imprentas
talleres
empresas servicios
instaladores
```

Problema que resuelve:

```id="59ikq7"
responder presupuestos rápido
```

---

# 13. POSICIONAMIENTO

No vender:

```
AI automation platform
```

Vender:

```id="cb3pkc"
presupuestos automáticos por email
```

Mucho más claro.

---

# CONCLUSIÓN

Este producto es:

```
SaaS B2B vertical
alto margen
fácil de vender
```

---


