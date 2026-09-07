/**
 * EL MENÚ DE OPCIONES — una pregunta con respuestas, abajo y angosto.
 *
 * Nació adentro de `scenes/interiorScene.js` para que el armero pudiera
 * PREGUNTARTE en vez de soltarte una frase, y se sacó acá cuando el campamento
 * necesitó lo mismo para elegir con qué salís (`cajón` y `poste`).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POR QUÉ ES UN MÓDULO Y NO UNA ESCENA: no interrumpe lo que estás haciendo,
 * se apoya encima. Va abajo y ocupa poco para que **se siga viendo el mundo por
 * detrás** — seguís parado adentro de la armería, o al lado de tu fogata,
 * mientras elegís. Una pantalla aparte convertiría "revolver el cajón" en un
 * trámite de inventario, que es exactamente lo que este juego no quiere ser.
 *
 * MIENTRAS ESTÁ ABIERTO NO TE MOVÉS, y tampoco es una traba técnica: tenés las
 * dos manos ocupadas. Se corta con [ESC] o eligiendo la opción de salida, que
 * existe para que decir que no sea una respuesta y no un botón de cerrar.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * NO SABE QUÉ SIGNIFICAN LAS OPCIONES. Recibe una lista de `{ id, texto }` y
 * devuelve cuál elegiste; qué hacer con eso es de quien lo abrió. Por eso el
 * mismo menú sirve para comprar un caballo, cambiar de revólver o darle de
 * comer al animal, sin saber nada de ninguna de las tres cosas.
 */

export function crearMenu(audio) {
  let abierto = null;

  /**
   * @param titulo   la pregunta, arriba de todo ("¿Qué desea?")
   * @param opciones lista de `{ id, texto }`
   * @param alElegir se llama con el `id` elegido. Si devuelve `true`, el menú
   *                 queda ABIERTO — sirve para las opciones que cambian algo y
   *                 te dejan seguir eligiendo (cambiar de arma y ver la
   *                 siguiente sin tener que volver a abrir el cajón).
   */
  function abrir(titulo, opciones, alElegir) {
    if (!opciones || opciones.length === 0) return false;
    abierto = { titulo, opciones, sel: 0, alElegir };
    audio.play('cover');
    return true;
  }

  function cerrar() {
    abierto = null;
    audio.play('cover');
  }

  /** ¿Hay un menú abierto? Quien lo abrió lo usa para congelar su escena. */
  function activo() { return !!abierto; }

  /**
   * Devuelve `true` si el menú consumió el input de este cuadro. La escena que
   * lo hospeda tiene que cortar ahí y no procesar su propio movimiento.
   */
  function update(input) {
    if (!abierto) return false;

    const n = abierto.opciones.length;
    if (input.wasPressed('KeyW') || input.wasPressed('ArrowUp')) {
      abierto.sel = (abierto.sel - 1 + n) % n;
      audio.play('cock');
    }
    if (input.wasPressed('KeyS') || input.wasPressed('ArrowDown')) {
      abierto.sel = (abierto.sel + 1) % n;
      audio.play('cock');
    }
    if (input.wasPressed('KeyE') || input.wasPressed('Enter')) {
      const op = abierto.opciones[abierto.sel];
      const seguir = abierto.alElegir(op.id);
      // Si la acción pide seguir abierta, se refresca la lista por si los
      // textos cambiaron (el arma equipada ahora es otra).
      if (!seguir) abierto = null;
    }
    if (input.wasPressed('Escape')) cerrar();
    return true;
  }

  /** Cambia las opciones sin cerrar — para refrescar los textos tras elegir. */
  function refrescar(opciones) {
    if (!abierto) return;
    abierto.opciones = opciones;
    abierto.sel = Math.min(abierto.sel, opciones.length - 1);
  }

  function render(r, colors, ayuda) {
    if (!abierto) return;

    const opciones = abierto.opciones;
    const w = 184;
    const h = 22 + opciones.length * 13;
    const bx = Math.round(r.width / 2 - w / 2);
    const by = r.height - 18 - h;

    r.rect(bx, by, w, h, '#1a1410');
    r.rect(bx, by, w, 2, colors.intMadera);
    r.rect(bx, by + h - 2, w, 2, colors.intMaderaOsc);

    r.text(abierto.titulo, bx + 10, by + 11, colors.text, 'left');

    opciones.forEach((o, i) => {
      const oy = by + 26 + i * 13;
      const activa = i === abierto.sel;
      if (activa) r.rect(bx + 6, oy - 5, w - 12, 11, '#33261b');
      r.text(
        (activa ? '▸ ' : '  ') + o.texto,
        bx + 12, oy,
        activa ? colors.doorGlow : colors.textDim, 'left'
      );
    });

    r.text(ayuda, r.width / 2, r.height - 8, colors.textDim, 'center', { tam: 7 });
  }

  return { abrir, cerrar, activo, update, refrescar, render };
}
