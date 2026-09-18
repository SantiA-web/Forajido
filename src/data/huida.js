/**
 * LA HUIDA: los jinetes que quedaban vivos te siguen cuando saltás del tren.
 *
 * *(Santi: "una vez escapas del tren, si todavía quedan agentes de ley a
 * caballo te persigan y se convierta en una persecución corta, no tiene porque
 * llevarse mucha atención". Eligió la opción A —cada tiro que te pegan te hace
 * soltar una bolsa, nunca te agarran— y apuntar con el mouse, igual que en el
 * asalto.)*
 *
 * 🔁 NO HAY RELOJ: SE GANA CON EL CABALLO *(Santi: "pondría que tenga que ver
 * la velocidad del caballo cuando es que lo vas a perder, no el tiempo. Haría
 * que los guardias empiecen a una cierta distancia de vos. Todos galopan y
 * mientras más rápido el caballo con respecto al de los guardias, más rápido
 * te vas a librar. O podés matarlos a todos")*. La primera versión duraba 15
 * segundos fijos.
 *
 * SÓLO PASA SI ESCAPASTE CON LA ALARMA SONANDO, CON PLATA Y HABÍA JINETES
 * VIVOS. El trabajo limpio no deja a nadie siguiéndote, y la ley tarda en
 * llegar (ver `RIDER_SPAWN.firstAfterAlarm`): escapar rápido después de que
 * suene la alarma también te la ahorra.
 *
 * ⚠️ GRÁFICOS SIMPLES A PROPÓSITO (lo acordado con Santi: lo nuevo del asalto
 * se dibuja simple y se viste después). Los caballos y los jinetes son los de
 * siempre porque ya existían; lo nuevo —las bolsas, los avisos, el panel— está
 * en la lista "Por vestir" de NOTAS-DISENO.md.
 */
export const HUIDA = {
  /**
   * CUÁNTO DE LA PLATA SE LLEVA CADA BOLSA, como fracción de la que sacaste del
   * tren. Todas iguales, para que se puedan contar: con 0,10 son diez bolsas
   * para quedarte sin nada.
   *
   * Elegido por Santi sobre una tabla medida (ver NOTAS-DISENO.md, "La huida").
   */
  bolsaFraccion: 0.10,

  /** Después de un tiro, cuánto tardan en poder volver a sacarte una bolsa. */
  invulnerable: 0.9,

  /**
   * UN SEGURO, NO UN RELOJ. La huida termina cuando los perdés o los tirás a
   * todos; esto sólo existe para que nunca quede colgada si algún día hay un
   * caballo más lento que los de la ley. Con los dos de hoy no se llega nunca.
   */
  tope: 60,

  /** Cuánto cielo se ve arriba de todo, en unidades. */
  cielo: 34,

  jugador: {
    /**
     * Dónde vas en la pantalla, en fracción del ancho. Tu caballo va SIEMPRE a
     * fondo (`sprintSpeed`): huís por tu vida, y frenar sólo te perjudicaría.
     * Por eso no hay A ni D, sólo W/S para esquivar.
     */
    x: 0.62,
    /** Arriba y abajo (px/s): la misma del galope (`velVertical`). */
    velocidadY: 105,
    /**
     * A CABALLO SE TIRA PEOR: la dispersión de tu arma se multiplica por esto.
     * Con el Colt (0,035) queda en 0,105.
     */
    dispersionACaballo: 3,
  },

  /**
   * LOS OBSTÁCULOS *(Santi: "que hayan obstáculos al igual que en el galope
   * previo. Esos obstáculos los guardias también tratarán de esquivarlos")*.
   *
   * Son LOS MISMOS del galope: los cuatro tipos, sus radios, cada cuánto
   * aparecen (`obstaculoCada`), cuánto dura el choque (`obstaculoFrenado`) y
   * cuánto te frena (`choqueFactor`) salen de `APROXIMACION` en data/horse.js.
   * Chocar ahora cuesta DISTANCIA: mientras dura el choque vas al 15% y los
   * que vienen atrás se te acercan.
   */
  obstaculos: {
    /** A qué distancia del borde derecho aparece el primero: un respiro. */
    primero: 140,
    /**
     * Cuánto adelante miran los jinetes para esquivar, y con cuánto margen
     * pasan. Lo ven venir a 75: a 130 px/s les queda más de medio segundo para
     * correrse, que alcanza — y si están apuntando no se mueven para el
     * costado, así que a veces se la comen.
     */
    mira: 75,
    margen: 14,
  },

  jinetes: {
    /**
     * LA VELOCIDAD DE LOS CABALLOS DE LA LEY. Elegida por Santi entre 120, 130
     * y 136. Sin chocar con nada, perderlos tarda unos 12 s con el Criollo
     * (142) y unos 3 s con el Mustang (180): el Mustang es lo que pagaste.
     */
    velocidad: 130,
    /**
     * Y CADA UNO TIENE SU CABALLO: hasta 5 más o 5 menos. Así se van quedando
     * de a uno y no todos juntos, y se nota cuando perdiste a uno.
     */
    variacion: 5,

    /** A qué distancia detrás tuyo arrancan, y cuánto más atrás cada uno. */
    distanciaInicial: 110,
    separacionInicial: 14,

    /**
     * A ESTA DISTANCIA LO PERDISTE: es cuando el jinete ya salió de la
     * pantalla por la izquierda (vas a 0,62 del ancho, unos 200 de 320).
     */
    perdida: 250,

    /** Más cerca que esto no se te ponen, aunque vos choques: van detrás. */
    distanciaMinima: 40,

    /** Qué tan rápido se corren para arriba o para abajo (px/s). */
    velocidadLateral: 68,

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

    /**
     * Radianes de abanico. Subió de 0,10 a 0,18 midiendo: con 0,10, quedarte
     * quieto con UN jinete era un tiro casi seguro cada vez.
     */
    dispersion: 0.18,

    velocidadBala: 250,
  },
};
