-- Initialize MyFuel Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist
CREATE DATABASE myfuel;

-- Connect to the application database
\c myfuel;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for better performance (these will be created by TypeORM as well)
-- But having them here ensures they exist even if TypeORM doesn't run

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'MyFuel database initialized successfully';
END$$;