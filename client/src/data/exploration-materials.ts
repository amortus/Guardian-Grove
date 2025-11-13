/**
 * Materiais de Exploração - Guardian Grove
 * Materiais dropados por monstros selvagens durante exploração
 */

import type { Item } from '../types';

// ===== MATERIAIS DE EXPLORAÇÃO =====

export const EXPLORATION_MATERIALS: Item[] = [
  // === MATERIAIS COMUNS (Fácil de conseguir) ===
  {
    id: 'leather_scrap',
    name: 'Retalho de Couro',
    category: 'relic',
    icon: '🧥',
    effect: 'Material de craft comum',
    price: 10,
    description: 'Pedaço de couro de besta selvagem. Usado em craft básico.',
    quantity: 0,
  },
  {
    id: 'bone_fragment',
    name: 'Fragmento de Osso',
    category: 'relic',
    icon: '🦴',
    effect: 'Material de craft comum',
    price: 12,
    description: 'Osso quebrado de criatura. Resistente e útil.',
    quantity: 0,
  },
  {
    id: 'claw_shard',
    name: 'Lasca de Garra',
    category: 'relic',
    icon: '🪝',
    effect: 'Material de craft comum',
    price: 15,
    description: 'Garra afiada de predador. Perfura facilmente.',
    quantity: 0,
  },
  {
    id: 'fur_tuft',
    name: 'Tufo de Pelo',
    category: 'relic',
    icon: '🧶',
    effect: 'Material de craft comum',
    price: 8,
    description: 'Pelo macio e quente. Perfeito para proteção.',
    quantity: 0,
  },
  {
    id: 'fang_small',
    name: 'Presa Pequena',
    category: 'relic',
    icon: '🦷',
    effect: 'Material de craft comum',
    price: 18,
    description: 'Dente afiado de carnívoro jovem.',
    quantity: 0,
  },

  // === MATERIAIS INCOMUNS (Médio) ===
  {
    id: 'scale_iron',
    name: 'Escama de Ferro',
    category: 'relic',
    icon: '🛡️',
    effect: 'Material de craft incomum',
    price: 35,
    description: 'Escama extremamente resistente. Dura como metal.',
    quantity: 0,
  },
  {
    id: 'venom_sac',
    name: 'Glândula de Veneno',
    category: 'relic',
    icon: '☠️',
    effect: 'Material de craft incomum',
    price: 40,
    description: 'Contém veneno potente. Manuseie com cuidado!',
    quantity: 0,
  },
  {
    id: 'feather_mystic',
    name: 'Pena Mística',
    category: 'relic',
    icon: '🪶',
    effect: 'Material de craft incomum',
    price: 45,
    description: 'Pena brilhante imbuída de energia mágica.',
    quantity: 0,
  },
  {
    id: 'horn_curved',
    name: 'Chifre Curvado',
    category: 'relic',
    icon: '🦏',
    effect: 'Material de craft incomum',
    price: 50,
    description: 'Chifre forte e imponente. Símbolo de poder.',
    quantity: 0,
  },
  {
    id: 'eye_crystal',
    name: 'Cristal Ocular',
    category: 'crystal',
    icon: '👁️',
    effect: 'Material de craft incomum',
    price: 55,
    description: 'Olho cristalizado de criatura ancestral. Vê além.',
    quantity: 0,
  },

  // === MATERIAIS RAROS (Difícil) ===
  {
    id: 'heart_stone',
    name: 'Coração de Pedra',
    category: 'crystal',
    effect: 'Material de craft raro',
    price: 100,
    description: 'Coração petrificado de golem antigo. Pulsa com energia.',
    quantity: 0,
  },
  {
    id: 'shadow_essence_raw',
    name: 'Essência Sombria Bruta',
    category: 'crystal',
    effect: 'Material de craft raro',
    price: 120,
    description: 'Escuridão pura e concentrada. Poder das sombras.',
    quantity: 0,
  },
  {
    id: 'flame_core',
    name: 'Núcleo Flamejante',
    category: 'crystal',
    effect: 'Material de craft raro',
    price: 110,
    description: 'Núcleo ainda quente de criatura ígnea. Queima eternamente.',
    quantity: 0,
  },
  {
    id: 'dragon_scale',
    name: 'Escama de Dragão',
    category: 'relic',
    effect: 'Material de craft raro',
    price: 150,
    description: 'Escama lendária. Impenetrável e preciosa.',
    quantity: 0,
  },
  {
    id: 'ethereal_dust',
    name: 'Poeira Etérea',
    category: 'crystal',
    effect: 'Material de craft raro',
    price: 90,
    description: 'Resíduo de espírito ancestral. Flutua no ar.',
    quantity: 0,
  },

  // === MATERIAIS ÉPICOS (Muito Raro) ===
  {
    id: 'ancient_blood',
    name: 'Sangue Ancestral',
    category: 'herb',
    effect: 'Material de craft épico',
    price: 250,
    description: 'Sangue de criatura lendária. Nunca coagula.',
    quantity: 0,
  },
  {
    id: 'titan_bone',
    name: 'Osso de Titã',
    category: 'relic',
    effect: 'Material de craft épico',
    price: 300,
    description: 'Osso gigantesco de titã caído. Poder primordial.',
    quantity: 0,
  },
  {
    id: 'phoenix_ash',
    name: 'Cinzas de Fênix',
    category: 'herb',
    effect: 'Material de craft épico',
    price: 280,
    description: 'Cinzas de fênix renascida. Revive o que foi perdido.',
    quantity: 0,
  },
  {
    id: 'void_fragment',
    name: 'Fragmento do Vazio',
    category: 'crystal',
    effect: 'Material de craft épico',
    price: 350,
    description: 'Pedaço do vazio absoluto. Não deveria existir.',
    quantity: 0,
  },
  {
    id: 'celestial_shard',
    name: 'Estilhaço Celestial',
    category: 'crystal',
    effect: 'Material de craft épico',
    price: 400,
    description: 'Fragmento de estrela caída. Brilha com luz divina.',
    quantity: 0,
  },

  // === MATERIAIS ADICIONAIS PARA CRAFT (HERBS) ===
  {
    id: 'serene_herb',
    name: 'Erva Serena',
    category: 'herb',
    effect: 'Material de craft comum',
    price: 8,
    description: 'Erva calmante com aroma suave. Base de muitas poções.',
    quantity: 0,
  },
  {
    id: 'healing_herb',
    name: 'Erva Curativa',
    category: 'herb',
    effect: 'Material de craft comum',
    price: 15,
    description: 'Erva medicinal poderosa. Acelera regeneração.',
    quantity: 0,
  },
  {
    id: 'energy_herb',
    name: 'Erva Energética',
    category: 'herb',
    effect: 'Material de craft comum',
    price: 12,
    description: 'Erva vibrante que restaura energia vital.',
    quantity: 0,
  },
  {
    id: 'mood_herb',
    name: 'Erva do Humor',
    category: 'herb',
    effect: 'Material de craft incomum',
    price: 30,
    description: 'Erva rara que eleva o ânimo e reduz stress.',
    quantity: 0,
  },
  {
    id: 'vital_fruit',
    name: 'Fruta Vital',
    category: 'food',
    effect: 'Material de craft incomum',
    price: 35,
    description: 'Fruto nutritivo repleto de energia vital.',
    quantity: 0,
  },

  // === EQUIPAMENTOS DE TREINO ===
  {
    id: 'training_weights',
    name: 'Pesos de Treino',
    category: 'training',
    effect: 'Material de craft incomum',
    price: 40,
    description: 'Pesos pesados para treino intenso de força.',
    quantity: 0,
  },
  {
    id: 'agility_boots',
    name: 'Botas de Agilidade',
    category: 'training',
    effect: 'Material de craft raro',
    price: 80,
    description: 'Botas leves que aumentam velocidade de movimento.',
    quantity: 0,
  },
  {
    id: 'focus_charm',
    name: 'Amuleto de Foco',
    category: 'relic',
    effect: 'Material de craft raro',
    price: 85,
    description: 'Amuleto místico que aumenta concentração mental.',
    quantity: 0,
  },
  {
    id: 'wisdom_tome',
    name: 'Tomo da Sabedoria',
    category: 'relic',
    effect: 'Material de craft raro',
    price: 90,
    description: 'Livro antigo contendo conhecimento ancestral.',
    quantity: 0,
  },

  // === CRISTAIS ESPECIAIS ===
  {
    id: 'echo_crystal',
    name: 'Cristal Eco',
    category: 'crystal',
    effect: 'Material de craft raro',
    price: 100,
    description: 'Cristal que ressoa com energia vital. Amplifica efeitos.',
    quantity: 0,
  },
  {
    id: 'legendary_crystal',
    name: 'Cristal Lendário',
    category: 'crystal',
    effect: 'Material de craft épico',
    price: 250,
    description: 'Cristal extremamente raro com poder imenso.',
    quantity: 0,
  },
  {
    id: 'rejuvenation_crystal',
    name: 'Cristal de Rejuvenescimento',
    category: 'crystal',
    effect: 'Material de craft épico',
    price: 280,
    description: 'Cristal místico que reverte o envelhecimento.',
    quantity: 0,
  },

  // === ITENS ESPECIAIS ===
  {
    id: 'feast',
    name: 'Banquete',
    category: 'food',
    effect: 'Material de craft épico',
    price: 200,
    description: 'Refeição farta e nutritiva. Aumenta lealdade drasticamente.',
    quantity: 0,
  },
  {
    id: 'ambrosía',
    name: 'Ambrósia',
    category: 'food',
    effect: 'Material de craft épico',
    price: 300,
    description: 'Alimento dos deuses. Poder divino concentrado.',
    quantity: 0,
  },
  {
    id: 'legendary_relic',
    name: 'Relíquia Lendária',
    category: 'relic',
    effect: 'Material de craft épico',
    price: 400,
    description: 'Artefato de poder imensurável. Extremamente raro.',
    quantity: 0,
  },
];

