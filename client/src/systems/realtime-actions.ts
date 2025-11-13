/**
 * Sistema de Ações em Tempo Real
 * Gerencia ações cronometradas que levam tempo real para completar
 */

import type { Beast, BeastAction, GameState } from '../types';
import { emitTrained, emitRested, emitWorked } from './game-events';

// ===== DURAÇÕES DAS AÇÕES =====

export const ACTION_DURATIONS = {
  // Treino - 1 minuto
  train_might: 1 * 60 * 1000,
  train_wit: 1 * 60 * 1000,
  train_focus: 1 * 60 * 1000,
  train_agility: 1 * 60 * 1000,
  train_ward: 1 * 60 * 1000,
  train_vitality: 1 * 60 * 1000,
  
  // Trabalho - 1.5 minutos
  work_warehouse: 90 * 1000,
  work_farm: 90 * 1000,
  work_guard: 90 * 1000,
  work_library: 90 * 1000,
  
  // Descanso
  rest_sleep: 2 * 60 * 1000,        // 2 minutos (o mais longo)
  rest_freetime: 1 * 60 * 1000,     // 1 minuto
  rest_walk: 1 * 60 * 1000,         // 1 minuto
  rest_eat: 1 * 60 * 1000,          // 1 minuto
  
  // Cooldowns especiais
  tournament_cooldown: 4 * 60 * 60 * 1000,  // 4 horas entre torneios
  exploration_cooldown: 2 * 60 * 60 * 1000, // 2 horas para resetar contador de explorações
} as const;

export const EXPLORATION_LIMIT = 10; // 10 explorações a cada 2 horas

// ===== FUNÇÕES DE AÇÃO =====

/**
 * Obtém duração de uma ação
 */
export function getDurationForAction(actionType: BeastAction['type']): number {
  return ACTION_DURATIONS[actionType] || 0;
}

/**
 * Inicia uma nova ação
 */
export function startAction(
  beast: Beast,
  actionType: BeastAction['type'],
  serverTime: number
): BeastAction {
  const duration = getDurationForAction(actionType);
  
  return {
    type: actionType,
    startTime: serverTime,
    duration,
    completesAt: serverTime + duration,
    canCancel: true,
  };
}

/**
 * Verifica se pode iniciar uma ação
 */
export function canStartAction(
  beast: Beast,
  actionType: BeastAction['type'] | string,
  serverTime: number
): {
  can: boolean;
  reason?: string;
  timeRemaining?: number;
} {
  // Verificar se já tem ação em andamento
  if (beast.currentAction && beast.currentAction.completesAt > serverTime) {
    return {
      can: false,
      reason: 'Besta ocupada em outra ação',
      timeRemaining: beast.currentAction.completesAt - serverTime,
    };
  }
  
  // Verificar cooldown de exploração
  if (actionType === 'exploration') {
    const count = beast.explorationCount || 0;
    const lastExploration = beast.lastExploration || 0;
    const cooldownEnd = lastExploration + ACTION_DURATIONS.exploration_cooldown;
    
    // Se já explorou 10 vezes e ainda está no cooldown
    if (count >= EXPLORATION_LIMIT && serverTime < cooldownEnd) {
      return {
        can: false,
        reason: `Limite de ${EXPLORATION_LIMIT} explorações atingido. Aguarde o cooldown.`,
        timeRemaining: cooldownEnd - serverTime,
      };
    }
  }
  
  // Verificar cooldown de torneio
  if (actionType === 'tournament') {
    const lastTournament = beast.lastTournament || 0;
    const cooldownEnd = lastTournament + ACTION_DURATIONS.tournament_cooldown;
    
    if (serverTime < cooldownEnd) {
      return {
        can: false,
        reason: 'Cooldown de torneio ativo. Aguarde para competir novamente.',
        timeRemaining: cooldownEnd - serverTime,
      };
    }
  }
  
  // Verificar fadiga para treino/trabalho
  if (actionType.startsWith('train_') || actionType.startsWith('work_')) {
    if (beast.secondaryStats.fatigue > 80) {
      return {
        can: false,
        reason: 'Besta muito cansada. Descanse primeiro!',
      };
    }
  }
  
  return { can: true };
}

/**
 * Completa uma ação e aplica recompensas
 */
