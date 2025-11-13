/**
 * UI do Templo dos Ecos - Guardian Grove
 * Interface para gerar bestas através de Relíquias de Eco
 */

import type { Beast, GameState } from '../types';
import { COLORS } from './colors';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';
import { generateBeastFromRelic, generateRelicDescription, validateRelicInput } from '../systems/relic-system';

export class TempleUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();
  
  // Estado do input
  private inputText = '';
  private isInputActive = false;
  private previewBeast: Beast | null = null;
  private relicDescription = '';
  private errorMessage = '';

  // Callbacks
  public onCreateBeast: ((beast: Beast) => void) | null = null;
  public onCancel: (() => void) | null = null;

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

    // Keyboard input
    window.addEventListener('keydown', (e) => {
      if (this.isInputActive) {
        this.handleKeyPress(e);
      }
    });
  }

  private handleKeyPress(e: KeyboardEvent) {
    e.preventDefault();
    
    if (e.key === 'Escape') {
      this.isInputActive = false;
      return;
    }

    if (e.key === 'Enter') {
      this.isInputActive = false;
      this.generatePreview();
      return;
    }

    if (e.key === 'Backspace') {
      this.inputText = this.inputText.slice(0, -1);
      this.errorMessage = '';
      return;
    }

    // Only allow alphanumeric and some special characters
    if (e.key.length === 1) {
      // Limit length
      if (this.inputText.length < 50) {
        this.inputText += e.key;
        this.errorMessage = '';
      }
    }
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
    
    // Background
    this.ctx.fillStyle = COLORS.bg.dark;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Title
    drawText(this.ctx, '🏛️ TEMPLO DOS ECOS', this.canvas.width / 2, 30, {
      align: 'center',
      font: 'bold 32px monospace',
      color: COLORS.primary.gold,
    });

    drawText(this.ctx, 'Insira uma palavra, nome ou frase para gerar uma Relíquia de Eco', this.canvas.width / 2, 70, {
      align: 'center',
      font: '14px monospace',
      color: COLORS.ui.textDim,
    });

    // Input area
    this.drawInputArea();

    // Preview area (if generated)
    if (this.previewBeast) {
      this.drawPreview(gameState);
    } else {
      this.drawEmptyPreview();
    }

    // Action buttons
    this.drawActionButtons();
  }

  private drawInputArea() {
    const x = this.canvas.width / 2 - 300;
    const y = 120;
    const width = 600;
    const height = 100;

    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.medium,
      borderColor: this.isInputActive ? COLORS.primary.gold : COLORS.primary.purple,
    });

    drawText(this.ctx, 'ENTRADA DA RELÍQUIA', x + 10, y + 10, {
      font: 'bold 14px monospace',
      color: COLORS.primary.gold,
    });

    // Input box
    const inputX = x + 10;
    const inputY = y + 35;
    const inputWidth = width - 20;
    const inputHeight = 35;

    this.ctx.fillStyle = COLORS.bg.dark;
    this.ctx.fillRect(inputX, inputY, inputWidth, inputHeight);
    
    this.ctx.strokeStyle = this.isInputActive ? COLORS.primary.gold : COLORS.ui.textDim;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(inputX, inputY, inputWidth, inputHeight);

    // Text
    let displayText = this.inputText || 'Clique aqui para digitar...';
    const textColor = this.inputText ? COLORS.ui.text : COLORS.ui.textDim;
    
    // Add blinking cursor when active
    if (this.isInputActive) {
      const cursorBlink = Math.floor(Date.now() / 500) % 2 === 0;
      if (cursorBlink) {
        displayText = this.inputText + '|';
      } else {
        displayText = this.inputText + ' ';
      }
    }
    
    drawText(this.ctx, displayText, inputX + 10, inputY + 12, {
      font: '16px monospace',
      color: this.isInputActive ? COLORS.primary.gold : textColor,
      shadow: false,
    });

    // Click to type button
    const btnX = inputX;
    const btnY = inputY;

    this.buttons.set('input_area', {
      x: btnX,
      y: btnY,
      width: inputWidth,
      height: inputHeight,
      action: () => {
        this.activateInput();
      },
    });

    // Error message or help text
    if (this.errorMessage) {
      drawText(this.ctx, this.errorMessage, x + 10, inputY + inputHeight + 15, {
        font: '12px monospace',
        color: COLORS.ui.error,
      });
    } else if (this.isInputActive) {
      drawText(this.ctx, 'Digite o texto • Enter para confirmar • Esc para cancelar', x + 10, inputY + inputHeight + 15, {
        font: '12px monospace',
        color: COLORS.ui.info,
      });
    }
  }

  private drawEmptyPreview() {
    const x = this.canvas.width / 2 - 300;
    const y = 250;
    const width = 600;
    const height = 300;

    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.medium,
    });

    drawText(this.ctx, '✨ Aguardando Relíquia...', this.canvas.width / 2, y + height / 2 - 20, {
      align: 'center',
      font: 'bold 24px monospace',
      color: COLORS.ui.textDim,
    });

    drawText(this.ctx, 'Digite algo acima e clique em "Gerar Preview"', this.canvas.width / 2, y + height / 2 + 20, {
      align: 'center',
      font: '14px monospace',
      color: COLORS.ui.textDim,
    });
  }

  private drawPreview(_gameState: GameState) {
    if (!this.previewBeast) return;

    const x = this.canvas.width / 2 - 300;
    const y = 250;
    const width = 600;
    const height = 300;

    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.medium,
      borderColor: COLORS.primary.gold,
    });

    // Beast preview
    const beastX = x + 30;
    const beastY = y + 50;
    const beastSize = 100;

    // Beast sprite placeholder
    this.ctx.fillStyle = this.getLineColor(this.previewBeast.line);
    this.ctx.fillRect(beastX, beastY, beastSize, beastSize);
    
    this.ctx.strokeStyle = COLORS.primary.gold;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(beastX, beastY, beastSize, beastSize);

    // Beast info
    const infoX = beastX + beastSize + 30;
    const infoY = beastY;

    drawText(this.ctx, this.previewBeast.name, infoX, infoY, {
      font: 'bold 24px monospace',
      color: COLORS.primary.gold,
    });

    drawText(this.ctx, `Linha: ${this.capitalizeFirst(this.previewBeast.line)}`, infoX, infoY + 35, {
      font: '16px monospace',
      color: COLORS.ui.text,
    });

    drawText(this.ctx, `Sangue: ${this.capitalizeFirst(this.previewBeast.blood)}`, infoX, infoY + 60, {
      font: '16px monospace',
      color: COLORS.ui.text,
    });

    drawText(this.ctx, `Afinidade: ${this.capitalizeFirst(this.previewBeast.affinity)}`, infoX, infoY + 85, {
      font: '16px monospace',
      color: COLORS.ui.text,
    });

    // Relic description
    drawText(this.ctx, 'Descrição da Relíquia:', x + 30, y + 180, {
      font: 'bold 14px monospace',
      color: COLORS.primary.purple,
    });

    drawText(this.ctx, this.relicDescription, x + 30, y + 205, {
      font: '12px monospace',
      color: COLORS.ui.textDim,
    });

    // Traits
    if (this.previewBeast.traits.length > 0) {
      drawText(this.ctx, `Traços: ${this.previewBeast.traits.join(', ')}`, x + 30, y + 240, {
        font: '12px monospace',
        color: COLORS.ui.info,
      });
    }
  }

  private drawActionButtons() {
    const buttonWidth = 180;
    const buttonHeight = 40;

    // Generate Preview button (centralizado)
    const generateY = 590;
    const generateX = this.canvas.width / 2 - buttonWidth / 2;
    const generateIsHovered = isMouseOver(this.mouseX, this.mouseY, generateX, generateY, buttonWidth, buttonHeight);

    drawButton(this.ctx, generateX, generateY, buttonWidth, buttonHeight, this.previewBeast ? 'Gerar Novo' : 'Gerar Preview', {
      bgColor: COLORS.primary.purple,
      isHovered: generateIsHovered,
    });

    this.buttons.set('generate', {
      x: generateX,
      y: generateY,
      width: buttonWidth,
      height: buttonHeight,
      action: () => {
        this.generatePreview();
      },
    });

    // Create Beast button (only if preview exists)
    if (this.previewBeast) {
      const createX = this.canvas.width / 2 - buttonWidth / 2;
      const createY = generateY + buttonHeight + 15;
      const createIsHovered = isMouseOver(this.mouseX, this.mouseY, createX, createY, buttonWidth, buttonHeight);

      drawButton(this.ctx, createX, createY, buttonWidth, buttonHeight, '✨ Criar Besta', {
        bgColor: COLORS.primary.gold,
        isHovered: createIsHovered,
      });

      this.buttons.set('create', {
        x: createX,
        y: createY,
        width: buttonWidth,
        height: buttonHeight,
        action: () => {
          this.createBeast();
        },
      });
    }

    // Cancel button (mais espaçado)
    const cancelWidth = 180;
    const cancelHeight = 40;
    const cancelX = this.canvas.width / 2 - cancelWidth / 2;
    const cancelY = this.previewBeast ? (generateY + buttonHeight * 2 + 35) : (generateY + buttonHeight + 20);
    const cancelIsHovered = isMouseOver(this.mouseX, this.mouseY, cancelX, cancelY, cancelWidth, cancelHeight);

    drawButton(this.ctx, cancelX, cancelY, cancelWidth, cancelHeight, 'Voltar ao Rancho', {
      bgColor: COLORS.ui.error,
      isHovered: cancelIsHovered,
    });

    this.buttons.set('cancel', {
      x: cancelX,
      y: cancelY,
      width: cancelWidth,
      height: cancelHeight,
      action: () => {
        if (this.onCancel) {
          this.onCancel();
        }
      },
    });
  }

  private activateInput() {
    this.isInputActive = true;
    this.errorMessage = '';
  }

  private generatePreview() {
    const validation = validateRelicInput(this.inputText);
    
    if (!validation.valid) {
      this.errorMessage = validation.error || 'Entrada inválida';
      this.previewBeast = null;
      return;
    }

    this.errorMessage = '';
    
    // Generate beast preview
    this.previewBeast = generateBeastFromRelic(
      this.inputText,
      'Preview',
      1
    );

    this.relicDescription = generateRelicDescription(this.inputText);
  }

  private createBeast() {
    if (!this.previewBeast) return;

    if (this.onCreateBeast) {
      this.onCreateBeast(this.previewBeast);
    }
  }

  private getLineColor(line: string): string {
    const colors: Record<string, string> = {
      olgrim: '#9f7aea',
      terravox: '#8b7355',
      feralis: '#48bb78',
      brontis: '#38a169',
      zephyra: '#63b3ed',
      ignar: '#fc8181',
      mirella: '#4299e1',
      umbrix: '#2d3748',
      sylphid: '#fbbf24',
      raukor: '#a0aec0',
    };
    return colors[line] || '#667eea';
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

