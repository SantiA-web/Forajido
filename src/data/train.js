/**
 * De qué está hecho el tren.
 *
 * El tren se lee de DERECHA a IZQUIERDA en dificultad de escape: la plataforma
 * trasera está en la punta izquierda (ahí espera tu caballo) y la locomotora
 * queda a la derecha. El vagón 1 es el más cercano a la salida; el último, el
 * más lejano. Entre vagón y vagón hay un tramo de enganche al aire libre.
 *
 *      [🐴] [1]-[2]-[3]-[4]-[5]-[6]-  -->  locomotora
 *       salida                            (más adentro = más lejos de volver)
 *
 * Decisión de diseño importante: el botín NO mejora hacia adelante. Meterse
 * hasta el fondo no es "mejor", es una apuesta más cara: gastás caballo para
 * llegar y después tenés que desandar todo para bajarte. Desde afuera ves QUÉ
 * tipo de vagón es cada uno, pero no cuánto tiene adentro.
 *
 * ---------------------------------------------------------------------------
 * TIPOS DE TREN — un catálogo, igual patrón que WEAPONS o HORSES.
 *
 * Antes había un solo `TRAIN` fijo. Ahora cada ruta del mapa (`data/region.js`)
 * sortea, cada vez que la mirás, con QUÉ tren te vas a encontrar — y el tipo de
 * tren es una de las tres cosas que varían (las otras dos son la dificultad,
 * más abajo, y la composición de vagones de siempre).
 *
 * Cada entrada es una receta completa: de qué vagones está hecho, sus reglas
 * de mezcla, y —si le tocan— sus propias reglas de juego. La mayoría de los
 * campos son opcionales: si un tipo no los trae, se comporta como el estándar.
 *
 *   composition    la baraja de vagones (ids de `data/wagons.js`)
 *   posicionMinima { id: vagón mínimo } — ese vagón nunca antes de esa posición
 *   posicionFija   { id: 'ultima' } — ese vagón SIEMPRE ahí, nunca se mezcla
 *   sustituciones  [{ de, por, chance }] — a veces este tren cambia un vagón
 *                  por otro. Es la primera capa de variedad que toca DE QUÉ
 *                  está hecho el tren y no sólo quién viaja adentro (ver
 *                  `armas` en el estándar, más abajo)
 *   peso           cuántas fichas mete en la bolsa del sorteo (ver más abajo)
 *   raidDuration   segundos del asalto para este tren (si no está, usa
 *                  CONFIG.raid.duration)
 *   ruidoExtra     vagones que se suman al alcance de un disparo (encima de lo
 *                  que ya decide el arma — ver data/weapons.js `noiseWagons`)
 *   sospechaMult   multiplica qué tan rápido sospechan y gritan los guardias
 *                  de ESTE tren (ver CONFIG.enemy.suspicionNear/Far)
 *   rodantesCada   cada cuántos segundos se suelta un barril o un cajón adentro
 *                  del vagón (ver CONFIG.rodante). Sin este campo, ese tren no
 *                  suelta nada y el tren es sólo el escenario, como siempre.
 *   traqueteoCada  cada cuántos segundos el propio piso se vuelve traicionero
 *                  (ver CONFIG.traqueteo): balanceo con más dispersión para
 *                  todos, y tirones que empujan y sacuden la carga. Sin este
 *                  campo, ese tren nunca hace esto.
 *   estampida      si es true, los vagones de ganado traen tranqueras que se
 *                  pueden abrir para soltar la manada (ver CONFIG.estampida).
 *                  Sin esto, el mismo vagón es el pasillo de paso de siempre.
 *   pesaElBotin    si es true, con la alarma sonando la plata que llevás
 *                  encima te va frenando (ver CONFIG.peso). Sin esto, cargás
 *                  lo que quieras sin costo, como en toda la fase 2.
 *   modificadores  si es true, este tipo de tren participa del sorteo de
 *                  CLIMA, ESTADO DEL TREN, comportamiento por vagón y tipos
 *                  de guardia (ver data/modifiers.js). Sin esto, siempre sale
 *                  despejado y sin ningún estado — es la llave que decide QUÉ
 *                  TIPOS entran en ese sorteo, no el sorteo en sí.
 *
 *                  LO TIENEN LOS DOS TRENES. Hasta la reestructuración de los
 *                  tipos lo tenía sólo el estándar, y eso significaba que la
 *                  MITAD de los asaltos —todo el trabajo del plan "variedad de
 *                  lo que pasa en los trenes"— no le pasaba nunca al que
 *                  agarrara otro tren. El clima, la redada y una puerta
 *                  trabada no son la identidad de ningún tren: son el día que
 *                  le tocó a ese servicio, y eso le puede tocar a cualquiera.
 *
 *   gente          si es true, este tren además sortea PAQUETES (el pasajero
 *                  rico con su guardaespaldas), CIVILES ENCUBIERTOS y la CAJA
 *                  FUERTE OCULTA (ver data/paquetes.js).
 *
 *                  VA APARTE DE `modificadores` PORQUE LAS TRES DEPENDEN DE
 *                  QUE HAYA PASAJEROS A QUIENES ROBARLES. La caja oculta es el
 *                  caso más claro: la única forma de enterarse dónde está es
 *                  amenazando pasajeros, y tres de ellos saben el dato. En un
 *                  tren de carga —que lleva un solo vagón con gente— esconder
 *                  una caja sería esconderla de verdad: nadie a quien
 *                  preguntarle. Un paquete sin vagones de pasajeros es lo
 *                  mismo. Por eso ésta es la capa que SÍ distingue a un tren
 *                  del otro, y `modificadores` no.
 */

