import { pool, query } from './connection';

async function wipeDatabase() {
  console.log('[DB] Starting full wipe of public schema tables...');

  await query(`
    DO $$
    DECLARE
      rec RECORD;
    BEGIN
      FOR rec IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename NOT LIKE 'pg_%'
          AND tablename NOT LIKE 'sql_%'
      ) LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(rec.tablename) || ' RESTART IDENTITY CASCADE';
      END LOOP;
    END $$;
  `);

  console.log('[DB] Wipe completed. All tables truncated.');

  await pool.end();
  console.log('[DB] Connection pool closed.');
}

wipeDatabase().catch((error) => {
  console.error('[DB] Failed to wipe database', error);
  process.exit(1);
});
