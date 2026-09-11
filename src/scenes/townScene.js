/**
 * EL PUEBLO.
 *
 * Ver `data/town.js` para el razonamiento: por qué es una calle que hay que
 * recorrer y no otro claro que entra en pantalla, y por qué se construye el
 * lugar ANTES que las tiendas que van adentro.
 *
 * TRES COSAS QUE LO SEPARAN DEL CAMPAMENTO, y las tres son a propósito:
 *
 * 1. **Hay cámara.** El pueblo es más ancho que la vista, así que hay que
 *    caminarlo. El campamento se ve entero de un vistazo porque es un refugio;
 *    un lugar que se recorre se siente ajeno, que es exactamente lo que el
 *    pueblo tiene que ser.
 *
 * 2. **Es de día.** El campamento es una fogata en la noche. Que los dos
 *    lugares no compartan ni la paleta hace que viajar se sienta como ir a
 *    otro lado, y no como cambiar de pantalla.
 *
 * 3. **Hay gente.** No hacen nada —caminan y tienen una frase— y sin embargo
 *    son la diferencia entre cuatro fachadas y un pueblo.
 *
 * `E` entra o habla; `F` monta y vuelve al campamento. Es el mismo `F` con el
 * que saliste, y eso no es una casualidad de teclas: montar es el verbo de
 * viajar, en las dos direcciones.
 */

import { CONFIG } from '../data/config.js';
import { PUEBLO } from '../data/town.js';
import { INTERIORES } from '../data/interiors.js';
import { gameState } from '../state/gameState.js';
import { createCamera } from '../engine/camera.js';
import { T } from '../text/es.js';

/**
 * Alto de la loma del fondo. Lo comparten el cielo (que llega hasta donde ella
 * empieza) y ella misma: si sólo lo supiera uno de los dos, el degradado se
 * dibujaría por debajo y perdería justo el tramo pálido del horizonte, que es
 * el que da la distancia.
 */
const ALTO_LOMA = 16;

