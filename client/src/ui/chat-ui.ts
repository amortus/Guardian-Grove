/**
 * Chat UI
 * Interface de chat retrátil no canto inferior esquerdo
 * Guardian Grove Client
 */

import type { ChatMessage, ChatTab, Friend, FriendRequest } from '../types';
import { connect, disconnect, joinChannel, sendMessage, sendWhisper, onMessage, onHistory, onUserJoined, onUserLeft, onError, onConnect, onFriendOnline, onFriendOffline, onFriendUpdate, getConnectionStatus } from '../services/chatClient';
import { friendsApi } from '../api/friendsApi';

// Cores de mensagem (padrão WoW)
const CHAT_COLORS = {
  global: '#FFFFFF',      // branco
  group: '#AAD372',       // verde
  trade: '#FFC864',       // laranja/amarelo
  whisper: '#FF7FD4',     // rosa
  system: '#FFFF00',      // amarelo
  error: '#FF0000',       // vermelho
};

export class ChatUI {
  private container: HTMLDivElement;
  private isExpanded: boolean = false;
  private tabs: ChatTab[] = [];
  private activeTabId: string = '';
  private inputValue: string = '';
  private scrollPosition: number = 0;
  private maxScroll: number = 0;
  private preserveScrollOnRender: boolean = false; // Flag para preservar scroll durante render
  private onlineUsers: Set<string> = new Set();
  
  // Autocomplete state
  private autocompleteVisible: boolean = false;
  private autocompleteSuggestions: string[] = [];
  private autocompleteSelectedIndex: number = 0;
  private autocompleteQuery: string = '';
  
  // Friends integration
  public onFriendStatusChange?: (username: string, isOnline: boolean) => void;
  
  // Friends state
  private friends: Friend[] = [];
  private onlineFriends: Set<string> = new Set();
  private friendRequests: FriendRequest[] = [];
  private friendsActiveTab: 'list' | 'requests' | 'add' = 'list';
  private addFriendInput: string = '';
  
  // Notification system (popups dentro do chat)
  private notifications: Array<{ id: string; message: string; isError: boolean; timestamp: number }> = [];
  
  // Confirmation dialog
  private confirmationDialog: { message: string; onConfirm: () => void; onCancel?: () => void } | null = null;

  // Callbacks
  public onMessageReceived?: (msg: ChatMessage) => void;

  constructor() {
    // Adicionar estilos CSS para animações
    if (!document.getElementById('chat-ui-styles')) {
      const style = document.createElement('style');
      style.id = 'chat-ui-styles';
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .chat-username:hover {
          opacity: 0.8;
          text-decoration: underline !important;
        }
        .chat-tab {
          transition: background-color 0.2s ease;
        }
        .chat-messages {
          scrollbar-width: thin;
          scrollbar-color: #4a5568 rgba(0, 0, 0, 0.3);
        }
        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        .chat-messages::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: #4a5568;
          border-radius: 3px;
        }
        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: #5a6578;
        }
      `;
      document.head.appendChild(style);
    }

    // Criar container HTML
    this.container = document.createElement('div');
    this.container.id = 'chat-ui-container';
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 400px;
      height: 40px;
      background: rgba(15, 15, 30, 0.95);
      border: 2px solid #4a5568;
      border-radius: 8px;
      z-index: 10000;
      overflow: hidden;
      transition: height 0.3s ease, box-shadow 0.3s ease;
      font-family: monospace;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      max-height: calc(100vh - 100px);
    `;
    document.body.appendChild(this.container);

    // Criar abas iniciais
    this.createDefaultTabs();
    this.activeTabId = this.tabs[0].id;
    
    // Limpar todas as mensagens (comportamento WoW - sessão limpa)
    this.clearAllMessages();

    // Verificar se há mensagens não lidas para notificar
    this.checkUnreadMessages();

    // PERFORMANCE: Render inicial usa force=true (é a primeira renderização)
    this.scheduleRender(true);

    // Setup event listeners
    this.setupEventListeners();

    // Setup chat client callbacks
    this.setupChatCallbacks();
    
    // CORREÇÃO: Minimizar chat ao clicar fora da janela
    this.setupOutsideClickHandler();
    
