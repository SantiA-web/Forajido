# FORAJIDO — prototipo, fase 2 (paso A)

Western pixel art de asaltos a trenes.

La fase 1 preguntaba si asaltar **un vagón** era divertido. La respuesta fue que
sí, y ahora la pregunta cambió: **el tren entero son siete vagones y una sola
salida**, y lo que hay que averiguar es si eso genera la duda de "¿un vagón más,
o me bajo ya?".

Sigue sin haber arte: todo son rectángulos de colores a propósito.

---

## Cómo jugar

Doble clic en **`jugar.bat`**.

Se abre una ventana negra (el servidor) y el navegador con el juego.
Dejá la ventana negra abierta mientras jugás; para cerrar todo, `Ctrl+C` ahí.

> ¿Por qué hace falta un servidor? Porque el juego usa módulos de JavaScript
> (`import` / `export`) y los navegadores los bloquean si abrís el `index.html`
> directamente desde el disco. El servidor no instala nada: es un script de
> PowerShell que ya viene con Windows.

## Controles

### El campamento (donde empieza y termina todo)

El juego **empieza en tu campamento**, de noche. Te movés con `W A S D` y usás
las cosas con `E`. No te podés alejar mucho: el límite es hasta dónde llega la
luz de la fogata, y el suelo se apaga antes de que llegues al borde.

| Qué hay | Qué hace |
|---|---|
| **La fogata** | Sentarte. Y es el reloj: **encendida = de noche** |
| **El poste** | Tu caballo: **`E` lo alimenta, `F` te lleva al pueblo** |
| **La carpa** | **Dormir: cambia de día a noche y al revés** |
| **El cajón** | Con qué arma y cuánta dinamita salís |
| **El cartel** | **El mapa de rutas: por acá salís a robar** |

El caballo es lo único con dos verbos, porque es lo único que además de ser una
cosa es un vehículo. Y `F` es el mismo botón con el que volvés desde el pueblo:
montar es el verbo de viajar, para los dos lados.

### El pueblo (`F` en el caballo)

Una calle de tierra, de día, más ancha que la pantalla: hay que recorrerla.
`E` entra o habla, `F` te devuelve al campamento desde tu caballo.

**A los cuatro locales se entra**, y cada uno es un lugar con su gente:

| Dónde | Cuándo abre | Qué hay adentro |
|---|---|---|
| **Establo** | **Sólo de día** | **Los caballos, y se los puede ir a ver** |
| **Armería** | **Sólo de día** | **Las armas, y se las puede ir a ver** |
| **Cantina** | Siempre | Contratar compañeros. Barra, mesas y **mesa de póker** |
| **Oficina del Sheriff** | Siempre | **Tu cartel de "se busca", y a cuánto estás de la horca** |

De noche, **las ventanas encendidas te dicen desde lejos cuáles están
abiertos**: no hace falta caminar hasta la puerta para que te digan que no.

Y hay vecinos con los que se puede hablar, en la calle y adentro. La cartelera
del sheriff funciona de verdad — es donde tu recompensa está escrita en una
pared.

### La tienda: el que vende te pregunta

Al **armero** y al **caballerizo** no les hablás: te preguntan.

```
"¿Y? ¿Qué desea?"
   ▸ COMPRAR UN CABALLO
     NADA, GRACIAS
```

`W/S` para elegir, `E` para aceptar, `Esc` para cortar. Mientras hablás no te
movés, y **"nada, gracias" es una respuesta**, no un botón de cerrar: el tipo
te contesta.

Si le decís que sí, **vas a ver la mercadería de cerca**: los caballos en su
corral, las armas sobre el paño del mostrador. Es la única pantalla del juego
que se ve **de perfil y de cerca** — en todo el resto mirás desde arriba a un
tipo que camina. Un caballo que ves de cerca se elige; uno que leés en una
lista se calcula.

**Y los caballos están vivos.** Respiran, sacuden la cola, mueven una oreja,
parpadean, aflojan una pata — y cada nueve segundos **bajan la cabeza al
pasto, mastican y la vuelven a subir**. No hay 3D: el volumen sale de que cada
parte del animal se dibuje con cuatro tonos y las esquinas comidas, y la
profundidad de que las dos patas del lado de allá vayan más apagadas y
corridas unos píxeles.

| Tecla | Qué hace |
|---|---|
| `A` / `D` | Pasar de uno al otro |
| `Esc` | Volver, **parado donde estabas** |

**El que ya tenés está en la lista**, marcado, porque la pregunta de una tienda
nunca es "¿me sirve?" sino **"¿es mejor que el que tengo?"**. Cada barra lleva
además **una rayita clara en donde está el tuyo hoy**: la comparación entera,
en un píxel, sin un solo número escrito.

Más lleno es mejor, siempre — salvo el **RUIDO** de un arma, que va en rojo:
ése es lo único que se compra queriendo que sea bajo.

También se llega caminando hasta el mostrador o los pesebres, sin hablar con
nadie. Lo que más importa mirar tiene que ser lo más fácil de alcanzar.

**Parado frente al que querés, `[E]` lo compra.** Sin ese es tuyo. Si no te
alcanza la plata, te dice cuánto te falta y no cobra nada; si ya es tuyo,
apretar `E` de nuevo no vuelve a cobrarte. Comprar y equipar son el mismo
gesto — hoy no hay más de un arma o un caballo a la vez, así que no hace
falta un paso aparte para "usarlo".

Y **contratar compañeros** en la cantina sigue sin existir: es un sistema mucho
más caro y no depende de esto.

### El día y la noche

**Dormir en la carpa da vuelta la hora**, y eso decide qué podés hacer: el
establo y la armería cierran de noche. Dormir deja de ser "pasar el tiempo" y
pasa a ser abrir la mitad del pueblo y cerrar la otra.

**No hay reloj en pantalla en ningún lado.** La hora la dicen la luz y la
fogata del campamento (encendida de noche, apagada de día) — lo que se puede
mostrar no se escribe, igual que el aro del ruido o la marca del salto.

> Por ahora el galope y el asalto **no** cambian con la hora: los trenes se
> roban siempre igual. Los trenes nocturnos son una vuelta aparte.

Después de cada asalto volvés acá, con lo que hayas juntado y con la
recompensa que te hayas ganado. Ese ciclo —campamento, tren, campamento— es lo
que hace que un asalto tenga consecuencias en el siguiente.

### El mapa de la región (el cartel del campamento)

Un mapa de papel de la época: tinta marrón, manchas de humedad, rosa de los
vientos, y las vías dibujadas con el travesaño clásico del ferrocarril. Es la
única pantalla del juego que se maneja **con el mouse** — en todo el resto sos
un tipo que camina; acá sos un tipo mirando un papel.

| | |
|---|---|
| Mover el cursor por una vía | La resalta y el cartucho de abajo te dice qué tramo es |
| **Un puntito con humo avanzando** | **Ese ramal tiene un tren andando ahora** |
| Clic izquierdo | Salís a alcanzarlo |
| `Esc` o clic derecho | Doblás el mapa y volvés al campamento |

**Las vías son CIRCUITOS, no idas y vueltas.** Un tren no llega a un punto y se
vuelve marcha atrás por donde vino: hace una vuelta completa — sale de una
estación, para en unas cuantas y termina volviendo a la misma de donde salió.
Hay **cuatro circuitos** que se cruzan entre sí, dos de ellos con **túneles**:
donde la vía entra en la sierra se corta, sigue punteada por debajo del cerro y
tiene una boca dibujada en cada extremo.

**Y dos líneas que vienen de otra región.** Entran por el borde derecho del
papel, cruzan y se pierden por otro lado. Ésas no dan la vuelta: se van, y esa
vía queda **sin ningún tren** un rato hasta que asoma el próximo. Son la costura
con las regiones que todavía no existen, y de paso le enseñan al mapa algo que
ninguna otra vía puede — que a veces no hay nada que robar y hay que esperar.

Hay una mina y un puesto abandonado además de los pueblos, porque no todo ramal
une dos ciudades. Y el **Ramal del Puesto** está muerto, en tinta más clara: que
uno no sirva es lo que hace que el mapa se lea en vez de mirarse.

### El tren que ves es un tren de verdad, y va cambiando solo

**El cartucho no inventa un tren cuando lo mirás: te lee el que está dando
vueltas ahí.** Cada tren tiene su tipo, su escolta y su formación de vagones, y
los va cambiando mientras recorre su circuito:

| Cuándo | Qué le cambia |
|---|---|
| **Al pasar por una parada** | **La escolta.** Puede subir, bajar o quedarse igual: en cada estación sube y baja gente armada |
| **Al cerrar la vuelta** (volver a su terminal) | **El tren entero.** Ya no es el mismo servicio: otro tipo, otra formación |

Señalando una vía, el cartucho te dice **qué tren es, una pista de su carga, con
cuánta escolta viaja y dónde para próximo** — todo antes de salir a buscarlo. Y
la vía señalada te **marca sus paradas en el mapa**: un anillo en cada estación
donde para, y uno doble rojo en su terminal, que es donde deja de ser este tren.

Esa última línea es la que hace legible todo el sistema. Sin saber a dónde va,
ver la escolta cambiar sola se leería como que el juego hace trampa; sabiéndolo,
**esperar a que pase por una parada es una jugada** como cualquier otra.

> **Como todos los trenes andan a la misma velocidad, el tamaño del circuito
> decide cada cuánto cambian.** El Circuito de la Mina da la vuelta en ~22s y
> cambia de tren seguido; la Línea del Norte tarda más de un minuto y es "el
> tren de esa línea" durante toda tu visita. El tamaño dejó de ser decoración.

