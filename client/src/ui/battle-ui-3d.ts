/**
 * 3D Immersive Battle UI - Guardian Grove
 * Pokémon Arceus-style 3D battle interface
 * BASEADO NO SISTEMA 2D FUNCIONAL
 */

import type { BattleContext, CombatAction, Technique } from '../types';
import { COLORS } from './colors';
import { drawPanel, drawText, drawBar, drawButton, isMouseOver } from './ui-helper';
import { canUseTechnique } from '../systems/combat';
import { TECHNIQUES } from '../data/techniques';
import { ImmersiveBattleScene3D } from '../3d/scenes/ImmersiveBattleScene3D';

export class BattleUI3D {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private battle: BattleContext;
  
  // 3D Scene
  private scene3D: ImmersiveBattleScene3D | null = null;
  private scene3DContainer: HTMLDivElement | null = null;
  private lastViewportKey: string | null = null;
  private windowResizeHandler: (() => void) | null = null;
  private windowScrollHandler: (() => void) | null = null;
  
  // Mouse state
  private mouseX = 0;
  private mouseY = 0;
  
  // UI state (COPIADO DO 2D)
  private selectedTechnique: string | null = null;
  private animationFrame = 0;
  private isAutoBattle = false;
  private autoBattleSpeed = 1;
  
  // Button positions
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();

