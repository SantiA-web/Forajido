/**
 * LA HUIDA: los jinetes que quedaban vivos te siguen cuando saltás del tren.
 *
 * *(Santi: "una vez escapas del tren, si todavía quedan agentes de ley a
 * caballo te persigan y se convierta en una persecución corta, no tiene porque
 * llevarse mucha atención". Eligió la opción A —cada tiro que te pegan te hace
 * soltar una bolsa, nunca te agarran—, que dure 15 segundos, y apuntar con el
 * mouse, igual que en el asalto.)*
 *
 * SÓLO PASA SI ESCAPASTE CON LA ALARMA SONANDO Y HABÍA JINETES VIVOS. El
 * trabajo limpio no deja a nadie siguiéndote, y la ley tarda en llegar (ver
 * `RIDER_SPAWN.firstAfterAlarm`): escapar rápido después de que suene la
 * alarma también te la ahorra.
 *
 * ⚠️ GRÁFICOS SIMPLES A PROPÓSITO (lo acordado con Santi: lo nuevo del asalto
 * se dibuja simple y se viste después). Los caballos y los jinetes son los de
 * siempre porque ya existían; lo nuevo —las bolsas, los avisos, el panel— está
 * en la lista "por vestir" de NOTAS-DISENO.md.
 */
export const HUIDA = {
  /** Lo que dura, en segundos. Número de Santi. */
  duracion: 15,

  /**
   * CUÁNTO DE LA PLATA SE LLEVA CADA BOLSA, como fracción de la que sacaste del
   * tren. Todas iguales, para que se puedan contar: con 0,15 son seis bolsas y
   * media para quedarte sin nada.
   *
   * ⚠️ PROVISORIO: se elige midiendo (ver NOTAS-DISENO.md, "La huida").
   */
  bolsaFraccion: 0.10,

  /** Después de un tiro, cuánto tardan en poder volver a sacarte una bolsa. */
  invulnerable: 0.9,

  /** A qué velocidad desfila el suelo (sólo se ve: nadie choca con nada). */
  velocidadSuelo: 190,

  /** Cuánto cielo se ve arriba de todo, en unidades. */
  cielo: 34,

  jugador: {
    /** Arriba y abajo, y adelante y atrás dentro de la pantalla (px/s). */
    velocidadY: 95,
    velocidadX: 75,
    /** Entre qué fracciones del ancho de la pantalla podés moverte. */
    xMin: 0.34,
    xMax: 0.74,
    /**
     * A CABALLO SE TIRA PEOR: la dispersión de tu arma se multiplica por esto.
     * Con el Colt (0,035) queda en 0,105 — a 120 unidades, unas 12 de abanico,
     * más o menos el alto de un jinete.
     */
    dispersionACaballo: 3,
  },

  jinetes: {
    /**
     * No entran todos juntos: el primero a los `entraPrimero` segundos y cada
     * uno de los demás `entraCada` después. Así los primeros segundos se ve
     * quién viene antes de que empiecen los tiros.
     */
    entraPrimero: 0.6,
    entraCada: 0.9,

    /** Qué tan rápido se acomodan detrás tuyo (px/s en pantalla). */
    velocidad: 85,

    /** Cuánto detrás tuyo se plantan, el primero; cada uno más, `separacion` más. */
    distancia: 90,
    separacion: 24,

    /** Más lejos que esto no tiran. */
    alcance: 230,

    /**
     * EL AVISO ANTES DEL TIRO, igual que los jinetes del asalto
     * (`RIDERS.ley.aimTime`, 0,50): se les ponen los ojos rojos y aparece el
     * "!" arriba. La dirección queda fija cuando empiezan a apuntar, así que
     * moverte en ese medio segundo es esquivar.
     */
    apuntar: 0.5,

    /** Cada cuánto tira cada uno, más un poco al azar para que no vayan en coro. */
    cadencia: 1.5,
    cadenciaAzar: 0.8,

    /** Radianes de abanico. */
    dispersion: 0.18,

    velocidadBala: 250,
  },
};
