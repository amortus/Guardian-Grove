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
 * Quests do Mestre da Floresta (Guardian Grove)
 */
export const RUVIAN_QUESTS: NPCQuest[] = [
  {
    id: 'ruvian_1',
    npcId: 'ruvian',
    name: 'Despertar do Guardião',
    description: 'O Mestre da Floresta deseja que você fortaleça seu vínculo com seu guardião através do treinamento.',
    requirements: { affinityLevel: 0 },
    objectives: [{ type: 'train', target: 5, current: 0 }],
    rewards: { coronas: 300, affinity: 5, items: [{ itemId: 'training_weights', quantity: 1 }] },
    isCompleted: false,
    isActive: true,
  },
  {
    id: 'ruvian_2',
    npcId: 'ruvian',
    name: 'Defensor do Grove',
    description: 'Proteja o santuário vencendo batalhas contra criaturas corrompidas.',
    requirements: { affinityLevel: 5, previousQuest: 'ruvian_1' },
    objectives: [{ type: 'win_battles', target: 3, current: 0 }],
    rewards: { coronas: 500, affinity: 10, items: [{ itemId: 'ancient_relic', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
  },
  {
    id: 'ruvian_3',
    npcId: 'ruvian',
    name: 'Explorador da Floresta',
    description: 'Complete 3 explorações na Trilha da Descoberta para conhecer os segredos do Grove.',
    requirements: { affinityLevel: 10, previousQuest: 'ruvian_2' },
    objectives: [{ type: 'special', target: 'complete_explorations_3', current: 0 }],
    rewards: { coronas: 700, affinity: 15, items: [{ itemId: 'forest_compass', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
  },
];

/**
 * Quests da Sábia do Grove (Liora)
 */
export const LIORA_QUESTS: NPCQuest[] = [
  {
    id: 'liora_1',
    npcId: 'liora',
    name: 'Sabedoria Ancestral',
    description: 'A Sábia precisa de cristais do eco da floresta para suas pesquisas sobre a harmonia do Grove.',
    requirements: { affinityLevel: 0 },
    objectives: [{ type: 'deliver_item', target: 'echo_crystal', current: 0 }],
    rewards: { coronas: 400, affinity: 8, items: [{ itemId: 'wisdom_tome', quantity: 1 }] },
    isCompleted: false,
    isActive: true,
  },
  {
    id: 'liora_2',
    npcId: 'liora',
    name: 'Educador do Futuro',
    description: 'Complete 5 missões educativas para espalhar conhecimento pelo santuário.',
    requirements: { affinityLevel: 8, previousQuest: 'liora_1' },
    objectives: [{ type: 'special', target: 'complete_educational_missions_5', current: 0 }],
    rewards: { coronas: 600, affinity: 12, items: [{ itemId: 'knowledge_scroll', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
  },
];

/**
 * Quests do Mercador do Grove (Dalan)
 */
export const DALAN_QUESTS: NPCQuest[] = [
  {
    id: 'dalan_1',
    npcId: 'dalan',
    name: 'Cliente Preferencial',
    description: 'O Mercador oferece um desconto especial se você investir 1000 Coronas no comércio do santuário.',
    requirements: { affinityLevel: 0 },
    objectives: [{ type: 'special', target: 'spend_1000', current: 0 }],
    rewards: { coronas: 200, affinity: 10, unlocks: 'discount_10' },
    isCompleted: false,
    isActive: true,
  },
  {
    id: 'dalan_2',
    npcId: 'dalan',
    name: 'Artesão do Santuário',
    description: 'Demonstre suas habilidades craftando 10 itens na oficina.',
    requirements: { affinityLevel: 10, previousQuest: 'dalan_1' },
    objectives: [{ type: 'craft', target: 10, current: 0 }],
    rewards: { coronas: 500, affinity: 15, items: [{ itemId: 'master_toolkit', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
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

