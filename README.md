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
| **El poste** | Tus caballos: **`E` lo atiende y elegís cuál montás, `F` te lleva al pueblo** |
| **La carpa** | **Dormir: cambia de día a noche y al revés** |
| **El cajón** | **Con qué salís: elegís entre todas las armas que tenés** |
| **El cartel** | **El mapa de rutas: por acá salís a robar** |

El caballo es lo único con dos verbos, porque es lo único que además de ser una
cosa es un vehículo. Y `F` es el mismo botón con el que volvés desde el pueblo:
montar es el verbo de viajar, para los dos lados.

**Y el campamento es donde te equipás, no el pueblo.** En la tienda se COMPRA;
acá se ELIGE, gratis y a cualquier hora. Comprar el Smith no te hace perder el
Colt: queda en el cajón, y volver a él es abrirlo y elegirlo. Lo mismo con el
acero y con los caballos en el poste. Ir hasta el pueblo es para conseguir algo
nuevo, nunca para cambiarte de ropa.

### El pueblo (`F` en el caballo)

Una calle de tierra, de día, más ancha que la pantalla: hay que recorrerla.
`E` entra o habla, `F` te devuelve al campamento desde tu caballo.

**A los cuatro locales se entra**, y cada uno es un lugar con su gente:

| Dónde | Cuándo abre | Qué hay adentro |
|---|---|---|
| **Establo** | **Sólo de día** | **Los caballos, y se los puede ir a ver** |
| **Armería** | **Sólo de día** | **Las armas, y se las puede ir a ver.** El armero vende dos cosas: fuego y **acero** (cuchillo y hacha) |
| **Cantina** | Siempre | Contratar compañeros. Barra, mesas y **mesa de póker** |
| **Oficina del Sheriff** | Siempre | **Tu cartel de "se busca", y a cuánto estás de la horca** |
| **Casa de empeños** | **Siempre** | **El perista: acá se vende lo que sacaste del tren de carga** |

**El perista abre cuando los demás cierran**, y es lo único que hay que saber del
personaje: el establo y la armería son negocios honestos con horario. Está en la
**última puerta de la calle**, pegado a la oficina del sheriff — el que te compra
lo robado trabaja a dos puertas de la ley y nadie dice nada. No hace falta
escribirlo: se lee caminando.

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

> **El galope sí se ve distinto según la hora:** de día el desierto es de arena,
> el mismo ocre que rodea al campamento; de noche es tierra oscura. Pero es sólo
> el paisaje — se roba igual. El asalto no cambia nunca, y tiene sentido: adentro
> de un vagón la hora no se ve. Los trenes nocturnos de verdad, con la escolta
> dormida y todo lo demás, son una vuelta aparte.

**Y el pueblo tiene cielo.** De día es un azul polvoriento que se va aclarando
hacia el horizonte, con una loma detrás de las fachadas; de noche el mismo cielo
bajo el velo se lee como un atardecer. Es el único color frío del juego, y está
para que los ocres de todo lo demás se lean como cálidos: hasta que existió, el
cielo del pueblo era del mismo marrón que la tierra.

**El campamento de día tiene sombras y desierto alrededor.** Todo lo que hay en
el claro —la carpa, el cajón, el cartel, los postes, el caballo, vos— tira su
sombra para el mismo lado, y afuera del círculo de tierra pisada hay matorrales
y piedras. De noche no: ahí la única luz es la fogata, y el fondo negro significa
que la luz se termina.

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
| **Velocidad** | Qué tan rápido alcanzás la cola del tren | Con el **Criollo** (el que tenés al empezar) son ~11 s galopando a fondo, desde la esquina del desierto. |
| **Equilibrio** | Cuánto te perdona el salto al enganche | Con el Criollo, la mayoría de tus saltos van a salir sucios (despiertan el vagón) salvo que apuntes casi exacto. Con el Mustang, bastante menos. |
| **Resistencia** | Hasta qué enganche te alcanza el aliento antes de quedarte sin fuerzas para seguir acelerando | El Criollo llega al **3º**. El Mustang, más rápido pero más corto de aliento, llega al **2º** y no más. |

**Ningún caballo es estrictamente mejor que otro.** El Mustang es el que
elegís si querés entrar rápido y bajarte pronto; el Criollo, lento y torpe
para caer, es el único que hoy te deja empujar hasta el tercer enganche.

### Galopando a la par del tren (antes de subir)

Arrancás **en una esquina del desierto**, abajo y muy atrás. **El tren se ve
desde el primer segundo**: chiquito, allá arriba a la derecha, con la vía
llegando hasta él. No galopás hacia un horizonte vacío — galopás hacia algo que
tenés a la vista todo el tiempo.

**Y el desierto tiene hora.** De día es de arena, el mismo ocre que rodea al
campamento — porque es el mismo desierto. De noche es tierra oscura y lo único
que se recorta son las siluetas.

**Y la cámara se va cerrando sola.** Al principio el tren mide cuatro baldosas y
ves el desierto entero; a medida que te acercás, la escena se cierra hasta
quedar a la misma escala que el asalto. Nadie te avisa que estás llegando: se ve.

**No se galopa por un pasillo.** Estás casi trescientos píxeles por debajo de la
vía, así que llegar al tren es una **diagonal larga y libre** — elegís tu propia
línea, esquivando **rocas, arbustos, cactus y montículos de arena**. Y esquivar
no es gratis, porque cuanto más te arrimás al tren más te ven.

**Y no todos estorban igual.** La roca es lo único sólido de verdad y la que más
lugar ocupa; el arbusto es ancho y te enreda; el cactus es alto pero de tronco
flaco; y el montículo de arena es el más perdonador — le podés pisar el borde y
seguir. Por eso elegir POR DÓNDE pasar es una decisión y no sólo "esquivá todo":
siempre hay una línea barata y una cara.

**El caballo apunta a donde lo llevás, y no obedece al instante.** No manejás al
animal: manejás al jinete que tira de las riendas. El caballo tarda medio segundo
en terminar de virar, y cuando soltás sigue derivando un momento antes de
enderezarse. Es la diferencia entre conducir una máquina y montar un bicho.

### Y el tren se va. De verdad.

**El tren viaja a su propia velocidad y no te espera.** Si te quedás quieto, si
te demorás rodeando un cactus, si te comés una roca — el tren sigue, y lo ves
alejarse. Alcanzarlo es algo que tenés que hacer, no algo que pasa solo.

**Ahí es donde la velocidad de tu caballo significa algo nuevo:** no es sólo
cuánto tardás en llegar, es **cuánto te podés distraer**.

| | Galopando | Sin apretar nada |
|---|---|---|
| **Criollo** | le gana terreno al tren | **el tren se le va.** No puede demorarse |
| **Mustang** | le gana el doble | **le sigue el paso.** Puede rodear un obstáculo con calma |

Con el Criollo, cada segundo que no galopás es terreno perdido. Con el Mustang,
esquivar sale casi gratis. Es la misma stat de siempre, pero ahora se siente en
una decisión distinta: no "¿llego?", sino "¿me puedo dar el lujo?".

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
| **Clic derecho (mantener)** | **Afinar la puntería.** A cubierto, además te asoma |
| **`Espacio` (mantener)** | **Agacharse**: mitad de velocidad, tardan el doble en verte |
| `Shift` | Pegarse a una pared o a un asiento (cubrirse) |
| **Ruedita del mouse** | **Golpe cuerpo a cuerpo.** Alcanza con moverla apenas, para cualquier lado |
| `F` | Lo mismo, por si preferís el teclado — **salvo al lado de un barril de pólvora, que lo empuja** |
| **`Q`** | **Encender un cartucho de dinamita** |
| Clic izquierdo (con la mecha encendida) | Lanzarla |
| `R` | **Recargar.** Mientras lo hacés caminás lento, como si fueras de costado |
| `E` (mantener) | Robar botín / **amenazar a un pasajero** / escapar |
| **`TAB`** | **Abrir la mochila.** Y el tren no te espera: el reloj sigue corriendo |
| **Arrastrar** (mochila abierta) | **Acomodar un bulto**: lo agarrás con el clic izquierdo y lo soltás donde quieras |
| **Ruedita** (con un bulto en la mano) | **Girarlo**: así un atado largo se puede parar en una columna |
| **Clic derecho** (mochila abierta) | **Tirar al piso** lo que estás señalando |
| **El mouse por encima** | Te dice qué es y **cuánto vale de base** |
| `W A S D` (con la mochila abierta) | Mover el cursor por la grilla |
| `E` (con la mochila abierta) | **Soltar lo que está señalado** |

Estando a cubierto **no podés disparar hasta asomarte**, y mientras estás
asomado sos un blanco. Ese es el intercambio. Te despegás con `Shift` otra vez
o caminando en dirección contraria a la pared. Nadie se asoma del todo: ni vos
ni los guardias exponen más cuerpo del necesario.

Agacharse y cubrirse quedaron en manos distintas a propósito: la izquierda
sostiene la barra mientras te movés, y el cuchillo salió al mouse para no tener
que soltar el apuntado cuando tenés a alguien pegado a la espalda.

### Caminar de costado o de espaldas te cuesta

