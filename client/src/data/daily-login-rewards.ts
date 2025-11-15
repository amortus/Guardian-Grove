/**
 * Sistema de Recompensas de Login Diário - Guardian Grove
 */

export interface DailyLoginReward {
  day: number;
  rewards: {
    coronas?: number;
    xp?: number;
    items?: Array<{ id: string; name: string; quantity: number; icon: string }>;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  claimed: boolean;
}

export const DAILY_LOGIN_REWARDS: DailyLoginReward[] = [
  {
    day: 1,
    rewards: { coronas: 100, xp: 50 },
    rarity: 'common',
    claimed: false,
  },
  {
    day: 2,
    rewards: { coronas: 150, xp: 75, items: [{ id: 'seed_pack', name: 'Pacote de Sementes', quantity: 3, icon: '🌱' }] },
    rarity: 'common',
    claimed: false,
  },
  {
    day: 3,
    rewards: { coronas: 250, xp: 100, items: [{ id: 'training_manual', name: 'Manual de Treino', quantity: 1, icon: '📖' }] },
    rarity: 'rare',
    claimed: false,
  },
  {
    day: 4,
    rewards: { coronas: 300, xp: 150, items: [{ id: 'mystery_box', name: 'Caixa Misteriosa', quantity: 1, icon: '📦' }] },
    rarity: 'rare',
    claimed: false,
  },
  {
    day: 5,
    rewards: { coronas: 500, xp: 200, items: [{ id: 'rare_crystal', name: 'Cristal Raro', quantity: 2, icon: '💎' }] },
    rarity: 'epic',
    claimed: false,
  },
  {
    day: 6,
    rewards: { coronas: 750, xp: 300, items: [{ id: 'ancient_scroll', name: 'Pergaminho Antigo', quantity: 1, icon: '📜' }] },
    rarity: 'epic',
    claimed: false,
  },
  {
    day: 7,
    rewards: { 
      coronas: 1500, 
      xp: 500, 
      items: [
        { id: 'legendary_chest', name: 'Baú Lendário', quantity: 1, icon: '🎁' },
        { id: 'guardian_essence', name: 'Essência do Guardião', quantity: 5, icon: '✨' },
      ]
    },
    rarity: 'legendary',
    claimed: false,
  },
];

export interface DailyLoginState {
  currentDay: number;
  lastLoginDate: string;
  totalLogins: number;
  rewards: DailyLoginReward[];
}

export function getDailyLoginState(): DailyLoginState {
  const saved = localStorage.getItem('guardian_grove_daily_login');
  
  if (saved) {
    const state: DailyLoginState = JSON.parse(saved);
    
    // Verifica se é um novo dia
    const today = new Date().toDateString();
    if (state.lastLoginDate !== today) {
      // Novo dia!
      const yesterday = new Date(state.lastLoginDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - yesterday.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Login consecutivo
        state.currentDay = Math.min(state.currentDay + 1, 7);
      } else if (diffDays > 1) {
        // Quebrou a sequência
        state.currentDay = 1;
        state.rewards = DAILY_LOGIN_REWARDS.map(r => ({ ...r, claimed: false }));
      }
      
      state.lastLoginDate = today;
      state.totalLogins++;
      saveDailyLoginState(state);
    }
    
    return state;
  }
  
  // Primeira vez
  return {
    currentDay: 1,
    lastLoginDate: new Date().toDateString(),
    totalLogins: 1,
    rewards: DAILY_LOGIN_REWARDS.map(r => ({ ...r, claimed: false })),
  };
}

export function claimDailyReward(day: number): DailyLoginReward | null {
  const state = getDailyLoginState();
  
  if (day !== state.currentDay) return null;
  if (state.rewards[day - 1].claimed) return null;
  
  state.rewards[day - 1].claimed = true;
  saveDailyLoginState(state);
  
  return state.rewards[day - 1];
}

export function canClaimToday(): boolean {
  const state = getDailyLoginState();
  return !state.rewards[state.currentDay - 1].claimed;
}

export function saveDailyLoginState(state: DailyLoginState) {
  localStorage.setItem('guardian_grove_daily_login', JSON.stringify(state));
}

export function getRarityColor(rarity: DailyLoginReward['rarity']): string {
  switch (rarity) {
    case 'common': return '#B7DDCD';
    case 'rare': return '#6DC7A4';
    case 'epic': return '#FFC857';
    case 'legendary': return '#FFD700';
  }
}

