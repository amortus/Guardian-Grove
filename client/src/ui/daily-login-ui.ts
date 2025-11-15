/**
 * UI de Recompensas de Login Diário - Guardian Grove
 */

import type { GameState } from '../types';
import { GLASS_THEME } from './theme';
import { drawText, drawButton, isMouseOver, drawPanel } from './ui-helper';
import { getDailyLoginState, claimDailyReward, canClaimToday, getRarityColor, type DailyLoginReward } from '../data/daily-login-rewards';
import { audioManager } from '../systems/audio-manager';

export class DailyLoginUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();
  
  private loginState = getDailyLoginState();
  private canClaim = canClaimToday();
  
  public onClose: (() => void) | null = null;
  public onClaimReward: ((reward: DailyLoginReward) => void) | null = null;
  
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
    
    const panelWidth = Math.min(1000, this.canvas.width - 100);
    const panelHeight = Math.min(750, this.canvas.height - 100);
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;
    
    // Painel principal
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, { variant: 'dark' });
    
    // Header
    drawText(this.ctx, '🎁 RECOMPENSAS DIÁRIAS', panelX + panelWidth / 2, panelY + 50, {
      align: 'center',
      font: 'bold 36px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });
    
    drawText(this.ctx, `Faça login todos os dias para ganhar recompensas incríveis!`, panelX + panelWidth / 2, panelY + 85, {
      align: 'center',
      font: '16px monospace',
      color: 'rgba(220, 236, 230, 0.8)',
    });
    
    // Info
    drawText(this.ctx, `📅 Dia ${this.loginState.currentDay}/7 • Total de Logins: ${this.loginState.totalLogins}`, panelX + panelWidth / 2, panelY + 115, {
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
    
    // Cards de recompensas (7 dias)
    this.drawRewardCards(panelX + 30, panelY + 150, panelWidth - 60, panelHeight - 200);
  }
  
  private drawRewardCards(x: number, y: number, width: number, height: number) {
    const cols = 4;
    const rows = 2;
    const cardWidth = (width - 30) / cols;
    const cardHeight = (height - 20) / rows;
    const gap = 10;
    
    this.loginState.rewards.forEach((reward, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const cardX = x + col * (cardWidth + gap);
      const cardY = y + row * (cardHeight + gap);
      
      this.drawRewardCard(cardX, cardY, cardWidth - gap, cardHeight - gap, reward);
    });
  }
  
  private drawRewardCard(x: number, y: number, width: number, height: number, reward: DailyLoginReward) {
    const isCurrent = reward.day === this.loginState.currentDay;
    const isClaimed = reward.claimed;
    const isLocked = reward.day > this.loginState.currentDay;
    const canClaimThis = isCurrent && !isClaimed && this.canClaim;
    
    const isHovered = isMouseOver(this.mouseX, this.mouseY, x, y, width, height);
    
    // Fundo baseado no estado
    if (isClaimed) {
      this.ctx.fillStyle = 'rgba(42, 119, 96, 0.2)';
    } else if (isCurrent) {
      this.ctx.fillStyle = isHovered ? 'rgba(255, 200, 87, 0.3)' : 'rgba(255, 200, 87, 0.2)';
    } else if (isLocked) {
      this.ctx.fillStyle = 'rgba(20, 20, 20, 0.5)';
    } else {
      this.ctx.fillStyle = 'rgba(42, 119, 96, 0.15)';
    }
    
    this.ctx.fillRect(x, y, width, height);
    
    // Borda com cor da raridade
    const rarityColor = getRarityColor(reward.rarity);
    this.ctx.strokeStyle = isClaimed ? 'rgba(109, 199, 164, 0.3)' : rarityColor;
    this.ctx.lineWidth = isCurrent ? 4 : 2;
    this.ctx.strokeRect(x, y, width, height);
    
    // Badge do dia
    const badgeSize = 30;
    const badgeX = x + 10;
    const badgeY = y + 10;
    
    this.ctx.fillStyle = isClaimed ? 'rgba(109, 199, 164, 0.8)' : rarityColor;
    this.ctx.fillRect(badgeX, badgeY, badgeSize, badgeSize);
    
    drawText(this.ctx, `${reward.day}`, badgeX + badgeSize / 2, badgeY + badgeSize / 2 + 2, {
      align: 'center',
      baseline: 'middle',
      font: 'bold 18px monospace',
      color: '#000000',
    });
    
    // Ícone de status
    let statusIcon = '';
    if (isClaimed) statusIcon = '✅';
    else if (isCurrent) statusIcon = '⭐';
    else if (isLocked) statusIcon = '🔒';
    
    if (statusIcon) {
      drawText(this.ctx, statusIcon, x + width - 20, y + 20, {
        align: 'center',
        font: 'bold 20px monospace',
      });
    }
    
    // Recompensas
    let currentY = y + 55;
    
    if (reward.rewards.coronas) {
      drawText(this.ctx, `💰 ${reward.rewards.coronas}`, x + width / 2, currentY, {
        align: 'center',
        font: 'bold 16px monospace',
        color: isLocked ? 'rgba(255, 255, 255, 0.3)' : GLASS_THEME.palette.accent.amber,
      });
      currentY += 22;
    }
    
    if (reward.rewards.xp) {
      drawText(this.ctx, `⭐ ${reward.rewards.xp} XP`, x + width / 2, currentY, {
        align: 'center',
        font: 'bold 14px monospace',
        color: isLocked ? 'rgba(255, 255, 255, 0.3)' : 'rgba(220, 236, 230, 0.9)',
      });
      currentY += 22;
    }
    
    if (reward.rewards.items && reward.rewards.items.length > 0) {
      reward.rewards.items.forEach(item => {
        drawText(this.ctx, `${item.icon} ${item.name}`, x + width / 2, currentY, {
          align: 'center',
          font: '12px monospace',
          color: isLocked ? 'rgba(255, 255, 255, 0.3)' : 'rgba(183, 221, 205, 0.9)',
        });
        currentY += 18;
      });
    }
    
    // Botão claim (só se for o dia atual e não foi claimed)
    if (canClaimThis) {
      const btnWidth = width - 20;
      const btnHeight = 35;
      const btnX = x + 10;
      const btnY = y + height - btnHeight - 10;
      const btnIsHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);
      
      drawButton(this.ctx, btnX, btnY, btnWidth, btnHeight, '🎁 COLETAR', {
        variant: 'primary',
        isHovered: btnIsHovered,
        fontSize: 14,
      });
      
      this.buttons.set(`claim_${reward.day}`, {
        x: btnX,
        y: btnY,
        width: btnWidth,
        height: btnHeight,
        action: () => this.claimReward(reward.day),
      });
    }
  }
  
  private claimReward(day: number) {
    const reward = claimDailyReward(day);
    
    if (reward) {
      console.log('[DAILY LOGIN] 🎁 Recompensa coletada:', reward);
      
      audioManager.playSuccess();
      
      // Atualiza estado
      this.loginState = getDailyLoginState();
      this.canClaim = canClaimToday();
      
      if (this.onClaimReward) {
        this.onClaimReward(reward);
      }
    }
  }
  
  public close() {
    // Cleanup
  }
}

