/**
 * 🤠 LA BANDA *(ver BRUJULA.md, en la raíz: "La banda")*.
 *
 * Los tres que acompañan a James McCoy. Cada uno se unió por una promesa del tipo que los juntó, y cada promesa es una
 * bomba de tiempo: el día que alguno se entere de que lo engañaron, vienen la traición o la pelea. Acá está lo que no
 * cambia de cada uno (quién es, cómo se ve, dónde se para en el campamento); lo que cambia durante la partida (su
 * lealtad, si sigue con vos) vive en `gameState.banda`.
 *
 * 🔁 Reemplaza al compañero del tren (systems/companero.js, guardado): la banda no entra al tren con James, cada uno
 * hace su papel afuera *(Santi eligió "la rebanada del desierto", 2026-11-13)*.
 */

/**
 * CÓMO SE VE CADA UNO: piezas de la gente del tren que ya están dibujadas en las 5 vistas (ver `sortearAspecto` en
 * entities/estiloNuevo/gente.js), elegidas para que se distingan de un vistazo: el sombrero, el cuerpo y la ropa.
 * ⚠️ Propuesta mía, a confirmar con Santi.
 */
import { RASGOS_DE, HUMOR, ANIMO } from './rasgos.js';
import { habilidadesIniciales, moverHumor, moverLealtad, cambioDeFalla, tiene, marcaFuerte } from '../systems/animo.js';
// 📒 La libreta y la lealtad de 0 a 5 (BANDA-NUEVA.md, etapa 2).
import { LIBRETA, LEALTAD5 } from './libreta.js';
import { completarLibreta, palabraDeLealtad5, anotar } from '../systems/libreta.js';

export const BANDA = [
  {
    id: 'santiago',
    nombre: 'Santiago Jiménez',
    corto: 'Santiago',
    // Le prometieron quedar libre de su crimen y volver a México con su familia.
    promesa: 'volver a México, libre, con su familia',
    // Sombrero de paja (el ancho es el del Cazarrecompensas: se confundían), bigote, pañuelo rojo y el poncho encima
    // de la camisa *(Santi: "quiero que Santiago lleve un poncho")*.
    aspecto: {
      piel: 'media', pelo: 'negro', peinado: 'corto', sombrero: 'paja', barba: 'bigote',
      cuerpo: 'normal', ropa: 'poncho', arremangada: true, panuelo: 'rojo',
    },
    // Dónde se para en el campamento (relativo al centro, en las medidas viejas como los objetos de data/camp.js).
    lugar: { x: 30, y: 2 },
  },
  {
    id: 'frank',
    nombre: 'Frank Monroe',
    corto: 'Frank',
    // El borracho. Le prometieron el nombre del hombre que mató a su esposa.
    promesa: 'el nombre del que mató a su esposa',
    // Canoso, barba completa, gordito, de tiradores y el sombrero curvo gastado *(Santi: "ponele el sombrero que tenía
    // Tommy pero que se note más desgastado")*.
    aspecto: {
      piel: 'clara', pelo: 'canas', peinado: 'pelado', sombrero: 'gastado', barba: 'completa',
      cuerpo: 'gordito', ropa: 'tiradores', arremangada: false, panuelo: 'pardo',
    },
    lugar: { x: 22, y: 34 },
  },
  {
    id: 'tommy',
    nombre: 'Tommy Kennedy',
    corto: 'Tommy',
    // El joven. Le prometieron gloria y honor, para honrar a su padre militar.
    promesa: 'gloria y honor, como su padre militar',
    // Rubio, afeitado, flaco, de chaleco y pañuelo azul, sin sombrero *(Santi: "Tommy no quiero que lleve sombrero")*.
    aspecto: {
      piel: 'clara', pelo: 'rubio', peinado: 'costado', sombrero: 'ninguno', barba: 'afeitado',
      cuerpo: 'flaco', ropa: 'chaleco', arremangada: false, panuelo: 'azul',
    },
    lugar: { x: -14, y: -14 },
  },
];

export const MIEMBRO = Object.fromEntries(BANDA.map((m) => [m.id, m]));

