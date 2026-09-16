/**
 * LA GENTE, PARTE 5: los caídos.
 *
 * Tirado boca arriba, con el sombrero volado al lado —que es lo que dice quién
 * era— y los brazos y las piernas abiertos. Va con el piso: nunca tapa a nadie.
 *
 * Mide unos 80 puntos de largo por 44 de alto, o sea lo mismo que mide la
 * persona parada, pero acostada. El dibujo viejo era de la época de las
 * siluetas y al lado de la gente nueva parecía un muñequito.
 */
import {
  ROPA, tono,
  PIEL, PIEL_S, PIEL_O, PELO, BOTA, BOTA_L, CINTO, CAM, CAM_S, BLANCA, PAN_R, HAT, CAP,
} from './dibujo.js';

/** El centro del cuerpo, en el dibujo. */
export const TENDIDO = { ancho: 104, alto: 52, cx: 52, cy: 30 };

export function tendido(L, o = {}) {
  const R = ROPA[o.tipo] || ROPA.guardia;
  const [C0, CL, CS] = R.chal;
  const [M0, , MS] = R.manga;
  const PT = R.pant;
  const late = o.late ? 1 : 0;          // el desmayado respira

  // El sombrero volado, al lado de la cabeza: se ve DESDE ARRIBA, como un
  // plato con su copa. Es lo que dice quién era el que está tirado ahí.
  const hc = R.sombrero === 'kepi' ? CAP : R.sombrero === 'bombin' || R.sombrero === 'galera' ? '#3a302a' : HAT;
  const ala = R.sombrero === 'kepi' ? 7 : R.sombrero === 'ancho' ? 13 : 11;
  L.elipse(9, 30, ala, ala * 0.8, tono(hc, 0.78));
  L.elipse(9, 30, ala - 2, ala * 0.62, hc);
  L.elipse(9, 30, ala - 6, ala * 0.4, tono(hc, 1.25));

  // Las piernas, abiertas.
  const pierna = (y0, y1, c) => {
    L.poly([[56, y0], [78, y1 - 3], [78, y1 + 3], [56, y0 + 7]], c);
  };
  pierna(20, 14, tono(PT, 0.85));
  pierna(26, 36, PT);
  L.poly([[76, 9], [86, 11], [86, 17], [76, 18]], BOTA);
  L.poly([[76, 33], [86, 35], [86, 41], [76, 42]], BOTA);
  L.rect(78, 12, 5, 1, BOTA_L); L.rect(78, 36, 5, 1, BOTA_L);

  // El cuerpo, de espaldas al piso.
  L.poly([[32, 18 + late], [58, 20 + late], [58, 38 + late], [32, 36 + late]], C0);
  L.sobre(32, 18, 27, 21, [C0], CS, 16);
  L.rect(34, 20 + late, 22, 2, CL);
  if (!R.saco) {
    L.poly([[36, 24 + late], [54, 25 + late], [54, 32 + late], [36, 31 + late]], CAM);
    L.rect(38, 26 + late, 16, 1, CAM_S);
  } else if (R.botones) {
    for (const bx of [38, 45, 52]) L.rect(bx, 27 + late, 2, 2, R.botones);
  }
  L.rect(54, 20 + late, 3, 18, CINTO);

  // Los brazos: uno tirado para arriba, el otro cruzado.
  L.poly([[36, 20 + late], [42, 8], [46, 9], [40, 22 + late]], M0);
  L.elipse(43, 7, 3, 3, PIEL);
  L.poly([[38, 34 + late], [48, 40], [50, 44], [38, 38 + late]], MS);
  L.elipse(50, 44, 3, 3, PIEL_S);

  // La cabeza, mirando al cielo.
  L.elipse(24, 28, 8, 7.5, PIEL);
  L.sobre(16, 21, 17, 4, [PIEL], PIEL_O);
  L.elipse(18, 28, 4, 7, PELO);
  if (R.barba) L.sobre(20, 28, 12, 8, [PIEL], R.barba, R.barbaP);
  // Los ojos cerrados: dos rayitas.
  L.rect(24, 25, 4, 1, PIEL_O);
  L.rect(24, 31, 4, 1, PIEL_O);
  L.rect(28, 28, 2, 1, PIEL_S);
  if (R.cuello === 'panuelo') L.rect(31, 24, 3, 8, R.panueloColor || PAN_R);
  else if (R.cuello === 'corbata') L.rect(31, 26, 2, 5, BLANCA);
}
