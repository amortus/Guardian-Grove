/**
 * Immersive 3D Battle Scene - Pokémon Arceus Style
 * Guardian Grove - Cinematic 3D battle visualization
 * CORRIGIDO: Usando BeastModel.ts (mesmo do rancho) + Cenário elaborado
 */

import * as THREE from 'three';
import { BeastModel } from '../models/BeastModel';
import { PS1Grass } from '../vegetation/PS1Grass';

export type CameraAngle = 'wide' | 'player' | 'enemy' | 'overhead' | 'cinematic';
export type BattleAnimation = 'idle' | 'attack' | 'hit' | 'defend' | 'victory' | 'defeat';

interface BeastActor {
  model: BeastModel;
  group: THREE.Group;
  basePosition: THREE.Vector3;
  baseRotation: number;
  currentAnimation: BattleAnimation;
  animationTime: number;
  health: number;
  maxHealth: number;
  shakeIntensity: number; // Para animação de dano
  activeRigClip?: string | null;
}

const RIGGED_ANIMATION_MAP: Record<BattleAnimation, { clip: string; loop: THREE.AnimationActionLoopStyles; clamp?: boolean; fallbackClip?: string }> = {
  idle: { clip: 'idle_02', loop: THREE.LoopRepeat, fallbackClip: 'idle' },
  attack: { clip: 'skill', loop: THREE.LoopOnce, clamp: true },
  hit: { clip: 'hit', loop: THREE.LoopOnce, clamp: true },
  defend: { clip: 'walk', loop: THREE.LoopRepeat },
  victory: { clip: 'victory', loop: THREE.LoopRepeat, fallbackClip: 'run' },
  defeat: { clip: 'dead', loop: THREE.LoopOnce, clamp: true },
};