/**
 * 🤝 LA LEALTAD, DE 0 A 10, QUE NO SE VE COMO NÚMERO *(Santi eligió "lealtad, en palabras")*: el jugador la lee en una
 * palabra y en cómo le habla cada uno. ⚠️ Los cortes y los valores de arranque son de primer tanteo.
 */
export const LEALTAD = {
  max: 10,
  // De mayor a menor: la primera cuyo `desde` alcanza.
  palabras: [
    { desde: 8, id: 'firme' },
    { desde: 5, id: 'conforme' },
    { desde: 3, id: 'dudoso' },
    { desde: 0, id: 'aPuntoDeIrse' },
  ],
  // Cómo arranca cada uno: Tommy entusiasmado, Santiago desconfiado de entrada, Frank depende de la botella.
  // (🔁 Santiago, de 5 a 4: arrancaba justo en la raya de "conforme" y cualquier cosita le cambiaba la palabra
  //  *(Santi: "le di 50 dólares y de pronto ya estaba en conforme"; "que él empiece en Dudoso")*.)
  inicial: { santiago: 4, frank: 6, tommy: 8 },
  /**
   * 🔁 EL MARGEN DE CADA RAYA *(Santi eligió "A+B")*: para cambiar de palabra hay que pasar la raya por esto. Para
   * subir de "dudoso" a "conforme" hay que llegar a 5,5, y para volver a "dudoso", bajar de 4,5. Así la palabra no
   * salta de un lado al otro por una cosa chica: hacen falta 4 o 5 decisiones en el mismo sentido.
   */
  margen: 0.5,
};

/** La palabra que corresponde a un número de lealtad, sin margen (la raya justa). */
export function palabraDeLealtad(n) {
  return LEALTAD.palabras.find((p) => n >= p.desde).id;
}

/**
 * 🔁 LA PALABRA DE LEALTAD DE UNO, CON EL MARGEN (`LEALTAD.margen`): se acuerda de la que tenía (`e.palabraLealtad`)
 * y sólo la cambia cuando la lealtad pasó la raya por el margen. Es lo que ve el jugador; los números de adentro
 * (si se va, cuánto falla) siguen con la lealtad de verdad.
 */
export function palabraDe(e) {
  // (📒 La lealtad de 0 a 5: la palabra justa, sin margen; cada marca es algo que pasó y se ve.)
  if (e.lealtad5) return (e.palabraLealtad = palabraDeLealtad5(e.lealtad));
  const orden = LEALTAD.palabras.map((p) => p.id);
  const cruda = palabraDeLealtad(e.lealtad);
  const antes = e.palabraLealtad;
  if (!orden.includes(antes) || cruda === antes) return (e.palabraLealtad = cruda);
  // (En el orden, la mejor va primero: si la cruda está antes, subió.)
  const subio = orden.indexOf(cruda) < orden.indexOf(antes);
  e.palabraLealtad = palabraDeLealtad(e.lealtad + (subio ? -LEALTAD.margen : LEALTAD.margen));
  return e.palabraLealtad;
}

/**
 * 🎭 LOS PAPELES DEL ASALTO *(ver BRUJULA.md, "El asalto"; Santi eligió empezar por estos dos y repartirlos en el
 * mapa)*. Cada uno lo hace uno solo. Lo que hace cada papel adentro del asalto viene en la etapa 5.
 *  - `caballos`: te espera con el caballo al costado de la vía. Si falla, el caballo llega tarde.
 *  - `pasajero`: viaja sentado entre los pasajeros; te dice dónde está la caja y cuántos guardias hay, y una vez
 *    por asalto distrae a un guardia.
 */
export const PAPELES = ['caballos', 'pasajero', 'telegrafo', 'vigia'];

