# Los prompts para pedirle arte a una IA

Cuatro moldes: personajes, caballos, cosas quietas y cosas que se mueven.

**Están en inglés a propósito.** Los generadores de imágenes entienden bastante
mejor el inglés — no es esnobismo, es que fallan menos. Lo que hay que cambiar
en cada uno está marcado `ASÍ`, y abajo de cada prompt está explicado en
castellano qué va en cada hueco.

---

## Antes de copiar nada: las cuatro reglas del juego

Estos números no son decoración. Son los que hacen que el dibujo entre en
Forajido en vez de quedar lindo y afuera.

| | Cuánto |
|---|---|
| **La vista** | Tres cuartos. Ni de costado plano, ni desde arriba |
| **Una persona** | **80 puntos de alto** con sombrero (20 unidades del mundo) |
| **Un caballo** | **86 de largo × 68 de alzada** |
| **Una baldosa** | 64 puntos |
| **La pantalla** | 420×236, agrandada ×4 |

**Y tres cosas que casi siempre salen mal si no se piden:**

1. **Fondo transparente de verdad** (PNG con alfa). No un fondo blanco, no el
   damero gris dibujado encima.
2. **Sin sombra.** El juego dibuja su propia sombra en el piso. Si el dibujo
   trae una pegada, vas a tener dos.
3. **Los pies apoyados en el borde de abajo.** El juego apoya la figura ahí
   (`pies = y + hh`). Si el dibujo viene flotando en el medio del cuadro, el
   personaje va a caminar en el aire.

### La paleta de la gente

```
Contorno   #1a120c   (negro cálido, NO negro puro)
Piel       #b27a52   sombra #8a5a3c   luz #c89068
Pelo       #2a1c14   barba #4e3222
Sombrero   #4a3626   luz #6a4e36   sombra #34261a
Chaleco    #3e2c1e   luz #56402c   sombra #2c2016
Camisa     #9a8a6a   luz #b0a080   sombra #7a6c52
Pantalón   #4e4236   botas #2a1e16
Pañuelo    #7a2c22   (el rojo del jugador)
```

### Y los fondos sobre los que se va a ver

Esto es tan importante como la paleta del personaje, y es el error que este
proyecto ya cometió una vez: una mochila marrón quedó **invisible** sobre un
piso marrón. Un color no se aprueba solo — se aprueba contra el piso.

```
Piso del vagón   #6d4a30  y  #7a5436
Pared            #3a2a1f
Asiento          #8a5a34
Desierto de día  #8a6f47
Desierto de noche #1b1610
El vacío (por los enganches)  #0d0b0c
```

---

## 1 · PERSONAJES

```
Pixel art sprite of a WESTERN OUTLAW CHARACTER for a 2D game, drawn in
THREE-QUARTER view (camera looking down at roughly 45 degrees, the way
classic 16-bit action RPGs are drawn). NOT a flat side view. NOT a
top-down view.

CHARACTER: PERSONAJE

SIZE: exactly 80 pixels tall from the top of the hat to the soles of the
boots. Body proportions: long legs, narrow shoulders, small head — a
lean, weathered adult, about 8 heads tall. This is a SMALL sprite, so
READ THE SILHOUETTE FIRST: the hat shape and the outline must identify
this character instantly at arm's length. No fine detail, no tiny
patterns, no text.

STYLE: gritty spaghetti-western. Sun-burnt leathery face, worn and dusty
clothing, hard shadows. Serious and grounded — NOT cute, NOT chibi, NOT
big-headed, NOT cartoon mascot.

COLORS: use only these hex values —
outline #1a120c (warm near-black, never pure black),
skin #b27a52 with shadow #8a5a3c and highlight #c89068,
hair #2a1c14, beard #4e3222,
PALETA_DEL_PERSONAJE
Flat color areas with hard-edged shading. No gradients, no anti-aliasing,
no blur, no glow. Crisp pixels only.

BACKGROUND: fully transparent PNG with a real alpha channel. No checker
pattern, no white, no color. No drop shadow, no ground shadow, no
contact shadow of any kind — the game draws its own.

FRAMING: the character stands upright, centered horizontally, with the
SOLES OF THE BOOTS TOUCHING THE BOTTOM EDGE of the image. No empty
margin under the feet.

POSE: standing still, arms relaxed at the sides, facing VISTA.
```

**Qué va en cada hueco:**

- `PERSONAJE` — quién es, en una línea, y que el sombrero lo delate:
  - *el jugador:* `a lone outlaw in a wide cowboy hat, open vest over a pale
    shirt, a red bandana at the neck, a revolver in a hip holster, spurs on
    the boots, thick moustache and short beard`
  - *un guardia:* `a railroad guard in a dark blue military kepi and buttoned
    navy coat with brass buttons, clean-shaven with a small moustache`
  - *un pasajero:* `an ordinary traveller in a grey-green suit and a bowler
    hat, with a necktie`
  - *el rico:* `a wealthy passenger in a dark purple-grey suit and a TALL TOP
    HAT, with a gold watch chain across the chest`
  - *el sheriff:* `an old lawman all in black with a tall hat, a grey beard
    and a gold star pinned on the chest`
  - *el blindado:* `an armored guard in steel-grey plated coat with a metal
    chest plate and a kepi`
