/**
 * Script para gerar assets placeholder (ícones e sprites)
 * Usa Node Canvas API para gerar PNGs
 *
 * Uso: node scripts/generate-assets.mjs
 * Requer: npm install canvas
 */

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = `${__dirname}/../public/assets`;

// Garante que pasta existe
mkdirSync(ASSETS_DIR, { recursive: true });

/**
 * Gera ícone PWA (quadrado colorido com letra)
 */
function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Borda
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = size / 32;
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, size - ctx.lineWidth, size - ctx.lineWidth);

  // Letra "B" de Guardian Grove
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B', size / 2, size / 2);

  // Salva
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(`${ASSETS_DIR}/${filename}`, buffer);
  console.log(`✓ Generated ${filename} (${size}x${size})`);
}

/**
 * Gera sprite do player (quadrado verde com "olho")
 */
function generatePlayerSprite() {
  const size = 32;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Transparente
  ctx.clearRect(0, 0, size, size);

  // Corpo (verde)
  ctx.fillStyle = '#48bb78';
  ctx.fillRect(4, 4, size - 8, size - 8);

  // Borda
  ctx.strokeStyle = '#2f855a';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, size - 8, size - 8);

  // "Olho" (indicador de direção)
  ctx.fillStyle = '#000';
  ctx.fillRect(18, 12, 6, 6);

  // Salva
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(`${ASSETS_DIR}/player.png`, buffer);
  console.log('✓ Generated player.png (32x32)');
}

/**
 * Gera todos os assets
 */
async function generateAll() {
  console.log('Generating assets...\n');

  try {
    generateIcon(192, 'icon-192.png');
    generateIcon(512, 'icon-512.png');
    generatePlayerSprite();

    console.log('\n✓ All assets generated successfully!');
    console.log(`Assets saved to: ${ASSETS_DIR}`);
  } catch (err) {
    console.error('Failed to generate assets:', err);
    console.error('\nTip: Install canvas with: npm install canvas');
    process.exit(1);
  }
}

generateAll();

