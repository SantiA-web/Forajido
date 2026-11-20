# Los tratos — v2 (después de los jueces)

*(Santi, 2026-11-19: "que te parece si el jugador también puede regatear en vez de solo ir cobrar?"; "tenés recompensa
alta, depende de 'quien es el perista' te puede chantajear diciendo 'o me lo das a este precio o hablo' o le puede dar
miedo y ser un punto a favor"; "Este sistema te lo voy a dejar a vos [...] que pueda unir otros pilares y puntos del
juego [...] Selecciona los rasgos que de verdad importen [...] recuerda que es un complemento y no un juego de regateo
[...] para cualquier tipo de vendedor/comprador, que se prepare para después implementarlo en el armero, establo,
etc.")*

Estado: **v3, revisado por cuatro jueces** (diversión, pilares, plata, pantalla y código), **medido en el simulador
(v17) y construido la etapa 1** (el perista y la tarea "vender"). Al final, lo medido y lo que cambió.

## En una frase

El que te compra o te vende en el pueblo no es una vidriera: es una persona que sabe (o no) quién eres, te hace una
oferta, y tú tienes **una jugada** para cambiarla.

## Las reglas de la casa

- **Un trato es una decisión.** Una segunda sólo si un regateo sale mal o si te chantajean, y es siempre "aceptar o
  irte". Aceptar está siempre a mano.
- **El azar se avisa.** Cada jugada dice su plata, su chance "de cada 100" y lo que pasa si sale mal, en el mismo
  renglón. Y **las una o dos razones que más pesan** ("tu cartel +15"); la cuenta entera, en la ficha del tratante.
  La chance que ves es la que se tira: el papel y la tirada leen el mismo número.
- **Cada número tuyo abre algo.** El honor alto abre el fiado; el honor bajo y la recompensa abren apretar; la
  recompensa con mercadería caliente trae el chantaje; la fama hace que te reconozcan.
- **El perista siempre abre el papel.** Comprar abre el papel sólo desde `$80` (un arma, un caballo); el almacén nunca.

## Quién eres tú (lo que el otro ve)

| Lo tuyo | Qué hace en un trato |
|---|---|
| **Honor** | Mueve el precio (±3% a ±20%), pero 🔁 **según quién es el perista** (Santi, 2026-11-20: "no siempre con buen honor el perista te da más dinero, es muy depende de quien es el perista, porque tal vez no le importa que seas buena persona"): el Honorable lo agranda (×1,5); el Rastrero lo da vuelta (desconfía del santo, le paga más al que es como él); el Cobarde sólo mira el honor malo (te paga más de miedo); al Valiente y al Ambicioso les da igual. Se ve en la oferta ("−$60 por tu nombre"). **No se suma a las chances.** Además: honor **respetado** (más de 40) abre el **fiado** con el Honorable; honor **temido** (menos de −40) suma **+10 a apretar**. |
| **Recompensa** | Tres tramos: **desconocido** (menos de $200), **buscado** ($200 a $599), **tu cara en el cartel** ($600 o más, el mismo umbral de la oferta de la ley). Buscado abre apretar; buscado con mercadería caliente trae el chantaje del Rastrero. |
| **Fama** | Si se habla de ti (ver abajo). Con fama "se habla de ti", te reconocen **aunque tu recompensa sea baja**: abre apretar (+10). |
| **La mercadería** | Caliente o limpia (×2, ya existe). Caliente **recién robada** (2 días desde el golpe) es la que dispara el chantaje. |
| **Quién va** | Tú, o uno de la banda con la tarea "vender": **sus rasgos** eligen la jugada. |

### La fama, sin un sistema aparte

Hoy `fame` sólo sube matando a un jefe (+100 o +150). Que suba con lo que ya pasa (`famaDelGolpe`):
- +40 por un golpe que sale en el diario (algo raro o el maletín);
- +30 cada 3 golpes limpios seguidos (la racha que ya se cuenta);
- lo del jefe, como está.

Tramos: **nadie** (menos de 100), **se habla de ti** (100 a 299), **leyenda** (300 o más). La recompensa es si te identificaron; la
fama es si se habla de ti. Un golpe limpio sin muertos también te hace conocido.

## Quién es el otro (el tratante)

Cada tratante tiene un **oficio** y **uno o dos rasgos** con su fuerza, de las mismas personalidades que la banda
(`PERSONALIDADES` en `data/rasgos.js`). Se descubren **jugando**: cada rasgo tiene su forma de hablar en la línea de la
oferta, y queda escrito junto al nombre ("Ezra · rastrero") **la primera vez que actúa**. Antes, "Ezra · ?".

Seis rasgos, los que cambian algo de verdad:

| Rasgo | A favor tuyo | En contra tuyo |
|---|---|---|
| **Ambicioso** | Por un **lote grande** (desde $500) paga un 10% más: conviene juntar (y de paso se enfría lo caliente). Etapa 3: los **encargos** | Por un lote chico, un 10% peor; regatear con él, −20 |
| **Cobarde** | Apretarlo: +30 (tope 80 de cada 100) | **Sopla siempre que lo aprietas**, salga bien o mal: +$30 de recompensa, y el juego lo dice ("el perista habló con el sheriff") |
| **Valiente** | Nunca te chantajea | Con él **no aparece apretar** |
| **Rastrero** | Compra lo recién robado **sin el descuento de caliente** | Buscado + mercadería caliente recién robada: **te chantajea** (1 de cada 3 tratos) |
| **Honorable** | Con honor respetado, **te fía** | Si mataste civiles en ese tren, **no compra lo de ese tren** |
| **Curioso** | Si le vendes algo raro, **te paga también con un rumor** de carga (`rumorDeCarga`) | Pregunta por el maletín: con él, el maletín tiene una tercera salida (venderlo o que lo lea; lo que diga queda para Santi) |

Quedan afuera: **Vengativo** (repetía la memoria del trato), **Jugador** (el doble o nada es el minijuego que no
queremos; quizás después, raro y con Frank).

### La memoria del trato

Cada tratante tiene un número de **−1 a +2**, y cada punto mueve su primera oferta un 5%. Sólo lo mueve lo grande:
- **−1** si lo aprietas y sale mal, o si te vas con un chantaje encima;
- **+1** cumpliendo un **encargo** o **pagando un fiado** a tiempo (etapas 2 y 3);
- vuelve hacia 0 un punto **cada 5 días**.

Y aparte, **el enojo**: si un regateo sale mal, sus ofertas de hoy son un 10% peores (y hoy no se le regatea más); si
un apretón sale mal, te cierra hasta mañana y sus ofertas son un 15% peores por 5 días. (🔁 Medido: si aceptar sumaba
memoria, aceptar siempre le ganaba a todo; si el regateo fallido también la bajaba, o se acordaba 3 días, regatear
perdía contra aceptar siempre.)

## El contexto (lo que está pasando en la historia)

- **La ley cerca** (recompensa en el aviso de la horca o redada reciente): el chantaje sube a 1 de cada 2.
- **La región**: los precios ya cambian por región (`N.region.perista`); en la montaña no se suma nada nuevo.
- **J.Mc.**: con deuda con J.Mc. pendiente, el chantaje sale más caro (el Rastrero sabe que estás apretado). El maletín
  no se vende, salvo al Curioso (ver arriba).
- **La banda**: **sólo el chantaje y el apretar que termina en soplo** van a la libreta (una vez por visita): queja del
  Honorable, favor del Pendenciero. Que no sea rutina.
- **El soplo se ve**: el horario muestra "más custodia" en el próximo tren (`armarTren` ya usa la recompensa).

## Las jugadas

El tratante dice **una oferta** (vendes) o **un precio** (compras). Eliges **una**:

| Jugada | Cuándo aparece | Si sale bien | Si sale mal |
|---|---|---|---|
| **Aceptar** | Siempre | Cierran | — |
| **Regatear** | Si no está enojado | +15% (vendes) / −15% (compras) | Se enoja: la oferta empeora un 10% y sólo queda aceptar o irte (hoy) |
| **Apretarlo** | Buscado o más, fama, o honor temido; nunca con el Valiente | +25% / −25% (el Cobarde sopla igual) | Te cierra hasta mañana, trato −1, enojado 15% por 5 días |
| **Fiado** | Compras, Honorable, honor respetado | Te lo llevas ya; pagas +10% en 5 días. Pagado a tiempo: trato +2 | Vencido: trato −1 y sopla (+$30); aviso en el calendario |
| **Trueque** | Armero y caballerizo | Mercadería por lo que compras, a la tasación del perista | — |
| **Irte** | Siempre | Nada (mañana, otra oferta) | Con un chantaje encima: ver abajo |

**Las chances** (de cada 100):
- Regatear: **50**; ambicioso −20; trato ±10 por punto; el Buen negociante que mandas, 67.
- Apretar: te conocen sólo por fama u honor **15**, buscado **25**, cartel **40**; honor temido +10; fama +10;
  cobarde +30; **tope 80**.

**El chantaje** (Rastrero + buscado + caliente recién robada, 1 de cada 3):
> "Sé de dónde salió esto. $X, y me olvido de tu cara."

- **Aceptar**: cobras el 55% de lo que valía, y se calla.
- **Apretarlo**: la chance de apretar; si sale, se acabó el chantaje y te paga la oferta normal; si no, habla.
- **Irte**: habla 1 de cada 2.
- **Que hable**: +$100 de recompensa (lo mismo que matar civiles) y más custodia en el próximo tren.

## Mandar a otro

La tarea "vender" usa **las mismas jugadas y los mismos números** (si no, mandar le gana a ir tú). La jugada la eligen
sus rasgos:
- **Buen negociante**: regatea con 67 (en vez de 50) — practica la habilidad;
- **Pendenciero**: aprieta si se puede (y si el tratante es cobarde, sopla igual);
- **Honorable**: nunca aprieta;
- **Rastrero**: se guarda una parte (como ya está: 25 de cada 100, el 25%);
- los demás: regatean, como tú (es a lo que fueron). Con un chantaje, el que no aprieta paga.

No carga tu honor (con honor bajo, conviene mandar a otro; con honor alto, ir tú), pero el soplo y el chantaje **sí
suben tu recompensa**: si te buscan, buscan a la banda.

### La química: a quién mandas según quién es el perista

*(Santi, 2026-11-20: "que pasa si alguien con Ambición va a negociar con el perista también ambicioso [...] El jugador
no solo debería elegir mandar a alguien por habilidad sino también por quien es con el que va a negociar"; "es más
probabilidad, no algo asegurado")*

Cada pareja pasa **tantas veces de cada 100 como la fuerza del rasgo del que va** (Tommy, Honorable 80: 80 de cada 100).
Los números, en `QUIMICA` (data/tratos.js):

| El que va | Con el perista | Qué pasa |
|---|---|---|
| Ambicioso | Ambicioso | Hablan el mismo idioma: regatea +20 |
| Honorable (Tommy) | Honorable | Gente de palabra: regatea +15 |
| Valiente (Tommy) | Rastrero, con chantaje | Lo enfrenta en vez de pagar: aprieta, +30 |
| Honorable (Tommy) | Rastrero | No se entienden: regatea −15; con chantaje, se vuelve sin vender (y puede hablar) |
| Frío (Santiago) | Rastrero | Ni se inmuta: no lo chantajea |
| Frío (Santiago) | Cobarde | Lo pone nervioso: lo aprieta, +20 |
| Egoísta (Santiago) | Ambicioso | Se arreglan por fuera: se guarda un 25% |
| Divertido (Frank) | Valiente | Se caen bien: regatea +10 |
| Divertido (Frank) | Cobarde | Lo calma: si lo aprietan, no sopla |
| Pendenciero | Cobarde | Lo asusta: apretar +20 |
| Pendenciero | Valiente | Se pelean: no vende, recompensa +$30 |
| Cobarde | Rastrero | Le huele el miedo: chantaje el doble de seguido, y paga |
| Rastrero | Rastrero | Se arreglan a tus espaldas: no hay chantaje, pero se guarda un 25% |

**Se ve al elegir**: en el calendario, "Venderle lo robado al perista · lo pone nervioso 80 de 100" — pero **sólo con
lo que ya le conoces al perista**. Si todavía es "EMPEÑOS · ?", no sabes cómo le va a ir a cada uno: conviene ir tú
primero. La noticia cuenta la química que importó ("Lo calmó: el perista no fue con el chisme.").

## Cómo se ve

El papel de siempre (`engine/menu.js`), con la cara del tratante. Título, su línea, y hasta 4 jugadas:

```
EMPEÑOS — Ezra · ambicioso
"Seis cosas, tres marcadas. Te doy $180."
▸ Aceptar: $180
  Regatear: $207 (30 de cada 100) · si no, $162
  Apretarlo: $225 (40 de cada 100: tu cartel) · si no, cierra
  Irte
```

```
EMPEÑOS — Ezra · rastrero
"Sé de dónde salió. $130 y me olvido de tu cara."
▸ Aceptar: $130 y se calla
  Apretarlo: $236 (40 de cada 100) · si no, habla
  Irte: habla 50 de cada 100
```

## Cómo se arma por dentro (para cualquier tratante)

- `data/tratos.js`: los números (`TRATOS`, con llave `activo` y una por cosa para apagar), `OFICIOS`
  (`perista: { entrada: 0.75, compra: true, vende: false, caliente: true, jugadas: [...] }`) y `TRATANTES`
  (`ezra: { oficio: 'perista', rasgos: { rastrero: 70, ambicioso: 50 } }`).
- `systems/tratos.js`, funciones puras que no tocan el estado:
  - `contexto(g, tratante, { tipo, valor, caliente, recien, quien })`
  - `oferta(ctx)` → `{ monto, chantaje, linea }`
  - `jugadas(ctx, oferta)` → `[{ id, monto, chance, motivos, siNo }]`
  - `resolver(jugada, azar)` → `{ sale, monto, efectos }`
  - `aplicar(g, ctx, resultado)`: la única que cambia el estado (plata, recompensa, trato, noticias, libreta).
  - `jugadaDe(miembro, lista)`: la que elige uno de la banda.
- `scenes/trato.js`: `abrirTrato(menu, ctx, alCerrar)`, como `scenes/reparto.js`.
- Textos en `T.tratos` (`text/es.js`), con tuteo.
- `gameState.tratos = { ezra: { trato, cerradoHasta, conoce: {}, regateoMalHasta } }`, `gameState.fiados = []`.
- Se engancha en: la venta del perista (`interiorScene.js`, `vender()`: `tasarLote` queda como el valor), la tarea
  "vender" (`systems/tareas.js`), y después la tienda (`shopScene.js`) para el armero y el caballerizo.
- El simulador importa `systems/tratos.js` tal cual.

## Por etapas

1. **El perista**: oferta, regatear, apretar, chantaje, la memoria, los rasgos Ambicioso, Cobarde, Valiente, Rastrero;
   la tarea "vender" con las mismas jugadas; la fama que sube. Medido en el simulador antes.
2. **El armero y el caballerizo**: comprar con regatear y apretar, el fiado (Honorable), el trueque.
3. **Encargos y el Curioso**: el encargo del Ambicioso, el rumor y el maletín del Curioso.

## Lo medido (simulador v17, `simulador/banda3.js`, que usa `systems/tratos.js` tal cual)

El que cuida a la banda, 500 partidas, con un perista sorteado (uno o dos de Ambicioso, Cobarde, Valiente, Rastrero):

| Cómo trata | Cobrado al perista | Recompensa de más |
|---|---|---|
| Hoy (el 100%, sin tratos) | $5427 | — |
| Acepta siempre | $3787 | — |
| Regatea siempre | $3806 | — |
| Aprieta siempre que puede | $3899 | +$348 |
| Elige según el perista | $3854 | +$41 |

- **Ninguna jugada gana siempre**: regatear da +3% con el Cobarde, el Valiente o el Rastrero, y −2% con el Ambicioso;
  apretar da un poco más de plata a cambio de recompensa.
- **El perista que te toca cambia la partida**: con el Ambicioso se cobra $3428; con el Rastrero, $4276 (paga más lo
  caliente) pero con 3 chantajes por partida y 1 vez que habla.
- **La plata ya no se duplica**: el que cuida termina con $2742 (era $3938) y no pierde a nadie el 95% (era 97%); el
  que no usa los días pasa de 23% a 3% de partidas sin perder a nadie.
- **El honor pesa**: con honor −20% se cobra $3567 (y conviene mandar a uno); con +20%, $4672.
- ⚠️ El simulador no tiene fama (0), ni la horca, y sus lotes son chicos (~$150): ahí los +$30 del soplo pesan casi
  como lo que da apretar al Cobarde. En el juego los lotes son de $300 a $1500, y apretarlo debería convenir más.

**El honor según quién** (James va él, 500 partidas):

| Perista | Honor −20% (antes → ahora) | Honor +20% (antes → ahora) |
|---|---|---|
| Honorable | $3076 → $2675 | $4718 → $5108 |
| Rastrero | $3340 → $5097 | $5167 → $3405 |
| Cobarde | $3115 → $4770 | $4718 → $3930 |
| Valiente | $3115 → $3930 | $4718 → $3930 |

**La química** (siempre manda a uno de la banda de la historia; el que elige "por química" sabe cómo es el perista):

| Perista | Manda a cualquiera | Manda por química |
|---|---|---|
| Sorteado | $3676, recompensa +$56 | $3841, +$95 |
| Rastrero | $4017, +$208 (habla 2 veces por partida) | $4324, +$20 |
| Cobarde | $3750 | $3880 |
| Valiente | $3757 | $3978 |

Con el Ambicioso no cambia nada con la banda del comienzo (nadie es Ambicioso, y el Egoísta conviene no mandarlo): la
química con él aparece con los contratados.

## Lo que cambió de la v1 (lo que dijeron los jueces)

- **Regatear convenía siempre** (+5% en promedio): ahora fallar cuesta −10% y el trato.
- **Apretar le ganaba a todo** desde el golpe 4: bajó (25/40, +25%), cuesta trato siempre, tope 80.
- **Aceptar siempre llevaba el trato a +2** y pagaba más que tratar: ahora aceptar llega a +1; el +2 se gana.
- **El honor contaba dos veces** (precio y chances): queda en el precio, y abre fiado o apretar.
- **El regateo fallido se borraba yéndose**: ahora el tratante se acuerda 3 días.
- **Mandar a otro le ganaba a ir** (+30% sobre el 75%): usa las mismas jugadas.
- **Los saltos de recompensa** siguen la escala que existe (+$30 pelea, +$100 civiles).
- **Rasgos**: de 8 a 6 (afuera Vengativo y Jugador). El Mentiroso no va a vender (repetía al Rastrero).
- **La meta** "negociar bien te devuelve al 100%" no se alcanza; la nueva: aceptar ~75%, tratar bien ~85%.