**Y el mapa sigue corriendo aunque no lo mires.** Dormir, comprar un caballo o
hacer un asalto entero mueve los trenes de verdad: al volver, los encontrás
donde llegaron, no donde los dejaste.

### El caballo tiene tres números, y los tres se sienten en la mano

| Stat | Qué es | Qué caballo |
|---|---|---|
| **Velocidad** | Qué tan rápido alcanzás la cola del tren | Con el **Criollo** (el que tenés al empezar) son ~12 s galopando a fondo. Con el **Mustang** son ~7. |
| **Equilibrio** | Cuánto te perdona el salto al enganche | Con el Criollo, la mayoría de tus saltos van a salir sucios (despiertan el vagón) salvo que apuntes casi exacto. Con el Mustang, bastante menos. |
| **Resistencia** | Hasta qué enganche te alcanza el aliento antes de quedarte sin fuerzas para seguir acelerando | El Criollo llega al **3º**. El Mustang, más rápido pero más corto de aliento, llega al **2º** y no más. |

**Ningún caballo es estrictamente mejor que otro.** El Mustang es el que
elegís si querés entrar rápido y bajarte pronto; el Criollo, lento y torpe
para caer, es el único que hoy te deja empujar hasta el tercer enganche.

### Galopando a la par del tren (antes de subir)

Arrancás **muy detrás del tren** y lo tenés que alcanzar. Al principio ni se
ve —está fuera de la pantalla— y lo único que tenés adelante es **la vía**,
con el balasto y las piedras volando, que es lo que te dice por dónde se fue.

Se ve desde arriba, igual que el asalto: es el mismo tren, dibujado de verdad.

| Tecla | Acción |
|---|---|
| `D` o flecha derecha | **Galopar**: te adelantás, y gasta el caballo |
| `A` o flecha izquierda | Aflojar las riendas: te quedás atrás |
| `W` / `S` | **Acercarte o alejarte del tren** |
| **`Espacio`** | **Saltar** (hay que estar pegado y sobre un enganche) |

**Alcanzar la cola es gratis**: no gasta aguante y **no le come un segundo al
reloj del asalto**. Todo lo que te adelantes más allá, sí. Perseguir al tren no
es una decisión —lo tenés que hacer siempre— y un costo que no se puede evitar
no es un precio, es un número menos en el reloj.

> Ahí es donde va a pesar **la velocidad del caballo**: la brecha se cierra a
> su `sprintSpeed`, así que uno más rápido llega antes a la cola y le sobra
> reloj para adelantarse. Con la persecución corta de antes, la diferencia
> entre dos caballos era medio segundo — la stat existía en la ficha y no en
> las manos.

**Y se puede subir al techo.** Si estás pegado al **cuerpo** de un vagón (no a
un enganche) y ese vagón tiene techo, `Espacio` no salta: **abre una barra**
con un puntero que va y viene. El segundo `Espacio` la frena. **Verde** subís
en silencio, **amarillo** subís pero despertás el vagón, **rojo** no llegás.

Es la **única** barra de timing del juego, y es a propósito: el enganche tiene
un punto que apuntar y el techo no —es una franja entera—, así que ahí la
habilidad no tenía de dónde salir sola. El vagón de ganado va al aire libre y
**no tiene techo**: al lado de ése la marca no aparece.

### Arriba del tren

| Tecla | Acción |
|---|---|
| `A` `D` / flechas | Correr por el techo |
| **`Shift`** | **Agacharse** (pasás por debajo de lo que viene alto) |
| **`Espacio`** | **Saltar** (por encima de lo que viene bajo, y para cruzar entre vagones) |
| `E` (mantener, en el borde) | Descolgarte al enganche, en silencio |

**Ojo que las teclas cambian acá arriba.** Adentro del vagón `Espacio` es
agacharse; en el techo es saltar, y agacharse pasa a `Shift`. Son las dos
respuestas posibles a lo que te viene de frente, así que hay una en cada mano.

- **Los carteles vienen hacia vos**, no están quietos: el tren avanza y te los
  lleva por delante. No se pueden rodear — o te agachás, o saltás.
- **Comerte uno cuesta caro**: perdés una vida, tardás en levantarte y, sobre
  todo, **el golpe delata dónde estás exactamente**. Los guardias de ese vagón
  dejan de adivinar.
- **El techo se corta entre vagón y vagón.** Hay que saltar el hueco, y para
  eso hay que llegar corriendo: un salto parado no cruza.
- **Los de abajo no te ven, pero te oyen.** Agachado no hacés ruido. Si te
  detectan, te tiran a ciegas hacia arriba.
- **Al vagón blindado no se baja desde el techo.** Se cruza por encima y nada
  más: la única llave sigue siendo la dinamita.

### Adentro del tren

| Tecla | Acción |
|---|---|
| `W A S D` o flechas | Moverse |
| Mouse | Apuntar |
| Clic izquierdo | Disparar |
| **`Espacio` (mantener)** | **Agacharse**: mitad de velocidad, tardan el doble en verte |
| `Shift` | Pegarse a una pared o a un asiento (cubrirse) |
| Clic derecho | Asomarse (solo estando a cubierto) |
| **Ruedita del mouse** | **Cuchillo.** Alcanza con moverla apenas, para cualquier lado |
| `F` | Cuchillo (lo mismo, por si preferís el teclado) |
| **`Q`** | **Encender un cartucho de dinamita** |
| Clic izquierdo (con la mecha encendida) | Lanzarla |
| `R` | Recargar |
| `E` (mantener) | Robar botín / **amenazar a un pasajero** / escapar |

Estando a cubierto **no podés disparar hasta asomarte**, y mientras estás
asomado sos un blanco. Ese es el intercambio. Te despegás con `Shift` otra vez
o caminando en dirección contraria a la pared. Nadie se asoma del todo: ni vos
ni los guardias exponen más cuerpo del necesario.

Agacharse y cubrirse quedaron en manos distintas a propósito: la izquierda
sostiene la barra mientras te movés, y el cuchillo salió al mouse para no tener
que soltar el apuntado cuando tenés a alguien pegado a la espalda.

### La dinamita (`Q` para encender, clic izquierdo para lanzar)

Llevás **dos cartuchos** por asalto.

**La mecha corre desde que apretás `Q`, no desde que la tirás.** Tres segundos.
Ahí está todo el juego de esta arma:

- **La tirás enseguida:** le quedan casi tres segundos en el piso. Los guardias
  la ven caer y salen corriendo. Sirve para **moverlos**, no para matarlos.
- **La "cocinás" y la tirás sobre el final:** explota casi al caer y no llegan
  a huir. Pero estás más cerca del estruendo y a un segundo de que te vuele
  la mano.
- **Si nunca la tirás, te explota en la mano** y te saca 3 de tus 4 de vida.

Otras reglas:

- Alcance: **6,5 baldosas**. Si apuntás más lejos, cae ahí nomás; si hay una
  pared en el medio, cae antes en vez de atravesarla.
- **Muerte instantánea a 2,5 baldosas**, herida hasta 4.
- **Las paredes y los asientos frenan la explosión.** Un asiento entre vos y el
  cartucho te salva. Es lo que hace que la dinamita **incomode** la cobertura
  en vez de volverla inútil: te obliga a cambiar de cobertura, no a dejar de
  usarla.
- **A cubierto hay que asomarse primero** (clic derecho), igual que para
  disparar. Nadie tira nada con la espalda pegada a una pared.
- No distingue entre guardias y pasajeros.
- **Y retumba en casi todo el tren.** Un tiro deja sospechando (amarillo) a
  los que lo oyeron; una explosión los deja **en combate (rojo)**, hasta tres
  vagones para cada lado. Los de atrás te vienen a buscar; los de adelante te
  esperan en su vagón, ya con el arma levantada. Volar la puerta del blindado
  **enciende la alarma sí o sí**: no existe hacerlo y seguir limpio.

**Los guardias del vagón blindado tienen una cada uno** — son los únicos del
tren. Y la usan por un motivo concreto: **cuando te ven parapetado**. Si te
estás moviendo no la necesitan, te disparan y listo. Cuando uno enciende la
mecha se ve un `!` naranja y una chispa parpadeando sobre su cabeza: eso quiere
decir *salí de la cobertura ahora mismo*, que es lo contrario de todo lo demás
que aprendiste, así que el aviso es grande a propósito.

### El cuchillo (ruedita del mouse)

- **Por la espalda, a un guardia que no te vio: lo matás de un solo golpe y en
  silencio.** Es la única forma de sacar a alguien del tablero sin un disparo.
- **De frente: no lo matás.** Le hacés daño y lo aturdís un instante, pero es
  un escándalo y viene todo el mundo.
- **Los guardias también pegan.** Si los tenés encima dejan de disparar y te
  muelen a golpes, así que pegarse a uno ya no es refugio.
- **Los cuerpos quedan tirados.** Un guardia que ve un cadáver da la alarma.
  Dónde matás importa tanto como a quién.

## Qué hay que hacer

### El tren

```
   [cola]--[1]--[2]--[3]--[4]--[5]--[6]--  -->  locomotora
      ↑      ↑     ↑
      🐴     🐴    🐴      los guiones son enganches: aire libre, sin cobertura
      1      2     3
   los tres lugares donde podés dejar el caballo
```

Seis vagones, mezclados en cada asalto: dos de pasajeros, uno de comedor, uno
de correo, uno de ganado y uno blindado. Colgando de la parte de atrás está la
**plataforma trasera**.

