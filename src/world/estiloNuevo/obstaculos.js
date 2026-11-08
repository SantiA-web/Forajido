/**
 * 🌵 LOS OBSTÁCULOS DE LA CABALGATA, EN EL ESTILO NUEVO: la roca, el arbusto, el cactus y el montículo.
 *
 * *(Santi eligió "los 4, grandes y con volumen")*. Eran rectángulos del dibujo viejo, chiquitos al lado del caballo.
 * Ahora cada uno es un mapa dibujado a mano en la grilla, del ancho de su choque (`obstaculoRadios`, data/horse.js:
 * lo que ves es lo que te frena) y del alto real al lado del caballo (la gente mide 30 puntos, 1,7 m):
 *
 *  - LA ROCA (27 puntos, 1,5 m): una piedra grande con otra más chica apoyada. La tapa agarra el sol, el frente —el que
 *    da a la cámara— queda en sombra, con sus grietas, y la sombra cae para acá y a la izquierda.
 *  - EL ARBUSTO (24): una mata de jarilla grande, las copas claras arriba y las ramas secas asomando al pie.
 *  - EL CACTUS (21, 2,5 m de alto): un cardón, con tres brazos que salen bajos y suben derechos, redondo (la luz en el
 *    costado de la derecha). 🔁 Primero fue un saguaro: el cardón es más nuestro y no es el de todos los westerns.
 *  - EL MONTÍCULO (16): un lomo de arena clara, bajo, con la cresta al sol. El más perdonador, y se lee así.
 *
 * El sol viene de allá y un poco de la derecha, como en el resto del afuera. De noche, el mismo dibujo con los
 * escalones de luz del suelo. Golpeados (cuando los chocás ya no frenan, y por eso no pueden seguir parados): la roca
 * queda en pedazos, el arbusto aplastado, el cactus tumbado y el montículo desparramado.
 */
import { CONFIG } from '../../data/config.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { iluminar } from '../../engine/luz.js';

const PASO = CONFIG.estilo.punto / DENSIDAD;

/** Los colores de las letras (índices de la paleta). */
const COLOR = {
  // La piedra: la tapa al sol, el costado, el frente en sombra y las grietas.
  L: 25, l: 24, M: 23, K: 31,
  // Los verdes, de oscuro a claro, y las ramas secas.
  D: 42, d: 26, g: 27, h: 43, t: 33,
  // La arena: la cresta, el lomo y la ladera.
  W: 38, F: 37, f: 36,
  // La sombra en la tierra.
  s: 34, S: 33,
  // 🏔️ Las mesas y las agujas de la huida, con los marrones de siempre: la tapa al sol, las repisas, la pared, la
  // sombra y las canaletas, y lo más hondo de las mordeduras.
  T: 37, A: 36, P: 35, p: 34, Q: 33, k: 32,
  // 🌳 El algarrobo: la corteza (oscura, el medio y el lado al sol) y las chauchas.
  B: 32, C: 33, c: 34, y: 16,
};

