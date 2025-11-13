/**
 * HUD minimalista (FPS, posição, XP)
 */

import type { World } from './world';
import type { PerfInfo } from './loop';

export interface UI {
  draw(world: World, perf: PerfInfo): void;
}

/**
 * Cria o sistema de UI
 */
export function createUI(ctx: CanvasRenderingContext2D): UI {
  return {
    draw(world: World, perf: PerfInfo) {
      const padding = 10;
      const lineHeight = 18;

      // Configuração de texto
      ctx.font = '14px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // Sombra para legibilidade
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Cor baseada no FPS
      const fpsColor = perf.fps >= 55 ? '#48bb78' : perf.fps >= 30 ? '#f6ad55' : '#fc8181';

      // Linha 1: FPS
      ctx.fillStyle = fpsColor;
      ctx.fillText(`FPS: ${perf.fps}`, padding, padding);

      // Linha 2: Posição
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(
        `Pos: (${Math.round(world.player.pos.x)}, ${Math.round(world.player.pos.y)})`,
        padding,
        padding + lineHeight
      );

      // Linha 3: XP
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`XP: ${world.player.xp}`, padding, padding + lineHeight * 2);

      // Linha 4: Tempo de jogo
      ctx.fillStyle = '#cbd5e0';
      ctx.fillText(`Time: ${world.time.toFixed(1)}s`, padding, padding + lineHeight * 3);

      // Reset sombra
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Debug info (canto inferior direito)
      if (world.debug) {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#00ff00';
        const debugX = ctx.canvas.width - padding;
        const debugY = ctx.canvas.height - padding - lineHeight * 2;

        ctx.fillText(`Debug Mode`, debugX, debugY);
        ctx.fillText(`Steps: ${perf.steps}`, debugX, debugY + lineHeight);
      }

      // Instruções (canto inferior)
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '12px monospace';
      ctx.fillText(
        'WASD/Arrows to move • P for debug',
        ctx.canvas.width / 2,
        ctx.canvas.height - padding
      );
    },
  };
}

