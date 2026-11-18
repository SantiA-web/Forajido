/**
 * ✉️ EL ENCARGO DE J.Mc. (etapa 2 de la carta) *(Santi: "en 10 días paso por el campamento en la noche, me tienes
 * que dar tanto dinero y un objeto que se tiene que encontrar en el tren de carga")*.
 *
 * - `dinero` y `dias`: lo que pide y en cuánto pasa. 🔁 *(Santi: "para probar todo eso demás, quiero que pongas 800
 *   dolares y cambialo a 15 días")*. Antes había propuesto 500 y 10: estos son para probar.
 * - Si no cumplís, otra carta con el mismo pedido y otros `dias` de plazo, contados desde que la leés.
 *
 * Está aparte (sin imports) porque lo usan los textos (text/es.js), los momentos y el tren.
 * Cómo funciona, en data/momentos.js (`revisarEncargo`) y world/train.js (el maletín escondido).
 */
export const ENCARGO = { dinero: 800, dias: 15 };
