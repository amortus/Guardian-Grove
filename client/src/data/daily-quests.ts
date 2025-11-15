/**
 * Missões Diárias e Semanais - Guardian Grove
 * Sistema de missões recorrentes para manter engajamento
 */

export interface DailyQuest {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly';
  category: 'exploration' | 'social' | 'progress' | 'collection' | 'virtue';
  objectives: {
    type: 'login' | 'explore' | 'interact' | 'collect' | 'complete_mission' | 'visit' | 'train' | 'craft' | 'spend' | 'play_minigame' | 'memory_game';
    target: number;
    current: number;
  }[];
  rewards: {
    coronas: number;
    xp: number;
    items?: Array<{ itemId: string; quantity: number }>;
  };
  resetTime: Date; // Quando a missão reseta
  isCompleted: boolean;
  icon: string;
}

/**
 * Missões Diárias (resetam todo dia)
 */
export const DAILY_QUESTS: Omit<DailyQuest, 'resetTime' | 'isCompleted'>[] = [
  {
    id: 'daily_login',
    name: 'Guardião Presente',
    description: 'Faça login no Guardian Grove Sanctuary',
    type: 'daily',
    category: 'progress',
    objectives: [{ type: 'login', target: 1, current: 0 }],
    rewards: { coronas: 50, xp: 20 },
    icon: '🌅',
  },
  {
    id: 'daily_explore_3',
    name: 'Explorador Ativo',
    description: 'Complete 3 explorações na Trilha da Descoberta',
    type: 'daily',
    category: 'exploration',
    objectives: [{ type: 'explore', target: 3, current: 0 }],
    rewards: { coronas: 150, xp: 50 },
    icon: '🗺️',
  },
  {
    id: 'daily_interact_5',
    name: 'Guardião Social',
    description: 'Interaja com 5 jogadores diferentes no hub (chat ou emote)',
    type: 'daily',
    category: 'social',
    objectives: [{ type: 'interact', target: 5, current: 0 }],
    rewards: { coronas: 100, xp: 30 },
    icon: '💬',
  },
  {
    id: 'daily_missions_2',
    name: 'Aprendiz Dedicado',
    description: 'Complete 2 missões educativas',
    type: 'daily',
    category: 'virtue',
    objectives: [{ type: 'complete_mission', target: 2, current: 0 }],
    rewards: { coronas: 120, xp: 40, items: [{ itemId: 'wisdom_scroll', quantity: 1 }] },
    icon: '📚',
  },
  {
    id: 'daily_visit_all',
    name: 'Tour pelo Santuário',
    description: 'Visite todas as construções do hub (Craft, Market, Missions, Temple)',
    type: 'daily',
    category: 'exploration',
    objectives: [{ type: 'visit', target: 4, current: 0 }],
    rewards: { coronas: 80, xp: 25 },
    icon: '🏛️',
  },
  {
    id: 'daily_train',
    name: 'Treinamento Diário',
    description: 'Treine seu guardião 3 vezes',
    type: 'daily',
    category: 'progress',
    objectives: [{ type: 'train', target: 3, current: 0 }],
    rewards: { coronas: 90, xp: 35 },
    icon: '💪',
  },
  {
    id: 'daily_memory_game',
    name: 'Exercício Mental',
    description: 'Complete o Jogo da Memória 1 vez',
    type: 'daily',
    category: 'virtue',
    objectives: [{ type: 'memory_game', target: 1, current: 0 }],
    rewards: { coronas: 100, xp: 40 },
    icon: '🧠',
  },
  {
    id: 'daily_minigames',
    name: 'Hora de Jogar',
    description: 'Jogue 2 mini-games',
    type: 'daily',
    category: 'virtue',
    objectives: [{ type: 'play_minigame', target: 2, current: 0 }],
    rewards: { coronas: 120, xp: 50 },
    icon: '🎮',
  },
];

/**
 * Missões Semanais (resetam toda semana)
 */
