/**
 * EL MAPA DE LA REGIÓN — elegir qué tren tomar.
 *
 * Ver `data/region.js` para el contenido y el razonamiento de por qué es un
 * mapa de la época y no una pantalla de selección. Acá va sólo cómo se dibuja
 * y cómo se lee con el mouse.
 *
 * ES LA PRIMERA PANTALLA DEL JUEGO QUE SE MANEJA CON EL MOUSE, y tiene
 * sentido que sea ésta: en todo el resto sos un tipo que camina, y acá sos un
 * tipo mirando un papel. El gesto de recorrer una vía con el dedo es
 * exactamente lo que hace el cursor.
 *
 * TRES COSAS QUE LO SOSTIENEN:
 *
 * 1. **Las vías llevan el travesaño clásico** (línea con rayitas cruzadas).
 *    Es el símbolo de ferrocarril de cualquier mapa de 1880: se reconoce sin
 *    explicación, y separa una vía de un río o un camino de un vistazo.
 *
 * 2. **Los trenes se mueven de verdad, en circuito.** No van y vuelven marcha
 *    atrás como un auto: dan la vuelta. Y no son un adorno — cada uno ES un
 *    tren concreto, con su tipo y su escolta, que va cambiando mientras
 *    recorre (ver `avanzarRuta` más abajo). El cartucho lo LEE; no lo inventa.
 *
 * 3. **El cartucho de abajo es el único texto.** Todo lo demás son símbolos.
 *    Un mapa lleno de etiquetas explicándose es un menú con dibujitos.
 *
 * EL MAPA SIGUE CORRIENDO AUNQUE NO LO MIRES. El estado de los trenes vive en
 * el closure de la escena, no en `enter()`, y al abrir el mapa se adelanta
 * todo lo que pasó desde la última vez (`ponerseAlDia`). Dormir, comprar un
 * caballo o hacer un asalto entero mueve los trenes de verdad — si no, el
 * mapa sería un cuadro que se congela cuando le das la espalda.
 */

import { CONFIG } from '../data/config.js';
import { REGION } from '../data/region.js';
import { sortearTipoTren, sortearDificultad } from '../data/train.js';
import {
  CLIMA, CLIMA_POR_DEFECTO, sortearClima, sortearEstadoTren, sortearComportamiento,
  variantesPermitidas, sortearCivilEncubierto,
} from '../data/modifiers.js';
import { sortearPaquete, CHANCE_CAJA_OCULTA } from '../data/paquetes.js';
import { WAGONS } from '../data/wagons.js';
import { sortearComposicion } from '../world/train.js';
import { T } from '../text/es.js';
import { gameState } from '../state/gameState.js';

/**
 * Cuánto tiempo real, como mucho, se simula de una sola vez al volver al mapa.
 * Si estuviste una hora en el pueblo no hace falta simular la hora entera:
 * cuatro minutos ya alcanzan para que todos los trenes hayan cambiado varias
 * veces, y evita un bucle largo al abrir la pantalla.
 */
const MAXIMO_AL_DIA = 240;
const PASO_AL_DIA = 0.25;

