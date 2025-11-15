/**
 * Jogo da Memória Ecológica - Canvas UI
 */

import type { GameState } from '../types';
import {
  initMemoryGame,
  calculateMemoryReward,
  type MemoryGameState,
  type MemoryCard,
} from '../data/minigames';
import { GLASS_THEME } from './theme';
import { drawText, drawButton, isMouseOver } from './ui-helper';

export class MemoryGameUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();
  
  private gameState: MemoryGameState;
  private startTime: number = Date.now();
  private canFlip = true;
  private showingTip: { card: MemoryCard; timer: number } | null = null;
  
  public onClose: (() => void) | null = null;
  public onComplete: ((reward: any) => void) | null = null;
  
  constructor(canvas: HTMLCanvasElement, difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.gameState = initMemoryGame(difficulty);
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
  
  private flipCard(index: number) {
    if (!this.canFlip) return;
    if (this.gameState.cards[index].isMatched) return;
    if (this.gameState.cards[index].isFlipped) return;
    if (this.gameState.flippedCards.length >= 2) return;
    
    // Vira a carta
    this.gameState.cards[index].isFlipped = true;
    this.gameState.flippedCards.push(index);
    
    // Se virou 2 cartas
    if (this.gameState.flippedCards.length === 2) {
      this.gameState.moves++;
      this.canFlip = false;
      
      const [firstIndex, secondIndex] = this.gameState.flippedCards;
      const firstCard = this.gameState.cards[firstIndex];
      const secondCard = this.gameState.cards[secondIndex];
      
      // Verifica match
      if (firstCard.card.id === secondCard.card.id) {
        // Match!
        setTimeout(() => {
          firstCard.isMatched = true;
          secondCard.isMatched = true;
          this.gameState.matchedPairs++;
          this.gameState.flippedCards = [];
          this.canFlip = true;
          
          // Mostra dica educacional
          this.showingTip = { card: firstCard.card, timer: 2.0 };
          
          // Verifica conclusão
          if (this.gameState.matchedPairs === this.gameState.cards.length / 2) {
            this.gameState.isComplete = true;
            this.completeGame();
          }
        }, 500);
      } else {
        // Não match
        setTimeout(() => {
          firstCard.isFlipped = false;
          secondCard.isFlipped = false;
          this.gameState.flippedCards = [];
          this.canFlip = true;
        }, 1000);
      }
    }
  }
  
  private completeGame() {
    const reward = calculateMemoryReward(this.gameState);
    console.log('[MEMORY] 🎉 Jogo completo! Recompensa:', reward);
    
    // Preparar dados de progresso para conquistas/missões
    const gameData = {
      timeElapsed: this.gameState.timeElapsed,
      moves: this.gameState.moves,
      difficulty: this.gameState.difficulty,
    };
    
    setTimeout(() => {
      if (this.onComplete) {
        this.onComplete({ ...reward, gameData });
      }
    }, 2000);
  }
  
  public draw(gameState: GameState, delta: number = 1 / 60) {
    this.buttons.clear();
    
    // Atualiza tempo
    this.gameState.timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
    
    // Atualiza tip timer
    if (this.showingTip) {
      this.showingTip.timer -= delta;
      if (this.showingTip.timer <= 0) {
        this.showingTip = null;
      }
    }
    
    // Fundo
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const panelWidth = Math.min(1000, this.canvas.width - 100);
    const panelHeight = Math.min(800, this.canvas.height - 100);
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;
    
    // Painel
    const gradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
    gradient.addColorStop(0, 'rgba(12, 38, 25, 0.95)');
    gradient.addColorStop(1, 'rgba(6, 22, 16, 0.95)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    this.ctx.strokeStyle = GLASS_THEME.palette.accent.green;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Header
    drawText(this.ctx, '🌿 Jogo da Memória Ecológica', panelX + panelWidth / 2, panelY + 40, {
      align: 'center',
      font: 'bold 32px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });
    
    // Botão fechar
    const closeBtnWidth = 80;
    const closeBtnHeight = 40;
    const closeBtnX = panelX + panelWidth - closeBtnWidth - 20;
    const closeBtnY = panelY + 20;
    const closeIsHovered = isMouseOver(this.mouseX, this.mouseY, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight);
    
    drawButton(this.ctx, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight, '✖', {
      variant: 'danger',
      isHovered: closeIsHovered,
      fontSize: 24,
    });
    
    this.buttons.set('close', {
      x: closeBtnX,
      y: closeBtnY,
      width: closeBtnWidth,
      height: closeBtnHeight,
      action: () => this.onClose?.(),
    });
    
    // Estatísticas
    this.drawStats(panelX + 30, panelY + 80);
    
    // Grid de cartas
    this.drawCardGrid(panelX, panelY + 140, panelWidth, panelHeight - 180);
    
    // Dica educacional
    if (this.showingTip) {
      this.drawTip(panelX + panelWidth / 2, panelY + panelHeight - 60);
    }
    
    // Conclusão
    if (this.gameState.isComplete) {
      this.drawCompletion(panelX, panelY, panelWidth, panelHeight);
    }
  }
  
  private drawStats(x: number, y: number) {
    const stats = [
      `⏱️ Tempo: ${this.gameState.timeElapsed}s`,
      `🎯 Movimentos: ${this.gameState.moves}`,
      `✅ Pares: ${this.gameState.matchedPairs}/${this.gameState.cards.length / 2}`,
    ];
    
    stats.forEach((stat, i) => {
      drawText(this.ctx, stat, x + (i * 250), y, {
        font: 'bold 18px monospace',
        color: GLASS_THEME.palette.accent.green,
      });
    });
  }
  
  private drawCardGrid(x: number, y: number, width: number, height: number) {
    const cols = this.gameState.difficulty === 'easy' ? 4 : this.gameState.difficulty === 'medium' ? 4 : 6;
    const rows = Math.ceil(this.gameState.cards.length / cols);
    
    const cardWidth = Math.min(100, (width - 60) / cols - 10);
    const cardHeight = cardWidth * 1.2;
    const gap = 10;
    
    const gridWidth = cols * (cardWidth + gap) - gap;
    const gridHeight = rows * (cardHeight + gap) - gap;
    const startX = x + (width - gridWidth) / 2;
    const startY = y + (height - gridHeight) / 2;
    
    this.gameState.cards.forEach((cardData, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const cardX = startX + col * (cardWidth + gap);
      const cardY = startY + row * (cardHeight + gap);
      
      this.drawCard(cardX, cardY, cardWidth, cardHeight, cardData, index);
    });
  }
  
  private drawCard(
    x: number,
    y: number,
    width: number,
    height: number,
    cardData: MemoryGameState['cards'][0],
    index: number
  ) {
    const isHovered = isMouseOver(this.mouseX, this.mouseY, x, y, width, height);
    const canClick = !cardData.isFlipped && !cardData.isMatched && this.canFlip;
    
    // Fundo
    if (cardData.isMatched) {
      this.ctx.fillStyle = 'rgba(109, 199, 164, 0.4)';
    } else if (cardData.isFlipped) {
      this.ctx.fillStyle = 'rgba(109, 199, 164, 0.2)';
    } else {
      this.ctx.fillStyle = isHovered && canClick ? 'rgba(42, 119, 96, 0.3)' : 'rgba(42, 119, 96, 0.15)';
    }
    
    this.ctx.fillRect(x, y, width, height);
    
    // Borda
    this.ctx.strokeStyle = cardData.isMatched
      ? GLASS_THEME.palette.accent.amber
      : GLASS_THEME.palette.accent.green;
    this.ctx.lineWidth = cardData.isMatched ? 3 : 2;
    this.ctx.strokeRect(x, y, width, height);
    
    // Conteúdo
    if (cardData.isFlipped || cardData.isMatched) {
      // Mostra ícone
      drawText(this.ctx, cardData.card.icon, x + width / 2, y + height / 2 + 5, {
        align: 'center',
        baseline: 'middle',
        font: 'bold 48px monospace',
        color: '#FFFFFF',
      });
    } else {
      // Mostra verso
      drawText(this.ctx, '🌿', x + width / 2, y + height / 2 + 5, {
        align: 'center',
        baseline: 'middle',
        font: 'bold 48px monospace',
        color: 'rgba(109, 199, 164, 0.5)',
      });
    }
    
    // Botão clicável
    if (canClick) {
      this.buttons.set(`card_${index}`, {
        x,
        y,
        width,
        height,
        action: () => this.flipCard(index),
      });
    }
  }
  
  private drawTip(x: number, y: number) {
    if (!this.showingTip) return;
    
    const tipText = `💡 ${this.showingTip.card.educationalTip}`;
    
    // Fundo
    this.ctx.fillStyle = 'rgba(109, 199, 164, 0.9)';
    this.ctx.fillRect(x - 300, y - 25, 600, 50);
    
    // Borda
    this.ctx.strokeStyle = GLASS_THEME.palette.accent.amber;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x - 300, y - 25, 600, 50);
    
    // Texto
    drawText(this.ctx, tipText, x, y + 2, {
      align: 'center',
      baseline: 'middle',
      font: 'bold 16px monospace',
      color: '#000000',
    });
  }
  
  private drawCompletion(x: number, y: number, width: number, height: number) {
    // Overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(x, y, width, height);
    
    const reward = calculateMemoryReward(this.gameState);
    
    // Título
    drawText(this.ctx, '🎉 PARABÉNS! 🎉', x + width / 2, y + height / 2 - 80, {
      align: 'center',
      font: 'bold 48px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });
    
    // Estatísticas
    drawText(this.ctx, `⏱️ Tempo: ${this.gameState.timeElapsed}s`, x + width / 2, y + height / 2 - 20, {
      align: 'center',
      font: 'bold 24px monospace',
      color: GLASS_THEME.palette.accent.green,
    });
    
    drawText(this.ctx, `🎯 Movimentos: ${this.gameState.moves}`, x + width / 2, y + height / 2 + 20, {
      align: 'center',
      font: 'bold 24px monospace',
      color: GLASS_THEME.palette.accent.green,
    });
    
    // Recompensas
    drawText(this.ctx, `💰 +${reward.coronas} Coronas`, x + width / 2, y + height / 2 + 70, {
      align: 'center',
      font: 'bold 20px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });
    
    drawText(this.ctx, `⭐ +${reward.xp} XP`, x + width / 2, y + height / 2 + 105, {
      align: 'center',
      font: 'bold 20px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });
  }
  
  public close() {
    // Cleanup
  }
}

