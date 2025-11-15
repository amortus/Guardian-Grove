/**
 * Sistema de Leaderboard - Guardian Grove
 */

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  guardianName: string;
  value: number;
  isCurrentUser?: boolean;
}

export interface LeaderboardData {
  category: 'level' | 'explorations' | 'coronas' | 'virtues' | 'missions' | 'crafts';
  title: string;
  icon: string;
  entries: LeaderboardEntry[];
  userRank?: number;
  lastUpdated: Date;
}

export const LEADERBOARD_CATEGORIES = [
  {
    id: 'level',
    title: 'Níveis Mais Altos',
    icon: '👑',
    description: 'Guardiões mais poderosos',
    valueLabel: 'Nível',
  },
  {
    id: 'explorations',
    title: 'Explorações Completadas',
    icon: '🗺️',
    description: 'Maiores exploradores',
    valueLabel: 'Explorações',
  },
  {
    id: 'coronas',
    title: 'Maiores Fortunas',
    icon: '💰',
    description: 'Mais coronas acumuladas',
    valueLabel: 'Coronas',
  },
  {
    id: 'virtues',
    title: 'Virtudes Totais',
    icon: '🌿',
    description: 'Guardiões mais virtuosos',
    valueLabel: 'Virtudes',
  },
  {
    id: 'missions',
    title: 'Missões Educativas',
    icon: '📚',
    description: 'Maiores estudiosos',
    valueLabel: 'Missões',
  },
  {
    id: 'crafts',
    title: 'Itens Craftados',
    icon: '🔨',
    description: 'Mestres artesãos',
    valueLabel: 'Itens',
  },
] as const;

/**
 * Simula dados de leaderboard (será substituído por API real)
 */
export function generateMockLeaderboard(
  category: LeaderboardData['category'],
  currentUserId?: string
): LeaderboardData {
  const categoryConfig = LEADERBOARD_CATEGORIES.find(c => c.id === category)!;
  
  // Gera dados mock
  const entries: LeaderboardEntry[] = Array.from({ length: 10 }, (_, i) => ({
    rank: i + 1,
    userId: `user_${i + 1}`,
    username: `Jogador${i + 1}`,
    guardianName: `Guardião${i + 1}`,
    value: Math.floor(Math.random() * 1000) + 100 * (10 - i),
    isCurrentUser: currentUserId === `user_${i + 1}`,
  }));

  return {
    category,
    title: categoryConfig.title,
    icon: categoryConfig.icon,
    entries: entries.sort((a, b) => b.value - a.value).map((e, i) => ({ ...e, rank: i + 1 })),
    userRank: Math.floor(Math.random() * 50) + 11,
    lastUpdated: new Date(),
  };
}

/**
 * Formata valor baseado na categoria
 */
export function formatLeaderboardValue(category: LeaderboardData['category'], value: number): string {
  switch (category) {
    case 'coronas':
      return `${value.toLocaleString('pt-BR')}💰`;
    case 'level':
      return `Nv. ${value}`;
    case 'explorations':
    case 'missions':
    case 'crafts':
      return `${value}`;
    case 'virtues':
      return `${value}🌿`;
    default:
      return `${value}`;
  }
}

/**
 * Retorna cor baseada no rank
 */
export function getRankColor(rank: number): string {
  switch (rank) {
    case 1:
      return '#FFD700'; // Ouro
    case 2:
      return '#C0C0C0'; // Prata
    case 3:
      return '#CD7F32'; // Bronze
    default:
      return '#6DC7A4'; // Verde padrão
  }
}

/**
 * Retorna emoji de medalha
 */
export function getRankMedal(rank: number): string {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return '';
  }
}

