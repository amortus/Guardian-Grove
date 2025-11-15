/**
 * Sistema de Áudio - Guardian Grove
 * Gerencia música de fundo e efeitos sonoros
 */

export class AudioManager {
  private static instance: AudioManager;
  private backgroundMusic: HTMLAudioElement | null = null;
  private currentTrackIndex = 0;
  private sfxVolume = 0.5;
  private musicVolume = 0.5; // Começa em 50% (antes era 0.3)
  private isMuted = false;
  
  // Cache de sons
  private sounds: Map<string, HTMLAudioElement> = new Map();
  
  // Playlist de músicas de fundo
  private musicTracks = [
    '/assets/Music/Musica1.mp3',
    '/assets/Music/Musica2.mp3',
  ];
  
  private constructor() {
    // Carrega configurações do localStorage
    const savedVolume = localStorage.getItem('guardian_grove_volume');
    if (savedVolume) {
      const { sfx, music, muted } = JSON.parse(savedVolume);
      this.sfxVolume = sfx;
      this.musicVolume = music;
      this.isMuted = muted;
    }
  }
  
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }
  
  /**
   * Toca música de fundo (playlist aleatória)
   */
  public playBackgroundMusic(track: 'hub' | 'exploration' | 'minigame' = 'hub') {
    if (this.isMuted) return;
    
    // Para música atual se existir
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
    
    // Escolhe uma música aleatória da playlist
    this.currentTrackIndex = Math.floor(Math.random() * this.musicTracks.length);
    const selectedTrack = this.musicTracks[this.currentTrackIndex];
    
    console.log(`[AUDIO] 🎵 Tocando música: ${selectedTrack} (${track} mode)`);
    
    // Cria novo elemento de áudio
    this.backgroundMusic = new Audio(selectedTrack);
    this.backgroundMusic.volume = this.musicVolume;
    this.backgroundMusic.loop = false; // Não faz loop, troca de música ao final
    
    // Quando terminar, toca a próxima música
    this.backgroundMusic.addEventListener('ended', () => {
      this.playNextTrack();
    });
    
    // Toca a música
    this.backgroundMusic.play().catch(err => {
      console.warn('[AUDIO] ⚠️ Falha ao tocar música (user interaction needed):', err);
    });
  }
  
  /**
   * Toca a próxima música da playlist
   */
  private playNextTrack() {
    if (this.isMuted) return;
    
    // Avança para próxima música (circular)
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicTracks.length;
    const nextTrack = this.musicTracks[this.currentTrackIndex];
    
    console.log(`[AUDIO] 🎵 Próxima música: ${nextTrack}`);
    
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
    
    this.backgroundMusic = new Audio(nextTrack);
    this.backgroundMusic.volume = this.musicVolume;
    this.backgroundMusic.loop = false;
    
    this.backgroundMusic.addEventListener('ended', () => {
      this.playNextTrack();
    });
    
    this.backgroundMusic.play().catch(err => {
      console.warn('[AUDIO] ⚠️ Falha ao tocar próxima música:', err);
    });
  }
  
  /**
   * Para música de fundo
   */
  public stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }
  
  /**
   * Toca efeito sonoro
   */
  public playSFX(sound: SoundEffect) {
    if (this.isMuted) return;
    
    // Sons procedurais simples usando Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    gainNode.gain.setValueAtTime(this.sfxVolume * 0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);
    
    oscillator.frequency.setValueAtTime(sound.frequency, audioContext.currentTime);
    oscillator.type = sound.type;
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + sound.duration);
    
    console.log(`[AUDIO] 🔊 SFX: ${sound.name}`);
  }
  
  /**
   * Efeitos sonoros pré-definidos
   */
  public playClick() {
    this.playSFX({ name: 'click', frequency: 800, duration: 0.1, type: 'sine' });
  }
  
  public playSuccess() {
    this.playSFX({ name: 'success', frequency: 1200, duration: 0.3, type: 'sine' });
  }
  
  public playError() {
    this.playSFX({ name: 'error', frequency: 200, duration: 0.2, type: 'square' });
  }
  
  public playCardFlip() {
    this.playSFX({ name: 'card_flip', frequency: 600, duration: 0.15, type: 'triangle' });
  }
  
  public playMatch() {
    this.playSFX({ name: 'match', frequency: 1000, duration: 0.25, type: 'sine' });
  }
  
  public playAchievement() {
    // Som de conquista (arpejo ascendente)
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const startTime = audioContext.currentTime + (index * 0.1);
      gainNode.gain.setValueAtTime(this.sfxVolume * 0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      
      oscillator.frequency.setValueAtTime(freq, startTime);
      oscillator.type = 'sine';
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
    
    console.log('[AUDIO] 🏆 Achievement unlocked sound!');
  }
  
  public playQuestComplete() {
    this.playSFX({ name: 'quest_complete', frequency: 900, duration: 0.4, type: 'sine' });
  }
  
  /**
   * Controles de volume
   */
  public setSFXVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }
  
  public setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume;
    }
    this.saveSettings();
  }
  
  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.backgroundMusic) {
      this.backgroundMusic.pause();
    } else if (!this.isMuted && this.backgroundMusic) {
      this.backgroundMusic.play();
    }
    this.saveSettings();
  }
  
  public getSFXVolume(): number {
    return this.sfxVolume;
  }
  
  public getMusicVolume(): number {
    return this.musicVolume;
  }
  
  public isMutedState(): boolean {
    return this.isMuted;
  }
  
  private saveSettings() {
    localStorage.setItem('guardian_grove_volume', JSON.stringify({
      sfx: this.sfxVolume,
      music: this.musicVolume,
      muted: this.isMuted,
    }));
  }
}

interface SoundEffect {
  name: string;
  frequency: number;
  duration: number;
  type: OscillatorType;
}

// Singleton global
export const audioManager = AudioManager.getInstance();