// ===== DROPS POR RARIDADE =====

export interface MaterialDrop {
  itemId: string;
  chance: number; // 0-100
  minQuantity: number;
  maxQuantity: number;
}

// Pools de drops por raridade
export const DROP_POOLS = {
  common: [
    // Materiais base
    { itemId: 'leather_scrap', chance: 40, minQuantity: 1, maxQuantity: 3 },
    { itemId: 'bone_fragment', chance: 35, minQuantity: 1, maxQuantity: 2 },
    { itemId: 'claw_shard', chance: 30, minQuantity: 1, maxQuantity: 2 },
    { itemId: 'fur_tuft', chance: 45, minQuantity: 2, maxQuantity: 4 },
    { itemId: 'fang_small', chance: 25, minQuantity: 1, maxQuantity: 1 },
    // Herbs comuns
    { itemId: 'serene_herb', chance: 50, minQuantity: 2, maxQuantity: 5 },
    { itemId: 'healing_herb', chance: 35, minQuantity: 1, maxQuantity: 3 },
    { itemId: 'energy_herb', chance: 40, minQuantity: 1, maxQuantity: 4 },
  ],
  uncommon: [
    // Materiais incomuns
    { itemId: 'scale_iron', chance: 25, minQuantity: 1, maxQuantity: 2 },
    { itemId: 'venom_sac', chance: 20, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'feather_mystic', chance: 22, minQuantity: 1, maxQuantity: 2 },
    { itemId: 'horn_curved', chance: 18, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'eye_crystal', chance: 15, minQuantity: 1, maxQuantity: 1 },
    // Herbs e equipamentos incomuns
    { itemId: 'mood_herb', chance: 20, minQuantity: 1, maxQuantity: 2 },
    { itemId: 'vital_fruit', chance: 18, minQuantity: 1, maxQuantity: 2 },
    { itemId: 'training_weights', chance: 15, minQuantity: 1, maxQuantity: 1 },
  ],
  rare: [
    // Materiais raros
    { itemId: 'heart_stone', chance: 10, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'shadow_essence_raw', chance: 8, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'flame_core', chance: 9, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'dragon_scale', chance: 5, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'ethereal_dust', chance: 12, minQuantity: 1, maxQuantity: 2 },
    // Cristais e equipamentos raros
    { itemId: 'echo_crystal', chance: 12, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'focus_charm', chance: 8, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'wisdom_tome', chance: 7, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'agility_boots', chance: 9, minQuantity: 1, maxQuantity: 1 },
  ],
  epic: [
    // Materiais épicos
    { itemId: 'ancient_blood', chance: 3, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'titan_bone', chance: 2, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'phoenix_ash', chance: 3, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'void_fragment', chance: 1, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'celestial_shard', chance: 1, minQuantity: 1, maxQuantity: 1 },
    // Materiais épicos de craft
    { itemId: 'legendary_crystal', chance: 4, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'rejuvenation_crystal', chance: 3, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'feast', chance: 5, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'ambrosía', chance: 2, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'legendary_relic', chance: 1, minQuantity: 1, maxQuantity: 1 },
  ],
};

