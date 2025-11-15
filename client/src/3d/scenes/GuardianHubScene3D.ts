/**
 * Guardian Hub Scene 3D
 * Composes the new Guardian Grove hub using existing ranch/village assets
 * and lightweight Three.js primitives for bespoke elements (árvore casa, poço, quadro, ponte).
 */

import * as THREE from 'three';

import { ThreeScene } from '../ThreeScene';
import { BeastModel } from '../models/BeastModel';
import { getSkyColor } from '../../utils/day-night';
import { VillageCritters } from '../events/VillageCritters';

const WORLD_Y_OFFSET = -1.15;

export class GuardianHubScene3D {
  private threeScene: ThreeScene;
  private canvas: HTMLCanvasElement;
  private decorationsRoot: THREE.Group | null = null;
  private walkableGround: THREE.Mesh | null = null;
  private invisibleWall: THREE.Mesh | null = null;
  private readonly GROUND_RADIUS = 36;
  private beastModel: BeastModel | null = null;
  private beastGroup: THREE.Group | null = null;
  private activeRigAnimation: 'idle' | 'walk' | null = null;
  private idleAnimation: (() => void) | null = null;
  private baseYPosition = WORLD_Y_OFFSET - 0.46;
  private needsFit = false;
  private isMoving = false;
  private currentTarget: THREE.Vector3 | null = null;
  private lastPlayerPosition = new THREE.Vector3();
  private nextMoveTime = 0;
  
  // WASD Controls
  private wasdKeys = { w: false, a: false, s: false, d: false };
  private wasdMovement = new THREE.Vector3();
  private elapsedTime = 0;

  private interactionCallback?: (id: string) => void;
  private hoverCallback?: (id: string | null) => void;
  private manualControl = false;
  private particlesSystem: THREE.Points | null = null;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private cameraOffset = new THREE.Vector3(0, 5.8, 10.4);
  private cameraFollowStrength = 0.12;
  private inputEnabled = true;
  private critters: VillageCritters | null = null;
  
  // Ghost system (other players)
  private ghostPlayers: Map<string, {
    model: BeastModel;
    group: THREE.Group;
    nametag: THREE.Sprite;
    targetPosition: THREE.Vector3;
    currentPosition: THREE.Vector3;
  }> = new Map();
  private lastPositionSaveTime = 0;
  private lastGhostFetchTime = 0;
  private readonly POSITION_SAVE_INTERVAL = 0.5; // Save every 0.5 seconds for ultra-smooth updates
  private readonly GHOST_FETCH_INTERVAL = 1.0; // Fetch every 1 second for real-time feel

  // Exploration portal (Dungeon entrance)
  private explorationPortal: THREE.Group | null = null;
  private readonly PORTAL_POSITION = new THREE.Vector3(10, WORLD_Y_OFFSET, 0);
  private readonly PORTAL_INTERACTION_DISTANCE = 3.5;
  private isNearPortal = false;
  private nearExploration = false;
  private explorationPromptCallback?: () => void;
  
  // Posições dos buildings interativos
  private readonly CRAFT_POSITION = new THREE.Vector3(-20, WORLD_Y_OFFSET, -5);
  private readonly MARKET_POSITION = new THREE.Vector3(18, WORLD_Y_OFFSET, 5);
  private readonly MISSION_POSITION = new THREE.Vector3(-5, WORLD_Y_OFFSET, 20);
  private readonly BUILDING_INTERACTION_DISTANCE = 5.0;
  
  // Estados de proximidade
  private isNearCraft = false;
  private isNearMarket = false;
  private isNearMission = false;
  
  // Modelos 3D dos buildings (para clique)
  private craftModel: THREE.Group | null = null;
  private marketModel: THREE.Group | null = null;
  private missionModel: THREE.Group | null = null;
  
  // Callbacks para interações
  private craftCallback?: () => void;
  private marketCallback?: () => void;
  private missionCallback?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.threeScene = new ThreeScene(canvas);

    // eslint-disable-next-line no-console
    console.log('[GuardianHubScene3D] constructor - canvas attached');

