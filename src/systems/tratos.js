/**
 * LOS TRATOS — las reglas, PURAS (TRATOS.md en la raíz; los números en data/tratos.js).
 *
 * *(Santi, 2026-11-19: "tenés recompensa alta, depende de 'quien es el perista' te puede chantajear diciendo 'o me lo
 * das a este precio o hablo' o le puede dar miedo y ser un punto a favor"; "recuerda que es un complemento y no un
 * juego de regateo"; "para cualquier tipo de vendedor/comprador, que se prepare para después implementarlo en el
 * armero, establo, etc.")*
 *
 * PURAS de verdad: no importan nada del juego más que los números, no tocan `gameState` y el azar entra como función.
 * Así el simulador (simulador/banda3.js) usa ESTE MISMO archivo, y lo que se mide es lo que se juega. Lo que cambia
 * el estado (plata, recompensa, noticias, la libreta) está en systems/tratosEnJuego.js.
 *
 * Un trato, por dentro:
 *   1. `oferta(ctx, azar)`: lo que el tratante te dice (y si te chantajea).
 *   2. `jugadas(ctx, of)`: lo que puedes hacer, cada cosa con su plata, su chance "de cada 100" y lo que pasa si no.
 *   3. `resolver(ctx, of, jugada, azar)`: tira contra LA MISMA chance que mostró el papel (el azar se avisa: el número
 *      que ves es el que se usa) y devuelve lo que pasó, sin tocar nada.
 *
 * `ctx` (lo arma quien llama: el juego con `contextoDeTrato`, el simulador con lo suyo):
 *   tipo: 'vende' (le vendes tú) | 'compra' (le compras tú)
 *   oficio: 'perista' | 'armero' | 'caballerizo'
 *   rasgos: ['rastrero', ...] — los del tratante
 *   valor: lo que vale (vendes: la tasación, con lo de limpio y tu honor; compras: su precio de lista)
 *   caliente: qué parte del valor está caliente (0 a 1); recien: si lo caliente es de los últimos días
 *   recompensa, fama, honor: los tuyos
 *   trato: la memoria de este tratante contigo (−1 a +2); enojo: cuánto empeora sus ofertas porque algo te salió mal
 *     hace poco (un regateo o un apretón; 0 si nada)
 *   leyCerca: la recompensa en el aviso de la horca; deudaJmc: si le debes a J.Mc.
 *   quien: null si vas tú; si va uno de la banda, { negociante, pendenciero, honorable, fuerzas } (sus rasgos;
 *     `fuerzas`: { rasgo: 0 a 100 } de su personalidad, para la química)
 */
import { TRATOS, OFICIOS, HONOR_SEGUN, QUIMICA, CHANTAJE_ORDEN } from '../data/tratos.js';

const tiene = (ctx, r) => ctx.rasgos.includes(r);
const redondo = (x) => Math.max(0, Math.round(x));
const acotar = (c) => Math.round(Math.max(TRATOS.chanceMin, Math.min(TRATOS.chanceMax, c)));

/** El tramo de la recompensa: 0 desconocido, 1 buscado, 2 tu cara en el cartel. */
export function tramoDe(recompensa) {
  if (recompensa >= TRATOS.tramos.cartel) return 2;
  if (recompensa >= TRATOS.tramos.buscado) return 1;
  return 0;
}

/** El tramo de la fama: 0 nadie, 1 se habla de ti, 2 leyenda. */
export function famaDe(fama) {
  if (fama >= TRATOS.fama.leyenda) return 2;
  if (fama >= TRATOS.fama.seHabla) return 1;
  return 0;
}

/**
 * EL HONOR SEGÚN QUIÉN (data/tratos.js, HONOR_SEGUN): `base` es el ajuste de siempre por tu honor (de −0,2 a +0,2);
 * devuelve lo que este tratante hace con él. Un tratante sin ninguno de esos rasgos lo toma como viene.
 */
export function honorSegun(rasgos, base) {
  if (!base) return 0;
  const H = HONOR_SEGUN, cuales = rasgos.filter((r) => H[r]);
  if (!cuales.length) return base;
  const f = cuales.reduce((s, r) => s + base * (base > 0 ? H[r].alto : H[r].bajo), 0);
  return Math.max(-H.tope, Math.min(H.tope, f));
}

