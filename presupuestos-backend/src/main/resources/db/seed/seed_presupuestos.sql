-- Seed data for Presupuestos (safe to run once)

INSERT IGNORE INTO presupuestos_tenants (id, name, sector, created_at, active) VALUES
('11111111-1111-1111-1111-111111111111', 'Imprenta Demo', 'imprenta', NOW(), TRUE);

INSERT IGNORE INTO presupuestos_sectors (id, tenant_id, name, active, created_at) VALUES
('s1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'imprenta', TRUE, NOW()),
('s2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'taller', TRUE, NOW());

INSERT IGNORE INTO presupuestos_users (id, tenant_id, email, password_hash, role, created_at) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'admin@demo.com', '$2y$10$ovcjKPcGfaZS8paYwxx/pedDE9YJY2eoz791YWS8vABrrtiQihP6S', 'ADMIN', NOW());

INSERT IGNORE INTO presupuestos_customers (id, tenant_id, name, email, phone, created_at) VALUES
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Cliente Uno', 'cliente1@example.com', '+34 600 000 001', NOW()),
('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111111', 'Cliente Dos', 'cliente2@example.com', '+34 600 000 002', NOW());

INSERT IGNORE INTO presupuestos_products (id, tenant_id, name, description, pricing_type, base_price, active, created_at, sector_id) VALUES
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Flyers', 'Impresion flyers', 'UNIT', 0.03, TRUE, NOW(), 's1111111-1111-1111-1111-111111111111'),
('44444444-4444-4444-4444-444444444445', '11111111-1111-1111-1111-111111111111', 'Posters', 'Impresion posters', 'FIXED', 12.00, TRUE, NOW(), 's1111111-1111-1111-1111-111111111111');

INSERT IGNORE INTO presupuestos_product_options (id, product_id, name, option_type, required) VALUES
('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'size', 'SELECT', TRUE),
('55555555-5555-5555-5555-555555555556', '44444444-4444-4444-4444-444444444444', 'paper', 'SELECT', TRUE),
('55555555-5555-5555-5555-555555555557', '44444444-4444-4444-4444-444444444444', 'color', 'SELECT', FALSE);

INSERT IGNORE INTO presupuestos_option_values (id, option_id, value, price_modifier) VALUES
('66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', 'A5', 0.00),
('66666666-6666-6666-6666-666666666667', '55555555-5555-5555-5555-555555555555', 'A4', 0.10),
('66666666-6666-6666-6666-666666666668', '55555555-5555-5555-5555-555555555556', '135g', 0.05),
('66666666-6666-6666-6666-666666666669', '55555555-5555-5555-5555-555555555556', '200g', 0.12),
('66666666-6666-6666-6666-666666666670', '55555555-5555-5555-5555-555555555557', 'double', 0.10);

INSERT IGNORE INTO presupuestos_ai_profiles (id, tenant_id, sector_id, product_id, required_options, prompt_instructions, active, created_at, updated_at) VALUES
('ap111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444',
 '["size","paper","color"]', NULL, TRUE, NOW(), NOW());

INSERT IGNORE INTO presupuestos_quotes (id, tenant_id, customer_id, status, total_price, created_at) VALUES
('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'DRAFT', 60.00, NOW()),
('77777777-7777-7777-7777-777777777778', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333334', 'ACCEPTED', 85.00, NOW());

INSERT IGNORE INTO presupuestos_quote_items (id, quote_id, product_id, quantity, unit_price, total_price) VALUES
('88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', 2000, 0.03, 60.00),
('88888888-8888-8888-8888-888888888889', '77777777-7777-7777-7777-777777777778', '44444444-4444-4444-4444-444444444444', 2000, 0.0425, 85.00);

INSERT IGNORE INTO presupuestos_quote_item_options (id, quote_item_id, option_id, value, price_modifier) VALUES
('99999999-9999-9999-9999-999999999999', '88888888-8888-8888-8888-888888888889', '55555555-5555-5555-5555-555555555555', 'A5', 0.00),
('99999999-9999-9999-9999-999999999998', '88888888-8888-8888-8888-888888888889', '55555555-5555-5555-5555-555555555556', '135g', 0.05),
('99999999-9999-9999-9999-999999999997', '88888888-8888-8888-8888-888888888889', '55555555-5555-5555-5555-555555555557', 'double', 0.10);

INSERT IGNORE INTO presupuestos_emails (id, tenant_id, customer_email, subject, body, status, processed, created_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'cliente1@example.com', 'Necesito flyers', 'Necesito presupuesto para 2000 flyers A5 135g', 'PARSED', TRUE, NOW());

INSERT IGNORE INTO presupuestos_ai_requests (id, tenant_id, input_text, parsed_json, confidence, created_at) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Necesito 2000 flyers A5', '{"product":"flyers","quantity":2000,"options":{"size":"A5"}}', 0.91, NOW());

INSERT IGNORE INTO presupuestos_subscriptions (id, tenant_id, plan, stripe_customer_id, stripe_subscription_id, status, created_at) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'PRO', 'cus_demo', 'sub_demo', 'ACTIVE', NOW());

INSERT IGNORE INTO presupuestos_usage_metrics (id, tenant_id, metric_type, value, created_at) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'quotes_generated', 2, NOW()),
('dddddddd-dddd-dddd-dddd-ddddddddddde', '11111111-1111-1111-1111-111111111111', 'emails_processed', 1, NOW());
INSERT IGNORE INTO presupuestos_quote_attachments (id, tenant_id, quote_id, url, file_name, content_type, created_at) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777778', 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg', 'sample.jpg', 'image/jpeg', NOW());

INSERT IGNORE INTO presupuestos_faqs (id, tenant_id, question, answer, order_index, created_at) VALUES
('f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '¿Cómo creo mi primer producto?', 'En Products, usa "Nuevo producto" y define nombre, pricing y base price. Luego podrás usarlo en presupuestos.', 1, NOW()),
('f2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '¿Cómo configuro opciones y valores?', 'En Products, crea opciones (SELECT/NUMBER/BOOLEAN) y marca si son obligatorias. Luego añade valores con modificadores.', 2, NOW()),
('f3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '¿Cómo genero un presupuesto manual?', 'En Quotes, pulsa "Nuevo presupuesto", añade items y guarda. El total se calcula automáticamente.', 3, NOW()),
('f4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '¿Cómo adjunto un PDF o imagen?', 'Dentro del presupuesto, usa la sección Adjuntos. Puedes subir archivo manual o exportar PDF automático.', 4, NOW()),
('f5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '¿Dónde veo los leads?', 'En Leads se listan los emails procesados. El estado muestra el progreso del pipeline.', 5, NOW()),
('f6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', '¿Cómo funciona la IA?', 'En AI Settings puedes probar el parser. La IA devuelve JSON que luego el backend usa para calcular precios.', 6, NOW()),
('f7777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', '¿Qué es Backoffice y qué es Frontend?', 'Backoffice es este panel interno. Frontend es el portal público para clientes.', 7, NOW());

INSERT IGNORE INTO presupuestos_users (id, tenant_id, email, password_hash, role, created_at) VALUES
('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'user@demo.com', '$2y$10$hSdI5tsWXuTy9n/paA1tFueooKa6HWvoYyBFTwrEZKwXCVZ.dXp5e', 'STAFF', NOW());

-- Taller products
INSERT IGNORE INTO presupuestos_products (id, tenant_id, name, description, pricing_type, base_price, active, created_at, sector_id) VALUES
('44444444-4444-4444-4444-444444444446', '11111111-1111-1111-1111-111111111111', 'Cambio de aceite', 'Servicio de cambio de aceite', 'FIXED', 60.00, TRUE, NOW(), 's2222222-2222-2222-2222-222222222222'),
('44444444-4444-4444-4444-444444444447', '11111111-1111-1111-1111-111111111111', 'Pastillas de freno', 'Cambio de pastillas de freno', 'FIXED', 120.00, TRUE, NOW(), 's2222222-2222-2222-2222-222222222222');

INSERT IGNORE INTO presupuestos_product_options (id, product_id, name, option_type, required) VALUES
('55555555-5555-5555-5555-555555555558', '44444444-4444-4444-4444-444444444446', 'vehicle_type', 'SELECT', TRUE),
('55555555-5555-5555-5555-555555555559', '44444444-4444-4444-4444-444444444447', 'vehicle_type', 'SELECT', TRUE),
('55555555-5555-5555-5555-555555555560', '44444444-4444-4444-4444-444444444447', 'parts_quality', 'SELECT', TRUE);

INSERT IGNORE INTO presupuestos_option_values (id, option_id, value, price_modifier) VALUES
('66666666-6666-6666-6666-666666666671', '55555555-5555-5555-5555-555555555558', 'turismo', 0.00),
('66666666-6666-6666-6666-666666666672', '55555555-5555-5555-5555-555555555558', 'SUV', 15.00),
('66666666-6666-6666-6666-666666666673', '55555555-5555-5555-5555-555555555559', 'turismo', 0.00),
('66666666-6666-6666-6666-666666666674', '55555555-5555-5555-5555-555555555559', 'SUV', 20.00),
('66666666-6666-6666-6666-666666666675', '55555555-5555-5555-5555-555555555560', 'estandar', 0.00),
('66666666-6666-6666-6666-666666666676', '55555555-5555-5555-5555-555555555560', 'premium', 35.00);