export function completeAction(
  beast: Beast,
  gameState: GameState
): {
  success: boolean;
  message: string;
  rewards?: any;
} {
  const action = beast.currentAction;
  if (!action) {
    return {
      success: false,
      message: 'Nenhuma ação em progresso',
    };
  }
  
  // Aplicar recompensas baseado no tipo
  const result = applyActionRewards(beast, action, gameState);
  
  // Limpar ação
  beast.currentAction = undefined;
  
  // Atualizar cooldowns específicos
  if (action.type === 'tournament') {
    beast.lastTournament = Date.now();
  }
  
  if (action.type === 'exploration') {
    beast.explorationCount = (beast.explorationCount || 0) + 1;
    beast.lastExploration = Date.now();
  }
  
  return result;
}

/**
 * Cancela uma ação em progresso
 */
export function cancelAction(
  beast: Beast,
  serverTime: number
): {
  success: boolean;
  message: string;
  partialRewards?: any;
} {
  const action = beast.currentAction;
  if (!action) {
    return {
      success: false,
      message: 'Nenhuma ação para cancelar',
    };
  }
  
  // Calcular progresso
  const elapsed = serverTime - action.startTime;
  const progress = Math.min(elapsed / action.duration, 1);
  
  // Aplicar recompensas proporcionais
  const partialRewards = applyPartialRewards(beast, action, gameState, progress);
  
  // Limpar ação
  beast.currentAction = undefined;
  
  return {
    success: true,
    message: `Ação cancelada. Progresso: ${Math.floor(progress * 100)}%`,
    partialRewards,
  };
}

/**
 * Aplica recompensas quando ação é completada
 */
