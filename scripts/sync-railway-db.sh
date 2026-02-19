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

DUMP_PATH="${1:-$HOME/Downloads/provider_manager_dump.sql}"

LOCAL_DB_PASSWORD="${LOCAL_DB_PASSWORD:-}"
PROD_DB_PASSWORD="${PROD_DB_PASSWORD:-}"
INT_DB_PASSWORD="${INT_DB_PASSWORD:-}"

if [[ ! -x "$MYSQL" || ! -x "$MYSQLDUMP" ]]; then
  echo "No se encontraron binarios de MariaDB en $XAMPP_BIN"
  exit 1
fi

echo "Este script va a:"
echo "1) Exportar $LOCAL_DB (estructura + datos + DROP)"
echo "2) DROP+CREATE database railway en PRODUCCION"
echo "3) Importar el dump en PRODUCCION"
echo "4) DROP+CREATE database railway en INTEGRACION"
echo "5) Importar el dump en INTEGRACION"
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

echo "\n[1/5] Exportando dump local a: $DUMP_PATH"
"$MYSQLDUMP" \
  -u "$LOCAL_USER" --password="$LOCAL_DB_PASSWORD" \
  --single-transaction --quick \
  --routines --triggers --events \
  --add-drop-table \
  "$LOCAL_DB" \
  > "$DUMP_PATH"

echo "\n[2/5] DROP+CREATE railway en PRODUCCION"
"$MYSQL" \
  --ssl \
  -h "$PROD_HOST" \
  -P "$PROD_PORT" \
  -u root --password="$PROD_DB_PASSWORD" \
  -e "DROP DATABASE IF EXISTS railway; CREATE DATABASE railway;"

echo "\n[3/5] Importando dump en PRODUCCION"
"$MYSQL" \
  --ssl \
  -h "$PROD_HOST" \
  -P "$PROD_PORT" \
  -u root --password="$PROD_DB_PASSWORD" railway \
  < "$DUMP_PATH"

echo "\n[4/5] DROP+CREATE railway en INTEGRACION"
"$MYSQL" \
  --ssl \
  -h "$INT_HOST" \
  -P "$INT_PORT" \
  -u root --password="$INT_DB_PASSWORD" \
  -e "DROP DATABASE IF EXISTS railway; CREATE DATABASE railway;"

echo "\n[5/5] Importando dump en INTEGRACION"
"$MYSQL" \
  --ssl \
  -h "$INT_HOST" \
  -P "$INT_PORT" \
  -u root --password="$INT_DB_PASSWORD" railway \
  < "$DUMP_PATH"

echo "\nOK: dump exportado e importado en production e integration."
