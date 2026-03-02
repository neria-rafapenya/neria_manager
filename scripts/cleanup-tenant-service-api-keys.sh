#!/usr/bin/env bash
set -euo pipefail

XAMPP_BIN="/Applications/XAMPP/xamppfiles/bin"
MYSQL="$XAMPP_BIN/mysql"

LOCAL_DB="${LOCAL_DB:-provider_manager}"
LOCAL_HOST="${LOCAL_DB_HOST:-localhost}"
LOCAL_PORT="${LOCAL_DB_PORT:-3306}"
LOCAL_USER="${LOCAL_DB_USER:-rpenya}"
LOCAL_DB_PASSWORD="${LOCAL_DB_PASSWORD:-}"

if [[ ! -x "$MYSQL" ]]; then
  echo "No se encontro mysql en $MYSQL" >&2
  exit 1
fi

if [[ -z "$LOCAL_DB_PASSWORD" ]]; then
  echo "LOCAL_DB_PASSWORD no definido. Exportalo y reintenta." >&2
  exit 1
fi

SQL=$(cat <<'SQL'
DELETE t1
FROM tenant_service_api_keys t1
JOIN tenant_service_api_keys t2
  ON t1.tenantId = t2.tenantId
 AND t1.serviceCode = t2.serviceCode
 AND (
   t1.createdAt > t2.createdAt
   OR (t1.createdAt = t2.createdAt AND t1.id > t2.id)
 );
SQL
)

"$MYSQL" \
  -h "$LOCAL_HOST" \
  -P "$LOCAL_PORT" \
  -u "$LOCAL_USER" --password="$LOCAL_DB_PASSWORD" \
  "$LOCAL_DB" \
  -e "$SQL"

echo "OK: limpieza completada en tenant_service_api_keys"
