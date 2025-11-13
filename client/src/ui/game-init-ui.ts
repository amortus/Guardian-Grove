/**
 * Game Initialization UI
 * Guardian Grove - First time setup after registration
 */

import { COLORS } from './colors';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';
import { gameApi } from '../api/gameApi';

export class GameInitUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action: () => void }> = new Map();
  
  private playerName: string = '';
  private activeField: boolean = false;
  private errorMessage: string = '';
  private isLoading: boolean = false;

  public onInitComplete: (gameSave: any, initialBeast: any) => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupEventListeners();
  }

  public reset() {
    this.playerName = '';
    this.activeField = false;
    this.errorMessage = '';
    this.isLoading = false;
  }

  private setupEventListeners() {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    window.addEventListener('keydown', (e) => this.handleKeyPress(e));
  }

  private handleClick(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check buttons
    this.buttons.forEach((btn) => {
      if (isMouseOver(x, y, btn.x, btn.y, btn.width, btn.height)) {
        btn.action();
      }
    });

    // Check input field
    const panelWidth = 800;
    const panelHeight = 650;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;
    const fieldWidth = 600;
    const fieldHeight = 70;
    const fieldX = panelX + (panelWidth - fieldWidth) / 2;
    const fieldY = panelY + 400;

    if (isMouseOver(x, y, fieldX, fieldY, fieldWidth, fieldHeight)) {
      this.activeField = true;
    } else {
      this.activeField = false;
    }
  }

  private handleKeyPress(e: KeyboardEvent) {
    if (!this.activeField) {
      // Auto-focus field on any key press
      if (e.key.length === 1 || e.key === 'Backspace') {
        this.activeField = true;
      }
    }

    if (!this.activeField) return;

    if (e.key === 'Escape') {
      this.activeField = false;
      return;
    }

    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      this.handleInitialize();
      return;
    }

    if (e.key === 'Backspace') {
      this.playerName = this.playerName.slice(0, -1);
      return;
    }

    if (e.key.length === 1 && this.playerName.length < 20) {
      this.playerName += e.key;
    }
  }

  private async handleInitialize() {
    if (this.isLoading) return;

    this.errorMessage = '';

    if (!this.playerName || this.playerName.trim().length === 0) {
      this.errorMessage = 'Por favor, digite um nome para seu Guardião';
      return;
    }

    if (this.playerName.trim().length < 3) {
      this.errorMessage = 'Nome deve ter no mínimo 3 caracteres';
      return;
    }

    this.isLoading = true;

    try {
      // Verificar se token existe antes de tentar inicializar
      const token = localStorage.getItem('auth_token');
      if (!token) {
        this.errorMessage = 'Erro: Token de autenticação não encontrado. Por favor, faça login novamente.';
        this.isLoading = false;
        return;
      }
      
      console.log('[GameInit] Attempting to initialize game for:', this.playerName.trim());
      const response = await gameApi.initializeGame(this.playerName.trim());
      
      if (response.success && response.data) {
        console.log('[GameInit] Game initialized successfully');
        this.onInitComplete(response.data.gameSave, response.data.initialBeast);
      } else {
        this.errorMessage = response.error || 'Erro ao inicializar jogo';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Erro ao conectar com servidor';
    } finally {
      this.isLoading = false;
    }
  }

  draw() {
    this.buttons.clear();

    const panelWidth = 800;
    const panelHeight = 650;
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

    // Title (larger icon + text)
    drawText(this.ctx, '🐉 BEM-VINDO, GUARDIÃO!', panelX + panelWidth / 2, panelY + 90, {
      font: 'bold 48px monospace',
      color: COLORS.primary.gold,
      align: 'center'
    });

    // Subtitle
    drawText(this.ctx, 'Você está prestes a embarcar em uma jornada épica', panelX + panelWidth / 2, panelY + 160, {
      font: '18px monospace',
      color: COLORS.ui.text,
      align: 'center'
    });

    // Description lines (bem espaçado)
    const lines = [
      'Uma Besta será atribuída a você aleatoriamente.',
      'Cuide dela, treine-a e prove seu valor como Guardião!'
    ];

    lines.forEach((line, i) => {
      drawText(this.ctx, line, panelX + panelWidth / 2, panelY + 220 + i * 30, {
        font: '16px monospace',
        color: COLORS.ui.textDim,
        align: 'center'
      });
    });

    // Separator line
    this.ctx.strokeStyle = COLORS.primary.gold;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(panelX + 150, panelY + 310);
    this.ctx.lineTo(panelX + panelWidth - 150, panelY + 310);
    this.ctx.stroke();

    // Input field label
    drawText(this.ctx, 'Digite o nome do seu Guardião:', panelX + panelWidth / 2, panelY + 360, {
      font: 'bold 20px monospace',
      color: COLORS.primary.gold,
      align: 'center'
    });

    // Input field (GRANDE E BEM VISÍVEL)
    const fieldWidth = 600;
    const fieldHeight = 70;
    const fieldX = panelX + (panelWidth - fieldWidth) / 2;
    const fieldY = panelY + 400;

    // Shadow when active
    if (this.activeField) {
      this.ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
      this.ctx.shadowBlur = 20;
    }

    // Gradient background
    const gradient = this.ctx.createLinearGradient(fieldX, fieldY, fieldX, fieldY + fieldHeight);
    gradient.addColorStop(0, this.activeField ? '#2a2a3e' : '#1a1a2e');
    gradient.addColorStop(1, this.activeField ? '#1f1f2e' : '#0f0f1e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(fieldX, fieldY, fieldWidth, fieldHeight);

    // Border (thick when active)
    this.ctx.strokeStyle = this.activeField ? COLORS.primary.gold : COLORS.ui.textDim;
    this.ctx.lineWidth = this.activeField ? 5 : 2;
    this.ctx.strokeRect(fieldX, fieldY, fieldWidth, fieldHeight);
    this.ctx.shadowBlur = 0;

    // Inner glow when active
    if (this.activeField) {
      this.ctx.strokeStyle = COLORS.primary.gold;
      this.ctx.lineWidth = 1;
      this.ctx.globalAlpha = 0.3;
      this.ctx.strokeRect(fieldX + 4, fieldY + 4, fieldWidth - 8, fieldHeight - 8);
      this.ctx.globalAlpha = 1;
    }

    // Input text (GRANDE)
    drawText(this.ctx, this.playerName || 'Clique para digitar...', fieldX + 25, fieldY + 45, {
      font: this.playerName ? 'bold 24px monospace' : '20px monospace',
      color: this.playerName ? COLORS.ui.text : COLORS.ui.textDim
    });

    // Cursor (blinking, large)
    if (this.activeField && Math.floor(Date.now() / 500) % 2 === 0) {
      this.ctx.font = 'bold 24px monospace';
      const textWidth = this.ctx.measureText(this.playerName).width;
      this.ctx.fillStyle = COLORS.primary.gold;
      this.ctx.fillRect(fieldX + 25 + textWidth, fieldY + 20, 4, 35);
    }

    // Tab/Enter hint
    if (this.activeField) {
      drawText(this.ctx, '(Enter para continuar)', fieldX + fieldWidth - 180, fieldY + fieldHeight + 25, {
        font: '14px monospace',
        color: COLORS.primary.gold
      });
    }

    // Error message
    if (this.errorMessage) {
      drawText(this.ctx, this.errorMessage, panelX + panelWidth / 2, panelY + 500, {
        font: 'bold 16px monospace',
        color: COLORS.ui.error,
        align: 'center'
      });
    }

    // Initialize button (GRANDE)
    const initBtnY = panelY + 540;
    const btnText = this.isLoading ? '⏳ Iniciando jogo...' : '▶ Começar Jornada!';
    drawButton(this.ctx, panelX + 200, initBtnY, 400, 60, btnText, {
      bgColor: COLORS.primary.gold,
      hoverColor: '#d4af37',
      isDisabled: this.isLoading
    });
    if (!this.isLoading) {
      this.buttons.set('init', {
        x: panelX + 200,
        y: initBtnY,
        width: 400,
        height: 60,
        action: () => this.handleInitialize()
      });
    }
  }
}

