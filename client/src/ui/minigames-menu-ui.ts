/**
 * Menu de Mini-Games - Canvas UI
 */

import type { GameState } from '../types';
import { GLASS_THEME } from './theme';
import { drawText, drawButton, isMouseOver } from './ui-helper';

export type MinigameType = 'memory' | 'recycle' | 'match3';
export type GameDifficulty = 'easy' | 'medium' | 'hard';

export class MinigamesMenuUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();
  private selectedDifficulty: GameDifficulty = 'medium';
  
  public onClose: (() => void) | null = null;
  public onSelectGame: ((game: MinigameType, difficulty: GameDifficulty) => void) | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
      this.mouseY = ((e.clientY - rect.top) / rect.height) * this.canvas.height;
    });
    
    this.canvas.addEventListener('mousedown', () => {
      this.handleClick();
    });
  }
  
  private handleClick() {
    this.buttons.forEach((button) => {
      if (isMouseOver(this.mouseX, this.mouseY, button.x, button.y, button.width, button.height)) {
        if (button.action) {
          button.action();
        }
      }
    });
  }
  
  public draw(gameState: GameState) {
    this.buttons.clear();
    
    // Fundo
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const panelWidth = Math.min(900, this.canvas.width - 100);
    const panelHeight = Math.min(700, this.canvas.height - 100);
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;
    
    // Painel
    const gradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
    gradient.addColorStop(0, 'rgba(12, 38, 25, 0.95)');
    gradient.addColorStop(1, 'rgba(6, 22, 16, 0.95)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    this.ctx.strokeStyle = GLASS_THEME.palette.accent.amber;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Header
    drawText(this.ctx, '🎮 Mini-Games Educativos', panelX + panelWidth / 2, panelY + 50, {
      align: 'center',
      font: 'bold 36px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });
    
    drawText(this.ctx, 'Aprenda enquanto se diverte!', panelX + panelWidth / 2, panelY + 90, {
      align: 'center',
      font: 'bold 18px monospace',
      color: 'rgba(220, 236, 230, 0.7)',
    });
    
    // Botão fechar
    const closeBtnWidth = 120;
    const closeBtnHeight = 40;
    const closeBtnX = panelX + panelWidth - closeBtnWidth - 20;
    const closeBtnY = panelY + 20;
    const closeIsHovered = isMouseOver(this.mouseX, this.mouseY, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight);
    
    drawButton(this.ctx, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight, '✖ Fechar', {
      variant: 'danger',
      isHovered: closeIsHovered,
      fontSize: 16,
    });
    
    this.buttons.set('close', {
      x: closeBtnX,
      y: closeBtnY,
      width: closeBtnWidth,
      height: closeBtnHeight,
      action: () => this.onClose?.(),
    });
    
    // Seletor de dificuldade
    this.drawDifficultySelector(panelX + panelWidth / 2, panelY + 120);
    
    // Cards dos jogos
    this.drawGameCards(panelX, panelY + 180, panelWidth, panelHeight - 220);
  }
  
  private drawDifficultySelector(centerX: number, y: number) {
    drawText(this.ctx, 'Dificuldade:', centerX - 120, y + 5, {
      baseline: 'middle',
      font: 'bold 18px monospace',
      color: GLASS_THEME.palette.accent.green,
    });
    
    const difficulties: { id: GameDifficulty; label: string; reward: string }[] = [
      { id: 'easy', label: 'Fácil', reward: '+100-200' },
      { id: 'medium', label: 'Médio', reward: '+200-400' },
      { id: 'hard', label: 'Difícil', reward: '+400-600' },
    ];
    
    const btnWidth = 100;
    const gap = 10;
    const startX = centerX - (btnWidth * 1.5 + gap);
    
    difficulties.forEach((diff, index) => {
      const btnX = startX + index * (btnWidth + gap);
      const isActive = this.selectedDifficulty === diff.id;
      const isHovered = isMouseOver(this.mouseX, this.mouseY, btnX, y - 15, btnWidth, 40);
      
      drawButton(this.ctx, btnX, y - 15, btnWidth, 40, diff.label, {
        variant: isActive ? 'primary' : 'ghost',
        isHovered: isHovered,
        fontSize: 14,
      });
      
      // Recompensa
      drawText(this.ctx, diff.reward, btnX + btnWidth / 2, y + 35, {
        align: 'center',
        font: '12px monospace',
        color: 'rgba(220, 236, 230, 0.7)',
      });
      
      this.buttons.set(`difficulty_${diff.id}`, {
        x: btnX,
        y: y - 15,
        width: btnWidth,
        height: 40,
        action: () => { this.selectedDifficulty = diff.id; },
      });
    });
  }
  
  private drawGameCards(x: number, y: number, width: number, height: number) {
    const games = [
      {
        id: 'memory' as MinigameType,
        icon: '🌿',
        title: 'Memória Ecológica',
        description: 'Encontre os pares e aprenda sobre sustentabilidade!',
        rewards: '💰 100-400 | 🌿 +5 Conhecimento',
        difficulty: 'Fácil',
      },
      {
        id: 'recycle' as MinigameType,
        icon: '♻️',
        title: 'Recicla Rápido',
        description: 'Organize os resíduos nas lixeiras corretas!',
        rewards: '💰 Por Pontuação | 🌿 +Sustentabilidade',
        difficulty: 'Médio',
        disabled: true, // Em breve
      },
      {
        id: 'match3' as MinigameType,
        icon: '🌱',
        title: 'Planta & Combina',
        description: 'Combine 3 ou mais plantas iguais!',
        rewards: '💰 Por Pontuação | 🌿 +Criatividade',
        difficulty: 'Médio',
        disabled: true, // Em breve
      },
    ];
    
    const cardWidth = (width - 80) / 3;
    const cardHeight = height - 40;
    const gap = 20;
    
    games.forEach((game, index) => {
      const cardX = x + 40 + (index * (cardWidth + gap));
      const cardY = y + 20;
      
      this.drawGameCard(cardX, cardY, cardWidth, cardHeight, game);
    });
  }
  
  private drawGameCard(
    x: number,
    y: number,
    width: number,
    height: number,
    game: any
  ) {
    const isHovered = isMouseOver(this.mouseX, this.mouseY, x, y, width, height);
    const isDisabled = game.disabled;
    
    // Fundo
    this.ctx.fillStyle = isDisabled
      ? 'rgba(42, 119, 96, 0.1)'
      : isHovered
      ? 'rgba(109, 199, 164, 0.25)'
      : 'rgba(42, 119, 96, 0.15)';
    this.ctx.fillRect(x, y, width, height);
    
    // Borda
    this.ctx.strokeStyle = isDisabled
      ? 'rgba(109, 199, 164, 0.3)'
      : GLASS_THEME.palette.accent.green;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x, y, width, height);
    
    // Ícone grande
    drawText(this.ctx, game.icon, x + width / 2, y + 80, {
      align: 'center',
      font: 'bold 80px monospace',
      color: isDisabled ? 'rgba(255, 255, 255, 0.3)' : '#FFFFFF',
    });
    
    // Título
    drawText(this.ctx, game.title, x + width / 2, y + 180, {
      align: 'center',
      font: 'bold 20px monospace',
      color: isDisabled ? 'rgba(220, 236, 230, 0.4)' : GLASS_THEME.palette.accent.green,
    });
    
    // Descrição
    this.drawWrappedText(
      game.description,
      x + 10,
      y + 220,
      width - 20,
      16,
      isDisabled ? 'rgba(183, 221, 205, 0.4)' : 'rgba(183, 221, 205, 0.8)'
    );
    
    // Dificuldade
    drawText(this.ctx, `📊 ${game.difficulty}`, x + width / 2, y + 310, {
      align: 'center',
      font: 'bold 14px monospace',
      color: isDisabled ? 'rgba(220, 236, 230, 0.4)' : GLASS_THEME.palette.accent.amber,
    });
    
    // Recompensas
    this.drawWrappedText(
      game.rewards,
      x + 10,
      y + 345,
      width - 20,
      14,
      isDisabled ? 'rgba(183, 221, 205, 0.4)' : 'rgba(183, 221, 205, 0.9)',
      'center'
    );
    
    // Botão
    if (!isDisabled) {
      const btnWidth = width - 40;
      const btnHeight = 50;
      const btnX = x + 20;
      const btnY = y + height - 70;
      const btnIsHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);
      
      drawButton(this.ctx, btnX, btnY, btnWidth, btnHeight, '🎮 JOGAR', {
        variant: 'primary',
        isHovered: btnIsHovered,
        fontSize: 20,
      });
      
      this.buttons.set(`play_${game.id}`, {
        x: btnX,
        y: btnY,
        width: btnWidth,
        height: btnHeight,
        action: () => this.onSelectGame?.(game.id, this.selectedDifficulty),
      });
    } else {
      // "Em breve"
      drawText(this.ctx, '🔒 EM BREVE', x + width / 2, y + height - 40, {
        align: 'center',
        font: 'bold 16px monospace',
        color: 'rgba(220, 236, 230, 0.4)',
      });
    }
  }
  
  private drawWrappedText(
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number,
    color: string,
    align: 'left' | 'center' = 'left'
  ) {
    this.ctx.font = `${fontSize}px monospace`;
    this.ctx.fillStyle = color;
    
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    const lineHeight = fontSize + 4;
    
    words.forEach(word => {
      const testLine = line + word + ' ';
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && line !== '') {
        const textX = align === 'center' ? x + maxWidth / 2 : x;
        this.ctx.textAlign = align;
        this.ctx.fillText(line, textX, currentY);
        line = word + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    });
    
    const textX = align === 'center' ? x + maxWidth / 2 : x;
    this.ctx.textAlign = align;
    this.ctx.fillText(line, textX, currentY);
    this.ctx.textAlign = 'left'; // Reset
  }
  
  public close() {
    // Cleanup
  }
}

