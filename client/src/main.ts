/**
 * Guardian Grove - Main Bootstrap
 * Online version with authentication
 * 
 * VERSION: 0.8.0
 */

// Log version immediately so we know if cache is working
const CLIENT_VERSION = '0.8.0-hub-refresh';
console.log('%c🔥 GUARDIAN GROVE - BUILD ATUAL CARREGADO! 🔥', 'background: #00ff00; color: #000; font-size: 20px; padding: 10px; font-weight: bold;');
console.log(`%cVersão: ${CLIENT_VERSION}`, 'background: #0f3460; color: #fff; font-size: 14px; padding: 5px;');
console.log('%cSe você não vê este log verde, ainda está com cache antigo!', 'color: #ff0000; font-size: 12px;');

import { GameUI } from './ui/game-ui';
import { BattleUI } from './ui/battle-ui';
import { BattleUIHybrid } from './ui/battle-ui-hybrid';
import { BattleUI3D } from './ui/battle-ui-3d';
import { TempleUI } from './ui/temple-ui';
import { DialogueUI } from './ui/dialogue-ui';
import { ShopUI } from './ui/shop-ui';
import { InventoryUI } from './ui/inventory-ui';
import { StatusUI } from './ui/status-ui';
import { CraftUI } from './ui/craft-ui';
import { QuestsUI } from './ui/quests-ui';
import { AchievementsUI } from './ui/achievements-ui';
import { AchievementsUICanvas } from './ui/achievements-ui-canvas';
import { LeaderboardUICanvas } from './ui/leaderboard-ui-canvas';
import { DailySpinUICanvas } from './ui/daily-spin-ui-canvas';
import { MinigamesMenuUI } from './ui/minigames-menu-ui';
import { MemoryGameUI } from './ui/memory-game-ui';
import type { MinigameType } from './ui/minigames-menu-ui';
import { SettingsUI, type SettingsData } from './ui/settings-ui';
import { HelpUI } from './ui/help-ui';
import { CharacterSelectUI } from './ui/character-select-ui';
import { SkinShopUI } from './ui/skin-shop-ui';
import { SkinManagerUI } from './ui/skin-manager-ui';
import { getSkinState, getActiveSkin } from './data/skins';
import { DungeonUI } from './ui/dungeon-ui';
import { ModalUI } from './ui/modal-ui';
import { ExplorationUI } from './ui/exploration-ui';
import { AuthUI } from './ui/auth-ui';
import { Ranch3DUI } from './ui/ranch-3d-ui';
import { Village3DUI } from './ui/village-3d-ui';
import { ChatUI } from './ui/chat-ui';
import { OptionsMenuUI } from './ui/options-menu-ui';
import { registerMessageHandler } from './ui/message-service';
import { COLORS } from './ui/colors';
import { createNewGame, saveGame, loadGame, advanceGameWeek, addMoney } from './systems/game-state';
import { advanceWeek } from './systems/calendar';
import { isBeastAlive, calculateBeastAge, recalculateDerivedStats } from './systems/beast';
import { 
  canStartAction,
  startAction,
  completeAction as completeActionClient,
  cancelAction,
  applyPassiveRecovery,
  isActionComplete,
  getActionProgress,
  updateExplorationCounter,
  getActionName as getRealtimeActionName
} from './systems/realtime-actions';
import { formatTime } from './utils/time-format';
import { initiateBattle, executePlayerAction, executeEnemyTurn, applyBattleRewards } from './systems/combat';
import { generateTournamentOpponent, getTournamentPrize, getTournamentFee, canEnterTournament } from './systems/tournaments';
import { NPCS, getNPCDialogue, increaseAffinity } from './data/npcs';
import { processWeeklyEvents } from './systems/events';
import { useItem } from './systems/inventory';
import { calculateTournamentDrops } from './systems/drops';
import { getBeastLineData } from './data/beasts';
import { unlockQuests, getCompletedQuests } from './systems/quests';
import { startExploration, advanceExploration, defeatEnemy, collectMaterials, endExploration } from './systems/exploration';
import { executeCraft } from './systems/craft';
import { getItemById } from './data/shop';
import { getDungeonById, calculateFatigueCost } from './data/dungeons';
import type { DungeonEnemy, DungeonBoss } from './data/dungeons';
import type { ExplorationState, ExplorationZone, WildEnemy } from './systems/exploration';
import type { GameState, WeeklyAction, CombatAction, TournamentRank, Beast, Item, BeastAction } from './types';
import { authApi } from './api/authApi';
import { gameApi } from './api/gameApi';
import { TECHNIQUES, getStartingTechniques } from './data/techniques';
import { 
  emitGameEvent, 
  emitItemCrafted, 
  emitItemCollected, 
  emitExplorationCompleted,
  emitTrained,
  emitRested,
  emitWorked,
  emitBattleWon
} from './systems/game-events';
import { VILLAGE_BLUEPRINT } from './data/village-layout';
import type { VillageBuildingConfig } from './types/village';

function applyGuardianTheme() {
  const body = document.body;
  body.style.background = 'radial-gradient(circle at top, #1f4b2f 0%, #123522 45%, #0a1b13 100%)';
  body.style.color = COLORS.ui.text;
  body.style.fontFamily = `'Nunito', 'Nunito Sans', 'Segoe UI', sans-serif`;
}

applyGuardianTheme();

const LEGACY_STORAGE_KEYS = ['beast_keepers_save', 'beast_keepers_state', 'guardian_save'];
LEGACY_STORAGE_KEYS.forEach((key) => {
  if (localStorage.getItem(key)) {
    console.warn('[Bootstrap] Removing legacy storage key:', key);
    localStorage.removeItem(key);
  }
});
if (localStorage.getItem('guardian_grove_version') !== CLIENT_VERSION) {
  console.log('[Bootstrap] Atualizando versão persistida para', CLIENT_VERSION);
  localStorage.setItem('guardian_grove_version', CLIENT_VERSION);
}

function parseServerTraits(rawTraits: any): string[] {
  if (Array.isArray(rawTraits)) {
    return rawTraits;
  }

  if (typeof rawTraits === 'string') {
    try {
      const parsed = JSON.parse(rawTraits);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function parseServerTechniques(serverBeast: any): any[] {
  let techniqueIds: string[] = [];

  if (Array.isArray(serverBeast.techniques)) {
    techniqueIds = serverBeast.techniques;
  } else if (typeof serverBeast.techniques === 'string') {
    try {
      const parsed = JSON.parse(serverBeast.techniques);
      if (Array.isArray(parsed)) {
        techniqueIds = parsed;
      }
    } catch {
      techniqueIds = [];
    }
  }

  const techniques = techniqueIds
    .map((id) => TECHNIQUES[id])
    .filter((tech) => tech !== undefined);

  if (techniques.length === 0) {
    return getStartingTechniques(serverBeast.line);
  }

  return techniques;
}

function mapServerBeast(serverBeast: any): Beast {
  const beast: any = {
    id: serverBeast.id ?? `beast-${Date.now()}`,
    name: serverBeast.name,
    line: serverBeast.line,
    blood: serverBeast.blood || 'common',
    affinity: serverBeast.affinity || 'earth',
    attributes: {
      might: serverBeast.might ?? 20,
      wit: serverBeast.wit ?? 20,
      focus: serverBeast.focus ?? 20,
      agility: serverBeast.agility ?? 20,
      ward: serverBeast.ward ?? 20,
      vitality: serverBeast.vitality ?? 20,
    },
    secondaryStats: {
      fatigue: serverBeast.fatigue ?? 0,
      stress: serverBeast.stress ?? 0,
      loyalty: serverBeast.loyalty ?? 50,
      age: serverBeast.age ?? 0,
      maxAge: serverBeast.max_age ?? 120,
    },
    traits: parseServerTraits(serverBeast.traits),
    techniques: parseServerTechniques(serverBeast),
    currentHp: serverBeast.current_hp ?? 100,
    maxHp: serverBeast.max_hp ?? 100,
    essence: serverBeast.essence ?? 50,
    maxEssence: serverBeast.max_essence ?? 90,
    activeBuffs: [],
    currentAction: serverBeast.current_action,
    lastExploration: serverBeast.last_exploration ?? 0,
    lastTournament: serverBeast.last_tournament ?? 0,
    explorationCount: serverBeast.exploration_count ?? 0,
    birthDate: serverBeast.birth_date ?? Date.now(),
    lastUpdate: serverBeast.last_update ?? Date.now(),
    workBonusCount: serverBeast.work_bonus_count ?? 0,
    ageInDays: serverBeast.age_in_days ?? 0,
    lastDayProcessed: serverBeast.last_day_processed ?? 0,
    victories: serverBeast.victories ?? 0,
    defeats: serverBeast.defeats ?? 0,
    lifeEvents: serverBeast.life_events || [],
  };

  beast.level = serverBeast.level ?? 1;
  beast.experience = serverBeast.experience ?? 0;

  recalculateDerivedStats(beast);

  return beast as Beast;
}

// Elements
const canvas = document.getElementById('game') as HTMLCanvasElement;
const loadingEl = document.getElementById('loading') as HTMLDivElement;
const errorEl = document.getElementById('error') as HTMLDivElement;

if (!canvas) {
  throw new Error('Canvas element not found');
}

const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('Failed to get 2D context');
}

// Auth state
let isAuthenticated = false;
let authUI: AuthUI | null = null;
let authDOMObserver: MutationObserver | null = null;
let inAuth = true; // Start with auth screen

/**
 * CRÍTICO: MutationObserver que remove inputs de auth automaticamente
 * SÓ FUNCIONA QUANDO AUTENTICADO (inAuth === false)
 * NUNCA interfere com tela de login/cadastro
 */
function setupAuthDOMProtection() {
  if (authDOMObserver) {
    console.warn('[Auth Protection] Observer já existe');
    return;
  }
  
  authDOMObserver = new MutationObserver((mutations) => {
    // SÓ executar se estiver autenticado (inAuth === false)
    if (inAuth) return;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            
            // Verificar se é um container de auth
            if (element.id === 'auth-inputs-container' || 
                element.getAttribute('data-auth-container') === 'true') {
              console.warn('[Auth Protection] ⚠️ Container detectado e removido!');
              element.style.display = 'none';
              element.remove();
            }
            
            // Verificar se é um input de auth
            if (element.tagName === 'INPUT') {
              const input = element as HTMLInputElement;
              const isAuthInput = 
                input.hasAttribute('data-field') ||
                (input.placeholder && (
                  input.placeholder.toLowerCase().includes('email') ||
                  input.placeholder.toLowerCase().includes('senha') ||
                  input.placeholder.toLowerCase().includes('nome')
                ));
              
              if (isAuthInput) {
                console.warn('[Auth Protection] ⚠️ Input detectado e removido!');
                input.style.display = 'none';
                input.remove();
              }
            }
          }
        });
      }
    }
  });
  
  // Observar TODO o body
  authDOMObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
  
  console.log('[Auth Protection] ✅ MutationObserver ativo - monitora DOM 24/7');
}

// Game state
let gameState: GameState | null = null;
let gameUI: GameUI | null = null;
let battleUI: BattleUI | BattleUIHybrid | BattleUI3D | null = null; // Suporta 2D, HÍBRIDO, e 3D
let use3DBattle = false; // ⚡ TOGGLE: true = 3D imersivo, false = 2D clássico (DESATIVADO - sistema 2D é mais estável)
let useHybridBattle = true; // 🎨 NOVO: UI 2D + Arena 3D (ATIVADO)
let templeUI: TempleUI | null = null;
let dialogueUI: DialogueUI | null = null;
let shopUI: ShopUI | null = null;
let inventoryUI: InventoryUI | null = null;
let statusUI: StatusUI | null = null;
let craftUI: CraftUI | null = null;
let questsUI: QuestsUI | null = null;
let achievementsUI: AchievementsUI | null = null;
let achievementsUICanvas: AchievementsUICanvas | null = null;
let leaderboardUICanvas: LeaderboardUICanvas | null = null;
let dailySpinUICanvas: DailySpinUICanvas | null = null;
let minigamesMenuUI: MinigamesMenuUI | null = null;
let memoryGameUI: MemoryGameUI | null = null;
let settingsUI: SettingsUI | null = null;
let helpUI: HelpUI | null = null;
let characterSelectUI: CharacterSelectUI | null = null;
let skinShopUI: SkinShopUI | null = null;
let skinManagerUI: SkinManagerUI | null = null;
let dungeonUI: DungeonUI | null = null;
let modalUI: ModalUI | null = null;
let explorationUI: ExplorationUI | null = null;
let ranch3DUI: Ranch3DUI | null = null;
let village3DUI: Village3DUI | null = null;
let inVillage = false;
let chatUI: ChatUI | null = null;
let optionsMenuUI: OptionsMenuUI | null = null;
let inBattle = false;
let inTemple = false;
let inDialogue = false;
let inShop = false;
let inInventory = false;
let inStatus = false;
let inCraft = false;
let inQuests = false;
let inAchievements = false;
let inAchievementsCanvas = false;
let inLeaderboardCanvas = false;
let inDailySpinCanvas = false;
let inMinigamesMenu = false;
let inMemoryGame = false;
let inSettings = false;
let inHelp = false;
let inCharacterSelect = false;
let inSkinShop = false;
let inSkinManager = false;
let inDungeon = false;
let inExploration = false;
let inRanch3D = false;
let explorationState: ExplorationState | null = null;
let isExplorationBattle = false; // Flag para diferenciar batalha de exploração
void isExplorationBattle; // Reservado para uso futuro

// Animation loop
let lastSaveTime = 0;
const AUTO_SAVE_INTERVAL = 10000; // 10 segundos

// Realtime sync loop
let realtimeSyncInterval: number | null = null;
const SYNC_INTERVAL = 30000; // Sincronizar com servidor a cada 30 segundos

function startRealtimeSync() {
  if (realtimeSyncInterval) {
    clearInterval(realtimeSyncInterval);
  }
  
  realtimeSyncInterval = window.setInterval(async () => {
    if (!gameState || !gameState.activeBeast || !isAuthenticated) return;
    
    try {
      // Sincronizar tempo com servidor
      const serverTime = await gameApi.getServerTime();
      gameState.serverTime = serverTime;
      
      const now = serverTime;
      const lastSync = gameState.lastSync || now;
      
      // Aplicar recuperação passiva de fadiga/stress
      applyPassiveRecovery(gameState.activeBeast, lastSync, now);
      gameState.lastSync = now;
      
      // Atualizar contador de explorações
      updateExplorationCounter(gameState.activeBeast, now);
      
      // Verificar se ação completou
      if (gameState.activeBeast.currentAction) {
        if (isActionComplete(gameState.activeBeast.currentAction, now)) {
          // Completar ação no cliente
          const result = completeActionClient(gameState.activeBeast, gameState);
          
          if (result.success) {
            // Mostrar mensagem inline no painel por 3 segundos
            if (gameUI) {
              gameUI.showCompletionMessage(result.message);
            }
            console.log(`[Action] ${result.message}`);
            
            // Salvar no servidor
            await gameApi.completeBeastAction(gameState.activeBeast.id);
            await saveGame(gameState);
          }
          
          // Atualizar UI
          if (gameUI) {
            gameUI.updateGameState(gameState);
          }
        }
      }
      
      // Verificar se besta ainda está viva (servidor processa ciclo diário automaticamente)
      // Ao carregar o jogo ou sincronizar, verificamos se morreu
      if (!isBeastAlive(gameState.activeBeast, now)) {
        const beastName = gameState.activeBeast.name;
        const ageInfo = calculateBeastAge(gameState.activeBeast, now);
        
        showMessage(
          `${beastName} chegou ao fim de sua jornada após ${ageInfo.ageInDays} dias... 😢\n\nVocê pode criar uma nova besta no Templo dos Ecos.`,
          '💔 Fim da Jornada'
        );
        
        // Mover para bestas falecidas
        gameState.deceasedBeasts.push(gameState.activeBeast);
        gameState.activeBeast = null;
        
        // Salvar
        await saveGame(gameState);
        
        // Atualizar UI
        if (gameUI) {
          gameUI.updateGameState(gameState);
        }
        
        // Parar sync se não há mais besta ativa
        return;
      }
      
    } catch (error) {
      console.error('[Realtime] Sync error:', error);
    }
  }, SYNC_INTERVAL);
  
  console.log('[Realtime] Sync loop started');
}

