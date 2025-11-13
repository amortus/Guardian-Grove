/**
 * Tutorial Overlay
 * Tooltips e highlights visuais para guiar o jogador
 */

import { COLORS } from './colors';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';
import { getActiveTutorial, getCurrentStep, type Tutorial, type TutorialStep } from '../systems/tutorials';

export class TutorialOverlay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();

  private currentTutorial: Tutorial | null = null;
  private currentStep: TutorialStep | null = null;
  private tooltipPosition: { x: number; y: number } = { x: 400, y: 300 };
  private highlightElement: string | null = null;

  public onNextStep: (() => void) | null = null;
  public onSkipTutorial: (() => void) | null = null;

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

  /**
   * Atualiza o tutorial atual
   */
  public updateTutorial(tutorials: Tutorial[]) {
    this.currentTutorial = getActiveTutorial(tutorials);
    if (this.currentTutorial) {
      this.currentStep = getCurrentStep(this.currentTutorial);
      this.highlightElement = this.currentStep?.highlight || null;
    } else {
      this.currentStep = null;
      this.highlightElement = null;
    }
  }

  /**
   * Desenha o overlay do tutorial
   */
  public draw() {
    if (!this.currentTutorial || !this.currentStep) return;

    this.buttons.clear();

    // Desenha highlight se houver
    if (this.highlightElement) {
      this.drawHighlight(this.highlightElement);
    }

    // Desenha tooltip
    this.drawTooltip();

    // Desenha progresso
    this.drawProgress();
  }

  /**
   * Desenha highlight em um elemento da UI
   */
  private drawHighlight(elementId: string) {
    const positions = this.getElementPosition(elementId);
    if (!positions) return;

    const { x, y, width, height } = positions;

    // Escurece o resto da tela
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Limpa a área destacada
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    
    // Rounded rectangle para o highlight
    const radius = 10;
    const padding = 10;
    const hx = x - padding;
    const hy = y - padding;
    const hw = width + (padding * 2);
    const hh = height + (padding * 2);

    this.ctx.beginPath();
    this.ctx.moveTo(hx + radius, hy);
    this.ctx.lineTo(hx + hw - radius, hy);
    this.ctx.quadraticCurveTo(hx + hw, hy, hx + hw, hy + radius);
    this.ctx.lineTo(hx + hw, hy + hh - radius);
    this.ctx.quadraticCurveTo(hx + hw, hy + hh, hx + hw - radius, hy + hh);
    this.ctx.lineTo(hx + radius, hy + hh);
    this.ctx.quadraticCurveTo(hx, hy + hh, hx, hy + hh - radius);
    this.ctx.lineTo(hx, hy + radius);
    this.ctx.quadraticCurveTo(hx, hy, hx + radius, hy);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.restore();

    // Borda brilhante animada
    const time = Date.now() / 1000;
    const pulse = Math.sin(time * 3) * 0.3 + 0.7;
    
    this.ctx.strokeStyle = COLORS.primary.gold;
    this.ctx.lineWidth = 3;
    this.ctx.globalAlpha = pulse;
    this.ctx.shadowColor = COLORS.primary.gold;
    this.ctx.shadowBlur = 20;
    
    this.ctx.beginPath();
    this.ctx.moveTo(hx + radius, hy);
    this.ctx.lineTo(hx + hw - radius, hy);
    this.ctx.quadraticCurveTo(hx + hw, hy, hx + hw, hy + radius);
    this.ctx.lineTo(hx + hw, hy + hh - radius);
    this.ctx.quadraticCurveTo(hx + hw, hy + hh, hx + hw - radius, hy + hh);
    this.ctx.lineTo(hx + radius, hy + hh);
    this.ctx.quadraticCurveTo(hx, hy + hh, hx, hy + hh - radius);
    this.ctx.lineTo(hx, hy + radius);
    this.ctx.quadraticCurveTo(hx, hy, hx + radius, hy);
    this.ctx.closePath();
    this.ctx.stroke();
    
    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;

    // Ajusta posição do tooltip para ficar perto do elemento
    if (y + height + 220 < this.canvas.height) {
      this.tooltipPosition = { x: x + width / 2, y: y + height + 20 };
    } else {
      this.tooltipPosition = { x: x + width / 2, y: y - 220 };
    }
  }

  /**
   * Desenha o tooltip com a mensagem do tutorial
   */
  private drawTooltip() {
    if (!this.currentStep) return;

    const tooltipWidth = 400;
    const tooltipHeight = 180;
    const x = Math.max(20, Math.min(this.tooltipPosition.x - tooltipWidth / 2, this.canvas.width - tooltipWidth - 20));
    const y = Math.max(20, Math.min(this.tooltipPosition.y, this.canvas.height - tooltipHeight - 20));

    // Sombra
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.ctx.shadowBlur = 20;
    this.ctx.shadowOffsetX = 5;
    this.ctx.shadowOffsetY = 5;

    drawPanel(this.ctx, x, y, tooltipWidth, tooltipHeight, {
      bgColor: COLORS.bg.dark,
      borderColor: COLORS.primary.gold,
    });

    this.ctx.shadowBlur = 0;

    // Ícone
    drawText(this.ctx, '💡', x + 20, y + 35, {
      font: '32px monospace',
    });

    // Mensagem
    this.drawWrappedText(this.currentStep.message, x + 65, y + 25, tooltipWidth - 80, 20, '15px monospace', COLORS.ui.text);

    // Botões
    const btnY = y + tooltipHeight - 50;
    const btnHeight = 35;

    // Botão "Entendi"
    const nextBtnX = x + tooltipWidth - 120;
    const nextBtnWidth = 100;
    const nextIsHovered = isMouseOver(this.mouseX, this.mouseY, nextBtnX, btnY, nextBtnWidth, btnHeight);

    drawButton(this.ctx, nextBtnX, btnY, nextBtnWidth, btnHeight, '✓ Entendi', {
      bgColor: COLORS.primary.green,
      isHovered: nextIsHovered,
    });

    this.buttons.set('next', {
      x: nextBtnX,
      y: btnY,
      width: nextBtnWidth,
      height: btnHeight,
      action: () => {
        if (this.onNextStep) this.onNextStep();
      },
    });

    // Botão "Pular"
    const skipBtnX = x + 20;
    const skipBtnWidth = 100;
    const skipIsHovered = isMouseOver(this.mouseX, this.mouseY, skipBtnX, btnY, skipBtnWidth, btnHeight);

    drawButton(this.ctx, skipBtnX, btnY, skipBtnWidth, btnHeight, '⏭️ Pular', {
      bgColor: COLORS.bg.light,
      isHovered: skipIsHovered,
    });

    this.buttons.set('skip', {
      x: skipBtnX,
      y: btnY,
      width: skipBtnWidth,
      height: btnHeight,
      action: () => {
        if (this.onSkipTutorial) this.onSkipTutorial();
      },
    });
  }

  /**
   * Desenha o progresso do tutorial
   */
  private drawProgress() {
    if (!this.currentTutorial) return;

    const progressWidth = 300;
    const progressHeight = 50;
    const x = (this.canvas.width - progressWidth) / 2;
    const y = 20;

    drawPanel(this.ctx, x, y, progressWidth, progressHeight, {
      bgColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: COLORS.primary.purple,
    });

    // Título do tutorial
    drawText(this.ctx, this.currentTutorial.title, x + progressWidth / 2, y + 18, {
      align: 'center',
      font: 'bold 14px monospace',
      color: COLORS.primary.gold,
    });

    // Progresso
    const completed = this.currentTutorial.steps.filter(s => s.isCompleted).length;
    const total = this.currentTutorial.steps.length;
    const progress = completed / total;

    drawText(this.ctx, `Passo ${completed + 1}/${total}`, x + progressWidth / 2, y + 35, {
      align: 'center',
      font: '12px monospace',
      color: COLORS.ui.textDim,
    });

    // Barra de progresso pequena
    const barWidth = progressWidth - 40;
    const barHeight = 4;
    const barX = x + 20;
    const barY = y + 42;

    this.ctx.fillStyle = COLORS.bg.medium;
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    this.ctx.fillStyle = COLORS.primary.purple;
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
  }

  /**
   * Retorna posição de um elemento da UI baseado no ID
   */
  private getElementPosition(elementId: string): { x: number; y: number; width: number; height: number } | null {
    // Mapeamento de elementos da UI
    const positions: Record<string, { x: number; y: number; width: number; height: number }> = {
      'inventory_button': { x: this.canvas.width - 340, y: 10, width: 100, height: 40 },
      'craft_button': { x: this.canvas.width - 450, y: 10, width: 100, height: 40 },
      'quests_button': { x: this.canvas.width - 560, y: 10, width: 100, height: 40 },
      'village_button': { x: this.canvas.width - 230, y: 10, width: 100, height: 40 },
      'temple_button': { x: this.canvas.width - 120, y: 10, width: 100, height: 40 },
    };

    return positions[elementId] || null;
  }

  /**
   * Desenha texto com quebra de linha
   */
  private drawWrappedText(text: string, x: number, y: number, maxWidth: number, lineHeight: number, font: string, color: string) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    this.ctx.font = font;
    this.ctx.fillStyle = color;

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
    this.ctx.fillText(line, x, currentY);
  }

  /**
   * Verifica se há tutorial ativo
   */
  public hasActiveTutorial(): boolean {
    return this.currentTutorial !== null && this.currentStep !== null;
  }
}

