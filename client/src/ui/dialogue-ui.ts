/**
 * UI de Diálogo com NPCs
 */

import type { NPC } from '../types';
import { COLORS } from './colors';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';

export class DialogueUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();

  private currentNPC: NPC | null = null;
  private currentDialogue: string = '';
  private dialogueOptions: Array<{ label: string; action: () => void }> = [];

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

  public setDialogue(npc: NPC, dialogue: string, options: Array<{ label: string; action: () => void }>) {
    this.currentNPC = npc;
    this.currentDialogue = dialogue;
    this.dialogueOptions = options;
  }

  public draw() {
    if (!this.currentNPC) return;

    this.buttons.clear();

    // Fundo semi-transparente
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Painel de diálogo
    const panelWidth = 950;
    const panelHeight = 500;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: COLORS.bg.medium,
      borderColor: COLORS.primary.gold,
    });

    // Nome e título do NPC
    drawText(this.ctx, this.currentNPC.name, panelX + 20, panelY + 20, {
      font: 'bold 28px monospace',
      color: COLORS.primary.gold,
    });

    drawText(this.ctx, this.currentNPC.title, panelX + 20, panelY + 50, {
      font: '16px monospace',
      color: COLORS.ui.textDim,
    });

    // Botão de fechar (no topo à direita)
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

    // Barra de afinidade (abaixo do nome)
    const affinityBarX = panelX + 20;
    const affinityBarY = panelY + 80;
    const affinityBarWidth = 200;
    const affinityBarHeight = 20;

    drawText(this.ctx, 'Afinidade:', affinityBarX, affinityBarY - 5, {
      font: '12px monospace',
      color: COLORS.ui.textDim,
    });

    this.ctx.fillStyle = COLORS.bg.dark;
    this.ctx.fillRect(affinityBarX + 90, affinityBarY, affinityBarWidth, affinityBarHeight);

    const affinityFill = (this.currentNPC.affinity / 100) * affinityBarWidth;
    this.ctx.fillStyle = this.getAffinityColor(this.currentNPC.affinity);
    this.ctx.fillRect(affinityBarX + 90, affinityBarY, affinityFill, affinityBarHeight);

    this.ctx.strokeStyle = COLORS.primary.gold;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(affinityBarX + 90, affinityBarY, affinityBarWidth, affinityBarHeight);

    drawText(this.ctx, `${this.currentNPC.affinity}%`, affinityBarX + 90 + affinityBarWidth / 2, affinityBarY + 14, {
      align: 'center',
      font: 'bold 12px monospace',
      color: COLORS.ui.text,
    });

    // Linha separadora (visual)
    this.ctx.strokeStyle = COLORS.ui.textDim;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(panelX + 30, panelY + 115);
    this.ctx.lineTo(panelX + panelWidth - 30, panelY + 115);
    this.ctx.stroke();

    // Área de texto (debug/fundo)
    const textAreaX = panelX + 20;
    const textAreaY = panelY + 125;
    const textAreaWidth = panelWidth - 40;
    const textAreaHeight = 215; // Espaço até os botões

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.fillRect(textAreaX, textAreaY, textAreaWidth, textAreaHeight);

    // Texto do diálogo (com quebra de linha)
    this.drawWrappedText(
      this.currentDialogue,
      textAreaX + 10,
      textAreaY + 25,
      textAreaWidth - 20,
      24
    );

    // Opções de diálogo
    const optionsStartY = panelY + panelHeight - 140;
    this.dialogueOptions.forEach((option, index) => {
      const btnX = panelX + 30;
      const btnY = optionsStartY + (index * 52);
      const btnWidth = panelWidth - 60;
      const btnHeight = 45;
      const isHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);

      drawButton(this.ctx, btnX, btnY, btnWidth, btnHeight, option.label, {
        bgColor: COLORS.primary.purple,
        isHovered,
      });

      this.buttons.set(`option_${index}`, {
        x: btnX,
        y: btnY,
        width: btnWidth,
        height: btnHeight,
        action: option.action,
      });
    });
  }

  private drawWrappedText(text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    // Garantir que o contexto está correto
    this.ctx.save();
    this.ctx.font = '16px monospace';
    this.ctx.fillStyle = COLORS.ui.text;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = this.ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && i > 0) {
        // Linha atual está cheia, desenha ela
        this.ctx.fillText(line, x, currentY);
        line = words[i] + ' ';
        currentY += lineHeight;
      } else {
        // Ainda cabe na linha atual
        line = testLine;
      }
    }
    
    // Desenha a última linha
    if (line.trim()) {
      this.ctx.fillText(line, x, currentY);
    }

    this.ctx.restore();
  }

  private getAffinityColor(affinity: number): string {
    if (affinity >= 75) return COLORS.primary.green;
    if (affinity >= 50) return COLORS.primary.blue;
    if (affinity >= 25) return COLORS.primary.gold;
    return COLORS.ui.error;
  }

  public close() {
    this.currentNPC = null;
    this.currentDialogue = '';
    this.dialogueOptions = [];
  }
}

