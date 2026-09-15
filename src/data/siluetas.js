/**
 * LAS SOMBRAS CABEZONAS — los dibujos de toda la gente del juego, en tablas.
 *
 * *(Santi: "me gustaría que diseñemos un tipo de arte, no una persona así
 * parada que es muy normal")*. De seis láminas eligió esto: personajes
 * TOTALMENTE NEGROS, sombrerudos y cabezones, donde lo único con color son sus
 * detalles —el pañuelo, la insignia, la estrella, la capa— y esos detalles son
 * los que dicen quién es cada uno, junto con la silueta del sombrero.
 *
 * ESTE ARCHIVO SÓLO DIBUJA LETRAS. Quien las convierte en píxeles es
 * entities/figura.js. Si un personaje no te gusta, se retoca acá y nada más.
 *
 * CÓMO SE LEEN LAS TABLAS. Cada fila es una fila de píxeles, de 12 de ancho.
 * Un punto es transparente; cualquier otra letra es parte de la silueta y se
 * pinta de negro (las letras distintas sólo sirven para que se lea qué es
 * cada cosa: `h` sombrero, `s` cara, `c` cuerpo, `p` pantalón, `k` bota). La
 * única que no es negra es `e`: los ojos.
 *
 * LAS VISTAS. Hay 8 direcciones *(Santi: "quiero que hayan 8 direcciones en
 * vez de 4")* pero sólo 5 dibujos: las tres de la izquierda son las de la
 * derecha en espejo.
 *
 *   frente   mirando a la cámara           lado    de perfil, hacia la derecha
 *   diagF    abajo a la derecha            diagE   arriba a la derecha
 *   espalda  de espaldas
 *
 * LOS DETALLES de cada tipo van por vista (`frente`, `lado`, `espalda`; y
 * `diagF` / `diagE` si hace falta distinto). Cada uno es:
 *
 *   { capa: 'hat' | 'body', dx, dy, rows | frames, detras, corre }
 *
 *  - `capa`: 'hat' cuenta `dy` desde arriba del sombrero; 'body' desde la
 *    primera fila de la cara (justo debajo del sombrero).
 *  - `rows`: el dibujo, con letras que se buscan en la paleta `pal` del tipo.
 *  - `frames`: varios dibujos que se turnan al caminar (lo que vuela).
 *  - `detras`: va detrás de la silueta (las capas, el guardapolvo).
 *  - `corre`: en diagonal se corre un píxel hacia donde mira (lo que va en
 *    el pecho). Sin `diagF`/`diagE` propios, la diagonal es la vista de
 *    frente o de espaldas con estos detalles corridos.
 */

export const NEGRO = '#0e0a09';

/** Los ojos de guardias y jinetes dicen el estado. */
export const OJOS_ESTADO = {
  calma: '#d8dde4',
  sospecha: '#f8d830',
  alerta: '#ff3a2a',
  aturdido: '#8a8478',
};

const LEY = '#4a78b8';

// -------------------------------------------------------------- sombreros
export const SOMBREROS = {
  vaquero:   ['....oooo....', '...ohHHho...', '...ohbbho...', '.ooHHHHHHoo.', 'ohhhhhhhhhho'],
  kepi:      ['..oooooooo..', '..oHHHHHHo..', '..ohhbbhho..', '.ookkkkkkoo.'],
  kepiLado:  ['..oooooo....', '..oHHHHHo...', '..ohhbbho...', '..ookkkkkoo.'],
  kepiDiagF: ['..oooooooo..', '..oHHHHHHo..', '..ohhbbhho..', '.ookkkkkkooo'],
  kepiAtras: ['..oooooooo..', '..oHHHHHHo..', '..ohhbbhho..', '.oohhhhhhoo.'],
  sheriff:   ['...oooooo...', '...ohHHho...', '...ohhhho...', '...ohybho...', '.ooHHHHHHoo.', 'ohhhhhhhhhho'],
  galera:    ['...oooooo...', '...oHHHHo...', '...ohhhho...', '...ohhhho...', '...ohhhho...', '...obbbbo...', '..oHHHHHHo..', '.ohhhhhhhho.'],
  bombin:    ['....oooo....', '...oHHHHo...', '..oohbbhoo..', '.oohhhhhhoo.'],
  plano:     ['..oooooooo..', '..ohbbbbho..', 'oooooooooooo'],
  boina:     ['...oooooo...', '..ohhhhhho..', '.oohhhhhhoo.'],
  jefe:      ['....o..o....', '...oooooo...', '...ohhhho...', '..oohbbhoo..', 'oohhhhhhhhoo', 'ohhhhhhhhhho'],
};

