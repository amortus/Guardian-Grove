/**
 * Friends UI
 * Interface de lista de amigos retrátil no canto inferior direito
 * Guardian Grove Client
 */

import type { Friend, FriendRequest } from '../types';
import { friendsApi } from '../api/friendsApi';
import { showGameError } from './message-service';

export class FriendsUI {
  private container: HTMLDivElement;
  private isExpanded: boolean = false;
  private activeTab: 'list' | 'requests' | 'add' = 'list';
  private friends: Friend[] = [];
  private onlineFriends: Set<string> = new Set();
  private requests: FriendRequest[] = [];
  private addFriendInput: string = '';
  
  public onWhisperFriend?: (friendName: string) => void;
  
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'friends-ui-container';
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 350px;
      height: 40px;
      background: rgba(15, 15, 30, 0.95);
      border: 2px solid #4a5568;
      border-radius: 8px;
      z-index: 9999;
      overflow: hidden;
      transition: height 0.3s ease;
      font-family: monospace;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      max-height: calc(100vh - 100px);
    `;
    document.body.appendChild(this.container);
    
    this.setupEventListeners();
    this.loadFriends();
    this.loadRequests();
    this.render();
  }

  private clickHandler = (e: MouseEvent) => {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    
    // Toggle expand/collapse
    const header = target.closest('.friends-header');
    if (header && !target.classList.contains('friends-tab')) {
      const isInput = target.tagName === 'INPUT';
      if (!isInput) {
        this.toggle();
        return;
      }
    }

    // Tab navigation
    if (target.classList.contains('friends-tab')) {
      const tab = target.getAttribute('data-tab') as 'list' | 'requests' | 'add';
      if (tab) {
        this.activeTab = tab;
        this.render();
      }
      return;
    }

    // Whisper button
    if (target.classList.contains('friends-whisper-btn')) {
      const friendName = target.getAttribute('data-friend');
      if (friendName && this.onWhisperFriend) {
        this.onWhisperFriend(friendName);
        this.toggle(); // Fechar após abrir whisper
      }
      return;
    }

    // Accept request
    if (target.classList.contains('friends-accept-btn')) {
      const friendId = parseInt(target.getAttribute('data-friend-id') || '0');
      if (friendId) {
        this.acceptRequest(friendId);
      }
      return;
    }

    // Reject request
    if (target.classList.contains('friends-reject-btn')) {
      const friendId = parseInt(target.getAttribute('data-friend-id') || '0');
      if (friendId) {
        this.rejectRequest(friendId);
      }
      return;
    }

    // Remove friend
    if (target.classList.contains('friends-remove-btn')) {
      const friendId = parseInt(target.getAttribute('data-friend-id') || '0');
      if (friendId) {
        if (confirm('Remover este amigo?')) {
          this.removeFriend(friendId);
        }
      }
      return;
    }

    // Cancel request
    if (target.classList.contains('friends-cancel-btn')) {
      const friendId = parseInt(target.getAttribute('data-friend-id') || '0');
      if (friendId) {
        this.rejectRequest(friendId);
      }
      return;
    }

    // Add friend button
    if (target.classList.contains('friends-add-btn')) {
      const input = this.container.querySelector('.friends-add-input') as HTMLInputElement;
      if (input && input.value.trim()) {
        this.sendFriendRequest(input.value.trim());
        input.value = '';
        this.addFriendInput = '';
      }
      return;
    }
  };

  private keydownHandler = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('friends-add-input') && e.key === 'Enter') {
      e.preventDefault();
      const input = target as HTMLInputElement;
      if (input.value.trim()) {
        this.sendFriendRequest(input.value.trim());
        input.value = '';
        this.addFriendInput = '';
      }
    }
  };

  private inputHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('friends-add-input')) {
      this.addFriendInput = (target as HTMLInputElement).value;
    }
  };

  private setupEventListeners(): void {
    this.container.removeEventListener('click', this.clickHandler);
    this.container.removeEventListener('keydown', this.keydownHandler);
    this.container.removeEventListener('input', this.inputHandler);
    
    this.container.addEventListener('click', this.clickHandler);
    this.container.addEventListener('keydown', this.keydownHandler);
    this.container.addEventListener('input', this.inputHandler);
  }

  public toggle(): void {
    this.isExpanded = !this.isExpanded;
    this.container.style.height = this.isExpanded ? '500px' : '40px';
    this.render();
  }

  public updateOnlineStatus(username: string, isOnline: boolean): void {
    if (isOnline) {
      this.onlineFriends.add(username);
    } else {
      this.onlineFriends.delete(username);
    }
    
    // Atualizar estado dos amigos
    this.friends.forEach(friend => {
      if (friend.friendName === username) {
        friend.isOnline = isOnline;
      }
    });
    
    this.render();
  }

  public async loadFriends(): Promise<void> {
    try {
      const response = await friendsApi.getFriends();
      if (response.success && response.data) {
        this.friends = response.data.map(f => ({
          ...f,
          isOnline: this.onlineFriends.has(f.friendName),
        }));
        this.render();
      }
    } catch (error) {
      console.error('[FriendsUI] Error loading friends:', error);
    }
  }

  public async loadRequests(): Promise<void> {
    try {
      const response = await friendsApi.getRequests();
      if (response.success && response.data) {
        this.requests = response.data;
        this.render();
      }
    } catch (error) {
      console.error('[FriendsUI] Error loading requests:', error);
    }
  }

  public async sendFriendRequest(username: string): Promise<void> {
    try {
      const response = await friendsApi.sendRequest(username);
      if (response.success) {
        await this.loadRequests();
        this.render();
      } else {
        showGameError(response.error || 'Erro ao enviar pedido');
      }
    } catch (error: any) {
      showGameError(error.message || 'Erro ao enviar pedido');
    }
  }

  public async acceptRequest(friendId: number): Promise<void> {
    try {
      const response = await friendsApi.acceptRequest(friendId);
      if (response.success) {
        await this.loadFriends();
        await this.loadRequests();
        this.render();
      }
    } catch (error) {
      console.error('[FriendsUI] Error accepting request:', error);
    }
  }

  public async rejectRequest(friendId: number): Promise<void> {
    try {
      const response = await friendsApi.removeFriend(friendId);
      if (response.success) {
        await this.loadRequests();
        this.render();
      }
    } catch (error) {
      console.error('[FriendsUI] Error rejecting request:', error);
    }
  }

  public async removeFriend(friendId: number): Promise<void> {
    try {
      const response = await friendsApi.removeFriend(friendId);
      if (response.success) {
        await this.loadFriends();
        this.render();
      }
    } catch (error) {
      console.error('[FriendsUI] Error removing friend:', error);
    }
  }

  private render(): void {
    const onlineCount = this.friends.filter(f => f.isOnline).length;
    
    this.container.innerHTML = `
      <!-- Header -->
      <div class="friends-header" style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 10px;
        background: rgba(26, 32, 44, 0.95);
        border-bottom: 1px solid #4a5568;
        cursor: pointer;
        user-select: none;
        min-height: 40px;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="color: #fff; font-weight: bold;">👥 Amigos</span>
          ${this.isExpanded ? `<span style="color: #888; font-size: 10px;">${onlineCount} online</span>` : ''}
        </div>
        <div style="
          color: #fff;
          cursor: pointer;
          font-size: 16px;
          padding: 5px 10px;
          user-select: none;
        ">${this.isExpanded ? '▼' : '▲'}</div>
      </div>

