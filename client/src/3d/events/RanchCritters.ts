/**
 * Ranch Critters - Eventos aleatórios de bichinhos
 * Mosquinhas, abelhas, pássaros, esquilos, formigas, etc.
 */

import * as THREE from 'three';

// Tipos de critters
type CritterType = 'fly' | 'bee' | 'bird' | 'ant' | 'hummingbird' | 'leaf' | 'rain';

interface Critter {
  mesh: THREE.Group;
  type: CritterType;
  velocity: THREE.Vector3;
  lifetime: number; // Tempo até desaparecer
  maxLifetime: number;
}

export class RanchCritters {
  private scene: THREE.Scene;
  private critters: Critter[] = [];
  private nextSpawnTime: number = 0;
  
  // Sistema separado para chuva
  private nextRainTime: number = 0;
  private isRaining: boolean = false;
  private rainDuration: number = 0;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.nextSpawnTime = this.getRandomSpawnDelay();
    this.nextRainTime = this.getRandomRainDelay(); // 10min-1h até primeira chuva
  }
  
  /**
   * Tempo aleatório até próximo spawn (5-15 segundos)
   */
  private getRandomSpawnDelay(): number {
    return 5 + Math.random() * 10;
  }
  
  /**
   * Tempo aleatório até próxima chuva (10min - 1h)
   */
  private getRandomRainDelay(): number {
    const minMinutes = 10;
    const maxMinutes = 60;
    const minutes = minMinutes + Math.random() * (maxMinutes - minMinutes);
    return minutes * 60; // Converter para segundos
  }
  
  /**
   * Update - spawnar e atualizar critters
   */
  public update(delta: number) {
    // Sistema de CHUVA separado (10min-1h de intervalo, 2min de duração)
    this.nextRainTime -= delta;
    
    if (!this.isRaining && this.nextRainTime <= 0) {
      // Iniciar chuva!
      this.spawnRain();
      this.isRaining = true;
      this.rainDuration = 120; // 2 minutos (120 segundos)
    }
    
    if (this.isRaining) {
      this.rainDuration -= delta;
      
      if (this.rainDuration <= 0) {
        // Parar chuva e agendar próxima
        this.isRaining = false;
        this.removeAllRain(); // Limpar todas as gotas
        this.nextRainTime = this.getRandomRainDelay(); // 10min-1h até próxima chuva
      }
    }
    
    // Countdown para próximo spawn (outros critters, SEM chuva)
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
   * Spawnar critter aleatório (SEM chuva - chuva tem sistema próprio)
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
   * Remover todas as gotas de chuva quando a chuva parar
   */
  private removeAllRain() {
    for (let i = this.critters.length - 1; i >= 0; i--) {
      if (this.critters[i].type === 'rain') {
        this.scene.remove(this.critters[i].mesh);
        this.critters.splice(i, 1);
      }
    }
  }
  
  /**
   * Mosquinha - voa erraticamente
   */
  private spawnFly() {
    const flyGroup = new THREE.Group();
    
    // Corpo minúsculo (esfera preta)
    const bodyGeometry = new THREE.SphereGeometry(0.04, 4, 4);
    const bodyMaterial = new THREE.MeshToonMaterial({ color: 0x000000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    flyGroup.add(body);
    
    // 2 asas (planos transparentes)
    const wingGeometry = new THREE.PlaneGeometry(0.06, 0.03);
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
    
    // Posição inicial aleatória na borda
    const side = Math.floor(Math.random() * 4);
    let x, z;
    
    if (side === 0) { x = -7; z = (Math.random() - 0.5) * 10; } // Esquerda
    else if (side === 1) { x = 7; z = (Math.random() - 0.5) * 10; } // Direita
    else if (side === 2) { x = (Math.random() - 0.5) * 10; z = -7; } // Trás
    else { x = (Math.random() - 0.5) * 10; z = 7; } // Frente
    
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
    const startX = Math.random() < 0.5 ? -7 : 7;
    const z = (Math.random() - 0.5) * 8;
    
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
      lifetime: 10,
      maxLifetime: 10
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
    const startX = Math.random() < 0.5 ? -8 : 8;
    const z = (Math.random() - 0.5) * 10;
    
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
      lifetime: 8,
      maxLifetime: 8
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
    const startX = Math.random() < 0.5 ? -7 : 7;
    const z = (Math.random() - 0.5) * 10;
    
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
      lifetime: 7,
      maxLifetime: 7
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
    const x = (Math.random() - 0.5) * 12;
    const z = (Math.random() - 0.5) * 12;
    
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
      lifetime: 12, // Tempo até chegar no chão
      maxLifetime: 12
    });
  }
  
  /**
   * Chuva - MUITAS gotas caindo por 20 segundos
   */
  private spawnRain() {
    // Spawnar MUITAS gotas de chuva densas
    const dropCount = 80 + Math.floor(Math.random() * 40); // 80-120 gotas!
    
    for (let i = 0; i < dropCount; i++) {
      const dropGroup = new THREE.Group();
      
      // Gota (cilindro fino e alongado)
      const dropGeometry = new THREE.CylinderGeometry(0.02, 0.015, 0.18, 4);
      const dropMaterial = new THREE.MeshToonMaterial({ 
        color: 0x87ceeb,
        transparent: true,
        opacity: 0.7
      });
      const drop = new THREE.Mesh(dropGeometry, dropMaterial);
      dropGroup.add(drop);
      
      // Posição inicial aleatória alta (escalonada no tempo)
      const x = (Math.random() - 0.5) * 18;
      const z = (Math.random() - 0.5) * 18;
      const startY = 8 + Math.random() * 6; // Mais variação de altura
      
      dropGroup.position.set(x, startY, z);
      this.scene.add(dropGroup);
      
      // Velocidade: cai rápido
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2, // Leve vento
        -7 - Math.random() * 2, // Cai rápido (7-9 u/s)
        0
      );
      
      this.critters.push({
        mesh: dropGroup,
        type: 'rain',
        velocity,
        lifetime: 999, // Lifetime muito alto (controlado por rainDuration)
        maxLifetime: 999
      });
    }
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
    
    // Posição aleatória no rancho
    const x = (Math.random() - 0.5) * 10;
    const z = (Math.random() - 0.5) * 10;
    
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
        
      case 'rain':
        // Cai reto e rápido
        // RESPAWN quando chega no chão (ciclo contínuo por 20s)
        if (critter.mesh.position.y <= 0.1) {
          // Respawnar no topo (efeito de chuva contínua)
          critter.mesh.position.y = 8 + Math.random() * 6;
          critter.mesh.position.x = (Math.random() - 0.5) * 18;
          critter.mesh.position.z = (Math.random() - 0.5) * 18;
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
    
    // Remover se saiu muito longe
    const distFromCenter = Math.sqrt(pos.x ** 2 + pos.z ** 2);
    if (distFromCenter > 12) {
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

