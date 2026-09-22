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
  tope: 90,

  /** Cuánto cielo se ve arriba de todo, en unidades. */
  cielo: 34,

  jugador: {
    /**
     * Dónde vas en la pantalla, en fracción del ancho. Tu caballo va a fondo
     * (`sprintSpeed`) salvo que aprietes [A]: ahí baja a su `brakeSpeed` (85
     * los dos) y los jinetes se te vienen al costado. **Frenar es para
     * pelear** *(Santi: "que exista la opción de usar la tecla A")*.
     */
    x: 0.62,
    /** Arriba y abajo (px/s): la misma del galope (`velVertical`). */
    velocidadY: 105,
    /**
     * A CABALLO SE TIRA PEOR: la dispersión de tu arma se multiplica por esto.
     * Con el Colt (0,035) queda en 0,105.
     */
    dispersionACaballo: 3,

    /**
     * APUNTAR CON CLIC DERECHO, como en el asalto *(Santi: "o que exista la
     * posibilidad de apuntar con click derecho")*: la dispersión pasa a la
     * `spreadApuntado` del arma (la mitad) en `CONFIG.mira.tiempoCierre`.
     *
     * Y SE PAGA IGUAL QUE EN EL ASALTO, CON EL CUERPO: allá apuntando caminás
     * más lento; acá, con la cabeza en el arma, manejás peor el caballo — W/S
     * corren a esta fracción. Sin un costo, se apuntaría siempre.
     */
    manejoApuntando: 0.6,

    /**
     * HASTA DÓNDE GIRA EL TORSO CÓMODO, en grados desde adelante *(Santi: "el
     * jugador no es un buho")*.
     *
     * No es parejo, porque sos diestro y galopás hacia la derecha: tu brazo
     * derecho queda del lado de la cámara (abajo en la pantalla). Para ese lado
     * te das vuelta sobre el hombro y llegás más atrás; para el otro tenés que
     * cruzar el brazo por delante del cuerpo y llegás menos.
     *
     * 🔁 PRIMERO ERA UN TOPE DURO, Y SE LLEVABA PUESTA LA PELEA: los jinetes
     * vienen detrás, casi en línea, así que con 150/110 estaban a tiro el 3%
     * del tiempo. Ahora es la zona CÓMODA *(Santi: "sí podría un jinete
     * disparar hacia atrás. El tema es que perdería puntería")*: pasado esto
     * se puede tirar igual, pero ver `atras`.
     */
    giroDerecha: 150,    // hacia abajo en la pantalla, del lado del brazo
    giroIzquierda: 110,  // hacia arriba, cruzando el brazo

    /**
     * TIRAR PASADO EL GIRO CÓMODO *(Santi: "cuando el circulo del arma pasa
     * los grados ideales hacia atrás, se ensancha [...] al no estar viendo al
     * frente, el caballo puede que tome una pequeña dirección de un
     * segundo")*.
     *
     *  - `dispersionMax`: la dispersión se multiplica de a poco desde el tope
     *    cómodo hasta esto, derecho hacia atrás. El círculo crece igual.
     *  - Mientras apuntás pasado el tope no ves adelante: cada `desvioCada`
     *    segundos (más un poco al azar) el caballo se tuerce solo, para arriba
     *    o para abajo, a `desvioVelocidad` px/s durante `desvioDura`. Lo podés
     *    corregir con W/S, si te das cuenta.
     */
    atras: {
      /**
       * 🔻 BAJÓ DE ×4 A ×1,5 *(Santi: "el circulo se agranda un montón, no me
       * imagino como sería con el Smith")*. Con ×4 el Smith (0,085 × 3 a
       * caballo) llegaba al tope del dibujo y el tiro real se abría a ±58°.
       */
      dispersionMax: 1.5,
      desvioCada: 1.2,
      desvioAzar: 0.8,
      desvioDura: 1.0,
      desvioVelocidad: 55,
    },
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
     * LA VELOCIDAD DE LOS CABALLOS DE LA LEY. 🔺 SUBIÓ DE 130 A 142, la del
     * Criollo *(Santi, después de jugarlo: "sigue sin servir tanto [disparar] y
     * entonces me gustaría que el caballo de ellos tenga la misma velocidad que
     * el Criollo")*.
     *
     * LO QUE CAMBIA, Y ES TODO EL SENTIDO: con el Criollo ya no los podés
     * perder corriendo, así que disparar deja de ser opcional. Con el Mustang
     * (180) seguís escapando en 3 o 4 segundos: por eso se paga.
     *
     * Medido contra 5 jinetes con el Criollo y el Colt: sólo esquivar pasó de
     * 14 s perdiendo 12% a **58 s perdiendo 78%**; correr y tirar, 13 s
     * perdiendo 13%; frenar y pelear, 7 s perdiendo 21%.
     */
    velocidad: 142,

    /**
     * Y AL MINUTO SUS CABALLOS AFLOJAN *(opción elegida por Santi)*. A los
     * `cansancio.desde` segundos bajan a `cansancio.velocidad` —en
     * `cansancio.entra` segundos, no de golpe— y ahí sí los dejás atrás.
     *
     * Existe porque sin esto, con el Criollo, el que no dispara se queda
     * dando vueltas hasta que salta el seguro. Huir sin pelear sigue siendo
     * posible, pero carísimo: para cuando aflojan ya soltaste casi todo.
     */
    cansancio: {
      desde: 45,
      entra: 3,
      velocidad: 120,
    },
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

    /**
     * Hasta dónde se te arriman: a la par tuya, nunca adelante. Con 0 y su
     * carril arriba o abajo tuyo, si frenás quedan al costado — y ahí están
     * de lleno en tu giro cómodo.
     */
    distanciaMinima: 0,

    /**
     * A CABALLO, UN TIRO BASTA *(Santi, después de jugarlo: "en la huida no
     * sirve disparar. Ya lo corroboré, es más rápido y seguro solo correr y
     * esquivar")*. En el asalto un jinete aguanta dos (`RIDERS.ley.health`);
     * acá uno, porque a un tipo galopando a fondo un balazo lo voltea.
     *
     * Era el problema de fondo: con dos tiros, pegarle una vez no cambiaba
     * nada, y frenar para pelear costaba la mitad de la plata. Medido con un
     * robot que apunta como una persona (reacciona tarde y le erra), contra 5
     * jinetes con el Criollo: frenar y pelear pasó de **14 s perdiendo 53%** a
     * **6 s perdiendo 11%** — y esquivar sin tirar son 14 s perdiendo 12%.
     */
    vida: 1,

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

    /**
     * EL GRITO. Cada tanto uno grita "¡alto ahí!" cuando se prepara para
     * tirar; no en cada tiro, o sería un coro insoportable.
     */
    chanceGrito: 0.3,
    gritoCada: 2.5,
  },
};