      ${this.isExpanded ? `
        <!-- Tabs -->
        <div style="
          display: flex;
          gap: 2px;
          padding: 5px;
          background: rgba(15, 15, 30, 0.9);
          border-bottom: 1px solid #4a5568;
        ">
          <div class="friends-tab" data-tab="list" style="
            padding: 5px 10px;
            background: ${this.activeTab === 'list' ? 'rgba(74, 85, 104, 0.8)' : 'rgba(45, 55, 72, 0.6)'};
            color: #fff;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
          ">Lista</div>
          <div class="friends-tab" data-tab="requests" style="
            padding: 5px 10px;
            background: ${this.activeTab === 'requests' ? 'rgba(74, 85, 104, 0.8)' : 'rgba(45, 55, 72, 0.6)'};
            color: ${this.requests.length > 0 ? '#ff6b6b' : '#fff'};
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
          ">Pedidos${this.requests.length > 0 ? ` (${this.requests.length})` : ''}</div>
          <div class="friends-tab" data-tab="add" style="
            padding: 5px 10px;
            background: ${this.activeTab === 'add' ? 'rgba(74, 85, 104, 0.8)' : 'rgba(45, 55, 72, 0.6)'};
            color: #fff;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
          ">Adicionar</div>
        </div>

        <!-- Content -->
        <div style="
          height: 400px;
          overflow-y: auto;
          padding: 10px;
          background: rgba(0, 0, 0, 0.3);
        ">
          ${this.activeTab === 'list' ? this.renderFriendsList() : ''}
          ${this.activeTab === 'requests' ? this.renderRequestsList() : ''}
          ${this.activeTab === 'add' ? this.renderAddFriend() : ''}
        </div>
      ` : ''}
    `;

    this.setupEventListeners();
  }

  private renderFriendsList(): string {
    if (this.friends.length === 0) {
      return '<div style="color: #888; text-align: center; padding: 20px;">Nenhum amigo ainda</div>';
    }

    return this.friends.map(friend => `
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px;
        margin-bottom: 5px;
        background: rgba(45, 55, 72, 0.6);
        border-radius: 4px;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: ${friend.isOnline ? '#48bb78' : '#888'};
          "></div>
          <span style="color: #fff;">${this.escapeHtml(friend.friendName)}</span>
        </div>
        <div style="display: flex; gap: 5px;">
          ${friend.isOnline ? `
            <button class="friends-whisper-btn" data-friend="${this.escapeHtml(friend.friendName)}" style="
              padding: 4px 8px;
              background: #4299e1;
              border: none;
              border-radius: 4px;
              color: #fff;
              cursor: pointer;
              font-size: 10px;
            ">💬</button>
          ` : ''}
          <button class="friends-remove-btn" data-friend-id="${friend.id}" style="
            padding: 4px 8px;
            background: #f56565;
            border: none;
            border-radius: 4px;
            color: #fff;
            cursor: pointer;
            font-size: 10px;
          ">×</button>
        </div>
      </div>
    `).join('');
  }

  private renderRequestsList(): string {
    if (this.requests.length === 0) {
      return '<div style="color: #888; text-align: center; padding: 20px;">Nenhum pedido pendente</div>';
    }

    return this.requests.map(req => `
      <div style="
        padding: 10px;
        margin-bottom: 5px;
        background: rgba(45, 55, 72, 0.6);
        border-radius: 4px;
      ">
        <div style="color: #fff; margin-bottom: 5px;">
          ${req.direction === 'received' ? '📩' : '📤'} 
          ${req.direction === 'received' 
            ? `${this.escapeHtml(req.fromUsername)} quer ser seu amigo`
            : `Pedido enviado para ${this.escapeHtml(req.toUsername)}`
          }
        </div>
        <div style="display: flex; gap: 5px;">
          ${req.direction === 'received' ? `
            <button class="friends-accept-btn" data-friend-id="${req.fromUserId}" style="
              padding: 4px 12px;
              background: #48bb78;
              border: none;
              border-radius: 4px;
              color: #fff;
              cursor: pointer;
              font-size: 10px;
            ">Aceitar</button>
            <button class="friends-reject-btn" data-friend-id="${req.id}" style="
              padding: 4px 12px;
              background: #f56565;
              border: none;
              border-radius: 4px;
              color: #fff;
              cursor: pointer;
              font-size: 10px;
            ">Rejeitar</button>
          ` : `
            <button class="friends-cancel-btn" data-friend-id="${req.id}" style="
              padding: 4px 12px;
              background: #f56565;
              border: none;
              border-radius: 4px;
              color: #fff;
              cursor: pointer;
              font-size: 10px;
            ">Cancelar</button>
          `}
        </div>
      </div>
    `).join('');
  }

  private renderAddFriend(): string {
    return `
      <div style="padding: 10px;">
        <div style="color: #fff; margin-bottom: 10px; font-weight: bold;">
          Adicionar novo amigo
        </div>
        <div style="display: flex; gap: 5px;">
          <input type="text" class="friends-add-input" placeholder="Nome do usuário..." style="
            flex: 1;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #4a5568;
            border-radius: 4px;
            padding: 5px 10px;
            color: #fff;
            font-family: monospace;
            font-size: 12px;
          " value="${this.addFriendInput}">
          <button class="friends-add-btn" style="
            background: #4299e1;
            border: none;
            border-radius: 4px;
            padding: 5px 15px;
            color: #fff;
            cursor: pointer;
            font-weight: bold;
          ">Adicionar</button>
        </div>
      </div>
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  public draw(): void {
    // Render é chamado automaticamente quando necessário
  }

  public dispose(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

