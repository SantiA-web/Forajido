/**
 * LA HUIDA — después de saltar del tren, con la ley detrás.
 *
 * Ver data/huida.js para el pedido de Santi y los números. En corto:
 *
 *  - Te siguen LOS MISMOS jinetes que quedaban vivos en el asalto: lo que
 *    hiciste adentro se paga acá afuera.
 *  - TODOS GALOPAN. Tu caballo va siempre a fondo y cada jinete al suyo: la
 *    diferencia decide si se acercan o se quedan. Cuando uno queda a
 *    `perdida` detrás, lo perdiste. Se termina cuando no queda ninguno
 *    siguiéndote, porque los perdiste o porque los tiraste.
 *  - W/S esquivan y [A] frena (para que se te pongan al costado). El mouse
 *    apunta, el clic dispara, el clic derecho cierra la mira y [R] recarga,
 *    igual que en el asalto. Tirar para atrás se puede, pero cuesta puntería
 *    y el caballo se tuerce solo.
 *  - CADA TIRO QUE TE PEGAN TE HACE SOLTAR UNA BOLSA. Nunca te agarran: lo peor
 *    que puede pasar es llegar con menos plata.
 *  - Los obstáculos del galope cuestan distancia: chocar te frena y se te
 *    acercan. Ellos también chocan.
 *
 * Vas siempre en el mismo lugar de la pantalla, y lo demás se mueve contra
 * vos: el suelo desfila a lo que corre tu caballo (`suelo`), y cada jinete se
 * corre según la diferencia entre su caballo y el tuyo. Así el mouse ya está
 * en coordenadas del mundo.
 *
 * ⚠️ GRÁFICOS SIMPLES: las bolsas, el "!" del aviso y el panel son dibujo de
 * prueba (ver "por vestir" en NOTAS-DISENO.md).
 */

import { CONFIG } from '../data/config.js';
import { HUIDA as H } from '../data/huida.js';
import { WEAPONS, DEFAULT_WEAPON } from '../data/weapons.js';
import { caballoActual, HORSES, APROXIMACION as A } from '../data/horse.js';
import { applyRaidResult, gameState } from '../state/gameState.js';
import { T } from '../text/es.js';
import { GOLPES, dibujarAnimal, dibujarJinete } from '../entities/caballo.js';
import { dibujarTendido } from '../entities/figura.js';
import { RIDERS } from '../data/riders.js';
import { sembrarDesierto } from '../world/desierto.js';
import { dibujarObstaculoDesierto } from '../world/obstaculosDesierto.js';
import { crearPolvo } from '../world/polvoDeCascos.js';
import { drawParallax, drawSpeedLines } from '../engine/parallax.js';
import { escalarColor } from '../world/trenTresCuartos.js';

