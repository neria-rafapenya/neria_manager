#!/usr/bin/env bash
set -euo pipefail

XAMPP_BIN="/Applications/XAMPP/xamppfiles/bin"
MYSQL="$XAMPP_BIN/mysql"
MYSQLDUMP="$XAMPP_BIN/mysqldump"

LOCAL_DB="provider_manager"
LOCAL_USER="rpenya"

PROD_HOST="trolley.proxy.rlwy.net"
PROD_PORT="22764"
INT_HOST="tramway.proxy.rlwy.net"
INT_PORT="24334"

DATA_DUMP_PATH="${1:-$HOME/Downloads/provider_manager_data_dump.sql}"
SCHEMA_PATCH_PATH="${2:-$HOME/Downloads/provider_manager_schema_patch.sql}"

LOCAL_DB_PASSWORD="${LOCAL_DB_PASSWORD:-}"
PROD_DB_PASSWORD="${PROD_DB_PASSWORD:-}"
INT_DB_PASSWORD="${INT_DB_PASSWORD:-}"

if [[ ! -x "$MYSQL" || ! -x "$MYSQLDUMP" ]]; then
  echo "No se encontraron binarios de MariaDB en $XAMPP_BIN"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_DIR="$SCRIPT_DIR/../backend-java/scripts"

if [[ ! -d "$SCHEMA_DIR" ]]; then
  echo "No se encontro backend-java/scripts en $SCHEMA_DIR" >&2
  exit 1
fi

build_schema_patch() {
  local output="$1"
  local -a scripts=()
  local restore_nounset=0

  case $- in
    *u*)
      restore_nounset=1
      set +u
      ;;
  esac

  while IFS= read -r -d '' file; do
    scripts+=("$file")
  done < <(find "$SCHEMA_DIR" -maxdepth 1 -type f -name 'create_*.sql' -print0)

  while IFS= read -r -d '' file; do
    if [[ "$file" == *_mysql_compat.sql ]]; then
      scripts+=("$file")
      continue
    fi
    if [[ -f "${file%.sql}_mysql_compat.sql" ]]; then
      continue
    fi
    scripts+=("$file")
  done < <(find "$SCHEMA_DIR" -maxdepth 1 -type f -name 'alter_*.sql' -print0)

  if ((${#scripts[@]} > 0)); then
    IFS=$'\n' read -r -d '' -a scripts <<< "$(printf '%s\n' "${scripts[@]}" | sort)" || true
  fi

  {
    echo "-- Schema patch generado desde $SCHEMA_DIR"
    echo "-- $(date)"
    echo
    for file in "${scripts[@]}"; do
      echo "-- BEGIN $file"
      cat "$file"
      echo
      echo "-- END $file"
      echo
    done
  } > "$output"
  if ((restore_nounset)); then
    set -u
  fi
}


apply_schema_patch() {
  local host="$1"
  local port="$2"
  local password="$3"
  local label="$4"

  echo "
[3/6] Aplicando patch de estructura en ${label}"
  set +e
  "$MYSQL"     --ssl     -h "$host"     -P "$port"     -u root --password="$password"     -e "CREATE DATABASE IF NOT EXISTS railway;"
  "$MYSQL"     --ssl     -h "$host"     -P "$port"     -u root --password="$password"     --force railway     < "$SCHEMA_PATCH_PATH"
  local status=$?
  set -e
  if [[ $status -ne 0 ]]; then
    echo "Aviso: patch en ${label} aplico con errores (probablemente columnas/tablas ya existentes)."
  fi
}
echo "Este script va a:"
echo "1) Exportar $LOCAL_DB SOLO datos (INSERT IGNORE)"
echo "2) Generar un patch de estructura (create/alter) desde backend-java/scripts"
echo "3) Aplicar patch de estructura en PRODUCCION"
echo "4) Importar datos en PRODUCCION (merge, sin borrar)"
echo "5) Aplicar patch de estructura en INTEGRACION"
echo "6) Importar datos en INTEGRACION (merge, sin borrar)"
echo
read -r -p "Escribe YES para continuar: " CONFIRM
if [[ "$CONFIRM" != "YES" ]]; then
  echo "Cancelado."
  exit 1
fi

if [[ -z "$LOCAL_DB_PASSWORD" ]]; then
  read -r -s -p "Password local (MariaDB): " LOCAL_DB_PASSWORD
  echo
fi
if [[ -z "$PROD_DB_PASSWORD" ]]; then
  read -r -s -p "Password Railway PRODUCTION: " PROD_DB_PASSWORD
  echo
fi
if [[ -z "$INT_DB_PASSWORD" ]]; then
  read -r -s -p "Password Railway INTEGRACION: " INT_DB_PASSWORD
  echo
fi

echo "\n[1/6] Exportando datos locales a: $DATA_DUMP_PATH"
"$MYSQLDUMP" \
  -u "$LOCAL_USER" --password="$LOCAL_DB_PASSWORD" \
  --single-transaction --quick \
  --no-create-info --skip-triggers \
  --insert-ignore --complete-insert \
  "$LOCAL_DB" \
  > "$DATA_DUMP_PATH"

echo "\n[2/6] Generando patch de estructura en: $SCHEMA_PATCH_PATH"
build_schema_patch "$SCHEMA_PATCH_PATH"

echo "\n[3/6] Aplicando patch de estructura en PRODUCCION"
"$MYSQL" \
  --ssl \
  -h "$PROD_HOST" \
  -P "$PROD_PORT" \
  -u root --password="$PROD_DB_PASSWORD" \
  -e "CREATE DATABASE IF NOT EXISTS railway;"
"$MYSQL" \
  --ssl \
  -h "$PROD_HOST" \
  -P "$PROD_PORT" \
  -u root --password="$PROD_DB_PASSWORD" \
  --force railway \
  < "$SCHEMA_PATCH_PATH"

echo "\n[4/6] Importando datos en PRODUCCION (merge)"
"$MYSQL" \
  --ssl \
  -h "$PROD_HOST" \
  -P "$PROD_PORT" \
  -u root --password="$PROD_DB_PASSWORD" railway \
  < "$DATA_DUMP_PATH"

echo "\n[5/6] Aplicando patch de estructura en INTEGRACION"
"$MYSQL" \
  --ssl \
  -h "$INT_HOST" \
  -P "$INT_PORT" \
  -u root --password="$INT_DB_PASSWORD" \
  -e "CREATE DATABASE IF NOT EXISTS railway;"
"$MYSQL" \
  --ssl \
  -h "$INT_HOST" \
  -P "$INT_PORT" \
  -u root --password="$INT_DB_PASSWORD" \
  --force railway \
  < "$SCHEMA_PATCH_PATH"

echo "\n[6/6] Importando datos en INTEGRACION (merge)"
"$MYSQL" \
  --ssl \
  -h "$INT_HOST" \
  -P "$INT_PORT" \
  -u root --password="$INT_DB_PASSWORD" railway \
  < "$DATA_DUMP_PATH"

echo "\nOK: estructura aplicada y datos mergeados en production e integration."
