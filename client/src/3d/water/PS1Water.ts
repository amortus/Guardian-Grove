/**
 * PS1-Style Water
 * Simple animated water shader inspired by Ocean shaders but simplified for PS1 aesthetic
 */

import * as THREE from 'three';

export interface PS1WaterOptions {
  size?: number;
  segments?: number;
  color?: number;
  waveSpeed?: number;
  waveHeight?: number;
}

export class PS1Water {
  private mesh: THREE.Mesh;
  private time: number = 0;
  private waveSpeed: number;
  private material: THREE.ShaderMaterial;
  
  constructor(options: PS1WaterOptions = {}) {
    const {
      size = 2,
      segments = 8,
      color = 0x4299e1,
      waveSpeed = 1.0,
      waveHeight = 0.05,
    } = options;
    
    this.waveSpeed = waveSpeed;
    
    // Low-poly circle geometry
    const geometry = new THREE.CircleGeometry(size, segments);
    
    // PS1-style water shader
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        waterColor: { value: new THREE.Color(color) },
        waveHeight: { value: waveHeight },
      },
      vertexShader: `
        uniform float time;
        uniform float waveHeight;
        
        varying vec2 vUv;
        varying float vWave;
        
        void main() {
          vUv = uv;
          
          vec3 pos = position;
          
          // Simple wave animation (low frequency for PS1 style)
          float wave1 = sin(pos.x * 2.0 + time) * waveHeight;
          float wave2 = cos(pos.y * 2.0 + time * 1.3) * waveHeight;
          
          pos.z += wave1 + wave2;
          vWave = wave1 + wave2;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 waterColor;
        
        varying vec2 vUv;
        varying float vWave;
        
        void main() {
          // Simple color variation based on waves
          vec3 color = waterColor * (0.9 + vWave * 2.0);
          
          // Add some "reflection" effect (lighter towards center)
          float centerDist = length(vUv - vec2(0.5, 0.5));
          color *= 1.0 - centerDist * 0.2;
          
          // Reduce precision for PS1 look
          color = floor(color * 32.0) / 32.0;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });
    
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.rotation.x = -Math.PI / 2; // Horizontal
    this.mesh.position.y = 0.01; // Slightly above ground to prevent z-fighting
  }
  
  /**
   * Update water animation
   */
  public update(delta: number) {
    this.time += delta * this.waveSpeed;
    this.material.uniforms.time.value = this.time;
  }
  
  /**
   * Get the water mesh
   */
  public getMesh(): THREE.Mesh {
    return this.mesh;
  }
  
  /**
   * Set water color
   */
  public setColor(color: number) {
    this.material.uniforms.waterColor.value.setHex(color);
  }
  
  /**
   * Dispose geometry and material
   */
  public dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

