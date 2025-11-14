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
  id: string;
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

interface InteractableEntry {
  id: string;
  mesh: THREE.Object3D;
  sprite: THREE.Sprite;
  target: THREE.Vector3;
}

const WORLD_Y_OFFSET = -1.15;

const TREE_HOUSE_POSITION: Vec3 = [-3.2, 0, -0.2];
const TREE_HOUSE_SCALE = 3.0;
const TREE_HOUSE_DOOR_HEIGHT = 2.2;

const CABIN_STRUCTURES: VillageStructure[] = [
  {
    id: 'temple',
    model: '/assets/3d/Village/Temple.glb',
    position: [3.6, 0, -0.4],
    rotation: Math.PI * 0.12,
    scale: 0.95,
  },
  {
    id: 'tavern',
    model: '/assets/3d/Village/Tavern.glb',
    position: [3.1, 0, 2.2],
    rotation: -Math.PI * 0.08,
    scale: 0.9,
  },
];

const WATER_SEGMENTS: WaterSegment[] = [
  { position: [-0.5, 0, 1.2], radius: 1.3, scaleX: 1.4, scaleZ: 1.0, rotation: Math.PI * 0.04 },
  { position: [1.2, 0, 1.8], radius: 1.2, scaleX: 1.5, scaleZ: 0.9, rotation: -Math.PI * 0.02 },
  { position: [2.6, 0, 2.4], radius: 1.1, scaleX: 1.6, scaleZ: 0.9, rotation: -Math.PI * 0.06 },
];

const WALKABLE_ZONES: WalkableZone[] = [
  { position: [-3.6, -0.8], radius: 2.4 },
  { position: [-1.6, -0.2], radius: 2.6 },
  { position: [0.6, 0.4], radius: 2.5 },
  { position: [2.0, 1.2], radius: 2.4 },
  { position: [3.4, 2.0], radius: 2.2 },
];

const INTERACTIVE_OBJECTS: InteractiveObject[] = [
  { id: 'mission_board', position: [-4.3, 0, -1.0], radius: 1.0 },
  { id: 'craft_well', position: [3.4, 0, 2.6], radius: 1.0 },
  { id: 'tree_house', position: TREE_HOUSE_POSITION, radius: 2.6 },
  { id: 'tavern', position: CABIN_STRUCTURES[1].position, radius: 1.8 },
  { id: 'temple', position: CABIN_STRUCTURES[0].position, radius: 1.9 },
];

const WALKWAY_NODES: Vec2[] = [
  [-4.4, -1.4],
  [-2.8, -0.8],
  [-1.2, -0.3],
  [0.4, 0.4],
  [2.0, 1.2],
  [3.2, 2.2],
  [3.8, 3.0],
];

const WALKWAY_RADIUS = 1.8;
const WALKWAY_COLOR = 0xf3e3bb;

