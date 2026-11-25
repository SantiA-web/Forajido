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
   * EL TIEMPO PASA MIENTRAS CABALGÁS: cada tantos segundos de verdad, una parte del día. Con el mundo de 9 minutos,
   * cruzarlo al trote son unas 5 partes (más de un día); a galope, la mitad (pero el caballo no aguanta).
   */
  segundosPorParte: 180,

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
    /** Qué tan ancho es un arroyo y un camino de carretas (de verdad). Los ríos, con su ancho del plano por esto. */
    anchoArroyo: 90, anchoCamino: 28, rio: 0.35,
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
