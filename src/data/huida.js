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

  /**
   * LA LUPA DE ESTA ESCENA *(Santi: "podríamos reducir el zoom... y así se ve
   * más terreno")*. El mundo se dibuja con 4 puntos por unidad; acá con 3, o
   * sea **un tercio más de campo a lo ancho y a lo alto**. Entera a propósito:
   * con 3,5 los puntos caerían a medias y el dibujo se vería sucio.
   */
  zoom: 3,

  /**
   * 🔺 CAMPO ABIERTO, NO UNA FRANJA *(Santi, después de jugarlo: "no me refería
   * a esos caminos, sino a que literalmente el caballo pueda cabalgar hacia el
   * norte o sur en vez de solo hacia el este")*.
   *
   * Las versiones anteriores eran un pasillo que iba al este: el mundo
   * desfilaba y vos subías y bajabas dentro de la pantalla. Ahora el mundo es
   * un plano y la cámara te sigue: galopás hacia donde quieras, y los tres
   * destinos están cada uno en SU lugar del campo, a distinta distancia y en
   * distinta dirección. El camino es de verdad una elección: hacia cuál vas.
   */
  mundo: {
    /**
     * 🎲 DÓNDE CAEN LOS TRES, SORTEADO DE VERDAD *(Santi: "deberíamos hacer que
     * los puntos de llegada sean aleatorios sus ubicaciones, para que no
     * siempre se elija uno y no otro")*.
     *
     * Antes salían en un abanico angosto delante tuyo y casi a la misma
     * distancia (3.000-4.200): el del medio era siempre el obvio y elegir no
     * existía. Ahora cada uno saca SU distancia, así que siempre hay uno cerca
     * y uno lejos y cuál es cuál cambia en cada corrida. Con el Criollo (142
     * de galope): 2.200 son unos 15 segundos, 3.500 unos 25 y 5.000 unos 35.
     */
    distanciaMin: 2200,
    /**
     * 🔻 Era 5.000 y se acercó *(Santi, al hacer que la resistencia sea el
     * reloj de la huida)*: el Mustang tiene 17 segundos de galope y un refugio
     * a 5.000 son 28 — te quedabas a pie a mitad de camino por cómo salió el
     * sorteo y no por lo que hiciste. Primero se probó 4.000; jugándolo, Santi
     * lo dejó en **4.500** (25 segundos): sigue siendo caro para el Mustang,
     * pero es una decisión y no una condena.
     */
    distanciaMax: 4500,

    /**
     * EL ABANICO donde pueden caer, en grados PARA CADA LADO de por donde
     * venías huyendo. Con 120 uno puede quedarte al costado o un poco atrás:
     * hay que mirar la brújula y decidir, no seguir derecho. El círculo entero
     * (180) quedó afuera porque un refugio justo atrás te obliga a cruzar por
     * el medio de la partida, y eso no es una decisión: es un castigo.
     */
    abanicoGrados: 120,

    /**
     * LO MÍNIMO QUE SE SEPARAN entre sí, en grados. El sorteo suelto a veces
     * pega dos en el mismo rumbo, y ahí elegir vuelve a no existir. Con dos
     * refugios en el desierto se puede pedir más que con tres: 90 son un
     * cuarto de vuelta entre uno y otro, así que nunca están "casi en la misma
     * dirección" y siempre hay que decidir.
     */
    separacionGrados: 90,

    /** El tamaño de cada refugio y cuánto mide su entrada, en grados. */
    radio: 92,
    aberturaGrados: 66,

    /**
     * Chocar contra la pared de un refugio: te frena a esta fracción mientras
     * estés pegado. La entrada hay que buscarla, y eso cuesta.
     */
    choquePared: 0.2,

    /**
     * 🎭 CADA REFUGIO, DISTINTO. Hasta acá los tres eran el mismo anillo con
     * otra pintura: llegar a uno o a otro daba exactamente lo mismo, y si dan
     * lo mismo, elegir es tirar una moneda. Cada uno tiene ahora su terreno:
     *
     *  - EL BOSQUE DE ROCAS está sembrado de piedras alrededor. Cuesta llegar
     *    sin chocar, pero la ley te sigue: el que sabe entrar los deja
     *    plantados contra una roca.
     *  - EL RÍO tiene la llegada limpia y abierta. Se galopa derecho, pero no
     *    hay nada con qué hacerlos chocar: llegás si tenés caballo, no maña.
     *  - LA QUEBRADA esconde la entrada del otro lado: hay que rodearla con
     *    ellos encima. Es la más barata de alcanzar y la más cara de entrar.
     */
    caracter: {
      /** Hasta dónde llega el terreno propio de un refugio, en unidades. */
      alrededor: 600,

      /**
       * 🌲 EL BOSQUE ES UN BOSQUE *(Santi, después de jugarlo: "el bosque de
       * piedras literal debería ser un bosque de piedras. Hoy en día solo hay
       * algunas piedritas. Debería ser esquivar y esquivar")*. Tenía razón:
       * con 2 a 4 por celda quedaba una piedra cada 87 unidades y se pasaba
       * de largo sin tocar nada.
       *
       * Ahora el bosque empieza más lejos (`bosqueAlrededor`) y tiene
       * `bosqueMin`-`bosqueMax` por celda de 150: una piedra cada ~43
       * unidades, o sea una cada tres décimas de segundo a galope tendido. Se
       * entra esquivando o no se entra.
       */
      bosqueAlrededor: 900,
      bosqueMin: 7,
      bosqueMax: 11,

      /** Y la mayoría son piedras, no yuyos: de cada 10, esta cantidad. */
      bosqueRocas: 0.75,

      /** Ningún obstáculo nace a menos de esto de la pared de un refugio. */
      despejeRefugio: 40,
    },

    /**
     * 🏆 LO QUE TE DA CADA REFUGIO *(Santi: "cada refugio otorga algo
     * distinto... quebrada (te devuelve una bolsa), o bosque de piedras")*.
     *
     * Son DOS MONEDAS DISTINTAS, y por eso la elección no es "cuál queda más
     * cerca":
     *
     *  - LA QUEBRADA te devuelve PLATA, ahora: una de las bolsas que soltaste
     *    (el 10% del botín). Se paga rodeándola, que es lo que cuesta entrar.
     *  - EL BOSQUE te saca PESO DE ENCIMA: los jinetes que tiraste en la huida
     *    no los vio nadie, así que no te suben la recompensa (15 cada uno, ver
     *    CONFIG.bounty.pesoGuardia). Santi eligió esta versión chica sobre la
     *    de borrar la recompensa del asalto entero: "la A me parece exagerada".
     */
    premios: {
      quebradaBolsas: 1,
      bosqueTapaJinetes: true,
    },
  },

  jugador: {
    /**
     * 🐴 LAS RIENDAS: cuánto tarda en doblar, en radianes por segundo.
     * Galopás hacia donde mirás y podés ir a cualquier rumbo; lo que no se
     * puede es cambiarlo de golpe, y ese retraso es lo que hace que doblar se
     * sienta como doblar.
     *
     * *(Santi pidió primero 0,7 —"las riendas están en 0,4 segundos, me
     * gustaría pasarlo a 0,7"— lo jugó y volvió: "los 0,7 son pesadísimos, lo
     * pongamos en 0,5". El caballo lanzado tiene que costar, pero no puede
     * dejar de contestar.)*
     *
     * ⚠️ LA CUENTA VA SOBRE EL PASO DE VERDAD, QUE NO ES DE 45°. Las teclas dan
     * ocho rumbos, pero en tres cuartos el norte rinde el 62% (`PROFUNDIDAD`),
     * así que el sudeste de la pantalla es un rumbo de **58°** en el mundo, no
     * de 45. Ir del este al sudeste —una tecla más— es el paso que uno siente,
     * y es ése el que hay que medir. Medido adentro del juego, no en el papel:
     *
     * | radianes/s | este→sudeste | 90° | media vuelta |
     * |---|---|---|---|
     * | 2,4 (el original) | 0,42 | 0,65 | 1,31 |
     * | 1,12 (probado: pesadísimo) | 0,91 | 1,40 | 2,80 |
     * | **2,03 (puesto)** | **0,50** | 0,77 | 1,55 |
     *
     * Los 0,42 del original son los "0,4" que había contado Santi: tenía el
     * número exacto. Y por hacer la cuenta con 45° en vez de 58° la primera
     * vez, el 0,7 que pidió salió 0,91 — de ahí el "pesadísimo".
     */
    giroVelocidad: 2.03,

    /** Doblando cerrado se pierde envión: al máximo, esta fracción. */
    frenoEnCurva: 0.82,

    /**
     * 🐎 EL ENVIÓN — [ESPACIO] *(Santi: "añadiría una habilidad al caballo
     * (tanto del jugador como el del guardia): algo como un avance de
     * velocidad cortito... la cantidad de impulso va a depender de la
     * resistencia del caballo y la velocidad de ese impulso de una nueva
     * estadística: la aceleración")*.
     *
     * Lo apretás y lo mantenés. Mientras te quede aguante, el caballo empuja
     * `empuje` más de lo que venía; al soltarlo se le va solo.
     *
     * **DE DÓNDE SALEN LOS DOS NÚMEROS QUE PIDIÓ SANTI:**
     *
     *  - CUÁNTO ENVIÓN TENÉS = la RESISTENCIA del caballo (`aguanteMax`, el
     *    mismo tanque con el que alcanzás el tren). El Criollo tiene 160 y son
     *    unos 5 segundos de envión; el Mustang tiene 60 y son 2. El lento tiene
     *    fondo, el rápido no.
     *  - QUÉ TAN RÁPIDO ENTRA = la ACELERACIÓN (`aceleracion`). Y como el
     *    envión se usa de a tirones cortos, la aceleración termina decidiendo
     *    también CUÁNTO envión llegás a sacarle a cada tirón: el que acelera
     *    despacio, en medio segundo, todavía no llegó arriba.
     */
    /**
     * 🐎 EL ENVIÓN — [ESPACIO], un toque *(Santi, después de jugarlo: "haría
     * que sea menos exagerado el impulso. Con el Criollo, que es el caballo
     * más lento del juego, uso el impulso y ya me escapo de los jinetes")*.
     *
     * Tenía razón y el número lo decía: a fondo daba **+337 unidades**, más
     * que la distancia a la que te sigue la ley. Eso no era una habilidad, era
     * un botón de ganar.
     *
     * AHORA ES UN TOQUE, IGUAL PARA TODOS *(Santi: "todos los impulsos duran
     * la misma cantidad de segundos... el impulso no depende de la
     * resistencia, sí de la aceleración")*: un segundo, +35%, unos **+50** de
     * ventaja. Alcanza para romper un tiro que te venía apuntado o para meterte
     * en un hueco; no para escaparte.
     *
     * Lo que cambia de un caballo a otro es **cada cuánto lo tenés** y **qué
     * tan rápido entra** — las dos cosas salen de la ACELERACIÓN, ver
     * `esperaDelImpulso` en data/horse.js.
     */
    impulso: {
      dura: 1.0,
      empuje: 0.35,

      /** Lo que le saca al fondo del caballo, de golpe (4 segundos de galope). */
      costo: 15,

      /** Cuando se termina, el envión se cae a este ritmo (px/s²). */
      caida: 260,
    },

    /**
     * 🤝 EL FORCEJEO — [E] *(Santi: "que pueden acercarse a vos (estar a la par
     * tuya con ayuda de ese impulso del caballo) y forcejear con vos. Ese
     * forcejeo no suelta bolsas, pero hace que la velocidad del caballo se vaya
     * deteniendo y no puedas disparar. Apretando un par de veces E rápidamente
     * podrás lanzar al jinete y salir del forcejeo. Si chocan con un obstáculo
     * el forcejeo se detiene. Puedes usar el impulso (si lo tienes disponible),
     * para salirte del forcejeo, pero no tirarás al jinete")*.
     *
     * Todo eso, tal cual, y un número más que no estaba pedido: `gracia`.
     * Sin él, dos jinetes te encadenan forcejeos y la huida se te va de las
     * manos sin que hayas hecho nada mal — perder el control es lo que más
     * frustra, así que tiene que ser corto y tiene que haber aire entre uno y
     * otro.
     */
    forcejeo: {
      /** Cuándo engancha: a la par tuya, en unidades y en radianes de rumbo. */
      /**
       * LA CAJA DEL AGARRE: a la par tuya (28 al costado), a la altura de la
       * montura (28 de largo) y con el rumbo parecido. Medido, con 22 de largo
       * el que llegaba bien se te escapaba igual la mitad de las veces: la
       * ventana era más chica que el propio caballo.
       */
      agarra: { costado: 28, largo: 28, rumbo: 0.8 },

      /** Cuánto dura si no hacés nada, y cuántos [E] para tirarlo. */
      dura: 4,
      golpes: 6,

      /**
       * Y CÓMO TE FRENA: arranca a esta fracción de tu galope y termina en la
       * otra. No te saca bolsas —lo dijo Santi— pero te deja servido para los
       * que vienen atrás.
       */
      frena: 0.6,
      frenaFinal: 0.3,

      /** Después de uno, nadie te agarra por este rato. */
      gracia: 7,
    },

    /**
     * 🫁 EL FONDO DEL CABALLO — la resistencia, gastándose SIEMPRE *(Santi:
     * "haría que la resistencia sea una unidad presente en todo momento, no
     * solo que aparezca con el impulso. La resistencia determinará cuánto
     * puede estar el caballo galopando y si usas el impulso, por supuesto que
     * la quemarás rápido")*.
     *
     * Es el mismo tanque del caballo (`aguanteMax`: Criollo 160, Mustang 60) y
     * ahora es **el reloj de la huida**, que es justo lo que Santi había
     * pedido cuando se sacó el reloj de verdad: que la huida la decida el
     * caballo y no un cronómetro.
     *
     *  - Galopando se gasta `galopeGasto` por segundo → el Criollo aguanta
     *    **45 s** de galope; el Mustang, **17 s**.
     *  - Frenado ([SHIFT]) no gasta: **recupera** `recupera` por segundo.
     *  - Cada envión cuesta 15 de golpe, o sea cuatro segundos de galope.
     *
     * Y SI SE VACÍA, NO PERDÉS EL ASALTO *(de las dos ideas de Santi se eligió
     * la segunda)*: el caballo **cae al paso** y la única salida es pelear —
     * que es algo que el juego ya sabe hacer y está medido (frenar y pelear
     * son unos 6 segundos y el 11-15% del botín). La primera idea —que te tire
     * y pierdas el asalto— rompía la promesa de esta escena ("nunca te
     * agarran, lo peor es llegar con menos plata"), castigaba con la pérdida
     * total al que todavía no entendió el sistema, y era la muerte más
     * invisible del juego: te mata una barrita, no un enemigo.
     */
    fondo: {
      galopeGasto: 3.5,
      recupera: 5,

      /** Reventado, el caballo va a esto (el Criollo galopa a 142). */
      pasoVelocidad: 50,

      /** Y vuelve a galopar cuando recuperó esta fracción del tanque. */
      revive: 0.3,
    },
    /**
     * A CABALLO SE TIRA PEOR: la dispersión de tu arma se multiplica por esto.
     * Con el Colt (0,035) queda en 0,105.
     */
    dispersionACaballo: 3,

    /**
     * ⏱️ Y RECARGAR A GALOPE TENDIDO CUESTA: el tiempo de recarga del arma se
     * multiplica por esto mientras vas galopando. Frenado ([SHIFT]) recargás
     * normal, porque ahí podés soltar las riendas.
     *
     * Con dos tiros por jinete (ver `jinetes.vida`) el cilindro se vacía de
     * verdad, así que esto pasó a tener sentido: 1,8 es medio segundo más de
     * recarga con el Colt, el tiempo justo para que te alcancen si la pedís en
     * mal momento.
     */
    recargaACaballo: 1.8,

    /**
     * ⛔ APUNTAR CON CLIC DERECHO: ACÁ NO *(Santi: "haría que no se pueda
     * apuntar con click derecho durante la persecución. Me parece irreal que
     * se pueda apuntar mientras vas cabalgando, esquivando obstáculos y encima
     * mientras te disparan")*.
     *
     * Estaba puesto porque en el asalto existe y porque lo había pedido él
     * mismo cuando el círculo hacia atrás se agrandaba demasiado; el círculo
     * ya se arregló por otro lado (`atras.dispersionMax`, 1,5). Los números de
     * abajo quedan escritos porque describen lo que HACÍA, y porque si algún
     * día hay una postura de tiro a caballo van a volver a hacer falta.
     *
     * Lo que hacía: la dispersión pasaba a la `spreadApuntado` del arma (la
     * mitad) en `CONFIG.mira.tiempoCierre`.
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
     * 🐴 SUS RIENDAS, en radianes por segundo. Estaba escondido en el código
     * (2,2) y tuvo que salir a la luz cuando las tuyas se pusieron pesadas
     * (`jugador.giroVelocidad`, 1,12): si ellos doblan al doble que vos, las
     * curvas dejan de ser un arma y son un regalo, porque se te pegan igual.
     *
     * Con 1,8 doblan UN POCO PEOR que vos, y esa diferencia chica es lo que
     * hace que una curva cerrada te dé metros: medido, el más cercano te corre
     * a 136 zigzagueando contra 129 si doblaran como vos. Bajarlos más (1,4)
     * los hace perdibles con puro volante —4 de 12 corridas los dejaban
     * atrás—, y eso convierte la huida en dar vueltas.
     */
    giro: 1.8,

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
     * 🌊 NO ARRANCAN TODOS ENCIMA TUYO: VIENEN EN DOS OLAS.
     *
     * *(Santi: "que algunos jinetes empiecen considerablemente más lejos que
     * otros y después se sumen a los más cercanos. Porque me pasó que en un
     * asalto aparecí con 7 tipos detrás mío y me balearon entero y me sacaron
     * todo el dinero")*
     *
     * Y tenía toda la razón: con `distanciaInicial 110` y 14 de separación,
     * siete jinetes arrancaban entre 110 y 194 unidades — **todos adentro de
     * la distancia de tiro desde el primer segundo**. Siete escopetas a la vez
     * no es dificultad, es una emboscada que no se puede jugar.
     *
     * Ahora el PELOTÓN son los primeros tres y el resto arranca lejos y viene
     * **al galope tendido a sumarse** (`apuro`), sin tirar mientras corre: el
     * que viene a los pedales a alcanzar al grupo no va apuntando. Así la
     * presión ENTRA DE A POCO en vez de estar toda desde el arranque.
     *
     * ⚠️ `segundaDesde` y `segundaSeparacion` tienen que dejar a todos adentro
     * de `perdida` (520): un jinete que nace más lejos que eso se da por
     * perdido en el primer cuadro y nunca existió.
     */
    olas: {
      /** Cuántos arrancan encima tuyo. Los demás vienen de atrás. */
      peloton: 3,

      /** Y desde dónde arranca la segunda ola, y cuánto más atrás cada uno. */
      segundaDesde: 280,
      segundaSeparacion: 55,

      /** Cuánto más rápido corren mientras vienen a sumarse. */
      apuro: 1.18,

      /** Dejan de apurarse (y vuelven a tirar) al llegar a esto de su carril. */
      seSumaA: 40,
    },

    /**
     * A ESTA DISTANCIA LO PERDISTE. En campo abierto ya no alcanza con que
     * salga de la pantalla: con la lupa de 3 se ve casi medio kilómetro de
     * campo, así que se pierde cuando de verdad quedó lejos.
     */
    perdida: 520,

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
    vida: 2,

    /**
     * 🎯 PERO DE CERCA, UNO SOLO: a menos de `remate` unidades el tiro lo
     * voltea igual. Es el espíritu de lo que había pedido Santi cuando puso
     * `vida` en 1 —"a un tipo galopando a fondo un balazo lo voltea"— sin que
     * eso convierta la huida en un tiro al blanco.
     */
    remate: 90,

    /**
     * 🔫 TIRAN A CUALQUIER DISTANCIA *(Santi: "balas más rápidas y alcance de
     * ellas infinito")*. Antes había un tope de 230 y quedaba raro: te
     * alejabas veinte metros y dejaban de tirar, como si el revólver supiera
     * dónde termina la pantalla.
     *
     * El límite de verdad ahora es OTRO y ya existía: `perdida` (520). Cuando
     * de verdad quedaron atrás dejan de seguirte, y ahí se acabó el tiroteo.
     * Entre medio tiran siempre — pero de lejos casi no le pegan a nada, ver
     * `dispersionDesde`.
     */
    alcance: 9999,

    /**
     * EL AVISO ANTES DEL TIRO, igual que los jinetes del asalto
     * (`RIDERS.ley.aimTime`, 0,50): se les ponen los ojos rojos y aparece el
     * "!" arriba. La dirección queda fija cuando empiezan a apuntar, así que
     * moverte en ese medio segundo es esquivar.
     */
    apuntar: 0.65,

    /** Cada cuánto tira cada uno, más un poco al azar para que no vayan en coro. */
    cadencia: 1.5,
    cadenciaAzar: 0.8,

    /**
     * ⏳ Y DE LEJOS TIRAN MUCHO MENOS SEGUIDO. Pasadas `cadenciaLejosDesde`
     * unidades, la espera entre tiros se multiplica por `cadenciaLejos`.
     *
     * Es la compensación de haberles sacado el tope de alcance. Medido con la
     * distancia al refugio fija (si no, la variación entre tandas se come
     * cualquier conclusión): con el alcance infinito y la bala a 380, la huida
     * pasó de costar ~$257 a ~$590 de cada $1.000. Alargar el aviso a 0,65
     * —lo que pidió Santi— recupera unos $60 de esos $330: ayuda, pero no
     * alcanza, porque el problema no es el aviso sino CUÁNTOS tiros comés.
     *
     * Con esto siguen tirando desde donde quieran —se ve, se escucha y te hace
     * galopar— pero el tiroteo de verdad vuelve a ser el de cerca.
     */
    cadenciaLejosDesde: 240,
    cadenciaLejos: 2.2,

    /**
     * Radianes de abanico DE CERCA. Subió de 0,10 a 0,18 midiendo: con 0,10,
     * quedarte quieto con UN jinete era un tiro casi seguro cada vez.
     */
    dispersion: 0.18,

    /**
     * Y DE LEJOS SE LES ABRE. Es lo que hace que "tiran a cualquier distancia"
     * no sea "te matan desde afuera de la pantalla": pasados
     * `dispersionDesde`, el abanico crece `dispersionPorCien` por cada 100
     * unidades más. De lejos son fuego de contención —te hacen galopar— y no
     * una sentencia.
     *
     * Con 0,18 de base: a 300 tiran con 0,23, a 450 con 0,30 y a 520 (donde te
     * pierden) con 0,34. A 450, ese abanico es errarle por 130 unidades: te
     * pega el que tenga suerte.
     */
    dispersionDesde: 200,
    dispersionPorCien: 0.05,
    dispersionTope: 0.5,

    /**
     * MÁS RÁPIDAS *(Santi: "balas más rápidas")*. De 250 a 380 — tu Colt tira
     * a 330, así que ahora la bala de ellos vuela un poco más que la tuya, que
     * es lo que corresponde: no estás tirando de frente, estás tirando para
     * atrás a caballo.
     *
     * Lo que cambia de verdad es el tiempo que tenés: una bala que sale a 250
     * desde 200 unidades tarda 0,80 s en llegar; a 380, 0,53 s. El medio
     * segundo del aviso (`apuntar`) sigue siendo tuyo, pero después del
     * fogonazo ya casi no hay nada que hacer.
     */
    velocidadBala: 380,

    /** Cuánto vive una bala suya: a 380, 1,8 s son 680 unidades de vuelo. */
    duracionBala: 1.8,

    /**
     * 🧠 CÓMO TE PERSIGUEN *(Santi: "lo otro es que se puedan poner adelante
     * tuyo para rodearte de alguna manera. Además, tienen que saber distinguir
     * hacia dónde vas para intentar anticipar un movimiento")*.
     */
    tactica: {
      /**
       * NO VAN A DONDE ESTÁS, VAN A DONDE VAS A ESTAR. Apuntan a tu posición
       * de dentro de `anticipo` segundos, así que cuando doblás cortan la
       * curva por adentro en vez de dibujarla entera detrás tuyo. Con 0 vuelve
       * a ser la persecución en fila de antes.
       *
       * ⚠️ ES EL NÚMERO MÁS CARO DE ESTA ESCENA, porque los deja más tiempo en
       * el lugar desde donde te pegan. Medido (20 corridas, misma distancia y
       * mismo refugio, sin envión): con 0 se pierden $495, con 0,4 son $680,
       * con 0,6 son $715 y con 0,8 son $865.
       *
       * Se puso en 0,4 y Santi lo subió a **0,6** después de jugarlo ("se nota
       * poco"): el salto de plata entre esos dos es chico ($35) y la lectura
       * en pantalla cambia bastante.
       */
      anticipo: 0.6,

      /**
       * 🚧 EL CORTADOR: uno solo se adelanta para ponerse en tu camino, y
       * quema su envión para llegar. Los demás siguen en la cola — dos
       * cortando a la vez es una pinza de la que no se sale, y eso no es una
       * persecución, es una trampa.
       */
      cortador: {
        /**
         * Cada cuánto se elige uno (si no hay ninguno intentándolo) y cuánto
         * lo intenta. Medido con el Criollo: con 6 y 6 hay alguien adelante
         * tuyo el **60%** de la huida —eso ya no es sentirse rodeado a veces,
         * es estarlo siempre—; con 9 y 5 son **2 cruces logrados por corrida**
         * y el 40% del tiempo; con 12, uno solo y el 20%.
         *
         * La plata casi no se mueve entre las tres (el cortador saca a uno de
         * la línea de tiro mientras corre), así que se elige por cómo se
         * siente y no por cuánto cuesta.
         */
        cada: 9,
        dura: 5,

        /**
         * 🐎 Y CORRE TODO ESE RATO *(Santi, después de jugarlo: "en ningún
         * momento el caballo se logra poner delante del jugador, eso no estaba
         * en los planes")*. Tenía razón, y la cuenta explica por qué: para
         * pasar de tu cola (130 atrás) a tu frente hacen falta unas 260
         * unidades, y con el envión normal —1,2 s al 35%— ganaba 60. Nunca
         * llegaba.
         *
         * Ahora el que corta **sostiene el empuje todo el intento**: al 45%
         * gana 64 por segundo, así que en cuatro segundos te pasa. No es el
         * envión de siempre, es su arranque de caballo reventándose para
         * cruzarte, y por eso dura lo que dura y después vuelve a la cola.
         *
         * Con un caballo más rápido que el suyo (el Mustang, 180) ya no te
         * alcanza: gana 26 por segundo y no llega. Eso también es lo que
         * pagaste al comprarlo.
         */
        empuje: 0.45,

        /** A dónde apunta: tanto adelante tuyo y tanto al costado. */
        adelanto: 130,
        costado: 55,

        /**
         * Y CUANDO YA TE PASÓ, se planta: corre a TU velocidad (más esto) para
         * quedarse cruzado adelante en vez de seguir de largo y volver a ser
         * uno más de la cola.
         */
        bloqueaDesde: 40,
        bloqueaExtra: 8,

        /** Sólo lo intenta el que ya está cerca: de más lejos no llega. */
        distanciaMax: 320,
      },

      /**
       * 🤝 EL QUE SE ARRIMA *(Santi: "para el forcejeo obviamente tiene que
       * existir la posibilidad de que el jinete se te acerque. Hoy no se
       * acerca... cuando lo añadas recordá que tiene que haber la probabilidad
       * real de que se pueda acercar cerca tuyo")*.
       *
       * Es el mismo truco del cortador pero apuntando AL COSTADO tuyo, pegado:
       * corre sostenido hasta ponerse a la par, y si llega, agarra (ver
       * `jugador.forcejeo`). Sin esto el forcejeo no existiría: en la
       * persecución normal se quedan a 110-170 de tu cola y nunca se arriman.
       */
      arrimador: {
        cada: 7,
        dura: 6,
        empuje: 0.45,
        /**
         * A qué costado tuyo apunta. TIENE QUE SER MENOS QUE EL AGARRE
         * (`jugador.forcejeo.agarra.costado`, 28): la primera versión apuntaba
         * a 26 con un agarre de 24, o sea que el jinete llegaba perfecto a un
         * lugar desde donde no podía agarrarte, y de 1,4 arrimadas salía medio
         * forcejeo por corrida.
         */
        costado: 18,
        distanciaMax: 300,

        /**
         * Y CUANDO YA ESTÁ A LA ALTURA se acomoda a tu velocidad, como el
         * cortador cuando te pasó. Sin esto llegaba lanzado, te pasaba de
         * largo y el agarre no se daba nunca: de 1,4 arrimadas salía apenas
         * medio forcejeo por corrida.
         */
        acomodaDesde: 34,

        /**
         * Y sólo se acomoda si además YA ESTÁ AL COSTADO: si todavía le falta
         * cruzar, tiene que seguir corriendo. Igualar la velocidad estando
         * lejos lo deja trotando en paralelo sin llegar nunca.
         */
        acomodaCostado: 45,
      },
    },

    /**
     * 🪢 EL LAZO *(Santi, en el plan original: "podria existir la probabilidad
     * de que alguno/s de esos jinetes tenga un lazo que pueda enganchar al
     * caballo y hacerlo retroceder; el lazo funcionaria exactamente como la
     * mecanica del forcejeo solo que a distancia y necesitaria una cierta
     * punteria (puede fallar al lanzarlo)")*.
     *
     * ES EL FORCEJEO A DISTANCIA, con tres diferencias que importan:
     *
     *  1. **Te arrastra** (`arrastre`), que es lo que pidio Santi: no solo te
     *     frena, te hace perder terreno de verdad.
     *  2. **No lo tiras del caballo**: esta lejos. Cortas la soga y el sigue
     *     ahi — pero se queda sin lazo para el resto de la huida.
     *  3. **Se avisa** (`revoleo`): revolea la soga sobre la cabeza antes de
     *     soltarla. Ese es tu tiempo para reaccionar, y sin el esto seria una
     *     trampa invisible. Perder el control sin haber hecho nada mal es lo
     *     que mas frustra de una persecucion.
     *
     * ⚠️ Y ENTRA EN LA MISMA ROTACION que el cortador y el arrimador (un solo
     * jinete haciendo algo especial a la vez) y comparte la `gracia` del
     * forcejeo. Con cuatro mecanicas que te sacan el control, sin esas dos
     * reglas la huida deja de ser tuya.
     */
    lazo: {
      /**
       * CUANTOS JINETES LO LLEVAN. Se les ve enrollado en la montura.
       *
       * 📏 Medido con el piloto que juega bien, en tandas de 16 corridas de
       * cuatro jinetes:
       *
       * | llevan | cada | revoleos | enganches | seg enlazado |
       * |--------|------|----------|-----------|--------------|
       * | 0,34   | 8    | 1,0      | 0,56      | 0,55         |
       * | 0,5    | 6    | 2,2      | **1,00**  | 0,67         |
       *
       * Se eligio el segundo: un enganche por corrida es lo mismo que rinde el
       * forcejeo (0,8), y con menos que eso la mecanica no llega a existir.
       */
      llevan: 0.5,

      /** Entre estas dos distancias lo tira: mas cerca se arrima, mas lejos no llega. */
      desde: 60,
      hasta: 160,

      /**
       * 🐛 Y PRIMERO SE TIENE QUE ACERCAR, que es lo que faltaba.
       *
       * Medido: con el lazo saliendo solo cuando el tipo YA estaba a tiro,
       * salian 0,6 revoleos y 0,2 enganches por corrida — o sea que la mecanica
       * casi no existia. La razon es simple: los jinetes van a 200-340 unidades
       * y la soga llega a 160. El cortador y el arrimador se acercan a hacer lo
       * suyo; el del lazo tambien tiene que hacerlo.
       *
       * `acerca` es a que distancia se pone y `acercaDura` cuanto lo intenta
       * antes de rendirse y volver a la cola.
       */
      acerca: 110,
      acercaDura: 6,

      /** Lo revolea esto antes de soltarlo: es TU aviso. */
      revoleo: 0.7,

      /** Y la soga tarda esto en llegar, para que el tiron no sea instantaneo. */
      vuelo: 0.25,

      /**
       * LA PUNTERIA: `punteria` es la chance a quemarropa (a `desde`) y baja
       * `porUnidad` por cada unidad de mas. A 140 queda en 38%.
       *
       * `doblando` es lo que pierde si estas girando de verdad (mas de
       * `giroQueCuenta` radianes de error de rumbo), y con el envion puesto
       * falla SIEMPRE: ese es el premio por reaccionar al revoleo.
       */
      punteria: 0.7,
      porUnidad: 0.004,
      doblando: 0.25,
      giroQueCuenta: 1.2,

      /**
       * LO QUE LE QUEDA DE PUNTERIA SI USASTE EL ENVION.
       *
       * 🐛 Arranco en 0 —el envion lo esquivaba SIEMPRE— y medido eso mataba la
       * mecanica: un piloto que juega bien tiene el envion listo casi cada vez
       * que alguien revolea, asi que no se enlazaba nunca. Reaccionar tiene que
       * AYUDAR, no anular: si anula, la jugada no existe.
       */
      conEnvion: 0.4,

      /** Cada cuanto le toca a alguien lazar, y cuanto dura el enganche. */
      cada: 6,
      dura: 5,

      /** Cuantos [E] para cortar la soga. El forcejeo son 6: una soga cuesta mas. */
      golpes: 8,

      /**
       * ⚠️ ¿EL ENVION TE SUELTA? EN EL LAZO NO, Y ES UNA DESVIACION DEL PLAN.
       *
       * En el plan decia que si, igual que el forcejeo. Medido, eso lo rompia:
       * el envion es tambien la forma de ESQUIVAR el lazo (baja la punteria a
       * `conEnvion`), asi que el mismo boton evitaba el enganche Y lo cortaba
       * al instante. La soga duraba 0,39 s y no pasaba nada nunca.
       *
       * Con el envion como esquive y nada mas, la soga dura 0,55 s y hay que
       * cortarla a mano. Enlazado, un tiron de velocidad TENSA la soga; no
       * tiene por que soltarla.
       */
      cortaConEnvion: false,

      /** Te frena como el forcejeo: arranca en esto y termina en lo otro. */
      frena: 0.6,
      frenaFinal: 0.3,

      /**
       * Y ADEMAS TE ARRASTRA HACIA ATRAS, en unidades por segundo. El Criollo
       * galopa a 142: 26 es perder mas o menos una quinta parte de lo que
       * avanzarias, encima de lo que ya te frena.
       */
      arrastre: 26,
    },

    /**
     * 🐎 SU ENVIÓN. El mismo tirón que el tuyo, del otro lado: lo usan para
     * volver a pegarse cuando quedaron descolgados —más de `desde` unidades
     * atrás— y para llegar adelante tuyo cuando les toca cortarte el paso.
     *
     * Su tanque no se dibuja ni se mide: alcanza con que no puedan encadenarlo
     * (`recarga`), o serían tres caballos volando todo el tiempo.
     */
    impulso: {
      empuje: 0.35,
      dura: 1.2,
      recarga: 10,

      /**
       * Recién cuando se descolgó DE VERDAD. Con 200 saltaba todo el tiempo
       * —van a 110-170 de tu cola— y el resultado medido fue una huida que no
       * terminaba nunca: se pegaban siempre, el Mustang dejó de despegarse y
       * la corrida llegaba al tope de tiempo sin resolverse.
       */
      desde: 320,

      /**
       * Y CUÁNTAS VECES PUEDE EN TODA LA HUIDA. Es el freno que hace que un
       * caballo mejor siga sirviendo: los dos primeros tirones te los pelean,
       * después es cuestión de quién corre más. Sin esto, el envión de ellos
       * anulaba la ventaja de comprar un caballo.
       */
      usos: 2,
    },

    /**
     * EL GRITO. Cada tanto uno grita "¡alto ahí!" cuando se prepara para
     * tirar; no en cada tiro, o sería un coro insoportable.
     */
    chanceGrito: 0.3,
    gritoCada: 2.5,
  },
};