export function createHuidaScene(services) {
  const { renderer, input, rng, scenes, hud, audio } = services;
  const colors = CONFIG.colors;

  let summary, caballo, arma, prueba;
  let yo, jinetes, balas, bolsas, caidos, carteles, obstaculos, proximoObstaculo;
  let suelo, tiempo, dineroInicial, perdido, soltadas, derribados;
  let fin, temblor, avisoCansancio, ultimoGrito;
  /** El polvo de los cascos: el mismo del galope (world/polvoDeCascos.js). */
  const polvo = crearPolvo(colors.polvo);
  /** Cuánto se sacude la cámara ahora, y el balanceo del galope. */
  let bamboleo;

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
    // `caballo` y `prueba` los manda el atajo de prueba del campamento: probar
    // cualquier caballo sin tenerlo, y sin que el resultado cuente.
    caballo = HORSES[params.caballo] || caballoActual(gameState);
    prueba = !!params.prueba;
    arma = params.arma || WEAPONS[DEFAULT_WEAPON];

    const W = renderer.width;
    yo = {
      x: W * H.jugador.x,
      vel: caballo.sprintSpeed,
      y: (H.cielo + renderer.height) / 2,
      rumbo: 0,
      pose: 0,
      invuln: 0,
      fireTimer: 0,
      balas: params.balas ?? arma.magazine,
      recargando: 0,
      fogonazo: 0,
      choque: 0,
      frena: false,
      apuntado: 0,
      // El caballo que se tuerce solo mientras mirás para atrás.
      desvio: 0,
      desvioDir: 0,
      proximoDesvio: 0,
    };

    jinetes = [];
    const n = Math.max(1, params.jinetes || 1);
    for (let i = 0; i < n; i++) jinetes.push(crearJinete(i, n));

    balas = [];
    bolsas = [];
    caidos = [];
    carteles = [];
    obstaculos = [];
    suelo = 0;
    proximoObstaculo = W + H.obstaculos.primero;
    sembrarObstaculos();
    tiempo = 0;
    dineroInicial = Math.max(0, summary.money || 0);
    perdido = 0;
    soltadas = 0;
    derribados = 0;
    fin = null;
    temblor = 0;
    avisoCansancio = false;
    ultimoGrito = -99;
    polvo.limpiar();
    bamboleo = 0;

    const a = CONFIG.ambiente;
    audio.ambiente('galope', { cutoff: 420, q: 0.6, type: 'lowpass',
      gain: a.galopeVientoGain,
      respira: { profundidad: a.vientoProfundidad, cada: a.vientoCada } });

    // Para mirar y medir desde la consola: FORAJIDO.services.huida
    services.huida = {
      get yo() { return yo; },
      get jinetes() { return jinetes; },
      get balas() { return balas; },
      get tiempo() { return tiempo; },
      get perdido() { return perdido; },
      get soltadas() { return soltadas; },
      get derribados() { return derribados; },
      get dineroInicial() { return dineroInicial; },
      get fin() { return fin; },
      get obstaculos() { return obstaculos; },
      get suelo() { return suelo; },
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
    const J = H.jinetes;
    return {
      x: yo.x - J.distanciaInicial - i * J.separacionInicial,
      y: yo.y + lado * (24 + escalon * 22),
      alive: true,
      perdido: false,
      health: H.jinetes.vida ?? RIDERS.ley.health,   // ver `vida` en data/huida.js
      entra: 0,
      // Cada uno con su caballo, un poco más rápido o más lento que el resto.
      vel: J.velocidad + rng.range(-J.variacion, J.variacion),
      // Uno solo va un poco abajo tuyo: si frenás se te pone al costado, no encima.
      dy: n === 1 ? 34 : lado * (30 + escalon * 26),
      cooldown: H.jinetes.cadencia * 0.6 + rng.range(0, H.jinetes.cadenciaAzar),
      aimTimer: 0,
      aimDir: 0,
      hitFlash: 0,
      gallop: Math.random() * 6.28,
      fase: Math.random() * 6.28,
      choque: 0,
      esquiva: null,
      choques: 0,
    };
  }

  // -------------------------------------------------------------- actualizar

  function update(dt) {
    tiempo += dt;
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

    // El aviso de que sus caballos empiezan a aflojar, una sola vez.
    const C = H.jinetes.cansancio;
    if (!avisoCansancio && tiempo >= C.desde && siguiendo().length > 0) {
      avisoCansancio = true;
      carteles.push({ x: renderer.width / 2, y: 70, texto: T.huida.aflojan, color: colors.bagLoot, vida: 2.4 });
    }

    polvo.actualizar(dt, suelo);
    bamboleo += dt;
    sembrarObstaculos();
    moverme(dt);
    suelo += yo.vel * dt;
    disparar(dt);
    moverJinetes(dt, false);
    moverBalas(dt);

    if (siguiendo().length === 0 || tiempo >= H.tope) {
      empezarFin(derribados === jinetes.length ? 'limpio' : 'perdidos');
    }
  }

  /** Los que todavía te siguen: vivos y sin perder. */
  function siguiendo() {
    return jinetes.filter((j) => j.alive && !j.perdido);
  }

  /** Lo que corre un caballo ahora: a fondo, o casi parado si chocó. */
  function velocidadDe(fondo, choque) {
    return choque > 0 ? fondo * A.choqueFactor : fondo;
  }

  /**
   * LO QUE LE QUEDA AL CABALLO DE UN JINETE. Hasta `cansancio.desde` va a lo
   * suyo; de ahí en más afloja hasta `cansancio.velocidad`, y ahí es cuando el
   * que nunca disparó por fin los deja atrás.
   */
  function velocidadDelJinete(j) {
    const C = H.jinetes.cansancio;
    const t = Math.max(0, Math.min(1, (tiempo - C.desde) / C.entra));
    return j.vel + (C.velocidad - j.vel) * t;
  }

  function moverme(dt) {
    const J = H.jugador;
    const dy = (input.isDown('KeyS') || input.isDown('ArrowDown') ? 1 : 0)
             - (input.isDown('KeyW') || input.isDown('ArrowUp') ? 1 : 0);
    yo.frena = input.isDown('KeyA') || input.isDown('ArrowLeft');
    // El clic derecho cierra la mira en `tiempoCierre`, igual que en el asalto.
    const paso = dt / CONFIG.mira.tiempoCierre;
    yo.apuntado = input.mouse.right ? Math.min(1, yo.apuntado + paso) : Math.max(0, yo.apuntado - paso);
    const manejo = 1 - (1 - J.manejoApuntando) * yo.apuntado;
    desviarse(dt);
    if (yo.choque > 0) {
      // Chocaste: el caballo casi se para y no lo podés manejar. Mismo precio
      // que en el galope, pero acá se paga en distancia: se te acercan.
      yo.choque -= dt;
    } else {
      const tuerce = yo.desvio > 0 ? yo.desvioDir * J.atras.desvioVelocidad : 0;
      yo.y = Math.max(H.cielo + 22, Math.min(renderer.height - 12, yo.y + (dy * J.velocidadY * manejo + tuerce) * dt));
      const ob = chocaCon(yo.x, yo.y);
      if (ob) {
        ob.golpeado = true;
        yo.choque = A.obstaculoFrenado;
        audio.play('hitWall');
        audio.play('relincho');
        carteles.push({ x: yo.x, y: yo.y - 30, texto: T.ride.choque, color: colors.enemyAlert, vida: 1 });
      }
    }

    // [A] frena a lo que frena tu caballo: para que se te pongan al costado.
    yo.vel = velocidadDe(yo.frena ? caballo.brakeSpeed : caballo.sprintSpeed, yo.choque);

    // El caballo gira hacia donde lo llevás, con la misma inercia del galope.
    const objetivo = (dy + (yo.desvio > 0 ? yo.desvioDir * 0.6 : 0)) * 0.5;
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
    const angulo = haciaDondeApunto()
      + rng.spreadDeTiro(dispersionAhora(), CONFIG.mira.fallaChance, CONFIG.mira.fallaMultiplicador);
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

  /** Hacia dónde apuntás: al mouse, para cualquier lado. */
  function haciaDondeApunto() {
    const [ox, oy] = boca();
    return Math.atan2(input.mouse.y - oy, input.mouse.x - ox);
  }

  /**
   * CUÁNTO TE PASASTE DEL GIRO CÓMODO: 0 adentro (`giroDerecha` /
   * `giroIzquierda`), 1 derecho hacia atrás, y en el medio de a poco.
   */
  function cuantoAtras() {
    const g = (haciaDondeApunto() * 180) / Math.PI;
    const tope = g >= 0 ? H.jugador.giroDerecha : H.jugador.giroIzquierda;
    const pasado = Math.abs(g) - tope;
    return pasado <= 0 ? 0 : Math.min(1, pasado / (180 - tope));
  }

  /**
   * Tu dispersión ahora: la del arma (la apuntada si tenés el clic derecho),
   * por lo que se pierde a caballo, y más si mirás para atrás.
   */
  function dispersionAhora() {
    const t = cuantoAtras();
    const suelta = arma.spread;
    const apuntada = arma.spreadApuntado ?? suelta;
    const base = suelta + (apuntada - suelta) * yo.apuntado;
    return base * H.jugador.dispersionACaballo * (1 + t * (H.jugador.atras.dispersionMax - 1));
  }

  /**
   * NO VES ADELANTE: mientras apuntás pasado el giro cómodo, el caballo se
   * tuerce solo cada tanto, un segundo, para arriba o para abajo. Mirando
   * adelante no pasa nunca: el reloj se reinicia.
   */
  function desviarse(dt) {
    const T = H.jugador.atras;
    yo.desvio = Math.max(0, yo.desvio - dt);
    if (cuantoAtras() <= 0 || fin) { yo.proximoDesvio = T.desvioCada + rng.range(0, T.desvioAzar); return; }
    yo.proximoDesvio -= dt;
    if (yo.proximoDesvio > 0) return;
    yo.desvio = T.desvioDura;
    yo.desvioDir = rng.chance(0.5) ? 1 : -1;
    yo.proximoDesvio = T.desvioDura + T.desvioCada + rng.range(0, T.desvioAzar);
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
      if (!j.alive || j.perdido) continue;

      // Al final se quedan atrás del todo.
      if (yendose) {
        j.x -= 200 * dt;
        j.aimTimer = 0;
        continue;
      }

      /**
       * TODOS GALOPAN: el jinete se corre en la pantalla según la diferencia
       * entre su caballo y el tuyo. Más lento que vos, se va quedando; si
       * chocás, se te viene encima (hasta `distanciaMinima`: va detrás tuyo,
       * no te pasa).
       */
      j.x += (velocidadDe(velocidadDelJinete(j), j.choque) - yo.vel) * dt;
      j.x = Math.min(j.x, yo.x - J.distanciaMinima);
      if (yo.x - j.x > J.perdida) {
        j.perdido = true;
        carteles.push({ x: 40, y: j.y - 20, texto: T.huida.seQuedo, color: colors.bagLoot, vida: 1.6 });
        continue;
      }

      // Si se la comió, igual que vos: se frena, queda atrás y no tira.
      if (j.choque > 0) {
        j.choque -= dt;
        j.aimTimer = 0;
        continue;
      }

      // Mientras apunta no se corre para el costado: el aviso es justo porque
      // el tiro sale de donde lo viste levantar el arma.
      if (j.aimTimer > 0) {
        j.aimTimer -= dt;
        if (j.aimTimer <= 0) tirar(j);
        chocarJinete(j);
        continue;
      }

      const ondula = Math.sin(tiempo * 1.3 + j.fase) * 8;
      let ty = Math.max(H.cielo + 22, Math.min(renderer.height - 12, yo.y + j.dy + ondula));
      ty = esquivar(j, ty);
      /**
       * AL COSTADO TUYO DEJAN LUGAR: si frenás se te ponen a la par, y a la par
       * no se te pueden subir encima. Si su carril queda pegado a vos (por el
       * borde del campo o por esquivar algo), se corren al lado que haya.
       */
      const SEPARA = 30;
      if (yo.x - j.x < 50 && Math.abs(ty - yo.y) < SEPARA) {
        const abajo = yo.y + SEPARA <= renderer.height - 12;
        const arriba = yo.y - SEPARA >= H.cielo + 22;
        ty = (ty >= yo.y && abajo) || !arriba ? yo.y + SEPARA : yo.y - SEPARA;
      }
      j.y += Math.sign(ty - j.y) * Math.min(Math.abs(ty - j.y), J.velocidadLateral * dt);
      chocarJinete(j);

      j.cooldown -= dt;
      const d = Math.hypot(yo.x - j.x, yo.y - j.y);
      if (j.cooldown <= 0 && d < J.alcance && j.x > 16) {
        // Cada tanto uno grita al levantar el arma: la ley avisa antes de tirar.
        if (tiempo - ultimoGrito > J.gritoCada && rng.chance(J.chanceGrito)) {
          ultimoGrito = tiempo;
          audio.play('gritoLey');
        }
        j.aimTimer = J.apuntar;
        j.aimDir = Math.atan2((yo.y - 8) - (j.y - 14), yo.x - (j.x + 6));
        j.cooldown = J.cadencia + rng.range(0, J.cadenciaAzar);
      }
    }
    if (!yendose) separarJinetes();
  }

  /**
   * NO SE MONTAN UNO ENCIMA DEL OTRO. Cada uno tiene su carril, pero pegado a
   * un borde del campo los carriles se aplastan contra el borde y quedaban tres
   * caballos en el mismo lugar. Si dos se pisan, el de atrás le cede el paso:
   * se queda `SEPARA_X` detrás del de adelante.
   */
  function separarJinetes() {
    const SEPARA_X = 36;
    const SEPARA_Y = 24;
    const activos = siguiendo().sort((a, b) => b.x - a.x);
    for (let i = 1; i < activos.length; i++) {
      const atras = activos[i];
      for (let k = 0; k < i; k++) {
        const adelante = activos[k];
        if (Math.abs(adelante.y - atras.y) < SEPARA_Y && adelante.x - atras.x < SEPARA_X) {
          atras.x = adelante.x - SEPARA_X;
        }
      }
    }
  }

  // ------------------------------------------------------------ obstáculos

  /**
   * LOS OBSTÁCULOS, SEMBRADOS ADELANTE. Viven en coordenadas del SUELO (`gx`),
   * igual que en el galope: el suelo desfila y ellos con él. Uno cada
   * `obstaculoCada` de suelo, a cualquier altura del campo; los que ya quedaron
   * atrás se tiran.
   */
  function sembrarObstaculos() {
    const tipos = ['roca', 'arbusto', 'cactus', 'monticulo'];
    while (proximoObstaculo < suelo + renderer.width + 40) {
      obstaculos.push({
        gx: proximoObstaculo + rng.range(-30, 30),
        y: rng.range(H.cielo + 26, renderer.height - 14),
        tipo: tipos[rng.int(0, tipos.length - 1)],
        golpeado: false,
      });
      proximoObstaculo += A.obstaculoCada;
    }
    obstaculos = obstaculos.filter((ob) => ob.gx - suelo > -40);
  }

  function radioDe(ob) {
    return A.obstaculoRadios[ob.tipo] ?? A.obstaculoRadio;
  }

  /** La misma cuenta del galope: a menos de radio + 6 del centro, chocaste. */
  function chocaCon(x, y) {
    for (const ob of obstaculos) {
      if (ob.golpeado) continue;
      const ox = ob.gx - suelo;
      const radio = radioDe(ob);
      if (Math.abs(ox - x) > radio + 14) continue;
      if (Math.hypot(ox - x, ob.y - y) < radio + 6) return ob;
    }
    return null;
  }

  function chocarJinete(j) {
    const ob = chocaCon(j.x, j.y);
    if (!ob) return;
    ob.golpeado = true;
    j.choque = A.obstaculoFrenado;
    j.choques += 1;
    j.esquiva = null;
    audio.play('hitWall');
  }

  /**
   * LOS JINETES TAMBIÉN ESQUIVAN *(pedido de Santi)*. Miran `mira` px adelante:
   * si viene algo por su carril, se corren para el lado que tengan más libre y
   * se quedan corridos hasta pasarlo. No es infalible, y a propósito: si lo ven
   * tarde, o si están apuntando (apuntando no se mueven), se la comen.
   */
  function esquivar(j, ty) {
    const O = H.obstaculos;
    if (j.esquiva && j.esquiva.ob.gx - suelo < j.x - 12) j.esquiva = null;
    if (!j.esquiva) {
      for (const ob of obstaculos) {
        if (ob.golpeado) continue;
        const ox = ob.gx - suelo;
        if (ox < j.x - 4 || ox - j.x > O.mira) continue;
        const pasa = radioDe(ob) + O.margen;
        if (Math.abs(ob.y - ty) >= pasa && Math.abs(ob.y - j.y) >= pasa) continue;
        const arriba = ob.y - pasa;
        const abajo = ob.y + pasa;
        const puedeArriba = arriba > H.cielo + 22;
        const puedeAbajo = abajo < renderer.height - 12;
        const porArriba = puedeArriba && (!puedeAbajo || Math.abs(j.y - arriba) < Math.abs(j.y - abajo));
        j.esquiva = { ob, y: porArriba ? arriba : abajo };
        break;
      }
    }
    return j.esquiva ? j.esquiva.y : ty;
  }

  function tirar(j) {
    const J = H.jinetes;
    // Parejo para todos, como en el asalto: a ellos también se les va el pulso.
    const a = j.aimDir + rng.spreadDeTiro(J.dispersion, CONFIG.mira.fallaChance, CONFIG.mira.fallaMultiplicador);
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
      } else if (!b.silbo && Math.abs(b.x - yo.x) < 26 && Math.abs(b.y - (yo.y - 8)) < 26) {
        // Te pasó cerca y no te dio: el silbido es el que te avisa que casi.
        b.silbo = true;
        audio.play('balaSilba');
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
    // El caballo sin jinete se queja y sigue de largo.
    audio.play('relincho');
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
    // Una prueba no suma plata, ni recompensa, ni asaltos: sólo muestra cómo te fue.
    if (prueba) summary.prueba = `el ${caballo.name} y el ${arma.name}`;
    else applyRaidResult(summary);
    scenes.goTo('results', summary);
  }

  // Los cascos: la misma zancada que suena en el galope.
  let casco = 0;
  function actualizarCascos(dt) {
    casco -= dt;
    if (casco > 0) return;
    casco = CONFIG.ambiente.zancadaCada;
    audio.play('zancada');
    if (fin) return;

    /**
     * Y CADA ZANCADA LEVANTA POLVO, la tuya y la de ellos. Seis caballos a
     * fondo sobre tierra seca es media pantalla de tierra en el aire, que es
     * lo que faltaba para que se sienta una persecución y no una carrera
     * prolija *(Santi: "¿por qué todavía no lo siento como una persecución
     * real del Oeste?")*.
     *
     * Los jinetes levantan menos (3 bocanadas por casco contra 5): son seis
     * caballos, y con la misma cantidad que vos la pantalla se tapaba.
     */
    const pisadas = [[GOLPES.traseraAlla, -8], [GOLPES.traseraAca, -6], [GOLPES.delanteraAca, 6]];
    polvo.sembrar({ x: yo.x, y: yo.y, suelo, rumbo: yo.rumbo, fuerza: yo.choque > 0 ? 0.3 : 1, pisadas });
    for (const j of siguiendo()) {
      if (j.x < -20 || j.x > renderer.width + 20) continue;
      polvo.sembrar({ x: j.x, y: j.y, suelo, fuerza: 0.8, pisadas, cuantas: 3 });
    }
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
    /**
     * LA CÁMARA SE MUEVE: el balanceo del galope siempre (sube y baja con la
     * zancada, como el lomo), el sacudón cuando te pegan, y un tirón cuando
     * chocás. Antes estaba clavada y por eso parecía una cinta de correr.
     */
    const zancadaT = CONFIG.ambiente.zancadaCada;
    const vaivén = Math.sin((bamboleo / zancadaT) * Math.PI * 2) * 0.9
      + Math.sin((bamboleo / zancadaT) * Math.PI * 4) * 0.4;
    r.ctx.translate(yo.choque > 0 ? -3 : 0, vaivén);
    if (temblor > 0) r.ctx.translate(rng.range(-2.5, 2.5), rng.range(-2.5, 2.5));

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

    /**
     * LAS RAYAS DE VELOCIDAD Y LAS MATAS DE ADELANTE, las mismas del galope
     * (engine/parallax.js). Las matas pasan pegadas a la cámara, abajo de
     * todo: son lo que de verdad hace sentir a qué velocidad vas, porque
     * están cerca.
     */
    const P = CONFIG.parallax;
    drawSpeedLines(r, suelo, r.width, {
      ...P.rayas, velocidad: P.rayas.velocidad * P.velocidad,
      desde: H.cielo + 10, hasta: r.height - 6,
    });

    // Lo que quedó atrás en el suelo: los caídos y las bolsas.
    for (const c of caidos) dibujarTendido(r, c.gx - suelo, c.y + 4, { tipo: 'jineteLey', cinta: '#4a78b8' });
    for (const b of bolsas) dibujarBolsa(r, b.gx - suelo, b.y + b.z);

    // Por dónde tienen los pies: el de más abajo tapa al de más arriba.
    const cosas = [];
    for (const ob of obstaculos) {
      const ox = ob.gx - suelo;
      if (ox < -20 || ox > r.width + 20) continue;
      cosas.push({ y: ob.y, draw: () => dibujarObstaculoDesierto(r, ob, ox, radioDe(ob), !dia) });
    }
    for (const j of jinetes) {
      if (!j.alive || j.perdido) continue;
      cosas.push({ y: j.y, draw: () => dibujarLey(r, j, dia) });
    }
    cosas.push({ y: yo.y, draw: () => dibujarme(r, dia) });
    cosas.sort((a, b) => a.y - b.y);
    // El polvo va detrás de todos los caballos: lo levantaron al pasar.
    polvo.dibujar(r, suelo, !dia);
    for (const c of cosas) c.draw();

    for (const b of balas) {
      r.rect(b.x - 1, b.y - 1, 3, 2, b.mia ? colors.bulletP : colors.bulletE);
    }
    // Las matas de adelante van ENCIMA de todo: pasan entre vos y la cámara.
    drawParallax(r, P.capas.map((c, i) => ({
      ...c, v: c.v * P.velocidad, y: r.height - 12 + i * 4,
    })), suelo, r.width);

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
      const a = haciaDondeApunto();
      r.rect(ox + Math.cos(a) * 6 - 1.5, oy + Math.sin(a) * 6 - 1.5, 3, 3, colors.bulletP);
    }
  }

  /** ⚠️ SIMPLE: una bolsa es un bulto con un signo. Por vestir. */
  function dibujarBolsa(r, x, y) {
    r.rect(x - 3, y - 6, 7, 6, '#8a6a3a');
    r.rect(x - 1, y - 8, 3, 2, '#6a4f2a');
    r.text('$', x + 0.5, y - 2, colors.bagLoot);
  }

  /**
   * LA MIRA, CON LA MISMA REGLA QUE EN EL ASALTO (ver CONFIG.mira): el círculo
   * mide el ARMA, no el punto al que apuntás — se calcula siempre como si
   * apuntaras a `distanciaReferencia` (80). A caballo es tres veces más grande
   * porque la dispersión es tres veces mayor.
   */
  function dibujarMira(r) {
    const m = CONFIG.mira;
    // Crece cuando apuntás para atrás: es la misma dispersión que usa el tiro.
    const radio = Math.max(m.radioMin, Math.min(m.radioMax,
      Math.tan(dispersionAhora()) * m.distanciaReferencia * m.escala));
    r.circle(input.mouse.x, input.mouse.y, radio, yo.recargando > 0 ? m.colorBloqueado : m.color, m.alpha);
  }

  function dibujarPanel(r) {
    const centro = r.width / 2;

    if (fin) {
      r.text(fin.como === 'limpio' ? T.huida.todosCaidos : T.huida.losPerdiste, centro, 60, colors.bagLoot);
    } else {
      const quedan = siguiendo();
      r.text(T.huida.teSiguen(quedan.length), centro, 8, colors.enemyAlert);
      /**
       * LA BARRA DE LA DISTANCIA, en vez del reloj: cuánto le falta al más
       * cercano para quedar perdido. Se llena cuando te alejás y se vacía
       * cuando chocás — es la cuenta que de verdad decide la huida.
       */
      const J = H.jinetes;
      const cerca = Math.min(...quedan.map((j) => yo.x - j.x));
      const t = Math.max(0, Math.min(1, (cerca - J.distanciaMinima) / (J.perdida - J.distanciaMinima)));
      const ancho = 120;
      r.rect(centro - ancho / 2, 14, ancho, 3, '#241c18');
      r.rect(centro - ancho / 2, 14, ancho * t, 3, colors.doorGlow);
    }

    r.text(`$${Math.max(0, dineroInicial - perdido)}`, 6, 9, colors.bagLoot, 'left');
    if (soltadas > 0) r.text(T.huida.bolsas(soltadas), 6, 19, colors.enemyAlert, 'left');

    const municion = yo.recargando > 0 ? T.huida.recargando
      : `${arma.short} ${'●'.repeat(yo.balas)}${'○'.repeat(Math.max(0, arma.magazine - yo.balas))}`;
    r.text(municion, r.width - 6, 9, yo.recargando > 0 ? colors.enemyAlert : colors.textDim, 'right');

    if (tiempo < 5 && !fin) {
      r.text(T.huida.teclas[0], centro, r.height - 17, colors.textDim);
      r.text(T.huida.teclas[1], centro, r.height - 7, colors.textDim);
    }
  }

  return { enter, exit, update, render };
}