export const WEEKLY_QUESTS: Omit<DailyQuest, 'resetTime' | 'isCompleted'>[] = [
  {
    id: 'weekly_login_streak',
    name: 'Guardião Dedicado',
    description: 'Faça login 5 dias diferentes durante a semana',
    type: 'weekly',
    category: 'progress',
    objectives: [{ type: 'login', target: 5, current: 0 }],
    rewards: { coronas: 500, xp: 200, items: [{ itemId: 'rare_seed', quantity: 1 }] },
    icon: '⭐',
  },
  {
    id: 'weekly_explore_15',
    name: 'Mestre Explorador',
    description: 'Complete 15 explorações na semana',
    type: 'weekly',
    category: 'exploration',
    objectives: [{ type: 'explore', target: 15, current: 0 }],
    rewards: { coronas: 800, xp: 300, items: [{ itemId: 'exploration_compass', quantity: 1 }] },
    icon: '🧭',
  },
  {
    id: 'weekly_social_20',
    name: 'Espírito Comunitário',
    description: 'Interaja com 20 jogadores diferentes durante a semana',
    type: 'weekly',
    category: 'social',
    objectives: [{ type: 'interact', target: 20, current: 0 }],
    rewards: { coronas: 600, xp: 250, items: [{ itemId: 'friendship_token', quantity: 3 }] },
    icon: '🤝',
  },
  {
    id: 'weekly_missions_10',
    name: 'Sábio do Grove',
    description: 'Complete 10 missões educativas na semana',
    type: 'weekly',
    category: 'virtue',
    objectives: [{ type: 'complete_mission', target: 10, current: 0 }],
    rewards: { coronas: 700, xp: 280, items: [{ itemId: 'ancient_knowledge', quantity: 1 }] },
    icon: '📖',
  },
  {
    id: 'weekly_craft_15',
    name: 'Artesão Mestre',
    description: 'Crafte 15 itens na oficina',
    type: 'weekly',
    category: 'collection',
    objectives: [{ type: 'craft', target: 15, current: 0 }],
    rewards: { coronas: 650, xp: 270, items: [{ itemId: 'master_blueprint', quantity: 1 }] },
    icon: '🔨',
  },
  {
    id: 'weekly_invest_5000',
    name: 'Patrono do Santuário',
    description: 'Invista 5000 Coronas no comércio do Grove',
    type: 'weekly',
    category: 'progress',
    objectives: [{ type: 'spend', target: 5000, current: 0 }],
    rewards: { coronas: 1000, xp: 350, items: [{ itemId: 'merchant_badge', quantity: 1 }] },
    icon: '💰',
  },
  {
    id: 'weekly_minigames_10',
    name: 'Mestre dos Jogos',
    description: 'Complete 10 mini-games durante a semana',
    type: 'weekly',
    category: 'virtue',
    objectives: [{ type: 'play_minigame', target: 10, current: 0 }],
    rewards: { coronas: 600, xp: 250, items: [{ itemId: 'game_master_trophy', quantity: 1 }] },
    icon: '🏆',
  },
];

/**
 * Retorna todas as missões diárias e semanais ativas
 */
export function getActiveDailyQuests(): DailyQuest[] {
  const now = new Date();
  
  return [
    ...DAILY_QUESTS.map(q => ({
      ...q,
      resetTime: getNextDayReset(),
      isCompleted: false,
    })),
    ...WEEKLY_QUESTS.map(q => ({
      ...q,
      resetTime: getNextWeekReset(),
      isCompleted: false,
    })),
  ];
}

/**
 * Calcula o próximo reset diário (meia-noite)
 */
function getNextDayReset(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Calcula o próximo reset semanal (domingo meia-noite)
 */
function getNextWeekReset(): Date {
  const now = new Date();
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(0, 0, 0, 0);
  return nextSunday;
}

/**
 * Verifica se uma missão deve resetar
 */
export function shouldResetQuest(quest: DailyQuest): boolean {
  return new Date() >= quest.resetTime;
}

/**
 * Calcula o tempo restante para reset
 */
export function getTimeUntilReset(quest: DailyQuest): string {
  const now = new Date();
  const diff = quest.resetTime.getTime() - now.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  return `${hours}h ${minutes}m`;
}

