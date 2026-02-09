#!/bin/bash

# Default paths if env vars are not set
DB_PATH=${DB_PATH:-./db/stocks.db}
SQL_PATH=${SQL_CREATE_TABLE_PATH:-./sql/create_portfolio_table.sql}
RESET_DB=${RESET_DB:-false}

# Check if the database file already exists
if [ "$RESET_DB" = "true" ]; then
    echo "Resetting database at $DB_PATH."
    sqlite3 "$DB_PATH" < "$SQL_PATH"
    echo "Database reset successfully."
elif [ -f "$DB_PATH" ]; then
    echo "Database already exists at $DB_PATH. Skipping creation."
else
    echo "Creating database at $DB_PATH."
    sqlite3 "$DB_PATH" < "$SQL_PATH"
    echo "Database created successfully."
fi
