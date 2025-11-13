/**
 * Definição de Dungeons Temáticas
 * 5 Dungeons com 5 andares cada
 */

export interface Dungeon {
  id: string;
  name: string;
  description: string;
  icon: string;
  theme: 'forest' | 'cave' | 'ruins' | 'volcano' | 'abyss';
  minVictories: number; // NOVO: Desbloqueio baseado em vitórias ao invés de nível
  floors: DungeonFloor[];
  rewards: DungeonRewards;
}

export interface DungeonFloor {
  floor: number;
  name: string;
  description: string;
  enemies: DungeonEnemy[];
  boss?: DungeonBoss;
  treasures: TreasureChest[];
}

export interface DungeonEnemy {
  name: string;
  line: string;
  level: number;
  stats: {
    might: number;
    focus: number;
    ward: number;
    vitality: number;
    agility: number;
    wit: number;
  };
}

export interface DungeonBoss extends DungeonEnemy {
  isBoss: true;
  specialAbilities: string[];
  dropRate: number;
  uniqueLoot: string[];
}

export interface TreasureChest {
  type: 'common' | 'rare' | 'epic' | 'legendary';
  contents: Array<{ itemId: string; quantity: number; chance: number }>;
}

export interface DungeonRewards {
  firstClearBonus: {
    coronas: number;
    items: Array<{ itemId: string; quantity: number }>;
  };
  completionRewards: {
    coronas: number;
    experience: number;
  };
}

/**
 * 5 Dungeons Temáticas
 */
