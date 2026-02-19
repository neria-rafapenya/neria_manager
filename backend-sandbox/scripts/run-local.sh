#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SANDBOX_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$SANDBOX_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$SANDBOX_DIR/.env"
  set +a
fi

if [ -f "$SANDBOX_DIR/.env.local" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$SANDBOX_DIR/.env.local"
  set +a
fi

: "${AUTH_JWT_SECRET:?AUTH_JWT_SECRET is required}"
: "${DB_HOST:?DB_HOST is required}"
: "${DB_USER:?DB_USER is required}"
: "${DB_NAME:?DB_NAME is required}"

cd "$SANDBOX_DIR"

if [ -f package-lock.json ]; then
  npm run start:dev
else
  npm install
  npm run start:dev
fi
