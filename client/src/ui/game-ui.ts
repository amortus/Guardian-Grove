/**
 * UI Principal do Guardian Grove
 */

import type { GameState, Beast, BeastLine, WeeklyAction, BeastAction } from '../types';
import { COLORS } from './colors';
import { GLASS_THEME } from './theme';
import { drawPanel, drawText, drawBar, drawButton, isMouseOver } from './ui-helper';
import { getLifePhase, calculateBeastAge } from '../systems/beast';
import { getBeastLineData } from '../data/beasts';
import { BeastMiniViewer3D } from '../3d/BeastMiniViewer3D';
import { GuardianHubScene3D } from '../3d/scenes/GuardianHubScene3D';
import { canStartAction, getActionProgress, getActionName as getRealtimeActionName } from '../systems/realtime-actions';
import { STARTER_CONFIG } from '../systems/game-state';
import { getGameTime } from '../utils/day-night';
import { MissionUI } from './mission-ui';
import { getRandomMission } from '../systems/exploration-missions';

const HEADER_HEIGHT = 130; // Aumentado para acomodar data do calendário
const SIDE_PANEL_WIDTH = 0; // Painéis laterais removidos na nova HUD diegética
const STATUS_PANEL_HEIGHT = 0;
const SIDE_PANEL_GAP = 0;

