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
    let delta = Math.min((now - lastTime) / 1000, 0.25);
    lastTime = now;
    // 🔁 Si el cuadro de la pantalla duró casi justo un paso (o dos, o tres), cuenta como ese número justo. Los cuadros de
    // un monitor de 60 Hz no llegan exactos (16,5 ms uno, 16,8 el otro): sin esto, cuando la cuenta quedaba en el borde,
    // un cuadro no avanzaba nada y el siguiente avanzaba dos, y lo que anda despacio iba a los tirones *(Santi: "se
    // sigue viendo esos tirones", la carreta)*. Lo que sobra o falta se pierde: es menos de un milisegundo.
    const justos = Math.round(delta / fixedStep);
    if (justos >= 1 && Math.abs(delta - justos * fixedStep) < 0.002) delta = justos * fixedStep;
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
      // (medio paso de entrada: la cuenta queda lejos del borde entre avanzar uno o ninguno)
      accumulator = fixedStep / 2;
      frameId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(frameId);
    },
  };
}
