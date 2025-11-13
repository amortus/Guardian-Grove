/**
 * Authentication UI
 * Guardian Grove - Login and Registration
 * Usa inputs HTML reais para funcionalidade completa de seleção e navegação
 */

import { COLORS } from './colors';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';
import { authApi } from '../api/authApi';

type AuthScreen = 'welcome' | 'login' | 'register';

type LayoutRect = { x: number; y: number; width: number; height: number };
type InputLayout = { rect: LayoutRect; errorY: number };

export class AuthUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentScreen: AuthScreen = 'welcome';
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action: () => void }> = new Map();
  
  // HTML Inputs Container
  private inputsContainer: HTMLDivElement;
  private emailInput: HTMLInputElement | null = null;
  private passwordInput: HTMLInputElement | null = null;
  private displayNameInput: HTMLInputElement | null = null;
  private confirmPasswordInput: HTMLInputElement | null = null;
  private errorElements: Map<string, HTMLDivElement> = new Map();
  
  // Form state
  private errorMessage: string = '';
  private isLoading: boolean = false;
  
  // Validação em tempo real
  private fieldErrors: Map<string, string> = new Map();
  private fieldValid: Map<string, boolean> = new Map();

  // Responsividade
  private scale: number = 1;
  private baseWidth: number = 800;
  private baseHeight: number = 700;
  private minScale: number = 0.6;
  private maxScale: number = 1.5;
  
  // Proteção contra loops infinitos
  private isDrawing: boolean = false;
  private isCalculatingScale: boolean = false;
  private resizeTimeout: NodeJS.Timeout | null = null;
  private drawTimeout: NodeJS.Timeout | null = null;
  private pendingDraw: boolean = false;
  
  // CORREÇÃO: Guardar referência do handler de resize para poder remover
  private resizeHandler?: () => void;
  
  // CORREÇÃO CRÍTICA: Flag para prevenir qualquer operação após hide()
  private isHidden: boolean = false;

  // Layout caching para inputs HTML
  private loginLayout: {
    panel: LayoutRect;
    email: InputLayout;
    password: InputLayout;
  } | null = null;

  private registerLayout: {
    panel: LayoutRect;
    email: InputLayout;
    displayName: InputLayout;
    password: InputLayout;
    confirmPassword: InputLayout;
  } | null = null;

  // Callbacks
  public onLoginSuccess: (token: string, user: any) => void = () => {};
  public onRegisterSuccess: (token: string, user: any) => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    // Criar container para inputs HTML
    this.inputsContainer = document.createElement('div');
    this.inputsContainer.id = 'auth-inputs-container';
    this.inputsContainer.setAttribute('data-auth-container', 'true'); // NOVO: Identificador extra
    this.inputsContainer.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 100;
    `;
    document.body.appendChild(this.inputsContainer);
    
    // Garantir que canvas fique acima dos inputs quando necessário
    this.canvas.style.zIndex = '99';
    
    this.setupEventListeners();
    this.calculateScale();
    
    // CORREÇÃO: Guardar referência do handler de resize para poder remover depois
    this.resizeHandler = () => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      this.resizeTimeout = setTimeout(() => {
        this.calculateScale();
      }, 150); // 150ms de debounce
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  private calculateScale() {
    // CORREÇÃO CRÍTICA: Se AuthUI foi escondido, não fazer NADA
    if (this.isHidden) {
      console.warn('[AuthUI] calculateScale() called after hide() - ignoring completely');
      return;
    }
    
    // CORREÇÃO: Proteção contra múltiplas chamadas simultâneas
    if (this.isCalculatingScale) {
      return;
    }
    this.isCalculatingScale = true;

    try {
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;
      const isMobile = containerWidth < 768;
      
      // Para mobile, ajustar baseWidth/baseHeight para melhor experiência
      if (isMobile) {
        this.baseWidth = 600;
        this.baseHeight = 800;
        this.minScale = 0.5;
      } else {
        this.baseWidth = 800;
        this.baseHeight = 700;
        this.minScale = 0.6;
      }
      
      // Calcular escala baseada na menor dimensão para manter proporção
      const scaleX = containerWidth / this.baseWidth;
      const scaleY = containerHeight / this.baseHeight;
      this.scale = Math.min(scaleX, scaleY);
      
      // Limitar escala entre min e max
      this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale));
      
      // Aplicar escala ao canvas
      this.canvas.width = this.baseWidth;
      this.canvas.height = this.baseHeight;
      this.canvas.style.width = `${this.baseWidth * this.scale}px`;
      this.canvas.style.height = `${this.baseHeight * this.scale}px`;
      
      // Centralizar canvas
      this.canvas.style.position = 'absolute';
      this.canvas.style.left = '50%';
      this.canvas.style.top = '50%';
      this.canvas.style.transform = 'translate(-50%, -50%)';
      
      // Aplicar mesma escala e posição do canvas ao container de inputs
      // O container deve ter o mesmo tamanho visual que o canvas
      if (this.inputsContainer) {
        this.inputsContainer.style.width = `${this.baseWidth * this.scale}px`;
        this.inputsContainer.style.height = `${this.baseHeight * this.scale}px`;
        this.inputsContainer.style.transform = 'translate(-50%, -50%)';
      }
      
      // Atualizar posições após um pequeno delay
      requestAnimationFrame(() => {
        this.updateInputPositions();
        this.isCalculatingScale = false;
      });
    } catch (error) {
      console.error('[AuthUI] Error in calculateScale:', error);
      this.isCalculatingScale = false;
    }
  }

  private createInputField(
    name: string,
    type: string,
    placeholder: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): HTMLInputElement {
    // Remover input existente se houver
    const existing = this.inputsContainer.querySelector(`[data-field="${name}"]`) as HTMLInputElement;
    if (existing) {
      existing.remove();
    }

    const input = document.createElement('input');
    input.type = type;
    input.dataset.field = name;
    input.placeholder = placeholder;
    input.autocomplete = type === 'email' ? 'email' : type === 'password' ? 'current-password' : 'off';
    
    // Posicionamento absoluto no container
    input.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${width}px;
      height: ${height}px;
      background: rgba(16, 22, 40, 0.82);
      border: 1.6px solid rgba(148, 163, 184, 0.32);
      border-radius: ${12 * this.scale}px;
      padding: 0 ${40 * this.scale}px 0 ${18 * this.scale}px;
      color: ${COLORS.ui.text};
      font-family: monospace;
      font-size: ${20 * this.scale}px;
      font-weight: bold;
      outline: none;
      pointer-events: all;
      box-sizing: border-box;
      box-shadow: 0 ${10 * this.scale}px ${26 * this.scale}px rgba(5, 10, 20, 0.42);
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      z-index: 101;
    `;

    // Event listeners para validação em tempo real
    input.addEventListener('input', () => {
      this.validateField(name, input.value);
      this.updateInputStyle(input, name);
    });

    input.addEventListener('focus', () => {
      this.updateInputStyle(input, name, true);
    });

    input.addEventListener('blur', () => {
      this.updateInputStyle(input, name, false);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleEnterKey(name);
      }
    });

    this.inputsContainer.appendChild(input);
    
    return input;
  }

  private createErrorElement(name: string, x: number, y: number, width: number): HTMLDivElement {
    const existing = this.errorElements.get(name);
    if (existing) {
      existing.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.dataset.field = name;
    errorDiv.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${width}px;
      color: ${COLORS.ui.error};
      font-family: monospace;
      font-size: 14px;
      pointer-events: none;
      display: none;
    `;

    this.inputsContainer.appendChild(errorDiv);
    this.errorElements.set(name, errorDiv);
    return errorDiv;
  }

  private updateInputStyle(input: HTMLInputElement, fieldName: string, isFocused: boolean = false) {
    const fieldError = this.fieldErrors.get(fieldName);
    const isValid = this.fieldValid.get(fieldName);
    const hasValue = input.value.length > 0;
    const borderAccent = this.currentScreen === 'login' ? 'rgba(167, 139, 250, 0.8)' : 'rgba(72, 187, 120, 0.8)';
    const focusShadow = this.currentScreen === 'login' ? 'rgba(99, 102, 241, 0.32)' : 'rgba(56, 189, 248, 0.28)';

    let finalBorderColor = 'rgba(148, 163, 184, 0.38)';
    if (isFocused) {
      finalBorderColor = borderAccent;
      input.style.background = 'rgba(24, 32, 54, 0.9)';
      input.style.boxShadow = `0 ${12 * this.scale}px ${30 * this.scale}px ${focusShadow}`;
    } else if (fieldError) {
      finalBorderColor = COLORS.ui.error;
      input.style.background = 'rgba(36, 18, 26, 0.92)';
      input.style.boxShadow = `0 ${10 * this.scale}px ${24 * this.scale}px rgba(239, 68, 68, 0.28)`;
    } else if (isValid) {
      finalBorderColor = 'rgba(56, 189, 248, 0.65)';
      input.style.background = 'rgba(20, 28, 52, 0.9)';
      input.style.boxShadow = `0 ${12 * this.scale}px ${26 * this.scale}px rgba(45, 212, 191, 0.18)`;
    } else if (hasValue) {
      input.style.background = 'rgba(18, 24, 42, 0.88)';
      input.style.boxShadow = `0 ${8 * this.scale}px ${22 * this.scale}px rgba(15, 23, 42, 0.26)`;
    } else {
      input.style.background = 'rgba(16, 22, 40, 0.82)';
      input.style.boxShadow = `0 ${10 * this.scale}px ${26 * this.scale}px rgba(5, 10, 20, 0.3)`;
    }

    input.style.borderColor = finalBorderColor;
    input.style.borderWidth = isFocused ? '2.6px' : (hasValue && (isValid || fieldError) ? '2.2px' : '1.6px');

    // Atualizar ícone de validação
    this.updateValidationIcon(input, fieldName, isValid, fieldError, hasValue);
    
    // Atualizar mensagem de erro
    this.updateErrorMessage(fieldName, fieldError);
  }

  private updateValidationIcon(
    _input: HTMLInputElement,
    _fieldName: string,
    _isValid: boolean | undefined,
    _fieldError: string | undefined,
    _hasValue: boolean
  ) {
    // CORREÇÃO: Removido completamente - ícones de validação são desnecessários
    // A validação visual é feita apenas através das bordas e mensagens de erro
    // Parâmetros prefixados com _ para indicar intencionalmente não utilizados
  }

  private updateErrorMessage(fieldName: string, error: string | undefined) {
    const errorEl = this.errorElements.get(fieldName);
    if (errorEl) {
      if (error) {
        errorEl.textContent = error;
        errorEl.style.display = 'block';
      } else {
        errorEl.style.display = 'none';
      }
    }
  }

  private validateField(fieldName: string, value: string) {
    switch (fieldName) {
      case 'email':
        this.validateEmail(value);
        break;
      case 'password':
        this.validatePassword(value);
        break;
      case 'displayName':
        this.validateDisplayName(value);
        break;
      case 'confirmPassword':
        this.validateConfirmPassword(value);
        break;
    }
  }

  private validateEmail(email: string) {
    if (!email) {
      this.fieldErrors.delete('email');
      this.fieldValid.delete('email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.fieldErrors.set('email', 'Email inválido');
      this.fieldValid.set('email', false);
    } else {
      this.fieldErrors.delete('email');
      this.fieldValid.set('email', true);
    }

    const input = this.emailInput;
    if (input) {
      this.updateInputStyle(input, 'email', input === document.activeElement);
    }
  }

  private validatePassword(password: string) {
    if (!password) {
      this.fieldErrors.delete('password');
      this.fieldValid.delete('password');
      if (this.confirmPasswordInput && this.confirmPasswordInput.value) {
        this.validateConfirmPassword(this.confirmPasswordInput.value);
      }
      return;
    }

    if (password.length < 6) {
      this.fieldErrors.set('password', 'Senha deve ter no mínimo 6 caracteres');
      this.fieldValid.set('password', false);
      } else {
      this.fieldErrors.delete('password');
      this.fieldValid.set('password', true);
    }

    // Revalidar confirmação se existir
    if (this.confirmPasswordInput && this.confirmPasswordInput.value) {
      this.validateConfirmPassword(this.confirmPasswordInput.value);
    }

    const input = this.passwordInput;
    if (input) {
      this.updateInputStyle(input, 'password', input === document.activeElement);
    }
  }

  private validateDisplayName(displayName: string) {
    if (!displayName) {
      this.fieldErrors.delete('displayName');
      this.fieldValid.delete('displayName');
      return;
    }

    if (displayName.length < 3) {
      this.fieldErrors.set('displayName', 'Nome deve ter no mínimo 3 caracteres');
      this.fieldValid.set('displayName', false);
    } else if (displayName.length > 20) {
      this.fieldErrors.set('displayName', 'Nome deve ter no máximo 20 caracteres');
      this.fieldValid.set('displayName', false);
    } else {
      this.fieldErrors.delete('displayName');
      this.fieldValid.set('displayName', true);
    }

    const input = this.displayNameInput;
    if (input) {
      this.updateInputStyle(input, 'displayName', input === document.activeElement);
    }
  }

  private validateConfirmPassword(confirmPassword: string) {
    if (!confirmPassword) {
      this.fieldErrors.delete('confirmPassword');
      this.fieldValid.delete('confirmPassword');
      return;
    }

    const password = this.passwordInput?.value || '';
    if (confirmPassword !== password) {
      this.fieldErrors.set('confirmPassword', 'As senhas não coincidem');
      this.fieldValid.set('confirmPassword', false);
    } else {
      this.fieldErrors.delete('confirmPassword');
      this.fieldValid.set('confirmPassword', true);
    }

    const input = this.confirmPasswordInput;
    if (input) {
      this.updateInputStyle(input, 'confirmPassword', input === document.activeElement);
    }
  }

  private handleEnterKey(fieldName: string) {
    // CORREÇÃO: Navegação melhorada com Tab suportado nativamente
    if (this.currentScreen === 'login') {
      if (fieldName === 'email') {
        this.passwordInput?.focus();
      } else if (fieldName === 'password') {
        this.handleLogin();
      }
    } else if (this.currentScreen === 'register') {
      if (fieldName === 'email') {
        this.displayNameInput?.focus();
      } else if (fieldName === 'displayName') {
        this.passwordInput?.focus();
      } else if (fieldName === 'password') {
        this.confirmPasswordInput?.focus();
      } else if (fieldName === 'confirmPassword') {
        this.handleRegister();
      }
    }
  }

  private setupEventListeners() {
    // CORREÇÃO: Guardar referência do handler para poder remover depois
    this.clickHandler = (e: MouseEvent) => this.handleClick(e);
    this.canvas.addEventListener('click', this.clickHandler);
  }
  
  private clickHandler?: (e: MouseEvent) => void;

  private handleClick(e: MouseEvent) {
    // CORREÇÃO: Proteção menos restritiva - apenas se estiver calculando escala (crítico)
    // Permite cliques durante draw() se for uma mudança de tela
    if (this.isCalculatingScale) {
      console.warn('[AuthUI] Click ignored - UI is calculating scale');
      return;
    }
    
    // Ignorar cliques em inputs HTML
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.closest('#auth-inputs-container')) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    
    // CORREÇÃO: O canvas.width/height são as dimensões internas (baseWidth/baseHeight)
    // O rect.width/height são as dimensões visuais (escaladas)
    // Para converter coordenadas de tela para coordenadas do canvas interno:
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    // Coordenadas do mouse em pixels do canvas interno
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check buttons - usar coordenadas do canvas interno
    this.buttons.forEach((btn) => {
      if (isMouseOver(x, y, btn.x, btn.y, btn.width, btn.height)) {
        // Parar propagação
        e.stopPropagation();
        e.preventDefault();
        
        // Executar ação do botão (a proteção está dentro das ações dos botões)
        btn.action();
        return; // Parar após encontrar o botão clicado
      }
    });
  }

  private async handleLogin() {
    if (this.isLoading) return;

    this.errorMessage = '';

    const email = this.emailInput?.value || '';
    const password = this.passwordInput?.value || '';

    if (!email || !password) {
      this.errorMessage = 'Por favor, preencha todos os campos';
      this.draw();
      return;
    }

    this.isLoading = true;
    this.draw();

    try {
      const response = await authApi.login(email, password);
      
      if (response.success && response.data) {
        localStorage.setItem('auth_token', response.data.token);
        this.onLoginSuccess(response.data.token, response.data.user);
      } else {
        this.errorMessage = response.error || 'Erro ao fazer login';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Erro ao conectar com servidor';
    } finally {
      this.isLoading = false;
      this.draw();
    }
  }

  private async handleRegister() {
    if (this.isLoading) return;

    this.errorMessage = '';

    const email = this.emailInput?.value || '';
    const password = this.passwordInput?.value || '';
    const displayName = this.displayNameInput?.value || '';
    const confirmPassword = this.confirmPasswordInput?.value || '';

    if (!email || !password || !displayName) {
      this.errorMessage = 'Por favor, preencha todos os campos';
      this.draw();
      return;
    }

    if (password !== confirmPassword) {
      this.errorMessage = 'As senhas não coincidem';
      this.draw();
      return;
    }

    if (password.length < 6) {
      this.errorMessage = 'Senha deve ter no mínimo 6 caracteres';
      this.draw();
      return;
    }

    this.isLoading = true;
    this.draw();

    try {
      const response = await authApi.register(email, password, displayName);
      
      if (response.success && response.data) {
        localStorage.setItem('auth_token', response.data.token);
        this.onRegisterSuccess(response.data.token, response.data.user);
      } else {
        this.errorMessage = response.error || 'Erro ao registrar';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Erro ao conectar com servidor';
    } finally {
      this.isLoading = false;
      this.draw();
    }
  }

  draw(force: boolean = false) {
    // CORREÇÃO CRÍTICA: Se AuthUI foi escondido, não fazer NADA e limpar inputs
    if (this.isHidden) {
      // Garantir que inputs sejam removidos se ainda existirem
      const authContainers = document.querySelectorAll('#auth-inputs-container');
      if (authContainers.length > 0) {
        authContainers.forEach(c => c.remove());
      }
      return;
    }
    
    // CORREÇÃO: Debounce para evitar múltiplas renderizações rápidas que causam piscar
    // Se force=true, ignora debounce (para mudanças de tela)
    if (!force && this.isDrawing) {
      // Marcar que há um draw pendente e agendar para depois
      this.pendingDraw = true;
      // Agendar draw se não houver um já agendado
      if (!this.drawTimeout) {
        this.drawTimeout = setTimeout(() => {
          this.drawTimeout = null;
          // Só executar se ainda estiver pendente e não estiver desenhando
          if (this.pendingDraw && !this.isDrawing) {
            this.pendingDraw = false;
            this.draw(false);
          }
        }, 50); // 50ms de debounce (reduzido de 100ms para melhor responsividade)
      }
      return;
    }
    
    // Se force=true ou não está desenhando, executar imediatamente
    // Limpar flags de pendência
    if (this.drawTimeout) {
      clearTimeout(this.drawTimeout);
      this.drawTimeout = null;
    }
    this.pendingDraw = false;
    
    this.isDrawing = true;
    
    try {
      // IMPORTANTE: Sempre limpar botões antes de redesenhar para evitar botões órfãos
      this.buttons.clear();

      // Limpar inputs existentes quando mudar de tela para welcome
      if (this.currentScreen === 'welcome') {
        this.clearInputs();
      }

      // Redesenhar a tela atual
      if (this.currentScreen === 'welcome') {
        this.drawWelcomeScreen();
      } else       if (this.currentScreen === 'login') {
        this.drawLoginScreen();
        // Atualizar posições após desenhar
        requestAnimationFrame(() => this.updateInputPositions());
      } else if (this.currentScreen === 'register') {
        this.drawRegisterScreen();
        // Atualizar posições após desenhar
        requestAnimationFrame(() => this.updateInputPositions());
      }
    } catch (error) {
      console.error('[AuthUI] Error in draw():', error);
    } finally {
      // Sempre liberar o flag após um frame para evitar travamentos
      requestAnimationFrame(() => {
        this.isDrawing = false;
        // Se havia um draw pendente e não foi forçado, executar agora
        if (this.pendingDraw && !force) {
          // Pequeno delay para evitar renderizações muito rápidas
          setTimeout(() => {
            if (this.pendingDraw && !this.isDrawing) {
              this.pendingDraw = false;
              this.draw(false);
            }
          }, 16); // ~1 frame a 60fps
        }
      });
    }
  }

  private clearInputs() {
    this.inputsContainer.innerHTML = '';
    this.emailInput = null;
    this.passwordInput = null;
    this.displayNameInput = null;
    this.confirmPasswordInput = null;
    this.errorElements.clear();
  }

  // CORREÇÃO: Método para esconder completamente o AuthUI após login
  // IMPORTANTE: NÃO esconder o canvas, pois ele é compartilhado com GameUI!
  public hide() {
    // CORREÇÃO CRÍTICA: Marcar como escondido PRIMEIRO para prevenir operações
    this.isHidden = true;
    
    console.log('[AuthUI] Hiding AuthUI - removing all listeners and elements');
    
    // CORREÇÃO: Remover resize listener da window IMEDIATAMENTE - CRÍTICO!
    // Este listener estava chamando calculateScale() após resize e bagunçando o canvas
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = undefined;
      console.log('[AuthUI] Resize listener removed');
    }
    
    // Limpar timeouts pendentes IMEDIATAMENTE
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
    if (this.drawTimeout) {
      clearTimeout(this.drawTimeout);
      this.drawTimeout = null;
    }
    
    // Remover click listener do canvas
    if (this.clickHandler && this.canvas) {
      this.canvas.removeEventListener('click', this.clickHandler);
      this.clickHandler = undefined;
    }
    
    // CORREÇÃO AGRESSIVA: Esconder E remover TODOS os containers de auth-inputs
    // 1. Primeiro esconder para garantir que ficam invisíveis IMEDIATAMENTE
    const allAuthContainers = document.querySelectorAll('#auth-inputs-container');
    allAuthContainers.forEach(container => {
      console.log('[AuthUI] Hiding and removing auth-inputs-container from DOM');
      // ESCONDER PRIMEIRO (proteção dupla)
      (container as HTMLElement).style.display = 'none';
      (container as HTMLElement).style.visibility = 'hidden';
      (container as HTMLElement).style.pointerEvents = 'none';
      (container as HTMLElement).style.zIndex = '-9999';
      // DEPOIS REMOVER
      container.remove();
    });
    
    // 2. Remover também por referência
    if (this.inputsContainer) {
      // ESCONDER PRIMEIRO
      this.inputsContainer.style.display = 'none';
      this.inputsContainer.style.visibility = 'hidden';
      this.inputsContainer.style.pointerEvents = 'none';
      this.inputsContainer.style.zIndex = '-9999';
      
      // DEPOIS REMOVER
      if (this.inputsContainer.parentElement) {
        this.inputsContainer.parentElement.removeChild(this.inputsContainer);
      }
    }
    
    // 3. PROTEÇÃO EXTRA: Remover todos os inputs HTML que possam existir
    const allInputs = document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');
    allInputs.forEach(input => {
      const parent = input.closest('#auth-inputs-container');
      if (parent) {
        console.log('[AuthUI] Removing orphan auth input');
        input.remove();
      }
    });
    
    // Limpar referências
    this.clearInputs();
    this.emailInput = null;
    this.passwordInput = null;
    this.displayNameInput = null;
    this.confirmPasswordInput = null;
    this.inputsContainer = null as any;
    
    // Limpar botões
    this.buttons.clear();
    
    // CORREÇÃO: NÃO resetar estilos do canvas aqui - o resizeCanvas() do main.ts cuidará disso
    // Apenas limpar o conteúdo visualmente, mas manter o canvas intacto para o GameUI
    if (this.canvas) {
      // Limpar apenas o conteúdo visual do AuthUI
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        // Não fazer nada aqui - deixar o resizeCanvas() do main.ts reconfigurar tudo
        // Apenas garantir que o contexto está sem transformações do AuthUI
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
    
    console.log('[AuthUI] AuthUI hidden successfully - all listeners removed');
  }

  private updateInputPositions() {
    if (this.currentScreen === 'login') {
      this.updateLoginInputPositions();
    } else if (this.currentScreen === 'register') {
      this.updateRegisterInputPositions();
    }
  }

  private updateLoginInputPositions() {
    const layout = this.loginLayout;
    if (!layout) {
      return;
    }

    const { email, password } = layout;

    if (this.emailInput) {
      const rect = email.rect;
      this.emailInput.style.left = `${rect.x * this.scale}px`;
      this.emailInput.style.top = `${rect.y * this.scale}px`;
      this.emailInput.style.width = `${rect.width * this.scale}px`;
      this.emailInput.style.height = `${rect.height * this.scale}px`;
      this.emailInput.style.fontSize = `${20 * this.scale}px`;
      this.emailInput.style.padding = `0 ${40 * this.scale}px 0 ${18 * this.scale}px`;
      
      const errorEl = this.errorElements.get('email');
      if (errorEl) {
        errorEl.style.left = `${rect.x * this.scale}px`;
        errorEl.style.top = `${email.errorY * this.scale}px`;
        errorEl.style.width = `${rect.width * this.scale}px`;
        errorEl.style.fontSize = `${14 * this.scale}px`;
      }
    }

    if (this.passwordInput) {
      const rect = password.rect;
      this.passwordInput.style.left = `${rect.x * this.scale}px`;
      this.passwordInput.style.top = `${rect.y * this.scale}px`;
      this.passwordInput.style.width = `${rect.width * this.scale}px`;
      this.passwordInput.style.height = `${rect.height * this.scale}px`;
      this.passwordInput.style.fontSize = `${20 * this.scale}px`;
      this.passwordInput.style.padding = `0 ${40 * this.scale}px 0 ${18 * this.scale}px`;
      
      const errorEl = this.errorElements.get('password');
      if (errorEl) {
        errorEl.style.left = `${rect.x * this.scale}px`;
        errorEl.style.top = `${password.errorY * this.scale}px`;
        errorEl.style.width = `${rect.width * this.scale}px`;
        errorEl.style.fontSize = `${14 * this.scale}px`;
      }
    }
  }

  private updateRegisterInputPositions() {
    const layout = this.registerLayout;
    if (!layout) {
      return;
    }

    const applyLayout = (
      input: HTMLInputElement | null,
      layoutItem: InputLayout,
      errorKey: string,
    ) => {
      if (!input) return;
      const rect = layoutItem.rect;
      input.style.left = `${rect.x * this.scale}px`;
      input.style.top = `${rect.y * this.scale}px`;
      input.style.width = `${rect.width * this.scale}px`;
      input.style.height = `${rect.height * this.scale}px`;
      input.style.fontSize = `${20 * this.scale}px`;
      input.style.padding = `0 ${40 * this.scale}px 0 ${18 * this.scale}px`;

      const errorEl = this.errorElements.get(errorKey);
      if (errorEl) {
        errorEl.style.left = `${rect.x * this.scale}px`;
        errorEl.style.top = `${layoutItem.errorY * this.scale}px`;
        errorEl.style.width = `${rect.width * this.scale}px`;
        errorEl.style.fontSize = `${14 * this.scale}px`;
      }
    };

    applyLayout(this.emailInput, layout.email, 'email');
    applyLayout(this.displayNameInput, layout.displayName, 'displayName');
    applyLayout(this.passwordInput, layout.password, 'password');
    applyLayout(this.confirmPasswordInput, layout.confirmPassword, 'confirmPassword');
  }

  private drawWelcomeScreen() {
    const isMobile = window.innerWidth < 768;
    const panelWidth = isMobile ? 550 : 700;
    const panelHeight = isMobile ? 700 : 650;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    // Panel with shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    this.ctx.shadowBlur = 30;
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: '#1a1a2e',
      borderColor: COLORS.primary.gold
    });
    this.ctx.shadowBlur = 0;

    // Title (larger)
    drawText(this.ctx, '🐉 GUARDIAN GROVE', panelX + panelWidth / 2, panelY + 90, {
      font: 'bold 48px monospace',
      color: COLORS.primary.gold,
      align: 'center'
    });

    // Subtitle
    drawText(this.ctx, 'Bem-vindo ao mundo de Aurath', panelX + panelWidth / 2, panelY + 150, {
      font: 'bold 22px monospace',
      color: COLORS.ui.text,
      align: 'center'
    });

    // Description
    const descriptions = [
      'Crie, treine e batalhe com criaturas místicas.',
      'Explore zonas perigosas, participe de torneios,',
      'e prove seu valor como Guardião!'
    ];
    descriptions.forEach((desc, i) => {
      drawText(this.ctx, desc, panelX + panelWidth / 2, panelY + 200 + i * 25, {
        font: '16px monospace',
        color: COLORS.ui.textDim,
        align: 'center'
      });
    });

    // Separator line
    this.ctx.strokeStyle = COLORS.primary.gold;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(panelX + 150, panelY + 300);
    this.ctx.lineTo(panelX + panelWidth - 150, panelY + 300);
    this.ctx.stroke();

    // CORREÇÃO: Ajustar tamanho dos botões para não ultrapassar o painel
    // panelWidth pode ser 700 (desktop) ou 550 (mobile)
    // Usar largura dinâmica baseada no painel
    const buttonPadding = isMobile ? 50 : 100;
    const buttonWidth = panelWidth - (buttonPadding * 2);
    const buttonX = panelX + buttonPadding;

    // Login button
    const loginBtnY = panelY + 340;
    drawButton(this.ctx, buttonX, loginBtnY, buttonWidth, 60, '🔐 Entrar', {
      bgColor: COLORS.primary.purple,
      hoverColor: COLORS.primary.purpleDark
    });
    this.buttons.set('login', {
      x: buttonX,
      y: loginBtnY,
      width: buttonWidth,
      height: 60,
      action: () => {
        // CORREÇÃO: Proteção contra múltiplos cliques - mas menos restritiva
        if (this.currentScreen === 'login') {
          // Já está na tela de login, não precisa fazer nada
          return;
        }
        
        console.log('[AuthUI] Switching to login screen');
        this.currentScreen = 'login';
        // Limpar inputs quando mudar para login
        this.clearInputs();
        // CORREÇÃO: Forçar draw imediatamente para mudança de tela (sem debounce)
        this.draw(true);
      }
    });

    // Register button
    const registerBtnY = panelY + 420;
    drawButton(this.ctx, buttonX, registerBtnY, buttonWidth, 60, '✨ Criar Conta', {
      bgColor: COLORS.primary.green,
      hoverColor: '#2d8659'
    });
    this.buttons.set('register', {
      x: buttonX,
      y: registerBtnY,
      width: buttonWidth,
      height: 60,
      action: () => {
        // CORREÇÃO: Proteção contra múltiplos cliques - mas menos restritiva
        if (this.currentScreen === 'register') {
          // Já está na tela de registro, não precisa fazer nada
          return;
        }
        
        console.log('[AuthUI] Switching to register screen');
        this.currentScreen = 'register';
        // Limpar inputs quando mudar para registro
        this.clearInputs();
        // CORREÇÃO: Forçar draw imediatamente para mudança de tela (sem debounce)
        this.draw(true);
      }
    });

    // Google button - usar mesmo tamanho dos outros botões
    const googleBtnY = panelY + 520;
    drawButton(this.ctx, buttonX, googleBtnY, buttonWidth, 60, '🔗 Entrar com Google', {
      bgColor: '#4285f4',
      hoverColor: '#357ae8'
    });
    this.buttons.set('google', {
      x: buttonX,
      y: googleBtnY,
      width: buttonWidth,
      height: 60,
      action: () => {
        authApi.googleLogin();
      }
    });

    // Note
    drawText(this.ctx, '(Google OAuth não configurado)', panelX + panelWidth / 2, panelY + 595, {
      font: '12px monospace',
      color: COLORS.ui.textDim,
      align: 'center'
    });
  }

  private drawLoginScreen() {
    const isMobile = window.innerWidth < 768;
    const panelWidth = isMobile ? 520 : 660;
    const panelHeight = isMobile ? 620 : 600;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      variant: 'popup',
      alpha: 0.92,
      highlightIntensity: 0.22,
      borderWidth: 1.2,
      shadow: { color: 'rgba(6, 10, 26, 0.6)', blur: 32, offsetX: 0, offsetY: 18 },
    });

    // Title
    drawText(this.ctx, '🔐 LOGIN', panelX + panelWidth / 2, panelY + 68, {
      font: isMobile ? 'bold 40px monospace' : 'bold 44px monospace',
      color: '#E8EDFF',
      align: 'center',
      shadow: false,
    });

    // Subtitle
    drawText(this.ctx, 'Entre com sua conta', panelX + panelWidth / 2, panelY + 118, {
      font: '16px monospace',
      color: 'rgba(198, 210, 238, 0.72)',
      align: 'center',
      shadow: false,
    });

    // Layout base
    const fieldWidth = panelWidth - (isMobile ? 120 : 140);
    const fieldHeight = isMobile ? 48 : 56;
    const fieldX = panelX + (panelWidth - fieldWidth) / 2;

    const emailLabelY = panelY + 165;
    const emailInputY = emailLabelY + 26;

    // Email label
    drawText(this.ctx, 'Email', fieldX, emailLabelY, {
      font: isMobile ? 'bold 15px monospace' : 'bold 16px monospace',
      color: 'rgba(226, 232, 255, 0.82)',
      shadow: false,
    });

    // Email input - sempre atualizar posição
    if (!this.emailInput) {
      this.emailInput = this.createInputField('email', 'email', 'Digite seu email...', fieldX, emailInputY, fieldWidth, fieldHeight);
      this.createErrorElement('email', fieldX, emailInputY + fieldHeight + 6, fieldWidth);
    }

    // Password label
    let passwordLabelY = emailInputY + fieldHeight + 50;
    if (this.fieldErrors.get('email')) passwordLabelY += 26;

    drawText(this.ctx, 'Senha', fieldX, passwordLabelY, {
      font: isMobile ? 'bold 15px monospace' : 'bold 16px monospace',
      color: 'rgba(226, 232, 255, 0.82)',
      shadow: false,
    });

    const passwordInputY = passwordLabelY + 26;

    if (!this.passwordInput) {
      this.passwordInput = this.createInputField('password', 'password', 'Digite sua senha...', fieldX, passwordInputY, fieldWidth, fieldHeight);
      this.createErrorElement('password', fieldX, passwordInputY + fieldHeight + 6, fieldWidth);
    }

    // Error message
    if (this.errorMessage) {
      drawText(this.ctx, this.errorMessage, panelX + panelWidth / 2, passwordInputY + fieldHeight + 60, {
        font: 'bold 15px monospace',
        color: COLORS.ui.error,
        align: 'center',
        shadow: false,
      });
    }

    // Botões
    const buttonPadding = isMobile ? 60 : 90;
    const buttonWidth = panelWidth - buttonPadding * 2;
    const buttonX = panelX + buttonPadding;

    const buttonBaseY = passwordInputY + fieldHeight + (this.errorMessage ? 100 : 80);

    const loginBtnY = buttonBaseY;
    const btnText = this.isLoading ? '⏳ Entrando...' : 'Entrar';
    drawButton(this.ctx, buttonX, loginBtnY, buttonWidth, 60, btnText, {
      bgColor: 'rgba(134, 90, 255, 0.55)',
      hoverColor: 'rgba(162, 120, 255, 0.65)',
      textColor: '#EEF1FF',
      isDisabled: this.isLoading,
      shadow: false,
      flat: true,
    });
    if (!this.isLoading) {
      this.buttons.set('submit', {
        x: buttonX,
        y: loginBtnY,
        width: buttonWidth,
        height: 60,
        action: () => this.handleLogin()
      });
    }

    const backBtnY = loginBtnY + 78;
    const backButtonPadding = isMobile ? 110 : 150;
    const backButtonWidth = panelWidth - backButtonPadding * 2;
    const backButtonX = panelX + backButtonPadding;
    drawButton(this.ctx, backButtonX, backBtnY, backButtonWidth, 48, '← Voltar', {
      bgColor: 'rgba(82, 98, 140, 0.35)',
      hoverColor: 'rgba(96, 112, 156, 0.42)',
      textColor: '#E8EDFF',
      shadow: false,
      flat: true,
    });
    this.buttons.set('back', {
      x: backButtonX,
      y: backBtnY,
      width: backButtonWidth,
      height: 48,
      action: () => {
        // CORREÇÃO: Proteção similar às outras ações
        if (this.currentScreen === 'welcome') {
          return;
        }
        this.currentScreen = 'welcome';
        this.clearInputs();
        this.clearForm();
        // CORREÇÃO: Forçar draw imediatamente para mudança de tela (sem debounce)
        this.draw(true);
      }
    });

    this.loginLayout = {
      panel: { x: panelX, y: panelY, width: panelWidth, height: panelHeight },
      email: {
        rect: { x: fieldX, y: emailInputY, width: fieldWidth, height: fieldHeight },
        errorY: emailInputY + fieldHeight + 6,
      },
      password: {
        rect: { x: fieldX, y: passwordInputY, width: fieldWidth, height: fieldHeight },
        errorY: passwordInputY + fieldHeight + 6,
      },
    };

    this.updateInputPositions();
  }

  private drawRegisterScreen() {
    const isMobile = window.innerWidth < 768;
    const panelWidth = isMobile ? 540 : 720;
    const panelHeight = isMobile ? Math.min(820, this.canvas.height - 20) : 720;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      variant: 'popup',
      alpha: 0.92,
      highlightIntensity: 0.2,
      borderWidth: 1.2,
      shadow: { color: 'rgba(6, 16, 32, 0.58)', blur: 30, offsetX: 0, offsetY: 18 },
    });

    drawText(this.ctx, '✨ CRIAR CONTA', panelX + panelWidth / 2, panelY + 70, {
      font: isMobile ? 'bold 34px monospace' : 'bold 38px monospace',
      color: '#E8FFFB',
      align: 'center',
      shadow: false,
    });

    drawText(this.ctx, 'Registre-se para começar sua jornada', panelX + panelWidth / 2, panelY + 112, {
      font: '16px monospace',
      color: 'rgba(198, 210, 238, 0.7)',
      align: 'center',
      shadow: false,
    });

    const fieldWidth = panelWidth - (isMobile ? 110 : 140);
    const fieldHeight = isMobile ? 48 : 56;
    const fieldX = panelX + (panelWidth - fieldWidth) / 2;
    let currentY = panelY + 170;

    let emailLayout: InputLayout | null = null;
    let displayLayout: InputLayout | null = null;
    let passwordLayout: InputLayout | null = null;
    let confirmLayout: InputLayout | null = null;

    drawText(this.ctx, 'Email', fieldX, currentY - 24, {
      font: isMobile ? 'bold 15px monospace' : 'bold 16px monospace',
      color: 'rgba(226, 232, 255, 0.82)',
      shadow: false,
    });

    if (!this.emailInput) {
      this.emailInput = this.createInputField('email', 'email', 'Digite seu email...', fieldX, currentY, fieldWidth, fieldHeight);
      this.createErrorElement('email', fieldX, currentY + fieldHeight + 6, fieldWidth);
    }
    emailLayout = {
      rect: { x: fieldX, y: currentY, width: fieldWidth, height: fieldHeight },
      errorY: currentY + fieldHeight + 6,
    };
    if (this.fieldErrors.get('email')) currentY += 25;

    currentY += fieldHeight + 70;
    drawText(this.ctx, 'Nome do Guardião', fieldX, currentY - 24, {
      font: isMobile ? 'bold 15px monospace' : 'bold 16px monospace',
      color: 'rgba(226, 232, 255, 0.82)',
      shadow: false,
    });

    if (!this.displayNameInput) {
      this.displayNameInput = this.createInputField('displayName', 'text', 'Digite seu nome...', fieldX, currentY, fieldWidth, fieldHeight);
      this.createErrorElement('displayName', fieldX, currentY + fieldHeight + 6, fieldWidth);
    }
    displayLayout = {
      rect: { x: fieldX, y: currentY, width: fieldWidth, height: fieldHeight },
      errorY: currentY + fieldHeight + 6,
    };
    if (this.fieldErrors.get('displayName')) currentY += 25;

    currentY += fieldHeight + 70;
    drawText(this.ctx, 'Senha (mín. 6 caracteres)', fieldX, currentY - 24, {
      font: isMobile ? 'bold 15px monospace' : 'bold 16px monospace',
      color: 'rgba(226, 232, 255, 0.82)',
      shadow: false,
    });

    if (!this.passwordInput) {
      this.passwordInput = this.createInputField('password', 'password', 'Digite sua senha...', fieldX, currentY, fieldWidth, fieldHeight);
      this.createErrorElement('password', fieldX, currentY + fieldHeight + 6, fieldWidth);
    }
    passwordLayout = {
      rect: { x: fieldX, y: currentY, width: fieldWidth, height: fieldHeight },
      errorY: currentY + fieldHeight + 6,
    };
    if (this.fieldErrors.get('password')) currentY += 25;

    currentY += fieldHeight + 70;
    drawText(this.ctx, 'Confirmar Senha', fieldX, currentY - 24, {
      font: isMobile ? 'bold 15px monospace' : 'bold 16px monospace',
      color: 'rgba(226, 232, 255, 0.82)',
      shadow: false,
    });

    if (!this.confirmPasswordInput) {
      this.confirmPasswordInput = this.createInputField('confirmPassword', 'password', 'Confirme sua senha...', fieldX, currentY, fieldWidth, fieldHeight);
      this.createErrorElement('confirmPassword', fieldX, currentY + fieldHeight + 6, fieldWidth);
    }
    confirmLayout = {
      rect: { x: fieldX, y: currentY, width: fieldWidth, height: fieldHeight },
      errorY: currentY + fieldHeight + 6,
    };

    if (this.errorMessage) {
      currentY += 60;
      drawText(this.ctx, this.errorMessage, panelX + panelWidth / 2, currentY, {
        font: 'bold 15px monospace',
        color: COLORS.ui.error,
        align: 'center',
        shadow: false,
      });
    }

    const buttonPadding = isMobile ? 60 : 90;
    const buttonWidth = panelWidth - buttonPadding * 2;
    const buttonX = panelX + buttonPadding;

    const registerBtnY = currentY + (this.errorMessage ? 80 : 70);
    const btnText = this.isLoading ? '⏳ Criando conta...' : 'Criar Conta';
    drawButton(this.ctx, buttonX, registerBtnY, buttonWidth, 60, btnText, {
      bgColor: 'rgba(34, 197, 94, 0.55)',
      hoverColor: 'rgba(52, 211, 153, 0.6)',
      textColor: '#EFFDF7',
      isDisabled: this.isLoading,
      shadow: false,
      flat: true,
    });
    if (!this.isLoading) {
      this.buttons.set('submit', {
        x: buttonX,
        y: registerBtnY,
        width: buttonWidth,
        height: 60,
        action: () => this.handleRegister(),
      });
    }

    const backBtnY = registerBtnY + 78;
    const backButtonPadding = isMobile ? 110 : 150;
    const backButtonWidth = panelWidth - backButtonPadding * 2;
    const backButtonX = panelX + backButtonPadding;
    drawButton(this.ctx, backButtonX, backBtnY, backButtonWidth, 48, '← Voltar', {
      bgColor: 'rgba(82, 98, 140, 0.35)',
      hoverColor: 'rgba(96, 112, 156, 0.42)',
      textColor: '#E8EDFF',
      shadow: false,
      flat: true,
    });
    this.buttons.set('back', {
      x: backButtonX,
      y: backBtnY,
      width: backButtonWidth,
      height: 48,
      action: () => {
        if (this.currentScreen === 'welcome') {
          return;
        }
        this.currentScreen = 'welcome';
        this.clearInputs();
        this.clearForm();
        this.draw(true);
      },
    });

    this.registerLayout = {
      panel: { x: panelX, y: panelY, width: panelWidth, height: panelHeight },
      email: emailLayout!,
      displayName: displayLayout!,
      password: passwordLayout!,
      confirmPassword: confirmLayout!,
    };

    this.updateInputPositions();
  }

  private clearForm() {
    this.errorMessage = '';
    this.fieldErrors.clear();
    this.fieldValid.clear();
  }

  public checkOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      localStorage.setItem('auth_token', token);
      // Get user data
      authApi.getMe().then(response => {
        if (response.success && response.data) {
          this.onLoginSuccess(token, response.data);
        }
      }).catch(() => {
        this.errorMessage = 'Erro ao obter dados do usuário';
        this.draw();
      });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error) {
      let errorMsg = 'Erro na autenticação';
      switch (error) {
        case 'oauth_not_configured':
          errorMsg = 'Autenticação Google não está configurada no servidor';
          break;
        case 'auth_failed':
          errorMsg = 'Falha na autenticação com Google';
          break;
        case 'server_error':
          errorMsg = 'Erro no servidor durante autenticação';
          break;
        default:
          errorMsg = 'Erro na autenticação com Google';
      }
      this.errorMessage = errorMsg;
      this.draw();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  public destroy() {
    // Limpar inputs quando o componente for destruído
    if (this.inputsContainer && this.inputsContainer.parentElement) {
      this.inputsContainer.remove();
    }
  }
}