**El caballo es uno solo y se queda donde lo dejaste.** Antes de subir elegís
hasta dónde adelantarlo: la cola, el enganche entre el vagón 1 y el 2, o el del
2 y el 3. **Ahí subís vos, y ese punto es la única forma de bajarse del tren.**
Si lo dejaste adelante, la plataforma de cola sigue existiendo pero no hay nadie
esperándote: ir para allá es meterse en un callejón sin salida.

**No miden todos lo mismo**, y es a propósito: si todos midieran igual, el tren
no tendría ritmo — cruzar el de ganado (una bolsa, un guardia) costaría lo
mismo que cruzar el blindado. Anchos: pasajeros 40 baldosas, comedor 34,
correo 32, blindado 30, ganado 24.

### La escolta

Antes de subir, la pantalla te dice **qué tan escoltado viaja el tren**. Eso
decide cuánto aguanta cada guardia — y, en el escalón más alto, también qué
tan bien pelea:

| | Sale | Guardia común | Guardia blindado |
|---|---|---|---|
| **Fácil** (ronda tranquila) | 65% | 2 balazos | 3 balazos |
| **Media** (tren escoltado) | 35% | 3 balazos | 4 balazos |

Cuatro es el techo del juego y no va a subir nunca: es lo que garantiza que las
armas de un tiro sigan matando de un tiro para siempre.

Hay una tercera, **Alta vigilancia**, que está construida y **apagada**: no
toca la vida (ya está en el tope) sino que mejora cómo pelean — puntería,
tiempo de reacción, velocidad de sospecha y cada cuánto se asoman. Sale en 0%
por ahora. Es una llave (`peso: 0` en `data/train.js`), no una amputación:
subirle el peso la devuelve al juego sin tocar una línea de código.

### Los tres tipos de tren

Además de qué tan escoltado viaja, cada tren tiene un TIPO — un catálogo en
`data/train.js` (`TRAIN_TYPES`), igual patrón que las armas o los caballos.

| | Sale | Vagones | El asalto dura | Particularidad |
|---|---|---|---|---|
| **Estándar** | 50% | 6, normales | 145s (de siempre) | El blindado, vagón 3 o más adelante |
| **Veloz** | 30% | 6, MUCHO más cortos | 90s | **Se te suelta la carga encima, y el propio piso te traiciona** (ver abajo). Los disparos se oyen 1 vagón más lejos, la sospecha y el grito son ×1.5, y el blindado va SIEMPRE al último vagón (nunca se mezcla) |
| **De carga** | 20% | 8, mayoría mercancía | 165s | **El tren del sigilo** (ver abajo): se puede soltar el ganado para abrir camino sin disparar, y si suena la alarma el botín te pesa encima |

**El veloz es una apuesta distinta, no una versión más difícil**: todo pasa
rápido, para vos y para ellos. Sólo cambian esas tres cosas — nunca las armas
de los guardias ni la dinamita fuera del blindado.

**El de carga es la primera respuesta real** al botín demasiado concentrado que
median las notas de diseño (ver NOTAS-DISENO.md): en vez de una caja fuerte
grande en un vagón, varias bolsas chicas repartidas en varios.

### En el tren de carga, la pregunta es: ¿podés llevártelo entero sin que nadie grite?

Los otros dos trenes te preguntan **cómo llegar** (el estándar) y **qué tan
rápido** (el veloz). Éste pregunta otra cosa: **si podés hacerlo sin
despertarlo**. Es el único donde eso es realmente jugable — guardias sueltos,
mucho espacio y tiempo de sobra.

**El premio ya existía y ahora se ve.** Salir sin que suene la alarma da el
DOBLE de botín, pero antes era un número que te enterabas en la pantalla de
resultados. Ahora el HUD dice **LIMPIO** todo el asalto: la racha está a la
vista, y perderla se siente.

**El ganado se puede soltar.** Los vagones de ganado —tres en este tren— traen
tranqueras que se abren con [E]. La manada sale corriendo hacia la locomotora y
**voltea a cualquier guardia que esté en el pasillo** (1,3 s en el piso, sin
matarlo). Es la primera cosa del juego que VOS le hacés al tren en vez de al
revés, y es lo que hace jugable el sigilo: hasta ahora "ir limpio" sólo se
podía EVITANDO pelear.

Pero no es gratis, y los tres costos importan:

| | |
|---|---|
| **Abrir la tranquera** | Casi un segundo quieto en el pasillo, al descubierto — el mismo precio que la caja fuerte |
| **Hace ruido** | Los guardias vienen a mirar qué pasó. **No enciende la alarma** —no es un tiro— pero tampoco es silencioso |
| **Te atropella a vos también** | Las reses no distinguen a nadie. Por eso se amontonan un segundo antes de salir: ésa es tu ventana para meterte en un hueco entre corrales |

**El guardia atropellado queda 3 segundos en el piso** — tiempo real para
llegar caminando y rematarlo. Una manada lo voltea UNA vez: las cinco reses del
mismo tropel son un solo evento. Lo que sí lo mata es que lo agarre **otra
estampida** mientras sigue caído — o sea, que hayas llegado a abrir una segunda
tranquera a tiempo.

**Y la manada no entra al vagón blindado.** Se frena en su puerta, como todo lo
demás: al blindado no se entra sin volar la puerta con dinamita, y eso no tiene
excepciones.

**Y si suena la alarma, lo que llevás encima empieza a pesar** — sólo en este
tren. Mientras nadie dio la voz, cargás lo que quieras sin costo. Apenas suena,
**cada $100 encima te sacan un 2% de velocidad** (hasta un tope de −35%), y lo
que agarres a partir de ahí te frena más. Un tren limpio te lo podés llevar
entero; uno que se despertó te obliga a elegir qué soltar y qué no ir a buscar.

> En el estándar y en el veloz el botín **no** pesa: el estándar tiene su
> decisión en los caminos y el veloz en el reflejo. Mudarle la misma pregunta a
> los tres sería borrar justamente lo que los separa.

> Es la misma familia de castigo que sostiene todo lo demás: acá nada te quita
> vida por equivocarte — el barril te tumba, la caja fuerte tarda, el salto
> sucio despierta un vagón. Todos cobran en **tiempo y exposición**. Que la
> alarma te vuelva lento en vez de sacarte algo es esa regla, aplicada por
> primera vez a *cuánto llevás* en lugar de *cuánto tardaste*.

### En el tren veloz, el tren también es tu enemigo

Cada tanto **se suelta una tanda de barriles y cajones** que bajan rodando por
el pasillo hacia la cola. No es decorado y no se puede ignorar:

| | |
|---|---|
| **Esquivarlos** | Salirte del pasillo — un hueco entre asientos, el carril de arriba del comedor. Gratis, pero te saca de donde estabas **y hay que quedarse afuera hasta que pase la tanda entera** |
| **Reventarlos** | **Aguantan 3 tiros cada uno.** Una tanda de tres son NUEVE balas: más de un tambor lleno del Colt. Con el arma sola no alcanza |
| **Comértelo** | **Caés de espaldas y tardás segundo y medio en levantarte.** No perdés vida — pero no podés disparar, ni moverte, ni cubrirte, y el porrazo se oye |

**Vienen de a 2 o 3, separados medio segundo.** De a uno se esquivaban
demasiado fácil: te corrías, volvías al pasillo y listo. Escalonados, el hueco
entre uno y el siguiente es de unos 50 px — pasa por encima tuyo en un cuarto
de segundo, o sea que no te alcanza para meterte y volver a salir.

> **Un barril te tumba una vez, no una por cada uno de la tanda.** Mientras
> estás en el piso, los que siguen te pasan por encima sin tocarte. Sin esa
> regla una tanda de tres te dejaría cuatro segundos y medio tirado, que ya no
> es presión sino perder el control de la partida.

Medido con un jugador de prueba que **nunca** esquiva: lo tumban 7 veces en 30
segundos, siempre 1,52 s cada vez, y **nunca pierde vida**. Son unos 10 s de
piso en un asalto de 70 — el 15% del reloj, sólo por ignorarlos.

**Que no saque vida es a propósito.** El precio es tiempo y exposición: segundo
y medio tirado en el piso, en un vagón donde hay gente apuntándote, ya es de lo
más caro del juego. Sumarle daño encima lo volvería el peor castigo por el error
más fácil de cometer.

**Ruedan siempre hacia la cola** porque el tren acelera y lo suelto se va para
atrás. Entrando te vienen de frente; volviendo te alcanzan por la espalda — la
misma cosa se lee distinto según para dónde vayas.

**Y se caen del tren en el enganche.** El barril que llega al borde del vagón se
va al vacío, así que el enganche —que no tiene cobertura y te deja servido a los
jinetes— es el único lugar donde esto no te alcanza. Otro intercambio, no un
refugio.

### Y el propio piso se vuelve traicionero

Cada ~10 segundos el vagón se pone difícil de verdad, de dos maneras posibles —
y las dos avisan ANTES de pegar, siempre con el mismo ritmo: un balanceo chico
sin efecto (podés prepararte), y recién después el sacudón.

**El balanceo:** más dispersión al disparar, **para vos y para los guardias
por igual**. No es que el juego te castigue — es que apuntar fino en un piso
que se mueve es difícil para cualquiera. Tu Colt (0,035 de mira) lo sufre
mucho más que un guardia que ya tira sucio de por sí: el sacudón se lleva
puesta justo la ventaja de la puntería. **A cubierto no te afecta** — estar
pegado a una pared es estar afianzado.

