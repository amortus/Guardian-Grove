/**
 * Sistema de Desafios Diários e Semanais
 * Renova automaticamente e oferece recompensas ao completar
 */

export interface DailyChallenge {
  id: string;
  type: 'daily' | 'weekly';
  name: string;
  description: string;
  icon: string;
  requirement: ChallengeRequirement;
  reward: ChallengeReward;
  isCompleted: boolean;
  progress: number;
  expiresAt: number; // timestamp
  createdAt: number; // timestamp
}

export interface ChallengeRequirement {
  type: 
    | 'win_battles'
    | 'train_beast'
    | 'craft_items'
    | 'explore_zones'
    | 'collect_materials'
    | 'spend_coronas'
    | 'talk_npcs'
    | 'use_techniques'
    | 'deal_damage'
    | 'heal_amount';
  target: number;
  current: number;
}

export interface ChallengeReward {
  coronas: number;
  items?: Array<{ itemId: string; quantity: number }>;
  experience?: number;
}

export interface ChallengeStreak {
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string; // YYYY-MM-DD
  totalDaysCompleted: number;
}

/**
 * Pool de desafios diários possíveis
 */
const DAILY_CHALLENGE_POOL = [
  // Batalhas
  {
    type: 'win_battles',
    name: 'Vencedor do Dia',
    description: 'Vença {target} batalhas',
    icon: '⚔️',
    targets: [1, 2, 3],
    baseReward: 100,
  },
  {
    type: 'deal_damage',
    name: 'Destruidor',
    description: 'Cause {target} de dano total',
    icon: '💥',
    targets: [500, 1000, 2000],
    baseReward: 150,
  },
  
  // Treino
  {
    type: 'train_beast',
    name: 'Sessão de Treino',
    description: 'Treine sua besta {target} vezes',
    icon: '💪',
    targets: [3, 5, 10],
    baseReward: 80,
  },
  
  // Craft
  {
    type: 'craft_items',
    name: 'Artesão do Dia',
    description: 'Crafte {target} itens',
    icon: '🔨',
    targets: [2, 4, 6],
    baseReward: 120,
  },
  
  // Exploração
  {
    type: 'explore_zones',
    name: 'Explorador',
    description: 'Complete {target} explorações',
    icon: '🗺️',
    targets: [1, 2, 3],
    baseReward: 150,
  },
  {
    type: 'collect_materials',
    name: 'Coletor',
    description: 'Colete {target} materiais',
    icon: '💎',
    targets: [5, 10, 20],
    baseReward: 100,
  },
  
  // Economia
  {
    type: 'spend_coronas',
    name: 'Grande Gastador',
    description: 'Gaste {target} Coronas',
    icon: '💰',
    targets: [500, 1000, 2000],
    baseReward: 80,
  },
  
  // Social
  {
    type: 'talk_npcs',
    name: 'Social',
    description: 'Converse com NPCs {target} vezes',
    icon: '💬',
    targets: [3, 5, 8],
    baseReward: 90,
  },
  
  // Combate Avançado
  {
    type: 'use_techniques',
    name: 'Mestre Técnico',
    description: 'Use {target} técnicas diferentes',
    icon: '✨',
    targets: [5, 8, 12],
    baseReward: 130,
  },
  {
    type: 'heal_amount',
    name: 'Curandeiro',
    description: 'Cure {target} pontos de HP',
    icon: '❤️',
    targets: [200, 500, 1000],
    baseReward: 110,
  },
];

/**
 * Pool de desafios semanais possíveis
 */
