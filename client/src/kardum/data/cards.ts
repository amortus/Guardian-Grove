/**
 * KARDUM - Cartas de Teste
 * 20 cartas iniciais para o protótipo
 */

import {
  Card,
  GeneralCard,
  DefenderCard,
  AbilityCard,
  EquipmentCard,
  ConsumableCard,
} from '../../../../shared/kardum-types';

// ===== GENERAIS (2) =====

export const GENERAL_WARRIOR: GeneralCard = {
  id: 'gen_warrior',
  name: 'Comandante Marcus',
  type: 'general',
  class: 'warrior',
  race: 'human',
  cost: 0,
  attack: 3,
  health: 30,
  maxHealth: 30,
  description: 'General humano guerreiro. Fortalece suas tropas.',
  rarity: 'common',
  ability: {
    id: 'warrior_rage',
    name: 'Fúria de Batalha',
    description: 'Todos seus Defenders ganham +1 ATK',
    cost: 3,
    cooldown: 0,
    effect: {
      type: 'buff_attack',
      value: 1,
      target: 'all',
      duration: 1,
    },
  },
};

export const GENERAL_MAGE: GeneralCard = {
  id: 'gen_mage',
  name: 'Sylvanas Arcana',
  type: 'general',
  class: 'mage',
  race: 'elf',
  cost: 0,
  attack: 2,
  health: 25,
  maxHealth: 25,
  description: 'General elfo mago. Domina a magia elemental.',
  rarity: 'common',
  ability: {
    id: 'arcane_blast',
    name: 'Explosão Arcana',
    description: 'Causa 3 de dano em todos inimigos',
    cost: 4,
    cooldown: 0,
    effect: {
      type: 'damage',
      value: 3,
      target: 'enemy_all',
    },
  },
};

// ===== DEFENDERS (10) =====

export const DEFENDER_SOLDIER: DefenderCard = {
  id: 'def_soldier',
  name: 'Soldado Humano',
  type: 'defender',
  race: 'human',
  cost: 2,
  attack: 2,
  health: 3,
  maxHealth: 3,
  description: 'Soldado básico do exército humano.',
  rarity: 'common',
};

export const DEFENDER_BERSERKER: DefenderCard = {
  id: 'def_berserker',
  name: 'Berserker Orc',
  type: 'defender',
  race: 'orc',
  cost: 4,
  attack: 5,
  health: 4,
  maxHealth: 4,
  description: 'Ataca no turno que entra!',
  rarity: 'rare',
  abilities: [
    {
      id: 'charge',
      name: 'Investida',
      description: 'Pode atacar no turno que entra',
      passive: true,
    },
  ],
};

export const DEFENDER_TANK: DefenderCard = {
  id: 'def_tank',
  name: 'Guardião Anão',
  type: 'defender',
  race: 'dwarf',
  cost: 3,
  attack: 1,
  health: 7,
  maxHealth: 7,
  description: 'Inimigos devem atacar ele primeiro.',
  rarity: 'common',
  abilities: [
    {
      id: 'taunt',
      name: 'Provocar',
      description: 'Inimigos devem atacar esta carta',
      passive: true,
    },
  ],
};

export const DEFENDER_ARCHER: DefenderCard = {
  id: 'def_archer',
  name: 'Arqueiro Elfo',
  type: 'defender',
  race: 'elf',
  cost: 3,
  attack: 3,
  health: 2,
  maxHealth: 2,
  description: 'Alto ataque, baixa vida.',
  rarity: 'common',
};

export const DEFENDER_PRIEST: DefenderCard = {
  id: 'def_priest',
  name: 'Sacerdote Deva',
  type: 'defender',
  race: 'deva',
  cost: 3,
  attack: 1,
  health: 5,
  maxHealth: 5,
  description: 'Suporte divino.',
  rarity: 'common',
};

