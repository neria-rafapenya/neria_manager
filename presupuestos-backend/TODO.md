# TODO - Presupuestos Backend

## Arquitectura / Infra
- [ ] Implementar pipeline asíncrono de emails: IMAP ingestion + cola + workers
- [ ] Añadir RabbitMQ (o Redis/Kafka) y procesamiento de jobs
- [ ] Configurar despliegue (Railway/AWS) y variables de entorno de prod

## Seguridad
- [ ] Rate limiting por tenant (Bucket4j + Redis)
- [ ] Validación de emails y políticas de password
- [ ] Aislamiento multi-tenant global (filtro/interceptor JPA o @Where)

## Billing
- [ ] Integrar Stripe (crear clientes, subscripciones)
- [ ] Implementar webhooks: invoice.paid, invoice.payment_failed, customer.subscription.deleted
- [ ] Aplicar límites por plan (quotes/emails/AI)
- [ ] Actualizar usage_metrics automáticamente

## Email automation
- [ ] EmailWatcherService (IMAP polling)
- [ ] EmailProcessingWorker (parse → quote → response)
- [ ] Pipeline de estados de emails: NEW → PARSING → PARSED → QUOTE_CREATED → FAILED
- [ ] Plantillas de email configurables

## AI Parsing
- [ ] Prompt dinámico con productos/opciones reales
- [ ] Guardar confidence y errores de parsing

## Pricing engine
- [ ] Implementar modifiers reales
- [ ] Pricing FORMULA real y configurable
- [ ] Validaciones de opciones obligatorias en backend

## Analytics
- [ ] Métricas avanzadas (conversion rate, series)
- [ ] Endpoint de analytics agregado

<!-- ## Frontend público
- [ ] Crear portal público para clientes (solicitud de presupuesto)
- [ ] Flujo público de tracking de presupuesto -->