export class GameUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  
  // Mouse state
  private mouseX = 0;
  private mouseY = 0;
  
  // Completion message state (inline no painel)
  private completionMessage: string | null = null;
  private completionMessageTimeout: number | null = null;
  
  // UI state
  private selectedAction: WeeklyAction | null = null;
  private actionCategory: 'train' | 'work' | 'rest' | 'tournament' | null = null;
  private activeMenuItem: string = 'guardian_village';
  
  // Button positions
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();
  
  // 3D Mini Viewer
  private miniViewer3D: BeastMiniViewer3D | null = null;
  private miniViewer3DContainer: HTMLDivElement | null = null;
  private currentBeastForViewer: Beast | null = null;
  private is3DViewerVisible: boolean = true; // ← Flag para controlar visibilidade
  
  // 3D Ranch Scene (full PS1 environment)
  private ranchScene3D: GuardianHubScene3D | null = null;
  private ranchScene3DContainer: HTMLDivElement | null = null;
  private useFullRanchScene: boolean = true; // Toggle to use full ranch vs mini viewer

  // Mission UI
  private missionUI: MissionUI | null = null;
  
  // Exploration system
  private showExplorationPrompt = false;
  private lastRealRanchSceneWidth: number = 0; // Cache do tamanho REAL (escalado) para detectar mudança
  private lastRealRanchSceneHeight: number = 0;
  private ranchScenePointerHandlers: { move: (event: PointerEvent) => void; click: (event: PointerEvent) => void; leave: () => void } | null = null;
  private hubHoverLabel: HTMLDivElement | null = null;
  private currentHubHoverId: string | null = null;
  
  // Auto-logout por inatividade
  private lastActivityTime = Date.now();
  private inactivityCheckInterval: number | null = null;
  private readonly INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutos em milissegundos
  private hubInteractions: Record<string, { label: string; action: () => void }> = {
    mission_board: { label: 'as Missões', action: () => { this.activeMenuItem = 'quests'; this.onOpenQuests(); } },
    craft_well: { label: 'a Oficina', action: () => { this.activeMenuItem = 'craft'; this.onOpenCraft(); } },
    tree_house: { label: 'o Inventário', action: () => { this.activeMenuItem = 'inventory'; this.onOpenInventory(); } },
    tavern: { label: 'a Arena PVP', action: () => { this.activeMenuItem = 'arena'; this.onOpenArenaPvp(); } },
    temple: { label: 'o Templo', action: () => { this.activeMenuItem = 'temple'; this.onOpenTemple(); } },
  };
  private readonly starterLines: BeastLine[] = STARTER_CONFIG.map((config) => config.line);
  
  // Public callbacks
  public onView3D: () => void = () => {};

  constructor(canvas: HTMLCanvasElement, gameState: GameState) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.gameState = gameState;
    
    // Initialize Mission UI
    this.missionUI = new MissionUI(canvas);
    
    this.setupEventListeners();
    this.startInactivityMonitor();
  }
  
  // Cleanup 3D mini viewer
  private cleanup3DMiniViewer() {
    console.log('[GameUI] Cleanup started...', {
      hasViewer: !!this.miniViewer3D,
      hasContainer: !!this.miniViewer3DContainer
    });
    
    if (this.miniViewer3D) {
      console.log('[GameUI] Disposing viewer...');
      this.miniViewer3D.dispose();
      this.miniViewer3D = null;
    }
    
    if (this.miniViewer3DContainer && this.miniViewer3DContainer.parentNode) {
      console.log('[GameUI] Removing container from DOM...');
      this.miniViewer3DContainer.parentNode.removeChild(this.miniViewer3DContainer);
      this.miniViewer3DContainer = null;
    }
    
    this.currentBeastForViewer = null;
    console.log('[GameUI] ✓ Cleanup complete');
  }
  
  // Cleanup Ranch Scene 3D
  public cleanupRanchScene3D() {
    console.log('[GameUI] Ranch Scene 3D cleanup started...');
    
    if (this.ranchScene3D) {
      console.log('[GameUI] Disposing Ranch Scene 3D...');
      this.ranchScene3D.stopLoop();
      this.ranchScene3D.dispose();
      this.ranchScene3D = null;
    }

    if (this.ranchScene3DContainer && this.ranchScenePointerHandlers) {
      this.ranchScene3DContainer.removeEventListener('pointermove', this.ranchScenePointerHandlers.move);
      this.ranchScene3DContainer.removeEventListener('click', this.ranchScenePointerHandlers.click);
      this.ranchScene3DContainer.removeEventListener('pointerleave', this.ranchScenePointerHandlers.leave);
      this.ranchScenePointerHandlers = null;
    }

    if (this.hubHoverLabel && this.hubHoverLabel.parentNode) {
      this.hubHoverLabel.parentNode.removeChild(this.hubHoverLabel);
      this.hubHoverLabel = null;
    }
    this.currentHubHoverId = null;
    document.body.style.cursor = '';

    if (this.ranchScene3DContainer && this.ranchScene3DContainer.parentNode) {
      console.log('[GameUI] Removing Ranch Scene 3D container from DOM...');
      this.ranchScene3DContainer.parentNode.removeChild(this.ranchScene3DContainer);
      this.ranchScene3DContainer = null;
    }
    
    console.log('[GameUI] ✓ Ranch Scene 3D cleanup complete');
  }
  
  // Create or update Ranch Scene 3D
  private createOrUpdateRanchScene3D(x: number, y: number, width: number, height: number, beast: Beast) {
    // Calculate position based on canvas scale/transform
    const canvasRect = this.canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / this.canvas.width;
    const scaleY = canvasRect.height / this.canvas.height;
    
    const realLeft = canvasRect.left + (x * scaleX);
    const realTop = canvasRect.top + (y * scaleY);
    const realWidth = width * scaleX;
    const realHeight = height * scaleY;
    
    // Detecta se tamanho REAL mudou (eficiente, sem overhead)
    const realSizeChanged = (
      Math.abs(realWidth - this.lastRealRanchSceneWidth) > 1 || 
      Math.abs(realHeight - this.lastRealRanchSceneHeight) > 1
    );
    
    // Recreate if: beast changes OR container doesn't exist OR real size changed
    if (!this.ranchScene3D || !this.ranchScene3DContainer || this.currentBeastForViewer?.line !== beast.line || realSizeChanged) {
      this.cleanupRanchScene3D();
      
      // Atualiza cache de tamanho REAL
      this.lastRealRanchSceneWidth = realWidth;
      this.lastRealRanchSceneHeight = realHeight;
      
      // Create container for Ranch Scene 3D
      this.ranchScene3DContainer = document.createElement('div');
      this.ranchScene3DContainer.id = 'ranch-scene-3d-container';
      this.ranchScene3DContainer.style.cssText = `
        position: fixed;
        left: ${realLeft}px;
        top: ${realTop}px;
        width: ${realWidth}px;
        height: ${realHeight}px;
        pointer-events: auto;
        cursor: default;
        z-index: 2;
        overflow: hidden;
      `;
      
      // Create canvas for Three.js (usa tamanho REAL escalado)
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${realWidth}px`; // ✅ USA TAMANHO ESCALADO
      canvas.style.height = `${realHeight}px`; // ✅ USA TAMANHO ESCALADO
      canvas.style.display = 'block'; // Remove espaços extras
      this.ranchScene3DContainer.appendChild(canvas);
      
      document.body.appendChild(this.ranchScene3DContainer);
      this.ensureHubHoverLabel();
      if (this.gameState.needsAvatarSelection) {
        this.ranchScene3DContainer.style.pointerEvents = 'none';
      }

      const getRect = () => this.ranchScene3DContainer!.getBoundingClientRect();
      const onPointerMove = (event: PointerEvent) => {
        if (!this.ranchScene3D) return;
        this.ranchScene3D.handlePointerMove(event.clientX, event.clientY, getRect());
      };
      const onClick = (event: PointerEvent) => {
        // Debug: garantir que o clique está chegando no container 3D
        // eslint-disable-next-line no-console
        console.log('[GameUI] Hub 3D click', {
          clientX: event.clientX,
          clientY: event.clientY,
        });
        if (!this.ranchScene3D) return;
        const id = this.ranchScene3D.handlePointerClick(event.clientX, event.clientY, getRect());
        if (id) {
          event.preventDefault();
        }
      };
      const onPointerLeave = () => {
        this.ranchScene3D?.clearHover();
        this.updateHubHover(null);
      };

      this.ranchScene3DContainer.addEventListener('pointermove', onPointerMove);
      this.ranchScene3DContainer.addEventListener('click', onClick);
      this.ranchScene3DContainer.addEventListener('pointerleave', onPointerLeave);
      this.ranchScenePointerHandlers = { move: onPointerMove, click: onClick, leave: onPointerLeave };
      
      // Create Ranch Scene 3D
      this.ranchScene3D = new GuardianHubScene3D(canvas);
      // eslint-disable-next-line no-console
      console.log('[GameUI] Ranch Scene 3D created');
      this.ranchScene3D.setInteractionCallback((id) => this.handleHubInteraction(id));
      this.ranchScene3D.setHoverCallback((id) => this.updateHubHover(id));
      this.ranchScene3D.setBeast(beast.line);
      
      // Setup exploration entrance detection
      this.ranchScene3D.onExplorationPrompt(() => {
        this.updateExplorationPrompt();
      });
      
      // Setup exploration callback (quando pressiona E ou clica no portal)
      this.ranchScene3D.setExplorationCallback(() => {
        console.log('[GameUI] 🎮 Exploration callback acionado!');
        this.showExplorationMessage();
      });
      
      // Setup building callbacks
      this.ranchScene3D.setCraftCallback(() => {
        console.log('[GameUI] 🔨 Abrindo Craft!');
        this.activeMenuItem = 'craft';
        this.onOpenCraft();
      });
      
      this.ranchScene3D.setMarketCallback(() => {
        console.log('[GameUI] 🛒 Abrindo Market!');
        this.activeMenuItem = 'shop';
        this.onOpenShop();
      });
      
      this.ranchScene3D.setMissionCallback(() => {
        console.log('[GameUI] 📜 Abrindo Missions!');
        this.activeMenuItem = 'quests';
        this.onOpenQuests();
      });
      
      this.ranchScene3D.startLoop();
      
      this.currentBeastForViewer = beast;
      
      // ✅ FORÇA resize APÓS layout finalizar (requestAnimationFrame)
      requestAnimationFrame(() => {
        if (this.ranchScene3D) {
          const finalRect = canvas.getBoundingClientRect();
          this.ranchScene3D.resize(finalRect.width, finalRect.height);
        }
      });
    }
    
    // Update container position if canvas was resized
    if (this.ranchScene3DContainer) {
      const canvasRect = this.canvas.getBoundingClientRect();
      const scaleX = canvasRect.width / this.canvas.width;
      const scaleY = canvasRect.height / this.canvas.height;
      
      const realLeft = canvasRect.left + (x * scaleX);
      const realTop = canvasRect.top + (y * scaleY);
      const realWidth = width * scaleX;
      const realHeight = height * scaleY;
      
      this.ranchScene3DContainer.style.left = `${realLeft}px`;
      this.ranchScene3DContainer.style.top = `${realTop}px`;
      this.ranchScene3DContainer.style.width = `${realWidth}px`;
      this.ranchScene3DContainer.style.height = `${realHeight}px`;
      this.ranchScene3DContainer.style.pointerEvents = this.gameState.needsAvatarSelection ? 'none' : 'auto';
    }
  }

  private ensureHubHoverLabel() {
    if (this.hubHoverLabel || !this.ranchScene3DContainer) {
      return;
    }

    const label = document.createElement('div');
    label.style.cssText = `
      position: absolute;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 18px;
      border-radius: 16px;
      background: rgba(11, 39, 27, 0.85);
      color: ${COLORS.ui.text};
      font-family: 'Nunito', 'Nunito Sans', sans-serif;
      font-weight: 700;
      font-size: 15px;
      letter-spacing: 0.4px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      box-shadow: 0 6px 18px rgba(6, 20, 14, 0.45);
    `;
    this.hubHoverLabel = label;
    this.ranchScene3DContainer.appendChild(label);
  }

  private updateHubHover(id: string | null) {
    if (this.currentHubHoverId === id) {
      return;
    }

    this.currentHubHoverId = id;
    if (!this.hubHoverLabel) {
      this.ensureHubHoverLabel();
    }

    if (this.hubHoverLabel) {
      if (id && id !== 'walkable' && this.hubInteractions[id]) {
        this.hubHoverLabel.textContent = `Clique para acessar ${this.hubInteractions[id].label}`;
        this.hubHoverLabel.style.opacity = '1';
        document.body.style.cursor = 'pointer';
      } else if (id === 'walkable') {
        this.hubHoverLabel.textContent = 'Clique para caminhar';
        this.hubHoverLabel.style.opacity = '0.9';
        document.body.style.cursor = 'pointer';
      } else {
        this.hubHoverLabel.style.opacity = '0';
        document.body.style.cursor = '';
      }
    }
  }

  private handleHubInteraction(id: string) {
    const interaction = this.hubInteractions[id];
    if (!interaction) {
      return;
    }

    this.updateHubHover(null);
    interaction.action();
  }

  // Call this when UI is destroyed or beast changes significantly
  private drawEventBanner() {
    // Importa dinamicamente para evitar circular dependency
    try {
      const { getActiveEvents, getEventTimeRemaining } = require('../data/events');
      const activeEvents = getActiveEvents();
      
      if (activeEvents.length === 0) return;
      
      const event = activeEvents[0]; // Mostra o primeiro evento ativo
      const bannerHeight = 35;
      const bannerY = 0;
      
      // Fundo do banner com gradiente
      const gradient = this.ctx.createLinearGradient(0, bannerY, 0, bannerY + bannerHeight);
      gradient.addColorStop(0, 'rgba(255, 200, 87, 0.95)');
      gradient.addColorStop(1, 'rgba(255, 165, 0, 0.85)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, bannerY, this.canvas.width, bannerHeight);
      
      // Borda inferior
      this.ctx.fillStyle = 'rgba(255, 200, 87, 1)';
      this.ctx.fillRect(0, bannerY + bannerHeight - 2, this.canvas.width, 2);
      
      // Texto do evento
      const timeRemaining = getEventTimeRemaining(event);
      const eventText = `${event.name} • ${timeRemaining}`;
      
      drawText(this.ctx, eventText, this.canvas.width / 2, bannerY + bannerHeight / 2 + 2, {
        align: 'center',
        baseline: 'middle',
        font: 'bold 16px monospace',
        color: '#000000',
      });
    } catch (e) {
      // Silently fail if events module not available
    }
  }

  public dispose() {
    // Limpa o monitor de inatividade
    if (this.inactivityCheckInterval) {
      clearInterval(this.inactivityCheckInterval);
      this.inactivityCheckInterval = null;
    }
    
    this.cleanup3DMiniViewer();
    this.cleanupRanchScene3D();
  }

  // Public method to hide 3D viewer when changing screens
  public hide3DViewer() {
    this.is3DViewerVisible = false;
    
    if (this.miniViewer3DContainer) {
      this.miniViewer3DContainer.style.display = 'none';
      console.log('[GameUI] 3D mini viewer hidden');
    }
    
    // Stop ranch scene 3D loop to save resources when hidden
    if (this.ranchScene3D) {
      this.ranchScene3D.stopLoop();
      this.ranchScene3D.clearHover();
      console.log('[GameUI] Ranch Scene 3D loop stopped');
    }
    
    if (this.ranchScene3DContainer) {
      this.ranchScene3DContainer.style.display = 'none';
      console.log('[GameUI] Ranch Scene 3D hidden');
    }

    this.updateHubHover(null);
  }

  // Public method to show 3D viewer when returning to ranch
  public show3DViewer() {
    this.is3DViewerVisible = true;
    
    if (this.miniViewer3DContainer) {
      this.miniViewer3DContainer.style.display = 'block';
      console.log('[GameUI] 3D mini viewer shown');
    }
    
    if (this.ranchScene3DContainer) {
      // Check if container is still in DOM (might have been removed)
      if (!this.ranchScene3DContainer.parentNode) {
        console.warn('[GameUI] Ranch Scene 3D container was removed from DOM, will be recreated');
        this.ranchScene3DContainer = null;
        this.ranchScene3D = null;
      } else {
        this.ranchScene3DContainer.style.display = 'block';
        console.log('[GameUI] Ranch Scene 3D container shown');
        
        // Restart ranch scene 3D loop if it exists
        if (this.ranchScene3D) {
          this.ranchScene3D.startLoop();
          console.log('[GameUI] Ranch Scene 3D loop restarted');
        } else if (this.gameState.activeBeast) {
          // If ranch scene doesn't exist, recreate it
          console.log('[GameUI] Ranch Scene 3D not found, will be recreated on next draw');
        }
      }
    } else if (this.gameState.activeBeast) {
      // Container doesn't exist, will be created on next draw
      console.log('[GameUI] Ranch Scene 3D container not found, will be created on next draw');
    }
  }

  // Public method to update 3D viewer position (called on window resize)
  public update3DViewerPosition() {
    if (!this.miniViewer3DContainer || !this.is3DViewerVisible || !this.gameState.activeBeast) {
      return;
    }

    // Calculate position based on current canvas size
    const x = 20;
    const y = 105;
    const width = 175;
    const height = 175;

    const canvasRect = this.canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / this.canvas.width;
    const scaleY = canvasRect.height / this.canvas.height;

    const leftPos = canvasRect.left + (x * scaleX);
    const topPos = canvasRect.top + (y * scaleY);
    const containerWidth = width * scaleX;
    const containerHeight = height * scaleY;

    this.miniViewer3DContainer.style.left = `${leftPos}px`;
    this.miniViewer3DContainer.style.top = `${topPos}px`;
    this.miniViewer3DContainer.style.width = `${containerWidth}px`;
    this.miniViewer3DContainer.style.height = `${containerHeight}px`;

    // Also update the Three.js renderer size
    if (this.miniViewer3D) {
      this.miniViewer3D.onResize(containerWidth, containerHeight);
    }

    console.log('[GameUI] 3D viewer position updated on resize:', {
      width: containerWidth,
      height: containerHeight,
      left: leftPos,
      top: topPos
    });
  }

  private setupEventListeners() {
    // Registra atividade do usuário
    const registerActivity = () => {
      this.lastActivityTime = Date.now();
    };
    
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
      this.mouseY = ((e.clientY - rect.top) / rect.height) * this.canvas.height;
      registerActivity();
    });

    this.canvas.addEventListener('mousedown', () => {
      this.handleClick();
      registerActivity();
    });

    // Tecla E para interações (exploração e buildings)
    window.addEventListener('keydown', (e) => {
      registerActivity();
      
      if (e.key === 'e' || e.key === 'E') {
        if (this.ranchScene3D && this.activeMenuItem === 'guardian_village') {
          // Tenta interagir com buildings primeiro (Craft, Market, Missions)
          const interactedWithBuilding = this.ranchScene3D.tryInteractWithBuilding();
          
          // Se não interagiu com building, tenta entrar na exploração
          if (!interactedWithBuilding) {
            const entered = this.ranchScene3D.tryEnterExploration();
            if (entered) {
              console.log('[GameUI] 🎮 Iniciando exploração...');
              this.showExplorationMessage();
            }
          }
        }
      }
    });
    
    // Registra atividade global (cliques, teclas, scroll)
    window.addEventListener('click', registerActivity);
    window.addEventListener('scroll', registerActivity);
    
    // Registra atividade quando interage com o portal de exploração
    window.addEventListener('explorationPrompt', registerActivity);
  }

  private handleClick() {
    // Check button clicks
    this.buttons.forEach((button) => {
      if (isMouseOver(this.mouseX, this.mouseY, button.x, button.y, button.width, button.height)) {
        if (button.action) {
          button.action();
        }
      }
    });
  }

  private showExplorationMessage() {
    // Inicia missão educativa aleatória
    if (this.missionUI) {
      const mission = getRandomMission();
      console.log('[GameUI] 🎮 Iniciando missão:', mission.title);
      
      this.missionUI.startMission(mission, (completedMission) => {
        console.log('[GameUI] ✅ Missão completa:', completedMission.title);
        // Aqui você pode dar recompensas, salvar progresso, etc.
      });
    }
  }
  
  // ========== AUTO-LOGOUT POR INATIVIDADE ==========
  
  private startInactivityMonitor() {
    console.log('[GameUI] 🕐 Monitoramento de inatividade iniciado (2 minutos)');
    
    // Verifica a cada 10 segundos
    this.inactivityCheckInterval = window.setInterval(() => {
      this.checkInactivity();
    }, 10 * 1000);
  }
  
  private checkInactivity() {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivityTime;
    
    if (timeSinceLastActivity >= this.INACTIVITY_TIMEOUT) {
      console.log('[GameUI] ⏰ Inatividade detectada! Fazendo logout...');
      this.handleInactivityLogout();
    }
  }
  
  private async handleInactivityLogout() {
    // Para o monitor de inatividade
    if (this.inactivityCheckInterval) {
      clearInterval(this.inactivityCheckInterval);
      this.inactivityCheckInterval = null;
    }
    
    // Limpa token e redireciona para login
    localStorage.removeItem('auth_token');
    
    // Mostra mensagem
    alert('⏰ Você foi desconectado por inatividade (2 minutos sem ação).\n\nFaça login novamente para continuar.');
    
    // Recarrega a página para ir para a tela de login
    window.location.reload();
  }

  /**
   * REMOVIDO: Não precisa mais forçar redraw, detecção automática de mudança de tamanho
   */

  public draw() {
    this.buttons.clear();
    
    // Clear canvas (transparente para mostrar 3D)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw sections
    this.drawHeader();
    this.drawBeastDisplay();

    if (this.gameState.activeBeast && !this.gameState.needsAvatarSelection) {
      this.drawBeastHudOverlay();
    }

    if (!this.gameState.needsAvatarSelection) {
      this.drawInteractionHints();
    }

    if (!this.gameState.activeBeast) {
      this.drawNoBeastScreen();
    }

    if (this.gameState.needsAvatarSelection) {
      this.drawAvatarSelectionOverlay();
    }

    // Mission UI (overlay)
    if (this.missionUI) {
      this.missionUI.draw();
    }

    // Week Info removido - exploração vai para o header
  }

  private drawHeader() {
    // Banner de evento (acima do header)
    this.drawEventBanner();
    
    const gradient = this.ctx.createLinearGradient(0, 0, 0, HEADER_HEIGHT);
    gradient.addColorStop(0, 'rgba(6, 22, 16, 0.92)');
    gradient.addColorStop(1, 'rgba(6, 22, 16, 0.55)');

    this.ctx.save();
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, HEADER_HEIGHT);
    this.ctx.restore();

    // Linha inferior sutil
    this.ctx.fillStyle = 'rgba(42, 119, 96, 0.35)';
    this.ctx.fillRect(0, HEADER_HEIGHT - 2, this.canvas.width, 2);

    const buttonY = 26;
    const logoutBtnWidth = 104;
    const logoutBtnHeight = 34;
    const logoutBtnX = this.canvas.width - logoutBtnWidth - 24;
    const settingsBtnSize = 40;
    const settingsBtnX = logoutBtnX - settingsBtnSize - 14;

    const isLogoutHovered = isMouseOver(this.mouseX, this.mouseY, logoutBtnX, buttonY, logoutBtnWidth, logoutBtnHeight);
    drawButton(this.ctx, logoutBtnX, buttonY, logoutBtnWidth, logoutBtnHeight, 'Sair', {
      variant: 'danger',
      isHovered: isLogoutHovered,
      fontSize: 14,
    });

    this.buttons.set('logout', {
      x: logoutBtnX,
      y: buttonY,
      width: logoutBtnWidth,
      height: logoutBtnHeight,
      action: () => this.onLogout(),
    });

    const isMuteHovered = isMouseOver(this.mouseX, this.mouseY, settingsBtnX, buttonY, settingsBtnSize, settingsBtnSize);
    
    // Ícone muda baseado no estado (muted ou não)
    const muteIcon = this.isMuted ? '🔇' : '🔊';
    
    drawButton(this.ctx, settingsBtnX, buttonY, settingsBtnSize, settingsBtnSize, muteIcon, {
      variant: 'ghost',
      isHovered: isMuteHovered,
      fontSize: 20,
    });

    this.buttons.set('mute', {
      x: settingsBtnX,
      y: buttonY,
      width: settingsBtnSize,
      height: settingsBtnSize,
      action: () => this.onToggleMute(),
    });
    
    // Menu centralizado (Inventário, Status, etc.)
    this.drawTopMenu(buttonY, logoutBtnHeight);

    const chipPaddingX = 18;
    const chipPaddingY = 18;
    const chipGap = 12;
    const chipHeight = 36;

    const drawChip = (rightX: number, icon: string, label: string) => {
      this.ctx.font = 'bold 14px monospace';
      const text = `${icon} ${label}`;
      const textWidth = this.ctx.measureText(text).width;
      const chipWidth = textWidth + chipPaddingX * 2;
      const chipX = rightX - chipWidth;
      const chipY = buttonY + settingsBtnSize + 10;

      this.ctx.save();
      this.ctx.globalAlpha = 0.95;
      this.ctx.fillStyle = 'rgba(12, 38, 25, 0.88)';
      this.drawRoundedRectPath(chipX, chipY, chipWidth, chipHeight, 16);
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(109, 199, 164, 0.45)';
      this.ctx.lineWidth = 1.4;
      this.ctx.stroke();
      this.ctx.restore();

      drawText(this.ctx, text, chipX + chipWidth / 2, chipY + chipHeight / 2 + 1, {
        align: 'center',
        baseline: 'middle',
        font: 'bold 14px monospace',
        color: GLASS_THEME.palette.text.highlight,
        shadow: false,
      });

      return chipX - chipGap;
    };

    let chipRightEdge = settingsBtnX - 16;
    const beast = this.gameState.activeBeast;

    if (beast) {
      const lineData = getBeastLineData(beast.line);
      chipRightEdge = drawChip(chipRightEdge, '🛡️', `${beast.name} • ${lineData.name}`);
      chipRightEdge = drawChip(chipRightEdge, '💠', `Nível ${beast.level || 1}`);
    }

    chipRightEdge = drawChip(chipRightEdge, '💰', `${this.gameState.economy.coronas.toLocaleString('pt-BR')} coronas`);

    const gameTime = getGameTime();
    const clockIcon = gameTime.timeOfDay.isNight ? '🌙' : '☀️';
    const clockText = `${clockIcon} ${gameTime.timeOfDay.timeString}`;
    const dateText = `${gameTime.calendar.dateString} • ${gameTime.calendar.dayOfWeekName}`;
    
    const leftX = 32;
    const clockY = 32;
    
    // Hora
    drawText(this.ctx, clockText, leftX, clockY, {
      font: 'bold 18px monospace',
      color: gameTime.timeOfDay.isNight ? '#9AD5FF' : GLASS_THEME.palette.accent.amber,
      shadow: false,
    });
    
    // Data (abaixo da hora)
    drawText(this.ctx, `📅 ${dateText}`, leftX, clockY + 26, {
      font: 'bold 14px monospace',
      color: 'rgba(220, 236, 230, 0.78)',
      shadow: false,
    });

    const explorationCount = beast?.explorationCount || 0;
    drawText(this.ctx, `🗺️ Explorações do dia: ${explorationCount}/10`, leftX, clockY + 52, {
      font: 'bold 14px monospace',
      color: 'rgba(183, 221, 205, 0.82)',
      shadow: false,
    });

    const title = 'Guardian Grove Sanctuary';
    drawText(this.ctx, title, this.canvas.width / 2, 40, {
      align: 'center',
      font: 'bold 26px monospace',
      color: GLASS_THEME.palette.accent.green,
    });

    // Subtitle removido - informações movidas para menu de Ajuda
  }
  
  private drawTopMenu(buttonY: number, buttonHeight: number) {
    // Menu de ações principais (SEM Status, movido para baixo) + Ajuda
    const menuItems = [
      { id: 'inventory', icon: '🎒', label: 'Inventário', action: () => this.onOpenInventory() },
      { id: 'achievements', icon: '🏆', label: 'Conquistas', action: () => this.onOpenAchievements() },
      { id: 'leaderboard', icon: '🎖️', label: 'Ranking', action: () => this.onOpenLeaderboard() },
      { id: 'daily_spin', icon: '🎰', label: 'Roleta', action: () => this.onOpenDailySpin() },
      { id: 'minigames', icon: '🎮', label: 'Mini-Games', action: () => this.onOpenMinigames() },
      { id: 'skin_shop', icon: '🛒', label: 'Loja Skins', action: () => this.onOpenSkinShop() },
      { id: 'skin_manager', icon: '🎭', label: 'Trocar Skin', action: () => this.onOpenSkinManager() },
      { id: 'help', icon: '📖', label: 'Ajuda', action: () => this.onOpenHelp() },
    ];
    
    // Nova posição: mais abaixo para não cobrir tanto o 3D
    // buttonY: 100 → 160 (mais espaçado)
    const newButtonY = 160;
    const newButtonHeight = 42;
    
    const btnWidth = 140;
    const btnGap = 12;
    const totalWidth = (btnWidth * menuItems.length) + (btnGap * (menuItems.length - 1));
    let currentX = (this.canvas.width / 2) - (totalWidth / 2);
    
    menuItems.forEach(item => {
      const isActive = this.activeMenuItem === item.id;
      const isHovered = isMouseOver(this.mouseX, this.mouseY, currentX, newButtonY, btnWidth, newButtonHeight);
      
      drawButton(this.ctx, currentX, newButtonY, btnWidth, newButtonHeight, `${item.icon} ${item.label}`, {
        variant: isActive ? 'primary' : 'ghost',
        isHovered: isHovered,
        fontSize: 14,
      });
      
      this.buttons.set(item.id, {
        x: currentX,
        y: newButtonY,
        width: btnWidth,
        height: newButtonHeight,
        action: item.action,
      });
      
      currentX += btnWidth + btnGap;
    });
  }

  private drawBeastDisplay() {
    const beast = this.gameState.activeBeast;
    const scene3DX = 0;
    const scene3DY = HEADER_HEIGHT;
    const scene3DWidth = this.canvas.width;
    const scene3DHeight = Math.max(0, this.canvas.height - HEADER_HEIGHT);

    if (beast && this.is3DViewerVisible && this.useFullRanchScene) {
      this.createOrUpdateRanchScene3D(scene3DX, scene3DY, scene3DWidth, scene3DHeight, beast);
    } else {
      this.drawHubFallback(scene3DX, scene3DY, scene3DWidth, scene3DHeight);
    }

    if (this.completionMessage) {
      this.drawFloatingMessage(scene3DX + 24, scene3DY + 24, this.completionMessage);
    }
  }

  // Painel de HP/Essência/Fadiga REMOVIDO - Não usado neste jogo
  private drawBeastHudOverlay() {
    return; // Desativado
    
    const beast = this.gameState.activeBeast;
    if (!beast) {
      return;
    }

    const panelWidth = Math.min(420, this.canvas.width - 60);
    const panelHeight = 152;
    const margin = 28;
    const x = margin;
    const y = this.canvas.height - panelHeight - margin;

    this.ctx.save();
    this.ctx.globalAlpha = 0.94;
    this.ctx.fillStyle = 'rgba(8, 24, 17, 0.9)';
    this.drawRoundedRectPath(x, y, panelWidth, panelHeight, 22);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(109, 199, 164, 0.38)';
    this.ctx.lineWidth = 1.6;
    this.ctx.stroke();
    this.ctx.restore();

    const lineData = getBeastLineData(beast.line);
    const infoY = y + 32;

    drawText(this.ctx, `${beast.name}`, x + 24, infoY, {
      font: 'bold 20px monospace',
      color: GLASS_THEME.palette.text.highlight,
    });

    drawText(this.ctx, `${lineData.name} • Nível ${beast.level || 1}`, x + 24, infoY + 20, {
      font: '13px monospace',
      color: 'rgba(206, 231, 221, 0.8)',
      shadow: false,
    });

    const barX = x + 24;
    const barWidth = panelWidth - 48;
    let barY = y + 62;

    drawBar(this.ctx, barX, barY, barWidth, 18, beast.currentHp, beast.maxHp, {
      bgColor: 'rgba(12, 43, 32, 0.4)',
      fillColor: COLORS.attributes.vitality,
      label: `HP ${beast.currentHp}/${beast.maxHp}`,
    });

    barY += 26;

    const essence = beast.essence ?? beast.maxEssence ?? 0;
    const maxEssence = beast.maxEssence || 100;
    drawBar(this.ctx, barX, barY, barWidth, 18, essence, maxEssence, {
      bgColor: 'rgba(18, 44, 60, 0.35)',
      fillColor: COLORS.primary.blue,
      label: `Essência ${essence}/${maxEssence}`,
    });

    barY += 26;

    const fatigue = beast.secondaryStats?.fatigue ?? 0;
    drawBar(this.ctx, barX, barY, barWidth, 14, fatigue, 100, {
      bgColor: 'rgba(60, 32, 12, 0.35)',
      fillColor: COLORS.ui.warning,
      label: `Fadiga ${fatigue}/100`,
    });

    const loyalty = beast.secondaryStats?.loyalty ?? 0;
    const stress = beast.secondaryStats?.stress ?? 0;
    drawText(this.ctx, `Lealdade ${loyalty}/100 • Stress ${stress}/100`, x + 24, y + panelHeight - 18, {
      font: '12px monospace',
      color: 'rgba(188, 223, 209, 0.75)',
      shadow: false,
    });
  }

  // Hints removidos - informações movidas para menu de Ajuda
  private drawInteractionHints() {
    return; // Desativado
    const primary = 'Clique no chão para caminhar • Interaja com objetos iluminados para abrir menus';
    const secondary = 'Use WASD ou o mouse para mover seu guardião pelo santuário';

    this.ctx.save();
    this.ctx.font = 'bold 14px monospace';
    const primaryWidth = this.ctx.measureText(primary).width;
    this.ctx.font = '12px monospace';
    const secondaryWidth = this.ctx.measureText(secondary).width;
    const boxWidth = Math.max(primaryWidth, secondaryWidth) + 48;
    const boxHeight = 70;
    const x = (this.canvas.width - boxWidth) / 2;
    const y = this.canvas.height - boxHeight - 28;

    this.ctx.fillStyle = 'rgba(8, 24, 17, 0.82)';
    this.drawRoundedRectPath(x, y, boxWidth, boxHeight, 18);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(109, 199, 164, 0.32)';
    this.ctx.lineWidth = 1.2;
    this.ctx.stroke();
    this.ctx.restore();

    drawText(this.ctx, primary, this.canvas.width / 2, y + 30, {
      align: 'center',
      font: 'bold 14px monospace',
      color: 'rgba(203, 233, 220, 0.92)',
      shadow: false,
    });

    drawText(this.ctx, secondary, this.canvas.width / 2, y + 52, {
      align: 'center',
      font: '12px monospace',
      color: 'rgba(167, 209, 194, 0.78)',
      shadow: false,
    });
  }

  private drawBeastSprite(x: number, y: number, width: number, height: number, beast: Beast) {
    // Don't create or update 3D viewer if it should be hidden
    if (!this.is3DViewerVisible) {
      // Just draw the border
      this.ctx.strokeStyle = GLASS_THEME.palette.accent.lilac;
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(x, y, width, height);
      return;
    }
    
    // Use full Ranch Scene 3D or mini viewer
    if (this.useFullRanchScene) {
      this.createOrUpdateRanchScene3D(x, y, width, height, beast);
      return;
    }
    
    // Only create viewer once, not every frame
    if (!this.miniViewer3D || this.currentBeastForViewer?.name !== beast.name) {
      console.log('[GameUI] Creating mini viewer for:', beast.name);
      this.cleanup3DMiniViewer();
      
      // Create container for 3D viewer
      this.miniViewer3DContainer = document.createElement('div');
      this.miniViewer3DContainer.id = 'beast-mini-viewer-3d';
      this.miniViewer3DContainer.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 100;
        background: rgba(106, 61, 122, 0.3);
        border: 2px solid rgba(106, 61, 122, 0.6);
      `;
      
      document.body.appendChild(this.miniViewer3DContainer);
      console.log('[GameUI] ✓ Container created and appended');
      
      // Calculate initial position and size
      const canvasRect = this.canvas.getBoundingClientRect();
      const scaleX = canvasRect.width / this.canvas.width;
      const scaleY = canvasRect.height / this.canvas.height;
      
      const containerWidth = width * scaleX;
      const containerHeight = height * scaleY;
      
      // Create 3D viewer
      try {
        this.miniViewer3D = new BeastMiniViewer3D(
          this.miniViewer3DContainer, 
          beast, 
          containerWidth, 
          containerHeight
        );
        this.currentBeastForViewer = beast;
        console.log('[GameUI] ✓ Viewer created successfully');
      } catch (error) {
        console.error('[GameUI] ❌ Failed:', error);
      }
    }
    
    // Update position every frame (but only if not hidden)
    if (this.miniViewer3DContainer) {
      // Don't update position if viewer is hidden
      if (this.miniViewer3DContainer.style.display === 'none') {
        return;
      }
      
      const canvasRect = this.canvas.getBoundingClientRect();
      const scaleX = canvasRect.width / this.canvas.width;
      const scaleY = canvasRect.height / this.canvas.height;
      
      const leftPos = canvasRect.left + (x * scaleX);
      const topPos = canvasRect.top + (y * scaleY);
      const containerWidth = width * scaleX;
      const containerHeight = height * scaleY;
      
      // Check if size changed and update renderer if needed
      const currentWidth = parseFloat(this.miniViewer3DContainer.style.width || '0');
      const currentHeight = parseFloat(this.miniViewer3DContainer.style.height || '0');
      const sizeChanged = Math.abs(currentWidth - containerWidth) > 1 || Math.abs(currentHeight - containerHeight) > 1;
      
      this.miniViewer3DContainer.style.left = `${leftPos}px`;
      this.miniViewer3DContainer.style.top = `${topPos}px`;
      this.miniViewer3DContainer.style.width = `${containerWidth}px`;
      this.miniViewer3DContainer.style.height = `${containerHeight}px`;
      
      // Update Three.js renderer when size changes
      if (sizeChanged && this.miniViewer3D) {
        this.miniViewer3D.onResize(containerWidth, containerHeight);
      }
    }
    
    // Draw border on canvas
    this.ctx.strokeStyle = GLASS_THEME.palette.accent.lilac;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x, y, width, height);
  }

  private drawBeastFallback(x: number, y: number, width: number, height: number, beast: Beast) {
    // Placeholder: colored rectangle representing the beast
    const lineColors: Record<string, string> = {
      olgrim: '#C084FC',
      terravox: '#8B7355',
      feralis: '#34D399',
      brontis: '#22C55E',
      zephyra: '#38BDF8',
      ignar: '#F87171',
      mirella: '#7C3AED',
      umbrix: '#1E293B',
      sylphid: '#FACC15',
      raukor: '#94A3C2',
    };

    const color = lineColors[beast.line] || GLASS_THEME.palette.accent.emerald;

    // Body
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);

    // Border
    this.ctx.strokeStyle = GLASS_THEME.palette.text.primary;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x, y, width, height);

    // "Eyes" to indicate it's alive
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x + 30, y + 30, 15, 15);
    this.ctx.fillRect(x + width - 45, y + 30, 15, 15);
  }

  private drawHubFallback(x: number, y: number, width: number, height: number) {
    if (height <= 0) {
      return;
    }

    const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, 'rgba(10, 27, 19, 0.95)');
    gradient.addColorStop(0.5, 'rgba(12, 40, 26, 0.85)');
    gradient.addColorStop(1, 'rgba(5, 14, 10, 0.95)');

    this.ctx.save();
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y, width, height);
    this.ctx.restore();
  }

  private drawFloatingMessage(x: number, y: number, message: string) {
    this.ctx.save();
    this.ctx.font = 'bold 16px monospace';
    const textWidth = this.ctx.measureText(message).width;
    const paddingX = 16;
    const paddingY = 12;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = 40;

    this.ctx.fillStyle = 'rgba(10, 27, 19, 0.86)';
    this.ctx.strokeStyle = 'rgba(244, 202, 100, 0.6)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.drawRoundedRectPath(x, y, boxWidth, boxHeight, 12);
    this.ctx.fill();
    this.ctx.stroke();

    drawText(this.ctx, message, x + boxWidth / 2, y + boxHeight / 2, {
      align: 'center',
      baseline: 'middle',
      font: 'bold 16px monospace',
      color: '#F7FAFF',
      shadow: false,
    });

    this.ctx.restore();
  }

  private drawStatusPanel() {
    const beast = this.gameState.activeBeast!;
    
    // Painel INFO + ATRIBUTOS + STATUS (lado direito - AUMENTADO para mostrar STATUS)
    const x = this.canvas.width - SIDE_PANEL_WIDTH;
    const y = HEADER_HEIGHT; // Começa LOGO APÓS o header
    const width = SIDE_PANEL_WIDTH;
    const height = STATUS_PANEL_HEIGHT; // Aumentado de 350 → 430 (+80px para STATUS)

    drawPanel(this.ctx, x, y, width, height, {
      variant: 'card',
      highlightIntensity: 1,
      borderWidth: 1.5,
    });

    // Nome da besta (topo do painel)
    const lineData = getBeastLineData(beast.line);
    const formattedName = `${beast.name} - ${lineData.name}`;
    drawText(this.ctx, formattedName, x + 16, y + 10, {
      font: 'bold 18px monospace',
      color: GLASS_THEME.palette.text.highlight,
    });
    
    // Info básica em linha
    const phase = getLifePhase(beast);
    const phaseNames = {
      infant: 'Filhote',
      young: 'Jovem',
      adult: 'Adulto',
      mature: 'Maduro',
      elder: 'Idoso',
    };
    
    // Idade em dias (atualizada a cada meia-noite)
    const ageInDays = beast.ageInDays || 0;
    
    drawText(this.ctx, `${phaseNames[phase]} • Idade: ${ageInDays} dias`, x + 16, y + 34, {
      font: '12px monospace',
      color: GLASS_THEME.palette.text.secondary,
      shadow: false,
    });
    
    // Barras HP, Essência, Fadiga (compactas)
    let barY = y + 60;
    drawBar(this.ctx, x + 16, barY, width - 32, 18, beast.currentHp, beast.maxHp, {
      bgColor: 'rgba(12, 28, 56, 0.35)',
      fillColor: COLORS.attributes.vitality,
      label: `HP ${beast.currentHp}/${beast.maxHp}`,
    });

    drawBar(this.ctx, x + 16, barY + 24, width - 32, 18, beast.essence, beast.maxEssence, {
      bgColor: 'rgba(12, 28, 56, 0.35)',
      fillColor: GLASS_THEME.palette.accent.purple,
      label: `Essência ${beast.essence}/${beast.maxEssence}`,
    });

    drawBar(this.ctx, x + 16, barY + 48, width - 32, 14, beast.secondaryStats.fatigue, 100, {
      bgColor: 'rgba(12, 28, 56, 0.35)',
      fillColor: GLASS_THEME.palette.accent.amber,
      label: `Fadiga ${beast.secondaryStats.fatigue}`,
    });
    
    // Divisor
    barY += 72;
    this.ctx.strokeStyle = 'rgba(164, 218, 255, 0.35)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x + 10, barY);
    this.ctx.lineTo(x + width - 10, barY);
    this.ctx.stroke();
    
    // Título ATRIBUTOS
    barY += 15;
    drawText(this.ctx, 'ATRIBUTOS', x + 16, barY, {
      font: 'bold 16px monospace',
      color: GLASS_THEME.palette.text.highlight,
      shadow: false,
    });

    const attrs = [
      { key: 'might', name: 'Força', color: COLORS.attributes.might },
      { key: 'wit', name: 'Astúcia', color: COLORS.attributes.wit },
      { key: 'focus', name: 'Foco', color: COLORS.attributes.focus },
      { key: 'agility', name: 'Agilidade', color: COLORS.attributes.agility },
      { key: 'ward', name: 'Resistência', color: COLORS.attributes.ward },
      { key: 'vitality', name: 'Vitalidade', color: COLORS.attributes.vitality },
    ];

    let yOffset = barY + 25;
    const labelWidth = 100;
    const barWidth = 370;
    
    attrs.forEach((attr) => {
      const value = beast.attributes[attr.key as keyof typeof beast.attributes];
      
      drawText(this.ctx, attr.name, x + 16, yOffset, {
        font: '13px monospace',
        color: GLASS_THEME.palette.text.secondary,
        shadow: false,
      });

      drawBar(
        this.ctx,
        x + labelWidth + 18,
        yOffset - 2,
        barWidth,
        16,
        value,
        150,
        {
          bgColor: 'rgba(12, 28, 56, 0.32)',
          fillColor: attr.color,
          label: `${value}`,
        }
      );

      yOffset += 24;
    });

    // Divisor
    yOffset += 12;
    this.ctx.strokeStyle = 'rgba(164, 218, 255, 0.28)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x + 10, yOffset);
    this.ctx.lineTo(x + width - 10, yOffset);
    this.ctx.stroke();
    
    // STATUS (mais compacto)
    yOffset += 18;
    
    drawText(this.ctx, 'STATUS', x + 16, yOffset, {
      font: 'bold 18px monospace',
      color: GLASS_THEME.palette.text.highlight,
      shadow: false,
    });
    
    yOffset += 30;

    // Grid de 2 colunas para stats
    const col1X = x + 16;
    const col2X = x + 260;
    
    drawText(this.ctx, `Stress: ${beast.secondaryStats.stress}`, col1X, yOffset, {
      font: '14px monospace',
      color: beast.secondaryStats.stress > 70 ? GLASS_THEME.palette.accent.danger : GLASS_THEME.palette.text.primary,
      shadow: false,
    });

    drawText(this.ctx, `Lealdade: ${beast.secondaryStats.loyalty}`, col2X, yOffset, {
      font: '14px monospace',
      color: GLASS_THEME.palette.accent.cyan,
      shadow: false,
    });
    
    yOffset += 25;

    // CORREÇÃO: Tratar victories e defeats undefined
    const victories = beast.victories ?? 0;
    const defeats = beast.defeats ?? 0;
    
    drawText(this.ctx, `Vitórias: ${victories}`, col1X, yOffset, {
      font: '14px monospace',
      color: GLASS_THEME.palette.accent.emerald,
      shadow: false,
    });
    
    drawText(this.ctx, `Derrotas: ${defeats}`, col2X, yOffset, {
      font: '14px monospace',
      color: GLASS_THEME.palette.text.secondary,
      shadow: false,
    });
  }

  private drawActionMenu() {
    if (!this.gameState.activeBeast) return;
    
    const beast = this.gameState.activeBeast;
    // Usar Date.now() para progresso em tempo real
    const serverTime = Date.now();
    
    // Painel AÇÕES - lado direito, abaixo do STATUS (ATÉ O FUNDO)
    const x = this.canvas.width - SIDE_PANEL_WIDTH;
    const y = HEADER_HEIGHT + STATUS_PANEL_HEIGHT + SIDE_PANEL_GAP; // Logo após STATUS
    const width = SIDE_PANEL_WIDTH;
    const height = this.canvas.height - y; // ATÉ O FUNDO (sem Week Info)

    drawPanel(this.ctx, x, y, width, height, {
      variant: 'card',
      highlightIntensity: 0.9,
      borderWidth: 1.5,
    });

    // Se tem ação em progresso, verificar se já completou
    if (beast.currentAction) {
      // Se a ação já completou (100%), disparar callback de completude
      if (serverTime >= beast.currentAction.completesAt) {
        // Disparar completude automaticamente
        if (this.onCompleteAction) {
          this.onCompleteAction();
        }
        // Não mostrar mais o progresso, voltar ao menu
      } else {
        // Ação ainda em andamento, mostrar progresso
        this.drawActionProgress(beast, serverTime, x, y, width, height);
        return;
      }
    }

    // Se não tem ação, mostrar menu de ações
    drawText(this.ctx, 'AÇÕES DISPONÍVEIS', x + 16, y + 10, {
      font: 'bold 16px monospace',
      color: GLASS_THEME.palette.text.highlight,
      shadow: false,
    });

    // Category buttons (2 colunas alinhadas ao centro)
    const buttonWidth = 228;
    const buttonHeight = 46;
    const buttonSpacingX = 36;
    const totalCategoryWidth = buttonWidth * 2 + buttonSpacingX;
    const buttonStartX = x + (width - totalCategoryWidth) / 2;
    const buttonStartY = y + 34;
    const buttonSpacingY = 56;

    // Grid 2x2 de botões de categoria (sem Torneio)
    const categories = [
      { id: 'train', label: '🏋️ Treinar', row: 0, col: 0 },
      { id: 'work', label: '💼 Trabalhar', row: 0, col: 1 },
      { id: 'rest', label: '😴 Descansar', row: 1, col: 0 },
    ];

    categories.forEach((cat) => {
      const btnX = buttonStartX + cat.col * (buttonWidth + buttonSpacingX);
      const btnY = buttonStartY + (cat.row * buttonSpacingY);
      const isHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, buttonWidth, buttonHeight);
      const isSelected = this.actionCategory === cat.id;

      drawButton(this.ctx, btnX, btnY, buttonWidth, buttonHeight, cat.label, {
        variant: 'primary',
        bgColor: isSelected ? GLASS_THEME.palette.accent.cyan : GLASS_THEME.palette.accent.cyanSoft,
        isHovered,
        isActive: isSelected,
        fontSize: 14,
      });

      this.buttons.set(`category_${cat.id}`, {
        x: btnX,
        y: btnY,
        width: buttonWidth,
        height: buttonHeight,
        action: () => {
          this.actionCategory = cat.id as any;
          this.selectedAction = null;
        },
      });
    });
    
    // Mensagem "Em Desenvolvimento" onde ficava o botão de Torneio
    const devMsgX = buttonStartX + (buttonWidth + buttonSpacingX); // Coluna da direita
    const devMsgY = buttonStartY + buttonSpacingY; // Linha de baixo
    
    drawText(this.ctx, '🏆 Torneio', devMsgX + buttonWidth / 2, devMsgY + 8, {
      font: 'bold 14px monospace',
      color: GLASS_THEME.palette.text.secondary,
      align: 'center',
      shadow: false,
    });
    
    drawText(this.ctx, 'Em Desenvolvimento', devMsgX + buttonWidth / 2, devMsgY + 30, {
      font: '12px monospace',
      color: GLASS_THEME.palette.text.muted,
      align: 'center',
      shadow: false,
    });

    // Show actions for selected category
    if (this.actionCategory) {
      const actionsStartY = buttonStartY + buttonSpacingY + buttonHeight + 36;
      this.drawActionList(x + 10, actionsStartY, beast, serverTime);
    }
  }
  
  private drawActionProgress(beast: Beast, serverTime: number, x: number, y: number, width: number, height: number) {
    // Se tem mensagem de completude, mostrar ela no lugar do progresso
    if (this.completionMessage) {
      drawText(this.ctx, '✅ AÇÃO COMPLETA', x + 16, y + 12, {
        font: 'bold 20px monospace',
        color: GLASS_THEME.palette.accent.emerald,
      });
      
      // Mensagem com quebra de linha automática
      const messageLines = this.completionMessage.split('\n');
      messageLines.forEach((line, index) => {
        drawText(this.ctx, line, x + 16, y + 52 + (index * 25), {
          font: 'bold 16px monospace',
          color: GLASS_THEME.palette.text.primary,
        });
      });
      
      return;
    }
    
    if (!beast.currentAction) return;
    
    const action = beast.currentAction;
    const progress = getActionProgress(action, serverTime);
    const timeRemaining = Math.max(0, action.completesAt - serverTime);
    
    drawText(this.ctx, '⏳ AÇÃO EM PROGRESSO', x + 16, y + 12, {
      font: 'bold 20px monospace',
      color: GLASS_THEME.palette.text.highlight,
    });
    
    // Nome da ação
    drawText(this.ctx, getRealtimeActionName(action.type), x + 16, y + 46, {
      font: 'bold 18px monospace',
      color: GLASS_THEME.palette.text.secondary,
    });
    
    // Barra de progresso
    const barX = x + 16;
    const barY = y + 78;
    const barWidth = width - 32;
    const barHeight = 32;

    drawBar(this.ctx, barX, barY, barWidth, barHeight, progress, 1, {
      fillColor: GLASS_THEME.palette.accent.cyan,
      label: `${Math.floor(progress * 100)}%`,
    });
    
    // Tempo restante
    drawText(this.ctx, `Tempo restante: ${formatTime(timeRemaining)}`, x + 16, y + 124, {
      font: 'bold 16px monospace',
      color: GLASS_THEME.palette.text.secondary,
      shadow: false,
    });
    
    // Botão cancelar
    if (action.canCancel) {
      const cancelBtnX = x + width - 210;
      const cancelBtnY = y + height - 45;
      const cancelBtnWidth = 200;
      const cancelBtnHeight = 35;
      const isHovered = isMouseOver(this.mouseX, this.mouseY, cancelBtnX, cancelBtnY, cancelBtnWidth, cancelBtnHeight);
      
      drawButton(this.ctx, cancelBtnX, cancelBtnY, cancelBtnWidth, cancelBtnHeight, '❌ Cancelar Ação', {
        variant: 'danger',
        isHovered,
      });
      
      this.buttons.set('cancel_action', {
        x: cancelBtnX,
        y: cancelBtnY,
        width: cancelBtnWidth,
        height: cancelBtnHeight,
        action: () => {
          this.onCancelAction();
        },
      });
    }
  }

  private drawActionList(x: number, y: number, beast: Beast, serverTime: number) {
    const actions = this.getActionsForCategory();
    
    const panelInnerWidth = SIDE_PANEL_WIDTH - 20;

    const columns = actions.length >= 6 ? 3 : Math.min(2, Math.max(1, actions.length));
    const rows = Math.ceil(actions.length / columns);

    const spacingX = columns === 3 ? 10 : 12;
    const spacingY = 12;

    const buttonWidth = Math.floor((panelInnerWidth - spacingX * (columns - 1)) / columns);
    const buttonHeight = 28;

    actions.forEach((action, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const totalWidth = buttonWidth * columns + spacingX * (columns - 1);
      const startX = x + (panelInnerWidth - totalWidth) / 2;
      const buttonX = startX + col * (buttonWidth + spacingX);
      const buttonY = y + row * (buttonHeight + spacingY);
      const isHovered = isMouseOver(this.mouseX, this.mouseY, buttonX, buttonY, buttonWidth, buttonHeight);
      const isSelected = this.selectedAction === action.id;
      
      // Verificar se pode iniciar esta ação
      const canStart = canStartAction(beast, action.id, serverTime);

      const displayLabel = action.label.replace(/\s*\([^)]*\)/g, '').trim();

      drawButton(this.ctx, buttonX, buttonY, buttonWidth, buttonHeight, displayLabel, {
        variant: 'primary',
        bgColor: isSelected ? GLASS_THEME.palette.accent.cyan : GLASS_THEME.palette.accent.cyanSoft,
        isHovered,
        isActive: isSelected,
        isDisabled: !canStart.can,
        fontSize: 13,
      });

      this.buttons.set(`action_${action.id}`, {
        x: buttonX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        action: () => {
          if (canStart.can) {
            this.onStartAction(action.id as BeastAction['type']);
          } else {
            // Mostrar mensagem de erro se não pode iniciar
            console.log('[UI] Cannot start action:', canStart.reason);
          }
        },
      });
      
      // Mostrar cooldown se houver
      if (!canStart.can && canStart.timeRemaining) {
        drawText(this.ctx, formatTime(canStart.timeRemaining), buttonX + buttonWidth / 2, buttonY + buttonHeight + 12, {
          align: 'center',
          font: '10px monospace',
          color: GLASS_THEME.palette.text.muted,
          shadow: false,
        });
      }
    });
  }

  private getActionsForCategory(): Array<{ id: WeeklyAction; label: string }> {
    if (this.actionCategory === 'train') {
      return [
        { id: 'train_might', label: 'Força (2min)' },
        { id: 'train_wit', label: 'Astúcia (2min)' },
        { id: 'train_focus', label: 'Foco (2min)' },
        { id: 'train_agility', label: 'Agilidade (2min)' },
        { id: 'train_ward', label: 'Resistência (2min)' },
        { id: 'train_vitality', label: 'Vitalidade (2min)' },
      ];
    } else if (this.actionCategory === 'work') {
      return [
        { id: 'work_warehouse', label: 'Armazém (1.5min, 400💰)' },
        { id: 'work_farm', label: 'Fazenda (1.5min, 350💰)' },
        { id: 'work_guard', label: 'Guarda (1.5min, 500💰)' },
        { id: 'work_library', label: 'Biblioteca (1.5min, 350💰)' },
      ];
    } else if (this.actionCategory === 'rest') {
      return [
        { id: 'rest_sleep', label: 'Dormir (2min)' },
        { id: 'rest_freetime', label: 'Tempo Livre (1min)' },
        { id: 'rest_walk', label: 'Passeio (1min)' },
        { id: 'rest_eat', label: 'Comer Bem (1min)' },
      ];
    }
    // Tournament removido - em desenvolvimento
    return [];
  }

  // REMOVIDO: Week Info agora está no header como "Explorações"
  private drawWeekInfo_DEPRECATED() {
    if (!this.gameState.activeBeast) return;
    
    const beast = this.gameState.activeBeast;
    const serverTime = this.gameState.serverTime || Date.now();
    
    // Week Info - embaixo de AÇÕES
    const x = this.canvas.width - SIDE_PANEL_WIDTH;
    const y = HEADER_HEIGHT + STATUS_PANEL_HEIGHT + SIDE_PANEL_GAP + 215; // Logo após AÇÕES
    const width = SIDE_PANEL_WIDTH;
    const height = 60;

    drawPanel(this.ctx, x, y, width, height, {
      variant: 'card',
      highlightIntensity: 0.9,
      borderWidth: 1.5,
    });

    // Info em 2 linhas (mais legível)
    const ageInfo = calculateBeastAge(beast, serverTime);
    const explorationCount = beast.explorationCount || 0;
    
    drawText(this.ctx, `${beast.name} - ${ageInfo.ageInDays} dias`, x + 16, y + 12, {
      font: 'bold 14px monospace',
      color: GLASS_THEME.palette.accent.lilac,
      shadow: false,
    });
    
    drawText(this.ctx, `Explorações: ${explorationCount}/10`, x + 16, y + 36, {
      font: '13px monospace',
      color: explorationCount >= 10 ? GLASS_THEME.palette.accent.danger : GLASS_THEME.palette.accent.emerald,
      shadow: false,
    });
    
    // Torneio removido - feature em desenvolvimento
  }

  private getActionName(action: WeeklyAction): string {
    const names: Record<WeeklyAction, string> = {
      train_might: 'Treinar Força',
      train_wit: 'Treinar Astúcia',
      train_focus: 'Treinar Foco',
      train_agility: 'Treinar Agilidade',
      train_ward: 'Treinar Resistência',
      train_vitality: 'Treinar Vitalidade',
      work_warehouse: 'Trabalhar no Armazém',
      work_farm: 'Trabalhar na Fazenda',
      work_guard: 'Trabalhar como Guarda',
      work_library: 'Trabalhar na Biblioteca',
      rest_sleep: 'Dormir',
      rest_freetime: 'Tempo Livre',
      rest_walk: 'Passear',
      rest_eat: 'Comer Bem',
      tournament: 'Torneio',
      exploration: 'Exploração',
    };
    return names[action] || action;
  }

  private drawNoBeastScreen() {
    drawText(this.ctx, 'Selecione um guardião para entrar no Grove.', this.canvas.width / 2, HEADER_HEIGHT + 80, {
      align: 'center',
      font: 'bold 20px monospace',
      color: GLASS_THEME.palette.accent.cyan,
    });
  }

  private drawAvatarSelectionOverlay() {
    const overlayTop = HEADER_HEIGHT;
    const overlayHeight = Math.max(0, this.canvas.height - HEADER_HEIGHT);

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(6, 18, 12, 0.82)';
    this.ctx.fillRect(0, overlayTop, this.canvas.width, overlayHeight);
    this.ctx.restore();

    drawText(this.ctx, 'Guardian Grove - Escolha seu Guardião', this.canvas.width / 2, overlayTop + 24, {
      align: 'center',
      font: 'bold 26px monospace',
      color: COLORS.ui.text,
    });

    drawText(this.ctx, 'Selecione um avatar inicial. Você poderá adotar outras criaturas depois no Templo.', this.canvas.width / 2, overlayTop + 60, {
      align: 'center',
      font: '15px monospace',
      color: COLORS.ui.textDim,
    });

    const columns = 3;
    const cardWidth = 240;
    const cardHeight = 190;
    const gapX = 28;
    const gapY = 24;
    const cardsStartY = overlayTop + 96;
    const totalRows = Math.ceil(this.starterLines.length / columns);

    let hoveredAny = false;

    this.starterLines.forEach((line, index) => {
      const row = Math.floor(index / columns);
      const indexInRow = index - row * columns;
      const remaining = this.starterLines.length - row * columns;
      const itemsInRow = row === totalRows - 1 ? Math.max(1, remaining) : columns;
      if (indexInRow >= itemsInRow) {
        return;
      }

      const rowWidth = itemsInRow * cardWidth + (itemsInRow - 1) * gapX;
      const rowStartX = (this.canvas.width - rowWidth) / 2;
      const cardX = rowStartX + indexInRow * (cardWidth + gapX);
      const cardY = cardsStartY + row * (cardHeight + gapY);

      const isHovered = isMouseOver(this.mouseX, this.mouseY, cardX, cardY, cardWidth, cardHeight);
      if (isHovered) {
        hoveredAny = true;
      }

      drawPanel(this.ctx, cardX, cardY, cardWidth, cardHeight, {
        variant: 'popup',
        highlightIntensity: isHovered ? 0.85 : 0.4,
        alpha: 0.94,
        borderWidth: isHovered ? 2.6 : 1.6,
        borderColor: isHovered ? 'rgba(244, 202, 100, 0.85)' : 'rgba(104, 160, 132, 0.55)',
        shadow: isHovered ? undefined : { color: 'rgba(0, 0, 0, 0.28)', blur: 18, offsetY: 12 },
      });

      const data = getBeastLineData(line);

      drawText(this.ctx, data.name, cardX + cardWidth / 2, cardY + 18, {
        align: 'center',
        font: 'bold 17px monospace',
        color: COLORS.ui.text,
      });

      drawText(this.ctx, `Afinidade: ${data.affinity.join(' / ').toUpperCase()}`, cardX + 18, cardY + 52, {
        font: '13px monospace',
        color: COLORS.ui.textDim,
      });

      drawText(this.ctx, `Personalidade: ${data.personality}`, cardX + 18, cardY + 74, {
        font: '13px monospace',
        color: COLORS.ui.textDim,
      });

      drawText(this.ctx, `Pontos fortes: ${data.strengths}`, cardX + 18, cardY + 104, {
        font: '12px monospace',
        color: COLORS.ui.text,
      });

      drawText(this.ctx, `Cuidado: ${data.weaknesses}`, cardX + 18, cardY + 132, {
        font: '12px monospace',
        color: COLORS.ui.textDim,
      });

      drawButton(this.ctx, cardX + 18, cardY + cardHeight - 52, cardWidth - 36, 40, 'Escolher Guardião', {
        bgColor: isHovered ? COLORS.primary.grove : COLORS.primary.forest,
        hoverColor: COLORS.primary.sky,
        textColor: '#0b1b12',
        flat: true,
      });

      this.buttons.set(`avatar-${line}`, {
        x: cardX,
        y: cardY,
        width: cardWidth,
        height: cardHeight,
        action: () => this.handleAvatarSelection(line),
      });
    });

    if (hoveredAny) {
      document.body.style.cursor = 'pointer';
    } else if (!this.currentHubHoverId) {
      document.body.style.cursor = '';
    }
  }

  private handleAvatarSelection(line: BeastLine) {
    document.body.style.cursor = '';
    this.onSelectAvatar(line);
  }
  
  /**
   * Mostra mensagem de ação completa inline no painel por 3 segundos
   */
  public showCompletionMessage(message: string) {
    // Limpar timeout anterior se existir
    if (this.completionMessageTimeout) {
      clearTimeout(this.completionMessageTimeout);
    }
    
    this.completionMessage = message;
    
    // Remover mensagem após 3 segundos
    this.completionMessageTimeout = window.setTimeout(() => {
      this.completionMessage = null;
      this.completionMessageTimeout = null;
    }, 3000);
  }

  // Callbacks
  public onAdvanceWeek: (action: WeeklyAction) => void = () => {};
  public onStartAction: (action: BeastAction['type']) => void = () => {};
  public onCancelAction: () => void = () => {};
  public onCompleteAction?: () => void; // Callback quando ação completa
  public onOpenTemple: () => void = () => {};
  public onOpenVillage: () => void = () => {};
  public onOpenInventory: () => void = () => {};
  public onOpenCraft: () => void = () => {};
  public onOpenShop: () => void = () => {};
  public onOpenStatus: () => void = () => {};
  public onOpenArenaPvp: () => void = () => {};
  public onOpenDungeons: () => void = () => {};
  public onOpenQuests: () => void = () => {};
  public onOpenAchievements: () => void = () => {};
  public onOpenLeaderboard: () => void = () => {};
  public onOpenDailySpin: () => void = () => {};
  public onOpenMinigames: () => void = () => {};
  public onOpenExploration: () => void = () => {};
  public onNavigate: (screen: string) => void = () => {};
  public onOpenSettings: () => void = () => {};
  public onOpenHelp: () => void = () => {};
  public onToggleMute: () => void = () => {};
  public onOpenSkinShop: () => void = () => {};
  public onOpenSkinManager: () => void = () => {};
  public onLogout: () => void = () => {};
  public onSelectAvatar: (line: BeastLine) => void = () => {};
  
  // Estado do mute (atualizado externamente)
  public isMuted = false;

  public updateGameState(gameState: GameState) {
    this.gameState = gameState;
  }
  
  /**
   * Recarrega a skin do jogador na cena 3D
   */
  public reloadPlayerSkin(skinId: string) {
    console.log(`[GameUI] 🔄 Recarregando skin do jogador: ${skinId}`);
    
    if (this.ranchScene3D) {
      this.ranchScene3D.changePlayerSkin(skinId);
    }
  }
  
  /**
   * Mostra uma notificação temporária no topo da tela
   */
  public showNotification(message: string) {
    console.log(`[GameUI] 📢 Notificação: ${message}`);
    
    // Usar o sistema de mensagem inline já existente
    this.showCompletionMessage(message);
  }

  private drawChatStyleTab(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    isActive: boolean,
    isHovered: boolean,
  ) {
    const radius = 10;
    const background = isActive
      ? 'rgba(74, 85, 104, 0.92)'
      : isHovered
        ? 'rgba(60, 70, 92, 0.82)'
        : 'rgba(45, 55, 72, 0.72)';
    const border = isActive ? 'rgba(148, 163, 184, 0.9)' : 'rgba(120, 134, 156, 0.75)';

    this.ctx.save();
    this.ctx.shadowColor = isHovered || isActive ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.25)';
    this.ctx.shadowBlur = isActive ? 22 : 14;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = isActive ? 8 : 5;

    this.drawRoundedRectPath(x, y, width, height, radius);
    this.ctx.fillStyle = background;
    this.ctx.fill();
    this.ctx.restore();

    this.ctx.save();
    this.drawRoundedRectPath(x, y, width, height, radius);
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeStyle = border;
    this.ctx.stroke();
    this.ctx.restore();

    if (isActive) {
      this.ctx.save();
      this.drawRoundedRectPath(x, y + height - 3, width, 3, radius);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      this.ctx.fill();
      this.ctx.restore();
    }

    drawText(this.ctx, label, x + width / 2, y + height / 2, {
      align: 'center',
      baseline: 'middle',
      font: '12px monospace',
      color: '#F7FAFF',
      shadow: false,
    });
  }

  private drawRoundedRectPath(x: number, y: number, width: number, height: number, radius: number) {
    const r = Math.min(radius, width / 2, height / 2);
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + width - r, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    this.ctx.lineTo(x + width, y + height - r);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    this.ctx.lineTo(x + r, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }
}

