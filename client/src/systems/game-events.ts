/**
 * Sistema de Eventos do Jogo
 * Notifica quests e achievements quando ações acontecem
 */

import type { GameState } from '../types';
import { updateQuests } from './quests';
import { updateAchievements } from './achievements';
import { saveProgressToServer } from './game-state';

// ===== TIPOS DE EVENTOS =====

export type GameEvent =
  | { type: 'battle_won'; enemyLine?: string }
  | { type: 'battle_lost' }
  | { type: 'beast_trained'; stat: 'might' | 'wit' | 'focus' | 'agility' | 'ward' | 'vitality' }
  | { type: 'beast_rested'; restType: 'sleep' | 'freetime' | 'walk' | 'eat' }
  | { type: 'beast_worked'; workType: 'warehouse' | 'farm' | 'guard' | 'library'; coronasEarned: number }
  | { type: 'item_collected'; itemId: string; quantity: number; source: 'exploration' | 'treasure' | 'reward' }
  | { type: 'item_crafted'; recipeId: string; itemId: string }
  | { type: 'item_used'; itemId: string }
  | { type: 'exploration_completed'; zone: string; distance: number; enemiesDefeated: number }
  | { type: 'money_spent'; amount: number; category: 'shop' | 'craft' | 'other' }
  | { type: 'money_earned'; amount: number; source: 'work' | 'battle' | 'exploration' }
  | { type: 'npc_talked'; npcId: string }
  | { type: 'level_up'; newLevel: number }
  | { type: 'beast_aged'; ageInDays: number }
  | { type: 'win_streak'; currentStreak: number }
  | { type: 'exploration_limit_reached' };

// ===== SISTEMA DE EVENTOS =====

/**
 * Emite um evento do jogo e atualiza quests/achievements
 */
export function emitGameEvent(event: GameEvent, gameState: GameState): void {
  console.log(`[GameEvent] ${event.type}`, event);
  
  try {
    // Atualizar quests
    updateQuests(event, gameState);
    
    // Atualizar achievements
    updateAchievements(event, gameState);
    
    // Salvar progresso no servidor (async, não bloqueia)
    saveProgressToServer(gameState).catch(error => {
      console.error('[GameEvent] Failed to auto-save progress:', error);
    });
    
  } catch (error) {
    console.error('[GameEvent] Error processing event:', error);
  }
}

/**
 * Emite múltiplos eventos de uma vez
 */
export function emitGameEvents(events: GameEvent[], gameState: GameState): void {
  for (const event of events) {
    emitGameEvent(event, gameState);
  }
}

/**
 * Helper para emitir evento de batalha vencida
 */
export function emitBattleWon(gameState: GameState, enemyLine?: string): void {
  emitGameEvent({ type: 'battle_won', enemyLine }, gameState);
}

/**
 * Helper para emitir evento de treino
 */
export function emitTrained(gameState: GameState, stat: 'might' | 'wit' | 'focus' | 'agility' | 'ward' | 'vitality'): void {
  emitGameEvent({ type: 'beast_trained', stat }, gameState);
}

/**
 * Helper para emitir evento de descanso
 */
export function emitRested(gameState: GameState, restType: 'sleep' | 'freetime' | 'walk' | 'eat'): void {
  emitGameEvent({ type: 'beast_rested', restType }, gameState);
}

/**
 * Helper para emitir evento de trabalho
 */
export function emitWorked(gameState: GameState, workType: 'warehouse' | 'farm' | 'guard' | 'library', coronasEarned: number): void {
  emitGameEvent({ type: 'beast_worked', workType, coronasEarned }, gameState);
  emitGameEvent({ type: 'money_earned', amount: coronasEarned, source: 'work' }, gameState);
}

/**
 * Helper para emitir evento de item coletado
 */
export function emitItemCollected(gameState: GameState, itemId: string, quantity: number, source: 'exploration' | 'treasure' | 'reward' = 'exploration'): void {
  emitGameEvent({ type: 'item_collected', itemId, quantity, source }, gameState);
}

/**
 * Helper para emitir evento de craft
 */
export function emitItemCrafted(gameState: GameState, recipeId: string, itemId: string): void {
  emitGameEvent({ type: 'item_crafted', recipeId, itemId }, gameState);
}

/**
 * Helper para emitir evento de exploração completa
 */
export function emitExplorationCompleted(gameState: GameState, zone: string, distance: number, enemiesDefeated: number): void {
  emitGameEvent({ type: 'exploration_completed', zone, distance, enemiesDefeated }, gameState);
}

/**
 * Helper para emitir evento de dinheiro gasto
 */
export function emitMoneySpent(gameState: GameState, amount: number, category: 'shop' | 'craft' | 'other' = 'other'): void {
  emitGameEvent({ type: 'money_spent', amount, category }, gameState);
}

