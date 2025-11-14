/**
 * Guardian Hub Scene 3D
 * Composes the new Guardian Grove hub using existing ranch/village assets
 * and lightweight Three.js primitives for bespoke elements (árvore casa, poço, quadro, ponte).
 */

import * as THREE from 'three';

import { ThreeScene } from '../ThreeScene';
import { BeastModel } from '../models/BeastModel';
import { getSkyColor } from '../../utils/day-night';

const WORLD_Y_OFFSET = -1.15;

export class GuardianHubScene3D {
  private threeScene: ThreeScene;
  private canvas: HTMLCanvasElement;
  private decorationsRoot: THREE.Group | null = null;
  private walkableGround: THREE.Mesh | null = null;
  private beastModel: BeastModel | null = null;
  private beastGroup: THREE.Group | null = null;
  private activeRigAnimation: 'idle' | 'walk' | null = null;
  private idleAnimation: (() => void) | null = null;
  private baseYPosition = WORLD_Y_OFFSET - 0.46;
  private needsFit = false;
  private isMoving = false;
  private currentTarget: THREE.Vector3 | null = null;
  private nextMoveTime = 0;
  private elapsedTime = 0;

  private interactionCallback?: (id: string) => void;
  private hoverCallback?: (id: string | null) => void;
  private manualControl = false;
  private particlesSystem: THREE.Points | null = null;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private cameraOffset = new THREE.Vector3(0, 5.8, 10.4);
  private cameraFollowStrength = 0.12;
  
  // Ghost system (other players)
  private ghostPlayers: Map<string, {
    model: BeastModel;
    group: THREE.Group;
    nametag: THREE.Sprite;
  }> = new Map();
  private lastPositionSaveTime = 0;
  private lastGhostFetchTime = 0;

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

    this.createProceduralGround();
    this.createProceduralRiver();
    this.createProceduralStructures();
    this.createProceduralDecor();
    this.createLightingProps();
    this.createAmbientParticles();
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
    const radius = 36; // dobro do tamanho anterior para dar bastante área de caminhada
    const geometry = new THREE.CircleGeometry(radius, 72);

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

    if (hoveredId !== null) { // No hoveredInteractable, so always update
      this.updateInteractableHighlight(hoveredId && hoveredId !== 'walkable' ? hoveredId : null);
      this.hoverCallback?.(hoveredId);
    }

    return hoveredId;
  }

  public handlePointerClick(clientX: number, clientY: number, rect: DOMRect): string | null {
    // Debug para entender porque o clique não está movendo o guardião
    // eslint-disable-next-line no-console
    console.log('[GuardianHubScene3D] handlePointerClick', {
      clientX,
      clientY,
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    });

    this.preparePointer(clientX, clientY, rect);
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

    if (!this.isMoving) {
      // No pendingInteraction, manualControl, or interactionCallback here
      this.currentTarget = null;
      this.playRigAnimation('idle');
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
      const speed = 2.0;
      const current = this.beastGroup.position;

      // Movimentação apenas no plano XZ (altura controlada por fitBeastToScene)
      const direction = new THREE.Vector3(
        this.currentTarget.x - current.x,
        0,
        this.currentTarget.z - current.z,
      );
      const distance = direction.length();

      if (distance < 0.1) {
        this.isMoving = false;
        this.currentTarget = null;
        this.playRigAnimation('idle');

        // No pendingInteraction, manualControl, or interactionCallback here
        this.nextMoveTime = 2.0 + Math.random() * 1.2;
      }

      direction.normalize();
      current.addScaledVector(direction, speed * delta);

      if (this.currentTarget) {
        this.beastGroup.lookAt(this.currentTarget.x, current.y, this.currentTarget.z);
      }
    }
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
    const scale = maxDim > 0 ? 1.6 / maxDim : 1;

    group.scale.setScalar(scale);

    const offset = center.multiplyScalar(scale);
    group.position.set(-offset.x, this.baseYPosition - offset.y, -offset.z);

    return true;
  }

  // ========== GHOST SYSTEM ==========

  private async updateGhostSystem(delta: number) {
    this.elapsedTime += delta;

    // Save our position every 3 seconds
    if (this.beastGroup && this.elapsedTime - this.lastPositionSaveTime > 3) {
      this.lastPositionSaveTime = this.elapsedTime;
      await this.saveOurPosition();
    }

    // Fetch other players every 10 seconds
    if (this.elapsedTime - this.lastGhostFetchTime > 10) {
      this.lastGhostFetchTime = this.elapsedTime;
      await this.fetchAndRenderGhosts();
    }

    // Update nametag positions
    this.updateNametags();
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
      console.log('[Ghost] 🔄 Updating ghost position:', visitor.playerName);
      // Update position
      existing.group.position.set(
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

      this.ghostPlayers.set(visitor.playerName, {
        model: ghostModel,
        group: ghostGroup,
        nametag
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
    sprite.position.y = 2; // Above the beast

    return sprite;
  }

  private updateNametags() {
    const camera = this.threeScene.getCamera();
    
    for (const [, ghost] of this.ghostPlayers) {
      // Make nametag always face camera
      ghost.nametag.lookAt(camera.position);
    }
  }
}

