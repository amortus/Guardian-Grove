/**
 * Help UI - Guardian Grove
 * Menu de ajuda com instruções do jogo
 */

import { GLASS_THEME } from './theme';
import { drawText, drawButton, isMouseOver } from './ui-helper';

export class HelpUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private boundHandleMouseMove: (e: MouseEvent) => void;
  private boundHandleClick: (e: MouseEvent) => void;

  public onClose?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleClick = this.handleClick.bind(this);

    this.canvas.addEventListener('mousemove', this.boundHandleMouseMove);
    this.canvas.addEventListener('click', this.boundHandleClick);
  }

  private handleMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.mouseX = (e.clientX - rect.left) * scaleX;
    this.mouseY = (e.clientY - rect.top) * scaleY;
  }

  private handleClick(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Close button
    const panelWidth = 900;
    const panelHeight = 700;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    const closeBtnX = panelX + panelWidth - 60;
    const closeBtnY = panelY + 20;
    const closeBtnSize = 40;

    if (isMouseOver(clickX, clickY, closeBtnX, closeBtnY, closeBtnSize, closeBtnSize)) {
      this.onClose?.();
    }
  }

  public render() {
    const panelWidth = 900;
    const panelHeight = 700;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    // Background overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Main panel
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(12, 38, 25, 0.95)';
    this.roundRect(panelX, panelY, panelWidth, panelHeight, 24);
    this.ctx.fill();

    this.ctx.strokeStyle = GLASS_THEME.palette.accent.green;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.restore();

    // Title
    drawText(this.ctx, '📖 AJUDA - COMO JOGAR', panelX + panelWidth / 2, panelY + 50, {
      align: 'center',
      font: 'bold 32px monospace',
      color: GLASS_THEME.palette.accent.green,
    });

    // Content sections
    let currentY = panelY + 110;
    const leftMargin = panelX + 60;
    const lineHeight = 26;
    const sectionSpacing = 34;

    // Seção 1: Movimentação
    this.drawSectionTitle('🎮 MOVIMENTAÇÃO', leftMargin, currentY);
    currentY += sectionSpacing;
    this.drawHelpText('• Clique no chão verde para mover seu guardião', leftMargin + 20, currentY);
    currentY += lineHeight;
    this.drawHelpText('• Use WASD para mover manualmente (W=frente, S=trás, A=esq, D=dir)', leftMargin + 20, currentY);
    currentY += lineHeight;
    this.drawHelpText('• A câmera acompanha automaticamente seu guardião', leftMargin + 20, currentY);
    currentY += lineHeight + 12;

    // Seção 2: Interação com o Santuário
    this.drawSectionTitle('🏛️ INTERAÇÃO COM O SANTUÁRIO', leftMargin, currentY);
    currentY += sectionSpacing;
    this.drawHelpText('• Aproxime-se de construções iluminadas para interagir', leftMargin + 20, currentY);
    currentY += lineHeight;
    this.drawHelpText('• Pressione [E] ou clique para abrir menus', leftMargin + 20, currentY);
    currentY += lineHeight;
    this.drawHelpText('• 🏠 Casas: Descanso e cuidados com seu guardião', leftMargin + 20, currentY);
    currentY += lineHeight;
    this.drawHelpText('• ⛪ Templo: Treinamento espiritual e bênçãos', leftMargin + 20, currentY);
    currentY += lineHeight;
    this.drawHelpText('• 🔨 Oficina de Craft: Crie itens e equipamentos', leftMargin + 20, currentY);
    currentY += lineHeight;
    this.drawHelpText('• 🏪 Mercado: Compre e venda itens', leftMargin + 20, currentY);
    currentY += lineHeight;
    this.drawHelpText('• 📋 Quadro de Missões: Aceite missões e desafios', leftMargin + 20, currentY);
    currentY += lineHeight;
    this.drawHelpText('• 🌀 Portal de Exploração: Acesse missões educativas', leftMargin + 20, currentY);
    currentY += lineHeight + 12;

    // Seção 3: Sistemas do Jogo
    this.drawSectionTitle('⚙️ SISTEMAS DO JOGO', leftMargin, currentY);
    currentY += sectionSpacing;
    this.drawHelpText('• 💰 Coronas: Moeda do jogo (ganhe em missões e explorações)', leftMargin + 20, currentY);
    currentY += lineHeight;
    this.drawHelpText('• 🎒 Inventário: Gerencie seus itens e equipamentos', leftMargin + 20, currentY);
    currentY += lineHeight;
    this.drawHelpText('• 🏆 Conquistas: Complete desafios para recompensas', leftMargin + 20, currentY);
    currentY += lineHeight;
    this.drawHelpText('• 🎖️ Ranking: Competição global com outros jogadores', leftMargin + 20, currentY);
    currentY += lineHeight;
    this.drawHelpText('• 🎰 Roleta Diária: Ganhe prêmios grátis todo dia', leftMargin + 20, currentY);
    currentY += lineHeight;
    this.drawHelpText('• 🎮 Mini-Games: Jogos educativos com recompensas', leftMargin + 20, currentY);
    currentY += lineHeight;
    this.drawHelpText('• 🎭 Skins: Personalize a aparência do seu guardião', leftMargin + 20, currentY);
    currentY += lineHeight + 6;

    // Close button
    const closeBtnX = panelX + panelWidth - 60;
    const closeBtnY = panelY + 20;
    const closeBtnSize = 40;
    const isCloseHovered = isMouseOver(this.mouseX, this.mouseY, closeBtnX, closeBtnY, closeBtnSize, closeBtnSize);

    drawButton(this.ctx, closeBtnX, closeBtnY, closeBtnSize, closeBtnSize, '✕', {
      variant: 'ghost',
      isHovered: isCloseHovered,
      fontSize: 24,
    });
  }

  private drawSectionTitle(text: string, x: number, y: number) {
    drawText(this.ctx, text, x, y, {
      font: 'bold 20px monospace',
      color: GLASS_THEME.palette.accent.cyan,
      shadow: false,
    });
  }

  private drawHelpText(text: string, x: number, y: number) {
    drawText(this.ctx, text, x, y, {
      font: '16px monospace',
      color: 'rgba(220, 236, 230, 0.85)',
      shadow: false,
    });
  }

  private roundRect(x: number, y: number, width: number, height: number, radius: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  public dispose() {
    this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);
    this.canvas.removeEventListener('click', this.boundHandleClick);
  }
}

