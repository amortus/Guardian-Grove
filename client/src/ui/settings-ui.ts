/**
 * Painel de Configurações - Guardian Grove
 * Controle de áudio, gráficos e gameplay
 */

import type { GameState } from '../types';
import { GLASS_THEME } from './theme';
import { drawText, drawButton, isMouseOver, drawPanel } from './ui-helper';
import { audioManager } from '../systems/audio-manager';

export class SettingsUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private buttons: Map<string, { x: number; y: number; width: number; height: number; action?: () => void }> = new Map();
  private sliders: Map<string, { x: number; y: number; width: number; height: number; value: number }> = new Map();
  
  private isDraggingSlider: string | null = null;
  
  // Configurações
  private sfxVolume = 0.5;
  private musicVolume = 0.3;
  private isMuted = false;
  private graphicsQuality: 'low' | 'medium' | 'high' = 'high';
  private showFPS = false;
  private dayNightSpeed = 1;
  
  public onClose: (() => void) | null = null;
  public onApply: ((settings: SettingsData) => void) | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    
    // Carrega configurações do audioManager
    this.sfxVolume = audioManager.getSFXVolume();
    this.musicVolume = audioManager.getMusicVolume();
    this.isMuted = audioManager.isMutedState();
    
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
      this.mouseY = ((e.clientY - rect.top) / rect.height) * this.canvas.height;
      
      // Atualiza sliders ao arrastar
      if (this.isDraggingSlider) {
        this.updateSlider(this.isDraggingSlider);
      }
    });
    
    this.canvas.addEventListener('mousedown', () => {
      this.handleMouseDown();
    });
    
    this.canvas.addEventListener('mouseup', () => {
      this.isDraggingSlider = null;
    });
  }
  
  private handleMouseDown() {
    // Verifica se clicou em algum slider
    this.sliders.forEach((slider, id) => {
      if (isMouseOver(this.mouseX, this.mouseY, slider.x, slider.y, slider.width, slider.height)) {
        this.isDraggingSlider = id;
        this.updateSlider(id);
      }
    });
    
    // Verifica botões
    this.buttons.forEach((button) => {
      if (isMouseOver(this.mouseX, this.mouseY, button.x, button.y, button.width, button.height)) {
        if (button.action) {
          button.action();
        }
      }
    });
  }
  
  private updateSlider(id: string) {
    const slider = this.sliders.get(id);
    if (!slider) return;
    
    // Calcula valor baseado na posição do mouse
    const relativeX = Math.max(0, Math.min(slider.width, this.mouseX - slider.x));
    const value = relativeX / slider.width;
    
    // Atualiza valor do slider
    slider.value = value;
    
    // Aplica mudança
    if (id === 'sfx_volume') {
      this.sfxVolume = value;
      audioManager.setSFXVolume(value);
      audioManager.playClick(); // Toca som de teste
    } else if (id === 'music_volume') {
      this.musicVolume = value;
      audioManager.setMusicVolume(value);
    } else if (id === 'day_night_speed') {
      this.dayNightSpeed = value * 10; // 0-10x
    }
  }
  
  public draw(gameState: GameState) {
    this.buttons.clear();
    this.sliders.clear();
    
    // Fundo
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const panelWidth = Math.min(800, this.canvas.width - 100);
    const panelHeight = Math.min(700, this.canvas.height - 100);
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;
    
    // Painel principal
    drawPanel(this.ctx, panelX, panelY, panelWidth, panelHeight, { variant: 'dark' });
    
    // Header
    drawText(this.ctx, '⚙️ CONFIGURAÇÕES', panelX + panelWidth / 2, panelY + 50, {
      align: 'center',
      font: 'bold 36px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });
    
    // Botão fechar
    const closeBtnWidth = 120;
    const closeBtnHeight = 40;
    const closeBtnX = panelX + panelWidth - closeBtnWidth - 20;
    const closeBtnY = panelY + 20;
    const closeIsHovered = isMouseOver(this.mouseX, this.mouseY, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight);
    
    drawButton(this.ctx, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight, '✖ Fechar', {
      variant: 'danger',
      isHovered: closeIsHovered,
      fontSize: 16,
    });
    
    this.buttons.set('close', {
      x: closeBtnX,
      y: closeBtnY,
      width: closeBtnWidth,
      height: closeBtnHeight,
      action: () => this.onClose?.(),
    });
    
    let currentY = panelY + 100;
    
    // ===== SEÇÃO: ÁUDIO =====
    this.drawSection('🔊 ÁUDIO', panelX + 40, currentY);
    currentY += 50;
    
    // Botão Mute/Unmute
    const muteWidth = 150;
    const muteHeight = 40;
    const muteX = panelX + 40;
    const muteIsHovered = isMouseOver(this.mouseX, this.mouseY, muteX, currentY, muteWidth, muteHeight);
    
    drawButton(this.ctx, muteX, currentY, muteWidth, muteHeight, this.isMuted ? '🔇 Desmutar' : '🔊 Mutar', {
      variant: this.isMuted ? 'danger' : 'ghost',
      isHovered: muteIsHovered,
      fontSize: 16,
    });
    
    this.buttons.set('mute', {
      x: muteX,
      y: currentY,
      width: muteWidth,
      height: muteHeight,
      action: () => {
        this.isMuted = !this.isMuted;
        audioManager.toggleMute();
      },
    });
    
    currentY += 60;
    
    // Slider: Volume de Efeitos Sonoros
    this.drawSlider('sfx_volume', 'Volume de Efeitos (SFX)', this.sfxVolume, panelX + 40, currentY, panelWidth - 80);
    currentY += 80;
    
    // Slider: Volume de Música
    this.drawSlider('music_volume', 'Volume de Música', this.musicVolume, panelX + 40, currentY, panelWidth - 80);
    currentY += 100;
    
    // ===== SEÇÃO: GRÁFICOS =====
    this.drawSection('🎨 GRÁFICOS', panelX + 40, currentY);
    currentY += 50;
    
    // Qualidade Gráfica
    this.drawQualityButtons(panelX + 40, currentY, panelWidth - 80);
    currentY += 60;
    
    // Toggle: Mostrar FPS
    this.drawToggle('show_fps', 'Mostrar FPS', this.showFPS, panelX + 40, currentY);
    currentY += 80;
    
    // ===== SEÇÃO: GAMEPLAY =====
    this.drawSection('🎮 GAMEPLAY', panelX + 40, currentY);
    currentY += 50;
    
    // Slider: Velocidade Dia/Noite
    this.drawSlider('day_night_speed', 'Velocidade Ciclo Dia/Noite', this.dayNightSpeed / 10, panelX + 40, currentY, panelWidth - 80);
    currentY += 100;
    
    // Botão Aplicar
    const applyWidth = 200;
    const applyHeight = 50;
    const applyX = panelX + (panelWidth - applyWidth) / 2;
    const applyY = panelY + panelHeight - 80;
    const applyIsHovered = isMouseOver(this.mouseX, this.mouseY, applyX, applyY, applyWidth, applyHeight);
    
    drawButton(this.ctx, applyX, applyY, applyWidth, applyHeight, '✅ Aplicar', {
      variant: 'primary',
      isHovered: applyIsHovered,
      fontSize: 20,
    });
    
    this.buttons.set('apply', {
      x: applyX,
      y: applyY,
      width: applyWidth,
      height: applyHeight,
      action: () => this.applySettings(),
    });
  }
  
  private drawSection(title: string, x: number, y: number) {
    drawText(this.ctx, title, x, y, {
      font: 'bold 24px monospace',
      color: GLASS_THEME.palette.accent.green,
    });
    
    // Linha decorativa
    this.ctx.strokeStyle = 'rgba(109, 199, 164, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + 10);
    this.ctx.lineTo(x + 200, y + 10);
    this.ctx.stroke();
  }
  
  private drawSlider(id: string, label: string, value: number, x: number, y: number, width: number) {
    // Label
    drawText(this.ctx, label, x, y, {
      font: 'bold 16px monospace',
      color: 'rgba(220, 236, 230, 0.9)',
    });
    
    // Valor
    const percentage = Math.round(value * 100);
    drawText(this.ctx, `${percentage}%`, x + width, y, {
      align: 'right',
      font: 'bold 16px monospace',
      color: GLASS_THEME.palette.accent.amber,
    });
    
    const sliderY = y + 25;
    const sliderHeight = 20;
    
    // Fundo do slider
    this.ctx.fillStyle = 'rgba(42, 119, 96, 0.3)';
    this.ctx.fillRect(x, sliderY, width, sliderHeight);
    
    // Borda
    this.ctx.strokeStyle = GLASS_THEME.palette.accent.green;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, sliderY, width, sliderHeight);
    
    // Preenchimento
    const fillWidth = width * value;
    this.ctx.fillStyle = GLASS_THEME.palette.accent.green;
    this.ctx.fillRect(x, sliderY, fillWidth, sliderHeight);
    
    // Handle
    const handleX = x + fillWidth - 5;
    const handleY = sliderY - 5;
    const handleSize = 30;
    
    const isHovered = isMouseOver(this.mouseX, this.mouseY, handleX, handleY, handleSize, handleSize);
    
    this.ctx.fillStyle = isHovered ? GLASS_THEME.palette.accent.amber : '#FFFFFF';
    this.ctx.fillRect(handleX, handleY, handleSize, handleSize);
    
    this.ctx.strokeStyle = GLASS_THEME.palette.accent.green;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(handleX, handleY, handleSize, handleSize);
    
    // Registra slider
    this.sliders.set(id, {
      x,
      y: sliderY,
      width,
      height: sliderHeight,
      value,
    });
  }
  
  private drawQualityButtons(x: number, y: number, width: number) {
    drawText(this.ctx, 'Qualidade Gráfica:', x, y, {
      font: 'bold 16px monospace',
      color: 'rgba(220, 236, 230, 0.9)',
    });
    
    const qualities: Array<{ id: 'low' | 'medium' | 'high'; label: string }> = [
      { id: 'low', label: 'Baixa' },
      { id: 'medium', label: 'Média' },
      { id: 'high', label: 'Alta' },
    ];
    
    const btnWidth = 100;
    const gap = 10;
    const startX = x + 200;
    
    qualities.forEach((quality, index) => {
      const btnX = startX + index * (btnWidth + gap);
      const btnY = y - 10;
      const isActive = this.graphicsQuality === quality.id;
      const isHovered = isMouseOver(this.mouseX, this.mouseY, btnX, btnY, btnWidth, 40);
      
      drawButton(this.ctx, btnX, btnY, btnWidth, 40, quality.label, {
        variant: isActive ? 'primary' : 'ghost',
        isHovered: isHovered,
        fontSize: 14,
      });
      
      this.buttons.set(`quality_${quality.id}`, {
        x: btnX,
        y: btnY,
        width: btnWidth,
        height: 40,
        action: () => { this.graphicsQuality = quality.id; },
      });
    });
  }
  
  private drawToggle(id: string, label: string, value: boolean, x: number, y: number) {
    drawText(this.ctx, label, x, y, {
      font: 'bold 16px monospace',
      color: 'rgba(220, 236, 230, 0.9)',
    });
    
    const toggleX = x + 200;
    const toggleY = y - 15;
    const toggleWidth = 60;
    const toggleHeight = 30;
    
    const isHovered = isMouseOver(this.mouseX, this.mouseY, toggleX, toggleY, toggleWidth, toggleHeight);
    
    // Fundo do toggle
    this.ctx.fillStyle = value ? 'rgba(109, 199, 164, 0.8)' : 'rgba(42, 119, 96, 0.3)';
    this.ctx.fillRect(toggleX, toggleY, toggleWidth, toggleHeight);
    
    this.ctx.strokeStyle = value ? GLASS_THEME.palette.accent.green : 'rgba(109, 199, 164, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(toggleX, toggleY, toggleWidth, toggleHeight);
    
    // Handle
    const handleSize = 24;
    const handleX = value ? toggleX + toggleWidth - handleSize - 3 : toggleX + 3;
    const handleY = toggleY + 3;
    
    this.ctx.fillStyle = isHovered ? GLASS_THEME.palette.accent.amber : '#FFFFFF';
    this.ctx.fillRect(handleX, handleY, handleSize, handleSize);
    
    this.ctx.strokeStyle = GLASS_THEME.palette.accent.green;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(handleX, handleY, handleSize, handleSize);
    
    this.buttons.set(id, {
      x: toggleX,
      y: toggleY,
      width: toggleWidth,
      height: toggleHeight,
      action: () => {
        if (id === 'show_fps') {
          this.showFPS = !this.showFPS;
        }
      },
    });
  }
  
  private applySettings() {
    const settings: SettingsData = {
      sfxVolume: this.sfxVolume,
      musicVolume: this.musicVolume,
      isMuted: this.isMuted,
      graphicsQuality: this.graphicsQuality,
      showFPS: this.showFPS,
      dayNightSpeed: this.dayNightSpeed,
    };
    
    console.log('[SETTINGS] ⚙️ Configurações aplicadas:', settings);
    
    if (this.onApply) {
      this.onApply(settings);
    }
    
    audioManager.playSuccess();
    this.onClose?.();
  }
  
  public close() {
    // Cleanup
  }
}

export interface SettingsData {
  sfxVolume: number;
  musicVolume: number;
  isMuted: boolean;
  graphicsQuality: 'low' | 'medium' | 'high';
  showFPS: boolean;
  dayNightSpeed: number;
}

