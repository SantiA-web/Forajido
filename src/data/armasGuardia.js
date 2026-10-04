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
    punteria: 0.45,
    apuntar: 1.5,
    cadencia: 1.3,
    rafaga: 1,
    rafagaPausa: 0,
    velocidadBala: 330,
    alcance: 300,
    vistaCombate: 170,
    distanciaIdeal: 140,
    paradaAvance: 140,
    dibujo: 'rifle',
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
