/**
 * UI de Quests/Missões
 */

import type { GameState } from '../types';
import { COLORS } from './colors';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';
import { getActiveQuests, getCompletedQuests, type Quest } from '../systems/quests';
import { getItemById } from '../data/shop';

export class QuestsUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();

  private selectedTab: 'active' | 'completed' = 'active';
  private selectedQuest: Quest | null = null;
  private scrollOffset = 0;

  public onClaimReward: ((quest: Quest) => void) | null = null;
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
      // Dynamically calculate max scroll based on current tab
      const maxScroll = Math.max(0, 10 - 5); // Roughly 5 quests visible
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

    // Fundo semi-transparente
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
    drawText(this.ctx, '📜 Missões', panelX + 20, panelY + 20, {
      font: 'bold 32px monospace',
      color: COLORS.primary.gold,
    });

    // Contador (ao centro, mesma linha do título)
    const activeCount = getActiveQuests(gameState.quests).length;
    const completedCount = getCompletedQuests(gameState.quests).length;
    drawText(this.ctx, `${activeCount} ativas | ${completedCount} completas`, panelX + 300, panelY + 30, {
      font: '16px monospace',
      color: COLORS.ui.text,
    });

    // Botão de fechar
    const closeBtnWidth = 100;
    const closeBtnHeight = 35;
    const closeBtnX = panelX + panelWidth - closeBtnWidth - 10;
    const closeBtnY = panelY + 10;
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
        if (this.onClose) {
          this.onClose();
        }
      },
    });

    // Tabs
    this.drawTabs(panelX, panelY + 60);

    // Lista de quests
    this.drawQuestList(panelX + 20, panelY + 120, panelWidth - 460, panelHeight - 150, gameState);

    // Painel de detalhes
    this.drawQuestDetails(panelX + panelWidth - 420, panelY + 120, 400, panelHeight - 150, gameState);
  }

  private drawTabs(x: number, y: number) {
    const tabWidth = 150;
    const tabHeight = 40;

    // Tab Ativas
    const activeIsHovered = isMouseOver(this.mouseX, this.mouseY, x + 20, y, tabWidth, tabHeight);
    const activeColor = this.selectedTab === 'active' ? COLORS.primary.gold : COLORS.bg.light;

    drawButton(this.ctx, x + 20, y, tabWidth, tabHeight, '📝 Ativas', {
      bgColor: activeColor,
      textColor: this.selectedTab === 'active' ? COLORS.bg.dark : COLORS.ui.text,
      isHovered: this.selectedTab !== 'active' && activeIsHovered,
    });

    this.buttons.set('tab_active', {
      x: x + 20,
      y,
      width: tabWidth,
      height: tabHeight,
      action: () => {
        this.selectedTab = 'active';
        this.scrollOffset = 0;
        this.selectedQuest = null;
      },
    });

    // Tab Completadas
    const completedIsHovered = isMouseOver(this.mouseX, this.mouseY, x + 180, y, tabWidth, tabHeight);
    const completedColor = this.selectedTab === 'completed' ? COLORS.primary.gold : COLORS.bg.light;

    drawButton(this.ctx, x + 180, y, tabWidth, tabHeight, '✅ Completas', {
      bgColor: completedColor,
      textColor: this.selectedTab === 'completed' ? COLORS.bg.dark : COLORS.ui.text,
      isHovered: this.selectedTab !== 'completed' && completedIsHovered,
    });

    this.buttons.set('tab_completed', {
      x: x + 180,
      y,
      width: tabWidth,
      height: tabHeight,
      action: () => {
        this.selectedTab = 'completed';
        this.scrollOffset = 0;
        this.selectedQuest = null;
      },
    });
  }

  private drawQuestList(x: number, y: number, width: number, height: number, gameState: GameState) {
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.dark,
    });

    const quests = this.selectedTab === 'active' 
      ? getActiveQuests(gameState.quests)
      : getCompletedQuests(gameState.quests);

    if (quests.length === 0) {
      const message = this.selectedTab === 'active' 
        ? 'Nenhuma quest ativa'
        : 'Nenhuma quest completada';
      
      drawText(this.ctx, message, x + width / 2, y + height / 2, {
        align: 'center',
        font: '18px monospace',
        color: COLORS.ui.textDim,
      });
      return;
    }

    // Desenhar quests
    const questHeight = 90;
    const visibleQuests = Math.floor(height / questHeight);
    const startIndex = this.scrollOffset;
    const endIndex = Math.min(startIndex + visibleQuests, quests.length);

    for (let i = startIndex; i < endIndex; i++) {
      const quest = quests[i];
      const questY = y + 10 + ((i - startIndex) * questHeight);
      this.drawQuestRow(quest, x + 10, questY, width - 20, questHeight - 5);
    }

    // Scroll indicator
    if (quests.length > visibleQuests) {
      const scrollBarHeight = Math.max(30, (visibleQuests / quests.length) * height);
      const maxScrollOffset = quests.length - visibleQuests;
      const scrollProgress = maxScrollOffset > 0 ? this.scrollOffset / maxScrollOffset : 0;
      const scrollBarY = y + scrollProgress * (height - scrollBarHeight);

      this.ctx.fillStyle = COLORS.primary.gold;
      this.ctx.fillRect(x + width - 8, scrollBarY, 6, scrollBarHeight);
    }
  }

  private drawQuestRow(quest: Quest, x: number, y: number, width: number, height: number) {
    const isSelected = this.selectedQuest?.id === quest.id;
    const isHovered = isMouseOver(this.mouseX, this.mouseY, x, y, width, height);

    // Fundo
    this.ctx.fillStyle = isSelected 
      ? COLORS.primary.gold 
      : (isHovered ? COLORS.bg.light : 'transparent');
    this.ctx.fillRect(x, y, width, height);

    // Ícone
    const icon = quest.isCompleted ? '✅' : this.getQuestTypeIcon(quest.type);
    drawText(this.ctx, icon, x + 10, y + 25, {
      font: '28px monospace',
    });

    // Nome
    drawText(this.ctx, quest.name, x + 50, y + 20, {
      font: 'bold 16px monospace',
      color: quest.isCompleted ? COLORS.primary.green : COLORS.ui.text,
    });

    // Descrição
    drawText(this.ctx, quest.description, x + 50, y + 45, {
      font: '12px monospace',
      color: COLORS.ui.textDim,
    });

    // Barra de progresso
    if (!quest.isCompleted) {
      const barX = x + 50;
      const barY = y + 60;
      const barWidth = width - 60;
      const barHeight = 15;

      this.ctx.fillStyle = COLORS.bg.medium;
      this.ctx.fillRect(barX, barY, barWidth, barHeight);

      const progress = Math.min(quest.progress, 1);
      this.ctx.fillStyle = COLORS.primary.green;
      this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

      this.ctx.strokeStyle = COLORS.primary.gold;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(barX, barY, barWidth, barHeight);

      drawText(this.ctx, `${Math.floor(progress * 100)}%`, barX + barWidth / 2, barY + 12, {
        align: 'center',
        font: '11px monospace',
        color: COLORS.ui.text,
      });
    }

    this.buttons.set(`quest_${quest.id}`, {
      x,
      y,
      width,
      height,
      action: () => {
        this.selectedQuest = quest;
      },
    });
  }

  private drawQuestDetails(x: number, y: number, width: number, height: number, gameState: GameState) {
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.dark,
    });

    if (!this.selectedQuest) {
      drawText(this.ctx, 'Selecione uma missão', x + width / 2, y + height / 2, {
        align: 'center',
        font: '18px monospace',
        color: COLORS.ui.textDim,
      });
      return;
    }

    const quest = this.selectedQuest;

    // Nome
    drawText(this.ctx, quest.name, x + 20, y + 30, {
      font: 'bold 22px monospace',
      color: COLORS.primary.gold,
    });

    // Tipo
    const typeIcon = this.getQuestTypeIcon(quest.type);
    drawText(this.ctx, `${typeIcon} ${this.getQuestTypeName(quest.type)}`, x + 20, y + 60, {
      font: '14px monospace',
      color: COLORS.ui.textDim,
    });

    // Descrição
    drawText(this.ctx, 'Objetivo:', x + 20, y + 95, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });

    this.drawWrappedText(quest.description, x + 20, y + 120, width - 40, 20, '14px monospace', COLORS.ui.textDim);

    // Progresso
    drawText(this.ctx, 'Progresso:', x + 20, y + 165, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });

    const goalText = this.getGoalText(quest);
    drawText(this.ctx, goalText, x + 25, y + 190, {
      font: '14px monospace',
      color: quest.isCompleted ? COLORS.primary.green : COLORS.ui.text,
    });

    // Barra de progresso grande
    if (!quest.isCompleted) {
      const barX = x + 20;
      const barY = y + 210;
      const barWidth = width - 40;
      const barHeight = 25;

      this.ctx.fillStyle = COLORS.bg.medium;
      this.ctx.fillRect(barX, barY, barWidth, barHeight);

      const progress = Math.min(quest.progress, 1);
      this.ctx.fillStyle = COLORS.primary.green;
      this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

      this.ctx.strokeStyle = COLORS.primary.gold;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(barX, barY, barWidth, barHeight);

      drawText(this.ctx, `${Math.floor(progress * 100)}%`, barX + barWidth / 2, barY + 17, {
        align: 'center',
        font: 'bold 14px monospace',
        color: COLORS.ui.text,
      });
    }

    // Recompensas
    drawText(this.ctx, 'Recompensas:', x + 20, y + 260, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });

    let rewardY = y + 285;

    if (quest.rewards.coronas) {
      drawText(this.ctx, `💰 ${quest.rewards.coronas} Coronas`, x + 25, rewardY, {
        font: '14px monospace',
        color: COLORS.primary.gold,
      });
      rewardY += 25;
    }

    if (quest.rewards.items) {
      for (const reward of quest.rewards.items) {
        const item = getItemById(reward.itemId);
        if (item) {
          drawText(this.ctx, `🎁 ${item.name} x${reward.quantity}`, x + 25, rewardY, {
            font: '14px monospace',
            color: COLORS.primary.green,
          });
          rewardY += 25;
        }
      }
    }
    
    // Avoid unused warning
    void gameState;

    // Botão de coletar recompensa
    if (quest.isCompleted && this.selectedTab === 'completed') {
      const claimBtnX = x + 20;
      const claimBtnY = y + height - 60;
      const claimBtnWidth = width - 40;
      const claimBtnHeight = 45;
      const claimIsHovered = isMouseOver(this.mouseX, this.mouseY, claimBtnX, claimBtnY, claimBtnWidth, claimBtnHeight);

      drawButton(this.ctx, claimBtnX, claimBtnY, claimBtnWidth, claimBtnHeight, '🎁 Coletar Recompensa', {
        bgColor: COLORS.primary.green,
        isHovered: claimIsHovered,
      });

      this.buttons.set('claim', {
        x: claimBtnX,
        y: claimBtnY,
        width: claimBtnWidth,
        height: claimBtnHeight,
        action: () => {
          if (this.onClaimReward && this.selectedQuest) {
            this.onClaimReward(this.selectedQuest);
          }
        },
      });
    }
  }

  private getQuestTypeIcon(type: string): string {
    switch (type) {
      case 'battle': return '⚔️';
      case 'training': return '💪';
      case 'collection': return '📦';
      case 'social': return '👥';
      default: return '❓';
    }
  }

  private getQuestTypeName(type: string): string {
    switch (type) {
      case 'battle': return 'Batalha';
      case 'training': return 'Treino';
      case 'collection': return 'Coleção';
      case 'social': return 'Social';
      default: return 'Desconhecido';
    }
  }

  private getGoalText(quest: Quest): string {
    const current = quest.goal.current;
    const target = quest.goal.target;
    return `${current} / ${target}`;
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
      const testWidth = metrics.width;

      if (testWidth > maxWidth && i > 0) {
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
    this.selectedQuest = null;
    this.selectedTab = 'active';
    this.scrollOffset = 0;
  }
}

