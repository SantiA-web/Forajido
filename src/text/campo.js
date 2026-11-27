/**
 * 🌵 LOS TEXTOS DEL CAMPO (scenes/campoScene.js). ⚠️ Provisorios, de la prueba chica. Lo que ve el jugador va con
 * tuteo neutro.
 */
export const TC = {
  ayuda: '[WASD] CABALGAR · [SHIFT] GALOPE · [CLIC] DISPARAR · [E] USAR · [F] BAJARTE · [M] MAPA',
  ayudaAPie: '[WASD] CAMINAR · [ESPACIO] AGACHARTE · [CLIC] DISPARAR · [E] USAR · [F] SUBIR AL CABALLO · [M] MAPA',
  frenaParaBajar: 'Frena primero para bajarte.',
  caballoLejos: 'Tu caballo está lejos.',
  ayudaMapa: '[M] [ESC] CERRAR',
  aguante: 'Aguante',
  cansado: 'El caballo no da más: al paso.',
  /** 🧱 Al llegar al borde de la región, según el lado. */
  borde: {
    norte: 'La sierra no se cruza.',
    oeste: 'Más allá, el malpaís sigue por días. No hay nada para ti allí.',
    este: 'Aquí empieza el Territorio. No conoces a nadie allí: mejor volver.',
    sur: 'Del otro lado está México. Por ahora, no tienes nada que hacer allí.',
  },

  /** 🌇 Esperar hasta la noche (de día) o hasta el día (de noche), cerca de un lugar o de una carreta. */
  esperar: { noche: '[N] Esperar hasta la noche', dia: '[N] Esperar hasta el día', yaNoche: 'Cayó la noche.', yaDia: 'Amaneció.' },

  /** Lo que dice la etiqueta al acercarte a algo. */
  usar: {
    campamento: '[E] Volver al campamento',
    pueblo: (nombre) => `[E] Entrar a ${nombre}`,
    puebloLejos: (nombre) => nombre,
    mina: '[E] Mina La Viuda',
    granja: '[E] La granja',
    rennick: '[E] El campamento de los Rennick',
    presa: (animal) => `[E] Carnear ${animal}`,
    presaMontado: (animal) => `[F] Bájate para carnear ${animal}`,
    montar: '[F] Subir al caballo',
    tanque: '[E] Dar de beber al caballo',
    puesto: '[E] Puesto Seco',
    carreta: '[E] Asaltar la carreta',
  },

  /** 🔫 Asaltar una carreta (world/asaltoCarreta.js). */
  carreta: {
    alto: '¡Alto! El conductor frena y levanta las manos.',
    siguio: 'La carreta sigue su camino, a toda prisa.',
    mataste: 'Mataste al conductor.',
    seRinde: '¡Me rindo! ¡No dispares!',
    niLoSuenes: '¡Ni lo sueñes! ¡Llevo escolta!',
    escapa: '¡La diligencia se sale del camino y escapa!',
    denuncia: (que, pueblo, n) => que + ' llegó a ' + pueblo + ' y te denunció. Recompensa: +$' + n + '.',
    seDefienden: 'La carreta frena: se bajan a pelear.',
    titulo: { colono: 'La carreta de los colonos', carga: 'La carreta de carga', mina: 'La carreta de la mina', diligencia: 'La diligencia' },
    cuerpo: 'El conductor tiene las manos arriba y no te quita los ojos de encima.',
    cuerpoMuerto: 'El conductor está tirado al lado de la carreta.',
    opciones: {
      plata: (n) => 'Llevarte la plata del conductor ($' + n + ')',
      plataMuerto: (n) => 'Revisarle los bolsillos ($' + n + ')',
      comida: (n) => 'Llevarte la comida (' + n + ' porciones)',
      bultos: (n) => 'Llevarte la carga (' + n + (n === 1 ? ' bulto' : ' bultos') + ' de mercadería)',
      irse: 'Dejarlo ir',
      irseMuerto: 'Irte',
    },
    bulto: 'Bulto de mercadería',
    tomaste: {
      plata: (n) => 'Te llevaste $' + n + '.',
      comida: (n) => 'Cargaste ' + n + (n === 1 ? ' porción' : ' porciones') + ' de comida en el caballo.',
      bultos: (n) => 'Cargaste ' + n + (n === 1 ? ' bulto' : ' bultos') + ' en el caballo. Véndelos al perista.',
    },
    noCabeBultos: 'El caballo no carga más bultos.',
    noCabeComida: 'El caballo no carga más comida.',
    cofre: (n) => 'Forzar el cofre de la paga ($' + n + ')',
    cajaCorreo: (n) => 'Forzar la caja del correo ($' + n + ')',
    pasajeros: (k, n) => 'Robarles a los ' + k + ' pasajeros ($' + n + ')',
    robastePasajeros: (n) => 'Los pasajeros te dieron todo: $' + n + '.',
    matastePasajero: 'Mataste a un pasajero.',
    cuerpoDiligencia: 'El cochero tiene las manos arriba y los pasajeros bajaron detrás de él. Bajo el pescante va la caja del correo.',
    forzando: 'Forzando el candado…',
    forzaste: (n) => 'Lo abriste: $' + n + '.',
    dejasteElCofre: 'Lo dejaste a medias.',
    dejasteAMedias: 'Te alejaste: lo dejaste a medias.',
    tomando: { plata: 'Tomando la plata…', carga: 'Cargando el caballo…', pasajeros: 'Revisando a los pasajeros…' },
    frenando: '¡Alto!…',
    cuerpoMina: 'El conductor tiene las manos arriba. En la caja hay un cofre con candados.',
    escopetero: ({ recompensa, fama }) => 'Mataste al escopetero.' + (recompensa ? ' Recompensa +$' + recompensa + ' · Fama +' + fama : ' Nadie te vio.'),
    jinete: ({ recompensa, fama }) => 'Mataste a un jinete de la escolta.' + (recompensa ? ' Recompensa +$' + recompensa + ' · Fama +' + fama : ' Nadie te vio.'),
    caiste: 'Caíste herido. Te esposaron ahí mismo.',
    cuentas: ({ recompensa, fama, honor, testigo }) => {
      const p = [];
      if (recompensa) p.push('Recompensa +$' + recompensa);
      if (fama) p.push('Fama +' + fama);
      if (honor) p.push('Honor ' + honor);
      return (testigo ? 'Te vieron. ' : 'Nadie te vio. ') + (p.length ? p.join(' · ') : 'Nadie sabe que fue el Cuervo.');
    },
    descargaste: (bultos, comida) => [bultos ? bultos + (bultos === 1 ? ' bulto' : ' bultos') + ' para el perista' : '', comida ? comida + (comida === 1 ? ' porción' : ' porciones') + ' de comida a la despensa' : ''].filter(Boolean).join(' y ') + '.',
  },

  /** Lo que no se puede cruzar (lo dice al chocar). */
  noSePasa: {
    barranca: 'La barranca es muy alta. Busca el sendero.',
    meseta: 'Una barranca a pique. Hay que rodearla o buscar el sendero.',
    cerro: 'Muy empinado para el caballo. Busca el sendero.',
    sierra: 'La sierra. Por aquí no se pasa.',
    malpais: 'Barrancas rotas: el caballo no pasa.',
    agua: 'El río es hondo aquí. Busca un vado.',
  },
  subiste: (nombre) => `Arriba de ${nombre}: desde aquí se ve lejos.`,
  bajaste: 'De vuelta en el llano.',
  escondido: 'En el arroyo: no te ven de lejos.',
  tanque: 'El caballo bebe del tanque de la vía.',
  puesto: 'Puesto Seco: la estación vieja, vacía. El pozo está seco y los rieles, oxidados.',

  noHayNada: (nombre) => `${nombre}. Por ahora no tienes nada que hacer aquí.`,
  mina: 'Hombres con polvo de mina en la ropa. Uno te mira demasiado. Mejor no quedarse.',

  granja: {
    titulo: 'La granja de los Hale',
    cuerpo: 'Un hombre flaco deja el balde y te mira llegar. Atrás, una mujer mete a los chicos en la casa.\n"Agua hay. Comida, poca. ¿Qué busca?"',
    opciones: {
      rennick: 'Preguntar por unos jinetes, los Rennick',
      agua: 'Pedir agua para el caballo',
      irse: 'Irse',
    },
    rennick: '"Pasan de noche, hacia el sur, para el lado del llano de las Llanuras. Cuatro o cinco. No paran aquí, y yo no pregunto."\nTe señala el sur con el mentón. En el suelo, junto al corral, hay huellas de caballos herrados.',
    rennickYa: '"Ya le dije lo que sé. Al sur."',
    agua: 'El hombre llena el balde. El caballo bebe largo.',
  },

  rennick: {
    encontraste: 'Humo detrás de las piedras: el campamento de los Rennick.',
    titulo: 'El campamento de los Rennick',
    cuerpo: 'Tres carpas, un fuego y seis caballos atados. Dos hombres juegan a las cartas. Eli no está.\nDesde aquí no te ven.',
    opciones: { mirar: 'Mirar un rato más', irse: 'Irse sin hacer ruido' },
    mirar: 'Uno de los hombres limpia una escopeta. Otro carga cajas en una carreta: dinamita, por cómo las trata.\n(⚠️ Prueba: aquí después se puede espiar, hablar con Eli o robarles.)',
  },

  /** 🦌 LA CAZA (world/fauna.js). */
  animal: { liebre: 'la liebre', berrendo: 'el berrendo', venado: 'el venado', coyote: 'el coyote', zorro: 'el zorro', guanaco: 'el guanaco' },
  piel: (tipo) => (tipo === 'zorro' ? 'el pelaje' : 'el cuero'),
  carneando: 'Carneando...',
  bajateParaCarnear: 'Para carnear tienes que bajarte del caballo: [F].',
  /** 🩸 Le pegaste y no cayó. */
  heriste: (animal) => 'Heriste ' + animal.replace(/^el /, 'al ').replace(/^la /, 'a la ') + ': sigue el rastro de sangre.',
  cueroAgujereado: (piel, pct) => 'Los balazos le hicieron agujeros a ' + piel + ': vale ' + pct + '% menos.',
  balas: (n, max) => 'Balas ' + n + '/' + max + ' · [R] recargar',
  recargando: 'Recargando...',
  carneoCortado: 'Dejaste de carnear.',
  carneaste: ({ animal, carne, piel, cuernos }) => {
    const cosas = [];
    if (carne) cosas.push(carne + (carne === 1 ? ' porción' : ' porciones') + ' de carne');
    if (piel) cosas.push(piel);
    if (cuernos) cosas.push('los cuernos');
    const lista = cosas.length > 1 ? cosas.slice(0, -1).join(', ') + ' y ' + cosas[cosas.length - 1] : cosas[0];
    return 'Carneaste ' + animal + (lista ? ': ' + lista + '.' : '.');
  },
  noCargaCarne: (n) => 'El caballo no carga más carne: dejaste ' + n + (n === 1 ? ' porción.' : ' porciones.'),
  noCargaCuero: 'No cabe otro cuero en el caballo: véndelos en el almacén.',
  /** 🩸 Tu vida, cuando no está entera. */
  vida: (n) => 'Vida ' + Math.max(0, Math.round(n)),
  carga: (carne, maxCarne, cueros, maxCueros, cuernos, bultos, comida) =>
    'Carne ' + carne + '/' + maxCarne + ' · Cueros ' + cueros + '/' + maxCueros + (cuernos ? ' · Cuernos ' + cuernos : '') + (bultos ? ' · Bultos ' + bultos : '') + (comida ? ' · Comida ' + comida : ''),
  descargaste: (n) => 'Bajaste ' + n + (n === 1 ? ' porción' : ' porciones') + ' de carne para la banda.',
  pistaEnElMapa: 'El sur, para el lado de las Llanuras: lo marcaste en el mapa.',

  mapa: {
    titulo: 'El desierto',
    tu: 'Tú',
    campamento: 'Campamento',
    granja: 'Granja',
    rennick: 'Rennick',
    pista: '¿Rennick?',
  },
};
