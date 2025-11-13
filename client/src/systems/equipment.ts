/**
 * Sistema de Equipamentos
 * 4 slots: Máscara, Armadura, Arma, Amuleto
 */

export type EquipmentSlot = 'mask' | 'armor' | 'weapon' | 'amulet';
export type EquipmentRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Equipment {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: EquipmentRarity;
  icon: string;
  description: string;
  stats: EquipmentStats;
  visualModel?: string; // ID do modelo 3D
  requirements?: {
    minLevel?: number;
    line?: string[];
  };
}

export interface EquipmentStats {
  might?: number;
  focus?: number;
  ward?: number;
  vitality?: number;
  agility?: number;
  wit?: number;
  // Efeitos especiais
  critChance?: number;
  dodgeChance?: number;
  lifesteal?: number;
  damageReduction?: number;
}

export interface BeastEquipment {
  mask: Equipment | null;
  armor: Equipment | null;
  weapon: Equipment | null;
  amulet: Equipment | null;
}

/**
 * Catálogo de Equipamentos
 */
export const EQUIPMENT_CATALOG: Equipment[] = [
  // ===== MÁSCARAS =====
  {
    id: 'mask_focus_basic',
    name: 'Máscara do Sábio',
    slot: 'mask',
    rarity: 'common',
    icon: '🎭',
    description: 'Aumenta Focus e Wit',
    stats: { focus: 5, wit: 3 },
  },
  {
    id: 'mask_might_rare',
    name: 'Máscara do Guerreiro',
    slot: 'mask',
    rarity: 'rare',
    icon: '😈',
    description: 'Aumenta Might e chance crítica',
    stats: { might: 8, critChance: 5 },
  },
  {
    id: 'mask_legendary',
    name: 'Máscara do Dragão',
    slot: 'mask',
    rarity: 'legendary',
    icon: '🐉',
    description: 'Poder supremo',
    stats: { might: 15, focus: 15, critChance: 10 },
  },

  // ===== ARMADURAS =====
  {
    id: 'armor_ward_basic',
    name: 'Armadura de Couro',
    slot: 'armor',
    rarity: 'common',
    icon: '🛡️',
    description: 'Proteção básica',
    stats: { ward: 10, vitality: 5 },
  },
  {
    id: 'armor_epic',
    name: 'Armadura de Placas',
    slot: 'armor',
    rarity: 'epic',
    icon: '⚔️',
    description: 'Defesa superior',
    stats: { ward: 20, vitality: 15, damageReduction: 10 },
  },
  {
    id: 'armor_legendary',
    name: 'Armadura Celestial',
    slot: 'armor',
    rarity: 'legendary',
    icon: '✨',
    description: 'Proteção divina',
    stats: { ward: 30, vitality: 25, damageReduction: 20 },
  },

  // ===== ARMAS =====
  {
    id: 'weapon_might_basic',
    name: 'Espada Curta',
    slot: 'weapon',
    rarity: 'common',
    icon: '🗡️',
    description: 'Arma básica',
    stats: { might: 8, agility: -2 },
  },
  {
    id: 'weapon_rare',
    name: 'Lâmina Flamejante',
    slot: 'weapon',
    rarity: 'rare',
    icon: '🔥',
    description: 'Espada de fogo',
    stats: { might: 15, focus: 8 },
  },
  {
    id: 'weapon_legendary',
    name: 'Excalibur',
    slot: 'weapon',
    rarity: 'legendary',
    icon: '⚡',
    description: 'Lâmina lendária',
    stats: { might: 25, focus: 15, critChance: 15 },
  },

  // ===== AMULETOS =====
  {
    id: 'amulet_vitality',
    name: 'Amuleto da Vida',
    slot: 'amulet',
    rarity: 'uncommon',
    icon: '💚',
    description: 'Aumenta vitalidade',
    stats: { vitality: 20 },
  },
  {
    id: 'amulet_agility',
    name: 'Amuleto do Vento',
    slot: 'amulet',
    rarity: 'rare',
    icon: '💨',
    description: 'Aumenta agilidade',
    stats: { agility: 15, dodgeChance: 8 },
  },
  {
    id: 'amulet_legendary',
    name: 'Coração do Eco',
    slot: 'amulet',
    rarity: 'legendary',
    icon: '💎',
    description: 'Poder do Eco',
    stats: { might: 10, focus: 10, ward: 10, vitality: 10, agility: 10, wit: 10 },
  },
];

/**
 * Calcula stats totais do equipamento
 */
export function calculateEquipmentStats(equipment: BeastEquipment): EquipmentStats {
  const total: EquipmentStats = {};
  
  const slots = [equipment.mask, equipment.armor, equipment.weapon, equipment.amulet];
  
  for (const item of slots) {
    if (!item) continue;
    
    for (const [stat, value] of Object.entries(item.stats)) {
      if (typeof value === 'number') {
        total[stat as keyof EquipmentStats] = (total[stat as keyof EquipmentStats] || 0) + value;
      }
    }
  }
  
  return total;
}

/**
 * Equipa item
 */
export function equipItem(
  currentEquipment: BeastEquipment,
  item: Equipment
): BeastEquipment {
  return {
    ...currentEquipment,
    [item.slot]: item,
  };
}

/**
 * Remove item
 */
export function unequipItem(
  currentEquipment: BeastEquipment,
  slot: EquipmentSlot
): BeastEquipment {
  return {
    ...currentEquipment,
    [slot]: null,
  };
}

/**
 * Obtém equipamento por ID
 */
export function getEquipmentById(id: string): Equipment | undefined {
  return EQUIPMENT_CATALOG.find(e => e.id === id);
}

/**
 * Obtém equipamentos por raridade
 */
export function getEquipmentByRarity(rarity: EquipmentRarity): Equipment[] {
  return EQUIPMENT_CATALOG.filter(e => e.rarity === rarity);
}

/**
 * Obtém equipamentos por slot
 */
export function getEquipmentBySlot(slot: EquipmentSlot): Equipment[] {
  return EQUIPMENT_CATALOG.filter(e => e.slot === slot);
}

/**
 * Sistema de forja - melhora equipamento
 */
export function forgeEquipment(
  equipment: Equipment,
  _materials: string[] // Prefix com _ para indicar que não é usado ainda
): Equipment {
  // TODO: Implementar lógica de forja
  // Por enquanto, retorna cópia com stats aumentados
  return {
    ...equipment,
    name: `${equipment.name} +1`,
    stats: {
      ...equipment.stats,
      might: (equipment.stats.might || 0) + 2,
      focus: (equipment.stats.focus || 0) + 2,
      ward: (equipment.stats.ward || 0) + 2,
    },
  };
}

