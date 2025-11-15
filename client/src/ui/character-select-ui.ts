/**
 * Character Select UI - Guardian Grove
 * Tela de seleção de guardião inicial
 */

import type { GameState } from '../types';
import { drawText } from './ui-helper';
import { STARTER_SKINS, setActiveSkin, type Skin, getRarityColor } from '../data/skins';

export class CharacterSelectUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  private selectedIndex: number = 0;
  private hoveredIndex: number = -1;
  
  public onSelect: ((skinId: string) => void) | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
    console.log('[CHARACTER SELECT] 🎭 UI inicializada');
  }
  
  draw(gameState: GameState) {
    const { width, height } = this.canvas;
    
    // Fundo escurecido
    this.ctx.fillStyle = 'rgba(20, 30, 20, 0.95)';
    this.ctx.fillRect(0, 0, width, height);
    
    // Título
    drawText(this.ctx, '🌿 ESCOLHA SEU GUARDIÃO 🌿', width / 2, 100, {
      align: 'center',
      font: 'bold 42px monospace',
      color: '#B7DDCD',
    });
    
    drawText(this.ctx, 'Cada guardião possui habilidades únicas', width / 2, 150, {
      align: 'center',
      font: '20px monospace',
      color: '#6DC7A4',
    });
    
    // Desenha os 3 guardiões
    const cardWidth = 280;
    const cardHeight = 420;
    const spacing = 40;
    const totalWidth = (cardWidth * 3) + (spacing * 2);
    const startX = (width - totalWidth) / 2;
    const startY = 220;
    
    STARTER_SKINS.forEach((skin, index) => {
      const x = startX + (index * (cardWidth + spacing));
      const y = startY;
      
      this.drawCharacterCard(skin, x, y, cardWidth, cardHeight, index === this.selectedIndex, index === this.hoveredIndex);
    });
    
    // Botão confirmar
    const btnWidth = 300;
    const btnHeight = 60;
    const btnX = (width - btnWidth) / 2;
    const btnY = height - 120;
    
    this.ctx.fillStyle = this.hoveredIndex === 999 ? '#7DE8C4' : '#6DC7A4';
    this.ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
    
    this.ctx.strokeStyle = '#B7DDCD';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);
    
    drawText(this.ctx, 'CONFIRMAR ESCOLHA', width / 2, btnY + btnHeight / 2 + 5, {
      align: 'center',
      baseline: 'middle',
      font: 'bold 22px monospace',
      color: '#1A4D2E',
    });
  }
  
  private drawCharacterCard(
    skin: Skin,
    x: number,
    y: number,
    width: number,
    height: number,
    isSelected: boolean,
    isHovered: boolean
  ) {
    // Card background
    this.ctx.fillStyle = isSelected ? 'rgba(123, 232, 196, 0.15)' : 'rgba(109, 199, 164, 0.08)';
    this.ctx.fillRect(x, y, width, height);
    
    // Border
    this.ctx.strokeStyle = isSelected ? '#7DE8C4' : (isHovered ? '#6DC7A4' : '#4F8A6B');
    this.ctx.lineWidth = isSelected ? 4 : 2;
    this.ctx.strokeRect(x, y, width, height);
    
    // Ícone grande
    drawText(this.ctx, skin.icon, x + width / 2, y + 80, {
      align: 'center',
      baseline: 'middle',
      font: '90px monospace',
      color: '#FFFFFF',
    });
    
    // Nome
    drawText(this.ctx, skin.name, x + width / 2, y + 170, {
      align: 'center',
      font: 'bold 28px monospace',
      color: getRarityColor(skin.rarity),
    });
    
    // Descrição (quebrada em 3 linhas)
    const words = skin.description.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > width - 30 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) lines.push(currentLine);
    
    lines.slice(0, 3).forEach((line, i) => {
      drawText(this.ctx, line, x + width / 2, y + 210 + (i * 22), {
        align: 'center',
        font: '16px monospace',
        color: '#A0C9B5',
      });
    });
    
    // Stats
    const statsY = y + height - 110;
    
    drawText(this.ctx, '⚡ ATRIBUTOS', x + width / 2, statsY, {
      align: 'center',
      font: 'bold 16px monospace',
      color: '#B7DDCD',
    });
    
    const statNames = ['Velocidade', 'Poder', 'Defesa'];
    const statValues = [skin.stats?.speed || 5, skin.stats?.power || 5, skin.stats?.defense || 5];
    
    statNames.forEach((name, i) => {
      const statY = statsY + 30 + (i * 22);
      
      drawText(this.ctx, name, x + 20, statY, {
        font: '14px monospace',
        color: '#8FAA9E',
      });
      
      // Barra de stat
      const barX = x + 120;
      const barWidth = 120;
      const barHeight = 12;
      
      this.ctx.fillStyle = 'rgba(109, 199, 164, 0.2)';
      this.ctx.fillRect(barX, statY - 6, barWidth, barHeight);
      
      const fillWidth = (statValues[i] / 10) * barWidth;
      this.ctx.fillStyle = '#6DC7A4';
      this.ctx.fillRect(barX, statY - 6, fillWidth, barHeight);
      
      drawText(this.ctx, statValues[i].toString(), barX + barWidth + 10, statY, {
        font: 'bold 14px monospace',
        color: '#B7DDCD',
      });
    });
    
    // Indicador de selecionado
    if (isSelected) {
      drawText(this.ctx, '✓ SELECIONADO', x + width / 2, y + height - 20, {
        align: 'center',
        font: 'bold 18px monospace',
        color: '#7DE8C4',
      });
    }
  }
  
  private handleClick(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const { width, height } = this.canvas;
    
    // Verifica clique nos cards
    const cardWidth = 280;
    const cardHeight = 420;
    const spacing = 40;
    const totalWidth = (cardWidth * 3) + (spacing * 2);
    const startX = (width - totalWidth) / 2;
    const startY = 220;
    
    STARTER_SKINS.forEach((skin, index) => {
      const cardX = startX + (index * (cardWidth + spacing));
      const cardY = startY;
      
      if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
        this.selectedIndex = index;
        console.log(`[CHARACTER SELECT] 🎯 Selecionado: ${skin.name}`);
      }
    });
    
    // Verifica clique no botão confirmar
    const btnWidth = 300;
    const btnHeight = 60;
    const btnX = (width - btnWidth) / 2;
    const btnY = height - 120;
    
    if (x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + btnHeight) {
      const selectedSkin = STARTER_SKINS[this.selectedIndex];
      console.log(`[CHARACTER SELECT] ✅ Confirmado: ${selectedSkin.name}`);
      
      setActiveSkin(selectedSkin.id);
      
      if (this.onSelect) {
        this.onSelect(selectedSkin.id);
      }
    }
  }
  
  private handleMouseMove(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const { width, height } = this.canvas;
    
    this.hoveredIndex = -1;
    
    // Verifica hover nos cards
    const cardWidth = 280;
    const cardHeight = 420;
    const spacing = 40;
    const totalWidth = (cardWidth * 3) + (spacing * 2);
    const startX = (width - totalWidth) / 2;
    const startY = 220;
    
    STARTER_SKINS.forEach((skin, index) => {
      const cardX = startX + (index * (cardWidth + spacing));
      const cardY = startY;
      
      if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
        this.hoveredIndex = index;
      }
    });
    
    // Verifica hover no botão
    const btnWidth = 300;
    const btnHeight = 60;
    const btnX = (width - btnWidth) / 2;
    const btnY = height - 120;
    
    if (x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + btnHeight) {
      this.hoveredIndex = 999;
    }
  }
  
  dispose() {
    this.canvas.removeEventListener('click', this.handleClick.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
  }
}

