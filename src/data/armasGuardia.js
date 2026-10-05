/**
 * LAS ARMAS DE LOS GUARDIAS.
 *
 * *(Santi: "quiero que no todos tengan un revólver, sino que hayan armas
 * diferentes, que tengan que recargar")*
 *
 * Hasta acá todos tiraban con el mismo revólver, de a dos balas, sin recargar
 * nunca. Ahora cada guardia nace con un arma (`armaDeGuardia`, abajo) y el arma
 * decide tres cosas:
 *
 *   1. CÓMO TIRA. Los números de puntería, ráfaga y cadencia del guardia
 *      (`e.ai`) siguen siendo la base —ahí entran la dificultad del tren y el
 *      aura del Sheriff— y el arma los MULTIPLICA (`punteria`, `apuntar`,
 *      `cadencia`) o los REEMPLAZA (`rafaga`, `rafagaPausa`). El revólver deja
 *      todo como estaba: es el guardia de siempre.
 *   2. CUÁNTO AGUANTA SIN RECARGAR (`cargador`, `recarga`). Recargar es la
 *      ventana del jugador: el guardia se esconde, grita y se le ve.
 *   3. A QUÉ DISTANCIA PELEA (`distanciaIdeal`, `paradaAvance`). El del
 *      Winchester se queda lejos; el de la escopeta te viene a buscar.
 *
 * LA ESCOPETA TIRA PERDIGONES: `perdigones` balas en un `abanico`, cada una
 * con `factorPerdigon` del daño de una bala. De cerca entran casi todos; de
 * lejos el abanico se abre y además pegan menos (`caida`).
 */

export const ARMAS_GUARDIA = {
  /**
   * EL COLT SINGLE ACTION ARMY — el de la ley y el ejército. *(Elegido sobre
   * el Schofield: se carga bala por bala por una portezuela, y esa recarga
   * lenta es justo la ventana del jugador. El Schofield se quiebra y se carga
   * de golpe: es el Smith & Wesson del jugador.)*
   */
  revolver: {
    id: 'revolver',
    nombre: 'Revólver Colt',
    cargador: 6,
    recarga: 3.0,
    // Todo lo demás, como siempre: el revólver ES el guardia de antes.
    punteria: 1,
    apuntar: 1,
    cadencia: 1,
    velocidadBala: 210,
    distanciaIdeal: 80,
    paradaAvance: 92,
    dibujo: true,
  },

  /**
   * EL WINCHESTER DE PALANCA. Un tiro por vez, apuntando más (×1,5: avisa
   * más), el doble de preciso, una bala más rápida y que llega más lejos. Se
   * queda atrás y ve más lejos una vez que está peleando (`vistaCombate`): un
   * tirador ve hasta donde llega su arma.
   */
  winchester: {
    id: 'winchester',
    nombre: 'Winchester',
    cargador: 10,
    recarga: 4.0,
    /**
     * 🐛 LA PUNTERÍA ERA 0,45 Y NO SE NOTABA. A 140 px (su distancia de
     * pelea) `spreadFar` 0,28 × 0,45 = 0,126 rad, o sea que la bala se abría
     * **±17,6 px a cada costado** contra un jugador de ~9 px de ancho: casi
     * el doble de tu cuerpo. El arma de precisión del juego erraba por dos
     * cuerpos y pico, así que no se distinguía del revólver (±22 px).
     *
     * 0,20 la deja en **±7,8 px**: la bala entra en el ancho del cuerpo. Es
     * el número que hace que su peligro sea ACERTAR, que es lo único que
     * puede ser el peligro de un arma que tira una bala cada 1,4 s.
     */
    punteria: 0.20,
    apuntar: 1.5,
    cadencia: 1.3,
    rafaga: 1,
    rafagaPausa: 0,
    /**
     * 🐛 Y EN PÁNICO SE VOLVÍA UNA AMETRALLADORA. `rafaga: 1` vale para el
     * tiro normal, pero el pánico lo pisaba con `panicoBurstSize` (5) y la
     * pausa salía de `rafagaPausa` — que acá es CERO, porque un arma que
     * tira de a una bala no necesita pausa entre tiros que no existen.
     * Resultado medido: cinco balas con 0,11 s entre cada una, de un rifle
     * de palanca. No hay mano que accione una palanca nueve veces por
     * segundo.
     *
     * `rafagaPanico` le pone techo propio al pánico y `rafagaPanicoPausa` le
     * devuelve el tiempo de la palanca. Tres balas a 0,6 s **se ven como
     * apuro** (contra 1,4 s de su cadencia normal) sin parecer automático.
     */
    rafagaPanico: 3,
    rafagaPanicoPausa: 0.6,
    // Y a ciegas (puerta, techo) el mismo ritmo: la palanca no se apura
    // porque haya una puerta en el medio.
    rafagaCiega: 3,
    rafagaCiegaPausa: 0.6,
    /**
     * EL PÁNICO NO LE SACA PUNTERÍA. `panicoSpreadExtra` (0,08) se suma
     * DERECHO al ángulo, sin pasar por `punteria`: a 140 px son 11,2 px de
     * más, o sea que el pánico le arruinaba la mira más de lo que la mira
     * valía. Un tirador con un rifle al hombro no pierde el pulso porque lo
     * encaren: se queda lejos justamente para eso.
     */
    sinPanicoSpread: true,
    velocidadBala: 330,
    alcance: 300,
    vistaCombate: 170,
    distanciaIdeal: 140,
    paradaAvance: 140,
    // Caja de bronce, palanca y tubo; apunta con la cabeza sobre el arma.
    dibujo: 'winchester',
  },

  /**
   * LA ESCOPETA DE DOBLE CAÑO. Los dos caños casi seguidos y a recargar. De
   * cerca (menos de 40 px) entran casi todos los perdigones: ~35-40 de vida
   * por caño. A 100 px llegan uno o dos y flojos. Avanza hasta tenerte cerca.
   *
   * 🐛 LOS CAÑOS VAN A 0,65 s Y NO A 0,35. Después de un impacto el jugador
   * queda invulnerable 0,6 s (`CONFIG.player.invulnTime`), y con 0,35 el
   * segundo caño pegaba siempre dentro de ese instante: medido, de seis
   * escopetazos pegaban tres, nunca el segundo. Y el perdigón pasó de un
   * cuarto a 0,35 de bala: a 30 px entran 3 o 4 de los 6, no todos, y con un
   * cuarto el caño sacaba ~19 de vida en vez de ~35.
   */
  escopeta: {
    id: 'escopeta',
    nombre: 'Escopeta de doble caño',
    cargador: 2,
    recarga: 2.5,
    punteria: 1,
    apuntar: 1,
    cadencia: 1,
    rafaga: 2,
    rafagaPausa: 0.65,
    // En pánico y a ciegas tira LO QUE TIENE: dos caños. No hay un tercero,
    // así que `panicoBurstSize` (5) nunca significó nada acá — salvo que el
    // tiro ciego, que no mira el arma, le inventaba cinco.
    rafagaPanico: 2,
    rafagaPanicoPausa: 0.65,
    rafagaCiega: 2,
    rafagaCiegaPausa: 0.65,
    velocidadBala: 210,
    alcance: 120,
    perdigones: 6,
    abanico: 0.30,
    factorPerdigon: 0.35,
    caida: { plenoHasta: 0.3, alFinal: 0.3 },
    distanciaIdeal: 50,
    paradaAvance: 40,
    dibujo: 'escopeta',
  },

  /**
   * LA RECORTADA DEL DINAMITERO: la misma escopeta con el caño y la culata
   * serruchados. Más abierta, más corta, más rápida de recargar. Es lo que
   * saca cuando te le metiste demasiado cerca para tirarte una dinamita.
   */
  recortada: {
    id: 'recortada',
    nombre: 'Escopeta recortada',
    cargador: 2,
    recarga: 2.0,
    punteria: 1,
    apuntar: 1,
    cadencia: 1,
    rafaga: 2,
    rafagaPausa: 0.62,
    rafagaPanico: 2,
    rafagaPanicoPausa: 0.62,
    rafagaCiega: 2,
    rafagaCiegaPausa: 0.62,
    velocidadBala: 210,
    alcance: 90,
    perdigones: 6,
    abanico: 0.45,
    factorPerdigon: 0.35,
    caida: { plenoHasta: 0.3, alFinal: 0.3 },
    distanciaIdeal: 45,
    paradaAvance: 35,
    dibujo: 'recortada',
  },

  /**
   * LOS DOS REVÓLVERES DEL PISTOLERO. Cómo tira (ráfaga de 4, rápido y sucio)
   * ya lo trae su tipo (`GUARD_TYPES.pistolero.ai`); el arma sólo le pone el
   * cargador doble y la recarga de dos revólveres.
   */
  dosRevolveres: {
    id: 'dosRevolveres',
    nombre: 'Dos revólveres',
    cargador: 12,
    recarga: 4.5,
    punteria: 1,
    apuntar: 1,
    cadencia: 1,
    velocidadBala: 210,
    distanciaIdeal: 80,
    paradaAvance: 92,
    dibujo: true,
  },
};

