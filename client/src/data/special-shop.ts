/**
 * Loja de Raridades - Itens únicos e especiais
 */

import type { Item } from '../types';

/**
 * Itens únicos da loja de raridades
 * Aparecem apenas uma vez e são muito caros
 */
export const SPECIAL_SHOP_ITEMS: Item[] = [
  {
    id: 'crown_of_champions',
    name: '👑 Coroa dos Campeões',
    category: 'training',
    effect: 'Dobra ganhos de todos os torneios',
    price: 15000,
    description: 'Coroa lendária usada pelos maiores campeões.',
  },
  {
    id: 'time_crystal',
    name: '⏰ Cristal do Tempo',
    category: 'crystal',
    effect: 'Volta a besta 30 semanas no tempo',
    price: 10000,
    description: 'Cristal místico que manipula o tempo.',
  },
  {
    id: 'infinity_relic',
    name: '∞ Relíquia Infinita',
    category: 'relic',
    effect: 'Gera besta com stats máximos e traços perfeitos',
    price: 20000,
    description: 'A relíquia mais poderosa já descoberta.',
  },
  {
    id: 'guardian_blessing',
    name: '✨ Bênção do Guardião',
    category: 'training',
    effect: 'Besta nunca envelhece nem morre',
    price: 50000,
    description: 'Concede imortalidade à besta. Só pode ser usado uma vez.',
  },
  {
    id: 'omnipotent_tome',
    name: '📖 Tomo Onipotente',
    category: 'training',
    effect: 'Desbloqueia TODAS as técnicas instantaneamente',
    price: 25000,
    description: 'Livro com conhecimento de todas as técnicas existentes.',
  },
  {
    id: 'lucky_charm',
    name: '🍀 Amuleto da Sorte',
    category: 'training',
    effect: 'Dobra chance de drops raros',
    price: 8000,
    description: 'Traz sorte incríve ao portador.',
  },
];

/**
 * Verifica se um item já foi comprado
 */
export function isItemPurchased(itemId: string, purchasedItems: string[]): boolean {
  return purchasedItems.includes(itemId);
}

/**
 * Retorna itens disponíveis (não comprados ainda)
 */
export function getAvailableSpecialItems(purchasedItems: string[]): Item[] {
  return SPECIAL_SHOP_ITEMS.filter(item => !purchasedItems.includes(item.id));
}

