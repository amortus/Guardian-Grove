/**
 * 3D Battle Scene
 * Guardian Grove - Three.js battle visualization
 */

import * as THREE from 'three';
import { ThreeScene } from '../ThreeScene';
import { BeastModel } from '../models/BeastModel';

export class BattleScene3D {
  private threeScene: ThreeScene;
  private playerBeastModel: BeastModel | null = null;
  private enemyBeastModel: BeastModel | null = null;
  private playerBeastGroup: THREE.Group | null = null;
  private enemyBeastGroup: THREE.Group | null = null;
  private animations: Map<string, () => void> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.threeScene = new ThreeScene(canvas);
    this.setupBattleArena();
  }

  private setupBattleArena() {
    const scene = this.threeScene.getScene();

    // Arena floor (platform)
    const floorGeometry = new THREE.CircleGeometry(8, 16);
    const floorMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x2a2a3e,
      flatShading: true,
      side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Arena border (octagon)
    const borderGeometry = new THREE.TorusGeometry(8, 0.2, 4, 8);
    const borderMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x9f7aea,
      emissive: 0x6b46c1,
      emissiveIntensity: 0.5,
      flatShading: true
    });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.rotation.x = Math.PI / 2;
    border.position.y = 0.1;
    scene.add(border);

    // Pillars (4 corners)
    const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 6);
    const pillarMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x4a5568,
      flatShading: true
    });

    const pillarPositions = [
      [6, 1.5, 6],
      [-6, 1.5, 6],
      [6, 1.5, -6],
      [-6, 1.5, -6]
    ];

    pillarPositions.forEach(pos => {
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(pos[0], pos[1], pos[2]);
      scene.add(pillar);

      // Glowing crystal on top
      const crystalGeometry = new THREE.OctahedronGeometry(0.3, 0);
      const crystalMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x9f7aea
      });
      const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
      crystal.position.set(pos[0], 3.2, pos[2]);
      scene.add(crystal);
    });

    // Ambient particles (stars)
    this.createStarField();
  }

  private createStarField() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 200;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 50;
      positions[i + 1] = Math.random() * 20 + 5;
      positions[i + 2] = (Math.random() - 0.5) * 50;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starMaterial = new THREE.PointsMaterial({ 
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0.6
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    this.threeScene.getScene().add(stars);
  }

  public setPlayerBeast(beastLine: string) {
    // Remove previous model
    if (this.playerBeastGroup) {
      this.threeScene.removeObject(this.playerBeastGroup);
      this.playerBeastModel?.dispose();
    }

    // Create new model
    this.playerBeastModel = new BeastModel(beastLine);
    this.playerBeastGroup = this.playerBeastModel.getGroup();
    
    // Position on left side
    this.playerBeastGroup.position.set(-3, 0, 0);
    this.playerBeastGroup.rotation.y = Math.PI / 4;
    
    this.threeScene.addObject(this.playerBeastGroup);

    // Setup idle animation
    const idleAnim = this.playerBeastModel.playIdleAnimation();
    this.animations.set('player_idle', idleAnim);
  }

  public setEnemyBeast(beastLine: string) {
    // Remove previous model
    if (this.enemyBeastGroup) {
      this.threeScene.removeObject(this.enemyBeastGroup);
      this.enemyBeastModel?.dispose();
    }

    // Create new model
    this.enemyBeastModel = new BeastModel(beastLine);
    this.enemyBeastGroup = this.enemyBeastModel.getGroup();
    
    // Position on right side
    this.enemyBeastGroup.position.set(3, 0, 0);
    this.enemyBeastGroup.rotation.y = -Math.PI / 4;
    
    this.threeScene.addObject(this.enemyBeastGroup);

    // Setup idle animation
    const idleAnim = this.enemyBeastModel.playIdleAnimation();
    this.animations.set('enemy_idle', idleAnim);
  }

  public update(delta: number) {
    // Run all active animations
    this.animations.forEach(anim => anim());
  }

  public render() {
    this.threeScene.render();
  }

  public startLoop() {
    this.threeScene.startAnimationLoop((delta) => {
      this.update(delta);
    });
  }

  public stopLoop() {
    this.threeScene.stopAnimationLoop();
  }

  public resize(width: number, height: number) {
    this.threeScene.resize(width, height);
  }

  public dispose() {
    this.playerBeastModel?.dispose();
    this.enemyBeastModel?.dispose();
    this.threeScene.dispose();
  }
}

