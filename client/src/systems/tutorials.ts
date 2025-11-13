/**
 * Sistema de Tutoriais - Guias interativos
 */

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  isCompleted: boolean;
  isActive: boolean;
}

export interface TutorialStep {
  id: string;
  message: string;
  action?: string; // Ação necessária para completar
  highlight?: string; // Elemento da UI para destacar
  isCompleted: boolean;
}

/**
 * Tutoriais disponíveis
 */
export const TUTORIALS: Tutorial[] = [
  {
    id: 'basics',
    title: '🎮 Básico do Jogo',
    description: 'Aprenda os fundamentos de Guardian Grove',
    steps: [
      {
        id: 'welcome',
        message: 'Bem-vindo ao Guardian Grove! Você é um Guardião Aprendiz responsável por criar e treinar bestas místicas.',
        isCompleted: false,
      },
      {
        id: 'calendar',
        message: 'O tempo passa em semanas. Escolha ações para sua besta: Treino, Trabalho, Descanso ou Torneio.',
        action: 'advance_week',
        isCompleted: false,
      },
      {
        id: 'combat',
        message: 'Participe de torneios para ganhar dinheiro e itens! Escolha técnicas sabiamente.',
        action: 'enter_tournament',
        isCompleted: false,
      },
    ],
    isCompleted: false,
    isActive: true,
  },
  {
    id: 'advanced',
    title: '⚡ Mecânicas Avançadas',
    description: 'Domine sistemas complexos do jogo',
    steps: [
      {
        id: 'inventory',
        message: 'Use itens do inventário (🎒) para melhorar sua besta.',
        action: 'use_item',
        highlight: 'inventory_button',
        isCompleted: false,
      },
      {
        id: 'craft',
        message: 'Combine itens na Oficina (⚗️) para criar itens poderosos!',
        action: 'craft_item',
        highlight: 'craft_button',
        isCompleted: false,
      },
      {
        id: 'quests',
        message: 'Complete missões (📜) para ganhar recompensas especiais.',
        action: 'complete_quest',
        highlight: 'quests_button',
        isCompleted: false,
      },
    ],
    isCompleted: false,
    isActive: false,
  },
  {
    id: 'mastery',
    title: '🏆 Maestria',
    description: 'Torne-se um mestre guardião',
    steps: [
      {
        id: 'achievements',
        message: 'Desbloqueie conquistas para ganhar títulos e badges especiais.',
        isCompleted: false,
      },
      {
        id: 'npcs',
        message: 'Converse com NPCs na Vila para desbloquear missões exclusivas.',
        action: 'talk_npc',
        isCompleted: false,
      },
      {
        id: 'events',
        message: 'Participe de eventos temporários para ganhar itens raros!',
        isCompleted: false,
      },
    ],
    isCompleted: false,
    isActive: false,
  },
];

/**
 * Marca um passo do tutorial como completado
 */
export function completeTutorialStep(tutorials: Tutorial[], tutorialId: string, stepId: string): boolean {
  const tutorial = tutorials.find(t => t.id === tutorialId);
  if (!tutorial) return false;

  const step = tutorial.steps.find(s => s.id === stepId);
  if (!step || step.isCompleted) return false;

  step.isCompleted = true;

  // Verifica se todos os passos foram completados
  if (tutorial.steps.every(s => s.isCompleted)) {
    tutorial.isCompleted = true;
    
    // Ativa próximo tutorial
    const nextIndex = TUTORIALS.findIndex(t => t.id === tutorialId) + 1;
    if (nextIndex < TUTORIALS.length) {
      tutorials[nextIndex].isActive = true;
    }
    
    return true; // Tutorial completo!
  }

  return false;
}

/**
 * Retorna tutorial ativo
 */
export function getActiveTutorial(tutorials: Tutorial[]): Tutorial | null {
  return tutorials.find(t => t.isActive && !t.isCompleted) || null;
}

/**
 * Retorna próximo passo não completado
 */
export function getCurrentStep(tutorial: Tutorial): TutorialStep | null {
  return tutorial.steps.find(s => !s.isCompleted) || null;
}

/**
 * Tracking automático de tutoriais baseado em ações
 */
export function trackTutorialAction(tutorials: Tutorial[], action: string): Tutorial | null {
  const activeTutorial = getActiveTutorial(tutorials);
  if (!activeTutorial) return null;

  const currentStep = getCurrentStep(activeTutorial);
  if (!currentStep || !currentStep.action) return null;

  if (currentStep.action === action) {
    completeTutorialStep(tutorials, activeTutorial.id, currentStep.id);
    return activeTutorial;
  }

  return null;
}

