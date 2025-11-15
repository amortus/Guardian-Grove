/**
 * Sistema de Efeitos Visuais - Guardian Grove
 * Partículas, Modo Foto, Títulos, Combos, Estatísticas
 */

import * as THREE from 'three';

// ===== SISTEMA DE PARTÍCULAS =====

export interface ParticleOptions {
  position: THREE.Vector3;
  color: THREE.Color;
  size: number;
  count: number;
  velocity: THREE.Vector3;
  lifetime: number;
  gravity?: number;
}

export class ParticleSystem {
  private particles: THREE.Points[] = [];
  private scene: THREE.Scene;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  /**
   * Cria um efeito de partículas
   */
  public createParticleEffect(options: ParticleOptions) {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const velocities: number[] = [];
    
    for (let i = 0; i < options.count; i++) {
      // Posição inicial com leve variação
      positions.push(
        options.position.x + (Math.random() - 0.5) * 0.5,
        options.position.y + (Math.random() - 0.5) * 0.5,
        options.position.z + (Math.random() - 0.5) * 0.5
      );
      
      // Velocidade aleatória
      velocities.push(
        options.velocity.x + (Math.random() - 0.5) * 2,
        options.velocity.y + Math.random() * 2,
        options.velocity.z + (Math.random() - 0.5) * 2
      );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
    
    const material = new THREE.PointsMaterial({
      color: options.color,
      size: options.size,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    });
    
    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    this.particles.push(points);
    
    // Remove após lifetime
    setTimeout(() => {
      this.scene.remove(points);
      geometry.dispose();
      material.dispose();
      this.particles = this.particles.filter(p => p !== points);
    }, options.lifetime);
  }
  
  /**
   * Efeito de conquista desbloqueada
   */
  public achievementUnlocked(position: THREE.Vector3) {
    this.createParticleEffect({
      position,
      color: new THREE.Color(0xFFD700),
      size: 0.3,
      count: 50,
      velocity: new THREE.Vector3(0, 2, 0),
      lifetime: 2000,
      gravity: -0.5,
    });
  }
  
  /**
   * Efeito de missão completa
   */
  public questComplete(position: THREE.Vector3) {
    this.createParticleEffect({
      position,
      color: new THREE.Color(0x6DC7A4),
      size: 0.25,
      count: 30,
      velocity: new THREE.Vector3(0, 1.5, 0),
      lifetime: 1500,
    });
  }
  
  /**
   * Efeito de recompensa coletada
   */
  public rewardCollected(position: THREE.Vector3) {
    this.createParticleEffect({
      position,
      color: new THREE.Color(0xFFC857),
      size: 0.2,
      count: 20,
      velocity: new THREE.Vector3(0, 3, 0),
      lifetime: 1000,
    });
  }
}

// ===== MODO FOTO =====

export class PhotoMode {
  private isActive = false;
  private onToggle?: (active: boolean) => void;
  
  public toggle(callback?: (active: boolean) => void) {
    this.isActive = !this.isActive;
    if (callback) callback(this.isActive);
    if (this.onToggle) this.onToggle(this.isActive);
    
    console.log(`[PHOTO MODE] ${this.isActive ? '📸 Ativado' : '❌ Desativado'}`);
  }
  
  public isPhotoModeActive(): boolean {
    return this.isActive;
  }
  
