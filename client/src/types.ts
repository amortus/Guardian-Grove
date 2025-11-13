/**
 * Tipos e interfaces do Guardian Grove
 * Define todas as estruturas de dados do jogo
 */

// ===== ATRIBUTOS E STATS =====

export interface Attributes {
  might: number;      // Força - dano físico
  wit: number;        // Astúcia - dano místico
  focus: number;      // Foco - precisão
  agility: number;    // Agilidade - esquiva e velocidade
  ward: number;       // Resistência - defesa
  vitality: number;   // Vitalidade - HP total
}

export interface SecondaryStats {
  fatigue: number;    // 0-100, aumenta com treino/trabalho
  stress: number;     // 0-100, afeta obediência
  loyalty: number;    // 0-100, determina obediência em batalha
  age: number;        // Idade em semanas
  maxAge: number;     // Expectativa de vida
}

// ===== LINHAS DE BESTAS =====

export type BeastLine = 
  | 'olgrim'      // Olho Ancestral
  | 'terravox'    // Golem de Pedra
  | 'feralis'     // Felino Selvagem
  | 'brontis'     // Réptil Colosso
  | 'zephyra'     // Ave de Vento
  | 'ignar'       // Fera Ígnea
  | 'mirella'     // Criatura Anfíbia
  | 'umbrix'      // Besta Sombria
  | 'sylphid'     // Espírito Etéreo
  | 'raukor';     // Lobo Ancestral

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

// ===== TRAÇOS DE PERSONALIDADE =====

export type PersonalityTrait =
  // Positivos
  | 'loyal'         // Leal
  | 'brave'         // Corajoso
  | 'patient'       // Paciente
  | 'disciplined'   // Disciplinado
  | 'curious'       // Curioso
  // Neutros
  | 'lazy'          // Preguiçoso
  | 'proud'         // Orgulhoso
  | 'anxious'       // Ansioso
  | 'solitary'      // Solitário
  | 'eccentric'     // Excêntrico
  // Negativos
  | 'stubborn'      // Teimoso
  | 'fearful'       // Medroso
  | 'aggressive'    // Agressivo
  | 'impulsive'     // Impulsivo
  | 'frail';        // Frágil

// ===== TÉCNICAS =====

export interface Technique {
  id: string;
  name: string;
  essenceCost: number;
  damage: number;
  type: 'physical' | 'mystical' | 'defensive' | 'utility';
  effect?: string;
  description: string;
}

// ===== AÇÕES EM TEMPO REAL =====

export interface BeastAction {
  type: 'train_might' | 'train_wit' | 'train_focus' | 'train_agility' | 'train_ward' | 'train_vitality' | 
        'work_warehouse' | 'work_farm' | 'work_guard' | 'work_library' |
        'rest_sleep' | 'rest_freetime' | 'rest_walk' | 'rest_eat' |
        'exploration' | 'tournament';
  startTime: number;    // timestamp em ms
  duration: number;     // duração em ms
  completesAt: number;  // timestamp quando completa
  canCancel: boolean;
}

// ===== BESTA =====

export interface Beast {
  id: string;
  name: string;
  line: BeastLine;
  blood: BeastBlood;
  affinity: ElementalAffinity;
  
  // Atributos
  attributes: Attributes;
  secondaryStats: SecondaryStats;
  
  // Personalidade
  traits: PersonalityTrait[];
  mood: 'happy' | 'neutral' | 'sad' | 'angry' | 'tired';
  
  // Técnicas e combate
  techniques: Technique[];
  currentHp: number;
  maxHp: number;
  essence: number;
  maxEssence: number;
  
  // Buffs ativos
  activeBuffs?: Array<{
    type: string;
    value: number;
    duration: number;
  }>;
  
  // Histórico
  birthWeek: number;
  lifeEvents: LifeEvent[];
  victories: number;
  defeats: number;
  
  // Aparência
  color?: string;
  variant?: string;
  
  // Uso de elixires
  elixirUsage?: {
    might?: number;      // 0-5 usos
    wit?: number;        // 0-5 usos
    focus?: number;      // 0-5 usos
    agility?: number;    // 0-5 usos
    ward?: number;       // 0-5 usos
    vitality?: number;   // 0-5 usos
    total?: number;      // 0-20 usos totais
    youth?: number;      // 0-3 usos
    immortality?: number; // 0-1 uso
  };
  
