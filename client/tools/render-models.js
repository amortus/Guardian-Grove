import fs from 'fs';
import path from 'path';
import express from 'express';
import puppeteer from 'puppeteer';

const ROOT = path.resolve('.');
const PUBLIC_DIR = path.join(ROOT, 'public');
const TOOLS_DIR = path.join(ROOT, 'tools');
const OUTPUT_DIR = path.join(TOOLS_DIR, 'renders');
const PORT = 4099;

const ANGLES = ['front', 'side', 'back', 'iso'];
const WIDTH = 1024;
const HEIGHT = 1024;

const MODEL_DIRECTORIES = ['assets/beasts', 'assets/3d/beasts'];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function listGlbModels() {
  const modelEntries = [];

  for (const relativeDir of MODEL_DIRECTORIES) {
    const absDir = path.join(PUBLIC_DIR, relativeDir);
    if (!fs.existsSync(absDir)) {
      continue;
    }

    const files = fs
      .readdirSync(absDir)
      .filter((file) => file.toLowerCase().endsWith('.glb'))
      .map((file) => ({
        name: path.parse(file).name,
        relativePath: `/${relativeDir}/${file}`.replace(/\\/g, '/'),
      }));

    modelEntries.push(...files);
  }

  return modelEntries;
}

async function startServer() {
  const app = express();
  app.use('/assets', express.static(path.join(PUBLIC_DIR, 'assets')));
  app.use('/tools', express.static(TOOLS_DIR));

  app.get('/render-viewer', (_req, res) => {
    res.sendFile(path.join(TOOLS_DIR, 'render-viewer.html'));
  });

  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`[Render] Server running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function captureModel(browser, model, angle) {
  const page = await browser.newPage();

  const outputFolder = path.join(OUTPUT_DIR, model.name);
  ensureDir(outputFolder);
  const outputFile = path.join(outputFolder, `${angle}.png`);

  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

  const dataPromise = new Promise((resolve, reject) => {
    page.exposeFunction('renderDone', (dataUrl) => {
      resolve(dataUrl);
    });
    page.exposeFunction('renderFailed', (message) => {
      reject(new Error(message));
    });
  });

  const url = `http://localhost:${PORT}/render-viewer?model=${encodeURIComponent(model.relativePath)}&angle=${angle}&w=${WIDTH}&h=${HEIGHT}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 0 });

  try {
    const dataUrl = await dataPromise;
    const base64 = dataUrl.split(',')[1];
    fs.writeFileSync(outputFile, Buffer.from(base64, 'base64'));
    console.log(`[Render] Saved ${outputFile}`);
  } finally {
    await page.close();
  }
}

async function main() {
  ensureDir(OUTPUT_DIR);

  const server = await startServer();
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  try {
    const models = listGlbModels();
    if (models.length === 0) {
      console.warn('[Render] No GLB files found. Populate public/assets/... with .glb models.');
      return;
    }

    for (const model of models) {
      for (const angle of ANGLES) {
        await captureModel(browser, model, angle);
      }
    }

    console.log('[Render] All captures complete!');
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error('[Render] Failed:', error);
  process.exit(1);
});
