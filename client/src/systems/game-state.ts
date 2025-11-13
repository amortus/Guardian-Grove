/**
 * Gerenciamento do estado global do jogo
 */

import type { GameState, Beast, BeastLine } from '../types';
import { createBeast } from './beast';
import { save as saveToStorage, load as loadFromStorage } from '../storage';
import { AVAILABLE_QUESTS } from './quests';
import { ACHIEVEMENTS } from './achievements';

/**
 * Cria um novo estado de jogo
 */
export const STARTER_CONFIG: Array<{ line: BeastLine; name: string }> = [
  { line: 'feralis', name: 'Feralis' },
  { line: 'mirella', name: 'Mirella' },
  { line: 'olgrim', name: 'Olgrim' },
  { line: 'raukor', name: 'Raukor' },
  { line: 'sylphid', name: 'Sylphid' },
  { line: 'ignar', name: 'Ignar' },
  { line: 'terravox', name: 'Terravox' },
];

export function createNewGame(playerName: string): GameState {
  const defaultStarter = STARTER_CONFIG[0];
  const firstBeast = createBeast(defaultStarter.line, defaultStarter.name, 0);

  const gameState: GameState = {
    // Sistema de tempo real
    serverTime: Date.now(),
    lastSync: Date.now(),
    currentWeek: 1,
    year: 1,
    guardian: {
      name: playerName,
      level: 1,
      title: 'Guardião Iniciante',
      reputation: 0,
      bronzeWins: 0,
      silverWins: 0,
      goldWins: 0,
      mythicWins: 0,
      ranchUpgrades: [],
      maxBeasts: 1,
    },
    
    ranch: {
      beasts: [firstBeast],
      maxBeasts: 1,
      upgrades: [],
    },
    
    activeBeast: firstBeast,
    needsAvatarSelection: true,
    
    economy: {
      coronas: 500,
      ecoCrystals: 0,
    },
    
    inventory: [],
    
    npcs: [], // NPCs are now managed globally in data/npcs.ts
    
    quests: [...AVAILABLE_QUESTS], // Initialize with all quests
    achievements: [...ACHIEVEMENTS], // Initialize with all achievements
    winStreak: 0,
    loseStreak: 0,
    totalTrains: 0,
    totalCrafts: 0,
    totalSpent: 0,
    
    // NOVO: Sistema de Dungeons
    dungeonProgress: {},
    
    unlockedLines: STARTER_CONFIG.map((config) => config.line),
    unlockedFeatures: [],
    discoveredRelics: [],
    deceasedBeasts: [],
    victories: 0,
    defeats: 0,
  };

  return gameState;
}

/**
 * Salva o estado do jogo
 */
export async function saveGame(state: GameState): Promise<void> {
  try {
    // Save locally first (for offline support)
    await saveToStorage('beast_keepers_save', state);
    
    // Check if user is authenticated (has token)
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      // Import gameApi here to avoid circular dependency
      const { gameApi } = await import('../api/gameApi');
      
      // Save game save data to server
      await gameApi.updateGameSave({
        week: state.currentWeek,
        coronas: state.economy.coronas,
        victories: state.guardian.victories,
        current_title: state.guardian.title,
        win_streak: state.winStreak,
        lose_streak: state.loseStreak,
        total_trains: state.totalTrains,
        total_crafts: state.totalCrafts,
        total_spent: state.totalSpent
      });
      
      // Save active beast data to server
      if (state.activeBeast) {
        const beast = state.activeBeast;
        
        // Extract technique IDs from full technique objects
        const techniqueIds = beast.techniques.map((tech: any) => 
          typeof tech === 'string' ? tech : tech.id
        );
        
        await gameApi.updateBeast(beast.id, {
          name: beast.name,
          currentHp: beast.currentHp,
          maxHp: beast.maxHp,
          essence: beast.essence,
          maxEssence: beast.maxEssence,
          attributes: beast.attributes,
          secondaryStats: beast.secondaryStats,
          level: beast.level,
          experience: beast.experience,
          techniques: techniqueIds,
          traits: beast.traits,
          elixirUsage: beast.elixirUsage,
          currentAction: beast.currentAction,
          lastExploration: beast.lastExploration,
          lastTournament: beast.lastTournament,
          explorationCount: beast.explorationCount,
          birthDate: beast.birthDate,
          lastUpdate: beast.lastUpdate,
          workBonusCount: beast.workBonusCount,
          ageInDays: beast.ageInDays,
          lastDayProcessed: beast.lastDayProcessed
        });
      }
      
      console.log('[Save] Jogo salvo com sucesso (local + servidor)');
    } else {
      console.log('[Save] Jogo salvo localmente (não autenticado)');
    }
  } catch (error) {
    console.error('[Save] Erro ao salvar:', error);
    throw error;
  }
}

