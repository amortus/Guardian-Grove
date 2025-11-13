/**
 * Database Migration Runner
 * Guardian Grove Server
 */

import fs from 'fs';
import path from 'path';
import { pool } from './connection';

async function runMigrations() {
  console.log('[Migration] Starting database migrations...');
  
  const migrationsDir = path.join(__dirname, 'migrations');
  const allMigrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  const cliArg = process.argv[2];
  const specificMigration = process.env.MIGRATION_FILE || cliArg;
  if (specificMigration) {
    console.log(`[Migration] Filtering by file: ${specificMigration}`);
  }
  const migrationFiles = specificMigration
    ? allMigrationFiles.filter(file => file === specificMigration)
    : allMigrationFiles;

  if (migrationFiles.length === 0) {
    if (specificMigration) {
      console.log(`[Migration] Migration file "${specificMigration}" not found`);
    } else {
      console.log('[Migration] No migration files found');
    }
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS migration_history (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  for (const file of migrationFiles) {
    const alreadyRan = await pool.query(
      'SELECT 1 FROM migration_history WHERE filename = $1',
      [file]
    );

    if (alreadyRan.rowCount > 0) {
      console.log(`[Migration] Skipping ${file} (already applied)`);
      continue;
    }

    console.log(`[Migration] Running ${file}...`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      await pool.query('BEGIN');
      await pool.query(sql);
      await pool.query(
        'INSERT INTO migration_history (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
        [file]
      );
      await pool.query('COMMIT');
      console.log(`[Migration] ✓ ${file} completed successfully`);
    } catch (error) {
      await pool.query('ROLLBACK');
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