- `PALETA_DEL_PERSONAJE` — pegá las líneas de color que le tocan (las de
  arriba). Para el jugador: `hat #4a3626, vest #3e2c1e, shirt #9a8a6a,
  trousers #4e4236, boots #2a1e16, bandana #7a2c22.`
- `VISTA` — **acá está el trabajo de verdad.** Hacen falta cinco, y se piden
  **de a una**:

| Pedido | Qué es |
|---|---|
| `facing directly to the RIGHT (pure profile)` | de costado |
| `facing the camera and slightly to the right (three-quarter front)` | tres cuartos de frente |
| `facing the camera directly (front view)` | de frente |
| `seen from behind, turned slightly right (three-quarter back)` | tres cuartos de espalda |
| `seen from directly behind (back view)` | de espaldas |

> **Son cinco y no ocho porque el juego espeja.** La izquierda es la derecha
> dada vuelta. Pedir ocho es pagar tres de más.

**Y las animaciones**, si el personaje se va a mover, se piden aparte agregando
al final: `Sprite sheet: N frames of a walk cycle, laid out in a single
horizontal row on one transparent image, evenly spaced, same canvas size per
frame, the character's feet on the bottom edge in every frame.` Con `N` = 6 u
8. Las que hacen falta: quieto, caminar, correr, apuntar, disparar, golpear,
cargando un bulto, y caído en el piso.

---

## 2 · CABALLOS

```
Pixel art sprite of a WESTERN HORSE for a 2D game, drawn in
THREE-QUARTER view (camera looking down at roughly 45 degrees, like
classic 16-bit action RPGs). NOT a flat side view. NOT top-down.

SIZE: about 86 pixels from chest to tail and 68 pixels tall at the
withers. Realistic horse proportions — a working ranch horse, lean and
muscular, NOT a cartoon pony, NOT cute, NOT big-headed.

IT MUST WEAR A WESTERN SADDLE, saddle blanket, bridle and reins. But
there is NO RIDER — the horse is completely empty. Do not draw a person,
not even partially.

COAT: COLOR_DEL_PELAJE

STYLE: gritty spaghetti-western realism at small scale. Flat color areas
with hard-edged shading, warm near-black outline #1a120c (never pure
black). No gradients, no anti-aliasing, no blur, no glow.

BACKGROUND: fully transparent PNG with a real alpha channel. No checker
pattern, no white. No drop shadow or ground shadow of any kind.

FRAMING: all four hooves touching the BOTTOM EDGE of the image, the
horse centered horizontally, no empty margin below the hooves.

POSE: standing still, facing VISTA.
```

**Los huecos:**

- `COLOR_DEL_PELAJE` — `a solid bay brown coat with a black mane and tail`
  (el marrón que ya tenés), o alazán, o tordillo.
- `VISTA` — el caballo sí necesita **las ocho**, porque gira mientras galopás.
  Y se piden con los nombres de carpeta que el juego ya usa:
  `east`, `south-east`, `south`, `south-west`, `west`, `north-west`, `north`,
  `north-east`. (`south` = viniendo hacia vos; `north` = alejándose.)

**El galope** se pide aparte, y es lo único que de verdad importa que salga
bien: `Sprite sheet: 8 frames of a full gallop cycle, single horizontal row,
evenly spaced, same canvas size per frame, hooves on the bottom edge. The cycle
must loop seamlessly — the last frame flows into the first.`

> **Por qué 8 y no 6:** el juego engancha las pisadas al reloj del sonido, para
> que cada casco toque el piso justo cuando suena su golpe del "tucu-TÚN". Con
> un ciclo de 8 esa cuenta cierra.

---

## 3 · COSAS SIN MOVIMIENTO

Cajones, fardos, barriles de pólvora, cajas fuertes, lingotes, documentos,
asientos, faroles apagados.

```
Pixel art sprite of a single WESTERN PROP object for a 2D game, drawn in
THREE-QUARTER view (camera looking down at roughly 45 degrees, matching
classic 16-bit action RPGs). The object sits on the ground and we see
its TOP FACE and its FRONT FACE at the same time. NOT a flat side view.
NOT a flat top-down view. NOT an icon.

OBJECT: EL_OBJETO

SIZE: about TAMAÑO pixels. For scale, a floor tile in this game is 64
pixels and a standing man is 80 pixels tall.

STYLE: 1880s American frontier, worn and used — scuffed wood, rusted
iron, frayed rope, dusty canvas. Gritty and grounded, NOT clean, NOT
shiny, NOT fantasy, NOT ornate.

COLORS: flat color areas with hard-edged shading, warm near-black
outline #1a120c (never pure black). No gradients, no anti-aliasing, no
blur, no glow.

IMPORTANT — IT MUST NOT DISAPPEAR AGAINST THE FLOOR. This object will be
seen against a brown wooden floor (#6d4a30 and #7a5436) and dark brown
walls (#3a2a1f). Its main body must clearly CONTRAST against those
browns in brightness. Avoid mid-brown as the dominant color.

BACKGROUND: fully transparent PNG with a real alpha channel. No checker
pattern, no white. No drop shadow or ground shadow — the game draws its
own.

FRAMING: the object centered, with its BASE TOUCHING THE BOTTOM EDGE of
the image, no empty margin below it.
```