const INTERACTIVE_OBJECT_MAP: Record<string, InteractiveObject> = INTERACTIVE_OBJECTS.reduce((acc, obj) => {
  acc[obj.id] = obj;
  return acc;
}, {} as Record<string, InteractiveObject>);

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
  private interactables: InteractableEntry[] = [];
  private hoveredInteractable: string | null = null;
  private interactionCallback?: (id: string) => void;
  private hoverCallback?: (id: string | null) => void;
  private pendingInteraction: { id: string; target: THREE.Vector3 } | null = null;
  private manualControl = false;
  private particlesSystem: THREE.Points | null = null;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();

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

    this.interactables = [];
    this.hoveredInteractable = null;
    this.pendingInteraction = null;
    this.manualControl = false;

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
    this.createLightingProps();
    this.createAmbientParticles();
    this.setupObstacles();
  }

  private clearDecorations() {
    this.waterSegments.forEach((segment) => segment.dispose());
    this.waterSegments = [];

     if (this.particlesSystem && this.decorationsRoot) {
      this.decorationsRoot.remove(this.particlesSystem);
    }
    this.particlesSystem = null;
    this.interactables = [];
    this.hoveredInteractable = null;
    this.pendingInteraction = null;
    this.manualControl = false;

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
      color: 0x5f9c5b,
      roughness: 0.8,
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
        this.registerInteractable('tree_house', group, new THREE.Vector3(TREE_HOUSE_POSITION[0] + 1.4, 0, TREE_HOUSE_POSITION[2] - 0.6));
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
        onLoaded: (group) => {
          this.obstacles.push({
            position: [structure.position[0], structure.position[2]],
            radius: 2.0,
          });
          const target = new THREE.Vector3(structure.position[0] - 1.2, 0, structure.position[2] + 0.8);
          this.registerInteractable(structure.id, group, target);
        },
      });
    });
  }

  private createWell() {
    const group = new THREE.Group();
    group.position.set(3.4, WORLD_Y_OFFSET + 0.05, 2.6);

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

    this.obstacles.push({ position: [3.4, 2.6], radius: 1.1 });
    this.registerInteractable('craft_well', group, new THREE.Vector3(2.8, 0, 2.1));
  }

  private createMissionBoard() {
    const position: Vec3 = [-4.3, WORLD_Y_OFFSET + 0.02, -1.0];
    this.loadStaticModel('/assets/3d/Village/Mission.glb', {
      position,
      rotationY: Math.PI * 0.18,
      targetHeight: 2.9,
      scaleMultiplier: 1.02,
      name: 'guardian-mission-board',
      onLoaded: (group) => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = child.material.clone();
            if ('roughness' in child.material) {
              (child.material as THREE.MeshStandardMaterial).roughness = 0.52;
            }
            if ('metalness' in child.material) {
              (child.material as THREE.MeshStandardMaterial).metalness = 0.06;
            }
          }
        });
        const boardLight = new THREE.PointLight(0xfff4bc, 0.85, 6.5, 2.1);
        boardLight.position.set(-0.1, 2.05, 0.3);
        group.add(boardLight);

        this.registerInteractable('mission_board', group, new THREE.Vector3(-3.6, 0, -1.4));
      },
    });
    this.obstacles.push({ position: [-4.3, -1.0], radius: 1.0 });
  }

  private createBridge() {
    const group = new THREE.Group();
    group.position.set(0.8, WORLD_Y_OFFSET + 0.02, 1.6);
    group.rotation.y = Math.PI * 0.12;

    const plankMaterial = new THREE.MeshStandardMaterial({ color: 0xb7834f, roughness: 0.75 });
    const plankGeometry = new THREE.BoxGeometry(2.2, 0.08, 1.1);
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
      [-3.4, 0, -0.8],
      [-2.2, 0, -0.2],
      [-0.6, 0, 0.6],
      [1.2, 0, 1.4],
      [2.8, 0, 2.1],
      [3.6, 0, 3.0],
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
      [-3.6, 0, 0.3],
      [-2.4, 0, -0.9],
      [-0.4, 0, 0.2],
      [1.8, 0, 0.9],
      [3.2, 0, 2.5],
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
      [-1.2, 0, 1.8],
      [0.6, 0, 2.6],
      [3.8, 0, -0.8],
      [4.6, 0, 1.4],
    ];

    treePositions.forEach((pos, index) => {
      this.loadStaticModel('/assets/3d/Ranch/Tree/Tree2.glb', {
        position: pos,
        targetHeight: 4.0,
        scaleMultiplier: 0.95 + (index % 2) * 0.12,
        rotationY: Math.random() * Math.PI,
        verticalOffset: -0.2,
        name: 'guardian-tree',
      });
      this.obstacles.push({ position: [pos[0], pos[2]], radius: 1.2 });
    });
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
      const radius = 5 + Math.random() * 5;
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

  private registerInteractable(id: string, mesh: THREE.Object3D, interactionTarget?: THREE.Vector3) {
    const interactiveInfo = INTERACTIVE_OBJECT_MAP[id];
    const target = interactionTarget
      ? interactionTarget.clone()
      : interactiveInfo
      ? new THREE.Vector3(interactiveInfo.position[0], 0, interactiveInfo.position[2])
      : new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld);

    mesh.updateWorldMatrix(true, false);

    const bounds = new THREE.Box3().setFromObject(mesh);
    const center = bounds.getCenter(new THREE.Vector3());
    mesh.worldToLocal(center);

    const sprite = this.createHintSprite();
    sprite.position.copy(center);
    sprite.position.y = bounds.getSize(new THREE.Vector3()).y * 0.6 + 0.5;
    sprite.visible = false;
    mesh.add(sprite);

    this.interactables.push({
      id,
      mesh,
      sprite,
      target,
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

  public setInteractionCallback(callback: (id: string) => void) {
    this.interactionCallback = callback;
  }

  public setHoverCallback(callback: (id: string | null) => void) {
    this.hoverCallback = callback;
  }

  public handlePointerMove(clientX: number, clientY: number, rect: DOMRect): string | null {
    this.preparePointer(clientX, clientY, rect);
    const entry = this.pickInteractable();
    let hoveredId: string | null = entry?.id ?? null;

    if (!hoveredId) {
      const walkable = this.projectRayToWalkable();
      if (walkable) {
        hoveredId = 'walkable';
      }
    }

    if (hoveredId !== this.hoveredInteractable) {
      this.hoveredInteractable = hoveredId;
      this.updateInteractableHighlight(hoveredId && hoveredId !== 'walkable' ? hoveredId : null);
      this.hoverCallback?.(hoveredId);
    }

    return hoveredId;
  }

  public handlePointerClick(clientX: number, clientY: number, rect: DOMRect): string | null {
    this.preparePointer(clientX, clientY, rect);
    const entry = this.pickInteractable();
    if (entry) {
      this.pendingInteraction = { id: entry.id, target: entry.target.clone() };
      this.currentTarget = entry.target.clone();
      this.isMoving = true;
      this.manualControl = false;
      this.playRigAnimation('walk');
      this.updateInteractableHighlight(entry.id);
      this.hoverCallback?.(entry.id);
      return entry.id;
    }

    const target = this.projectRayToWalkable();
    if (!target) {
      return null;
    }

    this.pendingInteraction = null;
    this.manualControl = true;
    this.currentTarget = target.clone();
    this.isMoving = true;
    this.playRigAnimation('walk');
    this.updateInteractableHighlight(null);
    this.hoverCallback?.('walkable');

    return 'move';
  }

  public clearHover() {
    this.hoveredInteractable = null;
    this.updateInteractableHighlight(null);
    this.hoverCallback?.(null);
  }

  private pickInteractable(): InteractableEntry | null {
    if (!this.interactables.length) {
      return null;
    }

    const meshes = this.interactables.map((item) => item.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, true);
    if (!intersects.length) {
      return null;
    }

    const intersected = intersects[0].object;
    return this.findInteractableFromObject(intersected);
  }

  private findInteractableFromObject(object: THREE.Object3D): InteractableEntry | null {
    let current: THREE.Object3D | null = object;
    while (current) {
      const entry = this.interactables.find((item) => item.mesh === current);
      if (entry) {
        return entry;
      }
      current = current.parent;
    }
    return null;
  }

  private updateInteractableHighlight(hoverId: string | null) {
    this.interactables.forEach((entry) => {
      entry.sprite.visible = entry.id === hoverId;
    });
  }

  private preparePointer(clientX: number, clientY: number, rect: DOMRect) {
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const camera = this.threeScene.getCamera() as THREE.PerspectiveCamera;
    this.raycaster.setFromCamera(this.pointer, camera);
  }

  private projectRayToWalkable(): THREE.Vector3 | null {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WORLD_Y_OFFSET);
    const point = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(plane, point)) {
      return null;
    }

    const x = point.x;
    const z = point.z;

    if (!this.isPositionValid(x, z, 0.45)) {
      return null;
    }

    return new THREE.Vector3(x, 0, z);
  }

  public update(delta: number) {
    this.elapsedTime += delta;

    this.beastModel?.update(delta);
    this.waterSegments.forEach((segment) => segment.update(delta));

    if (this.beastGroup && this.needsFit && this.fitBeastToScene(this.beastGroup)) {
      this.needsFit = false;
    }

    this.updateBeastMovement(delta);
    this.updateAmbientParticles();

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

    if (!this.isMoving && this.pendingInteraction) {
      this.currentTarget = this.pendingInteraction.target.clone();
      this.isMoving = true;
      this.playRigAnimation('walk');
    } else if (!this.isMoving && this.manualControl) {
      // aguardando chegada ao ponto manual (deve ter sido tratado em clique)
      this.manualControl = false;
    } else if (!this.isMoving && this.nextMoveTime <= 0) {
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
        this.playRigAnimation('idle');

        if (this.pendingInteraction && this.interactionCallback) {
          const id = this.pendingInteraction.id;
          this.pendingInteraction = null;
          this.manualControl = false;
          this.interactionCallback(id);
          this.nextMoveTime = 2.0 + Math.random() * 1.2;
        } else if (this.manualControl) {
          this.manualControl = false;
          this.nextMoveTime = 3.0 + Math.random();
        } else {
          this.nextMoveTime = 2.5 + Math.random() * 1.8;
        }
        return;
      }

      direction.normalize();
      current.addScaledVector(direction, speed * delta);
      this.beastGroup.lookAt(this.currentTarget.x, current.y, this.currentTarget.z);
    }
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

