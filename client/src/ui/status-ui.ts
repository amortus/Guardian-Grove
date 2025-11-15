/**
 * UI de Status do Guardião
 */

import type { GameState, Beast } from '../types';
import { COLORS } from './colors';
import { GLASS_THEME } from './theme';
import { drawPanel, drawText, drawButton, drawBar, isMouseOver } from './ui-helper';
import { getBeastLineData } from '../data/beasts';
import { getLifePhase, calculateBeastAge } from '../systems/beast';

export class StatusUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
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
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const beast = gameState.activeBeast;
    if (!beast) {
      drawText(this.ctx, 'Nenhum guardião selecionado', this.canvas.width / 2, this.canvas.height / 2, {
        align: 'center',
        font: 'bold 24px monospace',
        color: COLORS.ui.text,
      });
      return;
    }

    // Painel principal
    const panelWidth = 1000;
    const panelHeight = 700;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    // Fundo do painel com gradiente
    const gradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
    gradient.addColorStop(0, 'rgba(12, 38, 25, 0.95)');
    gradient.addColorStop(1, 'rgba(6, 22, 16, 0.95)');
    
    this.ctx.save();
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    // Borda brilhante
    this.ctx.strokeStyle = GLASS_THEME.palette.accent.green;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    this.ctx.restore();

    // Header
    const lineData = getBeastLineData(beast.line);
    drawText(this.ctx, `📊 Status de ${beast.name}`, panelX + 30, panelY + 40, {
      font: 'bold 32px monospace',
      color: GLASS_THEME.palette.accent.green,
    });

    // Linha da linhagem
    drawText(this.ctx, `Linhagem: ${lineData.name}`, panelX + 30, panelY + 80, {
      font: 'bold 20px monospace',
      color: 'rgba(220, 236, 230, 0.85)',
    });

    // Botão de fechar
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
      action: () => {
        if (this.onClose) this.onClose();
      },
    });

    // Informações gerais (coluna esquerda)
    let currentY = panelY + 140;
    const leftX = panelX + 40;
    const lineHeight = 35;

    this.drawInfoSection(leftX, currentY, 'Informações Gerais');
    currentY += 50;

    const age = calculateBeastAge(beast);
    const phase = getLifePhase(beast);

    this.drawInfoLine(leftX, currentY, '🎂 Idade', `${age} semanas (${phase})`);
    currentY += lineHeight;

    this.drawInfoLine(leftX, currentY, '⭐ Nível', `${beast.level || 1}`);
    currentY += lineHeight;

    this.drawInfoLine(leftX, currentY, '⚡ XP', `${beast.xp || 0} / ${this.getXpForNextLevel(beast.level || 1)}`);
    currentY += lineHeight;

    // Barra de XP
    const xpBarWidth = 400;
    const xpBarHeight = 25;
    const xpPercent = (beast.xp || 0) / this.getXpForNextLevel(beast.level || 1);
    
    drawBar(this.ctx, leftX + 20, currentY, xpBarWidth, xpBarHeight, xpPercent, {
      bgColor: 'rgba(42, 119, 96, 0.3)',
      fillColor: GLASS_THEME.palette.accent.green,
      borderColor: GLASS_THEME.palette.accent.green,
    });
    currentY += lineHeight + 20;

    // Atributos (coluna esquerda)
    currentY += 20;
    this.drawInfoSection(leftX, currentY, 'Atributos');
    currentY += 50;

    const stats = beast.stats;
    this.drawStatBar(leftX, currentY, '💪 Força', stats.strength, 100);
    currentY += lineHeight + 5;

    this.drawStatBar(leftX, currentY, '🛡️ Defesa', stats.defense, 100);
    currentY += lineHeight + 5;

    this.drawStatBar(leftX, currentY, '⚡ Velocidade', stats.speed, 100);
    currentY += lineHeight + 5;

    this.drawStatBar(leftX, currentY, '🧠 Inteligência', stats.intelligence, 100);
    currentY += lineHeight + 5;

    this.drawStatBar(leftX, currentY, '❤️ Vitalidade', stats.vitality, 100);
    currentY += lineHeight + 5;

    // Virtudes (coluna direita)
    const rightX = panelX + panelWidth / 2 + 20;
    let rightY = panelY + 140;

    this.drawInfoSection(rightX, rightY, 'Virtudes');
    rightY += 50;

    const virtues = beast.virtues;
    this.drawStatBar(rightX, rightY, '🌿 Sustentabilidade', virtues.sustainability, 100);
    rightY += lineHeight + 5;

    this.drawStatBar(rightX, rightY, '💚 Empatia', virtues.empathy, 100);
    rightY += lineHeight + 5;

    this.drawStatBar(rightX, rightY, '🔬 Conhecimento', virtues.knowledge, 100);
    rightY += lineHeight + 5;

    this.drawStatBar(rightX, rightY, '🎨 Criatividade', virtues.creativity, 100);
    rightY += lineHeight + 5;

    // Estado de saúde e felicidade
    rightY += 30;
    this.drawInfoSection(rightX, rightY, 'Bem-Estar');
    rightY += 50;

    this.drawInfoLine(rightX, rightY, '❤️ Saúde', `${beast.happiness.health}/100`);
    rightY += lineHeight;

    this.drawInfoLine(rightX, rightY, '😊 Felicidade', `${beast.happiness.happiness}/100`);
    rightY += lineHeight;

    this.drawInfoLine(rightX, rightY, '🍖 Fome', `${beast.happiness.hunger}/100`);
    rightY += lineHeight;

    // Histórico de explorações
    rightY += 30;
    this.drawInfoSection(rightX, rightY, 'Estatísticas');
    rightY += 50;

    this.drawInfoLine(rightX, rightY, '🗺️ Explorações hoje', `${beast.explorationCount || 0}/10`);
    rightY += lineHeight;

    this.drawInfoLine(rightX, rightY, '🏆 Batalhas vencidas', `${beast.battleStats?.wins || 0}`);
    rightY += lineHeight;

    this.drawInfoLine(rightX, rightY, '💀 Derrotas', `${beast.battleStats?.losses || 0}`);
    rightY += lineHeight;
  }

  private drawInfoSection(x: number, y: number, title: string) {
    drawText(this.ctx, title, x, y, {
      font: 'bold 24px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });
    
    // Linha decorativa abaixo do título
    this.ctx.save();
    this.ctx.strokeStyle = GLASS_THEME.palette.accent.amber;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + 10);
    this.ctx.lineTo(x + 200, y + 10);
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawInfoLine(x: number, y: number, label: string, value: string) {
    drawText(this.ctx, label, x, y, {
      font: 'bold 18px monospace',
      color: 'rgba(183, 221, 205, 0.9)',
    });

    drawText(this.ctx, value, x + 250, y, {
      font: 'bold 18px monospace',
      color: COLORS.ui.text,
    });
  }

  private drawStatBar(x: number, y: number, label: string, value: number, max: number) {
    drawText(this.ctx, label, x, y, {
      font: 'bold 16px monospace',
      color: 'rgba(183, 221, 205, 0.9)',
    });

    const barWidth = 200;
    const barHeight = 20;
    const barX = x + 220;
    const percent = Math.min(value / max, 1);

    drawBar(this.ctx, barX, y - 10, barWidth, barHeight, percent, {
      bgColor: 'rgba(42, 119, 96, 0.3)',
      fillColor: GLASS_THEME.palette.accent.green,
      borderColor: GLASS_THEME.palette.accent.green,
    });

    // Valor numérico
    drawText(this.ctx, `${value}/${max}`, barX + barWidth + 15, y, {
      font: 'bold 14px monospace',
      color: COLORS.ui.text,
    });
  }

  private getXpForNextLevel(level: number): number {
    return 100 + (level - 1) * 50;
  }

  public close() {
    // Cleanup event listeners if needed
  }
}

