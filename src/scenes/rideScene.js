/**
 * LA APROXIMACIÓN A CABALLO — fase 2, pasos C y D.
 *
 * El asalto no empieza con un menú ni adentro del vagón: empieza detrás del
 * tren, galopando para alcanzarlo, con la locomotora allá adelante.
 *
 * 🔺 CON CÁMARA BAJA, YA NO DESDE ARRIBA *(Santi: "que se pueda ver el cielo y
 * las montañas a lo lejos" y "el tren se debería ver como se ve un tren desde
 * afuera")*. Antes se veía igual que el asalto, con el tren de arriba y sus
 * asientos a la vista antes de haber entrado. Ahora hay cielo, montañas, el
 * tren de costado (world/trenDeCostado.js) y el desierto adelante.
 *
 * SE JUEGA EXACTAMENTE IGUAL: el tren sigue apoyado en `train.map.height`, que
 * de costado es la vía, y el campo sigue abajo. `y` sigue siendo la distancia
 * al tren; sólo que ahora se lee como profundidad —más abajo en pantalla es
 * más cerca de la cámara— en vez de como un plano visto desde el cielo.
 *
 * LAS TRES COSAS QUE COMPITEN POR TU ATENCIÓN, y que son todo el juego de esta
 * escena:
 *
 *  1. **Adelantarte.** Cuesta aguante (que no se recupera) y reloj del asalto.
 *  2. **Que no te vean.** Lejos del tren nadie te ve, pero para saltar hay que
 *     arrimarse. Si te descubren, te disparan por las ventanillas Y entrás al
 *     asalto con la alarma sonando.
 *  3. **Clavar el salto.** No alcanza con llegar: hay que caer bien. Un salto
 *     sucio te mete adentro igual, pero despierta al vagón entero.
 *
 * Y las tres se estorban entre sí a propósito: ir rápido acorta la ventana del
 * salto, y esquivar una piedra te puede empujar contra las ventanillas.
 */

import { CONFIG } from '../data/config.js';
import { HORSES, DEFAULT_HORSE, APROXIMACION as A, caballoActual } from '../data/horse.js';
import {
  TRAIN_TYPES, TIPO_TREN_POR_DEFECTO,
  DIFICULTADES, DIFICULTAD_POR_DEFECTO, SORTEAR_DIFICULTAD,
} from '../data/train.js';
import { CLIMA_POR_DEFECTO } from '../data/modifiers.js';
import { gameState } from '../state/gameState.js';
import { T } from '../text/es.js';
import { sortearComposicion, buildTrain, plataformasDe } from '../world/train.js';
import {
  dibujarTrenDeCostado, escalarColor, ALTO_DEL_TECHO, ALTO_DEL_ENGANCHE, ALTURA_VENTANILLA,
} from '../world/trenDeCostado.js';
import { distance } from '../engine/collision.js';
import { drawParallax, drawSpeedLines } from '../engine/parallax.js';

