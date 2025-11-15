/**
 * Skin Manager UI - Guardian Grove
 * Tela para trocar a skin ativa do jogador
 */

import type { GameState } from '../types';
import { drawText } from './ui-helper';
import { getAvailableSkins, setActiveSkin, getActiveSkin, getRarityColor, getRarityName, type Skin } from '../data/skins';

export class SkinManagerUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  private scrollOffset: number = 0;
  private hoveredIndex: number = -1;
  private selectedSkin: Skin | null = null;
  
  public onClose: (() => void) | null = null;
  public onSkinChanged: ((skinId: string) => void) | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    
    console.log('[SKIN MANAGER] 🔄 UI inicializada');
  }
  
  draw(gameState: GameState) {
    const { width, height } = this.canvas;
    
    // Fundo
    this.ctx.fillStyle = 'rgba(20, 30, 20, 0.95)';
    this.ctx.fillRect(0, 0, width, height);
    
    // Header
    this.drawHeader();
    
    // Grid de skins
    this.drawSkinGrid();
    
    // Preview lateral (se houver skin selecionada)
    if (this.selectedSkin) {
      this.drawSkinPreview(this.selectedSkin);
    }
    
    // Botão fechar
    this.drawCloseButton();
  }
  
  private drawHeader() {
    const { width } = this.canvas;
    
    const activeSkin = getActiveSkin();
    
    // Título
    drawText(this.ctx, '🎭 TROCAR SKIN', width / 2, 50, {
      align: 'center',
      font: 'bold 38px monospace',
      color: '#B7DDCD',
    });
    
    // Skin ativa
    drawText(this.ctx, `Skin Atual: ${activeSkin.icon} ${activeSkin.name}`, width / 2, 95, {
      align: 'center',
      font: 'bold 22px monospace',
      color: '#7DE8C4',
    });
  }
  
  private drawSkinGrid() {
    const { width } = this.canvas;
    
    const skins = getAvailableSkins().filter(s => s.isOwned); // Apenas skins que o jogador possui
    
    const cardWidth = 180;
    const cardHeight = 240;
    const cols = 5;
    const spacing = 25;
    const gridWidth = (cardWidth * cols) + (spacing * (cols - 1));
    const startX = (width - gridWidth) / 2;
    let startY = 150 - this.scrollOffset;
    
    if (skins.length === 0) {
      drawText(this.ctx, '⚠️ Você não possui skins!', width / 2, 300, {
        align: 'center',
        font: 'bold 24px monospace',
        color: '#FFC857',
      });
      
      drawText(this.ctx, 'Compre skins na loja 🛒', width / 2, 340, {
        align: 'center',
        font: '20px monospace',
        color: '#8FAA9E',
      });
      
      return;
    }
    
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
    const isActive = skin.isActive;
    this.ctx.fillStyle = isActive
      ? 'rgba(123, 232, 196, 0.2)'
      : (isHovered ? 'rgba(109, 199, 164, 0.12)' : 'rgba(109, 199, 164, 0.06)');
    this.ctx.fillRect(x, y, width, height);
    
    // Border
    this.ctx.strokeStyle = isActive ? '#7DE8C4' : getRarityColor(skin.rarity);
    this.ctx.lineWidth = isActive ? 4 : 2;
    this.ctx.strokeRect(x, y, width, height);
    
    // Ícone
    drawText(this.ctx, skin.icon, x + width / 2, y + 60, {
      align: 'center',
      baseline: 'middle',
      font: '70px monospace',
      color: '#FFFFFF',
    });
    
    // Nome
    drawText(this.ctx, skin.name, x + width / 2, y + 120, {
      align: 'center',
      font: 'bold 16px monospace',
      color: getRarityColor(skin.rarity),
    });
    
    // Raridade
    drawText(this.ctx, getRarityName(skin.rarity), x + width / 2, y + 145, {
      align: 'center',
      font: '13px monospace',
      color: '#8FAA9E',
    });
    
    // Indicador de ativa
    if (isActive) {
      this.ctx.fillStyle = '#7DE8C4';
      this.ctx.fillRect(x + 10, y + height - 45, width - 20, 35);
      
      drawText(this.ctx, '✓ ATIVA', x + width / 2, y + height - 27, {
        align: 'center',
        baseline: 'middle',
        font: 'bold 16px monospace',
        color: '#1A4D2E',
      });
    } else {
      this.ctx.fillStyle = isHovered ? '#7DE8C4' : '#6DC7A4';
      this.ctx.fillRect(x + 10, y + height - 45, width - 20, 35);
      
      drawText(this.ctx, 'EQUIPAR', x + width / 2, y + height - 27, {
        align: 'center',
        baseline: 'middle',
        font: 'bold 16px monospace',
        color: '#1A4D2E',
      });
    }
  }
  
  private drawSkinPreview(skin: Skin) {
    const { width, height } = this.canvas;
    
    const panelWidth = 320;
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
    
    this.ctx.font = '15px monospace';
    
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
      drawText(this.ctx, line, panelX + panelWidth / 2, panelY + 230 + (i * 20), {
        align: 'center',
        font: '15px monospace',
        color: '#A0C9B5',
      });
    });
    
    // Stats
    const statsY = panelY + 320;
    
    drawText(this.ctx, '⚡ ATRIBUTOS', panelX + panelWidth / 2, statsY, {
      align: 'center',
      font: 'bold 16px monospace',
      color: '#B7DDCD',
    });
    
    const statNames = ['Velocidade', 'Poder', 'Defesa'];
    const statValues = [skin.stats?.speed || 5, skin.stats?.power || 5, skin.stats?.defense || 5];
    
    statNames.forEach((name, i) => {
      const statY = statsY + 35 + (i * 28);
      
      drawText(this.ctx, name, panelX + 25, statY, {
        font: '14px monospace',
        color: '#8FAA9E',
      });
      
      // Barra
      const barX = panelX + 130;
      const barWidth = 130;
      const barHeight = 12;
      
      this.ctx.fillStyle = 'rgba(109, 199, 164, 0.2)';
      this.ctx.fillRect(barX, statY - 6, barWidth, barHeight);
      
      const fillWidth = (statValues[i] / 10) * barWidth;
      this.ctx.fillStyle = getRarityColor(skin.rarity);
      this.ctx.fillRect(barX, statY - 6, fillWidth, barHeight);
      
      drawText(this.ctx, statValues[i].toString(), barX + barWidth + 12, statY, {
        font: 'bold 14px monospace',
        color: '#B7DDCD',
      });
    });
    
    // Botão equipar
    const btnY = panelY + panelHeight - 70;
    const btnWidth = panelWidth - 40;
    const btnX = panelX + 20;
    
    if (skin.isActive) {
      this.ctx.fillStyle = 'rgba(123, 232, 196, 0.3)';
      this.ctx.fillRect(btnX, btnY, btnWidth, 50);
      
      drawText(this.ctx, '✓ EQUIPADA', panelX + panelWidth / 2, btnY + 25, {
        align: 'center',
        baseline: 'middle',
        font: 'bold 20px monospace',
        color: '#7DE8C4',
      });
    } else {
      this.ctx.fillStyle = '#6DC7A4';
      this.ctx.fillRect(btnX, btnY, btnWidth, 50);
      
      this.ctx.strokeStyle = '#B7DDCD';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(btnX, btnY, btnWidth, 50);
      
      drawText(this.ctx, 'EQUIPAR SKIN', panelX + panelWidth / 2, btnY + 25, {
        align: 'center',
        baseline: 'middle',
        font: 'bold 18px monospace',
        color: '#1A4D2E',
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
    
    // Verifica clique na preview (botão equipar)
    if (this.selectedSkin) {
      const panelWidth = 320;
      const panelX = width - panelWidth - 20;
      const panelY = 140;
      const panelHeight = height - 160;
      
      const btnY = panelY + panelHeight - 70;
      const btnWidth = panelWidth - 40;
      const btnX = panelX + 20;
      
      if (x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + 50) {
        if (!this.selectedSkin.isActive) {
          setActiveSkin(this.selectedSkin.id);
          console.log(`[SKIN MANAGER] ✅ Skin equipada: ${this.selectedSkin.name}`);
          
          if (this.onSkinChanged) {
            this.onSkinChanged(this.selectedSkin.id);
          }
        }
        return;
      }
    }
    
    // Verifica clique nos cards
    const skins = getAvailableSkins().filter(s => s.isOwned);
    const cardWidth = 180;
    const cardHeight = 240;
    const cols = 5;
    const spacing = 25;
    const gridWidth = (cardWidth * cols) + (spacing * (cols - 1));
    const startX = (width - gridWidth) / 2;
    let startY = 150 - this.scrollOffset;
    
    skins.forEach((skin, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const cardX = startX + (col * (cardWidth + spacing));
      const cardY = startY + (row * (cardHeight + spacing));
      
      if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
        if (!skin.isActive) {
          setActiveSkin(skin.id);
          console.log(`[SKIN MANAGER] ✅ Skin equipada: ${skin.name}`);
          
          if (this.onSkinChanged) {
            this.onSkinChanged(skin.id);
          }
        }
        this.selectedSkin = skin;
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
    const skins = getAvailableSkins().filter(s => s.isOwned);
    const cardWidth = 180;
    const cardHeight = 240;
    const cols = 5;
    const spacing = 25;
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
        this.selectedSkin = skin;
      }
    });
  }
  
  private handleWheel(event: WheelEvent) {
    event.preventDefault();
    
    this.scrollOffset += event.deltaY * 0.5;
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, 500)); // Max scroll
  }
  
  dispose() {
    this.canvas.removeEventListener('click', this.handleClick.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('wheel', this.handleWheel.bind(this));
  }
}