/** LA QUÍMICA QUE PUEDE PASAR entre el que mandas (`fuerzas` de su personalidad) y el tratante, con su chance. */
export function quimicaPosible(fuerzas, rasgosTratante) {
  return QUIMICA.filter((q) => (fuerzas[q.va] || 0) > 0 && rasgosTratante.includes(q.con)).map((q) => ({ ...q, chance: Math.round(fuerzas[q.va]) }));
}

const suma = (of, k) => (of.quimica || []).reduce((s, q) => s + (q[k] || 0), 0);
const hay = (of, k, v) => (of.quimica || []).some((q) => (v === undefined ? q[k] : q[k] === v));

/** Las una o dos razones que más pesan, para el renglón ("tu cartel +15"). */
function principales(motivos) {
  return motivos.filter(([, v]) => v).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 2);
}

/**
 * LA OFERTA: lo que te dice de entrada. `chantaje` es lo que te ofrece por callarse (0 si no te chantajea);
 * `revela`, los rasgos que se le notan en esta oferta (el Valiente, cuando te conoce y no se inmuta).
 */
export function oferta(ctx, azar) {
  const O = OFICIOS[ctx.oficio], T = TRATOS, vende = ctx.tipo === 'vende';
  const signo = vende ? 1 : -1;     // lo que es bueno para ti sube lo que cobras y baja lo que pagas
  let f = O.entrada;
  f *= 1 + signo * ctx.trato * T.trato.porPunto;
  if (tiene(ctx, 'ambicioso')) f *= ctx.valor >= T.ambicioso.loteGrande ? 1 + signo * T.ambicioso.mejor : 1 - signo * T.ambicioso.peor;
  if (ctx.enojo) f *= 1 - signo * ctx.enojo;
  if (vende && tiene(ctx, 'rastrero')) f *= 1 + T.rastrero.caliente * (ctx.caliente || 0);
  const monto = redondo(ctx.valor * f);

  // (La química del que mandaste: cada pareja pasa tantas veces de cada 100 como la fuerza de su rasgo.)
  const quimica = ctx.quien ? quimicaPosible(ctx.quien.fuerzas || {}, ctx.rasgos).filter((q) => azar() * 100 < q.chance) : [];
  const of0 = { quimica };
  let chantaje = 0;
  const revela = [];
  // (`podia`: si sin la química te habría podido chantajear; para contar que el Frío lo frenó sólo cuando importó.)
  const podia = T.chantaje.activo && vende && tiene(ctx, 'rastrero') && tramoDe(ctx.recompensa) >= 1 && ctx.recien && ctx.caliente > 0;
  if (podia && !hay(of0, 'chantaje', 'nada')) {
    const x = (of0.quimica.find((q) => q.chantajeX) || { chantajeX: 1 }).chantajeX;
    if (azar() < Math.min(1, x * (ctx.leyCerca ? T.chantaje.leyCerca : T.chantaje.chance))) {
      chantaje = redondo(ctx.valor * (ctx.deudaJmc ? T.chantaje.conDeuda : T.chantaje.paga));
      revela.push('rastrero');
    }
  }
  if (tiene(ctx, 'valiente') && (tramoDe(ctx.recompensa) >= 1 || famaDe(ctx.fama) >= 1)) revela.push('valiente');
  return { monto, chantaje, revela, quimica, guarda: suma(of0, 'guarda'), podia };
}

/**
 * LA QUÍMICA QUE IMPORTÓ en este trato (para contarlo en la noticia): la que tocó la jugada que se hizo. `como`: lo
 * que pasó ('r' regateó bien, 'rm' mal, 'p'/'pm' apretó, 'c' pagó el chantaje, 'h'/'v' no pagó, 'f' pelea).
 */
export function quimicaQueImporto(of, como) {
  const gano = CHANTAJE_ORDEN.find((c) => hay(of, 'chantaje', c));
  return (of.quimica || []).filter((q) => {
    if (q.chantaje === 'nada') return of.podia && !of.chantaje;
    if (of.chantaje && (q.chantaje || q.chantajeX)) return q.chantajeX || q.chantaje === gano;
    if (q.regatear) return q.regatear > 0 ? como === 'r' : como === 'rm';
    if (q.apretar || q.aprieta) return como === 'p' || como === 'pm';
    if (q.noSopla) return como === 'p' || como === 'pm';
    return false;
  }).map((q) => q.id);
}

