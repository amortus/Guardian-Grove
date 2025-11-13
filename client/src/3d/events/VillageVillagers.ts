import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

type Obstacle = {
  position: [number, number];
  radius: number;
};

type VillagerState = 'idle' | 'walk';

interface VillagerInstance {
  root: THREE.Group;
  mixer: THREE.AnimationMixer;
  idleAction: THREE.AnimationAction;
  walkAction: THREE.AnimationAction;
  state: VillagerState;
  waitTime: number;
  target: THREE.Vector2 | null;
  speed: number;
  radius: number;
}

interface VillagerVariant {
  name: string;
  idleUrl: string;
  walkUrl: string;
  loaded: boolean;
  baseScene?: THREE.Group;
  idleClip?: THREE.AnimationClip;
  walkClip?: THREE.AnimationClip;
  loadPromise?: Promise<void>;
}

interface VillageVillagersOptions {
  radius: number;
  innerRadius?: number;
  obstacles: Obstacle[];
  count: number;
}

const DEFAULT_VARIANTS: VillagerVariant[] = [
  {
    name: 'man1',
    idleUrl: '/assets/3d/Village/Villagers/Man1/Animation_Idle_withSkin.glb',
    walkUrl: '/assets/3d/Village/Villagers/Man1/Animation_Walking_withSkin.glb',
    loaded: false,
  },
  {
    name: 'woman1',
    idleUrl: '/assets/3d/Village/Villagers/Woman1/Animation_Idle_withSkin.glb',
    walkUrl: '/assets/3d/Village/Villagers/Woman1/Animation_Walking_withSkin.glb',
    loaded: false,
  },
];

export class VillageVillagers {
  private parent: THREE.Group;
  private loader: GLTFLoader;
  private options: VillageVillagersOptions;
  private villagers: VillagerInstance[] = [];
  private variants: VillagerVariant[];

  constructor(parent: THREE.Group, loader: GLTFLoader, options: VillageVillagersOptions) {
    this.parent = parent;
    this.loader = loader;
    this.options = options;
    this.variants = DEFAULT_VARIANTS.map((variant) => ({ ...variant }));
  }

  public async populate(): Promise<void> {
    try {
      await Promise.all(this.variants.map((_, index) => this.loadVariant(index)));
    } catch (error) {
      console.error('[VillageVillagers] Failed to load villager variants:', error);
      return;
    }

    const desired = this.options.count;
    for (let i = 0; i < desired; i += 1) {
      await this.spawnVillager();
    }
  }

  public update(delta: number): void {
    const safeDelta = Math.min(delta, 0.1);

    for (const villager of this.villagers) {
      villager.mixer.update(safeDelta);
    }

    for (const villager of this.villagers) {
      if (villager.state === 'walk') {
        this.updateWalkingVillager(villager, safeDelta);
      } else {
        villager.waitTime -= safeDelta;
        if (villager.waitTime <= 0) {
          const target = this.chooseTarget(villager);
          if (target) {
            villager.target = target;
            this.setState(villager, 'walk');
          } else {
            villager.waitTime = 1 + Math.random() * 2;
          }
        }
      }
    }
  }

  public dispose(): void {
    this.villagers.forEach((villager) => {
      villager.mixer.stopAllAction();
      this.parent.remove(villager.root);
    });
    this.villagers = [];
  }

  private async loadVariant(index: number): Promise<void> {
    const variant = this.variants[index];
    if (!variant || variant.loaded) {
      return;
    }

    if (variant.loadPromise) {
      await variant.loadPromise;
      return;
    }

    variant.loadPromise = new Promise<void>((resolve, reject) => {
      this.loader.load(
        variant.idleUrl,
        (gltf) => {
          variant.baseScene = gltf.scene;
          variant.idleClip = gltf.animations[0] ?? null;

          this.loader.load(
            variant.walkUrl,
            (walkGltf) => {
              variant.walkClip = walkGltf.animations[0] ?? null;
              variant.loaded = true;
              resolve();
            },
            undefined,
            (err) => reject(err),
          );
        },
        undefined,
        (error) => reject(error),
      );
    });

    await variant.loadPromise;
  }

  private async spawnVillager(): Promise<void> {
    const variantIndex = Math.floor(Math.random() * this.variants.length);
    const variant = this.variants[variantIndex];

    if (!variant.loaded || !variant.baseScene || !variant.idleClip || !variant.walkClip) {
      return;
    }

    const baseClone = clone(variant.baseScene) as THREE.Group;
    this.normaliseModel(baseClone);

    const spawn = this.findSpawnPosition(0.6);
    baseClone.position.set(spawn.x, 0, spawn.z);
    baseClone.rotation.y = Math.random() * Math.PI * 2;

    const mixer = new THREE.AnimationMixer(baseClone);
    const idleAction = mixer.clipAction(variant.idleClip);
    idleAction.setLoop(THREE.LoopRepeat, Infinity);
    idleAction.play();

    const walkAction = mixer.clipAction(variant.walkClip);
    walkAction.setLoop(THREE.LoopRepeat, Infinity);
    walkAction.play();
    walkAction.enabled = true;
    walkAction.weight = 0;

    this.parent.add(baseClone);

    const villager: VillagerInstance = {
      root: baseClone,
      mixer,
      idleAction,
      walkAction,
      state: 'idle',
      waitTime: 1 + Math.random() * 3,
      target: null,
      speed: 0.9 + Math.random() * 0.5,
      radius: 0.6,
    };

    this.villagers.push(villager);
  }

