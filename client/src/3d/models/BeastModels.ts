/**
 * Beast 3D Models - Procedural Generation
 * Creates low-poly 3D models for all 10 beast lines
 */

import * as THREE from 'three';

export type BeastLine = 
  | 'olgrim' 
  | 'terravox' 
  | 'feralis' 
  | 'brontis' 
  | 'zephyra' 
  | 'ignar' 
  | 'mirella' 
  | 'umbrix' 
  | 'sylphid' 
  | 'raukor';

/**
 * Generate a 3D model for a specific beast line
 */
export function generateBeastModel(line: BeastLine): THREE.Group {
  switch (line) {
    case 'olgrim':
      return createOlgrim();
    case 'terravox':
      return createTerravox();
    case 'feralis':
      return createFeralis();
    case 'brontis':
      return createBrontis();
    case 'zephyra':
      return createZephyra();
    case 'ignar':
      return createIgnar();
    case 'mirella':
      return createMirella();
    case 'umbrix':
      return createUmbrix();
    case 'sylphid':
      return createSylphid();
    case 'raukor':
      return createRaukor();
    default:
      return createPlaceholder();
  }
}

/**
 * Olgrim - Olho flutuante com tentáculos
 * Inteligente mas frágil
 */
function createOlgrim(): THREE.Group {
  const group = new THREE.Group();
  
  // Main eye body (sphere)
  const eyeGeometry = new THREE.SphereGeometry(1, 16, 16);
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x9f7aea, // Purple
    roughness: 0.4,
    metalness: 0.2,
  });
  const eyeMesh = new THREE.Mesh(eyeGeometry, eyeMaterial);
  eyeMesh.position.y = 1.5;
  group.add(eyeMesh);
  
  // Pupil (darker sphere, slightly protruding)
  const pupilGeometry = new THREE.SphereGeometry(0.4, 12, 12);
  const pupilMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d3748,
    emissive: 0x5a32a3,
    emissiveIntensity: 0.3,
  });
  const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  pupil.position.set(0, 1.5, 1);
  group.add(pupil);
  
  // Tentacles (6 tentacles hanging down)
  const tentacleCount = 6;
  for (let i = 0; i < tentacleCount; i++) {
    const angle = (i / tentacleCount) * Math.PI * 2;
    const tentacle = createTentacle();
    tentacle.position.set(
      Math.cos(angle) * 0.8,
      1.2,
      Math.sin(angle) * 0.8
    );
    tentacle.rotation.z = angle;
    group.add(tentacle);
  }
  
  return group;
}

/**
 * Helper: Create a single tentacle
 */
function createTentacle(): THREE.Group {
  const tentacleGroup = new THREE.Group();
  const segments = 4;
  
  for (let i = 0; i < segments; i++) {
    const radius = 0.15 - (i * 0.02); // Tapering
    const segmentGeometry = new THREE.CylinderGeometry(radius, radius * 0.8, 0.3, 8);
    const segmentMaterial = new THREE.MeshStandardMaterial({
      color: 0x7c5cad,
      roughness: 0.6,
    });
    const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
    segment.position.y = -i * 0.25;
    tentacleGroup.add(segment);
  }
  
  return tentacleGroup;
}

/**
 * Terravox - Golem de pedra
 * Lento mas extremamente resistente
 */
