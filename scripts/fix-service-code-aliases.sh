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

SQL_FILE="${1:-/tmp/fix_service_code_aliases.sql}"

cat > "$SQL_FILE" <<'SQL'
SELECT CONCAT(
  'UPDATE `', table_name,
  '` SET `serviceCode` = ''pre-evaluacion'' WHERE `serviceCode` = ''simulado-preevaluacion'';'
) AS sql_to_run
FROM information_schema.columns
WHERE table_schema = DATABASE() AND column_name = 'serviceCode';

SELECT CONCAT(
  'UPDATE `', table_name,
  '` SET `serviceCode` = ''chat-generic'' WHERE `serviceCode` = ''chat_generic'';'
) AS sql_to_run
FROM information_schema.columns
WHERE table_schema = DATABASE() AND column_name = 'serviceCode';
SQL

TMP_UPDATES="/tmp/fix_service_code_aliases_updates.sql"

"$MYSQL" \
  -h "$LOCAL_HOST" \
  -P "$LOCAL_PORT" \
  -u "$LOCAL_USER" --password="$LOCAL_DB_PASSWORD" \
  -N "$LOCAL_DB" \
  < "$SQL_FILE" \
  > "$TMP_UPDATES"

if [[ ! -s "$TMP_UPDATES" ]]; then
  echo "No se generaron updates."
  exit 0
fi

"$MYSQL" \
  -h "$LOCAL_HOST" \
  -P "$LOCAL_PORT" \
  -u "$LOCAL_USER" --password="$LOCAL_DB_PASSWORD" \
  "$LOCAL_DB" \
  < "$TMP_UPDATES"

echo "OK: alias actualizados en $LOCAL_DB"
