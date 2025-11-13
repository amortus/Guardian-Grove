/**
 * Sistema de Exploração - Guardian Grove
 * Gerencia exploração, encontros com monstros selvagens e coleta de materiais
 */

import type { Item } from '../types';
import { generateDrops } from '../data/exploration-materials';

// ===== TIPOS =====

export type ExplorationZone = 'forest' | 'mountains' | 'caves' | 'desert' | 'swamp' | 'ruins';

export type EncounterType = 'enemy' | 'treasure' | 'event' | 'nothing';

export interface WildEnemy {
  id: string;
  name: string;
  line: string;
  level: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  description: string;
  stats: {
    might: number;
    wit: number;
    focus: number;
    agility: number;
    ward: number;
    vitality: number;
  };
  aiPersonality?: string;
  drops: Array<{ itemId: string; chance: number; quantity: number }>;
}

export interface Encounter {
  type: EncounterType;
  enemy?: WildEnemy;
  treasure?: Item[];
  eventMessage?: string;
  distance: number; // Distância percorrida até este encounter
}

export interface ExplorationState {
  zone: ExplorationZone;
  distance: number; // Total percorrido
  encounters: Encounter[];
  currentEncounter: number;
  isActive: boolean;
  collectedMaterials: Item[];
  enemiesDefeated: number;
  treasuresFound: number;
}

// ===== ZONAS DE EXPLORAÇÃO =====

export const EXPLORATION_ZONES: Record<ExplorationZone, {
  name: string;
  description: string;
  difficulty: number; // 1-5
  commonBeasts: string[]; // Linhas das Bestas comuns
  rareBeasts: string[];   // Linhas das Bestas raras
}> = {
  forest: {
    name: 'Floresta Selvagem',
    description: 'Floresta densa com criaturas comuns. Bom para iniciantes.',
    difficulty: 1,
    commonBeasts: ['raukor', 'feralis', 'zephyra'],
    rareBeasts: ['terravox', 'sylphid'],
  },
  mountains: {
    name: 'Montanhas Geladas',
    description: 'Montanhas traiçoeiras com criaturas resistentes.',
    difficulty: 2,
    commonBeasts: ['terravox', 'brontis', 'raukor'],
    rareBeasts: ['ignar', 'umbrix'],
  },
  caves: {
    name: 'Cavernas Profundas',
    description: 'Cavernas escuras cheias de perigos. Recompensas valiosas.',
    difficulty: 3,
    commonBeasts: ['umbrix', 'olgrim', 'feralis'],
    rareBeasts: ['sylphid', 'mirella'],
  },
  desert: {
    name: 'Deserto Árido',
    description: 'Deserto escaldante com criaturas adaptadas ao calor.',
    difficulty: 3,
    commonBeasts: ['ignar', 'brontis', 'zephyra'],
    rareBeasts: ['raukor', 'terravox'],
  },
  swamp: {
    name: 'Pântano Venenoso',
    description: 'Pântano tóxico. Criaturas venenosas e drops raros.',
    difficulty: 4,
    commonBeasts: ['mirella', 'umbrix', 'feralis'],
    rareBeasts: ['olgrim', 'sylphid'],
  },
  ruins: {
    name: 'Ruínas Antigas',
    description: 'Ruínas de civilização perdida. Criaturas poderosas.',
    difficulty: 5,
    commonBeasts: ['olgrim', 'sylphid', 'umbrix'],
    rareBeasts: ['ignar', 'terravox'],
  },
};

// ===== GERAÇÃO DE ENCONTROS =====

/**
 * Gera um encontro aleatório baseado na zona
 */
export function generateEncounter(
  zone: ExplorationZone,
  distance: number
): Encounter {
  const _zoneData = EXPLORATION_ZONES[zone];
  void _zoneData; // Reservado para uso futuro
  const rand = Math.random();

  // Chances de cada tipo de encontro
  const encounterChances = {
    enemy: 0.60,    // 60% chance de inimigo
    treasure: 0.15, // 15% chance de tesouro
    event: 0.10,    // 10% chance de evento
    nothing: 0.15,  // 15% chance de nada
  };

  let type: EncounterType = 'nothing';
  
  if (rand < encounterChances.enemy) {
    type = 'enemy';
  } else if (rand < encounterChances.enemy + encounterChances.treasure) {
    type = 'treasure';
  } else if (rand < encounterChances.enemy + encounterChances.treasure + encounterChances.event) {
    type = 'event';
  }

  const encounter: Encounter = {
    type,
    distance,
  };

  // Gera conteúdo baseado no tipo
  if (type === 'enemy') {
    encounter.enemy = generateWildEnemy(zone, distance);
  } else if (type === 'treasure') {
    encounter.treasure = generateTreasure(zone);
  } else if (type === 'event') {
    encounter.eventMessage = generateRandomEvent();
  }

  return encounter;
}