**El tirón:** el tren acelera o frena de golpe (se ve en el paisaje de
afuera, que acelera o frena con él) y **te empuja unos pasos** — hacia la
cola si acelera, hacia la locomotora si frena. Si acelera, además **sacude la
carga**: dispara una tanda extra de barriles. Frenando no.

**Y son cosas distintas del balanceo de los barriles**: podés tener una tanda
de barriles Y un tirón encima al mismo tiempo. Es el Viejo Oeste: traicionero.

Entre vagón y vagón hay un **enganche al aire libre**. Ahí empezás el asalto
(nunca aparecés adentro de un vagón, de cara a un guardia) y ahí no hay dónde
esconderse de verdad: cruzar de un vagón al otro te expone siempre, aunque
las puertas de los costados te tapen un instante (ver abajo).

### Las puertas

Cada vagón tiene **dos puertas, en su propio borde** — no una compartida con
el de al lado. Cruzar de un vagón a otro es: la puerta del que dejás, la
pasarela al aire libre, la puerta del que entrás. Doce en total, incluida la
entrada desde la cola (por donde también se escapa).

- **Abrirla es gratis.** Empujarla —caminar hacia ella— ya la abre, para vos
  y para los guardias. Nunca te frena.
- **Cerrada, tapa la vista pero no las balas.** Es madera: alguien del otro
  lado no te ve, pero te puede tirar igual, a ciegas — no apunta, así que
  dispara en ráfagas más largas que un tiro normal. Y vos podés contestarle
  del mismo modo.
- **Se cierra sola** si nadie queda parado en el marco. Da un respiro cada
  vez que cruzás una puerta, no sólo la primera vez.
- **Tiene vida.** Unos pocos tiros la rompen, y rota queda abierta para
  siempre.
- **Las dos del vagón blindado no son madera: son chapa.** Frenan el paso y
  **frenan las balas** — tus tiros y los de ellos mueren contra la puerta, no
  la atraviesan ni la rompen. Desde afuera tampoco se empujan. Al blindado no
  se entra ni caminando ni a los tiros: **la única llave es la dinamita**, y
  una vez volada la puerta queda abierta para siempre.
- **Los guardias del blindado nunca salen de su vagón.** Ni persiguiéndote,
  ni con la puerta ya volada: no abandonan el puesto pase lo que pase.

### La decisión que abre el asalto: el galope

El asalto **no empieza con un menú**. Empieza galopando al costado del tren en
movimiento, con la locomotora allá adelante. Ahí se decide todo:

- **Desde afuera ves qué tipo de vagón es cada uno, pero no lo que tiene
  adentro.** Ni cuánta guardia, ni cuánto botín.
- **Adelantarte te saltea vagones de entrada.** Llegar al medio del tren por
  afuera, a caballo, te ahorra cruzar dos vagones de guardias despiertos. Eso es
  lo caro del asalto.
- **Pero te cierra el otro lado.** El caballo queda donde saltaste y es tu única
  salida, así que los vagones que quedan detrás pasan a costar tan caro como los
  de adelante. Ganás un lado del tren y perdés el otro.
- **El aguante no se recupera.** Es un presupuesto fijo: gastado, gastado.
- **Cada segundo que galopás se lo come el asalto.** No es un castigo inventado:
  el reloj del asalto arranca descontado por lo que tardaste.
- **Y te pueden ver.** Galopar pegado a un vagón con gente adentro te expone: si
  te descubren, **entrás al asalto con la alarma ya sonando**, o sea sin bono de
  trabajo limpio y con guardias caminando hacia vos antes de robar nada.

Medido con un piloto de prueba que esquiva bien, 5 corridas por fila, con el
**Criollo** (el caballo con el que empezás):

| Dónde saltás | Galope | Reloj de la persecución que sobra |
|---|---|---|
| La cola | ~12 s (**pura persecución**) | ~28 s |
| Enganche 1-2 | — | ~19 s |
| Enganche 2-3 (el máximo del Criollo) | — | **~6 s** |

Con el **Mustang** (más rápido, pero con menos fondo) el máximo es el
enganche 1-2, y llega ahí con ~27 s de sobra. Cada caballo tiene su propio
techo — ver "El caballo tiene tres números", más arriba.

**La tensión del carril:** lejos del tren nadie te ve, pero **para saltar hay que
arrimarse**, y arrimarse es justo donde te miran. Cuanto más tardes en acertar el
enganche, más te exponés. Es la misma idea que ya funciona adentro del vagón: la
posición que te salva de unos te entrega a otros.

**Y si te descubren, te disparan por las ventanillas.** Cada tiro que te pega te
saca vida y espanta al caballo — y **esa vida te la llevás adentro**: podés
empezar el asalto con 1 de 4. No podés morir galopando, pero podés llegar hecho
un desastre. Para zafar: alejarte del tren o acelerar y dejar ese vagón atrás.

### El salto tiene grados, y es una habilidad

No alcanza con llegar al enganche: hay que **caer bien**.

| Grado | Qué pasa |
|---|---|
| **Limpio** — caés en el centro | Entrás en silencio |
| **Sucio** — dentro, pero descentrado | Entrás igual, pero **despertás al vagón** |
| **Errado** — fuera del enganche | No subís: trastabillás y el tren te gana |

Que el precio de un mal salto sea **ruido y no daño** es lo que hace que valga la
pena perfeccionarlo: no te lastima, te arruina el sigilo.

La marca verde en el borde del tren te muestra **la zona donde el salto sale
limpio**. Es más chica que el enganche entero, así que hay que apuntar. Y como
**ir rápido te hace cruzarla en menos tiempo**, la dificultad sale sola de tu
propia velocidad: aflojar te da margen, pero te cuesta reloj.

**Un caballo mejor no salta más lejos: te perdona más.** Lo que compra la tienda
(fase 3) es una zona limpia más ancha — el que aprendió a clavarla en el centro
no necesita comprar nada.

**Y hay piedras y arbustos** al costado de la vía. Chocar no te mata: te frena en
seco y hay que volver a levantar velocidad. Lo importante no es el choque, es que
**para esquivar hay que moverte**, y a veces la única salida es pegarte al tren.

Medido con un jugador de prueba que camina derecho sin disparar: **ir hacia
adelante DENTRO del tren cuesta casi el doble que volver** (del vagón 1 al 4 son
29 s y 2,8 de vida; la vuelta del 4 al caballo, 23 s y 1,6). Volviendo pasás por
vagones que ya reventaste, con los perseguidores detrás. Yendo, entrás a vagones
frescos. **Por eso el galope vale lo que cuesta.**

### Adentro

Tenés **145 segundos**, menos lo que hayas tardado galopando.

Eran 170, y bajaron por un motivo concreto: con 170 se podía hacer el tren
entero. Mientras barrer todo entre en el reloj, "¿cuánto me llevo?" no es una
pregunta, porque la respuesta es siempre "todo".

- Las bolsas se abren en 0,6 s y valen entre $30 y $65.
- **A los pasajeros se los puede amenazar** (`E`, 1,4 s): aflojan entre $25 y $70.
  Un pasajero al que tenés al alcance de la mano **no grita** — nadie se pone a
  los gritos con un revólver en la cara. Pero después de robarle te queda **un
  testigo vivo con cuatro segundos de cuerda**: lleva un relojito sobre la cabeza
  y cuando se acaba, grita. Plata ahora, alarma después. El vagón comedor es el
  que más gente lleva, y por eso pasó a ser el tercero en valor del tren.
- **Se puede amenazar a cualquiera, aunque ya esté alerta.** Al que salió
  corriendo lo alcanzás (vos vas a 78 y ellos a 66) y frena en seco cuando le
  apuntás. Que la alarma suene temprano ya no significa perder esa plata para
  siempre: significa que sale más cara, en tiempo.
- La caja fuerte tarda **6,5 segundos**, **hace ruido** y **no sabés cuánto
  tiene hasta abrirla**: entre $150 y $600. A veces es el golpe de tu vida y a
  veces te arriesgaste al pedo. Es una apuesta, no una cuenta — y son seis
  segundos y medio quieto, de espaldas, en un vagón que ya te oyó. El blindado
  tiene **dos**.
- **Si escapás sin que suene la alarma, el botín vale el doble.**
- Para escapar hay que llegar a donde dejaste el caballo y mantener `E`.
- **No hay otra salida.** No podés tirarte del tren, y el caballo está en un
  solo lugar. Si te matan o se acaba el tiempo, te capturan y perdés todo.

### La ley cabalgando afuera

Con la alarma sonando, a los **25 segundos** aparecen **los dos primeros
jinetes de la ley juntos**, uno de cada lado. Tardan: la ley no está pegada
al tren, tiene que llegar. Cuando llegan, tiran seguido — mal, pero seguido.

**Cuántos llegan como máximo depende de tu recompensa** (`gameState.bounty`,
la que ya traías al subir a este tren, no lo que hagas durante el asalto). Si
da para más de dos, los que sobran llegan de a uno, cada 15 segundos:

| Recompensa al subir | Jinetes como máximo |
|---|---|
| 0 | 2 (uno por lado — el piso, igual que siempre) |
| 300+ | 3 |
| 700+ | 4 |
| 1000+ | 5 |

**No te siguen: cazan la ventana (o baranda) más cercana a vos.** Cada uno se
reclama una franja de verdad del tren — no una posición inventada relativa a
la tuya — y se queda ahí clavado hasta que otra pasa a ser la más cercana. Si
dos van por el mismo lado, se reparten franjas DISTINTAS a propósito, para
que se lean como dos amenazas y no una sola detrás de la otra.