export class ImmersiveBattleScene3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  
  // Battle actors
  private playerBeast: BeastActor | null = null;
  private enemyBeast: BeastActor | null = null;
  
  // Environment
  private arena: THREE.Group;
  private lighting: THREE.Group;
  private particles: THREE.Points[] = [];
  private grass: PS1Grass | null = null;
  
  // Camera system
  private currentCameraAngle: CameraAngle = 'wide';
  private cameraTargetPosition: THREE.Vector3;
  private cameraTargetLookAt: THREE.Vector3;
  private cameraTransitionSpeed: number = 0.08;
  
  // Animation
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;
  private time: number = 0;
  
  // Effects
  private attackEffects: THREE.Group[] = [];

  constructor(container: HTMLElement, width: number, height: number) {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Céu azul igual rancho
    this.scene.fog = new THREE.Fog(0xa0d8ef, 20, 50);
    
    // Camera setup (estilo Pokémon)
    this.camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 160);
    this.cameraTargetPosition = new THREE.Vector3(0, 7.2, 9.6);
    this.cameraTargetLookAt = new THREE.Vector3(0, 0.6, 0);
    this.camera.position.copy(this.cameraTargetPosition);
    this.camera.lookAt(this.cameraTargetLookAt);
    
    // Renderer setup (igual rancho)
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    container.appendChild(this.renderer.domElement);
    
    this.clock = new THREE.Clock();
    this.arena = new THREE.Group();
    this.lighting = new THREE.Group();
    
    this.setupEnvironment();
    this.startAnimationLoop();
  }

  private setupEnvironment() {
    // Setup arena (estilo rancho, mas arena de batalha)
    this.createBattleArena();
    
    // Setup lighting (igual rancho - suave e natural)
    this.setupNaturalLighting();
    
    // Add grass (igual rancho)
    this.createGrassField();
    
    // Adicionar elementos decorativos
    this.createBattleDecorations();
    
    // Adicionar nuvens no céu
    this.createClouds();
  }

  private createBattleArena() {
    // Chão de grama natural (igual rancho)
    const groundGeometry = new THREE.CircleGeometry(34, 80);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a8f4a, // Verde grama
      roughness: 0.9,
      metalness: 0.1,
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.arena.add(ground);
    
    // Círculo da arena (marcação no chão)
    const arenaRingGeometry = new THREE.RingGeometry(10.2, 10.6, 48);
    const arenaRingMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const arenaRing = new THREE.Mesh(arenaRingGeometry, arenaRingMaterial);
    arenaRing.rotation.x = -Math.PI / 2;
    arenaRing.position.y = 0.01;
    this.arena.add(arenaRing);
    
    // Linha central (divisão entre os lados)
    const lineGeometry = new THREE.PlaneGeometry(0.16, 24);
    const lineMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.y = 0.01;
    this.arena.add(centerLine);
    
    // Pedras ao redor (igual rancho)
    this.createRocks();
    
    // Árvores de fundo (igual rancho)
    this.createBackgroundTrees();
    
    // Flores esparsas (igual rancho)
    this.createFlowers();
    
    this.scene.add(this.arena);
  }

  private createRocks() {
    const rockPositions = [
      [-11, 0, -8],
      [11, 0, -8],
      [-11, 0, 8],
      [11, 0, 8],
      [-13, 0, 0],
      [13, 0, 0],
    ];
    
    rockPositions.forEach(([x, y, z]) => {
      const rockGroup = new THREE.Group();
      
      // Pedra principal
      const rockGeometry = new THREE.DodecahedronGeometry(0.5, 0);
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.9,
        flatShading: true,
      });
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rock.castShadow = true;
      rockGroup.add(rock);
      
      rockGroup.position.set(x, y + 0.22, z);
      this.arena.add(rockGroup);
    });
  }

  private createBackgroundTrees() {
    const treePositions = [
      [-16, 0, -12],
      [-12, 0, -16],
      [16, 0, -12],
      [12, 0, -16],
      [-14, 0, 12],
      [14, 0, 12],
    ];
    
    treePositions.forEach(([x, y, z]) => {
      const tree = new THREE.Group();
      
      // Trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 6);
      const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a3520,
        roughness: 1,
        flatShading: true,
      });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 1;
      trunk.castShadow = true;
      tree.add(trunk);
      
      // Foliage (sphere)
      const foliageGeometry = new THREE.SphereGeometry(1.2, 8, 6);
      const foliageMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d7a3e,
        roughness: 0.8,
        flatShading: true,
      });
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.y = 2.5;
      foliage.castShadow = true;
      tree.add(foliage);
      
      tree.position.set(x, y, z);
      this.arena.add(tree);
    });
  }

  private createFlowers() {
    const flowerCount = 40;
    
    for (let i = 0; i < flowerCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 4 + Math.random() * 7;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // Caule
      const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4);
      const stemMaterial = new THREE.MeshStandardMaterial({
        color: 0x228b22,
        flatShading: true,
      });
      const stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.position.set(x, 0.12, z);
      this.arena.add(stem);
      
      // Flor (círculo)
      const flowerGeometry = new THREE.CircleGeometry(0.15, 6);
      const flowerColors = [0xff69b4, 0xffff00, 0xff6347, 0x9370db];
      const flowerColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      const flowerMaterial = new THREE.MeshStandardMaterial({
        color: flowerColor,
        side: THREE.DoubleSide,
        flatShading: true,
      });
      const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
      flower.position.set(x, 0.26, z);
      flower.rotation.x = -Math.PI / 2;
      this.arena.add(flower);
    }
  }

  private createGrassField() {
    // Usar PS1Grass (igual rancho)
    this.grass = new PS1Grass(this.scene, 34); // Radius expandido para preencher tela
  }

  private createClouds() {
    // Nuvens baixas e visíveis (igual rancho)
    const cloudPositions = [
      [-15, 8, -20],
      [12, 10, -25],
      [-18, 9, -15],
      [15, 11, -18],
      [0, 10, -30],
      [-10, 12, -22],
      [8, 9, -28],
    ];
    
    cloudPositions.forEach(([x, y, z]) => {
      const cloud = new THREE.Group();
      
      // Nuvem composta por 3-5 esferas
      const sphereCount = 3 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < sphereCount; i++) {
        const sphereGeometry = new THREE.SphereGeometry(1.5 + Math.random() * 0.8, 8, 6);
        const sphereMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 1,
          flatShading: true,
          transparent: true,
          opacity: 0.8,
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 3
        );
        cloud.add(sphere);
      }
      
      cloud.position.set(x, y, z);
      this.arena.add(cloud);
    });
    
    console.log('[ImmersiveBattle] ✓ Clouds created');
  }

  private createBattleDecorations() {
    // Marcadores de posição (círculos no chão)
    const markerGeometry = new THREE.RingGeometry(1.4, 1.7, 48);
    
    // Marcador do jogador (verde)
    const playerMarkerMaterial = new THREE.MeshBasicMaterial({
      color: 0x48bb78,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    const playerMarker = new THREE.Mesh(markerGeometry, playerMarkerMaterial);
    playerMarker.rotation.x = -Math.PI / 2;
    playerMarker.position.set(-5.4, 0.01, 0);
    this.arena.add(playerMarker);
    
    // Marcador do inimigo (vermelho)
    const enemyMarkerMaterial = new THREE.MeshBasicMaterial({
      color: 0xfc8181,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    const enemyMarker = new THREE.Mesh(markerGeometry, enemyMarkerMaterial);
    enemyMarker.rotation.x = -Math.PI / 2;
    enemyMarker.position.set(5.4, 0.01, 0);
    this.arena.add(enemyMarker);
  }

  private setupNaturalLighting() {
    // Luz ambiente suave (igual rancho)
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.lighting.add(ambient);
    
    // Sol (luz direcional)
    const sunLight = new THREE.DirectionalLight(0xfff8dc, 0.8);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    this.lighting.add(sunLight);
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0x9dd9f3, 0.3);
    fillLight.position.set(-5, 10, -5);
    this.lighting.add(fillLight);
    
    this.scene.add(this.lighting);
  }

  /**
   * Load player beast into the scene (USANDO BeastModel.ts)
   */
  public setPlayerBeast(beastLine: string) {
    console.log('[ImmersiveBattle] Loading player beast:', beastLine);
    
    // Remove previous model
    if (this.playerBeast) {
      this.scene.remove(this.playerBeast.group);
      this.playerBeast.model.dispose();
    }
    
    // Create new model (SISTEMA CORRETO do rancho)
    const model = new BeastModel(beastLine.toLowerCase());
    const group = model.getGroup();
    
    // Posicionar à ESQUERDA, virado para o centro
    const playerPosition = new THREE.Vector3(-5.5, 0, 0);
    const focusPoint = new THREE.Vector3(0, 0, 0);
    const playerAngle = Math.atan2(focusPoint.x - playerPosition.x, focusPoint.z - playerPosition.z);
    group.position.copy(playerPosition);
    group.rotation.set(0, playerAngle, 0);
    group.castShadow = true;
    group.receiveShadow = true;
    
    // Apply shadows to all children
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    this.scene.add(group);
    
    this.playerBeast = {
      model,
      group,
      basePosition: playerPosition.clone(),
      baseRotation: playerAngle,
      currentAnimation: 'idle',
      animationTime: 0,
      health: 100,
      maxHealth: 100,
      shakeIntensity: 0,
      activeRigClip: null
    };
    
    // Setup idle animation (PRECISA ser chamado no update loop)
    console.log('[ImmersiveBattle] ✓ Player beast idle animation ready');
    
    console.log('[ImmersiveBattle] ✓ Player beast loaded (BeastModel)');
  }

  /**
   * Load enemy beast into the scene (USANDO BeastModel.ts)
   */
  public setEnemyBeast(beastLine: string) {
    console.log('[ImmersiveBattle] Loading enemy beast:', beastLine);
    
    // Remove previous model
    if (this.enemyBeast) {
      this.scene.remove(this.enemyBeast.group);
      this.enemyBeast.model.dispose();
    }
    
    // Create new model (SISTEMA CORRETO do rancho)
    const model = new BeastModel(beastLine.toLowerCase());
    const group = model.getGroup();
    
    // Posicionar à DIREITA, virado para o centro
    const enemyPosition = new THREE.Vector3(5.5, 0, 0);
    const focusPoint = new THREE.Vector3(0, 0, 0);
    const enemyAngle = Math.atan2(focusPoint.x - enemyPosition.x, focusPoint.z - enemyPosition.z);
    group.position.copy(enemyPosition);
    group.rotation.set(0, enemyAngle, 0);
    group.castShadow = true;
    group.receiveShadow = true;
    
    // Apply shadows to all children
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    this.scene.add(group);
    
    this.enemyBeast = {
      model,
      group,
      basePosition: enemyPosition.clone(),
      baseRotation: enemyAngle,
      currentAnimation: 'idle',
      animationTime: 0,
      health: 100,
      maxHealth: 100,
      shakeIntensity: 0,
      activeRigClip: null
    };
    
    // Setup idle animation (PRECISA ser chamado no update loop)
    console.log('[ImmersiveBattle] ✓ Enemy beast idle animation ready');
    
    console.log('[ImmersiveBattle] ✓ Enemy beast loaded (BeastModel)');
  }

  /**
   * Change camera angle (cinematic cuts)
   */
  public setCameraAngle(angle: CameraAngle) {
    this.currentCameraAngle = angle;
    
    switch (angle) {
      case 'wide':
        // Wide shot: See both beasts
        this.cameraTargetPosition.set(0, 7.2, 9.6);
        this.cameraTargetLookAt.set(0, 0.6, 0);
        break;
      
      case 'player':
        // Focus on player beast
        this.cameraTargetPosition.set(-6.6, 4.6, 7.4);
        this.cameraTargetLookAt.set(-5.2, 1.1, 0);
        break;
      
      case 'enemy':
        // Focus on enemy beast
        this.cameraTargetPosition.set(6.6, 4.6, 7.4);
        this.cameraTargetLookAt.set(5.2, 1.1, 0);
        break;
      
      case 'overhead':
        // Top-down view
        this.cameraTargetPosition.set(0, 18, 2.6);
        this.cameraTargetLookAt.set(0, 0, 0);
        break;
      
      case 'cinematic':
        // Dynamic cinematic angle (MAIS PRÓXIMA - 30% mais perto)
        this.cameraTargetPosition.set(-1.2, 3.8, 6.6);
        this.cameraTargetLookAt.set(0, 0.8, 0);
        break;
    }
  }

  /**
   * Play attack animation (ESTILO POKÉMON PORTÁTIL)
   */
  public playAttackAnimation(attacker: 'player' | 'enemy', target: 'player' | 'enemy') {
    console.log(`[ImmersiveBattle] Attack: ${attacker} -> ${target}`);
    
    const attackerBeast = attacker === 'player' ? this.playerBeast : this.enemyBeast;
    const targetBeast = target === 'player' ? this.playerBeast : this.enemyBeast;
    
    if (!attackerBeast || !targetBeast) return;
    
    // Set animation state
    attackerBeast.currentAnimation = 'attack';
    attackerBeast.animationTime = 0;
    attackerBeast.activeRigClip = null;
    
    // Atacante avança rapidamente
    const attackDuration = 300;
    const startTime = Date.now();
    
    const attackAnim = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / attackDuration, 1);
      
      if (progress < 1) {
        // Movimento de avanço
        const lunge = Math.sin(progress * Math.PI) * 1.5;
        const direction = attacker === 'player' ? 1 : -1;
        attackerBeast.group.position.x = attackerBeast.basePosition.x + (lunge * direction);
        
        requestAnimationFrame(attackAnim);
      } else {
        // Fim do ataque - aplicar dano e shake
        targetBeast.shakeIntensity = 0.3; // TREMOR FORTE
        targetBeast.currentAnimation = 'hit';
        targetBeast.animationTime = 0;
        targetBeast.activeRigClip = null;
        
        // Voltar atacante à posição
        setTimeout(() => {
          attackerBeast.group.position.copy(attackerBeast.basePosition);
          attackerBeast.currentAnimation = 'idle';
          attackerBeast.activeRigClip = null;
        }, 200);
        
        // Parar shake do alvo após 500ms
        setTimeout(() => {
          targetBeast.shakeIntensity = 0;
          targetBeast.currentAnimation = 'idle';
          targetBeast.activeRigClip = null;
        }, 500);
      }
    };
    
    attackAnim();
  }

  /**
   * Update beast health
   */
  public updateHealth(beast: 'player' | 'enemy', health: number, maxHealth: number) {
    const actor = beast === 'player' ? this.playerBeast : this.enemyBeast;
    if (actor) {
      actor.health = health;
      actor.maxHealth = maxHealth;
      
      // Trigger shake if damaged
      if (health < actor.health) {
        actor.shakeIntensity = 0.2;
        setTimeout(() => {
          if (actor) actor.shakeIntensity = 0;
        }, 300);
      }
    }
  }

  /**
   * Animation loop
   */
  private startAnimationLoop() {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      
      const delta = this.clock.getDelta();
      this.time += delta;
      
      this.updateAnimations(delta);
      this.updateCamera(delta);
      
      // Update grass
      if (this.grass) {
        this.grass.update(delta);
      }
      
      this.renderer.render(this.scene, this.camera);
    };
    
    animate();
  }

  private updateAnimations(delta: number) {
    // Update player beast animation
    if (this.playerBeast) {
      this.updateBeastAnimation(this.playerBeast, delta);
      this.updateBeastShake(this.playerBeast); // TREMOR
    }
    
    // Update enemy beast animation
    if (this.enemyBeast) {
      this.updateBeastAnimation(this.enemyBeast, delta);
      this.updateBeastShake(this.enemyBeast); // TREMOR
    }
  }

  private updateBeastAnimation(beast: BeastActor, delta: number) {
    beast.animationTime += delta;

    beast.model.update(delta);

    if (beast.model.hasRiggedAnimations()) {
      this.ensureRiggedAnimation(beast);
      return;
    }
    
    switch (beast.currentAnimation) {
      case 'idle':
        // ANIMAÇÃO IDLE MANUAL (respiração + rotação lenta)
        const breathe = Math.sin(beast.animationTime * 2) * 0.08;
        beast.group.position.y = beast.basePosition.y + breathe;
        beast.group.rotation.y = beast.baseRotation + Math.sin(beast.animationTime * 0.5) * 0.1;
        break;
      
      case 'attack':
        // Handled in playAttackAnimation
        break;
      
      case 'hit':
        // Recuo rápido
        const hitProgress = Math.min(beast.animationTime / 0.2, 1);
        const recoil = Math.sin(hitProgress * Math.PI) * -0.3;
        beast.group.position.z = beast.basePosition.z + recoil;
        
        if (hitProgress >= 1) {
          // Reset position
          beast.group.position.z = beast.basePosition.z;
        }
        break;
      
      case 'defend':
        // Crouch slightly
        beast.group.scale.y = 0.9;
        break;
      
      case 'victory':
        // Jump celebration
        const victoryProgress = beast.animationTime % 1.5;
        beast.group.position.y = beast.basePosition.y + Math.abs(Math.sin(victoryProgress * Math.PI * 2)) * 0.8;
        break;
      
      case 'defeat':
        // Fall down
        const defeatProgress = Math.min(beast.animationTime / 2, 1);
        beast.group.rotation.x = defeatProgress * Math.PI / 2;
        beast.group.position.y = beast.basePosition.y * (1 - defeatProgress * 0.5);
        break;
    }
  }

  private ensureRiggedAnimation(beast: BeastActor) {
    const config = RIGGED_ANIMATION_MAP[beast.currentAnimation] ?? RIGGED_ANIMATION_MAP.idle;
    let clipName = config.clip;

    if (!beast.model.hasAnimation(clipName) && config.fallbackClip) {
      clipName = config.fallbackClip;
    }

    if (!beast.model.hasAnimation(clipName)) {
      if (clipName !== 'idle' && beast.model.hasAnimation('idle')) {
        clipName = 'idle';
      } else {
        return;
      }
    }

    const shouldRestart = beast.activeRigClip !== clipName;
    const played = beast.model.playAnimation(clipName, {
      loop: config.loop,
      clampWhenFinished: config.clamp ?? false,
      forceRestart: shouldRestart,
    });

    if (played) {
      beast.activeRigClip = clipName;
    }

    if (clipName === 'idle') {
      beast.group.position.copy(beast.basePosition);
      beast.group.rotation.y = beast.baseRotation;
      beast.group.rotation.x = 0;
    }
  }

  /**
   * TREMOR ao receber dano (estilo Pokémon Game Boy/DS)
   */
  private updateBeastShake(beast: BeastActor) {
    if (beast.shakeIntensity > 0) {
      // Tremor rápido horizontal + vertical
      const shakeX = (Math.random() - 0.5) * beast.shakeIntensity;
      const shakeZ = (Math.random() - 0.5) * beast.shakeIntensity;
      
      beast.group.position.x = beast.basePosition.x + shakeX;
      beast.group.position.z = beast.basePosition.z + shakeZ;
      
      // Diminuir intensidade gradualmente
      beast.shakeIntensity *= 0.95;
      
      if (beast.shakeIntensity < 0.01) {
        beast.shakeIntensity = 0;
        beast.group.position.x = beast.basePosition.x;
        beast.group.position.z = beast.basePosition.z;
      }
    }
  }

  private updateCamera(delta: number) {
    // Smooth camera transition
    this.camera.position.lerp(this.cameraTargetPosition, this.cameraTransitionSpeed);
    
    // Look at target with smooth transition
    const currentLookAt = new THREE.Vector3();
    this.camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(10).add(this.camera.position);
    currentLookAt.lerp(this.cameraTargetLookAt, this.cameraTransitionSpeed);
    this.camera.lookAt(currentLookAt);
  }

  /**
   * Resize renderer
   */
  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Clean up
   */
  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    if (this.playerBeast) {
      this.playerBeast.model.dispose();
    }
    
    if (this.enemyBeast) {
      this.enemyBeast.model.dispose();
    }
    
    if (this.grass) {
      // PS1Grass has its own dispose if needed
    }
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        }
      }
    });
    
    this.renderer.dispose();
    
    console.log('[ImmersiveBattle] Disposed');
  }

  /**
   * Get renderer DOM element
   */
  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }
}
