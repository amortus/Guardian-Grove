/**
 * Beast Viewer 3D - Monster Rancher PS1 Style
 * Displays 3D beast models in a 3D environment
 */

import * as THREE from 'three';
import type { Beast } from '../types';
import { BeastModel } from './models/BeastModel';

export class BeastViewer3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private beastModel: BeastModel | null = null;
  private beastGroup: THREE.Group | null = null;
  private animationFrameId: number | null = null;
  private needsFit = false;
  private baseYPosition = 0;
  
  // Camera controls
  private cameraAngle = 0;
  private cameraDistance = 5;
  private cameraHeight = 1.5;
  
  // Animation state
  private time = 0;
  private isAnimating = false;
  
  constructor(private container: HTMLElement, private beast: Beast) {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2a1a3d); // Dark purple background (PS1 style)
    
    // Setup camera (PS1-style perspective)
    this.camera = new THREE.PerspectiveCamera(
      60, // FOV (field of view)
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    
    // Setup renderer with PS1-style settings
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: false, // No antialiasing for retro look
      alpha: false 
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(1); // Low pixel ratio for PS1 effect
    container.appendChild(this.renderer.domElement);
    
    this.setupScene();
    this.loadBeastModel();
    this.updateCameraPosition();
    this.animate();
  }
  
  private setupScene() {
    // Add ambient light (soft overall illumination)
    const ambientLight = new THREE.AmbientLight(0x666666, 0.6);
    this.scene.add(ambientLight);
    
    // Add directional light (PS1-style key light)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 8, 5);
    this.scene.add(directionalLight);
    
    // Add secondary light (rim light for depth)
    const rimLight = new THREE.DirectionalLight(0x8844ff, 0.4);
    rimLight.position.set(-3, 2, -3);
    this.scene.add(rimLight);
    
    // Create ground plane (PS1-style checkered floor)
    this.createGround();
    
    // Add fog for depth (PS1 aesthetic)
    this.scene.fog = new THREE.Fog(0x2a1a3d, 8, 20);
  }
  
  private createGround() {
    // Create checkered texture for ground (Monster Rancher style)
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    // Draw checkered pattern
    const tileSize = 8;
    for (let x = 0; x < 64; x += tileSize) {
      for (let y = 0; y < 64; y += tileSize) {
        const isEven = ((x / tileSize) + (y / tileSize)) % 2 === 0;
        ctx.fillStyle = isEven ? '#1a0a2d' : '#2a1a3d';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    texture.magFilter = THREE.NearestFilter; // Pixelated look
    texture.minFilter = THREE.NearestFilter;
    
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      map: texture,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = 0;
    ground.receiveShadow = true;
    
    this.scene.add(ground);
  }
  
  private loadBeastModel() {
    try {
      if (this.beastModel && this.beastGroup) {
        this.scene.remove(this.beastGroup);
        this.beastModel.dispose();
      }

      const beastLine = this.beast.line.toLowerCase();
      this.beastModel = new BeastModel(beastLine);
      this.beastGroup = this.beastModel.getGroup();
      this.needsFit = true;
      this.baseYPosition = 0;

      this.scene.add(this.beastGroup);

      console.log(`[3D] Loaded BeastModel for ${this.beast.line}`);

    } catch (error) {
      console.error('[3D] Failed to load beast model:', error);

      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshStandardMaterial({ color: 0xff00ff });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(0, 1, 0);
      this.scene.add(cube);
    }
  }
  
  private updateCameraPosition() {
    // Orbit camera around the beast (Monster Rancher style)
    const x = Math.cos(this.cameraAngle) * this.cameraDistance;
    const z = Math.sin(this.cameraAngle) * this.cameraDistance;
    
    this.camera.position.set(x, this.cameraHeight, z);
    this.camera.lookAt(0, 1.5, 0); // Look at beast center
  }
  
  private animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    
    const delta = 0.016; // ~60 FPS
    this.time += delta;
    
    if (this.beastModel) {
      this.beastModel.update(delta);
    }

    if (this.needsFit && this.beastGroup) {
      const fitted = this.fitModelToView(this.beastGroup);
      if (fitted) {
        this.needsFit = false;
      }
    }
    
    // Idle animation: gentle breathing/bobbing
    if (this.beastGroup) {
      if (!this.beastModel?.hasRiggedAnimations()) {
        const breathingOffset = Math.sin(this.time * 2) * 0.05;
        this.beastGroup.position.y = this.baseYPosition + breathingOffset;
        this.beastGroup.rotation.y = Math.sin(this.time * 0.5) * 0.1;
      } else {
        this.beastGroup.position.y = this.baseYPosition;
        this.beastGroup.rotation.y = 0;
      }
    }
    
    // Slow camera orbit (auto-rotate)
    if (this.isAnimating) {
      this.cameraAngle += 0.005; // Slow rotation
      this.updateCameraPosition();
    }
    
    this.renderer.render(this.scene, this.camera);
  }
  
  // Public methods for camera control
  
  public startOrbit() {
    this.isAnimating = true;
  }
  
  public stopOrbit() {
    this.isAnimating = false;
  }
  
  public rotateCameraLeft() {
    this.cameraAngle -= 0.1;
    this.updateCameraPosition();
  }
  
  public rotateCameraRight() {
    this.cameraAngle += 0.1;
    this.updateCameraPosition();
  }
  
  public zoomIn() {
    this.cameraDistance = Math.max(3, this.cameraDistance - 0.5);
    this.updateCameraPosition();
  }
  
  public zoomOut() {
    this.cameraDistance = Math.min(10, this.cameraDistance + 0.5);
    this.updateCameraPosition();
  }
  
  public resetCamera() {
    this.cameraAngle = 0;
    this.cameraDistance = 5;
    this.cameraHeight = 1.5;
    this.updateCameraPosition();
  }
  
  // Cleanup
  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);

    if (this.beastModel) {
      this.beastModel.dispose();
      this.beastModel = null;
      this.beastGroup = null;
    }
    
    // Dispose of all geometries and materials
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        }
      }
    });
  }
  
  // Handle window resize
  public onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private fitModelToView(group: THREE.Group): boolean {
    const box = new THREE.Box3().setFromObject(group);
    if (box.isEmpty()) {
      return false;
    }

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 2.4 / maxDim : 1;

    group.scale.setScalar(scale);

    const offset = center.multiplyScalar(scale);
    group.position.set(-offset.x, this.baseYPosition - offset.y, -offset.z);

    console.log('[BeastViewer3D] ✓ Model fitted to viewport (scale:', scale.toFixed(2), ')');
    return true;
  }
}