export function createRideScene(services) {
  const { renderer, input, rng, scenes, hud, audio } = services;
  const colors = CONFIG.colors;
  const size = CONFIG.tileSize;

  /**
   * A qué altura sobre la vía queda el horizonte: detrás del tren, a media
   * caja, así los vagones tapan el pie de las montañas. Ver `dibujarAfuera`.
   */
  const HORIZONTE = 30;

  let caballo;
  let composicion, dificultad, tipoTren, clima, estado, comportamientos, variantes,
    encubiertos, paquetes, cajaOculta, train, plataformas, largoTren;
  let hayTormenta, truenoTimer, cascoTimer, velCaballoActual;
  let x, y, vel, aguante, reloj, gastado, scroll, alcanzada;
  let trastabilla, choque, saltando, terminado;
  let exposicion, visto, obstaculos, aviso;
  let vida, invuln, tiradores, balas;
  let calidadSalto, techoDestino, barra;
  /**
   * `suelo`: cuánto terreno lleva recorrido el tren. Es lo que hace que el
   * desierto desfile hacia atrás en vez de estar clavado a los vagones.
   * `rumbo`: hacia dónde apunta el caballo (radianes, 0 = derecha). No es la
   * dirección que apretás: es a dónde llegó el animal de girar hasta ahora.
   */
  let suelo, rumbo;

  /**
   * @param params lo que eligió el MAPA DE RUTAS (`scenes/mapScene.js`):
   *   `tipoTren`, `composicion`, `dificultad`, `clima` y `estado`, sorteados
   *   ahí mismo al pasar el cursor sobre la vía. Si faltan (por ejemplo,
   *   saltando el mapa desde la consola), el galope sortea como siempre.
   *   `clima` y `estado` sólo se leen acá para reenviarlos al asalto —
   *   durante el galope no hay guardias simulados, así que no cambian nada
   *   todavía.
   */
  function enter(params = {}) {
    hud.hide();
    caballo = caballoActual(gameState);
    tipoTren = TRAIN_TYPES[params.tipoTren] || TRAIN_TYPES[TIPO_TREN_POR_DEFECTO];
    composicion = params.composicion || sortearComposicion(rng, tipoTren);
    dificultad = DIFICULTADES[params.dificultad]
      || (SORTEAR_DIFICULTAD
        ? DIFICULTADES[Object.keys(DIFICULTADES)[rng.int(0, Object.keys(DIFICULTADES).length - 1)]]
        : DIFICULTADES[DIFICULTAD_POR_DEFECTO]);
    clima = params.clima || CLIMA_POR_DEFECTO;
    estado = params.estado || [];
    comportamientos = params.comportamientos || [];
    variantes = params.variantes || [];
    encubiertos = params.encubiertos || [];
    paquetes = params.paquetes || [];
    cajaOculta = !!params.cajaOculta;

    train = buildTrain(
      rng, 1, composicion, dificultad.id, undefined, tipoTren.id, undefined,
      { climaId: clima, estado, comportamientos, variantes, encubiertos, paquetes, cajaOculta }
    );
    plataformas = plataformasDe(train.tramos, size);
    largoTren = train.map.width;

    x = plataformas[1] - A.inicioDetras;
    /**
     * ARRANCÁS EN UNA ESQUINA, LEJOS DEL TREN Y LEJOS DE LA VÍA.
     *
     * *(Santi: "el caballo no debería empezar ahí pegado al tren, debería
     * empezar desde una esquina mucho más atrás")*
     *
     * Antes arrancaba en el MEDIO del carril, que con 38 px de alto era
     * prácticamente pegado a la vía igual. Ahora, con 150 px de campo, arrancar
     * en el fondo (a `carrilLejos - 12`) es de verdad una esquina: abajo del
     * todo y 1000 px atrás. La aproximación entera pasa a ser una diagonal
     * larga hacia adelante y hacia arriba, en vez de un pasillo recto.
     *
     * Los 40 px de margen son para que el caballo no nazca encima de la línea
     * del horizonte y se camufle con ella — pasó, y sólo se vio mirando la
     * escena con foto.ps1. Sigue siendo la esquina, pero con suelo visible por
     * detrás.
     *
     * Con el campo en 330, arrancar acá deja al caballo a 282 px POR DEBAJO de
     * la vía: el tren se ve chiquito allá arriba a la derecha y toda la
     * aproximación es una diagonal hacia él.
     */
    y = train.map.height + A.carrilLejos - 70;
    vel = 0;
    aguante = caballo.aguanteMax;
    reloj = A.tiempoAproximacion;
    gastado = 0;
    alcanzada = false;
    scroll = 0;
    trastabilla = 0;
    choque = 0;
    saltando = 0;
    terminado = false;
    exposicion = 0;
    visto = false;
    aviso = null;
    calidadSalto = null;
    techoDestino = null;
    barra = null;
    suelo = 0;
    rumbo = 0;

    vida = CONFIG.player.health;
    invuln = 0;
    tiradores = [];
    balas = [];
    obstaculos = sembrarObstaculos();
    arrancarTormenta();

    services.ride = {
      get caballo() { return caballo; },
      get x() { return x; },
      get y() { return y; },
      get vel() { return vel; },
      get aguante() { return aguante; },
      get reloj() { return reloj; },
      /** ¿Ya alcanzaste la cola? Desde ahí el reloj del asalto empieza a correr. */
      get alcanzada() { return alcanzada; },
      get gastado() { return gastado; },
      get vida() { return vida; },
      get exposicion() { return exposicion; },
      get visto() { return visto; },
      get tiradores() { return tiradores; },
      get balas() { return balas; },
      get obstaculos() { return obstaculos; },
      /** Hacia dónde apunta el caballo (radianes) y cuánto avanzó el tren. */
      get rumbo() { return rumbo; },
      get suelo() { return suelo; },
      get plataformas() { return plataformas; },
      get plataformaActual() { return plataformaBajoElCaballo(); },
      get calidad() { return calidadDelSalto(); },
      get pegadoAlTren() { return distanciaAlTren() <= caballo.saltoDistancia; },
      get train() { return train; },
      get tipoTren() { return tipoTren; },
      get dificultad() { return dificultad; },
      /** La barra del salto al techo, para poder depurarla desde la consola. */
      get barra() { return barra; },
      get zonasBarra() { return zonasDeLaBarra(); },
      /**
       * Para MIRAR el galope desde la consola: pone el caballo en (x, y) sin
       * tener que galopar hasta ahí. Sólo para sacar fotos de un lugar exacto
       * (al lado de un vagón, de la locomotora); no lo usa el juego.
       */
      ponerEn(nx, ny) {
        x = nx;
        if (ny !== undefined) y = ny;
        alcanzada = x >= plataformas[1];
      },
    };
  }

  /**
   * SEMBRAR EL DESIERTO.
   *
   * *(Santi: "galopar esquivando cactus, rocas y pequeños montículos de arena")*
   *
   * Cuatro tipos, no dos. Los cactus y los montículos son tipos nuevos del
   * MISMO sistema que ya existía (mismo radio, mismo frenado, misma lista): lo
   * único que cambia es cómo se dibujan. No hacía falta un sistema aparte para
   * que el desierto se vea variado.
   *
   * Y SE SIEMBRAN EN TODO EL CAMPO, hasta el borde lejano. Antes el rango
   * llegaba sólo a `carrilLejos` (46), o sea la franja angosta de siempre; con
   * 150 px de campo, sembrar sólo ahí habría dejado el desierto entero vacío
   * justo por donde ahora se galopa la mayor parte del tiempo.
   *
   * `- 6` en el borde de afuera para que ninguno nazca cortado por el borde de
   * la pantalla cuando el zoom está en 1.
   */
  function sembrarObstaculos() {
    const lista = [];
    const tipos = ['roca', 'arbusto', 'cactus', 'monticulo'];
    for (let px = x - 100; px < largoTren + 200; px += A.obstaculoCada) {
      const ox = px + rng.range(-30, 30);
      let oy = train.map.height + rng.range(A.carrilCerca + 4, A.carrilLejos - 6);

      /**
       * 🐛 NADA ENCIMA DE DONDE NACE EL CABALLO. Jugándolo aparecía "¡LA
       * PIEDRA!" en el primer segundo, antes de tocar una tecla: el caballo se
       * materializaba dentro de una roca. Empezar un asalto ya castigado, por
       * algo que el jugador no pudo ver venir, contradice la regla más repetida
       * de este juego — todo peligro se avisa antes de pegar.
       *
       * Se corre en vertical en vez de borrarse: así el desierto no queda con un
       * claro sospechosamente vacío justo en la largada.
       */
      if (Math.abs(ox - x) < 90 && Math.abs(oy - y) < 40) {
        oy = y + (oy < y ? -1 : 1) * rng.range(55, 90);
        oy = Math.max(train.map.height + A.carrilCerca + 4,
          Math.min(train.map.height + A.carrilLejos - 6, oy));
      }

      lista.push({ x: ox, y: oy, tipo: tipos[rng.int(0, tipos.length - 1)], golpeado: false });
    }
    return lista;
  }

  /**
   * DÓNDE ESTÁ ESTE OBSTÁCULO AHORA, en el marco del tren.
   *
   * Los obstáculos viven en coordenadas del SUELO (que está quieto de verdad) y
   * el tren avanza sobre él, así que hay que restar lo recorrido. Todo lo que
   * los dibuje o los choque tiene que pasar por acá: si un lugar usa `ob.x`
   * crudo y otro no, el cactus que ves y el cactus que te frena dejan de ser el
   * mismo — que es la clase de bug que no se nota hasta que alguien juega.
   */
  function obX(ob) {
    return ob.x - suelo;
  }

  /**
   * EL RADIO DE ESTE OBSTÁCULO. Una sola fuente para el choque y para el
   * dibujo: es lo que garantiza que la silueta que ves sea la que te frena.
   * Ver `obstaculoRadios` en data/horse.js.
   */
  function radioDe(ob) {
    return A.obstaculoRadios[ob.tipo] ?? A.obstaculoRadio;
  }

  /**
   * EL DESIERTO NO SE ACABA.
   *
   * Con el suelo desfilando, una lista fija de obstáculos se vaciaría por
   * detrás en unos segundos y quedarías galopando por un desierto pelado. El que
   * queda muy atrás reaparece adelante, con tipo y altura nuevos: son los mismos
   * objetos reusados, así que la cantidad en memoria no cambia nunca.
   */
  function reciclarObstaculos() {
    const tipos = ['roca', 'arbusto', 'cactus', 'monticulo'];
    const salto = A.obstaculoCada * obstaculos.length;
    for (const ob of obstaculos) {
      if (obX(ob) > x - 700) continue;
      ob.x += salto;
      ob.y = train.map.height + rng.range(A.carrilCerca + 4, A.carrilLejos - 6);
      ob.tipo = tipos[rng.int(0, tipos.length - 1)];
      ob.golpeado = false;
    }
  }

  /**
   * EL RUMBO DEL CABALLO — la rienda.
   *
   * *(Santi: "cuando dije que el caballo debería poder moverse en diagonal es
   * que quiero que su cabeza apunte a esa diagonal. Pero el jugador no controla
   * el caballo, controla al jinete que tira de las riendas")*
   *
   * Por eso el rumbo NO se asigna: se PERSIGUE. Vos marcás hacia dónde querés ir
   * y el animal tarda `giroTiempo` en llegar a apuntar ahí — y cuando soltás,
   * sigue virado un momento antes de enderezarse. Esa demora, que en un juego de
   * naves sería un defecto, acá es el punto: se siente que hay un bicho con
   * inercia entre tu mano y la dirección.
   *
   * El rumbo objetivo sale de combinar el avance (siempre hacia adelante, por
   * eso el 1 fijo en X) con lo que estés pidiendo en vertical. Tocando W a fondo
   * da −45°, S a fondo +45°: una diagonal franca, no un giro de 90° que dejaría
   * al caballo de perfil cruzando la pantalla.
   */
  function actualizarRumbo(dt, dy) {
    const objetivo = Math.atan2(dy * 0.9, 1);
    const paso = Math.min(1, dt / A.giroTiempo);
    rumbo += (objetivo - rumbo) * paso;
  }

  // ------------------------------------------------------------------ lógica

  function distanciaAlTren() {
    return y - train.map.height;
  }

  /** El enganche que tengo al lado, o null si estoy pasando por un vagón. */
  function plataformaBajoElCaballo() {
    for (let i = 1; i < plataformas.length; i++) {
      if (plataformas[i] === undefined) continue;
      const ancho = (i === 1 ? train.tramos[0].cols : 3) * size / 2;
      if (Math.abs(x - plataformas[i]) <= ancho + caballo.saltoTolerancia) return i;
    }
    return null;
  }

  /**
   * QUÉ TAN BIEN CAERÍA SI SALTARA AHORA.
   *
   * Acá vive la habilidad. No alcanza con estar sobre el enganche: hay que
   * estar CERCA DEL MEDIO. La zona limpia (`saltoPreciso`) es propiedad del
   * caballo — uno mejor te perdona más — pero el que aprende a clavarla al
   * centro no necesita comprar nada.
   *
   * Y como ir rápido te hace cruzar el enganche en menos tiempo, la dificultad
   * real sale sola de tu propia velocidad. No hay barra de destreza: hay física.
   */
  function calidadDelSalto() {
    const p = plataformaBajoElCaballo();
    if (!p) return { plataforma: null, grado: 'errado' };
    if (distanciaAlTren() > caballo.saltoDistancia) {
      return { plataforma: p, grado: 'lejos' };
    }
    const desvio = Math.abs(x - plataformas[p]);
    const grado = desvio <= caballo.saltoPreciso ? 'limpio' : 'sucio';
    return { plataforma: p, grado, desvio };
  }

  /**
   * ¿SE PUEDE SALTAR AL TECHO DESDE ACÁ?
   *
   * Hace falta estar pegado a un vagón QUE TENGA TECHO — el de ganado va al
   * aire libre y no tiene, así que ahí el salto de arriba no existe.
   *
   * Seguir exigiendo estar pegado (`saltoDistancia`) aunque el grado ahora lo
   * decida la barra es deliberado: es lo que mantiene vivo el nudo de la
   * escena — lejos del tren nadie te ve, pero para saltar hay que arrimarse,
   * y arrimarse es justo donde te miran.
   */
  function vagonConTechoAlLado() {
    const vagon = vagonAlLado();
    if (!vagon || !vagon.tieneTecho) return null;
    if (distanciaAlTren() > caballo.saltoDistancia) return null;
    return vagon;
  }

  /**
   * LA BARRA DEL SALTO AL TECHO.
   *
   * Es la única barra de timing del juego, y va contra una regla escrita del
   * proyecto ("la destreza sale de la física"). El motivo está largo en
   * data/horse.js: el enganche tiene un punto que apuntar y el techo no —es
   * una franja de 40 columnas—, así que ahí la geometría no tenía de dónde
   * sacar destreza. Primer Espacio abre, segundo Espacio frena.
   *
   * El puntero va y viene (no da la vuelta) para que las dos puntas sean
   * igual de peligrosas y el centro sea siempre el premio.
   */
  function abrirBarra(vagon) {
    barra = { vagon, t: 0, dir: 1 };
    audio.play('cock');
  }

  function actualizarBarra(dt) {
    barra.t += barra.dir * A.barraVelocidad * dt;
    if (barra.t >= 1) { barra.t = 1; barra.dir = -1; }
    if (barra.t <= 0) { barra.t = 0; barra.dir = 1; }
  }

  /**
   * El ancho de la zona verde lo agranda el caballo, igual que `saltoPreciso`
   * agranda la zona limpia del salto al enganche. Así comprar un caballo
   * mejor sigue significando lo mismo en los dos saltos — te perdona más — y
   * no hay que explicar dos economías distintas.
   */
  function zonasDeLaBarra() {
    const escala = caballo.saltoPreciso / 9;
    return { verde: A.barraVerde * escala, amarillo: A.barraAmarillo * escala };
  }

  function cerrarBarra() {
    const { verde, amarillo } = zonasDeLaBarra();
    const desvio = Math.abs(barra.t - 0.5);
    const vagon = barra.vagon;
    barra = null;

    if (desvio <= verde) return subirAlTecho(vagon, 'limpio');
    if (desvio <= amarillo) return subirAlTecho(vagon, 'sucio');
    fallarSalto('errado');
  }

  function plataformaMasAtras() {
    let mejor = 1;
    for (let i = 1; i < plataformas.length; i++) {
      if (plataformas[i] !== undefined && plataformas[i] <= x) mejor = i;
    }
    return mejor;
  }

  function vagonAlLado() {
    const w = train.wagonAt(x);
    if (!w || train.tramoAt(x) !== 'vagon') return null;
    return train.wagons[w];
  }

  function cuantosMiran(indice) {
    let n = 0;
    for (const e of train.enemies) if (e.alive && e.wagon === indice) n++;
    for (const p of train.passengers) if (p.alive && p.wagon === indice) n++;
    return n;
  }

  /**
   * ¿Alguien me está viendo desde una ventanilla?
   *
   * OJO CON ESTO, que ya me equivoqué una vez. La primera versión pedía línea
   * de visión limpia desde cada guardia. No funcionaba NUNCA: los guardias
   * patrullan por el pasillo y entre el pasillo y la pared de afuera siempre hay
   * una fila de asientos, así que la línea moría ahí.
   *
   * La regla que sí funciona con la geometría real: **te ve el vagón, no un
   * guardia puntual**. Si tiene ventanillas y viaja gente adentro, alguien te va
   * a ver pasar, y más rápido cuanta más gente haya.
   */
  function actualizarExposicion(dt) {
    if (visto) return;
    const vagon = vagonAlLado();
    if (!vagon || !vagon.tieneVentanillas) return;

    const dist = distanciaAlTren();
    if (dist > A.verDistancia) return;

    const gente = cuantosMiran(vagon.index);
    if (gente === 0) return;

    const cerca = 1 - Math.min(1, dist / A.verDistancia);
    /**
     * 🔻 EL RITMO DEL VAGÓN ABIERTO SE DECIDE POR LO QUE ES, NO POR SU NOMBRE.
     * Antes preguntaba `vagon.id === 'ganado'`, y con los trenes nuevos las
     * dos plataformas —el lugar más expuesto del tren de carga— habrían
     * quedado con el ritmo de un vagón con paredes sin que nadie lo notara.
     *
     * Y lee "a la intemperie", no "hay techo que pisar" (etapa 5): la góndola
     * se camina por arriba pero no tiene paredes, y te ven como al ganado.
     */
    const ritmo = vagon.aLaIntemperie ? A.verRateGanado : A.verRate;
    exposicion += ritmo * cerca * (1 + gente * 0.25) * dt;

    if (exposicion >= 1) {
      exposicion = 1;
      visto = true;
      aviso = { texto: T.ride.teVieron, color: colors.enemyAlert };
      audio.play('whistle');
      abrirFuego(vagon);
    }
  }

  /** Ese vagón te descubrió: a partir de ahora te tira cada tanto. */
  function abrirFuego(vagon) {
    if (tiradores.some((t) => t.wagon === vagon.index)) return;
    tiradores.push({ wagon: vagon.index, timer: A.disparoCadencia, aviso: 0, fogonazo: 0 });
  }

  /**
   * Los vagones que te descubrieron te tiran por las ventanillas.
   *
   * Avisan antes (un fogonazo en la ventanilla) para que se pueda reaccionar, y
   * tienen una puntería malísima: van tirando desde un tren en movimiento a un
   * tipo a caballo. No están para matarte —no podés morir acá— están para que
   * no te quedes pegado al vagón mirando cómodo.
   */
  function actualizarTiradores(dt) {
    for (const t of tiradores) {
      const vagon = train.wagons[t.wagon];
      if (!vagon || cuantosMiran(t.wagon) === 0) continue;

      // Sólo te tiran si estás a tiro: si te fuiste lejos o los dejaste atrás,
      // dejan de gastar balas. Esa es tu salida.
      const centro = vagon.x + vagon.width / 2;
      if (Math.abs(centro - x) > A.disparoAlcance) continue;

      if (t.fogonazo > 0) t.fogonazo -= dt;

      if (t.aviso > 0) {
        t.aviso -= dt;
        if (t.aviso <= 0) dispararDesde(vagon);
        continue;
      }

      t.timer -= dt;
      if (t.timer <= 0) {
        t.timer = A.disparoCadencia;
        t.aviso = A.disparoAviso;
        t.fogonazo = A.disparoAviso;
        audio.play('cock');
      }
    }
  }

  function dispararDesde(vagon) {
    // Sale de la ventanilla más cercana a tu altura, en el borde del tren.
    const desdeX = Math.max(vagon.x + 8, Math.min(vagon.x + vagon.width - 8, x + rng.range(-30, 30)));
    const desdeY = train.map.height - 2;
    const ang = Math.atan2(y - desdeY, x - desdeX) + rng.spread(A.disparoSpread);
    balas.push({
      x: desdeX, y: desdeY,
      vx: Math.cos(ang) * A.disparoVelocidad,
      vy: Math.sin(ang) * A.disparoVelocidad,
      vida: 1.6,
    });
    audio.play('enemyShot');
  }

  function actualizarBalas(dt) {
    for (const b of balas) {
      b.vida -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.vida > 0 && invuln <= 0 && distance(b.x, b.y, x, y) < 9) {
        b.vida = 0;
        recibirTiro(b);
      }
    }
    for (let i = balas.length - 1; i >= 0; i--) {
      if (balas[i].vida <= 0) balas.splice(i, 1);
    }
  }

  function recibirTiro(b) {
    // Piso 1: no se puede morir galopando. Perder el asalto antes de haber
    // subido al tren sería el peor castigo posible por el peor motivo.
    vida = Math.max(1, vida - 1);
    invuln = A.invulnTras;
    vel = Math.max(-A.trastabillaEmpuje, vel - A.disparoEspanto);
    audio.play('playerHurt');
    aviso = {
      texto: vida <= 1 ? T.ride.malherido : T.ride.teDieron,
      color: colors.enemyAlert, life: 1.4,
    };
  }

  function subir(plataforma, grado) {
    if (terminado) return;
    terminado = true;
    saltando = 0.4;
    calidadSalto = grado;
    aviso = {
      texto: grado === 'limpio' ? T.ride.saltoLimpio : T.ride.saltoSucio,
      color: grado === 'limpio' ? colors.doorGlow : colors.enemyAlert,
    };
    audio.play(grado === 'limpio' ? 'cover' : 'hitWall');
    scenes.pendiente = plataforma;
  }

  /**
   * Subir al techo en vez de a un enganche. El caballo queda en el mismo
   * lugar que si hubieras saltado a la plataforma de ANTES de este vagón —
   * es la misma regla de siempre: donde saltás es donde queda tu salida.
   */
  function subirAlTecho(vagon, grado) {
    if (terminado) return;
    terminado = true;
    saltando = 0.4;
    calidadSalto = grado;
    techoDestino = { x };
    aviso = {
      texto: grado === 'limpio' ? T.ride.saltoLimpio : T.ride.saltoSucio,
      color: grado === 'limpio' ? colors.doorGlow : colors.enemyAlert,
    };
    audio.play(grado === 'limpio' ? 'cover' : 'hitWall');
    scenes.pendiente = vagon.index;
  }

  function fallarSalto(motivo) {
    trastabilla = A.trastabillaTiempo;
    aguante = Math.max(0, aguante - A.trastabillaAguante);
    aviso = {
      texto: motivo === 'lejos' ? T.ride.lejos : T.ride.fallaste,
      color: colors.enemyAlert, life: 1.1,
    };
    audio.play('hitWall');
  }

  function chocar(ob) {
    ob.golpeado = true;
    choque = A.obstaculoFrenado;
    vel = 0;
    aguante = Math.max(0, aguante - A.obstaculoAguante);
    audio.play('hitWall');
    aviso = { texto: T.ride.choque, color: colors.enemyAlert, life: 0.9 };
  }

  // ---------------------------------------------------------------- tormenta

  /**
   * LA TORMENTA EN EL GALOPE — acá no hay techo que valga.
   *
   * Es el único lugar del juego donde estás **a la intemperie de verdad**: a
   * caballo, en el desierto, al lado de un tren. Por eso van los volúmenes de
   * "afuera" multiplicados (`CONFIG.tormenta.galopeMult`) y no los de adentro.
   *
   * Y queda un resto de chapa a propósito: el tren va ahí nomás, con su techo
   * de metal recibiendo la misma lluvia. Es lo que ata el galope al asalto —
   * cuando saltás adentro, el sonido no empieza de cero, se da vuelta.
   */
  function arrancarTormenta() {
    // El viento de ir rápido: está siempre, llueva o no.
    const a = CONFIG.ambiente;
    audio.ambiente('galope', { cutoff: 420, q: 0.6, type: 'lowpass',
      gain: a.galopeVientoGain,
      respira: { profundidad: a.vientoProfundidad, cada: a.vientoCada } });
    cascoTimer = 0;
    velCaballoActual = 0;

    hayTormenta = clima === 'tormenta' || (clima && clima.id === 'tormenta');
    truenoTimer = 0;
    if (!hayTormenta) return;

    const t = CONFIG.tormenta;
    audio.ambiente('agua',   { cutoff: 1400, q: 0.7, type: 'highpass', gain: t.aguaAfuera * t.galopeMult });
    audio.ambiente('viento', { cutoff: 240,  q: 0.6, type: 'lowpass',  gain: t.vientoAfuera * t.galopeMult,
      respira: { profundidad: a.vientoProfundidad, cada: a.vientoCada } });
    audio.ambiente('chapa',  { cutoff: 2900, q: 3.2, type: 'bandpass', gain: t.chapaAfuera * 2 });
    truenoTimer = t.truenoCada * 0.5;
  }

  function updateTormenta(dt) {
    if (!hayTormenta) return;
    const t = CONFIG.tormenta;
    truenoTimer -= dt;
    if (truenoTimer <= 0) {
      truenoTimer = t.truenoCada + rng.range(0, t.truenoVariacion);
      audio.play(rng.chance(t.chanceCerca) ? 'truenoCerca' : 'truenoLejos');
    }
  }

  /**
   * LOS CASCOS, Y SU CADENCIA SIGUE A LA VELOCIDAD.
   *
   * Es lo único que hacía falta acá: el galope ya te dice en pantalla si el
   * caballo está lanzado o aflojando (la barra de aguante), pero **no se oía**,
   * y el ritmo del casco es la forma en que eso se siente sin mirar nada.
   *
   * Parado no suena. Es intencional: el silencio es la otra mitad de la señal.
   */
  function updateCascos(dt) {
    /**
     * 🐛 VA POR `velCaballoActual` Y NO POR `vel`, y la diferencia importa: en
     * esta escena `vel` es la velocidad RELATIVA AL TREN (ver `trenVelocidad`
     * en data/horse.js). Un Mustang que le sigue el paso al tren tiene `vel`
     * cero — y con la primera versión habría sonado a caballo parado justo
     * cuando está corriendo a fondo. `velCaballoActual` es lo que corre el
     * animal sobre el suelo, que es lo único que decide cómo pisa.
     *
     * 🐛 Y antes usaba `caballo.velMax`, que NO EXISTE (el campo es
     * `sprintSpeed`), con un `|| velocidad` de red que lo tapaba: la proporción
     * daba 1 siempre y la cadencia nunca se habría estirado. La trampa de
     * `campo || default` de siempre.
     */
    /**
     * Y VA EN VALOR ABSOLUTO, porque `velCaballo` PUEDE SER NEGATIVA: frenando
     * es `sprintSpeed * troteFactor - brakeSpeed`, que con el Criollo da −14. No
     * es que el animal vaya marcha atrás — es cómo la escena expresa "quedate
     * atrás del tren". Para el oído eso es un trote lento, no un silencio, y
     * sin el `abs` el caballo enmudecía justo cuando aflojabas.
     *
     * El silencio queda sólo para cuando de verdad se para: trastabillar pone
     * `velCaballo` en 0 clavado.
     */
    const velocidad = Math.abs(velCaballoActual || 0);
    if (velocidad < 2) { cascoTimer = 0; return; }
    cascoTimer -= dt;
    if (cascoTimer > 0) return;
    /**
     * A tope, `zancadaCada`; al trote o frenando, el intervalo se estira solo.
     *
     * Lo que se estira es EL SILENCIO ENTRE ZANCADAS, no la zancada misma: las
     * tres pisadas de adentro van siempre igual de juntas, porque eso es el
     * andar del animal y no su velocidad. Un caballo más lento no pisa en
     * cámara lenta — da menos zancadas.
     */
    const proporcion = Math.max(0.25, velocidad / caballo.sprintSpeed);
    cascoTimer = CONFIG.ambiente.zancadaCada / proporcion;
    audio.play('zancada');
  }

  /**
   * La lluvia no se apaga al saltar al tren: el asalto la vuelve a pedir con
   * sus propios volúmenes en el mismo cuadro. Lo que sí se limpia es el caso
   * de volver al mapa o al campamento.
   */
  function exit() {
    audio.quitarAmbiente('agua');
    audio.quitarAmbiente('viento');
    audio.quitarAmbiente('chapa');
    audio.quitarAmbiente('galope');
  }

  function update(dt) {
    scroll += dt;
    invuln = Math.max(0, invuln - dt);
    updateTormenta(dt);
    updateCascos(dt);

    if (terminado) {
      saltando -= dt;
      actualizarBalas(dt);
      if (saltando <= 0) {
        scenes.goTo('raid', {
          caballoEn: scenes.pendiente,
          composicion,
          dificultad: dificultad.id,
          tipoTren: tipoTren.id,
          clima,
          estado,
          comportamientos,
          variantes,
          encubiertos,
          paquetes,
          cajaOculta,
          tiempoGastado: A.cobrarTiempoAlAsalto ? gastado : 0,
          alarmaInicial: visto,
          saltoSucio: calidadSalto === 'sucio',
          vidaInicial: vida,
          enTecho: !!techoDestino,
          techoX: techoDestino ? techoDestino.x : undefined,
        });
      }
      return;
    }

    if (aviso && aviso.life !== undefined) {
      aviso.life -= dt;
      if (aviso.life <= 0) aviso = null;
    }

    /**
     * EL RELOJ DEL ASALTO EMPIEZA A CORRER CUANDO ALCANZASTE EL TREN.
     *
     * `reloj` (el de la aproximación) corre siempre, desde la largada: ése es
     * tu presupuesto para hacer todo esto. Pero `gastado` —lo que después le
     * come al asalto— sólo cuenta desde que llegaste a la cola. Perseguir es
     * gratis; adelantarse, no. Es la misma regla que ya regía el aguante.
     *
     * Una vez alcanzada, queda alcanzada: si te dejás caer atrás de la cola no
     * se te frena el reloj, faltaba más.
     */
    if (!alcanzada && x >= plataformas[1]) alcanzada = true;

    reloj -= dt;
    if (alcanzada) gastado += dt;
    if (reloj <= 0) { subir(plataformaMasAtras(), 'sucio'); return; }

    /**
     * CON LA BARRA ABIERTA, EL CABALLO NO SE MANEJA MÁS.
     *
     * Ya te comprometiste: lo único que queda es clavar el momento. Todo lo
     * demás del mundo sigue corriendo (el reloj, los que te vieron, las balas
     * que ya vienen en camino), así que abrir la barra al lado de un vagón
     * que te está disparando es tan caro como suena.
     */
    if (barra) {
      actualizarBarra(dt);
      actualizarExposicion(dt);
      actualizarTiradores(dt);
      actualizarBalas(dt);
      if (input.wasPressed('Space') || input.wasPressed('KeyE')) cerrarBarra();
      return;
    }

    const acelera = input.anyDown('KeyD', 'ArrowRight');
    const frena = input.anyDown('KeyA', 'ArrowLeft');
    const detrasDeLaCola = x < plataformas[1];

    /**
     * VELOCIDADES ABSOLUTAS: el caballo va a la suya, el tren a la suya, y lo
     * que se ve en pantalla es LA RESTA. Ver `trenVelocidad` en data/horse.js
     * para el porqué (y para el bug que esto arregla: antes el caballo se
     * acercaba solo a 55 px/s y el tren nunca se podía ir).
     *
     * `velCaballo` es a cuánto corre el animal sobre el suelo; `objetivo` es a
     * cuánto se acerca o se aleja del tren. Con el Criollo al trote la resta da
     * −19 (el tren se le va) y con el Mustang da 0 (le sigue el paso): la misma
     * fórmula produce las dos identidades sin un solo caso especial.
     */
    let velCaballo = caballo.sprintSpeed * A.troteFactor;

    if (choque > 0) {
      choque -= dt;
      velCaballo = caballo.sprintSpeed * A.choqueFactor;
    } else if (trastabilla > 0) {
      trastabilla -= dt;
      velCaballo = 0;
    } else if (acelera && aguante > 0) {
      velCaballo = caballo.sprintSpeed;
      if (!detrasDeLaCola) aguante = Math.max(0, aguante - caballo.aguanteGasto * dt);
    } else if (frena) {
      velCaballo = caballo.sprintSpeed * A.troteFactor - caballo.brakeSpeed;
    }

    // Para los cascos: lo que corre el animal SOBRE EL SUELO, que es lo único
    // que decide a qué ritmo pisa. `vel` no sirve — es la resta contra el tren.
    velCaballoActual = velCaballo;

    let objetivo = velCaballo - A.trenVelocidad;
    // Trastabillar sigue siendo un empujón hacia atrás, no sólo frenar.
    if (trastabilla > 0) objetivo -= A.trastabillaEmpuje;

    const paso = caballo.aceleracion * dt;
    vel += Math.max(-paso, Math.min(paso, objetivo - vel));
    x += vel * dt;

    /**
     * EL SUELO DESFILA HACIA ATRÁS a la velocidad del tren.
     *
     * Es la otra mitad de "el tren no se movía": aunque la mecánica ya lo dejara
     * atrás, si los cactus están clavados al mismo marco que los vagones el tren
     * se ve estacionado en el desierto. Con esto el tren cruza el paisaje y la
     * persecución se lee incluso mirando una sola imagen.
     */
    suelo += A.trenVelocidad * dt;
    reciclarObstaculos();

    if (choque <= 0) {
      let dy = 0;
      if (input.anyDown('KeyW', 'ArrowUp')) dy -= 1;
      if (input.anyDown('KeyS', 'ArrowDown')) dy += 1;
      y += dy * A.velVertical * dt;
      actualizarRumbo(dt, dy);
    }
    y = Math.max(train.map.height + A.carrilCerca,
                 Math.min(train.map.height + A.carrilLejos, y));

    const max = largoTren - size * 2;
    if (x > max) { x = max; vel = Math.min(0, vel); }

    /**
     * 🐛 ACÁ ESTABA LA MITAD DEL "EL TREN NO SE MUEVE", Y ES DE LAS BUENAS.
     *
     * Este tope decía "no te podés quedar más atrás de donde arrancaste", y
     * tenía sentido en el modelo viejo: como el caballo se acercaba solo, nadie
     * llegaba acá salvo aflojando las riendas a propósito, y entonces sólo
     * servía para que no te fueras de la pantalla.
     *
     * Con el tren moviéndose de verdad pasó a ser lo contrario: el jugador
     * arranca EXACTAMENTE en este límite, así que el tope le impedía atrasarse
     * un solo píxel. Medido después de poner las velocidades absolutas: el
     * Criollo debía perder 19 px/s y perdía 0 — el tren seguía sin poder irse,
     * ahora por una razón distinta. Un arreglo puede quedar tapado por una regla
     * vieja que nadie volvió a mirar.
     *
     * AHORA SE PUEDE PERDER TERRENO, hasta `atrasMaximo` más atrás. Lo que
     * cierra la escena si te demorás demasiado es el reloj, que ya existía y ya
     * es el precio de todo en este juego — no una pared invisible.
     */
    const minX = plataformas[1] - A.inicioDetras - A.atrasMaximo;
    if (x < minX) { x = minX; vel = Math.max(0, vel); }

    if (choque <= 0) {
      for (const ob of obstaculos) {
        const ox = obX(ob);
        const radio = radioDe(ob);
        // El prefiltro tiene que acompañar al radio: con un número fijo, el
        // obstáculo más grande se descartaba antes de llegar a medirlo.
        if (ob.golpeado || Math.abs(ox - x) > radio + 14) continue;
        if (distance(ox, ob.y, x, y) < radio + 6) { chocar(ob); break; }
      }
    }

    actualizarExposicion(dt);
    actualizarTiradores(dt);
    actualizarBalas(dt);

    const quiereSaltar = input.wasPressed('Space') || input.wasPressed('KeyE');
    if (quiereSaltar && trastabilla <= 0 && choque <= 0) {
      const c = calidadDelSalto();
      if (c.grado === 'limpio' || c.grado === 'sucio') {
        // Sobre un enganche: el salto de siempre, geométrico. Sin barra.
        subir(c.plataforma, c.grado);
      } else {
        // No hay enganche acá. Si estás pegado al cuerpo de un vagón con
        // techo, este Espacio no salta: ABRE LA BARRA. El que salta es el
        // segundo (se maneja arriba, antes de todo este bloque).
        const vagon = vagonConTechoAlLado();
        if (vagon) abrirBarra(vagon);
        else fallarSalto(c.grado);
      }
    }
  }

  // ------------------------------------------------------------------ dibujo

  /**
   * EL ZOOM DE ESTE INSTANTE — lejos 0,5, pegado a la cola 1.
   *
   * Ver `zoomLejos`/`zoomCerca`/`zoomDistancia` en data/horse.js para el porqué.
   * Se calcula con la MISMA variable que ya movía la cámara (`falta`, lo que
   * queda hasta la cola), así que el encuadre entero —posición y escala— cuenta
   * una sola cosa: qué tan cerca estás.
   *
   * `suavizar` es una curva suave (smoothstep) en vez de una recta: sin ella el
   * zoom arranca y frena de golpe, y un cambio de escala con bordes duros se lee
   * como un tirón de cámara. Con ella, la escena se cierra sobre el tren sin que
   * se note dónde empieza el movimiento.
   */
  function zoomActual() {
    const falta = Math.max(0, plataformas[1] - x);
    // Los últimos `zoomFijoDesde` px van a escala 1 clavada: ver el porqué en
    // data/horse.js. Sin esto el zoom sigue corrigiéndose mientras apuntás el salto.
    const rango = Math.max(1, A.zoomDistancia - A.zoomFijoDesde);
    const t = Math.min(1, Math.max(0, (falta - A.zoomFijoDesde) / rango));
    const suavizar = t * t * (3 - 2 * t);
    return A.zoomCerca + (A.zoomLejos - A.zoomCerca) * suavizar;
  }

  function render(r) {
    const z = zoomActual();
    /** Cuánto mundo entra en la pantalla con este zoom. */
    const vistaW = r.width / z;
    const vistaH = r.height / z;

    /**
     * MIENTRAS PERSEGUÍS, LA CÁMARA MIRA PARA ADELANTE.
     *
     * Centrada, con el tren a 1000 px, estarías galopando muchos segundos hacia
     * un borde de pantalla vacío. Corriendo la cámara te para en el tercio
     * izquierdo y ves más de lo que viene, que es donde está la única cosa que
     * te importa. Y se vuelve al centro sola en los últimos 260 px, porque una
     * vez que estás a la par lo que importa vuelve a ser el vagón que tenés al
     * lado.
     *
     * Ahora se mide en unidades de MUNDO (`vistaW`), no de pantalla: con el
     * zoom alejado, media pantalla son 384 px de mundo y no 192.
     */
    const falta = Math.max(0, plataformas[1] - x);
    const mira = Math.min(1, falta / 260);
    // El tope acompaña a `atrasMaximo`: si el jugador puede perder terreno, la
    // cámara tiene que poder seguirlo hasta allá o lo pierde de vista.
    const camX = Math.max(-A.inicioDetras - A.atrasMaximo - 80,
      x - vistaW * (0.5 - 0.22 * mira));

    /**
     * Y AHORA TAMBIÉN SIGUE EN VERTICAL, porque el campo (150 px) ya no entra
     * entero en pantalla cuando el zoom está cerca.
     *
     * El tope de arriba es 0. Con la cámara baja, de 0 a la vía hay cielo,
     * montañas y el tren de costado, así que ese tope deja siempre a la vista
     * el tren entero y un buen pedazo de cielo.
     */
    const campoAbajo = train.map.height + A.carrilLejos;

    /**
     * 🐛 Y SE BAJA TODO EL MUNDO `DESPLAZO_HUD` PÍXELES, o el tren queda tapado.
     *
     * Con el zoom lejano el tren se dibuja en los primeros 64 px de pantalla...
     * que es exactamente donde vive el reloj. Medido: la cola estaba
     * correctamente puesta en x=310, pero no se veía — la HUD la tapaba entera.
     * O sea que "el jugador ve el tren a lo lejos" fallaba por maquetación, no
     * por geometría.
     *
     * Se resta ANTES de usar `camY` (y no en cada `translate`) para que las tres
     * capas que lo consumen —el fondo, la vía y el mundo— se muevan juntas. Va
     * dividido por el zoom porque `camY` está en unidades de mundo: así el
     * desplazamiento son siempre los mismos píxeles EN PANTALLA, esté el zoom
     * donde esté.
     */
    const DESPLAZO_HUD = 20;
    const camY = Math.max(0, Math.min(campoAbajo - vistaH, y - vistaH * 0.62))
      - DESPLAZO_HUD / z;

    dibujarAfuera(r, camX, z, camY, vistaW, vistaH);

    r.ctx.save();
    r.ctx.scale(z, z);
    r.ctx.translate(-camX, -camY);

    // `vistaW`: con el zoom alejado entra MUCHO más mundo del que mide la
    // pantalla, y sin decírselo el tren queda fuera del recorte y no se dibuja.
    dibujarTrenDeCostado(r, train, train.map.height, camX, vistaW, { noche: !gameState.esDeDia });
    dibujarFogonazos(r, camX);
    dibujarMarcaDeSalto(r);
    dibujarMarcaTecho(r);

    /**
     * CON LA CÁMARA BAJA, LO QUE ESTÁ MÁS ABAJO EN PANTALLA TAPA AL CABALLO: un
     * cactus entre vos y la cámara se pinta encima tuyo, y uno entre vos y el
     * tren, detrás. Desde arriba daba igual el orden; de costado es lo que dice
     * quién está adelante.
     */
    const delante = [];
    for (const ob of obstaculos) {
      const ox = obX(ob);
      if (ox < camX - 20 || ox > camX + vistaW + 20) continue;
      if (ob.y > y) delante.push(ob);
      else dibujarObstaculo(r, ob, ox);
    }
    dibujarCaballo(r);
    for (const ob of delante) dibujarObstaculo(r, ob, obX(ob));

    for (const b of balas) {
      /**
       * LA BALA SALE DE LA VENTANILLA. La de verdad —la que te pega— nace en la
       * vía (`dispararDesde`) y eso no se tocó; el dibujo la levanta hasta la
       * altura de la ventanilla y la va bajando según lo que avanzó hacia el
       * caballo, así que llega a la altura del pecho del jinete (8 px sobre
       * `y`) justo cuando pega.
       */
      const desdeY = train.map.height - 2;
      const avance = Math.max(0, Math.min(1, (b.y - desdeY) / Math.max(1, y - desdeY)));
      const alzada = ALTURA_VENTANILLA * (1 - avance) + 8 * avance;
      r.rect(b.x - 1, b.y - 1 - alzada, 3, 2, colors.bulletE);
    }

    r.ctx.restore();

    dibujarPanel(r);
  }

  /**
   * 🔺 LA CÁMARA BAJA — EL PAISAJE. *(Santi: "me gustaría que en la cabalgata
   * la perspectiva esté en un punto que se pueda ver el cielo y las montañas a
   * los lejos")*.
   *
   * Tres planos, y cada uno se mueve a su manera:
   *
   *  1. **El cielo, el sol o la luna y las montañas van en coordenadas de
   *     PANTALLA**, no dentro del zoom. Están lejísimos: alejarse del tren no
   *     los achica, y si entraran en el `scale` la cordillera se encogería a la
   *     mitad cada vez que el zoom se abre. Sólo se apoyan en el horizonte, que
   *     sí sube y baja con la cámara.
   *  2. **El horizonte queda detrás del tren, a media pared** (`HORIZONTE`): la
   *     caja de los vagones tapa el pie de las montañas, y por los enganches se
   *     ve el llano del fondo. Es lo que pone al tren DELANTE del paisaje.
   *  3. **El suelo y la vía van dentro del zoom**, con el resto del mundo.
   *
   * Es todo dibujo: dónde está la vía, cuánto campo hay y a qué distancia se
   * salta no cambió un píxel. El tren sigue apoyado en `train.map.height`, que
   * era el borde de abajo del tren visto desde arriba y ahora es la vía.
   */
  function dibujarAfuera(r, camX, z, camY, vistaW, vistaH) {
    const base = train.map.height;
    const dia = gameState.esDeDia;
    const C = colors.cielo;
    r.clear(dia ? colors.desiertoDia : colors.desiertoNoche);

    // --- 1. El cielo y las montañas, en pantalla ---
    const hy = Math.round((base - HORIZONTE - camY) * z);
    const [arriba, abajo] = hayTormenta ? [C.tormentaArriba, C.tormentaHorizonte]
      : dia ? [colors.puebloCielo, colors.puebloCieloHorizonte]
        : [C.nocheArriba, C.nocheHorizonte];
    if (hy > 0) r.cielo(0, 0, r.width, hy, arriba, abajo, 10);
    if (!hayTormenta && hy > 24) dibujarAstro(r, hy, dia);

    /**
     * Dos cordilleras que se corren con lo que avanzaste SOBRE EL SUELO
     * (`camX + suelo`), no contra el tren. La de atrás casi no se mueve y la de
     * adelante un poco más: esa diferencia es la que el ojo lee como distancia
     * (ver engine/parallax.js). La de atrás va en escalones —mesetas—; la de
     * adelante, redondeada —lomas—, para que no se lean como la misma copiada.
     */
    const avance = camX + suelo;
    const tinte = (hex) => (dia ? hex : escalarColor(hex, 0.32));
    cordillera(r, hy, avance * 0.015, 40, tinte(hayTormenta ? C.montanaTormenta : C.montanaLejos), 1.3, true);
    cordillera(r, hy, avance * 0.05, 16, tinte(C.montanaCerca), 4.1, false);

    // --- 2. El llano del fondo y la vía, dentro del zoom ---
    r.ctx.save();
    r.ctx.scale(z, z);
    r.ctx.translate(-camX, -camY);
    r.rect(camX, base - HORIZONTE, vistaW, HORIZONTE, tinte(C.llanoLejano));
    r.rect(camX, base - HORIZONTE, vistaW, 1, tinte(C.bruma));
    dibujarVia(r, camX, vistaW, base, tinte);
    r.ctx.restore();

    // --- 3. El campo por donde galopás ---
    r.ctx.save();
    r.ctx.scale(z, z);
    r.ctx.translate(0, -camY);
    const P = CONFIG.parallax;
    const campoAbajo = base + A.carrilLejos;

    /**
     * EL BORDE DE ADELANTE DEL CAMPO: matas bajas que pasan rápido, justo afuera
     * de donde se galopa. Con la cámara baja son lo más cercano a la cámara, y
     * marcan el tope sin dibujar ninguna pared.
     *
     * (La otra hilera de esta capa iba arriba de todo, en `y: 4`: desde arriba
     * era el borde lejano del desierto. Con la cámara baja ahí está el cielo, y
     * lo lejano son las montañas.)
     */
    drawParallax(r, P.capas.map((c, i) => ({
      ...c, v: c.v * P.velocidad, y: campoAbajo + 2 + i * 5,
    })), scroll, vistaW);

    // Las rayas de velocidad barren el campo, como antes.
    drawSpeedLines(r, scroll, vistaW, {
      ...P.rayas, velocidad: P.rayas.velocidad * P.velocidad,
      desde: base + A.carrilCerca, hasta: campoAbajo - 4,
    });

    r.ctx.restore();
  }

  /** El sol de día; de noche la luna en cuarto y las estrellas. Van en pantalla. */
  function dibujarAstro(r, hy, dia) {
    const C = colors.cielo;
    const cx = Math.round(r.width * 0.78);
    const cy = Math.round(hy * 0.34);
    const disco = (x, y, radio, color, alpha = 1) => {
      r.ctx.save();
      r.ctx.globalAlpha = alpha;
      r.ctx.fillStyle = color;
      r.ctx.beginPath();
      r.ctx.arc(x, y, radio, 0, Math.PI * 2);
      r.ctx.fill();
      r.ctx.restore();
    };
    if (dia) {
      disco(cx, cy, 17, C.sol, 0.16);
      disco(cx, cy, 8, C.sol);
      return;
    }
    /**
     * Las estrellas quedan clavadas a la pantalla: están a distancia infinita.
     *
     * 🐛 Primero eran `(i * 137) % ancho` y `(i * 71) % alto`, y salieron en
     * DIAGONALES: rayitas de 15 px cruzando el cielo, que parecían estrellas
     * fugaces congeladas. Es el mismo error que ya tuvieron las matas del
     * campamento —dos cuentas que avanzan juntas con `i` marchan en fila— y se
     * arregla igual, con un revoltijo de verdad.
     */
    for (let i = 0; i < 70; i++) {
      r.ctx.globalAlpha = 0.3 + (i % 3) * 0.25;
      r.rect(revolver(i) % r.width, revolver(i + 977) % Math.max(1, hy - 10), 1, 1, C.estrella);
    }
    r.ctx.globalAlpha = 1;
    disco(cx, cy, 6, C.luna);
    disco(cx + 3, cy - 2, 5, C.nocheArriba);
  }

  /**
   * UNA CORDILLERA, apoyada en el horizonte `hy`, en columnas de 2 px. La
   * altura sale de tres ondas superpuestas: nunca se repite a la vista, y es la
   * misma forma cada vez que se dibuja (no titila).
   */
  function cordillera(r, hy, desplazo, altoMax, color, semilla, mesetas) {
    for (let sx = 0; sx < r.width; sx += 2) {
      const u = sx + desplazo;
      let h = 0.5 + 0.28 * Math.sin(u * 0.011 + semilla)
        + 0.16 * Math.sin(u * 0.031 + semilla * 2.3)
        + 0.07 * Math.sin(u * 0.093 + semilla * 5.1);
      h = Math.max(0.08, Math.min(1, h));
      if (mesetas) h = Math.round(h * 5) / 5;
      const alto = Math.round(h * altoMax);
      r.rect(sx, hy - alto, 2, alto, color);
    }
  }

  /**
   * LA VÍA, DE COSTADO: el balasto, el riel y los durmientes pasando.
   *
   * Corre por toda la pantalla y no sólo detrás de la cola: de costado se ve
   * por los enganches y entre las ruedas. Detrás de la cola sigue haciendo lo
   * que hacía desde arriba —decirte por dónde se fue el tren antes de verlo—.
   *
   * LOS DURMIENTES SE MUEVEN, y acá sí se puede. Desde arriba había que usar
   * rayas porque unos durmientes a 18 px por cuadro se veían caminar al revés
   * (el efecto rueda de carreta). De costado van con el SUELO, a 90 px/s: 1,5
   * px por cuadro, lejísimos de ese efecto.
   */
  function dibujarVia(r, camX, vistaW, base, tinte) {
    const C = colors.cielo;
    r.rect(camX, base - 3, vistaW, 7, tinte(C.balasto));
    const paso = 9;
    for (let n = Math.floor((camX + suelo) / paso); n * paso - suelo < camX + vistaW; n++) {
      r.rect(n * paso - suelo, base - 1, 5, 3, tinte(C.durmiente));
    }
    r.rect(camX, base - 3, vistaW, 1, tinte(C.riel));
    r.rect(camX, base - 2, vistaW, 1, tinte(C.rielSombra));
  }

  /** El fogonazo en la ventanilla: es el aviso de que ese vagón va a tirar. */
  function dibujarFogonazos(r, camX) {
    for (const t of tiradores) {
      if (t.fogonazo <= 0) continue;
      const vagon = train.wagons[t.wagon];
      if (!vagon) continue;
      const px = Math.max(vagon.x + 8, Math.min(vagon.x + vagon.width - 8, x));
      const base = train.map.height;
      const parpadeo = Math.floor(scroll * 22) % 2 === 0;
      // A la altura de las ventanillas del costado (world/trenDeCostado.js).
      if (parpadeo) {
        const vy = base - ALTURA_VENTANILLA;
        r.rect(px - 4, vy - 7, 9, 14, '#ffd08a');
        r.text('!', px, vy - 16, colors.enemyAlert);
      }
    }
  }

  /**
   * Los cuatro del desierto. Todos miden lo mismo para el choque
   * (`obstaculoRadio`); lo que cambia es la silueta, para que el campo no se
   * lea como el mismo objeto repetido cien veces.
   *
   * Cada uno lleva su sombra en el suelo antes que nada: es lo que los despega
   * de la arena y lo que hace legible a qué altura del campo está cada cosa
   * cuando el zoom está lejos y todo se ve chiquito.
   */
  function dibujarObstaculo(r, ob, ox) {
    if (ob.golpeado) {
      r.rect(ox - 5, ob.y - 2, 10, 3, '#3a2b20');
      return;
    }

    /**
     * CADA SILUETA CRECIÓ HASTA SU PROPIO RADIO (ver `obstaculoRadios` en
     * data/horse.js). La sombra del piso usa el radio directamente, así que es
     * la pista visual de qué tan grande es la huella de cada cosa — y es lo
     * primero que se lee cuando el zoom está lejos y todo se ve chiquito.
     */
    const radio = radioDe(ob);
    r.ctx.globalAlpha = 0.22;
    r.rect(ox - radio, ob.y + 2, radio * 2, 3, '#000');
    r.ctx.globalAlpha = 1;

    if (ob.tipo === 'roca') {
      // La más grande y la única realmente sólida: 20 px de ancho.
      r.rect(ox - 10, ob.y - 6, 20, 11, '#5a5048');
      r.rect(ox - 10, ob.y - 6, 20, 4, '#6e6359');
      r.rect(ox - 7, ob.y - 8, 9, 3, '#5a5048');
    } else if (ob.tipo === 'arbusto') {
      r.rect(ox - 9, ob.y - 4, 18, 8, '#3d4a2a');
      r.rect(ox - 6, ob.y - 8, 12, 5, '#4d5c34');
      r.rect(ox - 3, ob.y - 10, 6, 3, '#4d5c34');
    } else if (ob.tipo === 'cactus') {
      // La silueta más ALTA del desierto (la que más se distingue de lejos),
      // pero de tronco angosto — por eso su radio no es el mayor.
      r.rect(ox - 3, ob.y - 15, 6, 20, '#3f6b3a');
      r.rect(ox - 3, ob.y - 15, 3, 20, '#4f8247');
      r.rect(ox - 7, ob.y - 9, 4, 3, '#3f6b3a');
      r.rect(ox - 8, ob.y - 13, 3, 5, '#3f6b3a');
      r.rect(ox + 3, ob.y - 5, 4, 3, '#3f6b3a');
      r.rect(ox + 6, ob.y - 10, 3, 6, '#3f6b3a');
    } else {
      /**
       * Montículo de arena: bajo y chato, el más perdonador de los cuatro.
       *
       * 🐛 SUS TONOS ERAN CASI EL DEL SUELO NUEVO (#8a7350 contra #8a6f47) y
       * sobre la arena de día **desaparecía**: quedaba un obstáculo que te
       * frena y no se ve, que es lo único que este juego no se permite.
       *
       * Se arregla con RELIEVE en vez de con un color: una falda en sombra
       * abajo y una cresta iluminada arriba. Así no depende de contrastar
       * contra un fondo en particular — la sombra es más oscura que la arena y
       * más clara que la noche, y la cresta al revés, así que el montículo se
       * lee con las dos paletas sin necesidad de una versión por hora.
       */
      r.rect(ox - 6, ob.y - 1, 12, 4, '#6b5334');
      r.rect(ox - 5, ob.y - 3, 10, 3, '#a68a5c');
      r.rect(ox - 3, ob.y - 5, 6, 3, '#c4a878');
    }
  }

  /**
   * La marca del enganche, y ES LA INTERFAZ DE LA HABILIDAD.
   *
   * Muestra dos cosas distintas: la franja entera donde el salto es válido, y
   * **la zona del medio donde sale limpio**. Sin ver esa zona, clavar el salto
   * sería adivinar, y una habilidad que no se ve no se puede entrenar.
   */
  function dibujarMarcaDeSalto(r) {
    if (terminado) return;
    const p = plataformaBajoElCaballo();
    if (!p) return;

    const px = plataformas[p];
    const base = train.map.height;
    const ancho = (p === 1 ? train.tramos[0].cols : 3) * size / 2 + caballo.saltoTolerancia;
    const cerca = distanciaAlTren() <= caballo.saltoDistancia;

    // La franja válida, apagada.
    r.rect(px - ancho, base + 3, ancho * 2, 1, cerca ? '#6b5a44' : '#3a2f26');
    // Y la zona limpia, encendida.
    const c = cerca ? colors.doorGlow : colors.textDim;
    r.rect(px - caballo.saltoPreciso, base + 2, caballo.saltoPreciso * 2, 3, c);

    /**
     * La flecha va DEBAJO DE LOS CASCOS, no a una altura fija. Desde arriba
     * `base + 15` quedaba libre; de costado el jinete llega hasta ahí y la
     * flecha le quedaba pintada encima del cuerpo.
     */
    if (cerca) {
      const enElCentro = Math.abs(x - px) <= caballo.saltoPreciso;
      const fy = Math.max(base + 15, y + 17);
      if (enElCentro && Math.floor(scroll * 10) % 2 === 0) {
        r.text('▲', px, fy, colors.bagLoot);
      } else if (!enElCentro) {
        r.text('▲', px, fy, colors.textDim);
      }
    }
  }

  /**
   * Cuando no hay enganche al lado pero sí un vagón CON TECHO, avisa que se
   * puede subir por arriba. Al lado del ganado no aparece nada: ese vagón no
   * tiene techo, y que la marca no exista es la forma de decirlo sin texto.
   */
  function dibujarMarcaTecho(r) {
    if (terminado || barra || plataformaBajoElCaballo()) return;
    const vagon = vagonAlLado();
    if (!vagon || !vagon.tieneTecho) return;

    const cerca = distanciaAlTren() <= caballo.saltoDistancia;
    const base = train.map.height;
    r.rect(vagon.x + 4, base + 3, vagon.width - 8, 1, cerca ? colors.doorGlow : '#3a2f26');

    // Debajo de los cascos, por lo mismo que la flecha del enganche.
    if (cerca && Math.floor(scroll * 10) % 2 === 0) {
      r.text('▲ TECHO', x, Math.max(base + 15, y + 17), colors.bagLoot);
    }
  }

  function dibujarCaballo(r) {
    /**
     * El ritmo del trote sale de la velocidad ABSOLUTA del animal, no de `vel`
     * (que ahora es la diferencia contra el tren y puede ser 0 mientras el
     * caballo corre a 90 px/s). Si se leyera de `vel`, el Mustang al trote —que
     * empata con el tren— se dibujaría como si estuviera parado.
     */
    const velAbsoluta = Math.abs(vel + A.trenVelocidad);
    const esfuerzo = Math.min(1, velAbsoluta / caballo.sprintSpeed);
    // La fase del galope: las patas y el sube y baja salen del mismo reloj.
    const paso = scroll * (14 + esfuerzo * 10);
    const trote = Math.sin(paso * 2) * (0.4 + esfuerzo);

    /**
     * EL SALTO, DE COSTADO: el caballo sigue abajo sin jinete, y el jinete sube
     * en arco hasta donde cae — el piso del enganche o el techo del vagón, a la
     * altura que tienen dibujados.
     */
    if (terminado) {
      const t = 1 - saltando / 0.4;
      dibujarAnimal(r, x, y, paso, 0, esfuerzo);
      const desde = y - 6;
      const hasta = train.map.height - (techoDestino ? ALTO_DEL_TECHO : ALTO_DEL_ENGANCHE);
      dibujarJinete(r, x, desde + t * (hasta - desde) - Math.sin(t * Math.PI) * 14);
      return;
    }

    // Parpadea mientras sos invulnerable, igual que en el asalto.
    if (invuln > 0 && Math.floor(invuln * 20) % 2 === 0) return;

    // La sombra NO rota: está en el suelo, y el suelo no se inclina.
    r.ctx.globalAlpha = 0.25;
    r.box(x, y + 7, 10, 2, '#000');
    r.ctx.globalAlpha = 1;

    /**
     * EL CABALLO APUNTA A DONDE VA — pedido de Santi, y es lo que hace que la
     * diagonal se lea como una diagonal y no como "el mismo caballo pero más
     * abajo".
     *
     * Se rota todo el conjunto (animal + jinete + sombrero) alrededor del punto
     * del caballo, así que la cabeza, la crin y el sombrero quedan orientados
     * solos: no hay que dibujar una silueta por ángulo. `rumbo` viene con la
     * inercia de las riendas ya aplicada (ver `actualizarRumbo`), así que el
     * giro que se ve en pantalla ES el retraso del animal, no el de tu tecla.
     */
    // De costado se rota sobre los cascos, no sobre el lomo: el animal se
    // inclina para subir o bajar sin despegarse del suelo.
    r.ctx.save();
    r.ctx.translate(x, y + 6);
    r.ctx.rotate(rumbo);
    r.ctx.translate(-x, -(y + 6));

    dibujarAnimal(r, x, y, paso, trote, esfuerzo);
    dibujarJinete(r, x - 1, y - 6 + trote);

    r.ctx.restore();

    // También por velocidad absoluta: el polvo lo levanta el casco contra el
    // suelo, no la diferencia con el tren. Con `vel` a secas, el Mustang al
    // trote (que empata con el tren, vel = 0) galopaba sin levantar nada.
    const galopando = velAbsoluta > 40;
    if (galopando) {
      for (let i = 0; i < 10; i++) {
        const d = (scroll * 260 + i * 9) % 76;
        const t = 1 - d / 76;
        r.ctx.globalAlpha = t * 0.55;
        r.rect(x - 12 - d, y + 3 - (i % 3) * 3 + Math.sin(d * 0.3) * 2, 3,
          1 + Math.round(t * 2), '#6b5236');
        r.ctx.globalAlpha = 1;
      }
    }

    if (exposicion > 0 && !visto) {
      r.circle(x, y - 4, 12 + exposicion * 8, colors.enemySus, 0.15 + exposicion * 0.3);
      r.rect(x - 10, y - 26, 20, 2, '#241c18');
      r.rect(x - 10, y - 26, 20 * exposicion, 2, colors.enemySus);
    }
    if (visto) r.circle(x, y - 4, 18, colors.enemyAlert, 0.25);
  }

  /**
   * EL CABALLO DE PERFIL, mirando hacia adelante (a la derecha, como el tren).
   * Los cascos quedan en `y + 7`, donde va la sombra; el lomo en `y - 6`.
   *
   * Las patas de allá van más oscuras y se dibujan antes que el cuerpo; las de
   * acá, después. Es lo mismo que hace creíble al caballo de la tienda: dos
   * planos, y el ojo completa el animal entre los dos.
   */
  function dibujarAnimal(r, x, y, paso, trote, esfuerzo) {
    const lomo = y - 6 + trote;
    const pata = (px, fase, color) => {
      const adelante = Math.round(Math.sin(paso + fase) * (0.5 + esfuerzo * 2.5));
      const recoge = Math.round(Math.max(0, -Math.cos(paso + fase)) * 2 * esfuerzo);
      r.rect(px + adelante, lomo + 6, 2, 7 - recoge, color);
    };
    pata(x - 7, 0, colors.horseDark);
    pata(x + 6, Math.PI * 0.5, colors.horseDark);

    r.rect(x - 13, lomo + 1, 3, 2, colors.horseMane);                        // la cola
    r.rect(x - 14, lomo + 2, 2, 4 + Math.round(esfuerzo * 2), colors.horseMane);
    r.rect(x - 10, lomo, 19, 7, colors.horse);                               // el cuerpo
    r.rect(x - 10, lomo + 5, 19, 2, colors.horseDark);
    r.rect(x + 6, lomo - 5, 4, 7, colors.horse);                             // el cuello
    r.rect(x + 8, lomo - 7, 7, 4, colors.horse);                             // la cabeza
    r.rect(x + 14, lomo - 6, 2, 3, colors.horseDark);                        // el hocico
    r.rect(x + 8, lomo - 9, 2, 2, colors.horse);                             // la oreja
    r.rect(x + 5, lomo - 6, 2, 6, colors.horseMane);                         // la crin

    pata(x - 9, Math.PI, colors.horse);
    pata(x + 4, Math.PI * 1.5, colors.horse);
  }

  /** El jinete, sentado con el asiento en `asiento`: bota, cuerpo y sombrero. */
  function dibujarJinete(r, x, asiento) {
    r.rect(x - 1, asiento, 3, 5, colors.horseMane);
    r.rect(x - 3, asiento - 9, 5, 9, colors.player);
    r.rect(x - 5, asiento - 11, 10, 2, colors.playerHat);
    r.rect(x - 3, asiento - 14, 6, 3, colors.playerHat);
  }

  /**
   * LA HUD SE MUDÓ ABAJO, Y POR EL MOTIVO CONTRARIO AL DE LA VEZ PASADA.
   *
   * Esta misma función tenía escrito que las teclas iban ARRIBA porque *"abajo
   * es POR DONDE GALOPÁS"*: con el carril viejo de 38 px pegado al borde
   * inferior, cualquier texto ahí se leía como parte del piso. Era correcto
   * entonces.
   *
   * 🐛 CON EL DESIERTO NUEVO SE DIO VUELTA, y esto tapaba justo lo que la
   * vuelta venía a mostrar: **arriba es donde está el tren**, o sea la única
   * cosa que necesitás ver mientras te acercás. Medido: con el zoom lejano la
   * cola se dibujaba correctamente en x=310 y NO SE VEÍA — los 90 px de panel
   * la tapaban entera. "El jugador ve el tren a lo lejos" fallaba por
   * maquetación, no por geometría.
   *
   * Arriba queda SÓLO EL RELOJ, que es el dato que hay que poder mirar sin
   * dejar de mirar el tren. Todo lo demás baja al borde de abajo, que ahora es
   * fondo lejano y no el piso por el que galopás.
   */
  function dibujarPanel(r) {
    const centro = r.width / 2;
    const base = r.height;

    const urgente = reloj <= 6;
    r.text(T.ride.reloj(Math.max(0, Math.ceil(reloj))), centro, 9,
      urgente ? colors.enemyAlert : colors.textDim);

    /**
     * EL AGUANTE VA ARRIBA A LA IZQUIERDA, y esa esquina se eligió mirando la
     * escena, no por gusto. Con el zoom lejano la pantalla se reparte así:
     *
     *   y 0-20    libre
     *   y 20-84   el tren (y sólo de x≈310 para la derecha)
     *   y 87-216  el desierto, o sea por donde galopás
     *
     * O sea que la ÚNICA zona que no tapa ni al tren ni al caballo es la franja
     * de arriba, y dentro de ella la mitad izquierda —porque el tren aparece
     * por la derecha—. Cualquier cosa anclada abajo se le monta encima al
     * caballo, que es lo que pasaba con la versión anterior.
     */
    const ancho = 60;
    const bx = 6;
    const yBarra = 6;
    r.rect(bx, yBarra, ancho, 5, '#241c18');
    r.rect(bx, yBarra, ancho * (aguante / caballo.aguanteMax), 5,
      aguante > 25 ? colors.doorGlow : colors.enemyAlert);
    r.text(caballo.short, bx + ancho + 5, yBarra + 4, colors.textDim, 'left');

    // Vida: sólo aparece si te dieron. Si nunca te tocaron, no hay por qué
    // ocupar pantalla recordándote que estás sano.
    if (vida < CONFIG.player.health) {
      let s = '';
      for (let i = 0; i < CONFIG.player.health; i++) s += i < vida ? '●' : '○';
      r.text(s, bx, yBarra + 15, colors.enemyAlert, 'left');
    }

    // Lo del tren se lee una vez y no vuelve a mirarse: al borde de abajo, que
    // es fondo lejano y queda por detrás del caballo, no encima.
    r.text(`${tipoTren.short} · ${T.boarding.escort} ${dificultad.short}`,
      centro, base - 7, dificultad.color);

    if (barra) dibujarBarra(r, centro);
    else if (aviso) r.text(aviso.texto, centro, 22, aviso.color);
    else if (visto) r.text(T.ride.alarmaAviso, centro, 22, colors.enemyAlert);

    /**
     * Las teclas duran lo que dura la persecución en vez de un tiempo fijo: el
     * cartel se va solo cuando alcanzás la cola, que es exactamente cuando
     * dejás de necesitarlo y empezás a necesitar la pantalla. Van arriba y al
     * centro porque justo mientras se muestran el tren todavía está chiquito y
     * arrinconado a la derecha: cuando el tren crece y ocupa esa franja, este
     * cartel ya se fue.
     */
    if ((!alcanzada || scroll < 7) && !terminado && !barra) {
      r.text(T.ride.keys, centro, 36, colors.bagLoot);
      r.text(T.ride.help, centro, 47, colors.textDim);
    }
  }

  /**
   * LA BARRA DEL SALTO AL TECHO.
   *
   * Rojo en las dos puntas, amarillo, y verde en el medio. Que el verde esté
   * al centro y no en una punta importa: pasarse y quedarse corto tienen que
   * costar lo mismo, si no la barra se juega esperando el borde.
   *
   * Va grande y en el medio de la pantalla a propósito. Es el único momento
   * del juego que se detiene a pedirte una sola cosa.
   */
  function dibujarBarra(r, centro) {
    const ancho = 140;
    const alto = 9;
    const bx = centro - ancho / 2;
    const by = 150;
    const { verde, amarillo } = zonasDeLaBarra();

    r.text(T.ride.barraAyuda, centro, by - 14, colors.text);

    // Rojo de fondo (las dos puntas), y encima las zonas buenas.
    r.rect(bx, by, ancho, alto, '#7a2f26');
    r.rect(bx + ancho * (0.5 - amarillo), by, ancho * amarillo * 2, alto, '#b08a34');
    r.rect(bx + ancho * (0.5 - verde), by, ancho * verde * 2, alto, colors.doorGlow);

    // El puntero.
    const px = bx + ancho * barra.t;
    r.rect(px - 1, by - 4, 3, alto + 8, colors.text);
  }

  return { enter, exit, update, render };
}

/**
 * Un entero revuelto a partir de otro, siempre el mismo para el mismo número:
 * para sembrar cosas quietas sin que salgan en fila. Es el de las matas del
 * campamento (ver `revolver` en scenes/campScene.js).
 */
function revolver(n) {
  let t = (n * 374761393 + 668265263) | 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177);
  return (t ^ (t >>> 16)) >>> 0;
}