/** Cada obstáculo: su mapa parado, su mapa golpeado y dónde tiene el pie (columna, fila) en cada uno. */
export const OBSTACULOS = {
  roca: {
    pie: [13, 17],
    mapa: [
      '..........LLLL.............',
      '.......LLLLLLLLL...........',
      '.....LLLLLLLLLLLLL.........',
      '...lLLLLLLLLLLLLLLL........',
      '..llLLLLLLLLLLLLLLLl.......',
      '..lllLLLLLLLLLLLLLll.......',
      '.lllllLLLLLLLLLLLlll..LLL..',
      '.MlllllllLLLLLlllllM.LLLLL.',
      '.MMlllllllllllllllMMLLLLLLL',
      'MMMMMllllllllllllMMMlllLLLl',
      'MMMMMMMMlllllllMMMMMlllllll',
      'MMMKMMMMMMMMMMMMMMMMMlllllM',
      'MMMKKMMMMMMMMMMMKMMMMMMlMMM',
      'KMMMKMMMMMMMMMMMKKMMMMMMMMM',
      'KMMMMKMMMMMMMMMMMKMMMMMMMMK',
      'KKMMMMMMMMMMMMMMMMMMKMMMMKK',
      'SKKMMMMMMMMMMMMMMMMMKKMMKKs',
      'SSKKKKKMMMMMMMMMMMKKKKKKKss',
      'SSSSSKKKKKKKKKKKKKKKSSSsss.',
      '.SSSSSSSSSSSSSSSSSSSSsss...',
      '..ssssssssssssssssss.......',
    ],
    golpeadoPie: [10, 3],
    golpeado: [
      '...LL.......ll.....LL.',
      '..lMMM.....lMM....lMMK',
      '.SsMKK..L..SMK..SsKKK.',
      'SSsss..lMs..ss.SSss...',
      '.......sss............',
    ],
  },
  arbusto: {
    pie: [12, 13],
    mapa: [
      '.........h..h...........',
      '.....h..hgh.hgh..h......',
      '....hgh.hgghgggh.hgh....',
      '...hgghhgggggggghgggh...',
      '..hgggggggggdggggggghh..',
      '.hggggdgggggggggdgggghh.',
      '.ggggggggdgggggggggghgg.',
      'hgggdgggggggggdggggghggh',
      'gggggggdggggggggggggdggg',
      '.ddgggggggddgggggggggdd.',
      '.dddddgggdddddggggddddd.',
      '..dddddddddddddddddddd..',
      '...dDdddDdddddDddddDd...',
      '....D.ttD.tt.tD.tt.D....',
      '..sssDsttsssstDsstsDsss.',
      '.sssssssssssssssssssss..',
    ],
    golpeadoPie: [10, 2],
    golpeado: [
      '...h..g..hg.g.h.......',
      '.hgdgDdgdDgddghg.h....',
      'sDtDtgDttDdtDgtDhgd...',
      'ssssssssssssssssssss..',
    ],
  },
  // 🔁 EL CARDÓN *(Santi eligió "cerros de colores", que trae los cardones en vez de los saguaros)*: el tronco y tres
  // brazos que salen bajos y suben derechos casi hasta arriba, como un candelabro. Es el mismo ancho del choque.
  cactus: {
    pie: [10, 39],
    mapa: [
      '.........dgh.........',
      '........Ddghg........',
      '........Ddghg........',
      '........Ddghg..dgh...',
      '........Ddghg.Ddgh...',
      '........Ddghg.Ddgh...',
      '..dgh...Ddghg.Ddgh...',
      '.Ddgh...Ddghg.Ddgh...',
      '.Ddgh...Ddghg.Ddgh...',
      '.Ddgh...Ddghg.Ddgh...',
      '.Ddgh...Ddghg.Ddgh...',
      '.Ddgh...Ddghg.Ddgh...',
      '.Ddgh...Ddghg.Ddgh...',
      '.Ddgh...Ddghg.Ddgh...',
      '.Ddgh...Ddghg.Ddgh.dh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...DdghghhhghDdh',
      '.Ddgh...DdghgggggDdh.',
      '.Ddgh...Ddghgdddd.Ddh',
      '.Ddgh...Ddghg.....Ddh',
      '.DdghhhhDdghg.....Ddh',
      '.DgggggggDdghg....Ddh',
      '..ddddddDdghghhhhhgdh',
      '........Ddghgggggggd.',
      '........Ddghgddddddd.',
      '........Ddghg........',
      '........Ddghg........',
      '........Ddghg........',
      '.....ssDDdghggss.....',
      '...ssssssssssss......',
      '..sssssssss..........',
    ],
    golpeadoPie: [27, 5],
    golpeado: [
      '....dgh.......................',
      '....Dgh.......................',
      '.hhhhhhhhhhhhhhhhhhhhhhh..Ddg.',
      'hggggggggggggggggggggggghhDdgh',
      'ggdgggdgggdgggdgggdgggdggDddg.',
      'ddddddddddddddddddddddddd.DDd.',
      '.ssssssssssssssssssssssssssss.',
    ],
  },
  monticulo: {
    pie: [8, 6],
    mapa: [
      '.....fFFFf......',
      '...fFFWWFFFf....',
      '..fFFWWWFFFFf...',
      '.fFFFFFFFFFFFf..',
      'fffFFFFFFFFffff.',
      'ffffffffffffffff',
      '.sffffffffffffs.',
      '..ssssssssssss..',
    ],
    golpeadoPie: [7, 1],
    golpeado: [
      '..fFFFFFFFFf....',
      'ffffffffffffff..',
      '.ssssssssssss...',
    ],
  },
  /**
   * 🏔️ LOS MOJONES DE LA HUIDA, EN LA GRILLA *(Santi: "pasar las rocas grandes de la huída a la nueva grilla, con
   * textura, mordeduras y esas cosas, pero no le pongas el color colorido, dejalas del mismo color")*. Eran tres
   * rectángulos marrones con una raya de luz. Ahora son tres mesas dibujadas a mano, con los mismos marrones de antes:
   * la tapa al sol (T), las repisas (A), la pared de frente (P), el lado en sombra y el fondo de las canaletas (Q) y las
   * mordeduras más hondas (k). Cada canaleta tiene el labio de la izquierda al sol (mira a la derecha, de donde viene la
   * luz) y el fondo en sombra; el borde de arriba y los costados están mordidos; al pie, el talud de piedras caídas y la
   * sombra que cae para acá y a la izquierda.
   * Van en el punto de la huida (`celda: 2`, el doble del punto del galope), del mismo tamaño en el mundo que las de
   * antes (60 de ancho, el doble de su choque). Cuál sale en cada lugar lo decide el lugar: no titila.
   *  - LA ALTA: un cerro solo, con su gorra de piedra dura arriba (la tapa, el labio al sol y la sombra que deja
   *    abajo), la pared rayada de vetas que bajan, tres canaletas que nacen en las mordidas del labio y se van
   *    cerrando, una cueva chica a la izquierda y el talud que se abre abajo.
   *  - LA DE DOS PISOS: la torre de arriba, un rellano de piedras sueltas al sol, la pared de abajo y un pilar suelto a
   *    la derecha, parado en el talud.
   *  - LA BAJA: un solo piso, ancho, con la tapa partida y una piedra caída al pie.
   * 🔁 La primera vuelta eran tres pisos apilados con canaletas derechas de arriba abajo, parejas: parecían cajones.
   * Y la tapa iba del color de la arena clara y no se distinguía del suelo: ahora es un tono más oscuro, con el
   * labio claro (como la tapa de antes, que era así). 🔁 Y con las vetas solas el cerro alto parecía un tronco cortado:
   * ahora cada pared tiene capas de roca de costado (una repisa clara rota y su sombra abajo).
   */
  mojon: {
    celda: 2,
    variantes: [
      {
        pie: [21, 25],
        mapa: [
          '.............AAAAA..AAAAAAAAA...............',
          '...........ATAAAAAATAAAAAAAAAA..............',
          '..........AAAATAAAAAAAAATAAAAAAA............',
          '..........TTTkTTTTTTkkTTTTTTTTTT............',
          '..........QPPkPPPPPPkkPPPPPPPPAA............',
          '..........QPpkPPpPPPQkPPPpPPPPAA............',
          '..........QQQpQQQQkQQkQQQQQpQQQQ............',
          '..........QQAkQPpPPAQkkPpPPpPAPAA...........',
          '..........QQAkQPpPPAQkQPpPPpPAPAA...........',
          '.........QQpAQPPpPPAQkPPpPPpPAPAA...........',
          '.........QQpAQPPpPPAQQPPpPPpPAPAAA..........',
          '.........QQpPQPPpPPPAQPPpPPpPAPAAA..........',
          '.........QAApAAApAAAAQAApAAQAApAAA..........',
          '..........QQpQQPpQQPAQQPpQAQpQAPAA..........',
          '..........QpPpPPpPPPPQPPpPAQpPAPAA..........',
          '..........QpPPpPpPPPPpPPpPAQPPAPAA..........',
          '..........QpPPpPpPPpPpPPpPPQPPAPA...........',
          '...........kAAApAAAApAAAApAQAApAA...........',
          '...........QQQpQQPpQQQpQQpQQpPPAPA..........',
          '..........QQpPpPpPPpPpPPpPPpPPAPAA..........',
          '..........QppPppPpPppPpPpppPpPApAA..........',
          '.........QQppQppQpppQpppQppQppQpQQ..........',
          '.......pAPpAPPpPAPPpAPPpPAPPpAPPpAPpA.......',
          '.....QpPpAPpQpPApPpQpAPpPQpApPpQPpAPpQp.....',
          '...pQpPpApQpPpApQpPpAPpQpPpApQpPpApPpQpPA...',
          '..QppAPpQpPPApQppPApPQppAPpPQpApPpPQpAPpQS..',
          '.SQpApPpQ.pPApQpPpAQp.pApPQpPApQpp.ApPpQSSS.',
          'SSSpSQpSS.pApSSpQSpp.SpApSsQss.pAss.sss.....',
          '.SSSSSSSSSSSSSSSSSSSssssssssssssss..........',
          '...SSSSSSSSSSSSsssssssssssssss..............',
          '......sssssssssssssssssss...................',
        ],
      },
      {
        pie: [22, 25],
        mapa: [
          '...............AAAA.AAAAAAAAA.................',
          '..............AATAAAAAAAAAAA..................',
          '.............TTTTkTTTTTTTkTTT.................',
          '.............QPPPkPPPPPPPkPAA............TTT..',
          '.............QQppkQQQpQQQkQpp...........ATTTA.',
          '.............QAkPPpPPAkPpPPPAA..........QPPPA.',
          '.............QAQPPpPPAQPpPPPAA..........QPpPA.',
          '............QQpQPPpPPAQPpPPAPA..........QkPPA.',
          '............QQpPPPpPPAQPpPAQPA..........QQPPA.',
          '............QAApAAApAAAApAAQAAA.........QPPpA.',
          '.............QQpQQpQQpQQpQQQPAA.........QPPPA.',
          '.............QppQppQpppQppQpQQ..........QpPAA.',
          '.........AApAPAAPApAAPAAApAPAAAPpAAPA...QPPPA.',
          '.......TAApAAPAAApAAPAAAPpAAAPAAApAATAA.QPpPA.',
          '......QTTTTkTTTTTTTkkTTTTTTTTTTkTTTTTA..QPPPA.',
          '......QAkPPpPPPPAkkPPpPPPpPPPAkPPPAPAA..QPPPA.',
          '......QAQPPpPPPPAkQPPpPPPpPPPAQPPPAPAA..QPpPA.',
          '......QQAQPpPPpPPAQPPpPPPpPPPAQPpPAPAA..QPPPA.',
          '......QQpQPpPPpPPAQPpPPPpPPPPpQPPPAPAA..QkPPA.',
          '......QAApAAAApAAAQApAAApAAAApAAAAAPA...QQPPA.',
          '......QQQpQQpQQpQQQpQQpQQQpQQpQQPPApA...QPPpA.',
          '......QppPppPppPPpppPpPppPppPpPPpPApA...QpPPA.',
          '......QQppQppQppQpppQppQppQpQppQppQQQ...QpppA.',
          '....pAPpAPPpPAPPpAPPpPAPPpAPPpAPpAPp....QQpQQ.',
          '..QpPpAPpQpPApPpQpAPpPQpApPpQPpAPpQpApPpQpApA.',
          '.QppAPpQpPPApQppPApPQppAPpPQpApPpPQpAPpQpApPS.',
          'SQpApPpQ.pPApQpPpAQp.pApPQpPApQpp.ApPpQ.pApS..',
          'SSSpSQpSS.pApSSpQSpp.SpApSsQss.pAss.sss.ss....',
          '.SSSSSSSSSSSSSSSSSSSSSssssssssssssssss........',
          '...SSSSSSSSSSSSSsssssssssssssssssss...........',
          '.......sssssssssssssssssssss..................',
        ],
      },
      {
        pie: [22, 16],
        mapa: [
          '............AAAAAA.AAAA..AAAAAAAA.............',
          '..........AAATAAAAAAATAAAAATAAAAAA............',
          '.........TTTTTkTTTTTTTTTkkTTTTTTkTTT..........',
          '.........QPPPAkPPPPPPPAkkPPPPPAkPPAA..........',
          '.........QQppQkQQQpQQQQkkQQpQQQQkQQp..........',
          '........QQpPPAkPPpPPPAkkPPpPPAkPPPAPA.........',
          '........QQpPPAQPPpPPPAkQPPpPPAQPPPAPA.........',
          '.......QQpPPpAQPPpPPPAQPPPpPPAQPpPAPAA........',
          '.......QQpPPpPQPPpPPPPQPPPpPPPQPPPAPAA........',
          '.......QAApAAAApAApAAAApAApAAApAAAAPAA........',
          '.......QQQpQQpQQpQQQpQQpQQQpQQpQQPAPAA........',
          '.......QpPPpPPpPPpPPPpPPpPPpPPpPPPAPAA........',
          '..ATTA..QpPpPPpPPpPPpPPpPPpPPpPPPAPA..........',
          '.QPPPA..QppPppPpPppPpPpppPpPppPpPApA..........',
          '.QppQA.QQppQppQpppQpppQppQppQpQQppQQ..........',
          '..QpPpAPpQpPApPpQpAPpPQpApPpQPpAPpQpApPpQpA...',
          '.QppAPpQpPPApQppPApPQppAPpPQpApPpPQpAPpQpApS..',
          'SQpApPpQ.pPApQpPpAQp.pApPQpPApQpp.ApPpQ.pAS...',
          'SSSpSQpSS.pApSSpQSpp.SpApSsQss.pAss.sss.s.....',
          '.SSSSSSSSSSSSSSSSSSSSssssssssssssssss.........',
          '...SSSSSSSSSSSssssssssssssssssss..............',
        ],
      },
    ],
  },
  /**
   * 🗿 LAS AGUJAS DEL BOSQUE DE PIEDRAS, con los mismos colores: altas y angostas, de base más ancha, con su canaleta
   * y la punta al sol. Dos, una alta y una más baja y torcida.
   */
  aguja: {
    celda: 2,
    variantes: [
      {
        pie: [6, 24],
        mapa: [
          '....TT......',
          '...ATTA.....',
          '...QPPA.....',
          '...QPpA.....',
          '...QPPPA....',
          '...QAQPA....',
          '..QPAQPA....',
          '..QPAQPPA...',
          '..QPPQPPA...',
          '..QPPkPPA...',
          '..QpPQPpA...',
          '..QPPQPPA...',
          '.QPPAQPPA...',
          '.QPPAQPPPA..',
          '.QPPAQPpPA..',
          '.QPPAkPPPA..',
          '.QpPAQPPPA..',
          '.QPPAQPPpPA.',
          '.QPPAQPPPPA.',
          'QPPPAQPPPPA.',
          'QPpPAQPPAQA.',
          'QPPPAkPPAQPA',
          'QpppAQppAQpA',
          'QQpQQQQpQQQQ',
          'pApQpPApQpAp',
          'SpQpAp.pApS.',
          'SSSSSSsssss.',
          '.ssssssss...',
        ],
      },
      {
        pie: [5, 16],
        mapa: [
          '.....TT...',
          '....ATTA..',
          '....QPPA..',
          '....QPpA..',
          '...QPPPA..',
          '...QPAQA..',
          '...QPAQPA.',
          '...QpAQPA.',
          '..QPPAQPA.',
          '..QPPAkPA.',
          '..QPpAQPPA',
          '..QPPAQPPA',
          '.QPPPAQpPA',
          '.QPPPAQPPA',
          '.QpppAQppA',
          '.QQpQQQpQQ',
          'pApQpPApQp',
          'SpQp.pApS.',
          'SSSSsssss.',
          '.sssssss..',
        ],
      },
    ],
  },
  /**
   * 🌳 EL ALGARROBO *(Santi: "quiero agregar cosas para hacerlo un poco más argentino a pesar de estar ambientado en la
   * frontera americana: algarrobos. Tienen que parecerse bastante y el tamaño acorde")*. Como uno de verdad: el tronco
   * corto y grueso, oscuro y con la corteza rajada (B, C, c), torcido y un poco inclinado, que se abre bajo en tres
   * gajos que se van de costado —uno largo a la izquierda, uno derecho al medio y uno a la derecha que se parte en
   * dos—; la copa ancha y chata como un paraguas, hecha de manchones de hoja fina con huecos por donde se ven las
   * ramas; la luz arriba (sobre todo a la derecha, de donde viene el sol), el frente y la panza de la copa en sombra,
   * algunas chauchas colgando (y) y la sombra de la copa en el suelo, rota por el sol que pasa entre las hojas.
   * Mide unos 4 metros: la gente mide 30 puntos y él 64 hasta la copa, y la copa tiene 94 de ancho.
   * Choca sólo el tronco (data/horse.js), y no se cae: chocado, sigue parado.
   */
  algarrobo: {
    pie: [49, 63],
    mapa: [
      '..........................................................hhghhhhhhh............................',
      '.....................................................hhhh.hhhhghhhhhhhhhh.......................',
      '..................................................hhhgghhhhhhghhhgghhhhhhhhh....................',
      '................................hhhhhhgg........hhggghhgghhhhhhghhhhgghhhhhhhhhh................',
      '............................hggghhhhhhgghhhhh..gggdggghhhhgggghhhgghhhhhhhhhghhhhh..............',
      '.........................hhgggghhgggghhhhhhgg.ggddgggghhgggdgggghhhhggghhhhhhghhhhh.............',
      '.......................hgggddggghhgggghggghhh.dgggddgggggddggghhhggggdggghhhhgghhhgg............',
      '......................gggddggggdggghgggghhhgggdddggggdggghhggggddggggdggghhhggggghggg...........',
      '.....................ggdddggggddggghgggdggghggddgggdddggggddggghggggdddggghhgggdggggh...........',
      '.....................gghggggdggghhgggdgggghggggggdgggghhgggdggggghhhggggdggghhggggghhh..........',
      '....................hgggddggggdgggddggggdgggddddggggdddgggddggggdgggdddggggddddhhhhhhhhhh.......',
      '....................dddDDddddDDDdddddDDddddDDDddddDDdddddDDDddddDDdddddDDDghhhgghhhhhhghhhhh....',
      '............hhghhhhhDhhhgghhhhhhghhhhDhhhDhhhhghhhhhhhgghhhhhDDhhhghhhhhggdgggghhgggdgggghhhgg..',
      '........hggghhhghhhhdgghgggghhggghgggghhhggghhggggdggghhgggghhhgghgghhhggghggggddggghhggggdgghh.',
      '.....hhgggdgggghhhggggdggggddggghggggddggdggggddggghggggddggghhgggdgghhddgggghgggddggggdggghhgg.',
      '....hgggddggghgggghhhgggddggggdgggddgggggggddgggdddggggdggggddgddgggdgggggddgggghgggddgggdggghhh',
      '...ggddgggghgggddggghhddgggdddggggddgggdddddgggddggggdddggddddddddggdddddggghggggddgggdddggggggg',
      '...dgggddggggddggghgghhdddggddddgggddddDDddddggdddDDddddggdddDDDDdddDDdgggdddggggddgggddggggddhh',
      '..ggdddggghggdddggggggg...ddgggddggggdddddddggggdddgggggdddddddddgddddddggggdddggddddgggddggggdd',
      '..dddgggddggggdgggddggg..C.dddggddddggdddddddgggdddddggddddDDDDddDDDDDdggggdddgggddggggdddgggdd.',
      '..ddgggddgggdddggggddddd.C..ddDdddDDddddDDDddddddDDddddDDDdddddDDDD...ddgggddddggdddgggddddDDDD.',
      '..dddDDdddDDddddDDDdddDDC...DDDDDdDDDDDDDDDDD..C.DDDdDDDDDDDDdDDDDD.c..ddDDDddddDDdddDDDDdddDDD.',
      '..DggghhggggDgghhhhgggDD.....DDDDDDDDDDDDDDD..BCc.DDDDDDDDDDDDDDDD..c..DDggghhhDgggghhggghhhDD..',
      '..ggghggggddggghggggddggg.....DDDDDDDDDDDDD...BCc...DDDDDDDDDDDDD...c..dgggghgggddgggghhgggddd..',
      '..ddggggddgggdddggggddggg......DDDDDDDDDDD....BCc......DDDDDDDD.....c...gggddggggdgggddgggddd...',
      '...dddgggdddggddddgggdddd.......DDDDDDDDD.....BCc...................c...ddgggdddggggddgggdddd...',
      '...DDddddggddddDDDdddggdd.........DDDDD.......BCc.........ddgggddggdgggdddddggddddDDDdddDDDD....',
      '...DDDdddDDDDddDDDdddDDD.....ddgggddgdddggddggBCc........dgggdddggddgggdddDDDDdddDDDDDddDDD.....',
      '....DDDddDDDDDDdDDDDDDDD....gddgggdddggdddggddBCc........ddggddddgggdddggddDDDDdDDDDDDdDDD......',
      '....DDDDDDDDDDDDDDDDDDD.....ddggddddggdddgggddBCc.........dddggddddggddddDDDDDDDDDDDDDDDD.......',
      '......DDDDDDDDDDDDDDDDD.....dddgggddddggddddDDBCc.........DDdddggddddDDDDDDD..DDDDDDDDD.........',
      '.........DDDDDDDDDDDDD.......DDdddggddddDDDDDDBCc..........DDdddgggdddDDDDD.....DDDDDD..........',
      '............DDDDDDDDDD........DDDddgggddDDDDD.BCc...........DDDddDDDDDDDDD....BCc...............',
      '...............DDDDDDBBCc......DDDDDDDDDDDDD..BCc.............DDDDDDDDDD....BCc.................',
      '..............y........BCCcc.....DDDDDDDDD....BCc...............DDDDDD....BCc...................',
      '..............y..........BCCcc.....DDDDD......BCc..............DDDDDDDD.BCc.....................',
      '...........................BCCcc....y..y......BCc............BCc.....BCcc.......................',
      '..............................BCCcc.y..y......BCc..........BCc...BCCcc..........................',
      '.................................BCCcc........BCc.........BCc.BCCcc.............................',
      '....................................BCCcc.....BCc........BCCBCCc................................',
      '.......................................BCCcc..BCc.......BCCCcc..................................',
      '..........................................BCCcBCc......BCCcc....................................',
      '............................................BCcBCc...BCCcc......................................',
      '.............................................BCCcCc.BCCc........................................',
      '..............................................BCBCCBCcc.........................................',
      '..............................................BCBCCBCcc.........................................',
      '..............................................BCBCCBCcc.........................................',
      '..............................................BCBCCBCcc.........................................',
      '..............................................BCCBCCBcc.........................................',
      '..............................................BCCBCCBcc.........................................',
      '..............................................BCCBCCBcc.........................................',
      '.............................................BCCBCCBcc..........................................',
      '.............................................BCCBCCBcc..........................................',
      '.............................................BCCBCBCcc..........................................',
      '.............................................BCCBCBCcc..........................................',
      '.............................................BCBCCBCcc..........................................',
      '.............................................BCBCCBCcc..........................................',
      '.............................................BCBCCBCcc..........................................',
      '.............................................BCBCCBCcc..........................................',
      '............................................BBCBCCBCcc..........................................',
      '....................ssssss..ssssssssss.sssssBBCCBCCBCccsss......................................',
      '..........ssssssss.ssssssssssssss..ssssssssBBBCCBCCBCccCcssss...................................',
      '......ssssssssssss.ssssssssssssssssssss.sBSBBBCCCBCCBccCSCcssssss...............................',
      '....ssssssssssssssssssssssssssssssssssssSBBSBSBBBSSBSCCSCScssssssss....sss......................',
      '...sssssssssssssss.ssssssssssssssssssssssSSSSSSSSSSSSssssssssss..ssssss.........................',
      '....sssssssss..ssssssssssssssssss.ssssssssssssssSSSssssssssssss...ssss..........................',
      '......ssssssssss.ssssssssssss..ssssssssssssssssssss.ssssssssss.sss..............................',
      '.........ssssssss..ssssssssssssss.ssssssssssssssssss..ssssss....................................',
      '..............ssssssssss...ssssssssssssssss.ssssssssss..........................................',
      '......................ssssssssssssss....ssssssss................................................',
    ],
  },
  /**
   * 🌳 EL ALGARROBO DE LA HUIDA (y el de lejos, del otro lado de la vía en el galope): el mismo árbol dibujado de
   * nuevo con la mitad de los puntos. En la huida va con su punto (`celda: 2`), así que mide lo mismo que el del galope.
   */
  algarroboChico: {
    celda: 2,
    pie: [23, 31],
    mapa: [
      '.............................hhhhh..............',
      '..........................hh.hhhhhhhh...........',
      '................hhhh.....hhghhhhghhhhhh.........',
      '..............hhgghhhg.gddgghhhgghhhhhhhg.......',
      '............hggdggghhggdggddggghgggdgghhhh......',
      '...........ggddgggdgghhDddgggddggdgggggdhhhhhg..',
      '....hghhhhggdgggddgghgggggdggggddggghdgghgghhhh.',
      '..hggdgghhddDDdddDDdddddddDDddddDDdddggddgggddhh',
      '.ggddggghggDhhhghhhhDhhhhhhghhhhhDhhddgghgggddgg',
      '.dggddgggddg.gghgggddgggggddgggghgg.ddgggddgggdd',
      '.ddDdddDDdddC.ddgggdd.Bc.dddggdddd.cddDDDddDDddd',
      '.DgghhDgghhD...dDDDd..Bc..dDDDDd....DgghhDggghh.',
      '.gghgggddggg....DDD...Bc...DDDD......gggdggghh..',
      '..ddgggddggg..dggdggddBc....dggddggdd.ddgggddd..',
      '..DDDdddDDDD..ddgdddDDBc....ddgdddDDDD.ddDDDD...',
      '...DDDDDDDDD...ddDDDDDBc.....DDdDDDDD...DDDD....',
      '.....DDDDDDBc...DDDDD.Bc.......DDDDD..Bc........',
      '.......y.....Bc...y...Bc......Bc....Bc..........',
      '...............Bc.y...Bc.....Bc..BCc............',
      '.................Bc...Bc....Bc.BCc..............',
      '...................Bc.Bc...BCBCc................',
      '.....................BcBc.BCc...................',
      '......................BCcBc.....................',
      '......................BCBCc.....................',
      '......................BCBCc.....................',
      '......................BCBCc.....................',
      '.....................BCBCc......................',
      '.....................BCBCc......................',
      '.....................BCBCc......................',
      '..........sss.sssss.sBCBCcss....................',
      '.....ssss.ssssssssssBSBCCBCcss..................',
      '..ssssssssssssssssssSBSBCSCSssss..ss............',
      '.ssssssss.sssssssssssSSSSSSsssss.sss............',
      '...ssssss.sssssssss.ssssssssss.ss...............',
      '.......ssssssss..ssssssssss.....................',
    ],
  },
};