/**
 * QUIÉN LLEVA QUÉ *(Santi: "Los guardias pueden llevar revólver con 60% de
 * posibilidad, rifle con 20% y escopeta con 20%. Los de blindado pueden llevar
 * 40% de rifle, 40% de escopeta y 20% de revólver")*.
 */
export const REPARTO_ARMAS = {
  comun: [['revolver', 60], ['winchester', 20], ['escopeta', 20]],
  blindado: [['winchester', 40], ['escopeta', 40], ['revolver', 20]],
};

/**
 * Los que no sortean: su arma es parte de quiénes son. El Sheriff lleva DOS
 * (ver `ARMAS_DOBLES`).
 */
const ARMA_FIJA = {
  pistolero: 'dosRevolveres',
  dinamitero: 'recortada',
  sheriff: 'winchester',
};

/**
 * EL QUE LLEVA ARMA LARGA Y ARMA CORTA *(Santi: "el sheriff con Winchester y
 * revólver (puede optar)")*: con el jugador más cerca que `corta.hasta`, saca
 * la corta. Cada una con su propio cargador.
 */
export const ARMAS_DOBLES = {
  sheriff: { larga: 'winchester', corta: 'revolver', hasta: 70 },
};

function sortear(rng, reparto) {
  const total = reparto.reduce((s, [, p]) => s + p, 0);
  let t = rng.next() * total;
  for (const [id, p] of reparto) {
    t -= p;
    if (t < 0) return id;
  }
  return reparto[reparto.length - 1][0];
}

/** El id del arma con la que nace un guardia de este tipo. */
export function armaDeGuardia(tipo, rng) {
  if (ARMA_FIJA[tipo]) return ARMA_FIJA[tipo];
  return sortear(rng, tipo === 'blindado' ? REPARTO_ARMAS.blindado : REPARTO_ARMAS.comun);
}
