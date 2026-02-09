#!/bin/bash
set -e

DB_PATH=${DB_PATH:-/tmp/stocks.db}
DB_DIR=$(dirname "$DB_PATH")

if ! mkdir -p "$DB_DIR" 2>/dev/null; then
  echo "Warning: cannot write to $DB_DIR. Falling back to /tmp/stocks.db"
  DB_PATH=/tmp/stocks.db
  export DB_PATH
  mkdir -p /tmp
fi

if [ "${CREATE_DB:-false}" = "true" ]; then
  bash sql/create_db.sh
fi

exec gunicorn app:app --bind 0.0.0.0:${PORT:-8000}