const guardados = new Map();
/**
 * El dibujo de un tipo ya pintado con su luz. `variante`: cuál de sus dibujos (los que tienen varios). Los que no
 * tienen dibujo de golpeados (las mesas, las agujas, el algarrobo) siguen parados aunque los choquen.
 */
function lienzo(tipo, golpeado, luz, variante = 0) {
  const T = OBSTACULOS[tipo];
  const O = T.variantes ? T.variantes[variante % T.variantes.length] : T;
  const caido = golpeado && !!T.golpeado;
  const clave = tipo + '|' + variante + '|' + (caido ? 1 : 0) + '|' + luz;
  if (guardados.has(clave)) return guardados.get(clave);
  const mapa = caido ? T.golpeado : O.mapa;
  const an = Math.max(...mapa.map((f) => f.length)), al = mapa.length;
  const indices = new Int16Array(an * al).fill(-1);
  mapa.forEach((fila, j) => {
    for (let i = 0; i < fila.length; i++) if (fila[i] !== '.') indices[j * an + i] = COLOR[fila[i]];
  });
  const cv = document.createElement('canvas');
  cv.width = an; cv.height = al;
  cv.getContext('2d').putImageData(new ImageData(iluminar({ ancho: an, alto: al, indices, campo: () => luz }), an, al), 0, 0);
  const g = { img: cv, pie: caido ? T.golpeadoPie : O.pie, an, al };
  guardados.set(clave, g);
  return g;
}