**No rendís igual para todos lados** — depende de hacia dónde apuntás, no de
hacia dónde caminás. Si apretás `D` y el arma mira hacia la derecha, vas de
frente y a velocidad normal. Si apretás `D` y apuntás hacia abajo o hacia
arriba, estás yendo de costado respecto a tu propia mira, y vas más lento. Si
apretás `D` y apuntás hacia la izquierda, estás retrocediendo de espaldas —
más lento todavía, lo mismo que ya cuesta agacharse, apuntar o cubrirse.

Es continuo, no un interruptor: cuanto más de costado, más despacio, hasta el
mínimo cuando vas exactamente de espaldas. Encarar algo pasó a valer la pena.

### La mira te dice, siempre, qué tan sucia tirás

El puntero no es una cruz: es **un círculo, y su tamaño es tu arma**. Es una
medida del arma en este instante, no una predicción de dónde va a caer
justo esta bala — apuntar cerca o lejos no lo cambia, sólo lo que ensucia tu
puntería de verdad:

| | El círculo |
|---|---|
| Llevás un arma sucia | Nace más grande. El Smith siempre es más ancho que el Colt |
| **Clic derecho: apuntás** | **Se cierra** en un tercio de segundo |
| **El tren se sacude** (tren de carga) | **Se abre de golpe, en tu cara** |
| No podés disparar (recargando, tumbado, escondido sin asomarte) | Se pone **rojo** |

**Apuntar cuesta**, y cobra en lo mismo que cobra todo en este juego: tiempo y
exposición, nunca vida. Tarda en cerrarse, y mientras lo mantenés **caminás a
la mitad de velocidad** — el mismo precio que ya cuesta agacharse. Así abrir
fuego de inmediato y plantarte a apuntar primero son dos jugadas distintas.

**Cuánto cierra depende del arma, y ahí la tienda vende algo que se ve.** El
Colt casi se clava: su virtud siempre fue la puntería y apuntar la lleva al
máximo. El Smith mejora, pero **apuntado sigue tirando más sucio que el Colt
sin apuntar**: es mano rápida, no pulso fino. Comprarlo nunca fue un ascenso.

**Y a cubierto la mira ya está cerrada.** Pegarte a una pared con `Shift` es
estar afianzado —la misma razón por la que el sacudón del tren no te arrastra
si estás cubierto—, así que cuando te asomás con el clic derecho salís ya
apuntando, sin el tercio de segundo. Es la primera vez que cubrirse te da algo
**ofensivo** y no sólo un lugar donde esconderte. El precio ya estaba puesto:
asomado sos un blanco, los jinetes te cazan en la ventanilla y los guardias del
blindado te tiran dinamita justamente cuando te ven parapetado.

**Y el círculo es una idea, no una garantía.** La mayoría de los tiros salen
exactamente como el círculo lo muestra, pero de vez en cuando (1 de cada 6-7)
el pulso se te va de verdad y ese tiro sale más sucio de lo que se veía —
aunque hayas apuntado perfecto y el guardia entrara entero adentro del
círculo. Nadie se salva: al Cazarrecompensas, a los guardias y a los jinetes
también se les puede ir la puntería. Nada en pantalla avisa cuándo va a pasar
— si lo avisara, volvería a ser una promesa exacta en vez de una idea.

**Y cada disparo te ensucia el próximo, un rato.** El retroceso agranda el
círculo apenas tirás —la mitad si estás apuntando— y se apaga solo. El Colt,
disparado a su propio ritmo, siempre se limpia justo a tiempo para el
siguiente tiro; el Smith, más rápido, no llega a limpiarse del todo entre uno
y otro. Lo que el Smith gana en cadencia lo paga en pulso.

### La dinamita (`Q` para encender, clic izquierdo para lanzar)

Salís con **dos cartuchos**, y **te pueden entrar hasta tres**: el tercero se
consigue arriba del tren, en el vagón de armas (más abajo). Es lo único del
juego que se repone durante un asalto.

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
- **Y retumba en casi todo el tren.** Un tiro pone en rojo a todo TU vagón y
  en amarillo a los dos de al lado —**pero ésos no cruzan: se quedan en el
  suyo, despiertos y mirando la puerta**. Hasta que suene la alarma de
  verdad, lo que pasa en un vagón se queda en ese vagón; después, los de
  atrás sí te vienen a buscar. Una explosión, en cambio, los deja
  **en combate (rojo)**, hasta tres
  vagones para cada lado. Los de atrás te vienen a buscar; los de adelante te
  esperan en su vagón, ya con el arma levantada. Volar la puerta del blindado
  **enciende la alarma sí o sí**: no existe hacerlo y seguir limpio.

**Los guardias del vagón blindado tienen una cada uno.** Y la usan por un motivo
concreto: **cuando te ven parapetado**. Si te estás moviendo no la necesitan, te
disparan y listo. Cuando uno enciende la mecha se ve un `!` naranja y una chispa
parpadeando sobre su cabeza: eso quiere decir *salí de la cobertura ahora
mismo*, que es lo contrario de todo lo demás que aprendiste, así que el aviso es
grande a propósito.

**El otro que la tira es el Dinamitero**, y no se parece en nada: aquéllos tienen
revólver y usan el cartucho para sacarte de atrás de un asiento; éste **no tiene
otra cosa**, así que te la tira estés como estés (ver "El Dinamitero", más
abajo).

### El cuerpo a cuerpo (ruedita del mouse)

Hay **dos situaciones**, y son siempre las mismas sin importar qué lleves:

- **Por la espalda, a un guardia que no te vio: lo sacás del tablero de un solo
  golpe y en silencio.** Es la única forma de hacerlo sin un disparo.
- **De frente: es un escándalo** y viene todo el mundo.

Lo que cambia según el arma es qué tan fuerte pega, qué tan rápido, y **si por
la espalda mata o sólo lo deja inconsciente**:

| | Por la espalda | De frente | Qué tan rápido |
|---|---|---|---|
| **La culata** de tu propia arma | **Lo deja inconsciente** | No hace daño, sólo lo aturde | **Rapidísima** — más que un tiro |
| **El cuchillo de monte** | Lo mata | Le saca una vida | Un poco más lenta |
| **El hacha de leñador** | Lo mata | **Le saca tres: lo mata de un golpe** | **Lentísima** |

**La culata es gratis: es lo que ya tenés en la mano.** No es el arma mala que
vas a reemplazar — es la más rápida de las tres y sirve para lo mismo que el
cuchillo. Lo que NO compra es tiempo.

> **Un desmayado se levanta a los 25 segundos**, y mientras tanto está tirado en
> el piso delatándote igual que un cadáver: de lejos nadie distingue. Y cuando se
> despierta ya no vuelve a confiarse nunca. Noquear no es sigilo gratis — es
> sigilo prestado. **Comprar el filo no compra poder: compra que el problema no
> vuelva.**
>
> A cambio, no matar te sale más barato en la horca: un guardia muerto con la
> alarma sonando te sube la recompensa, uno dormido no.

Y si te sobra un segundo, **al que noqueaste lo podés rematar**: un desmayado
cuenta como alguien que no te ve.
- **Los guardias también pegan.** Si los tenés encima dejan de disparar y te
  muelen a golpes, así que pegarse a uno ya no es refugio.
- **Los cuerpos quedan tirados.** Un guardia que ve un cadáver da la alarma.
  Dónde matás importa tanto como a quién.

### Los guardias no pelean todos igual, ni de principio a fin

Un guardia no es un muñeco que dispara hasta que se le acaba la vida. Hay dos
momentos en los que se le nota que es una persona, y los dos dependen de la
situación exacta en la que está:

- **Si lo cargás de frente, se desespera.** Un guardia que te ve, expuesto,
  viniendo derecho hacia él, deja de esperar escondido y te suelta **una ráfaga
  de cinco balas**. Tira más sucio que de costumbre, y si todavía no llegó a su
  cobertura, dispara mientras camina. Correr por el pasillo apretando el gatillo
  dejó de ser gratis.
- **Si le queda un solo tiro de vida y tiene un compañero al lado, se
  repliega.** Te da la espalda y se va caminando por el pasillo, **sin
  disparar** — mientras el otro se planta y sostiene el lugar cubriéndolo.
  Cuando termina la maniobra, el que cubría vuelve a venir por vos.
  **Y el que se replegó ya no vuelve a avanzar nunca:** se queda atrás peleando
  parapetado. Herirlo no lo saca del tablero, pero te lo saca de encima.

**Y no le pasa a todo el tren.** Sólo **un tercio de los guardias viaja
acompañado**; el resto va solo, y a ése no hay quién lo cubra. Que un guardia
tenga con quién replegarse o no es algo que ya estaba decidido por dónde le tocó
viajar, no por lo que hagas vos.

**Y el que está solo, sin nadie con quién replegarse, a veces se rinde.** De
rodillas, con las manos arriba: deja de disparar y de moverse. Ahí la decisión
es tuya — perdonarlo (no tocarlo, seguir de largo) o rematarlo. Las dos mueven
`honor`, el tercer número de tu reputación (junto a `fame`, cuánto te conocen, y
`bounty`, cuánto pagan por tu cabeza): perdonar lo sube, rematar a alguien
rendido lo baja fuerte, rematar a alguien que noqueaste vos lo baja un poco
menos, y matar a un pasajero también pesa. **También sube un poco si elegís
la culata en vez del filo** al noquear a alguien por la espalda que nunca te
vio — dejarlo vivo cuando el cuchillo lo hubiera matado igual de silencioso.
**Y `honor` retroalimenta la rendición**: cuanto más te teman, menos guardias
se entregan — ya saben que los vas a matar igual — y cuanto más te respeten,
más lo hacen.

