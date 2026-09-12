/**
 * LOS OBJETOS — lo que se roba en el tren de carga y no es plata.
 *
 * *(Santi: "Pasajeros: robás dinero, en el de carga objetos que después vendés
 * [...] el objeto raro sólo se PUEDE LLEGAR a encontrar en el almacén (abriendo
 * las cajas fuertes) o las cajas fuertes ocultas")*
 *
 * ES LA IDENTIDAD ECONÓMICA DE CADA TREN, y es lo que termina de separarlos:
 * del de pasajeros salís con el bolsillo lleno; del de carga salís cargado de
 * cosas que todavía no valen nada hasta que encuentres a quién vendérselas.
 *
 * POR QUÉ UN OBJETO NO ES PLATA CON PASOS DE MÁS, que es el riesgo obvio de
 * esta idea: si un objeto vale $200 y siempre lo vendés a $200 en el mismo
 * lugar, no es un objeto — es plata con una caminata encima, o sea peor que
 * plata. Tres cosas lo evitan, y las tres viven acá o en el perista:
 *
 *   1. **Valen más que la plata equivalente.** Un objeto común rinde cerca del
 *      doble que una bolsa de monedas: es la prima por cargarlo y por el viaje.
 *   2. **No te entran todos, y no por un número sino por la FORMA** (ver
 *      `CONFIG.mochila` y `forma`, abajo). Adentro del asalto aparece una
 *      pregunta que hasta ahora no existía: *¿cuál me llevo?*
 *   3. **La plata de un objeto no se cobra en el tren**, así que el asalto
 *      termina y todavía tenés que ir a venderlo.
 *
 * LA ESTRUCTURA ES UN CATÁLOGO POR NIVELES, igual patrón que WEAPONS o HORSES:
 * el tren no elige un objeto, elige un NIVEL, y el nivel sortea cuál. Así
 * agregar mercadería nueva es escribir una línea acá y nada más.
 */

/**
 * CADA NIVEL DICE DE DÓNDE SALE, y esa es toda la regla:
 *
 *   comun     de las bolsas del tren de carga.
 *   valioso   de una caja fuerte.
 *   raro      SÓLO de una caja fuerte del almacén o de una caja oculta.
 *             Nunca de una bolsa, nunca de una caja cualquiera.
 */
export const NIVELES = {
  comun: {
    id: 'comun',
    valorMin: 45,
    valorMax: 95,
  },
  valioso: {
    id: 'valioso',
    valorMin: 220,
    valorMax: 560,
  },
  /**
   * EL RARO. No tiene un rango ancho como los otros dos: es una sola cosa
   * grande, y la gracia es que aparezca poco y se note cuando aparece.
   *
   * No compite con el jackpot de la caja fuerte ($2.500-4.000, ver
   * LOOT_TYPES.strongbox): aquél es del tren de PASAJEROS y se cobra ahí
   * mismo. Éste hay que sacarlo del tren y después venderlo, y hasta que no lo
   * vendas no es plata.
   */
  raro: {
    id: 'raro',
    valorMin: 900,
    valorMax: 1800,
  },
};

/**
 * QUÉ TAN SEGUIDO UNA CAJA DEL ALMACÉN (o una caja oculta) TRAE EL RARO.
 *
 * Con dos cajas por almacén, 0,18 da **un 33% de los trenes de carga con al
 * menos un objeto raro adentro** — o sea uno de cada tres. Suficiente para que
 * valga la pena forzar la puerta del almacén todas las veces, y poco para que
 * encontrarlo siga siendo una tarde buena y no el trámite de siempre.
 *
 * ES EL NÚMERO A MOVER si el objeto raro se siente demasiado común o demasiado
 * inalcanzable. No está jugado.
 */
export const CHANCE_RARO = 0.18;