/** ¿Este tipo tiene su dibujo nuevo? */
export const tieneObstaculoNuevo = (tipo) => !!OBSTACULOS[tipo];

/** El revuelto de siempre: cuál variante le toca a cada lugar, siempre la misma. */
function revolver(n) {
  let t = (n * 374761393 + 668265263) | 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177);
  return (t ^ (t >>> 16)) >>> 0;
}

/**
 * Dibuja el obstáculo con el pie en (`ox`, `ob.y`), en el mundo (`ctx` con la cámara puesta). Se apoya en un punto
 * entero de la grilla, como el suelo con el que corre.
 */
export function dibujarObstaculoNuevo(ctx, ob, ox, noche, mojado = false, o = {}) {
  // (`o.chico`: en la huida, el que tenga su dibujo chico —el algarrobo— va con ése. `o.lejos`: del otro lado de la
  //  vía en el galope, el chico con el punto del galope, o sea a la mitad.)
  const tipo = (o.chico || o.lejos) && OBSTACULOS[ob.tipo + 'Chico'] ? ob.tipo + 'Chico' : ob.tipo;
  const paso = o.lejos ? PASO : PASO * (OBSTACULOS[tipo].celda || 1);
  const variante = revolver(Math.round(ob.x) * 31337 + Math.round(ob.y) * 6271);
  // (⛈️ Con tormenta, un escalón más oscuros, como la arena mojada.)
  const L = lienzo(tipo, ob.golpeado, noche ? CONFIG.tresCuartos.sueloNoche : mojado ? -1 : 0, variante);
  const x = Math.round(ox / paso) * paso - L.pie[0] * paso, y = Math.round(ob.y / paso) * paso - L.pie[1] * paso;
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(L.img, x, y, L.an * paso, L.al * paso);
  ctx.imageSmoothingEnabled = prev;
}
