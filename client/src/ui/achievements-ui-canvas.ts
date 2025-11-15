/**
 * UI de Conquistas - Canvas/Three.js integrado
 */

import type { GameState } from '../types';
import { ACHIEVEMENTS, type Achievement, getTierColor, getAchievementProgress } from '../data/achievements';
import { GLASS_THEME } from './theme';
import { drawText, drawButton, isMouseOver } from './ui-helper';

export class AchievementsUICanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private scrollOffset = 0;
  private selectedCategory: Achievement['category'] | 'all' = 'all';
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();
  
  public onClose: (() => void) | null = null;
  
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
    
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.scrollOffset += e.deltaY * 0.5;
      this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.getMaxScroll()));
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
  
  private getMaxScroll(): number {
    // Calcula scroll máximo baseado no número de conquistas
    const achievements = this.getFilteredAchievements();
    const rows = Math.ceil(achievements.length / 2);
    const contentHeight = rows * 180 + 200;
    return Math.max(0, contentHeight - (this.canvas.height - 300));
  }
  
  private getFilteredAchievements(): Achievement[] {
    return ACHIEVEMENTS
      .map(a => ({ ...a, requirement: { ...a.requirement }, isUnlocked: false }))
      .filter(a => this.selectedCategory === 'all' || a.category === this.selectedCategory);
  }
  
  public draw(gameState: GameState) {
    this.buttons.clear();
    
    // Fundo escuro semi-transparente
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const panelWidth = Math.min(1200, this.canvas.width - 100);
    const panelHeight = this.canvas.height - 100;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = 50;
    
    // Painel principal
    const gradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
    gradient.addColorStop(0, 'rgba(12, 38, 25, 0.95)');
    gradient.addColorStop(1, 'rgba(6, 22, 16, 0.95)');
    
    this.ctx.save();
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    // Borda
    this.ctx.strokeStyle = GLASS_THEME.palette.accent.green;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    this.ctx.restore();
    
    // Header
    drawText(this.ctx, '🏆 Conquistas', panelX + 30, panelY + 40, {
      font: 'bold 36px monospace',
      color: GLASS_THEME.palette.accent.amber,
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
    
    // Filtros de categoria
    this.drawCategoryFilters(panelX, panelY + 80, panelWidth);
    
    // Lista de conquistas
    this.drawAchievementsList(panelX, panelY + 150, panelWidth, panelHeight - 170, gameState);
    
    // Estatísticas
    this.drawStats(panelX + 30, panelY + panelHeight - 50, gameState);
  }
  
  private drawCategoryFilters(x: number, y: number, width: number) {
    const categories: Array<{ id: Achievement['category'] | 'all'; label: string; icon: string }> = [
      { id: 'all', label: 'Todas', icon: '🌟' },
      { id: 'exploration', label: 'Exploração', icon: '🗺️' },
      { id: 'social', label: 'Social', icon: '🤝' },
      { id: 'combat', label: 'Combate', icon: '⚔️' },
      { id: 'mastery', label: 'Maestria', icon: '👑' },
      { id: 'collection', label: 'Coleção', icon: '📦' },
    ];
    
    const btnWidth = 130;
    const btnHeight = 35;
    const gap = 10;
    let currentX = x + 30;
    
    categories.forEach(cat => {
      const isActive = this.selectedCategory === cat.id;
      const isHovered = isMouseOver(this.mouseX, this.mouseY, currentX, y, btnWidth, btnHeight);
      
      drawButton(this.ctx, currentX, y, btnWidth, btnHeight, `${cat.icon} ${cat.label}`, {
        variant: isActive ? 'primary' : 'ghost',
        isHovered: isHovered,
        fontSize: 14,
      });
      
      this.buttons.set(`category_${cat.id}`, {
        x: currentX,
        y: y,
        width: btnWidth,
        height: btnHeight,
        action: () => {
          this.selectedCategory = cat.id;
          this.scrollOffset = 0;
        },
      });
      
      currentX += btnWidth + gap;
    });
  }
  
  private drawAchievementsList(x: number, y: number, width: number, height: number, gameState: GameState) {
    const achievements = this.getFilteredAchievements();
    const cardWidth = (width - 90) / 2;
    const cardHeight = 160;
    const gap = 20;
    
    // Área de scroll
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(x, y, width, height);
    this.ctx.clip();
    
    let currentY = y + 20 - this.scrollOffset;
    let col = 0;
    
    achievements.forEach((achievement, index) => {
      const currentX = x + 30 + (col * (cardWidth + gap));
      
      if (currentY + cardHeight > y && currentY < y + height) {
        this.drawAchievementCard(currentX, currentY, cardWidth, cardHeight, achievement, gameState);
      }
      
      col++;
      if (col >= 2) {
        col = 0;
        currentY += cardHeight + gap;
      }
    });
    
    this.ctx.restore();
    
    // Indicador de scroll
    if (this.getMaxScroll() > 0) {
      const scrollBarHeight = 80;
      const scrollBarY = y + (this.scrollOffset / this.getMaxScroll()) * (height - scrollBarHeight);
      
      this.ctx.fillStyle = 'rgba(109, 199, 164, 0.5)';
      this.ctx.fillRect(x + width - 15, scrollBarY, 10, scrollBarHeight);
    }
  }
  
  private drawAchievementCard(
    x: number,
    y: number,
    width: number,
    height: number,
    achievement: Achievement,
    gameState: GameState
  ) {
    const isUnlocked = achievement.isUnlocked;
    const progress = getAchievementProgress(achievement);
    
    // Card background
    this.ctx.save();
    this.ctx.fillStyle = isUnlocked ? 'rgba(109, 199, 164, 0.2)' : 'rgba(42, 119, 96, 0.15)';
    this.ctx.fillRect(x, y, width, height);
    
    // Borda tier
    this.ctx.strokeStyle = getTierColor(achievement.tier);
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x, y, width, height);
    this.ctx.restore();
    
    // Ícone
    drawText(this.ctx, achievement.icon, x + 25, y + 35, {
      font: 'bold 40px monospace',
      color: isUnlocked ? GLASS_THEME.palette.accent.amber : 'rgba(255, 255, 255, 0.4)',
    });
    
    // Nome
    drawText(this.ctx, achievement.name, x + 75, y + 25, {
      font: 'bold 18px monospace',
      color: isUnlocked ? GLASS_THEME.palette.accent.green : 'rgba(220, 236, 230, 0.7)',
    });
    
    // Tier
    drawText(this.ctx, achievement.tier.toUpperCase(), x + 75, y + 50, {
      font: 'bold 12px monospace',
      color: getTierColor(achievement.tier),
    });
    
    // Descrição
    this.drawWrappedText(
      achievement.description,
      x + 15,
      y + 75,
      width - 30,
      14,
      'rgba(183, 221, 205, 0.8)'
    );
    
    // Progresso
    if (!isUnlocked) {
      const barWidth = width - 30;
      const barHeight = 20;
      const barX = x + 15;
      const barY = y + height - 35;
      
      // Fundo da barra
      this.ctx.fillStyle = 'rgba(42, 119, 96, 0.3)';
      this.ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // Progresso
      this.ctx.fillStyle = GLASS_THEME.palette.accent.green;
      this.ctx.fillRect(barX, barY, (barWidth * progress) / 100, barHeight);
      
      // Borda
      this.ctx.strokeStyle = GLASS_THEME.palette.accent.green;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(barX, barY, barWidth, barHeight);
      
      // Texto
      drawText(
        this.ctx,
        `${achievement.requirement.current}/${achievement.requirement.target}`,
        barX + barWidth / 2,
        barY + barHeight / 2 + 1,
        {
          align: 'center',
          baseline: 'middle',
          font: 'bold 12px monospace',
          color: '#FFFFFF',
        }
      );
    } else {
      // Desbloqueado
      drawText(this.ctx, '✅ DESBLOQUEADO', x + width / 2, y + height - 20, {
        align: 'center',
        font: 'bold 14px monospace',
        color: GLASS_THEME.palette.accent.amber,
      });
    }
  }
  
  private drawWrappedText(text: string, x: number, y: number, maxWidth: number, fontSize: number, color: string) {
    this.ctx.font = `${fontSize}px monospace`;
    this.ctx.fillStyle = color;
    
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    
    words.forEach(word => {
      const testLine = line + word + ' ';
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && line !== '') {
        this.ctx.fillText(line, x, currentY);
        line = word + ' ';
        currentY += fontSize + 4;
      } else {
        line = testLine;
      }
    });
    
    this.ctx.fillText(line, x, currentY);
  }
  
  private drawStats(x: number, y: number, gameState: GameState) {
    const achievements = this.getFilteredAchievements();
    const unlocked = achievements.filter(a => a.isUnlocked).length;
    const total = achievements.length;
    
    drawText(this.ctx, `📊 Conquistas: ${unlocked}/${total} (${Math.floor((unlocked / total) * 100)}%)`, x, y, {
      font: 'bold 16px monospace',
      color: GLASS_THEME.palette.accent.green,
    });
  }
  
  public close() {
    // Cleanup if needed
  }
}