    // Fallback forte: escutar cliques em toda a janela e redirecionar
    // para a cena 3D quando o clique cair dentro da área do canvas.
    window.addEventListener('click', (event: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const insideX = event.clientX >= rect.left && event.clientX <= rect.right;
      const insideY = event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!insideX || !insideY) {
        return;
      }

      // eslint-disable-next-line no-console
      console.log('[GuardianHubScene3D] Global click dentro do canvas', {
        clientX: event.clientX,
        clientY: event.clientY,
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      });

      this.handlePointerClick(event.clientX, event.clientY, rect);
    });
    
    // WASD Controls
    window.addEventListener('keydown', (event) => {
      if (this.isTypingInInput(event)) {
        this.resetWASDKeys();
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'w') this.wasdKeys.w = true;
      if (key === 'a') this.wasdKeys.a = true;
      if (key === 's') this.wasdKeys.s = true;
      if (key === 'd') this.wasdKeys.d = true;
    });

    window.addEventListener('keyup', (event) => {
      if (this.isTypingInInput(event)) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'w') this.wasdKeys.w = false;
      if (key === 'a') this.wasdKeys.a = false;
      if (key === 's') this.wasdKeys.s = false;
      if (key === 'd') this.wasdKeys.d = false;
    });
    
    this.setupEnvironment();
    this.critters = new VillageCritters(this.threeScene.getScene());
  }

  private skyboxMesh: THREE.Mesh | null = null;
  
  private setupEnvironment() {
    const scene = this.threeScene.getScene();
    const camera = this.threeScene.getCamera() as THREE.PerspectiveCamera;

    camera.fov = 44;
    camera.position.set(0.8, 5.8, 10.4);
    camera.lookAt(0, WORLD_Y_OFFSET + 1.0, 0);
    camera.updateProjectionMatrix();

    // Carrega skybox com movimento de nuvens
    this.createAnimatedSkybox();
    
    // Fog suave
    const fogColor = new THREE.Color(0.6, 0.8, 1.0);
    scene.fog = new THREE.Fog(fogColor, 40, 80);
    
    // Luz ambiente forte para clarear tudo
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    // Luz direcional simulando sol
    const sunLight = new THREE.DirectionalLight(0xffffee, 1.2);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    scene.add(sunLight);

    this.rebuildDecorations();
  }
  
  private createAnimatedSkybox() {
    const scene = this.threeScene.getScene();
    
    // Carrega textura do skybox
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/assets/Skybox.jpg',
      (texture) => {
        // Cria geometria esférica grande
        const skyGeo = new THREE.SphereGeometry(500, 60, 40);
        
        // Material com a textura
        const skyMat = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.BackSide, // Renderiza por dentro
        });
        
        this.skyboxMesh = new THREE.Mesh(skyGeo, skyMat);
        this.skyboxMesh.position.set(0, 0, 0);
        scene.add(this.skyboxMesh);
        
        console.log('[HUB] 🌤️ Skybox carregado com sucesso!');
      },
      undefined,
      (error) => {
        console.error('[HUB] ❌ Erro ao carregar skybox:', error);
        // Fallback: cor sólida
        scene.background = new THREE.Color(0.6, 0.8, 1.0);
      }
    );
  }

  private rebuildDecorations() {
    this.clearDecorations();

    this.decorationsRoot = new THREE.Group();
    this.decorationsRoot.position.y = WORLD_Y_OFFSET;
    this.threeScene.addObject(this.decorationsRoot);

    // Chão verde + vila dos guardiões
    this.createProceduralGround();
    this.createExplorationPortal(); // Portal da dungeon para exploração
    this.createVillageAssets(); // Houses, Temple, Grass, etc.
    this.createLightingProps();
    this.createAmbientParticles();
    
    // Dungeon como ponto de entrada para exploração
    this.createExplorationEntrance();
  }

  private clearDecorations() {
    if (this.particlesSystem && this.decorationsRoot) {
      this.decorationsRoot.remove(this.particlesSystem);
    }
    this.particlesSystem = null;
    this.walkableGround = null;
    this.manualControl = false;

    if (this.decorationsRoot) {
      this.disposeObject(this.decorationsRoot);
      this.threeScene.removeObject(this.decorationsRoot);
      this.decorationsRoot = null;
    }
  }

  private createProceduralGround() {
    // Único chão visível: disco verde tipo ilha/floresta
    const geometry = new THREE.CircleGeometry(this.GROUND_RADIUS, 72);

    const material = new THREE.MeshStandardMaterial({
      color: 0x2d5016, // Verde floresta escuro
      roughness: 0.78,
      metalness: 0.04,
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = WORLD_Y_OFFSET;
    ground.receiveShadow = true;
    this.walkableGround = ground;
    this.addDecoration(ground);
    
    // Cria paredes invisíveis ao redor do círculo
    this.createInvisibleWalls();
  }
  
  private createInvisibleWalls() {
    // Parede circular invisível ao redor do chão
    const wallHeight = 10; // Altura suficiente para bloquear
    const wallThickness = 0.5;
    const segments = 64; // Mais segmentos = parede mais circular
    
    // Cria um cilindro oco (parede circular)
    const outerRadius = this.GROUND_RADIUS - 1; // Um pouco menor que o chão para não aparecer fora
    const innerRadius = outerRadius - wallThickness;
    
    // Cria geometria personalizada para parede circular
    const geometry = new THREE.CylinderGeometry(
      outerRadius,    // radiusTop
      outerRadius,    // radiusBottom
      wallHeight,     // height
      segments,       // radialSegments
      1,              // heightSegments
      true            // openEnded (sem tampa)
    );
    
    // Material invisível mas com colisão
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    
    const wall = new THREE.Mesh(geometry, material);
    wall.position.y = WORLD_Y_OFFSET + wallHeight / 2; // Centraliza verticalmente
    
    // Importante: marca como objeto de colisão
    wall.userData.isWall = true;
    
    this.invisibleWall = wall;
    this.addDecoration(wall);
    console.log('[HUB] 🧱 Paredes invisíveis criadas ao redor do chão (raio:', outerRadius, ')');
  }

  private async createExplorationPortal() {
    // Carrega o asset 3D "Explorar.glb"
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();
    
    try {
      const gltf = await loader.loadAsync('/assets/3d/Village/Explorar.glb');
      this.explorationPortal = gltf.scene;
      
      // Posiciona o portal (ajustado para cima)
      const portalPos = this.PORTAL_POSITION.clone();
      portalPos.y += 1.5; // Sobe 1.5 unidades para não afundar
      this.explorationPortal.position.copy(portalPos);
      this.explorationPortal.scale.set(3.0, 3.0, 3.0); // 2x maior (era 1.5, agora 3.0)
      
      // Torna clicável
      this.explorationPortal.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          // Não adiciona emissive para manter cor original
        }
      });
      
      this.threeScene.addObject(this.explorationPortal);
      console.log('[HUB] 🏰 Portal de exploração (Explorar.glb) carregado com escala 3.0!');
    } catch (error) {
      console.error('[HUB] ❌ Erro ao carregar Explorar.glb:', error);
      // Fallback: cria um portal simples procedural
      this.createFallbackPortal();
    }
  }

  private createFallbackPortal() {
    // Portal simples caso o asset não carregue
    const portalGroup = new THREE.Group();
    
    // Base da dungeon (pedra)
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.5, 3),
      new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.8 })
    );
    base.position.y = 0.25;
    base.castShadow = true;
    base.receiveShadow = true;
    portalGroup.add(base);
    
    // Arco/Portal
    const leftPillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 3, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x303030, roughness: 0.7 })
    );
    leftPillar.position.set(-1, 2, 0);
    leftPillar.castShadow = true;
    portalGroup.add(leftPillar);
    
    const rightPillar = leftPillar.clone();
    rightPillar.position.set(1, 2, 0);
    portalGroup.add(rightPillar);
    
    const arch = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x303030, roughness: 0.7 })
    );
    arch.position.set(0, 3.5, 0);
    arch.castShadow = true;
    portalGroup.add(arch);
    
    // Efeito de portal (plano brilhante)
    const portalEffect = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 3),
      new THREE.MeshStandardMaterial({
        color: 0x4488ff,
        emissive: 0x4488ff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      })
    );
    portalEffect.position.set(0, 2, 0);
    portalGroup.add(portalEffect);
    
    portalGroup.position.copy(this.PORTAL_POSITION);
    this.explorationPortal = portalGroup;
    this.threeScene.addObject(portalGroup);
    
    console.log('[HUB] 🏰 Portal de exploração (fallback) criado!');
  }

  private createProceduralRiver() {
    const riverGroup = new THREE.Group();
    const pathPoints = [
      new THREE.Vector3(-2.2, WORLD_Y_OFFSET + 0.05, 0.5),
      new THREE.Vector3(-0.5, WORLD_Y_OFFSET + 0.05, 1.1),
      new THREE.Vector3(1.4, WORLD_Y_OFFSET + 0.05, 1.5),
      new THREE.Vector3(3.0, WORLD_Y_OFFSET + 0.05, 2.1),
    ];

    const tubePath = new THREE.CatmullRomCurve3(pathPoints);
    const tubeGeometry = new THREE.TubeGeometry(tubePath, 60, 0.4, 12, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x49b6ff,
      metalness: 0.1,
      roughness: 0.35,
      transparent: true,
      opacity: 0.85,
      emissive: 0x0e3c5c,
      emissiveIntensity: 0.25,
    });

    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.castShadow = false;
    tube.receiveShadow = false;
    riverGroup.add(tube);

    this.addDecoration(riverGroup);
  }

  private createProceduralStructures() {
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xdac5a5,
      roughness: 0.7,
      metalness: 0.12,
    });
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f8068,
      roughness: 0.58,
      metalness: 0.16,
    });

    const placeHouse = (x: number, z: number, rotation: number) => {
      const house = new THREE.Group();
      house.position.set(x, WORLD_Y_OFFSET + 0.2, z);
      house.rotation.y = rotation;

      const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 1.8), baseMaterial);
      body.castShadow = true;
      body.receiveShadow = true;
      house.add(body);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.0, 4), roofMaterial);
      roof.position.y = 1.2;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      house.add(roof);

      this.addDecoration(house);
    };

    placeHouse(2.0, 0.0, Math.PI * 0.18);
    placeHouse(1.5, 1.8, -Math.PI * 0.1);

    const well = new THREE.Group();
    well.position.set(0.4, WORLD_Y_OFFSET + 0.05, 0.9);

    const wellBase = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.5, 16), new THREE.MeshStandardMaterial({
      color: 0x8d92a0,
      roughness: 0.8,
    }));
    wellBase.castShadow = true;
    wellBase.receiveShadow = true;
    well.add(wellBase);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.5, 6), roofMaterial);
    roof.position.y = 0.8;
    roof.castShadow = true;
    well.add(roof);

    this.addDecoration(well);
  }

  private createProceduralDecor() {
    const decorGroup = new THREE.Group();

    const makeTree = (x: number, z: number, scale = 1) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * scale, 0.2 * scale, 0.9 * scale, 6));
      trunk.material = new THREE.MeshStandardMaterial({ color: 0x5d3b1f, roughness: 0.8 });
      trunk.position.set(x, WORLD_Y_OFFSET + 0.45 * scale, z);
      trunk.castShadow = true;
      decorGroup.add(trunk);

      for (let i = 0; i < 3; i++) {
        const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.55 * scale, 10, 10));
        canopy.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0x3f9259).offsetHSL(0, 0, (Math.random() - 0.5) * 0.08),
          roughness: 0.62,
          metalness: 0.08,
        });
        canopy.position.set(x + (Math.random() - 0.5) * 0.2, WORLD_Y_OFFSET + 0.95 * scale + i * 0.15, z + (Math.random() - 0.5) * 0.2);
        canopy.castShadow = true;
        decorGroup.add(canopy);
      }
    };

    const makeRock = (x: number, z: number, scale = 1) => {
      const geometry = new THREE.IcosahedronGeometry(0.35 * scale, 1);
      const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < positions.count; i++) {
        const xPos = positions.getX(i);
        const yPos = positions.getY(i);
        const zPos = positions.getZ(i);
        const jitter = (Math.random() - 0.5) * 0.08 * scale;
        positions.setXYZ(i, xPos + jitter, yPos + jitter, zPos + jitter);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: 0x8c909c, roughness: 0.86 })
      );
      mesh.position.set(x, WORLD_Y_OFFSET + 0.2 * scale, z);
      mesh.castShadow = true;
      decorGroup.add(mesh);
    };

    makeTree(-0.8, 1.5, 0.9);
    makeTree(1.2, 2.1, 0.8);
    makeTree(2.4, 0.8, 0.7);

    makeRock(-1.4, 0.3, 1.0);
    makeRock(0.2, 1.0, 0.8);
    makeRock(1.8, 2.0, 0.9);

    this.addDecoration(decorGroup);
  }

  private async createVillageAssets() {
    // Carrega GLTF Loader
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();
    
    try {
      // Houses (3 casas espalhadas) - House1 ajustada (mais para trás e para baixo)
      const housePositions = [
        { path: '/assets/3d/Ranch/House/House1.glb', position: new THREE.Vector3(-15, WORLD_Y_OFFSET + 2.1, -15), scale: 3.6, lanternOffset: new THREE.Vector3(3, -2.4, 0) }, // Subiu um pouco
        { path: '/assets/3d/Ranch/House/House2.glb', position: new THREE.Vector3(12, WORLD_Y_OFFSET + 2.4, -12), scale: 3.6, lanternOffset: new THREE.Vector3(-3, -2.6, 0) },
        { path: '/assets/3d/Ranch/House/House3.glb', position: new THREE.Vector3(-12, WORLD_Y_OFFSET + 2.4, 15), scale: 3.6, lanternOffset: new THREE.Vector3(3, -2.6, 0) },
      ];
      
      for (const house of housePositions) {
        const gltf = await loader.loadAsync(house.path);
        const houseModel = gltf.scene;
        houseModel.position.copy(house.position);
        houseModel.scale.setScalar(house.scale);
        houseModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        this.addDecoration(houseModel);
        
        // Adiciona lanterna ao lado da casa (ajustada para o chão)
        await this.addLantern(loader, house.position.clone().add(house.lanternOffset));
      }
      
      // Temple (templo central) - 4X MAIOR, altura ajustada (desceu um pouco)
      const templeGltf = await loader.loadAsync('/assets/3d/Village/Temple.glb');
      const templeModel = templeGltf.scene;
      templeModel.position.set(0, WORLD_Y_OFFSET + 2.9, -18); // Desceu de 3.2 para 2.9
      templeModel.scale.setScalar(5.5); // 4x maior (aumentou de 4.5 para 5.5)
      templeModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.addDecoration(templeModel);
      
      // Lanternas ao redor do templo (subidas um pouco)
      await this.addLantern(loader, new THREE.Vector3(-5, WORLD_Y_OFFSET + 0.6, -18));
      await this.addLantern(loader, new THREE.Vector3(5, WORLD_Y_OFFSET + 0.6, -18));
      
      // Craft (oficina de craft) - 4X MAIOR, sobe mais um pouco
      const craftGltf = await loader.loadAsync('/assets/3d/Village/Craft.glb');
      this.craftModel = craftGltf.scene;
      this.craftModel.position.set(-20, WORLD_Y_OFFSET + 4.2, -5); // Subiu mais um pouco
      this.craftModel.scale.setScalar(5.2); // 4x maior
      this.craftModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.craftModel.userData.interaction = 'craft'; // Marca para interação
      this.addDecoration(this.craftModel);
      await this.addLantern(loader, new THREE.Vector3(-22, WORLD_Y_OFFSET + 0.6, -5));
      
      // Market (loja) - Lanterna subida
      const marketGltf = await loader.loadAsync('/assets/3d/Village/Market.glb');
      this.marketModel = marketGltf.scene;
      this.marketModel.position.set(18, WORLD_Y_OFFSET + 1.4, 5);
      this.marketModel.scale.setScalar(3.9); // 3x maior (1.3 -> 3.9)
      this.marketModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.marketModel.userData.interaction = 'market'; // Marca para interação
      this.addDecoration(this.marketModel);
      await this.addLantern(loader, new THREE.Vector3(20, WORLD_Y_OFFSET + 0.6, 5));
      
      // Mission Board (quadro de missões) - Aumenta tamanho e desce um pouquinho
      const missionGltf = await loader.loadAsync('/assets/3d/Village/Mission.glb');
      this.missionModel = missionGltf.scene;
      this.missionModel.position.set(-5, WORLD_Y_OFFSET + 1.6, 20); // Subiu um pouco para destacar a placa
      this.missionModel.scale.setScalar(2.0); // Aumentou de 1.3 para 2.0
      this.missionModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.missionModel.userData.interaction = 'missions'; // Marca para interação
      this.addDecoration(this.missionModel);
      await this.addLantern(loader, new THREE.Vector3(-5, WORLD_Y_OFFSET + 0.6, 22));
      
      // Grass (grama espalhada - agora 40 tufos)
      for (let i = 0; i < 40; i++) {
        const grassGltf = await loader.loadAsync('/assets/3d/Ranch/Grass/Grass1.glb');
        const grassModel = grassGltf.scene.clone();
        
        // Posição aleatória dentro do círculo
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * (this.GROUND_RADIUS - 5);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        grassModel.position.set(x, WORLD_Y_OFFSET + 0.5, z); // Subiu um pouco mais
        grassModel.scale.setScalar(0.8 + Math.random() * 0.4);
        grassModel.rotation.y = Math.random() * Math.PI * 2;
        
        this.addDecoration(grassModel);
      }
      
      // Procedural flowers (cores suaves espalhadas pelo santuário)
      const flowerColors = [0xffb3c6, 0xffdf70, 0xb7e4c7, 0xffcfe1, 0xf7aef8];
      const flowerCount = 36;
      for (let i = 0; i < flowerCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 6 + Math.random() * (this.GROUND_RADIUS - 8);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Evitar área muito central para não atrapalhar o jogador
        if (Math.abs(x) < 2 && Math.abs(z) < 2) {
          continue;
        }
        
        const flowerGroup = new THREE.Group();
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6),
          new THREE.MeshStandardMaterial({ color: 0x3b8d4a, roughness: 0.6 })
        );
        stem.position.set(0, WORLD_Y_OFFSET + 0.27, 0);
        
        const blossom = new THREE.Mesh(
          new THREE.SphereGeometry(0.14, 12, 12),
          new THREE.MeshStandardMaterial({
            color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
            emissive: 0x331111,
            emissiveIntensity: 0.15,
          })
        );
        blossom.position.set(0, WORLD_Y_OFFSET + 0.6, 0);
        
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0x4caf50 })
        );
        leaf.scale.set(1.6, 0.4, 0.8);
        leaf.position.set(0.08, WORLD_Y_OFFSET + 0.35, 0);
        
        flowerGroup.add(stem);
        flowerGroup.add(blossom);
        flowerGroup.add(leaf);
        flowerGroup.position.set(x, 0, z);
        
        this.addDecoration(flowerGroup);
      }
      
      // Trees (algumas árvores nas bordas) - AJUSTADO para cima
      const treePositions = [
        { x: -20, z: 5 },
        { x: 20, z: 8 },
        { x: 8, z: 20 },
        { x: -10, z: -20 },
        { x: 15, z: -15 },
      ];
      
      for (const pos of treePositions) {
        const treeGltf = await loader.loadAsync('/assets/3d/Ranch/Tree/Tree1.glb');
        const treeModel = treeGltf.scene;
        treeModel.position.set(pos.x, WORLD_Y_OFFSET + 2.8, pos.z); // Subiu um pouco mais para alinhar com o solo
        treeModel.scale.setScalar(3.0); // 2x maior (era 1.5, agora 3.0)
        treeModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        this.addDecoration(treeModel);
      }
      
      console.log('[HUB] 🏘️ Vila dos guardiões criada com sucesso!');
    } catch (error) {
      console.error('[HUB] ❌ Erro ao carregar assets da vila:', error);
    }
  }
  
  private async addLantern(loader: any, position: THREE.Vector3) {
    try {
      const lanternGltf = await loader.loadAsync('/assets/3d/Ranch/Lantern/Lantern1.glb');
      const lanternModel = lanternGltf.scene.clone();
      lanternModel.position.copy(position);
      lanternModel.scale.setScalar(0.8);
      
      // Adiciona luz pontual na lanterna
      const light = new THREE.PointLight(0xffaa55, 0.5, 8);
      light.position.set(0, 1, 0);
      lanternModel.add(light);
      
      lanternModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      this.addDecoration(lanternModel);
    } catch (error) {
      console.error('[HUB] ❌ Erro ao carregar lanterna:', error);
    }
  }
  
  private createLightingProps() {
    if (!this.decorationsRoot) {
      return;
    }

    const addLight = (
      position: THREE.Vector3,
      color: number,
      intensity: number,
      distance: number,
      decay = 2,
    ) => {
      const light = new THREE.PointLight(color, intensity, distance, decay);
      light.position.copy(position);
      light.castShadow = false;
      this.decorationsRoot?.add(light);
      return light;
    };

    addLight(new THREE.Vector3(-3.2, WORLD_Y_OFFSET + 2.6, -0.2), 0xffe4a8, 0.9, 7.5);
    addLight(new THREE.Vector3(3.4, WORLD_Y_OFFSET + 2.4, 2.6), 0x8fe3ff, 0.75, 7.0, 2.2);
    addLight(new THREE.Vector3(2.4, WORLD_Y_OFFSET + 2.8, -0.2), 0xfff1c8, 0.6, 7.8, 2.3);
    addLight(new THREE.Vector3(-0.3, WORLD_Y_OFFSET + 2.4, 1.4), 0xcdf2ff, 0.55, 7.5, 2.3);

    const fireflyMaterial = new THREE.MeshBasicMaterial({ color: 0xfcefb4 });
    const fireflyGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const addFirefly = (x: number, y: number, z: number, intensity = 0.45) => {
      const mesh = new THREE.Mesh(fireflyGeometry, fireflyMaterial);
      mesh.position.set(x, y, z);
      this.decorationsRoot?.add(mesh);

      const light = new THREE.PointLight(0xfff5c0, intensity, 3.2, 2.6);
      light.position.copy(mesh.position);
      light.castShadow = false;
      this.decorationsRoot?.add(light);
    };

    addFirefly(-2.8, WORLD_Y_OFFSET + 2.3, -0.9, 0.45);
    addFirefly(-0.4, WORLD_Y_OFFSET + 2.1, 0.6, 0.38);
    addFirefly(2.2, WORLD_Y_OFFSET + 2.5, 1.8, 0.42);
  }

  private createAmbientParticles() {
    if (!this.decorationsRoot) {
      return;
    }

    const count = 140;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const initial = new Float32Array(count * 3);
    const offsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const radius = (5 + Math.random() * 5) * 2; // Raio 2x maior para preencher mais o ar
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 1.4 + Math.random() * 2.5;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      initial[i * 3] = x;
      initial[i * 3 + 1] = y;
      initial[i * 3 + 2] = z;
      offsets[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const texture = this.createRadialTexture(64, [
      { offset: 0, color: 'rgba(255,255,255,0.9)' },
      { offset: 0.4, color: 'rgba(255,255,255,0.4)' },
      { offset: 1, color: 'rgba(255,255,255,0)' },
    ]);

    const material = new THREE.PointsMaterial({
      map: texture,
      transparent: true,
      opacity: 0.85,
      color: 0xcfffd6,
      size: 0.28,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.particlesSystem = new THREE.Points(geometry, material);
    this.particlesSystem.position.y = WORLD_Y_OFFSET + 0.8;
    this.particlesSystem.userData.initialPositions = initial;
    this.particlesSystem.userData.offsets = offsets;

    this.decorationsRoot.add(this.particlesSystem);
  }

  private resetWASDKeys() {
    this.wasdKeys.w = false;
    this.wasdKeys.a = false;
    this.wasdKeys.s = false;
    this.wasdKeys.d = false;
    this.wasdMovement.set(0, 0, 0);
  }

  private isTypingInInput(event?: KeyboardEvent): boolean {
    const check = (el: Element | null | undefined) => {
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return true;
      if ((el as HTMLElement).isContentEditable) return true;
      return el.classList.contains('chat-input');
    };

    if (event && check(event.target as Element | null)) {
      return true;
    }

    const active = document.activeElement;
    return check(active);
  }

  private updateAmbientParticles() {
    if (!this.particlesSystem) {
      return;
    }

    const geometry = this.particlesSystem.geometry as THREE.BufferGeometry;
    const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
    const initial = this.particlesSystem.userData.initialPositions as Float32Array;
    const offsets = this.particlesSystem.userData.offsets as Float32Array;

    if (!positions || !initial || !offsets) {
      return;
    }

    for (let i = 0; i < positions.count; i++) {
      const baseX = initial[i * 3];
      const baseY = initial[i * 3 + 1];
      const baseZ = initial[i * 3 + 2];
      const offset = offsets[i];

      const swayX = Math.sin(this.elapsedTime * 0.6 + offset) * 0.18;
      const swayY = Math.sin(this.elapsedTime * 0.9 + offset) * 0.22;
      const swayZ = Math.cos(this.elapsedTime * 0.5 + offset) * 0.18;

      positions.setXYZ(i, baseX + swayX, baseY + swayY, baseZ + swayZ);
    }

    positions.needsUpdate = true;
  }

  private addDecoration(object: THREE.Object3D) {
    if (!this.decorationsRoot) {
      throw new Error('Decoration root not initialised');
    }
    this.decorationsRoot.add(object);
  }

  private disposeObject(object: THREE.Object3D) {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const material = child.material;
        if (Array.isArray(material)) {
          material.forEach((mat) => mat.dispose?.());
        } else if ((material as THREE.Material).dispose) {
          (material as THREE.Material).dispose();
        }
      }
    });
  }

  private async createExplorationEntrance() {
    console.log('[HubScene] 🏰 Loading Dungeon as exploration entrance...');
    
    try {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const loader = new GLTFLoader();
      
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(
          '/assets/3d/decorations/Dungeon/Dungeon.glb',
          resolve,
          undefined,
          reject
        );
      });
      
      this.explorationEntrance = gltf.scene;
      
      // Posicionar a dungeon
      this.explorationEntrance.position.copy(this.explorationEntrancePosition);
      this.explorationEntrance.scale.set(1.5, 1.5, 1.5); // Aumentar um pouco o tamanho
      
      // Adicionar glow effect
      this.explorationEntrance.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = (child.material as THREE.Material).clone();
          (child.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x4488ff);
          (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
        }
      });
      
      this.threeScene.addObject(this.explorationEntrance);
      
      // Adicionar luz pontual
      const dungeonLight = new THREE.PointLight(0x4488ff, 2, 10);
      dungeonLight.position.copy(this.explorationEntrancePosition);
      dungeonLight.position.y += 3;
      this.threeScene.addObject(dungeonLight);
      
      console.log('[HubScene] ✅ Dungeon entrance loaded!');
    } catch (error) {
      console.error('[HubScene] ❌ Failed to load dungeon:', error);
    }
  }

  public setBeast(beastLine: string) {
    if (this.beastGroup) {
      this.threeScene.removeObject(this.beastGroup);
      this.beastModel?.dispose();
    }

    this.beastModel = new BeastModel(beastLine);
    this.beastGroup = this.beastModel.getGroup();
    this.needsFit = false; // Não usar fitBeastToScene, posição manual
    this.isMoving = false;
    this.currentTarget = null;
    this.nextMoveTime = 1.5 + Math.random() * 1.5;
    this.activeRigAnimation = null;

    // Posição manual: colocar o Feralis no centro da ilha (0,0) com Y ajustado para os pés ficarem no chão
    // WORLD_Y_OFFSET = 0.48, ajustando Y para os pés encostarem no chão
    this.beastGroup.position.set(0, WORLD_Y_OFFSET - 1.1, 0);
    this.threeScene.addObject(this.beastGroup);

    if (this.beastModel.hasRiggedAnimations()) {
      this.playRigAnimation('idle');
    } else {
      this.idleAnimation = this.beastModel.playIdleAnimation();
    }
  }

  /**
   * Troca a skin do jogador em tempo real
   */
  public changePlayerSkin(skinId: string) {
    console.log(`[GuardianHubScene3D] 🎭 Trocando skin do jogador para: ${skinId}`);
    
    // Salvar posição atual
    const currentPosition = this.beastGroup?.position.clone();
    const currentTarget = this.currentTarget;
    
    // Recarregar modelo
    if (this.beastGroup) {
      this.threeScene.removeObject(this.beastGroup);
      this.beastModel?.dispose();
    }
    
    // Carregar novo modelo
    this.beastModel = new BeastModel(skinId);
    this.beastGroup = this.beastModel.getGroup();
    this.needsFit = false;
    
    // Restaurar posição
    if (currentPosition) {
      this.beastGroup.position.copy(currentPosition);
    } else {
      this.beastGroup.position.set(0, WORLD_Y_OFFSET - 1.1, 0);
    }
    
    this.threeScene.addObject(this.beastGroup);
    
    // Restaurar target se estava se movendo
    if (currentTarget) {
      this.currentTarget = currentTarget;
      this.isMoving = true;
    }
    
    // Iniciar animação
    if (this.beastModel.hasRiggedAnimations()) {
      this.playRigAnimation(this.isMoving ? 'walk' : 'idle');
    } else {
      this.idleAnimation = this.beastModel.playIdleAnimation();
    }
    
    console.log(`[GuardianHubScene3D] ✅ Skin alterada com sucesso!`);
  }

  public setInteractionCallback(callback: (id: string) => void) {
    this.interactionCallback = callback;
  }

  public setHoverCallback(callback: (id: string | null) => void) {
    this.hoverCallback = callback;
  }

  public handlePointerMove(clientX: number, clientY: number, rect: DOMRect): string | null {
    if (!this.inputEnabled) {
      this.hoverCallback?.(null);
      return null;
    }
    this.preparePointer(clientX, clientY, rect);
    const entry = this.pickInteractable();
    let hoveredId: string | null = entry?.id ?? null;

    if (!hoveredId) {
      const walkable = this.projectRayToWalkable();
      if (walkable) {
        hoveredId = 'walkable';
      }
    }

    if (hoveredId !== null) { // No hoveredInteractable, so always update
      this.updateInteractableHighlight(hoveredId && hoveredId !== 'walkable' ? hoveredId : null);
      this.hoverCallback?.(hoveredId);
    }

    return hoveredId;
  }

  public handlePointerClick(clientX: number, clientY: number, rect: DOMRect): string | null {
    if (!this.inputEnabled) {
      return null;
    }
    // Debug para entender porque o clique não está movendo o guardião
    // eslint-disable-next-line no-console
    console.log('[GuardianHubScene3D] handlePointerClick', {
      clientX,
      clientY,
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    });

    this.preparePointer(clientX, clientY, rect);
    
    // Verifica se clicou no portal
    if (this.explorationPortal) {
      const portalHits = this.raycaster.intersectObject(this.explorationPortal, true);
      if (portalHits.length > 0) {
        console.log('[HUB] 🎮 Clicou no portal! Iniciando exploração...');
        this.explorationPromptCallback?.();
        return 'portal';
      }
    }
    
    // Verifica se clicou no Craft
    if (this.craftModel) {
      const craftHits = this.raycaster.intersectObject(this.craftModel, true);
      if (craftHits.length > 0) {
        console.log('[HUB] 🔨 Clicou no Craft! Abrindo menu...');
        this.craftCallback?.();
        return 'craft';
      }
    }
    
    // Verifica se clicou no Market
    if (this.marketModel) {
      const marketHits = this.raycaster.intersectObject(this.marketModel, true);
      if (marketHits.length > 0) {
        console.log('[HUB] 🛒 Clicou no Market! Abrindo menu...');
        this.marketCallback?.();
        return 'market';
      }
    }
    
    // Verifica se clicou no Mission Board
    if (this.missionModel) {
      const missionHits = this.raycaster.intersectObject(this.missionModel, true);
      if (missionHits.length > 0) {
        console.log('[HUB] 📜 Clicou no Mission Board! Abrindo menu...');
        this.missionCallback?.();
        return 'missions';
      }
    }
    
    const entry = this.pickInteractable();
    if (entry) {
      // No pendingInteraction, manualControl, or interactionCallback here
      this.currentTarget = entry.target.clone();
      this.isMoving = true;
      this.playRigAnimation('walk');
      this.updateInteractableHighlight(entry.id);
      this.hoverCallback?.(entry.id);
      return entry.id;
    }

    const target = this.projectRayToWalkable();
    if (!target) {
      // Fallback: tenta sempre andar para o centro da cena para garantir que o movimento funciona
      this.currentTarget = new THREE.Vector3(0, WORLD_Y_OFFSET, 0);
    } else {
      // No pendingInteraction, manualControl, or interactionCallback here
      this.currentTarget = target.clone();
    }

    this.isMoving = true;
    console.log('[GuardianHubScene3D] 🚶 Setting isMoving = true, target:', this.currentTarget);
    this.playRigAnimation('walk');
    this.updateInteractableHighlight(null);
    this.hoverCallback?.('walkable');

    return 'move';
  }

  public clearHover() {
    this.hoverCallback?.(null);
  }

  private pickInteractable(): { id: string; target: THREE.Vector3 } | null {
    // No interactables array, so no pickInteractable
    return null;
  }

  private updateInteractableHighlight(hoverId: string | null) {
    // No interactables array, so no updateInteractableHighlight
  }

  private preparePointer(clientX: number, clientY: number, rect: DOMRect) {
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const camera = this.threeScene.getCamera() as THREE.PerspectiveCamera;
    this.raycaster.setFromCamera(this.pointer, camera);
  }

  private projectRayToWalkable(): THREE.Vector3 | null {
    if (!this.walkableGround) {
      return null;
    }

    // Usa interseção direta com o disco verde para garantir que o clique é no chão
    const hits = this.raycaster.intersectObject(this.walkableGround, false);
    if (!hits.length) {
      return null;
    }

    const point = hits[0].point;
    const projected = new THREE.Vector3(point.x, WORLD_Y_OFFSET, point.z);
    return projected;
  }

  public update(delta: number) {
    this.elapsedTime += delta;

    this.beastModel?.update(delta);
    // No waterSegments, so no update

    if (this.beastGroup && this.needsFit && this.fitBeastToScene(this.beastGroup)) {
      this.needsFit = false;
    }

    this.updateBeastMovement(delta);
    this.updateAmbientParticles();
    this.updateCameraFollow();
    this.updateGhostSystem(delta);
    this.checkPortalProximity();
    this.checkBuildingProximity(); // Verifica proximidade com Craft, Market, Missions
    this.critters?.update(delta);
    
    // Anima skybox (rotação lenta para simular movimento de nuvens)
    if (this.skyboxMesh) {
      this.skyboxMesh.rotation.y += delta * 0.005; // Rotação bem lenta
    }

    const scene = this.threeScene.getScene();
    this.threeScene.updateDayNightLighting();
    if (scene.fog) {
      const sky = getSkyColor();
      scene.fog.color.setRGB(sky.r, sky.g, sky.b);
    }
  }

  private updateBeastMovement(delta: number) {
    if (!this.beastGroup || !this.beastModel) {
      return;
    }

    if (!this.inputEnabled) {
      if (this.isMoving) {
        this.isMoving = false;
        this.playRigAnimation('idle');
      }
      return;
    }

    this.nextMoveTime -= delta;
    
    // WASD Movement
    const hasWASDInput = this.wasdKeys.w || this.wasdKeys.a || this.wasdKeys.s || this.wasdKeys.d;
    
    if (hasWASDInput) {
      // WASD cancela o movimento de clique
      this.currentTarget = null;
      
      const speed = 5.0; // Velocidade WASD (2x mais rápido)
      const camera = this.threeScene.getCamera() as THREE.PerspectiveCamera;
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      forward.y = 0;
      forward.normalize();
      
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      right.y = 0;
      right.normalize();
      
      this.wasdMovement.set(0, 0, 0);
      
      if (this.wasdKeys.w) this.wasdMovement.add(forward);
      if (this.wasdKeys.s) this.wasdMovement.sub(forward);
      if (this.wasdKeys.d) this.wasdMovement.add(right);
      if (this.wasdKeys.a) this.wasdMovement.sub(right);
      
      if (this.wasdMovement.length() > 0) {
        this.wasdMovement.normalize();
        
        // Calcula nova posição
        const newPosition = this.beastGroup.position.clone();
        newPosition.addScaledVector(this.wasdMovement, speed * delta);
        
        // Verifica colisão com paredes
        if (this.isPositionInsideBounds(newPosition)) {
          this.beastGroup.position.copy(newPosition);
          this.beastGroup.lookAt(
            this.beastGroup.position.x + this.wasdMovement.x,
            this.beastGroup.position.y,
            this.beastGroup.position.z + this.wasdMovement.z
          );
        } else {
          console.log('[HUB] 🧱 Bloqueado pela parede invisível!');
        }
        
        if (this.activeRigAnimation !== 'walk') {
          this.playRigAnimation('walk');
        }
        this.isMoving = true;
      } else {
        // WASD foi solto, mas ainda está no estado hasWASDInput (transição)
        if (this.isMoving) {
          this.isMoving = false;
          this.playRigAnimation('idle');
        }
      }
    } else {
      // Se estava usando WASD e agora não está mais, força idle
      if (this.isMoving && !this.currentTarget) {
        this.isMoving = false;
        this.playRigAnimation('idle');
      }
      // Só força idle se realmente não estiver se movendo E não tiver target
      if (!this.isMoving && !this.currentTarget) {
        if (this.activeRigAnimation !== 'idle') {
          this.playRigAnimation('idle');
        }
      }

      if (this.isMoving && this.currentTarget) {
        const speed = 4.0; // Velocidade de clique (2x mais rápido)
        const current = this.beastGroup.position;

        // Movimentação apenas no plano XZ (altura controlada por fitBeastToScene)
        const direction = new THREE.Vector3(
          this.currentTarget.x - current.x,
          0,
          this.currentTarget.z - current.z,
        );
        const distance = direction.length();

        if (distance < 0.1) {
          console.log('[GuardianHubScene3D] 🛑 Reached target, stopping');
          this.isMoving = false;
          this.currentTarget = null;
          this.playRigAnimation('idle');

          // No pendingInteraction, manualControl, or interactionCallback here
          this.nextMoveTime = 2.0 + Math.random() * 1.2;
        } else {
          // Ensure walk animation is playing while moving
          if (this.activeRigAnimation !== 'walk') {
            console.log('[GuardianHubScene3D] 🏃 Forcing walk animation (was:', this.activeRigAnimation, ')');
            this.playRigAnimation('walk');
          }
        }

        direction.normalize();
        
        // Calcula nova posição
        const newPosition = current.clone();
        newPosition.addScaledVector(direction, speed * delta);
        
        // Verifica colisão com paredes
        if (this.isPositionInsideBounds(newPosition)) {
          current.copy(newPosition);
        } else {
          console.log('[HUB] 🧱 Bloqueado pela parede invisível! Parando movimento.');
          this.isMoving = false;
          this.currentTarget = null;
          this.playRigAnimation('idle');
        }

        if (this.currentTarget) {
          this.beastGroup.lookAt(this.currentTarget.x, current.y, this.currentTarget.z);
        }
      }
    }
  }

  private isPositionInsideBounds(position: THREE.Vector3): boolean {
    // Verifica se a posição está dentro do círculo do chão
    const distanceFromCenter = Math.sqrt(
      position.x * position.x + 
      position.z * position.z
    );
    
    // Deixa uma margem de 2 unidades para segurança
    const maxDistance = this.GROUND_RADIUS - 2;
    return distanceFromCenter < maxDistance;
  }
  
  private updateCameraFollow() {
    if (!this.beastGroup) {
      return;
    }

    const camera = this.threeScene.getCamera() as THREE.PerspectiveCamera;
    const target = this.beastGroup.position;

    // Posição desejada da câmera em relação ao guardião
    const desired = new THREE.Vector3(
      target.x + this.cameraOffset.x,
      target.y + this.cameraOffset.y,
      target.z + this.cameraOffset.z,
    );

    camera.position.lerp(desired, this.cameraFollowStrength);
    camera.lookAt(target.x, target.y + 1.0, target.z);
  }

  private createHintSprite(): THREE.Sprite {
    const texture = this.createRadialTexture(64, [
      { offset: 0, color: 'rgba(255,244,200,1)' },
      { offset: 0.4, color: 'rgba(255,224,140,0.75)' },
      { offset: 1, color: 'rgba(255,200,90,0)' },
    ]);

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.85,
      color: 0xf4ca64,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.4, 1.4, 1.4);
    return sprite;
  }

  private createRadialTexture(size: number, stops: Array<{ offset: number; color: string }>): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas rendering context');
    }

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const stop of stops) {
      gradient.addColorStop(stop.offset, stop.color);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private chooseNextTarget(current: THREE.Vector3): THREE.Vector3 | null {
    // No walkable zones, so no chooseNextTarget
    return null;
  }

  private isPositionValid(x: number, z: number, clearance: number = 0.5): boolean {
    // No walkable zones, so no isPositionValid
    return true;
  }

  public render() {
    this.threeScene.render();
  }

  public startLoop() {
    this.threeScene.startAnimationLoop((delta) => this.update(delta));
  }

  public stopLoop() {
    this.threeScene.stopAnimationLoop();
  }

  public resize(width: number, height: number) {
    this.threeScene.resize(width, height);
  }

  public dispose() {
    this.beastModel?.dispose();
    this.beastModel = null;
    this.beastGroup = null;
    this.clearDecorations();
    this.threeScene.dispose();
  }

  private playRigAnimation(name: 'idle' | 'walk') {
    if (!this.beastModel || !this.beastModel.hasRiggedAnimations()) {
      return;
    }
    if (this.activeRigAnimation === name) {
      return;
    }
    console.log('[GuardianHubScene3D] 🎬 Changing animation:', this.activeRigAnimation, '→', name);
    const played = this.beastModel.playAnimation(name, {
      loop: THREE.LoopRepeat,
      clampWhenFinished: false,
      fadeIn: 0.08,  // Mais rápido = menos travamento
      fadeOut: 0.08, // Mais rápido = menos travamento
      forceRestart: false, // Não força restart = transição mais suave
    });
    if (played) {
      this.activeRigAnimation = name;
    } else {
      console.error('[GuardianHubScene3D] ❌ Failed to play animation:', name);
    }
  }

  private fitBeastToScene(group: THREE.Group): boolean {
    const box = new THREE.Box3().setFromObject(group);
    if (box.isEmpty()) {
      return false;
    }

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 1.6 / maxDim : 1;

    group.scale.setScalar(scale);

    const offset = center.multiplyScalar(scale);
    group.position.set(-offset.x, this.baseYPosition - offset.y, -offset.z);

    return true;
  }

  // ========== EXPLORATION PORTAL SYSTEM ==========

  public setExplorationCallback(callback: () => void) {
    this.explorationPromptCallback = callback;
  }

  private checkPortalProximity() {
    if (!this.beastGroup || !this.explorationPortal) {
      return;
    }

    const playerPos = this.beastGroup.position;
    const portalPos = this.explorationPortal.position;
    const distance = playerPos.distanceTo(portalPos);

    const wasNear = this.isNearPortal;
    this.isNearPortal = distance < this.PORTAL_INTERACTION_DISTANCE;

    // Transição: entrou na área
    if (this.isNearPortal && !wasNear) {
      console.log('[HUB] 🚪 Perto do portal de exploração! Pressione [E]');
      this.showExplorationPrompt(true);
    }
    // Transição: saiu da área
    else if (!this.isNearPortal && wasNear) {
      console.log('[HUB] 🚶 Saiu da área do portal');
      this.showExplorationPrompt(false);
    }
  }

  private showExplorationPrompt(show: boolean) {
    // Dispara evento para mostrar/esconder UI "[E] Explorar"
    const event = new CustomEvent('explorationPrompt', {
      detail: { show, position: this.PORTAL_POSITION }
    });
    window.dispatchEvent(event);
  }

  public tryEnterExploration(): boolean {
    if (this.isNearPortal) {
      console.log('[HUB] 🎮 Entrando na exploração!');
      this.explorationPromptCallback?.();
      return true;
    }
    return false;
  }
  
  // ========== BUILDING INTERACTIONS ==========
  
  private checkBuildingProximity() {
    if (!this.beastGroup) return;
    
    const playerPos = this.beastGroup.position;
    
    // Verifica Craft
    const craftDist = playerPos.distanceTo(this.CRAFT_POSITION);
    const wasCraft = this.isNearCraft;
    this.isNearCraft = craftDist < this.BUILDING_INTERACTION_DISTANCE;
    
    if (this.isNearCraft && !wasCraft) {
      console.log('[HUB] 🔨 Perto do Craft! Pressione [E] para craftar');
      this.dispatchBuildingPrompt('craft', true);
    } else if (!this.isNearCraft && wasCraft) {
      this.dispatchBuildingPrompt('craft', false);
    }
    
    // Verifica Market
    const marketDist = playerPos.distanceTo(this.MARKET_POSITION);
    const wasMarket = this.isNearMarket;
    this.isNearMarket = marketDist < this.BUILDING_INTERACTION_DISTANCE;
    
    if (this.isNearMarket && !wasMarket) {
      console.log('[HUB] 🛒 Perto do Market! Pressione [E] para comprar');
      this.dispatchBuildingPrompt('market', true);
    } else if (!this.isNearMarket && wasMarket) {
      this.dispatchBuildingPrompt('market', false);
    }
    
    // Verifica Missions
    const missionDist = playerPos.distanceTo(this.MISSION_POSITION);
    const wasMission = this.isNearMission;
    this.isNearMission = missionDist < this.BUILDING_INTERACTION_DISTANCE;
    
    if (this.isNearMission && !wasMission) {
      console.log('[HUB] 📜 Perto do Mission Board! Pressione [E] para ver missões');
      this.dispatchBuildingPrompt('missions', true);
    } else if (!this.isNearMission && wasMission) {
      this.dispatchBuildingPrompt('missions', false);
    }
  }
  
  private dispatchBuildingPrompt(building: 'craft' | 'market' | 'missions', show: boolean) {
    const event = new CustomEvent('buildingPrompt', {
      detail: { building, show }
    });
    window.dispatchEvent(event);
  }
  
  public setCraftCallback(callback: () => void) {
    this.craftCallback = callback;
  }
  
  public setMarketCallback(callback: () => void) {
    this.marketCallback = callback;
  }
  
  public setMissionCallback(callback: () => void) {
    this.missionCallback = callback;
  }

  public setInputEnabled(enabled: boolean) {
    this.inputEnabled = enabled;
    if (!enabled) {
      this.resetWASDKeys();
      this.currentTarget = null;
      this.isMoving = false;
      if (this.beastModel) {
        this.playRigAnimation('idle');
      }
    }
  }
  
  public tryInteractWithBuilding(): boolean {
    if (this.isNearCraft) {
      console.log('[HUB] 🔨 Abrindo Craft!');
      this.craftCallback?.();
      return true;
    }
    
    if (this.isNearMarket) {
      console.log('[HUB] 🛒 Abrindo Market!');
      this.marketCallback?.();
      return true;
    }
    
    if (this.isNearMission) {
      console.log('[HUB] 📜 Abrindo Missions!');
      this.missionCallback?.();
      return true;
    }
    
    return false;
  }

  // ========== GHOST SYSTEM ==========

  private async updateGhostSystem(delta: number) {
    this.elapsedTime += delta;

    // Save our position every 1 second for smooth updates
    if (this.beastGroup && this.elapsedTime - this.lastPositionSaveTime > this.POSITION_SAVE_INTERVAL) {
      this.lastPositionSaveTime = this.elapsedTime;
      await this.saveOurPosition();
    }

    // Fetch other players every 2 seconds for near real-time
    if (this.elapsedTime - this.lastGhostFetchTime > this.GHOST_FETCH_INTERVAL) {
      this.lastGhostFetchTime = this.elapsedTime;
      await this.fetchAndRenderGhosts();
    }

    // Update nametag positions and ghost animations
    this.updateNametags();
    this.updateGhostAnimations(delta);
  }

  private async saveOurPosition() {
    if (!this.beastGroup) return;

    try {
      const pos = this.beastGroup.position;
      const { gameApi } = await import('../../api/gameApi');
      const result = await gameApi.saveHubPosition(pos.x, pos.y, pos.z);
      console.log('[Ghost] ✅ Position saved:', { x: pos.x, y: pos.y, z: pos.z }, result);
    } catch (error) {
      console.error('[Ghost] ❌ Failed to save position:', error);
    }
  }

  private async fetchAndRenderGhosts() {
    try {
      const { gameApi } = await import('../../api/gameApi');
      const response = await gameApi.getRecentVisitors(5);
      
      console.log('[Ghost] 🔍 Fetch response:', response);
      
      // Response structure is { success: true, data: { visitors: [...] } }
      if (response.success && response.data && response.data.visitors) {
        const visitors = response.data.visitors;
        console.log('[Ghost] 👥 Found visitors:', visitors.length, visitors);
        
        // Remove ghosts that are no longer in the visitor list
        const visitorNames = new Set(visitors.map((v: any) => v.playerName));
        for (const [name, ghost] of this.ghostPlayers.entries()) {
          if (!visitorNames.has(name)) {
            console.log('[Ghost] 🗑️ Removing ghost:', name);
            this.removeGhost(name);
          }
        }

        // Add or update ghosts
        for (const visitor of visitors) {
          await this.addOrUpdateGhost(visitor);
        }
      } else {
        console.log('[Ghost] ⚠️ No visitors data in response', response);
      }
    } catch (error) {
      console.error('[Ghost] ❌ Failed to fetch visitors:', error);
    }
  }

  private async addOrUpdateGhost(visitor: {
    playerName: string;
    beastLine: string;
    position: { x: number; y: number; z: number };
  }) {
    const existing = this.ghostPlayers.get(visitor.playerName);

    if (existing) {
      console.log('[Ghost] 🔄 Updating ghost target position:', visitor.playerName);
      // Update target position for smooth interpolation
      existing.targetPosition.set(
        visitor.position.x,
        visitor.position.y,
        visitor.position.z
      );
    } else {
      console.log('[Ghost] ✨ Creating new ghost:', visitor.playerName, visitor.beastLine);
      // Create new ghost
      const ghostModel = new BeastModel(visitor.beastLine);
      const ghostGroup = ghostModel.getGroup();
      
      // Usar o mesmo offset Y do Feralis (WORLD_Y_OFFSET - 1.1)
      const adjustedY = WORLD_Y_OFFSET - 1.1;
      ghostGroup.position.set(
        visitor.position.x,
        adjustedY,
        visitor.position.z
      );

      console.log('[Ghost] 📍 Ghost position set:', { x: visitor.position.x, y: adjustedY, z: visitor.position.z });

      // Make it slightly transparent (ghost effect)
      ghostGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.opacity = 0.6;
          mat.transparent = true;
        }
      });

      this.threeScene.addObject(ghostGroup);

      // Create nametag
      const nametag = this.createNametag(visitor.playerName);
      ghostGroup.add(nametag);

      // Play idle animation
      if (ghostModel.hasRiggedAnimations()) {
        ghostModel.playAnimation('idle', {
          loop: THREE.LoopRepeat,
          clampWhenFinished: false,
          fadeIn: 0.2,
          fadeOut: 0.2,
        });
      }

      // Initialize position tracking
      const currentPos = new THREE.Vector3(visitor.position.x, adjustedY, visitor.position.z);
      const targetPos = new THREE.Vector3(visitor.position.x, adjustedY, visitor.position.z);

      this.ghostPlayers.set(visitor.playerName, {
        model: ghostModel,
        group: ghostGroup,
        nametag,
        currentPosition: currentPos,
        targetPosition: targetPos
      });
      
      console.log('[Ghost] ✅ Ghost created successfully:', visitor.playerName);
    }
  }

  private removeGhost(playerName: string) {
    const ghost = this.ghostPlayers.get(playerName);
    if (ghost) {
      this.threeScene.removeObject(ghost.group);
      ghost.model.dispose();
      this.ghostPlayers.delete(playerName);
    }
  }

  private createNametag(name: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;

    // Background
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Text
    context.fillStyle = '#ffffff';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 0.5, 1);
    sprite.position.y = 3.5; // Bem acima da cabeça

    return sprite;
  }

  private updateNametags() {
    const camera = this.threeScene.getCamera();
    
    for (const [, ghost] of this.ghostPlayers) {
      // Make nametag always face camera
      ghost.nametag.lookAt(camera.position);
    }
  }

  private updateGhostAnimations(delta: number) {
    for (const [, ghost] of this.ghostPlayers) {
      // Update ghost model animations
      ghost.model.update(delta);

      // Smooth interpolation to target position
      const lerpSpeed = 5.0 * delta; // Adjust for smoothness
      ghost.currentPosition.lerp(ghost.targetPosition, lerpSpeed);
      
      // Apply interpolated position
      ghost.group.position.copy(ghost.currentPosition);

      // Check if ghost is moving
      const distanceToTarget = ghost.currentPosition.distanceTo(ghost.targetPosition);
      const isMoving = distanceToTarget > 0.05; // Threshold for "stopped"

      // Switch between walk and idle animation (simplified - just play, let fade handle it)
      if (isMoving && ghost.model.hasRiggedAnimations()) {
        ghost.model.playAnimation('walk', {
          loop: THREE.LoopRepeat,
          clampWhenFinished: false,
          fadeIn: 0.3,
          fadeOut: 0.3,
        });
        // Make ghost look towards movement direction
        ghost.group.lookAt(ghost.targetPosition.x, ghost.currentPosition.y, ghost.targetPosition.z);
      } else if (!isMoving && ghost.model.hasRiggedAnimations()) {
        ghost.model.playAnimation('idle', {
          loop: THREE.LoopRepeat,
          clampWhenFinished: false,
          fadeIn: 0.3,
          fadeOut: 0.3,
        });
      }
    }
  }

  // ========== EXPLORATION SYSTEM ==========

  private checkExplorationProximity() {
    if (!this.beastGroup || !this.explorationEntrance) return;

    const distance = this.beastGroup.position.distanceTo(this.explorationEntrancePosition);
    const wasNear = this.nearExploration;
    this.nearExploration = distance < this.explorationInteractionRadius;

    // Trigger callback quando entrar/sair da área
    if (this.nearExploration !== wasNear && this.explorationPromptCallback) {
      this.explorationPromptCallback();
    }
  }

  public isNearExplorationEntrance(): boolean {
    return this.nearExploration;
  }

  public onExplorationPrompt(callback: () => void) {
    this.explorationPromptCallback = callback;
  }

  public startExploration() {
    console.log('[HubScene] 🚪 Starting exploration...');
    // Este método será chamado pela UI quando o jogador pressionar E
    // Por enquanto só loga, depois vamos implementar a troca de cena
  }
}

