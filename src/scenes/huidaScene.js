/**
 * LA HUIDA — campo abierto, con la ley detrás.
 *
 * Ver data/huida.js para el pedido de Santi y los números. En corto:
 *
 *  - Te siguen LOS MISMOS jinetes que quedaban vivos en el asalto: lo que
 *    hiciste adentro se paga acá afuera.
 *  - **Galopás hacia donde quieras** *(Santi: "que literalmente el caballo
 *    pueda cabalgar hacia el norte o sur en vez de solo hacia el este")*. El
 *    mundo es un plano y la cámara te sigue; W/A/S/D eligen el rumbo y el
 *    caballo tarda en doblar, como un caballo lanzado.
 *  - **Hay tres refugios** en el campo, cada uno en su lugar y a su distancia:
 *    la quebrada, el río y el bosque de rocas. Entrar en cualquiera termina la
 *    huida. A cuál vas es tu decisión; la brújula dice para dónde queda cada
 *    uno y cuánto falta.
 *  - CADA TIRO QUE TE PEGAN TE HACE SOLTAR UNA BOLSA. Nunca te agarran: lo peor
 *    que puede pasar es llegar con menos plata.
 *  - El mouse apunta, el clic dispara, el clic derecho cierra la mira y [R]
 *    recarga, igual que en el asalto. [SHIFT] frena, que es para pelear.
 *
 * 🔁 ES LA TERCERA FORMA DE ESTA ESCENA. Fue un reloj de 15 segundos, después
 * un pasillo que iba al este con un destino al final, y ahora campo abierto.
 * Las dos primeras eran más baratas de hacer, pero en un pasillo no se huye:
 * se esquiva.
 *
 * ⚠️ GRÁFICOS SIMPLES: las bolsas, el "!" del aviso, los refugios y el panel
 * son dibujo de prueba (ver "Por vestir" en NOTAS-DISENO.md).
 */

import { CONFIG } from '../data/config.js';
import { HUIDA as H } from '../data/huida.js';
import { WEAPONS, DEFAULT_WEAPON } from '../data/weapons.js';
import { caballoActual, HORSES, APROXIMACION as A } from '../data/horse.js';
import { applyRaidResult, gameState } from '../state/gameState.js';
import { T } from '../text/es.js';
import { GOLPES, dibujarAnimal, dibujarJinete } from '../entities/caballo.js';
import { dibujarTendido } from '../entities/figura.js';
import { sembrarDesierto } from '../world/desierto.js';
import { dibujarObstaculoDesierto } from '../world/obstaculosDesierto.js';
import { crearPolvo } from '../world/polvoDeCascos.js';
import {
  DESTINOS, ACHATA, dibujarRefugio, dibujarDeLejos, chocaConElRefugio, adentroDelRefugio,
} from '../world/destinos.js';

/**
 * EN TRES CUARTOS, IR AL NORTE RINDE MENOS EN PANTALLA QUE IR AL ESTE: la
 * profundidad se ve aplastada. Es el mismo achatado de los refugios y el del
 * campamento, así que una vuelta galopada se ve como una elipse y no como un
 * círculo.
 */
const PROFUNDIDAD = ACHATA;

