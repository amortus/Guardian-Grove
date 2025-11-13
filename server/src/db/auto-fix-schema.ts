/**
 * Auto-fix Schema - Garante que colunas necessárias existem
 * Roda automaticamente quando o servidor inicia
 */

import { query } from './connection';

export async function autoFixSchema(): Promise<void> {
  try {
    console.log('[DB] 🔧 Verificando schema do banco de dados...');
    
    // Verificar se current_action existe
    const checkColumn = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'beasts' AND column_name = 'current_action';
    `);
    
    if (checkColumn.rows.length === 0) {
      console.log('[DB] ⚠️ Coluna current_action não existe. Criando...');
      
      // Criar current_action e outras colunas necessárias
      await query(`
        ALTER TABLE beasts
        ADD COLUMN IF NOT EXISTS current_action JSONB DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS last_exploration BIGINT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS exploration_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_tournament BIGINT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS birth_date BIGINT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS last_update BIGINT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS work_bonus_count INTEGER DEFAULT 0;
      `);
      
      console.log('[DB] ✅ Colunas criadas com sucesso!');
      
      // Criar índices
      await query(`
        CREATE INDEX IF NOT EXISTS idx_beasts_current_action ON beasts USING GIN (current_action);
      `);
      await query(`
        CREATE INDEX IF NOT EXISTS idx_beasts_last_exploration ON beasts(last_exploration);
      `);
      await query(`
        CREATE INDEX IF NOT EXISTS idx_beasts_last_tournament ON beasts(last_tournament);
      `);
      await query(`
        CREATE INDEX IF NOT EXISTS idx_beasts_birth_date ON beasts(birth_date);
      `);
      
      console.log('[DB] ✅ Índices criados com sucesso!');
    } else {
      console.log('[DB] ✅ Schema está correto!');
    }
    
    // Atualizar birth_date para bestas existentes que não têm
    await query(`
      UPDATE beasts
      SET birth_date = EXTRACT(EPOCH FROM created_at) * 1000
      WHERE birth_date IS NULL;
    `);
    
    // Atualizar last_update para bestas existentes
    await query(`
      UPDATE beasts
      SET last_update = EXTRACT(EPOCH FROM NOW()) * 1000
      WHERE last_update IS NULL;
    `);
    
    console.log('[DB] ✅ Auto-fix concluído!');
    
  } catch (error: any) {
    console.error('[DB] ❌ Erro ao verificar/corrigir schema:', error.message);
    // Não lançar erro - deixar servidor continuar mesmo se falhar
  }
}