El ritmo (25 s la tanda de 2, cada 15 s los siguientes) es el mismo para
todos: lo único que cambia con la recompensa es cuántos, no qué tan rápido.

Te disparan **por las ventanillas**. Y ahí está lo que hace interesante a todo
el sistema:

> **La cobertura que te salva de los guardias de adentro es justo la que te
> deja servido a los de afuera, y al revés.**

Si te pegás con `Shift` debajo de una ventanilla, el jinete deja de verte —
pero quedás de cara al pasillo, donde te ven los guardias. Ya no hay una
posición que te tape de todo.

Cosas que conviene saber:

- **Te tiran aunque no te vean.** Si te escondiste, siguen castigando la
  ventanilla donde te vieron meterte, por si volvés a asomarte. Duran unos
  quince segundos insistiendo antes de aflojar.
- **Agachado contra la pared estás a salvo:** esas balas pasan por encima
  tuyo, debajo del marco de la ventana. Esconderse funciona — lo que te cuesta
  es tiempo, que en un asalto de 170 segundos no es poco.
- **Se distinguen las dos amenazas.** Cuando te apuntan a vos, levantan el arma
  con una línea larga y clara; cuando le tiran al lugar donde estabas, el gesto
  es corto y anaranjado. Son cosas distintas y se responden distinto.
- **Solo te apuntan si estás enmarcado en una ventanilla.** Desalineado unos
  metros, no tienen ángulo.
- **Avisan.** Levantan el arma **medio segundo** antes de tirar, igual que los
  guardias. Ese es tu tiempo para salir de ahí, y es ajustado a propósito:
  alcanza para reaccionar y correrte del marco, no para pensarlo.
- **Tienen mala puntería a propósito, pero ya no es demasiado mala.**
  Rediseñada: escala con la distancia (como la de los guardias) y empeora si
  te movés. Medido: de 20 tiros, entre 1 y 3 pegan, según qué tan alineado
  estés y si te estás moviendo — antes eran 1 de cada 27, casi ninguno.
- **Apenas 10-20px desalineado de la ventana, directamente no consiguen
  tiro.** El hueco por el que tiene que pasar la bala es angosto de verdad
  (ver NOTAS-DISENO), así que "tirarte diagonal" ya es mucho más difícil
  por la propia geometría, sin necesidad de ningún número aparte.
- **Les podés contestar.** Dos balazos de Colt por la ventanilla y el jinete se
  cae del caballo. A través de la pared, no: tus balas mueren igual que las suyas.
- **El vagón blindado no tiene ventanillas.** Adentro estás a salvo de ellos.
- **El vagón de ganado va al aire libre**, con barandas en vez de paredes. Es
  el peor lugar del tren para que te agarre la ley.
- Sin alarma no aparecen nunca. La ley reacciona al quilombo.

Y no se mueven mientras apuntan: es lo que hace que el ángulo que avisan sea
el que de verdad sale.

### El Cazarrecompensas: cuando tu recompensa sube demasiado, alguien sube al tren por vos

**Con $900 o más de recompensa, en los trenes ESTÁNDAR ya no viajás solo.**
Sube un cazarrecompensas — por la cola, igual que vos — y aprieta hacia la
locomotora. O sea que se te mete **entre vos y tu caballo**.

No es un guardia con más vida. Un guardia custodia el tren y reacciona a que
entraste; éste ya venía en camino antes de que subieras:

- **No patrulla, no sospecha, no se olvida.** Sabe en qué vagón estás y va
  para allá, cruzando el tren entero si hace falta. Esconderte adentro del
  vagón te da tiempo; nunca lo apaga.
- **No se le puede poner uno a la espalda.** Un guardia mira para donde
  camina. Éste tiene la cabeza en 360°.
- **Aguanta ocho balazos**: dos tambores del Colt, con una recarga obligada
  en el medio. Es lo único del juego que pasa el techo de cuatro — y ese techo
  sigue valiendo para todos los guardias, sin excepción.
- **Corre tan rápido como vos.** Si le disparaste hace poco, se acerca
  cubriéndose (para no regalarte un tiro limpio); si no, te persigue derecho.
  Correr a fondo en línea recta ya no te lo saca de encima gratis.

**Y en cuanto se despierta, se cierra el tren.** Ninguna puerta de madera se
abre empujando mientras siga vivo y cazándote — hay que romperla, con las
mismas balas de siempre (no hace falta dinamita), como a cualquier otra cosa
que se interponga. La de chapa del blindado sigue igual, con la dinamita
como única llave. Si lo matás, el tren se destraba entero.

**Y no aparece en el tren veloz ni en el de carga**, a propósito: ésos ya
tienen su propio enemigo (el tren mismo en uno, el sigilo en el otro).

#### Primero te mide. Después viene.

**No sube en el segundo cero: se hace esperar.** El asalto arranca sin él, y
recién **a los 35 segundos** aparece atrás, cuando ya te metiste en el tren.

Y cuando sube, no corre hacia vos: **te sigue a distancia, casi una pantalla
atrás, sin disparar un solo tiro.** Su rifle llegaría desde ahí y elige no
usarlo. Lo ves de reojo cada vez que mirás para la cola, caminando tranquilo,
y no hace nada.

**Lo que lo saca de ahí es que te pares a robar.** Una bolsa, un pasajero, y
sobre todo la caja fuerte — seis segundos y medio quieto, de espaldas. Robar
dejó de costar sólo tiempo: ahora **lo llama**.

También se despierta si le quedás muy cerca o si le tirás. Nada más: el acecho
no se termina solo. Por primera vez en el juego, quedarte quieto y callado es
una forma de que un enemigo **no** venga.

#### Sus dos armas dicen dónde querés estar

| | |
|---|---|
| **Rifle** (de lejos) | Preciso y lento. La respuesta es **cortarle la vista**, no tirotearlo de frente. Y cada tiro suyo despierta **dos vagones**: pelearlo a los tiros te empeora el camino de vuelta aunque no te pegue nunca |
| **Revólver** (de cerca) | Sucio y rápido. Es lo que saca cuando le quedaste encima |

**Si te le pegás demasiado, retrocede** para tomar carrera. Pegársele lo saca
de su mejor distancia — a cambio de comerte el revólver de cerca.

#### La embestida, y el segundo que te regala si la leés

Cada tanto **se planta en seco y encara**. Una línea gruesa parpadeante marca
por dónde va a pasar: es el aviso más grande del juego, y dura medio segundo
largo.

Después sale disparado en línea recta **hacia donde estabas cuando se plantó**.
No te sigue — por eso esquivarla es cuestión de leer y correrse, no de correr
más rápido que él.

- **Si te agarra:** te tumba, te arranca de tu cobertura y te deja casi un
  segundo en el piso. No es el daño lo que duele, es dónde te deja.
- **Si erra: queda un segundo largo aturdido.** Ésa es la única ventana en la
  que le podés pegar gratis — con el Colt son dos tiros y medio, un cuarto de
  su vida. **Esquivarla no te salva nomás: te regala el mejor segundo del
  asalto.**
- **Y le rompe la puerta de chapa al vagón blindado.** Es lo único además de
  la dinamita que la abre, y queda abierta para siempre. Si lo llevás hasta
  ahí, te está abriendo el vagón más caro del tren — si sobrevivís adentro.

**Y si le pegás un tiro, te embiste.** No espera los siete segundos: un balazo
le destraba la carga al instante. Ésa es su respuesta a que le dispares, y es
lo que hace que no se lo pueda matar parado en el pasillo apretando el
gatillo — tenés que dejar de tirar y moverte.

**A la mitad de la vida se pone serio:** grito, destello, y de ahí en más hace
lo mismo pero más seguido. Los avisos no se achican nunca.

> Se pelea **cubriéndose**: se mete detrás de un asiento y sólo se expone al
> asomarse para disparar, y se acerca saltando de una cobertura a la
> siguiente en vez de cruzar el pasillo de frente. Para matarlo hay que
> flanquearlo o cazarlo en la ventana del aturdido.

#### Matarlo es la única forma de bajar tu recompensa sin ir preso

| | |
|---|---|
| **Te baja la recompensa un 35%** | Proporcional: vale lo mismo recién cruzado el umbral que al borde de la horca |
| **Suma 150 de fama** | Y es lo primero en todo el juego que mueve ese número |
| **Cuenta aunque te capturen** | No es botín: es un hecho, y ya pasó |

**Pero tenés que matarlo vos.** Si lo agarra una bala perdida en el tiroteo,
deja de perseguirte y nada más: la ley no te perdona la cabeza porque un
guardia haya tenido mala puntería.

Ahí está la decisión: escaparle es lo seguro, y enfrentarlo es lo único que te
aleja de la horca sin entregarte.

### El Sheriff: el que no te dispara ni una vez

**Entre $600 y $899 de recompensa, hay chance de que viaje un sheriff en tu
próximo tren estándar.** No es seguro: es una apuesta cada vez que subís.

Es el opuesto exacto del cazarrecompensas. Aquél viene por vos; éste **no pelea
con vos en absoluto**. Aguanta lo mismo que cualquier guardia, y apenas suena la
alarma **sale caminando hacia la locomotora y no dispara nunca más**.

Lo difícil no es matarlo. Es **llegar**:

- **Se lleva tres guardias con él.** Donde va, van. Y se suman a los que ya
  viven en cada vagón que cruzás persiguiéndolo.
- **Los guardias de su vagón pelean mejor** — apuntan mejor, reaccionan antes y
  te descubren más rápido. El aura se mueve con él, así que el peor vagón del
  tren es siempre donde esté parado.
