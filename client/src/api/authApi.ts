/**
 * Auth API
 * Guardian Grove Frontend
 */

import { apiClient } from './client';
import type { ApiResponse, AuthResponse, User } from '../../../shared/types';

export const authApi = {
  /**
   * Register new user
   */
  async register(email: string, password: string, displayName: string): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post('/auth/register', { email, password, displayName });
  },

  /**
   * Login with email/password
   */
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post('/auth/login', { email, password });
  },

  /**
   * Get current user
   */
  async getMe(): Promise<ApiResponse<User>> {
    return apiClient.get('/auth/me');
  },

  /**
   * Logout
   */
  async logout(): Promise<ApiResponse> {
    return apiClient.post('/auth/logout');
  },

  /**
   * Initiate Google OAuth
   */
  googleLogin(): void {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    // Redirecionar diretamente - o servidor retornará erro 503 se não configurado
    // e o callback tratará o erro via URL parameter
    window.location.href = `${API_BASE_URL}/auth/google`;
  },
};

