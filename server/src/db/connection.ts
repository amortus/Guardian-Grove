/**
 * PostgreSQL Database Connection
 * Guardian Grove Server
 */

import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

// Test connection
pool.on('connect', () => {
  console.log('[DB] Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('[DB] Query executed', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('[DB] Query error', { text, error });
    throw error;
  }
}

// Helper to get a client from the pool for transactions
export async function getClient() {
  return await pool.connect();
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[DB] Closing database connections...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[DB] Closing database connections...');
  await pool.end();
  process.exit(0);
});

