/**
 * 🤝 EL PAPEL DE UN TRATO (TRATOS.md): el mismo papel de siempre (engine/menu.js), con la cara del tratante. Arriba,
 * el oficio y los rasgos que ya se le conocen ("EMPEÑOS · rastrero", "· ?" si todavía nada); su línea, con la voz de
 * su rasgo; y las jugadas, cada una con su plata, su chance "de cada 100" y lo que pasa si no sale.
 *
 * *(Santi, 2026-11-19: "recuerda que es un complemento y no un juego de regateo")*: una decisión, y una segunda sólo
 * si un regateo sale mal (aceptar lo que queda o irte).
 *
 * Sirve para cualquier tratante: quien lo abre le pasa cómo cobrar (`cobrar`), cómo decir el resultado (`decir`) y
 * la cara (`figuras`). Hoy lo abre el perista (interiorScene.js); después, el armero y el caballerizo.
 */
import { T } from '../text/es.js';
import { oferta, jugadas, resolver, tramoDe, famaDe } from '../systems/tratos.js';
import { TRATOS } from '../data/tratos.js';
import { contextoDeVenta, aplicarTrato, conocidos, sacarVendido, cerradoHoy, tratanteDe, libretaDelTrato } from '../systems/tratosEnJuego.js';
import { MIEMBRO } from '../data/banda.js';

/** La línea del tratante al hacer la oferta, con la voz de su primer rasgo. */
function lineaDe(ctx, of, K) {
  if (of.chantaje) return K.chantaje(of.chantaje);
  if (ctx.enojo) return K.enojado(of.monto);
  const te = tramoDe(ctx.recompensa) >= 1 || famaDe(ctx.fama) >= 1;
  const r = ctx.rasgos[0], f = K.dice[r] || K.dice.otro;
  return f(of.monto, te, ctx.valor >= TRATOS.ambicioso.loteGrande, ctx.honor);
}

/** El renglón de una jugada. `sopla`: si ya se sabe que es cobarde (entonces se avisa que va con el chisme). */
export function textoDeJugada(j, of, K, sopla) {
  const por = j.motivos && j.motivos.length ? ': ' + K.por[j.motivos[0][0]] : '';
  switch (j.id) {
    case 'aceptar': return of.chantaje ? K.op.aceptarChantaje(j.monto) : K.op.aceptar(j.monto);
    case 'regatear': return K.op.regatear(j.monto, j.chance, por, j.siNo.monto);
    case 'apretar': return of.chantaje ? K.op.apretarChantaje(j.monto, j.chance, por, sopla) : K.op.apretar(j.monto, j.chance, por, sopla);
    case 'irte': return of.chantaje ? K.op.irteChantaje(j.siNo.habla) : K.op.irte;
    default: return j.id;
  }
}

/** Lo que se dice después: qué pasó, y si sopló o habló. */
function resultadoDe(j, r, of, K) {
  const R = K.resultado, lineas = [];
  if (j.id === 'aceptar') lineas.push(of.chantaje ? R.pagoChantaje(r.monto) : R.vendio(r.monto));
  if (j.id === 'regatear' && r.cierra) lineas.push(R.regateo(r.monto));
  if (j.id === 'apretar') {
    if (r.cierra) lineas.push(of.chantaje ? R.apretoChantaje(r.monto) : R.apreto(r.monto));
    else if (!r.habla) lineas.push(R.apretoMal);
  }
  if (j.id === 'irte') lineas.push(of.chantaje && !r.habla ? R.callo : R.teVas);
  if (r.habla) lineas.push(R.habla(TRATOS.chantaje.recompensa));
  if (r.sopla) lineas.push(R.sopla(TRATOS.apretar.sopla));
  return lineas;
}

/**
 * VENDERLE `objetos` AL TRATANTE `id` (vas tú). `cobrar(monto)` suma la plata; `decir(lineas)` muestra el resultado;
 * `sonar(nombre)` el sonido. Devuelve false si hoy no te atiende.
 */
export function abrirVenta({ g, id, objetos, menu, figuras, decir, sonar, cobrar }) {
  const K = T.interior.tratos;
  if (cerradoHoy(g, id)) { decir(K.resultado.cerrado); sonar('cover'); return false; }
  const { ctx, lote } = contextoDeVenta(g, id, objetos);
  const of = oferta(ctx, Math.random);
  // (Lo que se le nota en la oferta misma —el Rastrero que chantajea, el Valiente que no se inmuta— ya queda sabido.)
  aplicarTrato(g, id, { revela: of.revela });
  const titulo = () => K.titulo(K.oficio[id] || id, conocidos(g, id).map((r) => K.rasgo[r]));
  const abrirLista = (lista, cuerpo) => {
    const sopla = !!tratanteDe(g, id).conoce.cobarde;
    menu.abrir(titulo(), lista.map((j) => ({ id: j.id, texto: textoDeJugada(j, of, K, sopla) })), (op) => {
      const j = lista.find((x) => x.id === op);
      const r = resolver(ctx, of, j, Math.random);
      aplicarTrato(g, id, r);
      if (r.sigue) { abrirLista(r.sigue, K.resultado.regateoMal(r.sigue[0].monto)); sonar('cover'); return false; }
      if (r.cierra) { cobrar(r.monto); sacarVendido(g); }
      // 📒 (El chantaje o el soplo, a la libreta de la banda: se dice en el momento.)
      const anotes = libretaDelTrato(g, { chantaje: of.chantaje, sopla: r.sopla });
      decir([...resultadoDe(j, r, of, K), ...anotes.map((a) => T.libreta.anota(MIEMBRO[a.id] ? MIEMBRO[a.id].corto : a.id, a.lado, T.libreta.motivos[a.motivo]))]);
      sonar(r.cierra ? 'loot' : 'cover');
      return false;
    }, cuerpo, { figuras });
  };
  abrirLista(jugadas(ctx, of), K.mira(lote) + '\n' + lineaDe(ctx, of, K));
  return true;
}