/**
 * EL CATÁLOGO. `nivel` dice de dónde puede salir; `forma`, cuánto y cómo
 * abulta; el resto es nombre y sabor.
 *
 * Los nombres importan más de lo que parece: un "objeto valioso" genérico es un
 * número con otra cara, y un **lingote de plata** es algo que te podés imaginar
 * llevando bajo el brazo mientras corrés por un pasillo.
 *
 * ---------------------------------------------------------------------------
 * QUÉ FORMA TIENE CADA COSA — `forma: [ancho, alto]` en casillas de la mochila.
 *
 * *(Santi: "me parece mejor ahora esa idea que decías del tetris para la mochila
 * entrando con TAB")*
 *
 * 🔻 ANTES ERA UN NÚMERO SUELTO (`slots`, de 1 a 4) y las casillas se llenaban
 * en fila, una detrás de otra. Funcionaba y era menos: con un número, tres
 * cosas de 3 casillas y una de 4 siempre entran en 16, porque 13 ≤ 16. Con
 * FORMAS no alcanza con que sobre lugar — **tiene que sobrar lugar de la forma
 * correcta**, y ahí aparece la decisión de verdad: un cajón de 2×2 necesita un
 * hueco cuadrado, y cuatro anillos entran en cualquier rendija.
 *
 * EL MAPA DE FORMAS SALE DEL TAMAÑO QUE YA TENÍAN, así que ningún objeto
 * cambió de "cuánto abulta" — sólo de "cómo abulta":
 *
 *   1 casilla  → `[1,1]`  una chuchería: un anillo, unos papeles
 *   2 casillas → `[2,1]`  un estuche chato
 *   3 casillas → `[3,1]`  un atado largo
 *   4 casillas → `[2,2]`  un cajón
 *
 * SE PUEDEN ACOSTAR. Un atado de `[3,1]` entra parado (`[1,3]`) si es lo único
 * que cabe — lo prueba `buscarLugar` (engine/grilla.js) sin que el jugador
 * tenga que rotar nada a mano.
 *
 * `slots` sigue existiendo porque es lo que cuenta el HUD y lo que frena al
 * jugador (ancho × alto), y porque es más barato de leer que la forma.
 *
 * *(Santi: "no es 5/5, porque no es lo mismo llevarse un anillo que una botella
 * de whisky")*
 *
 * Y ACÁ HAY ALGO QUE APARECIÓ SOLO Y ES LO MEJOR DE TODO EL SISTEMA: **el nivel
 * raro quedó repartido entre 1 y 4 casillas**. Un reloj de oro y unos lingotes
 * valen lo mismo, pero el reloj entra en cualquier hueco y los lingotes te
 * comen un cuarto de la mochila. Así que encontrar el objeto raro dejó de ser
 * una sola cosa: importa CUÁL te tocó, no sólo que te tocó.
 *
 * El tamaño no está atado al valor a propósito. Si lo estuviera, la mochila
 * sería una segunda forma de decir el precio; separados, hay cosas que valen
 * poco y molestan mucho (un saco de café) y cosas que valen una fortuna y no
 * se notan (los documentos).
 */