export function createMapScene(services) {
  const { input, scenes, hud, audio, rng } = services;
  const colors = CONFIG.colors;

  /**
   * Todo esto vive ACÁ y no en `enter()` a propósito: es lo que hace que el
   * mapa siga corriendo entre visita y visita.
   */
  let rutas = null;
  let manchas = null;
  let scroll = 0;
  let encima = null;
  let ultimoReloj = 0;

  const nombreDe = (id) => {
    const lugar = REGION.lugares.find((l) => l.id === id);
    return lugar ? lugar.nombre : '';
  };

  // -------------------------------------------------------------- preparar

  /**
   * Se precalcula el largo de cada tramo una sola vez. Sirve para tres cosas:
   * mover el tren a velocidad pareja (si no, aceleraría en los tramos cortos y
   * frenaría en los largos), encontrar el punto exacto de la vía bajo el
   * cursor, y saber en qué fracción del recorrido cae cada parada.
   */
  function prepararRutas() {
    rutas = REGION.rutas.map((r) => {
      const largos = [];
      let total = 0;
      for (let i = 0; i < r.puntos.length - 1; i++) {
        const l = Math.hypot(
          r.puntos[i + 1][0] - r.puntos[i][0],
          r.puntos[i + 1][1] - r.puntos[i][1]
        );
        largos.push(l);
        total += l;
      }

      /**
       * Las paradas se escriben en `data/region.js` como el ÍNDICE del punto,
       * no como una fracción: así, mover una coordenada del mapa no obliga a
       * recalcular ningún número a mano. Acá se convierte a fracción una vez.
       */
      const paradas = (r.paradas || []).map((p) => {
        let hasta = 0;
        for (let i = 0; i < p.i; i++) hasta += largos[i];
        return { lugar: p.lugar, t: total === 0 ? 0 : hasta / total };
      });

      const ruta = {
        ...r, largos, total, paradas,
        tren: null,
        espera: 0,
      };

      // Los circuitos arrancan con su tren en cualquier punto del recorrido:
      // que todos empiecen en su terminal se vería a coreografía.
      if (ruta.circular) {
        arrancarTren(ruta, rng.range(0, 1));
      } else if (ruta.entraDesdeAfuera) {
        // Y las de afuera arrancan mitad en camino, mitad todavía sin venir.
        if (rng.chance(0.6)) arrancarTren(ruta, rng.range(0, 0.8));
        else ruta.espera = rng.range(0, ruta.esperaMax);
      }

      return ruta;
    });
  }

  /** Un tren nuevo en esa vía: tipo, escolta, formación, clima, estado y comportamientos sorteados de cero. */
  function arrancarTren(ruta, t) {
    ruta.tren = {
      t, tipoTren: null, dificultad: null, composicion: null,
      clima: null, estado: null, comportamientos: null, variantes: null,
      encubiertos: null, paquetes: null, cajaOculta: false,
    };
    nuevoTipo(ruta.tren);
    ruta.tren.dificultad = sortearDificultad(rng);
  }

  /**
   * Otro tren. El tipo trae consigo su formación de vagones: cambiar de tipo
   * sin recomponer el tren dejaría un veloz hecho de vagones largos.
   *
   * Clima, estado y comportamientos se sortean en el mismo momento: son
   * parte de qué SERVICIO es este tren, no de la escolta (que cambia en
   * cada parada, ver `avanzarRuta`). Un tren no se moja a mitad de camino,
   * ni cambia de qué está hablando su gente.
   *
   * SÓLO SI EL TIPO LO PERMITE (`tipoTren.modificadores`, data/train.js).
   * Por ahora nada más el estándar entra en este sorteo — ver el porqué en
   * el catálogo. Un veloz o uno de carga siempre sale despejado, sin ningún
   * estado y con todos sus vagones patrullando normal, como si esta capa no
   * existiera todavía para ellos.
   */
  function nuevoTipo(tren) {
    tren.tipoTren = sortearTipoTren(rng);
    tren.composicion = sortearComposicion(rng, tren.tipoTren);
    if (tren.tipoTren.modificadores) {
      tren.clima = sortearClima(rng);
      // `gameState.bounty`: la recompensa que ya tenías al mirar el mapa —
      // es lo que decide si `redada` entra en la bolsa (ver data/modifiers.js).
      tren.estado = sortearEstadoTren(rng, gameState.bounty);
      /**
       * Un comportamiento por vagón. El blindado queda afuera (como redada:
       * sus guardias tienen sus propias reglas) y siempre patrulla normal.
       * `conversando` necesita 2+ patrullas y `vigilandoCaja` necesita una
       * caja fuerte de verdad en ese vagón — `sortearComportamiento` ya
       * sabe sacarlos de la bolsa si no cumplen (ver data/modifiers.js).
       */
      tren.comportamientos = tren.composicion.map((id) => {
        if (id === 'blindado') return 'normal';
        const patrullas = (WAGONS[id].enemies || []).length;
        const tieneCaja = (WAGONS[id].loot || []).some((l) => l.type === 'strongbox');
        return sortearComportamiento(rng, patrullas >= 2, tieneCaja);
      });
      /**
       * QUÉ TIPOS DE GUARDIA PUEDEN VIAJAR EN ESTE TREN (Fase 4, ver
       * VARIANTES_GUARDIA en data/modifiers.js). Acá sólo se decide QUÉ ESTÁ
       * PERMITIDO — a qué guardia le toca se sortea después, uno por uno, al
       * armar el tren (`buildTrain`).
       *
       * Se mira la misma foto de `gameState` que ya decide si entra `redada`:
       * la recompensa Y el honor que traías al abrir el mapa. El Pistolero
       * necesita las dos cosas — que paguen caro por vos y que te tengan
       * miedo.
       */
      tren.variantes = variantesPermitidas(gameState.bounty, gameState.honor);
      /**
       * ¿QUÉ VAGONES LLEVAN UN CIVIL ENCUBIERTO? Array paralelo a
       * `composicion`, como `comportamientos`: uno por vagón, como mucho uno
       * por vagón, y sólo donde de verdad viaja gente (el correo o el
       * blindado no tienen a quién disfrazar). Ver data/modifiers.js.
       */
      tren.encubiertos = tren.composicion.map((id) =>
        sortearCivilEncubierto(rng, (WAGONS[id].passengers || []).length));
      /**
       * EL PAQUETE DE CADA VAGÓN (Fase 5, ver data/paquetes.js): un objetivo
       * valioso con su custodia, metido en un vagón cualquiera. La mayoría
       * de los vagones no lleva ninguno — `sortearPaquete` devuelve `null` la
       * mayor parte de las veces, a diferencia de los comportamientos, donde
       * siempre sale algo.
       */
      tren.paquetes = tren.composicion.map((id) =>
        sortearPaquete(rng, (WAGONS[id].passengers || []).length > 0));
      /**
       * ¿ESTE TREN ESCONDE UNA CAJA FUERTE? Es del TREN, no de un vagón (ver
       * data/paquetes.js): puede terminar en cualquiera menos el blindado, y
       * los tres pasajeros que saben dónde está viajan donde les toque. Acá
       * sólo se decide si la hay; el vagón, el escondite y quiénes lo saben
       * se sortean al armar el tren, que es donde se conoce el mapa de verdad.
       */
      tren.cajaOculta = rng.chance(CHANCE_CAJA_OCULTA);
    } else {
      tren.clima = CLIMA[CLIMA_POR_DEFECTO];
      tren.estado = [];
      tren.comportamientos = tren.composicion.map(() => 'normal');
      tren.variantes = [];
      tren.encubiertos = tren.composicion.map(() => false);
      tren.paquetes = tren.composicion.map(() => null);
      tren.cajaOculta = false;
    }
  }

  function enter() {
    hud.hide();
    encima = null;

    if (!rutas) {
      prepararRutas();

      // Las manchas del papel se sortean UNA vez y quedan fijas: si cambiaran
      // cada cuadro parecerían ruido de televisión, no un papel sucio.
      manchas = [];
      for (let i = 0; i < 26; i++) {
        manchas.push({
          x: 20 + ((i * 97) % 344),
          y: 16 + ((i * 61) % 184),
          r: 3 + ((i * 7) % 9),
          a: 0.05 + ((i % 4) * 0.02),
        });
      }
    }

    ponerseAlDia();

    // Para depurar desde la consola: FORAJIDO.services.mapa
    services.mapa = {
      get encima() { return encima ? encima.id : null; },
      get rutas() { return rutas; },
      get conTren() { return rutas.filter((r) => r.tren).map((r) => r.id); },
      /** Qué tren hay hoy en cada vía, en una línea legible. */
      get trenes() {
        return rutas.map((r) => `${r.id}: ` + (r.tren
          ? `${r.tren.tipoTren.id}/${r.tren.dificultad.id} clima=${r.tren.clima.id} `
            + `estado=${r.tren.estado.join(',') || '-'} `
            + `comportamientos=[${r.tren.comportamientos.join(',')}] t=${r.tren.t.toFixed(2)}`
          : (r.servicio === false ? 'sin servicio' : `esperando ${r.espera.toFixed(1)}s`)));
      },
      /** Adelantar el mapa a mano, para probar los sorteos sin esperar. */
      adelantar(segundos) {
        let falta = segundos;
        while (falta > 0) {
          const paso = Math.min(PASO_AL_DIA, falta);
          for (const r of rutas) avanzarRuta(r, paso);
          falta -= paso;
        }
      },
    };
  }

  /**
   * Adelantar el mapa por todo el tiempo que pasó mientras no lo mirabas.
   *
   * Se simula a pasos chicos en vez de saltar de una: los trenes tienen que
   * PASAR por sus paradas para que se sorteen, y un salto de un minuto se
   * saltearía todas.
   */
  function ponerseAlDia() {
    const ahora = performance.now() / 1000;
    if (ultimoReloj > 0) {
      let falta = Math.min(ahora - ultimoReloj, MAXIMO_AL_DIA);
      while (falta > 0) {
        const paso = Math.min(PASO_AL_DIA, falta);
        for (const r of rutas) avanzarRuta(r, paso);
        falta -= paso;
      }
    }
    ultimoReloj = ahora;
  }

  // ------------------------------------------------------------------ lógica

  /** ¿El tren cruzó el punto `p` del recorrido yendo de `a` a `b`? */
  function cruzo(a, b, p) {
    return (a < p && b >= p) || (a < p + 1 && b >= p + 1);
  }

  /**
   * UN PASO DE LA VIDA DE ESA VÍA. Acá vive todo el sistema:
   *
   *  - **Al pasar por una parada** se sortea de nuevo la DIFICULTAD. En cada
   *    estación sube y baja escolta, así que el mismo tren puede endurecerse o
   *    aflojarse mientras lo mirás.
   *  - **Al completar la vuelta** (volver a su terminal) se sortea de nuevo el
   *    TIPO DE TREN: ya no es el mismo tren, es el siguiente servicio de esa
   *    línea.
   *  - **Las que vienen de afuera no dan la vuelta**: llegan al otro extremo,
   *    se van del mapa, y la vía queda vacía un rato hasta que asoma otro.
   */
  function avanzarRuta(ruta, dt) {
    if (ruta.servicio === false || ruta.total === 0) return;

    if (!ruta.tren) {
      ruta.espera -= dt;
      if (ruta.espera <= 0) arrancarTren(ruta, 0);
      return;
    }

    const tren = ruta.tren;
    const velocidad = REGION.velocidadTren / ruta.total;   // fracción por segundo
    const antes = tren.t;
    tren.t += velocidad * dt;

    for (const p of ruta.paradas) {
      if (cruzo(antes, tren.t, p.t)) tren.dificultad = sortearDificultad(rng);
    }

    if (tren.t >= 1) {
      if (ruta.circular) {
        tren.t -= 1;
        nuevoTipo(tren);                       // dio la vuelta: otro tren
        tren.dificultad = sortearDificultad(rng);
      } else {
        ruta.tren = null;                      // se fue del mapa
        ruta.espera = rng.range(ruta.esperaMin, ruta.esperaMax);
      }
    }
  }

  /**
   * La próxima vez que ese tren para. Para un circuito, volver a la terminal
   * cuenta como parada — y es la más importante de todas, porque ahí deja de
   * ser este tren y pasa a ser otro.
   */
  function proximaParada(ruta) {
    const tren = ruta.tren;
    if (!tren) return null;

    const puntos = [...ruta.paradas];
    if (ruta.circular) puntos.push({ lugar: ruta.terminal, t: 1, esTerminal: true });
    if (puntos.length === 0) return null;

    let mejor = null;
    let mejorDist = Infinity;
    for (const p of puntos) {
      let d = p.t - tren.t;
      if (d < 0 && ruta.circular) d += 1;
      if (d >= 0 && d < mejorDist) { mejorDist = d; mejor = p; }
    }
    return mejor;
  }

  /** ¿La fracción t de esta ruta va por dentro de un túnel? */
  function enTunel(ruta, t) {
    for (const [a, b] of ruta.tuneles || []) {
      if (t >= a && t <= b) return true;
    }
    return false;
  }

  /** Hacia dónde apunta la vía en t. Para poner las traviesas perpendiculares. */
  function tangenteEn(ruta, t) {
    const d = 0.6 / ruta.total;
    const a = puntoEn(ruta, Math.max(0, t - d));
    const b = puntoEn(ruta, Math.min(1, t + d));
    const largo = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: (b.x - a.x) / largo, y: (b.y - a.y) / largo };
  }

  /** El punto de la polilínea a la fracción t (0..1), a velocidad pareja. */
  function puntoEn(ruta, t) {
    let restante = Math.max(0, Math.min(1, t)) * ruta.total;
    for (let i = 0; i < ruta.largos.length; i++) {
      if (restante <= ruta.largos[i]) {
        const f = ruta.largos[i] === 0 ? 0 : restante / ruta.largos[i];
        const a = ruta.puntos[i], b = ruta.puntos[i + 1];
        return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f };
      }
      restante -= ruta.largos[i];
    }
    const u = ruta.puntos[ruta.puntos.length - 1];
    return { x: u[0], y: u[1] };
  }

  /** Distancia del cursor a un segmento. Es lo que hace "señalar la vía". */
  function distanciaASegmento(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const largo2 = dx * dx + dy * dy;
    if (largo2 === 0) return Math.hypot(px - ax, py - ay);
    let t = ((px - ax) * dx + (py - ay) * dy) / largo2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }

  function rutaBajoElCursor(mx, my) {
    let mejor = null;
    let mejorDist = 7;   // el grosor del "dedo": generoso, es un mapa de papel
    for (const r of rutas) {
      for (let i = 0; i < r.puntos.length - 1; i++) {
        const d = distanciaASegmento(
          mx, my, r.puntos[i][0], r.puntos[i][1], r.puntos[i + 1][0], r.puntos[i + 1][1]
        );
        if (d < mejorDist) { mejorDist = d; mejor = r; }
      }
    }
    return mejor;
  }

  function update(dt) {
    scroll += dt;
    ultimoReloj = performance.now() / 1000;

    for (const r of rutas) avanzarRuta(r, dt);

    const anterior = encima;
    encima = rutaBajoElCursor(input.mouse.x, input.mouse.y);
    if (encima && encima !== anterior) audio.play('cover');

    // Clic en una vía con tren: salís a alcanzarlo.
    if (input.mouse.pressed && encima && encima.tren) salir(encima);

    // Volver: Escape o clic derecho, que en un mapa es el gesto de doblarlo.
    if (input.wasPressed('Escape') || input.mouse.right) {
      scenes.goTo('camp', { desde: 'mapa' });
    }
  }

  /**
   * Salir a alcanzar ese tren.
   *
   * Le pasa al galope EL TREN QUE ESTABAS MIRANDO — el mismo que venía dando
   * vueltas por esa vía, con el tipo y la escolta que tenía en el momento en
   * que hiciste clic. Lo que leíste en el cartucho es lo que te vas a
   * encontrar; el mapa no vuelve a sortear nada al salir.
   */
  function salir(ruta) {
    audio.play('escape');
    const tren = ruta.tren;
    scenes.goTo('ride', {
      composicion: tren.composicion,
      dificultad: tren.dificultad.id,
      tipoTren: tren.tipoTren.id,
      clima: tren.clima.id,
      estado: tren.estado,
      comportamientos: tren.comportamientos,
      variantes: tren.variantes,
      encubiertos: tren.encubiertos,
      paquetes: tren.paquetes,
      cajaOculta: tren.cajaOculta,
      ruta: ruta.id,
    });
  }

  // ------------------------------------------------------------------ dibujo

  function render(r) {
    dibujarPapel(r);
    dibujarTerreno(r);
    // Las vías van ANTES que los lugares y la vía señalada va última, para que
    // en un cruce se vea claro cuál de las dos estás mirando.
    for (const ruta of rutas) if (ruta !== encima) dibujarVia(r, ruta, false);
    if (encima) dibujarVia(r, encima, true);
    dibujarLugares(r);
    if (encima) dibujarParadas(r, encima);
    dibujarCampamento(r);
    for (const ruta of rutas) if (ruta.tren) dibujarTren(r, ruta);
    dibujarRosaDeLosVientos(r);
    dibujarCartucho(r);
  }

  /** El papel: base, veteado, manchas y el marco doble de tinta. */
  function dibujarPapel(r) {
    r.clear(colors.mapaPapel);

    // Veteado horizontal, muy suave: el grano del papel.
    r.ctx.globalAlpha = 0.35;
    for (let y = 8; y < 210; y += 3) {
      if ((y / 3) % 2 === 0) r.rect(6, y, 372, 1, colors.mapaPapel2);
    }
    r.ctx.globalAlpha = 1;

    // Manchas de humedad, fijas desde la primera vez.
    for (const m of manchas) {
      r.ctx.save();
      r.ctx.globalAlpha = m.a;
      r.ctx.fillStyle = colors.mapaMancha;
      r.ctx.beginPath();
      r.ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      r.ctx.fill();
      r.ctx.restore();
    }

    // Los bordes gastados: el papel se oscurece hacia afuera.
    r.ctx.globalAlpha = 0.5;
    r.rect(0, 0, 384, 5, colors.mapaMancha);
    r.rect(0, 211, 384, 5, colors.mapaMancha);
    r.rect(0, 0, 5, 216, colors.mapaMancha);
    r.rect(379, 0, 5, 216, colors.mapaMancha);
    r.ctx.globalAlpha = 1;

    // El marco doble, como cualquier mapa impreso de la época.
    const m = REGION.marco;
    marco(r, m.x, m.y, m.w, m.h, colors.mapaBorde);
    marco(r, m.x + 3, m.y + 3, m.w - 6, m.h - 6, colors.mapaTintaSuave);

    /**
     * EL TÍTULO SE MUDÓ ADENTRO DEL CARTUCHO (ver `dibujarCartucho`).
     *
     * Antes iba en una banda al medio de arriba, y esa banda es justo por
     * donde entra la Línea del Territorio desde afuera del mapa: el título le
     * comía la vía, y correrlo a cualquier esquina le pisaba el nombre a otro
     * pueblo. Meterlo en el cartucho no es sólo el arreglo más barato — es
     * dónde va el título en un mapa de la época: EL CARTUCHO ES EL LUGAR DEL
     * TÍTULO. Y libera la franja de arriba entera para las vías.
     */
  }

  function marco(r, x, y, w, h, color) {
    r.rect(x, y, w, 1, color);
    r.rect(x, y + h - 1, w, 1, color);
    r.rect(x, y, 1, h, color);
    r.rect(x + w - 1, y, 1, h, color);
  }

  function dibujarTerreno(r) {
    for (const t of REGION.terreno) {
      switch (t.tipo) {
        case 'sierra':   dibujarSierra(r, t.puntos); break;
        case 'rio':      dibujarRio(r, t.puntos); break;
        case 'meseta':   dibujarMeseta(r, t); break;
        case 'cactus':   dibujarCactus(r, t.x, t.y); break;
        case 'dunas':    dibujarDunas(r, t.x, t.y); break;
      }
    }
  }

  /** Montañas en chevrones, que es como se dibujaban antes de las curvas de nivel. */
  function dibujarSierra(r, puntos) {
    for (const [px, py] of puntos) {
      r.line(px - 7, py + 5, px, py - 4, colors.mapaTintaSuave);
      r.line(px, py - 4, px + 7, py + 5, colors.mapaTintaSuave);
      // Una rayita de sombra en la ladera derecha: da volumen por dos píxeles.
      r.line(px + 2, py + 1, px + 4, py + 4, colors.mapaTinta);
    }
  }

  function dibujarRio(r, puntos) {
    for (let i = 0; i < puntos.length - 1; i++) {
      r.line(puntos[i][0], puntos[i][1], puntos[i + 1][0], puntos[i + 1][1], colors.mapaRio);
      r.line(puntos[i][0] + 1, puntos[i][1], puntos[i + 1][0] + 1, puntos[i + 1][1], colors.mapaRio);
    }
  }

  function dibujarMeseta(r, t) {
    marco(r, t.x, t.y, t.w, t.h, colors.mapaTintaSuave);
    for (let i = 3; i < t.w - 2; i += 5) {
      r.line(t.x + i, t.y + 2, t.x + i - 2, t.y + t.h - 2, colors.mapaTintaSuave);
    }
  }

  function dibujarCactus(r, x, y) {
    r.rect(x, y - 4, 1, 8, colors.mapaTintaSuave);
    r.rect(x - 3, y - 2, 1, 3, colors.mapaTintaSuave);
    r.rect(x + 2, y - 3, 1, 3, colors.mapaTintaSuave);
    r.rect(x - 3, y - 2, 3, 1, colors.mapaTintaSuave);
    r.rect(x + 1, y - 3, 2, 1, colors.mapaTintaSuave);
  }

  function dibujarDunas(r, x, y) {
    r.line(x - 6, y, x - 2, y - 2, colors.mapaTintaSuave);
    r.line(x - 2, y - 2, x + 2, y, colors.mapaTintaSuave);
    r.line(x + 3, y + 3, x + 7, y + 1, colors.mapaTintaSuave);
  }

  /**
   * LA VÍA, con su travesaño.
   *
   * Se dibuja la línea y después las rayitas perpendiculares cada pocos
   * píxeles. Esas rayitas son todo: son las que hacen que se lea "ferrocarril"
   * y no "camino", sin una sola palabra.
   *
   * Un ramal sin servicio va en tinta clara y con el travesaño más espaciado:
   * se ve que está, se ve que está muerto. Ojo con la diferencia — una vía de
   * las que vienen de afuera SIN tren en este momento sigue siendo una vía
   * viva (está esperando el próximo), así que se dibuja entera. Que no haya
   * tren ahora lo dice el cartucho, no la tinta.
   */
  function dibujarVia(r, ruta, resaltada) {
    const viva = ruta.servicio !== false;
    const color = resaltada ? colors.mapaResalte
      : viva ? colors.mapaTinta : colors.mapaTintaSuave;
    const paso = viva ? 6 : 9;

    // --- El riel, recorrido de a 2px para poder cortarlo en los túneles ---
    let prev = puntoEn(ruta, 0);
    for (let d = 2; d <= ruta.total; d += 2) {
      const t = d / ruta.total;
      const p = puntoEn(ruta, t);
      if (!enTunel(ruta, t)) {
        r.line(prev.x, prev.y, p.x, p.y, color);
        // La vía señalada se dibuja doble: es todo el resaltado que hace falta.
        if (resaltada) r.line(prev.x, prev.y + 1, p.x, p.y + 1, color);
      } else if (Math.floor(d / 4) % 2 === 0) {
        // Bajo tierra va punteada y en tinta clara: se sabe que sigue, se ve
        // que no está a la vista. Es la convención de cualquier mapa de la época.
        r.line(prev.x, prev.y, p.x, p.y, colors.mapaTintaSuave);
      }
      prev = p;
    }

    // --- Las traviesas, perpendiculares. Ninguna adentro del túnel ---
    for (let d = 0; d < ruta.total; d += paso) {
      const t = d / ruta.total;
      if (enTunel(ruta, t)) continue;
      const p = puntoEn(ruta, t);
      const u = tangenteEn(ruta, t);
      const l = resaltada ? 3 : 2;
      r.line(p.x + u.y * l, p.y - u.x * l, p.x - u.y * l, p.y + u.x * l, color);
    }

    // --- Y las bocas del túnel ---
    for (const [a, b] of ruta.tuneles || []) {
      dibujarBocaTunel(r, ruta, a, color);
      dibujarBocaTunel(r, ruta, b, color);
    }
  }

  /**
   * La boca del túnel: un corchete cruzado sobre la vía. Es lo que convierte
   * "acá la línea se corta" en "acá la línea se mete adentro del cerro" — sin
   * eso, un túnel parece una vía mal dibujada.
   */
  function dibujarBocaTunel(r, ruta, t, color) {
    const p = puntoEn(ruta, t);
    const u = tangenteEn(ruta, t);
    const nx = u.y, ny = -u.x;
    r.line(p.x + nx * 4, p.y + ny * 4, p.x - nx * 4, p.y - ny * 4, color);
    // Las dos patitas, hacia el lado de afuera del túnel.
    const hacia = t < 0.5 ? -1 : 1;
    r.line(p.x + nx * 4, p.y + ny * 4,
      p.x + nx * 4 + u.x * 2 * hacia, p.y + ny * 4 + u.y * 2 * hacia, color);
    r.line(p.x - nx * 4, p.y - ny * 4,
      p.x - nx * 4 + u.x * 2 * hacia, p.y - ny * 4 + u.y * 2 * hacia, color);
  }

  /**
   * El tren: un puntito con humo, avanzando. Es la respuesta entera a "¿hay un
   * tren andando?", y no hace falta ningún texto para darla.
   *
   * El humo sale hacia ATRÁS del tren, calculado con la tangente de la vía en
   * ese punto. Antes se usaba `dir` (para qué lado iba, ida o vuelta); ahora
   * los trenes siempre van para adelante por su circuito, así que el "atrás"
   * lo dice la propia curva.
   */
  function dibujarTren(r, ruta) {
    const p = puntoEn(ruta, ruta.tren.t);
    const u = tangenteEn(ruta, ruta.tren.t);

    r.box(p.x, p.y, 2, 2, colors.mapaTinta);
    r.box(p.x, p.y, 1, 1, colors.mapaSello);

    // Tres bocanadas de humo, cada vez más chicas y más borradas.
    for (let i = 1; i <= 3; i++) {
      const sube = Math.sin(scroll * 3 + i) * 0.8;
      r.ctx.globalAlpha = 0.5 - i * 0.13;
      r.box(p.x - u.x * i * 3, p.y - u.y * i * 3 - i * 2.2 + sube,
        1.5 - i * 0.2, 1.5 - i * 0.2, colors.mapaTintaSuave);
      r.ctx.globalAlpha = 1;
    }
  }

  /**
   * Los lugares, cada tipo con su símbolo. Que una mina no se dibuje igual que
   * un pueblo es lo que explica, sin una palabra, por qué hay ramales que no
   * unen dos ciudades.
   */
  function dibujarLugares(r) {
    for (const p of REGION.lugares) {
      if (p.tipo === 'mina') {
        // Los dos picos cruzados: el símbolo minero de toda la vida.
        r.line(p.x - 4, p.y - 4, p.x + 4, p.y + 4, colors.mapaTinta);
        r.line(p.x + 4, p.y - 4, p.x - 4, p.y + 4, colors.mapaTinta);
      } else if (p.tipo === 'puesto') {
        // Un cuadradito hueco: hay algo, pero no es un pueblo.
        marco(r, p.x - 3, p.y - 3, 6, 6, colors.mapaTintaSuave);
      } else {
        // El pueblo: cuadrado relleno con su anillo.
        r.box(p.x, p.y, 2, 2, colors.mapaTinta);
        r.circle(p.x, p.y, 4, colors.mapaTintaSuave, 0.7);
      }

      const color = p.tipo === 'pueblo' ? colors.mapaTinta : colors.mapaTintaSuave;
      etiqueta(r, p.nombre, p.x, p.y, p.etiqueta, color);
    }
  }

  /**
   * DÓNDE PARA EL TREN QUE ESTÁS MIRANDO.
   *
   * Sólo de la vía señalada, y sólo mientras la señalás. Es lo que hace que la
   * regla del sorteo se pueda VER en vez de tener que leerla: estos son los
   * puntos donde a ese tren le cambia la escolta, y el doble anillo es su
   * terminal, donde deja de ser este tren y pasa a ser otro.
   */
  function dibujarParadas(r, ruta) {
    for (const p of ruta.paradas) {
      const lugar = REGION.lugares.find((l) => l.id === p.lugar);
      if (lugar) r.circle(lugar.x, lugar.y, 6, colors.mapaResalte, 0.8);
    }
    if (ruta.circular && ruta.terminal) {
      const lugar = REGION.lugares.find((l) => l.id === ruta.terminal);
      if (lugar) {
        r.circle(lugar.x, lugar.y, 6, colors.mapaSello, 0.9);
        r.circle(lugar.x, lugar.y, 8, colors.mapaSello, 0.6);
      }
    }
  }

  /**
   * El nombre al lado del símbolo, del lado que no moleste. Va con halo del
   * color del PAPEL, no negro: así la etiqueta recorta el fondo y se lee
   * aunque le pase una vía por debajo, que es como se hace en cartografía de
   * verdad. Un contorno negro sobre papel sepia rompería la paleta entera.
   */
  function etiqueta(r, texto, x, y, lado, color) {
    const halo = { halo: colors.mapaPapel };
    if (lado === 'izq')    return r.text(texto, x - 7, y, color, 'right', halo);
    if (lado === 'der')    return r.text(texto, x + 7, y, color, 'left', halo);
    if (lado === 'arriba') return r.text(texto, x, y - 10, color, 'center', halo);
    return r.text(texto, x, y + 10, color, 'center', halo);
  }

  /** Tu campamento: una carpita y el nombre. Es el único lugar que es tuyo. */
  function dibujarCampamento(r) {
    const c = REGION.campamento;
    r.line(c.x - 5, c.y + 4, c.x, c.y - 4, colors.mapaSello);
    r.line(c.x, c.y - 4, c.x + 5, c.y + 4, colors.mapaSello);
    r.line(c.x - 5, c.y + 4, c.x + 5, c.y + 4, colors.mapaSello);
    // El fueguito al lado, latiendo: es lo único vivo del mapa además del tren.
    if (Math.floor(scroll * 3) % 2 === 0) r.rect(c.x + 8, c.y + 1, 1, 2, colors.mapaSello);
    r.text(T.mapa.campamento, c.x, c.y + 12, colors.mapaSello, 'center', { halo: colors.mapaPapel });
  }

  /** La rosa de los vientos. Ningún mapa de la época se imprimía sin una. */
  function dibujarRosaDeLosVientos(r) {
    const x = 30, y = 186;
    r.circle(x, y, 9, colors.mapaTintaSuave, 0.8);
    r.line(x, y - 8, x, y + 8, colors.mapaTintaSuave);
    r.line(x - 8, y, x + 8, y, colors.mapaTintaSuave);
    r.line(x - 3, y - 3, x, y - 9, colors.mapaTinta);
    r.line(x + 3, y - 3, x, y - 9, colors.mapaTinta);
    r.text('N', x, y - 15, colors.mapaTinta, 'center', { halo: colors.mapaPapel });
  }

  /**
   * EL CARTUCHO. En los mapas viejos es el recuadro con el título y la
   * leyenda; acá es lo único que habla. Va abajo, fijo, y no siguiendo al
   * cursor: un cartel que persigue al mouse tapa justo lo que querés mirar.
   *
   * Lo que dice de una vía con tren es todo lo que necesitás para decidir SIN
   * salir a buscarlo: qué tren es, una idea de su carga, con cuánta escolta
   * viaja, y —lo más importante— DÓNDE PARA PRÓXIMO, porque en la próxima
   * parada esa escolta se vuelve a sortear y en la terminal cambia el tren
   * entero. Sin esa última línea, ver la dificultad cambiar sola sería un
   * misterio; con ella, la ves venir.
   */
  function dibujarCartucho(r) {
    // Abajo a la derecha, que es donde se imprimía. Corrido del centro para
    // dejarle a la RED todo el ancho del papel: con siete líneas cruzándose,
    // el espacio del mapa vale más que la simetría del recuadro.
    const x = 196, y = 150, w = 180, h = 56;
    r.rect(x, y, w, h, colors.mapaPapel);
    marco(r, x, y, w, h, colors.mapaBorde);
    marco(r, x + 2, y + 2, w - 4, h - 4, colors.mapaTintaSuave);

    const cx = x + w / 2;
    const sin = { halo: null };   // adentro del cartucho el fondo ya está limpio

    // Sin nada señalado, el cartucho hace de portada: dice qué mapa es.
    if (!encima) {
      r.text(REGION.nombre, cx, y + 14, colors.mapaTinta, 'center', sin);
      r.text(T.mapa.subtitulo, cx, y + 24, colors.mapaTintaSuave, 'center', sin);
      r.text(T.mapa.ayuda, cx, y + 38, colors.mapaTinta, 'center', sin);
      r.text(T.mapa.volver, cx, y + 48, colors.mapaTintaSuave, 'center', sin);
      return;
    }

    r.text(encima.nombre, cx, y + 11, colors.mapaTinta, 'center', sin);

    // Ramal muerto: no hay nada más que decir.
    if (encima.servicio === false) {
      r.text(T.mapa.sinServicio, cx, y + 30, colors.mapaTintaSuave, 'center', sin);
      return;
    }

    // Viene de otra región y ahora mismo no hay ninguno: hay que esperarlo.
    if (!encima.tren) {
      r.text(T.mapa.deOtraRegion, cx, y + 26, colors.mapaTintaSuave, 'center', sin);
      r.text(T.mapa.sinTrenAhora, cx, y + 40, colors.mapaTinta, 'center', sin);
      return;
    }

    const tren = encima.tren;
    r.text(`${tren.tipoTren.name} · ${tren.dificultad.short}`, cx, y + 21,
      tren.dificultad.color, 'center', sin);
    r.text(tren.tipoTren.pista, cx, y + 30, colors.mapaTintaSuave, 'center', sin);

    const proxima = proximaParada(encima);
    const texto = !proxima ? T.mapa.sigueDeLargo
      : proxima.esTerminal ? T.mapa.vuelveA(nombreDe(proxima.lugar))
      : T.mapa.paraEn(nombreDe(proxima.lugar));
    r.text(texto, cx, y + 39, colors.mapaTintaSuave, 'center', sin);

    // Parpadea: es la única cosa urgente que dice este mapa.
    const vivo = Math.floor(scroll * 3) % 2 === 0;
    r.text(T.mapa.salir, cx, y + 48, vivo ? colors.mapaSello : colors.mapaTinta, 'center', sin);
  }

  return { enter, update, render };
}
