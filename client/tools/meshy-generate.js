import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import 'dotenv/config';

const API_BASE = 'https://api.meshy.ai/v1';
const API_KEY = process.env.MESHY_API_KEY;
if (!API_KEY) {
  throw new Error('Defina MESHY_API_KEY no arquivo .env (na pasta client).');
}

async function imageTo3D({ imagePath, prompt, category }) {
  const form = new FormData();
  form.append('image', fs.createReadStream(imagePath));
  form.append('prompt', prompt);
  if (category) {
    form.append('category', category);
  }

  const response = await fetch(`${API_BASE}/image-to-3d`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Meshy API error: ${response.status} ${await response.text()}`);
  }

  const { task_id } = await response.json();
  return task_id;
}

async function pollTask(taskId) {
  while (true) {
    const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    if (!response.ok) {
      throw new Error(`Falha ao consultar task ${taskId}: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();

    if (data.status === 'succeeded') {
      return data.result;
    }

    if (data.status === 'failed') {
      throw new Error(`Task ${taskId} falhou: ${data.error}`);
    }

    console.log(`[Meshy] Task ${taskId} em progresso (${data.status})...`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

async function downloadFile(url, outputPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao baixar arquivo: ${res.status} ${await res.text()}`);
  }
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
}

async function main() {
  const args = process.argv.slice(2);
  console.log('[Meshy] CLI args:', args);
  const params = Object.fromEntries(
    args
      .map((part) => part.split('='))
      .map(([key, value]) => [key.replace(/^--/, ''), value])
      .filter(([key]) => key.length > 0),
  );
  console.log('[Meshy] Params parsed:', params);

  const defaultImage = path.resolve('tools/references/beast-guardian.png');
  const imagePath = params.image ? path.resolve(params.image) : defaultImage;

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Imagem de referência não encontrada em ${imagePath}`);
  }

  const prompt =
    params.prompt ||
    'Cluster Guardian Beast - hybrid of wolf and dragon, majestic stance, metallic armor plates with glowing blue rune engravings, hand-painted textures, stylized for turn-based RPG battle, exudes protective aura.';

  const category = params.category || 'character';

  const taskId = await imageTo3D({
    imagePath,
    prompt,
    category,
  });

  console.log(`[Meshy] Task criada ${taskId}, aguardando processamento...`);
  const result = await pollTask(taskId);

  const glb = result.files?.find((file) => file.format === 'glb');
  if (!glb?.url) {
    throw new Error('Nenhum arquivo GLB retornado pela API.');
  }

  const outputPath = path.resolve('public/assets/3d/beasts/guardian-meshy.glb');
  await downloadFile(glb.url, outputPath);
  console.log(`[Meshy] Modelo salvo em ${outputPath}`);

  const textureZip = result.files?.find((file) => file.format === 'zip');
  if (textureZip?.url) {
    const zipPath = path.resolve('public/assets/3d/beasts/guardian-meshy-textures.zip');
    await downloadFile(textureZip.url, zipPath);
    console.log(`[Meshy] Texturas extras salvas em ${zipPath}`);
  }

  console.log('[Meshy] Processo concluído. Revise o modelo antes de integrar.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