function startRenderLoop() {
  let frameCount = 0;
  function render(time: number) {
    frameCount++;
    
    // Clear canvas
    ctx.fillStyle = '#0f0f1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Debug logs removed for performance (loop é necessário, logs não)

    // Render based on state
    // CORREÇÃO: inAuth já garante que não renderizamos AuthUI após login
    if (inAuth && authUI) {
      authUI.draw();
    } else if (inBattle && battleUI) {
      battleUI.draw();
    } else if (inTemple && templeUI && gameState) {
      templeUI.draw(gameState);
    } else if (inDialogue && dialogueUI) {
      // Draw dialogue UI (Vila) - NO gameUI underneath!
      dialogueUI.draw();
    } else if (inShop && shopUI && gameState) {
      shopUI.draw(gameState);
    } else if (inInventory && inventoryUI && gameState) {
      inventoryUI.draw(gameState);
    } else if (inStatus && statusUI && gameState) {
      statusUI.draw(gameState);
    } else if (inCraft && craftUI && gameState) {
      craftUI.draw(gameState);
    } else if (inQuests && questsUI && gameState) {
      questsUI.draw(gameState);
    } else if (inAchievements && achievementsUI && gameState) {
      achievementsUI.draw(gameState);
    } else if (inAchievementsCanvas && achievementsUICanvas && gameState) {
      achievementsUICanvas.draw(gameState);
    } else if (inLeaderboardCanvas && leaderboardUICanvas && gameState) {
      leaderboardUICanvas.draw(gameState);
    } else if (inDailySpinCanvas && dailySpinUICanvas && gameState) {
      const delta = 1 / 60; // Aproximação
      dailySpinUICanvas.update(delta);
      dailySpinUICanvas.draw(gameState, delta);
    } else if (inMinigamesMenu && minigamesMenuUI && gameState) {
      minigamesMenuUI.draw(gameState);
    } else if (inMemoryGame && memoryGameUI && gameState) {
      const delta = 1 / 60; // Aproximação
      memoryGameUI.draw(gameState, delta);
    } else if (inSettings && settingsUI && gameState) {
      settingsUI.draw(gameState);
    } else if (inHelp && helpUI) {
      helpUI.render();
    } else if (inCharacterSelect && characterSelectUI && gameState) {
      characterSelectUI.draw(gameState);
    } else if (inSkinShop && skinShopUI && gameState) {
      skinShopUI.draw(gameState);
    } else if (inSkinManager && skinManagerUI && gameState) {
      skinManagerUI.draw(gameState);
    } else if (inDungeon && dungeonUI && gameState) {
      dungeonUI.draw(gameState);
    } else if (inExploration && explorationUI) {
      explorationUI.draw(explorationState || undefined);
    } else if (inRanch3D && ranch3DUI) {
      ranch3DUI.render();
      // Clean up mini viewer when in full 3D mode
      if (gameUI) {
        gameUI.dispose();
      }
    } else if (gameUI && gameState) {
      // Only draw GameUI when NO other menu is active AND modal is not showing AND village is not open
      // Verificar se nenhuma UI está ativa (verificar flag E se a UI existe)
      const hasActiveUI = (inShop && shopUI) || (inInventory && inventoryUI) || (inCraft && craftUI) || 
                          (inQuests && questsUI) || (inAchievements && achievementsUI) || 
                          (inDungeon && dungeonUI) || (inExploration && explorationUI) || 
                          (inDialogue && dialogueUI) || (inBattle && battleUI) || (inTemple && templeUI);
      
      if (modalUI && modalUI.isShowing()) {
        // Skip drawing GameUI when modal is open (e.g., Vila menu)
      } else if (inVillage) {
        // Skip drawing GameUI when village is open
      } else if (hasActiveUI) {
        // Skip drawing GameUI when any other UI is active
      } else {
        gameUI.draw();
      }
    }

    // Draw modal UI on top of everything
    if (modalUI && modalUI.isShowing()) {
      modalUI.draw();
    }
    
    // Draw options menu UI
    if (optionsMenuUI && optionsMenuUI.isShowing()) {
      optionsMenuUI.draw(ctx);
    }

    // Draw chat and friends UI (HTML overlay, always on top)
    if (chatUI && isAuthenticated) {
      // ChatUI renders via innerHTML, no draw() method needed
    }
    

    // Auto-save periodically (only if authenticated and has game)
    if (isAuthenticated && gameState && time - lastSaveTime > AUTO_SAVE_INTERVAL) {
      saveGame(gameState).catch(err => {
        console.error('[Save] Auto-save failed:', err);
      });
      lastSaveTime = time;
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

async function init() {
  try {
    loadingEl.textContent = 'Carregando Guardian Grove...';

    // Setup canvas
    resizeCanvas();
    // Resize handler - SEM debounce (detecção automática de mudança no draw)
    window.addEventListener('resize', () => {
      resizeCanvas();
      // Update 3D viewer position on resize
      if (gameUI) {
        gameUI.update3DViewerPosition();
      }
      // Update battle 3D viewers position on resize
      if (battleUI && inBattle) {
        battleUI.update3DViewersPosition();
      }
      // Próximo draw() detectará mudança de tamanho automaticamente
    });

    // Register Service Worker (DESATIVADO - causava problemas com cache)
    // if ('serviceWorker' in navigator) {
    //   try {
    //     await navigator.serviceWorker.register('/sw.js');
    //     console.log('[SW] Service Worker registered');
    //   } catch (err) {
    //     console.warn('[SW] Registration failed:', err);
    //   }
    // }

    // Sistema de áudio removido
    
    // Setup global mouse handlers for options menu
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      
      // Options Menu
      if (optionsMenuUI && optionsMenuUI.isShowing()) {
        if (optionsMenuUI.handleClick(x, y)) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
      }
    });

    // Create Modal UI first
    modalUI = new ModalUI(canvas);
    registerMessageHandler((message, options) => {
      const title = options?.title ?? '💬 Guardian Grove';
      showMessage(message, title, options?.onClose);
    });

    // Create Auth UI
    authUI = new AuthUI(canvas);

    // Check for OAuth callback
    authUI.checkOAuthCallback();

    // Setup auth callbacks
    authUI.onLoginSuccess = async (token, user) => {
      console.log('[Auth] Login success:', user.displayName);
      isAuthenticated = true;
      inAuth = false;
      
      // NOVO: Adicionar classe 'authenticated' ao body para CSS forçar esconder
      document.body.classList.add('authenticated');
      console.log('[Auth] ✅ Added "authenticated" class to body');
      
      // CORREÇÃO: Esconder completamente o AuthUI após login
      authUI.hide();
      
      // NOVO: Função de cleanup que será executada periodicamente
      const cleanupAuthElements = () => {
        const authContainers = document.querySelectorAll('#auth-inputs-container, [data-auth-container]');
        const orphanInputs = document.querySelectorAll('input[data-field], input[placeholder*="email"], input[placeholder*="senha"], input[placeholder*="nome"]');
        
        if (authContainers.length > 0 || orphanInputs.length > 0) {
          console.warn(`[Auth Cleanup] Removing ${authContainers.length} containers and ${orphanInputs.length} inputs`);
          
          authContainers.forEach(c => {
            (c as HTMLElement).style.display = 'none';
            (c as HTMLElement).style.visibility = 'hidden';
            (c as HTMLElement).style.pointerEvents = 'none';
            (c as HTMLElement).style.zIndex = '-9999';
            c.remove();
          });
          
          orphanInputs.forEach(input => {
            (input as HTMLElement).style.display = 'none';
            input.remove();
          });
        }
      };
      
      // PROTEÇÃO EXTRA: Forçar remoção agressiva de qualquer container de auth residual
      setTimeout(() => {
        const authContainers = document.querySelectorAll('#auth-inputs-container');
        if (authContainers.length > 0) {
          console.warn('[Main] Found residual auth containers after login, removing:', authContainers.length);
          authContainers.forEach(c => {
            // ESCONDER PRIMEIRO
            (c as HTMLElement).style.display = 'none';
            (c as HTMLElement).style.visibility = 'hidden';
            (c as HTMLElement).style.pointerEvents = 'none';
            (c as HTMLElement).style.zIndex = '-9999';
            // DEPOIS REMOVER
            c.remove();
          });
        }
        
        // PROTEÇÃO DUPLA: Remover TODOS os inputs HTML órfãos
        const allInputs = document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');
        allInputs.forEach(input => {
          const parent = input.closest('#auth-inputs-container');
          if (parent || !input.closest('canvas')) {
            console.warn('[Main] Removing orphan auth input');
            input.remove();
          }
        });
      }, 100);
      
      // PROTEÇÃO TRIPLA: Verificar novamente após 500ms
      setTimeout(() => {
        const authContainers = document.querySelectorAll('#auth-inputs-container');
        if (authContainers.length > 0) {
          console.error('[Main] STILL found auth containers after 500ms! Force removing...');
          authContainers.forEach(c => {
            (c as HTMLElement).style.display = 'none !important';
            c.remove();
          });
        }
      }, 500);
      
      // NOVO: Ativar proteção do DOM com MutationObserver
      setupAuthDOMProtection();
      
      // CORREÇÃO: Redimensionar canvas novamente após esconder AuthUI
      // Isso garante que o canvas esteja configurado corretamente para o GameUI
      resizeCanvas();
      
      // Salvar username no localStorage para o chat
      localStorage.setItem('username', user.displayName);
      
      // Inicializar chat
      if (!chatUI) {
        chatUI = new ChatUI();
        chatUI.connect(token);
        // Callback para atualizar status de amigos na UI de amigos
        // onFriendOnline/onFriendOffline já chama isso internamente no ChatUI
        // Friends agora está integrado no ChatUI
      }
      
      await loadGameFromServer();
      
      // CORREÇÃO: Redimensionar novamente após setupGame para garantir canvas correto
      resizeCanvas();
      
      // AVISO: Informar sobre múltiplas sessões
      const hasOtherSessions = localStorage.getItem('had_active_session');
      if (hasOtherSessions === 'true') {
        console.warn('[Auth] ⚠️ AVISO: Você pode ter outras sessões ativas em outras abas/navegadores.');
        console.warn('[Auth] ⚠️ Múltiplas sessões simultâneas podem causar problemas de sincronização!');
      }
      localStorage.setItem('had_active_session', 'true');
    };

    authUI.onRegisterSuccess = async (token, user) => {
      console.log('[Auth] Register success:', user.displayName);
      isAuthenticated = true;
      inAuth = false;
      
      // NOVO: Adicionar classe 'authenticated' ao body para CSS forçar esconder
      document.body.classList.add('authenticated');
      console.log('[Auth] ✅ Added "authenticated" class to body');
      
      // CORREÇÃO: Esconder completamente o AuthUI após registro
      authUI.hide();
      
      // NOVO: Função de cleanup que será executada periodicamente (mesma do login)
      const cleanupAuthElements = () => {
        const authContainers = document.querySelectorAll('#auth-inputs-container, [data-auth-container]');
        const orphanInputs = document.querySelectorAll('input[data-field], input[placeholder*="email"], input[placeholder*="senha"], input[placeholder*="nome"]');
        
        if (authContainers.length > 0 || orphanInputs.length > 0) {
          console.warn(`[Auth Cleanup] Removing ${authContainers.length} containers and ${orphanInputs.length} inputs`);
          
          authContainers.forEach(c => {
            (c as HTMLElement).style.display = 'none';
            (c as HTMLElement).style.visibility = 'hidden';
            (c as HTMLElement).style.pointerEvents = 'none';
            (c as HTMLElement).style.zIndex = '-9999';
            c.remove();
          });
          
          orphanInputs.forEach(input => {
            (input as HTMLElement).style.display = 'none';
            input.remove();
          });
        }
      };
      
      // PROTEÇÃO EXTRA: Forçar remoção agressiva de qualquer container de auth residual
      setTimeout(() => {
        const authContainers = document.querySelectorAll('#auth-inputs-container');
        if (authContainers.length > 0) {
          console.warn('[Main] Found residual auth containers after register, removing:', authContainers.length);
          authContainers.forEach(c => {
            // ESCONDER PRIMEIRO
            (c as HTMLElement).style.display = 'none';
            (c as HTMLElement).style.visibility = 'hidden';
            (c as HTMLElement).style.pointerEvents = 'none';
            (c as HTMLElement).style.zIndex = '-9999';
            // DEPOIS REMOVER
            c.remove();
          });
        }
        
        // PROTEÇÃO DUPLA: Remover TODOS os inputs HTML órfãos
        const allInputs = document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');
        allInputs.forEach(input => {
          const parent = input.closest('#auth-inputs-container');
          if (parent || !input.closest('canvas')) {
            console.warn('[Main] Removing orphan auth input');
            input.remove();
          }
        });
      }, 100);
      
      // PROTEÇÃO TRIPLA: Verificar novamente após 500ms
      setTimeout(cleanupAuthElements, 500);
      
      // NOVO: Ativar proteção do DOM com MutationObserver (mesma do login)
      setupAuthDOMProtection();
      
      // CORREÇÃO: Redimensionar canvas novamente após esconder AuthUI
      resizeCanvas();
      
      // Salvar username no localStorage para o chat
      localStorage.setItem('username', user.displayName);
      
      // Inicializar chat mesmo sem jogo ainda
      if (!chatUI) {
        chatUI = new ChatUI();
        chatUI.connect(token);
      }
      
      // Inicializar o jogo automaticamente com o nome informado no registro
      try {
        loadingEl.textContent = 'Inicializando seu jogo...';
        loadingEl.style.display = 'block';
        
        console.log('[GameInit] Auto-initializing game for:', user.displayName);
        const response = await gameApi.initializeGame(user.displayName);
        
        if (response.success && response.data) {
          console.log('[GameInit] Game initialized successfully');
          // Carregar o jogo do servidor após inicialização
          await loadGameFromServer();
          // CORREÇÃO: Redimensionar novamente após setupGame
          resizeCanvas();
        } else {
          loadingEl.style.display = 'none';
          handleGameInitializationFailure(
            response.error || 'Não foi possível iniciar sua jornada automaticamente.'
          );
        }
      } catch (error: any) {
        console.error('[GameInit] Auto-initialization error:', error);
        loadingEl.style.display = 'none';
        handleGameInitializationFailure(
          error?.message || 'Erro inesperado ao iniciar sua jornada.'
        );
      }
    };

    // Start render loop early
    startRenderLoop();

    // Imagens 2D removidas - jogo usa apenas modelos 3D

    // Check if already authenticated
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const meResponse = await authApi.getMe();
        if (meResponse.success) {
          console.log('[Auth] Already logged in');
          isAuthenticated = true;
          inAuth = false;
          
          // CRÍTICO: Adicionar classe 'authenticated' quando já está logado
          document.body.classList.add('authenticated');
          console.log('[Auth] ✅ Added "authenticated" class (already logged in)');
          
          // CRÍTICO: Esconder AuthUI quando já está logado
          if (authUI) {
            authUI.hide();
          }
          
          // NOVO: Ativar proteção do DOM com MutationObserver
          setupAuthDOMProtection();
          
          // Obter username e inicializar chat
          if (meResponse.data?.displayName) {
            localStorage.setItem('username', meResponse.data.displayName);
            
            // Inicializar chat
            if (!chatUI && token) {
              chatUI = new ChatUI();
              chatUI.connect(token);
            }
          }
          
          await loadGameFromServer();
        } else {
          // Invalid token - clear it
          localStorage.removeItem('auth_token');
          localStorage.removeItem('username');
          // Hide loading to show auth screen
          loadingEl.style.display = 'none';
        }
      } catch (error) {
        // Invalid token - clear it
        console.error('[Auth] Token validation error:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('username');
        // Hide loading to show auth screen
        loadingEl.style.display = 'none';
      }
    } else {
      // No token - hide loading immediately to show auth screen
      loadingEl.style.display = 'none';
    }

    // Show game canvas (will show auth screen if not authenticated)
    canvas.style.display = 'block';

  } catch (err) {
    console.error('[Init] Failed to initialize:', err);
    errorEl.textContent = 'Erro ao carregar o jogo. Recarregue a página.';
    errorEl.style.display = 'block';
    loadingEl.style.display = 'none';
  }
}

function handleGameInitializationFailure(message: string) {
  console.error('[GameInit] Failure:', message);
  const finalMessage = `${message}\n\nVamos recarregar a página para tentar novamente.`;
  if (modalUI) {
    modalUI.show({
      type: 'message',
      title: '⚠️ Não foi possível iniciar',
      message: finalMessage,
      onConfirm: () => {
        modalUI.hide();
        window.location.reload();
      },
    });
  } else {
    alert(finalMessage);
    window.location.reload();
  }
}

function handleLogout() {
  if (!modalUI) return;

  // Hide 3D viewer while logout modal is open
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Confirm logout
  modalUI.show({
    type: 'choice',
    title: '🚪 Sair',
    message: 'Deseja realmente sair?\n\nSeu progresso está salvo na nuvem.',
    choices: ['Sim, sair', 'Cancelar'],
    onConfirm: (choice) => {
      if (choice === 'Sim, sair') {
        // Disconnect chat
        if (chatUI) {
          chatUI.disconnect();
          chatUI = null;
        }
        
        // Clear token and username
        localStorage.removeItem('auth_token');
        localStorage.removeItem('username');
        localStorage.removeItem('had_active_session');
        
        // Clear game state
        gameState = null;
        gameUI = null;
        battleUI = null;
        templeUI = null;
        dialogueUI = null;
        shopUI = null;
        inventoryUI = null;
        craftUI = null;
        questsUI = null;
        achievementsUI = null;
        explorationUI = null;
        ranch3DUI = null;
        
        // Show auth screen
        isAuthenticated = false;
        inAuth = true;
        
        // Hide loading to prevent stuck screen
        loadingEl.style.display = 'none';
        
        console.log('[Auth] Logged out');
        
        // Reload page to reset everything
        window.location.reload();
      }
    },
    onCancel: () => {
      // Show 3D viewer again if user cancels
      if (gameUI) {
        gameUI.show3DViewer();
      }
    }
  });
}

