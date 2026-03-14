-- Update generic product names to professional names (imprenta + taller)

UPDATE presupuestos_products p
JOIN (
  SELECT 1 AS n, 'Tarjetas de visita premium' AS name UNION ALL
  SELECT 2, 'Flyers A5 promocionales' UNION ALL
  SELECT 3, 'Folletos tripticos' UNION ALL
  SELECT 4, 'Catalogos A4 grapados' UNION ALL
  SELECT 5, 'Posters gran formato' UNION ALL
  SELECT 6, 'Roll-up publicitario' UNION ALL
  SELECT 7, 'Lonas PVC exteriores' UNION ALL
  SELECT 8, 'Vinilos adhesivos' UNION ALL
  SELECT 9, 'Dipticos corporativos' UNION ALL
  SELECT 10, 'Sobres personalizados' UNION ALL
  SELECT 11, 'Papel carta corporativo' UNION ALL
  SELECT 12, 'Carpetas con solapa' UNION ALL
  SELECT 13, 'Cuadernos encuadernados' UNION ALL
  SELECT 14, 'Etiquetas adhesivas' UNION ALL
  SELECT 15, 'Pegatinas troqueladas' UNION ALL
  SELECT 16, 'Calendarios de pared' UNION ALL
  SELECT 17, 'Calendarios de mesa' UNION ALL
  SELECT 18, 'Invitaciones premium' UNION ALL
  SELECT 19, 'Menus para restaurante' UNION ALL
  SELECT 20, 'Tarjetas regalo' UNION ALL
  SELECT 21, 'Bloc de notas' UNION ALL
  SELECT 22, 'Adhesivos para escaparate' UNION ALL
  SELECT 23, 'Folletos A6' UNION ALL
  SELECT 24, 'Folletos A4' UNION ALL
  SELECT 25, 'Postales personalizadas' UNION ALL
  SELECT 26, 'Lanyards impresos' UNION ALL
  SELECT 27, 'Tarjetas PVC' UNION ALL
  SELECT 28, 'Credenciales para eventos' UNION ALL
  SELECT 29, 'Talonarios autocopiativos' UNION ALL
  SELECT 30, 'Sellos de goma' UNION ALL
  SELECT 31, 'Sellos automaticos' UNION ALL
  SELECT 32, 'Albaranes personalizados' UNION ALL
  SELECT 33, 'Libretas corporativas' UNION ALL
  SELECT 34, 'Tarjetas de fidelizacion' UNION ALL
  SELECT 35, 'Carteles A3' UNION ALL
  SELECT 36, 'Carteles A2' UNION ALL
  SELECT 37, 'Carteles A1' UNION ALL
  SELECT 38, 'Carteleria punto de venta' UNION ALL
  SELECT 39, 'Cajas personalizadas' UNION ALL
  SELECT 40, 'Bolsas de papel impresas' UNION ALL
  SELECT 41, 'Bolsas de tela' UNION ALL
  SELECT 42, 'Etiquetas colgantes' UNION ALL
  SELECT 43, 'Catalogos con lomo' UNION ALL
  SELECT 44, 'Revistas grapadas' UNION ALL
  SELECT 45, 'Revistas encoladas' UNION ALL
  SELECT 46, 'Pegatinas para vehiculo' UNION ALL
  SELECT 47, 'Totems publicitarios' UNION ALL
  SELECT 48, 'Flyers doblados' UNION ALL
  SELECT 49, 'Tarjetas kraft ecologicas' UNION ALL
  SELECT 50, 'Sobres acolchados impresos'
) t
ON p.name = CONCAT('Imprenta producto ', t.n)
SET p.name = t.name;

UPDATE presupuestos_products p
JOIN (
  SELECT 1 AS n, 'Revision basica' AS name UNION ALL
  SELECT 2, 'Revision completa' UNION ALL
  SELECT 3, 'Cambio de aceite y filtro' UNION ALL
  SELECT 4, 'Sustitucion filtro de aire' UNION ALL
  SELECT 5, 'Sustitucion filtro habitaculo' UNION ALL
  SELECT 6, 'Cambio de pastillas delanteras' UNION ALL
  SELECT 7, 'Cambio de pastillas traseras' UNION ALL
  SELECT 8, 'Cambio de discos delanteros' UNION ALL
  SELECT 9, 'Cambio de discos traseros' UNION ALL
  SELECT 10, 'Diagnosis electronica' UNION ALL
  SELECT 11, 'Cambio de bateria' UNION ALL
  SELECT 12, 'Alineacion de direccion' UNION ALL
  SELECT 13, 'Equilibrado de ruedas' UNION ALL
  SELECT 14, 'Sustitucion de neumaticos' UNION ALL
  SELECT 15, 'Reparacion de pinchazo' UNION ALL
  SELECT 16, 'Cambio de amortiguadores' UNION ALL
  SELECT 17, 'Sustitucion correa distribucion' UNION ALL
  SELECT 18, 'Cambio liquido de frenos' UNION ALL
  SELECT 19, 'Cambio liquido refrigerante' UNION ALL
  SELECT 20, 'Sustitucion de bujias' UNION ALL
  SELECT 21, 'Limpieza de inyectores' UNION ALL
  SELECT 22, 'Servicio de climatizacion' UNION ALL
  SELECT 23, 'Recarga aire acondicionado' UNION ALL
  SELECT 24, 'Cambio de embrague' UNION ALL
  SELECT 25, 'Reparacion de escape' UNION ALL
  SELECT 26, 'Sustitucion de catalizador' UNION ALL
  SELECT 27, 'Cambio aceite caja de cambios' UNION ALL
  SELECT 28, 'Revision pre-ITV' UNION ALL
  SELECT 29, 'Gestion de ITV' UNION ALL
  SELECT 30, 'Sustitucion limpiaparabrisas' UNION ALL
  SELECT 31, 'Reparacion de lunas' UNION ALL
  SELECT 32, 'Sustitucion de faros' UNION ALL
  SELECT 33, 'Regulacion de faros' UNION ALL
  SELECT 34, 'Kit frenos completo' UNION ALL
  SELECT 35, 'Revision frenos completa' UNION ALL
  SELECT 36, 'Sustitucion de rodamientos' UNION ALL
  SELECT 37, 'Reparacion de suspension' UNION ALL
  SELECT 38, 'Diagnostico de motor' UNION ALL
  SELECT 39, 'Cambio de bomba de agua' UNION ALL
  SELECT 40, 'Limpieza de admision' UNION ALL
  SELECT 41, 'Detailing basico' UNION ALL
  SELECT 42, 'Detailing premium' UNION ALL
  SELECT 43, 'Desinfeccion de habitaculo' UNION ALL
  SELECT 44, 'Kit distribucion + bomba' UNION ALL
  SELECT 45, 'Montaje de accesorios' UNION ALL
  SELECT 46, 'Reparacion de elevalunas' UNION ALL
  SELECT 47, 'Cambio de alternador' UNION ALL
  SELECT 48, 'Cambio de motor de arranque' UNION ALL
  SELECT 49, 'Cambio de correa auxiliar' UNION ALL
  SELECT 50, 'Limpieza sistema EGR'
) t
ON p.name = CONCAT('Taller producto ', t.n)
SET p.name = t.name;
