/**
 * OptionsMenuUI - Menu de Opções do Jogo
 * Menu principal de configurações acessível via botão ⚙️
 */

export class OptionsMenuUI {
  private canvas: HTMLCanvasElement;
  private isOpen: boolean = false;
  private mouseX: number = 0;
  private mouseY: number = 0;
  
  // Callbacks
  public onClose: (() => void) | null = null;
  public onOpenAudioSettings: (() => void) | null = null;
  public onOpenGameplaySettings: (() => void) | null = null;
  public onOpenVideoSettings: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
      this.mouseY = ((e.clientY - rect.top) / rect.height) * this.canvas.height;
    });
  }

  open(): void {
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
    if (this.onClose) {
      this.onClose();
    }
  }

  handleClick(x: number, y: number): boolean {
    if (!this.isOpen) return false;

    const panelX = this.canvas.width / 2 - 250;
    const panelY = this.canvas.height / 2 - 300;
    const panelWidth = 500;
    const panelHeight = 600;

    // Close button
    const closeX = panelX + panelWidth - 40;
    const closeY = panelY + 10;
    if (x >= closeX && x <= closeX + 30 && y >= closeY && y <= closeY + 30) {
      this.close();
      return true;
    }

    // Audio Settings button
    const audioX = panelX + 50;
    const audioY = panelY + 100;
    const btnWidth = 400;
    const btnHeight = 60;
    
    if (x >= audioX && x <= audioX + btnWidth && y >= audioY && y <= audioY + btnHeight) {
      if (this.onOpenAudioSettings) {
        this.onOpenAudioSettings();
      }
      return true;
    }

    // Gameplay Settings button (futuro)
    const gameplayY = panelY + 180;
    if (x >= audioX && x <= audioX + btnWidth && y >= gameplayY && y <= gameplayY + btnHeight) {
      if (this.onOpenGameplaySettings) {
        this.onOpenGameplaySettings();
      }
      return true;
    }

    // Video Settings button (futuro)
    const videoY = panelY + 260;
    if (x >= audioX && x <= audioX + btnWidth && y >= videoY && y <= videoY + btnHeight) {
      if (this.onOpenVideoSettings) {
        this.onOpenVideoSettings();
      }
      return true;
    }

    // Click inside panel but not on any control - consume event
    if (x >= panelX && x <= panelX + panelWidth &&
        y >= panelY && y <= panelY + panelHeight) {
      return true;
    }

    return false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isOpen) return;

    const panelX = this.canvas.width / 2 - 250;
    const panelY = this.canvas.height / 2 - 300;
    const panelWidth = 500;
    const panelHeight = 600;

    // Background overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Panel
    ctx.fillStyle = '#2a2a3e';
    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 3;
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚙️ Opções', panelX + panelWidth / 2, panelY + 50);

    // Close button
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(panelX + panelWidth - 40, panelY + 10, 30, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('✕', panelX + panelWidth - 25, panelY + 32);

    // Menu Options
    const btnX = panelX + 50;
    const btnWidth = 400;
    const btnHeight = 60;
    let btnY = panelY + 100;

    // 1. Audio Settings
    const isAudioHovered = this.mouseX >= btnX && this.mouseX <= btnX + btnWidth &&
                           this.mouseY >= btnY && this.mouseY <= btnY + btnHeight;
    
    this.drawMenuButton(ctx, btnX, btnY, btnWidth, btnHeight, '🎵 Configurações de Áudio', 
      'Volume, música e efeitos sonoros', isAudioHovered);
    
    btnY += 80;

    // 2. Gameplay Settings (futuro)
    const isGameplayHovered = this.mouseX >= btnX && this.mouseX <= btnX + btnWidth &&
                              this.mouseY >= btnY && this.mouseY <= btnY + btnHeight;
    
    this.drawMenuButton(ctx, btnX, btnY, btnWidth, btnHeight, '🎮 Configurações de Jogo', 
      'Dificuldade, tutoriais e interface', isGameplayHovered, true);
    
    btnY += 80;

    // 3. Video Settings (futuro)
    const isVideoHovered = this.mouseX >= btnX && this.mouseX <= btnX + btnWidth &&
                           this.mouseY >= btnY && this.mouseY <= btnY + btnHeight;
    
    this.drawMenuButton(ctx, btnX, btnY, btnWidth, btnHeight, '🖥️ Configurações de Vídeo', 
      'Gráficos e performance', isVideoHovered, true);
    
    btnY += 80;

    // 4. Controls (futuro)
    const isControlsHovered = this.mouseX >= btnX && this.mouseX <= btnX + btnWidth &&
                              this.mouseY >= btnY && this.mouseY <= btnY + btnHeight;
    
    this.drawMenuButton(ctx, btnX, btnY, btnWidth, btnHeight, '🕹️ Controles', 
      'Teclas de atalho e configurações', isControlsHovered, true);

    // Version info
    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Guardian Grove v1.2.0', panelX + panelWidth / 2, panelY + panelHeight - 20);
  }

  private drawMenuButton(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    description: string,
    isHovered: boolean,
    disabled: boolean = false
  ): void {
    // Background
    if (disabled) {
      ctx.fillStyle = '#3a3a4e';
    } else if (isHovered) {
      ctx.fillStyle = '#4a5a8e';
    } else {
      ctx.fillStyle = '#3a4a6e';
    }
    
    ctx.fillRect(x, y, width, height);
    
    // Border
    ctx.strokeStyle = isHovered && !disabled ? '#5a90e2' : '#4a4a6e';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Title
    ctx.fillStyle = disabled ? '#666666' : '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 15, y + 25);

    // Description
    ctx.fillStyle = disabled ? '#555555' : '#aaaaaa';
    ctx.font = '14px Arial';
    ctx.fillText(description, x + 15, y + 45);

    // "Em breve" tag se disabled
    if (disabled) {
      ctx.fillStyle = '#f39c12';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('EM BREVE', x + width - 15, y + 25);
    }
  }

  isShowing(): boolean {
    return this.isOpen;
  }
}

