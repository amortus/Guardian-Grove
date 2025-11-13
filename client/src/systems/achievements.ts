/**
 * Sistema de Conquistas (Achievements)
 * Badges e títulos especiais
 */

import type { GameEvent } from './game-events';
import type { GameState } from '../types';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'battle' | 'training' | 'collection' | 'social' | 'special';
  requirement: AchievementRequirement;
  reward: AchievementReward;
  isUnlocked: boolean;
  unlockedAt?: number; // timestamp
  progress: number;
  hidden?: boolean; // Conquista secreta
}

export interface AchievementRequirement {
  type: 'win_battles' | 'train_count' | 'collect_items' | 'spend_money' | 'talk_npcs' | 'craft_items' | 'win_streak' | 'beast_age' | 'tournament_rank' | 'special';
  target: number | string;
  current: number;
}

export interface AchievementReward {
  title?: string; // Título desbloqueável
  coronas?: number;
  items?: Array<{ itemId: string; quantity: number }>;
  badge: string; // Emoji/ícone do badge
}

/**
 * Lista de todas as conquistas
 */
export const ACHIEVEMENTS: Achievement[] = [
  // ===== BATALHA =====
  {
    id: 'first_blood',
    name: 'Primeira Vitória',
    description: 'Ganhe sua primeira batalha',
    icon: '⚔️',
    category: 'battle',
    requirement: { type: 'win_battles', target: 1, current: 0 },
    reward: { coronas: 100, badge: '🥉' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'warrior',
    name: 'Guerreiro',
    description: 'Ganhe 25 batalhas',
    icon: '⚔️',
    category: 'battle',
    requirement: { type: 'win_battles', target: 25, current: 0 },
    reward: { coronas: 500, title: 'Guerreiro', badge: '🥈' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'champion',
    name: 'Campeão',
    description: 'Ganhe 100 batalhas',
    icon: '👑',
    category: 'battle',
    requirement: { type: 'win_battles', target: 100, current: 0 },
    reward: { coronas: 2000, title: 'Campeão Lendário', badge: '🥇' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'unstoppable',
    name: 'Imparável',
    description: 'Ganhe 10 batalhas seguidas',
    icon: '🔥',
    category: 'battle',
    requirement: { type: 'win_streak', target: 10, current: 0 },
    reward: { coronas: 1000, title: 'Imparável', badge: '🔥' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'mythic_master',
    name: 'Mestre Mítico',
    description: 'Vença um torneio Mítico',
    icon: '✨',
    category: 'battle',
    requirement: { type: 'tournament_rank', target: 'mythic', current: 0 },
    reward: { coronas: 5000, title: 'Mestre Mítico', badge: '✨' },
    isUnlocked: false,
    progress: 0,
  },

  // ===== TREINO =====
  {
    id: 'dedicated_trainer',
    name: 'Treinador Dedicado',
    description: 'Treine sua besta 50 vezes',
    icon: '💪',
    category: 'training',
    requirement: { type: 'train_count', target: 50, current: 0 },
    reward: { coronas: 800, title: 'Treinador Dedicado', badge: '💪' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'master_trainer',
    name: 'Mestre dos Treinos',
    description: 'Treine sua besta 200 vezes',
    icon: '🎯',
    category: 'training',
    requirement: { type: 'train_count', target: 200, current: 0 },
    reward: { coronas: 3000, title: 'Mestre dos Treinos', badge: '🎯' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'elder_keeper',
    name: 'Guardião Ancião',
    description: 'Mantenha uma besta viva por mais de 150 semanas',
    icon: '🧙',
    category: 'training',
    requirement: { type: 'beast_age', target: 150, current: 0 },
    reward: { coronas: 5000, title: 'Guardião Ancião', badge: '🧙' },
    isUnlocked: false,
    progress: 0,
  },

  // ===== COLEÇÃO =====
  {
    id: 'collector',
    name: 'Colecionador',
    description: 'Possua 50 itens diferentes',
    icon: '📦',
    category: 'collection',
    requirement: { type: 'collect_items', target: 50, current: 0 },
    reward: { coronas: 1000, badge: '📦' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'hoarder',
    name: 'Acumulador',
    description: 'Possua 100 itens diferentes',
    icon: '💎',
    category: 'collection',
    requirement: { type: 'collect_items', target: 100, current: 0 },
    reward: { coronas: 3000, title: 'Acumulador de Tesouros', badge: '💎' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'big_spender',
    name: 'Gastador',
    description: 'Gaste 10.000 Coronas',
    icon: '💰',
    category: 'collection',
    requirement: { type: 'spend_money', target: 10000, current: 0 },
    reward: { coronas: 2000, title: 'Gastador Mítico', badge: '💰' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'master_crafter',
    name: 'Mestre Artesão',
    description: 'Crafte 30 itens',
    icon: '⚗️',
    category: 'collection',
    requirement: { type: 'craft_items', target: 30, current: 0 },
    reward: { coronas: 2000, title: 'Mestre Artesão', badge: '⚗️' },
    isUnlocked: false,
    progress: 0,
  },

  // ===== SOCIAL =====
  {
    id: 'friendly',
    name: 'Amigável',
    description: 'Converse com todos os NPCs',
    icon: '👥',
    category: 'social',
    requirement: { type: 'talk_npcs', target: 7, current: 0 },
    reward: { coronas: 500, badge: '👥' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'socialite',
    name: 'Socialite',
    description: 'Converse com NPCs 100 vezes',
    icon: '💬',
    category: 'social',
    requirement: { type: 'talk_npcs', target: 100, current: 0 },
    reward: { coronas: 1500, title: 'Socialite da Vila', badge: '💬' },
    isUnlocked: false,
    progress: 0,
  },

  
  // ===== BATALHA (Continuação) =====
  {
    id: 'bronze_master',
    name: 'Mestre Bronze',
    description: 'Vença um torneio Bronze',
    icon: '🥉',
    category: 'battle',
    requirement: { type: 'tournament_rank', target: 'bronze', current: 0 },
    reward: { coronas: 300, badge: '🥉' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'silver_master',
    name: 'Mestre Prata',
    description: 'Vença um torneio Prata',
    icon: '🥈',
    category: 'battle',
    requirement: { type: 'tournament_rank', target: 'silver', current: 0 },
    reward: { coronas: 800, title: 'Competidor de Prata', badge: '🥈' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'gold_master',
    name: 'Mestre Ouro',
    description: 'Vença um torneio Ouro',
    icon: '🥇',
    category: 'battle',
    requirement: { type: 'tournament_rank', target: 'gold', current: 0 },
    reward: { coronas: 2000, title: 'Campeão de Ouro', badge: '🥇' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'flawless_victory',
    name: 'Vitória Perfeita',
    description: 'Vença uma batalha sem receber dano',
    icon: '💫',
    category: 'battle',
    requirement: { type: 'special', target: 'no_damage_win', current: 0 },
    reward: { coronas: 1500, title: 'Intocável', badge: '💫' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'comeback_king',
    name: 'Rei da Virada',
    description: 'Vença uma batalha com menos de 10% de HP',
    icon: '❤️‍🔥',
    category: 'battle',
    requirement: { type: 'special', target: 'low_hp_win', current: 0 },
    reward: { coronas: 1200, title: 'Rei da Virada', badge: '❤️‍🔥' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'critical_master',
    name: 'Mestre dos Críticos',
    description: 'Acerte 50 golpes críticos',
    icon: '💥',
    category: 'battle',
    requirement: { type: 'special', target: 'critical_hits_50', current: 0 },
    reward: { coronas: 1000, badge: '💥' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'hundred_battles',
    name: 'Veterano',
    description: 'Participe de 100 batalhas (vitórias ou derrotas)',
    icon: '🎖️',
    category: 'battle',
    requirement: { type: 'special', target: 'total_battles_100', current: 0 },
    reward: { coronas: 1500, title: 'Veterano de Guerra', badge: '🎖️' },
    isUnlocked: false,
    progress: 0,
  },
  
  // ===== TREINO (Continuação) =====
  {
    id: 'balanced_trainer',
    name: 'Treinador Equilibrado',
    description: 'Treine todos os atributos pelo menos 10 vezes cada',
    icon: '⚖️',
    category: 'training',
    requirement: { type: 'special', target: 'balanced_training', current: 0 },
    reward: { coronas: 1200, title: 'Treinador Equilibrado', badge: '⚖️' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'max_might',
    name: 'Força Máxima',
    description: 'Alcance 100 de Might',
    icon: '💪',
    category: 'training',
    requirement: { type: 'special', target: 'might_100', current: 0 },
    reward: { coronas: 2000, title: 'Força Suprema', badge: '💪' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'max_focus',
    name: 'Foco Absoluto',
    description: 'Alcance 100 de Focus',
    icon: '🧠',
    category: 'training',
    requirement: { type: 'special', target: 'focus_100', current: 0 },
    reward: { coronas: 2000, title: 'Mente Brilhante', badge: '🧠' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'max_ward',
    name: 'Defesa Impenetrável',
    description: 'Alcance 100 de Ward',
    icon: '🛡️',
    category: 'training',
    requirement: { type: 'special', target: 'ward_100', current: 0 },
    reward: { coronas: 2000, title: 'Defesa Impenetrável', badge: '🛡️' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'max_vitality',
    name: 'Vitalidade Suprema',
    description: 'Alcance 100 de Vitality',
    icon: '❤️',
    category: 'training',
    requirement: { type: 'special', target: 'vitality_100', current: 0 },
    reward: { coronas: 2000, title: 'Vitalidade Suprema', badge: '❤️' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'max_agility',
    name: 'Agilidade Extrema',
    description: 'Alcance 100 de Agility',
    icon: '⚡',
    category: 'training',
    requirement: { type: 'special', target: 'agility_100', current: 0 },
    reward: { coronas: 2000, title: 'Velocidade da Luz', badge: '⚡' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'max_wit',
    name: 'Inteligência Divina',
    description: 'Alcance 100 de Wit',
    icon: '✨',
    category: 'training',
    requirement: { type: 'special', target: 'wit_100', current: 0 },
    reward: { coronas: 2000, title: 'Sábio Ancião', badge: '✨' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'all_stats_max',
    name: 'Perfeição Absoluta',
    description: 'Alcance 100 em todos os atributos',
    icon: '👑',
    category: 'training',
    requirement: { type: 'special', target: 'all_stats_100', current: 0 },
    reward: { coronas: 10000, title: 'Guardião Perfeito', badge: '👑' },
    isUnlocked: false,
    progress: 0,
    hidden: true,
  },

  // ===== COLEÇÃO (Continuação) =====
  {
    id: 'first_craft',
    name: 'Primeiro Craft',
    description: 'Crafte seu primeiro item',
    icon: '🔨',
    category: 'collection',
    requirement: { type: 'craft_items', target: 1, current: 0 },
    reward: { coronas: 100, badge: '🔨' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'advanced_crafter',
    name: 'Artesão Avançado',
    description: 'Crafte 10 itens',
    icon: '⚒️',
    category: 'collection',
    requirement: { type: 'craft_items', target: 10, current: 0 },
    reward: { coronas: 500, badge: '⚒️' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'legendary_crafter',
    name: 'Artesão Lendário',
    description: 'Crafte 100 itens',
    icon: '🏆',
    category: 'collection',
    requirement: { type: 'craft_items', target: 100, current: 0 },
    reward: { coronas: 5000, title: 'Artesão Lendário', badge: '🏆' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'rich',
    name: 'Rico',
    description: 'Acumule 10.000 Coronas',
    icon: '💵',
    category: 'collection',
    requirement: { type: 'special', target: 'money_10000', current: 0 },
    reward: { coronas: 1000, badge: '💵' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'millionaire',
    name: 'Milionário',
    description: 'Acumule 100.000 Coronas',
    icon: '💎',
    category: 'collection',
    requirement: { type: 'special', target: 'money_100000', current: 0 },
    reward: { coronas: 10000, title: 'Magnata de Aurath', badge: '💎' },
    isUnlocked: false,
    progress: 0,
    hidden: true,
  },
  {
    id: 'explorer_novice',
    name: 'Explorador Novato',
    description: 'Complete 10 explorações',
    icon: '🗺️',
    category: 'collection',
    requirement: { type: 'special', target: 'explorations_10', current: 0 },
    reward: { coronas: 500, badge: '🗺️' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'explorer_veteran',
    name: 'Explorador Veterano',
    description: 'Complete 50 explorações',
    icon: '🧭',
    category: 'collection',
    requirement: { type: 'special', target: 'explorations_50', current: 0 },
    reward: { coronas: 2000, title: 'Desbravador', badge: '🧭' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'treasure_hunter',
    name: 'Caçador de Tesouros',
    description: 'Colete 100 materiais em explorações',
    icon: '💰',
    category: 'collection',
    requirement: { type: 'special', target: 'materials_100', current: 0 },
    reward: { coronas: 1500, title: 'Caçador de Tesouros', badge: '💰' },
    isUnlocked: false,
    progress: 0,
  },

  // ===== SOCIAL (Continuação) =====
  {
    id: 'first_chat',
    name: 'Primeira Conversa',
    description: 'Converse com um NPC pela primeira vez',
    icon: '💬',
    category: 'social',
    requirement: { type: 'talk_npcs', target: 1, current: 0 },
    reward: { coronas: 50, badge: '💬' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'popular',
    name: 'Popular',
    description: 'Converse com NPCs 50 vezes',
    icon: '⭐',
    category: 'social',
    requirement: { type: 'talk_npcs', target: 50, current: 0 },
    reward: { coronas: 800, badge: '⭐' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'master_of_relic',
    name: 'Mestre das Relíquias',
    description: 'Use 10 Relíquias de Eco diferentes',
    icon: '🔮',
    category: 'social',
    requirement: { type: 'special', target: 'relics_10', current: 0 },
    reward: { coronas: 3000, title: 'Mestre das Relíquias', badge: '🔮' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'quest_master',
    name: 'Mestre das Missões',
    description: 'Complete 20 missões',
    icon: '📜',
    category: 'social',
    requirement: { type: 'special', target: 'quests_20', current: 0 },
    reward: { coronas: 2500, title: 'Mestre das Missões', badge: '📜' },
    isUnlocked: false,
    progress: 0,
  },

  // ===== ESPECIAIS =====
  {
    id: 'early_bird',
    name: 'Madrugador',
    description: 'Jogue entre 5h e 7h da manhã',
    icon: '🌅',
    category: 'special',
    requirement: { type: 'special', target: 'play_early', current: 0 },
    reward: { coronas: 500, title: 'Madrugador', badge: '🌅' },
    isUnlocked: false,
    progress: 0,
    hidden: true,
  },
  {
    id: 'night_owl',
    name: 'Coruja Noturna',
    description: 'Jogue entre 23h e 2h da madrugada',
    icon: '🦉',
    category: 'special',
    requirement: { type: 'special', target: 'play_late', current: 0 },
    reward: { coronas: 500, title: 'Coruja Noturna', badge: '🦉' },
    isUnlocked: false,
    progress: 0,
    hidden: true,
  },
  {
    id: 'week_warrior',
    name: 'Guerreiro Semanal',
    description: 'Jogue 7 dias seguidos',
    icon: '📅',
    category: 'special',
    requirement: { type: 'special', target: 'login_streak_7', current: 0 },
    reward: { coronas: 1000, badge: '📅' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'month_champion',
    name: 'Campeão Mensal',
    description: 'Jogue 30 dias seguidos',
    icon: '📆',
    category: 'special',
    requirement: { type: 'special', target: 'login_streak_30', current: 0 },
    reward: { coronas: 5000, title: 'Guardião Dedicado', badge: '📆' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'year_legend',
    name: 'Lenda Anual',
    description: 'Jogue 365 dias seguidos',
    icon: '🏅',
    category: 'special',
    requirement: { type: 'special', target: 'login_streak_365', current: 0 },
    reward: { coronas: 50000, title: 'Lenda de Aurath', badge: '🏅' },
    isUnlocked: false,
    progress: 0,
    hidden: true,
  },
  {
    id: 'first_week',
    name: 'Primeira Semana',
    description: 'Complete sua primeira semana no jogo',
    icon: '🌱',
    category: 'special',
    requirement: { type: 'special', target: 'game_week_1', current: 0 },
    reward: { coronas: 200, badge: '🌱' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'fifty_weeks',
    name: 'Meio Século',
    description: 'Complete 50 semanas no jogo',
    icon: '🌳',
    category: 'special',
    requirement: { type: 'special', target: 'game_week_50', current: 0 },
    reward: { coronas: 3000, title: 'Guardião Experiente', badge: '🌳' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'hundred_weeks',
    name: 'Centenário',
    description: 'Complete 100 semanas no jogo',
    icon: '🌲',
    category: 'special',
    requirement: { type: 'special', target: 'game_week_100', current: 0 },
    reward: { coronas: 10000, title: 'Guardião Centenário', badge: '🌲' },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'lucky_seven',
    name: 'Sorte 7',
    description: 'Complete exatamente 7 desafios diários em um dia',
    icon: '🎰',
    category: 'special',
    requirement: { type: 'special', target: 'daily_7', current: 0 },
    reward: { coronas: 777, title: 'Sortudo', badge: '🎰' },
    isUnlocked: false,
    progress: 0,
    hidden: true,
  },
  {
    id: 'speed_runner',
    name: 'Velocista',
    description: 'Vença um torneio Ouro em menos de 20 semanas',
    icon: '⚡',
    category: 'special',
    requirement: { type: 'special', target: 'gold_fast', current: 0 },
    reward: { coronas: 3000, title: 'Velocista', badge: '⚡' },
    isUnlocked: false,
    progress: 0,
    hidden: true,
  },
  {
    id: 'survivor',
    name: 'Sobrevivente',
    description: 'Perca 10 batalhas seguidas e continue jogando',
    icon: '🛡️',
    category: 'special',
    requirement: { type: 'special', target: 'lose_streak', current: 0 },
    reward: { coronas: 1000, title: 'Sobrevivente', badge: '🛡️' },
    isUnlocked: false,
    progress: 0,
    hidden: true,
  },
  {
    id: 'phoenix',
    name: 'Fênix',
    description: 'Reviva da derrota e vença a próxima batalha',
    icon: '🔥',
    category: 'special',
    requirement: { type: 'special', target: 'phoenix_rise', current: 0 },
    reward: { coronas: 800, title: 'Fênix', badge: '🔥' },
    isUnlocked: false,
    progress: 0,
    hidden: true,
  },
  {
    id: 'perfectionist',
    name: 'Perfeccionista',
    description: 'Desbloqueie todas as outras conquistas',
    icon: '🌟',
    category: 'special',
    requirement: { type: 'special', target: 'all_achievements', current: 0 },
    reward: { coronas: 100000, title: 'Guardião Supremo', badge: '🌟' },
    isUnlocked: false,
    progress: 0,
    hidden: true,
  },
];

/**
 * Atualiza o progresso de uma conquista
 */
export function updateAchievementProgress(
  achievements: Achievement[],
  achievementId: string,
  increment: number = 1
): boolean {
  const achievement = achievements.find(a => a.id === achievementId);
  if (!achievement || achievement.isUnlocked) return false;

  achievement.requirement.current = Math.min(
    achievement.requirement.current + increment,
    achievement.requirement.target as number
  );
  achievement.progress = achievement.requirement.current / (achievement.requirement.target as number);

  if (achievement.requirement.current >= (achievement.requirement.target as number)) {
    achievement.isUnlocked = true;
    achievement.unlockedAt = Date.now();
    return true; // Conquista desbloqueada!
  }

  return false;
}

/**
 * Desbloqueia uma conquista instantaneamente
 */
export function unlockAchievement(achievements: Achievement[], achievementId: string): boolean {
  const achievement = achievements.find(a => a.id === achievementId);
  if (!achievement || achievement.isUnlocked) return false;

  achievement.isUnlocked = true;
  achievement.unlockedAt = Date.now();
  achievement.requirement.current = achievement.requirement.target as number;
  achievement.progress = 1;

  return true;
}

/**
 * Retorna conquistas desbloqueadas
 */
export function getUnlockedAchievements(achievements: Achievement[]): Achievement[] {
  return achievements.filter(a => a.isUnlocked);
}

/**
 * Retorna conquistas por categoria
 */
export function getAchievementsByCategory(
  achievements: Achievement[],
  category: Achievement['category']
): Achievement[] {
  return achievements.filter(a => a.category === category);
}

/**
 * Retorna porcentagem de conclusão
 */
export function getCompletionPercentage(achievements: Achievement[]): number {
  const total = achievements.filter(a => !a.hidden).length;
  const unlocked = achievements.filter(a => a.isUnlocked && !a.hidden).length;
  return (unlocked / total) * 100;
}

/**
 * Retorna títulos disponíveis
 */
export function getAvailableTitles(achievements: Achievement[]): string[] {
  return achievements
    .filter(a => a.isUnlocked && a.reward.title)
    .map(a => a.reward.title!);
}

/**
 * Verifica se todas as conquistas foram desbloqueadas
 */
export function checkAllAchievements(achievements: Achievement[]): boolean {
  const nonHidden = achievements.filter(a => !a.hidden);
  return nonHidden.every(a => a.isUnlocked);
}

/**
 * Tracking automático de conquistas baseado em ações
 */
export function trackAchievements(
  achievements: Achievement[],
  action: string,
  value: number = 1
): Achievement[] {
  const unlocked: Achievement[] = [];

  switch (action) {
    case 'win_battle':
      if (updateAchievementProgress(achievements, 'first_blood', value)) {
        unlocked.push(achievements.find(a => a.id === 'first_blood')!);
      }
      if (updateAchievementProgress(achievements, 'warrior', value)) {
        unlocked.push(achievements.find(a => a.id === 'warrior')!);
      }
      if (updateAchievementProgress(achievements, 'champion', value)) {
        unlocked.push(achievements.find(a => a.id === 'champion')!);
      }
      break;

    case 'train':
      if (updateAchievementProgress(achievements, 'dedicated_trainer', value)) {
        unlocked.push(achievements.find(a => a.id === 'dedicated_trainer')!);
      }
      if (updateAchievementProgress(achievements, 'master_trainer', value)) {
        unlocked.push(achievements.find(a => a.id === 'master_trainer')!);
      }
      break;

    case 'craft':
      if (updateAchievementProgress(achievements, 'master_crafter', value)) {
        unlocked.push(achievements.find(a => a.id === 'master_crafter')!);
      }
      break;

    case 'spend':
      if (updateAchievementProgress(achievements, 'big_spender', value)) {
        unlocked.push(achievements.find(a => a.id === 'big_spender')!);
      }
      break;

    case 'talk_npc':
      if (updateAchievementProgress(achievements, 'friendly', value)) {
        unlocked.push(achievements.find(a => a.id === 'friendly')!);
      }
      if (updateAchievementProgress(achievements, 'socialite', value)) {
        unlocked.push(achievements.find(a => a.id === 'socialite')!);
      }
      break;
  }

  // Verifica conquista de perfeccionista
  if (checkAllAchievements(achievements)) {
    if (unlockAchievement(achievements, 'perfectionist')) {
      unlocked.push(achievements.find(a => a.id === 'perfectionist')!);
    }
  }

  return unlocked;
}

// ===== NOVO SISTEMA DE EVENTOS =====

/**
 * Atualiza achievements baseado em eventos do jogo
 */
export function updateAchievements(event: GameEvent, gameState: GameState): void {
  if (!gameState.achievements) return;
  
  for (const achievement of gameState.achievements) {
    // Ignorar achievements já desbloqueadas
    if (achievement.isUnlocked) continue;
    
    let progressIncrement = 0;
    
    // Match event type com achievement requirement type
    switch (event.type) {
      case 'battle_won':
        if (achievement.requirement.type === 'win_battles') {
          progressIncrement = 1;
        }
        break;
        
      case 'beast_trained':
        if (achievement.requirement.type === 'train_count') {
          progressIncrement = 1;
        }
        break;
        
      case 'item_crafted':
        if (achievement.requirement.type === 'craft_items') {
          progressIncrement = 1;
        }
        break;
        
      case 'item_collected':
        if (achievement.requirement.type === 'collect_items') {
          progressIncrement = event.quantity;
        }
        break;
        
      case 'money_spent':
        if (achievement.requirement.type === 'spend_money') {
          progressIncrement = event.amount;
        }
        break;
        
      case 'npc_talked':
        if (achievement.requirement.type === 'talk_npcs') {
          progressIncrement = 1;
        }
        break;
        
      case 'beast_aged':
        if (achievement.requirement.type === 'beast_age') {
          achievement.requirement.current = event.ageInDays;
          progressIncrement = 0; // Já setamos current
        }
        break;
        
      case 'win_streak':
        if (achievement.requirement.type === 'win_streak') {
          achievement.requirement.current = event.currentStreak;
          progressIncrement = 0; // Já setamos current
        }
        break;
    }
    
    // Incrementar progresso
    if (progressIncrement > 0) {
      achievement.requirement.current += progressIncrement;
    }
    
    // Calcular progresso percentual
    if (typeof achievement.requirement.target === 'number') {
      achievement.progress = Math.min((achievement.requirement.current / achievement.requirement.target) * 100, 100);
    }
    
    // Verificar se desbloqueou
    if (typeof achievement.requirement.target === 'number' && achievement.requirement.current >= achievement.requirement.target) {
      unlockAchievementNew(achievement, gameState);
    }
  }
}

/**
 * Desbloqueia uma achievement e aplica recompensas
 */
function unlockAchievementNew(achievement: Achievement, gameState: GameState): void {
  if (achievement.isUnlocked) return;
  
  achievement.isUnlocked = true;
  achievement.unlockedAt = Date.now();
  achievement.progress = 100;
  
  console.log(`[Achievement] 🏆 UNLOCKED: ${achievement.name} ${achievement.reward.badge}`);
  
  // Aplicar recompensas
  if (achievement.reward.coronas) {
    gameState.coronas += achievement.reward.coronas;
    console.log(`[Achievement] Reward: +${achievement.reward.coronas} coronas`);
  }
  
  if (achievement.reward.title && gameState.guardian) {
    gameState.guardian.title = achievement.reward.title;
    console.log(`[Achievement] Title unlocked: ${achievement.reward.title}`);
  }
  
  if (achievement.reward.items) {
    for (const itemReward of achievement.reward.items) {
      const existing = gameState.inventory.find(i => i.id === itemReward.itemId);
      if (existing) {
        existing.quantity = (existing.quantity || 0) + itemReward.quantity;
      } else {
        gameState.inventory.push({
          id: itemReward.itemId,
          name: itemReward.itemId,
          category: 'special',
          effect: 'Achievement reward',
          price: 0,
          description: 'Recompensa de conquista',
          quantity: itemReward.quantity,
        });
      }
      console.log(`[Achievement] Reward: +${itemReward.quantity}x ${itemReward.itemId}`);
    }
  }
}

