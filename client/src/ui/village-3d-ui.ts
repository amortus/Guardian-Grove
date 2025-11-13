/**
 * Vila 3D UI - Guardian Grove
 * Wrapper para a cena 3D da vila interativa
 */

import { VillageScene3D } from '../3d/scenes/VillageScene3D';
import type { VillageBuildingConfig } from '../types/village';
import { COLORS } from './colors';

export class Village3DUI {
  private container: HTMLDivElement;
  private villageScene: VillageScene3D | null = null;
  private labelElement: HTMLDivElement;
  private currentBuildings: VillageBuildingConfig[] = [];
  private loadingOverlay: HTMLDivElement | null = null;
  private loadingBar: HTMLDivElement | null = null;
  private loadingText: HTMLDivElement | null = null;
  
  // Callbacks para abrir diferentes funcionalidades
  public onOpenNPC?: (npcId: string) => void;
  public onOpenShop?: () => void;
  public onOpenTemple?: () => void;
  public onOpenCraft?: () => void;
  public onOpenDungeons?: () => void;
  public onOpenRanch?: () => void;
  public onClose?: () => void;

  constructor() {
    // Container principal
    this.container = document.createElement('div');
    this.container.id = 'village-3d-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #87CEEB;
      z-index: 5;
      display: none;
    `;
    document.body.appendChild(this.container);
    
    // Label para nome da edificação
    this.labelElement = document.createElement('div');
    this.labelElement.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: ${COLORS.primary.amber};
      padding: 10px 20px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 16px;
      font-weight: bold;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 10;
    `;
    this.labelElement.textContent = 'Clique em uma edificação para interagir';
    this.container.appendChild(this.labelElement);
    
    // Botão de fechar
    const closeButton = document.createElement('button');
    closeButton.textContent = '← Voltar';
    closeButton.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      background: ${COLORS.primary.flame};
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      z-index: 10;
    `;
    closeButton.addEventListener('click', () => {
      this.hide();
      if (this.onClose) {
        this.onClose();
      }
    });
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = COLORS.primary.flameDark;
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = COLORS.primary.flame;
    });
    this.container.appendChild(closeButton);
    
    // Instruções
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 14px;
      text-align: center;
      z-index: 10;
    `;
    instructions.innerHTML = `
      <div>🖱️ Passe o mouse sobre as casas para ver o nome</div>
      <div>🖱️ Clique em uma casa para entrar</div>
    `;
    this.container.appendChild(instructions);
    
    // Criar overlay de loading
    this.createLoadingOverlay();
    
    console.log('[Village3DUI] Initialized');
  }