function createTerravox(): THREE.Group {
  const group = new THREE.Group();
  
  // Body (large blocky torso)
  const bodyGeometry = new THREE.BoxGeometry(1.2, 1.5, 0.8);
  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b7355,
    roughness: 0.9,
    metalness: 0.1,
  });
  const body = new THREE.Mesh(bodyGeometry, stoneMaterial);
  body.position.y = 1.2;
  group.add(body);
  
  // Head (smaller box on top)
  const headGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.6);
  const head = new THREE.Mesh(headGeometry, stoneMaterial);
  head.position.y = 2.2;
  group.add(head);
  
  // Eyes (glowing crystals)
  const eyeGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.1);
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xfbbf24,
    emissiveIntensity: 0.8,
  });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.25, 2.2, 0.35);
  group.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.25, 2.2, 0.35);
  group.add(rightEye);
  
  // Arms (blocky)
  const armGeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
  
  const leftArm = new THREE.Mesh(armGeometry, stoneMaterial);
  leftArm.position.set(-0.8, 1.2, 0);
  group.add(leftArm);
  
  const rightArm = new THREE.Mesh(armGeometry, stoneMaterial);
  rightArm.position.set(0.8, 1.2, 0);
  group.add(rightArm);
  
  // Legs (thick columns)
  const legGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.8, 8);
  
  const leftLeg = new THREE.Mesh(legGeometry, stoneMaterial);
  leftLeg.position.set(-0.4, 0.4, 0);
  group.add(leftLeg);
  
  const rightLeg = new THREE.Mesh(legGeometry, stoneMaterial);
  rightLeg.position.set(0.4, 0.4, 0);
  group.add(rightLeg);
  
  return group;
}

/**
 * Feralis - Felino ágil
 * Focado em velocidade e precisão
 */
function createFeralis(): THREE.Group {
  const group = new THREE.Group();
  
  const catMaterial = new THREE.MeshStandardMaterial({
    color: 0x48bb78, // Green
    roughness: 0.5,
    metalness: 0.1,
  });
  
  // Body (elongated ellipsoid)
  const bodyGeometry = new THREE.SphereGeometry(0.6, 12, 12);
  bodyGeometry.scale(1.5, 1, 1); // Stretch to make elongated
  const body = new THREE.Mesh(bodyGeometry, catMaterial);
  body.position.set(0, 0.8, 0);
  body.rotation.z = Math.PI / 2;
  group.add(body);
  
  // Head (smaller sphere)
  const headGeometry = new THREE.SphereGeometry(0.4, 12, 12);
  const head = new THREE.Mesh(headGeometry, catMaterial);
  head.position.set(0, 0.9, 0.8);
  group.add(head);
  
  // Ears (cones)
  const earGeometry = new THREE.ConeGeometry(0.15, 0.3, 6);
  
  const leftEar = new THREE.Mesh(earGeometry, catMaterial);
  leftEar.position.set(-0.25, 1.3, 0.8);
  group.add(leftEar);
  
  const rightEar = new THREE.Mesh(earGeometry, catMaterial);
  rightEar.position.set(0.25, 1.3, 0.8);
  group.add(rightEar);
  
  // Eyes (yellow)
  const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xfbbf24,
    emissiveIntensity: 0.5,
  });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.15, 1, 1);
  group.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.15, 1, 1);
  group.add(rightEye);
  
  // Tail (curved cylinders)
  const tailSegments = 5;
  for (let i = 0; i < tailSegments; i++) {
    const tailGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8);
    const tailSegment = new THREE.Mesh(tailGeometry, catMaterial);
    tailSegment.position.set(0, 0.8 + i * 0.1, -0.8 - i * 0.2);
    tailSegment.rotation.x = -Math.PI / 6;
    group.add(tailSegment);
  }
  
  // Legs (thin cylinders)
  const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
  
  const positions = [
    [-0.3, 0.3, 0.4],
    [0.3, 0.3, 0.4],
    [-0.3, 0.3, -0.4],
    [0.3, 0.3, -0.4],
  ];
  
  positions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeometry, catMaterial);
    leg.position.set(x, y, z);
    group.add(leg);
  });
  
  return group;
}

/**
 * Brontis - Réptil bípede robusto
 * Versátil e equilibrado
 */