/**
 * ---------------------------------------------------------------------------
 * DOS TRENES, Y SE DISTINGUEN POR SU CONTENIDO — no por su reloj.
 *
 * *(Santi: "que a partir de ahora no haya más tren veloz, sino tren de
 * pasajeros y el de carga. Ya no sería este es el rápido, este el lento y este
 * el punto medio, sino que su contenido sería diferente")*
 *
 * ANTES ERAN TRES Y EL EJE ERA LA VELOCIDAD: rápido (veloz, 90 s), lento
 * (carga, 165 s) y punto medio (estándar, 145 s). Eso es un eje de DIFICULTAD
 * disfrazado de variedad — un tren que se distingue por su reloj es el mismo
 * tren con otro cronómetro. La prueba está en el historial del veloz, tres
 * vueltas de calibración discutiendo un único número (ver `raidDuration` en la
 * entrada de abajo, que quedó en reserva).
 *
 * Y HABÍA UN PROBLEMA MÁS GRANDE, MEDIBLE: `modificadores: true` lo tenía sólo
 * el estándar. O sea que el clima, la redada, la puerta trabada, los
 * comportamientos por vagón, los paquetes y la caja oculta —el trabajo entero
 * del plan "variedad de lo que pasa en los trenes"— **le pasaba a la mitad de
 * los trenes y a la otra mitad no**.
 *
 * LA REGLA DEL REPARTO NUEVO: **una mecánica, una sola casa.** Si una mecánica
 * aparece en los dos trenes, no distingue nada — y dos trenes con los mismos
 * sistemas no son dos trenes, son uno con distinto empapelado.
 *
 *   PASAJEROS · la gente te delata
 *     Paquetes, caja fuerte oculta, testigos, civil encubierto, y los dos mini
 *     jefes (Cazarrecompensas y Sheriff, ver data/bosses.js). Ninguna mecánica
 *     de tren: acá el tren es el escenario, como en toda la fase 2.
 *
 *   CARGA · el tren te ataca a vos
 *     Rodantes, traqueteo, estampida, el vagón de armas con su pólvora y su
 *     Dinamitero, y el botín que pesa. Ningún mini jefe.
 *
 * LOS RODANTES Y EL TRAQUETEO SE MUDARON AL DE CARGA POR LA FICCIÓN, y no por
 * conveniencia: un barril que se suelta en el pasillo ES carga suelta. Nunca
 * pertenecieron a "el tren rápido" — pertenecen al tren que lleva carga.
 *
 * Y DEJAN A LA ETAPA 2 DE LA PÓLVORA A UN PASO, pero **todavía no la
 * resuelven**: el sacudón "acelera" suelta barriles y cajones de utilería
 * (`TIPOS_RODANTE`, entities/rodante.js), no barriles de pólvora. Lo que
 * cambió es que ahora el traqueteo y el vagón de armas viven en el MISMO tren,
 * que era la condición que faltaba. Conectarlos es un cambio chico en
 * `updateTraqueteo` (scenes/raidScene.js), y sigue sin construirse.
 *
 * Y HAY UNA LECTURA QUE NO SE BUSCÓ Y APARECIÓ SOLA: en el tren del sigilo, un
 * rodante no es un peligro de combate — te tumba sin sacarte vida y **el
 * porrazo se oye** (`CONFIG.rodante.ruidoGolpe`). O sea que en el de carga la
 * carga suelta es lo que te delata. Encaja con `pesaElBotin` en vez de pelearse
 * con él.
 * ---------------------------------------------------------------------------
 */
