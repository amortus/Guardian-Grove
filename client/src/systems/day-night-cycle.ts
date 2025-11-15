/**
 * Sistema de Ciclo Dia/Noite - Guardian Grove
 * Controla iluminação e atmosfera baseado no horário
 */

import * as THREE from 'three';

export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';

export interface DayNightState {
  timeOfDay: TimeOfDay;
  hour: number; // 0-23
  progress: number; // 0-1 do período atual
  sunIntensity: number;
  ambientColor: THREE.Color;
  fogColor: THREE.Color;
  skyColor: THREE.Color;
}

export class DayNightCycle {
  private currentHour = 12; // Começa ao meio-dia
  private cycleSpeed = 1; // Minutos reais = 1 hora no jogo (ajustável)
  private lastUpdate = Date.now();
  
  // Configurações de iluminação por período
  private readonly timeConfigs = {
    dawn: {
      hours: [5, 7],
      sunIntensity: 0.4,
      ambientColor: new THREE.Color(0xFFB380),
      fogColor: new THREE.Color(0x8B7A8B),
      skyColor: new THREE.Color(0xFF9966),
    },
    morning: {
      hours: [7, 11],
      sunIntensity: 0.8,
      ambientColor: new THREE.Color(0xFFE4B5),
      fogColor: new THREE.Color(0xB8D4E8),
      skyColor: new THREE.Color(0x87CEEB),
    },
    noon: {
      hours: [11, 14],
      sunIntensity: 1.0,
      ambientColor: new THREE.Color(0xFFFFFF),
      fogColor: new THREE.Color(0xD4E8F0),
      skyColor: new THREE.Color(0x87CEEB),
    },
    afternoon: {
      hours: [14, 17],
      sunIntensity: 0.9,
      ambientColor: new THREE.Color(0xFFE8CC),
      fogColor: new THREE.Color(0xC8D8E8),
      skyColor: new THREE.Color(0x87CEEB),
    },
    dusk: {
      hours: [17, 20],
      sunIntensity: 0.3,
      ambientColor: new THREE.Color(0xFF9966),
      fogColor: new THREE.Color(0x8B6B8B),
      skyColor: new THREE.Color(0xFF6B4A),
    },
    night: {
      hours: [20, 5],
      sunIntensity: 0.1,
      ambientColor: new THREE.Color(0x4A5A8A),
      fogColor: new THREE.Color(0x1A1A2E),
      skyColor: new THREE.Color(0x0F1B3E),
    },
  };
  
  constructor(startHour = 12, cycleSpeed = 1) {
    this.currentHour = startHour;
    this.cycleSpeed = cycleSpeed;
  }
  
  /**
   * Atualiza o ciclo baseado no tempo real
   */
  public update(delta: number): DayNightState {
    const now = Date.now();
    const elapsed = (now - this.lastUpdate) / 1000; // segundos
    this.lastUpdate = now;
    
    // Avança o tempo (1 minuto real = cycleSpeed horas no jogo)
    this.currentHour += (elapsed / 60) * this.cycleSpeed;
    
    // Wrap around 24 horas
    if (this.currentHour >= 24) {
      this.currentHour -= 24;
    }
    
    return this.getCurrentState();
  }
  
  /**
   * Retorna o estado atual do ciclo
   */
  public getCurrentState(): DayNightState {
    const timeOfDay = this.getTimeOfDay();
    const config = this.timeConfigs[timeOfDay];
    const progress = this.getProgressInPeriod(timeOfDay);
    
    return {
      timeOfDay,
      hour: Math.floor(this.currentHour),
      progress,
      sunIntensity: config.sunIntensity,
      ambientColor: config.ambientColor.clone(),
      fogColor: config.fogColor.clone(),
      skyColor: config.skyColor.clone(),
    };
  }
  
  /**
   * Determina o período do dia
   */
  private getTimeOfDay(): TimeOfDay {
    const hour = this.currentHour;
    
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'dusk';
    return 'night';
  }
  
  /**
   * Calcula o progresso dentro do período atual (0-1)
   */
  private getProgressInPeriod(timeOfDay: TimeOfDay): number {
    const config = this.timeConfigs[timeOfDay];
    const [start, end] = config.hours;
    const hour = this.currentHour;
    
    // Caso especial para night (atravessa meia-noite)
    if (timeOfDay === 'night') {
      if (hour >= 20) {
        return (hour - 20) / (24 - 20);
      } else {
        return (hour + (24 - 20)) / (5 + (24 - 20));
      }
    }
    
    return (hour - start) / (end - start);
  }
  
  /**
   * Define o horário manualmente
   */
  public setTime(hour: number) {
    this.currentHour = Math.max(0, Math.min(23.99, hour));
  }
  
  /**
   * Define a velocidade do ciclo
   */
  public setCycleSpeed(speed: number) {
    this.cycleSpeed = Math.max(0.1, speed);
  }
  
  /**
   * Retorna se é noite (para acender lanternas)
   */
  public isNight(): boolean {
    return this.getTimeOfDay() === 'night' || this.getTimeOfDay() === 'dusk';
  }
  
  /**
   * Retorna formatação amigável do horário
   */
  public getFormattedTime(): string {
    const hour = Math.floor(this.currentHour);
    const minute = Math.floor((this.currentHour % 1) * 60);
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
}

/**
 * Aplica o estado do ciclo à cena Three.js
 */
export function applyDayNightToScene(
  scene: THREE.Scene,
  state: DayNightState,
  directionalLight?: THREE.DirectionalLight,
  ambientLight?: THREE.AmbientLight
) {
  // Atualiza fog
  if (scene.fog && scene.fog instanceof THREE.Fog) {
    scene.fog.color.copy(state.fogColor);
  }
  
  // Atualiza luzes
  if (directionalLight) {
    directionalLight.intensity = state.sunIntensity;
  }
  
  if (ambientLight) {
    ambientLight.color.copy(state.ambientColor);
    ambientLight.intensity = 0.5 + (state.sunIntensity * 0.3);
  }
}

