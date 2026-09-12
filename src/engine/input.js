/**
 * Entrada: teclado y mouse, normalizados.
 *
 * - isDown(code)     -> ¿la tecla está apretada ahora?
 * - wasPressed(code) -> ¿se apretó en este paso? (se consume una sola vez)
 * - mouse.x / mouse.y -> en píxeles del canvas INTERNO (0..384, 0..216),
 *   sin importar el tamaño real en pantalla.
 */

export function createInput(canvas) {
  const down = new Set();
  const pressed = new Set();
  // down = clic izquierdo (disparar), right = clic derecho (asomarse),
  // wheel = cuánto se movió la ruedita en este paso (degollar)
  const mouse = { x: 0, y: 0, down: false, right: false, pressed: false, wheel: 0 };

  window.addEventListener('keydown', (e) => {
    if (!down.has(e.code)) pressed.add(e.code);
    down.add(e.code);
    // Evita que la barra espaciadora y las flechas scrolleen la página.
    /**
     * `Tab` está en la lista por un motivo distinto al de las otras: las
     * flechas y el espacio hay que frenarlas para que no scrolleen la página.
     * Tab **mueve el foco** — apretarlo saca el foco del canvas y a partir de
     * ahí el juego deja de recibir teclas. Con la mochila colgada de Tab, eso
     * era un teclado muerto al primer uso.
     */
    if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => down.delete(e.code));

  /**
   * La ruedita del mouse.
   *
   * Se acumula durante el cuadro y se limpia al final, igual que las teclas
   * "recién apretadas". Así un golpe de ruedita dispara una acción y nada más:
   * no importa cuánto la muevas, es un gesto, no un eje.
   *
   * passive: false es lo que nos deja llamar a preventDefault(); sin eso el
   * navegador scrollea la página por debajo del juego.
   */
  window.addEventListener('wheel', (e) => {
    mouse.wheel += e.deltaY;
    e.preventDefault();
  }, { passive: false });

  // Si el navegador pierde el foco, soltamos todo (si no, quedan teclas "pegadas").
  window.addEventListener('blur', () => {
    down.clear();
    mouse.down = false;
    mouse.right = false;
    mouse.wheel = 0;
  });

  function updateMousePosition(e) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
  }

  window.addEventListener('mousemove', updateMousePosition);

  canvas.addEventListener('mousedown', (e) => {
    updateMousePosition(e);
    if (e.button === 0) { mouse.down = true; mouse.pressed = true; }
    if (e.button === 2) mouse.right = true;
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.right = false;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    mouse,
    isDown: (code) => down.has(code),
    wasPressed: (code) => pressed.has(code),

    /** Atajo: devuelve true si CUALQUIERA de las teclas está apretada. */
    anyDown: (...codes) => codes.some((c) => down.has(c)),

    /** ¿Se movió la ruedita en este paso? Alcanza con moverla apenas. */
    wheelMoved: () => mouse.wheel !== 0,

    /** Se llama al final de cada paso de update para limpiar los "recién apretado". */
    endFrame() {
      pressed.clear();
      mouse.pressed = false;
      mouse.wheel = 0;
    },
  };
}
