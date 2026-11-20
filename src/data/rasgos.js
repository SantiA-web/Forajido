/**
 * 🎭 LOS RASGOS Y EL HUMOR *(ver BRUJULA.md, "Rasgos, lealtad y humor"; Santi, 2026-11-15: "es el pilar más grande que
 * sostiene al juego")*.
 *
 * Cada uno de la banda tiene como mínimo una habilidad y una personalidad, y el juego los muestra igual: el jugador no
 * sabe cuál es cuál *(Santi: "dos tipos de rasgos pero disfrazados de lo mismo")*.
 *  - **Habilidades**: sólo ventaja (el que no la tiene, hace eso normal). Suben con la práctica, se pierden sin uso, y
 *    recuperar una perdida es más rápido que aprenderla.
 *  - **Personalidades**: de doble filo, con su opuesto cuando da juego. Cada una es una fuerza (0 a 100) que puede bajar
 *    hasta su piso pero nunca a cero, y nunca cruza al opuesto *(Santi: "jamás haría que una personalidad se pierda por
 *    completo")*.
 *
 * Los nombres que ve el jugador están en text/es.js (`T.rasgos`). Acá van sólo los datos.
 *
 * ⚠️ HOY SÓLO SE VEN EN LA FICHA (scenes/ficha.js): todavía no hacen nada en el juego. Lo que hace cada uno, y todos los
 * números, se equilibran primero en el simulador *(Santi: "quirúrgicamente controlado y equilibrado")*.
 */

/** Las habilidades (sólo ventaja). */
export const HABILIDADES = [
  'punteria', 'riendas', 'cuchillero', 'ganzua', 'manoLigera', 'actor', 'aguante',
  'baraja', 'labia', 'negociante', 'vista', 'rastreador', 'telegrafista', 'cocinero', 'curandero', 'dinamitero', 'leer',
];

/** Las personalidades: de a pares con su opuesto, o solas (`null`) cuando el opuesto no da juego. */
export const PERSONALIDADES = [
  ['valiente', 'cobarde'], ['ambicioso', 'conformista'], ['frio', 'sentimental'], ['egoista', 'generoso'],
  ['honorable', 'rastrero'], ['confiable', 'mentiroso'], ['paciente', 'impulsivo'], ['orgulloso', 'humilde'],
  ['pendenciero', 'pacifico'], ['supersticioso', 'esceptico'], ['divertido', 'serio'],
  ['alcoholico', null], ['vengativo', null], ['curioso', null], ['jugador', null], ['loco', null],
];

const ES_PERSONALIDAD = new Set(PERSONALIDADES.flat().filter(Boolean));
export function esPersonalidad(id) { return ES_PERSONALIDAD.has(id); }

/**
 * 🏷️ LA MARCA DE UNA PERSONALIDAD, EN TRES NIVELES *(Santi: "se pone gris de la mitad para abajo y más blanca cuando
 * llega a lo máximo que puede bajar")*: `fuerte` (su color), `gris` (debajo de `gris`) y `blanca` (en el `piso`, lo más
 * bajo que puede llegar). Las habilidades no se ponen grises: se tienen o no.
 */
export const MARCA = {
  gris: 50,
  // ⚠️ Santi dijo "un 20% o 15%": arranca en 15, y lo mide el simulador.
  piso: 15,
};

export function nivelDeMarca(id, fuerza) {
  if (!esPersonalidad(id)) return 'fuerte';
  if (fuerza <= MARCA.piso) return 'blanca';
  return fuerza < MARCA.gris ? 'gris' : 'fuerte';
}

/**
 * 🙂 EL HUMOR, DE 1 A 100, QUE SE LEE EN PALABRAS *(Santi: "humor en palabras")*. Cambia fuerte de un día para el otro;
 * por mal humor nadie se va, pero se puede negar a un puesto o hacerlo mal. Cada uno tiene su punto de descanso, al que
 * vuelve despacio cuando nada lo mueve. ⚠️ Los cortes y los puntos de descanso son de primer tanteo (los mide el
 * simulador).
 */