/** La gorra militar es la única que cambia según hacia dónde mira (la visera). */
export function sombreroDe(clave, vista) {
  if (clave !== 'kepi') return clave;
  return { lado: 'kepiLado', diagF: 'kepiDiagF', diagE: 'kepiAtras', espalda: 'kepiAtras' }[vista] || 'kepi';
}

// ---------------------------------------------------------------- cuerpos
const F_TOP = ['.oSSSSSSSSo.', '..osesseso..', '..osssssso..', '.oxxxxxxxxo.', 'oCccccccccCo', 'oCccccccccCo', 'osCCCCCCCCso', '.oppppppppo.'];
const F_PIERNAS = [
  ['.opppoopppo.', '.okkkookkko.', '.oooo..oooo.'],
  ['.opppoopppo.', '.okkkoopppo.', '......okkko.'],
  ['.opppoopppo.', '.opppookkko.', '.okkko......'],
];
const DF_TOP = ['.oSSSSSSSSo.', '..ossseseo..', '..ossssssso.', '.oxxxxxxxxo.', 'oCccccccccCo', 'oCccccccccCo', 'osCCCCCCCCso', '..oppppppppo'];
const DE_TOP = ['.oSSSSSSSSo.', '..osssssso..', '..osssssso..', '.oxxxxxxxxo.', 'oCccccccccCo', 'oCccccccccCo', 'osCCCCCCCCso', '..oppppppppo'];
const D_PIERNAS = [
  ['..opppoopppo', '..okkkookkko', '..oooo..oooo'],
  ['..opppoopppo', '..okkkoopppo', '.......okkko'],
  ['..opppoopppo', '..opppookkko', '..okkko.....'],
];
const L_TOP = ['..oSSSSSSo..', '...ossseso..', '...osssssso.', '...oxxxxo...', '...oCcccCo..', '...oCcccCo..', '...oCCsCCo..', '...oppppo...'];
const L_PIERNAS = [
  ['...oppppo...', '...okkkkoo..', '...oooooo...'],
  ['..opp..ppo..', '.okko..okkoo', '.ooo....ooo.'],
  ['....oppo....', '....okkoo...', '....ooooo...'],
];

/** Arriba el torso, abajo las piernas: tres cuadros del paso (0 es parado). */
export const CUERPOS = {
  frente: { top: F_TOP, piernas: F_PIERNAS },
  diagF: { top: DF_TOP, piernas: D_PIERNAS },
  lado: { top: L_TOP, piernas: L_PIERNAS },
  diagE: { top: DE_TOP, piernas: D_PIERNAS },
  espalda: { top: F_TOP, piernas: F_PIERNAS },
};

/** Las posturas se dibujan igual en todas las vistas (sin ojos si da la espalda). */
export const POSTURAS = {
  agachado: ['.oSSSSSSSSo.', '..osesseso..', '..osssssso..', '.oxxxxxxxxo.', 'oCccccccccCo', 'osCCCCCCCCso', 'okkko..okkko', 'ooooo..ooooo'],
  sentado:  ['.oSSSSSSSSo.', '..osesseso..', '..osssssso..', '.oxxxxxxxxo.', 'oCccccccccCo', 'osCCCCCCCCso', '.oppppppppo.', '.okko..okko.'],
  rendido:  ['.oSSSSSSSSo.', '..osesseso..', '..osssssso..', '.oxxxxxxxxo.', 'oCccccccccCo', 'oCCCCCCCCCCo', '.oppppppppo.', 'okkkkkkkkkko'],
};

// ------------------------------------------------------- lo que vuela
/** El pañuelo o la bufanda de frente: las puntas vuelan hacia un costado. */
const flameo = (ch) => [
  ['rr....', '.rrrrr', '......'],
  ['......', 'rrrrrr', '......'],
  ['......', '.rrrrr', 'rr....'],
].map((f) => f.map((fila) => fila.replace(/r/g, ch)));