/** Si te conocen lo bastante para apretarlo (y la chance, con sus motivos). Null si no se puede. */
function apretarlo(ctx, of) {
  const A = TRATOS.apretar;
  if (!A.activo || !OFICIOS[ctx.oficio].jugadas.includes('apretar') || tiene(ctx, 'valiente')) return null;
  // (El Honorable no aprieta, salvo que la química lo empuje: Tommy, Valiente, enfrenta al que lo chantajea.)
  if (ctx.quien && ctx.quien.honorable && !hay(of, 'aprieta') && !(of.chantaje && hay(of, 'chantaje', 'aprieta'))) return null;
  const tramo = tramoDe(ctx.recompensa), fama = famaDe(ctx.fama) >= 1, temido = ctx.honor <= TRATOS.honor.temido;
  if (!tramo && !fama && !temido) return null;
  const motivos = [
    tramo === 2 ? ['cartel', A.cartel] : tramo === 1 ? ['buscado', A.buscado] : ['conocido', A.desconocido],
    ['temido', temido ? A.temido : 0],
    ['fama', fama ? A.fama : 0],
    ['cobarde', tiene(ctx, 'cobarde') ? A.cobarde : 0],
    ['quimica', suma(of, 'apretar')],
  ];
  const chance = Math.min(A.tope, acotar(motivos.reduce((s, [, v]) => s + v, 0)));
  return { chance, motivos: principales(motivos) };
}

/**
 * LAS JUGADAS que hay en este trato, en el orden del papel. Cada una:
 *   { id, monto, chance (null = seguro), motivos: [[clave, número]], siNo: { monto, cierra, habla, sopla } }
 */
export function jugadas(ctx, of) {
  const T = TRATOS, O = OFICIOS[ctx.oficio], vende = ctx.tipo === 'vende', signo = vende ? 1 : -1;
  const lista = [];
  const ap = apretarlo(ctx, of);
  const sopla = tiene(ctx, 'cobarde') && !hay(of, 'noSopla') ? T.apretar.sopla : 0;

  if (of.chantaje) {
    lista.push({ id: 'aceptar', monto: of.chantaje, chance: null, motivos: [], siNo: null });
    if (ap) lista.push({ id: 'apretar', monto: of.monto, chance: ap.chance, motivos: ap.motivos, siNo: { habla: true, sopla } });
    lista.push({ id: 'irte', monto: 0, chance: null, motivos: [], siNo: { habla: Math.round(100 * T.chantaje.habla) } });
    return lista;
  }

  lista.push({ id: 'aceptar', monto: of.monto, chance: null, motivos: [], siNo: null });
  if (T.regatear.activo && O.jugadas.includes('regatear') && !ctx.enojo) {
    const R = T.regatear;
    const motivos = [
      ['negociante', ctx.quien && ctx.quien.negociante ? T.mandado.negociante - R.chance : 0],
      ['ambicioso', tiene(ctx, 'ambicioso') ? R.ambicioso : 0],
      ['trato', ctx.trato * R.porTrato],
      ['quimica', suma(of, 'regatear')],
    ];
    lista.push({
      id: 'regatear', monto: redondo(of.monto * (1 + signo * R.mas)),
      chance: acotar(R.chance + motivos.reduce((s, [, v]) => s + v, 0)), motivos: principales(motivos),
      siNo: { monto: redondo(of.monto * (1 - signo * R.siNo)) },
    });
  }
  if (ap) lista.push({ id: 'apretar', monto: redondo(of.monto * (1 + signo * T.apretar.mas)), chance: ap.chance, motivos: ap.motivos, siNo: { cierra: true, sopla } });
  if (T.fiado.activo && !vende && O.jugadas.includes('fiado') && tiene(ctx, 'honorable') && ctx.honor >= T.honor.respetado && !ctx.quien) {
    lista.push({ id: 'fiado', monto: redondo(of.monto * (1 + T.fiado.mas)), chance: null, motivos: [], siNo: null, dias: T.fiado.dias });
  }
  lista.push({ id: 'irte', monto: 0, chance: null, motivos: [], siNo: null });
  return lista;
}

