/**
 * Receitas de Craft de Exploração - Guardian Grove
 * Receitas que usam materiais dropados na exploração
 */

import type { CraftRecipe } from '../systems/craft';

export const EXPLORATION_RECIPES: CraftRecipe[] = [
  // === ITENS DE TREINO (Materiais Comuns) ===
  {
    id: 'leather_armor',
    name: 'Armadura de Couro',
    description: 'Armadura leve que aumenta defesa (+5 Ward)',
    ingredients: [
      { itemId: 'leather_scrap', quantity: 5 },
      { itemId: 'fur_tuft', quantity: 3 },
    ],
    result: { itemId: 'leather_armor_item', quantity: 1 },
  },
  {
    id: 'bone_club',
    name: 'Clava de Osso',
    description: 'Arma primitiva mas eficaz (+3 Might)',
    ingredients: [
      { itemId: 'bone_fragment', quantity: 4 },
      { itemId: 'leather_scrap', quantity: 2 },
    ],
    result: { itemId: 'bone_club_item', quantity: 1 },
  },
  {
    id: 'claw_gauntlet',
    name: 'Manopla de Garras',
    description: 'Aumenta agilidade de ataque (+3 Agility)',
    ingredients: [
      { itemId: 'claw_shard', quantity: 6 },
      { itemId: 'fur_tuft', quantity: 2 },
    ],
    result: { itemId: 'claw_gauntlet_item', quantity: 1 },
  },
  {
    id: 'fang_necklace',
    name: 'Colar de Presas',
    description: 'Amuleto que aumenta foco (+3 Focus)',
    ingredients: [
      { itemId: 'fang_small', quantity: 8 },
      { itemId: 'leather_scrap', quantity: 1 },
    ],
    result: { itemId: 'fang_necklace_item', quantity: 1 },
  },

  // === POÇÕES E CONSUMÍVEIS (Materiais Incomuns) ===
  {
    id: 'iron_scale_potion',
    name: 'Poção de Escamas de Ferro',
    description: 'Aumenta defesa temporariamente',
    ingredients: [
      { itemId: 'scale_iron', quantity: 3 },
      { itemId: 'bone_fragment', quantity: 2 },
    ],
    result: { itemId: 'iron_scale_potion_item', quantity: 1 },
  },
  {
    id: 'venom_elixir',
    name: 'Elixir Venenoso',
    description: 'Cura veneno e concede resistência',
    ingredients: [
      { itemId: 'venom_sac', quantity: 2 },
      { itemId: 'feather_mystic', quantity: 1 },
    ],
    result: { itemId: 'venom_elixir_item', quantity: 1 },
  },
  {
    id: 'mystic_feather_charm',
    name: 'Amuleto de Pena Mística',
    description: 'Aumenta sabedoria (+4 Wit)',
    ingredients: [
      { itemId: 'feather_mystic', quantity: 4 },
      { itemId: 'eye_crystal', quantity: 1 },
    ],
    result: { itemId: 'mystic_feather_charm_item', quantity: 1 },
  },
  {
    id: 'horn_helmet',
    name: 'Elmo de Chifres',
    description: 'Proteção de cabeça robusta (+6 Ward)',
    ingredients: [
      { itemId: 'horn_curved', quantity: 2 },
      { itemId: 'scale_iron', quantity: 4 },
      { itemId: 'leather_scrap', quantity: 3 },
    ],
    result: { itemId: 'horn_helmet_item', quantity: 1 },
  },

  // === EQUIPAMENTOS AVANÇADOS (Materiais Raros) ===
  {
    id: 'heart_stone_amulet',
    name: 'Amuleto de Coração de Pedra',
    description: 'Aumenta HP máximo permanentemente (+20)',
    ingredients: [
      { itemId: 'heart_stone', quantity: 1 },
      { itemId: 'scale_iron', quantity: 5 },
      { itemId: 'eye_crystal', quantity: 2 },
    ],
    result: { itemId: 'heart_stone_amulet_item', quantity: 1 },
  },
  {
    id: 'shadow_cloak',
    name: 'Manto das Sombras',
    description: 'Aumenta agilidade drasticamente (+8 Agility)',
    ingredients: [
      { itemId: 'shadow_essence_raw', quantity: 2 },
      { itemId: 'fur_tuft', quantity: 10 },
      { itemId: 'feather_mystic', quantity: 5 },
    ],
    result: { itemId: 'shadow_cloak_item', quantity: 1 },
  },
  {
    id: 'flame_core_weapon',
    name: 'Arma de Núcleo Flamejante',
    description: 'Arma de fogo que aumenta força (+10 Might)',
    ingredients: [
      { itemId: 'flame_core', quantity: 1 },
      { itemId: 'bone_fragment', quantity: 8 },
      { itemId: 'claw_shard', quantity: 6 },
    ],
    result: { itemId: 'flame_core_weapon_item', quantity: 1 },
  },
  {
    id: 'dragon_scale_armor',
    name: 'Armadura de Escama de Dragão',
    description: 'Armadura lendária (+15 Ward, +5 Vitality)',
    ingredients: [
      { itemId: 'dragon_scale', quantity: 3 },
      { itemId: 'scale_iron', quantity: 10 },
      { itemId: 'leather_scrap', quantity: 15 },
    ],
    result: { itemId: 'dragon_scale_armor_item', quantity: 1 },
  },
  {
    id: 'ethereal_ring',
    name: 'Anel Etéreo',
    description: 'Aumenta essência máxima (+15)',
    ingredients: [
      { itemId: 'ethereal_dust', quantity: 5 },
      { itemId: 'eye_crystal', quantity: 3 },
      { itemId: 'feather_mystic', quantity: 4 },
    ],
    result: { itemId: 'ethereal_ring_item', quantity: 1 },
  },

  // === ITENS ÉPICOS (Materiais Épicos) ===
  {
    id: 'ancient_blood_elixir',
    name: 'Elixir de Sangue Ancestral',
    description: 'Restaura completamente HP e Essência',
    ingredients: [
      { itemId: 'ancient_blood', quantity: 1 },
      { itemId: 'heart_stone', quantity: 2 },
      { itemId: 'venom_sac', quantity: 5 },
    ],
    result: { itemId: 'ancient_blood_elixir_item', quantity: 1 },
  },
  {
    id: 'titan_bone_armor',
    name: 'Armadura de Osso de Titã',
    description: 'Armadura suprema (+20 Ward, +10 Vitality)',
    ingredients: [
      { itemId: 'titan_bone', quantity: 1 },
      { itemId: 'dragon_scale', quantity: 5 },
      { itemId: 'scale_iron', quantity: 20 },
    ],
    result: { itemId: 'titan_bone_armor_item', quantity: 1 },
  },
  {
    id: 'phoenix_ash_revival',
    name: 'Pó de Renascimento',
    description: 'Revive besta derrotada com 50% HP',
    ingredients: [
      { itemId: 'phoenix_ash', quantity: 2 },
      { itemId: 'heart_stone', quantity: 3 },
      { itemId: 'ancient_blood', quantity: 1 },
    ],
    result: { itemId: 'phoenix_ash_revival_item', quantity: 1 },
  },
  {
    id: 'void_fragment_blade',
    name: 'Lâmina do Vazio',
    description: 'Arma definitiva (+15 Might, +8 Focus)',
    ingredients: [
      { itemId: 'void_fragment', quantity: 1 },
      { itemId: 'shadow_essence_raw', quantity: 5 },
      { itemId: 'claw_shard', quantity: 20 },
    ],
    result: { itemId: 'void_fragment_blade_item', quantity: 1 },
  },
  {
    id: 'celestial_crown',
    name: 'Coroa Celestial',
    description: 'Aumenta TODOS atributos (+5 em tudo)',
    ingredients: [
      { itemId: 'celestial_shard', quantity: 1 },
      { itemId: 'ethereal_dust', quantity: 10 },
      { itemId: 'eye_crystal', quantity: 8 },
      { itemId: 'feather_mystic', quantity: 15 },
    ],
    result: { itemId: 'celestial_crown_item', quantity: 1 },
  },

  // === MATERIAIS REFINADOS (Craft Intermediário) ===
  {
    id: 'refined_leather',
    name: 'Couro Refinado',
    description: 'Couro tratado e reforçado',
    ingredients: [
      { itemId: 'leather_scrap', quantity: 10 },
      { itemId: 'fur_tuft', quantity: 5 },
    ],
    result: { itemId: 'refined_leather', quantity: 1 },
  },
  {
    id: 'hardened_bone',
    name: 'Osso Endurecido',
    description: 'Osso processado e fortificado',
    ingredients: [
      { itemId: 'bone_fragment', quantity: 10 },
      { itemId: 'scale_iron', quantity: 3 },
    ],
    result: { itemId: 'hardened_bone', quantity: 1 },
  },
  {
    id: 'mystic_essence',
    name: 'Essência Mística',
    description: 'Energia mágica concentrada',
    ingredients: [
      { itemId: 'feather_mystic', quantity: 8 },
      { itemId: 'eye_crystal', quantity: 4 },
      { itemId: 'ethereal_dust', quantity: 2 },
    ],
    result: { itemId: 'mystic_essence', quantity: 1 },
  },
];

