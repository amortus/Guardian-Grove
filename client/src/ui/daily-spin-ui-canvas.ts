/**
 * UI de Roleta Diária - Canvas com animação
 */

import type { GameState } from '../types';
import {
  SPIN_REWARDS,
  selectRandomReward,
  canSpinToday,
  getTimeUntilNextSpin,
  formatTimeRemaining,
  getRarityColor,
  getRarityMessage,
  type SpinReward,
  type DailySpinState,
} from '../data/daily-spin';
import { GLASS_THEME } from './theme';
import { drawText, drawButton, isMouseOver } from './ui-helper';

export class DailySpinUICanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();
  
  // Estado da roleta
  private spinState: DailySpinState = {
    lastSpinDate: null,
    canSpin: true,
    nextSpinIn: 0,
    totalSpins: 0,
    spinHistory: [],
  };
  
  // Animação
  private isSpinning = false;
  private currentRotation = 0;
  private targetRotation = 0;
  private spinSpeed = 0;
  private selectedReward: SpinReward | null = null;
  private showReward = false;
  private rewardTimer = 0;
  
  public onClose: (() => void) | null = null;
  public onRewardClaimed: ((reward: SpinReward) => void) | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.setupEventListeners();
    this.loadSpinState();
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
  
  private loadSpinState() {
    // TODO: Carregar do localStorage ou API
    const saved = localStorage.getItem('daily_spin_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      this.spinState = {
        ...parsed,
        lastSpinDate: parsed.lastSpinDate ? new Date(parsed.lastSpinDate) : null,
      };
    }
    
    this.spinState.canSpin = canSpinToday(this.spinState.lastSpinDate);
    this.spinState.nextSpinIn = getTimeUntilNextSpin(this.spinState.lastSpinDate);
  }
  
  private saveSpinState() {
    localStorage.setItem('daily_spin_state', JSON.stringify(this.spinState));
  }
  
  private startSpin() {
    if (!this.spinState.canSpin || this.isSpinning) return;
    
    this.isSpinning = true;
    this.selectedReward = selectRandomReward();
    
    // Calcula rotação alvo
    const rewardIndex = SPIN_REWARDS.indexOf(this.selectedReward);
    const sliceAngle = (Math.PI * 2) / SPIN_REWARDS.length;
    const targetAngle = rewardIndex * sliceAngle;
    
    // Adiciona rotações extras + alvo
    this.targetRotation = this.currentRotation + (Math.PI * 2 * 5) + targetAngle;
    this.spinSpeed = 0.3;
    
    console.log('[SPIN] 🎰 Girando! Recompensa:', this.selectedReward.name);
  }
  
  private updateAnimation(delta: number) {
    if (!this.isSpinning) return;
    
    // Animação de desaceleração
    const diff = this.targetRotation - this.currentRotation;
    
    if (Math.abs(diff) > 0.01) {
      this.currentRotation += diff * this.spinSpeed * delta * 60;
      this.spinSpeed *= 0.98; // Desacelera gradualmente
    } else {
      // Parou!
      this.currentRotation = this.targetRotation;
      this.isSpinning = false;
      this.showReward = true;
      this.rewardTimer = 3.0; // Mostra por 3 segundos
      
      // Atualiza estado
      this.spinState.lastSpinDate = new Date();
      this.spinState.canSpin = false;
      this.spinState.totalSpins++;
      this.spinState.spinHistory.unshift({
        reward: this.selectedReward!,
        date: new Date(),
      });
      
      if (this.spinState.spinHistory.length > 10) {
        this.spinState.spinHistory.pop();
      }
      
      this.saveSpinState();
      
      // Callback
      if (this.selectedReward && this.onRewardClaimed) {
        this.onRewardClaimed(this.selectedReward);
      }
    }
  }
  
  public draw(gameState: GameState, delta: number = 1 / 60) {
    this.buttons.clear();
    this.updateAnimation(delta);
    
    // Atualiza timer de reward
    if (this.showReward && this.rewardTimer > 0) {
      this.rewardTimer -= delta;
      if (this.rewardTimer <= 0) {
        this.showReward = false;
        this.selectedReward = null;
      }
    }
    
    // Fundo
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const panelWidth = Math.min(800, this.canvas.width - 100);
    const panelHeight = Math.min(900, this.canvas.height - 100);
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
    drawText(this.ctx, '🎰 Roleta Diária', panelX + panelWidth / 2, panelY + 40, {
      align: 'center',
      font: 'bold 36px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });
    
    // Botão fechar
    const closeBtnWidth = 120;
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
    
    // Roleta
    const wheelCenterX = panelX + panelWidth / 2;
    const wheelCenterY = panelY + panelHeight / 2 - 50;
    const wheelRadius = 220;
    
    this.drawWheel(wheelCenterX, wheelCenterY, wheelRadius);
    
    // Botão de girar
    if (this.spinState.canSpin && !this.isSpinning) {
      this.drawSpinButton(wheelCenterX, wheelCenterY + wheelRadius + 60);
    } else if (!this.spinState.canSpin) {
      this.drawCooldown(wheelCenterX, wheelCenterY + wheelRadius + 60);
    }
    
    // Popup de recompensa
    if (this.showReward && this.selectedReward) {
      this.drawRewardPopup(wheelCenterX, wheelCenterY);
    }
    
    // Estatísticas
    this.drawStats(panelX + 30, panelY + panelHeight - 60);
  }
  
  private drawWheel(centerX: number, centerY: number, radius: number) {
    const sliceAngle = (Math.PI * 2) / SPIN_REWARDS.length;
    
    // Desenha fatias
    SPIN_REWARDS.forEach((reward, index) => {
      const startAngle = index * sliceAngle - this.currentRotation - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;
      
      // Fatia
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      this.ctx.closePath();
      this.ctx.fillStyle = reward.color;
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.restore();
      
      // Ícone
      const iconAngle = startAngle + sliceAngle / 2;
      const iconRadius = radius * 0.7;
      const iconX = centerX + Math.cos(iconAngle) * iconRadius;
      const iconY = centerY + Math.sin(iconAngle) * iconRadius;
      
      this.ctx.save();
      this.ctx.translate(iconX, iconY);
      this.ctx.rotate(iconAngle + Math.PI / 2);
      
      drawText(this.ctx, reward.icon, 0, 0, {
        align: 'center',
        baseline: 'middle',
        font: 'bold 28px monospace',
        color: '#FFFFFF',
      });
      
      this.ctx.restore();
    });
    
    // Círculo central
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
    this.ctx.fillStyle = GLASS_THEME.palette.accent.amber;
    this.ctx.fill();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();
    
    // Indicador (seta)
    this.ctx.save();
    this.ctx.fillStyle = '#FF0000';
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - radius - 30);
    this.ctx.lineTo(centerX - 20, centerY - radius - 10);
    this.ctx.lineTo(centerX + 20, centerY - radius - 10);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    this.ctx.restore();
  }
  
  private drawSpinButton(centerX: number, centerY: number) {
    const btnWidth = 200;
    const btnHeight = 60;
    const btnX = centerX - btnWidth / 2;
    const btnY = centerY - btnHeight / 2;
    const isHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);
    
    drawButton(this.ctx, btnX, btnY, btnWidth, btnHeight, '🎲 GIRAR!', {
      variant: 'primary',
      isHovered: isHovered,
      fontSize: 24,
    });
    
    this.buttons.set('spin', {
      x: btnX,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
      action: () => this.startSpin(),
    });
  }
  
  private drawCooldown(centerX: number, centerY: number) {
    const timeRemaining = formatTimeRemaining(this.spinState.nextSpinIn);
    
    drawText(this.ctx, '⏰ Próximo giro em:', centerX, centerY - 10, {
      align: 'center',
      font: 'bold 18px monospace',
      color: 'rgba(220, 236, 230, 0.7)',
    });
    
    drawText(this.ctx, timeRemaining, centerX, centerY + 20, {
      align: 'center',
      font: 'bold 28px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });
  }
  
  private drawRewardPopup(centerX: number, centerY: number) {
    if (!this.selectedReward) return;
    
    const popupWidth = 400;
    const popupHeight = 300;
    const popupX = centerX - popupWidth / 2;
    const popupY = centerY - popupHeight / 2;
    
    // Fundo
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(popupX, popupY, popupWidth, popupHeight);
    
    // Borda colorida
    this.ctx.strokeStyle = getRarityColor(this.selectedReward.rarity);
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(popupX, popupY, popupWidth, popupHeight);
    
    // Ícone grande
    drawText(this.ctx, this.selectedReward.icon, centerX, centerY - 60, {
      align: 'center',
      font: 'bold 80px monospace',
      color: getRarityColor(this.selectedReward.rarity),
    });
    
    // Nome
    drawText(this.ctx, this.selectedReward.name, centerX, centerY + 20, {
      align: 'center',
      font: 'bold 28px monospace',
      color: '#FFFFFF',
    });
    
    // Mensagem
    drawText(this.ctx, getRarityMessage(this.selectedReward.rarity), centerX, centerY + 60, {
      align: 'center',
      font: 'bold 16px monospace',
      color: getRarityColor(this.selectedReward.rarity),
    });
  }
  
  private drawStats(x: number, y: number) {
    drawText(this.ctx, `🎰 Total de Giros: ${this.spinState.totalSpins}`, x, y, {
      font: 'bold 16px monospace',
      color: GLASS_THEME.palette.accent.green,
    });
  }
  
  public update(delta: number) {
    // Atualiza cooldown
    if (!this.spinState.canSpin) {
      this.spinState.nextSpinIn = getTimeUntilNextSpin(this.spinState.lastSpinDate);
      this.spinState.canSpin = canSpinToday(this.spinState.lastSpinDate);
    }
  }
  
  public close() {
    // Cleanup
  }
}

