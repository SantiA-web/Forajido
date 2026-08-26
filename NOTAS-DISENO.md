# Notas de diseño — ideas aceptadas y todavía no construidas

Este archivo existe para que las ideas buenas no se pierdan ni se construyan
antes de tiempo. Es la parte más aburrida de trabajar en un juego y la que más
proyectos salva: **una idea aceptada no es una idea que se hace ahora**, es una
idea que ya tiene fase asignada y requisitos anotados.

Tres estados:

- **ACEPTADA** — se hace, en la fase indicada.
- **A VALIDAR** — buena idea, pero hay que probarla antes de comprometerse.
- **DESCARTADA** — con el motivo, para no volver a discutirla dentro de tres meses.

---

## ✅✅ EL ⚠ — la duda se confirmó, jugando con la fase 2 completa

**El problema original.** Santi jugó el tren completo y dijo:

> *"Vale muchísimo agarrar un par de bolsas e irte, porque el riesgo de quedar
> muerto antes de pasar a los vagones de más adelante es altísimo."*

El riesgo alto era el objetivo; que la respuesta fuera SIEMPRE "andate temprano"
no lo era. La fase 2 se juega entera en esa duda: *¿un vagón más, o me bajo?*

**Lo que pasó después.** Se construyeron, en este orden: el caballo que se elige
(una sola salida y la elegís vos), la alarma que sólo se moviliza hacia atrás, el
ruido por arma, y la aproximación a caballo. Entre medio hubo una vuelta en falso
—se aflojó tanto la presión que Santi dijo *"ahora es más fácil, pero no más
interesante"*, que es la señal de que estábamos bajando la dificultad en vez de
construir una decisión.

**Y entonces, jugando:**

> Sacó **$1238** (el 72% de un tren promedio), abriendo una caja fuerte en el
> blindado y otra en el correo, con la alarma sonando y **le sobraron un par de
> segundos**. Preguntado si en algún momento pensó en irse antes de terminar:
> **"Sí, hubo un momento de 'me voy o sigo'".**

**Esa frase es el objetivo de la fase 2.** Es la primera vez en todo el proyecto
que aparece. No la produjo un solo sistema: la produjo la suma de tener una única
salida que elegiste vos, un reloj que se paga en el galope, y una presión que ya
no se resuelve escondiéndose.

**Por qué NO se daba por cerrado en su momento:** era UNA partida. Una duda que
aparece una vez puede ser la composición del tren de ese día. Hacía falta
repetirlo varias veces y que la duda siguiera apareciendo, y sobre todo saber
**dónde** estaba cuando dudó — si fue por el reloj, por la vida o por la
distancia, porque cada una se sostiene con palancas distintas.

**SEGUNDA CONFIRMACIÓN, con la fase 2 completa (A, A+, B, C, D — jinetes
incluidos).** Jugando después de que los jinetes pasaran a ser una amenaza de
verdad:

> "Dudo si un vagón más mirando el tiempo. Un buen jugador avanza, uno malo
> se queda. El galope del caballo tiene sentido. Está todo en orden."

**Es la señal completa que la fase 2 venía persiguiendo desde el principio:**
- La duda aparece por **el reloj** específicamente (no por la vida ni por
  miedo a morir) — confirma que `raid.duration` (145s) es la palanca correcta,
  la misma que ya se había identificado como "la única validada por la
  experiencia de jugar" al bajarla de 170 a 145.
- **Diferencia por habilidad**: un jugador mejor avanza más, uno peor se
  queda atrás — es exactamente lo que hace que "un vagón más" sea una
  decisión y no una tirada de dados. El juego premia la destreza sin
  castigar con la muerte al que no la tiene (se queda, no se arriesga).
- **El galope (paso D) se valida retroactivamente**: la elección de dónde
  dejar el caballo sigue sintiéndose con sentido incluso con los jinetes
  metidos en la ecuación (que le suman presión al galope Y al asalto).

**Con esto, la fase 2 se da por cerrada en su objetivo central.** Quedan
deudas puntuales (ver el resto de este archivo: bono de trabajo limpio por
pieza, puerta blindada, mini jefes, abordaje por el techo), pero la pregunta
que abrió toda la fase — *¿un vagón más, o me bajo?* — ya tiene una
respuesta jugable y repetida.

### El riesgo que queda vivo: el botín está demasiado concentrado

Medido sobre 150 trenes: el tren promedio vale **$1716**, y de eso

| Vagón | Vale | Parte del tren |
|---|---|---|
| **Blindado** | $762 | 44% |
| **Correo** | $480 | 28% |
| Pasajeros / Comedor | ~$142 c/u | |
| Ganado | $47 | |

**Blindado + correo = 72% del tren.** Los otros cuatro vagones juntos valen $474.
O sea que la ruta óptima no hay que descubrirla, está escrita en los números: se
va a los dos vagones ricos y el resto es decorado. El botín de Santi ($1238) es
casi exactamente la suma de esos dos.

Eso no impidió que la duda apareciera, así que **no es una emergencia** — pero
sigue siendo el motivo más probable de que la duda no se repita. Palanca:
aplanar la distribución (subir las bolsas o angostar las cajas), o darle a los
vagones pobres algo que no sea plata, que es una de las ideas del ⚠ que nunca se
probó.

### Lo que dijeron los números (medido, no opinado)

Un jugador de prueba que camina derecho, sin disparar ni cubrirse, con la
alarma sonando desde el segundo cero:

| | Segundos | Vida perdida | Muertes |
|---|---|---|---|
| Volver del vagón 4 al caballo | 23 s | 1,6 | 0 / 5 |
| **Ir del vagón 1 al 4** | **29 s** | **2,8** | **2 / 6** |

**Ir hacia adelante cuesta casi el doble que volver.** Volviendo pasás por
vagones que ya reventaste, con los perseguidores detrás yendo a donde te vieron
por última vez; yendo, entrás a vagones frescos que te esperan de frente.

Eso significa que la frase del README — *"todo lo que avanzás lo tenés que
desandar"*, dicha como si desandar fuera lo caro — **describía mal el juego que
habíamos construido**. Lo caro es llegar. Y por eso "andate temprano" ganaba
siempre: no por la retirada, sino porque meterse era carísimo.

La curva completa de la retirada, por si hace falta después:
vagón 2 → 7 s · vagón 3 → 16 s · vagón 4 → 23 s · vagón 5 → 30 s (1 muerte de 6)
· vagón 6 → 34 s (**4 muertes de 6**). El salto está entre el 5 y el 6.

### El segundo sospechoso — revisado y descartado, Santi lo quiere así

**El bono de trabajo limpio (×2) se aplica al final, sobre TODO lo juntado, y es
todo o nada** (`raidScene.js`, `CONFIG.raid.cleanBonus`). La lectura original acá
era que eso es un freno que se aprieta solo: cuanto más botín limpio llevás
encima, más caro es cada vagón nuevo, porque al primer grito se evapora el bono
de todo lo que ya robaste bien — un impuesto retroactivo sobre lo que hiciste
bien, y la palanca propuesta era que cada botín se llevara su bono por separado.

**Se lo propuse a Santi para construirlo (con la fase 2 ya cerrada) y no
coincide con cómo lo ve él:** *"si suena la alarma pierdes el x2, sino te
llevas lo que conseguiste. Yo lo veo bien."* Para él el todo-o-nada es
justamente lo que sostiene la tensión (no te pongas codicioso), no un bug.
**No se construye.** Queda anotado acá para no volver a proponerlo sin que
aparezca una razón nueva y concreta para reabrirlo.

Palancas que siguen sin probar:
- Que el botín crezca hacia adelante (ojo: choca con "el botín no mejora hacia
  adelante", decisión explícita de Santi. Pero **ya está medio rota**: como el
  blindado no puede ir antes del vagón 3, el valor esperado sí sube hacia
  adelante. El 79% del botín del tren está en dos vagones, correo y blindado).
- Que haya algo que solo se consiga adelante y que no sea plata.

---

## ✅ HECHA · El tren de carga tiene identidad propia: el sigilo, el ganado y el peso

