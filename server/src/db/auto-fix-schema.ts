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
    
    const needsLegacyColumns = checkColumn.rows.length === 0;

    if (needsLegacyColumns) {
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
    }

    // Garantir colunas de limites diários (novas no Guardian Grove)
    await query(`
      ALTER TABLE beasts
      ADD COLUMN IF NOT EXISTS daily_training_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS daily_potion_used BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS exploration_count INTEGER DEFAULT 0;
    `);

    // Atualizar valores nulos para os novos campos
    await query(`
      UPDATE beasts
      SET daily_training_count = 0
      WHERE daily_training_count IS NULL;
    `);

    await query(`
      UPDATE beasts
      SET daily_potion_used = false
      WHERE daily_potion_used IS NULL;
    `);

    await query(`
      UPDATE beasts
      SET exploration_count = 0
      WHERE exploration_count IS NULL;
    `);

    if (!needsLegacyColumns) {
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

