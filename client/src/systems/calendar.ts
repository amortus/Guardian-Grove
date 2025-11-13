/**
 * Sistema de calendário semanal
 */

import type { WeeklyAction, Beast } from '../types';
import { applyGrowth, ageBeast, addLifeEvent, addFatigue, addStress, reduceFatigue, reduceStress } from './beast';

export interface ActionResult {
  success: boolean;
  message: string;
  attributeGains?: Record<string, number>;
  fatigueChange?: number;
  stressChange?: number;
  moneyGain?: number;
}

/**
 * Verifica se pode treinar (limite diário)
 * NOTA: Reset é feito pelo servidor no ciclo diário à meia-noite de Brasília
 */
function canTrain(beast: Beast): { can: boolean; reason?: string; remaining?: number } {
  const trainingCount = beast.dailyTrainingCount || 0;
  const limit = 5;
  
  if (trainingCount >= limit) {
    return {
      can: false,
      reason: `Limite de ${limit} treinos diários atingido! Use uma Poção de Vigor Renovado ou aguarde até amanhã.`,
      remaining: 0,
    };
  }
  
  return {
    can: true,
    remaining: limit - trainingCount,
  };
}

/**
 * Executa uma ação de treino
 */
function executeTraining(
  beast: Beast,
  attribute: 'might' | 'wit' | 'focus' | 'agility' | 'ward' | 'vitality',
  week: number
): ActionResult {
  const attributeNames = {
    might: 'Força',
    wit: 'Astúcia',
    focus: 'Foco',
    agility: 'Agilidade',
    ward: 'Resistência',
    vitality: 'Vitalidade',
  };

  // NOVO: Verifica limite diário de treinos
  const trainingCheck = canTrain(beast);
  if (!trainingCheck.can) {
    return {
      success: false,
      message: trainingCheck.reason || 'Não pode treinar agora.',
    };
  }

  // Verifica se já está muito cansado
  if (beast.secondaryStats.fatigue > 80) {
    return {
      success: false,
      message: `${beast.name} está muito cansado para treinar. Descanse primeiro!`,
    };
  }

  if (beast.secondaryStats.stress > 80) {
    return {
      success: false,
      message: `${beast.name} está muito estressado para treinar efetivamente.`,
    };
  }

  // Intensidade baseada em fadiga/stress
  const fatigueModifier = 1 - (beast.secondaryStats.fatigue / 200);
  const stressModifier = 1 - (beast.secondaryStats.stress / 200);
  const intensity = Math.max(0.3, fatigueModifier * stressModifier);

  // Aplica crescimento
  const growth = applyGrowth(beast, attribute, intensity);

  // Custo de treino
  const fatigueGain = Math.floor(15 * (1 + Math.random() * 0.5));
  const stressGain = Math.floor(8 * (1 + Math.random() * 0.5));

  addFatigue(beast, fatigueGain);
  addStress(beast, stressGain);

  // NOVO: Incrementa contador de treinos diários
  beast.dailyTrainingCount = (beast.dailyTrainingCount || 0) + 1;
  const remaining = 5 - beast.dailyTrainingCount;
  console.log(`[DailyLimit] 🏋️ Treino realizado! Restantes hoje: ${remaining}/5`);

  // Adiciona evento
  addLifeEvent(
    beast,
    week,
    'training',
    `Treinou ${attributeNames[attribute]} (+${growth})`
  );

  return {
    success: true,
    message: `${beast.name} treinou ${attributeNames[attribute]}! (${remaining}/5 treinos restantes hoje)`,
    attributeGains: { [attribute]: growth },
    fatigueChange: fatigueGain,
    stressChange: stressGain,
  };
}

/**
 * Executa uma ação de trabalho
 */
function executeWork(
  beast: Beast,
  workType: 'warehouse' | 'farm' | 'guard' | 'library',
  week: number
): ActionResult {
  const workData = {
    warehouse: { name: 'Armazém', money: 300, fatigue: 20, stress: 10 },
    farm: { name: 'Fazenda', money: 400, fatigue: 25, stress: 15 },
    guard: { name: 'Guarda Noturna', money: 500, fatigue: 30, stress: 20 },
    library: { name: 'Biblioteca', money: 350, fatigue: 10, stress: 12 },
  };

  const work = workData[workType];

  // Verifica condição
  if (beast.secondaryStats.fatigue > 70) {
    return {
      success: false,
      message: `${beast.name} está muito cansado para trabalhar.`,
    };
  }

  addFatigue(beast, work.fatigue);
  addStress(beast, work.stress);

  addLifeEvent(
    beast,
    week,
    'work',
    `Trabalhou no ${work.name} (${work.money} Coronas)`
  );

  return {
    success: true,
    message: `${beast.name} trabalhou no ${work.name}!`,
    moneyGain: work.money,
    fatigueChange: work.fatigue,
    stressChange: work.stress,
  };
}