/**
 * De costado, más corto: en la lámina de poses era una raya roja que cruzaba
 * toda la figura.
 */
const flameoLado = (ch) => [
  ['rrr', 'r..'],
  ['.rr', 'rr.'],
  ['rrr', '.r.'],
].map((f) => f.map((fila) => fila.replace(/r/g, ch)));

const CAPA = [
  ['........cccc', '......cCcccc', '....ccCCcccc', '..cccCccccc.', 'cLcCcccc....', '.cc.ccc.....', '....c.......'],
  ['........cccc', '.......cCccc', '.....cCCcccc', '...ccCcccc..', '.ccCccc.....', 'cLcc........', 'c...........'],
  ['........cccc', '........cccc', '......cCcccc', '....cCCccc..', '..cCccLc....', '.cCcc..cc...', 'cc..........'],
  ['........cccc', '.......ccccc', '....ccCccccc', '..ccCCcccc..', 'ccCccccc....', 'LcccLc......', '.c..c.c.....'],
];
const CAPA_DIAG_E = [
  ['......cccccc..', '....ccCccccCc.', '..ccCcccccccc.', 'cCcccccCcccc..', '.cc.cccccccc..', '.....cc.cc....'],
  ['......cccccc..', '.....cCccccCc.', '...cCcccccccc.', '.cCccccCcccc..', 'cc..cccccccc..', 'c.....cc.cc...'],
];
const CAPA_ESPALDA = [
  ['cccccccccc', 'cCccccccCc', 'cccCcccccc', 'ccccccCccc', 'cCcccccccc', '.ccc.cc.cc'],
  ['cccccccccc', 'cCccccccCc', 'ccccCccccc', 'cccccCcccc', 'ccCccccccc', 'cc.ccc.cc.'],
];
const GUARDAPOLVO = [
  ['.gggg', 'gGgg.', '.gg..', '.g...'],
  ['..ggg', '.gGgg', 'gg...', 'g....'],
  ['.gggg', 'ggGg.', 'g.g..', '..g..'],
];

// ------------------------------------------------------------------ tipos
const hat = (dx, dy, fila) => ({ capa: 'hat', dx, dy, rows: [fila] });
const hombreras = [
  { capa: 'body', dx: 0, dy: 4, rows: ['a'] },
  { capa: 'body', dx: 11, dy: 4, rows: ['a'] },
];

const pasajero = {
  sombrero: 'bombin', ojos: '#d8dde4',
  pal: { v: '#3fa870', V: '#8ae0b0', f: '#f06a9a' },
  frente: [
    hat(3, 2, 'vvvvvf'),
    { capa: 'body', dx: 2, dy: 3, rows: ['vvVvvVvv'] },
    { capa: 'body', dx: -5, dy: 2, frames: flameo('v') },
  ],
  lado: [
    hat(3, 2, 'vvvvvf'),
    { capa: 'body', dx: 3, dy: 3, rows: ['vvVvvv'] },
    { capa: 'body', dx: 0, dy: 3, frames: flameoLado('v') },
  ],
  espalda: [
    hat(3, 2, 'fvvvvv'),
    { capa: 'body', dx: 2, dy: 3, rows: ['vvvvvvvv'] },
    { capa: 'body', dx: -5, dy: 2, frames: flameo('v') },
  ],
};

