/**
 * Beast 3D Model Generator
 * Creates low-poly PS1-style beast models
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface RegisteredAnimationOptions {
  loop?: THREE.AnimationActionLoopStyles;
  clampWhenFinished?: boolean;
  timeScale?: number;
}

interface PlayAnimationOptions extends RegisteredAnimationOptions {
  fadeIn?: number;
  fadeOut?: number;
  forceRestart?: boolean;
}

interface ImportedAnimationConfig {
  name: string;
  file: string;
  defaults: RegisteredAnimationOptions;
}

interface ImportedModelConfig {
  basePath: string;
  idleFile: string;
  idleName?: string;
  idleDefaults?: RegisteredAnimationOptions;
  fallback: () => void;
  animations: ImportedAnimationConfig[];
  targetHeight?: number;
}

export class BeastModel {
  private group: THREE.Group;
  private mixer: THREE.AnimationMixer | null = null;
  private animations: Map<string, THREE.AnimationAction> = new Map();
  private animationDefaults: Map<string, RegisteredAnimationOptions> = new Map();
  private currentAnimationName: string | null = null;
  private isImportedModel = false;

  constructor(beastLine: string) {
    this.group = new THREE.Group();
    this.createModel(beastLine);
  }

  private createModel(beastLine: string) {
    // Create low-poly model based on beast line
    switch (beastLine) {
      case 'olgrim':
        this.loadOlgrimModel();
        break;
      case 'terravox':
        this.loadTerravoxModel();
        break;
      case 'feralis':
        this.loadFeralisModel();
        break;
      case 'brontis':
        this.loadBrontisModel();
        break;
      case 'zephyra':
        this.loadZephyraModel();
        break;
      case 'ignar':
        this.loadIgnarModel();
        break;
      case 'mirella':
        this.loadMirellaModel();
        break;
      case 'umbrix':
        this.loadUmbrixModel();
        break;
      case 'sylphid':
        this.loadSylphidModel();
        break;
      case 'raukor':
        this.loadRaukorModel();
        break;
      default:
        this.createDefaultBeast();
    }
  }

  // Olgrim - Olho flutuante com tentáculos
  private createOlgrim() {
    this.isImportedModel = false;
    // Main eye body (sphere)
    const eyeGeometry = new THREE.SphereGeometry(0.8, 8, 6);
    const eyeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x9f7aea,
      flatShading: true 
    });
    const eyeMesh = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eyeMesh.position.y = 1.5;
    this.group.add(eyeMesh);

    // Pupil
    const pupilGeometry = new THREE.SphereGeometry(0.3, 6, 4);
    const pupilMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x000000,
      flatShading: true 
    });
    const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    pupil.position.set(0, 1.5, 0.6);
    this.group.add(pupil);

    // Tentacles (4)
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 * i) / 4;
      const tentacle = this.createTentacle();
      tentacle.position.set(
        Math.cos(angle) * 0.6,
        1,
        Math.sin(angle) * 0.6
      );
      tentacle.rotation.z = angle;
      this.group.add(tentacle);
    }
  }

  private createTentacle(): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(0.1, 0.05, 1.2, 4);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x7c5fd3,
      flatShading: true 
    });
    return new THREE.Mesh(geometry, material);
  }

  // Terravox - Golem de pedra
  private createTerravox() {
    this.isImportedModel = false;
    this.isImportedModel = false;
    // Body (cube with rough texture)
    const bodyGeometry = new THREE.BoxGeometry(1.2, 1.5, 1);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8b7355,
      flatShading: true 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    this.group.add(body);

    // Head (smaller cube)
    const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 2;
    this.group.add(head);

    // Arms (cylinders)
    const armGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 6);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.8, 1, 0);
    this.group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.8, 1, 0);
    this.group.add(rightArm);

    // Eyes (glowing)
    const eyeGeometry = new THREE.SphereGeometry(0.1, 4, 4);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 2.1, 0.4);
    this.group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 2.1, 0.4);
    this.group.add(rightEye);
  }

  // Feralis - Felino ágil
  private createFeralis() {
    this.isImportedModel = false;
    // Body (elongated box)
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.5, 1.2);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x48bb78,
      flatShading: true 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    this.group.add(body);

    // Head (smaller box)
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.8, 0.8);
    this.group.add(head);

    // Ears (pyramids)
    const earGeometry = new THREE.ConeGeometry(0.15, 0.3, 4);
    
    const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
    leftEar.position.set(-0.2, 1.1, 0.8);
    this.group.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
    rightEar.position.set(0.2, 1.1, 0.8);
    this.group.add(rightEar);

    // Tail
    const tailGeometry = new THREE.CylinderGeometry(0.08, 0.04, 1, 4);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0.6, -0.8);
    tail.rotation.x = Math.PI / 4;
    this.group.add(tail);

    // Legs (4)
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.5, 4);
    const positions = [
      [-0.3, 0.25, 0.4],
      [0.3, 0.25, 0.4],
      [-0.3, 0.25, -0.4],
      [0.3, 0.25, -0.4]
    ];

    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, bodyMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      this.group.add(leg);
    });
  }

  // Brontis - Réptil bípede robusto
  private createBrontis() {
    this.isImportedModel = false;
    // Body (large box)
    const bodyGeometry = new THREE.BoxGeometry(1, 1.2, 1.5);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x38a169,
      flatShading: true 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.2;
    this.group.add(body);

    // Head (box)
    const headGeometry = new THREE.BoxGeometry(0.7, 0.6, 0.8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 1.8, 1);
    this.group.add(head);

    // Legs (2 large ones - bípede)
    const legGeometry = new THREE.CylinderGeometry(0.25, 0.3, 1, 6);
    
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.4, 0.5, 0);
    this.group.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.4, 0.5, 0);
    this.group.add(rightLeg);

    // Tail (cone)
    const tailGeometry = new THREE.ConeGeometry(0.3, 1.5, 6);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0.8, -1.2);
    tail.rotation.x = Math.PI / 2;
    this.group.add(tail);

    // Small arms
    const armGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 5);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.6, 1.4, 0.5);
    this.group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.6, 1.4, 0.5);
    this.group.add(rightArm);
  }

  // Zephyra - Ave veloz
  private createZephyra() {
    this.isImportedModel = false;
    // Body (small)
    const bodyGeometry = new THREE.SphereGeometry(0.4, 6, 5);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x63b3ed,
      flatShading: true 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.5;
    this.group.add(body);

    // Head (smaller sphere)
    const headGeometry = new THREE.SphereGeometry(0.25, 5, 4);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 1.8, 0.4);
    this.group.add(head);

    // Beak (cone)
    const beakGeometry = new THREE.ConeGeometry(0.1, 0.3, 4);
    const beakMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffa500,
      flatShading: true 
    });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.position.set(0, 1.8, 0.7);
    beak.rotation.x = Math.PI / 2;
    this.group.add(beak);

    // Wings (triangular planes)
    const wingGeometry = new THREE.ConeGeometry(0.6, 1.2, 3);
    
    const leftWing = new THREE.Mesh(wingGeometry, bodyMaterial);
    leftWing.position.set(-0.6, 1.5, 0);
    leftWing.rotation.z = Math.PI / 2;
    this.group.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, bodyMaterial);
    rightWing.position.set(0.6, 1.5, 0);
    rightWing.rotation.z = -Math.PI / 2;
    this.group.add(rightWing);

    // Tail feathers
    const tailGeometry = new THREE.ConeGeometry(0.2, 0.8, 3);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 1.3, -0.6);
    tail.rotation.x = -Math.PI / 4;
    this.group.add(tail);
  }

  // Ignar - Fera elemental de fogo
  private createIgnar() {
    this.isImportedModel = false;
    // Body (aggressive shape)
    const bodyGeometry = new THREE.BoxGeometry(1.1, 0.9, 1.4);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xfc8181,
      flatShading: true,
      emissive: 0xff4444,
      emissiveIntensity: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    this.group.add(body);

    // Head (box with horns)
    const headGeometry = new THREE.BoxGeometry(0.8, 0.7, 0.7);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 1.2, 0.9);
    this.group.add(head);

    // Horns (cones)
    const hornGeometry = new THREE.ConeGeometry(0.15, 0.5, 4);
    const hornMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8b0000,
      flatShading: true 
    });
    
    const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    leftHorn.position.set(-0.3, 1.7, 0.9);
    this.group.add(leftHorn);
    
    const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    rightHorn.position.set(0.3, 1.7, 0.9);
    this.group.add(rightHorn);

    // Legs (4)
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.18, 0.7, 5);
    const positions = [
      [-0.4, 0.35, 0.5],
      [0.4, 0.35, 0.5],
      [-0.4, 0.35, -0.5],
      [0.4, 0.35, -0.5]
    ];

    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, bodyMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      this.group.add(leg);
    });

    // Flame particles (simple)
    const flameGeometry = new THREE.ConeGeometry(0.2, 0.5, 4);
    const flameMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff6600,
      transparent: true,
      opacity: 0.7
    });
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.set(0, 0.5, -0.9);
    flame.rotation.x = Math.PI;
    this.group.add(flame);
  }

  // Raukor - Fera lupina (lobo)
  private createRaukor() {
    this.isImportedModel = false;
    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.7, 0.6, 1.3);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xa0aec0,
      flatShading: true 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.7;
    this.group.add(body);

    // Head (elongated)
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.9, 1);
    this.group.add(head);

    // Snout (cone)
    const snoutGeometry = new THREE.ConeGeometry(0.2, 0.4, 4);
    const snout = new THREE.Mesh(snoutGeometry, bodyMaterial);
    snout.position.set(0, 0.9, 1.5);
    snout.rotation.x = Math.PI / 2;
    this.group.add(snout);

    // Ears (cones)
    const earGeometry = new THREE.ConeGeometry(0.15, 0.4, 4);
    
    const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
    leftEar.position.set(-0.2, 1.3, 0.9);
    this.group.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
    rightEar.position.set(0.2, 1.3, 0.9);
    this.group.add(rightEar);

    // Legs (4)
    const legGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.6, 5);
    const positions = [
      [-0.3, 0.3, 0.5],
      [0.3, 0.3, 0.5],
      [-0.3, 0.3, -0.4],
      [0.3, 0.3, -0.4]
    ];

    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, bodyMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      this.group.add(leg);
    });

    // Tail
    const tailGeometry = new THREE.ConeGeometry(0.15, 0.8, 4);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0.7, -0.9);
    tail.rotation.x = -Math.PI / 4;
    this.group.add(tail);
  }

  // Default beast (placeholder para linhas não implementadas ainda)
  private createDefaultBeast() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x666666,
      flatShading: true 
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.5;
    this.group.add(mesh);
  }

  private loadImportedModel(config: ImportedModelConfig) {
    this.isImportedModel = true;
    const loader = new GLTFLoader();
    const idleName = config.idleName ?? 'idle';
    const idleDefaults = config.idleDefaults ?? { loop: THREE.LoopRepeat };

    loader.load(
      `${config.basePath}${config.idleFile}`,
      (gltf) => {
        const scene = gltf.scene;
        if (!scene) {
          console.warn('[BeastModel] Imported GLB returned empty scene. Falling back to procedural model.');
          this.isImportedModel = false;
          this.animations.clear();
          this.animationDefaults.clear();
          this.mixer = null;
          this.currentAnimationName = null;
          config.fallback();
          return;
        }

        this.prepareImportedScene(scene, config.targetHeight);
        this.group.add(scene);

        this.mixer = new THREE.AnimationMixer(scene);

        if (gltf.animations && gltf.animations.length > 0) {
          const idleClip = gltf.animations[0];
          this.registerAnimation(idleName, idleClip, {
            loop: idleDefaults.loop ?? THREE.LoopRepeat,
            clampWhenFinished: idleDefaults.clampWhenFinished ?? false,
            timeScale: idleDefaults.timeScale ?? 1,
          });
          this.playAnimation(idleName, {
            ...idleDefaults,
            loop: idleDefaults.loop ?? THREE.LoopRepeat,
            fadeIn: 0.2,
            forceRestart: true,
          });

          if (config.idleFile === 'Animation_Idle_02_withSkin.glb') {
            const idleAction = this.animations.get(idleName);
            if (idleAction) {
              this.animations.set('idle_02', idleAction);
              this.animationDefaults.set('idle_02', {
                loop: idleDefaults.loop ?? THREE.LoopRepeat,
                clampWhenFinished: idleDefaults.clampWhenFinished ?? false,
                timeScale: idleDefaults.timeScale ?? 1,
              });
            }
          } else {
            this.loadAdditionalAnimation(
              `${config.basePath}Animation_Idle_02_withSkin.glb`,
              'idle_02',
              { loop: THREE.LoopRepeat }
            );
          }
        }

        config.animations.forEach(({ name, file, defaults }) => {
          this.loadAdditionalAnimation(`${config.basePath}${file}`, name, defaults);
        });
      },
      undefined,
      (error) => {
        console.error('[BeastModel] Failed to load imported GLB:', error);
        this.isImportedModel = false;
        this.animations.clear();
        this.animationDefaults.clear();
        this.mixer = null;
        this.currentAnimationName = null;
        config.fallback();
      }
    );
  }

  private loadMirellaModel() {
    this.loadImportedModel({
      basePath: '/assets/3d/beasts/Mirella/',
      idleFile: 'Animation_Idle_withSkin.glb',
      fallback: () => this.createMirellaFallback(),
      animations: [
        { name: 'walk', file: 'Animation_Walking_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'run', file: 'Animation_Running_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
      ],
    });
  }

  private loadTerravoxModel() {
    this.loadImportedModel({
      basePath: '/assets/3d/beasts/Terravox/',
      idleFile: 'Animation_Idle_withSkin.glb',
      fallback: () => this.createTerravox(),
      animations: [
        { name: 'walk', file: 'Animation_Walking_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'run', file: 'Animation_Running_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'skill', file: 'Animation_Indoor_Swing_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
        { name: 'hit', file: 'Animation_Basic_Jump_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: false } },
        { name: 'dead', file: 'Animation_dying_backwards_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
        { name: 'victory', file: 'Animation_Cheer_with_Both_Hands_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'throw', file: 'Animation_Female_Crouch_Pick_Throw_Forward_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
      ],
      targetHeight: 2.6,
    });
  }

  private loadBrontisModel() {
    this.loadImportedModel({
      basePath: '/assets/3d/beasts/Brontis/',
      idleFile: 'Animation_Idle_withSkin.glb',
      fallback: () => this.createBrontis(),
      animations: [
        { name: 'walk', file: 'Animation_Walking_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'run', file: 'Animation_Running_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'skill', file: 'Animation_Axe_Spin_Attack_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
        { name: 'dead', file: 'Animation_falling_down_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
      ],
      targetHeight: 2.8,
    });
  }

  private loadFeralisModel() {
    this.loadImportedModel({
      basePath: '/assets/3d/beasts/Feralis/',
      idleFile: 'Animation_Idle_withSkin.glb',
      fallback: () => this.createFeralis(),
      animations: [
        { name: 'walk', file: 'Animation_Walking_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'run', file: 'Animation_Running_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'skill', file: 'Animation_mage_soell_cast_4_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
        { name: 'hit', file: 'Animation_mage_soell_cast_4_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: false } },
        { name: 'arise', file: 'Animation_Stand_Up7_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
        { name: 'dead', file: 'Animation_falling_down_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
      ],
      targetHeight: 2.2,
    });
  }

  private loadIgnarModel() {
    this.loadImportedModel({
      basePath: '/assets/3d/beasts/Ignar/',
      idleFile: 'Animation_Idle_withSkin.glb',
      fallback: () => this.createIgnar(),
      animations: [
        { name: 'walk', file: 'Animation_Walking_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'run', file: 'Animation_Running_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'skill', file: 'Animation_mage_soell_cast_3_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
        { name: 'hit', file: 'Animation_mage_soell_cast_3_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: false } },
        { name: 'arise', file: 'Animation_Stand_Up7_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
        { name: 'dead', file: 'Animation_falling_down_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
      ],
      targetHeight: 2.4,
    });
  }

  private loadOlgrimModel() {
    this.loadImportedModel({
      basePath: '/assets/3d/beasts/Olgrim/',
      idleFile: 'Animation_Idle_withSkin.glb',
      fallback: () => this.createOlgrim(),
      animations: [
        { name: 'walk', file: 'Animation_Walking_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'run', file: 'Animation_Running_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'skill', file: 'Animation_mage_soell_cast_6_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
        { name: 'hit', file: 'Animation_mage_soell_cast_6_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: false } },
        { name: 'arise', file: 'Animation_Stand_Up7_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
        { name: 'dead', file: 'Animation_falling_down_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
      ],
      targetHeight: 2.2,
    });
  }

  private loadRaukorModel() {
    this.loadImportedModel({
      basePath: '/assets/3d/beasts/Raukor/',
      idleFile: 'Animation_Running_withSkin.glb',
      fallback: () => this.createRaukor(),
      animations: [
        { name: 'walk', file: 'Animation_Walking_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'run', file: 'Animation_Running_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'skill', file: 'Animation_mage_soell_cast_4_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
        { name: 'arise', file: 'Animation_Stand_Up7_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
        { name: 'dead', file: 'Animation_falling_down_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
      ],
      targetHeight: 2.4,
    });
  }

  private loadSylphidModel() {
    this.loadImportedModel({
      basePath: '/assets/3d/beasts/Sylphid/',
      idleFile: 'Animation_Idle_withSkin.glb',
      fallback: () => this.createSylphid(),
      animations: [
        { name: 'walk', file: 'Animation_Walking_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'run', file: 'Animation_Running_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'skill', file: 'Animation_mage_soell_cast_7_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
        { name: 'arise', file: 'Animation_Stand_Up7_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
        { name: 'dead', file: 'Animation_falling_down_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
      ],
      targetHeight: 2.3,
    });
  }

  private loadUmbrixModel() {
    this.loadImportedModel({
      basePath: '/assets/3d/beasts/Umbrix/',
      idleFile: 'Animation_Idle_withSkin.glb',
      fallback: () => this.createUmbrix(),
      animations: [
        { name: 'walk', file: 'Animation_Walking_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'run', file: 'Animation_Running_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'skill', file: 'Animation_Skill_01_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
        { name: 'hit', file: 'Animation_mage_soell_cast_4_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: false } },
        { name: 'arise', file: 'Animation_Stand_Up7_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
        { name: 'dead', file: 'Animation_falling_down_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
      ],
      targetHeight: 2.3,
    });
  }

  private loadZephyraModel() {
    this.loadImportedModel({
      basePath: '/assets/3d/beasts/Zephyra/',
      idleFile: 'Animation_Idle_02_withSkin.glb',
      fallback: () => this.createZephyra(),
      animations: [
        { name: 'walk', file: 'Animation_Walking_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'run', file: 'Animation_Running_withSkin.glb', defaults: { loop: THREE.LoopRepeat } },
        { name: 'skill', file: 'Animation_mage_soell_cast_7_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
        { name: 'arise', file: 'Animation_Stand_Up7_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
        { name: 'dead', file: 'Animation_falling_down_withSkin.glb', defaults: { loop: THREE.LoopOnce, clampWhenFinished: true } },
      ],
      targetHeight: 2.4,
    });
  }

  private prepareImportedScene(root: THREE.Object3D, targetHeight: number = 2.4) {
    root.traverse((child) => {
      if (child instanceof THREE.Light || child instanceof THREE.Camera) {
        child.parent?.remove(child);
        return;
      }

      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (Array.isArray(child.material)) {
          child.material.forEach((material) => {
            material.side = THREE.DoubleSide;
          });
        } else if (child.material) {
          child.material.side = THREE.DoubleSide;
        }
      }
    });

    root.updateMatrixWorld(true);

    const boundingBox = new THREE.Box3().setFromObject(root);
    if (boundingBox.isEmpty()) {
      return;
    }

    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    if (size.y > 0) {
      const scale = targetHeight / size.y;
      root.scale.setScalar(scale);
    }

    root.updateMatrixWorld(true);

    const scaledBox = new THREE.Box3().setFromObject(root);
    const center = scaledBox.getCenter(new THREE.Vector3());
    const min = scaledBox.min;

    root.position.set(-center.x, -min.y, -center.z);

    root.updateMatrixWorld(true);
  }

  private loadAdditionalAnimation(url: string, name: string, defaults: RegisteredAnimationOptions) {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        if (!this.mixer) {
          return;
        }

        const [clip] = gltf.animations ?? [];
        if (!clip) {
          console.warn(`[BeastModel] No animation clip found in ${url}`);
          return;
        }

        this.registerAnimation(name, clip, defaults);
      },
      undefined,
      (error) => {
        // Silently ignore missing animation files (404 errors)
        // These animations are optional and may not exist for all beasts
        if (error?.message?.includes('404') || error?.message?.includes('Not Found')) {
          return;
        }
        console.error(`[BeastModel] Failed to load animation "${name}" from ${url}:`, error);
      }
    );
  }

  private registerAnimation(name: string, clip: THREE.AnimationClip, defaults: RegisteredAnimationOptions) {
    if (!this.mixer) {
      return;
    }

    const action = this.mixer.clipAction(clip);
    const loop = defaults.loop ?? THREE.LoopRepeat;
    action.enabled = false;
    action.stop();
    action.clampWhenFinished = defaults.clampWhenFinished ?? false;
    action.setLoop(loop, loop === THREE.LoopOnce ? 1 : Infinity);
    action.timeScale = defaults.timeScale ?? 1;

    this.animations.set(name, action);
    this.animationDefaults.set(name, defaults);
  }

  // Mirella - Criatura anfíbia (fallback procedural model)
  private createMirellaFallback() {
    this.isImportedModel = false;
    // Body (rounded, amphibian-like)
    const bodyGeometry = new THREE.SphereGeometry(0.7, 8, 6);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x4299e1,
      flatShading: true,
      shininess: 30
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.7;
    body.scale.set(1, 0.8, 1.2);
    this.group.add(body);

    // Head (small sphere)
    const headGeometry = new THREE.SphereGeometry(0.4, 6, 5);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 1.1, 0.7);
    this.group.add(head);

    // Eyes (large, frog-like)
    const eyeGeometry = new THREE.SphereGeometry(0.15, 6, 4);
    const eyeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffd700,
      flatShading: true 
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 1.3, 0.9);
    this.group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 1.3, 0.9);
    this.group.add(rightEye);

    // Legs (4, short and sturdy)
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.5, 5);
    const positions = [
      [-0.4, 0.25, 0.3],
      [0.4, 0.25, 0.3],
      [-0.4, 0.25, -0.3],
      [0.4, 0.25, -0.3]
    ];

    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, bodyMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      this.group.add(leg);
    });

    // Fin on back
    const finGeometry = new THREE.ConeGeometry(0.4, 0.8, 3);
    const finMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x2b6cb0,
      flatShading: true,
      transparent: true,
      opacity: 0.8
    });
    const fin = new THREE.Mesh(finGeometry, finMaterial);
    fin.position.set(0, 1.2, 0);
    fin.rotation.x = Math.PI / 2;
    this.group.add(fin);
  }

  // Umbrix - Besta das sombras
  private createUmbrix() {
    this.isImportedModel = false;
    // Body (elongated, serpentine)
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.6, 1.5);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x2d3748,
      flatShading: true,
      emissive: 0x1a202c,
      emissiveIntensity: 0.5
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    this.group.add(body);

    // Head (angular, menacing)
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.6);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.8, 1);
    this.group.add(head);

    // Eyes (glowing purple)
    const eyeGeometry = new THREE.SphereGeometry(0.1, 4, 3);
    const eyeMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x9f7aea
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 0.9, 1.3);
    this.group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 0.9, 1.3);
    this.group.add(rightEye);

    // Shadow tendrils (3)
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 * i) / 3;
      const tendrilGeometry = new THREE.CylinderGeometry(0.08, 0.04, 1, 4);
      const tendrilMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x1a202c,
        flatShading: true,
        transparent: true,
        opacity: 0.7
      });
      const tendril = new THREE.Mesh(tendrilGeometry, tendrilMaterial);
      tendril.position.set(
        Math.cos(angle) * 0.4,
        0.3,
        -0.8 + Math.sin(angle) * 0.4
      );
      tendril.rotation.x = -Math.PI / 6;
      this.group.add(tendril);
    }

    // Legs (4, low to ground)
    const legGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.5, 4);
    const positions = [
      [-0.3, 0.25, 0.5],
      [0.3, 0.25, 0.5],
      [-0.3, 0.25, -0.3],
      [0.3, 0.25, -0.3]
    ];

    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, bodyMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      this.group.add(leg);
    });
  }

  // Sylphid - Espírito etéreo
  private createSylphid() {
    this.isImportedModel = false;
    // Core (glowing orb)
    const coreGeometry = new THREE.SphereGeometry(0.5, 6, 5);
    const coreMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xfbbf24,
      flatShading: true,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.y = 1.5;
    this.group.add(core);

    // Ethereal rings (3 orbiting)
    const ringGeometry = new THREE.TorusGeometry(0.7, 0.08, 4, 8);
    const ringMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xf59e0b,
      flatShading: true,
      transparent: true,
      opacity: 0.6
    });

    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.y = 1.5;
      ring.rotation.x = (Math.PI / 3) * i;
      ring.rotation.y = (Math.PI / 4) * i;
      this.group.add(ring);
    }

    // Floating runes (small pyramids)
    const runeGeometry = new THREE.TetrahedronGeometry(0.15, 0);
    const runeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xfcd34d,
      flatShading: true,
      emissive: 0xfcd34d,
      emissiveIntensity: 0.5
    });

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const radius = 1.2;
      const rune = new THREE.Mesh(runeGeometry, runeMaterial);
      rune.position.set(
        Math.cos(angle) * radius,
        1.5 + Math.sin(i * 0.5) * 0.3,
        Math.sin(angle) * radius
      );
      this.group.add(rune);
    }

    // Energy wisps (particles)
    const wispGeometry = new THREE.SphereGeometry(0.1, 4, 3);
    const wispMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xfef3c7,
      transparent: true,
      opacity: 0.5
    });

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const wisp = new THREE.Mesh(wispGeometry, wispMaterial);
      wisp.position.set(
        Math.cos(angle) * 0.6,
        1.5 + (i % 2) * 0.3,
        Math.sin(angle) * 0.6
      );
      this.group.add(wisp);
    }
  }

  public update(delta: number) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }

  public playAnimation(name: string, options?: PlayAnimationOptions): boolean {
    if (!this.mixer) {
      return false;
    }

    const action = this.animations.get(name);
    if (!action) {
      return false;
    }

    const defaults = this.animationDefaults.get(name) ?? {};
    const loop = options?.loop ?? defaults.loop ?? THREE.LoopRepeat;
    const clampWhenFinished = options?.clampWhenFinished ?? defaults.clampWhenFinished ?? false;
    const timeScale = options?.timeScale ?? defaults.timeScale ?? 1;
    const fadeIn = options?.fadeIn ?? 0.15;
    const fadeOut = options?.fadeOut ?? 0.15;
    const forceRestart = options?.forceRestart ?? false;

    if (!forceRestart && this.currentAnimationName === name) {
      return true;
    }

    if (this.currentAnimationName && this.currentAnimationName !== name) {
      const previousAction = this.animations.get(this.currentAnimationName);
      previousAction?.fadeOut(fadeOut);
    }

    action.enabled = true;
    action.clampWhenFinished = clampWhenFinished;
    action.timeScale = timeScale;
    action.setLoop(loop, loop === THREE.LoopOnce ? 1 : Infinity);
    action.reset();
    action.fadeIn(fadeIn);
    action.play();

    this.currentAnimationName = name;
    return true;
  }

  public hasAnimation(name: string): boolean {
    return this.animations.has(name);
  }

  public hasRiggedAnimations(): boolean {
    return this.isImportedModel && this.mixer !== null && this.animations.size > 0;
  }

  public stopAnimations() {
    if (!this.mixer) {
      return;
    }

    this.animations.forEach((action) => {
      action.stop();
    });
    this.currentAnimationName = null;
  }

  // Simple idle animation
  public playIdleAnimation() {
    // Breathing/bobbing animation
    const startY = this.group.position.y;
    let time = 0;

    const animate = () => {
      time += 0.02;
      this.group.position.y = startY + Math.sin(time) * 0.1;
      this.group.rotation.y += 0.005;
    };

    return animate;
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public dispose() {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.group);
      this.mixer = null;
    }
    this.animations.clear();
    this.animationDefaults.clear();
    this.currentAnimationName = null;
    this.isImportedModel = false;

    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}

