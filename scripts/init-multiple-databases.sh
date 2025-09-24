#!/bin/bash
set -e

# Create multiple databases for different services
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE cart_service;
    CREATE DATABASE order_service;
    CREATE DATABASE review_service;
    
    -- Grant permissions
    GRANT ALL PRIVILEGES ON DATABASE cart_service TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE order_service TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE review_service TO $POSTGRES_USER;
EOSQL

echo "Multiple databases created successfully!"