/**
 * 📡 🔭 LOS DOS PAPELES NUEVOS *(BANDA-NUEVA.md, etapa 1; Santi aprobó todas las recomendaciones, 2026-11-17)*. Con sólo
 * dos papeles uno de los tres siempre quedaba sin hacer nada: medido en el simulador, sin éstos el que cuida a la banda
 * la conserva entera 10 de cada 100 partidas en vez de 95.
 *  - **Telégrafo**: corta el cable desde el poste. La ley se entera tarde: sale con menos jinetes (`telegrafo`).
 *  - **Vigía**: desde una loma, grita cuando vienen los refuerzos de la locomotora: llegan más tarde (`vigia`, en
 *    segundos) y te avisa `vigiaAviso` segundos antes de cada uno. Con Buena puntería, además les tira (`vigiaPunteria`).
 *  - Los dos llegan a la huida a mitad de camino (ver `HUIDA.banda.llegan`).
 * Bien, flojo o mal lo decide la escalera (`ESCALERA`, abajo). ⚠️ Números del simulador: se ajustan jugando.
 */
export const PAPELES_NUEVOS = {
  telegrafo: { bien: 2, flojo: 1, mal: 0 },        // jinetes de la ley de menos (siempre sale al menos `jinetesMin`)
  jinetesMin: 1,
  vigia: { bien: 20, flojo: 10, mal: 0 },          // segundos que tardan de más los refuerzos de la locomotora
  vigiaPunteria: 5,
  vigiaAviso: 5,
  // La habilidad que ayuda a cada papel (+1 paso en la escalera).
  ayuda: { caballos: 'riendas', pasajero: ['actor', 'cuchillero'], telegrafo: 'telegrafista', vigia: 'vista' },
};

/**
 * 🎲 LA ESCALERA DEL PRONÓSTICO *(BANDA-NUEVA.md, "El ánimo y el plan")*: cuántos pasos tiene cada uno para su papel
 * (de −3 a +2) y, en cada escalón, de cada 100 veces cuántas sale bien, flojo o mal. Lo mismo que el simulador.
 * Los pasos, en esta etapa (con lo que el juego ya tiene; en la etapa 2 se leen de la libreta): su habilidad para
 * ese papel +1 · con ganas +1 · de mala gana −1 · a punto de irse −1 · resaca −1 · la parte del día (de noche el
 * vigía −1, salvo con Buena vista; de madrugada el telégrafo +1: la oficina está vacía).
 */
export const ESCALERA = {
  2: [88, 9, 3], 1: [78, 15, 7], 0: [67, 21, 12], '-1': [52, 26, 22], '-2': [37, 30, 33], '-3': [22, 30, 48],
};

/** Los pasos de uno para un papel, con sus motivos (para mostrarlos): `{ pasos, motivos: [[texto, n], …] }`. */
export function pronostico(e, papel, { resaca = false, disp = null, parte = null } = {}) {
  const motivos = [];
  const ay = [].concat(PAPELES_NUEVOS.ayuda[papel] || []);
  const sabe = ay.some((h) => tiene(e, h));
  if (sabe) motivos.push(['habilidad', 1]);
  if (disp === 'potenciado') motivos.push(['conGanas', 1]);
  if (disp === 'malaGana') motivos.push(['malaGana', -1]);
  if (e.lealtad5 ? e.lealtad <= LEALTAD5.baja : palabraDeLealtad(e.lealtad) === 'aPuntoDeIrse') motivos.push(['lealtad', -1]);
  if (resaca) motivos.push(['resaca', -1]);
  if (papel === 'vigia' && parte === 'noche' && !sabe) motivos.push(['noche', -1]);
  if (papel === 'telegrafo' && parte === 'madrugada') motivos.push(['madrugada', 1]);
  const n = motivos.reduce((t, [, v]) => t + v, 0);
  return { pasos: Math.max(-3, Math.min(2, n)), motivos };
}

/** Tira la escalera: 'bien', 'flojo' o 'mal'. */
export function tirarEscalera(pasos, azar = Math.random) {
  const [b, f] = ESCALERA[Math.max(-3, Math.min(2, pasos))];
  const r = azar() * 100;
  return r < b ? 'bien' : r < b + f ? 'flojo' : 'mal';
}

