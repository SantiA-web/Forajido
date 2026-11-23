/**
 * 📋 LAS TAREAS DEL CALENDARIO — LOS NÚMEROS *(BANDA-NUEVA.md, "Las tareas del día"; Santi, 2026-11-18: "seguí con las
 * tareas del calendario")*. Las reglas, en systems/pizarra.js (dónde va cada una) y systems/tareas.js (qué hace). La
 * caza y la pesca tienen los suyos en data/comida.js. Salen del simulador (simulador/banda3.js v15), salvo vender, que
 * en el juego es distinto (ver `vender`).
 *
 * Qué ocupa cada una:
 *  - **Practicar** y **mirar un tren**: la mañana y la tarde.
 *  - **Cazar**: la mañana. Los que salen a cazar la misma mañana van juntos (una sola presa).
 *  - **Pescar**: dos días; sale a la mañana y vuelve a la noche del día siguiente.
 *  - **Bajar al pueblo**, **vender lo robado**, **curar**: una parte (la mañana o la tarde). En la montaña, el pueblo
 *    queda lejos: bajar ocupa la mañana y la tarde.
 *  - **Cartas en la cantina**, **cocinar**: la noche.
 */
/**
 * 🗞️ DE DÓNDE VIENE CADA RUMOR Y CUÁNTO CONFIAR (BANDA-NUEVA.md, "Los rumores: de dónde vienen y cuánto confiar"; etapa
 * 3, parte 4): cuántas de cada 100 veces es cierto, según de dónde salió. El tren lo recuerda (`tren.de`) y el mapa y el
 * calendario lo dicen. Mirar el tren lo confirma o lo desmiente.
 *  - `cantina`: lo trajo uno de la banda que bajó al pueblo.
 *  - `dudoso`: lo trajo el Mentiroso (sale "dudoso": la mitad se lo inventa).
 *  - `forastero`: el forastero herido del campamento.
 *  - `papeles`: la hoja de ruta del encargado, que te llevas de un asalto. Siempre cierto.
 * (El diario no entra: trae pistas sin anotar en el horario, *Santi: "que sean pistas, no algo muy explícito"*. El
 * telégrafo y los papeles que lee el que Sabe leer llegan con los contratados, etapa 6.)
 */
export const RUMORES = { cantina: 75, dudoso: 50, forastero: 50, papeles: 100 };

export const TAREAS = {
  /**
   * 🗞️ BAJAR AL PUEBLO. Uno solo de la banda por día. Al elegirlo se dice para qué va *(Santi: "Al elegirlo, para qué
   * va")*:
   *  - **a buscar rumores**: trae uno de la cantina `base` de cada 100, más lo que suma cada rasgo (las personalidades
   *    por su fuerza; las habilidades enteras si las tiene). Al Mentiroso le rinde la mitad y la mitad de lo que trae es
   *    inventado (`mentiroso`). El Pendenciero se agarra a trompadas: tu recompensa sube `pendenciero` (según su fuerza).
   *  - **a comprar comida**: con tu plata, completa la despensa para `comidaDias` días (con los packs del almacén).
   * `montana`: allá bajar ocupa la mañana y la tarde.
   */
  pueblo: {
    base: 20, labia: 20, baraja: 10, alcoholico: 10, curioso: 25, mentiroso: 0.5,
    pendenciero: 30,
    comidaDias: 3,
    montana: true,
  },

  /**
   * 🃏 CARTAS EN LA CANTINA, de noche, una vez entre golpe y golpe. Con **Bueno con la baraja** gana `gana` dos de cada
   * tres veces (y pierde lo mismo la otra); sin ella, al revés. Una de cada seis se arma una pelea: tu recompensa sube
   * `recompensaPelea`.
   */
  cartas: { gana: 30, conBaraja: 2 / 3, sinBaraja: 1 / 3, pelea: 1 / 6, recompensaPelea: 30 },

  /** 🩹 CURAR (sólo el Curandero): al herido que más le falta, `dias` días menos. */
  curar: { dias: 3 },

  /**
   * 🍲 COCINAR (sólo el Cocinero), de noche: sala lo que se cazó ese día (dura `COMIDA.caza.sala` veces más), y si
   * sales al golpe esa noche o al día siguiente, James entra con `tiros` tiro más de vida.
   */
  cocinar: { tiros: 1 },

  /**
   * 💰 VENDER LO ROBADO, uno de la banda al perista *(Santi: "tenemos que buscar algún posible plus, algo que no pase
   * siempre pero que sea probable de que al mandar a uno pase para que el jugador o vaya él o se arriesgue. Igual hay
   * que tener en cuenta que entre menos honor tenga el jugador menos le paga el perista, entonces ahí ya hay una buena
   * ventaja para los NPCs"; eligió "Regatea: 1 de 3, +30%")*:
   *  - Cobra lo que vale la mercadería (con lo de limpio, como tú), **sin tu honor** ni para bien ni para mal.
   *  - **Regatea**: `regatea` de cada 100 veces consigue `mas` más; con **Buen negociante**, `negociante` de cada 100.
   *    En promedio, +10% (el negociante +20%). Tú cobras entre −20% y +20% según tu honor: con honor de 40 o más,
   *    conviene ir tú.
   *  - El **Rastrero**, `rastrero` de cada 100 (por su fuerza), se guarda `guarda` de lo que cobró.
   */
  vender: { regatea: 33, negociante: 67, mas: 0.3, rastrero: 25, guarda: 0.25 },
};
