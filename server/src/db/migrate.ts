/**
 * Database Migration Runner
 * Guardian Grove Server
 */

import { pool } from './connection';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  console.log('[Migration] Starting database migrations...');
  
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    console.log('[Migration] No migration files found');
    return;
  }

  for (const file of migrationFiles) {
    console.log(`[Migration] Running ${file}...`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      await pool.query(sql);
      console.log(`[Migration] ✓ ${file} completed successfully`);
    } catch (error) {
      console.error(`[Migration] ✗ ${file} failed:`, error);
      throw error;
    }
  }

  console.log('[Migration] All migrations completed successfully!');
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('[Migration] Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Migration] Failed:', error);
      process.exit(1);
    });
}

export { runMigrations };

