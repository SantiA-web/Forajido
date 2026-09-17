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

## ✅ HECHA · Las tres armas cuerpo a cuerpo: culata, cuchillo y hacha

*(idea de Santi: "podés golpear cuerpo a cuerpo con tu arma, pero los dejás
inconscientes, no muertos ni le sacás una vida. Pegar con el arma tiene que ser
muy rápido, pero no mortal. Luego podrías comprar el cuchillo: un poco más lento
que pegar con la culata, pero ya sacaría una vida. Y luego el hacha:
extremadamente lenta, pero elimina tres vidas")*

### Las dos situaciones NO cambiaron, y ése es todo el truco

El cuerpo a cuerpo ya tenía dos casos (por la espalda a alguien que no te vio =
ejecución silenciosa; de frente = forcejeo escandaloso). El arma **no agrega un
caso nuevo**: sólo decide qué tan fuerte, qué tan rápido y si el golpe por la
espalda mata o noquea.

| | Por la espalda | De frente | Cadencia |
|---|---|---|---|
| **Culata** (gratis) | **inconsciente 25 s** | 0 daño, sólo aturde | **0,30 s** |
| **Cuchillo** ($120) | muerto, silencioso | −1 vida | 0,55 s |
| **Hacha** ($300) | muerto, silencioso | **−3: mata de un golpe** | **1,50 s** |

Los números del cuchillo son **los que ya estaban** en CONFIG.melee (daño 1,
cooldown 0,50→0,55), a propósito: el arma ya jugada y afinada queda igual y lo
nuevo se construye alrededor. Y el 3 del hacha no es arbitrario — los guardias
tienen 2 o 3 de vida, así que es el número exacto que **resuelve un encuentro de
frente sin disparar**, que es algo que ninguna otra arma del juego hace.

### La decisión que hacía o rompía todo: qué es un inconsciente

Si un noqueado no despierta y no delata, la culata (gratis y la más rápida)
sería **mejor** que el cuchillo que hay que pagar, y la tienda no tendría nada
que vender. Se le plantearon tres opciones a Santi y eligió la que sostiene la
economía:

> **Se despierta a los 25 s, y tirado delata igual que un cadáver.**

Y esa frase se convirtió en tres reglas verificadas:

- **Delata:** `findVisibleBody` ahora acepta a los inconscientes. De lejos nadie
  distingue a un muerto de alguien que respira tirado. Medido: el compañero que
  lo encuentra pasa a `combat` y queda `spooked`.
- **Se despierta:** a los ~23 s medidos, con la vida intacta y marcado `spooked`
  para el resto del asalto — o sea que ya nunca vuelve a bajar la guardia. Un
  tipo al que le partieron la cabeza no retoma su ronda silbando.
- **No hace nada mientras duerme:** el chequeo va antes que todo en
  `updateEnemy`, incluso antes del stagger y de huir de la dinamita. Un desmayado
  no huye de una mecha.

**Comprar el filo no es comprar poder: es comprar que el problema no vuelva.** Es
la misma economía que ya tenía la armería de fuego, donde la tienda "no te vende
poder, te vende permiso para hacer ruido".

### 🐛 Y una barra de la tienda que mentía

La tercera barra decía **SILENCIO**, llena para la culata y vacía para las otras
dos. Era falso: **las tres son silenciosas por la espalda**, usan el mismo
`quietNoise`. Lo que la culata tiene de único es que no mata.

Se renombró a **PIEDAD**, y no es una virtud decorativa: medido, un guardia
degollado con la alarma sonando suma **15 de recompensa** (`bounty.pesoGuardia`)
y uno noqueado suma **cero**. La barra llena de la culata es plata que no vas a
pagar en la horca — y de paso deja la puerta abierta a que no matar mueva
`gameState.honor`, que existe desde la fase 1 y todavía nada toca.

### Lo que costó agregarlo, que es el punto

`data/tienda.js` prometía que agregar un rubro debía ser *"escribir una entrada
acá y nada más"*, y casi se cumplió: una entrada en el catálogo, un renglón en
el diálogo del armero y su texto. **La escena de tienda no se tocó** — sigue sin
saber si muestra un revólver, un caballo o un hacha.

La única excepción fue el dibujo, y por una razón legítima: `dibujarArma` puede
dibujar todo el catálogo de fuego con las mismas piezas porque *el Smith ES un
Colt con otras proporciones*. Una culata, un cuchillo y un hacha son tres objetos
distintos — con el molde del revólver habría salido un hacha con tambor y
guardamonte. Por eso `mercaderia: 'filo'` elige otro dibujo, separado de
`escenario`, que sigue siendo el mismo mostrador.

### TENER vs. LLEVAR PUESTO — el campamento pasó a ser donde te equipás

*(pedido de Santi: "desde el cajón de armas del campamento el jugador deberá
equiparse como quiera. Y en el poste con el caballo, el caballo que quiera. El
jugador no debería ir hasta el pueblo para equipar lo que quiere")*

Hasta acá **comprar ERA equipar** y no existía la diferencia — el propio
comentario de `shopScene.js` lo decía: *"hoy no hay inventario de 'tengo dos y
uso uno'"*. Comprar el Smith te dejaba sin el Colt, y volver a él costaba
caminar hasta el pueblo, esperar a que fuera de día y **pagarlo de nuevo**.

Ahora hay `gameState.owned` con tres listas (arma, acero, caballo):

> **La tienda decide qué TENÉS. El campamento, qué LLEVÁS hoy** — gratis y a
> cualquier hora.

- El **cajón** abre un menú con todas tus armas de fuego y aceros, en una sola
  lista. Un cajón es un cajón: revolvés y sacás. No hacía falta explicar que son
  dos categorías.
- El **poste** abre el suyo con los caballos — y **"darle de comer" va primero**,
  porque era lo único que hacía el poste con `[E]` y cambiarlo por un menú de
  inventario habría reemplazado un gesto de cuidar al animal por uno de
  administrar objetos. Lo normal sigue siendo lo más fácil.
- **El menú se refresca sin cerrarse:** cambiás de revólver, la marca se mueve y
  seguís eligiendo. Es la diferencia entre revolver un cajón y navegar un menú.

**El menú salió de `interiorScene` a `engine/menu.js`.** Era el diálogo del
armero, ya jugado y probado, y ahora lo comparten los dos — el interior quedó
con lo suyo (la pregunta del vendedor y qué significa cada respuesta) y el
cuadro es de todos. No sabe qué significan las opciones: recibe `{id, texto}` y
devuelve cuál elegiste, así que el mismo menú sirve para comprar un caballo,
cambiar de revólver o darle de comer al animal. **Le va a servir a la cantina el
día que exista.**

### La culata salió del mostrador

*(pedido de Santi: "me gustaría que la culata del arma no esté en la tienda")*

**No es un objeto que se compre: es no tener nada.** Ponerla en la vidriera con
un cartel de $0 sería vender el hecho de tener manos. Rompe a propósito la regla
de "siempre está el tuyo en la lista para comparar" —esa regla existe para que
la pregunta sea *"¿es mejor que el que tengo?"*, y acá la contesta el precio.

Sigue estando en el catálogo y en el cajón del campamento: **volver a ella es
gratis**, que es exactamente lo que tiene que ser cuando la ventaja de no matar
(menos recompensa) puede convenirte más que el filo.

### Los precios, y el hacha guardada

*(decisión de Santi: "el hacha todavía no la pongas en la tienda. Quiero que se
desbloquee en la región bosque. Al Mustang ponle un precio de 1200 y al Revólver
Smith de 600. Y al cuchillo un precio de 450")*

| | Antes | Ahora |
|---|---|---|
| Cuchillo | — | **450** |
| Revólver Smith | 250 | **600** |
| Mustang | 400 | **1200** |
| Hacha | — | **900, y NO se vende** |

El salto es grande y va en una dirección clara: con un tren promedio dando
~$1200 a tren limpio, el Mustang pasó de "una buena corrida" a **varios
asaltos**. La tienda dejó de ser algo que se agota en la primera visita.

**El hacha está entera y apagada**, con el mismo patrón que "Alta vigilancia"
(`peso: 0` en data/train.js): no se amputó, se guardó. Lleva
`desbloqueo: 'bosque'`, y `shopScene` filtra el mostrador contra
`gameState.flags`. Poniendo `gameState.flags.bosque = true` desde la consola
aparece y funciona — verificado en los dos sentidos.

Y el campo no es del hacha, es **del sistema de tiendas**: cualquier ítem de
cualquier catálogo puede llevarlo. El día que haya un caballo o un revólver
atado a una región, es agregar el campo y nada más.

> ⚠️ **Los 900 del hacha son una estimación mía, no de Santi** — él la dejó
> afuera a propósito. Salen de ordenarla contra la escala nueva: tiene que
> costar más que el cuchillo (450), porque hace todo lo que hace el cuchillo Y
> resuelve un encuentro de frente. Con los 300 que tenía, **el arma fuerte salía
> más barata que la débil**. Hay que confirmarlo cuando exista el bosque.

### Verificado

- **Las seis combinaciones** (tres armas × espalda/frente) dan exactamente lo
  pedido, incluido que el hacha mate de un golpe de frente a un guardia de 2.
- **El mostrador del acero muestra dos** sin la llave del bosque y **tres** con
  ella; las otras dos tiendas no se enteraron.
- **Comprar en las tres tiendas** cobra el precio correcto y equipa en su propia
  ranura sin pisar a las otras (arma de fuego, acero y caballo son tres
  preguntas separadas).
- **El circuito entero, de punta a punta:** comprar el Smith y el cuchillo deja
  el Colt guardado; volver al Colt desde el cajón del campamento funciona sin
  pisar el acero; el poste da de comer sin cambiar de caballo y cambia de
  caballo cuando se lo pide; y el asalto arranca con lo que quedó equipado.
- **Sin regresiones:** campamento, pueblo, los tres interiores y las tres
  tiendas renderizan, y el diálogo del armero —que ahora corre sobre el módulo
  compartido— sigue abriendo y dibujándose igual.
- Rematar con filo a alguien noqueado funciona: un inconsciente cuenta como "no
  te vio", así que se puede convertir un noqueo en algo definitivo.
- Las **tres tiendas** (armería, establo, acero) renderizan; comprar equipa.
- **Tres asaltos completos**, uno por arma, sin errores de JS.

> 🔍 El arnés volvió a mentir una vez: los primeros seis golpes no conectaban
> ninguno. No era el código — `updatePlayer` recalcula `p.aim` desde el mouse en
> cada cuadro y pisaba el ángulo que yo le ponía a mano. Para probar el cuerpo a
> cuerpo hay que mover el MOUSE, no `p.aim`.

---

## ✅ HECHA · Caminar de costado o de espaldas, respecto a tu propia mira, es más lento

*(idea de Santi: "si el personaje está tocando la D y el arma apunta hacia
enfrente, avanza normalmente. Pero si estuviera tocando la D y mirando hacia
abajo con el puntero, estaría caminando de costado, y ahí es donde se debería
penalizar la velocidad")*

Hasta acá caminar rendía igual para cualquier lado: de frente, de costado o de
espaldas a tu propia mira, mismos px/s. Con mouse+WASD eso permite correr en una
dirección mientras apuntás para otra sin pagar nada — cómodo, pero le saca
sentido a la idea de "encarar" algo.

### Cómo se mide, sin inventar geometría nueva

`moveDirX/Y` (entities/player.js) ya es un vector UNITARIO hacia dónde caminás
— existe desde antes, para que la IA de los guardias detecte si "venís hacia
él" (`CONFIG.enemy.panicoCoseno`). Y `(cos(p.aim), sin(p.aim))` es el vector
unitario hacia dónde apuntás. **El producto punto de dos vectores unitarios YA
ES el coseno del ángulo entre los dos** — sin `atan2`, sin comparar ángulos:
1 de frente, 0 de costado, −1 de espaldas.

Dos tramos, no una curva sola: de frente (1) a costado (0) interpola hacia
`direccionCostado`, y de costado (0) a espaldas (−1) interpola hacia
`direccionAtras`. Con una sola interpolación de −1 a 1, el de costado saldría
forzado al promedio de los otros dos y no se podría afinar por separado.

### Los números — uno inventado, uno reusado

| | Valor | De dónde sale |
|---|---|---|
| `direccionCostado` | 0,70 | Calculado contra `enemy.aimTime` (0,30s, la ventana de reacción antes de que un guardia dispare): de frente cubrís 23px en esa ventana, de costado bajás a 16px |
| `direccionAtras` | 0,50 | **No es un número nuevo**: reusa el precio que el juego ya cobra en TRES lugares (`sneakSpeed`, `mira.velocidad`, `coverSpeed`, los tres 40 px/s = 51% de `speed`). En la misma ventana de reacción, retroceder cubre apenas 12px — casi no alcanza para salir del marco de una ventana |

Elegidas de tres opciones (leve/moderada/fuerte) presentadas con esta misma
métrica; Santi eligió la moderada.

### 🐛 Un bug real, mío, de sintaxis — y por qué no se vio hasta la verificación

Al insertar el bloque nuevo en `CONFIG.player` (data/config.js) se comió sin
querer el `},` que cerraba ese objeto: el bloque `mira` quedó anidado DENTRO de
`player` en vez de al lado. El archivo cargaba igual en el editor —es JS
válido línea por línea— pero `import()` tiraba `Unexpected token ';'` al
juntar todo. Se encontró enseguida porque **el primer paso de verificación es
siempre cargar el módulo antes de jugar con él**, no asumir que compiló.

### 🔍 Dos veces el arnés de prueba mintió al medir esto, y las dos son la misma familia de error

1. **Fijé el mouse en coordenadas de PANTALLA en vez de MUNDO.** La cámara
   sigue al jugador, así que a mitad de la prueba de 500ms el punto al que
   apuntabas ya no era el mismo respecto al jugador — el ángulo se corría solo
   mientras medía. Con el mouse resincronizado a la posición-mundo en cada
   cuadro, los 8 casos (frente/costado/atrás en las cuatro teclas) dieron
   EXACTO lo esperado: 78,0 / 54,6 / 39,0, coseno 1 / 0 / −1.
2. **Un "costado" mal etiquetado en mi propia prueba.** Medí una diagonal (D+S)
   con la mira apuntando puro horizontal y esperaba 54,6 (costado); dio 71,15
   y por un segundo pareció un bug. No lo era: ese caso tiene coseno 0,71 (no
   0) — el movimiento diagonal y la mira horizontal no son perpendiculares
   entre sí. Recalculado, 78×(0,70 + 0,30×0,71) = 71,15, exacto. La prueba
   estaba mal armada, no la fórmula.

**Verificado, con el mouse arreglado:**

- Los cuatro casos cardinales (D/A/W/S) en frente, costado y espaldas: exactos.
- Diagonal (D+S) con la mira exactamente perpendicular al movimiento
  (coseno real = 0, no aproximado): 54,6 — igual que el costado cardinal.
- Diagonal con coseno intermedio (0,71): 71,15 — la interpolación lineal se
  cumple en un punto que no es ninguno de los tres casos de referencia.
- Cuatro corridas completas (los tres tipos de tren, dos dificultades): sin
  errores de JS, sin NaN en la posición.

---

## ✅ HECHA · El galope dejó de ser un pasillo: zoom dinámico, desierto y diagonales

*(Santi, después de ver a su hermano jugarlo por primera vez: "se siente muy
aburrida la parte del galope previo al salto al tren". Y el pedido concreto:
"primero que se haga menos zoom, que se vea mucho más el paisaje. Y el caballo
no debería empezar ahí pegado al tren, debería empezar desde una esquina mucho
más atrás, galopar esquivando cactus, rocas y pequeños montículos de arena.
Cuando galopa llegando al tren, no tiene que ser algo recto, el jugador debería
poder moverse en diagonal libremente hacia el tren")*

### El diagnóstico: no faltaba contenido, faltaba PANTALLA

Medido antes de tocar nada, y explica las cuatro quejas de una sola vez:

```
pantalla:  216 px de alto
tren:      160 px  ← el 74%
sobra:      56 px  → de ahí salían los 38 px de carril (de 8 a 46)
```

**En 38 px de alto no entra un desierto, no entra una diagonal y no entran
obstáculos que valga la pena esquivar.** Apretabas W o S y en medio segundo
estabas contra el tope: por eso se sentía sobre rieles. No era un problema de
duración — alargar la persecución sin abrir antes el espacio habría hecho el
problema más largo, no menor.

### El zoom dinámico, que fue idea de Santi y es mejor que lo que se le ofreció

Se le presentaron tres zooms FIJOS (0,5 / 0,7 / 0,8) y contestó: *"yo haría que
el tren pase a ser 80px, pero a medida que el caballo se acerca se va haciendo
más zoom"*.

**Eso resuelve la única objeción que tenía el 0,5 fijo.** A esa escala se ve
muchísimo paisaje, pero las ventanillas, los enganches y la marca verde del
salto quedan diminutos — y de esas tres cosas depende clavar el salto. Atado a
la distancia, el tren chico existe SÓLO mientras galopás lejos, que es
exactamente cuando no necesitás ese detalle.

Y hace algo que ningún zoom fijo podía: **la escena se cierra sola sobre el
tren a medida que lo alcanzás**, así que el propio encuadre cuenta que te estás
acercando, sin una línea de texto. Medido a lo largo de la persecución:

| Falta para la cola | Zoom | El tren mide |
|---|---|---|
| 1000 px (largada) | 0,50 | 80 px |
| 564 px | 0,59 | 95 px |
| 330 px | 0,81 | 129 px |
| 51 px | 0,99 | 159 px |

La curva es un smoothstep, no una recta: un cambio de escala con bordes duros
se lee como un tirón de cámara. Y llega a escala 1 con 220 px todavía por
recorrer, para que **la transición termine antes de que empiece a importar el
detalle** — un zoom moviéndose mientras apuntás un salto sería peor que
cualquier zoom fijo.

### Lo demás

| | Antes | Ahora |
|---|---|---|
| Campo (`carrilLejos`) | 46 (38 px útiles) | **150** — cabe una diagonal de verdad |
| Arranque | 620 px atrás, en el medio del carril | **1000 px atrás, en la esquina del fondo** |
| Reloj | 40 s | **55 s** |
| Obstáculos | 2 tipos, cada 130 px, sólo en la franja | **4 tipos** (+ cactus, + montículo), cada 85 px, **en todo el campo** |

`carrilCerca` (8) NO se tocó, y es lo que conserva el nudo de la escena: de él
cuelgan `saltoDistancia` y `verDistancia`, o sea *"para saltar hay que
arrimarse, y arrimarse es donde te ven"*. Lo que se agrandó es el desierto, no
la zona de peligro.

**Y la cámara ahora también sigue en vertical**, porque 150 px de campo no
entran en pantalla con el zoom cerca. Su tope de arriba es 0: el tren puede
quedar cortado por arriba, y está bien — de un tren, en esta escena, lo que
importa es su BORDE DE ABAJO, que es donde están los enganches, las ventanillas
y la marca del salto.

### El balance no se movió, y era la condición para todo lo demás

`tiempoAproximacion` subió 40 → 55 en la misma proporción que la persecución
(11,4 s → 18,3 s hasta la cola), justo para que **lo que te queda DESPUÉS de
tocar la cola no cambie** — que es donde vive la decisión de hasta qué enganche
adelantarte. Verificado con los dos caballos:

| Caballo | Enganche | Reloj al llegar | Aguante |
|---|---|---|---|
| Criollo | **3º (su máximo)** | 8,3 s | 10 |
| Criollo | 1º | 34,5 s | 160 |
| Mustang | **2º (su máximo)** | 36,4 s | 20 |

Idéntico a lo documentado desde la fase 2: el Criollo llega al 3º y el Mustang
al 2º y no más. Si no se hubiera subido el reloj, alargar la persecución habría
sido en los hechos recortar el alcance del Criollo — el mismo error que este
número ya se comió y corrigió dos veces.

### SEXTA VUELTA · El desierto tiene hora

*(Santi: "poné el suelo color arena (como el del campamento) y cuando es de
noche estará oscuro y si es de día estará como el color arena del campamento")*

El galope se dibujaba sobre `outside` (#0d0b0c, casi negro) a cualquier hora.
Ahora usa dos colores según `gameState.esDeDia`, y el de día **no es un color
nuevo**: es exactamente `campDesiertoDia`, el mismo ocre que rodea al
campamento. Reusarlo en vez de inventar otro es lo que hace que las dos escenas
se lean como el mismo mundo — el campamento y el galope pasan en el mismo
desierto, así que tienen que tener el mismo suelo.

**Son dos colores y no uno con un velo encima**, por el mismo motivo por el que
el campamento ya tenía dos paletas propias: la noche del desierto no es "la
arena, pero más oscura". Es tierra sin luz, con otro tono.

`outside` queda vivo porque es el color del VACÍO —lo que se ve por los
enganches del tren— y eso no es suelo ni cambia con la hora.

> Esto rompe, sólo para el galope, la nota del README que decía *"el galope y el
> asalto no cambian con la hora"*. El asalto sigue igual: adentro de un vagón la
> hora no se ve.

#### 🐛 Y el montículo desapareció

Sus tonos eran casi los del suelo nuevo (#8a7350 contra #8a6f47), así que sobre
la arena de día quedaba **un obstáculo que te frena y no se ve** — lo único que
este juego no se permite. Sólo se descubrió mirando la fila de los cuatro tipos
ampliada con foto.ps1; ninguna medición lo iba a mostrar.

Se arregló con RELIEVE en vez de con un color: falda en sombra abajo, cresta
iluminada arriba. Así no depende de contrastar contra un fondo en particular —
la sombra es más oscura que la arena y más clara que la noche, y la cresta al
revés — y no hizo falta una versión por hora.

### QUINTA VUELTA · Los obstáculos dejaron de ser todos iguales

*(Santi: "haría que los obstáculos sean un poquito más peligrosos. Deberían ser
más grandes, pero no tanto. Y no todos por igual")*

🐛 **Los cuatro chocaban con el mismo radio 7**, aunque se dibujan muy distintos:
un montículo bajo de 14 px de ancho y un cactus de tronco flaco te frenaban
exactamente igual. Eso contradecía una regla que el proyecto tiene escrita desde
que se afinó la hitbox de los guardias —*"la caja que ves siempre es la caja que
te puede matar"*— y hacía que el desierto se sintiera parejo: daba lo mismo qué
esquivaras.

Los cuatro radios salen de la SILUETA, no de un ajuste al azar, y cada dibujo
creció hasta el suyo. Medido sobre **el mismo conjunto de obstáculos** evaluado
con las dos configuraciones (para que no lo ensucie la generación aleatoria):

| | Radio | Probabilidad de chocarlo |
|---|---|---|
| **Roca** — lo único sólido de verdad | 10 | 8,3% → **10,1%** |
| **Arbusto** — ancho y enredoso | 9 | 8,0% → **9,4%** |
| **Cactus** — alto pero de tronco angosto | 8 | 8,2% → **8,8%** |
| **Montículo** — arena, el más perdonador | 6 | 8,1% → **7,5%** |
| **Global** | | 8,17% → **8,94% (+9%)** |

Que el montículo BAJE es parte del diseño: si todo es peligroso, elegir por
dónde pasar no es una decisión. Ahora hay una línea barata y una cara.

#### 🔍 Y estuve a punto de ajustar un número calibrado contra puro ruido

Después del cambio, una corrida del caso límite —el Criollo llegando al 3er
enganche— dio **5 de 6 con 5,0 s de margen**, contra los 8,1 s de antes. Parecía
una regresión clara contra el estándar escrito de ese caso (*"margen 5-8 s,
consistente en 6 de 6"*), así que se subió `tiempoAproximacion` de 45 a 48 para
compensar.

**Y el resultado empeoró: 4 de 6.** Con más reloj no puede ir peor — o sea que
la señal era ruido.

Medido en serio (10 corridas por serie, misma política de piloto, mismo reloj,
cambiando SÓLO los radios) el efecto real es de **+0,2 choques por corrida**, y
el margen no se mueve de forma distinguible: 5,5 s con los radios viejos contra
6,2 s con los nuevos, o sea al revés de lo que "mostraba" la muestra chica. El
reloj volvió a 45.

> **La lección:** el caso límite del Criollo es marginal POR DISEÑO, así que su
> tasa de éxito es la métrica más ruidosa del juego — justo la peor para
> detectar regresiones. Seis corridas no alcanzan para distinguir una regresión
> de la varianza, y "compensar" contra eso habría metido un número inventado en
> un archivo donde todos los demás están medidos.

### 🐛 CUARTA VUELTA · El tren no se movía, y el caballo no miraba a dónde iba

*(Santi: "el tren literalmente parece no moverse. Es un problema gravísimo,
porque si yo me quedo quieto o me demoro en esquivar los obstáculos, el tren
debería irse". Y sobre la diagonal: "cuando dije que el caballo debería poder
moverse en diagonal es que quiero que su cabeza apunte a esa diagonal. El
jugador no controla el caballo, controla al jinete que tira de las riendas, y
eso se debería notar en la jugabilidad")*

#### El tren quieto: dos causas independientes, más una tercera escondida

Medido sin tocar una sola tecla: el caballo se acercaba **solo, a 55 px/s**.

1. **Mecánica.** `alcanceSpeed` daba una velocidad relativa positiva por estar
   detrás de la cola. Era imposible quedarse atrás: no era una persecución, era
   una cinta transportadora.
2. **Visual.** Los obstáculos vivían en el MISMO marco que el tren, así que el
   tren estaba clavado respecto de los cactus — se veía **estacionado en el
   desierto** aunque el parallax de fondo scrolleara.
3. **Y una tercera, que sólo apareció al arreglar las otras dos:** un tope de
   `minX` que decía "no te podés quedar más atrás de donde arrancaste". En el
   modelo viejo casi nadie lo tocaba; en el nuevo, el jugador arranca
   EXACTAMENTE ahí, así que impedía atrasarse un solo píxel. Medido después de
   poner las velocidades absolutas: el Criollo debía perder 19 px/s y perdía 0.
   **Un arreglo puede quedar tapado por una regla vieja que nadie volvió a
   mirar.**

#### El modelo de velocidades absolutas — lo corrigió Santi

Se le ofreció un modelo peor ("¿qué tan rápido se te va el tren si soltás?") y
lo rechazó: *"no funcionaría así. El tren se mueve a una cierta velocidad, los
caballos a otra. Dependiendo la velocidad del caballo es cuánto se puede dar el
lujo de pegarse o esquivar obstáculos"*.

Antes `sprintSpeed` era la velocidad RELATIVA al tren, con el tren tratado como
si estuviera quieto. Ahora cada caballo tiene su velocidad real y **lo que
decide todo es la resta** contra `trenVelocidad` (90):

| | Galopando | Al trote (sin apretar nada) |
|---|---|---|
| **Criollo** (142) | +52 · gana terreno | **71 → el tren le saca 25 px/s** |
| **Mustang** (180) | +90 · gana el doble | **90 → le sigue el paso exacto** |

Y ahí está la idea de Santi, verificada: en 8 segundos sin tocar nada el Criollo
pierde **199 px** y el Mustang **36**. El Mustang puede rodear un cactus con
calma; el Criollo, cada segundo que no galopa, se atrasa. **La velocidad dejó de
ser sólo "llego antes" y pasó a ser "cuánto me puedo distraer"** — que es una
stat mucho más interesante, y salió de una frase suya, no de un ajuste.

Los absolutos se eligieron para que la resta diera exactamente las ventajas
relativas de siempre, así que **el balance no se movió**: Criollo al 3er
enganche (8,1 s, 16 de aguante), Mustang al 2º y al 3º nunca.

El suelo desfila a `trenVelocidad`, con los obstáculos **reciclándose** adelante
cuando quedan atrás: el desierto no se acaba y el tren se ve cruzándolo.

#### Las riendas

El rumbo del caballo **no se asigna: se persigue**. Vos marcás la dirección y el
animal tarda `giroTiempo` (0,45 s, elegido por Santi) en llegar a apuntar ahí —
y al soltar sigue virado un momento antes de enderezarse. Medido: apretando W
llega a −33° progresivamente y vuelve igual de gradual, sin saltos. El dibujo
entero (animal, jinete y sombrero) rota con el rumbo, así que no hizo falta una
silueta por ángulo.

En un juego de naves esa demora sería un defecto; acá es el punto: se siente que
hay un bicho con inercia entre tu mano y la dirección.

#### 🐛 Dos bugs más, encontrados mirando

- **El caballo nacía dentro de una roca.** Aparecía "¡LA PIEDRA!" en el primer
  segundo, antes de tocar una tecla — empezar castigado por algo que no se pudo
  ver venir contradice la regla más repetida del proyecto. Ahora la siembra
  despeja la zona de largada corriendo el obstáculo en vertical (no borrándolo,
  para que no quede un claro sospechoso). Verificado: **0 choques al nacer en 20
  arranques**.
- **La HUD se le montaba encima al caballo.** Al mudarla abajo en la vuelta
  anterior quedó justo donde ahora galopa. La repartición real de la pantalla
  con el zoom lejano es: `y 0-20` libre · `y 20-84` el tren (y sólo de x≈310 a
  la derecha) · `y 87-216` el desierto. O sea que **la única zona libre es la
  franja de arriba a la izquierda**, porque el tren entra por la derecha. Ahí
  fue el aguante; el reloj al centro; y las teclas —que desaparecen al alcanzar
  la cola— arriba al medio, donde el tren todavía no llegó.

### 🐛 TERCERA VUELTA · "Parece una pista de carreras" — el tren nunca se veía

*(Santi, jugando la versión anterior: "no es lo que esperaba. Recuerda que dije
que el caballo debería poder cabalgar en diagonal hacia el tren. Aquí parece una
pista de carreras con obstáculos, yo no quiero eso, quiero que el tren se vea a
lo lejos y el caballo se va acercando hacia él. (...) Quiero que el jugador
sienta más libertad")*

**La primera versión falló por geometría, y la causa es de una línea:** con el
zoom lejano en 0,5 la pantalla muestra 768 px de mundo a lo ancho, y el tren
estaba a **1000 px**. O sea que **el tren no entraba en pantalla**: los primeros
diez segundos eran galopar hacia un horizonte vacío con obstáculos viniendo de
frente. Eso es literalmente una pista de carreras, y ninguna cantidad de campo
ni de cactus lo iba a arreglar — faltaba la única cosa hacia la que se supone
que vas.

Y la diagonal tampoco existía de verdad: 1000 px de largo contra 150 de
profundidad es una aproximación **87% horizontal**. La diagonal era un detalle,
no el movimiento.

#### La geometría nueva

| | v2 (la fallida) | v3 |
|---|---|---|
| Distancia al tren | 1000 px | **600 px** — para que ENTRE en pantalla |
| Zoom lejano | 0,5 (vista de 768 px) | **0,4** (vista de 960 px) |
| Profundidad del campo | 150 px | **330 px** |
| Reloj | 55 s | **45 s** |

Verificado en el primer cuadro: la cola queda dibujada en **x=310 de 384**,
arriba a la derecha, con el tren midiendo **64 px** de alto; el caballo abajo a
la izquierda (x=72, y=180), a **290 px de la vía**. Ir hacia el tren es
literalmente ir en diagonal, hacia adelante y hacia arriba, eligiendo tu línea
entre los obstáculos.

El reloj BAJÓ de 55 a 45 y no es una inconsistencia: el criterio es siempre el
mismo —que el margen DESPUÉS de tocar la cola no cambie— y por eso el número
sube cuando la persecución se alarga y baja cuando se acorta. Balance
verificado, idéntico a lo de siempre: Criollo al 3er enganche (10,9 s, 29 de
aguante), Mustang al 2º (14 de aguante).

#### 🐛 Y dos bugs de dibujo que hacían INVISIBLE al tren, los dos encontrados mirando

1. **La HUD lo tapaba entero.** El panel ocupaba los 90 px de arriba y el tren,
   con el zoom lejano, se dibuja en los primeros 64. El síntoma era
   desconcertante: todas las mediciones daban la cola correctamente en x=310 y
   aun así no se veía nada. Ahora arriba queda **sólo el reloj** y todo lo demás
   bajó al borde inferior — que es la decisión CONTRARIA a la que esta misma
   función tenía documentada (*"las teclas van arriba porque abajo es POR DONDE
   GALOPÁS"*), y es correcto que se haya dado vuelta: con el desierto nuevo,
   arriba es donde está el tren y abajo es fondo lejano.
2. **`drawTrain` recortaba con `r.width`**, o sea daba por sentado en silencio
   que el dibujo va siempre a escala 1. Con la escena a 0,4 la pantalla muestra
   960 px de mundo pero la función dibujaba sólo los primeros 384 desde `camX`
   — que en el galope caen enteros en el vacío detrás de la cola. **El tren no
   se dibujaba nunca.** Ahora recibe `vistaW`/`vistaH` opcionales; el asalto,
   que dibuja a escala 1, no cambia en nada (verificado: renderiza 20 s sin
   errores).

> Los dos son la misma familia: **código que asumía escala 1 sin decirlo**. Es
> el precio de meterle un zoom a un motor que nunca lo tuvo, y el tipo de cosa
> que ninguna medición encuentra porque los números están todos bien.

### 🐛 Dos bugs que NINGUNA medición mostró — sólo se vieron mirando con foto.ps1

1. **Una banda de montañas flotando en medio del desierto.** El parallax
   inferior estaba en `base + 52`, que nunca fue una posición pensada: era el
   borde de abajo de la pantalla vieja (160 + 52 = 212, con 216 de alto). O sea
   que esas montañas jamás se vieron enteras — eran la última rebanada del
   cuadro. Con 150 px de campo quedaron colgadas a mitad de camino, como una
   pared de sombras. Movidas al fondo real del campo, ahora son el horizonte.
2. **El caballo nacía camuflado con el horizonte.** Al mover las montañas quedé
   en `campoAbajo - 10`, o sea DENTRO del campo jugable — y el caballo arranca
   justo en el fondo, así que nacía pisando la línea y se perdía contra ella. Un
   horizonte que se mete en la zona por la que se galopa deja de ser horizonte:
   ahora va en `campoAbajo + 2` y el arranque bajó a `carrilLejos - 30`.

> **La lección, que el proyecto ya tenía escrita y esta vuelta confirmó dos
> veces:** para MIRAR algo hay que mirarlo. Las dos cosas estaban perfectas en
> los números —zoom correcto, cámara correcta, nada fuera de pantalla, cero
> errores— y las dos se veían mal. `foto.ps1` no es un lujo para sprites: es la
> única forma de verificar composición.

### 🐛 Y tres veces el mismo error de edición, mío

Insertando comentarios largos en `horse.js` dejé el `*/` viejo en medio del
bloque nuevo, tres veces seguidas. El síntoma fue siempre `Invalid or unexpected
token`. **Y una de esas veces el arreglo pareció no funcionar**: el import
directo daba OK pero la escena seguía rota, porque `rideScene.js` importa
`horse.js` sin cache-buster y el navegador servía la versión vieja — exactamente
el caché de módulo del que advierte PROMPT-CONTINUAR. Se resolvió recargando la
pestaña, no tocando más código.

---

## ✅ HECHA · "Es al pedo apuntar si la bala siempre va al medio" — el círculo estaba calibrado a la distancia equivocada

*(Santi pidió una prueba: "quiero que dispares muchas veces con el Colt para
ver cuántas balas acaban en el centro del círculo sin apuntar y cuántas por la
orilla. Esto porque la verdad es que veo que casi todas van al medio del
círculo". Confirmado el 91% a 60px, pidió: "quiero cambiar eso, porque sino es
al pedo que el jugador apunte con clic derecho si siempre la bala va a ir al
medio del círculo. Hagamos que sea 6 de 10 tiros van al medio y 4 a la
orilla")*

**Primero se midió si la dispersión estaba rota, y no lo estaba.** 4000 tiros
del Colt sin apuntar, a la distancia de referencia exacta (120px, el valor
viejo): la desviación angular medía uniforme (std 0,0274 contra 0,0202
esperado sin el 15% de tiros que fallan más — la diferencia es justo la que
aporta ese 15%, verificado contra la teoría de la mezcla). El problema no era
la aleatoriedad.

**Era la distancia.** `CONFIG.mira.distanciaReferencia` calibra SIEMPRE el
tamaño del círculo como si dispararas a esa distancia fija — decisión tomada a
propósito en una vuelta anterior, para que el círculo describiera el arma y no
el tiro puntual (ver más abajo, "vuelta seis"). Pero 120 era el extremo LEJANO
de "distancia típica de combate (60-120px)", no el centro. A la distancia real
más común (60px, la mitad de 120), el mismo ángulo de error produce la mitad
del desvío en píxeles — así que el círculo, aun siendo matemáticamente
honesto, se veía mucho más grande de lo que en la práctica ibas a fallar.

**El arreglo, y por qué es seguro tocarlo solo:** `distanciaReferencia` sólo
alimenta el DIBUJO del círculo (`drawMira`, raidScene.js). `dispersionActual()`
—la que de verdad decide el ángulo del disparo en `shoot()`— no lee ese
número. Bajarlo no mueve un solo número de letalidad ya afinado (la hitbox de
los guardias, cuántos tiros hacen falta para matar, nada): sólo hace que el
círculo describa mejor la distancia a la que de verdad peleás.

**80 salió de probar candidatos contra el pedido exacto** (60% adentro de la
mitad, a 60px real):

| Referencia | % adentro de la mitad, a 60px |
|---|---|
| 70 | 53% |
| 78 | 59% |
| **80** | **61%** ← elegido |
| 85 | 64% |
| 120 (el viejo) | 91% |

Y no es casualidad que ronde ese valor: la proporción `k = distancia real /
referencia` es lo único que determina el resultado — ni la distancia ni la
referencia importan por su valor absoluto. `k = 0,75` ya había dado 60/40 al
medir 90px contra la referencia vieja de 120 (90/120 = 0,75); con 80 de
referencia, 60/80 = 0,75 también — el mismo punto de la curva.

**Verificado:** 59,5% adentro de la mitad a 60px (el pedido era 60%). El radio
del Colt suelto baja de ~4,2px a **2,8px**; apuntado queda en el piso técnico
(`radioMin: 2`) — ya estaba prácticamente ahí antes (2,1px), así que no es un
cambio nuevo. El Smith, que comparte el mismo número, se mantiene dentro de
`radioMin`/`radioMax` en todos sus casos (suelto 6,8px, apuntado 3,4px, con
retroceso al tope 16,6px). Corridas completas después del cambio: sin errores.

---

## ✅ HECHA · La mira: el círculo que hizo visible la precisión

*(idea de Santi: "el puntero para disparar no debería ser una cruz. Debería
ser un círculo. Y al tocar el clic derecho el círculo se cierra. Y dependiendo
del arma se cierra más o menos. Y al estar con el shift contra una pared y
tocás clic derecho para salir a apuntar, el círculo ya está cerradito")*

**El punto de partida vale anotarlo, porque nadie se había dado cuenta: NO
HABÍA MIRA.** La cruz era el cursor del sistema operativo (`cursor: crosshair`
en `styles/main.css`), o sea que **la precisión del arma —el número más
importante del combate después del daño— era completamente invisible**. La
sentías fallando, sin saber por qué. Ocho vueltas de afinar `spread` en dos
armas y el jugador nunca vio ninguno de esos números.

### La idea es mejor de lo que parece, y por un motivo que no estaba en el pedido

El radio del círculo puede ser **la dispersión misma**, no un símbolo de ella:
`tan(spread) × distancia al punto donde apuntás`. Y en cuanto se hace así,
**un sistema viejo que era invisible pasa a verse gratis**: `dispersionExtra`
—el sacudón del tren veloz, construido hace varias vueltas— ya se sumaba al
disparo, y ahora esa suma tiene dónde mostrarse. El círculo se abre en tu cara
durante un traqueteo. No hubo que inventar una señal nueva para un sistema
viejo: alcanzó con dibujar el número que ya estaba.

**Una sola fuente de verdad, y no es una comodidad.** `dispersionActual()`
(entities/player.js) la usan las dos cosas que tienen que coincidir sí o sí: el
radio del círculo y el ángulo del disparo. Si cada uno la calculara por su
lado, la mira mentiría en cuanto alguien tocara un número — que es exactamente
el error que este proyecto ya se comió dos veces (el comentario decía una cosa
y el código hacía otra: ver la cobertura y el sigilo, más abajo).

### 🔍 La versión honesta era ilegible, y sólo se supo midiendo

La primera versión dibujaba el cono literal, sin tocar nada. Medido:

| Apuntando a 120 px | Radio real |
|---|---|
| Colt suelto (0,035) | **4 px** |
| Colt apuntado (0,010) | **1 px** |

O sea que **el gesto central de todo el sistema se resolvía en un píxel**. Y no
es un error de cuenta: es que las armas de este juego son precisas de verdad y
la pantalla mide 384x216. Un cono honesto a esta escala es un punto.

Por eso el radio se multiplica por `CONFIG.mira.escala` (4). **Lo que se
conserva es lo único que importa: la proporción.** El doble de dispersión sigue
siendo el doble de radio, así que comparar dos armas, ver el efecto de apuntar
o notar el balanceo siguen siendo lecturas correctas. Lo que se pierde es poder
medir con una regla contra la pantalla dónde va a caer la bala — que no es una
promesa que nadie necesite. Con 4, el Colt a 120 px pasa de 17 px suelto a 5
apuntado, y eso se ve de un vistazo.

> **La lección:** *"el número real" y "el número legible" no son lo mismo, y
> cuando chocan hay que elegir a sabiendas y dejarlo escrito.* Lo que no se
> puede es fingir que el dibujo es literal cuando no lo es.

### Qué cuesta apuntar (decidido con Santi)

**Tarda 0,35 s en cerrar Y te frena a 40 px/s** mientras lo mantenés. Las dos
cosas, no una: si apuntar fuera instantáneo y gratis, la respuesta óptima sería
"apuntá siempre" y el clic derecho sería un botón que hay que tener apretado,
no una decisión. 0,35 s es un tiro y pico del Colt, así que abrir fuego de
inmediato y plantarte a apuntar primero son dos jugadas distintas.

Y el 40 no es un número nuevo: es el mismo `sneakSpeed`/`coverSpeed` que ya
cuestan agacharse y deslizarse pegado a una pared. **El juego tiene UN precio
de movimiento y esto no inventa otro.** Cobra en tiempo y exposición, nunca en
vida — la misma familia que el barril, la caja fuerte y el salto sucio.

**El retroceso (que cada tiro abra el círculo) quedó afuera a propósito**, y es
la misma regla con la que se construyeron los barriles antes que el traqueteo:
una cosa a la vez. Si se metiera ahora y algo se sintiera mal, no habría forma
de saber si fue la mira o el retroceso.

### Los números por arma, y por qué la brecha es lo que importa

| | Suelto | Apuntado | Radio a 120 px |
|---|---|---|---|
| **Colt** | 0,035 | **0,010** | 17 → 5 |
| **Smith** | 0,085 | **0,045** | 41 → 22 |

**El Smith apuntado (22 px) sigue siendo peor que el Colt sin apuntar (17).**
Eso es la decisión, no un descuido: apuntar no le puede borrar el defecto que
lo define, porque entonces comprarlo sería un ascenso y no una decisión. El
Colt es pulso fino, el Smith es mano rápida. Y le da a la tienda algo nuevo que
vender **que se ve**: no un número en una ficha, un círculo que cierra distinto.

### Lo más interesante: la cobertura ganó una razón ofensiva

*"Al estar con el shift contra una pared y tocás clic derecho, el círculo ya
está cerradito"* — y esto encaja con una regla que el juego ya tenía escrita en
otro lado: **estar pegado a una pared es estar afianzado**. Es exactamente el
mismo motivo por el que el sacudón del tren veloz no te arrastra si estás
cubierto (CONFIG.traqueteo). Un tipo apoyado contra un marco no necesita ese
tercio de segundo: ya tiene dónde apoyar el brazo.

**Hasta acá cubrirse era puramente defensivo**: te tapa, pero no podés disparar
hasta asomarte, así que la única pregunta era cuándo salir. Ahora también es el
lugar desde donde mejor se tira.

**Y no hubo que agregarle ningún contrapeso, porque ya estaban todos
construidos:** asomado sos un blanco, los jinetes de afuera te cazan en la
ventanilla, y los guardias del blindado te tiran dinamita **justamente cuando
te ven parapetado**. Ese último es el que lo salva de romperse: el juego ya
tenía una herramienta para castigar quedarse quieto detrás de un asiento.

**ES EL RIESGO A MIRAR JUGANDO.** Es la primera vez que la cobertura da algo
además de protección, y si al jugarlo la respuesta a todo pasa a ser "pegate a
una pared y asomate", la palanca es hacer que la mira a cubierto cierre rápido
pero no instantáneo, en vez de sacarle el beneficio.

### Un detalle que también hay que mirar jugando

**El clic derecho pasó a hacer dos cosas según dónde estés**: suelto apunta, a
cubierto asoma (y de paso apunta). Creo que está bien —son el mismo verbo,
*encarar el tiro*— pero si se siente como dos botones distintos metidos en uno,
hay que separarlo.

### Verificado

Ángulos exactos contra lo que promete la ficha (400 disparos por caso: la
desviación medida da `spread/√3`, que es lo que corresponde a la dispersión
uniforme del `rng`). Cierre en 0,35 s clavados; velocidad 78 → 40. A cubierto,
`apuntado` sale en 1 al instante. Y **mirado con `foto.ps1`**, que es lo que
encontró el problema de legibilidad: el círculo suelto, el apuntado, el rojo de
"no podés disparar" estando cubierto sin asomarte, y el traqueteo abriéndolo
con el cartel de *¡FRENA DE GOLPE!* al lado. 90 segundos de asalto en los tres
tipos de tren, disparando y cubriéndose, sin un solo error.

### 🐛 SEGUNDA VUELTA · El círculo mentía ×16, y la mentira era jugable

*(Santi, jugando: "si se hace el círculo más grande es para que se pierda
puntería. Ahora mismo eso no pasa: mientras el enemigo esté en el puntito de
adentro, le pega igual, por más que el círculo sea grande")*

**La causa era exactamente el "ajuste de legibilidad" de la vuelta anterior.**
`CONFIG.mira.escala` multiplicaba el radio ×4 para que se viera en la captura
de prueba (`foto.ps1`, exportada a 3x). Lo que no até en su momento: el canvas
del juego **ya se agranda solo por CSS**, en un múltiplo entero según la
pantalla (`fitToScreen`, engine/renderer.js) — medido en esta máquina, ×4. El
`escala: 4` que agregué se multiplicaba ENCIMA de eso: el círculo que se veía
en pantalla no era 4 veces más grande que la dispersión real, era
**dieciséis**.

**Y esa mentira tenía una consecuencia jugable exacta.** La dispersión real del
Colt a distancia de combate (60-120 px, donde pasa casi todo el juego) es de
pocos píxeles — menor que el propio cuerpo de un guardia (10px de diámetro).
Apuntando al centro, casi cualquier tiro caía adentro del guardia sin importar
qué tan "grande" se viera el círculo inflado. El Colt siempre fue así de
preciso (es su virtud, escrita desde la fase 1), pero antes de la mira nadie
podía verlo y esperar otra cosa del dibujo.

**Arreglo: `escala` volvió a 1.** El radio es literal, sin ningún
multiplicador. La legibilidad la da la ampliación de pantalla que ya existía,
no un maquillaje encima.

**Verificado con un mundo sintético sin paredes** (para aislar la dispersión
pura de la geometría real del vagón, que la primera medición de este arreglo
había contaminado sin que me diera cuenta):

| | Radio mostrado | Impactos reales (400 tiros) |
|---|---|---|
| Colt suelto @60px | 2 px | 100% |
| Colt suelto @120px | 4 px | 100% |
| **Colt suelto @200px** | **7 px** | **69,8%** |
| Colt apuntado @120px | 1,5 px | 100% |
| **Smith suelto @120px** | **10 px** | **47,5%** |
| Smith suelto @200px | 17 px | 27,3% |
| Smith apuntado @120px | 5,4 px | 95,3% |

**Ahí está la promesa cumplida.** Mientras el radio queda por debajo del medio
cuerpo del guardia (~5px), el impacto es prácticamente seguro — que es lo que
tiene que pasar de cerca, con cualquier arma, por diseño. En cuanto el radio lo
supera, empiezan a aparecer fallos de verdad y en proporción al tamaño del
círculo: el Smith suelto a 200px, con el círculo más grande de la tabla, falla
casi tres de cada cuatro tiros.

**Y mirado en la pantalla real** (no la captura de prueba, la resolución con la
que efectivamente se juega): el anillo sigue viéndose en los casos "suelto", y
en el "apuntado" colapsa a un puntito casi sin anillo alrededor — que si algo,
comunica MEJOR la idea de "clavado" que un círculo chico pero visible.

> **La lección que hay que dejar escrita, porque ya es la segunda vez que pasa
> en este proyecto con esta misma forma:** un ajuste de legibilidad hecho
> mirando una captura de prueba, sin la resolución real de juego delante, puede
> introducir un multiplicador que nadie pidió. La próxima vez que haga falta
> agrandar algo para que se vea en una captura, la pregunta primero tiene que
> ser "¿esto ya se agranda solo en el juego de verdad?" — y la respuesta se
> mide en la pantalla real, no en el archivo que exporta la herramienta.

### TERCERA VUELTA · El Colt parecía un rifle, y el puntito mentía al revés que el círculo

*(Santi, jugando: "por más de que el Colt tenga más puntería que el Smith, no
puede parecer un rifle. Otra cosa: no debería existir un puntito dentro del
círculo. Y la dispersión del tiro debería ser dentro del círculo — cierto
porcentaje de que la bala vaya al medio, pero también cierto porcentaje que
vaya a las orillas")*

Tres pedidos, y dos resultaron ser el mismo problema mirado desde dos lados.

**1. Antes de tocar nada: ¿la bala YA tenía chance real de ir a la orilla, o
sólo al medio?** Medí `engine/rng.js` — `spread()` es `(next()*2-1) * amount`,
o sea una distribución **uniforme** entre −amount y +amount, no una campana que
favorezca el centro. Con 3000 tiros por caso, contando en qué tercio del
círculo caía cada impacto (centro / medio / orilla): **960 / 1000 / 1040**,
prácticamente parejo. **La mecánica ya hacía exactamente lo que Santi pedía.**
Nunca hizo falta tocar el generador de números.

**2. Entonces el problema era el dibujo, no la física.** Un puntito fijo en el
centro (`CONFIG.mira.puntoCentral`) se lee como *"la bala va a cualquier lado,
pero en el fondo apunta acá"* — la lectura EXACTAMENTE contraria a una
dispersión uniforme, donde el borde tiene tanto derecho como el medio. Sacarlo
(`drawMira`, scenes/raidScene.js) hace que el círculo entero sea la respuesta,
sin un centro con privilegio dibujado encima de una mecánica que no lo tiene.

**3. Y el Colt sí tenía un problema de verdad, pero era de otra vuelta.** Con
`spreadApuntado: 0,010` (fijado en la vuelta anterior), el círculo apuntado a
distancia de combate (120px) daba **1,2px** — por debajo del piso de dibujo,
así que en la pantalla se veía un punto clavado sin abertura. Sin el puntito
central de referencia, ese colapso se iba a notar todavía más: un anillo que
prácticamente no abre se lee como mira telescópica, no como un revólver bien
sostenido.

**La regla que lo arregla es más simple que la que había, y sirve para
cualquier arma que se agregue después: apuntar corta la dispersión A LA
MITAD, siempre — la misma proporción para las dos armas del catálogo.**

| | Suelto | Apuntado (mitad) | Radio a 120px |
|---|---|---|---|
| **Colt** | 0,035 | **0,0175** | 4,2 → **2,1 px** |
| **Smith** | 0,085 | **0,0425** | 10,2 → 5,1 px |

El Colt apuntado (2,1px) sigue siendo menos de la mitad del Smith apuntado
(5,1px) — la jerarquía de precisión no se tocó, sigue siendo claramente el más
fino del juego. Lo que cambió es que ya no desaparece: hay un anillo real,
chico, pero un anillo. Y de paso `radioMin` subió de 1,5 a 2px, no porque el
Colt lo necesitara más que antes, sino porque sin el puntito central de
respaldo, el piso de legibilidad solo tenía que hacer un poco más de trabajo.

**Verificado con `foto.ps1`, en la resolución real de pantalla:** el anillo del
Colt apuntado ya se distingue de un simple punto — chico, pero con abertura
visible — y el Smith apuntado sigue siendo notoriamente más ancho al lado
suyo. 60 segundos de asalto en los tres tipos de tren, disparando, apuntando y
cubriéndose, sin un solo error.

### CUARTA VUELTA · El círculo por fin decía la verdad, y el blanco seguía siendo un cuadrado gordo

*(Santi, jugando: "el problema ya no se debe al círculo, sino a la hitbox de
los personajes. Yo haría que los guardias y yo y las personas en general, sean
rectángulos en vez de cuadrados gordos y muy fácil de disparar")*

Con el círculo arreglado (tercera vuelta) y la distribución uniforme
confirmada, faltaba la última pieza: **la caja que recibe la bala.** Jugador y
guardias medían 5x5 (10x10 en total) — el mismo cuadrado desde la fase 1, y
nadie lo había cuestionado porque hasta ahora nada dependía de su tamaño
exacto. Con la mira mostrando la dispersión real, sí dependía: a distancia
típica de tiroteo (60-120px) esa dispersión daba un radio de 2 a 4px, **menor
que el propio cuadrado del guardia**, así que apuntar al centro casi
garantizaba pegarle sin importar qué tan abierto se viera el círculo. El
círculo ya no mentía — el blanco seguía siendo demasiado grande para que la
mentira hiciera falta.

**Por qué el recorte es más grande en alto que en ancho.** Los vagones son
pasillos, mucho más largos que anchos, así que casi todos los tiros del juego
salen casi horizontales. En un tiro horizontal, lo que decide si pasa de largo
o pega es la ALTURA del blanco (`hh`), no su ancho — el ancho (`hw`) sólo
importa en los tiros cruzados de lado a lado, que son la minoría. Recortar
parejo en las dos direcciones hubiera desperdiciado la mitad del efecto en la
dimensión que menos protege.

**Los números, decididos con Santi tras plantear tres paquetes concretos**
(suave -20% de alto, recomendado -30%, agresivo -20%/-40% en las dos
direcciones): eligió su propia mezcla, **-10% de ancho y -30% de alto**, sobre
el 5x5 de siempre.

| | Antes | Ahora |
|---|---|---|
| Jugador y guardia (`hw, hh`) | 5, 5 (10x10) | **4,5, 3,5 (9x7)** |
| Pasajero (`hw, hh`) | 4, 4 (8x8) | **3,6, 2,8** — mismo recorte proporcional |

**El Cazarrecompensas (6x6) y los jinetes (9x7, ya rectangulares) quedan
afuera a propósito**: son casos con su propio ajuste fino, medido aparte
—el jefe tiene ocho de vida justamente porque con cuatro y su vieja hitbox ya
era demasiado fácil matarlo— y meterlos en este recorte parejo hubiera sido
tocar un balance que no pidió nadie revisar.

**El sprite se redibuja con el mismo tamaño que la hitbox, no con un número
aparte.** `drawPlayer`, `drawEnemy` y `drawPassenger` ahora leen `hw`/`hh` de
la propia entidad en vez de tener el `5` o el `4` escritos a mano — la caja
que ves siempre es exactamente la caja que te puede matar, la misma regla que
ya sostenía el resto del juego. Y como el rectángulo del sombrero del jugador
ya se calculaba a partir de `halfW` (no de un número suelto), se angostó
solo, sin tocarlo.

**Medido, el efecto es exactamente el que se buscaba:**

| | Antes (10x10) | Ahora (9x7) |
|---|---|---|
| Colt suelto @60px | 100% | 100% (de cerca sigue siendo casi seguro, como corresponde) |
| **Colt suelto @120px** | **100%** | **77,7%** |
| Colt apuntado @120px | 100% | 100% (apuntar sigue asegurando el tiro) |
| Smith suelto @120px | 47,5% | 32% |

**A distancia típica de combate, el Colt SUELTO ya falla una de cada cuatro
veces.** Apuntar (y la mira que lo dibuja) por fin tienen un motivo real para
existir en el caso más común del juego, no sólo a distancia larga. Y de cerca
nada cambió: el Colt sigue siendo mortal a quemarropa, que es exactamente su
identidad desde la fase 1.

**Verificado por consola** (sin paredes, para medir la dispersión pura) y
mirado con `foto.ps1`: las siluetas se leen claramente como personas —un
rectángulo más ancho que alto, con el sombrero de ala natural por encima— y no
como el cuadrado de siempre. 90 segundos de asalto en los tres tipos de tren,
con el jugador moviéndose, disparando, apuntando y cubriéndose, sin un solo
error ni un enganche nuevo contra puertas o paredes.

### 🐛 QUINTA VUELTA · "Parece que mato conos": la causa era vieja, no del recorte de hoy

*(Santi, después de jugar con la hitbox nueva: "sigue sin convencerme porque
el jugador parece que mata conos en vez de guardias de ley. Y todavía no sé
porqué")*

**Antes de tocar nada, medí si el recorte de la vuelta anterior era el
culpable — y no lo era.** Comparando pixel a pixel el sprite viejo (10x10)
contra el nuevo (9x7) con el mismo renderer aislado: el cuerpo pasó de 10x8 a
9x7 píxeles reales en pantalla. **Un píxel de diferencia por lado.** No
alcanza ni de cerca para explicar una sensación tan fuerte como "esto no
parece una persona". La causa tenía que ser otra, y vieja.

**Mirando el sprite solo, sin el piso del vagón alrededor** (mismo truco que
con la mira: aislar para ver sin ambigüedad), apareció clarísima: **el ala del
sombrero tocaba directo el cuerpo, cero píxeles de transición.** Sin una
cabeza que separe "sombrero" de "torso", y con el cuerpo pintado siempre del
color de ESTADO (gris/amarillo/rojo, nunca de piel), la silueta entera eran
dos bloques apilados — ala ancha arriba, base angosta abajo. Exactamente el
perfil de un cono. Y esto **no lo introdujo el recorte de hoy**: estaba desde
que existe el guardia. Lo que cambió es que antes se disparaba "a bulto" y
ahora, con la mira y la hitbox de verdad, hay más motivo para mirar de cerca a
qué le estás tirando — y ahí la silueta se quedaba corta.

> **La lección, otra vez de método:** frente a un problema de sensación
> ("esto no se siente bien"), la primera pregunta tiene que ser *¿esto lo
> causó lo último que toqué, o ya estaba?* — y se responde MIDIENDO el cambio
> real, no asumiendo que lo más reciente es lo culpable. Acá el sospechoso
> obvio (la hitbox, tocada esta misma sesión) resultó inocente; el culpable
> real llevaba viviendo en el proyecto desde la fase 1.

**El arreglo, con Santi ya de acuerdo en mejorar la silueta:**

1. **Una cabeza nueva** (`col.enemyPiel`, un tono de piel que no usa nadie
   más) se inserta entre el ala del sombrero y el cuerpo — una franja angosta
   que antes no existía. Antes el ala tapaba directo el primer píxel del
   cuerpo; ahora hay un color de piel real en el medio.
2. **El ala dejó de ser un número fijo.** Era `12` siempre, sin importar el
   tamaño del cuerpo — la misma clase de bug que ya se había corregido en el
   sombrero del jugador (que sí escalaba con `halfW`) pero que nunca se aplicó
   al guardia. Ahora es `e.hw * 2 + 2`, así que el ala nunca vuelve a
   desproporcionarse si el cuerpo cambia de tamaño de nuevo — que es
   justamente lo que había pasado esta sesión.
3. **Las variantes (`placa` del blindado, `estrella` del Sheriff) reciben el
   mismo tratamiento:** sus platos y alas extra-anchas también escalan con
   `e.hw` ahora (`+4` el blindado, `+6` el Sheriff — la misma jerarquía de
   anchos de ala que ya existía, sólo que proporcional en vez de fija).

**Verificado mirando los cuatro casos aislados** (guardia normal en patrulla y
en combate, blindado, Sheriff): los cuatro muestran la franja de piel entre el
ala y el cuerpo, y se leen como una persona con sombrero — no como un cono ni
un hongo. 60 segundos de asalto en los tres tipos de tren después del cambio,
sin errores.

**Lo que queda para cuando llegue el arte de verdad**, y no es parte de este
arreglo: el guardia sigue sin brazos ni piernas (sólo la línea del arma), y
los colores siguen siendo bloques planos sin sombreado — el README ya lo dice,
"sigue sin haber arte, todo son rectángulos de colores a propósito". Este
arreglo achica la distancia hasta que eso llegue; no la cierra.

### El resto de la conversación sobre "matar conos" — lo que se discutió y lo que se decidió construir primero

Después de arreglar la silueta, Santi explicó que el problema de fondo no era
visual: *"lo que yo hago literalmente es acercarme, disparar dos tiros, lo
mato, y sigo. Lo que pienso es 'tengo que matarlo para avanzar', y lo que
debería pensar es que tengo que pelear contra una situación generada por
personas y no pelear contra muñecos simplemente."* Un guardia hoy no tiene
ninguna conducta que diga "soy una persona con miedo": un color que cambia y
una IA que pelea igual de principio a fin, sin importar si está solo, herido o
acorralado.

Propuso cuatro ideas para probar. Se conversaron las cuatro antes de tocar
código:

1. **Replegarse con un compañero cubriendo** cuando le queda poca vida — se
   anotó como la más barata de construir, porque reusa directo el
   `grupoDefensa`/turnarse-para-asomarse que ya se construyó para la escolta
   del Sheriff. **✅ CONSTRUIDA** — ver la sección propia más abajo. La
   predicción de "la más barata" se confirmó: reusó `defensivo` y el detector
   de golpes del Cazarrecompensas, y no tocó una línea de combat.js, melee.js
   ni explosives.js.
2. **Rendirse de rodillas, con traición incierta** al perdonarlo. Se marcó una
   tensión real con la regla de oro del juego —todo peligro avisa antes de
   pegar— y se propuso que la traición, si existe, tenga su propio aviso
   corporal en vez de ser una sorpresa muda. Conecta con `gameState.honor`,
   que existe desde la fase 1 y todavía no lo mueve nada. Sin hacer todavía.
3. **Ráfaga de pánico al cargarlo** — la que se construyó primero, ver abajo.
4. **Asomarse por encima de la cobertura + headshot instantáneo para los dos
   lados** — se recomendó DESCARTAR esta combinación: pedía inventar una
   categoría de cobertura que el juego no tiene (alta/baja), y el headshot
   instantáneo volaba por el aire todos los números de vida ya medidos del
   juego. Además, un argumento más de fondo: la letalidad instantánea vuelve
   la pelea MÁS mecánica y binaria, no menos — el objetivo era sentir que
   peleás contra una persona, y esto iba en la dirección contraria.

También se acordó una idea de síntesis para no dejar las conductas sueltas:
un valor de "miedo" por guardia (parecido a la sospecha, pero sobre cuánto
aguanta antes de quebrarse) que suba con cada bala recibida y con cada
compañero visto caer, y que decida cuál de las tres respuestas (replegarse,
rendirse, pánico) le toca según la situación exacta en que se rompe. Todavía
no está construido — cada idea se sigue armando por separado, empezando por
la 3.

### ✅ HECHA · La ráfaga de pánico — el guardia deja de esperar escondido cuando lo cargás

*(idea de Santi: "cuando el jugador corre por el pasillo para dispararle a un
guardia cubierto, este se pare y tire una ráfaga larga al jugador. Esto para
resolver el problema de que el jugador puede ir tranquilamente por el pasillo
y disparar dos veces rápido y matar a un guardia como si fuera un cono
estático")*

**El problema medido, antes de tocar nada:** un guardia parapetado pasa entre
`coverHoldMin` y `coverHoldMax` (0,7-1,6s) escondido entre una asomada y la
siguiente. Dos tiros de Colt tardan 0,8s. Un jugador que corre y dispara podía
matarlo casi siempre DENTRO de ese primer escondite, antes de que completara
un solo ciclo de cobertura — nunca llegaba a devolver un tiro.

**El disparador reusa un número que ya existía y ya significaba lo mismo.**
`panicoDistancia` vale exactamente lo mismo que `coverMinDistance` (42px), que
ya era —desde antes de esta vuelta— "demasiado cerca para portarse tranquilo"
en el vocabulario del archivo: es la distancia a la que un guardia ni siquiera
ELIGE esconderse cerca tuyo. Que la misma línea dispare el pánico cuando el
guardia YA está escondido no es un número nuevo, es la misma idea aplicada del
otro lado de la cobertura.

**Qué cambia en pánico, y qué NO:**

| | Normal | En pánico |
|---|---|---|
| Espera escondido entre ráfagas | `coverHoldMin`-`coverHoldMax` (0,7-1,6s) | **Ninguna** |
| Tamaño de la ráfaga | 2 | **5** (mismo número que ya usa el disparo ciego por la puerta para decir "no apunta con cuidado") |
| Vuelve a esconderse después | Sí | **No, mientras sigas cerca** |
| Puntería | La de siempre | Más sucia (`panicoSpreadExtra`, se suma igual que el sacudón del tren) |
| **Aviso antes de disparar (`aimTime`)** | **Igual** | **Igual — no se toca** |

Esa última fila es la que sostiene todo lo demás: el pánico le saca el
escondite, no el telegrafiado. Ningún peligro de este juego dispara sin que el
cuerpo lo anuncie primero, y esto no iba a ser la excepción.

#### 🐛 Dos bugs de MEDICIÓN, no del juego — y vale la pena dejarlos anotados

**El primero: `engaged` no servía para esto.** La primera versión reusaba la
variable `engaged` que ya calculaba `doCombat` (si el guardia ve al jugador
desde la ASOMADA). Medido con un jugador que se TELETRANSPORTABA a poca
distancia de golpe, el pánico nunca disparaba: la asomada está pensada para
ver LEJOS por el costado de la cobertura, así que a poca distancia esa
misma posición podía no tener línea directa al punto exacto donde había
quedado el jugador. El pánico necesita su propio chequeo, calculado desde
donde el guardia REALMENTE está agazapado (`e.x, e.y`), no desde por dónde se
asomaría para un tiro lejano.

**El segundo era mío, no del código.** Comparando "con pánico" contra "sin
pánico" con el mismo jugador de prueba, salían resultados sin sentido (el
guardia disparaba CERO veces en las dos corridas, o moría en 0 segundos sin
que nadie disparara). La causa: `input.mouse.down` había quedado en `true` de
una corrida anterior en la misma sesión del navegador y nunca se reseteaba
entre pruebas — el jugador de prueba estaba disparando durante lo que yo
pensaba que era una fase tranquila de "dejar que el guardia se asiente".

> **Para la lista de trampas de medición:** un arnés de prueba que reusa el
> mismo `input` entre corridas sucesivas arrastra estado invisible de la
> corrida anterior. Si algo "no tiene sentido" en una medición, sospechar
> primero del arnés antes que del sistema que se está midiendo — la mira, acá
> mismo unas vueltas atrás, tuvo el motivo real en el 90% de los casos, pero
> las dos veces anteriores el sospechoso correcto terminó siendo el código;
> ésta, el sospechoso correcto fui yo.

**Medido bien, con 25 corridas por lado (semillas distintas, sin parear —
parear con la misma semilla desincroniza el resto de los números aleatorios
compartidos entre las dos corridas, así que comparar agregados es más
confiable que comparar una sola corrida "igual"):**

| | Sin pánico | Con pánico |
|---|---|---|
| De los guardias que llegaron a cobertura, devolvieron al menos un tiro | 11/17 (65%) | **18/22 (82%)** |
| Primer tiro, en promedio | 0,67s | **0,52s** |

Con sólo 2 de vida (un guardia común en tren tranquilo) el jugador que carga
sigue ganando casi siempre —dos tiros de Colt matan, y eso no se tocó— pero
ahora el guardia **participa**: dispara antes, y en más casos llega a
disparar. Ya no muere en silencio.

**Verificado además:** la escolta del Sheriff sigue turnándose para asomarse
en pánico (máximo 1-2 a la vez, nunca los tres juntos — el cupo `MAX_ASOMADOS`
no se salteó). 90 segundos de asalto en los tres tipos de tren, disparando y
apuntando, sin un solo error.

**Lo que sigue sin construir:** el repliegue con compañero cubriendo y la
rendición con traición incierta (ideas 1 y 2 de la lista de arriba), y el
valor de "miedo" que las conectaría a las tres.

### 🐛 SEGUNDA VUELTA · Jugado de verdad, nunca disparó ni una vez

*(Santi, después de probarlo en el juego: "ya lo probé. Y en ningún momento me
hicieron una ráfaga de muchas balas")*

**Todo lo medido por consola en la vuelta anterior era cierto, y aun así el
sistema no se sentía en la partida real.** Dos huecos de diseño, no de
ejecución — los dos aparecieron recién al pensar en cómo se juega de verdad,
no en cómo se probó por consola:

**1. El chequeo de línea de vista era demasiado estricto para lo que
pretendía medir.** La primera versión exigía `canSeeFrom(e.x, e.y, ...)` —o
sea, visión real desde donde el guardia está agazapado— para activar el
pánico estando ya escondido. Pero "estar en cobertura" significa, por
definición, que hay algo SÓLIDO entre el guardia y el objetivo — pedirle
línea de vista desde ahí era pedirle que vea a través de la misma pared que
lo tapa. Con vos encima, lo que importa es la proximidad, no la geometría
fina: se saca el requisito de visión y queda sólo la distancia. No se vuelve
injusto — la bala que dispare sigue chocando contra una pared real si de
verdad los separa algo sólido; lo único que cambia es CUÁNDO decide
plantarse a disparar, no contra qué choca la bala.

**2. El caso más común en una partida real no estaba cubierto.** Un guardia
con `coverPoint` pero que todavía NO llegó (`!e.atCover`) **no dispara nunca
mientras camina** — el pánico de la primera vuelta sólo se revisaba una vez
que ya estaba escondido. Pero lo típico al entrar a un vagón es agarrar al
guardia recién saliendo a buscar dónde meterse, no ya asentado — y en ese
trayecto era completamente mudo. Un jugador que lo alcanzaba antes de que
llegara a la silla lo mataba en silencio, sin que el pánico tuviera ninguna
chance de activarse, porque sólo se lo había puesto donde el guardia YA
estaba escondido, no en el camino hacia ahí. Es probablemente la situación
más común de todas — y era exactamente la que quedaba sin cubrir.

**El arreglo:** una sola variable `enPanico`, calculada UNA vez al principio
de `doCombat` por pura proximidad (sin línea de vista), que ahora se usa en
los tres lugares donde antes se decidía algo distinto:

| Situación | Sin pánico | En pánico |
|---|---|---|
| Buscando o cambiando de cobertura | Sigue buscando | **No busca: no hay plan que armar** |
| Caminando hacia la cobertura elegida | Sigue caminando, mudo | **Abandona el trayecto y dispara desde donde está** |
| Ya escondido, esperando | Espera `coverHoldMin`-`coverHoldMax` | **Se planta ya, sin esperar** |

**Medido de nuevo, ahora en el caso real** (el jugador ya cerca cuando el
guardia se entera, sin darle tiempo a asentarse en ningún lado — 30 corridas
por lado, semillas distintas):

| | Sin pánico | Con pánico |
|---|---|---|
| Disparó al menos una vez | 17/30 (57%) | **21/30 (70%)** |
| Tiros promedio del guardia | 1,57 | **1,73** |

Con 2 de vida, casi ningún guardia sobrevive a un jugador que ya lo está
cargando disparando desde el primer cuadro — eso no se puede arreglar sin
tocar vida o daño, y no era el objetivo. Lo que sí cambió es que ahora
**participa** en más casos, en vez de morir mudo caminando hacia una silla
que nunca iba a alcanzar.

**Verificado por consola** (guardia interrumpe el trayecto exactamente al
cruzar los 42px, ráfaga de 5 confirmada) y con la corrida completa de
regresión en los tres tipos de tren más la escolta del Sheriff, sin errores.

### 🐛 TERCERA VUELTA · Rediseño completo — no era distancia, eran tres condiciones

*(Santi, después de probar la segunda vuelta: "todavía no está lo que quiero.
Y capaz me expresé mal yo. Esto es lo que quiero: si un guardia ve al jugador
sin cobertura y yendo en dirección hacia él, su prioridad será disparar una
ráfaga de cinco balas a quemarropa. Si el guardia está sin cobertura,
disparará la ráfaga mientras se mueve a una. Si el guardia ya está contra una
cobertura, sólo hará la ráfaga")*

Las dos vueltas anteriores giraban alrededor de la DISTANCIA (42px,
`coverMinDistance` reusado). Esta definición no habla de distancia en ningún
lado: habla de tres condiciones que se cumplen a la vez —te ve, estás
expuesto, venís hacia él— y de que la ráfaga se vuelva "a quemarropa" sola,
porque el jugador sigue acercándose mientras dispara. Hubo que sacar el
número fijo y reemplazarlo por las tres condiciones de verdad.

**Las tres, tal como las pidió Santi:**

1. `engaged` — el guardia te ve, ahora (no "te vio hace rato").
2. `!isHidden(player)` — estás expuesto (reusa el concepto que ya existía
   para decidir si un guardia parapetado puede tirarte dinamita).
3. **Venís CAMINANDO hacia él** — no apuntando hacia él. Con mouse+WASD se
   puede aimear para un lado y correr para otro, así que hubo que agregarle
   al jugador un campo nuevo, `p.moveDirX/Y` (entities/player.js): el vector
   unitario de hacia dónde CAMINA, actualizado en `updateFree`, y puesto en
   cero mientras se desliza pegado a su propia cobertura (eso no es cargar a
   nadie). Se compara con la dirección hacia el guardia vía coseno; el
   umbral (`panicoCoseno: 0,3`, ±72°) es un primer número sin medir, anotado
   como tal en el propio config.

**La respuesta ahora depende de si el GUARDIA tiene dónde esconderse, no de
una distancia:**

| Situación del guardia | Respuesta |
|---|---|
| Sin cobertura (buscándola o yendo hacia ella) | Dispara MIENTRAS camina — no abandona el plan, lo hace a la vez |
| Ya en cobertura | Sólo dispara — nada de esconderse entre ráfaga y ráfaga |

#### 🐛 Dos bugs de ejecución, encontrados midiendo — ninguno era de diseño

**1. El vector estaba invertido.** La primera implementación calculaba
`dx = player.x - e.x` ("del guardia hacia el jugador") cuando lo que hacía
falta para comparar contra `moveDir` era "del jugador hacia el guardia"
(`e.x - player.x`). Con el signo al revés, el coseno daba NEGATIVO
exactamente cuando el jugador cargaba de verdad — el pánico nunca se
activaba, y encima parecía un fallo silencioso porque el resto de la lógica
corría sin errores. Encontrado trazando el coseno cuadro a cuadro contra la
distancia real (que sí bajaba, confirmando que el jugador SE ACERCABA
mientras el coseno decía que no).

**2. El módulo estaba cacheado en la pestaña del navegador.** Después de
arreglar el signo, una medición "confirmaba" que ya andaba — pero la
siguiente, en la MISMA pestaña sin recargar, volvía a dar `engaged: false`
todo el tiempo. La pestaña había cargado `systems/ai.js` una sola vez al
principio de la sesión; mis `import()` sueltos en cada prueba sí traían el
archivo fresco del disco, pero el bucle real del juego (`S.scenes.update`)
seguía corriendo con el módulo viejo en memoria. Cerrar la pestaña y abrir
una nueva resolvió la desincronización.

> **Dos trampas de medición para la lista, ninguna nueva en espíritu pero
> vale nombrarlas:** (a) cuando algo debería estar pasando y no pasa, trazar
> la condición exacta cuadro a cuadro contra un dato independiente que sí se
> sabe que cambia (acá, la distancia real) separa "la condición nunca se
> cumple" de "la condición se cumple pero algo después no reacciona"; (b) en
> una sesión larga de pruebas por consola, un módulo importado al principio
> puede sobrevivir varias ediciones del archivo sin que la pestaña se entere
> — si una medición contradice a la anterior sin que el código haya cambiado
> entre una y otra, sospechar del caché del módulo antes que del código.

**Verificado, ya con las tres condiciones y los dos bugs corregidos, en
pestaña nueva:**

- Jugador cargando derecho desde 150px: `engaged` y `enPanico` se activan
  apenas hay línea de vista real (no antes), ráfaga de 5 confirmada,
  disparos tanto en tránsito hacia la cobertura como ya asentado.
- Jugador QUIETO (`moveDir = (0,0)`): nunca dispara la ráfaga de pánico —
  confirma que el gesto se lee del movimiento, no de la proximidad ni de la
  mira.
- Corrida completa de regresión en los tres tipos de tren y con la escolta
  del Sheriff (que sigue turnándose, cupo respetado): sin errores.

---

## ✅ HECHA · El repliegue del herido — el guardia con un tiro de vida se saca del medio, y el compañero lo tapa

*(idea de Santi, la número 1 de la conversación sobre "matar conos": "que un
guardia con poca vida y un compañero cerca se repliegue mientras el otro lo
cubre")*

Es la **segunda de las tres conductas** de esa conversación. La 3 (ráfaga de
pánico) ya estaba; la 2 (rendirse de rodillas) sigue sin construir. Las tres
atacan lo mismo: hasta acá un guardia peleaba **exactamente igual** con la vida
llena que con el último punto, solo que acompañado.

### Lo que hace

Cuando a un guardia le pegan y le queda **1 de vida**, si tiene un compañero
despierto a menos de **90px**, se da vuelta y camina por el pasillo alejándose
de vos — **sin disparar** — hasta ponerse a 110px o hasta que se le acaben 3
segundos. Al compañero se le enciende `cubriendoTimer`, que mientras dure lo
vuelve `defensivo`: **no avanza, sostiene la posición disparando.**

Pasa **una sola vez por guardia** (`yaSeReplego`). Sin ese tope, un guardia con
1 de vida al que rozás dos veces entraría y saldría del repliegue todo el
asalto, y eso no se lee como miedo sino como una IA en un bucle.

### Lo que se reusó, que era casi todo

| Pieza | De dónde salió |
|---|---|
| Detectar el golpe | `reaccionarAlGolpe` del Cazarrecompensas: comparar la vida contra el cuadro anterior en vez de engancharse a `damageEnemy` — así la bala, el cuchillo y la dinamita disparan lo mismo **sin tocar combat.js, melee.js ni explosives.js** |
| El que cubre | `defensivo`, la misma marca que llevan los tres guardias del Sheriff. Se agregó `esDefensivo(e)` para que las dos ramas que lo consultan (`doCombat` y `doInvestigate`) no se puedan desincronizar |
| Caminar sin disparar | `reagruparse` (systems/sheriff.js), con el mismo argumento: mientras se va está expuesto, y ésa es tu ventana para castigarlo |
| Ir por el eje del pasillo | La lección de `puestoDeEscolta`: **el tren es un CORREDOR**. Retroceder "en dirección opuesta al jugador" a secas lo mandaría contra una fila de asientos cada vez que lo tengas de costado |

### La señal es el cuerpo, y no se dibujó nada

No hay ícono ni marca nueva sobre la cabeza, a propósito. Un guardia rojo que
te da la espalda y camina para el otro lado **sin tirar un tiro** ya dice todo.
El juego reserva los avisos dibujados para lo que te puede lastimar (la mecha,
la embestida, el arma levantada), y esto es lo contrario de un peligro. **Queda
para que Santi lo juzgue jugando**: si no se lee, la señal más barata sería el
`alertMark` que ya existe.

### 🔍 Lo que dijeron los números — y el hallazgo no fue sobre el código

Medido con corridas completas en los tres tipos de tren:

| | |
|---|---|
| Guardias que llegaron a 1 de vida (17 casos, 5 asaltos) | **Sólo 3 tenían un compañero a menos de 90px** |
| En el tren de carga | **0 de 5** — y es correcto: es el tren de "guardias sueltos, mucho espacio", su identidad escrita |

Ese resultado no tenía sentido, así que **se trazó contra un dato
independiente**: la distancia de cada guardia a su vecino más cercano, al
empezar el asalto, sin matar a nadie. Y ahí apareció lo interesante — **el tren
reparte a los guardias en dos poblaciones, con un hueco limpio en el medio:**

```
23  23  23  23  23  23  32  32  45  45  45  45  66  82  │  145 145 145 145 ...
        ── viajan en grupo: 14 de 47 (30%) ──           │   ── viajan solos ──
                                            el hueco ───┘
```

**Nada entre 82 y 145 px.** O sea que 90 cayó justo en el hueco natural del
tren, y **subirlo no sirve de nada**: a 120 el resultado es idéntico (14/47), y
a 150 sólo suma guardias que están a casi un vagón de distancia, que no es "un
compañero al lado". El número no hay que tocarlo.

**Y la conclusión de diseño es mejor que el número:** esta conducta le toca al
**30% del tren, el que viaja acompañado**. El otro 70% no queda sin conducta
por un bug — es exactamente la población que le corresponde a **la idea 2
(rendirse de rodillas)**, que sigue pendiente. Las dos ideas de Santi se
reparten el tren sin pisarse, y eso no se sabía hasta medirlo.

### 🐛 Dos veces el arnés de prueba mintió, y las dos son las de siempre

1. **"Dispara 4 balas mientras se retira".** El contador filtraba las balas por
   distancia al herido, y el herido **pasa caminando al lado del compañero**
   justo mientras éste dispara cubriéndolo. Medido de nuevo sobre el estado del
   propio guardia (`aimTimer`/`burstLeft`/`peeking`/los timers de puerta y
   techo): **0 violaciones en 62 cuadros**. Las balas eran del que cubría, que
   es exactamente lo que tiene que pasar.
2. **"Casi ningún guardia tiene compañero".** El piloto de prueba avanzaba
   barriendo de a un guardia por vez, así que cuando uno quedaba herido **sus
   compañeros ya estaban muertos: los había matado él antes**. El piloto
   construía sin querer el peor caso posible para este sistema.

### Verificado

- **Aislado:** se activa al instante, camina a 46 px/s (= `speed`), corta al
  cruzar los 110px. El compañero queda **clavado en su x** durante los 3
  segundos de cobertura y recién ahí vuelve a avanzar hacia el jugador.
- **Sin compañero cerca: no se repliega** (confirmado con el compañero movido a
  400px).
- **Una sola vez por guardia:** segundo golpe con 1 de vida → no se repite.
- **Corridas completas** en estándar/carga/veloz, dificultades fácil y media:
  sin errores de JS, sin guardias trabados, sin estados imposibles.
- **Tiroteo contra un grupo** (el caso donde el sistema tiene que aparecer): se
  activó en las 3 corridas, y en una salió **el intercambio completo** — uno se
  repliega y el otro cubre; dos segundos después se invierten los roles, porque
  al que cubría le tocó el balazo.
- Un caso medido en dificultad media: el repliegue duró **0,38 s y el guardia
  murió igual**. Está bien que pase: no es un escudo, es una reacción. Si le
  seguís tirando, se muere.

**Lo que falta: que Santi lo juegue.** Está verificado por consola de punta a
punta, pero nadie lo vio todavía con los ojos.

### 🐛 CUARTA VUELTA · "No se repliega hasta una cobertura más atrás" — tres errores encadenados

*(Santi: "el guardia no se reacomoda. No se repliega hasta una cobertura más
atrás. No sé cuál será el problema, pero analizá el código y encontrá el error o
los errores")*

Tenía razón en el plural: **eran tres**, y el arreglo de la tercera vuelta
(dejarlo `defensivo`) sólo había tapado uno de los caminos.

| # | El error | Medido |
|---|---|---|
| **1** | `destinoDeRetirada` **nunca buscaba una cobertura**: devolvía un punto del eje del pasillo (`techo.centroY`) a 110px | El repliegue terminaba SIEMPRE al descubierto, en el lugar más expuesto del vagón |
| **2** | Al terminar, el buscador normal lo traía de vuelta: `findCoverPoint` puntúa `abs(distToTarget − 80)`, o sea **su cobertura ideal está a 80px del jugador** | Guardia replegado a 110 → cobertura elegida **a 45px**. Caminaba 65px hacia adelante "para cubrirse" |
| **3** | `findCoverPoint` descarta todo lo que quede a más de `viewDistance` (118) del jugador | Una cobertura de repliegue lejana era **estructuralmente imposible** de elegir |

**Los tres son el mismo malentendido**, y por eso vale la pena el resumen: todo
el sistema de coberturas del juego estaba escrito para contestar *"¿a qué
baldosa voy para tirarle bien a ese tipo?"*, que es una pregunta que **acerca**.
El repliegue necesitaba la contraria — *"¿a qué baldosa me arrastro para que no
me rematen?"* — y yo lo até al buscador que hacía justo lo opuesto.

**El arreglo: `findCoverAtras` (systems/cover.js)**, un buscador propio que
comparte todo con el normal (el escudo a 13px, el `findPeek`, el respeto por la
cobertura ajena) y cambia sólo las tres cosas que importan: **mira únicamente
baldosas que lo alejen**, no tiene tope de `viewDistance` (se está escondiendo,
no buscando ángulo) y puntúa premiando la distancia ganada en vez de castigarla.
Lo usan las dos puntas: el destino del repliegue y, de ahí en más, cualquier
cobertura que ese guardia elija.

Y el fin de la retirada dejó de medirse en píxeles: **si el destino es una
cobertura, la meta es LLEGAR**. Antes el corte por `repliegueDistancia` la
terminaba a un paso del asiento — la otra mitad literal de *"no termina de
llegar"*.

#### 🐛 Y un cuarto, que me lo comí yo al arreglar los otros tres

Con el buscador nuevo puesto, `repositionAfter` (7 s) lo mandaba a buscar otra
cobertura — y como para un replegado sólo valen las que lo alejan, **se iba
retrocediendo en escalones cada siete segundos**: medido, 130 → 149 → 167 px,
hasta quedarse sin ninguna, caminando de espaldas para siempre.

**Replegarse es UN movimiento, no una huida permanente.** Ahora el que se
replegó sólo busca cobertura si no tiene: se mete detrás de algo y ahí se queda.
Perdió el terreno, no lo recupera — y tampoco sigue cediendo.

#### Verificado

| | Antes | Ahora |
|---|---|---|
| Dónde termina | volvía a **92px**, sin cobertura | **128px**, dentro de una cobertura, en 1,6 s |
| Después de cubrirse | se acercaba 19px | deriva de 11-30px, **siempre alejándose** |
| Replegados sin cobertura | la mayoría | **0** en 6 asaltos completos |

Seis asaltos completos en los tres tipos de tren: **0 errores, 0 trabados**, y la
dificultad se mantiene en su rango (6,0 impactos por asalto; 5,2 antes del
arreglo, 6,3 con el sistema apagado). **Sin regresión del Sheriff**: su cuarteto
conserva el cupo de 2 exacto, con 937 cuadros de asomadas observadas.

> **La lección:** cuando una conducta nueva reusa un sistema viejo, hay que
> preguntarse qué pregunta contesta ese sistema — no si "hace algo parecido".
> `findCoverPoint` y el repliegue querían cosas opuestas, y compartir código
> entre los dos no era ahorro: era un bug esperando a que alguien jugara.

### 🐛 TERCERA VUELTA · "Se devuelve a exactamente donde estaba" — dos sistemas tirando del mismo guardia

*(Santi, jugándolo: "cuando un guardia se repliega es como que no termina de
replegarse. Camina hacia la cobertura de atrás pero no termina de llegar y ya se
devuelve a exactamente donde estaba")*

**La causa, medida cuadro a cuadro:** la retirada termina en
`repliegueDistancia` (110px) y ahí `doCombat` retoma el mando, ve que `110 > 92`
y **lo camina de vuelta hasta los 92px** — el umbral de acercamiento que esa
función ya tenía desde siempre.

```
se aleja hasta 111  →  vuelve a 92 y se queda clavado ahí, SIN cobertura
                       19 px de retroceso deshecho, delante de tus ojos
```

El 110 estaba elegido del lado equivocado de un número que ya existía: se miró
`spreadFarDistance` (130) y no se miró este 92. **Dos sistemas tirando del mismo
guardia para lados opuestos** — y el que ganaba era el viejo.

**Se arregló con la conducta, no con el número.** Subir los 110 por encima de 92
lo haría caminar menos de vuelta, pero seguiría caminando de vuelta. Un tipo que
se acaba de quebrar y salir del tiroteo **no vuelve a cargar de frente**: al
terminar el repliegue queda `defensivo` para siempre, o sea pelea parapetado
desde donde llegó y no avanza nunca más. Es la marca que ya usaban la escolta
del Sheriff y el que cubre, ahora también como **la cicatriz de haberse
replegado** — la única que no se apaga.

Y le da al jugador algo concreto por haberlo herido: **ese guardia deja de
presionarte.** Sigue tirando, pero ya no te viene encima.

**Verificado:** se mantiene a 110-113px en vez de volver a 92 (medido con la
misma prueba que encontró el bug). A los ~7 segundos puede moverse a otra
cobertura, pero eso es `repositionAfter`, la reubicación normal de cualquier
guardia estancado, no el bug. Seis asaltos completos después del arreglo: **0
errores, 0 guardias trabados, y la dificultad no se movió** (5,2 impactos por
asalto contra 5,0 antes del arreglo).

> **La lección, que es la misma de siempre en este proyecto:** el número nuevo no
> se eligió contra los números que ya gobernaban al mismo personaje. `doCombat`
> tenía un 92 escrito hace vueltas, y ningún comentario nuevo lo mencionaba.
> Antes de elegir una distancia para un guardia, hay que leer todas las
> distancias que ya lo mueven.

### 🐛 SEGUNDA VUELTA · Santi lo jugó y no lo vio nunca — y el hallazgo es más grande que esta conducta

*(Santi: "acabo de hacer un asalto y no vi en ningún momento que un guardia se
haya replegado herido")*

Descartado primero lo barato: el archivo servido y el que corre en memoria
tienen el código nuevo, con los cuatro números correctos. No era caché.

**El disparador está mal elegido, y es el MISMO error que ya se cometió dos
veces con la ráfaga de pánico** (ver más arriba: *"exigía estar a menos de 42px,
y por eso nunca disparaba: para cuando el jugador cruzaba esa línea, muchas
veces ya lo había matado"*). Medido ahora:

| | |
|---|---|
| Guardias que mueren en **menos de 1 s** desde que quedan en 1 de vida | **16 de 22** (mediana 0,82 s; el caso más común, 0,28 s) |
| Lo que camina un herido en 0,42 s | **19 px**. Invisible |

Pero al medir las alternativas (replegarse con el primer daño, replegarse al ver
caer a un compañero) **todas daban CERO también**. Eso no tenía sentido, así que
se trazó contra un dato independiente: **quién hay vivo alrededor del herido, en
el instante exacto en que queda en 1 de vida.**

```
En 14 de 18 casos: NADIE vivo a menos de 150 px  ── con 5 a 17 guardias
                                                     todavía vivos en el tren
```

Y una medición más, definitiva: muestreando guardias en combate durante 64
segundos de tiroteo real, **258 de 258 muestras eran de un guardia peleando
SOLO**. Nunca dos a la vez.

**El juego no tiene la culpa, y se probó:** con el jugador plantado, la alarma
sonando y **sin disparar un solo tiro**, sí se juntan — hasta 4 guardias en
combate simultáneo en el tren veloz, 2 en el estándar y en el de carga, con
pares a menos de 90px. El tren SABE juntar gente.

**Lo que rompe los grupos es la velocidad a la que el jugador mata.** Dos tiros
de Colt son 0,42 s: cada guardia muere antes de que el siguiente llegue a
entrar en combate. Los pares que existen al empezar el asalto (30% del tren,
medido en la vuelta anterior) están rotos para cuando llegás: al primero lo
mataste, y el otro queda a más de 150px.

#### La conclusión incómoda, y vale más que la feature

**Esta conducta no puede resolver el problema que la motivó, porque depende de
que el problema no exista.** Santi lo describió así: *"me acerco, disparo dos
tiros, lo mato, y sigo"*. El repliegue necesita dos guardias vivos peleando a la
vez; ese patrón garantiza que nunca haya dos.

Y de ahí sale la lectura que ordena las tres ideas de la conversación original:

> **El combate real de Forajido es una sucesión de duelos 1 contra 1** — 258 de
> 258 muestras. La conducta que el juego necesita para que un guardia deje de
> sentirse un muñeco es la del guardia **SOLO**: o sea **la idea 2, rendirse de
> rodillas**, que sigue pendiente. El repliegue le habla al 22% de los casos; la
> rendición, al 78%.

**Decisión de Santi:** hacer que los guardias peleen de a dos — la opción que
ataca la causa. Ver la sección siguiente.

---

## ⚠️ CONSTRUIDA PERO SIN CONFIRMAR · "Ninguno entra solo", y la lección del arnés que se comió la premisa

*(decidido con Santi: de tres opciones, eligió "hacer que los guardias peleen de
a dos" sabiendo que era la que tocaba el balance medido de la fase 2)*

### Lo que se construyó

**Ningún guardia cruza solo la puerta del vagón donde estás.** El que llega
primero se planta en su vagón —parapetado, como ya hacen los de adelante desde
que existe `alertaEnGuardia`— hasta **4 segundos** (`esperaCompanero`, el mismo
número que `suspicionMemory`). Si llega un compañero, **entran juntos y se
turnan para asomarse**; si no llega nadie, entra igual y **no vuelve a esperar
en toda la partida** (`yaEsperó`).

Y el que se planta **llama**: `llamarCompaneros` despierta a los guardias
dormidos a menos de 120px. Salió de medir que, de 13 esperas, **5 tenían un
compañero al lado que seguía durmiendo** (4 patrullando, 1 investigando). Es un
grito más, con el mecanismo de gritos que ya existía, y de alcance corto a
propósito (120 y no los 320 de `shoutRadius`): llama al de al lado para cruzar
una puerta, no da la alarma general — quedarse callado tiene que seguir sirviendo.

**No hay una rama de movimiento nueva.** Lo único que hace el sistema es
encender `esperandoCompanero`, que `esDefensivo` convierte en la conducta
defensiva ya construida. Y `MAX_ASOMADOS` pasó a ser `cupoDeAsomados`, la mitad
del grupo redondeando arriba: **el cuarteto del Sheriff conserva su 2 exacto**
(verificado), y una pareja pasa a tener 1 — sin eso los dos miembros de un dúo
se asomaban a la vez y nadie cubría a nadie, que era justo lo que la pareja
venía a resolver.

### 🐛 LA LECCIÓN GRANDE · El arnés de prueba se comió la premisa entera

**El "258 de 258 guardias peleando solos" que motivó todo esto no es un hecho
del juego: era un artefacto del piloto de prueba.** Se descubrió recién al
querer medir el después contra el antes.

La métrica "% de guardias que pelean acompañados" da resultados que **cambian de
signo** según cómo esté configurado el piloto, con el MISMO código:

| Piloto | Sistema apagado | Sistema encendido |
|---|---|---|
| Avanza y muere (el original) | **0%** acompañado | 17% |
| Avanza, inmortal (corridas de 80 s completas) | **52%** acompañado | 37% |

O sea que con un jugador que sobrevive y se queda en la pelea, **ya había 52% de
peleas acompañadas antes de tocar una línea**. El 0% original salía de que el
piloto moría o mataba tan rápido que la corrida se cortaba antes de que nadie se
juntara.

> **La regla que ya estaba escrita en PROMPT-CONTINUAR y que igual hubo que
> volver a aprender:** *sospechá del arnés de prueba tanto como del código*. Acá
> el arnés no dio un número equivocado en un detalle — **inventó el problema
> entero**, y sobre ese problema inventado se tomó una decisión de diseño.

### Lo que SÍ quedó medido con confianza

- **No sube la dificultad.** Impactos recibidos por asalto, 8 asaltos por
  variante, piloto inmortal (así todas las corridas duran lo mismo y son
  comparables): **6,3 apagado · 5,3 esperando sin llamar · 5,0 con todo**. Si
  algo, baja un poco — los que esperan son guardias que no están encima tuyo.
- **Sin errores de JS, sin guardias trabados, sin estados imposibles** en todas
  las corridas de las tres variantes.
- **Sin regresión del Sheriff:** su grupo sigue siendo de 4, los cuatro
  defensivos, asomándose dentro de su cupo de 2 (802 cuadros de asomadas
  observadas, nunca más de 1 a la vez por el ritmo natural de los `holdTimer`).

### Las dos perillas, y cómo apagarlo

| | |
|---|---|
| `enemy.esperaCompanero` | Segundos que espera antes de entrar solo. **En 0 el sistema queda apagado** |
| `enemy.radioLlamado` | Alcance del llamado. **En 0 espera igual, pero no despierta a nadie** — es la forma de volver al balance previo sin desarmar nada |

### ⚠️ Lo que falta, y es lo único que puede cerrar esto

**Que Santi lo juegue.** No hay ninguna medición por consola que pueda decidir
esto: se probó, y la métrica depende más del piloto que del código. La pregunta
—*¿se siente que peleás contra una situación y no contra muñecos?*— es
exactamente del tipo que sólo se responde jugando.

---

## ✅ HECHA · La mira, vuelta seis: el círculo pasó de predecir el tiro a describir el arma

*(Santi: "cuando el círculo está más cerca tuyo o más lejos, debería ser del
mismo tamaño. No porque vos muevas el círculo más cerca del personaje
aumentaría la mira. El círculo mide una posible dispersión. Por más de que
vos tengás el círculo cerca tuyo, la dispersión sin apuntar debería ser la
misma")*

Todas las vueltas anteriores de la mira (segunda a cuarta, más arriba)
defendieron una idea: *"el círculo es la dispersión real, no una figura que
la representa"* — el radio era literalmente `tan(dispersión) × distancia al
punto donde apuntás`, así que apuntar lejos abría el círculo porque a esa
distancia la misma dispersión angular cubre más terreno. Eso era físicamente
correcto, y por eso predecía bien la chance real de acierto a cada distancia
(lo que se verificó con Monte Carlo en la cuarta vuelta).

**Santi pidió lo contrario a propósito: que el círculo deje de proyectarse al
punto donde apuntás y pase a describir el arma.** No es un capricho estético
— es una decisión de qué pregunta responde el círculo. Antes contestaba *"si
disparo AHORA, a ESTE punto, ¿qué tan bien va a salir?"*. Ahora contesta
*"¿qué tan sucia es esta arma, en este estado, en general?"* — una medida
fija, no una proyección puntual.

**El cambio es puramente de DIBUJO — la mecánica real no se tocó.**
`dispersionActual()` (entities/player.js), la función que de verdad decide
hacia dónde se desvía la bala en `shoot()`, sigue exactamente igual: el tiro
real sigue siendo más fácil de acertar de cerca que de lejos, como siempre.
Lo único que cambió es `drawMira` (scenes/raidScene.js): en vez de medir la
distancia real hasta `world.aimX/aimY`, usa siempre `CONFIG.mira.
distanciaReferencia` — un número fijo. El círculo sigue seteado sobre el
punto donde apuntás (se mueve con el mouse, como siempre), pero su TAMAÑO ya
no depende de qué tan lejos esté ese punto.

**El número, elegido con Santi entre tres opciones (80/120/160px), fue
120px** — la distancia típica de combate medida en esta misma sesión, cuando
se afinó la hitbox de los guardias unas vueltas atrás. No es un número nuevo
inventado para esto: es el mismo que ya se había usado como referencia de
"distancia de tiroteo normal".

**Datos actuales de cada arma** (los que pidió Santi, con el radio ya fijo a
120px):

| Arma | Dispersión suelta | Dispersión apuntada | Radio dibujado (siempre) |
|---|---|---|---|
| **Colt** | 0,035 rad | 0,0175 rad | 4,2px suelto → 2,1px apuntado |
| **Smith** | 0,085 rad | 0,0425 rad | 10,2px suelto → 5,1px apuntado |

**Lo que se pierde, dicho explícitamente porque es la otra cara de la
decisión:** el círculo ya no predice la chance real de acierto en el punto
exacto donde apuntás — un tiro a 40px y uno a 200px muestran el mismo círculo
aunque el segundo falle mucho más seguido (eso lo demostró la medición Monte
Carlo de la cuarta vuelta, y sigue siendo cierto por debajo, sólo que ya no
se ve). Es la decisión correcta si lo que se quiere comunicar es "así de
preciso es este revólver", y la decisión incorrecta si se quiere seguir
leyendo "esta bala en particular va a pegar o no" — Santi eligió lo primero,
con el argumento explícito de que el círculo mide al arma, no al tiro.

**Lo que NO cambió, y sigue funcionando igual:** el balanceo del tren veloz
(`traqueteo.dispersionExtra`) sigue abriendo el círculo en tu cara —eso
describe el arma EN ESE INSTANTE, que es justo lo que el círculo ahora
representa— medido: 4,2px en calma → 11,4px durante el sacudón.

**Verificado:** el radio dibujado da exactamente 4,2px apuntando a 40, 80,
120, 200 o 300px (cinco mediciones, mismo número); el traqueteo lo sigue
abriendo; capturado con `foto.ps1` apuntando a 40px y a 200px — mismo círculo,
mismo tamaño, sólo cambia de posición. 90 segundos de asalto en los tres
tipos de tren, sin errores.

### ✅ VUELTA SIETE · El círculo dejó de ser una garantía matemática

*(Santi, jugando la vuelta seis: "el círculo es literalmente del tamaño del
guardia, en realidad hasta más pequeño. Entonces no importa la dispersión,
porque yo pongo el círculo del arma 'dentro' del guardia y es un tiro
asegurado")*

**Medido antes de tocar nada, y el número era contundente:** el Colt apuntado
da un círculo de 2,1px a 120px; el guardia mide 4,5×3,5. El círculo entraba
entero adentro de la caja. Eso no era una sensación — era literal: el máximo
de la dispersión uniforme (`rng.spread`) coincidía EXACTO con el radio
dibujado, así que ningún ángulo posible dentro de lo que el arma podía tirar
caía afuera del guardia. Apuntar bien con el Colt no era "muy probable que
pegue": era matemáticamente imposible que fallara.

**Se le ofrecieron tres salidas** (dejarlo así porque es la identidad del
Colt / agrandar el círculo en general / rebalancear el arma de verdad) y
Santi propuso una cuarta, mejor que las tres: *"¿y si hacemos que la
dispersión de las balas de cualquier arma en realidad pueda salir del
círculo? El círculo es una idea de lo que puede pasar, no una garantía."*

**La pieza nueva es una función, no un número:** `rng.spreadDeTiro(amount, p,
mult)` en `engine/rng.js`, al lado de `spread()` pero sin tocarla —
`spread()` la sigue usando la cámara y la deriva de los jinetes, cosas que no
son un gatillo, y tocarla ahí las habría cambiado también sin que nadie lo
pidiera. `spreadDeTiro` hace lo mismo que `spread` la mayoría de las veces
(uniforme entre −amount y +amount), pero con probabilidad `p` cambia `amount`
por `amount × mult` para ESE tiro — sigue siendo uniforme adentro del rango
que le toque, sólo que a veces el rango es más ancho y nunca se dibuja.

**Los números, elegidos entre tres intensidades con el efecto medido en el
Colt apuntado a 120px:** `fallaChance: 0,15`, `fallaMultiplicador: 2,5`.

**Verificado con 2000 tiros por caso** (mismo método Monte Carlo de toda la
sesión):

| | Sin falla (antes) | Con falla (ahora) |
|---|---|---|
| **Colt apuntado @120px** | 100% | **95%** |
| Colt suelto @120px | 77,7% | 77,1% (ya tenía margen real, casi no cambia) |
| Smith apuntado @120px | ~100% | 62,6% |

El Colt apuntado sigue siendo, por lejos, el arma más precisa del juego —no
se le tocó un solo número de precisión— pero "más precisa" dejó de significar
"infalible". Uno de cada veinte tiros perfectos, con el círculo puesto
adentro del guardia, ahora puede irse igual.

**Parejo para todos, no sólo el jugador.** Se aplicó en los cuatro lugares
donde de verdad hay un gatillo: `shoot()` (jugador), `fire()` (guardias),
`soltarBala()` (el Cazarrecompensas) y el disparo de los jinetes. Los
disparos ciegos por puerta/techo (`ai.js`) quedaron afuera a propósito: ésos
ya representan "no apunto con cuidado" con su propia dispersión enorme —
sumarles la falla encima hubiera sido pegarle a un sistema que ya cuenta la
misma historia.

**Nada se dibuja para anunciarlo, a propósito.** Si el círculo mostrara "esto
puede fallar 15% de las veces" volvería a ser una promesa exacta — la
lectura que Santi pidió sacar. El círculo sigue siendo la referencia correcta
la mayoría de las veces, y por eso vale la pena seguir mirándolo; deja de ser
un seguro.

**Verificado:** Monte Carlo confirma el 95% esperado en el Colt apuntado; 90
segundos de asalto en los tres tipos de tren sin errores; el Cazarrecompensas
(que tarda 35s en aparecer — hubo que esperarlo, no un bug) dispara con
normalidad usando el mismo mecanismo.

### ✅ VUELTA OCHO · El retroceso — cada disparo ensucia el próximo, un rato

*(idea de Santi: "que al disparar haya un pequeño retroceso, dependiendo el
arma, que agrande el círculo tanto apuntando como sin apuntar. Obvio que
apuntando el retroceso va a ser menor")*

Mismo mecanismo que el traqueteo del tren (`world.dispersionExtra`, se suma a
`dispersionActual()` y se ve en el círculo Y afecta la bala real a la vez),
aplicado ahora por CADA disparo tuyo en vez de por el vagón entero. No hizo
falta un sistema nuevo, sólo una fuente más para el mismo sumador.

**Dos preguntas, dos respuestas, decididas por separado con Santi:**

1. **¿Cuánto agranda un solo disparo?** El 50% de la propia dispersión suelta
   del arma — mismo porcentaje que ya usa "apuntar corta la dispersión a la
   mitad" (`spreadApuntado`), así que no es un número nuevo suelto, es la
   misma proporción aplicada de vuelta. `retroceso` vive en cada arma
   (`weapons.js`), como el daño o la cadencia: Colt 0,0175, Smith 0,0425.
2. **¿Por cuánto tiempo?** *"No solo es cuánto, sino por cuánto tiempo"* —
   Santi marcó explícitamente que la duración necesitaba su propia decisión,
   no una que yo asumiera. `retrocesoDecayTiempo: 0,40s`, elegido porque es
   EXACTAMENTE la cadencia del Colt (`fireRate`). No es casualidad: a su
   ritmo normal, el retroceso de un tiro termina de bajar justo cuando sale
   el siguiente.

**Lo que sale de esa elección, y es la parte más interesante:** el Colt
disparado con calma **nunca acumula** — cada tiro sale limpio. El Smith
(0,28s entre tiros, más rápido que el decaimiento de 0,40s) **sí acumula,
aunque lo dispares a su propio ritmo natural**, sin apurarte. Es la otra cara
de ser "mano rápida": lo que gana en cadencia lo pierde en pulso, sin que
haga falta escribir esa regla en ningún lado — sale sola de dos números que
ya estaban puestos por otros motivos (la cadencia de cada arma, la duración
del retroceso).

**Apuntando pesa la mitad** (mismo `kick × (1 - 0,5 × p.apuntado)`, la misma
regla de `spreadApuntado`), interpolado por `p.apuntado` en vez de un salto
seco, para que no cambie de golpe justo cuando la mira termina de cerrarse.

**Un detalle técnico que no era parte de la sensación, pero había que
resolver:** sin un tope, vaciar un cargador más rápido de lo que decae (el
Smith, o una ráfaga de pánico) podía acumular retroceso sin límite.
`retrocesoMax: 0,12` — unas tres veces el kick del Smith — es sólo una red de
seguridad técnica, no una decisión de sensación.

**Verificado por consola:**

| | Medido |
|---|---|
| Kick del Colt suelto | 0,0175 exacto (0,035 → 0,0525 justo después de disparar) |
| Kick del Colt apuntado | 0,00875 exacto (la mitad) |
| Colt a su ritmo normal, 5 disparos seguidos | 0,0175 en los cinco — nunca sube |
| Colt en ráfaga rápida, 8 disparos seguidos | 0,0175 → 0,0343 → ... → topea en 0,12 |
| Smith a SU ritmo normal, 6 disparos seguidos | 0,0425 → 0,0531 → 0,0638 → 0,0744 → 0,085 → 0,0956 — sube solo |

Mirado con `foto.ps1`, con zoom sobre el círculo: se ve claramente más grande
en el cuadro de justo después de disparar que en el de antes. 90 segundos de
asalto en los tres tipos de tren, sin errores.

**Alcance:** sólo el jugador. A diferencia de la falla del pulso (vuelta
siete), que se aplicó parejo a guardias, jefe y jinetes porque Santi lo pidió
para "cualquier arma", este pedido fue específicamente sobre disparar vos
("al disparar haya un pequeño retroceso") — los guardias ya tienen su propio
lenguaje de cadencia (`burstDelay`, `fireCooldown`) y no se tocó.

---

## ✅ HECHA · El Sheriff, jugado por primera vez: cuatro cosas rotas y la peor no era suya

*(Santi, después de jugarlo con la recompensa forzada a 600)*

La primera vez que se juega un sistema "verificado por consola" aparecen las
cosas que ninguna medición aislada podía ver. Salieron cuatro, y **la más grave
no tenía nada que ver con el Sheriff**: estaba en los guardias de todo el
juego, desde hacía rato, y se destapó porque perseguir a alguien te hace cruzar
muchas más puertas que un asalto normal.

### 🐛 1. Las ráfagas largas que mataban a los propios guardias

> *"Hay veces que hacen ráfagas largas de disparo, cuando sólo deberían hacerlo
> cuando se encuentran con una puerta y saben que el jugador está del otro
> lado. Estas ráfagas terminan matando a los guardias."*

**El diagnóstico correcto tardó tres mediciones, y las dos primeras se
equivocaron de sospechoso.** Vale anotar el camino entero porque el error es
repetible.

La primera hipótesis fue *"el disparo ciego por la puerta no revisa si hay un
compañero en la línea"* — que es CIERTO (`dispararACiegasPorPuerta` nunca
llamaba a `allyInLine`, a diferencia del disparo normal) y sonaba a causa
suficiente: cinco balas con `doorSpread` 0,6, el doble de sucio que cualquier
otro tiro del juego, por un pasillo donde los guardias caminan en fila.

**Y el A/B lo desmintió.** El mismo escenario 5 veces con el chequeo de
compañeros puesto y 5 veces sin él (`allyBlockRadius = 0` como proxy) dio
**17 muertos por fuego amigo contra 19**. Prácticamente idéntico. O sea que el
arreglo era correcto y no era EL arreglo.

**La tercera medición fue la que sirvió, y fue contar la SITUACIÓN en vez de
contar los muertos.** Reproduciendo desde la consola el filtro que usa la IA,
sobre un piloto que huye hacia la cola cruzando vagones:

| | |
|---|---|
| Veces que se dio "una puerta es lo único que me tapa" | **527** |
| De ésas, a más de 198 px del punto al que apuntaba | **517 (98%)** |
| Cortadas por tener un compañero en la línea | 0 |
| El caso legítimo (la puerta que tenés al lado) | **10** |

**El 98% de las ráfagas ciegas del juego eran tiros hacia un lugar al que la
propia bala nunca llegaba.** La causa es geométrica y por eso no se veía: el
tren es un pasillo recto, así que *"lo único que me tapa es una puerta"* se
cumple igual con una puerta a tres vagones, y `e.lastSeen` puede ser viejísimo.
El guardia vaciaba cinco balas por el corredor hacia un punto lejano, las balas
morían a los 198 px (`viewDistance + 80`, su alcance real)… encima de sus
propios compañeros.

**El tope no es un número nuevo: es el alcance de su propia bala.** Nadie vacía
el cargador hacia donde su arma no llega. El chequeo de compañeros quedó igual
—cubre el caso del pasillo lleno y corregía una inconsistencia real frente al
disparo normal— pero **el que arregla el problema es el tope de distancia**. Y
el sistema no quedó amputado: las 10 situaciones legítimas siguen ahí, y una
corrida completa contó 47 balas de puerta.

> **La lección, y es de método:** un arreglo que es *correcto* no es lo mismo
> que un arreglo que es *la causa*. Las dos veces que me equivoqué fue por
> contar SÍNTOMAS (muertos por fuego amigo) en vez de contar la SITUACIÓN que
> dispara el sistema sospechoso. Contar la situación separa "esto pasa mucho y
> está mal" de "esto pasa poco y encima no es esto".

### 🐛 2. El Sheriff clavado contra una pared — y la pared era la del blindado

> *"El Sheriff sí puede disparar. No es que él se queda bugeado contra una
> pared sin hacer nada."*

Acá había **dos** problemas encimados, y el segundo es el que producía la
imagen que Santi vio.

**El primero era el diseño llevado al literal.** `replegarse` le apagaba toda la
maquinaria de combate en cada cuadro: *"no dispara, no se cubre, no se asoma:
no tiene una sola línea de combate"*. La idea de fondo era buena —su precio se
paga en distancia hasta la salida, no en vida— pero producía un tipo que te
daba la espalda mientras le vaciabas el tambor.

**El segundo era un bug puro, y encontrarlo costó una falsa alarma.** Midiendo
el repliegue, el Sheriff se frenaba en seco a mitad del tren y no se movía más.
La primera traza mostró todos los timers congelados, lo que parecía un problema
de culling… hasta darse cuenta de que **el piloto de prueba se había muerto y
la escena entera estaba congelada**.

> **Trampa de medición nueva, para la lista:** *un piloto inmortal no es una
> comodidad, es un requisito.* Una escena que termina detiene todo lo que
> estabas midiendo, y eso se lee exactamente igual que tu sistema trabándose.

Con un piloto inmortal apareció la causa real: **el destino del repliegue era
siempre `puntaLocomotora`, y el vagón blindado suele quedar en el medio.** Esa
puerta de chapa es la única del tren que frena el movimiento, no se empuja
desde afuera, y la única llave es la dinamita — que él no lleva. Se estrellaba
contra ella y se quedaba ahí para siempre, con `findPath` devolviéndole un
camino que no existía. Medido: **70 segundos de repliegue para terminar clavado
a 14 px de una puerta que nunca iba a abrir.**

**Y el arreglo resultó mejor diseño que el destino original.** Ahora se repliega
hasta la última posición a la que de verdad llega: si el blindado le queda en
el camino, se planta de espaldas a la chapa, en el último metro de tren que
tiene, y ahí te espera. No es que se rindió — es que no hay más tren. Se
recalcula cada cuadro, así que si volaste esa puerta con dinamita antes, el
camino se le abre solo.

Verificado: **8 de 8 corridas llegan a su destino real** (la punta de la
locomotora cuando no hay blindado en el medio, el borde de la chapa cuando sí),
y encarándolo dispara en las 4 corridas de prueba (de 9 a 50 tiros).

**Lo que NO hace, y es lo que le conserva la identidad frente al
Cazarrecompensas: no avanza hacia vos ni un paso.** Se planta, se cubre y
dispara; cuando le cortás la vista, retoma la caminata. Fue la opción que
eligió Santi entre tres — la alternativa "pelea como cualquier guardia" se
descartó porque borra la única pregunta que este jefe hace, que es *¿vale la
pena ir hasta allá?*.

### 🐛 3. La escolta atacaba en vez de defender

> *"Los guardias del Sheriff no deberían ir a atacar, deberían estar en estado
> defensivo: esperar cubiertos, asomarse y disparar y también cubrirse entre
> ellos: si uno se asoma del lado izquierdo, otro lo cubre del lado derecho."*

**La causa era una condición de tres palabras**: `updateEscolta` sólo les
reescribía el puesto **mientras no estaban en combate**. Apenas te veían caían
en la IA de guardia común, que si no encuentra cobertura camina hacia vos — y
se iban a buscarte por el pasillo **dejando solo justo al tipo que tenían que
custodiar**. La escolta se autodestruía en el primer contacto.

Tres piezas, y ninguna inventa un sistema nuevo:

| | |
|---|---|
| **`defensivo`** (systems/ai.js) | Le saca a `doCombat` la rama de avanzar, y a `doInvestigate` la de ir hasta el último lugar donde te vio. Todo lo demás —ver, sospechar, gritar, cubrirse, disparar, morir— sigue siendo la IA de siempre |
| **La correa** (90 px, con histéresis) | El puesto se les recuerda SIEMPRE, y si se atrasaron vuelven antes que nada. La histéresis hizo falta porque sin ella orbitaban exacto en los 90 px: cruzaban el umbral, daban un paso, volvían a pelear, se atrasaban otra vez. Medido antes: 3-14% del tiempo fuera de correa; después: **0%** |
| **Los lados y el turno** | `findPeek` probaba siempre el mismo lado primero, así que los tres cubrían tres veces el mismo ángulo. Ahora alternan (`ladoPreferido`) y **no se asoman más de dos a la vez** (`MAX_ASOMADOS`) |

**Por qué el cupo es 2 y no 1**, que fue la decisión menos obvia: con uno solo
la formación entera dispara un cuarto del tiempo y deja de ser una amenaza; con
todos, es un pelotón de fusilamiento y no hay nadie cubriendo. Dos se lee como
lo que Santi pidió — una pareja expuesta, cada uno por su lado, y el resto
tapado esperando turno. Verificado: máximo 2 asomados simultáneos.

**Y una consecuencia buena que salió sola:** al morir el Sheriff dejan de ser
defensivos y pasan a ser guardias normales del vagón, o sea que **salen a
buscarte justo cuando ganaste**. No lo vengan: es que ya no tienen a quién
cuidar. Matarlo dejó de ser gratis sin que hubiera que escribirle un castigo.

### 4. Tres de vida, y "fijos" es la mitad de la decisión

> *"Además debería tener 3 de vida."*

Salía de `guardHealth('sheriff', vidaExtra)`: **2 en un tren tranquilo y 3 en
uno escoltado**. Eso está bien para un guardia anónimo —la escolta del tren es
justamente lo que decide cuánto aguanta— y mal para un tipo con nombre: el
mismo Sheriff moría con dos balazos o con tres según un sorteo que el jugador
no ve, así que no se puede aprender cuánto cuesta matarlo.

Ahora es `vida: 3` fijo en su ficha de `data/bosses.js`. Lo pone entre un
guardia común (2) y uno blindado (4, el techo del juego), que es exactamente
donde su diseño dice que está. `MAX_GUARD_HEALTH` sigue sin excepciones: la
única del juego sigue siendo el Cazarrecompensas.

### Lo que falta: volver a jugarlo

Todo lo de arriba está **verificado por consola** — corridas completas de 130 s
con guardias, escolta, jinetes y el Sheriff juntos, sin un solo error. Pero eso
es exactamente lo que ya estaba "verificado por consola" la vuelta pasada, y
jugarlo destapó cuatro cosas. **La medición dice que el sistema hace lo que dice
hacer; no dice si se siente bien.**

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

## HECHA · El honor — la rendición del guardia solo

*(pedido de Santi al retomar ideas de "más divertido y adictivo": "me gusta la
idea de implementar el honor ya. Pero la única forma de subirlo y bajarlo no
puede ser si le perdonas la vida a un guardia o no")*

**El disparador.** Era la tercera de las tres conductas de guardia pendientes
desde la conversación del pánico y el repliegue del herido (ver más arriba):
"un guardia solo, sin salida, a veces se rinde de rodillas". Las otras dos ya
estaban construidas; ésta se retomó ahora porque le da a `gameState.honor` —
en el estado desde la fase 1, sin que nada lo tocara nunca — el primer gancho
mecánico real.

**DÓNDE VIVE, mecánicamente: es la otra rama de `considerarRepliegue`**
(systems/ai.js). Un guardia con un tiro de vida y un compañero cerca ya se
repliega (construido antes). Ahora, si `buscarCompanero` no encuentra a nadie,
en vez de plantarse a pelear hasta morir tira una moneda: `considerarRendicion`.
Se juega **una sola vez por guardia** (`yaConsideroRendirse`, el mismo candado
que `yaSeReplego`), gane o pierda.

**LA CHANCE LA MUEVE `honor`**, no es fija: `rendicionChanceBase` (0,25) más
`gameState.honor × rendicionPorHonor` (0,0025), con piso 0,03 y techo 0,75
(`CONFIG.enemy`). Temido de verdad, casi nadie se rinde — ya saben que los vas
a matar igual, no tienen nada que ganar entregándose. Respetado, se rinden
bastante más. Nunca 0% ni 100%: siempre queda alguien que se la juega, para
cualquier lado.

**RENDIDO ES UN ESTADO PROPIO** (`e.rendido`, entities/enemy.js), no una
variación de `inconsciente`. Se queda quieto — no dispara, no se mueve, no
investiga nada (`updateEnemy` corta al toque, igual que ya cortaba con
`inconsciente`) — y se dibuja de rodillas, con las manos arriba, en un color
que no usa ningún otro estado (`col.enemyRendido`, un hueso claro: ni el gris
de patrulla ni el rojo de combate).

**NO HACE FALTA NINGÚN BOTÓN PARA PERDONAR.** Decisión tomada con Santi entre
dos opciones (automático vs. mantener `E` como amenazar a un pasajero): ganó
"no atacarlo y seguir de largo" — si sigue vivo y rendido al terminar el
asalto, cuenta como perdonado. Nada se anuncia en pantalla, la misma regla de
siempre.

**QUÉ MUEVE `honor`, y por qué no es sólo perdonar/no perdonar**
(`CONFIG.honor`, `honorDelta` en state/gameState.js — calcada de `bountyDelta`):

| Acción | Peso | Por qué |
|---|---|---|
| Perdonar a un rendido | +12 | el gesto original |
| Rematar a un rendido | −20 | te miraba a la cara, indefenso, y lo mataste igual — el golpe más fuerte |
| Rematar a un noqueado (culata + filo) | −8 | menos grave: nunca te vio, no sabe qué pasó |
| Matar a un pasajero | −15 | reusa `summary.civilians`, el mismo conteo que ya alimenta `bounty.pesoCivil` |
| Escapar sin matar a NADIE | +15 | bono aparte, premia el asalto entero resuelto a culatazos y sigilo |

**RENQUE ENTRE ARMAS: LA CULATA EN UN RENDIDO NO MATA.** Si lo culateás
(`arma.noquea`), se convierte en `inconsciente` — deja de estar rendido,
pasa a estar desmayado — y no mueve `honor` para ningún lado: no lo mataste,
pero tampoco lo dejaste ir. Un caso raro, no diseñado a fondo, dejado como
zona neutra a propósito en vez de inventarle una regla.

**EL DATO QUE HIZO FALTA CAPTURAR ANTES DE MUTAR NADA.** En `systems/melee.js`,
el remate (con filo) borra `e.inconsciente` y deja `e.rendido` como estaba —
pero el evento `enemyKilled` necesita saber DE QUÉ VENÍA antes de que el golpe
cambie el estado, así que `eraRendido`/`eraNoqueado` se capturan primero y
viajan en el propio payload del evento (`rendido`, `indefenso`). Para bala o
dinamita nadie captura nada — no hace falta: como ninguna de esas dos rutas
toca `e.rendido` ni `e.inconsciente` antes de matar, `raidScene.js` los lee
directo del enemigo en el listener, con el payload como preferencia y el
objeto como respaldo (`rendido ?? enemy.rendido`).

**VERIFICADO POR CONSOLA** (el panel seguía sin componer frames), con
`FORAJIDO.services.raid` y `scenes.update` a mano:

- Un guardia aislado (sin nadie a 200px) forzado al umbral de vida, con
  `honor = 1000` (chance al techo, 0,75): en 5 tiradas, 4 se rindieron y 1
  no — acorde a la chance.
- Un par de guardias a 22px forzado igual: el que baja de vida se repliega
  (`yaSeReplego: true`) y **nunca** llega a tirar la moneda de rendición
  (`yaConsideroRendirse: false`) — la exclusión por compañero funciona.
- Un rendido se queda **exactamente quieto** dos segundos seguidos de
  simulación (misma `x`/`y`, `burstLeft` y `aimTimer` en cero).
- Rematarlo con filo (`playerMelee` real, no simulado) emite `enemyKilled`
  con `rendido: true` en el payload.
- Culatearlo lo pasa a `inconsciente` (25s) sin emitir `enemyKilled`.
- `applyRaidResult` con un resumen fabricado de "perdonaste a uno, escapaste
  sin matar a nadie" dio `honor: +27` (12 + 15, exacto); uno de "rematate a
  un rendido, a un noqueado, y murió un civil" dio `honor: −43` (−20 −8 −15,
  exacto).

**LO QUE FALTA:** que Santi lo juegue de verdad — encontrarse con un guardia
arrodillado por primera vez, sin saber que existe, es la única prueba que
importa. Los números de `CONFIG.honor` y `CONFIG.enemy.rendicionChance*` son
un primer valor razonable, no calibrado jugando — igual que el resto de este
archivo, se ajustan viéndolo en la mano, no midiendo de nuevo.

**Y sigue habiendo un hilo suelto, a propósito, para no sobreconstruir de una:**
un guardia rendido cuenta como "alguien peleando" (`state === 'combat'`
residual) para dos chequeos menores de otros guardias (`tieneConQuienEntrar`,
`emparejar`) que no lo excluyen explícitamente — un caso raro y de bajo
impacto, no una decisión tomada.

*(la "posibilidad de traición" que mencionaba la idea original — que un
rendido finja y ataque si te acercás desprevenido — se retomó y ya está
hecha: ver la sección siguiente)*

---

## HECHA · La traición del rendido

*(pedido de Santi, jugando la rendición: "quiero implementar que puede haber
una cierta probabilidad de que el guardia se levante y te dispare por la
espalda. Debería como irse poniendo de pie, para que si el jugador esté atento
le de tiempo para reaccionar. La probabilidad debería incrementar con la
cantidad de recompensa que se ofrece por la cabeza del jugador")*

**Era la mitad de la idea original de la rendición**, dejada afuera a
propósito la vez pasada para no construir las dos cosas de una vez. Ahora se
retoma, y reusa casi toda la maquinaria que ya existía: matarlo mientras se
está parando es LITERALMENTE el mismo gesto de rematar que ya estaba
construido, así que "reaccionar a tiempo" no necesitó ningún input nuevo.

**DÓNDE VIVE: la otra rama de `considerarTraicion`** (systems/ai.js), que
corre en el mismo lugar donde `updateEnemy` cortaba en seco para un rendido
(`if (e.rendido) { considerarTraicion(...); return; }`). Dos sub-estados:

1. **Esperando** (`!e.traicionLevantando`): cada `traicionCheckCada` segundos
   (3,0) re-tira la moneda — **sólo si el jugador se alejó de verdad**
   (`traicionRadioMinimo`, 50px: encañonado no se anima a nada). La chance
   sale de `gameState.bounty` (cuánto pagan por tu cabeza), NO de `honor`
   —son preguntas distintas: `honor` decidió si se arrodilló, `bounty`
   decide si, ya de rodillas, se anima a jugársela— con
   `traicionChanceBase` (0,05) más `bounty × traicionPorBounty` (0,0003),
   entre 0,02 y 0,40. Con `bounty` en 0, casi nunca; cerca del techo real
   (`prision.umbralHorca`, 1200), hasta ~40%.
2. **Levantándose** (`e.traicionLevantando`): `traicionProgreso` sube con
   `dt` hasta `traicionDuracion` (1,1s). Si en ese lapso lo atacás —CUALQUIER
   ataque, no hace falta saber que está "en medio de la traición"— es el
   mismo remate de siempre y muere ahí. Si llega al final sin que lo toques,
   `dispararPorLaEspalda` lo saca de `rendido`, lo vuelve a `combat`, y le
   pega un tiro garantizado al jugador (`damagePlayer` directo, sin apuntado
   ni dispersión — el aviso ya fue el cuerpo parándose, no un ángulo que se
   pueda esquivar corriendo).

**EL AVISO ES EL CUERPO, NADA MÁS** (`drawEnemy`, entities/enemy.js): sin
ícono nuevo, sin `!` sobre la cabeza. Mientras se para, la caja de colisión
interpola de la altura arrodillada a la de pie, y pasada la mitad el color
salta de `enemyRendido` a `enemyAlert` — el mismo lenguaje de "esto es
peligro" que ya usa el resto del juego. Es la misma regla de siempre: lo que
se puede mostrar no se escribe.

**MATARLO A TIEMPO NO ES LO MISMO QUE REMATAR A UN INDEFENSO.** Si ya se
estaba parando para dispararte, el aviso ya sonó — matarlo en ese momento es
defenderte de algo que viste venir, no ejecutar a alguien rendido. Por eso
`eraRendido` (systems/melee.js y el listener de `enemyKilled` en
raidScene.js) exige `e.rendido && !e.traicionLevantando`: durante la parada,
`honorDelta` no lo cuenta como remate — ni bien ni mal, simplemente combate.

**VERIFICADO POR CONSOLA**, mismo método que el resto de esta tanda:

- Con `bounty = 1200` (chance ~0,41 por chequeo) y el jugador lejos, se activó
  al segundo chequeo de tres intentos (~6s) — orden de magnitud correcto.
- Rematarlo durante `traicionLevantando` (con `playerMelee` real): muere, y
  el payload de `enemyKilled` trae `rendido: false` — la exención funciona.
- Dejarlo completar la parada sin tocarlo: `rendido` pasa a `false`,
  `traicionLevantando` a `false`, `state` vuelve a `'combat'`, la vida del
  jugador baja de 4 a 3, y se emite `playerHit` — el ciclo completo.
- Con el jugador a 10px (menos que `traicionRadioMinimo`) durante 10
  segundos seguidos: nunca arranca a pararse, aunque el timer se siga
  reseteando cada 3s — la exigencia de "te alejaste de verdad" frena el
  chequeo antes de tirar la moneda.

**LO QUE FALTA:** jugarlo. Los números (`traicionCheckCada`,
`traicionChanceBase/PorBounty`, `traicionDuracion`) son un primer valor
razonable — se ajustan viéndolo en la mano, como todo lo demás de este
archivo. En particular, `traicionDuracion` (1,1s) es la variable más sensible
a cómo se sienta jugando: si nadie llega a reaccionar nunca, subirla; si se
siente demasiado fácil esquivarla, bajarla.

---

## MEDIDO · Cada cuánto un guardia se rinde, y cada cuánto ese mismo te traiciona

*(pedido de Santi: "quiero que hagas una probabilidad de cada cuanto un
guardia pide piedad y cada cuanto ese mismo guardia se para y dispara")*

Medido con la fórmula real del juego, semilla fija, 50.000 tiradas por caso —
el empírico coincidió con la fórmula en las 10 filas, así que no había ningún
bug de cálculo escondido:

| `honor` | Chance de rendirse |
|---|---|
| −100 o menos | 3% (piso) |
| 0 (arranque) | 25% |
| 50 | 38% |
| 100 | 50% |
| 200 o más | 75% (techo) |

`honor` deja de importar fuera de −100/+200: ahí ya está en el piso o el
techo, así que subirlo o bajarlo más allá no cambia nada.

Para la traición, la chance por chequeo (cada 3s) Y el tiempo real traducido
—simulando el proceso completo, 20.000 guardias por fila—:

| `bounty` | Chance por chequeo | Mediana hasta que se anima | Chance a los 30s |
|---|---|---|---|
| 0 | 5% | 39s | 40% |
| 300 | 14% | 15s | 78% |
| 700 | 26% | 9s | 95% |
| 1200 (techo real) | 40% (techo) | 6s | 99% |

**Lo que dice esto jugando:** a recompensa 0, dejar a un rendido vivo cerca
tuyo un rato corto es relativamente seguro. Con `bounty` alto —que es
justamente cuando el juego ya te está castigando con más jinetes y el
Cazarrecompensas— un rendido se vuelve peligroso casi de inmediato.

Esta medición fue la que llevó a la sección siguiente: mirando estos números,
la pregunta que siguió fue "¿y el resto del asalto también se pone peor con
el tiempo, o sólo esto?" — y la respuesta, revisando `CONFIG.alert` y
`RIDER_SPAWN`, fue que no: los refuerzos de la locomotora y los jinetes de
afuera escalaban al principio y después se aplanaban en un techo fijo.

---

## HECHA · Los refuerzos y los jinetes ya no tienen techo, sólo un piso

*(pedido de Santi, después de ver la tabla de arriba: "quiero probar eso de
que a medida que pasa el tiempo más se intensifica el peligro. Podríamos
hacer que suban guardias desde la parte de atrás del tren o que vengan desde
la locomotora")*

**"Por atrás" se descartó a propósito.** El comentario de `systems/alert.js`
ya lo decía desde que existe: *"Nunca por atrás: atrás está el aire libre y
tu caballo"* — es tu única salida, y abrirla a guardias es un cambio de
diseño de fondo, no un ajuste de número. Elegido con Santi: escalar lo que ya
entraba por la locomotora y por afuera (los jinetes), en vez de tocar eso.

**EL PROBLEMA MEDIDO:** los dos sistemas que ya hacían "el peligro sube con
el tiempo" —`CONFIG.alert` (refuerzos de la locomotora) y `RIDER_SPAWN`
(jinetes de afuera)— tenían un `max` que era un TECHO DURO. Pasado ese punto
(4 refuerzos, 2 a 5 jinetes según la recompensa), no entraba nadie más
aunque el jugador se quedara el resto del asalto sentado en un vagón. La
escalada se aplanaba justo cuando más debería pesar quedarse.

**LA IDEA: `max` pasa a ser el PISO, no el techo.** Pasado ese punto, sigue
entrando gente, pero cada vez MÁS SEGUIDO — no más cantidad de una: el
intervalo entre uno y el siguiente se achica con cada uno de más
(`intervalDecay`), hasta un piso (`intervalMin`). El mismo mecanismo en los
dos sistemas, escrito una vez por archivo (`intervaloDelProximoRefuerzo` en
systems/alert.js, `intervaloDelProximoJinete` en systems/riders.js) porque
son datos separados (`CONFIG.alert` vive en data/config.js, `RIDER_SPAWN` en
data/riders.js) y no valía la pena unificarlos en un tercer módulo para dos
usos.

**`maxAbsoluto` es un techo técnico, no de dificultad.** Ningún asalto real
llega tan lejos sin que pase algo antes (capturan al jugador, escapa, se
acaba el reloj) — está para que un asalto colgado de verdad no genere gente
sin fin. 12 para la locomotora, 10 para los jinetes.

**Números elegidos** (`CONFIG.alert` y `RIDER_SPAWN`, data/config.js y
data/riders.js):

| | Piso (`max`) | Intervalo base | `intervalDecay` | `intervalMin` | `maxAbsoluto` |
|---|---|---|---|---|---|
| Locomotora | 4 | 16s | 3s | 6s | 12 |
| Jinetes | 2 a 5 (según `bounty`) | 15s | 2,5s | 6s | 10 |

**VERIFICADO POR CONSOLA, corrida completa de 150s con recompensa 0** (el
peor caso — el piso más bajo de los dos sistemas):

- Locomotora: entran a los 20, 36, 52, 68 (el ritmo de siempre, sin tocar),
  después 81, 91, 98, 104, 110, 116, 122, 128 — doce en total, el intervalo
  bajando de 16s a 6s tal cual la fórmula.
- Jinetes: la tanda de 2 a los 25s, después 37,5 / 47,5 / 55 / 61 / 67 / 73 /
  79 / 85 — diez en total (el `maxAbsoluto`), mismo achicamiento.
- Los dos números coinciden exactos con una corrida aparte del sistema
  aislado (sin el resto del asalto alrededor) — no hay ninguna otra parte del
  juego interfiriendo con el reloj de ninguno de los dos.

**UN CALLEJÓN SIN SALIDA EN EL CAMINO, para que quede anotado:** la primera
corrida "real" (con `scenes.update` completo, no el sistema aislado) dio SÓLO
2 jinetes y 2 refuerzos en 150s enteros — parecía que el cambio no hacía nada.
La causa NO era el código: era el arnés de prueba. Dejé al jugador de prueba
parado, sin vida infinita, en un asalto con la alarma sonando desde el
segundo cero — y se murió a los 25,6s, mucho antes de que el 3º refuerzo
tuviera su turno (37,5s). El asalto terminaba (`finished = true`) y desde ahí
`update()` corta en seco: ni la locomotora ni los jinetes se actualizan más.
Con el jugador en modo dios sólo para la medición, los números coincidieron
exactos con la corrida aislada. Es el mismo consejo de siempre: sospechar del
arnés tanto como del código.

---

## HECHA · La rendición pasaba demasiado seguido — medido y corregido

*(Santi, jugando: "el guardia que pide piedad pasa demasiado seguido. Cuando
está él y otro guardia en el mismo vagón, no importa que uno esté en una
punta y otro en la otra, NO PUEDE PEDIR PIEDAD")*

**MEDIDO ANTES DE TOCAR NADA, con dos guardias reales del mismo vagón,
arrancando en puntas opuestas (288px):**

| Segundo | Distancia entre ellos |
|---|---|
| 0 | 288px |
| 2 | 226px |
| 4 | 135px |
| 6 | 63px — y ahí se queda |

**Los dos convergen sobre el jugador en menos de 6 segundos, siempre.** Es lo
que la IA ya hace (vienen a buscarte apenas se alertan). Para cuando alguno
de los dos baja al umbral de vida —que es cuando se preguntaba si hay
compañero—, casi siempre ya están bien adentro de `repliegueRadioCompanero`
(90px). Por eso "una punta y la otra" no cambiaba nada: para el momento que
importa, la posición inicial ya dejó de existir. Y con ~11 guardias en 4-6
vagones, el ÚLTIMO de cada bolsón de 2+ siempre termina solo tarde o
temprano — eso era lo que se sentía "demasiado seguido": no un guardia
particular tirando la moneda mucho, sino que casi todo vagón terminaba en
ese momento.

**DOS CAMBIOS, uno por cada mitad del problema** (`CONFIG.enemy`,
`considerarRepliegue` en systems/ai.js):

1. **`rendicionChanceBase` bajó de 0,25 a 0,15** — responde a la frecuencia
   cruda.
2. **`rendicionSoloMinimo` (1,5s), nuevo.** Antes se tiraba la moneda en el
   mismo cuadro en que quedaba solo. Ahora tiene que llevar ese tiempo
   SEGUIDO sin compañero — medido con `e.soloTimer`, que se acumula cuadro a
   cuadro y no se reinicia salvo que de verdad aparezca alguien cerca. Si en
   el medio llega un compañero, la rama de repliegue lo agarra al cuadro
   siguiente y la cuenta nunca llega a completarse.

**CAMBIO DE ARQUITECTURA QUE HIZO FALTA:** `considerarRepliegue` dejó de
depender de "¿te acaban de pegar este cuadro?" (comparar `e.health` contra
`e.vidaPrevia`, el mismo patrón que usa el Cazarrecompensas) y pasó a
evaluarse TODOS los cuadros mientras la vida siga en el umbral y nada se haya
decidido. Sin este cambio, `soloTimer` no tenía cómo acumularse — el chequeo
viejo sólo miraba una vez, en el instante exacto del golpe. `e.vidaPrevia` ya
no se usa en ningún lado de este archivo y se sacó de `entities/enemy.js`
(seguía viva en `entities/boss.js`, para el Cazarrecompensas, que es una
copia aparte y no se tocó).

**VERIFICADO POR CONSOLA:**

- Un guardia aislado, forzado al umbral: `soloTimer` sube parejo con el
  reloj y `rendido` se prende exactamente al cruzar 1,5s — ni un cuadro
  antes.
- El mismo caso, pero con un compañero que llega a los 0,7s (antes del
  umbral): el timer se corta, nunca se tira la moneda, y el guardia pasa a
  replegarse con el compañero en cambio (`yaSeReplego: true`,
  `yaConsideroRendirse: false`).
- `rendicionChanceBase` en 50.000 tiradas dio 0,1503 — coincide con 0,15.

---

## HECHA · Los jinetes de la escalada esperan adelante, no persiguen

*(Santi: "los jinetes son demasiados para que todos queden detrás del
jugador. Algunos jinetes deberían estar detrás y otros por delante esperando
a que el jugador pase por ese lugar en el que un jinete espera")*

**Decidido con Santi, dos preguntas concretas:** (1) sólo los jinetes que
entran por la escalada nueva (los que sobrepasan el piso que fija la
recompensa) nacen emboscadores — los garantizados siguen persiguiendo, que
es el comportamiento ya jugado; (2) esperan **~250px adelante**, medio vagón
mediano de anticipo.

**"ADELANTE" = HACIA LA LOCOMOTORA, siempre — no "hacia donde vas ahora".**
Es la misma palabra que ya usa el resto del juego (ver README, "ir hacia
ADELANTE dentro del tren cuesta casi el doble que volver") y coincide con
el sentido en el que crece `x` en el mapa: `puntaLocomotora`
(world/train.js) es la ÚLTIMA plataforma, y las columnas de los vagones se
arman en orden creciente desde la cola. No hizo falta rastrear hacia dónde
se mueve el jugador ni adivinarlo — el tren ya tiene una dirección fija.

**MECÁNICA** (`data/riders.js`, `systems/riders.js`):

- `RIDER_SPAWN.distanciaEmboscada: 250`.
- `createRiderWatch.update`: el jinete que se manda es emboscador si
  `salieron >= max` (ya se mandó el piso garantizado) al momento de nacer.
- `spawnRider(world, side, { emboscador })`: si es emboscador, reclama YA un
  tramo cerca de `jugador.x + distanciaEmboscada` (con `elegirTramo`, el
  mismo buscador que usa la persecución normal, para no pisarle la ventana a
  otro jinete) y **nace ahí mismo**, no al lado del jugador — si apareciera
  cerca tuyo y después galopara hacia adelante, verías la emboscada armarse
  y dejaría de sorprender.
- `seguirAlJugador`: mientras `rd.emboscador` esté puesto, no vuelve a
  elegir tramo cuadro a cuadro (lo que lo hace "esperar" y no "perseguir").
  En cuanto `jugador.x` llega a su tramo, `rd.emboscador = false` y desde
  ahí persigue como cualquier otro — cruzarlo es lo que dispara la
  persecución.

**VERIFICADO POR CONSOLA, corrida real de 90s con recompensa 0** (piso = 2):

- Los primeros 2 salen SIN `emboscador` y terminan cerca del jugador (~96px),
  el comportamiento de siempre.
- Del 3º al 10º (la escalada completa hasta `maxAbsoluto`), todos nacen
  `emboscador: true`, y sus posiciones reales quedaron entre 163 y 405px
  adelante del jugador — coherente con el objetivo de +250px ajustado a la
  ventana real más cercana.
- Moví al jugador hasta cruzar el tramo del emboscador más cercano: pasó de
  `emboscador: true` (quieto) a `emboscador: false` (moviéndose hacia el
  jugador) en el mismo cuadro que lo cruzó.

---

## HECHA · El honor: el disparador que faltaba, y la fogata lo cuenta

*(retomando la lista original de honor, ya con `rendido`/`traición`
construidos: faltaba "noquear en vez de matar, por la espalda → sube un
poco". Y pedido aparte de Santi: "algo que me gustaría que haya ya es que
cuando te sientas al lado de la fogata, te dice la Fama y el Honor que tiene
el jugador")*

**EL DISPARADOR QUE FALTABA: `CONFIG.honor.noquearLimpio` (+3).** Elegiste
la culata en vez del filo, por la espalda, a alguien que nunca te vio. Sube
POCO a propósito — un cuarto de `perdonarRendido` (12) — porque es una
decisión que tomás al equiparte, antes de saber si iba a hacer falta, no un
gesto consciente en el momento como perdonar a un rendido. Si pesara igual,
la culata sería la jugada dominante para `honor` y el resto de la tabla
dejaría de importar.

**"LIMPIO" EXIGE QUE NO FUERA YA UN REMATE** (`systems/melee.js`): culatear a
alguien que ya estaba rendido o ya noqueado sigue siendo la zona neutra de
siempre — no suma nada para ningún lado. La distinción (`limpio = !eraRendido
&& !eraNoqueado`) viaja en el propio evento `enemyKnockedOut`, mismo patrón
que ya usa `enemyKilled` para `rendido`/`indefenso`.

**LA FOGATA.** `T.camp.fogataSentado` pasó de un string fijo a una función
`(fama, honor) => texto`, mismo patrón que `T.camp.poste` o `T.camp.cajon`.
Un ejemplo real: *"Junto al fuego: fama 45, honor +12 (confían en vos)."*
Cinco tramos de palabra para el honor (`te temen` / `desconfían de vos` /
`no saben qué pensar de vos` / `confían en vos` / `te respetan`), sin números
mágicos calibrados — es la primera vez que estos dos números se ven en algún
lado fuera de la pantalla de resultados.

**VERIFICADO POR CONSOLA:**

- Noqueo genuino por la espalda a un guardia patrullando: `enemyKnockedOut`
  trae `limpio: true`.
- El mismo golpe a un guardia ya `rendido` (forzado para la prueba): trae
  `limpio: false`.
- `applyRaidResult` con dos `noqueadosLimpios` dio exactamente `+6` de honor
  (2 × 3).
- La fogata, jugada de verdad (moviendo al jugador con teclas reales, no
  simulado): con fama 45 y honor +12 dice *"confían en vos"*; con honor -60
  dice *"te temen"*; con honor 0 dice *"no saben qué pensar de vos"*. Se vio
  la pantalla real con `foto.ps1` — el texto entra sin cortarse.

---

## HECHA · La racha de asaltos limpios

*(pedido de Santi, retomando la idea del "efecto casino" de la sesión
anterior: "avancemos con el tema de la racha sin alarma")*

**QUÉ LA EXTIENDE Y QUÉ LA CORTA.** Cada asalto **LIMPIO** (escapaste, sin
que la alarma sonara nunca) seguido suma 1 a `gameState.rachaLimpia`.
Cualquier otra cosa la corta a 0: te agarraron, o escapaste pero ya te
habían oído. Atada a "limpio" y no a "escapaste" a secas a propósito —
decisión ya tomada la sesión anterior al proponer la idea, para no
diluir el peso que ya tiene `cleanBonus`.

**LOS NÚMEROS, elegidos por Santi sobre una tabla de tres opciones
calculadas** (+10%/techo 100, +15%/techo 75, +5%/techo 150): terminó
pidiendo un cuarto punto intermedio, **+8% por nivel, techo en +150%**. El
techo se alcanza en la racha 19 (8 × 19 = 152, topado) — ahí un asalto limpio
paga el botín **×3,5** entre `cleanBonus` (×2) y esto (×1,5).

**EL PREMIO SE SIENTE YA, NO EN EL PRÓXIMO ASALTO.** El cálculo vive en
`raidScene.js` (`goToResults`), no en `applyRaidResult`, por el mismo motivo
que `cleanBonus` ya vivía ahí: hace falta saber el bonus ANTES de cerrar
`summary.money`. `racha = limpio ? gameState.rachaLimpia + 1 : 0` — tu
PRIMER asalto limpio de la partida ya te da racha 1 y +8%, no hay que
esperar a un segundo para verlo moverse. `applyRaidResult` sólo guarda el
resultado (`gameState.rachaLimpia = summary.racha`), mismo patrón liviano
que ya usa para todo lo demás.

**PERDERLA SE MUESTRA, no sólo el número vuelve a cero en silencio.**
`rachaPerdida` guarda cuánto llevabas ANTES de este asalto, si lo cortaste —
la pantalla de resultados dice *"Se cortó la racha (llevabas 7)"* en rojo.
Es la otra mitad del "efecto casino": tiene que doler perderla, no sólo
alegrar tenerla.

**VERIFICADO POR CONSOLA**, reproduciendo la fórmula real contra
`applyRaidResult` 20 asaltos limpios seguidos: sube parejo 8% por nivel
(racha 1 → +8%, racha 5 → +40%, racha 10 → +80%) y se clava en 150% justo en
la racha 19, se mantiene ahí en la 20. Un asalto capturado con racha 7
previa: `rachaLimpia` vuelve a 0. La pantalla de resultados real (`scenes.
goTo('results', ...)`) mostró las dos filas correctamente, con y sin racha.

---

## HECHA · El jackpot raro en la caja fuerte

*(pedido de Santi, siguiendo el plan: "ahora vamos con el jackpot raro en la
caja fuerte")*

**SE JUEGA AL ARMAR EL VAGÓN, no al abrir la caja** (`createLootable`,
entities/lootable.js) — mismo momento en que ya se sorteaba el valor normal
(150-600). El jackpot no es una mecánica nueva, es una segunda tirada sobre
la misma: si sale, el valor sale de un rango mucho más alto en cambio
(`LOOT_TYPES.strongbox.jackpotMin/Max`, data/wagons.js) y la caja queda
marcada `l.jackpot`. Como el valor real ya existía adentro de la caja desde
siempre, sin que se supiera hasta abrirla, esto no le agrega ningún paso
nuevo a la promesa de diseño original — sólo hace que a veces esa cifra
escondida sea mucho más grande.

**NÚMEROS, elegidos por Santi sobre tres opciones calculadas** (5%/$2500-
4000, 8%/$1500-2500, 3%/$4000-6000): **5% de chance, $2500-4000**. Contra el
promedio normal (~$375), son unas 8-9 veces más — bastante raro para seguir
sorprendiendo (1 de cada 20 cajas), bastante grande para sentirse como lo
que es.

**NADA LO ANUNCIA ANTES DE ABRIRLA.** `drawLootable` no cambió: una caja con
jackpot se ve exactamente igual que cualquier otra hasta el instante en que
`takeLoot` la resuelve — es la misma regla de siempre ("lo que se puede
mostrar no se escribe"), aplicada acá al revés: mostrarlo ANTES arruinaría
la sorpresa, así que no se muestra.

**EL MOMENTO EN QUE SE REVELA es lo único que sí tiene tratamiento especial**
(`takeLoot`, raidScene.js): un floater dorado más grande y más largo
("¡EL GOLPE DE TU VIDA! +$3256"), el doble de partículas, y una sacudida de
cámara bien por encima de cualquier otra del juego (7, contra 3,2 de recibir
un balazo) — tiene que sentirse como el pico de todo el asalto. La plata en
sí entra al mismo `collected` de siempre: si te toca en medio de una racha
limpia, el bonus de racha también lo multiplica, sin ningún código extra.

**VERIFICADO POR CONSOLA:**

- 50.000 cajas fuertes con la fórmula real: 4,94% salieron jackpot (pedido:
  5%), promedio $3.256 dentro del rango $2.500-4.000, y las normales
  promediaron $376 dentro de $150-600 — ningún número se movió del rango
  pedido.
- Una caja fuerte abierta de verdad (jugador real manteniendo `E` los 6,5s
  completos) se resolvió sin errores.
- **Visto de verdad con `foto.ps1`**, no sólo medido: el floater dorado se
  lee bien, sin cortarse, con el texto y el monto completos.

---

## HECHA · El rescate — "casi lo logro" en vez de todo o nada

*(último punto del plan que Santi dejó ordenado: "un 'casi lo logro' en vez
de todo-o-nada" — hasta acá, que te agarraran o murieras hacía perder el
100% de lo juntado en el asalto, aunque hubieras estado a un paso del
caballo)*

**NO ES UNA FRACCIÓN FIJA — escala con la distancia real al caballo**
(`train.exitZone`) en el instante exacto de la captura. Es lo que hace que
el nombre sea literal: morir a metros de la salida es un CASI de verdad, y
tiene que pagarse distinto que morir en la otra punta del tren, que es
simplemente un fracaso. Decidido con Santi entre una fracción fija y ésta —
eligió la escalada por ser la que de verdad cumple la idea del nombre.

**LOS NÚMEROS, elegidos por Santi sobre una tabla de tres opciones
calculadas contra un botín de $1000** (60%/20%, 50%/10%, 35%/5%): **50% cerca
del caballo (≤200px) → 10% lejos (≥2500px)**, interpolando lineal en el
medio (`fraccionRescate`, raidScene.js). Con $1000 juntados: $500 si te
agarran a metros de la salida, $100 si te agarran lejos.

**DÓNDE VIVE:** el cálculo entero vive en `goToResults()` (raidScene.js),
mismo lugar que `cleanBonus` y la racha, por el mismo motivo — hace falta
saber el rescate ANTES de cerrar `summary.money`. El cambio real de fondo
está en `applyRaidResult` (state/gameState.js): `gameState.money +=
summary.money` **pasó a correr siempre**, no sólo si `outcome === 'escaped'`
— antes, cualquier captura sumaba cero por definición; ahora `summary.money`
ya trae el rescate cuando corresponde, así que sumarlo siempre es correcto
para los dos casos sin duplicar lógica.

**LA PANTALLA DE "CAPTURADO" AHORA DICE ALGO MÁS QUE "PERDISTE TODO".** Fila
nueva, en dorado, sólo si hubo rescate: *"Casi lo lográs +$X"*. Y la fila de
"Botín que dejaste" se corrigió para restar el rescate — antes, capturado,
siempre mostraba el `collected` entero como perdido; ahora resta lo que
efectivamente te quedaste.

**VERIFICADO POR CONSOLA:**

- La fórmula aislada contra 9 distancias (0 a 3000px) dio exactamente lo
  esperado: 500/1000 en el piso (≤200px), 100/1000 en el techo (≥2500px), e
  interpolación lineal correcta en el medio (ej. 1350px → exactamente 300).
- Dos asaltos reales completos (bolsa real tomada, jugador movido de
  verdad, muerte real vía `playerDown`): capturado LEJOS del caballo con
  $36 juntados dio "Casi lo lográs +$4" (10%, redondeado); capturado
  literalmente ENCIMA del caballo con otra bolsa dio "+$19" sobre un valor
  de bolsa de ~$38 (50%, redondeado). `gameState.money` reflejó el rescate
  en los dos casos, no sólo `summary.money`.

---

## HECHA · Los guardias "de adelante" esperan en rojo, en la puerta

*(Santi, después de que le explicara cómo funcionaba el reparto de la alarma:
"quiero que reprogrames eso... los guardias deberían estar en rojo
esperándote en la puerta de su vagón, no en amarillo. Los guardias del
blindado sácalos de la ecuación")*

**LO VIEJO:** cuando la alarma ya sonaba y llegaba ruido a un vagón por
delante tuyo (`spreadAlarm`, raidScene.js), esos guardias quedaban en
`suspicious` (amarillo) y clavados donde los agarró la alerta —
`alertaEnGuardia`, un estado de "ya sé que hay lío, pero hasta no verte de
verdad no reacciono del todo".

**LO NUEVO: `alertaEnPuerta`** (systems/ai.js), que reemplaza a
`alertaEnGuardia` para este caso puntual (sigue existiendo para el blindado,
ver abajo). Hace dos cosas que antes no pasaban:

1. **Entra en combate DE VERDAD** (`enterCombat(e, world, false)` — sin
   gritar, porque ya se enteró por la alarma y gritar volvería a disparar
   `spreadAlarm` en bucle).
2. **Camina hasta la puerta de entrada de SU PROPIO vagón** (el lado hacia
   la cola, de donde viene el lío) antes de plantarse. Al llegar, se marca
   `defensivo` — la misma marca que ya usa la escolta del Sheriff — y ahí se
   queda para siempre, armado, cubierto en el marco.

**DÓNDE ESTÁ LA PUERTA, sin buscarla en `world.doors`:** cada vagón ya
guarda su propio borde de menor `x` (`train.wagons[i].x`), que es
exactamente el lado de la cola — no hizo falta ni una búsqueda en el array
de puertas, sólo leer un número que ya existía.

**EL BUG QUE HABÍA QUE EVITAR, y por el que el chequeo de `vaHaciaPuerta` va
ANTES de todo lo demás en `doCombat`:** si el guardia caminara hacia la
puerta usando la rama normal de movimiento, el reloj de "hace cuánto que no
te veo" (`lostTimer`/`loseTargetTime`, 9s) correría en paralelo — como nunca
te vio de verdad (`engaged` nunca es `true`, sólo lo alertó la alarma), a los
pocos segundos lo devolvería solo a `suspicious`, deshaciendo el rojo antes
de llegar a destino. Por eso el chequeo se resuelve primero, con su propio
`return` mientras camina.

**LOS DEL BLINDADO QUEDAN AFUERA A PROPÓSITO.** Ya tienen su propia regla
("nunca abandonan el puesto pase lo que pase", `e.confinado`) y su propia
puerta, que no es madera — mandarlos a caminar no tendría sentido.
`alertaEnPuerta` los detecta (`if (e.confinado)`) y los deriva al
`alertaEnGuardia` de siempre, sin tocarles nada.

**VERIFICADO POR CONSOLA, con un asalto real** (`alarmaInicial: true`,
`boardAt: 1`):

- Un guardia normal en el vagón siguiente al de la alarma nació con
  `state: 'combat'` y `vaHaciaPuerta: true` de inmediato, con
  `puertaDestino` coincidiendo exacto con el borde calculado a mano
  (`train.wagons[2].x + 10`).
- Corriendo el asalto real 2 segundos: llegó a la puerta, `vaHaciaPuerta`
  pasó a `false`, `defensivo` a `true`, y se quedó ahí — en rojo.
- Un guardia del blindado, forzado al mismo escenario (con un disparo
  simulado de alcance 3 vagones): quedó en `suspicious` (amarillo), sin
  moverse — el comportamiento viejo, intacto.

---

## ✅ HECHA · "Variedad de lo que pasa en los trenes" — Fase 1, la arquitectura de capas

Primer paso del plan grande que Santi dejó cerrado en diseño (charla completa
fuera de este archivo — la frase que lo resume: *"conozco estos vagones, pero
nunca sé exactamente qué me voy a encontrar"*). Santi lo dividió en 8 fases;
ésta es la Fase 1: **sólo la arquitectura del sorteo**, con apenas 1-2
modificadores reales enchufados para probar que combina bien antes de
apilarle contenido. `redada` (con guardias extra, la pieza más cara) queda
para la Fase 2.

**DOS EJES NUEVOS, independientes de tipo de tren y dificultad, y
DISTINTOS ENTRE SÍ A PROPÓSITO** (`data/modifiers.js`, nuevo):

- **Clima** — pick-one, mismo patrón (`sortearPorPeso`, ahora exportada de
  `data/train.js`) que ya usan tipo de tren y dificultad: un tren no puede
  tener tormenta Y despejado a la vez. Probado con **tormenta** (20% del
  sorteo): multiplica `hearRadius`/`hearStepRadius` del perfil de IA
  (×1,4) — se aplica en `construirPerfilIA` (world/train.js), el mismo
  lugar donde ya se combinan los overrides de dificultad y el
  `sospechaMult` del tipo de tren.
- **Estado del tren** — una LISTA combinable: cada flag se tira POR
  SEPARADO (`rng.chance`), así que un mismo tren puede salir con dos o más
  a la vez, o ninguno. Probado con **alertaActivada** (8% de chance):
  arranca el asalto con la alarma ya sonando — mismo mecanismo que ya
  existía para "te vieron galopando" (`alarmaInicial`), pero disparado
  desde el sorteo del tren en vez de desde el galope. Por eso el aviso en
  pantalla es otro (`T.prompts.trenAlerta`, "YA ESTABAN SOBRE AVISO") y no
  el de siempre ("TE VIERON SUBIR"): no fue un error tuyo, el servicio ya
  venía así.

`redada`, `frenosDañados` y `listaAbierta` quedan en el catálogo con
`chance: 0` — la misma llave-no-amputación que ya usa "Alta vigilancia"
(`dura`, peso 0 en `data/train.js`): están anotadas para las fases que
vienen, sin tocar nada de esta arquitectura cuando llegue el momento de
prenderlas.

**LOS MODIFICADORES NO SE MUESTRAN EN EL CARTUCHO DEL MAPA**, a diferencia
de tipo y dificultad. Es la frase de Santi aplicada literalmente: la
sorpresa es parte del diseño, no un descuido — sabés qué vagones tiene el
tren, no qué te vas a encontrar arriba.

**Y POR AHORA SÓLO LE PASA AL TREN ESTÁNDAR** — pedido explícito de Santi
después de que esto ya estaba armado. `TRAIN_TYPES` suma un campo opcional,
`modificadores` (data/train.js), y `nuevoTipo` (mapScene.js) sólo llama a
`sortearClima`/`sortearEstadoTren` si el tipo de tren que salió lo tiene; si
no, el tren queda fijo en despejado y sin ningún estado — mismo patrón que
ya usan `rodantesCada`, `traqueteoCada`, `estampida` y `pesaElBotin`: un
campo que decide si un sistema aplica, no el sistema en sí. La razón: el
veloz y el de carga ya tienen su propia identidad muy afinada (traqueteo,
rodantes, estampida, el botín que pesa), y sumarles capas encima todavía no
se probó. Abrirles el sorteo más adelante es sólo agregarles el campo — no
hace falta tocar la arquitectura.

**DÓNDE SE SORTEAN Y CÓMO VIAJAN:** en `mapScene.js`, junto con el tipo de
tren (`nuevoTipo`, misma cadencia — se resortean al completar una vuelta, NO
en cada parada como la dificultad: son parte de qué SERVICIO es este tren,
no de la escolta que sube y baja en cada estación). De ahí viajan como
parámetros por `salir()` → `rideScene` (sólo pasamano, no cambian nada
durante el galope) → `raidScene`, que es donde de verdad hacen algo.
`buildTrain` (world/train.js) suma un octavo parámetro, `climaId`.

**VERIFICADO POR CONSOLA:**

- Distribución sobre 20.000 sorteos: tormenta 19,7% (vs 20% configurado),
  alertaActivada 8,1% (vs 8%) — ambos dentro de lo esperado.
- `buildTrain` con `climaId: 'tormenta'`: un guardia recién creado tenía
  `ai.hearRadius = 322` y `ai.hearStepRadius = 81,2` — exactamente la base
  (230 y 58) × 1,4.
- `raidScene` con `estado: ['alertaActivada']` (sin `alarmaInicial`):
  `alarm.active` quedó en `true` desde el primer cuadro, sin haber sido
  visto galopando.
- El camino completo mapa → galope → asalto, con una vía real: el cartucho
  de consola (`services.mapa.trenes`) mostró un tren con
  `clima=tormenta` y otro con `estado=alertaActivada` en el mismo sorteo,
  confirmando que los dos ejes conviven; entrando al galope con esos
  parámetros, `services.ride.train.clima.id` llegó como `'tormenta'` sin
  perderse en el pasamano.
- Corrida de 5 segundos simulados con los dos modificadores activos A LA
  VEZ (tormenta + alertaActivada): sin errores, alarma sonando, los 13
  guardias del tren vivos y reaccionando. Confirma lo que pedía probar esta
  fase — que la arquitectura combina antes de apilarle contenido.
- Después de agregar `modificadores: true` sólo al estándar: adelantando el
  mapa 24.000 segundos simulados, **veloz (616 muestras) y carga (405
  muestras) salieron el 100% de las veces despejado y sin ningún estado**;
  el estándar (1043 muestras) siguió sorteando normal — tormenta 18,8% (vs
  20%), algún estado 7,2% (vs 8%).

**NO JUGADO POR SANTI TODAVÍA** (verificado por consola, como el resto de
lo que se acumuló en la sesión anterior).

---

## ✅ HECHA · "Variedad de lo que pasa en los trenes" — Fase 2, redada

Fase 2 del plan de Santi ("lo casi gratis") ya venía dos tercios hecha desde
la Fase 1 sin querer: `alertaActivada` y `tormenta` eran justamente los dos
modificadores que se habían elegido para probar la arquitectura. Lo único
que faltaba era **redada** — mejor IA + guardias extra, la pieza más cara de
las tres.

**MEJOR IA:** `construirPerfilIA` (world/train.js) ahora suma un cuarto
parámetro, `estado`. Si trae `'redada'`, aplica el mismo `aiOverrides` de
"Alta vigilancia" (`DIFICULTADES.dura`, data/train.js) que ya usa la
dificultad — no un catálogo nuevo, el mismo. Se aplica ANTES de los
multiplicadores de tipo de tren y clima, en el mismo orden que dificultad:
un tren "tranquilo" con redada pelea como uno "dura" (puntería, reacción,
sospecha, asomada), sin que le haya subido la vida.

**MÁS GUARDIAS:** en el armado de `enemies` (mismo archivo), si `redada`
está activo, cada patrulla que ya existe en el vagón (`p.enemies`) se
DUPLICA — la copia (`redadaExtra: true`) arranca desde la mitad de su
propio recorrido (`path[Math.floor(path.length/2)]`, y `guard.pathIndex` se
ajusta para que no vuelva primero al punto 0) para no pisarse con el
original desde el primer cuadro. No hizo falta escribir ni un spawn nuevo
a mano: reusa exactamente los caminos que ya estaban en `data/wagons.js`.

**EL BLINDADO QUEDA AFUERA de la duplicación** — ya tiene su tope de 4 (el
techo del juego) y sus propias reglas (nunca sale de su vagón, dinamita
propia). Sí recibe la mejor IA, igual que el resto: eso es parejo para todo
el tren, sólo "más guardias" lo esquiva.

**LOS DOS NÚMEROS, elegidos por Santi sobre una tabla:**
- `chance: 0.05` — más raro que `alertaActivada` (8%) porque es, de lejos,
  el modificador más peligroso: suma guardias Y los hace pelear mejor a la
  vez.
- Duplicar TODAS las patrullas (no "+1 por vagón"): en el tren estándar,
  13 guardias base pasan a 22 (+69%) cuando sale.

**VERIFICADO POR CONSOLA, con un tren estándar real:**

- Con `estado: ['redada']`: guardias por vagón — pasajeros 8 (2 vagones × 2
  patrullas × 2), correo 6, comedor 2, ganado 2, **blindado 4 (sin tocar)**.
  Total 22, exacto contra la cuenta de la tabla.
- `ai.spreadNear` y `ai.aimTime` de un guardia común, con redada:
  0,068 y 0,21 — los mismos números de `dura.aiOverrides`, letra por letra.
- Corrida de 10 segundos con `redada` + `alertaActivada` + `tormenta` LOS
  TRES A LA VEZ: sin errores, alarma sonando, clima registrado, los 22
  guardias reaccionando (el jugador, sin control real durante la prueba,
  terminó muerto — esperable con tres modificadores duros encima y nadie
  esquivando, no es un bug).
- Sorteo de `ESTADO_TREN` sobre 50.000 tiradas: redada 4,97% (vs 5%),
  alertaActivada 7,83% (vs 8%), y las dos juntas en el mismo tren 0,43% de
  las veces — coincide con 5% × 8% si son independientes, que es justo lo
  que tenían que ser.

**NO JUGADO POR SANTI TODAVÍA.**

Con esto, la Fase 2 entera ("lo casi gratis") queda cerrada. Sigue la Fase 3
(comportamiento de guardias: conversando/vigilando puerta, después
durmiendo) cuando Santi quiera retomar el plan.

---

## 🐛 ARREGLADA · Tormenta no hacía nada (el alcance del oído vivía en el lugar equivocado)

Encontrada al arrancar la Fase 3, revisando cómo se lee `e.ai` en
`systems/ai.js` antes de copiar el mismo patrón para un comportamiento
nuevo. **`clima.hearMult` (Fase 1) multiplicaba `hearRadius`/`hearStepRadius`
en el PERFIL DE IA de cada guardia (`e.ai`) — pero nada en el juego lee esos
dos campos ahí.** El alcance del oído no es una habilidad por guardia como sí
lo son `spreadNear` o `aimTime` (que `spreadAt`/`updateSuspicion` sí leen de
`e.ai`, y por eso tormenta/redada/dura SÍ funcionan bien en esos dos): es una
propiedad del RUIDO en sí, un número que se manda suelto en cada
`bus.emit('noise', {radius})` — y ese número salía siempre de
`CONFIG.enemy.hearRadius` a secas, en siete lugares distintos (el disparo del
jugador, cuatro disparos de guardia en `ai.js`, el rifle del Cazarrecompensas,
el disparo de un jinete) más los dos dibujos del aro de sospecha de tus
pisadas (`entities/player.js`). Ninguno de los nueve miraba `e.ai`.

**EL ARREGLO SIGUE EL MISMO PATRÓN QUE `ruidoExtra`**, que ya resolvía
exactamente este problema para "cuántos vagones despierta un disparo": ahora
`hearRadius`/`hearStepRadius` viven en el TREN (`buildTrain`, world/train.js),
no en el perfil de IA — `CONFIG.enemy.hearRadius/hearStepRadius × clima.hearMult`,
calculado una sola vez. Los nueve lugares pasaron a leer
`world.train.hearRadius`/`hearStepRadius` en vez de la constante — con
respaldo a la constante si `world.train` no existe (la consola, por ejemplo).
El aro visual de las pisadas necesitó un parámetro nuevo en `drawPlayer`/
`drawPlayerOnRoof` (antes no tenían forma de saber en qué tren estaban parados).

**VERIFICADO POR CONSOLA:** interceptando `bus.emit` durante un disparo real
del jugador con `clima: 'tormenta'`, el evento de ruido salió con
`radius: 322` (230 × 1,4, el número correcto) en vez de 230. Con
`clima: 'despejado'`, `train.hearRadius`/`hearStepRadius` quedan en 230/58
sin tocar — confirma que el multiplicador no queda pegado por accidente.

**A jugar la Fase 2 no le cambia nada de lo demás** (redada y alertaActivada
ya estaban bien, esto sólo tocaba la parte de tormenta que no hacía nada) —
pero si Santi notó que una tormenta "no se sentía", ésta era la razón exacta.

---

## ✅ HECHA · "Variedad de lo que pasa en los trenes" — Fase 3, primera mitad: conversando y vigilando puerta

Fase 3 del plan de Santi ("comportamiento de guardias — de esto dependen
otras piezas"). Se construyó sólo la primera mitad: `conversando` y
`vigilandoPuerta`. `durmiendo` queda para una segunda vuelta — es "el más
particular de los tres" (necesita su propio disparador de despertar) según
el propio plan de Santi, y no convenía mezclarlo con esto.

**UN COMPORTAMIENTO POR VAGÓN, no por el tren entero** — a diferencia de
clima/estado. Nuevo catálogo `COMPORTAMIENTOS_VAGON` (data/modifiers.js,
pick-one, mismo `sortearPorPeso` de siempre): `normal` (patrulla como
siempre), `conversando`, `vigilandoPuerta`. `mapScene.js` arma un array
paralelo a `composicion` (`tren.comportamientos`), un valor por vagón, en el
mismo momento y con el mismo gate (`tipoTren.modificadores`, sólo estándar)
que ya usan clima/estado. El blindado queda afuera siempre (como redada):
sus guardias tienen sus propias reglas.

- **vigilandoPuerta**: TODOS los guardias del vagón nacen plantados junto a
  SU puerta de entrada — mismo cálculo que ya usa `puertaDeEntradaDe`
  (systems/ai.js, para `alertaEnPuerta`: `t.colStart * map.size + 10`) — en
  vez de patrullar. `path: []`, el mismo patrón "centinela" que ya usaba el
  4to guardia del blindado. Cero sistema nuevo de movimiento.
- **conversando**: los DOS PRIMEROS guardias del vagón (si tiene una
  tercera patrulla, como el correo, ésa sigue su ronda de siempre) nacen
  juntos, quietos (`path: []`), marcados `guard.conversando = true`.
  Mientras sigan en `state: 'patrol'`, `updateSuspicion` (systems/ai.js)
  multiplica cuánto sospechan por `CONVERSANDO_SUSPICION_MULT` — 0,45, EL
  MISMO número que ya usa `suspicionSneak` (vos agachado): no se inventó un
  precio nuevo. Se apaga solo en cuanto algo los saca de `patrol` — no hace
  falta resetear nada a mano.
- `conversando` sólo entra en la bolsa del vagón si tiene 2+ patrullas
  (`sortearComportamiento(rng, elegibleConversando)`, misma lógica de
  "sacar del catálogo sin tocarlo" que ya usa el resto del archivo) — el
  comedor, con una sola, nunca sale conversando.

**NÚMEROS, elegidos por Santi sobre una tabla de tres:** 40% normal / 30%
conversando / 30% vigilandoPuerta, por vagón elegible. Más frecuente que
clima/estado a propósito — es lo primero que se nota jugando (posición y
ritmo, no un número escondido).

**DE PASO, UN REFACTOR CHICO:** `buildTrain` (world/train.js) venía
sumando parámetros posicionales sueltos cada fase (`climaId`, después
`estado`, ahora esto). Antes de agregar el décimo, los tres —`climaId`,
`estado`, `comportamientos`— se agruparon en un objeto `opciones` al final
de la firma. Los primeros siete parámetros (los de siempre) no se tocaron.

**VERIFICADO POR CONSOLA:**

- Distribución de `sortearComportamiento` sobre 20.000 tiradas: elegible
  30,4%/29,4%/40,2% (vs 30/30/40); no elegible (comedor) 43,2%/56,8% entre
  vigilandoPuerta y normal, sin conversando — coincide con renormalizar
  30/70 y 40/70.
- Un tren armado a mano (pasajeros=conversando, correo=vigilandoPuerta,
  comedor=conversando forzado a propósito para probar el caso límite):
  los guardias de pasajeros y correo nacieron con `path: []` en las
  posiciones esperadas — y el pequeño desfasaje contra la cuenta a mano
  (13px en vez de 9, 9px en vez de 8) resultó ser `separateEnemies`
  empujándolos al mínimo de separación (`CONFIG.enemy.separation`, 13) en
  el primer cuadro, no un bug.
- El multiplicador de sospecha: **el primer intento de medirlo dio un
  resultado sin sentido** (un guardia "conversando" sospechando MÁS rápido
  que el "de control") — la causa era el arnés, no el código: los dos
  guardias comparados tenían `facing` distinto, así que uno veía al jugador
  y el otro no, y la diferencia real era de línea de visión, no del
  multiplicador. Medido de nuevo con el MISMO guardia, misma geometría,
  corrida dos veces (con y sin el flag): 0,119 contra 0,259 de sospecha
  tras 10 cuadros — razón 0,460, contra 0,45 esperado.
- Corrida real de 15 segundos con un tren armado por el sorteo de verdad
  (mina, `estado: ['redada']`, comportamientos mixtos incluyendo el
  blindado forzado a `normal`): sin errores, 22 guardias (13 base × 2 por
  redada, menos el ajuste del blindado sin duplicar).
- Corrida de 10 segundos con TODO junto (tormenta + redada + alertaActivada
  + conversando + vigilandoPuerta en el mismo tren): sin errores, 18
  guardias, alarma sonando, clima registrado.

**NO JUGADO POR SANTI TODAVÍA.**

---

## ✅ HECHA · Fase 3, dos correcciones tras describir el plan: la charla se ve, y una sola puerta por vagón

Santi, apenas le conté cómo había quedado la Fase 3 (sin haberla jugado
todavía, sólo con la descripción): dos pedidos concretos.

**1. "¿Cómo sé si los guardias están conversando o patrullando? Debería
aparecer el diálogo entre ellos, pero que sea medio cortado, no tan
explícito."** Tenía razón — nada en pantalla distinguía un guardia
"conversando" de cualquier otro, la mecánica (sospechan más lento) era
invisible.

**LA CHARLA**: fragmentos de texto sobre la cabeza del guardia, sólo
mientras sigue en `patrol`. Nuevo catálogo `T.ambiente.charla`
(text/es.js) — ocho frases, todas EMPIEZAN y TERMINAN con puntos
suspensivos a propósito ("...si el jefe se entera, nos cuelga..."): ni el
principio ni el final son tuyos, sólo pasaste al lado en el momento justo
para agarrar el medio. Es la traducción literal de "medio cortado, no tan
explícito" — no hay ninguna frase completa en el catálogo.

**SÓLO UNO DE LOS DOS GUARDIAS HABLA** (`charlaLider`, sólo `idx === 0` de
la pareja en world/train.js) — los dos siguen `conversando: true` (eso
sigue moviendo la sospecha de los dos), pero mostrar el texto en los dos a
la vez se hubiera visto como dos carteles pegados titilando. Nueva función
`actualizarCharla` (systems/ai.js), llamada cada cuadro desde `updateEnemy`:
alterna entre un pozo de silencio (`charlaTimer`, 2,5-4,5s) y una frase
visible (`charlaShowUntil`, 1,8s fijos) — no es un texto pegado todo el
rato, aparece y se corta, como charla de verdad. Se apaga sola en cuanto
algo lo saca de `patrol`, sin resetear nada a mano. Dibujado en
`drawEnemy` (entities/enemy.js) con el mismo gris que ya usa el cuerpo de
un guardia en calma (`col.enemy`) — es ambiente, no una alerta.

**2. "No pueden haber varios guardias cuidando una misma puerta. Tendría
que haber uno cuidando la puerta y el/los que sobran que hagan otra
cosa."** Bug real: la implementación original mandaba a TODOS los
guardias del vagón a la puerta cuando salía `vigilandoPuerta`. Arreglado
en `world/train.js` — ahora sólo el primero (`idx === 0`) se planta; el
resto ni entra al `if` de comportamiento, así que cae al camino de
siempre y sigue su patrulla normal ("otra cosa" es, para este primer
paso, lo que ya hacían antes de que existiera este comportamiento — un
guardia guardando una puerta con el resto patrullando el vagón como
siempre, no un sistema nuevo).

**VERIFICADO POR CONSOLA Y VISTO DE VERDAD con `foto.ps1`** (no sólo
medido — la sesión anterior encontró varios bugs de composición que
ninguna medición numérica mostraba, y esto es visual por definición):

- Un tren armado a mano (pasajeros=conversando, correo=vigilandoPuerta):
  en correo, un solo guardia con `path: []` parado en la puerta; los otros
  dos con `pathLen` 4 y 2 — sus patrullas de siempre, intactas.
- Forzando al líder a hablar: la frase apareció 1,82s (contra 1,8
  configurado), silencio 3,23s (dentro del rango 2,5-4,5), después otra
  frase distinta — el ciclo alterna de verdad, no una vez sola.
- Sacándolo de `patrol` a mano (`state = 'combat'`) mientras hablaba:
  `charlaShowUntil` se fue a 0 en el cuadro siguiente — se corta sola.
- Capturas con `foto.ps1`: la frase se lee clara arriba de la pareja que
  conversa, sin solaparse con nada importante; en correo, un guardia solo
  en el cruce de la puerta, los otros dispersos patrullando el vagón —
  exactamente la lectura que pidió Santi, un guardia cuidando y el resto
  haciendo su ronda.

**NO JUGADO POR SANTI TODAVÍA.**

---

## ✅ HECHA · Redada/alarma más frecuentes + piso de recompensa, y "vigilando puerta" con su propia señal

Santi, después de jugar un par de partidas: "quiero subir las probabilidades
de redada y alarma. Además, Redada debería aparecer su chance cuando el
jugador tiene más de 250 de recompensa. Y otra cosa: siempre están
patrullando. No veo ni que charlen ni que vigilen una puerta."

**LOS DOS NÚMEROS**, elegidos sobre tablas de tres: `alertaActivada` 8% →
**20%**; `redada` 5% → **15%**, pero ahora con un piso real.

**EL PISO DE REDADA**: `ESTADO_TREN.redada` suma `bountyMinimo: 250`
(data/modifiers.js). `sortearEstadoTren(rng, bounty)` filtra ANTES de tirar
la moneda — por debajo de 250 de recompensa, redada ni entra en la bolsa,
0% de verdad, no un número chico. `mapScene.js` le pasa `gameState.bounty`
(la misma que ya deciden los jinetes y el mini jefe) en el mismo lugar
donde ya sortea todo lo demás. Verificado por consola sobre 20.000
tiradas: con bounty 0, redada salió 0 veces; con bounty 300, 15,3% (vs
15%) — y alertaActivada, sin piso, dio ~20% en los dos casos.

**"SIEMPRE ESTÁN PATRULLANDO"**: investigado antes de tocar nada. Corrí
un galope REAL (input de verdad, `KeyD` sostenido, sin forzar nada desde
la consola) hasta que el reloj se agotó y el juego solo mandó al jugador
al asalto — y `comportamientos` llegó intacto: un guardia conversando, y
en el vagón de al lado, uno solo vigilando la puerta con los otros dos
patrullando su ronda de siempre. **El cableado no estaba roto.** Pero
encontré dos motivos reales por los que "vigilando puerta" en particular
es fácil no notarlo:

1. **Miraba para cualquier lado.** El guardia hereda la `facing` de su
   patrulla original, que no tiene por qué apuntar hacia la puerta una vez
   reposicionado ahí — arreglado: ahora mira explícitamente hacia la
   pasarela de entrada (`FACINGS.left`, el lado de la cola).
2. **No tenía ninguna señal propia.** A diferencia de "conversando" (que
   ya tiene el globo de texto), un guardia vigilando se veía IDÉNTICO a
   uno que se detuvo un instante en medio de su ronda — cosa que ya hacen
   todos (`scan()`, el mismo giro de cabeza de siempre). Se extendió el
   mismo sistema de la charla: `actualizarCharla` (systems/ai.js) ahora
   revisa `e.charlaLider` (conversando, pool `T.ambiente.charla`) O
   `e.vigilaLider` (vigilando puerta, pool nuevo `T.ambiente.vigilando`:
   "...ojo con esa puerta...", "...nadie entra sin que lo vea...") — mismo
   reloj de silencio/frase, mismo dibujo en `drawEnemy`, sólo cambia el
   pool según cuál flag esté puesto.

**VERIFICADO POR CONSOLA:**

- El galope real descripto arriba: `comportamientos` llegó sin tocarse
  hasta `train.enemies` después de una corrida completa de la aproximación
  (2726 cuadros, ~45s), no un atajo de consola.
- El guardia "vigilando puerta": `facing` salió exactamente `FACINGS.left`
  (3,14159…) y `path.length === 0`, como se esperaba.
- El ciclo de su nuevo texto: frase visible 1,82s, silencio, otra frase
  distinta — igual que ya se había medido para "conversando".
- 🐛 **En el camino, casi se reporta un bug fantasma**: el primer intento
  de medir el ciclo de texto del vigilante dio CERO eventos en 10
  segundos. La causa no era el código nuevo: el jugador de prueba había
  quedado a 722px del guardia, arriba del `cullPatrolDistance` (700) que
  ya existe para no actualizar guardias lejos y todavía patrullando — el
  MISMO sistema que ahorra trabajo en un tren de 4500px. Acercando al
  jugador, el ciclo se midió normal. Anotado porque es la clase exacta de
  cosa que las notas de esta sesión ya avisan que hay que sospechar del
  arnés antes que del código.
- Corrida de 10 segundos con TODO junto (tormenta + redada + alertaActivada
  + conversando + vigilandoPuerta con su nueva señal): sin errores.

**NO JUGADO POR SANTI TODAVÍA** — que es, comparado con las notas
anteriores, exactamente el pendiente que hay que cerrar: confirmar que
esto SÍ se nota jugando de verdad, ahora que tiene su propia señal.

---

## ✅ HECHA · Un disparo delata TODO su vagón, y avisa a los dos de al lado — no una lotería de píxeles

Santi: "quiero que bajes el ruido que hacen el Colt y el Smith. Los
guardias del vagón dónde fue disparado deberían estar en rojo, TODOS. Y
los guardias del vagón pegado al vagón dónde fue el disparo en amarillo,
buscando al jugador. Tanto los guardias del vagón anterior como el del
siguiente."

**CÓMO REACCIONABA UN DISPARO HASTA ACÁ**, y por qué no alcanzaba: sólo el
radio en píxeles (`CONFIG.enemy.hearRadius`, 230) ponía a alguien en
amarillo — y un vagón mide hasta 640px (pasajeros), así que un disparo en
una punta podía dejar sin enterarse a la mitad de la gente de su propio
vagón. Y el salto a ROJO por vagones enteros (`spreadAlarm`) sólo corría
DESPUÉS de que la alarma ya estuviera sonando — antes de eso, un tiro
nunca ponía a nadie en combate de verdad, sólo a mirar.

**LA REGLA NUEVA, DETERMINÍSTICA POR VAGÓN, SIEMPRE** (no hace falta que
la alarma ya esté sonando): el `bus.on('noise', ...)` de raidScene.js,
cuando el ruido es TU disparo, ahora hace esto ANTES que cualquier otra
cosa —

- **Tu propio vagón, entero, en rojo** (`alertCombat`, ya existía —la usa
  `spreadAlarm` para "los de atrás"— no hubo que inventar ningún estado).
- **El vagón anterior Y el siguiente, en amarillo** (`alertTo`, buscando —
  misma función que ya usa cualquier otro ruido del juego).
- Vagones más lejos: sin cambios, siguen dependiendo del radio en píxeles
  de siempre.
- Rendidos e inconscientes quedan afuera a propósito — un tiro en la otra
  punta del vagón no debería pararlos de las rodillas.
- **No fuerza `alarm.active`.** Es exactamente lo mismo que ya hacía
  `spreadAlarm` (que tampoco la fuerza): un guardia que entra en combate
  por ruido no grita solo (`enterCombat(e, world, false)`). Un tiroteo
  contenido en un vagón, resuelto rápido, todavía puede terminar LIMPIO —
  lo que rompe el bono es que alguien te VEA de verdad y avise al resto,
  no que hagas ruido.
- Sólo aplica a disparos de verdad (`wagons` viene del arma). La dinamita
  ya tiene su propio "todo el tren en rojo" (`retumbaElTren`, un evento
  aparte) y el cuerpo a cuerpo silencioso sigue silencioso — esto no les
  toca nada a esos dos.

**EL RUIDO DEL COLT Y EL SMITH — `noiseWagons` 1 → 0.** Este número ya NO
decide si tu propio vagón se entera (eso ahora es incondicional, ver
arriba): decide cuánto MÁS lejos empeora un tiro una vez que la alarma YA
está sonando, por encima de lo que la regla nueva ya garantiza. En 0, un
Colt o un Smith disparado con el tren ya alertado no suma ningún vagón de
más — el propio (rojo) y los dos de al lado (amarillo), que ya reaccionan
siempre, son todo lo que hacen. Quedó anotado en el archivo que la
escopeta o el rifle, cuando existan, son los candidatos naturales a tener
este número arriba de 0 — el Colt ya no puede ser "la vara" que nadie
baja, porque la vara cambió de lugar.

**🐛 BUG DE JS ENCONTRADO Y ARREGLADO DE PASO**: `entities/player.js`
armaba el evento de ruido con `w.noiseWagons || 1`. En JavaScript, `0` es
falsy — así que apenas bajé el Colt a `noiseWagons: 0`, ese `||` lo volvía
a subir a 1 solo, silenciosamente, sin ningún error. Cambiado a `?? 1`
(nullish coalescing: sólo cae al default con `undefined`/`null`, nunca con
un 0 puesto a propósito). Verificado por consola interceptando el propio
evento: con el fix, un disparo del Colt emite `wagons: 0` de verdad.

**VERIFICADO POR CONSOLA, con un tren real de 5 vagones (pasajeros /
correo / comedor / ganado / blindado) y el jugador parado en correo:**

- Un solo disparo de Colt, sin alarma sonando todavía: pasajeros
  (anterior) quedó `suspicious` × 2, correo (propio) `combat` × 3, comedor
  (siguiente) `suspicious` × 1, ganado y blindado sin tocar —
  `patrol`. `alarmaActiva` siguió en `false`.
- Interceptando el propio `bus.emit`: el disparo salió con `wagons: 0`
  exacto (antes del fix hubiera salido `1`).
- Corrida de 10 segundos con TODO junto (tormenta + redada + conversando +
  vigilandoPuerta + disparando en loop): sin errores, alarma terminó
  activa (por las reglas normales del juego, no por este cambio), 18
  guardias.

**NO JUGADO POR SANTI TODAVÍA.**

---

## ✅ HECHA · Los guardias "conversando" ahora se miran, y el cono se les cierra

Santi: "cuando conversan entre ellos, no parece que en realidad conversan.
Por qué? Bueno, porque no se están mirando de frente, es como si en
realidad estuvieran bugueados. Deberían estar enfrentados al charlar y el
cono que tienen que hace que te puedan ver debería reducirse". Tenía
razón en las dos cosas.

**1. NO SE MIRABAN.** Heredaban la `facing` de su patrulla original —
`world/train.js` los reposiciona juntos, pero nunca les tocaba hacia dónde
miraban, así que quedaban con la orientación que traían de su ronda vieja,
casi nunca hacia el otro. Arreglado: como los dos quedan alineados en X
(uno a la izquierda, el otro 9px a la derecha), el de la izquierda
(`idx === 0`) ahora mira a la derecha y el de la derecha mira a la
izquierda — SIEMPRE enfrentados, sea cual sea la patrulla de la que
vinieron.

**2. EL CONO SE ANGOSTA MIENTRAS CONVERSAN.** `canSeeFrom` (systems/ai.js)
sólo aceptaba `viewDistance` como override opcional (para los mini jefes,
que ven más lejos); le agregué `viewAngle` con el mismo patrón — por
default el cono de siempre, y sólo lo angosta quien lo pase. Nueva
constante `CONVERSANDO_VIEW_ANGLE` (data/modifiers.js): la MITAD del cono
normal (`CONFIG.enemy.viewAngle × 0,5`) — no un número nuevo inventado, la
misma proporción que ya usa `spreadApuntado` para "esto lo distrae". Se
aplica en `updateEnemy` sólo mientras `e.conversando && e.state ===
'patrol'`: mirando a su compañero en vez de al pasillo, literalmente tiene
menos ojo puesto en vos. Se suma al multiplicador de sospecha (0,45×) que
ya existía — ahora "conversando" reduce DOS cosas, no una: cuánto ve y qué
tan rápido sospecha lo que sí ve.

**VERIFICADO POR CONSOLA:**

- `canSeeFrom` en aislamiento, con un mapa sin paredes: a 0,70 rad de la
  mira (dentro del cono normal de 0,95, afuera del angosto de 0,475) —
  cono normal `true`, angosto `false`. A 0,20 rad (dentro de los dos) —
  los dos `true`.
- Integración real: mismo guardia, misma geometría, corrida dos veces (con
  y sin `conversando`) a 0,70 rad — sin el flag, ganó sospecha (0,0144);
  con el flag, sospecha se quedó en 0 — el jugador quedó literalmente
  afuera de su cono.
- Los dos guardias de una pareja real: `facing` 0,005 y 3,147 (derecha e
  izquierda casi exactas) apenas nacen.
- **Visto de verdad con `foto.ps1`, con zoom** (10x, recortado): se leen
  claramente como dos figuras de frente, no dos guardias sueltos mirando
  para cualquier lado.
- Corrida de 10 segundos con todo lo demás encima (tormenta + redada +
  conversando + vigilandoPuerta): sin errores.

**NOTA APARTE, NO ES UN BUG:** el `scan()` que ya hace cualquier guardia
quieto (gira la cabeza mientras espera, `doPatrol`) sigue corriendo sobre
estos dos — así que la orientación EXACTA se les va a ir desviando un poco
con el tiempo, no quedan clavados como estatuas. Es la misma animación de
"está vivo, no congelado" que ya tenía el centinela del blindado; se
mantuvo a propósito.

**NO JUGADO POR SANTI TODAVÍA.**

---

## ✅ HECHA · La cara no se les mueve, y el cono además de angosto queda corto

Corrección directa sobre la entrada anterior. Santi: "pero no debería
moverse la cara (el cono de los guardias para localizar). Y debería ser
el cono más corto."

**1. YA NO GIRAN LA CABEZA.** La nota anterior decía "no es un bug" sobre
esto — Santi la corrigió: para esta pareja específica, sí lo es.
`doPatrol` (systems/ai.js) llama a `scan()` —el giro de cabeza que ya hace
cualquier guardia parado— para TODO guardia con `path: []`, sin
distinguir. Ahora, si `e.conversando`, no lo llama: se quedan mirándose
exacto, sin desviarse. El centinela del blindado y el guardia
"vigilandoPuerta" siguen escaneando como siempre — están solos, mirar
alrededor tiene sentido para ellos; estos dos se están mirando ENTRE
ELLOS, así que girar la cabeza les deshacía justo lo que se acababa de
arreglar.

**2. EL CONO TAMBIÉN LLEGA MENOS LEJOS**, no sólo más angosto. Nueva
constante `CONVERSANDO_VIEW_DISTANCE` (data/modifiers.js): la mitad de
`CONFIG.enemy.viewDistance` (118 → 59px) — misma proporción que ya usa
`CONVERSANDO_VIEW_ANGLE`. Viaja como el `viewDistance` opcional de
`canSeeFrom` (el mismo parámetro que ya usan los mini jefes, sólo que ahí
lo agrandan y acá se achica), con la misma condición de siempre:
`e.conversando && e.state === 'patrol'`.

**VERIFICADO POR CONSOLA:**

- `facing` de los dos guardias, medido apenas nacen y de nuevo después de
  5 segundos reales simulados (300 cuadros): 0 y 3,14159 exactos, sin
  mover un decimal.
- A 80px (entre el alcance corto, 59, y el normal, 118), en línea recta
  (el ángulo no es la variable acá): un guardia normal ganó sospecha
  (0,0169); el mismo guardia con `conversando` se quedó en 0 — quedó
  literalmente afuera del alcance de su cono.
- Corrida de 10 segundos con todo lo demás encima (tormenta + redada +
  conversando + vigilandoPuerta): sin errores.

**NO JUGADO POR SANTI TODAVÍA.**

---

## ✅ HECHA · Fase 3, tercer comportamiento: vigilando la caja fuerte

Santi: "recuerda que también hay un tipo de estado que vigila una caja
fuerte" — estaba en el diseño original de esta fase ("vigilando lo que
haya que vigilar ahí") y se había quedado afuera de la primera vuelta
(conversando + vigilandoPuerta).

**MISMO PATRÓN QUE `vigilandoPuerta`, aplicado a otro punto fijo.** Nuevo
`vigilandoCaja` en `COMPORTAMIENTOS_VAGON` (data/modifiers.js, peso 30,
mismo peso que vigilandoPuerta). Sólo entra en la bolsa de un vagón si
ESE vagón tiene una caja fuerte de verdad (`elegibleCaja`, calculado en
`mapScene.js` mirando `WAGONS[id].loot` por un `type: 'strongbox'`) — el
mismo mecanismo de exclusión que ya usa `conversando` con sus 2+
patrullas. Hoy el único vagón común elegible es el correo (el blindado
tiene sus propias dos cajas, pero ya está afuera de todo este sorteo,
como redada).

**EN `world/train.js`**: sólo el primer guardia (`idx === 0`) se planta
—el resto sigue su ronda normal, la misma corrección que ya se había
hecho para vigilandoPuerta—, a 18px al lado de la caja (no ENCIMA: no
tapa el cofre ni estorba el gesto de abrirlo) y mirándola de frente.
Reusa `esVigilando`/`vigilaLider`, así que de yapa hereda gratis la señal
que ya existía: el mismo pool de frases sueltas ("...ojo con esa
puerta...", genérico para "alguien vigilando algo puntual").

**VERIFICADO POR CONSOLA:**

- Distribución de `sortearComportamiento` sobre 20.000 tiradas: con caja
  elegible, los cuatro (normal/conversando/vigilandoPuerta/vigilandoCaja)
  salieron 30,8%/23,4%/22,7%/23,1% — coincide con 40/30/30/30
  renormalizado; sin caja, `vigilandoCaja` no apareció ni una vez.
- Un correo real con `vigilandoCaja`: el guardia nació en `x = cajaX -
  18`, mismo `y` que la caja, `path: []`, `facing` apuntando hacia ella,
  `vigilaLider: true` — y los otros dos guardias del vagón, con sus
  patrullas de 4 y 2 puntos intactas.
- **Visto de verdad con `foto.ps1`, con zoom**: el guardia parado justo al
  lado del ícono de la caja fuerte (el cuadrado gris con el centro más
  oscuro), mirándola — se lee exactamente como "cuidando eso".
- Corrida de 10 segundos con los cuatro comportamientos y el resto de los
  modificadores (tormenta, redada) en el mismo tren: sin errores.

**NO JUGADO POR SANTI TODAVÍA.** Con esto, la primera mitad de la Fase 3
queda con sus tres comportamientos completos: conversando, vigilando
puerta, vigilando caja fuerte. Sigue `durmiendo` cuando Santi quiera
retomarlo.

---

## ✅ HECHA · Más chance de guardia en la caja fuerte (11,5% → 14,3%)

Santi preguntó la probabilidad real de que un tren tenga un guardia
custodiando la caja fuerte (11,5%, calculado y verificado por consola) y
después pidió subirla "un poco". Elegido sobre una tabla de tres (peso
40/50/60 en `COMPORTAMIENTOS_VAGON.vigilandoCaja` → ~14,3/15,6/17,6%
general): **40**, contra 30 de antes.

Con este cambio, dentro de un vagón con caja fuerte (hoy sólo el correo),
`vigilandoCaja` pasa a ser LIGERAMENTE más frecuente que `conversando` y
`vigilandoPuerta` (40 contra 30 cada una) — antes de esto los tres
comportamientos no-normales pesaban lo mismo.

**VERIFICADO POR CONSOLA**, mismo método que la medición anterior (sorteo
real de `sortearTipoTren` + `sortearComposicion` + `sortearComportamiento`,
200.000 tiradas): **14,33%**, contra el 14,29% esperado por cuenta
(0,5 × 40/140) — coincide.

**NO JUGADO POR SANTI TODAVÍA.**

---

## ✅ HECHA · "VIGILANDO", fijo, arriba de quien cuida una puerta o una caja fuerte

Santi: "quiero que encima de los guardias que vigilan una puerta o una
caja fuerte, diga 'vigilando'".

**"CONVERSANDO" Y "VIGILANDO" SON DOS COSAS DISTINTAS, Y AHORA SE DIBUJAN
DISTINTO.** Hasta acá los dos usaban el mismo mecanismo (`actualizarCharla`):
un pozo de silencio y una frase que aparece y se corta, tomada de un pool
de texto (charla tenía el suyo, vigilar tenía el suyo — "...ojo con esa
puerta..."). Pero "vigilando" no es una frase suelta que se le ocurre a
alguien de a ratos: es lo que ESTÁ HACIENDO todo el tiempo. Ahora:

- **`vigilaLider`** (vigilando puerta o caja fuerte) ya NO pasa por
  `actualizarCharla` — `drawEnemy` (entities/enemy.js) dibuja
  `T.ambiente.vigilando` (ahora un string fijo, `'VIGILANDO'`, no un pool)
  todo el tiempo que `e.state === 'patrol'`, sin ningún reloj propio.
  Mismo criterio que "AGACHADO" o "A CUBIERTO" en el HUD: un estado se
  muestra fijo, no parpadea.
- **`charlaLider`** (conversando) sigue exactamente igual que antes —
  frases sueltas, con su pozo de silencio, tomadas de `T.ambiente.charla`.
- Los dos siguen cediendo el lugar a la barra de sospecha o al "!" de
  combate apenas el guardia deja de estar tranquilo — eso no cambió.

**LIMPIEZA DE PASO**: `T.ambiente.vigilando` pasó de array de seis frases
a un string único; `guard.charlaTimer` ya no se inicializa para
`vigilaLider` en `world/train.js` (no le hace falta, no tiene reloj).

**VERIFICADO POR CONSOLA Y VISTO DE VERDAD con `foto.ps1`, con zoom**: el
guardia vigilando la caja fuerte del correo con "VIGILANDO" bien legible
arriba de la cabeza, junto al ícono de la caja. Forzado a `combat`,
`drawEnemy` dejó de mostrarlo (pasa al "!" de siempre, misma rama
`if/else if` de antes). Corrida de 10 segundos con los tres comportamientos
más el resto de los modificadores: sin errores.

**NO JUGADO POR SANTI TODAVÍA.**

---

## 🐛 ARREGLADA · La alarma DE VERDAD también dejaba rojo al vagón de al lado

Santi: "por qué cuando disparo, los del vagón de al lado se ponen en rojo.
Creí que habíamos dicho que no debería pasar eso." Investigado antes de
tocar nada — un tiro suelto, aislado, ya dejaba exactamente lo pedido
(propio rojo, vecino amarillo, verificado la vez pasada). El problema
aparecía un rato después, jugando de verdad: armé un tiroteo completo
(no un tiro solo) y até los eventos del juego para ver la causa exacta.

**ERAN DOS SISTEMAS DISTINTOS, Y SÓLO SE HABÍA CORREGIDO UNO.** Apenas un
guardia de tu propio vagón te ve de verdad (algo que pasa rápido, porque ya
están todos cazándote ahí adentro) y grita, se dispara la ALARMA DE
VERDAD — un sistema más viejo, de una sesión anterior ("los guardias de
adelante esperan en rojo, en la puerta"), que hasta ahora ponía en rojo al
vagón donde te vieron Y a uno de cada lado. Verificado con los eventos del
bus: apenas sale `guardAlerted`, el vagón vecino pasa a `combat` en el
mismo cuadro. Desde afuera se siente igual que "disparé y se puso rojo",
pero es un camino distinto (y más largo) del que se había arreglado.

**AHORA LOS DOS SISTEMAS USAN EL MISMO CRITERIO.** `spreadAlarm`
(raidScene.js) cambió: sólo el vagón CENTRO (donde de verdad te vieron)
queda en rojo persiguiendo tu última posición conocida; cualquier vecino
dentro del alcance —para cualquiera de los dos lados— queda en AMARILLO,
buscando (`alertTo`, la misma función que ya usa un disparo). Antes, "de
adelante" y "de atrás" tenían conductas distintas pero los dos terminaban
en rojo; ahora los dos quedan igual, amarillo.

**`alertaEnPuerta` (systems/ai.js) se quedó sin ningún lugar que la
llame.** No se borró —el concepto ("se entera pero no cruza, se planta
armado en su puerta") puede volver a hacer falta para otro sistema— pero
quedó marcada con una nota: si sigue sin uso en una sesión futura, es
candidata segura para sacarla del todo junto con `puertaDeEntradaDe` y el
chequeo de `vaHaciaPuerta` en `doCombat`.

**VERIFICADO POR CONSOLA, con el mismo tiroteo completo que encontró el
problema** (30 segundos reales, disparando sin parar): la alarma quedó
`true` todo el tiempo, el vagón donde estabas se mantuvo en `combat` los
tres guardias, y LOS DOS VECINOS (uno "adelante", uno "atrás") se
mantuvieron en `suspicious` de punta a punta — nunca pasaron a rojo, ni
una sola vez en 30 segundos de tiroteo sostenido. Corrida aparte de 15
segundos con todo lo demás encima (tormenta + redada + alertaActivada +
los tres comportamientos de guardia): sin errores.

**NO JUGADO POR SANTI TODAVÍA.**

---

## ✅ HECHA · "Variedad de lo que pasa en los trenes" — Fase 4: puerta bloqueada, Pistolero, Dinamitero y civil encubierto

Santi decidió **saltear la Fase 3b (durmiendo)**: *"requiere que sea de
noche. Y que sea de noche significa otras cosas, no solo 'es de noche'"* —
o sea que arrastra un sistema entero (la noche) que todavía no existe, y no
tiene sentido empezar por ahí. Queda para cuando se haga esa vuelta, con el
vagón de guardias dormidos (Fase 6) colgando de ella.

Las cuatro cosas de la Fase 4 son variantes CONTENIDAS: cada una se prueba
sola y ninguna depende de las otras.

### 1. Puerta bloqueada — un estado más del tren

`ESTADO_TREN.puertaBloqueada` (data/modifiers.js, chance 15%, sólo tren
estándar como toda esta familia). Una o más puertas de madera nacen
**trabadas**: empujarlas no las abre, hay que romperlas a tiros.

**NO ES UN SISTEMA NUEVO, y eso es lo mejor que tiene.** `trabada`
(entities/door.js) existe desde que el Cazarrecompensas traba el tren al
despertar: tiene su tranca roja dibujada, su regla de "sólo se abre
rompiéndola" y ya estaba contemplada en `bloqueaPuertaCerrada`
(raidScene.js), la función que decide qué frena el paso. Lo único que
cambia es DE DÓNDE sale el flag — del sorteo, no de un jefe.

**Al azar en cuál Y en cuántas** (*Santi: "es al azar. Pero no solo en qué
vagón, sino en cuantos"*). La cantidad sale de `PUERTAS_TRABADAS`, un
sorteo por peso 70/20/10 para 1/2/3 puertas — promedio 1,4. Es un peso y no
un `rng.int(1,3)` a propósito: así 3 es raro y 1 es lo normal. Las
candidatas son TODAS las de madera del tren sin mirar qué vagón es; si
fuera siempre la del correo se volvería una regla que se aprende, y esta
fase entera existe para que no se pueda saber de antemano. La blindada
nunca entra: ya tiene su propia llave (la dinamita).

**🐛 CRUCE ENTRE SISTEMAS, ENCONTRADO ANTES DE QUE PASARA:** matar al
Cazarrecompensas llama a `destrabarPuertasDelTren()`, que destrababa
TODAS — incluidas las que nunca trabó él. Ahora `trabarPuerta(d, deOrigen)`
marca `trabadaDeOrigen` y `destrabarPuerta` respeta esas: el jefe suelta lo
que cerró él, y lo que ya venía cerrado sigue cerrado.

**VERIFICADO JUGANDO POR CONSOLA:** 8 asaltos seguidos dieron 1/1/2/3/1/2/1/1
puertas trabadas, ninguna blindada, y sin el modificador 0 de 0. Empujándola
120 cuadros, el jugador avanza 11px y se frena contra ella (`open` sigue en
false); tres impactos la rompen (vida 3 → 0) y ahí sí pasa. Y el destrabe del
jefe: la que trabó él se abre, las dos de origen siguen trabadas.
Distribución con 200.000 tiradas: 69,99 / 19,92 / 10,10%, promedio 1,40.

### 2. El Pistolero — un tipo de guardia, no un guardia más fuerte

*(Santi, definiéndolo: "gatillo velocísimo (tiene un revólver en cada mano)
y puntería floja. Se cubre poco, se suele parar en medio del pasillo")*

`GUARD_TYPES.pistolero` (data/guards.js) con **la misma vida que
cualquiera**. Lo que cambia es cómo pelea, y las tres cosas tiran para el
mismo lado — es un tipo que no se cuida:

| | Guardia normal | Pistolero |
|---|---|---|
| Espera entre ráfagas | 0,75 s | 0,45 s |
| Balas por ráfaga | 2 | 3 |
| Entre bala y bala | 0,28 s | 0,16 s (dos caños alternándose) |
| Dispersión cerca / lejos | 0,09 / 0,28 | 0,13 / 0,39 (+40%) |
| Cobertura | busca siempre | **nunca** |

El `burstDelay` no estaba en la tabla que Santi aprobó: se sumó al
construir, porque es la lectura literal de "un revólver en cada mano" (los
tiros salen pegados porque hay dos caños). Queda anotado por si lo quiere
sacar.

**"SE CUBRE POCO" NO NECESITÓ NINGUNA CONDUCTA NUEVA.** Un flag
(`evitaCobertura`, que sale del TIPO y no de un parámetro, así vale también
para un guardia creado a mano en la consola) apaga `needsCover` en
`doCombat` (systems/ai.js). Con `coverPoint` siempre en null, el guardia cae
solo en la rama de "sin cobertura" que existe desde la fase 2 para el que se
quedó sin lugar donde esconderse: se acerca hasta ~92px y ahí dispara
parado. Era una rama a la que casi nadie llegaba; ahora es el plan de
alguien. **El repliegue del herido sigue funcionándole**: ése le pone un
`coverPoint` por su cuenta, más arriba en la función.

**Cuándo aparece** (*Santi: "el Pistolero con la recompensa y honor. Si el
jugador tiene más de 300 de recompensa y honor negativo superior a -10,
entonces ahí empieza la probabilidad de aparición"*): `VARIANTES_GUARDIA`
(data/modifiers.js) con `bountyMinimo: 300` **y** `honorMaximo: -10`, las
dos a la vez. Es el primer lugar del juego donde `bounty` y `honor` tienen
que dar juntos: uno dice que vale la pena contratar gente para cazarte, el
otro que ya te tienen miedo. Es un piso, no una rampa. Con el gate abierto,
20% por guardia común.

**TERCER EJE DE SORTEO, y por eso es un mecanismo aparte:** clima y estado
son del TREN, los comportamientos son del VAGÓN, y esto es el primero que se
juega POR GUARDIA — dos del mismo vagón pueden salir distintos. El permiso
(`variantesPermitidas`) se calcula en `mapScene.js`, que sí conoce
`gameState`, y viaja como dato hasta `buildTrain`: `world/train.js` sigue sin
leer el estado de la partida, como siempre.

**VERIFICADO POR CONSOLA, 360 guardias comunes de 40 trenes:** 20,6%
pistoleros (esperado 20%), 0 guardias "contaminados" (el perfil de IA
compartido por todo el tren no se ensució: los overrides van en una copia) y
los 160 blindados intactos. Gate: bounty 300 + honor 0 → nada; bounty 0 +
honor −10 → nada; bounty 299 + honor −20 → nada; bounty 300 + honor −10 →
pistolero.

**Y VERIFICADO PELEANDO, 3 corridas de 30 s cada uno con línea de visión
garantizada** (los primeros intentos daban 0 balas porque el arnés ponía al
jugador detrás de un asiento — el arnés, no el código):

| | Normal | Pistolero |
|---|---|---|
| Balas en 30 s | ~6 | **~44** |
| Impactos al jugador | ~1 | **~4,3** |
| % de aciertos | ~14% | ~10% |
| Cuadros con cobertura (de 1800) | ~1490 | **0** |
| Distancia a la que se planta | 88-104 px | 91 px |

O sea: siete veces más plomo y cuatro veces más daño, con peor puntería y
**sin cubrirse nunca**. El intercambio se paga solo: está siempre a la
vista, con dos de vida — dos tiros de Colt son 0,8 s.

### 3. El Dinamitero — construido y apagado hasta la Fase 6

*(Santi: "el Dinamitero cuando aparece el vagón de armas/dinamita")*. Ese
vagón es de la Fase 6 y no existe todavía, así que el tipo nace con
`chance: 0` en `VARIANTES_GUARDIA`: la misma llave-no-amputación de "Alta
vigilancia" (`peso: 0`) y de `frenosDañados`.

Un guardia común que además lleva **un cartucho** y lo usa con las mismas
reglas que los cuatro del blindado. **No hizo falta tocar una línea de la
IA**: `consideraTirarDinamita` (systems/ai.js) nunca preguntó de qué vagón
es el que la tira, sólo si le queda dinamita encima. La dinamita ahora puede
venir del TIPO (`createEnemy` lee `options.dynamite ?? tipo.dynamite ?? 0`,
con `??` y no `||`, por la lección de `noiseWagons`) y `world/train.js` pasa
`def.dynamite` a secas en vez de `def.dynamite || 0`.

**VERIFICADO POR CONSOLA:** con `chance: 0`, 0 dinamiteros en 135 guardias
comunes, y `variantesPermitidas` no lo devuelve ni con el gate abierto de
par en par. Prendido a mano: sale, `look: 'bandolera'`, 1 de dinamita, vida
2, comparte el perfil de IA del tren, y los blindados siguen con la suya.
Con el jugador PARAPETADO a 146px (el escenario que pide el sistema), el
dinamitero enciende la mecha y **lanza su cartucho a los 0,7 s**; el guardia
normal de control, en el mismo escenario, cero.

### 4. El civil encubierto — se revela cuando le das la espalda

*(Santi, eligiendo el disparador entre tres: "al darle la espalda")* — no al
robarlo, no al pasarle cerca. Eso convierte en peligroso el gesto más
repetido del asalto: darte vuelta y seguir camino.

**Sorteo:** una vez por vagón con pasajeros, como mucho uno por vagón, 10%
por pasajero (`sortearCivilEncubierto` hace la cuenta de una: 1 − (1−p)^n).
En el tren estándar (4 + 4 + 5 pasajeros) da 34,4% / 34,4% / 41,0% por
vagón. El tope por vagón existe para que robar pasajeros siga siendo una
apuesta y no una trampa.

**Las tres condiciones, las tres a la vez:** cerca (64px, casi el
`hearStepRadius`) con línea de visión; dándole la espalda de verdad (coseno
−0,3 contra tu MIRA, no contra hacia dónde caminás — misma lectura que
`direccionAtras`); y sostenido 0,8 s, que se cortan apenas te das vuelta.
Encañonado no se anima a nada, igual que el rendido.

**EL AVISO ES LA MITAD DEL SISTEMA.** 1,1 s sacando el arma —exactamente
`traicionDuracion`, y por el mismo motivo— con el martillo del revólver
sonando (`cock`) y el cuerpo saltando a `enemyAlert` pasado el punto medio,
igual que el rendido que se para para traicionarte. Ningún peligro de este
juego dispara sin que el cuerpo lo anuncie primero; la sorpresa es QUIÉN es,
no que te mate sin que puedas hacer nada.

**Al completarse deja de ser un pasajero y pasa a ser un guardia,
literalmente:** sale de `world.passengers` y entra en `world.enemies` como
`GUARD_TYPES.encubierto`. Por eso no hubo que escribir una línea de IA
nueva: de ahí en adelante pelea, se rinde y muere con el código de siempre.
**Sigue vestido de civil** (`look: 'civil'`, el sombrerito de los
pasajeros): si al revelarse se convirtiera en un guardia con sombrero, la
sorpresa duraría un asalto — así, no vuelve a confiar en la silueta de un
pasajero nunca más.

**🐛 TRES COSAS QUE SÓLO APARECIERON MIDIENDO EL COMPORTAMIENTO REAL:**

1. **Sólo se animaba estando `idle` o `amenazado`, y así no se activaba
   casi nunca.** Para que te dé la espalda tenés que estar cerca, y estando
   cerca te ve — y si te ve, entra en pánico como cualquier pasajero. La
   condición se contradecía sola. La corrección no es un parche, es lo que
   el personaje ES: un agente encubierto **finge**. El pánico, el grito y
   el temblor son el disfraz. Ahora se revela desde cualquier estado; lo
   único que lo frena es que lo tengas encañonado robándole.
2. **Nacía adentro del asiento** donde estaba sentado, y quedaba trabado.
   `lugarLibreCerca` (raidScene.js) lo levanta al pasillo — que es lo que
   pasaría igual: el tipo se PARA para sacar el arma.
3. **Y con eso todavía no alcanzaba.** Trazando una grilla de solidez
   alrededor suyo se vio que quedaba en el hueco entre dos bloques de
   asientos (`..###G.###.`, con el pasillo una fila más abajo): entraba
   perfecto, pero con asientos pegados a los dos costados. Su cobertura
   quedaba del otro lado de un bloque, y a menos de `routeDistance` (150px)
   la IA va en línea recta sin rodear: ocho segundos en combate, viendo al
   jugador, sin dar un paso ni un tiro. El `stuckTimer > 1.2` que debería
   soltarlo tampoco saltaba, porque se movía unos píxeles arriba y abajo y
   lo reseteaba. Se arregló en dos capas: `lugarLibreCerca` ahora exige
   **espacio también a los costados** (que es, literalmente, la definición
   del pasillo), y el tipo lleva `evitaCobertura` — que además es lo que el
   personaje es: se acaba de parar con el arma en la mano a tres metros
   tuyos, no está buscando dónde parapetarse.

   **Eso último es un agujero VIEJO del sistema de cobertura**, no algo que
   traiga este tipo: le pasaría a cualquier guardia que empiece a pelear
   metido entre asientos. No se veía porque todos los demás entran caminando
   por el pasillo desde lejos, y desde lejos sí calculan ruta. Queda anotado
   para el día que aparezca de nuevo.

**VERIFICADO JUGANDO POR CONSOLA:** dándole la espalda, el aviso empieza a
los **0,78 s** (esperado 0,80) y se convierte en guardia a los **1,88 s**
(1,10 s exactos de aviso); apuntándole, no se revela nunca en 900 cuadros.
Ya convertido: 18 balas en 15 s y 6-9 impactos al jugador, con el primer
tiro a los 2,2 s (0,78 + 1,10 + el apuntado de siempre). Sorteo real, 400
trenes: 1,07 encubiertos por tren (esperado 1,10); 26% ninguno, 44% uno, 25%
dos, 4% tres.

### Lo que se miró de verdad (foto.ps1)

Las siluetas nuevas, en patrulla y en combate, al lado de un guardia normal
y uno blindado. **Y ahí apareció un bug que no se podía medir:** las
cartucheras del Pistolero eran dos marcas marrones a los costados del
cuerpo, o sea SOBRE EL PISO del vagón, que es marrón — no se distinguían de
una tabla del suelo. Se movieron ENCIMA del torso y en claro, el mismo lugar
y la misma idea que la placa del blindado y la bandolera del dinamitero, que
sí se leen. También se miró el aviso del encubierto (el arma saliendo del
saco, el cuerpo en rojo) y el guardia ya revelado, y ahí se vio que el
cartel "¡ERA DE LA LEY!" se encimaba con el `!` de alerta: subido de −16 a
−26.

### Corrida completa

60 segundos de asalto con TODO junto (puerta bloqueada + alerta activada +
pistoleros + dinamiteros forzados + tres encubiertos), con un bot avanzando
y disparando: **sin un solo error de consola**. Y el camino real (mapa →
sorteo → tren), con muestreo sobre trenes re-sorteados de verdad: los
veloces y los de carga siguen saliendo con `variantes: []` y todos los
`encubiertos` en false — el gate de "sólo el estándar" aguanta.

**NO JUGADO POR SANTI TODAVÍA.**

---

## 🐛 ARREGLADA · El "gatillo velocísimo" del Pistolero no existía (`tryFire` leía la constante global)

*(Santi, apenas lo jugó: "no me gusta como quedó el pistolero. No siento que
dispare rápido verdaderamente. Además, el tener que acercarse para seguir
disparando interrumpe su ráfaga")* — y tenía razón en lo primero de una
forma que ninguna de las mediciones de la sesión anterior había mostrado.

**`tryFire` (systems/ai.js) leía `CONFIG.enemy` en vez de `e.ai`.** Esa
función es la dueña de `burstSize`, `burstDelay` y `fireCooldown`, o sea
**los tres números que definen "gatillo rápido"** — y era la única del
combate que se había quedado con la constante global. El agujero nunca se
notó porque hasta ahora nadie sobreescribía esos campos: los `aiOverrides`
de "Alta vigilancia" tocan puntería, reacción, sospecha y asomada, y todos
ésos SÍ se leen de `e.ai` (`spreadAt`, `startAim`, `updateSuspicion`,
`holdCoverAndFire`). El primero que quiso cambiar la CADENCIA fue el
Pistolero, y ahí saltó.

**POR QUÉ LA MEDICIÓN ANTERIOR NO LO VIO:** la sesión pasada se midió
"balas en 30 segundos" contra un guardia común, y dio 44 contra 6 — un 7×
que parecía confirmar todo. Pero esa diferencia venía ENTERA de
`evitaCobertura` (el guardia común se pasa el 80% del tiempo escondido
detrás de una cobertura, asomándose de a ratos), no de la cadencia. Medir
el efecto TOTAL escondió que uno de los dos ingredientes no estaba puesto.
La medición que lo encontró fue otra: los intervalos entre bala y bala.
Salían 0,38 s, que es exactamente `burstDelay` global (0,28) más el 0,09
del segundo tiro — o sea el ritmo de un guardia cualquiera.

| | Guardia común | Pistolero ANTES | Pistolero DESPUÉS |
|---|---|---|---|
| Balas por segundo | 0,77 | 1,40 | **2,80** |
| Balas por ráfaga | 1,8 | 1,9 | **4,2** |
| Entre bala y bala | 0,32 s | 0,38 s | **0,25 s** |
| Entre ráfagas | 2,02 s | 1,07 s | **0,73 s** |

**LOS NÚMEROS FINALES SON LA SEGUNDA VUELTA.** Con el arreglo puesto y los
valores originales (3 balas, 0,45 s) daba 2,3 balas/s; Santi eligió sobre
una tabla de tres la opción de **ráfagas más largas: 4 balas y 0,40 s de
espera**, que da 2,8 balas/s en tandas largas — que es lo que se lee como
"dos revólveres" y no como "un guardia apurado".

**EL ARREGLO ES UN NO-OP PARA TODOS LOS DEMÁS, verificado:** `e.ai` es por
defecto una copia llana de `CONFIG.enemy`, así que 350 guardias de trenes
normales y de trenes con redada tienen exactamente los cuatro campos
(`fireCooldown`, `burstSize`, `burstDelay`, `panicoBurstSize`) iguales a la
constante global; los únicos con cadencia propia son los pistoleros.

### Lo segundo que dijo Santi ("acercarse le interrumpe la ráfaga") era el mismo bug

Medido DESPUÉS del arreglo, con el jugador retrocediendo a 40px/s durante
30 segundos: el pistolero sostiene 2,3 balas/s, camina apenas el 12% de los
cuadros, no te pierde de vista ni un cuadro y **no se le canceló ni un solo
apuntado**. Entrando desde 220px, el primer tiro sale a 102px caminando y
todos los demás ya plantado a 92px: la ráfaga no se corta.

Lo que se veía era el bug: con `burstSize` 2 y `burstDelay` 0,28, la
"ráfaga" eran dos tiros separados 0,37 s con el tipo caminando en el medio
— exactamente la forma que tiene una ráfaga interrumpida. Se le ofreció a
Santi una regla nueva ("que no camine mientras tenga una ráfaga en curso") y
la descartó con el dato delante: arreglaría algo que ya no pasa.

**VERIFICADO:** 3 corridas de 30 s dieron 2,80 / 2,77 / 2,77 balas por
segundo, ráfagas de 4,2 balas y 5-11 impactos al jugador (contra 4 del
guardia común). Corrida completa de 60 s con todo encendido (puerta
bloqueada + alerta + pistoleros + dinamiteros forzados + encubiertos): sin
un solo error.

**NO JUGADO POR SANTI TODAVÍA.**

---

## 🐛 ARREGLADA · El Pistolero "se frenaba" en el medio del pasillo (su propia virtud lo dejaba clavado)

*(Santi, jugándolo: "hay veces que se para en medio del pasillo y empieza a
dispararme. Pero luego se frena, no sé qué será eso. Si es un bug
soluciónalo, sino lo es: que se meta detrás de una cobertura")*

**ERA UN BUG, Y NACÍA DE LO QUE LO HACE INTERESANTE.** Plantarse en el medio
del pasillo lo pone justo donde caminan sus compañeros para llegar hasta el
jugador, así que cada dos por tres tiene a uno metido en la línea de tiro.
Con un compañero adelante, `tryFire` no dispara (`allyInLine`, que existe
para que nadie le vacíe el cargador a un aliado) — y como este guardia nunca
busca cobertura ni se reubica, **no tenía absolutamente nada previsto para
salir de ahí**: se quedaba parado, sin disparar, hasta que el otro se
corriera solo. Un guardia normal sale de eso por su cuenta, porque
`holdCoverAndFire` ante un compañero en la línea se manda a buscar otro
ángulo; el que no usa cobertura no pasa nunca por ese código.

**MEDIDO, con un compañero metido en el medio: de 2,6 balas por segundo a
0,2, y 100% del tiempo quieto.** Exactamente "se frena".

### Dos problemas distintos, dos respuestas distintas

Al medirlo aparecieron dos formas de quedarse sin poder disparar, y meterlas
en la misma bolsa daba una conducta mala en los dos casos:

- **No te ve** (te cubriste, cruzaste una puerta, se cortó la línea): ahí no
  hay nada que hacer parado en medio del pasillo. A los
  `CONFIG.enemy.descubiertoBloqueoMax` (0,6 s) **se cubre como cualquiera** —
  que es lo que pidió Santi — y apenas te vuelve a ver **suelta la cobertura
  y vuelve al pasillo**. No pierde su identidad: la recupera enseguida.
- **Te ve, pero un compañero le tapa el tiro**: ahí esconderse no resuelve
  nada. **Se corre al costado** para recuperar el ángulo, y si el pasillo es
  angosto y choca contra un asiento, **se adelanta** — la única salida que
  siempre existe, porque el camino hacia el jugador está abierto por
  definición (es por donde vino el compañero).

**LA PRIMERA VERSIÓN DEL ARREGLO ERA "QUE SE CUBRA" A SECAS, Y NO ALCANZABA.**
Medido: el reloj de bloqueo llegaba a 9 segundos y el guardia seguía sin
moverse, porque `findCoverPoint` devolvía null — en el medio del pasillo
muchas veces no hay ninguna cobertura libre. Decidía bien y no pasaba nada.
Y la segunda versión (sólo el paso al costado) fallaba en los pasillos
angostos: chocaba contra el asiento, cambiaba de lado, chocaba contra el
otro y oscilaba en el lugar el 93% del tiempo. Recién las dos juntas —
costado, y si no hay costado, adelante— lo resolvieron.

### Verificado

| | Antes | Ahora |
|---|---|---|
| Con la línea libre | 2,6 balas/s, plantado | 2,6 balas/s, plantado |
| Con un compañero tapándolo | **0,2 balas/s, 100% quieto** | **2,6 balas/s** (recupera el tiro en **1,1 s**) |
| Cuando te pierde de vista | se quedaba al descubierto sin hacer nada | se cubre a los **0,6 s**, y al verte suelta la cobertura |

Tres corridas de cada caso, todas consistentes. **Guardia normal de
control, sin tocar:** 0,87 balas/s y 100% del tiempo con cobertura, igual
que siempre — el paso al costado sólo existe para el que lleva
`evitaCobertura`, y al normal nunca se le asigna. Corrida completa de 60 s
con todo encendido: sin errores.

### Una nota sobre el arnés de prueba

La primera medición del bloqueo daba resultados contradictorios (a veces se
movía, a veces no) hasta que se vio el motivo: el arnés recolocaba al
compañero **en el punto medio entre el guardia y el jugador en cada cuadro**,
o sea que lo seguía. Era un bloqueo imposible de resolver por diseño del
arnés, no del juego. Con el compañero plantado en un punto FIJO —que es lo
que pasa jugando— las tres corridas dieron lo mismo.

**NO JUGADO POR SANTI TODAVÍA.**

---

## ✅ HECHA · Los tres tipos de guardia nuevos quedan EN RESERVA

*(Santi: "dejemos de lado a los personajes por ahora. Quiero que conserves
los datos del pistolero actual pero dejalo como en reserva como hiciste con
el dinamitero y pasemos a lo siguiente. Haz lo mismo con el civil
encubierto")*

`VARIANTES_GUARDIA.pistolero.chance` 0,20 → **0** y
`CHANCE_CIVIL_ENCUBIERTO` 0,10 → **0** (el dinamitero ya estaba así). Los
tres tipos siguen enteros en `data/guards.js` con todo lo que se midió, y
también sigue escrito el gate de recompensa+honor del pistolero. **Lo único
apagado es que salgan sorteados.**

Es la misma llave-no-amputación de "Alta vigilancia" (`peso: 0`),
`frenosDañados` y `listaAbierta`, y ya van cuatro veces que el patrón paga:
construir algo entero, medirlo, y dejarlo esperando su momento sin que
estorbe ni haya que volver a escribirlo.

**LOS VALORES CON LOS QUE SE PROBÓ QUEDAN ESCRITOS AL LADO DEL CERO**, en el
comentario de cada uno: 0,20 por guardia común para el pistolero y 0,10 por
pasajero para el encubierto. Sin eso, "prenderlo" un día sería volver a
inventar el número desde cero — que es exactamente lo que este archivo
existe para evitar.

**VERIFICADO:** con el gate del pistolero abierto de par en par (recompensa
5000, honor −200), 30 trenes sorteados por el camino real dieron **0
pistoleros, 0 dinamiteros y 0 encubiertos** sobre 270 guardias comunes, y
`variantesPermitidas` devuelve lista vacía. Prendiéndolas a mano en la
consola vuelven de una (23% de pistoleros sobre 135 guardias), así que la
llave prende sin tocar código. Corrida completa de 60 s del juego normal:
sin errores.

`sortearCivilEncubierto` además corta antes de tirar el dado cuando la
chance es 0 — así prender o apagar esta llave no corre la secuencia del
`rng` de todos los sorteos que vienen después.

---

## ✅ HECHA · "Variedad de trenes" — Fase 5, primera mitad: el pasajero rico y la caja fuerte oculta

Los **paquetes**: un objetivo valioso con su custodia, metido en un vagón
cualquiera. En las palabras de Santi cuando dejó el plan ordenado:
*"paquetes que atan un objetivo a guardias extra, en CUALQUIER vagón (ahí
está la sorpresa)"*.

**QUÉ PROBLEMA RESUELVE, Y ES EL MÁS VIEJO DE ESTE JUEGO:** el valor de un
vagón estaba escrito en su tipo. El correo tenía la caja, el comedor la
gente, el blindado el premio gordo — así que mirar la formación desde el
caballo te decía exactamente qué te esperaba adentro. Un paquete rompe eso
sin tocar un solo vagón: el de pasajeros de siempre puede ser, esta vez, el
que más plata lleva arriba.

**CUARTO EJE DE SORTEO** (`data/paquetes.js`, nuevo), y tiene forma propia
por un motivo: es por vagón como los comportamientos, pero **con chance** —
la mayoría de los vagones no lleva ninguno. Un comportamiento siempre sale
(aunque sea "normal") porque es un estado; un paquete es un HALLAZGO, y si
apareciera en todos dejaría de serlo. 20% por vagón con pasajeros, repartido
50/50 entre los dos: **0,59 paquetes por tren, y uno de cada dos asaltos
trae alguno** (medido: 49% calculado, 55% sobre 20 trenes del camino real).

De los cuatro que tenía la fase, Santi eligió arrancar por dos — *"los dos
más definidos y los que más reusan lo que ya existe"*. Los otros dos
quedaron decididos pero sin construir: el **objeto especial** va a ser un
objeto que se lleva y se vende después en el pueblo (necesita un INVENTARIO,
que hoy no existe: sesión aparte), y el **comerciante** espera a que haya
algún sistema de gente con la que se habla.

### El pasajero rico

Uno de los pasajeros lleva **$150-250** contra los $25-70 de cualquiera, y
tarda **2,2 s** en soltarlo todo contra 1,4 (verificado: 2,22 y 1,40, cinco
corridas de cada uno, y el rango de plata sale del catálogo correcto —
comprobado interceptando el propio `rng.int`). Los dos números tiran para el
mismo lado: mucho más plata, mucho más tiempo quieto, y con alguien al lado
mirando.

### La caja fuerte oculta, y lo que le hace a "amenazar"

*(Santi, eligiendo entre tres formas de encontrarla: "te la delata un
pasajero al amenazarlo")*

La caja viaja escondida (`oculto` en el botín, una marca nueva en
entities/lootable.js): no se dibuja, no aparece en el buscador de lo que
tenés al alcance, no se puede abrir ni de casualidad. **No existe hasta que
alguien te dice dónde está.** Y ese alguien es un pasajero del mismo vagón:
le ponés el revólver encima, te da la plata que tenía Y te suelta el dato.

**ESTO ES LO MEJOR QUE PODÍA PASARLE A AMENAZAR.** Hasta hoy robar a un
pasajero era siempre la misma cuenta —unos pesos ahora, un grito dentro de
cuatro segundos— y por eso, pasado el primer asalto, saltearlos era casi
siempre lo correcto. Ahora cualquiera puede ser el que abre la mejor caja
del tren y no hay forma de saber cuál: la misma acción de siempre, con una
razón nueva. Es el mismo tipo de arreglo que la caja fuerte oculta le hace
al vagón — no agrega una mecánica, le devuelve sentido a una que ya estaba.

La caja vale **$400-900** (contra $150-600) y tarda **8 s** (contra 6,5), y
las dos cosas por el mismo motivo: estaba escondida porque adentro había
algo que no querían que viajara a la vista. **No tiene jackpot** a
propósito: el golpe de suerte ya vive en la caja normal, donde funciona
porque todas se ven iguales; ésta ya ES el hallazgo, y meterle otra lotería
encima sería premiar dos veces la misma jugada.

Se esconde LEJOS del pasajero que la delata (el punto del barrido del vagón
más alejado de él, ~512px en un vagón de 640): si apareciera a sus pies, el
dato no valdría nada. La gracia es que después de que te lo diga, todavía
tengas que ir hasta ahí.

**LIMITACIÓN CONOCIDA, avisada antes de construir:** la caja está en el
MISMO vagón que quien la delata, así que este paquete sólo cae donde viaja
gente. Que te delaten una caja de OTRO vagón es más interesante y estaba en
la idea original ("en cualquier vagón"), pero necesita marcar algo fuera de
la pantalla: queda para una segunda vuelta.

### 🐛 El guardaespaldas: dos intentos fallidos antes de acertar

Es la única pista de que un vagón lleva un paquete, así que dónde se para
importa tanto como que exista.

1. **A 16px al costado de lo que cuida** — pero los pasajeros viajan
   SENTADOS, así que ese costado es la butaca de al lado: **25 avisos de
   "colocado sobre un tile sólido" en 50 trenes**. Es exactamente el mismo
   error que ya se había cometido con el civil encubierto al revelarse, dos
   sesiones antes. Anotado: *cada vez que se ponga a alguien "al lado de un
   pasajero", acordarse de que el pasajero está sentado.*
2. **En el punto del barrido (`sweep`) más cercano** — nunca más sólido,
   pero el barrido tiene pocos puntos y muy separados: el guardaespaldas
   terminaba **hasta a 256px** de lo que cuidaba (62 de promedio). A esa
   distancia no custodia nada y, sobre todo, deja de ser una pista.
3. **Lo que quedó:** a la altura del objetivo, en las dos filas del pasillo,
   corriéndose de a poco hasta encontrar lugar. Medido sobre 60 trenes: **0
   avisos, 0 guardias en sólido, 12-49px del pasajero (32 de promedio) y 12px
   de la caja**.

### Y la pista tampoco se leía, hasta que se la miró

Con el guardaespaldas ya bien puesto, una captura del vagón EN FRÍO (el
jugador entrando, nadie alertado todavía) mostró que no servía de nada: un
guardia quieto en el pasillo se ve igual que cualquier otro guardia del
pasillo — la diferencia (que no patrulla) sólo se nota mirándolo un rato
largo, que es justo lo que no vas a hacer entrando a un vagón.

**La solución ya estaba escrita en el juego:** el cartel **"VIGILANDO"** que
la Fase 3 le puso a los que cuidan una puerta o una caja fuerte. Es
literalmente la misma situación, así que el guardaespaldas lo lleva también.
Ahora el vagón te dice "acá hay algo que cuidar" de un vistazo — y sigue sin
decirte qué.

### Verificado

- Sorteo, 100.000 tiradas: 79,9% sin paquete / 10,1% pasajero rico / 10,1%
  caja oculta, y **cero** en vagones sin pasajeros.
- Jugado por consola: con la caja oculta, **10 segundos apretando [E] encima
  no hacen nada** (progreso 0, sigue invisible); al robar al pasajero que
  sabe, se revela; recién ahí se abre, y tarda 8,02 s.
- Camino real desde el mapa: 55% de los trenes estándar traen paquete y
  **0 fugas** a los tipos veloz y de carga.
- Corrida completa de 60 s con todo encendido: sin errores ni avisos.

**NO JUGADO POR SANTI TODAVÍA.**

---

## ✅ HECHA · Cuatro ajustes de Santi jugando (recarga, charla, vecinos y "sobre aviso")

Primera tanda de ajustes hechos MIENTRAS lo juega, que es como debería haber
sido siempre.

### 1. Recargar te frena

*("recargar debería penalizar el movimiento, debería quedar como si caminara
de costado, con esa velocidad")*

Mientras `reloadTimer > 0`, la velocidad base se multiplica por
`CONFIG.player.direccionCostado` (0,70). **Medido: 78 → 55 px/s**, que es
exactamente la velocidad de caminar de costado.

Reusa un precio que ya existía en vez de inventar uno: es el número que el
juego ya tiene escrito para "estás haciendo otra cosa con el cuerpo mientras
caminás". Y se MULTIPLICA en vez de pisar, como todos los precios de este
juego: recargar agachado y de espaldas es lo más lento que podés ir, y tiene
que serlo. Sigue cobrando en tiempo y exposición, nunca en vida.

### 2. El que corta la charla arrastra al otro

*("cuando los guardias están hablando y uno se pone en amarillo, después de
un segundo, el otro también se tiene que poner en amarillo")*

Hasta ahora `conversando` era una marca suelta en cada guardia: los dos
estaban distraídos, pero **ninguno sabía con quién hablaba**, así que podía
pasar que uno te cazara mientras el otro seguía contando su historia — que es
justo lo que los hace ver como muñecos y no como dos tipos charlando. Ahora
se guardan la referencia mutua (`companeroCharla`, en world/train.js) y
`contagiarCharla` (systems/ai.js) le pasa el aviso al otro un segundo
después.

**El segundo de demora es la mitad de la idea**: sin él la pareja se alerta
junta y en el mismo cuadro, que se lee como un interruptor; con él se ve la
CADENA, y ese segundo es la ventana para resolver al primero antes de que
sean dos. Reusa `alertTo`, el mismo aviso que ya se pasan los guardias por un
ruido. **Medido: el compañero pasa a amarillo a 1,00 s exacto**, y después su
sospecha decae sola como la de cualquiera — no hay que "desavisar" nada.

### 3. 🐛 Los vecinos se enteran, pero no cruzan

*("cuando disparo en un vagón, de repente hay muchísimos guardias de otros
vagones, eso no debería pasar")*

El bloque de `bus.on('noise')` les daba `alertTo`, que además de ponerlos
amarillos **les pone como destino el lugar del ruido** — o sea que
abandonaban su vagón y se venían. Medido antes del cambio, con un tiroteo de
45 s: cruzaban 2-3 y el pico llegaba a 6 tipos encima, todos por el mismo
pasillo.

Ahora reciben `alertaEnGuardia`, que ya existía y hace exactamente lo que
hacía falta (es lo que hacen los de ADELANTE cuando suena la alarma):
amarillo, `spooked` y `target` en su propio puesto. Se enteran sin que el
tren entero se te venga encima por un tiro.

**🐛 Y EL `alarm.active` NO ES UN DETALLE — sin él este arreglo se comía la
retirada.** Primera versión medida: con la alarma YA sonando, cada disparo
tuyo volvía a clavar a los vecinos en su vagón y dejaban de perseguirte, o
sea que **disparar te sacaba perseguidores de encima**, justo al revés de lo
que tiene que pasar. Con la alarma activa siguen recibiendo `alertTo` de
siempre.

| | Antes | Ahora |
|---|---|---|
| Un tiro, sin alarma | vecinos en amarillo y **cruzan 2-3** | vecinos en amarillo, **cruzan 0** |
| Pico de guardias encima, sin alarma | hasta 6 | 2-3 (sólo los de tu vagón) |
| Con la alarma sonando | cruzan y te buscan | **igual: cruzan 2, pico 4-5** |

La regla que queda es clara y se puede jugar en contra: *hasta que te
descubran de verdad, lo que pasa en un vagón se queda en ese vagón.*

### 4. Menos trenes "ya sobre aviso"

*("solo quiero que bajes la probabilidad del 'ya estaban sobre aviso'")*

`ESTADO_TREN.alertaActivada` de 20% a **10%** (verificado sobre 200.000
tiradas: 10,1%). Es el modificador que más caro se paga —te saca de entrada
el trabajo limpio, la racha y todo el sigilo, antes de que puedas hacer
nada—, así que uno de cada diez lo deja como la mala suerte del día en vez de
una rutina. Había subido de 8% a 20% dos sesiones atrás a pedido de Santi;
jugarlo mostró que era demasiado.

### Lo que se descartó

Santi propuso además que los enganches se vieran desde el caballo (y poder
dispararse con los guardias durante el galope), porque a veces se encontraba
uno al subir. **Medido: en 30 asaltos, ningún guardia nace ni patrulla hasta
un enganche** — el que se encontró llegó ahí alertado, buscándolo. Con ese
dato, Santi lo descartó ("olvida esta última") y pidió sólo el punto 4.
Queda anotado que el combate durante el galope sería un sistema nuevo, no un
ajuste.

**Corrida completa de 60 s con todo encendido** (puerta bloqueada + alerta +
conversando en los seis vagones + cajas ocultas, disparando y recargando):
sin errores ni avisos.

---

## ✅ HECHA · La caja fuerte oculta, segunda vuelta: la pista dejó de ser una marca y pasó a ser información

*(Santi, después de jugar la primera versión: "La caja fuerte oculta puede
estar en cualquier vagón. Hay tres civiles por tren que pueden revelarte la
información de dónde está la caja (si es que hay). Esos tres civiles no sí o
sí tienen que estar en el mismo vagón que la caja fuerte [...] dentro de un
mismo vagón puede estar 'debajo de una ventana' o 'debajo de un asiento' si
es de pasajeros, o 'debajo de una mesa' si es el comedor o el vagón de
correos. En el de ganado sólo dice 'está junto al corral'")*

**LO QUE ESTABA MAL EN LA PRIMERA VERSIÓN, Y NO SE VE HASTA JUGARLO:** la
pista no se usaba, se miraba. Te delataban la caja y aparecía dibujada, así
que el dato no era información — era un botón que revelaba un objeto. Y como
el que la delataba tenía que estar en el mismo vagón, la caja no podía
esconderse en el correo ni en el ganado, justo donde uno esconde una caja.

Ahora son tres cosas separadas:

1. **La caja es DEL TREN** (`CHANCE_CAJA_OCULTA`, 25% por tren) y cae en
   cualquier vagón menos el blindado — que ya tiene las suyas. Verificado:
   **0 de 200 en el blindado**, y repartida entre pasajeros (78), ganado
   (43), correo (42) y comedor (37).
2. **Tres pasajeros cualesquiera del tren saben dónde está**
   (`CIVILES_QUE_SABEN`), elegidos entre TODOS sin mirar el vagón. Tres y no
   uno porque con uno solo, entre trece pasajeros, sería inencontrable; tres
   y no cinco porque si la mitad del tren sabe, amenazar deja de ser una
   apuesta.
3. **La pista es texto y nada más**: `VAGÓN 3: DEBAJO DE UNA MESA`. La caja
   sigue invisible y aparece recién cuando la tenés al lado, en el mismo
   radio en el que ya podrías agarrarla. Tenés que ir hasta ahí y buscarla.

### Los escondites salen del layout, no de una lista escrita a mano

Cada escondite (`ESCONDITES` en data/paquetes.js) apunta a un carácter del
mapa del vagón: `W` ventanilla, `S` asiento, `C` mesa/carga/corral. Al armar
el tren se buscan todos los tiles PISABLES que tengan ese mueble pegado
arriba o abajo, y se elige uno. Por eso lo que dice el pasajero y lo que ves
al llegar son siempre la misma cosa, sin mantener ninguna tabla de
coordenadas — y un vagón nuevo hereda el sistema con sólo entrar en
`ESCONDITES`.

Va PEGADA al mueble y no adentro por un motivo práctico: adentro no habría
forma de alcanzarla. Verificado sobre 20 trenes: el tile de la caja siempre
es `.` y siempre tiene el mueble correcto arriba o abajo.

### Es la única vez que el juego te escribe una instrucción

Y se lo permite porque es una PERSONA hablándote, no la interfaz
explicándote. La regla de siempre (*lo que se puede mostrar no se escribe*)
sigue en pie donde importa: **la caja no se dibuja hasta que la encontrás**.
El número de vagón es el mismo que el HUD ya muestra arriba, así que la pista
se lee contra algo que el jugador ya sabe leer.

Encontrarla de pura casualidad, sin haber amenazado a nadie, también se
puede — pero hay que pasar justo por encima, y el tren es largo.

### El pasajero rico ahora se ve

*(Santi: "¿cómo luce el pasajero rico?" — y la respuesta honesta era: igual
que todos. Mismo cuerpo, mismo color, mismo sombrerito que los otros doce. Lo
único que lo delataba era el guardaespaldas, así que si lo matabas antes de
entrar, ya no había forma de saber a quién robarle. Eligió que "se note de
lejos")*

**Sombrero de copa**: una copa alta y oscura sobre un ala más ancha. La seña
es la SILUETA y no el color, como manda la regla del proyecto — el color del
cuerpo sigue diciendo el estado (tranquilo / asustado / corriendo). Y es la
silueta más alta del tren a propósito: asoma por encima de los respaldos, así
que se lo pesca desde el pasillo sin meterse en cada hueco a mirar quién
viaja ahí. Mirado con `foto.ps1` al lado de pasajeros comunes: se distingue
de una.

### Verificado

- Chance por tren: **25,0%** sobre 100.000 tiradas. Camino real desde el mapa
  (15 minutos de simulación, 70 trenes estándar sorteados de verdad): **29%**
  con caja, y **0 fugas** al veloz y al de carga.
- Jugado por consola de punta a punta: amenazás al que sabe → sale la pista y
  **la caja sigue oculta** → vas al lugar → aparece → se abre en 8,02 s.
- Corrida completa de 60 s con todo encendido: sin errores ni avisos.

**NO JUGADO POR SANTI TODAVÍA.**

---

## 🐛 ARREGLADA · Los guardias plantados se empujaban y se iban a la deriva

*(Santi, jugándolo: "hay veces que dos guardias parecen que están hablando
entre ellos, pero en realidad uno de esos guardias empuja al otro o no sé qué
pasa, pero es un bug")*

Tenía razón, y eran **dos problemas encadenados**.

### 1. Nacían pisándose

Los dos que conversan se colocaban a **9px** uno del otro, y el mínimo que el
juego permite entre dos guardias (`CONFIG.enemy.separation`) es **13**.
Arrancaban adentro del radio de empuje y quedaban clavados justo en el
límite, donde `separateEnemies` se enciende y se apaga: medido en calma, cada
uno recorría **94px en 10 segundos** sin ir a ningún lado. Vibraban en el
lugar.

Ahora nacen a `separation + 5`, y el número sale de CONFIG en vez de estar
escrito a mano — si algún día se toca `separation`, esto se acomoda solo en
vez de volver a desincronizarse en silencio.

### 2. Y no tenían a dónde volver

Éste era el grande. Un guardia plantado por un comportamiento (los dos que
conversan, el que vigila una puerta o una caja, un guardaespaldas) **no tiene
ronda**, así que nada lo devolvía a ningún lado. Y el compañero que sí
patrulla les pasa por encima: `separateEnemies` los corre, y ahí se quedan.

Medido en el vagón de correo (dos charlando y un tercero patrullando), 30
segundos: los que charlaban recorrían hasta **326px** y terminaban a **260px
uno del otro**, mirando para cualquier lado. Desde afuera se ve exactamente
como lo describió Santi.

**Ahora tienen `puesto`** (y `facingPuesto`): se los puede empujar como a
cualquiera, pero después vuelven caminando a donde tienen que estar y
recuperan hacia dónde miraban. Un tipo al que le pasan por delante se corre y
vuelve a su lugar — que es lo que hace una persona.

### 🐛 El primer arreglo fue peor que el bug

Antes de esto probé hacer **inamovible** al plantado (que el empujón se lo
llevara entero el que camina). Se ve razonable y está mal: dos que conversan
dejan 18px entre sí, y un tercero que se meta ahí necesita 13 de cada lado —
o sea 26. Medido: el guardia quedaba **prensado entre los dos, sin moverse un
solo píxel**, para siempre.

Por eso `separateEnemies` volvió a repartir mitad y mitad como siempre, y lo
que se arregla es la VUELTA, no el empujón. Queda anotado: en un pasillo
angosto, cualquier regla que haga inamovible a alguien crea una trampa para
el que pase.

### Verificado

| | Antes | Ahora |
|---|---|---|
| Dos charlando, en calma | 94px de vibración cada 10 s | **0** |
| Con un tercero patrullando (30 s) | recorrían 326px, terminaban a 260px | **0px, y siguen a 18px, enfrentados** |
| Empujados a mano cada 5 s | quedaban donde los dejaran | se alejan **6px** y vuelven a **2px** |
| El que vigila puerta / caja | igual, a la deriva | vuelve a **1,7px** y recupera la mirada |

Las patrullas normales no se tocaron (`volverAlPuesto` sólo corre para quien
no tiene ronda). Corrida completa de 60 s con todo encendido: sin errores.

### De paso: los cinco guardias del correo

Santi preguntó por qué en el correo se enfrentó a CINCO. Medido: el correo
trae **3** de fábrica (y **6** con redada — duplica cada patrulla). Los cinco
salen de sumar los de al lado con la alarma ya sonando:

| Situación | Pico de guardias cerca tuyo en el correo |
|---|---|
| Sin alarma | **3** (sólo los del vagón) |
| Con la alarma sonando | **5** |
| Redada + alarma | **8** |

O sea: 3 del correo + 2 que llegaron. No es un bug — es la retirada
funcionando, que es justamente lo que se decidió NO tocar cuando se arregló
lo de "los vecinos no cruzan por un tiro". Sin alarma, en el correo nunca hay
más de tres.

**NO JUGADO POR SANTI TODAVÍA.**

---

## ✅ HECHA · Las cajas fuertes: dinamita, interrupción y progreso que no se pierde

Cuatro cambios pedidos por Santi jugando, y los cuatro empujan en la misma
dirección: **la caja fuerte deja de ser un temporizador y pasa a ser una
decisión**.

### 1. Ocho segundos, no seis y medio

*("creo que hay una caja que se abre en 6 segundos, quiero que se cambie a 8
segundos")* — `CONFIG.loot.strongboxTime` de 6,5 a **8**. Ahora las dos cajas
del juego tardan lo mismo: la oculta ya estaba en 8. El blindado, con sus
dos, son dieciséis segundos de un asalto de 145.

### 2. Con el arma en la mano no se abre

*("el jugador no podrá recargar ni disparar mientras abre una. Si lo hace, la
apertura de la caja fuerte se verá interrumpida")*

Forzar una caja es un trabajo de dos manos. El juego ya lo decía con el
cuerpo —quieto, de espaldas, sin poder cubrirte— y le faltaba decirlo con el
arma. **Lo que cambia de verdad**: ya no se puede abrir una caja "mientras
tanto", contestando tiros de a ratos. Hay que resolver el vagón primero y
después robar, que es el orden que el juego premia en todo lo demás.

Se corta con el INPUT, no con el disparo efectivo: apretar el gatillo sin
balas también interrumpe. Quisiste disparar, soltaste la caja.

### 3. Y el progreso ya no se pierde

*("si se interrumpe la abertura de la caja, cuando el jugador quiera volver a
abrirla, se reanudará desde dónde la dejó")*

Éste es el que hace que el 2 sea justo. Antes, soltar la [E] un instante
volvía el contador a cero — y con ocho segundos eso significaba que en
cualquier vagón despierto la caja era directamente inabrible: cada intento
empezaba de nuevo. El precio dejaba de ser "ocho segundos" y pasaba a ser
"ocho segundos SEGUIDOS", que es otra cosa mucho más cara y que no se
anuncia por ningún lado.

Ahora se paga en cuotas: forcejeás tres segundos, te sacan de ahí, resolvés,
volvés y seguís. **Verificado: 3 s + 5,02 s = 8,02 s exactos.**

**Sólo las cajas fuertes.** Las bolsas y las tranqueras se siguen
reiniciando: 0,6 y 0,9 segundos son gestos, no trabajos, y guardarles el
progreso sólo traería el efecto raro de ir acumulando medio segundo en cada
bolsa que rozás al pasar. (Primera versión: le había sacado el reinicio a
TODO el botín y encima documenté lo contrario. Se corrigió al medirlo.)

### 4. La dinamita también es una llave para ellas

*("si no querés intentar abrirlas, podés explotarla con dinamita")*

Es la segunda cerradura que la dinamita rompe, y por el mismo motivo que la
primera (la puerta del blindado): hay cosas que no se abren con paciencia. El
código va literalmente al lado del que vuela la puerta, en `systems/
explosives.js`.

**NO TE REGALA LA PLATA, TE AHORRA EL FORCEJEO** (elegido por Santi sobre
tres opciones). La caja queda REVENTADA, con el botín a la vista, y
levantarlo cuesta lo mismo que una bolsa (0,6 s). En Forajido la plata
siempre se junta yendo hasta ella; volarla es un atajo, no una excepción.

El precio ya estaba puesto y es enorme: uno de tus dos cartuchos, y la alarma
sonando sí o sí. Y si la caja estaba escondida, el estruendo la descubre — no
se puede reventar algo y que siga siendo un secreto.

**Se ve distinta**, y hace falta: en un vagón donde ya volaste algo tenés que
saber de un vistazo cuál caja te va a costar ocho segundos y cuál es levantar
y seguir. La cerrada tiene su cerradura oscura al centro; la reventada
muestra la tapa arrancada y el oro adentro. Mirado con `foto.ps1`, una al
lado de la otra: se distinguen de una.

### Verificado

- Abrir a mano: **8,02 s**. Progreso guardado: 3 + 5,02 = 8,02.
- Interrupción: **5 segundos disparando = 0 de avance**; 1 segundo recargando
  = 0; al soltar el gatillo vuelve a avanzar (0,98 en 1 s).
- Dinamita, en las dos cajas: quedan reventadas, la duración pasa de 8 a 0,6,
  se levantan en 0,6 s, y la oculta deja de estar oculta.
- La bolsa sigue reiniciándose al alejarte; la caja no.
- Corrida completa de 60 s con todo encendido: sin errores.

**NO JUGADO POR SANTI TODAVÍA.**

---

## 🐛 ARREGLADA · La caja oculta podía quedar ENCERRADA adentro de un corral

*(Santi, jugándolo: "un civil me dijo que la caja oculta estaba junto al
corral del vagón 2. Fui al vagón de ganado y lo revisé y no encontré ninguna
caja")*

La caja estaba ahí. **Encerrada.**

Los corrales del vagón de ganado son bloques HUECOS:

```
#..CCCCC..CCCCC..CCCCC.#
#..C...C..C...C..C...C.#     ← suelo libre, rodeado de corral
#..CCCCC..CCCCC..CCCCC.#
```

El interior —donde viajan las reses— es suelo pisable con 'C' arriba y
abajo, así que pasaba el filtro de "un tile libre pegado al mueble" con
honores. La caja caía adentro del corral, sin ninguna forma de llegar; y como
además está oculta hasta que la tenés al lado, desde afuera no había nada:
ni caja, ni pista de que hubiera una.

**MEDIDO: 22 de 48 cajas que caían en el ganado quedaban inalcanzables** —
casi la mitad. En los otros tres vagones, cero: por eso el problema sólo
aparecía ahí, y por eso hacía falta que Santi lo jugara para que saliera.

### El arreglo: que se pueda llegar caminando

Un relleno por inundación que arranca en el PASILLO (las filas 4 y 5, por
donde se camina) y se expande por todo lo que sea suelo. Un escondite sólo
vale si el relleno llegó hasta él.

Es genérico a propósito: no chequea "estoy en el ganado" ni conoce los
corrales. Cualquier vagón futuro con un rincón cerrado queda cubierto sin que
haya que acordarse de este caso — que es exactamente el tipo de regla que
este proyecto prefiere sobre una lista de excepciones.

### Verificado

- 300 cajas sorteadas: **0 inalcanzables** en los cuatro vagones (56 de ellas
  cayeron en el ganado), y ningún tren se quedó sin lugar donde esconderla.
- El caso exacto de Santi, jugado de punta a punta: pista *"vagón 2, junto al
  corral"* → caminar el pasillo del ganado → **la caja aparece** → se abre
  ($639).
- De paso se verificó lo otro que podía estar mal: el número de vagón que
  dice la pista coincide siempre con el que el juego reporta en esa posición
  (12 de 12).
- Corrida completa de 60 s con todo encendido: sin errores ni avisos.

---

## ✅ HECHA · "Variedad de lo que pasa en los trenes" — Fase 6a: el vagón de armas

El vagón que el Dinamitero venía esperando desde la Fase 4. Santi lo eligió
como próximo paso por tres motivos: no arrastra ningún sistema nuevo (reusa
los explosivos que ya existen), es contenido como cualquier otro vagón, y es
lo que enciende a un tipo de guardia que ya estaba construido y medido.

**Estaba nombrado y no diseñado**, así que la sesión empezó cerrando seis
decisiones sobre tablas, como siempre.

### El dato que cambió media pregunta antes de empezar

Santi preguntó, entre otras cosas, si el vagón debía reponer munición. **Las
balas del revólver son infinitas**: recargar llena el tambor siempre
(`entities/player.js`), no hay reserva por asalto. O sea que "cajas de munición
para reponer balas" no habría significado nada.

**El único recurso limitado que llevás encima es la dinamita** (2 cartuchos,
`CONFIG.player.dynamite`). Eso convirtió la pregunta secundaria en la
principal: si el vagón da algo, sólo puede dar eso.

### Lo que se decidió

| | Qué quedó |
|---|---|
| **Qué tiene adentro** | Un solo objeto con dos verbos opuestos: `[E]` te llevás un cartucho, un tiro y vuela |
| **Cuánta dinamita** | Tope 3 (`CONFIG.player.dynamiteMax`), +1 por cajón, 3 cajones |
| **Al dispararle** | Lo prende **cualquier** bala, aguanta 3 tiros, mecha de 1,2 s |
| **Tamaño y guardia** | 30 columnas, 3 guardias, **todos comunes**, 4 pares de ventanillas |
| **Dónde entra** | Reemplaza al ganado en el **50%** de los trenes estándar, nunca en el vagón 1 |
| **Botín** | 5 bolsas (~$237), **sin caja fuerte** |

**EL VAGÓN ES UN SOLO OBJETO CON DOS VERBOS OPUESTOS.** Lo que te sirve es lo
que te puede matar — la misma forma que ya tiene la cobertura (te salva de los
de adentro y te entrega a los de afuera). Y resuelve solo el problema de que
fuera únicamente una despensa: si entrás con la dinamita llena, el cajón que
te sobra sigue siendo una bomba puesta en el mapa.

**EL TOPE 3 SE ELIGIÓ CONTRA EL VAGÓN BLINDADO**, que es donde la dinamita de
verdad se gasta: alcanza para la puerta más dos cajas reventadas (~16 s de un
asalto de 145, el 11%), así que hay que elegir cuál caja volás y cuál abrís a
mano. Con 4, el blindado —"el premio y la trampa"— se resolvía entero con
explosivos sin forcejear nada.

**Y ENTRA POR SORTEO, NO FIJO.** Es lo primero de todo el plan que cambia DE
QUÉ está hecho el tren y no sólo quién viaja adentro (`sustituciones`, un campo
nuevo de `TRAIN_TYPES`), y lo único de la familia que **se ve desde el galope**,
antes de subir. Reemplaza y no se suma como séptimo porque sumarlo alargaba el
tren 33 columnas — unos 18 s de ida y vuelta de un reloj de 145 (12%), y ese
número está afinado desde que se cerró la fase 2.

### La cadena, y el problema que Santi vio antes de que existiera

Sobre las recomendaciones, Santi agregó tres cosas: que las dinamitas lanzadas
también prendan los cajones, que **un cajón encendido prenda todo el vagón en
cadena**, y —la más importante— esto:

> *"Si por lo menos uno de esos guardias es un dinamitero sería una catástrofe.
> Porque una sola dinamita lanzada acabaría con todo en el vagón. Por eso haría
> que los tres guardias sean normales y haya un Dinamitero dando vuelta por los
> vagones vecinos. Una estrategia sería esperar a que salga del vagón de armas."*

Eso es mejor que lo que estaba propuesto, y por un motivo exacto: **un
dinamitero plantado adentro vuela los tres cajones en su primer ataque,
siempre**. El peligro sería total y constante, o sea ninguna decisión.
Deambulando, el peligro tiene POSICIÓN — y una posición se puede mirar,
cronometrar y aprovechar. Es lo primero del juego que se resuelve esperando.

**LA CADENA ES POR VAGÓN, NO POR RADIO.** Los tres cajones están repartidos a
lo largo de 480 px y la explosión alcanza 68: por cercanía no se prenderían
nunca entre ellos. Y tiene que pasar ADENTRO del vagón (`tramoAt`), no en el
enganche de al lado — si valiera desde la pasarela se podría volar el vagón
entero sin entrar nunca, y este vagón existe para que entrar sea la decisión.

**ESCALONADA 0,35 s Y NO JUNTA**, que es la mitad de la idea: los tres a la vez
serían un fogonazo del que no se escapa; escalonados se ve la cadena corriendo
por el vagón y se puede correr mientras avanza.

**LOS CAJONES VAN A SEIS BALDOSAS DE CADA PUNTA** del vagón. Si uno quedara
pegado a un borde y el blindado cayera al lado, la cadena le reventaría la
puerta de chapa desde afuera — y esa puerta tiene UNA sola llave.

### El Dinamitero deambulante

Ronda de tres vagones (`rondaDinamitero`, world/train.js): de la mitad de un
vecino a la mitad del otro, pasando por el de armas. Un vecino blindado no
cuenta —su puerta de chapa no se empuja desde afuera, sería mandarlo a empujar
una pared— y de ese lado la ronda se queda adentro del vagón de armas.

**CAMINA A 46 px/s (`enemy.speed`) Y NO A 24 (`patrolSpeed`)**, su único número
propio. No es que sea más rápido: su ronda es de tres vagones y no de uno. A 24
la vuelta completa le llevaría 93 s de un asalto de ~120 reales — se leería como
un tipo quieto, y "esperar a que salga" sería esperar el asalto entero.

Dos medidas distintas, y es lo importante: la RONDA va de mitad a mitad; el
LÍMITE (`confinado`) abarca los tres vagones enteros. Patrullando nunca llega
ahí; peleando sí, y entonces el borde cae sobre una pared o una puerta y no
sobre una línea invisible en el medio de un pasillo.

**Y NO SE PUEDE CONGELAR POR LEJANÍA** (`rondaLarga`, exento del culling de 700
px). Si se congelara, lo dejarías adentro, te irías a esperar afuera y seguiría
adentro para siempre: la jugada entera se rompe. Mismo motivo que el
Cazarrecompensas y el Sheriff.

**LA VARIANTE SUELTA SIGUE EN 0.** Estaba anotado que este vagón subía
`VARIANTES_GUARDIA.dinamitero` de 0 a 0,20, pero con ~2 dinamiteros al azar por
tren uno podía tocarle al vagón de armas, y encima un dinamitero alertado
camina hasta vos esté donde esté. Así que el Dinamitero pasó de ser una
estadística a ser un personaje: hay UNO por tren con vagón de armas. Con dos
más repartidos al azar, mirar dónde está éste dejaría de servir para nada.

### 🐛 Cuatro cosas rotas, y tres eran de código nuevo

**1. El detector de "no puede pasar" medía cuadro a cuadro.** El Dinamitero
necesita darse vuelta si algo le corta el paso (su ronda cruza puertas, y
`puertaBloqueada` traba una al azar en el 15% de los trenes estándar). La
primera versión preguntaba "¿se movió más de 0,5 px en ESTE cuadro?" — pero a
46 px/s un cuadro son 0,77 px, o sea el umbral estaba al 65% de su paso normal.
Bastaba con que otro guardia lo rozara (`separateEnemies`) para que un rato de
caminar despacio contara como estar clavado. Ahora se mide por avance
acumulado: el reloj se reinicia cuando ganó media baldosa, no cuando tuvo un
cuadro bueno.

**2. Y la marca de referencia nunca se ponía.** `Math.abs(e.x - (e.rondaUltimoX
?? e.x))` con la marca en `undefined` da SIEMPRE 0 —se compara contra sí
misma—, así que nunca entraba al `if`, nunca se guardaba, y el reloj subía
aunque estuviera caminando a paso firme. **Medido: 41 vueltas en 150 s, con
capturas que lo muestran avanzando 0,77 px por cuadro con el reloj en 2,0.**
Primo hermano de la lección de `campo || default`: el `??` parece un valor por
defecto razonable y en realidad desactiva la comparación entera.

**3. No todo lo que explota se lanza.** `createExplosive` nacía siempre con
`flying: true`, y el cajón no tiene `throwSpeed` porque nadie lo tira: el paso
daba `NaN`, `0 <= NaN` da false, y en vez de cortar el vuelo le escribía `NaN`
a la posición. El síntoma aparecía tres cuadros después y en otro archivo (el
tilemap reventando al preguntar por la casilla `NaN`). Se arregló en
`createExplosive` y no dándole un `throwSpeed` de mentira al cajón, porque la
pregunta de verdad no es a qué velocidad vuela: es si vuela.

**4. El cajón era invisible, y sólo se vio mirando.** Primera versión: cuerpo
`#4a3a2a` sobre un piso `#6d4a30` — otro marrón, apenas más oscuro— así que se
leía como una SOMBRA en el piso y no como un bulto. Y las dos mechas de 1 px
que asomaban por la tapa directamente no existían en pantalla. **Exactamente el
error de las cartucheras marrones que ya nos habíamos comido.** Lo arreglan
tres cosas y ninguna es "más color": un contorno casi negro (lo único que
despega un objeto de un fondo del mismo tono), madera CLARA en vez de oscura
(contra un piso marrón medio, lo que se separa es lo claro) y tres cartuchos
rojos gordos asomando por arriba con su banda clara.

### VERIFICADO POR CONSOLA

- **Sorteo, 20.000 tiradas:** 49,0% de los trenes estándar traen el vagón (50%
  configurado), nunca junto al ganado (lo reemplaza), **nunca en el vagón 1**,
  y 0 apariciones en el veloz y en el de carga.
- **Geometría:** 30 columnas parejas, filas 4-5 con `+` en los bordes,
  ventanillas alineadas con los huecos entre estanterías, y **cero avisos** de
  cosas colocadas sobre tiles sólidos.
- **Reposición:** con 2 encima te llevás 1 → 3 (el tope); **con el tope lleno
  el cajón no se gasta**; con 1 encima agarrás y quedás en 2.
- **Cadena:** PUM a los 0,40 / 0,73 / 1,08 s — intervalos de 0,33 y 0,35, los
  0,35 de diseño. Una explosión en el enganche de al lado **no** encadena.
- **Balas:** tres tiros lo prenden (vida 3→2→1), y lo prenden igual las tuyas
  y las de un guardia.
- **La ventana de la mecha existe y es exacta:** un cajón solo, corriendo de
  frente, te alejás **94 px en 1,2 s** (la explosión llega a 68) y salís
  **ileso, 4/4**. Quieto al lado de la cadena entera: muerto.
- **Y hay que salir para el lado correcto:** prendiendo el de la izquierda y
  huyendo a la izquierda, 4/4; huyendo a la derecha, 0/4 — corriste a lo largo
  de la cadena. Prendiendo el de la derecha y huyendo a la derecha, 4/4.
- **La ronda, 150 s:** recorrido real 450→1614 sobre la ronda pedida 448→1616,
  **0 vueltas espurias**, 39,1% del tiempo adentro del vagón. Tramos medidos:
  adentro 10,4-12,0 s cada pasada, afuera 14,7-29,9 s. Vuelta completa ~53 s.
  Nunca está más de ~12 s seguidos adentro.
- **El culling:** se lo vio caminando a 1407 px del jugador, el doble del
  `cullPatrolDistance` de 700.
- **La catástrofe, montada a propósito:** jugador parapetado a 100 px, el
  Dinamitero enciende la mecha a los 0 s, **lanza a los 0,68 s**, la cadena
  revienta los 3 cajones a los 2,83 s y el jugador muere (0/4).
- **Caja oculta:** cae en el vagón de armas con el escondite "ENTRE LOS
  CAJONES" (38 de 400 trenes) y **0 inalcanzables** — el relleno por
  inundación que arregló el corral encerrado la cubre gratis.
- **Corrida completa de 60 s con TODO encendido a la vez** (tormenta + redada +
  alerta inicial + puerta bloqueada + los cuatro comportamientos + pasajero
  rico + caja oculta + vagón de armas, 26 guardias): **sin errores ni avisos**.
- **Y el ciclo completo:** llegó al vagón a los 9,2 s, agarró el cartucho (2→3)
  a los 9,7 s, el Dinamitero salió a los 13,3 s — y el jugador terminó muerto
  por quedarse quieto al lado de los cajones mientras le disparaban, que es
  exactamente lo que este vagón castiga.

**MIRADO CON `foto.ps1`**, que es lo que encontró el problema 4 y lo confirmó
arreglado: el verde oliva de las estanterías se separa del piso marrón y de
todo el resto del tren, y el cajón se lee al instante sin confundirse con las
bolsas doradas del mismo vagón.

**NO JUGADO POR SANTI TODAVÍA.**

---

## ✅ HECHA · El Dinamitero deja de ser un guardia con un extra y pasa a ser otra cosa

*(Santi, apenas construido el vagón de armas: "el dinamitero NO tiene arma de
fuego. Él lanza únicamente dinamitas. Y lanza de a dos a la vez y se tarda 5
segundos en volver a tener dos en la mano otra vez")*

Parece un ajuste de números y no lo es: **le cambia la clase de enemigo**.
Hasta acá era un guardia común con un cartucho de más, o sea un guardia; ahora
es un tipo con UNA sola herramienta, y de ahí sale todo lo demás — tiene una
distancia donde es peligrosísimo, una donde no puede hacer nada, y una ventana
de cinco segundos, cada cinco segundos, en la que está literalmente desarmado.

### Lo que se rompía solo, y por eso hubo que decidir tres cosas más

`doCombat` (systems/ai.js) preguntaba por la dinamita **una sola vez y con una
condición muy estrecha**: sólo si te veía PARAPETADO, entre 62 y 150 px. Tenía
todo el sentido — los cuatro del vagón blindado la usan para romper el empate
de "yo detrás de un asiento, vos detrás de otro", y para todo lo demás te
disparan y listo.

**El Dinamitero no tiene ese "y listo".** Sacándole el arma sin tocar esa
condición, contra un jugador que se mueve no hacía absolutamente nada: te
miraba. La condición nunca fue sobre la dinamita — era sobre tener con qué
elegir.

| Decisión | Qué quedó |
|---|---|
| **¿Cuándo tira?** | Siempre que te vea en su ventana, estés como estés |
| **¿Dónde caen las dos?** | Separadas, una a cada lado tuyo, sobre la línea que va de él a vos |
| **¿Y de cerca?** | Retrocede a recuperar distancia (`retrocederParaTirar`) |
| **¿Se ven los 5 s?** | Sí: la bandolera muestra los cartuchos que le quedan |

**LAS DOS SEPARADAS SON LA DECISIÓN QUE IMPORTA.** Dos cartuchos en el mismo
lugar cubren los mismos 136 px que uno solo y no agregan ninguna pregunta;
separados cubren ~200 px —casi medio vagón— y, sobre todo, **te cierran los dos
lados a la vez**. Deja de ser "¿me corro?" y pasa a ser "¿para dónde, y llego?".

**EL RETROCESO NO ES PIEDAD, ES LO QUE HACE QUE ACERCARSE SIGA SIENDO LA
RESPUESTA SIN SER GRATIS.** Su arma tiene un mínimo (62 px): más cerca no la
tira porque se volaría él. Entre los 15 px del cuerpo a cuerpo y esos 62 hay
una franja donde no puede hacer nada, así que sin esto la jugada óptima contra
el enemigo más peligroso del vagón habría sido caminar hasta él y quedarse ahí.
Ahora hay que perseguirlo — y mientras retrocede está indefenso y a la vista.
Si está acorralado contra una pared, deja de retroceder y sigue el camino
normal de combate, para no quedarse empujando.

**Y NO SE CUBRE — esto no se habló, salió construyendo.** `consideraTirarDinamita`
exige línea de tiro DESDE EL CUERPO, y con razón: `throwTarget` traza el vuelo
del cartucho desde ahí, así que con un asiento en el medio la dinamita cae
contra el asiento, a sus propios pies. Un Dinamitero parapetado **no puede
tirar**, y como ahora tampoco dispara, se habría quedado escondido el resto del
asalto sin hacer nada. Con `evitaCobertura` cae en la rama que ya usan el
Pistolero y el civil encubierto: se planta a unos 92 px, cómodamente dentro de
su ventana. Es lo que el personaje ES, además: el que tira algo por el aire
necesita el pasillo libre.

### 🐛 Tres cosas que se descubrieron midiendo, y una era una cuenta mal hecha

**1. Los cinco segundos no eran cinco.** El ciclo medido daba **5,01 s** en vez
de 5,7: el `throwCooldown` arrancaba al ENCENDER la mecha, así que los 0,7 s de
windup corrían en paralelo con la recarga y los cartuchos volvían 4,3 s después
de soltarlos. Lo que se pidió es literal —"tarda 5 segundos en volver a tener
dos en la mano"— y eso se mide desde que las suelta, así que su reloj pasó a
arrancar en `lanzarDinamita`. El del blindado se dejó donde estaba: su cadencia
es un número afinado y moverlo de 5,0 a 5,7 sería cambiarle el balance de
contrabando en un cambio que no es sobre él.

**2. Las dos NO caían separadas.** Medido con el jugador a 100 px: caían a +4 y
−40 (separación 44, no 100), **con una encima del jugador**. La causa era el
alcance del cartucho (`throwRange`, 104 px): la de "más allá tuyo" quería caer
a 150 px del que la tira y `throwTarget` la clampeaba a 104, o sea 4 px más
allá del jugador. La separación sólo habría funcionado en una franja de dos
píxeles. Se arregla con dos números propios: `dinamiteroAlcance` (150 — su brazo
llega más lejos que el tuyo, que es lo justo para el que no tiene otra cosa) y
`dinamiteroRangoMax` (100 — hasta dónde decide tirar, elegido para que
100 + 50 de separación = 150 y **en toda su ventana útil le alcance**).

**3. Y la cuenta de la separación estaba mal por un signo de igual.** Se había
elegido 40 px "para que parado en el medio quedes en el BORDE de las dos, 1 de
daño cada una". Pero 40 es exactamente `lethalRadius` y el chequeo es
`d <= lethalRadius`, **inclusivo**: a 40 px clavados estás ADENTRO del radio
letal de las dos. Medido: 3 + 3, muerto de una sola tanda. Con 50 la cuenta se
cumple de verdad — `50 > 40` deja el centro afuera y `50 <= 68` te deja en el
borde.

### VERIFICADO POR CONSOLA

- **No dispara: 0 balas en 30 s** de combate cuerpo a cuerpo con el jugador a
  la vista y al descubierto. Y los dos disparos a ciegas (por puerta y por
  techo) también quedan cortados.
- **Tandas de 2, cada 5,72 s exactos** (0,70 → 6,42 → 12,13 → 17,85 → 23,57 →
  29,28): **0,350 cartuchos por segundo, el doble** de lo que tira un guardia
  del blindado (0,175).
- **Dónde caen, en toda la ventana:** a 92 y 100 px, +50 y −50 (separación
  100). A 62 y 80 px la tanda se aprieta (75 y 80) porque el clamp impide que
  la de "este lado" le caiga a sus propios pies — que es justo lo que tiene que
  pasar.
- **La cuenta del daño, ahora real:** quieto en el medio de la tanda, **2 de 4**
  (borde de las dos). Corriendo apenas se ven las mechas, **ileso, 4/4**.
- **El retroceso:** pegado a 30 px, termina a 96 — adentro de su ventana útil
  (62-100), sin oscilar.
- **El guardia del blindado, intacto:** 1 cartucho, con arma, se cubre.
- **En un asalto de verdad** (jugador caminando y disparando, todos los demás
  guardias vivos): 6 tandas en 45 s, cada 5,7 s, a distancias de 71 a 100 px —
  toda su ventana, sin quedarse trabado en la recarga ni oscilar con el
  retroceso.
- **Corrida completa de 60 s con todo encendido** (tormenta + redada + alerta
  inicial + puerta bloqueada + comportamientos + pasajero rico + caja oculta +
  vagón de armas, 26 guardias): **sin errores ni avisos**.

**MIRADO CON `foto.ps1`:** la bandolera llena (dos cartuchos rojos con su banda
clara) y vacía (dos huecos oscuros) se distinguen de un vistazo, y se agregó la
banda clara justamente porque **en combate el cuerpo del guardia es rojo** y los
cartuchos también — el rojo sobre rojo era lo más difícil de leer justo cuando
más importa saber si le quedan.

**NO JUGADO POR SANTI TODAVÍA.**

---

## ✅ HECHA · Más pólvora y islas de cobertura en el vagón de armas

*(Santi: "quiero ajustar dos cosas en el vagón de armas: una es que quiero que
hayan más barriles de dinamita y la otra es que quiero que haya pequeñas
coberturas por el centro del pasillo")*

**Cinco cajones en vez de tres, y siete islas de carga de 2×1** en las filas 3 y
6, escalonadas (tres arriba, cuatro abajo, desfasadas tres columnas).

**LOS CAJONES DE MÁS NO DAN MÁS DINAMITA.** El tope siguen siendo 3 cartuchos y
entrás con 2, así que **uno solo sirve como reposición y los otros cuatro son
bombas puestas**. Lo que cambia es la cadena: repartidos cada 48-64 px, la onda
avanza a ~160 px/s, o sea **más rápido de lo que corrés** (78). Correr a lo
largo del vagón dejó de ser una salida.

**Y AHORA HAY DOS CLASES DE COBERTURA, que es lo mejor que salió y no costó una
línea.** Los cajones de pólvora ya frenaban balas, o sea que ya eran cobertura —
una que aguanta tres tiros y después te mata. Al lado de las islas verdes hay
que aprender a distinguirlas: la franja roja y los cartuchos asomando son la
diferencia entre parapetarse y sentarse sobre una bomba.

### 🐛 Tres cosas rotas, y la primera costó dos intentos

**1. LAS COBERTURAS TAPONARON EL CORREDOR, Y CON ÉL LA RONDA DEL DINAMITERO.**

Las islas van en las filas 3 y 6 porque por el corredor 4-5 pasan las rondas —
incluida la del Dinamitero, que cruza el vagón de punta a punta. Un tile sólido
en el camino de una ronda traba al guardia (`moveAxisAligned` empuja en X y no
rodea). Así que las dos patrullas que usaban las filas 3 y 6 tuvieron que
mudarse al corredor… y ahí empezó el problema.

- **Primer intento — las tres rondas al corredor.** Medido sobre 150 s: el
  Dinamitero **dejó de poder cruzar el vagón** (recorrido real 817-1614 sobre
  una ronda de 448-1616) y pasó del 39% al 61% del tiempo adentro.
- **Segundo intento — dos rondas y un centinela**, creyendo que el problema era
  la cantidad. **Peor**: recorrido 1056-1614, ni siquiera entraba a la mitad
  izquierda, 80% del tiempo adentro. Dos cuerpos yendo y viniendo alcanzan para
  taponar un corredor de dos baldosas.
- **Lo que lo resolvió no es cuántos sino EN QUÉ FILA.** El corredor tiene dos
  filas y `CONFIG.enemy.separation` es 13 px: dos guardias en filas distintas
  quedan a 16 px de centro a centro y **no se empujan**. El Dinamitero cruza
  siempre por la fila 4, así que alcanza con dejarle esa fila: las rondas del
  vagón van por la 5, en línea recta (un rectángulo tendría que pasar por las
  dos filas). Mismo patrón que la ronda larga del correo, que existe desde la
  fase 2.

**2. Y EL ATASCO DE VERDAD NO ESTABA EN ESTE VAGÓN.** Con las rondas ya
separadas por fila seguían apareciendo 34 vueltas espurias en 150 s. Registrando
DÓNDE se daba vuelta, todas caían en el **vagón de pasajeros**, entre x=677 y
x=700, con el Dinamitero en y=64-67 en vez de 72 y un tile sólido adelante.

`moveAxisAligned` corrige la Y recién cuando ya llegó en X — mueve un eje por
vez— y para una ronda de un solo vagón eso alcanza. Para el Dinamitero no:
cruza tres vagones llenos de gente y cada cruce le deja un empujón de
`separateEnemies`. Los empujones se acumulan, termina raspando la fila de
asientos, y ahí ya no puede avanzar en X porque medio cuerpo está adentro del
asiento. El turn-around hacía bien su trabajo (estaba trabado de verdad); el
atasco no debería haber existido.

Ahora el que tiene `rondaLarga` corrige la Y **en paralelo** con la X, así que
vuelve al centro del pasillo apenas lo sueltan. Medido después: desvío máximo
del carril **1 px** (antes 8), reloj de atasco máximo **0,33 de 2,5**, y **cero
vueltas espurias** — idéntico con el culling normal y con todos los guardias
moviéndose, o sea estable.

**3. LOS CAJONES QUEDARON PEGADOS A LAS ISLAS, Y ESO LOS VOLVÍA TRAMPAS.** La
primera colocación los puso justo a la izquierda de cada bloque de cobertura:
el que estaba al lado de un cajón sacando un cartucho, al prenderse la mecha,
**chocaba contra la isla y no podía huir**. Medido: prendiendo el último y
corriendo, el jugador terminó a **tres píxeles** de donde arrancó, muerto. Ahora
van en el medio de cada tramo libre, con dos baldosas a cada lado.

### VERIFICADO POR CONSOLA

- **La ronda, 150 s:** recorrido 450-1614 sobre 448-1616, **0 vueltas
  espurias**, 38,3% adentro, pasadas de 10,4-10,5 s y ventanas de 14,7-17,1 s.
  Prácticamente lo mismo que antes de las coberturas (39,1%, 10,4-12,0 s), y más
  regular.
- **Cadena de cinco:** 5 explosiones en 1,40 s (0,40 / 0,73 / 1,08 / 1,43 /
  1,80), escalonadas 0,33-0,35 como manda `cadena`.
- **Escapar, corriendo por el corredor:** prendiendo el primero y huyendo a la
  izquierda, **4/4**; a la derecha, 0/4 (corriste a lo largo de la cadena).
  Prendiendo el último y huyendo a la derecha, **4/4**; a la izquierda, 0/4.
  **Desde el del medio se llega a los dos lados, 4/4**, porque el corredor está
  libre. La regla quedó legible: hay que salir para donde no queden cajones.
- **Geometría:** 30 columnas parejas, corredor 4-5 intacto, **cero avisos** de
  cosas sobre tiles sólidos, cajones a 8 baldosas de cada punta.
- **Corrida completa de 60 s con todo encendido** (tormenta + redada + alerta
  inicial + puerta bloqueada + comportamientos + pasajero rico + caja oculta,
  26 guardias): **sin errores ni avisos**.

**MIRADO CON `foto.ps1`:** las islas verdes y los cajones de franja roja no se
confunden entre sí ni con las bolsas doradas, y el corredor central se lee como
lo que es — el único camino libre de punta a punta.

**NO JUGADO POR SANTI TODAVÍA.**

---

## ✅ HECHA · El barril como arma: se empuja, se vacía, y la cadena ya no deja nada

Cinco ajustes de Santi después de jugar el vagón de armas por primera vez. Los
dos primeros son números; los otros tres convierten al cajón de pólvora en algo
que el jugador **usa** en vez de sólo evitar.

### 1. El Dinamitero, a cuatro de vida

*("su muerte es muy rápida")*. Con 2 se moría en dos tiros de Colt (0,42 s) y
todo lo que lo hace un personaje —la ronda de tres vagones, la tanda de dos, los
cinco segundos de bandolera vacía— no llegaba a pasar nunca. Es el primer
guardia COMÚN que toca el techo de 4, y no lo rompe: `guardHealth` topea ahí, así
que en un tren escoltado sigue teniendo 4.

### 2. El cajón no desaparece: QUEDA VACÍO

*("vos sacás la dinamita de un barril y ya no se puede explotar, pero el barril
sigue estando")*

Es la corrección más importante de toda la vuelta, y arregla de paso una
advertencia que había quedado mal dada. Antes se lo tragaba la tierra al sacarle
el cartucho; después de la primera versión de este cambio quedaba **inagotable**.
Con los dos estados, ninguna de las dos cosas:

| | Cargado | Vacío |
|---|---|---|
| Explota | Sí | **No, nunca más** |
| Frena balas y el paso | Sí | Sí |
| Se puede empujar | Sí | Sí |
| Baleado | Se prende y encadena | Se hace astillas |
| Atropella | Tumba 1,5 s | Tumba 1,5 s |

**SACARLE EL CARTUCHO ES DESACTIVAR UNA BOMBA**, y ésa es la decisión nueva del
vagón. Y le pone el techo que le faltaba: cada uno da UNA dinamita y queda
vacío, así que el vagón entrega cinco en total.

### 3. Colisión

*("los barriles también deberían tener colisión")*. Antes se les caminaba por
encima como a una bolsa. Va en `isSolidForMovementAt` y no en `map.isSolidAt`,
por el mismo motivo que las puertas: `systems/cover.js` pregunta por `isSolidAt`
para decidir contra qué parapetarse, y no queremos que el jugador se cubra
detrás de una bomba sin haberlo elegido.

### 4. Se empujan con `F`, y ruedan hacia la cola

*("se debería poder empujarlos con F para que rueden hacia atrás y así el
jugador puede usar el barril como arma. Esto da más libertad")* — y
*("solo va hacia atrás (a la cola), no puede ir hacia la locomotora por una
cuestión de físicas")*.

Por eso `F` no es tanto "empujar" como **destrabar**: lo soltás y el tren hace el
resto, estés parado donde estés. Es la misma física que el juego ya tenía escrita
desde el tren veloz. Y tiene un costo que no hay que explicar: si estás del lado
de la cola, sale hacia vos.

`F` era el cuerpo a cuerpo alternativo y ahora es contextual, como `[E]`: si hay
un cajón al alcance lo empuja, si no golpea. **La ruedita del mouse sigue siendo
siempre el cuchillo**, así que ninguna de las dos formas de pegar se pierde.

Reusa entero el sistema `rodante` del tren veloz (rodar, tumbar al jugador,
caerse en el enganche, reventarse a tiros) y le agrega tres reglas propias:

- **Rompe la puerta que se le cruce**, de un golpe. Salvo la de chapa del
  blindado, que lo frena — **y ahí un tiro tuyo la vuela sin gastar tu propia
  dinamita**. Es la jugada más cara que habilita todo el sistema y sale sola de
  juntar dos reglas que ya existían.
- **Cruza el enganche el 30% de las veces** en vez de caerse al vacío. Se tira
  una vez por enganche, así que cruzar dos seguidos es un 9%: la chance existe
  pero no se puede planear una cadena de vagones.
- **Atropella guardias y los tumba 1,5 s** — exactamente lo que un barril te
  hace a vos. Y NUNCA los mata, ni a los que ya están en el piso: si lo querés
  muerto, le disparás al cajón; si sólo lo querés fuera del medio, lo empujás.
  Que el empujón matara solo borraría esa diferencia.

**Y EL GUARDIA LO LEE** (*"tiene que saber leer el barril"*), con tres
reacciones según la franja roja:

| Qué ve | Qué hace |
|---|---|
| Vacío, y le sobra tiempo (>70 px) | **Le dispara**: tres tiros lo hacen astillas |
| Vacío, encima | Se corre al costado y lo deja pasar |
| **Cargado** | Sale del carril y **se aleja hacia la locomotora** — contra el sentido del cajón, la única dirección en la que se le aleja de verdad |

Elegido "por distancia" sobre "siempre se corre" porque es lo que haría
cualquiera y **se ve desde afuera**: al que le sobra tiempo lo ves apuntarle al
barril.

### 5. La cadena ya no deja nada

*("que una vez se arme la cadena no quede nada en ese vagón. Es decir, que haya
una explosión allí debería ser casi mortal para el jugador, hoy es más mortal
para los guardias que para él")*

**MEDIDO ANTES DE TOCAR NADA, y corrige la premisa a medias:** la explosión ya
mataba al jugador en todo el centro del vagón (x+160 a x+320) y lo dejaba con 3
de 4 en las puntas. Lo que sobrevivía no era el jugador — era que **el vagón
tenía dos zonas muertas donde no llegaba nada**, para él y para los guardias
(sobrevivían 2 de 4, los de x=93 y x=414).

Se arregló con dos perillas y no con una:

- **Radios propios** (68/110 contra los 40/68 del cartucho): la unión de los
  cinco cubre de x+26 a x+470 de un vagón de 480.
- **Y el daño del borde a 2**, porque con los radios solos seguían vivos los
  mismos dos guardias — caían justo afuera del radio letal, y 1 de daño no
  alcanza contra sus 2 de vida. Agrandar más los radios habría tapado el vagón
  entero y dejado al jugador sin salida; la perilla correcta era el daño.
- **Y la mecha de 1,2 a 2,2 s**, atada a lo anterior: con la explosión cubriendo
  casi todo, el único refugio pasó a ser SALIR, y del centro al enganche hay
  240 px (3,1 s corriendo). Con 1,2 s no llegaba nadie y el vagón se volvía una
  trampa sin jugada.

### 🐛 Cuatro cosas rotas

**1. El cajón vacío explotaba igual.** Dos lugares no miraban `cargado`: la bala
que lo rompe (`combat.js`) y la cadena (`encadenar`). Vaciarlo no servía de nada.

**2. El "suelta lo que estabas haciendo" le cancelaba el disparo al guardia.**
Las tres líneas que apagan el apuntado estaban al PRINCIPIO de
`reaccionarAlCajon`, así que corrían cada cuadro: `tryFire` arrancaba el
apuntado y al cuadro siguiente el reset lo ponía en cero. Medido: `aimTimer`
clavado en 0,30 y `burstLeft` en 2 durante 40 cuadros, sin una sola bala — el
guardia "leía" el cajón y se quedaba apuntándole para siempre.

**3. El cajón empujado rodaba por una fila que en el enganche no existe.** Los
cajones viven en las filas 3 y 6, y ahí el tramo de enganche es el vacío de
afuera del tren: un cajón que cruzaba al vagón vecino viajaba por el aire y las
balas se le morían antes de llegar. Se descubrió probando la jugada de volarle
la puerta al blindado — el cajón llegaba, se frenaba contra la chapa y era
imposible dispararle. Ahora al empujarlo **cae al corredor**, que es la única
franja que existe de punta a punta del tren.

**4. Y dos falsos negativos del arnés, los dos de manual:** un guardia "que no
se movía" estaba metido adentro de una isla de cobertura (la lección de siempre:
verificar que el punto NO sea sólido), y otro "que no reaccionaba" estaba
congelado por el culling a 856 px del jugador.

### VERIFICADO POR CONSOLA

- **Vaciar:** `[E]` da +1 dinamita, el cajón queda `cargado=false` y **sigue en
  la lista**. Baleado después: 0 explosiones. Cargado: 1.
- **La cadena saltea los vacíos:** con dos vaciados de cinco, explotan 3 y
  quedan los 2 vacíos en pie.
- **Colisión:** sólido encima del cajón, libre a 30 px.
- **Empujón:** sale del vagón, `tipo=polvora`, `dir=-1` (hacia la cola), y cae
  al corredor.
- **Rodando:** tres tiros lo rompen (cargado explota, vacío hace astillas);
  atropella tumbando **1,48 s** sin sacar vida ni matar; **rompe la puerta**
  (x=824, rota); y **cruza el enganche el 33,5%** sobre 30% configurado (200
  tiradas).
- **La jugada del blindado:** el cajón cruza, se frena contra la chapa (x=1302,
  vel=0) y al dispararle **vuela la puerta blindada** sin gastar tu dinamita.
- **La IA del guardia:** vacío a 120 px → le dispara (91 cuadros con bala);
  vacío a 45 px → se corre 16 px del carril; cargado → se corre 16 px y **se
  aleja 99 px**.
- **La cadena, ahora:** **0 guardias vivos de 4**. El jugador quieto muere de
  x+120 a x+360 y sale con 2 de 4 en las puntas; corriendo, se salva.
- **Corrida completa de 70 s con todo encendido** (tormenta + redada + alerta
  inicial + puerta bloqueada + comportamientos + pasajero rico + caja oculta +
  el vagón de armas, 26 guardias): **sin errores ni avisos**.

**MIRADO CON `foto.ps1`:** el cargado (franja roja gruesa y tres cartuchos
asomando) y el vacío (tapa abierta, hueco negro, sin nada de rojo) se distinguen
de un vistazo. Hizo falta dibujar el hueco y no simplemente sacar el rojo: un
cajón liso se habría leído como "todavía no lo abrí".

**NO JUGADO POR SANTI TODAVÍA.**

---

## 🐛 ARREGLADA · El Dinamitero salía siempre en el mismo momento, y una puerta trabada lo encerraba

*(Santi, jugándolo: "habíamos decidido que el dinamitero no siempre estará en su
vagón, pero cada vez que hago un asalto lo encuentro en el vagón de armas")*

Dos defectos distintos con el mismo síntoma. El primero es el interesante,
porque **el código no tenía ningún bug**: hacía exactamente lo que decía.

### 1. La ronda era idéntica en todos los asaltos

Arrancaba siempre en el centro exacto del vagón (`startX: centro(tramoArmas)`) y
siempre hacia adelante (`pathIndex = 1`), y **nada más de su ronda es
aleatorio**. Así que su posición en el segundo *T* de un asalto era la misma en
todos los asaltos. Medido: estaba adentro del vagón en los segundos **0-4,
26-36, 54-63 y 81-91**, y dos asaltos distintos dieron la misma tira segundo por
segundo, bit a bit.

Y ahí se cierra el círculo: **caminando derecho, sin pelear ni saquear, se llega
al vagón de armas a los 17,4 s**. Un asalto real —limpiar el primer vagón, abrir
puertas, agarrar plata— te deja llegando entre los 25 y los 40. Justo encima de
la ventana 26-36. No era mala suerte: el reloj del Dinamitero y el ritmo del
jugador arrancaban juntos y no cambiaban nunca.

**Y el comentario del código se equivocaba.** Decía que arrancar en el centro
hacía que "la primera vez que llegás esté ahí". No es cierto: a los 17 s ya
había salido, estaba en x=1542. Lo que te lo ponía enfrente era su **segunda
pasada**, o sea el ciclo, no el arranque. La intención estaba bien; la ejecutaba
otra cosa.

Ahora arranca en un punto al azar de su recorrido y para un lado al azar.
Verificado sobre 200 asaltos: reparto uniforme (80 arrancan adentro del vagón
contra 79 esperados, 93/107 de dirección), promedio 1042 contra un centro
teórico de 1056, y **cero arranques sobre un tile sólido o fuera del pasillo** en
320 asaltos sobre cuatro composiciones, con vagón blindado de cada lado.

> Y una lección de arnés: con **6 tiradas** el arranque parecía sesgado (5 de 6
> para el mismo lado, 0 de 6 adentro del vagón). Con 200, uniforme. Era ruido.

### 2. Una puerta trabada del sorteo lo encerraba

`puertaBloqueada` (15% de los trenes estándar) traba una, dos o tres puertas. Si
alguna caía **sobre su recorrido**, le partía la vuelta al medio:

| Puerta trabada | Recorrido real (de 1216 px) | Tiempo adentro |
|---|---|---|
| ninguna | 1211 px — completo | 31-37% |
| lejos de su ronda | 1211 px — completo | 39-42% |
| **una sobre su ronda** | **889 px** | **52%** |
| dos sobre su ronda | 554 px | **70%** |

El turn-around funcionaba —no se quedaba empujando madera— pero el efecto neto
era que rebotaba del lado del vagón de armas, que es justo donde la gracia es que
salga.

**Ahora lleva la llave del tren** (`tieneLlave`). Es el único guardia con una
ronda que cruza puertas, así que es el único que la necesita. **Abrir no es
destrabar**: la puerta se abre mientras él la ocupa y se vuelve a cerrar con el
`closeDelay` de siempre, todavía trabada. Para el jugador la única llave sigue
siendo el plomo (`trabadaDeOrigen` no la suelta nadie) — pero al que lo venía
siguiendo le queda una ventana para colarse detrás suyo.

**Tres cosas rotas antes de que funcionara:**

1. **La llave sola no alcanzaba.** Una puerta trabada frenaba el paso *sin mirar
   si estaba abierta* (`bloqueaPuertaCerrada`), lo cual era correcto mientras una
   trabada no pudiera abrirse nunca. El Dinamitero la abría y se la comía igual:
   se veía abierta y seguía siendo un muro.
2. **Y tampoco llegaba a tocarla.** El colisionador lo clava a **25 px** del
   centro de la hoja y `ocupada` pedía menos de 12,5. Se quedaba oscilando contra
   la puerta sin alcanzarla nunca. El de la llave la abre desde 32 px (dos
   baldosas): estira la mano antes de chocarla.
3. **Mi primera versión dejaba la puerta abierta para siempre.** Al irse él,
   `updateDoor` retornaba antes de correr el `closeTimer`, así que se quedaba
   abierta —y trabada— hasta el final del asalto. O sea que la destrababa de
   hecho, que era exactamente lo que no queríamos.

**La ventana quedó en 3,2 s y no en 1,6**, porque él la sostiene mientras se
acerca y cruza, y el `closeDelay` recién arranca cuando la suelta. Se decidió el
1,6 sobre una tabla creyendo que ése iba a ser el total; el número real está más
cerca de la opción de 4 s que se había descartado. Queda anotado por si molesta.

### VERIFICADO POR CONSOLA

- **La ronda, con una puerta trabada encima:** recorrido 1211 de 1216 px en 6
  casos de 6, y 39% de tiempo adentro (el mismo que sin puerta).
- **Sigue siendo un muro para el jugador:** entera, en 6 casos, nunca la abre
  empujando y se frena a 13 px. Cerrada = sólida en **5235 cuadros**, abierta =
  se cruza en **765**, cero fugas en ninguno de los dos sentidos.
- **Efecto secundario, medido y aceptado:** también abre las que traba el
  **Cazarrecompensas** al cerrar el tren. Con todas las puertas trabadas siguió
  circulando completo (1211 px). No se distinguió por origen.

### Y UN PROBLEMA VIEJO QUE RECIÉN AHORA ESTÁ MEDIDO

**Cuando el vagón blindado queda pegado al de armas, la ronda se acorta a 640 px
en vez de ~1070** — su puerta es de chapa y no se empuja desde afuera, así que
ese vecino no cuenta y la ronda se queda adentro del propio vagón de ese lado.
Ahí pasa **48-60% del tiempo adentro** en vez de 33%, y "esperá a que salga"
casi no existe. **Pasa en el 43% de los trenes con vagón de armas** (20.000
sorteos). No lo causó ninguno de estos dos arreglos: antes era peor (65%, con el
vagón de 480 px). Sin resolver.

---

## ✅ HECHA · El pueblo tiene cielo, y el campamento de día tiene sol

*(Santi, jugándolo: "hay algo que me molestaba y ahora me di cuenta de que es:
la atmósfera. Las mecánicas del juego se sienten muy bien pero no me siento
dentro del Viejo Oeste")*

Mirando las cuatro pantallas apareció una causa que se podía medir: **toda la
paleta de exteriores vivía en la misma franja de marrones** — `desiertoDia`
#8a6f47, `puebloTierra` #9c7f56, `campSueloDia` #a08053 — y no había **un solo
color frío** en el juego contra el cual esos ocres se leyeran como cálidos.

La prueba de que no era falta de dibujo: **el mapa de rutas sí se siente
western**. Sepia, "MINA LA VIUDA", la rosa de los vientos. Es la única pantalla
con una paleta propia, y cuando el juego se separa del marrón único, el Oeste
aparece solo.

### El cielo del pueblo era CÓDIGO MUERTO

`render` limpiaba la pantalla con `colors.puebloCielo`, pero `dibujarTierra`
pintaba *"la loma detrás del pueblo"* **desde `y=0`** y lo tapaba entero, en un
marrón escrito a mano (#7a6a4e) que ni siquiera estaba en la paleta. O sea que el
pueblo no tenía cielo: tenía una loma de 72 px de alto, del mismo tono que la
tierra. **Partir ese rectángulo en dos es todo lo que hay entre el antes y el
después.**

- **`r.cielo()`** nuevo en el renderer: degradado vertical **por bandas** (ocho)
  y no con el gradient del canvas. Un gradient real mete cientos de tonos
  intermedios y en 384x216, donde todo lo demás es color plano, se lee como un
  error de compresión y no como aire.
- **Va antes del `translate` de la cámara**: está infinitamente lejos, así que si
  se corriera con ella, caminar por el pueblo movería el horizonte y el pueblo se
  sentiría del tamaño de una habitación.
- La loma pasa de tapar 72 px a ser una franja de 16, con `ALTO_LOMA` compartido
  entre los dos. Si sólo lo supiera uno, el degradado se dibujaría por debajo y
  perdería justo el tramo pálido del horizonte, que es el que da la distancia.

**De regalo, la noche mejoró sola:** el velo cae sobre el cielo y el pueblo
nocturno se lee como un atardecer en vez de una pared marrón.

### Y el campamento de día no tenía ninguna pista de que hubiera un sol

El jugador ya tenía sombra y era **el único objeto de la escena** que la tenía.
Una escena cenital sin sombras se lee como recortes apoyados sobre un papel.

- Sombras para la carpa, el cajón, el cartel, los dos postes por separado, el
  caballo y la fogata, **todas para el mismo lado** con una constante `SOL`
  compartida. Lo que hace leer el sol no es el tamaño de cada sombra sino que
  **todas apunten igual**.
- La del jugador sigue ese sol **sólo de día**; de noche vuelve a quedar
  centrada, porque ahí la luz es la fogata y según de qué lado del fuego estés
  parado le tocaría para otro lado. Centrada no afirma nada.
- **El desierto de alrededor dejó de ser un relleno liso:** matorrales y piedras,
  con los mismos verdes del costado de la vía en el galope (#4d5c34, #3d4a2a).
  Son los únicos no-marrones del campamento, que es lo que hace que los ocres se
  lean como ocres.

### DOS COSAS QUE SE PROBARON Y SE SACARON

**1. El degradado en el galope no funciona.** Se veía como **rayas pintadas en el
piso**: con contraste, rayas; sin contraste, no se veía nada. La razón, que
recién se entendió mirándolo: en el pueblo el cielo es un **telón fijo** y un
degradado se lee como aire, pero en el galope el suelo es una **superficie que
recorrés** con la cámara moviéndose encima, así que el mismo degradado se lee
como pintura. Revertido junto con sus dos colores para no dejar nada muerto.

> **Y el galope no puede tener cielo**, que es lo primero que se intentó: la
> cámara nunca sube más allá del techo del tren (`camY = Math.max(0, …)`), así
> que "arriba" es el otro lado de la vía y no el aire. Meterle cielo sería
> rediseñar la cámara. Lo que sí puede tener son **siluetas de meseta en la capa
> lejana del parallax**, y eso es una sesión propia.

**2. Las matas del campamento salieron en diagonales perfectas.** `(i*97+23) %
ancho` y `(i*53+31) % alto` son las dos **lineales en `i`**, así que los puntos
marchaban en fila como un ejército. Se vio a la primera foto. Ahora hay un
`revolver(n)` que revuelve el entero, y **tiene que ser una función pura del
índice y no el `rng` del juego**: esto corre en cada cuadro del dibujo y un rng
de verdad avanza su estado, así que las matas titilarían.

### LO QUE QUEDA ANOTADO

- **La partida sigue empezando de noche** (`esDeDia: false` en `gameState`, y por
  una buena razón: que lo primero que quieras hacer sea dormir y aprendas el
  sistema solo). El efecto es que **lo primero que ve alguien es la versión más
  oscura de todo**, y nada de esto se ve en la primera pantalla.
- Falta el **sonido**, que es la otra mitad de la atmósfera: `startAmbience` se
  llama **sólo en el asalto** (`raidScene.js`), así que el campamento, el pueblo,
  el mapa y el galope están **mudos**. Sin viento, sin cascos, sin música. Es el
  mayor efecto por hora de trabajo que queda en el juego.

**Verificado:** las cuatro escenas de día y de noche más un asalto de 300
cuadros, sin un error de consola. Mirado en el navegador. **NO JUGADO POR SANTI
TODAVÍA** al momento de escribir esto.

---

## ✅ HECHA · La pólvora sale del vagón de armas y se reparte por el tren

*(Santi: "cuando hay un vagón de armas en el tren, no sólo ahí dentro habrían
barriles de dinamita, sino que afectaría a todo el tren, haciendo que haya
vagones con barriles de dinamita (puede haber en todos menos en el de
pasajeros). Y el vagón de armas pasaría a ser un vagón de paso como el de ganado
(a pesar que sí tendría un par de guardias y más barriles)")*

El vagón de armas dejó de ser **el depósito donde está toda la pólvora** y pasó a
ser **el lugar donde hay más**. Es un cambio de geografía, no de cantidad.

### Ahora son DOS reglas y no una

- `p.cajones` depende del **VAGÓN**: un vagón de armas lleva pólvora en cualquier
  tren que lo lleve a él. Es lo que el vagón ES.
- `p.cajonesExtra` depende del **TREN**: los demás vagones sólo llevan pólvora si
  en la composición hay un vagón de armas. Mismo patrón que las tranqueras del
  ganado, que sólo existen en el tren de carga.

**El vagón de pasajeros queda afuera sin ningún `if` con su nombre:** no tiene
candidatas y listo. Cualquier vagón futuro entra o no según si le escribís
posiciones, igual que `sinVariantes`.

Y son **candidatas, no una lista fija**: se sortean una o dos por vagón, así que
dos asaltos al mismo tipo de vagón no tienen la pólvora en el mismo lugar. Es lo
único de este sistema que cambia entre asalto y asalto.

### El problema era la economía, y lo resolvió Santi

Pólvora en cuatro vagones multiplicaba la dinamita, y el techo de cinco del vagón
viejo estaba puesto a propósito (*"sin esto sería una fuente inagotable con sólo
volver a pasar"*).

*(Santi: "no siempre vas a poder sacar un trozo de dinamita de un barril. Al
acercarte te vas a dar cuenta de si se puede o no")*

**`tieneCartucho` es un estado nuevo y distinto de `cargado`.** Uno dice si
EXPLOTA —lo tienen todos— y el otro si te da algo. Un barril sin cartucho es
igual de peligroso y no te da nada.

**Y no hizo falta inventar ninguna señal**, que es lo mejor que salió de esto: el
cargado ya tenía la franja roja cruzada (gruesa, se ve de lejos) y tres cartuchos
asomando por la tapa (chicos, se ven al lado). Ahora la franja la tienen todos y
los cartuchos sólo los que te dan uno. De lejos, todos los barriles son la misma
amenaza; de cerca se distinguen. Eso es literalmente lo que pidió Santi.

Son **tres estados** y cada señal dice una cosa distinta:

| Señal | Qué dice | Explota | Te da algo |
|---|---|---|---|
| Franja roja cruzada | ESTO EXPLOTA | Sí | — |
| \+ tres cartuchos asomando | y hay uno para vos | Sí | Sí |
| Tapa abierta y hueco negro | ya lo vaciaste | **No** | No |

El cartel sobre la cabeza pasó a tener tres casos, y **el del medio nombra la
pólvora a propósito**: sin eso, un barril sin cartucho se leería como uno ya
vaciado, y son cosas muy distintas — éste todavía vuela por los aires.

### El vagón de armas, ahora de paso

*(Santi eligió "se acorta como el de ganado" sobre una tabla de tres, sabiendo
que perdía las siete islas de cobertura de la sesión anterior.)*

De **30 columnas a 24** (lo mismo que el ganado), de **tres guardias a dos**, de
**cinco bolsas a una**, y de cinco barriles a **cuatro**. Un vagón donde te
quedás a juntar cinco bolsas no es de paso por más corto que sea: lo que te hace
quedarte es el botín, no los metros.

**Y lo que ocupa el lugar de las islas son los barriles**, que ya frenaban balas.
Así que la única cobertura del vagón pasa a ser la cosa que explota: **cubrirse
acá es elegir una bomba**. Es mejor que lo que había — antes podías elegir entre
una isla verde segura y un barril; ahora no hay isla.

El corredor 4-5 sigue libre de tiles sólidos, y las rondas de los dos guardias
van por la fila 5: la 4 es por donde cruza el Dinamitero, y eso no se toca.

### DOS AJUSTES DESPUÉS DE JUGARLO

**1. Los barriles del comedor, al pasillo.** *(Santi: "los barriles en el comedor
ponlos dónde todos: en el pasillo")*. En todos los demás vagones van en las filas
3 y 6, pegadas al corredor. En el comedor esas filas son **las mesas**, así que
la primera versión los mandó a las filas 1 y 8, contra la pared — y quedaban
**detrás de dos hileras de mesas**: no se veían al pasar, no servían de cobertura
y no entraban en ninguna decisión. Estaban puestos donde había lugar, no donde
importaban. Ahora van en el corredor, donde están en el camino de todos.

**2. El vagón de armas bajó del 50% al 25%.** *(Santi: "baja la probabilidad de
que aparezca este vagón a un 25%")*. El 50% era el primer número, elegido sin
jugar. Y lo que cambió en el medio es que este vagón **dejó de afectar sólo a su
propio pasillo**: desde que su presencia reparte pólvora por el tren entero, la
mitad de los asaltos eran asaltos con barriles por todos lados. A uno de cada
cuatro vuelve a ser lo que tenía que ser. De paso el ganado recupera presencia
(75% en vez de 50%), así que vuelven a estar vivos el escondite "junto al corral"
de la caja oculta y el único vagón sin techo del tren.

### VERIFICADO POR CONSOLA

Sobre **250 trenes** con vagón de armas:

| | Resultado |
|---|---|
| Barriles por tren | **8,58** (entre 7 y 10) |
| Cartuchos por tren | **2,95** — el objetivo eran 3 |
| Proporción con cartucho | 34%, clavada en `chanceCartucho` |
| Barriles sobre un tile sólido | **0** |
| Trenes **sin** vagón de armas | **0 barriles**: idéntico al de siempre |

- **La cadena sigue siendo por vagón:** prendí uno del comedor, volaron sus 2 y
  los otros 7 del tren quedaron intactos.
- **El Dinamitero pasa 29-34% adentro** con vecinos normales, así que acortar el
  vagón no le rompió la vuelta.
- **El sorteo del 25%:** clavado sobre 40.000 tiradas, con 75% de ganado.
- **Los barriles del comedor:** siempre en el corredor (fila 4 col 10, fila 4 col
  29, fila 5 col 17), ninguno sobre un tile sólido **ni encima de un pasajero**
  (los del comedor viajan en (2,4) y (26,5)).
- **El escondite de la caja oculta sobrevivió al recorte:** 59 de 300 caen en el
  vagón de armas, ninguna sobre sólido y todas con un tile pisable al lado. Se
  define por tipo de tile (`C`), no por columna, así que el vagón más corto no lo
  rompió.
- **Asalto de 90 s** con clima, puerta bloqueada, comportamientos y paquetes: sin
  errores.

### UN ERROR PROPIO, Y DOS DEL ARNÉS

**El error:** un barril del blindado quedó en la **columna 11 de la fila 6**, que
en ese layout es un cajón sólido y no piso. En **126 de 250 trenes** nacía dentro
de una pared. Lo encontró la medición, no la vista.

**Los del arnés**, los dos de manual:

1. Una medición del Dinamitero "trabado" durante 80 segundos era en realidad **el
   mundo entero congelado**: el jugador había muerto y la escena ya no se
   actualizaba. Ningún enemigo se movía, ni los que estaban disparando. La
   lección de siempre — antes de creerle a una medición en cero, verificar que el
   escenario siga vivo.
2. Las filas de los barriles del comedor "salían en la 5 y la 6" y estaban en la
   4 y la 5: `Math.round(y / 16)` sobre un `tileCenter` (que devuelve `row*16+8`)
   redondea siempre para arriba. Era `Math.floor`.

---

## 🐛 ARREGLADA · El blindado pegado al vagón de armas le rompía la ronda al Dinamitero

Quedaba anotado en la entrada anterior como "viejo y sin resolver". Es esto.

**El problema, medido:** la ronda del Dinamitero va de la mitad de un vecino a la
mitad del otro, pero **el vagón blindado no cuenta como vecino** — su puerta es
de chapa, no se empuja desde afuera, y él literalmente no puede entrar. De ese
lado la ronda se queda adentro del propio vagón de armas. Con el blindado al
lado, la vuelta se acortaba a **640 px en vez de ~1070**, y pasaba **48-60% del
tiempo adentro** en vez del 33% de diseño. O sea que "esperá a que salga" —la
jugada sobre la que se construyó todo el vagón— no existía. **Pasaba en el 43%
de los trenes con vagón de armas.**

### La idea de Santi, y el caso que se contradecía

*("yo pondría que el blindado siempre se encuentre después del de armas. O sea,
si armas está en el vagón 3, el blindado va a estar en el cinco. Si el de armas
está en el 2, el blindado estará en el cuatro. Y si el de armas está en el 4 o
cinco, el blindado estará en el 6")*

Tres de los cuatro ejemplos dejan **un vagón de por medio**. El cuarto no: armas
en el 5 y blindado en el 6 quedan pegados, que es justo lo que se estaba
arreglando. Se le marcó y se implementó con el hueco garantizado.

**Y el hueco es lo que importa, no el orden.** Medido sobre 30.000 sorteos:

| Regla | Quedan pegados |
|---|---|
| Hoy (blindado en el vagón 3 o más adentro) | **44%** |
| Blindado en el 4 o más | 41% |
| Blindado en el 5 o más | 39% |
| Blindado **siempre último** | 24% |
| **Blindado después del de armas** (regla literal) | **40%** |
| **Blindado ≥ armas + 2** (con hueco) | **0%** |

Correr el blindado hacia adentro casi no mueve la aguja, y el motivo es
geométrico: **no lo despega, sólo le va sacando vecinos**. En los vagones 3, 4 y
5 tiene dos; recién en el 6 tiene uno solo, y por eso ahí cae a la mitad. Y la
regla literal de Santi falla por lo mismo — "después" incluye "justo después".

También se descartó **"blindado siempre último"** (que sí bajaba a 24%) por dos
costos: le copia al **tren veloz** la regla que lo distinguía del estándar
(`posicionFija: 'ultima'`, puesta a propósito para que no se parezcan), y aleja
el premio más grande de una posición media de 4,5 a 6,0, encareciendo la
pregunta que sostiene la fase 2.

### Cómo quedó

Una regla nueva en el sorteo, hermana de `posicionMinima` y `posicionFija`:

```
posicionRelativa: { blindado: { detrasDe: 'armas', hueco: 2 } }
```

Si el vagón de armas no viaja (tres de cada cuatro trenes), la regla no aplica.

**Y de yapa ordena el tren:** la pólvora viene siempre **antes** que la caja
fuerte. La puerta del blindado tiene una sola llave, que es tu dinamita, y ahora
el lugar donde te reponés queda siempre de camino a ella. No se buscó; salió.

**El precio:** el vagón de armas ya no puede caer en los vagones 5 ni 6 — con
seis vagones y un hueco de por medio no queda lugar para el blindado detrás.
Queda repartido entre el 2 (50%), el 3 (33%) y el 4 (17%).

### VERIFICADO POR CONSOLA

- **40.000 sorteos:** 0 pegados, 0 con el blindado antes del de armas, 0 sin el
  hueco. El 25% del vagón de armas sigue clavado.
- **Seis trenes reales, sorteados de verdad y jugados 90 s cada uno:** el
  Dinamitero pasa **32-34% del tiempo adentro** en los seis, contra 48-60% de
  antes. Longitud de ronda 1008-1120 px (era 640). Promedio: **33%**, que es
  exactamente el número de diseño.
- **Cuesta 1,18 barajadas** de más en promedio y **nunca falló** en 30.000
  intentos (el sorteo reintenta hasta 50 veces).
- Las cuatro escenas, un mapa corriendo 90 s (que sortea trenes de verdad), un
  asalto de 90 s con todo encendido, y 500 sorteos del **tren veloz** y del **de
  carga** —que no llevan la regla nueva— sin un error.

---

## ✅ HECHA · El blindado a veces viaja ADELANTE del vagón de armas (y el de armas nunca es el último)

*(Santi: "aún así, quiero añadir una probabilidad: que el vagón blindado se
encuentre antes que el de armas. 50% de probabilidad que se encuentre después
(actual) y 50% de probabilidades que se encuentre antes. Siempre teniendo en
cuenta que hay que dejar un hueco en medio")*

Segunda vuelta sobre la entrada anterior. La regla de separación se queda; lo
que cambia es que **el lado se sortea**.

### Lo que apareció midiendo, y que cambió el pedido

**1. El requisito real no era "que no esté pegado al blindado".** Es que **el
vagón de armas tenga un vecino AL QUE SE PUEDA ENTRAR de los dos lados**. El
blindado no cuenta (su puerta de chapa no se empuja desde afuera) y el final del
tren tampoco. Con el de armas de último vagón medí la ronda en 656-704 px y
**40-61% del tiempo adentro** — exactamente el mismo defecto con otra cara. Por
eso ahora hay una regla nueva, `posicionMaxima`, y el de armas nunca es el
último.

**2. Y el lado "antes" tiene UNA SOLA combinación posible.** Con el de armas sin
poder ser primero ni último, y el blindado sin poder ir antes del vagón 3, del
lado "antes" sólo entra **armas en el 5 y blindado en el 3**. Contra seis del
otro lado:

| Lado | Combinaciones |
|---|---|
| después | armas 2/blindado 4, 2/5, 2/6, 3/5, 3/6, 4/6 — **seis** |
| antes | armas 5/blindado 3 — **una** |

Así que un 50/50 habría hecho que **la mitad de los trenes con vagón de armas
tuvieran siempre exactamente el mismo par de posiciones** — mucha repetición
justo en la mitad que se agregaba para tener variedad. Se le mostró a Santi la
tabla y eligió bajarlo a **25%**: el blindado adelante pasa a ser una excepción
reconocible en vez del tren de todos los días, y no hubo que tocar ninguna otra
regla. (La alternativa era dejar al blindado viajar desde el vagón 2, que abría
el lado "antes" a tres combinaciones pero ponía el premio más grande a un vagón
de la salida. Descartada.)

### DOS BUGS PROPIOS, LOS DOS ENCONTRADOS MIDIENDO

**1. El escape del sorteo devolvía trenes pegados.** Cuando la moneda decía
"antes" y en 50 barajadas no encontraba un orden válido, `sortearComposicion`
devolvía la composición **sin barajar** — que justo tiene el de armas en el 5 y
el blindado en el 6, pegados. Medido: **23 trenes de 9921**. O sea el defecto que
esta regla existe para evitar, colándose por la puerta de atrás, y encima siempre
con el tren menos mezclado posible. Ahora, si el lado sorteado no se puede
cumplir, **se prueba el otro** antes de rendirse.

**2. La perilla mentía: `chanceAntes: 0.25` daba 20,2%.** Del lado "antes" hay
una sola disposición válida, o sea 24 de los 720 órdenes posibles: **3,33% por
barajada**. La chance de fallar 50 veces seguidas es `0,9667^50 = 18,4%`, y esos
trenes se iban al otro lado — la cuenta da exactamente la fuga observada. Con 250
intentos la falla cae a 0,02% y la perilla dice lo que hace. Cuesta 0,0019 ms por
sorteo.

### 🔻 Y UNA CORRECCIÓN A LA ENTRADA ANTERIOR

La entrada de arriba dice que el Dinamitero pasa **"32-34% adentro, exactamente
el número de diseño"**. Ese número estaba **submuestreado**: medía una vez por
segundo simulado sobre un ciclo de ~44 s, y eso aliasea feo. Midiendo cuadro a
cuadro (6.000 muestras en vez de 80), los números reales son:

| Configuración | Ronda | Adentro |
|---|---|---|
| armas 5 / blindado 3 (la nueva) | 1008 px | **41%** |
| armas 2 / blindado 4 | 1072 px | **42%** |
| armas 5 / blindado 4 (pegados, hoy prohibida) | 640 px | **55%** |

El arreglo sigue siendo real y grande —41% contra 55%, y la ronda casi al doble—
pero el "exactamente el número de diseño" era optimismo del muestreo. Vale como
lección: **una muestra por segundo sobre un ciclo de decenas de segundos no
alcanza**; si lo que medís es un ciclo, muestreá por cuadro.

### VERIFICADO POR CONSOLA

- **60.000 sorteos:** 0 pegados, 0 con el de armas primero, 0 con el de armas
  último, 0 composiciones sin barajar. `blindadoAdelante` = **25,1%** contra una
  perilla de 25%. Las siete combinaciones válidas aparecen todas.
- El vagón de armas queda en el 2 (38%), 3 (24%), 4 (12%) y 5 (25%).
- Las cuatro escenas, un mapa corriendo 90 s (que sortea trenes de verdad), un
  asalto de 90 s con todo encendido, y 2.000 sorteos del **tren veloz** y del
  **de carga** —que no llevan ninguna de estas reglas— sin un error.

---

## ✅ HECHA · El sonido: la tormenta que se oye, y las cuatro pantallas que estaban mudas

*(Santi: "pasemos al tema del sonido así podemos seguir avanzando luego en las
otras fases de cosas 'sorpresa' y estados del tren. Recuerda que en la Tormenta
se tiene que sentir como una: truenos y lluvia impactando en un techo de
chapa")*

El punto de partida, medido: **`startAmbience` se llamaba en UN solo lugar de
todo el juego** (el asalto). El campamento, el pueblo, el mapa y el galope
estaban mudos — cuatro de las seis pantallas, incluido el galope, que es la más
cinética que tiene el juego. Y la tormenta existía desde la Fase 1 como **un
solo número** (`hearMult: 1.4`): te cambiaba el sigilo y no se veía ni se oía.

### Lo primero fue que el motor supiera hacer capas

Había un único fondo, escrito a mano y fijo: se prendía y se apagaba. **La
lluvia sobre chapa no es un sonido, son tres** —el repiqueteo en el techo, el
siseo del agua y el viento— y cuánto suena cada uno depende de dónde estés
parado. Eso no se puede hacer prendiendo y apagando: hay que poder subir una y
bajar otra sin cortes.

Ahora hay capas con **nombre y volumen ajustable en vivo** (`ambiente`,
`volumen`, `quitarAmbiente`). El traqueteo del tren pasó a ser una capa más y
no un caso especial.

Y a `noise()` se le agregaron `delay` y `attack`, que es lo único que se le
tocó desde que se escribió. El motivo: **un trueno lejano CRECE**, no golpea.
Todo lo demás del juego es un impacto que empieza a todo volumen y cae; sin
`attack`, el trueno sonaba a dinamita al lado.

### La tormenta, y por qué son tres capas

| Capa | Qué es | Dónde manda |
|---|---|---|
| `chapa` | El repiqueteo metálico del techo. Resonancia alta (`q` grande): una chapa bajo la lluvia **canta** | Sólo **bajo techo** |
| `agua` | El siseo del agua cayendo | Siempre, y sube **afuera** |
| `viento` | El fondo grave | Sólo **afuera** |

**Y eso convirtió al sonido en información.** Al cruzar un enganche, al entrar
al vagón de ganado (que va al aire libre) o al subirte al techo, la chapa se
apaga y el agua y el viento suben: **se oye cuándo estás expuesto**, que es
exactamente cuando los jinetes de afuera te pueden pegar un tiro. No hizo falta
inventar ninguna señal — el clima ya era la señal, y el juego ya sabía si
estabas a cubierto (`hayTechoEn`, que existía para el camino del techo).

Los truenos van por `dt` desde la escena y no con `setInterval`, así que se
paran cuando la escena se para, como todo lo demás.

### Las cuatro pantallas mudas

- **El campamento**: el desierto, y **la fogata sólo de noche** — de día está
  apagada, que es el reloj del juego. Los chasquidos van con intervalo
  irregular: uno cada 0,9 s exactos suena a metrónomo, no a fuego.
- **El pueblo**: la calle, más baja de noche.
- **El mapa**: lo más callado de todo. No es un lugar, es un papel que mirás en
  tu campamento — va el mismo viento de allá, más bajo todavía.
- **El galope**: el viento, y **los cascos con la cadencia atada a la velocidad
  del caballo**. El galope ya decía en pantalla si el animal estaba lanzado o
  aflojando (la barra de aguante), pero no se oía. Medido: 3,7 cascos por
  segundo galopando, 2,3 al trote, 1,3 aflojando.

### TRES BUGS PROPIOS, LOS TRES EN LOS CASCOS

1. **`caballo.velMax` no existe** — el campo es `sprintSpeed`. Y tenía un
   `|| velocidad` de red que lo tapaba: la proporción daba 1 siempre y **la
   cadencia nunca se habría estirado**, o sea que el casco habría sonado igual
   al galope que al paso. La trampa de `campo || default` de siempre, que este
   proyecto ya tiene anotada tres veces.
2. **Usaba `vel`, que es la velocidad RELATIVA AL TREN**, no la del caballo
   sobre el suelo. Un Mustang que le sigue el paso al tren tiene `vel` cero:
   habría sonado a caballo parado justo cuando corre a fondo. Lo correcto es
   `velCaballo` (ver `trenVelocidad` en data/horse.js).
3. **Y `velCaballo` PUEDE SER NEGATIVA**: frenando es
   `sprintSpeed * troteFactor - brakeSpeed`, que con el Criollo da −14. No es
   que el animal vaya marcha atrás — es cómo la escena expresa "quedate atrás
   del tren". Sin un `abs`, el caballo **enmudecía justo al aflojar**.

### ⚠️ LO QUE NO ESTÁ VERIFICADO, Y ES LO MÁS IMPORTANTE

**Nada de esto se escuchó.** Se verificó que las capas existen, que los
volúmenes cambian cuando tienen que cambiar, que la cadencia sigue a la
velocidad y que no se filtra ni una capa entre escenas. Pero **si suena a lluvia
sobre una chapa, o a un trueno, o a cascos, es completamente desconocido.**

Es distinto de todo lo anterior del proyecto: un cambio visual se puede mirar
con `foto.ps1`, pero acá no hay equivalente. Los números de `CONFIG.ambiente` y
`CONFIG.tormenta` están elegidos por razonamiento, no por oído, y **la regla
al corregirlos casi seguro es para abajo**: un fondo que se nota deja de ser un
fondo.

### VERIFICADO POR CONSOLA

- **Las tres capas de la tormenta cambian al cruzar**, y sólo al cruzar: tres
  llamadas de volumen por transición, no sesenta por segundo. Probado entrando y
  saliendo entre vagón con techo, enganche, vagón de ganado y techo.
- **Un tren despejado no crea ni una capa de lluvia ni suena un trueno** en 145 s.
- **10 truenos en un asalto de 145 s** (6 lejos, 4 cerca), dentro de lo esperado.
- **Cascos: 3,7 / 2,3 / 1,3 por segundo** (galope / trote / aflojando).
- **Contando las fuentes de audio vivas**: campamento de noche 2 (desierto +
  fuego), asalto despejado 1 (el traqueteo del tren, que **sobrevivió al
  refactor**), asalto con tormenta 4, mapa 1. Sin filtraciones.
- **El ciclo completo del juego** —campamento, pueblo, mapa, galope, asalto y
  vuelta— de día y de noche, con y sin tormenta: **sin un error de consola**.

---

## ✅ HECHA · El viento respira y el caballo galopa como un cuadrúpedo

Los dos primeros arreglos de sonido salidos de **escucharlo**, que es lo que
faltaba en la entrada anterior. Los dos diagnósticos de Santi fueron exactos y
los dos apuntaban al mismo error de fondo: **sonido regular = sonido de
máquina**.

### 1. El viento sonaba a disco rayado

*(Santi: "el 'viento' no debería estar como sonido permanente y además no parece
sonido de viento, sino como que fuera un disco rayado")*

Y es literalmente lo que era: **ruido blanco filtrado a volumen constante**. Lo
que hace que el oído lea "aire moviéndose" no es el filtro — es que VARÍE. Un
nivel fijo se lee como estática o como vinilo rayado, que es exactamente la
palabra que usó.

El arreglo (`soplar`, engine/audio.js):

- **Dos osciladores lentos con períodos que no encajan** (6,5 s y 10,5 s). Con
  uno solo el viento sube y baja como un metrónomo y se oye el bucle; con dos
  que nunca coinciden, la suma no se repite de forma audible. Es el mismo truco
  que el juego ya usaba para el latido de la fogata (`sin(scroll*7) +
  sin(scroll*13)` en campScene), sólo que en el grafo de audio.
- **Sopla también sobre el FILTRO, no sólo sobre el volumen.** Una ráfaga real
  no es "lo mismo más fuerte": además se abre, se vuelve más aguda. Modular las
  dos cosas juntas es lo que separa una ráfaga de una perilla de volumen.
- **Y con `profundidad` en 0,85 el fondo casi desaparece entre ráfagas**, que
  resuelve la otra mitad del pedido: el viento deja de ser permanente sin que
  nadie lo apague. Con 0 vuelve a ser el disco rayado.

Va en todas las capas de viento (el desierto del campamento y del mapa, la calle
del pueblo, el viento del galope y el de la tormenta). **No** en el traqueteo del
tren ni en la chapa bajo la lluvia: ésos son constantes por naturaleza, y
hacerlos respirar sonaría mal al revés.

### 2. El caballo sonaba a máquina de coser

*(Santi: "los cascos del caballo galopan muy rápido. Hoy es más un
'tuc-tuc-tuc-tuc-tuc' rápido, y debería ser un 'tucutún-tucutún' más pausado y
acorde a un cuadrúpedo")*

El error era conceptual, no de número: **la unidad no es el casco, es la
ZANCADA**. Un animal de cuatro patas no pisa a intervalos iguales — pisa en
GRUPOS y después hay un silencio, que es el momento en que las cuatro patas
están en el aire. Golpes parejos suenan a máquina por más que se les baje la
velocidad.

Ahora `zancada()` toca **tres pisadas apretadas** (0 / 85 / 175 ms) y el silencio
lo pone el intervalo hasta la próxima. **La tercera va acentuada** —más grave y
más fuerte—: es la que hace el "TÚN" y la que convierte tres ruiditos en un ritmo
con forma. Sin ella se oyen tres golpes iguales y vuelve a sonar a máquina, sólo
que de a tres.

Y lo que se estira al aflojar **es el silencio entre zancadas, no la zancada**:
las tres pisadas de adentro van siempre igual de juntas, porque eso es el ANDAR
del animal y no su velocidad. Un caballo más lento no pisa en cámara lenta — da
menos zancadas.

> **El total de pisadas quedó igual que antes** (3,6 por segundo a galope contra
> 3,7 de la versión vieja). No se bajó la cantidad: se la agrupó. Lo que cambia
> no es cuánto suena sino qué FORMA tiene, y eso solo es lo que lo convierte en
> un animal.

### VERIFICADO POR CONSOLA

- **Zancadas: 1,2 por segundo galopando, 0,8 al trote, 0,4 aflojando** (o sea
  3,6 / 2,4 / 1,2 pisadas).
- **Los LFOs del soplido existen y tienen los períodos correctos** (6,5 y 10,5 s,
  que no coinciden).
- **No se filtra ni un oscilador**: tres vueltas completas al ciclo del juego
  (campamento → mapa → galope → asalto → pueblo → campamento), de día y de
  noche, con y sin tormenta, y la cuenta de LFOs vivos sube y baja bien —
  siempre 2, salvo el galope con tormenta que tiene 4 (dos capas de viento) y el
  asalto despejado que tiene 0 (ni el traqueteo ni la chapa respiran). Sin
  errores de consola.

**Sigue sin escucharse desde acá** — estos dos arreglos salieron de que Santi lo
jugara, no de una medición. Es el camino que va a seguir teniendo el sonido.

---

## 🐛 ARREGLADA · La tormenta iba para el lado contrario

*(Santi: "la tormenta debería hacer lo contrario. Debería hacer que los guardias
oigan menos al jugador")*

`hearMult` era **1,4** — con tormenta te oían un 40% MÁS LEJOS. Y es al revés de
lo que pasa afuera de la pantalla: **la lluvia y los truenos tapan el ruido**.

**Nunca se escribió por qué iba en esa dirección.** Se puso en la Fase 1 junto
con la arquitectura de modificadores, y la única entrada posterior de estas notas
("Tormenta no hacía nada") arregló **la cañería** —el multiplicador no se estaba
aplicando en ningún lado— no la dirección. O sea que se verificó con cuidado que
un número estuviera llegando bien, sin preguntarse si el número estaba bien.

### Lo que cambia no es un número, es lo que la tormenta SIGNIFICA

Antes: *"este tren es más difícil"*. Ahora: *"en este tren se entra callado"*.

Y como **el clima se ve en el mapa antes de elegir la vía**, eso la saca de ser
una lotería que sufrís y la convierte en una decisión: esperar el tren con lluvia
para hacer el trabajo limpio. Es la primera vez que el clima es información
sobre la que se actúa y no un modificador que te toca.

De paso queda atada a lo que se construyó en la sesión anterior: **la tormenta
ahora se oye, y lo que oís es justamente lo que te está tapando.**

### El número, y lo que NO toca

0,55, elegido sobre una tabla de tres (0,85 / 0,7 / 0,55). Con `hearRadius` 230
y `hearStepRadius` 58 queda en 127 y 32 px.

| | Despejado | Tormenta |
|---|---|---|
| Disparo | 230 px (14,4 baldosas) | **127 px (7,9)** |
| Pisadas | 58 px (3,6) | **32 px (2,0)** |

**No toca a cuántos VAGONES despierta un disparo** — eso es `noiseWagons` (del
arma) y `ruidoExtra` (del tipo de tren), aparte. Un tiro en una tormenta sigue
despertando lo mismo. Es lo que mantiene el modificador acotado: **te ayuda a
moverte, no a tirotear.**

### VERIFICADO POR CONSOLA

Interceptando el evento de ruido de un disparo REAL: `radius` 127 con tormenta
contra 230 despejado. Y con un guardia quieto y de espaldas, midiendo cuánta
sospecha acumula en 4 segundos de caminata:

| Distancia | Despejado | Tormenta |
|---|---|---|
| 20 px (pegado) | 2,829 | **0,198** — catorce veces menos |
| 30 px | 0,144 | **0** |
| 45 px | 0,019 | **0** |

O sea que a dos baldosas y media ya no te oye nada. **0,55 tapa fuerte de
verdad**, que era lo que decía la opción elegida.

---

## ✅ HECHA · Hay música, y justamente por eso no hay un tema

*(Santi: "me gustaría que añadieras una pequeña armónica y una guitarra de
fondo")*, y en el mismo mensaje: *"el sonido de los cascos del caballo quedaron
muy bajos en volumen"*.

### Los cascos: el criterio estaba mal, no el número

Se habían elegido con la regla que gobierna todo el ambiente de este juego —
*"un fondo que se nota deja de ser un fondo"*— y **para los cascos esa regla
estaba equivocada: no son un fondo, son el personaje.** Son lo único que te dice
cómo está corriendo el animal que llevás abajo.

Subieron ×2,6, y el volumen salió a una perilla propia
(`CONFIG.ambiente.zancadaVolumen`) que mueve las tres pisadas a la vez: lo que
hay que poder ajustar es cuánto se oye el caballo, no el equilibrio interno de la
zancada — el acento de la tercera es lo que le da la forma de "tucu-TÚN".

### La música: frases, no un bucle

**Es la decisión que sostiene todo lo demás.** Un tema de ocho compases
repitiéndose es insoportable a los cinco minutos, y este juego se juega mirando
la misma pantalla un buen rato (el campamento, el pueblo). Así que no hay tema:
hay **frases sueltas separadas por silencios**, sorteadas cada vez. No se repite
porque no hay nada que repetir.

- La **guitarra** pone una nota grave cada 5-11 s — el suelo.
- La **armónica** pasa por arriba con frases de 2 a 4 notas cada 14-32 s.
- **No tocan juntas a propósito.** Si sonaran a la vez y al mismo ritmo serían
  una canción, y una canción compite con el juego. Así son dos cosas que pasan
  en el mismo lugar.

**LA ESCALA ES PENTATÓNICA MENOR**, y no sólo por el color (es la de la armónica
de blues, la que el oído asocia con desierto). Tiene una propiedad práctica que
acá vale más: **no tiene notas que suenen mal juntas**, así que se pueden sortear
al azar sin que salga nunca una frase fea. Una escala mayor completa habría
necesitado reglas de armonía.

Y las frases **caminan** por la escala en vez de saltar al azar: notas
independientes suenan a alguien probando un instrumento, moverse de a uno o dos
escalones suena a melodía. La última nota dura el doble — una frase que termina
cortada se oye como un error; una que se apoya al final, como una frase.

**Los instrumentos son la FORMA de la nota, no la onda.** La armónica son tres
osciladores apenas desafinados (una armónica tiene varias lengüetas y nunca están
perfectamente afinadas; ese batido es lo que el oído reconoce) con ataque lento,
porque es un instrumento de aire. La guitarra es ataque instantáneo, caída larga
y **el filtro cerrándose mientras cae** — una cuerda pierde los agudos antes que
los graves, y sin eso suena a órgano apagándose.

### DÓNDE SUENA, Y DÓNDE NO

**Sólo campamento y pueblo.** En el asalto y en el galope no hay música a
propósito: ahí el sonido es INFORMACIÓN —las pisadas, el radio del oído, la
lluvia que te dice si estás expuesto— y una melodía encima taparía justo lo que
hay que oír. No es una limitación, es la misma regla de siempre.

### UNA LECCIÓN DE MEDICIÓN QUE COSTÓ TRES INTENTOS

Medir "¿cuántas notas suenan acá?" contando osciladores **no funciona**, y el
motivo es una trampa fina: `tone()` programa la frecuencia con
`setValueAtTime` para un instante futuro, así que **al arrancar el oscilador
`frequency.value` todavía lee 440**, el valor por defecto. Y 440 es La, o sea una
nota de la escala. Resultado: cada disparo de un jinete contaba como nota de
armónica, y el galope parecía tener música.

Filtrar el 440 tampoco alcanzó (`293,66 × 1,5 = 440,5` volvía a atraparlo). Lo
que resolvió la pregunta fue **mirar la estructura en vez del sonido**:
`updateMusica` se llama desde exactamente dos lugares (`campScene.js` y
`townScene.js`) y de ningún otro, así que en las demás escenas no puede generarse
una sola nota. La verificación correcta no siempre es la más parecida a lo que
querés saber.

### VERIFICADO POR CONSOLA

- **90 s de campamento: 9 notas de guitarra y 17 de armónica**, todas de la
  escala (se listaron las frecuencias y ninguna quedó fuera).
- **`updateMusica` se llama desde dos lugares y sólo dos** — verificado por
  búsqueda en todo el proyecto.
- El ciclo completo del juego, de día y de noche, con y sin tormenta: **sin un
  error de consola**.

**Y sigue sin escucharse desde acá.** Las perillas están en `CONFIG.ambiente`
(`armonicaCada`, `armonicaVariacion`, `guitarraCada`, y los dos volúmenes). Si
algo molesta, **lo primero a probar es ALARGAR los silencios, no bajar el
volumen**: los silencios son el instrumento más importante de los dos.

---

## 🐛 ARREGLADA · La música eran sonidos aislados, y la guitarra no era criolla

*(Santi, escuchándolo: "no parece música, sino sonidos aislados. Además, recuerda
que la guitarra tiene que sonar más criolla. Y no olvides que es música de fondo,
es decir que no puede alterar al jugador")*

Los tres comentarios apuntaban al mismo lugar, y el primero es el que importa.

### Me pasé de mano evitando el bucle

La entrada anterior explica con orgullo por qué la música **no** es un bucle:
frases sueltas separadas por silencios largos. El razonamiento era correcto y la
ejecución se fue al otro extremo. **Sin nada que una una nota con la siguiente,
lo que queda son ruiditos**, por afinados que estén.

Medido en la primera versión: 26 notas en 90 segundos, con huecos de más de diez
segundos. Eso no es música espaciada — es silencio con interrupciones.

**Lo que convierte sonidos aislados en música es la CONTINUIDAD.** Así que la
guitarra dejó de ser un evento cada tantos segundos y pasó a ser lo que una
criolla de fondo es de verdad: **un arpegio que no para**, sobre cuatro acordes
(Am, F, G, Am) que dan la vuelta cada ~14 s. La armónica sigue entrando de a
ratos, pero ahora tiene sobre qué apoyarse.

| | Antes | Ahora |
|---|---|---|
| Notas en 90 s | 26 | **195** |
| Hueco promedio | varios segundos | **0,46 s** |
| Hueco más largo | más de 10 s | **1,73 s** |
| Huecos de más de 3 s | muchos | **0** |

**Y el bucle deja de ser un problema cuando el que se repite es el
ACOMPAÑAMIENTO.** Nadie se cansa de un punteo suave; de lo que uno se cansa es de
una melodía repetida — y la melodía, que es la armónica, sigue sin repetirse
nunca. El razonamiento original no estaba mal: estaba aplicado al instrumento
equivocado.

### La guitarra criolla son tres cosas concretas

La primera versión era una cuerda de **acero**: ataque de 6 ms y mucha sierra en
la mezcla, o sea brillante y con filo. Una criolla es nailon:

1. **Ataque más blando** (18 ms contra 6). El nailon tarda más en arrancar que el
   acero, y ese retardo chico es la mitad de por qué una criolla suena "dulce".
2. **Menos armónicos agudos**: ahora manda el triángulo y la sierra quedó de
   acompañamiento.
3. **El filtro abre mucho menos** (×3,2 contra ×6) y se cierra más rápido: la
   nota se redondea enseguida en vez de quedar sonando brillante.

### "No puede alterar al jugador" mandó sobre el resto

De esa frase salen tres decisiones que parecen tímidas y no lo son:

- **La guitarra suena MENOS que antes** (0,055 → 0,034) aunque ahora toque todo
  el tiempo. Lo que decide cuánto molesta un fondo no es el volumen de cada nota
  sino cuánto ocupa en total.
- **Ninguna nota entra de golpe**, ni la criolla ni la armónica.
- **Las frases de armónica ya no terminan en un acento**: la última nota dura
  más, pero no suena más fuerte. Una frase que termina en un golpe te hace
  levantar la vista, que es exactamente lo que un fondo no puede hacer.

### Y un bug propio: el acorde se adelantaba una nota

`acordeActual` avanzaba **antes** de calcular la frecuencia, así que la última
púa de cada patrón ya sonaba con el acorde siguiente. Medido: a los 3,4 s
aparecía un Fa en medio del La menor. Musicalmente no quedaba mal —una
anticipación es un recurso real— pero era un accidente del orden de dos líneas,
no una decisión, y las notas que salen de un accidente se convierten en deuda.

### VERIFICADO POR CONSOLA

- **195 notas en 90 s, hueco promedio 0,46 s, el más largo 1,73 s, y ninguno
  mayor a 3 s.** La música no se corta nunca.
- **Cero notas fuera de los acordes** (66 notas de guitarra revisadas una por
  una contra las cuatro posiciones).
- **La progresión avanza limpia en el borde del patrón**: Am hasta 3,4 s, F hasta
  6,9, G después. Sin notas cruzadas.
- El ciclo completo del juego, de día y de noche: **sin un error de consola**.

---

## ✅ HECHA · Se acabó el "rápido / lento / punto medio": dos trenes que se distinguen por su contenido

*(Santi: "quiero hacer algo que tal vez sea catastrófico [...] que a partir de
ahora no haya más tren veloz, sino tren de pasajeros (el estándar) y el de carga
[...] Ya no sería este es el rápido, este el lento y este el punto medio, sino
que su contenido sería diferente. ¿Qué piensas honestamente?")*

### Por qué el eje viejo estaba mal

Los tres tipos se distinguían por **la velocidad**: veloz 90 s, estándar 145 s,
carga 165 s. Eso es un eje de DIFICULTAD disfrazado de variedad — un tren que se
distingue por su reloj es el mismo tren con otro cronómetro. La prueba está en
el historial del propio veloz: **tres vueltas de calibración discutiendo un solo
número** (100 → 70 → 90).

Y había un problema más grande, y medible: **`modificadores: true` lo tenía sólo
el estándar**. O sea que el clima, la redada, la puerta trabada, los
comportamientos por vagón, los paquetes y la caja oculta —el plan entero de
"variedad de lo que pasa en los trenes", meses de trabajo— **le pasaba a la
mitad de los trenes y a la otra mitad no**.

### Lo que se cambió del plan de Santi antes de construirlo

El plan decía *"ambos tendrían los mismos sistemas"*. Eso sí habría sido
catastrófico: dos trenes con las mismas mecánicas no son dos trenes, son uno con
distinto empapelado. Él lo intuía al escribir *"pero más separados entre
mecánicas"*; se convirtió en regla dura:

> **Una mecánica, una sola casa.** Si aparece en los dos, no distingue nada.

| | **Pasajeros** · la gente te delata | **Carga** · el tren te ataca a vos |
|---|---|---|
| Mecánicas | paquete, caja oculta, testigos, encubierto, Cazarrecompensas, Sheriff | rodantes, traqueteo, estampida, vagón de armas + pólvora, el botín que pesa |
| Capa de variedad | clima, estado, comportamientos, tipos de guardia | **lo mismo** |

**Los rodantes y el traqueteo se mudaron al de carga por la ficción, no por
conveniencia**: un barril que se suelta en el pasillo ES carga suelta. Nunca
pertenecieron a "el tren rápido".

Y apareció sola una lectura que nadie buscó: en el tren del sigilo, un rodante
no es un peligro de combate —no saca vida— pero **el porrazo se oye**
(`CONFIG.rodante.ruidoGolpe`). En el de carga, la carga suelta es lo que te
delata. Encaja con `pesaElBotin` en vez de pelearse con él.

### Las tres cosas acopladas que se marcaron ANTES de construir

Lo natural, con el vagón de armas mudado, era mandar el ganado también. Eso
rompía tres cosas que no se ven de entrada — y por eso Santi eligió la opción
que las conserva (el ganado se queda en el de pasajeros):

1. **Es el único vagón sin techo del tren.** Es el que hace que la tormenta
   suene distinto (la chapa se apaga, suben agua y viento) y el peor lugar para
   que te agarren los jinetes. Sin él, el tren de pasajeros se quedaba sin un
   solo momento de "estás expuesto" que no fuera un enganche — y la tormenta
   sonora se había construido la sesión anterior, sin jugarse todavía.
2. **Es el escondite "junto al corral"** de la caja fuerte oculta, uno de cinco.
3. **Es su vagón de paso** (un guardia, una bolsa). Sin él, seis vagones todos
   caros de cruzar, sin ritmo.

### Y una cuarta que apareció construyendo: la pólvora se quedaba sin dónde

`cajonesExtra` —la pólvora repartida por el tren cuando hay vagón de armas— vive
en tres plantillas: comedor, correo y blindado. **El tren de carga sólo lleva
comedor y blindado**, así que el sistema se le caía a dos vagones de ocho: "un
tren distinto de punta a punta" habría pasado a ser "un tren con pólvora en dos
lugares". Se le agregaron a `correo_liviano`, que además es donde más sentido
tiene (un furgón de correo liviano es carga estibada).

### Qué se perdió, dicho claro

**El reloj de 90 s.** Es lo único real que se va con el veloz: "¿un vagón más o
me bajo?" a 90 s es una pregunta distinta que a 145. El tren quedó **en reserva
con `peso: 0`** (llave, no amputación — igual que Alta vigilancia y el
Pistolero) y sus seis vagones cortos siguen escritos en `data/wagons.js`. Si
alguna vez se lo quiere de vuelta, el lugar correcto ya no es un tipo de tren
sino **un estado más** ("tren expreso"), que se le puede tocar a cualquiera de
los dos.

### El riesgo que queda vivo

**El de carga pasó del 20% al 50% del sorteo**: es el tren MENOS jugado de los
dos y ahora es la mitad de los asaltos, cargando cinco sistemas a la vez. Es lo
que hay que mirar jugando. La perilla para bajarle el ruido sin desarmar nada es
subir `rodantesCada` y después `traqueteoCada`; la perilla para que aparezca
menos es su `peso`.

### VERIFICADO POR CONSOLA

- **120.000 trenes sorteados**: 50/50 exacto entre los dos tipos, el veloz nunca
  sale. **El vagón de armas aparece en el 12,5% de TODOS los asaltos** — el
  mismo número que antes de la reestructuración, sin haber tocado su `chance`
  (0,25 sobre un tren que pasó de ser el 50% a ser el 50%).
- **Las reglas de posición del vagón de armas sobreviven a los ocho vagones**:
  en 20.000 trenes, **nunca** primero (0), **nunca** último (0), **nunca** pegado
  al blindado (0), y el blindado cae adelante el **24,1%** de las veces (contra
  el 25% de diseño).
- **La ronda del Dinamitero sigue sana**, que era lo que más riesgo corría al
  mudarlo a un tren de vagones más cortos: medido sobre 8 composiciones reales,
  45 s cada una → **ronda de 934 px y 40% del tiempo adentro del vagón**. El
  diseño pide ~1050 px y 41%; los casos rotos que motivaron las reglas daban
  640-704 px y 55%. "Esperá a que salga" sigue existiendo.
- **Las mecánicas quedaron donde tienen que estar**: 120 s simulados de cada
  tren. Carga → 16 rodantes y 4 sacudones, reloj 165 s. Pasajeros → **0 y 0**,
  reloj 145 s.
- **La pólvora subió un 35%**: el estándar con armas traía 8,5 barriles y 2,7
  cartuchos; el de carga con armas trae **11,5 barriles y 3,9 cartuchos** (300
  trenes de cada uno). El tope del jugador son 3, así que por primera vez
  recorrer el tren entero deja un cartucho sin poder llevarse. Sin decidir.
- **Cero errores de consola** en 90 s de asalto simulado de cada tipo.

### Y la lección de arnés de esta sesión, que costó cuatro mediciones falsas

Las tres primeras mediciones de rodantes y traqueteo dieron **0 y 0** en los dos
trenes, y las tres veces el código estaba bien:

1. El parámetro de escena se llama `tipoTren`, no `tipoTrenId`. Con el nombre
   mal, el asalto salía con el tipo por defecto — y lo delató `raidDuration: 145`
   en un tren de carga.
2. `soltarRodante` exige estar **dentro de un vagón**, y el jugador siempre
   arranca en un enganche. Plantado ahí, no aparece un solo barril: correcto.
3. Y la peor: **el panel del navegador estaba oculto, así que
   `requestAnimationFrame` no corría y el mundo estaba congelado.** 35 segundos
   de "medición" sobre un juego que no avanzó un cuadro. Se detectó con
   `document.hidden` y comparando la posición de los guardias contra sí misma.

La solución fue dejar de depender del bucle: **`FORAJIDO.services.scenes.update(1/60)`
llamado a mano**, en pasos fijos, adentro de una sola llamada de consola. Es más
rápido que el tiempo real, es determinista, y no depende de que la ventana esté
visible. **Para medir comportamiento del asalto, ése es el instrumento.**

---

## 🐛 ARREGLADA · Un guardia chocaba un barril de pólvora y se quedaba ahí para siempre

*(Santi, jugando: "creo que los guardias no ven a los barriles (de pólvora) como
un obstáculo, porque vi uno caminando, chocó contra el barril y se quedó chocado
contra el barril y no se volvió a mover")*

### La causa: dos sistemas que no se hablan

Un cajón de pólvora **frena el paso** (`isSolidForMovementAt`, scenes/raidScene.js)
pero **no es un tile**. Y `map.isSolidTile` —lo único que miran el buscador de
rutas y la ronda— no lo ve. El guardia camina hacia un punto que para él está
libre, se choca, y `moveAxisAligned` **nunca devuelve `arrived`**: el `pathIndex`
no avanza nunca más.

Lo que lo volvía permanente es que **el destrabe ya existía y estaba gateado**:

```js
if (!e.rondaLarga) return;   // o sea: sólo el Dinamitero
```

Se había escrito para él porque su ronda cruza puertas. Ningún otro guardia tenía
red. (El que va a investigar sí la tenía —`stuckTimer` en `doInvestigate`—, así
que el agujero era exactamente un estado: `patrol`.)

### Lo que costó encontrarlo, y la lección

**Sorteando no salía.** Cinco corridas de 90 a 150 segundos, con la alarma
sonando y con un piloto de prueba moviéndose por un recorrido fijo para que los
guardias lo persiguieran: **cero casos**. Dos veces el detector marcó al
*centinela del blindado*, que está quieto a propósito, y una tercera al
Dinamitero, que ya tenía el destrabe — tres falsos positivos seguidos, todos del
arnés.

Apareció **cruzando estáticamente cada ronda contra cada posición de cajón**, sin
simular nada:

| Vagón | Tramo | Cajón | |
|---|---|---|---|
| correo | `6,3 → 16,3` | `13,3` | le cruza el camino |
| correo | `6,6 → 6,3` | `6,6` | **encima del waypoint** |
| correo | `20,6 → 28,6` | `25,6` | le cruza el camino |

El del waypoint es el caso sin salida: a un punto tapado por un bulto sólido no
se puede "llegar" jamás, así que no hay nada que pueda destrabarlo.

> **La verificación correcta no siempre es la más parecida a lo que querés
> saber** — otra vez. Para un bug que depende de dónde están dibujadas las cosas,
> el instrumento no era jugar mil veces: era mirar los datos.

### El arreglo, en tres capas

1. **`systems/ai.js`** — el destrabe de `doPatrol` deja de ser del Dinamitero y
   pasa a ser de todos. **Y el avance se mide ahora en los dos ejes**: medir
   sólo X alcanzaba para una ronda horizontal, pero el tramo `6,6 → 6,3` del
   correo es vertical y con la medición vieja un guardia subiendo a paso firme
   habría contado como trabado.
2. **`world/train.js`** — `revisarRondas()`, hermano de `revisar()`: avisa por
   consola si un cajón cae sobre el recorrido de un guardia. Para que el próximo
   vagón que se escriba dé el error al armar el tren y no meses después jugando.
3. **`data/wagons.js`** — las tres posiciones del correo se mueven a las columnas
   que ninguna ronda pisa.

### VERIFICADO POR CONSOLA

- **Antes y después con el mismo test**, usando el **sitio publicado como
  control del código viejo** (que es una forma barata de tener un "antes" real
  en vez de recordado):

| | Publicado (viejo) | Local (arreglado) |
|---|---|---|
| Peor congelado | **28,6 s** | **2,3-4,0 s** |
| Cambios de waypoint en 40 s | **0** | 2 |
| Píxeles recorridos | 274 | **838-911** |

- El validador nuevo **salta con el mensaje correcto** cuando se le devuelve a
  mano la posición mala, y se queda callado con las plantillas de hoy.
- Cero choques en las plantillas, y ciclo completo de nueve escenas sin un error
  ni un aviso.

---

## ✅ HECHA · El vagón almacén, y por qué viaja siempre

*(Santi: "agregaría el vagón 'almacén' para el tren de carga [...] (lugar fijo)")*

Es la primera pieza del rediseño económico: **en el de pasajeros robás dinero y
en el de carga objetos que después vendés**. El almacén es de dónde salen.

**No se sortea, y ahí está la diferencia con el vagón de armas.** El de armas es
una sorpresa que te cambia el plan del día, y por eso es uno de cada cuatro.
Éste es *la razón por la que subís a un tren de carga*: algo que decide la
identidad económica de un tren no puede aparecer una de cada cuatro veces.

| | |
|---|---|
| **Dos cajas fuertes** | El resto del tren reparte en bolsas; acá se concentra otra vez, a propósito |
| **Estanterías de cuatro columnas** | Más gruesas que las del correo: pasillos más angostos, se pelea peor |
| **Sin pasajeros** | Como todo el tren — y es lo que obliga a que la pista de la caja oculta acá sea otra cosa |
| **Nunca el primer vagón** | Misma regla que el de armas: lo más caro no puede quedar a un paso de la salida |

Mide **lo mismo (32 columnas) que el correo liviano al que reemplaza**, así que
el tren no cambia de largo ni su reloj de 165 s.

**Sus dos rondas son rectas a propósito**, y eso salió del bug de arriba: las
columnas que no pisan (1-4 y 27-30) son las que quedan libres para la pólvora, y
con rondas en L eso es mucho más difícil de garantizar. La lección del vagón de
correo, aplicada al escribir en vez de descubierta jugando.

### Y el color se decidió MIRANDO, no razonando

El comentario que escribí antes de verlo decía que tenía que parecerse al correo
y no saltar a la vista. **Mirando las dos pantallas una al lado de la otra, salta
a la vista — y se dejó así**, por algo que ninguna medición daba: **las
estanterías del correo casi se funden con el piso**, así que un almacén igual de
apagado habría sido un segundo vagón ilegible en vez de uno reconocible.

### VERIFICADO POR CONSOLA

- **5.000 composiciones**: el almacén viaja en **todas**, **nunca** es el primero,
  y cae repartido entre las posiciones 2 y 8. El tren sigue midiendo 8 vagones,
  el vagón de armas sigue en 24,3% y nunca pegado al blindado.
- El layout cumple las reglas del tren: 10 filas de 32 columnas, con `+` en las
  puntas de las filas 4 y 5.
- **20 trenes armados de verdad**: 4 traen pólvora en el almacén (el ~25% que
  corresponde), y el validador de rondas no dice nada.
- Un asalto de 60 s parado adentro: sin errores, con sus dos cajas fuertes.

---

## ✅ HECHA · El almacén, segunda vuelta: puertas trabadas, y se fue el vagón blindado

*(Santi, jugándolo: "hay un problema que encuentro con el almacén es que al haber
tan pocos guardias, casi que te regalan esas cajas fuertes. Yo haría lo
siguiente: eliminar el vagón blindado del tren de carga y que las dos puertas del
almacén no sean blindadas, pero que estén cerradas")*

### Lo que se le marcó antes de construirlo

Su arreglo tenía un costado que iba **en contra de su propio diagnóstico**, y se
midió antes de tocar nada:

| | Guardias | De ésos duros | Cajas | Botín | Largo |
|---|---|---|---|---|---|
| Con blindado | 12 | 4 | 4 | $2.846 | 4.224 px |
| Sacándolo, sin más | **8** | **0** | 2 | $2.083 | 3.696 px |

Sacar el blindado le saca **un tercio de los guardias del tren y los cuatro
duros**, y lo acorta 528 px — con un reloj de 165 s calibrado para ocho vagones.
O sea que por sí solo dejaba el tren todavía más vacío que el que motivó el
pedido.

Se construyó con dos compensaciones: **un tercer correo liviano** en el lugar del
blindado (el largo vuelve a 4.256 px, treinta de diferencia) y **el almacén pasa
de 2 a 4 guardias**, que devuelve el total a 11,6 y —esto es lo importante— los
pone justo donde estaba el problema.

### La puerta trabada cambia la MONEDA, no la cantidad

Es lo que hace que la idea de Santi funcione: el precio de las dos cajas dejó de
ser *matar a los guardias que las cuidan* y pasó a ser el precio de siempre del
juego, **tiempo y exposición**. Es madera, no chapa: tres balazos la abren, y esos
tres balazos se oyen. Acá no se entra callado.

Y le devuelve un uso a la dinamita en un tren que se quedó sin vagón blindado:
volar la puerta es instantáneo y carísimo en ruido; los tiros son baratos pero
tardan y suenan varias veces.

### La falsa alarma que me comí, y cómo se cayó

Al medirlo me convencí de que **un vagón cerrado partía el tren en dos**: con el
almacén en el medio y la alarma sonando 90 s, *0 de 4* guardias del otro lado lo
cruzaron. Llegué a construir una "llave de tripulación" para arreglarlo.

Las dos mitades del razonamiento estaban mal:

1. **Los guardias de adelante no te vienen a buscar desde que existe la alarma.**
   Está escrito en el README hace meses. El test medía una conducta de diseño y
   yo la leí como un síntoma.
2. **Y los refuerzos tampoco se frenan.** Con un control —el mismo tren con el
   almacén abierto— el refuerzo más cercano llegó a **2.353 px** del jugador;
   trabado, a **2.423**. Setenta píxeles en 200 segundos: ninguna diferencia. Que
   no lleguen es una propiedad vieja del juego (nacen en la locomotora, a ~2.900
   px), no algo que cause esta puerta.

La llave se borró. **Sellado es además mejor para lo que el vagón tiene que
ser**: romper la puerta te deja de una con los cuatro guardias adentro,
esperándote, y nadie viene a reforzarlos.

> La lección es la de siempre puesta al revés: un control barato (el mismo tren
> con la puerta abierta) tiró abajo en una medición una conclusión que yo ya había
> empezado a codificar. **Si no hay control, no hay medición: hay una anécdota.**

### VERIFICADO POR CONSOLA

- **60 trenes**: 11,6 guardias, 2 cajas fuertes, **exactamente 2 puertas trabadas
  y 0 blindadas** por tren, 4.256 px de largo.
- **Los cuatro encerrados se portan bien**: 120 s con la alarma sonando, el peor
  congelado es de **0,9 s** (la pausa normal al llegar a un punto de ronda) y los
  cuatro siguen adentro. Nada de vibrar contra la puerta — el destrabe que se
  arregló hoy mismo haciendo su trabajo.
- **Se entra rompiéndola**: vida 3 → 2 → 1 → rota, y ahí deja de frenar el paso.
  Trabada sigue figurando como trabada; lo que cambia es que ya no hay puerta.
- Ciclo completo de nueve escenas: cero errores y cero avisos.

---

## ✅ HECHA · Los guardias del almacén son blindados (y un atajo viejo que se rompió con eso)

*(Santi: "agregá que los guardias del vagón almacén sean de los guardias
blindados")*

Con el vagón blindado fuera del tren de carga, los cuatro guardias duros no se
perdieron: **se mudaron al almacén**. El tren sigue teniendo exactamente cuatro,
sólo que ahora están todos juntos cuidando la única cosa que vale la pena, en vez
de repartidos en un vagón al que se entraba con dinamita.

### El tipo de guardia arrastraba cuatro cosas, y tres caían bien

| | |
|---|---|
| Aguantan un tiro más (3, o 4 escoltado) y se les ve la placa | Lo que se pedía |
| **No abandonan el vagón nunca** (`confinado`) | Ya estaban sellados por las puertas trabadas: no cambia nada y de paso lo garantiza |
| **La estampida se frena en su puerta** | Correcto: está cerrada |
| **Una redada no los duplica** | La guarnición de la caja es la que es |

Y NO arrastra la dinamita: ésa se la da la plantilla del vagón blindado guardia
por guardia (`dynamite: 1`), no el tipo.

### 🐛 Pero rompía la ronda del Dinamitero, por un atajo de hace meses

`rondaDinamitero` preguntaba **por el tipo de guardia** para saber si podía
entrar a un vecino:

```js
const abierto = (t) => !!t && t.plantilla.guardType !== 'blindado';
```

Era un atajo para decir "vagón cerrado", y funcionó mientras *guardias blindados*
y *puertas de chapa* fueran la misma cosa. El almacén rompe esa coincidencia:
lleva guardias blindados y puertas de **madera**, en las que el Dinamitero entra
perfectamente porque tiene la llave del tren. Con el atajo, el almacén contaba
como muro, le acortaba la vuelta y volvía a romper el "esperá a que salga" —
exactamente el bug que ya se había arreglado una vez.

Ahora se pregunta por la propiedad de verdad, **`puertasBlindadas`**, una marca
de la plantilla que leen los dos únicos lugares a los que les importa: la
creación de las puertas y la ronda. Ya no se pueden desincronizar.

### Y al refactorizarlo apareció un bug dormido

Las puertas de chapa se decidían buscando el vagón **por id**:

```js
const blindadoWagon = wagons.find((w) => w.id === 'blindado');
```

O sea que **el blindado corto del tren veloz nunca tuvo puertas de chapa**: eran
de madera y se abrían empujando. En ese tren, al blindado se entraba caminando.
Nadie lo vio nunca porque el veloz quedó en reserva antes de que alguien probara
esa puerta. Con la marca en la plantilla, queda arreglado de paso.

### VERIFICADO POR CONSOLA

- **40 trenes de carga**: 11,7 guardias, **4 duros**, y los del almacén salen
  `blindado` con 3 de vida. Siguen siendo 2 puertas trabadas y 0 blindadas.
- **El tren de pasajeros no se movió**: 13 guardias, 4 duros y sus **2 puertas
  blindadas** — o sea que el refactor no le tocó nada.
- **La ronda del Dinamitero sigue sana**: 971 px y 38% del tiempo adentro sobre 6
  composiciones reales (antes del cambio: 934 y 40%; el diseño pide ~1050 y 41%;
  roto era 640-704 y 55%).
- **Y en el caso peor a propósito** —el vagón de armas pegado al almacén, que hoy
  el sorteo permite— la ronda da 923 px y 34%, y el Dinamitero pasa 1.519 cuadros
  **adentro del almacén**: la llave funciona y el vagón cerrado no lo frena.
- Ciclo completo de nueve escenas: cero errores y cero avisos.

---

## ✅ HECHA · El perista, y `honor` convertido en plata

*(Santi: "andá con la opción A. Pero además, estaría bueno que el honor tenga algo
que ver acá. Mientras más Honor (buena persona) sea el jugador, más dinero le va a
pagar el perista", con los escalones exactos)*

### El problema que resolvía la opción A

Al pasar el botín del tren de carga a mercadería, ese tren **perdió el bono de
trabajo limpio**: `cleanBonus` se calcula sobre `collected`, o sea sobre el
dinero, y ahí ya no entraba nada. Medido: un asalto de carga rendía ~$1.336
contra los ~$4.072 de antes (plata × el doble por salir limpio). Salir callado de
un tren de carga había dejado de valer absolutamente nada.

**La mercadería caliente es ese bono entrando por otra puerta.** Si en el asalto
sonó la alarma, el robo está denunciado y el cargamento quedó descrito en un
papel: el perista paga la mitad. Y usa **el mismo número** (`CONFIG.raid.cleanBonus`)
a propósito — no es un sistema nuevo con una perilla nueva. Si algún día se mueve
el bono del botín en plata, esto se mueve con él.

Se marca por ASALTO y no por objeto, aunque lo hayas agarrado antes del primer
tiro: no hay mitad de un cargamento que sea limpia.

### `honor`, por primera vez, cuesta plata

Hasta hoy `honor` movía **una sola cosa** (cada cuánto un guardia se rinde). Era
un número que existía desde la fase 1 y casi no hacía nada.

| `honor` | Ajuste |
|---|---|
| −15 a 15 | 0 |
| pasando ±15 | ±3% |
| pasando ±40 | ±8% |
| pasando ±60 | ±15% |
| pasando ±100 | ±20% |

**Por qué un perista —que es un delincuente— paga mejor al que es buena persona.**
Suena al revés y no lo es, si `honor` se lee como lo que de verdad mide: *qué tan
derecho sos*. Al que tiene fama de cumplir no lo estafan; al que todos desprecian
le ofrecen dos monedas porque sabe que no tiene a quién más venderle.

**Son escalones y no una recta, y eso es de Santi.** Una recta (`honor × 0,002`)
habría sido más simple y peor: no se siente. Con escalones hay un momento en que
**cruzás** algo y el precio cambia de verdad, y eso se puede perseguir.

Los cuatro son alcanzables, que es la condición para que existan: un asalto sin
matar a nadie da +15 y perdonar a un rendido +12, así que el primero se cruza en
un asalto y el último en cuatro o cinco. Para abajo va más rápido: rematar a un
rendido son −20 de una.

> ⚠️ **LO QUE QUEDA DESBALANCEADO, y se le marcó antes de construir:** con esto el
> honor bajo es **puro castigo**. Ya te costaba (menos rendiciones) y ahora además
> te cuesta plata, sin que ser temido te dé una sola cosa a cambio. Es un número
> de "portate bien" en vez de una decisión con dos lados. El lugar natural para
> equilibrarlo, si alguna vez se quiere, es **al COMPRAR**: al armero no le
> regateás igual si te tienen miedo.

### El local, y las dos cosas que dice su posición

Está en la **última puerta de la calle** (x=715 de 760), y las dos consecuencias
son a propósito:

1. **Cuesta el pueblo entero.** Llegás con el caballo en el x=60: vender es
   caminar la calle completa con la bolsa al hombro.
2. **Queda pegado a la oficina del sheriff**, y ésa es la mejor cosa que tiene. El
   que te compra lo robado trabaja a dos puertas de la ley y nadie dice nada.

**Abre siempre**, y es lo único que hay que saber del personaje: los otros
negocios tienen horario. Se nota la primera vez que llegás de noche y es la única
puerta que se abre.

**Y compra el lote entero de un gesto.** Hoy no existe ningún motivo para
quedarse con un objeto en vez de venderlo, así que una lista donde elegís cuáles
vender habría sido fricción sin ninguna decisión adentro. Un perista que te mira
la bolsa y te tira UN número es además mucho más de este mundo que una vidriera.

### 🐛 Y un límite del motor que apareció MIRÁNDOLO

El precio se dice desglosado (cuánto vale, cuánto suma que esté limpia, cuánto tu
nombre): unos 180 caracteres. **`decir()` dibujaba una sola línea centrada en una
pantalla de 384 px**, así que el mensaje se cortaba por los dos lados — y lo que
quedaba afuera era justo *"Te paga $3.973"*, el único número que importa.

Ninguna medición lo iba a mostrar: la venta funcionaba, la plata entraba bien, el
texto era correcto. Se vio en la primera captura. `decir()` ahora acepta varias
líneas y las apila hacia arriba desde el pie, así que la última que se lee es la
de abajo y todos los mensajes de una línea caen donde caían.

Lo mismo con el cartel de la calle: `[E] CASA DE EMPEÑOS` se salía del cuadro
porque este local está contra el borde derecho. Quedó `[E] EMPEÑOS`.

### VERIFICADO POR CONSOLA

- **La curva de honor, en los bordes exactos** que pidió Santi (es `>` y no `>=`,
  o sea que en 15 clavado todavía no hay bonificación): −120→−20%, −100→−15%,
  −60→−8%, −15→0, 15→0, 16→+3%, 41→+8%, 61→+15%, 101→+20%.
- **La venta, por la interacción real** (caminar hasta el mostrador y apretar E),
  con la cuenta cerrando en los tres casos: honor 0 → $2.228; honor 65 → $2.562
  (+15%); honor 120 → $2.674 (+20%). Y con mercadería caliente, $1.114 sin un
  peso de más.
- **Ciclo completo de catorce escenas, de día y de noche**, pasando por los cinco
  locales: cero errores y cero avisos. El perista abre en las dos.

### Y la trampa de arnés de esta vuelta

Llamar `scenes.update(1/60)` a mano —el instrumento que venía usando para todo—
**se saltea `input.endFrame()`**, que es lo que consume las teclas apretadas. Sin
eso, `wasPressed('KeyE')` queda latente y el juego lee la misma tecla en cada
cuadro: la primera medición vendió el lote **dos veces** (la segunda encontró la
bolsa vacía y el mensaje que quedó en pantalla era el de "venís con las manos
vacías"). El síntoma parecía un bug del perista y era del banco de pruebas.

> Si el paso se maneja a mano, hay que manejar **todo** el cuadro a mano.

---

## ✅ HECHA · La mochila es un Tetris, y el bulto te frena

*(Santi: "me parece mejor ahora esa idea que decías del tetris para la mochila
entrando con TAB")*

La primera versión contaba casillas: cada cosa valía de 1 a 4 y se sumaban. Se
construyó así porque yo lo había recomendado contra la grilla con formas — y
Santi eligió la grilla después de verlo. **Tenía razón, y la diferencia se puede
medir en una línea**:

> Con un número, tres atados de 3 y un cajón de 4 **siempre** entran en 16,
> porque 13 ≤ 16. Con formas, los tres atados dejan **siete casillas libres** y
> el cajón **no entra**, porque lo que queda son columnas sueltas de una casilla.

Eso es lo que un número no puede expresar: **puede sobrar lugar y no entrar.**

### Las formas salen de los tamaños que ya tenían

| Forma | Qué es |
|---|---|
| `[1,1]` | Una chuchería: un anillo, unos papeles, **un cartucho de dinamita** |
| `[2,1]` | Un estuche chato |
| `[3,1]` | Un atado largo |
| `[2,2]` | Un cajón |

Ningún objeto cambió de *cuánto* abulta — sólo de *cómo*. Y se pueden **acostar**:
un atado de `[3,1]` entra parado (`[1,3]`) si es lo único que cabe.

### Acomoda sola, y es una decisión de diseño

El jugador no arrastra nada: agarra un cajón y el cajón se guarda donde quepa
(primer hueco arriba-izquierda, probando la forma y después acostada). Hacerlo a
mano sería un minijuego de inventario en medio de un vagón con guardias, y **este
juego cobra en tiempo y exposición, no en administración**. Con `TAB` se ve el
resultado, no se edita.

Y el TAB **no pausa**. Mirar la mochila cuesta segundos como todo lo demás.

### La grilla vive en `engine/`

`engine/grilla.js` no sabe nada de western: recibe un ancho, un alto y
rectángulos. Es la misma regla que sostiene la arquitectura desde la fase 1
(`engine/` no importa nada de las carpetas de arriba), y significa que la próxima
cosa que necesite acomodar bultos no vuelve a escribir esto.

### 🐛 Dos cosas que sólo aparecieron mirando

1. **La mochila dibujada en la espalda era invisible.** Era `#5a4530` y el piso
   del vagón es `#6d4a30`: el mismo marrón. Puesta sobre el piso desaparecía —
   **la misma lección que las cartucheras invisibles de hace varias sesiones**, y
   otra vez sólo se vio poniendo cuatro muñecos uno al lado del otro. Ahora es
   casi negra, con la correa clara para no fundirse con el sombrero.
2. **El TAB dibujaba casillas sueltas y eso MENTÍA.** Un cajón eran cuatro
   cuadraditos en orden de lectura, que podían partirse al final de una fila y
   seguir en la siguiente: decía "ocupa cuatro" cuando la regla real es "ocupa un
   cuadrado de 2×2". Ahora cada bulto es un rectángulo y el hueco que queda se ve
   tal como es.

### Y la herramienta que faltaba: `FORAJIDO.loop`

**Media docena de capturas se perdieron** porque el bucle corre con
`requestAnimationFrame` y entre la llamada a la consola y la foto el mundo avanza
solo: se sacaba la foto y el asalto ya había terminado en la pantalla de
resultados. Se probó todo lo que no era lo correcto — un `requestAnimationFrame`
propio redibujando encima, leer la matriz del canvas después de `render` (inútil:
`render` hace `restore` al terminar), forzar la vida del jugador cada cuadro.

La respuesta era exponer el bucle. **`FORAJIDO.loop.stop()` congela el mundo**, se
pisa cuadro a cuadro a mano y la foto muestra exactamente lo que dejaste. Está en
el README, en la sección de depurar.

> Es la contracara de la lección vieja ("el bucle real corre en paralelo a tus
> mediciones, hacé todo en una sola llamada"): ahora se puede **apagar**, así que
> ya no hace falta.

### VERIFICADO POR CONSOLA

- **El caso que define el sistema**: tres atados de `[3,1]` en una grilla de 4×4
  → 9 casillas ocupadas, **7 libres**, y `buscarLugar([2,2])` devuelve **null**
  mientras `buscarLugar([1,1])` encuentra lugar.
- **Cuatro cajones de `[2,2]` llenan 16 exactas** y el quinto no entra.
- **La rotación pasa jugando, no en teoría**: en un asalto real el cuarto atado
  entró como **`1x3`** —parado— porque ya no quedaban tres casillas en fila.
- **La dinamita se sincroniza sola**: 2 cartuchos = 2 casillas; al encender con
  `Q` el contador baja a 1 y la casilla se libera al cuadro siguiente. No hace
  falta enganchar los dos lugares donde el contador cambia.
- **Con la mochila llena, un cajón de pólvora no da dinamita y no se gasta.**
- Ciclo de once escenas abriendo y cerrando la mochila en los asaltos: cero
  errores y cero avisos.

---

## ✅ HECHA · La mercadería se ve como lo que es, y apoyada en la estiba

*(Santi: "lo que recoges no puede parecer lo mismo que en el de pasajeros (un
cuadrado amarillo en el piso). Tiene que ser más físico y real. Tienen que haber
cajas y cosas apoyadas sobre muebles para llevártelas")*

Tenía razón y el problema era más grande que la estética: **el botín del tren de
carga se dibujaba con el mismo sprite que la plata del de pasajeros**, así que lo
único que de verdad distingue a los dos trenes —qué se roba— era invisible hasta
que levantabas la cosa.

### Once siluetas, y el corte es por CLASE de cosa

`dibujarObjeto` (entities/lootable.js) sale antes que todo lo demás y con
`return`: un objeto no comparte una línea de dibujo con la bolsa ni con la caja
fuerte. Cajón con listones, cajón de botellas con los cuellos asomando, fardo con
dos sogas, rollo de tela con la espiral en la punta, saco panzón atado arriba,
estuche chato con broche, botiquín con su cruz roja, lingotes apilados
escalonados, papeles con sello de lacre, bolsita de polvo de oro, joyero.

**No son quince, una por objeto, y es a propósito:** lo que el dibujo tiene que
decir es *qué clase de cosa es* —cuánto va a costar cargarla—, no cuál
exactamente. El nombre lo dice el cartel al levantarla. Un cajón de munición y
uno de whisky se parecen porque son las dos igual de incómodas, que es la única
diferencia que importa adentro del vagón.

**El color lo da el nivel** (madera / gris de chapa / dorado), igual que en el
TAB. Así el nivel se lee del color y la forma de la silueta, sin que uno tape al
otro.

**Y todas llevan sombra**, que es la mitad de por qué esto se siente físico: sin
ella, cualquier cosa parece flotar.

### Apoyadas en la estiba: cinco píxeles, y no un tile

El botín de estos vagones vive en las filas 3 y 6, que son las que quedan pegadas
a las pilas de carga. Se lo corre **cinco píxeles hacia el mueble**, así que se
monta sobre el borde de la estiba y se lee como algo estibado.

**Cinco y no un tile entero por un motivo que no se ve:** moverlo ADENTRO del
mueble lo volvería inalcanzable — el jugador no puede pisar carga y `loot.radius`
son 15 px. Así queda al filo: visualmente encima, físicamente al alcance del que
camina por la fila de al lado.

### VERIFICADO POR CONSOLA

- **Las posiciones siguen siendo válidas**: seis muestras, todas en las filas 3 y
  6 (y 51 / y 109), ninguna sobre un tile sólido, y el validador del tren no
  dice nada.
- **Y siguen siendo alcanzables**, que era el riesgo real: tres pruebas con el
  jugador parado en la fila caminable de al lado, con `[E]` sostenido — las tres
  se levantaron.
- **El tren de pasajeros no cambió**: sus 15 botines siguen sin un solo objeto,
  o sea que siguen siendo plata y siguen dibujándose como siempre.
- Ciclo de once escenas, de día y de noche: cero errores y cero avisos.

---

## 🐛 ARREGLADA · La mochila era un callejón: no se podía soltar nada

*(Santi: "pero está mal hecha la mochila. Yo podría elegir soltar cosas que ya no
me sirven o cambiarlas por otras. Debería aparecer un cursor cuando veo el
interior de la mochila")*

**Tenía razón y era un defecto de diseño mío, no un detalle.** La mochila se
llenaba por orden de llegada y no había forma de cambiar nada: si arrancabas
juntando sacos de café, los lingotes que encontraras después **no tenían dónde
entrar y no podías hacer nada al respecto**.

O sea que la pregunta que todo el sistema existía para crear —*¿cuál me llevo?*—
no era una decisión: **era el orden en que te cruzaste las cosas**. Construí la
mitad del mecanismo (el límite) y me olvidé de la otra (la elección).

### Lo que se agregó

- **Un cursor** que se mueve con `W A S D` / flechas por las dieciséis casillas.
- **`[E]` suelta lo señalado.**
- Lo señalado se resalta **en la grilla y en la lista** al mismo tiempo. Se marcan
  las dos cosas porque con un cajón de 2×2 la casilla sola no alcanza para saber
  qué vas a soltar, y el contorno solo no sirve para navegar por los huecos.
- El cursor **late**. Sobre un bulto del mismo tono claro un marco quieto se
  pierde; lo que se mueve se encuentra solo.

### Lo que sueltas cae al piso, no se destruye

Vuelve al mundo como un botín más, a tus pies, y se puede levantar otra vez — así
soltar no es tirar, es **cambiar**. Y se reabre rápido (`bagTime`, 0,6 s) porque
ya está abierto y tirado: cobrarte ocho segundos por algo que acabás de soltar
sería castigar dos veces la misma decisión. Si te vas sin él, cuenta como botín
que dejaste, igual que lo que nunca abriste.

**La dinamita no se suelta**: de un cartucho te deshacés usándolo. Si hace falta
el lugar, la respuesta es tirarlo — que además hace algo.

### Y revolver la bolsa cuesta, porque el mundo no se detiene

Mientras está abierta, el jugador **no se mueve, no apunta y no dispara** (un
`return` en `updatePlayer`, el mismo patrón que `tumbado`). Pero los guardias
siguen caminando, el reloj sigue bajando y los jinetes siguen tirando.

No es una pantalla de gestión: es **un tipo parado en un pasillo con la bolsa
abierta**, y eso se paga en la única moneda que este juego cobra — tiempo y
exposición. Reacomodar la carga en medio de un tiroteo cuesta; hacerlo en un vagón
vacío es gratis. **Elegir dónde hacerlo es parte del juego.**

Y de paso resuelve el conflicto de teclas sin inventar ninguna: si el jugador no
camina, `W A S D` quedan libres para el cursor. Mismo criterio que el menú del
campamento y el diálogo de los vendedores.

### 🐛 Un problema de usabilidad que apareció midiendo

Cuatro `[E]` seguidos soltaban **una sola cosa**. La causa: después de soltar, el
cursor quedaba sobre el hueco que acababa de dejar, así que la segunda pulsación
no señalaba nada. **Y eso no se ve en ninguna parte** — parece que el botón dejó
de funcionar.

Ahora el cursor salta a lo siguiente que haya. El caso común es justamente soltar
varias cosas seguidas: abrís la bolsa porque encontraste algo grande y necesitás
un cuadrado libre.

### VERIFICADO POR CONSOLA

- **El ciclo completo de la decisión, que es la prueba que importa:** bolsa en
  14/16 con cuatro atados → el cajón de 2×2 **rebota**; soltando de a uno
  (14 → 11 → 8 → 5) → el cajón **entra**. Antes de esto era imposible.
- **Lo soltado vuelve al mundo**: el botín en el piso pasó de 23 a 24 objetos.
- **Con la bolsa abierta el jugador no se mueve** (`moving` en false).
- **Recorriendo las dieciséis casillas y apretando `[E]` en todas** —sobre cosas,
  sobre huecos y sobre la dinamita—, de día y de noche, en los dos trenes: cero
  errores y cero avisos.

### Y otra trampa de arnés, la misma de siempre con otra cara

Las tres primeras mediciones del soltar dieron "no pasa nada", y el código estaba
bien las tres veces: **el bucle que llenaba la mochila recorría los 26 botines a
10 segundos cada uno y se comía los 165 s del asalto**, así que `Tab` y `E` le
llegaban a la pantalla de resultados. El servicio `raid` que yo seguía leyendo era
el del asalto viejo, y mostraba números plausibles.

> Si el banco de pruebas consume tiempo de juego, hay que vigilar el reloj del
> juego — o el arnés te contesta preguntas de otra partida.

---

## ✅ HECHA · La mochila se maneja con el mouse, y las dieciséis casillas se ven siempre

*(Santi, después de jugarla: "quiero que el jugador pueda mover los objetos de la
mochila con el mouse arrastrándolos con click izquierdo. Y con el click derecho
los tira. Y si pasa el cursor por un objeto te informa cuál es el precio base.
Además, siempre se tienen que ver los 16 cuadritos, por más que una caja ocupe
cuatro. El jugador debe saber cuánto ocupa en un segundo y sin ver texto")*

**Esto da vuelta una decisión escrita** en la cabecera de `engine/grilla.js`: *"el
jugador no arrastra nada; hacerlo a mano sería un minijuego de inventario en el
medio de un vagón con guardias"*. Se jugó y el pedido fue el contrario.

**Por qué el criterio viejo no se rompe, aunque la regla cambie:** lo que aquel
párrafo protegía era el momento de AGARRAR algo, y ése no se tocó — levantás un
cajón y el cajón se guarda solo, instantáneo, sin preguntarte nada. Lo que se
agrega es ACOMODAR, que es opcional, pasa con la bolsa abierta y **ya tiene su
precio puesto**: el mundo sigue andando mientras lo hacés. O sea que el arrastre
no esquiva la moneda del juego, la paga como todo lo demás.

> Y ojo con eso jugándolo: ahora se puede pasar **más** tiempo con la bolsa
> abierta. Puede que esté bien —es más costo, no menos— pero es lo que hay que
> mirar.

### Las dieciséis casillas, que es lo más importante de los cuatro pedidos

Ya se había arreglado una mentira acá: antes se pintaban **casillas sueltas en
orden de lectura**, así que un cajón de 2×2 podía partirse al final de una fila y
seguir en la siguiente. Se cambió a **un rectángulo sólido por bulto**… y eso creó
la mentira contraria: el rectángulo **se come los separadores**, así que la grilla
desaparecía justo donde había algo y "cuánto ocupa esto" volvía a ser una pregunta
para el texto de la lista (`· 4`).

**Ahora son las dos cosas a la vez y no hay que elegir:**

- cada casilla ocupada se pinta **por separado**, con su separador de 2 px
  intacto → **se cuentan** de un vistazo;
- y un **contorno claro rodea el bulto entero** → se ve que esas cuatro casillas
  son una sola cosa y no cuatro chucherías.

Mirándolo, la lectura que sale sola es: **hueco oscuro entre casillas = la misma
cosa; línea clara = ahí termina un bulto y empieza otro.** Sin una palabra.

Es el mismo truco que ya usaba el cursor desde el día uno (marcar la casilla Y el
bulto), aplicado a la mercadería. Y obligó a un cambio chico: **el contorno del
bulto señalado ahora late**, porque desde que todos los bultos tienen contorno,
uno quieto del mismo color ya no distinguía nada.

### El arrastre, y la ruedita

- **Clic izquierdo** agarra. El bulto **sale de la grilla mientras lo llevás**, y
  eso no es un detalle de implementación: es lo que hace que el hueco que deja se
  vea de verdad, y lo que evita que la pieza se choque consigo misma al probar si
  entra dos casillas más allá.
- **Se agarra por la casilla que tocaste** (`offx`/`offy`), así que un cajón de
  2×2 tomado por su esquina no salta bajo el cursor.
- **La ruedita gira** lo que tenés en la mano. Hasta ahora los bultos largos *se
  acostaban solos* y el jugador no decidía: con el mouse eso dejó de alcanzar
  —soltar un atado sobre una columna libre tenía que poder significar "lo quiero
  parado"— y no había cómo decirlo. La ruedita está libre: con la bolsa abierta no
  se pelea, así que su otro uso (el cuchillo) no puede chocar.
- **Al soltar prueba tres cosas, en orden:** como lo tenés, girado en el mismo
  lugar, y si no, **vuelve exactamente de donde salió**. Elegido sobre una tabla
  de tres (girar a mano / reintento automático / las dos): las dos. El reintento
  es lo que hace que arrastrar perdone sin sacarte el control de la primera.
- **La tercera no puede fallar**, y es lo que hace que esto sea seguro: el lugar
  de donde lo sacaste está garantizado libre, porque nadie pudo meterse ahí
  mientras lo tenías en la mano. **Arrastrar nunca te puede hacer perder algo.**
- **Verde entra, rojo no**, dibujado encajado en la grilla, y con la forma con la
  que de verdad va a entrar — si va a tener que girar para caber, se ve girada
  antes de que sueltes.

### El clic derecho tira, y el precio aparece al pasar por encima

El clic derecho **reusa el camino de `[E]`** en vez de duplicarlo: vuelve el bulto
a la grilla y llama a la misma función de soltar. Así la dinamita sigue sin poder
tirarse, lo soltado sigue cayendo a tus pies como botín abierto y el cartelito
dice lo mismo. **Una sola forma de sacar algo de la mochila.**

Hizo falta un flanco nuevo en `engine/input.js` (`mouse.rightPressed`): el clic
derecho era un **estado** puro —asomarse mientras lo mantenés— y como gesto no
servía. Con el estado solo, mantenerlo apretado tiraba al piso todo lo que fuera
quedando bajo el cursor, un bulto por cuadro.

**El precio dice "base" a propósito.** El perista lo duplica si la mercadería
salió limpia y lo mueve hasta un ±20% según tu nombre, y ninguna de esas dos cosas
se sabe parado en el pasillo de un vagón. Un número cerrado ahí sería mentir sobre
la única pregunta que este tren te deja abierta hasta el pueblo.

> **Y el cartel se corrió al costado de la grilla después de mirarlo.** Pegado al
> cursor —lo primero que se probó— **tapa la grilla**: el mouse está siempre
> ADENTRO de la grilla cuando señalás algo, así que el cartel se comía la fila de
> al lado justo mientras decidís dónde entra cada cosa. Al costado sigue la altura
> del bulto señalado y no tapa nada.

### Detalles que no se ven pero importan

- **El teclado sigue igual.** No hay dos selecciones ni un modo que elegir: hay
  **un** cursor, y lo mueve lo último que tocaste. Con el mouse no suena, a
  diferencia del teclado — cambia de casilla muchas veces por segundo y el
  clic-clic se volvía un cascabel.
- **Lo que tenés en la mano sigue pesando.** Está fuera de la grilla, así que sin
  sumarlo aparte reacomodar la bolsa te haría momentáneamente más liviano y más
  rápido. Cambiar algo de lugar no lo hace desaparecer.
- **Cerrar con TAB mientras arrastrás lo devuelve a donde estaba.** Cerrar no es
  soltar.
- **La geometría de la grilla en pantalla vive en un solo lugar**
  (`geometriaMochila`), porque la usan el dibujo y el mouse: si se separaran,
  agarrarías un bulto y se movería otro. Sale de `CONFIG.view` y no del renderer
  porque hace falta durante el `update`, donde no hay `r`.

### VERIFICADO MIRÁNDOLO Y POR CONSOLA

Con el bucle frenado, un tren de carga y la bolsa en 14/16 (tres bultos de 3×1,
uno de 1×3 y dos cartuchos):

- **Las dieciséis casillas se ven** con la bolsa casi llena — comprobado en un
  recorte ampliado, casilla por casilla.
- **Soltar donde no entra no pierde nada:** agarrar el 1×3 y soltarlo en la
  esquina de abajo a la derecha lo devuelve intacto (14 → 14 casillas, misma
  forma).
- **La ruedita gira de verdad:** el mismo bulto pasó de `1x3` a `3x1` y entró.
- **El clic derecho tira:** 14 → 11 casillas, un objeto menos en la lista y uno
  más tirado en el piso del vagón (22 → 23).
- **El teclado no se rompió:** `[E]` sobre un rollo, 14 → 11.
- **El cartel del precio** aparece al costado, a la altura del bulto, y se apaga
  al sacar el mouse de la grilla.

---

## 🔻 AJUSTADA · El bulto frena menos: tope de −35% a −25%

*(Santi, después de jugar la mochila con el mouse: "yo haría que el movimiento se
penalice menos ahora. Pondría que pase de 35% a un 25%")*

**`CONFIG.mochila.frenoMaximo`: 0,35 → 0,25.** El 0,35 nunca se había medido
contra la mochila: se heredó tal cual del `CONFIG.peso` viejo, que frenaba por lo
que la plata valía. Es el primer número de la mochila que sale de jugarla.

El colchón no se tocó (media mochila sigue gratis); lo que cambia es cuánto pesa
la mitad de arriba. Caminando a 78 px/s:

| Casillas | Antes (0,35) | Ahora (0,25) |
|---|---|---|
| 8 / 16 | 78 px/s, nada | 78 px/s, nada |
| 12 / 16 | 64 px/s (−17,5%) | 68 px/s (−12,5%) |
| 14 / 16 | 58 px/s (−26%) | 63 px/s (−19%) |
| 16 / 16 | 51 px/s (−35%) | 58 px/s (−25%) |

**Verificado en el juego:** tren de carga, bolsa llenada de a un bulto; con 13/16
el HUD marca **−16%** (con el número viejo hubiera sido −22%).

---

## 🛠 EN DISEÑO · Los trenes nuevos: vagones más especiales y selectivos

*(Santi: "me gustaría cambiar el sistema de los vagones de los trenes. Añadiendo
vagones más especiales y selectivos. [...] Me gustaría irlo puliendo contigo")*

**Nada de esto está construido.** Es lo que se cerró conversando, ronda por ronda,
escrito acá para que no dependa de la memoria de una sesión. Cada decisión salió
de una tabla de opciones con su efecto medido.

### Tren de pasajeros — 8 vagones y la locomotora

| Lugar | Vagón | Qué es |
|---|---|---|
| **1, fijo** | **Caboose** (observación) | Un vigía que mira hacia atrás: subir por la cola deja de ser gratis |
| sorteado | **Dormitorio** | Camarotes: cabinas con puerta y gente adentro, pasillo lateral angosto |
| sorteado | Comedor | El de siempre |
| sorteado | Pasajeros ×2 | Los de siempre |
| sorteado | **Especial** | Sale **uno** de dos: vagón de **guardias de franco** o **primera clase** |
| sorteado | Correo | El de siempre |
| **desde el 4** | Express (blindado) | El de siempre. La regla de hoy ("nunca antes del 3") corrida un lugar por el caboose |
| al final | **Locomotora** | **Se ve, no se entra.** De ahí salen los refuerzos |

**Se va el ganado**, que era el único vagón sin techo de este tren.

### Tren de carga — 9 vagones

| Lugar | Vagón | Qué es |
|---|---|---|
| **1, fijo** | **Caboose** | El mismo vigía |
| **desde el 3** | **Almacén** | Es **uno de los tres vagones cerrados**. Todo lo construido se conserva (llave, 2 cajas, 4 guardias duros, botín raro) |
| sorteado | Cerrados comunes ×2 | Los "correos livianos" de hoy con otro nombre: mercadería en bolsas |
| sorteado | **Plataformas ×2** | Carga amarrada que te tapa de los guardias, **sin paredes**: los jinetes te ven de los dos lados. El lugar más expuesto del tren |
| sorteado | Ganado | **Fijo**: la estampida está siempre |
| sorteado | **Góndola** | Ver abajo |
| sorteado | **Refrigerado** | Reses colgadas que **tapan la vista pero no las balas** |
| al final | Locomotora | Igual que en el de pasajeros |

**El vagón de armas** sale una de cada cuatro veces y **reemplaza a una
plataforma** (siempre queda la otra). **Se van** los tres correos livianos (pasan
a ser los cerrados), dos de los tres ganados y **el comedor: el tren de carga
queda sin pasajeros**.

### La góndola, que es la más distinta

*(Santi: "sin techo y no es un vagón al que podés entrar. El carbón funciona como
un techo. Pasar por aquí reduce el movimiento")*

- **Se cruza por encima del carbón**, y la cruzan **todos**: jugador, guardias,
  reses y Dinamitero. La persecución sigue funcionando.
- **Frena a la mitad: 39 px/s.** Es el precio que el juego ya cobra por
  agacharse, apuntar y cubrirse (40), no un número nuevo. Supuesta de 448 px, se
  cruza en 11,5 s en vez de 5,7; con la mochila llena, 15 s.
- **Montículos de carbón que tapan de los guardias pero no de los jinetes.** La
  regla central del juego, y lo que la separa de la plataforma.
- **Para el que viene por el techo cuenta como techo**: es el único vagón sin
  techo que no corta el camino de arriba.
- **Y desde el pasillo se puede subir.** ⚠️ Es el **primer acceso al techo desde
  adentro del asalto** (hoy sólo se sube desde el caballo). Abre una ruta nueva a
  mitad del asalto, y la medición de "el techo tarda lo mismo que el pasillo" hay
  que repetirla con esto.

### Los vagones especiales del de pasajeros

- **Dormir necesita la noche, y eso está postergado** (ver la Fase 4: "requiere
  que sea de noche, y eso significa otras cosas"). Por eso los dos son **versiones
  de día**: el dormitorio son camarotes y los guardias están **de franco** —
  sentados jugando cartas, con el arma colgada, tardan en reaccionar.
- **Primera clase se queda con el pasajero rico.** El paquete deja de sortearse en
  los demás vagones: una mecánica, una casa. ⚠️ Era **lo único** del sistema de
  paquetes, así que esa capa queda vacía, y con ella se pierde que *"cualquier
  vagón común puede ser el que más plata lleva"*.

### Largo y reloj

**Había una regla sin escribir:** los dos relojes dan **~40 s por cada 1.000 px**
(pasajeros 145 s / 3.616 px; carga 165 s / 4.256 px), aunque ninguno se eligió así.

Cómo se arma el largo: plataforma de cola (8 casillas) + cada vagón + un enganche
de 3 después de cada uno. Con anchos supuestos para los nuevos (caboose 20,
dormitorio 40, especial 32, plataforma 24, góndola 28, refrigerado 32, cerrado
32):

| | Hoy | Nuevo |
|---|---|---|
| Pasajeros | 3.616 px, 145 s | **4.800 px (+33%)** — ver la corrección abajo |
| Carga | 4.256 px, 165 s | **4.528 px (+6%)** |

**Los dos trenes quedan del mismo largo, y los dos duran ~180 s.** Encaja con lo
que se dijo al sacar el tren veloz: un tren que se distingue por su reloj es
dificultad disfrazada. Ahora sólo los separa lo que traen adentro. La góndola le
suma al de carga +5,7 s por pasada sin sumarle largo.

### Reglas que se cuidaron

- **Una mecánica, una casa**: el de armas vive sólo en el de carga; el rico, sólo
  en primera clase.
- **La estampida no se pierde**: el ganado es fijo.
- **El tren de carga ya tenía cinco sistemas a la vez.** Se prefirió lo que da
  identidad sin sistema nuevo (plataforma, refrigerado); la góndola es la
  excepción elegida.

### Qué lleva cada vagón

**Criterio: se conservan los guardias por cada 1.000 px de tren** (3,6 en el de
pasajeros, 2,6 en el de carga), porque es lo que está medido. El tren es más
largo, pero cada tramo pelea igual que hoy. Elegido sobre "los mismos totales"
(dejaba el de pasajeros un 19% más vacío con el reloj ya estirado) y "más duros"
(largo, reloj y dificultad cambiando a la vez: imposible saber qué lo hizo difícil).

**Pasajeros** — 4.800 px medidos (se diseñó con 4.480, ver la corrección de arriba), apunta a 16 guardias:

| Vagón | Guardias | Pasajeros | Bolsas | Cajas |
|---|---|---|---|---|
| Caboose | 1 (vigía) | – | 1 | – |
| Dormitorio | 1 | 4, en camarotes | 3 | – |
| Comedor | 1 | 5 | 3 | – |
| Pasajeros ×2 | 4 | 8 | 6 | – |
| Especial: guardias de franco | 4 | – | 1 | – |
| Especial: primera clase | 2 (guardaespaldas) | **3 ricos** | – | – |
| Correo | 3 | – | 2 | 1 |
| Express | 4 | – | – | 2 |
| **Total** | **16** con primera clase, **18** con guardias | 17-20 | 15-16 | 3 |

Hoy: 13 / 13 / 12 / 3. Las bolsas crecen un 24%, igual que el largo. **Con el
vagón de guardias el tren es más duro a propósito**: es la versión militar del
especial.

**Primera clase lleva 3 ricos, ~$600.** Queda como el segundo vagón más rico,
detrás del express (~$750 con sus dos cajas), sin competirle. Y no es plata
fácil: tres amenazas de 2,2 s son 6,6 s quieto con los guardaespaldas mirando,
casi lo mismo que forcejear una caja. Con 4 ricos (~$800) le ganaba al express, y
un vagón sin puerta de chapa pasaba a ser el objetivo obvio del tren.

**Carga** — 4.528 px, apunta a 12 guardias:

| Vagón | Guardias | Bolsas | Cajas |
|---|---|---|---|
| Caboose | 1 (vigía) | 1 | – |
| Almacén | 4 duros | 3 | 2 |
| Cerrados ×2 | 2 | 10 | – |
| Plataformas ×2 | 2 | 6 | – |
| Ganado | 1 | 1 | – |
| Góndola | 0 — nadie vive en el carbón, sólo lo cruzan | – | – |
| Refrigerado | 2, para que haya a quién tirarle a ciegas entre las reses | 3 | – |
| **Total** | **12** | **24** | **2** |

Hoy: 11 / 24 / 2, casi idéntico. **Pierde a sus 5 pasajeros** (se va el comedor),
y encaja: la gente es del tren de pasajeros.

### El vigía del caboose se da vuelta cada tanto

*(Santi eligió la opción más rica de tres; las otras eran "te ve en el galope si
venís por detrás" y "sólo castiga subir por la cola")*

**Alterna entre mirar la vía de atrás y mirar hacia adentro, con un ritmo que se
ve.** Esperar a que esté de espaldas es una jugada — la misma familia que esperar
a que el Dinamitero salga de su vagón.

**Reusa el sistema de exposición del galope** en vez de inventar otro. Hoy te
descubre **el vagón que tenés al costado**, no un guardia puntual: tiene que tener
ventanillas, llevar gente y estar a menos de 30 px (`APROXIMACION.verDistancia`).
Pegado a un vagón con un guardia te ven en ~1,3 s; al lado del ganado, en 0,7 s. Si
te ven, entrás con la alarma sonando. Lo único nuevo del vigía es **hacia dónde
mira, y cuándo**.

### El vigía: aleatorio, pero con aviso

*(Santi: "que sea aleatorio, no una marca que el jugador pueda aprenderse de
memoria")*

- **Cuánto mira para atrás y cuánto para adentro se sortea en cada vuelta.** No
  hay un ciclo fijo que cronometrar.
- ⚠️ **Pero se da vuelta despacio y se le ve el gesto.** Es la condición para que
  aleatorio no sea una lotería: en este juego ningún peligro llega sin aviso (el
  guardia levanta el arma, el traqueteo avisa antes del sacudón, el Dinamitero
  muestra los cartuchos). Imposible de memorizar, posible de leer. *Propuesto al
  cerrar esta ronda; a confirmar jugándolo.*
- **Mirando hacia adentro ve su propio vagón**, como un guardia normal. La
  ventana sirve para acercarte sin que te vea en el galope, **no para entrar
  gratis**: subiendo por la cola, te puede ver igual al entrar. Hay que calzar dos
  cosas.
- **Los rangos del sorteo no están elegidos.** Referencia para calibrar: con el
  Criollo, desde la esquina del desierto hasta la cola son ~11 s de galope.

### Subir desde la góndola

**Mantener `[E]` 0,4 s, en silencio.** Es exactamente lo que cuesta bajar del
techo hoy (`CONFIG.techo.bajarHold`): la misma maniobra al revés cuesta lo mismo.
Sin barra de timing, porque la del caballo es la única del juego a propósito.

### Los guardias de franco

**Reusan el comportamiento "Conversando"**, que ya existe (ven la mitad y
sospechan más lento), y **al despertarse tardan 1,5 s en descolgar el arma**. Es la
ventana para entrar y resolver el vagón antes de que los cuatro estén en pie. Se
descartó "iguales pero sentados" (el franco se veía y no se jugaba) y "sordos al
sigilo, feroces al ruido" (sigilo casi gratis o pelea de 4 contra 1, sin punto
medio).

### El orden de los vagones

**Pasajeros:** caboose fijo en el 1 y express desde el 4. **Nada más**: ninguna
mecánica pide un orden, así que cada regla de más le quita variedad al tren sin
dar nada a cambio. Se descartó "el especial pegado al express" (sabías dónde
estaba el especial en cuanto veías el express) y "la gente junta" (tren previsible).

**Carga:**

- Caboose fijo en el 1; almacén desde el 3.
- Vagón de armas **nunca el último** — la regla de hoy, por la ronda del Dinamitero.
- **Góndola del 2 al 8**: siempre en el medio, para que su acceso al techo sirva
  como ruta a mitad del asalto, que fue la razón de dejar subir desde el pasillo.
  Se descartó "la última, como el ténder real": quedaba en la otra punta del
  caballo y el acceso al techo casi no se usaba.
- **Las plataformas pueden salir pegadas** (pasa 3 de cada 4 trenes, cuando el de
  armas no reemplaza a una). Algunos trenes traen 48 casillas seguidas sin
  paredes: con la alarma sonando, una trampa donde los jinetes te ven todo el
  cruce. Da variedad de verdad entre trenes, y no pide código nuevo.

### Dos cosas que aparecieron mirando el código, y que no se veían desde el diseño

1. **`sinTecho` decide DOS cosas a la vez**: si hay techo que pisar
   (`hayTechoEn`, el camino de arriba) y si te llueve encima (`estasCubierto`,
   la tormenta). En el ganado y la plataforma coinciden. **La góndola es el
   primer vagón donde no**: se camina por encima como un techo, pero estás a la
   intemperie. Hay que partir la marca en dos.
2. **El galope pregunta por el nombre `'ganado'`** para saber cuál es "el peor
   vagón para que te vean" (`rideScene.js`, `verRateGanado`). Las plataformas
   quedarían afuera sin que nadie lo note: tiene que leer "abierto", no un
   nombre.

### Plan de construcción — aprobado

Cada etapa deja el juego **jugable y subido**, y **cada sistema nuevo entra
solo**, para que cuando algo se sienta mal se sepa qué fue.

| Etapa | Qué | Qué se mide |
|---|---|---|
| **1. Los trenes nuevos, con lo que ya existe** | Plantillas nuevas (layout, guardias, botín) con mecánicas conocidas: refrigerado con carga común, franco con guardias normales, dormitorio con huecos en vez de puertas. Composiciones, orden, reloj de 180 s. El especial sale por `sustituciones` (la herramienta del vagón de armas, sin código nuevo). Primera clase se queda con el pasajero rico y se retira el paquete. Colores, textos, escondites. El galope lee "abierto" en vez de `'ganado'` | Largo real contra el calculado, guardias por 1.000 px, 10.000 sorteos cumpliendo las reglas, cero avisos de layout |
| **2. La locomotora** | Sólo dibujo, en el galope y en el asalto | Mirarla |
| **3. El refrigerado** | La casilla que tapa la vista y no las balas; las reses | Vista cortada, balas que pasan, guardias que encuentran camino |
| **4. Guardias de franco** | "Conversando" siempre + 1,5 s para descolgar el arma + dibujo sentados | La ventana de 1,5 s |
| **5. La góndola** | Freno del carbón para todos, montículos, **partir `sinTecho` en dos**, subir al techo desde el pasillo | Cruce en 11,5 s, y **re-medir el techo contra el pasillo** |
| **6. El vigía del caboose** | Se da vuelta al azar y con aviso; la vía de atrás en el galope, su vagón adentro | Que el aviso llegue antes de que te vea |
| **7. Los camarotes con puerta** | Hoy las puertas sólo existen en los bordes y en vertical: lo más riesgoso, va último. **Plan B si sale caro**: cortinas con la casilla del refrigerado | Que los guardias y el camino respeten las puertas |

**Por qué este orden:** todo cuelga de la etapa 1, y con ella ya se juegan los
trenes nuevos. Después va de lo más contenido a lo más riesgoso. La góndola y el
vigía son los dos sistemas nuevos de verdad, y van separados para sentir cada uno
solo. Se descartó "primero un tren entero terminado" y "primero los sistemas
nuevos en los trenes de hoy".

**Decisiones chicas que se toman en su etapa**, con el vagón delante: cada cuánto
sale cada especial (50/50 si no se dice otra cosa), qué hacen los barriles en la
góndola y en las plataformas, y los rangos del vigía.

### ✅ Etapa 1 hecha — los trenes nuevos, con lo que ya existe

**Qué se construyó:**

- **Siete plantillas nuevas** en `data/wagons.js` (caboose, dormitorio, guardias,
  primera clase, plataforma, góndola, refrigerado) y **el cerrado**, que es una
  copia del correo liviano con otro nombre (si se retoca aquél, éste se mueve).
- **Las dos formaciones** en `data/train.js`, con sus reglas de orden y 180 s. El
  especial y el vagón de armas salen por `sustituciones`, sin código nuevo.
- **Primera clase sin sistema nuevo:** los ricos son pasajeros de la plantilla con
  `rico: true` (toman los números de `PAQUETES.pasajeroRico`, que quedó en peso
  0) y los guardaespaldas son centinelas con `vigila: true`.
- **Dos trampas esquivadas antes de que existieran**, vistas leyendo el código:
  "Conversando" reubica a los dos primeros guardias de un vagón y se habría
  llevado a los guardaespaldas (nueva marca `sinComportamiento`, que antes era un
  `if` con el nombre del blindado), y la redada duplica cada guardia en su punto
  de partida — a un centinela lo habría duplicado encima de sí mismo (ahora los
  que `vigila` no se duplican).
- **El galope lee "abierto"** (`!tieneTecho`) en vez de `'ganado'`.
- Colores de carga para los vagones nuevos, y escondites de la caja oculta para
  los del tren de pasajeros. **El dormitorio sólo acepta "ventana"**: con este
  layout ninguna litera tiene suelo pegado arriba o abajo, que es lo que exige el
  escondite para que la caja se pueda alcanzar.

**MEDIDO, con el código real del juego:**

| | Pasajeros | Carga |
|---|---|---|
| Sorteos que rompen alguna regla de orden | **0 de 10.000** | **0 de 10.000** |
| Formaciones distintas | 3.403 | 7.066 |
| Cada cuánto sale el especial / el de armas | primera clase **50,6%** | armas **24,9%** |
| Trenes armados con avisos de "mal colocado" | **0 de 300** | **0 de 300** |
| Largo | **4.800 px** (ver la corrección arriba) | **4.528 px** |
| Guardias | 16-18, **3,54 cada 1.000 px** | 12-14, **2,75** (incluye al Dinamitero cuando sale) |
| Pasajeros | 17-20 (con 3 ricos cuando sale primera clase) | 0 |
| Bolsas / cajas | 15-16 / 3 | 22-24 / 2 |

Y con una redada sobre primera clase: **2 guardaespaldas, los dos vigilando, cada
uno en su lugar.** Las ocho plantillas pasaron además un chequeo propio: filas,
bordes, nada sobre algo sólido, todo alcanzable caminando desde el pasillo,
ningún barril sobre una ronda, y lugar en cada escondite.

**MIRADO**, con el mundo congelado y exportando el dibujo a PNG (la captura de
pantalla no llegaba a dibujar a tiempo):

- 🐛 **El caboose era invisible por dentro**: el color de su carga (`#6e4a32`) era
  el mismo marrón que el piso (`#6d4a30`). El mismo error que dejó invisible la
  mochila dibujada en la espalda. Pasó a hierro de estufa (`#4e4844`) y se volvió
  a mirar.
- Los camarotes del dormitorio, las mesas del vagón de guardias, las barandas de
  las plataformas, los montículos de la góndola y las hileras del refrigerado se
  leen como vagones distintos.
- **Adentro de primera clase**: los tres ricos con sombrero de copa junto a los
  sillones, y los dos guardaespaldas con VIGILANDO. "1ª CLASE" entra en el cartel.

**⚠️ NO JUGADO.** Y los sistemas de cada vagón (vigía, reses, carbón, franco,
puertas) siguen sin existir: son las etapas 3 a 7.

### ✅ Etapa 2 hecha — la locomotora

**Se ve, no se entra.** Entrar y frenar el tren sigue anotado para más adelante.

**ES UN TRAMO DEL MAPA, NO UN DIBUJO SUELTO**, y eso salió de leer el código
antes de dibujar: la cámara del asalto no pasa del borde del mapa (`map.bounds`),
así que una locomotora pintada más allá del último enganche no se habría visto
nunca. Es un tramo de 30 columnas todas 'X' (sólido y ciego) al final de
`planificarTramos`, y el dibujo lo hace `drawLocomotora` al final de `drawTrain`
— así sale igual en el asalto y en el galope sin tocar ninguna de las dos
escenas.

**El dibujo**, de atrás para adelante: la barra, el ténder (tanque de agua con su
tapa, y carbón), la cabina con techo de madera, la caldera con luz arriba y
sombra abajo, sus anillos, la campana, el domo de vapor de latón y el de arena,
los estribos con filete rojo, la chimenea con la boca negra, el faro con su
resplandor y el miriñaque de listones rojos y negros. **El humo va para atrás** y
no pasa de la cabina y el ténder: la locomotora es fondo y nunca tapa un vagón
donde se juega. La paleta vive en `CONFIG.colors.locomotora`.

**NO CUENTA PARA EL RELOJ**: la regla de ~40 s cada 1.000 px mide tren que se
juega, y estos 480 px no se juegan.

**Dos cosas daban por hecho que el tren terminaba en un enganche**, y las dos se
habrían roto en silencio:

- **El pasajero que huía hacia adelante** corría a `map.width - 24`, que caía en
  el último enganche. Con la locomotora caía **adentro de ella** y se quedaba
  empujando una pared. Ahora corre a `puntaLocomotora`, que es exactamente donde
  caía antes.
- **Las reses de la estampida** se borraban al quedarse sin alcance o al chocar
  con el blindado, así que corrían por encima del dibujo. Ahora se pierden contra
  la locomotora.

Revisado y no hacía falta tocar: los jinetes (el "último tramo" de `riders.js` es
su propia lista de ventanillas, no el tren), el Dinamitero y las explosiones
(sólo miran vagones), el Sheriff (ya usa la punta de la locomotora).

**MEDIDO:** los dos mapas crecen **exactamente 480 px** (pasajeros 4.800 → 5.280,
carga 4.528 → 5.008); el último tramo es la locomotora y es sólida; **la punta por
donde entran los refuerzos no se movió** (4.776 y 4.504, el centro del último
enganche); cero avisos y ningún error.

**MIRADO**, de noche y de día sobre el desierto del galope, y desde el asalto
parado en el último vagón:

- 🐛 **El carbón del ténder salía como una raya diagonal**, no como terrones: las
  posiciones eran dos cuentas lineales que avanzaban juntas. Pasó a una grilla
  salteada.
- De noche la caldera casi negra se lee igual, por la franja de luz del lomo y
  los bordes; el tanque de agua y el latón son lo primero que se ve.

**⚠️ NO JUGADO.**

### ✅ Etapa 3 hecha — el refrigerado

**Las reses son una casilla nueva, `R`: tapan la vista y no las balas, y se
atraviesan a media velocidad.** Es lo contrario de la ventanilla.

**Lo que se decidió en esta etapa**, con la tabla de opciones delante:

- **Se atraviesan, pero frenan.** *Santi eligió esto sobre "son un obstáculo",
  que era la recomendada.* Al medirlo apareció un agujero: la vista se muestrea
  cada 5 px y el último punto antes de llegar a vos cae adentro de tu propia res,
  así que **pisar cualquier res te hacía invisible desde todos lados** (salvo un
  guardia a menos de 26 px con vos parado; agachado, ni eso).
- **Por eso, la res que pisás no te tapa** (`seVeDesdeAdentro`). Para esconderte
  tiene que haber OTRA entre vos y el que mira. Vale para los dos extremos: un
  guardia metido en una res también ve hacia afuera. Vive en `hasLineOfSight`,
  colgado de `blocksSightAt` (`dejaVerDesdeAdentro`), así que guardias, jinetes,
  pasajeros y la cobertura lo respetan sin tocarlos; el envoltorio de las puertas
  (raidScene.js) lo copia.
- **Frena a la mitad y a todos**: jugador 78 → 39, guardia persiguiendo 46 → 23,
  patrullando 24 → 12. El número vive en `CONFIG.casillasQueFrenan` y el mapa lo
  contesta con `frenoAt`. **El freno de la góndola ya tiene dónde ir**: la etapa 5
  se achica.
- **Los guardias tiran a ciegas entre las reses.** La regla de la puerta pasó a
  ser "la vista está cortada pero las balas pasan" (`soloTapaLaVista`, antes
  `puertaEsLoUnicoQueTapa`). Para todo lo que existía da lo mismo: la res es la
  única casilla que tapa la vista sin frenar balas.
- **Sin barriles de pólvora.** Y la explosión atraviesa las reses, igual que las
  balas, porque pregunta lo mismo.

**Consecuencias que se aceptan:** el buscador de caminos no sabe de frenos, así
que los guardias atraviesan las hileras en vez de rodearlas; y contra una res no
te podés parapetar, porque no es sólida.

**MEDIDO**, en el vagón suelto y en un asalto armado a mano:

| Qué | Resultado |
|---|---|
| Guardia en el pasillo → vos pisando la primera res, nada entre | **Te ve** |
| → vos en la res del fondo, con dos de por medio | **No te ve** |
| → vos en una rendija, de frente | Te ve |
| Una bala cruzando la fila entera (14 reses) | Pasa |
| Guardia persiguiendo: en una res / en la rendija | **23 / 46 px/s** |
| Camino de punta a punta del vagón | Lo encuentra, derecho a través de las reses |
| 300 trenes de carga | 0 errores, 0 avisos, 84 reses cada uno |

**El tiro a ciegas, caminando de verdad** (te ve en el pasillo y subís por una
columna de reses hasta el fondo): te pierde en el cuadro 38, tira la ráfaga de
contención y después **ráfagas de 5 a ciegas cada ~3,2 s** (0,4 apuntando + 0,5 de
ráfaga + 2,2 de espera).

⚠️ **Con un teletransporte a la res del fondo no tiraba nunca.** Te apunta a
donde te vio por última vez, y si ese punto lo sigue viendo, no hay "a ciegas".
Caminando funciona porque te sigue viendo hasta que ya estás adentro. Si te metés
de costado desde una rendija, puede quedar a la vista el último lugar donde te
vio, y entonces no tira: **a confirmar jugando.**

**MIRADO:** 🐛 la primera res era de 8 px con una raya blanca al medio, y desde la
cámara del juego se leía como un palito. Pasó a media res, ancha arriba y angosta
abajo, con la grasa de un costado; cada una se mece un píxel a su ritmo.

**⚠️ NO JUGADO.**

### ✅ Etapa 4 hecha — los guardias de franco

**Sentados de a dos jugando a las cartas, con el "Conversando" de siempre y el
arma colgada.** La primera vez que entran en combate tardan 1,5 s en tenerla en
la mano (`CONFIG.enemy.francoDesenfundar`).

**Lo que se decidió en esta etapa:**

- **Dos parejas, dos mesas**, una por mitad del vagón, cada una con su charla y
  su contagio. Cuando uno pasa a rojo grita y el vagón entero pasa a combate,
  como siempre: la ventana para sacarse de encima una pareja es en silencio.
- **Al lado de la mesa, no con la mesa en el medio.** Medido con el cono de
  "Conversando" y vos agachado: con la mesa entre los dos cada uno veía **0
  casillas**; al costado, **3-4** (un "Conversando" en el pasillo ve 5). Con 0 era
  el "sordos al sigilo" que ya se había descartado.
- **Mientras descuelgan, moneda** *(Santi: "algunos, de forma aleatoria, buscan
  cobertura, otros se quedan quietos")*: 50% quieto (elegido sobre 70/30 para
  cada lado). Medido en 400 despertares: 198 quietos.
- **Redada: llegan 4 de servicio, despiertos.** Patrullan `rondaRedada`, las
  cuatro rondas que no pisan una silla (fila 7 de la cola, fila 2 de la
  locomotora, las dos mitades del pasillo). Primera clase sigue sin extras.
- **Sin comportamiento sorteado** (ya vienen "Conversando") **y sin variantes**
  (un Dinamitero no tiene arma que descolgar, y su ronda cruza vagones).

**Dos puertas a combate, una sola regla.** Un guardia pasa a combate por
`enterCombat` (te vio, la alarma) o porque le pegan (`damageEnemy`, en otro
archivo). Las dos llaman a `empezarADesenfundar`. Mientras corre el reloj no hay
tiro normal (`tryFire`), ni a ciegas por puerta o por techo, ni cuerpo a cuerpo.

**Las parejas dejaron de depender del orden.** "Conversando" armaba la pareja con
`idx === 0` y "el último guardia creado", que alcanzaba para una sola por vagón.
Ahora se arma por clave (`def.franco`, o `'charla'` para el de siempre), con el
mismo resultado para los vagones de antes.

**🐛 LO QUE APARECIÓ MIDIENDO: CUBRIRSE ERA PELEAR COMO UN GUARDIA NORMAL.** Un
guardia común alertado también tarda ~1,8 s en tirar, porque primero camina a
cubrirse, y los 1,5 s se consumían en esa misma caminata. Primera bala desde que
se despierta:

| | A 48 px | A 80 px en el pasillo |
|---|---|---|
| Guardia normal | 1,75-1,80 s | 1,62-1,88 s |
| De franco que se cubre | 1,83 s | 1,87-2,15 s |
| De franco quieto | 3,40-3,57 s | 3,10-3,32 s |

La ventana existía sólo para la mitad quieta. Tres opciones: descuelga al llegar
a la cobertura (la recomendada), dejarlo así, o **se cubre despacio** — *elegida
por Santi*. Mientras descuelga camina a la mitad (`francoCubreVelocidad`, que se
suma al freno de las reses). Re-medido:

| | A 48 px | A 80 px en el pasillo |
|---|---|---|
| Guardia normal | 1,62-1,70 s | 1,77-1,97 s |
| **De franco que se cubre** | **2,37-2,97 s** | **2,45-2,80 s** |
| De franco quieto | 3,72 s | 3,18 s |

A 1,4 s el que se cubre caminó 26 px contra 35 de uno normal.

**MEDIDO además:** en 10 s de calma los cuatro siguen sentados, a 0 px de donde
nacieron; en redada, 8 guardias, los sentados tampoco se mueven; 300 trenes de
pasajeros, 158 con el vagón de guardias y 4 de franco cada uno, 0 errores y 0
avisos. Una primera medición salió sucia y se descartó: el jugador quedó adentro
del caboose, su guardia lo vio y levantó a los de franco.

**MIRADO:** en calma, las parejas frente a frente al lado de la mesa, con banquito,
cartas en la mano y cartas sobre la mesa; medio segundo después de despertarlos,
en rojo y **sin caño** (el arma colgada al costado), una pareja quieta y otra
yéndose a cubrir.

**⚠️ NO JUGADO.**

### ✅ Etapa 5 hecha — la góndola

**EL DISEÑO CAMBIÓ AL CONSTRUIRLO, y para bien.** Estaba anotado como un vagón
abierto con un pasillo adentro, desde el que además se subía al techo. Santi lo
corrigió con la tabla delante: *"la góndola es el techo. Pasar por arriba del
carbón es como pasar por el techo. Además, no puedes pasar por 'debajo' del
carbón"* y *"para subir o bajar es por los enganches"*. O sea: **no hay adentro**.

**La pregunta que eso abrió, y se decidió:** si sólo se cruza por encima,
¿quién más puede? Hoy guardias, refuerzos, el Sheriff y la estampida sólo
caminan a ras del piso. Con "sólo vos, como un techo más", el tren de carga
quedaba **partido en dos** para todos ellos, y subir a la góndola te sacaba de
encima a cualquiera que te siguiera. Se eligió **"todos cruzan por el
carbón"**: el piso de la góndola ES la superficie del carbón, y lo pisan todos.

**Cómo quedó:**

- **Dos casillas nuevas.** `K` carbón: se pisa y frena a la mitad
  (`CONFIG.casillasQueFrenan.carbon`, que se enchufó donde ya estaban las
  reses). `M` montículo: sólido, tapa la vista y las balas **de los de adentro**
  (`tapaSoloDeAdentro`).
- **Vos trepás en los enganches**: [E] 0,4 s al borde, en silencio
  (`updateTreparCarbon`). Hasta entonces el carbón es pared **sólo para vos**
  (`world.solidoParaJugador`), y arriba el que choca es el borde hasta que bajás.
  Cede el [E] a la salida y a cualquier cosa que se pueda agarrar.
- **`sinTecho` se partió en dos**, como estaba previsto: `tieneTecho` (se camina
  por arriba) y `aLaIntemperie` (llueve, y el galope te ve al ritmo del ganado).
  La góndola es la primera con techo pisable y a la intemperie.
- **Por el techo sigue de largo y frena igual**, porque es el mismo carbón. No se
  tapa al dibujarlo: lo que está encima del carbón está a tu altura.
- **Desde el caballo se puede saltar encima** *(Santi, sobre "el galope queda
  igual")*: sale sola, porque ahora `tieneTecho` es verdadero.
- **Los jinetes no ven los montículos**: su vista (`vistaDelJinete`) y sus balas
  (`fromRider`, que ya existía) los ignoran.
- **Las reses de la estampida frenan en el carbón**, y **no se sueltan barriles**
  (Santi, sobre "frenan a la mitad" y "ruedan igual").

**MEDIDO**, en un tren de carga armado a mano (caboose, góndola, cerrado):

| Qué | Resultado |
|---|---|
| Caminar contra el carbón sin trepar | Frena en x=491, con el borde en 496 |
| Trepar / bajar | 0,42 s cada uno; bajando caés en el enganche |
| 300 px a pie: carbón / cerrado | **14,65 / 7,35 s**, el doble |
| Por el techo: sobre la góndola / sobre el cerrado | **39 / 78 px/s**, sin caerse |
| Guardia persiguiendo sobre el carbón | **23 px/s**, y encuentra camino a través |
| Montículo, para un guardia | Corta la vista y la bala |
| Bala de jinete contra un montículo | **Pasa** |
| 300 trenes de carga | 0 errores, 0 avisos, los 300 con góndola |

**Techo contra pasillo, re-medido sobre la góndola**: de punta a punta por abajo
(trepar + cruzar + bajar) **22,48 s** contra **12,05 s** el mismo largo en el
cerrado; por arriba **11,28 s** contra **5,65 s**. **Las dos rutas pagan el
doble**, así que la góndola no rompe el "el techo tarda lo mismo". ⚠️ Es una
medición por tramo, no la del jugador de prueba del vagón 1 al 4 con guardias
(allá abajo el jugador de prueba camina más lento por no apuntar hacia donde
va): **ésa no se repitió**.

Una primera medición del techo dio 31 px/s en vez de 39: eran los carteles, que
te voltean y te dejan un rato en el piso. Sin carteles, 39.

**MIRADO — el montículo necesitó tres dibujos:** 🐛 primero cada casilla tenía
su borde y su lomo, y un montículo de 3x2 se leía como **seis cajas apiladas**;
🐛 unido en una sola masa pareja, se leía como **un pozo negro**. Quedó mirando a
sus vecinas: la fila de arriba del bulto iluminada, la de abajo en sombra y las
esquinas sueltas redondeadas — ahora es una pila que sobresale del carbón.

**🔧 AJUSTE, antes de jugarla — los jinetes no te alcanzan en la góndola.**
*(Santi: "los jinetes no me pueden disparar mientras estoy sobre el carbón.
Recuerda que las paredes son altas y estoy encima de ellos")*. El borde de la
góndola pasó de baranda ('H', que deja pasar vista y balas) a **pared** ('#'):
ya no te ven ni te pegan, ni sobre el carbón ni por el techo. Con eso **se sacó
la excepción de los montículos para los jinetes** (`tapaSoloDeAdentro`, la vista
propia del jinete y el chequeo de `fromRider` en las balas): si los jinetes no
tiran adentro de la góndola, no queda nada que exceptuar, y el montículo quedó
como cobertura común. La fila "bala de jinete contra un montículo: pasa" de la
tabla de arriba ya no vale.

**Sin medir, revisado leyendo el código:** la lluvia sobre la góndola y el ritmo
del galope (que igual no corre al lado de la góndola: no lleva a nadie que mire). **Una simplificación a mirar jugando:** arriba de la góndola por el techo
seguís siendo "el que va por el techo", así que un guardia cruzando el mismo
carbón no te ve, aunque estén a la misma altura.

**⚠️ NO JUGADO.**

---

## 🛠 EN CONSTRUCCIÓN · Tres cuartos

*(Santi: "me gustaría que tenga una vista cenital")*. El juego ya era cenital
—la cámara mira derecho hacia abajo—, así que se le mostraron tres variantes
(cenital pura, tres cuartos, cenital con más cámara) y **eligió tres cuartos**:
desde arriba pero viendo el frente de las cosas, como Stardew Valley o los Zelda
de SNES. Se le mostró un boceto del vagón de pasajeros al lado de la vista de
hoy antes de decidir nada.

**Decisiones:**

| Qué | Elegido | Por qué |
|---|---|---|
| Alcance | **Primero el tren** (asalto y galope); campamento, pueblo, interiores y tienda en otra vuelta | Es donde se juega casi todo, y se puede probar antes de redibujar lo demás. El pueblo ya dibuja fachadas de frente |
| Qué recibe las balas | **La caja de hoy** (9×7, a la altura del cuerpo); el dibujo crece hacia arriba | Todo lo medido (cobertura, puntería, reses, montículos) sigue valiendo. Descartado "todo el dibujo": habría que recalibrar el combate entero |
| Orden | **Tres cuartos antes de las etapas 6 y 7** | El gesto del vigía y las puertas de los camarotes son dibujo: hechas antes, se dibujarían dos veces |

**Plan aprobado:** A (el orden de dibujo) → B (la gente) → C (las cosas) → D
(el techo) → E (el galope) → F (mirar los 13 vagones). La altura de las balas
(C) y cuánto sube el techo (D) se deciden con captura delante.

### ✅ Etapa A hecha — el orden de dibujo

**Antes se pintaba por tipo de cosa** (el tren, las puertas, el botín, la gente,
los barriles), así que nada podía tapar a nadie según quién estaba adelante.

- **El tren se dibuja en dos pasadas** (world/train.js). `drawPisoDelTren` pinta
  lo que está en el piso. `cosasAltasDelTren` no pinta: devuelve lo que se
  levanta (paredes, ventanillas, asientos, carga, reses, montículos, barandas),
  cada una con su `base`. `drawTrain` hace las dos seguidas, para el galope.
- **La escena mezcla esa lista con todo lo que está parado** —gente, puertas,
  botín, cajones, barriles, jinetes— y lo pinta ordenado por dónde tiene los pies
  (`y + hh`, el borde de abajo de la caja con la que choca, que no cambió). Los
  caídos van con el piso, así nunca tapan nada.
- **La regla de las dos caras:** la tapa se pinta levantada y la cara de adelante
  sólo donde el bloque termina. Una fila de asientos o una pared lateral se leen
  como un solo bloque.
- **Las alturas** viven en `CONFIG.tresCuartos`: pared 12, carga 7, res y baranda
  6, asiento 5, montículo 4. Sin calibrar.

**🐛 LA PARED DE ADELANTE TAPABA A LA GENTE.** Levantada 12 px, la pared de abajo
del vagón se comía la última fila de adentro: medio asiento, y un guardia parado
ahí quedaba medio escondido. Es "correcto" en tres cuartos y es justo lo que un
juego no puede hacer. **Una pared con adentro del vagón detrás suyo se dibuja
baja** (`alturaParedBaja`, 3 px): la de adelante y las divisiones. Las del fondo
y las laterales siguen altas.

**MEDIDO:** dibujar un cuadro tarda **0,38 ms**, así que ordenar todo no lo hace
lento; ningún error en la consola, en el asalto ni en el galope.

**MIRADO** (con la gente todavía vista desde arriba, que es la etapa B): el
vagón de pasajeros con la pared del fondo mostrando su cara y sus ventanillas,
el caboose, las divisiones bajas del dormitorio con los pasajeros a la vista
adentro de los camarotes, las reses del refrigerado colgando, la plataforma, el
ganado con las barandas levantadas y la góndola con los montículos en volumen.
Dos capturas salieron primero del vagón equivocado —la lista de vagones empieza
con la plataforma de la cola— y se repitieron buscando el vagón por su nombre.

### 🔁 Etapa A, segunda versión — más limpia y con las paredes de afuera altas

*(Santi, antes de seguir con la B: "en la etapa A se está perdiendo mucho el
potencial [...] está media confusa y como que cargada. Además, mientras mirás de
afuera al tren, se debería ver más altas las paredes de afuera")*.

**Qué la cargaba**, visto en las capturas:

- **La pared del fondo son dos filas**, y cada una dibujaba su tapa, su raya de
  vidrio y su cara: **tres franjas de ventanillas** una encima de la otra.
- **Asientos y piso con demasiadas rayas**: cada asiento con tapa, raya clara y
  cara, sobre un piso a cuadros.
- **La pared de adelante era un borde bajo** también desde afuera.

Se le mostró un boceto con la propuesta, en 20 y en 28 px, al lado de la etapa A
("me gusta mucho más que el otro"), y se decidió con lo que había medido:

| Qué | Elegido | Descartado |
|---|---|---|
| Altura | **20 px**: 8 px de aire arriba y abajo (pantalla 216, tren 160) | 28 (llenaba la pantalla y la sacudida de un disparo la cortaba); "fondo 12, afuera 20" |
| Jinetes de arriba | **Silueta a través de la pared** | "Siempre adelante" (rompe la perspectiva en el borde del tren) |

**Por qué hacía falta decidir lo de los jinetes:** el carril de arriba va a 14 px
del vagón con jinetes de 23 de alto. Una pared de 20 los tapa salvo el sombrero,
una de 28 entera — y ya la de 12 les tapaba la mitad. A un tipo que te dispara lo
tenés que ver.

**Cómo quedó:**

- **Las dos paredes largas son UN bloque por columna** (`bandaDe` en
  `cosasAltasDelTren`). La del fondo: tapa levantada 20 y **una** cara con **una**
  ventanilla. La de adelante, vista desde adentro, un borde de 3 px.
- **La cara de AFUERA de la pared de adelante** cuelga por debajo del vagón
  (`alturaCaraAfuera`, 18), con sus ventanillas y la sombra en la tierra. Va en
  el piso: nada queda detrás de ella, y los jinetes de abajo pasan delante.
- **La sombra de la pared del fondo** sobre las tablas.
- **Piso de un solo tono** (sin tablero), **asientos y carga sin la raya clara**.
- **`siluetaDeJinete`** (raidScene.js): el jinete de arriba se vuelve a dibujar
  entero en un color plano, recortado a la franja que tapa la pared. Se ve dónde
  está y el gesto de apuntar. `drawRider` no se enteró: se le pasa un renderer
  que pinta todo del mismo color.

**MEDIDO:** 0,39 ms por cuadro (antes 0,38), ningún error en el asalto ni en el
galope. **MIRADO:** pasajeros con un jinete arriba apuntando (en silueta) y otro
abajo (delante de la cara de afuera), el dormitorio, el refrigerado con la
plataforma, y la góndola. Las divisiones del dormitorio y las puntas de cada
vagón quedaron como bloques oscuros más pesados que el resto: a mirar con la
gente de cuerpo entero (etapa B).

**⚠️ NO JUGADO.**

### 🔧 Una tanda de ajustes antes de la etapa B

*(Santi, mirando la etapa A: cinco cosas)*. Se decidieron juntas, con un boceto
del galope delante, y se hacen de la más chica a la más grande:

| # | Pedido | Decidido | Estado |
|---|---|---|---|
| 1 | *"el vagón de góndola: da la sensación que no estoy en el techo. Una vez estoy sobre el carbón, ya no debería haber paredes que me detengan a la hora de caerme"* | **Caerse por las puntas**, a los enganches; los costados siguen siendo el borde del tren (descartado "también por los costados": caerse al desierto no existe y sería un sistema nuevo). Paredes bajas desde adentro | ✅ |
| 2 | *"una vez el jugador esté sobre el tren, se haga menos zoom"* | **Más resolución para todo el juego**: primero 480×270, y al medir quedó **420×236** (ver abajo). Descartado "zoom 0,8 sólo en el asalto": píxeles desparejos y carteles más chicos | ✅ |
| 3 | *"en la cabalgata la perspectiva esté en un punto que se pueda ver el cielo y las montañas a lo lejos"* | **Cámara baja**, como el boceto: cielo, montañas, el tren de costado y el desierto adelante. Se juega igual | ✅ |
| 4 | *"en la cabalgata el tren se debería ver como se ve un tren desde afuera"* | Sale con la cámara baja: techo, pared alta, ventanillas y ruedas | ✅ |
| 5 | *"A la hora del salto al techo o al enganche puedo mover al caballo y hasta ponerme por encima de la pared del tren"* | Lo explica la etapa A: la cara de afuera cuelga 18 px bajo el vagón y el caballo galopa desde 8 px. Con la cámara baja el caballo va en su carril, delante del tren | ✅ (con el 3) |

**La góndola (1):**

- **Sobre el carbón, afuera de la góndola no hay nada que te frene**
  (`world.solidoParaJugador`): las paredes de las PUNTAS no frenan —el carbón
  está a su altura— y del otro lado tampoco hay pared. Cruzás el borde y
  `caerDelCarbon` te pone en el enganche más cercano y llama a `caerAlEnganche`:
  el mismo golpe, cartel y ruido que errar un salto en el techo. **[E] sigue
  siendo la forma silenciosa** de bajar.
- **Desde adentro sus paredes se dibujan bajas**, como el borde de una tolva
  llena, y no tira sombra de pared sobre el carbón. Desde afuera la cara sigue
  alta, que es por lo que los jinetes no te alcanzan.

**MEDIDO:** caminando hacia la punta derecha por una fila de pared, **caés en 1,1
s** justo en el enganche (x=968, en el pasillo); por la izquierda, desde el
pasillo, también (x=472). Los costados frenan (abajo, en y=140, sin caerte), el
montículo frena, y desde el enganche sin trepar el carbón sigue siendo pared
(x=491 contra el borde en 496); [E] sigue trepando. Sin errores.
⚠️ En la prueba de ir hacia arriba el jugador no se movió de y=30: no se cayó ni
salió del carbón, pero **no está explicado** por qué no avanzó.

**⚠️ NO JUGADO.**

**La resolución (2):**

**⚠️ AL MEDIR APARECIÓ LO QUE NO SE HABÍA DICHO AL ELEGIR 480×270.** El canvas se
agranda en múltiplos enteros para que los píxeles queden nítidos, así que la
resolución decide el tamaño de la ventana. Medido en el monitor de Santi
(1920×1080, en una pestaña del navegador):

| Pantalla | 384×216 | 480×270 | **420×236** |
|---|---|---|---|
| La suya, en una pestaña | 1536×864 (×4) | 1440×810 (×3), 6% más chica | **1680×944 (×4)** |
| La suya, con F11 | 1920×1080 | 1920×1080 | 1920×1080 |
| Notebook de 1366 o 1536 | 1152×648 | 960×540, 17% más chica | — |

Se le mostró y **eligió 420×236**: un 9% más de mundo para cada lado sin que la
ventana se achique en su monitor. Y eligió **rehacer las escenas para llenar la
pantalla** en vez de centrarlas con un marco, y dentro de eso **estirarlas en
proporción** en vez de agregar cosas nuevas en el lugar que sobra.

**Cómo se estiró, sin reescribir coordenada por coordenada:** los datos siguen
en números de la pantalla vieja (`CONFIG.vistaVieja`), que es la escala en la
que se afinaron MIRÁNDOLOS, y se multiplican al cargar. Se mueven las
posiciones; los tamaños de las cosas quedan en píxeles, para que sigan nítidas.

- **Mapa** (`estirarRegion`, data/region.js): pueblos, vías, terreno y tu
  campamento; el marco toma el papel entero. En mapScene.js el veteado, las
  manchas, los bordes gastados, la rosa de los vientos y el cartucho dejaron de
  usar 384/216 escritos a mano.
- **Campamento** (data/camp.js): el centro, el radio (92 → 100) y los objetos.
- **Interiores** (`estirarInteriores`, data/interiors.js): la sala, la pared, la
  puerta, las posiciones y los largos de los muebles y los puntos; las cajas de
  choque de los muebles largos acompañan su largo nuevo.
- **Tienda** (shopScene.js): el escenario y la ficha, y lo de adentro del
  escenario pasa a medirse desde su borde de abajo, así el piso, el corral y el
  paño bajan con él.
- **Pueblo** (data/town.js): el alto y la calle (150 → 164); lo que gana arriba
  es cielo.
- **Asalto y galope**: se acomodaron solos. El tren queda con 38 px de paisaje
  arriba y abajo en vez de 28.

**MIRADO**, las once pantallas en una sola imagen: campamento, pueblo, los cinco
interiores, las dos tiendas, el mapa, el asalto y el galope. 🐛 **La casa de
empeños tenía el estante y un barril afuera del cuarto**: el estante terminaba en
x=392 con la pantalla de 384 y la pared en 340, así que ya estaba mal y el borde
de la pantalla lo cortaba sin que se notara. Se metieron adentro.

**MEDIDO:** canvas de 420×236, ningún error en ninguna escena, y el mouse del
mapa reconoce el circuito de la mina sobre sus coordenadas nuevas.

**⚠️ NO JUGADO.**

**La pantalla se adapta al monitor (sin bordes):**

*(Santi: "que haya un borde negro alrededor de la pantalla es temporal?" … "yo
quiero que quede como un juego normal de steam o cualquier plataforma")*

**⚠️ PRIMERO SE LE DIJO ALGO FALSO:** que con F11 el borde desaparecía porque
420×236 ×4 daba 1920×1080. Da 1680×944. La cuenta estaba mal y el borde seguía
aun en pantalla completa (120 px a cada costado, 68 arriba y abajo). La
resolución vieja, 384×216, sí entraba justa (×5).

Ninguna resolución fija llena todos los monitores (480×270 en una notebook de
1366×768 quedaba en 960×540). Se eligió lo que hacen los juegos de pixel art de
PC, sobre "fija en 480×270" y "estirar sin múltiplos enteros": **el tamaño del
píxel se elige primero, y el tamaño interno es lo que entra en la ventana**.

| Ventana | Múltiplo | Se ve |
|---|---|---|
| 1920×1080 | ×4 | 480×270 |
| 1366×768 | ×3 | 456×256 |
| 1600×900 | ×3 | 534×300 |
| 1000×900 (angosta) | ×2 | 500×450 |

- El múltiplo es el que deja el alto más cerca de 270 (`CONFIG.vistaIdeal`), sin
  bajar de 420×236 (`CONFIG.view`, que ahora es el mínimo). Medido en píxeles
  físicos (`devicePixelRatio`) para que Windows al 125% no lo desafine.
- Más ancho que 21:9 (`vistaAnchoMaximo` 2.4) deja franjas a los costados: ver
  dos vagones de guardias de más cambia el juego, no sólo el dibujo.
- **Las escenas fijas** (campamento, mapa, interiores, tienda) siguen armadas
  para 420×236 y se dibujan CENTRADAS (`renderer.centro`); su fondo llena lo
  que sobra (las matas del campamento cubren la pantalla entera, el papel del
  mapa y su marco toman todo). Los textos de arriba y abajo van a los bordes
  de verdad. El pueblo baja la calle a la mitad de lo que sobra y estira el
  cielo. El asalto y el galope ya seguían al tamaño de pantalla.
- **[ALT+ENTER]** pone la pantalla completa desde el juego, y traba [ESC]
  (`keyboard.lock`, Chrome/Edge) para que cerrar una tienda no te saque: para
  salir se mantiene apretado. El navegador no deja entrar solo sin una tecla.
- 🐛 El aviso `resize` no llegó al cambiar el tamaño desde las herramientas del
  navegador (ni un ResizeObserver). Ahora el bucle mide en cada cuadro y sólo
  rehace el canvas si cambió.
- 🐛 En la ventana angosta la tierra del pueblo no llegaba abajo (medía el alto
  viejo): quedaban 21 px con restos del cuadro anterior. Ahora llega al borde.

**MEDIDO:** láminas de las siete escenas en 1920×1080, 1366×768 y 1000×900, sin
bordes ni errores. **Lo que NO se pudo medir:** que se acomode solo al cambiar
la ventana EN VIVO — la pestaña de prueba está oculta y ahí el navegador no
dibuja ningún cuadro (0 en 600 ms), así que el chequeo por cuadro no corre. Se
forzó a mano y da lo de la tabla.

**⚠️ NO JUGADO.**

**El galope con cámara baja (3, 4 y 5):**

Cielo, montañas, el tren de costado y el desierto adelante. **SE JUEGA IGUAL**:
el tren sigue apoyado en `train.map.height`, que de costado pasa a ser la vía,
y `y` sigue siendo la distancia al tren — ahora se lee como profundidad (más
abajo es más cerca de la cámara). El `diff` de `scenes/rideScene.js` no toca
ninguna línea de `update` ni de las reglas del salto: todo lo cambiado es
dibujo.

- **El tren de costado** vive aparte, en `world/trenDeCostado.js`: lee
  `train.tramos` y pinta ruedas con un rayo que gira, bastidor, caja y techo.
  Nueve dibujos: coche de gente (barnizado por tipo, con linterna), furgón,
  blindado (remaches, sin ventanillas), cabús (con garita), ganado (tablas y
  vacas asomando, sin techo), plataforma (carga amarrada), góndola (costados
  bajos y el carbón hasta arriba), refrigerado (casi blanco) y la locomotora
  (ténder, cabina, caldera, biela, faro, miriñaque y humo). Colores en
  `CONFIG.colors.costado`. `drawTrain`, que sólo usaba el galope, se borró.
- **La altura de la caja la eligió Santi sobre una imagen** con 32, 48 y 64:

  | Caja | Techo sobre la vía | Cielo pegado al tren | Jinete / vagón |
  |---|---|---|---|
  | 32 | 49 | ~130 px, montañas a la vista | 55% — pero el vagón es una tira |
  | **48** | **65** | **~114 px, las montañas asoman** | **42%** |
  | 64 | 81 | ~98 px, montañas tapadas | 33% |

  El largo no se puede tocar (es la planta del juego, ~640 px). La locomotora
  se dibujó para 49 y se estira al alto de hoy, o quedaba más baja que los
  vagones.
- **El paisaje:** el cielo, el sol o la luna y dos cordilleras (mesetas atrás,
  lomas adelante) van en coordenadas de PANTALLA —están lejísimos, el zoom no
  los achica— y se apoyan en un horizonte a 30 px sobre la vía, detrás de la
  caja. El llano del fondo se ve por los enganches. La vía corre por toda la
  pantalla con durmientes que pasan (a 1,5 px por cuadro no hay efecto rueda de
  carreta). Con tormenta el cielo va gris y sin sol.
- **El caballo de perfil** con cuatro patas animadas y el jinete sentado; sigue
  rotando con el rumbo, ahora sobre los cascos. Los obstáculos más cerca de la
  cámara lo tapan. **Saltar:** el caballo queda abajo y el jinete sube en arco
  al piso del enganche o al techo, a la altura dibujada.
- **Los que te disparan:** el fogonazo va en la altura de las ventanillas y la
  bala se dibuja saliendo de ahí y bajando hasta el pecho del jinete. La bala
  de verdad (la que pega) no cambió.
- 🐛 **Estrellas en fila:** `(i * 137) % ancho` y `(i * 71) % alto` dibujaban
  rayitas diagonales en el cielo de noche — el mismo error de las matas del
  campamento. Ahora usan el mismo revoltijo.
- 🐛 **Flechas del salto encima del jinete:** iban a `base + 15`, que desde
  arriba estaba libre y de costado cae sobre el cuerpo. Ahora van debajo de los
  cascos.
- Para las fotos se agregó `FORAJIDO.services.ride.ponerEn(x, y)`: pone el
  caballo en un lugar exacto sin galopar hasta ahí. No lo usa el juego.

**MEDIDO:** once tomas (las nueve familias, locomotora, noche, tormenta, un
disparo, la bala en vuelo y los dos saltos) en 1920×1080 y una en 1366×768, sin
errores. Una corrida automática con el Criollo pegado al tren llega limpio al
**3er enganche** a los 35,4 s, con 9,5 s de reloj y 31 de aguante: es el alcance
de siempre del Criollo.

**⚠️ NO JUGADO.**

**🔁 CORRECCIÓN: EL GALOPE VA EN TRES CUARTOS, NO DE COSTADO.**

*(Santi: "El galope lo hiciste como si fuera plano o una vista de costado.
Recuerda que tiene que ser 3/4, es decir que se debería ver parte del techo del
tren, parte del lomo del caballo y el ala del sombrero")*, con una imagen de
referencia: cámara alta, desierto en toda la pantalla, el tren con su techo a la
vista y un jinete en diagonal.

**La equivocación fue mía:** Santi había elegido tres cuartos para todo el juego
y el galope se dibujó con la cámara a la altura del caballo. El boceto aprobado
decía "cámara baja", pero eso no cambiaba lo decidido antes.

- **El tren** (ahora `world/trenTresCuartos.js`; el de costado se borró): la
  regla de las dos caras del asalto. La pared con su alto y encima la TAPA del
  techo (14 px), con la linterna de los coches, la pasarela de los furgones y la
  escotilla del blindado. Los abiertos se ven desde arriba: el lomo de las vacas
  sobre las tablas, el carbón llenando la góndola, el piso y las cajas de la
  plataforma. La locomotora muestra el carbón del ténder, el techo de la cabina,
  el lomo de la caldera y la boca de la chimenea. Se cae a la mitad de la tapa
  (`alturaDeAterrizaje`; la góndola, más baja).
- **La vía** es una franja de balasto con durmientes vistos desde arriba y los
  dos rieles, y termina en `base + 3`: con la franja hasta `base + 8` el caballo
  pegado al tren se veía galopando encima de la vía.
- **El suelo** tiene adornos que no chocan, sembrados por celda sobre el suelo:
  pasto, piedritas y manchas en el campo (chiquitos, para no confundirse con
  obstáculos) y matas y cactus del otro lado del tren.
- **El cielo, sólo de lejos** *(elegido por Santi sobre "sin cielo, como la
  imagen" y "cielo siempre arriba")*: con el zoom abierto asoman 44 px de cielo
  con montañas arriba de todo, y se van a partir del zoom 0,75. La cámara baja
  lo mismo, así que no le tapa el tren a nadie. Choca con la imagen de
  referencia (que no tiene cielo) a propósito: es lo que queda de *"que se pueda
  ver el cielo y las montañas a lo lejos"*.
- **El caballo** con el lomo con luz, la manta roja y la montura; **el jinete**
  con los hombros, el chaleco, el brazo con las riendas y el ala del sombrero
  como una elipse con la copa en el medio. Los obstáculos muestran su parte de
  arriba (la tapa de la roca, las copas del arbusto, las puntas del cactus).

**MEDIDO:** dieciséis tomas en 1920×1080 sin errores, y recortes ×6 del caballo
cerca y lejos. La corrida del Criollo volvió a llegar limpio al 3er enganche, a
los 38,6 s con 6,3 de reloj (la anterior fue 35,4 con 9,5: los obstáculos y los
tiros se sortean en cada corrida; la lógica no se tocó).

**⚠️ NO JUGADO.**

**El caballo gira de verdad: cinco poses.**

*(Santi: "al mover al caballo con las teclas W o S, el caballo no parece que se
dirige hacia las vías o hacia abajo [...] es como que no gira la dirección en la
que corre, sino como que se mueve arriba o abajo")*

La causa eran dos cosas juntas: había UN dibujo de perfil que se inclinaba hasta
42° (se leía como subir una loma), y la cámara sigue al tren, así que en
pantalla el caballo casi no avanza a la derecha y parecía deslizarse.

| Opción | Qué | |
|---|---|---|
| 3 poses (recomendada) | perfil y una diagonal para cada lado | |
| **5 poses** | **suma una intermedia de cada lado** | **elegida** |
| sin poses | sólo polvo y sombra en diagonal | |

- `poseDelCaballo()` elige la pose por el rumbo: 0 hasta 0,15 rad, ±1 hasta
  0,45 y ±2 más allá (el máximo es ±0,73). Como el rumbo persigue a la tecla
  con la inercia de las riendas, las poses pasan de a una. Medido apretando W
  desde parado: 0 → −0,19 → −0,33 → −0,46 → −0,57 en 40 cuadros.
- El dibujo sale de cuatro medidas: el largo del cuerpo (20, 17, 14), el cuerpo
  en dos mitades a distinta altura (la diagonal), cuánto lomo se ve (5 … 1) y la
  cabeza (alejándose chica y alta con las orejas de atrás; viniendo grande, baja
  y de frente). El jinete, de espaldas con el chaleco, de perfil, o de frente
  con la cara bajo el ala; el ala se abre más cuanto más se aleja.
- La inclinación quedó al 30% del rumbo, sólo para suavizar el cambio de pose.
  La sombra se estira y el polvo sale para atrás del rumbo, no de la pantalla.
- 🐛 En las poses hacia las vías el cuello subía derecho hasta 11 px y el
  caballo se veía como una llama. Un cuello que se aleja se acorta: ahora mide 7.
- `ponerEn(x, y, rumbo)` acepta el rumbo, para fotografiar cada pose.

**⚠️ NO JUGADO.**

**🔺 De cinco a nueve poses** *(Santi: "podrías cambiarlo a 8 pasos?")*. Se le
preguntó qué quería decir y eligió **más poses en el mismo giro**, sobre "un
giro más cerrado" y "8 direcciones completas". Ocho justas no dejan pose de
perfil al medio: son **cuatro por lado más el perfil**, una cada ~10° del giro
de ±0,73 rad. Las medidas se calculan con la mitad de la pose y se redondean, así
que las de los extremos son las mismas de antes y las nuevas son intermedias.
Avisado antes de hacerlo: entre dos poses seguidas la diferencia es de 1 o 2 px.

**⚠️ NO JUGADO.**

**El caballo a la carrera: patas, cascos y polvo.**

*(Santi: "que el caballo tenga más pose de corredor y sus patas se muevan más
reales ('tucutún-tucutún-tucutún') y tenga el sonido de los cascos al golpear
la arena. Además, añádele una nube de polvo como la de la imagen")*

- **El sonido ya existía**, y se le dijo: el "tucu-TÚN" de tres pisadas. Lo que
  pasaba es que casi no se oía (*"súbele el volumen porque casi que no se
  escuchan las pisadas"*): eran ruido por debajo de 400 Hz, que en parlantes de
  notebook no suena. Ahora cada pisada son tres capas —el golpe sordo, un "toc"
  de medios y el soplido de la arena— y `zancadaVolumen` subió de 2,6 a 3,6.
  Eligió "los golpes de hoy + arena" sobre rehacerlos.
- **Las patas y el sonido no estaban sincronizados**: las patas iban con un seno
  parejo y el sonido con su propio reloj. Ahora el dibujo lee el reloj del
  sonido (`faseDeZancada`) y cada pata apoya en el instante de su golpe
  (`GOLPES`: trasera de allá a los 0 ms, trasera de acá y delantera de allá a
  los 85, delantera de acá —la fuerte— a los 175). Cada pata tiene muslo y caña
  que se doblan; apoya estirada adelante, barre hacia atrás y vuelve por el aire
  doblada. El lomo baja con las pisadas y sube en el momento en el aire.
- **Pose de corredor**: cuerpo más largo y bajo (22 de largo de perfil), cuello
  estirado con la cabeza baja, cola y crin volando y ondeando con la zancada, y
  el jinete echado hacia adelante según el esfuerzo.
- **El polvo** *(pedido "lo más realista posible")*: cada pisada levanta cinco
  bocanadas que SE QUEDAN SOBRE EL SUELO donde nacieron —el caballo las deja
  atrás—, crecen, suben, se frenan con el aire y se deshacen en 1,2 a 2,2 s. Van
  en tres círculos (sombra, cuerpo y luz). Usa `Math.random` y no el `rng` del
  juego: medido, la corrida del Criollo dio lo mismo con y sin polvo (38,6 s,
  6,3 de reloj).
- 🐛 La primera versión del polvo se vio como bolitas separadas en fila: tres
  chicas por pisada, todas hacia atrás, y ~50 px de suelo entre zancadas. Se
  pasó a cinco, más grandes y más largas, disparadas para los dos lados.

**⚠️ NO JUGADO — y el sonido hay que oírlo:** el volumen se eligió sin
escucharlo.

### ✅ Etapa B hecha — la gente de cuerpo entero

*(Santi: "seguí con la etapa B")*. Eligió **16 px de alto** (sobre 13 y 20: con
20 la persona es tan alta como la pared del fondo y el de la fila de atrás queda
tapado) y **4 direcciones** (sobre 8: el doble de dibujos para una diferencia que
a 16 px casi no se nota, y el arma ya apunta exacta).

- **Una sola figura para todos** (`entities/figura.js`): piernas que caminan,
  torso con cinto y brazos, cabeza (de frente con ojos, de espaldas con pelo, de
  costado con nariz) y cinco sombreros (ala, ancho, chico, copa, ninguno).
  Posturas de pie, agachado, sentado y de rodillas, brazos arriba y el arma
  apuntando al ángulo exacto. `dibujarTendido` para muertos y desmayados.
- **La caja que recibe las balas no cambió** (decisión de la etapa A): los pies
  van en su borde de abajo y el cuerpo crece hacia arriba. Todo lo que iba
  encima de la cabeza (barras de vida y sospecha, "!", "vigilando", las charlas,
  el reloj del pasajero asaltado) subió con ella. El cono de visión, el aro del
  ruido y la línea del golpe cuerpo a cuerpo siguen en el piso.
- **Los guardias y pasajeros no guardan en qué punto del paso van**, así que
  `faseDeAndar` lo deduce de cuánto se movieron entre cuadros (un paso cada 5
  px), en campos `_andar…` que no lee el juego.
- **El jugador** 🔁 ya no se aplasta contra la cobertura: se agacha detrás (y
  también en sigilo), y al asomarse se para y apunta. La mochila va en la espalda
  de la figura según hacia dónde mira. El fogonazo y la dinamita en la mano, a la
  altura del pecho.
- **Los guardias**: el color sigue siendo el estado y el tipo va en la silueta
  (placa, culatas y segundo caño, bandolera con los cartuchos que quedan,
  estrella, sombrerito de civil). Sentados de franco en su banquito, rendidos de
  rodillas con las manos arriba (y se paran de a poco al traicionar), desmayados
  sin sangre, muertos con sangre.
- **Los pasajeros**: el rico con galera, el asaltado con las manos arriba, el
  pánico temblando, el encubierto sacando el arma. La raya de hacia dónde mira
  quedó en el piso: cuatro direcciones son gruesas para saber si te ve.
- **El jefe**: la misma figura agrandada un 30% alrededor de los pies, con el
  poncho de dos puntas y el ala más ancha.
- **Los jinetes usan el caballo del galope**: se mudó a `entities/caballo.js`
  (junto con el jinete y `GOLPES`), así hay un solo caballo en todo el juego. 🔁
  Ahora corren hacia la derecha, como el tren; el dibujo viejo los tenía mirando
  a la izquierda sin motivo. La silueta detrás de la pared sigue andando porque
  todo se dibuja con `rect` y `line` (el ala del sombrero dejó de ser una
  `ellipse`).

**Lo que falta y es de otra etapa:** las balas todavía salen del piso aunque el
caño esté a la altura del pecho — eso es la etapa C, la altura de las balas.

**MEDIDO:** ningún error en la consola entrando al asalto y al galope. Láminas de
tres vagones enteros, los seis estados y los seis tipos de guardia, el jugador
en tres poses, los tres pasajeros, los dos jinetes y los de franco.

**⚠️ NO JUGADO.**

### 📏 La gente pasa de 16 a 16×24

*(Santi: "estaba pensando que al tener 16x16 cuando pongamos la ropa y los
detalles de los personajes prácticamente no se van a notar", y después de
comparar 16, 24 y 32 lado a lado y preguntar cuánto mide un personaje de
Stardew Valley: "hacelo 16x24")*.

- **Stardew Valley, para comparar:** cuadro de 16×32 (dos casilleros de 16) a
  480×270 escalado ×4 en 1080p — la misma pantalla que Forajido. 24 es la mitad
  de camino: se ve la ropa sin tener que agrandar los pasillos del vagón.
- **16×24 es el CUADRO, no el cuerpo.** Eligió **delgado, como Stardew** (sobre
  "lleno, 16 de ancho", que dejaba a una persona tan ancha como un asiento, e
  "intermedio"): torso de 9, con brazos 11; ala de 13, sombrero ancho 15, chico
  9, galera 11 y 27 de alto.
- **Filas nuevas:** piernas 8 (botas 2), torso 9 (camisa, cinto, cadera), cara
  4 (con la sombra del ala), sombrero 3 con el ala vista desde arriba. Agachado
  y sentado bajan 6; de rodillas, 7.
- **El jefe** crece **1,15** → 28 px (sobre 1,3 → 31, casi dos casilleros que
  tapaban a su escolta, y 1,0). El poncho y el rifle a la espalda, a la escala.
- **Lo que se movió con la figura:** la mano (y con ella el fogonazo, la
  dinamita y la mochila) a `pies − 13`; la placa, las culatas, la bandolera y la
  estrella (ahora del lado del corazón); los cuerpos tirados ×1,5; la estela de
  la embestida; y **los 11 carteles sobre el jugador** ("Saquear", "Espiar"…)
  suben 8 px, porque a −16 caían sobre la cara.
- **Lo que NO cambió:** la caja que recibe las balas (la de los pies), la
  lógica, los jinetes y el caballo. Los números flotantes (`+$`, avisos) nacen
  donde nacían y suben solos.

**🔁 CONTRADICE UNA RAZÓN DE LA ETAPA B:** se había descartado 20 porque "el de
la fila de atrás queda tapado". Con 24 pasa: un guardia parado justo detrás de
un asiento **muestra sólo la cabeza y el sombrero**. Mirado en captura, se lee
bien (es lo que se espera en tres cuartos), pero hay que confirmarlo jugando:
si molesta para apuntar, es tema de la etapa C (a qué altura van las balas).

**MEDIDO:** sin errores en la consola; lámina con los seis tipos de guardia, las
cuatro direcciones, sospecha, combate, rendido, traición, mecha, desmayado,
muerto, los pasajeros, el jugador con y sin mochila, agachado y disparando, y el
jefe de frente y de costado; captura del vagón real a 480×270.

**⚠️ NO JUGADO.**

### 🎩 Las sombras cabezonas: toda la gente en negro

> 🔁 **Reemplazada del todo** por "La gente curtida a 80 px" (más abajo). El
> juego ya dibuja la gente nueva y `data/siluetas.js` se borró en la etapa 2d.
> Esto queda como historia: lo único que todavía se dibuja así es el jinete del
> galope, hasta la etapa 5.

*(Santi, sobre la gente de 16×24: "creo que se ve muy feo. La verdad es que me
gustaría que diseñemos un tipo de arte, no una persona así parada que es muy
normal. Los juegos de este tipo se caracterizan por reconocerlos fácilmente")*.
**La gente de 16×24 queda reemplazada entera.**

**CÓMO SE ELIGIÓ, con láminas fuera del juego:**

1. Tres estilos sobre la misma escena del vagón: sombrerudos cabezones, grabado
   de cartel "Se busca" y siluetas a contraluz.
2. Cabezones + grabado (en tinta sobre el vagón normal y todo en sepia), y la
   idea de Santi: *"personajes totalmente negros (como si fueran sombras) y
   sombrerudos cabezones, pero que tengan detalles como una capa volando, un
   pañuelo, una insignia, etc. Y que esos detalles le den el color"*.
   **Eligió ésta.**
3. El aviso de estado, con los ojos solos midiendo **0 px de espaldas**:
   contorno de color (48 px), cinta de la gorra (6 px), marca encima (8 px).
   Después contorno más chico: por dentro (42 px), punteado (24), sólo arriba
   (26). Santi: *"y si solo ponemos el signo de pregunta amarillo o el signo
   rojo de exclamación por ahora"* → **"?" + barrita** (la barrita dice cuánto
   falta para verte, que es información para jugar) y **"!" fijo mientras
   pelea** (con el cuerpo negro, un "!" de un segundo dejaba al guardia sin
   nada que dijera que te está peleando).
4. Costado, caminata, posturas y los tipos que faltaban; y **8 direcciones**
   *(Santi: "quiero que hayan 8 direcciones en vez de 4")*: 5 dibujos, las
   tres de la izquierda en espejo.
5. El galope: *"el jugador va montado en un caballo normal, como el de ahora,
   pero el jugador sí es negro"*.

**DÓNDE VIVÍA** (hasta la etapa 2d, que lo borró): los dibujos, como tablas de
letras, en `data/siluetas.js` (sombreros, cuerpos de las 5 vistas con 3 cuadros
de paso, posturas y los detalles de cada tipo). `entities/figura.js` los
convertía en píxeles: `dibujarPersona`, `dibujarAviso` y `dibujarTendido`.

**QUIÉN ES QUIÉN** (el tipo en la silueta y sus detalles):

| Tipo | Sombrero | Detalles |
|---|---|---|
| Vos | vaquero | pañuelo rojo al viento, cinta roja, mochila de cuero |
| Guardia | gorra | cinta azul, insignia plateada, hombreras |
| Blindado | gorra | la placa de metal en el pecho |
| Pistolero | ala plana | guardapolvo al viento, dos culatas de marfil |
| Dinamitero | boina con pompón | bandolera con los cartuchos que le quedan |
| Encubierto | bombín | **igual que un pasajero** hasta que saca el arma |
| Sheriff | alto | cinta y estrella doradas, bigote blanco |
| Pasajero | bombín con flor | bufanda verde |
| Rico | galera | cinta morada, monóculo, moñito, cadena de oro |
| Cazarrecompensas (jefe) | ancho con copa dentada | capa roja que vuela |
| Sheriff (jefe) | alto | guardapolvo, estrella grande, bigote |
| Jinete de la ley | gorra | cinta azul, insignia (caballo de siempre) |

**EL ESTADO**, que antes era el color de todo el cuerpo:

- **Guardias:** los ojos (blancos, amarillos, rojos, grises si está aturdido)
  y encima de la cabeza, apilado: las muescas de vida si está herido, y arriba
  el "?" con la barrita o el "!". "Vigilando" y las charlas siguen igual.
- **Rendido:** de rodillas con un pañuelo blanco. 🔁 La traición: al 25%
  suelta el pañuelo (con las manos arriba todavía) y al 50% se para con los
  ojos rojos y el "!".
- **Pasajeros:** el asaltado con las manos arriba y su reloj; el pánico con su
  "!"; el encubierto, al pasar la mitad de sacar el arma, ojos rojos y "!".
- **Jefes:** la ORILLA de la silueta (gris aturdido, dorada invulnerable, roja
  furioso) y los ojos (casi apagados acechando, rojos furioso).
- **Desmayado** con "z" y sin sangre; **muerto** con sangre. Los dos, con
  brazos y piernas abiertos y el sombrero volado con la cinta de su tipo.

**🔁 CAMBIOS RESPECTO DE LO QUE SE HABÍA DECIDIDO, y por qué:**

- **Los jefes ya no se agrandan (1,15 → 1).** Medido en captura: con siluetas
  de un píxel la escala no entera mezcla cada borde con el piso y el jefe se
  veía marrón y transparente en vez de negro. Los distingue lo suyo: la capa o
  el guardapolvo, los ojos ámbar y la barra de vida que llevan siempre.
- **Los jinetes de la ley van en el caballo de siempre**, no en el negro de la
  lámina: siguen la regla que Santi eligió para el galope.
- **El color "a cubierto" del jugador se fue** con el cuerpo negro. Lo sigue
  diciendo la raya verde sobre la pared y la postura agachada.
- **La mochila pasó a cuero marrón** y el arma del jugador a gris: en negro
  sobre negro no se veían.
- **El pañuelo de costado es más corto:** en la lámina era una raya roja que
  cruzaba toda la figura.
- **Los carteles sobre el jugador** ("Saquear", "Espiar"…) volvieron a 16 px
  arriba: la gente volvió a ser bajita.

**LO QUE FALTA:**

- **De noche la silueta se pierde.** Medido en el galope nocturno: se ven el
  caballo, el pañuelo y la cinta, pero no el cuerpo. Es el borde de luz de
  luna de la lámina, que queda para cuando el asalto tenga noche (hoy sólo el
  galope se oscurece).
- **Las balas siguen saliendo del piso** aunque el arma salga de la mano: etapa C.
- **La capa se afina viéndola en movimiento.**
- `alertMark` (el "!" de un segundo) ya no se dibuja; el campo queda en la IA.

**MEDIDO:** sin errores en la consola, cargando todos los módulos. Lámina dentro
del juego con los seis tipos de guardia, el guardia en las 8 direcciones,
sospecha, casi te ve, combate, aturdido, herido, rendido, soltando el pañuelo,
parado a traicionar, de franco, con la mecha, desmayado y muerto; los pasajeros
(común, rico, asaltado, pánico, encubierto sacando el arma); vos en las 8
direcciones con y sin mochila, agachado, disparando y tirado; los dos jefes en
sus estados; los jinetes. Captura del vagón real y del galope de día y de noche.

**⚠️ NO JUGADO.**

### 🤠 La gente curtida a 80 px — DISEÑADA en una prueba aparte, falta llevarla al juego

*(Santi, después de jugar las sombras cabezonas: "le quita la crudeza del Salvaje
Oeste… parecían personajes como del Beholder: tiernos en cierto punto, sin
expresión y colores muy vividos")*.

**ESTADO:** todo se decidió en una prueba jugable **fuera del juego**:
`prototipos/gente-80px/` (doble clic en `Prueba-72.html`; el LEEME dice qué es
cada archivo). **El juego todavía dibuja las sombras cabezonas.** Pasar a esto
necesita subir la resolución, y ese plan se arma y se aprueba aparte.

**LAS DECISIONES, en el orden en que se tomaron:**

1. **Estilo "gente curtida"**: caras quemadas por el sol, barba, ropa gastada y
   ojos con expresión (tranquilo, "oyó algo" de reojo con una ceja arriba, "te
   vio" con el ceño y los dientes apretados).
2. **Más resolución, viendo lo mismo del vagón.** Se probaron 36, 40 y 72 px
   (Santi, del de 72: "se veía espectacular"). En pantalla ocupan casi lo mismo:
   lo que cambia es cuánto detalle entra. A 72 px, cada cuadradito del dibujo es
   un punto de un monitor 1080p.
3. **Contraste**, porque a tamaño real se leían peor que las sombras: borde
   oscuro de 2 puntos, el pasajero de traje gris (el marrón se perdía contra el
   piso) y **los avisos "?" y "!" del tamaño de hoy**. Achicarlos junto con el
   personaje fue un error: quedaban de 16 puntos.
4. **80 px**, entre 72, 80 y 88 ("apenas un poco más grandes"). Dibujados con
   las mismas formas a más tamaño, nunca estirados.
5. **Trote en vez de caminata** *(Santi: "nadie asalta un tren caminando")*. A
   78 u/s, caminar con un paso cada 5 eran 15,6 pasos por segundo y parecía
   cámara rápida. **Un paso cada 20**, entre 12, 16 y 20 ("más pausado, más
   realista"). Los guardias caminan patrullando (24) y trotan persiguiendo (46).
6. **Shift = agachado**: lento (40), sin ruido y con la caminata.
7. **Proporciones A**, sobre "B suave" y B *(Santi: "B caracterizaría más al
   juego, pero siento que el A es más normal")*.
8. **El cuerpo mira al mouse** y las piernas trotan igual aunque vayas para
   atrás; el revólver, en las 8 direcciones.
9. **Piernas largas.** Santi, con su muñeco de madera para poses: *"las piernas
   miden lo que mide el torso + lo que mide la cabeza. En el juego, las piernas
   apenas llegan a medir lo que mide el torso"*. Medido: 19 filas de piernas
   contra 43 de cabeza + torso (44%). Elegida la opción 1: **cabeza 15, torso 20,
   piernas 27** (77%), con el mismo alto total. La opción 2 (100%) dejaba la cara
   sin detalle; la 3 hacía al personaje 32% más alto.
10. **Pisada con empuje**: contacto adelante, apoyo con la rodilla cargada,
    empuje con la pierna de atrás estirada y un vuelo corto. Con las piernas
    largas, *"ya no se nota"* que patine.

**🔁 LO QUE SE DESCARTÓ EN EL CAMINO, y por qué:**

- **Proporciones B** (ala +15%, hombros +9%, cintura −10%): Santi eligió lo
  normal. Al probarla aparecieron dos errores míos de la deformación, que se
  corrigieron antes de elegir: al inclinarse, la copa del sombrero se corría
  más que la cabeza ("como que se le va a salir"), y la cintura achicaba
  también los brazos ("tiene metidos los codos para adentro").
- **La pisada corta** (2 cuadros apoyado y la pierna de atrás encogida): en
  números patinaba la mitad, pero *"parece que está saltando a dos pies"*. El
  problema de fondo eran las piernas cortas, no la pisada.
- **Achicar la cabeza deformándola**: el ala tapaba los ojos y bigote, boca y
  mentón quedaban pegados. Se redibujó a 15 filas (`l72-cabezas.js`). El torso
  achicado se miró ampliado ×4, no perdió nada visible y quedó así.
- **88 px y velocidad 64**: no hicieron falta.

**LOS NÚMEROS QUE QUEDAN:**

| Qué | Valor |
|---|---|
| Alto del dibujo | 80 px (83 puntos en 1080p, con sombrero) |
| Cabeza / torso / piernas | 15 / 20 / 27 filas |
| Borde | 2 puntos: negro por dentro, media sombra por fuera |
| Trote | 78 u/s, un paso cada 20 (3,9 pasos/s), 8 cuadros con un momento en el aire |
| Agachado | 40 u/s, sin ruido, caminata de 5 dibujos |
| Guardias | patrullan caminando a 24, persiguen trotando a 46 |
| Avisos | "?" con barrita y "!", con cuadraditos de 4×4 puntos |
| Balas | salen de la mano, 9 unidades sobre el piso, con una sombrita que marca por dónde van |

**LO QUE FALTA:**

- **El plan para pasar el juego a esta resolución**: resolución interna, cámara,
  lógica sin cambios, orden de redibujo, textos del HUD, y 1440p y 1366×768.
- **La nube de polvo al pisar** *(Santi: "luego vemos si le agregamos el polvo")*.
- **El resto de la gente**: blindado, pistolero, dinamitero, sheriff, rico,
  jefes, jinetes; las posturas (sentado, rendido, tendido); los caídos de verdad
  (en la prueba se acuesta el dibujo parado).
- **El guardia apuntando hacia abajo se lee poco**: la manga es del mismo azul
  que el saco.
- **El vagón a la misma densidad**: en la prueba es el de hoy agrandado ×4, y se
  nota la mezcla de cuadraditos gordos con gente fina.

**VERIFICADO en la prueba:** sin errores en la consola. El sigilo usa los
números del juego (vista 118, apertura 0,95, sospecha, oído 58). Secuencia
completa: te oye, se da vuelta, te ve, te persigue trotando, se para y te
dispara; el otro guardia oye los tiros y viene. Dos tiros bajan a un guardia.
Las pisadas se compararon con una marca clavada al piso, cuadro por cuadro.

**✅ JUGADO POR SANTI:** el trote y el tiroteo *("se sienten bien")*, hacia dónde
apunta cada uno *("se entiende")*, las piernas y la pisada *("mucho mejor, es el
ideal")*.

### 🔎 ETAPA 1 de la resolución nueva: la lupa — HECHA, y a propósito no cambia nada a la vista

**LA IDEA:** en vez de dibujar en una pantallita de 480×270 y agrandarla, el
canvas pasa a medir puntos de verdad (1920×1080) y todo se dibuja a través de
una **lupa fija de ×4** (`DENSIDAD`, en `engine/renderer.js`). Un guardia que
está en la posición 118 sigue estando en la 118: `r.width`/`r.height` siguen
dando 480×270 y **ninguna medida de la lógica se tocó**. Las ~800 llamadas de
dibujo del juego siguen funcionando sin cambiarles una coma: cada punto suyo
ahora se pinta como un bloque de 4×4, o sea igual que antes. Lo que se gana es
que el arte nuevo puede dibujarse de a cuartos de unidad.

**LO QUE CAMBIÓ, y es poco:**

- `medirVista` ya no baja el múltiplo para que entren las escenas fijas: elige
  escala entera sobre la densidad (1 en 1920×1080 y en 2560×1440, 2 en 4K).
- Las escenas armadas para `CONFIG.view` (campamento, pueblo, interiores, mapa,
  tienda) piden su **propia lupa** con `r.escenaFija()`, que baja la densidad
  hasta que entren. En 1920×1080 es la misma del mundo, así que no se nota.
- El redondeo de cada primitiva pasó a ser al punto de pantalla y no a la
  unidad; con coordenadas enteras da exactamente el mismo dibujo.
- El mouse se divide por la densidad (`createInput(canvas, () => renderer.densidad)`),
  o apuntar habría quedado corrido ×4.
- **El texto mejoró solo:** son los mismos 8 de siempre, pero ahora se dibujan
  con 32 puntos de alto, así que dejaron de ser bloques.
- Una guarda nueva: si la ventana mide 0 (una pestaña oculta), no se toca el
  canvas. Sin eso quedaba en 300×150 y había que recargar.

**CUÁNTO MUNDO SE VE** (era la decisión abierta; Santi eligió la opción A, que
en un monitor chico se vea menos vagón antes que perder nitidez):

| Monitor | Antes | Ahora |
|---|---|---|
| 1920×1080 | 480×270 | **480×270, igual** |
| 2560×1440 | 512×288 | 640×360 |
| 3840×2160 | 480×270 | 480×270 |
| 1366×768 | 456×256 | 342×192 (y las escenas fijas bajan a lupa ×3) |

**MEDIDO:** sin errores en la consola. Canvas 1920×1080 con 480×270 unidades y
densidad 4; **0,99 ms por cuadro** con el asalto lleno (unos 1000 por segundo,
con el bucle parado y dibujando a mano), así que el temor de que 16 veces más
puntos costara caro no se cumplió. El mouse en el centro de la pantalla da
240×135, o sea que apuntar quedó exacto. Capturas del asalto, el campamento, el
galope, el mapa, el pueblo y un interior: idénticos a antes, con el texto más
nítido. En 1366×768: el asalto en 342×192 con densidad 4 y el campamento en
456×256 con densidad 3, entrando entero.

**⚠️ NO JUGADO** por Santi todavía.

### 🤠 ETAPA 2a: la gente nueva YA ESTÁ EN EL JUEGO (falta lo demás de la etapa 2)

Los dibujos de la prueba pasaron al juego, en `entities/gente/` (`dibujo.js`
con los colores, la ropa de cada tipo, el lienzo y los sombreros; `cabezas.js`;
`frente.js` con frente, tres cuartos y espaldas; `costado.js`).
`entities/figura.js` es el puente: arma cada figura UNA vez, la guarda y
después sólo la estampa. Sin eso, dibujar punto por punto a veinte personas en
cada cuadro sería carísimo.

**Lo que ya anda:** vos, los guardias (común, blindado, pistolero, dinamitero,
sheriff), los pasajeros, el rico y el encubierto, en las 8 direcciones, con
trote, caminata (los guardias patrullando caminan y persiguiendo trotan),
agachado, apuntar, las manos arriba del asaltado, la mochila que crece con el
botín, el destello del balazo y los avisos "?" y "!" de siempre.

**Lo que faltaba (2b, 2c, 2d):** las posturas sentado y rendido, los caídos, los
jefes con su orilla, las muescas de vida, los cartuchos del dinamitero y borrar
`data/siluetas.js` — todo cerrado más abajo. El jinete espera a la etapa 5.

**MEDIDO:** sin errores. **0,97 ms por cuadro** con el vagón lleno, igual que
antes de la gente nueva, porque las figuras se arman una sola vez.

### 👑 ETAPA 2c: los jefes, sí; los jinetes, todavía no

**LOS JEFES** ya se dibujan con el arte nuevo: el Cazarrecompensas con su capa
roja al viento y el Sheriff con su guardapolvo y su estrella grande. Van a
**escala 1,15**, que es lo que los separa de un guardia con otra ropa: su caja
también es más grande, así que agrandarlos no es mentir. La ORILLA de color
(gris aturdido, dorada invulnerable, roja furioso) se dibuja tiñendo la misma
figura y corriéndola un punto para cada lado.

🔁 **Los ojos ya no fuerzan la cara de alerta.** El jefe manda siempre un color
de ojos (ámbar, apagado mientras acecha) y con eso quedaba siempre con el ceño
fruncido. Ahora la cara la decide `estado`, y el pasajero encubierto pasa
`estado: 'alerta'` cuando saca el arma.

⚠️ **EL JINETE QUEDA PARA LA ETAPA 5, y es una desviación del plan.** Se probó
dibujarlo con la gente nueva montada en el caballo de siempre y **se ve peor que
antes**: el caballo es el dibujo viejo, más chico, así que a escala normal lo
monta un gigante y a escala 0,5 el cuerpo queda hundido en el lomo, sin leerse
(probado con las dos escalas y mirado ampliado ×6). El jinete y el caballo son
UNA sola imagen: hay que redibujarlos juntos, cuando le toque al galope.

### 🐛 ARREGLADA · Los guardias temblaban a cubierto, y el dibujo sólo lo puso a la vista

*(Santi: "por qué cuando los guardias están cubiertos es como que titilan o
tiemblan?")*

**LA CAUSA NO ERA EL DIBUJO: era el movimiento.** `moveToward` (systems/ai.js)
daba SIEMPRE el paso entero, aunque al destino le faltara menos: el guardia se
pasaba de largo, al cuadro siguiente volvía, se pasaba otra vez, y quedaba
vibrando alrededor del punto para siempre.

**Medido en un guardia a cubierto,** mirando su distancia al punto del reparo
cuadro a cuadro: saltaba **4,2 puntos por cuadro** y cambiaba de sentido **35
veces en 90 cuadros**. Con el tope puesto (el paso nunca es más largo que lo que
falta): llega, y se queda **clavado 73 de 89 cuadros, con 1 solo cambio de
sentido**. La ronda de los que patrullan sigue igual (los de cerca caminaron 100
y 120 unidades en 5 segundos; los que no se mueven están a más de 780 y el juego
ni los simula).

**Por qué apareció recién ahora:** el temblor siempre estuvo, pero con siluetas
de 15 px y piernas que se movían todo el tiempo no se leía. Con gente de 80 px y
los pies quietos, se ve.

**Y además, antes de encontrar esto**, el dibujo ya había mejorado dos cosas que
siguen valiendo: asomarse es **doblarse y no caminar** (los pies se quedan en el
reparo, ver `ancla` en figura.js), y el paso se cuenta por **cuánto avanza de
verdad**, no por cuánto se mueve.

### 🧹 ETAPA 2d: se borró el dibujo viejo

`data/siluetas.js` ya no existe. Era el archivo de las sombras cabezonas —los
sombreros, los cuerpos de las cinco vistas con sus tres cuadros de paso, las
posturas y los detalles de cada tipo, todo como tablas de letras—, y lo
reemplazó entero `entities/gente/`.

**Lo único que había que conservar** eran las dos tablas que traducen el nombre
que usa el juego al nombre del dibujo: el `look` de cada guardia (`placa`,
`bandolera`, `civil`…) y el `id` de cada jefe. Ahora viven al lado de la ropa,
en `entities/gente/dibujo.js`, como `ROPA_DE_LOOK` y `ROPA_DE_JEFE`, y salen
por `entities/figura.js`, que sigue siendo la única puerta al dibujo de la
gente.

⚠️ **Queda un resto, a propósito:** el jinete del galope
(`entities/caballo.js`) todavía es la sombra cabezona, así que se copiaron ahí
las dos únicas constantes que usaba (el negro y el color de los ojos). Son
cuatro líneas con un cartel que dice cuándo se van: en la etapa 5, cuando se
redibuje el caballo junto con su jinete.

**MEDIDO:** sin errores en la consola, y todo lo que se dibujaba se sigue
dibujando: el Cazarrecompensas y el jugador en el asalto (mirados ampliados
×5), los guardias, los pasajeros y el galope con su jinete.

**⚠️ NO JUGADO.**

### 🔧 Cierre de la etapa 2: las muescas de vida y los cartuchos

Dos cosas que habían quedado colgadas del arte nuevo.

**LAS MUESCAS DE VIDA se habían quedado chicas.** Estaban dibujadas para una
persona de 15 unidades y un solo color: dos rectangulitos pelados de 3×2, sin
orilla. Al lado de alguien de 80 px eran dos manchitas amarillas **del mismo
tamaño que el "?"**, y encimadas con él: no se sabía cuál era cuál.

Ahora las dibuja `dibujarVida` (entities/figura.js), una sola función para el
guardia y para el jefe:

| | Antes | Ahora |
|---|---|---|
| Ancho de la fila | crecía con la vida (7 u con 2, 15 u con 4) | **fijo, 12 u** (15 el jefe) |
| Alto | 2 u | **2,5 u** (3 el jefe) |
| Orilla | ninguna | **2 puntos oscuros, la misma que la gente** |
| Muesca vacía | `#4a3a2a` | `#4a3a22`, adentro de la orilla |

El ancho fijo es lo que ya había aprendido la barra del jefe *(con 8 de vida y
muescas de ancho fijo, la barra flotaba sobre medio vagón)*: **se reparte un
ancho y de ahí sale la muesca, nunca al revés.** Y el paso se calcula en PUNTOS
DE DIBUJO enteros, porque con pasos fraccionarios las muescas se agrupaban de a
2-4-2. La barra del jefe pasó a usar la misma función: quedaron los dos iguales,
que es lo que corresponde —es la misma información.

**LOS CARTUCHOS DEL DINAMITERO ahora bajan de verdad.** Estaban clavados en
cuatro: la bandolera se dibujaba llena aunque acabara de tirar las dos dinamitas.
Eso rompía algo que estaba escrito en el diseño desde antes —*"la ventana se VE,
porque los cartuchos se dibujan según lo que le queda"* (`dinamiteroRecarga`,
data/config.js)—: mientras recarga está literalmente desarmado, y si la correa
no cambia esa ventana no se puede aprovechar.

Lleva **2 dinamitas** y la correa tiene **4 lugares** dibujados, así que cada
dinamita son dos cartuchos: llena 4, con una sola 2, vacía 0. Se gastan de
arriba hacia abajo (el de más arriba es el que agarra) y los gastados quedan
como **huecos oscuros**, no desaparecen: se ve la correa vaciarse y volver a
llenarse. El dato va por el dibujo (`extras` ahora recibe los datos de la
figura) y **sólo se calcula para quien lleva bandolera**, para no guardar una
figura distinta por cada guardia y por cada dinamita.

**MEDIDO:** **0,57 ms por cuadro** con el vagón lleno, los 16 guardias heridos
(todos dibujando muescas) y un tercio de ellos con bandolera. Sin errores en la
consola.

**⚠️ NO JUGADO.**

### 🚃 ETAPA 3: el vagón, al detalle de la gente

*(Santi eligió la opción C sobre la lámina de `prototipos/vagon/`: el detalle
sobrio en todo el vagón y el desgaste SÓLO donde quiere decir algo)*.

**EL PROBLEMA, EN UN NÚMERO.** Una casilla del tren mide 16 unidades, o sea un
lienzo de **64 puntos de dibujo** con la lupa de ×4. El piso de esa casilla eran
**dos rectángulos**: un color plano y una raya. Al lado de una persona de 80
puntos dibujada punto por punto, el vagón quedó liso.

**LO QUE SE REDIBUJÓ** (todo en `world/piezas.js`, y `world/train.js` sólo lo
estampa):

| Pieza | Antes | Ahora |
|---|---|---|
| Piso | un tono y una raya cada 16 unidades | tablas de 4 unidades con veta, junta y clavos |
| Pared | una franja de color | tablas VERTICALES —al revés que el piso, para que no se confundan— con zócalo y sombra al pie |
| Canto de la pared | una raya clara | chapa con costura y remaches |
| Ventanilla | dos rectángulos azules | marco con orilla de 2 puntos, reflejo cruzado, travesaño y polvo abajo |
| Asiento | dos rectángulos | respaldo con listones, almohadón con botones, brazos y patas |
| Cajón | dos rectángulos | tablas, fleje de hierro con remaches y la marca del correo |
| Pasarela | chapa lisa | chapa estriada con el hierro del enganche |
| Salida y baranda | rectángulos | estribo con escalones; postes y travesaño |

**EL DESGASTE ES INFORMACIÓN, NO RUIDO.** Es lo que separa la opción elegida de
"ensuciar todo": el vagón ocupa la pantalla entera y no tiene que competir con
la gente. Va sólo en cuatro lugares, y cada uno dice algo:

- **el piso del PASILLO** (la madera lustrada por el paso) — y el pasillo se
  saca de las paredes de cada columna, no de un número fijo, así vale igual
  para un vagón alto que para uno bajo;
- **la marca del cajón del correo**, que dice de qué vagón es lo que vas a robar;
- **el polvo abajo de la ventanilla**, que es dónde está pasando el juego;
- **el cuero pelado de algunos asientos**, no de todos: uno usado entre varios
  sanos dice "acá viaja gente"; todos iguales serían una textura.

🔻 **DOS COSAS QUE HUBO QUE REHACER MIRÁNDOLAS.** La primera versión del asiento
llevaba el respaldo apenas más oscuro que el almohadón y **una fila de asientos
se leía como una fila de cajones**: lo que lo arregló fue el CONTRASTE entre las
dos partes (madera oscura arriba, cuero claro abajo, y una línea negra entre
las dos). Y la marca del cajón eran tres palitos que en pantalla se leían como
una **"H" puesta por accidente**; ahora es un sobre.

**MEDIDO — Y SALIÓ MÁS BARATO QUE ANTES.** Contando las llamadas de dibujo de
un cuadro entero, en el mismo vagón y desde la misma posición:

| | Llamadas de dibujo por cuadro |
|---|---|
| Vagón viejo | **1193** |
| Vagón nuevo, con las piezas ya armadas | **955** |

Diez veces más detalle y **un 20% MENOS de llamadas**, porque cada casilla pasó
de varios rectángulos a **una sola estampa**. El precio se paga una vez: el
primer cuadro que muestra un vagón nuevo dibuja 7.606 rectángulos armando sus
piezas, y después no dibuja ninguno más. Recorrido un tren entero, lo guardado
son **60 piezas, 970 KB**.

El reloj del navegador no da medidas estables en esta ventana (la misma escena
midió entre 0,5 y 2,3 ms de un intento a otro), así que el número de arriba es
el que vale: son llamadas contadas, no tiempo estimado.

**⚠️ NO JUGADO.**

### 🪑 Después de jugarlo: los asientos en pares y las puertas

*(Santi, jugando la etapa 3: "se debería mejorar el cómo se ve las puertas entre
los enganches, también mejorar los asientos del vagón de pasajeros. Los asientos
deberían estar en pares mirando hacia la locomotora")*.

**LOS ASIENTOS AHORA MIRAN A LA LOCOMOTORA**, que va a la derecha: el respaldo
queda a la izquierda y la gente mira para allá. Un PAR son los dos asientos de
las dos filas de la banda, uno al lado del otro, y **el hueco para cubrirse es
el espacio para las piernas**: lo que queda entre el respaldo de un par y el
almohadón del par de atrás.

**EL BANCO PASÓ DE TRES BALDOSAS DE FONDO A UNA.** Tres baldosas no son un
banco, son un tabique: un asiento de verdad mide lo que mide un respaldo más un
almohadón. Todo lo que sobró se volvió hueco:

| | Fondo del banco | Huecos | Tamaño | Piso libre en las bandas |
|---|---|---|---|---|
| Antes | 3 baldosas | 14 | 2×2 | 28 baldosas |
| Primer intento | 1 baldosa | 14 | 4×2 y 5×2 | 60 baldosas |
| **Ahora** | **1 baldosa** | **24** | **2×2** (dos de 3×2) | **50 baldosas** |

🔻 **EL PRIMER INTENTO DEJÓ LOS HUECOS ENORMES.** Se eligió el reparto que
mantenía los catorce huecos de siempre, y para eso cada hueco quedó de cuatro
o cinco baldosas: sesenta y cuatro unidades, seis personas de ancho. *(Santi,
jugándolo: "el espacio entre los asientos es enorme")*. Un espacio para las
piernas mide más o menos lo que mide el asiento, así que ahora el hueco es de
DOS baldosas y los pares entran cada tres.

⚠️ **Y ESO SUBIÓ LOS HUECOS DE 14 A 24, que es un cambio de equilibrio.** Es
el precio de que el vagón se vea como un vagón: con bancos finos y huecos
finos, entran más. No es todo a favor del jugador —los guardias también se
cubren ahí (`atCover`, systems/ai.js)— pero hay que jugarlo antes de darlo por
bueno. El fondo del hueco sigue siendo de dos baldosas, que es lo que de
verdad te tapa del que viene por el pasillo.

🔻 **LO QUE COSTÓ QUE SE LEYERA: EL RESPALDO TIENE QUE LEVANTARSE.** La primera
versión dibujaba el respaldo y el almohadón a la misma altura y un par se leía
como **un ropero de dos puertas**. Un asiento es una tabla ALTA con un almohadón
BAJO adelante, y en tres cuartos eso son dos alturas distintas —como las paredes
y los cajones—: el respaldo se levanta 8,5 unidades y el almohadón 5. Recién ahí
se lee.

**LAS PUERTAS DE LOS ENGANCHES eran un rectángulo de un color con una raya al
medio**, y abierta era ese mismo rectángulo a medio borrar: en pleno tiroteo no
se distinguía una abierta de una cerrada. Ahora:

- **Son dos hojas**, porque el hueco mide tres personas de ancho: madera con sus
  tablas y su cruz de San Andrés, o chapa con remaches y volante si es la
  blindada del vagón blindado.
- **Abierta, las hojas se pliegan contra las paredes**: el paso se ve libre
  porque lo está. Eso es lo que arregla el problema de fondo.
- **La tranca** es un tablón clavado en diagonal, en el rojo de "esto ya no es
  gratis", y no va cuando la puerta está abierta.
- **La madera va más clara que la pared:** con el color de la pared la puerta
  quedaba casi negra contra el enganche, que ya es oscuro.
- Las muescas de daño pasaron a ser las mismas que la vida de un guardia.

**NO TODAS LAS CASILLAS 'S' SON ASIENTOS**, y reacomodarlas todas lo dejó a la
vista: de los cinco vagones que las usan, sólo el de **pasajeros** y el de
**primera clase** tienen asientos. Los otros tres ya decían en su propio diseño
qué eran —*"dos literas"* (observación), *"camarotes"* (dormitorio), *"mesas de
cartas y catres"* (guardias)— y se dibujaban como asientos igual. Ahora
`mueble: 'cama'` en data/wagons.js los manda a `piezaCama`: armazón de madera,
colchón, manta doblada y la almohada en la cabecera, sin respaldo, porque una
cama es BAJA y LARGA. Y los sillones de primera clase pasaron de dos baldosas
de fondo a una, como los asientos.

**MEDIDO:** 888 llamadas de dibujo por cuadro en el vagón de pasajeros (el
vagón viejo hacía 1193), 78 piezas guardadas y 1,4 MB. Veinticuatro huecos
contados en el mapa de verdad. Doce trenes sorteados enteros, recorridos vagón
por vagón: ni un pasajero, guardia o bulto quedó adentro de una casilla sólida
y ningún error en la consola, ni ahí ni en el galope, el campamento y el
pueblo.

**⚠️ NO JUGADO.**

### 🏜️ Afuera del tren era un vacío oscuro

*(Santi, jugándolo: "una vez el jugador llega al interior del tren, la parte de
afuera no parece desierto, parece un vacío oscuro")*.

**LA CAUSA:** el asalto limpiaba la pantalla con un marrón casi negro y metía
las cinco capas del parallax en una franja de **veinte unidades** pegada al
borde. El tren ocupa de la 55 a la 215 de una pantalla de 270, así que entre esa
franja y el vagón quedaban más de treinta unidades de color plano. Un color
plano no es desierto: es un agujero.

**AHORA LA FRANJA ENTERA ES EL DESIERTO**, del mismo color que el del galope
—así el afuera es el mismo lugar en las dos escenas y no dos sitios distintos— y
ordenado por distancia a la vía:

    balasto ─ rastrojo ─ matorrales ─ cerros, allá en el fondo

Las cinco capas de siempre siguen siendo las mismas: lo que cambió es que se
reparten en TODA la franja en vez de amontonarse contra el borde. Y se sumaron
dos cosas: **el balasto** pegado al vagón —la piedra de la vía es lo que dice
"esto es un tren" sin dibujar un solo riel— y **manchones de tierra**, porque un
relleno de un solo tono se lee como vacío por más que tenga el color del
desierto: lo que lo convierte en suelo es que tenga partes.

🔻 **DOS VECES HUBO QUE CORREGIR LA NOCHE.** El primer intento usó
`desiertoNoche` tal cual y pintó la grava MÁS OSCURA de noche, como si fuera una
sombra: la franja quedó **más negra que antes del arreglo**, justo lo contrario
de lo pedido. De noche el suelo está oscuro y lo que hay ENCIMA agarra la luna —
la piedra, el rastrojo, los manchones—, y eso es lo que lo vuelve suelo. Además
el suelo del asalto va un paso más claro que el del galope: allá el desierto
llena la pantalla con sus cactus y sus piedras y un suelo casi negro se lee
igual; acá es una franja angosta.

**MEDIDO:** sin errores, mirado de día y de noche, en 1920×1080 y en
1366×768, y también desde el techo.

⚠️ **SIGUE SIN GUSTARLE, Y QUEDA ABIERTO** *(Santi, después de jugarlo: "la
verdad es que se sigue viendo demasiado feo, pero lo dejaremos para después")*.
Lo de arriba arregló la CAUSA —ya no es un color plano— pero no alcanzó. Hay
que volver, y probablemente con lo mismo que funcionó para la gente y para el
vagón: dibujar el desierto A LA RESOLUCIÓN NUEVA (piedras, matas y cactus
vistos desde arriba, cada uno una pieza guardada) en vez de seguir con las
rayitas del parallax, que son de la resolución vieja. Va con la ETAPA 5, que
es la del galope y el afuera.

### 🧗 ETAPA 7: el techo — la última

*(Santi: "me gustaría incluir una nueva etapa dedicada especialmente para el
techo. Esa será la última")*.

Queda anotada y **no empezada**. El orden de la mudanza a la resolución nueva
queda así: **1** la lupa ✅, **2** la gente ✅, **3** el vagón ✅, **4** los
objetos y las balas, **5** el galope y el afuera (con el jinete, que es lo último
que queda del dibujo viejo), **6** las pantallas fijas, y **7 el techo**, que se
lleva una etapa entera para él solo.

### 🎯 ETAPA 4: los objetos y las balas

Lo último que quedaba dibujado en unidades enteras adentro del vagón. El patrón
es el mismo de siempre: cada cosa se arma UNA vez como pieza y después se
estampa, con el mismo taller que el vagón y la gente (`world/piezas.js`, que
ahora exporta `pieza()` para lo que no es una casilla del tren).

| | Antes | Ahora |
|---|---|---|
| Bala | cuadrado de 1 unidad + estela de 1 unidad de ancho | grano de 2 puntos con núcleo, estela de **un punto** |
| Fogonazo | cuadrado de 4×4 unidades | tres lenguas de fuego saliendo del caño |
| Bolsa | 2 rectángulos | arpillera panzona, atada, con los pliegues |
| Caja fuerte | 3 rectángulos | chapa remachada y cerradura; reventada, el oro adentro y la tapa arrancada |
| Dinamita | 2 rectángulos | cartucho con papel encerado, dos bandas y mecha |
| Barril | 8 rectángulos | duelas, dos aros con remaches, **8 cuadros** de la rodada |
| Cajón | 5 rectángulos | tablas y flejes de hierro |
| Mercadería (11 cosas) | 3 o 4 rectángulos cada una | pieza propia con orilla y su detalle (los cuellos de las botellas, la cruz del botiquín, el sello de los papeles) |

**LAS MUESCAS DE DAÑO de los cajones y los barriles pasaron a `dibujarVida`**,
la misma de los guardias y los jefes. Eran la tercera y la cuarta copia del
mismo bucle: ahora hay una.

**EL CAJÓN QUE RUEDA USA EL MISMO CUERPO QUE EL QUE SE EMPUJA.** Tenía un dibujo
propio, parecido pero no igual, y la resolución nueva lo dejó a la vista: se
veía liso al lado del barril. Es la misma cosa en otra situación.

🔻 **TRES COSAS SE VIERON RECIÉN AL MIRARLAS.** La primera bolsa era un cuadrado
con un nudo arriba y se leía como un **cajón dorado** —justo lo que no puede
ser, porque en el tren de carga hay cajones de verdad—: lo que la hace bolsa es
la SILUETA, angosta arriba y panzona abajo. La tapa arrancada de la caja fuerte
se dibujaba FUERA de su lienzo y el navegador la recortaba entera, así que la
reventada se veía sin tapa. Y el fogonazo, que antes era un cuadrado grande y
tapaba todo, ahora sale de un punto: hubo que medir dónde está la boca del arma
de verdad (3 unidades más cerca y 2,5 más arriba de donde estaba el cuadrado).

**MEDIDO:** **909 llamadas de dibujo por cuadro** en el vagón de pasajeros — el
vagón viejo, sin nada de esto, hacía **1193**. **93 piezas guardadas, 1,5 MB**
después de recorrer cinco trenes enteros con barriles, cajones, pólvora y reses
rodando, los cajones golpeados y heridos, y todo el botín a la vista. Sin
errores, ni ahí ni en el galope, el campamento y el pueblo.

**⚠️ NO JUGADO.**

### 🐎 ETAPA 5: el galope y el afuera

Las dos cosas que venían quedando pendientes desde la etapa 2: **el jinete**, lo
último que quedaba del dibujo viejo, y **el desierto**, que no había quedado
bien. Iban juntas y por eso esperaron a esta etapa.

**EL CABALLO Y EL JINETE SON UNA SOLA IMAGEN**, y por eso no se podía arreglar
uno sin el otro. *(Probado en la etapa 2c: la persona nueva montada en el
caballo viejo se veía peor que la sombra cabezona)*. El número que lo explica
todo: **el jinete medía 9 unidades y una persona del juego mide 20** — estaba
dibujado a menos de la mitad porque en ese caballo no entraba otra cosa.

Se eligió la **proporción real** sobre dos alternativas. Un caballo mide 2,4 m
de largo y 1,6 m a la cruz, y una persona 1,8: con la escala del juego eso es
exactamente **26 × 17 contra 20**.

| | Caballo | Jinete | Conjunto |
|---|---|---|---|
| Antes | 22 × 12 | 9, media persona | 21 |
| **Ahora** | **26 × 17** | **20, una persona entera** | **29** |

El jinete ya no tiene dibujo propio: **es la misma gente que camina por el
vagón**, sentada (`dibujarPersona` con `postura: 'sentado'`). Con eso se fueron
del juego las dos últimas constantes de `data/siluetas.js`, que habían quedado
copiadas en `entities/caballo.js` en la etapa 2d esperando este momento.

Y el caballo se redibujó entero: el músculo del anca y del costillar, la línea
del ijar, las patas con el muslo grueso y la caña fina, los cascos, el ojo, la
montura con sus borrenes y el estribo colgando — que es lo que hace que el
jinete se lea sentado EN algo y no apoyado encima.

🔻 **DOS COSAS HUBO QUE REHACERLAS MIRÁNDOLAS.** La montura se levantaba seis
unidades sobre el lomo y al lado del jinete se leía como una **valija atada al
costado**: una montura de verdad es casi plana. Y la crin era un rectángulo
oscuro de 3,5 × 7,5 que se leía como una **caja**; ahora son mechones de
distinto largo, que es lo único que hace falta para que se lea como pelo.

**EL DESIERTO ES UNO SOLO.** El galope ya tenía su pasto, sus piedras, sus matas
y sus cactus; el asalto no tenía nada, y el primer arreglo (el color y las
rayitas del parallax) no alcanzó *(Santi: "se sigue viendo demasiado feo")* —
esas rayitas son de la resolución vieja. Ahora las dos escenas llaman a
`sembrarDesierto` (`world/desierto.js`) **con el mismo sorteo**, así que el
afuera del tren ES el mismo lugar por el que venías galopando, y no dos sitios
que se parecen. Cada cosa del suelo es una pieza guardada, con su orilla y su
detalle: el cactus con sus costillas y sus espinas, la mata como un montón de
tres matorrales y no un rectángulo, la piedra con su luz arriba.

⚠️ **Y SE RESTAURÓ UNA REGLA DE JUEGO QUE ROMPÍ SIN QUERER.** Al unificar las
dos siembras, las matas y los cactus decorativos aparecieron también en el campo
por donde galopás — donde hay obstáculos DE VERDAD que te frenan. Un adorno que
se parece a un obstáculo es una trampa, y eso ya estaba escrito en el diseño:
adelante del tren sólo va lo chico y apagado (pasto, piedritas, manchas de
tierra). Ahora `sembrarDesierto` lo recibe como una condición explícita.

**MEDIDO — el galope salió 37% MÁS BARATO.** Llamadas de dibujo de un cuadro
entero, misma escena y misma posición:

| | Galope | Asalto |
|---|---|---|
| Antes | **2659** | 713 |
| Ahora | **1667** | 740 |

El galope baja casi mil llamadas porque cada cosa del suelo pasó de tres o cinco
rectángulos a UNA estampa. Y el asalto sube apenas 27 llamadas **habiendo ganado
el desierto entero**, por lo mismo. 89 piezas guardadas, 1,47 MB. Sin errores en
seis recorridos (de día y de noche) del galope y del asalto vagón por vagón, ni
en el campamento y el pueblo.

**⚠️ NO JUGADO.**

### 🐛 ARREGLADO · El juego se tildaba al apretar W en el galope

*(Santi, jugando la etapa 5: "cuando subo con el caballo (tecla W) se buguea el
juego y se tilda")*.

**NO SE TILDABA: SE MORÍA EL CUADRO.** Una excepción adentro del `render` corta
el dibujo entero, y desde afuera eso se ve como una pantalla congelada. Era esta
línea, en la vista DE ESPALDAS de la gente (`entities/gente/frente.js`):

    if (quieto) { ... ; f = CAMINATA[0]; }

`f` es una **constante**. Asignarle algo tira "Assignment to constant variable".

**POR QUÉ NUNCA HABÍA SALTADO.** Esa línea sólo corre cuando alguien se dibuja
de espaldas Y en una postura quieta (sentado o rendido), y hasta ahora eso no
pasaba nunca: los pasajeros sentados miran a la cámara y los caídos usan otro
dibujo (`dibujarTendido`). **El primero en pedirlo fue el jinete de la etapa 5**,
que ahora es una persona de verdad y se da vuelta cuando el caballo gira hacia
las vías — o sea, exactamente al apretar W. El error estaba escrito desde la
etapa 2b y esperó tres etapas a que alguien pasara por ahí.

La vista de FRENTE ya lo hacía bien (`const cuadro = quieto ? CAMINATA[0] : f`),
así que la de espaldas ahora hace lo mismo.

🔻 **Y de paso, la manta de la montura.** Con el caballo de frente o de espaldas
el animal se ve escorzado, pero la manta seguía midiendo 12 unidades de ancho y
asomaba a los dos costados del jinete **como un par de alas rojas**. Ahora se
angosta con el giro.

**MEDIDO:** 1.200 cuadros seguidos con cada tecla (W, S, A, D y espacio), de día
y de noche, sin un solo error; y el asalto entero, el campamento y el pueblo
igual. Antes, con W, reventaba en el cuadro 58.

### 🐎 ETAPA 5b: el caballo de verdad, el giro entero y el jinete

*(Santi, después de jugar la 5 y mandando una lámina de caballos en pixel art:
"quisiera que el caballo sea más realista como la imagen, coméntame qué tan
alcanzable es. Además, cuando dobla con W o S, es como que solo mueve el cuello
el caballo cuando en realidad debería mover todo el cuerpo. Además, se debería
mejorar como reacciona el personaje ante la inclinación y movimientos del
caballo, porque hoy en día es muy malo")*.

Tres pedidos distintos, y los tres tenían razón. Eligió **A · el caballo bien
dibujado** sobre dos alternativas (el pelo volando también en lámina; un pelaje
por montura).

#### Por qué se veía tosco: era lo último sin migrar

El caballo estaba hecho de **~50 rectángulos y rayas dibujados en vivo, en
unidades del mundo** — exactamente el problema que tenían el vagón, la gente y
el desierto antes de arreglarlos. **Nunca se había dibujado a la resolución
nueva.** El animal mide 104 × 68 PUNTOS: ahí entran la silueta curva, el
músculo, el ojo y el hocico. Con dos rectángulos, no.

Las medidas salen de un caballo de verdad. El barril mide 104 puntos y un
caballo 2,40 m, así que **un punto son 2,3 cm** y todo lo demás sale de ahí: el
pecho hondo de 72 cm son 32 puntos, la cabeza de 60 cm son 26, el cuello de
75 cm son 32.

🔻 **EL PRIMER INTENTO LOS PUSO A OJO** y el cuello le salió de 46 puntos: con
la cabeza pegada atrás sin ángulo, cuello y cabeza eran **un solo cono largo** y
el caballo tenía cara de oso hormiguero. El quiebre de la garganta —que la
cabeza salga EN ÁNGULO del cuello— es lo que hace que se lean como dos cosas.

Otras tres que hubo que rehacer mirándolas: la **crin** salió como un peine de
dientes parejos (de cerca, una cremallera), la **cola** como un tablón
horizontal, y el **anca girada** como una pelota pegada al costado.

#### El giro: tenía razón, casi sólo se movía el cuello

Lo único que cambiaba de forma era la cabeza. El cuerpo se acortaba un 30% y las
patas se quedaban clavadas, así que el ojo no registraba el giro. Ahora giran
las cinco cosas que giran de verdad:

| | Antes | Ahora |
|---|---|---|
| Largo del cuerpo | 26 → 18 | 26 → 18 |
| Anca o pecho de punta | no había | aparece, con la raya del medio |
| Patas | siempre igual | convergen, y se separan de costado |
| Barril | horizontal siempre | se ladea: lo cercano baja, lo lejano sube |
| Zancada en pantalla | −25% | −55% |

⚠️ **PROBÉ UN ESCORZO MÁS FUERTE (26 → 14) Y HUBO QUE VOLVER ATRÁS.** Con el
cuerpo tan corto, en las poses extremas el caballo **desaparecía detrás del
jinete** y quedaba un hombre sentado sobre un bulto marrón. El escorzo real a
42° ni siquiera llega a 26 → 19; el giro se lee por las OTRAS cuatro señales,
no por acortar más.

🐛 **Y UN SIGNO AL REVÉS.** En esta vista, lo que está más cerca de la cámara va
más abajo. La cabeza subía cuando el caballo venía y bajaba cuando se alejaba —
justo al revés.

🔻 **LAS DOS LÁMINAS.** El caballo se guarda en dos piezas por pose, cuerpo y
cabeza, porque **no siempre van en el mismo orden**: cuando el animal viene
hacia la cámara su cabeza está MÁS CERCA que el jinete y tiene que taparlo a él.
Con una sola lámina, apretando S quedaba un hombre sin caballo debajo.

#### El jinete: eran cuatro cosas, no una

1. **La inclinación era un corrimiento de costado.** Se deslizaba en X y nada
   más. Ahora el torso **rota sobre la montura**: se dobla de la cintura.
2. **El giro le saltaba de golpe**, de perfil a de frente en un cuadro. Y
   resulta que la gente **ya tenía las vistas de tres cuartos** (`diagF` y
   `diagE`, en `figura.js`) y el jinete era el único que no las usaba: ahora el
   ángulo sale del rumbo y la vista se elige sola.
3. **Iba soldado al lomo**, subiendo y bajando exactamente lo mismo que el
   animal — por eso se leía como una calcomanía. Ahora **amortigua**: sube la
   mitad y un décimo de vuelta más tarde. Sale de la misma zancada, con un
   corrimiento de fase, así que no hay que guardar nada de un cuadro al otro.
4. **No tenía las riendas.** Ahora hay una, con panza, de la mano al bocado.

🔻 **UNA RIENDA, NO DOS.** Dos rayas a un punto de distancia, al lado de la
mandíbula y del cachete —que son otras dos diagonales— daban **cuatro líneas
paralelas** que se leían como un enredo de alambres.

🐛 **Y NO SE DIBUJA CON `r.line`.** Una raya fina en diagonal el canvas la
SUAVIZA, y una rienda de un punto suavizada no queda fina: queda un borrón
claro y despintado que parecía un palo de luz al lado de la cabeza. Acá no hay
nada suavizado. Se dibuja en tramos de rectángulos, uno por fila.

🔻 **Y LA ROTACIÓN DEL LIENZO BAJÓ DEL 30% AL 14% DEL RUMBO.** Ahora el cuerpo
ya se ladea solo dentro de la pose, y las dos inclinaciones se sumaban: el
caballo salía escorado como si estuviera por caerse.

#### Medido

⚠️ **ME EQUIVOQUÉ EN LA ESTIMACIÓN Y SALIÓ DISTINTO.** Al proponer la etapa dije
que el caballo iba a bajar de ~50 llamadas de dibujo a ~17. **No bajó: quedó
igual.** Llamadas para dibujar caballo + jinete de una vez:

| | De perfil | Girado del todo |
|---|---|---|
| Antes | 51 | 46 |
| Ahora | 51 | 55 |

La lámina sí se ahorró los ~15 rectángulos del cuerpo, pero lo que quedó vivo
—las patas, la cola nueva de diez tramos y la rienda— se los comió. **El caballo
se ve mucho mejor al mismo precio, no más barato.** Lo que sí subió es la
memoria: **18 láminas, 386 KB** (dos por pose).

Las patas siguen dibujándose en vivo a propósito: cada casco apoya en el
instante en que SUENA su golpe (`GOLPES`), y congelarlas en cuadros rompería el
"tucu-TÚN".

**Sin errores** en 700 cuadros por tecla (W, S, A, D y espacio) en el galope, 900
por tecla en el asalto, y el campamento y el pueblo. La silueta del jinete
detrás de la pared del tren sigue andando: ahora la lámina se **tiñe** entera
(`piezaTenida`), porque un renderer que pinta plano podía repintar rectángulos
sueltos pero no una estampa.

**⚠️ NO JUGADO.**

---

## Pendientes del concepto original (sin fase asignada todavía)

Campamento, historia principal, fama, compañeros y sus relaciones, caballos,
regiones, carreras, duelos, retos, tiendas, guardado.

Están en el plan grande. No se tocan hasta que el asalto completo (fase 2)
funcione.
