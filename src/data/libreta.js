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

/**
 * 💰 EL REPARTO, POR CABEZA *(BANDA-NUEVA.md, "El reparto: por cabeza"; Santi, 2026-11-18: "quiero que la codicia pague
 * en este juego al largo plazo y premie al que cuida de los suyos"; me pidió elegir la paga con datos)*.
 *  - Cada uno espera su parte del botín: `va` el que fue a un papel, `ambicioso` el Ambicioso que fue, `queda` el que
 *    se quedó. Lo que no repartes es tuyo.
 *  - Menos de lo que espera: queja ("Me diste poco"). Nada, y fue: queja doble. Un cuarto más (`generoso`) o más:
 *    favor ("Fuiste generoso"); pero después de `acostumbra` generosos seguidos ya lo espera: no es favor, y darle lo
 *    normal es queja ("Ya no me das como antes").
 *  - `paso`: de a cuánto se ajusta en la pantalla.
 * Medido en el simulador (v11): el que cuida termina con $1673, el que cambia la banda por contratados con $665.
 */
export const REPARTO = {
  /** 🔑 La llave: con false vuelven los momentos de antes ("la pelea por el reparto" y "¿y nuestra parte?"). */
  activo: true,
  va: 0.12,
  ambicioso: 0.18,
  queda: 0.05,
  generoso: 1.25,
  acostumbra: 2,
  paso: 5,
  /**
   * 🔁 UNA MISERIA *(Santi, 2026-11-18: "es lo mismo darle a alguien en el reparto 5 dólares a darles apenas un poco
   * menos")*: al que fue, darle menos de esto de lo que espera es queja doble, como no darle nada. Para arriba no hay
   * escalón: darle de más es un solo favor, des un poco o todo *(Santi: "el dinero no debería comprar la lealtad")*.
   * Medido (simulador, `reparto.miseria`): con 1/2 no cambia nada; con 2/3, el que cuida queda igual y el tacaño que
   * da la mitad pierde a los tres casi siempre (95 → 100 de cada 100) y termina con $140 en vez de $262. (0 = sin
   * este escalón.)
   */
  miseria: 2 / 3,
};

/**
 * 🍲 LA OLLA *(BANDA-NUEVA.md, "La plata y la presión")*: cada día que empieza se paga la comida de la banda, `dia`
 * por cada uno de los que están en el campamento (`diaMontana` en la montaña: desde el golpe `montanaDesde`, como en el
 * simulador; el juego todavía no tiene los tramos del viaje). Si no alcanza, ese día no se paga nada y cada uno anota
 * una queja chica ("No hubo para la olla"); una sola a la vez: mientras le dure esa línea, no anota otra.
 * (Cazar, que cubre el día, es de la etapa 3.) Los mismos números que el simulador (`ollaDia`, `ollaDiaMontana`).
 */
export const OLLA = {
  /** 🔑 La llave: con false, la comida no cuesta. */
  activa: true,
  /**
   * 🔁 James también come *(Santi, 2026-11-18: "si es 8 por cabeza y son 4 por qué dice pagar 15?")*: cuenta como
   * uno más. Medido (simulador, `ollaJames`): el que cuida a la banda termina con $1640 en vez de $1665 y pierde a los
   * mismos; el tacaño, $262 en vez de $396.
   */
  james: true,
  dia: 5,
  diaMontana: 8,
  montanaDesde: 25,
};

/**
 * ✉️ J.Mc. EN CUOTAS *(BANDA-NUEVA.md, "La plata y la presión"; Santi, 2026-11-18: "Hasta romper con él")*: de cada
 * golpe del que vuelves se lleva `porGolpe` de tu bolsa, después del reparto. Si no alcanza, lo que falta queda como
 * deuda, y se cobra primero del golpe siguiente (antes del reparto). Entregarle el maletín la noche de la carta le paga
 * la deuda. Cobra desde que leíste su primera carta hasta que rompas con él (`campamento.jmc.roto`: lo pone la etapa
 * 5, con las promesas rotas).
 * 🔁 Reemplaza a los $800 de la carta (`ENCARGO.dinero`, que eran para probar): en 15 días entran unos 4 golpes,
 * 4 × $200 = $800, la misma plata en cuotas. La carta sigue pidiendo el maletín.
 * Medido en el simulador (`jmc`): con los $200, el que cuida termina con $1665 y el tacaño con $396; sin ellos, $7263 y
 * $5466: todos ricos, y la codicia casi no cuesta.
 */
export const JMC = {
  /** 🔑 La llave: con false, la carta vuelve a pedir los $800 de una (`ENCARGO.dinero`) y no hay cuotas. */
  activo: true,
  porGolpe: 200,
};