export const DEFENDER_SCOUT: DefenderCard = {
  id: 'def_scout',
  name: 'Batedor Humano',
  type: 'defender',
  race: 'human',
  cost: 1,
  attack: 1,
  health: 2,
  maxHealth: 2,
  description: 'Unidade rápida e barata.',
  rarity: 'common',
};

export const DEFENDER_KNIGHT: DefenderCard = {
  id: 'def_knight',
  name: 'Cavaleiro Humano',
  type: 'defender',
  race: 'human',
  cost: 4,
  attack: 4,
  health: 4,
  maxHealth: 4,
  description: 'Guerreiro balanceado.',
  rarity: 'common',
};

export const DEFENDER_SHAMAN: DefenderCard = {
  id: 'def_shaman',
  name: 'Xamã Orc',
  type: 'defender',
  race: 'orc',
  cost: 3,
  attack: 2,
  health: 4,
  maxHealth: 4,
  description: 'Suporte tribal.',
  rarity: 'rare',
};

export const DEFENDER_RANGER: DefenderCard = {
  id: 'def_ranger',
  name: 'Patrulheiro Elfo',
  type: 'defender',
  race: 'elf',
  cost: 2,
  attack: 2,
  health: 2,
  maxHealth: 2,
  description: 'Rápido e ágil.',
  rarity: 'common',
};

export const DEFENDER_GOLEM: DefenderCard = {
  id: 'def_golem',
  name: 'Golem de Pedra',
  type: 'defender',
  race: 'dwarf',
  cost: 5,
  attack: 3,
  health: 8,
  maxHealth: 8,
  description: 'Muro impenetrável.',
  rarity: 'rare',
};

// ===== ABILITIES (5) =====

export const ABILITY_FIREBALL: AbilityCard = {
  id: 'abi_fireball',
  name: 'Bola de Fogo',
  type: 'ability',
  class: 'mage',
  cost: 4,
  damage: 5,
  target: 'enemy_single',
  description: 'Causa 5 de dano a um inimigo.',
  rarity: 'common',
};

export const ABILITY_HEAL: AbilityCard = {
  id: 'abi_heal',
  name: 'Toque Curativo',
  type: 'ability',
  class: 'mage',
  cost: 3,
  heal: 5,
  target: 'ally',
  description: 'Cura 5 de vida em um aliado.',
  rarity: 'common',
};

export const ABILITY_CHARGE: AbilityCard = {
  id: 'abi_charge',
  name: 'Investida Feroz',
  type: 'ability',
  class: 'warrior',
  cost: 3,
  damage: 3,
  target: 'enemy_single',
  description: 'Causa 3 de dano direto.',
  rarity: 'common',
};

export const ABILITY_LIGHTNING: AbilityCard = {
  id: 'abi_lightning',
  name: 'Relâmpago',
  type: 'ability',
  class: 'mage',
  cost: 2,
  damage: 2,
  target: 'enemy_single',
  description: 'Causa 2 de dano rápido.',
  rarity: 'common',
};

export const ABILITY_SMITE: AbilityCard = {
  id: 'abi_smite',
  name: 'Golpe Sagrado',
  type: 'ability',
  class: 'warrior',
  cost: 5,
  damage: 6,
  target: 'enemy_general',
  description: 'Dano direto no General inimigo.',
  rarity: 'rare',
};

// ===== EQUIPMENT (2) =====

export const EQUIPMENT_SWORD: EquipmentCard = {
  id: 'equ_sword',
  name: 'Espada de Ferro',
  type: 'equipment',
  attachTo: 'defender',
  cost: 2,
  attackBonus: 2,
  healthBonus: 0,
  description: '+2 ATK para um Defender.',
  rarity: 'common',
};

export const EQUIPMENT_ARMOR: EquipmentCard = {
  id: 'equ_armor',
  name: 'Armadura de Aço',
  type: 'equipment',
  attachTo: 'both',
  cost: 3,
  attackBonus: 0,
  healthBonus: 4,
  description: '+4 HP para Defender ou General.',
  rarity: 'common',
};

