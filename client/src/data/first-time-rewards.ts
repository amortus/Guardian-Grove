/**
 * Sistema de Recompensas de Primeira Vez - Guardian Grove
 * Incentiva jogadores a experimentarem todos os sistemas
 */

export interface FirstTimeReward {
  id: string;
  name: string;
  description: string;
  icon: string;
  rewards: {
    coronas: number;
    xp: number;
    items?: Array<{ id: string; name: string; quantity: number; icon: string }>;
  };
  claimed: boolean;
}

export const FIRST_TIME_REWARDS: FirstTimeReward[] = [
  {
    id: 'first_exploration',
    name: 'Primeira Exploração',
    description: 'Complete sua primeira exploração na Trilha da Descoberta',
    icon: '🗺️',
    rewards: { coronas: 200, xp: 100, items: [{ id: 'explorer_badge', name: 'Medalha de Explorador', quantity: 1, icon: '🎖️' }] },
    claimed: false,
  },
  {
    id: 'first_craft',
    name: 'Primeiro Artesanato',
    description: 'Crafte seu primeiro item na oficina',
    icon: '🔨',
    rewards: { coronas: 150, xp: 75, items: [{ id: 'crafting_tools', name: 'Ferramentas Básicas', quantity: 1, icon: '🛠️' }] },
    claimed: false,
  },
  {
    id: 'first_minigame',
    name: 'Primeiro Mini-Game',
    description: 'Complete qualquer mini-game',
    icon: '🎮',
    rewards: { coronas: 100, xp: 50 },
    claimed: false,
  },
  {
    id: 'first_mission',
    name: 'Primeira Missão',
    description: 'Complete sua primeira missão educativa',
    icon: '📚',
    rewards: { coronas: 150, xp: 100, items: [{ id: 'wisdom_scroll', name: 'Pergaminho da Sabedoria', quantity: 1, icon: '📜' }] },
    claimed: false,
  },
  {
    id: 'first_shop_purchase',
    name: 'Primeira Compra',
    description: 'Compre algo no mercado',
    icon: '🛒',
    rewards: { coronas: 100, xp: 50, items: [{ id: 'merchant_coupon', name: 'Cupom 10% OFF', quantity: 1, icon: '🎟️' }] },
    claimed: false,
  },
  {
    id: 'first_daily_spin',
    name: 'Primeira Roleta',
    description: 'Gire a roleta diária',
    icon: '🎰',
    rewards: { coronas: 200, xp: 75 },
    claimed: false,
  },
  {
    id: 'first_achievement',
    name: 'Primeira Conquista',
    description: 'Desbloqueie qualquer conquista',
    icon: '🏆',
    rewards: { coronas: 250, xp: 150, items: [{ id: 'achievement_frame', name: 'Moldura Dourada', quantity: 1, icon: '🖼️' }] },
    claimed: false,
  },
  {
    id: 'first_chat_message',
    name: 'Primeira Mensagem',
    description: 'Envie uma mensagem no chat',
    icon: '💬',
    rewards: { coronas: 50, xp: 25 },
    claimed: false,
  },
  {
    id: 'first_settings_change',
    name: 'Personalização',
    description: 'Ajuste as configurações do jogo',
    icon: '⚙️',
    rewards: { coronas: 50, xp: 25 },
    claimed: false,
  },
  {
    id: 'first_help_menu',
    name: 'Busca por Conhecimento',
    description: 'Abra o menu de ajuda',
    icon: '📱',
    rewards: { coronas: 50, xp: 25 },
    claimed: false,
  },
];

export interface FirstTimeState {
  rewards: FirstTimeReward[];
  totalClaimed: number;
}

export function getFirstTimeState(): FirstTimeState {
  const saved = localStorage.getItem('guardian_grove_first_time_rewards');
  
  if (saved) {
    return JSON.parse(saved);
  }
  
  return {
    rewards: FIRST_TIME_REWARDS.map(r => ({ ...r, claimed: false })),
    totalClaimed: 0,
  };
}

export function claimFirstTimeReward(rewardId: string): FirstTimeReward | null {
  const state = getFirstTimeState();
  const reward = state.rewards.find(r => r.id === rewardId);
  
  if (!reward || reward.claimed) return null;
  
  reward.claimed = true;
  state.totalClaimed++;
  
  saveFirstTimeState(state);
  return reward;
}

export function checkAndClaimFirstTime(rewardId: string): FirstTimeReward | null {
  const state = getFirstTimeState();
  const reward = state.rewards.find(r => r.id === rewardId);
  
  if (reward && !reward.claimed) {
    return claimFirstTimeReward(rewardId);
  }
  
  return null;
}

export function hasUnclaimedRewards(): boolean {
  const state = getFirstTimeState();
  return state.rewards.some(r => !r.claimed);
}

export function saveFirstTimeState(state: FirstTimeState) {
  localStorage.setItem('guardian_grove_first_time_rewards', JSON.stringify(state));
}