/**
 * Gera inimigo selvagem usando as Bestas do jogo
 */
function generateWildEnemy(zone: ExplorationZone, distance: number): WildEnemy {
  const zoneData = EXPLORATION_ZONES[zone];
  
  // Chance de inimigo raro aumenta com distância
  const rareChance = Math.min(0.1 + (distance / 1000) * 0.05, 0.25); // Máx 25%
  const isRare = Math.random() < rareChance;
  
  const beastPool = isRare ? zoneData.rareBeasts : zoneData.commonBeasts;
  const beastLine = beastPool[Math.floor(Math.random() * beastPool.length)];
  
  return createWildBeastEnemy(beastLine, zone, distance, isRare);
}

/**
 * Cria inimigo selvagem baseado em uma Besta real do jogo
 */
function createWildBeastEnemy(
  beastLine: string, 
  zone: ExplorationZone, 
  distance: number,
  isRare: boolean
): WildEnemy {
  const difficulty = EXPLORATION_ZONES[zone].difficulty;
  
  // Progressão muito mais suave:
  // - Primeiros encontros (0-200m): level baseado apenas na dificuldade da zona
  // - A cada 300m: +1 level
  // - Dificuldade da zona: -1 para forest (começa em 1), 0 para outras zonas
  const distanceBonus = Math.floor(distance / 300);
  const difficultyOffset = difficulty === 1 ? 0 : (difficulty - 1);
  const level = 1 + difficultyOffset + distanceBonus;
  
  const rarity = isRare ? (Math.random() > 0.7 ? 'epic' : 'rare') : (Math.random() > 0.6 ? 'uncommon' : 'common');

  // Nomes baseados no GDD - SEMPRE mostra o nome da linha da Besta
  const beastLineNames: Record<string, string> = {
    olgrim: 'Olgrim',     // olho flutuante com tentáculos
    terravox: 'Terravox', // golem de pedra
    feralis: 'Feralis',   // felino ágil
    brontis: 'Brontis',   // réptil bípede robusto
    zephyra: 'Zephyra',   // ave veloz
    ignar: 'Ignar',       // fera elemental de fogo
    mirella: 'Mirella',   // criatura anfíbia
    umbrix: 'Umbrix',     // besta das sombras
    sylphid: 'Sylphid',   // espírito etéreo
    raukor: 'Raukor',     // fera lupina
  };

  // Títulos selvagens baseados na raridade
  const wildTitles = {
    common: 'Selvagem',
    uncommon: 'Feroz',
    rare: 'Ancestral',
    epic: 'Lendário',
  };

  const beastName = beastLineNames[beastLine] || 'Criatura';
  const title = wildTitles[rarity];
  const name = `${beastName} ${title}`;

  // Personalidades de IA baseadas na linha
  const aiPersonalities: Record<string, string> = {
    olgrim: 'tactical',
    terravox: 'tank',
    feralis: 'balanced',
    brontis: 'balanced',
    zephyra: 'aggressive',
    ignar: 'berserker',
    mirella: 'tactical',
    umbrix: 'trickster',
    sylphid: 'sniper',
    raukor: 'aggressive',
  };

  // Calcula stats baseados no level, dificuldade e raridade
  // Progressão balanceada: bestas level 1 começam com stats ~10-15
  // Level 1: stats base 10
  // Level 2: stats base 13
  // Level 3: stats base 16
  // Dificuldade adiciona apenas 1-2 por level de zona
  const statBase = 10 + (level - 1) * 3 + (difficulty - 1) * 1;
  const rarityMultiplier = rarity === 'epic' ? 1.4 : rarity === 'rare' ? 1.25 : rarity === 'uncommon' ? 1.1 : 1.0;
  
  // Variação aleatória reduzida (0-5 ao invés de 0-10)
  const randomVariation = () => Math.floor(Math.random() * 6);
  
  return {
    id: `wild_${beastLine}_${Date.now()}`,
    name,
    line: beastLine,
    level,
    rarity,
    description: `${name} habita ${EXPLORATION_ZONES[zone].name}`,
    stats: {
      might: Math.floor((statBase + randomVariation()) * rarityMultiplier),
      wit: Math.floor((statBase + randomVariation()) * rarityMultiplier),
      focus: Math.floor((statBase + randomVariation()) * rarityMultiplier),
      agility: Math.floor((statBase + randomVariation()) * rarityMultiplier),
      ward: Math.floor((statBase + randomVariation()) * rarityMultiplier),
      vitality: Math.floor((statBase + randomVariation()) * rarityMultiplier),
    },
    aiPersonality: aiPersonalities[beastLine],
    drops: generateEnemyDrops(rarity),
  };
}

