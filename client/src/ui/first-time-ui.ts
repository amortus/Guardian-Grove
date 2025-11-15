/**
 * UI de Recompensas de Primeira Vez - Guardian Grove
 */

import type { GameState } from '../types';
import { GLASS_THEME } from './theme';
import { drawText, drawButton, isMouseOver, drawPanel } from './ui-helper';
import { getFirstTimeState, checkAndClaimFirstTime, type FirstTimeReward } from '../data/first-time-rewards';
import { audioManager } from '../systems/audio-manager';

export class FirstTimeUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();
  
  private firstTimeState = getFirstTimeState();
  
  public onClose: (() => void) | null = null;
  public onClaimReward: ((reward: FirstTimeReward) => void) | null = null;
  
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
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const panelWidth = Math.min(900, this.canvas.width - 100);
    const panelHeight = Math.min(750, this.canvas.height - 100);
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;
    
    // Painel principal
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, { variant: 'dark' });
    
    // Header
    drawText(this.ctx, '🌟 RECOMPENSAS DE PRIMEIRA VEZ', panelX + panelWidth / 2, panelY + 50, {
      align: 'center',
      font: 'bold 32px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });
    
    drawText(this.ctx, `Experimente cada sistema pela primeira vez e ganhe recompensas!`, panelX + panelWidth / 2, panelY + 85, {
      align: 'center',
      font: '16px monospace',
      color: 'rgba(220, 236, 230, 0.8)',
    });
    
    // Progresso
    const totalRewards = this.firstTimeState.rewards.length;
    const claimedCount = this.firstTimeState.totalClaimed;
    const progress = (claimedCount / totalRewards) * 100;
    
    drawText(this.ctx, `✅ ${claimedCount}/${totalRewards} Coletadas (${Math.round(progress)}%)`, panelX + panelWidth / 2, panelY + 115, {
      align: 'center',
      font: 'bold 18px monospace',
      color: GLASS_THEME.palette.accent.green,
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
    
    // Lista de recompensas
    this.drawRewardsList(panelX + 30, panelY + 150, panelWidth - 60, panelHeight - 200);
  }
  
  private drawRewardsList(x: number, y: number, width: number, height: number) {
    const itemHeight = 60;
    const gap = 5;
    let currentY = y;
    
    this.firstTimeState.rewards.forEach((reward, index) => {
      if (currentY + itemHeight > y + height) return; // Scroll limit
      
      this.drawRewardItem(x, currentY, width, itemHeight, reward);
      currentY += itemHeight + gap;
    });
  }
  
  private drawRewardItem(x: number, y: number, width: number, height: number, reward: FirstTimeReward) {
    const isClaimed = reward.claimed;
    const isHovered = isMouseOver(this.mouseX, this.mouseY, x, y, width, height);
    
    // Fundo
    this.ctx.fillStyle = isClaimed 
      ? 'rgba(42, 119, 96, 0.2)' 
      : isHovered 
      ? 'rgba(109, 199, 164, 0.2)' 
      : 'rgba(42, 119, 96, 0.15)';
    this.ctx.fillRect(x, y, width, height);
    
    // Borda
    this.ctx.strokeStyle = isClaimed 
      ? 'rgba(109, 199, 164, 0.5)' 
      : GLASS_THEME.palette.accent.green;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);
    
    // Ícone
    drawText(this.ctx, reward.icon, x + 30, y + height / 2 + 5, {
      align: 'center',
      baseline: 'middle',
      font: 'bold 32px monospace',
      color: isClaimed ? 'rgba(255, 255, 255, 0.4)' : '#FFFFFF',
    });
    
    // Nome e descrição
    drawText(this.ctx, reward.name, x + 70, y + 20, {
      font: 'bold 18px monospace',
      color: isClaimed ? 'rgba(220, 236, 230, 0.5)' : GLASS_THEME.palette.accent.amber,
    });
    
    drawText(this.ctx, reward.description, x + 70, y + 42, {
      font: '14px monospace',
      color: isClaimed ? 'rgba(183, 221, 205, 0.4)' : 'rgba(183, 221, 205, 0.8)',
    });
    
    // Recompensas
    let rewardText = '';
    if (reward.rewards.coronas) rewardText += `💰 ${reward.rewards.coronas} `;
    if (reward.rewards.xp) rewardText += `⭐ ${reward.rewards.xp} XP `;
    if (reward.rewards.items && reward.rewards.items.length > 0) {
      rewardText += reward.rewards.items.map(i => `${i.icon} ${i.name}`).join(' ');
    }
    
    drawText(this.ctx, rewardText, x + width - 20, y + height / 2 + 5, {
      align: 'right',
      baseline: 'middle',
      font: 'bold 14px monospace',
      color: isClaimed ? 'rgba(255, 200, 87, 0.4)' : GLASS_THEME.palette.accent.amber,
    });
    
    // Status
    if (isClaimed) {
      drawText(this.ctx, '✅ COLETADO', x + width - 150, y + height - 15, {
        align: 'right',
        font: 'bold 12px monospace',
        color: 'rgba(109, 199, 164, 0.7)',
      });
    } else {
      drawText(this.ctx, '🔓 DISPONÍVEL', x + width - 150, y + height - 15, {
        align: 'right',
        font: 'bold 12px monospace',
        color: 'rgba(255, 200, 87, 0.7)',
      });
    }
  }
  
  public refresh() {
    this.firstTimeState = getFirstTimeState();
  }
  
  public close() {
    // Cleanup
  }
}

