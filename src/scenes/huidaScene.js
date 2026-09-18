/**
 * LA HUIDA — los 15 segundos después de saltar del tren, con la ley detrás.
 *
 * Ver data/huida.js para el pedido de Santi y los números. En corto:
 *
 *  - Te siguen LOS MISMOS jinetes que quedaban vivos en el asalto: lo que
 *    hiciste adentro se paga acá afuera.
 *  - Galopás hacia la derecha; W/A/S/D te mueven, el mouse apunta y el clic
 *    dispara, igual que en el asalto. [R] recarga.
 *  - CADA TIRO QUE TE PEGAN TE HACE SOLTAR UNA BOLSA. Nunca te agarran: lo peor
 *    que puede pasar es llegar con menos plata.
 *  - Se termina a los 15 segundos, o antes si no queda ninguno.
 *
 * No hay tren ni obstáculos: el suelo desfila y nada más. El mundo es la
 * pantalla (sin cámara), así que el mouse ya está en coordenadas del mundo.
 *
 * ⚠️ GRÁFICOS SIMPLES: las bolsas, el "!" del aviso y el panel son dibujo de
 * prueba (ver "por vestir" en NOTAS-DISENO.md).
 */

import { CONFIG } from '../data/config.js';
import { HUIDA as H } from '../data/huida.js';
import { WEAPONS, DEFAULT_WEAPON } from '../data/weapons.js';
import { caballoActual } from '../data/horse.js';
import { applyRaidResult, gameState } from '../state/gameState.js';
import { T } from '../text/es.js';
import { dibujarAnimal, dibujarJinete } from '../entities/caballo.js';
import { dibujarTendido } from '../entities/figura.js';
import { RIDERS } from '../data/riders.js';
import { sembrarDesierto } from '../world/desierto.js';
import { escalarColor } from '../world/trenTresCuartos.js';