function createBrontis(): THREE.Group {
  const group = new THREE.Group();
  
  const reptileMaterial = new THREE.MeshStandardMaterial({
    color: 0x38a169, // Dark green
    roughness: 0.6,
    metalness: 0.2,
  });
  
  // Body (upright ellipsoid)
  const bodyGeometry = new THREE.SphereGeometry(0.7, 12, 12);
  bodyGeometry.scale(1, 1.3, 0.8);
  const body = new THREE.Mesh(bodyGeometry, reptileMaterial);
  body.position.y = 1.3;
  group.add(body);
  
  // Head (protruding forward)
  const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.7);
  const head = new THREE.Mesh(headGeometry, reptileMaterial);
  head.position.set(0, 1.8, 0.5);
  group.add(head);
  
  // Eyes (red)
  const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    emissive: 0xff4444,
    emissiveIntensity: 0.4,
  });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.15, 1.9, 0.85);
  group.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.15, 1.9, 0.85);
  group.add(rightEye);
  
  // Arms (small, T-Rex style)
  const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
  
  const leftArm = new THREE.Mesh(armGeometry, reptileMaterial);
  leftArm.position.set(-0.5, 1.5, 0.2);
  leftArm.rotation.z = Math.PI / 4;
  group.add(leftArm);
  
  const rightArm = new THREE.Mesh(armGeometry, reptileMaterial);
  rightArm.position.set(0.5, 1.5, 0.2);
  rightArm.rotation.z = -Math.PI / 4;
  group.add(rightArm);
  
  // Legs (thick, bipedal)
  const legGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.9, 8);
  
  const leftLeg = new THREE.Mesh(legGeometry, reptileMaterial);
  leftLeg.position.set(-0.3, 0.45, 0);
  group.add(leftLeg);
  
  const rightLeg = new THREE.Mesh(legGeometry, reptileMaterial);
  rightLeg.position.set(0.3, 0.45, 0);
  group.add(rightLeg);
  
  // Tail (thick at base, tapering)
  const tailGeometry = new THREE.ConeGeometry(0.3, 1.2, 8);
  const tail = new THREE.Mesh(tailGeometry, reptileMaterial);
  tail.position.set(0, 1, -0.8);
  tail.rotation.x = Math.PI / 2;
  group.add(tail);
  
  return group;
}

/**
 * Zephyra - Ave veloz
 * Especialista em esquiva
 */
function createZephyra(): THREE.Group {
  const group = new THREE.Group();
  
  const birdMaterial = new THREE.MeshStandardMaterial({
    color: 0x63b3ed, // Sky blue
    roughness: 0.4,
    metalness: 0.3,
  });
  
  // Body (egg shape)
  const bodyGeometry = new THREE.SphereGeometry(0.5, 12, 12);
  bodyGeometry.scale(1, 1.3, 0.8);
  const body = new THREE.Mesh(bodyGeometry, birdMaterial);
  body.position.y = 1.2;
  group.add(body);
  
  // Head (smaller sphere with beak)
  const headGeometry = new THREE.SphereGeometry(0.3, 12, 12);
  const head = new THREE.Mesh(headGeometry, birdMaterial);
  head.position.set(0, 1.8, 0.4);
  group.add(head);
  
  // Beak (cone)
  const beakGeometry = new THREE.ConeGeometry(0.1, 0.3, 6);
  const beakMaterial = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.5,
  });
  const beak = new THREE.Mesh(beakGeometry, beakMaterial);
  beak.position.set(0, 1.8, 0.65);
  beak.rotation.x = Math.PI / 2;
  group.add(beak);
  
  // Eyes (black)
  const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
  });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.15, 1.9, 0.5);
  group.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.15, 1.9, 0.5);
  group.add(rightEye);
  
  // Wings (flat ellipsoids)
  const wingGeometry = new THREE.SphereGeometry(0.8, 12, 12);
  wingGeometry.scale(0.1, 0.5, 1.2);
  
  const leftWing = new THREE.Mesh(wingGeometry, birdMaterial);
  leftWing.position.set(-0.7, 1.2, 0);
  leftWing.rotation.z = -Math.PI / 6;
  group.add(leftWing);
  
  const rightWing = new THREE.Mesh(wingGeometry, birdMaterial);
  rightWing.position.set(0.7, 1.2, 0);
  rightWing.rotation.z = Math.PI / 6;
  group.add(rightWing);
  
  // Legs (thin)
  const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
  
  const leftLeg = new THREE.Mesh(legGeometry, beakMaterial);
  leftLeg.position.set(-0.15, 0.6, 0);
  group.add(leftLeg);
  
  const rightLeg = new THREE.Mesh(legGeometry, beakMaterial);
  rightLeg.position.set(0.15, 0.6, 0);
  group.add(rightLeg);
  
  // Tail feathers (flat triangles)
  const tailGeometry = new THREE.ConeGeometry(0.3, 0.8, 4);
  const tail = new THREE.Mesh(tailGeometry, birdMaterial);
  tail.position.set(0, 1.2, -0.7);
  tail.rotation.x = Math.PI / 2;
  group.add(tail);
  
  return group;
}