/**
 * 🎭 LO QUE HACE CADA PAPEL EN EL ASALTO (etapa 5; lo eligió Santi en 2026-11-13). ⚠️ Números de primer tanteo: se
 * miden jugando y se eligen con una tabla.
 *  - **Caballos** *(Santi eligió "según la lealtad")*: si no pusiste a nadie, el caballo siempre llega tarde; si hay
 *    alguien, falla más mientras menos leal es. Llegar tarde es que la primera vez que llegás a la salida no está:
 *    aparece `caballoTarde` segundos después. Y si después hay huida, la ley arranca `huidaMasCerca` unidades más
 *    cerca y con `huidaJinetesMas` jinete más.
 *  - **Pasajero** *(Santi eligió "con una tecla")*: va sentado entre los pasajeros, al subir te dice en qué vagón va la
 *    caja fuerte y cuántos guardias hay, y una vez por asalto, con [Q], distrae al guardia más cercano a vos
 *    (`distraccionAlcance` unidades como mucho, y que no esté peleando): mira para otro lado `distraccion` segundos.
 *  - Si le pegan a uno de la banda, queda **herido** `herida` asaltos (contando el de hoy: con 3 se pierde los dos
 *    que siguen).
 */
export const PLAN = {
  fallaCaballos: { firme: 0.05, conforme: 0.15, dudoso: 0.35, aPuntoDeIrse: 0.6 },
  caballoTarde: 8,
  huidaMasCerca: 40,
  huidaJinetesMas: 1,
  distraccion: 5,
  distraccionAlcance: 140,
  /**
   * 🎭 EL PASAJERO VA DONDE CIRCULA GENTE *(Santi: "dentro del tren en vagones que la gente circule: dormitorios,
   * pasajeros o comedor")*: se sienta en uno de éstos, y después te sigue sólo por éstos. Si el tren no tiene ninguno
   * (el de carga), no viaja.
   */
  vagonesDelPasajero: ['pasajeros', 'dormitorio', 'comedor'],
  /**
   * ⛓️ SI QUEDA PRESO (lo vieron, o cayó, y te fuiste sin él): se paga `fianza` en la oficina del sheriff del pueblo
   * para sacarlo, y vuelve con `enojo` menos de lealtad por haberlo dejado varado *(Santi: "al principio 400, pero con el
   * tiempo quiero que cada miembro vaya teniendo su propia recompensa por su cabeza"; enojo, eligió 2)*.
   */
  fianza: 400,
  enojoPreso: 2,
  /** 🔪 Cuántos guardias acuchilla por asalto, con la [F] *(Santi eligió dos)*. */
  cuchilladas: 2,
  // 📅 🔁 En DÍAS desde que existe el calendario (antes eran 3 asaltos; con 2 o 3 días entre asalto y asalto, 6 días
  // es más o menos lo mismo). Se curan solos con el tiempo: esperar a que se cure es una decisión.
  herida: 6,
  /** 🍾 Con resaca (la botella del campamento), Frank falla esto más con los caballos en el asalto siguiente. */
  resaca: 0.3,
  /** 🐎 El que es Veloz en las riendas falla esto menos con los caballos (el mismo número que el simulador). */
  riendasAyuda: 0.1,
  /**
   * 🤕 El forastero que ayudaste (se sortea al ayudarlo, mitad y mitad): si era agradecido, en el asalto siguiente la
   * ley tarda `forasteroDemora` segundos más en llegar; si era un soplón, viene con `forasteroJinetes` jinete más.
   */
  forasteroDemora: 10,
  /**
   * 🐎 ESCAPAR POR CUALQUIER LADO *(Santi: "la ventaja de tener uno bueno que te ayuda en los caballos es que podés
   * escapar en cualquier lado del tren: si escapas desde dónde entraste es automático, pero si querés escapar por otro
   * lado le avisa al compañero desde el enganche y este demorará un poco en llegar")*: tarda `llamarCaballo` segundos
   * (Santi eligió 6). Si le salió mal, se suman los `caballoTarde`; y con lealtad mala, ni viene: sólo te espera donde
   * entraste (`lealtadQueNoViene`) *(Santi: "Lealtad más o menos, 8s tarde. lealtad mala solo por dónde entraste")*.
   */
  llamarCaballo: 6,
  /**
   * ⛓️ ESPOSARLO, LIBERARLO, ARRASTRARLO, ESPERARLO (Santi, 2026-11-14):
   *  - `esposanDesde`: con tantos guardias o más en su vagón, el más cercano va a esposarlo mientras los otros te
   *    pelean; con menos, esperan a que estés en otro vagón *(Santi: "si hay cuatro o más en el mismo vagón, tres te
   *    entretienen mientras otro va a esposarlo, el más cercano. Si hay tres o menos esperan a que estés en un vagón
   *    distinto")*. `esposar`: lo que tarda el guardia, ya al lado (⚠️ primer tanteo).
   *  - `liberar`: la [E] sostenida para soltarlo o levantarlo *(Santi eligió 2 segundos)*.
   *  - `arrastreFreno`: herido, lo llevás arrastrando y vas a la mitad de tu paso (⚠️ primer tanteo).
   *  - `irseSinEl`: la [E] larga para irte sin esperarlo *(Santi: "Si no querés esperar una E larga te saca igual y
   *    él queda preso")*. ⚠️ Primer tanteo (la normal es 1 s).
   */
  esposanDesde: 4,
  esposar: 2,
  liberar: 2,
  arrastreFreno: 0.5,
  irseSinEl: 3,
  lealtadQueNoViene: ['dudoso', 'aPuntoDeIrse'],
  forasteroJinetes: 1,
};

