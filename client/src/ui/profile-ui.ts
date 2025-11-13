/**
 * ProfileUI - Dashboard de Estatísticas do Jogador
 */

import type { GameState } from '../types';

export interface PlayerStats {
  totalVictories: number;
  totalDefeats: number;
  winRate: number;
  totalBattles: number;
  beastsCreated: number;
  totalTrains: number;
  totalCrafts: number;
  totalSpent: number;
  currentWeek: number;
  playTime: number; // em minutos
  achievementsUnlocked: number;
  totalAchievements: number;
  currentStreak: number;
  longestStreak: number;
}

export class ProfileUI {
  private canvas: HTMLCanvasElement;
  private stats: PlayerStats;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private scrollOffset: number = 0;

  public onClose: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, gameState: GameState) {
    this.canvas = canvas;
    this.stats = this.calculateStats(gameState);
    this.setupEventListeners();
  }

  private calculateStats(gameState: GameState): PlayerStats {
    const totalVictories = gameState.victories || 0;
    const totalDefeats = gameState.defeats || 0;
    const totalBattles = totalVictories + totalDefeats;
    
    return {
      totalVictories,
      totalDefeats,
      winRate: totalBattles > 0 ? (totalVictories / totalBattles) * 100 : 0,
      totalBattles,
      beastsCreated: gameState.ranch.beasts.length,
      totalTrains: gameState.totalTrains || 0,
      totalCrafts: gameState.totalCrafts || 0,
      totalSpent: gameState.totalSpent || 0,
      currentWeek: gameState.activeBeast?.birthWeek || 0,
      playTime: Math.floor((gameState.activeBeast?.birthWeek || 0) * 10), // Estimativa: 10 min por semana
      achievementsUnlocked: gameState.achievements.filter((a: any) => a.isUnlocked).length,
      totalAchievements: gameState.achievements.length,
      currentStreak: gameState.winStreak || 0,
      longestStreak: (gameState as any).longestStreak || gameState.winStreak || 0,
    };
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
      this.scrollOffset += e.deltaY > 0 ? 20 : -20;
      this.scrollOffset = Math.max(0, Math.min(300, this.scrollOffset));
    });
  }

  private handleClick() {
    const panelX = this.canvas.width / 2 - 400;
    const panelY = 50;
    const panelWidth = 800;
    
    // Close button
    const closeX = panelX + panelWidth - 40;
    const closeY = panelY + 10;
    if (this.mouseX >= closeX && this.mouseX <= closeX + 30 &&
        this.mouseY >= closeY && this.mouseY <= closeY + 30) {
      if (this.onClose) this.onClose();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const panelX = this.canvas.width / 2 - 400;
    const panelY = 50;
    const panelWidth = 800;
    const panelHeight = 700;

    // Background overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Panel
    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 3;
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📊 Perfil & Estatísticas', panelX + panelWidth / 2, panelY + 50);

    // Close button
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(panelX + panelWidth - 40, panelY + 10, 30, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('✕', panelX + panelWidth - 25, panelY + 32);

    // Stats Grid
    let y = panelY + 100 - this.scrollOffset;
    const leftX = panelX + 50;
    const rightX = panelX + 420;

    // Batalhas
    this.drawStatBox(ctx, leftX, y, '⚔️ Vitórias', this.stats.totalVictories.toString(), '#27ae60');
    this.drawStatBox(ctx, rightX, y, '💀 Derrotas', this.stats.totalDefeats.toString(), '#e74c3c');
    
    y += 80;
    this.drawStatBox(ctx, leftX, y, '📈 Win Rate', `${this.stats.winRate.toFixed(1)}%`, '#3498db');
    this.drawStatBox(ctx, rightX, y, '🎯 Total Batalhas', this.stats.totalBattles.toString(), '#9b59b6');
    
    y += 80;
    // Progressão
    this.drawStatBox(ctx, leftX, y, '🐾 Bestas Criadas', this.stats.beastsCreated.toString(), '#f39c12');
    this.drawStatBox(ctx, rightX, y, '📅 Semana Atual', this.stats.currentWeek.toString(), '#16a085');
    
    y += 80;
    // Atividades
    this.drawStatBox(ctx, leftX, y, '💪 Treinos', this.stats.totalTrains.toString(), '#e67e22');
    this.drawStatBox(ctx, rightX, y, '🔨 Crafts', this.stats.totalCrafts.toString(), '#8e44ad');
    
    y += 80;
    // Economia
    this.drawStatBox(ctx, leftX, y, '💰 Gasto Total', `${this.stats.totalSpent} ₡`, '#c0392b');
    this.drawStatBox(ctx, rightX, y, '⏱️ Tempo de Jogo', `${this.stats.playTime} min`, '#2980b9');
    
    y += 80;
    // Conquistas
    this.drawStatBox(ctx, leftX, y, '🏆 Conquistas', `${this.stats.achievementsUnlocked}/${this.stats.totalAchievements}`, '#f1c40f');
    const achievementPercentage = (this.stats.achievementsUnlocked / this.stats.totalAchievements) * 100;
    this.drawStatBox(ctx, rightX, y, '📊 Progresso', `${achievementPercentage.toFixed(1)}%`, '#1abc9c');
    
    y += 80;
    // Streaks
    this.drawStatBox(ctx, leftX, y, '🔥 Streak Atual', this.stats.currentStreak.toString(), '#e74c3c');
    this.drawStatBox(ctx, rightX, y, '⭐ Melhor Streak', this.stats.longestStreak.toString(), '#f39c12');

    // Scroll indicator
    if (this.scrollOffset < 300) {
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('↓ Role para ver mais ↓', panelX + panelWidth / 2, panelY + panelHeight - 20);
    }
  }

  private drawStatBox(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string,
    value: string,
    color: string
  ): void {
    const width = 330;
    const height = 60;

    // Box
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Label
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 10, y + 25);

    // Value
    ctx.fillStyle = color;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(value, x + width - 10, y + 45);
  }

  close(): void {
    if (this.onClose) {
      this.onClose();
    }
  }
}

