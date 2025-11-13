/**
 * UI da Loja do Dalan
 */

import type { GameState, Item } from '../types';
import { COLORS } from './colors';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';
import { SHOP_ITEMS, ITEM_CATEGORIES, getWeeklyRareItems } from '../data/shop';

export class ShopUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();

  private selectedCategory: Item['category'] | 'all' = 'all';
  private selectedItem: Item | null = null;
  private scrollOffset = 0;

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
    drawText(this.ctx, '🛒 Loja do Dalan', panelX + 20, panelY + 20, {
      font: 'bold 32px monospace',
      color: COLORS.primary.gold,
    });

    // Dinheiro do jogador
    drawText(this.ctx, `💰 ${gameState.economy.coronas} Coronas`, panelX + panelWidth - 20, panelY + 25, {
      align: 'right',
      font: 'bold 20px monospace',
      color: COLORS.primary.gold,
    });

    // Botão de fechar
    const closeBtnX = panelX + panelWidth - 50;
    const closeBtnY = panelY + 10;
    const closeBtnSize = 30;
    const closeIsHovered = isMouseOver(this.mouseX, this.mouseY, closeBtnX, closeBtnY, closeBtnSize, closeBtnSize);

    drawButton(this.ctx, closeBtnX, closeBtnY, closeBtnSize, closeBtnSize, 'X', {
      bgColor: COLORS.ui.error,
      isHovered: closeIsHovered,
    });

    this.buttons.set('close', {
      x: closeBtnX,
      y: closeBtnY,
      width: closeBtnSize,
      height: closeBtnSize,
      action: () => {
        if (this.onClose) {
          this.onClose();
        }
      },
    });

    // Categorias
    this.drawCategories(panelX, panelY + 70);

    // Lista de itens
    this.drawItemList(panelX + 20, panelY + 130, panelWidth - 460, panelHeight - 160, gameState);

    // Painel de detalhes do item
    this.drawItemDetails(panelX + panelWidth - 420, panelY + 130, 400, panelHeight - 160, gameState);
  }

  private drawCategories(x: number, y: number) {
    const categories = [{ id: 'all' as const, name: 'Todos', icon: '🛍️' }, ...ITEM_CATEGORIES];
    const btnWidth = 100;
    const btnHeight = 40;
    const spacing = 10;

    categories.forEach((cat, index) => {
      const btnX = x + 20 + (index * (btnWidth + spacing));
      const isSelected = this.selectedCategory === cat.id;
      const isHovered = isMouseOver(this.mouseX, this.mouseY, btnX, y, btnWidth, btnHeight);

      const bgColor = isSelected ? COLORS.primary.gold : COLORS.bg.light;
      const textColor = isSelected ? COLORS.bg.dark : COLORS.ui.text;

      drawButton(this.ctx, btnX, y, btnWidth, btnHeight, `${cat.icon} ${cat.name}`, {
        bgColor,
        textColor,
        isHovered: !isSelected && isHovered,
      });

      this.buttons.set(`cat_${cat.id}`, {
        x: btnX,
        y,
        width: btnWidth,
        height: btnHeight,
        action: () => {
          this.selectedCategory = cat.id;
          this.scrollOffset = 0;
          this.selectedItem = null;
        },
      });
    });
  }

  private drawItemList(x: number, y: number, width: number, height: number, gameState: GameState) {
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.dark,
    });

    // Filtrar itens base
    let items = this.selectedCategory === 'all'
      ? SHOP_ITEMS
      : SHOP_ITEMS.filter(item => item.category === this.selectedCategory);

    // Adicionar itens raros da semana se categoria for 'all'
    if (this.selectedCategory === 'all') {
      const rareItems = getWeeklyRareItems(gameState.currentWeek);
      items = [...rareItems, ...items];
    }

    // Desenhar itens
    const itemHeight = 60;
    const visibleItems = Math.floor(height / itemHeight);
    const startIndex = this.scrollOffset;
    const endIndex = Math.min(startIndex + visibleItems, items.length);

    // Desenhar banner "Itens Raros da Semana" se houver itens raros
    if (this.selectedCategory === 'all' && startIndex === 0) {
      drawText(this.ctx, '✨ ITENS RAROS DA SEMANA', x + width / 2, y + 10, {
        align: 'center',
        font: 'bold 14px monospace',
        color: COLORS.primary.gold,
      });
    }

    const offsetY = this.selectedCategory === 'all' && startIndex === 0 ? 25 : 0;

    for (let i = startIndex; i < endIndex; i++) {
      const item = items[i];
      const itemY = y + 10 + offsetY + ((i - startIndex) * itemHeight);
      const isRare = i < getWeeklyRareItems(gameState.currentWeek).length;
      this.drawItemRow(item, x + 10, itemY, width - 20, itemHeight - 5, gameState, isRare);
    }

    // Scroll indicator
    if (items.length > visibleItems) {
      const scrollBarHeight = (visibleItems / items.length) * height;
      const scrollBarY = y + (this.scrollOffset / items.length) * height;

      this.ctx.fillStyle = COLORS.primary.gold;
      this.ctx.fillRect(x + width - 8, scrollBarY, 6, scrollBarHeight);
    }
  }

  private drawItemRow(item: Item, x: number, y: number, width: number, height: number, gameState: GameState, isRare: boolean = false) {
    const isSelected = this.selectedItem?.id === item.id;
    const isHovered = isMouseOver(this.mouseX, this.mouseY, x, y, width, height);
    const canAfford = gameState.economy.coronas >= item.price;

    // Fundo
    if (isRare) {
      // Destaque dourado para itens raros
      this.ctx.fillStyle = isSelected 
        ? COLORS.primary.gold
        : (isHovered ? '#3d3520' : '#2d2510');
      this.ctx.fillRect(x, y, width, height);
      // Borda dourada
      this.ctx.strokeStyle = COLORS.primary.gold;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, width, height);
    } else {
      this.ctx.fillStyle = isSelected 
        ? COLORS.primary.purple 
        : (isHovered ? COLORS.bg.light : 'transparent');
      this.ctx.fillRect(x, y, width, height);
    }

    // Estrela para itens raros
    if (isRare) {
      drawText(this.ctx, '✨', x + 5, y + 25, {
        font: '20px monospace',
      });
    }

    // Nome
    const nameX = isRare ? x + 30 : x + 10;
    drawText(this.ctx, item.name, nameX, y + 15, {
      font: 'bold 16px monospace',
      color: isRare ? COLORS.primary.gold : (canAfford ? COLORS.ui.text : COLORS.ui.textDim),
    });

    // Preço
    drawText(this.ctx, `${item.price} 💰`, x + width - 10, y + 15, {
      align: 'right',
      font: 'bold 16px monospace',
      color: canAfford ? COLORS.primary.gold : COLORS.ui.error,
    });

    // Efeito
    drawText(this.ctx, item.effect, x + 10, y + 40, {
      font: '12px monospace',
      color: COLORS.ui.textDim,
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
      bgColor: COLORS.bg.dark,
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

    // Nome do item
    drawText(this.ctx, item.name, x + 20, y + 30, {
      font: 'bold 24px monospace',
      color: COLORS.primary.gold,
    });

    // Categoria
    const category = ITEM_CATEGORIES.find(c => c.id === item.category);
    if (category) {
      drawText(this.ctx, `${category.icon} ${category.name}`, x + 20, y + 60, {
        font: '16px monospace',
        color: COLORS.ui.textDim,
      });
    }

    // Preço
    drawText(this.ctx, `Preço: ${item.price} 💰`, x + 20, y + 100, {
      font: 'bold 20px monospace',
      color: canAfford ? COLORS.primary.gold : COLORS.ui.error,
    });

    // Efeito
    drawText(this.ctx, 'Efeito:', x + 20, y + 140, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });

    this.drawWrappedText(item.effect, x + 20, y + 165, width - 40, 20, '14px monospace', COLORS.primary.green);

    // Descrição
    drawText(this.ctx, 'Descrição:', x + 20, y + 210, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });

    this.drawWrappedText(item.description, x + 20, y + 235, width - 40, 20, '14px monospace', COLORS.ui.textDim);

    // Botão de comprar
    const buyBtnX = x + 20;
    const buyBtnY = y + height - 60;
    const buyBtnWidth = width - 40;
    const buyBtnHeight = 45;
    const buyIsHovered = isMouseOver(this.mouseX, this.mouseY, buyBtnX, buyBtnY, buyBtnWidth, buyBtnHeight);

    drawButton(this.ctx, buyBtnX, buyBtnY, buyBtnWidth, buyBtnHeight, canAfford ? '💰 Comprar' : '❌ Sem dinheiro', {
      bgColor: canAfford ? COLORS.primary.green : COLORS.ui.error,
      isHovered: canAfford && buyIsHovered,
    });

    if (canAfford) {
      this.buttons.set('buy', {
        x: buyBtnX,
        y: buyBtnY,
        width: buyBtnWidth,
        height: buyBtnHeight,
        action: () => {
          if (this.onBuyItem && this.selectedItem) {
            this.onBuyItem(this.selectedItem);
          }
        },
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
      const testWidth = metrics.width;

      if (testWidth > maxWidth && i > 0) {
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
    this.selectedCategory = 'all';
    this.scrollOffset = 0;
  }
}

