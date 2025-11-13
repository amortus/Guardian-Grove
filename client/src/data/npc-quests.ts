/**
 * NPC Quests - Missões exclusivas de cada personagem
 */

export interface NPCQuest {
  id: string;
  npcId: string;
  name: string;
  description: string;
  requirements: {
    affinityLevel: number; // Nível de afinidade necessário
    previousQuest?: string; // Quest anterior necessária
  };
  objectives: {
    type: 'deliver_item' | 'win_battles' | 'train' | 'craft' | 'special';
    target: string | number;
    current: number;
  }[];
  rewards: {
    coronas?: number;
    items?: Array<{ itemId: string; quantity: number }>;
    affinity: number; // Afinidade ganha
    unlocks?: string; // Desbloqueia algo especial
  };
  isCompleted: boolean;
  isActive: boolean;
}

/**
 * Quests do Mestre Ruvian
 */
export const RUVIAN_QUESTS: NPCQuest[] = [
  {
    id: 'ruvian_1',
    npcId: 'ruvian',
    name: 'O Caminho do Guardião',
    description: 'Mestre Ruvian quer que você prove sua dedicação treinando sua besta.',
    requirements: { affinityLevel: 0 },
    objectives: [{ type: 'train', target: 5, current: 0 }],
    rewards: { coronas: 300, affinity: 5, items: [{ itemId: 'training_weights', quantity: 1 }] },
    isCompleted: false,
    isActive: true,
  },
  {
    id: 'ruvian_2',
    npcId: 'ruvian',
    name: 'Teste de Força',
    description: 'Prove seu valor vencendo 3 batalhas.',
    requirements: { affinityLevel: 5, previousQuest: 'ruvian_1' },
    objectives: [{ type: 'win_battles', target: 3, current: 0 }],
    rewards: { coronas: 500, affinity: 10, items: [{ itemId: 'ancient_relic', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
  },
];

/**
 * Quests da Liora
 */
export const LIORA_QUESTS: NPCQuest[] = [
  {
    id: 'liora_1',
    npcId: 'liora',
    name: 'Conhecimento Arcano',
    description: 'Liora precisa de cristais para suas pesquisas.',
    requirements: { affinityLevel: 0 },
    objectives: [{ type: 'deliver_item', target: 'echo_crystal', current: 0 }],
    rewards: { coronas: 400, affinity: 8, items: [{ itemId: 'wisdom_tome', quantity: 1 }] },
    isCompleted: false,
    isActive: true,
  },
];

/**
 * Quests do Dalan
 */
export const DALAN_QUESTS: NPCQuest[] = [
  {
    id: 'dalan_1',
    npcId: 'dalan',
    name: 'Cliente Valioso',
    description: 'Dalan oferece um desconto se você gastar 1000 Coronas em sua loja.',
    requirements: { affinityLevel: 0 },
    objectives: [{ type: 'special', target: 'spend_1000', current: 0 }],
    rewards: { coronas: 200, affinity: 10, unlocks: 'discount_10' },
    isCompleted: false,
    isActive: true,
  },
];

/**
 * Todas as quests de NPC
 */
export const ALL_NPC_QUESTS = [
  ...RUVIAN_QUESTS,
  ...LIORA_QUESTS,
  ...DALAN_QUESTS,
];

/**
 * Retorna quests disponíveis para um NPC
 */
export function getAvailableNPCQuests(npcId: string, affinityLevel: number, completedQuests: string[]): NPCQuest[] {
  const npcQuests = ALL_NPC_QUESTS.filter(q => q.npcId === npcId);
  
  return npcQuests.filter(quest => {
    // Já completada
    if (quest.isCompleted || completedQuests.includes(quest.id)) return false;
    
    // Nível de afinidade insuficiente
    if (affinityLevel < quest.requirements.affinityLevel) return false;
    
    // Quest anterior não completada
    if (quest.requirements.previousQuest && !completedQuests.includes(quest.requirements.previousQuest)) {
      return false;
    }
    
    return true;
  });
}