  // Sistema de tempo real
  currentAction?: BeastAction;
  lastExploration?: number;     // timestamp da última exploração
  lastTournament?: number;      // timestamp do último torneio
  explorationCount?: number;    // contador de explorações no período atual
  birthDate?: number;           // timestamp de nascimento
  lastUpdate?: number;          // timestamp da última atualização
  
  // Sistema de ciclo diário
  ageInDays?: number;           // idade atual em dias (processado a meia-noite)
  lastDayProcessed?: number;    // timestamp da última meia-noite processada
  
  // Bônus de trabalho (limite 10 vezes)
  workBonusCount?: number;      // 0-10 bônus recebidos
  
  // Sistema de treinos diários (NOVO)
  dailyTrainingCount?: number;  // 0-5 treinos realizados hoje
  lastTrainingReset?: number;   // timestamp do último reset (meia-noite)
  dailyPotionUsed?: boolean;    // se usou Poção de Vigor Renovado hoje
  lastPotionReset?: number;     // timestamp do último reset da poção
}

export interface LifeEvent {
  week: number;
  type: 'birth' | 'tournament' | 'training' | 'work' | 'rest' | 'exploration' | 'special';
  description: string;
}

// ===== CHAT SYSTEM =====

export interface ChatMessage {
  id: string;
  channel: 'global' | 'group' | 'trade' | 'whisper' | 'system';
  sender: string; // username
  senderUserId: number;
  recipient?: string; // para whispers
  message: string;
  timestamp: number;
  color: string; // cor da mensagem
}

export interface ChatTab {
  id: string;
  name: string;
  channel: 'global' | 'group' | 'trade' | 'whisper' | 'custom';
  target?: string; // para whispers - nome do outro usuário
  unreadCount: number;
  messages: ChatMessage[];
}

export interface Friend {
  id: number;
  userId: number;
  friendId: number;
  friendName: string;
  status: 'pending' | 'accepted' | 'blocked';
  requestedAt: number;
  acceptedAt?: number;
  isOnline?: boolean;
}

export interface FriendRequest {
  id: number;
  fromUserId: number;
  fromUsername: string;
  toUserId: number;
  toUsername: string;
  status: 'pending';
  requestedAt: number;
  direction: 'sent' | 'received';
}

// ===== CRESCIMENTO =====

export interface GrowthCurve {
  might: 'none' | 'slow' | 'medium' | 'fast' | 'veryfast';
  wit: 'none' | 'slow' | 'medium' | 'fast' | 'veryfast';
  focus: 'none' | 'slow' | 'medium' | 'fast' | 'veryfast';
  agility: 'none' | 'slow' | 'medium' | 'fast' | 'veryfast';
  ward: 'none' | 'slow' | 'medium' | 'fast' | 'veryfast';
  vitality: 'none' | 'slow' | 'medium' | 'fast' | 'veryfast';
}

// ===== CALENDÁRIO E AÇÕES =====

export type WeeklyAction = 
  | 'train_might'
  | 'train_wit'
  | 'train_focus'
  | 'train_agility'
  | 'train_ward'
  | 'train_vitality'
  | 'work_warehouse'
  | 'work_farm'
  | 'work_guard'
  | 'work_library'
  | 'rest_sleep'
  | 'rest_freetime'
  | 'rest_walk'
  | 'rest_eat'
  | 'tournament'
  | 'exploration';

export interface WeekSchedule {
  week: number;
  actions: WeeklyAction[];
}

// ===== COMBATE =====

export type BattlePhase = 'intro' | 'player_turn' | 'enemy_turn' | 'animating' | 'victory' | 'defeat' | 'fled';

export type CombatAction = {
  type: 'technique';
  techniqueId: string;
} | {
  type: 'defend';
} | {
  type: 'item';
  itemId: string;
} | {
  type: 'flee';
};

export interface CombatEntity {
  beast: Beast;
  currentHp: number;
  currentEssence: number;
  isDefending: boolean;
  activeEffects: CombatEffect[];
}

export interface CombatEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'drain' | 'stun' | 'burn' | 'poison';
  stat?: keyof Attributes;
  value: number;
  duration: number;
  description: string;
}

export interface CombatResult {
  success: boolean;
  damage: number;
  essenceCost: number;
  disobeyed: boolean;
  critical: boolean;
  missed: boolean;
  effects: CombatEffect[];
  messages: string[];
}

export interface BattleContext {
  phase: BattlePhase;
  player: CombatEntity;
  enemy: CombatEntity;
  turnCount: number;
  combatLog: string[];
  winner: 'player' | 'enemy' | null;
  rewards?: BattleRewards;
  canFlee: boolean;
}

