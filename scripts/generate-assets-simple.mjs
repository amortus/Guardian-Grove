/**
 * Script simples para gerar assets placeholder sem dependências pesadas
 * Cria SVGs que são convertidos para PNG via navegador ou ferramenta externa
 *
 * Uso: node scripts/generate-assets-simple.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = `${__dirname}/../public/assets`;

// Garante que pasta existe
mkdirSync(ASSETS_DIR, { recursive: true });

/**
 * Gera SVG de ícone
 */
function generateIconSVG(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" />
  <rect x="4" y="4" width="${size - 8}" height="${size - 8}" fill="none" stroke="white" stroke-width="${size / 32}" />
  <text x="50%" y="50%" font-family="Arial" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">B</text>
</svg>`;
}

/**
 * Gera SVG do player
 */
function generatePlayerSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="24" height="24" fill="#48bb78" stroke="#2f855a" stroke-width="2" />
  <rect x="18" y="12" width="6" height="6" fill="black" />
</svg>`;
}

/**
 * Salva arquivos SVG
 */
function generateAll() {
  console.log('Generating SVG assets...\n');

  try {
    // Ícones
    writeFileSync(`${ASSETS_DIR}/icon-192.svg`, generateIconSVG(192));
    console.log('✓ Generated icon-192.svg');

    writeFileSync(`${ASSETS_DIR}/icon-512.svg`, generateIconSVG(512));
    console.log('✓ Generated icon-512.svg');

    // Player sprite
    writeFileSync(`${ASSETS_DIR}/player.svg`, generatePlayerSVG());
    console.log('✓ Generated player.svg');

    console.log('\n✓ SVG assets generated!');
    console.log(`Location: ${ASSETS_DIR}\n`);

    console.log('📝 Next steps:');
    console.log('1. Abra cada SVG no navegador');
    console.log('2. Tire screenshot ou use "Save as PNG"');
    console.log('3. Ou use ferramenta online: https://cloudconvert.com/svg-to-png\n');

    console.log('Alternativamente, instale canvas e rode:');
    console.log('  npm install canvas');
    console.log('  npm run generate-assets\n');
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
}

generateAll();

