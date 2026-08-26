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
import { T } from '../text/es.js';

export function createInteriorScene(services) {
  const { input, scenes, hud, audio } = services;
  const colors = CONFIG.colors;

  let def, id, x, y, mensaje, scroll, dialogo;

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
    dialogo = null;
    scroll = 0;

    // Para depurar desde la consola: FORAJIDO.services.interior
    services.interior = {
      get id() { return id; },
      get x() { return x; },
      get y() { return y; },
      get cerca() { const p = puntoCerca(); return p ? p.id : null; },
      get mensaje() { return mensaje ? mensaje.texto : null; },
      get puntos() { return def.puntos; },
      get dialogo() { return dialogo ? dialogo.opciones.map((o) => o.id) : null; },
      get opcion() { return dialogo ? dialogo.opciones[dialogo.sel].id : null; },
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

  function decir(texto, life = 3.2) { mensaje = { texto, life }; }

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
  function abrirDialogo(p) {
    dialogo = { punto: p, opciones: p.dialogo, sel: 0 };
    mensaje = null;
    audio.play('cover');
  }

  function elegirOpcion() {
    const op = dialogo.opciones[dialogo.sel];
    const punto = dialogo.punto;
    dialogo = null;

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
    if (dialogo) { updateDialogo(); return; }

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
    }

    const p = puntoCerca();
    if (input.wasPressed('KeyE')) {
      if (p) usar(p);
      else if (enLaPuerta()) salir();
    }
    if (input.wasPressed('Escape')) salir();
  }

  function updateDialogo() {
    const n = dialogo.opciones.length;
    if (input.wasPressed('KeyW') || input.wasPressed('ArrowUp')) {
      dialogo.sel = (dialogo.sel - 1 + n) % n;
      audio.play('cock');
    }
    if (input.wasPressed('KeyS') || input.wasPressed('ArrowDown')) {
      dialogo.sel = (dialogo.sel + 1) % n;
      audio.play('cock');
    }
    if (input.wasPressed('KeyE') || input.wasPressed('Enter')) elegirOpcion();
    if (input.wasPressed('Escape')) { dialogo = null; audio.play('cover'); }
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
    dibujarSala(r);
    for (const m of def.muebles) dibujarMueble(r, m);
    // `sentado` sólo cambia el dibujo (una postura distinta): la detección es
    // la misma para cualquier `persona`, así que se pueden hablar igual.
    for (const p of def.puntos) {
      if (p.tipo !== 'persona') continue;
      if (p.sentado) dibujarSentado(r, p); else dibujarPersona(r, p);
    }
    dibujarJugador(r);

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
    r.clear('#120d0b');

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

    // --- El piso, en tablones alternados ---
    for (let fy = s.y; fy < s.y + s.h; fy += 8) {
      const claro = ((fy - s.y) / 8) % 2 === 0;
      r.rect(s.x, fy, s.w, 8, claro ? colors.intPiso : colors.intPisoAlt);
    }
    for (let fx = s.x + 20; fx < s.x + s.w; fx += 40) {
      r.rect(fx, s.y, 1, s.h, colors.intMaderaOsc);
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

  function dibujarMueble(r, m) {
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
        // Los barrotes del box.
        for (let i = m.x + 8; i < m.x + m.w - 6; i += 12) {
          r.rect(i, m.y + m.h - 16, 2, 16, colors.intMadera);
        }
        if (m.caballo) {
          const cx = m.x + m.w / 2;
          const cy = m.y + m.h / 2 - 4;
          const respira = Math.sin(scroll * 1.6 + m.x) * 0.5;
          r.rect(cx - 11, cy + respira, 22, 10, colors.horse);
          r.rect(cx - 11, cy + respira, 22, 3, colors.horseDark);
          r.rect(cx + 9, cy - 2 + respira, 6, 6, colors.horse);
          r.rect(cx - 13, cy - 1 + respira, 4, 5, colors.horseMane);
        }
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

  function dibujarPersona(r, p) {
    const paso = Math.sin(scroll * 3 + p.x) * 0.5;
    r.ctx.globalAlpha = 0.22;
    r.box(p.x, p.y + 6, 4, 2, '#000');
    r.ctx.globalAlpha = 1;
    r.box(p.x, p.y + paso, 4, 5, colors.puebloVecino);
    r.rect(p.x - 5, p.y - 6 + paso, 11, 2, colors.playerHat);
  }

  /** Los que están sentados en la cantina. No hacen nada, y hacen el lugar. */
  function dibujarSentado(r, s) {
    r.box(s.x, s.y - 4, 4, 4, colors.puebloVecino2);
    r.rect(s.x - 5, s.y - 10, 11, 2, colors.playerHat);
  }

  function dibujarJugador(r) {
    r.ctx.globalAlpha = 0.25;
    r.box(x, y + 6, 5, 2, '#000');
    r.ctx.globalAlpha = 1;
    r.box(x, y, 5, 5, colors.player);
    r.rect(x - 6, y - 6, 13, 3, colors.playerHat);
  }

  function dibujarInterfaz(r) {
    r.text(def.nombre, r.width / 2, 12, colors.text);
    r.text(`$${gameState.money}`, r.width - 8, 12, colors.bagLoot, 'right');

    if (dialogo) { dibujarDialogo(r); return; }

    const p = puntoCerca();
    if (p) r.text(T.interior.prompts[p.id], x, y - 16, colors.doorGlow);
    else if (enLaPuerta()) r.text(T.interior.salir, x, y - 16, colors.bagLoot);

    if (mensaje) r.text(mensaje.texto, r.width / 2, r.height - 22, colors.text);
    else if (scroll < 8) r.text(T.interior.ayuda, r.width / 2, r.height - 10, colors.textDim);
  }

  /**
   * EL CUADRO DE LA CHARLA.
   *
   * Es lo más parecido a un menú que hay en el juego, y por eso está atado a
   * una persona: no es una pantalla que se abre, es alguien que te preguntó
   * algo. Va abajo y angosto para que se siga viendo el local por detrás —
   * seguís parado adentro de la armería mientras hablás.
   */
  function dibujarDialogo(r) {
    const opciones = dialogo.opciones;
    const w = 184;
    const h = 22 + opciones.length * 13;
    const bx = Math.round(r.width / 2 - w / 2);
    const by = r.height - 18 - h;

    r.rect(bx, by, w, h, '#1a1410');
    r.rect(bx, by, w, 2, colors.intMadera);
    r.rect(bx, by + h - 2, w, 2, colors.intMaderaOsc);

    const pregunta = T.interior.preguntas[dialogo.punto.id] || '"¿Qué desea?"';
    r.text(pregunta, bx + 10, by + 11, colors.text, 'left');

    opciones.forEach((o, i) => {
      const oy = by + 26 + i * 13;
      const activo = i === dialogo.sel;
      if (activo) r.rect(bx + 6, oy - 5, w - 12, 11, '#33261b');
      r.text(
        (activo ? '▸ ' : '  ') + T.interior.opciones[o.id],
        bx + 12, oy,
        activo ? colors.doorGlow : colors.textDim, 'left'
      );
    });

    r.text(T.interior.dialogoAyuda, r.width / 2, r.height - 8, colors.textDim, 'center', { tam: 7 });
  }

  return { enter, update, render };
}