export function createHuidaScene(services) {
  const { renderer, input, rng, scenes, hud, audio } = services;
  const colors = CONFIG.colors;

  let summary, caballo, arma;
  let yo, jinetes, balas, bolsas, caidos, carteles;
  let reloj, suelo, tiempo, dineroInicial, perdido, soltadas, derribados;
  let fin, temblor;

  /**
   * @param params.summary  lo que armó el asalto para la pantalla de
   *   resultados. Se le descuenta lo que se pierda acá y recién después se
   *   aplica (`applyRaidResult`).
   * @param params.jinetes  cuántos quedaban vivos.
   * @param params.arma / params.balas  el arma que tenías y cuántas balas le
   *   quedaban: saltar del tren no te recarga el revólver.
   */
  function enter(params = {}) {
    hud.hide();
    mostrarCursorDelSistema(false);
    summary = params.summary || { money: 0, kills: 0, outcome: 'escaped' };
    caballo = caballoActual(gameState);
    arma = params.arma || WEAPONS[DEFAULT_WEAPON];

    const W = renderer.width;
    yo = {
      x: W * 0.56,
      y: (H.cielo + renderer.height) / 2,
      rumbo: 0,
      pose: 0,
      invuln: 0,
      fireTimer: 0,
      balas: params.balas ?? arma.magazine,
      recargando: 0,
      fogonazo: 0,
    };

    jinetes = [];
    const n = Math.max(1, params.jinetes || 1);
    for (let i = 0; i < n; i++) jinetes.push(crearJinete(i, n));

    balas = [];
    bolsas = [];
    caidos = [];
    carteles = [];
    reloj = H.duracion;
    suelo = 0;
    tiempo = 0;
    dineroInicial = Math.max(0, summary.money || 0);
    perdido = 0;
    soltadas = 0;
    derribados = 0;
    fin = null;
    temblor = 0;

    const a = CONFIG.ambiente;
    audio.ambiente('galope', { cutoff: 420, q: 0.6, type: 'lowpass',
      gain: a.galopeVientoGain,
      respira: { profundidad: a.vientoProfundidad, cada: a.vientoCada } });

    // Para mirar y medir desde la consola: FORAJIDO.services.huida
    services.huida = {
      get yo() { return yo; },
      get jinetes() { return jinetes; },
      get balas() { return balas; },
      get reloj() { return reloj; },
      get perdido() { return perdido; },
      get soltadas() { return soltadas; },
      get derribados() { return derribados; },
      get dineroInicial() { return dineroInicial; },
      get fin() { return fin; },
    };
  }

  function exit() {
    audio.quitarAmbiente('galope');
    mostrarCursorDelSistema(true);
  }

  /**
   * Cada jinete tiene su CARRIL: un corrimiento vertical respecto de vos y una
   * distancia detrás. Repartidos arriba y abajo en abanico, así no se pisan y
   * te pueden encerrar de los dos lados.
   */
  function crearJinete(i, n) {
    const lado = i % 2 === 0 ? -1 : 1;
    const escalon = Math.ceil(i / 2);
    return {
      x: -30 - i * 12,
      y: yo.y + lado * (24 + escalon * 22),
      alive: true,
      health: RIDERS.ley.health,
      entra: H.jinetes.entraPrimero + i * H.jinetes.entraCada,
      dy: n === 1 ? 0 : lado * (18 + escalon * 26),
      atras: H.jinetes.distancia + i * H.jinetes.separacion,
      cooldown: H.jinetes.cadencia * 0.6 + rng.range(0, H.jinetes.cadenciaAzar),
      aimTimer: 0,
      aimDir: 0,
      hitFlash: 0,
      gallop: Math.random() * 6.28,
      fase: Math.random() * 6.28,
    };
  }

  // -------------------------------------------------------------- actualizar

  function update(dt) {
    tiempo += dt;
    suelo += H.velocidadSuelo * dt;
    temblor = Math.max(0, temblor - dt);
    actualizarCascos(dt);

    for (const c of carteles) { c.vida -= dt; c.y -= 12 * dt; }
    carteles = carteles.filter((c) => c.vida > 0);
    for (const b of bolsas) {
      b.vz += 260 * dt;
      b.z = Math.min(0, b.z + b.vz * dt);
    }

    if (fin) {
      fin.timer -= dt;
      moverJinetes(dt, true);
      if (fin.timer <= 0) terminar();
      return;
    }

    reloj -= dt;
    moverme(dt);
    disparar(dt);
    moverJinetes(dt, false);
    moverBalas(dt);

    const vivos = jinetes.filter((j) => j.alive).length;
    if (vivos === 0) empezarFin('limpio');
    else if (reloj <= 0) empezarFin('perdidos');
  }

  function moverme(dt) {
    const J = H.jugador;
    const dx = (input.isDown('KeyD') || input.isDown('ArrowRight') ? 1 : 0)
             - (input.isDown('KeyA') || input.isDown('ArrowLeft') ? 1 : 0);
    const dy = (input.isDown('KeyS') || input.isDown('ArrowDown') ? 1 : 0)
             - (input.isDown('KeyW') || input.isDown('ArrowUp') ? 1 : 0);
    const W = renderer.width;
    yo.x = Math.max(W * J.xMin, Math.min(W * J.xMax, yo.x + dx * J.velocidadX * dt));
    yo.y = Math.max(H.cielo + 22, Math.min(renderer.height - 12, yo.y + dy * J.velocidadY * dt));

    // El caballo gira hacia donde lo llevás, con la misma inercia del galope.
    const objetivo = dy * 0.5;
    yo.rumbo += (objetivo - yo.rumbo) * Math.min(1, 6 * dt);
    const tramo = 0.73 / 4;
    const crudo = yo.rumbo / tramo;
    if (Math.abs(crudo - yo.pose) > 0.75) yo.pose = Math.max(-4, Math.min(4, Math.round(crudo)));

    yo.invuln = Math.max(0, yo.invuln - dt);
    yo.fogonazo = Math.max(0, yo.fogonazo - dt);
  }

  /** El mismo gatillo del asalto: clic sostenido, [R] recarga, vacío recarga solo. */
  function disparar(dt) {
    yo.fireTimer -= dt;
    if (yo.recargando > 0) {
      yo.recargando -= dt;
      if (yo.recargando <= 0) yo.balas = arma.magazine;
      return;
    }
    if (input.wasPressed('KeyR') && yo.balas < arma.magazine) {
      yo.recargando = arma.reloadTime;
      return;
    }
    if (!input.mouse.down || yo.fireTimer > 0) return;
    if (yo.balas <= 0) { yo.recargando = arma.reloadTime; return; }

    const [ox, oy] = boca();
    const angulo = Math.atan2(input.mouse.y - oy, input.mouse.x - ox)
      + rng.range(-1, 1) * arma.spread * H.jugador.dispersionACaballo;
    balas.push({
      x: ox, y: oy,
      vx: Math.cos(angulo) * arma.bulletSpeed,
      vy: Math.sin(angulo) * arma.bulletSpeed,
      vida: 1.2, mia: true, danio: arma.damage,
    });
    yo.balas -= 1;
    yo.fireTimer = arma.fireRate;
    yo.fogonazo = 0.06;
    audio.play('playerShot');
  }

  /** De dónde sale tu tiro: a la altura del pecho del jinete. */
  function boca() {
    return [yo.x + 2, yo.y - 16];
  }

  function moverJinetes(dt, yendose) {
    const J = H.jinetes;
    for (const j of jinetes) {
      j.gallop += dt;
      j.hitFlash = Math.max(0, j.hitFlash - dt);
      if (!j.alive) continue;
      if (j.entra > 0) { j.entra -= dt; continue; }

      // Al final se quedan atrás: los perdiste.
      if (yendose) {
        j.x -= J.velocidad * 1.6 * dt;
        j.aimTimer = 0;
        continue;
      }

      // Mientras apunta no se mueve: el aviso es justo porque el tiro sale de
      // donde lo viste levantar el arma.
      if (j.aimTimer > 0) {
        j.aimTimer -= dt;
        if (j.aimTimer <= 0) tirar(j);
        continue;
      }

      const ondula = Math.sin(tiempo * 1.3 + j.fase) * 8;
      // Nunca detrás del borde: uno que no se ve no puede estar tirándote.
      const tx = Math.max(22 + (j.atras - H.jinetes.distancia) * 0.3, yo.x - j.atras);
      const ty = Math.max(H.cielo + 22, Math.min(renderer.height - 12, yo.y + j.dy + ondula));
      j.x += Math.sign(tx - j.x) * Math.min(Math.abs(tx - j.x), J.velocidad * dt);
      j.y += Math.sign(ty - j.y) * Math.min(Math.abs(ty - j.y), J.velocidad * 0.8 * dt);

      j.cooldown -= dt;
      const d = Math.hypot(yo.x - j.x, yo.y - j.y);
      if (j.cooldown <= 0 && d < J.alcance && j.x > 16) {
        j.aimTimer = J.apuntar;
        j.aimDir = Math.atan2((yo.y - 8) - (j.y - 14), yo.x - (j.x + 6));
        j.cooldown = J.cadencia + rng.range(0, J.cadenciaAzar);
      }
    }
  }

  function tirar(j) {
    const J = H.jinetes;
    const a = j.aimDir + rng.range(-1, 1) * J.dispersion;
    balas.push({
      x: j.x + 6, y: j.y - 14,
      vx: Math.cos(a) * J.velocidadBala,
      vy: Math.sin(a) * J.velocidadBala,
      vida: 1.4, mia: false,
    });
    audio.play('enemyShot');
  }

  function moverBalas(dt) {
    for (const b of balas) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vida -= dt;
      if (b.mia) {
        for (const j of jinetes) {
          if (!j.alive || j.entra > 0) continue;
          if (Math.abs(b.x - j.x) < 12 && Math.abs(b.y - (j.y - 8)) < 12) {
            b.vida = 0;
            pegarle(j, b.danio);
            break;
          }
        }
      } else if (yo.invuln <= 0 && Math.abs(b.x - yo.x) < 11 && Math.abs(b.y - (yo.y - 8)) < 11) {
        b.vida = 0;
        soltarBolsa();
      }
    }
    balas = balas.filter((b) => b.vida > 0 && b.x > -20 && b.x < renderer.width + 20
      && b.y > -20 && b.y < renderer.height + 20);
  }

  function pegarle(j, danio) {
    j.health -= danio;
    j.hitFlash = 0.12;
    audio.play('hitFlesh');
    if (j.health > 0) return;
    j.alive = false;
    derribados += 1;
    // Queda tirado en el SUELO, que sigue desfilando: se va quedando atrás.
    caidos.push({ gx: j.x + suelo, y: j.y });
    audio.play('kill');
    carteles.push({ x: j.x, y: j.y - 28, texto: T.huida.derribado, color: colors.bagLoot, vida: 1.4 });
  }

  /**
   * TE PEGARON: SOLTÁS UNA BOLSA. Todas del mismo tamaño (una fracción de lo
   * que sacaste del tren, no de lo que te queda), para que se puedan contar.
   * Sin plata no hay bolsa que soltar, y el tiro no te hace nada más.
   */
  function soltarBolsa() {
    yo.invuln = H.invulnerable;
    temblor = 0.25;
    audio.play('playerHurt');
    const queda = dineroInicial - perdido;
    const monto = Math.min(queda, Math.max(1, Math.round(dineroInicial * H.bolsaFraccion)));
    if (monto <= 0) {
      carteles.push({ x: yo.x, y: yo.y - 30, texto: T.huida.sinPlata, color: colors.textDim, vida: 1.2 });
      return;
    }
    perdido += monto;
    soltadas += 1;
    bolsas.push({ gx: yo.x + suelo - 6, y: yo.y + 4, z: -18, vz: -60 });
    carteles.push({ x: yo.x, y: yo.y - 30, texto: `−$${monto}`, color: colors.enemyAlert, vida: 1.4 });
  }

  function empezarFin(como) {
    fin = { como, timer: 1.8 };
    balas = balas.filter((b) => b.mia);
    audio.play('escape');
  }

  function terminar() {
    summary.money = Math.max(0, (summary.money || 0) - perdido);
    summary.huida = { jinetes: jinetes.length, derribados, bolsas: soltadas, perdido };
    // Un jinete derribado acá es un jinete derribado: cuenta como en el asalto.
    summary.kills = (summary.kills || 0) + derribados;
    applyRaidResult(summary);
    scenes.goTo('results', summary);
  }

  // Los cascos: la misma zancada que suena en el galope.
  let casco = 0;
  function actualizarCascos(dt) {
    casco -= dt;
    if (casco > 0) return;
    casco = CONFIG.ambiente.zancadaCada;
    audio.play('zancada');
  }

  function mostrarCursorDelSistema(visible) {
    const canvas = renderer.canvas || (renderer.ctx && renderer.ctx.canvas);
    if (canvas) canvas.style.cursor = visible ? '' : 'none';
  }

  // ----------------------------------------------------------------- dibujar

  function render(r) {
    const dia = gameState.esDeDia;
    const tinte = (hex) => (dia ? hex : escalarColor(hex, 0.32));
    const C = colors.cielo;

    r.ctx.save();
    if (temblor > 0) r.ctx.translate(rng.range(-2, 2), rng.range(-2, 2));

    r.clear(dia ? colors.desiertoDia : colors.desiertoNoche);
    sembrarDesierto(r, {
      x0: 0, y0: H.cielo, x1: r.width, y1: r.height + 10,
      desplaza: suelo, noche: !dia, colores: C,
      grandes: () => false,
    });

    // El cielo, con el horizonte y una cordillera baja.
    const [arriba, abajo] = dia ? [colors.puebloCielo, colors.puebloCieloHorizonte]
      : [C.nocheArriba, C.nocheHorizonte];
    r.cielo(0, 0, r.width, H.cielo, arriba, abajo, 6);
    for (let sx = 0; sx < r.width; sx += 2) {
      const u = sx + suelo * 0.03;
      const h = 0.5 + 0.3 * Math.sin(u * 0.012) + 0.18 * Math.sin(u * 0.035 + 1.7);
      const alto = Math.round(Math.max(0.1, h) * 12);
      r.rect(sx, H.cielo - alto, 2, alto, tinte(C.montanaLejos));
    }
    r.rect(0, H.cielo, r.width, 1, tinte(C.bruma));

    // Lo que quedó atrás en el suelo: los caídos y las bolsas.
    for (const c of caidos) dibujarTendido(r, c.gx - suelo, c.y + 4, { tipo: 'jineteLey', cinta: '#4a78b8' });
    for (const b of bolsas) dibujarBolsa(r, b.gx - suelo, b.y + b.z);

    // Por dónde tienen los pies: el de más abajo tapa al de más arriba.
    const cosas = [];
    for (const j of jinetes) {
      if (!j.alive || j.entra > 0) continue;
      cosas.push({ y: j.y, draw: () => dibujarLey(r, j, dia) });
    }
    cosas.push({ y: yo.y, draw: () => dibujarme(r, dia) });
    cosas.sort((a, b) => a.y - b.y);
    for (const c of cosas) c.draw();

    for (const b of balas) {
      r.rect(b.x - 1, b.y - 1, 3, 2, b.mia ? colors.bulletP : colors.bulletE);
    }
    for (const c of carteles) {
      r.ctx.globalAlpha = Math.min(1, c.vida * 2);
      r.text(c.texto, c.x, c.y, c.color);
    }
    r.ctx.globalAlpha = 1;

    r.ctx.restore();

    dibujarMira(r);
    dibujarPanel(r);
  }

  /**
   * EL JINETE DE LA LEY, el mismo de entities/rider.js, con dos diferencias: de
   * noche el caballo se apaga como el tuyo, y el brazo apunta HACIA VOS (en el
   * asalto apunta siempre hacia el tren).
   */
  function dibujarLey(r, j, dia) {
    r.ctx.globalAlpha = 0.25;
    r.box(j.x, j.y + 7, 11, 2, '#000');
    r.ctx.globalAlpha = 1;
    const T0 = 0.56;
    const zancada = { t: ((j.gallop % T0) + T0) % T0, T: T0 };
    const trote = Math.round(Math.cos((zancada.t / T0 - 0.15) * Math.PI * 2) * 1.2);
    const montura = dibujarAnimal(r, j.x, j.y, zancada, trote, 1, 0, null, !dia);
    const rebote = Math.cos((zancada.t / T0 - 0.25) * Math.PI * 2) * 0.6;
    dibujarJinete(r, montura.asiento.x, montura.asiento.y + rebote, 0, 2, {
      detalles: 'ley',
      destello: j.hitFlash > 0,
      estado: j.aimTimer > 0 ? 'alerta' : 'calma',
    }, montura);
    montura.adelante();

    if (j.aimTimer > 0) {
      const px = j.x + 6;
      const py = j.y - 14 + trote;
      r.line(px, py, px + Math.cos(j.aimDir) * 11, py + Math.sin(j.aimDir) * 11, '#d8cdbb');
      // ⚠️ SIMPLE: el aviso de que va a tirar. Por vestir.
      r.text('!', j.x, j.y - 36, colors.enemyAlert);
    }
  }

  function dibujarme(r, dia) {
    // Parpadea mientras no te pueden sacar otra bolsa, como en el galope.
    if (yo.invuln > 0 && Math.floor(yo.invuln * 20) % 2 === 0) return;
    const T0 = CONFIG.ambiente.zancadaCada;
    const zancada = { t: T0 - Math.max(0, casco), T: T0 };
    const trote = Math.round(Math.cos((zancada.t / T0 - 0.15) * Math.PI * 2) * 1.2);
    const rebote = Math.cos((zancada.t / T0 - 0.25) * Math.PI * 2) * 0.6;

    r.ctx.save();
    r.ctx.globalAlpha = 0.25;
    r.ctx.fillStyle = '#000';
    r.ctx.beginPath();
    r.ctx.ellipse(Math.round(yo.x), Math.round(yo.y + 7), 12, 2.5, yo.rumbo * 0.5, 0, Math.PI * 2);
    r.ctx.fill();
    r.ctx.restore();

    const montura = dibujarAnimal(r, yo.x, yo.y, zancada, trote, 1, yo.pose, caballo.id, !dia);
    dibujarJinete(r, montura.asiento.x, montura.asiento.y + rebote, yo.pose, 2, {}, montura);
    montura.adelante();

    if (yo.fogonazo > 0) {
      const [ox, oy] = boca();
      const a = Math.atan2(input.mouse.y - oy, input.mouse.x - ox);
      r.rect(ox + Math.cos(a) * 6 - 1.5, oy + Math.sin(a) * 6 - 1.5, 3, 3, colors.bulletP);
    }
  }

  /** ⚠️ SIMPLE: una bolsa es un bulto con un signo. Por vestir. */
  function dibujarBolsa(r, x, y) {
    r.rect(x - 3, y - 6, 7, 6, '#8a6a3a');
    r.rect(x - 1, y - 8, 3, 2, '#6a4f2a');
    r.text('$', x + 0.5, y - 2, colors.bagLoot);
  }

  /** El círculo dice la dispersión real a esa distancia, como en el asalto. */
  function dibujarMira(r) {
    const m = CONFIG.mira;
    const [ox, oy] = boca();
    const d = Math.hypot(input.mouse.x - ox, input.mouse.y - oy);
    const radio = Math.max(m.radioMin, Math.min(m.radioMax * 2,
      Math.tan(arma.spread * H.jugador.dispersionACaballo) * d));
    r.circle(input.mouse.x, input.mouse.y, radio, yo.recargando > 0 ? m.colorBloqueado : m.color, m.alpha);
  }

  function dibujarPanel(r) {
    const centro = r.width / 2;
    const fueraDeReloj = Math.max(0, Math.ceil(reloj));

    if (fin) {
      r.text(fin.como === 'limpio' ? T.huida.todosCaidos : T.huida.losPerdiste, centro, 60, colors.bagLoot);
    } else {
      r.text(T.huida.teSiguen(jinetes.filter((j) => j.alive).length), centro, 8, colors.enemyAlert);
      // La barra del reloj: se vacía hacia el centro.
      const ancho = 120;
      const lleno = ancho * Math.max(0, reloj) / H.duracion;
      r.rect(centro - ancho / 2, 14, ancho, 3, '#241c18');
      r.rect(centro - lleno / 2, 14, lleno, 3, colors.doorGlow);
      r.text(`${fueraDeReloj}s`, centro + ancho / 2 + 10, 17, colors.textDim);
    }

    r.text(`$${Math.max(0, dineroInicial - perdido)}`, 6, 9, colors.bagLoot, 'left');
    if (soltadas > 0) r.text(T.huida.bolsas(soltadas), 6, 19, colors.enemyAlert, 'left');

    const municion = yo.recargando > 0 ? T.huida.recargando
      : `${arma.short} ${'●'.repeat(yo.balas)}${'○'.repeat(Math.max(0, arma.magazine - yo.balas))}`;
    r.text(municion, r.width - 6, 9, yo.recargando > 0 ? colors.enemyAlert : colors.textDim, 'right');

    if (tiempo < 4 && !fin) r.text(T.huida.teclas, centro, r.height - 7, colors.textDim);
  }

  return { enter, exit, update, render };
}
