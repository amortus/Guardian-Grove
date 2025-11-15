/**
 * Menu de Ajuda - Controles e Sistemas - Guardian Grove
 */

import type { GameState } from '../types';
import { GLASS_THEME } from './theme';
import { drawText, drawButton, isMouseOver, drawPanel } from './ui-helper';
import { KEYBOARD_SHORTCUTS } from '../systems/tutorial-manager';

export class HelpMenuUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();
  private currentTab: 'controls' | 'systems' | 'tips' = 'controls';
  
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
    
    // Fundo
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const panelWidth = Math.min(1000, this.canvas.width - 100);
    const panelHeight = Math.min(800, this.canvas.height - 100);
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;
    
    // Painel principal
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, { variant: 'dark' });
    
    // Header
    drawText(this.ctx, '📱 AJUDA & CONTROLES', panelX + panelWidth / 2, panelY + 50, {
      align: 'center',
      font: 'bold 36px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });
    
    // Botão fechar
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
      action: () => this.onClose?.(),
    });
    
    // Tabs
    this.drawTabs(panelX, panelY + 100, panelWidth);
    
    // Conteúdo baseado na tab
    const contentY = panelY + 160;
    const contentHeight = panelHeight - 200;
    
    if (this.currentTab === 'controls') {
      this.drawControlsTab(panelX + 40, contentY, panelWidth - 80, contentHeight);
    } else if (this.currentTab === 'systems') {
      this.drawSystemsTab(panelX + 40, contentY, panelWidth - 80, contentHeight);
    } else {
      this.drawTipsTab(panelX + 40, contentY, panelWidth - 80, contentHeight);
    }
  }
  
  private drawTabs(x: number, y: number, width: number) {
    const tabs = [
      { id: 'controls' as const, label: '⌨️ Controles', },
      { id: 'systems' as const, label: '🎮 Sistemas' },
      { id: 'tips' as const, label: '💡 Dicas' },
    ];
    
    const tabWidth = 200;
    const gap = 10;
    const startX = x + (width - (tabWidth * tabs.length + gap * (tabs.length - 1))) / 2;
    
    tabs.forEach((tab, index) => {
      const tabX = startX + index * (tabWidth + gap);
      const isActive = this.currentTab === tab.id;
      const isHovered = isMouseOver(this.mouseX, this.mouseY, tabX, y, tabWidth, 50);
      
      drawButton(this.ctx, tabX, y, tabWidth, 50, tab.label, {
        variant: isActive ? 'primary' : 'ghost',
        isHovered: isHovered,
        fontSize: 18,
      });
      
      this.buttons.set(`tab_${tab.id}`, {
        x: tabX,
        y,
        width: tabWidth,
        height: 50,
        action: () => { this.currentTab = tab.id; },
      });
    });
  }
  
  private drawControlsTab(x: number, y: number, width: number, height: number) {
    let currentY = y;
    
    drawText(this.ctx, 'MOVIMENTAÇÃO', x, currentY, {
      font: 'bold 24px monospace',
      color: GLASS_THEME.palette.accent.green,
    });
    currentY += 40;
    
    const movementControls = [
      { key: 'W/A/S/D', action: 'Movimentar personagem' },
      { key: 'Mouse Click', action: 'Clicar no chão para andar' },
      { key: 'E', action: 'Interagir com objetos/NPCs' },
    ];
    
    movementControls.forEach(control => {
      this.drawControlRow(x, currentY, width, control.key, control.action);
      currentY += 35;
    });
    
    currentY += 20;
    drawText(this.ctx, 'ATALHOS DE TECLADO', x, currentY, {
      font: 'bold 24px monospace',
      color: GLASS_THEME.palette.accent.green,
    });
    currentY += 40;
    
    Object.entries(KEYBOARD_SHORTCUTS).forEach(([key, action]) => {
      this.drawControlRow(x, currentY, width, key, action);
      currentY += 35;
    });
  }
  
  private drawControlRow(x: number, y: number, width: number, key: string, action: string) {
    // Tecla
    this.ctx.fillStyle = 'rgba(109, 199, 164, 0.2)';
    this.ctx.fillRect(x, y - 20, 120, 30);
    this.ctx.strokeStyle = GLASS_THEME.palette.accent.green;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y - 20, 120, 30);
    
    drawText(this.ctx, key, x + 60, y, {
      align: 'center',
      baseline: 'middle',
      font: 'bold 16px monospace',
      color: '#FFFFFF',
    });
    
    // Ação
    drawText(this.ctx, action, x + 140, y, {
      baseline: 'middle',
      font: '16px monospace',
      color: 'rgba(220, 236, 230, 0.9)',
    });
  }
  
  private drawSystemsTab(x: number, y: number, width: number, height: number) {
    let currentY = y;
    
    const systems = [
      { icon: '🏆', title: 'Conquistas', desc: 'Desbloqueie conquistas completando objetivos especiais.' },
      { icon: '📚', title: 'Missões', desc: 'Complete missões educativas diárias e semanais para ganhar recompensas.' },
      { icon: '🎮', title: 'Mini-Games', desc: 'Jogue mini-games educativos e aprenda sobre sustentabilidade.' },
      { icon: '🔨', title: 'Craft', desc: 'Crie itens úteis na oficina usando materiais coletados.' },
      { icon: '🛒', title: 'Market', desc: 'Compre e venda itens com outros guardiões.' },
      { icon: '🎰', title: 'Roleta Diária', desc: 'Gire a roleta uma vez por dia para ganhar recompensas!' },
      { icon: '🎖️', title: 'Leaderboard', desc: 'Veja os rankings globais e compare com outros jogadores.' },
      { icon: '🗺️', title: 'Exploração', desc: 'Explore a Trilha da Descoberta e complete missões interativas.' },
    ];
    
    systems.forEach((system, index) => {
      drawText(this.ctx, `${system.icon} ${system.title}`, x, currentY, {
        font: 'bold 20px monospace',
        color: GLASS_THEME.palette.accent.amber,
      });
      currentY += 30;
      
      drawText(this.ctx, system.desc, x + 10, currentY, {
        font: '16px monospace',
        color: 'rgba(220, 236, 230, 0.8)',
      });
      currentY += 45;
    });
  }
  
  private drawTipsTab(x: number, y: number, width: number, height: number) {
    let currentY = y;
    
    const tips = [
      { icon: '💰', tip: 'Complete missões diárias para ganhar Coronas extras!' },
      { icon: '🏆', tip: 'Conquistas difíceis dão recompensas muito melhores.' },
      { icon: '🎮', tip: 'Jogue mini-games para treinar sua memória e aprender.' },
      { icon: '🌿', tip: 'Cada ação no jogo reflete práticas sustentáveis do mundo real.' },
      { icon: '📚', tip: 'Leia as dicas educacionais para aprender sobre ecologia!' },
      { icon: '🔨', tip: 'Craftar itens é mais barato que comprar no mercado.' },
      { icon: '♻️', tip: 'Recicle materiais para economizar recursos e ganhar bônus!' },
      { icon: '🎯', tip: 'Combos no jogo da memória multiplicam suas recompensas!' },
      { icon: '⭐', tip: 'Login streak: faça login todo dia para recompensas extras.' },
      { icon: '🌳', tip: 'Cada árvore no Grove representa árvores reais que devemos proteger!' },
      { icon: '💡', tip: 'Use modo foto (F) para tirar screenshots incríveis!' },
      { icon: '🤝', tip: 'Interaja com outros jogadores para completar missões sociais.' },
    ];
    
    tips.forEach((tip, index) => {
      drawText(this.ctx, `${tip.icon} ${tip.tip}`, x, currentY, {
        font: '18px monospace',
        color: index % 2 === 0 ? 'rgba(220, 236, 230, 0.95)' : 'rgba(183, 221, 205, 0.9)',
      });
      currentY += 50;
    });
  }
  
  public close() {
    // Cleanup
  }
}