    // Carregar amigos
    this.loadFriends();
    this.loadFriendRequests();
  }

  private createDefaultTabs(): void {
    this.tabs = [
      {
        id: 'global',
        name: 'Global',
        channel: 'global',
        unreadCount: 0,
        messages: [],
      },
      {
        id: 'friends',
        name: 'Amigos',
        channel: 'custom',
        unreadCount: 0,
        messages: [],
      },
    ];
  }
  
  /**
   * Limpar todas as mensagens (comportamento WoW)
   */
  private clearAllMessages(): void {
    this.tabs.forEach(tab => {
      tab.messages = [];
      tab.unreadCount = 0;
    });
  }

  private clickHandler = (e: MouseEvent) => {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    
    // Autocomplete item click
    if (target.classList.contains('autocomplete-item')) {
      const index = parseInt(target.getAttribute('data-index') || '0');
      this.autocompleteSelectedIndex = index;
      this.applyAutocomplete();
      return;
    }
    
    // Toggle expand/collapse - clicar no header (mas não em tabs ou input)
    const header = target.closest('.chat-header');
    if (header) {
      const isInput = target.tagName === 'INPUT' || target.classList.contains('chat-input');
      const isInTabs = target.closest('.chat-tabs-container');
      
      if (!isInput && !isInTabs) {
        this.toggleExpanded();
        return;
      }
    }

    // Toggle via botão
    if (target.classList.contains('chat-toggle-btn') || target.closest('.chat-toggle-btn')) {
      this.toggleExpanded();
      return;
    }

    // Selecionar aba (não disparar se clicou no X de fechar)
    if (target.classList.contains('chat-tab-close')) {
      const tabId = target.getAttribute('data-tab-id');
      if (tabId) {
        this.closeTab(tabId);
      }
      return;
    }

    const tabElement = target.closest('.chat-tab');
    if (tabElement && !target.classList.contains('chat-tab-close')) {
      const tabId = tabElement.getAttribute('data-tab-id');
      if (tabId) {
        this.selectTab(tabId);
      }
      return;
    }

    // Enviar mensagem
    if (target.classList.contains('chat-send-btn') || target.closest('.chat-send-btn')) {
      this.handleSendMessage();
      return;
    }

    // Confirmation dialog buttons
    if (target.classList.contains('chat-confirm-btn')) {
      if (this.confirmationDialog) {
        const onConfirm = this.confirmationDialog.onConfirm;
        this.closeConfirmationDialog();
        onConfirm();
      }
      return;
    }

    if (target.classList.contains('chat-cancel-btn')) {
      if (this.confirmationDialog) {
        const onCancel = this.confirmationDialog.onCancel;
        this.closeConfirmationDialog();
        if (onCancel) {
          onCancel();
        }
      }
      return;
    }

    // Friends subtab
    if (target.classList.contains('friends-subtab')) {
      const subtab = target.getAttribute('data-subtab') as 'list' | 'requests' | 'add';
      if (subtab) {
        this.friendsActiveTab = subtab;
        this.render();
      }
      return;
    }

    // Friends buttons
    if (target.classList.contains('friends-whisper-btn')) {
      const friendName = target.getAttribute('data-friend');
      if (friendName) {
        // CORREÇÃO: Verificar se usuário está online antes de criar aba
        this.createWhisperTab(friendName);
      }
      return;
    }

    if (target.classList.contains('friends-accept-btn')) {
      const friendId = parseInt(target.getAttribute('data-friend-id') || '0');
      if (friendId) {
        this.acceptFriendRequest(friendId);
      }
      return;
    }

    if (target.classList.contains('friends-reject-btn') || target.classList.contains('friends-cancel-btn')) {
      const friendId = parseInt(target.getAttribute('data-friend-id') || '0');
      if (friendId) {
        // Buscar requisição pelo friendId (não pelo id da requisição)
        const request = this.friendRequests.find(r => 
          (r.direction === 'received' && r.fromUserId === friendId) ||
          (r.direction === 'sent' && r.toUserId === friendId)
        );
        // Sem confirmação - ação direta com mensagem no chat
        this.removeOrRejectFriend(friendId, request?.direction === 'received' ? 'reject' : 'cancel');
      }
      return;
    }

    if (target.classList.contains('friends-remove-btn')) {
      const friendId = parseInt(target.getAttribute('data-friend-id') || '0');
      if (friendId) {
        const friend = this.friends.find(f => f.friendId === friendId);
        const friendName = friend?.friendName || 'este amigo';
        
        // Mostrar diálogo de confirmação
        this.showConfirmationDialog(
          `Deseja remover ${friendName} da lista de amigos?`,
          () => {
            this.removeOrRejectFriend(friendId, 'remove');
          },
          () => {
            // Cancelado - não fazer nada
          }
        );
      }
      return;
    }

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
    
    // Verificar se é o input do chat
    if (target.classList.contains('chat-input') || target.tagName === 'INPUT') {
      const input = target as HTMLInputElement;
      
      // Verificar se realmente está digitando - input deve estar focado E ter valor
      const isFocused = document.activeElement === input;
      const hasValue = input.value.trim().length > 0;
      
      // Autocomplete navigation
      if (this.autocompleteVisible) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          e.stopPropagation();
          this.autocompleteSelectedIndex = 
            (this.autocompleteSelectedIndex + 1) % this.autocompleteSuggestions.length;
          this.updateAutocompleteDropdown();
          return;
        }
        
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          e.stopPropagation();
          this.autocompleteSelectedIndex = 
            (this.autocompleteSelectedIndex - 1 + this.autocompleteSuggestions.length) 
            % this.autocompleteSuggestions.length;
          this.updateAutocompleteDropdown();
          return;
        }
        
        if (e.key === 'Tab' || (e.key === 'Enter' && this.autocompleteSuggestions.length > 0)) {
          e.preventDefault();
          e.stopPropagation();
          this.applyAutocomplete();
          return;
        }
        
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          this.autocompleteVisible = false;
          this.render();
          return;
        }
      }
      
      // Send message (apenas se: autocomplete não está ativo, está focado, tem conteúdo)
      if (e.key === 'Enter' && !e.shiftKey && !this.autocompleteVisible && isFocused && hasValue) {
        e.preventDefault();
        e.stopPropagation();
        this.handleSendMessage();
        return;
      }
    }

    // Enter no input de adicionar amigo
    if (target.classList.contains('friends-add-input')) {
      const input = target as HTMLInputElement;
      if (e.key === 'Enter' && input.value.trim()) {
        e.preventDefault();
        e.stopPropagation();
        this.sendFriendRequest(input.value.trim());
        input.value = '';
        this.addFriendInput = '';
      }
    }
  };

  private inputHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('chat-input')) {
      const input = target as HTMLInputElement;
      this.inputValue = input.value;
      
      // SEMPRE preservar scroll quando o usuário está digitando
      // Isso previne que o scroll seja alterado enquanto digita
      const messagesContainer = this.container.querySelector('.chat-messages') as HTMLDivElement;
      if (messagesContainer) {
        this.preserveScrollOnRender = true;
      }
      
      // Detectar @ para autocomplete
      const cursorPos = input.selectionStart || 0;
      const textBeforeCursor = input.value.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      
      const wasAutocompleteVisible = this.autocompleteVisible;
      
      if (lastAtIndex !== -1) {
        const query = textBeforeCursor.substring(lastAtIndex + 1);
        
        // Buscar apenas se não há espaço após @
        if (!query.includes(' ')) {
          this.autocompleteQuery = query;
          this.autocompleteSuggestions = this.getAvailableNicks()
            .filter(nick => nick.toLowerCase().startsWith(query.toLowerCase()));
          this.autocompleteVisible = this.autocompleteSuggestions.length > 0;
          this.autocompleteSelectedIndex = 0;
          
          // Só renderizar se o estado do autocomplete mudou (apareceu/desapareceu)
          // ou se há sugestões para atualizar o dropdown
          if (wasAutocompleteVisible !== this.autocompleteVisible || this.autocompleteVisible) {
            // PERFORMANCE: Atualizar apenas dropdown, não precisa de render completo
            this.updateAutocompleteDropdown();
            // Preservar foco e cursor após render
            setTimeout(() => {
              const newInput = this.container.querySelector('.chat-input') as HTMLInputElement;
              if (newInput) {
                newInput.focus();
                newInput.setSelectionRange(cursorPos, cursorPos);
              }
            }, 0);
          } else {
            // Apenas atualizar o dropdown sem recriar tudo
            this.updateAutocompleteDropdown();
          }
        } else {
          // Espaço após @ - fechar autocomplete
          if (this.autocompleteVisible) {
            this.autocompleteVisible = false;
            this.render();
            // Preservar foco
            setTimeout(() => {
              const newInput = this.container.querySelector('.chat-input') as HTMLInputElement;
              if (newInput) {
                newInput.focus();
                newInput.setSelectionRange(cursorPos, cursorPos);
              }
            }, 0);
          }
        }
      } else {
        // Sem @ - fechar autocomplete se estava aberto
        if (this.autocompleteVisible) {
          this.autocompleteVisible = false;
          this.render();
          // Preservar foco
          setTimeout(() => {
            const newInput = this.container.querySelector('.chat-input') as HTMLInputElement;
            if (newInput) {
              newInput.focus();
              newInput.setSelectionRange(cursorPos, cursorPos);
            }
          }, 0);
        }
        // Se autocomplete já estava fechado, não fazer nada (não renderizar)
      }
    }

    // Atualizar input de adicionar amigo
    if (target.classList.contains('friends-add-input')) {
      this.addFriendInput = (target as HTMLInputElement).value;
    }
  };
  
  /**
   * Verifica se o usuário está próximo do final do scroll
   * Retorna true se está a menos de 100px do final
   */
  private isNearBottom(): boolean {
    const messagesContainer = this.container.querySelector('.chat-messages') as HTMLDivElement;
    if (!messagesContainer) return false;
    
    const containerHeight = messagesContainer.clientHeight;
    const scrollHeight = messagesContainer.scrollHeight;
    const currentScroll = messagesContainer.scrollTop;
    const distanceFromBottom = scrollHeight - currentScroll - containerHeight;
    
    return distanceFromBottom < 100; // 100px de margem
  }
  
  /**
   * Atualiza apenas o dropdown de autocomplete sem recriar todo o HTML
   */
  private updateAutocompleteDropdown(): void {
    const dropdown = this.container.querySelector('[data-autocomplete-dropdown]') as HTMLDivElement;
    if (dropdown && this.autocompleteVisible) {
      dropdown.innerHTML = this.autocompleteSuggestions.map((nick, index) => `
        <div class="autocomplete-item" data-index="${index}" style="
          padding: 8px 10px;
          cursor: pointer;
          background: ${index === this.autocompleteSelectedIndex ? 'rgba(74, 85, 104, 0.8)' : 'transparent'};
          color: ${index === this.autocompleteSelectedIndex ? '#4FD1C7' : '#fff'};
          border-left: 3px solid ${index === this.autocompleteSelectedIndex ? '#4FD1C7' : 'transparent'};
          font-weight: ${index === this.autocompleteSelectedIndex ? 'bold' : 'normal'};
          font-family: monospace;
          font-size: 12px;
        ">
          @${this.escapeHtml(nick)}
        </div>
      `).join('');
    }
  }

  private blurHandler = (e: FocusEvent) => {
    // Fechar autocomplete quando perder foco (mas não se clicou no autocomplete)
    const target = e.target as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement;
    
    if (target.classList.contains('chat-input')) {
      // Se o foco foi para dentro do container (autocomplete), não fechar
      if (relatedTarget && this.container.contains(relatedTarget) && relatedTarget.classList.contains('autocomplete-item')) {
        return;
      }
      
      // Fechar autocomplete após um pequeno delay para permitir click no item
      setTimeout(() => {
        if (!this.container.contains(document.activeElement) || !document.activeElement?.classList.contains('chat-input')) {
          this.autocompleteVisible = false;
          this.render();
        }
      }, 150);
    }
  };

  /**
   * CORREÇÃO: Configura handler para minimizar chat ao clicar fora
   */
  private setupOutsideClickHandler(): void {
    // Adicionar listener no document para detectar cliques fora do chat
    document.addEventListener('click', (e: MouseEvent) => {
      // Se chat não está expandido, não fazer nada
      if (!this.isExpanded) {
        return;
      }

      // Verificar se o clique foi dentro do container do chat
      const target = e.target as HTMLElement;
      if (this.container && this.container.contains(target)) {
        // Clique foi dentro do chat, não minimizar
        return;
      }

      // Clique foi fora do chat - minimizar
      if (this.isExpanded) {
        this.toggleExpanded();
      }
    });
  }

  private setupEventListeners(): void {
    // Remover listeners anteriores se existirem
    this.container.removeEventListener('click', this.clickHandler);
    this.container.removeEventListener('keydown', this.keydownHandler);
    this.container.removeEventListener('input', this.inputHandler);
    this.container.removeEventListener('blur', this.blurHandler, true);
    
    // Adicionar novos listeners com event delegation
    this.container.addEventListener('click', this.clickHandler);
    this.container.addEventListener('keydown', this.keydownHandler);
    this.container.addEventListener('input', this.inputHandler);
    this.container.addEventListener('blur', this.blurHandler, true);

    // Scroll das mensagens
    const messagesContainer = this.container.querySelector('.chat-messages') as HTMLDivElement;
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', () => {
        this.scrollPosition = messagesContainer.scrollTop;
      });
    }

    // Clique em nomes de usuário para criar whisper
    const usernameElements = this.container.querySelectorAll('.chat-username');
    usernameElements.forEach((elem) => {
      elem.addEventListener('click', (e) => {
        const username = (e.target as HTMLElement).getAttribute('data-username');
        if (username) {
          const currentUsername = localStorage.getItem('username') || '';
          if (username !== currentUsername) {
            this.createWhisperTab(username);
            // Focar no input após criar aba
            setTimeout(() => {
              const input = this.container.querySelector('.chat-input') as HTMLInputElement;
              if (input) {
                input.focus();
                input.placeholder = `Enviar whisper para ${username}...`;
              }
            }, 100);
          }
        }
      });
    });
  }

  private setupChatCallbacks(): void {
    // Mensagens recebidas
    onMessage((msg) => {
      this.addMessage(msg);
      if (this.onMessageReceived) {
        this.onMessageReceived(msg);
      }
    });

    // Histórico de canal - IGNORAR (comportamento WoW - sem persistência)
    onHistory((data) => {
      // NÃO aceitar histórico do servidor
      // Comportamento WoW: apenas mensagens da sessão atual
      // Fechou client = perde mensagens antigas
      console.log('[ChatUI] Ignorando histórico do servidor (comportamento WoW)');
    });

    // Usuário entrou - armazenar mas NÃO mostrar mensagem pública e NÃO notificar
    // Apenas armazenar para autocomplete. Notificações de amigos vêm via onFriendOnline/onFriendOffline
    onUserJoined((data) => {
      this.onlineUsers.add(data.username);
      // NÃO chamar onFriendStatusChange aqui - isso seria para TODOS os usuários
      // Apenas o servidor (via friend:online/offline) deve notificar sobre amigos
    });

    // Usuário saiu - remover mas NÃO mostrar mensagem pública e NÃO notificar
    // Apenas remover da lista de usuários online
    onUserLeft((data) => {
      this.onlineUsers.delete(data.username);
      // NÃO chamar onFriendStatusChange aqui - isso seria para TODOS os usuários
      // Apenas o servidor (via friend:online/offline) deve notificar sobre amigos
    });

    // Amigo ficou online - atualizar lista silenciosamente (sem popup)
    onFriendOnline((data) => {
      this.onlineFriends.add(data.username);
      this.updateFriendOnlineStatus(data.username, true);
      if (this.onFriendStatusChange) {
        this.onFriendStatusChange(data.username, true);
      }
    });

    // Amigo ficou offline - atualizar lista silenciosamente (sem popup)
    onFriendOffline((data) => {
      this.onlineFriends.delete(data.username);
      this.updateFriendOnlineStatus(data.username, false);
      if (this.onFriendStatusChange) {
        this.onFriendStatusChange(data.username, false);
      }
    });

    // Atualização de amizade (pedido enviado/aceito/rejeitado/removido)
    onFriendUpdate((data) => {
      console.log('[ChatUI] Friend update received:', data);
      
      // Sempre recarregar lista de amigos e pedidos quando houver atualização
      // Isso garante que a UI sempre esteja sincronizada, mesmo que o usuário não esteja vendo a aba de amigos
      this.loadFriends().then(() => {
        // Após recarregar amigos, recarregar pedidos e atualizar UI
        this.loadFriendRequests().then(() => {
          // Se estiver na aba de amigos, renderizar novamente para mostrar mudanças
          if (this.activeTabId === 'friends') {
            this.render();
          }
        });
      });
    });

    // Erros
    onError((error) => {
      this.addSystemMessage(`Erro: ${error.message}`, true);
    });
  }

  /**
   * Conecta ao servidor de chat
   */
  public connect(token: string): void {
    connect(token);
    
    // Entrar nos canais padrão após conectar
    const setupChannels = () => {
      if (getConnectionStatus()) {
        // Entrar apenas no canal global
        joinChannel('global');
        
        // Carregar histórico da aba ativa imediatamente (se não for whisper)
        const activeTab = this.tabs.find(t => t.id === this.activeTabId);
        if (activeTab && activeTab.channel !== 'whisper') {
          // Validar que o canal é válido antes de fazer join
          const validChannels = ['global'];
          if (validChannels.includes(activeTab.channel)) {
            joinChannel(activeTab.channel);
          }
        }
      } else {
        // Tentar novamente em 500ms
        setTimeout(setupChannels, 500);
      }
    };
    
    // Tentar após 500ms
    setTimeout(setupChannels, 500);
    
    // Também tentar quando conectar
    onConnect(() => {
      setupChannels();
    });
  }

  /**
   * Desconecta do servidor
   */
  public disconnect(): void {
    disconnect();
  }

  /**
   * Alterna entre expandido e retraído
   */
  private toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
    this.container.style.height = this.isExpanded ? '400px' : '40px';
    // PERFORMANCE: Forçar render imediato para mudanças de UI importantes
    this.scheduleRender(true);

      // Auto-scroll para última mensagem quando expandir (sempre forçar ao expandir)
      if (this.isExpanded) {
        setTimeout(() => {
          this.scrollToBottom(true);
          // Focar no input quando expandir para permitir digitar imediatamente
          const input = this.container.querySelector('.chat-input') as HTMLInputElement;
          if (input) {
            input.focus();
          }
        }, 100);
      }
  }

  /**
   * Seleciona uma aba
   */
  private selectTab(tabId: string): void {
    this.activeTabId = tabId;
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      tab.unreadCount = 0; // Limpar contador não lidas
      // NUNCA tentar carregar histórico para whispers ou friends via joinChannel
      // Whispers não são canais - são conexões diretas entre usuários
      // Friends é uma interface de gerenciamento, não um canal
      if (!tab.messages.length && getConnectionStatus() && tab.channel !== 'whisper' && tab.id !== 'friends') {
        // Validar que o canal é válido antes de fazer join
        const validChannels = ['global'];
        if (validChannels.includes(tab.channel)) {
          joinChannel(tab.channel);
        }
      }
      
      // Recarregar amigos se selecionou aba de amigos
      if (tab.id === 'friends') {
        this.loadFriends();
        this.loadFriendRequests();
      }
    }
    // PERFORMANCE: Limpar tracking de mensagens renderizadas ao mudar de aba
    // CORREÇÃO: Verificar se existe antes de chamar clear()
    if (this.lastRenderedMessageIds) {
      this.lastRenderedMessageIds.clear();
    }
    // Forçar render imediato para mudança de aba
    this.scheduleRender(true);
    // Ao selecionar aba, sempre ir para o final
    this.scrollToBottom(true);
    
    // Focar no input após selecionar aba (mas não se for aba de amigos)
    if (tabId !== 'friends') {
      setTimeout(() => {
        const input = this.container.querySelector('.chat-input') as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 50);
    }
  }

  /**
   * Fecha uma aba (exceto as padrão)
   */
  private closeTab(tabId: string): void {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab || tab.channel !== 'whisper') {
      return; // Não pode fechar abas padrão
    }

    this.tabs = this.tabs.filter(t => t.id !== tabId);

    // Selecionar primeira aba se fechou a ativa
    if (this.activeTabId === tabId && this.tabs.length > 0) {
      this.activeTabId = this.tabs[0].id;
    }

    this.render();
  }

  /**
   * Cria uma nova aba de whisper
   */
  public createWhisperTab(targetUsername: string): boolean {
    // Verificar se já existe
    const existing = this.tabs.find(t => t.channel === 'whisper' && t.target === targetUsername);
    if (existing) {
      this.selectTab(existing.id);
      // Expandir se estiver retraído
      if (!this.isExpanded) {
        this.toggleExpanded();
      }
      return true;
    }

    // CORREÇÃO: Verificar se usuário está online antes de criar aba
    // Verificar tanto em onlineUsers (todos os usuários) quanto em onlineFriends (amigos)
    const normalizedTarget = targetUsername.toLowerCase().trim();
    const isOnline = Array.from(this.onlineUsers).some(u => u.toLowerCase().trim() === normalizedTarget) ||
                     Array.from(this.onlineFriends).some(f => f.toLowerCase().trim() === normalizedTarget);

    if (!isOnline) {
      // Usuário não está online
      this.showNotification(`Usuário "${targetUsername}" não está online`, true);
      return false;
    }

    // Criar nova aba
    const newTab: ChatTab = {
      id: `whisper-${targetUsername}-${Date.now()}`,
      name: targetUsername,
      channel: 'whisper',
      target: targetUsername,
      unreadCount: 0,
      messages: [],
    };

    this.tabs.push(newTab);
    this.selectTab(newTab.id);
    
    // Expandir se estiver retraído
    if (!this.isExpanded) {
      this.toggleExpanded();
    }
    
    // Focar no input imediatamente
    setTimeout(() => {
      const input = this.container.querySelector('.chat-input') as HTMLInputElement;
      if (input && this.activeTabId === newTab.id) {
        input.focus();
        input.placeholder = 'Digite sua mensagem... (Enter para enviar)';
      }
    }, 100);
    
    return true;
  }

  /**
   * Adiciona mensagem à aba correspondente
   */
  public addMessage(msg: ChatMessage): void {
    let targetTab: ChatTab | undefined;
    let tabCreated = false; // Flag para indicar se acabou de criar nova aba

    if (msg.channel === 'whisper') {
      // Para whispers, encontrar aba com o sender ou recipient correto
      const currentUsername = localStorage.getItem('username') || '';
      
      // Determinar quem é o outro usuário na conversa
      // Se eu sou o sender, o outro é o recipient
      // Se eu não sou o sender, o outro é o sender
      let otherUser: string | undefined;
      if (msg.sender === currentUsername) {
        // Eu enviei, então o outro é o recipient
        otherUser = msg.recipient;
      } else {
        // Recebi, então o outro é o sender
        otherUser = msg.sender;
      }
      
      if (otherUser) {
        targetTab = this.tabs.find(t => 
          t.channel === 'whisper' && t.target === otherUser
        );

        // Criar nova aba se não existe
        if (!targetTab) {
          tabCreated = true;
          this.createWhisperTab(otherUser);
          targetTab = this.tabs.find(t => t.id === this.activeTabId);
        }
      }
    } else {
      // Canais normais (já existem por padrão)
      targetTab = this.tabs.find(t => t.channel === msg.channel);
      // Para canais normais, não criamos nova aba (já existem sempre)
      // tabCreated permanece false
    }

    if (targetTab) {
      // Limitar a 100 mensagens
      targetTab.messages.push(msg);
      if (targetTab.messages.length > 100) {
        targetTab.messages.shift();
      }

      // Incrementar contador não lidas se não é a aba ativa
      if (targetTab.id !== this.activeTabId) {
        targetTab.unreadCount++;
        this.checkUnreadMessages();
        
        // Adicionar animação visual na aba (piscar)
        if (!this.isExpanded) {
          const header = this.container.querySelector('div:first-child') as HTMLElement;
          if (header) {
            header.style.animation = 'pulse 0.5s ease';
            setTimeout(() => {
              header.style.animation = '';
            }, 500);
          }
        }
      }

      // CORREÇÃO: Se criou nova aba ou não é a aba ativa, SEMPRE forçar render completo imediato
      // Renderização incremental apenas para mensagens na aba ATIVA que já está renderizada
      const shouldUseIncremental = 
        !tabCreated && // Não acabou de criar a aba
        targetTab.id === this.activeTabId && // É a aba ativa
        this.activeTabId !== 'friends' && // Não é aba de amigos
        this.container.querySelector('.chat-messages'); // Container já existe no DOM

      if (shouldUseIncremental) {
        const wasAppended = this.appendMessageToDOM(msg, targetTab.id, false);
        
        if (wasAppended) {
          // CORREÇÃO: Se é a aba ativa, SEMPRE fazer scroll para o final quando nova mensagem chega
          // (a menos que usuário esteja ativamente lendo mensagens antigas)
          const isActiveTab = targetTab.id === this.activeTabId;
          const shouldPreserveScroll = this.preserveScrollOnRender && !isActiveTab;
          
          if (isActiveTab && !shouldPreserveScroll) {
            // Sempre scroll para final se é a aba ativa e não está preservando
            setTimeout(() => {
              this.scrollToBottom(true); // Forçar scroll
            }, 10);
          }
          // Não precisa render completo, sair aqui
          return;
        }
      }

      // Renderização completa necessária (nova aba, aba inativa, ou incremental falhou)
      const shouldPreserveScroll = this.preserveScrollOnRender || !this.isNearBottom();
      
      if (shouldPreserveScroll) {
        this.preserveScrollOnRender = true;
      }
      
      // CORREÇÃO: Se criou nova aba, SEMPRE render imediato. Para outras, usar debounce leve
      if (tabCreated) {
        this.scheduleRender(true); // Forçar render imediato para nova aba
      } else {
        this.scheduleRender(false); // Debounce leve para outras situações
      }

      // CORREÇÃO: Auto-scroll para final SEMPRE se é a aba ativa (a menos que usuário esteja lendo mensagens antigas)
      // Se não está preservando scroll E é a aba ativa, ir para o final
      if (targetTab.id === this.activeTabId) {
        if (!shouldPreserveScroll) {
          // Não está preservando = usuário estava perto do final ou foi uma nova mensagem
          // Sempre scroll para o final
          setTimeout(() => {
            this.scrollToBottom(true); // Forçar scroll
          }, 10);
        }
      }
      
      // Resetar flag após render se estava preservando
      if (this.preserveScrollOnRender) {
        setTimeout(() => {
          this.preserveScrollOnRender = false;
        }, 100);
      }
    }
  }

  /**
   * Adiciona mensagem do sistema
   * @param message Mensagem a ser exibida
   * @param isError Se é uma mensagem de erro (vermelho)
   * @param keepTab Se true, não muda para aba Global (útil para mensagens de amigos)
   * @param showInChat Se true, também mostra no feed do chat (padrão false - só popup)
   */
  private addSystemMessage(message: string, isError: boolean = false, keepTab: boolean = false, showInChat: boolean = false): void {
    // Mostrar notificação popup (sempre)
    this.showNotification(message, isError);
    
    // Se showInChat for true, também adicionar ao feed do chat (para mensagens importantes)
    if (showInChat) {
      // Garantir que chat esteja expandido para mostrar mensagens importantes
      if (isError && !this.isExpanded) {
        this.toggleExpanded();
      }
      
      // Só mudar para Global se não for para manter a aba atual
      if (!keepTab && this.activeTabId !== 'global') {
        const globalTab = this.tabs.find(t => t.id === 'global');
        if (globalTab) {
          this.activeTabId = 'global';
        }
      }
      
      const systemMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        channel: 'system',
        sender: 'Sistema',
        senderUserId: 0,
        message,
        timestamp: Date.now(),
        color: isError ? CHAT_COLORS.error : CHAT_COLORS.system,
      };

      // Adicionar a todas as abas
      this.tabs.forEach(tab => {
        tab.messages.push(systemMsg);
        if (tab.messages.length > 100) {
          tab.messages.shift();
        }
      });

      // PERFORMANCE: Usar scheduleRender ao invés de render() direto
      this.scheduleRender(false);
      // Não forçar scroll - apenas se já estiver perto do final
      setTimeout(() => this.scrollToBottom(false), 10);
    }
  }
  
  /**
   * Mostra notificação popup discreta dentro do chat
   */
  private showNotification(message: string, isError: boolean = false): void {
    const notificationId = `notif-${Date.now()}-${Math.random()}`;
    const notification: { id: string; message: string; isError: boolean; timestamp: number } = {
      id: notificationId,
      message,
      isError,
      timestamp: Date.now(),
    };
    
    this.notifications.push(notification);
    // PERFORMANCE: Usar scheduleRender para notificações
    this.scheduleRender(false);
    
    // Remover após 4 segundos (erros ficam mais tempo)
    const duration = isError ? 6000 : 4000;
    setTimeout(() => {
      const index = this.notifications.findIndex(n => n.id === notificationId);
      if (index > -1) {
        this.notifications.splice(index, 1);
        // PERFORMANCE: Usar scheduleRender para remoção de notificações
        this.scheduleRender(false);
      }
    }, duration);
  }
  
  /**
   * Mostra diálogo de confirmação dentro do chat
   */
  private showConfirmationDialog(message: string, onConfirm: () => void, onCancel?: () => void): void {
    this.confirmationDialog = {
      message,
      onConfirm,
      onCancel,
    };
    // PERFORMANCE: Forçar render imediato para diálogos importantes
    this.scheduleRender(true);
  }
  
  /**
   * Fecha diálogo de confirmação
   */
  private closeConfirmationDialog(): void {
    this.confirmationDialog = null;
    // PERFORMANCE: Forçar render imediato para fechar diálogo
    this.scheduleRender(true);
  }

  /**
   * Processa comandos de chat (/w, /pm, etc)
   */
  private parseCommand(input: string): { type: string; channel?: string; target?: string; message: string } | null {
    if (!input.startsWith('/')) {
      return null;
    }

    const parts = input.substring(1).split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Whisper commands
    if (command === 'w' || command === 'whisper' || command === 'pm') {
      if (args.length < 2) {
        this.addSystemMessage('Uso: /w <usuário> <mensagem>', true);
        return null;
      }
      return {
        type: 'whisper',
        target: args[0],
        message: args.slice(1).join(' '),
      };
    }

    // Channel shortcuts
    if (command === 'g' || command === 'global') {
      return {
        type: 'channel',
        channel: 'global',
        message: args.join(' '),
      };
    }

    // Add friend command
    if (command === 'add' || command === 'adicionar') {
      if (args.length < 1) {
        this.addSystemMessage('Uso: /add <usuário>', true, false, false); // Só popup, não no chat
        return null;
      }
      const username = args[0];
      // Chamar sendFriendRequest diretamente
      this.sendFriendRequest(username);
      return null; // Não enviar como mensagem
    }

    return null;
  }

  /**
   * Envia mensagem
   */
  private handleSendMessage(): void {
    const input = this.container.querySelector('.chat-input') as HTMLInputElement;
    if (!input) return;

    // Fechar autocomplete se estiver aberto
    if (this.autocompleteVisible) {
      this.autocompleteVisible = false;
    }

    const text = input.value.trim();
    if (!text) return;
    
    // CORREÇÃO: NÃO preservar scroll ao enviar mensagem - sempre ir para o final após enviar
    // O scroll será ajustado quando a mensagem chegar via addMessage()
    this.preserveScrollOnRender = false;

    // Verificar se é comando
    const command = this.parseCommand(text);
    
    if (command) {
      if (command.type === 'whisper' && command.target) {
        // CORREÇÃO: Criar aba de whisper apenas se usuário estiver online
        const tabCreated = this.createWhisperTab(command.target);
        
        // Enviar whisper apenas se aba foi criada (usuário está online)
        if (tabCreated && getConnectionStatus()) {
          sendWhisper(command.target, command.message);
          // CORREÇÃO: Após enviar, forçar scroll para o final
          setTimeout(() => {
            this.scrollToBottom(true);
          }, 50);
        }
        input.value = '';
        this.inputValue = '';
        return;
      }

      if (command.type === 'channel' && command.channel) {
        // Selecionar aba do canal e enviar
        const tab = this.tabs.find(t => t.channel === command.channel);
        if (tab) {
          this.selectTab(tab.id);
        }

        if (getConnectionStatus()) {
          sendMessage(command.channel, command.message);
          // CORREÇÃO: Após enviar, forçar scroll para o final
          setTimeout(() => {
            this.scrollToBottom(true);
          }, 50);
        }
        input.value = '';
        this.inputValue = '';
        return;
      }
    }

    // Mensagem normal - usar aba ativa
    const activeTab = this.tabs.find(t => t.id === this.activeTabId);
    if (!activeTab) return;

    if (getConnectionStatus()) {
      if (activeTab.channel === 'whisper' && activeTab.target) {
        sendWhisper(activeTab.target, text);
      } else {
        sendMessage(activeTab.channel, text);
      }
      // CORREÇÃO: Após enviar, forçar scroll para o final
      setTimeout(() => {
        this.scrollToBottom(true);
      }, 50);
    }

    input.value = '';
    this.inputValue = '';
  }

  /**
   * Coleta nicks disponíveis para autocomplete
   */
  private getAvailableNicks(): string[] {
    const nicks = new Set<string>();
    const currentUsername = localStorage.getItem('username') || '';
    
    // Adicionar usuários das mensagens recentes
    this.tabs.forEach(tab => {
      tab.messages.forEach(msg => {
        if (msg.sender !== 'Sistema' && msg.sender !== currentUsername) {
          nicks.add(msg.sender);
        }
        // Também adicionar recipient de whispers se não for o usuário atual
        if (msg.recipient && msg.recipient !== currentUsername) {
          nicks.add(msg.recipient);
        }
      });
    });
    
    // Adicionar usuários online
    this.onlineUsers.forEach(user => {
      if (user !== currentUsername) {
        nicks.add(user);
      }
    });
    
    return Array.from(nicks).sort();
  }

  /**
   * Aplica autocomplete selecionado ao input
   */
  private applyAutocomplete(): void {
    if (this.autocompleteSuggestions.length === 0) return;
    
    const input = this.container.querySelector('.chat-input') as HTMLInputElement;
    if (!input) return;
    
    const selectedNick = this.autocompleteSuggestions[this.autocompleteSelectedIndex];
    const cursorPos = input.selectionStart || 0;
    const textBeforeCursor = input.value.substring(0, cursorPos);
    const textAfterCursor = input.value.substring(cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex === -1) return;
    
    // Substituir @query por @nick
    const newText = 
      textBeforeCursor.substring(0, lastAtIndex) + 
      '@' + selectedNick + ' ' + 
      textAfterCursor;
    
    input.value = newText;
    this.inputValue = newText;
    
    // Posicionar cursor após o nick
    const newCursorPos = lastAtIndex + selectedNick.length + 2;
    input.setSelectionRange(newCursorPos, newCursorPos);
    
    this.autocompleteVisible = false;
    this.render();
    
    // Focar no input novamente
    setTimeout(() => {
      input.focus();
    }, 0);
  }

  /**
   * Scroll para o final apenas se já estava perto do final OU for forçado
   * Isso previne que a rolagem suba automaticamente quando o usuário está lendo mensagens antigas
   */
  private scrollToBottom(force: boolean = false): void {
    // Se está preservando scroll (usuário digitando/lendo), NUNCA fazer scroll
    if (this.preserveScrollOnRender && !force) {
      return;
    }
    
    const messagesContainer = this.container.querySelector('.chat-messages') as HTMLDivElement;
    if (!messagesContainer) return;
    
    const containerHeight = messagesContainer.clientHeight;
    const scrollHeight = messagesContainer.scrollHeight;
    const currentScroll = messagesContainer.scrollTop;
    const distanceFromBottom = scrollHeight - currentScroll - containerHeight;
    
    // Se estiver a menos de 100px do final OU for scroll forçado, rolar para o final
    // Caso contrário, manter a posição atual
    if (force || distanceFromBottom < 100) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  /**
   * Formata timestamp para exibição
   */
  private formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Renderiza conteúdo da aba de amigos
   */
  private renderFriendsContent(): string {
    return `
      <div style="
        height: 180px;
        overflow-y: auto;
        padding: 10px;
        background: rgba(0, 0, 0, 0.3);
      ">
        <!-- Friends tabs -->
        <div style="
          display: flex;
          gap: 2px;
          margin-bottom: 10px;
        ">
          <div class="friends-subtab" data-subtab="list" style="
            padding: 5px 10px;
            background: ${this.friendsActiveTab === 'list' ? 'rgba(74, 85, 104, 0.8)' : 'rgba(45, 55, 72, 0.6)'};
            color: #fff;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
          ">Lista</div>
          <div class="friends-subtab" data-subtab="requests" style="
            padding: 5px 10px;
            background: ${this.friendsActiveTab === 'requests' ? 'rgba(74, 85, 104, 0.8)' : 'rgba(45, 55, 72, 0.6)'};
            color: ${this.friendRequests.length > 0 ? '#ff6b6b' : '#fff'};
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
          ">Pedidos${this.friendRequests.length > 0 ? ` (${this.friendRequests.length})` : ''}</div>
          <div class="friends-subtab" data-subtab="add" style="
            padding: 5px 10px;
            background: ${this.friendsActiveTab === 'add' ? 'rgba(74, 85, 104, 0.8)' : 'rgba(45, 55, 72, 0.6)'};
            color: #fff;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
          ">Adicionar</div>
        </div>

        <!-- Friends content -->
        ${this.friendsActiveTab === 'list' ? this.renderFriendsList() : ''}
        ${this.friendsActiveTab === 'requests' ? this.renderFriendsRequests() : ''}
        ${this.friendsActiveTab === 'add' ? this.renderAddFriend() : ''}
      </div>
    `;
  }

  /**
   * Renderiza lista de amigos
   */
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
          <button class="friends-remove-btn" data-friend-id="${friend.friendId}" style="
            padding: 4px 8px;
            background: #f56565;
            border: none;
            border-radius: 4px;
            color: #fff;
            cursor: pointer;
            font-size: 10px;
          " title="Remover amigo">×</button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Renderiza pedidos de amizade
   */
  private renderFriendsRequests(): string {
    if (this.friendRequests.length === 0) {
      return '<div style="color: #888; text-align: center; padding: 20px;">Nenhum pedido pendente</div>';
    }

    return this.friendRequests.map(req => `
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
            <button class="friends-reject-btn" data-friend-id="${req.fromUserId}" style="
              padding: 4px 12px;
              background: #f56565;
              border: none;
              border-radius: 4px;
              color: #fff;
              cursor: pointer;
              font-size: 10px;
            ">Rejeitar</button>
          ` : `
            <button class="friends-cancel-btn" data-friend-id="${req.toUserId}" style="
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

  /**
   * Renderiza formulário de adicionar amigo
   */
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

  /**
   * Carrega lista de amigos
   */
  private async loadFriends(): Promise<void> {
    try {
      const response = await friendsApi.getFriends();
      if (response.success && response.data) {
        this.friends = response.data.map(f => ({
          ...f,
          isOnline: this.onlineFriends.has(f.friendName),
        }));
        if (this.activeTabId === 'friends') {
          this.render();
        }
      }
    } catch (error) {
      console.error('[ChatUI] Error loading friends:', error);
    }
  }

  /**
   * Carrega pedidos de amizade
   */
  private async loadFriendRequests(): Promise<void> {
    try {
      const response = await friendsApi.getRequests();
      if (response.success && response.data) {
        this.friendRequests = response.data;
        if (this.activeTabId === 'friends') {
          this.render();
        }
      }
    } catch (error) {
      console.error('[ChatUI] Error loading friend requests:', error);
    }
  }

  /**
   * Atualiza status online de um amigo
   */
  private updateFriendOnlineStatus(username: string, isOnline: boolean): void {
    this.friends.forEach(friend => {
      if (friend.friendName === username) {
        friend.isOnline = isOnline;
      }
    });
    if (this.activeTabId === 'friends') {
      this.render();
    }
  }

  /**
   * Envia pedido de amizade
   */
  private async sendFriendRequest(username: string): Promise<void> {
    try {
      const response = await friendsApi.sendRequest(username);
      if (response.success) {
        await this.loadFriendRequests();
        this.addFriendInput = '';
        this.render();
        // Mensagem de sucesso no chat (manter aba atual)
        this.addSystemMessage(`Pedido de amizade enviado para ${username}`, false, true);
      } else {
        this.addSystemMessage(`Erro: ${response.error || 'Erro ao enviar pedido'}`, true, true);
      }
    } catch (error: any) {
      console.error('[ChatUI] Error sending friend request:', error);
      this.addSystemMessage(`Erro: ${error.message || 'Erro ao enviar pedido'}`, true, true);
    }
  }

  /**
   * Aceita pedido de amizade
   */
  private async acceptFriendRequest(friendId: number): Promise<void> {
    try {
      const request = this.friendRequests.find(r => r.id === friendId);
      const friendName = request?.fromUsername || request?.toUsername || 'usuário';
      
      const response = await friendsApi.acceptRequest(friendId);
      if (response.success) {
        // Recarregar amigos e verificar status online
        await this.loadFriends();
        
        // Verificar se o novo amigo está online
        try {
          const onlineResponse = await friendsApi.getOnlineFriends();
          if (onlineResponse.success && onlineResponse.data) {
            // Atualizar status online de todos os amigos
            onlineResponse.data.forEach(friend => {
              this.onlineFriends.add(friend.friendName);
              const friendInList = this.friends.find(f => f.friendId === friend.friendId);
              if (friendInList) {
                friendInList.isOnline = true;
              }
            });
            
            // Verificar se o novo amigo está na lista de online
            const newFriend = this.friends.find(f => f.friendName === friendName);
            if (newFriend) {
              newFriend.isOnline = this.onlineFriends.has(friendName);
            }
          }
        } catch (error) {
          console.error('[ChatUI] Error checking online friends:', error);
        }
        
        await this.loadFriendRequests();
        this.render();
        // Mensagem de sucesso no chat (manter aba atual)
        this.addSystemMessage(`Agora você é amigo de ${friendName}!`, false, true);
      } else {
        this.addSystemMessage('Erro: Erro ao aceitar pedido', true, true);
      }
    } catch (error: any) {
      console.error('[ChatUI] Error accepting request:', error);
      this.addSystemMessage(`Erro: ${error.message || 'Erro ao aceitar pedido'}`, true, true);
    }
  }

  /**
   * Remove amigo ou rejeita pedido
   */
  private async removeOrRejectFriend(friendId: number, action: 'remove' | 'reject' | 'cancel' = 'remove'): Promise<void> {
    // Buscar nome ANTES de fazer qualquer chamada (para usar depois)
    const friend = this.friends.find(f => f.friendId === friendId);
    const request = this.friendRequests.find(r => 
      (r.direction === 'received' && r.fromUserId === friendId) ||
      (r.direction === 'sent' && r.toUserId === friendId)
    );
    const targetName = friend?.friendName || request?.fromUsername || request?.toUsername || 'usuário';
    
    try {
      const response = await friendsApi.removeFriend(friendId);
      
      // Sempre recarregar lista, mesmo em caso de erro (pode ter sido processado por outro lado)
      await this.loadFriends();
      await this.loadFriendRequests();
      this.render();
      
      if (response.success) {
        // Mensagem de sucesso no chat baseada na ação (manter aba atual)
        if (action === 'reject') {
          this.addSystemMessage(`Pedido de amizade de ${targetName} rejeitado`, false, true);
        } else if (action === 'cancel') {
          this.addSystemMessage(`Pedido de amizade para ${targetName} cancelado`, false, true);
        } else {
          this.addSystemMessage(`${targetName} foi removido da lista de amigos`, false, true);
        }
      } else {
        // Se retornou erro mas não é 404, é um erro real
        // Se for 404, provavelmente já foi processado (via notificação em tempo real)
        if (response.error?.includes('not found') || response.error?.includes('Friendship not found')) {
          // Já foi removido (provavelmente via notificação em tempo real), apenas recarregar sem erro
          // A lista já foi recarregada acima, então não precisa fazer nada
        } else {
          const errorMsg = action === 'reject' ? 'Erro ao rejeitar pedido' : action === 'cancel' ? 'Erro ao cancelar pedido' : 'Erro ao remover amigo';
          this.addSystemMessage(`Erro: ${response.error || errorMsg}`, true, true);
        }
      }
    } catch (error: any) {
      console.error('[ChatUI] Error removing/rejecting friend:', error);
      
      // Sempre recarregar mesmo em caso de erro (dados podem estar desatualizados)
      await this.loadFriends();
      await this.loadFriendRequests();
      this.render();
      
      // Se for erro 404, tratar como "já foi processado" (silenciosamente)
      if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('Friendship not found')) {
        // Não mostrar erro - provavelmente já foi removido via notificação em tempo real
        // A lista já foi recarregada acima
        return;
      }
      
      // Outros erros mostrar mensagem (manter aba atual)
      const errorMsg = action === 'reject' ? 'Erro ao rejeitar pedido' : action === 'cancel' ? 'Erro ao cancelar pedido' : 'Erro ao remover amigo';
      this.addSystemMessage(`Erro: ${error.message || errorMsg}`, true, true);
    }
  }

  /**
   * Renderiza a UI
   */
  private render(): void {
    // Preservar posição do scroll ANTES de renderizar
    const messagesContainer = this.container.querySelector('.chat-messages') as HTMLDivElement;
    let savedScrollTop = 0;
    let savedScrollHeight = 0;
    let savedDistanceFromBottom = 0;
    
    if (messagesContainer) {
      if (this.preserveScrollOnRender) {
        // Preservar posição absoluta
        savedScrollTop = messagesContainer.scrollTop;
        savedScrollHeight = messagesContainer.scrollHeight;
      } else {
        // Salvar distância do final para manter posição relativa
        const containerHeight = messagesContainer.clientHeight;
        const scrollHeight = messagesContainer.scrollHeight;
        const currentScroll = messagesContainer.scrollTop;
        savedDistanceFromBottom = scrollHeight - currentScroll - containerHeight;
        savedScrollHeight = scrollHeight;
      }
    }
    
    const activeTab = this.tabs.find(t => t.id === this.activeTabId);

    this.container.innerHTML = `
      <!-- Header -->
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 10px;
        background: rgba(26, 32, 44, 0.95);
        border-bottom: 1px solid #4a5568;
        cursor: pointer;
        user-select: none;
        min-height: 40px;
      " class="chat-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="color: #fff; font-weight: bold;">💬 Chat</span>
          ${this.isExpanded ? `<span style="color: #888; font-size: 10px;">${activeTab?.name || ''}</span>` : ''}
        </div>
        <div class="chat-toggle-btn" style="
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          font-size: 16px;
          padding: 5px 10px;
          user-select: none;
        ">${this.isExpanded ? '▼' : '▲'}</div>
      </div>

      ${this.isExpanded ? `
        <!-- Tabs -->
        <div class="chat-tabs-container" style="
          display: flex;
          gap: 2px;
          padding: 5px;
          background: rgba(15, 15, 30, 0.9);
          border-bottom: 1px solid #4a5568;
          overflow-x: auto;
        ">
          ${this.tabs.map(tab => `
            <div class="chat-tab" data-tab-id="${tab.id}" style="
              display: flex;
              align-items: center;
              gap: 5px;
              padding: 5px 10px;
              background: ${tab.id === this.activeTabId ? 'rgba(74, 85, 104, 0.8)' : 'rgba(45, 55, 72, 0.6)'};
              color: ${tab.unreadCount > 0 ? '#ff6b6b' : '#fff'};
              border-radius: 4px;
              cursor: pointer;
              white-space: nowrap;
              font-size: 11px;
              position: relative;
            ">
              ${tab.name}
              ${tab.unreadCount > 0 ? `<span style="
                background: #ff6b6b;
                color: #fff;
                border-radius: 10px;
                padding: 1px 5px;
                font-size: 9px;
                margin-left: 3px;
              ">${tab.unreadCount}</span>` : ''}
              ${tab.channel === 'whisper' ? `<span class="chat-tab-close" data-tab-id="${tab.id}" style="
                margin-left: 5px;
                color: #888;
                cursor: pointer;
              ">×</span>` : ''}
            </div>
          `).join('')}
        </div>

        <!-- Notifications (dentro do chat) -->
        ${this.notifications.length > 0 ? `
        <div style="
          padding: 5px 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          max-height: 80px;
          overflow-y: auto;
        ">
          ${this.notifications.map(notif => `
            <div style="
              background: ${notif.isError ? 'rgba(245, 101, 101, 0.95)' : 'rgba(74, 85, 104, 0.95)'};
              color: #fff;
              padding: 8px 12px;
              border-radius: 6px;
              border-left: 4px solid ${notif.isError ? '#ff0000' : '#4FD1C7'};
              font-size: 12px;
              word-wrap: break-word;
            ">${this.escapeHtml(notif.message)}</div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Confirmation Dialog (dentro do chat) -->
        ${this.confirmationDialog ? `
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        ">
          <div style="
            background: rgba(26, 32, 44, 0.98);
            border: 2px solid #4a5568;
            border-radius: 8px;
            padding: 20px;
            max-width: 350px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          ">
            <div style="
              color: #fff;
              font-size: 14px;
              margin-bottom: 15px;
              word-wrap: break-word;
            ">${this.escapeHtml(this.confirmationDialog.message)}</div>
            <div style="
              display: flex;
              gap: 10px;
              justify-content: flex-end;
            ">
              <button class="chat-confirm-btn" style="
                padding: 8px 16px;
                background: #48bb78;
                border: none;
                border-radius: 4px;
                color: #fff;
                cursor: pointer;
                font-weight: bold;
                font-size: 12px;
              ">Confirmar</button>
              <button class="chat-cancel-btn" style="
                padding: 8px 16px;
                background: #f56565;
                border: none;
                border-radius: 4px;
                color: #fff;
                cursor: pointer;
                font-weight: bold;
                font-size: 12px;
              ">Cancelar</button>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Content (Messages or Friends) -->
        <div style="position: relative;">
        ${this.activeTabId === 'friends' ? this.renderFriendsContent() : `
        <!-- Messages -->
        <div class="chat-messages" style="
          height: 180px;
          overflow-y: auto;
          padding: 10px;
          background: rgba(0, 0, 0, 0.3);
        ">
          ${activeTab?.messages.map(msg => {
            const isWhisper = msg.channel === 'whisper';
            const isSystem = msg.channel === 'system';
            const time = this.formatTime(msg.timestamp);
            const currentUsername = localStorage.getItem('username') || '';
            
            // Para whispers, mostrar indicador diferente
            let whisperPrefix = '';
            if (isWhisper && msg.recipient) {
              // Se o recipient é o usuário atual, significa que recebeu
              // Se o recipient é outro, significa que enviou
              if (msg.recipient === currentUsername) {
                whisperPrefix = `<span style="color: ${CHAT_COLORS.whisper};">[De ${msg.sender}]</span> `;
              } else {
                whisperPrefix = `<span style="color: ${CHAT_COLORS.whisper};">[Para ${msg.recipient}]</span> `;
              }
            }
            
            return `
              <div style="
                margin-bottom: 5px;
                line-height: 1.4;
                word-wrap: break-word;
              ">
                ${isSystem ? '' : `<span style="color: #888; font-size: 10px;">[${time}]</span> `}
                ${whisperPrefix}
                ${!isSystem ? `<span class="chat-username" data-username="${this.escapeHtml(msg.sender)}" style="color: ${isWhisper ? CHAT_COLORS.whisper : '#4FD1C7'}; font-weight: bold; cursor: pointer; text-decoration: underline;" title="Clique para enviar whisper">${this.escapeHtml(msg.sender)}</span>: ` : ''}
                <span style="color: ${msg.color};">${this.escapeHtml(msg.message)}</span>
              </div>
            `;
          }).join('') || '<div style="color: #888; text-align: center; padding: 20px;">Nenhuma mensagem ainda</div>'}
        </div>
        `}
        </div>

        <!-- Input (only show for non-friends tabs) -->
        ${this.activeTabId !== 'friends' ? `
        <div style="
          position: relative;
          display: flex;
          gap: 5px;
          padding: 5px;
          border-top: 1px solid #4a5568;
        ">
          ${this.autocompleteVisible ? `
            <div data-autocomplete-dropdown style="
              position: absolute;
              bottom: 100%;
              left: 5px;
              right: 85px;
              max-height: 150px;
              overflow-y: auto;
              background: rgba(20, 20, 40, 0.98);
              border: 1px solid #4a5568;
              border-radius: 4px;
              box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.5);
              z-index: 10001;
              margin-bottom: 2px;
            ">
              ${this.autocompleteSuggestions.map((nick, index) => `
                <div class="autocomplete-item" data-index="${index}" style="
                  padding: 8px 10px;
                  cursor: pointer;
                  background: ${index === this.autocompleteSelectedIndex ? 'rgba(74, 85, 104, 0.8)' : 'transparent'};
                  color: ${index === this.autocompleteSelectedIndex ? '#4FD1C7' : '#fff'};
                  border-left: 3px solid ${index === this.autocompleteSelectedIndex ? '#4FD1C7' : 'transparent'};
                  font-weight: ${index === this.autocompleteSelectedIndex ? 'bold' : 'normal'};
                  font-family: monospace;
                  font-size: 12px;
                ">
                  @${this.escapeHtml(nick)}
                </div>
              `).join('')}
            </div>
          ` : ''}
          <input type="text" class="chat-input" placeholder="Digite sua mensagem... (/w usuário msg)" style="
            flex: 1;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #4a5568;
            border-radius: 4px;
            padding: 5px 10px;
            color: #fff;
            font-family: monospace;
            font-size: 12px;
          " value="${this.inputValue}">
          <button class="chat-send-btn" style="
            background: #4299e1;
            border: none;
            border-radius: 4px;
            padding: 5px 15px;
            color: #fff;
            cursor: pointer;
            font-weight: bold;
          ">Enviar</button>
        </div>
        ` : ''}
      ` : ''}
    `;

    // Re-setup event listeners após render
    this.setupEventListeners();
    
    // Restaurar posição do scroll após renderizar
    setTimeout(() => {
      const newMessagesContainer = this.container.querySelector('.chat-messages') as HTMLDivElement;
      if (!newMessagesContainer) return;
      
      if (this.preserveScrollOnRender && savedScrollTop > 0) {
        // Preservar posição absoluta (usuário estava lendo mensagens antigas)
        const newScrollHeight = newMessagesContainer.scrollHeight;
        const heightDiff = newScrollHeight - savedScrollHeight;
        
        // Restaurar posição relativa ao topo, ajustando pela diferença de altura
        newMessagesContainer.scrollTop = savedScrollTop + heightDiff;
      } else if (savedScrollHeight > 0 && savedDistanceFromBottom >= 0) {
        // Preservar distância do final (manter posição relativa ao final)
        const newScrollHeight = newMessagesContainer.scrollHeight;
        const newScrollTop = newScrollHeight - savedDistanceFromBottom - newMessagesContainer.clientHeight;
        
        // Só restaurar se a posição calculada é válida
        if (newScrollTop >= 0) {
          newMessagesContainer.scrollTop = newScrollTop;
        }
      }
      
      // Resetar flag após um breve delay
      if (this.preserveScrollOnRender) {
        setTimeout(() => {
          this.preserveScrollOnRender = false;
        }, 50);
      }
    }, 0);
  }

  /**
   * Escape HTML para prevenir XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * PERFORMANCE: Agendar renderização com debounce (evita múltiplas renderizações consecutivas)
   * CORREÇÃO: Debounce mais agressivo apenas para muitas mensagens em sequência
   */
  private scheduleRender(force: boolean = false): void {
    if (force) {
      // Render imediato (para mudanças críticas como mudar de aba, criar nova aba, etc)
      if (this.renderDebounceTimer) {
        clearTimeout(this.renderDebounceTimer);
        this.renderDebounceTimer = null;
      }
      this.pendingRender = false;
      this.render();
      return;
    }

    // Marcar que há uma renderização pendente
    this.pendingRender = true;

    // Se já existe um timer, cancelar e criar um novo
    if (this.renderDebounceTimer) {
      // Já tem um timer rodando, apenas marcar como pendente
      return;
    }

    // CORREÇÃO: Debounce muito leve (5ms) para manter responsividade, mas ainda evitar spam
    this.renderDebounceTimer = window.setTimeout(() => {
      if (this.pendingRender) {
        this.pendingRender = false;
        this.render();
      }
      this.renderDebounceTimer = null;
    }, 5); // Reduzido de 16ms para 5ms - muito mais responsivo
  }

  /**
   * PERFORMANCE: Formatar HTML de uma única mensagem
   */
  private formatMessageHTML(msg: ChatMessage): string {
    const isWhisper = msg.channel === 'whisper';
    const isSystem = msg.channel === 'system';
    const time = this.formatTime(msg.timestamp);
    const currentUsername = localStorage.getItem('username') || '';
    
    let whisperPrefix = '';
    if (isWhisper && msg.recipient) {
      if (msg.recipient === currentUsername) {
        whisperPrefix = `<span style="color: ${CHAT_COLORS.whisper};">[De ${msg.sender}]</span> `;
      } else {
        whisperPrefix = `<span style="color: ${CHAT_COLORS.whisper};">[Para ${msg.recipient}]</span> `;
      }
    }
    
    return `
      <div data-message-id="${msg.id}" style="
        margin-bottom: 5px;
        line-height: 1.4;
        word-wrap: break-word;
      ">
        ${isSystem ? '' : `<span style="color: #888; font-size: 10px;">[${time}]</span> `}
        ${whisperPrefix}
        ${!isSystem ? `<span class="chat-username" data-username="${this.escapeHtml(msg.sender)}" style="color: ${isWhisper ? CHAT_COLORS.whisper : '#4FD1C7'}; font-weight: bold; cursor: pointer; text-decoration: underline;" title="Clique para enviar whisper">${this.escapeHtml(msg.sender)}</span>: ` : ''}
        <span style="color: ${msg.color};">${this.escapeHtml(msg.message)}</span>
      </div>
    `;
  }

  /**
   * PERFORMANCE: Adicionar mensagem incrementalmente ao DOM (ao invés de recriar todo HTML)
   * CORREÇÃO: Mais seguro, verifica melhor se pode usar incremental
   */
  private appendMessageToDOM(msg: ChatMessage, tabId: string, forceFullRender: boolean = false): boolean {
    // Se precisa de render completo, retornar false
    if (forceFullRender) {
      return false;
    }

    // CORREÇÃO: Verificações mais rigorosas antes de usar incremental
    if (tabId !== this.activeTabId || this.activeTabId === 'friends') {
      return false;
    }

    const messagesContainer = this.container.querySelector('.chat-messages') as HTMLDivElement;
    if (!messagesContainer || !messagesContainer.parentElement) {
      return false;
    }

    // Verificar se já existe no DOM (evitar duplicatas)
    if (messagesContainer.querySelector(`[data-message-id="${msg.id}"]`)) {
      return true; // Já existe, não precisa adicionar
    }

    try {
      // Criar elemento da mensagem
      const messageDiv = document.createElement('div');
      messageDiv.innerHTML = this.formatMessageHTML(msg).trim();
      const actualDiv = messageDiv.firstElementChild as HTMLElement;
      
      if (!actualDiv) {
        return false;
      }

      // Adicionar ao final do container
      messagesContainer.appendChild(actualDiv);

      // Atualizar tracking de mensagens renderizadas
      // CORREÇÃO: Garantir que lastRenderedMessageIds existe
      if (!this.lastRenderedMessageIds) {
        this.lastRenderedMessageIds = new Map();
      }
      if (!this.lastRenderedMessageIds.has(tabId)) {
        this.lastRenderedMessageIds.set(tabId, new Set());
      }
      this.lastRenderedMessageIds.get(tabId)!.add(msg.id);

      // PERFORMANCE: Limpar mensagens antigas do DOM (manter apenas últimas 50 visíveis)
      // CORREÇÃO: Mais cuidadoso com limpeza
      if (messagesContainer.children.length > 50) {
        this.cleanupOldDOMMessages(messagesContainer, tabId, 50);
      }

      // Re-setup event listeners apenas para novos elementos
      this.setupMessageEventListeners(actualDiv);

      return true;
    } catch (error) {
      // Em caso de erro, usar render completo
      console.warn('[ChatUI] Error in incremental render, falling back to full render:', error);
      return false;
    }
  }

  /**
   * PERFORMANCE: Limpar mensagens antigas do DOM (mantém apenas últimas N visíveis)
   */
  private cleanupOldDOMMessages(container: HTMLDivElement, tabId: string, maxVisible: number): void {
    const messages = Array.from(container.querySelectorAll('[data-message-id]')) as HTMLElement[];
    
    if (messages.length > maxVisible) {
      // Remover as mensagens mais antigas (do início)
      const toRemove = messages.slice(0, messages.length - maxVisible);
      toRemove.forEach(el => {
        const msgId = el.dataset.messageId;
        if (msgId && this.lastRenderedMessageIds) {
          this.lastRenderedMessageIds.get(tabId)?.delete(msgId);
        }
        el.remove();
      });
    }
  }

  /**
   * PERFORMANCE: Setup event listeners apenas para um elemento (ao invés de todo o container)
   */
  private setupMessageEventListeners(element: HTMLElement): void {
    // Adicionar listener para clicks em usernames (whisper)
    const usernameElements = element.querySelectorAll('.chat-username');
    usernameElements.forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const username = (e.target as HTMLElement).dataset.username;
        if (username) {
          this.createWhisperTab(username);
        }
      });
    });
  }

  /**
   * Verifica mensagens não lidas e atualiza badge
   */
  private checkUnreadMessages(): void {
    const totalUnread = this.tabs.reduce((sum, tab) => sum + tab.unreadCount, 0);
    
    // Atualizar título da aba do navegador se houver mensagens não lidas
    if (totalUnread > 0 && !this.isExpanded) {
      document.title = `(${totalUnread}) Guardian Grove`;
    } else {
      document.title = 'Guardian Grove';
    }
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    this.container.removeEventListener('click', this.clickHandler);
    this.disconnect();
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    document.title = 'Guardian Grove'; // Resetar título
  }
}