/**
 * 🎲 EL PLAN DE ESTE ASALTO, sorteado al subir: quién cuida los caballos y si le salió mal, y quién va de pasajero.
 * `azar`: para las pruebas.
 */
export function sortearPlan(banda, azar = Math.random, marcas = {}, parte = null) {
  const caballos = quienHace(banda, 'caballos'), pasajero = quienHace(banda, 'pasajero');
  // 🙂 Con resaca (le dejaste la botella, o tomó esa noche), cómo lo hace hoy (de mala gana falla más, contento menos)
  // y si es Veloz en las riendas (falla menos).
  const ec = caballos && banda[caballos];
  const resaca = ec && ((caballos === 'frank' && marcas.frankResaca) || ec.resaca) ? PLAN.resaca : 0;
  const disp = ec && ec.disposiciones ? ec.disposiciones.caballos : null;
  const animo = ec ? cambioDeFalla(disp) - (tiene(ec, 'riendas') ? PLAN.riendasAyuda : 0) : 0;
  let caballoTarde = !caballos || azar() < PLAN.fallaCaballos[palabraDeLealtad(ec.lealtad)] + resaca + animo;
  // 🐎 ¿Viene a otro enganche si lo llamás? Sí, salvo que no haya nadie, o que le haya salido mal y su lealtad sea mala.
  let llamable = !!caballos && !(caballoTarde && PLAN.lealtadQueNoViene.includes(palabraDeLealtad(banda[caballos].lealtad)));
  // 📒 🔁 Con la libreta, los caballos también los decide la escalera (BANDA-NUEVA.md, pregunta 14): bien, el caballo
  // está; flojo, llega tarde; mal, llega tarde y no viene a otro enganche.
  let caballosRes = null, caballosPasos = null;
  if (LIBRETA.activa && ec && ec.lealtad5) {
    const p = pronostico(ec, 'caballos', { resaca: resaca > 0, disp, parte });
    caballosPasos = p.pasos;
    caballosRes = tirarEscalera(p.pasos, azar);
    caballoTarde = caballosRes !== 'bien';
    llamable = caballosRes !== 'mal';
  }
  // 📡 🔭 El telégrafo y el vigía: la escalera (ver `ESCALERA`). Sin nadie, lo mismo que mal.
  const nuevo = (papel) => {
    const id = quienHace(banda, papel);
    if (!id) return { id: null, res: 'nadie', pasos: null };
    const e = banda[id];
    const resacaN = (id === 'frank' && marcas.frankResaca) || e.resaca;
    const p = pronostico(e, papel, { resaca: !!resacaN, disp: e.disposiciones ? e.disposiciones[papel] : null, parte });
    return { id, res: tirarEscalera(p.pasos, azar), pasos: p.pasos };
  };
  const tel = nuevo('telegrafo'), vig = nuevo('vigia');
  const punteriaVigia = !!vig.id && tiene(banda[vig.id], 'punteria') && !marcaFuerte(banda[vig.id], 'cobarde');
  return {
    caballos, caballoTarde, caballosRes, caballosPasos, pasajero, forastero: marcas.forastero || null, llamable,
    telegrafo: tel.id, telegrafoRes: tel.res, telegrafoPasos: tel.pasos,
    vigia: vig.id, vigiaRes: vig.res, vigiaPasos: vig.pasos, punteriaVigia,
  };
}

