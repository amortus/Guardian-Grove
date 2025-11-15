/**
 * UI de Leaderboard - Canvas integrado
 */

import type { GameState } from '../types';
import {
  LEADERBOARD_CATEGORIES,
  generateMockLeaderboard,
  formatLeaderboardValue,
  getRankColor,
  getRankMedal,
  type LeaderboardData,
} from '../data/leaderboard';
import { GLASS_THEME } from './theme';
import { drawText, drawButton, isMouseOver } from './ui-helper';

export class LeaderboardUICanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private selectedCategory: LeaderboardData['category'] = 'level';
  private leaderboardData: LeaderboardData | null = null;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();
  
  public onClose: (() => void) | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.setupEventListeners();
    this.loadLeaderboard();
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
  
  private loadLeaderboard() {
    // TODO: Substituir por chamada API real
    this.leaderboardData = generateMockLeaderboard(this.selectedCategory, 'current_user');
  }
  
  public draw(gameState: GameState) {
    this.buttons.clear();
    
    // Fundo escuro
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const panelWidth = Math.min(900, this.canvas.width - 100);
    const panelHeight = this.canvas.height - 100;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = 50;
    
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
    drawText(this.ctx, '🏆 Ranking Global', panelX + 30, panelY + 40, {
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
    
    // Lista de ranking
    if (this.leaderboardData) {
      this.drawRankingList(panelX, panelY + 150, panelWidth, panelHeight - 200);
    }
  }
  
  private drawCategoryFilters(x: number, y: number, width: number) {
    const btnWidth = 120;
    const btnHeight = 35;
    const gap = 8;
    let currentX = x + 30;
    
    LEADERBOARD_CATEGORIES.forEach(cat => {
      const isActive = this.selectedCategory === cat.id;
      const isHovered = isMouseOver(this.mouseX, this.mouseY, currentX, y, btnWidth, btnHeight);
      
      drawButton(this.ctx, currentX, y, btnWidth, btnHeight, `${cat.icon}`, {
        variant: isActive ? 'primary' : 'ghost',
        isHovered: isHovered,
        fontSize: 24,
      });
      
      this.buttons.set(`category_${cat.id}`, {
        x: currentX,
        y: y,
        width: btnWidth,
        height: btnHeight,
        action: () => {
          this.selectedCategory = cat.id;
          this.loadLeaderboard();
        },
      });
      
      currentX += btnWidth + gap;
    });
  }
  
  private drawRankingList(x: number, y: number, width: number, height: number) {
    if (!this.leaderboardData) return;
    
    // Título da categoria
    drawText(this.ctx, `${this.leaderboardData.icon} ${this.leaderboardData.title}`, x + width / 2, y - 20, {
      align: 'center',
      font: 'bold 24px monospace',
      color: GLASS_THEME.palette.accent.green,
    });
    
    const entryHeight = 60;
    const startY = y + 20;
    
    this.leaderboardData.entries.forEach((entry, index) => {
      const entryY = startY + (index * entryHeight);
      this.drawRankingEntry(x + 30, entryY, width - 60, entryHeight - 10, entry);
    });
    
    // Seu ranking (se não estiver no top 10)
    if (this.leaderboardData.userRank && this.leaderboardData.userRank > 10) {
      const yourRankY = startY + (10 * entryHeight) + 20;
      
      drawText(this.ctx, '...', x + width / 2, yourRankY, {
        align: 'center',
        font: 'bold 24px monospace',
        color: 'rgba(220, 236, 230, 0.5)',
      });
      
      drawText(this.ctx, `Seu Ranking: #${this.leaderboardData.userRank}`, x + width / 2, yourRankY + 40, {
        align: 'center',
        font: 'bold 18px monospace',
        color: GLASS_THEME.palette.accent.amber,
      });
    }
  }
  
  private drawRankingEntry(
    x: number,
    y: number,
    width: number,
    height: number,
    entry: LeaderboardData['entries'][0]
  ) {
    const isCurrentUser = entry.isCurrentUser;
    
    // Background
    this.ctx.fillStyle = isCurrentUser
      ? 'rgba(109, 199, 164, 0.3)'
      : 'rgba(42, 119, 96, 0.15)';
    this.ctx.fillRect(x, y, width, height);
    
    // Borda
    this.ctx.strokeStyle = isCurrentUser
      ? GLASS_THEME.palette.accent.amber
      : getRankColor(entry.rank);
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);
    
    // Rank
    const medal = getRankMedal(entry.rank);
    const rankText = medal || `#${entry.rank}`;
    
    drawText(this.ctx, rankText, x + 30, y + height / 2 + 2, {
      align: 'center',
      baseline: 'middle',
      font: 'bold 24px monospace',
      color: getRankColor(entry.rank),
    });
    
    // Username
    drawText(this.ctx, entry.username, x + 80, y + height / 2 - 8, {
      baseline: 'middle',
      font: 'bold 18px monospace',
      color: isCurrentUser ? GLASS_THEME.palette.accent.amber : 'rgba(220, 236, 230, 0.9)',
    });
    
    // Guardian name
    drawText(this.ctx, `(${entry.guardianName})`, x + 80, y + height / 2 + 14, {
      baseline: 'middle',
      font: '14px monospace',
      color: 'rgba(183, 221, 205, 0.7)',
    });
    
    // Value
    const valueText = formatLeaderboardValue(this.leaderboardData!.category, entry.value);
    drawText(this.ctx, valueText, x + width - 30, y + height / 2 + 2, {
      align: 'right',
      baseline: 'middle',
      font: 'bold 20px monospace',
      color: GLASS_THEME.palette.accent.green,
    });
  }
  
  public close() {
    // Cleanup
  }
}

