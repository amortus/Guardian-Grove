/**
 * Tipos compartilhados entre Client e Server
 * Guardian Grove
 */

// ===== ATRIBUTOS E STATS =====

export interface Attributes {
  might: number;
  wit: number;
  focus: number;
  agility: number;
  ward: number;
  vitality: number;
}

export interface SecondaryStats {
  fatigue: number;
  stress: number;
  loyalty: number;
  age: number;
  maxAge: number;
}

// ===== LINHAS DE BESTAS =====

export type BeastLine = 
  | 'olgrim'
  | 'terravox'
  | 'feralis'
  | 'brontis'
  | 'zephyra'
  | 'ignar'
  | 'mirella'
  | 'umbrix'
  | 'sylphid'
  | 'raukor';

export type BeastBlood = 'common' | 'pale' | 'crimson' | 'azure' | 'verdant';

export type ElementalAffinity = 
  | 'shadow'
  | 'ether'
  | 'earth'
  | 'air'
  | 'fire'
  | 'water'
  | 'light'
  | 'moon'
  | 'blood';

export type PersonalityTrait =
  | 'loyal' | 'brave' | 'patient' | 'disciplined' | 'curious'
  | 'lazy' | 'proud' | 'anxious' | 'solitary' | 'eccentric'
  | 'stubborn' | 'fearful' | 'aggressive' | 'impulsive' | 'frail';

// ===== BESTA =====

export interface Beast {
  id: string;
  name: string;
  line: BeastLine;
  blood: BeastBlood;
  affinity: ElementalAffinity;
  attributes: Attributes;
  secondaryStats: SecondaryStats;
  traits: PersonalityTrait[];
  currentHp: number;
  maxHp: number;
  essence: number;
  maxEssence: number;
  techniques: string[];
  activeBuffs?: any[];
}

// ===== ITENS =====

export interface Item {
  id: string;
  name: string;
  category: 'food' | 'training' | 'medicine' | 'special' | 'crafting' | 'relic';
  description: string;
  price: number;
  effect?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// ===== GAME STATE =====

export interface GameState {
  playerName: string;
  week: number;
  coronas: number;
  victories: number;
  activeBeast: Beast | null;
  beasts: Beast[];
  inventory: Array<{ item: Item; quantity: number }>;
  quests: any[];
  achievements: any[];
  currentTitle: string;
  winStreak: number;
  loseStreak: number;
  totalTrains: number;
  totalCrafts: number;
  totalSpent: number;
  currentBattle: any | null;
}

// ===== API TYPES =====

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: number;
  email: string;
  displayName: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface GameSaveDTO {
  id: number;
  userId: number;
  playerName: string;
  week: number;
  coronas: number;
  victories: number;
  currentTitle: string;
  needsAvatarSelection: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BeastDTO {
  id: number;
  gameSaveId: number;
  name: string;
  line: BeastLine;
  isActive: boolean;
  currentHp: number;
  maxHp: number;
  essence: number;
  maxEssence: number;
  ageWeeks: number;
  might: number;
  wit: number;
  focus: number;
  agility: number;
  ward: number;
  vitality: number;
  loyalty: number;
  stress: number;
  fatigue: number;
  techniques: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItemDTO {
  id: number;
  gameSaveId: number;
  itemId: string;
  quantity: number;
  createdAt: Date;
}

export interface QuestDTO {
  id: number;
  gameSaveId: number;
  questId: string;
  progress: any;
  isCompleted: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface AchievementDTO {
  id: number;
  gameSaveId: number;
  achievementId: string;
  progress: number;
  unlockedAt?: Date;
  createdAt: Date;
}

