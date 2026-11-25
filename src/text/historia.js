/**
 * 📖 LOS TEXTOS DE LA HISTORIA (HISTORIA-DESIERTO.md, que manda: acá está copiado y ajustado para la pantalla). Los
 * diálogos van en la voz de cada uno (VOCES.md): Tommy le habla de usted a James; Santiago le dice "McCoy"; Frank,
 * "jefe". Lo demás, en neutro con tuteo *(Santi: textos del juego en neutro)*.
 *
 * Cada escena: `titulo`, `texto`, `opciones` (lo que dice cada botón) y `resultado` (lo que se lee después). Cualquiera
 * puede ser una función `(nombre, g)`; los botones que cuestan, `(dinero)`.
 *
 * 🎭 El texto se parte solo en pasos (quién dice qué: systems/pasos.js). Las que necesitan un papel grande (el diario,
 * el cartel, la nota del poste, el recado) traen `pasos` escritos a mano, con `dice`, `narra`, `carta`, `nota`,
 * `diario` y `cartel` *(Santi, 2026-11-23: "la historia es muy buena, pero no la estamos mostrando como se merece")*.
 * El `texto` queda igual al lado: es lo que leen las pruebas y lo que se ve si no hay pasos.
 */
import { HISTORIA } from '../data/historia.js';
import { hay } from '../systems/historia.js';
import { dice, narra, carta, nota, diario, cartel } from '../systems/pasos.js';

/** (Si uno de la banda sigue: para que no hable el que ya se fue.) */
const esta = (g, id) => !!(g && g.banda && g.banda[id] && g.banda[id].esta);

const M$ = HISTORIA.montos;
const J = (t) => `${t}\n\n—J.Mc.`;

