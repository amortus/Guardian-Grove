/**
 * Game API
 * Guardian Grove Frontend
 */

import { apiClient } from './client';
import type { ApiResponse, GameSaveDTO, BeastDTO } from '../../../shared/types';

export const gameApi = {
  /**
   * Initialize new game
   */
  async initializeGame(playerName: string): Promise<ApiResponse<{ gameSave: GameSaveDTO; initialBeast: BeastDTO | null }>> {
    return apiClient.post('/game/initialize', { playerName });
  },

  /**
   * Get current game save
   */
  async getGameSave(): Promise<ApiResponse<{
    gameSave: GameSaveDTO;
    beasts: BeastDTO[];
    inventory: any[];
    quests: any[];
    achievements: any[];
  }>> {
    return apiClient.get('/game/save');
  },

  /**
   * Update game save
   */
  async updateGameSave(data: Partial<GameSaveDTO>): Promise<ApiResponse<GameSaveDTO>> {
    return apiClient.put('/game/save', data);
  },

  /**
   * Update beast data
   */
  async updateBeast(beastId: string, beastData: any): Promise<ApiResponse<BeastDTO>> {
    return apiClient.put(`/game/beast/${beastId}`, beastData);
  },

  /**
   * Select the initial guardian for the player
   */
  async createInitialBeast(line: string, name: string): Promise<ApiResponse<BeastDTO>> {
    return apiClient.post('/game/beast', { line, name });
  },

  /**
   * Get server time (Brasília timezone)
   */
  async getServerTime(): Promise<number> {
    const response = await apiClient.get('/game/time');
    return response.data?.timestamp || Date.now();
  },

  /**
   * Start a timed action for a beast
   */
  async startBeastAction(beastId: string, actionType: string, duration: number, completesAt: number): Promise<ApiResponse<any>> {
    return apiClient.post(`/game/beast/${beastId}/action/start`, {
      actionType,
      duration,
      completesAt,
    });
  },

  /**
   * Complete a beast action
   */
  async completeBeastAction(beastId: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/game/beast/${beastId}/action/complete`, {});
  },

  /**
   * Cancel a beast action
   */
  async cancelBeastAction(beastId: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/game/beast/${beastId}/action/cancel`, {});
  },

  /**
   * Process daily cycle for a beast (increment age at midnight)
   */
  async processDailyCycle(beastId: string): Promise<ApiResponse<{
    ageInDays: number;
    isAlive: boolean;
    processed: boolean;
    died?: boolean;
  }>> {
    return apiClient.post(`/game/beast/${beastId}/daily-cycle`, {});
  },

  // ===== INVENTORY API =====

  /**
   * Get player's inventory
   */
  async getInventory(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/inventory');
  },

  /**
   * Add item to inventory
   */
  async addInventoryItem(itemId: string, quantity: number): Promise<ApiResponse<any>> {
    return apiClient.post('/inventory/add', { itemId, quantity });
  },

  /**
   * Remove item from inventory
   */
  async removeInventoryItem(itemId: string, quantity: number): Promise<ApiResponse<any>> {
    return apiClient.post('/inventory/remove', { itemId, quantity });
  },

  // ===== PROGRESS API (QUESTS/ACHIEVEMENTS) =====

  /**
   * Get player's progress (quests + achievements)
   */
  async getProgress(): Promise<ApiResponse<{ quests: any[]; achievements: any[] }>> {
    return apiClient.get('/progress');
  },

  /**
   * Save quest progress
   */
  async saveQuestProgress(questId: string, progress: any, isCompleted: boolean, isActive: boolean): Promise<ApiResponse<any>> {
    return apiClient.post('/progress/quest', { questId, progress, isCompleted, isActive });
  },

  /**
   * Save achievement progress
   */
  async saveAchievementProgress(achievementId: string, progress: number, unlocked: boolean): Promise<ApiResponse<any>> {
    return apiClient.post('/progress/achievement', { achievementId, progress, unlocked });
  },

  /**
   * Hub Ghost System - Save player position
   */
  async saveHubPosition(x: number, y: number, z: number): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post('/hub/position', { x, y, z });
  },

  /**
   * Hub Ghost System - Get recent visitors
   */
  async getRecentVisitors(limit = 5): Promise<ApiResponse<{ 
    visitors: Array<{
      playerName: string;
      beastLine: string;
      position: { x: number; y: number; z: number };
      timestamp: string;
    }>
  }>> {
    return apiClient.get(`/hub/recent-visitors?limit=${limit}`);
  },
  
  // ===== SKIN SYSTEM =====
  
  /**
   * Get player's skins
   */
  async getSkins(): Promise<ApiResponse<{ ownedSkins: string[]; activeSkinId: string }>> {
    return apiClient.get('/skins');
  },
  
  /**
   * Purchase a skin
   */
  async purchaseSkin(skinId: string): Promise<ApiResponse<{ newBalance: number }>> {
    return apiClient.post('/skins/purchase', { skinId });
  },
  
  /**
   * Change active skin
   */
  async changeSkin(skinId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post('/skins/change', { skinId });
  },
  
  /**
   * Save game state (placeholder for now)
   */
  async saveGameState(gameState: any): Promise<ApiResponse<any>> {
    // TODO: Implementar sincronização completa do gameState
    console.log('[GameAPI] Salvando gameState (placeholder):', gameState);
    return { success: true, data: {}, error: '' };
  },
};