export const TRAIN_TYPES = {
  /**
   * EL TREN DE PASAJEROS — el estándar de siempre, con su nombre verdadero.
   *
   * No cambió ni un vagón ni un número: es la misma formación de seis, el mismo
   * reloj de 145 s y las mismas reglas que se jugaron y se afinaron durante toda
   * la fase 2. Lo único que se le sacó es el vagón de armas, que se mudó al de
   * carga con toda su familia (pólvora, Dinamitero, empujar barriles).
   *
   * EL GANADO SE QUEDA, y fue una decisión explícita. Con el de armas mudado, lo
   * natural habría sido mandar el ganado también — y eso rompía tres cosas
   * acopladas que no se ven de entrada:
   *
   *   1. Es el ÚNICO vagón sin techo del tren. Es el que hace que la tormenta
   *      suene distinto (la chapa se apaga, suben el agua y el viento) y el peor
   *      lugar para que te agarren los jinetes. Sin él, este tren se quedaba sin
   *      un solo momento de "estás expuesto" que no fuera un enganche.
   *   2. Es el escondite "junto al corral" de la caja fuerte oculta — uno de los
   *      cinco, y el único de este tren que no es una mesa o un asiento.
   *   3. Es su vagón de paso: un guardia y una bolsa. Sacarlo dejaba seis
   *      vagones todos caros de cruzar, sin ritmo.
   */
  pasajeros: {
    id: 'pasajeros',
    name: 'Tren de pasajeros',
    short: 'PASAJEROS',
    hint: 'Gente, equipaje y plata encima. Cualquiera puede ser un testigo.',
    pista: 'Mucha gente a bordo',
    composition: ['pasajeros', 'pasajeros', 'comedor', 'correo', 'ganado', 'blindado'],
    posicionMinima: { blindado: 3 },
    peso: 50,
    modificadores: true,

    /**
     * LA CAPA DE GENTE ES SUYA Y DE NADIE MÁS — ver `gente` en la cabecera.
     * Paquetes, encubiertos y caja oculta necesitan pasajeros a quienes
     * amenazar, y éste es el único tren que los lleva de verdad (dos vagones
     * llenos más el comedor, que es el que más gente tiene del juego).
     */
    gente: true,

    color: '#c9b68d',
  },

  /**
   * ⚠️ EN RESERVA (`peso: 0`) — YA NO SALE SORTEADO.
   *
   * *(Santi: "que a partir de ahora no haya más tren veloz")*. Su eje era la
   * velocidad, que es el eje que se descartó (ver la nota grande de arriba), y
   * sus dos mecánicas —rodantes y traqueteo— se mudaron al de carga, que es
   * donde pertenecían por ficción.
   *
   * ES UNA LLAVE, NO UNA AMPUTACIÓN, igual que "Alta vigilancia" acá abajo y
   * que el Pistolero en data/modifiers.js. Queda entero: sus seis vagones
   * cortos siguen escritos a mano en data/wagons.js (`pasajeros_corto` y
   * compañía) y nadie más los nombra. Subirle el peso lo devuelve al juego sin
   * tocar una línea.
   *
   * LO ÚNICO QUE SE PIERDE DE VERDAD ES EL RELOJ DE 90 s, y vale anotarlo: "¿un
   * vagón más o me bajo?" a 90 s es una pregunta distinta que a 145. Si alguna
   * vez se lo quiere de vuelta, la forma correcta ya no es un tipo de tren sino
   * un ESTADO más en data/modifiers.js ("tren expreso: llega antes"), que se lo
   * puede tocar a cualquiera de los dos.
   *
   * ---------------------------------------------------------------------------
   * EL VELOZ — frenético, sin sigilo. Una apuesta distinta, no una versión
   * más difícil del estándar: los vagones son mucho más cortos (variantes
   * escritas a mano en `data/wagons.js`, no recortadas por código — la
   * geometría de cada vagón está afinada a mano y se rompe si se recorta
   * sola), así que el tren entero se cruza rápido... pero corre en tu contra.
   *
   * LO QUE CAMBIA respecto del estándar — y nada más: no mejora las armas de
   * los guardias ni les agrega dinamita fuera del blindado.
   *
   *   1. `ruidoExtra: 1` — un disparo se oye un vagón más lejos de lo que ya
   *      dice el arma (el Colt pasa de despertar 1 vagón a 2).
   *   2. `sospechaMult: 1.5` — sospechan y gritan un 50% más rápido.
   *   3. `raidDuration: 90` — ver la cuenta abajo, no es "menos tiempo" nomás.
   *   4. `rodantesCada: 3.8` — EL TREN COMO ENEMIGO. Cada tanto se suelta una
   *      TANDA de barriles y cajones que ruedan hacia la cola, y hay que
   *      leerlos y elegir: salirte del pasillo o gastarles balas (aguantan 3
   *      cada uno). Es lo que hace que este tren se sienta frenético de
   *      verdad, y no sólo apurado — apretar el reloj solo, probado jugando,
   *      daba tensión pero no vértigo. Vienen de a 2 o 3 y escalonados (ver
   *      `rafagaGap` en CONFIG.rodante): de a uno se esquivaban demasiado
   *      fácil, y con la tanda ya no alcanza con correrse y volver.
   *   5. `traqueteoCada: 10` — EL PISO TAMBIÉN. Cada tanto el vagón se
   *      bambolea (más dispersión, para todos) o el tren tironea (te empuja,
   *      y si acelera te sacude encima una tanda extra de barriles). Ver
   *      CONFIG.traqueteo para el porqué de cada número.
   *
   * Y el blindado va SIEMPRE al último vagón, pegado a la locomotora — no
   * "vagón 3 o más adelante" como el estándar, sino una posición FIJA. Por
   * eso usa `posicionFija` y no `posicionMinima`.
   *
   * SOBRE `raidDuration`: TRES VUELTAS, Y LAS TRES POR MEDIR ALGO DISTINTO.
   *
   * 1ª vuelta: 100s (-31% contra el estándar). Jugado, no se sintió
   * frenético — Santi: "no me pasa eso al jugarlo". La causa apareció
   * midiendo: el tren veloz mide un 55% de lo que mide el estándar (vagones
   * a la mitad), pero el reloj sólo había bajado a un 69%. Sobraba MÁS
   * tiempo por baldosa que en el estándar, no menos.
   *
   * 2ª vuelta: 70s, calculado para que el veloz exigiera más por píxel que
   * el estándar (0,040 s/px contra 0,045). Jugado, esto sí apretaba — pero
   * apretar el reloj solo, aislado, sólo da TENSIÓN. El vértigo de verdad
   * (`rodantesCada`, `traqueteoCada`, ver arriba) se construyó DESPUÉS de
   * fijar este número, y las dos cosas juntas comían más reloj del que 70s
   * tenía pensado — Santi, jugándolo esta vez: sólo pudo sacar $200 de un
   * tren que promedia ~$1400.
   *
   * 3ª vuelta: 90s. Y acá midió algo que vale la pena dejar anotado, porque
   * corrige una suposición: un piloto que junta TODO lo que puede sin pelear
   * (sortea barriles, roba, pero no hay un solo guardia armado) ya sacaba
   * ~50% del tren CON LOS 70s VIEJOS. O sea que el reloj solo no era el
   * cuello de botella — la plata que faltaba se fue peleando, no caminando.
   * Subir a 90s no arregla eso (nada de lo que hay en `raidDuration` puede);
   * lo que hace es dar colchón para que un combate que salió mal no te deje
   * sin nada, que es lo que se sentía jugando con 70.
   */
  veloz: {
    id: 'veloz',
    name: 'Tren veloz',
    short: 'VELOZ',
    hint: 'Corto y nervioso. Todo pasa rápido — vos y ellos.',
    pista: 'Poca carga, mucho apuro',
    composition: [
      'pasajeros_corto', 'pasajeros_corto', 'comedor_corto',
      'correo_corto', 'ganado_corto', 'blindado_corto',
    ],
    posicionFija: { blindado_corto: 'ultima' },
    peso: 0,
    raidDuration: 90,
    ruidoExtra: 1,
    sospechaMult: 1.5,
    rodantesCada: 3.8,
    traqueteoCada: 10,
    color: '#e0a13a',
  },

  /**
   * EL DE CARGA — ocho vagones, la mayoría mercancía y casi sin pasajeros, con
   * MENOS guardias en total (no diluidos por más vagones: genuinamente menos —
   * ver `correo_liviano` en `data/wagons.js`, un vagón de correo con un solo
   * guardia y el botín repartido en bolsas en vez de concentrado en una caja
   * fuerte). Es la primera respuesta real al problema medido y anotado en
   * NOTAS-DISENO.md: el botín estaba demasiado concentrado en blindado + correo.
   *
   * Y AHORA ES **EL TREN QUE TE ATACA A VOS**. Antes su única diferencia era de
   * qué estaba hecho; con la reestructuración se quedó con todas las mecánicas
   * en las que el tren deja de ser el escenario: la carga que se suelta
   * (`rodantesCada`), el piso que traiciona (`traqueteoCada`), el ganado que se
   * puede soltar (`estampida`), la pólvora del vagón de armas (`sustituciones`)
   * y el botín que pesa (`pesaElBotin`).
   *
   * SON CINCO SISTEMAS EN UN SOLO TREN, y es el riesgo grande de todo esto: hay
   * que jugarlo mirando si se siente como un tren con carácter o como un tren
   * con demasiadas cosas pasando a la vez. La perilla para bajar el ruido sin
   * desarmar nada es subir `rodantesCada` y `traqueteoCada` — en ese orden.
   */
  carga: {
    id: 'carga',
    name: 'Tren de carga',
    short: 'CARGA',
    hint: 'Mucha mercancía, poca gente. Y la carga se te viene encima.',
    pista: 'Carga pesada y suelta',
    /**
     * EL ALMACÉN VIAJA SIEMPRE, y reemplaza a uno de los tres correos livianos
     * (mide lo mismo: el tren no cambia de largo). Ver `almacen` en
     * data/wagons.js para por qué es fijo y no sorteado.
     */
    /**
     * 🔻 Y SE FUE EL VAGÓN BLINDADO.
     *
     * *(Santi, jugándolo: "eliminar el vagón blindado del tren de carga y que
     * las dos puertas del almacén no sean blindadas, pero que estén cerradas")*
     *
     * EL ALMACÉN HEREDA SU PAPEL, con otra llave. El blindado era "el premio y
     * la trampa" y su única puerta era la dinamita; el almacén es el premio con
     * la puerta trabada, que se abre a tiros — o sea **a los gritos**. Que el
     * tren de carga no tenga ningún lugar que exija explosivos es coherente con
     * lo que es: acá no viaja el oro del banco, viaja mercadería.
     *
     * EN SU LUGAR ENTRA UN TERCER CORREO LIVIANO, y no es relleno: sin él el
     * tren se acortaba 528 px y **el reloj de 165 s está calibrado para ocho
     * vagones**. Con el correo el largo queda en 4.256 px contra los 4.224 de
     * antes — treinta píxeles de diferencia, o sea ninguno.
     *
     * LO QUE SÍ CAMBIA, Y HAY QUE MIRARLO JUGANDO: el tren se quedó sin ningún
     * guardia duro. Los cuatro blindados eran los únicos, y ahora todos los del
     * tren de carga aguantan lo mismo. Es la contracara de que sea el tren del
     * sigilo y no el del tiroteo, pero es un cambio grande y no está jugado.
     */
    composition: [
      'almacen', 'correo_liviano', 'correo_liviano', 'correo_liviano',
      'ganado', 'ganado', 'ganado', 'comedor',
    ],

    /**
     * EL VAGÓN DE ARMAS SE MUDÓ ACÁ, con las mismas tres reglas de posición que
     * tenía en el estándar y por el mismo motivo (la ronda del Dinamitero, ver
     * abajo). Lo único que cambió son los topes, porque el tren tiene ocho
     * vagones en vez de seis: nunca el primero (`armas: 2`) ni el último
     * (`armas: 7`).
     */
    /**
     * `almacen: 2` — nunca el primer vagón. Es donde vive lo más caro del tren,
     * y el primero es el que sale gratis: se entra por ahí y la salida queda a
     * un paso. Misma regla, y por el mismo motivo, que el vagón de armas.
     *
     * (`blindado` ya no figura: no viaja más en este tren. Se saca la regla en
     * vez de dejarla sin efecto, para que nadie la lea después y crea que el
     * blindado puede aparecer.)
     */
    posicionMinima: { armas: 2, almacen: 2 },

    /**
     * EL VAGÓN DE ARMAS NUNCA ES EL ÚLTIMO.
     *
     * Es la otra cara del mismo problema que resuelve `posicionRelativa`: el
     * Dinamitero necesita un vecino AL QUE PUEDA ENTRAR de los dos lados, y al
     * final del tren no hay nada de un lado. Medido con el de armas último: la
     * ronda baja a 656-704 px en vez de ~1000 y pasa **40-61% del tiempo
     * adentro** contra el 33% de diseño — exactamente el mismo defecto que tener
     * el blindado pegado.
     */
    posicionMaxima: { armas: 7 },

    /**
     * 🔻 SE FUE LA REGLA DE "EL BLINDADO NUNCA PEGADO AL DE ARMAS", y hay que
     * dejar escrito por qué, porque arreglaba un problema real.
     *
     * Existía porque la ronda del Dinamitero necesita vecinos **en los que se
     * pueda entrar**, y el blindado no lo era: pegados, su vuelta se acortaba a
     * 640 px en vez de ~1050 y pasaba 55% del tiempo adentro en vez del 41%.
     *
     * Sin blindado en este tren, el único vagón que viaja cerrado es el
     * almacén — **y a ése el Dinamitero SÍ puede entrar**, porque lleva la
     * llave del tren y una puerta trabada no lo frena (ver `entities/door.js`).
     * O sea que el motivo de la regla desapareció con el vagón que la motivaba.
     *
     * Si alguna vez el almacén pasa a tener puertas de chapa, esta regla hay
     * que devolverla apuntándole a él.
     */

    /**
     * EL VAGÓN DE ARMAS — Fase 6a, mudado del estándar sin tocarle un número.
     *
     * 🔺 EL 0,25 ES EL QUE ELIGIÓ SANTI JUGANDO *("baja la probabilidad de que
     * aparezca este vagón a un 25%")*, y se conserva a propósito — pero lo que
     * él eligió no era el 25% en abstracto: era **cada cuánto lo veía**. Con el
     * estándar en el 50% del sorteo, ese 0,25 daba el 12,5% de los asaltos.
     *
     * Con el de carga en el 50% del sorteo (ver `peso`, abajo), 0,25 vuelve a
     * dar **exactamente el 12,5%**. O sea que el vagón de armas aparece con la
     * misma frecuencia que antes de la reestructuración, sin haber tocado nada.
     * Si algún día se mueven los pesos, hay que mover esta chance en sentido
     * contrario o la frecuencia real cambia sin que nadie lo haya pedido.
     *
     * REEMPLAZA A UN GANADO Y NO SE SUMA COMO NOVENO, por el mismo motivo de
     * siempre: sumarlo alarga el tren y el reloj está afinado. Y de los tres
     * vagones de ganado sobran dos, así que la estampida —la identidad de este
     * tren— sigue teniendo con qué jugarse.
     */
    sustituciones: [{ de: 'ganado', por: 'armas', chance: 0.25 }],

    peso: 50,
    raidDuration: 165,

    /**
     * LA CAPA DE VARIEDAD TAMBIÉN ES SUYA. Clima, estado del tren,
     * comportamientos por vagón y tipos de guardia — ver `modificadores` en la
     * cabecera. Lo que NO tiene es `gente`: sin vagones de pasajeros no hay a
     * quién amenazar, así que un paquete o una caja oculta acá serían un premio
     * sin forma de encontrarlo.
     */
    modificadores: true,

    /**
     * LA CARGA SE SUELTA — mudado del tren veloz.
     *
     * ⚠️ EL NÚMERO NO ES EL DEL VELOZ (3,8) Y NO PODÍA SERLO. Los rodantes
     * estaban calibrados para vagones CORTOS: `CONFIG.rodante.pistaMinima` (150)
     * exige que entre el barril y vos quepa ese tramo, y en los vagones de 224 px
     * del veloz eso suprimía un montón de tandas antes de nacer (ver la nota de
     * `pistaMinima` en config.js). En los vagones de este tren —de 384 a 640 px—
     * no se suprime casi ninguna.
     *
     * LA CUENTA: con 3,8 en un asalto de 165 s salían ~43 tandas de 2 o 3
     * barriles, más de 100 barriles, prácticamente ninguna suprimida. Eso no es
     * un tren traicionero: es una cinta transportadora. Con 14 salen ~12 tandas,
     * o sea una cada catorce segundos — aproximadamente la MITAD del ritmo real
     * que tenía el veloz una vez descontadas las suprimidas.
     *
     * Y tiene que ser la mitad y no el mismo, porque acá los rodantes no son la
     * identidad del tren sino una traición ocasional: el que manda es el sigilo.
     *
     * ES UN NÚMERO CALCULADO, NO JUGADO. Es la primera perilla a mover si el
     * tren se siente atiborrado.
     */
    rodantesCada: 14,

    /**
     * EL PISO TAMBIÉN — mudado del tren veloz, y también con otro número.
     *
     * El veloz tenía 10, que en un asalto de 90 s son ~9 sacudones. Acá 24 da
     * ~7 en 165 s: el mismo orden de magnitud por asalto, repartido en un tren
     * mucho más largo.
     *
     * PERO EL 24 ESTÁ ELEGIDO PENSANDO EN LA ETAPA 2 DE LA PÓLVORA, que todavía
     * NO está construida: el día que la variante "acelera" tumbe un barril de
     * pólvora al pasillo (hoy suelta utilería, ver la nota de arriba), con 24
     * serían ~7 sacudones por asalto, la mitad "acelera" → unos **3 barriles
     * tumbados** en un tren que trae 9-14. Con el 10 del veloz serían ~8: el
     * tren se desarmaría solo y empujar barriles dejaría de ser tu jugada.
     *
     * Salió de una tabla de tres (10 / 24 / 40) calculada contra cuántos
     * barriles tumba cada uno. Tampoco está jugado todavía.
     */
    traqueteoCada: 24,

    /**
     * EL GANADO SE PUEDE SOLTAR. Es la identidad de este tren, y sale de algo
     * que ya tenía: es el único que lleva TRES vagones de ganado, que hasta
     * ahora eran pasillo decorado.
     *
     * Con esto el de carga deja de ser "el estándar pero más largo" y pasa a
     * ofrecer una pregunta propia: **¿podés limpiarlo entero sin que nadie
     * grite?** La estampida es lo que hace jugable esa pregunta —una forma de
     * abrir camino sin disparar— y `CONFIG.peso` es lo que la vuelve tensa,
     * porque acá el que despierta al tren se lo carga al hombro.
     */
    estampida: true,

    /**
     * Y ACÁ EL BOTÍN PESA — pero sólo después de que suene la alarma.
     *
     * Es la contracara de la estampida, y las dos juntas son la identidad del
     * tren: éste es el único donde el sigilo se puede jugar en serio, así que
     * es el único donde despertarlo tiene que costarte algo mientras seguís
     * adentro. Ver CONFIG.peso.
     *
     * En el de pasajeros NO pesa: allá la decisión está en los caminos y en a
     * quién le creés, y mudarle la misma pregunta a los dos sería borrar
     * justamente lo que los separa.
     */
    pesaElBotin: true,
    color: '#7a8f6b',
  },
};

