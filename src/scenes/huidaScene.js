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

    // Llegaste a la quebrada: adentro no te siguen. Gana lo que pase primero.
    if (suelo >= H.camino.largo) empezarFin('quebrada');
    else if (siguiendo().length === 0 || tiempo >= H.tope) {
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
      yo.y = meterEnLaBoca(Math.max(H.cielo + 22,
        Math.min(renderer.height - 12, yo.y + (dy * J.velocidadY * manejo + tuerce) * dt)));
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
      /**
       * NADIE ADENTRO DE LA ROCA, ESTÉ HACIENDO LO QUE ESTÉ HACIENDO. Va acá
       * arriba de todo y no junto al movimiento: apuntando y chocado el jinete
       * se saltea el movimiento, y así quedaba uno clavado dentro de la pared.
       */
      j.y = meterEnLaBoca(j.y);

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
      // Y si la quebrada ya se está cerrando, todos por el paso.
      ty = meterEnLaBoca(ty);
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
      // Adentro de la quebrada no crece nada: los que nacen ahora nacen en el
      // paso, no en la roca.
      const b = laBoca();
      obstaculos.push({
        gx: proximoObstaculo + rng.range(-30, 30),
        y: b
          ? rng.range(b.centro - b.medio + 8, b.centro + b.medio - 8)
          : rng.range(H.cielo + 26, renderer.height - 14),
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
    const b = laBoca();
    for (const ob of obstaculos) {
      if (ob.golpeado) continue;
      if (b && (ob.y < b.centro - b.medio || ob.y > b.centro + b.medio)) continue;
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
    summary.huida = {
      jinetes: jinetes.length, derribados, bolsas: soltadas, perdido,
      // Cómo terminó: 'quebrada' (llegaste), 'limpio' (no quedó ninguno) o
      // 'perdidos' (los dejaste atrás).
      fin: fin ? fin.como : 'perdidos',
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

    r.clear(colorDelSuelo(dia));
    const boca = laBoca();
    sembrarDesierto(r, {
      x0: 0, y0: H.cielo, x1: r.width, y1: r.height + 10,
      desplaza: suelo, noche: !dia, colores: C,
      grandes: () => false,
      // Adentro de la quebrada el suelo es roca: el pasto queda en el paso.
      saltar: boca ? (wx, wy) => wy < boca.centro - boca.medio || wy > boca.centro + boca.medio : null,
    });

    // Los hitos del camino van entre el suelo y el cielo: están lejos.
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
    dibujarHitos(r, dia);
    dibujarQuebrada(r, dia);

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
    const b = laBoca();
    for (const ob of obstaculos) {
      const ox = ob.gx - suelo;
      if (ox < -20 || ox > r.width + 20) continue;
      // Los que quedaron abajo de la pared ya no existen: son roca.
      if (b && (ob.y < b.centro - b.medio || ob.y > b.centro + b.medio)) continue;
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

    dibujarAcoso(r);
    dibujarMira(r);
    dibujarPanel(r);
  }

  /**
   * EL JINETE DE LA LEY, el mismo de entities/rider.js, con dos diferencias: de
   * noche el caballo se apaga como el tuyo, y el brazo apunta HACIA VOS (en el
   * asalto apunta siempre hacia el tren).
   */
  // -------------------------------------------------------------- el camino

  /**
   * LA BOCA DE LA QUEBRADA, en números. La usan el dibujo Y el movimiento, así
   * que la pared que ves es la pared que te frena — la regla de siempre en
   * este juego.
   *
   * Devuelve `null` hasta que la boca empieza; después, el centro del paso
   * (fijo, en el medio del campo) y su medio ancho, que se va cerrando.
   */
  function laBoca() {
    const C = H.camino;
    const t = (suelo / C.largo - C.bocaDesde) / (1 - C.bocaDesde);
    if (t <= 0) return null;
    const cerrado = Math.min(1, t);
    const arriba = H.cielo + 22;
    const abajo = renderer.height - 12;
    const centro = (arriba + abajo) / 2;
    // De todo el campo abierto al pasillo, de a poco.
    const medio = (abajo - arriba) / 2 - cerrado * ((abajo - arriba) / 2 - C.pasillo);
    return { centro, medio, cerrado, arriba, abajo };
  }

  /** Mete a un caballo en el paso: nadie atraviesa la roca. */
  function meterEnLaBoca(y) {
    const b = laBoca();
    if (!b) return y;
    return Math.max(b.centro - b.medio, Math.min(b.centro + b.medio, y));
  }

  /**
   * EL SUELO CAMBIA A MEDIDA QUE AVANZÁS: arena al salir de la vía, pedregal
   * en el medio, y pasto seco cerca de la quebrada. No es decoración: es lo
   * que te dice que estás yendo a algún lado sin ningún cartel.
   */
  function colorDelSuelo(dia) {
    const t = Math.max(0, Math.min(1, suelo / H.camino.largo));
    const arena = '#8a6f47';
    const pedregal = '#7b6a55';
    const pasto = '#8a7c4d';
    const hex = t < 0.5 ? mezclar(arena, pedregal, t / 0.5) : mezclar(pedregal, pasto, (t - 0.5) / 0.5);
    return dia ? hex : escalarColor(hex, 0.22);
  }

  /** Dos colores mezclados, `t` de 0 a 1. */
  function mezclar(a, b, t) {
    const n = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const [r1, g1, b1] = n(a);
    const [r2, g2, b2] = n(b);
    const c = (x, y) => Math.round(x + (y - x) * Math.max(0, Math.min(1, t))).toString(16).padStart(2, '0');
    return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
  }

  /**
   * LOS HITOS: cosas grandes que pasan LEJOS, apoyadas en el horizonte. No
   * chocan con nadie —están del otro lado del campo— y se mueven a un tercio
   * de lo que corre el suelo, que es lo que las hace leerse distantes.
   *
   * ⚠️ SIMPLE (por vestir): son siluetas de dos o tres rectángulos.
   */
  function dibujarHitos(r, dia) {
    const base = H.cielo + 3;
    for (const hito of H.camino.hitos) {
      const gx = hito.en * H.camino.largo;
      const x = r.width * 0.5 + (gx - suelo) * 0.34;
      if (x < -40 || x > r.width + 40) continue;
      const c = (hex) => (dia ? hex : escalarColor(hex, 0.35));
      if (hito.tipo === 'via') {
        // La vía por la que venía el tren, alejándose.
        for (let i = 0; i < 9; i++) r.rect(x - 18 + i * 5, base + 1 - i * 0.2, 3, 1, c('#5a4a3a'));
        r.rect(x - 20, base, 42, 1, c('#6b5a44'));
      } else if (hito.tipo === 'huesos') {
        r.rect(x - 5, base, 11, 2, c('#b9ae95'));
        r.rect(x - 2, base - 3, 3, 3, c('#cbc0a6'));
        r.rect(x + 3, base - 2, 4, 1, c('#cbc0a6'));
      } else if (hito.tipo === 'rancho') {
        r.rect(x - 9, base - 7, 18, 8, c('#6a5238'));
        r.rect(x - 11, base - 10, 22, 3, c('#4e3c28'));
        r.rect(x - 2, base - 4, 4, 5, c('#2e2418'));
      } else {
        // Una carreta rota, con la rueda caída al lado.
        r.rect(x - 8, base - 5, 15, 4, c('#6a5238'));
        r.rect(x - 8, base - 8, 3, 3, c('#4e3c28'));
        r.rect(x + 8, base - 2, 3, 3, c('#4e3c28'));
      }
    }
  }

  /**
   * LA QUEBRADA. Es el final del camino, y tiene dos momentos:
   *
   *  1. **De lejos**, dos paredones apoyados en el horizonte con un tajo negro
   *     en el medio. Crecen mientras te acercás: la quebrada ES el reloj.
   *  2. **De cerca**, la boca: las paredes bajan y suben hasta dejar sólo el
   *     paso, que está FIJO en el medio del campo (ver `laBoca`) — o entrás
   *     por ahí, o te comés la roca.
   *
   * 🔁 SEGUNDA VUELTA DEL DIBUJO *(Santi: "la quebrada no parece una quebrada.
   * Pensé que se estaba bugueando todo. Es una lámina gris sin sombras ni
   * profundidad")*. Lo que le faltaba, y que ahora tiene:
   *
   *  - **Borde de arriba quebrado**, no una línea recta: la roca no tiene
   *     escuadra. Sale de `revolver`, así que es siempre el mismo borde y no
   *     titila.
   *  - **Capas**: cada paredón son tres bandas de tono (la de arriba al sol,
   *     la del medio, y el pie en sombra), más vetas verticales cada pocas
   *     unidades.
   *  - **Profundidad**: pegado al tajo la roca se oscurece, porque esa cara ya
   *     está adentro de la grieta y no le da el sol.
   *  - **Sombra en el suelo**, al pie de cada pared, y el suelo del paso más
   *     oscuro: estás entrando en un lugar sin sol.
   */
  function dibujarQuebrada(r, dia) {
    const C = H.camino;
    const t = (suelo / C.largo - C.quebradaDesde) / (1 - C.quebradaDesde);
    if (t <= 0) return;
    const cerca = Math.min(1, t);
    // De noche se apaga menos que el resto: si no, la pared desaparece y el
    // paso deja de leerse (probado con 0,3 y no se veía nada).
    const c = (hex) => (dia ? hex : escalarColor(hex, 0.55));

    // --- 1. De lejos: dos paredones en el horizonte ---
    const base = H.cielo + 1;
    const alto = 4 + cerca * cerca * 46;
    const ancho = 26 + cerca * 110;
    const x0 = Math.round(r.width * 0.58 - ancho / 2 + (1 - cerca) * 40);
    const tajo = Math.max(6, 18 - cerca * 10);
    const mitad = (ancho - tajo) / 2;
    paredon(r, c, x0, base, mitad, alto, 1);
    paredon(r, c, x0 + mitad + tajo, base, mitad, alto, -1);
    // El tajo es sombra, no cielo: es lo que hay ENTRE las dos paredes.
    r.rect(x0 + mitad, base - alto * 0.82, tajo, alto * 0.82, c('#241d18'));
    r.rect(x0 + mitad, base - 3, tajo, 3, c('#171310'));

    // --- 2. De cerca: la boca, que es la que te frena ---
    const b = laBoca();
    if (!b) return;
    const y0 = b.centro - b.medio;
    const y1 = b.centro + b.medio;

    // La sombra que la pared tira sobre el suelo del paso.
    r.ctx.save();
    r.ctx.globalAlpha = 0.3;
    r.rect(0, y0, r.width, 5, '#000');
    r.rect(0, y1 - 4, r.width, 4, '#000');
    r.ctx.restore();

    paredDeLaBoca(r, c, 0, y0, r.width, 1);
    paredDeLaBoca(r, c, y1, r.height, r.width, -1);
    // Adentro no hay sol.
    r.tinte('#1a1410', b.cerrado * 0.3);
  }

  /**
   * UN PAREDÓN VISTO DE LEJOS: apoyado en `base`, con el borde de arriba
   * quebrado, tres capas de tono y vetas. `haciaElTajo` dice de qué lado está
   * la grieta, para oscurecer esa cara.
   */
  function paredon(r, c, x, base, ancho, alto, haciaElTajo) {
    if (ancho <= 1 || alto <= 1) return;
    for (let i = 0; i < ancho; i += 2) {
      // El borde de arriba, quebrado pero siempre igual (ver `revolver`).
      const dientes = (revolver(Math.round(x) + i * 7) % 5) - 2;
      const h = Math.max(2, alto + dientes);
      const cima = base - h;
      // Tres capas: sol arriba, cuerpo, pie en sombra.
      r.rect(x + i, cima, 2, 2, c('#9a8a73'));
      r.rect(x + i, cima + 2, 2, h * 0.45, c('#7a6b58'));
      r.rect(x + i, cima + 2 + h * 0.45, 2, h, c('#5d5044'));
      // Las vetas: una de cada cinco columnas va más oscura.
      if ((revolver(Math.round(x) + i) % 5) === 0) {
        r.rect(x + i, cima + 3, 1, h * 0.8, c('#4b4038'));
      }
      // La cara que da al tajo está adentro de la grieta: sin sol.
      const alTajo = haciaElTajo > 0 ? i > ancho - 8 : i < 8;
      if (alTajo) {
        r.ctx.save();
        r.ctx.globalAlpha = 0.45;
        r.rect(x + i, cima, 2, h, '#201914');
        r.ctx.restore();
      }
    }
  }

  /**
   * UNA PARED DE LA BOCA, ya encima tuyo: ocupa toda la franja desde el borde
   * de la pantalla hasta el paso. El canto que da al paso lleva la luz, y la
   * roca se va a la sombra hacia adentro.
   */
  function paredDeLaBoca(r, c, desde, hasta, ancho, haciaElPaso) {
    if (hasta - desde <= 0) return;
    const alto = hasta - desde;
    const canto = haciaElPaso > 0 ? hasta : desde;
    const hacia = (d) => canto - haciaElPaso * d;

    // El cuerpo de la roca, y más oscura cuanto más adentro (lejos del paso).
    r.rect(0, desde, ancho, alto, c('#6a5a4a'));
    for (let k = 0; k < 6; k++) {
      r.ctx.save();
      r.ctx.globalAlpha = 0.1;
      const y = hacia(alto * (k + 1) / 6);
      r.rect(0, Math.min(y, hacia(alto)), ancho, Math.abs(alto - alto * (k + 1) / 6) + 1, '#14100c');
      r.ctx.restore();
    }

    /**
     * LOS BLOQUES. La roca de una quebrada está partida en bloques grandes,
     * no es una plancha: cada uno con su tono, su junta oscura y su canto
     * iluminado arriba. Se sortean con `revolver` sobre la posición REAL en el
     * suelo, así que desfilan con el mundo en vez de quedarse pegados a la
     * pantalla.
     */
    const desplaza = Math.round(suelo) % 24;
    for (let bx = -24; bx < ancho + 24; bx += 24) {
      const x = bx - desplaza;
      const semilla = Math.round((suelo + bx) / 24);
      for (let capa = 0; capa < 4; capa++) {
        const h = alto / 4;
        const y = Math.min(hacia(h * capa), hacia(h * (capa + 1)));
        const s = revolver(semilla * 31 + capa * 7 + (haciaElPaso > 0 ? 0 : 999));
        const tonos = ['#6f5f4d', '#63543f', '#5a4c3d', '#75664f'];
        r.rect(x, y, 24, h, c(tonos[s % 4]));
        // La junta entre bloques, y el canto que agarra luz.
        r.rect(x, y, 24, 1, c('#463a2e'));
        r.rect(x, y + 1, 24 - (s % 7), 1, c('#8a7a63'));
        r.rect(x + 24 - 1, y, 1, h, c('#463a2e'));
        // Una grieta cada tanto.
        if (s % 6 === 0) r.rect(x + 6 + (s % 9), y + 2, 1, h - 4, c('#3a2f26'));
      }
    }

    // El canto del paso: la línea que agarra el sol, y su sombra abajo.
    const borde = haciaElPaso > 0 ? hasta - 3 : desde;
    r.rect(0, borde, ancho, 2, c('#a08e74'));
    r.rect(0, haciaElPaso > 0 ? borde + 2 : borde + 2, ancho, 1, c('#bfab8c'));

    /**
     * PIEDRAS SUELTAS AL PIE, sobre el suelo del paso: es lo que hace que la
     * pared se APOYE en el piso en vez de estar recortada sobre él.
     */
    for (let px = -20; px < ancho + 20; px += 20) {
      const x = px - (Math.round(suelo) % 20);
      const s = revolver(Math.round((suelo + px) / 20) * 17 + (haciaElPaso > 0 ? 3 : 8));
      if (s % 3 !== 0) continue;
      const w = 5 + (s % 5);
      const alt = 3 + (s % 4);
      const y = haciaElPaso > 0 ? hasta - 1 : desde - alt + 1;
      r.rect(x, y, w, alt, c('#5a4c3d'));
      r.rect(x, y, w, 1, c('#83725c'));
    }
  }

  /**
   * EL BORDE SE PONE ROJO CUANDO TE TIENEN ENCIMA. Reemplaza a la barra de
   * distancia: se ve sin mirar la HUD, que es de lo que se trata cuando tenés
   * a alguien a diez metros tirándote.
   */
  function dibujarAcoso(r) {
    if (fin) return;
    const quedan = siguiendo();
    if (!quedan.length) return;
    const cerca = Math.min(...quedan.map((j) => yo.x - j.x));
    const t = Math.max(0, Math.min(1, (110 - cerca) / 80));
    if (t <= 0) return;
    r.ctx.save();
    // Vienen de atrás, así que el aviso entra por la izquierda y se derrama
    // por arriba y por abajo. La derecha queda limpia: para allá vas.
    r.ctx.globalAlpha = 0.1 + t * 0.2;
    r.ctx.fillStyle = colors.enemyAlert;
    const grosor = 2 + t * 3;
    r.ctx.fillRect(0, 0, grosor * 2.5, r.height);
    r.ctx.fillRect(0, 0, r.width * 0.6, grosor);
    r.ctx.fillRect(0, r.height - grosor, r.width * 0.6, grosor);
    r.ctx.restore();
  }

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
      const texto = fin.como === 'limpio' ? T.huida.todosCaidos
        : fin.como === 'quebrada' ? T.huida.quebrada
        : T.huida.losPerdiste;
      r.text(texto, centro, 60, colors.bagLoot);
    } else {
      const quedan = siguiendo();
      r.text(T.huida.teSiguen(quedan.length), centro, 8, colors.enemyAlert);
      /**
       * LA BARRA ES EL CAMINO: cuánto falta para la quebrada. La distancia a
       * los jinetes ya no necesita barra — se ve, y cuando te tienen cerca el
       * borde de la pantalla se pone rojo (ver `dibujarAcoso`).
       */
      const ancho = 120;
      const t = Math.max(0, Math.min(1, suelo / H.camino.largo));
      r.rect(centro - ancho / 2, 14, ancho, 3, '#241c18');
      r.rect(centro - ancho / 2, 14, ancho * t, 3, colors.doorGlow);
      // La boca de la quebrada, al final de la barra.
      r.rect(centro + ancho / 2 - 1, 12, 2, 7, colors.bagLoot);
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

/**
 * Un entero revuelto a partir de otro, siempre el mismo para el mismo número:
 * para que la roca de la quebrada tenga su forma quebrada sin guardar una
 * lista y sin titilar. Es el mismo de rideScene y campScene.
 */
function revolver(n) {
  let t = (n * 374761393 + 668265263) | 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177);
  return (t ^ (t >>> 16)) >>> 0;
}