*(Santi: "el de carga siento que no tiene nada nuevo, simplemente es un tren
más largo, ¿cómo podríamos cambiar la experiencia que obtiene el jugador?")*

**El diagnóstico era correcto y vale anotarlo:** el de carga era una variación
CUANTITATIVA (más vagones, menos guardias, más reloj) sin una decisión NUEVA.
El estándar ya tenía su identidad —caminos y opciones— y el veloz la suya
—reflejos y caos—. Al de carga le faltaba el polo opuesto del veloz.

**Se evaluaron cuatro opciones antes de elegir**, y conviene dejar las
descartadas anotadas porque alguna puede volver:

| | Idea | Por qué no (todavía) |
|---|---|---|
| A | **Sigilo total** | Elegida |
| B | **El ganado como arma** | Elegida |
| C | **No te podés llevar todo** | Elegida, pero reformulada por Santi (ver abajo) |
| D | La tripulación te delata dónde está lo bueno | Compite con una decisión ya tomada ("casi sin pasajeros" es parte de la identidad del de carga) en vez de sumarse |

### La idea de Santi que mejoró la propuesta original

Yo había propuesto A+B, con C como un tercer sistema aparte. **Santi lo ató:
la C sólo se activa si sonó la alarma.** Y eso es mejor diseño que lo que
propuse, por un motivo concreto: en mi versión los tres sistemas convivían sin
tocarse, y en la suya **la C es la misma palanca que la A**, nada más que
hecha sentir DURANTE la partida en vez de sólo al final.

`raid.cleanBonus` (el doble de botín por salir sin alarma) existía desde hacía
rato y era **invisible**: sólo aparecía en la pantalla de resultados. Con la
idea de Santi, la alarma deja de ser un interruptor que se calcula al final y
pasa a ser **algo que pesa en tus manos mientras seguís jugando**.

**Y sube de a poco, no de golpe** (también decisión suya): así "¿agarro uno
más?" es una pregunta que te hacés en CADA botín después de la alarma, y no
una sola vez. Un escalón fijo se decide una vez y se olvida.

### Las tres piezas

**1. El sigilo se ve.** El HUD dice `LIMPIO` en verde apagado todo el asalto,
en el mismo lugar donde después dice `ALARMA`. Las dos caras del mismo estado,
sin inventar un widget nuevo.

**2. El ganado se suelta.** Las tranqueras (`data/wagons.js`, sólo si el tipo
de tren trae `estampida`) se abren con el mismo `[E]` de siempre. Salen cinco
reses hacia la LOCOMOTORA —al revés que los barriles, que van hacia la cola— y
voltean a cualquier guardia del pasillo con `stagger`, el mismo estado que ya
usaba el cuerpo a cuerpo. No hizo falta inventar nada: `systems/ai.js` ya sabía
que un guardia con stagger no piensa, no apunta y no dispara.

**Es la primera cosa del juego que el jugador le hace AL TREN**, y no al revés.
Los barriles te caen encima; la estampida la soltás vos. Por eso es la pieza
que hace jugable el sigilo: hasta ahora "ir limpio" era sólo EVITAR pelear.

**Los tres costos que la salvan de ser gratis:**
- `abrirHold` (0,9 s) quieto en el pasillo, al descubierto — el mismo precio
  que la caja fuerte.
- Hace ruido: los guardias vienen a mirar. **Pero no enciende la alarma** — no
  se emite `wagons` en el evento, así que no propaga ni dispara nada. Ésa es
  toda la diferencia entre una herramienta de sigilo y un atajo al tiroteo.
- **Te atropella a vos igual que a ellos.** Por eso existe `arranque` (1 s en
  que se amontonan antes de salir): es el aviso Y tu ventana para meterte en un
  hueco entre corrales. Las tranqueras están puestas pegadas a un hueco a
  propósito — si el más cercano quedara a media docena de baldosas, la jugada
  sería una trampa en vez de una decisión.

**3. El peso.** Sin alarma: cero fricción. Con alarma: 2% de velocidad por cada
$100 encima, tope 35%. Medido: $410 sin alarma → 78 px/s (nada); $837 con
alarma → 65 px/s; el tope se toca recién con un botín enorme (51 px/s).

### 🐛 SEGUNDA VUELTA · El sigilo no cumplía lo que el propio código prometía

*(Santi, jugando: "cuando me acerco por la espalda apretando la barra
espaciadora se le pone la barrita en amarillo al guardia, eso no debería
pasar, porque le da muy poco tiempo al jugador de hacerle el ataque
sigiloso")*

**No era el ruido de las pisadas — ésas ya estaban bien.** `oirPisadas` corta
en seco si vas agachado. Era la VISTA: `canSeeFrom` saltea el cono de visión
entero cuando estás a menos de 26px, así que el guardia te "veía" desde
atrás.

**Y el degüello necesita estar a 15px** (`melee.range`), o sea SIEMPRE adentro
de esos 26. Acercarse por la espalda para degollar despertaba al guardia antes
de llegar, hiciera lo que hiciera el jugador. La maniobra era literalmente
imposible de hacer limpia.

Medido antes del arreglo: agachado y por la espalda, la sospecha se mantenía en
0 hasta los 30px y arrancaba justo al cruzar los 26.

**ES EL MISMO TIPO DE ERROR QUE EL DE LA COBERTURA, hace unas vueltas: el
comentario decía lo correcto y el código hacía otra cosa.** Acá la promesa está
escrita en TRES lugares del proyecto (README, estas notas y `data/config.js`):
*"agachado no hacés ningún ruido, así que te podés pegar a la espalda de
cualquiera"*. Van dos veces que un texto del propio repo describe una regla que
el código nunca cumplió — vale la pena tratarlos como sospechosos y no como
documentación.

**Arreglo:** el corte de 26px sigue existiendo (no se puede estar parado
ENCIMA de alguien y ser invisible) pero **no se aplica si vas agachado**.
Agachado manda el cono, siempre.

Verificado, tres casos:

| | Sospecha al llegar a 12px |
|---|---|
| Agachado, por la espalda | **0** — sigue en `patrol` |
| Parado, por la espalda | 0,381 — pasa a `suspicious` |
| Agachado, DE FRENTE | 0,762 — te ve igual (agacharse no es invisibilidad) |

Y el ciclo completo: llegar agachado por atrás, degollar, **y que la alarma no
suene**. Antes era imposible.

### SEGUNDA VUELTA · La estampida no alcanzaba para rematar

*(Santi: "una vez la res le pega a un guardia, es muy poco el tiempo que
permanece inconsciente. Y si está inconsciente y una res lo vuelve a pisar, lo
debería matar")*

**Las dos cosas eran ciertas y las dos mejoran la herramienta.**

`aturdeGuardia` subió de **1,3 a 3,0 s**. La cuenta que lo justifica: a 78 px/s,
cruzar los 100-150px que suele haber hasta el guardia son casi dos segundos,
más el tiempo de encarar el degüello. Un aturdimiento más corto que eso es
decorativo — el guardia se levantaba justo antes de que llegaras, así que la
estampida no servía para lo único que la hace una herramienta de sigilo:
**abrirte la oportunidad**.

**Y la segunda res mata al que ya está en el piso** (`matalAturdido`). Eso le da
sentido a que salgan CINCO y no una: la primera lo voltea, las de atrás deciden
si se levanta. Es una muerte silenciosa —no dispara la alarma, igual que un
degüello— pero deja el cuerpo tirado, y de eso ya se encarga el sistema de
cadáveres que existe desde la fase 2.

### TERCERA VUELTA · Tres correcciones de alcance

*(Santi, después de jugarlo)*

**1. La manada no cruza al blindado.** Las reses saltan los enganches —por eso
se miden por `alcance` y no por el borde del vagón— pero entraban también al
blindado, y eso rompía la regla más vieja del tren: **al blindado no se entra
sin volar la puerta**. Ahora se frenan en su puerta. Se pregunta por
`guardType === 'blindado'` y no por el nombre del vagón, así vale igual para el
blindado largo y para el corto del tren veloz. Medido: la res se detiene
exactamente en el borde (x del blindado), sin entrar nunca.

**2. Lo mata la segunda ESTAMPIDA, no la segunda res.** Yo lo había hecho al
pie de la letra —cualquier res que pisara a alguien ya caído lo remataba— y eso
volvía gratis lo que tiene que ser una jugada preparada: las cinco reses de un
mismo tropel salen juntas, así que la #2 llegaba sola medio segundo después.
Ahora cada manada lleva su `estampidaId` y el guardia se acuerda de cuál lo
volteó (`aturdidoPor`): una manada lo tira una vez y las otras cuatro reses le
pasan por encima sin sumar nada. Para matarlo hay que **abrir una segunda
tranquera y llegar antes de que se levante** — los 3 segundos del aturdimiento
son el reloj de esa jugada.

**3. El peso del botín es sólo del tren de carga.** Estaba aplicándose a los
tres, y eso le borraba la identidad a los otros dos: el estándar tiene su
decisión en los caminos y el veloz en el reflejo. Pasó a ser un campo del tipo
de tren (`pesaElBotin`), como todo lo demás en este archivo. Medido: con $828 y
$918 encima y la alarma sonando, estándar y veloz siguen a 78 px/s; el de carga
con $1053 baja a 62.

**La regla de fondo, otra vez la misma:** cada cosa nueva es una propiedad del
TIPO DE TREN, no una regla del juego. Cuando algo empieza a aplicarse a los
tres, deja de distinguir a ninguno.

Verificado, ahora por manadas y no por reses:

| | Resultado |
|---|---|
| 1 manada (5 reses) | Aturdido 2,98 s, **vivo** |
| 2 manadas | **Muerto** |

### 🐛 Un bug real que apareció construyendo, y de los buenos

Las reses nacían y **se quedaban clavadas en el aire**: no se movían, no
atropellaban a nadie. La causa: `updateRodantes` arrancaba con
`if (!train.rodantesCada) return;` — y el tren de carga NO genera barriles, así
que el `return` se llevaba puesto todo el sistema.

**Dos cosas distintas compartían una llave:** el GENERADOR de barriles (que sí
debe estar apagado en este tren) y el MOVIMIENTO de lo que ya rueda (que tiene
que correr siempre). Se separaron en `actualizarGeneradorDeBarriles` y
`moverRodantes`. Vale como regla: *un `return` temprano que apaga un sistema
entero es sospechoso apenas ese sistema empieza a tener más de un origen.*

### Y la res hubo que dibujarla dos veces, mirándola

La primera versión era un rectángulo oscuro con otro rectángulo claro adentro y
los cuernos flotando sueltos al costado. **Se leía exactamente como un cajón
con tapa** — que es la peor confusión posible, porque la mitad de las cosas que
ruedan por este pasillo SON cajones.

Lo que lo arregló no fue más detalle sino **la silueta**: a 18x14 px lo único
que separa un animal de una caja es que NO SEA UN RECTÁNGULO. El cuerpo termina
antes del frente, la cabeza sale aparte y más angosta, y los cuernos van
pegados a ella. Y la mancha del pelaje pasó de vertical a ACOSTADA sobre el
lomo: parada se leía como una raya de luz. Verificado poniendo una res y un
barril lado a lado — ahora se distinguen de un vistazo.

---

## ✅ HECHA · Tipos de tren y niveles de dificultad — la primera respuesta al botín concentrado

*(pedido de Santi: tres tipos de tren y tres niveles de dificultad, como
catálogos — mismo patrón que `WEAPONS`, `HORSES` y `DIFICULTADES`)*

**Tres tipos de tren, en `data/train.js` (`TRAIN_TYPES`):**

- **Estándar** — el de siempre, sin tocar.
- **Veloz** — frenético, sin sigilo, y una apuesta EXPLÍCITAMENTE distinta a
  las otras dos, no una versión "más difícil" del estándar. Sólo tres cosas
  cambian, y nada más (ni armas de los guardias, ni dinamita fuera del
  blindado): los disparos se oyen un vagón más lejos (`ruidoExtra: 1`, se
  suma al `noiseWagons` del arma sin tocarlo), la sospecha y el grito van
  ×1.5 (`sospechaMult`), y el asalto dura 100s en vez de 145. Y el blindado va
  SIEMPRE al último vagón, pegado a la locomotora — una regla de composición
  nueva, `posicionFija`, separada de `posicionMinima` que sigue usando el
  estándar.
- **De carga** — el opuesto: 8 vagones, mayoría mercancía (`correo_liviano`,
  `ganado`), casi sin pasajeros, MENOS guardias en total pese a tener más
  vagones (11 contra los ~12 del estándar de 6), y el asalto dura un poco más
  (165s). Es la primera respuesta real a la nota de acá abajo.

**Tres niveles de dificultad, en `data/train.js` (`DIFICULTADES`):** Fácil y
Media ya existían (`tranquilo`/`escoltado`, sólo estaban apagadas). **Alta es
nueva y NO toca la vida** — se queda en los números de Media (guardia común 3,
blindado 4, el tope del juego) — mejora CÓMO pelean: puntería, tiempo de
reacción, sospecha y frecuencia de asomada, todo -25%/-30%/+25%/-30% contra la
línea de base.

**La pieza cara: cada guardia pasa a llevar su propio perfil de IA.** Antes
`systems/ai.js` leía `CONFIG.enemy` a secas, una sola constante para todo el
juego. Ahora cada guardia nace con `e.ai` (`entities/enemy.js`), una copia de
`CONFIG.enemy` con lo que le toque encima — mismo patrón que ya usan con la
vida vía `guardHealth()`. Un guardia sin overrides se comporta exactamente
igual que antes; uno de un tren "dura" trae los overrides de dificultad, y uno
de un tren "veloz" además multiplica la sospecha encima de eso (las dos cosas
se combinan si coinciden: medido, sospecha `2.75 × 1.5 = 4.125`).

**El mapa sortea, no fija.** `data/region.js` tenía `composicion`/`dificultad`
reservados en `null`, pensados como "el tren fijo de esa vía". Se sacaron: en
vez de eso, `scenes/mapScene.js` sortea tipo de tren + dificultad + composición
CADA VEZ que el cursor entra en una vía con servicio (no una vez por ruta, no
un timer — un sorteo por cada vez que volvés a mirar), y el cartucho de abajo
lo muestra. Medido por consola, la misma vía dio `carga/dura`, `veloz/
escoltado`, `veloz/tranquilo`, `carga/dura` en cuatro entradas seguidas.

**Un bug real que apareció construyendo esto, y no tenía que ver con lo
nuevo:** `raidScene.js` tenía `TRAIN.length` (6, fijo) hardcodeado para saber
dónde patrulla el refuerzo que entra por la locomotora. Con el tren de carga
en 8 vagones, ese refuerzo aparecía en el vagón equivocado. Se arregló con
`train.wagons.length - 1` (el último índice real), y de paso ese refuerzo
ahora nace con el mismo perfil de IA que el resto del tren (antes nacía
siempre con `CONFIG.enemy` puro, sin importar la dificultad).

**Verificado por consola** (motor manejado a mano, sin poder ver la pantalla
componiendo cuadros): las 9 combinaciones de tipo×dificultad construyen sin
avisos de colocación (apareció uno real —un centinela del blindado corto
sobre un pilar— y se corrigió); el blindado corto siempre sale último en el
veloz; la duración y el bono de ruido llegan correctos al asalto; un disparo
de Colt en un tren veloz emite `wagons: 2` (1 del arma + 1 del tren); y el
cartucho del mapa se vio con `foto.ps1`, las cinco líneas legibles dentro del
recuadro.

### TERCERA VUELTA · El tren veloz no se sentía frenético, y el reloj no alcanzaba

*(Santi, jugándolo: "el tren veloz no solo quería que fuera más rápido, sino
más frenético, que el jugador no tenga tiempo ni de pensar. Por qué no me pasa
eso al jugarlo?")*

**La causa apareció midiendo, no jugando, y era una cuenta de proporciones.**
El tren veloz mide un **55%** de lo que mide el estándar (los vagones son la
mitad de largos), pero el reloj sólo había bajado a un **69%** (100s contra
145s). O sea que, por baldosa de tren, **sobraba MÁS tiempo que en el
estándar**. Nada te obligaba a apurarte, así que se jugaba con la misma cautela
de siempre y el vértigo no aparecía nunca.

**Primer arreglo: `raidDuration` de 100 a 70.** El criterio no fue el gusto: el
estándar exige ~0,045 segundos por píxel de tren, y 70s le da al veloz 0,040 —
más ajustado que el estándar, que era lo que faltaba. Medido con el bot torpe
de siempre (camina derecho, no se cubre, no pelea): cruzar el tren entero ida y
vuelta son ~52s, así que quedan ~17s de verdad para hacer algo. Y el bot muere
casi siempre en el veloz... pero **también muere casi siempre en el estándar**,
o sea que el reloj más corto no lo volvió más letal, sólo más exigente.

**Y jugado, eso tampoco era lo que buscaba.** Santi: *"ahora sí se siente más
que el tiempo es ajustado y te aprieta. Pero no es lo que buscaba. Yo pensaba
en cosas como que el tren sea el enemigo a vencer."*

**Ahí está la lección que vale más que el número:** *apretar el reloj produce
TENSIÓN, no VÉRTIGO.* Son cosas distintas y se construyen distinto. La tensión
sale de un recurso que se agota mientras decidís; el vértigo sale de que te
pasen cosas encima que te obliguen a reaccionar sin pensar. El reloj no podía
dar lo segundo por más que se lo bajara.

### ✅ HECHA · El tren como enemigo — barriles y cajones sueltos

*(idea de Santi: "barriles rodando hacia vos, cajas cayéndose cerca tuyo, fuego
por explosiones, el tren acelerando y desacelerando". Se construyó el primero
de la lista, a propósito: uno solo, jugarlo, y recién después los otros)*

**Hasta acá, todo lo que te podía lastimar adentro de un vagón era una persona
con un arma. El tren era el piso donde pasaban las cosas.** Ahora cada tanto se
suelta un barril o un cajón y baja rodando por el pasillo hacia la cola.

**NO HIZO FALTA INVENTAR UN PARADIGMA: ya existía.** Los carteles del techo
(fase 2, paso C) son exactamente esto — aparece, viene hacia vos, lo leés y
elegís rápido. Lo único que se hizo fue bajar ese lenguaje del techo al
pasillo. Eso importa por dos motivos: es mucho más barato, y el jugador ya sabe
leerlo.

**LA DIFERENCIA CON EL CARTEL DEL TECHO, Y ES LA QUE LO HACE MEJOR: hay DOS
respuestas, no una.** Arriba sólo podés agacharte o saltar. Acá podés salirte
del pasillo **o reventarlo a tiros** — y por eso tiene vida (3). Con el Colt
son media recarga, así que gastarlas es una decisión de verdad y no un trámite.
Verificado: exactamente 3 tiros lo revientan y te dejan con 3 balas de 6.

**No saca vida** (pedido explícito de Santi, y coincide con cómo cobra los
errores el resto del juego): te lleva puesto, caés de espaldas y tardás **1,5
segundos** en levantarte, sin poder disparar, moverte ni cubrirte. Medido
aislando el sistema (sin guardias): 1,52s en el piso, vida 4→4, y disparar
estando caído es imposible. En un vagón con gente apuntándote eso ya es de los
castigos más caros que tiene el juego — sumarle daño lo volvería el peor
castigo por el error más fácil de cometer.

**Tres decisiones que lo hacen justo, y las tres salieron de reglas viejas del
proyecto:**

1. **Nunca aparece sin `pistaMinima` (170px) de pista entre el barril y vos.**
   Si el vagón no da para eso, ese turno no se suelta nada. Los vagones del
   tren veloz miden 224px, así que sin esta regla podía nacer prácticamente
   encima — y en este juego no hay un solo peligro que no se pueda ver venir
   (el guardia levanta el arma, la mecha parpadea, el cartel entra en pantalla).
2. **Se caen del tren en el enganche.** El barril que llega al borde del vagón
   se va al vacío. Eso le da al enganche —que no tiene cobertura y te deja
   servido a los jinetes— un sentido nuevo: es el único lugar donde esto no te
   alcanza. Un intercambio más, no un refugio.
3. **Sólo TUS balas lo revientan.** Que un guardia te lo resolviera de
   casualidad sería sacarte de encima un problema que el juego te puso a vos
   para que elijas qué hacer. Verificado: una bala de guardia lo atraviesa sin
   tocarle la vida.

**Ruedan siempre hacia la cola**, porque el tren acelera y lo suelto se va para
atrás. Consecuencia buena que salió sola: **entrando te vienen de frente,
volviendo te alcanzan por la espalda.** La misma cosa se lee distinto según
para dónde vayas.

**Y es una propiedad del TIPO DE TREN** (`rodantesCada` en `data/train.js`), no
una regla del juego: hoy sólo el veloz suelta carga. Un tipo de tren sin ese
campo se comporta como siempre. Verificado que el estándar y el de carga no
sueltan nada en 15 segundos.

#### Dos cosas que hubo que arreglar mirándolas, no midiéndolas

1. **El polvo del barril era invisible.** Se hizo con el mismo color del polvo
   del galope (`#6b5236`)... que allá cae sobre tierra oscura y acá caía sobre
   un piso de madera casi del mismo tono. Pasó a un tono claro (`#c0a884`).
   **Copiar un efecto de otra escena no es copiar su color: es copiar su
   contraste contra el fondo que tiene detrás.**
2. **Un barril quieto se confunde con la carga dibujada en el vagón**, que es
   marrón y cuadrada igual. Por eso lleva estela: no es adorno, es lo que dice
   "esto viene en serio" de un vistazo, y de paso marca para qué lado va.

#### SEGUNDA VUELTA · De a uno se esquivaban demasiado fácil

*(Santi, jugándolo: "deberían ser un poco más rápidos y que vengan de a más.
Hoy vienen de a uno y muy fácil de esquivar, yo quiero que el jugador sienta
más presión a la hora de tomar decisiones")*

**Tenía razón, y el motivo es que un barril solo se resuelve con UN gesto:** te
corrés, pasa, volvés al pasillo. No hay decisión ahí, hay un reflejo. La
presión aparece cuando la respuesta barata deja de alcanzar.

**Lo importante fue CÓMO vienen de a más: escalonados en el tiempo, no juntos
en el espacio.** Dos barriles pegados uno al lado del otro son UN barril más
ancho — te corrés una vez igual. Separados medio segundo, en cambio, el hueco
entre uno y el siguiente es de unos 50px y te pasa por encima en un cuarto de
segundo: **no te alcanza para meterte y volver a salir**, así que tenés que
quedarte fuera del pasillo hasta que pase la tanda entera. Ahí está la presión.

Y hay una segunda pinza que la refuerza sola: **una tanda de tres cuesta NUEVE
balas**, más de un tambor lleno del Colt. El arma deja de ser una respuesta
válida para el grupo entero, y hay que elegir a cuál gastarle y de cuál
correrse.

**Los números:** velocidad 105 → 135, tandas de 2 a 3 con 0,45s entre uno y el
siguiente, y el intervalo entre tandas de 3,2 a 3,8s. Medido con un piloto que
avanza por el pasillo sin esquivar nunca:

| | Antes | Ahora |
|---|---|---|
| Barriles por minuto | 5,3 | **11,3** |
| Aviso promedio | 1,40 s | 1,18 s |
| Aviso mínimo (corriendo de frente) | 1,16 s | **0,78 s** |

**Y `pistaMinima` BAJÓ de 170 a 150 al mismo tiempo que la velocidad subía, que
parece al revés y no lo es.** Con 170px y los vagones cortos del veloz (224px
el de ganado), el barril sólo podía nacer si estabas en el primer cuarto del
vagón — o sea que casi nunca aparecía, que es justamente lo que Santi estaba
notando. El aviso real sigue siendo de 1,1s quieto y 0,7s en el peor caso
(corriendo de frente), y el hueco entre asientos más cercano está siempre a
menos de medio segundo.

#### La regla que hubo que agregar: no se puede encadenar

**Un barril te tumba UNA vez, no una por cada uno de la tanda.** Mientras estás
en el piso, los que siguen te pasan por encima sin tocarte. Sin eso, una tanda
de tres te dejaría cuatro segundos y medio tirado — y eso ya no es presión, es
perder el control de la partida.

Verificado: parado en el pasillo sin esquivar, **7 caídas en 30 segundos,
siempre de 1,52s exactos, y la vida nunca bajó de 4**. O sea que ignorarlos por
completo cuesta ~10 s de un asalto de 70 (el 15% del reloj) y ni una vida.

**Un efecto de segundo orden que apareció midiendo y resultó bueno:** cuando un
barril te tumba, el empujón te manda hacia la cola, y si estabas cerca del
borde del vagón terminás en el enganche — donde no aparece ninguno. O sea que
el propio golpe te escupe al único lugar seguro, a cambio de dejarte expuesto a
los jinetes. No estaba diseñado; sale de las dos reglas juntas y se sostiene
solo.

#### TERCERA VUELTA · El piso también, y con la misma regla de siempre

*(Santi: "el balanceo haga que las balas se dispersen más, lo mismo para los
guardias que para el jugador. El acelerar y desacelerar hace que el jugador se
desplace, y eso hace que caigan más barriles". Y sobre la objeción que yo
había puesto contra el "perder el equilibrio" original: "podría haber un
pequeño balanceo que avise al jugador y después el balanceo grande con el
efecto")*

**Esta versión sí pasa la regla que hundió a la primera** ("todo peligro avisa
antes"), y por un motivo concreto: la dispersión pareja no es un castigo AL
JUGADOR, es que el terreno es peor para cualquiera parado en él — mismo
espíritu que ya tiene el resto del juego (la niebla de guerra, el sigilo, la
puntería de los jinetes). Y el empujón es una fuerza física con causa visible
(el fondo acelera o frena DE VERDAD), no un tropezón random.

**Un solo sistema, tres tiempos, dos sabores:**

1. **AVISO** (0,6s) — balanceo chico, crujido, CERO efecto. Tu ventana para
   meterte a cubierto o dejar de apuntar algo fino.
2. **EFECTO** (1,6s) — el sacudón. Acá pega todo.
3. **VUELVE** (0,5s) — se asienta.

Y sortea entre **ACELERA** (empuja hacia la cola, sacude la carga: dispara una
tanda extra de barriles reusando el sistema que ya existía) y **FRENA**
(empuja hacia la locomotora, no toca los barriles — frenar no le saca
tracción a la carga, se la da).

**Por qué la dispersión se SUMA y no se multiplica**, que es la decisión que
sostiene todo lo demás: sumar castiga mucho más al que apunta fino. El Colt
(0,035) casi se TRIPLICA con el +0,06; un guardia de lejos (0,28) casi ni lo
nota. El sacudón se lleva puesta justo la ventaja de la puntería, que es
exactamente lo traicionero que se buscaba — y sigue siendo parejo, porque vos
también tirás sucio con cualquier arma en ese momento.

**Por qué a cubierto no te arrastra:** estar pegado a una pared es estar
afianzado. Es la primera vez que la cobertura vale algo MIENTRAS no estás
peleando, no sólo cuando te tapa de una bala.

**Reuso, no invención, en las dos piezas caras:**
- La dispersión extra se lee de `world.dispersionExtra` tanto en
  `entities/player.js` (`shoot`) como en `systems/ai.js` (`spreadAt`, que ya
  existía para la dificultad "dura" — ahora toma un tercer parámetro). Los
  jinetes de afuera NO la leen (tienen su propio sistema de puntería,
  `systems/riders.js`, sin tocar): van a caballo, el vagón que se bambolea no
  es un problema de ellos.
- Los barriles extra del ACELERA no crean nada nuevo: suman a
  `rodanteRafaga`, el mismo contador que ya escalona la salida de una tanda
  normal (ver la vuelta anterior). Si ya había una tanda en curso, se la
  alarga; si no, arranca una.

**Verificado por consola, con el motor manejado a mano:**

| | |
|---|---|
| Dispersión real del disparo (desviación medida) | 0,0235 fuera del efecto → **0,0576 durante** (esperado: 0,020 → 0,055) |
| `dispersionExtra` en estándar y carga | Siempre 0 |
| Empujón sin cobertura | 28,3px, siempre en la dirección correcta (ACELERA → -x, FRENA → +x) |
| Empujón con cobertura real (`findCoverSurface`, no un objeto armado a mano) | **0,0px** |
| Barriles creados justo después de arrancar el efecto | 1-3 en ACELERA, **siempre 0 en FRENA** |

**Una trampa de medición nueva, para la lista.** La primera vez que medí la
cobertura me dio que empujaba IGUAL con cobertura que sin ella. El bug era
mío: armé un `p.cover` a mano sin `coverX`/`coverY`, y `coverStillValid()` lo
descartaba solo en el primer cuadro — el jugador nunca estuvo realmente
cubierto, sólo parecía estarlo. Con una cobertura real (`findCoverSurface`,
la misma función que usa el juego) el empuje dio exactamente 0. **Armar a
mano el estado de una entidad para medir es más fácil de arruinar que dejar
que el propio juego lo construya.**

Y otra parecida con el techo: dos verificaciones seguidas dieron
`enTecho: false` cuando debía dar `true`. No era el sistema — era que cada
llamada a `scenes.goTo('raid', ...)` sin pasarle `composicion` sortea un tren
NUEVO, así que el vagón con techo que había mirado en la primera llamada no
era necesariamente el mismo tren de la segunda. Fijando la misma
`composicion` en las dos, volvió a dar `true` siempre.

#### 🐛 BUG ENCONTRADO Y ARREGLADO · El descanso entre tandas se contaba mal

*(Santi, jugando: "en un momento me vinieron tres obstáculos seguidos, y luego
otros tres al ratito")*

**Confirmado midiendo, no adivinando.** Un piloto quieto en un vagón durante
15 minutos reales de asalto (898s, reloj estirado a propósito sólo para
medir) registró 224 tandas. En **16 de ellas** (7%), una tanda de tres
terminaba y la siguiente —también de tres— arrancaba antes de 2,5 segundos.
Exactamente el patrón que describió.

**La causa: `rodanteTimer` contaba desde que la tanda ANTERIOR empezaba, no
desde que terminaba.** El sorteo da entre 2,85 y 4,94s (`rodantesCada *
rng.range(0.75, 1.3)`), pero una tanda de tres tarda casi un segundo en salir
completa (`rafagaGap` × 2). Si el sorteo caía cerca del mínimo, el descanso
REAL —desde el último barril de una tanda hasta el primero de la próxima—
podía quedar en menos de 2 segundos. El número que el juego "prometía" (el
sorteado) y el que el jugador realmente vivía (el que quedaba después de
restarle el tiempo de la tanda) eran dos cosas distintas, y nadie se había
dado cuenta hasta jugarlo.

**Arreglo: el timer del descanso sólo corre cuando no hay una tanda en
curso.** Antes corría siempre, en paralelo. Ahora se pausa mientras
`rodanteRafaga > 0` y recién arranca a contar cuando la tanda anterior salió
entera. El descanso sorteado pasa a ser el descanso real, siempre.

**Y había una segunda puerta para el mismo bug, en el traqueteo.** Cuando
ACELERA sacude la carga y agrega barriles extra, esos barriles usaban el
mismo contador de la tanda — pero el `rodanteTimer` normal seguía corriendo
de fondo, ajeno al sacudón, y podía dispararse apenas terminaba la tanda
extra. Se arregló igual: el sacudón ahora también reinicia `rodanteTimer`,
así el ciclo normal no le pisa la cola.

**Medido después del arreglo, misma prueba de 15 minutos:**

| | Antes | Después |
|---|---|---|
| Hueco mínimo entre tandas | 1,83 s | **2,88 s** |
| Hueco promedio | 3,33 s | 4,23 s |
| Tandas seguidas (<2,5s) | 23 de 224 (10,3%) | **0** |

**La lección para la lista de trampas de medición:** un sistema con DOS
temporizadores independientes (uno que decide "cuándo" y otro que decide
"cuántos, escalonados") necesita que el primero SEPA del segundo — si no, el
"cuándo" mide desde un punto que ya no es el que el jugador experimenta. No
alcanza con que cada pieza esté bien calibrada por separado.

#### Lo que queda de la lista de Santi

Quedan sin construir, a propósito, hasta jugar lo que ya hay: **cajas que caen
desde arriba** y **fuego después de una explosión**.

**La del tren acelerando NO quedó descartada — se retomó con el aviso que le
faltaba.** La primera vez la saqué de la lista porque era la única de las
cuatro sin una señal que se pudiera leer y esquivar: un tambaleo que te
arruina la puntería sin avisar se siente a trampa, no a tensión. La objeción
seguía en pie hasta que Santi propuso exactamente el arreglo que hacía falta
— *"un pequeño balanceo que avise, y después el balanceo grande con el
efecto"* — y con eso construido (ver la vuelta de arriba), la razón para
dejarla afuera desapareció. Quedó como el sistema del "tren traicionero",
completo.

#### CUARTA VUELTA · El reloj de 70s no era el problema, pero igual hacía falta más

*(Santi, después de jugarlo con barriles y traqueteo juntos: "se siente muy
bien... pero le añadiría que el jugador tenga más segundos para hacer el
asalto. Sólo pude sacar $200 al probarlo")*

**Antes de tocar el número, medí qué lo estaba comiendo de verdad.** Armé un
piloto que junta TODO lo que puede sin pelear —sortea barriles, va derecho a
cada botín, nunca se cubre porque no hay de qué cubrirse— con los guardias
neutralizados. Con los 70s viejos, ese piloto ya sacaba **~50% del tren**
($700-900 de un total que promedia ~$1400).

**Eso corrige una suposición, no confirma la queja tal cual.** El reloj SOLO
no era el cuello de botella — con margen de sobra y sin pelear, alcanza. La
plata que le faltó a Santi jugando de verdad se le fue **peleando**, no
caminando: cada guardia que hay que resolver, cada vez que te cubrís a
esperar que baje la sospecha, cada tiro que falla por el balanceo, come
segundos que mi piloto sin combate nunca gasta.

**Y aun así, subir el reloj es la decisión correcta — por un motivo distinto
al que parecía.** No es que 70s "no alcance para robar": es que 70s no
perdona un combate que sale mal. Con el margen tan finito, una pelea de más
te puede dejar sin nada aunque hayas jugado bien el resto. `raidDuration`
subió a **90s** (+29%): sigue siendo bastante más ajustado que el estándar
(145s, y el veloz mide 55% de esa distancia), pero deja colchón para el
combate real, que es donde de verdad se está yendo el tiempo.

**Lo que no se tocó, a propósito:** ni `rodantesCada` ni `traqueteoCada`. La
medición no encontró nada mal en esos dos sistemas — el problema nunca fue
"vienen demasiado seguido", fue que el reloj alrededor de ellos (y del
combate) era demasiado corto. Tocar el síntoma correcto es tan importante
como no tocar los que están bien.

### SEGUNDA VUELTA · Los trenes dejaron de ser un sorteo y pasaron a ser trenes

*(idea de Santi, y arregla algo que la primera versión había hecho mal: "un
tren no es que llega a un punto y se devuelve por dónde vino, no es un auto")*

**El error de la primera versión, y vale anotarlo:** el sorteo estaba atado
**al cursor**. Cada vez que pasabas el mouse por una vía se sorteaba de nuevo
qué tren había. Cumplía el pedido literal ("que varíe entre visitas") pero por
el camino equivocado: **el tren no existía, lo inventaba el que miraba.** Mirar
dos veces la misma vía daba dos trenes distintos, que es lo que hace un menú
que se refresca, no un mundo.

**Lo que lo arregla es que las vías sean CIRCUITOS.** Un tren sale de una
estación, para en unas cuantas y vuelve a la misma de donde salió. Y entonces
el sorteo tiene dónde engancharse, con una regla física en vez de una de
interfaz:

| Cuándo | Qué se sortea de nuevo |
|---|---|
| Al pasar por una **parada** | **La escolta** (puede subir, bajar o quedarse) |
| Al **cerrar la vuelta** en su terminal | **El tipo de tren entero**, y su formación |

Ahora el cartucho **lee** un tren que está ahí, y hacer clic te da exactamente
ése — verificado comparando lo leído contra lo que recibe el galope: mismo
tipo, misma escolta y los seis vagones en el mismo orden.

**La consecuencia buena salió sola de la geometría, y es la mejor parte.**
Como todos los trenes andan a la misma velocidad real (`REGION.velocidadTren`,
7 px/s), **el tamaño del circuito decide cada cuánto cambia el tren**: el de la
Mina mide 158px y da la vuelta en 22s, así que cambia de tipo seguido; la Línea
del Norte mide 435px y tarda 62s, así que es "el tren de esa línea" durante
toda tu visita. No hubo que escribirle un número a cada ruta — y de paso
"circuitos de distinto tamaño" dejó de ser decoración y pasó a significar algo.

**Las dos líneas que vienen de otra región** entran por el borde derecho,
cruzan y se van. No dan la vuelta: cuando se van, esa vía queda **sin tren**
entre 16 y 38 segundos, y después asoma otro con tipo y escolta nuevos. Son la
costura con las regiones que no existen todavía, y le enseñan al mapa algo que
ninguna otra vía puede: **que a veces no hay nada que robar y hay que esperar.**

**El mapa sigue corriendo aunque no lo mires.** El estado vive en el closure de
la escena, no en `enter()`, y al abrirlo se adelanta el tiempo real que pasó
(`ponerseAlDia`, a pasos de 0,25s con tope de 4 minutos). Se simula a pasos
chicos y no de un salto a propósito: los trenes tienen que PASAR por sus
paradas para que se sorteen, y un salto de un minuto se las saltearía todas.

### Las probabilidades, y una llave que queda puesta

Tipo de tren **50% estándar · 30% veloz · 20% carga**. Escolta **65% fácil ·
35% media**. Medido sobre 20.000 tiradas: 50,2 / 29,5 / 20,3 y 64,7 / 35,3.

**Alta vigilancia queda con `peso: 0`, o sea construida y apagada.** Todo el
sistema de perfil de IA por guardia existe justamente para ella y sigue
funcionando; lo único que hace el peso en cero es sacarla de la bolsa. Es la
misma decisión que ya se había tomado con `SORTEAR_DIFICULTAD`: **una llave, no
una amputación.** Subirle el peso la devuelve sin tocar código.

### Y el mapa hubo que rehacerlo mirándolo, no calculándolo

Cuatro circuitos, dos líneas de afuera y el ramal muerto son **siete líneas
sobre un papel de 372x204**, y ahí los choques no aparecen en ninguna medición.
Tres vueltas de `foto.ps1` encontraron cosas que no se veían en los números:

1. **"PIEDRA ROJA" se salía del papel.** El nombre mide 54px y el pueblo estaba
   a 52px del borde. Pero no alcanzaba con correr la etiqueta de lado: **el
   oeste era el único lado del pueblo sin una vía encima** (le entran cuatro
   ramales), así que hubo que mover el pueblo entero a x=76.
2. **Dos circuitos llegaban a Piedra Roja casi paralelos**, los dos desde el
   este, y se leían como una sola vía gruesa. Se le cambió el ángulo de salida
   al Circuito de la Mina para que entre por el noreste.
3. **El nombre de Fuerte Bravo tenía su propia vía cruzada encima.** Se
   reordenó el Ramal del Río para que sus dos ramales salgan del pueblo hacia
   ARRIBA, dejando el sur despejado para el nombre.
4. **La última línea del cartucho se comía el marco.** Cinco renglones no
   entraban en 50px de alto.

**Y el título se mudó adentro del cartucho.** Iba en una banda arriba al medio,
que es justo por donde entra la Línea del Territorio desde afuera: el título le
comía la vía, y correrlo a cualquier esquina le pisaba el nombre a otro pueblo.
Meterlo en el cartucho no fue sólo el arreglo más barato — **es dónde va el
título en un mapa de la época**, y libera la franja de arriba entera.

**La regla que salió de todo esto, y sirve para la próxima vez que se toque el
mapa:** *cruces sí, paralelas no.* Dos vías que se cruzan en ángulo se leen
como una red; dos que corren juntas 30px se leen como un error de imprenta.

### Y la nota de acá abajo, con su primera respuesta

El tren de carga es la primera vez que se ataca de verdad "el botín está
demasiado concentrado" (ver más abajo): en vez de una caja fuerte grande en un
vagón, varias bolsas chicas en varios. Falta medir con el banco de pruebas
—como se hizo con blindado+correo hace un tiempo— si de verdad aplanó la
distribución o si sigue habiendo un vagón que conviene más que los demás.

---

## EN PRUEBA · Fase 3 arranca — El campamento

*(idea y diseño de Santi, con el detalle de qué hay y qué se puede tocar.
Construido el terreno y la interactividad; el mapa de rutas es lo que sigue)*

**Lo que cambia de fondo:** hasta acá el juego era un asalto en círculo — la
pantalla de resultados te devolvía al mismo galope, y no había ningún afuera.
Ahora el ciclo es **campamento → galope → asalto → resultados → campamento**,
y ese "volver" es lo que hace que un asalto pueda tener consecuencias en el
siguiente. Es el primer paso de la fase 3 y la razón de que `bounty` y `money`
dejen de ser contadores sin destino.

**Por qué es un LUGAR y no un menú.** Podría ser una lista de botones
—comprar / dormir / elegir tren— y mecánicamente daría igual. Pero un menú no
se habita: no tiene un caballo atado del que te acordás ni una fogata a la que
volvés. Que haya que **caminar hasta el cartel** para salir a robar hace que
salir a robar sea una decisión que tomás, no una opción que elegís de una
lista.

**Los cinco objetos, y por qué son estos.** Cada uno es el perchero de un
sistema que todavía no existe. Ninguno es decorado:

| Objeto | Hoy contesta | Va a ser |
|---|---|---|
| **Fogata** | Te sentás y te levantás | Descansar, pasar el tiempo, los compañeros |
| **Poste** | Qué caballo tenés | Elegir caballo (ya es un catálogo, `data/horse.js`) |
| **Carpa** | Un aviso de que todavía no hay noche | Dormir y **guardar la partida** |
| **Cajón** | Con qué arma y cuánta dinamita salís | El inventario y la munición |
| **Cartel** | Te manda al galope | **El mapa de rutas de la Región Desierto** |

**La regla que se siguió para los que todavía no tienen sistema detrás:**
contestan con lo que hoy SÍ se puede saber (qué caballo, qué arma) en vez de
quedarse mudos. Un objeto que no responde le enseña al jugador a ignorarlo, y
después cuesta el doble lograr que lo vuelva a mirar.

**El límite de hasta dónde caminar es la luz, no una pared.** Te podés alejar
hasta `CAMPAMENTO.radio` (92 px) y ahí te frena, pero **el suelo se va
apagando antes de que llegues al borde**: cuando te frena, ya sabías por qué.
Es la misma regla que sostiene el resto del juego —que la geometría explique
sola— y por eso el cartel de texto es un recordatorio y no la explicación.
Además el empuje es hacia el borde del círculo y no un frenazo contra un
plano, así que se puede seguir caminando en paralelo al borde.

**Dos decisiones técnicas que valen la pena anotar:**

- **No hay cámara.** El campamento entra entero en la vista (384x216), así que
  las coordenadas del mundo son las de la pantalla. No es sólo comodidad: un
  lugar que se ve entero de un vistazo se lee como un refugio, y uno que hay
  que recorrer se lee como un nivel.
- **`[E]` acá es una pulsación, no un mantenido** como en el asalto. En el
  asalto se mantiene porque robar lleva tiempo y ese tiempo ES el riesgo; en
  el campamento no hay ninguna presión, y hacer esperar a alguien sin motivo
  es peor que ser inconsistente.

**Verificado, por consola** (caminando de verdad con las teclas, no
teletransportando al jugador): los cinco objetos se detectan al acercarse y
los cinco responden — la fogata alterna sentado/parado, la carpa, el cajón
(`Revólver Colt · 2 cartuchos`) y el poste (`Mostrenco`) contestan su
mensaje, y el cartel cambia de escena. El límite frena exactamente a 92 px del
centro después de 6 s empujando hacia afuera. El **ciclo completo** corre sin
errores (`camp → ride → raid → results → camp`) y la recompensa ganada en el
asalto (300 por una captura) vuelve con vos y se ve en el campamento. 3
segundos dibujando cada cuadro, más el estado sentado, sin un solo error.

### El caballo del campamento tiene DOS verbos

*(pedido de Santi al agregar el pueblo)*

`E` lo alimenta, `F` lo monta y te lleva al pueblo. Es el único objeto del
campamento con dos acciones, y por un motivo que se sostiene solo: es el único
que además de ser una cosa es un **vehículo**. Meter las dos en un botón
obligaría a un submenú, que es exactamente lo que este juego no hace en ningún
lado. Por eso su cartel lleva dos renglones, y el de salir va en otro color:
no es una acción más de las de acá, es la que te lleva a otro lado.

Y el mismo `F` es el que te trae de vuelta desde el pueblo. **Montar es el
verbo de viajar, en las dos direcciones** — así no hay que explicar cómo se
vuelve. Volvés además parado junto al caballo, que es de donde saliste:
reaparecer en otro punto del campamento se siente a teletransporte aunque
nadie sepa explicar por qué.

---

## EN PRUEBA · Fase 3 — El día y la noche, y los interiores del pueblo

*(idea y diseño de Santi, con el detalle de qué abre y qué no. Construido;
falta jugarlo)*

### Dormir da vuelta la hora, y eso decide qué podés hacer

La carpa era el único objeto del campamento que no hacía nada real. Ahora
**dormir cambia de día a noche y viceversa**, y la hora decide qué está
abierto en el pueblo:

| | |
|---|---|
| **Establo y armería** | Sólo de día. Son negocios; cierran. |
| **Cantina y oficina del sheriff** | Siempre. Una porque de noche es cuando se llena, la otra porque la ley no duerme. |

Eso convierte a dormir en una decisión chiquita pero real: no es "pasar el
tiempo", es **abrir la mitad del pueblo y cerrar la otra**. Y le da al
campamento una razón de existir además de ser el punto de partida.

**Arranca de noche.** Además de que el campamento ya se veía bien así, hace
que lo primero que quieras hacer sea dormir — y ahí aprendés el sistema solo,
sin que nadie te lo explique.

### La hora no se dice: se ve

**No hay reloj ni etiqueta en pantalla en ningún lado.** Lo dicen la luz y la
fogata. Es la misma regla que ya sostiene el aro del ruido de las pisadas, la
marca verde del salto y el travesaño de las vías del mapa: *lo que se puede
mostrar no se escribe.*

**Un cambio sobre lo que Santi había pedido, y lo discutimos antes:** la idea
original era *"si la fogata está encendida es de día"*. Se dio vuelta a
**encendida = de noche**, que es lo intuitivo. El motivo: la fogata es
justamente la señal que informa la hora, y si dijera lo contrario que la
iluminación, las dos señales se pelearían y el jugador dudaría de las dos.

**El campamento es el único lugar con dos paletas propias** en vez de
resolverse con el velo de la noche, y hay una razón: de noche el suelo no es
un suelo, es **un charco de luz de la fogata** que se apaga hacia afuera —y
eso hace de límite sin dibujar ninguna línea. De día esa luz no existe, así
que el límite necesita otra explicación visual: un claro de tierra pisada con
su borde, y desierto alrededor. **Son dos dibujos distintos, no el mismo más
oscuro.**

**El resto se resuelve con un velo** (`r.tinte`, nuevo en el renderer): se
dibuja la escena con sus colores y encima va una capa azulada. La alternativa
—dos paletas completas de todo— obligaría a mantener dos juegos de colores
para siempre y cualquier objeto nuevo nacería a medias.

**El orden del velo en el pueblo importa y es el truco de toda la escena:** va
sobre el pueblo dibujado pero **debajo de las luces**. Si fuera lo último
apagaría las ventanas encendidas y quedaría un pueblo oscuro y muerto en vez
de un pueblo de noche. Primero se apaga todo, después se prenden las luces.

**Y las ventanas encendidas hacen un trabajo de diseño, no de adorno:** de un
vistazo, desde la otra punta de la calle, ves **cuáles están abiertos**. El
establo y la armería quedan a oscuras; la cantina y el sheriff, prendidos. No
hace falta caminar hasta la puerta para que te digan que no.

### Las cuatro puertas ahora son lugares

Antes entrar a la armería era un cartel de texto. Ahora es un cuarto con
mostrador, rifles colgados y un tipo detrás. **Un lugar se recuerda; un cartel
se lee una vez.** Es la misma apuesta del campamento y del pueblo.

**Una sola escena para los cuatro** (`scenes/interiorScene.js`): lo que cambia
entre uno y otro es contenido (`data/interiors.js`), no código — la misma
regla por la que agregar un vagón al tren es escribir una plantilla.

**Los muebles frenan.** No se camina a través de la barra ni del escritorio.
Sin eso el cuarto sería un fondo dibujado; con eso es un lugar, porque hay que
rodear las cosas.

**La cantina es la más compleja, con tres zonas separadas a propósito**: la
barra contra el fondo, las mesas de comer en el medio y la mesa de póker —la
única redonda y la única con paño verde, para que se reconozca desde la
puerta— a la derecha. Si estuviera todo junto sería un salón con muebles; así
se camina de una cosa a la otra.

**Y el cartel de "se busca" se mudó adentro de la oficina del sheriff.** Que
haya que ENTRAR a la oficina de la ley para mirar cuánto pagan por vos es
mucho mejor que leerlo desde la vereda. Ahí sigue viviendo la cuenta regresiva
de la horca.

### Tres bugs reales que aparecieron probando

Los tres eran de colocación, y ninguno se habría visto sin caminar los cuartos:

1. **En la cantina el jugador aparecía adentro de una mesa.** Había una mesa
   justo delante de la puerta y, como los muebles frenan, al entrar no te
   podías mover para ningún lado. **El punto por donde se entra tiene que
   quedar despejado siempre.**
2. **Al armero y al barman no se les llegaba.** Están detrás de un mostrador
   sólido, y con un alcance corto había que rodearlo para hablarles — nadie
   salta detrás del mostrador de una armería para preguntar un precio. Se les
   subió el alcance para que se les hable POR ENCIMA del mostrador.
3. **La cartelera estaba tapada por el escritorio del sheriff**, así que había
   que rodearlo para leer tu propio cartel. Y ese cartel es la información más
   importante del pueblo: **lo que más importa mirar tiene que ser lo más
   fácil de alcanzar.** El escritorio se corrió al centro.

También quedó despejado el pasillo de abajo de la cantina, que las mesas
partían en dos.

**Verificado, por consola, caminando de verdad:** dormir da vuelta la hora en
los dos sentidos; las cuatro puertas se comportan como corresponde a cada hora
(el establo y la armería entran de día y avisan "cerrado hasta que amanezca"
de noche; la cantina y el sheriff entran siempre); los **once puntos** de los
cuatro locales se detectan y contestan, y de todos se sale por la puerta
volviendo a la posición correcta del pueblo; el salón de la cantina se cruza
de punta a punta. Y las diez escenas dibujan sin un error **a las dos horas**.

**Lo que falta:** verlo. En particular si el pueblo de noche se lee bien y si
el campamento de día no se siente vacío sin el fuego.

### SEGUNDA VUELTA · Lo que Santi encontró jugando

*("se siente espectacular. Pero hay algunas colisiones que no son del todo
correctas o hay algunas cosas que se ven feas al entrar a los lugares")*

Cuatro problemas reales, los cuatro reproducidos y arreglados:

**1. Un mueble entero de tipos no chocaba con nada.** `chocaMueble` sólo sabía
resolver el rectángulo clásico (esquina + ancho/alto). Sillas, barriles,
fardos y cajones se describen sólo con `x, y` —son puntuales, no tienen
esquina— así que aunque llevaran `solido: true` **nunca frenaban a nadie**: se
caminaba a través de todos. Faltaba un tercer caso en la colisión (rectángulo
centrado, con `hw`/`hh`), que ahora existe. Verificado en los tres tipos con
un jugador caminando de verdad: se frena 10 a 14 px antes del centro de cada
uno, nunca lo atraviesa.

**2. Los que estaban sentados en la cantina eran mudos.** `def.sentados` era
un dibujo aparte, sin ningún punto que los detectara — parecían gente y no
respondían a nada, que es la trampa exacta que este proyecto evita en todos
lados ("un objeto mudo enseña a ignorarlo"). Se convirtieron en cuatro puntos
de verdad (`comensal1`, `comensal2`, `jugador1`, `jugador2`), cada uno con su
frase. `sentado: true` sólo cambia CÓMO se dibujan (una postura, no de pie);
se detectan con el mismo `puntoCerca` que cualquier otra persona.

**3. Los cuartos se sentían vacíos.** Se agregaron cinco tipos de mueble
puramente decorativos: **alfombra** (marca una zona del piso sin chocar, va
siempre primera en el array para quedar debajo de todo), **trofeo** (una
cabeza de venado en la pared), **herramientas** (colgadas en el establo),
**abrevadero** (solo, en el establo) y **estufa** (en la oficina). Los cuatro
cuartos terminaron con algo más que sus muebles funcionales.

**4. "Las armas deberían ser más diferentes."** El estante de la armería
dibujaba el mismo caño repetido — un patrón, no un estante. Ahora alternan
tres siluetas (rifle largo y fino, doble caño con dos caños juntos, revólver
corto con la culata curva), y se turnan por posición.

**Y de yapa, algo que Santi no pidió pero que también se veía mal: la
celda.** La primera versión cubría el rectángulo entero con rayitas de arriba
a abajo — un bloque rayado sin pared, sin piso, sin puerta, sólo una textura.
Ahora tiene tres paredes ciegas de chapa, una reja SÓLO en el frente (con su
hueco de puerta y el marco) y un camastro contra el fondo: se lee como una
celda vista desde arriba, no como un patrón.

**Verificado, por consola, caminando de verdad:** los cuatro tipos de objeto
puntual frenan (barril, cajón, fardo, silla — probado en armería, cantina y
establo); los cuatro sentados de la cantina se detectan y contestan (el
primer intento a `jugador2` falló por el círculo sólido de la mesa de póker
tapando el camino recto — rodeándolo por el otro lado, responde bien: no era
un bug del juego, era mi ruta de prueba); las diez escenas dibujan sin errores
a las dos horas, con todo el contenido nuevo adentro.

### TERCERA VUELTA · Faltaba la pared, y ese era el error de fondo

*(Santi, y con razón: "las escenas dentro de los lugares están mal hechas.
Todavía atravieso las carteleras. Hay lámparas de techo mal ubicadas, están
como puestas en el piso. La celda sigue igual")*

**El error no eran los tres síntomas: era que los cuartos no tenían pared.**
Todo se dibujaba sobre el mismo plano del piso, así que el estante de armas,
la cartelera de "se busca" y las lámparas estaban literalmente tiradas en el
suelo entre los muebles. De ahí salían dos quejas que parecían distintas y
eran la misma:

- *"todavía atravieso las carteleras"* → estaban en zona caminable
- *"las lámparas parecen puestas en el piso"* → lo estaban

**Marcarlas sólidas habría sido el tercer parche seguido, y por eso no se
hizo.** Lo que faltaba era estructura: ahora el cuarto tiene una **franja de
pared** (`PARED_ALTO`, 38 px) arriba del piso caminable, y lo que va colgado
se dibuja ahí. **No hace falta ninguna colisión para algo a lo que no se
puede llegar** — la misma lógica por la que el vacío afuera del tren no
necesita una pared. `sala` pasó a ser sólo el piso.

Las lámparas se volvieron **faroles de pared**: soporte saliendo del muro,
caja de metal, y la luz derramándose hacia abajo sobre el piso. Y se dibujan
ÚLTIMAS, para que la luz caiga sobre los muebles en vez de quedar tapada por
ellos.

**La celda, tercera versión.** Las dos anteriores fallaban por lo mismo: eran
una TEXTURA, no un lugar. La primera era un rectángulo rayado de punta a
punta; la segunda le agregó paredes pero dejó el interior tapado de negro, o
sea que seguía leyéndose como un agujero. Santi fue exacto en qué faltaba:
*"que no sea negra, que pueda verse el piso a través de los barrotes, que por
cierto tendrían que estar mejor hechos"*. Las tres cosas que la arreglan:

1. **El interior es el mismo piso de madera del cuarto**, apenas ensombrecido,
   con paja tirada y un camastro. Adentro de una celda hay piso, no vacío.
2. **Los barrotes tienen aire entre medio** (2 px de hierro cada 9), así que
   entre uno y otro se ve el piso de adentro. Eso es lo que los hace leer como
   barrotes y no como un rayado.
3. **Cada barrote tiene brillo y sombra**, una columna clara y una oscura, y
   deja de ser una línea plana para verse redondo, de hierro.

Más la puerta de la reja, abierta hacia adentro, con su marco.

### Y se cambió el método de verificación, que era la causa de fondo

Hasta acá probaba caminando a los puntos uno por uno — y eso **encuentra lo
que ya sospechás y nada más**. Ahora se hace una **inundación** (flood fill)
desde la puerta, usando la MISMA función de colisión del juego (expuesta como
`FORAJIDO.services.interior.libre`), que recorre todas las celdas alcanzables
del cuarto y después pregunta dos cosas de una:

- ¿Cada punto de interacción tiene alguna celda alcanzable dentro de su
  alcance? (si no, es inalcanzable y no hay que descubrirlo jugando)
- ¿Alguna celda alcanzable se metió en la franja de pared? (si sí, se
  atraviesa algo colgado)

**Resultado: 4.098 a 5.317 celdas alcanzables por cuarto, los once puntos
alcanzables en los cuatro, y CERO celdas alcanzables en la pared.** Además se
verificó que los 26 muebles sólidos frenan de verdad (el centro de cada uno
está bloqueado) y que las alfombras siguen siendo pisables.

Esa prueba es la que hay que correr cada vez que se toque un cuarto: encuentra
los problemas de colocación sin tener que sospecharlos primero.

---

## EN PRUEBA · Fase 3 — La tienda: el vendedor pregunta, y comprar es un LUGAR

*(diseño de Santi, después de descartar la propuesta anterior. Construidas las
dos escenas; **la transacción todavía NO se hace**, a pedido: "solo armá las
escenas y lo veo")*

**Lo que yo había propuesto y por qué estaba mal.** Mi versión era `[E]` sobre
el vendedor → un cartel con el precio → `[E]` otra vez y comprado. O sea: un
cartel de texto con una confirmación. Exactamente lo que este proyecto viene
evitando desde el campamento — *un lugar se recuerda, un cartel se lee una vez*
— y encima justo en el sistema que le tiene que dar sentido a toda la plata
robada.

**Lo que pidió Santi, que es mejor y por un motivo que se sostiene solo:**

> *"al hablar con el caballerizo, este te pregunta: ¿Qué desea?. El jugador
> tendrá para elegir distintas opciones... y allí pasará a una escena
> distinta, donde desde más cerca se visualizan los caballos disponibles en su
> corral. Y se mostrarán sus stats."*

Comprar deja de ser una operación y pasa a ser **ir a ver la mercadería**. La
diferencia no es de presentación: **un caballo que ves de cerca se elige, uno
que leés en una lista se calcula.**

### Las dos piezas que se construyeron

**1. El diálogo del vendedor** (`scenes/interiorScene.js`). Hablarle a alguien
que vende abre una pregunta con opciones; hablarle a cualquier otro sigue
soltando un dicho. Esa es la única diferencia entre un vendedor y un vecino, y
alcanza: **es el único con el que la conversación puede terminar en algo.**

- Mientras hablás **no te podés mover**. No es una traba técnica, es que estás
  hablando con alguien.
- **"Nada, gracias" es una opción de verdad**, no un botón de cerrar, y el
  vendedor contesta ("Como guste. Ahí van a estar"). Salir es una respuesta.
- Las opciones viven en `data/interiors.js` (`dialogo: [...]`), así que sumar
  "comprar munición" o "reparar" es un renglón de datos.

**2. La tienda** (`scenes/shopScene.js`, contenido en `data/tienda.js`). Es
**la única escena del juego que se ve de cerca y de perfil**: todo el resto es
la vista de arriba de un tipo que camina. Ese cambio de cámara es el argumento
entero de que esto sea una escena.

- **Una sola escena para las dos tiendas**, y para las que vengan. Igual que
  hay una sola escena para los cuatro interiores y una plantilla por vagón.
- **El que ya tenés está en la lista**, marcado. La pregunta de una tienda no
  es "¿me sirve?", es **"¿es mejor que el que tengo?"**, y esa se contesta
  mirando las dos cosas juntas.
- **Cada barra lleva una rayita donde está el tuyo hoy.** Es la comparación
  entera, en un píxel, sin escribir un solo número.
- **Más lleno = mejor, siempre**, o las barras no se leen de un vistazo. Por
  eso la recarga no muestra los segundos que tarda (donde menos sería mejor)
  sino cuánto le sobra a un tope. La única excepción va en rojo: **el RUIDO de
  un arma no es una virtud**, es lo que despierta el tren a tus espaldas.
- Se maneja con el teclado. El mouse sigue siendo sólo del mapa, porque ahí sos
  un tipo mirando un papel y acá seguís siendo un tipo parado en un establo.

**Y se entra por dos puertas**: hablando con el vendedor, o caminando hasta la
mercadería (el mostrador, los pesebres) y apretando `[E]`. *Lo que más importa
mirar tiene que ser lo más fácil de alcanzar* — la misma regla que movió el
escritorio del sheriff.

**Volvés al local parado donde estabas**, no en la puerta. Reaparecer en otro
punto se siente a teletransporte, igual que pasaba volviendo del pueblo.

### Los dos artículos, con los números ya diseñados

| | Qué compra | Qué cuesta |
|---|---|---|
| **Smith & Wesson** ($250) | Dispara más rápido (0,28 contra 0,40) y **recarga en la mitad** (1,0 contra 2,0): se parte al medio y las escupe todas | **Una bala menos** (5) y **el doble de dispersión** (0,085 contra 0,035) |
| **Overo** ($400) | La zona limpia del salto pasa de **9 a 15**, y la tolerancia de 6 a 8 | La plata, y nada más |

**El Smith no cambia el ruido**, a propósito: sigue siendo un revólver. Lo que
vende la armería acá es velocidad de mano, no permiso para hacer escándalo —
ese va a ser el precio de la escopeta y del rifle.

**El Overo no anda más rápido**, y eso no es pereza: `sprintSpeed`,
`aguanteMax` y `aguanteGasto` son IDÉNTICOS. Si el caballo caro corriera más,
compraría el tercer enganche más barato y rompería la decisión que sostiene la
fase 2. **Lo que compra es perdón**, que es lo que un jinete torpe necesita y
lo que uno bueno casi no nota: el que ya aprendió a clavarla en el centro no
necesita comprar nada.

### Verificado (por consola, caminando de verdad)

- **El flujo entero, en los dos locales**: calle → `[E]` en la puerta →
  caminar hasta el vendedor → `[E]` abre "¿Qué desea?" → `W/S` mueve la
  selección → `[E]` entra a la tienda → `A/D` cambia de artículo → `[ESC]`
  vuelve **a los mismos pies** (184,168 y 192,142, exactos).
- **Hablando no se camina**: 30 cuadros con `A` apretada, el jugador no se
  movió un píxel.
- **"Nada, gracias" contesta** y cierra sin cambiar de escena.
- **Mirar no compra nada**: después del paseo completo, `weapon` sigue en
  colt, `horse` en null y `money` en 0.
- **El ciclo completo sigue entero con la tienda en el medio**: camp → pueblo
  → establo → tienda → establo → pueblo → camp → mapa → ride → raid.
- **Las once escenas dibujan sin un error a las dos horas** (22 corridas de 60
  cuadros cada una, cero errores de consola).

### La inundación, ahora con una pregunta más

La prueba de flood fill de los interiores tenía un agujero: contestaba *"¿este
punto está al alcance de alguna celda alcanzable?"*, y eso no es lo que
importa. Lo que importa es *"¿desde alguna celda este punto es **el más
cercano**?"*, porque el juego elige el más cercano y uno tapado por otro es
inalcanzable aunque esté a tiro.

Ahora la prueba cuenta, para cada punto, **desde cuántas celdas gana**.
Resultado: los 15 puntos de los cuatro locales ganan en algún lado (el más
apretado es `mostradorArmas`, con 186 celdas, y `pesebres`, con 216 — los dos
están medio tapados por su vendedor, que es justamente por qué ahora los dos
caminos llevan a la misma tienda). Y cero celdas alcanzables dentro de la
franja de pared, como debe ser.

**Es la versión que hay que correr de acá en adelante.**

### SEGUNDA VUELTA · Los caballos, con volumen y vivos

*(pedido de Santi: "sé que no podrías hacer algo 3D, pero podrías hacer que
los caballos luzcan mejor, que parezcan 3D y moviéndose y comiendo pasto")*

**No hace falta 3D. Hacen falta dos trucos viejos de pixel art**, y los dos
están construidos:

**1. Volumen: la silueta se redondea y el color se escalona.** Cada masa del
animal —el barril, el anca, el cuello, cada pata, la cara— se dibuja con la
misma función (`bloque`): una pila de rayas de 1 px que se angostan en las
puntas y que cambian de tono según la altura (brillo arriba, base al medio,
sombra abajo). Eso es un cilindro. **Un rectángulo de un color es una tabla;
el mismo rectángulo con cuatro tonos y las esquinas comidas es un animal.**

**2. Profundidad: las patas del lado de allá van apagadas y corridas 3 px.**
Es lo único que da profundidad de verdad — el ojo lee dos planos y completa
solo el cuerpo que hay en el medio. Sin eso son cuatro palos en fila.

**Y un solo color por caballo en los datos.** El brillo del lomo, la sombra
de la panza y el tono del lado de allá se calculan a partir del pelo
(`tono()` y `paleta()`). Agregar un caballo es elegir UN color, no doce, y
así ninguno nace desafinado.

**Que esté vivo no es que se mueva: es que haga algo.** Un caballo que
tiembla en el lugar se ve roto. Éste tiene un ciclo de 9,2 segundos —**baja
la cabeza al pasto, mastica, la vuelve a subir**— y encima respira (el
cuerpo, no las patas: los cascos están apoyados), sacude la cola, mueve una
oreja, parpadea y cada tanto afloja una pata. Por eso hay un **montón de
pasto** dibujado en el corral: un movimiento necesita tener a qué ir, y una
cabeza que baja contra el piso pelado no se entiende.

**Tres cosas que hubo que rehacer mirándolas**, y ninguna se habría notado
midiendo:

1. **La cabeza era un muñón.** Tenía la cara y nada más. Una cabeza de
   caballo de perfil es **corta y honda**, y necesita cuatro piezas: el
   carrillo (la masa redonda de atrás, donde va el ojo), la cara en cuña, el
   hocico —apenas más oscuro, porque muy oscuro se lee como un pegote— y las
   orejas. Sin carrillo la cabeza no se apoya en nada; sin hocico no termina.
2. **Las orejas parecían astas.** Nueve píxeles de alto, finas y separadas.
   Ahora son de seis, anchas en la base, juntas, y **plantadas 2 px dentro
   del cráneo**: apoyadas justo en el filo se ven pegadas encima.
3. **La crin se comía el cuello.** Iba 5 px para adentro, y en un caballo
   claro el cuello parecía la mitad de ancho. Ahora va SOBRE el filo.

**Y el overo era dos animales pegados**: manchado del cuerpo y blanco del
cuello para arriba. La mancha del cuello se pinta **por columna**, con la
misma cuenta que dibuja el cuello, así que sigue su forma exacta aunque el
bicho esté bajando la cabeza.

**Verificado:** 40 segundos del ciclo completo, con los dos caballos, sin un
error; nada se sale del cuadro ni se mete en la ficha del precio en ningún
momento de la animación; **1,65 ms por cuadro** sobre un presupuesto de 16,7.

### Y POR FIN SE PUEDE VER LA PANTALLA (`foto.ps1`)

Estas notas vienen diciendo hace varias vueltas *"lo que NO se pudo
verificar: cómo se ve"*, porque la ventana del navegador no compone cuadros
cuando el juego se maneja desde una consola remota. **El canvas se dibuja
igual**: lo que faltaba era traer esa imagen al disco.

`foto.ps1` es eso: un receptor mínimo en el puerto 8099. El juego le manda el
canvas (`toDataURL`) y él lo guarda como PNG. Y para juzgar un detalle chico
se recorta y se agranda con un canvas aparte antes de mandarlo — así se
miraron las cabezas a 4x, que es como se encontraron los tres errores de
arriba.

**Es la herramienta que faltaba**, y no es opcional para nada que sea
dibujo: los errores de proporción no aparecen en ninguna medición. Se puede
borrar sin que se rompa nada del juego.

### 🐛 BUG ENCONTRADO Y ARREGLADO · El arma comprada no se equipaba en el asalto

*(Santi, pidiendo comprobar estadísticamente que el Smith dispersa más pero
tira y recarga más rápido que el Colt: para eso hizo falta primero armar el
banco de pruebas, y ahí apareció esto)*

**`buildTrain` armaba al jugador sin pasarle nunca qué arma tenía.**
`world/train.js` llamaba `createPlayer(entradaX, entrada.y)` — sin tercer
argumento — así que el jugador SIEMPRE salía con el Colt (el
`DEFAULT_WEAPON`), sin importar qué hubieras comprado ni qué dijera
`gameState.weapon`. La tienda cobraba y guardaba `smith` correctamente; el
asalto simplemente nunca lo leía.

**El arreglo respeta la separación que ya tenía el archivo**: `world/train.js`
no importa `gameState` (es un armador de mundos puro, recibe valores, no
sabe de la partida). Se agregó `weaponId` como quinto parámetro de
`buildTrain`, y quien SÍ tiene `gameState` importado —`raidScene.js`— se lo
pasa: `buildTrain(rng, caballoEn, composicion, dificultad, gameState.weapon)`.

**Verificado:** comprar el Smith y entrar a un asalto ahora da
`player.weapon.id === 'smith'`. Sin comprar nada, sigue saliendo con el Colt.

**Y con el arma ya bien equipada, se pudo comprobar lo que Santi pidió:
disparar de verdad, muchas veces, con cada arma, y medir.** 40 segundos de
fuego sostenido por arma, sin guardias en el medio (para medir el ARMA, no
un tiroteo):

| | Colt | Smith & Wesson | Configurado |
|---|---|---|---|
| Cadencia (s entre tiros) | 0,417 | **0,283** | 0,40 / 0,28 |
| Recarga (s) | 2,017 | **1,000** | 2,0 / 1,0 |
| Dispersión (desvío máximo) | 0,034 | **0,085** | 0,035 / 0,085 |

Los tres números confirman el diseño: el Smith tira y recarga más rápido, y
dispersa más — exactamente lo que dicen los comentarios de `weapons.js`.

### La recarga del Colt subió de 2,0 a 3,0, y después a 3,5

*(Santi, jugando: "más realista y más brecha entre el Colt y Smith, porque
en la práctica no se siente que haya valido cada centavo")*

Con 2,0 contra 1,0, la diferencia era de un segundo — medible, pero no de
las que se sienten agachado detrás de un asiento. Con 3,0 contra 1,0, el
Colt tarda EL TRIPLE, y esos dos segundos de más son justo el tipo de cosa
que un guardia con `fireCooldown: 0.75` puede aprovechar. Remedido: recarga
real, 3,017s (7 de 7 recargas), contra el 1,000s del Smith de siempre.

**Y después, jugado y subido otra vez a 3,5** (Santi: *"se siente muy bien,
pero aún así me gustaría que lleves la recarga a 3,5"*). Son dos segundos y
medio de diferencia contra el Smith, tres veces y media su recarga. Medido:
3,517s exactos. La barra de la tienda sigue leyéndose — 1 casillero de 10
contra 8 del Smith — así que no hizo falta volver a tocar el tope.

**Un efecto de segundo orden que hubo que corregir en la tienda.** La barra
de RECARGA se calculaba como `3 - reloadTime` sobre un tope de 3: con
`reloadTime = 3`, el Colt daba **exactamente cero** — una barra
completamente vacía, que se lee como una barra rota, no como "es lento". El
tope subió a 4 (`4 - reloadTime` sobre 4): ahora el Colt muestra un poco
(1/4) y el Smith bastante más (3/4), la diferencia real y visible en vez de
un hueco sospechoso.

### La caja fuerte pasó de 4 a 6,5 segundos

*(pedido de Santi: "que se tarde más tiempo en abrir las cajas fuertes")*

Es el número que decide si la caja fuerte es **una apuesta o un trámite**.
Con 4 segundos se abría casi de paso; con 6,5 hay que decidir quedarse
quieto, de espaldas, en un vagón donde el ruido de la anterior ya sonó. Y el
blindado tiene DOS: trece segundos parado en el peor lugar del tren, de un
asalto de 145.

No cambia cuánto dan (eso vive en `data/wagons.js`): sube lo que **cuestan**.
Es la misma idea que sostiene el galope entero — lo caro no es el botín, es
el tiempo que te comés yendo a buscarlo. Medido: 6,52s reales.

---

## ✅ HECHA · La dinamita retumba, y el tren se despierta EN ROJO

*(pedido de Santi, jugando: "al explotar la puerta del vagón blindado con la
dinamita, los guardias de este vagón ya deberían estar en color rojo, y si no
mataste a los del vagón de atrás, que estos vengan justamente por detrás tuyo
con el color rojo. Porque la dinamita es literal una explosión, eso debería
retumbar en casi todo el tren")*

**El problema, y era real:** volar la puerta del blindado era el acto más
ruidoso del juego y el tren se enteraba MENOS que con un tiro de Colt. La
explosión emitía un `noise` con radio en píxeles (900), que sólo reparte
`alertTo` — sospecha, amarillo — y nunca llamaba a `spreadAlarm`, porque ese
camino exige `wagons && alarm.active`. Se podía reventar una puerta de chapa
y, si nadie te había visto todavía, la alarma seguía apagada.

### La regla nueva: una explosión no reparte sospecha, reparte combate

Todo el resto del juego reparte sospecha: un tiro, un grito o una caja fuerte
dejan a los que oyeron en **amarillo**, yendo a mirar. **La dinamita los deja
en rojo.** No se preguntan si pasó algo — voló una puerta, ya saben que pasó.

`retumbaElTren(x, y, wagons)` (en `scenes/raidScene.js`) hace tres cosas de
una, y las tres son el precio de haber gastado el cartucho:

1. **Enciende la alarma sí o sí.** No hay forma de volar una puerta y seguir
   haciendo un trabajo limpio.
2. **Delata dónde estás** (`marcarPosicion`): es la explosión más ruidosa del
   tren y salió de tus manos.
3. **Deja a todos en combate hasta 3 vagones para cada lado**, con la regla
   de movimiento de siempre intacta: los de ATRÁS vienen a buscarte (son los
   que te cortan el camino al caballo), los de ADELANTE entran en combate
   igual **pero apuntando a su propio puesto** — rojos, esperándote, sin
   abandonar su vagón.

**Ese último matiz es el que evita romper una regla vieja y cara.** La fase 2
dejó establecido que los de adelante se despiertan pero no se movilizan,
*para que avanzar siga teniendo sorpresa*. Si la explosión los hiciera venir,
los vagones de adelante quedarían vacíos cuando llegaras. Entrando en combate
sin moverse se consigue lo que pedía Santi (rojo) sin fingir que del otro
lado de la pared no oyeron nada.

**Y los del blindado no necesitaron ninguna excepción**: están confinados a
su vagón por `confinar()` (systems/ai.js), que se aplica siempre al final
pase lo que pase con la IA. Ponerlos en rojo no los saca de ahí — quedan
rojos del otro lado del boquete, que es exactamente lo pedido.

`noiseWagons: 3` vive en `data/explosives.js`, al lado del `noiseWagons` de
las armas (el Colt es 1). Es UN número para ajustar cuánto retumba.

**Sólo cuenta si la tiraste vos** (`porJugador` viaja en el evento): la
dinamita de un guardia del blindado ya pasa en pleno tiroteo, y usarla para
delatar tu posición sería regalarles información que no tienen.

### Medido — el caso exacto que lo motivó

Tren fijo `pasajeros/comedor/blindado/correo/ganado/pasajeros`, jugador
parado en el enganche detrás del blindado, dinamita tirada con las teclas
reales (`Q` y clic):

| Vagón | Antes | Después | Se movió (8s) |
|---|---|---|---|
| 1 (atrás) | gris | **rojo** | +81 px hacia vos |
| 2 (atrás, donde estás) | gris | **rojo** | +81 px hacia vos |
| **3 — el blindado** | gris | **rojo** ×4 | ±45 px, **sigue en su vagón** |
| 4 (adelante) | gris | **rojo** ×3 | −8 px, sigue en su vagón |
| 5 (adelante) | gris | **rojo** | +35 px, sigue en su vagón |
| 6 (fuera de alcance) | gris | gris | 0 |

Y la puerta blindada, rota. Verificado además que **la dinamita de un
guardia no pone nada en rojo** (los 12 guardias en patrulla siguieron en
patrulla; sólo murieron los 2 del radio).

---

**Y dos trampas de medición nuevas, ambas en el script, no en el juego**
(se suman a la lista de "trampas conocidas" de este archivo):
1. Contar TODAS las balas (`spawnBullet`) en vez de filtrar `owner ===
   'player'` mete las balas de los guardias que te contestan en la
   estadística y arruina la dispersión medida.
2. Separar "tiro normal" de "tiro después de recargar" con un número de
   segundos fijo (1,5s) funciona para el Colt pero no para el Smith, que
   recarga tan rápido que su hueco de recarga (recarga + la espera de
   `fireTimer` antes de que el juego note que no queda munición) mide menos
   que ese corte. Se arregla comparando la munición entre un disparo y el
   siguiente, no el tiempo.

### ✅ CERRADA · La transacción

*(Santi, jugando: "aún teniendo el dinero para comprar el Mustang, no me deja
comprarlo". No era un bug — era la pieza que faltaba de siempre)*

**El gesto es uno solo: parado frente al que querés, apretás `E`.** Sin
pantalla de confirmación aparte, y a propósito: para cuando llegás a apretar
`E` acá ya elegiste hablar con el vendedor, ya elegiste "comprar" en su
pregunta, y ya elegiste ESTE artículo con `A`/`D` — pedir una cuarta
confirmación sería desconfiar del jugador después de que ya decidió tres
veces.

**Comprar y equipar son el mismo paso.** Hoy no hay inventario de "tengo dos
y uso uno" — `gameState.weapon` y `gameState.horse` guardan un solo valor
cada uno, así que comprar directamente lo pone puesto. El día que haga falta
separar las dos cosas, la costura ya está: cada entrada de `data/tienda.js`
trae su propio `equipar(gameState, id)`, y la escena nunca sabe si está
equipando un arma o un caballo.

**Los tres casos, verificados por consola:**
- **Sin plata:** no cobra nada, dice cuánto falta (`"Te faltan $220."`).
- **Con plata:** cobra, equipa, confirma (`"Ahora el Mustang es tuyo."`).
- **Ya comprado:** apretar `E` de nuevo no vuelve a cobrar — dice `"Ya es el
  tuyo."` y listo.

Y el flujo completo, de punta a punta: pueblo → hablarle al armero →
"comprar un arma" → la tienda → `A`/`D` al Smith → `E` compra → `Esc` →
volvés al mismo punto de la armería con el arma ya puesta. Once escenas
dibujando sin error, a las dos horas, después del cambio.

---

### Lo que falta

1. **Que el caballo comprado se sienta.** `saltoPreciso` ya lo lee el galope,
   pero **la barra del salto al techo NO depende del caballo**: sale de
   `APROXIMACION.barraVerde`, que es una constante. Si un caballo tiene que
   perdonar "tanto al enganche como al techo", ahí falta una costura.
3. La cantina (compañeros) y los mini jefes, que son sistemas mucho más caros
   y no dependen de esto.

---

## EN PRUEBA · Fase 3 — Las tres stats del caballo, con nombres y números

*(diseño de Santi sobre lo que dejaron anotado las vueltas anteriores: la
persecución larga y el catálogo de la tienda. Se cerraron las tres stats
—Velocidad, Equilibrio, Resistencia—, se recalibraron los dos caballos que
existen y se les cambió el nombre. **Construido; falta jugarlo.**)*

### Los nombres cambiaron: Mostrenco → Criollo, Overo → Mustang

No es sólo estética. El segundo cambio de nombre vino con un cambio de
identidad: **Overo ya no existe como concepto** ("el Criollo pero mejor
saltando"). El Mustang es otro animal — rápido y salvaje, no manso — y el
hint viejo ("Manso para saltar") se reemplazó por uno que dice lo contrario:
*"Volador, pero no tiene fondo. No es de aterrizar fino."*

### Las tres stats, y qué número de siempre representa cada una

Ninguna es un sistema nuevo — las tres reusan algo que ya existía, porque un
caballo se compra en fase 3 y no había presupuesto para inventar mecánica
nueva por cada una:

| Stat | Qué número mueve | Qué paga |
|---|---|---|
| **Velocidad** | `sprintSpeed` | Cuánto tarda en alcanzar la cola. Ver "La persecución larga", más abajo — sin eso, esta stat no tenía dónde pesar. |
| **Equilibrio** | `saltoPreciso` / `saltoTolerancia` | Cuánto perdona el salto al enganche (y la barra del techo, que escala con lo mismo). |
| **Resistencia** | `aguanteMax` | Cuántos vagones te podés adelantar antes de quedarte sin fuerzas. **No hizo falta ningún sistema nuevo**: el aguante YA ERA el límite real de cuánto te podés adelantar (`caballo.maxAdelanto` en config.js es sólo una red de seguridad, nunca estuvo activa) — sólo faltaba que cada caballo tuviera su propio número en vez de compartir uno global. |

### Por qué el número tenía que bajar, no subir — Velocidad

Hasta esta vuelta, un caballo "mejor" corría más rápido: subir el techo de
90 a 140. Santi lo frenó: *"quiero que entre el nivel 1 y el nivel 5 haya 5
segundos de diferencia, haciendo más lento el nivel [de abajo] en vez de más
rápidos los de arriba."* El motivo no lo dijo pero es el que ya sostiene
todo lo demás del proyecto: **90 ya estaba jugado y confirmado** (es el
número con el que se cerró la fase 2 entera). Subir el techo habría
reabierto un balance ya cerrado; bajar el piso no toca nada de eso — el
Mustang, que hereda el 90 sin cambios, sigue siendo exactamente el galope
que ya se jugó.

Con eso, **Criollo pasó a 52 px/s** (era 90). A esa velocidad, apretar `D`
casi no te adelanta más que soltar las riendas del todo (`alcanceSpeed=55`,
la velocidad a la que el caballo se acerca solo): es el caballo que no
tiene fuerzas ni apurándolo.

### Por qué el Criollo nunca te dejó afuera — Equilibrio

Santi, jugando: *"en todos los asaltos que he jugado NUNCA me quedé afuera
de uno por no calcularle bien. Si entre el Criollo y el Overo no habrá
diferencia en la práctica, ¿de qué serviría?"*

La causa estaba en la geometría, no en el número: en un enganche normal, la
ventana donde el salto CUENTA (ni "errado") es `24 + tolerancia` px de cada
lado, y el 24 es el ancho físico del enganche — **fijo, no depende de
ningún caballo**. Con la tolerancia vieja (6), esa ventana ya daba ±30px, y
un jugador que apunta más o menos bien casi nunca se sale de ahí con
NINGÚN caballo. "Errado" nunca fue lo que Overo mejoraba.

Lo que Overo mejoraba era la zona *limpia* de adentro (`saltoPreciso`, 9).
Y ahí estaba el problema: si la puntería habitual de Santi ya caía dentro
de esos 9px, tener 15 en vez de 9 no cambiaba nada que se viera — el techo
subió pero él nunca lo tocaba.

**Criollo bajó a `saltoPreciso: 4, saltoTolerancia: 4`** (eran 9/6). La zona
limpia pasa a ser el 14% de la ventana total: la mayoría de los saltos con
este caballo van a salir sucios (despiertan el vagón) salvo que se apunte
casi exacto. El Mustang se queda con el 15/8 de siempre — con esto, subir de
caballo sí se va a notar sin mirar ningún número.

### Resistencia: el mismo aguante de siempre, con un número por caballo

Acá NO hizo falta escribir código nuevo (más allá de separar el número por
caballo), pero sí hizo falta **entender bien qué hace el aguante**, porque
la primera lectura estaba mal. `aguanteGasto` se cobra por SEGUNDO
galopando, no por metro — así que un caballo más lento necesita más TIEMPO
para cubrir la misma distancia, y ese tiempo extra también sale del mismo
tanque. Bajarle la velocidad al Criollo, sin tocarle el aguante, hizo que
dejara de llegar a un enganche al que antes llegaba de sobra — una
consecuencia que nadie pidió y que sólo apareció midiendo.

**El pedido de Santi fue concreto: "el Criollo tiene que llegar al tercer
enganche y el Mustang al segundo."** Con eso como objetivo medible (no una
escala abstracta 1-5), se calibró cada caballo por separado:

- **Mustang: `aguanteMax: 60`** (ya estaba bien sin tocar nada). A sus 90
  px/s, el tanque le alcanza para pasar el 2º enganche con ~27s de sobra y
  se seca bastante antes del 3º.
- **Criollo: `aguanteMax: 160`** (subió de 100). Necesitó bastante más
  tanque que "el número de siempre" — no porque sea más resistente, sino
  porque a 52 px/s tarda el TRIPLE en cubrir la misma distancia que el
  Mustang, y eso se paga en aguante igual.

**Y un hallazgo que obligó a tocar un tercer número.** Con 160 de aguante,
el Criollo llegaba al 3er enganche, pero medido con el piloto que esquiva
piedras, el margen sobre el reloj de los 35s de la persecución era de
apenas 0,6 a 2,5 segundos — al borde de que una piedra mal esquivada lo
dejara afuera por mala suerte, no por mal jugado. Es exactamente lo que el
propio archivo ya advertía en otro lado ("el aguante tiene que ser un
presupuesto que administrás, no una lotería"), así que **`tiempoAproximacion`
subió de 35 a 40**. Es la segunda vez que sube por el mismo motivo exacto
que la primera (25→35): *un tope que hace imposible la opción más cara no
la encarece, la borra.* Y no le regala nada al Mustang — a él lo frena el
aguante, no el reloj, así que con 35 o con 40 llega exactamente igual.

### Medido — piloto que esquiva, 5 corridas por fila, sobre el mismo tren

| | Enganche 1 | Enganche 2 | Enganche 3 | Enganche 4 |
|---|---|---|---|---|
| **Criollo** (52 · 160/6 · 4/4) | 5/5, ~28s de sobra | 5/5, ~19s | **5/5, ~6s** | 0/5 |
| **Mustang** (90 · 60/6 · 8/5) | 5/5, ~33s | **5/5, ~27s** | 0/5 | — |

Exactamente el resultado pedido: el Criollo llega al 3º y no al 4º; el
Mustang llega al 2º y no al 3º.

### Lo que queda sin decidir (a propósito, no hay tercer caballo todavía)

Las tres escalas 1-5 quedaron con huecos (niveles 2-3-4 de Velocidad y
Equilibrio sin caballo que los use; niveles 1, 3, 4 y 5 de Resistencia
directamente sin definir). No se rellenaron a propósito: cada caballo que
existe hoy se calibró contra un resultado JUGABLE concreto ("llega hasta
acá"), no contra una escala pareja impuesta de antemano. Cuando aparezca un
tercer caballo, se lo va a calibrar de la misma forma — medido, no
interpolado.

### Sobre explicar el sistema en vez de sólo ajustarlo

Santi, al final de esta vuelta: *"no me gusta ese sistema que hay que es
por píxeles, con el enganche, etc. No lo entiendo muy bien."* La explicación
que funcionó fue el tanque de nafta: velocidad = metros por segundo,
resistencia = segundos de tanque, y el producto de los dos es cuánto
terreno cubrís antes de quedarte a pie — comparado contra la distancia fija
de cada enganche. Vale la pena repetir esa forma de explicarlo si el tema
vuelve a aparecer, en vez de hablar en píxeles.

---

## EN PRUEBA · Fase 3 — La persecución larga, para que la velocidad exista

*(idea de Santi: "sería bueno darles más protagonismo a los caballos. Por eso
pensé en la stat de Velocidad. Para aprovecharla, el jugador debería empezar
el asalto desde más atrás". **Construido; falta jugarlo.** La stat en sí queda
para después, a pedido)*

**El problema que resuelve, y es real:** `sprintSpeed` decidía dos cosas —qué
tan rápido te adelantás y qué tan rápido alcanzás el tren— pero la segunda no
valía nada, porque alcanzarlo eran 240 px, dos segundos y medio. Entre dos
caballos la diferencia era medio segundo. **La stat existía en la ficha y no
en las manos.**

Ahora son **620 px**: siete segundos galopando a fondo, once si no apretás
nada. Ahí sí hay dónde notar un animal más rápido.

### Tres cosas que hubo que resolver para que la persecución sea jugable

**1. Detrás de la cola no había NADA.** Literalmente: negro. Con dos segundos
daba igual; con siete serían siete segundos galopando contra un vacío, sin
saber ni si vas para el lado correcto. **Ahora está la vía**: balasto, dos
rieles continuos y las piedras volando. Te dice por dónde se fue el tren
mucho antes de que el tren se vea.

> **Las piedras son rayas, no piedras.** Un patrón regular a esta velocidad
> late para atrás (el efecto rueda de carreta): unos durmientes cada 30 px
> avanzando 18 px por cuadro se ven caminando al revés. Las rayas de
> velocidad no tienen ese problema —cada una lleva su carril y su velocidad,
> así que el ojo no se engancha con ninguna— y encima es lo que de verdad se
> ve desde un caballo al galope: borrón. Los dos rieles sí van continuos, y
> son la única cosa quieta de la pantalla: por eso se leen como una
> dirección.

**2. La cámara mira para adelante mientras perseguís.** Centrada, estarías
galopando seis segundos hacia un borde vacío. Corrida, te para en el tercio
izquierdo y ves 100 px más de lo que viene. Vuelve al centro sola en los
últimos 260 px, porque una vez a la par lo que importa es el vagón de al lado.

**3. Dos cosas que la persecución larga destapó**, las dos viejas y las dos
invisibles mientras duraba dos segundos:

- **El cartel de teclas se dibujaba encima del caballo.** Estaba en y=190 y
  202, que es el carril por donde galopás. Se mudó arriba, y ahora dura lo
  que dura la persecución en vez de siete segundos fijos: se va solo cuando
  alcanzás la cola, que es cuando dejás de necesitarlo.
- **Arrancabas pegado al borde de abajo**, con medio caballo fuera de
  pantalla. Ahora arrancás en el medio del carril. Da igual para el sigilo:
  detrás de la cola no hay ningún vagón del que esconderse.
- Y aflojando las riendas se podía retroceder hasta salirse de la pantalla.
  Ahora hay un piso: no se puede quedar más atrás de donde arrancaste.

### LA DECISIÓN QUE IMPORTA: la persecución no le cobra al asalto

`cobrarTiempoAlAsalto` descuenta del reloj del asalto los segundos que
gastaste galopando. Si eso se aplicara también a la persecución, alargarla de
240 a 620 px le habría sacado **cinco segundos a todos los asaltos por
igual** — y eso no es alargar la persecución, es bajar `raid.duration` por la
ventana, justo el número que la fase 2 dejó confirmado jugando.

Así que el reloj del asalto **empieza a correr cuando alcanzaste la cola**. Es
la misma regla que ya regía el aguante desde siempre (*"alcanzar la cola es
gratis; lo que cuesta es todo lo que te adelantes más allá"*), y el motivo es
el mismo: **un costo que todos pagan igual y que no se puede evitar no es una
decisión, es un número menos en el reloj.**

Efecto medido: cada opción quedó ~3 s más barata que antes (lo que costaba la
persecución vieja), y **las diferencias entre las tres quedaron intactas**,
que es lo único que sostiene la decisión.

### Medido — piloto que esquiva, 8 corridas por fila

| Dónde saltás | Llegaron | Galope | Aguante | Le cobra al asalto | Reloj del asalto |
|---|---|---|---|---|---|
| La cola | 8/8 | 7,4 s | 100 | **0 s** | 2:25 |
| Enganche 1-2 | 8/8 | 14,5 s | ~59 | 7,1 s | 2:16 |
| Enganche 2-3 | 8/8 | 22,1 s | ~21 | 14,8 s | 2:05 |

**Los tres enganches siguen siendo alcanzables**, que era el riesgo: el
`tiempoAproximacion` de 35 s ya había tenido que subir una vez de 25 por esto
mismo. Al más lejano se llega en 22 s, así que **sobran 13**.

**Ese margen de 13 segundos es la materia prima de la stat.** Un caballo más
lento se lo come y deja de llegar al tercer enganche; uno más rápido lo agranda
y llega con aire. Hoy no pasa nada de eso porque los dos caballos van a 90 —
por eso la stat es el paso siguiente y no éste.

### Lo que hay que mirar jugando

1. **¿Siete segundos de persecución son emocionantes o son un peaje?** Es la
   pregunta. Si aburre, el número es `inicioDetras` y se baja sin tocar nada
   más.
2. **¿Se entiende que hay que seguir la vía** antes de que el tren aparezca?
3. **¿Las piedras del tramo de persecución son demasiadas?** Ahora hay ~5 más
   que antes, porque se siembran cada 130 px de recorrido.

---

## EN PRUEBA · Fase 3 — El pueblo

*(idea de Santi: "acá se contrata compañeros, armas, caballo y se interactúa
con otros personajes. Solo el sistema del pueblo, todavía sin uso real")*

**El campamento es tuyo y está vacío; el pueblo es de otros y está lleno.** Esa
es toda la diferencia entre los dos, y es el eje sobre el que va a girar la
fase 3: en el campamento decidís **si** salir, en el pueblo decidís **con qué**.

**Se construyó el lugar SIN ninguna tienda que funcione, y es deliberado.**
Primero el pueblo, se camina, se ve si se siente un pueblo; recién después se
le cuelgan las transacciones. Al revés —construir la tienda y después buscarle
dónde ponerla— es como se termina con un menú disfrazado de lugar.

**Las cuatro puertas, cada una el perchero de un sistema ya diseñado:**

| Puerta | Hoy dice | Va a ser |
|---|---|---|
| **Establo** | "Cerrado hasta que haya con qué comprarlos" | Los caballos (`data/horse.js` ya es catálogo) |
| **Armería** | "Rifles y escopetas colgados de la pared" | Las ocho armas (diseñadas, falta la tienda) |
| **Cantina** | "Hay gente que busca trabajo" | Los compañeros |
| **Oficina del Sheriff** | **Tu cartel de "se busca", con el monto real** | La prisión y los mini jefes |

**El sheriff ya no es una promesa: es el primer lugar del juego donde
`bounty` se VE.** Ese número se movía desde hace tiempo y sólo aparecía en la
pantalla de resultados; ahora hay una cartelera con tu cara y el monto encima.
Con recompensa cero dice otra cosa ("la cartelera está llena de caras, ninguna
es la tuya"), que es la forma más barata de hacer que subir de cero a algo se
sienta.

**Tres decisiones que separan al pueblo del campamento**, y las tres a
propósito, porque viajar tiene que sentirse como ir a otro lado y no como
cambiar de pantalla:

1. **Hay cámara.** El pueblo mide 760 px y la vista 384: hay que recorrerlo. El
   campamento entra entero porque es un refugio; un lugar que se camina se
   siente ajeno.
2. **Es de día.** El campamento es una fogata en la noche. No comparten ni la
   paleta.
3. **Hay gente.** No hacen nada —van y vienen, y tienen una frase— y sin
   embargo son lo que separa "cuatro fachadas" de "un pueblo".

**Un arreglo que salió de probarlo, y que era un problema real:** los vecinos
caminaban siempre, así que acercarse a hablarle a uno rápido era perseguirlo —
peleabas con la geometría en vez de con el juego. **Ahora se frenan cuando te
les ponés al lado.** Es la misma regla que ya rige a los pasajeros del tren,
que dejan de huir cuando los tenés encañonados: la gente reacciona a que estés
ahí.

**Verificado, por consola, caminando de verdad con las teclas:** el caballo del
campamento hace las dos cosas (`E` alimenta y NO cambia de escena; `F` te
lleva al pueblo); las cuatro puertas se detectan y contestan, con el sheriff
mostrando el monto real (probado con `bounty` en 450); los cuatro vecinos se
detectan y hablan **persiguiéndolos en movimiento**, que es lo que falló antes
del arreglo; volver con `F` desde el caballo del pueblo te deja parado junto al
poste del campamento. Ida y vuelta tres veces seguidas sin que quede ningún
estado pegado, 4 segundos dibujando la calle entera con la cámara, y el ciclo
del asalto (`camp → ride → raid → results`) sigue entero. Cero errores.

**Lo que sigue:** el mapa de rutas (abajo) y, después, darle uso real a las
cuatro puertas — que es cuando la plata robada va a significar algo.

---

**Lo que sigue: el mapa de rutas.** El cartel hoy manda derecho al galope para
que el ciclo se pueda jugar entero. Cuando exista el mapa, esa línea pasa a
ser `scenes.goTo('mapa')` y el mapa decide a qué tren subís — **el galope ya
recibe la composición por parámetro, así que no hay que tocar nada más.** Es
la misma costura limpia que ya se pagó sola una vez, cuando el galope
reemplazó a la pantalla de abordaje sin que el asalto se enterara.

---

## ✅ HECHA · Fase 2 paso C (segunda mitad) — El abordaje por el techo

*(diseñado, construido, jugado, rehecho de cero con lo que dijo Santi al
jugarlo, y vuelto a jugar: confirmado. **Cierra la fase 2.**)*

Con el galope (paso D) y las puertas ya jugados y confirmados, el techo es lo
único que le falta a la fase 2 para cerrarse del todo.

### La primera versión estaba mal, y conviene dejar anotado por qué

Santi la jugó y fue tajante: *"está pésimo hecho"*. Los cuatro problemas que
marcó eran los cuatro estructurales, no detalles de números:

1. **El vagón de ganado tenía techo.** Va al aire libre, con barandas en vez
   de paredes — el comentario de `data/wagons.js` ya decía "no tiene techo".
   El código no lo cumplía.
2. **Los obstáculos eran piedras.** Estaban clavados en el techo y se
   esquivaban caminando al costado. *"No son piedras, son como carteles que
   van apareciendo y vos tenés que pensar rápidamente si agacharte o
   saltar."*
3. **El techo era continuo de punta a punta del tren.** Tenía que cortarse
   entre vagón y vagón, y cruzar de un techo al siguiente tenía que ser un
   salto que se calcula.
4. **Chocar te teletransportaba** al enganche más cercano, que es la solución
   más barata posible. *"El jugador se caería contra el techo y luego se
   levantaría, pero revelaría completamente su ubicación a los guardias y
   perdería una vida."*

**La lección de fondo, que vale más que los cuatro puntos:** la primera
versión trató al techo como *otro piso por el que caminar*. No lo es. El
techo es **un tramo de habilidad pura**, sin arma, sin cobertura y sin botín,
donde lo único que hacés es leer lo que viene y elegir rápido. Construido
como "un pasillo más pero arriba" no tenía nada que ofrecer.

### Cómo funciona ahora

**Cómo se sube: un TERCER destino del mismo salto del galope.** Si estás
sobre un enganche, `Espacio` salta al enganche como siempre. Si estás pegado
al cuerpo de un vagón **con techo**, el mismo `Espacio` abre la barra (abajo).
Gasta del mismo aguante y reloj — no hay presupuesto aparte.

**LA BARRA DE TIMING, Y LA REGLA DEL PROYECTO QUE ROMPE.** Está anotado en
tres lugares (README, acá y `data/horse.js`) que *"la destreza sale de la
física, no hay barra de timing ni minijuego que enseñar"*. Esta es la primera
y única excepción, y el motivo es concreto:

> El salto al enganche cumple la regla porque **hay un punto que apuntar** —
> el centro de la pasarela — y tu propia velocidad decide el margen. El techo
> **no tiene un punto**: es una franja de 40 columnas. La primera versión
> igual intentó sacarle destreza a la geometría (el grado salía de qué tan
> pegado al tren estabas) y no se sentía a nada, porque no había nada que
> clavar.

Primer `Espacio` abre la barra, segundo `Espacio` la frena. **Verde** limpio,
**amarillo** sucio (despertás el vagón), **rojo** no llegás. El verde va al
CENTRO y no en una punta: pasarse y quedarse corto tienen que costar lo
mismo, si no la barra se juega esperando el borde.

**La regla del proyecto pasa a ser:** *geometría cuando hay un punto que
apuntar, barra cuando el destino es una franja.* Decidido con Santi que el
cambio vale **sólo para el techo** — el salto al enganche no se toca, ya está
confirmado jugando.

Y se sigue exigiendo estar pegado al tren (`saltoDistancia`) para poder abrir
la barra, aunque el grado ya no dependa de la distancia. Es lo que mantiene
vivo el nudo de la escena: *lejos del tren nadie te ve, pero para saltar hay
que arrimarse, y arrimarse es justo donde te miran.*

**Lo que te viene de frente arriba.** No son obstáculos clavados: son
carteles y gantries de la vía que **aparecen adelante y te barren hacia la
cola**, porque el tren avanza. No se pueden rodear. Cada uno pide UNA cosa:

- **`agachar`** — viene alto, cruzando el techo por encima de tu cabeza.
  `Shift` y te pasa por arriba.
- **`saltar`** — viene bajo, pegado al piso del techo. `Espacio` y le pasás
  por encima.

Hacer la otra, o no hacer nada, es comérselo. **Ahí está todo el juego del
techo:** no es puntería ni posición, es leer rápido y elegir con la mano
correcta.

**LAS TECLAS CAMBIAN ARRIBA, a propósito.** Abajo `Espacio` es agacharse y
`Shift` es cubrirse. Arriba no existe la cobertura (no hay contra qué), así
que `Shift` queda libre para agacharse y `Espacio` pasa a ser saltar, que es
lo que hace saltar en cualquier juego del mundo. Son las dos respuestas
posibles a lo que te viene de frente, y por eso están **una en cada mano**.
Se avisa en pantalla los primeros segundos: nadie tiene por qué adivinar que
`Espacio` dejó de agachar.

**El techo se corta entre vagón y vagón.** Sobre el enganche no hay nada:
cruzar es un salto que hay que calcular. En el aire vas más rápido
(`saltoBoost`), y eso no es un adorno — es lo que hace que **un salto corrido
cruce el hueco y uno parado no**.

**Y el ganado no tiene techo** (`sinTecho: true` en `data/wagons.js`, leído
como `tieneTecho` en `world/train.js`). Consecuencia que salió sola y es
buena: **si el ganado cayó en el medio de la composición, el camino de arriba
queda partido en dos**, y elegir la ruta del techo pasa a depender de cómo
salió sorteado el tren de ese día.

**Chocar un cartel: te caés AHÍ MISMO.** Nada de teletransporte. Perdés una
vida y tardás en levantarte (`levantarse`), pero lo verdaderamente caro es
otra cosa: **el porrazo sobre la chapa delata tu posición exacta**. Los
guardias de ese vagón pasan a `combat` con tu `x` real — no "por dónde
andaba", exactamente dónde. Es la diferencia entre que te oigan y que te
sepan.

**Pisar el vacío: caés a nivel del piso donde estabas** — un enganche casi
siempre, o adentro del ganado si era eso lo que tenías debajo. **No saca
vida** (decidido con Santi): el costo es de posición, no de salud — quedás a
ras del suelo, al descubierto, y con el ruido del golpe encima.

**Bajar a propósito** se hace **desde el borde del techo** (a menos de
`bajarAlcance` del filo), manteniendo `[E]`. No se puede "estar parado en un
enganche" estando arriba, porque ahí ya no hay techo — ese es el hueco. Y ahí
queda la distinción que importa: **descolgarse a propósito es silencioso;
pisar el vacío por error hace el mismo viaje pero a los gritos.** La misma
maniobra, hecha bien o hecha mal.

Todo lo demás del acuerdo original se mantiene:

- **Bajás al enganche, con la puerta todavía de por medio** — nunca directo
  adentro de un vagón. Si el techo te dejara saltear la puerta, sería la
  forma obviamente superior de entrar a cualquier lado, y le sacaría el valor
  a todo el sistema de puertas.
- **Al blindado no se baja desde arriba.** Se camina por encima para seguir
  de largo, y nada más. Preserva la regla de "sólo dinamita".
- **Los guardias de abajo no te ven, pero te oyen** — reusa
  `hearStepRadius`/`hearStepRate` sin tocarlos — y te tiran a ciegas hacia
  arriba con el mismo patrón que las puertas cerradas
  (`enemy.techoBurstSize`/`techoSpread`/`techoFireCooldown`). **Agachado no
  hacés ruido, también arriba**, así que `Shift` sirve para dos cosas a la
  vez: pasar por debajo de un cartel y cruzar un vagón sin que te oigan.

### El "segundo nivel de mapa" salió mucho más barato de lo anotado

Estas notas venían advirtiendo desde hace tiempo que el techo *"obliga a
inventar un segundo nivel del mapa"*. **No hizo falta.** El techo no es un
tilemap con sus propias paredes: es una franja física (`CONFIG.techo.centroY`
y `ancho`) más una lista de obstáculos que se mueven. Eso responde gratis las
dos preocupaciones que la nota original tenía:

- *"arriba no chocás con las paredes de adentro"* → no hay paredes de adentro
  que consultar; el movimiento del techo no llama a `moveAndCollide`.
- *"no se puede robar"* → la interacción entera (robar / amenazar / escapar)
  se desactiva mientras `player.enTecho`, sin una regla nueva por cada tipo
  de botín.

### Verificado (por consola, motor manejado a mano)

- **Ganado sin techo, los otros cinco con.** Sale del layout/datos, no de una
  lista escrita a mano.
- **Reaccionar bien te salva, no reaccionar te mata.** 30 s de carteles
  contestando siempre con la tecla correcta: **4/4 de vida, cero golpes**. La
  misma corrida sin hacer nada: **muerto**. El mecanismo discrimina.
- **El hueco entre vagones funciona en los dos sentidos:** caminar hasta el
  borde sin saltar te tira al enganche (sin daño); correr y saltar en el
  borde cruza y aterriza en el techo del vagón siguiente (`enTecho` sigue en
  true, vida intacta).
- **El ganado en el medio parte el camino:** saltando desde el vagón 1 hacia
  un ganado en la posición 2, caés adentro del ganado. Correcto: ese vagón no
  tiene nada arriba.
- **Chocar no teletransporta y sí delata:** vida 4→3, `enTecho` sigue en
  true, `x` sin moverse un píxel, y el guardia del vagón pasó de `patrol` a
  `combat` con `lastSeen` = la `x` exacta del jugador.
- **Bajar a propósito desde el borde** te deja en el enganche, sin daño.
- **La barra, los tres resultados:** verde (t = 0,50) entra al asalto en el
  techo con **0 de 3 guardias despiertos**; amarillo (t = 0,28) entra con
  **2 de 2 despiertos** (el aterrizaje sucio despertó el vagón); rojo
  (t = 0,05) no sube y seguís galopando.
- **Corrida larga:** 30 s en el techo con la alarma sonando, jinetes activos
  y `render()` en cada cuadro, sin un solo error.

**Lo que NO se pudo verificar: cómo se ve y se siente jugando.** El panel del
navegador siguió sin componer frames.

### Trampa de medición NUEVA (van cuatro)

**`input.endFrame()` lo llama el bucle principal (`main.js`), no
`scenes.update`.** Manejando el motor a mano hay que llamarlo después de cada
`update`, si no una tecla queda "recién apretada" **para siempre** y
`wasPressed` devuelve true en todos los cuadros. Me costó una medición
entera: el jugador saltaba sin parar, nunca llegaba a agacharse, y parecía
que el sistema de carteles estaba roto cuando el roto era el script. Se suma
a las otras trampas ya anotadas en este archivo (`player.invuln` sin
resetear, `aimX`/`aimY` sin setear al disparar de verdad).

### ✅ JUGADO Y CONFIRMADO

Santi lo jugó después de la reescritura:

> *"Los obstáculos están perfecto. Todo se siente genial. Los disparos, los
> obstáculos y la llegada al techo."*

Los tres sistemas que la primera versión había errado —el ritmo de los
carteles, el tiro a ciegas desde abajo, y la barra de llegada— quedaron bien
a la primera después de rehacerlos. **Con esto el paso C está completo, y con
él la fase 2 entera.**

### Y lo importante: el techo NO rompió el equilibrio de la fase 2

Era el riesgo real de agregar un camino paralelo, y había que medirlo antes
de seguir. El número que sostiene todo el sistema del caballo es *"ir hacia
adelante cuesta casi el doble que volver"*; si por arriba fuera más barato,
esa cuenta se caía y con ella la decisión de dónde dejar el caballo.

**Medido, del vagón 1 al 4, sin alarma, jugador de prueba** (composición fija
`pasajeros/comedor/correo/pasajeros/blindado/ganado`, 4 corridas por fila):

| Ruta | Tiempo | Vida al llegar | Guardias despiertos |
|---|---|---|---|
| Pasillo corriendo | 30,5 s | 2-3 de 4 | **8-11 de 14** |
| **Techo corriendo** | ~29 s | 1-4 de 4 | **2-5 de 13** |
| Techo agachado | 39-46 s | 0-4 de 4 | 2-5 de 13 |

**El techo no es un atajo: tarda lo mismo.** Lo que compra es otra cosa —
**despierta la mitad del tren**. Y lo paga en varianza: con la alarma sonando
la vida perdida va de 0 a 3, contra un 1 fijo y predecible del pasillo.

Eso es exactamente lo que se le pide a una ruta alternativa: **no ser mejor,
ser de otra forma.** El pasillo es el camino confiable y ruidoso; el techo es
el camino silencioso y azaroso. La decisión de la fase 2 sigue intacta, y
encima ahora tiene una dimensión más.

### Lo que queda para mirar, sin urgencia

- **Agacharse en el techo todavía no paga.** Cuesta 50% más de tiempo (40-46 s
  contra 29) y no despierta menos gente (2-5 en los dos casos). El motivo es
  entendible —una vez que un guardia tiene `lastSeen`, el tiro a ciegas hacia
  arriba no le pide oírte de nuevo— pero deja a `Shift` sirviendo sólo para
  los carteles altos y no como herramienta de sigilo. Si alguna vez se quiere
  que cruzar agachado sea una jugada de verdad, la palanca está en que el tiro
  a ciegas del techo se apague cuando dejás de hacer ruido, no en la velocidad.
- El **ritmo de los carteles** (`obstaculoCada`, `obstaculoVel`) quedó bien a
  la primera según Santi; queda anotado dónde está por si cambia el gusto.

---


## EN PRUEBA · La alarma va hacia atrás, y el ruido lo decide el arma

*(idea de Santi, después de jugar y decir "es muy difícil, y más con el arma
inicial")*

**Lo que se hizo, tres cosas de una:**

1. **La alarma se movilizá sólo hacia la cola.** El vagón donde sonó y los de
   atrás que alcance el ruido se levantan y vienen. Los de **adelante** se
   despiertan pero **no abandonan su vagón**: te esperan ahí.
2. **El alcance lo decide el arma** (`noiseWagons` en `data/weapons.js`). El
   Colt alcanza un vagón. Las armas ruidosas van a alcanzar dos o tres.
3. **Se eliminó la propagación automática** (un vagón más cada 14 s). Ahora el
   tren se entera cuando vos hacés ruido, y nada más.

**La frase que ordena todo el sistema:** *el ruido no te trae enemigos encima,
te los pone entre vos y el caballo.* Un arma potente no despierta "más"
guardias: los despierta **más atrás**, o sea más lejos en tu camino de vuelta.
Eso le da por fin un precio real a la potencia y hace que la tienda venda
**permiso para hacer ruido** en vez de poder, que era el acuerdo desde el
principio.

**Por qué los de adelante se despiertan pero no vienen** (no era la idea
original, que era que no se enteraran de nada): si la alarma sólo existiera
hacia atrás, el **vagón 1 quedaría sin ninguna presión** — matás a los dos que
hay, y como atrás está la cola vacía, no viene nadie nunca. Quedarse atrás y
salir temprano se volvía todavía más rentable, que es justo la enfermedad del ⚠.
Así, en cambio, avanzar sigue teniendo sorpresa.

**Medido, asalto completo (ir al vagón 4 y volver), 20 corridas por fila:**

| | Antes | Ahora |
|---|---|---|
| Caballo en la cola | 2/20 (10%) | **7/20 (35%)** |
| Caballo en el enganche 2-3 | 7/20 (35%) | **16/20 (80%)** |

Alivia muchísimo. **Ojo: puede haber aliviado de más** — 80% con un jugador que
ni siquiera dispara es mucho. Es lo primero a mirar jugando.

**Lo que NO arregla, y hay que decirlo:** el problema medido del combate sigue
intacto. Treinta corridas de un jugador contra UN guardia parapetado, cero
impactos (ver más abajo). Esto reduce **cuántos** guardias te caen encima, no la
imposibilidad de matar a uno cubierto.

---

## HECHA · La vida de los guardias dejó de variar (por ahora)

El sorteo de escolta elegía al azar entre tranquilo y escoltado, así que la
mitad de los trenes traía guardias de 3 y blindados de 4. Sin nada que lo
anunciara, eso no se lee como "este tren viaja duro": se lee como un error del
juego, que es exactamente lo que `data/guards.js` advertía que iba a pasar.

Apagado con `SORTEAR_DIFICULTAD = false` en `data/train.js`. El sistema queda
entero — es una llave, no una amputación — y vuelve con el mapa de rutas, que es
cuando elegir un tren duro va a ser una decisión con su recompensa.

---

## HECHA · Los jinetes tardan más y tiran más — y ahora sí pegan lo que había que pegar

Aparecen a los **25 s** (antes 12) y el segundo a los 15 (antes 10). Cadencia de
2,2 a **1,2** s. **La puntería NO se tocó**, a propósito: se buscaba caos, no
letalidad.

**Y acá está el hallazgo, que contradice lo que esperábamos:** casi no cambió
nada. Medido con el jugador clavado en un hueco alineado con una ventanilla, sin
cubrirse, 60 segundos:

| | Balas tiradas | Impactos |
|---|---|---|
| Cadencia vieja (2,2) | 10,8 | **0** |
| Cadencia nueva (1,2) | 13,8 | **1** |

Bajar el tiempo entre tiros a la mitad dio apenas **+28% de balas**, porque el
cuello de botella no es ése: es el **`aimTime` de 0,85 s** (el aviso antes de
disparar) y, sobre todo, **lo poco que llegan a tenerte a tiro**. Desde el
pasillo, los asientos te tapan de la ventanilla casi siempre.

**El aviso bajó de 0,85 a 0,50** (pedido de Santi: "bajalo, pero sin que sea
injusto"). El criterio para elegir 0,50 no fue el gusto: una reacción humana
simple son ~250 ms, así que quedan otros 250 para moverse, y a 78 px/s eso
alcanza para salir del marco de una ventanilla. Sigue siendo casi el doble que
el aviso de un guardia de adentro (0,30), que es como tiene que ser: el de
afuera viene de donde no estás mirando.

### El hallazgo grande: los jinetes casi no le pegan a nadie

**Medido: aciertan el 3,7% de sus tiros. El README promete "1 de cada 3" y estas
notas decían "1 de cada 4". La realidad es 1 de cada 27.**

Y el motivo no es la puntería, es la **geometría**: de 82 balas, **72 murieron
contra el marco de la ventanilla**. El 88% ni entra al vagón.

Pasa porque dos reglas se multiplican sin que nadie lo hubiera pensado junto:

1. El jinete decide disparar si tiene **línea de visión** limpia — y la
   ventanilla no tapa la vista, así que la tiene seguido.
2. Pero después el tiro sale con **0,52 rad de dispersión**, que a esa distancia
   es una franja mucho más ancha que el hueco de dos baldosas por el que tendría
   que entrar. Casi todas se comen el marco.

O sea: *apuntan a través de la ventanilla y le pegan a la pared de al lado.*

**Consecuencia para el diseño:** la dispersión enorme se puso para que no
mataran, pero termina haciendo que **el sistema entero casi no exista**. Si se
quiere que los jinetes se sientan, la palanca NO es la cadencia (probado: bajarla
a la mitad dio +28% de balas y cero impactos más) ni el aviso. Las reales son:

- **Bajar la dispersión** a ~0,30 y compensar con menos jinetes o menos cadencia.
  Suena contradictorio ("apuntan mejor pero molestan igual") pero es lo que hace
  que la bala llegue a entrar por el agujero.
- **Más jinetes** (`RIDER_SPAWN.max`, hoy 2).

**Las dos palancas se terminaron usando, en vueltas posteriores:** "más
jinetes" se resolvió con la recompensa (ver "HECHA · Qué sube la
recompensa" y "EN PRUEBA · Fase 2 paso B" más abajo, techo 2/3/4 según
`bounty`). "Bajar la dispersión" se resolvió acá mismo, esta vuelta —
sigue abajo.

### La dispersión, resuelta (pedido de Santi: "de 20 tiros, entre 1 y 3
deberían pegar, según ángulo, si te movés, y la cercanía")

**Dos bugs reales aparecieron ANTES de poder tocar el número de la
dispersión, y sin arreglarlos cualquier valor que se probara iba a medir
otra cosa:**

1. **El jinete seguía hamacándose mientras apuntaba.** `rd.aimDir` se
   calculaba UNA vez al empezar a apuntar, pero `seguirAlJugador` seguía
   moviendo a `rd.x` (el hamacado, `keepDistance`) durante todo el medio
   segundo de aviso. Para cuando salía el tiro, el jinete ya se había
   corrido de donde apuntó — un error de ángulo que la dispersión ni
   siquiera necesitaba aportar. **Arreglo:** no se mueve mientras
   `rd.aimTimer > 0` (`systems/riders.js`).
2. **Bug de medición, no del juego — pero casi me hace tocar el número
   mal.** Midiendo a mano (jugador quieto, muchos disparos), la primera
   pasada dio ~1% de aciertos SIN IMPORTAR la dispersión que probara —
   hasta con dispersión CERO. La causa: el script nunca llamaba a
   `updatePlayer`, así que `player.invuln` (0,6s de invulnerabilidad tras
   cada golpe) nunca bajaba de vuelta a cero. El primer impacto de la
   partida de pruebas quedaba "protegiendo" al jugador de todos los
   siguientes, para siempre. Se agrega a la lista de trampas de medición
   conocidas, más abajo en este archivo.

**Con los dos bugs arreglados, la geometría real resultó más generosa de
lo esperado en un sentido y más dura en otro:**

- **La ventana cae justo sobre un hueco de dos baldosas entre los asientos**
  (el "recoveco" — `data/wagons.js`, comentario "las ventanillas caen justo
  sobre los recovecos"). Con la puntería BIEN calculada (sin el bug del
  hamacado), un tiro perfectamente alineado entra limpio casi siempre.
- **Pero apenas 10-20px de offset entre vos y la ventana y el jinete
  DIRECTAMENTE no consigue línea de tiro** — ni siquiera lo intenta. El
  recoveco es angosto de verdad. Esto significa que "tiro diagonal" ya
  sale mucho más difícil de la geometría sola, sin necesidad de un
  modificador aparte: en el límite, es directamente imposible.

**Números finales** (`RIDERS.ley` en `data/riders.js`): `spreadNear: 0.25`,
`spreadFar: 0.45` (escala con la distancia real al jugador, igual que
`enemy.spreadNear`/`spreadFar`), `movingPenalty: 0.16` (se suma si
`player.moving` está activo al momento de disparar).

**Medido** (jugador quieto en un punto fijo, jinete solo sin guardias ni
alarma para aislar el sistema, cientos de disparos por escenario):

| Escenario | Acierto | De 20 tiros |
|---|---|---|
| Tiro recto, quieto | 12,4% | 2,5 |
| Tiro recto, moviéndote | 7,6% | 1,5 |
| 10px de offset, quieto | 11,2% | 2,2 |
| 10px de offset, moviéndote | 9,8% | 2,0 |

Los cuatro casos caen dentro de lo pedido (1 a 3 de 20). Verificado también
por el camino real (jugador corriendo todo el tren, escena completa con
alarma): 11 tiros de jinete en 90s, sin errores, sin romper la separación
entre jinetes (sigue en 45px, el piso).

---

## EN PRUEBA · El caballo se elige — primera respuesta al ⚠

*(idea de Santi: "que entre los vagones el jugador también pueda escapar por
ahí, no en todos, en los primeros tres conectores, y qué tan lejos vas depende
de la resistencia del caballo")*

**Lo que se construyó:** antes de subir elegís hasta dónde adelantar el caballo
— la cola de siempre, el enganche entre el 1 y el 2, o el del 2 y el 3. **Donde
lo soltás subís vos, y ese punto es la única salida del asalto.**

**Por qué la versión de "una sola salida móvil" y no las tres abiertas a la
vez**, que era la idea original: con tres puertas siempre abiertas no renunciás
a nada, y una decisión sin renuncia no es una decisión — es un descuento. Con
una sola, adelantar el caballo **te abre los vagones de adelante y te cierra los
de atrás**: si lo dejaste en el enganche 2-3, el vagón 1 queda del otro lado de
tu propia salida y cuesta tan caro como el 5. Ganás un lado del tren y perdés el
otro.

**Por qué funciona, a la luz de lo medido arriba:** adelantar el caballo no te
ahorra la retirada, **te ahorra la ida**, que es la parte que mata. Llegás al
vagón 3 por afuera, a caballo, sin cruzar dos vagones de guardias despiertos.

**Medido después de construirlo** — asalto completo (ir hasta el vagón 4 y
volver) con el mismo jugador torpe de las pruebas de arriba, 20 corridas por
fila (hizo falta esa cantidad: la composición del tren se sortea y con seis
corridas la varianza se comía la diferencia):

| | Sale vivo | Tiempo |
|---|---|---|
| Caballo en la cola | **2 de 20 (10%)** | 53 s |
| Caballo en el enganche 2-3 | **7 de 20 (35%)** | 24 s |

Tres veces y media más probable, y en menos de la mitad de tiempo. Es
exactamente el efecto que se buscaba: llegar al medio del tren pasa de suicidio
a apuesta. Ojo con leerlo como "ahora es fácil": 35% sigue siendo perder dos de
cada tres veces, y ese jugador de prueba no dispara ni se cubre.

**El precio: tiempo de reloj.** 15 s por enganche (`CONFIG.caballo.costoTiempo`),
o sea 2:50 / 2:35 / 2:20. Tiene que costar algo: como desde afuera ves los tipos
de vagón, sin precio "dejar el caballo lo más adelante posible" sería
automático, y peor todavía si el blindado cayó en la posición 3 — entrarías
pegado al premio gordo. **Eso es lo primero que hay que vigilar jugando.**

**Lo que hay que mirar al jugarlo:**
1. ¿Elegís los tres puntos, o hay uno que conviene siempre?
2. Si el blindado está en el 3, ¿dejar el caballo en el 3 es automático? Si sí,
   sube el precio (o el blindado deja de poder estar en el 3).
3. ¿Se entiende, sin que nadie te lo explique, que la cola dejó de ser salida?

**Relación con el paso D:** esto es el andamio del galope. La pantalla de
abordaje ya no pregunta "en qué vagón subís" sino "hasta dónde adelantás el
caballo", que es la pregunta que va a contestar el galope. El asalto recibe
`{ caballoEn, composicion, dificultad }`, así que ese día se reemplaza la escena
y el asalto no se toca. La resistencia del caballo va a reemplazar al costo en
segundos.

---

## HECHA · Fase 2 paso A — El tren de seis vagones y la retirada

*(construida y probada; falta jugarla y ajustar los números)*

Seis vagones robables mezclados en cada asalto, más la plataforma trasera con
tu caballo, y un enganche al aire libre entre cada par de vagones.

**La decisión que crea todo esto:** elegís en qué vagón subir. El caballo se
queda en la cola, así que subir al vagón 6 no es "mejor", es una apuesta más
cara: después hay que desandar seis vagones con la alarma sonando. Y el botín
**no** mejora hacia adelante, así que meterse hondo nunca es la jugada obvia.

**Lo que se ve desde afuera es el tipo de vagón; lo de adentro no.**

---

## HECHA · Fase 2 paso A bis — Los guardias en serio

*(a partir del primer feedback jugando: "se volvieron muy fáciles de matar")*

Cuatro cambios que atacan lo mismo desde ángulos distintos:

1. **Vagones de pasajeros angostos.** Los asientos pegados a la pared. Antes se
   podía bordear el vagón entero sin cruzarse con nadie, o sea que media mitad
   del mapa no existía. Ahora el único paso es el medio.
2. **Siempre empezás al aire libre**, en un enganche, nunca adentro de un vagón.
   Aparecer de cara a un guardia sin haber hecho nada mal es la peor forma de
   empezar cualquier cosa.
3. **Los estados duran mucho más**, y el que ve un cadáver queda marcado para
   todo el asalto.
4. **La alarma despierta a los guardias que ya existen** en vez de inventar
   gente. Suena en el 3 y vienen los del 1 al 5, caminando.

**El punto 4 es el importante y era una idea de Santi.** Resuelve tres
problemas de una: la coherencia (nadie sale de un vagón limpiado), la
dificultad (peleás contra seis y no contra dos) y la retirada (los que quedaron
atrás te cortan la vuelta sin que haya que explicar de dónde salieron).

**Lo que hubo que construir para eso:** un buscador de rutas
(`engine/pathfind.js`). Un guardia que camina derecho hacia vos alcanzaba
cuando estaban siempre en el mismo vagón; para cruzar tres vagones se traba
contra el primer asiento.

**Trampa que apareció al probarlo:** al propagarse, la alarma le pasaba a cada
guardia la posición EN VIVO del jugador. Eso es adivinación y no se puede jugar
en contra. Ahora van a la última posición **conocida**: si rompés el contacto y
te movés callado, los mandás al lugar equivocado. Cada tiro tuyo vuelve a
delatarte.

---

## HECHA · Fase 2 paso A ter — Dinamita, pasillo angosto y pisadas

*(pedido de Santi, tercera vuelta de ajustes)*

**La dinamita es la respuesta a un problema que estaba anotado desde la fase 1:**
el sistema de cobertura se puede degenerar en "esperar detrás de un asiento".
Va en las dos direcciones — vos la usás para sacarlos a ellos de la cobertura,
y los guardias del blindado la usan para sacarte a vos. Por eso ellos la
encienden **solo cuando te ven parapetado**: si te movés, no la necesitan.

La decisión que la hace interesante: **la mecha corre desde que la encendés, no
desde que la tirás**. Tirarla enseguida los mueve; cocinarla los mata pero te
acerca al estruendo y a que te vuele la mano.

Y la regla que la salva de romper todo lo demás: **la explosión no atraviesa
paredes ni asientos**. Sin eso, la dinamita haría de la cobertura un adorno.
Con eso, te obliga a *cambiar* de cobertura, que es lo que queríamos.

**El pasillo de los vagones de pasajeros bajó a dos baldosas** (tres personas de
ancho). Cuatro era un galpón.

**Las pisadas hacen ruido.** Un guardia de espaldas te oye igual, a unas 3,5
baldosas. Agachado (Espacio) el ruido es cero, y ahí sí te podés pegar a la
espalda de cualquiera. Eso convierte a "agacharse" en una decisión con precio
(la mitad de velocidad) en vez de un botón que se olvida.

**Lo que hubo que agregar para que no se sienta injusto:** un aro que late
alrededor del jugador mostrando hasta dónde lo oyen. Un sistema de sigilo que no
se ve se siente tramposo aunque sea perfectamente justo.

---

## HECHA · Tipos de guardia, escolta del tren y el Colt como vara

**Los tipos de guardia se ven o no existen.** Guardia común (2) y guardia
blindado (3, con placa en el pecho y sombrero ancho). Restricción que ordenó
todo el diseño visual: **el color del cuerpo ya estaba ocupado diciendo el
estado** (gris/amarillo/rojo), que es lo más importante de leer momento a
momento. Así que el tipo va en la SILUETA, nunca en el color.

**La dificultad es una propiedad del tren, no un nivel escondido.** Un tren
escoltado le suma 1 de vida a todos. Techo 4, y el techo es un compromiso: el
Rifle de Caza va a sacar 5, así que mata de un tiro a cualquier guardia del
juego. Si alguna vez aparece un tipo con 5 de vida, esa promesa se rompe sin
que nadie se entere.

**Los vagones ya no miden todos lo mismo** (40/34/32/30/24). El argumento no es
"más cortos", es **ritmo**: con todos iguales, cruzar el de ganado costaba lo
mismo que cruzar el blindado. El tren pasó de 4256 a 3616 px.

**El Colt es la vara.** Sus números están puestos con lugar para arriba y para
abajo a propósito: si disparara rapidísimo, el Smith no tendría cómo ser más
rápido; si llegara lejísimos, el Rifle de Caza no tendría con qué distinguirse.
No es "el arma débil que vas a reemplazar", es la que te obliga a jugar con
cuidado. La tienda no te va a vender poder: te va a vender **permiso para
hacer ruido**.

---

## HECHAS · Dos correcciones que salieron de jugar

*(las dos las encontró Santi jugando, y las dos eran incoherencias reales)*

### Cubrirse te tapaba de gente que te estaba viendo

> *"Cuando toco Shift y me cubro, el guardia me ve de frente pero no se pone en
> rojo. En realidad no estoy dejando una pared de por medio."*

Tenía razón, y era un caso feo: **el comentario de la función ya decía lo
correcto — "estar a cubierto no te hace invisible, te tapa de los que están del
otro lado de la pared" — pero el código no lo hacía.** Dos errores encadenados:

1. El corte por `coverSightDistance` (62 px) se aplicaba a TODOS antes de mirar
   de qué lado estaba el guardia. A 63 px te volvías invisible aunque el tipo te
   estuviera mirando de cara.
2. El umbral de exposición (0,25) trataba como "tapado" a cualquiera que no
   estuviera casi de frente — **incluido un guardia parado a tu costado en el
   mismo pasillo**, que te ve entero. Una pared te tapa de lo que hay detrás de
   ella, no de lo que tenés al lado. Ahora el umbral es 0.

Verificado: a cubierto, un guardia en el pasillo te ve a 40, 70 y 100 px; el que
está detrás de la pared sigue sin verte.

### Los guardias no veían entrar las balas del jinete

> *"Ven balas de su compañero jinete que van a una dirección dentro del vagón y
> deberían pensar '¿adónde dispara el jinete?'"*

Ahora cada disparo de jinete emite ruido **en el punto al que apunta**, no en el
jinete: lo que mueve a los de adentro es ver dónde pegan las balas. Verificado: un
guardia tranquilo pasó a `suspicious` cuando el jinete empezó a tirar a su vagón.

**Detalle que hubo que cuidar:** ese ruido lleva la marca `deJinete` para que NO
cuente como que vos te delataste. El jinete puede estar tirándole a ciegas al
lugar donde te vio hace diez segundos; si eso fijara tu última posición conocida,
el tren entero sabría dónde estás por un tiro que erró. Eso es adivinación, y ya
había mordido una vez en el paso A.

---

## ACEPTADA · Tres ajustes para que el tren tenga que elegirse

*(ideas de Santi después de sacar $1238 —el 72% del tren— con el reloj justo)*

Las tres atacan lo mismo desde ángulos distintos: **hoy se puede hacer el tren
entero**, y mientras eso sea posible la decisión de cuánto arriesgar no existe.

### 1. Apretar el reloj — HECHO (170 → 145 s)

La palanca más barata y la única **validada por la experiencia de jugar**: Santi
dudó *"mirando el reloj y comparando con la distancia que me quedaba"*. O sea que
el reloj ya es el que sostiene la tensión; sólo había que hacerlo pesar más.

Con 170 se podía hacer el tren entero ($1238 y le sobraron segundos). Mientras
barrer entre en el reloj, "¿cuánto me llevo?" no es una pregunta.

### 2. Amenazar pasajeros — HECHO

Se le puede sacar plata a un pasajero con [E], 1,4 s, $25-70.

**Por qué era la más importante de las tres:** atacaba el problema estructural
que las mediciones habían encontrado — blindado y correo eran el 72% del tren y
los otros cuatro vagones, decorado.

**Medido sobre 120 trenes:**

| Vagón | Botín | Amenazando | Total |
|---|---|---|---|
| Blindado | $750 | — | $750 |
| Correo | $459 | — | $459 |
| **Comedor** | $144 | **$238** | **$382** |
| **Pasajeros** | $142 | **$190** | **$332** |
| Ganado | $48 | — | $48 |

**La concentración bajó de 72% a 52%**, y el tren pasó de valer $1685 a $2303.
El comedor —que era el vagón más inútil del tren después del ganado— ahora es el
tercero en valor, y por un motivo bueno: es el que más gente lleva.

**La regla que lo hace una decisión y no plata gratis:** te queda **un testigo
vivo**. Le sacás la plata, se queda con las manos arriba, y **tenés 4 segundos**
antes de que se ponga a gritar. Plata ahora, alarma después — o lo callás, y eso
se va a pagar cuando exista el honor. Lleva un relojito sobre la cabeza mostrando
cuánto falta: sin verlo sería una trampa en vez de una decisión.

**Lo que hubo que resolver, y no era balance sino geometría:** amenazar era
imposible. Acercarte lo suficiente para robarle lo hacía entrar en pánico en
0,35 s y sacarle la plata lleva 1,4: nunca llegabas. Faltaba la regla obvia —
**nadie se pone a los gritos con un revólver en la cara**. Un pasajero al alcance
de la mano queda encañonado y se calla. Grita cuando te alejás, que es
exactamente lo que hace interesante amenazar: el escándalo no se evita, se
posterga.

**Se puede amenazar a cualquiera, esté como esté** (pedido de Santi). También al
que ya gritó y salió corriendo: le ponés el revólver encima, frena en seco y
afloja igual.

Al principio sólo valía para los tranquilos, y eso tenía una consecuencia fea que
no se veía venir: **si la alarma sonaba temprano, todos los pasajeros huían y su
plata se perdía para siempre**, sin que hubiera nada que pudieras hacer. Eso no
es un costo, es mala suerte. Ahora perseguirlos cuesta tiempo —que con 145
segundos es la moneda cara— y eso sí es una decisión.

Dos reglas que lo sostienen:

- **Mientras lo estás amenazando no se mueve**, venga corriendo o esté acurrucado
  en un rincón. Se activa sólo si mantenés [E], no por pasar al lado: cruzar un
  vagón corriendo no tiene por qué congelar a la gente.
- **Al que ya gritó no se le da cuenta regresiva.** El escándalo ya lo hizo; una
  segunda alarma por el mismo tipo no significa nada.

Medido: un pasajero huyendo, con el jugador a 39 px, se alcanza y se le roba en
**2,2 segundos** corriendo de verdad. El jugador va a 78 px/s y ellos a 66, así
que la persecución siempre se gana — lo que se paga es el tiempo.

### 3. La puerta del vagón blindado, blindada — HECHA, y se agrandó a puertas en todo el tren

*(pedido original: al blindado sólo se pueda entrar volando la puerta con
dinamita. Al construirlo, Santi sumó una idea nueva: puertas en TODOS los
enganches del tren, no sólo el blindado)*

**Cómo se resolvió el problema técnico anticipado.** La preocupación original
era que el mapa de tiles nunca cambia durante el asalto, así que "romper una
puerta" iba a obligar a tocar `world/tilemap.js` y revisar que nadie tuviera la
grilla cacheada. **Se evitó por completo**: una puerta NO es un tile, es una
entidad con estado propio (`entities/door.js`), parada sobre la pasarela del
enganche — igual que el botín o los explosivos. El tile de abajo sigue siendo
`'+'` (pasarela normal) para siempre; la puerta es una capa aparte por encima.
Cero cambios en `tilemap.js` ni en `wagons.js`.

**El mecanismo, decidido con Santi vía preguntas de opción múltiple:**
- **Dos puertas por vagón, en su propio borde** — no una compartida flotando
  en el medio del enganche. Cruzar de un vagón a otro es: puerta del que
  dejás, la pasarela al aire libre, puerta del que entrás. Doce en total.
- **Para el jugador (y para los guardias), abrirla es gratis**: pisarla ya la
  abre, sin costo de tiempo ni de decisión.
- **Cerrada, tapa la VISTA pero no las balas.** Un guardia (o vos) del otro
  lado no ve, pero puede tirar igual, a ciegas.
- **Se cierra sola** si nadie queda parado en el marco (`closeDelay`, 1,6s) —
  da un respiro CADA VEZ que se cruza un enganche, no sólo la primera vez.
- **Tiene vida** (3 tiros): romperla la deja abierta para siempre.
- **Las dos del blindado son un caso aparte**: son la ÚNICA puerta del juego
  que además bloquea el PASO **y las BALAS** — un muro de verdad, no sólo la
  vista, mientras siga entera. Sólo la dinamita la rompe, desde cualquier
  lado. (Lo de las balas se agregó en una quinta vuelta, ver más abajo.)

### Tres bugs reales que Santi encontró jugando la primera versión

*(los tres se arreglaron en la misma vuelta)*

1. **La puerta blindada no bloqueaba nada — se podía caminar a través.** El
   bug de fondo: sólo se había enganchado el estado "abierta/cerrada" a la
   VISTA (`map.blocksSightAt`), nunca al PASO. Como ninguna puerta bloquea el
   paso (empujar las normales las abre gratis), la blindada tampoco lo hacía
   — "sólo dinamita" era una promesa de diseño sin código atrás.
   **Arreglo:** se envuelve `map.isSolidAt` también (`raidScene.js`), pero
   sólo para la blindada: mientras no esté rota (`!d.broken`), es sólida
   para cualquiera, de cualquier lado. Las normales no se tocan — siguen sin
   frenar el paso nunca. Verificado con `moveAndCollide` real: el jugador
   caminando de afuera hacia adentro se frena 14px antes de la puerta;
   volada con dinamita, la cruza sin problema.
2. **Las puertas quedaban en el medio del enganche, como si dos vagones
   compartieran una.** Ver arriba: se reposicionaron a DOS por vagón, en su
   propio borde (`world/train.js`), en vez de UNA por enganche en el medio.
3. **Los guardias del blindado podían salir de su vagón.** No estaba
   prohibido en ningún lado — si la persecución los llevaba afuera (por
   ejemplo, con la puerta ya volada), caminaban detrás tuyo como cualquier
   otro guardia. **Arreglo:** un guardia de tipo `'blindado'` recibe
   `confinado: {x0, x1}` al crearse (los bordes de su propio vagón, en
   píxeles) y `systems/ai.js` se lo hace cumplir AL FINAL de
   `updateEnemy`, pase lo que pase en el resto de la función — no es una
   regla que dependa de que cada rama de la IA (patrulla, sospecha, combate,
   huir de la dinamita) se acuerde de respetarla, es la última palabra
   sobre su posición, siempre. Verificado a propósito en el peor caso: con
   las dos puertas voladas y el guardia persiguiendo un objetivo a 500px de
   distancia, con paciencia larga (`spooked`), en 20s nunca salió de su
   rango (`[3088, 3568]`, se movió sólo entre 3094 y 3208).

**Cómo se conecta con el sistema de visión sin tocar la IA de guardias ni de
jinetes.** `raidScene.js` envuelve `map.blocksSightAt` UNA sola vez al armar el
asalto: guarda el original (`world.tileBlocksSightAt`) y lo reemplaza por una
versión que también pregunta por puertas cerradas. Como guardias, jinetes y el
sistema de cobertura ya preguntaban por `map.blocksSightAt` (nunca por el tile
directamente), **se volvieron conscientes de las puertas gratis**, sin tocar
`systems/ai.js` para eso ni `systems/riders.js` en absoluto. Es la misma lógica
por la que meter la ventanilla en el paso A no tocó el sistema de combate.

**Lo único que sí necesitó código de IA nuevo: disparar a ciegas.** Un guardia
que no te ve pero sabe más o menos dónde estás (`e.lastSeen`), si lo único que
se interpone es una puerta cerrada (no una pared, no un asiento — se
distingue comparando `hasLineOfSight` con y sin la puerta en la cuenta), te
sigue tirando: ráfagas de 5 en vez de 2, dispersión 0,6 rad (comparar con 0,28
el peor tiro apuntado), cada 2,2s. Usa timers propios
(`doorFireCooldown`/`doorAimTimer`/`doorBurstLeft`), separados de los del tiro
normal, porque corre en paralelo — no hace falta estar parapetado para vaciar
el cargador contra la madera. Si el guardia pierde la paciencia (9s sin verte,
el mismo `loseTargetTime` de siempre) deja de intentarlo y va a investigar.

**Verificado, todo por consola** (motor manejado a mano, el método de
siempre, en dos vueltas — la versión corregida sobre la que Santi encontró
los tres bugs de arriba): las 12 puertas se arman en el lugar correcto (dos
por vagón, en su borde) y sólo las 2 del blindado salen "blindada"; una
puerta normal se abre al acercarse y se cierra sola al alejarse; la
blindada frena de verdad el paso con `moveAndCollide` real (el jugador se
detiene 14px antes) hasta que la dinamita la rompe, y ahí sí se cruza sin
problema; las balas atraviesan las puertas COMUNES sin frenarse pero las
dañan (3 tiros rompen una), mientras que contra la blindada mueren en el
acto sin hacerle nada (ver la quinta vuelta, más abajo) — sólo la dinamita
la abre; una puerta cerrada tapa `hasLineOfSight` y
una abierta no, mientras que `blocksBulletsAt` no se entera nunca de que
existen; un guardia sin línea de visión con una puerta cerrada de por medio
disparó 15 veces en 3 ráfagas de 5 antes de perder la paciencia; un guardia
del blindado, con las dos puertas voladas y persiguiendo un objetivo bien
afuera durante 20s, nunca cruzó el borde de su vagón; y una corrida completa
del asalto (jugador cruzando todo el tren con la alarma sonando, 90s) no
tiró ningún error — y esta vez el jugador quedó frenado en seco justo en la
puerta blindada, en vez de atravesar el tren entero como en la primera
versión.

**Lo que NO pude verificar:** cómo se ve y se siente jugando — otra vez el
panel del navegador sin componer frames. Todo lo de arriba es lógica y
números confirmados a ciegas, no la experiencia real de empujar una puerta,
verla cerrarse, y que un guardia te sorprenda tirando a través.

### CUARTO bug, encontrado apenas se jugó el arreglo de la solidez

*(Santi: "a través de la puerta blindada tampoco se puede disparar")*

**La causa:** el arreglo de la solidez (bug 1 de la lista de arriba) había
reemplazado directamente `map.isSolidAt`, y ese mismo método es el que usa
`systems/cover.js` para decidir "¿hay una pared al lado para pegarme?". La
puerta blindada empezó a contar como una pared de cobertura — y estando a
cubierto, `player.js` exige asomarse para poder disparar
(`canShoot = !p.cover || p.peek >= peekShootAt`). Contra una puerta angosta
flotando en el aire, asomarse no tiene ningún sentido geométrico, así que el
resultado neto era "no se puede disparar".

**Arreglo:** se separaron las dos preguntas. `map.isSolidAt` queda intacto —
lo siguen usando `systems/cover.js` y el buscador de rutas, sin enterarse
nunca de que las puertas existen. Se agregó `map.isSolidForMovementAt`
aparte, que SÍ suma la puerta blindada, y sólo los lugares que mueven una
entidad de verdad la usan: el jugador (movimiento y deslizarse en
cobertura), los guardias (`moveToward`/`moveAxisAligned`/huir de una
dinamita/empujarse entre ellos), los pasajeros que huyen, el retroceso de un
golpe cuerpo a cuerpo, y la dinamita volando por el aire (para que se frene
justo contra la puerta y la pueda volar).

**Verificado, con el mismo método de siempre, los tres casos juntos:** el
movimiento sigue bloqueado contra la blindada cerrada; la cobertura contra
una pared DE VERDAD (un asiento cualquiera, lejos de cualquier puerta) la
sigue detectando sin problema — no se rompió la cobertura en general, sólo
se sacó a la puerta de esa cuenta; y un disparo real del jugador (por el
camino de `updatePlayer`/`shoot`, no una bala armada a mano) contra la
blindada cerrada la atraviesa limpio, sin que `p.cover` se dispare solo.

**Nota sobre el proceso:** buena parte de esta vuelta se fue en pelear con
bugs de mi PROPIO script de prueba (no reseteaba `player.invuln` en una
vuelta anterior de la sesión, y acá reusé `world.player.x` entre
sub-pruebas sin resetear `aimX`/`aimY`, así que un tiro salía apuntando para
el lado contrario) — quedó anotado para no repetirlo: cuando se prueba
disparo del jugador de verdad, hay que setear `world.aimX`/`world.aimY`
además de la posición, porque el ángulo de tiro se calcula a partir de esos
dos, no de un campo que se pueda fijar directo.

### QUINTA vuelta · La blindada también frena las balas

*(Santi, apenas se arregló lo anterior: "quiero que la puerta blindada
detenga los disparos. Las balas NO pueden atravesar la puerta blindada")*

**Un cambio de diseño, no un bug.** Hasta acá la blindada era inmune al daño
pero las balas la ATRAVESABAN — se podía tirar al vagón blindado a través de
la puerta cerrada sin poder abrirla nunca. Ahora es chapa de verdad: la bala
muere contra ella. El vagón blindado pasa a ser el único lugar del tren
donde **no hay ninguna forma de intervenir desde afuera**: ni caminando, ni
disparando, ni rompiendo. Sólo la dinamita, que es exactamente el peaje que
la idea original quería cobrarle al vagón que vale el 44% del tren.

**Lo que se tocó:**
- `systems/combat.js`: la bala pregunta por la blindada en la MISMA condición
  que `blocksBulletsAt` (la de las paredes), así que muere igual que contra
  una pared, con su impacto. Las comunes siguen exactamente como estaban:
  las atraviesa y las castiga.
- `systems/ai.js`: un guardia ya NO tira a ciegas cuando lo que lo separa de
  vos es una blindada. Sería vaciar el cargador contra un muro, y se leería
  como un bug antes que como desesperación. Contra una puerta común (madera,
  la bala pasa) sigue tirando igual que antes.

**Medido, disparo real del jugador (por `updatePlayer`/`shoot`, no una bala
armada a mano):** contra la blindada cerrada, la bala muere DENTRO de la
puerta (x 3090 sobre una puerta en 3096) y la puerta queda intacta (vida 3,
sin romper); con esa misma puerta ya volada, la bala la cruza y sigue de
largo hasta agotar su alcance; contra una puerta común, la cruza y le baja
la vida (3 → 2). Y el tiro a ciegas: 30 segundos de un guardia frente a una
blindada dieron **0 tiros**, contra **15** en la misma prueba con una puerta
común. La corrida completa del asalto (90s, disparando cada tanto) no tiró
errores: el jugador terminó frenado en la blindada, con una puerta común
rota por sus propios tiros y ninguna blindada rota.

## ACEPTADA (sin fase) · El catálogo de armas

Diseñado con Santi, **construido solo el Colt**. Ojo: esto NO es fase 2, y su
valor depende de que exista **la tienda**, que es fase 3. Ocho armas sin tienda
son ocho armas entre las que no podés elegir.

**Acuerdo: construir tres primero, no ocho** — las tres más distintas entre sí,
para probar que el sistema aguanta. Colt (hecha), **escopeta de doble caño** y
**Rifle de Caza**. Corto, medio y largo, y tres formas de jugar que no se
parecen. Si esas tres se sienten distintas, las otras cinco son un archivo de
datos cada una.

| Arma | Diseño acordado |
|---|---|
| **Colt** | Hecha. Es la vara: los números de todas las demás se miden contra ella |
| **Smith** | Más rápida de disparar y recargar, pero **5 balas y más dispersión**. Sin ese costo es un Colt mejor, y entonces no es una decisión |
| **Doble revólver** | Dos Colt, uno por botón. **Pierde la asomada**: esa es su identidad, es el arma con la que renunciás al sistema de cobertura. Recarga lentísima (2,5-3 s) |
| **Doble caño** | 2 tiros. **Tirar 6 perdigones con dispersión** en vez de programar "2 lejos, 4 cerca": la caída de daño sale sola, se ve, usa el sistema de balas que ya existe y **escala solo** cuando suba la vida de los guardias. El retroceso empuja al jugador hacia atrás |
| **Rifle de Caza** | 5 balas, **5 de daño**: mata de un tiro a cualquier guardia sin importar el nivel, y por eso el techo de vida es 4. Atraviesa a un enemigo. Cadencia y recarga lentísimas, **asomada más lenta**. Su identidad real es el **alcance**: los guardias ven a 118 px, así que un rifle útil a 200 mata gente que no te puede ver. Debe hacer **mucho más ruido** |
| **Rifle de Palanca** | 8 balas, 2 de daño, cadencia rápida. El arma "buena en todo", compra de media partida. Está bien que sea así |
| **Escopeta semiautomática** | 4 cartuchos. Necesita un costo: **recarga cartucho por cartucho**. La doble caño mete los dos de golpe; la semi, bajo presión, llega a meter uno o dos |
| **Dinamita** | Pasar de "muerte instantánea" a tres escalones: **5 / 3 / 1**. El 1 del borde importa: con 2 casi mata a un guardia de 3 y las dos zonas se vuelven a parecer. **El daño contra el jugador NO cambia** (3 en el centro), porque 5 lo mataría en el acto y eso contradice una decisión ya tomada |
| **Molotov** | **La más importante y la más subestimada.** Todas las demás sacan vida; esta **controla el espacio**, que no lo hace nada más en el juego. Sellar un vagón detrás tuyo mientras corrés al caballo es enorme en un juego que es un pasillo y una retirada. Hacerla **poco daño y mucho fuego**: si es "la dinamita menos dos", es una dinamita peor. La lógica de que los guardias no crucen ya está medio hecha (huyen de la dinamita) |

**Código nuevo que hace falta:** perdigones múltiples (chico), balas que
atraviesan (chico, hoy la bala muere en el primer impacto), la asomada con
doble revólver (chico), fuego persistente de la molotov (mediano, sistema
nuevo), y **radio de ruido por arma** (hoy todos los disparos hacen el mismo
ruido, con un número global — quedó incoherente desde que existen las pisadas).

---

## HECHA · Qué sube la recompensa (`gameState.bounty`)

*(diseñado con Santi; construido y verificado esta vuelta — es el paso previo
a los mini jefes)*

**Construido en `applyRaidResult` (`src/state/gameState.js`), números en
`CONFIG.bounty` (`src/data/config.js`): `pesoGuardia: 15`, `pesoCivil: 110`
(~7x, dentro del rango pedido), `capturaFlat: 300`.** No hizo falta rastrear
nada nuevo durante el asalto: `summary.kills`, `.civilians`, `.alarm` y
`.outcome` ya existían.

**Dos decisiones que la nota original dejaba abiertas, resueltas con Santi:**
- `summary.kills` mezcla guardias del tren y jinetes de la ley (así estaba
  desde antes, en `raidScene.js`). Se decidió que cuentan igual para
  `bounty`: ambos son gente de la ley muerta.
- Si te capturan CON la alarma sonando, se suman las dos cosas —
  `capturaFlat` MÁS la fórmula de civiles/guardias — no una u otra. Coincide
  con el "aparte de todo" de la nota original.

**Verificado sin poder ver el juego** (el panel del navegador seguía sin
componer frames esta sesión también — ver el ⚠ de más abajo): con
`import()` dinámico de `state/gameState.js` en la consola, 4 casos fabricados
(escapó sin alarma, escapó con alarma, capturado sin alarma, capturado con
alarma) — los cuatro dieron exactamente el número esperado. Y por el camino
real: `FORAJIDO.services.scenes.goTo('raid', ...)`, disparando los eventos del
bus (`enemyKilled`, `passengerKilled`, `playerDown`) y avanzando el juego a
mano con `scenes.update(1/60)` en un bucle (hacía falta: `requestAnimationFrame`
no corre con la pestaña sin componer) — `gameState.bounty` terminó en 440
sobre un caso de 2 guardias + 1 civil + captura, que es
`300 + 2×15 + 1×110 = 440`. Coincide.

**Corrección sobre la marcha: faltaba mostrarlo.** Santi jugó y no vio
ninguna etiqueta de recompensa, a diferencia del dinero. Tenía razón — el
número se movía pero no se veía en ningún lado. Se agregaron dos filas a la
pantalla de resultados (`resultsScene.js`, `text/es.js`): "Te identificaron
+$X" en rojo (sólo si subió algo ese asalto) y "Recompensa por tu cabeza $X"
(el total acumulado, siempre). `applyRaidResult` ahora guarda cuánto subió en
`summary.bountyGain` para que la pantalla no tenga que repetir la fórmula.
Verificado con el mismo método (consola + `scenes.update` a mano): un caso
con captura y alarma muestra "+$440" y "$440"; un caso de escape limpio no
muestra la primera fila y la segunda queda en "$0" sin resaltar.

**Lo que esto destraba:** los mini jefes (más abajo, todavía sin construir) y
que las reglas de aparición de los jinetes del paso B dejen de ser fijas y
dependan de `bounty` — esto último **ya se hizo**, ver "EN PRUEBA · Fase 2
paso B" más abajo.

*(nota original, sin tocar, para no perder el razonamiento):*

**El principio, que ya estaba anotado y esta vuelta lo confirma:** `bounty` no
mide lo que hiciste, mide **si te identificaron haciéndolo**. Es distinto de
`fame` (cuánto te conocen) y de `honor` (cómo te ven) a propósito — los tres
números contestan preguntas distintas y no hay que dejar que se pisen.

**El portón.** Sin alarma y sin captura, `bounty` no se mueve, sin importar
cuánto hayas robado o matado. Si nadie sobrevive para describirte, la ley no
tiene a quién buscar. Coherente con la propuesta original: *"si escapás sin que
suene la alarma, tu recompensa no sube — nadie sabe que fuiste vos."*

**Si te capturan:** un salto grande y aparte de todo lo demás. Tienen tu cara,
tu nombre, todo — no es gradual, es casi un piso garantizado.

**Si sonó la alarma** (escapaste o no):
```
bounty += civiles_muertos × PESO_CIVIL + guardias_muertos × PESO_GUARDIA
```
con `PESO_CIVIL` entre 5 y 10 veces `PESO_GUARDIA`. Un civil nunca representó una
amenaza; matarlo es lo que hace que un cazarrecompensas se levante de la silla.
Un guardia armado, en su trabajo, es casi el costo esperado del oficio — sigue
sumando, pero mucho menos. Los números concretos van a `config.js`, como todo lo
demás, para ajustarlos jugando.

**La plata robada NO toca `bounty`, va a `fame`.** Objeción que se discutió y se
resolvió: si la plata subiera la recompensa, ésta se convertiría en un segundo
medidor de dinero, y ya existe uno. Un ladrón cuidadoso que hace el tren entero
sin matar a nadie tiene que poder tener recompensa baja aunque haya robado
muchísimo — eso es EXACTAMENTE lo que se busca. La plata sí alimenta `fame`
(sos una leyenda) y no `bounty` (la ley te quiere por violencia). De paso, le da
un trabajo real a `fame`, que hoy no tiene ninguno.

**Amenazar pasajeros queda AFUERA de `bounty` por ahora.** Es violencia sin
sangre; meterlo en la misma bolsa que matar diluiría la diferencia entre
"peligroso" y "ladrón" que se está construyendo. Si más adelante se siente raro
que no cueste nada, el lugar natural es `honor`, no `bounty`.

**No baja sola.** Se paga en la cárcel (fase 3, ya anotada más abajo). Bajarla
con el tiempo queda descartado por ahora: no hay nada hoy que lo pida, y es un
sistema extra que habría que diseñar y probar sin necesidad real todavía.

**Lo que esto destraba:** en cuanto `bounty` se mueva de verdad, dejan de estar
bloqueados los mini jefes de abajo — su condición de aparición era justamente
"según tu recompensa" — y las reglas de aparición de los jinetes del paso B, que
hoy son un andamio fijo (dos, a los 25 y 40 segundos).

---

## HECHA · Extender las consecuencias de la recompensa — el paso previo a los mini jefes

*(pedido de Santi al retomar los mini jefes: "primero deberíamos extender las
consecuencias de la recompensa". Dos cosas: que amenazar a un civil también
sume, y que las consecuencias que ya existían sigan pasando cosas a
recompensas más altas en vez de toparse)*

**Antes de esto, `bounty` sólo tenía tres consecuencias, y una se topaba.**
Confirmado leyendo el código, no de memoria: la horca (`prision.umbralHorca`),
los jinetes de la persecución (`RIDER_SPAWN.maxPorRecompensa`) y el aviso del
sheriff (no es una consecuencia jugable, sólo el texto). Los jinetes se topaban
en 600 — de ahí para arriba, tener 700 de recompensa o 5000 daba exactamente
lo mismo, siempre 4.

**Amenazar a un pasajero no sumaba `bounty` en absoluto.** Un agujero real:
un jugador que vacía el tren entero amenazando a todo el mundo (con la alarma
sonando) salía con recompensa cero, exactamente igual que uno que no tocó a
nadie. Se agregó `CONFIG.bounty.pesoAmenaza: 7` — mitad de `pesoGuardia` (15),
redondeado abajo porque Santi lo pidió así al ver que 7,5 no es un número
limpio. Es un delito real (queda un testigo) pero no es matar a nadie, y por
eso pesa la mitad.

**Va con el mismo candado que guardias y civiles: sólo suma si sonó la
alarma ese asalto.** Es la misma regla pareja de todo el sistema (`bountyDelta`
en `state/gameState.js`), y en la práctica casi da igual: el testigo grita
solo a los `passenger.robPanicDelay` segundos salvo que lo mates o te vayas
del tren antes, así que amenazar ya casi siempre prende la alarma por su
cuenta. Se agregó un contador nuevo por asalto (`amenazados`, incrementado en
`robarPasajero()` de `raidScene.js`) que viaja en el `summary` igual que
`kills` y `civilians`.

**Los escalones de jinetes se extendieron y se corrieron.** De `0→2 / 200→3 /
600→4` a `0→2 / 300→3 / 700→4 / 1000→5` (`data/riders.js`,
`RIDER_SPAWN.maxPorRecompensa`) — números elegidos por Santi. Y `umbralHorca`
subió de 900 a 1200 (`data/config.js`) por un motivo concreto: con 900, la
horca caía ANTES de que se pudiera llegar a ver el escalón de 5 jinetes, y ese
escalón quedaba muerto para siempre. Con 1200, un jugador que sólo se deja
capturar (sin matar a nadie) aguanta cuatro capturas (`capturaFlat: 300` × 4 =
1200 justo) antes de la horca.

**Verificado por consola** (`import()` dinámico de `state/gameState.js` y
`data/riders.js`, sin poder ver el juego componiendo cuadros): sólo amenazas
sin alarma da 0; sólo amenazas con alarma (3) da 21; amenaza + guardia con
alarma da 22 (`15 + 7`); una captura sin nada da 300; una captura con 2
guardias, 1 civil y 2 amenazas con alarma da 454 (`300 + 30 + 110 + 14`). Y
`maxJinetesPara` da exactamente 2/3/4/5 en los bordes de cada escalón (299→2,
300→3, 699→3, 700→4, 999→4, 1000→5).

**Una cosa para revisar cuando se juegue el escalón de 5, no antes.** El
respaldo de posición cuando no hay ninguna ventana ni baranda cerca (adentro
del blindado) sólo tiene dos anclas por lado (`ANCLAS` en `systems/riders.js`).
Con 5 jinetes es posible que tres terminen del mismo lado, y ahí dos
compartirían ancla — `separarJinetes` los empuja a una distancia mínima, así
que no se pisan, pero podría leerse apretado. No se tocó porque es un caso de
borde (sólo pasa sin ventanas visibles Y con 3 del mismo lado) y no tiene
sentido ajustarlo sin haberlo visto jugado.

---

## ✅ HECHA · El Cazarrecompensas — el primer mini jefe

*(diseñado con Santi. Su pedido de fondo: "que tenga movimientos
característicos de este minijefe, como si fuera un minijefe de cualquier
juego". Eso cambió el diseño por completo — ver abajo)*

**La primera propuesta estaba mal y vale anotar por qué.** Yo había diseñado
un enemigo con MEJORES NÚMEROS: más vida, más rápido, mejor puntería, dos
armas según la distancia. Santi lo cortó con la observación correcta: eso no
es un jefe, es un guardia con esteroides. **Un jefe se define por lo que HACE
que nadie más hace**, no por dónde está parado en una tabla de stats. De ahí
salió la embestida, que es lo único de todo el sistema que un jugador va a
recordar.

**Y no se define por la vida.** El techo del juego sigue siendo 4 (ver
`data/guards.js`) y no se tocó: es lo que garantiza que las armas de un tiro
sigan matando de un tiro para siempre. El jefe tiene 4, igual que un guardia
blindado de un tren escoltado.

### Qué es

Sube por la COLA —igual que vos— y aprieta hacia la locomotora, o sea que se
mete ENTRE vos y tu caballo. Esa dirección es todo el diseño: no te quita vida
ni reloj, te quita **el camino de vuelta**, que es la moneda con la que este
juego cobra todo desde la fase 2.

| | |
|---|---|
| **Cuándo aparece** | Recompensa ≥ 900 **al subir al tren**, y sólo en trenes ESTÁNDAR |
| **Vida** | 4 (el techo, sin excepciones) |
| **Velocidad** | 68 px/s — más que un guardia en combate (46), menos que vos (78) |
| **Rifle de Palanca** (>90px) | Preciso, lento, un tiro por vez. Despierta DOS vagones por disparo |
| **Revólver** (≤90px) | Sucio y rápido: lo que saca cuando le quedaste encima |
| **Activo desde** | El segundo 0. No espera la alarma ni que hagas ruido |

**Por qué sólo en el estándar, y no es una limitación técnica:** el veloz ya
tiene su enemigo propio (el tren mismo: barriles y traqueteo) y el de carga
tiene el suyo (la pregunta del sigilo). Meterle un cazador encima a esos dos
les taparía la identidad que costó construirles. El estándar es el que tiene
lugar libre — su decisión son los caminos, y un cazador que te corta el camino
JUEGA con eso en vez de pisarlo.

**Te rastrea por VAGÓN, no por píxel.** Sabe en cuál estás y va para allá
(reusa `viajarHacia`, el mismo buscador de rutas de los guardias que te
persiguen); una vez adentro necesita verte de verdad para dispararte. Esa
mitad es lo que impide que se sienta a telepatía: **esconderte adentro del
vagón sí funciona — lo que no funciona nunca es que se olvide de vos.**

### La embestida, y por qué la ventana de castigo es el corazón de todo

Tres tiempos, el mismo lenguaje que el traqueteo del tren veloz y la mecha de
la dinamita: **avisa, pega, y se recupera.**

1. **AVISO** (0,55 s) — se planta en seco y encara. Una línea gruesa parpadeante
   marca por dónde va a pasar. Es el gesto más grande del juego a propósito.
2. **CARGA** (190 px/s) — sale disparado **en línea recta hacia donde estabas
   cuando se plantó**. No te sigue: por eso esquivarla es una decisión de
   posición y no una carrera que no se puede ganar.
3. **Si te agarró**, sigue como si nada (te tumba 0,8 s y te arranca de tu
   cobertura). **Si erró, queda 1,1 s aturdido.**

**Ese segundo aturdido es la pieza que hace que sea un jefe y no un castigo.**
Sin él, la embestida sería sólo un ataque más difícil de esquivar; con él,
esquivarla te REGALA el mejor segundo del asalto — con el Colt son dos tiros y
medio seguros, un cuarto de su vida. Un jefe tiene que tener un momento en el
que le podés pegar sin que te cueste, y ese momento tiene que salir de haber
jugado bien.

**Y rompe la puerta de chapa del blindado.** Es lo único además de la dinamita
que la abre, y queda rota para siempre: si lo llevás hasta ahí te está
abriendo el vagón más caro del tren. No es un regalo — para cobrarlo hay que
sobrevivir adentro.

### La fase de furia

A 2 de vida, una sola vez: grito, destello y **0,5 s de invulnerabilidad** (sin
eso el cambio de fase se sentiría barato, porque le seguirías metiendo balas
mientras pasa). Lo único que cambia son los COOLDOWNS — embestida de 7,0 a 4,5
s, disparo 25% más seguido. **Los tiempos de AVISO no se tocan nunca:** un jefe
que deja de telegrafiar deja de ser justo, y este juego no tiene un solo
peligro que no se pueda ver venir.

### El premio, y por qué es una decisión y no un obstáculo

Matarlo baja tu recompensa un **35%** (proporcional, no fijo: vale lo mismo
recién cruzado el umbral que al borde de la horca) y suma **+150 de fama**.

**Es la única forma de bajar la recompensa sin pasar por la cárcel.** Ahí está
la decisión: escaparle es lo seguro, pero enfrentarlo es lo único que te aleja
de la horca sin entregarte.

**Y cuenta aunque te capturen.** No es botín —eso se pierde si no escapás— es
un hecho que ya pasó. Que sea lo único que sobrevive a una captura le da a la
pelea un valor que ninguna otra cosa del asalto tiene.

**`fame` empieza a existir acá.** Estaba en `gameState` desde la fase 1 y NADA
en todo el juego la movía nunca. El primer tipo que la mueve tenía que ser
éste.

**No cuenta como un muerto más** (`cuentaComoKill: false`). Si contara, te
subiría la recompensa por `bounty.pesoGuardia` al mismo tiempo que el premio te
la baja: las dos cosas se anularían y el jugador no tendría cómo entender por
qué.

### Tres cosas que aparecieron MIDIENDO y cambiaron el diseño

**1. Se metía solo en un rango donde su propio movimiento era imposible.** La
primera versión se acercaba todo lo que podía y terminaba pegado a ~54 px. La
embestida necesita 60 de carrera (`alcanceMin`), así que **en 45 segundos de
prueba hizo CERO embestidas**. Y encima a esa distancia el revólver casi no
falla: mataba a un jugador quieto y descubierto en **4,1 segundos**.

Para tener una vara real medí lo mismo con un guardia normal a 135 px: **no
llegó a matarlo NUNCA en 90 s**. O sea que el jefe no estaba una escala por
encima de un guardia, estaba en otro juego.

El arreglo fue `distanciaDeTrabajo` (135 px) y una regla que además es mejor
diseño: **si le quedás más cerca que `corteDeArma`, RETROCEDE** — se separa
para tomar carrera. Eso le devuelve su movimiento de firma, saca al revólver
de ser su estado natural, y de paso le da al jugador una jugada nueva:
pegársele lo saca de su mejor distancia, a cambio de comerse el revólver de
cerca. Medido después: **8,0 s** para matar al mismo jugador quieto (contra
4,1), y 7 embestidas en 60 s.

**2. Cada bala le cancelaba el apuntado, o sea que no disparaba nunca.**
`damageEnemy` hace que un guardia herido se meta atrás de la cobertura, y eso
está bien para un guardia. Aplicado a un jefe lo rompía: con el Colt (un tiro
cada 0,40 s) y su apuntado de rifle (0,55 s), dispararle sin parar le cancelaba
el gesto ANTES de que saliera cada tiro. **La pelea se ganaba apretando el
gatillo sin pensar.** Ahora un jefe no pierde el apuntado por recibir un
impacto — su forma de castigar que le tires es la embestida, que ya existía.

*Es exactamente el tipo de interacción entre dos sistemas viejos que sólo
aparece cuando se juntan, y que ninguna medición por separado encuentra.*

**3. La puerta blindada tapa la vista, así que nunca la embestía.** Parado
frente a ella el jefe no "te ve" nunca → no entra en combate → y la embestida
sólo se disparaba en combate. Medido: 20 s empujando la puerta sin romperla.
El arreglo vive en `faseCaza` y no en `consideraEmbestir`, porque es también el
diseño correcto: **no está embistiendo al jugador, está rompiendo lo que le
corta el paso.** Son dos usos distintos del mismo movimiento. Verificado
después: la puerta cae en 1,7 s.

### Y un bug que sólo apareció jugando el asalto ENTERO

Corriendo 75 s con la alarma sonando, 17 guardias y 5 jinetes, **el jefe murió
de fuego amigo** — las balas de los guardias le pegan a otros guardias (regla
de la fase 1) y con esa cantidad de plomo en el aire es cuestión de tiempo. El
problema no era que muriera: era que **el jugador cobraba el premio entero sin
haberle disparado una sola vez.**

Arreglado con el flag `byPlayer` que el bus ya traía desde siempre y que yo no
estaba mirando. Que muera igual está bien (deja de perseguirte, y eso ya es
algo); lo que no puede pasar es que la ley te perdone la cabeza porque un
guardia tuvo mala puntería. Verificado: matarlo vos paga (1000 → 650, +150 de
fama), fuego amigo no paga nada.

**La lección, y es la tercera vez que aparece en este archivo:** *medir un
sistema aislado no encuentra los bugs que nacen de que dos sistemas se
crucen.* Las tres cosas de arriba y ésta salieron de correr el juego entero,
no de probar al jefe solo.

### Y hubo que dibujarlo dos veces, mirándolo

La primera versión era un **cuadrado rojo grande con un sombrero encima**, y
al lado de un guardia se leía exactamente así: un bloque, no una persona. **Es
la misma lección que ya había costado aprender con la res de la estampida:** a
este tamaño, lo único que separa una figura de una caja es que NO SEA UN
RECTÁNGULO.

Lo que lo arregló no fue más detalle sino la SILUETA: se ensancha hacia abajo
(los faldones del poncho) y **termina en dos puntas separadas**, nunca en un
borde plano. Verificado con `foto.ps1` al lado de un guardia común y en los
tres colores que puede tomar (normal, aturdido gris, furia naranja): la
silueta aguanta el cambio de color, que es la prueba de que la forma está
haciendo el trabajo y no el color.

**El color del cuerpo sigue diciendo el ESTADO, nunca el tipo** — la regla de
`data/guards.js` se respeta igual. Lo que dice "éste no es un guardia" es que
es más grande, tiene el sombrero más ancho del juego (18 px contra los 14 del
blindado) y lleva el rifle cruzado a la espalda cuando está con el revólver.

### Dónde vive

Mismo patrón de tres archivos que ya usan los guardias, y por la misma razón:

- **`data/bosses.js`** — el catálogo. Todos los números y el porqué de cada uno.
- **`entities/boss.js`** — qué ES y cómo se dibuja.
- **`systems/boss.js`** — cómo piensa.

**Vive en la lista `world.enemies` con un flag `esJefe`,** y eso no es pereza:
es lo que hace que todo lo que ya existe lo trate bien sin tocar una línea —
tus balas le pegan, no se superpone con los guardias, su cuerpo en el piso pone
nerviosos a los demás. Un sistema paralelo habría que enseñárselo a cada uno de
esos lugares, y el primero que se olvidara sería un bug silencioso.

La delegación (`updateBoss` en vez de `updateEnemy`) vive en la escena y no
adentro de `updateEnemy` a propósito: `ai.js` y `boss.js` se importarían en
círculo, porque el jefe reusa de `ai.js` el buscador de rutas y la línea de
visión.

### 🐛 SEGUNDA VUELTA · Las dos cosas que Santi encontró jugándolo

*(Santi: "hay dos cosas que no me gustan. Una es que venga muy rápido, él se
debería hacer esperar. Debería buscarte, pero no corriendo por ahí, sino como
si estuviera midiendo tus pasos desde atrás. Y no debería subir tan rápido al
tren. La segunda es que es MUY FÁCIL matarlo")*

Las dos eran correctas y las dos tenían causas concretas. La primera se
resolvió con un sistema nuevo; la segunda destapó **cuatro bugs y un error de
diseño mío**, y terminó obligando a romper una regla vieja del proyecto.

#### 1. El acecho — no sube corriendo, se hace esperar

La versión original subía en el segundo 0 y caminaba hacia el jugador a 68
px/s sin parar. Eso no es un cazador, es un perseguidor — y un perseguidor que
ya está encima desde el principio deja de dar miedo a los diez segundos,
porque ya sabés todo lo que va a hacer.

Ahora hace tres cosas en orden: **tarda 35 s en subir**, **te sigue a 260 px
sin disparar un tiro** (justo el borde de la pantalla: lo ves de reojo si
mirás para la cola), y **ataca cuando te parás a robar**.

**Ese disparador es la mejor parte y fue elección de Santi**, sobre las otras
dos que se evaluaron (la alarma, o puro tiempo). El motivo: **convierte tu
propio objetivo en el riesgo**. Hasta ahora robar sólo costaba TIEMPO (0,6 s
una bolsa, 6,5 s la caja fuerte); ahora además lo llama. Cada botín deja de
ser "¿me alcanza el reloj?" y pasa a ser "¿me lo quiero traer encima ahora?".
Y le da sentido a la caja fuerte como ninguna otra cosa: seis segundos y medio
quieto, de espaldas, sabiendo que el tipo que te mide desde atrás acaba de
empezar a caminar.

También lo despiertan que le quedes muy cerca o que le tires. Nada más — el
acecho **no se termina solo**, así que quedarse quieto y callado es, por
primera vez en el juego, una forma de que un enemigo NO venga.

Verificado: sube a los 35,0 s exactos, se clava a 260 px (medido 259-261
mientras el jugador camina), **cero balas durante el acecho**, y sólo cambia de
fase con el motivo `robando`.

**Un bug del propio acecho:** el jefe sube por la COLA, así que si el jugador
todavía está cerca de la cola no hay lugar físico para nacer a 260 px — nacía
pegado al borde, o sea encima, y la condición de "te quedaste muy cerca" lo
despertaba EN EL PRIMER CUADRO. Nunca llegaba a acechar ni un segundo. Se
arregló pidiendo `faseTimer > 1.5` para esa condición, con lo que pasa a
significar lo que tenía que significar: **te acercaste vos**, no "nació cerca".

#### 2. "Es MUY FÁCIL matarlo" — cuatro bugs y una regla que hubo que romper

Santi eligió atacarlo con **cobertura real** (que se parapete y sólo se exponga
al asomarse) antes que con más vida. Se construyó eso primero, y al medirlo
aparecieron tres bugs que la hacían imposible:

1. **Tenía ojos de guardia con un rifle de francotirador.** Usaba
   `CONFIG.enemy.viewDistance` (118 px) mientras cargaba un rifle de 300 y una
   distancia de trabajo de 135: **no te veía desde donde su propio diseño dice
   que quiere pelear.** En la traza cuadro a cuadro se pasaba el primer segundo
   entero en fase `caza`, caminando derecho por el medio del pasillo sin
   cubrirse ni disparar, mientras el jugador le vaciaba el tambor. No parecía
   un cazador: parecía alguien cruzando un vagón sin enterarse de que le
   tiraban. Se le dio `viewDistance` propia (300 = el alcance de su rifle) vía
   un parámetro opcional en `canSeeFrom`; los guardias no cambiaron.

2. **Al cubrirse se quedaba ciego.** Calculaba si te veía **desde el cuerpo**,
   que estando parapetado está tapado por definición — así que "dejaba de
   verte", salía de combate, volvía a cazar, se volvía a cubrir, en loop.
   Medido: 98% del tiempo pegado a una cobertura desde la que se asomaba el 3%.
   Los guardias ya resolvían esto mirando desde donde **se asomarían**
   (`probe` en `doCombat`); se copió esa regla.

3. **Cubrirse y avanzar se peleaban entre sí.** Tomaba cobertura mientras se
   acercaba y la rama de "fuera de mi distancia" se la borraba en el mismo
   cuadro. Y `avanzarConCobertura` caminaba HACIA la cobertura pero le pasaba
   de largo rumbo al jugador, sin pararse nunca en ella. "Avanzar de cobertura
   en cobertura" significa **pararse en cada una**.

4. **Y `faseTimer` medía lo que no era.** Para decidir "te perdí de vista"
   usaba el tiempo desde que entró en combate, así que si llevaba diez segundos
   peleando, el primer cuadro sin verte ya cumplía la condición y abandonaba al
   instante. Ahora tiene su propio `sinVerte`.

**Con los cuatro arreglados, la cobertura funciona** (se cubre a los 0,3 s, 44%
del tiempo en combate, alternando asomarse y disparar)... **y el número no se
movió ni un poco.**

| Con 4 de vida | Jugador que ignora todo | Jugador que esquiva |
|---|---|---|
| Balas para matarlo | **5** | **5** |
| Daño recibido | **0** | **0** |

**El jefe entero cabía en un tambor del Colt, y sobraba una bala.** Ahí está la
lección, y es la más cara de esta vuelta: *el problema no era la IA, era
aritmética.* 0,40 s por tiro × 5 tiros = 2 segundos, y no hay comportamiento
que sobreviva a eso. Se probó todo lo que NO era subir la vida —cobertura,
avance cubriéndose, embestida reactiva, arreglarle la visión— y ninguna de esas
cosas movió el resultado.

**La embestida reactiva se construyó igual y se queda**, porque arregla otra
cosa: un impacto le destraba la embestida al instante (0,3 s en vez de 7), o
sea que **le quita al jugador la posibilidad de quedarse parado apretando el
gatillo**. Con 4 de vida llegaba tarde (el aviso de 0,55 s más la carga
aterrizan a ~1,3 s, y moría a los 1,2); con 8 llega perfecto.

#### Y hubo que romper el techo de vida, con el motivo escrito

`health: 8`, contra el `MAX_GUARD_HEALTH: 4` que rige desde la fase 1.

**La promesa que ese techo protege sigue intacta:** existe para que el futuro
Rifle de Caza (5 de daño) mate **a cualquier guardia** de un solo tiro, y
ningún guardia pasó de 4 — `data/guards.js` no se tocó. Lo que la regla nunca
contempló es un mini jefe, que por definición no es un guardia.

Santi lo había dicho al empezar el diseño: *"un jefe no se define por la
vida"*. Es cierto, y por eso se buscó todo lo demás primero. Pero medido, la
conclusión es la otra mitad de esa frase: **la vida no es lo que lo hace un
jefe, pero 4 era lo que le impedía serlo.**

8 son DOS tambores con una recarga obligada en el medio — y la recarga del Colt
son 3,5 s (`data/weapons.js`), que es exactamente cuando te embiste.

**Medido después del cambio, y el vuelco es total:**

| | Antes (4 de vida) | Después (8) |
|---|---|---|
| Jugador que se queda disparando | **gana en 1,8 s, sin un rasguño** | **MUERE en 5,7 s** |
| Balas que necesita | 5 | no le alcanzan |
| Embestidas en la pelea | 1 (llegaba tarde) | 2, y entra en furia |

**La barra de vida hubo que rehacerla dos veces**, y la segunda por una razón
de pixel art: con 8 muescas calculadas como fracción de un ancho fijo
(`26 / 8 = 3,25`) caían en medios píxeles y el renderer las agrupaba de a
2-4-2. A esta escala eso se lee como un error de dibujo, no como una barra. Con
el paso en píxeles ENTEROS quedan todas iguales — que el ancho total varíe un
poco no importa; que las muescas sean parejas, sí.

### 🐛 TERCERA VUELTA · El acecho invisible y la persecución que nunca cerraba

*(Santi jugó la vuelta anterior y contestó las tres preguntas de verificación:
"no sentí incomodidad alguna [durante el acecho]"; "no le vacié el tambor como
la primera vez, pero sí resultó fácil — se complicó por los jinetes, no por
el cazarrecompensas"; y "ahora probé escapar y es SUPER SENCILLO irme de
vuelta a caballo y abandonar al tren")*

Las tres eran la misma familia de problema, y las tres tenían causa
verificable en el código — ninguna era "hace falta más feeling".

**1. El acecho era literalmente invisible.** La cámara centra en el jugador
(`camera.js`) y la pantalla mide 384px, o sea 192px visibles para cada lado.
`acecho.distancia` estaba en 260 — **68px más allá de lo que se puede ver,
siempre**. No es que el acecho fuera poco intenso: nunca entraba en cámara.
Bajado a 170 (adentro de los 192, con margen para el suavizado de la cámara) y
sumado un sonido propio (`acechando()` en `engine/audio.js`, una tabla
crujiendo lejos) cada 2-3 segundos mientras dura — el pedido explícito de
Santi ("ruidos de pisadas, la madera crujiendo").

**2. Y 3. eran la misma cuenta: el jefe era más lento que el jugador.**
`speed: 68` contra `CONFIG.player.speed: 78`. La distancia entre los dos sólo
podía crecer — nunca te alcanzaba de verdad, así que nunca arriesgabas nada
tirándole de lejos (de ahí que "seguía siendo fácil" pese a los 8 de vida) y
correr derecho al caballo ganaba siempre (de ahí "SUPER SENCILLO" escapar).
Se igualó a `CONFIG.player.speed`.

**Igualar el número no alcanzó, y hizo falta cavar tres capas más para
entender por qué — la más profunda un bug de verdad, no un ajuste:**

- **`avanzarConCobertura` no corre en línea recta.** Salta de escondite en
  escondite, con paradas para reubicarse — apropiado si le estás disparando
  mientras se acerca (para eso se construyó), pero te frena por debajo de su
  propia velocidad cuando estás huyendo y no hay ni un tiro en el aire.
  Arreglo: `bajoFuegoTimer` (2,5s, lo pone `reaccionarAlGolpe` cada vez que le
  pegás). Con el timer en cero, en vez de `avanzarConCobertura` corre derecho
  con `moveToward`/`viajarHacia` a toda velocidad.

- **La retirada para tomar carrera (`dist < corteDeArma`) no distinguía quién
  se acercó a quién.** Se pensó para cuando VOS te le acercás mientras le
  disparás desde lejos (sacarlo de zona de revólver). Pero disparaba igual
  cuando ÉL te alcanzaba a VOS después de perseguirte — así que justo en el
  instante en que por fin te agarraba, cedía el terreno que tanto le costó
  ganar. Mismo candado: sólo retrocede si `bajoFuegoTimer > 0`. Si te agarró
  sin que le hayas disparado, se queda y pelea con el revólver — agarrarte
  tiene que sentirse como que te agarró.

- **🐛 El bug de verdad: quedaba encajado contra los asientos.** Aislando
  `viajarHacia` solo (sin la máquina de estados encima), el pathfinding
  recorría 390px en 5s — EXACTO, ni un problema. Con la máquina de estados
  completa, en el mismo tiempo se movía **0px**. La diferencia: `parapetarse`
  lo deja parado en un `coverPoint`, casi siempre contra un asiento (con `y`
  lejos de 80, el centro del pasillo). Al perderte de vista y volver a
  `caza`, recalculaba ruta desde ESA posición — pegado a una fila de
  asientos, a veces con el propio hitbox superpuesto a la baldosa sólida — y
  de ahí ni el buscador de rutas lo podía sacar.

  **Arreglo: al perderte de vista y volver a cazar, se devuelve al centro del
  pasillo** (`bo.y = CONFIG.techo.centroY`). Se hace en ESE instante preciso a
  propósito: es el único momento en que garantizado no te ve (`sinVerte >
  1,5`), así que el salto es invisible para vos.

**Medido, la secuencia de arreglos** (jugador huyendo en línea recta sin
disparar, 7,5s, sólo el jefe vivo): 0px de movimiento neto (encajado) → -127px
(libre, pero todavía lejos de los -585 esperados a velocidad pareja) → con
guardias en el tren, terminó en fase `aviso`, o sea alcanzándolo y armando una
embestida. El resto de la diferencia contra el ideal (-585) ya no es un bug:
son las mismas paradas que tiene todo el resto de la pelea (0,55s de aviso
antes de cada embestida, 1,1s de aturdido si falla) — un jefe que corre
siempre a máxima velocidad sin parar nunca no sería más justo, sería un tren.

**Dónde queda esto:** de "invisible, más lento que vos, y no puede seguirte
si huís" a "te mide de verdad, no te suelta si corrés, y si te agarra en un
cover te va a costar sacárselo de encima". Falta que Santi lo juegue de nuevo
— esta vuelta de arreglos se agotó lo que un bot corriendo en línea recta
puede medir; lo que sigue (¿se siente bien la persecución de verdad, con
esquives y guardias de por medio?) sólo se contesta jugando.

### ✅ CUARTA VUELTA · Se cierra el tren — idea de Santi

*(Santi: "¿Y si cuando aparece el cazarrecompensas, se cierran las puertas de
todo el tren? Y si por alguna razón querés escapar, tendrías que romper las
puertas")*

Le da una consecuencia física a que esté cazándote, en vez de ser sólo "un
enemigo más difícil". Encaja además con algo que ya estaba anotado y sin
resolver del todo: la persecución mejoró mucho (ver la vuelta anterior), pero
seguía siendo posible, en teoría, correr en línea recta sin que nada más se
interpusiera. Esto pone algo más en el camino, y es algo que el jugador
entiende de inmediato sin que haga falta explicarlo — una puerta trabada se
lee sola.

**Dos decisiones, las dos con Santi:**

- **Todas las puertas del tren, no sólo las de atrás.** Encaja con el pitch
  original ("aprieta desde atrás hacia adelante"): el tren entero se cierra
  con él adentro, no sólo tu salida. Y es más simple de sostener — una puerta
  no tiene por qué saber de qué lado del jugador quedó.
- **Se traban cuando se despierta, no cuando sube.** Mientras acecha en
  silencio, las puertas siguen gratis — no hay ningún hecho todavía que
  justifique cerrar el tren. En el instante en que se activa (robaste, te le
  acercaste, le disparaste), ahí se cierra.

**Es una categoría nueva de puerta, no una regla nueva.** `trabada: true`
(`entities/door.js`) — sigue siendo MADERA: la rompen las mismas balas de
siempre, con la misma vida (`CONFIG.doors.health`, 3). Lo único que cambia es
que empujarla deja de abrirla gratis: frena el paso
(`isSolidForMovementAt`, la misma función que ya usaba la puerta blindada)
hasta que alguien la rompe. La blindada no se toca — ya tenía su propia
llave, la dinamita, y ésta no la reemplaza.

**El propio jefe no se encierra con sus puertas.** `puertaBlindadaEn` (el
detector que ya usaba para embestir la puerta de chapa cuando se traba
contra ella) pasó a reconocer también las trabadas — mismo movimiento, misma
lógica, "no está embistiendo al jugador, está rompiendo lo que le corta el
paso". Verificado: rompe una trabada en 1,6s al toparse con ella.

**Y se destraba si lo matás.** Muerto, por la mano que sea (tuya o fuego
amigo — esto es distinto del premio, que sí exige que lo mates vos): se
acabó la cacería, se acabó el encierro. Las puertas que ya rompiste siguen
rotas para siempre, como cualquier puerta rota; las que seguían enteras y
trabadas vuelven a abrirse gratis. Verificado: 10 trabadas antes, 0 después
de matarlo.

**Verificado el resto:** sin el jefe (recompensa baja), ninguna puerta se
traba nunca — cero regresión sobre el juego de siempre. Un asalto completo de
65s con 16 guardias, 4 jinetes y el jefe cazando corrió sin un error, con las
10 puertas de madera trabadas y una ya rota en el camino.

**Y hubo que dibujarla para que se lea de un vistazo**, con el mismo criterio
del resto del proyecto: una tranca cruzada en rojo (`enemyAlert`, el mismo
color que ya dice "esto no es gratis" en el resto del juego), sobre la
puerta cerrada — nada ambiguo entre "la empujo" y "la tengo que romper".

### ✅✅ CERRADO · "Se siente muy bien"

*(Santi, después de la cuarta vuelta: "se siente muy bien. Yo lo dejaría así
por ahora." Y una advertencia para el futuro: "hay que tener en cuenta que
cuando el jugador ya llegue a 900 de recompensa tendrá más experiencia y
mejor equipo")*

**El Cazarrecompensas se da por cerrado en su forma actual.** Vale anotar la
advertencia de Santi tal cual, porque es del tipo que se olvida fácil: todo lo
medido en este archivo (el 80% de acierto, los 8 de vida, los 5,7s de
supervivencia) salió de un jugador de prueba con el Colt inicial y sin
costumbre. Un jugador que de verdad llegó a 900 de recompensa ya jugó varios
asaltos, probablemente tiene un arma mejor y sabe leer los avisos del juego —
así que la dificultad REAL en manos de ese jugador es, casi seguro, más baja
que la medida acá. Si en algún momento se siente flojo, el primer sospechoso
no es "hay que subirle números": es que el jugador que lo prueba en ese
momento ya no es el jugador nuevo para el que se calibró.

`bounty` de arranque devuelto a 0 en `gameState.js` — la recompensa vuelve a
ganarse asalto a asalto, como corresponde.

### Lo que queda para cuando se juegue

Tres movimientos más quedaron **diseñados y sin construir**, a propósito: uno
solo, jugarlo, y recién después los otros — la misma disciplina que se usó con
los barriles del tren veloz.

| Idea | Qué haría |
|---|---|
| **Tiro marcado** | De lejos te apunta con una mira visible: no falla por moverte, sólo se esquiva cortándole la línea de visión. Castiga quedarse a distancia en el pasillo |
| **Grito de refuerzos** | Llama a los guardias cercanos, coordinados con él. Haría que la pelea siga sintiéndose como EL TREN y no como un arena aislado |
| **Instinto de cazador** | Esquiva tus disparos con un paso al costado. El más parecido a un jefe de verdad, pero el más caro (necesita anticipar tu bala) y el que más riesgo tiene de sentirse injusto |

Y una cosa chica para vigilar jugando: el respaldo de posición de los jinetes
cuando no hay ventanas cerca sólo tiene dos anclas por lado (`ANCLAS` en
`systems/riders.js`). Con el escalón de 5 jinetes es posible que tres queden
del mismo lado; no se pisan (`separarJinetes` los empuja), pero podría leerse
apretado.

---

## ✅ HECHA · El Sheriff — el segundo mini jefe, y el opuesto del primero

*(diseñado con Santi. Construido y verificado; falta jugarlo)*

**El Cazarrecompensas te caza a VOS y su pelea es un duelo. El Sheriff no pelea
con vos en absoluto.** Es seguridad del tren, y su gracia no está en lo que te
hace de frente sino en lo que le hace al RESTO del tren mientras respira.

**No se defiende: se repliega.** Apenas suena la alarma sale hacia la
locomotora y no vuelve a disparar nunca. Verificado con el jugador pegado a
él veinte segundos seguidos: **cero balas, y ni siquiera llega a apuntar.**

Lo difícil no es matarlo —aguanta lo mismo que cualquier guardia— es **LLEGAR**:
cada vagón que avanzás persiguiéndolo es un vagón más lejos de tu caballo, con
su escolta encima y con los guardias de ese vagón ya despiertos. *El precio se
paga en distancia hasta la salida*, que es la moneda real del juego desde la
fase 2 — por eso no necesita ni vida extra ni movimientos de firma.

### Cómo aparece — y la idea de Santi que mejoró la propuesta

Yo había propuesto un umbral duro ("a partir de 600 aparece") y en el tren
VELOZ. Santi corrigió las dos cosas:

- *"En el veloz ya es sumamente complicado"* — y tenía razón: ese tren ya tiene
  su propio enemigo (barriles y traqueteo). Meterle un jefe encima era **apilar
  dos sistemas de presión que no se hablan entre sí**. Va al estándar.
- *"No pondría una condición tan marcada. Más bien: cuando tenés entre 599 y
  899 hay una probabilidad de que aparezca"* — y esto es mejor diseño que lo
  que propuse. **Un umbral fijo se aprende una vez y después es un trámite**
  ("a partir de X aparece"). Una probabilidad hace que subir a un tren
  estándar en esa banda sea una apuesta cada vez.

| Recompensa | Qué puede subir a un tren estándar |
|---|---|
| 0-599 | Nada |
| **600-899** | El Sheriff, al **40%** |
| **900+** | El Cazarrecompensas, siempre |

**Las bandas NO se superponen a propósito:** nunca hay ambigüedad sobre cuál de
los dos te tocó, ni riesgo de comerte los dos juntos. Verificado: 599 → nada,
600-899 → sólo Sheriff, 900+ → sólo Cazarrecompensas, y nunca aparece en veloz
ni en carga. La probabilidad medida sobre 4000 tiradas dio **39,7%** contra el
40% esperado.

Y **ya viaja en el tren** cuando subís — no aparece tarde como el
Cazarrecompensas. La diferencia es de fondo: aquél viene POR VOS (aparecer a
mitad de camino tiene sentido), éste es parte de la seguridad del tren y ya
estaba ahí. Nace en un vagón del fondo (nunca en los dos primeros): si naciera
pegado a la cola se replegaría medio tren de corrido y nunca lo alcanzarías.

### Las tres cosas que hace, y ninguna es pelearte

**1. Los de su vagón pelean mejor — y acá no hubo que inventar los números.**

Son exactamente los de `DIFICULTADES.dura.aiOverrides` (data/train.js): la
dificultad **"Alta vigilancia", que estaba CONSTRUIDA Y APAGADA** (`peso: 0`,
nunca sale sorteada) desde que se hicieron los tipos de tren. Éste es su primer
uso real, y es mejor que haberla sorteado: en vez de un tren que "viene difícil"
sin motivo visible, hay un tipo con una estrella en el pecho al que le podés ver
la causa y matarla.

**El aura se mueve con él**, así que el peor vagón del tren es siempre donde
esté parado. Verificado: los 5 guardias de su vagón con puntería 0,068 (la de
"dura") contra 0,09 de los de afuera; cero guardias con el aura fuera de su
vagón; y al matarlo se apaga en todos.

**2. Tu arma hace más ruido del que debería.** Un vagón más de alcance en cada
disparo tuyo. No te suma enemigos: **te los despierta más atrás**, más lejos en
tu camino de vuelta. Verificado midiendo qué vagones se despiertan con el mismo
ruido: con él vivo, los vagones 1-5; muerto, sólo 2-4.

Es la pieza que hace que valga la pena matarlo aunque él no te dispare nunca:
**no lo matás porque sea peligroso, lo matás porque hace que todo lo demás sea
peor.**

**3. Los tres que no se le despegan** — pedido explícito de Santi (*"yo haría
que siempre unos tres guardias estén junto a él; donde él vaya, ellos van. A
parte, también estarán los guardias de los vagones"*).

No hizo falta una IA de formación nueva: **son guardias normales cuya RONDA, en
vez de un camino fijo del vagón, es él.** Todo lo demás (ver, sospechar, gritar,
cubrirse, disparar) sigue siendo la IA de guardia sin tocar. Y se suman a los
guardias propios de cada vagón que crucen: perseguirlo no te enfrenta a tres
tipos, te enfrenta a tres MÁS los que ya vivían ahí.

### 🐛 La formación en círculo no funcionaba, y el motivo vale para siempre

La primera versión repartía a los tres en círculo alrededor del Sheriff (tres
ángulos a 120°). Medido: dos de los tres quedaban en `y = 57` y `y = 103` — o
sea **fuera del pasillo, adentro de las filas de asientos** — y ahí se trababan
sin moverse un píxel en seis segundos. Sólo 1 de 3 lo seguía.

**El tren no es un espacio abierto: es un CORREDOR de dos filas de alto.** Una
formación tiene que repartirse *a lo largo*, no *alrededor*.

Y la segunda versión todavía fallaba a medias: dejé al tercero 13px arriba del
centro ("al hombro") y se quedaba a 511px mientras los otros dos lo seguían
pegados — desplazado del centro se traba en los enganches, que son más angostos
que el pasillo. **Un puesto que a veces funciona es peor que uno aburrido que
siempre funciona.** Los tres van por el eje del pasillo, sólo separados a lo
largo; `separateEnemies` ya los despega si se apilan. Verificado: los 3 lo
siguen a 24-45px, en dos corridas.

**Y la escolta necesitó su propia velocidad de patrulla.** A los 24 px/s de una
ronda normal lo perderían en el primer vagón (él se repliega a 64). `doPatrol`
pasó a leer `e.ai.patrolSpeed` en vez de `CONFIG.enemy.patrolSpeed` — un
guardia sin perfil propio se comporta exactamente igual que siempre, mismo
patrón que ya usaban la puntería y la sospecha.

### El premio: sólo fama

Matarlo suma **+100 de fama** y **nada de recompensa** (`bajaBountyFrac: 0`).
Es la diferencia de fondo con el Cazarrecompensas: aquél viene por tu cabeza,
así que bajarle la ficha a la ley tiene sentido. El Sheriff no tiene nada que
ver con tu recompensa — es seguridad de la compañía.

**El premio de verdad es mecánico y se siente al instante:** los guardias
vuelven a pelear normal y tu arma vuelve a sonar lo de siempre.

**Y SÍ cuenta como un muerto más**, al revés que el Cazarrecompensas: es un
hombre de la ley muerto con la alarma sonando, el caso exacto que
`bounty.pesoGuardia` cobra desde siempre, y no hay ningún premio que se le
anule. Verificado: matarlo con alarma dejó la recompensa en 715 (700 + 15),
fama 100, `kills: 1`.

### Dónde vive, y por qué NO usa entities/boss.js

**El Sheriff es un `createEnemy`**, no un `createBoss` (`spawnComo: 'guardia'`
en data/bosses.js). No es una decisión de implementación, es el diseño: *"solo
es apenas un guardia"*. Aguanta lo que aguanta cualquier guardia (2 ó 3 según
la dificultad del tren) y **el techo de 4 se respeta sin excepción — la
excepción del Cazarrecompensas no se contagia.**

Su tipo (`GUARD_TYPES.sheriff`) existe sólo para que se vea distinto: la
estrella dorada en el pecho, lo único de ese color que lleva una persona en todo
el tren. Es el caso que mejor defiende la regla vieja de `data/guards.js` (*el
color dice el estado, la silueta dice el tipo*): lo peligroso de este tipo no es
cuánto aguanta, así que la silueta alcanza. Mirado con `foto.ps1` al lado de un
guardia común y de su escolta: se distingue de un vistazo.

Cómo piensa está en `systems/sheriff.js`, separado de `systems/boss.js` porque
no se le parece en nada.

---

## PENDIENTE · Los dos jefes, jugados juntos

Los dos están construidos y verificados por consola, pero **el Sheriff todavía
no se jugó**. Las preguntas abiertas son las mismas que valieron para el
Cazarrecompensas (ver "El test del cazarrecompensas" más arriba), más una
propia:

**¿Perseguirlo se siente como una decisión o como una obligación?** El diseño
apuesta a que sea una decisión — podés ignorarlo, robar tranquilo y comerte el
aura y el ruido extra todo el asalto. Si al jugarlo resulta que siempre conviene
ir a matarlo, o que nunca conviene, hay que mover el precio (la velocidad de
repliegue, 64) o el premio (la fama, +100).

Y con `bounty` subiendo, esto ya es real y no hipotético: **el bono de trabajo
limpio paga dos veces** (el doble de plata ahora, cero calor después), y es
**la primera decisión del juego que cruza de un asalto al siguiente**.

Diseño acordado de los dos, para cuando toque — y ninguno se define por la vida,
porque con techo 4 no se puede:

- **Cazarrecompensas:** no custodia el tren, te caza a vos. No patrulla,
  rastrea. No se olvida nunca. Usa la cobertura para acercarse, no para
  dispararte. Sube al tren desde afuera, a caballo.
- **Sheriff:** solo es apenas un guardia; su gracia es que **los de alrededor
  pelean mejor** y que **él propaga la alarma**. Matarlo apaga las dos cosas. Lo
  difícil no es matarlo sino **llegar**: no se asoma nunca, sus guardias se le
  ponen adelante y **se repliega hacia la locomotora**, o sea que perseguirlo te
  aleja del caballo. El precio se paga en distancia hasta la salida, que es la
  moneda real de este juego.

---

## HECHA · Fase 2 pasos C y D — La aproximación a caballo

*(construida; falta jugarla)*

El asalto ya no empieza con un menú: empieza galopando a la par del tren. La
pantalla de abordaje (`boardingScene.js`) se borró y la reemplazó
`scenes/rideScene.js`. **El asalto no se tocó**: sigue recibiendo un número
(`caballoEn`) y no se enteró de nada. La apuesta de haber dejado esa costura
limpia se pagó sola.

**Las tres reglas que lo hacen una decisión y no un pasillo:**

1. **Sin apretar nada vas a la par del tren.** No lo podés perder por
   distraído. Lo que se decide es DÓNDE subís, no SI subís.
2. **El aguante no se recupera.** Presupuesto fijo. Sin esto alcanzaba con
   esperar a que se recargara y llegabas siempre al fondo, o sea una sola opción
   disfrazada de tres.
3. **Ir rápido hace el salto más difícil**, porque cruzás el enganche en menos
   tiempo. Aflojar da una ventana cómoda pero cuesta reloj. La destreza sale de
   la física: no hay barra de timing ni minijuego que enseñar.

**El precio, y el error que casi cometemos.** La primera versión no cobraba
nada: el aguante no sirve dentro del vagón y el reloj del galope tampoco, así
que adelantarse salía **gratis** y llegar siempre al tercer enganche era la
única jugada. Era exactamente la degeneración que estas notas venían advirtiendo.
La solución: **cada segundo galopando se le descuenta al reloj del asalto**. No
es un castigo inventado —el tren avanza mientras te acomodás— y encima cobra
también el aflojar las riendas para acertar un salto cómodo. Reemplazó al
descuento fijo de 15 s por enganche, que era un número puesto a dedo.

**Medido, con un piloto de prueba que sabe adónde va:**

| Dónde salta | Galope | Aguante que le queda | Reloj del asalto |
|---|---|---|---|
| La cola | 0,4 s | 100 | 2:50 |
| Enganche 1-2 | ~6 s | ~61 | 2:44 |
| Enganche 2-3 | 11-15 s | 15-35 | 2:36-2:40 |

Y el tope del caballo dejó de ser un número de config: **es hasta dónde te da el
aguante**. Con todo gastado llegás justo al tercer enganche; el cuarto queda
entre 1690 y 2070 px, siempre fuera de alcance.

**Verificado corriendo el juego:** el ciclo entero (galope → asalto → escape →
resultados → galope) en las tres opciones, sin errores. Fallar el salto
trastabilla y no sube. Sin aguante no se avanza más. Si se acaba el reloj, subís
en el enganche que tengas más atrás — la aproximación nunca termina en
"perdiste sin haber jugado".

**Lo que quedó afuera a propósito: el abordaje POR EL TECHO** (la otra mitad del
paso C). Obliga a inventar un segundo nivel del mapa —no chocás con las paredes
de adentro, no podés robar, hay que resolver cómo se baja— y no tiene sentido
pagarlo antes de saber si el galope se siente bien. Si se construyen juntos y
algo falla, no se sabe cuál de los dos fue.

*(Actualización: el galope y las puertas ya se jugaron y confirmaron, y el
techo ya se construyó — dos veces, porque la primera versión estaba mal. Ver
"EN PRUEBA · Fase 2 paso C (segunda mitad)" más arriba. Y la advertencia de
este párrafo envejeció mal en un punto: el "segundo nivel del mapa" no hizo
falta. El techo salió como una franja física con obstáculos que se mueven,
no como un tilemap nuevo.)*

---

## SEGUNDA VUELTA · El galope, después de jugarlo

*(Santi: "no se siente divertida esa parte del galope". Y preguntó si no
convenía verlo desde arriba en vez de de costado)*

**Tenía razón en las dos cosas, y había una tercera que era la de fondo.**

### Vista cenital, no de perfil

Tres motivos, y el tercero es el que decide:

1. Es **la misma cámara que el asalto**, así que saltar al tren deja de ser un
   corte de escena y pasa a ser la continuación de lo que venías mirando.
2. Se dibuja **el tren de verdad** (`drawTrain`, el mismo del asalto) en vez de
   una silueta inventada: ves los vagones que vas a robar.
3. **La ley ya galopa así.** Un jinete al costado del tren visto desde arriba es
   algo que el juego ya sabía dibujar. Que el jugador galopara distinto era una
   incoherencia que se pagaba dos veces, en arte y en código.

### Pero el problema de fondo era otro

Ni la cámara ni el punto de partida: **no había nada que hacer mientras
galopabas**. Apretabas una tecla y esperabas. Era una barra de progreso
disfrazada de caballo, y cambiarle la cámara la habría dejado igual de vacía
pero más linda. Lo que se agregó:

- **Arrancás detrás del tren** y hay que alcanzarlo (idea de Santi). Da la rampa
  de entrada y ahí sí se lee la velocidad, porque hay una referencia contra la
  que medirse.
- **Un carril con profundidad**: te podés acercar o alejar del tren.
- **Que te vean desde las ventanillas.** Si te descubren, entrás al asalto con
  la alarma ya sonando. **Esto es lo que convierte el galope en una decisión**,
  porque adelantarse pasa a costar cuatro cosas a la vez: reloj, aguante,
  renunciar a los vagones de atrás, y pasar al lado de más gente que puede verte.
- **Piedras y arbustos.** Lo importante no es el choque: es que para esquivar hay
  que moverse, y a veces la única salida es pegarse al tren, que es donde te ven.

**El nudo de la escena, y sale solo de la geometría:** lejos del tren nadie te
ve, pero para saltar hay que arrimarse. Es la misma tensión que ya funciona
adentro del vagón — la posición que te salva de unos te entrega a otros.

### Tres errores que aparecieron midiendo

1. **La exposición no disparaba nunca.** La primera versión pedía línea de visión
   limpia desde cada guardia, como el resto del juego. Pero los guardias
   patrullan por el pasillo y entre el pasillo y la pared de afuera **siempre hay
   una fila de asientos**, así que la línea moría ahí. Se cambió a que **te vea
   el vagón, no un guardia puntual**: si tiene ventanillas y viaja gente, alguien
   te ve pasar, y más rápido cuanta más gente haya. `tieneVentanillas` sale del
   layout, así que un vagón nuevo queda expuesto solo.
2. **La zona segura no existía.** `verDistancia` (74) era mayor que el ancho del
   carril (46), o sea que te veían siempre, estuvieras donde estuvieras. Ahora es
   30: hay zona segura, y para saltar hay que salir de ella.
3. **Los choques te robaban aguante** (8 por piedra), así que cinco choques
   dejaban el tercer enganche inalcanzable y el alcance máximo pasaba a depender
   de dónde hubieran caído las piedras. Un presupuesto que se administra no puede
   ser una lotería: ahora chocar cuesta sólo tiempo.

### Medido después de todo eso

| Dónde salta | Galope | Aguante que le queda | Reloj del asalto |
|---|---|---|---|
| La cola | ~3 s | 100 | 2:47 |
| Enganche 1-2 | 9-13 s | ~65 | ~2:40 |
| Enganche 2-3 | 21-23 s | ~10 | ~2:29 |

Las tres alcanzables, con precios claramente distintos. Y verificado: galopando
pegado al tren a propósito, te ven y entrás al asalto con la alarma sonando y
cinco guardias ya en combate.

---

## EN PRUEBA · Tercera vuelta del galope: que cueste algo

*(Santi: "el galope debería sentirse un poco más desafiante. Si te descubren
mientras galopás que te empiecen a disparar por las ventanas. Y que saltar sea
una habilidad que el jugador deberá perfeccionar y que cambie al comprar otros
caballos")*

Las dos ideas se refuerzan: **si te están disparando, acertar el salto rápido
pasa a importar de verdad.** El galope pasó de tener un solo momento de tensión a
tener tres cosas compitiendo por tu atención — adelantarte, que no te vean, y
clavar el salto — y las tres se estorban a propósito.

### Te disparan por las ventanillas

Que te vieran tenía una consecuencia **sólo diferida**: entrabas al asalto con la
alarma sonando. Se pagaba tarde, cuando ya te habías olvidado de por qué. Ahora
se paga en el acto, y te deja dos salidas jugables claras: alejarte del tren o
acelerar para dejar ese vagón atrás.

**No se puede morir galopando (piso 1 de vida)**, y es deliberado: perder el
asalto antes de haber subido al tren sería el peor castigo posible por el peor
motivo. Pero **la vida que perdés te la llevás adentro**, y empezar con 1 es
durísimo. El castigo es real sin ser terminal.

Medido, galopando 34 s con dos estilos opuestos:

| | ¿Te ven? | Vida al subir |
|---|---|---|
| Pegado al tren, sin esquivar | sí, siempre | **2-3 de 4** |
| Por la zona segura | nunca | 4 de 4 |

### El salto ahora tiene grados

| Grado | Qué pasa |
|---|---|
| **Limpio** (centro del enganche) | Entrás en silencio |
| **Sucio** (dentro, pero descentrado) | Entrás igual, pero **despertás al vagón** |
| **Errado** (fuera) | No subís: trastabillás y el tren te gana |
| **Lejos** (sobre el enganche pero despegado) | No llegás |

**Que el precio sea RUIDO y no daño es lo que lo hace valer.** Un salto sucio no
te lastima: te arruina el sigilo, que es el sistema que de verdad decide cómo te
va a ir adentro. Así perfeccionar el salto sirve aunque nunca te maten.
Verificado: entrando sucio, los 3 guardias del vagón quedan despiertos; entrando
limpio, ninguno.

### Los caballos son un catálogo (`data/horse.js`)

Con uno solo adentro, el **Mostrenco**. Lo que diferencia a un caballo de otro no
es que salte más lejos: es **cuánto te perdona**. `saltoPreciso` es el ancho de
la zona donde el salto sale limpio — un caballo bueno la ensancha.

Esa elección importa: hace que comprar ayude **sin reemplazar a la habilidad**.
El que aprende a clavarla en el centro no necesita comprar nada; el que no,
puede pagar para que le perdonen. Si en cambio un caballo mejor diera más
velocidad o más aguante, compraría directamente la decisión en vez de la
destreza.

Lo que NO depende del caballo (piedras, exposición, reloj de aproximación) quedó
aparte en `APROXIMACION`, para que agregar un caballo sea escribir cinco números
y no copiar veinte que no tienen nada que ver con él.

**Sigue sin saberse si ahora se siente divertido.** Eso no lo contesta ninguna
medición.

---

## EN PRUEBA · Fase 2 paso B — La ley cabalgando a la par del tren

*(construida en versión de prueba: dos jinetes, para ver si el sistema camina)*

**Lo que se hizo:** tiles `W` (ventanilla) y `H` (baranda), que frenan el paso
pero no la vista ni las balas. Dos jinetes que aparecen con la alarma, uno de
cada lado, y te disparan por las ventanillas. Les podés contestar por el mismo
agujero.

**El resultado que importa, medido:** parapetado debajo de la ventanilla, el
jinete deja de verte — y el guardia de adentro te descubre. **La asimetría
funciona.** Es exactamente lo que se buscaba desde la fase 1: que no exista una
posición que te tape de todo.

**Tiran a ciegas** (idea de Santi): no esperan a verte, siguen castigando la
ventanilla donde te vieron meterte. Sin eso, la ventanilla era un problema que
se resolvía una sola vez — te agachabas y desaparecía. Ahora agacharse funciona
pero **cuesta tiempo**, que es el recurso escaso del asalto.

Para que eso no volviera mortal a la cobertura hubo que agregar una regla: las
balas que entran por la ventanilla **pasan por encima del que está agachado
contra la pared**, debajo del marco. Es la misma lógica por la que uno se
agacha bajo el alféizar en la vida real, y es necesaria porque la ventanilla no
frena balas. Sin esa regla, el refugio se convertía en trampa mortal.

**Cómo se los hizo justos**, porque un tirador de afuera preciso volvería el
juego imposible con el arma inicial:
- Solo disparan si estás enmarcado en una ventanilla y NO estás a cubierto.
- Avisan casi un segundo antes, como los guardias.
- Dispersión 0,52 rad — casi el doble que el peor tiro de un guardia. Aciertan
  ~1 de cada 4 estando vos parado en la ventanilla sin hacer nada.
- El vagón blindado no tiene ventanillas: adentro estás a salvo de ellos.

**HECHO · La aparición ya depende de la recompensa** (`data/riders.js`,
`maxJinetesPara`). Decidido con Santi: el techo de jinetes lo fija
`gameState.bounty` de ANTES de subir a este tren (la fama que te precede), no
lo que matás durante el asalto — así no hay que trackear nada nuevo en vivo y
no se castiga dos veces lo mismo (más jinetes ahora Y más recompensa
después). El ritmo (25 s el primero, cada 15 s) queda fijo a propósito, ya
está medido y jugado; sólo escala la cantidad:

| Recompensa al subir | Techo de jinetes |
|---|---|
| 0 | 2 (el piso — un forajido nuevo juega el sistema de siempre) |
| 200+ | 3 |
| 600+ | 4 |

**Bug encontrado y arreglado en el camino.** Entrar con `alarmaInicial: true`
(te vieron desde una ventanilla mientras galopabas) prendía `alarm.active`
pero **nunca arrancaba el reloj de los jinetes** — `riderWatch.arrancar()`
sólo se llamaba dentro del handler de `guardAlerted`, y `alarmaInicial` llama
a `alarm.trigger()` directo, sin pasar por ahí. Con alarma sonando y cero
jinetes, era una forma de que sonara la alarma sin consecuencia de afuera.
Se movió el `arrancar()` a un listener de `'alarm'` (que `alarm.trigger()` ya
emitía y nadie escuchaba) para cubrir los dos caminos con un solo lugar.
Verificado con `bounty` en 0/200/600 y los dos caminos de entrada
(`alarmaInicial` y `guardAlerted` normal): salen 2/3/4 en los dos casos.

**Dos problemas que Santi encontró jugando esta tanda, los dos arreglados:**

1. **Se superponían — de un lado parecía que había uno solo.** La causa real
   no era el spawn: `spawnRider` los ubicaba con un offset al aparecer, pero
   `seguirAlJugador` (lo que los mueve cuadro a cuadro) lo ignoraba por
   completo y los hacía orbitar SIEMPRE la misma franja angosta alrededor de
   `player.x` (±42px), sin memoria de dónde habían arrancado. Dos jinetes del
   mismo lado terminaban ahí adentro, separados sólo por una fase de galope
   que además arranca en un valor random — a veces coincidía y se pisaban.
   **Arreglo:** cada jinete guarda un `slotDx` fijo al nacer (el primero de su
   lado ancla adelante tuyo, el segundo atrás) y `seguirAlJugador` orbita ESE
   punto, no el centro tuyo. Verificado: con 4 jinetes vivos, los dos de cada
   lado quedan separados en todo momento (antes podían coincidir). Los
   números del ancla se probaron en 130/-190 y después se achicaron a 75/-75
   — ver el punto 4 más abajo, salió demasiado ancho a la primera.
2. **Tardaban mucho en sentirse completos.** Antes salían de a uno: el
   primero a los 25s, el segundo recién a los 40 — la mitad de ese tiempo
   sólo tenías un lado cubierto. **Arreglo:** los dos primeros (el piso) salen
   JUNTOS a los 25s. Sólo lo que sobra por encima de 2 (si la recompensa da
   para 3 o 4) sigue llegando de a uno, cada 15s. Con recompensa 900 (techo
   4): tanda de 2 a los 25s, el 3° a los 40s, el 4° a los 55s — antes el 4°
   llegaba a los 70s.

Verificado con el método de siempre (consola + `scenes.update` a mano),
registrando el instante de cada `riderSpawned` y una foto de posiciones cada
5s simulados.

**Y una tercera vuelta, apenas se probó el arreglo de arriba:** Santi jugó y
dijo que ahora quedaban demasiado lejos entre sí Y demasiado lejos de él, al
punto de no apretar — caminaba dos pasos y la distancia seguía agrandándose,
como si el jinete se alejara en vez de perseguir. Dos causas, las dos
arregladas:

3. **La velocidad (62 px/s) era MENOR que la tuya corriendo (78 px/s).** El
   comentario del propio código decía "van y vienen a la par tuyo", pero el
   número no lo cumplía: corriendo sostenido en una dirección, nunca te
   alcanzaban y la distancia crecía sin techo — dejaban de perseguir y pasaban
   a alejarse de verdad. No lo causó el cambio de arriba, sólo dejó de
   notarse: antes, sin ancla, rondaban tan cerca tuyo que la diferencia de
   velocidad no se sentía. **Arreglo:** subió a 92 (`data/riders.js`).
4. **El ancla de arriba (130 / -190, separación 320) se pasó de largo.** Hacía
   que hasta un jinete solo — el caso más común, con recompensa 0 — arrancara
   lejos tuyo por diseño en vez de cerca. **Arreglo:** se achicó a `[75, -75]`
   (separación 150), la cuenta mínima para que la oscilación (±42px cada uno)
   no los haga coincidir, con margen.

Verificado corriendo al jugador sostenido hacia adelante (`input.anyDown`
forzado en `KeyD`) durante 60-90s simulados, con recompensa 900 (los 4
jinetes activos): el gap con el jugador queda ACOTADO (oscila, no crece sin
límite — antes de este arreglo habría seguido creciendo) y la separación
mínima medida entre los dos jinetes de un mismo lado fue ~99px en todo el
run, siempre por encima del ancho de sus cuerpos (~18px), o sea que no llegan
a pisarse.

**Y una CUARTA vuelta, apenas se probó el arreglo de velocidad/ancla:** Santi
jugó y dijo que "parece que caminan porque yo camino" — seguían sin sentirse
una amenaza real, ni inteligentes. Tenía razón, y la causa era de fondo: el
objetivo de un jinete era literalmente "tu posición más un número". Nunca
sabían nada del tren, así que no podían "decidir" nada — sólo reflejaban lo
que vos hacías, un cuadro después.

**Arreglo real: ahora persiguen ventanas de verdad.**
`ventanasDe` (`systems/riders.js`) agrupa todos los tiles `W` y `H` del mapa
en TRAMOS (una ventanilla mide 2 tiles, `WW`; una baranda puede medir un
vagón entero — agrupar evita que dos tiles de la MISMA ventana cuenten como
dos ventanas distintas, que fue el primer bug que salió al probar esto: el
segundo jinete terminaba a 14px del primero). Cada jinete RECLAMA un tramo
(`elegirTramo`) y ningún otro jinete vivo de su mismo lado se lo puede tomar,
con histéresis de 30px para no titubear cerca del punto medio entre dos
tramos. Se queda clavado en su tramo hasta que otro pase a ser claramente
mejor — ya no se mueve porque el jugador se mueve, se mueve cuando decide
reubicarse.

**Segundo bug que salió AL PROBAR ESE ARREGLO:** aunque cada jinete apunta a
un tramo distinto, sus TRAYECTORIAS se pueden cruzar en el camino — uno
viene, el otro va, y coinciden un instante aunque vayan a lugares distintos.
Medido: llegaron a 0,08px de distancia, la misma superposición del principio,
por una causa nueva. **Arreglo:** `separarJinetes`, un empuje mínimo (45px,
`RIDER_SEPARACION_MINIMA` en `data/riders.js`) entre jinetes del mismo lado,
igual de espíritu que `separateEnemies` para los guardias — corre DESPUÉS de
que cada uno se movió hacia su tramo, así que ninguna elección de objetivo
alcanza para evitarlo del todo; hace falta la física.

Verificado con el jugador corriendo sostenido 90s simulados (recompensa 900,
4 jinetes activos): separación mínima entre los dos de un mismo lado pasó de
0,08px a ~35px, y siguen disparando con normalidad (21-25 tiros de contención
o apuntados en esos 90s). También se probó que si el jugador queda parado en
un lugar sin ninguna ventana cerca (el enganche de la cola) los jinetes se
posicionan pero no llegan a tirar — es la geometría funcionando bien, no un
bug: sin línea de tiro, no hay tiro.

**Lo que sigue faltando para darlo por cerrado:** la dispersión (ver más
abajo, "el hallazgo grande") — con eso roto, sentir más presión y más
jinetes encima se nota poco porque casi ninguno pega igual.

**Detalle técnico que hubo que resolver:** los jinetes viven FUERA de la grilla
de tiles. Fuera del mapa seguía siendo "sólido" para todo, así que ni veían ni
podían disparar. Ahora el afuera es sólido para caminar (nadie se cae del tren)
pero transparente para la vista y las balas. No afecta nada de adentro: entre
dos puntos del vagón, la recta que los une nunca se sale del rectángulo.

---

## (original) ACEPTADA · Fase 2 — La ley cabalgando a la par del tren

*(idea de Santi)*

Agentes de la ley que galopan al costado del tren y disparan hacia adentro por
las ventanillas. Aparecen según en qué vagón estés, cuánto tiempo lleva el
asalto y la dificultad del tren.

**Evaluación:** es la mejor idea del lote y no por el motivo obvio. El sistema
de cobertura que acabamos de construir tiene una debilidad estructural: una vez
que el jugador entiende cómo parapetarse, el interior del vagón se vuelve
manejable, y la partida se puede convertir en esperar detrás de un asiento.
Un tirador **desde afuera** rompe eso: la cobertura que te salva de los
guardias te deja expuesto a la ventanilla, y viceversa. Es una amenaza que
obliga a moverse, que es exactamente lo que le falta al tiroteo largo.

Además es el enganche natural del sistema de **recompensa por tu cabeza**:
mientras más cara esté tu cabeza, más jinetes aparecen. Es la primera vez que
ese número va a tocar el gameplay de verdad en lugar de ser un contador.

**Requiere:**
- Un tipo de tile nuevo: **ventanilla** (`W`) — bloquea el paso, **no** bloquea
  la visión, y **las balas la atraviesan**.
- Los jinetes como entidades fuera del vagón, moviéndose en paralelo.
- Reglas de aparición: recompensa + vagón + tiempo transcurrido + dificultad.

**Media pista ya está puesta (paso A):** `tilemap.js` ahora separa las tres
propiedades (`solid`, `blocksSight`, `blocksBullets`) en vez de tener una sola,
y las balas preguntan por `blocksBullets`. Agregar la ventanilla es agregar una
línea a la tabla de tiles. Antes había que tocar el sistema de combate.

**Dónde va a lucir:** en la retirada. Volver seis vagones con la alarma sonando
es hoy el momento más largo del asalto, y es exactamente donde parapetarse
detrás de un asiento puede volverse demasiado cómodo.

---

## EN PRUEBA · Fase 3 — Prisión y captura

*(la nota original era de dos líneas: "si te capturan vas preso; si tenés el
dinero para pagar tu recompensa salís, si no te cuelgan a los días y se
termina esa partida". Diseñado en detalle con Santi y **construido**. Falta
jugarlo.)*

### Lo que ya existe y no hay que tocar

- **El juego nunca te mata en el tren.** Te caen a tiros y te esposan
  (`capturedDead`, *"caíste herido, te esposaron ahí mismo"*) o se acaba el
  reloj y el tren llega a la estación con vos adentro (`capturedTime`). Las
  dos terminan igual, y así se quedan: no hace falta distinguirlas.
- **`bounty` ya sube de verdad** (`applyRaidResult`): por cada guardia y cada
  civil muerto CON la alarma sonando, más `capturaFlat` (300) si te agarran.
  Nunca baja, y hasta ahora no tenía dónde gastarse.

**La consecuencia grande, y es la idea que ordena todo el sistema:** como la
recompensa sólo sube y la horca depende de ella, **`bounty` deja de ser un
contador y pasa a ser una cuenta regresiva.** Eso le da un trabajo real al
bono de trabajo limpio, que hasta ahora sólo pagaba el doble de plata: no
subir la recompensa pasa a ser *cómo se sobrevive*, no un extra.

Y encaja con la frase que el proyecto ya tenía sobre `bounty`: no mide lo que
hiciste, mide **si te identificaron haciéndolo**. Ahora eso se paga.

### Cómo se sale

**La fianza es tu recompensa, y se cobra con lo que tengas.**

```
si bounty >= umbralHorca  → te cuelgan (fin de la partida)
si no                     → pagás lo que puedas:
                              money  -= min(money, bounty)
                              bounty -= min(money, bounty)
                            y salís
```

- **Si te alcanza:** pagás, salís, y la recompensa **vuelve a cero**. Pagaste
  tu deuda; la ley no te busca más.
- **Si no te alcanza:** te sacan todo lo que tenías, la deuda baja por lo que
  pagaste, y **salís con el resto encima**.

**Por qué así y no de otra manera.** Las dos alternativas obvias se rompen
solas: si salir sin pagar te borrara la recompensa, *no pagar sería mejor que
pagar*; y si la recompensa quedara intacta, el que cae pobre entra en una
espiral de la que no sale nunca. Cobrar con lo que haya resuelve las dos —
siempre avanzás algo, y pagar entero sigue siendo claramente mejor.

### La horca, y por qué NO se compra

Por encima de `umbralHorca` te cuelgan **aunque tengas la plata**: sos
demasiado buscado para que te suelten por dinero. Ese es todo el filo del
sistema. Si el dinero siempre te salvara, la recompensa volvería a ser un
precio, y un precio no es una cuenta regresiva.

Así queda repartido: **la plata te salva del castigo chico, y sólo mantener la
recompensa baja te salva del grande.**

Es también el único lugar del juego donde se pierde de verdad. Eso es
deliberado y es coherente con la regla que ya existe en el galope (*"perder el
asalto antes de haber subido al tren sería el peor castigo posible por el peor
motivo"*): el juego no te castiga con la muerte por fallar un salto ni por un
mal tiroteo — te castiga cuando te pasaste de la raya durante varios asaltos y
lo viste venir.

### Lo que te confiscan

**La plata guardada** (va a la fianza o directamente te la quitan), además del
botín del asalto, que ya se pierde hoy. Las armas y el caballo **no** se tocan
por ahora: pegarle a la tienda antes de que la tienda exista es castigar algo
que el jugador todavía no eligió. Queda como palanca para cuando exista.

### La cuenta regresiva TIENE que verse

Es la condición para que esto no se sienta tramposo, y es la misma regla que
obligó a dibujar el aro de las pisadas: *un sistema que no se ve se siente
injusto aunque sea perfectamente justo*. Hace falta que en algún lado diga
**cuánto falta para que no te suelten más**, y el lugar ya existe: la
**oficina del sheriff** del pueblo, que hoy muestra tu cartel de "se busca"
con el monto. Ahí mismo tiene que decir a partir de cuánto no hay fianza que
valga.

### Formato: una pantalla, y por qué

Una pantalla de decisión, como la de resultados. No un lugar caminable —
todavía. El motivo es de orden: **la fuga jugable es la razón por la que
después va a querer ser un lugar**, y construir la celda antes de saber si la
fuga existe es pagar el terreno de un sistema que no está diseñado. La
pantalla no cierra esa puerta: la deja para cuando haga falta.

El ciclo queda: asalto → resultados → **prisión** → campamento. Y si te
cuelgan, asalto → resultados → prisión → **fin de la partida**.

### Los números, y cuál mirar primero

`umbralHorca` **propuesto: 900**, y es EL número a vigilar jugando. La cuenta
que lo justifica, con los pesos actuales (`capturaFlat` 300, `pesoCivil` 110,
`pesoGuardia` 15):

- Un jugador prolijo que se deja agarrar: 300 por captura. Tres capturas y
  estás en el borde.
- Uno que mata civiles: un solo asalto con dos civiles y una captura ya son
  520. A la segunda, la horca.

O sea: **la violencia te mata rápido y el descuido te mata lento**, que es
exactamente el reparto que se busca. Si al jugarlo la horca no llega nunca,
baja; si llega sin que la hayas visto venir, sube — o se hace más ruidoso el
aviso del sheriff.

### Con qué engancha

- **Los mini jefes** (Cazarrecompensas y Sheriff, más abajo): ya aparecen
  según `bounty`. Con la horca, tu recompensa alta te trae cazadores encima Y
  te acerca al patíbulo — el mismo número haciendo dos trabajos.
- **La tienda**: gastar la plata pasa a competir con guardarla para la fianza.
  Ese es un dilema que hoy no existe, y sale gratis.
- **El guardado**: cuando exista, "fin de la partida" va a significar algo más
  que recargar la página.

### Construido — dónde quedó cada cosa

- `CONFIG.prision` (`umbralHorca: 900`, `avisoCerca: 0.6`).
- `resolverPrision()` y `faltaParaLaHorca()` en `state/gameState.js`, al lado
  de `applyRaidResult`. La lógica vive ahí y no en la escena porque es una
  mutación del estado que sobrevive al asalto; la escena sólo la cuenta.
- `scenes/prisonScene.js`: DOM puro, mismo lenguaje visual que la pantalla de
  resultados.
- `resultsScene` bifurca: escapaste → campamento, te agarraron → cárcel. Es la
  única bifurcación del juego que cambia a dónde vas.
- La oficina del sheriff (`scenes/townScene.js`) muestra la cuenta regresiva.

**Verificado, por consola, los siete casos de la fórmula:** pagar entero
(bounty a 0 y te queda el vuelto), pagar justo, pagar a medias (money a 0 y la
deuda baja por lo pagado), caer sin un peso (no paga nada, la deuda queda
intacta), y los tres del umbral. **El caso que importa: con $5000 encima y
recompensa 900, te cuelgan igual** — la horca no se compra, que era todo el
punto. Y el ciclo completo corre sin errores: `camp → mapa → ride → raid →
results → prision → camp`, con la plata y la recompensa moviéndose como
corresponde ($600 → $300, recompensa saldada). La horca resetea la partida
entera (dinero, recompensa y estadísticas a cero) y devuelve al campamento.

**El aviso escala en dos lugares y en tres tonos**, verificado: el sheriff
calla con recompensa 0, informa hasta el 60% del umbral y advierte a partir de
ahí; la nota de la cárcel se enmarca en rojo desde $560. La cuenta regresiva
se ve **antes** de llegar a ella (el pueblo) y en el momento en que seguro
estás mirando (la cárcel).

**Lo que falta:** jugarlo, y sobre todo mirar `umbralHorca`. 900 salió de una
cuenta, no de la experiencia: si la horca no llega nunca, hay que bajarlo; si
llega sin que la hayas visto venir, subirlo o hacer más ruidoso el aviso.

---

## EN PRUEBA · La caja fuerte con contenido desconocido

*(aprobada por Santi; implementada en el paso A, falta el veredicto jugando)*

**El problema:** valía siempre ~$330. Eso no era una decisión, era una cuenta.
El que entendía los números iba siempre.

**Lo que se hizo:** ahora vale entre **$150 y $600** y no sabés cuánto hasta
abrirla. A veces es el asalto de tu vida y a veces te arriesgaste al pedo.
Una apuesta se juega; una cuenta se resuelve.

**El riesgo que hay que vigilar:** frustración. Si sonó la alarma, sobreviviste
de milagro y adentro había $150, tiene que sentirse a mala suerte y no a
tomadura de pelo.

**Cómo se decide:** si seguís yendo siempre a la caja fuerte, hay que ampliar
el rango hacia abajo. Si empezás a dudar, funcionó.

**Ojo con esto al jugar:** el vagón blindado tiene **dos** cajas fuertes, o sea
que puede pagar hasta $1200 él solo. Si el blindado se come el asalto y los
otros cinco vagones dan lo mismo, hay que bajarlo a una caja o angostar el
rango. Es el número más sospechoso de todo el paso A.

---

## ACEPTADA · Fase 3 — Trenes con distinto propósito, no sólo distinta plata

*(idea de Santi. Él mismo propuso dejarla para después, y tiene razón: sin el
mapa de rutas no hay dónde elegir, y elegir es todo el punto)*

No todos los trenes se asaltan por el dinero. Unos pagan mejor, otros llevan
**prisioneros que se pueden liberar**, otros lo que sea que traiga la historia.

**Por qué es una idea fuerte y no sólo contenido:** hoy el único motivo para
subirse a un tren es la plata, así que todos los trenes son el mismo tren con
distinto número. Un tren de prisioneros cambia **qué estás haciendo adentro**: el
objetivo deja de ser "agarrar y correr" y pasa a ser llegar a un lugar concreto y
volver con alguien. Eso reusa todo lo que ya existe (la distancia a la salida, la
alarma, la retirada) y le da un uso nuevo sin construir sistemas nuevos.

Y engancha con dos cosas ya anotadas: es **lo que puede haber adelante que no sea
plata** (una de las palancas del ⚠ que quedaron sin probar), y los liberados son
el camino natural hacia los **compañeros**.

**Requiere primero:** el mapa de rutas (elegir qué tren), y para los prisioneros,
un aliado que te siga — que es código nuevo de verdad, no una entrada de datos.

**Ojo al construirlo:** un rescate donde el prisionero camina solo detrás tuyo es
un acompañante que se traba en los asientos. La versión barata que sí funciona
es que el liberado **corra solo hacia la cola** y sobreviva o no.

---

## EN PRUEBA · Rutas de la región — el mapa

*(idea de Santi, y el estilo también: "un mapa muy de esa época, algo como el
del Red Dead Redemption, donde los railes serían como caminos. Al pasar el
cursor por un raíl verías si hay un tren andando")*

**La nota original** (sigue valiendo entera): hay rutas en tu región y **vos
elegís qué tren tomar**. Eso es lo que va a decidir la **escolta** del tren, y
convierte la dificultad en **una decisión con su recompensa** en vez de una
curva que te empuja. Es también el lugar natural donde después van a colgar las
regiones.

### Lo que se construyó

Un mapa de papel de la época: papel envejecido con manchas de humedad, tinta
marrón, marco doble, rosa de los vientos y un cartucho abajo. **Toda la paleta
es un solo material** — papel e tinta — sin un solo color de interfaz, porque
en cuanto entra un azul de menú el mapa deja de ser un objeto que el forajido
desdobla y pasa a ser una pantalla del juego. El único color que se sale de la
tinta es el rojo del sello, y por eso se ve.

**Tres decisiones que lo sostienen:**

1. **Las vías llevan el travesaño clásico** (la línea con las rayitas
   cruzadas). Es EL símbolo de ferrocarril de cualquier mapa de 1880: se
   reconoce sin que nadie lo explique, y separa una vía de un río o un camino
   de un vistazo. Una línea pelada sería un camino.

2. **"¿Hay un tren andando?" no lo contesta un cartel: lo contesta un tren.**
   Cada ruta con servicio tiene un puntito con humo que **avanza de verdad**
   por la línea y rebota en las puntas. El mapa está vivo aunque no lo toques,
   y la pregunta de Santi se contesta mirando, no leyendo.

3. **Hay un ramal muerto** (el RAMAL SUR, sin servicio, en tinta clara y con
   el travesaño más espaciado). Si todas las líneas tuvieran tren, el mapa
   sería una lista de botones dibujada bonita. Que uno esté muerto es lo que
   convierte mirarlo en **leerlo**.

**Es la primera pantalla del juego que se maneja con el mouse**, y tiene
sentido que sea ésta: en todo el resto sos un tipo que camina, acá sos un tipo
mirando un papel. Recorrer una vía con el cursor es el gesto de recorrerla con
el dedo. Clic izquierdo en una vía con tren = salís; Escape o clic derecho
(doblar el mapa) = volvés al campamento, y aparecés **junto al cartel**, que es
de donde saliste.

**El cartucho de abajo es el único texto del mapa**, y va FIJO, no siguiendo al
cursor: un cartel que persigue al mouse tapa justo lo que querés mirar.

### La costura para cuando los trenes se distingan

Pedido de Santi: *"por ahora todos los trenes serán iguales al original.
Prefiero pulir el mapa y luego pasar al estilo de los trenes."*

Por eso cada ruta en `data/region.js` ya tiene `composicion` y `dificultad`
**en null**, y el mapa se los pasa al galope igual. En null, el galope sortea
como siempre. **El día que una ruta lleve un tren distinto se llena
`data/region.js` y no se toca una línea de código** — es la misma costura que
ya se pagó sola cuando el galope reemplazó a la pantalla de abordaje sin que el
asalto se enterara.

Lo único que hubo que tocar del galope fue que `enter` acepte parámetros; ya
recibía `composicion` desde el asalto, así que fue una línea.

**Verificado, por consola:** las cuatro vías se detectan con el cursor encima y
el papel vacío no detecta nada; los tres trenes avanzan cada uno a su velocidad
y en su sentido, rebotan en las puntas y **en 60 segundos simulados nunca se
salieron del rango de la vía** (0 fallos); el clic sobre el ramal muerto no
hace nada y sobre una vía con tren sale al galope; Escape devuelve al
campamento junto al cartel. El **ciclo entero** corre sin errores con el mapa
metido en el medio: `camp → mapa → ride → raid → results → camp`, caminando de
verdad hasta el cartel con las teclas. 3 segundos dibujando el mapa con los
trenes moviéndose y una vía resaltada, sin un solo error.

### SEGUNDA VUELTA · Más rutas, cruces y túneles

*(Santi: "yo añadiría más rutas y que se crucen entre sí. Agregarle raíles que
pasen por montañas desérticas y túneles")*

De 4 rutas a **6**, y de cero cruces a **tres cruces reales**:

| Ruta | Tramo | Servicio |
|---|---|---|
| Línea del Norte | Piedra Roja — Álamo Seco | con tren, **túnel** |
| Vía del Desierto | Piedra Roja — Fuerte Bravo | con tren |
| Ramal del Río | Álamo Seco — Fuerte Bravo | con tren |
| Ramal de la Mina | Mina La Viuda — Paso del Oro | con tren, **túnel** |
| Vía de la Sierra | San Cristóbal — Álamo Seco | con tren, **túnel** |
| Ramal del Puesto | Paso del Oro — Puesto Seco | **sin servicio** |

**Los túneles se dibujan como corresponde:** la vía se corta, sigue punteada y
en tinta clara por debajo del cerro, y en cada extremo hay una **boca** (un
corchete cruzado sobre el riel). Sin la boca, un túnel parece una vía mal
dibujada; con ella se lee "acá se mete adentro del cerro" sin una palabra.

**Y las tres sierras están puestas DONDE PASAN LOS TÚNELES, no al revés.** Un
túnel en el llano se lee como un error de imprenta: lo que lo explica es la
montaña encima. Quedaron atados por la vista aunque el código no lo obligue —
si se mueve un túnel hay que mover su sierra. Verificado midiendo: los tres
puntos medios de túnel caen bajo su cordillera (147,36 · 117,64 · 237,90).

**Un error que apareció midiendo, y que a ojo no se habría visto:** los dos
primeros "cruces" caían **exactamente encima de Paso del Oro**, o sea que no
eran cruces sino el empalme del pueblo. La Vía de la Sierra le pasaba por
arriba sin parar ahí. Se corrió 20 px al este y ahora cruza la Vía del
Desierto en campo abierto (211,108), que es donde un cruce se ve como cruce.

**Aparecieron dos tipos de lugar nuevos, y no es decoración:** una **mina**
(dos picos cruzados) y un **puesto** (cuadradito hueco). Explican sin una
palabra por qué hay ramales que no unen dos ciudades — en 1880 el ferrocarril
iba a buscar mineral tanto como gente.

**Detalle de dibujo que hizo falta con seis líneas:** la vía señalada se dibuja
ÚLTIMA, encima de las demás. Con cruces, si se dibujara en su orden, en un
cruce no se sabría cuál de las dos estás mirando.

---

## HECHA · Que el texto se lea

*(Santi: "haz que todo lo escrito que hay en el juego, lo hagas más legible".
Y después la aclaración que importa: **"me refería a cambiar a una tipografía
más legible, no al tamaño"**)*

**Dos cambios, ningún tamaño tocado.**

1. **Courier New → Verdana**, en el canvas (`engine/renderer.js`) y en la
   interfaz HTML (`styles/main.css`). Courier es una tipografía de máquina de
   escribir: sus trazos son de un píxel y a 8px se deshacen. Verdana está
   diseñada para tamaños chicos —letras anchas, aberturas grandes— y aguanta.

2. **La sombra pasó a ser un halo de ocho direcciones.** Antes había una
   sombrita 1px abajo a la derecha, que servía sobre fondos oscuros y no servía
   sobre los claros. Ahora el texto se despega de cualquier fondo. Y el color
   del halo se puede pasar: **en el mapa va del color del PAPEL, no negro**,
   que es como se rotula en cartografía de verdad (la etiqueta recorta el
   fondo) — un contorno negro sobre papel sepia habría roto la paleta entera.

**El dato que resolvió la duda del tamaño.** La primera versión subía a 9px
por miedo a que Verdana no alcanzara. Midiendo a 8px contra las frases más
largas del juego, resultó al revés: **Verdana sale MÁS ANGOSTA que Courier**
(el cartel de teclas del galope pasó de 298 a 282 px; el texto más largo del
pueblo, de 331 a 276). Una monoespaciada gasta el mismo ancho en una "i" que
en una "m", y ahí pierde. O sea que se lee mejor Y ocupa menos: no había nada
que compensar con el tamaño.

**Y algo que apareció midiendo:** los dos textos más largos del juego no los
dibujaba nadie. Eran de la pantalla de abordaje que reemplazó el galope hace
tiempo — veinte frases muertas en `text/es.js` de las que se usaba una sola
(`boarding.escort`). Se borró el resto.

---

**Lo que falta:** verlo. Como toda esta tanda, el panel del navegador no
compuso frames, así que si el mapa se ve como un mapa de la época o como
líneas sobre un fondo beige es lo único que no puedo contestar.

---

## Pendientes del concepto original (sin fase asignada todavía)

Campamento, historia principal, fama, recompensa, honor, compañeros y sus
relaciones, caballos, regiones, carreras, duelos, retos, tiendas, guardado.

Están en el plan grande. No se tocan hasta que el asalto completo (fase 2)
funcione.
