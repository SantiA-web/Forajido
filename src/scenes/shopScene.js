/**
 * LA TIENDA — mirar la mercadería de cerca.
 *
 * Es la única escena del juego que se ve DESDE CERCA y DE PERFIL. Todo el
 * resto es una vista de arriba de un tipo que camina; acá el tipo se paró
 * frente al pesebre y está mirando al animal. Ese cambio de cámara es todo el
 * argumento de que esto sea una escena y no un cartel de texto: **un caballo
 * que ves de cerca se elige, uno que leés en una lista se calcula.**
 *
 * TRES REGLAS QUE LA DEFINEN:
 *
 * 1. **Una sola escena para las dos tiendas** (y para las que vengan). Lo que
 *    cambia entre la armería y el establo es contenido (`data/tienda.js`), no
 *    código — la misma regla por la que hay una sola escena de interiores y un
 *    solo tipo de vagón por plantilla.
 *
 * 2. **Siempre está el tuyo en la lista.** No se compara contra la nada: el
 *    Colt y el Criollo aparecen al lado de lo que se vende, marcados como
 *    tuyos, y cada barra lleva una rayita en donde está el tuyo hoy. La
 *    pregunta de la tienda no es "¿me sirve?", es "¿es mejor que el que
 *    tengo?", y esa se contesta mirando.
 *
 * 3. **Se maneja con el teclado**, como todo salvo el mapa. El mapa usa mouse
 *    porque ahí sos un tipo mirando un papel; acá seguís siendo un tipo
 *    parado en un establo.
 *
 * COMPRAR ES UN SOLO GESTO: parado frente al que querés, apretás `E`. Se
 * descuenta la plata y se equipa en el mismo paso — hoy no hay inventario de
 * "tengo dos y uso uno", así que comprar y usar son la misma acción. El día
 * que eso cambie, la costura está en `equipar(gameState, id)` de cada
 * entrada en `data/tienda.js`: la escena no sabe si es un arma o un animal.
 */

import { CONFIG } from '../data/config.js';
import { TIENDAS } from '../data/tienda.js';
import { gameState, numero } from '../state/gameState.js';
import { T } from '../text/es.js';

/**
 * El escenario ocupa la izquierda y la ficha la derecha. Los números son de la
 * pantalla vieja (384×216) estirados a la de hoy (ver `CONFIG.view`); lo de
 * adentro del escenario se mide desde su BORDE DE ABAJO (`h`), así el piso, el
 * corral y el paño bajan con él en vez de quedar flotando.
 */
const KX = CONFIG.view.width / CONFIG.vistaVieja.width;
const KY = CONFIG.view.height / CONFIG.vistaVieja.height;
const ESCENA = { x: 8, y: Math.round(26 * KY), w: Math.round(198 * KX), h: Math.round(150 * KY) };
const FICHA = { x: Math.round(216 * KX), y: Math.round(34 * KY), w: Math.round(158 * KX) };

/** Dónde está parado el animal, y dónde le tiran el pasto. */
const CORRAL = { cx: ESCENA.x + ESCENA.w / 2 - 8, suelo: ESCENA.y + ESCENA.h - 18 };