export const DUNGEONS: Dungeon[] = [
  // 1. FLORESTA ETERNA
  {
    id: 'eternal_forest',
    name: 'Floresta Eterna',
    description: 'Uma floresta antiga habitada por criaturas místicas',
    icon: '🌲',
    theme: 'forest',
    minVictories: 0, // Sempre disponível
    floors: [
      {
        floor: 1,
        name: 'Clareira Inicial',
        description: 'Entrada da floresta',
        enemies: [
          {
            name: 'Sylphid Selvagem',
            line: 'sylphid',
            level: 12,
            stats: { might: 15, focus: 20, ward: 12, vitality: 100, agility: 18, wit: 16 },
          },
        ],
        treasures: [
          {
            type: 'common',
            contents: [{ itemId: 'healing_herb', quantity: 3, chance: 0.8 }],
          },
        ],
      },
      {
        floor: 2,
        name: 'Bosque das Sombras',
        description: 'A luz mal penetra aqui',
        enemies: [
          {
            name: 'Umbrix Sombrio',
            line: 'umbrix',
            level: 15,
            stats: { might: 18, focus: 22, ward: 14, vitality: 120, agility: 20, wit: 18 },
          },
        ],
        treasures: [
          {
            type: 'rare',
            contents: [{ itemId: 'shadow_essence', quantity: 1, chance: 0.6 }],
          },
        ],
      },
      {
        floor: 3,
        name: 'Rio Cristalino',
        description: 'Água pura e cristalina',
        enemies: [
          {
            name: 'Mirella Aquática',
            line: 'mirella',
            level: 18,
            stats: { might: 16, focus: 25, ward: 16, vitality: 140, agility: 22, wit: 20 },
          },
        ],
        treasures: [
          {
            type: 'rare',
            contents: [{ itemId: 'crystal_water', quantity: 2, chance: 0.7 }],
          },
        ],
      },
      {
        floor: 4,
        name: 'Árvore Anciã',
        description: 'Uma árvore gigante e ancestral',
        enemies: [
          {
            name: 'Terravox Guardião',
            line: 'terravox',
            level: 20,
            stats: { might: 22, focus: 20, ward: 25, vitality: 160, agility: 15, wit: 18 },
          },
        ],
        treasures: [
          {
            type: 'epic',
            contents: [{ itemId: 'ancient_seed', quantity: 1, chance: 0.5 }],
          },
        ],
      },
      {
        floor: 5,
        name: 'Santuário do Guardião',
        description: 'Lar do guardião da floresta',
        enemies: [],
        boss: {
          name: '👑 Sylphid Ancestral',
          line: 'sylphid',
          level: 25,
          stats: { might: 30, focus: 35, ward: 28, vitality: 250, agility: 32, wit: 30 },
          isBoss: true,
          specialAbilities: ['Tempestade de Ventos', 'Cura Natural'],
          dropRate: 1.0,
          uniqueLoot: ['forest_crown', 'sylphid_feather'],
        },
        treasures: [
          {
            type: 'legendary',
            contents: [{ itemId: 'forest_relic', quantity: 1, chance: 1.0 }],
          },
        ],
      },
    ],
    rewards: {
      firstClearBonus: {
        coronas: 5000,
        items: [{ itemId: 'forest_trophy', quantity: 1 }],
      },
      completionRewards: {
        coronas: 1000,
        experience: 500,
      },
    },
  },

  // 2. CAVERNA DAS PROFUNDEZAS
  {
    id: 'deep_cavern',
    name: 'Caverna das Profundezas',
    description: 'Cavernas escuras cheias de perigos',
    icon: '🗻',
    theme: 'cave',
    minVictories: 5, // Desbloqueia após 5 vitórias
    floors: [
      {
        floor: 1,
        name: 'Entrada Rochosa',
        description: 'Rochas e escuridão',
        enemies: [
          {
            name: 'Olgrim de Pedra',
            line: 'olgrim',
            level: 22,
            stats: { might: 25, focus: 18, ward: 30, vitality: 180, agility: 12, wit: 15 },
          },
        ],
        treasures: [
          {
            type: 'common',
            contents: [{ itemId: 'stone_fragment', quantity: 5, chance: 0.9 }],
          },
        ],
      },
      {
        floor: 2,
        name: 'Túnel Estreito',
        description: 'Passagem apertada',
        enemies: [
          {
            name: 'Feralis Caçador',
            line: 'feralis',
            level: 25,
            stats: { might: 28, focus: 20, ward: 22, vitality: 190, agility: 26, wit: 18 },
          },
        ],
        treasures: [
          {
            type: 'rare',
            contents: [{ itemId: 'cave_crystal', quantity: 2, chance: 0.6 }],
          },
        ],
      },
      {
        floor: 3,
        name: 'Lago Subterrâneo',
        description: 'Água escura e fria',
        enemies: [
          {
            name: 'Mirella das Profundezas',
            line: 'mirella',
            level: 28,
            stats: { might: 24, focus: 30, ward: 24, vitality: 200, agility: 25, wit: 28 },
          },
        ],
        treasures: [
          {
            type: 'rare',
            contents: [{ itemId: 'deep_water', quantity: 3, chance: 0.7 }],
          },
        ],
      },
      {
        floor: 4,
        name: 'Câmara de Cristais',
        description: 'Cristais brilhantes por toda parte',
        enemies: [
          {
            name: 'Zephyra Cristalina',
            line: 'zephyra',
            level: 30,
            stats: { might: 26, focus: 32, ward: 26, vitality: 210, agility: 28, wit: 30 },
          },
        ],
        treasures: [
          {
            type: 'epic',
            contents: [{ itemId: 'large_crystal', quantity: 1, chance: 0.5 }],
          },
        ],
      },
      {
        floor: 5,
        name: 'Trono de Pedra',
        description: 'Lar do rei das cavernas',
        enemies: [],
        boss: {
          name: '👑 Olgrim Rei das Profundezas',
          line: 'olgrim',
          level: 35,
          stats: { might: 40, focus: 28, ward: 45, vitality: 350, agility: 18, wit: 25 },
          isBoss: true,
          specialAbilities: ['Terremoto', 'Armadura de Pedra'],
          dropRate: 1.0,
          uniqueLoot: ['stone_crown', 'olgrim_hammer'],
        },
        treasures: [
          {
            type: 'legendary',
            contents: [{ itemId: 'cavern_relic', quantity: 1, chance: 1.0 }],
          },
        ],
      },
    ],
    rewards: {
      firstClearBonus: {
        coronas: 8000,
        items: [{ itemId: 'cavern_trophy', quantity: 1 }],
      },
      completionRewards: {
        coronas: 1500,
        experience: 800,
      },
    },
  },

  // 3. RUÍNAS ANTIGAS
  {
    id: 'ancient_ruins',
    name: 'Ruínas Antigas',
    description: 'Restos de uma civilização perdida',
    icon: '🏛️',
    theme: 'ruins',
    minVictories: 15, // Desbloqueia após 15 vitórias
    floors: [
      {
        floor: 1,
        name: 'Portão Quebrado',
        description: 'Entrada em ruínas',
        enemies: [
          {
            name: 'Terravox Guardião',
            line: 'terravox',
            level: 32,
            stats: { might: 30, focus: 28, ward: 35, vitality: 250, agility: 20, wit: 26 },
          },
        ],
        treasures: [
          {
            type: 'rare',
            contents: [{ itemId: 'ancient_coin', quantity: 10, chance: 0.8 }],
          },
        ],
      },
      {
        floor: 2,
        name: 'Salão dos Pilares',
        description: 'Pilares antigos ainda de pé',
        enemies: [
          {
            name: 'Raukor Espectral',
            line: 'raukor',
            level: 35,
            stats: { might: 32, focus: 35, ward: 30, vitality: 260, agility: 30, wit: 32 },
          },
        ],
        treasures: [
          {
            type: 'epic',
            contents: [{ itemId: 'spectral_essence', quantity: 2, chance: 0.6 }],
          },
        ],
      },
      {
        floor: 3,
        name: 'Biblioteca Perdida',
        description: 'Conhecimento ancestral',
        enemies: [
          {
            name: 'Umbrix Sábio',
            line: 'umbrix',
            level: 38,
            stats: { might: 28, focus: 40, ward: 32, vitality: 270, agility: 32, wit: 40 },
          },
        ],
        treasures: [
          {
            type: 'epic',
            contents: [{ itemId: 'ancient_tome', quantity: 1, chance: 0.7 }],
          },
        ],
      },
      {
        floor: 4,
        name: 'Câmara do Tesouro',
        description: 'Riquezas antigas',
        enemies: [
          {
            name: 'Brontis Protetor',
            line: 'brontis',
            level: 40,
            stats: { might: 38, focus: 32, ward: 38, vitality: 300, agility: 25, wit: 30 },
          },
        ],
        treasures: [
          {
            type: 'legendary',
            contents: [{ itemId: 'gold_ingot', quantity: 5, chance: 0.8 }],
          },
        ],
      },
      {
        floor: 5,
        name: 'Trono Imperial',
        description: 'Onde o imperador governava',
        enemies: [],
        boss: {
          name: '👑 Imperador Terravox',
          line: 'terravox',
          level: 45,
          stats: { might: 45, focus: 40, ward: 50, vitality: 450, agility: 28, wit: 42 },
          isBoss: true,
          specialAbilities: ['Decreto Imperial', 'Muralha Inabalável'],
          dropRate: 1.0,
          uniqueLoot: ['imperial_crown', 'terravox_scepter'],
        },
        treasures: [
          {
            type: 'legendary',
            contents: [{ itemId: 'ruins_relic', quantity: 1, chance: 1.0 }],
          },
        ],
      },
    ],
    rewards: {
      firstClearBonus: {
        coronas: 12000,
        items: [{ itemId: 'ruins_trophy', quantity: 1 }],
      },
      completionRewards: {
        coronas: 2000,
        experience: 1200,
      },
    },
  },

  // 4. VULCÃO FURIOSO
  {
    id: 'raging_volcano',
    name: 'Vulcão Furioso',
    description: 'Montanha de fogo e lava',
    icon: '🌋',
    theme: 'volcano',
    minVictories: 30, // Desbloqueia após 30 vitórias
    floors: [
      {
        floor: 1,
        name: 'Encosta Fumegante',
        description: 'Calor intenso',
        enemies: [
          {
            name: 'Ignar Flamejante',
            line: 'ignar',
            level: 42,
            stats: { might: 40, focus: 38, ward: 32, vitality: 300, agility: 35, wit: 32 },
          },
        ],
        treasures: [
          {
            type: 'rare',
            contents: [{ itemId: 'fire_crystal', quantity: 3, chance: 0.8 }],
          },
        ],
      },
      {
        floor: 2,
        name: 'Rio de Lava',
        description: 'Lava fluindo',
        enemies: [
          {
            name: 'Raukor Vulcânico',
            line: 'raukor',
            level: 45,
            stats: { might: 42, focus: 40, ward: 35, vitality: 320, agility: 38, wit: 36 },
          },
        ],
        treasures: [
          {
            type: 'epic',
            contents: [{ itemId: 'lava_stone', quantity: 2, chance: 0.6 }],
          },
        ],
      },
      {
        floor: 3,
        name: 'Câmara de Magma',
        description: 'Magma por toda parte',
        enemies: [
          {
            name: 'Brontis Íg neo',
            line: 'brontis',
            level: 48,
            stats: { might: 45, focus: 38, ward: 40, vitality: 350, agility: 30, wit: 35 },
          },
        ],
        treasures: [
          {
            type: 'epic',
            contents: [{ itemId: 'magma_core', quantity: 1, chance: 0.7 }],
          },
        ],
      },
      {
        floor: 4,
        name: 'Forja Ancestral',
        description: 'Antiga forja dos deuses',
        enemies: [
          {
            name: 'Feralis Infernal',
            line: 'feralis',
            level: 50,
            stats: { might: 48, focus: 40, ward: 38, vitality: 370, agility: 42, wit: 38 },
          },
        ],
        treasures: [
          {
            type: 'legendary',
            contents: [{ itemId: 'divine_metal', quantity: 3, chance: 0.5 }],
          },
        ],
      },
      {
        floor: 5,
        name: 'Coração do Vulcão',
        description: 'O núcleo ardente',
        enemies: [],
        boss: {
          name: '👑 Ignar Senhor das Chamas',
          line: 'ignar',
          level: 55,
          stats: { might: 55, focus: 50, ward: 45, vitality: 550, agility: 48, wit: 45 },
          isBoss: true,
          specialAbilities: ['Erupção Vulcânica', 'Fúria Flamejante'],
          dropRate: 1.0,
          uniqueLoot: ['flame_crown', 'ignar_blade'],
        },
        treasures: [
          {
            type: 'legendary',
            contents: [{ itemId: 'volcano_relic', quantity: 1, chance: 1.0 }],
          },
        ],
      },
    ],
    rewards: {
      firstClearBonus: {
        coronas: 18000,
        items: [{ itemId: 'volcano_trophy', quantity: 1 }],
      },
      completionRewards: {
        coronas: 3000,
        experience: 2000,
      },
    },
  },

  // 5. ABISMO ETERNO
  {
    id: 'eternal_abyss',
    name: 'Abismo Eterno',
    description: 'Um vazio sem fim',
    icon: '🕳️',
    theme: 'abyss',
    minVictories: 50, // Desbloqueia após 50 vitórias
    floors: [
      {
        floor: 1,
        name: 'Borda do Abismo',
        description: 'Onde a luz desaparece',
        enemies: [
          {
            name: 'Umbrix Abissal',
            line: 'umbrix',
            level: 52,
            stats: { might: 45, focus: 55, ward: 42, vitality: 400, agility: 50, wit: 52 },
          },
        ],
        treasures: [
          {
            type: 'epic',
            contents: [{ itemId: 'void_essence', quantity: 3, chance: 0.7 }],
          },
        ],
      },
      {
        floor: 2,
        name: 'Descida Infinita',
        description: 'Caindo eternamente',
        enemies: [
          {
            name: 'Zephyra do Vazio',
            line: 'zephyra',
            level: 55,
            stats: { might: 48, focus: 58, ward: 45, vitality: 420, agility: 55, wit: 55 },
          },
        ],
        treasures: [
          {
            type: 'legendary',
            contents: [{ itemId: 'abyss_crystal', quantity: 2, chance: 0.6 }],
          },
        ],
      },
      {
        floor: 3,
        name: 'Plano Espectral',
        description: 'Entre mundos',
        enemies: [
          {
            name: 'Raukor Fantasmagórico',
            line: 'raukor',
            level: 58,
            stats: { might: 50, focus: 60, ward: 48, vitality: 450, agility: 58, wit: 58 },
          },
        ],
        treasures: [
          {
            type: 'legendary',
            contents: [{ itemId: 'spectral_orb', quantity: 1, chance: 0.8 }],
          },
        ],
      },
      {
        floor: 4,
        name: 'Câmara do Esquecimento',
        description: 'Onde memórias morrem',
        enemies: [
          {
            name: 'Sylphid Sombrio',
            line: 'sylphid',
            level: 60,
            stats: { might: 52, focus: 62, ward: 50, vitality: 480, agility: 60, wit: 60 },
          },
        ],
        treasures: [
          {
            type: 'legendary',
            contents: [{ itemId: 'forgotten_memory', quantity: 1, chance: 0.7 }],
          },
        ],
      },
      {
        floor: 5,
        name: 'Núcleo do Abismo',
        description: 'O coração do vazio',
        enemies: [],
        boss: {
          name: '👑 Umbrix Devorador de Mundos',
          line: 'umbrix',
          level: 65,
          stats: { might: 60, focus: 70, ward: 60, vitality: 666, agility: 65, wit: 70 },
          isBoss: true,
          specialAbilities: ['Vazio Consumidor', 'Escuridão Eterna', 'Apocalipse Sombrio'],
          dropRate: 1.0,
          uniqueLoot: ['abyss_crown', 'umbrix_scythe', 'void_heart'],
        },
        treasures: [
          {
            type: 'legendary',
            contents: [
              { itemId: 'abyss_relic', quantity: 1, chance: 1.0 },
              { itemId: 'ultimate_treasure', quantity: 1, chance: 0.5 },
            ],
          },
        ],
      },
    ],
    rewards: {
      firstClearBonus: {
        coronas: 50000,
        items: [
          { itemId: 'abyss_trophy', quantity: 1 },
          { itemId: 'master_explorer_title', quantity: 1 },
        ],
      },
      completionRewards: {
        coronas: 5000,
        experience: 5000,
      },
    },
  },
];

/**
 * Obtém dungeon por ID
 */
export function getDungeonById(id: string): Dungeon | undefined {
  return DUNGEONS.find(d => d.id === id);
}

/**
 * Obtém dungeons disponíveis baseado em vitórias do jogador
 */
export function getAvailableDungeons(playerVictories: number): Dungeon[] {
  return DUNGEONS.filter(d => playerVictories >= d.minVictories);
}

/**
 * Calcula fadiga necessária para explorar dungeon
 * Dungeons são mais cansativas que explorações normais
 */
export function calculateFatigueCost(floor: number): number {
  return 10 + (floor * 5); // Floor 1 = 15, Floor 2 = 20, ..., Floor 5 = 35
}

