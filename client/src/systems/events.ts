/**
 * Sistema de Eventos Especiais
 * Eventos aleatórios e sazonais do calendário
 */

import type { GameState } from '../types';
import { increaseAffinity, decreaseAffinity } from '../data/npcs';
import { addMoney } from './game-state';

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  type: 'random' | 'seasonal' | 'special';
  chance?: number; // 0-1 para eventos aleatórios
  week?: number; // Semana fixa para eventos sazonais
  condition?: (state: GameState) => boolean;
  execute: (state: GameState) => EventResult;
}

export interface EventResult {
  success: boolean;
  message: string;
  effects?: string[];
}

// ===== EVENTOS ALEATÓRIOS =====

export const RANDOM_EVENTS: GameEvent[] = [
  {
    id: 'ruvian_visit',
    name: 'Visita do Mestre Ruvian',
    description: 'Mestre Ruvian vem verificar o progresso da sua Besta',
    type: 'random',
    chance: 0.1,
    condition: (state) => state.activeBeast !== null,
    execute: (state) => {
      if (!state.activeBeast) {
        return { success: false, message: '' };
      }

      const beast = state.activeBeast;
      const isHealthy = beast.secondaryStats.stress < 50 && beast.secondaryStats.fatigue < 50;

      if (isHealthy) {
        increaseAffinity('ruvian', 5);
        return {
          success: true,
          message: `Mestre Ruvian visitou e elogiou o estado de ${beast.name}! "Você está cuidando bem dela." (+5 Afinidade com Ruvian)`,
          effects: ['aff_ruvian_+5'],
        };
      } else {
        decreaseAffinity('ruvian', 3);
        return {
          success: true,
          message: `Mestre Ruvian visitou e ficou preocupado com ${beast.name}. "Essa criatura precisa de mais descanso!" (-3 Afinidade com Ruvian)`,
          effects: ['aff_ruvian_-3'],
        };
      }
    },
  },

  {
    id: 'dalan_visit',
    name: 'Mercador Dalan Passa pela Vila',
    description: 'Dalan está de passagem e oferece um item gratuito',
    type: 'random',
    chance: 0.08,
    execute: (_state) => {
      // Sortear item aleatório (simplificado por ora)
      const items = ['Erva Serena', 'Fruta Vital', 'Ração Premium'];
      const randomItem = items[Math.floor(Math.random() * items.length)];

      increaseAffinity('dalan', 3);
      return {
        success: true,
        message: `Dalan passou pela vila e deixou ${randomItem} de presente! "Um brinde para um bom cliente." (+3 Afinidade com Dalan)`,
        effects: [`item_${randomItem}`, 'aff_dalan_+3'],
      };
    },
  },

  {
    id: 'weather_rain',
    name: 'Chuva Intensa',
    description: 'Uma tempestade cobre a região',
    type: 'random',
    chance: 0.12,
    condition: (state) => state.activeBeast !== null,
    execute: (state) => {
      if (!state.activeBeast) {
        return { success: false, message: '' };
      }

      const beast = state.activeBeast;

      // Bestas de água ou anfíbias se beneficiam
      if (beast.affinity === 'water' || beast.line === 'mirella') {
        beast.secondaryStats.stress = Math.max(0, beast.secondaryStats.stress - 15);
        return {
          success: true,
          message: `Chuva intensa! ${beast.name} adora água e ficou mais relaxado (-15 Stress).`,
          effects: ['stress_-15'],
        };
      } else {
        beast.secondaryStats.stress = Math.min(100, beast.secondaryStats.stress + 10);
        return {
          success: true,
          message: `Chuva intensa! ${beast.name} ficou incomodado (+10 Stress).`,
          effects: ['stress_+10'],
        };
      }
    },
  },

  {
    id: 'weather_sun',
    name: 'Dia Ensolarado',
    description: 'Um dia perfeito de sol',
    type: 'random',
    chance: 0.12,
    condition: (state) => state.activeBeast !== null,
    execute: (state) => {
      if (!state.activeBeast) {
        return { success: false, message: '' };
      }

      const beast = state.activeBeast;

      // Bestas de fogo ou terra se beneficiam
      if (beast.affinity === 'fire' || beast.affinity === 'earth' || beast.line === 'brontis') {
        beast.secondaryStats.fatigue = Math.max(0, beast.secondaryStats.fatigue - 10);
        return {
          success: true,
          message: `Dia ensolarado! ${beast.name} aproveitou o calor e recuperou energia (-10 Fadiga).`,
          effects: ['fatigue_-10'],
        };
      } else {
        return {
          success: true,
          message: `Dia ensolarado! ${beast.name} descansou tranquilamente.`,
          effects: [],
        };
      }
    },
  },

  {
    id: 'discovery',
    name: 'Descoberta no Rancho',
    description: 'Sua Besta encontrou algo enterrado',
    type: 'random',
    chance: 0.05,
    condition: (state) => state.activeBeast !== null,
    execute: (state) => {
      const goldFound = Math.floor(Math.random() * 100) + 50;
      addMoney(state, goldFound);

      return {
        success: true,
        message: `${state.activeBeast?.name} cavou no quintal e encontrou ${goldFound} Coronas enterradas!`,
        effects: [`money_+${goldFound}`],
      };
    },
  },

  {
    id: 'injury',
    name: 'Pequeno Ferimento',
    description: 'Sua Besta se machucou levemente',
    type: 'random',
    chance: 0.06,
    condition: (state) => state.activeBeast !== null && state.activeBeast.secondaryStats.fatigue > 60,
    execute: (state) => {
      if (!state.activeBeast) {
        return { success: false, message: '' };
      }

      const beast = state.activeBeast;
      const hpLoss = Math.floor(beast.maxHp * 0.1);
      beast.currentHp = Math.max(1, beast.currentHp - hpLoss);

      return {
        success: true,
        message: `${beast.name} se machucou durante o descanso por estar muito fatigado (-${hpLoss} HP). Considere dar mais descanso!`,
        effects: [`hp_-${hpLoss}`],
      };
    },
  },
];

