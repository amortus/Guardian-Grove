/**
 * Guardian Hub Scene 3D
 * Composes the new Guardian Grove hub using existing ranch/village assets
 * and lightweight Three.js primitives for bespoke elements (árvore casa, poço, quadro, ponte).
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { ThreeScene } from '../ThreeScene';
import { BeastModel } from '../models/BeastModel';
import { PS1Water } from '../water/PS1Water';
import { getSkyColor } from '../../utils/day-night';

type Vec2 = [number, number];
type Vec3 = [number, number, number];

interface ObstacleCircle {
  position: Vec2;
  radius: number;
}

interface WalkableZone {
  position: Vec2;
  radius: number;
}

interface WaterSegment {
  position: Vec3;
  radius: number;
  scaleX?: number;
  scaleZ?: number;
  rotation?: number;
}

interface VillageStructure {
  model: string;
  position: Vec3;
  rotation?: number;
  scale?: number;
}

interface InteractiveObject {
  id: string;
  position: Vec3;
  radius: number;
}

const WORLD_Y_OFFSET = -1.15;

const TREE_HOUSE_POSITION: Vec3 = [-5.4, 0, -2.4];
const TREE_HOUSE_SCALE = 3.2;
const TREE_HOUSE_DOOR_HEIGHT = 2.2;

const CABIN_STRUCTURES: VillageStructure[] = [
  {
    model: '/assets/3d/Village/Temple.glb',
    position: [4.6, 0, 0.9],
    rotation: Math.PI * 0.15,
    scale: 0.95,
  },
  {
    model: '/assets/3d/Village/Tavern.glb',
    position: [2.6, 0, 3.2],
    rotation: -Math.PI * 0.1,
    scale: 0.85,
  },
];

const WATER_SEGMENTS: WaterSegment[] = [
  { position: [1.2, 0, 1.8], radius: 1.4, scaleX: 1.6, scaleZ: 1.0, rotation: Math.PI * 0.05 },
  { position: [2.6, 0, 2.4], radius: 1.2, scaleX: 1.8, scaleZ: 1.0, rotation: -Math.PI * 0.05 },
  { position: [3.8, 0, 2.8], radius: 1.0, scaleX: 1.6, scaleZ: 0.9, rotation: -Math.PI * 0.02 },
];

const WALKABLE_ZONES: WalkableZone[] = [
  { position: [-5.2, -2.2], radius: 2.6 },
  { position: [-2.3, -1.5], radius: 2.8 },
  { position: [0.0, -0.4], radius: 3.0 },
  { position: [2.2, 0.8], radius: 2.7 },
  { position: [4.4, 1.6], radius: 2.6 },
];

const INTERACTIVE_OBJECTS: InteractiveObject[] = [
  { id: 'mission_board', position: [-6.6, 0, -0.6], radius: 1.1 },
  { id: 'craft_well', position: [5.0, 0, 3.6], radius: 1.0 },
  { id: 'tree_house', position: TREE_HOUSE_POSITION, radius: 2.6 },
  { id: 'tavern', position: CABIN_STRUCTURES[1].position, radius: 1.8 },
  { id: 'temple', position: CABIN_STRUCTURES[0].position, radius: 1.9 },
];

const WALKWAY_NODES: Vec2[] = [
  [-6.4, -2.1],
  [-4.8, -2.4],
  [-3.4, -1.8],
  [-1.2, -1.2],
  [0.6, -0.2],
  [2.4, 1.0],
  [4.2, 1.6],
  [5.4, 2.4],
];

const WALKWAY_RADIUS = 2.1;
const WALKWAY_COLOR = 0xe8d5a0;

export class GuardianHubScene3D {
  private threeScene: ThreeScene;
  private gltfLoader = new GLTFLoader();
  private gltfCache = new Map<string, THREE.Group>();

  private decorationsRoot: THREE.Group | null = null;
  private waterSegments: PS1Water[] = [];
  private beastModel: BeastModel | null = null;
  private beastGroup: THREE.Group | null = null;
  private activeRigAnimation: 'idle' | 'walk' | null = null;
  private idleAnimation: (() => void) | null = null;
  private baseYPosition = WORLD_Y_OFFSET;
  private needsFit = false;
  private isMoving = false;
  private currentTarget: THREE.Vector3 | null = null;
  private nextMoveTime = 0;
  private elapsedTime = 0;

  private obstacles: ObstacleCircle[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.threeScene = new ThreeScene(canvas);
    this.setupEnvironment();
  }

  private setupEnvironment() {
    const scene = this.threeScene.getScene();
    const camera = this.threeScene.getCamera() as THREE.PerspectiveCamera;

    camera.fov = 44;
    camera.position.set(0.8, 5.8, 10.4);
    camera.lookAt(0, WORLD_Y_OFFSET + 1.0, 0);
    camera.updateProjectionMatrix();

    const skyColor = getSkyColor();
    scene.background = new THREE.Color(skyColor.r, skyColor.g, skyColor.b);
    scene.fog = new THREE.Fog(scene.background, 20, 46);

    this.rebuildDecorations();
  }

  private rebuildDecorations() {
    this.clearDecorations();

    this.decorationsRoot = new THREE.Group();
    this.decorationsRoot.position.y = WORLD_Y_OFFSET;
    this.threeScene.addObject(this.decorationsRoot);

    this.createGround();
    this.createWalkway();
    this.createRiver();
    this.createTreeHouse();
    this.createCabins();
    this.createWell();
    this.createMissionBoard();
    this.createBridge();
    this.createNatureProps();
    this.setupObstacles();
  }

  private clearDecorations() {
    this.waterSegments.forEach((segment) => segment.dispose());
    this.waterSegments = [];

    if (this.decorationsRoot) {
      this.disposeObject(this.decorationsRoot);
      this.threeScene.removeObject(this.decorationsRoot);
      this.decorationsRoot = null;
    }
  }

  private createGround() {
    const groundSize = 64;
    const geometry = new THREE.PlaneGeometry(groundSize, groundSize, 80, 80);
    const positions = geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const radialFalloff = 1 - Math.min(1, Math.sqrt(x * x + z * z) / (groundSize * 0.6));
      const noise =
        Math.sin(x * 0.12) * 0.04 +
        Math.cos(z * 0.1) * 0.03 +
        Math.sin((x + z) * 0.08) * 0.02;
      positions.setY(i, noise * radialFalloff);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x4f7d4c,
      roughness: 0.85,
      metalness: 0.04,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = WORLD_Y_OFFSET;
    mesh.receiveShadow = true;
    this.addDecoration(mesh);
  }

  private createWalkway() {
    const walkwayMaterial = new THREE.MeshStandardMaterial({
      color: WALKWAY_COLOR,
      roughness: 0.7,
      metalness: 0.05,
    });

    WALKWAY_NODES.forEach(([x, z], index) => {
      const circleGeometry = new THREE.CircleGeometry(WALKWAY_RADIUS, 32);
      const slab = new THREE.Mesh(circleGeometry, walkwayMaterial);
      slab.rotation.x = -Math.PI / 2;
      slab.position.set(x, WORLD_Y_OFFSET + 0.02 + (index % 2 === 0 ? 0.01 : 0), z);
      slab.receiveShadow = true;
      this.addDecoration(slab);
    });
  }

  private createRiver() {
    const riverGroup = new THREE.Group();

    WATER_SEGMENTS.forEach((segment) => {
      const water = new PS1Water({
        size: segment.radius,
        segments: 24,
        color: 0x3bb6d5,
        waveSpeed: 0.8,
        waveHeight: 0.05,
      });
      const mesh = water.getMesh();
      mesh.position.set(segment.position[0], segment.position[1] + 0.03, segment.position[2]);
      mesh.scale.set(segment.scaleX ?? 1, 1, segment.scaleZ ?? 1);
      if (segment.rotation) {
        mesh.rotation.z = segment.rotation;
      }
      riverGroup.add(mesh);
      this.waterSegments.push(water);

      this.obstacles.push({
        position: [segment.position[0], segment.position[2]],
        radius: segment.radius * (segment.scaleX ?? 1),
      });
    });

    this.addDecoration(riverGroup);
  }

  private createTreeHouse() {
    this.loadStaticModel('/assets/3d/Ranch/Tree/Tree1.glb', {
      position: TREE_HOUSE_POSITION,
      rotationY: -Math.PI * 0.15,
      scaleMultiplier: TREE_HOUSE_SCALE,
      targetHeight: 10,
      verticalOffset: -0.2,
      name: 'guardian-tree-house',
      onLoaded: (group) => {
        this.decorateTreeHouse(group);
        this.obstacles.push({ position: [TREE_HOUSE_POSITION[0], TREE_HOUSE_POSITION[2]], radius: 2.8 });
      },
    });
  }

  private decorateTreeHouse(group: THREE.Group) {
    const doorGeometry = new THREE.CylinderGeometry(0.65, 0.65, TREE_HOUSE_DOOR_HEIGHT, 16, 1, false, 0, Math.PI);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x7c4f2b, roughness: 0.75 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.rotation.set(0, Math.PI, 0);
    door.position.set(0, 1.1, 1.1);
    group.add(door);

    const archGeometry = new THREE.TorusGeometry(0.75, 0.1, 12, 32, Math.PI);
    const archMaterial = new THREE.MeshStandardMaterial({ color: 0x976032, roughness: 0.8 });
    const arch = new THREE.Mesh(archGeometry, archMaterial);
    arch.rotation.set(Math.PI / 2, 0, 0);
    arch.position.set(0, 1.5, 1.05);
    group.add(arch);

    const light = new THREE.PointLight(0xfff4c2, 0.8, 6, 2);
    light.position.set(0, 2.3, 1.4);
    group.add(light);
  }

  private createCabins() {
    CABIN_STRUCTURES.forEach((structure) => {
      this.loadStaticModel(structure.model, {
        position: structure.position,
        rotationY: structure.rotation ?? 0,
        targetHeight: 4.2,
        scaleMultiplier: structure.scale ?? 1,
        name: 'guardian-cabin',
        verticalOffset: -0.25,
        onLoaded: () => {
          this.obstacles.push({
            position: [structure.position[0], structure.position[2]],
            radius: 2.0,
          });
        },
      });
    });
  }

  private createWell() {
    const group = new THREE.Group();
    group.position.set(5.0, WORLD_Y_OFFSET + 0.05, 3.6);

    const baseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.7, 24);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a8f9a,
      roughness: 0.8,
      metalness: 0.05,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const waterPlane = new PS1Water({ size: 0.6, color: 0x4fc7f1, waveHeight: 0.02, waveSpeed: 0.9 });
    const waterMesh = waterPlane.getMesh();
    waterMesh.position.y = 0.25;
    waterMesh.scale.set(0.9, 1, 0.9);
    group.add(waterMesh);
    this.waterSegments.push(waterPlane);

    const postGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 12);
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x784f2a, roughness: 0.7 });
    const leftPost = new THREE.Mesh(postGeometry, postMaterial);
    leftPost.position.set(-0.5, 1.0, 0);
    const rightPost = leftPost.clone();
    rightPost.position.x = 0.5;
    group.add(leftPost);
    group.add(rightPost);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 0.7, 4),
      new THREE.MeshStandardMaterial({ color: 0x2f8769, roughness: 0.65 }),
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 1.9;
    group.add(roof);

    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.2), postMaterial);
    beam.position.y = 1.1;
    group.add(beam);

    this.addDecoration(group);

    this.obstacles.push({ position: [5.0, 3.6], radius: 1.2 });
  }

  private createMissionBoard() {
    const group = new THREE.Group();
    group.position.set(-6.6, WORLD_Y_OFFSET + 0.02, -0.6);
    group.rotation.y = Math.PI * 0.32;

    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x6c4828, roughness: 0.82 });
    const plankMaterial = new THREE.MeshStandardMaterial({ color: 0xf6d6a6, roughness: 0.6 });

    const postGeometry = new THREE.BoxGeometry(0.2, 2.2, 0.2);
    const leftPost = new THREE.Mesh(postGeometry, postMaterial);
    leftPost.position.set(-0.9, 1.1, 0);
    const rightPost = leftPost.clone();
    rightPost.position.x = 0.9;
    group.add(leftPost);
    group.add(rightPost);

    const boardGeometry = new THREE.BoxGeometry(2.4, 1.6, 0.1);
    const board = new THREE.Mesh(boardGeometry, plankMaterial);
    board.position.set(0, 1.7, 0);
    group.add(board);

    const headerGeometry = new THREE.BoxGeometry(2.6, 0.25, 0.2);
    const header = new THREE.Mesh(headerGeometry, postMaterial);
    header.position.set(0, 2.4, 0);
    group.add(header);

    this.addDecoration(group);

    this.obstacles.push({ position: [-6.6, -0.6], radius: 1.2 });
  }

  private createBridge() {
    const group = new THREE.Group();
    group.position.set(2.0, WORLD_Y_OFFSET + 0.02, 2.2);
    group.rotation.y = Math.PI * 0.06;

    const plankMaterial = new THREE.MeshStandardMaterial({ color: 0xb7834f, roughness: 0.75 });
    const plankGeometry = new THREE.BoxGeometry(2.4, 0.08, 1.2);
    const deck = new THREE.Mesh(plankGeometry, plankMaterial);
    deck.receiveShadow = true;
    deck.castShadow = true;
    group.add(deck);

    const railGeometry = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8);
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0x905c32, roughness: 0.65 });

    const leftRail = new THREE.Mesh(railGeometry, railMaterial);
    leftRail.rotation.z = Math.PI / 2;
    leftRail.position.set(0, 0.45, 0.55);
    group.add(leftRail);
    const rightRail = leftRail.clone();
    rightRail.position.z = -0.55;
    group.add(rightRail);

    this.addDecoration(group);
  }

  private createNatureProps() {
    const flowerPositions: Vec3[] = [
      [-3.6, 0, -2.6],
      [-3.0, 0, -1.8],
      [-0.8, 0, -1.4],
      [1.4, 0, 0.6],
      [3.4, 0, 1.4],
      [4.6, 0, 2.4],
    ];

    flowerPositions.forEach((pos, index) => {
      this.loadStaticModel('/assets/3d/Ranch/Flower/Sunlit_Blossom_1111142848_texture.glb', {
        position: pos,
        rotationY: (index / flowerPositions.length) * Math.PI * 2,
        targetHeight: 0.7,
        scaleMultiplier: 0.8,
        verticalOffset: -0.05,
        name: 'guardian-flower',
      });
    });

    const rockPositions: Vec3[] = [
      [-4.4, 0, 0.4],
      [-2.4, 0, -0.2],
      [0.8, 0, 1.4],
      [3.0, 0, -0.8],
      [5.4, 0, -0.2],
    ];

    rockPositions.forEach((pos, index) => {
      this.loadStaticModel('/assets/3d/Ranch/Rock/Stone1.glb', {
        position: pos,
        targetHeight: 0.9,
        scaleMultiplier: 0.7 + (index % 3) * 0.15,
        rotationY: (index / 5) * Math.PI * 2,
        verticalOffset: -0.05,
        name: 'guardian-rock',
      });
      this.obstacles.push({ position: [pos[0], pos[2]], radius: 0.6 });
    });

    const treePositions: Vec3[] = [
      [-2.0, 0, 1.8],
      [-0.4, 0, 2.6],
      [3.6, 0, -1.6],
      [5.2, 0, 0.2],
    ];

    treePositions.forEach((pos, index) => {
      this.loadStaticModel('/assets/3d/Ranch/Tree/Tree2.glb', {
        position: pos,
        targetHeight: 4.6,
        scaleMultiplier: 1.1 + (index % 2) * 0.15,
        rotationY: Math.random() * Math.PI,
        verticalOffset: -0.2,
        name: 'guardian-tree',
      });
      this.obstacles.push({ position: [pos[0], pos[2]], radius: 1.2 });
    });
  }

  private setupObstacles() {
    // Already populated while creating props, but make sure key interactables are present
    INTERACTIVE_OBJECTS.forEach((obj) => {
      this.obstacles.push({ position: [obj.position[0], obj.position[2]], radius: obj.radius });
    });
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

  private async loadStaticModel(
    url: string,
    options: {
      position: Vec3;
      rotationY?: number;
      targetHeight?: number;
      scaleMultiplier?: number;
      verticalOffset?: number;
      name?: string;
      onLoaded?: (group: THREE.Group) => void;
    },
  ) {
    try {
      const group = await this.loadGLTF(url);
      group.position.set(options.position[0], options.position[1] + (options.verticalOffset ?? 0), options.position[2]);
      group.rotation.y = options.rotationY ?? 0;
      group.name = options.name ?? 'guardian-prop';

      if (options.targetHeight) {
        const box = new THREE.Box3().setFromObject(group);
        const size = box.getSize(new THREE.Vector3());
        const currentHeight = size.y || 1;
        const scale = (options.targetHeight / currentHeight) * (options.scaleMultiplier ?? 1);
        group.scale.setScalar(scale);
      } else if (options.scaleMultiplier) {
        group.scale.setScalar(options.scaleMultiplier);
      }

      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.addDecoration(group);
      options.onLoaded?.(group);
    } catch (error) {
      console.error(`[GuardianHubScene3D] Failed to load model '${url}'`, error);
    }
  }

  private async loadGLTF(url: string): Promise<THREE.Group> {
    if (this.gltfCache.has(url)) {
      return this.gltfCache.get(url)!.clone(true);
    }

    const gltf = await this.gltfLoader.loadAsync(url);
    this.gltfCache.set(url, gltf.scene);
    return gltf.scene.clone(true);
  }

  public setBeast(beastLine: string) {
    if (this.beastGroup) {
      this.threeScene.removeObject(this.beastGroup);
      this.beastModel?.dispose();
    }

    this.beastModel = new BeastModel(beastLine);
    this.beastGroup = this.beastModel.getGroup();
    this.needsFit = true;
    this.baseYPosition = WORLD_Y_OFFSET - 0.48;
    this.isMoving = false;
    this.currentTarget = null;
    this.nextMoveTime = 1.5 + Math.random() * 1.5;
    this.activeRigAnimation = null;

    this.beastGroup.position.set(-4.6, 0, -2.0);
    this.threeScene.addObject(this.beastGroup);

    if (this.beastModel.hasRiggedAnimations()) {
      this.playRigAnimation('idle');
    } else {
      this.idleAnimation = this.beastModel.playIdleAnimation();
    }
  }

  public update(delta: number) {
    this.elapsedTime += delta;

    this.beastModel?.update(delta);
    this.waterSegments.forEach((segment) => segment.update(delta));

    if (this.beastGroup && this.needsFit && this.fitBeastToScene(this.beastGroup)) {
      this.needsFit = false;
    }

    this.updateBeastMovement(delta);

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

    this.nextMoveTime -= delta;

    if (!this.isMoving && this.nextMoveTime <= 0) {
      const nextTarget = this.chooseNextTarget(this.beastGroup.position);
      if (nextTarget) {
        this.currentTarget = nextTarget;
        this.isMoving = true;
        this.playRigAnimation('walk');
      } else {
        this.nextMoveTime = 2.5 + Math.random() * 1.5;
      }
    }

    if (this.isMoving && this.currentTarget) {
      const speed = 1.25;
      const current = this.beastGroup.position;
      const direction = new THREE.Vector3().subVectors(this.currentTarget, current);
      const distance = direction.length();

      if (distance < 0.1) {
        this.isMoving = false;
        this.currentTarget = null;
        this.nextMoveTime = 2.5 + Math.random() * 1.8;
        this.playRigAnimation('idle');
        return;
      }

      direction.normalize();
      current.addScaledVector(direction, speed * delta);
      this.beastGroup.lookAt(this.currentTarget.x, current.y, this.currentTarget.z);
    }
  }

  private chooseNextTarget(current: THREE.Vector3): THREE.Vector3 | null {
    const candidates = WALKABLE_ZONES.map((zone) => new THREE.Vector3(zone.position[0], 0, zone.position[1]));
    candidates.push(new THREE.Vector3(0, 0, 0));

    const shuffled = candidates.sort(() => Math.random() - 0.5);
    for (const candidate of shuffled) {
      if (this.isPositionValid(candidate.x, candidate.z, 0.6)) {
        return candidate;
      }
    }
    return null;
  }

  private isPositionValid(x: number, z: number, clearance: number = 0.5): boolean {
    const insideWalkway = WALKABLE_ZONES.some((zone) => {
      const dx = x - zone.position[0];
      const dz = z - zone.position[1];
      return Math.sqrt(dx * dx + dz * dz) <= zone.radius;
    });

    if (!insideWalkway) {
      return false;
    }

    for (const obstacle of this.obstacles) {
      const dx = x - obstacle.position[0];
      const dz = z - obstacle.position[1];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < obstacle.radius + clearance) {
        return false;
      }
    }

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
    const played = this.beastModel.playAnimation(name, {
      loop: THREE.LoopRepeat,
      clampWhenFinished: false,
      fadeIn: 0.18,
      fadeOut: 0.18,
      forceRestart: true,
    });
    if (played) {
      this.activeRigAnimation = name;
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
    const scale = maxDim > 0 ? 1.7 / maxDim : 1;
    group.scale.setScalar(scale);
    const offset = center.multiplyScalar(scale);
    group.position.set(-offset.x, this.baseYPosition - offset.y, -offset.z);
    return true;
  }
}

