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
    id: 'basic_food',
    name: 'Ração Básica',
    icon: '🥣',
    type: 'item',
    value: 'basic_food',
    rarity: 'common',
    weight: 10,
    color: '#7CB342',
  },
  {
    id: 'vital_fruit',
    name: 'Fruta Vital',
    icon: '🍇',
    type: 'item',
    value: 'vital_fruit',
    rarity: 'common',
    weight: 10,
    color: '#98C1D9',
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
    id: 'training_weights',
    name: 'Pesos de Treino',
    icon: '🏋️',
    type: 'item',
    value: 'training_weights',
    rarity: 'uncommon',
    weight: 6,
    color: '#6B9A9F',
  },
  {
    id: 'focus_charm_reward',
    name: 'Talismã de Foco',
    icon: '🧿',
    type: 'item',
    value: 'focus_charm',
    rarity: 'uncommon',
    weight: 4,
    color: '#5FA3A2',
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
    id: 'ancient_relic_reward',
    name: 'Relíquia Antiga',
    icon: '🗿',
    type: 'rare_item',
    value: 'ancient_relic',
    rarity: 'rare',
    weight: 2,
    color: '#4A6FE1',
  },
  {
    id: 'essence_crystal_reward',
    name: 'Cristal de Essência',
    icon: '🔮',
    type: 'rare_item',
    value: 'essence_crystal',
    rarity: 'rare',
    weight: 2,
    color: '#3F63C5',
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
    id: 'legendary_crystal_reward',
    name: 'Cristal Lendário',
    icon: '💎',
    type: 'rare_item',
    value: 'legendary_crystal',
    rarity: 'epic',
    weight: 0.35,
    color: '#9020EF',
  },
  {
    id: 'elixir_vitality_reward',
    name: 'Elixir Vital',
    icon: '🧪',
    type: 'rare_item',
    value: 'elixir_vitality',
    rarity: 'epic',
    weight: 0.25,
    color: '#8A2BE2',
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
    id: 'divine_elixir_reward',
    name: 'Elixir Divino',
    icon: '👑',
    type: 'legendary_item',
    value: 'divine_elixir_item',
    rarity: 'legendary',
    weight: 0.15,
    color: '#FFB700',
  },
  {
    id: 'immortality_elixir_reward',
    name: 'Elixir da Imortalidade',
    icon: '🕊️',
    type: 'legendary_item',
    value: 'immortality_elixir_item',
    rarity: 'legendary',
    weight: 0.1,
    color: '#FFD54F',
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