/**
 * Gera lista de drops para o inimigo
 */
function generateEnemyDrops(rarity: 'common' | 'uncommon' | 'rare' | 'epic'): Array<{
  itemId: string;
  chance: number;
  quantity: number;
}> {
  // Retorna configuração de drops
  const drops = generateDrops(rarity);
  return drops.map(drop => ({
    itemId: drop.id,
    chance: 80, // 80% chance de dropar
    quantity: drop.quantity || 1,
  }));
}

/**
 * Gera tesouro aleatório
 */
function generateTreasure(_zone: ExplorationZone): Item[] {
  const difficulty = EXPLORATION_ZONES[_zone].difficulty;
  
  // Raridade do tesouro baseada em dificuldade
  let rarity: 'common' | 'uncommon' | 'rare' | 'epic' = 'common';
  
  if (difficulty >= 4) {
    rarity = Math.random() < 0.3 ? 'rare' : 'uncommon';
  } else if (difficulty >= 3) {
    rarity = Math.random() < 0.2 ? 'uncommon' : 'common';
  }
  
  return generateDrops(rarity);
}

/**
 * Gera evento aleatório
 */
function generateRandomEvent(): string {
  const events = [
    '🌟 Você encontrou uma fonte mágica! Recuperou 20% HP e Essência.',
    '⚠️ Uma tempestade súbita! Nenhum material encontrado aqui.',
    '🎁 Um viajante deixou um baú! Você ganhou materiais extras.',
    '🦅 Uma ave guia você! Avance mais rápido.',
    '💎 Você encontrou um depósito de cristais!',
    '🌿 Plantas medicinais crescem aqui. Ótimo para descanso.',
  ];
  
  return events[Math.floor(Math.random() * events.length)];
}

// ===== ESTADO DE EXPLORAÇÃO =====

/**
 * Inicia nova exploração
 */
export function startExploration(zone: ExplorationZone): ExplorationState {
  return {
    zone,
    distance: 0,
    encounters: [],
    currentEncounter: 0,
    isActive: true,
    collectedMaterials: [],
    enemiesDefeated: 0,
    treasuresFound: 0,
  };
}

/**
 * Avança na exploração
 */
export function advanceExploration(
  state: ExplorationState,
  steps: number = 100
): Encounter {
  state.distance += steps;
  
  const encounter = generateEncounter(state.zone, state.distance);
  state.encounters.push(encounter);
  state.currentEncounter = state.encounters.length - 1;
  
  return encounter;
}

/**
 * Coleta materiais de um encontro
 */
export function collectMaterials(
  state: ExplorationState,
  materials: Item[]
): void {
  // Consolida materiais
  for (const material of materials) {
    const existing = state.collectedMaterials.find(m => m.id === material.id);
    if (existing) {
      existing.quantity = (existing.quantity || 0) + (material.quantity || 0);
    } else {
      state.collectedMaterials.push({ ...material });
    }
  }
}

/**
 * Registra vitória contra inimigo
 */
export function defeatEnemy(
  state: ExplorationState,
  enemy: WildEnemy
): Item[] {
  state.enemiesDefeated++;
  
  // Gera drops baseado na configuração do inimigo
  const drops = generateDrops(enemy.rarity);
  collectMaterials(state, drops);
  
  return drops;
}

/**
 * Finaliza exploração
 */
export function endExploration(state: ExplorationState): {
  totalDistance: number;
  enemiesDefeated: number;
  treasuresFound: number;
  materials: Item[];
} {
  state.isActive = false;
  
  return {
    totalDistance: state.distance,
    enemiesDefeated: state.enemiesDefeated,
    treasuresFound: state.treasuresFound,
    materials: state.collectedMaterials,
  };
}

/**
 * Calcula recompensas de exploração
 */
export function calculateExplorationRewards(state: ExplorationState): {
  experience: number;
  coronas: number;
  materials: Item[];
} {
  const baseExp = state.distance / 10;
  const enemyBonus = state.enemiesDefeated * 50;
  const treasureBonus = state.treasuresFound * 25;
  
  return {
    experience: Math.floor(baseExp + enemyBonus + treasureBonus),
    coronas: Math.floor(state.enemiesDefeated * 20 + state.treasuresFound * 50),
    materials: state.collectedMaterials,
  };
}

