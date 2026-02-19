#!/usr/bin/env bash
set -euo pipefail

XAMPP_BIN="/Applications/XAMPP/xamppfiles/bin"
MYSQL="$XAMPP_BIN/mysql"
MYSQLDUMP="$XAMPP_BIN/mysqldump"

LOCAL_DB="${LOCAL_DB:-provider_manager}"
LOCAL_HOST="${LOCAL_DB_HOST:-localhost}"
LOCAL_PORT="${LOCAL_DB_PORT:-3306}"
LOCAL_USER="${LOCAL_DB_USER:-rpenya}"

PROD_HOST="${PROD_HOST:-trolley.proxy.rlwy.net}"
PROD_PORT="${PROD_PORT:-22764}"
INT_HOST="${INT_HOST:-tramway.proxy.rlwy.net}"
INT_PORT="${INT_PORT:-24334}"

SOURCE_ENV="${SOURCE_ENV:-prod}" # prod | int

DATA_DUMP_PATH="${1:-$HOME/Downloads/provider_manager_railway_dump.sql}"
SCHEMA_PATCH_PATH="${2:-$HOME/Downloads/provider_manager_schema_patch.sql}"

LOCAL_DB_PASSWORD="${LOCAL_DB_PASSWORD:-}"
PROD_DB_PASSWORD="${PROD_DB_PASSWORD:-}"
INT_DB_PASSWORD="${INT_DB_PASSWORD:-}"

SYNC_MODE="${SYNC_MODE:-replace}" # replace | ignore
TRUNCATE_BEFORE_IMPORT="${TRUNCATE_BEFORE_IMPORT:-0}"

if [[ ! -x "$MYSQL" || ! -x "$MYSQLDUMP" ]]; then
  echo "No se encontraron binarios de MariaDB en $XAMPP_BIN" >&2
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

source_host="$PROD_HOST"
source_port="$PROD_PORT"
source_label="PRODUCCION"
source_password_var="PROD_DB_PASSWORD"
if [[ "$SOURCE_ENV" == "int" ]]; then
  source_host="$INT_HOST"
  source_port="$INT_PORT"
  source_label="INTEGRACION"
  source_password_var="INT_DB_PASSWORD"
fi

if [[ "$source_password_var" == "PROD_DB_PASSWORD" && -z "$PROD_DB_PASSWORD" ]]; then
  read -r -s -p "Password Railway PRODUCCION: " PROD_DB_PASSWORD
  echo
fi
if [[ "$source_password_var" == "INT_DB_PASSWORD" && -z "$INT_DB_PASSWORD" ]]; then
  read -r -s -p "Password Railway INTEGRACION: " INT_DB_PASSWORD
  echo
fi
if [[ -z "$LOCAL_DB_PASSWORD" ]]; then
  read -r -s -p "Password local (MariaDB): " LOCAL_DB_PASSWORD
  echo
fi

source_password="${!source_password_var}"

if [[ "$SYNC_MODE" != "replace" && "$SYNC_MODE" != "ignore" ]]; then
  echo "SYNC_MODE invalido. Usa replace o ignore." >&2
  exit 1
fi

MODE_LABEL=$([[ "$SYNC_MODE" == "replace" ]] && echo "REPLACE" || echo "INSERT IGNORE")

cat <<INFO
Este script va a:
1) Exportar datos de Railway ($source_label) SOLO datos ($MODE_LABEL)
2) Generar patch de estructura desde backend-java/scripts
3) Aplicar patch de estructura en LOCAL (con --force)
4) ${TRUNCATE_BEFORE_IMPORT:+Vaciar tablas locales y }importar datos en LOCAL

DB local: $LOCAL_DB@$LOCAL_HOST:$LOCAL_PORT
Source: $source_label@$source_host:$source_port
Dump: $DATA_DUMP_PATH
Schema patch: $SCHEMA_PATCH_PATH
INFO

read -r -p "Escribe YES para continuar: " CONFIRM
if [[ "$CONFIRM" != "YES" ]]; then
  echo "Cancelado."
  exit 1
fi

echo "\n[1/4] Exportando datos de Railway ($source_label) a: $DATA_DUMP_PATH"
DUMP_FLAGS=(
  --single-transaction
  --quick
  --no-create-info
  --skip-triggers
  --complete-insert
)
if [[ "$SYNC_MODE" == "replace" ]]; then
  DUMP_FLAGS+=(--replace)
else
  DUMP_FLAGS+=(--insert-ignore)
fi

"$MYSQLDUMP" \
  --ssl \
  -h "$source_host" \
  -P "$source_port" \
  -u root --password="$source_password" \
  "${DUMP_FLAGS[@]}" \
  railway \
  > "$DATA_DUMP_PATH"

echo "\n[2/4] Generando patch de estructura en: $SCHEMA_PATCH_PATH"
build_schema_patch "$SCHEMA_PATCH_PATH"

echo "\n[3/4] Aplicando patch de estructura en LOCAL"
set +e
"$MYSQL" \
  -h "$LOCAL_HOST" \
  -P "$LOCAL_PORT" \
  -u "$LOCAL_USER" --password="$LOCAL_DB_PASSWORD" \
  --force "$LOCAL_DB" \
  < "$SCHEMA_PATCH_PATH"
patch_status=$?
set -e
if [[ $patch_status -ne 0 ]]; then
  echo "Aviso: patch local aplico con errores (probablemente columnas/tablas ya existentes)."
fi

if [[ "$TRUNCATE_BEFORE_IMPORT" == "1" ]]; then
  echo "\n[3.5/4] Vaciando tablas locales"
  tmpfile="$(mktemp)"
  "$MYSQL" \
    -h "$LOCAL_HOST" \
    -P "$LOCAL_PORT" \
    -u "$LOCAL_USER" --password="$LOCAL_DB_PASSWORD" \
    -N -e "SELECT CONCAT('TRUNCATE TABLE `', table_name, '`;') FROM information_schema.tables WHERE table_schema='${LOCAL_DB}' AND table_type='BASE TABLE';" \
    > "$tmpfile"
  {
    echo "SET FOREIGN_KEY_CHECKS=0;"
    cat "$tmpfile"
    echo "SET FOREIGN_KEY_CHECKS=1;"
  } | "$MYSQL" \
    -h "$LOCAL_HOST" \
    -P "$LOCAL_PORT" \
    -u "$LOCAL_USER" --password="$LOCAL_DB_PASSWORD" \
    "$LOCAL_DB"
  rm -f "$tmpfile"
fi

echo "\n[4/4] Importando datos en LOCAL"
"$MYSQL" \
  -h "$LOCAL_HOST" \
  -P "$LOCAL_PORT" \
  -u "$LOCAL_USER" --password="$LOCAL_DB_PASSWORD" \
  "$LOCAL_DB" \
  < "$DATA_DUMP_PATH"

echo "\nOK: datos de Railway ($source_label) importados en local."