/**
 * LO QUE PASA con la jugada elegida (no toca nada: lo aplica quien llama). Devuelve:
 *   sale: si salió (las jugadas seguras, siempre)
 *   cierra: si hubo trato; monto: la plata que cobras (vendes) o pagas (compras)
 *   trato: cuánto se mueve la memoria (entre `TRATOS.trato.min` y `max`; eso lo cuida quien aplica)
 *   recompensa: cuánto sube la tuya; sopla / habla: por qué
 *   cerrado: no te atiende hasta mañana; enojo: { cuanto, dias } si quedó enojado (lo guarda quien aplica)
 *   sigue: si hay una segunda decisión (después de un regateo fallido), sus jugadas
 *   fiado: { monto, dias } si te lo fió
 *   revela: los rasgos que se le notaron
 */
export function resolver(ctx, of, jugada, azar) {
  const T = TRATOS;
  const r = { sale: true, cierra: false, monto: 0, trato: 0, recompensa: 0, sopla: false, habla: false, cerrado: false, enojo: null, sigue: null, fiado: null, revela: [...of.revela] };
  const tira = () => azar() * 100 < jugada.chance;

  switch (jugada.id) {
    case 'aceptar':
      r.cierra = true; r.monto = jugada.monto;
      break;
    case 'regatear':
      if (tira()) { r.cierra = true; r.monto = jugada.monto; }
      else {
        r.sale = false; r.enojo = { cuanto: T.regatear.siNo, dias: T.regatear.recuerdaDias };
        r.sigue = [
          { id: 'aceptar', monto: jugada.siNo.monto, chance: null, motivos: [], siNo: null },
          { id: 'irte', monto: 0, chance: null, motivos: [], siNo: null },
        ];
      }
      if (tiene(ctx, 'ambicioso')) r.revela.push('ambicioso');
      break;
    case 'apretar':
      if (tiene(ctx, 'cobarde')) { r.revela.push('cobarde'); if (!hay(of, 'noSopla')) { r.sopla = true; r.recompensa += T.apretar.sopla; } }
      if (tira()) { r.cierra = true; r.monto = jugada.monto; }
      else {
        r.sale = false;
        if (of.chantaje) { r.habla = true; r.recompensa += T.chantaje.recompensa; }
        else { r.cerrado = true; r.trato = -1; r.enojo = { cuanto: T.apretar.siNo, dias: T.apretar.recuerdaDias }; }
      }
      break;
    case 'pelea':
      // (El Pendenciero y el Valiente: se van a las manos. No hay venta y el pueblo se entera.)
      r.sale = false; r.pelea = true; r.recompensa += suma(of, 'pelea');
      break;
    case 'fiado':
      r.cierra = true; r.monto = 0; r.fiado = { monto: jugada.monto, dias: jugada.dias };
      r.revela.push('honorable');
      break;
    case 'irte':
      if (of.chantaje) {
        r.trato = -1;
        if (azar() < T.chantaje.habla) { r.habla = true; r.recompensa += T.chantaje.recompensa; }
      }
      break;
  }
  r.revela = [...new Set(r.revela)];
  return r;
}

/**
 * LA JUGADA DEL QUE MANDASTE (la tarea "vender"): la eligen sus rasgos (TRATOS.md, "Mandar a otro") y la química con
 * el tratante (`of.quimica`, ya tirada en la oferta). Si se pelean, no hay trato. Con un chantaje: lo que diga la
 * química (lo enfrenta, se vuelve, paga); si no, el Pendenciero aprieta y el resto paga (no se arriesga a que hable
 * por ti). Sin chantaje: aprieta el Pendenciero o al que la química empuja; el resto regatea, que es a lo que fue.
 */
export function jugadaDe(quien, lista, of = {}) {
  const de = (id) => lista.find((j) => j.id === id);
  if (hay(of, 'pelea')) return { id: 'pelea', monto: 0, chance: null, motivos: [], siNo: null };
  if (of.chantaje) {
    const r = CHANTAJE_ORDEN.find((c) => hay(of, 'chantaje', c));
    if (r === 'aprieta' && de('apretar')) return de('apretar');
    if (r === 'seVuelve') return de('irte');
    if (r !== 'paga' && quien.pendenciero && de('apretar')) return de('apretar');
    return de('aceptar');
  }
  if ((quien.pendenciero || hay(of, 'aprieta')) && de('apretar')) return de('apretar');
  return de('regatear') || de('aceptar');
}
