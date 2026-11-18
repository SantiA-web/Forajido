/**
 * EL CAMPAMENTO — la primera escena que no es un asalto.
 *
 * Es el centro del juego a partir de la fase 3: acá empezás, acá volvés, y
 * de acá salís a robar. Ver `data/camp.js` para el razonamiento de por qué es
 * un LUGAR y no un menú, y por qué están estos cinco objetos y no otros.
 *
 * DOS DECISIONES QUE ORDENAN TODA LA ESCENA:
 *
 * 1. **Entra entera en pantalla, sin cámara que siga a nadie.** El
 *    campamento mide menos que la vista (384x216), así que las coordenadas
 *    del mundo son las de la pantalla y no hace falta ni cámara ni scroll.
 *    Eso no es sólo comodidad técnica: un lugar que se ve entero de un
 *    vistazo se lee como un refugio, y uno que hay que recorrer se lee como
 *    un nivel. Acá queremos lo primero.
 *
 * 2. **El límite es la luz, no una pared.** Te podés alejar hasta
 *    `CAMPAMENTO.radio` y ahí te frenás. Pero el suelo se va apagando antes
 *    de llegar, así que el borde se ve venir: cuando te frena, ya sabías por
 *    qué. Es la misma regla que el resto del juego —la geometría explica
 *    sola— y por eso el aviso de texto es un recordatorio, no la explicación.
 *
 * `[E]` acá es una PULSACIÓN, no un mantenido como en el asalto. En el asalto
 * se mantiene porque robar lleva tiempo y ese tiempo es el riesgo; en el
 * campamento no hay ninguna presión, y hacer esperar a alguien sin motivo es
 * peor diseño que ser inconsistente.
 */

import { CONFIG } from '../data/config.js';
import { CAMPAMENTO, DECORADO, ASIENTO } from '../data/camp.js';
import { caballoActual, HORSES } from '../data/horse.js';
import { WEAPONS } from '../data/weapons.js';
import { MELEE } from '../data/melee.js';
import { gameState, resetGame } from '../state/gameState.js';
import { crearMenu, papel, TINTAS } from '../engine/menu.js';
import { crearFicha } from './ficha.js';
import { crearCalendario } from './calendario.js';
import { pasar, partesHasta, partesDeDias, completarTiempo, fechaDe, loQueViene } from '../systems/tiempo.js';
import { TIEMPO } from '../data/tiempo.js';
import { rumorDeCarga, rumorFalso } from '../systems/horario.js';
import { chanceDeRumor, practicar, fuerza, tiene } from '../systems/animo.js';
import { ANIMO, palabraDeHumor } from '../data/rasgos.js';
import { dibujarPersona, faseDeAndar, tono } from '../entities/figura.js';
import { dibujarAnimal, ESCALA_PARADO } from '../entities/caballo.js';
import { T } from '../text/es.js';
import { estiloNuevo } from '../engine/estiloNuevo.js';
import { DENSIDAD } from '../engine/renderer.js';
import * as dibujoNuevo from '../world/estiloNuevo/campamento.js';
import { BANDA, MIEMBRO, palabraDe, completarBanda } from '../data/banda.js';
import { completarAnimo, practicandoAhora, mandarAPracticar, PRACTICABLES, mandarAEspiar, trenesMirados, PARTES_DE_PRACTICA, lePaso, jugarUnaMano } from '../systems/animoEnJuego.js';
import { espiables } from '../systems/horario.js';
import { ESCONDITES_DEL_MALETIN } from '../world/train.js';
import { completarCampamento, visitaNueva, pendienteDe, opcionesDe as opcionesDelMomento, elegir, MOMENTOS, revisarEncargo, encargoAbierto, tieneMaletin } from '../data/momentos.js';

/**
 * 🔥 EL FORASTERO HERIDO que pide agua (un momento, ver data/momentos.js): la gente del tren, flaco, de bombín marrón
 * y patillas, para que no se confunda con ninguno de la banda.
 */
const ASPECTO_FORASTERO = {
  piel: 'clara', pelo: 'castano', peinado: 'corto', sombrero: 'bombin', colorSombrero: 'marron', barba: 'patillas',
  cuerpo: 'flaco', ropa: 'camisa', arremangada: false, panuelo: 'pardo',
};

/**
 * DE DÓNDE VIENE EL SOL. Un desplazamiento chico y para un solo lado: lo que
 * hace leer el mediodía no es el tamaño de la sombra sino que TODAS caigan
 * para el mismo lado. Con cada una centrada bajo su objeto —como estaba la del
 * jugador— no hay sol, hay objetos flotando.
 */
const SOL = { dx: 3, dy: 2 };

/**
 * Un entero revuelto a partir de otro, SIEMPRE EL MISMO para el mismo número.
 *
 * Sirve para sembrar cosas quietas —las matas del desierto— sin guardar una
 * lista y sin usar el `rng` del juego: éste se llama en cada cuadro del dibujo,
 * y un rng de verdad avanza su estado, así que las matas titilarían de un
 * cuadro al otro. Acá la posición es una función pura del índice.
 */
function revolver(n) {
  let t = (n * 374761393 + 668265263) | 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177);
  return (t ^ (t >>> 16)) >>> 0;
}

/** 🗞️ Hasta cuántas letras entra un aviso en la línea de abajo (más largo, va en el papel: ver `avisar`). */
const LARGO_DE_UNA_LINEA = 100;

