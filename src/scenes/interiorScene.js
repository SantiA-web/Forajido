/**
 * ADENTRO DE UN LOCAL DEL PUEBLO.
 *
 * Una sola escena para los cuatro (armería, establo, cantina, oficina del
 * sheriff): lo que cambia entre uno y otro es CONTENIDO, no código, y vive en
 * `data/interiors.js`. Es la misma regla que hace que agregar un vagón al tren
 * sea escribir una plantilla y no tocar un sistema.
 *
 * TRES COSAS QUE LA DEFINEN:
 *
 * 1. **Los muebles frenan.** No se camina a través de la barra ni del
 *    escritorio. Sin eso el cuarto sería un fondo dibujado; con eso es un
 *    lugar, porque tenés que rodear las cosas igual que en la vida.
 *
 * 2. **Entra entera en pantalla**, sin cámara. Un cuarto que hay que recorrer
 *    se lee como un nivel; estos son lugares para orientarse de un vistazo.
 *
 * 3. **De noche la luz baja pero no se apaga.** El velo de adentro es mucho
 *    más suave que el de la calle (ver CONFIG.hora) porque acá hay lámparas.
 *    Que la cantina siga siendo cálida mientras afuera está oscuro es lo que
 *    hace que entrar se sienta como entrar.
 */

import { CONFIG } from '../data/config.js';
import { INTERIORES, PARED_ALTO } from '../data/interiors.js';
import { gameState } from '../state/gameState.js';
import { crearMenu } from '../engine/menu.js';
import { tasarLote } from '../data/perista.js';
import { T } from '../text/es.js';
import { dibujarPersona as dibujarGente, faseDeAndar, tono } from '../entities/figura.js';
import { dibujarAnimal, ESCALA_PARADO } from '../entities/caballo.js';

/**
 * CON QUÉ ROPA VA CADA UNO. Sale de la ropa que YA TIENE el juego
 * (entities/gente/dibujo.js): no hizo falta inventar ninguna. El barman y los
 * que comen van de traje; los que juegan a las cartas y el caballerizo, de
 * vaquero con su funda; el perista, de rico; el ayudante, de sheriff.
 */
const ROPA_DE = {
  armero: 'pistolero', barman: 'pasajero', parroquiano: 'pistolero',
  comensal1: 'rico', comensal2: 'pasajero', jugador1: 'rico', jugador2: 'pistolero',
  caballerizo: 'pistolero', ayudante: 'sheriff', perista: 'rico',
};

/**
 * 🔺 CUÁNTO ALTO TIENE CADA MUEBLE que se ve desde arriba. Es la regla de las
 * dos caras de todo el juego: la tapa se dibuja arriba y la CARA DE ADELANTE
 * baja hasta el piso. Antes la barra, el mostrador y las mesas eran sólo la
 * tapa apoyada en el suelo, como una alfombra: al lado de una persona de 20
 * se leían como planos pintados en el piso.
 *
 * Lo que ya se dibujaba parado (el barril, la estufa, el cajón) no lleva:
 * ya tiene su frente.
 */
const ALTURA = { barra: 12, mostrador: 12, escritorio: 10, mesa: 9, poker: 9, abrevadero: 6, fardo: 6 };

/**
 * DÓNDE TOCA EL PISO cada mueble, por abajo: es lo que decide quién tapa a
 * quién. Cada tipo está descripto a su manera en los datos (desde la esquina,
 * desde el centro, un círculo), así que acá se traduce.
 */
function pieDe(m) {
  if (m.tipo === 'mesa') return m.y + 10;
  if (m.tipo === 'poker') return m.y + m.r;
  if (m.tipo === 'abrevadero' || m.tipo === 'alfombra') return m.y + m.h / 2;
  if (m.w !== undefined) return m.y + m.h;
  const medio = { silla: 4, barril: 9, cajon: 6, fardo: 5, estufa: 10 };
  return m.y + (medio[m.tipo] ?? 0);
}

