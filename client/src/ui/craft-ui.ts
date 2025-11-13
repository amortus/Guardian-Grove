/**
 * UI de Craft
 */

import type { GameState } from '../types';
import { COLORS } from './colors';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';
import { getAllRecipes, canCraft, type CraftRecipe } from '../systems/craft';
import { getItemById } from '../data/shop';

export class CraftUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();

  private selectedRecipe: CraftRecipe | null = null;
  private scrollOffset = 0;

  public onCraftItem: ((recipe: CraftRecipe) => void) | null = null;
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
      const recipes = getAllRecipes();
      const maxScroll = Math.max(0, recipes.length - 7); // 7 receitas visíveis
      this.scrollOffset += e.deltaY > 0 ? 1 : -1;
      this.scrollOffset = Math.max(0, Math.min(maxScroll, this.scrollOffset));
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
      borderColor: COLORS.primary.green,
    });

    // Header
    drawText(this.ctx, '⚗️ Oficina de Craft', panelX + 20, panelY + 20, {
      font: 'bold 32px monospace',
      color: COLORS.primary.green,
    });

    // Contador de receitas (abaixo do título)
    const recipes = getAllRecipes();
    const availableCount = recipes.filter(r => canCraft(r, gameState.inventory)).length;
    drawText(this.ctx, `${availableCount}/${recipes.length} disponíveis`, panelX + 20, panelY + 55, {
      font: 'bold 16px monospace',
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

    // Lista de receitas
    this.drawRecipeList(panelX + 20, panelY + 80, panelWidth - 460, panelHeight - 110, gameState);

    // Painel de detalhes
    this.drawRecipeDetails(panelX + panelWidth - 420, panelY + 70, 400, panelHeight - 100, gameState);
  }

  private drawRecipeList(x: number, y: number, width: number, height: number, gameState: GameState) {
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.dark,
    });

    const recipes = getAllRecipes();

    if (recipes.length === 0) {
      drawText(this.ctx, 'Nenhuma receita', x + width / 2, y + height / 2, {
        align: 'center',
        font: '18px monospace',
        color: COLORS.ui.textDim,
      });
      return;
    }

    // Desenhar receitas
    const recipeHeight = 70;
    const visibleRecipes = Math.floor(height / recipeHeight);
    const startIndex = this.scrollOffset;
    const endIndex = Math.min(startIndex + visibleRecipes, recipes.length);

    for (let i = startIndex; i < endIndex; i++) {
      const recipe = recipes[i];
      const recipeY = y + 10 + ((i - startIndex) * recipeHeight);
      const canCraftThis = canCraft(recipe, gameState.inventory);
      this.drawRecipeRow(recipe, x + 10, recipeY, width - 20, recipeHeight - 5, canCraftThis);
    }

    // Scroll indicator
    if (recipes.length > visibleRecipes) {
      const scrollBarHeight = Math.max(30, (visibleRecipes / recipes.length) * height);
      const maxScrollOffset = recipes.length - visibleRecipes;
      const scrollProgress = maxScrollOffset > 0 ? this.scrollOffset / maxScrollOffset : 0;
      const scrollBarY = y + scrollProgress * (height - scrollBarHeight);

      this.ctx.fillStyle = COLORS.primary.green;
      this.ctx.fillRect(x + width - 8, scrollBarY, 6, scrollBarHeight);
    }
  }

  private drawRecipeRow(recipe: CraftRecipe, x: number, y: number, width: number, height: number, canCraftThis: boolean) {
    const isSelected = this.selectedRecipe?.id === recipe.id;
    const isHovered = isMouseOver(this.mouseX, this.mouseY, x, y, width, height);

    // Fundo
    this.ctx.fillStyle = isSelected 
      ? COLORS.primary.green 
      : (isHovered ? COLORS.bg.light : 'transparent');
    this.ctx.fillRect(x, y, width, height);

    // Borda se selecionado
    if (isSelected) {
      this.ctx.strokeStyle = COLORS.primary.gold;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, width, height);
    }

    // Ícone
    drawText(this.ctx, canCraftThis ? '✅' : '🔒', x + 10, y + 25, {
      font: '24px monospace',
    });

    // Nome
    drawText(this.ctx, recipe.name, x + 45, y + 20, {
      font: 'bold 16px monospace',
      color: canCraftThis ? COLORS.ui.text : COLORS.ui.textDim,
    });

    // Descrição (truncada se muito longa)
    const maxDescLength = 40;
    const desc = recipe.description.length > maxDescLength 
      ? recipe.description.substring(0, maxDescLength) + '...'
      : recipe.description;
    
    drawText(this.ctx, desc, x + 45, y + 45, {
      font: '12px monospace',
      color: COLORS.ui.textDim,
    });

    this.buttons.set(`recipe_${recipe.id}`, {
      x,
      y,
      width,
      height,
      action: () => {
        this.selectedRecipe = recipe;
      },
    });
  }

  private drawRecipeDetails(x: number, y: number, width: number, height: number, gameState: GameState) {
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.dark,
    });

    if (!this.selectedRecipe) {
      drawText(this.ctx, 'Selecione uma receita', x + width / 2, y + height / 2, {
        align: 'center',
        font: '18px monospace',
        color: COLORS.ui.textDim,
      });
      return;
    }

    const recipe = this.selectedRecipe;
    const canCraftThis = canCraft(recipe, gameState.inventory);

    // Nome da receita
    drawText(this.ctx, recipe.name, x + 20, y + 30, {
      font: 'bold 22px monospace',
      color: COLORS.primary.gold,
    });

    // Descrição
    drawText(this.ctx, 'Descrição:', x + 20, y + 70, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });

    this.drawWrappedText(recipe.description, x + 20, y + 95, width - 40, 20, '14px monospace', COLORS.ui.textDim);

    // Ingredientes
    drawText(this.ctx, 'Ingredientes:', x + 20, y + 140, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });

    let ingredientY = y + 165;
    for (const ingredient of recipe.ingredients) {
      const item = getItemById(ingredient.itemId);
      if (!item) continue;

      const inventoryItem = gameState.inventory.find(i => i.id === ingredient.itemId);
      const hasEnough = inventoryItem && inventoryItem.quantity && inventoryItem.quantity >= ingredient.quantity;

      const color = hasEnough ? COLORS.primary.green : COLORS.ui.error;
      const current = inventoryItem?.quantity || 0;

      drawText(this.ctx, `${hasEnough ? '✅' : '❌'} ${item.name}`, x + 25, ingredientY, {
        font: '14px monospace',
        color,
      });

      drawText(this.ctx, `${current}/${ingredient.quantity}`, x + width - 25, ingredientY, {
        align: 'right',
        font: 'bold 14px monospace',
        color,
      });

      ingredientY += 25;
    }

    // Resultado
    drawText(this.ctx, 'Resultado:', x + 20, ingredientY + 20, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });

    const resultItem = getItemById(recipe.result.itemId);
    if (resultItem) {
      drawText(this.ctx, `✨ ${resultItem.name} x${recipe.result.quantity}`, x + 25, ingredientY + 45, {
        font: 'bold 14px monospace',
        color: COLORS.primary.gold,
      });
    }

    // Botão de craftar
    if (canCraftThis) {
      const craftBtnX = x + 20;
      const craftBtnY = y + height - 60;
      const craftBtnWidth = width - 40;
      const craftBtnHeight = 45;
      const craftIsHovered = isMouseOver(this.mouseX, this.mouseY, craftBtnX, craftBtnY, craftBtnWidth, craftBtnHeight);

      drawButton(this.ctx, craftBtnX, craftBtnY, craftBtnWidth, craftBtnHeight, '⚗️ Craftar', {
        bgColor: COLORS.primary.green,
        isHovered: craftIsHovered,
      });

      this.buttons.set('craft', {
        x: craftBtnX,
        y: craftBtnY,
        width: craftBtnWidth,
        height: craftBtnHeight,
        action: () => {
          if (this.onCraftItem && this.selectedRecipe) {
            this.onCraftItem(this.selectedRecipe);
          }
        },
      });
    } else {
      drawText(this.ctx, '⚠️ Ingredientes insuficientes', x + width / 2, y + height - 40, {
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
    this.selectedRecipe = null;
    this.scrollOffset = 0;
  }
}

