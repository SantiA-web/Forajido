/**
 * LOS INTERIORES DEL PUEBLO — las cuatro puertas, por dentro.
 *
 * Hasta ahora entrar a la armería era un cartel de texto. Ahora es un lugar
 * con un mostrador, rifles colgados y un tipo detrás. La diferencia no es
 * decorativa: **un lugar se recuerda y un cartel se lee una vez.** Es la misma
 * apuesta que ya se hizo con el campamento y con el pueblo, y por la que
 * ninguno de los dos es un menú.
 *
 * QUÉ ABRE Y QUÉ NO (decidido con Santi):
 *
 *   establo · armería   → SÓLO DE DÍA. Son negocios; cierran.
 *   cantina · sheriff   → siempre. Uno porque de noche es cuando se llena, y
 *                          el otro porque la ley no duerme.
 *
 * NINGUNO VENDE NADA TODAVÍA, y es a propósito (mismo criterio que el pueblo:
 * primero el lugar, después las transacciones). Pero cada cosa contesta con lo
 * que HOY sí se puede saber, porque un objeto mudo enseña a ignorarlo.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * HAY UNA PARED, Y ESA ES LA CORRECCIÓN GRANDE DE ESTA VUELTA.
 *
 * La primera versión no tenía: TODO se dibujaba sobre el mismo plano del
 * piso. El estante de armas, la cartelera de "se busca" y las lámparas
 * quedaban tiradas en el suelo junto con los muebles, y de ahí salían dos
 * problemas que Santi encontró jugando y que parecían distintos pero eran el
 * mismo:
 *
 *   · "todavía atravieso las carteleras"  → estaban en zona caminable
 *   · "las lámparas parecen puestas en el piso" → lo estaban
 *
 * Marcarlas sólidas habría sido otro parche. Lo que faltaba era la estructura:
 * ahora el cuarto tiene una **franja de pared** (`PARED_ALTO`) arriba del piso
 * caminable. Lo que va colgado se dibuja ahí, FUERA del área por la que se
 * camina, así que no hace falta ninguna colisión — no se puede atravesar algo
 * a lo que no se puede llegar. Es la misma lógica por la que el vacío afuera
 * del tren no necesita una pared: no hay a dónde ir.
 *
 * `sala` es SÓLO el piso caminable. Lo de la pared va en `pared: true` y sus
 * coordenadas caen arriba de `sala.y`.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Cada mueble del piso lleva `solido` cuando hay que rodearlo, con una de
 * dos formas: `w`/`h` desde la esquina (mostradores, pesebres) o `hw`/`hh`
 * desde el centro (sillas, barriles, fardos). Que no se pueda caminar a
 * través de la barra es lo que hace que el cuarto sea un cuarto.
 */

import { CONFIG } from './config.js';

/**
 * TODOS LOS NÚMEROS DE ESTE ARCHIVO SON DE LA PANTALLA VIEJA (384×216), y se
 * estiran en proporción a la de hoy: la sala, la pared y la puerta acá mismo,
 * y los muebles y los puntos al final (`estirarInteriores`). Los cuartos se
 * acomodaron MIRÁNDOLOS en esa pantalla; reescribirlos a mano en otra escala
 * perdería ese ajuste.
 */
const KX = CONFIG.view.width / CONFIG.vistaVieja.width;
const KY = CONFIG.view.height / CONFIG.vistaVieja.height;

/** El piso caminable, igual en los cuatro. */
const SALA = { x: Math.round(44 * KX), y: Math.round(78 * KY), w: Math.round(296 * KX), h: Math.round(108 * KY) };

/** Y la franja de pared que va justo encima. Acá se cuelgan las cosas. */
export const PARED_ALTO = Math.round(38 * KY);

const PUERTA = { x: Math.round(192 * KX), y: Math.round(180 * KY) };