/** 📡 Cuántos jinetes de la ley de menos por el telégrafo de este plan. */
export function jinetesMenos(plan) {
  return plan && plan.telegrafoRes ? PAPELES_NUEVOS.telegrafo[plan.telegrafoRes] || 0 : 0;
}

/** 🔭 Cuántos segundos tardan de más los refuerzos por el vigía de este plan (y si avisa). */
export function demoraVigia(plan) {
  if (!plan || !plan.vigiaRes) return 0;
  const s = PAPELES_NUEVOS.vigia[plan.vigiaRes] || 0;
  return s > 0 && plan.punteriaVigia ? s + PAPELES_NUEVOS.vigiaPunteria : s;
}

/**
 * 🤕 HERIDO: cuántos asaltos le faltan para curarse. Mientras tanto se queda en el campamento y no hace ningún
 * papel. ⚠️ Cuánto tarda cada herida se decide cuando haya heridas (la huida, etapa 5).
 */

/**
 * La banda al empezar la partida (lo que va a `gameState.banda`): de cada uno, la lealtad, si sigue con vos
 * (`esta`), si está herido (`herido`, asaltos que le faltan) y qué papel tiene en el próximo asalto (`papel`).
 * 🎭 Y desde 2026-11-15 sus rasgos (`rasgos`: id → fuerza) y su humor (`humor`, 1 a 100), en data/rasgos.js.
 */
export function bandaInicial() {
  return Object.fromEntries(BANDA.map((m) => { const e = estadoNuevo(m.id); completarLibreta(e); return [m.id, e]; }));
}
function estadoNuevo(id) {
  return {
    lealtad: LIBRETA.activa ? LEALTAD5.inicial[id] : LEALTAD.inicial[id], lealtad5: LIBRETA.activa || undefined, esta: true, herido: 0, papel: null, preso: false,
    rasgos: { ...(RASGOS_DE[id] || {}) }, humor: HUMOR.descanso[id] || 50,
    // 🙂 Las habilidades con que viene, ya aprendidas (ver systems/animo.js).
    habilidades: habilidadesIniciales(RASGOS_DE[id] || {}),
  };
}

/** (Una partida de antes: completa lo que le falte a cada uno, sin tocar lo que ya tiene.) */
export function completarBanda(banda) {
  const b = banda || {};
  for (const m of BANDA) {
    // (📒 Una partida de antes de la libreta: su lealtad de 0 a 10 se pasa a la mitad, no se pisa con la nueva.)
    const viejo = b[m.id] && !b[m.id].lealtad5;
    b[m.id] = { ...estadoNuevo(m.id), ...(b[m.id] || {}) };
    if (viejo) delete b[m.id].lealtad5;
    completarLibreta(b[m.id]);
  }
  return b;
}

/**
 * Si puede hacer un papel: sigue con vos, no está herido y no se fue a practicar. 📋 (Lo de la pizarra, sí: como se
 * repite solo, si no, el que practica todos los días no podría ir nunca a un golpe de día. Ver `darPapel`.)
 */
export function puedeIr(banda, id) {
  const e = banda[id];
  return !!e && e.esta && !e.herido && (!e.practica || !!e.practica.dePizarra);
}

