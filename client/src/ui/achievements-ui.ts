/**
 * UI de Conquistas
 */

import type { GameState } from '../types';
import { COLORS } from './colors';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';
import { getCompletionPercentage, getAchievementsByCategory, type Achievement } from '../systems/achievements';

export class AchievementsUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();

  private selectedCategory: 'all' | 'battle' | 'training' | 'collection' | 'social' | 'special' = 'all';
  private selectedAchievement: Achievement | null = null;
  private scrollOffset = 0;

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
      const maxScroll = Math.max(0, 15 - 6); // Roughly 6 achievements visible
      this.scrollOffset += e.deltaY > 0 ? 1 : -1;
      this.scrollOffset = Math.max(0, Math.min(maxScroll, this.scrollOffset));
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
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Painel principal
    const panelWidth = 900;
    const panelHeight = 600;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: COLORS.bg.medium,
      borderColor: COLORS.primary.gold,
    });

    // Header
    drawText(this.ctx, '🏆 Conquistas', panelX + 20, panelY + 20, {
      font: 'bold 32px monospace',
      color: COLORS.primary.gold,
    });

    // Botão fechar (melhorado)
    const closeBtnWidth = 100;
    const closeBtnHeight = 35;
    const closeBtnX = panelX + panelWidth - closeBtnWidth - 10;
    const closeBtnY = panelY + 10;
    
    // Progresso total (abaixo do título)
    const completion = getCompletionPercentage(gameState.achievements as unknown as Achievement[]);
    drawText(this.ctx, `${Math.floor(completion)}% Completo`, panelX + 20, panelY + 55, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });

    // Título atual (abaixo do progresso)
    if (gameState.currentTitle) {
      drawText(this.ctx, `Título: ${gameState.currentTitle}`, panelX + 20, panelY + 75, {
        font: '14px monospace',
        color: COLORS.primary.purple,
      });
    }
    const closeIsHovered = isMouseOver(this.mouseX, this.mouseY, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight);

    drawButton(this.ctx, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight, '✖ Fechar', {
      bgColor: COLORS.ui.error,
      isHovered: closeIsHovered,
    });

    this.buttons.set('close', {
      x: closeBtnX,
      y: closeBtnY,
      width: closeBtnWidth,
      height: closeBtnHeight,
      action: () => {
        if (this.onClose) this.onClose();
      },
    });

    // Tabs de categoria
    this.drawCategoryTabs(panelX, panelY + 70);

    // Lista de conquistas
    this.drawAchievementList(panelX + 20, panelY + 130, panelWidth - 460, panelHeight - 160, gameState);

    // Detalhes
    this.drawAchievementDetails(panelX + panelWidth - 420, panelY + 130, 400, panelHeight - 160, gameState);
  }

  private drawCategoryTabs(x: number, y: number) {
    const categories = [
      { id: 'all' as const, name: 'Todas', icon: '📋' },
      { id: 'battle' as const, name: 'Batalha', icon: '⚔️' },
      { id: 'training' as const, name: 'Treino', icon: '💪' },
      { id: 'collection' as const, name: 'Coleção', icon: '📦' },
      { id: 'social' as const, name: 'Social', icon: '👥' },
      { id: 'special' as const, name: 'Especial', icon: '✨' },
    ];

    const tabWidth = 100;
    const tabHeight = 35;

    categories.forEach((cat, index) => {
      const tabX = x + 20 + (index * (tabWidth + 5));
      const isActive = this.selectedCategory === cat.id;
      const isHovered = isMouseOver(this.mouseX, this.mouseY, tabX, y, tabWidth, tabHeight);

      drawButton(this.ctx, tabX, y, tabWidth, tabHeight, `${cat.icon} ${cat.name}`, {
        bgColor: isActive ? COLORS.primary.gold : COLORS.bg.light,
        textColor: isActive ? COLORS.bg.dark : COLORS.ui.text,
        isHovered: !isActive && isHovered,
      });

      this.buttons.set(`cat_${cat.id}`, {
        x: tabX,
        y,
        width: tabWidth,
        height: tabHeight,
        action: () => {
          this.selectedCategory = cat.id;
          this.scrollOffset = 0;
          this.selectedAchievement = null;
        },
      });
    });
  }

  private drawAchievementList(x: number, y: number, width: number, height: number, gameState: GameState) {
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.dark,
    });

    const achievements = this.selectedCategory === 'all'
      ? gameState.achievements.filter(a => !a.hidden || a.isUnlocked) as unknown as Achievement[]
      : getAchievementsByCategory(gameState.achievements as unknown as Achievement[], this.selectedCategory).filter(a => !a.hidden || a.isUnlocked);

    if (achievements.length === 0) {
      drawText(this.ctx, 'Nenhuma conquista', x + width / 2, y + height / 2, {
        align: 'center',
        font: '18px monospace',
        color: COLORS.ui.textDim,
      });
      return;
    }

    const itemHeight = 80;
    const visibleItems = Math.floor(height / itemHeight);
    const startIndex = this.scrollOffset;
    const endIndex = Math.min(startIndex + visibleItems, achievements.length);

    for (let i = startIndex; i < endIndex; i++) {
      const achievement = achievements[i];
      const itemY = y + 10 + ((i - startIndex) * itemHeight);
      this.drawAchievementRow(achievement, x + 10, itemY, width - 20, itemHeight - 5);
    }

    // Scroll
    if (achievements.length > visibleItems) {
      const scrollBarHeight = Math.max(30, (visibleItems / achievements.length) * height);
      const maxScrollOffset = achievements.length - visibleItems;
      const scrollProgress = maxScrollOffset > 0 ? this.scrollOffset / maxScrollOffset : 0;
      const scrollBarY = y + scrollProgress * (height - scrollBarHeight);
      this.ctx.fillStyle = COLORS.primary.gold;
      this.ctx.fillRect(x + width - 8, scrollBarY, 6, scrollBarHeight);
    }
  }

  private drawAchievementRow(achievement: Achievement, x: number, y: number, width: number, height: number) {
    const isSelected = this.selectedAchievement?.id === achievement.id;
    const isHovered = isMouseOver(this.mouseX, this.mouseY, x, y, width, height);

    // Fundo
    if (achievement.isUnlocked) {
      this.ctx.fillStyle = isSelected ? COLORS.primary.gold : (isHovered ? '#2d2510' : '#1d1510');
    } else {
      this.ctx.fillStyle = isSelected ? COLORS.bg.light : (isHovered ? COLORS.bg.light : 'transparent');
    }
    this.ctx.fillRect(x, y, width, height);

    // Borda dourada para desbloqueadas
    if (achievement.isUnlocked) {
      this.ctx.strokeStyle = COLORS.primary.gold;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, width, height);
    }

    // Badge
    const badge = achievement.isUnlocked ? achievement.reward.badge : '🔒';
    drawText(this.ctx, badge, x + 10, y + 30, {
      font: '32px monospace',
    });

    // Nome
    drawText(this.ctx, achievement.name, x + 55, y + 20, {
      font: 'bold 16px monospace',
      color: achievement.isUnlocked ? COLORS.primary.gold : COLORS.ui.textDim,
    });

    // Descrição
    drawText(this.ctx, achievement.description, x + 55, y + 45, {
      font: '12px monospace',
      color: COLORS.ui.textDim,
    });

    // Progresso
    if (!achievement.isUnlocked) {
      const barX = x + 55;
      const barY = y + 60;
      const barWidth = width - 65;
      const barHeight = 10;

      this.ctx.fillStyle = COLORS.bg.medium;
      this.ctx.fillRect(barX, barY, barWidth, barHeight);

      this.ctx.fillStyle = COLORS.primary.green;
      this.ctx.fillRect(barX, barY, barWidth * achievement.progress, barHeight);

      this.ctx.strokeStyle = COLORS.primary.gold;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    this.buttons.set(`achievement_${achievement.id}`, {
      x,
      y,
      width,
      height,
      action: () => {
        this.selectedAchievement = achievement;
      },
    });
  }

  private drawAchievementDetails(x: number, y: number, width: number, height: number, gameState: GameState) {
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.dark,
    });

    if (!this.selectedAchievement) {
      drawText(this.ctx, 'Selecione uma conquista', x + width / 2, y + height / 2, {
        align: 'center',
        font: '18px monospace',
        color: COLORS.ui.textDim,
      });
      return;
    }

    const ach = this.selectedAchievement;

    // Badge grande
    drawText(this.ctx, ach.isUnlocked ? ach.reward.badge : '🔒', x + width / 2, y + 60, {
      align: 'center',
      font: '64px monospace',
    });

    // Nome
    drawText(this.ctx, ach.name, x + 20, y + 120, {
      font: 'bold 22px monospace',
      color: ach.isUnlocked ? COLORS.primary.gold : COLORS.ui.textDim,
    });

    // Status
    const status = ach.isUnlocked ? '✅ Desbloqueada' : '🔒 Bloqueada';
    drawText(this.ctx, status, x + 20, y + 150, {
      font: '16px monospace',
      color: ach.isUnlocked ? COLORS.primary.green : COLORS.ui.error,
    });

    // Descrição
    drawText(this.ctx, 'Descrição:', x + 20, y + 185, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });

    this.drawWrappedText(ach.description, x + 20, y + 210, width - 40, 20, '14px monospace', COLORS.ui.textDim);

    // Progresso
    if (!ach.isUnlocked) {
      drawText(this.ctx, 'Progresso:', x + 20, y + 265, {
        font: 'bold 16px monospace',
        color: COLORS.ui.text,
      });

      const progressText = `${ach.requirement.current} / ${ach.requirement.target}`;
      drawText(this.ctx, progressText, x + 20, y + 290, {
        font: '18px monospace',
        color: COLORS.primary.purple,
      });

      // Barra
      const barX = x + 20;
      const barY = y + 305;
      const barWidth = width - 40;
      const barHeight = 25;

      this.ctx.fillStyle = COLORS.bg.medium;
      this.ctx.fillRect(barX, barY, barWidth, barHeight);

      this.ctx.fillStyle = COLORS.primary.green;
      this.ctx.fillRect(barX, barY, barWidth * ach.progress, barHeight);

      this.ctx.strokeStyle = COLORS.primary.gold;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(barX, barY, barWidth, barHeight);

      drawText(this.ctx, `${Math.floor(ach.progress * 100)}%`, barX + barWidth / 2, barY + 17, {
        align: 'center',
        font: 'bold 14px monospace',
        color: COLORS.ui.text,
      });
    }

    // Recompensas
    drawText(this.ctx, 'Recompensas:', x + 20, y + 355, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });

    let rewardY = y + 380;

    if (ach.reward.coronas) {
      drawText(this.ctx, `💰 ${ach.reward.coronas} Coronas`, x + 25, rewardY, {
        font: '14px monospace',
        color: COLORS.primary.gold,
      });
      rewardY += 25;
    }

    if (ach.reward.title) {
      drawText(this.ctx, `👑 Título: "${ach.reward.title}"`, x + 25, rewardY, {
        font: '14px monospace',
        color: COLORS.primary.purple,
      });
      rewardY += 25;
    }

    drawText(this.ctx, `${ach.reward.badge} Badge Especial`, x + 25, rewardY, {
      font: '14px monospace',
      color: COLORS.primary.green,
    });

    // Data de desbloqueio
    if (ach.isUnlocked && ach.unlockedAt) {
      const date = new Date(ach.unlockedAt);
      drawText(this.ctx, `Desbloqueado em: ${date.toLocaleDateString()}`, x + 20, y + height - 20, {
        font: '12px monospace',
        color: COLORS.ui.textDim,
      });
    }
    
    void gameState; // Avoid unused warning
  }

  private drawWrappedText(text: string, x: number, y: number, maxWidth: number, lineHeight: number, font: string, color: string) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    // Shadow for better readability
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = this.ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        this.ctx.fillText(line, x, currentY);
        line = words[i] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    
    if (line.trim()) {
      this.ctx.fillText(line, x, currentY);
    }

    // Reset shadow
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }

  public close() {
    this.selectedAchievement = null;
    this.selectedCategory = 'all';
    this.scrollOffset = 0;
  }
}

