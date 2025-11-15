/**
 * Sistema de Roleta Diária - Guardian Grove
 */

export interface SpinReward {
  id: string;
  name: string;
  icon: string;
  type: 'coronas' | 'xp' | 'item' | 'rare_item' | 'legendary_item';
  value: number | string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  weight: number; // Peso para probabilidade (quanto maior, mais comum)
  color: string;
}

export interface DailySpinState {
  lastSpinDate: Date | null;
  canSpin: boolean;
  nextSpinIn: number; // Milissegundos até próximo spin
  totalSpins: number;
  spinHistory: Array<{
    reward: SpinReward;
    date: Date;
  }>;
}

/**
 * Recompensas da roleta com probabilidades
 */
export const SPIN_REWARDS: SpinReward[] = [
  // COMUM (70% total)
  {
    id: 'coronas_50',
    name: '50 Coronas',
    icon: '💰',
    type: 'coronas',
    value: 50,
    rarity: 'common',
    weight: 25,
    color: '#8B7355',
  },
  {
    id: 'coronas_100',
    name: '100 Coronas',
    icon: '💰',
    type: 'coronas',
    value: 100,
    rarity: 'common',
    weight: 20,
    color: '#9B8365',
  },
  {
    id: 'xp_50',
    name: '50 XP',
    icon: '⭐',
    type: 'xp',
    value: 50,
    rarity: 'common',
    weight: 15,
    color: '#7E9B9C',
  },
  {
    id: 'xp_100',
    name: '100 XP',
    icon: '⭐',
    type: 'xp',
    value: 100,
    rarity: 'common',
    weight: 10,
    color: '#8EABAC',
  },

  // INCOMUM (20% total)
  {
    id: 'coronas_250',
    name: '250 Coronas',
    icon: '💎',
    type: 'coronas',
    value: 250,
    rarity: 'uncommon',
    weight: 8,
    color: '#5D8AA8',
  },
  {
    id: 'xp_200',
    name: '200 XP',
    icon: '✨',
    type: 'xp',
    value: 200,
    rarity: 'uncommon',
    weight: 7,
    color: '#6DA9AF',
  },
  {
    id: 'item_common',
    name: 'Item Comum',
    icon: '📦',
    type: 'item',
    value: 'training_weights',
    rarity: 'uncommon',
    weight: 5,
    color: '#6B9A9F',
  },

  // RARO (8% total)
  {
    id: 'coronas_500',
    name: '500 Coronas',
    icon: '💵',
    type: 'coronas',
    value: 500,
    rarity: 'rare',
    weight: 4,
    color: '#4169E1',
  },
  {
    id: 'xp_500',
    name: '500 XP',
    icon: '🌟',
    type: 'xp',
    value: 500,
    rarity: 'rare',
    weight: 2,
    color: '#5E7CE1',
  },
  {
    id: 'item_rare',
    name: 'Item Raro',
    icon: '🎁',
    type: 'rare_item',
    value: 'ancient_relic',
    rarity: 'rare',
    weight: 2,
    color: '#4A6FE1',
  },

  // ÉPICO (1.5% total)
  {
    id: 'coronas_1000',
    name: '1000 Coronas',
    icon: '💸',
    type: 'coronas',
    value: 1000,
    rarity: 'epic',
    weight: 0.8,
    color: '#9B30FF',
  },
  {
    id: 'xp_1000',
    name: '1000 XP',
    icon: '💫',
    type: 'xp',
    value: 1000,
    rarity: 'epic',
    weight: 0.4,
    color: '#A540FF',
  },
  {
    id: 'item_epic',
    name: 'Item Épico',
    icon: '🏆',
    type: 'rare_item',
    value: 'wisdom_tome',
    rarity: 'epic',
    weight: 0.3,
    color: '#9020EF',
  },

  // LENDÁRIO (0.5% total)
  {
    id: 'coronas_5000',
    name: '5000 Coronas',
    icon: '💎',
    type: 'coronas',
    value: 5000,
    rarity: 'legendary',
    weight: 0.2,
    color: '#FFD700',
  },
  {
    id: 'xp_2500',
    name: '2500 XP',
    icon: '✨',
    type: 'xp',
    value: 2500,
    rarity: 'legendary',
    weight: 0.15,
    color: '#FFE700',
  },
  {
    id: 'item_legendary',
    name: 'Item Lendário',
    icon: '👑',
    type: 'legendary_item',
    value: 'legendary_seed',
    rarity: 'legendary',
    weight: 0.15,
    color: '#FFB700',
  },
];

/**
 * Seleciona uma recompensa aleatória baseada nos pesos
 */
export function selectRandomReward(): SpinReward {
  const totalWeight = SPIN_REWARDS.reduce((sum, reward) => sum + reward.weight, 0);
  let random = Math.random() * totalWeight;

  for (const reward of SPIN_REWARDS) {
    random -= reward.weight;
    if (random <= 0) {
      return reward;
    }
  }

  return SPIN_REWARDS[0]; // Fallback
}

/**
 * Verifica se pode girar hoje
 */
export function canSpinToday(lastSpinDate: Date | null): boolean {
  if (!lastSpinDate) return true;

  const now = new Date();
  const lastSpin = new Date(lastSpinDate);

  // Resetar à meia-noite
  return (
    now.getDate() !== lastSpin.getDate() ||
    now.getMonth() !== lastSpin.getMonth() ||
    now.getFullYear() !== lastSpin.getFullYear()
  );
}

/**
 * Calcula tempo até próximo spin
 */
export function getTimeUntilNextSpin(lastSpinDate: Date | null): number {
  if (!lastSpinDate || canSpinToday(lastSpinDate)) return 0;

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return tomorrow.getTime() - now.getTime();
}

/**
 * Formata tempo restante
 */
export function formatTimeRemaining(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Retorna cor da raridade
 */
export function getRarityColor(rarity: SpinReward['rarity']): string {
  const colors = {
    common: '#9E9E9E',
    uncommon: '#5D8AA8',
    rare: '#4169E1',
    epic: '#9B30FF',
    legendary: '#FFD700',
  };
  return colors[rarity];
}

/**
 * Retorna mensagem de raridade
 */
export function getRarityMessage(rarity: SpinReward['rarity']): string {
  const messages = {
    common: 'Uma recompensa útil!',
    uncommon: 'Uma boa recompensa!',
    rare: 'Uma recompensa rara!',
    epic: 'UMA RECOMPENSA ÉPICA!',
    legendary: '🎉 RECOMPENSA LENDÁRIA! 🎉',
  };
  return messages[rarity];
}