export const TIPO_TREN_POR_DEFECTO = 'pasajeros';

/**
 * DIFICULTAD DEL TREN.
 *
 * No es un nivel que sube solo con las partidas jugadas: es una propiedad DEL
 * TREN, independiente del tipo de tren (un Veloz puede viajar en Fácil o en
 * Alta, igual que el estándar). Cuando elegís qué vía asaltar en el mapa,
 * elegís esto también.
 *
 * `vidaExtra` se suma a la vida del tipo de guardia, con tope 4 (ver
 * data/guards.js): tranquilo → guardia común 2, blindado 3. escoltado y dura
 * → guardia común 3, blindado 4 (el tope).
 *
 * `aiOverrides`, sólo en `dura`: no toca la vida, mejora CÓMO pelean. Cada
 * guardia arma su propio perfil de IA al nacer (`construirPerfilIA` en
 * world/train.js), igual patrón que ya usan con la vida vía `guardHealth()` —
 * por eso `systems/ai.js` dejó de leer `CONFIG.enemy` a secas en las partes
 * que varían acá, y pasó a leer `e.ai` (que por defecto es una copia de
 * CONFIG.enemy, y en un guardia de un tren `dura` trae estos overrides).
 */
export const SORTEAR_DIFICULTAD = false;

export const DIFICULTADES = {
  tranquilo: {
    id: 'tranquilo',
    name: 'Ronda tranquila',
    short: 'FÁCIL',
    hint: 'Guardia común.',
    vidaExtra: 0,
    peso: 65,
    color: '#9fd8b8',
  },

  escoltado: {
    id: 'escoltado',
    name: 'Tren escoltado',
    short: 'MEDIA',
    hint: 'Viajan con gente dura.',
    vidaExtra: 1,
    peso: 35,
    color: '#e07a4a',
  },

  /**
   * ALTA — la misma vida que `escoltado` (guardia común 3, blindado 4, el
   * tope del juego), pero además saben pelear mejor. Los cuatro números
   * bajaron/subieron un 25-30% contra la línea de base de CONFIG.enemy:
   * dispersión -25% (pegan más), aimTime -30% (disparan antes), sospecha
   * +25% (te descubren más rápido), y se asoman un 30% más seguido
   * (coverHoldMin/Max más cortos).
   */
  dura: {
    id: 'dura',
    name: 'Alta vigilancia',
    short: 'ALTA',
    hint: 'Guardias más rápidos y certeros.',
    vidaExtra: 1,

    /**
     * PESO 0 = HOY NO SALE SORTEADA. Está construida y entera —
     * `aiOverrides` funciona, y todo el sistema de perfil de IA por guardia
     * existe justamente para ella— pero no entra en la bolsa todavía.
     *
     * Es una LLAVE, no una amputación: la misma decisión que se tomó en su
     * momento con `SORTEAR_DIFICULTAD`. Subirle el peso a un número mayor
     * que cero la devuelve al juego sin tocar una línea de código.
     */
    peso: 0,

    aiOverrides: {
      spreadNear: 0.068,
      spreadFar: 0.21,
      aimTime: 0.21,
      suspicionNear: 2.75,
      suspicionFar: 0.5625,
      coverHoldMin: 0.49,
      coverHoldMax: 1.12,
    },
    color: '#c94f3d',
  },
};