  private updateWalkingVillager(villager: VillagerInstance, delta: number): void {
    if (!villager.target) {
      this.setState(villager, 'idle');
      villager.waitTime = 1 + Math.random() * 2;
      return;
    }

    const position = villager.root.position;
    const targetVec = new THREE.Vector3(villager.target.x, 0, villager.target.y);
    const direction = new THREE.Vector3().subVectors(targetVec, position);
    const distance = direction.length();

    if (distance < 0.15) {
      villager.target = null;
      villager.waitTime = 1.5 + Math.random() * 3;
      this.setState(villager, 'idle');
      return;
    }

    direction.normalize();
    const moveDistance = Math.min(distance, villager.speed * delta);
    const nextX = position.x + direction.x * moveDistance;
    const nextZ = position.z + direction.z * moveDistance;

    if (!this.isPositionValid(nextX, nextZ, villager.radius, villager)) {
      villager.target = null;
      villager.waitTime = 1 + Math.random() * 2;
      this.setState(villager, 'idle');
      return;
    }

    position.x = nextX;
    position.z = nextZ;
    villager.root.rotation.y = Math.atan2(direction.x, direction.z);
    villager.walkAction.timeScale = villager.speed * 0.85;
  }

  private setState(villager: VillagerInstance, state: VillagerState): void {
    if (villager.state === state) {
      return;
    }

    if (state === 'walk') {
      villager.walkAction.reset();
      villager.walkAction.enabled = true;
      villager.walkAction.setEffectiveWeight(1);
      villager.walkAction.crossFadeFrom(villager.idleAction, 0.35, false);
      villager.state = 'walk';
    } else {
      villager.idleAction.reset();
      villager.idleAction.enabled = true;
      villager.idleAction.setEffectiveWeight(1);
      villager.idleAction.crossFadeFrom(villager.walkAction, 0.45, false);
      villager.state = 'idle';
    }
  }

  private normaliseModel(model: THREE.Group): void {
    const box = new THREE.Box3().setFromObject(model);
    if (box.isEmpty()) {
      return;
    }

    const size = box.getSize(new THREE.Vector3());
    if (size.y > 0) {
      const desiredHeight = 0.02;
      const scale = desiredHeight / size.y;
      model.scale.setScalar(scale);
    }

    const newBox = new THREE.Box3().setFromObject(model);
    const center = newBox.getCenter(new THREE.Vector3());
    const minY = newBox.min.y;
    model.position.sub(center);
    model.position.y -= minY;
  }

  private findSpawnPosition(radius: number): { x: number; z: number } {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const point = this.randomPoint();
      if (this.isPositionValid(point.x, point.z, radius)) {
        return point;
      }
    }
    return { x: 0, z: this.options.innerRadius ?? 0 };
  }

  private chooseTarget(villager: VillagerInstance): THREE.Vector2 | null {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const point = this.randomPoint();
      const dx = point.x - villager.root.position.x;
      const dz = point.z - villager.root.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < 2 || distance > 12) {
        continue;
      }

      if (this.isPositionValid(point.x, point.z, villager.radius, villager)) {
        return new THREE.Vector2(point.x, point.z);
      }
    }
    return null;
  }

  private randomPoint(): { x: number; z: number } {
    const angle = Math.random() * Math.PI * 2;
    const radiusRange = this.options.radius - (this.options.innerRadius ?? 0) - 1;
    const radius = (this.options.innerRadius ?? 0) + 1 + Math.random() * radiusRange;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    return { x, z };
  }

  private isPositionValid(x: number, z: number, radius: number, self?: VillagerInstance): boolean {
    const distanceToCenter = Math.sqrt(x * x + z * z);
    if (distanceToCenter > this.options.radius - radius) {
      return false;
    }
    if (this.options.innerRadius && distanceToCenter < this.options.innerRadius + radius) {
      return false;
    }

    for (const obstacle of this.options.obstacles) {
      const dx = x - obstacle.position[0];
      const dz = z - obstacle.position[1];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < obstacle.radius + radius) {
        return false;
      }
    }

    for (const other of this.villagers) {
      if (other === self) continue;
      const dx = x - other.root.position.x;
      const dz = z - other.root.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < other.radius + radius + 0.4) {
        return false;
      }
    }

    return true;
  }
}

