/**
 * Sistema de Rastreamento de Estatísticas
 */

export interface StatsTracker {
  totalDefeats: number;
  longestStreak: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalHealing: number;
  criticalHits: number;
  perfectWins: number; // Vitórias sem tomar dano
  comebackWins: number; // Vitórias com menos de 10% HP
  techniqueUsage: Record<string, number>;
  favoriteElement: string;
  totalPlayTime: number; // em ms
  lastLoginDate: string;
  loginStreak: number;
}

/**
 * Inicializa rastreamento de stats
 */
export function initializeStatsTracker(): StatsTracker {
  return {
    totalDefeats: 0,
    longestStreak: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    totalHealing: 0,
    criticalHits: 0,
    perfectWins: 0,
    comebackWins: 0,
    techniqueUsage: {},
    favoriteElement: '',
    totalPlayTime: 0,
    lastLoginDate: new Date().toISOString().split('T')[0],
    loginStreak: 1,
  };
}

/**
 * Atualiza stats após batalha
 */
export function updateBattleStats(
  tracker: StatsTracker,
  victory: boolean,
  damageDealt: number,
  damageTaken: number,
  hadCritical: boolean,
  hadPerfectWin: boolean,
  hadComebackWin: boolean
): StatsTracker {
  if (!victory) {
    tracker.totalDefeats += 1;
  }
  
  tracker.totalDamageDealt += damageDealt;
  tracker.totalDamageTaken += damageTaken;
  
  if (hadCritical) {
    tracker.criticalHits += 1;
  }
  
  if (hadPerfectWin) {
    tracker.perfectWins += 1;
  }
  
  if (hadComebackWin) {
    tracker.comebackWins += 1;
  }
  
  return tracker;
}

/**
 * Atualiza técnica mais usada
 */
export function trackTechniqueUsage(
  tracker: StatsTracker,
  techniqueId: string
): StatsTracker {
  if (!tracker.techniqueUsage[techniqueId]) {
    tracker.techniqueUsage[techniqueId] = 0;
  }
  tracker.techniqueUsage[techniqueId] += 1;
  return tracker;
}

/**
 * Obtém técnica mais usada
 */
export function getMostUsedTechnique(tracker: StatsTracker): {
  id: string;
  count: number;
} | null {
  const entries = Object.entries(tracker.techniqueUsage);
  if (entries.length === 0) return null;
  
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  return {
    id: sorted[0][0],
    count: sorted[0][1],
  };
}

/**
 * Atualiza login streak
 */
export function updateLoginStreak(tracker: StatsTracker): StatsTracker {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  if (tracker.lastLoginDate === yesterday) {
    tracker.loginStreak += 1;
  } else if (tracker.lastLoginDate !== today) {
    tracker.loginStreak = 1;
  }
  
  tracker.lastLoginDate = today;
  
  return tracker;
}

