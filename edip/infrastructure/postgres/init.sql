-- Initialization script for PostgreSQL
-- Creates necessary schemas and enables required extensions

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- pgvector extension for dense vectors (if used in PostgreSQL instead of Chroma)

-- Set up schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS documents;
CREATE SCHEMA IF NOT EXISTS audit;

-- Note: Tables are created by SQLAlchemy/Alembic migrations.
-- This script ensures the foundational extensions and schemas exist.

-- Create read-only role for analytics
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'analytics_readonly') THEN
      CREATE ROLE analytics_readonly LOGIN PASSWORD 'analytics_password';
   END IF;
END
$do$;

GRANT USAGE ON SCHEMA auth TO analytics_readonly;
GRANT USAGE ON SCHEMA documents TO analytics_readonly;
GRANT USAGE ON SCHEMA audit TO analytics_readonly;

-- In a production environment, you would also set up Row-Level Security (RLS)
-- policies here or via Alembic to strictly isolate tenant data.
