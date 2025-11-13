/**
 * Receitas Inspiradas em Pokémon - Guardian Grove
 * Sistema de crafting baseado em poções e itens de Pokémon, adaptado para nosso jogo
 */

import type { CraftRecipe } from '../systems/craft';

export const POKEMON_INSPIRED_RECIPES: CraftRecipe[] = [
  // ===== POÇÕES DE CURA (Inspiradas em Potion, Super Potion, etc.) =====
  
  // Poção Básica (Potion) - Cura 20 HP
  {
    id: 'basic_healing_potion',
    name: 'Poção de Cura Básica',
    description: 'Cura 20 HP da Besta. Equivalente à Potion do Pokémon.',
    ingredients: [
      { itemId: 'serene_herb', quantity: 2 },
      { itemId: 'leather_scrap', quantity: 1 },
    ],
    result: { itemId: 'basic_healing_potion_item', quantity: 1 },
  },

  // Super Poção (Super Potion) - Cura 50 HP
  {
    id: 'super_healing_potion',
    name: 'Super Poção de Cura',
    description: 'Cura 50 HP da Besta. Equivalente à Super Potion.',
    ingredients: [
      { itemId: 'healing_herb', quantity: 1 },
      { itemId: 'serene_herb', quantity: 3 },
      { itemId: 'bone_fragment', quantity: 2 },
    ],
    result: { itemId: 'super_healing_potion_item', quantity: 1 },
  },

  // Hiper Poção (Hyper Potion) - Cura 100 HP
  {
    id: 'hyper_healing_potion',
    name: 'Hiper Poção de Cura',
    description: 'Cura 100 HP da Besta. Equivalente à Hyper Potion.',
    ingredients: [
      { itemId: 'healing_herb', quantity: 2 },
      { itemId: 'scale_iron', quantity: 1 },
      { itemId: 'feather_mystic', quantity: 1 },
    ],
    result: { itemId: 'hyper_healing_potion_item', quantity: 1 },
  },

  // Poção Máxima (Max Potion) - Cura HP completo
  {
    id: 'max_healing_potion',
    name: 'Poção Máxima de Cura',
    description: 'Restaura completamente o HP da Besta. Equivalente à Max Potion.',
    ingredients: [
      { itemId: 'heart_stone', quantity: 1 },
      { itemId: 'healing_herb', quantity: 3 },
      { itemId: 'ancient_blood', quantity: 1 },
    ],
    result: { itemId: 'max_healing_potion_item', quantity: 1 },
  },

  // ===== ELIXIRES DE ESSÊNCIA (Inspirados em Ether, Max Ether) =====
  
  // Elixir Básico (Ether) - Restaura 10 Essência
  {
    id: 'basic_essence_elixir',
    name: 'Elixir de Essência Básico',
    description: 'Restaura 10 Essência da Besta. Equivalente ao Ether.',
    ingredients: [
      { itemId: 'energy_herb', quantity: 1 },
      { itemId: 'fur_tuft', quantity: 2 },
    ],
    result: { itemId: 'basic_essence_elixir_item', quantity: 1 },
  },

  // Super Elixir (Super Ether) - Restaura 25 Essência
  {
    id: 'super_essence_elixir',
    name: 'Super Elixir de Essência',
    description: 'Restaura 25 Essência da Besta. Equivalente ao Super Ether.',
    ingredients: [
      { itemId: 'energy_herb', quantity: 2 },
      { itemId: 'eye_crystal', quantity: 1 },
      { itemId: 'claw_shard', quantity: 1 },
    ],
    result: { itemId: 'super_essence_elixir_item', quantity: 1 },
  },

  // Elixir Máximo (Max Ether) - Restaura Essência completa
  {
    id: 'max_essence_elixir',
    name: 'Elixir Máximo de Essência',
    description: 'Restaura completamente a Essência da Besta. Equivalente ao Max Ether.',
    ingredients: [
      { itemId: 'ethereal_dust', quantity: 2 },
      { itemId: 'energy_herb', quantity: 3 },
      { itemId: 'phoenix_ash', quantity: 1 },
    ],
    result: { itemId: 'max_essence_elixir_item', quantity: 1 },
  },

  // ===== ELIXIRES DE ATRIBUTOS (Inspirados em Protein, Iron, etc.) =====
  
  // Elixir de Força (Protein) - +1 Might permanente
  {
    id: 'might_elixir',
    name: 'Elixir de Força',
    description: 'Aumenta permanentemente +1 Might da Besta. Equivalente ao Protein.',
    ingredients: [
      { itemId: 'bone_fragment', quantity: 5 },
      { itemId: 'fang_small', quantity: 3 },
      { itemId: 'serene_herb', quantity: 2 },
    ],
    result: { itemId: 'might_elixir_item', quantity: 1 },
  },

  // Elixir de Astúcia (Calcium) - +1 Wit permanente
  {
    id: 'wit_elixir',
    name: 'Elixir de Astúcia',
    description: 'Aumenta permanentemente +1 Wit da Besta. Equivalente ao Calcium.',
    ingredients: [
      { itemId: 'feather_mystic', quantity: 3 },
      { itemId: 'eye_crystal', quantity: 2 },
      { itemId: 'wisdom_tome', quantity: 1 },
    ],
    result: { itemId: 'wit_elixir_item', quantity: 1 },
  },

  // Elixir de Foco (Zinc) - +1 Focus permanente
  {
    id: 'focus_elixir',
    name: 'Elixir de Foco',
    description: 'Aumenta permanentemente +1 Focus da Besta. Equivalente ao Zinc.',
    ingredients: [
      { itemId: 'horn_curved', quantity: 2 },
      { itemId: 'ethereal_dust', quantity: 1 },
      { itemId: 'focus_charm', quantity: 1 },
    ],
    result: { itemId: 'focus_elixir_item', quantity: 1 },
  },

  // Elixir de Agilidade (Carbos) - +1 Agility permanente
  {
    id: 'agility_elixir',
    name: 'Elixir de Agilidade',
    description: 'Aumenta permanentemente +1 Agility da Besta. Equivalente ao Carbos.',
    ingredients: [
      { itemId: 'claw_shard', quantity: 4 },
      { itemId: 'fur_tuft', quantity: 3 },
      { itemId: 'agility_boots', quantity: 1 },
    ],
    result: { itemId: 'agility_elixir_item', quantity: 1 },
  },

  // Elixir de Proteção (Iron) - +1 Ward permanente
  {
    id: 'ward_elixir',
    name: 'Elixir de Proteção',
    description: 'Aumenta permanentemente +1 Ward da Besta. Equivalente ao Iron.',
    ingredients: [
      { itemId: 'scale_iron', quantity: 3 },
      { itemId: 'bone_fragment', quantity: 4 },
      { itemId: 'leather_scrap', quantity: 2 },
    ],
    result: { itemId: 'ward_elixir_item', quantity: 1 },
  },

  // Elixir de Vitalidade (HP Up) - +1 Vitality permanente
  {
    id: 'vitality_elixir',
    name: 'Elixir de Vitalidade',
    description: 'Aumenta permanentemente +1 Vitality da Besta. Equivalente ao HP Up.',
    ingredients: [
      { itemId: 'heart_stone', quantity: 1 },
      { itemId: 'ancient_blood', quantity: 1 },
      { itemId: 'healing_herb', quantity: 2 },
    ],
    result: { itemId: 'vitality_elixir_item', quantity: 1 },
  },

  // ===== ITENS ESPECIAIS (Inspirados em itens únicos de Pokémon) =====
  
  // Elixir Anti-Stress (Inspirado em Calm Mind)
  {
    id: 'stress_relief_elixir',
    name: 'Elixir Anti-Stress',
    description: 'Reduz drasticamente o Stress da Besta (-30 Stress).',
    ingredients: [
      { itemId: 'mood_herb', quantity: 3 },
      { itemId: 'vital_fruit', quantity: 2 },
      { itemId: 'feather_mystic', quantity: 2 },
    ],
    result: { itemId: 'stress_relief_elixir_item', quantity: 1 },
  },

  // Elixir de Lealdade (Inspirado em Friendship)
  {
    id: 'loyalty_elixir',
    name: 'Elixir de Lealdade',
    description: 'Aumenta significativamente a Lealdade da Besta (+20 Lealdade).',
    ingredients: [
      { itemId: 'feast', quantity: 1 },
      { itemId: 'mood_herb', quantity: 2 },
      { itemId: 'heart_stone', quantity: 1 },
    ],
    result: { itemId: 'loyalty_elixir_item', quantity: 1 },
  },

  // Poção de Vigor Renovado (Único - Reseta treinos diários)
  {
    id: 'renewed_vigor_potion',
    name: 'Poção de Vigor Renovado',
    description: 'Poção rara que reseta o limite de treinos diários. Permite mais 5 treinos hoje. Limite: 1 uso por dia.',
    ingredients: [
      { itemId: 'energy_herb', quantity: 5 },
      { itemId: 'phoenix_ash', quantity: 2 },
      { itemId: 'ethereal_dust', quantity: 3 },
      { itemId: 'rejuvenation_crystal', quantity: 1 },
      { itemId: 'ancient_blood', quantity: 1 },
    ],
    result: { itemId: 'renewed_vigor_potion_item', quantity: 1 },
  },

  // Elixir da Juventude (Inspirado em Rare Candy)
  {
    id: 'youth_elixir',
    name: 'Elixir da Juventude',
    description: 'Reduz a idade da Besta em 10 semanas. Máximo 3 usos por Besta.',
    ingredients: [
      { itemId: 'rejuvenation_crystal', quantity: 1 },
      { itemId: 'phoenix_ash', quantity: 1 },
      { itemId: 'celestial_shard', quantity: 1 },
    ],
    result: { itemId: 'youth_elixir_item', quantity: 1 },
  },

  // Elixir de Experiência (Inspirado em Exp. Share)
  {
    id: 'experience_elixir',
    name: 'Elixir de Experiência',
    description: 'Aumenta o ganho de experiência em 50% por 5 batalhas.',
    ingredients: [
      { itemId: 'echo_crystal', quantity: 2 },
      { itemId: 'legendary_crystal', quantity: 1 },
      { itemId: 'ethereal_dust', quantity: 3 },
    ],
    result: { itemId: 'experience_elixir_item', quantity: 1 },
  },

  // ===== POÇÕES COMBINADAS (Inspiradas em Full Restore) =====
  
  // Poção Completa (Full Restore)
  {
    id: 'full_restore_potion',
    name: 'Poção Completa',
    description: 'Restaura completamente HP e Essência, remove Stress e Fadiga.',
    ingredients: [
      { itemId: 'max_healing_potion_item', quantity: 1 },
      { itemId: 'max_essence_elixir_item', quantity: 1 },
      { itemId: 'ambrosía', quantity: 1 },
      { itemId: 'ancient_blood', quantity: 1 },
    ],
    result: { itemId: 'full_restore_potion_item', quantity: 1 },
  },

  // Elixir Universal (Inspirado em Master Ball)
  {
    id: 'universal_elixir',
    name: 'Elixir Universal',
    description: 'Aumenta TODOS os atributos em +2 permanentemente. Extremamente raro.',
    ingredients: [
      { itemId: 'celestial_shard', quantity: 2 },
      { itemId: 'void_fragment', quantity: 1 },
      { itemId: 'titan_bone', quantity: 1 },
      { itemId: 'phoenix_ash', quantity: 2 },
      { itemId: 'ancient_blood', quantity: 2 },
    ],
    result: { itemId: 'universal_elixir_item', quantity: 1 },
  },

  // ===== ITENS DE TREINO TEMPORÁRIO (Inspirados em X Items) =====
  
  // X-Força (X Attack)
  {
    id: 'x_might_potion',
    name: 'Poção X-Força',
    description: 'Aumenta temporariamente +5 Might por 3 batalhas.',
    ingredients: [
      { itemId: 'training_weights', quantity: 1 },
      { itemId: 'bone_fragment', quantity: 3 },
      { itemId: 'serene_herb', quantity: 1 },
    ],
    result: { itemId: 'x_might_potion_item', quantity: 1 },
  },

  // X-Defesa (X Defense)
  {
    id: 'x_ward_potion',
    name: 'Poção X-Proteção',
    description: 'Aumenta temporariamente +5 Ward por 3 batalhas.',
    ingredients: [
      { itemId: 'scale_iron', quantity: 2 },
      { itemId: 'dragon_scale', quantity: 1 },
      { itemId: 'healing_herb', quantity: 1 },
    ],
    result: { itemId: 'x_ward_potion_item', quantity: 1 },
  },

  // X-Velocidade (X Speed)
  {
    id: 'x_agility_potion',
    name: 'Poção X-Agilidade',
    description: 'Aumenta temporariamente +5 Agility por 3 batalhas.',
    ingredients: [
      { itemId: 'agility_boots', quantity: 1 },
      { itemId: 'claw_shard', quantity: 3 },
      { itemId: 'feather_mystic', quantity: 2 },
    ],
    result: { itemId: 'x_agility_potion_item', quantity: 1 },
  },

  // X-Precisão (X Accuracy)
  {
    id: 'x_focus_potion',
    name: 'Poção X-Foco',
    description: 'Aumenta temporariamente +5 Focus por 3 batalhas.',
    ingredients: [
      { itemId: 'focus_charm', quantity: 1 },
      { itemId: 'eye_crystal', quantity: 2 },
      { itemId: 'ethereal_dust', quantity: 1 },
    ],
    result: { itemId: 'x_focus_potion_item', quantity: 1 },
  },

  // ===== ITENS DE STATUS (Inspirados em Antidote, Awakening) =====
  
  // Antídoto (Antidote)
  {
    id: 'antidote_potion',
    name: 'Antídoto',
    description: 'Remove todos os efeitos negativos da Besta.',
    ingredients: [
      { itemId: 'venom_sac', quantity: 1 },
      { itemId: 'healing_herb', quantity: 2 },
      { itemId: 'serene_herb', quantity: 1 },
    ],
    result: { itemId: 'antidote_potion_item', quantity: 1 },
  },

  // Despertador (Awakening)
  {
    id: 'awakening_potion',
    name: 'Poção Despertadora',
    description: 'Remove Fadiga e aumenta energia por 1 semana.',
    ingredients: [
      { itemId: 'energy_herb', quantity: 2 },
      { itemId: 'vital_fruit', quantity: 1 },
      { itemId: 'feather_mystic', quantity: 1 },
    ],
    result: { itemId: 'awakening_potion_item', quantity: 1 },
  },

  // ===== ITENS LENDÁRIOS (Inspirados em itens míticos) =====
  
  // Elixir da Imortalidade (Inspirado em Sacred Ash)
  {
    id: 'immortality_elixir',
    name: 'Elixir da Imortalidade',
    description: 'Aumenta drasticamente o tempo de vida da Besta (+50 semanas). Máximo 1 uso por Besta.',
    ingredients: [
      { itemId: 'phoenix_ash', quantity: 3 },
      { itemId: 'celestial_shard', quantity: 2 },
      { itemId: 'ancient_blood', quantity: 3 },
      { itemId: 'void_fragment', quantity: 1 },
      { itemId: 'titan_bone', quantity: 1 },
    ],
    result: { itemId: 'immortality_elixir_item', quantity: 1 },
  },

  // Elixir Divino (Inspirado em Master Ball)
  {
    id: 'divine_elixir',
    name: 'Elixir Divino',
    description: 'Aumenta TODOS os atributos em +5 permanentemente. Item mais poderoso do jogo.',
    ingredients: [
      { itemId: 'celestial_shard', quantity: 5 },
      { itemId: 'void_fragment', quantity: 3 },
      { itemId: 'titan_bone', quantity: 2 },
      { itemId: 'phoenix_ash', quantity: 5 },
      { itemId: 'ancient_blood', quantity: 5 },
      { itemId: 'legendary_relic', quantity: 1 },
    ],
    result: { itemId: 'divine_elixir_item', quantity: 1 },
  },
];

