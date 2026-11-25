/**
 * 📖 LAS ESCENAS DEL DESIERTO (HISTORIA-DESIERTO.md, que manda sobre este archivo; *Santi, 2026-11-22: "voy con todo"*).
 * Tienen la forma de los momentos del campamento (data/momentos.js, `MOMENTOS`): `quien`, `cuando`, `opciones`, y se
 * suman a ellos con la llave `HISTORIA.activa`. Lo que dicen está en text/historia.js. Las reglas del motor, en
 * systems/historia.js.
 *
 * 🔁 2026-11-23: POR DÍAS, NO POR ASALTOS *(Santi: "Nadie sabe cuántos asaltos va a durar la región o el juego, deja
 * de medirlo así… Que sea por días y por partes de día")*. Cada `cuando` es la condición de la tabla "El orden en que
 * suele pasar" de HISTORIA-DESIERTO.md: días desde algo que pasó, y casi siempre algo que hiciste, para que esperar en
 * la carpa no dispare la historia. Se mira en cada visita nueva y cada vez que pasa el tiempo en el campamento
 * (`revisarHistoria` en data/momentos.js). Cada escena que pasó es un hecho con su id: "2 días después de ¿Por qué él
 * manda?" es `diasDesde(g, 'h_manda') >= 2`.
 *
 * `abreAlgo`: la escena abre un pedido o un encargo nuevo. Ésas ya no llegan después de "Cole viene por ti": quedan
 * unos 4 días para cerrar lo que quedó abierto, no para empezar otra cosa (HISTORIA-DESIERTO.md, "Lo pendiente").
 *
 * Quién la trae: uno de la banda, `carta` (J.Mc.), `recado` (la gente del pueblo: queda en la cantina con Rosa hasta
 * que alguien baja, y a los 4 días se pierde; ver `recogerRecados` en systems/historia.js) o `james` (se abre sola al llegar:
 * lo que hiciste adentro del tren y lo que vive James). Van antes que los momentos de siempre (`prioridad` alta).
 * Cada opción puede tener lo de siempre (`lealtad`, `animo`, `dinero`, `pagoEntero`, `marca`) y `alElegir(g)`, que
 * anota los hechos y hace lo demás.
 */
import { HISTORIA } from './historia.js';
import { anotar, hay, diasDesde, despuesDe, diaDeHoy, parteDeHoy, abrirEncargo, cerrarEncargo, enElTren, estadoDe, subirFama, coleViene } from '../systems/historia.js';
import { palabraDe } from './banda.js';
import { relacion } from '../systems/fogata.js';
import { perdonarDeuda, completarJmc } from '../systems/libreta.js';

const M$ = HISTORIA.montos;
/** 📅 El día (el primero es el 1) y si es de mañana o de noche. */
const dia = (g) => diaDeHoy(g);
const manana = (g) => parteDeHoy(g) === 'manana';
const noche = (g) => parteDeHoy(g) === 'noche';
/** "La mañana después de…": de mañana, y ya pasó una parte del día desde el hecho. */
const mananaDespues = (g, hecho) => manana(g) && despuesDe(g, hecho);
/** "Si está conforme o firme": si te tiene confianza (los pedidos de la banda). */
const confia = (g, id) => esta(g, id) && ['firme', 'conforme'].includes(palabraDe(g.banda[id]));
const recien = (g) => !!(g.ultimoAsalto && g.ultimoAsalto.recien);
const botin = (g) => (g.ultimoAsalto && g.ultimoAsalto.botin) || 0;
const esta = (g, id) => !!(g.banda && g.banda[id] && g.banda[id].esta);
const presentes = (g, ...ids) => ids.filter((id) => esta(g, id));
/** Saca el maletín de lo que trajiste. */
function sacarMaletin(g) {
  const i = g.owned ? g.owned.objetos.findIndex((o) => o.id === 'maletin') : -1;
  if (i >= 0) g.owned.objetos.splice(i, 1);
}
/** 🏁 Lo de Cole, y esa misma noche la salida (se abre sola después). */
const yLaSalida = (f) => (g) => { f(g); g.campamento.pendientes.push({ id: 'h_salida', quien: 'james' }); };
/** Una opción que sólo anota hechos (y cierra el encargo, si es de adentro del tren). */
const anota = (...hechos) => (g) => { anotar(g, ...hechos); };
const adentro = (id, ...hechos) => (g) => { anotar(g, ...hechos); cerrarEncargo(g, id); };