export function createShopScene(services) {
  const { input, scenes, hud, audio } = services;
  const colors = CONFIG.colors;

  let def, id, sel, scroll, volver, mensaje, items;

  /**
   * QUÉ HAY EN EL MOSTRADOR HOY.
   *
   * Un ítem con `desbloqueo` no se muestra hasta que la bandera correspondiente
   * esté puesta en `gameState.flags` — hoy lo usa el hacha, que llega con la
   * región del bosque (ver data/melee.js). Es una LLAVE, no una amputación: el
   * arma está entera y funcionando, sólo que el armero todavía no tiene de
   * dónde traerla. Mismo patrón que "Alta vigilancia" en data/train.js.
   *
   * Vale para cualquier catálogo, no sólo el acero: el día que haya un caballo
   * o un revólver que se desbloquee en algún lado, es agregar el campo.
   */
  function disponibles(d) {
    const flags = gameState.flags || {};
    return d.items.filter((itemId) => {
      const llave = d.catalogo[itemId] && d.catalogo[itemId].desbloqueo;
      return !llave || !!flags[llave];
    });
  }

  function enter(params = {}) {
    hud.hide();
    id = params.id || 'establo';
    def = TIENDAS[id];
    items = disponibles(def);
    sel = 0;
    scroll = 0;
    mensaje = null;

    /**
     * De dónde viniste, para devolverte AL MISMO PUNTO del local. Volver a
     * aparecer en la puerta después de mirar un caballo se siente a
     * teletransporte, igual que pasaba al volver del pueblo al campamento.
     */
    volver = { x: params.x, y: params.y };

    // Para depurar desde la consola: FORAJIDO.services.tienda
    services.tienda = {
      get id() { return id; },
      get items() { return items; },
      get sel() { return sel; },
      get item() { return items[sel]; },
      get datos() { return def.catalogo[items[sel]]; },
      get tuyo() { return def.tuyo(gameState); },
      get precio() { return def.precio(def.catalogo[items[sel]]); },
      get mensaje() { return mensaje ? mensaje.texto : null; },
    };
  }

  // ------------------------------------------------------------------ lógica

  function item(i) { return def.catalogo[items[i]]; }
  function esTuyo(i) { return items[i] === def.tuyo(gameState); }

  /** Lo compraste: entra a la lista de lo que TENÉS, aparte de equiparse. */
  function guardarEnInventario(itemId) {
    if (!def.ranura || !gameState.owned) return;
    const lista = gameState.owned[def.ranura];
    if (lista && !lista.includes(itemId)) lista.push(itemId);
  }

  function mover(paso) {
    sel = (sel + paso + items.length) % items.length;
    mensaje = null;   // el mensaje era sobre el artículo anterior
    audio.play('cover');
  }

  function salir() {
    audio.play('cover');
    scenes.goTo('interior', { id: def.interior, x: volver.x, y: volver.y });
  }

  function decir(texto, life = 2.2) { mensaje = { texto, life }; }

  /**
   * COMPRAR. Tres casos, y los tres se resuelven con un solo apretón de `E`:
   * ya es tuyo (no pasa nada, te lo dice), no te alcanza (te dice cuánto te
   * falta, no cobra nada), o te alcanza (cobra, equipa, listo).
   *
   * NO HAY PANTALLA DE CONFIRMACIÓN APARTE. Ya elegiste hablar con el
   * vendedor, elegiste "comprar" en su pregunta, y elegiste ESTE artículo con
   * `A`/`D` — para cuando llegás a apretar `E` acá, ya tomaste la decisión
   * tres veces. Pedir una cuarta sería desconfiar del jugador.
   */
  function comprar() {
    const datos = item(sel);
    if (esTuyo(sel)) { decir(T.tienda.yaEsTuyo); audio.play('cover'); return; }

    /**
     * 🐛 EL PRECIO SE VALIDA ANTES DE COMPARARLO.
     *
     * `gameState.money < precio` da **falso** cuando `precio` es `NaN`, o sea
     * que una compra con el precio roto no se frenaba: pasaba, restaba `NaN` y
     * te dejaba la partida en `$NaN` para siempre. Es una de las puertas por
     * las que podía entrar el bug del cartel del campamento.
     */
    const precio = numero(def.precio(datos), `el precio de "${sel}"`);
    if (gameState.money < precio) {
      decir(T.tienda.faltaPlata(precio - gameState.money));
      audio.play('hitWall');
      return;
    }

    gameState.money -= precio;

    /**
     * COMPRAR AHORA HACE DOS COSAS: lo guarda y te lo pone.
     *
     * Se equipa igual que siempre —querías esto, es razonable que salgas con
     * ello puesto— pero además queda en `gameState.owned`, así que el Colt no
     * desaparece cuando comprás el Smith. Cambiar entre los que tenés es gratis
     * y se hace en el campamento (ver `owned` en state/gameState.js).
     */
    guardarEnInventario(items[sel]);
    def.equipar(gameState, items[sel]);
    decir(T.tienda.comprado(datos.name));
    audio.play('loot');
  }

  function update(dt) {
    scroll += dt;
    if (mensaje) {
      mensaje.life -= dt;
      if (mensaje.life <= 0) mensaje = null;
    }

    if (input.wasPressed('KeyA') || input.wasPressed('ArrowLeft')) mover(-1);
    if (input.wasPressed('KeyD') || input.wasPressed('ArrowRight')) mover(1);
    if (input.wasPressed('KeyE') || input.wasPressed('Enter')) comprar();
    if (input.wasPressed('Escape')) salir();
  }

  // ------------------------------------------------------------------ dibujo

  function render(r) {
    // Esta escena está armada para CONFIG.view: usa la lupa que le entre.
    r.escenaFija();
    r.clear('#120d0b');

    // Armada para `CONFIG.view` y centrada en la pantalla de hoy. Los textos
    // de arriba y de abajo van afuera, pegados a los bordes de verdad.
    const c = r.centro;
    r.ctx.save();
    r.ctx.translate(c.x, c.y);

    dibujarEscenario(r);
    /**
     * QUÉ DIBUJO USA CADA TIENDA. El escenario (dónde estás parado) y la
     * mercadería (qué mirás) son dos cosas distintas: el acero se vende sobre
     * el MISMO mostrador que los revólveres, pero un hacha no es un revólver
     * con otras proporciones — es otro objeto y necesita su propio dibujo.
     */
    if (def.escenario === 'pesebre') dibujarCaballo(r, item(sel), def.look[items[sel]]);
    else if (def.mercaderia === 'filo') dibujarFilo(r, item(sel), def.look[items[sel]]);
    else dibujarArma(r, item(sel), def.look[items[sel]]);

    dibujarFicha(r);
    dibujarSelector(r);
    r.ctx.restore();

    // De noche baja la luz, pero acá adentro hay lámparas: el mismo velo
    // suave de los interiores, para que entrar siga sintiéndose como entrar.
    if (!gameState.esDeDia) {
      r.tinte(CONFIG.hora.veloInterior, CONFIG.hora.veloInteriorAlpha);
    }

    r.text(def.titulo, r.width / 2, 12, colors.text);
    r.text(`$${gameState.money}`, r.width - 8, 12, colors.bagLoot, 'right');
    r.text(T.tienda.ayuda, r.width / 2, r.height - 8, colors.textDim);
  }

  /**
   * EL FONDO: el pesebre o el mostrador, según la tienda.
   *
   * No es decorado. Es lo que dice DÓNDE estás parado: sin el box de madera
   * alrededor, un caballo de perfil sobre negro sería la ficha de un catálogo.
   */
  function dibujarEscenario(r) {
    const e = ESCENA;

    if (def.escenario === 'pesebre') {
      // La pared del box, en tablas horizontales, y la paja en el piso.
      r.rect(e.x, e.y, e.w, e.h, colors.intMaderaOsc);
      for (let ty = e.y + 4; ty < e.y + 108; ty += 11) {
        r.rect(e.x + 4, ty, e.w - 8, 8, '#6b5236');
        r.rect(e.x + 4, ty + 7, e.w - 8, 1, '#3a2a1c');
      }
      // Los barrotes del box, adelante: es lo que lo hace un corral.
      for (let bx = e.x + 10; bx < e.x + e.w - 6; bx += 26) {
        r.rect(bx, e.y + 2, 3, 104, colors.intMadera);
        r.rect(bx, e.y + 2, 1, 104, '#94663f');
      }
      r.rect(e.x, e.y + 106, e.w, e.h - 106, '#7a6440');
      for (let i = 0; i < 26; i++) {
        const px = e.x + 6 + ((i * 37) % (e.w - 14));
        const py = e.y + 112 + ((i * 23) % (e.h - 116));
        r.rect(px, py, 4, 1, '#c2a75e');
      }
      r.rect(e.x, e.y + 104, e.w, 3, '#4a3524');

      /**
       * EL MONTÓN DE PASTO, y no es decorado: es lo que el animal baja a
       * comer. Si el caballo agachara la cabeza contra el piso pelado, el
       * gesto no se entendería — un movimiento necesita tener a qué ir.
       */
      const hx = CORRAL.cx + 58;
      const hy = CORRAL.suelo + 1;
      // Un montón de verdad, no cuatro briznas: si el bicho baja la cabeza,
      // tiene que haber algo ahí abajo del tamaño de su cabeza.
      for (let i = 0; i < 90; i++) {
        const u = ((i * 47) % 100) / 100;
        const v = ((i * 31) % 100) / 100;
        const alto = Math.round((1 - Math.abs(v - 0.5) * 2) * 15);
        const px = hx - 19 + Math.round(v * 38);
        const py = hy - Math.round(u * Math.max(2, alto));
        r.rect(px, py, 4, 1, u > 0.72 ? '#d8bd6e' : u > 0.35 ? '#a88f4a' : '#7d6a34');
      }
    } else {
      // El mostrador visto de frente: la pared del fondo, la tabla y el paño
      // sobre el que el armero apoya lo que te está mostrando.
      r.rect(e.x, e.y, e.w, e.h, colors.intPared);
      for (let px = e.x + 6; px < e.x + e.w; px += 15) {
        r.rect(px, e.y + 2, 1, 92, '#3a2a1c');
      }
      r.rect(e.x, e.y + 94, e.w, 8, colors.intParedTop);
      r.rect(e.x, e.y + 102, e.w, e.h - 102, colors.intMadera);
      r.rect(e.x, e.y + 102, e.w, 3, '#94663f');
      // El paño: marca dónde mirar, igual que la alfombra en los interiores.
      r.rect(e.x + 20, e.y + 112, e.w - 40, 32, colors.intPañoBorde);
      r.rect(e.x + 23, e.y + 115, e.w - 46, 26, colors.intPaño);
    }
  }

  /**
   * EL CABALLO, DE PERFIL Y GRANDE.
   *
   * ─────────────────────────────────────────────────────────────────────────
   * CÓMO SE HACE QUE UN RECTÁNGULO PAREZCA UN BICHO CON VOLUMEN.
   *
   * No hay 3D ni nada que se le parezca: hay dos trucos viejos de pixel art
   * que hacen todo el trabajo.
   *
   *  1. **La silueta se redondea y el color se escalona.** Cada masa del
   *     animal (el barril, el anca, el cuello, cada pata) se dibuja como una
   *     pila de rayas de 1 px que se van angostando en las puntas y que
   *     cambian de tono según la altura: brillo arriba, base en el medio,
   *     sombra abajo. Eso es un cilindro. Un rectángulo de un solo color es
   *     una tabla; el mismo rectángulo con tres tonos y las esquinas comidas
   *     es un animal.
   *
   *  2. **Las patas del lado de allá van más apagadas y corridas.** Es lo
   *     único que da PROFUNDIDAD de verdad: el ojo lee dos planos y completa
   *     solo el cuerpo que hay en el medio. Sin esto son cuatro palos en fila.
   *
   * Y la luz viene siempre de arriba y de la izquierda, igual en todo el
   * dibujo. Una sola dirección de luz, aunque sea inventada, es lo que hace
   * que las partes se lean como un mismo cuerpo.
   * ─────────────────────────────────────────────────────────────────────────
   *
   * QUE ESTÉ VIVO NO ES QUE SE MUEVA: ES QUE HAGA ALGO. Un caballo que
   * tiembla en el lugar se ve roto. Éste **baja la cabeza al pasto, mastica y
   * la vuelve a subir**, y mientras tanto respira, sacude la cola y mueve una
   * oreja. El ciclo dura nueve segundos, así que en el rato que estás
   * mirándolo lo ves hacer algo entero — que es lo que hace que parezca que
   * vive ahí y no que te lo pusieron para que lo compres.
   */
  function dibujarCaballo(r, datos, look) {
    const cx = CORRAL.cx;
    const suelo = CORRAL.suelo;
    const p = paleta(look.pelo);
    // El lado de allá: el mismo pelo, apagado. Nunca un color aparte.
    const lejos = paleta(tono(look.pelo, 0.62));
    const t = scroll + (look.fase || 0);

    // --- El ciclo de comer: parado, baja, mastica, sube ---
    const CICLO = 9.2;
    const f = t % CICLO;
    let g = 0, masticando = false;
    if (f < 3.4) g = 0;
    else if (f < 4.4) g = suave((f - 3.4) / 1.0);
    else if (f < 7.4) { g = 1; masticando = true; }
    else if (f < 8.4) g = 1 - suave((f - 7.4) / 1.0);

    // Respirar mueve el cuerpo, NO las patas: los cascos están en el piso.
    const respira = Math.sin(t * 1.7) * 0.9;
    const cuerpoY = suelo - 58 + respira;

    // La sombra en la paja: elíptica y pegada a los cascos.
    r.ctx.save();
    r.ctx.globalAlpha = 0.22;
    r.ctx.fillStyle = '#000';
    r.ctx.beginPath();
    r.ctx.ellipse(cx - 2, suelo, 46, 5, 0, 0, Math.PI * 2);
    r.ctx.fill();
    r.ctx.restore();

    // --- La cola, detrás del anca ---
    const swish = Math.sin(t * 1.1) * 3 + Math.sin(t * 2.7) * 1.5;
    dibujarCola(r, cx - 40, cuerpoY - 14, swish, look.crin);

    // --- Las dos patas del lado de allá ---
    dibujarPata(r, cx - 26 - 3, cuerpoY + 12, suelo - 2, lejos, t, 0.0, g);
    dibujarPata(r, cx + 20 - 3, cuerpoY + 12, suelo - 2, lejos, t, 1.6, g);

    // --- El cuerpo: barril, anca y paleta ---
    bloque(r, cx - 2, cuerpoY, 34, 19, p, 5);
    bloque(r, cx - 32, cuerpoY - 3, 15, 21, p, 6);     // el anca, más alta
    bloque(r, cx + 26, cuerpoY - 1, 13, 18, p, 5);     // la paleta

    if (look.manchas) dibujarManchas(r, cx, cuerpoY, look.manchas);

    // --- Las dos patas de este lado ---
    dibujarPata(r, cx - 24, cuerpoY + 12, suelo, p, t, 0.8, g);
    dibujarPata(r, cx + 22, cuerpoY + 12, suelo, p, t, 2.4, g);

    /**
     * EL CUELLO Y LA CABEZA, que son los que se mueven.
     *
     * El cuello se dibuja por columnas entre dos bordes: el de la paleta,
     * que está fijo, y el de la nuca, que baja hasta el pasto. Al
     * interpolarlos, el cuello se estira y se dobla solo — no hay dos poses
     * dibujadas ni una rotación: hay dos bordes y el medio sale de la cuenta.
     */
    const nucaX = cx + 30 + 26 * (1 - g) + 30 * g;
    const nucaTop = cuerpoY - 46 - (1 - g) * 4 + g * 62;
    const nucaBot = nucaTop + 19;

    dibujarCuello(r, cx + 22, cuerpoY - 26, cuerpoY + 12, nucaX, nucaTop, nucaBot, p, look.crin, g,
      look.manchas ? paleta(look.manchas) : null);
    dibujarCabeza(r, nucaX, nucaTop, nucaBot, p, look.crin, g, t, masticando);

    // Lo que está comiendo, y las briznas que se le escapan.
    if (masticando) {
      const bx = nucaX + 10 + g * 6;
      for (let i = 0; i < 3; i++) {
        const o = (Math.sin(t * 3 + i * 2) + 1) / 2;
        r.rect(bx + i * 3 - 2, suelo - 12 - o * 3, 3, 1, '#c2a75e');
      }
    }
  }

  /** Una pata: dos huesos, la pezuña, y el peso que se cambia de vez en cuando. */
  function dibujarPata(r, x, arriba, suelo, p, t, fase, g) {
    // Cada tanto la afloja y la apoya de nuevo. Nunca las cuatro a la vez.
    const gesto = Math.max(0, Math.sin(t * 0.7 + fase) - 0.94) * 18 * (1 - g);
    const largo = suelo - arriba;
    const quiebre = arriba + largo * 0.52;

    bloque(r, x, (arriba + quiebre) / 2, 5, (quiebre - arriba) / 2, p, 2);   // el muslo
    bloque(r, x + gesto * 0.3, (quiebre + suelo) / 2 - gesto * 0.5, 3, (suelo - quiebre) / 2, p, 1);
    // La pezuña: lo único que no es del color del pelo.
    const cascoY = suelo - gesto;
    r.rect(x - 4, cascoY - 5, 8, 5, tono(p.base, 0.42));
    r.rect(x - 4, cascoY - 5, 8, 1, tono(p.base, 0.58));
  }

  /** El cuello, por columnas: la paleta de un lado, la nuca del otro. */
  function dibujarCuello(r, x0, top0, bot0, x1, top1, bot1, p, crin, g, manchas) {
    const pasos = Math.max(1, Math.round(x1 - x0));
    for (let i = 0; i <= pasos; i++) {
      const u = i / pasos;
      // El arco de la crin: un cuello recto se ve a caño, uno curvo se ve a bicho.
      const arco = Math.sin(Math.PI * u) * (7 - g * 3);
      const top = top0 + (top1 - top0) * u - arco;
      const bot = bot0 + (bot1 - bot0) * u + arco * 0.25;
      /**
       * La mancha del cuello se pinta POR COLUMNA, así que sigue la forma
       * exacta del cuello aunque el bicho esté bajando la cabeza. Sin ella
       * el overo se veía manchado del cuerpo y blanco del cuello para
       * arriba: dos animales pegados.
       */
      const pelo = manchas && u > 0.30 && u < 0.58 ? manchas : p;
      bloque(r, x0 + i, (top + bot) / 2, 1, (bot - top) / 2, pelo, 0);
      /**
       * La crin va SOBRE el filo, no encima del cuello. La primera versión
       * le metía 5 px para adentro y en un caballo claro se leía como si el
       * cuello fuera la mitad de ancho: el pelo negro se lo comía. Y se corta
       * antes de la nuca, porque ahí ya empieza el copete de la cabeza.
       */
      if (u < 0.93) {
        const grueso = 3 + Math.round(Math.sin(u * 9) * 1.2);
        r.rect(x0 + i - 1, top - grueso + 1, 2, grueso, crin);
      }
    }
  }

  /**
   * LA CABEZA, que es lo que decide si esto es un caballo o un bulto.
   *
   * Son cuatro piezas y ninguna sobra: **el carrillo** (la masa redonda de
   * atrás, donde va el ojo), **la cara** (una cuña que se afina hacia
   * adelante), **el hocico** (el remate, más oscuro, porque el belfo nunca
   * es del color del pelo) y **las orejas**. La primera versión tenía la
   * cara y nada más, y por eso se leía como un muñón: sin carrillo la cabeza
   * no se apoya en ningún lado, y sin hocico no termina en nada.
   */
  function dibujarCabeza(r, nx, top, bot, p, crin, g, t, masticando) {
    const mid = (top + bot) / 2;
    const mastica = masticando ? Math.round(Math.sin(t * 9) * 0.5 + 0.5) : 0;

    /**
     * LAS PROPORCIONES SON EL TRABAJO. La primera versión tenía la cara
     * larguísima y las orejas de nueve píxeles, y de cerca no era un caballo:
     * era un cocodrilo con astas. Una cabeza de caballo, de perfil, es
     * **corta y honda**: casi tan alta en el carrillo como larga la cara.
     */
    const finX = nx + 15 * (1 - g) + 4 * g;
    const finY = mid + 5 * (1 - g) + 20 * g + mastica;

    // El carrillo. Arranca DETRÁS de la nuca para que se monte con el cuello:
    // si empieza justo en el filo queda un escalón y la cabeza se ve pegada.
    bloque(r, nx - 2, mid + 1, 8, 9, p, 5);

    // La cara: se afina desde el carrillo hasta el belfo.
    const pasos = Math.max(1, Math.round(Math.hypot(finX - nx, finY - mid)));
    for (let i = 0; i <= pasos; i++) {
      const u = i / pasos;
      const x = nx + 3 + (finX - nx) * u;
      const y = mid + 1 + (finY - mid) * u;
      bloque(r, x, y, 1, 6.5 - u * 2, p, 1);
    }

    // El hocico: apenas más oscuro que el pelo. Muy oscuro se lee como un
    // pegote que alguien le clavó en la punta.
    bloque(r, finX + 3, finY + 1, 4.5, 5, paleta(tono(p.base, 0.8)), 3);
    r.rect(finX + 3, finY, 2, 2, tono(p.base, 0.42));   // la nariz

    // El ojo, arriba del carrillo. Parpadea de vez en cuando.
    const parpadeo = Math.sin(t * 0.9) > 0.982 ? 1 : 3;
    r.rect(nx + 1, mid - 4 + g * 3, 2, parpadeo, '#140d06');

    // Las orejas: cortas, anchas en la base, y JUNTAS. Una se sacude.
    const flick = Math.max(0, Math.sin(t * 1.3) - 0.9) * 18;
    // Plantadas 2 px DENTRO del cráneo: apoyadas justo en el filo se ven
    // flotando, como si se las hubieran pegado encima.
    dibujarOreja(r, nx - 3, mid - 6, -1.5 - flick, p);
    dibujarOreja(r, nx + 1, mid - 7, 0.5, p);
    // El copete, el mechón que cae entre las dos orejas y sigue en la crin.
    r.rect(nx - 2, mid - 7, 5, 3, crin);
  }

  /** Una oreja: corta, se afina hacia la punta y agarra la luz arriba. */
  function dibujarOreja(r, x, y, inclina, p) {
    for (let i = 0; i < 6; i++) {
      const u = i / 5;
      const w = Math.max(1, Math.round(3 - u * 2));
      r.rect(x + inclina * u, y - i, w, 1, i > 3 ? p.brillo : p.luz);
    }
  }

  /** La cola: mechones que cuelgan y se sacuden desde el nacimiento. */
  function dibujarCola(r, x, y, swish, crin) {
    const osc = tono(crin, 0.7);
    for (let i = 0; i < 34; i++) {
      const u = i / 33;
      const dx = swish * u * u;
      const ancho = 7 - Math.round(u * 3);
      r.rect(x - 3 + dx, y + i, ancho, 1, i % 5 === 0 ? osc : crin);
    }
  }

  /**
   * LAS MANCHAS DEL OVERO. Son lo único que hace que los dos caballos se
   * distingan de un vistazo, y de un vistazo es como hay que distinguirlos.
   * Van sombreadas igual que el cuerpo (más claras arriba) para que se lean
   * como pelo del animal y no como parches pegados encima.
   */
  function dibujarManchas(r, cx, cuerpoY, color) {
    const m = paleta(color);
    bloque(r, cx - 26, cuerpoY + 2, 12, 12, m, 6);
    bloque(r, cx + 2, cuerpoY + 6, 10, 9, m, 5);
    bloque(r, cx + 18, cuerpoY - 6, 8, 8, m, 4);
    bloque(r, cx - 8, cuerpoY - 12, 7, 5, m, 3);
  }

  /**
   * EL ARMA, DE COSTADO Y GRANDE, apoyada sobre el paño.
   *
   * Todas se dibujan con las mismas piezas (armazón, tambor, caño, culata) y
   * lo que cambia son las medidas y el color, que es exactamente la relación
   * que tienen los números: el Smith no es otro objeto, es el mismo con otras
   * proporciones.
   */
  /**
   * EL ACERO, SOBRE EL MISMO PAÑO — pero no son revólveres.
   *
   * `dibujarArma` (abajo) puede dibujar todo el catálogo de fuego con las
   * mismas piezas porque el Smith **es** un Colt con otras proporciones. Acá no
   * pasa eso: una culata, un cuchillo y un hacha son tres objetos distintos, y
   * dibujarlos con el molde del revólver daría un hacha con tambor y
   * guardamonte. Por eso son tres siluetas y no una parametrizada.
   *
   * Lo que sí comparten es el gesto: el mango hacia la izquierda y el filo
   * hacia la derecha, apoyados en la misma diagonal que el revólver. Al pasar
   * de uno a otro con A/D la mercadería cambia sin que se mueva la cámara.
   */
  function dibujarFilo(r, datos, look) {
    const cx = ESCENA.x + ESCENA.w / 2 - 24;
    const cy = ESCENA.y + ESCENA.h - 32;

    if (datos.id === 'culata') {
      // No es un objeto: es tu propio revólver dado vuelta, agarrado del caño.
      // Se dibuja al revés que en la vidriera de al lado, y ésa es la idea.
      r.rect(cx - 30, cy - 6, 40, 12, look.metal);
      r.rect(cx - 30, cy - 6, 40, 3, look.brillo);
      r.rect(cx + 8, cy - 10, 20, 20, look.madera);
      r.rect(cx + 8, cy - 10, 20, 3, '#94663f');
      r.rect(cx + 10, cy + 10, 16, 8, look.madera);
      // La mano agarra por el caño: dos franjas de cuero.
      r.rect(cx - 22, cy - 7, 4, 14, '#4a3524');
      r.rect(cx - 12, cy - 7, 4, 14, '#4a3524');
      return;
    }

    if (datos.id === 'cuchillo') {
      // Hoja larga y recta, con el lomo iluminado y un cachas de madera.
      r.rect(cx - 34, cy - 2, 26, 11, look.madera);
      r.rect(cx - 34, cy - 2, 26, 3, '#94663f');
      r.rect(cx - 36, cy - 3, 5, 13, '#3a2a1c');          // el pomo
      r.rect(cx - 9, cy - 5, 6, 17, look.metal);          // la guarda
      r.rect(cx - 3, cy - 1, 46, 9, look.metal);          // la hoja
      r.rect(cx - 3, cy - 1, 46, 3, look.brillo);         // el lomo
      r.rect(cx + 43, cy, 8, 6, look.metal);              // la punta
      return;
    }

    // El hacha: cabo largo de madera y una cabeza que pesa el doble que todo
    // lo demás del mostrador. Se lee el peso antes de leer la ficha.
    r.rect(cx - 40, cy + 4, 62, 8, look.madera);
    r.rect(cx - 40, cy + 4, 62, 2, '#94663f');
    r.rect(cx - 42, cy + 3, 6, 11, '#3a2a1c');            // el talón del cabo
    r.rect(cx + 16, cy - 14, 16, 32, look.metal);         // la cabeza
    r.rect(cx + 16, cy - 14, 16, 4, look.brillo);
    r.rect(cx + 32, cy - 10, 10, 24, look.metal);         // el filo, más ancho
    r.rect(cx + 32, cy - 10, 10, 3, look.brillo);
    r.rect(cx + 42, cy - 6, 4, 16, look.brillo);          // el corte
  }

  function dibujarArma(r, datos, look) {
    const cx = ESCENA.x + ESCENA.w / 2 - 24;
    const cy = ESCENA.y + ESCENA.h - 32;

    // La culata, hacia atrás y abajo.
    r.rect(cx - 36, cy + 2, 17, 11, look.madera);
    r.rect(cx - 40, cy + 11, 17, 11, look.madera);
    r.rect(cx - 43, cy + 20, 15, 9, look.madera);
    r.rect(cx - 43, cy + 20, 15, 2, '#94663f');

    // El armazón y el martillo.
    r.rect(cx - 34, cy - 8, 32, 20, look.metal);
    r.rect(cx - 38, cy - 15, 9, 9, look.metal);
    r.rect(cx - 34, cy - 8, 32, 2, look.brillo);

    // El tambor, con sus estrías.
    r.rect(cx - 14, cy - 11, 24, 25, look.metal);
    r.rect(cx - 14, cy - 11, 24, 2, look.brillo);
    for (let i = 0; i < 4; i++) r.rect(cx - 11 + i * 6, cy - 8, 2, 19, '#4a5058');
    r.rect(cx - 3, cy - 1, 3, 3, look.brillo);

    // El caño: la medida que más se nota entre un arma y otra.
    r.rect(cx + 10, cy - 8, look.cano, 13, look.metal);
    r.rect(cx + 10, cy - 8, look.cano, 3, look.brillo);
    r.rect(cx + 10 + look.cano - 4, cy - 13, 4, 6, look.metal);   // la mira

    // El gatillo y el guardamonte.
    r.rect(cx - 18, cy + 12, 4, 9, look.metal);
    r.rect(cx - 26, cy + 20, 24, 3, look.metal);
    r.rect(cx - 28, cy + 12, 3, 9, look.metal);

    /**
     * EL QUIEBRE DEL SMITH: el cierre arriba y la bisagra adelante. Es la
     * pieza por la que se parte al medio, o sea el dibujo de por qué recarga
     * en la mitad de tiempo. La diferencia se ve, no hay que leerla.
     */
    if (look.tambor === 'quiebre') {
      r.rect(cx - 4, cy - 16, 13, 6, look.metal);
      r.rect(cx - 4, cy - 16, 13, 2, look.brillo);
      r.rect(cx + 10, cy + 2, 5, 5, '#4a5058');
    }

    r.ctx.save();
    r.ctx.globalAlpha = 0.22;
    r.rect(cx - 40, cy + 30, 100, 3, '#000');
    r.ctx.restore();
  }

  /** La ficha de la derecha: nombre, precio, barras y la frase. */
  function dibujarFicha(r) {
    const datos = item(sel);
    const f = FICHA;
    const mio = esTuyo(sel);

    r.rect(f.x - 6, f.y - 14, f.w + 12, 168, '#1a1410');
    r.rect(f.x - 6, f.y - 14, f.w + 12, 2, colors.intMaderaOsc);

    r.text(datos.name, f.x, f.y - 2, colors.text, 'left', { tam: 10 });

    if (mio) r.text(T.tienda.tuyo, f.x, f.y + 12, colors.doorGlow, 'left');
    else r.text(T.tienda.precio(def.precio(datos)), f.x, f.y + 12, colors.bagLoot, 'left');

    // --- Las barras ---
    const tuyo = def.catalogo[def.tuyo(gameState)];
    let y = f.y + 30;
    for (const st of def.stats) {
      dibujarBarra(r, f.x, y, st, datos, mio ? null : tuyo);
      y += 13;
    }

    // La frase del vendedor sobre el bicho. Va última porque es lo único que
    // no se puede sacar de los números.
    y += 4;
    for (const linea of partir(datos.hint || '', 30)) {
      r.text(linea, f.x, y, colors.textDim, 'left');
      y += 10;
    }

    if (!mio) r.text(T.tienda.marca, f.x, f.y + 145, colors.textDim, 'left', { tam: 7 });
  }

  /**
   * UNA BARRA DE CASILLEROS, y la rayita de comparación.
   *
   * Casilleros y no una barra lisa porque a esta resolución una barra lisa de
   * 60 px no se puede contar de un vistazo: seis casilleros de diez, sí.
   *
   * MÁS LLENO ES MEJOR SIEMPRE (ver data/tienda.js), salvo las marcadas
   * `malo`, que van en rojo: el ruido de un arma es lo único que se compra
   * queriendo que sea BAJO.
   */
  function dibujarBarra(r, x, y, st, datos, tuyo) {
    const N = 10;
    const valor = Math.max(0, Math.min(1, st.valor(datos) / st.max));
    const llenos = Math.round(valor * N);
    const color = st.malo ? colors.enemyAlert : colors.bagLoot;

    r.text(st.etiqueta, x, y + 3, colors.textDim, 'left', { tam: 7 });

    const bx = x + 62;
    for (let i = 0; i < N; i++) {
      const px = bx + i * 6;
      r.rect(px, y, 5, 7, i < llenos ? color : '#332821');
    }

    // Dónde está el que tenés hoy. Es la comparación entera, en un píxel.
    if (tuyo) {
      const suyo = Math.max(0, Math.min(1, st.valor(tuyo) / st.max));
      const px = bx + Math.round(suyo * N * 6) - 1;
      r.rect(px, y - 2, 1, 11, colors.text);
    }
  }

  /** Abajo: en cuál de todos estás parado, y cuántos hay. */
  function dibujarSelector(r) {
    // `CONFIG.view` y no `r.height`: esto va adentro del escenario centrado.
    const y = CONFIG.view.height - 24;
    const total = items.length;
    const ancho = total * 46;
    const x0 = ESCENA.x + ESCENA.w / 2 - ancho / 2;

    for (let i = 0; i < total; i++) {
      const px = x0 + i * 46;
      const activo = i === sel;
      r.rect(px + 4, y, 38, 12, activo ? colors.intMadera : '#241a13');
      r.text(item(i).short, px + 23, y + 6, activo ? colors.text : colors.textDim, 'center', { tam: 7 });
      if (esTuyo(i)) r.rect(px + 4, y + 12, 38, 2, colors.doorGlow);
    }

    // Las flechitas: la única forma de que se entienda que hay más de uno sin
    // escribir "hay más de uno".
    if (total > 1) {
      const late = Math.sin(scroll * 4) > 0 ? 1 : 0;
      r.text('◂', x0 - 8 - late, y + 6, colors.textDim);
      r.text('▸', x0 + ancho + 8 + late, y + 6, colors.textDim);
    }

    /**
     * ACÁ VIVE EL GESTO DE COMPRAR: el prompt de `[E] COMPRAR $X`, o el
     * mensaje después de apretarlo. Va del lado del ESCENARIO, no centrado
     * en la pantalla — centrado se le montaría encima a la ficha de la
     * derecha, que es donde vive el precio. Dos cosas que hablan de plata no
     * pueden pisarse.
     */
    const ay = ESCENA.y + ESCENA.h + 8;
    if (mensaje) {
      r.text(mensaje.texto, ESCENA.x + ESCENA.w / 2, ay, colors.text, 'center', { tam: 7 });
    } else if (!esTuyo(sel)) {
      r.text(T.tienda.comprar(def.precio(item(sel))), ESCENA.x + ESCENA.w / 2, ay, colors.doorGlow, 'center', { tam: 7 });
    }
  }

  return { enter, update, render };
}

