/**
 * Village Critters - Eventos aleatórios de bichinhos na vila
 * Mosquinhas, abelhas, pássaros, esquilos, formigas, etc.
 * Adaptado do RanchCritters para área maior da vila
 */

import * as THREE from 'three';

// Tipos de critters
type CritterType = 'fly' | 'bee' | 'bird' | 'ant' | 'hummingbird' | 'leaf';

interface Critter {
  mesh: THREE.Group;
  type: CritterType;
  velocity: THREE.Vector3;
  lifetime: number; // Tempo até desaparecer
  maxLifetime: number;
}

export class VillageCritters {
  private scene: THREE.Scene;
  private critters: Critter[] = [];
  private nextSpawnTime: number = 0;
  
  // Área da vila (ajustada para área visível da câmera)
  private readonly VILLAGE_SIZE = 35; // Raio aproximado da vila (área visível)
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.nextSpawnTime = this.getRandomSpawnDelay();
  }
  
  /**
   * Tempo aleatório até próximo spawn (3-8 segundos) - mais frequente na vila
   */
  private getRandomSpawnDelay(): number {
    return 3 + Math.random() * 5;
  }
  
  /**
   * Update - spawnar e atualizar critters
   */
  public update(delta: number) {
    // Countdown para próximo spawn
    this.nextSpawnTime -= delta;
    
    if (this.nextSpawnTime <= 0) {
      this.spawnRandomCritter();
      this.nextSpawnTime = this.getRandomSpawnDelay();
    }
    
    // Atualizar todos os critters ativos
    for (let i = this.critters.length - 1; i >= 0; i--) {
      const critter = this.critters[i];
      
      // Atualizar lifetime
      critter.lifetime -= delta;
      
      // Remover se tempo acabou
      if (critter.lifetime <= 0) {
        this.scene.remove(critter.mesh);
        this.critters.splice(i, 1);
        continue;
      }
      
      // Atualizar movimento
      this.updateCritterMovement(critter, delta);
    }
  }
  
  /**
   * Spawnar critter aleatório
   */
  private spawnRandomCritter() {
    const types: CritterType[] = ['fly', 'bee', 'bird', 'ant', 'hummingbird', 'leaf'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    switch (type) {
      case 'fly':
        this.spawnFly();
        break;
      case 'bee':
        this.spawnBee();
        break;
      case 'bird':
        this.spawnBird();
        break;
      case 'ant':
        this.spawnAnt();
        break;
      case 'hummingbird':
        this.spawnHummingbird();
        break;
      case 'leaf':
        this.spawnLeaf();
        break;
    }
  }
  
  /**
   * Mosquinha - voa erraticamente
   */
  private spawnFly() {
    const flyGroup = new THREE.Group();
    
    // Corpo minúsculo (esfera preta) - um pouco maior para visibilidade
    const bodyGeometry = new THREE.SphereGeometry(0.06, 4, 4);
    const bodyMaterial = new THREE.MeshToonMaterial({ color: 0x000000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    flyGroup.add(body);
    
    // 2 asas (planos transparentes) - um pouco maiores
    const wingGeometry = new THREE.PlaneGeometry(0.08, 0.04);
    const wingMaterial = new THREE.MeshToonMaterial({ 
      color: 0xcccccc,
      transparent: true,
      opacity: 0.5
    });
    
    const wing1 = new THREE.Mesh(wingGeometry, wingMaterial);
    wing1.position.set(-0.03, 0, 0);
    flyGroup.add(wing1);
    
    const wing2 = new THREE.Mesh(wingGeometry, wingMaterial);
    wing2.position.set(0.03, 0, 0);
    flyGroup.add(wing2);
    
    // Posição inicial aleatória na borda da vila
    const side = Math.floor(Math.random() * 4);
    let x, z;
    
    if (side === 0) { x = -this.VILLAGE_SIZE; z = (Math.random() - 0.5) * this.VILLAGE_SIZE * 2; } // Esquerda
    else if (side === 1) { x = this.VILLAGE_SIZE; z = (Math.random() - 0.5) * this.VILLAGE_SIZE * 2; } // Direita
    else if (side === 2) { x = (Math.random() - 0.5) * this.VILLAGE_SIZE * 2; z = -this.VILLAGE_SIZE; } // Trás
    else { x = (Math.random() - 0.5) * this.VILLAGE_SIZE * 2; z = this.VILLAGE_SIZE; } // Frente
    
    flyGroup.position.set(x, 0.5 + Math.random() * 1.5, z);
    this.scene.add(flyGroup);
    
    // Velocidade errática
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 2
    );
    
    this.critters.push({
      mesh: flyGroup,
      type: 'fly',
      velocity,
      lifetime: 8 + Math.random() * 4, // 8-12 segundos
      maxLifetime: 12
    });
  }
  
  /**
   * Abelha - voa em linha reta com zigue-zague
   */
  private spawnBee() {
    const beeGroup = new THREE.Group();
    
    // Corpo (amarelo e preto)
    const bodyGeometry = new THREE.SphereGeometry(0.08, 6, 6);
    bodyGeometry.scale(1, 1.2, 1); // Alongar
    const bodyMaterial = new THREE.MeshToonMaterial({ color: 0xffd700 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    beeGroup.add(body);
    
    // Listras pretas
    const stripeGeometry = new THREE.BoxGeometry(0.16, 0.03, 0.16);
    const stripeMaterial = new THREE.MeshToonMaterial({ color: 0x000000 });
    
    const stripe1 = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe1.position.y = 0.03;
    beeGroup.add(stripe1);
    
    const stripe2 = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe2.position.y = -0.03;
    beeGroup.add(stripe2);
    
    // Asas
    const wingGeometry = new THREE.PlaneGeometry(0.12, 0.08);
    const wingMaterial = new THREE.MeshToonMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.4
    });
    
    const wing1 = new THREE.Mesh(wingGeometry, wingMaterial);
    wing1.position.set(-0.08, 0, 0);
    wing1.rotation.y = Math.PI / 6;
    beeGroup.add(wing1);
    
    const wing2 = new THREE.Mesh(wingGeometry, wingMaterial);
    wing2.position.set(0.08, 0, 0);
    wing2.rotation.y = -Math.PI / 6;
    beeGroup.add(wing2);
    
    // Posição e direção
    const startX = Math.random() < 0.5 ? -this.VILLAGE_SIZE : this.VILLAGE_SIZE;
    const z = (Math.random() - 0.5) * this.VILLAGE_SIZE * 1.5;
    
    beeGroup.position.set(startX, 1 + Math.random() * 0.5, z);
    this.scene.add(beeGroup);
    
    const velocity = new THREE.Vector3(
      startX < 0 ? 1.5 : -1.5, // Atravessa de um lado pro outro
      Math.sin(Math.random() * Math.PI) * 0.2,
      (Math.random() - 0.5) * 0.5
    );
    
    this.critters.push({
      mesh: beeGroup,
      type: 'bee',
      velocity,
      lifetime: 15, // Mais tempo para atravessar a vila maior
      maxLifetime: 15
    });
  }
  
  /**
   * Pássaro - voa alto atravessando
   */
  private spawnBird() {
    const birdGroup = new THREE.Group();
    
    // Corpo (marrom)
    const bodyGeometry = new THREE.SphereGeometry(0.12, 6, 6);
    bodyGeometry.scale(1, 1, 1.5); // Alongar
    const bodyMaterial = new THREE.MeshToonMaterial({ color: 0x8b6f47 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    birdGroup.add(body);
    
    // Asas (triângulos)
    const wingGeometry = new THREE.ConeGeometry(0.15, 0.3, 3);
    const wingMaterial = new THREE.MeshToonMaterial({ color: 0x5a4332 });
    
    const wing1 = new THREE.Mesh(wingGeometry, wingMaterial);
    wing1.rotation.z = Math.PI / 2;
    wing1.position.set(-0.12, 0, 0);
    birdGroup.add(wing1);
    
    const wing2 = new THREE.Mesh(wingGeometry, wingMaterial);
    wing2.rotation.z = -Math.PI / 2;
    wing2.position.set(0.12, 0, 0);
    birdGroup.add(wing2);
    
    // Posição alta
    const startX = Math.random() < 0.5 ? -this.VILLAGE_SIZE * 1.2 : this.VILLAGE_SIZE * 1.2;
    const z = (Math.random() - 0.5) * this.VILLAGE_SIZE * 2;
    
    birdGroup.position.set(startX, 4 + Math.random() * 2, z);
    this.scene.add(birdGroup);
    
    const velocity = new THREE.Vector3(
      startX < 0 ? 3 : -3, // Rápido
      Math.sin(Math.random() * Math.PI) * 0.3,
      (Math.random() - 0.5) * 0.8
    );
    
    this.critters.push({
      mesh: birdGroup,
      type: 'bird',
      velocity,
      lifetime: 12, // Mais tempo para atravessar
      maxLifetime: 12
    });
  }
  
  /**
   * Beija-flor - voa rápido com hover
   */
  private spawnHummingbird() {
    const hummingbirdGroup = new THREE.Group();
    
    // Corpo pequeno (verde iridescente)
    const bodyGeometry = new THREE.SphereGeometry(0.06, 6, 6);
    bodyGeometry.scale(1, 0.8, 1.5); // Alongar
    const bodyMaterial = new THREE.MeshToonMaterial({ color: 0x2ecc71 }); // Verde vibrante
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    hummingbirdGroup.add(body);
    
    // Bico fino (cone)
    const beakGeometry = new THREE.ConeGeometry(0.01, 0.08, 4);
    const beakMaterial = new THREE.MeshToonMaterial({ color: 0x000000 });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0, 0.1);
    hummingbirdGroup.add(beak);
    
    // Asas minúsculas (vibram muito rápido - representadas menores)
    const wingGeometry = new THREE.PlaneGeometry(0.08, 0.04);
    const wingMaterial = new THREE.MeshToonMaterial({ 
      color: 0x16a085,
      transparent: true,
      opacity: 0.6
    });
    
    const wing1 = new THREE.Mesh(wingGeometry, wingMaterial);
    wing1.position.set(-0.05, 0, 0);
    hummingbirdGroup.add(wing1);
    
    const wing2 = new THREE.Mesh(wingGeometry, wingMaterial);
    wing2.position.set(0.05, 0, 0);
    hummingbirdGroup.add(wing2);
    
    // Posição inicial
    const startX = Math.random() < 0.5 ? -this.VILLAGE_SIZE : this.VILLAGE_SIZE;
    const z = (Math.random() - 0.5) * this.VILLAGE_SIZE * 2;
    
    hummingbirdGroup.position.set(startX, 1.5 + Math.random() * 1, z);
    this.scene.add(hummingbirdGroup);
    
    const velocity = new THREE.Vector3(
      startX < 0 ? 2.5 : -2.5, // Rápido
      Math.sin(Math.random() * Math.PI) * 0.4,
      (Math.random() - 0.5) * 0.6
    );
    
    this.critters.push({
      mesh: hummingbirdGroup,
      type: 'hummingbird',
      velocity,
      lifetime: 10, // Mais tempo para atravessar
      maxLifetime: 10
    });
  }
  
  /**
   * Folha voando com o vento
   */
  private spawnLeaf() {
    const leafGroup = new THREE.Group();
    
    // Folha (plano alongado marrom/laranja)
    const leafGeometry = new THREE.PlaneGeometry(0.12, 0.18);
    const leafColors = [0xd4a574, 0xc49060, 0xe8b856, 0xc85a42]; // Tons de outono
    const color = leafColors[Math.floor(Math.random() * leafColors.length)];
    const leafMaterial = new THREE.MeshToonMaterial({ 
      color,
      side: THREE.DoubleSide
    });
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    leafGroup.add(leaf);
    
    // Posição inicial alta
    const x = (Math.random() - 0.5) * this.VILLAGE_SIZE * 2;
    const z = (Math.random() - 0.5) * this.VILLAGE_SIZE * 2;
    
    leafGroup.position.set(x, 3 + Math.random() * 2, z);
    this.scene.add(leafGroup);
    
    // Velocidade: cai devagar girando
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5, // Vento leve horizontal
      -0.3, // Cai devagar
      (Math.random() - 0.5) * 0.5
    );
    
    this.critters.push({
      mesh: leafGroup,
      type: 'leaf',
      velocity,
      lifetime: 15, // Mais tempo para cair na vila maior
      maxLifetime: 15
    });
  }
  
  /**
   * Formiga - anda devagar no chão
   */
  private spawnAnt() {
    const antGroup = new THREE.Group();
    
    // Corpo minúsculo (preto)
    const bodyGeometry = new THREE.SphereGeometry(0.03, 4, 4);
    bodyGeometry.scale(1, 0.8, 1.5);
    const bodyMaterial = new THREE.MeshToonMaterial({ color: 0x000000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.02;
    antGroup.add(body);
    
    // Cabeça
    const headGeometry = new THREE.SphereGeometry(0.02, 4, 4);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.02, 0.04);
    antGroup.add(head);
    
    // Posição aleatória na vila
    const x = (Math.random() - 0.5) * this.VILLAGE_SIZE * 1.5;
    const z = (Math.random() - 0.5) * this.VILLAGE_SIZE * 1.5;
    
    antGroup.position.set(x, 0, z);
    this.scene.add(antGroup);
    
    // Movimento lento e aleatório
    const angle = Math.random() * Math.PI * 2;
    const velocity = new THREE.Vector3(
      Math.cos(angle) * 0.3,
      0,
      Math.sin(angle) * 0.3
    );
    
    this.critters.push({
      mesh: antGroup,
      type: 'ant',
      velocity,
      lifetime: 5 + Math.random() * 3, // Some depois de 5-8 segundos
      maxLifetime: 8
    });
  }
  
  /**
   * Atualizar movimento de um critter
   */
  private updateCritterMovement(critter: Critter, delta: number) {
    const pos = critter.mesh.position;
    
    // Movimento específico por tipo
    switch (critter.type) {
      case 'fly':
        // Movimento errático (muda direção)
        if (Math.random() < delta * 2) { // Chance de mudar direção
          critter.velocity.x += (Math.random() - 0.5) * 0.5;
          critter.velocity.y += (Math.random() - 0.5) * 0.3;
          critter.velocity.z += (Math.random() - 0.5) * 0.5;
          
          // Limitar velocidade
          const speed = critter.velocity.length();
          if (speed > 2) {
            critter.velocity.normalize().multiplyScalar(2);
          }
        }
        break;
        
      case 'bee':
        // Zigue-zague sutil
        critter.velocity.y = Math.sin(critter.lifetime * 3) * 0.2;
        break;
        
      case 'bird':
        // Leve ondulação (batida de asas)
        critter.velocity.y = Math.sin(critter.lifetime * 4) * 0.3;
        
        // Animar asas (batendo)
        if (critter.mesh.children.length > 2) {
          const wing1 = critter.mesh.children[1];
          const wing2 = critter.mesh.children[2];
          const flapAngle = Math.sin(critter.lifetime * 10) * 0.3;
          wing1.rotation.z = Math.PI / 2 + flapAngle;
          wing2.rotation.z = -Math.PI / 2 - flapAngle;
        }
        break;
        
      case 'hummingbird':
        // Hover errático (beija-flor paira e muda direção)
        critter.velocity.y = Math.sin(critter.lifetime * 8) * 0.4; // Hover rápido
        
        // Asas vibram MUITO rápido
        if (critter.mesh.children.length >= 4) {
          const wing1 = critter.mesh.children[2];
          const wing2 = critter.mesh.children[3];
          const flapAngle = Math.sin(critter.lifetime * 30) * 0.2; // Vibração rápida
          wing1.rotation.y = flapAngle;
          wing2.rotation.y = -flapAngle;
        }
        
        // Muda direção horizontal às vezes
        if (Math.random() < delta * 1.5) {
          critter.velocity.x += (Math.random() - 0.5) * 0.8;
          critter.velocity.z += (Math.random() - 0.5) * 0.8;
        }
        break;
        
      case 'leaf':
        // Gira enquanto cai
        critter.mesh.rotation.x += delta * 2;
        critter.mesh.rotation.y += delta * 1.5;
        critter.mesh.rotation.z += delta * 0.5;
        
        // Vento ocasional (muda direção horizontal)
        if (Math.random() < delta * 2) {
          critter.velocity.x += (Math.random() - 0.5) * 0.3;
          critter.velocity.z += (Math.random() - 0.5) * 0.3;
        }
        
        // Para de cair quando chega no chão
        if (critter.mesh.position.y <= 0.1) {
          critter.velocity.y = 0;
          critter.lifetime = Math.min(critter.lifetime, 1); // Some em 1 segundo
          
          // Fade out
          critter.mesh.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
              (child.material as THREE.MeshToonMaterial).opacity = critter.lifetime;
              (child.material as THREE.MeshToonMaterial).transparent = true;
            }
          });
        }
        break;
        
      case 'ant':
        // Movimento retilíneo devagar
        // Fade out nos últimos 2 segundos
        if (critter.lifetime < 2) {
          critter.mesh.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
              (child.material as THREE.MeshToonMaterial).opacity = critter.lifetime / 2;
              (child.material as THREE.MeshToonMaterial).transparent = true;
            }
          });
        }
        break;
    }
    
    // Aplicar velocidade
    pos.x += critter.velocity.x * delta;
    pos.y += critter.velocity.y * delta;
    pos.z += critter.velocity.z * delta;
    
    // Manter altura mínima (chão) para critters terrestres
    if (critter.type === 'ant') {
      pos.y = Math.max(pos.y, 0);
    }
    
    // Remover se saiu muito longe da vila (aumentado para dar mais tempo de aparecer)
    const distFromCenter = Math.sqrt(pos.x ** 2 + pos.z ** 2);
    if (distFromCenter > this.VILLAGE_SIZE * 2) {
      critter.lifetime = 0; // Forçar remoção
    }
  }
  
  /**
   * Limpar todos os critters
   */
  public dispose() {
    this.critters.forEach(critter => {
      this.scene.remove(critter.mesh);
    });
    this.critters = [];
  }
}