export const DIFICULTAD_POR_DEFECTO = 'tranquilo';

/**
 * EL SORTEO, CON PESOS.
 *
 * `peso` es cuántas fichas mete cada entrada en la bolsa. No hace falta que
 * sumen 100 —el total se calcula solo— pero están escritos como porcentajes
 * porque así se leen de un vistazo:
 *
 *   Tipo de tren:  50% pasajeros · 50% carga  (el veloz está en 0: no sale)
 *   Dificultad:    65% fácil · 35% media  (alta está en 0: no sale)
 *
 * EL 50/50 NO ES PEREZA, es lo que hace que el vagón de armas siga apareciendo
 * en el 12,5% de los asaltos igual que antes (ver `sustituciones` en el de
 * carga). Y es la perilla a mirar primero si el de carga se siente demasiado
 * presente: pasó del 20% al 50% de golpe, así que es el tren MENOS jugado de
 * los dos y ahora es la mitad de tus asaltos.
 *
 * Con peso 0 una entrada queda fuera de la bolsa sin desaparecer del
 * catálogo, que es lo que permite tener algo construido y apagado.
 */
export function sortearPorPeso(catalogo, rng) {
  const entradas = Object.values(catalogo).filter((e) => (e.peso || 0) > 0);
  const total = entradas.reduce((suma, e) => suma + e.peso, 0);

  let tirada = rng.range(0, total);
  for (const e of entradas) {
    tirada -= e.peso;
    if (tirada <= 0) return e;
  }
  return entradas[entradas.length - 1];   // por redondeo, nunca debería llegar
}

/** Qué tipo de tren sale. Lo usa el mapa cada vez que un tren completa su vuelta. */
export function sortearTipoTren(rng) {
  return sortearPorPeso(TRAIN_TYPES, rng);
}

/** Qué tan escoltado viaja. Lo usa el mapa en cada parada del recorrido. */
export function sortearDificultad(rng) {
  return sortearPorPeso(DIFICULTADES, rng);
}