  // Callbacks (COPIADO DO 2D)
  public onPlayerAction: ((action: CombatAction) => void) | null = null;
  public onBattleEnd: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, battle: BattleContext) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.battle = battle;
    
    this.setupEventListeners();
    this.setup3DScene();
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

  private setup3DScene() {
    console.log('[BattleUI3D] Setting up immersive 3D scene...');

    const viewport = this.getBattleViewportRect();
    if (viewport.width <= 0 || viewport.height <= 0) {
      console.warn('[BattleUI3D] Viewport inválido para a cena 3D:', viewport);
      return;
    }

    this.scene3DContainer = document.createElement('div');
    this.scene3DContainer.id = 'battle-scene-3d-container';
    this.scene3DContainer.style.position = 'absolute';
    this.scene3DContainer.style.pointerEvents = 'none';
    this.scene3DContainer.style.zIndex = '1';
    this.scene3DContainer.style.overflow = 'hidden';
    this.scene3DContainer.style.borderRadius = '18px';

    const parent = this.canvas.parentElement ?? document.body;
    parent.appendChild(this.scene3DContainer);
    
    // Create 3D scene
    try {
      this.scene3D = new ImmersiveBattleScene3D(
        this.scene3DContainer,
        viewport.width,
        viewport.height
      );
      this.scene3DContainer.firstElementChild?.setAttribute(
        'style',
        'width:100%;height:100%;display:block;'
      );
      
      // Load beasts
      this.scene3D.setPlayerBeast(this.battle.player.beast.line);
      this.scene3D.setEnemyBeast(this.battle.enemy.beast.line);
      
      // Set initial camera angle
      this.scene3D.setCameraAngle('wide');
      
      console.log('[BattleUI3D] ✓ 3D scene created');
    } catch (error) {
      console.error('[BattleUI3D] Failed to create 3D scene:', error);
      return;
    }
    
    this.update3DViewport(true);
    
    // Handle window resize
    const resizeHandler = () => this.update3DViewport();
    const scrollHandler = () => this.update3DViewport();
    this.windowResizeHandler = resizeHandler;
    this.windowScrollHandler = scrollHandler;
    window.addEventListener('resize', resizeHandler);
    window.addEventListener('scroll', scrollHandler, true);
  }

  private handleClick() {
    console.log('[BattleUI3D] Click at:', this.mouseX, this.mouseY, 'Phase:', this.battle.phase);
    console.log('[BattleUI3D] Buttons registered:', this.buttons.size);
    
    let clicked = false;
    this.buttons.forEach((button, key) => {
      if (isMouseOver(this.mouseX, this.mouseY, button.x, button.y, button.width, button.height)) {
        console.log('[BattleUI3D] Button clicked:', key);
        clicked = true;
        if (button.action) {
          button.action();
        }
      }
    });
    
    if (!clicked) {
      console.log('[BattleUI3D] No button clicked');
    }
  }

  // ===== DRAW METHOD (COPIADO E ADAPTADO DO 2D) =====
  public draw() {
    this.update3DViewport();
    this.animationFrame++;
    
    // Clear canvas (transparente para ver 3D)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Rebuild buttons
    this.buttons.clear();

    // Draw battle UI (EXATAMENTE como 2D, mas com 3D no fundo)
    this.drawPlayerHUD();
    this.drawEnemyHUD();
    this.drawTurnIndicator();
    
    if (this.battle.phase === 'player_turn' || this.battle.phase === 'enemy_turn') {
      this.drawCombatLog();
      this.drawActionMenu();
      this.drawAutoBattlePanel();
    } else if (this.battle.phase === 'battle_end') {
      this.drawBattleEndScreen();
    }
    
    // Update 3D scene
    if (this.scene3D) {
      this.scene3D.updateHealth('player', this.battle.player.beast.currentHp, this.battle.player.beast.maxHp);
      this.scene3D.updateHealth('enemy', this.battle.enemy.beast.currentHp, this.battle.enemy.beast.maxHp);
    }
  }

  // ===== PLAYER HUD (COPIADO DO 2D) =====
  private drawPlayerHUD() {
    const x = 50;
    const y = 400;
    const width = 300;
    const height = 140;
    
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: 'rgba(26, 32, 44, 0.9)',
      borderColor: COLORS.primary.green,
      borderWidth: 3,
    });
    
    const player = this.battle.player.beast;
    
    drawText(this.ctx, player.name, x + width / 2, y + 15, {
      align: 'center',
      font: 'bold 18px monospace',
      color: COLORS.primary.green,
    });
    
    // HP Bar
    drawText(this.ctx, 'HP:', x + 15, y + 50, {
      font: 'bold 14px monospace',
      color: COLORS.ui.text,
    });
    
    drawBar(this.ctx, x + 55, y + 50, width - 70, 20, 
      player.currentHp, player.maxHp, {
        bgColor: COLORS.bg.dark,
        fillColor: COLORS.ui.success,
        borderColor: COLORS.ui.text,
      }
    );
    
    drawText(this.ctx, `${player.currentHp}/${player.maxHp}`, 
      x + width / 2 + 20, y + 62, {
      font: 'bold 11px monospace',
      color: COLORS.ui.text,
      align: 'center',
    });
    
    // Essence Bar
    drawText(this.ctx, 'Essência:', x + 15, y + 85, {
      font: 'bold 14px monospace',
      color: COLORS.ui.text,
    });
    
    const essence = this.battle.player.currentEssence;
    const maxEssence = player.maxEssence || 100;
    
    drawBar(this.ctx, x + 100, y + 85, width - 115, 20, 
      essence, maxEssence, {
        bgColor: COLORS.bg.dark,
        fillColor: COLORS.primary.purple,
        borderColor: COLORS.ui.text,
      }
    );
    
    drawText(this.ctx, `${essence}/${maxEssence}`, 
      x + width / 2 + 40, y + 97, {
      font: 'bold 11px monospace',
      color: COLORS.ui.text,
      align: 'center',
    });
    
    // Status
    const statusText = this.battle.player.isDefending ? '🛡️ Defendendo' : '⚔️ Pronto';
    drawText(this.ctx, statusText, x + width / 2, y + 120, {
      align: 'center',
      font: '13px monospace',
      color: COLORS.primary.gold,
    });
  }

  // ===== ENEMY HUD (COPIADO DO 2D) =====
  private drawEnemyHUD() {
    const width = 300;
    const height = 140;
    const x = this.canvas.width - width - 50;
    const y = 400;
    
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: 'rgba(26, 32, 44, 0.9)',
      borderColor: COLORS.ui.error,
      borderWidth: 3,
    });
    
    const enemy = this.battle.enemy.beast;
    
    drawText(this.ctx, enemy.name, x + width / 2, y + 15, {
      align: 'center',
      font: 'bold 18px monospace',
      color: COLORS.ui.error,
    });
    
    // HP Bar
    drawText(this.ctx, 'HP:', x + 15, y + 50, {
      font: 'bold 14px monospace',
      color: COLORS.ui.text,
    });
    
    drawBar(this.ctx, x + 55, y + 50, width - 70, 20, 
      enemy.currentHp, enemy.maxHp, {
        bgColor: COLORS.bg.dark,
        fillColor: COLORS.ui.error,
        borderColor: COLORS.ui.text,
      }
    );
    
    drawText(this.ctx, `${enemy.currentHp}/${enemy.maxHp}`, 
      x + width / 2 + 20, y + 62, {
      font: 'bold 11px monospace',
      color: COLORS.ui.text,
      align: 'center',
    });
    
    // Essence Bar
    drawText(this.ctx, 'Essência:', x + 15, y + 85, {
      font: 'bold 14px monospace',
      color: COLORS.ui.text,
    });
    
    const essence = this.battle.enemy.currentEssence;
    const maxEssence = enemy.maxEssence || 100;
    
    drawBar(this.ctx, x + 100, y + 85, width - 115, 20, 
      essence, maxEssence, {
        bgColor: COLORS.bg.dark,
        fillColor: COLORS.primary.purple,
        borderColor: COLORS.ui.text,
      }
    );
    
    drawText(this.ctx, `${essence}/${maxEssence}`, 
      x + width / 2 + 40, y + 97, {
      font: 'bold 11px monospace',
      color: COLORS.ui.text,
      align: 'center',
    });
    
    // Status
    const statusText = this.battle.enemy.isDefending ? '🛡️ Defendendo' : '⚔️ Pronto';
    drawText(this.ctx, statusText, x + width / 2, y + 120, {
      align: 'center',
      font: '13px monospace',
      color: COLORS.primary.gold,
    });
  }

  // ===== TURN INDICATOR (COPIADO DO 2D) =====
  private drawTurnIndicator() {
    const text = this.battle.phase === 'player_turn' ? 'SEU TURNO' : 
                 this.battle.phase === 'enemy_turn' ? 'TURNO INIMIGO' : '';
    
    if (!text) return;
    
    const color = this.battle.phase === 'player_turn' ? COLORS.primary.green : COLORS.ui.error;
    
    const boxWidth = 240;
    const boxHeight = 60;
    const boxX = (this.canvas.width - boxWidth) / 2;
    const boxY = 30;
    
    drawPanel(this.ctx, boxX, boxY, boxWidth, boxHeight, {
      bgColor: 'rgba(26, 32, 44, 0.9)',
      borderColor: color,
      borderWidth: 3,
    });
    
    drawText(this.ctx, text, this.canvas.width / 2, boxY + 22, {
      font: 'bold 22px monospace',
      color,
      align: 'center',
    });
    
    drawText(this.ctx, `Turno ${this.battle.turnCount}`, this.canvas.width / 2, boxY + 45, {
      font: '13px monospace',
      color: COLORS.ui.textDim,
      align: 'center',
    });
  }

  // ===== COMBAT LOG (COPIADO DO 2D) =====
  private drawCombatLog() {
    const width = 640;
    const height = 130;
    const x = (this.canvas.width - width) / 2;
    const y = 110;
    
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: 'rgba(26, 32, 44, 0.85)',
      borderColor: COLORS.primary.blue,
      borderWidth: 2,
    });
    
    const log = this.battle.combatLog || [];
    let currentY = y + 24;
    
    // Show last 3 messages
    log.slice(-3).forEach(message => {
      drawText(this.ctx, message, x + width / 2, currentY, {
        font: '14px monospace',
        color: COLORS.ui.text,
        align: 'center',
      });
      currentY += 28;
    });
  }

  // ===== ACTION MENU (COPIADO DO 2D) =====
  private drawActionMenu() {
    const x = 20;
    const y = 620;
    const width = this.canvas.width - 40;
    const height = 140;
    
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: 'rgba(26, 32, 44, 0.9)',
      borderColor: COLORS.primary.gold,
      borderWidth: 3,
    });

    drawText(this.ctx, 'AÇÕES', x + 10, y + 15, {
      font: 'bold 16px monospace',
      color: COLORS.primary.gold,
    });

    // Main action buttons
    const buttonY = y + 45;
    const buttonWidth = 140;
    const buttonHeight = 40;
    const spacing = 15;

    // Technique button
    const techBtnX = x + 20;
    const techIsHovered = isMouseOver(this.mouseX, this.mouseY, techBtnX, buttonY, buttonWidth, buttonHeight);
    
    drawButton(this.ctx, techBtnX, buttonY, buttonWidth, buttonHeight, '⚔️ Técnicas', {
      bgColor: COLORS.primary.purple,
      isHovered: techIsHovered,
      fontSize: 14,
    });

    this.buttons.set('btn_techniques', {
      x: techBtnX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      action: () => {
        this.selectedTechnique = 'menu';
      },
    });

    // Defend button
    const defendBtnX = techBtnX + buttonWidth + spacing;
    const defendIsHovered = isMouseOver(this.mouseX, this.mouseY, defendBtnX, buttonY, buttonWidth, buttonHeight);
    
    drawButton(this.ctx, defendBtnX, buttonY, buttonWidth, buttonHeight, '🛡️ Defender', {
      bgColor: COLORS.ui.info,
      isHovered: defendIsHovered,
      fontSize: 14,
    });

    this.buttons.set('btn_defend', {
      x: defendBtnX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      action: () => {
        if (this.onPlayerAction && this.scene3D) {
          this.onPlayerAction({ type: 'defend' });
        }
      },
    });

    // Technique menu overlay
    if (this.selectedTechnique === 'menu') {
      this.drawTechniqueMenu();
    }
  }

  // ===== TECHNIQUE MENU (COPIADO DO 2D) =====
  private drawTechniqueMenu() {
    const x = 30;
    const y = 300;
    const width = this.canvas.width - 60;
    const height = 220; // Reduzido de 320 para 220
    
    // Dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.dark,
      borderColor: COLORS.primary.gold,
      borderWidth: 4,
    });

    drawText(this.ctx, 'TÉCNICAS DISPONÍVEIS', x + 20, y + 20, {
      font: 'bold 20px monospace',
      color: COLORS.primary.gold,
    });

    // Close button
    const closeBtnX = x + width - 90;
    const closeBtnY = y + 10;
    const closeBtnWidth = 80;
    const closeBtnHeight = 35;
    const closeIsHovered = isMouseOver(this.mouseX, this.mouseY, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight);
    
    drawButton(this.ctx, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight, '✖ Fechar', {
      bgColor: COLORS.ui.error,
      isHovered: closeIsHovered,
      fontSize: 14,
    });

    this.buttons.set('btn_close_tech', {
      x: closeBtnX,
      y: closeBtnY,
      width: closeBtnWidth,
      height: closeBtnHeight,
      action: () => {
        this.selectedTechnique = null;
      },
    });

    // List techniques
    const techniques = this.battle.player.beast.techniques || [];
    
    console.log('[BattleUI3D] Drawing techniques, count:', techniques.length);
    console.log('[BattleUI3D] Techniques array:', techniques);
    
    const techBtnWidth = 200;
    const techBtnHeight = 50;
    const techSpacing = 12;
    const techPerRow = Math.floor((width - 40) / (techBtnWidth + techSpacing));

    if (techniques.length === 0) {
      drawText(this.ctx, '⚠️ Nenhuma técnica disponível!', x + width / 2, y + 150, {
        align: 'center',
        font: 'bold 18px monospace',
        color: COLORS.ui.warning,
      });
    }

    techniques.forEach((tech, i) => {
      console.log(`[BattleUI3D] Technique ${i}:`, tech);
      
      const col = i % techPerRow;
      const row = Math.floor(i / techPerRow);
      const techBtnX = x + 10 + col * (techBtnWidth + techSpacing);
      const techBtnY = y + 40 + row * (techBtnHeight + techSpacing);

      const canUse = canUseTechnique(tech, this.battle.player.currentEssence);
      const techIsHovered = isMouseOver(this.mouseX, this.mouseY, techBtnX, techBtnY, techBtnWidth, techBtnHeight);

      drawButton(this.ctx, techBtnX, techBtnY, techBtnWidth, techBtnHeight, 
        `${tech.name} (${tech.essenceCost})`, {
        bgColor: canUse ? COLORS.primary.purple : COLORS.bg.light,
        isHovered: techIsHovered,
        isDisabled: !canUse,
      });

      this.buttons.set(`tech_${tech.id}`, {
        x: techBtnX,
        y: techBtnY,
        width: techBtnWidth,
        height: techBtnHeight,
        action: () => {
          if (canUse) {
            console.log('[BattleUI3D] Using technique:', tech.name);
            this.selectedTechnique = null; // Close menu
            
            if (this.onPlayerAction && this.scene3D) {
              // Play 3D animation
              this.scene3D.playAttackAnimation('player', 'enemy');
              
              // Execute action after animation
              setTimeout(() => {
                if (this.onPlayerAction) {
                  this.onPlayerAction({
                    type: 'technique',
                    techniqueId: tech.id,
                  });
                }
              }, 600);
            }
          }
        },
      });
    });
  }

  // ===== AUTO BATTLE PANEL (COPIADO DO 2D) =====
  private drawAutoBattlePanel() {
    const x = this.canvas.width - 200;
    const y = 560;
    const width = 180;
    const height = 90;
    
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: 'rgba(26, 32, 44, 0.9)',
      borderColor: COLORS.primary.blue,
      borderWidth: 2,
    });

    drawText(this.ctx, 'COMBATE AUTO', x + width / 2, y + 15, {
      align: 'center',
      font: 'bold 14px monospace',
      color: COLORS.primary.gold,
    });

    // Auto battle toggle button
    const btnWidth = 160;
    const btnHeight = 40;
    const btnX = x + (width - btnWidth) / 2;
    const btnY = y + 40;
    const btnIsHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);

    const btnLabel = this.isAutoBattle ? '⏸️ Pausar' : '▶️ Iniciar';
    const btnColor = this.isAutoBattle ? COLORS.ui.warning : COLORS.primary.green;

    drawButton(this.ctx, btnX, btnY, btnWidth, btnHeight, btnLabel, {
      bgColor: btnColor,
      isHovered: btnIsHovered,
      fontSize: 15,
    });

    this.buttons.set('btn_auto_toggle', {
      x: btnX,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
      action: () => {
        this.toggleAutoBattle();
      },
    });
  }

  // ===== BATTLE END SCREEN (COPIADO DO 2D) =====
  private drawBattleEndScreen() {
    const panelWidth = 500;
    const panelHeight = 300;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;
    
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: 'rgba(26, 32, 44, 0.98)',
      borderColor: this.battle.winner === 'player' ? COLORS.primary.gold : COLORS.ui.error,
      borderWidth: 5,
    });
    
    const message = this.battle.winner === 'player' ? '🏆 VITÓRIA!' : '💀 DERROTA';
    const color = this.battle.winner === 'player' ? COLORS.primary.gold : COLORS.ui.error;
    
    drawText(this.ctx, message, panelX + panelWidth / 2, panelY + 120, {
      font: 'bold 48px monospace',
      color,
      align: 'center',
    });
    
    // Continue button
    const btnWidth = 200;
    const btnHeight = 50;
    const btnX = (panelWidth - btnWidth) / 2 + panelX;
    const btnY = panelY + panelHeight - 80;
    const btnIsHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);
    
    drawButton(this.ctx, btnX, btnY, btnWidth, btnHeight, 'Continuar', {
      bgColor: COLORS.primary.green,
      isHovered: btnIsHovered,
      fontSize: 18,
    });
    
    this.buttons.set('btn_continue', {
      x: btnX,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
      action: () => {
        if (this.onBattleEnd) {
          this.onBattleEnd();
        }
      },
    });
  }

  // ===== AUTO BATTLE METHODS (COPIADO DO 2D) =====
  private toggleAutoBattle() {
    this.isAutoBattle = !this.isAutoBattle;
    console.log('[BattleUI3D] Auto-battle:', this.isAutoBattle);
    
    if (this.isAutoBattle && this.battle.phase === 'player_turn') {
      setTimeout(() => this.checkAutoBattle(), 100);
    }
  }

  public checkAutoBattle() {
    if (this.isAutoBattle && this.battle.phase === 'player_turn') {
      this.executeAutoBattleAction();
    }
  }

  private async executeAutoBattleAction() {
    // Lazy load AI (COPIADO DO 2D)
    const { selectBestAction } = await import('../systems/combat-ai');
    const action = selectBestAction(this.battle);
    
    if (this.onPlayerAction && this.scene3D) {
      if (action.type === 'technique') {
        this.scene3D.playAttackAnimation('player', 'enemy');
        setTimeout(() => {
          if (this.onPlayerAction) {
            this.onPlayerAction(action);
          }
        }, 600);
      } else {
        this.onPlayerAction(action);
      }
    }
  }

  public isAutoBattleActive(): boolean {
    return this.isAutoBattle;
  }

  public stopAutoBattle() {
    this.isAutoBattle = false;
  }

  public updateBattle(battle: BattleContext) {
    this.battle = battle;
  }

  public update3DViewersPosition() {
    // Not needed for fullscreen 3D
  }

  public dispose() {
    console.log('[BattleUI3D] Disposing...');
    
    if (this.windowResizeHandler) {
      window.removeEventListener('resize', this.windowResizeHandler);
      this.windowResizeHandler = null;
    }
    if (this.windowScrollHandler) {
      window.removeEventListener('scroll', this.windowScrollHandler, true);
      this.windowScrollHandler = null;
    }

    // Dispose 3D scene
    if (this.scene3D) {
      this.scene3D.dispose();
      this.scene3D = null;
    }
    
    // Remove container
    if (this.scene3DContainer && this.scene3DContainer.parentElement) {
      this.scene3DContainer.parentElement.removeChild(this.scene3DContainer);
      this.scene3DContainer = null;
    }
    
    console.log('[BattleUI3D] ✓ Disposed');
  }

  private getBattleViewportRect(): { x: number; y: number; width: number; height: number } {
    const top = 96;
    const actionPanelTop = 620;
    const bottomMargin = 28;
    const horizontalMargin = Math.max(16, this.canvas.width * 0.025);

    const left = horizontalMargin;
    const right = this.canvas.width - horizontalMargin;
    const bottom = Math.max(top + 200, Math.min(this.canvas.height - 96, actionPanelTop - bottomMargin));

    return {
      x: left,
      y: top,
      width: right - left,
      height: Math.max(180, bottom - top),
    };
  }

  private update3DViewport(force = false): void {
    if (!this.scene3DContainer || !this.scene3D) {
      return;
    }

    const viewport = this.getBattleViewportRect();
    if (viewport.width <= 0 || viewport.height <= 0) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const canvasLeft = rect.left + window.scrollX;
    const canvasTop = rect.top + window.scrollY;

    this.scene3DContainer.style.left = `${canvasLeft + viewport.x}px`;
    this.scene3DContainer.style.top = `${canvasTop + viewport.y}px`;
    this.scene3DContainer.style.width = `${viewport.width}px`;
    this.scene3DContainer.style.height = `${viewport.height}px`;

    const viewportKey = `${viewport.width}x${viewport.height}`;
    if (force || viewportKey !== this.lastViewportKey) {
      this.scene3D.resize(viewport.width, viewport.height);
      this.lastViewportKey = viewportKey;
    }
  }
}
