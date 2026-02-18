#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$BACKEND_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$BACKEND_DIR/.env"
  set +a
fi

if [ -f "$BACKEND_DIR/.env.local" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$BACKEND_DIR/.env.local"
  set +a
fi

: "${AUTH_JWT_SECRET:?AUTH_JWT_SECRET is required}"
: "${ENCRYPTION_KEY:?ENCRYPTION_KEY is required (>=32 chars)}"

if [ "${#ENCRYPTION_KEY}" -lt 32 ]; then
  echo "ENCRYPTION_KEY must be at least 32 characters." >&2
  exit 1
fi

cd "$BACKEND_DIR"
mvn -DskipTests spring-boot:run