async function loadGameFromServer(isRetry: boolean = false) {
  try {
    loadingEl.textContent = 'Carregando seu jogo...';
    loadingEl.style.display = 'block';

    const response = await gameApi.getGameSave();
    
    if (response.success && response.data) {
      const serverData = response.data;
      
      // Convert server data to GameState
      gameState = createNewGame(serverData.gameSave.player_name);
      
      // Update with server game save data
      gameState.economy.coronas = serverData.gameSave.coronas || 500;
      gameState.guardian.victories = serverData.gameSave.victories || 0;
      gameState.guardian.title = serverData.gameSave.current_title || 'Guardião Iniciante';
      gameState.serverTime = Date.now();
      gameState.lastSync = Date.now();
      
      const mappedBeasts: Beast[] = [];
      let activeBeast: Beast | null = null;

      if (serverData.beasts && serverData.beasts.length > 0) {
        for (const serverBeast of serverData.beasts) {
          const mapped = mapServerBeast(serverBeast);
          mappedBeasts.push(mapped);

          if (!activeBeast || serverBeast.is_active) {
            activeBeast = mapped;
          }
        }
      }

      gameState.ranch.beasts = mappedBeasts;
      gameState.activeBeast = activeBeast || null;
      gameState.needsAvatarSelection = Boolean(
        serverData.gameSave.needs_avatar_selection ?? mappedBeasts.length === 0
      );

      if (!gameState.needsAvatarSelection && gameState.activeBeast) {
        console.log('[Game] Loaded Beast from server:', gameState.activeBeast.name, `(${gameState.activeBeast.line})`);

        try {
          const cycleResponse = await gameApi.processDailyCycle(gameState.activeBeast.id);
          if (cycleResponse.success && cycleResponse.data) {
            if (cycleResponse.data.processed) {
              console.log(`[DailyCycle] Beast aged: ${cycleResponse.data.ageInDays} days`);
              gameState.activeBeast.ageInDays = cycleResponse.data.ageInDays;
              gameState.activeBeast.explorationCount = 0;
              if (gameUI) {
                gameUI.updateGameState(gameState);
              }
            }
            if (cycleResponse.data.died) {
              console.log('[DailyCycle] Beast died of old age');
              if (gameUI) {
                gameUI.updateGameState(gameState);
              }
            }
          }
        } catch (error) {
          console.error('[DailyCycle] Failed to process daily cycle:', error);
          if (error instanceof Error) {
            console.error('[DailyCycle] Error details:', error.message, error.stack);
          }
        }

        const now = Date.now();
        if (!isBeastAlive(gameState.activeBeast, now)) {
          const beastName = gameState.activeBeast.name;
          const ageInfo = calculateBeastAge(gameState.activeBeast, now);

          showMessage(
            `${beastName} chegou ao fim de sua jornada após ${ageInfo.ageInDays} dias... 😢\n\nVocê pode criar uma nova besta no Templo dos Ecos.`,
            '💔 Fim da Jornada'
          );

          gameState.deceasedBeasts.push(gameState.activeBeast);
          gameState.activeBeast = null;

          await saveGame(gameState);
        }
      } else {
        gameState.activeBeast = null;
      }
      
      // Carregar inventário do servidor
      try {
        const inventoryResponse = await gameApi.getInventory();
        if (inventoryResponse.success && inventoryResponse.data) {
          gameState.inventory = inventoryResponse.data.map((item: any) => {
            const shopItem = getItemById(item.item_id);
            return {
              id: item.item_id,
              name: shopItem?.name || item.item_id,
              category: shopItem?.category || 'crafting',
              effect: shopItem?.effect || '',
              price: shopItem?.price || 0,
              description: shopItem?.description || '',
              quantity: item.quantity,
            };
          });
          console.log(`[Game] Loaded ${gameState.inventory.length} items from server inventory`);
        }
      } catch (error) {
        console.warn('[Game] Failed to load inventory from server, using empty:', error);
        gameState.inventory = [];
      }
      
      // Carregar progresso de quests/achievements do servidor
      try {
        const progressResponse = await gameApi.getProgress();
        if (progressResponse.success && progressResponse.data) {
          // Merge server progress with client quests/achievements definitions
          if (progressResponse.data.quests) {
            for (const serverQuest of progressResponse.data.quests) {
              const quest = gameState.quests.find(q => q.id === serverQuest.quest_id);
              if (quest) {
                quest.goal = serverQuest.progress;
                quest.isCompleted = serverQuest.is_completed;
                quest.isActive = serverQuest.is_active;
                quest.progress = quest.goal.current && typeof quest.goal.target === 'number'
                  ? Math.min((quest.goal.current / quest.goal.target) * 100, 100)
                  : 0;
              }
            }
          }
          
          if (progressResponse.data.achievements) {
            for (const serverAchievement of progressResponse.data.achievements) {
              const achievement = gameState.achievements.find(a => a.id === serverAchievement.achievement_id);
              if (achievement) {
                achievement.requirement.current = serverAchievement.progress;
                achievement.progress = typeof achievement.requirement.target === 'number'
                  ? Math.min((serverAchievement.progress / achievement.requirement.target) * 100, 100)
                  : 0;
                achievement.isUnlocked = !!serverAchievement.unlocked_at;
                achievement.unlockedAt = serverAchievement.unlocked_at ? new Date(serverAchievement.unlocked_at).getTime() : undefined;
              }
            }
          }
          
          console.log(`[Game] Loaded progress: ${progressResponse.data.quests.length} quests, ${progressResponse.data.achievements.length} achievements`);
        }
      } catch (error) {
        console.warn('[Game] Failed to load progress from server, using defaults:', error);
      }
      
      console.log('[Game] Loaded from server:', gameState.guardian.name);
      
      await setupGame();
      // CORREÇÃO: Garantir que canvas está redimensionado após setupGame
      resizeCanvas();
    } else {
      handleGameInitializationFailure(
        'Não encontramos os dados iniciais da sua jornada. Vamos recarregar para tentar novamente.'
      );
      return;
    }
    // Iniciar loop de sincronização em tempo real
    startRealtimeSync();
    
  } catch (error: any) {
    console.error('[Game] Failed to load from server:', error);
    const errorMessage = error?.message ?? '';
    if (!isRetry && errorMessage.includes('No game save found')) {
      try {
        console.warn('[Game] Nenhum save encontrado. Tentando inicializar automaticamente...');
        const fallbackName =
          localStorage.getItem('username') ||
          localStorage.getItem('display_name') ||
          'Guardião';

        const initResponse = await gameApi.initializeGame(fallbackName);

        if (initResponse.success) {
          console.log('[Game] Game save criado automaticamente. Recarregando dados...');
          await loadGameFromServer(true);
          return;
        }

        console.error('[Game] Falha ao criar game save automaticamente:', initResponse.error);
        handleGameInitializationFailure(
          initResponse.error ||
            'Não encontramos os dados iniciais da sua jornada e não foi possível criar um novo guardião automaticamente.'
        );
      } catch (initError: any) {
        console.error('[Game] Erro ao criar game save automaticamente:', initError);
        handleGameInitializationFailure(
          initError?.message ||
            'Não encontramos os dados iniciais da sua jornada e não foi possível criar um novo guardião automaticamente.'
        );
      }
    } else {
      errorEl.textContent = 'Erro ao carregar jogo do servidor';
      errorEl.style.display = 'block';
    }
    return;
  } finally {
    loadingEl.style.display = 'none';
    // CORREÇÃO: Garantir resizeCanvas após carregar (sucesso ou erro)
    resizeCanvas();
  }
}

async function setupGame() {
  try {
    // gameState already loaded from server in loadGameFromServer()
    // Don't overwrite it with localStorage!
    
    if (!gameState) {
      console.error('[Game] ERROR: gameState is null in setupGame - this should not happen!');
      return;
    }
    
    const totalBeasts = gameState.ranch?.beasts?.length ?? 0;
    if ((gameState as any).needsAvatarSelection === undefined) {
      gameState.needsAvatarSelection = !gameState.activeBeast || totalBeasts === 0;
    } else if (!gameState.activeBeast || totalBeasts === 0) {
      // Força seleção de avatar se não existir guardião válido
      gameState.needsAvatarSelection = true;
    }
    gameState.currentWeek ??= 1;
    gameState.year ??= 1;
    
    console.log('[Game] Setting up game with:', gameState.guardian.name, 'and Beast:', gameState.activeBeast?.name);

    // Create UI
    gameUI = new GameUI(canvas, gameState!);
    
    // Create Options Menu UI (sem configurações de áudio)
    optionsMenuUI = new OptionsMenuUI(canvas);
    optionsMenuUI.onClose = () => {
      // Options menu closed
    };
    optionsMenuUI.onOpenAudioSettings = () => {
      // Sistema de áudio removido
    };
    
    // Setup 3D viewer callback
    gameUI.onView3D = () => {
      if (!gameState || !gameState.activeBeast) return;
      
      console.log('[3D] Opening 3D viewer...');
      inRanch3D = true;
      
      // Create Ranch3D UI
      ranch3DUI = new Ranch3DUI(canvas, gameState.activeBeast);
      
      // Setup exit callback
      ranch3DUI.onExit3D = () => {
        console.log('[3D] Exiting 3D mode...');
        inRanch3D = false;
        ranch3DUI?.dispose();
        ranch3DUI = null;
      };
    };
    
    // Setup temple callback
    gameUI.onOpenTemple = () => {
      openTemple();
    };
    
    // Setup village callback
    gameUI.onOpenVillage = () => {
      openVillage();
    };
    
    // Setup settings callback (botão de engrenagem)
    gameUI.onOpenSettings = () => {
      if (optionsMenuUI) {
        optionsMenuUI.open();
      }
    };
    
    // Setup inventory callback
    gameUI.onOpenInventory = () => {
      openInventory();
    };

    // Setup craft callback
    gameUI.onOpenCraft = () => {
      openCraft();
    };
    
    // Setup shop callback
    gameUI.onOpenShop = () => {
      openShop();
    };
    
    // Setup status callback
    gameUI.onOpenStatus = () => {
      openStatus();
    };

    gameUI.onOpenArenaPvp = () => {
      openArenaPvp();
    };

    // Setup quests callback
    gameUI.onOpenQuests = () => {
      openQuests();
    };

    // Setup achievements callback (Canvas version)
    gameUI.onOpenAchievements = () => {
      openAchievementsCanvas();
    };
    
    // Setup leaderboard callback
    gameUI.onOpenLeaderboard = () => {
      openLeaderboardCanvas();
    };
    
    // Setup daily spin callback
    gameUI.onOpenDailySpin = () => {
      openDailySpinCanvas();
    };
    
    // Setup minigames callback
    gameUI.onOpenMinigames = () => {
      openMinigamesMenu();
    };
    
    // Setup settings callback
    gameUI.onOpenSettings = () => {
      openSettings();
    };
    
    // Setup help callback
    gameUI.onOpenHelp = () => {
      openHelp();
    };
    
    // Setup skin shop callback
    gameUI.onOpenSkinShop = () => {
      openSkinShop();
    };
    
    // Setup skin manager callback
    gameUI.onOpenSkinManager = () => {
      openSkinManager();
    };

    // Setup exploration callback
    gameUI.onOpenExploration = () => {
      openExploration();
    };
    
    // Setup dungeons callback
    gameUI.onOpenDungeons = () => {
      openDungeon();
    };

    // Setup navigate callback
    gameUI.onNavigate = (screen: string) => {
      console.log('[Game] Navigate to:', screen);
      // Ranch é a tela padrão, apenas fecha outras UIs
      closeAllOverlays();
    };

    // Setup logout callback
    gameUI.onLogout = () => {
      handleLogout();
    };
    
    gameUI.onSelectAvatar = async (line) => {
      if (!gameState || !gameState.needsAvatarSelection) {
        return;
      }

      try {
        const lineData = getBeastLineData(line);
        const displayName = lineData.name.split(' (')[0] ?? lineData.name;

        const response = await gameApi.createInitialBeast(line, displayName);
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Falha ao criar guardião');
        }

        const mappedBeast = mapServerBeast(response.data);

        gameState.activeBeast = mappedBeast;
        gameState.ranch.beasts = [mappedBeast];
        gameState.needsAvatarSelection = false;

        try {
          await saveGame(gameState);
        } catch (saveError) {
          console.warn('[Avatar] Falha ao salvar seleção de guardião:', saveError);
        }

        gameUI?.updateGameState(gameState);
        gameUI?.draw();

        showMessage(`${displayName} agora caminha ao seu lado no Guardian Grove!`, '🌳 Guardião Escolhido');
      } catch (error: any) {
        console.error('[Avatar] Erro ao selecionar guardião:', error);
        showMessage(
          error?.response?.data?.error || error?.message || 'Não foi possível criar o guardião. Tente novamente.',
          '⚠️ Erro'
        );
      }
    };
    
    // Setup action start callback (novo sistema de tempo real)
    gameUI.onStartAction = async (actionType: BeastAction['type']) => {
      if (!gameState || !gameState.activeBeast) return;
      
      const serverTime = gameState.serverTime || Date.now();
      const beast = gameState.activeBeast;
      
      // Validar beast ID
      if (!beast.id) {
        console.error('[Action] Beast ID is missing!', beast);
        showMessage('Erro: ID da besta não encontrado. Recarregue o jogo.', '⚠️ Erro');
        return;
      }
      
      // Verificar se pode iniciar
      const canStart = canStartAction(beast, actionType, serverTime);
      if (!canStart.can) {
        showMessage(canStart.reason || 'Não pode iniciar esta ação', '⚠️ Ação Bloqueada');
        return;
      }
      
      // Casos especiais: torneio e exploração não usam o sistema de ações cronometradas
      if (actionType === 'tournament') {
        startTournament();
        return;
      }
      
      if (actionType === 'exploration') {
        openExploration();
        return;
      }
      
      // Iniciar ação
      const action = startAction(beast, actionType, serverTime);
      beast.currentAction = action;
      
      // Enviar para servidor
      try {
        console.log('[Action] Starting action:', { beastId: beast.id, actionType, duration: action.duration });
        
        await gameApi.startBeastAction(
          beast.id,
          action.type,
          action.duration,
          action.completesAt
        );
        
        // Mensagem inline no painel (sem popup)
        console.log(`[Action] ${getRealtimeActionName(action.type)} iniciado! Tempo: ${formatTime(action.duration)}`);
        
        // Salvar estado
        await saveGame(gameState);
        
        // Atualizar UI
        gameUI?.updateGameState(gameState);
        
      } catch (error: any) {
        console.error('[Action] Failed to start action:', error);
        console.error('[Action] Beast ID:', beast.id);
        console.error('[Action] Action type:', actionType);
        console.error('[Action] Error details:', error?.message || error?.response?.data || error);
        beast.currentAction = undefined;
        showMessage(
          `Erro ao iniciar ação: ${error?.message || error?.response?.data?.error || 'Erro desconhecido'}\n\nVerifique o console para mais detalhes.`,
          '⚠️ Erro'
        );
      }
    };
    
    // Setup action complete callback (chamado automaticamente quando tempo acaba)
    gameUI.onCompleteAction = async () => {
      if (!gameState || !gameState.activeBeast) return;
      
      const beast = gameState.activeBeast;
      if (!beast.currentAction) return;
      
      // Completar ação no cliente
      const result = completeActionClient(beast, gameState);
      
      if (result.success) {
        // Mostrar mensagem inline no painel por 3 segundos
        if (gameUI) {
          gameUI.showCompletionMessage(result.message);
        }
        console.log(`[Action Complete] ${result.message}`);
        
        // Enviar para servidor
        try {
          await gameApi.completeBeastAction(beast.id);
          await saveGame(gameState);
        } catch (error) {
          console.error('[Action] Failed to complete action on server:', error);
        }
        
        // Atualizar UI
        gameUI?.updateGameState(gameState);
      }
    };
    
    // Setup action cancel callback
    gameUI.onCancelAction = async () => {
      if (!gameState || !gameState.activeBeast) return;
      
      const serverTime = gameState.serverTime || Date.now();
      const beast = gameState.activeBeast;
      
      if (!beast.currentAction) return;
      
      // Cancelar ação
      const result = cancelAction(beast, serverTime);
      
      if (result.success) {
        // Enviar para servidor
        try {
          await gameApi.cancelBeastAction(beast.id);
          
          showMessage(result.message, '❌ Ação Cancelada');
          
          // Salvar estado
          await saveGame(gameState);
          
          // Atualizar UI
          gameUI?.updateGameState(gameState);
          
        } catch (error) {
          console.error('[Action] Failed to cancel action:', error);
        }
      }
    };
    
    // Setup week advance callback (legacy - manter por compatibilidade)
    gameUI.onAdvanceWeek = async (action: WeeklyAction) => {
      if (!gameState || !gameState.activeBeast) return;

      // Check if tournament
      if (action === 'tournament') {
        startTournament();
        return;
      }

      // Execute action and advance week
      const result = advanceWeek(gameState.activeBeast, action, gameState.currentWeek || 0);
      
      // Add money if gained
      if (result.moneyGain) {
        addMoney(gameState, result.moneyGain);
      }

      // Advance game week
      advanceGameWeek(gameState);

      // Process weekly events
      const events = processWeeklyEvents(gameState);
      
      // Check if beast is still alive
      if (!isBeastAlive(gameState.activeBeast)) {
        showMessage(
          `${gameState.activeBeast.name} chegou ao fim de sua vida... 😢\n\nVocê pode criar uma nova besta no Templo dos Ecos.`,
          '💔 Fim da Jornada'
        );
      }

      // Show result message
      showMessage(result.message);
      
      // Show event messages if any
      for (const event of events) {
        showMessage(`⚡ ${event.message}`);
      }

      // Auto-save
      await saveGame(gameState);
      
      // Update UI
      if (gameUI) {
        gameUI.updateGameState(gameState);
      }

      console.log('[Game] Week advanced', result);
    };

    // Hide loading
    loadingEl.style.display = 'none';

    console.log('[Game] Guardian Grove initialized!');
  } catch (err) {
    console.error('[Game] Init failed:', err);
    errorEl.textContent = `Erro ao inicializar: ${err}`;
    errorEl.style.display = 'block';
    loadingEl.style.display = 'none';
  }
}

// ===== TEMPLE SYSTEM =====

function openTemple() {
  if (!gameState) return;

  // Verificar se já tem besta ativa e viva
  if (gameState.activeBeast && isBeastAlive(gameState.activeBeast, Date.now())) {
    showMessage(
      'Você já tem uma besta ativa! O Templo só pode ser usado quando sua besta falecer.',
      '🏛️ Templo Indisponível'
    );
    return;
  }

  // Hide 3D viewer when opening Temple
  if (gameUI) {
    gameUI.hide3DViewer();
    console.log('[Main] Temple opened - 3D viewer hidden');
  }

  // Create Temple UI
  templeUI = new TempleUI(canvas);

  // Setup callbacks
  templeUI.onCreateBeast = (beast: Beast) => {
    if (!gameState) return;

    // Check if ranch is full
    if (gameState.ranch.beasts.length >= gameState.ranch.maxBeasts) {
      showMessage('Seu rancho está cheio! Você não pode criar mais bestas.', '⚠️ Rancho Cheio');
      return;
    }

    // Add beast to ranch
    gameState.ranch.beasts.push(beast);

    // Set as active if first beast
    if (!gameState.activeBeast) {
      gameState.activeBeast = beast;
    }

    showMessage(`✨ ${beast.name} foi criado das Relíquias de Eco!`);

    // Save and return
    saveGame(gameState);
    closeTemple();
  };

  templeUI.onCancel = () => {
    closeTemple();
  };

  inTemple = true;
  
  // Música removida
}