  public setCallback(callback: (active: boolean) => void) {
    this.onToggle = callback;
  }
}

// ===== SISTEMA DE TÍTULOS/BADGES =====

export interface PlayerTitle {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
}

export const PLAYER_TITLES: PlayerTitle[] = [
  { id: 'novice', name: 'Novato', description: 'Iniciante no Grove', icon: '🌱', rarity: 'common', unlocked: true },
  { id: 'explorer', name: 'Explorador', description: 'Complete 10 explorações', icon: '🗺️', rarity: 'common', unlocked: false },
  { id: 'scholar', name: 'Estudioso', description: 'Complete 20 missões educativas', icon: '📚', rarity: 'rare', unlocked: false },
  { id: 'crafter', name: 'Artesão', description: 'Crafte 50 itens', icon: '🔨', rarity: 'rare', unlocked: false },
  { id: 'sage', name: 'Sábio do Grove', description: 'Complete 50 missões', icon: '🎓', rarity: 'epic', unlocked: false },
  { id: 'guardian', name: 'Guardião Lendário', description: 'Alcance nível 50', icon: '👑', rarity: 'legendary', unlocked: false },
  { id: 'eco_warrior', name: 'Guerreiro Eco', description: 'Complete todas missões de sustentabilidade', icon: '♻️', rarity: 'epic', unlocked: false },
  { id: 'game_master', name: 'Mestre dos Jogos', description: 'Jogue 50 mini-games', icon: '🎮', rarity: 'epic', unlocked: false },
];

export function getTitleColor(rarity: PlayerTitle['rarity']): string {
  switch (rarity) {
    case 'common': return '#B7DDCD';
    case 'rare': return '#6DC7A4';
    case 'epic': return '#FFC857';
    case 'legendary': return '#FFD700';
  }
}

// ===== SISTEMA DE COMBO (Mini-Games) =====

export class ComboSystem {
  private currentCombo = 0;
  private maxCombo = 0;
  private lastActionTime = 0;
  private comboTimeout = 3000; // 3 segundos para manter combo
  
  public addCombo() {
    this.currentCombo++;
    if (this.currentCombo > this.maxCombo) {
      this.maxCombo = this.currentCombo;
    }
    this.lastActionTime = Date.now();
    
    console.log(`[COMBO] x${this.currentCombo}${this.currentCombo > 5 ? ' 🔥' : ''}`);
  }
  
  public breakCombo() {
    if (this.currentCombo > 0) {
      console.log(`[COMBO] Combo quebrado em x${this.currentCombo}`);
    }
    this.currentCombo = 0;
    this.lastActionTime = 0;
  }
  
  public update() {
    if (this.currentCombo > 0 && Date.now() - this.lastActionTime > this.comboTimeout) {
      this.breakCombo();
    }
  }
  
  public getCurrentCombo(): number {
    return this.currentCombo;
  }
  
  public getMaxCombo(): number {
    return this.maxCombo;
  }
  
  public getComboMultiplier(): number {
    if (this.currentCombo < 3) return 1;
    if (this.currentCombo < 5) return 1.25;
    if (this.currentCombo < 10) return 1.5;
    return 2.0;
  }
}

// ===== ESTATÍSTICAS DO PERFIL =====

export interface PlayerStats {
  // Geral
  level: number;
  totalPlayTime: number; // minutos
  daysPlayed: number;
  loginStreak: number;
  
  // Combate
  battlesWon: number;
  battlesLost: number;
  totalDamageDealt: number;
  
  // Exploração
  explorationsCompleted: number;
  missionsCompleted: number;
  achievementsUnlocked: number;
  
  // Economia
  totalCoronasEarned: number;
  totalCoronasSpent: number;
  itemsCrafted: number;
  itemsBought: number;
  
  // Mini-Games
  minigamesPlayed: number;
  memoryGamesWon: number;
  memoryBestTime: number;
  memoryBestMoves: number;
  
  // Social
  playersMetCount: number;
  chatMessagesSent: number;
  
  // Recordes
  highestCombo: number;
  fastestExploration: number;
  longestSession: number;
}

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  level: 1,
  totalPlayTime: 0,
  daysPlayed: 1,
  loginStreak: 1,
  battlesWon: 0,
  battlesLost: 0,
  totalDamageDealt: 0,
  explorationsCompleted: 0,
  missionsCompleted: 0,
  achievementsUnlocked: 0,
  totalCoronasEarned: 0,
  totalCoronasSpent: 0,
  itemsCrafted: 0,
  itemsBought: 0,
  minigamesPlayed: 0,
  memoryGamesWon: 0,
  memoryBestTime: 999,
  memoryBestMoves: 999,
  playersMetCount: 0,
  chatMessagesSent: 0,
  highestCombo: 0,
  fastestExploration: 999,
  longestSession: 0,
};

export function formatPlayTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