**Los huecos:**

- `EL_OBJETO` — uno solo por pedido. Nunca "una hoja con varios objetos": vienen
  con estilos distintos entre sí y en tamaños que no se pueden comparar.
  - `a wooden shipping crate with visible slats and iron corner brackets`
  - `a burlap bale tied with ropes`
  - `a wooden gunpowder barrel with iron hoops`
  - `a heavy iron safe with a round dial and brass hinges`
  - `a stack of gold bars`
  - `a bundle of documents sealed with red wax`
  - `a canvas sack tied at the neck`
  - `a wooden medical kit with a painted red cross`
- `TAMAÑO` — `40` para algo que se levanta con una mano, `64` (una baldosa)
  para un cajón, `80` para algo tan alto como una persona.

> **La línea del contraste no es un capricho.** En este proyecto ya pasó dos
> veces que algo quedara invisible por ser del mismo marrón que el piso. Un
> cajón `#4a3a2a` sobre un piso `#6d4a30` no se ve.

---

## 4 · COSAS QUE SE MUEVEN

Fogata, antorcha, humo, chispas, polvo, vapor, fuego que se propaga.

```
Pixel art ANIMATION SPRITE SHEET of EL_EFECTO for a 2D game, drawn in
THREE-QUARTER view (camera looking down at roughly 45 degrees), matching
a gritty 1880s western art style.

LAYOUT: exactly CUADROS frames of a single looping animation, laid out
in ONE HORIZONTAL ROW on one image. Every frame must use the SAME canvas
size and be evenly spaced, so the sheet can be cut into equal
rectangles. Each frame is TAMAÑO pixels.

THE LOOP MUST BE SEAMLESS: the last frame has to flow naturally back
into the first, with no jump, no fade to nothing, and no restart pop.

MOTION: DESCRIPCION_DEL_MOVIMIENTO

STYLE: flat color areas with hard-edged shading and a limited palette —
chunky, readable pixel shapes, NOT soft, NOT smoky airbrush, NOT
realistic particle render. No gradients, no anti-aliasing, no blur.

BACKGROUND: fully transparent PNG with a real alpha channel, in EVERY
frame. No checker pattern, no white, no black box behind the flames.
This is critical: the effect will be drawn over a dark night scene, and
any background rectangle will show as an ugly square.

FRAMING: the base of the effect touching the BOTTOM EDGE of each frame,
centered horizontally.
```

**Los huecos, con la fogata como ejemplo:**

- `EL_EFECTO` — `a campfire: burning logs with flames rising from them`
- `CUADROS` — `6` para fuego y humo (a 10 cuadros por segundo da un ciclo de
  0,6 s, que es lo que hace que una llama se vea inquieta y no nerviosa). `4`
  alcanza para polvo y vapor.
- `TAMAÑO` — `48x48` para una fogata, `24x24` para una antorcha o unas chispas.
- `DESCRIPCION_DEL_MOVIMIENTO`:
  - *fogata:* `the flames flicker and lean, rising and curling, with a few
    sparks drifting upward. The logs stay perfectly still — only the fire
    moves. Colors from deep red #7a2c22 at the base, through orange, to pale
    yellow at the tips.`
  - *fuego en una pared:* `flames licking upward along a wooden surface,
    leaning slightly to one side.`
  - *humo:* `a soft grey column drifting upward and widening as it rises,
    getting more transparent toward the top.`

> **Lo único que hay que revisar sí o sí en esta categoría es el ciclo.** Una
> IA te va a entregar seis dibujos lindos de fuego que, puestos en fila, se ven
> como seis fuegos distintos parpadeando. Poné la hoja en un visor de
> animación ANTES de aprobarla.

---

## Cómo usarlos, para no perder la tarde

1. **Pedí UNA vista primero y quedate con ella.** Recién cuando el personaje de
   costado te gusta, pedís las otras cuatro *mostrándole ésa como referencia*.
   Al revés te da cinco personajes distintos.
2. **La consistencia es lo que peor les sale.** Con cinco vistas y varias
   animaciones, contá con elegir y retocar, no con recibir y pegar. Es normal,
   no es que lo estés pidiendo mal.
3. **Un objeto por imagen.** Las "hojas de objetos" salen con estilos y escalas
   que no pegan entre sí.
4. **Mirá el tamaño real antes de aprobar.** Un dibujo que se ve glorioso
   grande puede ser una mancha a 80 puntos. Achicalo a 80 y miralo ahí.
5. **Fijate la licencia** si la herramienta la tiene: decide si el dibujo puede
   ir DENTRO del juego o sólo servir de referencia para dibujarlo con código.
