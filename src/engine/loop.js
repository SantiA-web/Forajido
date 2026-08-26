/**
 * Bucle principal con PASO FIJO (fixed timestep).
 *
 * La lógica del juego siempre avanza en pasos exactos de 1/60 de segundo,
 * sin importar a cuántos FPS vaya el monitor. Sin esto, el juego se movería
 * más rápido en una pantalla de 144Hz que en una de 60Hz.
 */

export function createLoop(update, render, fixedStep = 1 / 60) {
  let lastTime = 0;
  let accumulator = 0;
  let running = false;
  let frameId = 0;

  function frame(now) {
    if (!running) return;

    // Si la pestaña estuvo en segundo plano, dt puede ser enorme: lo capamos
    // para no simular 300 pasos de golpe.
    const delta = Math.min((now - lastTime) / 1000, 0.25);
    lastTime = now;
    accumulator += delta;

    let steps = 0;
    while (accumulator >= fixedStep && steps < 5) {
      update(fixedStep);
      accumulator -= fixedStep;
      steps++;
    }

    render();
    frameId = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      lastTime = performance.now();
      accumulator = 0;
      frameId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(frameId);
    },
  };
}
