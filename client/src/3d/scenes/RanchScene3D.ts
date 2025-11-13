/**
 * 3D Ranch Scene - PS1 Style (Static layout + skin system)
 * Guardian Grove - Three.js ranch visualization with Monster Rancher aesthetic
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { ThreeScene } from '../ThreeScene';
import { BeastModel } from '../models/BeastModel';
import { PS1Water } from '../water/PS1Water';
import { RanchCritters } from '../events/RanchCritters';
import { getSkyColor } from '../../utils/day-night';

type Vec2 = [number, number];
type Vec3 = [number, number, number];

interface TreePlacement {
  position: Vec2;
  rotation?: number;
  scale?: number;
}

interface HayBalePlacement {
  position: Vec3;
  rotation?: number;
  scale?: number;
}

interface LampPlacement {
  position: Vec2;
}

interface RockPlacement {
  position: Vec3;
  scale?: number;
}

interface FlowerPlacement {
  position: Vec3;
  colorIndex: number;
  rotation?: number;
  scale?: number;
}

interface MountainPlacement {
  position: Vec3;
  radius: number;
  height: number;
  colorIndex: number;
  rotation?: number;
}

interface CloudPlacement {
  position: Vec3;
  scale?: number;
}

interface RanchLayout {
  house: { position: Vec3; obstacleRadius: number };
  pond: { position: Vec3; outerRadius: number; innerRadius: number; collisionRadius: number; waterSize: number };
  fence: { radius: number; postCount: number };
  walkableRadius: number;
  grass: { count: number; area: number; seed: number };
  trees: TreePlacement[];
  hayBales: HayBalePlacement[];
  lamps: LampPlacement[];
  rocks: RockPlacement[];
  flowers: FlowerPlacement[];
  mountains: MountainPlacement[];
  clouds: CloudPlacement[];
}

interface HouseSkin {
  foundationColor: number;
  bodyColor: number;
  trimColor: number;
  roofColor: number;
  ridgeColor: number;
  doorColor: number;
  knobColor: number;
  windowFrameColor: number;
  windowGlassColor: number;
  chimneyColor: number;
  chimneyTopColor: number;
  porchColor: number;
}

interface GroundSkin {
  terrainColor: number;
  borderColor: number;
  centerPatchColor: number;
  pathRingColor: number;
  walkwayStoneColor: number;
}

interface TreeSkin {
  trunkColor: number;
  foliagePrimaryColor: number;
  foliageSecondaryColor: number;
}

interface LampSkin {
  poleColor: number;
  capColor: number;
  glassColor: number;
  emissiveColor: number;
  lightColor: number;
}

interface PondSkin {
  rimColor: number;
  innerRimColor: number;
  waterColor: number;
}

interface RanchSkin {
  id: string;
  displayName: string;
  ground: GroundSkin;
  house: HouseSkin;
  tree: TreeSkin;
  lamp: LampSkin;
  pond: PondSkin;
  hayBaleColor: number;
  rockColor: number;
  flowerColors: number[];
  fenceColor: number;
  cloudColor: number;
  cloudEmissive: number;
  mountainColors: number[];
  grassColor: number;
}

interface Obstacle {
  position: Vec2;
  radius: number;
}

const WORLD_Y_OFFSET = -1.2;

const DEFAULT_LAYOUT: RanchLayout = {
  house: { position: [0, 0.2, -6.8], obstacleRadius: 2.6 },
  pond: {
    position: [1.6, 0, 3.4],
    outerRadius: 1.5,
    innerRadius: 1.4,
    collisionRadius: 1.68,
    waterSize: 1.5,
  },
  fence: { radius: 9, postCount: 24 },
  walkableRadius: 7.3,
  grass: { count: 650, area: 16, seed: 1337 },
  trees: [{ position: [-4.2, -3.4], rotation: 0.32, scale: 1.0 }],
  hayBales: [],
  lamps: [
    { position: [-2.0, -1.8] },
    { position: [2.0, -1.8] },
  ],
  rocks: [
    { position: [-3.8, 0.0, 2.4], scale: 0.95 },
    { position: [4.4, 0.0, 1.3], scale: 0.9 },
    { position: [3.2, 0.0, -0.6], scale: 0.88 },
  ],
  flowers: [
    { position: [-1.2, 0, -1.2], colorIndex: 0 },
    { position: [-1.8, 0, -0.4], colorIndex: 1 },
    { position: [1.2, 0, -1.0], colorIndex: 2 },
    { position: [1.8, 0, -2.0], colorIndex: 4 },
  ],
  mountains: [
    { position: [0, 0, -18.0], radius: 4.8, height: 8.8, colorIndex: 0 },
    { position: [8.2, 0, -15.6], radius: 4.2, height: 7.3, colorIndex: 1, rotation: 0.4 },
    { position: [-8.2, 0, -15.2], radius: 4.1, height: 7.6, colorIndex: 2, rotation: -0.5 },
    { position: [11.6, 0, -9.0], radius: 3.9, height: 6.8, colorIndex: 1 },
    { position: [-11.4, 0, -9.2], radius: 3.9, height: 6.6, colorIndex: 3 },
    { position: [9.8, 0, -4.6], radius: 3.5, height: 5.4, colorIndex: 0 },
    { position: [-9.6, 0, -4.8], radius: 3.4, height: 5.3, colorIndex: 2 },
    { position: [3.6, 0, -21.5], radius: 4.6, height: 8.2, colorIndex: 1, rotation: 0.2 },
    { position: [-4.4, 0, -21.8], radius: 4.5, height: 8.4, colorIndex: 2, rotation: -0.3 },
    { position: [12.4, 0, -18.5], radius: 4.1, height: 7.0, colorIndex: 0 },
    { position: [-12.6, 0, -18.3], radius: 4.2, height: 7.1, colorIndex: 3 },
  ],
  clouds: [
    { position: [-5.8, 6.2, -5.6], scale: 1.2 },
    { position: [5.8, 6.2, -5.4], scale: 1.2 },
    { position: [0, 7.0, -7.2], scale: 1.35 },
  ],
};

const DEFAULT_SKIN: RanchSkin = {
  id: 'classic-ps1',
  displayName: 'Classic PS1 Ranch',
  ground: {
    terrainColor: 0x4f7652,
    borderColor: 0x3c291d,
    centerPatchColor: 0x5e8f64,
    pathRingColor: 0xd5b48b,
    walkwayStoneColor: 0xb9a98c,
  },
  house: {
    foundationColor: 0x4c4f62,
    bodyColor: 0xc23b3b,
    trimColor: 0x6d3f20,
    roofColor: 0x8b4a27,
    ridgeColor: 0x6e3418,
    doorColor: 0xd7882f,
    knobColor: 0xf9cc4e,
    windowFrameColor: 0xf3f5ff,
    windowGlassColor: 0xb9e4ff,
    chimneyColor: 0x7b4526,
    chimneyTopColor: 0x5d2f18,
    porchColor: 0x6d5240,
  },
  tree: {
    trunkColor: 0x76532d,
    foliagePrimaryColor: 0x56b072,
    foliageSecondaryColor: 0x4aa968,
  },
  lamp: {
    poleColor: 0x53423a,
    capColor: 0x2c1f18,
    glassColor: 0xfff3c4,
    emissiveColor: 0xffe49a,
    lightColor: 0xffcfa8,
  },
  pond: {
    rimColor: 0x3cc4ff,
    innerRimColor: 0x3cc4ff,
    waterColor: 0x3cc4ff,
  },
  hayBaleColor: 0xe5ca74,
  rockColor: 0x8c8f95,
  flowerColors: [0xffa0c0, 0xffd65c, 0xff9159, 0xb074ff, 0xff6d7a],
  fenceColor: 0xd4a574,
  cloudColor: 0xf3f6ff,
  cloudEmissive: 0xe0e4ff,
  mountainColors: [0x8b7355, 0xa08060, 0x7a6348, 0x9a8570],
  grassColor: 0x3f6d3f,
};

export class RanchScene3D {
  private threeScene: ThreeScene;

  private beastModel: BeastModel | null = null;
  private beastGroup: THREE.Group | null = null;
  private idleAnimation: (() => void) | null = null;
  private baseYPosition = WORLD_Y_OFFSET;
  private activeRigAnimation: 'idle' | 'walk' | null = null;
  private needsFit = false;

  private layout: RanchLayout = DEFAULT_LAYOUT;
  private skin: RanchSkin = DEFAULT_SKIN;

  private decorationsRoot: THREE.Group | null = null;
  private water: PS1Water | null = null;
  private critters: RanchCritters | null = null;
  private lanternLights: Array<{ light: THREE.PointLight; sprite: THREE.Sprite; baseIntensity: number; offset: number }> = [];
  private glowTexture: THREE.Texture | null = null;
  private smokeTexture: THREE.Texture | null = null;
  private elapsedTime = 0;

  private gltfLoader = new GLTFLoader();
  private gltfCache = new Map<string, THREE.Group>();
  private houseModel: THREE.Group | null = null;
  private treeModel: THREE.Group | null = null;
  private mountainModels: THREE.Group[] = [];

  private obstacles: Obstacle[] = [];
  private boundaryRadius: number = DEFAULT_LAYOUT.walkableRadius;

  private currentTarget: THREE.Vector3 | null = null;
  private isMoving = false;
  private moveSpeed = 1.5; // Unidades por segundo
  private nextMoveTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.threeScene = new ThreeScene(canvas);
    this.setupRanchEnvironment();
  }

  private setupRanchEnvironment() {
    const scene = this.threeScene.getScene();
    const camera = this.threeScene.getCamera() as THREE.PerspectiveCamera;
    
    camera.fov = 46;
    camera.position.set(0, 5.2, 9.6);
    camera.lookAt(0, WORLD_Y_OFFSET + 1.0, 0);
    camera.updateProjectionMatrix();
    
    scene.background = new THREE.Color(0x1d2b44);
    scene.fog = new THREE.Fog(0x1d2b44, 18, 45);

    Promise.all([
      this.preloadModel('/assets/3d/Ranch/House/House1.glb'),
      this.preloadModel('/assets/3d/Ranch/Tree/Tree1.glb'),
      this.preloadModel('/assets/3d/Ranch/Tree/Tree2.glb'),
      this.preloadModel('/assets/3d/Ranch/Mountain/Mountain1.glb'),
      this.preloadModel('/assets/3d/Ranch/Grass/Grass1.glb'),
      this.preloadModel('/assets/3d/Ranch/Flower/Sunlit_Blossom_1111142848_texture.glb'),
      this.preloadModel('/assets/3d/Ranch/Lantern/Lantern1.glb'),
      this.preloadModel('/assets/3d/Ranch/Rock/Stone1.glb'),
    ])
      .catch((error) => {
        console.error('[RanchScene3D] Failed to preload models', error);
      })
      .finally(() => {
        this.rebuildDecorations();
      });
  }

  public applySkin(skin: RanchSkin) {
    this.skin = skin;
    this.rebuildDecorations();
  }

  private rebuildDecorations() {
    const scene = this.threeScene.getScene();
    this.clearDecorations();

    this.lanternLights = [];
    this.decorationsRoot = new THREE.Group();
    this.decorationsRoot.position.y = WORLD_Y_OFFSET;
    this.threeScene.addObject(this.decorationsRoot);

    this.createGround();
    this.createPond();
    this.createGrass();
    this.createFlowers();
    this.createTrees();
    this.createHayBales();
    this.createRocks();
    this.createLamps();
    this.createMountains();
    this.createClouds();
    this.createHouse();

    this.setupObstacles();
    
    this.critters = new RanchCritters(scene);
  }
  
  private clearDecorations() {
    if (this.critters) {
      this.critters.dispose();
      this.critters = null;
    }

    this.lanternLights = [];

    this.elapsedTime = 0;

    if (this.water) {
      if (this.decorationsRoot) {
        this.decorationsRoot.remove(this.water.getMesh());
      }
      this.water.dispose();
      this.water = null;
    }

    if (this.decorationsRoot) {
      this.disposeObject(this.decorationsRoot);
      this.threeScene.removeObject(this.decorationsRoot);
      this.decorationsRoot = null;
    }

    this.houseModel = null;
    this.treeModel = null;
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

  private addDecoration(object: THREE.Object3D) {
    if (!this.decorationsRoot) {
      throw new Error('Decoration root not initialised');
    }
    this.decorationsRoot.add(object);
  }

  private loadStaticModel(
    url: string,
    options: {
      position: Vec3;
      rotationY?: number;
      targetHeight?: number;
      scaleMultiplier?: number;
      name?: string;
      onLoaded?: (group: THREE.Group) => void;
      verticalOffset?: number;
    },
  ) {
    const spawnFromTemplate = (template: THREE.Group) => {
      if (!this.decorationsRoot) {
        return;
      }

      const wrapper = new THREE.Group();
      if (options.name) {
        wrapper.name = options.name;
      }

      const root = template.clone(true);
      root.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      wrapper.add(root);

      const sizeVector = new THREE.Vector3();
      const centerVector = new THREE.Vector3();
      const box = new THREE.Box3().setFromObject(root);
      box.getSize(sizeVector);

      if (options.targetHeight && sizeVector.y > 0) {
        const scaleTarget =
          (options.targetHeight * (options.scaleMultiplier ?? 1)) / sizeVector.y;
        root.scale.setScalar(scaleTarget);
        box.setFromObject(root);
        box.getSize(sizeVector);
      }

      box.getCenter(centerVector);
      root.position.sub(centerVector);

      const finalY = options.position[1] + WORLD_Y_OFFSET + sizeVector.y / 2 + (options.verticalOffset ?? 0);
      wrapper.position.set(options.position[0], finalY, options.position[2]);

      if (options.rotationY) {
        wrapper.rotation.y = options.rotationY;
      }

      this.addDecoration(wrapper);
      options.onLoaded?.(wrapper);
    };

    if (this.gltfCache.has(url)) {
      spawnFromTemplate(this.gltfCache.get(url)!);
      return;
    }

    this.gltfLoader.load(
      url,
      (gltf) => {
        this.gltfCache.set(url, gltf.scene);
        spawnFromTemplate(gltf.scene);
      },
      undefined,
      (error) => {
        console.error(`[RanchScene3D] Failed to load model '${url}'`, error);
      },
    );
  }

  private preloadModel(url: string): Promise<void> {
    if (this.gltfCache.has(url)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          this.gltfCache.set(url, gltf.scene);
          resolve();
        },
        undefined,
        (error) => {
          reject(error);
        },
      );
    });
  }

  private createGround() {
    const groundSize = 52;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 80, 80);
    const positions = groundGeometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const radialFalloff = 1 - Math.min(1, (Math.sqrt(x * x + z * z) / (groundSize / 2)));
      const noise =
        Math.sin(x * 0.14) * 0.04 +
        Math.cos(z * 0.12) * 0.03 +
        Math.sin((x + z) * 0.1) * 0.02;

      positions.setY(i, noise * radialFalloff);
    }
    positions.needsUpdate = true;
    groundGeometry.computeVertexNormals();

    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: this.skin.ground.terrainColor,
      roughness: 0.82,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeometry, terrainMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = WORLD_Y_OFFSET;
    ground.receiveShadow = true;
    this.addDecoration(ground);

    const borderGeometry = new THREE.RingGeometry(24.0, 26.0, 64);
    const borderMaterial = new THREE.MeshStandardMaterial({
      color: this.skin.ground.borderColor,
      roughness: 0.92,
      metalness: 0.03,
    });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.rotation.x = -Math.PI / 2;
    border.position.y = WORLD_Y_OFFSET - 0.02;
    border.receiveShadow = true;
    this.addDecoration(border);

    const centerGeometry = new THREE.CircleGeometry(24.0, 64);
    const centerMaterial = new THREE.MeshStandardMaterial({
      color: this.skin.ground.centerPatchColor,
      roughness: 0.78,
      metalness: 0.04,
    });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.rotation.x = -Math.PI / 2;
    center.position.y = WORLD_Y_OFFSET + 0.01;
    center.receiveShadow = true;
    this.addDecoration(center);

    // Removed walkway ring to keep ground clean
  }

  private createPond() {
    const pondGroup = new THREE.Group();

    this.water = new PS1Water({
      size: this.layout.pond.waterSize,
      segments: 28,
      color: this.skin.pond.waterColor,
      waveSpeed: 0.6,
      waveHeight: 0.06,
    });
    const waterMesh = this.water.getMesh();
    waterMesh.position.set(
      this.layout.pond.position[0],
      this.layout.pond.position[1] + WORLD_Y_OFFSET + 0.12,
      this.layout.pond.position[2],
    );
    pondGroup.add(waterMesh);

    this.addDecoration(pondGroup);
  }

  private createGrass() {
    const desiredCount = Math.min(this.layout.grass.count, 220);
    const rng = this.createSeededRandom(this.layout.grass.seed);
    const maxRadius = Math.min(Math.sqrt(this.layout.grass.area) * 1.5, this.layout.walkableRadius - 0.4);
    const pondRadius = this.layout.pond.collisionRadius + 0.6;
    const skinGrassColor = new THREE.Color(this.skin.grassColor);
    const groundCenterColor = new THREE.Color(this.skin.ground.centerPatchColor);
    const blendedGrassColor = skinGrassColor.clone().lerp(groundCenterColor, 0.55);
    const hsl = { h: 0, s: 0, l: 0 };
    blendedGrassColor.getHSL(hsl);
    hsl.l = Math.min(1, hsl.l + 0.12);
    const finalGrassColor = new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);

    for (let i = 0; i < desiredCount; i++) {
      let attempts = 0;
      while (attempts < 6) {
        const radius = Math.sqrt(rng()) * maxRadius;
        const angle = rng() * Math.PI * 2;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);

        const pondDx = x - this.layout.pond.position[0];
        const pondDz = z - this.layout.pond.position[2];
        if (Math.sqrt(pondDx * pondDx + pondDz * pondDz) < pondRadius) {
          attempts += 1;
          continue;
        }

        if (Math.sqrt(x * x + z * z) > this.layout.walkableRadius - 0.4) {
          attempts += 1;
          continue;
        }

        const scale = 0.7 + rng() * 0.6;
        const rotation = rng() * Math.PI * 2;

        this.loadStaticModel('/assets/3d/Ranch/Grass/Grass1.glb', {
          position: [x, -0.08 + rng() * 0.05, z],
          rotationY: rotation,
          targetHeight: 0.55,
          scaleMultiplier: scale,
          name: 'ranch-grass',
          verticalOffset: -0.05,
          onLoaded: (group) => {
            group.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((mat) => {
                  if (mat && 'color' in mat) {
                    const meshMat = mat as THREE.MeshStandardMaterial;
                    meshMat.color.copy(finalGrassColor);
                    meshMat.needsUpdate = true;
                  }
                });
              }
            });
          },
        });
        break;
      }
    }

    const manualGrassPositions: Vec3[] = [
      [-1.4, 0, -2.4],
      [-0.6, 0, -2.2],
      [0.2, 0, -2.0],
      [1.0, 0, -2.3],
      [-1.2, 0, -1.6],
    ];

    manualGrassPositions.forEach((pos, index) => {
      this.loadStaticModel('/assets/3d/Ranch/Grass/Grass1.glb', {
        position: [pos[0], -0.05, pos[2]],
        rotationY: (index / manualGrassPositions.length) * Math.PI * 2,
        targetHeight: 0.52,
        scaleMultiplier: 0.85,
        name: 'ranch-grass-manual',
        verticalOffset: -0.04,
        onLoaded: (group) => {
          group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach((mat) => {
                if (mat && 'color' in mat) {
                  const meshMat = mat as THREE.MeshStandardMaterial;
                  meshMat.color.copy(finalGrassColor);
                  meshMat.needsUpdate = true;
                }
              });
            }
          });
        },
      });
    });

    const extendedGrassOffsets: Vec3[] = [
      [1.6, 0, -1.2],
      [1.9, 0, -0.6],
      [-1.7, 0, -0.9],
      [-1.9, 0, -0.2],
    ];

    extendedGrassOffsets.forEach((pos, index) => {
      this.loadStaticModel('/assets/3d/Ranch/Grass/Grass1.glb', {
        position: [pos[0], -0.05, pos[2]],
        rotationY: (index / extendedGrassOffsets.length) * Math.PI * 2,
        targetHeight: 0.48,
        scaleMultiplier: 0.75,
        name: 'ranch-grass-extended',
        verticalOffset: -0.04,
        onLoaded: (group) => {
          group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach((mat) => {
                if (mat && 'color' in mat) {
                  const meshMat = mat as THREE.MeshStandardMaterial;
                  meshMat.color.copy(finalGrassColor);
                  meshMat.needsUpdate = true;
                }
              });
            }
          });
        },
      });
    });
  }

  private createFlowers() {
    for (const placement of this.layout.flowers) {
      const rotation = placement.rotation ?? 0;
      const scale = placement.scale ?? 1;
      this.loadStaticModel('/assets/3d/Ranch/Flower/Sunlit_Blossom_1111142848_texture.glb', {
        position: [placement.position[0], placement.position[1] ?? 0, placement.position[2]],
        rotationY: rotation,
        targetHeight: 0.55,
        scaleMultiplier: scale,
        name: 'ranch-flower',
        verticalOffset: -0.12,
      });
    }
  }

  private createTrees() {
    this.treeModel = null;

    if (this.layout.trees.length === 0) {
      return;
    }

    this.layout.trees.forEach((tree, index) => {
      const urls = [
        '/assets/3d/Ranch/Tree/Tree1.glb',
        '/assets/3d/Ranch/Tree/Tree2.glb',
      ];
      const url = urls[index % urls.length];
      this.loadStaticModel(url, {
        position: [tree.position[0], 0, tree.position[1]],
        rotationY: tree.rotation ?? 0,
        targetHeight: 5.8,
        scaleMultiplier: tree.scale ?? 1,
        name: 'ranch-tree',
        onLoaded: (group) => {
          if (index === 0) {
            this.treeModel = group;
          }
        },
      });
    });
  }

  private createHayBales() {
    if (this.layout.hayBales.length === 0) {
      return;
    }

    const group = new THREE.Group();
    const geometry = new THREE.CylinderGeometry(0.6, 0.6, 1.4, 12);
    const material = new THREE.MeshStandardMaterial({
      color: this.skin.hayBaleColor,
      roughness: 0.6,
      metalness: 0.1,
    });

    for (const bale of this.layout.hayBales) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.z = Math.PI / 2;
      mesh.position.set(bale.position[0], bale.position[1] + WORLD_Y_OFFSET, bale.position[2]);
      mesh.rotation.y = bale.rotation ?? 0;
      mesh.scale.setScalar(bale.scale ?? 1);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    this.addDecoration(group);
  }

  private createRocks() {
    const rng = this.createSeededRandom(42);
    for (const rock of this.layout.rocks) {
      this.loadStaticModel('/assets/3d/Ranch/Rock/Stone1.glb', {
        position: [rock.position[0], rock.position[1] ?? 0, rock.position[2]],
        rotationY: rng() * Math.PI * 2,
        targetHeight: 0.9,
        scaleMultiplier: rock.scale ?? 1,
        name: 'ranch-rock',
        verticalOffset: -0.18,
      });
    }
  }

  private createLamps() {
    for (const [index, lamp] of this.layout.lamps.entries()) {
      this.loadStaticModel('/assets/3d/Ranch/Lantern/Lantern1.glb', {
        position: [lamp.position[0], 0, lamp.position[1]],
        rotationY: index % 2 === 0 ? Math.PI / 12 : -Math.PI / 15,
        targetHeight: 2.2,
        name: 'ranch-lantern',
        onLoaded: (group) => {
          const light = new THREE.PointLight(this.skin.lamp.lightColor, 0.62, 6.0, 1.4);
          light.position.set(0, 0.76, 0);
          group.add(light);

          const innerGlow = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 12, 12),
            new THREE.MeshBasicMaterial({
              color: this.skin.lamp.emissiveColor,
        transparent: true,
              opacity: 0.24,
            }),
          );
          innerGlow.position.set(0, 0.74, 0);
          group.add(innerGlow);

          const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: this.getGlowTexture(),
              color: this.skin.lamp.lightColor,
              transparent: true,
              opacity: 0.32,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
            }),
          );
          sprite.position.set(0, 0.76, 0);
          sprite.scale.set(1.08, 1.08, 1.08);
          group.add(sprite);

          this.lanternLights.push({
            light,
            sprite,
            baseIntensity: light.intensity,
            offset: Math.random() * Math.PI * 2,
          });
        },
      });
    }
  }

  private createMountains() {
    this.mountainModels = [];

    const extraBackMountains: MountainPlacement[] = [
      { position: [0, 0, -24], radius: 5.2, height: 9.4, colorIndex: 1, rotation: 0.1 },
      { position: [6.5, 0, -23.5], radius: 4.9, height: 9.0, colorIndex: 0, rotation: 0.3 },
      { position: [-6.8, 0, -23.7], radius: 4.8, height: 9.1, colorIndex: 2, rotation: -0.2 },
    ];

    for (const mountain of [...this.layout.mountains, ...extraBackMountains]) {
      this.loadStaticModel('/assets/3d/Ranch/Mountain/Mountain1.glb', {
        position: [mountain.position[0], 0, mountain.position[2]],
        rotationY: mountain.rotation ?? 0,
        targetHeight: mountain.height,
        scaleMultiplier: mountain.radius / 4,
        name: 'ranch-mountain',
        onLoaded: (group) => {
          this.mountainModels.push(group);
        },
      });
    }
  }

  private createClouds() {
    const group = new THREE.Group();
    for (const cloud of this.layout.clouds) {
      const cluster = new THREE.Group();
      const material = new THREE.MeshStandardMaterial({
        color: this.skin.cloudColor,
        roughness: 0.6,
        metalness: 0,
      });
      material.transparent = true;
      material.opacity = 0.85;
      material.emissive.setHex(this.skin.cloudEmissive);
      material.emissiveIntensity = 0.05;

      const offsets: Vec3[] = [
        [-0.6, 0.05, 0],
        [0, 0.2, 0.2],
        [0.6, 0.05, -0.1],
      ];

      for (const offset of offsets) {
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), material);
        sphere.position.set(offset[0], offset[1], offset[2]);
        sphere.scale.set(1.3, 0.7, 1.1);
        cluster.add(sphere);
      }

      cluster.position.set(cloud.position[0], cloud.position[1] + WORLD_Y_OFFSET, cloud.position[2]);
      const scale = cloud.scale ?? 1;
      cluster.scale.setScalar(scale);
      group.add(cluster);
    }
    this.addDecoration(group);
  }

  private createHouse() {
    this.houseModel = null;

    this.loadStaticModel('/assets/3d/Ranch/House/House1.glb', {
        position: [this.layout.house.position[0], this.layout.house.position[1], this.layout.house.position[2] - 0.4],
      rotationY: 0,
      targetHeight: 5,
      name: 'ranch-house',
      verticalOffset: -0.2,
      onLoaded: (group) => {
        this.houseModel = group;
        this.setupHouseLighting(group);
      },
    });
  }

  private setupObstacles() {
    const obstacles: Obstacle[] = [];
    const push = (x: number, z: number, radius: number) => obstacles.push({ position: [x, z], radius });

    push(this.layout.pond.position[0], this.layout.pond.position[2], this.layout.pond.collisionRadius);
    push(this.layout.house.position[0], this.layout.house.position[2], this.layout.house.obstacleRadius);
    this.layout.trees.forEach((tree) => push(tree.position[0], tree.position[1], 1.25));
    this.layout.lamps.forEach((lamp) => push(lamp.position[0], lamp.position[1], 0.35));
    this.layout.rocks.forEach((rock) => push(rock.position[0], rock.position[2], 0.4));

    const fencePoints = 16;
    for (let i = 0; i < fencePoints; i++) {
      const angle = (i / fencePoints) * Math.PI * 2;
      push(Math.cos(angle) * this.layout.fence.radius, Math.sin(angle) * this.layout.fence.radius, 0.45);
    }

    this.obstacles = obstacles;
    this.boundaryRadius = this.layout.walkableRadius;
  }

  private setupHouseLighting(group: THREE.Group) {
    this.applyWindowLighting(group);
    this.setupChimneySmoke(group);
  }

  private applyWindowLighting(group: THREE.Group) {
    const warmColor = new THREE.Color(this.skin.lamp.lightColor);
    const emissiveColor = warmColor.clone().multiplyScalar(0.65);

    group.traverse((child) => {
      if (child instanceof THREE.Mesh && this.isWindowMesh(child)) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat && 'emissive' in mat) {
            const standard = mat as THREE.MeshStandardMaterial;
            standard.emissive.copy(emissiveColor);
            standard.emissiveIntensity = 0.8;
            standard.needsUpdate = true;
          }
        });
      }
    });

    const windowLight = new THREE.PointLight(this.skin.lamp.lightColor, 0.6, 8, 2.2);
    windowLight.position.set(0, 1.8, 1.3);
    group.add(windowLight);

    const windowGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.getGlowTexture(),
        color: this.skin.lamp.lightColor,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    windowGlow.scale.set(2.4, 2.0, 2.4);
    windowGlow.position.set(0, 1.7, 1.25);
    group.add(windowGlow);
  }

  private setupChimneySmoke(group: THREE.Group) {
    const chimneyObject = this.findObjectByName(group, ['chimney', 'chimney_top', 'chimney01']);
    const origin = new THREE.Vector3();

    if (chimneyObject) {
      chimneyObject.updateWorldMatrix(true, false);
      chimneyObject.getWorldPosition(origin);
      group.worldToLocal(origin);
      origin.y += 0.2;
    } else {
      const bounds = new THREE.Box3().setFromObject(group);
      const size = bounds.getSize(new THREE.Vector3());
      origin.set(bounds.min.x + size.x * 0.75, bounds.max.y - 0.3, bounds.min.z + size.z * 0.3);
    }

  }

  private updateLanterns(delta: number) {
    if (!this.lanternLights.length) {
      return;
    }

    for (const entry of this.lanternLights) {
      const flicker = Math.sin((this.elapsedTime + entry.offset) * 5.6) * 0.15 + (Math.random() - 0.5) * 0.04;
      const intensity = Math.max(0.35, Math.min(entry.baseIntensity + flicker, 1.4));
      entry.light.intensity = intensity;

      const spriteMaterial = entry.sprite.material as THREE.SpriteMaterial;
      spriteMaterial.opacity = 0.35 + intensity * 0.22;
      const scale = 1.1 + intensity * 0.45;
      entry.sprite.scale.set(scale, scale, scale);
    }
  }

  private updateChimneySmoke(delta: number) {
    // Smoke disabled
  }

  private spawnSmokeParticle() {
    // Smoke disabled
  }

  private getGlowTexture(): THREE.Texture {
    if (!this.glowTexture) {
      this.glowTexture = this.createRadialTexture(128, [
        { offset: 0, color: 'rgba(255, 255, 255, 1)' },
        { offset: 0.65, color: 'rgba(255, 255, 255, 0.5)' },
        { offset: 1, color: 'rgba(255, 255, 255, 0)' },
      ]);
    }
    return this.glowTexture;
  }

  private getSmokeTexture(): THREE.Texture {
    if (!this.smokeTexture) {
      this.smokeTexture = this.createRadialTexture(128, [
        { offset: 0, color: 'rgba(255, 255, 255, 0.9)' },
        { offset: 0.5, color: 'rgba(220, 220, 220, 0.4)' },
        { offset: 1, color: 'rgba(220, 220, 220, 0)' },
      ]);
    }
    return this.smokeTexture;
  }

  private createRadialTexture(
    size: number,
    stops: Array<{ offset: number; color: string }>,
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to create canvas context');
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

  private findObjectByName(group: THREE.Object3D, names: string[]): THREE.Object3D | null {
    const lowerNames = names.map((name) => name.toLowerCase());
    let found: THREE.Object3D | null = null;
    group.traverse((child) => {
      if (found) return;
      const name = child.name?.toLowerCase?.() ?? '';
      if (lowerNames.some((target) => name.includes(target))) {
        found = child;
      }
    });
    return found;
  }

  private isWindowMesh(object: THREE.Object3D): boolean {
    const name = object.name?.toLowerCase?.() ?? '';
    return name.includes('window') || name.includes('glass');
  }

  private isPositionValid(x: number, z: number, clearance: number = 0.5): boolean {
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter > this.boundaryRadius) {
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

  private chooseNextMovePoint(): THREE.Vector3 | null {
    const maxAttempts = 30;

    if (!this.beastGroup) {
      return null;
    }

    const currentPos = this.beastGroup.position;
    const distFromCenter = Math.sqrt(currentPos.x ** 2 + currentPos.z ** 2);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let x: number;
      let z: number;

      if (distFromCenter > 5) {
        if (Math.random() < 0.8) {
          x = (Math.random() - 0.5) * 6;
          z = (Math.random() - 0.5) * 6;
    } else {
          x = (Math.random() - 0.5) * 12;
          z = (Math.random() - 0.5) * 12;
        }
    } else {
        x = (Math.random() - 0.5) * 12;
        z = (Math.random() - 0.5) * 12;
      }

      if (this.isPositionValid(x, z, 0.75)) {
        return new THREE.Vector3(x, 0, z);
      }
    }

    return null;
  }

  private startNextMove() {
    const target = this.chooseNextMovePoint();

    if (target) {
      this.currentTarget = target;
      this.isMoving = true;
      if (this.beastModel?.hasRiggedAnimations()) {
        this.playRigAnimation('walk');
      }
    } else {
      this.nextMoveTime = 2;
    }
  }

  private updateBeastMovement(delta: number) {
    if (!this.beastGroup) {
      return;
    }

    if (!this.isMoving) {
      this.nextMoveTime -= delta;
      if (this.nextMoveTime <= 0) {
        this.startNextMove();
        this.nextMoveTime = 3 + Math.random() * 3;
      } else if (this.beastModel?.hasRiggedAnimations()) {
        this.playRigAnimation('idle');
      } else if (this.idleAnimation) {
        this.idleAnimation();
      }
      return;
    }
    
    if (!this.currentTarget) {
      this.isMoving = false;
      return;
    }

    const currentPos = this.beastGroup.position;
      const direction = new THREE.Vector3(
      this.currentTarget.x - currentPos.x,
        0,
      this.currentTarget.z - currentPos.z,
      );
      const distance = direction.length();
      
    if (distance < 0.15) {
        this.isMoving = false;
        this.currentTarget = null;
      this.nextMoveTime = 2 + Math.random() * 3;
        if (this.beastModel?.hasRiggedAnimations()) {
          this.playRigAnimation('idle');
        }
        return;
      }
      
      direction.normalize();
    const moveDistance = Math.min(distance, this.moveSpeed * delta);
    const newX = currentPos.x + direction.x * moveDistance;
    const newZ = currentPos.z + direction.z * moveDistance;
      
      if (!this.isPositionValid(newX, newZ, 0.6)) {
      const bounce = this.getBounceDirection(currentPos.x, currentPos.z, newX, newZ);
      const bounceTarget = this.getTargetTowardsCenter(currentPos.x, currentPos.z, bounce);
        if (bounceTarget) {
          this.currentTarget = bounceTarget;
        } else {
          this.isMoving = false;
          this.currentTarget = null;
          this.nextMoveTime = 1;
          }
        return;
      }
      
      currentPos.x = newX;
      currentPos.z = newZ;

      if (this.beastModel?.hasRiggedAnimations()) {
        this.playRigAnimation('walk');
      }
      
    this.beastGroup.rotation.y = Math.atan2(direction.x, direction.z);
  }
  
  private getBounceDirection(currentX: number, currentZ: number, blockedX: number, blockedZ: number): THREE.Vector3 {
    let closestObstacle: Obstacle | null = null;
    let minDist = Infinity;
    for (const obstacle of this.obstacles) {
      const dx = blockedX - obstacle.position[0];
      const dz = blockedZ - obstacle.position[1];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < minDist) {
        minDist = dist;
        closestObstacle = obstacle;
      }
    }
    
    if (!closestObstacle) {
      const away = new THREE.Vector3(-(blockedX - currentX), 0, -(blockedZ - currentZ));
      return away.normalize();
    }

    const awayVector = new THREE.Vector3(
      currentX - closestObstacle.position[0],
      0,
      currentZ - closestObstacle.position[1],
    ).normalize();
    
    return awayVector;
  }
  
  private getTargetTowardsCenter(currentX: number, currentZ: number, direction: THREE.Vector3): THREE.Vector3 | null {
    const toCenter = new THREE.Vector3(-currentX, 0, -currentZ).normalize();
    const blended = new THREE.Vector3(
      direction.x * 0.7 + toCenter.x * 0.3,
      0,
      direction.z * 0.7 + toCenter.z * 0.3,
    ).normalize();
    
    const distance = 2 + Math.random() * 2;
    const candidateX = currentX + blended.x * distance;
    const candidateZ = currentZ + blended.z * distance;
    if (this.isPositionValid(candidateX, candidateZ, 0.6)) {
      return new THREE.Vector3(candidateX, 0, candidateZ);
    }

    const centerCandidateX = currentX + toCenter.x * 2;
    const centerCandidateZ = currentZ + toCenter.z * 2;
    if (this.isPositionValid(centerCandidateX, centerCandidateZ, 0.6)) {
      return new THREE.Vector3(centerCandidateX, 0, centerCandidateZ);
    }
    
    return null;
  }

  private createSeededRandom(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  public setBeast(beastLine: string) {
    if (this.beastGroup) {
      this.threeScene.removeObject(this.beastGroup);
      this.beastModel?.dispose();
    }

    this.beastModel = new BeastModel(beastLine);
    this.beastGroup = this.beastModel.getGroup();
    this.needsFit = true;
    this.baseYPosition = WORLD_Y_OFFSET - 0.46;
    this.isMoving = false;
    this.currentTarget = null;
    this.nextMoveTime = 2 + Math.random() * 2;
    this.activeRigAnimation = null;

    this.beastGroup.position.set(0, 0, 0);
    this.threeScene.addObject(this.beastGroup);

    if (this.beastModel.hasRiggedAnimations()) {
      this.playRigAnimation('idle');
      } else {
      this.idleAnimation = this.beastModel.playIdleAnimation();
    }
  }

  public update(delta: number) {
    this.elapsedTime += delta;

    if (this.beastModel) {
      this.beastModel.update(delta);
    }

    if (this.beastGroup && this.needsFit && this.fitBeastToRanch(this.beastGroup)) {
      this.needsFit = false;
    }

    if (this.water) {
      this.water.update(delta);
    }

    if (this.critters) {
      this.critters.update(delta);
    }

    // Atualizar iluminação dia/noite
    this.threeScene.updateDayNightLighting();
    
    // Atualizar cor do fog baseado no tempo do dia
    const scene = this.threeScene.getScene();
    if (scene.fog) {
      const skyColor = getSkyColor();
      const fogColor = new THREE.Color(skyColor.r, skyColor.g, skyColor.b);
      scene.fog.color = fogColor;
    }

    this.updateLanterns(delta);
    this.updateChimneySmoke(delta);
    this.updateBeastMovement(delta);
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
      fadeIn: 0.2,
      fadeOut: 0.2,
      forceRestart: true,
    });

    if (played) {
      this.activeRigAnimation = name;
    }
  }

  private fitBeastToRanch(group: THREE.Group): boolean {
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
}



