/**
 * 🎭 DE UN TEXTO A LOS PASOS DE UNA ESCENA (engine/menu.js, `escena`) *(Santi, 2026-11-23: "la historia es muy buena,
 * pero no la estamos mostrando como se merece")*. Los textos de los momentos y de la historia están escritos como
 * prosa: lo que pasa y lo que dice cada uno mezclado en el mismo párrafo ('Junto al fuego, la voz sube. "Al próximo no
 * voy con él, McCoy", dice Santiago. "¿Y tú qué sabes de caballos?", le contesta Frank. Los dos te miran.'). Esto los
 * parte en pasos para que cada uno diga lo suyo con su cara, sin reescribir cada texto:
 *  - Lo dicho va SIN comillas y SIN "dice Fulano": eso ya lo cuentan la cara y el nombre *(Santi: "no debería
 *    aparecer las comillas [...] ni tampoco cosas como 'dice, Frank'. Ya sabemos que lo dijo Frank por la cara")*.
 *  - Quién lo dice: el que nombra la frase de al lado ("…", dice Santiago / Frank, bajito: "…"); si no nombra a nadie,
 *    el mismo de antes; y si son dos que discuten (el título dice "Frank y Santiago") y una frase sigue pegada a la otra,
 *    contesta el otro.
 *  - Lo que pasa, entre una frase y otra → se narra.
 *  - Algo entre comillas que termina con una firma ("…—J.Mc.") → el papel de la carta (o la nota, si firma otro).
 * 🔁 Antes un párrafo con algo dicho adentro iba entero, con comillas y todo, a la cara del que traía la escena: en la
 * discusión de los caballos hablaba sólo Frank, también lo que decía Santiago.
 * Las escenas que necesitan otra cosa (el diario, el cartel) traen sus `pasos` escritos a mano (text/historia.js).
 */

/** Los pasos a mano (text/historia.js). */
export const dice = (quien, texto, nombre = null) => ({ tipo: 'dice', quien, nombre, texto });
export const narra = (texto) => ({ tipo: 'narra', texto });
export const carta = (texto, firma = 'J.Mc.') => ({ tipo: 'carta', texto, firma });
export const nota = (texto, firma = null) => ({ tipo: 'nota', texto, firma });
export const diario = (titular, texto, extra = {}) => ({ tipo: 'diario', titular, texto, ...extra });
export const cartel = (quien, nombre, por, recompensa = null) => ({ tipo: 'cartel', quien, nombre, por, recompensa });

