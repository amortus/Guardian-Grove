/**
 * Cria arquivos placeholder mínimos (1x1 PNG transparente)
 * Para permitir que o jogo rode sem erros 404
 *
 * Uso: node scripts/create-placeholder-assets.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = `${__dirname}/../public/assets`;

mkdirSync(ASSETS_DIR, { recursive: true });

// 1x1 PNG transparente em base64
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// 192x192 PNG colorido simples (base64)
const ICON_192 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAADNElEQVR4nO3bQU4UQRSG8e8hJN4BvIRX8ABewSt4Bo/gGTyDV/AK3sELGBMXLtyIxoQNC9eGmJBAMjPdVV1V71X9v6Qz3VXV9b6qqt6rpwEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwL/Ro9Hol5R+T+k1pV+Onw8/7vm5+fmN+X0AUvnR6uc05p8tH95Z3nzU7YHvz58DkMIP+vQupY0dX976+W7u9V8D0Mx3vrjz8Pb6+U/uLwGo7rt9Wj+8/u/39wAU913uf/nu/Ln5ewAq+Q7LXb/D79/vAVjcdzb/+LP5fQCz++4e9/4egAV9V88ffgfAfL6bx7t/B8ACvovH678DYFbfueN3AMzqO3f8DoBZfedoB5jVd/4OgPl855j/DwCz+s7fATCf7xqLX/P/AWA232HW/wLA7L5DtAMs5ju7+C/+CwCz+s4u/ou/ADCb7+Div/gvAMzqO/o8gPgNAPv7Dj4PIH4DwP6+g88DiN8AsL/v4PMA4jcA7O87+DyA+A0A+/sOPg8gfgPA/r6DzwOI3wCwv+/g8wDiNwDs7zv4PID4DQD7+w4+DyB+A8D+voPPA4jfALC/7+DzAOI3AOzvO/g8gPgNAPv7Dj4PIH4DwP6+g88DiN8AsL/v4PMA4jcA7O87+DyA+A0A+/sOPg8gfgPA/r6DzwOI3wCwv+/g8wDiNwDs7zv4PID4DQD7+w4+DyB+A8D+voPPA4jfALC/7+DzAOI3AOzvO/g8gPgNAPv7Dj4PIH4DwP6+g88DiN8AsL/v4PMA4jcA7O87+DyA+A0A+/sOPg8gfgPA/r6DzwOI3wCwv+/g8wDiNwDs7zv4PID4DQD7+w4+DyB+A8D+voPPA4jfALC/7+DzAOI3AOzvO/g8gPgNAPv7Dj4PIH4DwP6+g88DiN8AsL/v4PMA4jcA7O87+DyA+A0A+/sOPg8gfgPA/r6DzwOI3wCwv+/g8wDiNwDs7zv4PID4DQD7+w4+DyB+A8D+voPPA4jfALC/7+DzAOI3AOzvO/g8gPgNAPv7Dj4PIH4DwP6+g88DiN8AsL/v4PMA4jcA7O87+DyA+A0A+/sOPg8gfgPA/r6DzwOI3wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACw0m/vv4j/s7b9/QAAAABJRU5ErkJggg==',
  'base64'
);

// 512x512 (reutiliza o 192 - não é ideal mas serve)
const ICON_512 = ICON_192;

// 32x32 player sprite simples
const PLAYER_SPRITE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAlUlEQVR4nO2WQQqAIBBFZ+kupevErnQHb9JN6j5t26ZBEqJhHPkfNDD6eYqKAAAAAADg/2gBdUqpJaU0XymltvM8L865p5TaaK31fZumqff9bds2Sqm11hotBjhj5py7cs4d55xzxpjLvu+XlNK01jrv+34xxjxrrfW01jrGmCfnXJ9S6uq6vgIA+AEdYw4xxhwAAAAAAP7LB+CkVSWKLw6yAAAAAElFTkSuQmCC',
  'base64'
);

console.log('Creating placeholder assets...\n');

writeFileSync(`${ASSETS_DIR}/icon-192.png`, ICON_192);
console.log('✓ Created icon-192.png (placeholder)');

writeFileSync(`${ASSETS_DIR}/icon-512.png`, ICON_512);
console.log('✓ Created icon-512.png (placeholder)');

writeFileSync(`${ASSETS_DIR}/player.png`, PLAYER_SPRITE);
console.log('✓ Created player.png (placeholder)');

console.log('\n✓ Placeholder assets created!');
console.log(`Location: ${ASSETS_DIR}\n`);

console.log('⚠️ These are basic placeholders.');
console.log('For better graphics, run: npm run generate-assets\n');