export const INTERIORES = {
  // --------------------------------------------------------------- armería
  armeria: {
    nombre: 'ARMERÍA',
    soloDeDia: true,
    sala: SALA,
    puerta: PUERTA,
    muebles: [
      // --- Colgado de la pared (no se puede llegar caminando) ---
      { tipo: 'estanteArmas', pared: true, x: 90, y: 46, w: 200, h: 26 },
      { tipo: 'trofeo', pared: true, x: 320, y: 58 },

      // --- En el piso ---
      // La alfombra va primero: se dibuja debajo de todo lo demás.
      { tipo: 'alfombra', x: 192, y: 152, w: 140, h: 26 },
      { tipo: 'mostrador', x: 100, y: 108, w: 184, h: 16, solido: true },
      { tipo: 'barril', x: 62, y: 152, solido: true, hw: 7, hh: 9 },
      { tipo: 'barril', x: 322, y: 150, solido: true, hw: 7, hh: 9 },
      { tipo: 'cajon', x: 314, y: 104, solido: true, hw: 8, hh: 6 },

      // Las lámparas van ÚLTIMAS a propósito: así su luz cae sobre los
      // muebles en vez de quedar tapada por ellos. La luz ilumina las cosas.
      { tipo: 'lampara', pared: true, x: 64, y: 54 },
    ],
    puntos: [
      /**
       * El alcance es grande a propósito: al armero se le habla POR ENCIMA
       * del mostrador, que es sólido. Con un alcance corto habría que
       * rodearlo, y nadie salta detrás del mostrador de una armería para
       * preguntar un precio.
       */
      /**
       * `dialogo` es lo que separa a un vendedor de un vecino: en vez de
       * soltar una frase, te pregunta qué querés. Hoy tiene una sola opción
       * de verdad; agregar munición o reparar un arma es agregar un renglón.
       */
      {
        id: 'armero', tipo: 'persona', x: 192, y: 94, alcance: 48,
        dialogo: [
          { id: 'verArmas', tienda: 'armeria' },
          { id: 'verAcero', tienda: 'armeriaCuerpo' },
          { id: 'nada' },
        ],
      },
      // Y al mostrador se lo puede mirar sin hablar con nadie: lleva derecho
      // a la misma vidriera.
      { id: 'mostradorArmas', tipo: 'mueble', x: 140, y: 126, alcance: 24, tienda: 'armeria' },
    ],
  },

  // --------------------------------------------------------------- establo
  establo: {
    nombre: 'ESTABLO',
    soloDeDia: true,
    sala: SALA,
    puerta: PUERTA,
    muebles: [
      { tipo: 'herramientas', pared: true, x: 72, y: 58 },

      { tipo: 'pesebre', x: 66, y: 84, w: 76, h: 48, caballo: true, solido: true },
      { tipo: 'pesebre', x: 154, y: 84, w: 76, h: 48, caballo: true, solido: true },
      { tipo: 'pesebre', x: 242, y: 84, w: 76, h: 48, caballo: false, solido: true },
      { tipo: 'abrevadero', x: 300, y: 152, w: 62, h: 16, solido: true, hw: 31, hh: 8 },
      { tipo: 'fardo', x: 70, y: 158, solido: true, hw: 8, hh: 5 },
      { tipo: 'fardo', x: 94, y: 170, solido: true, hw: 8, hh: 5 },
      { tipo: 'fardo', x: 218, y: 172, solido: true, hw: 8, hh: 5 },
      { tipo: 'lampara', pared: true, x: 192, y: 52 },
    ],
    puntos: [
      {
        id: 'caballerizo', tipo: 'persona', x: 160, y: 156, alcance: 28,
        dialogo: [
          { id: 'verCaballos', tienda: 'establo' },
          { id: 'nada' },
        ],
      },
      { id: 'pesebres', tipo: 'mueble', x: 154, y: 144, alcance: 30, tienda: 'establo' },
    ],
  },

  // --------------------------------------------------------------- cantina
  //
  // El lugar más complejo del pueblo, y el único con tres cosas distintas que
  // hacer: la barra, las mesas y el póker. Está armado en tres zonas separadas
  // a propósito — si estuviera todo junto sería un salón con muebles, y así en
  // cambio se camina de una cosa a la otra.
  cantina: {
    nombre: 'CANTINA',
    soloDeDia: false,
    sala: SALA,
    puerta: PUERTA,
    muebles: [
      // El estante de botellas va en la PARED, detrás de la barra — que es
      // donde está en cualquier cantina y donde no estorba a nadie.
      { tipo: 'botellas', pared: true, x: 56, y: 46, w: 130, h: 24 },
      { tipo: 'trofeo', pared: true, x: 320, y: 56 },

      // La alfombra bajo la mesa de póker: marca la zona sin decirlo.
      { tipo: 'alfombra', x: 282, y: 128, w: 76, h: 76 },

      /**
       * La barra deja un pasillo de 12 px detrás, contra la pared: ahí está
       * parado el barman. Sin ese pasillo el barman quedaría adentro de su
       * propia barra.
       */
      { tipo: 'barra', x: 56, y: 96, w: 130, h: 18, solido: true },

      /**
       * Las mesas de comer, en el medio — pero NINGUNA delante de la puerta.
       * Una versión anterior ponía una justo ahí y el jugador aparecía
       * adentro de la mesa, sin poder moverse. El punto por donde se entra
       * tiene que quedar despejado siempre.
       */
      { tipo: 'mesa', x: 104, y: 152, solido: true },
      { tipo: 'silla', x: 84, y: 152, solido: true, hw: 4, hh: 5 },
      { tipo: 'silla', x: 124, y: 152, solido: true, hw: 4, hh: 5 },
      { tipo: 'mesa', x: 166, y: 146, solido: true },
      { tipo: 'silla', x: 186, y: 146, solido: true, hw: 4, hh: 5 },

      // Y la mesa de póker, la única redonda y la única con paño verde: se
      // tiene que reconocer desde la puerta, sin leer nada.
      { tipo: 'poker', x: 282, y: 126, r: 30, solido: true },
      { tipo: 'silla', x: 282, y: 90, solido: true, hw: 4, hh: 5 },
      { tipo: 'silla', x: 246, y: 126, solido: true, hw: 4, hh: 5 },
      { tipo: 'silla', x: 318, y: 126, solido: true, hw: 4, hh: 5 },
      { tipo: 'silla', x: 282, y: 162, solido: true, hw: 4, hh: 5 },

      { tipo: 'lampara', pared: true, x: 110, y: 52 },
      { tipo: 'lampara', pared: true, x: 282, y: 52 },
    ],
    puntos: [
      // Igual que el armero: al barman se le habla por encima de la barra.
      { id: 'barman', tipo: 'persona', x: 120, y: 88, alcance: 48 },
      { id: 'poker', tipo: 'mueble', x: 282, y: 126, alcance: 42 },
      { id: 'parroquiano', tipo: 'persona', x: 140, y: 176, alcance: 24 },
      { id: 'mesas', tipo: 'mueble', x: 104, y: 174, alcance: 22 },

      /**
       * LOS QUE ESTÁN SENTADOS SON GENTE DE VERDAD, no un dibujo aparte.
       * Antes se veían como personas y no respondían a nada, que es la trampa
       * que este proyecto evita en todos lados. `sentado: true` sólo cambia
       * cómo se dibujan; se detectan con el mismo `puntoCerca` que cualquiera.
       */
      { id: 'comensal1', tipo: 'persona', sentado: true, x: 84, y: 152, alcance: 20 },
      { id: 'comensal2', tipo: 'persona', sentado: true, x: 186, y: 146, alcance: 20 },
      { id: 'jugador1', tipo: 'persona', sentado: true, x: 246, y: 126, alcance: 20 },
      { id: 'jugador2', tipo: 'persona', sentado: true, x: 318, y: 126, alcance: 20 },
    ],
  },

  // --------------------------------------------------------- oficina sheriff
  //
  // Acá vive tu cartel de "se busca", que hasta ahora era una línea de texto
  // en la calle. Que haya que ENTRAR a la oficina de la ley para mirar cuánto
  // pagan por vos es mucho mejor que leerlo desde la vereda.
  sheriff: {
    nombre: 'OFICINA DEL SHERIFF',
    soloDeDia: false,
    sala: SALA,
    puerta: PUERTA,
    muebles: [
      /**
       * La cartelera va COLGADA DE LA PARED, que es donde va una cartelera.
       * Antes estaba en el piso y se la atravesaba caminando. Y el escritorio
       * va corrido al centro, lejos de ella: ese cartel es la cuenta
       * regresiva de la horca, o sea la información más importante del
       * pueblo, y lo que más importa mirar tiene que ser lo más fácil de
       * alcanzar.
       */
      { tipo: 'cartelera', pared: true, x: 62, y: 44, w: 84, h: 32 },

      // La alfombra va DELANTE del escritorio, no debajo: tapada por el
      // mueble no se vería, y su único trabajo es que el piso no sea liso.
      { tipo: 'alfombra', x: 171, y: 164, w: 112, h: 30 },
      { tipo: 'escritorio', x: 132, y: 120, w: 78, h: 26, solido: true },
      { tipo: 'silla', x: 171, y: 106, solido: true, hw: 4, hh: 5 },
      { tipo: 'estufa', x: 62, y: 160, solido: true, hw: 8, hh: 11 },
      // Las celdas, con su reja. Son la promesa de la cárcel hecha decorado:
      // ya sabés dónde terminás si te agarran.
      { tipo: 'celda', x: 240, y: 84, w: 94, h: 68, solido: true },
      { tipo: 'lampara', pared: true, x: 300, y: 54 },
    ],
    puntos: [
      { id: 'cartelera', tipo: 'mueble', x: 104, y: 96, alcance: 30 },
      { id: 'ayudante', tipo: 'persona', x: 250, y: 172, alcance: 26 },
      { id: 'celdas', tipo: 'mueble', x: 287, y: 166, alcance: 30 },
    ],
  },

  // -------------------------------------------------------------- perista
  /**
   * LA CASA DE EMPEÑOS — donde se vende lo que sacaste del tren de carga.
   *
   * ABRE SIEMPRE (`soloDeDia: false`), y es lo único que hay que saber del
   * personaje: el establo y la armería cierran de noche porque son negocios
   * honestos con horario. Éste trabaja cuando los otros están cerrados. No hace
   * falta decirlo en ninguna frase — se nota la primera vez que llegás de noche
   * y es la única puerta que se abre.
   *
   * Y ES UN CUARTO LLENO DE COSAS DE OTROS. Los muebles no son mercadería
   * exhibida como en la armería: son bultos apilados contra las paredes, sin un
   * solo estante. Nada acá está en venta para vos.
   */
  perista: {
    nombre: 'CASA DE EMPEÑOS',
    soloDeDia: false,
    sala: SALA,
    puerta: PUERTA,
    muebles: [
      // Cosas de otros, apiladas. Van contra las paredes, no exhibidas.
      /**
       * 🐛 EL ESTANTE Y UN BARRIL ESTABAN AFUERA DEL CUARTO. El estante iba en
       * x=300 con 92 de largo: terminaba en 392, más allá de la pared (340) y
       * del borde de la pantalla vieja (384), que lo cortaba sin que se notara.
       * El barril de x=348 caía sobre la pared derecha. Con la pantalla más
       * ancha los dos quedaron a la vista del otro lado de la pared.
       */
      { tipo: 'estanteArmas', pared: true, x: 240, y: 48, w: 92, h: 24 },
      { tipo: 'cajon', x: 58, y: 62, solido: true, hw: 9, hh: 7 },
      { tipo: 'cajon', x: 80, y: 78, solido: true, hw: 9, hh: 7 },
      { tipo: 'barril', x: 324, y: 108, solido: true, hw: 7, hh: 9 },
      { tipo: 'barril', x: 324, y: 150, solido: true, hw: 7, hh: 9 },
      { tipo: 'cajon', x: 62, y: 166, solido: true, hw: 8, hh: 6 },
      { tipo: 'cajon', x: 84, y: 180, solido: true, hw: 8, hh: 6 },

      /**
       * EL MOSTRADOR ES CHICO Y ESTÁ CRUZADO EN EL MEDIO. No es una vidriera de
       * 184 px como la de la armería: es una tabla para apoyar una bolsa y que
       * el otro la mire. Acá no se exhibe nada.
       */
      { tipo: 'mostrador', x: 186, y: 116, w: 104, h: 16, solido: true },

      // Una sola lámpara, y baja: el local más oscuro del pueblo.
      { tipo: 'lampara', pared: true, x: 186, y: 58 },
    ],
    puntos: [
      /**
       * ÉL TAMBIÉN PREGUNTA, igual que el armero y el caballerizo — y por el
       * mismo motivo: en este juego los que hacen negocios te hablan primero.
       * Pero su pregunta es la inversa de las otras dos. Aquéllos te preguntan
       * qué querés comprar; éste te pregunta qué traés.
       *
       * Y la respuesta es UNA SOLA, porque no hay nada que elegir: te compra el
       * lote entero de un gesto (ver `tasarLote` en data/perista.js).
       */
      {
        id: 'perista', tipo: 'persona', x: 238, y: 98, alcance: 46,
        dialogo: [
          { id: 'vender', vender: true },
          { id: 'nada' },
        ],
      },
      // Y al mostrador se puede ir directo, sin hablarle: es el mismo trato.
      { id: 'mostradorEmpenos', tipo: 'mueble', x: 186, y: 134, alcance: 24, vender: true },
    ],
  },
};

/**
 * LOS MUEBLES Y LOS PUNTOS, A LA PANTALLA DE HOY (ver arriba).
 *
 * Se estiran las posiciones y los largos (`w`/`h`: un mostrador más largo en
 * una sala más ancha). Lo que tiene tamaño de objeto —una silla, un barril, el
 * radio de la mesa de póker— queda igual, salvo las cajas de choque de los
 * muebles largos, que tienen que seguir cubriendo su dibujo entero.
 */
(function estirarInteriores() {
  for (const cuarto of Object.values(INTERIORES)) {
    for (const cosa of [...cuarto.muebles, ...cuarto.puntos]) {
      cosa.x = Math.round(cosa.x * KX);
      cosa.y = Math.round(cosa.y * KY);
      if (cosa.w !== undefined) cosa.w = Math.round(cosa.w * KX);
      if (cosa.h !== undefined) cosa.h = Math.round(cosa.h * KY);
      if (cosa.w !== undefined && cosa.hw !== undefined) {
        cosa.hw = Math.round(cosa.w / 2);
        cosa.hh = Math.round(cosa.h / 2);
      }
    }
  }
})();