/** Los verbos con que un texto dice quién habló: `"…", dice Santiago` / `"…", le contesta Frank`. */
const VERBOS = '(?:le\\s+)?(?:dice|dicen|contesta|responde|pregunta|grita|murmura|susurra|insiste|agrega|repite)';
const DESPUES = new RegExp(`^\\s*,?\\s*${VERBOS}\\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)\\s*`);
/** `Frank: "…"` o `Frank, bajito: "…"` justo antes de las comillas. */
const ANTES = /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)(?:,[^:".]{1,30})?:\s*$/;
/** Una firma al final de lo citado: `—J.Mc.`, `—E. RENNICK.` */
const FIRMA = /\s*—\s*([^—]{1,30}?)\.?$/;

/**
 * Parte `texto` en pasos. `quien`: el que trae la escena (un id de la banda, 'carta', 'forastero'…); `banda`:
 * `{ Nombre: id }`; `titulo`: el de la escena (si nombra a dos de la banda, son los que hablan, en ese orden).
 */
export function pasosDe(texto, quien, banda = {}, titulo = '') {
  if (!texto) return [];
  const pareja = participantes(titulo, banda);
  const ids = new Set(Object.values(banda));
  // (El que habla si nadie lo dice: el que trae la escena —si tiene cara— o el primero de los dos que discuten.)
  const porDefecto = pareja.length ? pareja[0] : quien && quien !== 'carta' && quien !== 'james' ? quien : null;
  const pasos = [];
  let ultimo = null;
  // (✉️ La carta de J.Mc. con la firma en su renglón: todo lo de antes va al papel.)
  const todo = texto.trim();
  if (/\n\n—J\.Mc\.$/.test(todo)) return [carta(todo.slice(0, -'—J.Mc.'.length).trim())];
  for (const parrafo of todo.split(/\n\n+/)) {
    const p = parrafo.trim();
    if (!p) continue;
    // (✉️ Un párrafo que es entero una carta o una nota: entre comillas y firmado, o firmado por J.Mc.)
    const entreComillas = p.startsWith('"') && p.endsWith('"') && (p.match(/"/g) || []).length === 2;
    const sin = entreComillas ? p.slice(1, -1) : p;
    const firma = sin.match(FIRMA);
    if (firma && !sin.includes('"') && (entreComillas || /—\s*J\.\s?Mc\.?$/.test(sin))) {
      const cuerpo = sin.slice(0, firma.index).trim();
      pasos.push(cuerpo ? papelFirmado(cuerpo, firma[1]) : narra(p));
      continue;
    }
    ultimo = partirParrafo(p, { banda, ids, pareja, porDefecto, ultimo, pasos });
  }
  return juntar(pasos);
}

/** Los de la banda que nombra el título ("Frank y Santiago" → ['frank', 'santiago']), en ese orden. */
export function participantes(titulo, banda = {}) {
  if (!titulo || typeof titulo !== 'string') return [];
  return titulo.split(/\s+y\s+|,\s*/).map((n) => banda[n.trim()]).filter(Boolean);
}

/** Un párrafo: lo de afuera de las comillas se narra; lo de adentro lo dice alguien. Devuelve el último que habló. */
function partirParrafo(p, { banda, ids, pareja, porDefecto, ultimo, pasos }) {
  const trozos = [];
  const re = /"([^"]*)"/g;
  let desde = 0, m;
  while ((m = re.exec(p))) {
    trozos.push({ t: p.slice(desde, m.index) });
    trozos.push({ q: m[1] });
    desde = m.index + m[0].length;
  }
  trozos.push({ t: p.slice(desde) });
  let pegada = false;
  for (let i = 0; i < trozos.length; i++) {
    const z = trozos[i];
    if (z.t !== undefined) {
      if (z.t.trim()) pegada = false;
      const resto = limpiarNarracion(z.t);
      if (resto) pasos.push(narra(resto));
      continue;
    }
    // (✉️ Una carta citada adentro del texto: "A los dos días, una carta: "Bien. —J.Mc."".)
    const firma = z.q.match(FIRMA);
    if (firma && /\S/.test(z.q.slice(0, firma.index))) {
      pasos.push(papelFirmado(z.q.slice(0, firma.index).trim(), firma[1]));
      pegada = false;
      continue;
    }
    // ¿Quién lo dice?
    let quien = null;
    const antes = trozos[i - 1] && trozos[i - 1].t;
    const nombreAntes = antes && antes.match(ANTES);
    if (nombreAntes) {
      quien = idDe(nombreAntes[1], banda);
      trozos[i - 1].t = antes.slice(0, nombreAntes.index);
      // (El trozo de antes ya se narró: se saca lo del nombre de lo narrado.)
      quitarUltimaNarracionSi(pasos, antes, trozos[i - 1].t);
    }
    const despues = trozos[i + 1];
    const atrib = despues && despues.t !== undefined ? despues.t.match(DESPUES) : null;
    if (!quien && atrib) {
      quien = idDe(atrib[1], banda);
      // (", y escupe al fuego." → "Frank escupe al fuego.")
      const cola = despues.t.slice(atrib[0].length);
      const sigue = cola.match(/^,\s*y\s+(.*)$/s);
      despues.t = sigue ? `${atrib[1]} ${sigue[1]}` : cola;
    }
    if (!quien) {
      if (pegada && pareja.length === 2 && ultimo) quien = pareja[0] === ultimo ? pareja[1] : pareja[0];
      else quien = ultimo || porDefecto;
    }
    const dicho = cerrarFrase(z.q.trim());
    if (quien && (ids.has(quien) || quien === porDefecto)) pasos.push(dice(quien, dicho, nombreDe(banda, quien)));
    else if (quien && typeof quien === 'string' && !ids.has(quien) && quien.length && /^[A-ZÁÉÍÓÚÑ]/.test(quien)) pasos.push(dice(null, dicho, quien));
    else pasos.push(narra(`"${z.q.trim()}"`));
    ultimo = ids.has(quien) || quien === porDefecto ? quien : ultimo;
    pegada = true;
  }
  return ultimo;
}

/** El id de la banda de un nombre, o el nombre tal cual (uno de afuera: "Cole"). */
function idDe(nombre, banda) {
  return banda[nombre] || nombre;
}

/** Lo narrado sin la puntuación que quedó suelta al sacar las frases (". Los dos te miran." → "Los dos te miran."). */
function limpiarNarracion(t) {
  const s = t.replace(/^[\s.,;:—]+/, '').replace(/[\s,;—]+$/, '').trim();
  if (!/[a-záéíóúñ]/i.test(s)) return '';
  const conPunto = /[.!?…:]$/.test(s) ? s : s + '.';
  return conPunto.charAt(0).toUpperCase() + conPunto.slice(1);
}

/** Si lo último narrado era el trozo de antes, lo cambia por el trozo sin el nombre ("Santiago:"). */
function quitarUltimaNarracionSi(pasos, antes, sinNombre) {
  const ult = pasos[pasos.length - 1];
  if (!ult || ult.tipo !== 'narra' || ult.texto !== limpiarNarracion(antes)) return;
  const nuevo = limpiarNarracion(sinNombre);
  if (nuevo) ult.texto = nuevo;
  else pasos.pop();
}

/** "Al próximo no voy con él, McCoy" (le seguía ", dice Santiago") → con su punto final. */
function cerrarFrase(t) {
  return /[.!?…]$/.test(t) ? t : t.replace(/[,;:]$/, '') + '.';
}

/** La carta de J.Mc. o la nota de otro. */
function papelFirmado(cuerpo, firma) {
  return /^J\.\s?Mc$/.test(firma.replace(/\.$/, '')) ? carta(cuerpo) : nota(cuerpo, firma.replace(/\.$/, ''));
}

/** Lo que dice el mismo, seguido, va en un solo paso; lo narrado seguido, también. */
function juntar(pasos) {
  const out = [];
  for (const s of pasos) {
    const ant = out[out.length - 1];
    if (ant && s.tipo === 'dice' && ant.tipo === 'dice' && ant.quien === s.quien && ant.nombre === s.nombre) ant.texto += ' ' + s.texto;
    else if (ant && s.tipo === 'narra' && ant.tipo === 'narra') ant.texto += ' ' + s.texto;
    else out.push({ ...s });
  }
  return out;
}

function nombreDe(banda, id) {
  return Object.keys(banda).find((n) => banda[n] === id) || null;
}
