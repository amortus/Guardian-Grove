/**
 * Loja de Raridades UI
 * Interface para itens únicos e especiais
 */

import type { GameState, Item } from '../types';
import { COLORS } from './colors';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';
import { getAvailableSpecialItems } from '../data/special-shop';

export class SpecialShopUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();

  private selectedItem: Item | null = null;
  private scrollOffset = 0;
  private purchasedItems: string[] = [];

  public onBuyItem: ((item: Item) => void) | null = null;
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
      this.scrollOffset += e.deltaY > 0 ? 1 : -1;
      this.scrollOffset = Math.max(0, this.scrollOffset);
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

  public setPurchasedItems(purchased: string[]) {
    this.purchasedItems = purchased;
  }

  public draw(gameState: GameState) {
    this.buttons.clear();

    // Fundo
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.90)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Painel principal
    const panelWidth = 900;
    const panelHeight = 600;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    // Painel com brilho especial
    this.ctx.shadowColor = COLORS.primary.gold;
    this.ctx.shadowBlur = 20;
    
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: '#1a0a0a',
      borderColor: COLORS.primary.gold,
    });

    this.ctx.shadowBlur = 0;

    // Header com estilo especial
    drawText(this.ctx, '✨ LOJA DE RARIDADES ✨', panelX + panelWidth / 2, panelY + 25, {
      align: 'center',
      font: 'bold 32px monospace',
      color: COLORS.primary.gold,
    });

    drawText(this.ctx, 'Itens Únicos - Compra Única', panelX + panelWidth / 2, panelY + 50, {
      align: 'center',
      font: '14px monospace',
      color: COLORS.primary.purple,
    });

    // Dinheiro
    drawText(this.ctx, `💰 ${gameState.economy.coronas} Coronas`, panelX + panelWidth - 20, panelY + 25, {
      align: 'right',
      font: 'bold 18px monospace',
      color: COLORS.primary.gold,
    });

    // Botão fechar (melhorado)
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
        if (this.onClose) this.onClose();
      },
    });

    // Lista de itens
    this.drawItemList(panelX + 20, panelY + 80, panelWidth - 460, panelHeight - 110, gameState);

    // Detalhes
    this.drawItemDetails(panelX + panelWidth - 420, panelY + 80, 400, panelHeight - 110, gameState);
  }

  private drawItemList(x: number, y: number, width: number, height: number, gameState: GameState) {
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: '#0d0505',
    });

    const availableItems = getAvailableSpecialItems(this.purchasedItems);

    if (availableItems.length === 0) {
      drawText(this.ctx, 'Todos os itens já foram comprados!', x + width / 2, y + height / 2, {
        align: 'center',
        font: '18px monospace',
        color: COLORS.ui.textDim,
      });
      return;
    }

    const itemHeight = 90;
    const visibleItems = Math.floor(height / itemHeight);
    const startIndex = this.scrollOffset;
    const endIndex = Math.min(startIndex + visibleItems, availableItems.length);

    for (let i = startIndex; i < endIndex; i++) {
      const item = availableItems[i];
      const itemY = y + 10 + ((i - startIndex) * itemHeight);
      this.drawItemRow(item, x + 10, itemY, width - 20, itemHeight - 5, gameState);
    }

    // Scroll
    if (availableItems.length > visibleItems) {
      const scrollBarHeight = (visibleItems / availableItems.length) * height;
      const scrollBarY = y + (this.scrollOffset / availableItems.length) * height;
      this.ctx.fillStyle = COLORS.primary.gold;
      this.ctx.fillRect(x + width - 8, scrollBarY, 6, scrollBarHeight);
    }
  }

  private drawItemRow(item: Item, x: number, y: number, width: number, height: number, gameState: GameState) {
    const isSelected = this.selectedItem?.id === item.id;
    const isHovered = isMouseOver(this.mouseX, this.mouseY, x, y, width, height);
    const canAfford = gameState.economy.coronas >= item.price;

    // Fundo com brilho dourado
    if (isHovered || isSelected) {
      this.ctx.shadowColor = COLORS.primary.gold;
      this.ctx.shadowBlur = 15;
    }

    this.ctx.fillStyle = isSelected 
      ? '#3d2510' 
      : (isHovered ? '#2d1510' : '#1d0d05');
    this.ctx.fillRect(x, y, width, height);

    // Borda dourada animada
    this.ctx.strokeStyle = COLORS.primary.gold;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);

    this.ctx.shadowBlur = 0;

    // Estrelas decorativas
    drawText(this.ctx, '✨', x + 5, y + 25, {
      font: '24px monospace',
    });

    drawText(this.ctx, '✨', x + width - 25, y + 25, {
      font: '24px monospace',
    });

    // Nome
    drawText(this.ctx, item.name, x + 35, y + 20, {
      font: 'bold 18px monospace',
      color: COLORS.primary.gold,
    });

    // Preço
    drawText(this.ctx, `${item.price} 💰`, x + width / 2, y + 50, {
      align: 'center',
      font: 'bold 20px monospace',
      color: canAfford ? COLORS.primary.gold : COLORS.ui.error,
    });

    // Status
    const statusText = canAfford ? 'DISPONÍVEL' : 'SEM DINHEIRO';
    const statusColor = canAfford ? COLORS.primary.green : COLORS.ui.error;
    
    drawText(this.ctx, statusText, x + width / 2, y + 72, {
      align: 'center',
      font: 'bold 12px monospace',
      color: statusColor,
    });

    this.buttons.set(`item_${item.id}`, {
      x,
      y,
      width,
      height,
      action: () => {
        this.selectedItem = item;
      },
    });
  }

  private drawItemDetails(x: number, y: number, width: number, height: number, gameState: GameState) {
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: '#0d0505',
    });

    if (!this.selectedItem) {
      drawText(this.ctx, 'Selecione um item', x + width / 2, y + height / 2, {
        align: 'center',
        font: '18px monospace',
        color: COLORS.ui.textDim,
      });
      return;
    }

    const item = this.selectedItem;
    const canAfford = gameState.economy.coronas >= item.price;

    // Brilho ao redor do painel
    this.ctx.shadowColor = COLORS.primary.gold;
    this.ctx.shadowBlur = 10;
    this.ctx.strokeStyle = COLORS.primary.gold;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x + 10, y + 10, width - 20, height - 20);
    this.ctx.shadowBlur = 0;

    // Nome com brilho
    drawText(this.ctx, item.name, x + width / 2, y + 40, {
      align: 'center',
      font: 'bold 24px monospace',
      color: COLORS.primary.gold,
    });

    // Preço grande
    drawText(this.ctx, `${item.price} 💰`, x + width / 2, y + 80, {
      align: 'center',
      font: 'bold 32px monospace',
      color: canAfford ? COLORS.primary.gold : COLORS.ui.error,
    });

    // Descrição
    drawText(this.ctx, 'Descrição:', x + 20, y + 130, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });

    this.drawWrappedText(item.description, x + 20, y + 155, width - 40, 20, '14px monospace', COLORS.ui.textDim);

    // Efeito
    drawText(this.ctx, 'Efeito:', x + 20, y + 225, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });

    this.drawWrappedText(item.effect, x + 20, y + 250, width - 40, 22, '16px monospace', COLORS.primary.purple);

    // Aviso de compra única
    drawText(this.ctx, '⚠️ ITEM ÚNICO', x + width / 2, y + 320, {
      align: 'center',
      font: 'bold 14px monospace',
      color: COLORS.primary.purple,
    });

    drawText(this.ctx, 'Só pode ser comprado uma vez!', x + width / 2, y + 340, {
      align: 'center',
      font: '12px monospace',
      color: COLORS.ui.textDim,
    });

    // Botão de comprar
    if (canAfford) {
      const buyBtnX = x + 20;
      const buyBtnY = y + height - 80;
      const buyBtnWidth = width - 40;
      const buyBtnHeight = 50;
      const buyIsHovered = isMouseOver(this.mouseX, this.mouseY, buyBtnX, buyBtnY, buyBtnWidth, buyBtnHeight);

      if (buyIsHovered) {
        this.ctx.shadowColor = COLORS.primary.gold;
        this.ctx.shadowBlur = 20;
      }

      drawButton(this.ctx, buyBtnX, buyBtnY, buyBtnWidth, buyBtnHeight, '✨ COMPRAR ✨', {
        bgColor: COLORS.primary.gold,
        textColor: '#000',
        isHovered: buyIsHovered,
      });

      this.ctx.shadowBlur = 0;

      this.buttons.set('buy', {
        x: buyBtnX,
        y: buyBtnY,
        width: buyBtnWidth,
        height: buyBtnHeight,
        action: () => {
          if (this.onBuyItem && this.selectedItem) {
            this.onBuyItem(this.selectedItem);
            this.purchasedItems.push(this.selectedItem.id);
            this.selectedItem = null;
          }
        },
      });
    } else {
      drawText(this.ctx, '⚠️ Dinheiro insuficiente', x + width / 2, y + height - 40, {
        align: 'center',
        font: 'bold 16px monospace',
        color: COLORS.ui.error,
      });
    }
  }

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

  public close() {
    this.selectedItem = null;
    this.scrollOffset = 0;
  }
}