export const HUMOR = {
  max: 100,
  // De mayor a menor: la primera cuyo `desde` alcanza.
  palabras: [
    { desde: 70, id: 'contento' },
    { desde: 45, id: 'tranquilo' },
    { desde: 20, id: 'deMalas' },
    { desde: 0, id: 'furioso' },
  ],
  // Santiago, callado y desconfiado; Frank, según la botella; Tommy, entusiasmado.
  descanso: { santiago: 48, frank: 55, tommy: 66 },
};

export function palabraDeHumor(n) {
  return HUMOR.palabras.find((p) => n >= p.desde).id;
}

/**
 * ⚖️ TODOS LOS NÚMEROS DEL ÁNIMO, EN UN SOLO LUGAR *(Santi: "todos los números en un solo archivo"; "quirúrgicamente
 * controlado y equilibrado")*. Las reglas que los usan están en systems/animo.js, y los mide el simulador
 * (simulador/simulador.js), que juega miles de partidas de 30 asaltos con distintos jugadores. ⚠️ Cualquier cambio acá
 * se vuelve a pasar por el simulador antes de jugarlo.
 *
 * "Fuerza" es lo fuerte que es una personalidad (0 a 100): los efectos de cada una se multiplican por fuerza / 100.
 */
export const ANIMO = {
  // ── EL HUMOR ──
  /**
   * 📅 🔁 POR DÍA, NO POR VISITA *(Santi: "medir solo por asaltos sería empobrecer el juego")*. Con el calendario, entre
   * asalto y asalto pasan 2 o 3 días: lo que antes pasaba una vez por visita ahora pasa cada día, con números más chicos
   * para que por asalto rinda lo mismo que antes (la vuelta al descanso, la lealtad, el contagio, el olvido, el
   * divertido). Lo que pasa una vez por asalto (el reparto, los civiles, las heridas) no cambió.
   */
  /** Cada día, la parte del camino de vuelta a su punto de descanso que recorre solo (si nada lo mueve). 🔁 Era 0,25 por visita. */
  vuelta: 0.11,
  /** Lo más que se mueve el humor en un día, sumando todo *(meta de Santi: "hasta 30 puntos con algo fuerte")*. */
  topeDia: 30,
  /** Lo mismo repetido rinde menos: cada vez que pasó en los últimos `ventana` días, rinde `factor` veces lo anterior. */
  repetido: { ventana: 15, factor: 0.5 },
  /** El contagio: cada punto del humor de otro que se aparta de 50 empuja `porPunto`, con un tope por día. */
  contagio: { porPunto: 0.016, tope: 1.2 },

  // ── DEL HUMOR A LA LEALTAD (por día) ── De mayor a menor: el primero cuyo `desde` alcanza.
  aLealtad: [
    { desde: 70, n: 0.05 },
    { desde: 45, n: 0 },
    { desde: 20, n: -0.025 },
    { desde: 0, n: -0.08 },
  ],
  /** "Se va" cuando la lealtad queda debajo de esto dos visitas seguidas (la primera, avisa). */
  seVaDebajoDe: 1,

  // ── CÓMO HACE SU PUESTO SEGÚN EL HUMOR ──
  /** Debajo de `deMalas` el humor es "furioso" y puede negarse; debajo de `malaGana`, lo hace de mala gana; desde `potenciado`, mejor. */
  disposicion: { malaGana: 45, potenciado: 70 },
  /** Lo probable que se niegue, según la palabra de su humor. */
  seNiega: { furioso: 0.5, deMalas: 0.12 },
  /**
   * 🙅 NEGARSE POR QUIÉN ES, NO POR CÓMO LO TRATASTE *(Santi eligió "la B", 2026-11-15)*: algunas personalidades no
   * quieren ciertos puestos, aunque estén contentas. Por puesto, la chance con la personalidad a pleno (se multiplica
   * por su fuerza): el cobarde no quiere ir de pasajero (adentro, entre guardias), el egoísta tampoco (se arriesga él
   * por todos), el honorable a veces no quiere acuchillar gente; el orgulloso no quiere quedarse cuidando caballos.
   * Y según el humor rinde distinto: contento se deja convencer más, de malas menos.
   */
  niegaPorPuesto: {
    pasajero: { cobarde: 0.3, egoista: 0.1, honorable: 0.08 },
    caballos: { orgulloso: 0.25 },
    // 🔭 (BANDA-NUEVA.md) El valiente quiere estar adentro, no mirando de lejos; el cobarde no quiere quedar solo en una loma.
    vigia: { valiente: 0.25, cobarde: 0.3 },
  },
  niegaPorPuestoHumor: { contento: 0.5, tranquilo: 1, deMalas: 1.5, furioso: 2 },
  /** Cuánto cambia la chance de que le salga mal su puesto: de mala gana, peor; potenciado, mejor. */
  malaGanaFalla: 0.15,
  potenciadoFalla: -0.07,

  // ── LAS HABILIDADES ──
  habilidad: {
    /** La gana al llegar a `gana`, y la pierde al bajar de `pierde` (en el medio, sigue como estaba). */
    gana: 60, pierde: 35,
    /**
     * Lo que suma cada vez que la practica, y cuánto rinde según el humor. 🔁 Más cara *(Santi, 2026-11-15: "con humor
     * normal pondría siete usos, contento 5, de malas 13 … que cueste un poco más conseguirlas y que sin usarlas se
     * pierdan más rápido, para que esa habilidad le valga más al jugador y contratar gente en la cantina por
     * habilidades sea más razonable")*. Antes: 12, 1,7 y 0,6 (5, 3 y 9 usos).
     */
    porUso: 9, buenHumor: 1.5, malHumor: 0.53,
    /**
     * Mientras esté por debajo de lo más alto que llegó alguna vez, aprende `recuerda` veces más rápido. 🔁 Recuperarla:
     * de malas 5 usos, tranquilo 3, contento 2 *(Santi, 2026-11-15)*; antes era 2 (3, 2 y 1 usos).
     */
    recuerda: 1.2,
    /**
     * 🎯 PRACTICAR EN EL CAMPAMENTO *(Santi eligió "la A": "en el futuro haría muchas más actividades para distintas
     * habilidades. Estas actividades también pueden hacer que las aprendan, no solo mantenerlas")*. 🔁 Se lleva EL DÍA
     * ENTERO del que practica *(Santi: "el NPC se toma el día completo … en la noche descansa y las otras partes no lo vas
     * a ver en el campamento")*; al jugador no le gasta tiempo. Un día de práctica rinde un tercio de un uso de verdad
     * *(Santi: "vamos con un tercio"; "mandar a alguien a un asalto sube más que una practica de un día")*.
     */
    practica: 1 / 3,
    /**
     * Días sin usarla antes de que empiece a olvidarla, y cuánto pierde por día después. 🔁 Se pierde a los 20 días
     * con humor normal *(Santi: "20 días me parece mejor")*; antes, 38.
     */
    gracia: 4, olvido: 3,
    /** Lo que mueve el humor ganarla, recuperarla o perderla. */
    humorGana: 10, humorPierde: -8,
    /**
     * ⭐ LA ESTRELLITA *(Santi eligió "la C", 2026-11-15)*: después de ganarla sigue subiendo, pero arriba de `gana` rinde
     * `arriba` (lo difícil no es aprender, es dominar). Al llegar a `estrella` la domina: no se olvida nunca más, hasta
     * el final de la partida *(Santi: "ya no se pierde nunca más … literalmente")*. 🔁 Un tercio, no la mitad *(Santi:
     * "hacé las dos")*: con la mitad, al que cuida a la banda le salían 4 o 5 estrellitas por partida.
     */
    arriba: 1 / 3, estrella: 100,

    /**
     * 🔁 ●●●●● LAS MARCAS *(BANDA-NUEVA.md, "Las habilidades"; Santi aprobó todo lo recomendado, 2026-11-18)*: reemplazan
     * al número de 0 a 100 de arriba (que queda para la llave apagada). Se tiene o no se tiene, y se ve con `total`
     * marcas. Usarla en un golpe o en una tarea da `uso`; practicar un día, `practica` (y `conGanas` más si está con
     * ganas). La tiene recién con `total`; cada `oxidaCada` días sin usarla pierde una marca (con aviso), y con menos de
     * `pierdeDebajo` ya no la tiene. Recuperarla va `recuperar` veces más rápido mientras no haya bajado de 2.
     * `noOxidan`: se tienen o no, no hay cómo practicarlas a voluntad.
     * ⭐ LA ESTRELLITA *(Santi: "es muy importante que midás lo de la estrellita")*: con la habilidad ya tenida,
     * `estrella` golpes usándola la dominan y no se oxida nunca más. Sólo cuentan los golpes: contando las tareas, las
     * que se usan todos los días (cazar, bajar al pueblo) la sacaban enseguida, unas 6 por partida. Medido (simulador
     * banda3.js v12, `estrellaGolpe`): con 8 golpes, 2,7 estrellitas por partida; con 12, 2,0; con 6, 2,9. No cambia la
     * plata ni a cuántos perdés: es un premio, no una ventaja.
     */
    marcas: {
      /** 🔑 La llave: con false, vuelve el número de 0 a 100. */
      activo: true,
      total: 5, pierdeDebajo: 3, uso: 1, practica: 0.5, conGanas: 0.5, oxidaCada: 6, recuperar: 2, estrella: 8,
      noOxidan: ['aguante', 'leer'],
    },
  },

  // ── LAS PERSONALIDADES ──
  personalidad: {
    /** Cuánto baja cada vez que se la contradice con esfuerzo (por ejemplo, sacarle la botella al alcohólico). */
    contra: 5,
    /** Cuánto sube cada vez que se la alimenta (darle la botella). */
    aFavor: 1.5,
  },
  /** El frío mueve su lealtad menos (por `frio`), el sentimental más. */
  frio: 0.7, sentimental: 1.5,
  /** Al serio el humor se le mueve la mitad, para los dos lados. */
  serio: 0.5,
  /** El divertido: los días que aguanta sin una actividad, lo que le baja cada día de más, lo que le sube una actividad y lo que contagia. */
  divertido: { aguanta: 5, castigo: 2.4, actividad: 12, contagia: 4 },

  /**
   * 🗞️ LOS RUMORES QUE TRAE LA BANDA (BRUJULA, "De dónde salen los rumores de carga"): en cada visita nueva, cada uno
   * tira por su cuenta. `base`: la chance de cualquiera (bajan al pueblo). Lo demás es lo que suma cada rasgo: una
   * personalidad, multiplicado por su fuerza sobre 100; una habilidad, entera si la tiene hoy (🔁 como en todo el juego:
   * una habilidad se tiene o no; el número es cuánto le falta para perderla o para la estrellita). `mentiroso`: la parte
   * de lo que cuenta el mentiroso que es inventado. *(Santi: "al alcohólico ponle 20%, a lo mismo que bueno en la
   * baraja"; "subí más al curioso y también a labia"; "dejá labia al 40%")*. 🔁 Todo a la mitad, y uno por visita como
   * mucho *(Santi: "los avisos de trenes encontrados aparecen muy frecuentemente"; eligió "todo a la mitad + uno por
   * visita")*: con la banda de hoy, hay rumor en ~45% de las visitas (antes ~76%, y a veces dos).
   */
  rumores: { base: 5, alcoholico: 10, baraja: 10, labia: 20, curioso: 25, mentiroso: 0.5 },

  // ── LO QUE MUEVE CADA COSA QUE PASA *(Santi: "la historia", "las habilidades" y "hacerle caso a sus rasgos")* ──
  eventos: {
    /** El reparto: parejo sube a todos; quedártelo baja a todos. El ambicioso y el egoísta lo sienten más, el conformista menos. */
    repartoParejo: { humor: 10 },
    repartoGuardo: { humor: -10, lealtad: -0.1 },
    reparto: { ambicioso: 0.6, egoista: 0.3, conformista: -0.5 },
    /** Alguien te pide algo (un momento del campamento): dárselo o no. */
    pedidoSi: { humor: 12, lealtad: 0.3 },
    pedidoNo: { humor: -8, lealtad: -0.15 },
    /** Dos se pelean y das la razón a uno. */
    peleaGana: { humor: 10, lealtad: 0.3 },
    peleaPierde: { humor: -12, lealtad: -0.4 },
    /** El asalto salió mal (a todos), lo hirieron, o lo dejaste atrás. */
    asaltoMal: { humor: -6 },
    herido: { humor: -15 },
    dejadoAtras: { humor: -25, lealtad: -1 },
    /** 🐎 Se separó en la huida ([F]) y lo dejaste solo con los suyos: la mitad de dejarlo atrás *(Santi: "se enojará porque lo abandonaste")*. */
    abandonado: { humor: -12.5, lealtad: -0.5 },
    /** Volvió de la cárcel por la fianza: enojado por haber quedado varado. */
    fianza: { humor: -10, lealtad: -0.3 },
    /** Mataste civiles: al honorable le pega fuerte, al sentimental algo, al resto apenas. */
    civilesHonorable: { humor: -20, lealtad: -0.4 },
    civilesSentimental: { humor: -10 },
    civilesResto: { humor: -3 },
    /** La botella al alcohólico (la alimenta), o sacársela (la contradice). */
    botella: { humor: 15 },
    sacarBotella: { humor: -10, lealtad: -0.2 },
    /** 🗣️ La mano de cartas con Frank (además de lo que le sube por Divertido): si gana, contento; si pierde, un poco menos. */
    manoGana: { humor: 5 },
    manoPierde: { humor: -5 },
    /** 🗣️ Tommy pidió ir adelante y lo mandaste de pasajero: contento aunque le vaya mal. */
    adelanteCumplido: { humor: 15, lealtad: 0.3 },
    /** Una carta o una noticia de su historia: entre `min` y `max` puntos, para arriba o para abajo. */
    carta: { min: 15, max: 30 },
  },
};