export function createTownScene(services) {
  const { renderer, input, scenes, hud, audio, rng } = services;
  const colors = CONFIG.colors;
  const camera = createCamera(renderer.width, renderer.height);
  const bounds = { width: PUEBLO.ancho, height: PUEBLO.alto };

  let x, y, mensaje, scroll, gente;

  function enter(params = {}) {
    hud.hide();
    // Llegás donde está tu caballo: por ahí entraste y por ahí te vas. Salvo
    // que estés saliendo de un local — entonces aparecés en su puerta, que es
    // por donde saliste.
    const local = params.desde === 'interior'
      && PUEBLO.edificios.find((e) => e.id === params.edificio);
    x = local ? local.x : PUEBLO.caballo.x + 26;
    y = local ? PUEBLO.calleY - 4 : PUEBLO.calleY;
    mensaje = null;
    scroll = 0;

    // Cada vecino arranca en su punto y camina su tramo, ida y vuelta.
    gente = PUEBLO.gente.map((g) => ({
      ...g, inicio: g.x, dir: rng.range(0, 1) > 0.5 ? 1 : -1,
      fase: rng.range(0, 6),
    }));

    camera.snap(x, y, bounds);

    /**
     * EL FONDO DEL PUEBLO: una calle de tierra al aire libre. De noche baja —
     * no porque haya menos viento, sino porque un pueblo cerrado suena menos, y
     * el juego ya usa la noche para decir que el establo y la armería cerraron.
     */
    audio.ambiente('calle', {
      cutoff: 340, q: 0.6, type: 'lowpass',
      gain: gameState.esDeDia ? CONFIG.ambiente.puebloDiaGain : CONFIG.ambiente.puebloNocheGain,
      respira: {
        profundidad: CONFIG.ambiente.vientoProfundidad,
        cada: CONFIG.ambiente.vientoCada,
      },
    });
    audio.arrancarMusica();

    // Para depurar desde la consola: FORAJIDO.services.town
    services.town = {
      get x() { return x; },
      get y() { return y; },
      get cerca() { const o = objetoCerca(); return o ? o.id : null; },
      get mensaje() { return mensaje ? mensaje.texto : null; },
      get gente() { return gente; },
      get edificios() { return PUEBLO.edificios; },
    };
  }

  // ------------------------------------------------------------------ lógica

  /**
   * Qué tenés al alcance de la mano. Las puertas y la gente compiten en la
   * misma lista y gana el más cercano, igual que en el asalto compiten el
   * botín, el pasajero y la salida: un solo verbo, y el cartel de arriba te
   * dice siempre cuál de todos va a pasar.
   */
  function objetoCerca() {
    let mejor = null;
    let mejorDist = Infinity;

    const mirar = (o, ox, oy, tipo) => {
      const d = Math.hypot(ox - x, oy - y);
      if (d <= o.alcance && d < mejorDist) { mejorDist = d; mejor = { ...o, tipo }; }
    };

    for (const e of PUEBLO.edificios) mirar(e, e.x, PUEBLO.calleY - 12, 'edificio');
    for (const g of gente) mirar(g, g.x, PUEBLO.calleY + 6, 'persona');

    const c = PUEBLO.caballo;
    const dc = Math.hypot(c.x - x, y - PUEBLO.calleY);
    if (dc <= 34 && dc < mejorDist) mejor = { id: 'caballo', tipo: 'caballo' };

    return mejor;
  }

  function decir(texto, life = 3.0) { mensaje = { texto, life }; }

  /**
   * Ninguna puerta vende nada todavía, así que cada una dice QUÉ va a vender.
   * Es la misma regla que se siguió en el campamento: un objeto mudo enseña a
   * ignorarlo, y después cuesta el doble que lo vuelvan a mirar.
   */
  function usar(o) {
    if (o.tipo === 'persona') {
      decir(T.pueblo.dichos[o.id]);
      audio.play('cover');
      return;
    }
    /**
     * Las puertas ya no son un cartel de texto: se entra. Salvo que el local
     * cierre de noche (el establo y la armería son negocios), y entonces la
     * puerta te lo dice — que es lo que le da un trabajo real a dormir.
     */
    const interior = INTERIORES[o.id];
    if (interior && interior.soloDeDia && !gameState.esDeDia) {
      decir(T.pueblo.cerrado(interior.nombre));
      audio.play('hitWall');
      return;
    }
    audio.play('cover');
    scenes.goTo('interior', { id: o.id });
  }

  function update(dt) {
    scroll += dt;
    audio.updateMusica(dt);
    if (mensaje) {
      mensaje.life -= dt;
      if (mensaje.life <= 0) mensaje = null;
    }

    moverGente(dt);

    let dx = 0, dy = 0;
    if (input.anyDown('KeyA', 'ArrowLeft')) dx -= 1;
    if (input.anyDown('KeyD', 'ArrowRight')) dx += 1;
    if (input.anyDown('KeyW', 'ArrowUp')) dy -= 1;
    if (input.anyDown('KeyS', 'ArrowDown')) dy += 1;

    if (dx !== 0 || dy !== 0) {
      if (dx !== 0 && dy !== 0) { const i = 1 / Math.SQRT2; dx *= i; dy *= i; }
      x += dx * CONFIG.player.speed * dt;
      y += dy * CONFIG.player.speed * dt;
      // La calle es una franja: ni te metés en las fachadas ni te vas al campo.
      x = Math.max(14, Math.min(PUEBLO.ancho - 14, x));
      y = Math.max(PUEBLO.calleY - PUEBLO.calleAncho,
                   Math.min(PUEBLO.calleY + PUEBLO.calleAncho, y));
    }

    const o = objetoCerca();
    if (o && o.tipo !== 'caballo' && input.wasPressed('KeyE')) usar(o);

    // Montar y volver. Se puede desde el caballo, que es donde llegaste.
    if (input.wasPressed('KeyF') && o && o.tipo === 'caballo') volver();

    camera.follow(x, y, bounds, dt);
    camera.update(dt, rng);
  }

  function volver() {
    audio.play('escape');
    scenes.goTo('camp', { desde: 'pueblo' });
  }

  /**
   * Van y vienen por su tramo, cada uno con su paso para que no marchen
   * juntos. **Pero se frenan si te les ponés al lado**, y eso no es un
   * detalle: sin ello, acercarse a hablarle a alguien que camina rápido es
   * perseguirlo, y quedás peleando con la geometría en vez de con el juego.
   *
   * Es la misma regla que ya rige a los pasajeros del tren, que dejan de huir
   * cuando los tenés encañonados: la gente reacciona a que estés ahí.
   */
  function moverGente(dt) {
    for (const g of gente) {
      const cerca = Math.hypot(g.x - x, (PUEBLO.calleY + 6) - y) <= g.alcance + 6;
      if (cerca) continue;
      g.x += g.dir * g.vel * dt;
      if (g.x > g.inicio + g.rango) { g.x = g.inicio + g.rango; g.dir = -1; }
      if (g.x < g.inicio - g.rango) { g.x = g.inicio - g.rango; g.dir = 1; }
    }
  }

  // ------------------------------------------------------------------ dibujo

  function render(r) {
    const dia = gameState.esDeDia;
    /**
     * EL CIELO VA ANTES DEL `translate`, y no es un detalle: está
     * infinitamente lejos, así que no puede correrse con la cámara. Si entrara
     * en el desplazamiento, caminar por el pueblo movería el horizonte y el
     * pueblo se sentiría del tamaño de una habitación.
     */
    r.cielo(0, 0, r.width, PUEBLO.calleY - 78 - ALTO_LOMA,
      colors.puebloCielo, colors.puebloCieloHorizonte);

    r.ctx.save();
    r.ctx.translate(-camera.renderX, 0);

    dibujarTierra(r);
    for (const e of PUEBLO.edificios) dibujarEdificio(r, e, dia);
    dibujarCaballo(r);
    for (const g of gente) dibujarVecino(r, g);
    dibujarJugador(r);

    /**
     * LA NOCHE VA ACÁ: sobre el pueblo dibujado, pero DEBAJO de las luces.
     * Ese orden es todo el truco — si el velo fuera lo último, apagaría las
     * ventanas encendidas y quedaría un pueblo oscuro y muerto en vez de un
     * pueblo de noche. Primero se apaga todo, después se prenden las luces.
     */
    if (!dia) {
      r.ctx.restore();
      r.tinte(CONFIG.hora.velo, CONFIG.hora.veloAlpha);
      r.ctx.save();
      r.ctx.translate(-camera.renderX, 0);
      for (const e of PUEBLO.edificios) dibujarLuces(r, e);
    }

    r.ctx.restore();

    dibujarInterfaz(r);
  }

  /**
   * Las ventanas encendidas de los locales que siguen abiertos.
   *
   * Es la señal más importante del pueblo de noche: **de un vistazo ves cuáles
   * están abiertos**, sin caminar hasta la puerta a que te digan que no. El
   * establo y la armería quedan a oscuras; la cantina y el sheriff, prendidos.
   */
  function dibujarLuces(r, e) {
    const interior = INTERIORES[e.id];
    if (interior && interior.soloDeDia) return;

    const base = PUEBLO.calleY - 22;
    const top = base - e.alto;
    const izq = e.x - e.ancho / 2;
    const late = 0.82 + Math.sin(scroll * 3 + e.x) * 0.06;

    r.ctx.save();
    r.ctx.globalAlpha = late;
    r.rect(izq + 8, top + 16, 12, 10, CONFIG.hora.ventanaEncendida);
    r.rect(izq + e.ancho - 20, top + 16, 12, 10, CONFIG.hora.ventanaEncendida);
    // La luz que sale por la puerta y se derrama en la vereda.
    r.rect(e.x - 6, base - 24, 12, 22, '#8a6a34');
    r.ctx.globalAlpha = late * 0.22;
    r.rect(e.x - 16, base, 32, 8, CONFIG.hora.ventanaEncendida);
    r.ctx.restore();
  }

  function dibujarTierra(r) {
    const calle = PUEBLO.calleY;
    /**
     * La loma detrás del pueblo: una FRANJA apoyada en el horizonte, no un
     * fondo. Antes salía de `y=0` y se comía el cielo entero — ver la nota de
     * `puebloCielo` en data/config.js.
     */
    r.rect(0, calle - 78 - ALTO_LOMA, PUEBLO.ancho, ALTO_LOMA, colors.puebloLoma);
    // La calle de tierra, con dos tonos para que se lea el polvo.
    r.rect(0, calle - 78, PUEBLO.ancho, PUEBLO.alto, colors.puebloTierra);
    for (let i = 0; i < PUEBLO.ancho; i += 24) {
      r.rect(i, calle - 20 + (i % 48 === 0 ? 6 : 22), 16, 3, colors.puebloTierra2);
    }
    // Las huellas de las ruedas: dos surcos que corren la calle entera.
    r.rect(0, calle + 14, PUEBLO.ancho, 2, colors.puebloTierra2);
    r.rect(0, calle + 24, PUEBLO.ancho, 2, colors.puebloTierra2);
  }

  function dibujarEdificio(r, e, dia = true) {
    const base = PUEBLO.calleY - 22;      // donde apoya la fachada
    const top = base - e.alto;
    const izq = e.x - e.ancho / 2;

    // Cuerpo, techo y el frente alto de tabla que tienen todas estas casas.
    r.rect(izq, top, e.ancho, e.alto, colors.puebloMadera);
    r.rect(izq, top, e.ancho, 4, colors.puebloTecho);
    r.rect(izq - 3, top - 10, e.ancho + 6, 12, colors.puebloMaderaOsc);
    r.rect(izq - 3, top - 10, e.ancho + 6, 3, colors.puebloTecho);

    // Las tablas verticales.
    for (let i = izq + 6; i < izq + e.ancho - 4; i += 9) {
      r.rect(i, top + 6, 1, e.alto - 8, colors.puebloMaderaOsc);
    }

    // El letrero, que es lo que hace que un cajón marrón sea una armería.
    r.text(T.pueblo.letreros[e.id], e.x, top - 4, colors.puebloLetrero);

    // La puerta y dos ventanas.
    r.rect(e.x - 8, base - 26, 16, 26, colors.puebloPuerta);
    r.rect(e.x - 6, base - 24, 12, 22, '#241a13');
    r.rect(izq + 8, top + 16, 12, 10, colors.puebloPuerta);
    r.rect(izq + e.ancho - 20, top + 16, 12, 10, colors.puebloPuerta);

    // La vereda de madera delante de la puerta.
    r.rect(izq - 4, base, e.ancho + 8, 5, colors.puebloVereda);
    r.rect(izq - 4, base, e.ancho + 8, 1, '#8a6b47');
  }

  function dibujarCaballo(r) {
    const c = PUEBLO.caballo;
    const cy = PUEBLO.calleY;
    // El palenque.
    r.rect(c.x - 18, cy - 14, 3, 18, colors.puebloMaderaOsc);
    r.rect(c.x + 15, cy - 14, 3, 18, colors.puebloMaderaOsc);
    r.rect(c.x - 18, cy - 12, 36, 2, colors.puebloMadera);

    const respira = Math.sin(scroll * 1.6) * 0.6;
    r.rect(c.x - 10, cy + 2 + respira, 21, 9, colors.horse);
    r.rect(c.x - 10, cy + 2 + respira, 21, 3, colors.horseDark);
    r.rect(c.x + 9, cy + 4 + respira, 6, 6, colors.horse);
    r.rect(c.x - 12, cy + 4 + respira, 4, 5, colors.horseMane);
  }

  function dibujarVecino(r, g) {
    const cy = PUEBLO.calleY + 6;
    // Un balanceo mínimo al caminar: sin esto se deslizan como fichas.
    const paso = Math.sin(scroll * 6 + g.fase) * 0.8;
    const color = g.id === 'mujer' ? colors.puebloVecino2 : colors.puebloVecino;

    r.ctx.globalAlpha = 0.22;
    r.box(g.x, cy + 6, 4, 2, '#000');
    r.ctx.globalAlpha = 1;

    const alto = g.id === 'chico' ? 4 : 5;
    r.box(g.x, cy + paso, 4, alto, color);
    r.rect(g.x - 5, cy - alto - 1 + paso, 11, 2, colors.playerHat);
  }

  function dibujarJugador(r) {
    r.ctx.globalAlpha = 0.25;
    r.box(x, y + 6, 5, 2, '#000');
    r.ctx.globalAlpha = 1;
    r.box(x, y, 5, 5, colors.player);
    r.rect(x - 6, y - 6, 13, 3, colors.playerHat);

    const o = objetoCerca();
    if (o) {
      r.text(T.pueblo.prompts[o.id], x, y - 16,
        o.tipo === 'caballo' ? colors.bagLoot : colors.doorGlow);
    }
  }

  function dibujarInterfaz(r) {
    r.text(T.pueblo.title, r.width / 2, 12, colors.text);
    r.text(`$${gameState.money}`, r.width - 8, 12, colors.bagLoot, 'right');
    if (gameState.bounty > 0) {
      r.text(`☠ $${gameState.bounty}`, 8, 12, colors.enemyAlert, 'left');
    }

    if (mensaje) r.text(mensaje.texto, r.width / 2, r.height - 28, colors.text);
    else if (scroll < 9) r.text(T.pueblo.keys, r.width / 2, r.height - 14, colors.textDim);
  }

  function exit() {
    audio.quitarAmbiente('calle');
    audio.pararMusica();
  }

  return { enter, exit, update, render };
}