- **Tu arma hace más ruido del que debería.** Cada disparo tuyo despierta un
  vagón más de lo normal, o sea más gente **entre vos y el caballo**.

Y ahí está el precio: cada vagón que avanzás detrás de él es un vagón más lejos
de tu salida. No te cuesta vida — te cuesta camino de vuelta.

**Matarlo no baja tu recompensa** (él no vino por vos: es seguridad del tren).
Suma fama, y sobre todo apaga las tres cosas de arriba al instante. Podés
ignorarlo perfectamente y robar con el tren en contra todo el asalto — ésa es
la decisión.

### La alarma no inventa guardias: despierta a los que hay, y sólo hacia atrás

Cuando alguien te ve y grita, o cuando disparás, el ruido corre por el tren.
Pero **no corre igual para los dos lados**:

- **Los de atrás vienen.** El vagón donde sonó, y los de atrás que alcance el
  ruido, **se movilizan y van caminando hasta vos**. Son los que te cortan el
  camino al caballo.
- **Los de adelante se despiertan, pero no se mueven.** Oyeron lo mismo, así que
  no siguen silbando tranquilos: se quedan en su vagón, alertas, esperándote.
  No te persiguen — te esperan.

> **El ruido no te trae enemigos encima: te los pone entre vos y el caballo.**

De ahí salen dos cosas:

- **Limpiar un vagón sirve.** De un vagón donde ya no queda nadie no sale
  nadie. Nunca vas a ver a un guardia aparecer de un lugar por el que ya
  pasaste.
- **Avanzar sigue teniendo sorpresa**, porque el vagón de adelante ya no te
  recibe dormido.

### Cuánto tren se entera lo decide tu arma

El alcance de la alarma no es una constante: es **cuánto ruido hiciste**.

| | Alcance |
|---|---|
| El grito de un guardia | 1 vagón |
| **Un tiro de Colt** | **1 vagón** |
| Armas más ruidosas (cuando existan) | 2 o 3 |

Un arma ruidosa no te suma enemigos: **te los despierta más atrás**, o sea más
lejos en tu camino de vuelta. Ese va a ser el precio real de la potencia, y es
lo que hace que la tienda no venda poder sino **permiso para hacer ruido**.

La alarma **ya no se propaga sola con el tiempo**. Antes se enteraba un vagón
más cada catorce segundos hicieras lo que hicieras; ahora, si te quedás callado,
el tren no se entera solo. La presión la manejás vos.

Lo único que entra de afuera viene de la **locomotora**, por la punta de
adelante. Nunca por atrás: atrás está el aire libre y tu caballo.

**Saben dónde te vieron, no dónde estás.** Si rompés el contacto y te movés
callado, van al lugar equivocado. Pero cada tiro tuyo vuelve a delatarte.

## Los guardias

- **No son todos iguales, y se nota mirándolos.** El guardia común aguanta dos
  balazos. El **guardia blindado** (los del vagón blindado) tiene una placa gris
  en el pecho y un sombrero más ancho, y aguanta uno más. Cuando a alguno le
  pegaste, aparecen unas rayitas sobre su cabeza con lo que le queda.
- **El color del cuerpo NUNCA dice el tipo, dice el estado** (gris tranquilo,
  amarillo sospechando, rojo combate). Eso es lo más importante que hay que
  poder leer de un vistazo, así que el tipo va en la silueta.
- **Te van viendo, no te ven de golpe.** La barrita amarilla sobre la cabeza es
  cuánto sospechan. Si rompés el contacto antes de que se llene, baja sola.
- **Y te oyen caminar.** No hace falta que te vean: uno de espaldas te escucha
  igual. El aro amarillo que late alrededor tuyo es hasta dónde te están
  oyendo — unas 3,5 baldosas. **Agachado (`Espacio`) no hacés ni un ruido**, y
  ahí sí te podés pegar a la espalda de cualquiera. Medido: caminando a dos
  baldosas de un guardia de espaldas te descubre en dos segundos; agachado a la
  misma distancia, nunca.
- **No hay línea roja.** El único aviso de que van a disparar es que se paran
  en seco, levantan el arma y se oye el martillo. Hay que leerlos.
- **Se cubren.** En combate no te vienen a buscar de frente: buscan un asiento
  o una pared, se parapetan y disparan asomándose. Para matarlos hay que
  moverse y flanquearlos.
- **Gritan.** El primero que te ve avisa a los demás y suena la alarma.
- **No se olvidan rápido.** Te siguen buscando unos nueve segundos después de
  perderte de vista, y la sospecha después baja despacio. Ya no pasa que te
  disparen, te escondas dos segundos y vuelvan a silbar como si nada.
- **El que ve un cadáver queda marcado para el resto del asalto.** No vuelve
  nunca más a su ronda tranquilo: se olvida a un tercio de velocidad, su
  sospecha nunca baja del todo y te busca el doble de tiempo. Por eso importa
  tanto **dónde** matás, no solo a quién.
- **Tienen mala puntería, como corresponde.** La dispersión crece con la
  distancia: de lejos aciertan cerca de 1 de cada 5 tiros y el resto es fuego
  de contención. De cerca sí son peligrosos de verdad.
- **No se pisan entre ellos ni disparan a través de un compañero**, y si te
  movés bien pueden llegar a pegarse entre ellos.
- **Los pasajeros gritan, pero solo miran para adelante.** La rayita les marca
  hacia dónde. A los que te dan la espalda se los puede rodear; a los que
  miran hacia la entrada hay que esquivarlos, taparse o callarlos.

---

## La recompensa (`bounty`)

No mide lo que hiciste: mide **si te identificaron haciéndolo**.

- **Sin alarma y sin captura, no se mueve nunca**, aunque hayas matado o
  robado muchísimo. Si nadie sobrevive para describirte, la ley no tiene a
  quién buscar.
- **Si sonó la alarma** (escapaste o no), suma por cada guardia o jinete
  muerto (`bounty.pesoGuardia`) y por cada pasajero muerto
  (`bounty.pesoCivil`, bastante más caro: un civil nunca era una amenaza).
  También suma, la mitad que un guardia, por cada pasajero **amenazado**
  (`bounty.pesoAmenaza`): robar es un delito real, pero no es matar a nadie.
  Igual en los tres tipos de tren.
- **Si te capturan**, suma además un salto fijo (`bounty.capturaFlat`),
  aparte de todo lo anterior: tienen tu cara.
- **La plata robada no la toca.** Un ladrón cuidadoso que vacía el tren entero
  sin matar a nadie puede tener recompensa cero.
- **Se paga en la cárcel** — o **matando al cazarrecompensas**, que es la única
  forma de bajarla sin entregarte (ver arriba). Ver abajo.

Se ve en la pantalla de resultados, en el campamento, en el pueblo y —sobre
todo— en el cartel de "se busca" de la oficina del sheriff.

## La cárcel, y la horca

**El juego nunca te mata en el tren.** Te caen a tiros y te esposan, o se
acaba el reloj y el tren llega a la estación con vos adentro. Las dos terminan
en la cárcel.

**La fianza es tu recompensa, y se cobra con lo que tengas:**

- **Si te alcanza**, pagás, salís, y la recompensa vuelve a cero.
- **Si no**, te sacan todo lo que tenías, la deuda baja por lo que pagaste, y
  salís con el resto encima.

**Pero por encima de `prision.umbralHorca` ($1200) te cuelgan, tengas la plata
o no.** Sos demasiado buscado para que te suelten por dinero, y ahí se termina
la partida. Ese es todo el filo del sistema: **la plata te salva del castigo
chico, y sólo mantener la recompensa baja te salva del grande.**

Por eso la recompensa dejó de ser un contador y pasó a ser **una cuenta
regresiva**. Y por eso el bono de trabajo limpio dejó de ser un extra: no
subir la recompensa es cómo se sobrevive.

> La cuenta regresiva **se ve**, que es la condición para que no se sienta
> tramposa: la oficina del sheriff te avisa a cuánto estás, y te lo dice más
> fuerte cuando ya falta poco.

---

## El test que importa

Jugalo **10 veces** y contestá:

1. **¿Dejaste el caballo en los tres lugares, o hay uno que conviene siempre?**
   Y en particular: **cuando el blindado cae en la posición 3, ¿dejar el caballo
   en el enganche 2-3 es automático?** Si es que sí, el precio (15 s) es
   demasiado barato.
2. **¿En algún momento dudaste entre volverte ya o avanzar un vagón más?**
   ¿Dónde estabas cuando dudaste? Esta es LA pregunta de la fase 2.
3. **¿Los guardias siguen siendo fáciles de matar?** Con la alarma sonando te
   tienen que caer tres o cuatro encima, no uno. Si igual los barrés de a uno,
   el próximo ajuste son los números (vida, puntería, tiempo de aviso).
4. **¿Los 170 segundos alcanzan?** ¿Te quedaste sin tiempo estando cerca, o te
   sobró? Sin válvula de escape, quedarse corto es perderlo todo.
5. **¿La caja fuerte a ciegas se siente a apuesta o a tomadura de pelo?**
   Y ojo con el vagón blindado: tiene dos, y puede comerse el asalto entero.

La 2 decide si seguimos con el paso B o volvemos a ajustar esto.

---

## Dónde tocar las cosas

Casi todo lo que vas a querer cambiar está en tres archivos:

- **`src/data/config.js`** — todos los números: velocidad, vida, daño, duración
  del asalto, visión y puntería de los guardias, ritmo de los refuerzos, colores.
- **`src/data/wagons.js`** — los seis tipos de vagón: el mapa (dibujado con
  caracteres), las rondas de los guardias, los pasajeros y el botín.