// ===== EVENTOS SAZONAIS =====

export const SEASONAL_EVENTS: GameEvent[] = [
  {
    id: 'festival_eco',
    name: 'Festival do Eco',
    description: 'Um festival na vila celebrando as Relíquias de Eco',
    type: 'seasonal',
    week: 20, // A cada 20 semanas
    execute: (state) => {
      addMoney(state, 200);
      increaseAffinity('liora', 5);
      increaseAffinity('ruvian', 5);

      return {
        success: true,
        message: `🎉 Festival do Eco! A vila está em festa! Você ganhou 200 Coronas e aumentou afinidade com Liora e Ruvian (+5).`,
        effects: ['money_+200', 'aff_liora_+5', 'aff_ruvian_+5'],
      };
    },
  },

  {
    id: 'shadow_night',
    name: 'Noite das Sombras',
    description: 'Uma noite especial onde criaturas sombrias são mais fortes',
    type: 'seasonal',
    week: 15, // A cada 15 semanas
    condition: (state) => state.activeBeast?.affinity === 'shadow',
    execute: (state) => {
      if (!state.activeBeast) {
        return {
          success: true,
          message: `🌑 Noite das Sombras! Bestas de afinidade sombria ganham poderes especiais nesta noite.`,
          effects: [],
        };
      }

      // Bonus para bestas sombrias
      if (state.activeBeast.affinity === 'shadow') {
        state.activeBeast.secondaryStats.stress = Math.max(0, state.activeBeast.secondaryStats.stress - 30);
        return {
          success: true,
          message: `🌑 Noite das Sombras! ${state.activeBeast.name} absorveu energia sombria e ficou revigorado (-30 Stress)!`,
          effects: ['stress_-30'],
        };
      } else {
        return {
          success: true,
          message: `🌑 Noite das Sombras! A lua está escondida... Bestas de afinidade sombria se fortalecem nesta noite.`,
          effects: [],
        };
      }
    },
  },

  {
    id: 'harvest_festival',
    name: 'Festival da Colheita',
    description: 'Colheita abundante na vila',
    type: 'seasonal',
    week: 25, // A cada 25 semanas
    execute: (state) => {
      if (state.activeBeast) {
        const hpRecover = Math.floor(state.activeBeast.maxHp * 0.3);
        state.activeBeast.currentHp = Math.min(
          state.activeBeast.maxHp,
          state.activeBeast.currentHp + hpRecover
        );
      }

      increaseAffinity('dalan', 3);
      return {
        success: true,
        message: `🌾 Festival da Colheita! Comida fresca e abundante para todos! ${state.activeBeast?.name} recuperou HP (+${Math.floor((state.activeBeast?.maxHp ?? 0) * 0.3)}).`,
        effects: [`hp_+${Math.floor((state.activeBeast?.maxHp ?? 0) * 0.3)}`, 'aff_dalan_+3'],
      };
    },
  },
];

/**
 * Verifica e executa eventos aleatórios
 */
export function checkRandomEvents(state: GameState): EventResult | null {
  // Sortear apenas um evento por semana
  const eligibleEvents = RANDOM_EVENTS.filter(
    (event) => (!event.condition || event.condition(state)) && Math.random() < (event.chance ?? 0)
  );

  if (eligibleEvents.length === 0) return null;

  // Escolher um evento aleatório da lista elegível
  const event = eligibleEvents[Math.floor(Math.random() * eligibleEvents.length)];
  return event.execute(state);
}

/**
 * Verifica eventos sazonais baseados na semana atual
 */
export function checkSeasonalEvents(state: GameState): EventResult | null {
  const currentWeek = state.currentWeek;

  for (const event of SEASONAL_EVENTS) {
    // Eventos sazonais ocorrem em múltiplos da semana especificada
    if (event.week && currentWeek % event.week === 0) {
      if (!event.condition || event.condition(state)) {
        return event.execute(state);
      }
    }
  }

  return null;
}

/**
 * Processa todos os eventos da semana
 */
export function processWeeklyEvents(state: GameState): EventResult[] {
  const results: EventResult[] = [];

  // Eventos sazonais têm prioridade
  const seasonalEvent = checkSeasonalEvents(state);
  if (seasonalEvent && seasonalEvent.success) {
    results.push(seasonalEvent);
  }

  // Eventos aleatórios só ocorrem se não houver evento sazonal
  if (results.length === 0) {
    const randomEvent = checkRandomEvents(state);
    if (randomEvent && randomEvent.success) {
      results.push(randomEvent);
    }
  }

  return results;
}

