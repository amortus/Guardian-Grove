/**
 * Sistema de Conquistas - Guardian Grove
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'exploration' | 'social' | 'combat' | 'collection' | 'mastery' | 'secret';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
  requirement: {
    type: 'exploration_count' | 'login_days' | 'level' | 'interactions' | 'missions_completed' | 'craft_count' | 'spend_coronas' | 'win_battles' | 'collect_items' | 'virtues_total';
    target: number;
    current: number;
  };
  rewards: {
    coronas: number;
    xp: number;
    title?: string; // Título especial que o jogador pode usar
  };
  isUnlocked: boolean;
  unlockedAt?: Date;
  rarity: number; // 0-100, quanto menor mais raro
}

export const ACHIEVEMENTS: Omit<Achievement, 'requirement.current' | 'isUnlocked' | 'unlockedAt'>[] = [
  // === EXPLORAÇÃO ===
  {
    id: 'first_steps',
    name: 'Primeiros Passos',
    description: 'Complete sua primeira exploração',
    icon: '🌱',
    category: 'exploration',
    tier: 'bronze',
    requirement: { type: 'exploration_count', target: 1, current: 0 },
    rewards: { coronas: 100, xp: 50 },
    rarity: 95,
  },
  {
    id: 'explorer',
    name: 'Explorador',
    description: 'Complete 10 explorações',
    icon: '🗺️',
    category: 'exploration',
    tier: 'silver',
    requirement: { type: 'exploration_count', target: 10, current: 0 },
    rewards: { coronas: 300, xp: 150 },
    rarity: 70,
  },
  {
    id: 'master_explorer',
    name: 'Mestre Explorador',
    description: 'Complete 50 explorações',
    icon: '🧭',
    category: 'exploration',
    tier: 'gold',
    requirement: { type: 'exploration_count', target: 50, current: 0 },
    rewards: { coronas: 1000, xp: 500, title: 'Mestre Explorador' },
    rarity: 30,
  },
  {
    id: 'legend_explorer',
    name: 'Lenda Exploradora',
    description: 'Complete 100 explorações',
    icon: '🏆',
    category: 'exploration',
    tier: 'legendary',
    requirement: { type: 'exploration_count', target: 100, current: 0 },
    rewards: { coronas: 3000, xp: 1500, title: 'Lenda do Grove' },
    rarity: 5,
  },

  // === SOCIAL ===
  {
    id: 'friendly',
    name: 'Amigável',
    description: 'Interaja com 10 jogadores diferentes',
    icon: '👋',
    category: 'social',
    tier: 'bronze',
    requirement: { type: 'interactions', target: 10, current: 0 },
    rewards: { coronas: 150, xp: 75 },
    rarity: 80,
  },
  {
    id: 'social_butterfly',
    name: 'Borboleta Social',
    description: 'Interaja com 50 jogadores diferentes',
    icon: '🦋',
    category: 'social',
    tier: 'silver',
    requirement: { type: 'interactions', target: 50, current: 0 },
    rewards: { coronas: 500, xp: 250 },
    rarity: 50,
  },
  {
    id: 'community_pillar',
    name: 'Pilar da Comunidade',
    description: 'Interaja com 100 jogadores diferentes',
    icon: '🤝',
    category: 'social',
    tier: 'gold',
    requirement: { type: 'interactions', target: 100, current: 0 },
    rewards: { coronas: 1500, xp: 750, title: 'Guardião Social' },
    rarity: 20,
  },

  // === PROGRESSO ===
  {
    id: 'novice',
    name: 'Novato',
    description: 'Alcance o nível 5',
    icon: '⭐',
    category: 'mastery',
    tier: 'bronze',
    requirement: { type: 'level', target: 5, current: 0 },
    rewards: { coronas: 200, xp: 100 },
    rarity: 85,
  },
  {
    id: 'adept',
    name: 'Adepto',
    description: 'Alcance o nível 10',
    icon: '🌟',
    category: 'mastery',
    tier: 'silver',
    requirement: { type: 'level', target: 10, current: 0 },
    rewards: { coronas: 500, xp: 250 },
    rarity: 60,
  },
  {
    id: 'master',
    name: 'Mestre',
    description: 'Alcance o nível 25',
    icon: '✨',
    category: 'mastery',
    tier: 'gold',
    requirement: { type: 'level', target: 25, current: 0 },
    rewards: { coronas: 2000, xp: 1000, title: 'Mestre Guardião' },
    rarity: 25,
  },
  {
    id: 'legendary_guardian',
    name: 'Guardião Lendário',
    description: 'Alcance o nível 50',
    icon: '👑',
    category: 'mastery',
    tier: 'legendary',
    requirement: { type: 'level', target: 50, current: 0 },
    rewards: { coronas: 5000, xp: 2500, title: 'Guardião Lendário' },
    rarity: 3,
  },

  // === EDUCAÇÃO ===
  {
    id: 'student',
    name: 'Estudante',
    description: 'Complete 5 missões educativas',
    icon: '📚',
    category: 'mastery',
    tier: 'bronze',
    requirement: { type: 'missions_completed', target: 5, current: 0 },
    rewards: { coronas: 250, xp: 125 },
    rarity: 75,
  },
  {
    id: 'scholar',
    name: 'Estudioso',
    description: 'Complete 25 missões educativas',
    icon: '📖',
    category: 'mastery',
    tier: 'silver',
    requirement: { type: 'missions_completed', target: 25, current: 0 },
    rewards: { coronas: 800, xp: 400 },
    rarity: 45,
  },
  {
    id: 'sage',
    name: 'Sábio',
    description: 'Complete 50 missões educativas',
    icon: '🎓',
    category: 'mastery',
    tier: 'gold',
    requirement: { type: 'missions_completed', target: 50, current: 0 },
    rewards: { coronas: 2500, xp: 1250, title: 'Sábio do Grove' },
    rarity: 15,
  },

  // === ARTESANATO ===
  {
    id: 'apprentice_crafter',
    name: 'Aprendiz Artesão',
    description: 'Crafte 10 itens',
    icon: '🔨',
    category: 'collection',
    tier: 'bronze',
    requirement: { type: 'craft_count', target: 10, current: 0 },
    rewards: { coronas: 200, xp: 100 },
    rarity: 70,
  },
  {
    id: 'master_crafter',
    name: 'Mestre Artesão',
    description: 'Crafte 50 itens',
    icon: '⚒️',
    category: 'collection',
    tier: 'gold',
    requirement: { type: 'craft_count', target: 50, current: 0 },
    rewards: { coronas: 1200, xp: 600, title: 'Mestre Artesão' },
    rarity: 35,
  },

  // === MINI-GAMES ===
  {
    id: 'memory_first_win',
    name: 'Memória Aguçada',
    description: 'Complete o Jogo da Memória pela primeira vez',
    icon: '🌿',
    category: 'exploration',
    tier: 'bronze',
    requirement: { type: 'minigame_memory_wins', target: 1, current: 0 },
    rewards: { coronas: 100, xp: 50 },
    rarity: 90,
  },
  {
    id: 'memory_speed_master',
    name: 'Mestre da Velocidade',
    description: 'Complete o Jogo da Memória em menos de 30 segundos',
    icon: '⚡',
    category: 'exploration',
    tier: 'silver',
    requirement: { type: 'minigame_memory_speed', target: 1, current: 0 },
    rewards: { coronas: 300, xp: 100 },
    rarity: 40,
  },
  {
    id: 'memory_perfect',
    name: 'Memória Perfeita',
    description: 'Complete o Jogo da Memória (difícil) com menos de 20 movimentos',
    icon: '🧠',
    category: 'exploration',
    tier: 'gold',
    requirement: { type: 'minigame_memory_perfect', target: 1, current: 0 },
    rewards: { coronas: 500, xp: 200 },
    rarity: 15,
  },
  {
    id: 'minigame_veteran',
    name: 'Veterano dos Jogos',
    description: 'Jogue 10 mini-games',
    icon: '🎮',
    category: 'exploration',
    tier: 'silver',
    requirement: { type: 'minigames_played', target: 10, current: 0 },
    rewards: { coronas: 400, xp: 150 },
    rarity: 50,
  },
  {
    id: 'minigame_master',
    name: 'Mestre dos Mini-Games',
    description: 'Jogue 50 mini-games',
    icon: '🏆',
    category: 'exploration',
    tier: 'platinum',
    requirement: { type: 'minigames_played', target: 50, current: 0 },
    rewards: { coronas: 2000, xp: 500 },
    rarity: 10,
  },

  // === RIQUEZA ===
  {
    id: 'spender',
    name: 'Gastador',
    description: 'Gaste 5000 Coronas',
    icon: '💰',
    category: 'collection',
    tier: 'silver',
    requirement: { type: 'spend_coronas', target: 5000, current: 0 },
    rewards: { coronas: 500, xp: 250 },
    rarity: 55,
  },
  {
    id: 'big_spender',
    name: 'Grande Gastador',
    description: 'Gaste 25000 Coronas',
    icon: '💎',
    category: 'collection',
    tier: 'gold',
    requirement: { type: 'spend_coronas', target: 25000, current: 0 },
    rewards: { coronas: 2500, xp: 1000, title: 'Patrono do Grove' },
    rarity: 20,
  },

  // === COMBATE ===
  {
    id: 'warrior',
    name: 'Guerreiro',
    description: 'Vença 10 batalhas',
    icon: '⚔️',
    category: 'combat',
    tier: 'bronze',
    requirement: { type: 'win_battles', target: 10, current: 0 },
    rewards: { coronas: 300, xp: 150 },
    rarity: 65,
  },
  {
    id: 'champion',
    name: 'Campeão',
    description: 'Vença 50 batalhas',
    icon: '🛡️',
    category: 'combat',
    tier: 'gold',
    requirement: { type: 'win_battles', target: 50, current: 0 },
    rewards: { coronas: 1500, xp: 750, title: 'Campeão do Grove' },
    rarity: 30,
  },

  // === DEDICAÇÃO ===
  {
    id: 'dedicated',
    name: 'Dedicado',
    description: 'Faça login 7 dias consecutivos',
    icon: '📅',
    category: 'mastery',
    tier: 'silver',
    requirement: { type: 'login_days', target: 7, current: 0 },
    rewards: { coronas: 700, xp: 350 },
    rarity: 50,
  },
  {
    id: 'loyal',
    name: 'Leal',
    description: 'Faça login 30 dias consecutivos',
    icon: '🎖️',
    category: 'mastery',
    tier: 'gold',
    requirement: { type: 'login_days', target: 30, current: 0 },
    rewards: { coronas: 3000, xp: 1500, title: 'Guardião Leal' },
    rarity: 10,
  },

  // === VIRTUDES ===
  {
    id: 'virtuous',
    name: 'Virtuoso',
    description: 'Alcance 100 pontos totais de virtudes',
    icon: '🌿',
    category: 'mastery',
    tier: 'silver',
    requirement: { type: 'virtues_total', target: 100, current: 0 },
    rewards: { coronas: 800, xp: 400 },
    rarity: 40,
  },
  {
    id: 'paragon',
    name: 'Parangão',
    description: 'Alcance 300 pontos totais de virtudes',
    icon: '💚',
    category: 'mastery',
    tier: 'platinum',
    requirement: { type: 'virtues_total', target: 300, current: 0 },
    rewards: { coronas: 5000, xp: 2000, title: 'Parangão das Virtudes' },
    rarity: 5,
  },

  // === SECRETAS ===
  {
    id: 'secret_first_night',
    name: 'Guardião Noturno',
    description: 'Faça login à meia-noite',
    icon: '🌙',
    category: 'secret',
    tier: 'gold',
    requirement: { type: 'exploration_count', target: 1, current: 0 }, // Placeholder
    rewards: { coronas: 1000, xp: 500, title: 'Guardião Noturno' },
    rarity: 15,
  },
];

/**
 * Retorna conquistas por categoria
 */
export function getAchievementsByCategory(category: Achievement['category']): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === category).map(a => ({
    ...a,
    requirement: { ...a.requirement },
    isUnlocked: false,
  }));
}

/**
 * Verifica se uma conquista foi desbloqueada
 */
export function checkAchievementUnlock(achievement: Achievement): boolean {
  return achievement.requirement.current >= achievement.requirement.target && !achievement.isUnlocked;
}

/**
 * Calcula progresso da conquista
 */
export function getAchievementProgress(achievement: Achievement): number {
  return Math.min((achievement.requirement.current / achievement.requirement.target) * 100, 100);
}

/**
 * Retorna cor do tier
 */
export function getTierColor(tier: Achievement['tier']): string {
  const colors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
    legendary: '#FF6B9D',
  };
  return colors[tier];
}

