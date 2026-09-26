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
 * ⚠️ GRÁFICOS SIMPLES: el panel y el fondo todavía son dibujo de prueba
 * (ver "Por vestir" en NOTAS-DISENO.md).
 */

import { CONFIG } from '../data/config.js';
import { HUIDA as H } from '../data/huida.js';
import { WEAPONS, DEFAULT_WEAPON } from '../data/weapons.js';
import { caballoActual, HORSES, esperaDelImpulso, APROXIMACION as A } from '../data/horse.js';
import { applyRaidResult, recompensaTapada, gameState, numero } from '../state/gameState.js';
import { T } from '../text/es.js';
import { GOLPES, dibujarAnimal, dibujarJinete, dibujarMontura } from '../entities/caballo.js';
import { dibujarTendido } from '../entities/figura.js';
import { sembrarDesierto } from '../world/desierto.js';
import { dibujarObstaculoDesierto } from '../world/obstaculosDesierto.js';
import { crearPolvo } from '../world/polvoDeCascos.js';
import {
  DESTINOS, refugiosDeLaRegion, ACHATA, dibujarRefugio, dibujarDeLejos,
  chocaConElRefugio, adentroDelRefugio, esPared, esBosque, trozosDelParedon,
  puntoDeEntrada, dibujarClaroDelBosque, PAREDON, PARED, BOSQUE,
} from '../world/destinos.js';
import { dibujarHorizonte } from '../world/horizonte.js';
import { escalarColor } from '../world/trenTresCuartos.js';

/**
 * EN TRES CUARTOS, IR AL NORTE RINDE MENOS EN PANTALLA QUE IR AL ESTE: la
 * profundidad se ve aplastada. Es el mismo achatado de los refugios y el del
 * campamento, así que una vuelta galopada se ve como una elipse y no como un
 * círculo.
 */
const PROFUNDIDAD = ACHATA;

/**
 * Lo que tarda un jinete en bajar el rifle después de tirar. No es un número de
 * balance —no cambia nada de la pelea—, es para que el fierro no vuelva al
 * muslo en el mismo cuadro del disparo.
 */
const BAJA_RIFLE = 0.35;

