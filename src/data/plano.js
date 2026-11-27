/**
 * 🗺️ EL PLANO DEL CAMPO: el terreno y las vías, pensados juntos *(Santi, 2026-11-24: "las vías no están conectadas a
 * los puestos donde deberían… que sí quede coherente. Por ejemplo, por qué pasa por acá, por qué hace esta curva,
 * visto desde un lado de un ingeniero"; y "no solo sirven para llevar algo, sino también personas")*.
 *
 * ES BORRADOR PARA QUE SANTI LO CORRIJA. Todavía no lo usa nadie: cuando lo apruebe, el campo (scenes/campoScene.js)
 * se arma desde acá y el mapa de papel (data/region.js) se vuelve a dibujar desde acá. Hoy es al revés, y por eso las
 * vías del papel (circuitos que dan vueltas, con los pueblos en las esquinas) no tienen sentido de cerca.
 *
 * PRIMERO EL TERRENO, DESPUÉS LA VÍA. Las reglas del ingeniero (ferrocarriles del oeste, 1870-1880):
 *   - Cada línea tiene un porqué: a quién lleva y qué lleva (`lleva`).
 *   - Pendiente suave: la vía rodea mesetas y lomas, va por los valles, y cruza la sierra por un túnel sólo donde no hay
 *     paso. Toda curva tiene una causa (`curvas`).
 *   - Las estaciones van en recta y en llano, con desvío y tanque; el pueblo crece AL LADO de la estación.
 *   - Los ríos se cruzan derechos, por lo angosto, con puente; los arroyos, con caballete de madera.
 *   - En la punta de cada línea se da vuelta la locomotora (`vuelta`): con una MESA GIRATORIA (gira la locomotora sola,
 *     que después pasa por el desvío al otro lado del tren) o con un TRIÁNGULO de vías (da vuelta el tren entero). Mientras
 *     tanto el tren queda parado un rato en la punta. Después vuelve por la misma vía.
 *
 * MEDIDAS: las del papel viejo (384×216, el marco va de 6 a 378 y de 6 a 210), como data/region.js antes de estirarse.
 *
 * 🧱 LOS BORDES *(Santi eligió "como en la huida, sin cielo", y antes: "por si después tenemos que agrandar más aún el
 * mapa podemos hacerlo sin romper el borde")*: la región termina en el marco, pero el terreno de los bordes SIGUE del
 * otro lado (la sierra hasta -40 arriba, el malpaís hasta -30 a la izquierda, los ríos hasta afuera), así la cámara
 * nunca ve un vacío. Al norte y al oeste no se llega (la sierra y el malpaís no se cruzan); al este, pasando el puente,
 * y al sur, pasando un vado, se llega hasta el marco, marcado con mojones. Para agrandar el mapa: correr el marco y
 * estos bordes, nada más.
 */
