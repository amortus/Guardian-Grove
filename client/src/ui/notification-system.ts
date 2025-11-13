/**
 * Sistema de Notificações
 * Pop-ups para eventos importantes
 */

import { COLORS } from './colors';
import { drawPanel, drawText } from './ui-helper';

export interface Notification {
  id: string;
  type: 'achievement' | 'quest' | 'event' | 'item' | 'warning' | 'success';
  title: string;
  message: string;
  icon: string;
  duration: number; // ms
  createdAt: number;
}

export class NotificationSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private notifications: Notification[] = [];
  private nextId = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
  }

  /**
   * Adiciona uma nova notificação
   */
  public addNotification(
    type: Notification['type'],
    title: string,
    message: string,
    duration: number = 4000
  ): void {
    const icon = this.getIconForType(type);
    
    const notification: Notification = {
      id: `notif_${this.nextId++}`,
      type,
      title,
      message,
      icon,
      duration,
      createdAt: Date.now(),
    };

    this.notifications.push(notification);

    // Remove notificações antigas automaticamente
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, duration);
  }

  /**
   * Remove uma notificação
   */
  public removeNotification(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
    }
  }

  /**
   * Desenha todas as notificações ativas
   */
  public draw(): void {
    const now = Date.now();
    const notifWidth = 350;
    const notifHeight = 80;
    const padding = 10;
    const startX = this.canvas.width - notifWidth - 20;
    let startY = 20;

    // Remove notificações expiradas
    this.notifications = this.notifications.filter(n => {
      return (now - n.createdAt) < n.duration;
    });

    // Desenha cada notificação
    this.notifications.forEach((notif, index) => {
      const y = startY + (index * (notifHeight + padding));
      this.drawNotification(notif, startX, y, notifWidth, notifHeight);
    });
  }

  /**
   * Desenha uma notificação individual
   */
  private drawNotification(notif: Notification, x: number, y: number, width: number, height: number): void {
    const elapsed = Date.now() - notif.createdAt;
    const progress = elapsed / notif.duration;

    // Animação de fade in/out
    let alpha = 1;
    if (progress < 0.1) {
      alpha = progress / 0.1; // Fade in
    } else if (progress > 0.9) {
      alpha = (1 - progress) / 0.1; // Fade out
    }

    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    // Cor baseada no tipo
    const bgColor = this.getColorForType(notif.type);
    const borderColor = this.getBorderColorForType(notif.type);

    // Painel com sombra
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowOffsetX = 3;
    this.ctx.shadowOffsetY = 3;

    drawPanel(this.ctx, x, y, width, height, {
      bgColor,
      borderColor,
    });

    // Remove sombra para o texto
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;

    // Ícone
    drawText(this.ctx, notif.icon, x + 15, y + 35, {
      font: '32px monospace',
    });

    // Título
    drawText(this.ctx, notif.title, x + 60, y + 20, {
      font: 'bold 16px monospace',
      color: COLORS.ui.text,
    });

    // Mensagem
    this.drawWrappedText(notif.message, x + 60, y + 42, width - 70, 16, '13px monospace', COLORS.ui.textDim);

    // Barra de progresso
    const barWidth = width - 10;
    const barHeight = 3;
    const barX = x + 5;
    const barY = y + height - 6;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    this.ctx.fillStyle = borderColor;
    this.ctx.fillRect(barX, barY, barWidth * (1 - progress), barHeight);

    this.ctx.restore();
  }

  /**
   * Retorna ícone baseado no tipo
   */
  private getIconForType(type: Notification['type']): string {
    switch (type) {
      case 'achievement': return '🏆';
      case 'quest': return '📜';
      case 'event': return '🎪';
      case 'item': return '🎁';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  }

  /**
   * Retorna cor de fundo baseada no tipo
   */
  private getColorForType(type: Notification['type']): string {
    switch (type) {
      case 'achievement': return '#2d2010';
      case 'quest': return '#1d1d2d';
      case 'event': return '#2d1d2d';
      case 'item': return '#1d2d1d';
      case 'warning': return '#2d2010';
      case 'success': return '#1d2d1d';
      default: return COLORS.bg.medium;
    }
  }

  /**
   * Retorna cor da borda baseada no tipo
   */
  private getBorderColorForType(type: Notification['type']): string {
    switch (type) {
      case 'achievement': return COLORS.primary.gold;
      case 'quest': return COLORS.primary.purple;
      case 'event': return COLORS.primary.purple;
      case 'item': return COLORS.primary.green;
      case 'warning': return '#ff9800';
      case 'success': return COLORS.primary.green;
      default: return COLORS.primary.blue;
    }
  }

  /**
   * Desenha texto com quebra de linha
   */
  private drawWrappedText(text: string, x: number, y: number, maxWidth: number, lineHeight: number, font: string, color: string): void {
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
        
        // Limite de linhas
        if (currentY > y + lineHeight) break;
      } else {
        line = testLine;
      }
    }
    this.ctx.fillText(line, x, currentY);
  }

  /**
   * Notificações helper - atalhos comuns
   */
  public achievementUnlocked(title: string): void {
    this.addNotification('achievement', 'Conquista Desbloqueada!', title, 5000);
  }

  public questCompleted(title: string): void {
    this.addNotification('quest', 'Missão Completada!', title, 4000);
  }

  public itemReceived(itemName: string, quantity: number = 1): void {
    this.addNotification('item', 'Item Recebido!', `${itemName} x${quantity}`, 3000);
  }

  public eventStarted(eventName: string): void {
    this.addNotification('event', 'Evento Começou!', eventName, 6000);
  }

  public warning(message: string): void {
    this.addNotification('warning', 'Atenção!', message, 4000);
  }

  public success(message: string): void {
    this.addNotification('success', 'Sucesso!', message, 3000);
  }
}