export const ESCENAS = {
  // ───────────── la primera carta (reemplaza a la de mostrar o guardar: ahora se muestra en "¿Por qué él manda?") ─────
  // (Va con el id `encargo`, el de siempre: muchos momentos esperan a que esté leída.)

  // ───────────── primera semana ─────────────
  // La noche del primer golpe que sale bien.
  h_manda: {
    quien: 'frank', tambien: (g) => presentes(g, 'santiago', 'tommy'), prioridad: 200,
    cuando: (g) => recien(g) && botin(g) > 0,
    opciones: [
      { id: 'carta', lealtad: { tommy: 1 }, marca: 'bandaSabeLaPromesa', alElegir: anota('cartaMostrada') },
      { id: 'fuerza', lealtad: { santiago: 1, frank: -1 }, alElegir: anota('mandasteALaFuerza') },
      { id: 'broma', lealtad: { frank: 1, santiago: -1 }, alElegir: anota('loTomasteEnBroma') },
    ],
  },
  // Una mañana, 2 días después de "¿Por qué él manda?", con Santiago y Tommy en el campamento.
  h_latas: {
    quien: 'santiago', tambien: ['tommy'], prioridad: 190,
    cuando: (g) => manana(g) && diasDesde(g, 'h_manda') >= 2,
    opciones: [
      { id: 'sumarte', lealtad: { tommy: 1 }, alElegir: anota('lazoSantiagoTommy') },
      { id: 'dejar', alElegir: anota('lazoSantiagoTommy') },
      { id: 'noBalas', lealtad: { tommy: -1 }, alElegir: anota('latasNo') },
    ],
  },
  // 2 días después de "¿Por qué él manda?". (Su tren, 4 días después de la carta: `ENCARGOS.maletin.dias`.)
  h_jmc_maletin: {
    quien: 'carta', prioridad: 250, abreAlgo: true,
    cuando: (g) => diasDesde(g, 'h_manda') >= 2,
    opciones: [{ id: 'leer', alElegir: (g) => { abrirEncargo(g, 'maletin'); } }],
  },
  // La noche que vuelves con el maletín.
  h_maletin_que: {
    quien: 'carta', prioridad: 260,
    cuando: (g) => estadoDe(g, 'maletin') === 'traido' && g.owned && g.owned.objetos.some((o) => o.id === 'maletin'),
    opciones: [
      { id: 'entregar', alElegir: (g) => { sacarMaletin(g); perdonarDeuda(g); cerrarEncargo(g, 'maletin'); anotar(g, 'cumplisteMaletin'); } },
      { id: 'abrirEntregar', alElegir: (g) => { sacarMaletin(g); perdonarDeuda(g); cerrarEncargo(g, 'maletin'); anotar(g, 'abristeMaletin', 'jmcDesconfia'); } },
      { id: 'abrirGuardar', alElegir: (g) => { sacarMaletin(g); g.money += M$.sobre; cerrarEncargo(g, 'maletin', 'perdido'); anotar(g, 'abristeMaletin', 'jmcDesconfia', 'fallasteJmc'); } },
      { id: 'vender', alElegir: (g) => { sacarMaletin(g); g.money += M$.venderMaletin; g.bounty = (g.bounty || 0) + M$.recompensaVender; cerrarEncargo(g, 'maletin', 'perdido'); anotar(g, 'vendisteLoDeJmc'); } },
    ],
  },
  // La mañana después del primer golpe de $300 o más; o 7 días después del primer golpe que salió bien. +30 de fama.
  // (Lo trae Frank; si Frank ya no está en la banda, James lo lee solo: el diario sale igual, y su fama también.)
  h_cuervo: {
    quien: (g) => (esta(g, 'frank') ? 'frank' : 'james'), tambien: (g) => presentes(g, 'santiago'), prioridad: 185,
    cuando: (g) => mananaDespues(g, 'primerGolpeGrande') || (manana(g) && diasDesde(g, 'primerGolpeBien') >= HISTORIA.cuervo.igualDias),
    opciones: [{ id: 'seguir', alElegir: (g) => { anotar(g, 'cuervo'); subirFama(g, HISTORIA.fama.diario); } }],
  },
  // Al día siguiente del diario.
  h_panuelo: {
    quien: 'santiago', prioridad: 150,
    cuando: (g) => diasDesde(g, 'cuervo') >= 1,
    opciones: [
      { id: 'guardar', alElegir: anota('panueloGuardado') },
      { id: 'dejar', alElegir: anota('panueloPuesto') },
    ],
  },
  // Desde el día 5. (🍺 Como todos los recados, llega cuando alguien baja al pueblo: `recogerRecados`.)
  h_capataz: {
    quien: 'recado', prioridad: 180, abreAlgo: true,
    cuando: (g) => dia(g) >= 5,
    opciones: [
      { id: 'pagar', dinero: M$.capataz, pagoEntero: true, alElegir: anota('tratoCapataz') },
      { id: 'no', alElegir: anota('sinTratoCapataz') },
    ],
  },
  // ───────────── segunda semana ─────────────
  // El primer reparto de $200 o más, desde el día 7.
  h_plata_casa: {
    quien: 'santiago', prioridad: 195,
    cuando: (g) => recien(g) && dia(g) >= 7 && botin(g) >= 200,
    opciones: [
      { id: 'dar', dinero: M$.plataCasa, pagoEntero: true, animo: { santiago: 'pedidoSi' }, alElegir: anota('ayudasteFamilia') },
      { id: 'despues', alElegir: anota('negasteFamilia') },
    ],
  },
  // Una noche en la fogata, 2 días después de las latas.
  h_tommy_escribe: {
    quien: 'tommy', prioridad: 170,
    cuando: (g) => noche(g) && diasDesde(g, 'h_latas') >= 2,
    opciones: [
      { id: 'creer', alElegir: anota('vistoEscribir') },
      { id: 'apretar', lealtad: { tommy: -1 }, alElegir: anota('vistoEscribir', 'apretasteATommy') },
    ],
  },
  // 2 días después de "Tommy escribe", si Tommy está conforme o firme (si no confía en ti, no te pide nada).
  h_veterano_pide: {
    quien: 'tommy', prioridad: 175, abreAlgo: true,
    cuando: (g) => diasDesde(g, 'h_tommy_escribe') >= 2 && confia(g, 'tommy'),
    opciones: [
      { id: 'aceptar', alElegir: (g) => { abrirEncargo(g, 'veterano'); } },
      { id: 'no', lealtad: { tommy: -1 }, alElegir: anota('noAlVeterano') },
    ],
  },
  // La noche que vuelves del tren del veterano.
  h_veterano_dentro: {
    quien: 'james', prioridad: 300,
    cuando: (g) => enElTren(g, 'veterano'),
    opciones: [
      { id: 'hablar', alElegir: adentro('veterano', 'veteranoHablo') },
      { id: 'dejar', alElegir: adentro('veterano', 'noHablasteConElVeterano') },
    ],
  },
  h_veterano_tommy: {
    quien: 'tommy', prioridad: 220,
    cuando: (g) => hay(g, 'veteranoHablo'),
    opciones: [
      { id: 'contar', lealtad: { tommy: 2 }, alElegir: anota('tommySabePuerta') },
      { id: 'mentir', lealtad: { tommy: -1 }, alElegir: anota('mentisteATommy') },
    ],
  },
  // Una noche que Frank tomó, desde el día 8.
  h_anillo: {
    quien: 'frank', prioridad: 160,
    cuando: (g) => noche(g) && dia(g) >= 8 && esta(g, 'frank') && !!g.banda.frank.resaca,
    opciones: [
      { id: 'preguntar', alElegir: anota('anilloFrank') },
      { id: 'quitar', animo: { frank: 'sacarBotella' }, contradice: [['frank', 'alcoholico']], sinResaca: 'frank', alElegir: anota('anilloFrank') },
      { id: 'dejar' },
    ],
  },
  // Cuando la paga ya está en el horario (y todavía no pasó), y alguien baja al pueblo.
  h_rosa_libro: {
    quien: 'recado', prioridad: 170, abreAlgo: true,
    cuando: (g) => !!g.campamento.historia && !!g.campamento.historia.marcas.paga && !hay(g, 'pagaAsaltada') && !hay(g, 'pagaFallada'),
    opciones: [
      { id: 'aceptar', alElegir: (g) => { abrirEncargo(g, 'libro'); } },
      { id: 'no', alElegir: anota('noARosa') },
    ],
  },
  h_libro_dentro: {
    quien: 'james', prioridad: 300,
    cuando: (g) => enElTren(g, 'libro'),
    opciones: [
      { id: 'rosa', alElegir: adentro('libro', 'rosaTeDebe') },
      { id: 'capataz', alElegir: (g) => { g.money += M$.libroCapataz; adentro('libro', 'libroAlCapataz')(g); } },
      { id: 'dagget', alElegir: adentro('libro', 'daggetTeDebe') },
      { id: 'dejar', alElegir: adentro('libro', 'dejasteElLibro') },
    ],
  },
  // Al otro día de asaltar la paga, si hubo trato.
  h_parte1: {
    quien: 'recado', prioridad: 165,
    cuando: (g) => hay(g, 'tratoCapataz') && diasDesde(g, 'pagaAsaltada') >= 1,
    opciones: [
      { id: 'pagar', dinero: M$.parteCapataz, pagoEntero: true, alElegir: anota('parteCapataz1') },
      { id: 'no', alElegir: anota('sinParteCapataz1') },
    ],
  },
  // ───────────── tercera semana ─────────────
  // 3 días después de que se cerró lo del maletín (entregado, vendido o perdido).
  h_jmc_guardia: {
    quien: 'carta', prioridad: 250, abreAlgo: true,
    cuando: (g) => diasDesde(g, 'cerrado_maletin') >= 3,
    opciones: [{ id: 'leer', alElegir: (g) => { abrirEncargo(g, 'guardia'); } }],
  },
  h_guardia_dentro: {
    quien: 'james', prioridad: 300,
    cuando: (g) => enElTren(g, 'guardia'),
    opciones: [
      { id: 'hablar', alElegir: (g) => { g.money += M$.llave; adentro('guardia', 'hablasteConElGuardia')(g); } },
      { id: 'matar', alElegir: (g) => { completarJmc(g).deuda += M$.multaGuardia; adentro('guardia', 'matasteAlHombreDeJmc')(g); } },
      { id: 'nada', alElegir: adentro('guardia', 'niUnaNiOtra') },
    ],
  },
  // 3 días después de pisarles el tren a los Rennick.
  h_eli_aviso: {
    quien: 'santiago', prioridad: 210,
    cuando: (g) => diasDesde(g, 'pisasteRennick') >= 3,
    opciones: [{ id: 'seguir', alElegir: anota('avisoEli') }],
  },
  // 3 días después del anillo, si Frank está conforme o firme.
  h_frank_ranger: {
    quien: 'frank', prioridad: 175, abreAlgo: true,
    cuando: (g) => diasDesde(g, 'h_anillo') >= 3 && confia(g, 'frank'),
    opciones: [
      { id: 'aceptar', alElegir: (g) => { abrirEncargo(g, 'hollister'); } },
      { id: 'no', lealtad: { frank: -1 }, alElegir: anota('noAHollister') },
    ],
  },
  h_hollister_dentro: {
    quien: 'james', prioridad: 300,
    cuando: (g) => enElTren(g, 'hollister'),
    opciones: [
      { id: 'dejar', lealtad: { frank: 2 }, alElegir: adentro('hollister', 'respetasteAHollister') },
      { id: 'hablar', lealtad: { frank: 2 }, alElegir: adentro('hollister', 'respetasteAHollister', 'hollisterHablo') },
      { id: 'matar', lealtad: { frank: -2 }, alElegir: adentro('hollister', 'matasteAHollister') },
    ],
  },
  h_emboscada: {
    quien: 'james', prioridad: 290,
    cuando: (g) => hay(g, 'pisasteRennick2'),
    opciones: [
      { id: 'perdonar', alElegir: (g) => { anotar(g, 'perdonasteAUnRennick'); herir(g); } },
      { id: 'matar', alElegir: (g) => { anotar(g, 'murioAbel'); herir(g); } },
    ],
  },
  // 3 días después de que se cerró lo del guardia.
  h_jmc_preso: {
    quien: 'carta', prioridad: 250, abreAlgo: true,
    cuando: (g) => diasDesde(g, 'cerrado_guardia') >= 3,
    opciones: [{ id: 'leer', alElegir: (g) => { abrirEncargo(g, 'preso'); } }],
  },
  h_preso_dentro: {
    quien: 'james', prioridad: 300,
    cuando: (g) => enElTren(g, 'preso'),
    opciones: [
      { id: 'barba', alElegir: adentro('preso', 'liberasteABarbaRoja') },
      { id: 'dos', alElegir: adentro('preso', 'liberasteABarbaRoja', 'liberasteAlLadron') },
      { id: 'muchacho', alElegir: adentro('preso', 'liberasteAlLadron', 'fallasteJmc', 'barbaRojaCuelga') },
      { id: 'ninguno', alElegir: adentro('preso', 'fallasteJmc', 'barbaRojaCuelga') },
    ],
  },
  // ───────────── cuarta semana ─────────────
  // Cuando la segunda paga ya está en el horario, Dagget no vio el pañuelo y alguien baja al pueblo.
  h_dagget_sobrino: {
    quien: 'recado', prioridad: 170, abreAlgo: true,
    cuando: (g) => !hay(g, 'daggetVio') && !!g.campamento.historia && !!g.campamento.historia.marcas.paga2 && !hay(g, 'paga2Asaltada') && !hay(g, 'paga2Fallada'),
    opciones: [
      { id: 'aceptar', alElegir: (g) => { abrirEncargo(g, 'sobrino'); } },
      { id: 'no', alElegir: anota('noADagget') },
    ],
  },
  h_sobrino_dentro: {
    quien: 'james', prioridad: 300,
    cuando: (g) => enElTren(g, 'sobrino'),
    opciones: [
      { id: 'vivo', alElegir: adentro('sobrino', 'daggetTeDebe') },
      { id: 'matar', alElegir: (g) => { g.bounty = (g.bounty || 0) + M$.dagget; adentro('sobrino', 'matasteAlSobrino', 'daggetPersigue')(g); } },
    ],
  },
  // Al otro día de asaltar la segunda paga, si hubo trato.
  h_parte2: {
    quien: 'recado', prioridad: 165,
    cuando: (g) => hay(g, 'tratoCapataz') && diasDesde(g, 'paga2Asaltada') >= 1,
    opciones: [
      { id: 'pagar', dinero: M$.parteCapataz, pagoEntero: true, alElegir: anota('parteCapataz2') },
      { id: 'no', alElegir: anota('sinParteCapataz2') },
    ],
  },
  // (Va con "Cole viene por ti": la carta que manda a la banda al norte. En la etapa 6 se juntan en una.)
  h_jmc_norte: {
    quien: 'carta', prioridad: 255,
    cuando: (g) => hay(g, 'h_cole_viene'),
    opciones: [{ id: 'leer', alElegir: anota('cartaNorte') }],
  },
  // A la mañana siguiente de "Cole viene".
  h_santiago_norte: {
    quien: 'santiago', prioridad: 230,
    cuando: (g) => hay(g, 'cartaNorte') && mananaDespues(g, 'h_cole_viene'),
    opciones: (g) => [
      { id: 'convencer', lealtad: { santiago: -1 }, alElegir: anota('santiagoFuePorLaPlata') },
      // (Si ya lo habías ayudado con la plata para casa, vale doble.)
      { id: 'adelantar', dinero: M$.plataNorte, pagoEntero: true, lealtad: { santiago: hay(g, 'ayudasteFamilia') ? 2 : 1 }, alElegir: anota('loAyudasteAntesDeIrse') },
      { id: 'prometer', lealtad: { santiago: 1 }, alElegir: anota('lePrometisteVolver') },
    ],
  },
  // 3 días después de asaltar la segunda paga, si asaltaste las dos.
  h_se_seca: {
    quien: 'recado', prioridad: 160,
    cuando: (g) => hay(g, 'pagaAsaltada') && diasDesde(g, 'paga2Asaltada') >= 3,
    opciones: [{ id: 'seguir', alElegir: anota('elDesiertoSeSeco') }],
  },
  // ───────────── al final ─────────────
  // La fama llega a 300 o la recompensa a $900 (HISTORIA.fama.cole). Su tren, 4 días después (`ENCARGOS.cole.dias`).
  h_cole_viene: {
    quien: 'carta', prioridad: 270,
    cuando: (g) => coleViene(g),
    opciones: [{ id: 'leer', alElegir: (g) => {
      abrirEncargo(g, 'cole');
      // (El capataz te vendió si asaltaste las dos pagas y no le diste su parte ninguna de las dos veces.)
      if (hay(g, 'tratoCapataz') && hay(g, 'pagaAsaltada') && hay(g, 'paga2Asaltada') && !hay(g, 'parteCapataz1') && !hay(g, 'parteCapataz2')) {
        anotar(g, 'elCapatazTeVendio');
        g.campamento.marcas.leyEspera = true;
      }
    } }],
  },
  // La noche que vuelves del tren de Cole (y esa misma noche, la salida).
  h_cole_dentro: {
    quien: 'james', prioridad: 300,
    cuando: (g) => enElTren(g, 'cole'),
    opciones: [
      { id: 'matar', alElegir: yLaSalida(adentro('cole', 'matasteAlMarshal')) },
      { id: 'dejar', alElegir: yLaSalida(adentro('cole', 'lePerdonasteLaVidaAlMarshal', 'jmcDesconfia')) },
      { id: 'contestar', alElegir: yLaSalida(adentro('cole', 'lePerdonasteLaVidaAlMarshal', 'coleVioElPanuelo', 'jmcDesconfia')) },
    ],
  },
  // (Si volviste del tren de Cole, la pone `yLaSalida`.) La noche del día que el tren de Cole pasa sin ti.
  h_salida: {
    quien: 'james', prioridad: 280,
    cuando: (g) => noche(g) && estadoDe(g, 'cole') === 'perdido',
    opciones: [{ id: 'seguir', alElegir: (g) => { anotar(g, 'saliste'); g.finDelJuego = 'desierto'; } }],
  },
  // ───────────── ✉️ las cartas de la fama (las pone `revisarFama` en systems/historia.js, no su `cuando`) ─────────────
  // La primera vez que la fama llega a 150.
  h_jmc_bien: { quien: 'carta', prioridad: 240, repite: true, cuando: () => false, opciones: [{ id: 'leer' }] },
  // 6 días sin que el Cuervo suene.
  h_jmc_efectivos: { quien: 'carta', prioridad: 240, repite: true, cuando: () => false, opciones: [{ id: 'leer' }] },
  // 12 días: desconfía, y cobra $250 por golpe hasta que el Cuervo vuelva a sonar.
  h_jmc_desconfia: { quien: 'carta', prioridad: 240, repite: true, cuando: () => false, opciones: [{ id: 'leer' }] },
  // 22 días: los Rennick matan a tres en el de las 9, y el diario dice que fue el Cuervo. Cole viene igual.
  h_jmc_rennick: {
    quien: 'carta', prioridad: 265, cuando: () => false,
    opciones: [{ id: 'leer', alElegir: (g) => {
      anotar(g, 'jmcTeInvento');
      completarJmc(g).deuda += HISTORIA.jmc.deudaRennick;
      g.bounty = (g.bounty || 0) + HISTORIA.jmc.recompensaRennick;
    } }],
  },
  // ───────────── lo que flota ─────────────
  h_frank_cartel: {
    quien: 'frank', tambien: (g) => presentes(g, 'santiago'), prioridad: 225,
    cuando: (g) => hay(g, 'frankBajo') && esta(g, 'santiago'),
    opciones: (g) => (relacion(g, 'frank', 'santiago') === 'enemigos'
      ? [
        { id: 'frank', lealtad: { frank: 1, santiago: -2 }, alElegir: anota('frankSabeLoDelRanger', 'razonAFrank') },
        { id: 'santiago', lealtad: { santiago: 1, frank: -2 }, alElegir: anota('frankSabeLoDelRanger', 'razonASantiago') },
        { id: 'separar', lealtad: { santiago: -1, frank: -1 }, alElegir: anota('frankSabeLoDelRanger', 'losSeparaste') },
      ]
      : [{ id: 'callado', alElegir: anota('frankSabeLoDelRanger', 'frankSeLoGuarda') }]),
  },
  h_dagget_panuelo: {
    quien: 'james', prioridad: 285,
    cuando: (g) => hay(g, 'daggetVio') && !hay(g, 'daggetVioVisto'),
    opciones: [{ id: 'seguir', alElegir: (g) => { g.bounty = (g.bounty || 0) + M$.dagget; anotar(g, 'daggetVioVisto'); } }],
  },
};

/** 🤕 La emboscada deja a uno herido (el primero que está), 2 días. */
function herir(g) {
  const id = presentes(g, 'tommy', 'frank', 'santiago')[0];
  if (id) g.banda[id].herido = Math.max(g.banda[id].herido || 0, 2);
}