function applyActionRewards(
  beast: Beast,
  action: BeastAction,
  gameState: GameState
): {
  success: boolean;
  message: string;
} {
  switch (action.type) {
    // ===== TREINO =====
    case 'train_might':
      beast.attributes.might += Math.floor(Math.random() * 3) + 2;
      beast.secondaryStats.fatigue += 15;
      emitTrained(gameState, 'might');
      return { success: true, message: `💪 Treino completo! +${2}-${4} Força!` };
      
    case 'train_wit':
      beast.attributes.wit += Math.floor(Math.random() * 3) + 2;
      beast.secondaryStats.fatigue += 15;
      emitTrained(gameState, 'wit');
      return { success: true, message: `🧠 Treino completo! +${2}-${4} Astúcia!` };
      
    case 'train_focus':
      beast.attributes.focus += Math.floor(Math.random() * 3) + 2;
      beast.secondaryStats.fatigue += 15;
      emitTrained(gameState, 'focus');
      return { success: true, message: `🎯 Treino completo! +${2}-${4} Foco!` };
      
    case 'train_agility':
      beast.attributes.agility += Math.floor(Math.random() * 3) + 2;
      beast.secondaryStats.fatigue += 15;
      emitTrained(gameState, 'agility');
      return { success: true, message: `⚡ Treino completo! +${2}-${4} Agilidade!` };
      
    case 'train_ward':
      beast.attributes.ward += Math.floor(Math.random() * 3) + 2;
      beast.secondaryStats.fatigue += 15;
      emitTrained(gameState, 'ward');
      return { success: true, message: `🛡️ Treino completo! +${2}-${4} Resistência!` };
      
    case 'train_vitality':
      beast.attributes.vitality += Math.floor(Math.random() * 3) + 2;
      beast.secondaryStats.fatigue += 15;
      emitTrained(gameState, 'vitality');
      return { success: true, message: `❤️ Treino completo! +${2}-${4} Vitalidade!` };
    
    // ===== TRABALHO =====
    case 'work_warehouse':
      {
        const workBonusCount = beast.workBonusCount || 0;
        const canGetBonus = workBonusCount < 10;
        
        // 5% chance de +1 força ou resistência (apenas se não atingiu limite)
        const bonus = canGetBonus && Math.random() < 0.05;
        let bonusMsg = '';
        
        if (bonus) {
          const stat = Math.random() < 0.5 ? 'might' : 'ward';
          beast.attributes[stat] += 1;
          beast.workBonusCount = (beast.workBonusCount || 0) + 1;
          bonusMsg = ` +1 ${stat === 'might' ? 'Força' : 'Resistência'} bônus! (${beast.workBonusCount}/10)`;
        } else if (!canGetBonus) {
          bonusMsg = ' (Limite de bônus atingido)';
        }
        
        beast.secondaryStats.fatigue += 30;
        gameState.economy.coronas += 400;
        emitWorked(gameState, 'warehouse', 400);
        
        return {
          success: true,
          message: `📦 Trabalho completo! +400💰${bonusMsg}`,
        };
      }
      
    case 'work_farm':
      {
        const workBonusCount = beast.workBonusCount || 0;
        const canGetBonus = workBonusCount < 10;
        
        // 5% chance de +1 força ou vitalidade (apenas se não atingiu limite)
        const bonus = canGetBonus && Math.random() < 0.05;
        let bonusMsg = '';
        
        if (bonus) {
          const stat = Math.random() < 0.5 ? 'might' : 'vitality';
          beast.attributes[stat] += 1;
          beast.workBonusCount = (beast.workBonusCount || 0) + 1;
          bonusMsg = ` +1 ${stat === 'might' ? 'Força' : 'Vitalidade'} bônus! (${beast.workBonusCount}/10)`;
        } else if (!canGetBonus) {
          bonusMsg = ' (Limite de bônus atingido)';
        }
        
        beast.secondaryStats.fatigue += 30;
        gameState.economy.coronas += 350;
        emitWorked(gameState, 'farm', 350);
        
        return {
          success: true,
          message: `🌾 Trabalho completo! +350💰${bonusMsg}`,
        };
      }
      
    case 'work_guard':
      {
        const workBonusCount = beast.workBonusCount || 0;
        const canGetBonus = workBonusCount < 10;
        
        // 5% chance de +1 foco ou resistência (apenas se não atingiu limite)
        const bonus = canGetBonus && Math.random() < 0.05;
        let bonusMsg = '';
        
        if (bonus) {
          const stat = Math.random() < 0.5 ? 'focus' : 'ward';
          beast.attributes[stat] += 1;
          beast.workBonusCount = (beast.workBonusCount || 0) + 1;
          bonusMsg = ` +1 ${stat === 'focus' ? 'Foco' : 'Resistência'} bônus! (${beast.workBonusCount}/10)`;
        } else if (!canGetBonus) {
          bonusMsg = ' (Limite de bônus atingido)';
        }
        
        beast.secondaryStats.fatigue += 30;
        beast.secondaryStats.stress += 20;
        gameState.economy.coronas += 500;
        emitWorked(gameState, 'guard', 500);
        
        return {
          success: true,
          message: `🛡️ Trabalho completo! +500💰${bonusMsg}`,
        };
      }
      
    case 'work_library':
      {
        const workBonusCount = beast.workBonusCount || 0;
        const canGetBonus = workBonusCount < 10;
        
        // 5% chance de +1 astúcia ou foco (apenas se não atingiu limite)
        const bonus = canGetBonus && Math.random() < 0.05;
        let bonusMsg = '';
        
        if (bonus) {
          const stat = Math.random() < 0.5 ? 'wit' : 'focus';
          beast.attributes[stat] += 1;
          beast.workBonusCount = (beast.workBonusCount || 0) + 1;
          bonusMsg = ` +1 ${stat === 'wit' ? 'Astúcia' : 'Foco'} bônus! (${beast.workBonusCount}/10)`;
        } else if (!canGetBonus) {
          bonusMsg = ' (Limite de bônus atingido)';
        }
        
        beast.secondaryStats.fatigue += 10;
        beast.secondaryStats.stress += 12;
        gameState.economy.coronas += 350;
        emitWorked(gameState, 'library', 350);
        
        return {
          success: true,
          message: `📚 Trabalho completo! +350💰${bonusMsg}`,
        };
      }
    
    // ===== DESCANSO =====
    case 'rest_sleep':
      beast.secondaryStats.fatigue = 0;
      beast.secondaryStats.stress = Math.max(0, beast.secondaryStats.stress - 30);
      beast.currentHp = beast.maxHp;
      beast.essence = beast.maxEssence;
      emitRested(gameState, 'sleep');
      return {
        success: true,
        message: '😴 Descansado completamente! HP, Essência restaurados e fadiga zerada!',
      };
      
    case 'rest_freetime':
      beast.secondaryStats.stress = Math.max(0, beast.secondaryStats.stress - 25);
      beast.secondaryStats.loyalty = Math.min(100, beast.secondaryStats.loyalty + 5);
      emitRested(gameState, 'freetime');
      return {
        success: true,
        message: '🎮 Tempo livre aproveitado! Stress reduzido e lealdade aumentada!',
      };
      
    case 'rest_walk':
      beast.secondaryStats.fatigue = Math.max(0, beast.secondaryStats.fatigue - 15);
      beast.secondaryStats.stress = Math.max(0, beast.secondaryStats.stress - 20);
      emitRested(gameState, 'walk');
      return {
        success: true,
        message: '🚶 Passeio relaxante! Fadiga e stress reduzidos!',
      };
      
    case 'rest_eat':
      beast.secondaryStats.fatigue = Math.max(0, beast.secondaryStats.fatigue - 10);
      beast.currentHp = Math.min(beast.maxHp, beast.currentHp + Math.floor(beast.maxHp * 0.2));
      emitRested(gameState, 'eat');
      return {
        success: true,
        message: '🍖 Refeição deliciosa! Fadiga reduzida e HP recuperado!',
      };
    
    default:
      return {
        success: false,
        message: 'Ação desconhecida',
      };
  }
}

