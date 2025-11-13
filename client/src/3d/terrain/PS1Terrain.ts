/**
 * PS1-Style Procedural Terrain
 * Inspired by THREE.Terrain but simplified for PS1 aesthetic
 */

import * as THREE from 'three';

export interface PS1TerrainOptions {
  size: number;
  segments: number;
  heightVariation: number;
  seed?: number;
  colors?: {
    base: number;
    high: number;
    low: number;
  };
}

export class PS1Terrain {
  private mesh: THREE.Mesh;
  private geometry: THREE.PlaneGeometry;
  
  constructor(options: PS1TerrainOptions) {
    const {
      size,
      segments,
      heightVariation,
      colors = {
        base: 0x2d5016,  // Dark green
        high: 0x4a7c59,  // Light green (hills)
        low: 0x1d4010,   // Very dark green (valleys)
      }
    } = options;
    
    // Create plane geometry
    this.geometry = new THREE.PlaneGeometry(
      size,
      size,
      segments,
      segments
    );
    
    // Apply height variation
    this.applyHeightmap(heightVariation, options.seed);
    
    // Compute normals for lighting
    this.geometry.computeVertexNormals();
    
    // Create material with vertex colors for elevation-based coloring
    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: false, // Smooth shading para não ficar blocky
      side: THREE.DoubleSide,
    });
    
    // Apply vertex colors based on height
    this.applyVertexColors(colors);
    
    // Create mesh
    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.rotation.x = -Math.PI / 2; // Horizontal
    this.mesh.receiveShadow = false; // No shadows for performance
  }
  
  /**
   * Apply procedural heightmap using simplified Perlin-like noise
   */
  private applyHeightmap(heightVariation: number, seed: number = Math.random()) {
    const positions = this.geometry.attributes.position;
    const count = positions.count;
    
    for (let i = 0; i < count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      // Multi-octave noise for more natural terrain
      let height = 0;
      height += this.simpleNoise(x * 0.05 + seed, z * 0.05 + seed) * 1.0;
      height += this.simpleNoise(x * 0.1 + seed, z * 0.1 + seed) * 0.5;
      height += this.simpleNoise(x * 0.2 + seed, z * 0.2 + seed) * 0.25;
      
      // Apply height variation
      height = height * heightVariation;
      
      // Set Y position
      positions.setY(i, height);
    }
    
    positions.needsUpdate = true;
  }
  
  /**
   * Simple noise function (pseudo-Perlin)
   * For production, consider using actual Perlin/Simplex noise library
   */
  private simpleNoise(x: number, y: number): number {
    // Simple pseudo-random noise using sine waves
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1; // Range: -1 to 1
  }
  
  /**
   * Apply vertex colors based on elevation
   */
  private applyVertexColors(colors: { base: number; high: number; low: number }) {
    const positions = this.geometry.attributes.position;
    const count = positions.count;
    
    // Create color attribute
    const colorsArray = new Float32Array(count * 3);
    
    // Find min/max height for normalization
    let minHeight = Infinity;
    let maxHeight = -Infinity;
    
    for (let i = 0; i < count; i++) {
      const y = positions.getY(i);
      minHeight = Math.min(minHeight, y);
      maxHeight = Math.max(maxHeight, y);
    }
    
    // Apply colors based on normalized height
    const baseColor = new THREE.Color(colors.base);
    const highColor = new THREE.Color(colors.high);
    const lowColor = new THREE.Color(colors.low);
    
    for (let i = 0; i < count; i++) {
      const y = positions.getY(i);
      const normalizedHeight = (y - minHeight) / (maxHeight - minHeight || 1);
      
      let color: THREE.Color;
      if (normalizedHeight > 0.6) {
        // High areas (hills)
        color = highColor;
      } else if (normalizedHeight < 0.3) {
        // Low areas (valleys)
        color = lowColor;
      } else {
        // Mid areas (blend)
        color = baseColor;
      }
      
      colorsArray[i * 3] = color.r;
      colorsArray[i * 3 + 1] = color.g;
      colorsArray[i * 3 + 2] = color.b;
    }
    
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));
  }
  
  /**
   * Get the terrain mesh
   */
  public getMesh(): THREE.Mesh {
    return this.mesh;
  }
  
  /**
   * Get height at specific X,Z position (useful for placing objects)
   */
  public getHeightAt(x: number, z: number): number {
    // Simple lookup - for production, implement proper interpolation
    const positions = this.geometry.attributes.position;
    
    // Find closest vertex (simplified)
    let closestHeight = 0;
    let minDist = Infinity;
    
    for (let i = 0; i < positions.count; i++) {
      const vx = positions.getX(i);
      const vz = positions.getZ(i);
      const dist = Math.sqrt((vx - x) ** 2 + (vz - z) ** 2);
      
      if (dist < minDist) {
        minDist = dist;
        closestHeight = positions.getY(i);
      }
    }
    
    return closestHeight;
  }
  
  /**
   * Dispose geometry and material
   */
  public dispose() {
    this.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