  /**
   * Cria overlay de loading com barra de progresso
   */
  private createLoadingOverlay(): void {
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 15, 30, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 100;
      font-family: monospace;
    `;

    const title = document.createElement('div');
    title.textContent = 'GUARDIAN GROVE';
    title.style.cssText = `
      font-size: 32px;
      font-weight: bold;
      color: ${COLORS.primary.gold};
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    `;
    this.loadingOverlay.appendChild(title);

    this.loadingText = document.createElement('div');
    this.loadingText.textContent = 'Carregando vila...';
    this.loadingText.style.cssText = `
      font-size: 18px;
      color: white;
      margin-bottom: 30px;
    `;
    this.loadingOverlay.appendChild(this.loadingText);

    // Container da barra de progresso
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 400px;
      height: 30px;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid ${COLORS.primary.amber};
      border-radius: 15px;
      overflow: hidden;
      position: relative;
    `;

    this.loadingBar = document.createElement('div');
    this.loadingBar.style.cssText = `
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, ${COLORS.primary.amber}, ${COLORS.primary.grove});
      transition: width 0.3s ease;
      box-shadow: 0 0 10px ${COLORS.primary.amber};
    `;
    progressContainer.appendChild(this.loadingBar);

    const progressText = document.createElement('div');
    progressText.id = 'loading-progress-text';
    progressText.textContent = '0%';
    progressText.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-weight: bold;
      font-size: 14px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    `;
    progressContainer.appendChild(progressText);

    this.loadingOverlay.appendChild(progressContainer);
    this.container.appendChild(this.loadingOverlay);
  }

  /**
   * Atualiza progresso do loading
   */
  private updateLoadingProgress(progress: number): void {
    if (this.loadingBar && this.loadingText) {
      const percentage = Math.round(progress * 100);
      this.loadingBar.style.width = `${percentage}%`;
      
      const progressText = this.loadingOverlay?.querySelector('#loading-progress-text') as HTMLDivElement;
      if (progressText) {
        progressText.textContent = `${percentage}%`;
      }

      if (progress < 0.3) {
        this.loadingText.textContent = 'Carregando modelos 3D...';
      } else if (progress < 0.6) {
        this.loadingText.textContent = 'Carregando texturas...';
      } else if (progress < 0.9) {
        this.loadingText.textContent = 'Preparando ambiente...';
      } else {
        this.loadingText.textContent = 'Quase lá...';
      }
    }
  }

  /**
   * Esconde overlay de loading
   */
  private hideLoadingOverlay(): void {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.opacity = '0';
      this.loadingOverlay.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        if (this.loadingOverlay && this.loadingOverlay.parentElement) {
          this.loadingOverlay.style.display = 'none';
        }
      }, 500);
    }
  }

  /**
   * Mostra a vila 3D
   */
  public async show(): Promise<void> {
    if (this.currentBuildings.length === 0) {
      console.warn('[Village3DUI] Nenhuma configuração de construção definida.');
    }

    this.container.style.display = 'block';
    
    // Mostrar loading overlay
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = 'flex';
      this.loadingOverlay.style.opacity = '1';
    }
    
    if (!this.villageScene) {
      this.createVillageScene();
      // Aguardar carregamento após criar a cena
      if (this.villageScene) {
        await this.villageScene.setBuildings(this.currentBuildings);
      }
    } else {
      await this.villageScene.setBuildings(this.currentBuildings);
    }
    
    console.log('[Village3DUI] Showing village');
  }

  /**
   * Esconde a vila 3D
   */
  public hide(): void {
    this.container.style.display = 'none';
    console.log('[Village3DUI] Hidden');
  }

  public async setBuildings(buildings: VillageBuildingConfig[]): Promise<void> {
    this.currentBuildings = buildings;
    if (this.villageScene) {
      await this.villageScene.setBuildings(buildings);
    }
  }

  /**
   * Cria a cena 3D da vila
   */
  private createVillageScene(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    // Criar cena vazia, setBuildings será chamado depois de forma async
    this.villageScene = new VillageScene3D(this.container, width, height, []);
    
    // Callback para cliques em edificações
    this.villageScene.onBuildingClick = (building) => {
      this.handleBuildingClick(building);
    };
    
    // Callback para hover
    this.villageScene.onBuildingHover = (building) => {
      if (building) {
        const lockedSuffix = building.isLocked ? ' (Bloqueado)' : '';
        this.labelElement.textContent = `${building.icon} ${building.label}${lockedSuffix}`;
        this.labelElement.style.opacity = '1';
      } else {
        this.labelElement.style.opacity = '0';
      }
    };

    // Callbacks para loading
    this.villageScene.onLoadingProgress = (progress) => {
      this.updateLoadingProgress(progress);
    };
    this.villageScene.onLoadingComplete = () => {
      this.hideLoadingOverlay();
    };
    
    // Resize handler
    window.addEventListener('resize', this.handleResize);
    
    console.log('[Village3DUI] Village scene created');
  }

  /**
   * Handle building click
   */
  private handleBuildingClick(building: VillageBuildingConfig): void {
    if (building.isLocked) {
      return;
    }

    // Esconder vila
    this.hide();
    
    // Abrir funcionalidade correspondente
    if (building.kind === 'npc') {
      if (building.npcId && this.onOpenNPC) {
        this.onOpenNPC(building.npcId);
      }
      return;
    }

    switch (building.facilityId) {
      case 'shop':
        this.onOpenShop?.();
        break;
      case 'temple':
        this.onOpenTemple?.();
        break;
      case 'alchemy':
        this.onOpenCraft?.();
        break;
      case 'dungeons':
        this.onOpenDungeons?.();
        break;
      case 'ranch':
        this.onOpenRanch?.();
        break;
      default:
        // Outros casos podem ser adicionados futuramente
        break;
    }
  }

  /**
   * Handle resize
   */
  private handleResize = (): void => {
    if (this.villageScene && this.container.style.display !== 'none') {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.villageScene.resize(width, height);
    }
  }

  /**
   * Dispose
   */
  public dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    
    if (this.villageScene) {
      this.villageScene.dispose();
      this.villageScene = null;
    }
    
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
    
    console.log('[Village3DUI] Disposed');
  }
}

