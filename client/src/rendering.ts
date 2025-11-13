/**
 * Sistema de renderização com Canvas2D
 * Carrega sprites e desenha o mundo
 */

import type { World } from './world';

export interface Sprite {
  image: HTMLImageElement;
  width: number;
  height: number;
}

export interface Renderer {
  sprites: Map<string, Sprite>;
  draw(world: World): void;
}

/**
 * Carrega uma imagem e retorna Promise
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Cria o renderer Canvas2D
 */
export function createRenderer(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
): Renderer {
  const sprites = new Map<string, Sprite>();

  return {
    sprites,

    draw(world: World) {
      const { width, height } = canvas;

      // 1. Limpa o fundo
      ctx.fillStyle = '#0f1419';
      ctx.fillRect(0, 0, width, height);

      // 2. Desenha tiles/mapa (grid simples)
      drawMap(ctx, width, height);

      // 3. Desenha obstáculos
      ctx.fillStyle = '#2d3748';
      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 2;

      for (const solid of world.solids) {
        ctx.fillRect(solid.x, solid.y, solid.w, solid.h);
        ctx.strokeRect(solid.x, solid.y, solid.w, solid.h);
      }

      // 4. Desenha player
      drawPlayer(ctx, sprites, world);

      // 5. Debug: bounding box (opcional)
      if (world.debug) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        const { player } = world;
        const box = player.box;
        ctx.strokeRect(
          player.pos.x - box.w / 2,
          player.pos.y - box.h / 2,
          box.w,
          box.h
        );
      }
    },
  };
}

/**
 * Desenha o mapa (grid de fundo)
 */
function drawMap(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gridSize = 32;

  ctx.strokeStyle = '#1a202c';
  ctx.lineWidth = 1;

  // Linhas verticais
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Linhas horizontais
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

/**
 * Desenha o player (sprite ou placeholder)
 */
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  sprites: Map<string, Sprite>,
  world: World
) {
  const { player } = world;
  const sprite = sprites.get('player');

  ctx.save();
  ctx.translate(player.pos.x, player.pos.y);

  // Flip horizontal se movendo para esquerda
  if (player.flip) {
    ctx.scale(-1, 1);
  }

  if (sprite) {
    // Desenha sprite
    const sw = sprite.width;
    const sh = sprite.height;
    ctx.drawImage(sprite.image, -sw / 2, -sh / 2, sw, sh);
  } else {
    // Placeholder: retângulo colorido
    const { w, h } = player.box;
    ctx.fillStyle = '#48bb78';
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // "Olho" para indicar direção
    ctx.fillStyle = '#000';
    ctx.fillRect(w / 4 - 4, -4, 8, 8);
  }

  ctx.restore();

  // Nome/indicador
  ctx.fillStyle = '#fff';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`XP: ${player.xp}`, player.pos.x, player.pos.y - 30);
}