/**
 * LOS RASGOS DE LA BANDA AL EMPEZAR *(Santi: "Tommy: Honorable, Valiente, Veloz en las riendas. Frank: Alcohólico,
 * Confiable, Bueno en la baraja. Santiago: Frío, Egoísta, Buena puntería")*, en ese orden (el de la ficha). El número
 * es la fuerza; en las habilidades, cuánto la domina. ⚠️ Fuerzas de primer tanteo.
 */
export const RASGOS_DE = {
  // (🔁 Las habilidades con que empiezan, en 65 *(Santi: "bajá la habilidad de Santiago y el resto a 65")*: así la
  //  estrellita les cuesta unos 7 asaltos usándola, y no la tienen en la primera semana.)
  // (🗣️ Y uno más a cada uno, de los que ya funcionaban por dentro *(Santi aprobó VOCES.md: "Las voces de la brujula
  //  están bien")*: Santiago Serio, Frank Divertido, Tommy Sentimental. ⚠️ Fuerzas de primer tanteo, medidas con el
  //  simulador.)
  tommy: { honorable: 80, valiente: 75, riendas: 65, sentimental: 40 },
  // (El 80 del alcohólico es el ejemplo de Santi: "80% de que hoy Frank toma alcohol".)
  frank: { alcoholico: 80, confiable: 75, baraja: 65, divertido: 70 },
  // (🗞️ Y Labia *(Santi: "ponele Labia a Santiago")*: trae rumores, ver `ANIMO.rumores`.)
  santiago: { frio: 80, egoista: 70, punteria: 65, labia: 65, serio: 60 },
};