export interface BattleRewards {
  coronas: number;
  experience: number;
  items: string[];
  rank?: TournamentRank;
}

// ===== RELÍQUIAS =====

export interface Relic {
  id: string;
  name: string;
  rarity: 'common' | 'ancient' | 'obscure' | 'legendary';
  seed: string; // Seed para geração procedural
}

// ===== ECONOMIA =====

export interface Economy {
  coronas: number;
  ecoCrystals: number;
}

export interface Item {
  id: string;
  name: string;
  category: 'food' | 'herb' | 'crystal' | 'training' | 'relic';
  effect: string;
  price: number;
  description: string;
  quantity?: number;
}

// ===== NPCS =====

export type NpcId = 'ruvian' | 'liora' | 'dalan' | 'alya' | 'koran' | 'toran' | 'eryon';

export interface NPC {
  id: string;
  name: string;
  title: string;
  description: string;
  affinity: number; // 0-100
  dialogues: {
    greeting?: string[];
    advice?: string[];
    lore?: string[];
    shop?: string[];
    barter?: string[];
    challenge?: string[];
    respect?: string[];
    friendly?: string[];
    farewell?: string[];
    [key: string]: string[] | undefined;
  };
  location: string;
  unlocked: boolean;
}

// Legacy alias for compatibility
export type Npc = NPC;

// ===== TORNEIOS =====

export type TournamentRank = 'bronze' | 'silver' | 'gold' | 'mythic';

export interface Tournament {
  id: string;
  name: string;
  rank: TournamentRank;
  entryFee: number;
  prize: number;
  opponents: Beast[];
}

// ===== GUARDIAN (JOGADOR) =====

export interface Guardian {
  name: string;
  level: number;
  title: string;
  reputation: number;
  
  // Progressão
  bronzeWins: number;
  silverWins: number;
  goldWins: number;
  mythicWins: number;
  
  // Rancho
  ranchUpgrades: string[];
  maxBeasts: number;
}

// ===== RANCHO =====

export interface Ranch {
  beasts: Beast[];
  maxBeasts: number;
  upgrades: string[];
}

// ===== ESTADO DO JOGO =====

export interface GameState {
  // Sistema de tempo real
  serverTime?: number;      // timestamp sincronizado com servidor
  lastSync?: number;        // timestamp da última sincronização
  
  guardian: Guardian;
  currentWeek?: number;
  year?: number;
  ranch: Ranch;
  activeBeast: Beast | null;
  needsAvatarSelection: boolean;
  economy: Economy;
  inventory: Item[];
  npcs: NPC[];
  quests: Array<{
    id: string;
    name: string;
    description: string;
    type: 'battle' | 'training' | 'collection' | 'social';
    goal: { type: 'win_battles' | 'train' | 'rest' | 'collect_item' | 'talk_to_npc' | 'reach_level' | 'spend_money'; target: number | string; current: number };
    rewards: { coronas?: number; items?: Array<{ itemId: string; quantity: number }>; experience?: number; unlockFeature?: string };
    isCompleted: boolean;
    isActive: boolean;
    progress: number;
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'battle' | 'training' | 'collection' | 'social' | 'special';
    requirement: { type: string; target: number | string; current: number };
    reward: { title?: string; coronas?: number; items?: Array<{ itemId: string; quantity: number }>; badge: string };
    isUnlocked: boolean;
    unlockedAt?: number;
    progress: number;
    hidden?: boolean;
  }>;
  currentTitle?: string; // Título ativo do jogador
  winStreak: number; // Sequência de vitórias
  loseStreak: number; // Sequência de derrotas
  totalTrains: number; // Total de treinos realizados
  totalCrafts: number; // Total de craft realizados
  totalSpent: number; // Total gasto
  
  // ===== SISTEMA DE DUNGEONS =====
  dungeonProgress: Record<string, {
    currentFloor: number; // Andar atual desbloqueado (1-5)
    completed: boolean; // Dungeon completada?
    clearedFloors: number[]; // Andares já limpos
    firstClearClaimed: boolean; // Bônus de primeira vez já coletado?
  }>;
  
  // Combate
  currentBattle?: BattleContext;
  
  // Desbloqueios
  unlockedLines: BeastLine[];
  unlockedFeatures: string[];
  discoveredRelics: Relic[];
  
  // Histórico
  deceasedBeasts: Beast[];
  victories: number;
  defeats: number;
  tournamentRank?: TournamentRank;
}


