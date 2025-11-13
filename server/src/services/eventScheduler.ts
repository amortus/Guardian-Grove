/**
 * Event Scheduler Service
 * Gerencia eventos baseados em tempo (ciclo diário, eventos de calendário, etc)
 * Guardian Grove Server
 */

import { query } from '../db/connection';

// ===== UTILITÁRIOS DE TEMPO =====

// Cache para evitar múltiplas chamadas à API
let lastAPICall: number = 0;
const API_CACHE_DURATION = 60 * 60 * 1000; // 1 hora

/**
 * Retorna hora atual (usa servidor local, mais confiável que API externa)
 * Evita rate limiting e problemas de rede
 * 
 * O servidor Railway sincroniza automaticamente via NTP (Network Time Protocol)
 * E o JavaScript converte para Brasília usando Intl.DateTimeFormat
 */
function getBrasiliaTime(): Date {
  const now = new Date();
  
  // Log para debug (pode remover depois)
  const brasiliaStr = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const utcStr = now.toISOString();
  console.log(`[Time] UTC: ${utcStr} | Brasília: ${brasiliaStr}`);
  
  return now;
}

/**
 * Calcula o timestamp da meia-noite de hoje (timezone de Brasília)
 * Retorna timestamp UTC da meia-noite (00:00:00) em Brasília
 */
function getMidnightTimestamp(): number {
  const now = getBrasiliaTime();
  
  // Obter data em Brasília usando formatação com timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const dateStr = formatter.format(now);
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Método mais confiável: usar Intl para obter offset exato de Brasília
  // Criar uma data de teste para calcular offset
  const testDate = new Date();
  const utcStr = testDate.toLocaleString('en-US', { timeZone: 'UTC' });
  const brasiliaStr = testDate.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  
  // Converter para Date objects e calcular diferença em ms
  const utcDate = new Date(utcStr);
  const brasiliaDate = new Date(brasiliaStr);
  const offsetMs = utcDate.getTime() - brasiliaDate.getTime();
  
  // Criar meia-noite em Brasília (00:00:00 local)
  const midnightBrasilia = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`);
  
  // Converter para UTC aplicando o offset
  const midnightUTC = midnightBrasilia.getTime() - offsetMs;
  
  return midnightUTC;
}

/**
 * Obtém a data atual em Brasília (ano, mês, dia)
 */
function getBrasiliaDate(): { year: number; month: number; day: number } {
  const now = new Date();
  const brasiliaStr = now.toLocaleString('en-CA', { 
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const [year, month, day] = brasiliaStr.split('-').map(Number);
  return { year, month, day };
}

// ===== PROCESSAMENTO DE CICLO DIÁRIO =====

/**
 * Processa o ciclo diário para todas as bestas ativas
 */
async function processDailyCycle() {
  try {
    console.log('[EventScheduler] Processing daily cycle...');
    
    // Verificar se as colunas necessárias existem
    const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'beasts' 
      AND column_name IN (
        'age_in_days',
        'last_day_processed',
        'last_update',
        'max_age_weeks',
        'daily_training_count',
        'daily_potion_used',
        'exploration_count'
      )
    `);
    
    const availableColumns = columnCheck.rows.map(r => r.column_name);
    const hasAgeInDays = availableColumns.includes('age_in_days');
    const hasLastDayProcessed = availableColumns.includes('last_day_processed');
    const hasLastUpdate = availableColumns.includes('last_update');
    const hasMaxAge = availableColumns.includes('max_age_weeks');
    const hasDailyTrainingCount = availableColumns.includes('daily_training_count');
    const hasDailyPotionUsed = availableColumns.includes('daily_potion_used');
    const hasExplorationCount = availableColumns.includes('exploration_count');
    
    console.log('[EventScheduler] Available columns:', {
      hasAgeInDays,
      hasLastDayProcessed,
      hasLastUpdate,
      hasMaxAge,
      hasDailyTrainingCount,
      hasDailyPotionUsed,
      hasExplorationCount,
    });
    
    // Se não tem as colunas necessárias, pular processamento
    if (!hasAgeInDays || !hasLastDayProcessed) {
      console.log('[EventScheduler] Daily cycle columns not available, skipping...');
      return;
    }
    
    const midnightTimestamp = getMidnightTimestamp();
    const now = Date.now();
    
    // Buscar todas as bestas ativas que ainda não foram processadas hoje
    const beastsResult = await query(
      `SELECT id, age_in_days, last_day_processed, ${hasMaxAge ? 'max_age_weeks' : 'NULL as max_age_weeks'}
       FROM beasts
       WHERE is_active = true
       AND (last_day_processed IS NULL OR last_day_processed < $1)`,
      [midnightTimestamp]
    );
    
    if (beastsResult.rows.length === 0) {
      console.log('[EventScheduler] No beasts need daily cycle processing');
      return;
    }
    
    console.log(`[EventScheduler] Processing ${beastsResult.rows.length} beasts...`);
    
    let processedCount = 0;
    let diedCount = 0;
    
    for (const beast of beastsResult.rows) {
      const currentAgeInDays = beast.age_in_days || 0;
      // max_age_weeks está em semanas, converter para dias (365 dias padrão se não tiver)
      const maxAgeWeeks = beast.max_age_weeks || 52;
      const maxAgeDays = maxAgeWeeks * 7;
      const newAgeInDays = currentAgeInDays + 1;
      const isAlive = newAgeInDays < maxAgeDays;
      
      // Construir UPDATE dinamicamente
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 2;
      
      updateFields.push(`age_in_days = $${paramIndex++}`);
      updateValues.push(newAgeInDays);
      
      updateFields.push(`last_day_processed = $${paramIndex++}`);
      updateValues.push(midnightTimestamp);
      
      if (hasLastUpdate) {
        updateFields.push(`last_update = $${paramIndex++}`);
        updateValues.push(now);
      }
      
      // NOVO: Resetar limites diários à meia-noite de Brasília
      if (hasDailyTrainingCount) {
        updateFields.push('daily_training_count = 0');
      }

      if (hasDailyPotionUsed) {
        updateFields.push('daily_potion_used = false');
      }

      if (hasExplorationCount) {
        updateFields.push('exploration_count = 0');
      }
      
      if (!isAlive) {
        updateFields.push('is_active = false');
        console.log(`[EventScheduler] Beast ${beast.id} died at age ${newAgeInDays} (max: ${maxAgeDays})`);
        diedCount++;
      } else {
        processedCount++;
      }
      
      await query(
        `UPDATE beasts
         SET ${updateFields.join(', ')}
         WHERE id = $1`,
        [beast.id, ...updateValues]
      );
    }
    
    console.log(`[EventScheduler] Daily cycle complete: ${processedCount} aged, ${diedCount} died`);
    console.log(`[EventScheduler] Reset daily limits (training, potion, exploration) for all beasts`);
    
  } catch (error) {
    console.error('[EventScheduler] Daily cycle error:', error);
  }
}