/**
 * ACLARAR U OSCURECER UN COLOR.
 *
 * Existe para que los datos de un caballo sean UN color y no doce. El brillo
 * del lomo, la sombra de la panza y el tono apagado del lado de allá salen
 * todos del mismo pelo, así que cambiarle el color a un animal es cambiar un
 * número y no desafinar seis.
 */
function tono(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return '#' + ((1 << 24) | (c((n >> 16) & 255) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255))
    .toString(16).slice(1);
}

/** Los cuatro tonos de una misma superficie, con la luz viniendo de arriba. */
function paleta(pelo) {
  return {
    brillo: tono(pelo, 1.30),
    luz: tono(pelo, 1.14),
    base: pelo,
    sombra: tono(pelo, 0.72),
  };
}

/**
 * UNA MASA CON VOLUMEN: la pieza con la que está hecho el animal entero.
 *
 * Es una pila de rayas de 1 px que se angostan hacia las puntas (`redondeo`)
 * y que cambian de tono según la altura. Eso convierte un rectángulo en algo
 * que se lee como cilíndrico. Todo el caballo —barril, anca, cuello, patas,
 * cara— son llamadas a esto con otras medidas.
 */
function bloque(r, x, y, hw, hh, p, redondeo = 2) {
  const alto = Math.max(1, Math.round(hh * 2));
  for (let i = 0; i < alto; i++) {
    const u = alto === 1 ? 0.5 : i / (alto - 1);
    // El recorte se concentra en los extremos: en el medio la masa es llena.
    const merma = Math.round(Math.pow(Math.abs(u - 0.5) * 2, 2.4) * redondeo);
    const ancho = (hw - merma) * 2;
    if (ancho <= 0) continue;
    const col = u < 0.10 ? p.brillo : u < 0.32 ? p.luz : u > 0.74 ? p.sombra : p.base;
    r.rect(x - hw + merma, y - hh + i, ancho, 1, col);
  }
}

/** Arranca y frena despacio: un movimiento lineal se lee a máquina. */
function suave(t) {
  const u = Math.max(0, Math.min(1, t));
  return u * u * (3 - 2 * u);
}

/** Corta una frase en líneas de a lo sumo `n` caracteres, sin partir palabras. */
function partir(texto, n) {
  const palabras = texto.split(' ');
  const lineas = [];
  let linea = '';
  for (const p of palabras) {
    if ((linea + ' ' + p).trim().length > n) { lineas.push(linea.trim()); linea = p; }
    else linea += ' ' + p;
  }
  if (linea.trim()) lineas.push(linea.trim());
  return lineas;
}