/**
 * Retorna todas as receitas de exploração
 */
export function getAllExplorationRecipes(): CraftRecipe[] {
  return EXPLORATION_RECIPES;
}

/**
 * Retorna receitas por raridade dos materiais
 */
export function getRecipesByRarity(rarity: 'common' | 'uncommon' | 'rare' | 'epic'): CraftRecipe[] {
  // Mapeia materiais para raridade
  const materialRarity: Record<string, string> = {
    // Common
    leather_scrap: 'common',
    bone_fragment: 'common',
    claw_shard: 'common',
    fur_tuft: 'common',
    fang_small: 'common',
    // Uncommon
    scale_iron: 'uncommon',
    venom_sac: 'uncommon',
    feather_mystic: 'uncommon',
    horn_curved: 'uncommon',
    eye_crystal: 'uncommon',
    // Rare
    heart_stone: 'rare',
    shadow_essence_raw: 'rare',
    flame_core: 'rare',
    dragon_scale: 'rare',
    ethereal_dust: 'rare',
    // Epic
    ancient_blood: 'epic',
    titan_bone: 'epic',
    phoenix_ash: 'epic',
    void_fragment: 'epic',
    celestial_shard: 'epic',
  };

  return EXPLORATION_RECIPES.filter(recipe => {
    // Verifica a raridade do material mais raro da receita
    const maxRarity = recipe.ingredients.reduce((max, ing) => {
      const ingRarity = materialRarity[ing.itemId] || 'common';
      const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3 };
      return rarityOrder[ingRarity as keyof typeof rarityOrder] > rarityOrder[max as keyof typeof rarityOrder] ? ingRarity : max;
    }, 'common');
    
    return maxRarity === rarity;
  });
}