// ===== EVENTOS DE CALENDÁRIO =====

/**
 * Define eventos especiais do calendário
 */
interface CalendarEvent {
  name: string;
  month: number;  // 1-12
  day: number;    // 1-31
  handler: () => Promise<void>;
}

/**
 * Exemplo: Evento de Natal (25 de dezembro)
 */
async function handleChristmasEvent() {
  try {
    console.log('[EventScheduler] 🎄 Processing Christmas event...');
    const { year, month, day } = getBrasiliaDate();
    
    // Verificar se já processamos hoje
    const checkResult = await query(
      `SELECT id FROM calendar_events_log
       WHERE event_name = $1
       AND event_date = $2`,
      ['christmas', `${year}-${month}-${day}`]
    );
    
    if (checkResult.rows.length > 0) {
      console.log('[EventScheduler] Christmas event already processed today');
      return;
    }
    
    // Buscar todos os jogadores ativos
    const playersResult = await query(
      `SELECT DISTINCT gs.user_id, gs.player_name
       FROM game_saves gs
       INNER JOIN beasts b ON b.game_save_id = gs.id
       WHERE b.is_active = true`
    );
    
    console.log(`[EventScheduler] Giving Christmas gift to ${playersResult.rows.length} players...`);
    
    // Dar presente para cada jogador (exemplo: 1000 coronas + item especial)
    for (const player of playersResult.rows) {
      // Adicionar coronas
      await query(
        `UPDATE game_saves
         SET coronas = coronas + 1000
         WHERE user_id = $1`,
        [player.user_id]
      );
      
      // Aqui você pode adicionar itens especiais ao inventário também
      console.log(`[EventScheduler] Gift given to ${player.player_name}`);
    }
    
    // Notificar jogadores online sobre o evento
    try {
      const { notifyOnlineUsers } = await import('./chatService');
      notifyOnlineUsers({
        channel: 'system',
        message: '🎄 Feliz Natal! Todos os jogadores receberam 1000 coronas como presente especial!',
        color: '#FFD700',
      });
    } catch (error: any) {
      console.warn('[EventScheduler] Could not notify online users:', error?.message);
    }
    
    // Registrar evento como processado
    await query(
      `INSERT INTO calendar_events_log (event_name, event_date, processed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (event_name, event_date) DO NOTHING`,
      ['christmas', `${year}-${month}-${day}`]
    );
    
    console.log('[EventScheduler] 🎄 Christmas event completed!');
    
  } catch (error) {
    console.error('[EventScheduler] Christmas event error:', error);
  }
}

