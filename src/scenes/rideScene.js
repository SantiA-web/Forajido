/**
 * LA APROXIMACIÓN A CABALLO — fase 2, pasos C y D.
 *
 * El asalto no empieza con un menú ni adentro del vagón: empieza detrás del
 * tren, galopando para alcanzarlo, con la locomotora allá adelante.
 *
 * POR QUÉ ESTÁ VISTA DESDE ARRIBA, igual que el asalto:
 *
 *  - Es la misma cámara, así que saltar al tren deja de ser un corte de escena
 *    y pasa a ser la continuación de lo que venías mirando.
 *  - Se dibuja EL TREN DE VERDAD (`drawTrain`, el mismo del asalto) y no una
 *    silueta inventada: ves los vagones que vas a robar, con sus ventanillas.
 *  - La ley ya galopa así. Que el jugador galopara distinto era una
 *    incoherencia que se pagaba dos veces, en arte y en código.
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
import { gameState } from '../state/gameState.js';
import { T } from '../text/es.js';
import { sortearComposicion, buildTrain, drawTrain, plataformasDe } from '../world/train.js';
import { distance } from '../engine/collision.js';
import { drawParallax, drawSpeedLines } from '../engine/parallax.js';

export function createRideScene(services) {
  const { renderer, input, rng, scenes, hud, audio } = services;
  const colors = CONFIG.colors;
  const size = CONFIG.tileSize;

  let caballo;
  let composicion, dificultad, tipoTren, train, plataformas, largoTren;
  let x, y, vel, aguante, reloj, gastado, scroll, alcanzada;
  let trastabilla, choque, saltando, terminado;
  let exposicion, visto, obstaculos, aviso;
  let vida, invuln, tiradores, balas;
  let calidadSalto, techoDestino, barra;

  /**
   * @param params lo que eligió el MAPA DE RUTAS (`scenes/mapScene.js`):
   *   `tipoTren`, `composicion` y `dificultad`, sorteados ahí mismo al pasar
   *   el cursor sobre la vía. Si faltan (por ejemplo, saltando el mapa desde
   *   la consola), el galope sortea como siempre.
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

    train = buildTrain(rng, 1, composicion, dificultad.id, undefined, tipoTren.id);
    plataformas = plataformasDe(train.tramos, size);
    largoTren = train.map.width;

    x = plataformas[1] - A.inicioDetras;
    /**
     * Arrancás en el MEDIO del carril, no pegado al borde de afuera.
     *
     * Estaba en `carrilLejos`, o sea a ras del borde de abajo de la pantalla,
     * con medio caballo cortado. Con 240 px de persecución duraba dos segundos
     * y no se notaba; con 620 te pasás siete segundos mirándolo. Y da igual
     * para el sigilo: detrás de la cola no hay ningún vagón del que esconderse,
     * y sobra tiempo para abrirse antes de llegar.
     */
    y = train.map.height + (A.carrilCerca + A.carrilLejos) / 2;
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

    vida = CONFIG.player.health;
    invuln = 0;
    tiradores = [];
    balas = [];
    obstaculos = sembrarObstaculos();

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
    };
  }

  function sembrarObstaculos() {
    const lista = [];
    for (let px = x - 100; px < largoTren + 200; px += A.obstaculoCada) {
      lista.push({
        x: px + rng.range(-40, 40),
        y: train.map.height + rng.range(A.carrilCerca + 4, A.carrilLejos),
        tipo: rng.range(0, 1) > 0.5 ? 'roca' : 'arbusto',
        golpeado: false,
      });
    }
    return lista;
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
    const ritmo = vagon.id === 'ganado' ? A.verRateGanado : A.verRate;
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

  function update(dt) {
    scroll += dt;
    invuln = Math.max(0, invuln - dt);

    if (terminado) {
      saltando -= dt;
      actualizarBalas(dt);
      if (saltando <= 0) {
        scenes.goTo('raid', {
          caballoEn: scenes.pendiente,
          composicion,
          dificultad: dificultad.id,
          tipoTren: tipoTren.id,
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

    let objetivo = detrasDeLaCola ? A.alcanceSpeed : 0;

    if (choque > 0) {
      choque -= dt;
      objetivo = 0;
    } else if (trastabilla > 0) {
      trastabilla -= dt;
      objetivo = -A.trastabillaEmpuje;
    } else if (acelera && aguante > 0) {
      objetivo = caballo.sprintSpeed;
      if (!detrasDeLaCola) aguante = Math.max(0, aguante - caballo.aguanteGasto * dt);
    } else if (frena) {
      objetivo = -caballo.brakeSpeed;
    }

    const paso = caballo.aceleracion * dt;
    vel += Math.max(-paso, Math.min(paso, objetivo - vel));
    x += vel * dt;

    if (choque <= 0) {
      let dy = 0;
      if (input.anyDown('KeyW', 'ArrowUp')) dy -= 1;
      if (input.anyDown('KeyS', 'ArrowDown')) dy += 1;
      y += dy * A.velVertical * dt;
    }
    y = Math.max(train.map.height + A.carrilCerca,
                 Math.min(train.map.height + A.carrilLejos, y));

    const max = largoTren - size * 2;
    if (x > max) { x = max; vel = Math.min(0, vel); }

    /**
     * Y NO SE PUEDE QUEDAR MÁS ATRÁS DE DONDE ARRANCASTE.
     *
     * Aflojando las riendas se podía retroceder hasta salirse de la pantalla
     * (la cámara tiene tope), y quedabas manejando a ciegas un caballo que no
     * se ve. Antes hacía falta insistir mucho para llegar ahí; con la
     * persecución larga está a mano. Nunca sirvió para nada: atrás no hay nada
     * que buscar.
     */
    const minX = plataformas[1] - A.inicioDetras;
    if (x < minX) { x = minX; vel = Math.max(0, vel); }

    if (choque <= 0) {
      for (const ob of obstaculos) {
        if (ob.golpeado || Math.abs(ob.x - x) > 20) continue;
        if (distance(ob.x, ob.y, x, y) < A.obstaculoRadio + 6) { chocar(ob); break; }
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

  function render(r) {
    /**
     * MIENTRAS PERSEGUÍS, LA CÁMARA MIRA PARA ADELANTE.
     *
     * Centrada, con el tren a 620 px, estarías galopando seis segundos hacia
     * un borde de pantalla vacío. Corriendo la cámara te para en el tercio
     * izquierdo y ves 100 px más de lo que viene, que es donde está la única
     * cosa que te importa. Y se vuelve al centro sola en los últimos 260 px,
     * porque una vez que estás a la par lo que importa vuelve a ser el vagón
     * que tenés al lado.
     */
    const falta = Math.max(0, plataformas[1] - x);
    const mira = Math.min(1, falta / 260);
    const camX = Math.max(-A.inicioDetras - 80, x - r.width * (0.5 - 0.22 * mira));

    dibujarAfuera(r, camX);

    r.ctx.save();
    r.ctx.translate(-camX, 0);

    drawTrain(r, train, colors, camX, 0);
    dibujarFogonazos(r, camX);

    for (const ob of obstaculos) {
      if (ob.x < camX - 20 || ob.x > camX + r.width + 20) continue;
      dibujarObstaculo(r, ob);
    }

    dibujarMarcaDeSalto(r);
    dibujarMarcaTecho(r);
    dibujarCaballo(r);

    for (const b of balas) {
      r.rect(b.x - 1, b.y - 1, 3, 2, colors.bulletE);
    }

    r.ctx.restore();

    dibujarPanel(r);
  }

  function dibujarAfuera(r, camX) {
    r.clear(colors.outside);
    const base = train.map.height;
    const P = CONFIG.parallax;

    drawParallax(r, P.capas.map((c, i) => ({
      ...c, v: c.v * P.velocidad, y: 4 + i * 5,
    })), scroll, r.width);

    drawParallax(r, P.capas.map((c, i) => ({
      ...c, v: c.v * P.velocidad, y: base + 52 + i * 6,
    })), scroll, r.width);

    drawSpeedLines(r, scroll, r.width, {
      ...P.rayas, velocidad: P.rayas.velocidad * P.velocidad,
      desde: base + 50, hasta: r.height - 2,
    });
    drawSpeedLines(r, scroll * 1.3, r.width, {
      ...P.rayas, cantidad: 4, velocidad: P.rayas.velocidad * P.velocidad,
      desde: 2, hasta: 30,
    });

    dibujarVia(r, camX);
  }

  /**
   * LA VÍA, DETRÁS DE LA COLA — y no es decorado, es lo que hace jugable la
   * persecución.
   *
   * Hasta esta vuelta, todo lo que estaba detrás del tren era **negro**. Con
   * 240 px de ventaja daba igual porque duraba dos segundos; con 620 serían
   * seis segundos galopando contra un vacío, sin saber siquiera si vas para el
   * lado correcto. Ahora hay balasto, dos rieles y las piedras volando: la vía
   * te dice por dónde se fue el tren mucho antes de que el tren se vea.
   *
   * Se dibuja SÓLO detrás de la cola (el tren empieza en x = 0). Debajo del
   * tren no hace falta —lo tapa él— y en los enganches se sigue viendo el
   * paisaje de fondo, que es como quedó jugado y confirmado.
   *
   * LAS PIEDRAS SON RAYAS, NO PIEDRAS. Un patrón regular yendo a esta
   * velocidad late para atrás (el efecto rueda de carreta): a 60 cuadros por
   * segundo, unos durmientes cada 30 px avanzando 18 px por cuadro se ven
   * caminando al revés. Las rayas de velocidad no tienen ese problema porque
   * cada una lleva su propio carril y su propia velocidad, así que el ojo no
   * se engancha con ninguna: lee borrón, que es lo que de verdad se ve desde
   * un caballo al galope.
   */
  function dibujarVia(r, camX) {
    const ancho = Math.min(r.width, Math.round(-camX));
    if (ancho <= 0) return;

    const cy = train.map.height / 2;   // el eje del tren: siempre a la mitad

    // El balasto, con sus dos bordes marcados.
    r.rect(0, cy - 55, ancho, 110, '#221c17');
    r.rect(0, cy - 55, ancho, 2, '#171210');
    r.rect(0, cy + 53, ancho, 2, '#171210');

    r.ctx.save();
    r.ctx.beginPath();
    r.ctx.rect(0, cy - 53, ancho, 106);
    r.ctx.clip();
    drawSpeedLines(r, scroll, ancho, {
      cantidad: 26, velocidad: 1700, largo: 13, color: '#4a3d31', alpha: 0.5,
      desde: cy - 52, hasta: cy + 52, semilla: 2.3,
    });
    drawSpeedLines(r, scroll * 1.17, ancho, {
      cantidad: 16, velocidad: 2400, largo: 24, color: '#5f4d3b', alpha: 0.38,
      desde: cy - 48, hasta: cy + 48, semilla: 3.1,
    });
    r.ctx.restore();

    // Los dos rieles. Van continuos a propósito: son la única cosa quieta de
    // toda la pantalla, y por eso son los que se leen como una dirección.
    for (const ry of [cy - 33, cy + 30]) {
      r.rect(0, ry, ancho, 3, '#4f463d');
      r.rect(0, ry, ancho, 1, '#6e6357');
    }
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
      if (parpadeo) {
        r.rect(px - 3, base - 6, 6, 5, '#ffd08a');
        r.text('!', px, base - 12, colors.enemyAlert);
      }
    }
  }

  function dibujarObstaculo(r, ob) {
    if (ob.golpeado) {
      r.rect(ob.x - 5, ob.y - 2, 10, 3, '#3a2b20');
      return;
    }
    if (ob.tipo === 'roca') {
      r.rect(ob.x - 6, ob.y - 4, 12, 8, '#5a5048');
      r.rect(ob.x - 6, ob.y - 4, 12, 3, '#6e6359');
    } else {
      r.rect(ob.x - 6, ob.y - 3, 12, 6, '#3d4a2a');
      r.rect(ob.x - 4, ob.y - 6, 8, 4, '#4d5c34');
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

    if (cerca) {
      const enElCentro = Math.abs(x - px) <= caballo.saltoPreciso;
      if (enElCentro && Math.floor(scroll * 10) % 2 === 0) {
        r.text('▲', px, base + 15, colors.bagLoot);
      } else if (!enElCentro) {
        r.text('▲', px, base + 15, colors.textDim);
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

    if (cerca && Math.floor(scroll * 10) % 2 === 0) {
      r.text('▲ TECHO', x, base + 15, colors.bagLoot);
    }
  }

  function dibujarCaballo(r) {
    const esfuerzo = Math.min(1, Math.abs(vel) / caballo.sprintSpeed);
    const trote = Math.sin(scroll * (18 + esfuerzo * 12)) * (0.6 + esfuerzo * 1.8);

    if (terminado) {
      const t = 1 - saltando / 0.4;
      const sy = y - t * (y - (train.map.height - 20));
      r.box(x, sy, 5, 5, colors.player);
      r.rect(x - 6, sy - 7, 13, 3, colors.playerHat);
      return;
    }

    // Parpadea mientras sos invulnerable, igual que en el asalto.
    if (invuln > 0 && Math.floor(invuln * 20) % 2 === 0) return;

    r.ctx.globalAlpha = 0.25;
    r.box(x, y + 7, 7, 3, '#000');
    r.ctx.globalAlpha = 1;

    r.rect(x - 11, y - 5 + trote, 22, 10, colors.horse);
    r.rect(x - 11, y - 5 + trote, 22, 3, colors.horseDark);
    r.rect(x + 9, y - 3 + trote, 6, 6, colors.horse);
    r.rect(x - 13, y - 3 + trote, 4, 6, colors.horseMane);

    r.box(x - 1, y + trote, 5, 5, colors.player);
    r.rect(x - 7, y - 6 + trote, 13, 3, colors.playerHat);

    const galopando = vel > 25 || (x < plataformas[1] && Math.abs(vel) > 10);
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
      r.circle(x, y, 10 + exposicion * 8, colors.enemySus, 0.15 + exposicion * 0.3);
      r.rect(x - 10, y - 14, 20, 2, '#241c18');
      r.rect(x - 10, y - 14, 20 * exposicion, 2, colors.enemySus);
    }
    if (visto) r.circle(x, y, 16, colors.enemyAlert, 0.25);
  }

  function dibujarPanel(r) {
    const centro = r.width / 2;

    r.text(T.ride.title, centro, 10, colors.text);

    const urgente = reloj <= 6;
    r.text(T.ride.reloj(Math.max(0, Math.ceil(reloj))), centro, 22,
      urgente ? colors.enemyAlert : colors.textDim);

    // Vida: sólo aparece si te dieron. Si nunca te tocaron, no hay por qué
    // ocupar pantalla recordándote que estás sano.
    if (vida < CONFIG.player.health) {
      let s = '';
      for (let i = 0; i < CONFIG.player.health; i++) s += i < vida ? '●' : '○';
      r.text(s, centro, 34, colors.enemyAlert);
    }

    const ancho = 88;
    const bx = centro - ancho / 2;
    const yBarra = vida < CONFIG.player.health ? 44 : 34;
    r.rect(bx, yBarra, ancho, 5, '#241c18');
    r.rect(bx, yBarra, ancho * (aguante / caballo.aguanteMax), 5,
      aguante > 25 ? colors.doorGlow : colors.enemyAlert);
    r.text(caballo.short, bx - 6, yBarra + 4, colors.textDim, 'right');

    r.text(`${tipoTren.short} · ${T.boarding.escort} ${dificultad.short}`,
      centro, yBarra + 16, dificultad.color);

    if (barra) dibujarBarra(r, centro);
    else if (aviso) r.text(aviso.texto, centro, yBarra + 30, aviso.color);
    else if (visto) r.text(T.ride.alarmaAviso, centro, yBarra + 30, colors.enemyAlert);

    /**
     * LAS TECLAS VAN ARRIBA, NO ABAJO, y no es un capricho de maquetación:
     * abajo es POR DONDE GALOPÁS. Estaban en y=190 y 202, o sea justo encima
     * del carril del caballo, y se leían como parte del piso. Con la
     * persecución de dos segundos casi no se veía; ahora se ve todo el rato.
     *
     * Y duran lo que dura la persecución en vez de siete segundos fijos: el
     * cartel se va solo cuando alcanzás la cola, que es exactamente cuando
     * dejás de necesitarlo y empezás a necesitar la pantalla.
     */
    if ((!alcanzada || scroll < 7) && !terminado && !barra) {
      r.text(T.ride.help, centro, yBarra + 44, colors.textDim);
      r.text(T.ride.keys, centro, yBarra + 56, colors.bagLoot);
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

  return { enter, update, render };
}
