/**
 * Run Friends Migration
 * Execute apenas a migration 008_friends_system.sql
 */

import { pool } from './connection';
import fs from 'fs';
import path from 'path';

async function runFriendsMigration() {
  console.log('[Migration] Running friends migration...');
  
  const migrationFile = path.join(__dirname, 'migrations', '008_friends_system.sql');
  
  if (!fs.existsSync(migrationFile)) {
    console.error('[Migration] Migration file not found:', migrationFile);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationFile, 'utf8');
  
  try {
    await pool.query(sql);
    console.log('[Migration] ✓ Friends migration completed successfully!');
    process.exit(0);
  } catch (error: any) {
    // Se a tabela já existe, não é um erro crítico
    if (error.code === '42P07' || error.message?.includes('already exists')) {
      console.log('[Migration] ✓ Friends table already exists, skipping...');
      process.exit(0);
    }
    
    console.error('[Migration] ✗ Friends migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runFriendsMigration();

