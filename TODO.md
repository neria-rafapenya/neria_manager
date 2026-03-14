# TODO (Presupuestos)

## Pendiente funcional
- Implementar **integraciones externas**: provider live, mapeo de productos/valores, caché de catálogo.

## Seguridad y roles
- Añadir control de **rol ADMIN** en endpoints sensibles del backend (Customers, Products, Sectors, Pricing, etc.).
- Revisar exposición de `/auth/change-password` (ya requiere auth) y documentar `MASTER_PASSWORD`.

## UX/Producto
- Añadir paginación backend para FAQs (ahora es client-side).

## Infra/Docs
- Documentar configuración de `MASTER_PASSWORD` en `.env.local` y README.

## Completado
- [x] Aislamiento multi-tenant global (filtro/interceptor JPA o @Where)
- [x] AI parsing con prompt dinámico (productos/opciones reales)
- [x] Guardar confidence y errores de parsing
- [x] Listado de logs de parsing en backoffice con filtros por fecha
- [x] Mejorar feedback en AI Settings cuando se crea un presupuesto
- [x] Persistir configuración de catálogo externo por sector (API base URL + token maestro + endpoints fijos)
- [x] Conectar UI de Sectors para guardar/editar integración de catálogo externo
- [x] Añadir test connection para validar API externa desde backoffice