/**
 * Aplica recompensas proporcionais ao cancelar ação
 */
function applyPartialRewards(
  beast: Beast,
  action: BeastAction,
  gameState: GameState,
  progress: number
): any {
  // Apenas ações de trabalho dão recompensas parciais
  if (action.type.startsWith('work_')) {
    const fullRewards = {
      work_warehouse: 400,
      work_farm: 350,
      work_guard: 500,
      work_library: 350,
    };
    
    const partialMoney = Math.floor(fullRewards[action.type as keyof typeof fullRewards] * progress);
    gameState.economy.coronas += partialMoney;
    
    // Fadiga proporcional
    const fullFatigue = 30;
    beast.secondaryStats.fatigue += Math.floor(fullFatigue * progress);
    
    return {
      coronas: partialMoney,
      fatigue: Math.floor(fullFatigue * progress),
    };
  }
  
  // Treino não dá recompensa parcial
  if (action.type.startsWith('train_')) {
    const partialFatigue = Math.floor(15 * progress);
    beast.secondaryStats.fatigue += partialFatigue;
    
    return {
      fatigue: partialFatigue,
    };
  }
  
  return {};
}

/**
 * Aplica recuperação passiva de fadiga e stress ao longo do tempo
 */
export function applyPassiveRecovery(
  beast: Beast,
  lastUpdate: number,
  currentTime: number
): void {
  const msElapsed = currentTime - lastUpdate;
  const hoursElapsed = msElapsed / (60 * 60 * 1000);
  
  // -4 fadiga por hora
  const fatigueRecovered = Math.floor(hoursElapsed * 4);
  beast.secondaryStats.fatigue = Math.max(0, beast.secondaryStats.fatigue - fatigueRecovered);
  
  // -2 stress por hora
  const stressRecovered = Math.floor(hoursElapsed * 2);
  beast.secondaryStats.stress = Math.max(0, beast.secondaryStats.stress - stressRecovered);
}

/**
 * Verifica se uma ação está completa
 */
export function isActionComplete(action: BeastAction, serverTime: number): boolean {
  return serverTime >= action.completesAt;
}

/**
 * Obtém progresso de uma ação (0-1)
 */
export function getActionProgress(action: BeastAction, serverTime: number): number {
  const elapsed = serverTime - action.startTime;
  return Math.min(elapsed / action.duration, 1);
}

/**
 * Obtém nome amigável de uma ação
 */
export function getActionName(actionType: BeastAction['type']): string {
  const names: Record<BeastAction['type'], string> = {
    train_might: 'Treinar Força',
    train_wit: 'Treinar Astúcia',
    train_focus: 'Treinar Foco',
    train_agility: 'Treinar Agilidade',
    train_ward: 'Treinar Resistência',
    train_vitality: 'Treinar Vitalidade',
    work_warehouse: 'Trabalhar no Armazém',
    work_farm: 'Trabalhar na Fazenda',
    work_guard: 'Trabalhar como Guarda',
    work_library: 'Trabalhar na Biblioteca',
    rest_sleep: 'Dormir',
    rest_freetime: 'Tempo Livre',
    rest_walk: 'Passear',
    rest_eat: 'Comer Bem',
    exploration: 'Explorando',
    tournament: 'Em Torneio',
  };
  
  return names[actionType] || actionType;
}

/**
 * Reseta o contador de explorações se o cooldown passou
 */
export function updateExplorationCounter(beast: Beast, currentTime: number): void {
  if (!beast.lastExploration) return;
  
  const cooldownPassed = currentTime - beast.lastExploration;
  
  if (cooldownPassed >= ACTION_DURATIONS.exploration_cooldown) {
    beast.explorationCount = 0;
  }
}