export function createHuidaScene(services) {
  const { renderer, input, rng, scenes, hud, audio } = services;
  const colors = CONFIG.colors;

  let summary, caballo, arma, prueba;
  let yo, jinetes, balas, bolsas, caidos, carteles, obstaculos, celdasSembradas;
  /** Los caballos que quedaron sin jinete y siguen galopando (ver `pegarle`). */
  let sueltos;
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
    if (prueba) window.HUIDA_BANCO = () => ({ yo, jinetes, obstaculos, refugios, tiempo, fin, perdido, soltadas, tirados, derribados, bolsas });

    sembrarRefugios();

    jinetes = [];
    const n = Math.max(1, params.jinetes || 1);
    for (let i = 0; i < n; i++) jinetes.push(crearJinete(i, n));

    balas = [];
    bolsas = [];
    caidos = [];
    sueltos = [];
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
      const rodeo = rng.range(-0.3, 0.3);
      const base = {
        tipo: id,
        nombre: DESTINOS[id].nombre,
        cartel: DESTINOS[id].cartel,
        x, y,
        radio: M.radio,
        mira: llegada + rodeo,
        abertura: grados(M.aberturaGrados),
        aviso: false,
      };

      /**
       * 🧱 LA QUEBRADA NO ES UN ANILLO: ES UN PAREDÓN *(Santi: "diría que sea
       * una pared de rocas infinita se podría decir, con un hueco estrecho")*.
       *
       * Se planta ATRAVESADA en tu camino —perpendicular a la línea que va de
       * donde arrancás hasta acá— con una inclinación de hasta 20 grados para
       * que no sean todas iguales. El hueco queda justo en `x, y`, o sea que
       * la brújula te apunta al hueco: lo difícil no es encontrarlo, es llegar
       * derecho con ellos encima.
       */
      /**
       * 🗿 EL BOSQUE ES UN MANCHÓN DE AGUJAS, no un anillo: no hay puerta que
       * encontrar, hay que meterse hasta el corazón trenzando entre las
       * piedras. Las agujas las siembra `sembrarObstaculos` como obstáculos
       * comunes (ver `BOSQUE`).
       */
      if (id === 'bosque') {
        return { ...base, forma: 'bosque', radio: BOSQUE.radio, corazon: BOSQUE.corazon };
      }
      if (id !== 'quebrada') return base;
      return {
        ...base,
        forma: 'pared',
        rumboPared: llegada + Math.PI / 2 + rng.range(-grados(20), grados(20)),
        largo: PAREDON.largo,
        hueco: PAREDON.hueco,
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
    return refugios.some((d) => {
      // En el bosque no se despeja nada salvo el claro del corazón: las agujas
      // TIENEN que nacer adentro, son el refugio.
      if (esBosque(d)) return Math.hypot(d.x - x, (d.y - y) / PROFUNDIDAD) < d.corazon;
      /**
       * Contra el paredón el despeje es una FRANJA, no un círculo: una piedra
       * plantada en la boca del hueco lo taparía, y una encima de la pared se
       * vería flotando adentro de la roca.
       */
      if (esPared(d)) {
        /**
         * 🐛 EN LA QUEBRADA EL DESPEJE ES TODO EL MACIZO, no la franja de la
         * cara. Con sólo la franja crecían cactus y arbustos **encima de la
         * roca**, que es exactamente donde no hay tierra.
         */
        const dx = x - d.x;
        const dy = (y - d.y) / PROFUNDIDAD;
        const u = dx * Math.cos(d.rumboPared) + dy * Math.sin(d.rumboPared);
        const v = -dx * Math.sin(d.rumboPared) + dy * Math.cos(d.rumboPared);
        const dentro = v > -PARED / 2 - despeje && v < PAREDON.garganta + 40;
        return dentro && Math.abs(u) < d.largo / 2 + despeje;
      }
      return Math.hypot(d.x - x, (d.y - y) / PROFUNDIDAD) < d.radio + despeje;
    });
  }

  /**
   * Cada jinete arranca detrás tuyo, abierto en abanico, y tiene su carril: a
   * qué ángulo de tu cola se planta y a qué distancia.
   */
  function crearJinete(i, n) {
    const J = H.jinetes;
    const lado = i % 2 === 0 ? -1 : 1;
    const escalon = Math.ceil(i / 2);
    /**
     * DOS OLAS (ver `HUIDA.jinetes.olas`): el pelotón arranca encima tuyo y el
     * resto, mucho más atrás, viene al galope tendido a sumarse.
     */
    const O = J.olas;
    const enElPeloton = i < O.peloton;
    const atras = enElPeloton
      ? J.distanciaInicial + i * J.separacionInicial
      : O.segundaDesde + (i - O.peloton) * O.segundaSeparacion;
    return {
      x: yo.x - Math.cos(yo.rumbo) * atras,
      y: yo.y - Math.sin(yo.rumbo) * atras * PROFUNDIDAD,
      rumbo: yo.rumbo,
      alive: true,
      perdido: false,
      health: H.jinetes.vida ?? 1,
      vel: J.velocidad + rng.range(-J.variacion, J.variacion),
      carril: n === 1 ? 0.25 : lado * (0.22 + escalon * 0.26),
      /**
       * Su lugar en la fila es el de siempre, esté donde esté ahora: el de la
       * segunda ola corre hasta acá y recién entonces se acomoda.
       */
      atras: J.distanciaInicial * 0.75 + i * J.separacionInicial,
      /** Viniendo a sumarse: corre más, no tira y no le toca ninguna táctica. */
      alcanzando: !enElPeloton,
      cooldown: J.cadencia * 0.6 + rng.range(0, J.cadenciaAzar),
      aimTimer: 0,
      aimDir: 0,
      /** Lo que le falta para bajar el rifle después de tirar (ver BAJA_RIFLE). */
      bajaRifle: 0,
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

    // Los caballos sin jinete: siguen de largo, aflojando, hasta perderse.
    for (const s of sueltos) {
      s.vida -= dt;
      s.vel = Math.max(40, s.vel * (1 - 0.22 * dt));
      s.x += Math.cos(s.rumbo) * s.vel * dt;
      s.y += Math.sin(s.rumbo) * s.vel * dt * PROFUNDIDAD;
      s.gallop += dt;
    }
    sueltos = sueltos.filter((s) => s.vida > 0);
    /**
     * 💰 LA BOLSA CAE, PICA UNA VEZ Y SUELTA MONEDAS. El rebote no es adorno:
     * antes la bolsa se clavaba en el piso de golpe y no se veía el momento en
     * que la perdías. Las monedas saltan en el primer golpe y quedan tiradas
     * alrededor, que de lejos es lo que dice "ahí cayó plata".
     */
    for (const b of bolsas) {
      b.vz += 260 * dt;
      b.z += b.vz * dt;
      if (b.z >= 0) {
        b.z = 0;
        if (b.vz > 40 && b.botes < 2) {
          b.botes += 1;
          b.vz = -b.vz * 0.35;
          if (b.botes === 1) {
            for (let k = 0; k < 4; k++) {
              b.monedas.push({
                dx: 0, dy: 0, z: 0, vx: rng.range(-26, 26),
                vy: rng.range(-13, 13) * PROFUNDIDAD, vz: rng.range(-52, -26),
              });
            }
          }
        } else b.vz = 0;
      }
      for (const m of b.monedas) {
        m.vz += 260 * dt;
        m.dx += m.vx * dt;
        m.dy += m.vy * dt;
        m.z += m.vz * dt;
        if (m.z >= 0) { m.z = 0; m.vz = 0; m.vx *= 0.8; m.vy *= 0.8; }
      }
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

    // Si le pegaste al que te tiene enlazado, la soga se va con él.
    if (!f.j.alive) { cortarElLazo('tirador'); return; }
    if (f.j.perdido || fin) { cortarElLazo('nada'); return; }
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
      : como === 'tirador' ? T.huida.lazoTirador
      : como === 'choque' ? T.huida.lazoChoque
      : como === 'envion' ? T.huida.lazoEnvion : T.huida.lazoSolto;
    const bueno = como === 'cortado' || como === 'tirador';
    carteles.push({
      x: yo.x, y: yo.y - 34, texto,
      color: bueno ? colors.bagLoot : colors.textDim,
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
    /**
     * Con un tipo colgado del brazo no se tira: las dos manos están ocupadas.
     *
     * ⚠️ ENLAZADO SÍ SE TIRA *(Santi: "si tira el lazo hacia el caballo, el
     * jugador sí podría disparar")*, y tiene razón: la soga va al pescuezo del
     * animal, no a vos. Y eso le da vuelta la jugada — el que te enlaza queda
     * atado a vos, cerca y quieto: **enlazarte lo expone**.
     */
    if (yo.forcejeo) return;
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
      : siguiendoAhora.filter((j) => j.lazo && !j.alcanzando);
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
      if (j.alcanzando) continue;
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
      j.bajaRifle = Math.max(0, j.bajaRifle - dt);
      const d = Math.hypot(yo.x - j.x, (yo.y - j.y) / PROFUNDIDAD);

      /**
       * ¿YA SE SUMÓ? Mientras viene de atrás no dispara: el que corre a los
       * pedales para alcanzar al grupo no va apuntando. Se suma cuando llegó a
       * su lugar en la fila.
       */
      if (j.alcanzando && d <= j.atras + J.olas.seSumaA) j.alcanzando = false;

      if (j.cooldown <= 0 && !j.alcanzando && d < J.alcance && j.aimTimer <= 0) {
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
    // El que todavía viene de atrás corre más hasta alcanzar a los demás.
    if (j.alcanzando) return base * H.jinetes.olas.apuro;
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
      // `true`: para la ley la garganta de la quebrada es roca maciza.
      const empuje = chocaConElRefugio(d, j.x, j.y, true);
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
    // Se queda con el rifle encarado un momento más: si volviera a cruzarlo
    // sobre los muslos en el mismo cuadro del disparo, el tiro saldría de un
    // jinete que ya tiene el arma guardada.
    j.bajaRifle = BAJA_RIFLE;
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
    /**
     * 🐎 Y EL CABALLO SIGUE SOLO. Hasta ahora, cuando bajabas a uno, el cuerpo
     * quedaba en el suelo y **el animal se borraba del mundo**: desaparecía en
     * el mismo cuadro, como si el jinete y su caballo fueran una sola cosa.
     *
     * Ahora queda suelto: abre para un costado —el susto lo saca de la fila— y
     * se va aflojando hasta perderse. No choca con nada ni te hace nada; es lo
     * que pasó, nada más.
     */
    sueltos.push({
      x: j.x,
      y: j.y,
      rumbo: j.rumbo + rng.range(0.5, 1.1) * (rng.chance(0.5) ? 1 : -1),
      vel: j.vel != null ? j.vel : H.jinetes.velocidad,
      gallop: j.gallop,
      vida: 6,
    });
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
    bolsas.push({ x: yo.x - 6, y: yo.y + 4, z: -18, vz: -60, botes: 0, monedas: [] });
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
    summary.money = Math.max(0, numero(summary.money || 0, 'la plata con la que entraste a la huida')
      - numero(perdido, 'las bolsas que soltaste') + premio.plata);
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
        /**
         * 🗿 Y ADENTRO DEL MANCHÓN DEL BOSQUE, AGUJAS. Es el mismo sistema de
         * siempre con otra densidad y otro tipo: así chocarlas frena igual que
         * una piedra, los jinetes también se las comen y el dibujo se ordena
         * solo. El bosque ralo de afuera (hasta `bosqueAlrededor`) se queda
         * como antesala.
         */
        const enElManchon = refugios.some((d) => esBosque(d)
          && Math.hypot(d.x - (cx * CELDA + CELDA / 2), (d.y - (cy * CELDA + CELDA / 2)) / PROFUNDIDAD) < BOSQUE.radio + CELDA);

        let cuantos = rng.int(0, 2);
        if (enElManchon) cuantos = BOSQUE.porCelda;
        else if (terreno && terreno.tipo === 'bosque') cuantos = rng.int(C.bosqueMin, C.bosqueMax);
        else if (terreno && terreno.tipo === 'rio') cuantos = 0;

        for (let i = 0; i < cuantos; i++) {
          const x = cx * CELDA + rng.range(0, CELDA);
          const y = cy * CELDA + rng.range(0, CELDA);
          if (pegadoAUnRefugio(x, y)) continue;
          const aguja = refugios.some((d) => esBosque(d)
            && Math.hypot(d.x - x, (d.y - y) / PROFUNDIDAD) < BOSQUE.radio);
          if (!aguja && enElManchon && rng.chance(0.55)) continue;
          const roca = terreno && terreno.tipo === 'bosque' && rng.chance(C.bosqueRocas);
          obstaculos.push({
            x,
            y,
            tipo: aguja ? 'aguja' : roca ? 'roca' : tipos[rng.int(0, tipos.length - 1)],
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

    /**
     * 🏔️ EL HORIZONTE, arriba de todo. Es **el mismo cielo del galope**
     * (`world/horizonte.js`), no uno parecido: las dos escenas pasan en el
     * mismo desierto y dos cordilleras distintas se notarían. Hasta ahora la
     * huida se jugaba en un vacío — suelo y nada más.
     *
     * ⚠️ Y ACÁ HAY UNA DIFERENCIA CON EL GALOPE que obliga a dibujarlo primero.
     * Allá el campo termina abajo del horizonte, así que el cielo puede taparlo
     * todo. Acá la cámara te sigue en campo abierto: **si corrés al sur, los
     * que te persiguen quedan arriba de la pantalla**, justo donde va la
     * franja. Si el cielo se dibujara encima, se los tragaría.
     *
     * Por eso va ANTES que el mundo y el mundo le pasa por arriba. Cuesta que
     * un jinete lejano se vea un instante contra la montaña; lo otro era que
     * desapareciera, y eso sí no se puede.
     */
    const hy = H.mundo.horizonte;
    dibujarHorizonte(r, {
      hy,
      avance: yo.x,
      dia,
      C: colors.cielo,
      tinte: (hex) => (dia ? hex : escalarColor(hex, 0.32)),
      altoMax: hy,
      cielo: dia ? [colors.puebloCielo, colors.puebloCieloHorizonte]
        : [colors.cielo.nocheArriba, colors.cielo.nocheHorizonte],
    });

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
      // Nada de pasto arriba del horizonte: el suelo se dibuja ENCIMA del
      // cielo (ver el comentario de la franja), así que ahí quedaría flotando
      // una mata en el aire. Los jinetes sí pasan: ésos tienen que verse.
      saltar: (wx, wy) => wy < camY + hy,
    });

    // Lo que quedó tirado en el campo: los caídos y las bolsas.
    for (const c of caidos) dibujarTendido(r, c.x, c.y + 4, { tipo: 'jineteLey', cinta: '#4a78b8' });
    for (const b of bolsas) dibujarBolsa(r, b);

    polvo.dibujar(r, 0, !dia);

    /**
     * TODO SE DIBUJA POR DÓNDE PISA: lo que está más abajo tapa a lo que está
     * más arriba. Entran los refugios, los obstáculos, los jinetes y vos.
     */
    const cosas = [];
    for (const d of refugios) {
      const lejos = Math.hypot(d.x - yo.x, (d.y - yo.y) / PROFUNDIDAD);
      if (lejos > vista.w * 0.9 && !esPared(d)) {
        // De lejos, su silueta: es lo que te dice para dónde está.
        cosas.push({ y: d.y, draw: () => dibujarDeLejos(r, d, dia, Math.max(0.3, 1 - lejos / 4600)) });
      } else if (esPared(d)) {
        /**
         * ⚠️ EL PAREDÓN ENTRA TROZO POR TROZO. Cruza la pantalla entera, así
         * que no se puede ordenar como UNA cosa: el jinete que está al sur
         * tiene que taparlo y el que está al norte tiene que quedar detrás.
         * De lejos, en cambio, va su silueta con el corte a la vista.
         */
        if (lejos > vista.w * 1.3) {
          cosas.push({ y: d.y, draw: () => dibujarDeLejos(r, d, dia, Math.max(0.3, 1 - lejos / 4600)) });
        } else {
          const cerca = { x: yo.x, y: yo.y, w: vista.w, h: vista.h };
          for (const t of trozosDelParedon(d, dia, cerca)) cosas.push({ y: t.y, draw: () => t.draw(r) });
        }
      } else if (esBosque(d)) {
        // Sólo el claro del corazón: las agujas son obstáculos y ya entran
        // en esta misma lista, cada una por dónde pisa.
        cosas.push({ y: d.y - d.corazon, draw: () => dibujarClaroDelBosque(r, d, dia) });
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
    for (const s of sueltos) cosas.push({ y: s.y, draw: () => dibujarSuelto(r, s, dia) });
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

  /**
   * 🐎 UN CABALLO SIN JINETE, **con la silla puesta**: al jinete lo bajaron de
   * un tiro, así que el recado sigue ahí. Por eso la montura se dibuja aparte
   * (`dibujarMontura`, en caballo.js) y no adentro de la persona — si no, el
   * caballo suelto salía pelado. Se va borrando sobre el final.
   */
  function dibujarSuelto(r, s, dia) {
    const T0 = 0.56;
    const zancada = { t: ((s.gallop % T0) + T0) % T0, T: T0 };
    const trote = Math.round(Math.cos((zancada.t / T0 - 0.15) * Math.PI * 2) * 1.2);
    const pose = Math.max(-4, Math.min(4, Math.round(Math.sin(s.rumbo) * 4)));

    r.ctx.save();
    r.ctx.globalAlpha = Math.max(0, Math.min(1, s.vida / 1.5));
    r.ctx.globalAlpha *= 0.25;
    r.box(s.x, s.y + 7, 11, 2, '#000');
    r.ctx.globalAlpha = Math.max(0, Math.min(1, s.vida / 1.5));
    dibujarCaballo(s, r, () => {
      const montura = dibujarAnimal(r, s.x, s.y, zancada, trote, 1, pose, null, !dia);
      dibujarMontura(r, montura.asiento.x, montura.asiento.y, pose);
      montura.adelante();
    });
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

    /**
     * 🎯 EL AVISO DE QUE VA A TIRAR ES EL CUERPO, EN DOS TIEMPOS *(pedido de
     * Santi: "algo más visual, como que el jinete agacha un poco la cabeza
     * antes de disparar, simulando que está apuntando")*.
     *
     * Primera mitad del aviso: **levanta el revólver**. Segunda mitad: además
     * **baja la cabeza sobre el caño**. El agache es el "ya va": ése es el
     * momento del envión. Lo dibuja `dibujarJinete` con `apunta` (ver
     * caballo.js); acá sólo se decide en qué tiempo está.
     */
    const apuntando = j.aimTimer <= 0 ? 0
      : j.aimTimer > H.jinetes.apuntar * 0.5 ? 1 : 2;

    dibujarCaballo(j, r, () => {
      const montura = dibujarAnimal(r, j.x, j.y, zancada, trote, 1, pose, null, !dia);
      const rebote = Math.cos((zancada.t / T0 - 0.25) * Math.PI * 2) * 0.6;
      dibujarJinete(r, montura.asiento.x, montura.asiento.y + rebote, pose, 2, {
        detalles: 'ley',
        destello: j.hitFlash > 0,
        estado: j.aimTimer > 0 ? 'alerta' : 'calma',
        apunta: apuntando,
        arma: apuntando >= 1 || j.bajaRifle > 0 ? 'rifleListo' : 'rifle',
      }, montura);
      montura.adelante();
    });

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
      /**
       * 🪢 EL REVOLEO *(pedido de Santi)*: antes era un rectangulito dando
       * vueltas. Ahora es una **argolla de verdad** — un aro hueco que se ve
       * ancho cuando pasa por delante y de canto cuando pasa por los costados,
       * que es como se ve un lazo revoleado. Y **se agranda sobre el final**:
       * eso solo ya te avisa que está por salir, sin mirar ningún número.
       */
      const giro = tiempo * 15;
      const listo = Math.max(0, Math.min(1, 1 - j.revolea / H.jinetes.lazo.revoleo));
      const radio = 7 + listo * 3;
      const cx = j.x + Math.cos(giro) * radio;
      const cy = j.y - 32 + Math.sin(giro) * radio * 0.5 * PROFUNDIDAD;
      const aroW = 3 + Math.abs(Math.sin(giro)) * (2.5 + listo * 1.5);
      /**
       * La soga llega al BORDE del aro, no a su centro: si va al centro la
       * cruza y sale del otro lado, y el conjunto deja de parecer un lazo para
       * parecer una llave.
       */
      const hx = j.x + 5 * lado, hy = j.y - 20;
      const ux = cx - hx, uy = cy - hy, L = Math.hypot(ux, uy) || 1;
      const corte = Math.min(L - 1, aroW);
      r.line(hx, hy, cx - (ux / L) * corte, cy - (uy / L) * corte, SOGA);
      dibujarAro(r, cx, cy, aroW, 2.2, SOGA);
      return;
    }

    if (j.soga > 0) {
      // Ya salió: la soga viaja hacia vos.
      const t = 1 - j.soga / H.jinetes.lazo.vuelo;
      const x0 = j.x + 5 * lado, y0 = j.y - 20;
      r.line(x0, y0, x0 + (yo.x - x0) * t, y0 + (yo.y - 10 - y0) * t, SOGA);
      return;
    }

    /**
     * Enrollado en la montura, esperando su turno: **tres vueltas de soga
     * colgadas del recado**, no un ladrillo. Esto es lo que te deja mirar a los
     * que vienen atrás y saber cuál te puede enlazar antes de que pase nada, así
     * que tiene que leerse de lejos.
     */
    const ex = j.x - 6 * lado, ey = j.y - 9;
    dibujarAro(r, ex, ey, 3.2, 1.9, '#a89268');
    r.box(ex + 3.2 * lado, ey + 2.2, 0.5, 2, '#8f7c58');
  }

  /** Un aro de soga: ocho tramos en óvalo. Hueco, que es lo que lo hace un aro. */
  function dibujarAro(r, cx, cy, rw, rh, color) {
    const N = 8;
    let px = cx + rw, py = cy;
    for (let i = 1; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const x = cx + Math.cos(a) * rw, y = cy + Math.sin(a) * rh;
      r.line(px, py, x, y, color);
      px = x; py = y;
    }
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

    /**
     * 🎯 EL BRAZO APUNTA A DONDE MIRÁS, aunque sea para atrás. Hasta ahora,
     * tirando hacia atrás **el jinete no se daba vuelta ni un poco**: lo único
     * que pasaba era que la mira crecía, así que el disparo no se veía salir de
     * ningún lado.
     *
     * ⚠️ GIRA EL BRAZO Y NO EL CUERPO, a propósito. Girar el torso entero es
     * justo lo que Santi marcó hace varias vueltas —*"hay veces que el caballo
     * no cambia de dirección pero el personaje sí, entonces se ve raro"*— y por
     * eso la vista del jinete la manda el caballo. El brazo solo alcanza para
     * que se entienda, sin traer de vuelta lo que molestaba.
     *
     * El ángulo va ACHATADO como la vista: si no, tirar al norte se dibujaría
     * mucho más vertical de lo que se ve.
     */
    const apuntando = input.mouse.down || yo.fireTimer > 0 || yo.fogonazo > 0;
    const a = haciaDondeApunto();
    const armaDir = Math.atan2(Math.sin(a) * PROFUNDIDAD, Math.cos(a));

    dibujarCaballo(yo, r, () => {
      const montura = dibujarAnimal(r, yo.x, yo.y, zancada, trote, 1, yo.pose, caballo.id, !dia);
      dibujarJinete(r, montura.asiento.x, montura.asiento.y + rebote, yo.pose, 2, {
        arma: apuntando || undefined,
        armaDir: apuntando ? armaDir : undefined,
      }, montura);
      montura.adelante();
    });

    if (yo.fogonazo > 0) {
      const [ox, oy] = boca();
      const a = haciaDondeApunto();
      r.rect(ox + Math.cos(a) * 6 - 1.5, oy + Math.sin(a) * 6 - 1.5, 3, 3, colors.bulletP);
    }
  }

  /**
   * 💰 UNA BOLSA TIRADA EN EL CAMPO. Es un saco de tela: panza ancha abajo,
   * cuello atado con su piolín, la luz de un lado y la sombra del otro. Antes
   * eran dos rectángulos con un "$" escrito encima — una letra, no una cosa.
   *
   * La sombra va en el **piso** (`b.y`) y la bolsa en el **aire** (`b.y + b.z`):
   * eso es lo que hace que se vea caer en vez de aparecer.
   */
  function dibujarBolsa(r, b) {
    const x = b.x, suelo = b.y, y = b.y + b.z;

    r.ctx.save();
    r.ctx.globalAlpha = 0.3;
    r.ctx.fillStyle = '#000';
    r.ctx.beginPath();
    r.ctx.ellipse(Math.round(x), Math.round(suelo), 6, 2, 0, 0, Math.PI * 2);
    r.ctx.fill();
    r.ctx.restore();

    for (const m of b.monedas) {
      const mx = x + m.dx, my = suelo + m.dy + m.z;
      r.rect(mx - 1, my - 1, 2, 2, colors.bagLoot);
      r.rect(mx - 1, my - 1, 1, 1, '#fff2c9');
    }

    r.rect(x - 4, y - 5, 9, 4, '#8a6a3a');   // la panza
    r.rect(x - 3, y - 7, 7, 2, '#7a5c31');   // el hombro, más angosto
    r.rect(x - 3, y - 1, 7, 1, '#5d4526');   // apoyada en el piso
    r.rect(x - 4, y - 5, 2, 4, '#a07f49');   // la luz de un lado
    r.rect(x - 2, y - 9, 5, 2, '#6a4f2a');   // el cuello
    r.rect(x - 2, y - 8, 5, 1, '#c2ae86');   // el piolín que lo ata
    r.rect(x + 3, y - 9, 2, 1, '#c2ae86');   // y la punta suelta
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

    /**
     * 🧾 DOS FRANJAS QUE APOYAN EL TEXTO. El panel era texto suelto sobre el
     * desierto: sobre una mancha clara —la arena de día, una bolsa, un caballo
     * bayo— el dinero y las balas se perdían justo cuando hacían falta.
     *
     * Van oscuras y transparentes, no un marco dibujado: en una persecución lo
     * último que querés es que la pantalla se achique. Lo que hacen es separar
     * lo que leés de lo que jugás, nada más.
     */
    const franja = (y, alto, alpha) => {
      r.ctx.save();
      r.ctx.globalAlpha = alpha;
      r.rect(0, y, vista.w, alto, '#000');
      r.ctx.restore();
    };
    franja(0, 26, 0.34);
    r.ctx.save();
    r.ctx.globalAlpha = 0.18;
    r.rect(0, 26, vista.w, 1, '#c9a227');
    r.ctx.restore();

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
      // La de abajo sólo mientras están las teclas: después no hay qué apoyar.
      franja(vista.h - 24, 24, 0.34 * Math.min(1, 6 - tiempo));
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
   * Cada refugio lleva su DIBUJITO —una grieta en el paredón, tres agujas—
   * en vez de una letra: en una persecución no tenés tiempo de leer, y son las
   * mismas siluetas que después ves en el horizonte.
   */
  function dibujarBrujula(r) {
    const B = H.mundo.brujula;
    for (const d of refugios) {
      /**
       * No apunta al refugio, apunta **a dónde hay que ir para entrar**: en la
       * quebrada eso es la boca desde afuera y el fondo de la garganta una vez
       * adentro (ver `puntoDeEntrada`).
       */
      const meta = puntoDeEntrada(d, yo.x, yo.y);
      const dx = meta.x - yo.x;
      const dy = (meta.y - yo.y) / PROFUNDIDAD;
      const dist = Math.hypot(dx, dy);

      /**
       * 🐛 EL CARTEL SE APAGA CUANDO YA VES EL REFUGIO. Antes se quedaba ahí
       * aunque tuvieras el paredón entero en pantalla, tapando justo lo que
       * estabas mirando. Ahora se desvanece de `seApagaA` a la mitad de eso.
       *
       * ⚠️ Salvo adentro de la garganta de la quebrada, y ahí es cuando MÁS
       * hace falta: estás entre dos paredes, no ves el fondo y la brújula es
       * lo único que te dice para qué lado sigue. Se reconoce porque
       * `puntoDeEntrada` deja de devolver la boca.
       */
      const enLaGarganta = esPared(d) && (meta.x !== d.x || meta.y !== d.y);
      const lejos = B.seApagaA;
      const alpha = enLaGarganta ? 1
        : Math.max(0, Math.min(1, (dist - lejos * 0.5) / (lejos * 0.5)));
      if (alpha <= 0.02) continue;

      const a = Math.atan2(dy, dx);
      /**
       * 🐛 EL CARTEL ENTERO TIENE QUE ENTRAR EN LA PANTALLA, flecha incluida.
       * Antes sólo se frenaba por abajo y por el alto del cartelito: con un
       * refugio al sur, la flecha (que va 14 px más afuera que el dibujo) se
       * salía por el borde y el cartel quedaba cortado por la mitad.
       *
       * Abajo se sube más que en los otros lados porque ahí están las dos
       * líneas de las teclas.
       */
      const MARGEN = 18;
      const dentro = (v, min, max) => Math.max(min, Math.min(max, v));
      const x = dentro(vista.w / 2 + Math.cos(a) * vista.w * 0.44, MARGEN, vista.w - MARGEN);
      const y = dentro(vista.h / 2 + Math.sin(a) * vista.h * 0.42, MARGEN, vista.h - 50);
      const color = dist < B.cerca ? colors.doorGlow : colors.textDim;

      r.ctx.save();
      r.ctx.globalAlpha = alpha;
      dibujarSenal(r, d, x, y, a, color);
      // Lo que falta, en decenas. Abajo de todo va ARRIBA de la marca: ahí
      // está el cartel de las teclas y el número le caía encima.
      const abajo = y > vista.h - 42;
      r.text(`${Math.round(dist / 10)}`, x, abajo ? y - 12 : y + 10, color);
      r.ctx.restore();
    }
  }

  /**
   * EL CARTELITO DE UN REFUGIO: su silueta y la flecha que apunta.
   *
   * Las siluetas son las mismas que se ven de lejos en el campo, en chiquito:
   * la quebrada es dos bloques de roca con el hueco en el medio y el bosque
   * son tres agujas de distinto alto. Con eso se sabe cuál es sin leer nada.
   */
  function dibujarSenal(r, d, x, y, a, color) {
    if (d.tipo === 'quebrada') {
      r.rect(x - 6, y - 4, 4, 8, color);
      r.rect(x + 2, y - 4, 4, 8, color);
      // El canto iluminado de arriba, que es lo que lo lee como roca.
      r.rect(x - 6, y - 4, 4, 1, colors.textDim);
      r.rect(x + 2, y - 4, 4, 1, colors.textDim);
    } else if (d.tipo === 'bosque') {
      r.rect(x - 5, y - 3, 2, 7, color);
      r.rect(x - 1, y - 5, 2, 9, color);
      r.rect(x + 3, y - 2, 2, 6, color);
    } else {
      // Cualquier refugio que todavía no tenga dibujo: su inicial.
      r.text(T.huida.brujula[d.tipo] || '?', x, y + 3, color);
    }

    /**
     * Y LA FLECHA, por fuera de la silueta.
     *
     * 🐛 Son cuatro rayas PERPENDICULARES al rumbo, cada una más corta que la
     * anterior: eso dibuja una punta. La primera versión apilaba cuadraditos
     * de 4, 3 y 2 a un píxel de distancia y, como se pisaban entre sí, salía
     * un bloque cuadrado que no apuntaba a ningún lado.
     */
    const nx = -Math.sin(a);
    const ny = Math.cos(a);
    for (let k = 0; k < 4; k++) {
      const d = 9 + k * 1.6;
      const medio = 3 - k * 0.8;
      const cx = x + Math.cos(a) * d;
      const cy = y + Math.sin(a) * d;
      r.line(cx - nx * medio, cy - ny * medio, cx + nx * medio, cy + ny * medio, color);
    }
  }

  return { enter, exit, update, render };
}