export const TH = {
  /** 📖 EL LIBRO DE JAMES, la primera página (scenes/libro.js). */
  libro: {
    titulo: 'El libro de James',
    objetivo: 'Cole viene cuando el Cuervo pese.',
    coleYaViene: 'Cole ya viene. J.Mc. dice en qué tren.',
    fama: 'La fama del Cuervo',
    deTanto: (n, meta) => `${n} de ${meta}`,
    recompensa: 'La recompensa por tu cabeza',
    deTantoPlata: (n, meta) => `$${n} de $${meta}`,
    recompensaNota: (meta) => `Con $${meta}, la ley manda a Cole igual.`,
    sinSonar: (dias, minimo, tope, desconfia) => `Hace ${dias} días que el Cuervo no suena: para que suene, la fama tiene que subir ${minimo}. A los ${tope} días, J.Mc. ${desconfia ? 'desconfía' : 'escribe'}.`,
    desconfia: (cuota) => `J.Mc. desconfía: se lleva $${cuota} de cada golpe, hasta que el Cuervo vuelva a sonar.`,
    deuda: (n) => `Le debes $${n} a J.Mc.`,
    // 😈 (El que tentarían si el Cuervo sigue sin sonar.)
    tentado: (nombre, dias) => `${nombre} duda. Si el Cuervo no suena en ${dias === 1 ? '1 día' : dias + ' días'}, otra banda lo va a tentar.`,
    sinBajar: (dias, espera) => `Hace ${dias} días que nadie baja al pueblo. Rosa guarda los recados ${espera} días.`,
    recado: 'Un recado de Rosa, junto a la carpa.',
    abierto: 'Lo que está abierto',
    nada: 'Nada, por ahora.',
    tren: (tipo, fecha) => `${tipo} del ${fecha}`,
    aLa: (parte) => `, a la ${parte}`,
    tipo: { carga: 'el de carga', pasajeros: 'el de pasajeros' },
    encargo: {
      maletin: 'El maletín de J.Mc.', veterano: 'El veterano, para Tommy', libro: 'El libro de Rosa',
      guardia: 'El guardia del pañuelo amarillo', hollister: 'El ranger viejo, para Frank', preso: 'El preso de la barba roja',
      sobrino: 'El sobrino de Dagget', cole: 'Reuben Cole',
    },
    traido: { maletin: 'Tienes el maletín. J.Mc. lo quiere cerrado.' },
    paga: 'La paga de La Viuda',
    ayuda: '[L] [ESC] CERRAR',
  },

  /**
   * 🎬 EL PRÓLOGO *(Santi: "tiene que conocer la historia de él desde el principio, porque es su historia")*. Eligió
   * cuadros dibujados con narración; mientras no estén los dibujos, va el texto solo, una página por cuadro.
   */
  prologo: {
    titulo: 'James McCoy',
    paginas: [
      'Tenía trece años cuando me dijeron que mi padre había muerto.\n\nSe había ido a la guerra con una guerrilla del Sur. Lo mataron en una emboscada. El que la mandaba era un capitán del Norte: Reuben Cole.\n\nMi madre no lloró delante de nosotros.',
      'Doce años después, mi madre y mi hermano se fueron a México. Yo me quedé.\n\nEn un baúl que ella dejó encontré el pañuelo de mi padre: negro, con un pájaro bordado y la punta quemada.\n\nMe lo quedé.',
      'No fui forajido. Pero tampoco fui honrado.\n\nRobaba ganado, le cambiaba las marcas y lo cruzaba por la frontera. Una vez le pisé un negocio grande a los hermanos Rennick.',
      'Me casé. Tuvimos un hijo.\n\nUna noche entraron unos hombres a mi casa. Mataron al chico.\n\nSé quiénes fueron. Los Rennick. Por lo del ganado. Por mí.',
      'Mi mujer aguantó dos años. Después no aguantó más.\n\nLa enterré en 1884. Esa misma tarde, un chico que no conocía me trajo una carta.\n\nEstaba firmada "J.Mc.".',
    ],
    seguir: 'Seguir',
    empezar: 'Empezar',
  },

  /**
   * La primera carta (la escena `encargo`, la de siempre, con otro texto). 🔁 2026-11-23: con el objetivo a la vista,
   * que el nombre del Cuervo pese *(Santi: "no existe un objetivo claro, el jugador no sabe hacia dónde va ni por
   * qué")*. Reemplaza a la de "te entrego al hombre que mató a tu padre".
   */
  carta1: {
    titulo: 'La carta',
    texto: J(`McCoy: sé quién eres. Sé quién fue tu padre, y sé quién lo emboscó: Reuben Cole, que ahora es marshal federal. Sé lo de tu mujer y tu chico.\n\nCole caza a los que salen en los diarios. Haz que el nombre del Cuervo pese, y Cole va a venir a buscarte. Yo te voy a decir en qué tren.\n\nMientras tanto, trabajas para mí: asaltas los trenes que te diga, y de cada uno me dejas $200 junto a tu carpa. La banda ya te espera. Nadie más que tú tiene que leer esto.`),
    opciones: { leer: 'Guardar la carta' },
    resultado: { leer: 'Doblas la carta. Frank, Santiago y Tommy te miran desde el fuego. Ninguno sabe por qué el que manda eres tú.' },
  },

  escenas: {
    h_manda: {
      titulo: '¿Por qué él manda?',
      texto: 'Frank: "Una pregunta, jefe, sin ofender. Yo hace treinta años que ando a caballo, el mexicano tira mejor que los dos juntos, y el chico... bueno, el chico corre. ¿Por qué el que manda es usted?"\n\nSantiago: "Es buena pregunta, McCoy."\n\nTommy no dice nada. Te mira.',
      opciones: {
        carta: 'Mostrarles la carta de J.Mc.',
        fuerza: '"El que no esté de acuerdo, puede irse."',
        broma: '"Alguien tiene que hacerlo. Mañana cocina Frank."',
      },
      resultado: {
        carta: 'La carta pasa de mano en mano. Santiago la lee dos veces. Tommy: "Entonces confía en usted, señor." Frank se rasca la barba y no dice nada.',
        fuerza: 'Nadie se va. Santiago asiente, despacio. Frank se ríe, pero no le sale.',
        broma: 'Frank se ríe tanto que se le cae el sombrero. Santiago escupe al fuego: no le contestaste.',
      },
    },
    h_latas: {
      titulo: 'Las latas',
      texto: 'Santiago puso latas sobre una piedra y le enseña a tirar a Tommy.\n\nSantiago: "No cierres el ojo. Si cierras el ojo, el otro te ve primero."\n\nTommy: "¿Señor McCoy, quiere probar?"',
      opciones: { sumarte: 'Sumarte', dejar: 'Dejarlos', noBalas: '"No gasten balas."' },
      resultado: {
        sumarte: 'Tiras tres veces. Tommy voltea dos latas, y Santiago casi sonríe.',
        dejar: 'Desde la carpa los oyes tirar toda la mañana. Al final, Tommy le pega a todas.',
        noBalas: 'Santiago guarda el revólver sin decir nada. Tommy junta las latas, colorado.',
      },
    },
    h_jmc_maletin: {
      titulo: 'Una carta de J.Mc.',
      texto: J('McCoy: pasa un tren de carga (lo tienes marcado en el mapa). En el furgón de cola, en el escritorio del encargado, hay un maletín de cuero con lacre rojo. Tráemelo cerrado.'),
      opciones: { leer: 'Guardar la carta' },
      resultado: { leer: 'El tren quedó marcado en el mapa: "J.MC.".' },
    },
    h_maletin_que: {
      titulo: 'El maletín de J.Mc.',
      texto: 'Esta noche pasa J.Mc. El maletín está en tu carpa, con el lacre rojo intacto.',
      opciones: {
        entregar: 'Dejarlo cerrado junto a la carpa',
        abrirEntregar: 'Abrirlo, y después dejarlo',
        abrirGuardar: 'Abrirlo y quedarte con lo que hay',
        vender: `Vendérselo al perista ($${M$.venderMaletin})`,
      },
      resultado: {
        entregar: 'A la mañana el maletín no está. Tampoco hay carta. J.Mc. ya no te cobra lo que le debías.',
        abrirEntregar: `Adentro: horarios de trenes con el sello de la compañía del ferrocarril, y un sobre que dice "para los de la mina". Lo vuelves a cerrar como puedes.\n\nA la mañana hay una nota: "Te dije cerrado. —J.Mc."`,
        abrirGuardar: `Adentro: horarios de trenes con el sello de la compañía del ferrocarril, y un sobre con $${M$.sobre} que dice "para los de la mina". Te quedas con todo.\n\nA la mañana hay una nota: "Te dije cerrado. —J.Mc."`,
        vender: `El perista lo abre delante tuyo, mira los papeles con sello del ferrocarril y paga sin regatear.\n\nA los dos días, una carta: "La próxima vez que vendas lo mío, el cartel va a tener tu nombre. —J.Mc." Tu recompensa sube $${M$.recompensaVender}.`,
      },
    },
    h_cuervo: {
      titulo: 'El diario',
      texto: 'EL CUERVO ASALTA EL TREN. Testigos describen a un bandido con un pañuelo negro bordado con un pájaro. El sheriff Dagget, de Cardón Rojo, ofrece $100 por su captura.\n\nFrank: "¡Jefe, salió en el diario! \'El Cuervo\'. Suena a novela."\n\nSantiago: "Suena a horca."',
      pasos: (n, g) => [
        diario('EL CUERVO ASALTA EL TREN', 'Testigos describen a un bandido con un pañuelo negro bordado con un pájaro. Nadie le vio la cara. El sheriff Dagget, de Cardón Rojo, ofrece $100 por su captura.'),
        ...(esta(g, 'frank') ? [dice('frank', '¡Jefe, salió en el diario! "El Cuervo". Suena a novela.', 'Frank')] : []),
        ...(esta(g, 'santiago') ? [dice('santiago', 'Suena a horca.', 'Santiago')] : []),
      ],
      opciones: { seguir: 'Seguir' },
      resultado: { seguir: (n, g) => (esta(g, 'frank') ? 'Frank recorta la nota y se la guarda en el sombrero.' : 'Recortas la nota y la guardas.') },
    },
    h_panuelo: {
      titulo: 'Santiago',
      texto: '"McCoy. Ese pañuelo te va a colgar. Si bajas al pueblo, sácatelo."',
      opciones: { guardar: 'Guardarlo para bajar al pueblo', dejar: '"Es de mi padre. No me lo saco."' },
      resultado: {
        guardar: 'Lo doblas y lo guardas en el bolsillo de adentro.',
        dejar: 'Santiago se encoge de hombros: "Es tu cuello."',
      },
    },
    h_capataz: {
      titulo: 'Un recado del pueblo',
      texto: 'Un chico trae un papel sucio de un hombre de la mina: "La Viuda paga a su gente en un tren que nadie anuncia. Yo sé cuándo. Cuarenta dólares, y cuando cobres, mi parte. Estoy en la cantina."',
      pasos: [
        narra('Un chico trae un papel sucio, doblado en cuatro. Huele a mina.'),
        nota('La Viuda paga a su gente en un tren que nadie anuncia. Yo sé cuándo. Cuarenta dólares, y cuando cobres, mi parte. Estoy en la cantina.', 'un amigo de la mina'),
      ],
      opciones: { pagar: (n) => `Mandarle $${n}`, no: 'No' },
      resultado: {
        pagar: 'Cuando pase la paga, vas a saber el día y la hora.',
        no: 'El chico se va. La paga, si te enteras, será por otro lado.',
      },
    },
    h_plata_casa: {
      titulo: 'Santiago',
      texto: '"McCoy. Adelántame sesenta. Es para mandar."\n\nNo dice a quién. No hace falta.',
      opciones: { dar: (n) => `Dárselos ($${n})`, despues: '"Después del reparto, como todos."' },
      resultado: {
        dar: 'Los cuenta dos veces. "Gracias, McCoy." Esa noche escribe una carta larga.',
        despues: 'No dice nada. Se va a dormir lejos del fuego.',
      },
    },
    h_tommy_escribe: {
      titulo: 'Tommy',
      texto: 'Tommy escribe a la luz del fuego. Cuando te ve, dobla el papel.\n\n"Es para mi padre, señor McCoy. Para que sepa que estoy bien."',
      opciones: { creer: 'Creerle', apretar: '"¿Tu padre sabe leer de noche?"' },
      resultado: {
        creer: 'Tommy guarda la carta en el chaleco. Mañana la lleva al correo.',
        apretar: 'Se pone colorado. "Es... para un amigo. De mi padre." Miente mal.',
      },
    },
    h_veterano_pide: {
      titulo: 'Tommy',
      texto: '"Señor McCoy, en uno de pasajeros viaja un veterano. Del Norte, como mi padre. Dicen que estuvo en Barranca Yaco. ¿Le podría preguntar... por el tren del oro? Yo no puedo subir. Usted sí."',
      opciones: { aceptar: '"Le pregunto."', no: '"No vamos a ese tren."' },
      resultado: {
        aceptar: 'El tren quedó marcado en el mapa: "TOMMY". Tommy no para de hablar en toda la noche.',
        no: '"Sí, señor." Se va a limpiar el revólver sin mirarte.',
      },
    },
    h_veterano_dentro: {
      titulo: 'En el tren: el veterano',
      texto: 'En el segundo vagón, un viejo con una pierna de palo no se asusta del revólver. Te mira el pañuelo.',
      opciones: { hablar: 'Preguntarle por Barranca Yaco', dejar: 'Seguir de largo' },
      resultado: {
        hablar: '"¿Barranca Yaco? Yo era cabo en ese tren, muchacho. Dijeron que el teniente Kennedy abrió la puerta. Mentira. Kennedy estaba conmigo, en el vagón de adelante. Alguien abrió desde adentro. Uno de los nuestros, o uno que se vistió de nuestro."',
        dejar: 'Pasas de largo. El viejo te sigue con la mirada hasta la puerta.',
      },
    },
    h_veterano_tommy: {
      titulo: 'Tommy',
      texto: '"¿Y, señor? ¿Lo encontró? ¿Qué le dijo?"',
      opciones: { contar: 'Contarle todo', mentir: '"No dijo nada."' },
      resultado: {
        contar: 'Tommy se queda callado un rato largo. Después dice, bajito: "Lo sabía. Mi padre no abrió esa puerta." Es la primera vez que lo ves llorar.',
        mentir: '"Ah." Tommy asiente. "Gracias por preguntar, señor." No te cree del todo.',
      },
    },
    h_anillo: {
      titulo: 'Frank',
      texto: 'Frank no duerme. Le da vueltas a un anillo chico entre los dedos gordos.\n\n"Era de ella. ¿Sabe cómo me llegó, jefe? En una carta. Como un regalo." Se ríe, y no es una risa. "Un amigo. Un amigo que me va a dar un nombre."',
      opciones: { preguntar: '"¿Qué amigo?"', quitar: 'Sacarle la botella', dejar: 'Dejarlo' },
      resultado: {
        preguntar: '"Uno que firma con iniciales, como el suyo, jefe." Se guarda el anillo y se da vuelta.',
        quitar: 'Te da la botella sin pelear. Antes de dormirse dice algo de "ella" que no se entiende.',
        dejar: 'Lo dejas con el anillo y la botella. A la mañana, no se acuerda de nada.',
      },
    },
    h_rosa_libro: {
      titulo: 'Un recado de Rosa',
      texto: 'Rosa, la de la cantina: "A mi marido lo aplastó La Viuda, en el pozo tres. Dicen que fue culpa suya, que estaba borracho. No tomaba. En el tren de la paga va el libro de la mina, el del pagador. Ahí está lo que pasó en el pozo tres. Tráemelo y no te vas a olvidar de Rosa."',
      opciones: { aceptar: '"Te lo traigo."', no: 'No' },
      resultado: {
        aceptar: 'Si encuentras el tren de la paga, el libro va en el furgón de cola.',
        no: 'El chico que trajo el recado se va sin respuesta.',
      },
    },
    h_libro_dentro: {
      titulo: 'En el tren: el libro de la mina',
      texto: 'En el furgón de cola, entre las bolsas de la paga, está el libro del pagador. En la hoja del pozo tres dice: "Vigas de pino en vez de quebracho. Ahorro: $340." Y abajo: "Accidente. Culpa del minero."',
      opciones: {
        rosa: 'Llevárselo a Rosa',
        capataz: `Vendérselo al capataz ($${M$.libroCapataz})`,
        dagget: 'Dárselo a Dagget',
        dejar: 'Dejarlo en el tren',
      },
      resultado: {
        rosa: 'Rosa lo lee en la cocina de la cantina. No llora. "No me voy a olvidar", dice.',
        capataz: 'El capataz lo tira al fuego sin abrirlo. Rosa se va a enterar.',
        dagget: 'Dagget hojea el libro y sonríe: con esto, la mina le va a subir el sueldo. "Te debo una, Cuervo."',
        dejar: 'El libro se queda donde estaba.',
      },
    },
    h_parte1: {
      titulo: 'Un recado del capataz',
      texto: () => `"Cobraste la paga. Mi parte: $${M$.parteCapataz}. Ya sabes dónde estoy."`,
      pasos: () => [nota(`Cobraste la paga. Mi parte: $${M$.parteCapataz}. Ya sabes dónde estoy.`, 'el de la mina')],
      opciones: { pagar: (n) => `Mandársela ($${n})`, no: 'No mandarle nada' },
      resultado: { pagar: 'El chico se lleva la plata.', no: 'El chico se va con las manos vacías.' },
    },
    // ✉️ Las cartas de la fama (data/historia.js, `jmc`; HISTORIA-DESIERTO.md, "Cuando la fama sube, y cuando no").
    h_jmc_bien: {
      titulo: 'Una carta de J.Mc.',
      texto: J('McCoy: hiciste un buen trabajo. En Fuerte Riley ya preguntan por el Cuervo, y Cole lee los mismos diarios que todos. Falta poco.'),
      opciones: { leer: 'Guardar la carta' },
      resultado: { leer: 'La fama del Cuervo va por la mitad del camino.' },
    },
    h_jmc_efectivos: {
      titulo: 'Una carta de J.Mc.',
      texto: J('McCoy: seis días y ni una línea en los diarios. Los asaltos tienen que ser efectivos. Cole no cruza el desierto por un ladrón de gallinas. Acuérdate de por qué estás ahí.'),
      opciones: { leer: 'Guardar la carta' },
      resultado: { leer: 'El Cuervo no suena. Un golpe grande, o unos cuantos chicos, y J.Mc. se calla.' },
    },
    h_jmc_desconfia: {
      titulo: 'Una carta de J.Mc.',
      texto: J(`McCoy: doce días, y el Cuervo sigue sin sonar. Empiezo a pensar que me equivoqué contigo. Desde hoy, de cada golpe me dejas $${HISTORIA.jmc.cuotaDesconfia}, hasta que vuelva a leer tu nombre.`),
      opciones: { leer: 'Guardar la carta' },
      resultado: { leer: `J.Mc. desconfía. Desde hoy se lleva $${HISTORIA.jmc.cuotaDesconfia} de cada golpe, hasta que la fama del Cuervo vuelva a subir.` },
    },
    // *(Santi: "falsifica que los Cuervos asaltaron un tren… ese tren en realidad lo asaltaron los Rennick y a John le
    // vino como anillo al dedo")*.
    h_jmc_rennick: {
      titulo: 'El diario, y una carta',
      texto: J('El diario: "EL CUERVO MATA A TRES EN EL DE LAS 9. El marshal federal Reuben Cole viaja a Cardón Rojo."\n\nFrank: "¿Tres muertos en el de las 9? Jefe… nosotros no fuimos."\n\nY una carta:\n\nMcCoy: los Rennick te hicieron el trabajo. Yo sólo me ocupé de que el diario dijera tu nombre. Cole ya viene. Esto te lo cobro.'),
      pasos: (n, g) => [
        diario('EL CUERVO MATA A TRES EN EL DE LAS 9', 'Tres muertos en el tren de carga de las 9. Los testigos hablan de un pañuelo negro con un pájaro. El marshal federal Reuben Cole viaja a Cardón Rojo para cazar al Cuervo.'),
        ...(esta(g, 'frank') ? [dice('frank', '¿Tres muertos en el de las 9? Jefe… nosotros no fuimos.', 'Frank')] : []),
        ...(esta(g, 'santiago') ? [dice('santiago', 'Los Rennick. Ese tren era de ellos.', 'Santiago')] : []),
        narra('Esa noche, junto a la carpa, una carta.'),
        carta('McCoy: los Rennick te hicieron el trabajo. Yo sólo me ocupé de que el diario dijera tu nombre. Cole ya viene. Esto te lo cobro.'),
      ],
      opciones: { leer: 'Guardar la carta' },
      resultado: { leer: `La ley cree que mataste a tres: tu recompensa sube $${HISTORIA.jmc.recompensaRennick}. Y le debes $${HISTORIA.jmc.deudaRennick} más a J.Mc.` },
    },
    h_jmc_guardia: {
      titulo: 'Una carta de J.Mc.',
      texto: J('McCoy: en el de pasajeros que tienes marcado, el guardia del vagón correo lleva un pañuelo amarillo. No lo toques. Dile "Barranca". Te va a dar una llave.'),
      opciones: { leer: 'Guardar la carta' },
      resultado: { leer: 'El tren quedó marcado en el mapa: "J.MC.".' },
    },
    h_guardia_dentro: {
      titulo: 'En el tren: el pañuelo amarillo',
      texto: 'En el vagón correo, un guardia con un pañuelo amarillo al cuello baja el arma cuando te ve.',
      opciones: { hablar: 'Decirle "Barranca"', matar: 'Dispararle', nada: 'Ni una cosa ni la otra' },
      resultado: {
        hablar: `Te da una llave chica. "El jefe dice que no te saques el pañuelo. Que te queda bien." La llave abre la caja fuerte del correo: $${M$.llave} más.`,
        matar: `Cae sin sacar el revólver. A los dos días, una carta: "Mataste a uno de los míos. Eso se paga. —J.Mc." Le debes $${M$.multaGuardia} más.`,
        nada: 'Lo dejas. Él te mira irte sin entender.',
      },
    },
    h_eli_aviso: {
      titulo: 'Un aviso en el camino',
      texto: 'En un poste del camino, un cuchillo atraviesa un papel: "EL CUERVO: ESA PLATA ERA NUESTRA. UNA VEZ SE PERDONA. —E. RENNICK."\n\nSantiago: "Rennick. Conozco el nombre. No perdonan dos veces."\n\nTú también lo conoces. Los que mataron a tu hijo.',
      pasos: (n, g) => [
        narra('En un poste del camino, un cuchillo atraviesa un papel.'),
        nota('EL CUERVO: ESA PLATA ERA NUESTRA. UNA VEZ SE PERDONA.', 'E. RENNICK'),
        ...(esta(g, 'santiago') ? [dice('santiago', 'Rennick. Conozco el nombre. No perdonan dos veces.', 'Santiago')] : []),
        narra('Tú también lo conoces. Los que mataron a tu hijo.'),
      ],
      opciones: { seguir: 'Arrancar el papel' },
      resultado: { seguir: 'Lo arrancas. El cuchillo te lo quedas.' },
    },
    h_frank_ranger: {
      titulo: 'Frank',
      texto: '"Jefe, en un tren de carga va de custodio un ranger viejo, Walt Hollister. Fuimos compañeros, cuando yo era ranger. Sí, jefe: yo fui ranger. Si lo encuentra... no lo mate. Ya está viejo para morirse de un tiro."',
      opciones: { aceptar: '"No lo toco."', no: '"Si me tira, le tiro."' },
      resultado: {
        aceptar: 'El tren quedó marcado en el mapa: "FRANK". Frank no hace chistes en toda la noche.',
        no: '"Entendido, jefe." No te mira.',
      },
    },
    h_hollister_dentro: {
      titulo: 'En el tren: Walt Hollister',
      texto: 'En el vagón de carga, un guardia de barba blanca te apunta con una escopeta. Es el que mejor tira del tren.',
      opciones: { dejar: 'Desarmarlo y dejarlo', hablar: 'Desarmarlo y decirle que vas con Frank Monroe', matar: 'Dispararle' },
      resultado: {
        dejar: 'Le sacas la escopeta. Te mira irte sin decir nada.',
        hablar: '"¿Monroe está contigo?" Baja la vista. "Dile que el caso de su mujer lo cerraron de arriba. No fuimos nosotros."\n\nEsa noche se lo cuentas a Frank. No hace chistes.',
        matar: 'Cae de espaldas sobre las cajas. Esa noche Frank se entera. No te habla, y la botella le dura hasta el amanecer.',
      },
    },
    h_emboscada: {
      titulo: 'La emboscada',
      texto: 'A la noche, disparos desde las piedras. "¡Cuervo! ¡Te dije una vez!"\n\nPelean a oscuras hasta que los Rennick se retiran. Uno no llega a irse: el más chico, Abel, de la edad de Tommy, tirado en el suelo y desarmado.',
      opciones: { perdonar: 'Dejarlo ir', matar: 'Matarlo' },
      resultado: {
        perdonar: 'Abel se va arrastrándose. Antes de irse te mira: no entiende por qué. Uno de la banda quedó herido en la pelea.',
        matar: 'Ya no hay vuelta con los Rennick. Uno de la banda quedó herido en la pelea.',
      },
    },
    h_jmc_preso: {
      titulo: 'Una carta de J.Mc.',
      texto: J('McCoy: en el de carga que tienes marcado van dos presos para la horca de Fuerte Riley. Saca al de la barba roja. No preguntes.'),
      opciones: { leer: 'Guardar la carta' },
      resultado: { leer: 'El tren quedó marcado en el mapa: "J.MC.".' },
    },
    h_preso_dentro: {
      titulo: 'En el tren: los presos',
      texto: 'En un vagón cerrado, dos presos encadenados.\n\nEl de la barba roja: "¿Te manda el jefe? Ya era hora."\n\nEl otro, un muchacho flaco: "Señor, a mí también. Me robé un caballo, nada más. Me van a colgar por un caballo."',
      opciones: {
        barba: 'Sacar al de la barba roja',
        dos: 'Sacar a los dos',
        muchacho: 'Sacar sólo al muchacho',
        ninguno: 'No sacar a ninguno',
      },
      resultado: {
        barba: 'Salta del tren sin dar las gracias. Antes de irse: "Dile al jefe que estamos a mano." No dice su nombre.',
        dos: 'Saltan los dos. El de la barba roja se va sin mirar atrás. El muchacho te da la mano: "No me voy a olvidar de usted, señor."',
        muchacho: 'El muchacho salta llorando de alegría. El de la barba roja te grita algo que se lleva el viento.',
        ninguno: 'Los dejas. El de la barba roja escupe al piso.',
      },
    },
    h_dagget_sobrino: {
      titulo: 'Un recado de Dagget',
      texto: 'El sheriff Dagget, por medio de un chico: "Mi sobrino Lyle es guardia en el tren de la paga. El muchacho no sirve para esto, pero es mi sangre. Si vuelve vivo, te olvido una fianza. Si no, te olvido a ti... colgado."',
      pasos: [
        narra('Un chico trae un papel con el membrete de la oficina del sheriff.'),
        nota('Mi sobrino Lyle es guardia en el tren de la paga. El muchacho no sirve para esto, pero es mi sangre. Si vuelve vivo, te olvido una fianza. Si no, te olvido a ti... colgado.', 'Sheriff Dagget'),
      ],
      opciones: { aceptar: '"Vuelve vivo."', no: 'No contestar' },
      resultado: {
        aceptar: 'El sobrino va en el próximo tren de la paga.',
        no: 'El chico se va sin respuesta.',
      },
    },
    h_sobrino_dentro: {
      titulo: 'En el tren: el sobrino de Dagget',
      texto: 'En el furgón de la paga, un guardia joven al que le tiemblan las manos te apunta. Ni siquiera le sacó el seguro.',
      opciones: { vivo: 'Desarmarlo', matar: 'Dispararle' },
      resultado: {
        vivo: 'Le sacas el revólver. Se sienta en el piso y se tapa la cara.',
        matar: `Lyle cae. Dagget ya no se vende: te va a buscar él mismo, con la escopeta. Tu recompensa sube $${M$.dagget}.`,
      },
    },
    h_parte2: {
      titulo: 'Un recado del capataz',
      texto: () => `"Otra paga. Otra parte: $${M$.parteCapataz}. La mina ya me mira raro."`,
      pasos: () => [nota(`Otra paga. Otra parte: $${M$.parteCapataz}. La mina ya me mira raro.`, 'el de la mina')],
      opciones: { pagar: (n) => `Mandársela ($${n})`, no: 'No mandarle nada' },
      resultado: { pagar: 'El chico se lleva la plata.', no: 'El chico se va con las manos vacías.' },
    },
    h_jmc_norte: {
      titulo: 'Una carta de J.Mc.',
      texto: J('McCoy: el desierto ya dio lo que tenía. En Vacas Gordas, al norte, el ganado viaja con la paga de las estancias, y nadie allá sabe lo que es un asalto. Quiero a la banda en la pradera antes de que termine el mes.'),
      opciones: { leer: 'Guardar la carta' },
      resultado: { leer: 'Al norte.' },
    },
    h_santiago_norte: {
      titulo: 'Santiago',
      texto: '"McCoy. Al norte no. Mi gente está al sur. Del otro lado. Cada día al norte es un día más para volver."',
      opciones: {
        convencer: '"Es la orden. Y la plata está allá."',
        adelantar: (n) => `Adelantarle $${n} para mandar a su familia`,
        prometer: '"Te prometo que volvemos."',
      },
      resultado: {
        convencer: 'Santiago te mira un rato. "La plata." Escupe. "Siempre la plata."',
        adelantar: 'Cuenta los billetes. "Esto llega antes que yo." Esa noche escribe otra carta larga.',
        prometer: '"Te lo voy a cobrar, McCoy." Es tu palabra.',
      },
    },
    h_se_seca: {
      titulo: 'Un recado de Rosa',
      texto: (n, g) => (hay(g, 'pagaAsaltada') && hay(g, 'paga2Asaltada')
        ? 'La Viuda cerró dos pozos: sin paga, no hay mineros. El almacén subió los precios y el perista se fue del pueblo.\n\nRosa manda a decir: "Esto se muere. Y tú ayudaste."'
        : 'En Cardón Rojo ya no queda nada para robar. Rosa manda a decir: "Los trenes buenos se fueron al norte. Tú también deberías."'),
      opciones: { seguir: 'Seguir' },
      resultado: { seguir: 'El desierto ya no da.' },
    },
    h_cole_viene: {
      titulo: 'El diario, y una carta',
      texto: J('El diario: "El marshal federal Reuben Cole llega a Cardón Rojo para cazar al Cuervo. Cole es conocido por colgar rápido."\n\nFrank, bajito: "Cole. En la guerra era capitán. No pierde a nadie que persigue."\n\nY una carta:\n\nMcCoy: en el de pasajeros que tienes marcado viaja Reuben Cole. Es el hombre que emboscó a tu padre. Lo vas a tener a tres pasos. Mátalo: te lo debes a ti, y a él.'),
      pasos: (n, g) => [
        diario('EL MARSHAL COLE VIENE POR EL CUERVO', 'El marshal federal Reuben Cole llega a Cardón Rojo en el de pasajeros para cazar al Cuervo. Cole, capitán del Norte en la guerra, es conocido por colgar rápido.'),
        ...(esta(g, 'frank') ? [dice('frank', 'Cole. En la guerra era capitán. No pierde a nadie que persigue.', 'Frank')] : []),
        narra('Esa noche, junto a la carpa, otra carta.'),
        carta('McCoy: en el de pasajeros que tienes marcado viaja Reuben Cole. Es el hombre que emboscó a tu padre. Lo vas a tener a tres pasos. Mátalo: te lo debes a ti, y a él.'),
      ],
      opciones: { leer: 'Guardar la carta' },
      resultado: { leer: 'El tren quedó marcado en el mapa: "COLE".' },
    },
    h_cole_dentro: {
      titulo: 'En el tren: Reuben Cole',
      texto: 'En el vagón de primera, un hombre de cincuenta años, con un parche en un ojo y la estrella en el chaleco. Cuando te ve, no saca el arma: te mira el pañuelo.\n\n"¿De dónde sacaste eso, muchacho?"',
      opciones: { matar: 'Matarlo', dejar: 'Dejarlo vivo, sin contestar', contestar: '"Era de mi padre."' },
      resultado: {
        matar: 'Cole cae sin sacar el arma. Lo que sentiste, no es lo que esperabas.\n\nA los dos días, una carta: "Bien. —J.Mc."',
        dejar: 'Lo dejas ahí, con el revólver en la funda. Ninguno de los dos dice nada.\n\nA los dos días, una carta: "Te lo puse a tres pasos. —J.Mc."',
        contestar: 'Cole se queda mirando el pañuelo un rato largo. "Entonces tú eres el hijo." No dice nada más.\n\nA los dos días, una carta: "Te lo puse a tres pasos. —J.Mc."',
      },
    },
    h_salida: {
      titulo: 'La salida',
      texto: (n, g) => {
        const l = ['Cole, vivo o muerto, ya sabe dónde está el campamento. Hay que irse al norte esta noche.'];
        if (hay(g, 'rosaTeDebe')) l.push('Rosa los esconde en el sótano de la cantina hasta que pasa la ley. Salen al norte sin que nadie los vea.');
        else l.push('Salen con la ley atrás: la primera huida de la pradera va a arrancar con jinetes.');
        if (hay(g, 'daggetPersigue')) l.push('En el camino, una silueta con una escopeta de dos caños: Dagget, solo, esperándote.');
        if (hay(g, 'lePrometisteVolver')) l.push('Santiago mira al sur mientras cargan los caballos. Le prometiste volver.');
        else if (hay(g, 'santiagoFuePorLaPlata')) l.push('Santiago carga su caballo sin mirar a nadie.');
        else l.push('Santiago mira al sur mientras cargan los caballos.');
        return l.join('\n\n');
      },
      opciones: { seguir: 'Al norte' },
      resultado: { seguir: 'Atrás queda Cardón Rojo.' },
    },
    h_frank_cartel: {
      titulo: 'Frank',
      texto: (n, g) => `Frank vuelve del pueblo sin la botella. En la oficina de Dagget vio un cartel viejo: "SE BUSCA: SANTIAGO JIMÉNEZ, por el asesinato del ranger Cal Hollister."${hay(g, 'respetasteAHollister') ? ' Cal era el hermano de Walt.' : ''}\n\n` + (relacionTexto(g)),
      pasos: (n, g) => [
        narra('Frank vuelve del pueblo sin la botella. Trae un papel arrancado de la pared de la oficina de Dagget.'),
        cartel('santiago', 'SANTIAGO JIMÉNEZ', 'por el asesinato del ranger Cal Hollister', 500),
        ...(hay(g, 'respetasteAHollister') ? [dice('frank', 'Cal Hollister, jefe. El hermano de Walt.', 'Frank')] : []),
        narra(relacionTexto(g)),
      ],
      opciones: {
        frank: 'Darle la razón a Frank',
        santiago: 'Darle la razón a Santiago',
        separar: 'Separarlos',
        callado: 'Seguir',
      },
      resultado: {
        frank: 'Santiago se va a dormir con el revólver en la mano.',
        santiago: '"Era mi compañero", dice Frank, y no dice nada más en toda la noche.',
        separar: 'Los separas a los gritos. Ninguno de los dos te lo agradece.',
        callado: 'Frank no dice nada. Esa noche no se sienta cerca del fuego. Se lo guarda.',
      },
    },
    h_dagget_panuelo: {
      titulo: 'En el pueblo: Dagget',
      texto: 'En el pueblo, Dagget se te queda mirando el pañuelo. Se le va el color de la cara.\n\n"Ese pájaro... Los Cuervos quemaron mi pueblo. Yo tenía nueve años."',
      opciones: { seguir: 'Irte' },
      resultado: { seguir: `Ya no hay plata que alcance con Dagget: te va a buscar él mismo, día y noche, con la escopeta de dos caños. Tu recompensa sube $${M$.dagget}.` },
    },
  },

  /** 🚂 Lo que dice el mapa del tren marcado (corto: entra en el renglón). */
  mapa: {
    maletin: 'J.MC.', guardia: 'J.MC.', preso: 'J.MC.', cole: 'COLE',
    veterano: 'TOMMY', hollister: 'FRANK', libro: 'PAGA', sobrino: 'PAGA', paga: 'PAGA',
  },

  /** Las noticias al llegar al campamento. */
  noticias: {
    hSinMaletin: () => 'No encontraste el maletín de J.Mc. en el tren.',
    // 🍺 Los recados con Rosa.
    hRecadoTraido: (id) => `${{ frank: 'Frank', santiago: 'Santiago', tommy: 'Tommy' }[id] || id} volvió del pueblo con un recado de Rosa.`,
    hRecadoPerdido: (id) => ({
      h_capataz: 'Rosa: "Un hombre con polvo de mina en la ropa te buscó. Esperó unos días y se fue."',
      h_rosa_libro: 'Rosa: "Te quería pedir algo. Ya es tarde."',
      h_parte1: 'Rosa: "El capataz vino a cobrar su parte. Nadie le dio nada, y se fue con cara de pocos amigos."',
      h_parte2: 'Rosa: "El capataz vino otra vez por su parte. Esta vez no dijo nada."',
      h_dagget_sobrino: 'Rosa: "El sheriff preguntó por ti. Ya no pregunta."',
      h_se_seca: 'Rosa: "La Viuda cerró dos pozos y el almacén subió todo. Esto se muere, y tú ayudaste."',
    }[id] || 'Rosa: "Alguien te dejó un recado, pero se cansó de esperar."'),
    hPerdido: (id) => `Se te pasó el tren del encargo (${{ maletin: 'el maletín', veterano: 'el veterano', libro: 'el libro', guardia: 'el pañuelo amarillo', hollister: 'Hollister', preso: 'el preso', sobrino: 'el sobrino de Dagget', cole: 'Cole' }[id] || id}).`,
  },

  /** 🏁 El fin del desierto *(Santi eligió la A: "Fin del desierto: sigue en la pradera", y termina la partida)*. */
  fin: {
    titulo: 'Fin del desierto',
    texto: 'Atrás queda Cardón Rojo. Adelante, la pradera.\n\nAquí termina el desierto. La historia sigue en la pradera, que todavía no está escrita.',
    otra: 'Empezar de nuevo',
  },
};

/** La segunda parte de la escena del cartel, según cómo están Frank y Santiago. */
function relacionTexto(g) {
  const r = g.campamento && g.campamento.relaciones && g.campamento.relaciones['frank-santiago'];
  return r === 'enemigos'
    ? 'Esa noche, frente al fuego, Frank y Santiago se paran frente a frente. Ya se tenían ganas. Esta vez hay revólveres.'
    : 'Esa noche Frank no hace chistes.';
}
