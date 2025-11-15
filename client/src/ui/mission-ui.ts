/**
 * Mission UI System
 * Overlay Canvas para mostrar missões educativas
 */

import type { EducationalMission, MissionNode, Choice } from '../systems/exploration-missions';
import { COLORS } from './colors';
import { GLASS_THEME } from './theme';
import { drawPanel, drawText, drawButton, isMouseOver } from './ui-helper';

export class MissionUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mission: EducationalMission | null = null;
  private currentNode: MissionNode | null = null;
  private isVisible = false;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; choice: Choice }> = new Map();
  private onComplete?: (mission: EducationalMission) => void;
  private onChoice?: (choice: Choice) => void;
  
  // Sistema de feedback em Canvas
  private feedbackMessage: string | null = null;
  private feedbackTimer = 0;
  private showingCompletion = false;
  private completionDetails: { message: string; tip: string; reward?: number } | null = null;
  private onCloseCallback: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context for MissionUI');
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
      if (this.isVisible) {
        this.handleClick();
      }
    });
  }

  public startMission(mission: EducationalMission, onComplete?: (mission: EducationalMission) => void) {
    this.mission = mission;
    this.currentNode = mission.nodes[0];
    this.isVisible = true;
    this.onComplete = onComplete;
    console.log('[MissionUI] 🎮 Missão iniciada:', mission.title);
  }

  public setOnCloseCallback(callback: (() => void) | null) {
    this.onCloseCallback = callback;
  }

  public setOnChoiceCallback(callback: (choice: Choice) => void) {
    this.onChoice = callback;
  }

  private handleClick() {
    // Se está mostrando completion, qualquer clique fecha
    if (this.showingCompletion) {
      this.closeCompletion();
      return;
    }
    
    // Se está mostrando feedback, ignora cliques
    if (this.feedbackMessage) {
      return;
    }
    
    this.buttons.forEach((button) => {
      if (isMouseOver(this.mouseX, this.mouseY, button.x, button.y, button.width, button.height)) {
        this.selectChoice(button.choice);
      }
    });
  }

  private selectChoice(choice: Choice) {
    console.log('[MissionUI] 📝 Escolha selecionada:', choice.text);
    
    // Callback
    this.onChoice?.(choice);

    // Mostra feedback em Canvas por 2 segundos
    if (choice.feedback) {
      this.feedbackMessage = choice.feedback;
      this.feedbackTimer = 2.0; // 2 segundos
      
      // Aguarda feedback antes de continuar
      setTimeout(() => {
        this.feedbackMessage = null;
        this.proceedAfterChoice(choice);
      }, 2000);
    } else {
      this.proceedAfterChoice(choice);
    }
  }
  
  private proceedAfterChoice(choice: Choice) {
    // Próximo node ou finaliza
    if (choice.nextNodeId) {
      const nextNode = this.mission?.nodes.find(n => n.id === choice.nextNodeId);
      if (nextNode) {
        this.currentNode = nextNode;
        
        // Se o node de completion não tem choices, finaliza
        if (nextNode.choices.length === 0) {
          setTimeout(() => this.completeMission(), 500);
        }
      }
    } else {
      this.completeMission();
    }
  }

  private completeMission() {
    if (!this.mission) return;

    console.log('[MissionUI] ✅ Missão completa:', this.mission.title);

    // Mostra mensagem de conclusão em Canvas
    this.showingCompletion = true;
    this.completionDetails = {
      message: this.mission.completionMessage,
      tip: this.mission.realWorldPrompt,
      reward: this.mission.rewardCoronas,
    };
    
    // Não fecha automaticamente, espera clique do usuário
  }
  
  private closeCompletion() {
    this.showingCompletion = false;
    this.completionDetails = null;
    this.onComplete?.(this.mission!);
    this.close();
  }

  public close() {
    this.isVisible = false;
    this.mission = null;
    this.currentNode = null;
    this.buttons.clear();
    this.onCloseCallback?.();
  }

  public draw() {
    if (!this.isVisible || !this.mission || !this.currentNode) {
      return;
    }

    this.buttons.clear();

    const width = this.canvas.width;
    const height = this.canvas.height;

    // Overlay mais escuro e opaco
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    this.ctx.fillRect(0, 0, width, height);

    // Painel principal maior e mais visível
    const panelWidth = Math.min(900, width * 0.85);
    const panelHeight = Math.min(650, height * 0.8);
    const panelX = (width - panelWidth) / 2;
    const panelY = (height - panelHeight) / 2;

    // Fundo do painel com borda mais visível
    this.ctx.fillStyle = 'rgba(20, 30, 50, 0.95)';
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    // Borda grossa e brilhante
    this.ctx.strokeStyle = '#4488ff';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Título da missão com sombra forte
    this.ctx.font = 'bold 32px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    
    // Sombra do título
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(this.mission.title, panelX + panelWidth / 2, panelY + 40);
    
    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;

    // Texto do node atual com fonte melhor e maior
    const textY = panelY + 120;
    const textWidth = panelWidth - 100;
    this.drawWrappedText(
      this.currentNode.text,
      panelX + 50,
      textY,
      textWidth,
      22,
      '#e0e0e0'
    );

    // Choices (botões) com melhor legibilidade
    if (this.currentNode.choices.length > 0) {
      const buttonWidth = panelWidth - 120;
      const buttonHeight = 70;
      const buttonSpacing = 15;
      const firstButtonY = panelY + panelHeight - 100 - (this.currentNode.choices.length * (buttonHeight + buttonSpacing));

      this.currentNode.choices.forEach((choice, index) => {
        const buttonX = panelX + 60;
        const buttonY = firstButtonY + index * (buttonHeight + buttonSpacing);

        const isHover = isMouseOver(
          this.mouseX,
          this.mouseY,
          buttonX,
          buttonY,
          buttonWidth,
          buttonHeight
        );

        // Fundo do botão
        const bgColor = isHover 
          ? 'rgba(70, 130, 255, 0.3)' 
          : 'rgba(50, 70, 120, 0.5)';
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Borda do botão
        this.ctx.strokeStyle = isHover ? '#66aaff' : '#4488cc';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Texto do botão com fonte maior e legível
        this.ctx.font = 'bold 18px Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#ffffff';
        
        // Sombra no texto para maior contraste
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        const displayText = choice.text.replace(/✅/g, '').trim();
        // Quebra texto longo em múltiplas linhas
        this.drawButtonText(displayText, buttonX + buttonWidth / 2, buttonY + buttonHeight / 2, buttonWidth - 20);
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;

        this.buttons.set(choice.id, { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight, choice });
      });
    }
    
    // Desenha feedback se houver
    if (this.feedbackMessage) {
      this.drawFeedbackOverlay(panelX, panelY, panelWidth, panelHeight);
    }
    
    // Desenha completion se houver
    if (this.showingCompletion && this.completionDetails) {
      this.drawCompletionOverlay(panelX, panelY, panelWidth, panelHeight);
    }
  }
  
  private drawFeedbackOverlay(panelX: number, panelY: number, panelWidth: number, panelHeight: number) {
    // Overlay semi-transparente sobre o painel
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    // Caixa de feedback centralizada
    const boxWidth = panelWidth * 0.7;
    const boxHeight = 200;
    const boxX = panelX + (panelWidth - boxWidth) / 2;
    const boxY = panelY + (panelHeight - boxHeight) / 2;
    
    // Fundo da caixa
    this.ctx.fillStyle = 'rgba(30, 50, 80, 0.95)';
    this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    
    // Borda
    this.ctx.strokeStyle = '#66aaff';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    // Texto do feedback
    this.ctx.font = 'bold 20px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.ctx.shadowBlur = 6;
    
    this.drawWrappedText(
      this.feedbackMessage!,
      boxX + boxWidth / 2 - boxWidth * 0.4,
      boxY + boxHeight / 2 - 40,
      boxWidth * 0.8,
      20,
      '#ffffff'
    );
    
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
  }
  
  private drawCompletionOverlay(panelX: number, panelY: number, panelWidth: number, panelHeight: number) {
    if (!this.completionDetails) return;
    // Overlay completo
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    // Título
    this.ctx.font = 'bold 36px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#4488ff';
    this.ctx.shadowColor = 'rgba(68, 136, 255, 0.6)';
    this.ctx.shadowBlur = 15;
    this.ctx.fillText('✨ Missão Completa! ✨', panelX + panelWidth / 2, panelY + 100);
    this.ctx.shadowBlur = 0;
    
    // Mensagem de conclusão
    const textY = panelY + 180;
    const textWidth = panelWidth - 120;
    this.drawWrappedText(
      `✨ ${this.completionDetails.message}`,
      panelX + 60,
      textY,
      textWidth,
      22,
      '#e0e0e0'
    );

    // Dica/Tarefa
    const tipStartY = panelY + panelHeight / 2;

    this.drawWrappedText(
      `💡 Dica de hoje: ${this.completionDetails.tip}`,
      panelX + 60,
      tipStartY,
      textWidth,
      20,
      '#bde0ff'
    );

    if (this.completionDetails.reward && this.completionDetails.reward > 0) {
      this.ctx.font = 'bold 22px Arial, sans-serif';
      this.ctx.fillStyle = '#ffd962';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        `💰 Recompensa: +${this.completionDetails.reward.toLocaleString('pt-BR')} coronas`,
        panelX + panelWidth / 2,
        panelY + panelHeight - 90
      );
    }
    
    // Instrução para continuar
    this.ctx.font = 'bold 18px Arial, sans-serif';
    this.ctx.fillStyle = '#ffaa00';
    this.ctx.fillText('Clique em qualquer lugar para continuar', panelX + panelWidth / 2, panelY + panelHeight - 40);
  }

  private drawWrappedText(
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number,
    color: string
  ) {
    this.ctx.font = `${fontSize}px Arial, sans-serif`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    const words = text.split(' ');
    let line = '';
    let lineY = y;
    const lineHeight = fontSize * 1.8;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = this.ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && i > 0) {
        this.ctx.fillText(line, x, lineY);
        line = words[i] + ' ';
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }
    this.ctx.fillText(line, x, lineY);
  }
  
  private drawButtonText(text: string, x: number, y: number, maxWidth: number) {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    // Quebra em linhas
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    
    // Desenha linhas centralizadas
    const lineHeight = 22;
    const totalHeight = lines.length * lineHeight;
    let startY = y - totalHeight / 2 + lineHeight / 2;
    
    lines.forEach((line) => {
      this.ctx.fillText(line, x, startY);
      startY += lineHeight;
    });
  }

  public isActive(): boolean {
    return this.isVisible;
  }
}

