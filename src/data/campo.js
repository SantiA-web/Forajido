/**
 * 🌵 EL CAMPO — LA PRUEBA CHICA (los números y los lugares; el dibujo y las reglas, en scenes/campoScene.js)
 * *(Santi, 2026-11-24: "vos ponés 'salir al campo' o algo así y con tu caballo recorrés el lugar. El lugar sería como
 * en la huida pero zoom… Por el campo podés cazar, ir por caminos, ver granjas, las robás o hablás con la gente… un
 * mundo libre, no infinito pero sí de tamaño considerable. Y podés dar con el campamento de los Rennick pero te tomaría
 * mucho tiempo si no tenés pistas o rastros que seguir"; "vamos con la prueba chica")*.
 *
 * ⚠️ ES UNA PRUEBA: para saber si cabalgar por ahí es divertido antes de llenarlo de cosas. Dibujo con figuras básicas
 * *(Santi: "lo del dibujo lo hacemos con cuadrados y figuras y colores básicos o cosas ya hechas")*.
 *
 * EL MUNDO ES EL MAPA DE RUTAS (data/region.js) AGRANDADO: las mismas vías, los mismos pueblos, la mina y tu
 * campamento, cada uno donde está en el papel. Así lo que ves en el mapa es lo que cabalgás.
 */
