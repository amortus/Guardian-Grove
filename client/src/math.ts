/**
 * Utilidades matemáticas para o jogo
 */

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Limita um valor entre min e max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Interpolação linear entre a e b
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Distância euclidiana entre dois pontos
 */
export function distance(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normaliza um vetor (retorna cópia normalizada)
 */
export function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/**
 * Cria um vetor 2D
 */
export function vec2(x = 0, y = 0): Vec2 {
  return { x, y };
}

/**
 * Copia um vetor
 */
export function copyVec2(v: Vec2): Vec2 {
  return { x: v.x, y: v.y };
}

/**
 * Define valores de um vetor (mutável para evitar alocações)
 */
export function setVec2(v: Vec2, x: number, y: number): Vec2 {
  v.x = x;
  v.y = y;
  return v;
}

/**
 * Adiciona dois vetores (retorna novo)
 */
export function addVec2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Multiplica vetor por escalar (retorna novo)
 */
export function scaleVec2(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

