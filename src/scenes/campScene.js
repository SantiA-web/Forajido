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
import { CAMPAMENTO } from '../data/camp.js';
import { caballoActual, HORSES } from '../data/horse.js';
import { WEAPONS } from '../data/weapons.js';
import { MELEE } from '../data/melee.js';
import { gameState } from '../state/gameState.js';
import { crearMenu } from '../engine/menu.js';
import { T } from '../text/es.js';

export function createCampScene(services) {
  const { input, scenes, hud, audio } = services;
  const colors = CONFIG.colors;

  let x, y, sentado, mensaje, scroll, avisoLejos;
  const menu = crearMenu(audio);

  function enter(params = {}) {
    hud.hide();
    const c = CAMPAMENTO.centro;
    // Arrancás al lado del fuego, mirando el resto del campamento. Salvo que
    // vuelvas del pueblo: entonces aparecés donde dejaste el caballo, que es
    // por donde te fuiste. Volver a un lugar distinto del que saliste se
    // siente a teletransporte aunque nadie sepa explicar por qué.
    const volvesA = { pueblo: 'poste', mapa: 'cartel' }[params.desde];
    const donde = volvesA && CAMPAMENTO.objetos.find((o) => o.id === volvesA);
    x = donde ? c.x + donde.x - 20 : c.x;
    y = donde ? c.y + donde.y + 16 : c.y + 34;
    sentado = false;
    mensaje = null;
    avisoLejos = 0;
    scroll = 0;

    // Para depurar desde la consola: FORAJIDO.services.camp
    services.camp = {
      get x() { return x; },
      get y() { return y; },
      get sentado() { return sentado; },
      get cerca() { const o = objetoCerca(); return o ? o.id : null; },
      get objetos() { return objetosEnMundo(); },
      get mensaje() { return mensaje ? mensaje.texto : null; },
    };
  }

  // ------------------------------------------------------------------ lógica

  /** Los objetos con sus coordenadas ya absolutas (en data van relativas al centro). */
  function objetosEnMundo() {
    const c = CAMPAMENTO.centro;
    return CAMPAMENTO.objetos.map((o) => ({ ...o, x: c.x + o.x, y: c.y + o.y }));
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
   * Qué hace cada cosa. Los que todavía no tienen un sistema detrás contestan
   * con lo que hoy sí se puede saber (qué caballo tenés, con qué arma salís)
   * en vez de quedarse mudos: un objeto que no responde enseña a ignorarlo.
   */
  function usar(o) {
    switch (o.id) {
      case 'fogata':
        sentado = !sentado;
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
        gameState.esDeDia = !gameState.esDeDia;
        decir(gameState.esDeDia ? T.camp.amanece : T.camp.anochece);
        audio.play('cover');
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

  function update(dt) {
    scroll += dt;
    avisoLejos = Math.max(0, avisoLejos - dt);

    // Con el cajón abierto no caminás: tenés las dos manos adentro.
    if (menu.update(input)) return;

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
      scenes.goTo('town');
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

  function render(r) {
    const dia = gameState.esDeDia;
    r.clear(dia ? colors.campDesiertoDia : colors.campNoche);
    dibujarSuelo(r, dia);
    dibujarCartel(r);
    dibujarCarpa(r);
    dibujarCajon(r);
    dibujarPosteYCaballo(r);
    dibujarFogata(r, dia);
    dibujarJugador(r);
    dibujarInterfaz(r);
    // Encima de todo, pero sin tapar el campamento: seguís parado al lado de
    // tu fogata mientras elegís.
    menu.render(r, colors, T.interior.dialogoAyuda);
  }

  /**
   * EL SUELO, Y SON DOS DIBUJOS DISTINTOS, no el mismo más oscuro.
   *
   * De noche el suelo no es un suelo: es un charco de luz de la fogata que se
   * apaga hacia afuera. Eso hace dos trabajos de una — vende que es de noche,
   * y muestra el límite de hasta dónde se puede caminar sin dibujar ninguna
   * línea que lo marque.
   *
   * De día esa luz no existe, así que el límite necesita otra explicación
   * visual: un claro de tierra pisada, con su borde, y el desierto alrededor.
   * Es el mismo círculo y la misma regla, contada por lo que se ve a esa hora.
   * Por eso el campamento es el único lugar con dos paletas propias en vez de
   * resolverse con el velo de la noche.
   */
  function dibujarSuelo(r, dia) {
    const c = CAMPAMENTO.centro;

    if (dia) {
      r.ctx.save();
      r.ctx.fillStyle = colors.campBordeDia;
      r.ctx.beginPath();
      r.ctx.arc(c.x, c.y, CAMPAMENTO.radio + 8, 0, Math.PI * 2);
      r.ctx.fill();
      r.ctx.fillStyle = colors.campSueloDia;
      r.ctx.beginPath();
      r.ctx.arc(c.x, c.y, CAMPAMENTO.radio + 3, 0, Math.PI * 2);
      r.ctx.fill();
      r.ctx.restore();
    } else {
      const pasos = 7;
      for (let i = pasos; i >= 1; i--) {
        const t = i / pasos;
        const radio = CAMPAMENTO.radio * t + 6;
        r.ctx.save();
        r.ctx.globalAlpha = 0.16 + (1 - t) * 0.5;
        r.ctx.fillStyle = i > pasos - 2 ? colors.campSueloLejos : colors.campSuelo;
        r.ctx.beginPath();
        r.ctx.arc(c.x, c.y, radio, 0, Math.PI * 2);
        r.ctx.fill();
        r.ctx.restore();
      }
    }

    // Unas piedritas para que el claro no sea un disco liso.
    r.ctx.globalAlpha = dia ? 0.35 : 0.5;
    for (let i = 0; i < 14; i++) {
      const a = (i * 2.399);
      const d = 18 + ((i * 37) % Math.floor(CAMPAMENTO.radio - 20));
      r.rect(c.x + Math.cos(a) * d, c.y + Math.sin(a) * d, 2, 1,
        dia ? colors.campBordeDia : colors.campSueloLejos);
    }
    r.ctx.globalAlpha = 1;
  }

  /**
   * LA FOGATA ES EL RELOJ DEL JUEGO.
   *
   * Encendida de noche, apagada de día. No hay ningún cartel que diga la hora
   * en ningún lado, y es deliberado: lo que se puede mostrar no se escribe —
   * la misma regla del aro del ruido y de la marca del salto. Entre la luz y
   * el fuego, saber si el pueblo está abierto no necesita una palabra.
   */
  function dibujarFogata(r, dia) {
    const o = objetosEnMundo().find((z) => z.id === 'fogata');

    // Los troncos, cruzados. Están a cualquier hora.
    r.rect(o.x - 11, o.y + 1, 22, 4, colors.campTronco);
    r.rect(o.x - 4, o.y - 6, 8, 14, colors.campTronco);

    if (dia) {
      // Apagada: ceniza fría y nada más.
      r.rect(o.x - 5, o.y - 2, 10, 4, colors.campCeniza);
      return;
    }

    // Las brasas y las llamas, latiendo. El parpadeo es lo único que se mueve
    // en toda la escena, así que es lo que la mantiene viva.
    const latido = Math.sin(scroll * 7) * 0.5 + Math.sin(scroll * 13) * 0.5;
    const alto = 8 + latido * 3;
    r.rect(o.x - 5, o.y - 2, 10, 4, colors.campBrasa);
    r.rect(o.x - 3, o.y - alto, 6, alto, colors.campFuego);
    r.rect(o.x - 1, o.y - alto - 3, 2, 4, '#ffd08a');

    // El resplandor sobre el suelo.
    r.ctx.save();
    r.ctx.globalAlpha = 0.10 + latido * 0.03;
    r.ctx.fillStyle = colors.campFuego;
    r.ctx.beginPath();
    r.ctx.arc(o.x, o.y, 34 + latido * 4, 0, Math.PI * 2);
    r.ctx.fill();
    r.ctx.restore();
  }

  function dibujarCarpa(r) {
    const o = objetosEnMundo().find((z) => z.id === 'carpa');
    // Un triángulo hecho de filas: la lona vista desde arriba y de costado.
    for (let i = 0; i < 12; i++) {
      const ancho = 2 + i * 1.6;
      r.rect(o.x - ancho, o.y - 12 + i, ancho * 2, 1,
        i < 6 ? colors.campCarpa : colors.campCarpaSombra);
    }
    r.rect(o.x - 20, o.y, 40, 2, colors.campCarpaSombra);
    // La abertura, oscura: es lo que la hace leer como carpa y no como piedra.
    r.rect(o.x - 3, o.y - 5, 6, 5, '#150f0e');
  }

  function dibujarCajon(r) {
    const o = objetosEnMundo().find((z) => z.id === 'cajon');
    r.rect(o.x - 8, o.y - 6, 16, 12, colors.campCajon);
    r.rect(o.x - 8, o.y - 6, 16, 3, '#94663f');
    r.rect(o.x - 8, o.y - 1, 16, 1, '#4a3524');
    r.rect(o.x - 1, o.y - 6, 2, 12, '#4a3524');
  }

  function dibujarPosteYCaballo(r) {
    const o = objetosEnMundo().find((z) => z.id === 'poste');

    // El poste y el travesaño donde va atada la rienda.
    r.rect(o.x - 14, o.y - 10, 3, 20, colors.campTronco);
    r.rect(o.x + 11, o.y - 10, 3, 20, colors.campTronco);
    r.rect(o.x - 14, o.y - 8, 28, 2, '#5f4530');

    // El caballo, con el mismo lenguaje de formas que el del galope.
    const respira = Math.sin(scroll * 1.6) * 0.6;
    r.rect(o.x - 10, o.y + 2 + respira, 21, 9, colors.horse);
    r.rect(o.x - 10, o.y + 2 + respira, 21, 3, colors.horseDark);
    r.rect(o.x + 9, o.y + 4 + respira, 6, 6, colors.horse);
    r.rect(o.x - 12, o.y + 4 + respira, 4, 5, colors.horseMane);
  }

  function dibujarCartel(r) {
    const o = objetosEnMundo().find((z) => z.id === 'cartel');
    r.rect(o.x - 1, o.y - 2, 3, 12, colors.campTronco);
    r.rect(o.x - 15, o.y - 12, 30, 11, colors.campCartel);
    r.rect(o.x - 15, o.y - 12, 30, 2, '#a6835a');
    // Dos rayitas que insinúan un mapa escrito, sin escribir nada.
    r.rect(o.x - 11, o.y - 8, 14, 1, '#4a3524');
    r.rect(o.x - 11, o.y - 5, 20, 1, '#4a3524');
  }

  function dibujarJugador(r) {
    r.ctx.globalAlpha = 0.3;
    r.box(x, y + 6, 5, 2, '#000');
    r.ctx.globalAlpha = 1;

    if (sentado) {
      // Sentado: más bajo y más ancho, y el sombrero le queda encima.
      r.box(x, y + 2, 5, 3, colors.player);
      r.rect(x - 6, y - 2, 13, 3, colors.playerHat);
      return;
    }
    r.box(x, y, 5, 5, colors.player);
    r.rect(x - 6, y - 6, 13, 3, colors.playerHat);
  }

  function dibujarInterfaz(r) {
    r.text(T.camp.title, r.width / 2, 12, colors.text);
    r.text(`$${gameState.money}`, r.width - 8, 12, colors.bagLoot, 'right');
    if (gameState.bounty > 0) {
      r.text(`☠ $${gameState.bounty}`, 8, 12, colors.enemyAlert, 'left');
    }

    // El cartel de qué va a hacer [E], sobre tu cabeza. Mismo lenguaje que el
    // asalto: el juego siempre te dice cuál de las acciones va a pasar.
    const o = objetoCerca();
    if (o) {
      const texto = o.id === 'fogata' && sentado ? T.camp.prompts.fogataDe
        // La carpa dice A QUÉ hora vas a despertarte, no sólo "dormir": así la
        // decisión se toma antes de apretar, no después de ver el resultado.
        : o.id === 'carpa'
          ? (gameState.esDeDia ? T.camp.prompts.carpaDia : T.camp.prompts.carpaNoche)
          : T.camp.prompts[o.id];
      r.text(texto, x, y - 16, colors.doorGlow);
      // El caballo es el único con dos verbos, así que lleva dos renglones.
      // El de salir del campamento va en otro color: no es una acción más de
      // las de acá, es la que te lleva a otro lado.
      if (o.id === 'poste') r.text(T.camp.prompts.posteF, x, y - 26, colors.bagLoot);
    }

    if (mensaje) r.text(mensaje.texto, r.width / 2, r.height - 30, colors.text);
    else if (avisoLejos > 0) r.text(T.camp.lejos, r.width / 2, r.height - 30, colors.textDim);
    else if (scroll < 9) r.text(T.camp.keys, r.width / 2, r.height - 14, colors.textDim);
  }

  return { enter, update, render };
}