/**
 * Ignar - Fera elemental de fogo
 * Forte em poder bruto
 */
function createIgnar(): THREE.Group {
  const group = new THREE.Group();
  
  const fireMaterial = new THREE.MeshStandardMaterial({
    color: 0xfc8181, // Red-orange
    emissive: 0xff4400,
    emissiveIntensity: 0.5,
    roughness: 0.3,
  });
  
  // Body (muscular, angular)
  const bodyGeometry = new THREE.BoxGeometry(1, 1.2, 0.8);
  const body = new THREE.Mesh(bodyGeometry, fireMaterial);
  body.position.y = 1.1;
  group.add(body);
  
  // Head (angular, aggressive)
  const headGeometry = new THREE.BoxGeometry(0.7, 0.6, 0.6);
  const head = new THREE.Mesh(headGeometry, fireMaterial);
  head.position.set(0, 1.9, 0.3);
  group.add(head);
  
  // Horns (cones)
  const hornGeometry = new THREE.ConeGeometry(0.12, 0.5, 6);
  
  const leftHorn = new THREE.Mesh(hornGeometry, fireMaterial);
  leftHorn.position.set(-0.3, 2.4, 0.3);
  leftHorn.rotation.z = -Math.PI / 8;
  group.add(leftHorn);
  
  const rightHorn = new THREE.Mesh(hornGeometry, fireMaterial);
  rightHorn.position.set(0.3, 2.4, 0.3);
  rightHorn.rotation.z = Math.PI / 8;
  group.add(rightHorn);
  
  // Eyes (glowing yellow)
  const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    emissive: 0xffff00,
    emissiveIntensity: 1,
  });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.2, 1.95, 0.65);
  group.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.2, 1.95, 0.65);
  group.add(rightEye);
  
  // Arms (thick, powerful)
  const armGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8);
  
  const leftArm = new THREE.Mesh(armGeometry, fireMaterial);
  leftArm.position.set(-0.65, 1.1, 0);
  group.add(leftArm);
  
  const rightArm = new THREE.Mesh(armGeometry, fireMaterial);
  rightArm.position.set(0.65, 1.1, 0);
  group.add(rightArm);
  
  // Legs (strong stance)
  const legGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 8);
  
  const leftLeg = new THREE.Mesh(legGeometry, fireMaterial);
  leftLeg.position.set(-0.35, 0.4, 0);
  group.add(leftLeg);
  
  const rightLeg = new THREE.Mesh(legGeometry, fireMaterial);
  rightLeg.position.set(0.35, 0.4, 0);
  group.add(rightLeg);
  
  // Flame mane (spiky geometry on back)
  for (let i = 0; i < 5; i++) {
    const flameGeometry = new THREE.ConeGeometry(0.15, 0.5, 6);
    const flame = new THREE.Mesh(flameGeometry, fireMaterial);
    flame.position.set((i - 2) * 0.2, 1.7, -0.4);
    flame.rotation.x = -Math.PI / 6;
    group.add(flame);
  }
  
  return group;
}

