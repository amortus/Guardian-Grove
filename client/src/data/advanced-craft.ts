/**
 * Craft Avançado - Receitas secretas e raras
 */

import type { CraftRecipe } from '../systems/craft';

/**
 * Receitas avançadas e secretas
 */
export const ADVANCED_RECIPES: CraftRecipe[] = [
  // Receitas Secretas
  {
    id: 'phoenix_feather',
    name: 'Pena da Fênix',
    description: 'Revive completamente uma besta, restaurando toda a vida',
    ingredients: [
      { itemId: 'elixir_vitality', quantity: 3 },
      { itemId: 'ancient_relic', quantity: 1 },
      { itemId: 'elemental_stone', quantity: 2 },
    ],
    result: { itemId: 'phoenix_feather', quantity: 1 },
  },
  {
    id: 'eternal_crystal',
    name: 'Cristal Eterno',
    description: 'Aumenta a longevidade da besta em 50 semanas',
    ingredients: [
      { itemId: 'rejuvenation_crystal', quantity: 2 },
      { itemId: 'legendary_crystal', quantity: 1 },
    ],
    result: { itemId: 'eternal_crystal', quantity: 1 },
  },
  {
    id: 'gods_nectar',
    name: 'Néctar dos Deuses',
    description: 'Aumenta permanentemente TODOS os atributos em +10',
    ingredients: [
      { itemId: 'ambrosía', quantity: 5 },
      { itemId: 'legendary_crystal', quantity: 2 },
      { itemId: 'legendary_relic', quantity: 1 },
    ],
    result: { itemId: 'gods_nectar', quantity: 1 },
  },
  {
    id: 'shadow_essence',
    name: 'Essência das Sombras',
    description: 'Concede à besta uma habilidade sombria especial',
    ingredients: [
      { itemId: 'obscure_relic', quantity: 2 },
      { itemId: 'mood_herb', quantity: 5 },
      { itemId: 'echo_crystal_supreme', quantity: 1 },
    ],
    result: { itemId: 'shadow_essence', quantity: 1 },
  },
  {
    id: 'divine_armor',
    name: 'Armadura Divina',
    description: 'Aumenta defesa permanentemente em +20',
    ingredients: [
      { itemId: 'vitality_crystal', quantity: 3 },
      { itemId: 'resistance_crystal', quantity: 3 },
      { itemId: 'master_training_manual', quantity: 1 },
    ],
    result: { itemId: 'divine_armor', quantity: 1 },
  },
];

/**
 * Itens especiais craftáveis (adicionam à shop)
 */
export const CRAFTABLE_SPECIAL_ITEMS = [
  {
    id: 'phoenix_feather',
    name: 'Pena da Fênix',
    category: 'herb' as const,
    effect: 'Revive completamente uma besta',
    price: 0,
    description: 'Item lendário craftável.',
  },
  {
    id: 'eternal_crystal',
    name: 'Cristal Eterno',
    category: 'crystal' as const,
    effect: '+50 semanas de vida',
    price: 0,
    description: 'Aumenta longevidade drasticamente.',
  },
  {
    id: 'gods_nectar',
    name: 'Néctar dos Deuses',
    category: 'food' as const,
    effect: '+10 em todos os atributos',
    price: 0,
    description: 'O item mais poderoso do jogo.',
  },
  {
    id: 'shadow_essence',
    name: 'Essência das Sombras',
    category: 'crystal' as const,
    effect: 'Concede habilidade sombria',
    price: 0,
    description: 'Poder das sombras.',
  },
  {
    id: 'divine_armor',
    name: 'Armadura Divina',
    category: 'training' as const,
    effect: '+20 Resistência permanente',
    price: 0,
    description: 'Defesa suprema.',
  },
];