export function createHuidaScene(services) {
  const { renderer, input, rng, scenes, hud, audio } = services;
  const colors = CONFIG.colors;

  let summary, caballo, arma, prueba;
  let yo, jinetes, balas, bolsas, caidos, carteles, obstaculos, celdasSembradas;
  let refugios, refugioTomado;
  let tiempo, dineroInicial, perdido, soltadas, derribados;
  let fin, temblor, avisoCansancio, ultimoGrito, bamboleo;
  /** El polvo de los cascos: el mismo del galope (world/polvoDeCascos.js). */
  const polvo = crearPolvo(colors.polvo);

  /**
   * CUÁNTO MUNDO ENTRA EN PANTALLA CON NUESTRA LUPA. La escena se dibuja con
   * `HUIDA.zoom` (3) en vez de la del mundo (4): un tercio más de campo.
   */
  const vista = { w: 426, h: 300 };
  function medirVista() {
    const c = renderer.canvas;
    if (!c || !c.width) return;
    vista.w = Math.floor(c.width / H.zoom);
    vista.h = Math.floor(c.height / H.zoom);
  }

  /**
   * @param params.summary  lo que armó el asalto para la pantalla de
   *   resultados. Se le descuenta lo que se pierda acá y recién después se
   *   aplica (`applyRaidResult`).
   * @param params.jinetes  cuántos quedaban vivos.
   * @param params.arma / params.balas  el arma que tenías y cuántas balas le
   *   quedaban: saltar del tren no te recarga el revólver.
   * @param params.caballo / params.prueba  los manda el atajo de prueba del
   *   campamento: probar cualquier caballo sin tenerlo, y que no cuente.
   */
  function enter(params = {}) {
    medirVista();
    hud.hide();
    mostrarCursorDelSistema(false);
    summary = params.summary || { money: 0, kills: 0, outcome: 'escaped' };
    caballo = HORSES[params.caballo] || caballoActual(gameState);
    prueba = !!params.prueba;
    arma = params.arma || WEAPONS[DEFAULT_WEAPON];

    yo = {
      x: 0, y: 0,
      rumbo: 0,
      vel: caballo.sprintSpeed,
      pose: 0,
      invuln: 0,
      fireTimer: 0,
      balas: params.balas ?? arma.magazine,
      recargando: 0,
      fogonazo: 0,
      choque: 0,
      frena: false,
      apuntado: 0,
      contraLaPared: false,
      desvio: 0,
      desvioDir: 0,
      proximoDesvio: 0,
    };

    sembrarRefugios();

    jinetes = [];
    const n = Math.max(1, params.jinetes || 1);
    for (let i = 0; i < n; i++) jinetes.push(crearJinete(i, n));

    balas = [];
    bolsas = [];
    caidos = [];
    carteles = [];
    obstaculos = [];
    celdasSembradas = new Set();
    tiempo = 0;
    dineroInicial = Math.max(0, summary.money || 0);
    perdido = 0;
    soltadas = 0;
    derribados = 0;
    fin = null;
    temblor = 0;
    avisoCansancio = false;
    ultimoGrito = -99;
    bamboleo = 0;
    polvo.limpiar();
    sembrarObstaculos();

    const a = CONFIG.ambiente;
    audio.ambiente('galope', { cutoff: 420, q: 0.6, type: 'lowpass',
      gain: a.galopeVientoGain,
      respira: { profundidad: a.vientoProfundidad, cada: a.vientoCada } });

    // Para mirar y medir desde la consola: FORAJIDO.services.huida
    services.huida = {
      get yo() { return yo; },
      get jinetes() { return jinetes; },
      get refugios() { return refugios; },
      get balas() { return balas; },
      get tiempo() { return tiempo; },
      get perdido() { return perdido; },
      get soltadas() { return soltadas; },
      get derribados() { return derribados; },
      get dineroInicial() { return dineroInicial; },
      get fin() { return fin; },
      get obstaculos() { return obstaculos; },
      get vista() { return vista; },
      get refugioTomado() { return refugioTomado; },
    };
  }

  function exit() {
    audio.quitarAmbiente('galope');
    mostrarCursorDelSistema(true);
  }

  /**
   * LOS TRES REFUGIOS, REPARTIDOS EN EL CAMPO *(Santi: "deberíamos hacer que
   * los puntos de llegada sean aleatorios sus ubicaciones, para que no siempre
   * se elija uno y no otro")*.
   *
   * SE SORTEA TODO: cuál es cuál, a qué rumbo cae cada uno dentro de un
   * abanico ancho (`abanicoGrados` para cada lado) y a qué distancia, cada uno
   * por SU cuenta. Antes los tres salían casi a la misma distancia y en un
   * abanico angosto adelante: el del medio era siempre el obvio.
   *
   * Lo único que no queda librado al azar es que no caigan dos en el mismo
   * rumbo. El reparto: se apartan las dos separaciones mínimas, se tiran tres
   * cortes al azar en lo que sobra del abanico, se ordenan, y cada refugio se
   * corre una separación más que el anterior. Los tres pueden terminar
   * apilados de un costado o uno en cada punta —lo que salga—, pero nunca uno
   * encima del otro.
   */
  function sembrarRefugios() {
    const M = H.mundo;
    const C = M.caracter;
    const grados = (g) => (g * Math.PI) / 180;
    const ids = Object.keys(DESTINOS);
    // Barajar los tres, para que no salga siempre el mismo del mismo lado.
    for (let i = ids.length - 1; i > 0; i--) {
      const j = rng.int(0, i);
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }

    const abanico = grados(M.abanicoGrados) * 2;
    const sep = grados(M.separacionGrados);
    const sobra = Math.max(0, abanico - sep * 2);
    const cortes = [rng.range(0, sobra), rng.range(0, sobra), rng.range(0, sobra)]
      .sort((a, b) => a - b);

    refugios = ids.map((id, i) => {
      const rumbo = -abanico / 2 + cortes[i] + sep * i;
      const dist = rng.range(M.distanciaMin, M.distanciaMax);
      const x = Math.cos(rumbo) * dist;
      const y = Math.sin(rumbo) * dist * PROFUNDIDAD;
      // Para dónde queda el campo del que vas a venir, visto desde el refugio.
      const llegada = Math.atan2(-y / PROFUNDIDAD, -x);
      /**
       * LA QUEBRADA ESCONDE LA ENTRADA: le cae de costado o casi del otro
       * lado, así que hay que rodear el paredón con ellos encima. Los otros
       * dos la tienen de frente, apenas corrida.
       */
      const rodeo = id === 'quebrada'
        ? (rng.chance(0.5) ? 1 : -1) * rng.range(grados(C.quebradaRodeoMin), grados(C.quebradaRodeoMax))
        : rng.range(-0.3, 0.3);
      return {
        tipo: id,
        nombre: DESTINOS[id].nombre,
        cartel: DESTINOS[id].cartel,
        x, y,
        radio: M.radio,
        mira: llegada + rodeo,
        abertura: grados(M.aberturaGrados),
        aviso: false,
      };
    });
    refugioTomado = null;
  }

  /**
   * ¿DE QUIÉN ES ESTE PEDAZO DE CAMPO? Alrededor de cada refugio el terreno es
   * suyo: el bosque de rocas lo tiene sembrado de piedras y el río lo tiene
   * limpio. Devuelve el refugio dueño del punto, o `null` si es campo de nadie.
   */
  function terrenoDe(x, y) {
    const lejos = H.mundo.caracter.alrededor;
    return refugios.find((d) => Math.hypot(d.x - x, (d.y - y) / PROFUNDIDAD) < lejos) || null;
  }

  /** Pegado a la pared de un refugio no nace nada: la entrada no se tapa. */
  function pegadoAUnRefugio(x, y) {
    const despeje = H.mundo.caracter.despejeRefugio;
    return refugios.some((d) => Math.hypot(d.x - x, (d.y - y) / PROFUNDIDAD) < d.radio + despeje);
  }

  /**
   * Cada jinete arranca detrás tuyo, abierto en abanico, y tiene su carril: a
   * qué ángulo de tu cola se planta y a qué distancia.
   */
  function crearJinete(i, n) {
    const J = H.jinetes;
    const lado = i % 2 === 0 ? -1 : 1;
    const escalon = Math.ceil(i / 2);
    const atras = J.distanciaInicial + i * J.separacionInicial;
    return {
      x: yo.x - Math.cos(yo.rumbo) * atras,
      y: yo.y - Math.sin(yo.rumbo) * atras * PROFUNDIDAD,
      rumbo: yo.rumbo,
      alive: true,
      perdido: false,
      health: H.jinetes.vida ?? 1,
      vel: J.velocidad + rng.range(-J.variacion, J.variacion),
      carril: n === 1 ? 0.25 : lado * (0.22 + escalon * 0.26),
      atras: J.distanciaInicial * 0.75 + i * J.separacionInicial,
      cooldown: J.cadencia * 0.6 + rng.range(0, J.cadenciaAzar),
      aimTimer: 0,
      aimDir: 0,
      hitFlash: 0,
      gallop: Math.random() * 6.28,
      fase: Math.random() * 6.28,
      choque: 0,
      choques: 0,
    };
  }

  // -------------------------------------------------------------- actualizar

  function update(dt) {
    medirVista();
    tiempo += dt;
    temblor = Math.max(0, temblor - dt);
    bamboleo += dt;
    actualizarCascos(dt);
    polvo.actualizar(dt, 0);

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
      carteles.push({ x: yo.x, y: yo.y - 40, texto: T.huida.aflojan, color: colors.bagLoot, vida: 2.4 });
    }

    sembrarObstaculos();
    moverme(dt);
    disparar(dt);
    moverJinetes(dt, false);
    moverBalas(dt);

    if (!fin && (siguiendo().length === 0 || tiempo >= H.tope)) {
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
   * suyo; de ahí en más afloja, y ahí es cuando el que nunca disparó por fin
   * los deja atrás.
   */
  function velocidadDelJinete(j) {
    const C = H.jinetes.cansancio;
    const t = Math.max(0, Math.min(1, (tiempo - C.desde) / C.entra));
    return j.vel + (C.velocidad - j.vel) * t;
  }

  /** Avanzar en el mundo: al norte rinde menos, porque se ve en tres cuartos. */
  function avanzar(cosa, vel, dt) {
    cosa.x += Math.cos(cosa.rumbo) * vel * dt;
    cosa.y += Math.sin(cosa.rumbo) * vel * PROFUNDIDAD * dt;
  }

  /** Girar de a poco hacia un rumbo, sin pasarse. Devuelve lo que faltaba. */
  function girarHacia(cosa, objetivo, velocidad, dt) {
    const dif = Math.atan2(Math.sin(objetivo - cosa.rumbo), Math.cos(objetivo - cosa.rumbo));
    const paso = velocidad * dt;
    cosa.rumbo += Math.abs(dif) < paso ? dif : Math.sign(dif) * paso;
    return Math.abs(dif);
  }

  function moverme(dt) {
    const J = H.jugador;
    const dx = (input.isDown('KeyD') || input.isDown('ArrowRight') ? 1 : 0)
             - (input.isDown('KeyA') || input.isDown('ArrowLeft') ? 1 : 0);
    const dy = (input.isDown('KeyS') || input.isDown('ArrowDown') ? 1 : 0)
             - (input.isDown('KeyW') || input.isDown('ArrowUp') ? 1 : 0);
    yo.frena = input.isDown('ShiftLeft') || input.isDown('ShiftRight');

    // El clic derecho cierra la mira en `tiempoCierre`, igual que en el asalto.
    const paso = dt / CONFIG.mira.tiempoCierre;
    yo.apuntado = input.mouse.right ? Math.min(1, yo.apuntado + paso) : Math.max(0, yo.apuntado - paso);
    const manejo = 1 - (1 - J.manejoApuntando) * yo.apuntado;

    desviarse(dt);

    /**
     * EL RUMBO SALE DE LAS TECLAS, Y EL CABALLO TARDA EN TOMARLO. W/A/S/D
     * eligen a dónde querés ir —las ocho direcciones—, y el animal gira hacia
     * ahí a `giroVelocidad`. Mirando para atrás, además, se tuerce solo (ver
     * `desviarse`): no ves lo que tenés adelante.
     */
    let error = 0;
    if (dx !== 0 || dy !== 0) {
      const objetivo = Math.atan2(dy / PROFUNDIDAD, dx);
      error = girarHacia(yo, objetivo, J.giroVelocidad * manejo, dt);
    }
    if (yo.desvio > 0) yo.rumbo += yo.desvioDir * 0.5 * dt;

    if (yo.choque > 0) yo.choque -= dt;

    // Doblando cerrado se pierde envión, y [SHIFT] frena para pelear.
    const curva = 1 - (1 - J.frenoEnCurva) * Math.min(1, error / Math.PI);
    const fondo = (yo.frena ? caballo.brakeSpeed : caballo.sprintSpeed) * curva;
    yo.vel = velocidadDe(fondo, yo.choque) * (yo.contraLaPared ? H.mundo.choquePared : 1);
    avanzar(yo, yo.vel, dt);

    chocarConLasCosas();

    /**
     * LAS NUEVE POSES DEL CABALLO salen del rumbo: al norte se lo ve alejarse,
     * al sur viene de frente, al este y al oeste va de perfil. Para el oeste el
     * dibujo se espeja (ver `dibujarCaballo`), porque la hoja mira a la
     * derecha. La zona muerta de 0,8 es para que no parpadee entre dos poses.
     */
    const crudo = Math.sin(yo.rumbo) * 4;
    if (Math.abs(crudo - yo.pose) > 0.8) yo.pose = Math.max(-4, Math.min(4, Math.round(crudo)));

    yo.invuln = Math.max(0, yo.invuln - dt);
    yo.fogonazo = Math.max(0, yo.fogonazo - dt);
  }

  /** Los choques del jugador: los obstáculos y la pared de un refugio. */
  function chocarConLasCosas() {
    if (yo.choque <= 0) {
      const ob = chocaCon(yo.x, yo.y);
      if (ob) {
        ob.golpeado = true;
        yo.choque = A.obstaculoFrenado;
        audio.play('hitWall');
        audio.play('relincho');
        carteles.push({ x: yo.x, y: yo.y - 30, texto: T.ride.choque, color: colors.enemyAlert, vida: 1 });
      }
    }

    yo.contraLaPared = false;
    for (const d of refugios) {
      if (adentroDelRefugio(d, yo.x, yo.y)) {
        refugioTomado = d;
        empezarFin('llegaste');
        return;
      }
      const empuje = chocaConElRefugio(d, yo.x, yo.y);
      if (!empuje) continue;
      yo.x = empuje.x;
      yo.y = empuje.y;
      yo.contraLaPared = true;
      if (!d.aviso) {
        d.aviso = true;
        audio.play('hitWall');
        carteles.push({ x: yo.x, y: yo.y - 30, texto: T.huida.pared, color: colors.enemyAlert, vida: 1.6 });
      }
    }
  }

  /**
   * NO VES ADELANTE: mientras apuntás pasado el giro cómodo del torso, el
   * caballo se tuerce solo cada tanto. Mirando adelante no pasa nunca.
   */
  function desviarse(dt) {
    const D = H.jugador.atras;
    yo.desvio = Math.max(0, yo.desvio - dt);
    if (cuantoAtras() <= 0 || fin) {
      yo.proximoDesvio = D.desvioCada + rng.range(0, D.desvioAzar);
      return;
    }
    yo.proximoDesvio -= dt;
    if (yo.proximoDesvio > 0) return;
    yo.desvio = D.desvioDura;
    yo.desvioDir = rng.chance(0.5) ? 1 : -1;
    yo.proximoDesvio = D.desvioDura + D.desvioCada + rng.range(0, D.desvioAzar);
  }

  // ----------------------------------------------------------------- el arma

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

    const angulo = haciaDondeApunto()
      + rng.spreadDeTiro(dispersionAhora(), CONFIG.mira.fallaChance, CONFIG.mira.fallaMultiplicador);
    const [ox, oy] = boca();
    balas.push({
      x: ox, y: oy,
      vx: Math.cos(angulo) * arma.bulletSpeed,
      vy: Math.sin(angulo) * arma.bulletSpeed * PROFUNDIDAD,
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

  /** Dónde cae el mouse EN LA PANTALLA, con nuestra lupa. */
  function mouseEnPantalla() {
    const d = input.mouse.px !== undefined ? H.zoom : 1;
    return {
      x: (input.mouse.px !== undefined ? input.mouse.px : input.mouse.x) / d,
      y: (input.mouse.py !== undefined ? input.mouse.py : input.mouse.y) / d,
    };
  }

  /** Y dónde cae EN EL MUNDO: la cámara te lleva siempre en el medio. */
  function mouseEnElMundo() {
    const m = mouseEnPantalla();
    return { x: yo.x - vista.w / 2 + m.x, y: yo.y - vista.h / 2 + m.y };
  }

  /** Hacia dónde apuntás: al mouse, para cualquier lado. */
  function haciaDondeApunto() {
    const m = mouseEnElMundo();
    const [ox, oy] = boca();
    return Math.atan2(m.y - oy, m.x - ox);
  }

  /**
   * CUÁNTO TE PASASTE DEL GIRO CÓMODO DEL TORSO *(Santi: "el jugador no es un
   * buho")*. Se mide contra el RUMBO del caballo, no contra el este: si
   * galopás al sur, "adelante" es el sur.
   */
  function cuantoAtras() {
    const a = haciaDondeApunto();
    const rel = Math.atan2(Math.sin(a - yo.rumbo), Math.cos(a - yo.rumbo));
    const g = (rel * 180) / Math.PI;
    const tope = g >= 0 ? H.jugador.giroDerecha : H.jugador.giroIzquierda;
    const pasado = Math.abs(g) - tope;
    return pasado <= 0 ? 0 : Math.min(1, pasado / (180 - tope));
  }

  /** Tu dispersión ahora: la del arma, peor a caballo, y peor mirando atrás. */
  function dispersionAhora() {
    const t = cuantoAtras();
    const suelta = arma.spread;
    const apuntada = arma.spreadApuntado ?? suelta;
    const base = suelta + (apuntada - suelta) * yo.apuntado;
    return base * H.jugador.dispersionACaballo * (1 + t * (H.jugador.atras.dispersionMax - 1));
  }

  // ------------------------------------------------------------------ la ley

  function moverJinetes(dt, yendose) {
    const J = H.jinetes;
    for (const j of jinetes) {
      j.gallop += dt;
      j.hitFlash = Math.max(0, j.hitFlash - dt);
      if (!j.alive || j.perdido) continue;

      if (yendose) {
        // Se van quedando: aflojan y los deja el mundo.
        avanzar(j, j.vel * 0.4, dt);
        j.aimTimer = 0;
        continue;
      }

      const lejos = Math.hypot(yo.x - j.x, (yo.y - j.y) / PROFUNDIDAD);
      if (lejos > J.perdida) {
        j.perdido = true;
        carteles.push({ x: j.x, y: j.y - 20, texto: T.huida.seQuedo, color: colors.bagLoot, vida: 1.6 });
        continue;
      }

      if (j.choque > 0) {
        j.choque -= dt;
        avanzar(j, velocidadDe(velocidadDelJinete(j), j.choque), dt);
        j.aimTimer = 0;
        continue;
      }

      /**
       * A DÓNDE VA: a SU lugar detrás tuyo, abierto en abanico. Como el campo
       * es abierto, "detrás" es detrás de tu RUMBO: si doblás, la partida
       * entera describe la curva con vos, unos metros más atrás.
       */
      const objetivo = {
        x: yo.x - Math.cos(yo.rumbo + j.carril) * j.atras,
        y: yo.y - Math.sin(yo.rumbo + j.carril) * j.atras * PROFUNDIDAD,
      };
      const haciaAlla = Math.atan2((objetivo.y - j.y) / PROFUNDIDAD, objetivo.x - j.x);

      // Apuntando no dobla: el aviso vale porque el tiro sale de donde lo viste.
      if (j.aimTimer > 0) {
        j.aimTimer -= dt;
        if (j.aimTimer <= 0) tirar(j);
      } else {
        girarHacia(j, haciaAlla, 2.2, dt);
        esquivarConElCaballo(j, dt);
      }
      avanzar(j, velocidadDelJinete(j), dt);
      chocarJinete(j);

      j.cooldown -= dt;
      const d = Math.hypot(yo.x - j.x, (yo.y - j.y) / PROFUNDIDAD);
      if (j.cooldown <= 0 && d < J.alcance && j.aimTimer <= 0) {
        if (tiempo - ultimoGrito > J.gritoCada && rng.chance(J.chanceGrito)) {
          ultimoGrito = tiempo;
          audio.play('gritoLey');
        }
        j.aimTimer = J.apuntar;
        j.aimDir = Math.atan2((yo.y - 8 - (j.y - 14)) / PROFUNDIDAD, yo.x - (j.x + 6));
        j.cooldown = J.cadencia + rng.range(0, J.cadenciaAzar);
      }
    }
  }

  /**
   * LOS JINETES ESQUIVAN LO QUE VIENE *(pedido de Santi)*: miran adelante suyo
   * y, si hay algo en el camino, doblan. No es infalible, y a propósito:
   * apuntando no doblan, y ahí se la comen.
   */
  function esquivarConElCaballo(j, dt) {
    const O = H.obstaculos;
    const frente = {
      x: j.x + Math.cos(j.rumbo) * O.mira,
      y: j.y + Math.sin(j.rumbo) * O.mira * PROFUNDIDAD,
    };
    const estorbo = chocaCon(frente.x, frente.y, O.margen);
    if (!estorbo) return;
    const hacia = Math.atan2((estorbo.y - j.y) / PROFUNDIDAD, estorbo.x - j.x);
    const dif = Math.atan2(Math.sin(hacia - j.rumbo), Math.cos(hacia - j.rumbo));
    girarHacia(j, j.rumbo - (dif >= 0 ? 1 : -1) * 0.7, 3, dt);
  }

  function chocarJinete(j) {
    const ob = chocaCon(j.x, j.y);
    if (ob) {
      ob.golpeado = true;
      j.choque = A.obstaculoFrenado;
      j.choques += 1;
      audio.play('hitWall');
    }
    for (const d of refugios) {
      const empuje = chocaConElRefugio(d, j.x, j.y);
      if (!empuje) continue;
      j.x = empuje.x;
      j.y = empuje.y;
      j.choque = Math.max(j.choque, 0.25);
    }
  }

  function tirar(j) {
    const J = H.jinetes;
    // Parejo para todos, como en el asalto: a ellos también se les va el pulso.
    const a = j.aimDir + rng.spreadDeTiro(J.dispersion, CONFIG.mira.fallaChance, CONFIG.mira.fallaMultiplicador);
    balas.push({
      x: j.x + 6, y: j.y - 14,
      vx: Math.cos(a) * J.velocidadBala,
      vy: Math.sin(a) * J.velocidadBala * PROFUNDIDAD,
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
          if (!j.alive || j.perdido) continue;
          if (Math.abs(b.x - j.x) < 12 && Math.abs(b.y - (j.y - 8)) < 10) {
            b.vida = 0;
            pegarle(j, b.danio);
            break;
          }
        }
      } else if (yo.invuln <= 0 && Math.abs(b.x - yo.x) < 11 && Math.abs(b.y - (yo.y - 8)) < 9) {
        b.vida = 0;
        soltarBolsa();
      } else if (!b.silbo && Math.abs(b.x - yo.x) < 26 && Math.abs(b.y - (yo.y - 8)) < 20) {
        // Te pasó cerca y no te dio: el silbido avisa que fue por poco.
        b.silbo = true;
        audio.play('balaSilba');
      }
    }
    balas = balas.filter((b) => b.vida > 0);
  }

  function pegarle(j, danio) {
    j.health -= danio;
    j.hitFlash = 0.12;
    audio.play('hitFlesh');
    if (j.health > 0) return;
    j.alive = false;
    derribados += 1;
    caidos.push({ x: j.x, y: j.y });
    audio.play('relincho');
    audio.play('kill');
    carteles.push({ x: j.x, y: j.y - 28, texto: T.huida.derribado, color: colors.bagLoot, vida: 1.4 });
  }

  /**
   * TE PEGARON: SOLTÁS UNA BOLSA. Todas del mismo tamaño (una fracción de lo
   * que sacaste del tren, no de lo que te queda), para que se puedan contar.
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
    bolsas.push({ x: yo.x - 6, y: yo.y + 4, z: -18, vz: -60 });
    carteles.push({ x: yo.x, y: yo.y - 30, texto: `−$${monto}`, color: colors.enemyAlert, vida: 1.4 });
  }

  function empezarFin(como) {
    if (fin) return;
    fin = { como, timer: 1.8 };
    balas = balas.filter((b) => b.mia);
    audio.play('escape');
  }

  function terminar() {
    summary.money = Math.max(0, (summary.money || 0) - perdido);
    summary.huida = {
      jinetes: jinetes.length, derribados, bolsas: soltadas, perdido,
      // Cómo terminó: 'llegaste' (a un refugio), 'limpio' (no quedó ninguno) o
      // 'perdidos' (los dejaste atrás).
      fin: fin ? fin.como : 'perdidos',
      lugar: refugioTomado ? refugioTomado.nombre : null,
    };
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

    // Y cada zancada levanta polvo: la tuya y la de ellos.
    const pisadas = [[GOLPES.traseraAlla, -8], [GOLPES.traseraAca, -6], [GOLPES.delanteraAca, 6]];
    polvo.sembrar({ x: yo.x, y: yo.y, suelo: 0, rumbo: 0, fuerza: yo.choque > 0 ? 0.3 : 1, pisadas });
    for (const j of siguiendo()) {
      if (Math.hypot(j.x - yo.x, j.y - yo.y) > vista.w) continue;
      polvo.sembrar({ x: j.x, y: j.y, suelo: 0, rumbo: 0, fuerza: 0.8, pisadas, cuantas: 3 });
    }
  }

  function mostrarCursorDelSistema(visible) {
    const canvas = renderer.canvas || (renderer.ctx && renderer.ctx.canvas);
    if (canvas) canvas.style.cursor = visible ? '' : 'none';
  }

  // -------------------------------------------------------------- obstáculos

  /**
   * LOS OBSTÁCULOS, SEMBRADOS ALREDEDOR TUYO. El campo es abierto, así que se
   * siembran por CELDAS de mundo a medida que te acercás, y se tiran las que
   * quedan lejos. Cada celda decide lo suyo una sola vez.
   */
  function sembrarObstaculos() {
    const CELDA = 150;
    const tipos = ['roca', 'arbusto', 'cactus', 'monticulo'];
    const alcance = vista.w;
    const cx0 = Math.floor((yo.x - alcance) / CELDA);
    const cx1 = Math.ceil((yo.x + alcance) / CELDA);
    const cy0 = Math.floor((yo.y - alcance) / CELDA);
    const cy1 = Math.ceil((yo.y + alcance) / CELDA);
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cy = cy0; cy <= cy1; cy++) {
        const clave = `${cx},${cy}`;
        if (celdasSembradas.has(clave)) continue;
        celdasSembradas.add(clave);
        /**
         * CUÁNTAS COSAS TIENE ESTA CELDA depende de en el campo de quién cae:
         * el bosque de rocas está sembrado de piedras —cuesta llegar sin
         * chocar, pero la ley viene atrás y no elige por dónde— y el río tiene
         * la llegada limpia: se galopa derecho, pero no hay contra qué hacerlos
         * chocar.
         */
        const C = H.mundo.caracter;
        const terreno = terrenoDe(cx * CELDA + CELDA / 2, cy * CELDA + CELDA / 2);
        let cuantos = rng.int(0, 2);
        if (terreno && terreno.tipo === 'bosque') cuantos = rng.int(C.bosqueMin, C.bosqueMax);
        else if (terreno && terreno.tipo === 'rio') cuantos = 0;

        for (let i = 0; i < cuantos; i++) {
          const x = cx * CELDA + rng.range(0, CELDA);
          const y = cy * CELDA + rng.range(0, CELDA);
          if (pegadoAUnRefugio(x, y)) continue;
          const roca = terreno && terreno.tipo === 'bosque' && rng.chance(C.bosqueRocas);
          obstaculos.push({
            x,
            y,
            tipo: roca ? 'roca' : tipos[rng.int(0, tipos.length - 1)],
            golpeado: false,
          });
        }
      }
    }
    // Los que quedaron lejos no se dibujan ni chocan: fuera de la lista.
    if (obstaculos.length > 400) {
      obstaculos = obstaculos.filter((ob) => Math.hypot(ob.x - yo.x, ob.y - yo.y) < alcance * 1.4);
    }
  }

  function radioDe(ob) {
    return A.obstaculoRadios[ob.tipo] ?? A.obstaculoRadio;
  }

  /** La misma cuenta del galope: a menos de radio + 6 del centro, chocaste. */
  function chocaCon(x, y, extra = 6) {
    for (const ob of obstaculos) {
      if (ob.golpeado) continue;
      const radio = radioDe(ob);
      if (Math.abs(ob.x - x) > radio + 24) continue;
      if (Math.hypot(ob.x - x, (ob.y - y) / PROFUNDIDAD) < radio + extra) return ob;
    }
    return null;
  }

  // ----------------------------------------------------------------- dibujar

  function render(r) {
    // NUESTRA LUPA: 3 en vez de 4, o sea un tercio más de campo (ver `zoom`).
    r.lupa(H.zoom);
    medirVista();
    const dia = gameState.esDeDia;

    r.clear(dia ? colors.desiertoDia : colors.desiertoNoche);

    r.ctx.save();
    /**
     * LA CÁMARA TE SIGUE: el mundo se corre para que vos quedes en el medio.
     * Encima va el balanceo del galope y el sacudón de los tiros.
     */
    const zancadaT = CONFIG.ambiente.zancadaCada;
    const vaiven = Math.sin((bamboleo / zancadaT) * Math.PI * 2) * 0.9
      + Math.sin((bamboleo / zancadaT) * Math.PI * 4) * 0.4;
    const camX = Math.round(yo.x - vista.w / 2);
    const camY = Math.round(yo.y - vista.h / 2);
    r.ctx.translate(-camX, -camY + vaiven);
    if (temblor > 0) r.ctx.translate(rng.range(-2.5, 2.5), rng.range(-2.5, 2.5));

    // El suelo: pasto, piedritas y manchas, sembradas por celda (las mismas
    // del galope y del asalto, así que el afuera es siempre el mismo lugar).
    sembrarDesierto(r, {
      x0: camX, y0: camY, x1: camX + vista.w, y1: camY + vista.h,
      noche: !dia, colores: colors.cielo, grandes: () => false,
    });

    // Lo que quedó tirado en el campo: los caídos y las bolsas.
    for (const c of caidos) dibujarTendido(r, c.x, c.y + 4, { tipo: 'jineteLey', cinta: '#4a78b8' });
    for (const b of bolsas) dibujarBolsa(r, b.x, b.y + b.z);

    polvo.dibujar(r, 0, !dia);

    /**
     * TODO SE DIBUJA POR DÓNDE PISA: lo que está más abajo tapa a lo que está
     * más arriba. Entran los refugios, los obstáculos, los jinetes y vos.
     */
    const cosas = [];
    for (const d of refugios) {
      const lejos = Math.hypot(d.x - yo.x, (d.y - yo.y) / PROFUNDIDAD);
      if (lejos > vista.w * 0.9) {
        // De lejos, su silueta: es lo que te dice para dónde está.
        cosas.push({ y: d.y, draw: () => dibujarDeLejos(r, d, dia, Math.max(0.3, 1 - lejos / 4600)) });
      } else {
        cosas.push({ y: d.y, draw: () => dibujarRefugio(r, d, dia) });
      }
    }
    for (const ob of obstaculos) {
      if (Math.abs(ob.x - yo.x) > vista.w || Math.abs(ob.y - yo.y) > vista.h) continue;
      cosas.push({ y: ob.y, draw: () => dibujarObstaculoDesierto(r, ob, ob.x, radioDe(ob), !dia) });
    }
    for (const j of jinetes) {
      if (!j.alive || j.perdido) continue;
      cosas.push({ y: j.y, draw: () => dibujarLey(r, j, dia) });
    }
    cosas.push({ y: yo.y, draw: () => dibujarme(r, dia) });
    cosas.sort((a, b) => a.y - b.y);
    for (const c of cosas) c.draw();

    for (const b of balas) r.rect(b.x - 1, b.y - 1, 3, 2, b.mia ? colors.bulletP : colors.bulletE);

    for (const c of carteles) {
      r.ctx.globalAlpha = Math.min(1, c.vida * 2);
      r.text(c.texto, c.x, c.y, c.color);
    }
    r.ctx.globalAlpha = 1;
    r.ctx.restore();

    dibujarAcoso(r);
    dibujarMira(r);
    dibujarPanel(r);
  }

  /**
   * UN CABALLO CON SU JINETE, ESPEJADO SI VA HACIA EL OESTE. La hoja del
   * sprite mira a la derecha y tiene las cinco vistas de norte a sur; el otro
   * medio giro es ésta misma dada vuelta.
   */
  function dibujarCaballo(quien, r, dibujo) {
    const alOeste = Math.cos(quien.rumbo) < 0;
    r.ctx.save();
    if (alOeste) {
      r.ctx.translate(Math.round(quien.x) * 2, 0);
      r.ctx.scale(-1, 1);
    }
    dibujo();
    r.ctx.restore();
  }

  function dibujarLey(r, j, dia) {
    const T0 = 0.56;
    const zancada = { t: ((j.gallop % T0) + T0) % T0, T: T0 };
    const trote = Math.round(Math.cos((zancada.t / T0 - 0.15) * Math.PI * 2) * 1.2);
    const pose = Math.max(-4, Math.min(4, Math.round(Math.sin(j.rumbo) * 4)));

    r.ctx.globalAlpha = 0.25;
    r.box(j.x, j.y + 7, 11, 2, '#000');
    r.ctx.globalAlpha = 1;

    dibujarCaballo(j, r, () => {
      const montura = dibujarAnimal(r, j.x, j.y, zancada, trote, 1, pose, null, !dia);
      const rebote = Math.cos((zancada.t / T0 - 0.25) * Math.PI * 2) * 0.6;
      dibujarJinete(r, montura.asiento.x, montura.asiento.y + rebote, pose, 2, {
        detalles: 'ley',
        destello: j.hitFlash > 0,
        estado: j.aimTimer > 0 ? 'alerta' : 'calma',
      }, montura);
      montura.adelante();
    });

    if (j.aimTimer > 0) {
      const px = j.x + 6;
      const py = j.y - 14;
      r.line(px, py, px + Math.cos(j.aimDir) * 11, py + Math.sin(j.aimDir) * 11 * PROFUNDIDAD, '#d8cdbb');
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
    r.ctx.ellipse(Math.round(yo.x), Math.round(yo.y + 7), 12, 2.5, 0, 0, Math.PI * 2);
    r.ctx.fill();
    r.ctx.restore();

    dibujarCaballo(yo, r, () => {
      const montura = dibujarAnimal(r, yo.x, yo.y, zancada, trote, 1, yo.pose, caballo.id, !dia);
      dibujarJinete(r, montura.asiento.x, montura.asiento.y + rebote, yo.pose, 2, {}, montura);
      montura.adelante();
    });

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

  /** El círculo dice la dispersión real, con la misma regla que el asalto. */
  function dibujarMira(r) {
    const m = CONFIG.mira;
    const radio = Math.max(m.radioMin, Math.min(m.radioMax,
      Math.tan(dispersionAhora()) * m.distanciaReferencia * m.escala));
    const p = mouseEnPantalla();
    r.circle(p.x, p.y, radio, yo.recargando > 0 ? m.colorBloqueado : m.color, m.alpha);
  }

  /** El borde se pone rojo cuando te tienen encima. */
  function dibujarAcoso(r) {
    if (fin) return;
    const quedan = siguiendo();
    if (!quedan.length) return;
    const cerca = Math.min(...quedan.map((j) => Math.hypot(yo.x - j.x, (yo.y - j.y) / PROFUNDIDAD)));
    const t = Math.max(0, Math.min(1, (110 - cerca) / 80));
    if (t <= 0) return;
    r.ctx.save();
    r.ctx.globalAlpha = 0.1 + t * 0.2;
    r.ctx.fillStyle = colors.enemyAlert;
    const grosor = 2 + t * 3;
    r.ctx.fillRect(0, 0, vista.w, grosor);
    r.ctx.fillRect(0, vista.h - grosor, vista.w, grosor);
    r.ctx.fillRect(0, 0, grosor, vista.h);
    r.ctx.fillRect(vista.w - grosor, 0, grosor, vista.h);
    r.ctx.restore();
  }

  function dibujarPanel(r) {
    const centro = vista.w / 2;

    if (fin) {
      const texto = fin.como === 'limpio' ? T.huida.todosCaidos
        : fin.como === 'llegaste' && refugioTomado ? refugioTomado.cartel
        : T.huida.losPerdiste;
      r.text(texto, centro, 70, colors.bagLoot);
    } else {
      r.text(T.huida.teSiguen(siguiendo().length), centro, 8, colors.enemyAlert);
      dibujarBrujula(r);
    }

    r.text(`$${Math.max(0, dineroInicial - perdido)}`, 6, 9, colors.bagLoot, 'left');
    if (soltadas > 0) r.text(T.huida.bolsas(soltadas), 6, 19, colors.enemyAlert, 'left');

    const municion = yo.recargando > 0 ? T.huida.recargando
      : `${arma.short} ${'●'.repeat(yo.balas)}${'○'.repeat(Math.max(0, arma.magazine - yo.balas))}`;
    r.text(municion, vista.w - 6, 9, yo.recargando > 0 ? colors.enemyAlert : colors.textDim, 'right');

    if (tiempo < 6 && !fin) {
      r.text(T.huida.teclas[0], centro, vista.h - 17, colors.textDim);
      r.text(T.huida.teclas[1], centro, vista.h - 7, colors.textDim);
    }
  }

  /**
   * LA BRÚJULA: una marca por refugio, pegada al borde de la pantalla en la
   * dirección en la que está, con lo que falta para llegar. En campo abierto
   * hace falta algo así — si no, huir es dar vueltas sin saber hacia dónde.
   *
   * ⚠️ SIMPLE (por vestir): un cuadradito y un número.
   */
  function dibujarBrujula(r) {
    for (const d of refugios) {
      const dx = d.x - yo.x;
      const dy = (d.y - yo.y) / PROFUNDIDAD;
      const dist = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      const x = vista.w / 2 + Math.cos(a) * vista.w * 0.44;
      const y = vista.h / 2 + Math.sin(a) * vista.h * 0.42;
      const color = dist < 500 ? colors.doorGlow : colors.textDim;
      r.rect(x - 2, y - 2, 5, 5, color);
      r.rect(x + Math.cos(a) * 5 - 1, y + Math.sin(a) * 5 - 1, 3, 3, color);
      // La inicial: cuál es cuál importa, porque cada uno tiene su terreno.
      r.text(T.huida.brujula[d.tipo] || '?', x, y - 6, color);
      r.text(`${Math.round(dist / 10)}`, x, y + 10, color);
    }
  }

  return { enter, exit, update, render };
}