/**
 * Mirella - Criatura anfíbia
 * Equilibrada com afinidade aquática
 */
function createMirella(): THREE.Group {
  const group = new THREE.Group();
  
  const amphibianMaterial = new THREE.MeshStandardMaterial({
    color: 0x4299e1, // Light blue
    roughness: 0.3,
    metalness: 0.4,
  });
  
  // Body (rounded, frog-like)
  const bodyGeometry = new THREE.SphereGeometry(0.7, 12, 12);
  bodyGeometry.scale(1.2, 0.9, 1);
  const body = new THREE.Mesh(bodyGeometry, amphibianMaterial);
  body.position.y = 0.9;
  group.add(body);
  
  // Head (merged with body, frog-style)
  const headGeometry = new THREE.SphereGeometry(0.5, 12, 12);
  headGeometry.scale(1, 0.8, 1);
  const head = new THREE.Mesh(headGeometry, amphibianMaterial);
  head.position.set(0, 1.3, 0.5);
  group.add(head);
  
  // Eyes (large, protruding)
  const eyeBaseGeometry = new THREE.SphereGeometry(0.25, 12, 12);
  const eyeBaseMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
  });
  
  const leftEyeBase = new THREE.Mesh(eyeBaseGeometry, eyeBaseMaterial);
  leftEyeBase.position.set(-0.3, 1.6, 0.6);
  group.add(leftEyeBase);
  
  const rightEyeBase = new THREE.Mesh(eyeBaseGeometry, eyeBaseMaterial);
  rightEyeBase.position.set(0.3, 1.6, 0.6);
  group.add(rightEyeBase);
  
  // Pupils (black)
  const pupilGeometry = new THREE.SphereGeometry(0.12, 8, 8);
  const pupilMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
  });
  
  const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  leftPupil.position.set(-0.3, 1.6, 0.82);
  group.add(leftPupil);
  
  const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  rightPupil.position.set(0.3, 1.6, 0.82);
  group.add(rightPupil);
  
  // Front legs (webbed, thin)
  const frontLegGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.5, 8);
  
  const leftFrontLeg = new THREE.Mesh(frontLegGeometry, amphibianMaterial);
  leftFrontLeg.position.set(-0.5, 0.5, 0.3);
  leftFrontLeg.rotation.z = Math.PI / 6;
  group.add(leftFrontLeg);
  
  const rightFrontLeg = new THREE.Mesh(frontLegGeometry, amphibianMaterial);
  rightFrontLeg.position.set(0.5, 0.5, 0.3);
  rightFrontLeg.rotation.z = -Math.PI / 6;
  group.add(rightFrontLeg);
  
  // Back legs (powerful, bent)
  const backLegGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.7, 8);
  
  const leftBackLeg = new THREE.Mesh(backLegGeometry, amphibianMaterial);
  leftBackLeg.position.set(-0.5, 0.5, -0.3);
  leftBackLeg.rotation.z = Math.PI / 4;
  group.add(leftBackLeg);
  
  const rightBackLeg = new THREE.Mesh(backLegGeometry, amphibianMaterial);
  rightBackLeg.position.set(0.5, 0.5, -0.3);
  rightBackLeg.rotation.z = -Math.PI / 4;
  group.add(rightBackLeg);
  
  return group;
}

/**
 * Umbrix - Besta das sombras
 * Astuta e traiçoeira
 */