const WEEKLY_CHALLENGE_POOL = [
  {
    type: 'win_battles',
    name: 'Campeão Semanal',
    description: 'Vença {target} batalhas esta semana',
    icon: '👑',
    targets: [10, 20, 30],
    baseReward: 500,
  },
  {
    type: 'train_beast',
    name: 'Treinamento Intensivo',
    description: 'Treine {target} vezes esta semana',
    icon: '🎯',
    targets: [20, 35, 50],
    baseReward: 400,
  },
  {
    type: 'craft_items',
    name: 'Mestre Artesão',
    description: 'Crafte {target} itens esta semana',
    icon: '⚒️',
    targets: [15, 25, 40],
    baseReward: 600,
  },
  {
    type: 'explore_zones',
    name: 'Grande Explorador',
    description: 'Complete {target} explorações',
    icon: '🧭',
    targets: [10, 15, 25],
    baseReward: 700,
  },
  {
    type: 'collect_materials',
    name: 'Coletor Mestre',
    description: 'Colete {target} materiais',
    icon: '💎',
    targets: [50, 100, 200],
    baseReward: 500,
  },
  {
    type: 'spend_coronas',
    name: 'Magnata',
    description: 'Gaste {target} Coronas',
    icon: '💵',
    targets: [5000, 10000, 20000],
    baseReward: 600,
  },
  {
    type: 'deal_damage',
    name: 'Devastador',
    description: 'Cause {target} de dano total',
    icon: '💥',
    targets: [10000, 20000, 40000],
    baseReward: 800,
  },
];

/**
 * Gera 3 desafios diários aleatórios
 */
export function generateDailyChallenges(): DailyChallenge[] {
  const challenges: DailyChallenge[] = [];
  const usedTypes = new Set<string>();
  
  // Garantir variedade pegando tipos diferentes
  const shuffled = [...DAILY_CHALLENGE_POOL].sort(() => Math.random() - 0.5);
  
  for (const template of shuffled) {
    if (challenges.length >= 3) break;
    if (usedTypes.has(template.type)) continue;
    
    usedTypes.add(template.type);
    
    // Escolher target aleatório
    const target = template.targets[Math.floor(Math.random() * template.targets.length)];
    
    // Calcular recompensa baseada no target
    const rewardMultiplier = (template.targets.indexOf(target) + 1) / template.targets.length;
    const coronas = Math.round(template.baseReward * (1 + rewardMultiplier));
    
    const now = Date.now();
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    
    challenges.push({
      id: `daily_${template.type}_${Date.now()}_${Math.random()}`,
      type: 'daily',
      name: template.name,
      description: template.description.replace('{target}', target.toString()),
      icon: template.icon,
      requirement: {
        type: template.type as any,
        target,
        current: 0,
      },
      reward: {
        coronas,
      },
      isCompleted: false,
      progress: 0,
      expiresAt: tomorrow.getTime(),
      createdAt: now,
    });
  }
  
  return challenges;
}

/**
 * Gera 1 desafio semanal aleatório
 */
export function generateWeeklyChallenge(): DailyChallenge {
  const template = WEEKLY_CHALLENGE_POOL[Math.floor(Math.random() * WEEKLY_CHALLENGE_POOL.length)];
  
  // Escolher target mais difícil para semanal
  const targetIndex = Math.floor(Math.random() * template.targets.length);
  const target = template.targets[targetIndex];
  
  // Recompensa maior para semanal
  const rewardMultiplier = (targetIndex + 1) / template.targets.length;
  const coronas = Math.round(template.baseReward * (1 + rewardMultiplier * 0.5));
  
  const now = Date.now();
  const nextMonday = new Date();
  nextMonday.setDate(nextMonday.getDate() + ((7 - nextMonday.getDay() + 1) % 7 || 7));
  nextMonday.setHours(0, 0, 0, 0);
  
  return {
    id: `weekly_${template.type}_${Date.now()}_${Math.random()}`,
    type: 'weekly',
    name: template.name,
    description: template.description.replace('{target}', target.toString()),
    icon: template.icon,
    requirement: {
      type: template.type as any,
      target,
      current: 0,
    },
    reward: {
      coronas,
      experience: Math.round(coronas * 0.5), // Bônus de XP
    },
    isCompleted: false,
    progress: 0,
    expiresAt: nextMonday.getTime(),
    createdAt: now,
  };
}

/**
 * Verifica se desafios devem ser renovados
 */