**Sentarte junto a la fogata del campamento te dice cómo estás parado**:
cuánta fama tenés y qué tan bien (o mal) te ven, en una frase.

**Y un rendido puede estar fingiendo.** Cada tanto, si te alejaste de verdad
(encañonado no se anima a nada), puede decidir jugársela: **se para**, despacio,
de rodillas a de pie, y a mitad de camino cambia de color — el mismo aviso que
ya usa el resto del tren. Si lo tocás mientras se para (el mismo gesto de
rematar de siempre) lo cortás ahí, y esa vez no cuenta como rematar a un
indefenso: viste venir la traición, así que es defenderte, no una ejecución. Si
no reaccionás, termina de pararse y te dispara por la espalda — un solo tiro,
certero, el precio de no estar atento. **Cuanto más pagan por tu cabeza
(`bounty`), más se anima a intentarlo.**

> Los dos avisan igual que siempre: nada de esto le saca a un guardia el gesto
> de levantar el arma antes de disparar. Le sacan la calma, no el telegrafiado.

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

**Y uno de cada cuatro trenes cambia el de ganado por el de armas** (ver "El
vagón de armas", más abajo). Es lo primero que cambia de qué está HECHO el
tren y no sólo quién va arriba — y lo único de todo eso que **se ve desde el
galope**, antes de subir. Es uno de cada cuatro y no la mitad porque no cambia
un vagón: cuando aparece, **hay pólvora repartida por todo el tren**.

**El caballo es uno solo y se queda donde lo dejaste.** Antes de subir elegís
hasta dónde adelantarlo: la cola, el enganche entre el vagón 1 y el 2, o el del
2 y el 3. **Ahí subís vos, y ese punto es la única forma de bajarse del tren.**
Si lo dejaste adelante, la plataforma de cola sigue existiendo pero no hay nadie
esperándote: ir para allá es meterse en un callejón sin salida.

**No miden todos lo mismo**, y es a propósito: si todos midieran igual, el tren
no tendría ritmo — cruzar el de ganado (una bolsa, un guardia) costaría lo
mismo que cruzar el blindado. Anchos: pasajeros 40 baldosas, comedor 34,
correo 32, blindado 30, ganado 24 y **armas 24** — el de armas mide lo mismo
que el de ganado porque, como él, es un vagón de paso.

### El vagón de armas: cuando aparece, cambia el tren entero

**Uno de cada cuatro trenes de CARGA cambia un vagón de ganado por uno de
armas.** Nunca es el primero, y desde afuera se ve cuál te tocó.

> Antes vivía en el tren estándar y se mudó con la reestructuración de los
> tipos. Como el de carga pasó a ser la mitad del sorteo (antes el estándar era
> la otra mitad), **el vagón de armas sigue apareciendo en el 12,5% de los
> asaltos, exactamente igual que antes** — medido con 120.000 trenes. Y como en
> el de carga sobran dos vagones de ganado, la estampida sigue teniendo con qué
> jugarse.

Y cuando aparece **no cambia sólo su propio pasillo**: hay barriles de pólvora
repartidos por casi todos los vagones — el comedor, el correo, el blindado. El
único que nunca lleva es el de pasajeros. Un tren con vagón de armas es un tren
distinto de punta a punta, y por eso es uno de cada cuatro y no la mitad.

**Y nunca viaja pegado al blindado**, ni es el primer vagón ni el último:
siempre tiene un vagón de por medio con la caja fuerte, y siempre tiene vecinos
a los dos lados. Tres de cada cuatro veces el blindado queda **más adentro** que
él —así que la pólvora te queda de camino a la caja fuerte, que es lindo porque
la puerta del blindado se abre justamente con dinamita— y una de cada cuatro
**el blindado aparece antes**. (El motivo de fondo es otro: pegados, la ronda
del Dinamitero se rompe. Ver más abajo.)

Un barril de pólvora es tres cosas a la vez:

| | |
|---|---|
| **`[E]` sostenido** | Te llevás **un cartucho de dinamita** — si ese barril tiene uno. Es el único lugar del juego donde se repone algo |
| **`F`** | Lo **empujás**: sale rodando hacia la cola y se vuelve tuyo (ver abajo) |
| **Tres balazos** | Se prende, con una mecha corta — y **arrastra a todos los del vagón** |

**No todos te dan dinamita, y ésa es la regla nueva.** Todos explotan igual:
todos llevan la franja roja cruzada, que se ve de lejos. Pero sólo uno de cada
tres tiene un cartucho armado adentro; en los demás hay pólvora suelta y nada
que guardarse. **Se sabe al acercarse**: a los que te dan uno se les ven tres
cartuchos asomando por la tapa. De lejos, todos son exactamente la misma
amenaza.

> Un tren con pólvora repartida trae unos ocho o nueve barriles, y de ésos salen
> unos **tres cartuchos** — justo lo que te entra encima. Recorrer el tren entero
> te llena la cartuchera y ni uno más.

**Y sacarle el cartucho lo desactiva.** El barril no desaparece: queda **vacío**,
y un barril vacío ya no explota nunca más. Sigue frenando balas y se sigue
pudiendo empujar — pero deja de ser una bomba. Son tres estados y cada señal
dice una cosa: la franja roja, *esto explota*; los cartuchos asomando, *y además
hay uno para vos*; la tapa abierta con un hueco negro, *de acá ya sacaste*.

**El tope es tres cartuchos.** Si llegás con la dinamita llena, el barril no se
abre: lo que te queda es una bomba puesta en el mapa.

**Y lo prende CUALQUIER bala, no sólo la tuya.** Un guardia que te tira y falla
también puede volar un vagón. Cada barril aguanta tres tiros, así que una bala
perdida no alcanza — pero un tiroteo sostenido ahí adentro sí.

**La cadena es del VAGÓN, no del tren.** Cuando algo explota, se prenden los
barriles **de ese vagón** y ninguno más: no hay una reacción que recorra el tren
de punta a punta. Y avanza, no estalla junta — cada uno prende al siguiente unas
décimas después, del más cercano al estruendo al más lejano, así que **se puede
correr mientras llega**. Pero la onda va más rápido que vos, así que hay que
salir **para el lado donde ya no quedan barriles**.

#### Y el vagón de armas propiamente dicho es un vagón de paso

Es **corto**, como el de ganado, con **dos guardias** y **una sola bolsa**. No
está hecho para quedarse: entrás por la pólvora, o porque está en el camino.

Adentro hay **cuatro barriles** —la mayor concentración del tren— y **ninguna
otra cobertura**. Ahí está toda su tensión: los barriles frenan balas igual que
cualquier bulto, así que son lo único detrás de lo que te podés parapetar, y
aguantan tres tiros antes de matarte. **Cubrirse acá es elegir una bomba.**

**Y una explosión ahí adentro no deja nada.** No es una dinamita grande: es un
vagón lleno de pólvora. Quieto en cualquier parte del centro, morís; en las
puntas salís con la mitad de la vida; y de los guardias no queda uno. La mecha
te da poco más de dos segundos, y **el único refugio es salir** — correrte
adentro ya no alcanza.

**Ninguna caja fuerte**, tampoco: su tensión es otra.

### Y el barril se puede empujar: `F`

> *(En el código estos barriles se llaman `cajon` / `cajonPolvora` — el nombre
> `barril` ya estaba tomado por los que ruedan solos por el pasillo. Son cosas
> distintas: éstos están quietos hasta que vos los movés.)*

Un barril —cargado o vacío— sale rodando **siempre hacia la cola**, nunca hacia
la locomotora: el tren acelera y lo suelto se va para atrás. Por eso `F` no es
tanto empujar como **destrabar**, y por eso, si estás del lado de la cola, sale
hacia vos. Tu propia arma no te distingue.

| Lo que hace rodando | |
|---|---|
| **Atropella** | Al que se le cruza lo tumba un segundo y medio — lo mismo que a vos. **Nunca mata**: si lo querés muerto, le disparás al barril |
| **Rompe la puerta** que se le cruce, de un golpe | Salvo la de chapa del blindado, que lo frena en seco |
| **A veces salta el enganche** | Tres de cada diez cruzan al vagón vecino en vez de caerse al vacío |
| **Y si le disparás** | Cargado, revienta donde esté; vacío, se hace astillas |

**Los guardias lo leen, y no todos igual.** A uno vacío, si le sobra tiempo, le
disparan para hacerlo astillas; si lo tienen encima, se corren al costado. Pero
si ve la franja roja no le dispara a nada: sale del pasillo y **se aleja**.

> Y de ahí sale la mejor jugada del vagón: si el blindado te queda hacia la cola,
> podés mandarle un barril cargado hasta su puerta de chapa —que lo frena— y
> volarla de un tiro, **sin gastar ninguno de tus cartuchos**.

**Y trae un tipo con dinamita dando vueltas.** El *Dinamitero* no se queda
adentro: hace una ronda entre el vagón de armas y los dos de al lado, y tarda
casi un minuto en dar la vuelta entera. Si está adentro cuando empieza el lío,
su primera tanda vuela los barriles de una. **Esperar a que salga es una
jugada**, y es la primera vez que quedarse quieto y mirar resuelve algo en este
juego.

**Y no lo vas a encontrar siempre en el mismo momento.** Arranca cada asalto en
un punto cualquiera de su vuelta y para un lado cualquiera, así que dos asaltos
al mismo tipo de tren no te lo ponen en el mismo lado. Cronometrarlo sirve
**dentro** de un asalto, no entre uno y otro.

> **Por qué el vagón de armas nunca cae pegado al blindado, ni al final del
> tren.** La ronda del Dinamitero va de la mitad de un vecino a la mitad del
> otro — pero necesita vecinos **en los que se pueda entrar**, y el blindado no
> lo es (su puerta de chapa no se empuja desde afuera) ni lo es el final del
> tren. Con cualquiera de los dos al lado, la vuelta se le acortaba a 640-700 px
> en vez de ~1050 y pasaba **55% del tiempo adentro** en vez del 41% normal:
> "esperá a que salga" dejaba de existir. Sólo lo del blindado pasaba en el 43%
> de los trenes con vagón de armas. Ahora el sorteo lo impide.

> Si el vagón vuela, ese tren se quedó sin dónde reponer. Volarlo para sacarte
> de encima a los guardias y perder los tres cartuchos es una decisión, no un
> accidente.

### El Dinamitero: no tiene revólver, y eso lo explica todo

No es un guardia con un cartucho de más. **Es lo único que sabe hacer**, y de
ahí sale cada cosa que le pasa:

| | |
|---|---|
| **Lanza de a DOS a la vez** | Y no al mismo lugar: **una a cada lado tuyo**. No te cierran un camino, te cierran los dos |
| **Tarda 5 segundos en recargar** | Y en esos cinco segundos está **desarmado del todo**. Es la mejor ventana del vagón |
| **Se le ven los cartuchos** | Dos en la bandolera cuando está cargado, dos huecos oscuros cuando no. Desde lejos se sabe si conviene entrar ahora o esperar |
| **No se cubre nunca** | Necesita el pasillo libre: parapetado se taparía el tiro a sí mismo. Está siempre a la vista |
| **Pero aguanta cuatro balazos** | El techo del juego, y el único guardia común que lo toca. No tiene con qué contestar de lejos: lo que compra es durar |
| **Y si te le pegás, retrocede** | Su cartucho tiene un mínimo — más cerca se volaría él. Acercarse es la respuesta, pero hay que perseguirlo |
| **Lleva la llave del tren** | Una puerta trabada no lo frena: la abre y sigue. Es el único del tren que puede — y si lo venís siguiendo, te deja unos **tres segundos** para colarte detrás suyo antes de que se cierre |

**Parado justo en el medio de una tanda perdés dos de tus cuatro vidas**: caés
en el borde de las dos, no en el centro de ninguna. Lo que mata es correr hacia
una de las dos sin mirar dónde cayó la otra.

> Tira más lejos que vos —su brazo llega a nueve baldosas y media, contra las
> seis y media de tu dinamita— y es lo justo: vos le podés contestar con el
> revólver desde donde quieras, y él no tiene con qué.

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

### Los dos tipos de tren

Además de qué tan escoltado viaja, cada tren tiene un TIPO — un catálogo en
`data/train.js` (`TRAIN_TYPES`), igual patrón que las armas o los caballos.

**Hubo tres, y el eje era la velocidad**: rápido, lento y punto medio. Eso es un
eje de dificultad disfrazado de variedad — un tren que se distingue por su reloj
es el mismo tren con otro cronómetro. Ahora son dos y **se distinguen por lo que
traen adentro**:

| | Sale | Vagones | El asalto dura | Qué te ataca |
|---|---|---|---|---|
| **De pasajeros** | 50% | 6, normales | 145s | **La gente te delata** |
| **De carga** | 50% | 8, mayoría mercancía (uno es el **almacén**) | 165s | **El tren te ataca a vos** |

La regla del reparto es **una mecánica, una sola casa**: si algo aparece en los
dos trenes, no distingue nada.

| | **De pasajeros** | **De carga** |
|---|---|---|
| **Suyo, y de nadie más** | El pasajero rico con su guardaespaldas, la caja fuerte oculta, los testigos, el civil encubierto, y los dos que suben por vos (**el Cazarrecompensas y el Sheriff**) | **La carga que se suelta** y **el piso que traiciona**, el ganado que se puede soltar, **el vagón de armas** con su pólvora y su Dinamitero, y **el vagón almacén** con la mercadería que después hay que vender |
| **La pregunta** | ¿podés robarles sin que ninguno grite? | ¿podés cruzarlo sin que el tren te mate? |

**Los barriles que ruedan y el piso traicionero eran del tren veloz y se mudaron
al de carga**, y no por conveniencia: un barril que se suelta en el pasillo **es
carga suelta**. Nunca pertenecieron a "el tren rápido" — pertenecen al tren que
lleva carga.

Y ahí apareció algo que no se buscaba: en el tren del sigilo, un barril no es un
peligro de combate —no te saca vida— pero **el porrazo se oye**. O sea que en el
de carga, la carga suelta es lo que te delata. Y encaja con la mochila en vez de
pelearse con ella: en este tren todo lo que te complica es carga — la que se
suelta y te tumba, y la que llevás en la espalda y te frena.

### En el de carga no se roba plata: se roba mercadería

Del tren de pasajeros salís con el bolsillo lleno. Del de carga salís **cargado
de cosas que todavía no valen nada**, y el asalto te deja una tarea: encontrar a
quién vendérselas.

| Nivel | Vale | De dónde sale |
|---|---|---|
| **Común** *(fardo de tabaco, cajón de whisky, rollo de telas…)* | $45-95 | Las bolsas |
| **Valioso** *(cubertería de plata, estuche de relojes, polvo de oro…)* | $220-560 | Una caja fuerte |
| **Raro** *(reloj de oro, documentos lacrados, lingotes de plata)* | **$900-1800** | **Sólo** una caja del almacén, o una caja fuerte oculta |

Uno de cada cinco cajas del almacén trae el raro, o sea que **cuatro de cada diez
trenes de carga llevan al menos uno**. Y la caja oculta es el otro lugar — también
en el tren de pasajeros, que es lo único que ahí te puede dejar algo para vender.
Estaba escondida por algo.

**Y se ve lo que es.** La mercadería no es un cuadrado amarillo en el piso como
la plata del tren de pasajeros: son **cajones con listones, fardos atados con
soga, rollos de tela, sacos, estuches, un botiquín con su cruz, lingotes
apilados, papeles con sello de lacre**. Todo con su sombra, y **apoyado contra la
estiba** en vez de tirado en el medio del pasillo.

El color lo da el nivel (madera lo común, gris de chapa lo valioso, dorado el
raro) y la forma la da la silueta, así que de un vistazo sabés las dos cosas sin
que ninguna tape a la otra.

### La mochila: dieciséis casillas, y cada cosa tiene su forma

Llevás una mochila en la espalda —**se le ve el bulto, y crece con lo que
metés**— y adentro hay una grilla de **4×4**. Se abre con `TAB`, y el reloj sigue
corriendo mientras la mirás.

| Forma | Qué |
|---|---|
| **1×1** | Reloj de oro, documentos lacrados, joyero, polvo de oro, **un cartucho de dinamita** |
| **2×1** | Cubertería de plata, estuche de relojes, botiquín |
| **3×1** | Fardo de tabaco, rollo de telas, saco de café, atado de cueros |
| **2×2** | **Lingotes de plata**, cajón de whisky, cajón de munición, caja de herramientas |

**Y no alcanza con que sobre lugar: tiene que sobrar lugar de la forma
correcta.** Tres atados acostados ocupan nueve casillas y dejan siete libres — y
un cajón de 2×2 **ya no entra**, porque lo que queda son columnas sueltas de una
casilla. Un anillo, en cambio, entra en cualquier rendija.

**Y se ven las dieciséis casillas siempre**, aunque un cajón ocupe cuatro: cada
casilla ocupada se pinta por separado, con su separador, y **un contorno claro
rodea el bulto entero**. Así se lee todo sin una palabra — *hueco oscuro entre
casillas, la misma cosa; línea clara, ahí termina un bulto y empieza otro*. De un
vistazo sabés cuánto abulta cada cosa y de qué forma es el lugar que te queda.

Los bultos largos **se acuestan solos** cuando los levantás, si es lo único que
cabe: un atado de 3×1 entra parado en una columna. Agarrar nunca te hace parar a
pensar — este juego cobra en tiempo y exposición, no en administración.

### Y adentro se acomoda con el mouse

**Arrastrás los bultos con el clic izquierdo**, como en cualquier mochila, y
mientras lo llevás en la mano se ve el hueco que dejó.

| | |
|---|---|
| **La ruedita** | **Gira** lo que tenés agarrado. Es lo que te deja decidir si un atado va acostado o parado, en vez de que lo decida el juego |
| **Verde o rojo** | La silueta encajada en la grilla te dice si ahí entra, **antes** de soltar — y ya te muestra girado si va a tener que girar para caber |
| **Si no entra** | Vuelve exactamente de donde salió. **Arrastrar no te puede hacer perder nada**: para tirar algo está el clic derecho |
| **El mouse por encima** | Te dice qué es y **cuánto vale de base** |

El precio dice **base** porque es el del objeto, no el que vas a cobrar: el
perista lo duplica si la mercadería salió limpia y lo mueve hasta un ±20% según
tu nombre, y eso no se sabe todavía parado en el pasillo de un vagón.

### Y se puede soltar: ahí está la decisión

**Clic derecho, o `E` sobre lo que señala el cursor.** El cursor también se mueve
con `W A S D`, y lo señalado se resalta en la grilla **y** en la lista de abajo.

**Lo que sueltas no se destruye: cae a tus pies** y se puede volver a levantar
(rápido, porque ya está abierto y tirado en el piso). Así soltar no es tirar, es
**cambiar** — soltás el saco de café, agarrás los lingotes, y el café sigue ahí
si cambiás de idea. Si te vas sin él, cuenta como botín que dejaste.

Sin esto la mochila era un callejón: se llenaba por orden de llegada y no había
forma de cambiar nada, así que "¿cuál me llevo?" no era una decisión sino el
orden en que te cruzaste las cosas.

> **La dinamita no se suelta**, y es a propósito: de un cartucho te deshacés
> usándolo. Si hace falta el lugar, la respuesta es tirarlo — que además hace algo.

**Y mientras revolvés la bolsa no te movés, no apuntás y no disparás.** El mundo
sigue andando: los guardias caminan, el reloj baja y los jinetes siguen tirando
por la ventanilla. No es una pantalla de gestión — es un tipo parado en un pasillo
con la bolsa abierta, y eso se paga como todo acá. Reacomodar la carga en medio de
un tiroteo cuesta; hacerlo en un vagón vacío es gratis. **Elegir dónde hacerlo es
parte del juego.**

> **La dinamita entra en la misma mochila**, y de ahí sale sola la asimetría
> entre los dos trenes: en el de pasajeros se roba plata, que no ocupa lugar, así
> que la mochila queda libre para explosivos; en el de carga, cada cartucho es
> una caja que no te llevás.

**Y el bulto te frena.** Media mochila es gratis; de ahí en adelante el freno
sube derecho hasta **−25%** con la mochila llena (nació en −35% y se bajó jugándola). Reemplazó al sistema viejo, que
te frenaba por lo que la plata VALÍA: unos documentos de $1.500 no pesan, un saco
de café de $60 sí.

Ahí está la decisión que el de carga no tenía: no es "¿me alcanza el reloj?", es
**"¿cuál me llevo?"** — una caja del almacén, que puede traer el raro, compite
contra el cajón que ya tenés adentro.

**Un objeto sólo se conserva si escapás**, sin rescate parcial: unos billetes se
esconden en la bota, un lingote no.

### El perista: el precio lo deciden dos cosas que no se ven

Te compra el lote entero de un gesto, y **te dice el precio desglosado** —
porque es la única forma de que dos sistemas invisibles se puedan jugar:

| | |
|---|---|
| **Mercadería limpia** | Si en ese asalto **no sonó la alarma**, nadie está buscando la carga y **te paga el doble**. Es el bono de trabajo limpio (que se calcula sobre el dinero, así que acá no se podía aplicar) dicho en el idioma de este tren |
| **Tu nombre** (`honor`) | Al que tiene fama de cumplir no lo estafan; al que todos desprecian le ofrecen dos monedas. **Hasta ±20%** |

Los escalones de honor: nada entre −15 y 15, **±3%** pasando 15, **±8%** pasando
40, **±15%** pasando 60 y **±20%** pasando 100. Son escalones y no una recta a
propósito: así hay un momento en que *cruzás* algo y el precio cambia de verdad.

Un lote típico (dos cajas y tres bolsas) paga **$1.336** si la mercadería está
marcada y **$2.672** si salió limpia — y entre el peor y el mejor nombre posible,
de $2.271 a $3.206.

> Es el primer lugar donde `honor` cuesta plata. Y queda anotado lo que deja
> desbalanceado: el honor bajo pasó a ser **puro castigo** (ya te costaba que
> menos guardias se rindan) sin que ser temido te dé nada a cambio.

### El vagón almacén: el depósito, y viaja siempre

El tren de carga lleva **un vagón almacén**, y a diferencia del de armas **no se
sortea: está siempre**. Es a propósito — el de armas es una sorpresa que te
cambia el plan del día; éste es la razón por la que subís a un tren de carga, y
algo que decide la identidad de un tren no puede aparecer una de cada cuatro
veces.

| | |
|---|---|
| **Viaja cerrado con llave** | **Sus dos puertas nacen trabadas.** No son de chapa: son madera y se rompen a tiros como cualquier otra — **pero eso hace ruido** |
| **Dos cajas fuertes** | Es el único lugar del tren donde vale la pena quedarse ocho segundos quieto, dos veces. El resto del de carga reparte su botín en bolsas |
| **Cuatro guardias, y son BLINDADOS** | Aguantan un tiro más y se les ve la placa. Son los únicos duros del tren de carga — y quedan **encerrados adentro**: nadie sale a buscarte y nadie entra a ayudarlos. Romper la puerta te deja de una con los cuatro, esperándote |
| **Estanterías gruesas** | Pasillos más angostos que los del correo: adentro se pelea peor. Es un depósito, no un furgón de reparto |
| **Nadie a quien preguntarle** | No lleva pasajeros, como todo este tren |
| **Nunca es el primer vagón** | Lo más caro del tren no puede quedar a un paso de la salida |

Mide lo mismo que el vagón de correo liviano al que reemplaza, así que el tren
no cambia de largo ni su reloj de 165 s.

**Y el tren de carga ya no lleva vagón blindado.** El almacén heredó su papel —y
sus cuatro guardias duros— con otra llave: aquél era "el premio y la trampa" y
sólo lo abría la dinamita; éste es el premio con la puerta trabada, que se abre
**a los gritos**. Que en este
tren no haya ningún lugar que exija explosivos es coherente con lo que es: acá
no viaja el oro del banco, viaja mercadería.

> El precio de las dos cajas fuertes dejó de ser *matar a los guardias que las
> cuidan* —que en un tren de carga son pocos— y pasó a ser el precio de siempre
> de este juego: **tiempo y exposición**. Acá no se entra callado.

**El de carga es además la primera respuesta real** al botín demasiado
concentrado que anotan las notas de diseño (ver NOTAS-DISENO.md): en vez de una
caja fuerte grande en un vagón, varias bolsas chicas repartidas en varios.

> **El tren veloz no se borró: quedó apagado** (`peso: 0`), igual que "Alta
> vigilancia" y el Pistolero. Sus seis vagones cortos siguen escritos en
> `data/wagons.js`. Lo único que se pierde de verdad es su reloj de 90 s — y si
> alguna vez se lo quiere de vuelta, el lugar correcto ya no es un tipo de tren
> sino un estado más ("tren expreso"), que se le puede tocar a cualquiera de los
> dos.

### En el tren de carga, la pregunta es: ¿podés llevártelo entero sin que nadie grite?

El de pasajeros te pregunta **cómo llegar** y **a quién le creés**. Éste
pregunta otra cosa: **si podés hacerlo sin despertarlo**. Es el único donde eso
es realmente jugable — guardias sueltos, mucho espacio y tiempo de sobra.

Y desde la reestructuración de los tipos, es también el tren al que **el propio
tren le juega en contra** (los barriles que ruedan, el piso que tironea, la
pólvora). Las dos cosas parecen contradecirse y no lo hacen: un barril no te
saca vida, **te tumba y hace ruido**. En el tren del sigilo, la carga suelta es
justamente lo que te delata.

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

**Lo que llevás encima te frena, pero por lo que abulta, no por lo que vale.**
Hubo un sistema anterior, exclusivo de este tren: con la alarma sonando, cada
$100 encima te sacaba un 2% de velocidad. **Se retiró.** Ahora el freno lo decide
la mochila, en los dos trenes y suene o no la alarma — ver "La mochila", más
arriba.

> Es la misma familia de castigo que sostiene todo lo demás: acá nada te quita
> vida por equivocarte — el barril te tumba, la caja fuerte tarda, el salto
> sucio despierta un vagón. Todos cobran en **tiempo y exposición**. Que cargar
> te vuelva lento en vez de sacarte algo es esa regla, aplicada a *cuánto
> llevás* en lugar de *cuánto tardaste*.

### Y en el de carga, el tren también es tu enemigo

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

### Conocés los vagones, pero nunca sabés qué te vas a encontrar

El tren de pasajeros es el mismo de siempre: seis vagones, los que ya conocés.
Lo que cambia es **quién viaja y cómo está el tren ese día**, y se sortea de
nuevo en cada servicio.

**Y ahora esto le pasa a los DOS trenes.** Antes era exclusivo del estándar, o
sea que la mitad de tus asaltos no veía nunca una tormenta, ni una redada, ni
una puerta trabada, ni un vagón conversando: todo el trabajo de "variedad de lo
que pasa en los trenes" le tocaba a la mitad del juego. El clima y una redada no
son la identidad de nadie — son el día que le tocó a ese servicio, y eso le
puede tocar a cualquiera.

Lo que **sí** es exclusivo del tren de pasajeros son las tres cosas que
dependen de tener a quién amenazar: **el paquete, el civil encubierto y la caja
fuerte oculta**. La única forma de enterarte dónde está la caja escondida es que
te lo suelte un pasajero, y el de carga lleva un solo vagón con gente: esconder
una caja ahí sería esconderla de verdad.

**Cómo está el tren** — pueden salir varias a la vez, o ninguna:

| | Qué pasa |
|---|---|
| **Tormenta** | **Te tapa**: la lluvia se come el ruido, así que te oyen mucho menos. Y se oye de verdad — lluvia sobre la chapa del techo y truenos (ver abajo) |
| **Alerta ya activada** | Subís con la alarma sonando, antes de hacer nada. Es el que más caro se paga, así que es el más raro |
| **Redada** | Más guardias (cada patrulla viene duplicada) **y** pelean mejor. Sólo si ya pagan bien por tu cabeza |
| **Puerta bloqueada** | Una, dos o tres puertas vienen **trabadas**: empujarlas no las abre, hay que romperlas a tiros. Nunca sabés cuáles ni cuántas |

#### La tormenta es la noche del ladrón

**La lluvia tapa el ruido**, así que con tormenta te oyen bastante menos:

| | Despejado | Tormenta |
|---|---|---|
| Un disparo se oye a | 14 baldosas | **8** |
| Tus pasos, a | 3,6 baldosas | **2** |

Medido con un guardia quieto y de espaldas: **pegado a él te oye catorce veces
menos, y a dos baldosas y media ya no te oye nada**. Caminar deja de delatarte.

> **Y el clima se ve en el mapa antes de elegir la vía**, así que la tormenta no
> es una lotería que sufrís: es una decisión. Esperar el tren con lluvia para
> hacer el trabajo limpio es una jugada.

**Lo que NO cambia** es a cuántos vagones despierta un disparo — eso lo deciden
tu arma y el tipo de tren, y siguen igual. La tormenta te ayuda a **moverte**,
no a tirotear.

#### Y además te dice cuándo estás expuesto

La lluvia no suena igual en todos lados, y ahí está lo que la hace útil además
de linda:

| Dónde estás | Qué oís |
|---|---|
| **Bajo techo**, adentro de un vagón | El agua **golpeando la chapa** encima tuyo. Es el sonido más fuerte de la tormenta |
| **En un enganche**, en el **vagón de ganado** o **arriba del techo** | La chapa se apaga y suben **el agua y el viento**: ahora te está lloviendo a vos |

Y eso es exactamente cuándo los jinetes de afuera te pueden pegar un tiro. **Se
oye que saliste** sin que ningún cartel lo diga — el clima ya era la señal.

Los truenos caen cada nueve a veintidós segundos, y uno de cada cuatro cae
cerca: ése es el único que corta el fondo y te hace levantar la cabeza. No hacen
nada — todavía.

**Qué está haciendo la gente de cada vagón** — uno por vagón:

| | Qué ves |
|---|---|
| **Normal** | Su ronda de siempre |
| **Conversando** | Dos guardias parados, **enfrentados**, hablando (se les ven frases cortadas arriba de la cabeza). Distraídos: sospechan más lento y ven la mitad |
| **Vigilando la puerta** | Uno se planta en la puerta y la mira. Los demás siguen su ronda |
| **Vigilando la caja** | Lo mismo, pero pegado a la caja fuerte. Sólo donde de verdad hay una |

Los dos que vigilan dicen **VIGILANDO** arriba de la cabeza todo el tiempo:
es un estado, no una frase suelta.

**Y qué se lleva ese vagón.** Uno de cada dos trenes trae un **paquete**: un
objetivo valioso con su custodia, metido en un vagón cualquiera. Hasta ahora
el valor de un vagón estaba escrito en su tipo —el correo tenía la caja, el
blindado el premio gordo—, así que sabiendo qué vagón era sabías qué te
esperaba. Un paquete rompe eso: el vagón de pasajeros de siempre puede ser,
esta vez, el que más plata lleva arriba.

**Un pasajero rico**, en algún vagón con gente: lleva encima cuatro veces lo
que lleva cualquiera, pero **tarda más en soltarlo** — más tiempo quieto, y
con alguien mirando. Se lo reconoce por el **sombrero de copa**: es la
silueta más alta del tren, asoma por encima de los respaldos.

**La pista de que hay algo es el guardaespaldas**: un guardia plantado al
lado que no patrulla y dice **VIGILANDO** arriba de la cabeza, igual que los
que cuidan una puerta. Te avisa que ahí hay algo, y no te dice qué.

### Y una caja fuerte escondida, en cualquier vagón

Uno de cada cuatro trenes esconde una caja fuerte **que no se ve**. Puede
estar en cualquier vagón menos el blindado, y no está a la vista: no se
dibuja, no se puede abrir, para vos no existe.

**Tres pasajeros del tren saben dónde está.** No hay nada que los distinga
de los otros diez, ni tienen por qué viajar en el mismo vagón que la caja.
Cuando amenazás a uno de los tres, además de la plata te suelta el dato:

```
VAGÓN 3: DEBAJO DE UNA MESA
```

Y eso es todo lo que te llevás: **la caja no se marca en pantalla**. Tenés
que ir hasta ese vagón y buscarla — aparece recién cuando la tenés al lado,
como cualquier cosa al alcance de la mano. Los escondites son cinco y
dependen del vagón: debajo de una ventana o debajo de un asiento en los de
pasajeros, debajo de una mesa en el comedor y el correo, junto al corral en
el de ganado, y **entre las estanterías** en el de armas — que es el mejor lugar
del tren para esconder algo, y el único donde ir a buscarla puede costarte el
vagón entero.

Vale más que una caja normal ($400-900 contra $150-600) y tarda más en
abrirse (8 segundos contra 6,5): estaba escondida por algo.

> Y por eso amenazar pasajeros dejó de ser siempre la misma cuenta. Antes
> eran unos pesos ahora y un grito dentro de cuatro segundos, así que pasado
> el primer asalto saltearlos era casi siempre lo correcto. Ahora cualquiera
> de ellos puede ser el que sabe dónde está la mejor caja del tren, y no hay
> forma de saber cuál.

**Y quién viaja armado.** Acá está lo que no se ve venir — pero **hoy los
tres están construidos y apagados**, esperando su momento igual que "Alta
vigilancia". Ninguno sale sorteado todavía: prenderlos es cambiar un número
en `data/modifiers.js`, no escribir código.

- **El pistolero.** Dos revólveres, gatillo velocísimo y puntería floja: te
  llena el pasillo de plomo —**tandas de cuatro tiros casi pegados, tres
  veces y media más balas que un guardia común**— y **no se cubre nunca**:
  se planta en medio del pasillo a disparar. Es el
  más peligroso y el más fácil de matar a la vez: aguanta lo mismo que
  cualquiera y siempre está a la vista. **Sólo se esconde si lo obligás**:
  si te perdió de vista busca dónde parapetarse, y en cuanto te vuelve a ver
  sale otra vez al pasillo. Y si un compañero suyo le tapa el tiro, se corre
  al costado o se adelanta para recuperar el ángulo — no espera turno. Se lo reconoce por las dos culatas
  al cinto, y por el segundo caño cuando dispara. **Sólo aparece cuando ya
  sos alguien**: hace falta que paguen caro por tu cabeza Y que te tengan
  miedo — las dos cosas a la vez.
- **El civil encubierto.** Uno de los pasajeros no es un pasajero. Se lo
  puede rodear, asustar y robar como a cualquiera, y no hay nada que lo
  distinga — hasta que **le das la espalda**. Ahí saca el arma: se oye el
  martillo del revólver y se lo ve sacarla, un segundo largo, antes del
  primer tiro. Si estás atento, llegás a darte vuelta.

  Encañonado no se anima: mientras le apuntes es un pasajero asustado como
  cualquier otro. **El pánico y el temblor son parte del disfraz.**

  **Y sigue vestido de civil cuando pelea.** No se convierte en un guardia
  con sombrero: es el mismo tipo de recién, ahora en rojo y con un arma. Lo
  que te deja no es un enemigo más — es la duda, para todo el resto de la
  partida.

> **Por qué están apagados.** El pistolero y el civil encubierto se jugaron y
> se afinaron (de ahí salieron dos bugs de verdad: la cadencia del pistolero
> que no se aplicaba, y que se quedaba clavado cuando un compañero le tapaba
> el tiro), y quedaron en reserva para volver a prenderlos cuando el resto
> del sistema de variedad esté armado. Son llaves, no amputaciones — la misma
> decisión que ya se tomó con "Alta vigilancia".

**El dinamitero, en cambio, ya está en el juego** — pero no como un sorteo
suelto, sino como un tipo con nombre y lugar: hay UNO por tren que traiga el
vagón de armas, dando vueltas por ahí (ver "El vagón de armas", más arriba).
Repartir además dos o tres al azar por el tren fue justamente lo que se
descartó: si cualquiera puede tener dinamita, mirar dónde está el que la tiene
deja de servir para nada.

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
  del mismo modo. Pero **sólo le tiran a la puerta que tienen al lado**: nadie
  vacía el cargador hacia un punto al que su propia bala no llega, ni con un
  compañero metido en la línea.
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
- **Y una puerta trabada sí la abre el Dinamitero**, que lleva la llave del
  tren. La cruza y **se cierra detrás suyo, todavía trabada**: para vos la
  única llave sigue siendo el plomo. Lo que te deja es una ventana de **unos
  tres segundos** —la sostiene mientras cruza, más el vaivén de siempre— si
  estabas cerca cuando pasó.

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

| Dónde saltás | Reloj de la persecución que sobra |
|---|---|
| La cola | ~34 s |
| Enganche 1-2 | ~19 s |
| Enganche 2-3 (el máximo del Criollo) | **~11 s** |

Con el **Mustang** (más rápido, pero con menos fondo) el máximo es el
enganche 1-2, y llega ahí con ~31 s de sobra. Cada caballo tiene su propio
techo — ver "El caballo tiene tres números", más arriba.

> El reloj de la aproximación son **45 segundos**. Ese número se mueve cada vez
> que cambia el largo de la persecución, y siempre con el mismo criterio: lo que
> tiene que quedar igual es **lo que te sobra después de alcanzar la cola**,
> porque ahí es donde vive la decisión de hasta qué enganche adelantarte — y ésa
> ya está jugada y afinada.

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
- La caja fuerte tarda **8 segundos**, **hace ruido** y **no sabés cuánto
  tiene hasta abrirla**: entre $150 y $600. A veces es una buena tarde y a
  veces te arriesgaste al pedo. Es una apuesta, no una cuenta — y son ocho
  segundos quieto, de espaldas, en un vagón que ya te oyó. El blindado
  tiene **dos**.

  **Con el arma en la mano no se abre.** Disparar o recargar interrumpe el
  forcejeo: hay que resolver el vagón primero y robar después. Pero **lo que
  llevabas no se pierde** — volvés y seguís desde donde ibas, así que los
  ocho segundos se pueden pagar en cuotas.

  **Y si no querés esperar, la reventás con dinamita.** Queda abierta con el
  botín a la vista y levantarlo cuesta lo que una bolsa. No es gratis: te
  come uno de tus dos cartuchos y la alarma suena sí o sí. Una caja reventada
  se ve distinta de una cerrada, para que sepas de un vistazo cuál te falta.
- **Y de vez en cuando, una caja fuerte es el golpe de tu vida de verdad.**
  Una de cada veinte trae mucho más: entre $2.500 y $4.000, ocho o nueve veces
  lo normal. Nada avisa cuál — se ve exactamente igual a cualquier otra hasta
  el segundo en que la abrís.
- **Si escapás sin que suene la alarma, el botín vale el doble.**
- Para escapar hay que llegar a donde dejaste el caballo y mantener `E`.
- **No hay otra salida.** No podés tirarte del tren, y el caballo está en un
  solo lugar. Si te matan o se acaba el tiempo, te capturan — y ahí importa
  DÓNDE estabas.

**Morir cerca del caballo no es lo mismo que morir lejos.** Si te agarran a
metros de la salida, te quedás con la mitad de lo que habías juntado — casi
lo lográs, y se nota en el bolsillo. Si te agarran en la otra punta del tren,
apenas un 10%: seguís perdiendo casi todo, pero nunca absolutamente todo. En
el medio, escala según qué tan lejos estabas de verdad.

**Y encadenar asaltos limpios paga cada vez más.** Cada uno seguido —sin que
la alarma sonara, escapando de verdad— suma un bonus extra por encima del
doble de siempre: +8% más por cada uno de la racha, hasta un techo de +150%.
El premio se siente en el mismo asalto que lo extendés, no en el siguiente. Y
se corta con **cualquier cosa que no sea un escape limpio** — te agarraron, o
escapaste pero ya te habían oído — así que sostenerla de verdad da miedo
perderla: en la pantalla de resultados, si la cortás, te dice cuánto llevabas.

### La ley cabalgando afuera

Con la alarma sonando, a los **25 segundos** aparecen **los dos primeros
jinetes de la ley juntos**, uno de cada lado. Tardan: la ley no está pegada
al tren, tiene que llegar. Cuando llegan, tiran seguido — mal, pero seguido.

**Cuántos llegan garantizados depende de tu recompensa** (`gameState.bounty`,
la que ya traías al subir a este tren, no lo que hagas durante el asalto). Si
da para más de dos, los que sobran llegan de a uno, cada 15 segundos:

| Recompensa al subir | Jinetes garantizados |
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
todos hasta llegar a ese piso: lo que cambia con la recompensa es cuántos
llegan garantizados, no qué tan rápido. **Pero ninguno de los dos es un
techo real** — pasado el piso, siguen llegando cada vez más seguido mientras
la alarma no se apague, la misma escalada que la gente de la locomotora.

**Y esos de más no vienen todos detrás tuyo.** Los garantizados persiguen
como siempre; los que llegan por la escalada nacen **emboscadores**: reclaman
una ventana bien adelante —hacia la locomotora— y se quedan ahí, quietos,
esperando. No los ves venir corriendo: los encontrás ya apostados cuando
llegás a esa parte del tren. En cuanto los cruzás, dejan de esperar y pasan a
perseguir como cualquier otro. Es la diferencia entre que la ley te rodee
(todos atrás) y que la ley te espere (algunos adelante, sin que sepas
exactamente dónde hasta que estás ahí).

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

**Con $900 o más de recompensa, en los trenes DE PASAJEROS ya no viajás solo.**
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

**Y no aparece en el tren de carga**, a propósito: ése ya tiene su propio
enemigo — el tren mismo, y la pregunta del sigilo.

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

### El Sheriff: el que nunca te viene a buscar

**Entre $600 y $899 de recompensa, hay chance de que viaje un sheriff en tu
próximo tren de pasajeros.** No es seguro: es una apuesta cada vez que subís.

Es el opuesto exacto del cazarrecompensas. Aquél viene por vos; éste **no da un
solo paso hacia vos**. Aguanta **tres balazos** —entre un guardia común y uno
blindado— y apenas suena la alarma **sale caminando hacia la locomotora**.

**Se defiende, pero no te persigue.** Si lo encarás se planta, se cubre y te
dispara como cualquier guardia; en cuanto le cortás la vista, retoma la
caminata. O sea que esconderte de él no te da un respiro: te lo aleja.

**Y no se repliega hasta la locomotora: se repliega hasta donde puede.** Si el
vagón blindado le queda en el camino, esa puerta de chapa lo frena a él igual
que a vos —la única llave sigue siendo la dinamita— así que termina plantado de
espaldas a la chapa, en el último metro de tren que le queda, esperándote.

Lo difícil no es matarlo. Es **llegar**:

- **Se lleva tres guardias con él.** Donde va, van. Y se suman a los que ya
  viven en cada vagón que cruzás persiguiéndolo.
- **Esos tres no te cargan: te esperan.** Pelean parapetados alrededor de él,
  se asoman **por lados opuestos** para cubrir dos ángulos en vez de uno, y
  **se turnan**: nunca están los cuatro expuestos a la vez. No los vas a poder
  sacar de su cobertura haciéndolos venir. Matando al Sheriff dejan de ser
  escolta y salen a buscarte como guardias normales — o sea que ganar tiene su
  propio precio.
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
- **Los de adelante no vienen a buscarte, pero tampoco se quedan quietos donde
  estaban.** Van directo a la puerta de SU vagón, listos de verdad — no
  alertas nomás, en combate — y ahí se plantan. No cruzan a buscarte, pero
  cuando empujes esa puerta no te va a recibir nadie dormido: te va a estar
  esperando alguien que ya tiene el arma lista. (Los guardias del blindado
  quedan afuera de esto — ya tienen su propia regla, "nunca abandonan el
  puesto", y con eso alcanza.)

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

**Y cuanto más te quedás, más seguido vienen.** Los primeros cuatro llegan
cada 16 segundos, pero de ahí en más el intervalo se acorta con cada uno: si
la alarma sigue sonando pasado el minuto y medio, están entrando casi cada 6
segundos — el mismo ritmo con el que arrancó, ahora sin techo. Quedarte a
robar un vagón de más no es gratis nunca, pero quedarte MUCHO de más se pone
literalmente peor con cada segundo, no sólo más caro en reloj. Con los jinetes
de afuera pasa exactamente lo mismo.

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
| `player.dynamiteMax` | **Cuántos cartuchos te entran encima** (salís con `player.dynamite`, y el vagón de armas te sube hasta acá) |
| `explosives.cajonPolvora.vida` | **Cuántos tiros aguanta un barril de pólvora** antes de prenderse. Es la perilla que decide si el vagón de armas es una lotería o una decisión |
| `explosives.cajonPolvora.fuse` / `cadena` | La mecha del barril, y cada cuánto prende al siguiente. **Los dos números que deciden si se puede escapar de la cadena** |
| `explosives.cajonPolvora.recarga` | Cuántos cartuchos te da abrir uno |
| `explosives.cajonPolvora.chanceCartucho` | **Qué proporción de barriles trae un cartucho para llevarse.** Todos explotan igual; esto decide sólo cuántos además te dan algo, y es lo que mantiene la dinamita escasa con pólvora repartida por todo el tren |
| `TRAIN_TYPES.estandar.sustituciones` | **Cada cuánto sale el vagón de armas** (y con él la pólvora en todo el tren) |
| `explosives.cajonPolvora.lethalRadius` / `blastRadius` | **Cuánto arrasa la cadena.** Van atados a la mecha: si crecen, hay que dar más aviso o el vagón se vuelve una trampa sin salida |
| `explosives.cajonPolvora.enemyDamage` / `playerEdgeDamage` | El daño del BORDE. Es lo que decide si en las puntas del vagón queda alguien vivo — más barato de mover que los radios |
| `explosives.cajonPolvora.cruzaEnganche` | Cada cuánto un barril empujado salta al vagón vecino en vez de caerse al vacío |
| `explosives.cajonPolvora.tumba` | Cuánto queda en el piso el guardia que atropella. Nunca lo mata |
| `enemy.dinamiteroRecarga` | **Cuánto tarda el Dinamitero en volver a tener las dos en la mano** — y cuánto dura la ventana en la que está desarmado |
| `enemy.dinamiteroPorTanda` | Cuántas lanza de una |
| `enemy.dinamiteroSeparacion` | **A qué distancia tuya cae cada una.** Decide si quedarte quieto te cuesta 2 vidas o las 4: por debajo de `explosives.dinamita.lethalRadius` te mata |
| `enemy.dinamiteroAlcance` / `dinamiteroRangoMax` | Cuánto vuela su cartucho y hasta dónde decide tirar. **Van atados**: el alcance tiene que ser el rango más la separación, o la tanda deja de caer separada |
| `enemy.dinamiteroMargen` | Hasta dónde retrocede cuando lo tenés encima, por encima de `throwMinRange` |
| `TRAIN_TYPES.<id>.sustituciones` (`data/train.js`) | Cada cuánto ese tren cambia un vagón por otro. Hoy: **el de carga** cambia ganado por armas una de cada cuatro veces |
| `TRAIN_TYPES.<id>.peso` (`data/train.js`) | **Cada cuánto sale ese tipo de tren.** Hoy 50/50 entre pasajeros y carga; el veloz está en 0. Si se mueve, hay que mover `sustituciones` en sentido contrario o el vagón de armas cambia de frecuencia sin que nadie lo pida |
| `TRAIN_TYPES.<id>.modificadores` (`data/train.js`) | Si ese tren entra en el sorteo de **clima, estado, comportamientos y tipos de guardia**. Hoy: los dos |
| `TRAIN_TYPES.<id>.gente` (`data/train.js`) | Si ese tren sortea **paquete, civil encubierto y caja fuerte oculta**. Hoy: sólo el de pasajeros — las tres necesitan pasajeros a quienes amenazar |
| `loot.strongboxTime` | Cuánto tardás en abrir una caja fuerte |
| `alert.interval` / `alert.max` | Ritmo y tope de la gente de la locomotora |
| `raid.duration` | Los segundos del asalto entero |
| `rodante.vida` / `velocidad` | **Los barriles del tren de carga:** cuántos tiros aguantan y qué tan rápido vienen |
| `rodante.rafagaMin` / `rafagaMax` / `rafagaGap` | **Cuántos vienen por tanda y cada cuánto sale el siguiente.** Los tres números que deciden si se pueden esquivar de a uno o hay que quedarse afuera del pasillo |
| `rodante.adelanto` / `pistaMinima` | Desde dónde aparecen y cuánta pista te dejan como mínimo para reaccionar |
| `rodante.levantarse` | Cuánto tardás en levantarte si te lleva puesto uno |
| `TRAIN_TYPES.<id>.rodantesCada` (`data/train.js`) | Cada cuánto arranca una tanda. Sin ese campo, ese tipo de tren no suelta nada |
| `traqueteo.dispersionExtra` | **Cuánto más dispersan TODOS** (guardias y jugador) durante el sacudón. Se suma, no multiplica — castiga más al que apunta fino |
| `traqueteo.empujePx` | Cuánto te arrastra el tirón (acelerón o frenada) |
| `traqueteo.avisoTiempo` / `efectoTiempo` | Cuánto dura el aviso sin efecto y cuánto el sacudón de verdad |
| `TRAIN_TYPES.<id>.traqueteoCada` (`data/train.js`) | Cada cuánto se pone traicionero el piso. Sin ese campo, ese tren nunca lo hace |
| `mochila.sinCostoHasta` / `frenoMaximo` | **Cuánto te frena lo que llevás en la mochila.** Hasta la mitad llena no frena nada; de ahí sube derecho hasta −25% con la mochila llena |
| `mochila.columnas` / `filas` | El tamaño de la grilla (hoy 4×4). Es lo que decide si un cajón de 2×2 todavía entra |
| `estampida.abrirHold` / `arranque` | Lo que tardás en abrir la tranquera, y el respiro que tenés para correrte antes de que salga la manada |
| `estampida.reses` / `velocidad` / `alcance` | Cuántas salen, qué tan rápido y cuánto corren antes de perderse adelante |
| `estampida.aturdeGuardia` | Cuánto queda en el piso el guardia atropellado — 3 s, calculado para que te dé tiempo a llegar y rematarlo (el cuerpo a cuerpo, para comparar: 0,45 s) |
| `estampida.matalAturdido` | Si una SEGUNDA estampida mata al que ya está caído (las reses de una misma manada no, es un solo evento) |
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
FORAJIDO.loop           // el bucle: .stop() congela el mundo, .start() lo suelta
FORAJIDO.services.raid  // el asalto en curso: player, enemies, passengers, loot
FORAJIDO.services.train // el tren: wagons, map, exitZone, caballoEn, wagonAt(x)
FORAJIDO.services.ride  // el galope: x, aguante, reloj, plataformas, alcanceMaximo
FORAJIDO.services.camp  // el campamento: x, y, sentado, cerca, objetos, mensaje
FORAJIDO.services.town  // el pueblo: x, y, cerca, mensaje, gente, edificios
FORAJIDO.services.mapa  // el mapa: encima (la vía señalada), rutas, conTren
FORAJIDO.services.interior // el local en el que estás: id, x, y, cerca, puntos,
                           // y dialogo/opcion si te está hablando un vendedor
FORAJIDO.services.tienda   // la vidriera: id, items, item, datos, tuyo, precio

// Congelar el mundo para poder MIRAR algo con calma. Sin esto, entre dos
// llamadas a la consola el juego avanza solo y la foto no muestra lo que dejaste:
FORAJIDO.loop.stop()
FORAJIDO.services.scenes.update(1/60); FORAJIDO.services.input.endFrame()  // un cuadro
FORAJIDO.services.scenes.render(FORAJIDO.services.renderer)                // y dibujalo
FORAJIDO.loop.start()

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

## El sonido

**No hay ni un archivo de audio.** Todo se genera con osciladores y ruido
filtrado (`src/engine/audio.js`): cuesta cero y se cambia moviendo un número.
Cuando el juego funcione, cada función se reemplaza por un sample sin tocar
nada más.

Hay dos clases de sonido y se manejan distinto:

- **Efectos** — un disparo, un golpe, un trueno. Se piden por nombre
  (`audio.play('explosion')`) y se apagan solos.
- **Capas de fondo** — el traqueteo del tren, la lluvia, el viento, el fuego.
  Tienen nombre y **volumen que se mueve en vivo** (`audio.ambiente`,
  `audio.volumen`). Es lo que permite que la lluvia cambie al salir del vagón
  en vez de prenderse y apagarse de golpe.

### Y hay música: una criolla y una armónica

- La **guitarra criolla** puntea un arpegio suave que **no para**: es la base, y
  es lo que hace que esto sea música y no ruiditos sueltos. Va sobre cuatro
  acordes de La menor (Am, F, G, Am) que dan la vuelta cada catorce segundos.
- La **armónica** pasa por arriba con frases de tres a cinco notas cada diez o
  veinte segundos, **y nunca toca la misma dos veces**: se sortean.
- Las notas salen de una **escala pentatónica menor**, que además de sonar a
  desierto tiene una propiedad práctica: no tiene notas que suenen mal juntas.
  Por eso los dos instrumentos pueden tocar sueltos, sin coordinarse, y no hay
  forma de que choquen.

**Es música de FONDO, y eso manda sobre todo lo demás:** la criolla tiene ataque
blando, nada entra de golpe, el pulso es lento y ninguna frase termina en un
acento. Nada acá tiene que poder hacerte levantar la vista.

> El acompañamiento se repite y la melodía no, y es a propósito: de lo que uno
> se cansa es de una melodía repetida, nunca de un punteo suave.

**Sólo suena en el campamento y en el pueblo** — los dos lugares donde no hay
nadie apuntándote. En el asalto y en el galope no hay música a propósito: ahí
el sonido es información, y una melodía encima taparía justo lo que hay que oír.

**Y el viento respira.** Ruido filtrado a volumen constante no suena a aire:
suena a estática, a disco rayado. Lo que hace que el oído lea "viento" no es el
filtro sino que **varíe** — así que las capas de viento van moduladas por dos
osciladores lentos de períodos que no encajan (6,5 y 10,5 segundos), sobre el
volumen **y** sobre el filtro: una ráfaga real no es lo mismo más fuerte,
además se abre. Y entre ráfaga y ráfaga casi no queda nada, así que el viento
nunca es un fondo permanente.

**Cada lugar suena a lo suyo**, y el fondo dice cosas que no están escritas:

| Dónde | Qué se oye |
|---|---|
| **El campamento** | El desierto, y **la fogata sólo de noche** — porque de día está apagada, que es el reloj del juego |
| **El pueblo** | La calle. De noche, más callada |
| **El mapa** | Casi nada: es un papel que mirás en tu campamento, no un lugar |
| **El galope** | El viento, y **las zancadas** — un "tucu-TÚN" de tres pisadas y después silencio, no un pulso parejo: un cuadrúpedo no pisa a intervalos iguales. El ritmo sigue a lo que corre el caballo |
| **El asalto** | El traqueteo y el clac-clac de las juntas de la vía |

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