- **`src/data/train.js`** — el catálogo de tipos de tren (`TRAIN_TYPES`: de qué
  vagones está hecho cada uno, sus reglas de mezcla) y el de dificultades
  (`DIFICULTADES`: cuánta vida y, en Alta, qué tan bien pelean los guardias).
- **`src/data/bosses.js`** — los mini jefes (el Cazarrecompensas y el Sheriff).
  En qué banda de recompensa aparece cada uno y con qué probabilidad, sus armas,
  la embestida, la fase de furia, la escolta y qué te deja matarlos.
- **`src/data/guards.js`** — los tipos de guardia y cuánto aguanta cada uno.
- **`src/data/weapons.js`** — las armas. El Colt es la vara con la que se miden
  todas las demás.
- **`src/data/horse.js`** — los caballos, y las reglas del galope.
- **`src/data/tienda.js`** — qué vende cada local, con qué barras se compara y
  cómo se dibuja cada cosa de cerca. Agregar un artículo es agregarlo a su
  catálogo y nombrarlo acá.

Agregar un tipo de vagón nuevo es escribir una plantilla en `wagons.js` y
nombrarla en `train.js`. No hay que tocar ni una línea de lógica.

Cambiá algo, guardá, recargá el navegador (`F5`). No hay que compilar nada.

### Si querés que los guardias sean más o menos duros

| Número en `config.js` | Qué hace |
|---|---|
| `enemy.spreadFar` | **Su puntería de lejos.** Más alto = fallan más |
| `enemy.spreadNear` | Su puntería de cerca |
| `enemy.suspicionNear` / `suspicionFar` | Qué tan rápido te descubren |
| `enemy.viewDistance` / `viewAngle` | Cuánto y cuán ancho ven |
| `enemy.aimTime` | Cuánto avisan antes de disparar (más bajo = más letal) |
| `enemy.burstSize` | Cuántos tiros por asomada |
| `enemy.coverHoldMin/Max` | Cuánto se esconden entre ráfaga y ráfaga |
| `enemy.separation` | Cuánto se respetan el espacio entre ellos |
| `enemy.loseTargetTime` | Cuánto te siguen buscando tras perderte |
| `enemy.suspicionDecay` | Qué tan rápido se olvidan |
| `enemy.spookedFloor` | De cuánto no baja el que vio un cadáver |
| `alert.wagonRadius` | A cuántos vagones llega el GRITO de un guardia |
| `weapons.*.noiseWagons` | A cuántos vagones llega un TIRO de esa arma |
| `explosives.dinamita.noiseWagons` | A cuántos vagones **retumba una explosión** (y los deja en rojo, no en amarillo) |
| `loot.strongboxTime` | Cuánto tardás en abrir una caja fuerte |
| `alert.interval` / `alert.max` | Ritmo y tope de la gente de la locomotora |
| `raid.duration` | Los segundos del asalto entero |
| `rodante.vida` / `velocidad` | **Los barriles del tren veloz:** cuántos tiros aguantan y qué tan rápido vienen |
| `rodante.rafagaMin` / `rafagaMax` / `rafagaGap` | **Cuántos vienen por tanda y cada cuánto sale el siguiente.** Los tres números que deciden si se pueden esquivar de a uno o hay que quedarse afuera del pasillo |
| `rodante.adelanto` / `pistaMinima` | Desde dónde aparecen y cuánta pista te dejan como mínimo para reaccionar |
| `rodante.levantarse` | Cuánto tardás en levantarte si te lleva puesto uno |
| `TRAIN_TYPES.<id>.rodantesCada` (`data/train.js`) | Cada cuánto arranca una tanda. Sin ese campo, ese tipo de tren no suelta nada |
| `traqueteo.dispersionExtra` | **Cuánto más dispersan TODOS** (guardias y jugador) durante el sacudón. Se suma, no multiplica — castiga más al que apunta fino |
| `traqueteo.empujePx` | Cuánto te arrastra el tirón (acelerón o frenada) |
| `traqueteo.avisoTiempo` / `efectoTiempo` | Cuánto dura el aviso sin efecto y cuánto el sacudón de verdad |
| `TRAIN_TYPES.<id>.traqueteoCada` (`data/train.js`) | Cada cuánto se pone traicionero el piso. Sin ese campo, ese tren nunca lo hace |
| `peso.penalizacion` / `maximo` | **Cuánto te frena la plata encima tras la alarma** (2% por cada $100, tope 35%). Sin alarma no pesa nada |
| `estampida.abrirHold` / `arranque` | Lo que tardás en abrir la tranquera, y el respiro que tenés para correrte antes de que salga la manada |
| `estampida.reses` / `velocidad` / `alcance` | Cuántas salen, qué tan rápido y cuánto corren antes de perderse adelante |
| `estampida.aturdeGuardia` | Cuánto queda en el piso el guardia atropellado — 3 s, calculado para que te dé tiempo a llegar y rematarlo (el cuerpo a cuerpo, para comparar: 0,45 s) |
| `estampida.matalAturdido` | Si una SEGUNDA estampida mata al que ya está caído (las reses de una misma manada no, es un solo evento) |
| `TRAIN_TYPES.<id>.pesaElBotin` (`data/train.js`) | Si en ese tren la plata encima te frena tras la alarma. Sólo el de carga |
| `TRAIN_TYPES.<id>.estampida` (`data/train.js`) | Si los vagones de ganado de ese tren traen tranqueras. Sin ese campo, son pasillo de paso |
| `caballo.maxAdelanto` | Red de seguridad sin uso activo (el aguante ya es el límite real — ver abajo) |
| `HORSES.<id>.sprintSpeed` | **Velocidad de ese caballo**: qué tan rápido se adelanta galopando y qué tan rápido alcanza el tren |
| `horse.inicioDetras` | **Cuán atrás del tren arrancás**, o sea cuánto dura la persecución (para todos los caballos) |
| `HORSES.<id>.aguanteMax` / `aguanteGasto` | **Resistencia de ese caballo**: hasta qué enganche le alcanza el aliento — se calibra por caballo, no hay una escala genérica |
| `HORSES.<id>.saltoPreciso` / `saltoTolerancia` | **Equilibrio de ese caballo**: cuánto perdona el salto (enganche y techo) |
| `horse.tiempoAproximacion` | Cuánto dura el galope antes de subir sí o sí (para todos los caballos) |
| `raid.maxCobroAproximacion` | Tope de lo que el galope le come al asalto |
| `doors.health` | Tiros que aguanta una puerta común antes de romperse |
| `doors.closeDelay` | Cuánto tarda una puerta en cerrarse sola |
| `enemy.doorBurstSize` / `doorSpread` / `doorFireCooldown` | La ráfaga a ciegas de un guardia a través de una puerta cerrada |
| `prision.umbralHorca` | **A partir de qué recompensa te cuelgan** (no se puede pagar) |
| `prision.avisoCerca` | Desde qué fracción del umbral el sheriff pasa de informar a advertir |
| `techo.ancho` | Qué tan angosta es la franja pisable del techo |
| `techo.obstaculoCada` / `obstaculoVel` | Cada cuánto viene un cartel y qué tan rápido te barre. **Los dos números que deciden si el techo es jugable** |
| `techo.saltoDuracion` / `saltoBoost` | Tu salto arriba: cuánto dura y cuánto avanza. Si no se cruza el hueco entre vagones, es acá |
| `techo.levantarse` | Cuánto tardás en levantarte tras comerte un cartel |
| `techo.bajarAlcance` / `bajarHold` | Desde qué distancia del borde podés descolgarte, y cuánto hay que mantener `[E]` |
| `enemy.techoBurstSize` / `techoSpread` / `techoFireCooldown` | La ráfaga a ciegas de un guardia hacia arriba, a través del techo |
| `APROXIMACION.barraVelocidad` / `barraVerde` / `barraAmarillo` (`data/horse.js`) | La barra del salto al techo: qué tan rápido va el puntero y qué tan anchas son las zonas |

### El mapa se dibuja con letras

```
#  pared                      .  suelo libre
S  asiento (cobertura)        +  pasarela del enganche (aire libre)
C  carga, mesa o corral       X  el vacío: fuera del tren
W  VENTANILLA                 E  salida (solo en la plataforma trasera)
H  media pared / baranda
```

`#`, `S` y `C` frenan las tres cosas. **`W` y `H` frenan el paso pero NO la
vista ni las balas**: son por donde te dispara la ley desde afuera, y por donde
vos le podés contestar.

Las tres propiedades (`solid`, `blocksSight`, `blocksBullets`) están separadas
en `world/tilemap.js`. Eso es lo que permitió meter la ventanilla sin tocar el
sistema de combate.

**Cada vagón mide 40 columnas por 10 filas, siempre**, y las filas 4 y 5 tienen
que empezar y terminar con `+`. Esas son las reglas que permiten engancharlos:
el tren se arma pegando los layouts uno al lado del otro, con un tramo de
enganche en el medio, y queda un solo mapa largo de 266×10 tiles.

En los vagones de pasajeros el pasillo mide **dos baldosas**: entran tres
personas de ancho y ni una más. Las filas de arriba y abajo son pared doble,
así que el interior es de verdad chico.

Entre bloque y bloque de asientos hay un hueco de **dos baldosas de ancho y dos
de fondo**, catorce en total. Son la única forma de salirse del pasillo y son
callejones sin salida: sirven para cubrirse y para romper la línea de visión de
alguien que viene por el pasillo, pero no para avanzar. **El fondo de dos
baldosas es lo que los hace servir**: metido hasta el fondo, el que camina por
el pasillo solo te ve cuando pasa justo por delante de tu hueco.

