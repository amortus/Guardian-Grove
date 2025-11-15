/**
 * Skin Shop UI - Guardian Grove
 * Loja de skins premium
 */

import type { GameState } from '../types';
import { drawText } from './ui-helper';
import { SHOP_SKINS, getAvailableSkins, purchaseSkin, getRarityColor, getRarityName, type Skin } from '../data/skins';

export class SkinShopUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  private scrollOffset: number = 0;
  private hoveredIndex: number = -1;
  private selectedSkin: Skin | null = null;
  
  public onClose: (() => void) | null = null;
  public onPurchase: ((skinId: string, price: number) => void) | null = null;
  
  // Bind methods once in constructor
  private boundHandleClick = this.handleClick.bind(this);
  private boundHandleMouseMove = this.handleMouseMove.bind(this);
  private boundHandleWheel = this.handleWheel.bind(this);
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.canvas.addEventListener('click', this.boundHandleClick);
    this.canvas.addEventListener('mousemove', this.boundHandleMouseMove);
    this.canvas.addEventListener('wheel', this.boundHandleWheel);
    
    console.log('[SKIN SHOP] 🛒 UI inicializada');
  }
  
  draw(gameState: GameState) {
    const { width, height } = this.canvas;
    
    // Fundo
    this.ctx.fillStyle = 'rgba(20, 30, 20, 0.95)';
    this.ctx.fillRect(0, 0, width, height);
    
    // Header
    this.drawHeader(gameState);
    
    // Grid de skins
    this.drawSkinGrid(gameState);
    
    // Preview lateral (se houver skin selecionada)
    if (this.selectedSkin) {
      this.drawSkinPreview(this.selectedSkin, gameState);
    }
    
    // Botão fechar
    this.drawCloseButton();
  }
  
  private drawHeader(gameState: GameState) {
    const { width } = this.canvas;
    
    // Título
    drawText(this.ctx, '🛒 LOJA DE SKINS', width / 2, 50, {
      align: 'center',
      font: 'bold 38px monospace',
      color: '#B7DDCD',
    });
    
    // Saldo de Coronas
    drawText(this.ctx, `💰 ${gameState.economy.coronas.toLocaleString()} Coronas`, width / 2, 95, {
      align: 'center',
      font: 'bold 22px monospace',
      color: '#FFC857',
    });
  }
  
  private drawSkinGrid(gameState: GameState) {
    const { width } = this.canvas;
    
    const skins = getAvailableSkins().filter(s => s.price > 0); // Apenas skins da loja
    
    const cardWidth = 200;
    const cardHeight = 280;
    const cols = 4;
    const spacing = 30;
    const gridWidth = (cardWidth * cols) + (spacing * (cols - 1));
    const startX = (width - gridWidth) / 2;
    let startY = 150 - this.scrollOffset;
    
    skins.forEach((skin, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const x = startX + (col * (cardWidth + spacing));
      const y = startY + (row * (cardHeight + spacing));
      
      // Skip se estiver fora da tela
      if (y + cardHeight < 130 || y > this.canvas.height - 50) {
        return;
      }
      
      this.drawSkinCard(skin, x, y, cardWidth, cardHeight, index === this.hoveredIndex);
    });
  }
  
  private drawSkinCard(
    skin: Skin,
    x: number,
    y: number,
    width: number,
    height: number,
    isHovered: boolean
  ) {
    // Background
    this.ctx.fillStyle = isHovered ? 'rgba(109, 199, 164, 0.15)' : 'rgba(109, 199, 164, 0.08)';
    this.ctx.fillRect(x, y, width, height);
    
    // Border com cor da raridade
    this.ctx.strokeStyle = getRarityColor(skin.rarity);
    this.ctx.lineWidth = isHovered ? 3 : 2;
    this.ctx.strokeRect(x, y, width, height);
    
    // Tag de raridade
    this.ctx.fillStyle = getRarityColor(skin.rarity);
    this.ctx.fillRect(x, y, width, 30);
    
    drawText(this.ctx, getRarityName(skin.rarity).toUpperCase(), x + width / 2, y + 15, {
      align: 'center',
      baseline: 'middle',
      font: 'bold 14px monospace',
      color: '#1A4D2E',
    });
    
    // Ícone
    drawText(this.ctx, skin.icon, x + width / 2, y + 75, {
      align: 'center',
      baseline: 'middle',
      font: '60px monospace',
      color: '#FFFFFF',
    });
    
    // Nome
    drawText(this.ctx, skin.name, x + width / 2, y + 130, {
      align: 'center',
      font: 'bold 18px monospace',
      color: '#B7DDCD',
    });
    
    // Preço ou "Comprada"
    if (skin.isOwned) {
      this.ctx.fillStyle = 'rgba(123, 232, 196, 0.3)';
      this.ctx.fillRect(x + 10, y + height - 60, width - 20, 45);
      
      drawText(this.ctx, '✓ COMPRADA', x + width / 2, y + height - 37, {
        align: 'center',
        baseline: 'middle',
        font: 'bold 16px monospace',
        color: '#7DE8C4',
      });
    } else {
      this.ctx.fillStyle = isHovered ? '#7DE8C4' : '#6DC7A4';
      this.ctx.fillRect(x + 10, y + height - 60, width - 20, 45);
      
      drawText(this.ctx, `💰 ${skin.price}`, x + width / 2, y + height - 37, {
        align: 'center',
        baseline: 'middle',
        font: 'bold 18px monospace',
        color: '#1A4D2E',
      });
    }
  }
  
  private drawSkinPreview(skin: Skin, gameState: GameState) {
    const { width, height } = this.canvas;
    
    const panelWidth = 350;
    const panelX = width - panelWidth - 20;
    const panelY = 140;
    const panelHeight = height - 160;
    
    // Background
    this.ctx.fillStyle = 'rgba(20, 30, 20, 0.95)';
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    this.ctx.strokeStyle = getRarityColor(skin.rarity);
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Ícone grande
    drawText(this.ctx, skin.icon, panelX + panelWidth / 2, panelY + 80, {
      align: 'center',
      baseline: 'middle',
      font: '100px monospace',
      color: '#FFFFFF',
    });
    
    // Nome
    drawText(this.ctx, skin.name, panelX + panelWidth / 2, panelY + 160, {
      align: 'center',
      font: 'bold 28px monospace',
      color: getRarityColor(skin.rarity),
    });
    
    // Raridade
    drawText(this.ctx, getRarityName(skin.rarity), panelX + panelWidth / 2, panelY + 195, {
      align: 'center',
      font: '18px monospace',
      color: '#8FAA9E',
    });
    
    // Descrição
    const words = skin.description.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    this.ctx.font = '16px monospace';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > panelWidth - 40 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) lines.push(currentLine);
    
    lines.forEach((line, i) => {
      drawText(this.ctx, line, panelX + panelWidth / 2, panelY + 230 + (i * 22), {
        align: 'center',
        font: '16px monospace',
        color: '#A0C9B5',
      });
    });
    
    // Stats
    const statsY = panelY + 320;
    
    drawText(this.ctx, '⚡ ATRIBUTOS', panelX + panelWidth / 2, statsY, {
      align: 'center',
      font: 'bold 18px monospace',
      color: '#B7DDCD',
    });
    
    const statNames = ['Velocidade', 'Poder', 'Defesa'];
    const statValues = [skin.stats?.speed || 5, skin.stats?.power || 5, skin.stats?.defense || 5];
    
    statNames.forEach((name, i) => {
      const statY = statsY + 40 + (i * 30);
      
      drawText(this.ctx, name, panelX + 30, statY, {
        font: '16px monospace',
        color: '#8FAA9E',
      });
      
      // Barra
      const barX = panelX + 150;
      const barWidth = 140;
      const barHeight = 14;
      
      this.ctx.fillStyle = 'rgba(109, 199, 164, 0.2)';
      this.ctx.fillRect(barX, statY - 7, barWidth, barHeight);
      
      const fillWidth = (statValues[i] / 10) * barWidth;
      this.ctx.fillStyle = getRarityColor(skin.rarity);
      this.ctx.fillRect(barX, statY - 7, fillWidth, barHeight);
      
      drawText(this.ctx, statValues[i].toString(), barX + barWidth + 15, statY, {
        font: 'bold 16px monospace',
        color: '#B7DDCD',
      });
    });
    
    // Botão comprar/fechar preview
    const btnY = panelY + panelHeight - 70;
    const btnWidth = panelWidth - 40;
    const btnX = panelX + 20;
    
    if (skin.isOwned) {
      this.ctx.fillStyle = 'rgba(123, 232, 196, 0.3)';
      this.ctx.fillRect(btnX, btnY, btnWidth, 50);
      
      drawText(this.ctx, '✓ JÁ POSSUI', panelX + panelWidth / 2, btnY + 25, {
        align: 'center',
        baseline: 'middle',
        font: 'bold 20px monospace',
        color: '#7DE8C4',
      });
    } else {
      const canAfford = gameState.economy.coronas >= skin.price;
      this.ctx.fillStyle = canAfford ? '#6DC7A4' : '#4F4F4F';
      this.ctx.fillRect(btnX, btnY, btnWidth, 50);
      
      this.ctx.strokeStyle = canAfford ? '#B7DDCD' : '#777777';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(btnX, btnY, btnWidth, 50);
      
      drawText(this.ctx, `COMPRAR POR ${skin.price} 💰`, panelX + panelWidth / 2, btnY + 25, {
        align: 'center',
        baseline: 'middle',
        font: 'bold 18px monospace',
        color: canAfford ? '#1A4D2E' : '#999999',
      });
    }
  }
  
  private drawCloseButton() {
    const btnSize = 50;
    const btnX = 20;
    const btnY = 20;
    
    this.ctx.fillStyle = this.hoveredIndex === -2 ? '#E74C3C' : '#C0392B';
    this.ctx.fillRect(btnX, btnY, btnSize, btnSize);
    
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(btnX, btnY, btnSize, btnSize);
    
    drawText(this.ctx, 'X', btnX + btnSize / 2, btnY + btnSize / 2 + 3, {
      align: 'center',
      baseline: 'middle',
      font: 'bold 28px monospace',
      color: '#FFFFFF',
    });
  }
  
  private handleClick(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const { width, height } = this.canvas;
    
    // Botão fechar
    if (x >= 20 && x <= 70 && y >= 20 && y <= 70) {
      if (this.onClose) this.onClose();
      return;
    }
    
    // Verifica clique na preview (botão comprar)
    if (this.selectedSkin) {
      const panelWidth = 350;
      const panelX = width - panelWidth - 20;
      const panelY = 140;
      const panelHeight = height - 160;
      
      const btnY = panelY + panelHeight - 70;
      const btnWidth = panelWidth - 40;
      const btnX = panelX + 20;
      
      if (x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + 50) {
        if (!this.selectedSkin.isOwned && this.onPurchase) {
          this.onPurchase(this.selectedSkin.id, this.selectedSkin.price);
        }
        return;
      }
    }
    
    // Verifica clique nos cards
    const skins = getAvailableSkins().filter(s => s.price > 0);
    const cardWidth = 200;
    const cardHeight = 280;
    const cols = 4;
    const spacing = 30;
    const gridWidth = (cardWidth * cols) + (spacing * (cols - 1));
    const startX = (width - gridWidth) / 2;
    let startY = 150 - this.scrollOffset;
    
    skins.forEach((skin, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const cardX = startX + (col * (cardWidth + spacing));
      const cardY = startY + (row * (cardHeight + spacing));
      
      if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
        this.selectedSkin = skin;
        console.log(`[SKIN SHOP] 🎯 Selecionado: ${skin.name}`);
      }
    });
  }
  
  private handleMouseMove(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const { width } = this.canvas;
    
    this.hoveredIndex = -1;
    
    // Hover no botão fechar
    if (x >= 20 && x <= 70 && y >= 20 && y <= 70) {
      this.hoveredIndex = -2;
      return;
    }
    
    // Hover nos cards
    const skins = getAvailableSkins().filter(s => s.price > 0);
    const cardWidth = 200;
    const cardHeight = 280;
    const cols = 4;
    const spacing = 30;
    const gridWidth = (cardWidth * cols) + (spacing * (cols - 1));
    const startX = (width - gridWidth) / 2;
    let startY = 150 - this.scrollOffset;
    
    skins.forEach((skin, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const cardX = startX + (col * (cardWidth + spacing));
      const cardY = startY + (row * (cardHeight + spacing));
      
      if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
        this.hoveredIndex = index;
      }
    });
  }
  
  private handleWheel(event: WheelEvent) {
    event.preventDefault();
    
    this.scrollOffset += event.deltaY * 0.5;
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, 500)); // Max scroll
  }
  
  dispose() {
    this.canvas.removeEventListener('click', this.boundHandleClick);
    this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);
    this.canvas.removeEventListener('wheel', this.boundHandleWheel);
  }
}

