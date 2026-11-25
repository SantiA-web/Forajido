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
 * 2. 🔁 🚂 **Los trenes tienen día y parte del día** (systems/horario.js) *(Santi: "esta decisión del mapa con trenes
 *    que cambian constantemente [...] es hora de cambiarla")*. Antes daban vueltas por las vías en segundos de
 *    verdad y cambiaban de tipo en la terminal; con el juego medido en días, no se podían planear. Ahora el cartucho
 *    es el horario, y el tren que señalás se dibuja quieto donde lo esperarías.
 *
 * 3. **El cartucho de abajo es el único texto.** Todo lo demás son símbolos.
 *    Un mapa lleno de etiquetas explicándose es un menú con dibujitos.
 *
 * (🔁 Lo de "el mapa sigue corriendo aunque no lo mires" ya no hace falta: el horario vive en `gameState.horario` y
 * se pone al día con el calendario.)
 */

import { CONFIG } from '../data/config.js';
import { REGION } from '../data/region.js';
// 🚂 Los trenes ya no los arma el mapa: vienen del horario.
import { completarHorario, conocidos, viajeDe, faltaPara, llegas, sacarDelHorario, dondeLoEsperas, esperarEnVia, ahora } from '../systems/horario.js';
import { etiquetaDelTren } from '../systems/historia.js';
import { TH } from '../text/historia.js';
import { fechaDe } from '../systems/tiempo.js';
import { encargoAbierto, tieneMaletin } from '../data/momentos.js';
import { T } from '../text/es.js';
import { gameState } from '../state/gameState.js';
import { pasar } from '../systems/tiempo.js';
import { guisoParaElGolpe } from '../systems/tareas.js';
import { TIEMPO } from '../data/tiempo.js';
import { RUMORES } from '../data/tareas.js';
import { estiloNuevo } from '../engine/estiloNuevo.js';
import { DENSIDAD } from '../engine/renderer.js';
import * as mapaViejo from '../world/estiloNuevo/mapaViejo.js';
import { BANDA, MIEMBRO, PAPELES, puedeIr, darPapel, quienHace, completarBanda, pronostico, ESCALERA } from '../data/banda.js';
import { disposicionPara } from '../systems/animoEnJuego.js';
import { conEnemigoEnElPlan } from '../systems/fogata.js';
import { traicionesAlSalir } from '../systems/tentacion.js';

/** 🚂 Cuántos trenes del horario entran en el cartucho a la vez. */
const RENGLONES = 4;

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
  /**
   * 🚂 EL HORARIO EN EL CARTUCHO: desde qué tren se muestra (se corre con la rueda o [W]/[S]), el tren del renglón
   * bajo el cursor, y dónde quedaron los renglones la última vez que se dibujaron (para saber dónde hacés clic).
   */
  let desde = 0;
  let trenEncima = null;
  let renglones = [];
  /**
   * 🗞️ ESPERAR EN UNA VÍA *(Santi eligió "Esperar en una vía")*: la vía en la que ya hiciste un clic. Hace falta el
   * segundo para salir, porque si no pasa nada se pierde el día entero.
   */
  let viaElegida = null;
  let origenNuevo = { x: 0, y: 0 };
  /** 🎭 El renglón de "El plan" que tenés bajo el cursor ('caballos', 'pasajero' o null). Ver `dibujarPlan`. */
  let planEncima = null;
  /** Dónde quedó el recuadro del plan la última vez que se dibujó (relativo al papel), para saber dónde hacés clic. */
  let planCaja = null;
  // 🔁 Sobre el papel gastado, la tinta suave y los colores de dificultad quedaban lavados *(Santi: "muy poco legible")*.
  // (De noche, más oscuras todavía: lejos del farol el papel se apaga y hay que seguir leyendo.)
  let TINTA_SUAVE_NUEVA = '#5f4730';
  const selloActual = () => (estiloNuevo.activo && !gameState.esDeDia ? '#5a1410' : colors.mapaSello);
  const tintaFuerte = () => (estiloNuevo.activo && !gameState.esDeDia ? '#26180f' : colors.mapaTinta);
  const oscurecido = (hex) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (gameState.esDeDia ? 0.62 : 0.36)).toString(16).padStart(2, '0')).join('');

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

      return ruta;
    });
  }

  function enter() {
    hud.hide();
    encima = null;
    planEncima = null;
    gameState.banda = completarBanda(gameState.banda);

    /**
     * Lo más callado del juego, y tiene que serlo: el mapa no es un lugar, es
     * un papel que estás mirando en tu campamento. Va el mismo viento de allá,
     * más bajo todavía — lo justo para que abrir el cartel no corte el mundo.
     */
    audio.ambiente('desierto', { cutoff: 300, q: 0.6, type: 'lowpass',
      gain: CONFIG.ambiente.mapaGain,
      respira: {
        profundidad: CONFIG.ambiente.vientoProfundidad,
        cada: CONFIG.ambiente.vientoCada,
      } });

    if (!rutas) {
      prepararRutas();

      // Las manchas del papel se sortean UNA vez y quedan fijas: si cambiaran
      // cada cuadro parecerían ruido de televisión, no un papel sucio.
      // Guardadas como FRACCIÓN del papel y no en píxeles: el papel mide lo que
      // mida la pantalla (ver `dibujarPapel`), y cambia si cambia la ventana.
      manchas = [];
      for (let i = 0; i < 26; i++) {
        manchas.push({
          fx: ((i * 97) % 380) / 380,
          fy: ((i * 61) % 200) / 200,
          r: 3 + ((i * 7) % 9),
          a: 0.05 + ((i % 4) * 0.02),
        });
      }
    }

    // 🚂 El horario, al día (systems/horario.js).
    completarHorario(gameState);
    desde = 0;
    viaElegida = null;

    // Para depurar desde la consola: FORAJIDO.services.mapa
    services.mapa = {
      get encima() { return encima ? encima.id : null; },
      get rutas() { return rutas; },
      /** 🚂 Los trenes que vienen, en una línea legible cada uno. */
      get trenes() {
        return completarHorario(gameState).map((t) => `#${t.id} día ${t.dia} ${TIEMPO.partes[t.parte]} ${t.ruta} ${t.tipoTren.id} sabes=${t.sabes}${t.falso ? ' FALSO' : ''} viaje=${viajeDe(t.ruta)} falta=${faltaPara(gameState, t)}`);
      },
      /** Salir a un tren del horario por su número, sin el mouse. */
      salir: (id) => { const t = completarHorario(gameState).find((x) => x.id === id); if (t) salir(t); return !!t; },
      /** 🗞️ Ir a esperar a una vía (y un día), sin el mouse. */
      esperar: (rutaId, dia = null) => esperar(rutaId, dia),
    };
  }

  /** 🚂 El tren que se dibuja en el mapa: el del renglón señalado, o el próximo de la vía señalada. */
  function trenMarcado() {
    if (trenEncima) return trenEncima;
    if (!encima) return null;
    return conocidos(gameState).find((t) => t.ruta === encima.id && llegas(gameState, t)) || null;
  }

  /** 🚂 La fracción del recorrido de un punto de la vía (`{ i, f }`: tramo y fracción del tramo). */
  function tDe(ruta, p) {
    let hasta = 0;
    for (let k = 0; k < p.i; k++) hasta += ruta.largos[k];
    return ruta.total ? (hasta + ruta.largos[p.i] * p.f) / ruta.total : 0;
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
    if (negativa) negativa.t -= dt;
    const anterior = encima;
    // La red va centrada en la pantalla (ver `render`): el cursor se lleva a
    // las mismas coordenadas antes de buscar la vía.
    const c = estiloNuevo.activo ? origenNuevo : services.renderer.centro;
    encima = rutaBajoElCursor(input.mouse.x - c.x, input.mouse.y - c.y);

    /**
     * 🚂 EL HORARIO: el renglón bajo el cursor resalta su vía en el mapa; con el cursor sobre una vía, la lista se corre
     * hasta su próximo tren. La rueda (o [W]/[S]) la corre a mano.
     */
    const trenes = conocidos(gameState);
    const trenAntes = trenEncima;
    trenEncima = null;
    for (const f of renglones) if (input.mouse.x >= f.x && input.mouse.x <= f.x + f.w && input.mouse.y >= f.y - 7 && input.mouse.y < f.y + 2) trenEncima = f.tren;
    if (trenEncima) encima = rutas.find((r) => r.id === trenEncima.ruta) || null;
    else if (encima && encima !== anterior) {
      const i = trenes.findIndex((t) => t.ruta === encima.id);
      if (i >= 0 && (i < desde || i >= desde + RENGLONES)) desde = i;
    }
    const corre = (input.mouse.wheel > 0 || input.wasPressed('KeyS') ? 1 : 0) - (input.mouse.wheel < 0 || input.wasPressed('KeyW') ? 1 : 0);
    desde = Math.max(0, Math.min(Math.max(0, trenes.length - RENGLONES), desde + corre));
    if ((encima && encima !== anterior) || (trenEncima && trenEncima !== trenAntes)) audio.play('cover');

    /**
     * 🎭 EL PLAN: el renglón bajo el cursor, y el clic (o [1] [2]) que cambia quién lo hace. Sólo en el estilo nuevo,
     * que es el que lo dibuja. (Si el cursor está sobre el plan, no está sobre ninguna vía.)
     */
    const planAntes = planEncima;
    planEncima = null;
    if (estiloNuevo.activo && planCaja) {
      const mx = input.mouse.x - c.x, my = input.mouse.y - c.y, P = planCaja;
      if (mx >= P.x && mx <= P.x + P.w) PAPELES.forEach((p, i) => { if (my >= P.filas[i] - 5 && my < P.filas[i] + 12) planEncima = p; });
    }
    if (planEncima) encima = null;
    if (planEncima && planEncima !== planAntes) audio.play('cover');
    if (input.mouse.pressed && planEncima) cambiarPapel(planEncima);
    if (estiloNuevo.activo && input.wasPressed('Digit1')) cambiarPapel('caballos');
    if (estiloNuevo.activo && input.wasPressed('Digit2')) cambiarPapel('pasajero');
    // 📡 🔭 Los dos papeles nuevos (BANDA-NUEVA.md, etapa 1).
    if (estiloNuevo.activo && input.wasPressed('Digit3')) cambiarPapel('telegrafo');
    if (estiloNuevo.activo && input.wasPressed('Digit4')) cambiarPapel('vigia');

    // 🚂 Clic en un tren del horario: salís a esperarlo a su vía (si llegás). 🗞️ De un rumor no sabés la parte del
    // día: vas a esperar a su vía todo ese día.
    if (input.mouse.pressed && !planEncima && trenEncima) {
      if (!llegas(gameState, trenEncima)) audio.play('cover');
      else if (trenEncima.sabes === 'rumor') esperar(trenEncima.ruta, trenEncima.dia);
      else salir(trenEncima);
    } else if (input.mouse.pressed && !planEncima && encima) {
      // 🗞️ Clic en una vía: el primero la elige, el segundo sale a esperar.
      if (viaElegida === encima.id) esperar(encima.id);
      else { viaElegida = encima.id; audio.play('cock'); }
    }
    // (Si el cursor se va de esa vía, hay que volver a elegirla.)
    if (!encima || trenEncima || viaElegida !== encima.id) viaElegida = null;

    // Volver: Escape o clic derecho, que en un mapa es el gesto de doblarlo.
    if (input.wasPressed('Escape') || input.mouse.right) {
      scenes.goTo('camp', { desde: 'mapa' });
    }
  }

  /**
   * 🎭 EL QUE SIGUE EN ESE PAPEL: pasa por "nadie" y por los de la banda que pueden ir (siguen con vos, no están
   * heridos) y no tienen ya el otro papel. Cada uno hace un solo papel, y cada papel lo hace uno solo.
   */
  function cambiarPapel(papel) {
    const b = gameState.banda;
    const candidatos = [null, ...BANDA.map((m) => m.id).filter((id) => puedeIr(b, id) && (!b[id].papel || b[id].papel === papel))];
    const ahora = quienHace(b, papel);
    if (ahora) b[ahora].papel = null;
    // 🙂 🙅 El que sigue puede no querer el puesto hoy (por su humor o por quién es): se lo saltea y lo dice en el plan.
    // (Se sortea una vez por día y por puesto: volver a hacer clic no lo convence.)
    let i = candidatos.indexOf(ahora);
    for (let n = 0; n < candidatos.length; n++) {
      i = (i + 1) % candidatos.length;
      const sigue = candidatos[i];
      if (!sigue) break;
      if (disposicionPara(gameState, sigue, papel) === 'seNiega') { negativa = { papel, id: sigue, t: 2.5 }; continue; }
      darPapel(b, sigue, papel);
      break;
    }
    audio.play('cock');
  }
  /** 🙅 El último que no quiso un puesto, para decirlo en el plan un rato. */
  let negativa = null;

  /**
   * Salir a esperar ese tren.
   *
   * 🔁 🚂 *(BRUJULA: "salir a un tren hace pasar el tiempo hasta que pasa")*: el tiempo corre hasta la parte del día en
   * que pasa (el viaje está adentro: si salís temprano, esperás en la vía), y el asalto se juega con esa luz. La vuelta
   * cuesta lo mismo que la ida (`gameState.viajeDeVuelta`, ver scenes/resultsScene.js). El tren sale del horario.
   */
  /**
   * 🗞️ IR A ESPERAR A UNA VÍA (ver `esperarEnVia` en systems/horario.js): si en ese rato pasa un tren, salís a él como
   * a cualquiera del horario. Si no pasa ninguno, esperaste hasta la noche y volvés al campamento con el día perdido
   * (lo que tardaste en volver, también).
   */
  function esperar(rutaId, dia = null) {
    const { tren, hasta } = esperarEnVia(gameState, rutaId, dia);
    if (tren) { salir(tren); return true; }
    audio.play('escape');
    pasar(gameState, hasta - ahora(gameState) + 1 + viajeDe(rutaId));
    if (gameState.campamento) (gameState.campamento.noticias = gameState.campamento.noticias || []).push('sinTren');
    scenes.goTo('camp');
    return false;
  }

  function salir(tren) {
    audio.play('escape');
    // 📋 (Mientras dura el golpe, los que tienen papel no salen a las tareas de la pizarra.)
    if (gameState.campamento) gameState.campamento.golpeEnCurso = true;
    // 😈 (El que tiene la señal no va: traiciona. Se cuenta al volver. Ver systems/tentacion.js.)
    if (gameState.campamento) (gameState.campamento.noticias = gameState.campamento.noticias || []).push(...traicionesAlSalir(gameState));
    // 🍲 (El guiso del Cocinero de esta noche o de anoche: James entra con un tiro más. Ver systems/tareas.js.)
    gameState.guisoTiros = guisoParaElGolpe(gameState);
    pasar(gameState, faltaPara(gameState, tren));
    gameState.viajeDeVuelta = viajeDe(tren.ruta);
    sacarDelHorario(gameState, tren.id);
    // 📖 (Lo que lleva ese tren para la historia: el encargo, la paga. Se lee en el asalto y al volver.)
    gameState.trenDelGolpe = { historia: tren.historia || [] };
    const ruta = rutas.find((r) => r.id === tren.ruta);
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
      maletinEn: tren.maletinEn ?? null,
      cajaGordaEn: tren.cajaGordaEn ?? null,
      ruta: ruta.id,
      // 🎭 El plan: quién hace cada papel (también queda en gameState.banda). Lo usa la etapa 5.
      papeles: Object.fromEntries(PAPELES.map((p) => [p, quienHace(gameState.banda, p)])),
    });
  }

  // ------------------------------------------------------------------ dibujo

  /** 🗺️ El mapa viejo, en la grilla nueva (world/estiloNuevo/mapaViejo.js). */
  function renderNuevo(r) {
    // (Como en el campamento: el punto mide siempre píxeles enteros.)
    if (r.canvas.width / DENSIDAD >= 480 && r.canvas.height / DENSIDAD >= 270) r.lupa(DENSIDAD);
    else r.lupaLibre((2 * DENSIDAD) / CONFIG.estilo.punto);
    const PASO = CONFIG.estilo.punto / DENSIDAD, ctx = r.ctx, c = r.centro;
    // (🔁 La hoja, corrida a la derecha hasta 12 unidades: es el lugar del farol grande.)
    const corrido = Math.max(0, Math.min(12, c.x - 18));
    const ox = Math.round((c.x + corrido) / PASO) * PASO, oy = Math.round(c.y / PASO) * PASO;
    origenNuevo = { x: ox, y: oy };
    const ayuda = { puntoEn, tangenteEn, enTunel };
    r.clear('#000');
    const noche = !gameState.esDeDia;
    TINTA_SUAVE_NUEVA = noche ? '#33241a' : '#5f4730';
    mapaViejo.dibujarHoja(ctx, { ancho: r.width, alto: r.height, ox, oy, noche });
    mapaViejo.farol(ctx, r.height, noche, scroll);
    ctx.save();
    ctx.translate(ox, oy);
    mapaViejo.dibujarVias(ctx, rutas, ayuda, noche);
    if (encima) mapaViejo.viaResaltada(ctx, encima, ayuda);
    // (🔁 Las letras, en la capa fina: en la grilla de 3×3 quedaban comidas.)
    // (De noche sin halo: el color del papel de día brillaría alrededor de las letras.)
    const halo = { halo: noche ? null : mapaViejo.COLOR_HALO, lienzo: estiloNuevo.lienzoFino(ctx) };
    for (const p of REGION.lugares) {
      const color = p.tipo === 'pueblo' ? tintaFuerte() : TINTA_SUAVE_NUEVA;
      if (p.etiqueta === 'izq') r.text(p.nombre, p.x - 7, p.y, color, 'right', halo);
      else if (p.etiqueta === 'der') r.text(p.nombre, p.x + 7, p.y, color, 'left', halo);
      else if (p.etiqueta === 'arriba') r.text(p.nombre, p.x, p.y - 10, color, 'center', halo);
      else r.text(p.nombre, p.x, p.y + 10, color, 'center', halo);
    }
    const k = REGION.campamento;
    if (Math.floor(scroll * 3) % 2 === 0) mapaViejo.fueguito(ctx, k.x + 8, k.y + 1);
    // (🔁 Al costado de la carpa y no abajo: abajo le tapaba un pedazo a la vía que pasa por ahí.)
    r.text(T.mapa.campamento, k.x - 6, k.y + 9, selloActual(), 'left', halo);
    // 🚂 El tren del renglón que señalás (o el próximo de la vía señalada), quieto donde lo esperarías.
    const marcado = trenMarcado();
    if (marcado) {
      const ruta = rutas.find((x) => x.id === marcado.ruta), p = dondeLoEsperas(marcado.ruta);
      const t = tDe(ruta, p);
      // (Con un anillo del color del sello, que parpadea: el tren solo es un punto y no se encontraba.)
      if (Math.floor(scroll * 3) % 2 === 0) mapaViejo.anillo(ctx, p.x, p.y, 7, 32);
      mapaViejo.tren(ctx, puntoEn(ruta, t), tangenteEn(ruta, t), scroll);
    }
    r.text('N', 30, CONFIG.view.height - 30 - 16, tintaFuerte(), 'center', halo);
    ctx.restore();
    dibujarCartucho(r);
    dibujarPlan(r);
  }

  function render(r) {
    if (estiloNuevo.activo) { renderNuevo(r); return; }
    // Esta escena está armada para CONFIG.view: usa la lupa que le entre.
    r.escenaFija();
    /**
     * EL PAPEL LLENA LA PANTALLA; LA RED VA CENTRADA. Las vías y los pueblos
     * están trazados para `CONFIG.view` (ver data/region.js) y así se quedan:
     * en una pantalla más grande el papel tiene más margen, no un mapa
     * deformado. La rosa y el cartucho siguen pegados a sus esquinas.
     */
    dibujarPapel(r);
    const c = r.centro;
    r.ctx.save();
    r.ctx.translate(c.x, c.y);
    dibujarTerreno(r);
    // Las vías van ANTES que los lugares y la vía señalada va última, para que
    // en un cruce se vea claro cuál de las dos estás mirando.
    for (const ruta of rutas) if (ruta !== encima) dibujarVia(r, ruta, false);
    if (encima) dibujarVia(r, encima, true);
    dibujarLugares(r);
    dibujarCampamento(r);
    const marcado = trenMarcado();
    if (marcado) dibujarTren(r, rutas.find((x) => x.id === marcado.ruta), tDe(rutas.find((x) => x.id === marcado.ruta), dondeLoEsperas(marcado.ruta)));
    r.ctx.restore();
    dibujarRosaDeLosVientos(r);
    dibujarCartucho(r);
  }

  /** El papel: base, veteado, manchas y el marco doble de tinta. */
  function dibujarPapel(r) {
    r.clear(colors.mapaPapel);

    // Veteado horizontal, muy suave: el grano del papel.
    r.ctx.globalAlpha = 0.35;
    for (let y = 8; y < r.height - 6; y += 3) {
      if ((y / 3) % 2 === 0) r.rect(6, y, r.width - 12, 1, colors.mapaPapel2);
    }
    r.ctx.globalAlpha = 1;

    // Manchas de humedad, fijas desde la primera vez.
    for (const m of manchas) {
      r.ctx.save();
      r.ctx.globalAlpha = m.a;
      r.ctx.fillStyle = colors.mapaMancha;
      r.ctx.beginPath();
      r.ctx.arc(20 + m.fx * (r.width - 40), 16 + m.fy * (r.height - 32), m.r, 0, Math.PI * 2);
      r.ctx.fill();
      r.ctx.restore();
    }

    // Los bordes gastados: el papel se oscurece hacia afuera.
    r.ctx.globalAlpha = 0.5;
    r.rect(0, 0, r.width, 5, colors.mapaMancha);
    r.rect(0, r.height - 5, r.width, 5, colors.mapaMancha);
    r.rect(0, 0, 5, r.height, colors.mapaMancha);
    r.rect(r.width - 5, 0, 5, r.height, colors.mapaMancha);
    r.ctx.globalAlpha = 1;

    // El marco doble, como cualquier mapa impreso de la época. Toma el papel
    // entero con el mismo margen de siempre, mida lo que mida la pantalla.
    const m = { x: REGION.marco.x, y: REGION.marco.y, w: r.width - 2 * REGION.marco.x, h: r.height - 2 * REGION.marco.y };
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
        case 'arroyo':   dibujarArroyo(r, t.puntos); break;
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

  /** Un arroyo seco: línea cortada en tinta suave. */
  function dibujarArroyo(r, puntos) {
    for (let i = 0; i < puntos.length - 1; i++) {
      const [a, b] = puntos[i], [c, d] = puntos[i + 1];
      const largo = Math.max(1, Math.ceil(Math.hypot(c - a, d - b) / 3));
      for (let k = 0; k < largo; k += 2) {
        const u = k / largo, v = (k + 1) / largo;
        r.line(a + (c - a) * u, b + (d - b) * u, a + (c - a) * v, b + (d - b) * v, colors.mapaTintaSuave);
      }
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
  function dibujarTren(r, ruta, t) {
    const p = puntoEn(ruta, t);
    const u = tangenteEn(ruta, t);

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
    const x = 30, y = r.height - 30;
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
   * 🔁 🚂 Ya no dice qué tren va por la vía señalada (los trenes ya no dan vueltas): es el horario. Ver abajo.
   */
  function dibujarCartucho(r) {
    // Abajo a la derecha, que es donde se imprimía. Corrido del centro para
    // dejarle a la RED todo el ancho del papel: con siete líneas cruzándose,
    // el espacio del mapa vale más que la simetría del recuadro.
    // Pegado a la esquina de abajo a la derecha, con el mismo margen de siempre.
    const w = 180, h = 56;
    // (En el estilo nuevo el recuadro ya viene impreso en el papel: acá van sólo las letras.)
    const nuevo = estiloNuevo.activo, C = mapaViejo.cartuchoEn();
    const x = nuevo ? origenNuevo.x + C.x : r.width - w - 8, y = nuevo ? origenNuevo.y + C.y : r.height - h - 10;
    if (!nuevo) {
      r.rect(x, y, w, h, colors.mapaPapel);
      marco(r, x, y, w, h, colors.mapaBorde);
      marco(r, x + 2, y + 2, w - 4, h - 4, colors.mapaTintaSuave);
    }

    const cx = x + w / 2;
    const suave = nuevo ? TINTA_SUAVE_NUEVA : colors.mapaTintaSuave;
    const sin = { halo: null, lienzo: nuevo ? estiloNuevo.lienzoFino(r.ctx) : undefined };   // adentro del cartucho el fondo ya está limpio

    /**
     * 🚂 EL HORARIO *(BRUJULA, "Elegir el tren: el horario")*: arriba, la vía del tren señalado y lo que cuesta el
     * viaje (o el título y cómo volver); abajo, un renglón por tren, en orden: el día, la parte y el tipo. El de la vía
     * señalada va en el color del sello; al que ya no llegás, en tinta suave y con "no llegas".
     */
    // 🗞️ (Sólo los que sabés: los de pasajeros y los rumores. Y con una vía elegida, arriba se pide el segundo clic.)
    const trenes = conocidos(gameState);
    const tm = trenMarcado();
    const Tm = T.mapa;
    const vivo = Math.floor(scroll * 3) % 2 === 0;
    const rutaArriba = !trenEncima && encima ? encima : tm ? rutas.find((x) => x.id === tm.ruta) : null;
    if (viaElegida && encima && encima.id === viaElegida && !trenEncima) {
      r.text(Tm.esperarOtraVez, cx, y + 11, vivo ? selloActual() : tintaFuerte(), 'center', sin);
    } else if (trenEncima && trenEncima.visto) {
      // 🕵️ (Uno que fue a mirar alguien de la banda: arriba, lo que te contó. El básico, el vagón especial; el completo,
      // la escolta, la caja más gorda y el vagón del maletín, si J.Mc. lo espera.)
      const t = trenEncima, completo = t.visto === 'completo';
      const lleva = t.maletinEn && encargoAbierto(gameState, t) && !tieneMaletin(gameState);
      const texto = completo
        ? Tm.escolta(t.dificultad.short) + (t.cajaGordaEn ? Tm.cajaEn(t.cajaGordaEn) : '') + (lleva ? Tm.maletinEn(t.maletinEn) : '')
        : (Tm.especial[t.especial] || '') + (lleva ? Tm.conMaletin : '');
      r.text(texto, cx, y + 11, tintaFuerte(), 'center', sin);
    } else if (rutaArriba) {
      r.text(`${rutaArriba.nombre} · ${Tm.viaje(viajeDe(rutaArriba.id))}`, cx, y + 11, tintaFuerte(), 'center', sin);
    } else {
      r.text(Tm.horario, cx, y + 11, tintaFuerte(), 'center', sin);
    }
    renglones = [];
    trenes.slice(desde, desde + RENGLONES).forEach((t, i) => {
      const yy = y + 22 + i * 9;
      const f = fechaDe(t.dia), llega = llegas(gameState, t);
      // (🗞️ De un rumor, el día sin la parte: "JUE 21 · CARGA · RUMOR".)
      const cuando = t.sabes === 'rumor' ? Tm.dia(T.tiempo.semanaLarga[f.semana], f.dia)
        : `${Tm.dia(T.tiempo.semanaLarga[f.semana], f.dia)}, ${T.tiempo.partesMin[TIEMPO.partes[t.parte]].toUpperCase()}`;
      // (🗞️ Y de dónde salió el rumor, con cuánto es cierto: "CANTINA 75/100". Ver `RUMORES` en data/tareas.js. Al que
      // ya no llegás, sólo "RUMOR": con "NO LLEGAS" no entra en el renglón, y ya no importa.)
      const rumor = llega && t.de && Tm.rumorDe[t.de] ? Tm.rumorDe[t.de](RUMORES[t.de]) : Tm.rumor;
      const texto = `${cuando} · ${t.tipoTren.short}` + (t.sabes === 'rumor' ? ' · ' + (t.visto ? Tm.cierto : rumor) : t.visto ? ' · ' + Tm.visto : '')
        // (📖 El tren de un encargo, o la paga: "J.MC.", "TOMMY", "PAGA". Ver text/historia.js.)
        + (etiquetaDelTren(gameState, t) ? ' · ' + TH.mapa[etiquetaDelTren(gameState, t)] : '')
        + (llega ? '' : ' · ' + Tm.noLlegas);
      const color = t === trenEncima ? (vivo ? selloActual() : tintaFuerte())
        : !llega ? suave
        : encima && encima.id === t.ruta ? selloActual() : tintaFuerte();
      r.text(texto, cx, yy, color, 'center', sin);
      renglones.push({ x, y: yy, w, tren: t });
    });
    if (!trenes.length) r.text(Tm.sinTrenes, cx, y + 30, suave, 'center', sin);
    // (Si hay más arriba o abajo, una flechita al costado.)
    if (desde > 0) r.text('▲', x + w - 8, y + 22, suave, 'center', sin);
    if (desde + RENGLONES < trenes.length) r.text('▼', x + w - 8, y + 22 + (RENGLONES - 1) * 9, suave, 'center', sin);
  }

  /**
   * 🎭 EL PLAN, en su recuadro impreso en el papel (`mapaViejo.planEn`), a la izquierda del cartucho: cada papel en un
   * renglón y abajo quién lo hace. El papel bajo el cursor va en el color del sello.
   */
  function dibujarPlan(r) {
    const P = mapaViejo.planEn(), b = gameState.banda;
    const X = origenNuevo.x + P.x, Y = origenNuevo.y + P.y, cx = X + mapaViejo.PLAN.w / 2;
    // (Cada papel ocupa dos renglones, el suyo y el del nombre; el clic vale en los dos.)
    planCaja = { x: P.x, w: mapaViejo.PLAN.w, filas: PAPELES.map((_, i) => P.y + 21 + i * 19) };
    const sin = { halo: null, lienzo: estiloNuevo.lienzoFino(r.ctx) };
    r.text(T.mapa.plan, cx, Y + 10, tintaFuerte(), 'center', sin);
    PAPELES.forEach((p, i) => {
      const quien = quienHace(b, p);
      const color = planEncima === p ? selloActual() : TINTA_SUAVE_NUEVA;
      const yy = origenNuevo.y + planCaja.filas[i];
      r.text(T.mapa.papeles[p], cx, yy, color, 'center', sin);
      // (🙅 Si recién alguien no quiso este puesto, se dice ahí un rato.)
      const no = negativa && negativa.papel === p && negativa.t > 0 ? negativa : null;
      // (Un punto más chica, para que entre en el cuadro.)
      r.text(no ? T.mapa.noQuiere(MIEMBRO[no.id].corto.toUpperCase()) : quien ? MIEMBRO[quien].corto.toUpperCase() : T.mapa.nadie,
        cx, yy + 8, no || planEncima === p ? selloActual() : tintaFuerte(), 'center', no ? { ...sin, tam: 7 } : sin);
      // 📒 Con el cursor encima: de cada 100 veces cuántas sale bien, y los dos motivos que más pesan (BANDA-NUEVA.md:
      // "el plan lo muestra con una palabra y dos motivos"). ⚠️ Sin la parte del día: se sabe al salir al tren.
      if (planEncima === p && quien && !no && b[quien].libreta) {
        const e = b[quien], disp = disposicionPara(gameState, quien, p);
        const resaca = !!(e.resaca || (quien === 'frank' && gameState.campamento && gameState.campamento.marcas && gameState.campamento.marcas.frankResaca));
        const pr = pronostico(e, p, { resaca, disp, enemigo: conEnemigoEnElPlan(gameState, quien) });
        const bien = ESCALERA[pr.pasos][0];
        const motivos = pr.motivos.slice().sort((a, c) => Math.abs(c[1]) - Math.abs(a[1])).slice(0, 2)
          .map(([k, v]) => `${T.libreta.pasos[k].toUpperCase()} ${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}`).join(' · ');
        const t1 = T.libreta.pronostico(MIEMBRO[quien].corto.toUpperCase(), bien);
        // (😈 Si tiene la señal, y se sabe que es él: si sales así, no va.)
        const t3 = e.senal && !e.senalOculta ? T.tentacion.plan : null;
        // (🔁 Sobre un papelito limpio, con su raya: encima de las vías no se leía.)
        const an = Math.ceil(Math.max(r.medir(t1, 7), motivos ? r.medir(motivos, 7) : 0, t3 ? r.medir(t3, 7) : 0)) + 10, al = (motivos ? 20 : 12) + (t3 ? 8 : 0);
        const px0 = Math.round(cx - an / 2), py0 = Math.round(Y - 4 - al);
        // (En la capa fina, como las vías: si no, quedaban encima del papelito.)
        const fino = sin.lienzo, caja = (x0, y0, w0, h0, c) => { fino.fillStyle = c; fino.fillRect(x0, y0, w0, h0); };
        caja(px0, py0, an, al, mapaViejo.COLOR_HALO);
        caja(px0, py0, an, 1, TINTA_SUAVE_NUEVA); caja(px0, py0 + al - 1, an, 1, TINTA_SUAVE_NUEVA);
        caja(px0, py0, 1, al, TINTA_SUAVE_NUEVA); caja(px0 + an - 1, py0, 1, al, TINTA_SUAVE_NUEVA);
        r.text(t1, cx, py0 + 6, tintaFuerte(), 'center', { ...sin, tam: 7 });
        if (motivos) r.text(motivos, cx, py0 + 14, TINTA_SUAVE_NUEVA, 'center', { ...sin, tam: 7 });
        if (t3) r.text(t3, cx, py0 + al - 6, selloActual(), 'center', { ...sin, tam: 7 });
      }
    });
  }

  function exit() {
    audio.quitarAmbiente('desierto');
  }

  return { enter, exit, update, render };
}
