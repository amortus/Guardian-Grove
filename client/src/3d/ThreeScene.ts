/**
 * Three.js Scene Manager
 * Guardian Grove - 3D Graphics Engine
 */

import * as THREE from 'three';
import { getDayNightBlend, getAmbientLightIntensity, getSkyColor } from '../utils/day-night';

export class ThreeScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private animationId: number | null = null;
  
  // Luzes para sistema dia/noite
  private ambientLight: THREE.HemisphereLight | null = null;
  private keyLight: THREE.DirectionalLight | null = null;
  private rimLight: THREE.DirectionalLight | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Create scene
    this.scene = new THREE.Scene();
    // Background azul claro (caso skybox falhe)
    this.scene.background = new THREE.Color(0x87ceeb); // Azul céu

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      canvas.width / canvas.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 0, 0);

    // Create renderer with PS1 optimizations
    this.renderer = new THREE.WebGLRenderer({ 
      canvas,
      antialias: true,           // Antialiasing para suavizar (não queremos Minecraft)
      alpha: false,
      powerPreference: 'high-performance'
    });
    
    // ✅ Usa tamanho REAL do CSS, não o lógico do canvas
    const rect = canvas.getBoundingClientRect();
    this.renderer.setSize(rect.width, rect.height, false); // false = não atualiza style
    const pixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.8) : 1;
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add basic lighting
    this.setupLighting();
  }

  private setupLighting() {
    // Lighting estilo Pokémon (clara, vibrante e alegre) com suporte a dia/noite
    
    this.ambientLight = new THREE.HemisphereLight(0xf0f6ff, 0x2c1e13, 0.7);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
    this.keyLight.position.set(8, 12, 6);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 60;
    this.keyLight.shadow.camera.left = -20;
    this.keyLight.shadow.camera.right = 20;
    this.keyLight.shadow.camera.top = 20;
    this.keyLight.shadow.camera.bottom = -20;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0xfff4d2, 0.35);
    this.rimLight.position.set(-6, 5, -4);
    this.scene.add(this.rimLight);
    
    // Atualizar iluminação inicial
    this.updateDayNightLighting();
  }
  
  /**
   * Atualiza iluminação baseado no tempo do dia
   */
  public updateDayNightLighting() {
    const blend = getDayNightBlend(); // 0 = dia, 1 = noite
    const ambientIntensity = getAmbientLightIntensity();
    const skyColor = getSkyColor();
    
    // Atualizar cor do céu
    this.scene.background = new THREE.Color(skyColor.r, skyColor.g, skyColor.b);
    
    if (this.ambientLight) {
      // Ambiente: dia (0.7) -> noite (0.2)
      this.ambientLight.intensity = 0.35 + (0.35 * (1 - blend));
      
      // Cor ambiente: dia (azul claro) -> noite (azul escuro)
      const dayColor = 0xf0f6ff;
      const nightColor = 0x1a1a2e;
      this.ambientLight.color.setHex(
        Math.floor(dayColor + (nightColor - dayColor) * blend)
      );
    }
    
    if (this.keyLight) {
      // Sol: dia (1.15) -> noite (0.1, quase apagado)
      this.keyLight.intensity = 0.25 + (0.9 * (1 - blend));
      
      // Cor do sol: dia (branco) -> noite (azul escuro)
      const daySunColor = 0xffffff;
      const nightSunColor = 0x2a3a5a;
      this.keyLight.color.setHex(
        Math.floor(daySunColor + (nightSunColor - daySunColor) * blend)
      );
      
      // Posição do sol: dia (alto) -> noite (baixo, abaixo do horizonte)
      const dayY = 12;
      const nightY = -5; // Abaixo do horizonte
      this.keyLight.position.y = dayY + (nightY - dayY) * blend;
    }
    
    if (this.rimLight) {
      // Rim light: dia (0.35) -> noite (0.05)
      this.rimLight.intensity = 0.12 + (0.23 * (1 - blend));
      
      // Cor rim: dia (amarelo claro) -> noite (azul escuro)
      const dayRimColor = 0xfff4d2;
      const nightRimColor = 0x1a2a3a;
      this.rimLight.color.setHex(
        Math.floor(dayRimColor + (nightRimColor - dayRimColor) * blend)
      );
    }
  }

  public addObject(object: THREE.Object3D) {
    this.scene.add(object);
  }

  public removeObject(object: THREE.Object3D) {
    this.scene.remove(object);
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  public startAnimationLoop(callback?: (delta: number) => void) {
    let lastTime = 0;
    
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (callback) {
        callback(delta);
      }

      this.render();
      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  public stopAnimationLoop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.Camera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public dispose() {
    this.stopAnimationLoop();
    this.renderer.dispose();
  }
}

