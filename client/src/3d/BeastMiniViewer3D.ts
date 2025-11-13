/**
 * Beast Mini Viewer 3D - Compact 3D viewer for ranch UI
 * Small embedded 3D view of the beast in the ranch screen
 */

import * as THREE from 'three';
import type { Beast } from '../types';
import { BeastModel } from './models/BeastModel';

export class BeastMiniViewer3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private beastModel: BeastModel | null = null;
  private beastGroup: THREE.Group | null = null;
  private animationFrameId: number | null = null;
  private container: HTMLElement;
  
  // Animation state
  private time = 0;
  private baseYPosition = -2.0; // Store the base Y position (centered)
  private needsFit = false;
  
  constructor(container: HTMLElement, beast: Beast, width: number = 120, height: number = 120) {
    this.container = container;
    
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x6a3d7a); // Bright purple for visibility
    console.log('[MiniViewer3D] Scene created with purple background');
    
    // Setup camera (closer to see the model better)
    this.camera = new THREE.PerspectiveCamera(
      50, // FOV (wider for small viewport)
      width / height,
      0.1,
      100
    );
    this.camera.position.set(2.5, 0.6, 3);
    this.camera.lookAt(0, -0.4, 0);
    console.log('[MiniViewer3D] Camera positioned at (2.5, 0.6, 3) looking at (0, -0.4, 0)');
    
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Style the canvas for visibility
    this.renderer.domElement.style.display = 'block';
    
    container.appendChild(this.renderer.domElement);
    
    console.log(`[MiniViewer3D] ✓ Renderer created: ${width}x${height}`);
    console.log('[MiniViewer3D] Canvas appended to container:', container.id);
    console.log('[MiniViewer3D] Canvas element:', this.renderer.domElement);
    
    this.setupScene();
    this.loadBeastModel(beast);
    this.animate();
  }
  
  private setupScene() {
    console.log('[MiniViewer3D] Setting up lights...');
    
    // Add VERY strong ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);
    console.log('[MiniViewer3D] ✓ Ambient light added (120%)');
    
    // Add directional light (key light)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(3, 5, 3);
    this.scene.add(directionalLight);
    console.log('[MiniViewer3D] ✓ Directional light added');
    
    // Add fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-2, 2, -2);
    this.scene.add(fillLight);
    console.log('[MiniViewer3D] ✓ Fill light added');
  }
  
  private loadBeastModel(beast: Beast) {
    console.log('[MiniViewer3D] ========== START MODEL LOADING ==========');
    console.log('[MiniViewer3D] Beast:', beast.name, '/', beast.line);
    
    try {
      const beastLine = beast.line.toLowerCase();
      console.log('[MiniViewer3D] Generating BeastModel for line:', beastLine);

      this.beastModel = new BeastModel(beastLine);
      this.beastGroup = this.beastModel.getGroup();
      this.needsFit = true;
      this.baseYPosition = -2.0;

      this.scene.add(this.beastGroup);
      
      console.log('[MiniViewer3D] ✓ BeastModel group added to scene');
      console.log('[MiniViewer3D] Scene children count:', this.scene.children.length);
      
    } catch (error) {
      console.error('[MiniViewer3D] ❌ ERRO ao carregar modelo:', error);
      console.error('[MiniViewer3D] Stack:', (error as Error).stack);
      
      // Fallback: bright colored cube for debugging
      const fallbackCube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ 
          color: 0xff00ff, // Magenta
          wireframe: false
        })
      );
      fallbackCube.position.set(0, 0.5, 0);
      this.scene.add(fallbackCube);
      
      console.log('[MiniViewer3D] ✓ Fallback cube added (magenta)');
    }
    
    console.log('[MiniViewer3D] ========== END MODEL LOADING ==========');
  }
  
  private animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    
    this.time += 0.016; // ~60 FPS
    
    if (this.beastModel) {
      this.beastModel.update(0.016);
    }

    if (this.needsFit && this.beastGroup) {
      const fitted = this.fitModelToView(this.beastGroup);
      if (fitted) {
        this.needsFit = false;
      }
    }
    
    // Gentle idle animation
    if (this.beastGroup) {
      // Subtle breathing - ADD to base position, don't overwrite!
      if (!this.beastModel?.hasRiggedAnimations()) {
        const breathingOffset = Math.sin(this.time * 2) * 0.05;
        this.beastGroup.position.y = this.baseYPosition + breathingOffset;
        this.beastGroup.rotation.y = this.time * 0.3;
      } else {
        this.beastGroup.position.y = this.baseYPosition;
      }
    }
    
    // Render the scene
    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error('[MiniViewer3D] Render error:', error);
    }
  }
  
  // Update to new beast
  public updateBeast(beast: Beast) {
    // Remove old model
    if (this.beastModel && this.beastGroup) {
      this.scene.remove(this.beastGroup);
      this.beastModel.dispose();
      this.beastModel = null;
      this.beastGroup = null;
    }
    this.needsFit = false;
    
    // Load new model
    this.loadBeastModel(beast);
  }
  
  // Cleanup
  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.renderer.dispose();
    
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }

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
  
  // Handle resize
  public onResize(width: number, height: number) {
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
    const scale = maxDim > 0 ? 1.8 / maxDim : 1;

    group.scale.setScalar(scale);

    const offset = center.multiplyScalar(scale);
    group.position.set(-offset.x, this.baseYPosition - offset.y, -offset.z);

    console.log('[MiniViewer3D] ✓ Model fitted to viewport (scale:', scale.toFixed(2), ')');
    return true;
  }
}

