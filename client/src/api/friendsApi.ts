/**
 * Friends API Client
 * Guardian Grove Client
 */

import { apiClient } from './client';
import type { ApiResponse, Friend, FriendRequest } from '../types';

export const friendsApi = {
  /**
   * Listar amigos aceitos
   */
  async getFriends(): Promise<ApiResponse<Friend[]>> {
    return apiClient.get<Friend[]>('/friends');
  },

  /**
   * Listar pedidos de amizade (enviados e recebidos)
   */
  async getRequests(): Promise<ApiResponse<FriendRequest[]>> {
    return apiClient.get<FriendRequest[]>('/friends/requests');
  },

  /**
   * Enviar pedido de amizade
   */
  async sendRequest(username: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/friends/request', { username });
  },

  /**
   * Aceitar pedido de amizade
   */
  async acceptRequest(friendId: number): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`/friends/accept/${friendId}`, {});
  },

  /**
   * Remover amigo ou rejeitar pedido
   */
  async removeFriend(friendId: number): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete<void>(`/friends/${friendId}`);
    } catch (error: any) {
      // Se for 404, retornar resposta de erro ao invés de lançar exceção
      // Isso permite que o código cliente trate como "já foi processado"
      if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('Friendship not found')) {
        return {
          success: false,
          error: 'Friendship not found'
        } as ApiResponse<void>;
      }
      // Re-lançar outros erros
      throw error;
    }
  },

  /**
   * Listar amigos online
   */
  async getOnlineFriends(): Promise<ApiResponse<Friend[]>> {
    return apiClient.get<Friend[]>('/friends/online');
  },
};

