/**
 * 📒 LA LIBRETA Y LA LEALTAD DE 0 A 5 — LOS NÚMEROS *(BANDA-NUEVA.md, "La lealtad (0 a 5)", "La libreta" y "El ánimo y
 * el plan"; Santi aprobó todas las recomendaciones el 2026-11-17 y pidió "andá con la etapa 2")*.
 *
 * Reemplaza al humor de 1 a 100 y a la lealtad de 0 a 10: el humor era un número que no se veía y el jugador no sabía
 * por qué alguien se enojaba. Ahora cada uno anota lo que le hiciste ("Me diste poco", "Pagaste mi fianza"), y eso es
 * lo que se ve.
 *  - **La libreta**: como mucho `max` favores y `max` quejas; la más vieja se cae. Cada línea dura `dias` días.
 *  - **La lealtad (0 a 5)**: cada noche, si tiene `diferencia` quejas más que favores pierde una marca; si tiene
 *    `diferencia` favores más que quejas, gana una (el Frío necesita `diferenciaFrio`). Cuando se mueve una marca, la
 *    libreta se limpia. Nunca más de una marca por noche.
 *  - **El ánimo** sale de la libreta: más favores, con ganas (+1 paso en el plan); más quejas, de malas (−1); de malas
 *    con la lealtad en 1 o 0, furioso (se niega a todo). Acaba de ganar o perder una marca: con ganas o de malas por
 *    `marcaAnimoDias` días.
 *
 * Las reglas están en systems/libreta.js. Los mismos números que el simulador (simulador/banda3.js, `N.libreta` y
 * `N.lealtad`). ⚠️ Cualquier cambio acá se mide primero en el simulador.
 */

export const LIBRETA = {
  /** 🔑 La llave: con false, el juego vuelve al humor de 1 a 100 y la lealtad de 0 a 10 de antes. */
  activa: true,
  max: 3,
  dias: 5,
  diferencia: 2,
  diferenciaFrio: 3,
  /** Después de ganar (o perder) una marca, anda con ganas (o de malas) estos días: más o menos hasta el próximo golpe. */
  marcaAnimoDias: 3,
  /** Con pronóstico +2 lo tenía fácil: "Salió bien" sólo cuenta como favor 1 de cada 2 veces. */
  salioBienEn2: 0.5,
  /** Nadie cuenta más de esto de una sola cosa (una queja doble son dos líneas). */
  vecesMax: 2,
};

/**
 * 🤝 LA LEALTAD, DE 0 A 5, en palabras (lo que ve el jugador y cómo le habla cada uno). Cómo arranca cada uno: los del
 * simulador.
 */
export const LEALTAD5 = {
  max: 5,
  inicial: { tommy: 4, frank: 3, santiago: 3 },
  // De mayor a menor: la primera cuyo `desde` alcanza. (1 o 0 es "a punto de irse": −1 paso en el plan.)
  palabras: [
    { desde: 4, id: 'firme' },
    { desde: 3, id: 'conforme' },
    { desde: 2, id: 'dudoso' },
    { desde: 0, id: 'aPuntoDeIrse' },
  ],
  /** Con la lealtad en esto o menos: −1 paso en el plan, y de malas pasa a furioso. */
  baja: 1,
};

/**
 * 🙅 "NO QUIERE IR DE…" *(BANDA-NUEVA.md, "El ánimo y el plan")*: a ese papel sólo va con ganas; tranquilo o de malas,
 * se niega, y el plan lo dice al asignar. Mientras la personalidad se le nota (marca fuerte).
 */
export const NO_QUIERE = {
  egoista: ['pasajero'],
  cobarde: ['pasajero', 'vigia'],
  pendenciero: ['caballos'],
  valiente: ['vigia'],
  divertido: ['telegrafo'],
};

/**
 * 📝 LO QUE ANOTA CADA COSA QUE PASA (los eventos que ya usaba el juego, de `ANIMO.eventos` en data/rasgos.js):
 * `f` favor, `q` queja, `chica` (una queja que no es por algo que hiciste tú: "me hirieron"), `veces` (doble = 2),
 * `borra` (la botella del Alcohólico: borra una queja suya). Lo que no está acá no anota nada.
 * Los textos de cada motivo, en text/es.js (`T.libreta.motivos`).
 */
export const EVENTOS_LIBRETA = {
  pedidoSi: { lado: 'f' },
  pedidoNo: { lado: 'q' },
  peleaGana: { lado: 'f' },
  peleaPierde: { lado: 'q', veces: 2 },
  repartoParejo: { lado: 'f' },
  repartoGuardo: { lado: 'q', veces: 2 },
  herido: { lado: 'q', chica: true },
  dejadoAtras: { lado: 'q', veces: 2 },
  abandonado: { lado: 'q' },
  fianza: { lado: 'f' },
  civilesHonorable: { lado: 'q' },
  civilesSentimental: { lado: 'q' },
  adelanteCumplido: { lado: 'f' },
  botella: { borra: true },
  salioBien: { lado: 'f' },
};
