/**
 * Sistema de input unificado (teclado + mouse + touch)
 * Expõe eixos normalizados e estado de botões
 */

export interface InputState {
  // Teclado
  keys: Set<string>;

  // Pointer (mouse ou touch)
  pointer: {
    x: number;
    y: number;
    down: boolean;
    justPressed: boolean;
    justReleased: boolean;
  };

  // Eixos combinados [-1, 1]
  axisX(): number;
  axisY(): number;

  // Cleanup
  cleanup(): void;
}

/**
 * Cria o sistema de input
 */
export function createInput(canvas: HTMLCanvasElement): InputState {
  const keys = new Set<string>();
  const pointer = {
    x: 0,
    y: 0,
    down: false,
    justPressed: false,
    justReleased: false,
  };

  // Virtual joystick para mobile (touch no lado esquerdo da tela)
  let touchStartPos = { x: 0, y: 0 };
  let virtualStick = { x: 0, y: 0 };
  const stickDeadzone = 0.1;
  const stickRadius = 80;

  // === Teclado ===
  const onKeyDown = (e: KeyboardEvent) => {
    keys.add(e.code);
    // Previne scroll com setas
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    keys.delete(e.code);
  };

  // === Pointer (unifica mouse e touch) ===
  const updatePointerPosition = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * canvas.width;
    pointer.y = ((clientY - rect.top) / rect.height) * canvas.height;
  };

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    updatePointerPosition(e.clientX, e.clientY);

    if (!pointer.down) {
      pointer.justPressed = true;
    }
    pointer.down = true;

    // Virtual stick: toque no lado esquerdo ativa joystick
    if (pointer.x < canvas.width / 2) {
      touchStartPos = { x: pointer.x, y: pointer.y };
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    e.preventDefault();
    updatePointerPosition(e.clientX, e.clientY);

    // Atualiza virtual stick
    if (pointer.down && pointer.x < canvas.width / 2) {
      const dx = pointer.x - touchStartPos.x;
      const dy = pointer.y - touchStartPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > stickDeadzone) {
        const normalized = Math.min(dist / stickRadius, 1);
        virtualStick.x = (dx / dist) * normalized;
        virtualStick.y = (dy / dist) * normalized;
      } else {
        virtualStick.x = 0;
        virtualStick.y = 0;
      }
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    e.preventDefault();
    if (pointer.down) {
      pointer.justReleased = true;
    }
    pointer.down = false;

    // Reset virtual stick
    virtualStick = { x: 0, y: 0 };
  };

  // Attach listeners
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  // Previne context menu em mobile
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  return {
    keys,
    pointer,

    /**
     * Retorna eixo X combinado: teclado + virtual stick
     */
    axisX(): number {
      let axis = 0;

      // Teclado
      if (keys.has('KeyA') || keys.has('ArrowLeft')) axis -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) axis += 1;

      // Virtual stick (prioridade se ativo)
      if (Math.abs(virtualStick.x) > stickDeadzone) {
        axis = virtualStick.x;
      }

      return axis;
    },

    /**
     * Retorna eixo Y combinado: teclado + virtual stick
     */
    axisY(): number {
      let axis = 0;

      // Teclado
      if (keys.has('KeyW') || keys.has('ArrowUp')) axis -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) axis += 1;

      // Virtual stick (prioridade se ativo)
      if (Math.abs(virtualStick.y) > stickDeadzone) {
        axis = virtualStick.y;
      }

      return axis;
    },

    cleanup() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    },
  };
}

/**
 * Reseta flags "just pressed/released" (chamar após processar input)
 */
export function resetInputFlags(input: InputState) {
  input.pointer.justPressed = false;
  input.pointer.justReleased = false;
}