/**
 * Retorna todas as receitas inspiradas em Pokémon
 */
export function getAllPokemonInspiredRecipes(): CraftRecipe[] {
  return POKEMON_INSPIRED_RECIPES;
}

/**
 * Retorna receitas por categoria
 */
export function getPokemonRecipesByCategory(category: 'healing' | 'essence' | 'stats' | 'special' | 'temporary' | 'status' | 'legendary'): CraftRecipe[] {
  const categoryMap: Record<string, string[]> = {
    healing: ['basic_healing_potion', 'super_healing_potion', 'hyper_healing_potion', 'max_healing_potion', 'full_restore_potion'],
    essence: ['basic_essence_elixir', 'super_essence_elixir', 'max_essence_elixir'],
    stats: ['might_elixir', 'wit_elixir', 'focus_elixir', 'agility_elixir', 'ward_elixir', 'vitality_elixir', 'universal_elixir'],
    special: ['stress_relief_elixir', 'loyalty_elixir', 'renewed_vigor_potion', 'youth_elixir', 'experience_elixir'],
    temporary: ['x_might_potion', 'x_ward_potion', 'x_agility_potion', 'x_focus_potion'],
    status: ['antidote_potion', 'awakening_potion'],
    legendary: ['immortality_elixir', 'divine_elixir'],
  };

  return POKEMON_INSPIRED_RECIPES.filter(recipe => 
    categoryMap[category]?.includes(recipe.id)
  );
}

/**
 * Retorna receitas por dificuldade (baseada na raridade dos ingredientes)
 */
export function getPokemonRecipesByDifficulty(difficulty: 'easy' | 'medium' | 'hard' | 'legendary'): CraftRecipe[] {
  const difficultyMap: Record<string, string[]> = {
    easy: [
      'basic_healing_potion', 'basic_essence_elixir', 'might_elixir', 'ward_elixir',
      'x_might_potion', 'x_ward_potion', 'antidote_potion', 'awakening_potion'
    ],
    medium: [
      'super_healing_potion', 'super_essence_elixir', 'wit_elixir', 'focus_elixir', 'agility_elixir',
      'stress_relief_elixir', 'loyalty_elixir', 'x_agility_potion', 'x_focus_potion'
    ],
    hard: [
      'hyper_healing_potion', 'max_essence_elixir', 'vitality_elixir', 'youth_elixir',
      'experience_elixir', 'full_restore_potion', 'universal_elixir', 'renewed_vigor_potion'
    ],
    legendary: [
      'max_healing_potion', 'immortality_elixir', 'divine_elixir'
    ],
  };

  return POKEMON_INSPIRED_RECIPES.filter(recipe => 
    difficultyMap[difficulty]?.includes(recipe.id)
  );
}