/** Quién tiene ese papel (o null). */
export function quienHace(banda, papel) {
  return BANDA.map((m) => m.id).find((id) => banda[id].papel === papel) || null;
}

/**
 * Le da un papel (o se lo saca, con `null`). Cada papel lo hace uno solo: si otro lo tenía, se lo saca. Si no
 * puede ir, no hace nada y devuelve false.
 */
export function darPapel(banda, id, papel) {
  if (papel && !puedeIr(banda, id)) return false;
  if (papel) for (const m of BANDA) if (banda[m.id].papel === papel) banda[m.id].papel = null;
  // (📋 Lo llamás: deja lo de la pizarra de hoy y viene al golpe.)
  if (papel && banda[id].practica && banda[id].practica.dePizarra) banda[id].practica = null;
  banda[id].papel = papel;
  return true;
}

/**
 * Sube o baja la lealtad (entre 0 y el máximo) y cuenta si cambió la palabra: lo que el jugador nota. Devuelve
 * `{ antes, ahora, cambio }` con las palabras de antes y de ahora. ⚠️ Qué pasa al llegar a 0 (¿se va?, ¿traiciona?)
 * se decide con los momentos del campamento (etapa 3).
 */
export function cambiarLealtad(banda, id, n) {
  const e = banda[id];
  const antes = palabraDe(e);
  e.lealtad = Math.max(0, Math.min(LEALTAD.max, e.lealtad + n));
  const ahora = palabraDe(e);
  return { antes, ahora, cambio: antes !== ahora };
}

/** Herirlo: `asaltos` que tarda en curarse (si ya estaba herido, queda lo más largo). Pierde su papel. */
export function herir(banda, id, asaltos) {
  const e = banda[id];
  e.herido = Math.max(e.herido, asaltos);
  e.papel = null;
}

/** Un evento del ánimo (`ANIMO.eventos`) directo, sin avisar nada. */
function sentir(e, ev) {
  if (ev.humor) moverHumor(e, ev.humor);
  if (ev.lealtad) moverLealtad(e, ev.lealtad);
}

/**
 * ⛓️ Queda preso: no está en el campamento ni hace papeles hasta que pagues su fianza (`liberar`). 🙂 Lo dejaste
 * atrás: le pega fuerte (`ANIMO.eventos.dejadoAtras`).
 */
export function encarcelar(banda, id, dia = 0) {
  const e = banda[id];
  // (📒 Lo dejaste preso: queja doble.)
  if (e.libreta) anotar(e, 'q', 'dejadoAtras', dia, { veces: 2 });
  else sentir(e, ANIMO.eventos.dejadoAtras);
  e.practica = null;
  e.preso = true;
  e.esta = false;
  e.papel = null;
}

/**
 * ⛓️ Pagaste su fianza: vuelve, enojado por haberlo dejado en el tren. 🔁 Con los números del ánimo
 * (`ANIMO.eventos.fianza`, más lo que le pegó quedar preso), no con `PLAN.enojoPreso`.
 */
export function liberar(banda, id, dia = 0) {
  const e = banda[id];
  e.preso = false;
  e.esta = true;
  // (📒 Pagaste su fianza: favor.)
  if (e.libreta) anotar(e, 'f', 'fianza', dia);
  else sentir(e, ANIMO.eventos.fianza);
}

/** ⛓️ Los que están presos. */
export function presos(banda) {
  return banda ? BANDA.map((m) => m.id).filter((id) => banda[id] && banda[id].preso) : [];
}

/** Se va de la banda (o muere): ya no está en el campamento ni hace papeles. */
export function seVa(banda, id) {
  banda[id].esta = false;
  banda[id].papel = null;
}

/**
 * Después de cada asalto: los heridos se curan un poco y los papeles se vacían (se reparten de nuevo en el mapa
 * antes del próximo).
 */
export function pasarAsalto(banda) {
  for (const m of BANDA) {
    const e = banda[m.id];
    // (📅 Las heridas ya no se curan por asalto: se curan por días, con el calendario; ver systems/tiempo.js.)
    e.papel = null;
  }
}
