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
import { caballoActual, HORSES, esperaDelImpulso, APROXIMACION as A } from '../data/horse.js';
import { applyRaidResult, recompensaTapada, gameState } from '../state/gameState.js';
import { T } from '../text/es.js';
import { GOLPES, dibujarAnimal, dibujarJinete } from '../entities/caballo.js';
import { dibujarTendido } from '../entities/figura.js';
import { sembrarDesierto } from '../world/desierto.js';
import { dibujarObstaculoDesierto } from '../world/obstaculosDesierto.js';
import { crearPolvo } from '../world/polvoDeCascos.js';
import {
  DESTINOS, refugiosDeLaRegion, ACHATA, dibujarRefugio, dibujarDeLejos,
  chocaConElRefugio, adentroDelRefugio,
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
  /** Cuántos tiraste del caballo forcejeando (no son muertos: van aparte). */
  let tirados;
  let fin, temblor, avisoCansancio, ultimoGrito, bamboleo;
  /** Cuánto falta para que a alguno le toque cortarte el paso (ver `elegirCortador`). */
  let proximoCortador;
  /**
   * Y EL LAZO TIENE SU PROPIO RELOJ, aparte del de arriba.
   *
   * 🐛 Con uno solo no salía NUNCA. El turno se revisa cada 7 u 8 segundos, y
   * en ese instante exacto el que lleva el lazo tenía que estar además entre
   * 60 y 140 unidades — una ventana de un cuadro contra una condición de
   * distancia que va y viene. Los otros dos se pueden lanzar desde cualquier
   * lado; el lazo no, así que necesita esperar su momento en vez de perder el
   * turno.
   */
  let proximoLazo;
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
      /**
       * EL FONDO Y EL ENVIÓN (ver `HUIDA.jugador.fondo` e `.impulso`):
       * `aguante` es el tanque del caballo, que se gasta SIEMPRE que galopa;
       * `extra` es lo que está empujando de más ahora mismo; `impulsoTimer` lo
       * que le queda al envión; `esperaImpulso` cuánto falta para el próximo, y
       * `reventado` es el caballo caído al paso porque se quedó sin nada.
       */
      extra: 0,
      aguante: caballo.aguanteMax,
      impulsoTimer: 0,
      esperaImpulso: 0,
      reventado: false,
      /**
       * EL FORCEJEO (ver `HUIDA.jugador.forcejeo`): `forcejeo` es el jinete
       * que te tiene agarrado y cómo va la pulseada; `gracia`, el rato en que
       * nadie puede volver a agarrarte.
       */
      forcejeo: null,
      gracia: 0,
      /**
       * 🪢 EL LAZO (ver `HUIDA.jinetes.lazo`): el jinete que te tiene
       * enlazado y cómo va el corte de la soga. Comparte la `gracia` con el
       * forcejeo a propósito: son la misma mecánica, una de cerca y otra de
       * lejos, y encadenarlas te sacaría el control de la huida.
       */
      lazo: null,
      /** Cuánto estás doblando ahora mismo: al que lazea le cuesta más pegarte. */
      doblando: 0,
    };

    /**
     * 🔬 EL BANCO DE PRUEBAS — sólo con `prueba`, y sólo de lectura.
     *
     * Es lo que deja correr pilotos automáticos desde la consola (F12) para
     * MEDIR la huida, que es como se eligieron todos los números de esta
     * escena: cuántos lazos por corrida, cuánta plata cuesta jugarla bien y
     * cuánta jugarla mal. Sin esto hay que adivinar, y adivinar fue lo que
     * llevó a poner las riendas en 0,7 cuando correspondían 0,5.
     */
    if (prueba) window.HUIDA_BANCO = () => ({ yo, jinetes, obstaculos, refugios, tiempo, fin, perdido, soltadas, tirados, derribados });

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
    tirados = 0;
    fin = null;
    temblor = 0;
    avisoCansancio = false;
    ultimoGrito = -99;
    proximoCortador = H.jinetes.tactica.cortador.cada;
    proximoLazo = H.jinetes.lazo.cada * 0.5;
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
      get tirados() { return tirados; },
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
   * LOS REFUGIOS DE LA REGIÓN, REPARTIDOS EN EL CAMPO *(Santi: "deberíamos
   * hacer que los puntos de llegada sean aleatorios sus ubicaciones, para que
   * no siempre se elija uno y no otro")*.
   *
   * En el desierto son DOS —la quebrada y el bosque de rocas—; el río se fue a
   * esperar su región *(Santi: "eliminaría el río y lo dejaría para otra
   * región... hoy estamos en desierto")*, ver `refugiosDeLaRegion`.
   *
   * SE SORTEA TODO: cuál cae de qué lado, a qué rumbo dentro de un abanico
   * ancho (`abanicoGrados` para cada lado) y a qué distancia, cada uno por SU
   * cuenta. Lo único que no queda librado al azar es que no caigan dos en el
   * mismo rumbo. El reparto: se apartan las separaciones mínimas, se tira un
   * corte al azar por refugio en lo que sobra del abanico, se ordenan, y cada
   * uno se corre una separación más que el anterior. Pueden terminar los dos
   * de un costado o uno en cada punta —lo que salga—, pero nunca uno encima
   * del otro. Sirve para dos, para tres o para los que haya.
   */
  function sembrarRefugios() {
    const M = H.mundo;
    const C = M.caracter;
    const grados = (g) => (g * Math.PI) / 180;
    const ids = refugiosDeLaRegion('desierto');
    // Barajar, para que no salga siempre el mismo del mismo lado.
    for (let i = ids.length - 1; i > 0; i--) {
      const j = rng.int(0, i);
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }

    const abanico = grados(M.abanicoGrados) * 2;
    const sep = grados(M.separacionGrados);
    const sobra = Math.max(0, abanico - sep * (ids.length - 1));
    const cortes = ids.map(() => rng.range(0, sobra)).sort((a, b) => a - b);

    refugios = ids.map((id, i) => {
      const rumbo = -abanico / 2 + cortes[i] + sep * i;
      const dist = rng.range(M.distanciaMin, M.distanciaMax);
      const x = Math.cos(rumbo) * dist;
      const y = Math.sin(rumbo) * dist * PROFUNDIDAD;
      // Para dónde queda el campo del que vas a venir, visto desde el refugio.
      const llegada = Math.atan2(-y / PROFUNDIDAD, -x);
      /**
       * LA QUEBRADA ESCONDE LA ENTRADA: le cae de costado o casi del otro
       * lado, así que hay que rodear el paredón con ellos encima. Los demás la
       * tienen de frente, apenas corrida.
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
    const C = H.mundo.caracter;
    // El bosque es más grande que los otros dos: es un bosque, no un cantero.
    return refugios.find((d) => {
      const lejos = d.tipo === 'bosque' ? C.bosqueAlrededor : C.alrededor;
      return Math.hypot(d.x - x, (d.y - y) / PROFUNDIDAD) < lejos;
    }) || null;
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
      /** Su envión: cuánto le queda de tirón y cuánto para el próximo. */
      empuje: 0,
      empujeVel: 0,
      recarga: rng.range(0, J.impulso.recarga),
      usos: J.impulso.usos,
      /** Cuánto le queda de intentar cortarte el paso (0 = va en la cola). */
      corta: 0,
      cortaLado: 1,
      /** Y lo mismo, pero para arrimarse a tu costado y agarrarte. */
      arrima: 0,
      arrimaLado: 1,
      /**
       * 🪢 EL LAZO: uno de cada tres lo lleva, y se le ve enrollado en la
       * montura. `revolea` es lo que le falta de revolearlo antes de soltarlo
       * —el aviso— y `soga` es la que ya salió y está volando hacia vos.
       */
      lazo: rng.chance(J.lazo.llevan),
      /** Cuánto le queda de acercarse para poder tirarlo (0 = va en la cola). */
      lazando: 0,
      revolea: 0,
      soga: 0,
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
    forcejear(dt);
    tironearDelLazo(dt);
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

    /**
     * ⛔ ACÁ NO SE APUNTA *(Santi: "me parece irreal que se pueda apuntar
     * mientras vas cabalgando, esquivando obstáculos y encima mientras te
     * disparan")*. En el asalto el clic derecho cierra la mira; a caballo,
     * el que dispara lo hace como puede.
     */
    yo.apuntado = 0;
    const manejo = 1;

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
    // Lo guardamos porque al que te lazea le cuesta más pegarle a un blanco
    // que está doblando (ver `enlazar`).
    yo.doblando = error;
    if (yo.desvio > 0) yo.rumbo += yo.desvioDir * 0.5 * dt;

    if (yo.choque > 0) yo.choque -= dt;

    empujar(dt);

    // Doblando cerrado se pierde envión, y [SHIFT] frena para pelear.
    const curva = 1 - (1 - J.frenoEnCurva) * Math.min(1, error / Math.PI);
    // Sin fondo el caballo va al paso, y ahí lo único que queda es pelear.
    const base = yo.reventado ? J.fondo.pasoVelocidad
      : yo.frena ? caballo.brakeSpeed
      : caballo.sprintSpeed + yo.extra;
    // Y forcejeando te van frenando: es lo que hace el tipo colgado de vos.
    const fondo = base * curva * frenoDelForcejeo();
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

  /**
   * 🐎 EL ENVIÓN: [ESPACIO] mientras haya aguante *(Santi: "un avance de
   * velocidad cortito... la cantidad de impulso va a depender de la
   * resistencia del caballo y la velocidad de ese impulso de la aceleración")*.
   *
   * Los dos números salen del ANIMAL, no de la escena: el tanque es su
   * `aguanteMax` (el Criollo tiene fondo, el Mustang no) y lo que tarda el
   * tirón en entrar es su `aceleracion` (el Mustang salta, el Criollo se
   * demora). Como el envión se usa de a tirones cortos, esa demora también
   * decide cuánto le sacás a cada toque.
   *
   * Frenando ([SHIFT]) no hay envión: son dos cosas opuestas.
   */
  function empujar(dt) {
    const I = H.jugador.impulso;
    const F = H.jugador.fondo;

    /**
     * 1. EL FONDO SE GASTA SIEMPRE QUE GALOPÁS. Frenado o al paso, en cambio,
     * el caballo respira: es el único momento en que recupera, y por eso
     * [SHIFT] dejó de ser sólo "frenar para pelear".
     */
    if (!fin) {
      if (yo.frena || yo.reventado) {
        yo.aguante = Math.min(caballo.aguanteMax, yo.aguante + F.recupera * dt);
      } else {
        yo.aguante = Math.max(0, yo.aguante - F.galopeGasto * dt);
      }
    }

    // 2. Sin nada en el tanque, el caballo cae al paso hasta que se repone.
    if (!yo.reventado && yo.aguante <= 0 && !fin) {
      yo.reventado = true;
      yo.impulsoTimer = 0;
      audio.play('relincho');
      carteles.push({ x: yo.x, y: yo.y - 30, texto: T.huida.reventado, color: colors.enemyAlert, vida: 2.4 });
    } else if (yo.reventado && yo.aguante >= caballo.aguanteMax * F.revive) {
      yo.reventado = false;
      carteles.push({ x: yo.x, y: yo.y - 30, texto: T.huida.repuesto, color: colors.bagLoot, vida: 1.6 });
    }

    /**
     * 3. EL ENVIÓN ES UN TOQUE: dura lo mismo para todos y la espera sale de
     * la aceleración del caballo (`esperaDelImpulso`). Frenando y reventado no
     * hay envión.
     */
    yo.esperaImpulso = Math.max(0, yo.esperaImpulso - dt);
    if (yo.impulsoTimer > 0) yo.impulsoTimer -= dt;

    const puede = !fin && !yo.frena && !yo.reventado
      && yo.esperaImpulso <= 0 && yo.impulsoTimer <= 0 && yo.aguante > I.costo;
    if (puede && input.wasPressed('Space')) {
      yo.impulsoTimer = I.dura;
      yo.esperaImpulso = esperaDelImpulso(caballo);
      yo.aguante = Math.max(0, yo.aguante - I.costo);
      audio.play('zancada');
    }

    const objetivo = yo.impulsoTimer > 0 ? caballo.sprintSpeed * I.empuje : 0;
    if (yo.extra < objetivo) yo.extra = Math.min(objetivo, yo.extra + caballo.aceleracion * dt);
    else yo.extra = Math.max(objetivo, yo.extra - I.caida * dt);

    // Una estela de polvo, pero no una sola nube maciza: de a tres cuadros.
    if (yo.impulsoTimer > 0 && rng.chance(0.3)) {
      polvo.sembrar({ x: yo.x, y: yo.y, suelo: 0, rumbo: 0, fuerza: 0.5,
        pisadas: [[GOLPES.traseraAlla, -8], [GOLPES.traseraAca, -6]], cuantas: 1 });
    }
  }

  /**
   * 🤝 EL FORCEJEO — la parte tuya. Ver `HUIDA.jugador.forcejeo` para el
   * pedido de Santi y los números.
   */
  function frenoDelForcejeo() {
    let freno = 1;
    if (yo.forcejeo) {
      const F = H.jugador.forcejeo;
      const t = Math.min(1, yo.forcejeo.t / F.dura);
      freno = Math.min(freno, F.frena + (F.frenaFinal - F.frena) * t);
    }
    if (yo.lazo) {
      const L = H.jinetes.lazo;
      const t = Math.min(1, yo.lazo.t / L.dura);
      freno = Math.min(freno, L.frena + (L.frenaFinal - L.frena) * t);
    }
    return freno;
  }

  /** ¿ESTE JINETE TE ENGANCHÓ? Sólo el que viene arrimándose, y a la par. */
  function intentarAgarrar(j) {
    if (yo.forcejeo || yo.gracia > 0 || fin || yo.choque > 0 || j.choque > 0) return;
    const F = H.jugador.forcejeo.agarra;
    const dx = j.x - yo.x;
    const dy = (j.y - yo.y) / PROFUNDIDAD;
    // Cuánto te sacó (sobre tu rumbo) y cuánto está al costado.
    const largo = dx * Math.cos(yo.rumbo) + dy * Math.sin(yo.rumbo);
    const costado = -dx * Math.sin(yo.rumbo) + dy * Math.cos(yo.rumbo);
    if (Math.abs(largo) > F.largo || Math.abs(costado) > F.costado) return;
    const dif = Math.atan2(Math.sin(j.rumbo - yo.rumbo), Math.cos(j.rumbo - yo.rumbo));
    if (Math.abs(dif) > F.rumbo) return;

    yo.forcejeo = { j, t: 0, golpes: 0, lado: costado >= 0 ? 1 : -1 };
    j.arrima = 0;
    temblor = 0.3;
    audio.play('gritoLey');
    carteles.push({ x: yo.x, y: yo.y - 34, texto: T.huida.forcejeo, color: colors.enemyAlert, vida: 1.4 });
  }

  /**
   * MIENTRAS TE TIENE AGARRADO: te frena, no podés disparar, y se sale a los
   * golpes de [E]. Lo corta un choque, el envión (pero no lo tirás) o el
   * tiempo — nunca te saca bolsas, que eso lo dijo Santi desde el principio.
   */
  function forcejear(dt) {
    yo.gracia = Math.max(0, yo.gracia - dt);
    if (!yo.forcejeo) return;
    const F = H.jugador.forcejeo;
    const f = yo.forcejeo;
    f.t += dt;

    if (input.wasPressed('KeyE')) {
      f.golpes += 1;
      temblor = 0.18;
      audio.play('hitFlesh');
      if (f.golpes >= F.golpes) { soltarForcejeo('tirado'); return; }
    }

    if (!f.j.alive || f.j.perdido || fin) { soltarForcejeo('nada'); return; }
    if (yo.choque > 0 || f.j.choque > 0) { soltarForcejeo('choque'); return; }
    if (yo.impulsoTimer > 0) { soltarForcejeo('envion'); return; }
    if (f.t >= F.dura) { soltarForcejeo('solto'); return; }
  }

  function soltarForcejeo(como) {
    const f = yo.forcejeo;
    if (!f) return;
    yo.forcejeo = null;
    yo.gracia = H.jugador.forcejeo.gracia;
    if (como === 'tirado') {
      f.j.alive = false;
      tirados += 1;
      caidos.push({ x: f.j.x, y: f.j.y });
      audio.play('relincho');
      audio.play('hitFlesh');
      carteles.push({ x: f.j.x, y: f.j.y - 28, texto: T.huida.loTiraste, color: colors.bagLoot, vida: 1.8 });
      return;
    }
    if (como === 'nada') return;
    const texto = como === 'choque' ? T.huida.forcejeoChoque
      : como === 'envion' ? T.huida.forcejeoEnvion : T.huida.forcejeoSolto;
    carteles.push({ x: yo.x, y: yo.y - 34, texto, color: colors.textDim, vida: 1.4 });
  }

  // -------------------------------------------------------------- el lazo

  /** ¿Está a tiro de soga? Ni encima tuyo ni a media legua. */
  function aTiroDeLazo(j) {
    const L = H.jinetes.lazo;
    const d = Math.hypot(yo.x - j.x, (yo.y - j.y) / PROFUNDIDAD);
    return d >= L.desde && d <= L.hasta;
  }

  /**
   * 🪢 LA SOGA LLEGÓ: acá se decide si te enganchó. Ver `HUIDA.jinetes.lazo`
   * para el pedido de Santi y los números.
   *
   * La puntería baja con la distancia y con lo que estés doblando, y con el
   * envión puesto **falla siempre**: ése es el premio por haber reaccionado al
   * revoleo, y es lo que hace que el aviso valga la pena.
   */
  function enlazar(j) {
    const L = H.jinetes.lazo;
    const fallar = (porque) => {
      carteles.push({ x: yo.x, y: yo.y - 34, texto: porque, color: colors.textDim, vida: 1.3 });
    };
    if (yo.lazo || yo.forcejeo || yo.gracia > 0 || fin || !j.alive || j.perdido) return;

    const d = Math.hypot(yo.x - j.x, (yo.y - j.y) / PROFUNDIDAD);
    let p = L.punteria - Math.max(0, d - L.desde) * L.porUnidad;
    if (Math.abs(yo.doblando) > L.giroQueCuenta) p -= L.doblando;
    p = Math.max(0.03, Math.min(0.95, p));
    // Y el envión no lo anula: lo dificulta (ver `lazo.conEnvion`).
    if (yo.impulsoTimer > 0) p *= L.conEnvion;
    if (!rng.chance(p)) { fallar(T.huida.lazoFallo); return; }

    yo.lazo = { j, t: 0, golpes: 0 };
    temblor = 0.35;
    audio.play('relincho');
    carteles.push({ x: yo.x, y: yo.y - 34, texto: T.huida.enlazado, color: colors.enemyAlert, vida: 1.6 });
  }

  /**
   * MIENTRAS TE TIENE ENLAZADO: te frena como el forcejeo, no podés disparar
   * y **te arrastra hacia atrás** *(Santi: "hacerlo retroceder")*, que es la
   * diferencia de verdad con el forcejeo. Se sale a los golpes de [E], y lo
   * cortan también un choque o el envión.
   */
  function tironearDelLazo(dt) {
    if (!yo.lazo) return;
    const L = H.jinetes.lazo;
    const f = yo.lazo;
    f.t += dt;

    if (input.wasPressed('KeyE')) {
      f.golpes += 1;
      temblor = 0.18;
      audio.play('hitFlesh');
      if (f.golpes >= L.golpes) { cortarElLazo('cortado'); return; }
    }

    if (!f.j.alive || f.j.perdido || fin) { cortarElLazo('nada'); return; }
    if (yo.choque > 0 || f.j.choque > 0) { cortarElLazo('choque'); return; }
    if (yo.impulsoTimer > 0 && L.cortaConEnvion) { cortarElLazo('envion'); return; }
    if (f.t >= L.dura) { cortarElLazo('solto'); return; }

    // Y la soga te lleva: perdés terreno de verdad, no sólo velocidad.
    yo.x -= Math.cos(yo.rumbo) * L.arrastre * dt;
    yo.y -= Math.sin(yo.rumbo) * L.arrastre * dt * PROFUNDIDAD;
  }

  /**
   * SE SOLTÓ, Y CÓMO. Cortarla es lo único que lo deja **sin lazo para el
   * resto de la huida**: si no, el mismo jinete te reengancha apenas se te
   * termina la gracia. Y al jinete no lo tirás nunca — está lejos.
   */
  function cortarElLazo(como) {
    const f = yo.lazo;
    if (!f) return;
    yo.lazo = null;
    yo.gracia = H.jugador.forcejeo.gracia;
    if (como === 'cortado') f.j.lazo = false;
    if (como === 'nada') return;
    const texto = como === 'cortado' ? T.huida.lazoCortado
      : como === 'choque' ? T.huida.lazoChoque
      : como === 'envion' ? T.huida.lazoEnvion : T.huida.lazoSolto;
    carteles.push({
      x: yo.x, y: yo.y - 34, texto,
      color: como === 'cortado' ? colors.bagLoot : colors.textDim,
      vida: 1.6,
    });
    if (como === 'cortado') audio.play('hitFlesh');
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
  /** Recargar a galope tendido cuesta; frenado, no (ver `recargaACaballo`). */
  function costoDeRecargar() {
    return yo.frena ? 1 : (H.jugador.recargaACaballo || 1);
  }

  function disparar(dt) {
    yo.fireTimer -= dt;
    // Con un tipo colgado del brazo no se tira: las dos manos están ocupadas.
    // Y con la soga en el cuello del caballo, tampoco: estás sujetándote.
    if (yo.forcejeo || yo.lazo) return;
    if (yo.recargando > 0) {
      yo.recargando -= dt;
      if (yo.recargando <= 0) yo.balas = arma.magazine;
      return;
    }
    if (input.wasPressed('KeyR') && yo.balas < arma.magazine) {
      yo.recargando = arma.reloadTime * costoDeRecargar();
      return;
    }
    if (!input.mouse.down || yo.fireTimer > 0) return;
    if (yo.balas <= 0) { yo.recargando = arma.reloadTime * costoDeRecargar(); return; }

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

  /**
   * 🚧 A UNO LE TOCA CORTARTE EL PASO. Se elige al más cercano de los que
   * están en condiciones, y sólo si no hay otro intentándolo: uno adelante y
   * el resto en la cola. Le presta el envión para llegar, que es justo para lo
   * que Santi lo pidió del lado de ellos.
   */
  function elegirCortador(dt) {
    /**
     * ⚠️ SE LLAMA `TAC` Y NO `T` A PROPÓSITO: `T` son los textos del juego
     * (`text/es.js`), y llamar `T` a la táctica acá adentro los tapaba. La
     * primera versión del lazo pedía `T.huida.lazoViene` y se encontraba con
     * la táctica de los jinetes.
     */
    const TAC = H.jinetes.tactica;
    proximoCortador -= dt;
    proximoLazo -= dt;
    const siguiendoAhora = siguiendo();
    // Uno por vez y nada más: ni dos cortando, ni uno cortando y otro colgado,
    // ni uno colgado y otro revoleando el lazo.
    if (siguiendoAhora.some((j) => j.corta > 0 || j.arrima > 0 || j.lazando > 0 || j.revolea > 0 || j.soga > 0)) return;
    if (yo.forcejeo || yo.lazo || siguiendoAhora.length === 0) return;

    /**
     * 🪢 Y PRIMERO, EL LAZO. Si hay alguno que lo lleve y esté a tiro de soga,
     * le toca a él casi la mitad de las veces. Va antes que los otros dos
     * porque es el único que necesita una distancia concreta: el cortador y el
     * arrimador pueden salir en cualquier momento, el lazo no.
     */
    const L = H.jinetes.lazo;
    const conLazo = yo.gracia > 0 || proximoLazo > 0
      ? []
      : siguiendoAhora.filter((j) => j.lazo);
    if (conLazo.length > 0) {
      let elLazador = conLazo[0];
      for (const j of conLazo) {
        const d = Math.hypot(yo.x - j.x, (yo.y - j.y) / PROFUNDIDAD);
        const mejorD = Math.hypot(yo.x - elLazador.x, (yo.y - elLazador.y) / PROFUNDIDAD);
        if (d < mejorD) elLazador = j;
      }
      // Se le acerca con el lazo en la mano: recién cuando llegue lo revolea.
      elLazador.lazando = L.acercaDura;
      proximoLazo = L.cada;
      // Y se le da aire al otro turno, para que no te caiga un cortador encima
      // justo mientras estás cortando la soga.
      proximoCortador = Math.max(proximoCortador, 4);
      if (elLazador.usos > 0 && elLazador.empuje <= 0) {
        elLazador.empuje = H.jinetes.impulso.dura;
        elLazador.recarga = H.jinetes.impulso.recarga;
        elLazador.usos -= 1;
      }
      audio.play('gritoLey');
      return;
    }

    /**
     * 🐛 Y RECIEN ACA EL TURNO DE LOS OTROS DOS. El lazo quedaba debajo de
     * este `return` aunque tuviera su propio reloj, así que sólo podía salir
     * en el mismo instante en que le tocaba al cortador: una vez por corrida
     * en vez de las cuatro o cinco que corresponden.
     */
    if (proximoCortador > 0 || siguiendoAhora.length < 2) return;

    /**
     * SE ALTERNAN LOS DOS TRABAJOS: uno se te cruza adelante y el siguiente se
     * te pega al costado a agarrarte. Así la partida no hace siempre lo mismo
     * y cada corrida tiene las dos cosas.
     */
    const arrimar = yo.gracia <= 0 && rng.chance(0.5);
    const C = arrimar ? TAC.arrimador : TAC.cortador;

    let elegido = null;
    let mejor = C.distanciaMax;
    for (const j of siguiendoAhora) {
      const d = Math.hypot(yo.x - j.x, (yo.y - j.y) / PROFUNDIDAD);
      if (d < mejor) { mejor = d; elegido = j; }
    }
    proximoCortador = C.cada;
    if (!elegido) return;

    if (arrimar) {
      elegido.arrima = C.dura;
      elegido.arrimaLado = rng.chance(0.5) ? 1 : -1;
    } else {
      elegido.corta = C.dura;
      elegido.cortaLado = rng.chance(0.5) ? 1 : -1;
    }
    // Le presta el envión, si le queda: sin eso no llega ni adelante ni al lado.
    if (elegido.usos > 0 && elegido.empuje <= 0) {
      elegido.empuje = H.jinetes.impulso.dura;
      elegido.recarga = H.jinetes.impulso.recarga;
      elegido.usos -= 1;
    }
    audio.play('gritoLey');
  }

  function moverJinetes(dt, yendose) {
    const J = H.jinetes;
    const C = J.tactica.cortador;
    const AR = J.tactica.arrimador;
    if (!yendose && !fin) elegirCortador(dt);

    /**
     * DÓNDE VAS A ESTAR dentro de un ratito. Todos los jinetes persiguen ESTE
     * punto y no el de ahora: es lo que los hace cortar las curvas por adentro
     * en vez de dibujarlas enteras detrás tuyo.
     */
    const anticipo = J.tactica.anticipo;
    const futuro = {
      x: yo.x + Math.cos(yo.rumbo) * yo.vel * anticipo,
      y: yo.y + Math.sin(yo.rumbo) * yo.vel * PROFUNDIDAD * anticipo,
    };

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

      /**
       * EL QUE TE TIENE AGARRADO no persigue nada: va pegado a tu costado,
       * con tu mismo rumbo, y no dispara — tiene las dos manos ocupadas.
       */
      if (yo.forcejeo && yo.forcejeo.j === j) {
        const F = H.jugador.forcejeo.agarra;
        j.x = yo.x - Math.sin(yo.rumbo) * F.costado * 1.15 * yo.forcejeo.lado;
        j.y = yo.y + Math.cos(yo.rumbo) * F.costado * 1.15 * yo.forcejeo.lado * PROFUNDIDAD;
        j.rumbo = yo.rumbo;
        j.aimTimer = 0;
        j.empujeVel = 0;
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
       * A DÓNDE VA. Dos lugares posibles, y los dos se calculan sobre DÓNDE
       * VAS A ESTAR y no sobre dónde estás (ver `tactica.anticipo`):
       *
       *  - EL DE LA COLA va a SU lugar detrás tuyo, abierto en abanico. Como
       *    el campo es abierto, "detrás" es detrás de tu RUMBO: si doblás, la
       *    partida entera describe la curva con vos.
       *  - EL CORTADOR va adelante y al costado, a meterse en tu camino.
       */
      const objetivo = j.corta > 0
        ? {
          x: futuro.x + Math.cos(yo.rumbo) * C.adelanto
            - Math.sin(yo.rumbo) * C.costado * j.cortaLado,
          y: futuro.y + (Math.sin(yo.rumbo) * C.adelanto
            + Math.cos(yo.rumbo) * C.costado * j.cortaLado) * PROFUNDIDAD,
        }
        : j.arrima > 0
        ? {
          // Pegado a tu costado: es desde donde te puede agarrar.
          x: futuro.x - Math.sin(yo.rumbo) * AR.costado * j.arrimaLado,
          y: futuro.y + Math.cos(yo.rumbo) * AR.costado * j.arrimaLado * PROFUNDIDAD,
        }
        : {
          /**
           * EL DE LA COLA va a SU lugar — salvo que esté yendo a lazarte, y
           * entonces el mismo lugar pero mucho más cerca: `lazo.acerca`.
           */
          x: futuro.x - Math.cos(yo.rumbo + j.carril) * (j.lazando > 0 ? H.jinetes.lazo.acerca : j.atras),
          y: futuro.y - Math.sin(yo.rumbo + j.carril) * (j.lazando > 0 ? H.jinetes.lazo.acerca : j.atras) * PROFUNDIDAD,
        };
      const haciaAlla = Math.atan2((objetivo.y - j.y) / PROFUNDIDAD, objetivo.x - j.x);
      if (j.corta > 0) j.corta -= dt;
      if (j.arrima > 0) { j.arrima -= dt; intentarAgarrar(j); }

      /**
       * 🪢 EL LAZO, EN DOS TIEMPOS: primero lo revolea sobre la cabeza (ése es
       * tu aviso) y después la soga vuela un momento antes de llegar. Los dos
       * tiempos existen para lo mismo: que el enganche nunca sea instantáneo.
       */
      if (j.lazando > 0) {
        j.lazando -= dt;
        // Llegó a tiro: ahora sí lo revolea. Y si se le acabó el tiempo sin
        // llegar, se vuelve a la cola sin tirar nada.
        if (aTiroDeLazo(j) && !yo.lazo && !yo.forcejeo && yo.gracia <= 0) {
          j.lazando = 0;
          j.revolea = H.jinetes.lazo.revoleo;
          carteles.push({
            x: j.x, y: j.y - 38,
            texto: T.huida.lazoViene, color: colors.enemyAlert, vida: 1.2,
          });
        }
      } else if (j.revolea > 0) {
        j.revolea -= dt;
        if (j.revolea <= 0) j.soga = H.jinetes.lazo.vuelo;
      } else if (j.soga > 0) {
        j.soga -= dt;
        if (j.soga <= 0) enlazar(j);
      }

      // Apuntando no dobla: el aviso vale porque el tiro sale de donde lo viste.
      if (j.aimTimer > 0) {
        j.aimTimer -= dt;
        if (j.aimTimer <= 0) tirar(j);
      } else {
        girarHacia(j, haciaAlla, H.jinetes.giro, dt);
        esquivarConElCaballo(j, dt);
      }
      empujarJinete(j, dt);
      avanzar(j, velocidadDelCortador(j), dt);
      chocarJinete(j);

      j.cooldown -= dt;
      const d = Math.hypot(yo.x - j.x, (yo.y - j.y) / PROFUNDIDAD);
      if (j.cooldown <= 0 && d < J.alcance && j.aimTimer <= 0) {
        // De lejos tiran, pero mucho menos seguido (ver `cadenciaLejos`).
        const lejano = d > J.cadenciaLejosDesde ? J.cadenciaLejos : 1;
        if (tiempo - ultimoGrito > J.gritoCada && rng.chance(J.chanceGrito)) {
          ultimoGrito = tiempo;
          audio.play('gritoLey');
        }
        j.aimTimer = J.apuntar;
        j.aimDir = Math.atan2((yo.y - 8 - (j.y - 14)) / PROFUNDIDAD, yo.x - (j.x + 6));
        j.cooldown = (J.cadencia + rng.range(0, J.cadenciaAzar)) * lejano;
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

  /**
   * 🐎 EL ENVIÓN DE UN JINETE. El mismo tirón que el tuyo, del otro lado:
   * cuando quedó descolgado aprieta y se vuelve a pegar. Tiene recarga para
   * que no sea un caballo volando todo el tiempo.
   *
   * Por ahora lo usan SÓLO para eso. Cortarte el paso y anticiparte —que es
   * para lo que pidió Santi el envión de ellos— viene en la vuelta siguiente.
   */
  /**
   * LO QUE CORRE ESTE JINETE AHORA. Lo normal es su galope más el envión si lo
   * está usando; el que te está cortando el paso, en cambio, sostiene el
   * empuje todo el intento —si no, nunca te pasa— y **se planta a tu
   * velocidad** en cuanto logró ponerse adelante.
   */
  function velocidadDelCortador(j) {
    const base = velocidadDelJinete(j) + j.empujeVel;
    const T = H.jinetes.tactica;
    // El que va a lazarte corre igual que el que va a cruzarse: sin eso no
    // llega nunca a tiro de soga y el lazo no existe.
    if (j.lazando > 0) return base + j.vel * T.cortador.empuje;
    if (j.corta <= 0 && j.arrima <= 0) return base;

    // Cuánto te sacó midiendo SOBRE TU RUMBO: positivo, ya está adelante.
    const dx = j.x - yo.x;
    const dy = (j.y - yo.y) / PROFUNDIDAD;
    const adelanto = dx * Math.cos(yo.rumbo) + dy * Math.sin(yo.rumbo);

    if (j.arrima > 0) {
      // A la altura de tu montura Y ya al costado, se acomoda; si no, corre.
      const costado = -dx * Math.sin(yo.rumbo) + dy * Math.cos(yo.rumbo);
      const aLaAltura = Math.abs(adelanto) < T.arrimador.acomodaDesde
        && Math.abs(costado) < T.arrimador.acomodaCostado;
      if (aLaAltura) return Math.min(base, yo.vel);
      return base + j.vel * T.arrimador.empuje;
    }
    if (adelanto > T.cortador.bloqueaDesde) return Math.min(base, yo.vel + T.cortador.bloqueaExtra);
    return base + j.vel * T.cortador.empuje;
  }

  function empujarJinete(j, dt) {
    const I = H.jinetes.impulso;
    j.recarga -= dt;
    if (j.empuje > 0) {
      j.empuje -= dt;
    } else if (j.recarga <= 0 && j.usos > 0 && tiempo < H.jinetes.cansancio.desde) {
      // Cansados ya no: lo que aflojan a los 45 segundos es todo lo que tienen.
      const lejos = Math.hypot(yo.x - j.x, (yo.y - j.y) / PROFUNDIDAD);
      if (lejos > I.desde) {
        j.empuje = I.dura;
        j.recarga = I.recarga;
        j.usos -= 1;
      }
    }
    j.empujeVel = j.empuje > 0 ? j.vel * I.empuje : 0;
    if (j.empuje > 0 && rng.chance(0.3)) {
      polvo.sembrar({ x: j.x, y: j.y, suelo: 0, rumbo: 0, fuerza: 0.6,
        pisadas: [[GOLPES.traseraAlla, -8]], cuantas: 1 });
    }
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

  /**
   * EL PULSO DE UN JINETE A ESTA DISTANCIA. De cerca es `dispersion`; pasadas
   * `dispersionDesde` unidades se le abre el abanico, y por eso pueden tirar a
   * cualquier distancia sin que eso sea una sentencia desde fuera de pantalla.
   */
  function dispersionDelJinete(j) {
    const J = H.jinetes;
    const d = Math.hypot(yo.x - j.x, (yo.y - j.y) / PROFUNDIDAD);
    const extra = (Math.max(0, d - J.dispersionDesde) / 100) * J.dispersionPorCien;
    return Math.min(J.dispersionTope, J.dispersion + extra);
  }

  function tirar(j) {
    const J = H.jinetes;
    // Parejo para todos, como en el asalto: a ellos también se les va el pulso.
    const a = j.aimDir
      + rng.spreadDeTiro(dispersionDelJinete(j), CONFIG.mira.fallaChance, CONFIG.mira.fallaMultiplicador);
    balas.push({
      x: j.x + 6, y: j.y - 14,
      vx: Math.cos(a) * J.velocidadBala,
      vy: Math.sin(a) * J.velocidadBala * PROFUNDIDAD,
      vida: J.duracionBala, mia: false,
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
            const cerca = Math.hypot(j.x - yo.x, (j.y - yo.y) / PROFUNDIDAD) < H.jinetes.remate;
            pegarle(j, b.danio, cerca);
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

  function pegarle(j, danio, deCerca) {
    // De cerca no hay segundo tiro: lo voltea igual (ver `jinetes.remate`).
    j.health -= deCerca ? Math.max(danio, j.health) : danio;
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

  /**
   * 🏆 LO QUE TE DA EL REFUGIO AL QUE LLEGASTE (ver `mundo.premios`). Son dos
   * monedas distintas, así que elegir no es medir cuál queda más cerca:
   *
   *  - LA QUEBRADA te devuelve una bolsa de las que soltaste: plata, ahora.
   *  - EL BOSQUE tapa a los jinetes que tiraste ahí: no los vio nadie, así que
   *    no te suben la recompensa.
   *
   * Devuelve lo que hay que contarle a la pantalla de resultados.
   */
  function cobrarElPremio() {
    const P = H.mundo.premios;
    const premio = { devueltas: 0, plata: 0, tapados: 0 };
    if (!refugioTomado || !fin || fin.como !== 'llegaste') return premio;

    if (refugioTomado.tipo === 'quebrada' && P.quebradaBolsas > 0) {
      premio.devueltas = Math.min(P.quebradaBolsas, soltadas);
      // Lo que vale una bolsa es lo mismo que costó soltarla (ver soltarBolsa).
      const bolsa = Math.max(1, Math.round(dineroInicial * H.bolsaFraccion));
      premio.plata = Math.min(perdido, premio.devueltas * bolsa);
    }
    if (refugioTomado.tipo === 'bosque' && P.bosqueTapaJinetes) {
      premio.tapados = derribados;
    }
    return premio;
  }

  function terminar() {
    /**
     * El premio NO se descuenta de `perdido`: la pantalla de resultados cuenta
     * lo que soltaste por un lado y lo que rescataste por el otro, y así la
     * suma se lee sola (soltaste 3 = −$300, rescataste 1 = +$100). Lo único
     * que va neto es la plata con la que te vas.
     */
    const premio = cobrarElPremio();
    summary.money = Math.max(0, (summary.money || 0) - perdido + premio.plata);
    summary.huida = {
      jinetes: jinetes.length, derribados, tirados, bolsas: soltadas, perdido,
      // Cómo terminó: 'llegaste' (a un refugio), 'limpio' (no quedó ninguno) o
      // 'perdidos' (los dejaste atrás).
      fin: fin ? fin.como : 'perdidos',
      lugar: refugioTomado ? refugioTomado.nombre : null,
      tipo: refugioTomado ? refugioTomado.tipo : null,
      devueltas: premio.devueltas, plata: premio.plata,
    };
    // Un jinete derribado acá es un jinete derribado: cuenta como en el asalto.
    summary.kills = (summary.kills || 0) + derribados;
    /**
     * Los que tiraste adentro del bosque no le suman a la recompensa: nadie
     * vio dónde terminaron. Lo descuenta `bountyDelta` (state/gameState.js), y
     * sigue contando como muerte para todo lo demás.
     */
    summary.killsSinTestigos = premio.tapados;
    // Una prueba no suma plata, ni recompensa, ni asaltos: sólo muestra cómo te fue.
    if (prueba) {
      summary.prueba = `el ${caballo.name} y el ${arma.name}`;
      // La prueba no aplica nada, pero el premio del bosque se muestra igual.
      summary.bountyAhorrado = recompensaTapada(summary);
    }
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

  /** Cuántos obstáculos se guardan antes de tirar los de lejos. */
  const A_TOPE = 900;

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
    /**
     * LOS QUE QUEDARON LEJOS SE TIRAN, y la celda SE OLVIDA: si volvés, se
     * siembra de nuevo. Antes la celda quedaba marcada para siempre, así que
     * el campo que ya habías cruzado volvía pelado — y en el bosque de piedras,
     * que tiene diez veces más, eso era medio bosque desapareciendo detrás
     * tuyo. El tope está alto (900) para que un bosque entero entre sin que
     * haya que tirar nada mientras estás adentro.
     */
    if (obstaculos.length > A_TOPE) {
      const limite = alcance * 1.4;
      obstaculos = obstaculos.filter((ob) => Math.hypot(ob.x - yo.x, ob.y - yo.y) < limite);
      for (const clave of celdasSembradas) {
        const [sx, sy] = clave.split(',');
        const mx = Number(sx) * CELDA + CELDA / 2;
        const my = Number(sy) * CELDA + CELDA / 2;
        if (Math.hypot(mx - yo.x, my - yo.y) > limite) celdasSembradas.delete(clave);
      }
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
    /**
     * 🔺 LA CÁMARA SE CORRE DE A UN PUNTO DE PANTALLA, NO DE A UNA UNIDAD
     * *(Santi: "la cámara, por más de que el caballo se mueva en diagonal, se
     * sigue moviendo de forma recta, como una torre de ajedrez")*. Tenía
     * razón: redondear en UNIDADES la movía de a 3 puntos, y como al norte se
     * avanza el 62% de lo que se avanza al este, lo de arriba y abajo llegaba
     * al salto siguiente mucho después que lo de los costados. El resultado
     * era un escalón: derecho un rato, y de golpe un brinco.
     *
     * Redondear al PUNTO (un tercio de unidad con esta lupa) deja el paso tres
     * veces más fino —el mínimo que se puede— y sigue cayendo justo en la
     * grilla, así que no se borronea nada. El balanceo y el sacudón entran en
     * la misma cuenta: antes se sumaban con decimales y ensuciaban el dibujo.
     */
    const aPunto = (v) => Math.round(v * H.zoom) / H.zoom;
    const camX = aPunto(yo.x - vista.w / 2);
    const camY = aPunto(yo.y - vista.h / 2 - vaiven);
    r.ctx.translate(-camX, -camY);
    if (temblor > 0) {
      r.ctx.translate(aPunto(rng.range(-2.5, 2.5)), aPunto(rng.range(-2.5, 2.5)));
    }

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

    dibujarLaSoga(r);
    for (const b of balas) dibujarBala(r, b);

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

    if (j.lazo || j.revolea > 0 || j.soga > 0) dibujarSuLazo(r, j);
  }

  /**
   * 🪢 EL LAZO DE UN JINETE, en sus tres estados. El primero es el que más
   * importa: **enrollado en la montura se le ve**, y por eso sabés cuál de los
   * que vienen atrás te lo puede tirar antes de que pase nada.
   *
   * ⚠️ Se dibuja FUERA de `dibujarCaballo` a propósito: ahí adentro el lienzo
   * está espejado cuando el caballo va al oeste, y una soga espejada saldría
   * del lado equivocado.
   */
  function dibujarSuLazo(r, j) {
    const SOGA = '#d9c9a4';
    const lado = Math.cos(j.rumbo) < 0 ? -1 : 1;

    if (j.revolea > 0) {
      // Revoleándolo sobre la cabeza: es TU aviso, así que se mueve y se ve.
      const giro = tiempo * 15;
      const cx = j.x + Math.cos(giro) * 8;
      const cy = j.y - 31 + Math.sin(giro) * 4 * PROFUNDIDAD;
      r.line(j.x + 5 * lado, j.y - 20, cx, cy, SOGA);
      r.box(cx, cy, 4, 2, SOGA);
      return;
    }

    if (j.soga > 0) {
      // Ya salió: la soga viaja hacia vos.
      const t = 1 - j.soga / H.jinetes.lazo.vuelo;
      const x0 = j.x + 5 * lado, y0 = j.y - 20;
      r.line(x0, y0, x0 + (yo.x - x0) * t, y0 + (yo.y - 10 - y0) * t, SOGA);
      return;
    }

    // Enrollado en la montura, esperando su turno.
    r.box(j.x - 7 * lado, j.y - 11, 5, 3, SOGA);
    r.box(j.x - 7 * lado, j.y - 11, 3, 1, '#8f7c58');
  }

  /**
   * LA SOGA TENSA, de su mano a tu caballo. Va con panza y se mueve: una línea
   * recta se lee como un palo, no como una soga.
   */
  function dibujarLaSoga(r) {
    if (!yo.lazo) return;
    const j = yo.lazo.j;
    const lado = Math.cos(j.rumbo) < 0 ? -1 : 1;
    const x0 = j.x + 5 * lado, y0 = j.y - 20;
    const x1 = yo.x, y1 = yo.y - 10;
    const panza = 4 + Math.sin(tiempo * 11) * 2;
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + panza;
    r.line(x0, y0, mx, my, '#d9c9a4');
    r.line(mx, my, x1, y1, '#d9c9a4');
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
    } else if (yo.forcejeo) {
      /**
       * EL CARTEL DEL FORCEJEO: lo único que importa mientras dura es que
       * tenés que machacar [E], así que ocupa el lugar del contador de
       * jinetes y muestra cuánto te falta.
       */
      const F = H.jugador.forcejeo;
      r.text(T.huida.forcejeo, centro, 8, colors.enemyAlert);
      const hechos = '●'.repeat(yo.forcejeo.golpes) + '○'.repeat(Math.max(0, F.golpes - yo.forcejeo.golpes));
      r.text(`[E] ${hechos}`, centro, 20, colors.bagLoot);
    } else if (yo.lazo) {
      // Lo mismo que el forcejeo: enlazado, lo único que importa es [E].
      const L = H.jinetes.lazo;
      r.text(T.huida.enlazado, centro, 8, colors.enemyAlert);
      const hechos = '●'.repeat(yo.lazo.golpes) + '○'.repeat(Math.max(0, L.golpes - yo.lazo.golpes));
      r.text(`[E] ${hechos}`, centro, 20, colors.bagLoot);
    } else {
      r.text(T.huida.teSiguen(siguiendo().length), centro, 8, colors.enemyAlert);
      dibujarBrujula(r);
    }

    r.text(`$${Math.max(0, dineroInicial - perdido)}`, 6, 9, colors.bagLoot, 'left');
    if (soltadas > 0) r.text(T.huida.bolsas(soltadas), 6, 19, colors.enemyAlert, 'left');

    const municion = yo.recargando > 0 ? T.huida.recargando
      : `${arma.short} ${'●'.repeat(yo.balas)}${'○'.repeat(Math.max(0, arma.magazine - yo.balas))}`;
    r.text(municion, vista.w - 6, 9, yo.recargando > 0 ? colors.enemyAlert : colors.textDim, 'right');

    dibujarAguante(r);

    if (tiempo < 6 && !fin) {
      r.text(T.huida.teclas[0], centro, vista.h - 17, colors.textDim);
      r.text(T.huida.teclas[1], centro, vista.h - 7, colors.textDim);
    }
  }

  /**
   * EL AGUANTE DEL CABALLO, para el envión. Una barra chica abajo del dinero:
   * lo único que hay que poder leer de un vistazo es si te queda o no.
   *
   * ⚠️ Dibujo simple a propósito (lista "Por vestir").
   */
  function dibujarAguante(r) {
    if (fin) return;
    const ancho = 46, alto = 3, x = 6, y = soltadas > 0 ? 25 : 15;
    const lleno = Math.max(0, Math.min(1, yo.aguante / caballo.aguanteMax));
    r.rect(x, y, ancho, alto, colors.textDim);
    r.rect(x, y, Math.round(ancho * lleno), alto,
      yo.reventado ? colors.enemyAlert
        : yo.extra > 0 ? colors.bagLoot
        : lleno < 0.25 ? colors.enemyAlert : colors.doorGlow);

    /**
     * Y ABAJO, LA ESPERA DEL ENVIÓN: se llena sola y desaparece cuando está
     * listo. Sin esto, la única forma de saber si tenías envión era apretar.
     */
    const espera = esperaDelImpulso(caballo);
    if (yo.esperaImpulso > 0) {
      const listo = 1 - yo.esperaImpulso / espera;
      r.rect(x, y + alto + 1, Math.round(ancho * listo), 1, colors.textDim);
    } else if (!yo.reventado) {
      r.rect(x, y + alto + 1, ancho, 1, colors.doorGlow);
    }
  }

  /** Un punto de pantalla, en unidades del mundo, con la lupa de esta escena. */
  const PUNTO = 1 / H.zoom;

  /**
   * LA BALA: UN TRAZO, NO UN LADRILLO *(Santi: "vestir el pixel de esa bala de
   * manera distinta, hoy es muy juego arcade")*.
   *
   * Era un rectángulo de 3×2 unidades — con la lupa de 3, nueve por seis
   * puntos de pantalla: una ficha volando. Una bala no es un objeto que se
   * mira, es un destello que cruza, así que ahora se dibuja el TRAMO que
   * recorrería en un pedacito de segundo, con la punta encendida.
   *
   * La de ellos es más larga y más apagada: viene de atrás y lo que importa es
   * verla venir. La tuya es corta y clara, porque sale de tu propia mano y ya
   * la anuncia el fogonazo.
   */
  function dibujarBala(r, b) {
    const tramo = b.mia ? 0.03 : 0.045;
    const cx = b.x - b.vx * tramo;
    const cy = b.y - b.vy * tramo;
    const color = b.mia ? colors.bulletP : colors.bulletE;
    r.line(cx, cy, b.x, b.y, color, b.mia ? 0.6 : 0.8, PUNTO);
    // El último tercio, encendido: es lo que le da la punta caliente.
    r.line(cx + (b.x - cx) * 0.66, cy + (b.y - cy) * 0.66, b.x, b.y, '#fff2c8', 0.55, PUNTO);
    r.rect(b.x - PUNTO, b.y - PUNTO, PUNTO * 2, PUNTO * 2, '#fff6d8');
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
      /**
       * Abajo se sube: ahí están las dos líneas de las teclas, y un refugio
       * al sur dejaba el número escrito encima del texto.
       */
      const y = Math.min(vista.h - 30, vista.h / 2 + Math.sin(a) * vista.h * 0.42);
      const color = dist < 500 ? colors.doorGlow : colors.textDim;
      r.rect(x - 2, y - 2, 5, 5, color);
      r.rect(x + Math.cos(a) * 5 - 1, y + Math.sin(a) * 5 - 1, 3, 3, color);
      /**
       * La inicial (cuál es cuál importa, porque cada uno tiene su terreno) y
       * lo que falta. Abajo de todo los dos se escriben ARRIBA de la marca:
       * ahí está el cartel de las teclas, y el número le caía encima.
       */
      const abajo = y > vista.h - 42;
      const letra = T.huida.brujula[d.tipo] || '?';
      const falta = `${Math.round(dist / 10)}`;
      r.text(letra, x, abajo ? y - 16 : y - 6, color);
      r.text(falta, x, abajo ? y - 6 : y + 10, color);
    }
  }

  return { enter, exit, update, render };
}
