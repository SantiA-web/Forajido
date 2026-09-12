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
 *   2. **No te entran todos** (`CONFIG.objetos.capacidad`). Adentro del asalto
 *      aparece una pregunta que hasta ahora no existía: *¿cuál me llevo?*
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
 * EL CATÁLOGO. `nivel` dice de dónde puede salir; el resto es nombre y sabor.
 *
 * Los nombres importan más de lo que parece: un "objeto valioso" genérico es un
 * número con otra cara, y un **lingote de plata** es algo que te podés imaginar
 * llevando bajo el brazo mientras corrés por un pasillo.
 */
export const OBJETOS = {
  // --- lo que viaja en las bolsas del tren de carga ---
  tabaco:      { id: 'tabaco',      nombre: 'Fardo de tabaco',     nivel: 'comun' },
  whisky:      { id: 'whisky',      nombre: 'Cajón de whisky',     nivel: 'comun' },
  telas:       { id: 'telas',       nombre: 'Rollo de telas',      nivel: 'comun' },
  herramienta: { id: 'herramienta', nombre: 'Caja de herramientas', nivel: 'comun' },
  cafe:        { id: 'cafe',        nombre: 'Saco de café',        nivel: 'comun' },
  municion:    { id: 'municion',    nombre: 'Cajón de munición',   nivel: 'comun' },
  cueros:      { id: 'cueros',      nombre: 'Atado de cueros',     nivel: 'comun' },

  // --- lo que viaja en una caja fuerte ---
  cuberteria:  { id: 'cuberteria',  nombre: 'Cubertería de plata', nivel: 'valioso' },
  relojes:     { id: 'relojes',     nombre: 'Estuche de relojes',  nivel: 'valioso' },
  joyero:      { id: 'joyero',      nombre: 'Joyero de viaje',     nivel: 'valioso' },
  medicinas:   { id: 'medicinas',   nombre: 'Botiquín de morfina', nivel: 'valioso' },
  oro:         { id: 'oro',         nombre: 'Polvo de oro',        nivel: 'valioso' },

  /**
   * LOS TRES RAROS — los que nombró Santi *("reloj, documentos, lingotes")*.
   *
   * Son tres y no uno para que encontrar uno no sea siempre la misma frase.
   * Valen lo mismo: lo que cambia es qué te imaginás llevando.
   */
  relojOro:    { id: 'relojOro',    nombre: 'Reloj de oro macizo', nivel: 'raro' },
  documentos:  { id: 'documentos',  nombre: 'Documentos lacrados', nivel: 'raro' },
  lingotes:    { id: 'lingotes',    nombre: 'Lingotes de plata',   nivel: 'raro' },
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
    valor: rng.int(nivel.valorMin, nivel.valorMax),
  };
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
