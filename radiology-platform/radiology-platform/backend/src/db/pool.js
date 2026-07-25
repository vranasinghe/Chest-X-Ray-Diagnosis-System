import pg from 'pg';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/radiology';

const ssl = (connectionString.includes('sslmode=require') || connectionString.includes('neon.tech'))
  ? { rejectUnauthorized: false }
  : false;

export const pool = new Pool({
  connectionString,
  ssl,
});

export const query = (text, params) => pool.query(text, params);

