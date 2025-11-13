/**
 * UI Principal do Guardian Grove
 */

import type { GameState, Beast, WeeklyAction, BeastAction } from '../types';
import { COLORS } from './colors';
import { GLASS_THEME } from './theme';
import { drawPanel, drawText, drawBar, drawButton, isMouseOver } from './ui-helper';
import { getLifePhase, calculateBeastAge } from '../systems/beast';
import { getBeastLineData } from '../data/beasts';
import { BeastMiniViewer3D } from '../3d/BeastMiniViewer3D';
import { RanchScene3D } from '../3d/scenes/RanchScene3D';
import { canStartAction, getActionProgress, getActionName as getRealtimeActionName } from '../systems/realtime-actions';
import { formatTime } from '../utils/time-format';
import { getGameTime } from '../utils/day-night';

const HEADER_HEIGHT = 130; // Aumentado para acomodar data do calendário
const SIDE_PANEL_WIDTH = 510;
const STATUS_PANEL_HEIGHT = 430;
const SIDE_PANEL_GAP = 12;

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
  private activeMenuItem: string = 'ranch';
  
  // Button positions
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();
  
  // 3D Mini Viewer
  private miniViewer3D: BeastMiniViewer3D | null = null;
  private miniViewer3DContainer: HTMLDivElement | null = null;
  private currentBeastForViewer: Beast | null = null;
  private is3DViewerVisible: boolean = true; // ← Flag para controlar visibilidade
  
  // 3D Ranch Scene (full PS1 environment)
  private ranchScene3D: RanchScene3D | null = null;
  private ranchScene3DContainer: HTMLDivElement | null = null;
  private useFullRanchScene: boolean = true; // Toggle to use full ranch vs mini viewer
  private lastRealRanchSceneWidth: number = 0; // Cache do tamanho REAL (escalado) para detectar mudança
  private lastRealRanchSceneHeight: number = 0;
  
  // Public callbacks
  public onView3D: () => void = () => {};

  constructor(canvas: HTMLCanvasElement, gameState: GameState) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.gameState = gameState;
    
    this.setupEventListeners();
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
        pointer-events: none;
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
      
      // Create Ranch Scene 3D
      this.ranchScene3D = new RanchScene3D(canvas);
      this.ranchScene3D.setBeast(beast.line);
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
    }
  }
  
  // Call this when UI is destroyed or beast changes significantly
  public dispose() {
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
      console.log('[GameUI] Ranch Scene 3D loop stopped');
    }
    
    if (this.ranchScene3DContainer) {
      this.ranchScene3DContainer.style.display = 'none';
      console.log('[GameUI] Ranch Scene 3D hidden');
    }
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
    // Check button clicks
    this.buttons.forEach((button) => {
      if (isMouseOver(this.mouseX, this.mouseY, button.x, button.y, button.width, button.height)) {
        if (button.action) {
          button.action();
        }
      }
    });
  }

  /**
   * REMOVIDO: Não precisa mais forçar redraw, detecção automática de mudança de tamanho
   */

  public draw() {
    this.buttons.clear();
    
    // Clear canvas (transparente para mostrar 3D)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.gameState.activeBeast) {
      this.drawNoBeastScreen();
      return;
    }

    // Draw sections
    this.drawHeader();
    this.drawBeastDisplay();
    this.drawStatusPanel();
    this.drawActionMenu();
    // Week Info removido - exploração vai para o header
  }

  private drawHeader() {
    drawPanel(this.ctx, 0, 0, this.canvas.width, HEADER_HEIGHT, {
      variant: 'header',
      highlightIntensity: 0.9,
      borderWidth: 1.5,
    });

    const buttonY = 20;
    const logoutBtnWidth = 110;
    const logoutBtnHeight = 32;
    const logoutBtnX = this.canvas.width - logoutBtnWidth - 24;
    const settingsBtnWidth = 46;
    const settingsBtnHeight = 32;
    const settingsBtnX = logoutBtnX - settingsBtnWidth - 12;

    const moneyX = settingsBtnX - 18;
    drawText(this.ctx, `💰 ${this.gameState.economy.coronas} Coronas`, moneyX, 30, {
      font: 'bold 16px monospace',
      color: GLASS_THEME.palette.accent.amber,
      align: 'right',
      shadow: false,
    });

    const isLogoutHovered = isMouseOver(this.mouseX, this.mouseY, logoutBtnX, buttonY, logoutBtnWidth, logoutBtnHeight);
    drawButton(this.ctx, logoutBtnX, buttonY, logoutBtnWidth, logoutBtnHeight, '🚪 Sair', {
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

    const isSettingsHovered = isMouseOver(this.mouseX, this.mouseY, settingsBtnX, buttonY, settingsBtnWidth, settingsBtnHeight);
    drawButton(this.ctx, settingsBtnX, buttonY, settingsBtnWidth, settingsBtnHeight, '⚙️', {
      variant: 'ghost',
      isHovered: isSettingsHovered,
      fontSize: 18,
    });

    this.buttons.set('settings', {
      x: settingsBtnX,
      y: buttonY,
      width: settingsBtnWidth,
      height: settingsBtnHeight,
      action: () => this.onOpenSettings(),
    });

    // Relógio e calendário visual (lado esquerdo, no lugar do título)
    const gameTime = getGameTime();
    const clockIcon = gameTime.timeOfDay.isNight ? '🌙' : '☀️';
    const clockText = `${clockIcon} ${gameTime.timeOfDay.timeString}`;
    const dateText = `📅 ${gameTime.calendar.dateString} - ${gameTime.calendar.dayOfWeekName}`;
    
    const leftX = 24;
    const clockY = 24;
    
    // Hora
    drawText(this.ctx, clockText, leftX, clockY, {
      font: 'bold 16px monospace',
      color: gameTime.timeOfDay.isNight ? GLASS_THEME.palette.accent.blue : GLASS_THEME.palette.accent.amber,
      shadow: false,
    });
    
    // Data (abaixo da hora)
    drawText(this.ctx, dateText, leftX, clockY + 22, {
      font: 'bold 13px monospace',
      color: GLASS_THEME.palette.text.secondary,
      shadow: false,
    });

    // Explorações (ao lado do relógio/data)
    const beast = this.gameState.activeBeast;
    const explorationCount = beast?.explorationCount || 0;
    
    // Calcular posição X para explorações (após relógio/data)
    this.ctx.font = 'bold 13px monospace';
    const dateTextWidth = this.ctx.measureText(dateText).width;
    const explorationX = leftX + dateTextWidth + 40; // Espaço entre relógio e explorações
    
    drawText(this.ctx, `🗺️ Explorações: ${explorationCount}/10`, explorationX, clockY + 11, {
      font: 'bold 15px monospace',
      color: GLASS_THEME.palette.text.secondary,
      shadow: false,
    });

    this.drawGlobalMenu();
  }

  private drawGlobalMenu() {
    const menuItems = [
      { id: 'ranch', label: '🏠 Rancho', action: () => this.onNavigate('ranch') },
      { id: 'village', label: '🏘️ Vila', action: () => this.onOpenVillage() },
      { id: 'inventory', label: '🎒 Inventário', action: () => this.onOpenInventory() },
      { id: 'arena', label: '🥊 Arena PVP', action: () => this.onOpenArenaPvp() },
      { id: 'exploration', label: '🗺️ Explorar', action: () => this.onOpenExploration() },
      { id: 'dungeons', label: '⚔️ Dungeons', action: () => this.onOpenDungeons() },
      { id: 'quests', label: '📜 Missões', action: () => this.onOpenQuests() },
      { id: 'achievements', label: '🏆 Conquistas', action: () => this.onOpenAchievements() },
      { id: 'temple', label: '🏛️ Templo', action: () => this.onOpenTemple() },
    ];

    const btnSpacing = 6;
    const btnWidth = 126;
    const btnHeight = 36;
    const totalWidth = menuItems.length * (btnWidth + btnSpacing) - btnSpacing;
    const startX = Math.max(24, (this.canvas.width - totalWidth) / 2);
    const menuY = 76;

    menuItems.forEach((item, index) => {
      const x = startX + index * (btnWidth + btnSpacing);
      const isHovered = isMouseOver(this.mouseX, this.mouseY, x, menuY, btnWidth, btnHeight);
      const isActive = this.activeMenuItem === item.id;

      this.drawChatStyleTab(x, menuY, btnWidth, btnHeight, item.label, isActive, isHovered);

      this.buttons.set(item.id, {
        x,
        y: menuY,
        width: btnWidth,
        height: btnHeight,
        action: () => {
          this.activeMenuItem = item.id;
          item.action();
        },
      });
    });
  }

  private drawBeastDisplay() {
    const beast = this.gameState.activeBeast!;
    
    // === 3D Ranch: preenche TODO o espaço disponível ===
    const scene3DX = 0;
    const scene3DY = HEADER_HEIGHT; // Começa LOGO APÓS o header
    const scene3DWidth = this.canvas.width - SIDE_PANEL_WIDTH; // Até os painéis direitos
    const scene3DHeight = this.canvas.height - HEADER_HEIGHT; // ATÉ O FUNDO (sem Week Info)
    
    // Criar/atualizar Ranch Scene 3D como background
    if (this.is3DViewerVisible && this.useFullRanchScene) {
      this.createOrUpdateRanchScene3D(scene3DX, scene3DY, scene3DWidth, scene3DHeight, beast);
    }
    
    // SEM painel flutuante - info vai para o painel STATUS (direita)

    // Info da besta vai para o painel STATUS (não mais flutuante)
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
    drawText(this.ctx, 'Nenhuma besta ativa!', this.canvas.width / 2, this.canvas.height / 2, {
      align: 'center',
      font: 'bold 24px monospace',
      color: GLASS_THEME.palette.accent.danger,
    });
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
  public onOpenArenaPvp: () => void = () => {};
  public onOpenDungeons: () => void = () => {};
  public onOpenQuests: () => void = () => {};
  public onOpenAchievements: () => void = () => {};
  public onOpenExploration: () => void = () => {};
  public onNavigate: (screen: string) => void = () => {};
  public onOpenSettings: () => void = () => {};
  public onLogout: () => void = () => {};

  public updateGameState(gameState: GameState) {
    this.gameState = gameState;
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