/**
 * Lista de eventos de calendário
 */
const calendarEvents: CalendarEvent[] = [
  {
    name: 'christmas',
    month: 12,
    day: 25,
    handler: handleChristmasEvent,
  },
  // Adicione mais eventos aqui
  // {
  //   name: 'new_year',
  //   month: 1,
  //   day: 1,
  //   handler: handleNewYearEvent,
  // },
];

/**
 * Processa eventos de calendário para a data atual
 */
async function processCalendarEvents() {
  try {
    const { year, month, day } = getBrasiliaDate();
    
    console.log(`[EventScheduler] Checking calendar events for ${day}/${month}/${year}...`);
    
    for (const event of calendarEvents) {
      if (event.month === month && event.day === day) {
        console.log(`[EventScheduler] Processing event: ${event.name}`);
        await event.handler();
      }
    }
    
  } catch (error) {
    console.error('[EventScheduler] Calendar events error:', error);
  }
}

// ===== SCHEDULER PRINCIPAL =====

let midnightTimeout: NodeJS.Timeout | null = null;
let lastProcessedMidnight: number = 0;
let chatCleanupInterval: NodeJS.Timeout | null = null;
let isProcessingCycle: boolean = false; // Flag para evitar processamento duplicado

/**
 * Função para limpar o scheduler (útil para testes ou shutdown)
 */
export function stopEventScheduler() {
  if (midnightTimeout) {
    clearTimeout(midnightTimeout);
    midnightTimeout = null;
  }
  if (chatCleanupInterval) {
    clearInterval(chatCleanupInterval);
    chatCleanupInterval = null;
  }
  console.log('[EventScheduler] Event scheduler stopped');
}

/**
 * Calcula o timestamp da próxima meia-noite (Brasília)
 * SEMPRE retorna um horário no futuro
 */
function getNextMidnightTimestamp(): number {
  const now = Date.now();
  const todayMidnight = getMidnightTimestamp();
  
  // Se já passou a meia-noite de hoje (ou está muito próximo - 1 minuto), retornar amanhã
  if (now >= (todayMidnight - 60000)) {
    // Adicionar 24 horas para garantir que estamos no futuro
    return todayMidnight + (24 * 60 * 60 * 1000);
  }
  
  return todayMidnight;
}

/**
 * Agenda o próximo processamento de ciclo diário
 * COM PROTEÇÃO CONTRA LOOP INFINITO
 */