// ===== CONSUMABLE (1) =====

export const CONSUMABLE_POTION: ConsumableCard = {
  id: 'con_potion',
  name: 'Poção de Cura',
  type: 'consumable',
  cost: 2,
  target: 'self',
  description: 'Cura 5 de vida no seu General.',
  rarity: 'common',
  effects: [
    {
      type: 'heal',
      value: 5,
      target: 'self',
    },
  ],
};

// ===== TODAS AS CARTAS =====

export const ALL_CARDS: Card[] = [
  GENERAL_WARRIOR,
  GENERAL_MAGE,
  DEFENDER_SOLDIER,
  DEFENDER_BERSERKER,
  DEFENDER_TANK,
  DEFENDER_ARCHER,
  DEFENDER_PRIEST,
  DEFENDER_SCOUT,
  DEFENDER_KNIGHT,
  DEFENDER_SHAMAN,
  DEFENDER_RANGER,
  DEFENDER_GOLEM,
  ABILITY_FIREBALL,
  ABILITY_HEAL,
  ABILITY_CHARGE,
  ABILITY_LIGHTNING,
  ABILITY_SMITE,
  EQUIPMENT_SWORD,
  EQUIPMENT_ARMOR,
  CONSUMABLE_POTION,
];

// ===== DECK INICIAL (30 cartas) =====

export function createStarterDeck(general: GeneralCard): Card[] {
  const deck: Card[] = [];

  if (general.class === 'warrior') {
    // Deck Warrior: Foco em Defenders fortes
    for (let i = 0; i < 8; i++) deck.push({ ...DEFENDER_SOLDIER, id: `soldier_${i}` });
    for (let i = 0; i < 4; i++) deck.push({ ...DEFENDER_KNIGHT, id: `knight_${i}` });
    for (let i = 0; i < 3; i++) deck.push({ ...DEFENDER_TANK, id: `tank_${i}` });
    for (let i = 0; i < 2; i++) deck.push({ ...DEFENDER_BERSERKER, id: `berserker_${i}` });
    for (let i = 0; i < 5; i++) deck.push({ ...ABILITY_CHARGE, id: `charge_${i}` });
    for (let i = 0; i < 3; i++) deck.push({ ...EQUIPMENT_SWORD, id: `sword_${i}` });
    for (let i = 0; i < 3; i++) deck.push({ ...EQUIPMENT_ARMOR, id: `armor_${i}` });
    for (let i = 0; i < 2; i++) deck.push({ ...CONSUMABLE_POTION, id: `potion_${i}` });
  } else {
    // Deck Mage: Foco em Abilities
    for (let i = 0; i < 6; i++) deck.push({ ...DEFENDER_SOLDIER, id: `soldier_${i}` });
    for (let i = 0; i < 4; i++) deck.push({ ...DEFENDER_ARCHER, id: `archer_${i}` });
    for (let i = 0; i < 3; i++) deck.push({ ...DEFENDER_PRIEST, id: `priest_${i}` });
    for (let i = 0; i < 2; i++) deck.push({ ...DEFENDER_RANGER, id: `ranger_${i}` });
    for (let i = 0; i < 6; i++) deck.push({ ...ABILITY_FIREBALL, id: `fireball_${i}` });
    for (let i = 0; i < 4; i++) deck.push({ ...ABILITY_HEAL, id: `heal_${i}` });
    for (let i = 0; i < 3; i++) deck.push({ ...ABILITY_LIGHTNING, id: `lightning_${i}` });
    for (let i = 0; i < 2; i++) deck.push({ ...CONSUMABLE_POTION, id: `potion_${i}` });
  }

  return deck;
}

// Helper para obter carta por ID
export function getCardById(id: string): Card | undefined {
  return ALL_CARDS.find(c => c.id === id);
}

