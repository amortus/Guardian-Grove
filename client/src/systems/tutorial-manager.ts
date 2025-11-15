/**
 * Sistema de Tutorial Interativo - Guardian Grove
 */

export interface TutorialStep {
  id: string;
  title: string;
  message: string;
  target?: { x: number; y: number }; // Posição na tela para apontar
  icon: string;
  action?: string; // Ação que o jogador deve fazer
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Guardian Grove!',
    message: 'Você é um novo Guardião do Santuário. Vamos fazer um tour rápido!',
    icon: '🌿',
  },
  {
    id: 'movement',
    title: 'Movimentação',
    message: 'Use WASD para andar ou clique no chão para se mover. Pressione E para interagir.',
    icon: '🎮',
    action: 'move',
  },
  {
    id: 'craft',
    title: 'Oficina de Artesanato',
    message: 'Aqui você pode criar itens úteis! Clique no prédio ou pressione C.',
    icon: '🔨',
    target: { x: -20, y: -5 }, // Posição do Craft
    action: 'open_craft',
  },
  {
    id: 'market',
    title: 'Mercado',
    message: 'Compre e venda itens no mercado local! Pressione H para abrir.',
    icon: '🛒',
    target: { x: 18, y: 5 }, // Posição do Market
    action: 'open_market',
  },
  {
    id: 'missions',
    title: 'Quadro de Missões',
    message: 'Complete missões educativas e ganhe recompensas! Pressione M.',
    icon: '📜',
    target: { x: -5, y: 20 }, // Posição do Mission Board
    action: 'open_missions',
  },
  {
    id: 'exploration',
    title: 'Trilha da Descoberta',
    message: 'Explore e complete missões educativas! Aproxime-se e pressione E.',
    icon: '🗺️',
    target: { x: 0, y: -25 }, // Posição do Portal
    action: 'approach_portal',
  },
  {
    id: 'minigames',
    title: 'Mini-Games',
    message: 'Jogue mini-games educativos! Clique em 🎮 Mini-Games no menu superior.',
    icon: '🎮',
    action: 'open_minigames',
  },
  {
    id: 'menu',
    title: 'Menu Superior',
    message: 'Use o menu para acessar Inventário (I), Status, Conquistas, Ranking e mais!',
    icon: '📊',
  },
  {
    id: 'complete',
    title: 'Tutorial Completo!',
    message: 'Você está pronto! Explore, aprenda e torne-se um Guardião Lendário! 🌿',
    icon: '🏆',
  },
];

export class TutorialManager {
  private currentStep = 0;
  private isActive = false;
  private completed = false;
  
  constructor() {
    // Verifica se já completou o tutorial
    const tutorialCompleted = localStorage.getItem('guardian_grove_tutorial_completed');
    this.completed = tutorialCompleted === 'true';
  }
  
  public shouldStartTutorial(): boolean {
    return !this.completed && !this.isActive;
  }
  
  public startTutorial() {
    this.isActive = true;
    this.currentStep = 0;
  }
  
  public nextStep() {
    this.currentStep++;
    if (this.currentStep >= TUTORIAL_STEPS.length) {
      this.completeTutorial();
    }
  }
  
  public skipTutorial() {
    this.completeTutorial();
  }
  
  public getCurrentStep(): TutorialStep | null {
    if (!this.isActive || this.completed) return null;
    return TUTORIAL_STEPS[this.currentStep] || null;
  }
  
  public getProgress(): { current: number; total: number } {
    return {
      current: this.currentStep + 1,
      total: TUTORIAL_STEPS.length,
    };
  }
  
  public isActionComplete(action: string): boolean {
    const currentStep = this.getCurrentStep();
    return currentStep?.action === action;
  }
  
  private completeTutorial() {
    this.isActive = false;
    this.completed = true;
    localStorage.setItem('guardian_grove_tutorial_completed', 'true');
  }
  
  public isCompleted(): boolean {
    return this.completed;
  }
  
  public resetTutorial() {
    this.currentStep = 0;
    this.completed = false;
    localStorage.removeItem('guardian_grove_tutorial_completed');
  }
}

/**
 * Atalhos de Teclado
 */
export const KEYBOARD_SHORTCUTS = {
  I: 'Inventário',
  C: 'Craft',
  H: 'Shop/Market',
  M: 'Missões',
  G: 'Mini-Games',
  A: 'Conquistas',
  L: 'Leaderboard',
  R: 'Roleta',
  ESC: 'Fechar UI',
  F: 'Modo Foto',
  '?': 'Ajuda',
} as const;

/**
 * Sistema de Notificações
 */
export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'achievement' | 'quest';
  title: string;
  message: string;
  icon: string;
  duration: number; // ms
  timestamp: number;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private notifications: Notification[] = [];
  private nextId = 0;
  
  private constructor() {}
  
  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }
  
  public showNotification(
    type: Notification['type'],
    title: string,
    message: string,
    icon?: string,
    duration = 3000
  ): string {
    const id = `notif_${this.nextId++}`;
    
    const notification: Notification = {
      id,
      type,
      title,
      message,
      icon: icon || this.getDefaultIcon(type),
      duration,
      timestamp: Date.now(),
    };
    
    this.notifications.push(notification);
    
    // Remove após duração
    setTimeout(() => {
      this.removeNotification(id);
    }, duration);
    
    console.log(`[NOTIFICATION] ${type.toUpperCase()}: ${title} - ${message}`);
    
    return id;
  }
  
  public showAchievement(title: string, description: string) {
    return this.showNotification('achievement', `🏆 ${title}`, description, '🏆', 4000);
  }
  
  public showQuestComplete(title: string) {
    return this.showNotification('quest', `📚 Missão Completa!`, title, '✅', 3500);
  }
  
  public showSuccess(message: string) {
    return this.showNotification('success', 'Sucesso!', message, '✅', 2500);
  }
  
  public showInfo(message: string) {
    return this.showNotification('info', 'Info', message, 'ℹ️', 2500);
  }
  
  public showWarning(message: string) {
    return this.showNotification('warning', 'Atenção', message, '⚠️', 3000);
  }
  
  public getActiveNotifications(): Notification[] {
    return this.notifications;
  }
  
  public removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }
  
  private getDefaultIcon(type: Notification['type']): string {
    switch (type) {
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'achievement': return '🏆';
      case 'quest': return '📚';
      default: return 'ℹ️';
    }
  }
}

export const notificationManager = NotificationManager.getInstance();

