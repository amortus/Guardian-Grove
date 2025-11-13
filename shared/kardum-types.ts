/**
 * KARDUM - Tipos Compartilhados
 * Card Game Online - Client & Server
 */

// ===== RAÇAS E CLASSES =====

export type Race = 'human' | 'deva' | 'orc' | 'dwarf' | 'elf';

export type ClassType = 'warrior' | 'mage' | 'rogue' | 'druid' | 'archer' | 'barbarian' | 'necromancer' | 'elementalist';

// ===== TIPOS DE CARTA =====

export type CardType = 'general' | 'defender' | 'ability' | 'equipment' | 'mount' | 'consumable';

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

// ===== CARTA BASE =====

export interface Card {
  id: string;
  name: string;
  type: CardType;
  cost: number;          // Recursos de Guerra (0-10)
  description: string;
  rarity: CardRarity;
  imageUrl?: string;
}

// ===== GENERAL (HERÓI) =====

export interface GeneralCard extends Card {
  type: 'general';
  class: ClassType;
  race: Race;
  attack: number;
  health: number;
  maxHealth: number;
  ability?: GeneralAbility;
}

export interface GeneralAbility {
  id: string;
  name: string;
  description: string;
  cost: number;
  cooldown: number;
  effect: CardEffect;
}

// ===== DEFENDER (SOLDADO) =====

export interface DefenderCard extends Card {
  type: 'defender';
  race: Race;
  attack: number;
  health: number;
  maxHealth?: number;
  abilities?: DefenderAbility[];
  state?: 'deck' | 'hand' | 'field' | 'positioning' | 'graveyard';
}

export interface DefenderAbility {
  id: string;
  name: string;
  description: string;
  passive: boolean;
}

// ===== ABILITY (HABILIDADE) =====

export interface AbilityCard extends Card {
  type: 'ability';
  class: ClassType;
  damage?: number;
  heal?: number;
  target: TargetType;
  effects?: CardEffect[];
}

// ===== EQUIPMENT (EQUIPAMENTO) =====

export interface EquipmentCard extends Card {
  type: 'equipment';
  attachTo: 'defender' | 'general' | 'both';
  attackBonus?: number;
  healthBonus?: number;
  effects?: CardEffect[];
}

// ===== MOUNT (MONTARIA) =====

export interface MountCard extends Card {
  type: 'mount';
  mode?: 'defender' | 'equipment';
  // Modo Defender
  defenderStats?: {
    attack: number;
    health: number;
    abilities?: DefenderAbility[];
  };
  // Modo Equipment
  equipmentStats?: {
    attackBonus: number;
    healthBonus: number;
    effects?: CardEffect[];
  };
}

// ===== CONSUMABLE (CONSUMÍVEL) =====

export interface ConsumableCard extends Card {
  type: 'consumable';
  target: TargetType;
  effects: CardEffect[];
}

// ===== EFEITOS =====

export type TargetType = 
  | 'self'
  | 'ally'
  | 'enemy_single'
  | 'enemy_all'
  | 'enemy_general'
  | 'all';

export interface CardEffect {
  type: EffectType;
  value?: number;
  target: TargetType;
  duration?: number;
  chance?: number;
  condition?: string;
}

export type EffectType = 
  | 'damage'
  | 'heal'
  | 'buff_attack'
  | 'buff_health'
  | 'debuff_attack'
  | 'debuff_health'
  | 'draw'
  | 'destroy'
  | 'return_hand'
  | 'gain_resources';

// ===== ESTADO DO JOGADOR =====

export interface PlayerState {
  userId?: number;
  name: string;
  general: GeneralCard;
  deck: Card[];
  hand: Card[];
  field: DefenderCard[];
  graveyard: Card[];
  resources: number;         // Recursos atuais
  maxResources: number;      // Máximo (aumenta 1 por turno)
  hasDrawnThisTurn: boolean;
  hasPlayedAbility: boolean;
  hasPlayedMount: boolean;
}

// ===== PARTIDA =====

export type GamePhase = 
  | 'waiting'
  | 'draw'
  | 'strategy'
  | 'combat'
  | 'end_turn'
  | 'finished';

export interface GameMatch {
  id: string;
  player: PlayerState;
  opponent: PlayerState;
  turn: 'player' | 'opponent';
  phase: GamePhase;
  turnNumber: number;
  winner?: 'player' | 'opponent';
  isPvP: boolean;
  createdAt: Date;
}

// ===== DECK =====

export interface Deck {
  id: string;
  name: string;
  userId?: number;
  general: GeneralCard;
  cards: Card[];
  createdAt: Date;
  updatedAt: Date;
}

// ===== UTILITÁRIOS =====

export function isDefenderCard(card: Card): card is DefenderCard {
  return card.type === 'defender';
}

export function isAbilityCard(card: Card): card is AbilityCard {
  return card.type === 'ability';
}

export function isGeneralCard(card: Card): card is GeneralCard {
  return card.type === 'general';
}

export function isEquipmentCard(card: Card): card is EquipmentCard {
  return card.type === 'equipment';
}

export function isMountCard(card: Card): card is MountCard {
  return card.type === 'mount';
}

export function isConsumableCard(card: Card): card is ConsumableCard {
  return card.type === 'consumable';
}