function closeTemple() {
  templeUI = null;
  inTemple = false;
  
  // Música removida

  // Show 3D viewer when returning to ranch
  if (gameUI) {
    gameUI.show3DViewer();
    console.log('[Main] Temple closed - 3D viewer shown');
  }

  // Update main UI
  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== NPC & DIALOGUE SYSTEM =====

async function openVillage() {
  if (!gameState) return;

  inVillage = true;

  if (gameUI) {
    gameUI.hide3DViewer();
    console.log('[Main] Village opened - 3D viewer hidden');
  }

  const buildings: VillageBuildingConfig[] = VILLAGE_BLUEPRINT.map((blueprint) => {
    const npc = blueprint.npcId ? NPCS[blueprint.npcId] : undefined;
    const kind = blueprint.facilityId ? 'facility' : 'npc';

    return {
      id: blueprint.id,
      icon: blueprint.icon,
      variant: blueprint.variant,
      position: blueprint.position,
      rotation: blueprint.rotation,
      color: blueprint.color,
      label: blueprint.label,
      kind,
      npcId: blueprint.npcId,
      facilityId: blueprint.facilityId,
      isLocked: kind === 'npc' ? !(npc?.unlocked ?? false) : false,
      highlightColor: kind === 'facility' ? 0xffffff : undefined,
    } satisfies VillageBuildingConfig;
  });

  if (!village3DUI) {
    village3DUI = new Village3DUI();
    village3DUI.onOpenNPC = (npcId: string) => {
      openDialogueWith(npcId);
    };
    village3DUI.onOpenShop = () => {
      closeVillage();
      openShop();
    };
    village3DUI.onOpenTemple = () => {
      closeVillage();
      openTemple();
    };
    village3DUI.onOpenCraft = () => {
      closeVillage();
      openCraft();
    };
    village3DUI.onOpenDungeons = () => {
      closeVillage();
      openDungeon();
    };
    village3DUI.onOpenRanch = () => {
      closeVillage();
    };
    village3DUI.onClose = () => {
      closeVillage();
    };

    console.log('[Main] Village 3D UI created');
  }

  village3DUI.setBuildings(buildings);
  await village3DUI.show();
}

function closeVillage() {
  inVillage = false;
  
  if (village3DUI) {
    village3DUI.hide();
  }
  
  // Force recreation of ranch 3D scene when returning from village
  if (gameUI && gameState && gameState.activeBeast) {
    // Force cleanup and recreation by clearing the ranch scene
    gameUI.cleanupRanchScene3D();
    // Show 3D viewer will recreate it on next draw
    gameUI.show3DViewer();
    console.log('[Main] Village closed - forcing ranch 3D recreation');
  }
  
  // Update main UI
  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

function openDialogueWith(npcId: string) {
  if (!gameState) return;

  // Close village if open (dialogue can be opened from village)
  if (inVillage) {
    closeVillage();
  }

  const npc = NPCS[npcId];
  if (!npc || !npc.unlocked) {
    showMessage('NPC não disponível!', '⚠️ Erro');
    return;
  }

  console.log('[Main] Opening dialogue with', npcId, '- Hiding 3D viewer');
  
  // Hide 3D viewer when opening dialogue (Vila)
  if (gameUI) {
    gameUI.hide3DViewer();
  }
  
  console.log('[Main] inDialogue will be set to TRUE (at end of function)');

  // Create dialogue UI if not exists
  if (!dialogueUI) {
    dialogueUI = new DialogueUI(canvas);
    dialogueUI.onClose = () => {
      closeDialogue();
    };
  }

  // Track NPC interaction for quests via event system
  if (gameState) {
    emitGameEvent({ type: 'npc_talked', npcId }, gameState);
    unlockQuests(gameState.quests);
  }

  // Get greeting dialogue
  const greeting = getNPCDialogue(npcId, 'greeting');

  // Create dialogue options based on NPC
  const options = [];

  // Advice option (if available)
  if (npc.dialogues.advice && npc.dialogues.advice.length > 0) {
    options.push({
      label: '💬 Pedir conselho',
      action: () => {
        const advice = getNPCDialogue(npcId, 'advice');
        dialogueUI?.setDialogue(npc, advice, [
          {
            label: '← Voltar',
            action: () => openDialogueWith(npcId),
          },
          {
            label: '✖ Fechar',
            action: () => closeDialogue(),
          },
        ]);
        increaseAffinity(npcId, 2);
      },
    });
  }

  // Lore option (if available)
  if (npc.dialogues.lore && npc.dialogues.lore.length > 0) {
    options.push({
      label: '📜 Perguntar sobre história',
      action: () => {
        const lore = getNPCDialogue(npcId, 'lore');
        dialogueUI?.setDialogue(npc, lore, [
          {
            label: '← Voltar',
            action: () => openDialogueWith(npcId),
          },
          {
            label: '✖ Fechar',
            action: () => closeDialogue(),
          },
        ]);
        increaseAffinity(npcId, 1);
      },
    });
  }

  // Shop option (Dalan only)
  if (npcId === 'dalan' && npc.dialogues.shop) {
    options.push({
      label: '🛒 Ver loja',
      action: () => {
        closeDialogue();
        openShop();
      },
    });
  }

  // Close option
  options.push({
    label: '👋 Despedir-se',
    action: () => {
      closeDialogue();
    },
  });

  // Set dialogue
  dialogueUI.setDialogue(npc, greeting, options);
  inDialogue = true;
}

function closeDialogue() {
  console.log('[Main] Closing dialogue - Showing 3D viewer');
  inDialogue = false;
  if (dialogueUI) {
    dialogueUI.close();
  }
  dialogueUI = null;

  // Show 3D viewer when returning to ranch
  if (gameUI) {
    gameUI.show3DViewer();
  }

  // Update main UI - o canvas será limpo e redesenhado no próximo frame do render loop
  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
  
  console.log('[Main] inDialogue set to FALSE');
}

// ===== SHOP SYSTEM =====

function openShop() {
  if (!gameState) return;

  // Close village if open (shop can be opened from village)
  if (inVillage) {
    closeVillage();
  }

  // Hide 3D viewer when opening shop
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Shop UI
  shopUI = new ShopUI(canvas);

  // Setup callbacks
  shopUI.onBuyItem = (item: Item) => {
    if (!gameState) return;

    // Check if player can afford
    if (gameState.economy.coronas < item.price) {
      showMessage('Você não tem dinheiro suficiente!', '💰 Sem Dinheiro');
      return;
    }

    // Deduct money
    gameState.economy.coronas -= item.price;

    // Track spending for quests via event system
    emitGameEvent({ type: 'money_spent', amount: item.price, category: 'shop' }, gameState);

    // Add item to inventory
    const existingItem = gameState.inventory.find(i => i.id === item.id);
    if (existingItem && existingItem.quantity !== undefined) {
      existingItem.quantity += 1;
    } else {
      gameState.inventory.push({ ...item, quantity: 1 });
    }

    // Show message
    showMessage(`✅ ${item.name} comprado por ${item.price} Coronas!`);

    // Increase affinity with Dalan
    increaseAffinity('dalan', 2);

    // Check for completed quests
    const completedQuests = getCompletedQuests(gameState.quests);
    if (completedQuests.length > 0) {
      showMessage(`🎯 ${completedQuests.length} quest(s) completada(s)!`);
    }

    // Save game
    saveGame(gameState);

    // Update shop UI
    if (shopUI) {
      shopUI.draw(gameState);
    }
  };

  shopUI.onClose = () => {
    closeShop();
  };

  inShop = true;
}

function closeShop() {
  if (shopUI) {
    shopUI.close();
  }
  shopUI = null;
  inShop = false;

  // Show 3D viewer when returning to ranch
  if (gameUI) {
    gameUI.show3DViewer();
  }

  // Update main UI - o canvas será limpo e redesenhado no próximo frame do render loop
  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== INVENTORY SYSTEM =====

function openInventory() {
  if (!gameState) return;

  // Close other UIs
  if (inShop) closeShop();
  if (inCraft) closeCraft();
  if (inQuests) closeQuests();
  if (inAchievements) closeAchievements();
  if (inDungeon) closeDungeon();
  if (inExploration) closeExploration();

  // Hide 3D viewer when opening inventory
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Inventory UI
  inventoryUI = new InventoryUI(canvas);

  // Setup callbacks
  inventoryUI.onUseItem = async (item: Item) => {
    if (!gameState || !gameState.activeBeast) return;

    // Use the item
    const result = useItem(gameState, item, gameState.activeBeast);

    if (result.success) {
      // NOVO: Não mostrar popup, apenas log
      console.log('[Inventory] ✅', result.message);

      // Log de mudanças
      if (result.changes) {
        const changes = [];
        if (result.changes.fatigue) changes.push(`Fadiga ${result.changes.fatigue > 0 ? '+' : ''}${result.changes.fatigue}`);
        if (result.changes.stress) changes.push(`Stress ${result.changes.stress > 0 ? '+' : ''}${result.changes.stress}`);
        if (result.changes.hp) changes.push(`HP ${result.changes.hp > 0 ? '+' : ''}${result.changes.hp}`);
        if (result.changes.essence) changes.push(`Essência ${result.changes.essence > 0 ? '+' : ''}${result.changes.essence}`);
        if (result.changes.mood) changes.push(`Humor: ${result.changes.mood}`);

        if (changes.length > 0) {
          console.log('[Inventory] 📊 Mudanças:', changes.join(', '));
        }
      }

      // NOVO: Remover item do servidor também
      try {
        await gameApi.removeInventoryItem(item.id, 1);
        console.log(`[Inventory] Removed 1x ${item.id} from server`);
      } catch (error) {
        console.error('[Inventory] Failed to remove item from server:', error);
      }

      // Save game
      saveGame(gameState);

      // Update inventory UI
      if (inventoryUI) {
        inventoryUI.draw(gameState);
      }

      // Update main UI
      if (gameUI) {
        gameUI.updateGameState(gameState);
      }
    } else {
      // Apenas erros mostram popup
      console.error('[Inventory] ❌', result.message);
      showMessage(`❌ ${result.message}`, '⚠️ Erro');
    }
  };

  inventoryUI.onShowConfirmation = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    modalUI.show({
      type: 'choice',
      title,
      message,
      choices: ['Confirmar', 'Cancelar'],
      onConfirm: () => {
        onConfirm();
      },
      onCancel: onCancel || (() => {}),
    });
  };

  inventoryUI.onClose = () => {
    closeInventory();
  };

  inInventory = true;
}

function closeInventory() {
  if (inventoryUI) {
    inventoryUI.close();
  }
  inventoryUI = null;
  inInventory = false;

  // Show 3D viewer when returning to ranch
  if (gameUI) {
    gameUI.show3DViewer();
  }

  // Update main UI - o canvas será limpo e redesenhado no próximo frame do render loop
  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== STATUS SYSTEM =====

function openStatus() {
  if (!gameState) return;

  // Close village if open
  if (inVillage) {
    closeVillage();
  }

  // Hide 3D viewer when opening status
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Status UI
  statusUI = new StatusUI(canvas);

  // Setup callback
  statusUI.onClose = () => {
    closeStatus();
  };

  inStatus = true;
}

function closeStatus() {
  if (statusUI) {
    statusUI.close();
  }
  statusUI = null;
  inStatus = false;

  // Show 3D viewer when returning to ranch
  if (gameUI) {
    gameUI.show3DViewer();
  }

  // Update main UI
  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== CRAFT SYSTEM =====

function openCraft() {
  if (!gameState) return;

  // Close other UIs
  if (inShop) closeShop();
  if (inInventory) closeInventory();
  if (inQuests) closeQuests();
  if (inAchievements) closeAchievements();
  if (inDungeon) closeDungeon();
  if (inExploration) closeExploration();

  // Hide 3D viewer when opening craft
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Craft UI
  craftUI = new CraftUI(canvas);

  // Setup callbacks
  craftUI.onCraftItem = async (recipe) => {
    if (!gameState) return;

    const result = executeCraft(recipe, gameState.inventory);

    if (result.success && result.result) {
      // Salvar no servidor: remover ingredientes e adicionar resultado
      try {
        // Remover ingredientes consumidos do servidor
        for (const ingredient of recipe.ingredients) {
          await gameApi.removeInventoryItem(ingredient.itemId, ingredient.quantity);
          console.log(`[Craft] Removed ${ingredient.quantity}x ${ingredient.itemId} from server`);
        }
        
        // Adicionar item craftado ao servidor
        await gameApi.addInventoryItem(result.result.id, result.result.quantity || 1);
        console.log(`[Craft] Added ${result.result.quantity}x ${result.result.id} to server`);
        
      } catch (error) {
        console.error('[Craft] Failed to sync with server:', error);
        showMessage('⚠️ Erro ao salvar craft no servidor, mas item foi criado localmente.', '⚠️ Aviso');
      }
      
      // Add result to inventory (local)
      const existingItem = gameState.inventory.find(i => i.id === result.result!.id);
      if (existingItem && existingItem.quantity) {
        existingItem.quantity += result.result.quantity || 1;
      } else {
        const item = getItemById(result.result.id);
        if (item) {
          gameState.inventory.push({ ...item, quantity: result.result.quantity || 1 });
        }
      }

      // Emitir evento de craft para quests/achievements
      emitItemCrafted(gameState, recipe.id, result.result.id);

      // NOVO: Não mostrar popup, apenas log
      console.log('[Craft] ✅', result.message, '- Item salvo no inventário!');

      // Save game
      saveGame(gameState);

      // Update craft UI
      if (craftUI) {
        craftUI.draw(gameState);
      }

      // Update main UI
      if (gameUI) {
        gameUI.updateGameState(gameState);
      }
    } else {
      showMessage(result.message, '⚠️ Craft');
    }
  };

  craftUI.onClose = () => {
    closeCraft();
  };

  inCraft = true;
}

function closeCraft() {
  if (craftUI) {
    craftUI.close();
  }
  craftUI = null;
  inCraft = false;

  // Show 3D viewer when returning to ranch
  if (gameUI) {
    gameUI.show3DViewer();
  }

  // Update main UI - o canvas será limpo e redesenhado no próximo frame do render loop
  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

function openArenaPvp() {
  closeAllOverlays();

  showMessage(
    'O modo Arena PvP está em desenvolvimento. Em breve você poderá desafiar outros guardiões em batalhas estratégicas!',
    '🥊 Arena PvP',
  );
}

// ===== QUESTS SYSTEM =====

function openQuests() {
  if (!gameState) return;

  // Close other UIs
  if (inShop) closeShop();
  if (inInventory) closeInventory();
  if (inCraft) closeCraft();
  if (inDungeon) closeDungeon(); // Fechar dungeons também

  // Hide 3D viewer when opening quests
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Quests UI
  questsUI = new QuestsUI(canvas);

  // Setup callbacks
  questsUI.onClaimReward = (quest) => {
    if (!gameState) return;

    // Add rewards to game state
    if (quest.rewards.coronas) {
      gameState.economy.coronas += quest.rewards.coronas;
    }

    if (quest.rewards.items) {
      quest.rewards.items.forEach(reward => {
        import('./data/shop').then(({ getItemById }) => {
          const item = getItemById(reward.itemId);
          if (item) {
            const existingItem = gameState!.inventory.find(i => i.id === reward.itemId);
            if (existingItem && existingItem.quantity) {
              existingItem.quantity += reward.quantity;
            } else {
              gameState!.inventory.push({ ...item, quantity: reward.quantity });
            }
          }
        });
      });
    }

    // Remove quest from list
    const questIndex = gameState.quests.findIndex(q => q.id === quest.id);
    if (questIndex !== -1) {
      gameState.quests.splice(questIndex, 1);
    }

    showMessage(`🎁 Recompensas coletadas! +${quest.rewards.coronas || 0}💰`);

    // Save game
    saveGame(gameState);

    // Update quests UI
    if (questsUI) {
      questsUI.draw(gameState);
    }

    // Update main UI
    if (gameUI) {
      gameUI.updateGameState(gameState);
    }
  };

  questsUI.onClose = () => {
    closeQuests();
  };

  inQuests = true;
}

function closeQuests() {
  if (questsUI) {
    questsUI.close();
  }
  questsUI = null;
  inQuests = false;

  // Show 3D viewer when returning to ranch
  if (gameUI) {
    gameUI.show3DViewer();
  }

  // Update main UI - o canvas será limpo e redesenhado no próximo frame do render loop
  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== DUNGEON SYSTEM =====

function openDungeon() {
  if (!gameState || !gameState.activeBeast) {
    showMessage('Você precisa de uma besta ativa para acessar dungeons!', '⚠️ Sem Besta');
    return;
  }

  // VALIDAÇÃO: Verificar se a beast está viva
  if (gameState.activeBeast.currentHp <= 0) {
    showMessage(
      '❌ Sua Beast está inconsciente!\n\n' +
      `HP atual: 0/${gameState.activeBeast.maxHp}\n\n` +
      'Descanse para recuperar HP antes de acessar dungeons.',
      '⚠️ Beast Inconsciente'
    );
    return;
  }

  // Close other UIs (igual exploração)
  if (inShop) closeShop();
  if (inInventory) closeInventory();
  if (inCraft) closeCraft();
  if (inQuests) closeQuests();
  if (inAchievements) closeAchievements();
  if (inExploration) closeExploration();

  // Hide 3D viewer when opening dungeon
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Dungeon UI
  dungeonUI = new DungeonUI(canvas);

  // Setup callbacks
  dungeonUI.onEnterDungeon = (dungeonId: string, floor: number) => {
    if (!gameState) return;
    
    startDungeonBattle(dungeonId, floor);
  };

  dungeonUI.onClose = () => {
    closeDungeon();
  };

  inDungeon = true;
  
  console.log('[Dungeon] Dungeon UI opened');
}

function closeDungeon() {
  if (dungeonUI) {
    dungeonUI.close();
  }
  dungeonUI = null;
  inDungeon = false;
  isDungeonBattle = false; // Limpar flag de batalha de dungeon

  // Show 3D viewer when returning to ranch
  if (gameUI) {
    gameUI.show3DViewer();
  }

  // Update main UI - o canvas será limpo e redesenhado no próximo frame do render loop
  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
  
  console.log('[Dungeon] Dungeon UI closed');
}

function startDungeonBattle(dungeonId: string, floor: number) {
  if (!gameState || !gameState.activeBeast) {
    showMessage('Você precisa de uma besta ativa para entrar na dungeon!', '⚠️ Sem Besta');
    return;
  }

  const beast = gameState.activeBeast;
  
  // VALIDAÇÃO CRÍTICA: Verificar se a beast está viva PRIMEIRO (igual exploração)
  if (beast.currentHp <= 0) {
    showMessage(
      '❌ Sua Beast está inconsciente!\n\n' +
      `HP atual: 0/${beast.maxHp}\n\n` +
      'Descanse para recuperar HP antes de entrar em dungeons.',
      '⚠️ Beast Inconsciente'
    );
    console.error('[Dungeon] Cannot enter dungeon with 0 HP!');
    return;
  }

  // VALIDAÇÃO: Avisar se HP está muito baixo (igual exploração)
  const currentHpPercent = (beast.currentHp / beast.maxHp) * 100;
  if (currentHpPercent < 20) {
    if (!confirm(`⚠️ AVISO: Sua Beast está com apenas ${beast.currentHp}/${beast.maxHp} HP (${Math.floor(currentHpPercent)}%)!\n\nEntrar em dungeons com HP baixo é muito perigoso. Deseja continuar?`)) {
      return;
    }
  }

  const dungeon = getDungeonById(dungeonId);
  if (!dungeon) {
    showMessage('Dungeon não encontrada!', '⚠️ Erro');
    return;
  }

  const dungeonFloor = dungeon.floors[floor - 1];
  if (!dungeonFloor) {
    showMessage('Andar não encontrado!', '⚠️ Erro');
    return;
  }

  // Verificar fadiga (custo da dungeon)
  const fatigueCost = calculateFatigueCost(floor);
  const currentFatigue = beast.secondaryStats.fatigue;
  const fatigueAfter = currentFatigue + fatigueCost;
  
  if (fatigueAfter > 100) {
    showMessage(
      `😓 Sua Beast está muito cansada!\n\n` +
      `Fadiga atual: ${currentFatigue}/100\n` +
      `Custo do andar ${floor}: +${fatigueCost}\n` +
      `Total após: ${fatigueAfter}/100\n\n` +
      `Descanse antes de entrar na dungeon.`,
      '⚠️ Beast Cansada'
    );
    return;
  }

  // Verificar se o andar já foi limpo
  const progress = gameState.dungeonProgress[dungeonId];
  if (progress && progress.clearedFloors.includes(floor)) {
    showMessage(
      `Este andar já foi completado!\n\n` +
      `Escolha um andar diferente ou outra dungeon.`,
      '✅ Andar Completo'
    );
    return;
  }

    // Escolher inimigo aleatório do andar (ou boss se for o último)
    let enemy: DungeonEnemy | DungeonBoss;
    if (dungeonFloor.boss) {
      enemy = dungeonFloor.boss;
    } else {
      enemy = dungeonFloor.enemies[Math.floor(Math.random() * dungeonFloor.enemies.length)];
    }

    // Criar Beast do inimigo
    const enemyBeast: Beast = {
      id: `dungeon_enemy_${Date.now()}`,
      name: enemy.name,
      line: enemy.line as any,
      blood: 'common',
      affinity: 'normal' as any,
      attributes: enemy.stats,
      secondaryStats: {
        fatigue: 0,
        stress: 0,
        loyalty: 100,
        age: 0,
        maxAge: 365,
      },
      traits: [],
      mood: 'neutral',
      techniques: getStartingTechniques(enemy.line as any),
      currentHp: enemy.stats.vitality * 5 + enemy.level * 10,
      maxHp: enemy.stats.vitality * 5 + enemy.level * 10,
      essence: 30 + enemy.level * 5,
      maxEssence: 30 + enemy.level * 5,
      birthWeek: 0,
      lifeEvents: [],
      victories: 0,
      defeats: 0,
      level: enemy.level,
    };

  // PROTEÇÃO: Prevenir múltiplas batalhas simultâneas (igual exploração)
  if (inBattle || isDungeonBattle) {
    console.error('[Dungeon] Already in battle! Ignoring new battle start');
    showMessage('Você já está em batalha!', '⚠️ Batalha em Andamento');
    return;
  }

  // APLICAR FADIGA ANTES DE INICIAR BATALHA
  beast.secondaryStats.fatigue += fatigueCost;
  console.log(`[Dungeon] Entering floor ${floor}, fatigue: ${currentFatigue} -> ${beast.secondaryStats.fatigue} (+${fatigueCost})`);
  
  // Salvar imediatamente
  saveGame(gameState);

  // Marcar como batalha de dungeon
  isDungeonBattle = true;

  // Fechar dungeon UI (SEM mostrar Ranch 3D)
  if (dungeonUI) {
    dungeonUI.close();
  }
  dungeonUI = null;
  inDungeon = false;
  console.log('[Dungeon] Dungeon UI closed for battle (Ranch 3D NOT shown)');
  
  // GARANTIR que Ranch 3D está escondida antes da batalha
  if (gameUI) {
    gameUI.hide3DViewer();
    console.log('[Dungeon] Ranch Scene 3D hidden before battle');
  }

  // Iniciar batalha
  const battle = initiateBattle(gameState.activeBeast, enemyBeast, false);
  battle.phase = 'player_turn';

  gameState.currentBattle = battle;

  // Create battle UI (HÍBRIDO, 3D completo, ou 2D clássico)
  if (useHybridBattle) {
    console.log('[Battle] 🎨 Using HYBRID Battle System (2D UI + 3D Arena)');
    battleUI = new BattleUIHybrid(canvas, battle);
    
    // Setup HYBRID callbacks (mesma interface do 2D)
    (battleUI as BattleUIHybrid).onPlayerAction = (action: CombatAction) => {
      if (!gameState?.currentBattle) return;

      const result = executePlayerAction(gameState.currentBattle, action);

      if (result && battleUI) {
        (battleUI as BattleUIHybrid).updateBattle(gameState.currentBattle);

        if (gameState.currentBattle.winner) {
          (battleUI as BattleUIHybrid).onBattleEnd();
          return;
        }

        if (gameState.currentBattle.phase === 'enemy_turn') {
          setTimeout(() => {
            if (!gameState?.currentBattle || !battleUI) return;

            executeEnemyTurn(gameState.currentBattle);
            (battleUI as BattleUIHybrid).updateBattle(gameState.currentBattle);

            if (gameState.currentBattle.winner) {
              (battleUI as BattleUIHybrid).onBattleEnd();
              return;
            }

            if (gameState.currentBattle.phase === 'player_turn') {
              setTimeout(() => {
                if (battleUI) {
                  (battleUI as BattleUIHybrid).checkAutoBattle();
                }
              }, 500);
            }
          }, 1500);
        }
      }
    };

    (battleUI as BattleUIHybrid).onBattleEnd = () => {
      if (!gameState?.currentBattle) return;

      const battle = gameState.currentBattle;
      
      console.log('[Dungeon Battle] Battle ended - Phase:', battle.phase);
      
      // PROTEÇÃO: Verificar fase
      if (battle.phase !== 'victory' && battle.phase !== 'defeat' && battle.phase !== 'fled') {
        console.error('[Dungeon Battle] ❌ onBattleEnd called but phase is:', battle.phase);
        return;
      }

      if (battle.phase === 'victory') {
        // Vitória em dungeon
        gameState.victories++;
        if (gameState.activeBeast) {
          gameState.activeBeast.victories++;
          // Atualizar HP e Essência após vitória
          gameState.activeBeast.currentHp = battle.player.currentHp;
          gameState.activeBeast.essence = battle.player.currentEssence;
          console.log('[Dungeon Battle] Beast HP after victory:', gameState.activeBeast.currentHp);
        }

        // IMPORTANTE: Fechar batalha IMEDIATAMENTE (não esperar modal)
        closeBattle();
        
        showMessage(
          '🏆 Vitória! Seu beast venceu a batalha no andar da dungeon!',
          '✨ Dungeon',
          async () => {
            await saveGame(gameState!);
            openDungeon();
          }
        );
      } else if (battle.phase === 'defeat') {
        // Derrota em dungeon
        if (gameState.activeBeast) {
          gameState.activeBeast.defeats++;
          // Atualizar HP após derrota
          gameState.activeBeast.currentHp = Math.max(1, battle.player.currentHp);
          gameState.activeBeast.essence = battle.player.currentEssence;
          console.log('[Dungeon Battle] Beast HP after defeat:', gameState.activeBeast.currentHp);
        }

        // IMPORTANTE: Fechar batalha IMEDIATAMENTE (não esperar modal)
        closeBattle();
        
        showMessage(
          '💀 Seu beast foi derrotado na dungeon. Você foi expulso.',
          '☠️ Derrota',
          async () => {
            closeDungeon(); // Fechar dungeon no callback do modal
            await saveGame(gameState!);
            
            // Mostrar Ranch 3D
            if (gameUI) {
              gameUI.show3DViewer();
            }
          }
        );
      } else if (battle.phase === 'fled') {
        // Fugiu
        showMessage(
          '🏃 Você fugiu da batalha!',
          '⚠️ Fuga',
          () => {
            closeBattle();
            openDungeon();
          }
        );
      }
    };
  } else if (use3DBattle) {
    console.log('[Battle] 🎮 Using 3D Immersive Battle System');
    battleUI = new BattleUI3D(canvas, battle);
    
    // Setup 3D callbacks
    (battleUI as BattleUI3D).onActionSelected = (action: CombatAction) => {
      if (!gameState?.currentBattle) return;

      const result = executePlayerAction(gameState.currentBattle, action);

      if (result && battleUI) {
        (battleUI as BattleUI3D).updateBattle(gameState.currentBattle);

        if (gameState.currentBattle.phase === 'enemy_turn') {
          setTimeout(() => {
            if (!gameState?.currentBattle) return;
            executeEnemyTurn(gameState.currentBattle);
            if (battleUI) {
              (battleUI as BattleUI3D).updateBattle(gameState.currentBattle);
            }
          }, 1000);
        }
      }
    };
    
    (battleUI as BattleUI3D).onBattleEnd = async (winner: 'player' | 'enemy') => {
      if (!gameState?.currentBattle) return;

      inBattle = false;
      isDungeonBattle = false;

      if (winner === 'player') {
        gameState.victories++;
        if (gameState.activeBeast) gameState.activeBeast.victories++;
        
        emitBattleWon(gameState);
        unlockQuests(gameState.quests);

        await saveGame(gameState);

        showMessage(
          '🏆 Vitória! Seu beast venceu a batalha no andar da dungeon!',
          '✨ Dungeon',
          () => {
            closeBattle();
            openDungeon();
          }
        );
      } else {
        if (gameState.activeBeast) gameState.activeBeast.defeats++;

        await saveGame(gameState);

        showMessage(
          '💀 Seu beast foi derrotado na dungeon. Você foi expulso.',
          '☠️ Derrota',
          () => {
            closeBattle();
          }
        );
      }
    };
  } else {
    console.log('[Battle] 📺 Using 2D Classic Battle System');
    battleUI = new BattleUI(canvas, battle);
    
    // Setup 2D callbacks (original)
    battleUI.onPlayerAction = (action: CombatAction) => {
      if (!gameState?.currentBattle) return;

      const result = executePlayerAction(gameState.currentBattle, action);

      if (result && battleUI) {
        battleUI.updateBattle(gameState.currentBattle);

        if (gameState.currentBattle.winner) {
          battleUI.onBattleEnd();
          return;
        }

        if (gameState.currentBattle.phase === 'enemy_turn') {
          setTimeout(() => {
            if (!gameState?.currentBattle || !battleUI) return;

            executeEnemyTurn(gameState.currentBattle);
            battleUI.updateBattle(gameState.currentBattle);

            if (gameState.currentBattle.winner) {
              battleUI.onBattleEnd();
              return;
            }

            if (gameState.currentBattle.phase === 'player_turn') {
              setTimeout(() => {
                if (battleUI) {
                  battleUI.checkAutoBattle();
                }
              }, 500);
            }
          }, 1500);
        }
      }
    };

    battleUI.onBattleEnd = () => {
      if (!gameState?.currentBattle) return;

      const battle = gameState.currentBattle;

      if (battle.winner === 'player') {
        // Vitória!
        gameState.victories++;
        gameState.activeBeast!.victories++;

        // Atualizar progresso do dungeon
        if (!gameState.dungeonProgress[dungeonId]) {
          gameState.dungeonProgress[dungeonId] = {
            currentFloor: 1,
            completed: false,
            clearedFloors: [],
            firstClearClaimed: false,
          };
        }

        const progress = gameState.dungeonProgress[dungeonId];
        if (!progress.clearedFloors.includes(floor)) {
          progress.clearedFloors.push(floor);
        }

        // Desbloquear próximo andar
        if (floor === progress.currentFloor && floor < 5) {
          progress.currentFloor = floor + 1;
        }

        // Completar dungeon se for andar 5
        if (floor === 5) {
          progress.completed = true;
        }

        // Dar recompensas
        const reward = dungeon.rewards.completionRewards;
        gameState.economy.coronas += reward.coronas;
        if (gameState.activeBeast && reward.experience) {
          gameState.activeBeast.experience = (gameState.activeBeast.experience || 0) + reward.experience;
        }

        // Bonus de primeira vez
        if (!progress.firstClearClaimed && progress.completed) {
          progress.firstClearClaimed = true;
          gameState.economy.coronas += dungeon.rewards.firstClearBonus.coronas;
          
          showMessage(
            `🎉 DUNGEON COMPLETADA!\n\n` +
            `Recompensa: +${reward.coronas}💰 +${reward.experience} XP\n` +
            `Bônus de Primeira Vez: +${dungeon.rewards.firstClearBonus.coronas}💰`,
            '🏆 Vitória'
          );
        } else {
          showMessage(
            `Andar ${floor} completo!\n+${reward.coronas}💰 +${reward.experience} XP`,
            '⚔️ Vitória'
          );
        }

        emitBattleWon(gameState);
        unlockQuests(gameState.quests);

      } else if (battle.winner === 'enemy') {
        gameState.defeats++;
        gameState.activeBeast!.defeats++;

        showMessage('Você foi derrotado!', '💀 Derrota');
      }

      // Update beast HP/Essence
      if (gameState.activeBeast) {
        gameState.activeBeast.currentHp = battle.player.currentHp;
        gameState.activeBeast.essence = battle.player.currentEssence;
      }

      // Clear battle
      gameState.currentBattle = undefined;
      if (battleUI) {
        battleUI.dispose();
      }
      battleUI = null;
      inBattle = false;
      isDungeonBattle = false; // LIMPAR FLAG de batalha de dungeon

      // Save game
      saveGame(gameState);

      // Update UI
      if (gameUI) {
        gameUI.show3DViewer();
        gameUI.updateGameState(gameState);
      }
    };
  } // Fecha o bloco else (2D Battle System)

  inBattle = true;
}

// ===== ACHIEVEMENTS SYSTEM =====

function openAchievements() {
  if (!gameState) return;

  // Close other UIs
  if (inShop) closeShop();
  if (inInventory) closeInventory();
  if (inCraft) closeCraft();
  if (inQuests) closeQuests();
  if (inDungeon) closeDungeon();
  if (inExploration) closeExploration();

  // Hide 3D viewer when opening achievements
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Achievements UI
  achievementsUI = new AchievementsUI(canvas);

  // Setup callbacks
  achievementsUI.onClose = () => {
    closeAchievements();
  };

  inAchievements = true;
}

function closeAchievements() {
  if (achievementsUI) {
    achievementsUI.close();
  }
  achievementsUI = null;
  inAchievements = false;

  // Show 3D viewer when returning to ranch
  if (gameUI) {
    gameUI.show3DViewer();
  }

  // Update main UI - o canvas será limpo e redesenhado no próximo frame do render loop
  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== ACHIEVEMENTS CANVAS SYSTEM (NEW) =====

function openAchievementsCanvas() {
  if (!gameState) return;

  // Close other UIs
  if (inShop) closeShop();
  if (inInventory) closeInventory();
  if (inCraft) closeCraft();
  if (inQuests) closeQuests();
  if (inStatus) closeStatus();
  if (inLeaderboardCanvas) closeLeaderboardCanvas();
  if (inDailySpinCanvas) closeDailySpinCanvas();

  // Hide 3D viewer
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Achievements UI Canvas
  achievementsUICanvas = new AchievementsUICanvas(canvas);

  achievementsUICanvas.onClose = () => {
    closeAchievementsCanvas();
  };

  inAchievementsCanvas = true;
}

function closeAchievementsCanvas() {
  if (achievementsUICanvas) {
    achievementsUICanvas.close();
  }
  achievementsUICanvas = null;
  inAchievementsCanvas = false;

  if (gameUI) {
    gameUI.show3DViewer();
  }

  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== LEADERBOARD CANVAS SYSTEM (NEW) =====

function openLeaderboardCanvas() {
  if (!gameState) return;

  // Close other UIs
  if (inShop) closeShop();
  if (inInventory) closeInventory();
  if (inCraft) closeCraft();
  if (inQuests) closeQuests();
  if (inStatus) closeStatus();
  if (inAchievementsCanvas) closeAchievementsCanvas();
  if (inDailySpinCanvas) closeDailySpinCanvas();

  // Hide 3D viewer
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Leaderboard UI Canvas
  leaderboardUICanvas = new LeaderboardUICanvas(canvas);

  leaderboardUICanvas.onClose = () => {
    closeLeaderboardCanvas();
  };

  inLeaderboardCanvas = true;
}

function closeLeaderboardCanvas() {
  if (leaderboardUICanvas) {
    leaderboardUICanvas.close();
  }
  leaderboardUICanvas = null;
  inLeaderboardCanvas = false;

  if (gameUI) {
    gameUI.show3DViewer();
  }

  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== DAILY SPIN CANVAS SYSTEM (NEW) =====

function openDailySpinCanvas() {
  if (!gameState) return;

  // Close other UIs
  if (inShop) closeShop();
  if (inInventory) closeInventory();
  if (inCraft) closeCraft();
  if (inQuests) closeQuests();
  if (inStatus) closeStatus();
  if (inAchievementsCanvas) closeAchievementsCanvas();
  if (inLeaderboardCanvas) closeLeaderboardCanvas();

  // Hide 3D viewer
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Daily Spin UI Canvas
  dailySpinUICanvas = new DailySpinUICanvas(canvas);

  dailySpinUICanvas.onClose = () => {
    closeDailySpinCanvas();
  };

  dailySpinUICanvas.onRewardClaimed = (reward) => {
    console.log('[SPIN] 🎁 Recompensa recebida:', reward.name);
    
    // Adicionar recompensa ao gameState
    if (reward.type === 'coronas') {
      gameState!.economy.coronas += Number(reward.value);
    } else if (reward.type === 'xp' && gameState!.activeBeast) {
      gameState!.activeBeast.xp = (gameState!.activeBeast.xp || 0) + Number(reward.value);
    }
    
    // TODO: Adicionar itens ao inventário
  };

  inDailySpinCanvas = true;
}

function closeDailySpinCanvas() {
  if (dailySpinUICanvas) {
    dailySpinUICanvas.close();
  }
  dailySpinUICanvas = null;
  inDailySpinCanvas = false;

  if (gameUI) {
    gameUI.show3DViewer();
  }

  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== MINIGAMES SYSTEM =====

function openMinigamesMenu() {
  if (!gameState) return;

  // Close other UIs
  if (inShop) closeShop();
  if (inInventory) closeInventory();
  if (inCraft) closeCraft();
  if (inQuests) closeQuests();
  if (inStatus) closeStatus();
  if (inAchievementsCanvas) closeAchievementsCanvas();
  if (inLeaderboardCanvas) closeLeaderboardCanvas();
  if (inDailySpinCanvas) closeDailySpinCanvas();

  // Hide 3D viewer
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Minigames Menu UI
  minigamesMenuUI = new MinigamesMenuUI(canvas);

  minigamesMenuUI.onClose = () => {
    closeMinigamesMenu();
  };

  minigamesMenuUI.onSelectGame = (gameType: MinigameType) => {
    console.log('[MINIGAMES] 🎮 Iniciando jogo:', gameType);
    closeMinigamesMenu();
    
    if (gameType === 'memory') {
      openMemoryGame();
    }
    // Outros jogos serão implementados aqui
  };

  inMinigamesMenu = true;
}

function closeMinigamesMenu() {
  if (minigamesMenuUI) {
    minigamesMenuUI.close();
  }
  minigamesMenuUI = null;
  inMinigamesMenu = false;

  if (gameUI) {
    gameUI.show3DViewer();
  }

  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

function openMemoryGame(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
  if (!gameState) return;

  // Hide 3D viewer
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Memory Game UI
  memoryGameUI = new MemoryGameUI(canvas, difficulty);

  memoryGameUI.onClose = () => {
    closeMemoryGame();
  };

  memoryGameUI.onComplete = (reward: any) => {
    console.log('[MEMORY] 🎉 Jogo completo! Aplicando recompensas:', reward);
    
    // Aplicar recompensas ao gameState
    if (gameState) {
      gameState.economy.coronas += reward.coronas;
      if (gameState.activeBeast) {
        gameState.activeBeast.xp = (gameState.activeBeast.xp || 0) + reward.xp;
      }
      
      // Aplicar virtudes
      if (reward.virtueGain) {
        // TODO: Implementar sistema de virtudes no gameState
        console.log('[MEMORY] 🌿 Virtudes ganhas:', reward.virtueGain);
      }
      
      // Processar conquistas
      if (reward.gameData) {
        const { timeElapsed, moves, difficulty } = reward.gameData;
        
        // Conquista: Primeira vitória
        checkAndUnlockAchievement('memory_first_win');
        
        // Conquista: Velocidade (< 30s)
        if (timeElapsed < 30) {
          checkAndUnlockAchievement('memory_speed_master');
        }
        
        // Conquista: Perfeito (< 20 movimentos no difícil)
        if (difficulty === 'hard' && moves < 20) {
          checkAndUnlockAchievement('memory_perfect');
        }
        
        // Conquistas: Jogos jogados
        checkAndUnlockAchievement('minigame_veteran');
        checkAndUnlockAchievement('minigame_master');
      }
      
      // Processar missões diárias
      progressDailyQuest('daily_memory_game');
      progressDailyQuest('daily_minigames');
      progressDailyQuest('weekly_minigames_10');
    }
    
    // Volta ao menu após 3 segundos
    setTimeout(() => {
      closeMemoryGame();
      openMinigamesMenu();
    }, 3000);
  };

  inMemoryGame = true;
}

function closeMemoryGame() {
  if (memoryGameUI) {
    memoryGameUI.close();
  }
  memoryGameUI = null;
  inMemoryGame = false;

  if (gameUI) {
    gameUI.show3DViewer();
  }

  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== SETTINGS SYSTEM =====

function openSettings() {
  if (!gameState) return;

  // Close other UIs
  if (inShop) closeShop();
  if (inInventory) closeInventory();
  if (inCraft) closeCraft();
  if (inQuests) closeQuests();
  if (inStatus) closeStatus();
  if (inAchievementsCanvas) closeAchievementsCanvas();
  if (inLeaderboardCanvas) closeLeaderboardCanvas();
  if (inDailySpinCanvas) closeDailySpinCanvas();
  if (inMinigamesMenu) closeMinigamesMenu();

  // Hide 3D viewer
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Settings UI
  settingsUI = new SettingsUI(canvas);

  settingsUI.onClose = () => {
    closeSettings();
  };

  settingsUI.onApply = (settings: SettingsData) => {
    console.log('[SETTINGS] ✅ Aplicando configurações:', settings);
    
    // Aplicar configurações ao jogo
    // TODO: Implementar aplicação de qualidade gráfica, FPS, ciclo dia/noite
    
    // Salvar no localStorage
    localStorage.setItem('guardian_grove_settings', JSON.stringify(settings));
  };

  inSettings = true;
}

function closeSettings() {
  if (settingsUI) {
    settingsUI.close();
  }
  settingsUI = null;
  inSettings = false;

  if (gameUI) {
    gameUI.show3DViewer();
  }
}

function openHelp() {
  if (!gameState) return;

  // Close other UIs
  if (inShop) closeShop();
  if (inInventory) closeInventory();
  if (inCraft) closeCraft();
  if (inQuests) closeQuests();
  if (inStatus) closeStatus();
  if (inAchievementsCanvas) closeAchievementsCanvas();
  if (inLeaderboardCanvas) closeLeaderboardCanvas();
  if (inDailySpinCanvas) closeDailySpinCanvas();
  if (inMinigamesMenu) closeMinigamesMenu();
  if (inSettings) closeSettings();

  inHelp = true;

  if (!canvas) return;
  
  helpUI = new HelpUI(canvas);
  helpUI.onClose = () => {
    closeHelp();
  };

  if (gameUI) {
    gameUI.hide3DViewer();
  }
}

function closeHelp() {
  if (helpUI) {
    helpUI.dispose();
  }
  helpUI = null;
  inHelp = false;

  if (gameUI) {
    gameUI.show3DViewer();
  }

  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== SKIN SYSTEM =====

function openCharacterSelect() {
  console.log('[CHARACTER SELECT] 🎭 Abrindo seleção de personagem...');
  
  characterSelectUI = new CharacterSelectUI(canvas);
  
  characterSelectUI.onSelect = (skinId: string) => {
    console.log(`[CHARACTER SELECT] ✅ Personagem selecionado: ${skinId}`);
    closeCharacterSelect();
    
    // TODO: Sincronizar com servidor
  };
  
  inCharacterSelect = true;
}

function closeCharacterSelect() {
  if (characterSelectUI) {
    characterSelectUI.dispose();
  }
  characterSelectUI = null;
  inCharacterSelect = false;
}

function openSkinShop() {
  if (!gameState) return;

  // Close other UIs
  if (inShop) closeShop();
  if (inInventory) closeInventory();
  if (inCraft) closeCraft();
  if (inQuests) closeQuests();
  if (inStatus) closeStatus();
  if (inAchievementsCanvas) closeAchievementsCanvas();
  if (inLeaderboardCanvas) closeLeaderboardCanvas();
  if (inDailySpinCanvas) closeDailySpinCanvas();
  if (inMinigamesMenu) closeMinigamesMenu();
  if (inSettings) closeSettings();
  if (inSkinManager) closeSkinManager();

  // Hide 3D viewer
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Skin Shop UI
  skinShopUI = new SkinShopUI(canvas);

  skinShopUI.onClose = () => {
    closeSkinShop();
  };

  skinShopUI.onPurchase = async (skinId: string, price: number) => {
    if (!gameState) return;
    
    console.log(`[SKIN SHOP] 🛒 Tentando comprar skin: ${skinId} por ${price} Coronas`);
    
    try {
      // Comprar skin via API
      const response = await gameApi.purchaseSkin(skinId);
      
      if (response.success) {
        console.log(`[SKIN SHOP] ✅ Skin comprada com sucesso!`);
        
        // Atualizar coronas no gameState
        if (response.data && typeof response.data.newBalance === 'number') {
          gameState.resources.coronas = response.data.newBalance;
        } else {
          gameState.resources.coronas -= price;
        }
        
        // Sincronizar com servidor
        await gameApi.saveGameState(gameState);
        
        // Mostrar notificação
        if (gameUI) {
          gameUI.showNotification(`Skin adquirida com sucesso!`);
        }
      } else {
        console.error('[SKIN SHOP] ❌ Erro ao comprar skin:', response.error);
        if (gameUI) {
          gameUI.showNotification(response.error || 'Erro ao comprar skin');
        }
      }
    } catch (error) {
      console.error('[SKIN SHOP] ❌ Erro ao comprar skin:', error);
      if (gameUI) {
        gameUI.showNotification('Erro ao comprar skin');
      }
    }
  };

  inSkinShop = true;
}

function closeSkinShop() {
  if (skinShopUI) {
    skinShopUI.dispose();
  }
  skinShopUI = null;
  inSkinShop = false;

  if (gameUI) {
    gameUI.show3DViewer();
  }

  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

function openSkinManager() {
  if (!gameState) return;

  // Close other UIs
  if (inShop) closeShop();
  if (inInventory) closeInventory();
  if (inCraft) closeCraft();
  if (inQuests) closeQuests();
  if (inStatus) closeStatus();
  if (inAchievementsCanvas) closeAchievementsCanvas();
  if (inLeaderboardCanvas) closeLeaderboardCanvas();
  if (inDailySpinCanvas) closeDailySpinCanvas();
  if (inMinigamesMenu) closeMinigamesMenu();
  if (inSettings) closeSettings();
  if (inSkinShop) closeSkinShop();

  // Hide 3D viewer
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Skin Manager UI
  skinManagerUI = new SkinManagerUI(canvas);

  skinManagerUI.onClose = () => {
    closeSkinManager();
  };

  skinManagerUI.onSkinChanged = async (skinId: string) => {
    if (!gameState) return;
    
    console.log(`[SKIN MANAGER] 🔄 Trocando skin para: ${skinId}`);
    
    try {
      // Alterar skin via API
      const response = await gameApi.changeSkin(skinId);
      
      if (response.success) {
        console.log(`[SKIN MANAGER] ✅ Skin alterada com sucesso!`);
        
        // Recarregar 3D scene com nova skin
        if (gameUI) {
          gameUI.reloadPlayerSkin(skinId);
          gameUI.showNotification(`Skin alterada para ${getActiveSkin().name}!`);
        }
      } else {
        console.error('[SKIN MANAGER] ❌ Erro ao trocar skin:', response.error);
        if (gameUI) {
          gameUI.showNotification(response.error || 'Erro ao trocar skin');
        }
      }
    } catch (error) {
      console.error('[SKIN MANAGER] ❌ Erro ao trocar skin:', error);
      if (gameUI) {
        gameUI.showNotification('Erro ao trocar skin');
      }
    }
  };

  inSkinManager = true;
}

function closeSkinManager() {
  if (skinManagerUI) {
    skinManagerUI.dispose();
  }
  skinManagerUI = null;
  inSkinManager = false;

  if (gameUI) {
    gameUI.show3DViewer();
  }

  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== ACHIEVEMENTS & QUESTS INTEGRATION =====

/**
 * Verifica e desbloqueia uma conquista
 */
function checkAndUnlockAchievement(achievementId: string) {
  if (!gameState) return;
  
  // TODO: Implementar sistema completo de conquistas no gameState
  // Por enquanto, apenas loga
  console.log(`[ACHIEVEMENT] 🏆 Progresso em conquista: ${achievementId}`);
  
  // Futuramente: verificar se já foi desbloqueada, incrementar progresso, desbloquear se atingir meta
}

/**
 * Progride uma missão diária/semanal
 */
function progressDailyQuest(questId: string) {
  if (!gameState) return;
  
  // TODO: Implementar sistema completo de missões diárias no gameState
  // Por enquanto, apenas loga
  console.log(`[QUEST] 📚 Progresso em missão: ${questId}`);
  
  // Futuramente: incrementar progresso, completar se atingir meta, dar recompensas
}

// ===== EXPLORATION SYSTEM =====

function openExploration() {
  if (!gameState || !gameState.activeBeast) {
    showMessage('Você precisa de uma besta ativa para explorar!', '⚠️ Sem Besta');
    return;
  }
  
  const beast = gameState.activeBeast;
  
  // VALIDAÇÃO CRÍTICA: Verificar se a beast está viva PRIMEIRO
  if (beast.currentHp <= 0) {
    showMessage(
      '❌ Sua Beast está inconsciente!\n\n' +
      `HP atual: 0/${beast.maxHp}\n\n` +
      'Descanse para recuperar HP antes de explorar.',
      '⚠️ Beast Inconsciente'
    );
    console.error('[Exploration] Cannot explore with 0 HP!');
    return;
  }

  // VALIDAÇÃO: Avisar se HP está muito baixo
  const currentHpPercent = (beast.currentHp / beast.maxHp) * 100;
  if (currentHpPercent < 10) {
    if (!confirm(`⚠️ AVISO: Sua Beast está com apenas ${beast.currentHp}/${beast.maxHp} HP (${Math.floor(currentHpPercent)}%)!\n\nExplorar com HP baixo é muito perigoso. Deseja continuar?`)) {
      return;
    }
  }
  
  // Verificar limite de explorações
  const serverTime = gameState.serverTime || Date.now();
  const explorationCheck = canStartAction(beast, 'exploration', serverTime);
  
  if (!explorationCheck.can) {
    const timeMsg = explorationCheck.timeRemaining 
      ? `\nTempo restante: ${formatTime(explorationCheck.timeRemaining)}`
      : '';
    showMessage(
      `${explorationCheck.reason}${timeMsg}`,
      '⚠️ Exploração Bloqueada'
    );
    return;
  }
  
  // Incrementar contador APENAS após todas as validações passarem
  beast.explorationCount = (beast.explorationCount || 0) + 1;
  beast.lastExploration = Date.now();
  
  console.log(`[Exploration] Started exploration ${beast.explorationCount}/10 with ${beast.currentHp}/${beast.maxHp} HP`);
  
  // Salvar imediatamente
  saveGame(gameState);

  // Close other UIs
  if (inShop) closeShop();
  if (inInventory) closeInventory();
  if (inCraft) closeCraft();
  if (inQuests) closeQuests();
  if (inAchievements) closeAchievements();

  // Hide 3D viewer when opening exploration
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Exploration UI
  explorationUI = new ExplorationUI(canvas);

  // Setup callbacks
  explorationUI.onZoneSelected = (zone: ExplorationZone) => {
    startExplorationInZone(zone);
  };

  explorationUI.onWalk = () => {
    walkExploration();
  };

  explorationUI.onBattleStart = (enemy: WildEnemy) => {
    startExplorationBattle(enemy);
  };

  explorationUI.onTreasureCollect = (treasure: Item[]) => {
    collectTreasureInExploration(treasure);
  };

  explorationUI.onEventContinue = () => {
    continueEventExploration();
  };

  explorationUI.onReturn = () => {
    finishExploration();
  };

  explorationUI.onDungeonOpen = () => {
    // Fechar exploração e abrir dungeons
    closeExploration();
    openDungeon();
  };

  explorationUI.onClose = async () => {
    // Salvar materiais coletados antes de fechar
    if (explorationState && explorationState.collectedMaterials.length > 0) {
      console.log('[Exploration] Saving collected materials before closing...');
      await saveMaterialsFromExploration();
      
      showMessage(
        `Exploração cancelada!\n` +
        `💎 ${explorationState.collectedMaterials.length} tipos de materiais salvos no inventário.`,
        '🗺️ Exploração'
      );
    }
    
    closeExploration();
  };

  inExploration = true;
  
  // Música removida
}

function startExplorationInZone(zone: ExplorationZone) {
  if (!explorationUI) return;

  explorationState = startExploration(zone);
  explorationUI.updateState(explorationState);
}

function walkExploration() {
  if (!explorationState || !explorationUI || !gameState) return;

  const encounter = advanceExploration(explorationState, 100);
  
  // NOVO: Finalizar automaticamente se atingiu distância máxima (5000m)
  const MAX_EXPLORATION_DISTANCE = 5000;
  if (explorationState.distance >= MAX_EXPLORATION_DISTANCE) {
    console.log(`[Exploration] Max distance reached (${explorationState.distance}m), auto-finishing...`);
    finishExploration();
    return;
  }
  
  explorationUI.updateState(explorationState);
}

function startExplorationBattle(enemy: WildEnemy) {
  if (!gameState || !gameState.activeBeast || !explorationState) {
    console.error('[Exploration Battle] Missing gameState, activeBeast, or explorationState');
    return;
  }

  // PROTEÇÃO: Prevenir múltiplas batalhas simultâneas
  if (inBattle) {
    console.error('[Exploration Battle] Already in battle! Ignoring new battle start');
    return;
  }

  // VALIDAÇÃO CRÍTICA: Verificar se a beast está viva ANTES de iniciar batalha
  if (gameState.activeBeast.currentHp <= 0) {
    console.error('[Exploration Battle] Cannot start battle with 0 HP!');
    
    // CORREÇÃO: Prevenir múltiplas chamadas
    if (inBattle || battleUI) {
      console.warn('[Exploration Battle] Already processing defeat, ignoring...');
      return;
    }
    
    // Limpar flags ANTES de mostrar modal para evitar conflitos
    inExploration = false;
    inBattle = false;
    
    showMessage(
      '❌ Sua Beast está inconsciente!\n\n' +
      'HP: 0/' + gameState.activeBeast.maxHp + '\n\n' +
      'Saindo da exploração...',
      '⚠️ Beast Inconsciente',
      async () => {
        // Fechar exploração completamente
        await closeExploration();
        console.log('[Exploration Battle] Exploration closed after 0 HP detection');
      }
    );
    return;
  }

  // Salvar o inimigo atual para usar depois no callback
  const currentEnemy = enemy;

  // Criar besta inimiga a partir do WildEnemy
  const enemyBeast: Beast = {
    id: enemy.id,
    name: enemy.name,
    line: enemy.line as any,
    blood: 'common',
    affinity: 'earth',
    attributes: enemy.stats,
    secondaryStats: {
      fatigue: 0,
      stress: 0,
      loyalty: 100,
      age: enemy.level,
      maxAge: 200,
    },
    traits: [],
    mood: 'neutral',
    techniques: [
      // Técnicas padrão - dano reduzido para level baixo
      { id: 'tackle', name: 'Investida', essenceCost: 5, damage: 8 + enemy.level * 2, type: 'physical', description: 'Ataque físico básico' },
      { id: 'scratch', name: 'Arranhar', essenceCost: 3, damage: 5 + enemy.level, type: 'physical', description: 'Ataque rápido' },
      { id: 'roar', name: 'Rugido', essenceCost: 8, damage: 12 + enemy.level * 3, type: 'mystical', description: 'Intimidar o oponente' },
    ],
    // HP e Essência balanceados:
    // Level 1: ~50-75 HP, 30 Essência
    // Level 2: ~65-95 HP, 35 Essência
    // Level 5: ~110-155 HP, 50 Essência
    currentHp: enemy.stats.vitality * 5 + enemy.level * 5,
    maxHp: enemy.stats.vitality * 5 + enemy.level * 5,
    essence: 30 + enemy.level * 5,
    maxEssence: 30 + enemy.level * 5,
    birthWeek: 0,
    lifeEvents: [],
    victories: 0,
    defeats: 0,
  };

  // Iniciar batalha
  const battle = initiateBattle(gameState.activeBeast, enemyBeast, false);
  battle.phase = 'player_turn';

  gameState.currentBattle = battle;

  // Marcar como batalha de exploração
  isExplorationBattle = true;

  // Log de debug
  console.log('[Exploration Battle] Starting battle:');
  console.log('- Phase:', battle.phase);
  console.log('- Turn:', battle.turnCount);
  console.log('- Player HP:', battle.player.currentHp, '/', gameState.activeBeast.maxHp);
  console.log('- Enemy HP:', battle.enemy.currentHp, '/', enemyBeast.maxHp);

  // Create battle UI (HÍBRIDO, 3D completo, ou 2D clássico)
  if (useHybridBattle) {
    console.log('[Exploration Battle] 🎨 Using HYBRID Battle System (2D UI + 3D Arena)');
    battleUI = new BattleUIHybrid(canvas, battle);
    
    // Setup HYBRID callbacks (mesma interface do 2D)
    (battleUI as BattleUIHybrid).onPlayerAction = (action: CombatAction) => {
      if (!gameState?.currentBattle) {
        console.error('[Exploration Battle] No currentBattle in gameState!');
        return;
      }

      const result = executePlayerAction(gameState.currentBattle, action);

      if (result && battleUI) {
        (battleUI as BattleUIHybrid).updateBattle(gameState.currentBattle);

        if (gameState.currentBattle.winner) {
          (battleUI as BattleUIHybrid).onBattleEnd();
          return;
        }

        if (gameState.currentBattle.phase === 'enemy_turn') {
          setTimeout(() => {
            if (!gameState?.currentBattle || !battleUI) return;

            executeEnemyTurn(gameState.currentBattle);
            (battleUI as BattleUIHybrid).updateBattle(gameState.currentBattle);

            if (gameState.currentBattle.winner) {
              (battleUI as BattleUIHybrid).onBattleEnd();
              return;
            }

            if (gameState.currentBattle.phase === 'player_turn') {
              setTimeout(() => {
                if (battleUI) {
                  (battleUI as BattleUIHybrid).checkAutoBattle();
                }
              }, 500);
            }
          }, 1500);
        }
      }
    };

    (battleUI as BattleUIHybrid).onBattleEnd = async () => {
      if (!gameState?.currentBattle) return;

      const battle = gameState.currentBattle;
      
      console.log('[Exploration Battle] Battle ended - Phase:', battle.phase, 'Winner:', battle.winner);
      
      // PROTEÇÃO: Se fase não for final, não processar
      if (battle.phase !== 'victory' && battle.phase !== 'defeat' && battle.phase !== 'fled') {
        console.error('[Exploration Battle] ❌ onBattleEnd called but phase is:', battle.phase);
        return;
      }

      // FUGIU: Volta para exploração (sem penalidade)
      if (battle.phase === 'fled') {
        console.log('[Exploration Battle] ✓ Player fled - continuing exploration');
        
        // Fechar batalha
        closeBattle();
        
        // Reativar exploração
        if (explorationUI && explorationState) {
          inExploration = true;
          explorationUI.updateState(explorationState);
          console.log('[Exploration Battle] ✓ Exploration reactivated after flee');
          
          // Continuar explorando RAPIDAMENTE após fuga
          setTimeout(() => {
            console.log('[Exploration Battle] ✓ Auto-continuing after flee...');
            walkExploration();
          }, 200); // 200ms - rápido para prevenir re-batalha
        }
        
        return; // Sai do callback
      }

      // VITÓRIA: Continuar exploração
      if (battle.phase === 'victory') {
        console.log('[Exploration Battle] ✓ Victory - continuing exploration');
        
        gameState.victories++;
        if (gameState.activeBeast) {
          gameState.activeBeast.victories++;
          // Atualizar HP e Essência após batalha
          gameState.activeBeast.currentHp = battle.player.currentHp;
          gameState.activeBeast.essence = battle.player.currentEssence;
          console.log('[Exploration Battle] Beast HP after victory:', gameState.activeBeast.currentHp, '/', gameState.activeBeast.maxHp);
        }
        
        emitBattleWon(gameState);
        unlockQuests(gameState.quests);

        await saveGame(gameState);

        // Continue exploration
        if (explorationState) {
          explorationState.distance += 100;
          explorationState.battlesWon++;
          console.log('[Exploration Battle] ✓ Continuing exploration - distance:', explorationState.distance);
        }
        
        // Fechar apenas a batalha (não a exploração)
        closeBattle();
        
        // CRÍTICO: Reativar flag de exploração
        if (explorationUI && explorationState) {
          inExploration = true; // ← Volta para exploração
          console.log('[Exploration Battle] ✓ Exploration reactivated');
          
          // IMPORTANTE: Atualizar UI para mostrar progresso
          explorationUI.updateState(explorationState);
          
          // Continuar explorando RAPIDAMENTE (prevenir clique duplo)
          setTimeout(() => {
            console.log('[Exploration Battle] ✓ Auto-continuing exploration...');
            walkExploration();
          }, 200); // 200ms - rápido o suficiente para prevenir clique no mesmo inimigo
        }
      } 
      // DERROTA: Fechar exploração
      else if (battle.phase === 'defeat') {
        console.log('[Exploration Battle] ✗ Defeat - closing exploration');
        
        // Atualizar HP da besta com HP da batalha (baixo/0)
        if (gameState.activeBeast) {
          gameState.activeBeast.defeats++;
          gameState.activeBeast.currentHp = Math.max(1, battle.player.currentHp); // Mínimo 1 HP
          gameState.activeBeast.essence = battle.player.currentEssence;
          
          console.log('[Exploration Battle] Beast HP after defeat:', gameState.activeBeast.currentHp, '/', gameState.activeBeast.maxHp);
        }
        
        await saveGame(gameState);
        
        // Fechar batalha primeiro
        closeBattle();
        
        // Depois fechar exploração (volta ao rancho)
        await closeExploration();
      }
    };
  } else if (use3DBattle) {
    console.log('[Exploration Battle] 🎮 Using 3D Immersive Battle System');
    battleUI = new BattleUI3D(canvas, battle);
    
    // Setup 3D callbacks
    (battleUI as BattleUI3D).onActionSelected = (action: CombatAction) => {
      if (!gameState?.currentBattle) {
        console.error('[Exploration Battle] No currentBattle in gameState!');
        return;
      }

      const result = executePlayerAction(gameState.currentBattle, action);

      if (result && battleUI) {
        (battleUI as BattleUI3D).updateBattle(gameState.currentBattle);

        if (gameState.currentBattle.winner) {
          console.log('[Exploration Battle] Battle ended with winner:', gameState.currentBattle.winner);
          (battleUI as BattleUI3D).onBattleEnd!(gameState.currentBattle.winner);
          return;
        }

        if (gameState.currentBattle.phase === 'enemy_turn') {
          setTimeout(() => {
            if (!gameState?.currentBattle) return;
            executeEnemyTurn(gameState.currentBattle);
            if (battleUI) {
              (battleUI as BattleUI3D).updateBattle(gameState.currentBattle);
            }
          }, 1000);
        }
      }
    };
    
    (battleUI as BattleUI3D).onBattleEnd = async (winner: 'player' | 'enemy') => {
      if (!gameState?.currentBattle) return;

      inBattle = false;
      isExplorationBattle = false;

      if (winner === 'player') {
        gameState.victories++;
        if (gameState.activeBeast) gameState.activeBeast.victories++;
        
        emitBattleWon(gameState);
        unlockQuests(gameState.quests);

        await saveGame(gameState);

        // Continue exploration
        if (explorationState) {
          explorationState.distance += 100;
          explorationState.battlesWon++;
        }
      } else {
        if (gameState.activeBeast) gameState.activeBeast.defeats++;

        await saveGame(gameState);

        await closeExploration();
      }
      
      closeBattle();
    };
  } else {
    console.log('[Exploration Battle] 📺 Using 2D Classic Battle System');
    battleUI = new BattleUI(canvas, battle);
    
    // Setup 2D callbacks (original)
    battleUI.onPlayerAction = (action: CombatAction) => {
    if (!gameState?.currentBattle) {
      console.error('[Exploration Battle] No currentBattle in gameState!');
      return;
    }

    console.log('[Exploration Battle] Player action:', action.type);
    console.log('[Exploration Battle] Before action - Phase:', gameState.currentBattle.phase, 'Turn:', gameState.currentBattle.turnCount);

    const result = executePlayerAction(gameState.currentBattle, action);

    if (!result) {
      console.error('[Exploration Battle] executePlayerAction returned null!');
      return;
    }

    console.log('[Exploration Battle] After action - Phase:', gameState.currentBattle.phase, 'Turn:', gameState.currentBattle.turnCount);

    if (result && battleUI) {
      battleUI.updateBattle(gameState.currentBattle);

      // CORREÇÃO: Se a batalha terminou, chamar onBattleEnd manualmente
      if (gameState.currentBattle.winner) {
        console.log('[Exploration Battle] Battle ended with winner:', gameState.currentBattle.winner);
        battleUI.onBattleEnd();
        return;
      }

      // If enemy turn, execute automatically after delay
      if (gameState.currentBattle.phase === 'enemy_turn') {
        console.log('[Exploration Battle] Enemy turn starting...');
        setTimeout(() => {
          if (!gameState?.currentBattle || !battleUI) return;

          console.log('[Exploration Battle] Executing enemy turn...');
          executeEnemyTurn(gameState.currentBattle);
          battleUI.updateBattle(gameState.currentBattle);

          console.log('[Exploration Battle] After enemy turn - Phase:', gameState.currentBattle.phase, 'Turn:', gameState.currentBattle.turnCount);

          // CORREÇÃO: Se a batalha terminou após turno do inimigo, chamar onBattleEnd manualmente
          if (gameState.currentBattle.winner) {
            console.log('[Exploration Battle] Battle ended after enemy turn with winner:', gameState.currentBattle.winner);
            battleUI.onBattleEnd();
            return;
          }

          // Check if auto-battle is active and it's player turn now
          if (gameState.currentBattle.phase === 'player_turn') {
            setTimeout(() => {
              if (battleUI) {
                battleUI.checkAutoBattle();
              }
            }, 500);
          }
        }, 1500);
      }
    }
  };
  
  battleUI.onBattleEnd = async () => {
    if (!gameState?.currentBattle || !explorationState) return;

    const battle = gameState.currentBattle;
    
    // CORREÇÃO: Só processa se o winner estiver definido
    if (!battle.winner) {
      return;
    }

    // Apply results
    if (battle.winner === 'player') {
    // Derrotou inimigo na exploração
    const drops = defeatEnemy(explorationState, currentEnemy);

    // Mostrar drops
    const dropsList = drops.map(d => `${d.name} x${d.quantity}`).join(', ');
    showMessage(`Vitória na batalha! Materiais coletados: ${dropsList}`, '⚔️ Vitória na Batalha');

    // Track quest via event system
    emitBattleWon(gameState);
    unlockQuests(gameState.quests);

    } else if (battle.winner === 'enemy') {
      gameState.defeats++;
      gameState.activeBeast!.defeats++;
      
      // Update beast HP/Essence
      if (gameState.activeBeast) {
        gameState.activeBeast.currentHp = battle.player.currentHp;
        gameState.activeBeast.essence = battle.player.currentEssence;
      }

      // Salvar materiais coletados PRIMEIRO (apenas UMA VEZ aqui)
      if (explorationState && explorationState.collectedMaterials.length > 0) {
        console.log('[Exploration] Saving materials before defeat (one time only)...');
        await saveMaterialsFromExploration();
        // LIMPAR para prevenir salvamento duplicado
        explorationState.collectedMaterials = [];
        console.log('[Exploration] Materials saved and cleared');
      }

      // Clear battle COMPLETELY
      gameState.currentBattle = undefined;
      if (battleUI) {
        battleUI.dispose(); // Cleanup 3D viewers
      }
      battleUI = null;
      inBattle = false;
      isExplorationBattle = false;
      
      // CORREÇÃO: Limpar flag de exploração também
      inExploration = false;
      
      // DON'T show 3D viewer yet - modal will be open
      console.log('[Main] Defeat - keeping 3D hidden until modal closes');
      
      // Show message and close exploration (SEM salvar materiais novamente)
      showMessage('Você foi derrotado! Retornando ao rancho...', '💀 Derrota', async () => {
        // Fechar exploração PROTEGIDO (não vai salvar materiais novamente)
        await closeExploration();
        if (gameUI) {
          gameUI.show3DViewer();
          console.log('[Main] Defeat - exploration closed, 3D viewer shown');
        }
      });
      
      return;
    }

    // Update beast HP/Essence
    if (gameState.activeBeast) {
      gameState.activeBeast.currentHp = battle.player.currentHp;
      gameState.activeBeast.essence = battle.player.currentEssence;
    }

    // Clear battle
    gameState.currentBattle = undefined;
    if (battleUI) {
      battleUI.dispose(); // Cleanup 3D viewers
    }
    battleUI = null;
    inBattle = false;
    isExplorationBattle = false;
    
    // Música removida

    // Volta para exploração
    if (explorationUI && explorationState) {
      inExploration = true; // ← CORREÇÃO: Reativa a exploração
      
      // Continuar exploração após vitória (só se venceu)
      if (battle.winner === 'player') {
        // Limpar o encontro atual para continuar explorando
        explorationState.currentEncounter = -1;
      }
      
      // Sempre atualizar a UI após qualquer resultado
      explorationUI.updateState(explorationState);
    }

    // Save
    saveGame(gameState);
  };
  } // Fecha o bloco else (2D Battle System)

  inBattle = true;
  inExploration = false; // Temporariamente sai da exploração
  
  // Música removida
}

// Flags de controle de exploração
let isCollectingTreasure = false; // Prevenir spam no botão de coletar
let isClosingExploration = false; // Prevenir múltiplas chamadas de closeExploration

// Flag de controle de dungeon
let isDungeonBattle = false; // Diferenciar batalha de dungeon

/**
 * Fecha a batalha e limpa recursos
 */
function closeBattle() {
  if (!gameState) return;
  
  console.log('[Battle] Closing battle...');
  
  // Clear battle state
  gameState.currentBattle = undefined;
  
  // CRÍTICO: Cancelar qualquer ação em andamento da besta
  if (gameState.activeBeast && gameState.activeBeast.currentAction) {
    console.log('[Battle] Cancelling beast action:', gameState.activeBeast.currentAction.type);
    gameState.activeBeast.currentAction = undefined;
  }
  
  // Dispose battle UI
  if (battleUI) {
    battleUI.dispose();
    battleUI = null;
  }
  
  // Clear flags
  inBattle = false;
  isExplorationBattle = false;
  isDungeonBattle = false;
  
  console.log('[Battle] ✓ Battle closed');
}

async function collectTreasureInExploration(treasure: Item[]) {
  // Proteção contra spam
  if (isCollectingTreasure || !explorationState || !explorationUI || !gameState) {
    console.log('[Exploration] Collect treasure blocked (already collecting or invalid state)');
    return;
  }
  
  isCollectingTreasure = true;
  console.log('[Exploration] Collecting treasure...');
  
  try {
    collectMaterials(explorationState, treasure);
    
    // Salvar tesouros no servidor e emitir eventos
    for (const item of treasure) {
      try {
        await gameApi.addInventoryItem(item.id, item.quantity || 1);
        console.log(`[Exploration] Saved treasure ${item.quantity}x ${item.id} to server`);
        
        // Emitir evento de item coletado
        emitItemCollected(gameState, item.id, item.quantity || 1, 'treasure');
      } catch (error) {
        console.error('[Exploration] Failed to save treasure to server:', error);
      }
    }
    
    // Limpar o encontro atual para continuar explorando
    explorationState.currentEncounter = -1;
    
    explorationUI.updateState(explorationState);

    const treasureList = treasure.map(t => `${t.name} x${t.quantity}`).join(', ');
    showMessage(`Tesouro coletado: ${treasureList}`, '💎 Tesouro', () => {
      // Continua explorando após fechar mensagem
      continueExploration();
      isCollectingTreasure = false;
    });
  } catch (error) {
    console.error('[Exploration] Error collecting treasure:', error);
    isCollectingTreasure = false;
  }
}

function processEventEffect(message: string, gameState: GameState) {
  if (!gameState.activeBeast || !message) {
    return;
  }
  
  const beast = gameState.activeBeast;
  
  // Fonte mágica - Recupera HP e Essência
  if (message.includes('fonte mágica')) {
    const hpRecovery = Math.floor(beast.maxHp * 0.2);
    const essenceRecovery = Math.floor(beast.maxEssence * 0.2);
    
    beast.currentHp = Math.min(beast.maxHp, beast.currentHp + hpRecovery);
    beast.essence = Math.min(beast.maxEssence, beast.essence + essenceRecovery);
    
    showMessage(
      `🌟 Fonte mágica encontrada!\n` +
      `❤️ HP recuperado: +${hpRecovery}\n` +
      `💙 Essência recuperada: +${essenceRecovery}`,
      '🌟 Fonte Mágica'
    );
  }
  
  // Depósito de cristais - Ganha materiais raros
  else if (message.includes('depósito de cristais')) {
    const crystalMaterials = [
      { id: 'crystal_shard', name: 'Fragmento de Cristal', quantity: 2 },
      { id: 'magic_dust', name: 'Pó Mágico', quantity: 1 },
      { id: 'energy_core', name: 'Núcleo de Energia', quantity: 1 }
    ];
    
    // Adicionar materiais ao inventário
    for (const material of crystalMaterials) {
      const existing = gameState.inventory.find(i => i.id === material.id);
      if (existing) {
        existing.quantity = (existing.quantity || 0) + material.quantity;
      } else {
        gameState.inventory.push({ ...material });
      }
    }
    
    const materialsList = crystalMaterials.map(m => `${m.name} x${m.quantity}`).join(', ');
    showMessage(
      `💎 Depósito de cristais descoberto!\n` +
      `Materiais coletados: ${materialsList}`,
      '💎 Depósito de Cristais'
    );
  }
  
  // Baú do viajante - Materiais extras
  else if (message.includes('baú')) {
    const treasureMaterials = [
      { id: 'gold_coin', name: 'Moeda de Ouro', quantity: 3 },
      { id: 'rare_herb', name: 'Erva Rara', quantity: 2 },
      { id: 'ancient_scroll', name: 'Pergaminho Antigo', quantity: 1 }
    ];
    
    // Adicionar materiais ao inventário
    for (const material of treasureMaterials) {
      const existing = gameState.inventory.find(i => i.id === material.id);
      if (existing) {
        existing.quantity = (existing.quantity || 0) + material.quantity;
      } else {
        gameState.inventory.push({ ...material });
      }
    }
    
    const materialsList = treasureMaterials.map(m => `${m.name} x${m.quantity}`).join(', ');
    showMessage(
      `🎁 Baú do viajante encontrado!\n` +
      `Materiais coletados: ${materialsList}`,
      '🎁 Baú do Viajante'
    );
  }
  
  // Plantas medicinais - Recupera HP
  else if (message.includes('plantas medicinais') || message.includes('Plantas medicinais')) {
    const hpRecovery = Math.floor(beast.maxHp * 0.15);
    beast.currentHp = Math.min(beast.maxHp, beast.currentHp + hpRecovery);
    
    showMessage(
      `🌿 Plantas medicinais encontradas!\n` +
      `❤️ HP recuperado: +${hpRecovery}`,
      '🌿 Plantas Medicinais'
    );
  }
  
  // Ave guia - Bônus de movimento
  else if (message.includes('ave guia')) {
    // Este evento não precisa de processamento especial
    showMessage(
      `🦅 Uma ave guia você!\n` +
      `Você se sente mais ágil e pode se mover mais rápido.`,
      '🦅 Ave Guia'
    );
  }
  
  // Tempestade - Nenhum efeito (já está na mensagem)
  else if (message.includes('tempestade')) {
    showMessage(
      `⚠️ Tempestade súbita!\n` +
      `Nenhum material encontrado aqui.`,
      '⚠️ Tempestade'
    );
  }
  
  // Salvar após aplicar efeitos
  saveGame(gameState);
}

function continueEventExploration() {
  if (!explorationState || !explorationUI || !gameState) {
    return;
  }
  
  // Verificar se já está no estado correto para evitar chamadas duplicadas
  if (explorationState.currentEncounter === -1) {
    explorationUI.updateState(explorationState);
    return;
  }
  
  // Processar efeito do evento antes de limpar
  const currentEncounter = explorationState.encounters[explorationState.currentEncounter];
  if (currentEncounter && currentEncounter.type === 'event' && currentEncounter.eventMessage) {
    processEventEffect(currentEncounter.eventMessage, gameState);
  }
  
  // Limpar o encontro atual para continuar explorando
  explorationState.currentEncounter = -1;
  
  // Atualizar UI
  explorationUI.updateState(explorationState);
}

function continueExploration() {
  if (!explorationState || !explorationUI) {
    return;
  }
  
  // Não limpar o currentEncounter aqui - deixar para a lógica específica
  explorationUI.updateState(explorationState);
}

/**
 * Salva materiais coletados na exploração (local + servidor)
 */
async function saveMaterialsFromExploration(): Promise<number> {
  if (!explorationState || !gameState) return 0;
  
  const materials = explorationState.collectedMaterials;
  
  // PROTEÇÃO: Se já salvou (lista vazia), não salvar novamente
  if (materials.length === 0) {
    console.log('[Exploration] No materials to save (already saved or empty)');
    return 0;
  }
  
  let savedCount = 0;
  
  console.log(`[Exploration] Saving ${materials.length} material types...`);
  
  // Adicionar materiais ao inventário (local + servidor) e emitir eventos
  for (const material of materials) {
    // Adicionar localmente
    const existing = gameState.inventory.find(i => i.id === material.id);
    if (existing) {
      existing.quantity = (existing.quantity || 0) + (material.quantity || 0);
    } else {
      gameState.inventory.push({ ...material });
    }
    
    // Salvar no servidor
    try {
      await gameApi.addInventoryItem(material.id, material.quantity || 1);
      console.log(`[Exploration] Saved ${material.quantity}x ${material.id} to server inventory`);
      
      // Emitir evento de item coletado
      emitItemCollected(gameState, material.id, material.quantity || 1, 'exploration');
      savedCount++;
    } catch (error) {
      console.error('[Exploration] Failed to save material to server:', error);
    }
  }
  
  // CRÍTICO: Limpar materiais IMEDIATAMENTE após salvar para prevenir loop
  explorationState.collectedMaterials = [];
  console.log('[Exploration] Materials cleared after saving to prevent duplicates');
  
  return savedCount;
}

async function finishExploration() {
  if (!explorationState || !gameState || !gameState.activeBeast) {
    console.error('[Exploration] finishExploration called with invalid state');
    return;
  }

  console.log('[Exploration] Finishing exploration...');

  const rewards = endExploration(explorationState);

  // Salvar materiais usando função compartilhada (apenas UMA VEZ)
  await saveMaterialsFromExploration();
  
  // LIMPAR materiais para prevenir salvamento duplicado
  explorationState.collectedMaterials = [];
  console.log('[Exploration] Materials cleared after save');
  
  // Emitir evento de exploração completa
  emitExplorationCompleted(
    gameState, 
    explorationState.zone, 
    rewards.totalDistance, 
    rewards.enemiesDefeated
  );
  
  // Mostrar resumo
  const beast = gameState.activeBeast;
  const materialCount = rewards.materials.length;
  const totalItems = rewards.materials.reduce((sum, m) => sum + (m.quantity || 0), 0);
  const explorationInfo = beast.explorationCount >= 10 
    ? `\n⚠️ Limite de explorações atingido (${beast.explorationCount}/10)! Aguarde 2h para resetar.`
    : `\nExplorações: ${beast.explorationCount}/10`;
  
  // Save
  saveGame(gameState);

  console.log('[Exploration] Showing completion message...');

  // Mostrar mensagem e fechar exploração no callback
  showMessage(
    `Exploração concluída!\n` +
    `📍 Distância: ${rewards.totalDistance}m\n` +
    `⚔️ Inimigos: ${rewards.enemiesDefeated}\n` +
    `💎 Materiais: ${totalItems} itens (${materialCount} tipos)\n` +
    `✅ Materiais salvos no inventário!` +
    explorationInfo,
    '🗺️ Exploração Finalizada',
    async () => {
      // Fechar exploração e voltar ao rancho APÓS fechar o modal
      console.log('[Exploration] Completion modal closed, closing exploration...');
      await closeExploration();
      console.log('[Exploration] Exploration closed, back to ranch');
    }
  );
}

async function closeExploration() {
  // PROTEÇÃO CRÍTICA: Prevenir múltiplas chamadas simultâneas
  if (isClosingExploration) {
    console.warn('[Exploration] Already closing exploration, ignoring duplicate call');
    return;
  }
  
  isClosingExploration = true;
  console.log('[Exploration] Starting closeExploration...');
  
  try {
    // PROTEÇÃO: Só salvar se ainda tiver materiais (prevenir salvamento duplicado)
    if (explorationState && explorationState.collectedMaterials.length > 0 && gameState) {
      console.log('[Exploration] Saving materials before closing...');
      const savedCount = await saveMaterialsFromExploration();
      console.log(`[Exploration] Saved ${savedCount} material types`);
      // saveMaterialsFromExploration() já limpa os materiais internamente
    }
    
    // Reset flag de coleta quando fecha exploração
    isCollectingTreasure = false;
    
    if (explorationUI) {
      explorationUI.close();
    }
    explorationUI = null;
    explorationState = null;
    inExploration = false;
    isExplorationBattle = false;
    inBattle = false; // GARANTIR que inBattle também seja limpo
    
    // Música removida

    // Show 3D viewer when returning to ranch
    if (gameUI) {
      gameUI.show3DViewer();
      console.log('[Exploration] 3D viewer shown');
    }

    // Update main UI
    if (gameUI && gameState) {
      gameUI.updateGameState(gameState);
    }
    
    console.log('[Exploration] closeExploration complete');
  } finally {
    // SEMPRE resetar a flag, mesmo se houver erro
    isClosingExploration = false;
  }
}

// ===== NAVIGATION =====

function closeAllOverlays() {
  if (inBattle) return; // Não fecha batalha automaticamente
  if (inShop) closeShop();
  if (inInventory) closeInventory();
  if (inCraft) closeCraft();
  if (inQuests) closeQuests();
  if (inAchievements) closeAchievements();
  if (inDungeon) closeDungeon(); // NOVO: Fechar dungeons também
  if (inExploration) closeExploration();
  if (inDialogue) closeDialogue();
  // Temple não fecha, pois é uma ação importante
}

// ===== COMBAT SYSTEM =====

function startTournament() {
  if (!gameState || !gameState.activeBeast || !modalUI) return;
  
  // Choose tournament rank usando modal
  const ranks: TournamentRank[] = ['bronze', 'silver', 'gold', 'mythic'];
  const rankNames = ['Bronze (Grátis)', 'Prata (300💰)', 'Ouro (800💰)', 'Mítico (2000💰)'];
  
  modalUI.show({
    type: 'choice',
    title: '🏆 Escolha o Torneio',
    message: `Você tem: ${gameState.economy.coronas}💰 | Vitórias: ${gameState.victories}`,
    choices: rankNames,
    onConfirm: (choice) => {
      if (choice === undefined || !gameState || !gameState.activeBeast) return;
      
      // Find rank by matching the choice text
      const rankIndex = rankNames.indexOf(choice);
      if (rankIndex < 0 || rankIndex >= ranks.length) return;
      
      const rank = ranks[rankIndex];
      
      // Check if can enter
      if (!canEnterTournament(rank, gameState.victories, gameState.economy.coronas)) {
        showMessage(
          'Você não pode participar deste torneio! Verifique se você tem dinheiro suficiente e vitórias necessárias.',
          '⚠️ Torneio Bloqueado'
        );
        return;
      }
      
      // Continue with the tournament
      startTournamentBattle(rank);
    },
    onCancel: () => {
      // Volta
    },
  });
}

function startTournamentBattle(rank: TournamentRank) {
  if (!gameState || !gameState.activeBeast) return;
  
  // Pay fee
  const fee = getTournamentFee(rank);
  gameState.economy.coronas -= fee;
  
  // Generate opponent
  const playerLevel = gameState.activeBeast.secondaryStats.age;
  const enemy = generateTournamentOpponent(rank, playerLevel);
  
  // Start battle
  const battle = initiateBattle(gameState.activeBeast, enemy, false);
  battle.phase = 'player_turn';
  
  // Apply rewards on victory
  const prize = getTournamentPrize(rank);
  applyBattleRewards(battle, prize);
  
  gameState.currentBattle = battle;
  
  // Create battle UI (HÍBRIDO, 3D completo, ou 2D clássico)
  if (useHybridBattle) {
    console.log('[Tournament] 🎨 Using HYBRID Battle System (2D UI + 3D Arena)');
    battleUI = new BattleUIHybrid(canvas, battle);
    
    // Setup HYBRID callbacks
    (battleUI as BattleUIHybrid).onPlayerAction = (action: CombatAction) => {
      if (!gameState?.currentBattle) return;
      
      const result = executePlayerAction(gameState.currentBattle, action);
      
      if (result && battleUI) {
        (battleUI as BattleUIHybrid).updateBattle(gameState.currentBattle);

        if (gameState.currentBattle.winner) {
          (battleUI as BattleUIHybrid).onBattleEnd();
          return;
        }

        if (gameState.currentBattle.phase === 'enemy_turn') {
          setTimeout(() => {
            if (!gameState?.currentBattle || !battleUI) return;
            
            executeEnemyTurn(gameState.currentBattle);
            (battleUI as BattleUIHybrid).updateBattle(gameState.currentBattle);

            if (gameState.currentBattle.winner) {
              (battleUI as BattleUIHybrid).onBattleEnd();
              return;
            }

            if (gameState.currentBattle.phase === 'player_turn') {
              setTimeout(() => {
                if (battleUI) {
                  (battleUI as BattleUIHybrid).checkAutoBattle();
                }
              }, 500);
            }
          }, 1500);
        }
      }
    };
    
    (battleUI as BattleUIHybrid).onBattleEnd = async () => {
      if (!gameState?.currentBattle) return;

      const battle = gameState.currentBattle;
      
      console.log('[Tournament] Battle ended - Phase:', battle.phase);
      
      // PROTEÇÃO: Verificar fase
      if (battle.phase !== 'victory' && battle.phase !== 'defeat' && battle.phase !== 'fled') {
        console.error('[Tournament] ❌ onBattleEnd called but phase is:', battle.phase);
        return;
      }

      if (battle.phase === 'victory') {
        gameState.victories++;
        gameState.activeBeast!.victories++;
        
        emitBattleWon(gameState);
        unlockQuests(gameState.quests);
      } else if (battle.phase === 'defeat') {
        gameState.defeats++;
        gameState.activeBeast!.defeats++;
      } else if (battle.phase === 'fled') {
        // Fugiu - sem penalidades em torneio
        console.log('[Tournament] Player fled from tournament');
      }

      await saveGame(gameState);
      closeBattle();
    };
  } else if (use3DBattle) {
    console.log('[Tournament] 🎮 Using 3D Immersive Battle System');
    battleUI = new BattleUI3D(canvas, battle);
    
    // Setup 3D callbacks
    (battleUI as BattleUI3D).onActionSelected = (action: CombatAction) => {
      if (!gameState?.currentBattle) return;
      
      const result = executePlayerAction(gameState.currentBattle, action);
      
      if (result && battleUI) {
        (battleUI as BattleUI3D).updateBattle(gameState.currentBattle);

        if (gameState.currentBattle.phase === 'enemy_turn') {
          setTimeout(() => {
            if (!gameState?.currentBattle) return;
            executeEnemyTurn(gameState.currentBattle);
            if (battleUI) {
              (battleUI as BattleUI3D).updateBattle(gameState.currentBattle);
            }
          }, 1000);
        }
      }
    };
    
    (battleUI as BattleUI3D).onBattleEnd = async (winner: 'player' | 'enemy') => {
      if (!gameState?.currentBattle) return;

      inBattle = false;

      if (winner === 'player') {
        gameState.victories++;
        gameState.activeBeast!.victories++;
        
        emitBattleWon(gameState);
        unlockQuests(gameState.quests);
      } else {
        gameState.defeats++;
        gameState.activeBeast!.defeats++;
      }

      await saveGame(gameState);
      closeBattle();
    };
  } else {
    console.log('[Tournament] 📺 Using 2D Classic Battle System');
    battleUI = new BattleUI(canvas, battle);
    
    // Setup 2D callbacks (original)
    battleUI.onPlayerAction = (action: CombatAction) => {
    if (!gameState?.currentBattle) return;
    
    const result = executePlayerAction(gameState.currentBattle, action);
    
    if (result && battleUI) {
      battleUI.updateBattle(gameState.currentBattle);
      
      // If enemy turn, execute automatically after delay
      if (gameState.currentBattle.phase === 'enemy_turn') {
        setTimeout(() => {
          if (!gameState?.currentBattle || !battleUI) return;
          
          executeEnemyTurn(gameState.currentBattle);
          battleUI.updateBattle(gameState.currentBattle);
          
          // Check if auto-battle is active and it's player turn now
          if (gameState.currentBattle.phase === 'player_turn') {
            setTimeout(() => {
              if (battleUI) {
                battleUI.checkAutoBattle();
              }
            }, 500); // Small delay before next auto action
          }
        }, 1500); // 1.5s delay
      }
    }
  };
  
  battleUI.onBattleEnd = () => {
    if (!gameState?.currentBattle) return;
    
    const battle = gameState.currentBattle;
    
    // Apply results
    if (battle.winner === 'player') {
      gameState.victories++;
      gameState.activeBeast!.victories++;
      
      // Track quest progress via event system
      emitBattleWon(gameState);
      unlockQuests(gameState.quests);
      
      // Add rewards
      if (battle.rewards) {
        gameState.economy.coronas += battle.rewards.coronas;
        showMessage(`Vitória! +${battle.rewards.coronas}💰`);

        // Calculate and add item drops
        if (battle.rewards.rank && gameState) {
          const drops = calculateTournamentDrops(battle.rewards.rank);
          
          if (drops.items.length > 0) {
            // Add items to inventory
            drops.items.forEach(item => {
              if (!gameState) return;
              const existingItem = gameState.inventory.find(i => i.id === item.id);
              if (existingItem && existingItem.quantity) {
                existingItem.quantity += 1;
              } else {
                gameState.inventory.push({ ...item, quantity: 1 });
              }
            });
            
            showMessage(drops.message);
          } else {
            showMessage('💰 Apenas prêmio em dinheiro desta vez.');
          }
        }
      }

      // Check for completed quests
      const completed = getCompletedQuests(gameState.quests);
      if (completed.length > 0) {
        showMessage(`🎯 ${completed.length} quest(s) completada(s)! Verifique suas missões.`);
      }
    } else if (battle.winner === 'enemy') {
      gameState.defeats++;
      gameState.activeBeast!.defeats++;
      showMessage('Você foi derrotado!', '💀 Derrota', () => {
        // Show 3D viewer AFTER modal is closed
        if (gameUI) {
          gameUI.show3DViewer();
          console.log('[Main] Tournament defeat modal closed - showing 3D viewer');
        }
      });
    } else {
      showMessage('Você fugiu da batalha.');
    }
    
    // Update beast HP/Essence
    if (gameState.activeBeast) {
      gameState.activeBeast.currentHp = battle.player.currentHp;
      gameState.activeBeast.essence = battle.player.currentEssence;
    }
    
    // Advance week
    advanceGameWeek(gameState);
    
    // Clear battle
    gameState.currentBattle = undefined;
    if (battleUI) {
      battleUI.dispose(); // Cleanup 3D viewers
    }
    battleUI = null;
    inBattle = false;
    
    // Música removida
    
    // Save
    saveGame(gameState);
    
    // Update UI
    if (gameUI) {
      gameUI.updateGameState(gameState);
    }
  };
  } // Fecha o bloco else (2D Battle System)
  
  inBattle = true;
  
  showMessage(`Torneio ${rank.toUpperCase()} iniciado!`);
}

function resizeCanvas() {
  // CORREÇÃO FINAL: Resolução fixa 1400x800, mas preenchendo máximo da janela
  const logicalWidth = 1400;
  const logicalHeight = 800;
  const aspectRatio = logicalWidth / logicalHeight;

  // Espaço disponível
  const containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight;
  const containerAspect = containerWidth / containerHeight;

  // Calcular tamanho que preenche ao máximo mantendo proporção
  let renderWidth: number;
  let renderHeight: number;

  if (containerAspect > aspectRatio) {
    // Janela mais larga que canvas: preencher altura
    renderHeight = containerHeight;
    renderWidth = renderHeight * aspectRatio;
  } else {
    // Janela mais alta que canvas: preencher largura
    renderWidth = containerWidth;
    renderHeight = renderWidth / aspectRatio;
  }

  // Aplicar CSS ao canvas
  canvas.style.position = 'fixed';
  canvas.style.top = '50%';
  canvas.style.left = '50%';
  canvas.style.transform = 'translate(-50%, -50%)';
  canvas.style.width = `${renderWidth}px`;
  canvas.style.height = `${renderHeight}px`;
  canvas.style.margin = '0';
  canvas.style.padding = '0';
  canvas.style.zIndex = '5'; // ACIMA do 3D para desenhar UI overlay

  // Tamanho lógico interno
  canvas.width = logicalWidth;
  canvas.height = logicalHeight;
  
  // Context sem transformações (browser escala automaticamente)
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  
  // Container 3D detecta mudança de tamanho automaticamente no próximo draw()
}

function showMessage(message: string, title: string = '💬 Guardian Grove', onClose?: () => void) {
  // Hide 3D viewer when showing message modal
  if (gameUI) {
    gameUI.hide3DViewer();
  }
  
  if (modalUI) {
    modalUI.show({
      type: 'message',
      title,
      message,
      onConfirm: () => {
        modalUI.hide();
        
        // Show 3D viewer again after modal closes (apenas se não estiver em exploração ou batalha)
        if (gameUI && !inExploration && !inBattle) {
          gameUI.show3DViewer();
        }
        
        // Call onClose callback if provided
        if (onClose) {
          onClose();
        }
      },
    });
  }
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    15% { opacity: 1; transform: translateX(-50%) translateY(0); }
    85% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  }
`;
document.head.appendChild(style);

// Pause when page not visible
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'hidden' && gameState) {
    await saveGame(gameState);
    console.log('[Game] Saved on visibility change');
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // S = Save (salva silenciosamente, sem mostrar mensagem)
  if (e.key === 's' && gameState) {
    saveGame(gameState).catch(err => {
      console.error('[Save] Erro ao salvar:', err);
    });
  }
  
  // R = Reset (debug)
  if (e.key === 'r' && e.ctrlKey) {
    if (confirm('Resetar o jogo? (isso apagará todo o progresso)')) {
      localStorage.clear();
      indexedDB.deleteDatabase('beast_keepers');
      location.reload();
    }
  }
});

// Start
init();
