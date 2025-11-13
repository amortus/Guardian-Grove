/**
 * Eventos Temporários
 * Quests e eventos especiais por tempo limitado
 */

import type { Quest } from '../systems/quests';

export interface TimeEvent {
  id: string;
  name: string;
  description: string;
  startWeek: number; // Semana de início
  endWeek: number; // Semana de término
  quest?: Quest; // Quest especial do evento
  shopItems?: string[]; // IDs de itens especiais
  rewards?: {
    coronas?: number;
    items?: Array<{ itemId: string; quantity: number }>;
  };
}

/**
 * Eventos temporários que ocorrem em semanas específicas
 */
export const TIME_EVENTS: TimeEvent[] = [
  {
    id: 'lunar_festival',
    name: '🌙 Festival Lunar',
    description: 'A lua brilha forte esta semana! Bestas ganham bônus de treino.',
    startWeek: 10,
    endWeek: 12,
    rewards: { coronas: 1000 },
  },
  {
    id: 'harvest_season',
    name: '🌾 Temporada de Colheita',
    description: 'Alimentos custam metade do preço na loja!',
    startWeek: 25,
    endWeek: 27,
    shopItems: ['basic_food', 'premium_food', 'vital_fruit', 'feast'],
  },
  {
    id: 'crystal_rain',
    name: '💎 Chuva de Cristais',
    description: 'Cristais místicos caem do céu! Chance de drop aumentada.',
    startWeek: 40,
    endWeek: 42,
  },
  {
    id: 'dark_tournament',
    name: '⚔️ Torneio das Sombras',
    description: 'Torneio especial apenas para bestas de afinidade sombria!',
    startWeek: 50,
    endWeek: 52,
    rewards: { coronas: 5000, items: [{ itemId: 'obscure_relic', quantity: 1 }] },
  },
];

/**
 * Retorna evento ativo para a semana atual
 */
export function getActiveEvent(currentWeek: number): TimeEvent | null {
  return TIME_EVENTS.find(e => currentWeek >= e.startWeek && currentWeek <= e.endWeek) || null;
}

/**
 * Retorna próximo evento
 */
export function getNextEvent(currentWeek: number): TimeEvent | null {
  const upcoming = TIME_EVENTS.filter(e => e.startWeek > currentWeek)
    .sort((a, b) => a.startWeek - b.startWeek);
  return upcoming[0] || null;
}

