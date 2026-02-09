#!/bin/bash
set -e

if [ "${CREATE_DB:-false}" = "true" ]; then
  bash sql/create_db.sh
fi

exec gunicorn app:app --bind 0.0.0.0:${PORT:-8000}