export const TIPOS = {
  /** VOS: sombrero de vaquero y pañuelo rojo. */
  jugador: {
    sombrero: 'vaquero', ojos: '#f0e0c0',
    pal: { r: '#c8342a', R: '#f07050' },
    frente: [
      hat(4, 2, 'rRRr'),
      { capa: 'body', dx: 2, dy: 3, rows: ['rrRrrRrr'] },
      { capa: 'body', dx: 4, dy: 4, rows: ['rrrr', '.rr.'], corre: true },
      { capa: 'body', dx: -5, dy: 2, frames: flameo('r') },
    ],
    lado: [
      hat(4, 2, 'rRRr'),
      { capa: 'body', dx: 3, dy: 3, rows: ['rrRrrr'] },
      { capa: 'body', dx: 0, dy: 3, frames: flameoLado('r') },
    ],
    espalda: [
      hat(4, 2, 'rRRr'),
      { capa: 'body', dx: 2, dy: 3, rows: ['rrrrrrrr'] },
      { capa: 'body', dx: 5, dy: 4, rows: ['rr', 'rr'], corre: true },
      { capa: 'body', dx: -5, dy: 2, frames: flameo('r') },
    ],
  },

  /** EL GUARDIA: gorra con cinta azul, insignia plateada y hombreras. */
  guardia: {
    sombrero: 'kepi', ojosEstado: true,
    pal: { s: '#c8ced6', S: '#ffffff', a: LEY },
    frente: [hat(3, 2, 'aaaaaa'), { capa: 'body', dx: 3, dy: 4, rows: ['sS', 'ss'], corre: true }, ...hombreras],
    lado: [hat(3, 2, 'aaaaaa'), { capa: 'body', dx: 7, dy: 4, rows: ['S', 's'] }, { capa: 'body', dx: 4, dy: 4, rows: ['a'] }],
    espalda: [hat(3, 2, 'aaaaaa'), ...hombreras],
  },

  /** EL BLINDADO: la placa de metal en el pecho. */
  blindado: {
    sombrero: 'kepi', ojosEstado: true,
    pal: { l: '#8a929c', L: '#e0e4ea', a: LEY },
    frente: [hat(3, 2, 'aaaaaa'), { capa: 'body', dx: 2, dy: 4, rows: ['llllllll', 'lLllllLl'], corre: true }, ...hombreras],
    lado: [hat(3, 2, 'aaaaaa'), { capa: 'body', dx: 4, dy: 4, rows: ['llll', 'lLll'] }],
    espalda: [hat(3, 2, 'aaaaaa'), { capa: 'body', dx: 2, dy: 4, rows: ['llllllll'] }],
  },

  /** EL PISTOLERO: ala plana, guardapolvo al viento y las dos culatas de marfil. */
  pistolero: {
    sombrero: 'plano', ojosEstado: true,
    pal: { w: '#efe6d2', W: '#b8ad98', g: '#7a7266', G: '#4e4840' },
    frente: [
      { capa: 'body', dx: -5, dy: 6, detras: true, frames: GUARDAPOLVO },
      hat(3, 1, 'WWWWWW'),
      { capa: 'body', dx: -1, dy: 6, rows: ['ww', 'W.'] },
      { capa: 'body', dx: 11, dy: 6, rows: ['ww', '.W'] },
    ],
    lado: [
      { capa: 'body', dx: -2, dy: 6, detras: true, frames: GUARDAPOLVO },
      hat(3, 1, 'WWWWWW'),
      { capa: 'body', dx: 8, dy: 6, rows: ['ww'] },
    ],
    espalda: [
      { capa: 'body', dx: -5, dy: 6, detras: true, frames: GUARDAPOLVO },
      hat(3, 1, 'WWWWWW'),
      { capa: 'body', dx: -1, dy: 6, rows: ['ww'] },
      { capa: 'body', dx: 11, dy: 6, rows: ['ww'] },
    ],
  },

  /**
   * EL DINAMITERO: boina con pompón y la bandolera cruzada. Los cartuchos de
   * la bandolera los arma figura.js según cuántos le quedan (`bandolera`).
   */
  dinamitero: {
    sombrero: 'boina', ojosEstado: true, bandolera: true,
    pal: { d: '#e03a2a' },
    frente: [hat(5, 0, 'dd')],
    lado: [hat(5, 0, 'dd')],
    espalda: [hat(5, 0, 'dd')],
  },

  /** EL SHERIFF (guardia): cinta y estrella doradas, y el bigote blanco. */
  sheriff: {
    sombrero: 'sheriff', ojosEstado: true,
    pal: { y: '#e8c34a', Y: '#fff2a0', m: '#e0d8c8' },
    frente: [
      hat(4, 3, 'yYyy'),
      { capa: 'body', dx: 4, dy: 2, rows: ['mmmm'], corre: true },
      { capa: 'body', dx: 4, dy: 4, rows: ['.y.', 'yYy', '.y.'], corre: true },
    ],
    lado: [
      hat(4, 3, 'yYyy'),
      { capa: 'body', dx: 7, dy: 2, rows: ['mmm'] },
      { capa: 'body', dx: 5, dy: 4, rows: ['.y.', 'yYy', '.y.'] },
    ],
    espalda: [hat(4, 3, 'yYyy')],
  },

  /** EL PASAJERO: bombín con flor y bufanda verde. */
  pasajero,

  /**
   * EL CIVIL ENCUBIERTO: IGUAL que un pasajero, a propósito (ver
   * data/guards.js). Lo que lo delata es el arma que saca y el "!".
   */
  encubierto: pasajero,

  /** EL PASAJERO RICO: galera con cinta morada, monóculo, moñito y cadena de oro. */
  rico: {
    sombrero: 'galera', ojos: '#d8dde4',
    pal: { p: '#a050c0', g: '#e8c34a', w: '#f4f0e8' },
    frente: [
      hat(4, 5, 'pppp'),
      { capa: 'body', dx: 7, dy: 1, rows: ['g'], corre: true },
      { capa: 'body', dx: 5, dy: 3, rows: ['ww'], corre: true },
      { capa: 'body', dx: 3, dy: 5, rows: ['g...', '.gg.'], corre: true },
    ],
    lado: [
      hat(4, 5, 'pppp'),
      { capa: 'body', dx: 7, dy: 1, rows: ['g'] },
      { capa: 'body', dx: 8, dy: 3, rows: ['w'] },
      { capa: 'body', dx: 6, dy: 5, rows: ['gg'] },
    ],
    espalda: [hat(4, 5, 'pppp')],
  },

  /** JEFE — EL CAZARRECOMPENSAS: la capa roja que vuela. */
  cazarrecompensas: {
    sombrero: 'jefe', ojos: '#ffb030',
    pal: { c: '#c8302a', C: '#7a1c18', L: '#f06a50', y: '#e8c34a' },
    frente: [
      { capa: 'body', dx: -9, dy: 3, detras: true, frames: CAPA },
      hat(4, 3, 'cccc'),
      { capa: 'body', dx: 1, dy: 3, rows: ['y'] },
    ],
    lado: [
      { capa: 'body', dx: -6, dy: 3, detras: true, frames: CAPA },
      hat(4, 3, 'cccc'),
    ],
    espalda: [hat(4, 3, 'cccc'), { capa: 'body', dx: 1, dy: 3, frames: CAPA_ESPALDA }],
    diagE: [hat(4, 3, 'cccc'), { capa: 'body', dx: -2, dy: 3, frames: CAPA_DIAG_E }],
  },

  /** JEFE — EL SHERIFF: guardapolvo al viento, estrella grande y bigote. */
  sheriffJefe: {
    sombrero: 'sheriff', ojos: '#ffb030',
    pal: { y: '#e8c34a', Y: '#fff2a0', m: '#e0d8c8', g: '#7a7266', G: '#4e4840' },
    frente: [
      { capa: 'body', dx: -5, dy: 5, detras: true, frames: GUARDAPOLVO },
      hat(4, 3, 'yYyy'),
      { capa: 'body', dx: 4, dy: 2, rows: ['mmmm'], corre: true },
      { capa: 'body', dx: 4, dy: 4, rows: ['.yy.', 'yYYy', '.yy.'], corre: true },
    ],
    lado: [
      { capa: 'body', dx: -2, dy: 5, detras: true, frames: GUARDAPOLVO },
      hat(4, 3, 'yYyy'),
      { capa: 'body', dx: 7, dy: 2, rows: ['mmm'] },
      { capa: 'body', dx: 5, dy: 4, rows: ['.yy.', 'yYYy', '.yy.'] },
    ],
    espalda: [
      { capa: 'body', dx: -5, dy: 5, detras: true, frames: GUARDAPOLVO },
      hat(4, 3, 'yYyy'),
    ],
  },
};

/** El `look` de cada tipo de guardia (data/guards.js) a su silueta. */
export const SILUETA_DE_LOOK = {
  normal: 'guardia',
  placa: 'blindado',
  dosRevolveres: 'pistolero',
  bandolera: 'dinamitero',
  civil: 'encubierto',
  estrella: 'sheriff',
};

/** Cada jefe (data/bosses.js) a su silueta. */
export const SILUETA_DE_JEFE = {
  cazarrecompensas: 'cazarrecompensas',
  sheriff: 'sheriffJefe',
};