/**
 * Executa uma ação de descanso
 */
function executeRest(
  beast: Beast,
  restType: 'sleep' | 'freetime' | 'walk' | 'eat',
  week: number
): ActionResult {
  const restData = {
    sleep: { name: 'Dormir', fatigue: -40, stress: -10 },
    freetime: { name: 'Tempo Livre', fatigue: -20, stress: -30 },
    walk: { name: 'Passeio', fatigue: -15, stress: -35 },
    eat: { name: 'Comer Bem', fatigue: -25, stress: -15 },
  };

  const rest = restData[restType];

  reduceFatigue(beast, -rest.fatigue);
  reduceStress(beast, -rest.stress);

  let additionalMessage = '';

  // Dormir recupera HP e Essência
  if (restType === 'sleep') {
    const hpRecover = Math.floor(beast.maxHp * 0.5); // Recupera 50% do HP máximo
    const essenceRecover = Math.floor(beast.maxEssence * 0.5); // Recupera 50% da Essência máxima
    
    beast.currentHp = Math.min(beast.maxHp, beast.currentHp + hpRecover);
    beast.essence = Math.min(beast.maxEssence, beast.essence + essenceRecover);
    
    additionalMessage = ` (+${hpRecover}HP, +${essenceRecover} Essência)`;
  }

  // Tempo Livre melhora o humor
  if (restType === 'freetime') {
    // Melhora o humor
    if (beast.mood === 'sad' || beast.mood === 'angry') {
      beast.mood = 'neutral';
      additionalMessage = ' (Humor melhorou para Neutro)';
    } else if (beast.mood === 'neutral' || beast.mood === 'tired') {
      beast.mood = 'happy';
      additionalMessage = ' (Humor melhorou para Feliz 😊)';
    }
  }

  // Passeio aumenta Lealdade
  if (restType === 'walk') {
    const loyaltyGain = 8;
    beast.secondaryStats.loyalty = Math.min(100, beast.secondaryStats.loyalty + loyaltyGain);
    additionalMessage = ` (Lealdade +${loyaltyGain})`;
  }

  // Comer Bem recupera HP
  if (restType === 'eat') {
    const hpRecover = Math.floor(beast.maxHp * 0.3); // Recupera 30% do HP máximo
    beast.currentHp = Math.min(beast.maxHp, beast.currentHp + hpRecover);
    additionalMessage = ` (+${hpRecover}HP, bem alimentado)`;
  }

  addLifeEvent(
    beast,
    week,
    'rest',
    `Descansou: ${rest.name}${additionalMessage}`
  );

  return {
    success: true,
    message: `${beast.name} descansou (${rest.name})!${additionalMessage}`,
    fatigueChange: rest.fatigue,
    stressChange: rest.stress,
  };
}

/**
 * Executa uma ação semanal
 */
export function executeAction(beast: Beast, action: WeeklyAction, week: number): ActionResult {
  // Treinos
  if (action === 'train_might') return executeTraining(beast, 'might', week);
  if (action === 'train_wit') return executeTraining(beast, 'wit', week);
  if (action === 'train_focus') return executeTraining(beast, 'focus', week);
  if (action === 'train_agility') return executeTraining(beast, 'agility', week);
  if (action === 'train_ward') return executeTraining(beast, 'ward', week);
  if (action === 'train_vitality') return executeTraining(beast, 'vitality', week);

  // Trabalhos
  if (action === 'work_warehouse') return executeWork(beast, 'warehouse', week);
  if (action === 'work_farm') return executeWork(beast, 'farm', week);
  if (action === 'work_guard') return executeWork(beast, 'guard', week);
  if (action === 'work_library') return executeWork(beast, 'library', week);

  // Descansos
  if (action === 'rest_sleep') return executeRest(beast, 'sleep', week);
  if (action === 'rest_freetime') return executeRest(beast, 'freetime', week);
  if (action === 'rest_walk') return executeRest(beast, 'walk', week);
  if (action === 'rest_eat') return executeRest(beast, 'eat', week);

  // Outras ações (implementar depois)
  if (action === 'tournament') {
    return {
      success: false,
      message: 'Torneios ainda não implementados',
    };
  }

  if (action === 'exploration') {
    return {
      success: false,
      message: 'Exploração ainda não implementada',
    };
  }

  return {
    success: false,
    message: 'Ação desconhecida',
  };
}

/**
 * Avança uma semana completa
 */
export function advanceWeek(beast: Beast, action: WeeklyAction, week: number): ActionResult {
  // Executa a ação
  const result = executeAction(beast, action, week);

  // Envelhece a besta
  ageBeast(beast);

  return result;
}