/**
 * Carrega o estado do jogo
 */
export async function loadGame(): Promise<GameState | null> {
  try {
    const state = await loadFromStorage<GameState>('beast_keepers_save');
    if (state) {
      console.log('[Save] Jogo carregado com sucesso');
    }
    return state;
  } catch (error) {
    console.error('[Save] Erro ao carregar:', error);
    return null;
  }
}

/**
 * Adiciona dinheiro ao jogador
 */
export function addMoney(state: GameState, amount: number) {
  state.economy.coronas += amount;
}

/**
 * Remove dinheiro do jogador
 */
export function removeMoney(state: GameState, amount: number): boolean {
  if (state.economy.coronas >= amount) {
    state.economy.coronas -= amount;
    return true;
  }
  return false;
}

/**
 * Salva progresso de quests e achievements no servidor
 * Chamado automaticamente após eventos que mudam progresso
 */
export async function saveProgressToServer(state: GameState): Promise<void> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    
    const { gameApi } = await import('../api/gameApi');
    
    // Salvar quests que têm progresso ou foram completadas
    for (const quest of state.quests) {
      if (quest.progress > 0 || quest.isCompleted) {
        try {
          await gameApi.saveQuestProgress(
            quest.id,
            quest.goal,
            quest.isCompleted,
            quest.isActive
          );
        } catch (error) {
          console.error(`[Progress] Failed to save quest ${quest.id}:`, error);
        }
      }
    }
    
    // Salvar achievements que têm progresso ou foram desbloqueadas
    for (const achievement of state.achievements) {
      if (achievement.progress > 0 || achievement.isUnlocked) {
        try {
          await gameApi.saveAchievementProgress(
            achievement.id,
            achievement.requirement.current,
            achievement.isUnlocked
          );
        } catch (error) {
          console.error(`[Progress] Failed to save achievement ${achievement.id}:`, error);
        }
      }
    }
    
    console.log('[Progress] Saved to server successfully');
  } catch (error) {
    console.error('[Progress] Failed to save progress to server:', error);
  }
}

/**
 * Avança uma semana no calendário
 */
export function advanceGameWeek(state: GameState) {
  state.currentWeek++;
  
  // Calcula ano (52 semanas = 1 ano)
  state.year = Math.floor((state.currentWeek - 1) / 52) + 1;
}

/**
 * Adiciona nova besta ao rancho
 */
export function addBeast(state: GameState, line: BeastLine, name: string): Beast | null {
  if (state.ranch.beasts.length >= state.guardian.maxBeasts) {
    return null;
  }

  const newBeast = createBeast(line, name, state.currentWeek);
  state.ranch.beasts.push(newBeast);
  
  if (!state.activeBeast) {
    state.activeBeast = newBeast;
  }
  
  return newBeast;
}

/**
 * Define besta ativa
 */
export function setActiveBeast(state: GameState, beastId: string) {
  const beast = state.ranch.beasts.find(b => b.id === beastId);
  if (beast) {
    state.activeBeast = beast;
  }
}

/**
 * Remove besta (morte ou liberação)
 */
export function removeBeast(state: GameState, beastId: string) {
  const index = state.ranch.beasts.findIndex(b => b.id === beastId);
  if (index !== -1) {
    const [beast] = state.ranch.beasts.splice(index, 1);
    state.deceasedBeasts.push(beast);
    
    if (state.activeBeast?.id === beastId) {
      state.activeBeast = state.ranch.beasts[0] || null;
    }
  }
}