function scheduleNextMidnight() {
  // Limpar timeout anterior se existir
  if (midnightTimeout) {
    clearTimeout(midnightTimeout);
    midnightTimeout = null;
  }
  
  const nextMidnight = getNextMidnightTimestamp();
  const now = Date.now();
  const msUntilMidnight = nextMidnight - now;
  
  // PROTEÇÃO: Se o tempo até meia-noite for menor que 5 minutos, aguardar 5 minutos
  const safeDelay = Math.max(msUntilMidnight, 5 * 60 * 1000);
  
  const minutesUntil = Math.floor(safeDelay / 1000 / 60);
  const nextMidnightDate = new Date(nextMidnight);
  const nextMidnightStr = nextMidnightDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  
  console.log(`[EventScheduler] ⏰ Next daily cycle scheduled in ${minutesUntil} minutes (at ${nextMidnightStr})`);
  
  midnightTimeout = setTimeout(async () => {
    // PROTEÇÃO: Evitar processamento duplicado
    if (isProcessingCycle) {
      console.log('[EventScheduler] ⚠️ Cycle already processing, skipping...');
      scheduleNextMidnight(); // Reagendar
      return;
    }
    
    try {
      isProcessingCycle = true;
      const currentMidnight = getMidnightTimestamp();
      
      // PROTEÇÃO: Só processar se não processamos hoje ainda
      if (lastProcessedMidnight >= currentMidnight) {
        console.log('[EventScheduler] ⚠️ Cycle already processed today, skipping...');
        isProcessingCycle = false;
        scheduleNextMidnight();
        return;
      }
      
      // Processar ciclo diário de todas as bestas
      await processDailyCycle();
      
      // Processar eventos de calendário
      await processCalendarEvents();
      
      // Limpar mensagens antigas do chat (manter apenas últimas 100 por canal)
      try {
        const { cleanupOldChatMessages } = await import('./chatService');
        await cleanupOldChatMessages();
      } catch (error: any) {
        // Se o módulo não estiver disponível, apenas logar
        console.warn('[EventScheduler] Chat cleanup not available:', error?.message);
      }
      
      lastProcessedMidnight = currentMidnight;
      
      // Agendar próxima meia-noite
      scheduleNextMidnight();
      
    } catch (error) {
      console.error('[EventScheduler] ❌ Midnight processing error:', error);
      // Reagendar mesmo em caso de erro
      scheduleNextMidnight();
    } finally {
      isProcessingCycle = false;
    }
  }, safeDelay);
}

/**
 * Inicia o scheduler de eventos
 * Usa alarmes baseados em timeout ao invés de polling
 * COM PROTEÇÕES CONTRA LOOP E RATE LIMITING
 */
export function startEventScheduler() {
  console.log('[EventScheduler] 🚀 Starting event scheduler (alarm-based)...');
  
  // Processar imediatamente se já passou meia-noite e ainda não processamos hoje
  const now = Date.now();
  const todayMidnight = getMidnightTimestamp();
  
  if (now >= todayMidnight && lastProcessedMidnight < todayMidnight && !isProcessingCycle) {
    console.log('[EventScheduler] 📅 Processing missed daily cycle...');
    isProcessingCycle = true;
    processDailyCycle().then(() => {
      lastProcessedMidnight = todayMidnight;
      isProcessingCycle = false;
      scheduleNextMidnight();
    }).catch((error) => {
      console.error('[EventScheduler] ❌ Initial processing error:', error);
      isProcessingCycle = false;
      scheduleNextMidnight();
    });
  } else {
    // Agendar próxima meia-noite
    scheduleNextMidnight();
  }
  
  // Processar eventos de calendário imediatamente ao iniciar
  processCalendarEvents().catch(error => {
    console.error('[EventScheduler] ❌ Initial calendar events error:', error);
  });
  
  // PERFORMANCE: Limpar mensagens antigas do chat a cada 1 hora (ao invés de apenas meia-noite)
  chatCleanupInterval = setInterval(async () => {
    try {
      const { cleanupOldChatMessages } = await import('./chatService');
      await cleanupOldChatMessages();
    } catch (error: any) {
      console.error('[EventScheduler] ❌ Hourly chat cleanup error:', error?.message || error);
    }
  }, 60 * 60 * 1000); // A cada 1 hora
  
  console.log('[EventScheduler] ✅ Event scheduler started');
  console.log('[EventScheduler] 🧹 Chat cleanup scheduled every 1 hour');
}

/**
 * Processa ciclo diário manualmente (para testes ou chamadas externas)
 */
export async function triggerDailyCycle() {
  await processDailyCycle();
}

/**
 * Processa eventos de calendário manualmente (para testes)
 */
export async function triggerCalendarEvents() {
  await processCalendarEvents();
}