export const CAMPO = {
  /** 🔑 La llave: con true, montar en el poste del campamento ([F]) sale al campo en vez de ir directo al pueblo. */
  activa: true,

  /**
   * EL TAMAÑO: cuántos minutos de verdad tarda el Criollo a galope en cruzarlo de oeste a este. Lo de norte a sur sale
   * del papel (el mapa es casi el doble de ancho que de alto, y al norte se avanza menos en pantalla).
   * *(Santi quería 10 de ancho y 5 de alto; para la prueba, 3.)* 🔁 9 desde el 2026-11-24: un vagón mide ~500 y las
   * vías del papel doblaban en tramos de 1.200, así que el tren no entraba en las esquinas; con ×3 los tramos dan para
   * curvas de 1.500 (unos 3 vagones). Santi eligió agrandar el mundo antes que achicar el tren.
   */
  minutosDeAncho: 9,

  /**
   * La lupa del mundo: la del galope de cerca *(Santi: "quiero el zoom que hay en el galope, no el de la huida")*. 🔁 Era
   * 2, la de la huida (el galope de lejos).
   */
  zoom: 4,

  /**
   * 🔍 LA LUPA DE LEJOS *(Santi: "Galopar, subirse a un punto alto o un tiroteo donde los enemigos están lejos, se
   * achica. Caminar con el caballo, llegar a puntos que sean pacíficos (granjas, pueblos) o un tiroteo [...] donde los
   * enemigos están más juntos a vos y preferís puntería, normal")*. Dos tamaños y no un zoom que cambia de a poco, como
   * en el galope (`zoomEscalon` en data/horse.js): a la mitad exacta la grilla pierde siempre los mismos puntos.
   *  - `lejos`: la lupa de lejos, como parte de `zoom` (la mitad: 4 → 2, la de la huida).
   *  - `pase`: segundos de un tamaño al otro (para que no sea un tirón).
   *  - `esperaLejos` / `esperaCerca`: cuánto tiene que durar lo que pide el cambio antes de hacerlo, para que soltar
   *    el galope un segundo no haga ir y venir la cámara. Apuntar cambia enseguida: es a propósito.
   *  - `cercaDeLugar`: cerca de un lugar tranquilo (pueblo, granja, tu campamento), a cuántas veces su radio vuelve la
   *    lupa normal.
   */
  // 🔁 `cercaDeLugar` era 2,5: al salir del campamento galopando el zoom tardaba 4,2 s en alejarse (medido). Con 1,5,
  // unos 2,8 s *(Santi eligió achicarla)*.
  lupa: { lejos: 0.5, pase: 0.3, esperaLejos: 0.6, esperaCerca: 1.2, cercaDeLugar: 1.5 },

  /** EL CABALLO: al trote por defecto (no se cansa); con [SHIFT], a galope, mientras le dure el aguante. */
  caballo: {
    trote: 0.55,          // del galope (`sprintSpeed` del caballo)
    paso: 0.3,            // reventado: al paso
    galopeDura: 35,       // segundos de galope con el aguante lleno
    recupera: 50,         // segundos al trote para llenarlo de nuevo
    giro: 3.2,            // radianes por segundo que tarda en tomar el rumbo
  },

  /**
   * EL RELOJ DE ADENTRO: lo que dura una parte del día para lo que anda solo (las carretas). 🔁 Antes, cada
   * `segundosPorParte` de cabalgar pasaba una parte del día y la luz cambiaba de golpe *(Santi, 2026-11-25: "cuando
   * avanza y la distancia cambia va cambiando las partes del día y se ve muy directo y fuerte el cambio")*. Ahora la
   * luz del campo es la de la salida *("si en el campamento salís de día todo es de día, si salís de noche es de
   * noche")*: cabalgando no cambia la parte; el reloj sigue corriendo para las carretas.
   */
  segundosPorParte: 180,

  /**
   * 🌇 ESPERAR HASTA LA NOCHE, O HASTA EL DÍA *(Santi: "cuando vayas a asaltar o hacer una actividad te da la opción 'esperar hasta la
   * noche' y aparece el cielo cambiando de color en una transición y después vuelve al desierto"; "hacé también
   * esperar hasta el día")*. Cerca de un lugar (menos el campamento) o de una carreta a menos de `carretaA` unidades,
   * [N]: de día, hasta la noche; de noche, hasta la mañana. El cielo tapa el desierto en `tapa` segundos, cambia de
   * color durante `cielo` y lo destapa en `destapa`. 🔁 Más lento y en degradé: en franjas "es muy tildada y trabada".
   */
  esperar: { activa: true, carretaA: 500, tapa: 1.0, cielo: 5.0, destapa: 1.0 },

  /** Desde dónde se puede usar algo con [E] (unidades del mundo): un animal caído, y cada lugar (son grandes). */
  alcance: 70,
  radios: { campamento: 200, granja: 230, mina: 260, pueblo: 330, rennick: 420 },

  /** Las cosas del suelo: piedras, matas, cactus (como la huida), por celda, siempre las mismas en el mismo lugar. */
  obstaculos: { celda: 170, max: 2, lejosDeLugares: 420, lejosDeVias: 60, lejosDeRelieve: 120 },

  /**
   * 🌵 EL SUELO EN MANCHONES (etapa 1 del campo con vida, 2026-11-24): las matas no van parejas por todos lados, como en
   * el galope, sino juntas en zonas, con mucha arena lisa entre una y otra; y más cerca del agua. De lejos el campo se
   * veía apretado; así se ve vacío, y lo que hay se nota. Ver `verdor` en world/campoRelieve.js.
   *  - `escala`: el tamaño de las zonas (unidades del mundo, sin achatar): una con matas, otra de arena lisa.
   *  - `desde` / `hasta`: con el ruido de las zonas debajo de `desde`, arena lisa; arriba de `hasta`, lo más tupido.
   *  - `tupido`: lo más tupido, como parte de los manchones del galope (1 = igual que el galope).
   *  - `agua`: cerca de ríos y arroyos, hasta `suma` más de tupido, a menos de `lejos`.
   *  - `sueltas`: las matitas sueltas en la arena lisa, como parte de las del galope.
   *  - `piedras`: de las piedras, matas y cactus que chocan, cuántos quedan en la arena lisa (en lo tupido, todos).
   *  - `textura`: la textura de la arena, con letras (g grano, m manchas, d detalles): ver `pintarTextura` en
   *    world/estiloNuevo/suelo.js. *(Santi eligió las tres juntas, comparadas con cada una sola.)*
   */
  suelo: { escala: 1400, desde: 0.42, hasta: 0.68, tupido: 1.5, agua: { lejos: 650, suma: 0.9 }, sueltas: 0.5, piedras: 0.3, textura: 'gmd' },

  /**
   * 📡 LAS SEÑALES DE LEJOS (etapa 2 del campo con vida; world/senales.js): lo que se ve antes de llegar y tira al
   * jugador para un lado. Detrás de cada una hay algo.
   *  - `humo`: las chimeneas de los pueblos, la granja y el puesto (de día; a la mañana más que a la tarde), la fogata
   *    de tu campamento y el humo negro de la mina. Los Rennick no humean: están escondidos. Cada `cada` segundos sale
   *    una bocanada que vive `vida` segundos, sube `sube` por segundo, el viento la lleva `viento` por segundo y crece
   *    de `radio[0]` a `radio[1]`. De noche no se ve el humo: se ve el `brillo` de las fogatas y las ventanas.
   *  - `remolinos`: los de polvo, de día, en la arena lisa (`verdorMax`). El tiempo va en tramos de `tramo` segundos y
   *    el campo en celdas de `celda`: en cada celda y tramo, con suerte `chance`, nace uno que dura `dura` segundos.
   *  - `buitres`: dan vueltas sobre lo muerto. Sobre los `restos` (puestos a mano, cada uno con su porqué) y sobre los
   *    animales que cazás, a los `llegan` segundos de caer. Sólo de día.
   */
  senales: {
    activa: true,
    // (🔁 Vivía 15 s: la columna llegaba a 10 m y de lejos no se veía; el humo de verdad sube mucho más.)
    humo: { cada: 0.6, vida: 36, sube: 8, viento: 3.2, radio: [4, 26], espeso: 1.3, chimeneas: { manana: 1, tarde: 0.7 } },
    brillo: { fogata: 30, ventana: 9 },
    remolinos: { tramo: 40, celda: 1000, chance: 0.4, dura: 24, alto: 90, anda: 10, verdorMax: 0.3 },
    buitres: { llegan: 20, radio: [30, 46], alto: 80, vuelta: 0.5 },
    /** En puntos del plano (data/plano.js). Huesos dibujados con figuras básicas, mientras. */
    restos: [
      { x: 210, y: 166, que: 'res' },      // una res de la granja que no llegó al agua, al lado del Arroyo del Muerto
      { x: 190, y: 142, que: 'buey' },     // el buey de una carreta, que lo dejaron en el Camino de las Carretas
      { x: 20, y: 84, que: 'caballo' },    // un caballo reventado al borde del malpaís: alguien quiso cruzarlo
      { x: 320, y: 160, que: 'berrendo' }, // uno que mató el puma, en las Lomas del Bravo
    ],
  },

  /**
   * ⛰️ EL RELIEVE (world/campoRelieve.js; dónde está cada cosa, en data/plano.js). Unidades del mundo: una persona mide
   * unas 20 (1 ≈ 8,5 cm).
   */
  relieve: {
    /**
     * Lo alto que se ve cada cosa (la tapa corrida hacia arriba). Más bajo que de verdad (una meseta de 20 m serían 235,
     * casi la pantalla entera): con estos se ve la barranca y todavía se ve qué hay detrás.
     */
    alto: { meseta: 80, cerro: 120, sierra: 200, malpais: 45 },
    // 🔁 (Arriba de lo alto la lupa se aleja: ahora con la de lejos de `lupa`, no con una propia de 3.)
    /** Cuánto se tarda en subir o bajar por un sendero (segundos), y qué tan ancho es (de verdad). */
    subidaTarda: 0.8, subidaAncho: 140,
    /**
     * Qué tan ancho es un arroyo y un camino de carretas (de verdad). Los ríos, con su ancho del plano por esto.
     * 🔁 Los caminos ya no llevan huellas: lisos *(Santi: "a los caminos no les pongas los huecos de las carretas")*.
     */
    anchoArroyo: 90, anchoCamino: 40, rio: 0.35,
    /** Qué tan ancho es el vado, de cada lado. */
    vadoAncho: 160,
    /** Cuánto frena cada suelo (por la velocidad), y cuánto ayuda el camino al trote. */
    lento: { lomas: 0.7, arroyo: 0.85, vado: 0.45 },
    camino: 1.25,
    /** En las lomas el galope cansa más. */
    galopeLomas: 1.6,
  },

  /**
   * 🏚️ LOS LUGARES NUEVOS. 🔁 Desde el 2026-11-24 dónde está cada uno sale de data/plano.js (y todo lo de acá, en
   * medidas de ese papel: 384×216); acá quedan los nombres y lo que no es un lugar.
   */
  granja: { x: 140, y: 90, nombre: 'La granja de los Hale' },
  /**
   * 🐺 EL CAMPAMENTO DE LOS RENNICK: escondido. No está en el mapa hasta que lo encontrás. Sin pistas, es una aguja en
   * el desierto; con la pista de la granja sabés la zona; las huellas te llevan.
   */
  rennick: { x: 214, y: 176, seVeDesde: 520 },
  /** La pista de la granja: un círculo en el mapa (centro y radio, en el papel) donde puede estar. */
  pistaRennick: { x: 205, y: 168, radio: 26 },
  /** Las huellas: de la granja hacia el sur, hasta el campamento (papel). Se ven de cerca. */
  huellas: { puntos: [[146, 98], [160, 116], [176, 134], [192, 152], [206, 168], [214, 176]], cada: 26, seVenDesde: 260 },

  /**
   * 🦌 LA CAZA (etapa 3 del campo con vida; world/fauna.js). 🔁 Antes era un solo rebaño de berrendos en un lugar fijo.
   * *(Santi, 2026-11-24: "voy con tus recomendaciones pero haría que el berrendo sea considerablemente el más rápido…
   * y le agregaría algo especial que valga la pena cazarlo. También agregaría el zorro rojo, pelaje muy caro. A diferencia
   * del coyote, es que el coyote molesta. Y agregaría un animal argentino: el guanaco, que sea más raro… y que su cuero
   * sea el más caro")*.
   *
   * DÓNDE: el campo va en celdas de `celda`; cada día, cada celda cerca de ti tira su suerte según su zona (`zonas`:
   * el llano, las lomas, cerca del agua) y puede tener un grupo. Lo que cazas no vuelve hasta el día siguiente; lo que
   * dejas muerto, al otro día ya no está (se lo comieron). El zorro, sólo de noche y a la madrugada, en cualquier zona.
   * El guanaco no sale por suerte: hay UNA tropilla (`guanacos`), la de un estanciero que la trajo del sur y se le
   * escapó; vive en las Lomas del Oeste y cada uno que cazas tarda `guanacos.nace` días en volver.
   *
   * CÓMO: cada animal te nota por la vista (`vista`) o por el oído (`oido`), las distancias de cada uno, según cómo
   * vas (`sentidos`); primero se pone alerta y después huye, a `vel` veces el galope del Criollo. El berrendo, el más rápido por lejos (88 km/h de verdad; el caballo, 65-70): no se lo alcanza. Pero es
   * curioso (`curiosidad`): si te quedas quieto un rato, se acerca a mirarte. El coyote molesta: va a lo que dejas
   * muerto (`coyote.llega` s después), se lo come en `coyote.come` s y, mientras anda cerca, espanta a los demás.
   *
   * QUÉ DA: `carne` (porciones; la banda come 4 por día y dura COMIDA.caza.desierto.dura días), `cuero` (lo que paga
   * el almacén) y el berrendo, sus cuernos (`trofeo`). Carnear lleva `carnear` segundos quieto, y mientras tanto
   * el día corre `rapidezCarnear` veces más rápido (un venado, una hora larga). El caballo carga `carga`.
   * El tiro (pegue o no) espanta todo lo que haya a `espantaTiro`. Cada uno aguanta `aguante` (ver `tiros`).
   */
  /**
   * 🚶 A PIE ([F] para bajarte, frenado): `trota` y `agachado` las velocidades del tren (CONFIG.player); `subir`: a
   * cuánto del caballo se puede volver a subir; `bajarHasta`: hasta qué velocidad del caballo te podés bajar;
   * `enArbusto`: la velocidad metido en un arbusto *(Santi: "en los arbustos te metes casi adentro")*.
   */
  aPie: { trota: 78, agachado: 40, subir: 30, bajarHasta: 20, bajaAdelante: 6, enArbusto: 0.6 },
  /** 🆕 Apuntar (clic derecho): cuánto tarda en sacar el arma y en guardarla, y cuánto queda arriba después de un tiro (s). */
  apuntar: { saca: 0.25, guarda: 0.4, queda: 1.5 },
  /**
   * 🛞 LAS CARRETAS (etapa 4 del campo con vida, paso 1; world/carretas.js) *(Santi, 2026-11-25: "pondría varios tipos de
   * carretas… vamos de menos a más"; "arrancá por el 1")*. Andan por los caminos del plano, por su derecha
   * (`porLaDerecha`, unidades del medio del camino), y antes que ellas se ve su polvo.
   *  - `caminos`: por cuál anda cada una. Cada día, para cada sentido, con suerte `chance` parte una a la mañana (en la
   *    primera `saleHasta` de la mañana) de una punta; `tipos`, cuántas de cada clase (el dibujo, por ahora, es uno
   *    solo: la de carga). Anda sólo con luz; de noche queda parada donde está y sigue al otro día.
   *  - `vel`: las dos velocidades, en galopes del Criollo *(Santi, 2026-11-25: "las velocidades deberían concordar con el
   *    movimiento de los caballos"; eligió la A, "por ahora solo con A")*. `paso` (≈ 6,5 km/h, la de siempre; los
   *    caballos irán con la animación del caballo gris caminando) y `rapida`, asustada (≈ 25 km/h, con el galope del
   *    Criollo): más que tu trote (0,55), menos que tu galope, así la alcanzas sólo gastando aguante. Las patas, cuando
   *    estén los caballos de tiro, a la velocidad de cada una, para que no patinen.
   *  - `huella`: lo que ocupa, en metros desde el medio de los ejes (`atras`, `adelante` hasta el pescante, `ancho`
   *    de cada lado); si hay alguien a menos de `paraA` metros adelante, se para y espera.
   *  - `vueltaRueda`: lo que avanza en una vuelta de 8 cuadros de las ruedas (la de atrás gira un rayo: 0,68 m × 2π / 8).
   *  - `polvo`: cada `cada` segundos de andar, una bocanada detrás (`atras` metros), que vive `vida` segundos, sube
   *    `sube` por segundo, el viento la corre `viento` por segundo y crece de `radio[0]` a `radio[1]`. Es lo que se ve de lejos.
   */
  carretas: {
    activa: true,
    caminos: {
      // (🔁 2026-11-26: y la diligencia, paso 2B parte 3: por acá, que no tiene tren, pasa la del correo.)
      'Camino de las Carretas': { chance: 0.6, tipos: { carga: 2, colono: 1, diligencia: 1 } },
      'Camino Real': { chance: 0.4, tipos: { carga: 1, mina: 1 } },
      'Camino de la Granja': { chance: 0.25, tipos: { colono: 1 } },
      // (El Camino del Fuerte, del ejército: cuando esté la ley que patrulla, etapa 6.)
    },
    saleHasta: 0.6,
    // (🔁 `rapidaDe`: asustadas, las pesadas van al trote —con mineral o mercadería, mulas o bueyes, no galopan—; la
    // diligencia, liviana, con `rapida`. Revisión: todas iban a 25 km/h.)
    vel: { paso: 0.16, rapida: 0.6, rapidaDe: { carga: 0.3, mina: 0.3, colono: 0.3 } },
    /**
     * 🐎 EL SUSTO: apura a los caballos (`vel.rapida`) si un jinete viene al galope hacia ella a menos de `ve` metros, o
     * si suena un tiro a menos de `oye` metros. Sigue rápida `dura` segundos desde el último susto. (Cuando la manejes
     * tú, paso 3, son las mismas dos.)
     */
    susto: { ve: 45, oye: 90, dura: 20 },
    /**
     * 🔫 ASALTARLA (paso 2, world/asaltoCarreta.js) *(Santi, 2026-11-25: "arrancá con tus numeros y los guardias para el
     * 2B")*. Los números son los míos, para probar.
     *  - `frena`: se le apunta al conductor (con la mira a menos de `conductor.mira` metros de su pecho) desde menos de
     *    `metros`, durante `apuntar` segundos, y frena. La tienes mientras le apuntas o estás a menos de `cerca` metros;
     *    si no, a los `suelta` segundos sigue su camino (y apura a los caballos).
     *  - `usarA`: a cuántos metros se le habla con [E].
     *  - `conductor`: dónde va sentado (`adelante` del medio de los ejes, `alto` del suelo), dónde tiene el pecho (`pecho`,
     *    sobre el asiento), el tamaño que alcanza la bala (`radio`) y, muerto, a cuánto del medio queda tirado (`caido`).
     *    Yendo hacia el fondo la lona lo tapa: se frena apuntándole a la carreta (a `lonaMira` del medio de la lona, que
     *    está `lona` arriba del suelo).
     *    Todo en metros.
     *  - `botin`: lo de cada tipo. `plata` del conductor; la de colonos lleva `comida` (porciones para la despensa), la de
     *    carga `bultos` de mercadería que vale `valor` cada uno en el perista. (La de la mina, por ahora como la de carga:
     *    sus guardias son el paso 2B.)
     *  - `bultosMax` y `comidaMax`: lo que carga el caballo.
     *  - `cuentas`: con un testigo vivo (el conductor, o alguien de otra carreta a menos de `testigoA` metros), robarla
     *    suma `recompensa` y la `fama` de su tipo. Matar al conductor: `matar.honor` siempre; con testigo, además
     *    `matar.recompensa` y `matar.fama` (un civil, como en el tren). Sin testigos, ni recompensa ni fama: nadie sabe
     *    que fue el Cuervo.
     */
    asalto: {
      activa: true,
      // (🔁 `sueltaRendido`: la que se rindió porque mataste a sus guardias —quizás de lejos— te espera más.)
      frena: { metros: 25, apuntar: 1.5, cerca: 8, suelta: 5, sueltaRendido: 12 },
      usarA: 5,
      // (🔁 Lo que se tarda en tomar la plata, la carga o lo de los pasajeros, con el mundo andando: antes era al
      // instante, con el menú abierto y los tiros parados en el aire.)
      tomar: 1.5,
      conductor: { adelante: 1.7, alto: 1.1, pecho: 0.6, radio: 0.45, mira: 1.2, caido: 1.8, lona: 2.0, lonaMira: 2.2, bajado: 1.6, pechoDePie: 1.25,
        // (El pescante de la diligencia, más alto y más atrás que el de las carretas.)
        de: { diligencia: { adelante: 1.42, alto: 1.97, bajado: 2.3 } } },
      botin: {
        colono: { plata: [10, 25], comida: 2 },
        carga: { plata: [20, 40], bultos: 2, valor: [30, 40] },
        // (🔁 2026-11-26, Santi: "voy con tus recomendaciones": de ida a la mina lleva la paga de los mineros en un cofre
        // que se fuerza en `cofre.forzar` segundos; de vuelta, mineral, que no te puedes llevar: sólo la plata del conductor.)
        mina: { plata: [20, 40], cofre: [150, 250] },
        // (🆕 La diligencia: el cochero, los `pasajeros` —entre los dos números— con `porPasajero` cada uno, y la caja del
        // correo bajo el pescante, que se fuerza como el cofre.)
        // (🔁 La caja era [200, 400]: la diligencia daba ~$410 con un solo guardia, la mejor y la más fácil. Ahora lleva
        // también un jinete de escolta y la caja es más chica.)
        diligencia: { plata: [15, 30], pasajeros: [2, 4], porPasajero: [15, 45], cofre: [120, 250] },
      },
      // (Los pasajeros de la diligencia, bajados en fila detrás del cochero, cada `entre` metros; uno sí y uno no,
      // `afuera` metros más lejos de la diligencia.)
      pasajeros: { entre: 1.5, afuera: 1.0 },
      cofre: { forzar: 8 },
      bultosMax: 2, comidaMax: 4,
      // (🔁 Revisión: la recompensa por robar, según lo que vale —era 150 para todas—; y matar a un civil con testigo
      // cuesta más que robar —era 110, menos que robar: matar a todos salía siempre mejor—.)
      cuentas: { testigoA: 90, recompensa: { colono: 30, carga: 60, mina: 120, diligencia: 150 }, fama: { colono: 2, carga: 3, mina: 8, diligencia: 20 }, matar: { honor: -25, recompensa: 200, fama: 5 } },
    },
    /**
     * 🔫 LOS ESCOPETEROS (paso 2B, parte 1; world/escopeteros.js) *(Santi, 2026-11-26: "propongo que el escopetero pueda
     * bajarse y ser un guardia a pie"; "en las carretas de carga sí quiero un escopetero al lado")*. Números míos.
     *  - `escopetero`: en qué carretas va (`en`), con qué arma (las de los guardias del tren, data/armasGuardia.js: la de
     *    la mina, de la compañía, con Winchester), a cuántos metros a la derecha del medio del pescante (`lado`; el
     *    conductor va a la misma distancia a la izquierda) y a cuántos cae si lo matas sentado (`caido`).
     *  - Se da cuenta si le apuntas a menos de `apuntarA` metros de la carreta desde menos de `ve`, si te acercas a menos
     *    de `cerca` con el arma afuera, si oye un tiro a menos de `oye`, o si la frenas; tarda `reaccion` segundos.
     *  - `alcance`, `apuntar`, `cadencia`: por cuánto se multiplican los del arma (1 = como en el tren). `punteria`: cuánto
     *    se abre su bala, en radianes a cada lado (la escopeta abre su abanico).
     *  - `pie`: bajado, camina a `velocidad` m/s hasta el otro lado de la carreta (una elipse de `largo` por `ancho`
     *    metros desde el medio) y se cubre: agachado entre `escondido` segundos, asomado `asomado`; cada `cambia`
     *    segundos mira si tiene que cambiar de lado.
     *  - `cuerpo`: el pecho, de pie, a `pecho` metros del suelo; la bala lo alcanza a `radio`. `vida`: la suya (como un
     *    guardia del tren: dos balas, a `danio.aGuardia` cada una). `danio.aJames`: lo que te saca cada bala suya (un
     *    perdigón, por el factor de la escopeta), como en el tren.
     *  - `james`: tu vida en el campo (la del tren, 100) y cuánto quedas sin que te vuelvan a pegar (`invulnerable`).
     *    El pecho: a pie `pecho`, agachado `agachado`, montado `montado` metros. Si llega a 0, caes herido y te llevan
     *    preso, como en el tren. Se te cura al volver al campamento.
     *  - `cuentas`: cada escopetero muerto con un testigo vivo (el conductor), `recompensa` y `fama`.
     */
    guardias: {
      activa: true,
      // (🔁 `otra`: algunos llevan otra arma, [arma, de 0 a 1 cuántos]: con escopeta todos, de lejos se les ganaba siempre.)
      escopetero: { en: ['carga', 'mina', 'diligencia'], arma: { carga: 'escopeta', mina: 'winchester', diligencia: 'escopeta' },
        otra: { carga: ['winchester', 0.3], diligencia: ['winchester', 0.35] }, lado: 0.32, caido: 1.6 },
      // (🔁 `oye` era 90: un tiro de caza lejos los echaba a pelear. Más lejos, sólo apura a la carreta: `susto.oye`.)
      ve: 40, apuntarA: 4, cerca: 15, oye: 35, reaccion: 0.8,
      alcance: 1, apuntar: 1, cadencia: 1, punteria: { winchester: 0.05, escopeta: 0.05 },
      // (🔁 2026-11-26, Santi: "la atraviesan, no usan los espacios": a pie anda por un anillo alrededor de la carreta
      // —`largo` y `ancho` metros desde el medio, más que ella—, escondido entre `escondido` segundos y asomado por una
      // punta o `afuera` veces más lejos; tira `rafaga` tiros, o hasta `asomadoMax` segundos, y vuelve a cubrirse.)
      pie: { velocidad: 2.4, largo: 2.7, ancho: 1.8, afuera: 1.5, escondido: [1.0, 2.2], rafaga: 2, asomadoMax: 5, aparte: 0.7 },
      // 🛡️ DEFENDERSE (🔁 2026-11-26, Santi: "puedo estar bastante lejos de la carreta y les puedo disparar de frente
      // porque no se cubren, ni se bajan"; eligió "según dónde estés" y que el conductor se baje y se cubra). Una carreta
      // con guardias, amenazada (oyó tu tiro, le apuntaste o la viste con el arma afuera): si estás adelante —a menos de
      // `adelante` grados de su camino— o le pegaste a ella o a su gente, a los `frena` segundos frena; el escopetero se
      // baja a pelear y el conductor se esconde detrás. Si no, acelera para escaparse. Siguen viaje cuando pasan `calma`
      // segundos sin tiros y estás a más de `suelta` metros. Si no les queda ningún guardia vivo, el conductor se rinde.
      // (🔁 Si le pegas, frena al instante. Y se van también si estás fuera del alcance de sus armas más `margen` metros:
      // antes, entre 10 y 40 m con la escopeta, nadie hacía nada nunca. Parada —le cortaste el camino, o de noche—,
      // se defiende aunque no estés adelante: no puede escapar.)
      defensa: { adelante: 50, frena: 1.2, calma: 20, suelta: 40, margen: 5 },
      cuerpo: { pecho: 1.25, agachado: 0.8 },
      // 🎯 (🔁 2026-11-26, Santi: "veo como si las balas no le pegaran siempre cuando sí debería") Dónde pega una bala: una
      // columna del tamaño del dibujo (world/cuerpos.js), de `abajo` metros sobre los pies hasta `pie`, `agachado` o
      // `sentado`, con `radio` de cada lado; montado, de `montado[0]` a `montado[1]` metros sobre la silla (negativo:
      // bajo la silla). Vale para todos: conductores, pasajeros, escopeteros, la escolta y tú. Antes, una bolita de 0,45 m
      // alrededor del pecho: al sentado no se le pegaba en la cabeza ni los hombros, y al jinete le quedaba arriba del sombrero.
      columna: { radio: 0.25, abajo: 0.3, pie: 1.55, agachado: 1.25, sentado: 1.2, montado: [-0.3, 0.85] },
      vida: 100,
      danio: { aJames: 25, aGuardia: 50 },
      // (`montado`: el pecho, metros sobre la silla. 🔁 Era 2,1 m sobre el suelo: quedaba arriba del sombrero.)
      james: { vida: 100, invulnerable: 0.6, pecho: 1.25, agachado: 0.8, montado: 0.5, caido: 2.5 },
      cuentas: { recompensa: 15, fama: 3 },
      /**
       * 🐎 LA ESCOLTA A CABALLO (paso 2B, parte 2; world/escolta.js). Números míos.
       *  - `en`: cuántos jinetes lleva cada tipo de carreta. `arma`: la de ellos (data/armasGuardia.js).
       *  - Escoltando: `atras` metros detrás de la carreta y `lado` a cada costado. `giro`: lo que dobla el caballo
       *    (radianes por segundo). `velocidad`: la de su caballo, en galopes del Criollo (un poco menos: con uno
       *    bueno te les escapas).
       *  - Peleando: quedan a entre `cerca` y `lejos` metros de ti, corridos `rodea` radianes de costado (te rodean).
       *    `punteria`: cuánto se les abre la bala, quietos o andando. Te sueltan si te alejas más de `sueltan` metros
       *    de la carreta. (Dónde les pega tu bala: `guardias.columna`.)
       */
      // (🔁 `en`, por dibujo o por tipo: la de la mina yendo, con la paga —`minaIda`—, dos; de vuelta, con mineral, uno; la
      // diligencia, uno.)
      escolta: { en: { minaIda: 2, mina: 1, diligencia: 1 }, arma: 'winchester', atras: 5, lado: 2.5, giro: 3, velocidad: 0.95,
        cerca: 10, lejos: 20, sueltan: 120, punteria: { quieto: 0.05, andando: 0.12 },
        // (🔁 Esquivan lo que choca mirando `esquiva` metros adelante. Peleando, cada uno en su ángulo alrededor tuyo: gira
        // `orbita` radianes por segundo, y si otro queda a menos de `separa` radianes se aparta `aparta` por segundo. Antes
        // `rodea`: el punto de llegada corrido de costado, cada uno para su lado; se cruzaban y quedaban encimados.)
        esquiva: 4, orbita: 0.25, separa: 1.6, aparta: 1.2,
        // (🆕 Escoltando, trabado más de 2 s o a más de `lejosDeSuCarreta` metros de ella, y a más de `ocultoA` de ti: vuelve
        // a su puesto, sin que lo veas.)
        lejosDeSuCarreta: 120, ocultoA: 80 },
    },
    // (🔁 Iba 7 a su derecha: con las huellas a la trocha de la carreta, va por el medio, con una rueda en cada huella.)
    porLaDerecha: 0,
    huella: { atras: 1.9, adelante: 2.2, ancho: 1.2, paraA: 7 },
    // 🛞 RODEO (2026-11-26): la que anda esquiva a una carreta parada (asaltada, defendiéndose o sin conductor) en vez de
    // atravesarla: a menos de `largo` metros de ella se abre hasta quedar a `aparte` metros de costado, en `entra` metros.
    // (Apareció probando la defensa: otra diligencia se metió adentro de la que estaba frenada.)
    // (`aparte` 5: la gente bajada anda hasta 2,7 m del medio de la parada y los pasajeros hasta 3,6; la que pasa
    // ocupa 1,2 de cada lado: así no los pisa.)
    // 🔁 Revisión (2026-11-26): de costado se mueve a lo sumo `lateral` metros por metro que avanza (quieta, nada: antes
    // saltaba 5 m si se frenaba en el medio del rodeo), y entra más largo (`largo` 14, `entra` 8: con 10 y 5 iba casi de
    // costado). Las que se cruzan de frente se corren `cruce` metros cada una a su derecha, desde `cruceVe` metros
    // (antes se atravesaban).
    rodeo: { aparte: 5, largo: 14, entra: 8, lateral: 0.6, cruce: 1.5, cruceVe: 14 },
    // 🏃 ESCAPAR CAMPO TRAVIESA (2026-11-26, Santi: "si te ponés enfrente de la carreta, el conductor podría elegir
    // salirse del camino y seguir escapando. Debería tener como prioridad llegar a un pueblo"; me preguntó qué sería lo
    // más normal). Las de `tipos` —la diligencia: liviana y rápida, con plata y correo— no frenan si te pones adelante
    // o las amenazas: se salen del camino y van a galope al pueblo más cerca (no el que queda de tu lado), esquivando
    // piedras, matas, mesetas y a ti (miran `mira` metros adelante y giran hasta `giro` radianes por segundo). Las
    // pesadas (carga, mina) y los colonos frenan, como antes. A menos de `llega` metros del pueblo, el viaje termina
    // ahí y te denuncia. Si se queda trabada más de `atasca` segundos, frena y se defiende.
    // (`recula`: si no puede seguir ni girar, retrocede a esa fracción de su velocidad, girando. `aTi`: cuánto lugar te
    // deja, en metros.)
    // 🔁 Revisión (2026-11-26):
    //  - `vel`: escapando va a esa fracción del galope (más que asustada en el camino: si no, la alcanzabas enseguida).
    //  - `recula`: ahora es una fracción de su paso, no de su galope (reculaba más rápido de lo que anda).
    //  - La ruta: al soltarla busca por dónde llegar rodeando mesetas y agua, en una grilla de `grilla` metros, hasta
    //    `margen` metros afuera del rectángulo entre ella y el pueblo, mirando a lo sumo `buscaHasta` casillas. Si en
    //    `sinAvance` segundos no se acerca, la busca de nuevo; a la segunda, cuenta como trabada.
    //  - `llegaSola`: si pasan esos segundos de luz sin que la veas andar (te fuiste del campo), llegó: irse ya no es un
    //    truco para que no te denuncie.
    huida: { tipos: ['diligencia'], llega: 30, mira: 7, giro: 0.9, atasca: 3, recula: 0.3, aTi: 1.5,
      vel: 0.7, grilla: 8, margen: 300, buscaHasta: 40000, sinAvance: 10, llegaSola: 30, llegaCerca: 120 },
    vueltaRueda: 0.534,   // (🔁 era 0,712: la carreta nueva, la de Santi, tiene 8 rayos atrás: 0,68 m × 2π / 8)
    // (🔁 Subía 6 por segundo y espeso: salía una cinta blanca recta. El de una carreta al paso es bajo y ralo, y el
    // viento lo corre: se ve como una nube chata detrás.)
    polvo: { cada: 0.5, vida: 7, sube: 2.2, viento: 3, radio: [8, 30], espeso: 0.55, atras: 2 },
    bordeFino: true,
  },
  caza: {
    activa: true,
    /** 🦌 PRUEBA: el venado del camino "B" (3D pasado a puntos). En false, vuelve la figura de rectángulos. */
    // (🧪 `bordeFino`: el contorno de un píxel, como el del jugador, en vez del de un punto.)
    dibujoNuevo: { venado: true, berrendo: true, bordeFino: true },
    celda: 1400,
    hasta: 2600,                 // qué tan lejos de ti se pueblan las celdas
    grupo: 90,                   // qué tan desparramado está un grupo
    zonas: {
      llano: { chance: 0.22, berrendo: 3, liebre: 5 },
      lomas: { chance: 0.38, venado: 3, berrendo: 1, liebre: 1, coyote: 1 },
      agua: { chance: 0.38, venado: 4, liebre: 2, coyote: 1 },
    },
    zorro: { chance: 0.08, partes: ['noche', 'madrugada'] },
    animales: {
      // vel ×galope, grupo, vista y oído (distancias), carne, cuero, carnear (s)
      // (Liebre: orejas enormes. Berrendo: la vista más aguda del desierto. Venado: oído fino, ve más el movimiento.
      // Coyote: bueno en todo. Zorro: el mejor oído, y ve de noche. Guanaco: tiene centinela.)
      liebre:   { vel: 0.9, grupo: [1, 1], vista: 160, oido: 320, carne: [1, 1], cuero: 1, carnear: 3, aguante: 0.5, zigzag: true },
      berrendo: { vel: 1.75, grupo: [4, 6], vista: 420, oido: 200, carne: [2, 3], cuero: 3, carnear: 6, aguante: 2, trofeo: 10 },
      venado:   { vel: 1.0, grupo: [2, 3], vista: 200, oido: 300, carne: [3, 4], cuero: 5, carnear: 8, aguante: 2.5 },
      coyote:   { vel: 0.95, grupo: [1, 2], vista: 260, oido: 300, carne: [0, 0], cuero: 2, carnear: 4, aguante: 1, veDeNoche: 0.85 },
      zorro:    { vel: 0.8, grupo: [1, 1], vista: 220, oido: 380, carne: [0, 0], cuero: 14, carnear: 4, aguante: 0.7, zigzag: true, veDeNoche: 0.9 },
      guanaco:  { vel: 0.85, grupo: [4, 5], vista: 340, oido: 220, carne: [4, 5], cuero: 20, carnear: 9, aguante: 3 },
    },
    /** El berrendo curioso: quieto `quieto` s, los que están a menos de `radio` se acercan despacio hasta `hasta`. */
    // (🔁 Se acercaba a 0,12 del galope: de 600 a 130 tardaba casi medio minuto.)
    /**
     * 👂👁️ LOS SENTIDOS *(Santi: "galopando se escucha y se ve muchísimo, al trote menos; a pie ya podés acercarte más,
     * y agachado casi sin ruido, pero todavía pueden verte; entre los arbustos no te ven")*. `como`: cuánto ruido hacés
     * y cuánto se te ve (multiplican el oído y la vista de cada animal). Quieto, se ve mucho menos: la vista agarra el
     * movimiento. Metido en un arbusto no te ve nadie; agachado detrás de una roca o un arbusto, tampoco el que está del
     * otro lado (`tapan`, a cuánto de vos tiene que estar). `noche`: la vista de noche (salvo `veDeNoche`).
     * `alerta`: los segundos que tarda en decidirse a huir desde que te nota; `calma`, en olvidarse; más cerca que
     * `sinAviso` de su alcance, huye sin avisar. `huye`: los segundos que huye; `grupo`: a cuánto se lleva a los suyos.
     */
    sentidos: {
      como: {
        galope: { ruido: 1, vista: 1 },
        trote: { ruido: 0.55, vista: 0.8 },
        montadoQuieto: { ruido: 0, vista: 0.6 },
        aPie: { ruido: 0.3, vista: 0.55 },
        aPieQuieto: { ruido: 0, vista: 0.3 },
        agachado: { ruido: 0.08, vista: 0.35 },
        agachadoQuieto: { ruido: 0, vista: 0.15 },
      },
      tapan: 40,
      noche: 0.5,
      alerta: 1.2,
      calma: 2.5,
      sinAviso: 0.5,
      huye: 4,
      grupo: 160,
    },
    curiosidad: { quieto: 3, radio: 700, hasta: 130, vel: 0.25, asusta: 80 },
    coyote: { llega: 35, come: 20, espanta: 380 },
    guanacos: { x: 44, y: 126, radio: 160, cuantos: 5, nace: 4 },
    carga: { carne: 10, cueros: 4 },
    rapidezCarnear: 4,
    espantaTiro: 600,
    /**
     * 🎯🩸 LOS BALAZOS *(Santi: "un disparo a la cabeza los abate al instante al igual que cerca del corazón, un tiro en
     * las otras zonas lo deja sangrando [...] con revólveres el tiro es más débil y con armas grandes más fuerte")*. La
     * fuerza es la del arma en el asalto (Colt 1, Winchester 1,4, cada perdigón 0,5), y baja con la distancia como allá.
     * Se multiplica por la zona (`zonas`); si llega al `aguante` del animal, cae en el acto. Si no, queda herido: corre más
     * lento (hasta `lentoMin` de su velocidad), deja una gota cada `gotaCada` unidades (duran `gotaDura` s, una parte del
     * día) y se desangra: cae a los `sangra` × aguante / herida segundos (un venado con un Colt al cuerpo, a los 62 s).
     * Cada tiro que no es a la cabeza le saca `cueroAgujero` al precio del cuero. `montadoQuieto`: la dispersión arriba
     * del caballo frenado (andando, la de la huida). `reaccion`: los segundos que tardan en asustarse con el estampido.
     */
    tiros: {
      zonas: { cabeza: 4, corazon: 3, cuerpo: 1 },
      lentoMin: 0.5,
      sangra: 25,
      gotaCada: 10,
      gotaDura: 180,
      cueroAgujero: 0.25,
      montadoQuieto: 1.5,
      reaccion: 0.3,             // lo que tardan en asustarse con el estampido: la bala llega antes
    },
  },
};
