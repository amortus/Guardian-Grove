/**
 * Game loop com timestep fixo e acumulação
 * Garante física determinística independente do FPS
 */

export interface PerfInfo {
  fps: number;
  avgFrameTime: number;
  steps: number;
}

export interface GameLoop {
  start(): void;
  stop(): void;
  getPerf(): PerfInfo;
}

/**
 * Cria um game loop com timestep fixo
 * @param targetFps - FPS alvo (ex: 60)
 * @param onUpdate - Callback chamado a cada step lógico com dt fixo
 * @param onRender - Callback chamado a cada frame visual
 */
export function createLoop(
  targetFps: number,
  onUpdate: (dt: number) => void,
  onRender: (alpha: number) => void
): GameLoop {
  const targetDt = 1 / targetFps;
  let accumulator = 0;
  let lastTime = 0;
  let running = false;
  let rafId = 0;

  // Performance tracking
  let frameCount = 0;
  let fpsTime = 0;
  let currentFps = targetFps;
  let frameTimeSum = 0;
  let stepsPerFrame = 0;

  function tick(time: number) {
    if (!running) return;

    // Delta time em segundos
    const dt = lastTime === 0 ? targetDt : Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    // Acumula tempo
    accumulator += dt;

    // Update com timestep fixo
    let steps = 0;
    while (accumulator >= targetDt && steps < 5) {
      // Limite de 5 steps para evitar spiral of death
      onUpdate(targetDt);
      accumulator -= targetDt;
      steps++;
    }

    stepsPerFrame = steps;

    // Render com interpolação
    const alpha = accumulator / targetDt;
    onRender(alpha);

    // Performance tracking
    frameCount++;
    frameTimeSum += dt;
    fpsTime += dt;

    if (fpsTime >= 1.0) {
      currentFps = frameCount;
      frameCount = 0;
      fpsTime = 0;
    }

    rafId = requestAnimationFrame(tick);
  }

  return {
    start() {
      if (running) return;
      running = true;
      lastTime = 0;
      accumulator = 0;
      rafId = requestAnimationFrame(tick);
    },

    stop() {
      running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    },

    getPerf(): PerfInfo {
      return {
        fps: currentFps,
        avgFrameTime: frameTimeSum / Math.max(frameCount, 1),
        steps: stepsPerFrame,
      };
    },
  };
}

