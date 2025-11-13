/**
 * Vila 3D Interativa - Guardian Grove
 * Cena dinâmica onde cada casa representa um NPC ou estrutura da vila.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VillageVillagers } from '../events/VillageVillagers';
import { VillageCritters } from '../events/VillageCritters';
import { getDayNightBlend, getAmbientLightIntensity, getSkyColor } from '../../utils/day-night';

import type { VillageBuildingConfig } from '../../types/village';

interface BuildingInstance {
  config: VillageBuildingConfig;
  group: THREE.Group;
  highlight: THREE.Mesh;
  isHovered: boolean;
  light: THREE.PointLight | null;
}

interface PrefabSpawnOptions {
  name?: string;
  position: [number, number, number];
  rotationY?: number;
  targetHeight?: number;
  verticalOffset?: number;
  scaleMultiplier?: number;
  randomRotation?: boolean;
}

export class VillageScene3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private animationId: number | null = null;

  private buildingGroup: THREE.Group;
  private buildings: BuildingInstance[] = [];
  private hoveredBuilding: BuildingInstance | null = null;
  private gltfLoader: GLTFLoader = new GLTFLoader();
  private templePrefab: THREE.Group | null = null;
  private treePrefabs: THREE.Group[] = [];
  private treePrefabsPromise: Promise<THREE.Group[]> | null = null;
  private flowerPrefabs: THREE.Group[] = [];
  private flowerPrefabsPromise: Promise<THREE.Group[]> | null = null;
  private rockPrefabs: THREE.Group[] = [];
  private rockPrefabsPromise: Promise<THREE.Group[]> | null = null;
  private tavernPrefab: THREE.Group | null = null;
  private tavernPrefabPromise: Promise<THREE.Group> | null = null;
  private craftPrefab: THREE.Group | null = null;
  private craftPrefabPromise: Promise<THREE.Group> | null = null;
  private marketPrefab: THREE.Group | null = null;
  private marketPrefabPromise: Promise<THREE.Group> | null = null;
  private dungeonPrefab: THREE.Group | null = null;
  private dungeonPrefabPromise: Promise<THREE.Group> | null = null;
  private environmentGroup: THREE.Group | null = null;
  private ranchPrefabCache = new Map<string, THREE.Group>();
  private housePrefabs: THREE.Group[] = [];
  private housePrefabsPromise: Promise<THREE.Group[]> | null = null;
  private villagers: VillageVillagers | null = null;
  private critters: VillageCritters | null = null;
  private lastFrameTime: number;
  private rainDrops: Array<{ mesh: THREE.Group; velocity: THREE.Vector3 }> = [];
  private isRaining = false;
  private rainDuration = 0;
  private nextRainTime = 0;
  private dungeonGroup: THREE.Group | null = null;
  private dungeonBaseY: number = 0;
  private dungeonFloatTime: number = 0;
  
  // Sistema de colisão
  private collisionZones: Array<{ x: number; z: number; radius: number }> = [];
  
  // Sistema de loading
  private isLoading: boolean = false;
  private loadingProgress: number = 0;
  private totalAssets: number = 0;
  private loadedAssets: number = 0;

  private mouseMoveHandler: (event: MouseEvent) => void;
  private clickHandler: (event: MouseEvent) => void;

  public onBuildingClick?: (building: VillageBuildingConfig) => void;
  public onBuildingHover?: (building: VillageBuildingConfig | null) => void;
  public onLoadingProgress?: (progress: number) => void;
  public onLoadingComplete?: () => void;

  constructor(
    container: HTMLElement,
    width: number,
    height: number,
    buildings: VillageBuildingConfig[],
  ) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 35, 110);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    this.camera.position.set(8, 24, 38);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.buildingGroup = new THREE.Group();
    this.scene.add(this.buildingGroup);

    this.setupLights();
    this.createGround();
    this.setupEventListeners();
    this.lastFrameTime = typeof performance !== 'undefined' ? performance.now() : 0;
    this.nextRainTime = this.getRandomRainDelay();
    
    // Inicializar sistema de critters
    this.critters = new VillageCritters(this.scene);
    
    this.animate();
    
    // setBuildings será chamado de forma async pelo Village3DUI após criar a cena
    // Não chamar aqui para evitar duplicação
    
    console.log('[VillageScene3D] Vila 3D inicializada');
  }

  private getRandomRainDelay(): number {
    // 10 minutos a 1 hora (600 a 3600 segundos)
    return 600 + Math.random() * 3000;
  }

  public async setBuildings(buildings: VillageBuildingConfig[]): Promise<void> {
    this.clearBuildings();
    this.isLoading = true;
    this.loadedAssets = 0;

    // Contar total de assets a carregar
    const uniqueVariants = new Set(buildings.map(b => b.variant));
    let assetCount = 0;
    if (uniqueVariants.has('house') || uniqueVariants.has('guild')) assetCount++;
    if (uniqueVariants.has('shop')) assetCount++;
    if (uniqueVariants.has('alchemy')) assetCount++;
    if (uniqueVariants.has('temple')) assetCount++;
    if (uniqueVariants.has('tavern')) assetCount++;
    if (uniqueVariants.has('dungeon')) assetCount++;
    assetCount += 3; // Árvores + flores + rochas
    this.totalAssets = assetCount;

    // Pré-carregar todos os assets necessários
    await this.preloadAllAssets(buildings);

    // Aguardar que todos os edifícios sejam realmente criados e seus prefabs carregados
    const buildingPromises: Promise<void>[] = [];

    for (const config of buildings) {
      const buildingPromise = this.createBuildingMeshAsync(config).then((group) => {
      group.position.set(config.position.x, config.position.y, config.position.z);
      if (config.rotation) {
        group.rotation.y = config.rotation;
      }
      group.castShadow = true;
      group.receiveShadow = true;
      group.userData.buildingId = config.id;

      const highlight = this.createHighlightCircle(config);
      highlight.position.set(config.position.x, 0.05, config.position.z);
      highlight.userData.buildingId = config.id;

        // Adicionar luz permanente para casas clicáveis (não bloqueadas)
        let buildingLight: THREE.PointLight | null = null;
        if (!config.isLocked) {
          buildingLight = new THREE.PointLight(
            config.highlightColor ?? 0xffffff,
            0.8,
            8,
            1.5
          );
          buildingLight.position.set(
            config.position.x,
            4,
            config.position.z
          );
          this.scene.add(buildingLight);
        }

      this.buildingGroup.add(group);
      this.buildingGroup.add(highlight);

      this.buildings.push({
        config,
        group,
        highlight,
        isHovered: false,
          light: buildingLight,
        });

        // Rastrear dungeon para animação de flutuação
        if (config.variant === 'dungeon') {
          this.dungeonGroup = group;
          this.dungeonBaseY = config.position.y;
        }

        // Adicionar zona de colisão para esta casa (raio padrão de 4 unidades)
        this.collisionZones.push({
          x: config.position.x,
          z: config.position.z,
          radius: 4.0, // Raio de colisão padrão para casas
        });
      });
      
      buildingPromises.push(buildingPromise);
    }
    
    // Aguardar todos os edifícios serem criados
    await Promise.all(buildingPromises);

    console.log(`[VillageScene3D] Carregado ${this.buildings.length} edifícios.`);
    this.rebuildVillagers();
    
    // Recriar decoração com sistema de colisão (agora que temos as zonas de colisão das casas)
    this.createDecoration();
    
    this.isLoading = false;
    if (this.onLoadingComplete) {
      this.onLoadingComplete();
    }
  }

  /**
   * Pré-carrega todos os assets necessários e rastreia progresso
   */
  private async preloadAllAssets(buildings: VillageBuildingConfig[]): Promise<void> {
    const loadPromises: Promise<any>[] = [];
    const uniqueVariants = new Set(buildings.map(b => b.variant));

    // Carregar prefabs de edifícios
    if (uniqueVariants.has('house') || uniqueVariants.has('guild')) {
      loadPromises.push(
        this.loadHousePrefabs().then(() => {
          this.updateLoadingProgress();
        })
      );
    }
    if (uniqueVariants.has('shop')) {
      loadPromises.push(
        this.loadMarketPrefab().then(() => {
          this.updateLoadingProgress();
        })
      );
    }
    if (uniqueVariants.has('alchemy')) {
      loadPromises.push(
        this.loadCraftPrefab().then(() => {
          this.updateLoadingProgress();
        })
      );
    }
    if (uniqueVariants.has('temple')) {
      loadPromises.push(
        this.loadTemplePrefab().then(() => {
          this.updateLoadingProgress();
        })
      );
    }
    if (uniqueVariants.has('tavern')) {
      loadPromises.push(
        this.loadTavernPrefab().then(() => {
          this.updateLoadingProgress();
        })
      );
    }
    if (uniqueVariants.has('dungeon')) {
      loadPromises.push(
        this.loadDungeonPrefab().then(() => {
          this.updateLoadingProgress();
        })
      );
    }

    // Carregar assets de ambiente
    loadPromises.push(
      this.loadTreePrefabs().then(() => {
        this.updateLoadingProgress();
      })
    );
    loadPromises.push(
      this.loadFlowerPrefabs().then(() => {
        this.updateLoadingProgress();
      })
    );
    loadPromises.push(
      this.loadRockPrefabs().then(() => {
        this.updateLoadingProgress();
      })
    );

    await Promise.all(loadPromises);
  }

  /**
   * Atualiza progresso de loading
   */
  private updateLoadingProgress(): void {
    this.loadedAssets++;
    this.loadingProgress = Math.min(this.loadedAssets / this.totalAssets, 1.0);
    if (this.onLoadingProgress) {
      this.onLoadingProgress(this.loadingProgress);
    }
  }

  /**
   * Verifica se uma posição está livre (não colide com casas ou outras árvores)
   */
  private isPositionFree(x: number, z: number, radius: number = 2.0): boolean {
    // Verificar colisão com casas
    for (const zone of this.collisionZones) {
      const dx = x - zone.x;
      const dz = z - zone.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance < zone.radius + radius) {
        return false;
      }
    }
    return true;
  }

  /**
   * Encontra uma posição livre próxima à posição desejada
   */
  private findFreePosition(desiredX: number, desiredZ: number, radius: number = 2.0, maxAttempts: number = 10): [number, number] | null {
    // Primeiro, tentar a posição desejada
    if (this.isPositionFree(desiredX, desiredZ, radius)) {
      return [desiredX, desiredZ];
    }

    // Tentar posições próximas em círculo
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const angle = (attempt / maxAttempts) * Math.PI * 2;
      const offset = radius * 2 * attempt;
      const newX = desiredX + Math.cos(angle) * offset;
      const newZ = desiredZ + Math.sin(angle) * offset;
      
      if (this.isPositionFree(newX, newZ, radius)) {
        return [newX, newZ];
      }
    }

    return null; // Não encontrou posição livre
  }

  private clearBuildings(): void {
    this.dungeonGroup = null;
    this.dungeonBaseY = 0;
    this.dungeonFloatTime = 0;
    this.collisionZones = [];
    for (const building of this.buildings) {
      this.disposeObject(building.group);
      this.disposeObject(building.highlight);
      if (building.light) {
        this.scene.remove(building.light);
        building.light.dispose();
      }
      this.buildingGroup.remove(building.group);
      this.buildingGroup.remove(building.highlight);
    }
    this.buildings = [];
    this.hoveredBuilding = null;
  }

  private disposeObject(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  private ambientLight: THREE.AmbientLight | null = null;
  private sunLight: THREE.DirectionalLight | null = null;
  private hemiLight: THREE.HemisphereLight | null = null;

  private setupLights(): void {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff2d5, 0.8);
    this.sunLight.position.set(18, 38, 18);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 120;
    this.sunLight.shadow.camera.left = -50;
    this.sunLight.shadow.camera.right = 50;
    this.sunLight.shadow.camera.top = 50;
    this.sunLight.shadow.camera.bottom = -50;
    this.scene.add(this.sunLight);

    this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x5c8a3a, 0.35);
    this.scene.add(this.hemiLight);
    
    // Atualizar iluminação inicial
    this.updateDayNightLighting();
  }
  
  /**
   * Atualiza iluminação baseado no tempo do dia
   */
  private updateDayNightLighting(): void {
    const blend = getDayNightBlend(); // 0 = dia, 1 = noite
    const skyColor = getSkyColor();
    
    // Atualizar cor do céu
    this.scene.background = new THREE.Color(skyColor.r, skyColor.g, skyColor.b);
    
    if (this.ambientLight) {
      // Ambiente: dia (0.65) -> noite (0.2)
      this.ambientLight.intensity = 0.2 + (0.45 * (1 - blend));
      
      // Cor ambiente: dia (branco) -> noite (azul escuro)
      const dayColor = 0xffffff;
      const nightColor = 0x1a1a2e;
      this.ambientLight.color.setHex(
        Math.floor(dayColor + (nightColor - dayColor) * blend)
      );
    }
    
    if (this.sunLight) {
      // Sol: dia (0.8) -> noite (0.1, quase apagado)
      this.sunLight.intensity = 0.1 + (0.7 * (1 - blend));
      
      // Cor do sol: dia (amarelo claro) -> noite (azul escuro)
      const daySunColor = 0xfff2d5;
      const nightSunColor = 0x2a3a5a;
      this.sunLight.color.setHex(
        Math.floor(daySunColor + (nightSunColor - daySunColor) * blend)
      );
      
      // Posição do sol: dia (alto) -> noite (baixo, abaixo do horizonte)
      const dayY = 38;
      const nightY = -10; // Abaixo do horizonte
      this.sunLight.position.y = dayY + (nightY - dayY) * blend;
    }
    
    if (this.hemiLight) {
      // Hemisphere: dia (0.35) -> noite (0.1)
      this.hemiLight.intensity = 0.1 + (0.25 * (1 - blend));
      
      // Cor hemisfério: dia (azul claro/verde) -> noite (azul escuro)
      const daySkyColor = 0x87ceeb;
      const nightSkyColor = 0x1a1a2e;
      const dayGroundColor = 0x5c8a3a;
      const nightGroundColor = 0x0f0f1e;
      
      this.hemiLight.color.setHex(
        Math.floor(daySkyColor + (nightSkyColor - daySkyColor) * blend)
      );
      this.hemiLight.groundColor.setHex(
        Math.floor(dayGroundColor + (nightGroundColor - dayGroundColor) * blend)
      );
    }
  }

  private createGround(): void {
    const groundGroup = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({ color: 0x5b9b59, roughness: 0.85 }),
    );
    base.rotation.x = -Math.PI / 2;
    base.receiveShadow = true;
    groundGroup.add(base);

    this.scene.add(groundGroup);
  }

  private createDecoration(): void {
    if (this.environmentGroup) {
      this.scene.remove(this.environmentGroup);
      this.environmentGroup = null;
    }

    const root = new THREE.Group();
    root.name = 'village-environment';
    this.environmentGroup = root;
    this.scene.add(root);

    // Posições das casas para evitar sobreposição:
    // Templo: (0, -25), Mercado: (-14, 4), Alquimia: (14, 4), Ruvian: (-18, -9)
    // Toran: (-8, -14), Eryon: (12, -10), Dungeon: (0, 15)
    const treePositions: Array<[number, number]> = [
      [-30, -16],
      [30, -16],
      [-32, 18],
      [32, 18],
      [-12, 26],
      [12, 26],
      [-24, -12], // OK - longe de Ruvian (-18, -9)
      [24, -8], // OK - longe de Eryon (12, -10)
      [-20, 12], // OK - longe de Ruvian (-18, -9)
      [20, 12], // OK - longe de Alquimia (14, 4) e Eryon (12, -10)
      [-38, 4], // OK - longe de Mercado (-14, 4)
      [38, 4], // OK - longe de Alquimia (14, 4)
      [-16, -24], // OK - longe de Toran (-8, -14)
      [16, -24], // OK - longe de Eryon (12, -10)
      [-4, 22], // Ajustada: estava em [-8, 20] muito próxima de Toran (-8, -14) e Templo (0, -25)
      [4, 22], // Ajustada: estava em [8, 20] muito próxima de Templo (0, -25)
      // Árvores adicionais evitando casas
      [-28, -22], // OK - longe de Ruvian (-18, -9)
      [28, -22], // OK - longe de Eryon (12, -10)
      [-36, 12], // OK - longe de Ruvian (-18, -9)
      [36, 12], // OK - longe de Alquimia (14, 4)
      [-14, 30], // OK - longe de Mercado (-14, 4)
      [14, 30], // OK - longe de Alquimia (14, 4)
      [-22, 2], // OK - longe de Ruvian (-18, -9) e Mercado (-14, 4)
      [22, 2], // OK - longe de Alquimia (14, 4)
      // Árvores ajustadas para evitar sobreposição
      [-10, -18], // Ajustada: estava muito próxima de Toran (-8, -14)
      [10, -18], // Ajustada: estava muito próxima de Eryon (12, -10)
    ];

    // Usar sistema de colisão para posicionar árvores
    const validTreePositions: Array<[number, number]> = [];
    treePositions.forEach(([desiredX, desiredZ], index) => {
      const freePos = this.findFreePosition(desiredX, desiredZ, 2.0);
      if (freePos) {
        validTreePositions.push(freePos);
        const tree = this.createTree(index);
        tree.position.set(freePos[0], 0, freePos[1]);
        root.add(tree);
        
        // Adicionar zona de colisão para esta árvore
        this.collisionZones.push({
          x: freePos[0],
          z: freePos[1],
          radius: 2.0,
        });
      } else {
        console.warn(`[VillageScene3D] Não foi possível encontrar posição livre para árvore ${index} em (${desiredX}, ${desiredZ})`);
      }
    });

    const flowerPositions: Array<[number, number]> = [
      [-4, 11],
      [4, 11],
      [-11, -2],
      [11, -2],
      [-7, 6],
      [7, 6],
      [-15, 1],
      [15, 1],
      [-2, -5],
      [2, -5],
      [-9, 15],
      [9, 15],
      [-18, -7],
      [18, -7],
      [-13, 9],
      [13, 9],
      [-5, -8],
      [5, -8],
      [-20, 3],
      [20, 3],
      // Mais flores espalhadas pelo chão verde
      [-1, 7],
      [1, 7],
      [-3, 3],
      [3, 3],
      [-6, -1],
      [6, -1],
      [-10, 5],
      [10, 5],
      [-12, -3],
      [12, -3],
      [-16, 8],
      [16, 8],
      [-19, -5],
      [19, -5],
      [-21, 1],
      [21, 1],
      [-8, 13],
      [8, 13],
      [-14, 11],
      [14, 11],
      [-17, -9],
      [17, -9],
      [-23, 5],
      [23, 5],
      [-25, -1],
      [25, -1],
      [-27, 9],
      [27, 9],
      [-29, -3],
      [29, -3],
      // Flores nas extremidades do chão verde
      [-35, 0],
      [35, 0],
      [0, -35],
      [0, 35],
      [-30, -20],
      [30, -20],
      [-30, 20],
      [30, 20],
      [-20, -30],
      [20, -30],
      [-20, 30],
      [20, 30],
      [-40, -10],
      [40, -10],
      [-40, 10],
      [40, 10],
      [-10, -40],
      [10, -40],
      [-10, 40],
      [10, 40],
    ];

    flowerPositions.forEach(([x, z], index) => {
      this.spawnRanchPrefab('/assets/3d/Ranch/Flower/Sunlit_Blossom_1111142848_texture.glb', {
        name: `village-flower-${index}`,
        position: [x, 0, z],
        rotationY: Math.random() * Math.PI * 2,
        targetHeight: 1.2,
        verticalOffset: -0.05,
        scaleMultiplier: 1.0,
      });
    });

    const rockPositions: Array<[number, number]> = [
      // Apenas algumas pedras no meio da vila (reduzidas)
      [-6, 14],
      [6, 14],
      [-14, 4],
      [14, 4],
      [-8, 7],
      [8, 7],
      [-12, 0],
      [12, 0],
      // Pedras nas extremidades do chão verde (aumentadas)
      [-38, 0],
      [38, 0],
      [0, -38],
      [0, 38],
      [-32, -22],
      [32, -22],
      [-32, 22],
      [32, 22],
      [-22, -32],
      [22, -32],
      [-22, 32],
      [22, 32],
      [-42, -12],
      [42, -12],
      [-42, 12],
      [42, 12],
      [-12, -42],
      [12, -42],
      [-12, 42],
      [12, 42],
      [-45, -20],
      [45, -20],
      [-45, 20],
      [45, 20],
      [-20, -45],
      [20, -45],
      [-20, 45],
      [20, 45],
      [-35, -30],
      [35, -30],
      [-35, 30],
      [35, 30],
      [-30, -35],
      [30, -35],
      [-30, 35],
      [30, 35],
      [-40, -25],
      [40, -25],
      [-40, 25],
      [40, 25],
      [-25, -40],
      [25, -40],
      [-25, 40],
      [25, 40],
    ];

    rockPositions.forEach(([x, z], index) => {
      this.spawnRanchPrefab('/assets/3d/Ranch/Rock/Stone1.glb', {
        name: `village-rock-${index}`,
        position: [x, 0, z],
        rotationY: Math.random() * Math.PI * 2,
        targetHeight: 1.0,
        verticalOffset: -0.1,
        scaleMultiplier: 0.8 + Math.random() * 0.4,
      });
    });

    const grassPatches: Array<{ position: [number, number, number]; rotation?: number }> = [
      { position: [-10, 0, 8], rotation: Math.PI * 0.15 },
      { position: [10, 0, 8], rotation: -Math.PI * 0.12 },
      { position: [-16, 0, -6], rotation: Math.PI * 0.4 },
      { position: [16, 0, -6], rotation: -Math.PI * 0.35 },
      { position: [0, 0, -10], rotation: Math.PI * 0.5 },
      { position: [-6, 0, 5], rotation: Math.PI * 0.25 },
      { position: [6, 0, 5], rotation: -Math.PI * 0.25 },
      { position: [-14, 0, 2], rotation: Math.PI * 0.3 },
      { position: [14, 0, 2], rotation: -Math.PI * 0.3 },
      { position: [-8, 0, -4], rotation: Math.PI * 0.2 },
      { position: [8, 0, -4], rotation: -Math.PI * 0.2 },
      { position: [-12, 0, 12], rotation: Math.PI * 0.35 },
      { position: [12, 0, 12], rotation: -Math.PI * 0.35 },
      { position: [-20, 0, -2], rotation: Math.PI * 0.45 },
      { position: [20, 0, -2], rotation: -Math.PI * 0.45 },
      { position: [-3, 0, 9], rotation: Math.PI * 0.18 },
      { position: [3, 0, 9], rotation: -Math.PI * 0.18 },
      { position: [-18, 0, 6], rotation: Math.PI * 0.4 },
      { position: [18, 0, 6], rotation: -Math.PI * 0.4 },
      { position: [-22, 0, -8], rotation: Math.PI * 0.5 },
      { position: [22, 0, -8], rotation: -Math.PI * 0.5 },
      { position: [-5, 0, -12], rotation: Math.PI * 0.22 },
      { position: [5, 0, -12], rotation: -Math.PI * 0.22 },
      // Dobrando a quantidade de gramas (100% a mais)
      { position: [-2, 0, 6], rotation: Math.PI * 0.16 },
      { position: [2, 0, 6], rotation: -Math.PI * 0.16 },
      { position: [-4, 0, 2], rotation: Math.PI * 0.21 },
      { position: [4, 0, 2], rotation: -Math.PI * 0.21 },
      { position: [-7, 0, -2], rotation: Math.PI * 0.26 },
      { position: [7, 0, -2], rotation: -Math.PI * 0.26 },
      { position: [-9, 0, 10], rotation: Math.PI * 0.31 },
      { position: [9, 0, 10], rotation: -Math.PI * 0.31 },
      { position: [-11, 0, 0], rotation: Math.PI * 0.36 },
      { position: [11, 0, 0], rotation: -Math.PI * 0.36 },
      { position: [-13, 0, -8], rotation: Math.PI * 0.41 },
      { position: [13, 0, -8], rotation: -Math.PI * 0.41 },
      { position: [-15, 0, 14], rotation: Math.PI * 0.46 },
      { position: [15, 0, 14], rotation: -Math.PI * 0.46 },
      { position: [-17, 0, 4], rotation: Math.PI * 0.51 },
      { position: [17, 0, 4], rotation: -Math.PI * 0.51 },
      { position: [-19, 0, -10], rotation: Math.PI * 0.56 },
      { position: [19, 0, -10], rotation: -Math.PI * 0.56 },
      { position: [-21, 0, 8], rotation: Math.PI * 0.61 },
      { position: [21, 0, 8], rotation: -Math.PI * 0.61 },
      { position: [-23, 0, -4], rotation: Math.PI * 0.66 },
      { position: [23, 0, -4], rotation: -Math.PI * 0.66 },
      { position: [-1, 0, 12], rotation: Math.PI * 0.19 },
      { position: [1, 0, 12], rotation: -Math.PI * 0.19 },
      { position: [-25, 0, 2], rotation: Math.PI * 0.71 },
      { position: [25, 0, 2], rotation: -Math.PI * 0.71 },
      { position: [-27, 0, -6], rotation: Math.PI * 0.76 },
      { position: [27, 0, -6], rotation: -Math.PI * 0.76 },
      { position: [-29, 0, 10], rotation: Math.PI * 0.81 },
      { position: [29, 0, 10], rotation: -Math.PI * 0.81 },
      // Gramas nas extremidades do chão verde
      { position: [-40, 0, 0], rotation: Math.PI * 0.3 },
      { position: [40, 0, 0], rotation: -Math.PI * 0.3 },
      { position: [0, 0, -40], rotation: Math.PI * 0.6 },
      { position: [0, 0, 40], rotation: -Math.PI * 0.6 },
      { position: [-35, 0, -25], rotation: Math.PI * 0.4 },
      { position: [35, 0, -25], rotation: -Math.PI * 0.4 },
      { position: [-35, 0, 25], rotation: Math.PI * 0.5 },
      { position: [35, 0, 25], rotation: -Math.PI * 0.5 },
      { position: [-25, 0, -35], rotation: Math.PI * 0.7 },
      { position: [25, 0, -35], rotation: -Math.PI * 0.7 },
      { position: [-25, 0, 35], rotation: Math.PI * 0.8 },
      { position: [25, 0, 35], rotation: -Math.PI * 0.8 },
      { position: [-45, 0, -15], rotation: Math.PI * 0.35 },
      { position: [45, 0, -15], rotation: -Math.PI * 0.35 },
      { position: [-45, 0, 15], rotation: Math.PI * 0.45 },
      { position: [45, 0, 15], rotation: -Math.PI * 0.45 },
      { position: [-15, 0, -45], rotation: Math.PI * 0.55 },
      { position: [15, 0, -45], rotation: -Math.PI * 0.55 },
      { position: [-15, 0, 45], rotation: Math.PI * 0.65 },
      { position: [15, 0, 45], rotation: -Math.PI * 0.65 },
      // Mais gramas nas extremidades
      { position: [-50, 0, 0], rotation: Math.PI * 0.4 },
      { position: [50, 0, 0], rotation: -Math.PI * 0.4 },
      { position: [0, 0, -50], rotation: Math.PI * 0.7 },
      { position: [0, 0, 50], rotation: -Math.PI * 0.7 },
      { position: [-48, 0, -15], rotation: Math.PI * 0.35 },
      { position: [48, 0, -15], rotation: -Math.PI * 0.35 },
      { position: [-48, 0, 15], rotation: Math.PI * 0.45 },
      { position: [48, 0, 15], rotation: -Math.PI * 0.45 },
      { position: [-15, 0, -48], rotation: Math.PI * 0.55 },
      { position: [15, 0, -48], rotation: -Math.PI * 0.55 },
      { position: [-15, 0, 48], rotation: Math.PI * 0.65 },
      { position: [15, 0, 48], rotation: -Math.PI * 0.65 },
      { position: [-42, 0, -25], rotation: Math.PI * 0.38 },
      { position: [42, 0, -25], rotation: -Math.PI * 0.38 },
      { position: [-42, 0, 25], rotation: Math.PI * 0.48 },
      { position: [42, 0, 25], rotation: -Math.PI * 0.48 },
      { position: [-25, 0, -42], rotation: Math.PI * 0.58 },
      { position: [25, 0, -42], rotation: -Math.PI * 0.58 },
      { position: [-25, 0, 42], rotation: Math.PI * 0.68 },
      { position: [25, 0, 42], rotation: -Math.PI * 0.68 },
    ];

    grassPatches.forEach((cfg, index) => {
      this.spawnRanchPrefab('/assets/3d/Ranch/Grass/Grass1.glb', {
        name: `village-grass-${index}`,
        position: cfg.position,
        rotationY: cfg.rotation,
        targetHeight: 1.6,
        verticalOffset: -0.1,
        scaleMultiplier: 1.1,
      });
    });

    const lanternPositions: Array<{ position: [number, number, number]; rotation?: number }> = [
      { position: [-9, 0, 7], rotation: Math.PI * 0.08 },
      { position: [9, 0, 7], rotation: -Math.PI * 0.08 },
      { position: [-6, 0, -6], rotation: Math.PI * 0.12 },
      { position: [6, 0, -6], rotation: -Math.PI * 0.12 },
    ];

    lanternPositions.forEach((cfg, index) => {
      const wrapper = this.spawnRanchPrefab('/assets/3d/Ranch/Lantern/Lantern1.glb', {
        name: `village-lantern-${index}`,
        position: cfg.position,
        rotationY: cfg.rotation,
        targetHeight: 3.4,
        verticalOffset: -0.15,
      });

      if (wrapper) {
        const light = new THREE.PointLight(0xfff3c4, 1.1, 11, 2);
        light.position.set(0, 2.2, 0);
        wrapper.add(light);
      }
    });

    // Montanhas formando um círculo uniforme e completo ao redor da vila
    // Distribuição circular com espaçamento uniforme
    const mountainCount = 48; // Número de montanhas ao redor do círculo
    const radius = 60; // Raio do círculo
    const mountainPositions: Array<{ position: [number, number, number]; rotation?: number; scale?: number }> = [];

    for (let i = 0; i < mountainCount; i++) {
      const angle = (i / mountainCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // Variação de escala para dar naturalidade (0.85 a 1.05)
      const scale = 0.85 + (Math.sin(i * 0.5) * 0.1) + (Math.random() * 0.1);
      
      // Rotação baseada no ângulo
      const rotation = angle + Math.PI / 2;
      
      mountainPositions.push({
        position: [x, 0, z],
        rotation,
        scale,
      });
    }

    mountainPositions.forEach((cfg, index) => {
      this.spawnRanchPrefab('/assets/3d/Ranch/Mountain/Mountain1.glb', {
        name: `village-mountain-${index}`,
        position: [cfg.position[0], -1.6, cfg.position[2]],
        rotationY: cfg.rotation,
        targetHeight: 20 * (cfg.scale ?? 1),
        verticalOffset: -1.2,
        scaleMultiplier: cfg.scale ?? 1,
      });
    });

    const houseAssets = [
      '/assets/3d/Ranch/House/House1.glb',
      '/assets/3d/Ranch/House/House2.glb',
      '/assets/3d/Ranch/House/House3.glb',
    ];

    const scenicHouses: Array<{ position: [number, number, number]; rotation?: number; index?: number }> = [
      { position: [-26, 0, -20], rotation: Math.PI * 0.18, index: 0 },
      { position: [26, 0, -22], rotation: -Math.PI * 0.22, index: 1 },
      { position: [-34, 0, 8], rotation: Math.PI * 0.08, index: 2 },
      { position: [34, 0, 10], rotation: -Math.PI * 0.1, index: 1 },
    ];

    scenicHouses.forEach((cfg, idx) => {
      const assetIndex = cfg.index ?? (idx % houseAssets.length);
      this.spawnRanchPrefab(houseAssets[assetIndex], {
        name: `village-house-scenic-${idx}`,
        position: cfg.position,
        rotationY: cfg.rotation,
        targetHeight: 6.4,
        verticalOffset: -0.2,
        scaleMultiplier: 1.05,
      });
    });

    this.rebuildVillagers();
  }

  private rebuildVillagers(): void {
    if (!this.environmentGroup) {
      return;
    }

    if (this.villagers) {
      this.villagers.dispose();
      this.villagers = null;
    }

    if (this.buildings.length === 0) {
      return;
    }

    const obstacles: { position: [number, number]; radius: number }[] = this.buildings.map((building) => {
      let radius = 3.2;
      switch (building.config.variant) {
        case 'temple':
          radius = 5.2;
          break;
        case 'shop':
          radius = 3.8;
          break;
        case 'dungeon':
          radius = 4.6;
          break;
        case 'guild':
          radius = 4;
          break;
        case 'tavern':
        case 'alchemy':
          radius = 3.6;
          break;
        default:
          radius = 3.1;
      }
      return {
        position: [building.config.position.x, building.config.position.z] as [number, number],
        radius,
      };
    });

    obstacles.push({ position: [0, 0], radius: 3.4 });

    this.villagers = new VillageVillagers(this.environmentGroup, this.gltfLoader, {
      radius: 23,
      innerRadius: 4,
      obstacles,
      count: 8,
    });

    this.villagers.populate().catch((error) => {
      console.error('[VillageScene3D] Falha ao instanciar villagers:', error);
    });
  }

  private createFountain(): THREE.Group {
    const group = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.8, 0.25, 20),
      new THREE.MeshStandardMaterial({ color: 0x9aa5b1, roughness: 0.6 }),
    );
    base.castShadow = true;
    group.add(base);

    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.35, 20),
      new THREE.MeshStandardMaterial({ color: 0x4f9dd3, roughness: 0.2, transparent: true, opacity: 0.85 }),
    );
    water.position.y = 0.3;
    group.add(water);

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 1.2, 12),
      new THREE.MeshStandardMaterial({ color: 0xb8c1cc, roughness: 0.4 }),
    );
    pillar.position.y = 0.9;
    pillar.castShadow = true;
    group.add(pillar);

    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xeaeaea, roughness: 0.4 }),
    );
    top.position.y = 1.6;
    top.castShadow = true;
    group.add(top);

    return group;
  }

  private createTree(index: number): THREE.Group {
    const wrapper = new THREE.Group();
    wrapper.name = `village-tree-${index}`;

    this.loadTreePrefabs()
      .then((prefabs) => {
        if (prefabs.length === 0) {
          throw new Error('No tree prefabs loaded');
        }
        const prefab = prefabs[index % prefabs.length] ?? prefabs[0];
        const clone = prefab.clone(true);
        this.prepareTreeModel(clone);
        wrapper.add(clone);
      })
      .catch((error) => {
        console.error('[VillageScene3D] Failed to load tree prefab. Falling back to procedural tree.', error);
        const fallback = this.createProceduralTree();
        wrapper.add(fallback);
      });

    return wrapper;
  }

  private createProceduralTree(): THREE.Group {
    const tree = new THREE.Group();

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x7b4a25, roughness: 0.9 }),
    );
    trunk.position.y = 1.6;
    trunk.castShadow = true;
    tree.add(trunk);

    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x2a8a2d, roughness: 0.7 });
    for (let i = 0; i < 3; i++) {
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(1.4 - i * 0.2, 10, 10), foliageMaterial);
      foliage.position.y = 3 + i * 0.9;
      foliage.castShadow = true;
      tree.add(foliage);
    }

    return tree;
  }

  private loadTreePrefabs(): Promise<THREE.Group[]> {
    if (this.treePrefabs.length > 0) {
      return Promise.resolve(this.treePrefabs);
    }

    if (this.treePrefabsPromise) {
      return this.treePrefabsPromise;
    }

    const treeFiles = ['/assets/3d/Ranch/Tree/Tree1.glb', '/assets/3d/Ranch/Tree/Tree2.glb'];
    this.treePrefabsPromise = Promise.all(
      treeFiles.map(
        (url) =>
          new Promise<THREE.Group>((resolve, reject) => {
            this.gltfLoader.load(
              url,
              (gltf) => {
                const scene = gltf.scene;
                scene.traverse((child) => {
                  if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                  }
                });
                resolve(scene);
              },
              undefined,
              (error) => reject(error),
            );
          }),
      ),
    )
      .then((prefabs) => {
        this.treePrefabs = prefabs;
        return this.treePrefabs;
      })
      .catch((error) => {
        this.treePrefabsPromise = null;
        throw error;
      });

    return this.treePrefabsPromise;
  }

  private prepareTreeModel(model: THREE.Group) {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Normalize pivot and scale to fit village proportions
    const initialBox = new THREE.Box3().setFromObject(model);
    const initialSize = initialBox.getSize(new THREE.Vector3());
    if (initialSize.y > 0) {
      const targetHeight = 5.6;
      const scale = targetHeight / initialSize.y;
      model.scale.setScalar(scale);
    }

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.position.y += size.y / 2;

    model.rotation.y = Math.random() * Math.PI * 2;
  }

  private loadHousePrefabs(): Promise<THREE.Group[]> {
    if (this.housePrefabs.length > 0) {
      return Promise.resolve(this.housePrefabs);
    }

    if (this.housePrefabsPromise) {
      return this.housePrefabsPromise;
    }

    const houseFiles = [
      '/assets/3d/Ranch/House/House1.glb',
      '/assets/3d/Ranch/House/House2.glb',
      '/assets/3d/Ranch/House/House3.glb',
    ];

    this.housePrefabsPromise = Promise.all(
      houseFiles.map(
        (url) =>
          new Promise<THREE.Group>((resolve, reject) => {
            this.gltfLoader.load(
              url,
              (gltf) => {
                const scene = gltf.scene;
                scene.traverse((child) => {
                  if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                      const materials = Array.isArray(child.material) ? child.material : [child.material];
                      child.material = materials.map((mat) => {
                        if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                          const cloned = mat.clone();
                          cloned.needsUpdate = true;
                          return cloned;
                        }
                        if ((mat as THREE.Material).clone) {
                          return (mat as THREE.Material).clone();
                        }
                        return mat;
                      }) as unknown as THREE.Material;
                    }
                  }
                });
                resolve(scene);
              },
              undefined,
              (error) => reject(error),
            );
          }),
      ),
    )
      .then((prefabs) => {
        this.housePrefabs = prefabs;
        return this.housePrefabs;
      })
      .catch((error) => {
        this.housePrefabsPromise = null;
        throw error;
      });

    return this.housePrefabsPromise;
  }

  private prepareHouseModel(model: THREE.Group) {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const initialBox = new THREE.Box3().setFromObject(model);
    const initialSize = initialBox.getSize(new THREE.Vector3());
    const desiredHeight = 6.2;
    if (initialSize.y > 0) {
      const scale = desiredHeight / initialSize.y;
      model.scale.setScalar(scale);
    }

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const minY = box.min.y;
    model.position.sub(center);
    model.position.y -= minY;
    model.position.y += 0.02;
  }

  private createFlower(index: number): THREE.Group {
    const wrapper = new THREE.Group();
    wrapper.name = `village-flower-${index}`;

    const fallback = this.createProceduralFlower(index);
    wrapper.add(fallback);

    this.loadFlowerPrefabs()
      .then((prefabs) => {
        if (prefabs.length === 0) {
          return;
        }
        const prefab = prefabs[index % prefabs.length] ?? prefabs[0];
        const clone = prefab.clone(true);
        this.prepareFlowerModel(clone, index);
        wrapper.remove(fallback);
        this.disposeObject(fallback);
        wrapper.add(clone);
      })
      .catch((error) => {
        console.error('[VillageScene3D] Failed to load flower prefab. Using procedural fallback.', error);
      });

    return wrapper;
  }

  private createProceduralFlower(index: number): THREE.Group {
    const group = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x2f7a36, roughness: 0.8 }),
    );
    stem.position.y = 0.3;
    stem.castShadow = true;
    group.add(stem);

    const petals = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 12),
      new THREE.MeshStandardMaterial({ color: this.getFlowerColor(index), roughness: 0.6 }),
    );
    petals.position.y = 0.68;
    petals.castShadow = true;
    group.add(petals);

    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xfff18f, roughness: 0.4 }),
    );
    center.position.y = 0.78;
    center.castShadow = true;
    group.add(center);

    return group;
  }

  private loadFlowerPrefabs(): Promise<THREE.Group[]> {
    if (this.flowerPrefabs.length > 0) {
      return Promise.resolve(this.flowerPrefabs);
    }

    if (this.flowerPrefabsPromise) {
      return this.flowerPrefabsPromise;
    }

    const flowerFiles = ['/assets/3d/Ranch/Flower/Sunlit_Blossom_1111142848_texture.glb'];
    this.flowerPrefabsPromise = Promise.all(
      flowerFiles.map(
        (url) =>
          new Promise<THREE.Group>((resolve, reject) => {
            this.gltfLoader.load(
              url,
              (gltf) => {
                const scene = gltf.scene;
                scene.traverse((child) => {
                  if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                      const materials = Array.isArray(child.material) ? child.material : [child.material];
                      child.material = materials.map((mat) => mat.clone()) as unknown as THREE.Material;
                    }
                  }
                });
                resolve(scene);
              },
              undefined,
              (error) => reject(error),
            );
          }),
      ),
    )
      .then((prefabs) => {
        this.flowerPrefabs = prefabs;
        return this.flowerPrefabs;
      })
      .catch((error) => {
        this.flowerPrefabsPromise = null;
        throw error;
      });

    return this.flowerPrefabsPromise;
  }

  private prepareFlowerModel(model: THREE.Group, index: number) {
    const color = new THREE.Color(this.getFlowerColor(index));
    const leafColor = new THREE.Color(0x2f7a36);

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            const name = (mat.name || '').toLowerCase();
            const current = mat.color.clone();
            if (name.includes('stem') || name.includes('leaf') || current.g > current.r) {
              mat.color.copy(leafColor);
            } else {
              mat.color.copy(color);
            }
            mat.needsUpdate = true;
          }
        });
      }
    });

    const targetHeight = 0.8;
    this.normaliseStaticModel(model, targetHeight, -0.08);
    model.rotation.y = Math.random() * Math.PI * 2;
  }

  private getFlowerColor(index: number): number {
    const palette = [0xffa0c0, 0xffd65c, 0xff9159, 0xb074ff];
    return palette[index % palette.length];
  }

  private createRock(index: number): THREE.Group {
    const wrapper = new THREE.Group();
    wrapper.name = `village-rock-${index}`;

    const fallback = this.createProceduralRock();
    wrapper.add(fallback);

    this.loadRockPrefabs()
      .then((prefabs) => {
        if (prefabs.length === 0) {
          return;
        }
        const prefab = prefabs[index % prefabs.length] ?? prefabs[0];
        const clone = prefab.clone(true);
        this.prepareRockModel(clone);
        wrapper.remove(fallback);
        this.disposeObject(fallback);
        wrapper.add(clone);
      })
      .catch((error) => {
        console.error('[VillageScene3D] Failed to load rock prefab. Using procedural fallback.', error);
      });

    return wrapper;
  }

  private createProceduralRock(): THREE.Group {
    const geometry = new THREE.DodecahedronGeometry(0.9, 0);
    const material = new THREE.MeshStandardMaterial({ color: 0x7b7f8a, roughness: 0.85 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }

  private loadRockPrefabs(): Promise<THREE.Group[]> {
    if (this.rockPrefabs.length > 0) {
      return Promise.resolve(this.rockPrefabs);
    }

    if (this.rockPrefabsPromise) {
      return this.rockPrefabsPromise;
    }

    const rockFiles = ['/assets/3d/Ranch/Rock/Stone1.glb'];
    this.rockPrefabsPromise = Promise.all(
      rockFiles.map(
        (url) =>
          new Promise<THREE.Group>((resolve, reject) => {
            this.gltfLoader.load(
              url,
              (gltf) => {
                const scene = gltf.scene;
                scene.traverse((child) => {
                  if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                      const materials = Array.isArray(child.material) ? child.material : [child.material];
                      child.material = materials.map((mat) => mat.clone()) as unknown as THREE.Material;
                    }
                  }
                });
                resolve(scene);
              },
              undefined,
              (error) => reject(error),
            );
          }),
      ),
    )
      .then((prefabs) => {
        this.rockPrefabs = prefabs;
        return this.rockPrefabs;
      })
      .catch((error) => {
        this.rockPrefabsPromise = null;
        throw error;
      });

    return this.rockPrefabsPromise;
  }

  private prepareRockModel(model: THREE.Group) {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.roughness = 0.9;
            mat.metalness = 0.05;
            mat.color.setHex(0x70757f);
            mat.needsUpdate = true;
          }
        });
      }
    });

    const targetHeight = 1.1;
    this.normaliseStaticModel(model, targetHeight, -0.12);
    model.rotation.y = Math.random() * Math.PI * 2;
  }

  private spawnRanchPrefab(url: string, options: PrefabSpawnOptions): THREE.Group | null {
    if (!this.environmentGroup) {
      return null;
    }

    const wrapper = new THREE.Group();
    if (options.name) {
      wrapper.name = options.name;
    }

    const [x, y, z] = options.position;
    wrapper.position.set(x, y, z);

    if (options.rotationY !== undefined) {
      wrapper.rotation.y = options.rotationY;
    } else if (options.randomRotation) {
      wrapper.rotation.y = Math.random() * Math.PI * 2;
    }

    if (options.scaleMultiplier && options.scaleMultiplier !== 1) {
      wrapper.scale.setScalar(options.scaleMultiplier);
    }

    this.environmentGroup.add(wrapper);

    this.loadRanchPrefab(url)
      .then((prefab) => {
        const clone = prefab.clone(true);
        this.prepareStaticPrefab(clone);

        if (options.targetHeight !== undefined) {
          this.normaliseStaticModel(clone, options.targetHeight, options.verticalOffset ?? 0);
        } else if (options.verticalOffset) {
          clone.position.y += options.verticalOffset;
        }

        wrapper.add(clone);
      })
      .catch((error) => {
        console.error(`[VillageScene3D] Falha ao carregar prefab ${url}:`, error);
      });

    return wrapper;
  }

  private loadRanchPrefab(url: string): Promise<THREE.Group> {
    const cached = this.ranchPrefabCache.get(url);
    if (cached) {
      return Promise.resolve(cached);
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const scene = gltf.scene;
          scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          this.ranchPrefabCache.set(url, scene);
          resolve(scene);
        },
        undefined,
        (error) => reject(error),
      );
    });
  }

  private normaliseStaticModel(model: THREE.Group, targetHeight: number, verticalOffset: number) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    if (size.y > 0) {
      const scale = targetHeight / size.y;
      model.scale.setScalar(scale);
    }

    const scaledBox = new THREE.Box3().setFromObject(model);
    const scaledSize = scaledBox.getSize(new THREE.Vector3());
    const center = scaledBox.getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.position.y += scaledSize.y / 2 + verticalOffset;
  }

  private createLampPost(): THREE.Group {
    const lamp = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.35, 0.4, 10),
      new THREE.MeshStandardMaterial({ color: 0x3a2a21, roughness: 0.7 }),
    );
    base.position.y = 0.2;
    base.castShadow = true;
    lamp.add(base);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.12, 3.4, 12),
      new THREE.MeshStandardMaterial({ color: 0x4a3a31, roughness: 0.6 }),
    );
    pole.position.y = 2.0;
    pole.castShadow = true;
    lamp.add(pole);

    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x2d2019, roughness: 0.5 }),
    );
    cap.position.y = 3.5;
    lamp.add(cap);

    const globeMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff3c4,
      emissive: 0xffdf9a,
      emissiveIntensity: 1.1,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2,
    });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), globeMaterial);
    globe.position.y = 3.2;
    lamp.add(globe);

    const light = new THREE.PointLight(0xffe4a0, 1.2, 10, 2);
    light.position.y = 3.3;
    lamp.add(light);

    return lamp;
  }

  private createFlowerBed(): THREE.Group {
    const group = new THREE.Group();

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0xd4b08c, roughness: 0.75 }),
    );
    rim.position.y = 0.15;
    rim.receiveShadow = true;
    group.add(rim);

    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.3, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x4d3725, roughness: 0.9 }),
    );
    soil.position.y = 0.3;
    group.add(soil);

    const flowerColors = [0xff8f8f, 0xffd75e, 0x8ce3ff, 0xc99bff];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const radius = 0.9 + Math.random() * 0.2;
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.22 + Math.random() * 0.08, 10, 10),
        new THREE.MeshStandardMaterial({
          color: flowerColors[i % flowerColors.length],
          roughness: 0.4,
        }),
      );
      flower.position.set(Math.cos(angle) * radius, 0.55 + Math.random() * 0.1, Math.sin(angle) * radius);
      flower.castShadow = true;
      group.add(flower);
    }

    return group;
  }

  private createHighlightCircle(config: VillageBuildingConfig): THREE.Mesh {
    const highlightColor = config.highlightColor ?? 0xffd257;
    const geometry = new THREE.CircleGeometry(2.4, 40);
    const material = new THREE.MeshBasicMaterial({
      color: highlightColor,
      transparent: true,
      opacity: 0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  private createBuildingMesh(config: VillageBuildingConfig): THREE.Group {
    switch (config.variant) {
      case 'shop':
        return this.createMarket(config);
      case 'alchemy':
        return this.createAlchemySanctum(config);
      case 'temple':
        return this.createTemple(config);
      case 'tavern':
        return this.createTavern(config);
      case 'dungeon':
        return this.createDungeon(config);
      case 'guild':
        return this.createPrefabHouse(config, 2);
      case 'house':
      default:
        return this.createPrefabHouse(config, 0);
    }
  }

  /**
   * Cria edifício de forma assíncrona, aguardando prefab carregar
   */
  private async createBuildingMeshAsync(config: VillageBuildingConfig): Promise<THREE.Group> {
    switch (config.variant) {
      case 'shop':
        return await this.createMarketAsync(config);
      case 'alchemy':
        return await this.createAlchemySanctumAsync(config);
      case 'temple':
        return await this.createTempleAsync(config);
      case 'tavern':
        return await this.createTavernAsync(config);
      case 'dungeon':
        return await this.createDungeonAsync(config);
      case 'guild':
        return await this.createPrefabHouseAsync(config, 2);
      case 'house':
      default:
        return await this.createPrefabHouseAsync(config, 0);
    }
  }

  private createMarket(config: VillageBuildingConfig): THREE.Group {
    const wrapper = new THREE.Group();
    const fallback = this.createProceduralMarket(config);
    fallback.visible = false; // Esconder fallback até que prefab carregue ou falhe
    wrapper.add(fallback);

    this.loadMarketPrefab()
      .then((prefab) => {
        const clone = prefab.clone(true);
        this.prepareMarketModel(clone);
        wrapper.remove(fallback);
        this.disposeObject(fallback);
        wrapper.add(clone);
      })
      .catch((error) => {
        console.error('[VillageScene3D] Falha ao carregar Market.glb, usando fallback procedural.', error);
        fallback.visible = true; // Mostrar fallback se prefab falhar
      });

    return wrapper;
  }

  private async createMarketAsync(config: VillageBuildingConfig): Promise<THREE.Group> {
    const wrapper = new THREE.Group();
    const fallback = this.createProceduralMarket(config);
    fallback.visible = false;
    wrapper.add(fallback);

    try {
      const prefab = await this.loadMarketPrefab();
      const clone = prefab.clone(true);
      this.prepareMarketModel(clone);
      wrapper.remove(fallback);
      this.disposeObject(fallback);
      wrapper.add(clone);
    } catch (error) {
      console.error('[VillageScene3D] Falha ao carregar Market.glb, usando fallback procedural.', error);
      fallback.visible = true;
    }

    return wrapper;
  }

  private createProceduralMarket(config: VillageBuildingConfig): THREE.Group {
    const market = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 2.4, 3.6),
      new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.7 }),
    );
    base.position.y = 1.2;
    base.castShadow = true;
    base.receiveShadow = true;
    market.add(base);

    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.25, 3.8),
      new THREE.MeshStandardMaterial({
        color: 0xfff3c4,
        roughness: 0.4,
        emissive: 0x4f3b26,
        emissiveIntensity: 0.08,
      }),
    );
    awning.position.set(0, 2.4, 0.2);
    awning.castShadow = true;
    market.add(awning);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(3.2, 1.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x8c4f34, roughness: 0.6 }),
    );
    roof.position.y = 3.4;
    roof.castShadow = true;
    market.add(roof);

    const stallMaterial = new THREE.MeshStandardMaterial({ color: 0xd9b27c, roughness: 0.55 });
    for (let i = -1; i <= 1; i++) {
      const stall = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.8), stallMaterial);
      stall.position.set(i * 1.1, 0.4, 1.6);
      stall.castShadow = true;
      stall.receiveShadow = true;
      market.add(stall);
    }

    const sign = this.createBillboardText(config.icon, 0.42);
    sign.position.set(0, 2.6, 2.1);
    market.add(sign);

    return market;
  }

  private loadMarketPrefab(): Promise<THREE.Group> {
    if (this.marketPrefab) {
      return Promise.resolve(this.marketPrefab);
    }
    if (this.marketPrefabPromise) {
      return this.marketPrefabPromise;
    }

    const candidates = ['/assets/3d/Village/Market.glb'];
    this.marketPrefabPromise = this.loadVillagePrefabCandidates(candidates)
      .then((prefab) => {
        this.marketPrefab = prefab;
        return prefab;
      })
      .catch((error) => {
        this.marketPrefabPromise = null;
        throw error;
      });

    return this.marketPrefabPromise;
  }

  private prepareMarketModel(model: THREE.Group) {
    this.prepareStaticPrefab(model);
    this.normaliseStaticModel(model, 6.0, -0.18);
  }

  private createPrefabHouse(config: VillageBuildingConfig, index: number): THREE.Group {
    const wrapper = new THREE.Group();
    const fallback = this.createProceduralHouse(config);
    fallback.visible = false; // Esconder fallback até que prefab carregue ou falhe
    wrapper.add(fallback);

    this.loadHousePrefabs()
      .then((prefabs) => {
        if (prefabs.length === 0) {
          fallback.visible = true; // Mostrar fallback se não houver prefabs
          return;
        }
        const prefab = prefabs[Math.abs(index) % prefabs.length] ?? prefabs[0];
        const clone = prefab.clone(true);
        this.prepareHouseModel(clone);
        wrapper.remove(fallback);
        this.disposeObject(fallback);
        wrapper.add(clone);
      })
      .catch((error) => {
        console.error('[VillageScene3D] Falha ao carregar House prefab, mantendo fallback procedural.', error);
        fallback.visible = true; // Mostrar fallback se prefab falhar
      });

    return wrapper;
  }

  private async createPrefabHouseAsync(config: VillageBuildingConfig, index: number): Promise<THREE.Group> {
    const wrapper = new THREE.Group();
    const fallback = this.createProceduralHouse(config);
    fallback.visible = false;
    wrapper.add(fallback);

    try {
      const prefabs = await this.loadHousePrefabs();
      if (prefabs.length === 0) {
        fallback.visible = true;
      } else {
        const prefab = prefabs[Math.abs(index) % prefabs.length] ?? prefabs[0];
        const clone = prefab.clone(true);
        this.prepareHouseModel(clone);
        wrapper.remove(fallback);
        this.disposeObject(fallback);
        wrapper.add(clone);
      }
    } catch (error) {
      console.error('[VillageScene3D] Falha ao carregar House prefab, mantendo fallback procedural.', error);
      fallback.visible = true;
    }

    return wrapper;
  }

  private createHouse(config: VillageBuildingConfig): THREE.Group {
    return this.createPrefabHouse(config, 0);
  }

  private createProceduralHouse(config: VillageBuildingConfig): THREE.Group {
    const house = new THREE.Group();

    const walls = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 2.6, 3.4),
      new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.75 }),
    );
    walls.position.y = 1.3;
    walls.castShadow = true;
    walls.receiveShadow = true;
    house.add(walls);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(2.8, 1.6, 4),
      new THREE.MeshStandardMaterial({ color: 0xcb623a, roughness: 0.85 }),
    );
    roof.position.y = 3.1;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.6, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x6a4630, roughness: 0.6 }),
    );
    door.position.set(0, 0.8, 1.75);
    house.add(door);

    const windowMaterial = new THREE.MeshStandardMaterial({ color: 0x8bd5ff, roughness: 0.2, metalness: 0 });
    const windowGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.12);

    const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    leftWindow.position.set(-1.1, 1.6, 1.76);
    house.add(leftWindow);

    const rightWindow = leftWindow.clone();
    rightWindow.position.x = 1.1;
    house.add(rightWindow);

    return house;
  }

  private createAlchemySanctum(config: VillageBuildingConfig): THREE.Group {
    const wrapper = new THREE.Group();
    const fallback = this.createProceduralAlchemy(config);
    fallback.visible = false; // Esconder fallback até que prefab carregue ou falhe
    wrapper.add(fallback);

    this.loadCraftPrefab()
      .then((prefab) => {
        const clone = prefab.clone(true);
        this.prepareCraftModel(clone);
        wrapper.remove(fallback);
        this.disposeObject(fallback);
        wrapper.add(clone);
      })
      .catch((error) => {
        console.error('[VillageScene3D] Falha ao carregar Craft.glb, usando fallback procedural.', error);
        fallback.visible = true; // Mostrar fallback se prefab falhar
      });

    return wrapper;
  }

  private async createAlchemySanctumAsync(config: VillageBuildingConfig): Promise<THREE.Group> {
    const wrapper = new THREE.Group();
    const fallback = this.createProceduralAlchemy(config);
    fallback.visible = false;
    wrapper.add(fallback);

    try {
      const prefab = await this.loadCraftPrefab();
      const clone = prefab.clone(true);
      this.prepareCraftModel(clone);
      wrapper.remove(fallback);
      this.disposeObject(fallback);
      wrapper.add(clone);
    } catch (error) {
      console.error('[VillageScene3D] Falha ao carregar Craft.glb, usando fallback procedural.', error);
      fallback.visible = true;
    }

    return wrapper;
  }

  private createProceduralAlchemy(config: VillageBuildingConfig): THREE.Group {
    const lab = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 2.6, 3.8),
      new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.6, metalness: 0.08 }),
    );
    base.position.y = 1.3;
    base.castShadow = true;
    base.receiveShadow = true;
    lab.add(base);

    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(4.1, 0.25, 4.1),
      new THREE.MeshStandardMaterial({ color: 0x6c58c9, roughness: 0.6 }),
    );
    trim.position.y = 2.4;
    trim.castShadow = true;
    lab.add(trim);

    const roof = new THREE.Mesh(
      new THREE.CylinderGeometry(0, 3.4, 2.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x503d92, roughness: 0.7 }),
    );
    roof.position.y = 3.4;
    roof.castShadow = true;
    lab.add(roof);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 20, 16),
      new THREE.MeshStandardMaterial({
        color: 0x7de8ff,
        roughness: 0.08,
        metalness: 0.2,
        transparent: true,
        opacity: 0.55,
      }),
    );
    dome.position.y = 4.5;
    dome.castShadow = true;
    lab.add(dome);

    const focusCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.5),
      new THREE.MeshStandardMaterial({
        color: 0xb7fffb,
        emissive: 0x4af7ff,
        emissiveIntensity: 1.2,
        roughness: 0.1,
        metalness: 0.4,
      }),
    );
    focusCrystal.position.y = 5.6;
    lab.add(focusCrystal);

    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2.0, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xd7ccff, roughness: 0.4 }),
    );
    doorFrame.position.set(0, 1.0, 1.95);
    lab.add(doorFrame);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.8, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x3a2d4f, roughness: 0.6 }),
    );
    door.position.set(0, 0.95, 1.96);
    lab.add(door);

    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.55, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x2f214a, roughness: 0.6 }),
    );
    signBoard.position.set(0, 2.7, 1.9);
    lab.add(signBoard);

    const signIcon = this.createBillboardText(config.icon, 0.42);
    signIcon.position.set(0, 2.7, 2.05);
    lab.add(signIcon);

    const cauldron = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.1, 0.9, 16, 1, false),
      new THREE.MeshStandardMaterial({ color: 0x2d334a, roughness: 0.45, metalness: 0.35 }),
    );
    cauldron.position.set(1.7, 0.45, 1.2);
    cauldron.castShadow = true;
    lab.add(cauldron);

    const cauldronRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.08, 12, 24),
      new THREE.MeshStandardMaterial({ color: 0x575f7d, roughness: 0.4 }),
    );
    cauldronRim.position.set(1.7, 0.9, 1.2);
    cauldronRim.rotation.x = Math.PI / 2;
    lab.add(cauldronRim);

    const brew = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.75, 0.22, 16),
      new THREE.MeshStandardMaterial({
        color: 0x71ffe0,
        emissive: 0x49ffd1,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.9,
      }),
    );
    brew.position.set(1.7, 0.95, 1.2);
    lab.add(brew);

    const bubbleMaterial = new THREE.MeshStandardMaterial({
      color: 0xaefcff,
      emissive: 0x6ef9ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
    });
    for (let i = 0; i < 3; i++) {
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.18 + i * 0.05, 10, 10), bubbleMaterial);
      bubble.position.set(1.7 + (i - 1) * 0.18, 1.1 + i * 0.15, 1.2 + (i % 2 === 0 ? 0.12 : -0.1));
      lab.add(bubble);
    }

    const vialMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.3,
    });
    const contents = [0xff7ebd, 0x7bffb4, 0xfff37a];
    for (let i = 0; i < 3; i++) {
      const vial = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.2, 12), vialMaterial);
      vial.position.set(-1.8 + i * 0.8, 1.0, 1.5);
      lab.add(vial);

      const stopper = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.25, 10),
        new THREE.MeshStandardMaterial({ color: 0x4d3b2c, roughness: 0.7 }),
      );
      stopper.position.set(-1.8 + i * 0.8, 1.7, 1.5);
      lab.add(stopper);

      const liquid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.2, 0.65, 12),
        new THREE.MeshStandardMaterial({
          color: contents[i],
          emissive: contents[i],
          emissiveIntensity: 0.35,
          transparent: true,
          opacity: 0.9,
        }),
      );
      liquid.position.set(-1.8 + i * 0.8, 0.75, 1.5);
      lab.add(liquid);
    }

    return lab;
  }

  private createTemple(config: VillageBuildingConfig): THREE.Group {
    const wrapper = new THREE.Group();
    wrapper.rotation.y = Math.PI; // Rotação de 180 graus no wrapper
    const fallback = this.createProceduralTemple(config);
    fallback.visible = false; // Esconder fallback até que prefab carregue ou falhe
    wrapper.add(fallback);

    this.loadTemplePrefab()
      .then((prefab) => {
        const clone = prefab.clone(true);
        this.prepareTempleModel(clone);
        wrapper.remove(fallback);
        this.disposeObject(fallback);
        wrapper.add(clone);
      })
      .catch((error) => {
        console.error('[VillageScene3D] Falha ao carregar Temple.glb, usando fallback procedural.', error);
        fallback.visible = true; // Mostrar fallback se prefab falhar
      });

    return wrapper;
  }

  private async createTempleAsync(config: VillageBuildingConfig): Promise<THREE.Group> {
    const wrapper = new THREE.Group();
    wrapper.rotation.y = Math.PI;
    const fallback = this.createProceduralTemple(config);
    fallback.visible = false;
    wrapper.add(fallback);

    try {
      const prefab = await this.loadTemplePrefab();
      const clone = prefab.clone(true);
      this.prepareTempleModel(clone);
      wrapper.remove(fallback);
      this.disposeObject(fallback);
      wrapper.add(clone);
    } catch (error) {
      console.error('[VillageScene3D] Falha ao carregar Temple.glb, usando fallback procedural.', error);
      fallback.visible = true;
    }

    return wrapper;
  }

  private createDungeon(config: VillageBuildingConfig): THREE.Group {
    const wrapper = new THREE.Group();
    const fallback = this.createProceduralDungeon(config);
    fallback.visible = false; // Esconder fallback até que prefab carregue ou falhe
    wrapper.add(fallback);

    this.loadDungeonPrefab()
      .then((prefab) => {
        const clone = prefab.clone(true);
        this.prepareDungeonModel(clone);
        wrapper.remove(fallback);
        this.disposeObject(fallback);
        wrapper.add(clone);
      })
      .catch((error) => {
        console.error('[VillageScene3D] Falha ao carregar Dungeon.glb, usando fallback procedural.', error);
        fallback.visible = true; // Mostrar fallback se prefab falhar
      });

    return wrapper;
  }

  private async createDungeonAsync(config: VillageBuildingConfig): Promise<THREE.Group> {
    const wrapper = new THREE.Group();
    const fallback = this.createProceduralDungeon(config);
    fallback.visible = false;
    wrapper.add(fallback);

    try {
      const prefab = await this.loadDungeonPrefab();
      const clone = prefab.clone(true);
      this.prepareDungeonModel(clone);
      wrapper.remove(fallback);
      this.disposeObject(fallback);
      wrapper.add(clone);
    } catch (error) {
      console.error('[VillageScene3D] Falha ao carregar Dungeon.glb, usando fallback procedural.', error);
      fallback.visible = true;
    }

    return wrapper;
  }

  private createProceduralDungeon(config: VillageBuildingConfig): THREE.Group {
    const dungeon = new THREE.Group();

    const foundation = new THREE.Mesh(
      new THREE.CylinderGeometry(3.4, 3.8, 1.2, 28),
      new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.72 }),
    );
    foundation.position.y = 0.6;
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    dungeon.add(foundation);

    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 3.2, 0.5, 28),
      new THREE.MeshStandardMaterial({ color: 0x334674, roughness: 0.58 }),
    );
    plinth.position.y = 1.1;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    dungeon.add(plinth);

    const archMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a7de0,
      roughness: 0.35,
      metalness: 0.2,
      emissive: 0x1c3ab4,
      emissiveIntensity: 0.25,
    });
    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.28, 28, 64), archMaterial);
    arch.position.y = 2.6;
    arch.rotation.x = Math.PI / 2;
    arch.castShadow = true;
    dungeon.add(arch);

    const portalMaterial = new THREE.MeshBasicMaterial({
      color: 0x7dc9ff,
      transparent: true,
      opacity: 0.68,
      side: THREE.DoubleSide,
    });
    const portal = new THREE.Mesh(new THREE.CircleGeometry(1.9, 48), portalMaterial);
    portal.position.y = 2.6;
    portal.rotation.x = Math.PI / 2;
    dungeon.add(portal);

    const swirlMaterial = new THREE.MeshBasicMaterial({
      color: 0x4f9cff,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const swirl = new THREE.Mesh(new THREE.RingGeometry(0.6, 2.3, 48, 1), swirlMaterial);
    swirl.position.y = 2.62;
    swirl.rotation.x = Math.PI / 2;
    dungeon.add(swirl);

    const obeliskMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c2744,
      roughness: 0.5,
      metalness: 0.15,
    });
    for (const offset of [-1.4, 1.4]) {
      const obelisk = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.6, 0.6), obeliskMaterial);
      obelisk.position.set(offset, 1.9, 1.3);
      obelisk.castShadow = true;
      dungeon.add(obelisk);

      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.35),
        new THREE.MeshStandardMaterial({
          color: 0x90d2ff,
          emissive: 0x60c1ff,
          emissiveIntensity: 0.9,
          transparent: true,
          opacity: 0.85,
        }),
      );
      crystal.position.set(offset, 3.15, 1.3);
      dungeon.add(crystal);
    }

    const steps = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.5, 2.6),
      new THREE.MeshStandardMaterial({ color: 0x2c3556, roughness: 0.6 }),
    );
    steps.position.set(0, 0.25, 1.6);
    steps.castShadow = true;
    steps.receiveShadow = true;
    dungeon.add(steps);

    const emblem = this.createBillboardText(config.icon, 0.5);
    emblem.position.set(0, 3.4, 0.12);
    dungeon.add(emblem);

    return dungeon;
  }

  private createProceduralTemple(config: VillageBuildingConfig): THREE.Group {
    const temple = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(6.8, 3.2, 6),
      new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.6 }),
    );
    base.position.y = 1.6;
    base.castShadow = true;
    base.receiveShadow = true;
    temple.add(base);

    const roof = new THREE.Mesh(
      new THREE.CylinderGeometry(0, 4.6, 3.4, 6),
      new THREE.MeshStandardMaterial({ color: 0xb7a0e3, roughness: 0.8 }),
    );
    roof.position.y = 3.8;
    roof.castShadow = true;
    temple.add(roof);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
    );
    dome.position.y = 5.1;
    temple.add(dome);

    const columnMaterial = new THREE.MeshStandardMaterial({ color: 0xf2ebff, roughness: 0.4 });
    for (let i = -2; i <= 2; i += 2) {
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3.2, 12), columnMaterial);
      column.position.set(i, 1.6, 2.9);
      column.castShadow = true;
      temple.add(column);
    }

    const stairs = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.6, 3),
      new THREE.MeshStandardMaterial({ color: 0xd8c7ff, roughness: 0.6 }),
    );
    stairs.position.set(0, 0.3, 3.2);
    temple.add(stairs);

    const emblem = this.createBillboardText(config.icon, 0.6);
    emblem.position.set(0, 3, 3.6);
    temple.add(emblem);

    return temple;
  }

  private loadTemplePrefab(): Promise<THREE.Group> {
    if (this.templePrefab) {
      return Promise.resolve(this.templePrefab);
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        '/assets/3d/Village/Temple.glb',
        (gltf) => {
          gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          this.templePrefab = gltf.scene;
          resolve(this.templePrefab);
        },
        undefined,
        (error) => reject(error),
      );
    });
  }

  private prepareTempleModel(model: THREE.Group) {
    const desiredHeight = 9.5;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    if (size.y > 0) {
      const scale = desiredHeight / size.y;
      model.scale.setScalar(scale);
    }

    const scaledBox = new THREE.Box3().setFromObject(model);
    const center = scaledBox.getCenter(new THREE.Vector3());
    const minY = scaledBox.min.y;
    model.position.sub(center);
    model.position.y -= minY;
    model.position.y += 0.05;
    model.rotation.y = Math.PI;

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  private loadDungeonPrefab(): Promise<THREE.Group> {
    if (this.dungeonPrefab) {
      return Promise.resolve(this.dungeonPrefab);
    }
    if (this.dungeonPrefabPromise) {
      return this.dungeonPrefabPromise;
    }

    const candidates = ['/assets/3d/Village/Dungeon.glb'];
    this.dungeonPrefabPromise = this.loadVillagePrefabCandidates(candidates)
      .then((prefab) => {
        this.dungeonPrefab = prefab;
        return prefab;
      })
      .catch((error) => {
        this.dungeonPrefabPromise = null;
        throw error;
      });

    return this.dungeonPrefabPromise;
  }

  private prepareDungeonModel(model: THREE.Group) {
    this.prepareStaticPrefab(model);
    this.normaliseStaticModel(model, 7.2, -0.05);
  }

  private loadTavernPrefab(): Promise<THREE.Group> {
    if (this.tavernPrefab) {
      return Promise.resolve(this.tavernPrefab);
    }
    if (this.tavernPrefabPromise) {
      return this.tavernPrefabPromise;
    }

    const candidates = ['/assets/3d/Village/Tavern.glb', '/assets/3d/Village/TavernHouse.glb'];
    this.tavernPrefabPromise = this.loadVillagePrefabCandidates(candidates)
      .then((prefab) => {
        this.tavernPrefab = prefab;
        return prefab;
      })
      .catch((error) => {
        this.tavernPrefabPromise = null;
        throw error;
      });

    return this.tavernPrefabPromise;
  }

  private prepareTavernModel(model: THREE.Group) {
    this.prepareStaticPrefab(model);
    this.normaliseStaticModel(model, 6.2, 0);
  }

  private loadCraftPrefab(): Promise<THREE.Group> {
    if (this.craftPrefab) {
      return Promise.resolve(this.craftPrefab);
    }
    if (this.craftPrefabPromise) {
      return this.craftPrefabPromise;
    }

    const candidates = [
      '/assets/3d/Village/Craft.glb',
      '/assets/3d/Village/CraftHouse.glb',
      '/assets/3d/Village/Alchemy.glb',
    ];
    this.craftPrefabPromise = this.loadVillagePrefabCandidates(candidates)
      .then((prefab) => {
        this.craftPrefab = prefab;
        return prefab;
      })
      .catch((error) => {
        this.craftPrefabPromise = null;
        throw error;
      });

    return this.craftPrefabPromise;
  }

  private prepareCraftModel(model: THREE.Group) {
    this.prepareStaticPrefab(model);
    this.normaliseStaticModel(model, 6.5, -0.35);
  }

  private prepareStaticPrefab(model: THREE.Group) {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          const clonedMaterials = materials.map((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
              const cloned = mat.clone();
              cloned.needsUpdate = true;
              return cloned;
            }
            if ((mat as THREE.Material).clone) {
              return (mat as THREE.Material).clone();
            }
            return mat;
          });

          child.material = Array.isArray(child.material)
            ? (clonedMaterials as THREE.Material[])
            : (clonedMaterials[0] as THREE.Material);
        }
      }
    });
  }

  private loadVillagePrefabCandidates(candidates: string[]): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      const tryLoad = (index: number) => {
        if (index >= candidates.length) {
          reject(new Error(`Nenhum dos modelos pôde ser carregado: ${candidates.join(', ')}`));
          return;
        }

        const url = candidates[index];
        this.gltfLoader.load(
          url,
          (gltf) => {
            const scene = gltf.scene;
            scene.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            resolve(scene);
          },
          undefined,
          (error) => {
            console.warn(`[VillageScene3D] Falha ao carregar ${url}:`, error);
            tryLoad(index + 1);
          },
        );
      };

      tryLoad(0);
    });
  }

  private createTavern(config: VillageBuildingConfig): THREE.Group {
    const wrapper = new THREE.Group();
    const fallback = this.createHouse(config);
    fallback.visible = false; // Esconder fallback até que prefab carregue ou falhe
    wrapper.add(fallback);

    this.loadTavernPrefab()
      .then((prefab) => {
        const clone = prefab.clone(true);
        this.prepareTavernModel(clone);
        wrapper.remove(fallback);
        this.disposeObject(fallback);
        wrapper.add(clone);
      })
      .catch((error) => {
        console.error('[VillageScene3D] Falha ao carregar Tavern.glb, usando fallback procedural.', error);
        fallback.visible = true; // Mostrar fallback se prefab falhar
      });

    return wrapper;
  }

  private async createTavernAsync(config: VillageBuildingConfig): Promise<THREE.Group> {
    const wrapper = new THREE.Group();
    const fallback = this.createHouse(config);
    fallback.visible = false;
    wrapper.add(fallback);

    try {
      const prefab = await this.loadTavernPrefab();
      const clone = prefab.clone(true);
      this.prepareTavernModel(clone);
      wrapper.remove(fallback);
      this.disposeObject(fallback);
      wrapper.add(clone);
    } catch (error) {
      console.error('[VillageScene3D] Falha ao carregar Tavern.glb, usando fallback procedural.', error);
      fallback.visible = true;
    }

    return wrapper;
  }

  private createBillboardText(icon: string, scale: number): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '180px sans-serif';
      ctx.fillText(icon, canvas.width / 2, canvas.height / 2 + 10);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(scale * 2, scale * 2), material);
    plane.renderOrder = 10;
    return plane;
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    this.mouseMoveHandler = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.updateHover();
    };

    this.clickHandler = () => {
      if (this.hoveredBuilding && this.onBuildingClick && !this.hoveredBuilding.config.isLocked) {
        this.onBuildingClick(this.hoveredBuilding.config);
      }
    };

    canvas.addEventListener('mousemove', this.mouseMoveHandler);
    canvas.addEventListener('click', this.clickHandler);

    canvas.style.cursor = 'default';
  }

  private updateHover(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.buildingGroup.children, true);

    if (this.hoveredBuilding) {
      const material = this.hoveredBuilding.highlight.material as THREE.MeshBasicMaterial;
      material.opacity = 0;
      this.hoveredBuilding.isHovered = false;
    }

    if (intersects.length === 0) {
      this.hoveredBuilding = null;
      this.renderer.domElement.style.cursor = 'default';
      this.onBuildingHover?.(null);
      return;
    }

    const targetBuilding = this.findBuildingFromObject(intersects[0].object);
    if (!targetBuilding) {
      this.hoveredBuilding = null;
      this.renderer.domElement.style.cursor = 'default';
      this.onBuildingHover?.(null);
      return;
    }

    this.hoveredBuilding = targetBuilding;
    this.hoveredBuilding.isHovered = true;
    const material = this.hoveredBuilding.highlight.material as THREE.MeshBasicMaterial;
    material.opacity = this.hoveredBuilding.config.isLocked ? 0.15 : 0.35;
    material.color.setHex(this.hoveredBuilding.config.highlightColor ?? 0xffd257);
    this.renderer.domElement.style.cursor = this.hoveredBuilding.config.isLocked ? 'not-allowed' : 'pointer';
    this.onBuildingHover?.(this.hoveredBuilding.config);
  }

  private findBuildingFromObject(object: THREE.Object3D): BuildingInstance | null {
    let current: THREE.Object3D | null = object;
    while (current) {
      const buildingId = current.userData.buildingId;
      if (buildingId) {
        return this.buildings.find((b) => b.config.id === buildingId) ?? null;
      }
      current = current.parent as THREE.Object3D;
    }
    return null;
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const delta = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    if (this.villagers) {
      this.villagers.update(delta);
    }

    // Sistema de critters
    if (this.critters) {
      this.critters.update(delta);
    }

    // Atualizar iluminação dia/noite
    this.updateDayNightLighting();

    // Sistema de chuva
    this.updateRain(delta);

    // Animar flutuação da dungeon
    this.updateDungeonFloat(delta);

    this.renderer.render(this.scene, this.camera);
  };

  private updateDungeonFloat(delta: number): void {
    if (this.dungeonGroup) {
      this.dungeonFloatTime += delta;
      // Movimento senoidal sutil: amplitude de 0.15 unidades, período de ~3 segundos
      const floatOffset = Math.sin(this.dungeonFloatTime * 2.0) * 0.15;
      this.dungeonGroup.position.y = this.dungeonBaseY + floatOffset;
    }
  }

  private updateRain(delta: number): void {
    this.nextRainTime -= delta;

    if (!this.isRaining && this.nextRainTime <= 0) {
      this.spawnRain();
      this.isRaining = true;
      this.rainDuration = 120; // 2 minutos
    }

    if (this.isRaining) {
      this.rainDuration -= delta;

      if (this.rainDuration <= 0) {
        this.isRaining = false;
        this.removeAllRain();
        this.nextRainTime = this.getRandomRainDelay();
      }
    }

    // Atualizar movimento das gotas
    for (let i = this.rainDrops.length - 1; i >= 0; i--) {
      const drop = this.rainDrops[i];
      drop.mesh.position.add(
        new THREE.Vector3(
          drop.velocity.x * delta,
          drop.velocity.y * delta,
          drop.velocity.z * delta
        )
      );

      // Remover se caiu muito abaixo do chão
      if (drop.mesh.position.y < -5) {
        this.scene.remove(drop.mesh);
        this.rainDrops.splice(i, 1);
      }
    }
  }

  private spawnRain(): void {
    const dropCount = 80 + Math.floor(Math.random() * 40); // 80-120 gotas

    for (let i = 0; i < dropCount; i++) {
      const dropGroup = new THREE.Group();

      const dropGeometry = new THREE.CylinderGeometry(0.02, 0.015, 0.18, 4);
      const dropMaterial = new THREE.MeshToonMaterial({
        color: 0x87ceeb,
        transparent: true,
        opacity: 0.7,
      });
      const drop = new THREE.Mesh(dropGeometry, dropMaterial);
      dropGroup.add(drop);

      const x = (Math.random() - 0.5) * 120;
      const z = (Math.random() - 0.5) * 120;
      const startY = 8 + Math.random() * 6;

      dropGroup.position.set(x, startY, z);
      this.scene.add(dropGroup);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        -7 - Math.random() * 2,
        0
      );

      this.rainDrops.push({
        mesh: dropGroup,
        velocity,
      });
    }
  }

  private removeAllRain(): void {
    for (const drop of this.rainDrops) {
      this.scene.remove(drop.mesh);
    }
    this.rainDrops = [];
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.villagers) {
      this.villagers.dispose();
      this.villagers = null;
    }

    if (this.critters) {
      this.critters.dispose();
      this.critters = null;
    }

    this.removeAllRain();

    if (this.environmentGroup) {
      this.scene.remove(this.environmentGroup);
      this.environmentGroup = null;
    }

    this.clearBuildings();

    const canvas = this.renderer.domElement;
    canvas.removeEventListener('mousemove', this.mouseMoveHandler);
    canvas.removeEventListener('click', this.clickHandler);

    this.renderer.dispose();
    if (canvas.parentElement) {
      canvas.parentElement.removeChild(canvas);
    }

    console.log('[VillageScene3D] Disposed');
  }
}

