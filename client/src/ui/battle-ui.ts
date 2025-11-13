/**
 * UI de Combate - Guardian Grove
 * Interface de batalha tática
 */

import type { BattleContext, CombatAction } from '../types';
import { COLORS } from './colors';
import { drawPanel, drawText, drawBar, drawButton, isMouseOver } from './ui-helper';
import { canUseTechnique } from '../systems/combat';
import { BeastMiniViewer3D } from '../3d/BeastMiniViewer3D';

export class BattleUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private battle: BattleContext;
  
  // Mouse state
  private mouseX = 0;
  private mouseY = 0;
  
  // UI state
  private selectedTechnique: string | null = null;
  private animationFrame = 0;
  private isAutoBattle = false;
  private autoBattleSpeed = 1; // 1 = normal, 2 = fast, 3 = ultra fast
  
  // 3D Viewers
  private playerViewer3D: BeastMiniViewer3D | null = null;
  private playerViewer3DContainer: HTMLDivElement | null = null;
  private enemyViewer3D: BeastMiniViewer3D | null = null;
  private enemyViewer3DContainer: HTMLDivElement | null = null;
  
  // Button positions
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();

  constructor(canvas: HTMLCanvasElement, battle: BattleContext) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.battle = battle;
    
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
    console.log('[Battle UI] Click detected at:', this.mouseX, this.mouseY);
    console.log('[Battle UI] Current phase:', this.battle.phase);
    console.log('[Battle UI] Buttons registered:', this.buttons.size);
    
    let clickedAny = false;
    this.buttons.forEach((button, key) => {
      if (isMouseOver(this.mouseX, this.mouseY, button.x, button.y, button.width, button.height)) {
        console.log('[Battle UI] Button clicked:', key);
        clickedAny = true;
        if (button.action) {
          button.action();
        }
      }
    });
    
    if (!clickedAny) {
      console.log('[Battle UI] No button was clicked');
    }
  }

  public draw() {
    this.animationFrame++;
    
    // Clear
    this.ctx.fillStyle = COLORS.bg.dark;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Rebuild buttons
    this.buttons.clear();

    // Draw arena
    this.drawArena();

    // Draw beasts
    this.drawPlayerBeast();
    this.drawEnemyBeast();

    // Draw HUD
    this.drawPlayerHUD();
    this.drawEnemyHUD();

    // Draw turn indicator
    this.drawTurnIndicator();

    // Draw combat log
    this.drawCombatLog();

    // Draw auto-battle controls
    this.drawAutoBattleControls();

    // Draw action menu (only on player turn and NOT in auto mode)
    if (this.battle.phase === 'player_turn' && !this.isAutoBattle) {
      this.drawActionMenu();
    } else if (this.battle.phase === 'player_turn' && this.isAutoBattle) {
      console.log('[Battle UI] Player turn but auto-battle is active, skipping action menu');
    } else if (this.battle.phase !== 'player_turn') {
      // Debug: log why action menu is not shown
      if (this.animationFrame % 60 === 0) { // Log every 60 frames to avoid spam
        console.log('[Battle UI] Action menu not shown - Phase:', this.battle.phase, 'Auto:', this.isAutoBattle);
      }
    }

    // Draw end screen
    if (this.battle.phase === 'victory' || this.battle.phase === 'defeat' || this.battle.phase === 'fled') {
      this.drawEndScreen();
    }
  }

  private drawArena() {
    // Arena background
    const arenaY = 150;
    const arenaHeight = 200;
    
    drawPanel(this.ctx, 0, arenaY, this.canvas.width, arenaHeight, {
      bgColor: '#2d2d2d',
      borderColor: COLORS.primary.purple,
    });
  }

  private drawPlayerBeast() {
    const x = 150;
    const y = 220;
    const size = 80;
    
    // Create 3D viewer if it doesn't exist
    if (!this.playerViewer3D) {
      this.createPlayerViewer3D();
      // Initial position setup
      this.update3DViewersPosition();
    }
    
    // Name below
    drawText(this.ctx, this.battle.player.beast.name, x + size / 2, y + size + 20, {
      align: 'center',
      font: 'bold 14px monospace',
      color: COLORS.primary.green,
    });
  }

  private drawPlayerBeastFallback(x: number, y: number, size: number) {
    // Beast sprite (placeholder)
    const color = this.getLineColor(this.battle.player.beast.line);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, size, size);
    
    // Border
    this.ctx.strokeStyle = COLORS.ui.text;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, size, size);
  }

  private drawEnemyBeast() {
    const x = this.canvas.width - 230;
    const y = 220;
    const size = 80;
    
    // Create 3D viewer if it doesn't exist
    if (!this.enemyViewer3D) {
      this.createEnemyViewer3D();
      // Initial position setup
      this.update3DViewersPosition();
    }
    
    // Name below
    drawText(this.ctx, this.battle.enemy.beast.name, x + size / 2, y + size + 20, {
      align: 'center',
      font: 'bold 14px monospace',
      color: COLORS.ui.error,
    });
  }

  private drawEnemyBeastFallback(x: number, y: number, size: number) {
    // Beast sprite (placeholder)
    const color = this.getLineColor(this.battle.enemy.beast.line);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, size, size);
    
    // Border
    this.ctx.strokeStyle = COLORS.ui.error;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, size, size);
  }

  private drawPlayerHUD() {
    const x = 20;
    const y = 370;
    const width = 300;
    
    drawPanel(this.ctx, x, y, width, 120, {
      bgColor: COLORS.bg.medium,
    });

    // HP Bar
    drawBar(
      this.ctx,
      x + 10,
      y + 10,
      width - 20,
      25,
      this.battle.player.currentHp,
      this.battle.player.beast.maxHp,
      {
        fillColor: COLORS.attributes.vitality,
        label: `HP: ${this.battle.player.currentHp} / ${this.battle.player.beast.maxHp}`,
      }
    );

    // Essence Bar
    drawBar(
      this.ctx,
      x + 10,
      y + 45,
      width - 20,
      25,
      this.battle.player.currentEssence,
      this.battle.player.beast.maxEssence,
      {
        fillColor: COLORS.primary.purple,
        label: `Essência: ${this.battle.player.currentEssence} / ${this.battle.player.beast.maxEssence}`,
      }
    );

    // Status
    const status = this.battle.player.isDefending ? '🛡️ Defendendo' : '⚔️ Pronto';
    drawText(this.ctx, status, x + 10, y + 85, {
      font: '14px monospace',
      color: this.battle.player.isDefending ? COLORS.ui.info : COLORS.ui.text,
    });
  }

  private drawEnemyHUD() {
    const x = this.canvas.width - 320;
    const y = 370;
    const width = 300;
    
    drawPanel(this.ctx, x, y, width, 120, {
      bgColor: COLORS.bg.medium,
    });

    // HP Bar
    drawBar(
      this.ctx,
      x + 10,
      y + 10,
      width - 20,
      25,
      this.battle.enemy.currentHp,
      this.battle.enemy.beast.maxHp,
      {
        fillColor: COLORS.ui.error,
        label: `HP: ${this.battle.enemy.currentHp} / ${this.battle.enemy.beast.maxHp}`,
      }
    );

    // Essence Bar
    drawBar(
      this.ctx,
      x + 10,
      y + 45,
      width - 20,
      25,
      this.battle.enemy.currentEssence,
      this.battle.enemy.beast.maxEssence,
      {
        fillColor: COLORS.primary.purple,
        label: `Essência: ${this.battle.enemy.currentEssence} / ${this.battle.enemy.beast.maxEssence}`,
      }
    );

    // Status
    const status = this.battle.enemy.isDefending ? '🛡️ Defendendo' : '⚔️ Pronto';
    drawText(this.ctx, status, x + 10, y + 85, {
      font: '14px monospace',
      color: this.battle.enemy.isDefending ? COLORS.ui.info : COLORS.ui.text,
    });
  }

  private drawTurnIndicator() {
    const y = 100; // ← CORREÇÃO: Movido para cima para dar mais espaço
    const text = this.battle.phase === 'player_turn' ? 'SEU TURNO' : 
                 this.battle.phase === 'enemy_turn' ? 'TURNO INIMIGO' :
                 this.battle.phase === 'intro' ? 'BATALHA!' : '';
    
    if (!text) return;

    const color = this.battle.phase === 'player_turn' ? COLORS.primary.green :
                  this.battle.phase === 'enemy_turn' ? COLORS.ui.error :
                  COLORS.primary.gold;

    // ← CORREÇÃO: Adicionado fundo para o indicador de turno
    const panelWidth = 200;
    const panelHeight = 50;
    const panelX = this.canvas.width / 2 - panelWidth / 2;
    const panelY = y - 15;
    
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, {
      bgColor: COLORS.bg.dark,
      borderColor: color,
    });

    drawText(this.ctx, text, this.canvas.width / 2, y, {
      align: 'center',
      font: 'bold 20px monospace', // ← CORREÇÃO: Reduzido de 24px para 20px
      color,
    });

    drawText(this.ctx, `Turno ${this.battle.turnCount}`, this.canvas.width / 2, y + 20, {
      align: 'center',
      font: '12px monospace', // ← CORREÇÃO: Reduzido de 14px para 12px
      color: COLORS.ui.textDim,
    });
  }

  private drawCombatLog() {
    const x = this.canvas.width / 2 - 200; // ← CORREÇÃO: Aumentado de 150 para 200
    const y = 480; // ← CORREÇÃO: Ajustado para melhor alinhamento com controles
    const width = 400; // ← CORREÇÃO: Aumentado de 300 para 400
    const height = 120; // ← CORREÇÃO: Aumentado de 80 para 120
    
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.medium,
    });

    // Show last 5 messages (aumentado de 3 para 5)
    const recentMessages = this.battle.combatLog.slice(-5);
    recentMessages.forEach((msg, i) => {
      drawText(this.ctx, msg, x + 15, y + 20 + i * 22, { // ← CORREÇÃO: Aumentado espaçamento
        font: '14px monospace', // ← CORREÇÃO: Aumentado de 12px para 14px
        color: COLORS.ui.text,
      });
    });
  }

  private drawAutoBattleControls() {
    const x = this.canvas.width - 220; // ← CORREÇÃO: Aumentado de 180 para 220
    const y = 480; // ← CORREÇÃO: Alinhado com o log da batalha para perfeito alinhamento
    const width = 200; // ← CORREÇÃO: Aumentado de 160 para 200
    const height = 100; // ← CORREÇÃO: Aumentado de 80 para 100

    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.medium,
      borderColor: this.isAutoBattle ? COLORS.primary.gold : COLORS.ui.textDim,
    });

    // Title
    drawText(this.ctx, 'COMBATE AUTO', x + width / 2, y + 15, {
      align: 'center',
      font: 'bold 14px monospace', // ← CORREÇÃO: Aumentado de 12px para 14px
      color: COLORS.primary.gold,
    });

    // Auto battle toggle button
    const btnWidth = 180; // ← CORREÇÃO: Aumentado de 140 para 180
    const btnHeight = 35; // ← CORREÇÃO: Aumentado de 28 para 35
    const btnX = x + (width - btnWidth) / 2;
    const btnY = y + 35; // ← CORREÇÃO: Ajustado posição
    const btnIsHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);

    const btnLabel = this.isAutoBattle ? '⏸️ Pausar' : '▶️ Iniciar';
    const btnColor = this.isAutoBattle ? COLORS.ui.warning : COLORS.primary.green;

    drawButton(this.ctx, btnX, btnY, btnWidth, btnHeight, btnLabel, {
      bgColor: btnColor,
      isHovered: btnIsHovered,
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

    // Status indicator
    if (this.isAutoBattle) {
      const pulse = Math.sin(this.animationFrame * 0.1) * 0.3 + 0.7;
      drawText(this.ctx, '🤖 IA ATIVA', x + width / 2, y + 80, { // ← CORREÇÃO: Ajustado posição
        align: 'center',
        font: 'bold 12px monospace', // ← CORREÇÃO: Aumentado de 11px para 12px
        color: `rgba(251, 191, 36, ${pulse})`,
      });
    } else {
      drawText(this.ctx, 'Manual', x + width / 2, y + 80, { // ← CORREÇÃO: Ajustado posição
        align: 'center',
        font: '12px monospace', // ← CORREÇÃO: Aumentado de 11px para 12px
        color: COLORS.ui.textDim,
      });
    }
  }

  private drawActionMenu() {
    const x = 20;
    const y = 620; // ← CORREÇÃO: Movido para baixo para evitar sobreposição com logs
    const width = this.canvas.width - 40;
    const height = 100;
    
    drawPanel(this.ctx, x, y, width, height);

    drawText(this.ctx, 'AÇÕES', x + 10, y + 10, {
      font: 'bold 16px monospace',
      color: COLORS.primary.gold,
    });

    // Main action buttons
    const buttonY = y + 35;
    const buttonWidth = 120;
    const buttonHeight = 35;
    const spacing = 10;

    // Technique button
    const techBtnX = x + 10;
    const techIsHovered = isMouseOver(this.mouseX, this.mouseY, techBtnX, buttonY, buttonWidth, buttonHeight);
    
    drawButton(this.ctx, techBtnX, buttonY, buttonWidth, buttonHeight, '⚔️ Técnicas', {
      bgColor: COLORS.primary.purple,
      isHovered: techIsHovered,
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
    });

    this.buttons.set('btn_defend', {
      x: defendBtnX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      action: () => {
        this.onPlayerAction({ type: 'defend' });
      },
    });

    // Flee button (if allowed)
    if (this.battle.canFlee) {
      const fleeBtnX = defendBtnX + buttonWidth + spacing;
      const fleeIsHovered = isMouseOver(this.mouseX, this.mouseY, fleeBtnX, buttonY, buttonWidth, buttonHeight);
      
      drawButton(this.ctx, fleeBtnX, buttonY, buttonWidth, buttonHeight, '🏃 Fugir', {
        bgColor: COLORS.ui.warning,
        isHovered: fleeIsHovered,
      });

      this.buttons.set('btn_flee', {
        x: fleeBtnX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        action: () => {
          if (confirm('Deseja fugir da batalha?')) {
            this.onPlayerAction({ type: 'flee' });
          }
        },
      });
    }

    // Technique menu
    if (this.selectedTechnique === 'menu') {
      this.drawTechniqueMenu();
    }
  }

  private drawTechniqueMenu() {
    const x = 30;
    const y = 380; // ← CORREÇÃO: Ajustado para melhor alinhamento com novo layout
    const width = this.canvas.width - 60;
    const height = 180;
    
    // Overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    drawPanel(this.ctx, x, y, width, height, {
      bgColor: COLORS.bg.dark,
      borderColor: COLORS.primary.gold,
    });

    drawText(this.ctx, 'TÉCNICAS DISPONÍVEIS', x + 10, y + 10, {
      font: 'bold 18px monospace',
      color: COLORS.primary.gold,
    });

    // Close button
    const closeBtnX = x + width - 80; // ← CORREÇÃO: Aumentado de 70 para 80
    const closeBtnY = y + 5;
    const closeBtnWidth = 70; // ← CORREÇÃO: Aumentado de 60 para 70
    const closeBtnHeight = 30; // ← CORREÇÃO: Aumentado de 25 para 30
    const closeIsHovered = isMouseOver(this.mouseX, this.mouseY, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight);
    
    drawButton(this.ctx, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight, '✖ Fechar', { // ← CORREÇÃO: Melhorado texto e tamanho
      bgColor: COLORS.ui.error,
      isHovered: closeIsHovered,
    });

    this.buttons.set('btn_close_tech', {
      x: closeBtnX,
      y: closeBtnY,
      width: closeBtnWidth, // ← CORREÇÃO: Usar as novas dimensões
      height: closeBtnHeight, // ← CORREÇÃO: Usar as novas dimensões
      action: () => {
        this.selectedTechnique = null;
      },
    });

    // List techniques
    const techniques = this.battle.player.beast.techniques;
    
    console.log('[BattleUI] Drawing technique menu');
    console.log('[BattleUI] Beast:', this.battle.player.beast.name);
    console.log('[BattleUI] Techniques array:', techniques);
    console.log('[BattleUI] Techniques count:', techniques.length);
    
    const techBtnWidth = 180;
    const techBtnHeight = 30;
    const techSpacing = 5;
    const techPerRow = 4;

    if (techniques.length === 0) {
      drawText(this.ctx, '⚠️ Nenhuma técnica disponível!', x + width / 2, y + 80, {
        align: 'center',
        font: 'bold 18px monospace',
        color: COLORS.ui.warning,
      });
      drawText(this.ctx, 'Esta besta não possui técnicas carregadas.', x + width / 2, y + 110, {
        align: 'center',
        font: '14px monospace',
        color: COLORS.ui.textDim,
      });
    }

    techniques.forEach((tech, i) => {
      console.log(`[BattleUI] Technique ${i}:`, tech);
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
            this.onPlayerAction({ type: 'technique', techniqueId: tech.id });
            this.selectedTechnique = null;
          }
        },
      });
    });
  }

  private drawEndScreen() {
    // Overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const title = this.battle.phase === 'victory' ? '🎉 VITÓRIA!' :
                  this.battle.phase === 'defeat' ? '💀 DERROTA' :
                  '🏃 FUGIU';
    
    const color = this.battle.phase === 'victory' ? COLORS.ui.success :
                  this.battle.phase === 'defeat' ? COLORS.ui.error :
                  COLORS.ui.warning;

    drawText(this.ctx, title, this.canvas.width / 2, this.canvas.height / 2 - 50, {
      align: 'center',
      font: 'bold 48px monospace',
      color,
    });

    // Rewards (if victory)
    if (this.battle.phase === 'victory' && this.battle.rewards) {
      const y = this.canvas.height / 2;
      drawText(this.ctx, `💰 +${this.battle.rewards.coronas} Coronas`, this.canvas.width / 2, y, {
        align: 'center',
        font: 'bold 20px monospace',
        color: COLORS.primary.gold,
      });

      drawText(this.ctx, `⭐ +${this.battle.rewards.experience} XP`, this.canvas.width / 2, y + 30, {
        align: 'center',
        font: 'bold 20px monospace',
        color: COLORS.primary.green,
      });
    }

    // Continue button
    const btnWidth = 200;
    const btnHeight = 50;
    const btnX = this.canvas.width / 2 - btnWidth / 2;
    const btnY = this.canvas.height / 2 + 80;
    const btnIsHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);

    drawButton(this.ctx, btnX, btnY, btnWidth, btnHeight, 'Continuar', {
      bgColor: COLORS.primary.purple,
      isHovered: btnIsHovered,
    });

    this.buttons.set('btn_continue', {
      x: btnX,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
      action: () => {
        this.onBattleEnd();
      },
    });
  }

  private getLineColor(line: string): string {
    const colors: Record<string, string> = {
      olgrim: '#9f7aea',
      terravox: '#8b7355',
      feralis: '#48bb78',
      brontis: '#38a169',
      zephyra: '#63b3ed',
      ignar: '#fc8181',
      mirella: '#4299e1',
      umbrix: '#2d3748',
      sylphid: '#fbbf24',
      raukor: '#a0aec0',
    };
    return colors[line] || '#667eea';
  }

  public updateBattle(battle: BattleContext) {
    this.battle = battle;
  }

  private toggleAutoBattle() {
    this.isAutoBattle = !this.isAutoBattle;
    
    if (this.isAutoBattle) {
      console.log('[Battle UI] Auto battle ENABLED');
      // Se estiver no turno do jogador, executa ação automática
      if (this.battle.phase === 'player_turn') {
        this.executeAutoBattleAction();
      }
    } else {
      console.log('[Battle UI] Auto battle DISABLED');
    }
  }

  private executeAutoBattleAction() {
    if (!this.isAutoBattle) return;
    
    // Importa a IA do jogador
    import('../systems/combat-ai').then(module => {
      const action = module.choosePlayerAutoAction(this.battle, false);
      
      // Pequeno delay para ver a ação
      setTimeout(() => {
        this.onPlayerAction(action);
      }, 500 / this.autoBattleSpeed);
    }).catch(err => {
      console.error('[Battle UI] Failed to load combat AI:', err);
    });
  }

  public checkAutoBattle() {
    // Chamado pelo main.ts quando for o turno do jogador
    if (this.isAutoBattle && this.battle.phase === 'player_turn') {
      this.executeAutoBattleAction();
    }
  }

  public isAutoBattleActive(): boolean {
    return this.isAutoBattle;
  }

  public stopAutoBattle() {
    this.isAutoBattle = false;
  }

  private createPlayerViewer3D() {
    console.log('[Battle UI] Creating player 3D viewer for:', this.battle.player.beast.name);
    
    // Create container
    this.playerViewer3DContainer = document.createElement('div');
    this.playerViewer3DContainer.id = 'battle-player-viewer-3d';
    this.playerViewer3DContainer.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 100;
      background: rgba(66, 153, 225, 0.2);
      border: 2px solid rgba(66, 153, 225, 0.6);
    `;
    
    document.body.appendChild(this.playerViewer3DContainer);
    
    // Create 3D viewer
    try {
      this.playerViewer3D = new BeastMiniViewer3D(
        this.playerViewer3DContainer,
        this.battle.player.beast,
        80, // Initial size, will be updated in drawPlayerBeast
        80
      );
      console.log('[Battle UI] ✓ Player 3D viewer created');
    } catch (error) {
      console.error('[Battle UI] ❌ Failed to create player viewer:', error);
    }
  }

  private createEnemyViewer3D() {
    console.log('[Battle UI] Creating enemy 3D viewer for:', this.battle.enemy.beast.name);
    
    // Create container
    this.enemyViewer3DContainer = document.createElement('div');
    this.enemyViewer3DContainer.id = 'battle-enemy-viewer-3d';
    this.enemyViewer3DContainer.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 100;
      background: rgba(252, 129, 129, 0.2);
      border: 2px solid rgba(252, 129, 129, 0.6);
    `;
    
    document.body.appendChild(this.enemyViewer3DContainer);
    
    // Create 3D viewer
    try {
      this.enemyViewer3D = new BeastMiniViewer3D(
        this.enemyViewer3DContainer,
        this.battle.enemy.beast,
        80, // Initial size, will be updated in drawEnemyBeast
        80
      );
      console.log('[Battle UI] ✓ Enemy 3D viewer created');
    } catch (error) {
      console.error('[Battle UI] ❌ Failed to create enemy viewer:', error);
    }
  }

  public update3DViewersPosition() {
    // Update player viewer position
    if (this.playerViewer3DContainer && this.playerViewer3D) {
      const x = 150;
      const y = 220;
      const size = 80;
      
      const canvasRect = this.canvas.getBoundingClientRect();
      const scaleX = canvasRect.width / this.canvas.width;
      const scaleY = canvasRect.height / this.canvas.height;
      
      const leftPos = canvasRect.left + (x * scaleX);
      const topPos = canvasRect.top + (y * scaleY);
      const containerWidth = size * scaleX;
      const containerHeight = size * scaleY;
      
      this.playerViewer3DContainer.style.left = `${leftPos}px`;
      this.playerViewer3DContainer.style.top = `${topPos}px`;
      this.playerViewer3DContainer.style.width = `${containerWidth}px`;
      this.playerViewer3DContainer.style.height = `${containerHeight}px`;
      
      this.playerViewer3D.onResize(containerWidth, containerHeight);
    }
    
    // Update enemy viewer position
    if (this.enemyViewer3DContainer && this.enemyViewer3D) {
      const x = this.canvas.width - 230;
      const y = 220;
      const size = 80;
      
      const canvasRect = this.canvas.getBoundingClientRect();
      const scaleX = canvasRect.width / this.canvas.width;
      const scaleY = canvasRect.height / this.canvas.height;
      
      const leftPos = canvasRect.left + (x * scaleX);
      const topPos = canvasRect.top + (y * scaleY);
      const containerWidth = size * scaleX;
      const containerHeight = size * scaleY;
      
      this.enemyViewer3DContainer.style.left = `${leftPos}px`;
      this.enemyViewer3DContainer.style.top = `${topPos}px`;
      this.enemyViewer3DContainer.style.width = `${containerWidth}px`;
      this.enemyViewer3DContainer.style.height = `${containerHeight}px`;
      
      this.enemyViewer3D.onResize(containerWidth, containerHeight);
    }
  }

  public dispose() {
    console.log('[Battle UI] Disposing 3D viewers');
    
    // Cleanup player viewer
    if (this.playerViewer3D) {
      this.playerViewer3D.dispose();
      this.playerViewer3D = null;
    }
    if (this.playerViewer3DContainer) {
      this.playerViewer3DContainer.remove();
      this.playerViewer3DContainer = null;
    }
    
    // Cleanup enemy viewer
    if (this.enemyViewer3D) {
      this.enemyViewer3D.dispose();
      this.enemyViewer3D = null;
    }
    if (this.enemyViewer3DContainer) {
      this.enemyViewer3DContainer.remove();
      this.enemyViewer3DContainer = null;
    }
    
    console.log('[Battle UI] ✓ Cleanup complete');
  }

  // Callbacks
  public onPlayerAction: (action: CombatAction) => void = () => {};
  public onBattleEnd: () => void = () => {};
}