// ===== HELPER FUNCTIONS =====

/**
 * Gera drops baseado em raridade
 */
export function generateDrops(rarity: 'common' | 'uncommon' | 'rare' | 'epic'): Item[] {
  const pool = DROP_POOLS[rarity];
  const drops: Item[] = [];

  for (const dropConfig of pool) {
    // Verifica chance
    if (Math.random() * 100 <= dropConfig.chance) {
      const quantity = Math.floor(
        Math.random() * (dropConfig.maxQuantity - dropConfig.minQuantity + 1)
      ) + dropConfig.minQuantity;

      const material = EXPLORATION_MATERIALS.find(m => m.id === dropConfig.itemId);
      if (material) {
        drops.push({
          ...material,
          quantity,
        });
      }
    }
  }

  return drops;
}

/**
 * Gera drops múltiplos (combate com vários inimigos)
 */
export function generateMultipleDrops(
  rarity: 'common' | 'uncommon' | 'rare' | 'epic',
  count: number
): Item[] {
  const allDrops: Item[] = [];

  for (let i = 0; i < count; i++) {
    const drops = generateDrops(rarity);
    allDrops.push(...drops);
  }

  // Consolida itens iguais
  const consolidated: Map<string, Item> = new Map();
  
  for (const drop of allDrops) {
    if (consolidated.has(drop.id)) {
      const existing = consolidated.get(drop.id)!;
      existing.quantity = (existing.quantity || 0) + (drop.quantity || 0);
    } else {
      consolidated.set(drop.id, { ...drop });
    }
  }

  return Array.from(consolidated.values());
}

/**
 * Retorna material por ID
 */
export function getMaterialById(id: string): Item | undefined {
  return EXPLORATION_MATERIALS.find(m => m.id === id);
}

/**
 * Retorna materiais por categoria
 */
export function getMaterialsByCategory(category: Item['category']): Item[] {
  return EXPLORATION_MATERIALS.filter(m => m.category === category);
}