export function shouldRenewChallenges(challenges: DailyChallenge[], type: 'daily' | 'weekly'): boolean {
  const typeChallenges = challenges.filter(c => c.type === type);
  
  if (typeChallenges.length === 0) return true;
  
  const now = Date.now();
  return typeChallenges.some(c => c.expiresAt <= now);
}

/**
 * Atualiza progresso de um desafio
 */
export function updateChallengeProgress(
  challenges: DailyChallenge[],
  actionType: ChallengeRequirement['type'],
  amount: number = 1
): DailyChallenge[] {
  const completed: DailyChallenge[] = [];
  
  for (const challenge of challenges) {
    if (challenge.isCompleted) continue;
    if (challenge.requirement.type !== actionType) continue;
    
    challenge.requirement.current = Math.min(
      challenge.requirement.current + amount,
      challenge.requirement.target
    );
    
    challenge.progress = challenge.requirement.current / challenge.requirement.target;
    
    if (challenge.requirement.current >= challenge.requirement.target) {
      challenge.isCompleted = true;
      challenge.progress = 1;
      completed.push(challenge);
    }
  }
  
  return completed;
}

/**
 * Remove desafios expirados
 */
export function removeExpiredChallenges(challenges: DailyChallenge[]): DailyChallenge[] {
  const now = Date.now();
  return challenges.filter(c => c.expiresAt > now);
}

/**
 * Calcula bônus de streak
 */
export function calculateStreakBonus(streak: number): number {
  if (streak >= 30) return 2.0; // 100% bônus
  if (streak >= 14) return 1.5; // 50% bônus
  if (streak >= 7) return 1.25; // 25% bônus
  if (streak >= 3) return 1.1; // 10% bônus
  return 1.0; // Sem bônus
}

/**
 * Atualiza streak de desafios
 */
export function updateChallengeStreak(
  streak: ChallengeStreak,
  completedToday: boolean
): ChallengeStreak {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  if (completedToday) {
    // Se completou hoje
    if (streak.lastCompletionDate === yesterday) {
      // Streak contínua
      streak.currentStreak += 1;
    } else if (streak.lastCompletionDate !== today) {
      // Nova streak ou quebrou
      streak.currentStreak = 1;
    }
    // Se já completou hoje, não atualizar
    
    streak.lastCompletionDate = today;
    streak.totalDaysCompleted += 1;
    
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }
  } else {
    // Verifica se quebrou streak
    if (streak.lastCompletionDate !== today && streak.lastCompletionDate !== yesterday) {
      streak.currentStreak = 0;
    }
  }
  
  return streak;
}

/**
 * Obtém desafios ativos (não expirados e não completos)
 */
export function getActiveChallenges(challenges: DailyChallenge[]): DailyChallenge[] {
  const now = Date.now();
  return challenges.filter(c => !c.isCompleted && c.expiresAt > now);
}

/**
 * Obtém desafios completos de hoje
 */
export function getTodayCompletedChallenges(challenges: DailyChallenge[]): DailyChallenge[] {
  const today = new Date().toISOString().split('T')[0];
  return challenges.filter(c => {
    if (!c.isCompleted) return false;
    const completedDate = new Date(c.expiresAt).toISOString().split('T')[0];
    return completedDate === today;
  });
}

/**
 * Calcula total de recompensas de desafios completos
 */
export function calculateTotalRewards(challenges: DailyChallenge[]): ChallengeReward {
  return challenges.reduce(
    (total, challenge) => {
      if (challenge.isCompleted) {
        total.coronas += challenge.reward.coronas || 0;
        total.experience = (total.experience || 0) + (challenge.reward.experience || 0);
      }
      return total;
    },
    { coronas: 0, experience: 0 } as ChallengeReward
  );
}

/**
 * Inicializa sistema de streak
 */
export function initializeChallengeStreak(): ChallengeStreak {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastCompletionDate: '',
    totalDaysCompleted: 0,
  };
}