export function createInteriorScene(services) {
  const { input, scenes, hud, audio } = services;
  const colors = CONFIG.colors;

  let def, id, x, y, mensaje, scroll;
  const menu = crearMenu(audio);

  /** Hacia dónde mirás, y el cuerpo que guarda la fase del paso (ver el campamento). */
  let mirando = -Math.PI / 2;
  const yo = {};

  function enter(params = {}) {
    hud.hide();
    id = params.id || 'cantina';
    def = INTERIORES[id];

    /**
     * Entrás por la puerta, mirando el local — salvo que estés VOLVIENDO de
     * la tienda, y entonces aparecés donde habías dejado los pies. Volver a
     * la puerta después de mirar un caballo se siente a teletransporte, la
     * misma razón por la que volvés parado junto al poste al llegar del
     * pueblo.
     */
    x = params.x !== undefined ? params.x : def.puerta.x;
    y = params.y !== undefined ? params.y : def.puerta.y - 12;
    mensaje = null;
    menu.cerrar();
    scroll = 0;

    // Para depurar desde la consola: FORAJIDO.services.interior
    services.interior = {
      get id() { return id; },
      get x() { return x; },
      get y() { return y; },
      get cerca() { const p = puntoCerca(); return p ? p.id : null; },
      get mensaje() { return mensaje ? mensaje.lineas.join(" ") : null; },
      get puntos() { return def.puntos; },
      get dialogo() { return menu.activo(); },
      get sala() { return def.sala; },
      get muebles() { return def.muebles; },
      /** Para depurar la colisión desde la consola sin adivinarla de nuevo. */
      libre: (px, py) => !chocaMueble(px, py),
    };
  }

  // ------------------------------------------------------------------ lógica

  function puntoCerca() {
    let mejor = null;
    let mejorDist = Infinity;
    for (const p of def.puntos) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d <= p.alcance && d < mejorDist) { mejorDist = d; mejor = p; }
    }
    return mejor;
  }

  function enLaPuerta() {
    return Math.hypot(def.puerta.x - x, def.puerta.y - y) < 22;
  }

  /**
   * LO QUE DICE UN PERSONAJE O UNA COSA. Acepta una frase o VARIAS LÍNEAS.
   *
   * 🐛 ANTES ERA UNA SOLA LÍNEA Y EL PERISTA NO ENTRABA. Su precio se dice
   * desglosado (cuánto vale la mercadería, cuánto suma que no esté marcada,
   * cuánto tu nombre), y eso son unos 180 caracteres: en una pantalla de 384 px
   * se cortaba por los dos lados — y lo que quedaba afuera era justo el número
   * que importa, lo que te paga. Se vio MIRÁNDOLO; ninguna medición lo iba a
   * mostrar.
   *
   * Las líneas se apilan hacia arriba desde el pie de la pantalla, así que la
   * última que se lee es siempre la de abajo y todos los mensajes de una línea
   * siguen cayendo exactamente donde caían.
   */
  function decir(texto, life = 3.2) {
    mensaje = { lineas: Array.isArray(texto) ? texto : [texto], life };
  }

  /**
   * HABLARLE A UN VENDEDOR NO ES LEER UNA FRASE: ES QUE TE PREGUNTE.
   *
   * El resto de la gente del pueblo suelta un dicho y listo, porque no hay
   * nada que decidir con ellos. El que vende algo abre una pregunta con
   * opciones, y ahí está la diferencia: es el único con el que la
   * conversación puede terminar en algo.
   *
   * Mientras el diálogo está abierto NO TE PODÉS MOVER, y no es una traba
   * técnica: estás hablando con alguien. Cortás con [ESC] o eligiendo "nada,
   * gracias", que existe justamente para que salir sea una respuesta y no un
   * botón de cerrar.
   */
  /**
   * El menú en sí vive en `engine/menu.js` desde que el campamento necesitó lo
   * mismo para elegir con qué salís. Acá queda sólo lo que es del interior: la
   * pregunta del vendedor y qué significa cada respuesta.
   */
  function abrirDialogo(p) {
    mensaje = null;
    menu.abrir(
      T.interior.preguntas[p.id] || '"¿Qué desea?"',
      p.dialogo.map((o) => ({ id: o.id, texto: T.interior.opciones[o.id] })),
      (id) => { elegirOpcion(p, p.dialogo.find((o) => o.id === id)); return false; }
    );
  }

  /**
   * VENDERLE EL LOTE AL PERISTA.
   *
   * De un solo gesto, y el precio se DESGLOSA al decirlo (ver `tasarLote` en
   * data/perista.js). Es la única forma de que dos sistemas invisibles se
   * vuelvan jugables: que la alarma de un asalto que ya terminó siga
   * costándote, y que `honor` —un número que hasta hoy sólo movía cada cuánto
   * se rendía un guardia— tenga un precio.
   */
  function vender() {
    const objetos = gameState.owned.objetos;
    if (!objetos.length) {
      decir(T.interior.dichos.peristaVacio);
      audio.play('cover');
      return;
    }

    const t = tasarLote(objetos, gameState.honor);
    gameState.money += t.total;
    // `length = 0` y no una lista nueva: es el mismo array que mira el resto
    // del juego, igual que los arrays del mundo en el asalto.
    objetos.length = 0;

    decir(T.interior.venta(t));
    audio.play('loot');
  }

  function elegirOpcion(punto, op) {
    if (op.vender) { vender(); return; }

    if (op.tienda) {
      audio.play('loot');
      // Se le pasan los pies: la tienda los devuelve para que vuelvas al
      // mismo lugar del local en el que estabas parado.
      scenes.goTo('tienda', { id: op.tienda, x, y });
      return;
    }

    // "Nada, gracias": el vendedor contesta lo suyo. Que tenga respuesta es
    // lo que hace que decir que no sea parte de la charla y no un escape.
    decir(T.interior.dichos[punto.id]);
    audio.play('cover');
  }

  function usar(p) {
    // Los vendedores preguntan; las cosas contestan.
    if (p.dialogo) { abrirDialogo(p); return; }

    // Al mostrador del perista se llega sin hablarle: el mismo trato.
    if (p.vender) { vender(); return; }

    // Y a la mercadería se la puede ir a mirar directamente, sin hablar con
    // nadie: es lo que más importa ver, así que es lo más fácil de alcanzar.
    if (p.tienda) {
      audio.play('loot');
      scenes.goTo('tienda', { id: p.tienda, x, y });
      return;
    }

    if (p.id === 'cartelera') {
      // La cuenta regresiva de la horca. Ver CONFIG.prision: este es el lugar
      // donde se puede mirar ANTES de llegar a ella.
      const umbral = CONFIG.prision.umbralHorca;
      const cerca = gameState.bounty >= umbral * CONFIG.prision.avisoCerca;
      decir(T.interior.dichos.cartelera(gameState.bounty, umbral, cerca));
    } else {
      decir(T.interior.dichos[p.id]);
    }
    audio.play(p.tipo === 'persona' ? 'cover' : 'loot');
  }

  function salir() {
    audio.play('cover');
    scenes.goTo('town', { desde: 'interior', edificio: id });
  }

  function update(dt) {
    scroll += dt;
    if (mensaje) {
      mensaje.life -= dt;
      if (mensaje.life <= 0) mensaje = null;
    }

    // Hablando no se camina: la charla se atiende o se corta.
    if (menu.update(input)) return;

    let dx = 0, dy = 0;
    if (input.anyDown('KeyA', 'ArrowLeft')) dx -= 1;
    if (input.anyDown('KeyD', 'ArrowRight')) dx += 1;
    if (input.anyDown('KeyW', 'ArrowUp')) dy -= 1;
    if (input.anyDown('KeyS', 'ArrowDown')) dy += 1;

    if (dx !== 0 || dy !== 0) {
      if (dx !== 0 && dy !== 0) { const i = 1 / Math.SQRT2; dx *= i; dy *= i; }
      // Un eje por vez, para poder deslizarse a lo largo de un mueble en vez
      // de quedarse trabado contra la esquina. Mismo criterio que
      // `moveAndCollide` del asalto, en chiquito.
      mover(dx * CONFIG.player.speed * dt, 0);
      mover(0, dy * CONFIG.player.speed * dt);
      mirando = Math.atan2(dy, dx);
    }

    const p = puntoCerca();
    if (input.wasPressed('KeyE')) {
      if (p) usar(p);
      else if (enLaPuerta()) salir();
    }
    if (input.wasPressed('Escape')) salir();
  }


  function mover(dx, dy) {
    const nx = x + dx;
    const ny = y + dy;
    const s = def.sala;
    const px = Math.max(s.x + 6, Math.min(s.x + s.w - 6, nx));
    const py = Math.max(s.y + 6, Math.min(s.y + s.h - 6, ny));
    if (!chocaMueble(px, py)) { x = px; y = py; }
  }

  /**
   * ¿Este punto cae adentro de un mueble sólido?
   *
   * Tres formas de chocar, según cómo esté descripto el mueble en los datos:
   * un círculo (`r`, la mesa de póker), un rectángulo con ancho/alto propio
   * desde el centro (`hw`/`hh` — sillas, barriles, fardos, cajones) o un
   * rectángulo clásico desde la esquina (`w`/`h` — mostradores, escritorios,
   * pesebres). `mesa` queda como caso especial porque su tamaño de colisión
   * no coincide con el que se dibuja (la mesa se dibuja más chica que el área
   * por la que de verdad frena, para que quepan las sillas alrededor).
   *
   * ARREGLADO: la primera versión sólo entendía el rectángulo clásico, así
   * que cualquier mueble descripto sólo con `x, y` (sillas, barriles, fardos,
   * cajones) nunca chocaba aunque llevara `solido: true` — se caminaba a
   * través de todos ellos. Faltaba el caso `hw`/`hh`.
   */
  function chocaMueble(px, py) {
    const r = 5;
    for (const m of def.muebles) {
      // Lo que cuelga de la pared no choca nunca: está fuera del piso, así
      // que no hay forma de llegar. Se salta explícito como red de seguridad.
      if (m.pared || !m.solido) continue;

      if (m.tipo === 'poker') {
        if (Math.hypot(m.x - px, m.y - py) < m.r + r) return true;
        continue;
      }
      if (m.tipo === 'mesa') {
        if (Math.abs(m.x - px) < 14 + r && Math.abs(m.y - py) < 10 + r) return true;
        continue;
      }
      if (m.hw !== undefined) {
        if (Math.abs(m.x - px) < m.hw + r && Math.abs(m.y - py) < m.hh + r) return true;
        continue;
      }
      if (px > m.x - r && px < m.x + m.w + r && py > m.y - r && py < m.y + m.h + r) return true;
    }
    return false;
  }

  // ------------------------------------------------------------------ dibujo

  function render(r) {
    // Esta escena está armada para CONFIG.view: usa la lupa que le entre.
    r.escenaFija();
    r.clear('#120d0b');
    /**
     * EL CUARTO VA CENTRADO: está armado para `CONFIG.view` (ver
     * data/interiors.js), y en una pantalla más grande lo que sobra alrededor
     * es la oscuridad de siempre, no un cuarto estirado.
     */
    const c = r.centro;
    r.ctx.save();
    r.ctx.translate(c.x, c.y);
    dibujarSala(r);
    /**
     * 🔺 POR PROFUNDIDAD. Antes el orden era fijo —muebles, gente, vos— y con
     * personas de 3 rectángulos no se notaba. Con gente de 20 de alto sí: si
     * te parabas detrás de la barra, te dibujabas ENCIMA de ella. Ahora lo
     * colgado en la pared y la alfombra van primero, y el resto se ordena por
     * dónde toca el piso cada uno — la misma regla del asalto.
     */
    const cosas = [];
    for (const m of def.muebles) {
      if (m.pared || m.tipo === 'alfombra') dibujarMueble(r, m);
      else cosas.push({ y: pieDe(m), pinta: () => dibujarMueble(r, m) });
    }
    // `sentado` sólo cambia el dibujo (una postura distinta): la detección es
    // la misma para cualquier `persona`, así que se pueden hablar igual.
    for (const p of def.puntos) {
      if (p.tipo !== 'persona') continue;
      cosas.push({ y: piesDe(p), pinta: () => dibujarAlguien(r, p) });
    }
    cosas.push({ y: y + 5, pinta: () => dibujarJugador(r) });
    cosas.sort((a, b) => a.y - b.y);
    for (const c2 of cosas) c2.pinta();
    r.ctx.restore();

    // La noche, suave: acá adentro hay lámparas.
    if (!gameState.esDeDia) {
      r.tinte(CONFIG.hora.veloInterior, CONFIG.hora.veloInteriorAlpha);
    }

    dibujarInterfaz(r);
  }

  /**
   * EL CUARTO: una pared al fondo y el piso abajo.
   *
   * La franja de pared (`PARED_ALTO`) queda ARRIBA del piso caminable, y ahí
   * es donde se cuelgan el estante de armas, la cartelera, las botellas y las
   * lámparas. Que exista esa franja es lo que hace que esas cosas no se
   * puedan atravesar: no hace falta colisión para algo a lo que no se llega.
   */
  function dibujarSala(r) {
    const s = def.sala;
    const paredY = s.y - PARED_ALTO;

    // --- La pared del fondo, en tablas verticales ---
    r.rect(s.x - 8, paredY, s.w + 16, PARED_ALTO, colors.intPared);
    r.rect(s.x - 8, paredY, s.w + 16, 3, colors.intParedTop);
    for (let px = s.x - 2; px < s.x + s.w + 8; px += 15) {
      r.rect(px, paredY + 3, 1, PARED_ALTO - 6, '#3a2a1c');
    }
    // El zócalo: la línea donde la pared toca el piso. Es lo que hace que se
    // lean como dos planos distintos y no como un fondo de dos colores.
    r.rect(s.x - 8, s.y - 4, s.w + 16, 4, colors.intParedTop);
    r.rect(s.x - 8, s.y - 1, s.w + 16, 1, '#2f2116');

    /**
     * 🔺 EL PISO, EN TABLONES DE VERDAD. Eran bandas de dos colores
     * alternados con una junta cada 40 que cruzaba el piso entero: un
     * cuadriculado. Ahora cada tablón tiene su tono, su filo de luz arriba, y
     * las juntas de punta van SALTEADAS de un tablón al otro, que es como se
     * clava un piso — con todas alineadas no hay piso que aguante.
     */
    for (let fy = s.y, fila = 0; fy < s.y + s.h; fy += 8, fila++) {
      const base = fila % 2 === 0 ? colors.intPiso : colors.intPisoAlt;
      const corrido = (fila * 23) % 40;
      for (let fx = s.x - corrido, k = 0; fx < s.x + s.w; fx += 40, k++) {
        const v = ((fila * 7 + k * 13) % 5) - 2;
        const x0 = Math.max(s.x, fx), x1 = Math.min(s.x + s.w, fx + 40);
        r.rect(x0, fy, x1 - x0, 8, tono(base, 1 + v * 0.035));
        if (fx > s.x) r.rect(fx, fy, 1, 8, colors.intMaderaOsc);
      }
      r.rect(s.x, fy, s.w, 1, tono(base, 1.12));
      r.rect(s.x, fy + 7, s.w, 1, tono(base, 0.72));
    }

    // --- Las paredes laterales y la de abajo ---
    r.rect(s.x - 8, s.y, 8, s.h + 8, colors.intPared);
    r.rect(s.x + s.w, s.y, 8, s.h + 8, colors.intPared);
    r.rect(s.x - 8, s.y + s.h, s.w + 16, 8, colors.intPared);

    // La puerta por la que entraste, en la pared de abajo.
    const p = def.puerta;
    r.rect(p.x - 12, p.y - 2, 24, 12, colors.puebloPuerta);
    r.rect(p.x - 10, p.y, 20, 10, '#241a13');
    r.rect(p.x - 12, p.y - 4, 24, 2, colors.intMadera);
  }

  /**
   * EL MUEBLE CON SU CARA DE ADELANTE: primero la cara, que baja hasta el
   * piso, y después el dibujo de siempre corrido hacia arriba, que pasa a ser
   * la tapa. Así no hubo que redibujar ningún mueble — el de antes ES la tapa.
   */
  function dibujarMueble(r, m) {
    const alto = ALTURA[m.tipo];
    if (!alto) { dibujarTapa(r, m); return; }
    const pie = pieDe(m);
    let x1, ancho;
    if (m.tipo === 'mesa') { x1 = m.x - 14; ancho = 28; }
    else if (m.tipo === 'poker') { x1 = m.x - m.r; ancho = m.r * 2; }
    else if (m.tipo === 'abrevadero') { x1 = m.x - m.w / 2; ancho = m.w; }
    else if (m.tipo === 'fardo') { x1 = m.x - 8; ancho = 16; }
    else { x1 = m.x; ancho = m.w; }

    /**
     * 🔻 Y LA TAPA SE ACHATA A LA MITAD, como todo lo horizontal en tres
     * cuartos. Con la tapa a su profundidad entera, el mostrador de la armería
     * medía de alto casi lo mismo que el armero: se le veían los pies por
     * encima, como si flotara detrás, y al barman la barra le tapaba todo
     * menos la cara. La tapa achatada es la que deja al que atiende visible
     * de la cintura para arriba (ver `piesDe`).
     *
     * Se achata DIBUJANDO la tapa más angosta y no escalando el canvas: un
     * canvas escalado a la mitad corre los bordes a medio pixel y la madera
     * sale borroneada.
     */
    const fondo = (m.tipo === 'mesa' ? 20 : m.tipo === 'poker' ? m.r * 2 : m.tipo === 'fardo' ? 10 : m.h) / 2 * (m.tipo === 'escritorio' ? 2 : 1);
    // (El escritorio va con la tapa entera: tiene los papeles encima y nadie atrás.)
    const tope = pie - alto;                // donde termina la cara y empieza la tapa

    if (m.tipo === 'mesa') {
      // Una mesa no es un bloque: es una tapa sobre cuatro patas.
      for (const px of [x1 + 2, x1 + ancho - 4]) r.rect(px, tope, 2, alto, colors.intMaderaOsc);
      r.rect(x1, tope, ancho, 2, tono(colors.intMadera, 0.7));
      r.rect(x1, tope - fondo, ancho, fondo, colors.intMadera);
      r.rect(x1, tope - fondo, ancho, 1.5, '#94663f');
      return;
    }
    if (m.tipo === 'poker') {
      // La redonda es un cilindro: la pata, el canto verde oscuro y la tapa.
      r.rect(m.x - 3, tope, 6, alto, colors.intMaderaOsc);
      const elipse = (cy, rx, ry, color) => {
        r.ctx.save();
        r.ctx.fillStyle = color;
        r.ctx.beginPath(); r.ctx.ellipse(m.x, cy, rx, ry, 0, 0, Math.PI * 2); r.ctx.fill();
        r.ctx.restore();
      };
      // La redonda NO se achata: el piso de adentro no lo está, y sus sillas están
      // repartidas alrededor del círculo entero. Achatada quedaban flotando lejos.
      const cy = tope - m.r;
      elipse(cy + 2.5, m.r, m.r, tono(colors.intPañoBorde, 0.6));
      elipse(cy, m.r, m.r, colors.intPañoBorde);
      elipse(cy, m.r - 3, m.r - 3, colors.intPaño);
      // Las cartas repartidas y unas fichas.
      r.rect(m.x - 12, cy - 3, 5, 7, colors.intPapel);
      r.rect(m.x - 5, cy - 4, 5, 7, colors.intPapel);
      r.rect(m.x + 6, cy + 2, 6, 2, colors.mapaSello);
      r.rect(m.x + 6, cy - 1, 6, 2, colors.text);
      return;
    }
    if (m.tipo === 'fardo') {
      // Un fardo de paja: la cara con sus dos hilos atados, y la tapa clara.
      r.rect(x1, tope, ancho, alto, '#a88f4a');
      for (const hx of [x1 + 4, x1 + ancho - 5]) r.rect(hx, tope, 1, alto, '#6e5a28');
      for (let py = tope + 2; py < pie; py += 2) r.rect(x1, py, ancho, 0.5, '#957c3c');
      r.rect(x1, tope - fondo, ancho, fondo, '#c2a75e');
      r.rect(x1, tope - fondo, ancho, 1, '#d8bf74');
      for (const hx of [x1 + 4, x1 + ancho - 5]) r.rect(hx, tope - fondo, 1, fondo, '#6e5a28');
      return;
    }

    r.rect(x1, tope, ancho, alto, tono(colors.intMadera, 0.72));
    for (let tx = x1 + 6; tx < x1 + ancho - 2; tx += 8) r.rect(tx, tope + 1, 1, alto - 2, tono(colors.intMadera, 0.55));
    r.rect(x1, tope, ancho, 1, tono(colors.intMadera, 1.15));
    r.rect(x1, pie - 1, ancho, 1, tono(colors.intMadera, 0.45));
    // La tapa: el mismo dibujo de siempre, pero con la mitad de fondo y
    // apoyada justo encima de la cara.
    const medio = m.tipo === 'abrevadero'
      ? { ...m, y: tope - fondo / 2, h: fondo }
      : { ...m, y: tope - fondo, h: fondo };
    dibujarTapa(r, medio);
  }

  function dibujarTapa(r, m) {
    switch (m.tipo) {
      case 'mostrador':
      case 'barra':
        r.rect(m.x, m.y, m.w, m.h, colors.intMadera);
        r.rect(m.x, m.y, m.w, 3, '#94663f');
        r.rect(m.x, m.y + m.h - 2, m.w, 2, colors.intMaderaOsc);
        break;

      case 'estanteArmas': {
        r.rect(m.x, m.y, m.w, m.h, colors.intMaderaOsc);
        r.rect(m.x, m.y, m.w, 2, colors.intMadera);
        /**
         * TRES SILUETAS QUE SE TURNAN, no una repetida. La primera versión
         * dibujaba el mismo caño una y otra vez —un patrón, no un estante— y
         * Santi lo notó jugando: "las armas deberían ser más diferentes".
         * Ahora alternan rifle (largo y fino), doble caño (dos caños juntos,
         * más corto) y revólver (corto, con la culata curva).
         */
        let i = 0;
        for (let px = m.x + 10; px < m.x + m.w - 8; px += 18, i++) {
          const gy = m.y + m.h - 9;
          const cual = i % 3;
          if (cual === 0) {
            r.rect(px, m.y + 4, 2, m.h - 8, colors.intMetal);
            r.rect(px - 2, gy, 6, 5, colors.intMadera);
          } else if (cual === 1) {
            r.rect(px - 2, m.y + 7, 2, m.h - 11, colors.intMetal);
            r.rect(px + 1, m.y + 7, 2, m.h - 11, colors.intMetal);
            r.rect(px - 3, gy, 8, 5, colors.intMaderaOsc);
          } else {
            r.rect(px, m.y + 11, 2, m.h - 17, colors.intMetal);
            r.rect(px - 3, gy - 3, 6, 8, colors.intMadera);
          }
        }
        break;
      }

      case 'botellas': {
        r.rect(m.x, m.y, m.w, m.h, colors.intMaderaOsc);
        r.rect(m.x, m.y + m.h - 2, m.w, 2, colors.intMadera);
        for (let i = m.x + 6; i < m.x + m.w - 4; i += 9) {
          const alto = 8 + ((i / 9) % 3) * 2;
          r.rect(i, m.y + m.h - 2 - alto, 4, alto, i % 18 === 0 ? '#6b8a5a' : '#8a6b3f');
        }
        break;
      }

      case 'pesebre': {
        r.rect(m.x, m.y, m.w, m.h, colors.intMaderaOsc);
        r.rect(m.x + 3, m.y + 3, m.w - 6, m.h - 6, '#6b5236');
        /**
         * 🔺 EL CABALLO DEL BOX era cuatro rectángulos. Ahora es el sprite,
         * parado y al mismo tamaño que en el campamento y el pueblo — y va
         * ANTES de los barrotes, que le tapan las patas: está adentro del box,
         * no pegado encima. Son los dos que se venden: el primer box tiene el
         * Criollo y el segundo el Mustang, con su pelaje.
         */
        if (m.caballo) {
          const cual = def.muebles.filter((z) => z.tipo === 'pesebre' && z.caballo).indexOf(m);
          const respira = Math.sin(scroll * 1.6 + m.x) * 0.4;
          dibujarAnimal(r, m.x + m.w / 2, m.y + m.h - 12 + respira, null, 0, 0, 0,
            cual === 1 ? 'mustang' : 'criollo', false, ESCALA_PARADO);
        }
        // Los barrotes del box, delante del animal.
        for (let i = m.x + 8; i < m.x + m.w - 6; i += 12) {
          r.rect(i, m.y + m.h - 16, 2, 16, colors.intMadera);
          r.rect(i, m.y + m.h - 16, 1, 16, tono(colors.intMadera, 1.2));
        }
        r.rect(m.x + 3, m.y + m.h - 17, m.w - 6, 2, colors.intMadera);
        break;
      }

      case 'mesa':
        r.rect(m.x - 14, m.y - 10, 28, 20, colors.intMadera);
        r.rect(m.x - 14, m.y - 10, 28, 3, '#94663f');
        r.rect(m.x - 3, m.y + 8, 6, 4, colors.intMaderaOsc);
        break;

      case 'silla':
        r.rect(m.x - 4, m.y - 4, 8, 8, colors.intMaderaOsc);
        r.rect(m.x - 4, m.y - 7, 8, 3, colors.intMadera);
        break;

      case 'poker': {
        // La única redonda y la única verde: se reconoce desde la puerta.
        r.ctx.save();
        r.ctx.fillStyle = colors.intPañoBorde;
        r.ctx.beginPath(); r.ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); r.ctx.fill();
        r.ctx.fillStyle = colors.intPaño;
        r.ctx.beginPath(); r.ctx.arc(m.x, m.y, m.r - 3, 0, Math.PI * 2); r.ctx.fill();
        r.ctx.restore();
        // Las cartas repartidas y unas fichas.
        r.rect(m.x - 12, m.y - 3, 5, 7, colors.intPapel);
        r.rect(m.x - 5, m.y - 4, 5, 7, colors.intPapel);
        r.rect(m.x + 6, m.y + 2, 6, 2, colors.mapaSello);
        r.rect(m.x + 6, m.y - 1, 6, 2, colors.text);
        break;
      }

      case 'escritorio':
        r.rect(m.x, m.y, m.w, m.h, colors.intMadera);
        r.rect(m.x, m.y, m.w, 3, '#94663f');
        r.rect(m.x + 8, m.y + 8, 16, 11, colors.intPapel);
        r.rect(m.x + m.w - 20, m.y + 7, 10, 12, colors.intMaderaOsc);
        break;

      case 'cartelera': {
        r.rect(m.x, m.y, m.w, m.h, colors.intMaderaOsc);
        r.rect(m.x + 2, m.y + 2, m.w - 4, m.h - 4, '#6b5236');
        // Los carteles de "se busca" clavados encima.
        for (let i = 0; i < 3; i++) {
          const px = m.x + 7 + i * 26;
          r.rect(px, m.y + 7, 20, 26, colors.intPapel);
          r.rect(px + 5, m.y + 12, 10, 9, colors.intMaderaOsc);
          r.rect(px + 3, m.y + 25, 14, 2, colors.intMaderaOsc);
        }
        break;
      }

      case 'celda': {
        /**
         * LA CELDA, TERCERA VERSIÓN — y las dos anteriores fallaban por lo
         * mismo: eran una TEXTURA, no un lugar.
         *
         * La primera cubría el rectángulo entero de rayitas. La segunda le
         * agregó paredes pero dejó el interior tapado de negro, así que
         * seguía leyéndose como un agujero. Santi, exacto: *"que no sea
         * negra, que pueda verse el piso a través de los barrotes, que por
         * cierto tendrían que estar mejor hechos"*.
         *
         * Las tres cosas que la arreglan:
         *
         *  1. **El interior es el MISMO piso de madera del cuarto**, apenas
         *     ensombrecido. Adentro de una celda hay piso, no vacío.
         *  2. **Los barrotes tienen aire entre medio**: 2 px de hierro cada 9,
         *     así que entre uno y otro se ve el piso de adentro. Eso es lo que
         *     los hace leer como barrotes y no como un rayado.
         *  3. **Cada barrote tiene brillo y sombra** (una columna clara y una
         *     oscura al lado): con eso deja de ser una línea plana y se ve
         *     redondo, de hierro.
         */
        const ix = m.x + 4, iy = m.y + 4, iw = m.w - 8, ih = m.h - 8;

        // 1. El interior: el piso del cuarto, en penumbra. Ni negro ni liso.
        r.ctx.save();
        r.ctx.globalAlpha = 0.34;
        r.rect(ix, iy, iw, ih, '#1a1008');
        r.ctx.restore();
        // Un poco de paja en el suelo, para que no sea una superficie muerta.
        for (let i = 0; i < 7; i++) {
          const px = ix + 8 + ((i * 23) % (iw - 16));
          const py = iy + 14 + ((i * 17) % (ih - 22));
          r.rect(px, py, 3, 1, '#6b5a34');
        }

        // El camastro contra la pared del fondo.
        r.rect(ix + 6, iy + 6, 30, 13, '#4a3628');
        r.rect(ix + 6, iy + 6, 30, 3, '#5f4530');
        r.rect(ix + 6, iy + 15, 30, 2, '#332318');

        // 2. Las tres paredes ciegas de chapa: fondo y los dos costados.
        r.rect(m.x, m.y, m.w, 4, colors.intPared);
        r.rect(m.x, m.y, m.w, 2, colors.intParedTop);
        r.rect(m.x, m.y, 4, m.h, colors.intPared);
        r.rect(m.x + m.w - 4, m.y, 4, m.h, colors.intPared);

        // 3. La reja, sólo en el frente. Rieles arriba y abajo, y los
        // barrotes entre ellos con aire de sobra para ver el piso detrás.
        const rejaY = m.y + m.h - 20;
        const puertaX = m.x + m.w - 32;
        r.rect(m.x + 4, rejaY, m.w - 8, 2, colors.intMetal);
        r.rect(m.x + 4, m.y + m.h - 5, m.w - 8, 3, colors.intMetal);
        for (let bx = m.x + 7; bx < m.x + m.w - 7; bx += 9) {
          if (bx >= puertaX && bx < puertaX + 22) continue;   // el hueco de la puerta
          r.rect(bx, rejaY, 2, 17, colors.intMetal);
          r.rect(bx, rejaY, 1, 17, '#8f99a6');                // brillo
          r.rect(bx + 2, rejaY, 1, 17, '#3f464f');            // sombra
        }
        // El marco de la puerta, y la puerta abierta hacia adentro.
        r.rect(puertaX - 2, rejaY, 2, 18, colors.intMetal);
        r.rect(puertaX + 22, rejaY, 2, 18, colors.intMetal);
        r.rect(puertaX + 2, rejaY - 12, 2, 13, colors.intMetal);
        r.rect(puertaX + 8, rejaY - 12, 2, 13, colors.intMetal);
        r.rect(puertaX + 1, rejaY - 12, 10, 2, colors.intMetal);
        break;
      }

      case 'barril':
        r.rect(m.x - 7, m.y - 9, 14, 18, colors.intMadera);
        r.rect(m.x - 7, m.y - 5, 14, 2, colors.intMaderaOsc);
        r.rect(m.x - 7, m.y + 3, 14, 2, colors.intMaderaOsc);
        break;

      case 'cajon':
        r.rect(m.x - 8, m.y - 6, 16, 12, colors.campCajon);
        r.rect(m.x - 8, m.y - 6, 16, 3, '#94663f');
        break;

      case 'fardo':
        r.rect(m.x - 8, m.y - 5, 16, 10, '#a88f4a');
        r.rect(m.x - 8, m.y - 5, 16, 2, '#c2a75e');
        r.rect(m.x - 8, m.y, 16, 1, '#8a7238');
        break;

      case 'alfombra':
        // Va debajo de todo (primera en el array de muebles): sólo marca una
        // zona del piso, nunca choca.
        r.rect(m.x - m.w / 2, m.y - m.h / 2, m.w, m.h, colors.intAlfombraBorde);
        r.rect(m.x - m.w / 2 + 3, m.y - m.h / 2 + 3, m.w - 6, m.h - 6, colors.intAlfombra);
        break;

      case 'trofeo':
        // Una cabeza de venado en la pared: astas simples y el hocico. Puro
        // relleno — es lo que hace que una pared vacía deje de ser un cartel
        // "acá falta algo".
        r.rect(m.x - 1, m.y - 2, 2, 8, colors.intMaderaOsc);
        r.rect(m.x - 6, m.y - 4, 12, 8, '#6b5236');
        r.line(m.x - 5, m.y - 4, m.x - 9, m.y - 12, colors.intMaderaOsc);
        r.line(m.x + 5, m.y - 4, m.x + 9, m.y - 12, colors.intMaderaOsc);
        break;

      case 'herramientas':
        // Un par de horquillas cruzadas colgadas de un gancho. El establo sin
        // esto era sólo pesebres y fardos; esto lo hace un lugar de trabajo.
        r.rect(m.x - 1, m.y - 8, 2, 16, colors.intMaderaOsc);
        r.line(m.x - 6, m.y - 6, m.x + 2, m.y + 2, colors.intMetal);
        r.line(m.x + 6, m.y - 6, m.x - 2, m.y + 2, colors.intMetal);
        break;

      case 'abrevadero':
        r.rect(m.x - m.w / 2, m.y - m.h / 2, m.w, m.h, colors.intMaderaOsc);
        r.rect(m.x - m.w / 2 + 3, m.y - m.h / 2 + 3, m.w - 6, m.h - 6, colors.window);
        r.rect(m.x - m.w / 2 + 3, m.y - m.h / 2 + 3, m.w - 6, 2, colors.windowGlass);
        break;

      case 'estufa':
        r.rect(m.x - 7, m.y - 10, 14, 20, colors.intMetal);
        r.rect(m.x - 7, m.y - 10, 14, 3, '#3a3f46');
        r.rect(m.x - 2, m.y - 14, 4, 4, colors.intMetal);
        // El fueguito, apenas visible por la rejilla.
        r.rect(m.x - 3, m.y + 2, 6, 3, colors.campBrasa);
        break;

      case 'lampara': {
        /**
         * UN FAROL DE PARED, no una lámpara flotando.
         *
         * Antes se dibujaba sobre el piso y parecía apoyada en el suelo
         * (Santi: "están como puestas en el piso"). El problema no era el
         * dibujo sino DÓNDE estaba: ahora va colgada en la franja de pared,
         * con su soporte saliendo del muro y la luz derramándose hacia abajo,
         * sobre el piso. Ahí sí se lee que está en alto.
         */
        const late = Math.sin(scroll * 5) * 0.5 + 0.5;
        // El soporte que sale de la pared.
        r.rect(m.x - 1, m.y - 9, 2, 7, colors.intMetal);
        r.rect(m.x - 5, m.y - 10, 10, 2, colors.intMetal);
        // El farol: caja de metal con el vidrio encendido adentro.
        r.rect(m.x - 5, m.y - 2, 10, 11, colors.intMetal);
        r.rect(m.x - 3, m.y, 6, 7, colors.intLampara);
        r.rect(m.x - 3, m.y, 6, 2, '#fff0c0');
        r.rect(m.x - 5, m.y + 9, 10, 2, '#3a3f46');
        // La luz cayendo sobre el piso, más ancha abajo que arriba.
        r.ctx.save();
        r.ctx.globalAlpha = 0.06 + late * 0.04;
        r.ctx.fillStyle = colors.intLampara;
        r.ctx.beginPath(); r.ctx.arc(m.x, m.y + 30, 32, 0, Math.PI * 2); r.ctx.fill();
        r.ctx.restore();
        break;
      }
    }
  }

  /** Una sombra achatada en el piso, como la de todo el resto del juego. */
  function sombra(r, sx, sy, rx) {
    r.ctx.save();
    r.ctx.globalAlpha = 0.25;
    r.ctx.fillStyle = '#000';
    r.ctx.beginPath();
    r.ctx.ellipse(sx, sy, rx, rx * 0.4, 0, 0, Math.PI * 2);
    r.ctx.fill();
    r.ctx.restore();
  }

  /**
   * 🔺 LA GENTE DE ADENTRO ERAN TRES RECTÁNGULOS, igual que la del pueblo y el
   * campamento. Ahora son personas del juego, cada una con su ropa (`ROPA_DE`).
   * Y TE MIRAN cuando te acercás: el barman parado detrás de la barra mirando
   * a la cámara mientras le hablás de costado se veía como un muñeco.
   */
  /**
   * DÓNDE TIENE LOS PIES CADA UNO. El que atiende detrás de un mostrador va
   * PEGADO a él, no a la distancia que lo ponen los datos: los datos dicen
   * dónde se lo puede ir a hablar, y ahí quedaba un paso atrás, flotando con
   * los pies a la vista por encima de la tapa. Pegado, el mostrador le tapa
   * las piernas y se lo ve de la cintura para arriba, que es como se ve a
   * cualquiera que atiende.
   */
  function piesDe(p) {
    if (p.sentado) return p.y + 3;
    const detras = def.muebles.find((m) => (m.tipo === 'barra' || m.tipo === 'mostrador')
      && p.x >= m.x && p.x <= m.x + m.w && m.y - p.y > 0 && m.y - p.y < 24);
    return detras ? detras.y + 4 : p.y + 5;
  }

  function dibujarAlguien(r, p) {
    const pies = piesDe(p);
    const cerca = Math.hypot(x - p.x, y - p.y) < 70;
    sombra(r, p.x, pies, 6);
    dibujarGente(r, {
      tipo: ROPA_DE[p.id] || 'pasajero',
      x: p.x,
      pies,
      angulo: cerca && !p.sentado ? Math.atan2(y - p.y, x - p.x) : Math.PI / 2,
      postura: p.sentado ? 'sentado' : 'pie',
    });
  }

  function dibujarJugador(r) {
    sombra(r, x, y + 5, 6);
    yo.x = x;
    yo.y = y;
    dibujarGente(r, {
      tipo: 'jugador',
      x,
      pies: y + 5,
      angulo: mirando,
      fase: faseDeAndar(yo),
      panuelo: true,
    });
  }

  function dibujarInterfaz(r) {
    r.text(def.nombre, r.width / 2, 12, colors.text);
    r.text(`$${gameState.money}`, r.width - 8, 12, colors.bagLoot, 'right');

    if (menu.activo()) {
      menu.render(r, colors, T.interior.dialogoAyuda);
      return;
    }

    // Sobre tu cabeza: corrido igual que el cuarto (ver `render`).
    const p = puntoCerca();
    const c = r.centro;
    if (p) r.text(T.interior.prompts[p.id], x + c.x, y + c.y - 16, colors.doorGlow);
    else if (enLaPuerta()) r.text(T.interior.salir, x + c.x, y + c.y - 16, colors.bagLoot);

    if (mensaje) {
      // Apiladas hacia arriba: la ultima linea queda siempre a la misma altura.
      const n = mensaje.lineas.length;
      mensaje.lineas.forEach((linea, i) => {
        r.text(linea, r.width / 2, r.height - 22 - (n - 1 - i) * 9, colors.text);
      });
    }
    else if (scroll < 8) r.text(T.interior.ayuda, r.width / 2, r.height - 10, colors.textDim);
  }

  return { enter, update, render };
}
