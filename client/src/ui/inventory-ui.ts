/**
 * UI de Inventário
 */

import type { GameState, Item } from '../types';
import { COLORS } from './colors';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';
import { ITEM_CATEGORIES } from '../data/shop';

export class InventoryUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();

  private selectedCategory: Item['category'] | 'all' = 'all';
  private selectedItem: Item | null = null;

  public onUseItem: ((item: Item) => void) | null = null;
  public onClose: (() => void) | null = null;
  public onShowConfirmation: ((title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void) | null = null;

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
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Painel principal
    const panelWidth = 900;
    const panelHeight = 600;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: COLORS.bg.medium,
      borderColor: COLORS.primary.purple,
    });

    // Header
    drawText(this.ctx, '🎒 Inventário', panelX + 20, panelY + 20, {
      font: 'bold 32px monospace',
      color: COLORS.primary.purple,
    });

    // Contador de itens
    const totalItems = gameState.inventory.reduce((sum, item) => sum + (item.quantity || 1), 0);
    drawText(this.ctx, `${totalItems} itens`, panelX + panelWidth - 20, panelY + 25, {
      align: 'right',
      font: 'bold 20px monospace',
      color: COLORS.ui.text,
    });

    // Botão de fechar (melhorado)
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

    // Categorias
    this.drawCategories(panelX, panelY + 70);

    // Lista de itens
    this.drawItemList(panelX + 20, panelY + 130, panelWidth - 460, panelHeight - 160, gameState);

    // Painel de detalhes do item
    this.drawItemDetails(panelX + panelWidth - 420, panelY + 130, 400, panelHeight - 160, gameState);
  }

  private drawCategories(x: number, y: number) {
    const categories = [{ id: 'all' as const, name: 'Todos', icon: '📦' }, ...ITEM_CATEGORIES];
    const btnWidth = 100;
    const btnHeight = 40;
    const spacing = 10;

    categories.forEach((cat, index) => {
      const btnX = x + 20 + (index * (btnWidth + spacing));
      const isSelected = this.selectedCategory === cat.id;
      const isHovered = isMouseOver(this.mouseX, this.mouseY, btnX, y, btnWidth, btnHeight);

      const bgColor = isSelected ? COLORS.primary.purple : COLORS.bg.light;
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
          this.selectedItem = null;
        },
      });
    });
  }

  private drawItemList(x: number, y: number, width: number, height: number, gameState: GameState) {
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.dark,
    });

    // Filtrar itens
    const items = this.selectedCategory === 'all'
      ? gameState.inventory
      : gameState.inventory.filter(item => item.category === this.selectedCategory);

    if (items.length === 0) {
      drawText(this.ctx, 'Nenhum item', x + width / 2, y + height / 2, {
        align: 'center',
        font: '18px monospace',
        color: COLORS.ui.textDim,
      });
      return;
    }

    // Desenhar itens
    const itemHeight = 70;
    const visibleItems = Math.floor(height / itemHeight);

    for (let i = 0; i < Math.min(items.length, visibleItems); i++) {
      const item = items[i];
      const itemY = y + 10 + (i * itemHeight);
      this.drawItemRow(item, x + 10, itemY, width - 20, itemHeight - 5);
    }
  }

  private drawItemRow(item: Item, x: number, y: number, width: number, height: number) {
    const isSelected = this.selectedItem?.id === item.id;
    const isHovered = isMouseOver(this.mouseX, this.mouseY, x, y, width, height);

    // Fundo
    this.ctx.fillStyle = isSelected 
      ? COLORS.primary.purple 
      : (isHovered ? COLORS.bg.light : 'transparent');
    this.ctx.fillRect(x, y, width, height);

    // Borda se selecionado
    if (isSelected) {
      this.ctx.strokeStyle = COLORS.primary.gold;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, width, height);
    }

    // Ícone de categoria
    const category = ITEM_CATEGORIES.find(c => c.id === item.category);
    if (category) {
      drawText(this.ctx, category.icon, x + 10, y + 25, {
        font: '32px monospace',
      });
    }

    // Nome
    drawText(this.ctx, item.name, x + 50, y + 20, {
      font: 'bold 18px monospace',
      color: COLORS.ui.text,
    });

    // Quantidade
    if (item.quantity && item.quantity > 1) {
      drawText(this.ctx, `x${item.quantity}`, x + width - 10, y + 20, {
        align: 'right',
        font: 'bold 18px monospace',
        color: COLORS.primary.gold,
      });
    }

    // Efeito
    drawText(this.ctx, item.effect, x + 50, y + 45, {
      font: '14px monospace',
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
    // NOVO: Todos os itens podem ser usados (removido verificação de relic)
    const canUse = gameState.activeBeast !== null && item.category !== 'crafting';

    // Ícone grande
    const category = ITEM_CATEGORIES.find(c => c.id === item.category);
    if (category) {
      drawText(this.ctx, category.icon, x + width / 2, y + 50, {
        align: 'center',
        font: '64px monospace',
      });
    }

    // Nome do item
    drawText(this.ctx, item.name, x + 20, y + 120, {
      font: 'bold 22px monospace',
      color: COLORS.primary.gold,
    });

    // Quantidade
    if (item.quantity && item.quantity > 0) {
      drawText(this.ctx, `Quantidade: ${item.quantity}`, x + 20, y + 150, {
        font: '16px monospace',
        color: COLORS.ui.text,
      });
    }

    // Efeito
    drawText(this.ctx, 'Efeito:', x + 20, y + 190, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });

    this.drawWrappedText(item.effect, x + 20, y + 215, width - 40, 20, '14px monospace', COLORS.primary.green);

    // Descrição
    drawText(this.ctx, 'Descrição:', x + 20, y + 260, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });

    this.drawWrappedText(item.description, x + 20, y + 285, width - 40, 20, '14px monospace', COLORS.ui.textDim);

    // Mensagem sobre materiais de craft
    if (item.category === 'crafting') {
      drawText(this.ctx, '⚙️ Ingrediente de Craft', x + width / 2, y + height - 100, {
        align: 'center',
        font: '14px monospace',
        color: COLORS.ui.info,
      });
    }

    // Botão de usar
    if (canUse) {
      const useBtnX = x + 20;
      const useBtnY = y + height - 60;
      const useBtnWidth = width - 40;
      const useBtnHeight = 45;
      const useIsHovered = isMouseOver(this.mouseX, this.mouseY, useBtnX, useBtnY, useBtnWidth, useBtnHeight);

      const beastName = gameState.activeBeast?.name || 'Besta';
      drawButton(this.ctx, useBtnX, useBtnY, useBtnWidth, useBtnHeight, `✨ Usar em ${beastName}`, {
        bgColor: COLORS.primary.green,
        isHovered: useIsHovered,
      });

      this.buttons.set('use', {
        x: useBtnX,
        y: useBtnY,
        width: useBtnWidth,
        height: useBtnHeight,
        action: () => {
          // NOVO: Usar direto sem confirmação
          if (this.onUseItem && this.selectedItem) {
            console.log('[Inventory UI] Using item:', this.selectedItem.name);
            this.onUseItem(this.selectedItem);
          }
        },
      });
    } else if (!gameState.activeBeast) {
      drawText(this.ctx, '⚠️ Nenhuma besta ativa', x + width / 2, y + height - 40, {
        align: 'center',
        font: '16px monospace',
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
    this.selectedItem = null;
    this.selectedCategory = 'all';
  }
}

