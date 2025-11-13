/**
 * Lógica do jogo: estado, física, colisão AABB
 */

import type { Vec2 } from './math';
import type { InputState } from './input';
import { normalize } from './math';

export interface Player {
  pos: Vec2;
  vel: Vec2;
  speed: number;
  flip: boolean;
  box: { w: number; h: number };
  xp: number;
  items: Array<{ id: string; qty: number }>;
}

export interface Solid {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface World {
  player: Player;
  solids: Solid[];
  time: number;
  debug: boolean;
}

/**
 * Cria o mundo inicial
 */
export function createWorld(): World {
  return {
    player: {
      pos: { x: 400, y: 300 },
      vel: { x: 0, y: 0 },
      speed: 200, // pixels por segundo
      flip: false,
      box: { w: 32, h: 32 },
      xp: 0,
      items: [],
    },

    // Obstáculos de exemplo
    solids: [
      { x: 100, y: 100, w: 64, h: 64 },
      { x: 300, y: 200, w: 128, h: 32 },
      { x: 600, y: 350, w: 80, h: 80 },
      { x: 200, y: 450, w: 200, h: 40 },
    ],

    time: 0,
    debug: false,
  };
}

/**
 * Atualiza a lógica do jogo
 */
export function updateWorld(world: World, dt: number, input: InputState) {
  world.time += dt;
  updatePlayer(world, dt, input);

  // Toggle debug com tecla D
  if (input.keys.has('KeyP') && !world.debug) {
    world.debug = true;
  } else if (!input.keys.has('KeyP') && world.debug) {
    world.debug = false;
  }
}

/**
 * Atualiza o player (movimento + colisão)
 */
function updatePlayer(world: World, dt: number, input: InputState) {
  const { player } = world;

  // Input de movimento
  const axisX = input.axisX();
  const axisY = input.axisY();

  // Normaliza diagonal para evitar movimento mais rápido
  const inputVec = { x: axisX, y: axisY };
  const len = Math.sqrt(inputVec.x * inputVec.x + inputVec.y * inputVec.y);

  if (len > 0) {
    const normalized = normalize(inputVec);
    player.vel.x = normalized.x * player.speed;
    player.vel.y = normalized.y * player.speed;

    // Flip sprite baseado na direção
    if (normalized.x < 0) {
      player.flip = true;
    } else if (normalized.x > 0) {
      player.flip = false;
    }
  } else {
    player.vel.x = 0;
    player.vel.y = 0;
  }

  // Move com colisão AABB
  moveAndCollide(player, world.solids, dt);

  // Limite do canvas (opcional, ajuste conforme canvas size)
  const halfW = player.box.w / 2;
  const halfH = player.box.h / 2;
  player.pos.x = Math.max(halfW, Math.min(800 - halfW, player.pos.x));
  player.pos.y = Math.max(halfH, Math.min(600 - halfH, player.pos.y));
}

/**
 * Move o player e resolve colisões AABB
 */
function moveAndCollide(player: Player, solids: Solid[], dt: number) {
  // Move X
  player.pos.x += player.vel.x * dt;

  // Colisão X
  const playerBox = getPlayerAABB(player);
  for (const solid of solids) {
    if (aabbOverlap(playerBox, solid)) {
      // Resolve pelo eixo X
      const overlapLeft = playerBox.x + playerBox.w - solid.x;
      const overlapRight = solid.x + solid.w - playerBox.x;

      if (overlapLeft < overlapRight) {
        player.pos.x -= overlapLeft;
      } else {
        player.pos.x += overlapRight;
      }
    }
  }

  // Move Y
  player.pos.y += player.vel.y * dt;

  // Colisão Y
  const playerBoxY = getPlayerAABB(player);
  for (const solid of solids) {
    if (aabbOverlap(playerBoxY, solid)) {
      // Resolve pelo eixo Y
      const overlapTop = playerBoxY.y + playerBoxY.h - solid.y;
      const overlapBottom = solid.y + solid.h - playerBoxY.y;

      if (overlapTop < overlapBottom) {
        player.pos.y -= overlapTop;
      } else {
        player.pos.y += overlapBottom;
      }
    }
  }
}

/**
 * Retorna AABB do player
 */
function getPlayerAABB(player: Player): Solid {
  const halfW = player.box.w / 2;
  const halfH = player.box.h / 2;
  return {
    x: player.pos.x - halfW,
    y: player.pos.y - halfH,
    w: player.box.w,
    h: player.box.h,
  };
}

/**
 * Testa sobreposição entre dois AABBs
 */
function aabbOverlap(a: Solid, b: Solid): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * Serializa o estado do mundo para save
 */
export function serializeWorld(world: World): object {
  return {
    player: {
      pos: world.player.pos,
      xp: world.player.xp,
      items: world.player.items,
    },
    time: world.time,
  };
}

/**
 * Restaura o estado do mundo de um save
 */
export function deserializeWorld(world: World, data: any) {
  if (data.player) {
    if (data.player.pos) {
      world.player.pos = data.player.pos;
    }
    if (typeof data.player.xp === 'number') {
      world.player.xp = data.player.xp;
    }
    if (Array.isArray(data.player.items)) {
      world.player.items = data.player.items;
    }
  }
  if (typeof data.time === 'number') {
    world.time = data.time;
  }
}