function createUmbrix(): THREE.Group {
  const group = new THREE.Group();
  
  const shadowMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d3748, // Dark gray/black
    emissive: 0x4a0080,
    emissiveIntensity: 0.2,
    roughness: 0.7,
    metalness: 0.3,
  });
  
  // Body (sleek, predatory)
  const bodyGeometry = new THREE.SphereGeometry(0.6, 12, 12);
  bodyGeometry.scale(1.5, 0.9, 0.8);
  const body = new THREE.Mesh(bodyGeometry, shadowMaterial);
  body.position.set(0, 1, 0);
  body.rotation.z = Math.PI / 2;
  group.add(body);
  
  // Head (angular, mysterious)
  const headGeometry = new THREE.ConeGeometry(0.35, 0.6, 6);
  const head = new THREE.Mesh(headGeometry, shadowMaterial);
  head.position.set(0, 1.1, 0.8);
  head.rotation.x = Math.PI / 2;
  group.add(head);
  
  // Eyes (glowing purple)
  const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    emissive: 0xa855f7,
    emissiveIntensity: 1,
  });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.15, 1.2, 1.05);
  group.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.15, 1.2, 1.05);
  group.add(rightEye);
  
  // Shadowy tendrils (wispy, ethereal)
  const tendrilCount = 8;
  for (let i = 0; i < tendrilCount; i++) {
    const angle = (i / tendrilCount) * Math.PI * 2;
    const tendrilGeometry = new THREE.CylinderGeometry(0.05, 0.02, 0.8, 6);
    const tendril = new THREE.Mesh(tendrilGeometry, shadowMaterial);
    
    const radius = 0.6;
    tendril.position.set(
      Math.cos(angle) * radius,
      0.8,
      Math.sin(angle) * radius
    );
    tendril.rotation.z = angle;
    tendril.rotation.x = Math.PI / 4;
    group.add(tendril);
  }
  
  // Legs (four, spider-like)
  const legGeometry = new THREE.CylinderGeometry(0.08, 0.06, 0.7, 8);
  
  const positions = [
    [-0.4, 0.35, 0.3],
    [0.4, 0.35, 0.3],
    [-0.4, 0.35, -0.3],
    [0.4, 0.35, -0.3],
  ];
  
  positions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeometry, shadowMaterial);
    leg.position.set(x, y, z);
    leg.rotation.z = x < 0 ? Math.PI / 6 : -Math.PI / 6;
    group.add(leg);
  });
  
  return group;
}

/**
 * Sylphid - Espírito etéreo
 * Frágil mas com alto poder mágico
 */
function createSylphid(): THREE.Group {
  const group = new THREE.Group();
  
  const spiritMaterial = new THREE.MeshStandardMaterial({
    color: 0xfbbf24, // Golden
    emissive: 0xfbbf24,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.5,
    transparent: true,
    opacity: 0.9,
  });
  
  // Core (glowing orb)
  const coreGeometry = new THREE.SphereGeometry(0.4, 16, 16);
  const core = new THREE.Mesh(coreGeometry, spiritMaterial);
  core.position.y = 1.5;
  group.add(core);
  
  // Outer shell (wireframe sphere)
  const shellGeometry = new THREE.IcosahedronGeometry(0.7, 1);
  const shellMaterial = new THREE.MeshStandardMaterial({
    color: 0xfde68a,
    emissive: 0xfde68a,
    emissiveIntensity: 0.3,
    wireframe: true,
    transparent: true,
    opacity: 0.5,
  });
  const shell = new THREE.Mesh(shellGeometry, shellMaterial);
  shell.position.y = 1.5;
  group.add(shell);
  
  // Ethereal wisps (floating ribbons)
  const wispCount = 6;
  for (let i = 0; i < wispCount; i++) {
    const angle = (i / wispCount) * Math.PI * 2;
    const wispGeometry = new THREE.PlaneGeometry(0.15, 0.8);
    const wispMaterial = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      emissive: 0xfde68a,
      emissiveIntensity: 0.4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const wisp = new THREE.Mesh(wispGeometry, wispMaterial);
    
    const radius = 0.9;
    wisp.position.set(
      Math.cos(angle) * radius,
      1.5 + Math.sin(i) * 0.3,
      Math.sin(angle) * radius
    );
    wisp.lookAt(0, 1.5, 0);
    group.add(wisp);
  }
  
  // Energy particles (small orbiting spheres)
  const particleCount = 12;
  for (let i = 0; i < particleCount; i++) {
    const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const particle = new THREE.Mesh(particleGeometry, spiritMaterial);
    
    const angle = (i / particleCount) * Math.PI * 2;
    const radius = 1.2;
    const height = Math.sin(i * 2) * 0.5;
    
    particle.position.set(
      Math.cos(angle) * radius,
      1.5 + height,
      Math.sin(angle) * radius
    );
    group.add(particle);
  }
  
  return group;
}