export function createCampScene(services) {
  const { input, scenes, hud, audio } = services;
  // 🧪 El arma que tenías antes de ponerte la escopeta con [2] (ver `update`).
  let armaAntesDeLaPrueba = null;
  // 🧪 Lo que tenías para pegar antes de ponerte el cuchillo con [5].
  let meleeAntesDeLaPrueba = null;

  const colors = CONFIG.colors;

  let x, y, sentado, mensaje, scroll, avisoLejos, chispaTimer;
  const menu = crearMenu(audio);
  // 📋 La ficha de cada uno de la banda, con [TAB] (scenes/ficha.js).
  const ficha = crearFicha(audio);
  // 📅 El calendario, con [C] (scenes/calendario.js).
  const calendario = crearCalendario(audio);
  /**
   * HACIA DÓNDE MIRA, en radianes como en todo el juego. Antes no hacía falta
   * —eras una caja— y ahora sí: la persona tiene ocho direcciones y hay que
   * decirle cuál. Arranca mirando a la cámara, que es como se ve la cara.
   */
  let mirando = Math.PI / 2;
  /**
   * El cuerpo del jugador para `faseDeAndar`: esa función deduce en qué punto
   * del paso va a partir de cuánto se movió, y guarda lo suyo en el objeto que
   * se le pasa. Por eso tiene que ser SIEMPRE EL MISMO objeto.
   */
  const yo = {};

  function enter(params = {}) {
    hud.hide();
    // 🤠 (Una partida de antes de la banda: la banda arranca acá.)
    gameState.banda = completarBanda(gameState.banda);
    completarAnimo(gameState.banda);
    // 📅 (Una partida de antes del calendario: arranca hoy.)
    completarTiempo(gameState);
    /**
     * 🔥 UNA VISITA NUEVA (al empezar, después de un asalto, al salir de la cárcel; ir al pueblo o al mapa y volver es
     * la misma): se va el que estaba en 0 y ya había avisado, y se elige el momento de esta visita (data/momentos.js).
     * Sólo en el estilo nuevo, que es el que dibuja a la banda, la carta y el forastero.
     */
    gameState.campamento = completarCampamento(gameState.campamento);
    const nueva = !params.desde || params.desde === 'asalto' || params.desde === 'prision';
    const seFueron = nueva && estiloNuevo.activo ? visitaNueva(gameState) : [];
    if (nueva && estiloNuevo.activo && gameState.banda) traerRumores();
    // ✉️ (Y si es la noche de J.Mc., o si ya pasó y no estabas: la carta junto a la carpa.)
    const deJmc = estiloNuevo.activo ? revisarEncargo(gameState) : null;
    const c = CAMPAMENTO.centro;
    // Arrancás al lado del fuego, mirando el resto del campamento. Salvo que
    // vuelvas del pueblo: entonces aparecés donde dejaste el caballo, que es
    // por donde te fuiste. Volver a un lugar distinto del que saliste se
    // siente a teletransporte aunque nadie sepa explicar por qué.
    const volvesA = { pueblo: 'poste', mapa: 'cartel' }[params.desde];
    const donde = volvesA && CAMPAMENTO.objetos.find((o) => o.id === volvesA);
    /**
     * 🔻 Y ARRANCÁS AL COSTADO DEL FUEGO, no delante. En la vista de arriba
     * daba igual —eras una caja de 13 de alto—, pero en tres cuartos la
     * profundidad se COMPRIME (`PROF`) y una persona de 20 parada 20 unidades
     * delante de la fogata se la tapa entera. Al costado no.
     */
    x = donde ? c.x + donde.x - 20 : c.x - 40;
    y = donde ? c.y + donde.y + 16 : c.y + 40;
    sentado = false;
    mensaje = null;
    // 🎭 Y lo que trajo el asalto (ver `cerrarAsalto` en data/momentos.js).
    // (🔁 Siempre que haya, no sólo al volver de un asalto: la de "volvió" se da al volver del pueblo.)
    const noticias = sacarNoticias();
    const avisos = [...seFueron.map((n) => T.camp.banda.seFue(n)), ...noticias, ...(deJmc === 'entrega' ? [T.camp.momentos.esLaNoche] : [])];
    if (avisos.length) avisar(avisos);
    avisoLejos = 0;
    scroll = 0;
    arrancarSonido();
    // 🏁 (Si la partida ya terminó, el final, siempre.)
    if (gameState.finDelJuego) abrirFin();

    // Para depurar desde la consola: FORAJIDO.services.camp
    services.camp = {
      get x() { return x; },
      get y() { return y; },
      get sentado() { return sentado; },
      get cerca() { const o = objetoCerca(); return o ? o.id : null; },
      get objetos() { return objetosEnMundo(); },
      get mensaje() { return mensaje ? mensaje.texto : null; },
      get dialogo() { return menu.activo(); },
      // 🧪 (Para las pruebas: leer el papel abierto y elegir una opción.)
      get papel() { return menu.leer(); },
      elegir: (id) => menu.elegirOpcion(id),
      get ficha() { return ficha.activa(); },
      abrirFicha: (i = 0) => abrirFicha(i),
      /** Usar un objeto (o hablar con alguien) sin ir caminando: para probar los diálogos. */
      usar: (id) => { const o = objetosEnMundo().find((ob) => ob.id === id); if (o) usar(o); return !!o; },
    };
  }

  // ------------------------------------------------------------------ lógica

  /**
   * 🎭 LAS NOTICIAS QUE ESPERAN (ver `cerrarAsalto` en data/momentos.js y systems/animoEnJuego.js), ya en palabras, y
   * las saca de la lista. ('preso:id' y 'volvio:id' llevan el nombre; las de las habilidades, 'gano:id:hab', además
   * la habilidad.)
   */
  function sacarNoticias() {
    if (!estiloNuevo.activo || !gameState.campamento) return [];
    const lista = (gameState.campamento.noticias || []).map((n) => {
      const [clave, id, hab] = n.split(':');
      // 🗞️ (Los rumores llevan el número del tren: 'rumorHoja:12', y los de la banda quién y por qué: 'rumor:frank:12:alcoholico'.)
      // 🕵️ (Y lo que trajo el que fue a mirar un tren: 'espia:tommy:12:visto'.)
      if (clave === 'espia') {
        const [, , trenId, que, ruta] = n.split(':');
        const tren = (gameState.horario && gameState.horario.trenes.find((t) => String(t.id) === trenId)) || { ruta, id: trenId };
        return que === 'visto' && !tren.composicion ? null : informeDelEspia(id, tren, que);
      }
      if (clave === 'rumorHoja') {
        const tren = gameState.horario && gameState.horario.trenes.find((t) => String(t.id) === id);
        return tren ? contarRumor('hoja', tren) : null;
      }
      if (clave === 'rumor') {
        const [, , trenId, porque] = n.split(':');
        const tren = gameState.horario && gameState.horario.trenes.find((t) => String(t.id) === trenId);
        if (!tren || !MIEMBRO[id]) return null;
        const R = T.rumores, f = fechaDe(tren.dia);
        return R.banda(MIEMBRO[id].corto, R.dondeLoOyo[porque] || R.dondeLoOyo.pueblo, `${R.dias[f.semana]} ${f.dia}`, R.vias[tren.ruta] || tren.ruta);
      }
      const f = T.camp.noticias[clave];
      if (!id) return f;
      return f(MIEMBRO[id] ? MIEMBRO[id].corto : id, hab ? T.rasgos[hab] || hab : undefined);
    });
    gameState.campamento.noticias = [];
    return lista.filter(Boolean);
  }

  /**
   * 🔁 🗞️ LOS RUMORES DE LA BANDA *(Santi: "mejor que Frank no sea el único que traiga rumores [...] hay otros rasgos
   * que hacen hablar")*: en cada visita nueva, cada uno de los que están (ni preso ni herido) tira con su chance
   * (`chanceDeRumor`, systems/animo.js). Si le sale, el tren de carga más cercano que todavía no sabés pasa al horario
   * como rumor; al mentiroso, la mitad de las veces se lo inventa. Contarlo con la baraja o con labia es usarla.
   */
  function traerRumores() {
    const C = gameState.campamento, dia = completarTiempo(gameState).dia;
    C.noticias = C.noticias || [];
    // 🔁 (Uno por visita como mucho: tiran en un orden cualquiera, y el primero al que le sale es el que cuenta.)
    const orden = BANDA.slice().sort(() => Math.random() - 0.5);
    for (const m of orden) {
      const e = gameState.banda[m.id];
      if (!e || !e.esta || e.preso || e.herido) continue;
      const { chance, porque } = chanceDeRumor(e);
      if (Math.random() >= chance) continue;
      const miente = Math.random() < ANIMO.rumores.mentiroso * (fuerza(e, 'mentiroso') > 0 ? 1 : 0);
      const tren = miente ? rumorFalso(gameState) : rumorDeCarga(gameState);
      if (!tren) continue;
      C.noticias.push(`rumor:${m.id}:${tren.id}:${porque || 'pueblo'}`);
      // (Las dos, si tiene las dos: las usó para enterarse, aunque el aviso nombre una sola.)
      for (const hab of ['baraja', 'labia']) {
        if (!tiene(e, hab)) continue;
        const r = practicar(e, hab, dia);
        if (r) C.noticias.push(`${r}:${m.id}:${hab}`);
      }
      break;
    }
  }

  /** 🗞️ Un rumor en palabras: quién lo cuenta (`T.rumores[quien]`), el día y la vía. */
  function contarRumor(quien, tren) {
    const R = T.rumores, f = fechaDe(tren.dia);
    return R[quien](`${R.dias[f.semana]} ${f.dia}`, R.vias[tren.ruta] || tren.ruta);
  }

  /** Los objetos con sus coordenadas ya absolutas (en data van relativas al centro). */
  function objetosEnMundo() {
    const c = CAMPAMENTO.centro;
    // 🤠 (La banda: sólo el que sigue con vos, y sólo en el estilo nuevo, que es el que la dibuja.)
    return CAMPAMENTO.objetos
      .filter((o) => !o.miembro || (estiloNuevo.activo && gameState.banda && gameState.banda[o.id] && gameState.banda[o.id].esta))
      // (🎯 El que se fue a practicar no está, salvo de noche, que descansa acá.)
      .filter((o) => !o.miembro || !practicandoAhora(gameState, o.id))
      // (🔥 La carta y el forastero, sólo mientras traen su momento.)
      .filter((o) => !o.momento || (estiloNuevo.activo && gameState.campamento && pendienteDe(gameState, o.id)))
      .map((o) => ({ ...o, x: c.x + o.x, y: c.y + o.y }));
  }

  /** Lo que está sólo para verse, con sus coordenadas absolutas. En el estilo viejo no hay nada de esto. */
  function decoradoEnMundo() {
    if (!estiloNuevo.activo) return [];
    const c = CAMPAMENTO.centro;
    return DECORADO.map((o) => ({ ...o, x: c.x + o.x, y: c.y + o.y }));
  }

  /** El objeto que tenés al alcance de la mano, o null. El más cercano gana. */
  function objetoCerca() {
    let mejor = null;
    let mejorDist = Infinity;
    for (const o of objetosEnMundo()) {
      const d = Math.hypot(o.x - x, o.y - y);
      if (d <= o.alcance && d < mejorDist) { mejorDist = d; mejor = o; }
    }
    return mejor;
  }

  function decir(texto, life = 2.6) {
    mensaje = { texto, life };
  }

  /**
   * 🗞️ AVISOS QUE NO ENTRAN EN UNA LÍNEA (dos rumores juntos, lo que vio el espía): la línea de abajo no corta renglones
   * y se salían de la pantalla. Si son largos, van en el papel del diálogo, un aviso por renglón; si no, como siempre.
   */
  function avisar(lineas) {
    const texto = lineas.join(' ');
    if (texto.length <= LARGO_DE_UNA_LINEA) { decir(texto, 4 + 2 * (lineas.length - 1)); return; }
    mensaje = null;
    menu.abrir(T.camp.enElCampamento, [{ id: 'seguir', texto: T.camp.momentos.seguir }], () => false, lineas.join('\n'), {});
  }

  /**
   * Qué hace cada cosa. Los que todavía no tienen un sistema detrás contestan
   * con lo que hoy sí se puede saber (qué caballo tenés, con qué arma salís)
   * en vez de quedarse mudos: un objeto que no responde enseña a ignorarlo.
   */
  function usar(o) {
    switch (o.id) {
      case 'fogata':
        sentado = !sentado;
        // En el estilo nuevo te sentás en el tronco, mirando el fuego.
        if (sentado && estiloNuevo.activo) {
          x = CAMPAMENTO.centro.x + ASIENTO.x;
          y = CAMPAMENTO.centro.y + ASIENTO.y;
          mirando = 0;
        }
        decir(sentado
          ? T.camp.fogataSentado(gameState.fame, gameState.honor)
          : T.camp.fogataParado);
        audio.play('cover');
        break;

      case 'carpa':
        /**
         * DORMIR DA VUELTA LA HORA, y con eso la carpa deja de ser el único
         * objeto del campamento que no hacía nada. La hora decide qué está
         * abierto en el pueblo (el establo y la armería cierran de noche), así
         * que dormir pasa a ser una decisión: no es "pasar el tiempo", es
         * "abrir la mitad del pueblo y cerrar la otra".
         */
        // 📅 🔁 Ya no da vuelta el día de un golpe: abre el papel para descansar hasta la próxima parte del día,
        // dormir hasta la mañana o esperar varios días, con lo que va a pasar mientras tanto *(Santi: "la idea de la
        // carpa me gustó"; antes "solo apretás E muchas veces")*.
        abrirCarpa();
        break;

      case 'cajon':
        abrirCajon();
        break;

      case 'poste':
        // [E] lo atiende. Montarlo es [F], y va aparte (ver `update`): es el
        // único objeto del campamento con dos verbos, porque es el único que
        // además de ser una cosa es un VEHÍCULO.
        abrirPoste();
        break;

      default:
        // (🔥 Si trae un momento, el momento; si no, la charla de siempre.)
        if (abrirMomento(o.id)) break;
        if (MIEMBRO[o.id]) abrirCharla(o.id);
        break;

      case 'cartel':
        // El mapa de rutas de la región. Ahí se elige qué tren tomar, y desde
        // ahí se sale al galope.
        decir(T.camp.cartelIr, 1.0);
        audio.play('escape');
        scenes.goTo('mapa');
        break;
    }
  }

  /**
   * EQUIPARSE EN EL CAMPAMENTO — el cajón y el poste dejaron de sólo informar.
   *
   * *(pedido de Santi: "desde el cajón de armas del campamento el jugador
   * deberá equiparse como quiera. Y en el poste con el caballo, el caballo que
   * quiera. El jugador no debería ir hasta el pueblo para equipar lo que
   * quiere")*
   *
   * Hasta acá los dos te decían una frase con lo que llevabas puesto, y cambiar
   * de arma significaba caminar hasta el pueblo, esperar a que fuera de día y
   * pagarla de nuevo — porque comprar ERA equipar. Ahora la tienda decide qué
   * TENÉS (`gameState.owned`) y estos dos objetos, qué llevás hoy.
   *
   * EL MENÚ SE REFRESCA SIN CERRARSE (`alElegir` devuelve `true`): cambiás de
   * revólver y la lista se vuelve a dibujar con la marca movida, así que podés
   * probar los dos y quedarte con uno sin volver a abrir el cajón. Es la
   * diferencia entre revolver un cajón y navegar un menú.
   */
  function opcionesDe(ranura, catalogo, puesto) {
    const tenidos = (gameState.owned && gameState.owned[ranura]) || [];
    return tenidos
      .filter((id) => catalogo[id])
      .map((id) => ({
        id,
        // La marca de lo que llevás puesto: la misma idea que la rayita de la
        // tienda, en texto — se ve cuál es el tuyo sin tener que recordarlo.
        texto: (id === puesto ? '▸ ' : '  ') + catalogo[id].name,
      }));
  }

  function abrirCajon() {
    /**
     * Las dos ranuras van en UNA sola lista, no en dos menús encadenados: el
     * cajón es un cajón, y lo que hacés es revolverlo. Un revólver y un cuchillo
     * conviven ahí adentro sin necesidad de explicar que son dos categorías.
     */
    const opciones = [
      ...opcionesDe('weapon', WEAPONS, gameState.weapon),
      ...opcionesDe('melee', MELEE, gameState.melee),
    ];
    if (opciones.length === 0) { decir(T.camp.cajonVacio); return; }

    menu.abrir(T.camp.cajonTitulo, opciones, (id) => {
      if (WEAPONS[id]) gameState.weapon = id;
      else if (MELEE[id]) gameState.melee = id;
      audio.play('loot');
      menu.refrescar([
        ...opcionesDe('weapon', WEAPONS, gameState.weapon),
        ...opcionesDe('melee', MELEE, gameState.melee),
      ]);
      return true;   // sigue abierto: podés probar otra sin reabrir el cajón
    });
  }

  function abrirPoste() {
    /**
     * ALIMENTARLO SIGUE ESTANDO, y va primero. Era lo único que hacía el poste
     * con [E] y sacarlo para meter un menú de inventario habría cambiado un
     * gesto de cuidar al animal por uno de administrar objetos. Ahora es la
     * primera opción de la lista: lo normal sigue siendo lo más fácil.
     */
    const opciones = [
      { id: '__comer', texto: T.camp.posteComer },
      ...opcionesDe('horse', HORSES, gameState.horse || 'criollo'),
    ];
    menu.abrir(T.camp.posteTitulo, opciones, (id) => {
      if (id === '__comer') {
        decir(T.camp.poste(caballoActual(gameState).name));
        audio.play('cover');
        return false;   // se cierra: atenderlo es una sola cosa y ya está
      }
      gameState.horse = id;
      audio.play('loot');
      menu.refrescar([
        { id: '__comer', texto: T.camp.posteComer },
        ...opcionesDe('horse', HORSES, gameState.horse),
      ]);
      return true;
    });
  }

  /**
   * 🤠 HABLAR CON UNO DE LA BANDA: te saluda según cómo está con vos (su lealtad, en palabras), y le podés preguntar
   * cómo anda. (🔁 Reemplaza a la charla con el compañero de las formas, guardado en systems/companero.js.) Los momentos
   * que piden una decisión vienen en la etapa 3 de la rebanada.
   */
  /**
   * 🔥 UN MOMENTO DEL CAMPAMENTO (ver data/momentos.js): lo que pasa, arriba; lo que podés contestar, abajo. Al elegir
   * se ve lo que pasó después, lo que pagaste y a quién le cambió la lealtad (en palabras). Devuelve false si `quien`
   * no trae nada.
   */
  /**
   * 📜 LA FIGURA DEL QUE HABLA, para el papel del diálogo (engine/menu.js): uno de la banda o el forastero, parado de
   * frente, con su ropa de siempre.
   */
  function figuraDe(id) {
    const aspecto = id === 'forastero' ? ASPECTO_FORASTERO : MIEMBRO[id] && MIEMBRO[id].aspecto;
    if (!aspecto) return null;
    return (r, fx, pies) => dibujarPersona(r, {
      tipo: 'pasajero', interior: true, x: fx, pies, angulo: Math.PI / 2,
      nuevo: { arma: null, funda: true, aspecto, piernas: 'quieto' },
    });
  }

  /** Las figuras de un momento: el que lo trae y los que vienen con él (el reparto: Frank y Santiago). */
  function figurasDelMomento(p) {
    const ids = [p.quien, ...((MOMENTOS[p.id] && MOMENTOS[p.id].tambien) || [])]
      .filter((id) => id === 'forastero' || (gameState.banda && gameState.banda[id] && gameState.banda[id].esta));
    return ids.map(figuraDe).filter(Boolean);
  }

  /** 📅 El cartelito de la fecha: "6 de agosto · Noche", en un papel chico arriba al medio. */
  function cartelDeLaFecha(r) {
    const Tt = T.tiempo, t = completarTiempo(gameState), f = fechaDe(t.dia);
    const texto = Tt.cartel(Tt.fecha(f.dia, Tt.meses[f.mes]), Tt.partes[TIEMPO.partes[t.parte]]);
    const w = Math.ceil(r.medir(texto)) + 18, h = 16, x = Math.round(r.width / 2 - w / 2);
    papel(r, x, 3, w, h);
    r.text(texto, r.width / 2, 3 + h / 2 + 0.5, TINTAS.TINTA, 'center', { halo: null });
  }

  /**
   * 📅 LA CARPA: descansar hasta la próxima parte del día, dormir hasta la mañana, o esperar varios días. Abajo de la
   * pregunta, lo que va a pasar en esos días (quién se cura), para decidir si esperar.
   */
  function abrirCarpa() {
    const Tt = T.tiempo, K = Tt.carpa, t = completarTiempo(gameState);
    const siguiente = (t.parte + 1) % TIEMPO.partes.length;
    const opciones = [{ id: 'descansar', texto: K.descansar(Tt.partesMin[TIEMPO.partes[siguiente]]) }];
    // (Si la próxima ya es la mañana, "dormir hasta la mañana" sería lo mismo.)
    if (siguiente !== 0) opciones.push({ id: 'dormir', texto: K.dormir });
    opciones.push({ id: 'esperar', texto: K.esperar }, { id: 'nada', texto: K.nada });
    mensaje = null;
    menu.abrir(K.titulo, opciones, (op) => {
      if (op === 'descansar') dejarPasar(1);
      else if (op === 'dormir') dejarPasar(partesHasta(gameState, 0));
      else if (op === 'esperar') { abrirEsperar(); return true; }
      return false;
    }, K.cuerpo + '\n' + resumenDeLoQueViene(Math.max(...TIEMPO.esperarDias)));
  }

  function abrirEsperar() {
    const Tt = T.tiempo, K = Tt.carpa, t = gameState.tiempo;
    const opciones = TIEMPO.esperarDias.map((n) => {
      const f = fechaDe(t.dia + n);
      return { id: String(n), texto: K.dias(n, Tt.fecha(f.dia, Tt.meses[f.mes])) };
    });
    opciones.push({ id: 'no', texto: K.volver });
    menu.abrir(K.esperarTitulo, opciones, (op) => {
      if (op !== 'no') dejarPasar(partesDeDias(Number(op)));
      return false;
    }, resumenDeLoQueViene(Math.max(...TIEMPO.esperarDias)));
  }

  /** "Lo que viene:" y abajo, un renglón por cosa: "10 de agosto: Tommy se cura" (o que no hay nada marcado). */
  function resumenDeLoQueViene(dias) {
    const Tt = T.tiempo, lista = loQueViene(gameState, dias);
    if (!lista.length) return Tt.carpa.vieneNada;
    return Tt.carpa.viene + '\n' + lista.map((x) => {
      const f = fechaDe(x.dia);
      return `${Tt.fecha(f.dia, Tt.meses[f.mes])}: ${x.que === 'jmc' ? Tt.jmc : Tt.secura(MIEMBRO[x.quien].corto)}`;
    }).join('\n');
  }

  /** Deja pasar el tiempo y cuenta cómo quedó: el día, la parte del día y quién se curó. */
  function dejarPasar(partes) {
    const { curados } = pasar(gameState, partes);
    const Tt = T.tiempo, t = gameState.tiempo, f = fechaDe(t.dia);
    let texto = Tt.ahora(Tt.fecha(f.dia, Tt.meses[f.mes]), Tt.partesMin[TIEMPO.partes[t.parte]]);
    for (const id of curados) texto += ' ' + Tt.curado(MIEMBRO[id].corto);
    // (🙂 Y lo que pasó mientras: quién volvió de practicar, quién aprendió o perdió algo.)
    const noticias = sacarNoticias();
    // ✉️ (Si caíste en la noche de J.Mc.)
    if (revisarEncargo(gameState) === 'entrega') noticias.push(T.camp.momentos.esLaNoche);
    avisar([texto, ...noticias]);
    audio.play('cover');
  }

  /** 📋 La ficha: los de la banda que siguen con vos, en el orden de siempre. */
  function abrirFicha(i = 0) {
    const ids = BANDA.map((m) => m.id).filter((id) => gameState.banda && gameState.banda[id] && gameState.banda[id].esta);
    mensaje = null;
    return ficha.abrir(ids, i, figuraDe);
  }

  function abrirMomento(quien) {
    const p = gameState.campamento && pendienteDe(gameState, quien);
    if (!p) return false;
    const M = T.camp.momentos;
    if (p.id === 'aviso') {
      menu.abrir(MIEMBRO[quien].corto, [{ id: 'ok', texto: M.aviso.ok }], () => { elegir(gameState, p, 'ok'); return false; }, M.aviso[quien], { figuras: [figuraDe(quien)].filter(Boolean) });
      return true;
    }
    const textos = M[p.id];
    // (🎭 Algunos dependen de quién lo trae: el herido, el de los caballos.)
    const nombre = MIEMBRO[p.quien] ? MIEMBRO[p.quien].corto : '';
    const segun = (v) => (typeof v === 'function' ? v(nombre) : v);
    // (🗣️ El humor con que lo agarras, antes de elegir: lo que contesta depende de eso.)
    const elQueHabla = gameState.banda && gameState.banda[p.quien];
    const humorAntes = elQueHabla ? palabraDeHumor(elQueHabla.humor) : 'tranquilo';
    // (🎭 Lo que hay que pagar entero, como el médico, no se ofrece si no te alcanza.)
    const opciones = opcionesDelMomento(p.id, gameState).filter((op) => !op.pagoEntero || gameState.money >= op.dinero).map((op) => {
      const t = textos.opciones[op.id];
      return { id: op.id, texto: typeof t === 'function' ? t(Math.min(op.dinero || 0, gameState.money)) : t };
    });
    const figuras = figurasDelMomento(p);
    menu.abrir(segun(textos.titulo), opciones, (opId) => {
      const r = elegir(gameState, p, opId);
      const lineas = [segun(porHumor(textos.resultado[opId], humorAntes))];
      if (r.dinero) lineas.push(M.pagaste(r.dinero));
      // 🗞️ (Lo que contó el forastero, que ya quedó en el horario.)
      if (r.rumor) lineas.push(contarRumor('forastero', r.rumor));
      for (const c of r.cambios) lineas.push(M.cambio(MIEMBRO[c.id].corto, T.camp.banda.palabras[c.palabra]));
      // 📒 Lo que anotó cada uno en su libreta (todo lo que cuenta se ve, con su motivo).
      for (const a of r.anotes || []) lineas.push(T.libreta.anota(MIEMBRO[a.id].corto, a.lado, motivoDeLibreta(a.motivo, a.lado), a.veces));
      for (const c of r.humores || []) lineas.push(M.cambioHumor(MIEMBRO[c.id].corto, T.camp.banda.humor[c.humor]));
      // (Se abre otro encima: `true` deja abierto el nuevo.)
      // (🏁 Si con esto terminó la partida, al seguir viene el final.)
      menu.abrir(segun(textos.titulo), [{ id: 'seguir', texto: M.seguir }], () => {
        if (!gameState.finDelJuego) return false;
        abrirFin();
        return true;
      }, lineas.join('\n'), { figuras });
      return true;
    }, segun(textos.texto), { figuras });
    return true;
  }

  /**
   * 🏁 EL FINAL *(Santi: "que se quede ahí el juego. O sea, es el único final por ahora")*: le diste a J.Mc. lo que
   * pedía. No se cierra: la única salida es empezar de nuevo.
   */
  function abrirFin() {
    const F = T.camp.momentos.fin;
    menu.abrir(F.titulo, [{ id: 'otra', texto: F.otra }], () => {
      resetGame();
      scenes.goTo('camp');
      return false;
    }, F.texto, {});
  }

  /**
   * 🗣️ Lo que contesta según el humor (VOCES.md: "dos o tres respuestas según el humor con que lo agarras"): un texto
   * suelto vale para todos; si no, `contento`, `tranquilo`, y `mal` para de malas y furioso.
   */
  /** 📒 El texto de una línea de la libreta. */
  function motivoDeLibreta(motivo, lado) {
    const L = T.libreta.motivos, m = L[motivo];
    const t = m && (typeof m === 'string' ? m : m[lado === 'borra' ? 'q' : lado]);
    return t || (lado === 'f' ? L.otroFavor : L.otraQueja);
  }

  function porHumor(v, humor) {
    if (!v || typeof v !== 'object') return v;
    const mal = humor === 'deMalas' || humor === 'furioso';
    return v[humor] ?? (mal ? v.mal : null) ?? v.tranquilo;
  }

  /**
   * 🗣️ "¿CÓMO ESTÁS?" (VOCES.md: "contesta con su humor y con lo que le pasó hace poco"). Lo fuerte que le pasó en los
   * últimos días va primero (la cárcel, una herida, lo que le diste o le negaste); si no, su humor de hoy.
   */
  function comoEsta(id, e) {
    const C = T.camp.banda.comoEsta[id], h = palabraDeHumor(e.humor), lealtad = palabraDe(e);
    const fue = (que, dias = 3) => lePaso(gameState, e, que, dias);
    let k = null;
    if (fue('fianza')) k = 'fianza';
    else if (id === 'santiago') {
      k = e.herido ? 'herido' : fue('miParte:dar') || fue('miParte:trato') ? 'miParte' : fue('mexico:dar', 4) && h !== 'furioso' ? 'mexico' : null;
    } else if (id === 'frank') {
      // (La única vez que nombra a su esposa: muy firme contigo y de malas. Una sola vez en la partida.)
      if (lealtad === 'firme' && h === 'deMalas' && !e.dijoEsposa) { k = 'esposa'; e.dijoEsposa = true; }
      else k = e.herido ? 'herido' : fue('botella:quitar', 2) ? 'botella' : e.resaca && h === 'tranquilo' ? 'resaca' : null;
    } else if (id === 'tommy') {
      k = fue('adelanteCumplido') ? 'adelante' : fue('civilesHonorable', 4) ? 'civiles' : e.herido ? 'herido' : null;
    }
    return (k && C[k]) || C[h];
  }

  /** 🃏 La mano de cartas con Frank: el resultado, y a quién le cambió el humor. */
  function abrirMano(id, figuras) {
    const B = T.camp.banda, M = T.camp.momentos;
    const r = jugarUnaMano(gameState, id);
    const lineas = [B.manoTexto, r.gano ? B.manoGana : B.manoPierde];
    for (const c of r.humores) lineas.push(M.cambioHumor(MIEMBRO[c.id].corto, B.humor[c.humor]));
    if (r.baraja && T.camp.noticias[r.baraja]) lineas.push(T.camp.noticias[r.baraja](MIEMBRO[id].corto, T.rasgos.baraja));
    audio.play('cover');
    menu.abrir(MIEMBRO[id].corto, [{ id: 'seguir', texto: M.seguir }], () => false, lineas.join('\n'), { figuras });
  }

  function abrirCharla(id) {
    const m = MIEMBRO[id], estado = gameState.banda[id];
    const palabra = palabraDe(estado);
    const B = T.camp.banda;
    // (📜 En el papel: su nombre, lo que te dice al verte, y lo que contesta, en el mismo papel.)
    const figuras = [figuraDe(id)].filter(Boolean);
    // 🎯 Mandarlo a practicar: si no está herido ni practicando ya.
    const puedePracticar = !estado.herido && !estado.practica;
    // 🕵️ Mandarlo a mirar un tren: igual que practicar, y si hay alguno que se pueda mirar.
    const puedeEspiar = puedePracticar && espiables(gameState, PARTES_DE_PRACTICA, trenesMirados(gameState)).length > 0;
    // 🃏 Una mano de cartas: con el que es Bueno con la baraja, si está aquí y no jugó hoy.
    const puedeMano = tiene(estado, 'baraja') && !estado.practica && estado.manoDia !== (gameState.tiempo ? gameState.tiempo.dia : 0);
    menu.abrir(m.corto, [
      { id: 'como', texto: B.comoAndas },
      ...(puedePracticar ? [{ id: 'practicar', texto: B.practicar }] : []),
      ...(puedeEspiar ? [{ id: 'espiar', texto: B.espiar }] : []),
      ...(puedeMano ? [{ id: 'mano', texto: B.mano }] : []),
      { id: 'nada', texto: B.nada },
    ], (op) => {
      if (op === 'practicar') { abrirPractica(id, figuras); return true; }
      if (op === 'espiar') { abrirEspia(id, figuras); return true; }
      if (op === 'mano') { abrirMano(id, figuras); return true; }
      if (op !== 'como') return false;
      const dice = comoEsta(id, estado) + (estado.herido ? ' ' + B.herido : '')
        + (estado.practica ? ' ' + (estado.practica.espia ? B.espiando : B.practicando(T.rasgos[estado.practica.hab])) : '');
      menu.abrir(m.corto, [{ id: 'seguir', texto: T.camp.momentos.seguir }], () => false, dice, { figuras });
      return true;
    }, B.saludo[id][palabra][palabraDeHumor(estado.humor)], { figuras });
  }

  /**
   * 🎯 QUÉ PRACTICA *(Santi eligió "la A"; "el NPC se toma el día completo")*: se va el día entero desde ahora, y a la
   * noche descansa en el campamento. Al volver cuenta un tercio de un uso de verdad. Sólo hablado: las latas y lo demás
   * se dibujan después.
   */
  function abrirPractica(id, figuras) {
    const m = MIEMBRO[id], e = gameState.banda[id], B = T.camp.banda;
    const opciones = PRACTICABLES.map((hab) => {
      const h = e.habilidades && e.habilidades[hab];
      return { id: hab, texto: B.practicarOpcion(T.rasgos[hab], !!(h && h.tiene), !!(h && h.estrella)) };
    });
    opciones.push({ id: 'no', texto: B.practicarVolver });
    menu.abrir(B.practicarTitulo(m.corto), opciones, (hab) => {
      if (hab === 'no') return false;
      mandarAPracticar(gameState, id, hab);
      decir(B.seVaAPracticar(m.corto, T.rasgos[hab]), 3.5);
      audio.play('cover');
      return false;
    }, B.practicarCuerpo, { figuras });
  }

  /**
   * 🕵️ QUÉ TREN VA A MIRAR (etapa C, BRUJULA: "Mandar a uno de la banda a mirarlo"): los que sabés y todavía no viste,
   * si vuelve antes de que pasen. Se va el día entero, como a practicar; a la noche cuenta lo que vio
   * (`volvioElEspia` en systems/horario.js, y `informeDelEspia` acá).
   */
  function abrirEspia(id, figuras) {
    const m = MIEMBRO[id], B = T.camp.banda, Tm = T.mapa, R = T.rumores;
    const trenes = espiables(gameState, PARTES_DE_PRACTICA, trenesMirados(gameState)).slice(0, 5);
    const opciones = trenes.map((t) => {
      const f = fechaDe(t.dia);
      const cuando = t.sabes === 'rumor' ? Tm.dia(T.tiempo.semanaLarga[f.semana], f.dia)
        : `${Tm.dia(T.tiempo.semanaLarga[f.semana], f.dia)}, ${T.tiempo.partesMin[TIEMPO.partes[t.parte]].toUpperCase()}`;
      return { id: String(t.id), texto: `${cuando} · ${t.tipoTren.short}${t.sabes === 'rumor' ? ' · ' + Tm.rumor : ''} · ${R.vias[t.ruta] || t.ruta}` };
    });
    opciones.push({ id: 'no', texto: B.practicarVolver });
    menu.abrir(B.espiarTitulo(m.corto), opciones, (op) => {
      if (op === 'no') return false;
      const tren = trenes.find((t) => String(t.id) === op);
      mandarAEspiar(gameState, id, tren.id);
      decir(B.seVaAEspiar(m.corto, R.vias[tren.ruta] || tren.ruta), 3.5);
      audio.play('cover');
      return false;
    }, B.espiarCuerpo, { figuras });
  }

  /** 🕵️ Lo que cuenta el que volvió de mirar un tren, en palabras. */
  function informeDelEspia(id, tren, que) {
    const E = T.espia, R = T.rumores, nombre = MIEMBRO[id] ? MIEMBRO[id].corto : id;
    const via = R.vias[tren.ruta] || tren.ruta;
    if (que === 'falso') return E.falso(nombre, via);
    if (que === 'tarde') return E.tarde(nombre);
    const f = fechaDe(tren.dia);
    // (De un rumor sigue sin saberse la parte del día: sólo el día.)
    const cuando = `${R.dias[f.semana]} ${f.dia}` + (tren.sabes === 'rumor' ? '' : ` a la ${T.tiempo.partesMin[TIEMPO.partes[tren.parte]]}`);
    let texto = E.basico(nombre, cuando, via, E.tipos[tren.tipoTren.id] || tren.tipoTren.short, E.especiales[tren.especial] || '');
    // (El maletín, sólo si J.Mc. lo está esperando y todavía no lo tenés.)
    const lleva = tren.maletinEn && encargoAbierto(gameState) && !tieneMaletin(gameState);
    if (tren.visto !== 'completo') return texto + (lleva ? E.maletinVa : '');
    const lista = tren.composicion.map((w) => E.vagones[w] || w);
    texto += E.completo(lista, tren.dificultad.short.toLowerCase());
    if (tren.cajaGordaEn) { const w = tren.composicion[tren.cajaGordaEn - 1]; texto += E.caja(tren.cajaGordaEn, E.vagones[w] || w); }
    if (lleva) {
      const w = tren.composicion[tren.maletinEn - 1];
      const donde = (T.ambiente.escondites[(ESCONDITES_DEL_MALETIN[w] || [])[0]] || '').toLowerCase();
      texto += E.maletin(tren.maletinEn, E.vagones[w] || w, donde);
    }
    return texto;
  }

  // ----------------------------------------------------------------- sonido

  /**
   * EL FONDO DEL CAMPAMENTO — ver `CONFIG.ambiente` para los volúmenes.
   *
   * Son dos capas y la segunda es el reloj del juego: **la fogata sólo suena de
   * noche**, porque de día está apagada. Es la misma regla que ya dice la hora
   * sin escribirla (fuego encendido = de noche); ahora también se oye.
   */
  function arrancarSonido() {
    const a = CONFIG.ambiente;
    const dia = gameState.esDeDia;
    // El desierto: viento grave, en ráfagas. Sin el `respira` esto es estática
    // — ver `soplar` en engine/audio.js.
    audio.ambiente('desierto', { cutoff: 300, q: 0.6, type: 'lowpass',
      gain: dia ? a.campDiaGain : a.campNocheGain,
      respira: { profundidad: a.vientoProfundidad, cada: a.vientoCada } });
    if (dia) {
      audio.quitarAmbiente('fuego');
    } else {
      audio.ambiente('fuego', { cutoff: 700, q: 0.8, type: 'lowpass', gain: a.campFuegoGain });
    }
    chispaTimer = 0;
    audio.arrancarMusica();
  }

  function exit() {
    audio.quitarAmbiente('desierto');
    audio.quitarAmbiente('fuego');
    audio.pararMusica();
  }

  /** Los chasquidos del fuego, irregulares. De día no hay fuego que chasquee. */
  function updateSonido(dt) {
    audio.updateMusica(dt);
    if (gameState.esDeDia) return;
    const a = CONFIG.ambiente;
    chispaTimer -= dt;
    if (chispaTimer <= 0) {
      chispaTimer = a.chispaCada + Math.random() * a.chispaVariacion;
      audio.play('chispa');
    }
  }

  function update(dt) {
    scroll += dt;
    avisoLejos = Math.max(0, avisoLejos - dt);
    updateSonido(dt);

    // Con el cajón abierto no caminás: tenés las dos manos adentro.
    if (menu.update(input)) return;
    // 🏁 (Terminada la partida, el final no se puede cerrar.)
    if (gameState.finDelJuego) { abrirFin(); return; }
    // 📋 Con la ficha abierta, tampoco.
    if (ficha.update(input)) return;
    if (input.wasPressed('Tab') && abrirFicha()) return;
    // 📅 El calendario, igual.
    if (calendario.update(input)) return;
    if (input.wasPressed('KeyC') && calendario.abrir()) return;

    // 🗑️ El atajo [1] al techo con jinetes ya no existe *(Santi: "quiero que
    // borres el atajo al techo")*.
    /**
     * 🧪 [4] TE LARGA ADENTRO DE UN VAGÓN DE PASAJEROS *(Santi: "construí un
     * atajo para ir directo a un vagón de pasajeros")*, para ver el estilo nuevo
     * ([F9]) sin cruzar el tren. Es un asalto normal: cuenta como cualquiera.
     * 🔁 Ahora al vagón que se está dibujando: EL DE GUARDIAS, y el tren lo trae siempre (`forzarVagon`),
     * y arrancás EN EL ENGANCHE DE ATRÁS, afuera (`pruebaEnganche`) *(Santi: "hacé un atajo para aparecer
     * en el enganche anterior al vagón de guardias así me puedo meter en silencio para probarlo")*; antes
     * primera clase (*"pon el atajo en el botón 4"*), el dormitorio y el comedor.
     * 🔁 Ahora EL BLINDADO, y sus dos puertas de chapa se empujan como las de madera (`pruebaPuertas`)
     * *(Santi: "que la puerta o no esté o que la atraviese fácilmente así puedo verlo por dentro")*.
     *
     * ⚠️ SACARLO antes de mostrar el juego, con los otros.
     */
    if (input.wasPressed('Digit4')) {
      scenes.goTo('raid', { tipoTren: 'pasajeros', caballoEn: 1, pruebaVagon: 'blindado', forzarVagon: 'blindado', pruebaEnganche: true, pruebaPuertas: true });
      return;
    }
    /**
     * 🧪 [6] LO MISMO, PERO CON EL SHERIFF EN TU VAGÓN *(Santi: "hacé un atajo para
     * aparecer con el sheriff en el tren de pasajeros así veo bien como quedó")*:
     * el Sheriff y sus tres viajan en el vagón donde arrancás.
     *
     * ⚠️ SACARLO antes de mostrar el juego, con los otros.
     */
    /**
     * 🧪 [7] LA TORMENTA *(Santi: "hacé un atajo para probar la tormenta, ponelo con el número 7")*: [7] el galope
     * al lado del tren lloviendo, y Shift + [7] la huida lloviendo, con los cuatro jinetes (eligió "los dos").
     * 🔁 Antes el [7] te ponía 950 de recompensa para el cazarrecompensas; Santi eligió reemplazarlo.
     *
     * ⚠️ SACARLO antes de mostrar el juego, con los otros.
     */
    if (input.wasPressed('Digit7')) {
      if (input.isDown('ShiftLeft') || input.isDown('ShiftRight')) {
        scenes.goTo('huida', { summary: { money: 400, kills: 0, outcome: 'escaped' }, jinetes: 4, prueba: true, clima: 'tormenta', arma: WEAPONS[gameState.weapon] });
      } else {
        scenes.goTo('ride', { tipoTren: 'pasajeros', clima: 'tormenta' });
      }
      return;
    }
    /**
     * 🧪 [8] UN TREN CON LOS FRENOS ROTOS, arrancando EN EL VAGÓN QUE SE ESTÁ EDITANDO (el tren lo trae
     * siempre: `forzarVagon`) *(Santi: "por el vagón que vayamos a editar quiero que el atajo 8 esté ocupado por ese
     * vagón")*: hoy, EL TECHO: arrancás arriba del primer vagón de pasajeros, para ir viendo al jugador en el estilo
     * nuevo. (La huida quedó en Shift+[7].)
     *
     * ⚠️ SACARLO antes de mostrar el juego, con los otros.
     */
    if (input.wasPressed('Digit8')) {
      // (⛈️ Shift + [8]: el mismo techo, con tormenta.)
      const clima = input.isDown('ShiftLeft') || input.isDown('ShiftRight') ? 'tormenta' : undefined;
      scenes.goTo('raid', { tipoTren: 'pasajeros', caballoEn: 1, pruebaVagon: 'pasajeros', enTecho: true, prueba: true, clima });
      return;
    }
    if (input.wasPressed('Digit6')) {
      scenes.goTo('raid', { tipoTren: 'pasajeros', caballoEn: 1, pruebaVagon: 'pasajeros', jefeForzado: 'sheriff', pruebaSheriff: true });
      return;
    }
    /**
     * 🧪 [2] TE PONE LA ESCOPETA SIN COMPRARLA *(Santi: "dejame un atajo para
     * equipármela sin tener que comprarla")*; otra vez [2], vuelve el arma que
     * tenías. No la agrega a lo tuyo: en la tienda sigue costando $1.200.
     *
     * ⚠️ SACARLO antes de mostrar el juego, con los otros.
     */
    // 🧪 [3], lo mismo con el Winchester.
    for (const [teclaAtajo, armaPrueba] of [['Digit2', 'escopeta'], ['Digit3', 'winchester']]) {
      if (!input.wasPressed(teclaAtajo)) continue;
      if (gameState.weapon === armaPrueba) {
        gameState.weapon = armaAntesDeLaPrueba || 'colt';
      } else {
        if (gameState.weapon !== 'escopeta' && gameState.weapon !== 'winchester') armaAntesDeLaPrueba = gameState.weapon;
        gameState.weapon = armaPrueba;
      }
      decir(gameState.weapon === armaPrueba ? T.camp.atajoArmaSi(WEAPONS[armaPrueba].short) : T.camp.atajoEscopetaNo, 2);
    }
    /**
     * 🧪 [5] TE PONE EL CUCHILLO SIN COMPRARLO *(Santi: "hacé un atajo para
     * equipar el cuchillo")*, para probar el tajo y la vaina; otra vez [5],
     * vuelve lo que tenías para pegar. No lo agrega a lo tuyo: en la tienda
     * sigue costando $450.
     *
     * ⚠️ SACARLO antes de mostrar el juego, con los otros.
     */
    if (input.wasPressed('Digit5')) {
      if (gameState.melee === 'cuchillo') {
        gameState.melee = meleeAntesDeLaPrueba || 'culata';
      } else {
        meleeAntesDeLaPrueba = gameState.melee || 'culata';
        gameState.melee = 'cuchillo';
      }
      decir(gameState.melee === 'cuchillo' ? T.camp.atajoCuchilloSi : T.camp.atajoCuchilloNo(MELEE[gameState.melee].short), 2);
    }

    if (mensaje) {
      mensaje.life -= dt;
      if (mensaje.life <= 0) mensaje = null;
    }

    let dx = 0, dy = 0;
    if (input.anyDown('KeyA', 'ArrowLeft')) dx -= 1;
    if (input.anyDown('KeyD', 'ArrowRight')) dx += 1;
    if (input.anyDown('KeyW', 'ArrowUp')) dy -= 1;
    if (input.anyDown('KeyS', 'ArrowDown')) dy += 1;

    // Moverse te levanta del fuego: nadie camina sentado.
    if ((dx !== 0 || dy !== 0) && sentado) sentado = false;

    if (!sentado && (dx !== 0 || dy !== 0)) {
      if (dx !== 0 && dy !== 0) {
        const inv = 1 / Math.SQRT2;
        dx *= inv; dy *= inv;
      }
      x += dx * CONFIG.player.speed * dt;
      y += dy * CONFIG.player.speed * dt;
      // Y mira hacia donde camina: sin esto la persona quedaría siempre de
      // frente y caminando de costado.
      mirando = Math.atan2(dy, dx);
      chocarConLasCosas();
      limitarAlClaro();
    }

    const o = objetoCerca();
    if (o && input.wasPressed('KeyE')) usar(o);

    /**
     * MONTAR Y SALIR PARA EL PUEBLO.
     *
     * Va en su propia tecla y no en la lista de `usar` porque el caballo es
     * la única cosa del campamento que hace DOS cosas distintas: se lo
     * atiende (`E`) y se lo monta (`F`). Meter las dos en un solo botón
     * obligaría a un submenú, que es justo lo que este juego evita en todos
     * lados — y el mismo `F` es el que te trae de vuelta desde el pueblo.
     */
    if (o && o.id === 'poste' && input.wasPressed('KeyF')) {
      decir(T.camp.posteMontar, 1.0);
      audio.play('escape');
      // 📅 Ir al pueblo gasta una parte del día.
      pasar(gameState, TIEMPO.cuesta.pueblo);
      scenes.goTo('town');
    }
  }

  /**
   * 🔻 LAS COSAS DEL CAMPAMENTO SON SÓLIDAS *(Santi: "quiero que ajustes las
   * colisiones en el campamento")*. No lo eran: en la vista de arriba el
   * jugador era una caja de 13 que pasaba por encima de todo y nadie lo
   * notaba, pero con una persona de 20 parada en tres cuartos se veía
   * clarito cómo atravesabas la carpa, el cajón y el fuego.
   *
   * Cada cosa tiene su HUELLA EN EL PISO, medida en el mundo (que sigue
   * siendo redondo, ver `PROF`): es lo que ocupa apoyado en la tierra, no lo
   * que ocupa dibujado. Por eso el cartel es angosto de fondo aunque su tabla
   * sea ancha — por abajo de la tabla no se pasa (queda a la altura del
   * pecho), pero tampoco es una pared de fondo.
   *
   * Si quedás adentro de una, te saca por el lado más corto: así podés seguir
   * caminando pegado al borde de la carpa en vez de frenarte en seco, que es
   * la misma idea que el límite del claro.
   *
   * Los alcances para usar cada cosa no cambiaron y todos llegan desde afuera
   * de la huella (el más justo es el cajón: 14 de huella contra 24 de alcance).
   */
  const HUELLAS = {
    carpa: { x1: -28, x2: 20, y1: -9, y2: 2 },
    cajon: { x1: -14, x2: 14, y1: -8, y2: 2 },
    poste: { x1: -24, x2: 24, y1: -4, y2: 4 },    // el palenque y el caballo
    cartel: { x1: -16, x2: 16, y1: -13, y2: 2 },
    companero: { x1: -4, x2: 4, y1: -3, y2: 2 },
    fogata: { radio: 13 },
  };
  /** Lo que ocupa el jugador alrededor de sus pies. */
  const PIES = { x: 4, y: 3 };

  function chocarConLasCosas() {
    for (const o of [...objetosEnMundo(), ...decoradoEnMundo()]) {
      // (En el estilo nuevo, el caballo atado está a la izquierda del poste y ocupa eso.)
      const h = o.huella || (o.id === 'poste' && estiloNuevo.activo ? { x1: -47, x2: 4, y1: -4, y2: 4 } : HUELLAS[o.id]);
      if (!h) continue;
      if (h.radio) {
        const dx = x - o.x, dy = y - o.y;
        const d = Math.hypot(dx, dy);
        const minimo = h.radio + PIES.x;
        if (d < minimo) {
          const k = d > 0.01 ? minimo / d : 1;
          x = o.x + (d > 0.01 ? dx : 0) * k;
          y = o.y + (d > 0.01 ? dy : minimo);
        }
        continue;
      }
      const x1 = o.x + h.x1 - PIES.x, x2 = o.x + h.x2 + PIES.x;
      const y1 = o.y + h.y1 - PIES.y, y2 = o.y + h.y2 + PIES.y;
      if (x <= x1 || x >= x2 || y <= y1 || y >= y2) continue;
      const salidas = [[x - x1, -1, 0], [x2 - x, 1, 0], [y - y1, 0, -1], [y2 - y, 0, 1]];
      salidas.sort((a, b) => a[0] - b[0]);
      const [, sx, sy] = salidas[0];
      if (sx < 0) x = x1; else if (sx > 0) x = x2;
      if (sy < 0) y = y1; else if (sy > 0) y = y2;
    }
  }

  /**
   * El límite del campamento. Te empuja de vuelta al borde del círculo en vez
   * de frenarte en seco contra un plano: así podés seguir caminando en
   * paralelo al borde, que es lo que uno espera de un espacio abierto.
   */
  function limitarAlClaro() {
    const c = CAMPAMENTO.centro;
    const dx = x - c.x;
    const dy = y - c.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= CAMPAMENTO.radio) return;

    x = c.x + (dx / dist) * CAMPAMENTO.radio;
    y = c.y + (dy / dist) * CAMPAMENTO.radio;
    avisoLejos = 1.6;
  }

  // ------------------------------------------------------------------ dibujo

  /**
   * 🔺 EL CAMPAMENTO PASÓ A TRES CUARTOS *(Santi: "ten en cuenta que tiene que
   * ser 3/4. O sea, que en el campamento tiene que haber cielo por ejemplo")*.
   *
   * Era una vista CENITAL: un disco de tierra mirado desde arriba, sin
   * horizonte y sin cielo. Era la única pantalla del juego que no miraba en
   * diagonal, y por eso no se parecía a ninguna otra.
   *
   * LA REGLA ES LA MISMA DE TODO EL JUEGO (`CONFIG.tresCuartos`, el vagón, el
   * tren del galope): **lo horizontal se achata y lo vertical no**. El claro,
   * que es una circunferencia en el suelo, se dibuja como una ELIPSE; la carpa,
   * el cajón y la gente se levantan desde ahí con su alto entero.
   *
   * 🧠 Y SE ACHATA SÓLO AL DIBUJAR. El mundo del campamento sigue siendo
   * redondo: las distancias, los alcances y el límite del claro
   * (`limitarAlClaro`) no se tocaron ni un número. Si se achatara el mundo, dos
   * cosas a la misma distancia dejarían de estar a la misma distancia según
   * para dónde caminaras, que es un bicho carísimo de encontrar después.
   */
  const PROF = 0.7;

  /**
   * CUÁNTO BAJA EL CLARO EN PANTALLA para que arriba entre el cielo. Al
   * achatarse, el claro deja libre la mitad de arriba; esto lo corre para abajo
   * y ahí aparece el horizonte.
   */
  const BAJA = 30;

  /**
   * EL COLOR COMO SE VE A ESTA HORA. De noche el campamento entero se apaga:
   * la unica luz es la fogata, y una carpa iluminada a pleno a tres metros de
   * un fuego chico canta como un sticker. El caballo hace lo mismo por su
   * lado (ver `noche` en entities/caballo.js), porque es un sprite y se apaga
   * tiñendole la hoja.
   */
  function luz(hex) {
    return gameState.esDeDia ? hex : tono(hex, 0.5);
  }

  /** Del mundo del campamento a la pantalla. Es TODO el truco de los 3/4. */
  function alPiso(wy) {
    return CAMPAMENTO.centro.y + BAJA + (wy - CAMPAMENTO.centro.y) * PROF;
  }

  /** A qué altura de pantalla queda el horizonte. */
  function horizonte() {
    return alPiso(CAMPAMENTO.centro.y - CAMPAMENTO.radio) - 34;
  }

  /**
   * 🏕️ EL CAMPAMENTO DEL ESTILO NUEVO. Los dibujos están en world/estiloNuevo/campamento.js; acá se ponen en su lugar, de
   * atrás para adelante. El fondo llena toda la ventana y las cosas siguen entrando enteras en el medio.
   */
  let origenNuevo = { x: 0, y: 0 };
  function renderNuevo(r) {
    /**
     * 🐛 EL PUNTO SIEMPRE MIDE PÍXELES ENTEROS *(Santi: "el jugador se deforma mucho su forma al moverse, sobre todo su
     * sombrero")*. Con la lupa de `escenaFija`, en una ventana de menos de 1680×944 cada punto medía 2,25 píxeles: algunos
     * salían de 2 y otros de 3, y cambiaban a cada paso. Ahora van de 3; sólo en ventanas muy chicas, de 2.
     */
    if (r.canvas.width / DENSIDAD >= 280 && r.canvas.height / DENSIDAD >= 190) r.lupa(DENSIDAD);
    else r.lupaLibre((2 * DENSIDAD) / CONFIG.estilo.punto);
    const dia = gameState.esDeDia, ctx = r.ctx, o = r.centro;
    const PASO = CONFIG.estilo.punto / DENSIDAD;
    const c = CAMPAMENTO.centro;
    // Si no entra todo, se recorta el cielo: el claro se ve entero.
    const yCentrado = Math.min(o.y, r.height - (alPiso(c.y + CAMPAMENTO.radio) + 10));
    const ox = Math.round(o.x / PASO) * PASO, oy = Math.round(yCentrado / PASO) * PASO;
    origenNuevo = { x: ox, y: oy };
    const fog = objetosEnMundo().find((z) => z.id === 'fogata');
    // (🔁 Un cielo y una arena por cada parte del día; en la madrugada, la fogata en brasas *(Santi: "brasas en la madrugada")*.)
    const parte = gameState.tiempo?.parte ?? null;
    const fuego = { x: fog.x, y: alPiso(fog.y), brasas: parte === 3 };
    const cuadro = Math.floor(scroll * 10) % 8, pulso = dibujoNuevo.pulsoEn(scroll);
    r.clear('#000');
    dibujoNuevo.dibujarFondoCampamento(ctx, {
      ancho: r.width, alto: r.height, ox, oy, hy: horizonte(), dia, fuego, pulso, t: scroll, parte,
      claro: { x: c.x, y: alPiso(c.y), radio: CAMPAMENTO.radio + 16 },
    });
    ctx.save();
    ctx.translate(ox, oy);
    const luzAca = (lx, ly) => (dia ? 0 : dibujoNuevo.luzDelFuego(lx, ly, fuego, pulso));
    estiloNuevo.luzEn = dia ? null : luzAca;

    const cosas = [...objetosEnMundo(), ...decoradoEnMundo()].map((z) => ({
      y: z.y,
      pinta: () => {
        const py = alPiso(z.y);
        if (z.id === 'fogata') dibujoNuevo.dibujarFogata(ctx, z.x, py, dia, fuego, cuadro, scroll);
        else if (z.id === 'roca' || z.id === 'cactus' || z.id === 'algarrobo') dibujoNuevo.dibujarDelGalope(ctx, z.id, z.x, py, dia);
        else if (z.id === 'poste') {
          dibujoNuevo.dibujarCaballoAtado(ctx, z.x - 27, py, dia, fuego, scroll, caballoActual(gameState).id);
        } else if (z.miembro) dibujarMiembroNuevo(r, z, fog, luzAca);
        else if (z.id === 'forastero') dibujarMiembroNuevo(r, z, fog, luzAca, ASPECTO_FORASTERO);
        else dibujoNuevo.dibujarCosa(ctx, z.id, z.x, py, dia, fuego, pulso);
      },
    })).concat([{ y, pinta: () => dibujarJugadorNuevo(r, luzAca) }]);
    cosas.sort((a, b) => a.y - b.y);
    for (const cosa of cosas) cosa.pinta();

    ctx.restore();
    estiloNuevo.luzEn = null;
    dibujarInterfaz(r);
    menu.render(r, colors, T.interior.dialogoAyuda);
    ficha.render(r, gameState.banda);
    calendario.render(r, gameState);
  }

  /** Vos: el mismo del tren, con tus 8 direcciones. Sentado, de perfil sobre el tronco, mirando el fuego. */
  function dibujarJugadorNuevo(r, luzAca) {
    const py = alPiso(y);
    if (!sentado) dibujoNuevo.dibujarSombraDePies(r.ctx, x, py, luzAca(x, py));
    yo.x = x;
    yo.y = y;
    dibujarPersona(r, {
      tipo: 'jugador', interior: true, x,
      pies: sentado ? py - 3 : py,
      angulo: sentado ? 0 : mirando,
      piernas: sentado ? 'sentado' : undefined,
      fase: sentado ? null : faseDeAndar(yo),
      modo: 'caminar',
      panuelo: true,
    });
  }

  /**
   * 🤠 Uno de la banda, parado alrededor del fuego y mirándolo: la gente del tren con su aspecto fijo (data/banda.js),
   * con el revólver en la funda. Si estás cerca, te mira a vos.
   */
  function dibujarMiembroNuevo(r, z, fog, luzAca, aspecto = MIEMBRO[z.id].aspecto) {
    const py = alPiso(z.y);
    dibujoNuevo.dibujarSombraDePies(r.ctx, z.x, py, luzAca(z.x, py));
    const cerca = Math.hypot(x - z.x, y - z.y) < z.alcance + 10;
    const a = cerca ? Math.atan2(y - z.y, x - z.x) : Math.atan2(fog.y - z.y, fog.x - z.x);
    dibujarPersona(r, {
      tipo: 'pasajero', interior: true, x: z.x, pies: py, angulo: a,
      nuevo: { arma: null, funda: true, aspecto, piernas: 'quieto' },
    });
  }

  function render(r) {
    if (estiloNuevo.activo) { renderNuevo(r); return; }
    // Esta escena está armada para CONFIG.view: usa la lupa que le entre.
    r.escenaFija();
    const dia = gameState.esDeDia;
    r.clear(dia ? colors.campDesiertoDia : colors.campNoche);
    const o = r.centro;
    r.ctx.save();
    r.ctx.translate(o.x, o.y);

    dibujarCielo(r, dia);
    dibujarLejos(r, dia);
    if (dia) dibujarMatas(r);
    dibujarSuelo(r, dia);
    if (dia) dibujarSombras(r);

    /**
     * Y SE DIBUJA POR PROFUNDIDAD, como el resto del juego: lo que está más
     * atrás va primero, así que si te parás delante de la carpa la tapás vos.
     * Antes el orden estaba escrito a mano y el jugador iba siempre último,
     * o sea que caminabas por encima de todo.
     */
    const cosas = objetosEnMundo()
      .map((z) => ({ y: z.y, pinta: () => dibujarObjeto(r, z, dia) }))
      .concat([{ y, pinta: () => dibujarJugador(r) }]);
    cosas.sort((a, b) => a.y - b.y);
    for (const cosa of cosas) cosa.pinta();

    r.ctx.restore();
    dibujarInterfaz(r);
    // Encima de todo, pero sin tapar el campamento: seguís parado al lado de
    // tu fogata mientras elegís.
    menu.render(r, colors, T.interior.dialogoAyuda);
    ficha.render(r, gameState.banda);
    calendario.render(r, gameState);
  }

  function dibujarObjeto(r, z, dia) {
    if (z.id === 'fogata') dibujarFogata(r, z, dia);
    else if (z.id === 'carpa') dibujarCarpa(r, z);
    else if (z.id === 'cajon') dibujarCajon(r, z);
    else if (z.id === 'poste') dibujarPosteYCaballo(r, z);
    else if (z.id === 'cartel') dibujarCartel(r, z);
  }

  /**
   * EL CIELO, que es lo que el campamento no tenía.
   *
   * De día es el mismo cielo del pueblo: **el único color frío del juego**, y
   * está ahí justamente para que todos los ocres se lean como cálidos (el
   * porqué largo está en `puebloCielo`, en data/config.js). De noche es el
   * mismo del galope, con las estrellas quietas — sembradas con un número fijo
   * por estrella, no con azar, o titilarían todas en cada cuadro.
   */
  function dibujarCielo(r, dia) {
    const hy = horizonte();
    const C = colors.cielo;
    const ancho = CONFIG.view.width + 400;
    /**
     * El degradado va de 0 al horizonte y NO desde muy arriba: si arranca
     * fuera de la pantalla, lo unico que se ve es el final del degradado y el
     * cielo queda de un solo color, el del horizonte. Lo de arriba de 0 se
     * rellena aparte con el color del tope.
     */
    if (dia) {
      r.rect(-200, -200, ancho, 200, colors.puebloCielo);
      r.cielo(-200, 0, ancho, hy, colors.puebloCielo, colors.puebloCieloHorizonte, 7);
      return;
    }
    r.rect(-200, -200, ancho, 200, C.nocheArriba);
    r.cielo(-200, 0, ancho, hy, C.nocheArriba, C.nocheHorizonte, 7);
    for (let i = 0; i < 70; i++) {
      const s = revolver(i * 17 + 3);
      const ex = (s % ancho) - 200;
      const ey = ((s >>> 9) % Math.max(1, Math.round(hy - 6))) - 30;
      if (ey < -28) continue;
      r.rect(ex, ey, 1, 1, (s >>> 3) % 5 === 0 ? '#fff6e0' : '#b9c2d8');
    }
    // La luna, a un costado: da la hora sin escribirla, igual que la fogata.
    const lx = CONFIG.view.width - 66, ly = Math.max(16, hy - 46);
    r.ctx.save();
    r.ctx.fillStyle = '#e8e2cc';
    r.ctx.globalAlpha = 0.16;
    r.ctx.beginPath(); r.ctx.arc(lx, ly, 15, 0, Math.PI * 2); r.ctx.fill();   // el halo
    r.ctx.globalAlpha = 1;
    r.ctx.beginPath(); r.ctx.arc(lx, ly, 9, 0, Math.PI * 2); r.ctx.fill();
    r.ctx.fillStyle = '#cfc7ae';
    for (const m of [[-3, -2, 2], [3, 2, 1.5], [0, 4, 1.5]]) {
      r.ctx.beginPath(); r.ctx.arc(lx + m[0], ly + m[1], m[2], 0, Math.PI * 2); r.ctx.fill();
    }
    r.ctx.restore();
  }

  /**
   * LO QUE HAY ENTRE EL HORIZONTE Y EL CLARO: la loma de enfrente y el suelo
   * que llega hasta ella. Sin esto el cielo se apoyaría directamente sobre el
   * claro y el campamento parecería estar al borde de un precipicio.
   */
  function dibujarLejos(r, dia) {
    const hy = horizonte();
    const ancho = CONFIG.view.width + 400;
    const alto = CONFIG.view.height + 200;
    r.rect(-200, hy, ancho, alto - hy, dia ? colors.campDesiertoDia : colors.campNoche);

    // Las lomas: dos filas de cerros bajos, la de atrás más clara por el aire.
    /**
     * DOS FILAS DE CERROS: la de atrás más alta y más clara —el aire se come
     * el contraste con la distancia— y la de adelante más baja y más oscura.
     * Con una sola fila el horizonte es una guarda repetida; con dos hay fondo.
     */
    for (const capa of [[1, 0.45, -4], [0, 1, 4]]) {
      const base = dia
        ? (capa[0] ? colors.campBordeDia : tono(colors.campDesiertoDia, 0.76))
        : (capa[0] ? colors.campSueloLejos : '#15120f');
      r.ctx.save();
      r.ctx.globalAlpha = capa[1];
      /**
       * 🐛 REPARTIDOS A LO ANCHO, no sorteados. Sorteando la posición salían
       * tres cerros amontonados en un lado y el resto de la pantalla pelada:
       * once tiros al azar sobre 800 unidades no cubren nada. Ahora cada uno
       * tiene su franja y adentro de ella se corre un poco.
       */
      const cuantos = 11;
      for (let i = 0; i < cuantos; i++) {
        const s = revolver(i * 31 + capa[0] * 97);
        const cx = -200 + (i + 0.5) * (ancho / cuantos) + ((s % 60) - 30);
        const w = 70 + (s >>> 7) % 130;
        const h = (capa[0] ? 14 : 8) + (s >>> 13) % (capa[0] ? 16 : 9);
        for (let k = 0; k < h; k++) {
          const ww = w * (1 - k / h) ** 0.55;
          r.rect(cx - ww / 2, hy + capa[2] - k, ww, 1, base);
        }
      }
      r.ctx.restore();
    }
    // La línea del horizonte, que es lo que separa el aire de la tierra.
    r.rect(-200, hy + 4, ancho, 1, dia ? colors.campBordeDia : '#15120f');
  }

  /**
   * EL SUELO DEL CLARO, AHORA UNA ELIPSE. Es el mismo círculo del mundo visto
   * en diagonal: `PROF` es cuánto se achata, y es el mismo achatamiento que
   * usan la tapa del techo del tren y el piso del vagón.
   *
   * Y siguen siendo DOS DIBUJOS DISTINTOS, no el mismo más oscuro. De noche el
   * suelo no es un suelo: es un charco de luz de la fogata que se apaga hacia
   * afuera, y eso hace dos trabajos de una — vende que es de noche y muestra
   * hasta dónde se puede caminar sin dibujar ninguna línea. De día esa luz no
   * existe, así que el límite lo cuenta un claro de tierra pisada con su borde.
   */
  function dibujarSuelo(r, dia) {
    const c = CAMPAMENTO.centro;
    const cy = alPiso(c.y);
    const elipse = (radio, color, alpha = 1) => {
      r.ctx.save();
      r.ctx.globalAlpha = alpha;
      r.ctx.fillStyle = color;
      r.ctx.beginPath();
      r.ctx.ellipse(c.x, cy, radio, radio * PROF, 0, 0, Math.PI * 2);
      r.ctx.fill();
      r.ctx.restore();
    };

    if (dia) {
      elipse(CAMPAMENTO.radio + 8, colors.campBordeDia);
      elipse(CAMPAMENTO.radio + 3, colors.campSueloDia);
    } else {
      const pasos = 7;
      for (let i = pasos; i >= 1; i--) {
        const t = i / pasos;
        elipse(CAMPAMENTO.radio * t + 6,
          i > pasos - 2 ? colors.campSueloLejos : colors.campSuelo,
          0.16 + (1 - t) * 0.5);
      }
    }

    // Unas piedritas para que el claro no sea un disco liso. Van sembradas en
    // el mundo y achatadas al dibujarlas, como todo lo demás.
    r.ctx.globalAlpha = dia ? 0.35 : 0.5;
    for (let i = 0; i < 20; i++) {
      const a = i * 2.399;
      const d = 18 + ((i * 37) % Math.floor(CAMPAMENTO.radio - 20));
      r.rect(c.x + Math.cos(a) * d, alPiso(c.y + Math.sin(a) * d), 2, 1,
        dia ? colors.campBordeDia : colors.campSueloLejos);
    }
    r.ctx.globalAlpha = 1;
  }

  /**
   * Y AFUERA DEL CLARO, DESIERTO — no un vacío. Los verdes son los mismos del
   * costado de la vía en el galope: es el mismo desierto, así que tiene que
   * tener la misma vegetación. Sólo de día: de noche el sentido del fondo
   * negro es que la luz se termina, y sembrarlo de matas contaría lo contrario.
   */
  function dibujarMatas(r) {
    const c = CAMPAMENTO.centro;
    const hy = horizonte() + 8;
    const cantidad = Math.round(260 * (r.width * r.height) / (CONFIG.view.width * CONFIG.view.height));
    r.ctx.globalAlpha = 0.75;
    for (let i = 0; i < cantidad; i++) {
      const s = revolver(i);
      const mx = (s % (CONFIG.view.width + 200)) - 100;
      const my = hy + ((s >>> 8) % Math.max(1, Math.round(CONFIG.view.height + 60 - hy)));
      // Dentro del claro no: ahí la tierra está pisada.
      const dx = (mx - c.x) / CAMPAMENTO.radio;
      const dy = (my - alPiso(c.y)) / (CAMPAMENTO.radio * PROF);
      if (dx * dx + dy * dy < 1.05) continue;
      /**
       * LAS DE MÁS ATRÁS SE VEN MÁS CHICAS. Es lo único que hace falta para
       * que el suelo se lea como un plano que se va: sin esto, una mata al pie
       * del horizonte y otra al pie de la pantalla miden lo mismo y el campo
       * se aplana de golpe.
       */
      const lejos = Math.max(0.35, Math.min(1, (my - hy) / (CONFIG.view.height - hy)));
      /**
       * 🐛 LOS VERDES VAN ESCRITOS Y NO SACADOS DE LA PALETA: `colors.matorral`
       * no existe —los del desierto se llaman `mata` y viven adentro de otra
       * rama—, y pedirle a la paleta un color que no está devuelve `undefined`,
       * que el canvas ignora en silencio dejando el color anterior. Resultado:
       * todas las matas salían del color de la última piedra dibujada. No
       * reventaba nada, simplemente no se veía.
       */
      const tipo = (s >>> 17) % 5;
      const k = 0.5 + lejos * 0.9;
      const ww = (v) => Math.max(1, Math.round(v * k));
      if (tipo === 0 || tipo === 1) {
        // Una mata: la base en sombra y la copa con luz.
        r.rect(mx, my - ww(1), ww(4), ww(2), '#3d4a2a');
        r.rect(mx + ww(1), my - ww(3), ww(3), ww(2), '#4d5c34');
      } else if (tipo === 2) {
        // Un cactus chico: el tronco y un brazo.
        r.rect(mx, my - ww(5), ww(2), ww(5), '#3f6b3a');
        r.rect(mx - ww(2), my - ww(4), ww(2), ww(2), '#3f6b3a');
        r.rect(mx, my - ww(5), ww(1), ww(4), '#4d7c44');
      } else {
        r.rect(mx, my - ww(1), ww(3), ww(1), colors.campBordeDia);
      }
    }
    r.ctx.globalAlpha = 1;
  }

  /**
   * LAS SOMBRAS, y ahora son ELIPSES apoyadas en el piso. En una vista de
   * arriba una sombra podía ser un rectángulo; en tres cuartos una sombra es
   * una mancha achatada, como la del caballo en el galope.
   *
   * VAN TODAS JUNTAS Y ACÁ, y no adentro de cada `dibujarX`, para que ninguna
   * caiga ENCIMA de un objeto dibujado antes.
   *
   * Un desplazamiento chico y para un solo lado: lo que hace leer el mediodía
   * no es el tamaño de la sombra sino que TODAS caigan para el mismo lado.
   */
  function dibujarSombras(r) {
    const o = (id) => objetosEnMundo().find((z) => z.id === id);
    const mancha = (wx, wy, rx, ry, alpha = 0.3) => {
      r.ctx.save();
      r.ctx.globalAlpha = alpha;
      r.ctx.fillStyle = '#000';
      r.ctx.beginPath();
      r.ctx.ellipse(wx + SOL.dx, alPiso(wy) + SOL.dy, rx, ry, 0, 0, Math.PI * 2);
      r.ctx.fill();
      r.ctx.restore();
    };
    const carpa = o('carpa'), cajon = o('cajon');
    const poste = o('poste'), cartel = o('cartel'), fogata = o('fogata');
    mancha(carpa.x, carpa.y + 2, 21, 6);
    mancha(cajon.x, cajon.y + 2, 10, 4);
    mancha(cartel.x, cartel.y + 2, 8, 3);
    mancha(poste.x - 12, poste.y + 2, 3, 2);
    mancha(poste.x + 13, poste.y + 2, 3, 2);
    mancha(poste.x, poste.y + 4, 19, 5);
    mancha(fogata.x, fogata.y, 12, 4);
  }

  /**
   * LA FOGATA ES EL RELOJ DEL JUEGO. Encendida de noche, apagada de día. No
   * hay ningún cartel que diga la hora en ningún lado, y es deliberado: lo que
   * se puede mostrar no se escribe.
   *
   * En tres cuartos el círculo de piedras se ve como una ELIPSE y las llamas
   * suben derechas: es la misma regla de siempre, lo del piso se achata y lo
   * que se para no.
   */
  function dibujarFogata(r, o, dia) {
    const py = alPiso(o.y);

    // El círculo de piedras, que es lo que dice que el fuego está contenido.
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2;
      const px = o.x + Math.cos(a) * 13;
      const pz = py + Math.sin(a) * 13 * PROF;
      const alto = 2 + (i % 3);
      r.rect(px - 2, pz - alto, 4, alto + 1, colors.campBordeDia);
      r.rect(px - 2, pz - alto, 4, 1, colors.campCeniza);   // éstas no se apagan: están al lado del fuego
    }

    // Los troncos, cruzados. Están a cualquier hora.
    r.rect(o.x - 10, py - 4, 20, 4, colors.campTronco);
    r.rect(o.x - 9, py - 4, 18, 1, '#6a4a30');
    r.rect(o.x - 3, py - 10, 6, 11, colors.campTronco);

    if (dia) {
      r.rect(o.x - 5, py - 3, 10, 3, colors.campCeniza);   // ceniza fría
      return;
    }

    // Las brasas y las llamas, latiendo. El parpadeo es lo único que se mueve
    // en toda la escena, así que es lo que la mantiene viva.
    const latido = Math.sin(scroll * 7) * 0.5 + Math.sin(scroll * 13) * 0.5;
    const alto = 13 + latido * 4;
    r.rect(o.x - 5, py - 3, 10, 3, colors.campBrasa);
    /**
     * LA LLAMA VA EN PUNTA, no en bloque. Filas que se angostan hacia arriba,
     * con el corazon mas claro adentro: un rectangulo naranja parado se lee
     * como una caja, y lo que hace leer fuego es la punta.
     */
    for (let i = 0; i < alto; i++) {
      const u = i / alto;
      const w = 5 * (1 - u) ** 0.65 + 0.5;
      const meneo = Math.sin(scroll * 9 + u * 4) * u * 1.6;
      r.rect(o.x - w + meneo, py - 2 - i, w * 2, 1, colors.campFuego);
      if (u < 0.55) r.rect(o.x - w * 0.5 + meneo, py - 2 - i, w, 1, '#ffd08a');
      if (u < 0.28) r.rect(o.x - w * 0.28 + meneo, py - 2 - i, w * 0.56, 1, '#fff0c8');
    }
    // Y unas chispas que suben y se apagan.
    for (let i = 0; i < 4; i++) {
      const v = (scroll * 0.7 + i * 0.25) % 1;
      r.rect(o.x + Math.sin(v * 7 + i) * 5, py - 6 - v * 26, 1, 1,
        v > 0.7 ? colors.campBrasa : '#ffd08a');
    }

    // El resplandor sobre el suelo: achatado, porque está EN el suelo.
    r.ctx.save();
    r.ctx.globalAlpha = 0.10 + latido * 0.03;
    r.ctx.fillStyle = colors.campFuego;
    r.ctx.beginPath();
    r.ctx.ellipse(o.x, py, 40 + latido * 5, (40 + latido * 5) * PROF, 0, 0, Math.PI * 2);
    r.ctx.fill();
    r.ctx.restore();
  }

  /**
   * LA CARPA, en tres cuartos. Antes era un triángulo de filas visto desde
   * arriba. Ahora tiene DOS AGUAS —una a la luz y otra en sombra— y, sobre
   * todo, un FONDO que asoma arriba y atrás: eso es lo que dice que la carpa
   * tiene largo y no es una figura plana clavada en el piso.
   */
  function dibujarCarpa(r, o) {
    const py = alPiso(o.y);
    const ALTO = 27, MEDIO = 19;
    /**
     * EL LARGO DE LA CARPA VA HACIA ATRÁS Y ARRIBA, y achatado por `PROF`: es
     * la misma regla que todo lo demás. El fondo asoma POCO —8 unidades—
     * porque una carpa vista casi de frente muestra sobre todo su boca; si el
     * fondo se corre mucho quedan DOS CARPAS, que fue el primer intento y
     * parecía una sierra.
     */
    const LARGO = 8;
    const fondo = luz(tono(colors.campCarpaSombra, 0.62));
    for (let i = 0; i <= ALTO; i++) {
      const w = 2 + (i / ALTO) * MEDIO;
      const yy = py - ALTO + i - LARGO * PROF;
      r.rect(o.x - LARGO - w, yy, w * 2, 1, fondo);
    }
    // El faldón largo: une el fondo con la boca, y es la cara que se ve entera.
    for (let i = 0; i <= ALTO; i++) {
      const w = 2 + (i / ALTO) * MEDIO;
      const yy = py - ALTO + i;
      r.rect(o.x - LARGO - w, yy - LARGO * PROF, LARGO + 1, LARGO * PROF + 1,
        i > 3 ? luz(tono(colors.campCarpa, 0.84)) : luz(colors.campCarpa));
      r.rect(o.x - w, yy, w, 1, luz(colors.campCarpa));
      r.rect(o.x, yy, w, 1, luz(colors.campCarpaSombra));
    }
    // El caballete, que une las dos puntas y es lo que se lee primero.
    r.rect(o.x - LARGO, py - ALTO - LARGO * PROF, LARGO + 1, 1.5, luz('#c8a878'));
    // La abertura, oscura: es lo que la hace leer como carpa y no como piedra.
    for (let i = 0; i < 13; i++) {
      const w = 1 + (i / 12) * 5;
      r.rect(o.x - w, py - 13 + i, w * 2, 1, '#150f0e');
    }
    // Las estacas y la faldilla apoyada en la tierra.
    r.rect(o.x - MEDIO - 2, py, MEDIO * 2 + 4, 2, luz(colors.campCarpaSombra));
    for (const ex of [-MEDIO - 1, MEDIO - 2]) r.rect(o.x + ex, py - 1, 2, 4, luz(colors.campTronco));
  }

  /**
   * EL CAJÓN, en tres cuartos: la cara de ADELANTE con su alto y la TAPA como
   * una franja encima. Es literalmente la regla de las dos caras del vagón y
   * del tren del galope, aplicada a una caja de 18 de ancho.
   */
  function dibujarCajon(r, o) {
    const py = alPiso(o.y);
    const W = 20, H = 14, D = 9;
    const tapaAlto = Math.round(D * PROF);
    // La tapa.
    r.rect(o.x - W / 2 + 2, py - H - tapaAlto, W - 3, tapaAlto, luz('#94663f'));
    r.rect(o.x - W / 2 + 2, py - H - tapaAlto, W - 3, 1, luz('#b08055'));
    // La cara de adelante, con sus tablas y su fleje.
    r.rect(o.x - W / 2, py - H, W, H, luz(colors.campCajon));
    r.rect(o.x - W / 2, py - H, W, 1, luz('#94663f'));
    for (let tx = -W / 2 + 5; tx < W / 2 - 1; tx += 5) r.rect(o.x + tx, py - H + 1, 1, H - 2, luz('#4a3524'));
    r.rect(o.x - W / 2, py - 5, W, 2, luz('#4a3524'));
    r.rect(o.x - W / 2, py - 1, W, 1, luz('#2e2016'));
  }

  /**
   * EL POSTE Y TU CABALLO. 🔺 El caballo **era cuatro rectángulos**
   * (`colors.horse`, `horseDark`, `horseMane`) de cuando el del galope también
   * lo era. Ahora es EL MISMO SPRITE del galope, parado: la hoja ya trae el
   * caballo quieto en cinco direcciones, así que era cambiar cuatro
   * rectángulos por una estampa. Y respeta el pelaje del caballo que tengas.
   */
  function dibujarPosteYCaballo(r, o) {
    const py = alPiso(o.y);
    /**
     * EL CABALLO VA DETRÁS DEL PALENQUE, y el palenque se dibuja después. Al
     * agrandarlo, el caballo tapaba los dos postes y el travesaño enteros: se
     * veía un caballo suelto con un palo asomando. Del otro lado de la baranda
     * se lee lo que es — un caballo atado.
     */
    const respira = Math.sin(scroll * 1.6) * 0.4;
    dibujarAnimal(r, o.x + 2, py - 10 + respira, null, 0, 0, 0,
      caballoActual(gameState).id, !gameState.esDeDia, ESCALA_PARADO);

    // Los dos postes y el travesaño, a la altura del pecho del animal.
    r.rect(o.x - 17, py - 16, 3, 16, luz(colors.campTronco));
    r.rect(o.x + 15, py - 16, 3, 16, luz(colors.campTronco));
    r.rect(o.x - 17, py - 16, 1, 16, luz('#7a5a3c'));
    r.rect(o.x - 19, py - 14, 38, 3, luz('#5f4530'));
    r.rect(o.x - 19, py - 14, 38, 1, luz('#7a5a3c'));
    // La rienda, colgando del travesaño hasta la cabeza.
    r.rect(o.x + 13, py - 11, 1, 5, luz('#2a1c12'));
  }

  /**
   * 🔺 EL CARTEL DE LOS ASALTOS: UN MAPA VIEJO CLAVADO A UNA TABLA *(Santi: "el
   * letrero para ir al asalto cámbialo por un mapa viejo pegado a un cartel de
   * madera")*. Era una tabla con dos rayitas. Ahora es lo que se abre cuando lo
   * usás: el mapa de rutas, en papel amarillento, con la vía punteada, el río,
   * dos cerros y la cruz roja de a dónde se va — y clavado con cuatro clavos,
   * con una punta despegada. Es sólo dibujo: sigue siendo el mismo cartel.
   */
  function dibujarCartel(r, o) {
    const py = alPiso(o.y);
    const madera = luz(colors.campCartel);
    // Los dos palos, clavados en la tierra.
    for (const px of [o.x - 15, o.x + 12]) {
      r.rect(px, py - 31, 3, 31, luz(colors.campTronco));
      r.rect(px, py - 31, 1, 31, luz('#7a5a3c'));
    }
    // La tabla: tres tablones horizontales, con su canto de luz arriba.
    r.rect(o.x - 18, py - 33, 36, 21, madera);
    for (const ty of [py - 26, py - 19]) r.rect(o.x - 18, ty, 36, 1, luz('#6a4a28'));
    r.rect(o.x - 18, py - 33, 36, 1.5, luz('#b08a5e'));
    r.rect(o.x - 18, py - 12, 36, 1, luz('#4a3524'));
    // El techito de una tabla que la protege de la lluvia.
    r.rect(o.x - 20, py - 35, 40, 2, luz('#5f4530'));
    r.rect(o.x - 20, py - 35, 40, 0.5, luz('#8a6a48'));

    // El mapa: papel amarillento, con el borde gastado más oscuro.
    const papel = luz('#dccb9c');
    const x0 = o.x - 13, y0 = py - 31, W = 25, H = 17;
    r.rect(x0, y0, W, H, papel);
    r.rect(x0, y0, W, 1, luz('#bfa874'));
    r.rect(x0, y0 + H - 1, W, 1, luz('#bfa874'));
    r.rect(x0, y0, 1, H, luz('#c9b27e'));
    r.rect(x0 + W - 1, y0, 1, H, luz('#c9b27e'));
    // Una mancha de agua, y la punta de abajo despegada y doblada.
    r.rect(x0 + 16, y0 + 3, 4, 3, luz('#cdb983'));
    r.rect(x0 + W - 4, y0 + H - 3, 4, 3, madera);
    r.rect(x0 + W - 4, y0 + H - 3, 3, 1, luz('#efe2bc'));
    r.rect(x0 + W - 4, y0 + H - 2, 2, 1, luz('#efe2bc'));
    // El río, que baja de arriba.
    for (let i = 0; i < 14; i++) r.rect(x0 + 19 + Math.round(Math.sin(i * 0.7) * 1.5), y0 + 1 + i, 1, 1, luz('#6f8a8c'));
    // Dos cerros.
    for (const [cx, cy] of [[x0 + 6, y0 + 6], [x0 + 11, y0 + 5]]) {
      r.rect(cx - 1, cy, 3, 1, luz('#7a5a3c'));
      r.rect(cx, cy - 1, 1, 1, luz('#7a5a3c'));
    }
    // La vía, punteada, y la cruz roja de a dónde se va.
    for (let i = 0; i < 7; i++) r.rect(x0 + 3 + i * 2, y0 + 12 - Math.round(i * 0.8), 1, 1, luz('#4a3524'));
    r.rect(x0 + 16, y0 + 5, 1, 1, luz('#a8322a'));
    r.rect(x0 + 18, y0 + 5, 1, 1, luz('#a8322a'));
    r.rect(x0 + 17, y0 + 6, 1, 1, luz('#a8322a'));
    r.rect(x0 + 16, y0 + 7, 1, 1, luz('#a8322a'));
    r.rect(x0 + 18, y0 + 7, 1, 1, luz('#a8322a'));
    // Los cuatro clavos (el de abajo a la derecha ya no agarra: la punta se despegó).
    for (const [nx, ny] of [[x0 + 1, y0 + 1], [x0 + W - 2, y0 + 1], [x0 + 1, y0 + H - 2]]) {
      r.rect(nx, ny, 1, 1, luz('#2e2016'));
    }
  }

  /**
   * 🔺 VOS. Eras **tres rectángulos** —una sombra, una caja y una barra por
   * sombrero—, de 13 unidades de alto. Ahora sos LA MISMA PERSONA del tren y
   * del galope: 20 unidades, 80 puntos dibujados, con tu ropa, tu pañuelo y
   * las ocho direcciones. No hubo que dibujar nada: el sistema ya estaba, y
   * esta pantalla era de las que nunca se habían conectado.
   */
  function dibujarJugador(r) {
    const py = alPiso(y);
    // De día su sombra cae para el mismo lado que las demás; de noche queda
    // centrada, porque ahí la luz es la fogata y no el sol.
    const sol = gameState.esDeDia ? SOL : { dx: 0, dy: 0 };
    r.ctx.save();
    r.ctx.globalAlpha = 0.3;
    r.ctx.fillStyle = '#000';
    r.ctx.beginPath();
    r.ctx.ellipse(x + sol.dx, py + sol.dy, 6, 2.5, 0, 0, Math.PI * 2);
    r.ctx.fill();
    r.ctx.restore();

    yo.x = x;
    yo.y = y;
    dibujarPersona(r, {
      tipo: 'jugador',
      x,
      pies: py,
      angulo: mirando,
      postura: sentado ? 'sentado' : 'pie',
      fase: sentado ? null : faseDeAndar(yo),
      /**
       * 🐛 SIN `modo: 'caminar'` *(Santi: "el personaje del jugador camina
       * demasiado rápido (mueve sus pies muy rápido)")*. La caminata da un paso
       * cada 14 unidades y vos te movés a 78 por segundo: **5,6 pasos por
       * segundo**, cámara rápida. En el tren usás el trote —un paso cada 20—,
       * que son 3,9 pasos por segundo, y ése nunca molestó. Ahora es el mismo.
       */
      panuelo: true,
    });
  }

  function dibujarInterfaz(r) {
    // 📅 🔁 Arriba, en vez del título, un cartelito de papel con el día y la parte del día *(Santi: "un cartelito
    // arriba en el campamento que dice el día y el mes")*.
    cartelDeLaFecha(r);
    // 🧪 El atajo de prueba del techo (ver `update`). Sacarlo con él.
    r.text(T.camp.atajoCorreo, 8, 26, colors.textDim, 'left');
    r.text(`$${gameState.money}`, r.width - 8, 12, colors.bagLoot, 'right');
    if (gameState.bounty > 0) {
      r.text(`☠ $${gameState.bounty}`, 8, 12, colors.enemyAlert, 'left');
    }

    // El cartel de qué va a hacer [E], sobre tu cabeza. Mismo lenguaje que el
    // asalto: el juego siempre te dice cuál de las acciones va a pasar.
    // (Con una ventana abierta, el cartel no: quedaba pisando el título.)
    const o = menu.activo() ? null : objetoCerca();
    if (o) {
      const texto = o.id === 'fogata' && sentado ? T.camp.prompts.fogataDe
        // La carpa dice A QUÉ hora vas a despertarte, no sólo "dormir": así la
        // decisión se toma antes de apretar, no después de ver el resultado.
        : o.id === 'carpa'
          ? (gameState.esDeDia ? T.camp.prompts.carpaDia : T.camp.prompts.carpaNoche)
          : o.miembro ? T.camp.prompts.miembro(MIEMBRO[o.id].corto)
          : T.camp.prompts[o.id];
      // Sobre tu cabeza, así que corrido igual que el claro (ver `render`).
      const c = estiloNuevo.activo ? origenNuevo : r.centro;
      // (En el estilo nuevo, sobre tu cabeza de verdad: la gente del tren es más alta y el piso se ve aplastado.)
      const yTexto = estiloNuevo.activo ? alPiso(y) + c.y - 38 : y + c.y - 16;
      r.text(texto, x + c.x, yTexto, colors.doorGlow);
      // El caballo es el único con dos verbos, así que lleva dos renglones.
      // El de salir del campamento va en otro color: no es una acción más de
      // las de acá, es la que te lleva a otro lado.
      if (o.id === 'poste') r.text(T.camp.prompts.posteF, x + c.x, yTexto - 10, colors.bagLoot);
    }

    /**
     * 🔥 EL "!" SOBRE QUIEN TRAE UN MOMENTO (o sobre la carta): así sabés a quién ir a hablarle. Se va cuando lo
     * atendés.
     */
    if (estiloNuevo.activo && gameState.campamento) {
      const c = origenNuevo;
      for (const p of gameState.campamento.pendientes) {
        const z = objetosEnMundo().find((ob) => ob.id === p.quien);
        if (!z) continue;
        const arriba = z.id === 'carta' ? 12 : 34;
        r.text('!', z.x + c.x, alPiso(z.y) + c.y - arriba, colors.bagLoot, 'center', { tam: 16 });
      }
    }

    if (mensaje) r.text(mensaje.texto, r.width / 2, r.height - 30, colors.text);
    else if (avisoLejos > 0) r.text(T.camp.lejos, r.width / 2, r.height - 30, colors.textDim);
    else if (scroll < 9 && !menu.activo()) r.text(T.camp.keys, r.width / 2, r.height - 14, colors.textDim);
  }

  return { enter, exit, update, render };
}