export const PLANO = {
  relieve: [
    {
      tipo: 'sierra', nombre: 'Sierra del Norte',
      porque: 'El techo de la región: de ahí bajan los arroyos, y en ella está la mina.',
      // (La mina queda al pie, con la boca hacia el llano: el ramal llega sin meterse en la sierra.)
      puntos: [[-30, -40], [414, -40], [414, 22], [378, 20], [352, 30], [330, 22], [300, 26], [272, 18], [244, 26], [214, 20], [184, 24],
        [152, 18], [122, 22], [104, 20], [96, 22], [84, 22], [68, 26], [40, 22], [6, 30], [-30, 32]],
    },
    {
      tipo: 'cerro', nombre: 'Cerro Solo',
      porque: 'Un cerro suelto en el llano: se ve de lejos, y desde arriba se ve todo el norte.',
      puntos: [[228, 50], [244, 48], [248, 60], [232, 64]],
      subidas: [[240, 62]],
    },
    {
      tipo: 'meseta', nombre: 'Mesa Larga',
      porque: 'Al norte del Paso. Arriba no hay agua ni nadie; abajo, al oeste, la granja de los Hale.',
      puntos: [[146, 64], [180, 60], [184, 96], [150, 98], [142, 80]],
      subidas: [[166, 97]],
    },
    {
      tipo: 'meseta', nombre: 'Mesa Quemada',
      porque: 'Al sur del Paso. La vía vieja la rodeaba por el sur, por el pozo de Puesto Seco.',
      puntos: [[192, 112], [250, 110], [258, 136], [204, 140]],
      subidas: [[240, 137]],
    },
    {
      tipo: 'meseta', nombre: 'Mesa Chica',
      porque: 'Al sur de tu campamento. Desde arriba se ve el ramal de San Cristóbal entero.',
      puntos: [[106, 108], [130, 106], [134, 122], [108, 126]],
      subidas: [[120, 124]],
    },
    {
      tipo: 'lomas', nombre: 'Lomas del Oeste',
      porque: 'Lomas bajas y piedra suelta: el caballo va lento, la vía no pasa.',
      puntos: [[24, 100], [62, 96], [66, 150], [30, 156]],
    },
    {
      tipo: 'lomas', nombre: 'Lomas del Bravo',
      porque: 'Al sur del fuerte, hasta la frontera.',
      puntos: [[290, 140], [340, 136], [350, 172], [296, 178]],
    },
    {
      tipo: 'malpais', nombre: 'El Malpaís',
      porque: 'El borde del oeste: barrancas rotas. La troncal lo cruza por una trinchera; a caballo no se pasa.',
      puntos: [[-30, 30], [6, 30], [22, 40], [16, 64], [18, 74], [14, 92], [24, 130], [14, 170], [6, 200], [-30, 200]],
    },
    {
      tipo: 'rio', nombre: 'Río Bravo', ancho: 6,
      porque: 'El borde del este. Hondo y rápido: se cruza sólo por el puente de la troncal, en lo angosto.',
      puntos: [[374, -10], [372, 6], [366, 40], [370, 72], [364, 104], [368, 130], [362, 160], [366, 210], [368, 240]],
      angosto: [364, 104],
    },
    {
      tipo: 'rio', nombre: 'Río de la Frontera', ancho: 4,
      porque: 'El borde del sur, y la frontera. Bajo: se cruza a caballo por los vados.',
      puntos: [[-30, 203], [6, 202], [60, 198], [120, 203], [180, 199], [240, 204], [300, 200], [366, 206], [414, 208]],
      vados: [[74, 199], [218, 202], [300, 200]],
    },
    {
      tipo: 'arroyo', nombre: 'Arroyo de la Viuda',
      porque: 'Baja de la mina. Piedra Roja está donde sale al llano, por el agua; el ramal de la mina sube por su valle.',
      puntos: [[92, 30], [92, 44], [84, 60], [80, 74], [84, 100], [86, 130], [80, 160], [76, 198]],
    },
    {
      tipo: 'arroyo', nombre: 'Arroyo Seco',
      porque: 'Es el que cortó el paso entre las dos mesas. En su arena apareció oro: por eso hay pueblo y la troncal pasa por ahí.',
      puntos: [[200, 22], [196, 50], [190, 80], [188, 104], [182, 130], [170, 170], [160, 201]],
    },
    {
      tipo: 'arroyo', nombre: 'Arroyo del Muerto',
      porque: 'Hondo y escondido, al sur de la Mesa Quemada. Desde el llano no se ve el fondo.',
      puntos: [[222, 140], [214, 160], [214, 176], [218, 202]],
    },
  ],

  lugares: [
    { id: 'piedraroja', x: 76, y: 74, porque: 'Donde el Arroyo de la Viuda sale al llano: agua y el mineral de la mina. Empalme de la troncal con los dos ramales.' },
    { id: 'pasodeloro', x: 186, y: 104, porque: 'El paso entre las dos mesas, sobre el Arroyo Seco. Pueblo del oro; empalme con el ramal del norte.' },
    { id: 'fuertebravo', x: 340, y: 108, porque: 'El fuerte cuida el puente sobre el Río Bravo, la única entrada del este.' },
    { id: 'alamoseco', x: 296, y: 36, porque: 'Al pie de la sierra, junto a un ojo de agua con álamos. Última estación antes del túnel.' },
    { id: 'sancristobal', x: 72, y: 174, porque: 'Misión vieja junto al vado de la frontera. Punta del ramal del sur.' },
    { id: 'laviuda', x: 92, y: 22.25, porque: 'La mina, metida en la sierra. Punta del ramal de la mina.' },
    { id: 'puestoseco', x: 232, y: 148, porque: 'Parada de agua de la vía vieja. Se secó el pozo y la vía quedó muerta.' },
    { id: 'campamento', x: 202, y: 80, porque: 'Tu campamento, lo más al medio posible *(Santi: "para que no sea tedioso ir de un lugar a otro")*: en la quebrada del Arroyo Seco, entre la Mesa Larga y el Cerro Solo. Agua, reparo, y la troncal a la vista.' },
    { id: 'granja', x: 140, y: 90, porque: 'Los Hale: al pie de la Mesa Larga, donde junta agua cuando llueve.' },
    { id: 'rennick', x: 214, y: 176, porque: 'Los Rennick, en el fondo del Arroyo del Muerto: cerca de la vía muerta y del vado.' },
  ],

  lineas: [
    {
      id: 'troncal', nombre: 'Línea de las Llanuras', entraDesdeAfuera: true,
      porque: 'La línea grande: viene del este, cruza la región y sigue al oeste. Es la razón por la que hay pueblos.',
      lleva: 'Pasajeros (colonos, viajantes, soldados, jugadores), el correo, ganado y mercadería; la paga del fuerte.',
      // De cada 10 trenes, cuántos son de pasajeros (borrador: se afina con el simulador).
      pasajeros: 0.6,
      puntos: [[384, 104], [340, 106], [270, 106], [200, 104], [170, 104], [140, 102], [104, 88], [76, 74], [40, 70], [0, 68]],
      estaciones: ['fuertebravo', 'pasodeloro', 'piedraroja'],
      tanques: [[270, 106]],
      puentes: [[366, 104]], caballetes: [[188, 104]], trincheras: [[18, 69]],
      curvas: [
        { en: [170, 104], porque: 'Pasado el Paso dobla al noroeste: al frente están la Mesa Chica y las lomas, y Piedra Roja tiene el agua.' },
        { en: [76, 74], porque: 'Entra derecha a Piedra Roja y sale hacia la trinchera del Malpaís, el único corte bajo.' },
      ],
    },
    {
      id: 'mina', nombre: 'Ramal de la Viuda',
      porque: 'Saca el mineral de la mina. Sube por el valle del arroyo porque es la única subida suave a la sierra.',
      lleva: 'Bajando, mineral. Subiendo, mineros y sus familias, la paga del mes, dinamita y víveres.',
      pasajeros: 0.2,
      // 🔁 Los dos ramales salían de Piedra Roja uno para arriba y otro para abajo y se veían como una cruz encima de la
      // troncal. Ahora cada uno sale PEGADO a la troncal y se abre con un desvío, como en un empalme de verdad.
      puntos: [[76, 74], [62, 72.5], [58, 62], [66, 48], [84, 40], [92, 32], [92, 23.4]],
      caballetes: [[91, 35]],
      estaciones: ['piedraroja', 'laviuda'], vueltaEn: 'laviuda',
      // En la mina no entra una mesa giratoria (el valle es angosto): un triángulo de vías, y el tren da vuelta entero.
      vuelta: 'triangulo',
      // 🔺 EL TRIÁNGULO (un "wye"): dos patas que salen de la vía y se juntan al este, del lado de afuera del arroyo, con
      // una cola corta. El tren llega a la mina de frente; sale marcha atrás por la pata de arriba hasta la cola; de
      // ahí sale de frente por la pata de abajo y vuelve a la vía mirando para Piedra Roja. Cada pata empieza pegada a
      // la vía (el desvío) y recién después se abre.
      triangulo: [
        [[86, 38], [89, 35], [93, 33.6], [99, 32.8], [104, 32.8]],
        // (Esta pata se junta con la otra casi de costado, ya pegada: ahí está el desvío de la cola.)
        [[92, 26], [92, 28.4], [94.6, 31], [97, 32.5], [99.5, 32.8]],
      ],
      curvas: [
        { en: [62, 72.5], porque: 'Sale de Piedra Roja por la troncal y se abre al norte con un desvío: no cruza ninguna vía.' },
        { en: [66, 48], porque: 'Sube por el faldeo del oeste del arroyo: es más largo, pero la pendiente es suave.' },
        { en: [92, 32], porque: 'Cruza el arroyo con un caballete y entra derecho a la boca de la mina.' },
      ],
    },
    {
      id: 'norte', nombre: 'Ramal del Norte y Línea del Territorio', entraDesdeAfuera: true,
      porque: 'Une la troncal con el territorio del norte, del otro lado de la sierra.',
      lleva: 'Jueces y funcionarios, colonos que suben, el correo del territorio; bajando, madera de la sierra.',
      pasajeros: 0.5,
      puntos: [[186, 104], [214, 104], [256, 70], [284, 40], [296, 36], [330, 38], [344, 28], [360, 0]],
      estaciones: ['pasodeloro', 'alamoseco'],
      tuneles: [[[344.4, 27.1], [354, 12]]],   // (la boca, justo al pie de la barranca)
      curvas: [
        { en: [214, 104], porque: 'Sale del Paso junto a la troncal y dobla al noreste: así el empalme queda en la estación.' },
        { en: [284, 40], porque: 'Se acuesta al pie de la sierra para entrar en recta y en llano a Álamo Seco.' },
        { en: [344, 28], porque: 'El túnel va por la parte más angosta del espolón de la sierra.' },
      ],
    },
    {
      id: 'sur', nombre: 'Ramal de San Cristóbal',
      porque: 'Une Piedra Roja con la frontera. Va por el valle del arroyo: plano y con agua.',
      lleva: 'Gente que va y viene de la frontera, trabajadores, comerciantes, el cura; ganado y plata del otro lado.',
      pasajeros: 0.5,
      puntos: [[76, 74], [90, 81], [94, 96], [90, 116], [88, 140], [78, 162], [72, 174]],
      estaciones: ['piedraroja', 'sancristobal'], vueltaEn: 'sancristobal', caballetes: [[80, 160]],
      // En la misión, mesa giratoria y galpón: se gira la locomotora sola y pasa por el desvío a la otra punta del tren.
      vuelta: 'mesa',
      curvas: [
        { en: [90, 81], porque: 'Sale de Piedra Roja pegado a la troncal y se abre al sur con un desvío.' },
        { en: [90, 116], porque: 'Pasa entre las Lomas del Oeste y la Mesa Chica, por el medio del valle.' },
        { en: [78, 162], porque: 'Cruza el arroyo con un caballete donde es angosto, y entra a la misión por el oeste.' },
      ],
    },
    {
      id: 'vieja', nombre: 'La vía vieja', servicio: false,
      porque: 'El primer trazado de la troncal rodeaba la Mesa Quemada por el pozo de Puesto Seco. Cuando se secó el pozo y apareció el oro en el arroyo, la cortaron por el Paso. Levantaron casi todo; queda el pedazo hasta el puesto, oxidándose.',
      lleva: 'Nada. Ya no pasa ningún tren.',
      // 🔁 (La punta subió 4: en el mapa de papel el puesto quedaba debajo del recuadro del horario.)
      puntos: [[262, 106], [266, 130], [254, 145], [232, 148]],
    },
  ],

  /**
   * 🛞 LOS CAMINOS: tramos rectos, cada uno derecho, acostado o en diagonal justa (tantos de ancho como de alto), y en
   * las esquinas un quiebre, sin curvas. 🔁 Eran líneas libres suavizadas: hacían panzas, y la carreta (que tiene ocho
   * vistas) quedaba torcida *(Santi, 2026-11-25: "hacelos de vuelta, intentando que no hagan curvas o panzas… la
   * carreta está desalineada con el camino")*. Unen los mismos lugares, rodean las mesetas y no van por la vía.
   */
  caminos: [
    { nombre: 'Camino Real', porque: 'El camino viejo de la frontera a la mina, de antes del tren. La vía lo copió.',
      // (derecho al norte por San Cristóbal hasta Piedra Roja, sigue al norte por el oeste del arroyo y sube en diagonal a la mina)
      puntos: [[74, 199], [74, 76], [76, 74], [76, 40], [86, 30], [92, 30]] },
    { nombre: 'Camino del Fuerte', porque: 'Del fuerte al vado del este: por ahí patrulla el ejército.',
      // (sale al sur, cruza las Lomas del Bravo en diagonal y baja derecho al vado)
      puntos: [[340, 108], [340, 124], [300, 164], [300, 200]] },
    { nombre: 'Camino de las Carretas', porque: 'Del Paso al vado del medio, por Puesto Seco. Por acá pasan las carretas que no pagan el tren.',
      // (baja al oeste del arroyo, lo cruza en diagonal, rodea la Mesa Quemada por el oeste y el sur, y del puesto
      // derecho al sur hasta el vado; derecho por el arroyo iba encima del cauce)
      puntos: [[186, 104], [180, 110], [180, 122], [206, 148], [232, 148], [232, 188], [218, 202]] },
    { nombre: 'Camino de la Granja', porque: 'De Piedra Roja al Paso, por los Hale.',
      // (al este por el norte de la vía, baja a la granja, y va entre la Mesa Larga y la vía hasta el Paso)
      puntos: [[76, 74], [124, 74], [140, 90], [150, 100], [182, 100], [186, 104]] },
  ],
};