/**
 * Raukor - Fera lupina
 * Focada em lealdade e ataques críticos
 */
function createRaukor(): THREE.Group {
  const group = new THREE.Group();
  
  const wolfMaterial = new THREE.MeshStandardMaterial({
    color: 0xa0aec0, // Silver-gray
    roughness: 0.6,
    metalness: 0.2,
  });
  
  // Body (muscular, wolf-like)
  const bodyGeometry = new THREE.SphereGeometry(0.7, 12, 12);
  bodyGeometry.scale(1.4, 1, 0.9);
  const body = new THREE.Mesh(bodyGeometry, wolfMaterial);
  body.position.set(0, 1, 0);
  body.rotation.z = Math.PI / 2;
  group.add(body);
  
  // Head (elongated snout)
  const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.8);
  const head = new THREE.Mesh(headGeometry, wolfMaterial);
  head.position.set(0, 1.1, 0.9);
  group.add(head);
  
  // Snout (protruding)
  const snoutGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.4);
  const snout = new THREE.Mesh(snoutGeometry, wolfMaterial);
  snout.position.set(0, 1, 1.35);
  group.add(snout);
  
  // Ears (triangular)
  const earGeometry = new THREE.ConeGeometry(0.15, 0.4, 4);
  
  const leftEar = new THREE.Mesh(earGeometry, wolfMaterial);
  leftEar.position.set(-0.2, 1.5, 0.8);
  leftEar.rotation.z = -Math.PI / 8;
  group.add(leftEar);
  
  const rightEar = new THREE.Mesh(earGeometry, wolfMaterial);
  rightEar.position.set(0.2, 1.5, 0.8);
  rightEar.rotation.z = Math.PI / 8;
  group.add(rightEar);
  
  // Eyes (ice blue)
  const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x63b3ed,
    emissive: 0x63b3ed,
    emissiveIntensity: 0.6,
  });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.15, 1.2, 1.25);
  group.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.15, 1.2, 1.25);
  group.add(rightEye);
  
  // Legs (four strong legs)
  const legGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.8, 8);
  
  const positions = [
    [-0.4, 0.4, 0.4],
    [0.4, 0.4, 0.4],
    [-0.4, 0.4, -0.4],
    [0.4, 0.4, -0.4],
  ];
  
  positions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeometry, wolfMaterial);
    leg.position.set(x, y, z);
    group.add(leg);
  });
  
  // Tail (bushy)
  const tailSegments = 4;
  for (let i = 0; i < tailSegments; i++) {
    const tailGeometry = new THREE.CylinderGeometry(
      0.12 - i * 0.02,
      0.12 - i * 0.02,
      0.25,
      8
    );
    const tailSegment = new THREE.Mesh(tailGeometry, wolfMaterial);
    tailSegment.position.set(0, 1 + i * 0.15, -1 - i * 0.2);
    tailSegment.rotation.x = -Math.PI / 6;
    group.add(tailSegment);
  }
  
  return group;
}

/**
 * Placeholder for unknown beasts
 */
function createPlaceholder(): THREE.Group {
  const group = new THREE.Group();
  
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    roughness: 0.5,
  });
  
  const cube = new THREE.Mesh(geometry, material);
  cube.position.y = 1;
  group.add(cube);
  
  return group;
}