export const OBJETOS = {
  // --- lo que viaja en las bolsas del tren de carga ---
  tabaco:      { id: 'tabaco',      nombre: 'Fardo de tabaco',     nivel: 'comun',   slots: 3, forma: [3, 1], dibujo: 'fardo' },
  whisky:      { id: 'whisky',      nombre: 'Cajón de whisky',     nivel: 'comun',   slots: 4, forma: [2, 2], dibujo: 'botellas' },
  telas:       { id: 'telas',       nombre: 'Rollo de telas',      nivel: 'comun',   slots: 3, forma: [3, 1], dibujo: 'rollo' },
  herramienta: { id: 'herramienta', nombre: 'Caja de herramientas', nivel: 'comun',  slots: 4, forma: [2, 2], dibujo: 'cajon' },
  cafe:        { id: 'cafe',        nombre: 'Saco de café',        nivel: 'comun',   slots: 3, forma: [3, 1], dibujo: 'saco' },
  municion:    { id: 'municion',    nombre: 'Cajón de munición',   nivel: 'comun',   slots: 4, forma: [2, 2], dibujo: 'cajon' },
  cueros:      { id: 'cueros',      nombre: 'Atado de cueros',     nivel: 'comun',   slots: 3, forma: [3, 1], dibujo: 'fardo' },

  // --- lo que viaja en una caja fuerte ---
  cuberteria:  { id: 'cuberteria',  nombre: 'Cubertería de plata', nivel: 'valioso', slots: 2, forma: [2, 1], dibujo: 'estuche' },
  relojes:     { id: 'relojes',     nombre: 'Estuche de relojes',  nivel: 'valioso', slots: 2, forma: [2, 1], dibujo: 'estuche' },
  joyero:      { id: 'joyero',      nombre: 'Joyero de viaje',     nivel: 'valioso', slots: 1, forma: [1, 1], dibujo: 'joyero' },
  medicinas:   { id: 'medicinas',   nombre: 'Botiquín de morfina', nivel: 'valioso', slots: 2, forma: [2, 1], dibujo: 'botiquin' },
  oro:         { id: 'oro',         nombre: 'Polvo de oro',        nivel: 'valioso', slots: 1, forma: [1, 1], dibujo: 'bolsita' },

  /**
   * LOS TRES RAROS — los que nombró Santi *("reloj, documentos, lingotes")*.
   *
   * Son tres y no uno para que encontrar uno no sea siempre la misma frase.
   * Valen lo mismo y **abultan distinto**: ver la nota de `slots`, arriba.
   */
  relojOro:    { id: 'relojOro',    nombre: 'Reloj de oro macizo', nivel: 'raro',    slots: 1, forma: [1, 1], dibujo: 'joyero' },
  documentos:  { id: 'documentos',  nombre: 'Documentos lacrados', nivel: 'raro',    slots: 1, forma: [1, 1], dibujo: 'papeles' },
  lingotes:    { id: 'lingotes',    nombre: 'Lingotes de plata',   nivel: 'raro',    slots: 4, forma: [2, 2], dibujo: 'lingotes' },
};

/** Los ids de un nivel. Se calcula una vez y no en cada sorteo. */
const POR_NIVEL = Object.values(OBJETOS).reduce((acc, o) => {
  (acc[o.nivel] = acc[o.nivel] || []).push(o.id);
  return acc;
}, {});

/**
 * Sortea un objeto de ese nivel y le fija el valor ahí mismo, igual que el
 * jackpot de la caja fuerte: el valor ya está adentro del objeto desde que se
 * arma el tren, simplemente no lo sabés hasta que lo abrís.
 */
export function crearObjeto(rng, nivelId) {
  const nivel = NIVELES[nivelId] || NIVELES.comun;
  const ids = POR_NIVEL[nivel.id] || POR_NIVEL.comun;
  const def = OBJETOS[rng.pick(ids)];

  return {
    id: def.id,
    nombre: def.nombre,
    nivel: nivel.id,
    slots: def.slots,
    // Copia, no referencia: la forma de un objeto puede quedar ACOSTADA al
    // guardarlo (ver `buscarLugar`), y eso es de ESE objeto, no del catálogo.
    forma: [...def.forma],
    /** Con qué silueta se dibuja tirado en el vagón (ver entities/lootable.js). */
    dibujo: def.dibujo,
    valor: rng.int(nivel.valorMin, nivel.valorMax),
  };
}

/**
 * Cuántas casillas ocupan juntas estas cosas.
 *
 * Ya no la usa el asalto —ahí la cuenta la lleva la grilla (engine/grilla.js),
 * que es la que sabe si además ENTRAN— pero queda porque es la forma barata de
 * preguntar "cuánto bulto es esto" sin armar una grilla: la usa el perista para
 * mirar un lote y podría usarla cualquier pantalla futura.
 */
export function slotsDe(objetos = []) {
  return objetos.reduce((suma, o) => suma + (o.slots || 1), 0);
}

/**
 * QUÉ NIVEL LE TOCA A ESTE BOTÍN.
 *
 * Una bolsa siempre da común. Una caja fuerte da valioso… salvo que sea una de
 * las del almacén o una caja oculta, que son los DOS únicos lugares del juego
 * donde puede aparecer el raro (pedido explícito de Santi).
 */
export function nivelDeBotin(rng, typeId, puedeSerRaro) {
  if (typeId === 'bag') return 'comun';
  if (puedeSerRaro && rng.chance(CHANCE_RARO)) return 'raro';
  return 'valioso';
}