Si te equivocás en el largo de una fila, el juego te avisa en la consola (`F12`)
diciendo cuál falla. Y si ponés un guardia, un pasajero o una bolsa encima de
una pared, también te avisa.

### Por qué el tren es UN mapa largo y no siete mapas

Es la decisión técnica más importante de esta fase. La visión, la línea de
tiro, la cobertura, las balas, la IA y la cámara ya sabían trabajar sobre "un
mapa". Al hacer que el tren sea un mapa largo, **todo eso siguió funcionando
sin tocar una línea**, y encima los guardias del vagón de al lado existen de
verdad: te oyen, te pueden ver por el enganche y pueden venir caminando.

El costo es que hay ~2700 tiles y 13 guardias. Se resuelve dibujando solo las
columnas que entran en pantalla (91% menos trabajo) y no actualizando a los
guardias que están patrullando a más de 700 px. Los que ya te vieron se
actualizan siempre, a cualquier distancia, para que te puedan perseguir de un
vagón a otro.

### Cómo hacen los guardias para cruzar el tren

Con `engine/pathfind.js`. Antes un guardia caminaba **derecho** hacia vos, y
alcanzaba porque estaban siempre en el mismo vagón. Ahora uno del vagón 4 tiene
que llegar al 1: salir de su fila, encontrar el pasillo, cruzar dos enganches y
meterse por la puerta correcta. Caminar derecho contra eso es quedarse trabado
contra un asiento para siempre.

El buscador de rutas es una búsqueda en anchura sobre la grilla de tiles, y solo
se usa cuando el objetivo está a más de 150 px: para tres pasos sería tonto y se
vería robótico. Medido con ocho guardias persiguiendo a la vez: 0,085 ms por
cuadro, sobre un presupuesto de 16,7.

---

## Mapa del proyecto

```
src/
  engine/    piezas genéricas que no saben nada de western
             (bucle, canvas, teclado, colisiones, cámara, eventos, azar, audio)
  scenes/    las pantallas: campamento (camp), pueblo (town), interiores
             (interior), mapa de rutas (mapa), galope (ride), asalto (raid),
             resultados y cárcel
  entities/  jugador, guardia, pasajero, bala, botín
  systems/   IA, combate, cobertura, alarma
  world/     el tren, los vagones y la grilla de tiles
  ui/        el HUD (es HTML, no dibujo en canvas)
  state/     gameState: TODO lo que sobrevive a un asalto
  data/      el contenido: números, armas, vagones, composición del tren
  text/      los textos en español, todos juntos
```

Dos reglas que sostienen la arquitectura:

1. **`engine/` no importa nada de las carpetas de arriba.** Es reutilizable.
2. **El contenido va en `data/`, no en el código.** Agregar un vagón o un arma
   nunca debería obligarte a tocar un sistema.

El audio está sintetizado con osciladores: no hay ni un archivo de sonido. Es
provisorio a propósito. Cuando el juego funcione se reemplaza cada efecto por
un sample real sin tocar nada más.

### Sacarle una foto a la pantalla (`foto.ps1`)

Doble clic en **`foto.ps1`** y después, desde la consola del navegador:

```js
fetch('http://localhost:8099/loquesea', { method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: document.getElementById('game').toDataURL('image/png') })
```

Queda `loquesea.png` en la carpeta del juego. Sirve para mirar un detalle
con calma (recortándolo y agrandándolo antes de mandarlo se ve píxel por
píxel) y sobre todo para poder revisar el dibujo cuando el juego se está
manejando desde una consola y la ventana no está componiendo cuadros. No
toca nada del juego: se puede borrar.

### Depurar desde la consola (`F12`)

```js
FORAJIDO.state          // el estado de la partida
FORAJIDO.config         // todos los números, editables en vivo
FORAJIDO.services.raid  // el asalto en curso: player, enemies, passengers, loot
FORAJIDO.services.train // el tren: wagons, map, exitZone, caballoEn, wagonAt(x)
FORAJIDO.services.ride  // el galope: x, aguante, reloj, plataformas, alcanceMaximo
FORAJIDO.services.camp  // el campamento: x, y, sentado, cerca, objetos, mensaje
FORAJIDO.services.town  // el pueblo: x, y, cerca, mensaje, gente, edificios
FORAJIDO.services.mapa  // el mapa: encima (la vía señalada), rutas, conTren
FORAJIDO.services.interior // el local en el que estás: id, x, y, cerca, puntos,
                           // y dialogo/opcion si te está hablando un vendedor
FORAJIDO.services.tienda   // la vidriera: id, items, item, datos, tuyo, precio

// Cambiar la hora a mano (normalmente se cambia durmiendo en la carpa):
FORAJIDO.state.esDeDia = true

// De qué está hecho el tren de esta partida:
FORAJIDO.services.train.wagons.map(w => w.short)

// Saltear la pantalla de abordaje y entrar por donde quieras:
FORAJIDO.services.scenes.goTo('raid', { caballoEn: 3 })

// Para probar algo en el fondo del tren hay que destrabar el tope del caballo,
// que normalmente llega hasta el 3:
FORAJIDO.config.caballo.maxAdelanto = 6
FORAJIDO.services.scenes.goTo('raid', { caballoEn: 6 })
```

---

## Lo que todavía NO existe (a propósito)

Arte, sonido grabado, historia, fama, compañeros y guardado. (`recompensa` ya
se mueve — ver más abajo — pero todavía no hace nada: nadie la gasta ni la usa
para nada, y los mini jefes que iba a destrabar siguen sin construirse. La
plata SÍ se gasta ya, en el establo y la armería.)

## Dónde estamos en la fase 2

| Paso | Qué es | Estado |
|---|---|---|
| **A** | El tren de seis vagones y la retirada al furgón de cola | hecho |
| **A+** | El caballo se elige: una sola salida, y la elegís vos | hecho |
| **B** | Ventanillas y la ley cabalgando a la par, disparando adentro | hecho y jugado |
| **C** | Abordaje de verdad | hecho y jugado (por enganche **y por el techo**) |
| **D** | **Aproximación a caballo** | hecho y jugado |

El **A+** salió del feedback jugando: retirarse temprano ganaba siempre. Midiendo
apareció el motivo — **meterse adelante costaba casi el doble que volver** — y
la respuesta fue mover la salida en vez de tocar el botín.

El **C+D** reemplazó la pantalla de abordaje por el galope. El abordaje **por el
techo** quedó pendiente a propósito: obliga a inventar un segundo nivel del mapa,
y no tiene sentido pagarlo antes de haber jugado el galope. Ya se jugó, el diseño
del techo se cerró discutiendo, y esta vuelta se construyó (ver NOTAS-DISENO.md
para el detalle y lo que quedó verificado a ciegas, sin poder jugarlo todavía).

Van en ese orden por **valor de juego**, no por orden narrativo. El caballo va
último porque es el más caro de construir y el que menos importa si el interior
del tren no funciona.

**La fase 2 se dio por cerrada en su objetivo central.** Jugando con los cinco
pasos completos, la pregunta que abrió toda la fase —*¿un vagón más, o me
bajo?*— tiene respuesta: la duda aparece mirando el reloj, un jugador mejor
avanza más y uno peor se queda atrás, y el galope se sigue sintiendo con
sentido. Ver "EL ⚠" más abajo para el detalle.

**Y con el abordaje por el techo jugado y confirmado, la fase 2 está
completa: los cinco pasos, hechos y jugados.** El techo se midió a propósito
contra el pasillo para ver si un camino paralelo rompía el equilibrio, y no
lo rompe: tarda lo mismo, pero despierta la mitad del tren y te cuesta una
vida mucho más impredecible. Es otra forma de riesgo, no un atajo.

Lo que queda anotado para más adelante (nada de esto bloquea): los mini
jefes, las armas que faltan y el botín demasiado concentrado en dos vagones.

## Y la fase 3 ya arrancó: el campamento

Con la fase 2 cerrada, el agujero grande dejó de ser el asalto y pasó a ser
**que no había ninguna razón para subirse a un segundo tren**: la plata y la
recompensa se acumulaban sin destino, y cada asalto arrancaba idéntico.

El **campamento** es la primera pieza que arregla eso (ver NOTAS-DISENO), y el
**pueblo** es la segunda. Los dos están construidos y jugables, con todo lo que
debería ser interactivo respondiendo, pero **todavía sin transacciones**: se
construyen primero los lugares y después se les cuelgan las tiendas. Al revés
—hacer la tienda y después buscarle dónde ponerla— es como se termina con un
menú disfrazado de lugar.

El **mapa de rutas** es la tercera, y ya está: elegís qué tren tomar señalando
la vía con el cursor. Con eso el ciclo quedó completo de punta a punta —
**campamento → mapa → galope → asalto → resultados → campamento**.

La cuarta es **la tienda**: el armero y el caballerizo te preguntan qué querés,
ahí se va a ver la mercadería de cerca (ver arriba), y **ya se puede
comprar** — `[E]` cobra y equipa en el mismo gesto.

**Y ya hay tres tipos de tren y dos dificultades activas** (ver "Los tres tipos
de tren" y "La escolta", más arriba). No los sortea el cursor: los lleva puestos
cada tren mientras da vueltas por su circuito, y los va cambiando en sus paradas
y al cerrar la vuelta.

Lo que sigue: que el caballo comprado perdone también el salto al techo (hoy
`saltoPreciso` lo lee el galope pero la barra del techo usa una constante
aparte).
