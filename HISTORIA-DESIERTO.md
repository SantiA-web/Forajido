# El desierto en detalle: Cardón Rojo

*(Santi, 2026-11-22: "vamos con el desierto en detalle"; eligió la D para irse al norte y los encargos concretos.)*
El esqueleto de todo el viaje está en **HISTORIA.md**; quiénes son, en **PERSONAJES.md**. Esta página es el guion del
desierto: qué pasa, cuándo pasa, qué dice cada uno y qué puedes elegir.

🔁 **2026-11-23: reescrito con días y con lo que el jugador ve** *(Santi: "Nadie sabe cuántos asaltos va a durar la
región o el juego, deja de medirlo así… Que sea por días y por partes de día, por ejemplo: 'si el jugador lleva sin
ganar Y fama en X días, John le recuerda por qué lo hace'… poner condiciones a cosas que el jugador no ve lo
empeora")*. Y con **un objetivo a la vista**: la fama del Cuervo es el camino hacia Cole *(Santi: "no existe un
objetivo claro, el jugador no sabe hacia dónde va ni por qué"; eligió mi recomendación)*. La versión anterior, "asalto
por asalto", está en git.

- Los textos de diálogo están en la voz de cada uno (VOCES.md): Tommy le habla de usted a James; los textos del juego,
  en neutro con tuteo. **Los montos y los números de fama, recompensa y días son provisorios**: se miden en el
  simulador antes de construir.
- ⚠️ **Las mecánicas nuevas del tren se producen después** *(Santi: "dejemos lo de producirlas para después")*:
  traer algo, no matar a alguien, hablar con alguien y liberar a un preso (el preso usa el código del compañero que te
  acompaña por el tren, `src/systems/companero.js`, *Santi*). Mientras tanto, lo que pasa adentro del tren se elige con
  un cartel al volver.

## El reloj: qué mide el juego

Nada se cuenta en asaltos. Las escenas dependen de **lo que el jugador puede mirar**:

| Lo que se mide | Dónde lo ve el jugador |
|---|---|
| **Los días y la parte del día** (mañana, tarde, noche, madrugada) | El calendario |
| **Días desde que pasó algo** ("3 días después de la carta del maletín") | El libro de James: lo que pasó y cuándo |
| **La fama** del Cuervo | El libro (la barra del objetivo) y la fogata |
| **La recompensa** por tu cabeza | El cartel, los resultados |
| **El honor** | La fogata |
| **La plata** y **la deuda con J.Mc.** | El HUD, la libreta |
| **La lealtad de cada uno**, en palabras (firme, conforme, dudoso, a punto de irse) | La libreta, la ficha |
| **Lo que hiciste** (los hechos: *Abriste el maletín*) | El libro de James |

**Para que esperar no dispare la historia**: casi todas las escenas piden días **y** algo que hiciste ("3 días después
del maletín", "la noche de un golpe que salió bien"). Si te quedas sentado en la carpa, lo único que llega es J.Mc.
preguntando qué pasa (abajo, "Cuando la fama no sube").

**"Un golpe que salió bien"** = volviste con botín. Es algo que pasó y se ve en la pantalla de resultados, no una
cuenta: ninguna escena pide "el tercer golpe".

## El objetivo: que el Cuervo pese

**Lo que James quiere** (lo sabe por el prólogo): al hombre que mandó la emboscada donde murió su padre, **Reuben
Cole**. **Lo que le promete J.Mc.** en la primera carta: Cole caza a los bandidos que salen en los diarios. Si el
nombre del Cuervo pesa lo suficiente, Cole va a venir al desierto, y J.Mc. le va a decir en qué tren.

La primera carta, nueva (reemplaza a la de "te entrego al hombre que mató a tu padre"):

> *McCoy: sé quién eres. Sé quién fue tu padre, y sé quién lo emboscó: Reuben Cole, que ahora es marshal federal.
> Sé lo de tu mujer y tu chico.*
>
> *Cole caza a los que salen en los diarios. Haz que el nombre del Cuervo pese, y Cole va a venir a buscarte. Yo te
> voy a decir en qué tren.*
>
> *Mientras tanto, trabajas para mí: asaltas los trenes que te diga, y de cada uno me dejas $200 junto a tu carpa.
> La banda ya te espera. Nadie más que tú tiene que leer esto. — J.Mc.*

**Lo que ve el jugador**: en la primera página del libro de James, **la fama del Cuervo como una barra** y una línea:
*"Cole viene cuando el Cuervo pese."* Cada golpe que sale bien la llena; fallar no la mueve.

**Cole viene** cuando pasa una de dos cosas (las dos se ven):
- **La fama llega a "El Cuervo pesa"**: **300**. Es el camino del que roba bien.
- **O la recompensa llega a $900.** Es el camino del que mata o al que agarran seguido: la ley manda a su mejor hombre
  igual, pero con otra cara (y llega antes, sin haber vivido media historia).

*(Santi eligió estos números el 2026-11-23, con el simulador: `simulador/fama.js`, `simulador/resultados-fama.md`.
Jugando normal, Cole llega a las 5 semanas, en unos 12 golpes; el que roba bien, en 33 días; el que mata civiles, en
18. Con sólo la fama, 8 de cada 10 violentos pasaban la horca esperando a Cole: por eso el camino de la recompensa.)*

Lo que J.Mc. no dice: quiere muerto a Cole porque Cole es el único que podría descubrir lo que pasó en Barranca Yaco.
Usa al padre de James para que James lo haga. Lo que el jugador se pregunta desde la primera carta: **¿cómo sabe J.Mc.
quién era su padre?**

### La fama (provisorio, a medir)

Hoy la fama sólo sube con un jefe muerto, algo raro en el botín o tres golpes limpios seguidos: en 25 días puede
quedar en 0. Lo nuevo *(Santi: "Asaltos ganados y que renombren al Cuervo deberían subirla… Matar guardias y civiles
sube la recompensa, también debería subir la fama, y con asaltos conseguidos también debería subir aún más")*:

| Qué pasó | Fama |
|---|---|
| Un golpe que salió bien | +10 |
| …y fue grande ($300 o más) | +10 más |
| "El Cuervo" sale en el diario (una vez) | +30 |
| Cada guardia muerto | +3 |
| Cada civil muerto (fama mala, pero fama) | +5 |
| Un jefe muerto, algo raro en el botín, tres golpes limpios seguidos | lo de hoy (+100/+150, +40, +30) |
| Un golpe fallido (sin botín, o te agarran) | nada |

**La recompensa sube con la fama** *(Santi: "La recompensa debería subir con la fama")*: la mitad de la fama de cada
golpe se suma a la recompensa (si sales en el diario, la ley sabe quién eres). Matar con la alarma sonando la sigue
subiendo como hoy. ⚠️ La recompensa también decide la horca (1200) y la oferta de la ley (600): por eso se mide antes.

### Cuando la fama sube, y cuando no

Cartas de J.Mc., por lo que se ve en la barra *(Santi: "si conseguiste una buena fama, John debería felicitarte… Si el
jugador falló los asaltos… le mandará una carta diciéndole que los asaltos tienen que ser efectivos")*:

**Cuándo "suena" el Cuervo** *(Santi, 2026-11-23: "es muy importante que eso de subir la fama sea como vos querés
corregir… con un asalto bien hecho y con buen botín ya llegarías"; eligió 20)*: cuando la fama subió **20 o más**
desde la última vez. Un golpe grande alcanza solo (10 + 10), sin matar a nadie; uno chico necesita además 4 guardias.
Los días de abajo se cuentan desde la última vez que sonó. 🔁 Antes contaba si subía algo: un guardia muerto (+3) ya
reiniciaba la cuenta, y J.Mc. casi nunca se enteraba de que el Cuervo no sonaba. Se ve en el libro de James: *"Hace 4
días que el Cuervo no suena"*.

- **"Buen trabajo"** (la primera vez que la fama llega a **150**, la mitad del camino; jugando normal, cerca del día
  18):
  > *McCoy: hiciste un buen trabajo. En Fuerte Riley ya preguntan por el Cuervo, y Cole lee los mismos diarios que
  > todos. Falta poco. — J.Mc.*
- **"Que sean efectivos"** (pasaron **6 días** sin que el Cuervo suene):
  > *McCoy: seis días y ni una línea en los diarios. Los asaltos tienen que ser efectivos. Cole no cruza el desierto
  > por un ladrón de gallinas. Acuérdate de por qué estás ahí. — J.Mc.*

  Es un aviso. **Si pasan otros 6 días sin que suene** (12 en total): *J.Mc. desconfía*, con su carta:
  > *McCoy: doce días, y el Cuervo sigue sin sonar. Empiezo a pensar que me equivoqué contigo. Desde hoy, de cada golpe
  > me dejas $250, hasta que vuelva a leer tu nombre. — J.Mc.*

  La cuota de cada golpe sube a $250 hasta que el Cuervo vuelva a sonar.
- **El tren de los Rennick** (J.Mc. ya desconfía y pasan **10 días más** sin que suene: 22 en total). J.Mc. no puede
  mandar a Cole al campamento: Cole mataría a James, y J.Mc. necesita que sea James el que mate a Cole *(Santi: "si John
  manda a Cole al campamento se estaría incumpliendo algo clave")*. 🔁 No inventa un golpe de la nada: **los Rennick
  asaltan el de las 9 y matan a tres, y J.Mc. le paga al diario de Fuerte Riley para que diga que fue el Cuervo**. Cole
  se mueve por un dato falso *(Santi, 2026-11-23: "no es 'te lo traigo yo' sino que falsifica que los Cuervos asaltaron
  un tren, o sea, mueve a Cole por un dato falso. Podríamos hacer que ese tren en realidad lo asaltaron los Rennick y a
  John le vino como anillo al dedo")*.
  > **EL CUERVO MATA A TRES EN EL DE LAS 9.** *Los testigos hablan de un pañuelo negro con un pájaro. El marshal
  > federal Reuben Cole viaja a Cardón Rojo para cazar al Cuervo.*

  > **Frank**: —¿Tres muertos en el de las 9? Jefe… nosotros no fuimos.
  > **Santiago**: —Los Rennick. Ese tren era de ellos.

  > *McCoy: los Rennick te hicieron el trabajo. Yo sólo me ocupé de que el diario dijera tu nombre. Cole ya viene.
  > Esto te lo cobro. — J.Mc.*

  Cole viene igual en tren (lo de "Cole viene por ti" sigue como siempre), pero: *J.Mc. te inventó*, la deuda con J.Mc.
  sube $200 y la recompensa sube $200 (la ley cree que mataste a tres). Así la historia nunca se queda trabada, y
  esperar tiene precio.

## Quién te escribe al campamento

*(Santi: "no pueden llegar cartas de cualquiera al campamento, si un capataz sabe la ubicación de la banda, un marshal o
sheriff cómo no la va a saber"; eligió mi recomendación.)*

- **Sólo J.Mc. sabe dónde está el campamento**: él les dio el escondite. Sus cartas las trae su mensajero, un chico
  que nadie de la banda ve llegar.
- **Todos los demás** (el capataz, Rosa, Dagget) **dejan el recado con Rosa, en la cantina**. Llega cuando tú o uno de
  la banda bajan al pueblo. **Un recado espera 4 días** (provisorio): si en ese tiempo nadie baja, el que lo dejó se
  cansa, y el pedido se pierde (*Se perdió el recado de…*). Bajar al pueblo, ahora, importa.
- Lo que ve el jugador: en el libro de James, "Rosa tiene un recado para ti" desde que alguien de la banda lo oyó en el
  pueblo (si mandaste a otro por otra cosa, vuelve con la noticia).

## El orden en que suele pasar

Esto no es un horario: es el orden en que las cosas tienden a caer para alguien que juega normal (un golpe cada 2 o 3
días). **Cada escena pasa cuando se cumple su condición**, y un jugador rápido puede llegar a Cole sin haber visto
todo: lo que queda sin pasar se pierde, y es otra partida *(BRUJULA.md: corta y rejugable)*.

| Más o menos | Qué pasa | Cuándo pasa (la condición) |
|---|---|---|
| Día 1 | **El prólogo** y **la primera carta** | Al empezar |
| Primera semana | **"¿Por qué él manda?"** | La noche del primer golpe que sale bien |
| | **Las latas** | Una mañana, 2 días después de "¿Por qué él manda?", con Santiago y Tommy en el campamento |
| | Carta de J.Mc.: **el maletín** | 2 días después de "¿Por qué él manda?" |
| | **El capataz** (recado) | Desde el día 5, cuando alguien baja al pueblo |
| | **"El Cuervo" en el diario** | La mañana después del primer golpe de $300 o más; o 7 días después del primer golpe que salió bien |
| | **El pañuelo** (Santiago) | Al día siguiente del diario |
| Segunda semana | **El maletín** en el tren de carga | El tren que dice la carta (unos 4 días después) |
| | **La plata para casa** (Santiago) | El primer reparto de $200 o más, desde el día 7 |
| | **Tommy escribe** | Una noche en la fogata, 2 días después de las latas |
| | **El pedido de Tommy**: el veterano | 2 días después de "Tommy escribe", si Tommy está conforme o firme |
| | **El veterano o el tren de los Rennick** | Salen el mismo día: hay que elegir uno |
| | **La primera paga** de la mina | 4 días después del trato con el capataz (o un rumor en la cantina, si no hubo trato) |
| | **El pedido de Rosa**: el libro | Cuando la paga ya está en el horario y alguien baja al pueblo |
| | **El anillo** (Frank) | Una noche que Frank tomó, desde el día 8 |
| Tercera semana | Carta de J.Mc.: **el guardia del pañuelo amarillo** | 3 días después de que se cerró lo del maletín (entregado, vendido o perdido) |
| | **El aviso de Eli** | 3 días después de pisarles el tren a los Rennick |
| | **El pedido de Frank**: el ranger viejo | 3 días después del anillo, si Frank está conforme o firme |
| | **La carta "buen trabajo"** o **"que sean efectivos"** | Por la barra de fama (arriba) |
| | Carta de J.Mc.: **el preso de la barba roja** | 3 días después de que se cerró lo del guardia |
| Cuarta semana | **El pedido de Dagget**: su sobrino | Cuando la segunda paga ya está en el horario, alguien baja al pueblo y Dagget no vio el pañuelo |
| | **La segunda paga** | 10 días después de que pasó la primera |
| | **El pueblo se seca** | 3 días después de que asaltaste la segunda paga (si asaltaste las dos) |
| Al final | **"Cole viene por ti"** (el diario y la carta de J.Mc.) | La fama llega a 300, la recompensa a $900, o el tren de los Rennick (J.Mc. hace creer que fue el Cuervo) |
| | **Santiago no quiere ir al norte** | A la mañana siguiente de "Cole viene" |
| | **El Marshal en el tren** | El de pasajeros que dice la carta: 4 días después de "Cole viene" |
| | **La salida** | La noche que vuelves del tren de Cole (o la noche que ese tren pasa sin ti) |

**Lo que flota** (pasa cuando se da): **el pañuelo y Dagget**, **el cartel de Santiago que lee Frank**, **la
emboscada de los Rennick**, y **las cartas de la fama**.

Las **Diarias** corren todo el desierto y cada una tiene su contador: los civiles muertos (Tommy), la botella (Frank),
el reparto (todos).

**Cuánto dura** (medido, `simulador/resultados-fama.md`): jugando normal, unos 35 días y 12 golpes; robando bien, 33;
fallando mucho, 42; matando civiles, 18 (llega por la recompensa). El que sólo espera en la carpa no avanza: la fama no
sube sola, y J.Mc. lo aprieta hasta hacerle creer a Cole que el Cuervo mató a tres.

---

## "¿Por qué él manda?"

**Cuándo**: la noche del primer golpe que sale bien, en la fogata.

> **Frank**: —Una pregunta, jefe, sin ofender. Yo hace treinta años que ando a caballo, el mexicano tira mejor que
> los dos juntos, y el chico… bueno, el chico corre. ¿Por qué el que manda es usted?
> **Santiago**: —Es buena pregunta, McCoy.
> **Tommy** no dice nada; te mira.

- **"Porque me eligió J.Mc. Lean."** (Muestras la carta.) → *Les mostraste la carta*. Cada uno sabe que J.Mc. te
  eligió a ti (y ahora, que buscas a Cole): en el bosque, cuando J.Mc. le pida a Santiago que te entregue, sabe que te
  traiciona a ti y no a cualquiera. Tommy, favor ("confió en nosotros").
- **"Porque el que no esté de acuerdo puede irse."** → *Mandaste a la fuerza*. Santiago, favor (le gusta lo claro);
  Frank, queja chica.
- **"Porque alguien tiene que hacerlo. Mañana cocina Frank."** (Un chiste.) → *Lo tomaste en broma*. Frank, favor;
  Santiago, queja chica ("no contestó").

## Las latas, y el primer encargo de J.Mc.

**Las latas** (una mañana, 2 días después de "¿Por qué él manda?", si Santiago y Tommy están en el campamento).
Santiago puso latas sobre una piedra y le enseña a tirar a Tommy.

> **Santiago**: —No cierres el ojo. Si cierras el ojo, el otro te ve primero.
> **Tommy**: —¿Señor McCoy, quiere probar?

- **Sumarte** → *Santiago y Tommy* (el lazo crece, +1). Tommy, favor.
- **Dejarlos** → *Santiago y Tommy* (+1). Nada más.
- **"No gasten balas."** → Tommy, queja chica; el lazo no crece.

**La carta del maletín** (2 días después de "¿Por qué él manda?"):

> *McCoy: el jueves pasa el de carga de las 14:00. En el furgón de cola, en el escritorio del encargado, hay un
> maletín de cuero con lacre rojo. Tráemelo cerrado. — J.Mc.*

El maletín va **sólo en ese tren** (el mapa lo marca: "J.MC."). Si el tren pasa sin ti, lo perdiste (*J.Mc.
desconfía*).

## El maletín, "El Cuervo" y el capataz

**El maletín** (la noche que vuelves con él):
- **Entregarlo cerrado** → J.Mc. perdona la deuda. *Cumpliste con J.Mc.*
- **Abrirlo** → adentro: **horarios de trenes con el sello de la compañía del ferrocarril**, y un sobre con plata que
  dice "para los de la mina". *Abriste el maletín*: es una pista de que J.Mc. es del ferrocarril (en el bosque se junta
  con lo de Tommy). Rompiste el lacre: J.Mc. se entera, y la carta siguiente empieza con *"Te dije cerrado."* →
  *J.Mc. desconfía*. La plata del sobre, la puedes sacar o no.
- **Venderlo al perista** → $150 (provisorio). La carta siguiente: *"La próxima vez que vendas lo mío, el cartel va a
  tener tu nombre."* La recompensa por tu cabeza sube $200. *Vendiste lo de J.Mc.*

**"El Cuervo" en el diario** (la mañana después del primer golpe de $300 o más; si no llega, 7 días después del
primer golpe que salió bien). **+30 de fama.**

> **EL CUERVO ASALTA EL DE LAS 14:00.** *Testigos describen a un bandido con un pañuelo negro bordado con un pájaro.
> El sheriff Dagget, de Cardón Rojo, ofrece $100 por su captura.*

> **Frank**: —¡Jefe, salió en el diario! "El Cuervo". Suena a novela.
> **Santiago**: —Suena a horca.

→ *"El Cuervo" en los diarios* (lo lee Wes, en la pradera). Desde acá pueden pasar **el pañuelo y Dagget** y **el
cartel de Santiago** (Dagget empieza a colgar carteles).

**El pañuelo** (Santiago, al día siguiente del diario): *"Ese pañuelo te va a hacer famoso o te va a colgar."*
Guardarlo para bajar al pueblo (*Guardaste el pañuelo*) o dejártelo (*Llevas el pañuelo*).

**El capataz** (recado con Rosa, desde el día 5, cuando alguien baja al pueblo):

> *Un hombre con polvo de mina en la ropa dejó dicho: "La Viuda paga a su gente cada tanto, en un tren que nadie
> anuncia. Yo sé cuándo. Cuarenta dólares, y cuando cobres, mi parte."*

- **Pagarle $40** → la paga sale en el horario, con su día y su hora, 4 días después. *Trato con el capataz*.
- **No** → la paga llega igual como rumor de la cantina, sin saber cuál es.

## La plata para casa, y Tommy escribe

**La plata para casa** (el primer reparto de $200 o más, desde el día 7):

> **Santiago**: —McCoy. Adelántame sesenta. Es para mandar.
> (No dice a quién. No hace falta.)

- **Dárselos ($60)** → *Lo ayudaste con su familia*. Santiago, favor (lo que más pesa en su libreta).
- **"Después del reparto, como todos."** → *Le negaste lo de su familia*. No dice nada: se calla.

**Tommy escribe** (una noche en la fogata, 2 días después de las latas):

> *Tommy escribe a la luz del fuego. Cuando te ve, dobla el papel.*
> **Tommy**: —Es para mi padre, señor McCoy. Para que sepa que estoy bien.

- **Creerle** → *Viste a Tommy escribir*.
- **"¿Tu padre sabe leer de noche?"** (apretarlo) → *Viste a Tommy escribir* y Tommy queja chica. Miente mal: "Es un
  amigo. De mi padre."
(Él cree que le manda informes a la ley; se los manda a J.Mc.)

**El pedido de Tommy** (2 días después de "Tommy escribe", **si Tommy está conforme o firme**: si no confía en ti, no
te pide nada, y esa cadena no pasa):

> **Tommy**: —Señor McCoy, en el de pasajeros del martes viaja un veterano. Del Norte, como mi padre. Dicen que estuvo
> en Barranca Yaco. ¿Le podría preguntar… por el tren del oro? Yo no puedo subir. Usted sí.

- **Aceptar** → el encargo del veterano (el mapa lo marca: "TOMMY").
- **"No vamos a ese tren."** → Tommy, queja chica.

## El veterano o el tren de los Rennick

Los dos trenes salen **el mismo día**: hay que elegir uno.

- **El de pasajeros, con el veterano** (✉️ hablar con alguien): un viejo con una pierna de palo, en el segundo vagón.
  > **El veterano**: —¿Barranca Yaco? Yo era cabo en ese tren, muchacho. Dijeron que el teniente Kennedy abrió la
  > puerta. Mentira. Kennedy estaba conmigo, en el vagón de adelante. **Alguien abrió desde adentro.** Uno de los
  > nuestros, o uno que se vistió de nuestro.

  → *El veterano habló de Barranca Yaco*. Es la primera vez que James oye ese nombre. Esa noche:
  - **Contarle a Tommy todo** → Tommy, favor doble. *Tommy sabe que su padre no abrió la puerta*.
  - **"No dijo nada."** → Tommy, queja. *Le mentiste a Tommy* (en el bosque, si se entera, pesa).
  - Si **mataste civiles en ese tren**, el veterano puede ser uno: Tommy no te pregunta más.
- **El de carga, que era de los Rennick** (un rumor de la cantina: mucha plata, ninguna pista de que es de otros).
  → *Les pisaste un tren a los Rennick*. 3 días después, el aviso de Eli.

## El anillo, y el pedido de Rosa

**El anillo** (una noche que Frank tomó, desde el día 8):

> *Frank no duerme. Le da vueltas a un anillo chico entre los dedos gordos.*
> **Frank**: —Era de ella. ¿Sabe cómo me llegó, jefe? En una carta. Como un regalo. —Se ríe, y no es una risa.— Un
> amigo. Un amigo que me va a dar un nombre.

- **"¿Qué amigo?"** → *Viste el anillo de Frank*. Frank: "Uno que firma con iniciales, como el suyo."
- **Sacarle la botella** → *Viste el anillo de Frank*, y la Diaria de la botella cuenta.
- **Dejarlo** → nada.

**El pedido de Rosa** (en la cantina, cuando la paga ya está en el horario y alguien baja al pueblo):

> **Rosa**: —A mi marido lo aplastó La Viuda, en el pozo tres. Dicen que fue culpa suya, que estaba borracho. No
> tomaba. En el tren de la paga va el libro de la mina, el del pagador. Ahí está lo que pasó en el pozo tres.
> Tráemelo y no te vas a olvidar de Rosa.

- **Aceptar** → el encargo del libro (en el tren de la paga).

## La primera paga, y el libro

**La paga** (de carga, poca guardia, mucha plata). → *Asaltaste la paga*, **sólo si volviste con botín** (si fuiste y
te fue mal, no cuenta). Si hiciste trato con el capataz, al otro día espera **su parte** ($60, provisorio) con un
recado:
- **Dársela** → *Le diste su parte al capataz*.
- **No** → nada… por ahora.

**El libro** (✉️ traer algo, en el furgón de cola):
- **Dárselo a Rosa** → *Rosa te debe una*: al final, te esconde.
- **Vendérselo al capataz** → $120; él lo quema. Rosa se entera 3 días después: deja de hablarte.
- **Dárselo a Dagget** → Dagget lo usa para apretar a la mina. *Dagget te debe una*: una fianza gratis.
- **Abrirlo** → lees lo del pozo tres: no fue culpa del marido; La Viuda ahorró en vigas. Después puedes elegir igual.

## El guardia del pañuelo amarillo, y el aviso de Eli

**La carta de J.Mc.** (3 días después de que se cerró lo del maletín):

> *McCoy: el martes, en el de pasajeros de las 8:00, el guardia del vagón correo lleva un pañuelo amarillo. No lo
> toques. Dile "Barranca". Te va a dar una llave. — J.Mc.*

**El guardia** (✉️ no matar y hablar con alguien):
- **Hablar con él** ([E], "Barranca") → te da **la llave de la caja fuerte** del correo (botín mayor) y dice:
  > **El guardia**: —El jefe dice que no te saques el pañuelo. Que te queda bien.

  → *Hablaste con el hombre de J.Mc.* James no sabe por qué J.Mc. quiere que el Cuervo se vea (sí lo sabe el
  jugador: para que Cole venga).
- **Matarlo** → *Mataste al hombre de J.Mc.* La carta siguiente: *"Mataste a uno de los míos. Eso se paga."* La deuda
  con J.Mc. sube $150.
- **Ni una cosa ni la otra** → sin llave.

**El aviso de Eli** (3 días después de pisarles el tren; clavado en un poste del camino):

> *Un cuchillo atraviesa un papel: "EL CUERVO: ESA PLATA ERA NUESTRA. UNA VEZ SE PERDONA. — E. RENNICK."*

> **Santiago**: —Rennick. Conozco el nombre. No perdonan dos veces.

**James sí conoce el nombre**: les pisó un negocio de ganado hace años, y cree que ellos mataron a su hijo. **Sin
opciones**: lo que se decide es si vuelves a asaltar uno de sus trenes (un rumor nuevo, 2 días después del aviso).

**El pedido de Frank** (3 días después del anillo, **si Frank está conforme o firme**):

> **Frank**: —Jefe, en el de carga del jueves va de custodio un ranger viejo, Walt Hollister. Fuimos compañeros. Si
> lo encuentra… no lo mate. Ya está viejo para morirse de un tiro.

- **Aceptar** → el encargo del ranger viejo (el mapa lo marca: "FRANK"). Primera vez que el jugador oye que **Frank fue
  ranger**.

## El ranger viejo (y otro tren de los Rennick)

**El ranger viejo** (✉️ no matar a alguien; un guardia de barba blanca, el que más tira del vagón):
- **Lo dejas vivo** → *Respetaste a Hollister*. Frank, favor doble. Si le hablas ([E]), Hollister dice:
  > **Hollister**: —¿Monroe está contigo? Dile que el caso de su mujer lo cerraron de arriba. No fuimos nosotros.

  Frank, esa noche, no hace chistes. (🌱 para el bosque: alguien con poder cerró el caso.)
- **Lo matas** → *Mataste a Hollister*. Frank, queja grave, y la botella gana una vuelta.

**Otro tren de los Rennick** (el rumor que llega 2 días después del aviso de Eli). Si lo asaltas → *Les pisaste dos
trenes*: **esa misma noche emboscan el campamento** (ver abajo, "La emboscada").

## El preso de la barba roja, y el sobrino de Dagget

**La carta de J.Mc.** (3 días después de que se cerró lo del guardia):

> *McCoy: el viernes, en el de carga de las 22:00, van dos presos para la horca de Fuerte Riley. Saca al de la barba
> roja. No preguntes. — J.Mc.*

**Los presos** (✉️ liberar a alguien; en un vagón cerrado, encadenados, con un guardia):

> **El de la barba roja**: —¿Te manda el jefe? Ya era hora.
> **El otro**, un muchacho flaco: —Señor, a mí también. Me robé un caballo, nada más. Me van a colgar por un caballo.

- **Sacar al de la barba roja** → *Liberaste a Barba Roja*. Antes de irse: "Dile al jefe que estamos a mano." **Lo que
  nadie sabe**: es uno de los que entraron a la casa de James en 1882. En la montaña está entre los hombres de J.Mc.
- **Sacar a los dos** → lo de arriba, y *Liberaste al ladrón de caballos* (en la etapa 6 puede volver como contratado,
  y es leal).
- **Sacar sólo al muchacho** → *Le fallaste a J.Mc.* y *Liberaste al ladrón de caballos*. Barba Roja cuelga: en la
  pradera lo ves en un cartel de ahorcado (*Viste colgado a Barba Roja*).
- **Ninguno** → *Le fallaste a J.Mc.* Barba Roja cuelga igual.

**El pedido de Dagget** (recado con Rosa, cuando la segunda paga ya está en el horario, alguien baja al pueblo y
Dagget no vio el pañuelo):

> **Dagget**: —Mi sobrino Lyle es guardia en el tren de la paga. El muchacho no sirve para esto, pero es mi sangre.
> Si vuelve vivo, te olvido una fianza. Si no, te olvido a ti… colgado.

- **Aceptar** → el encargo del sobrino (en el tren de la segunda paga).

## La segunda paga, el sobrino y el pueblo que se seca

**La paga** (10 días después de que pasó la primera) → *Asaltaste la paga dos veces* (sólo si volviste con botín).
Si **no** le diste su parte al capataz ninguna de las dos veces, **te vende**: cuando llegue Cole, la ley ya va a estar
adentro de su tren.

**El sobrino** (✉️ no matar; el guardia joven al que le tiemblan las manos):
- **Vuelve vivo** → *Dagget te debe una* (una fianza gratis).
- **Lo matas** → *Mataste al sobrino de Dagget*: Dagget deja de venderse y **te persigue él mismo**, como con el
  pañuelo.

**El pueblo se seca** (3 días después de asaltar la segunda paga, si asaltaste las dos): La Viuda cierra pozos, el
almacén sube los precios, el perista se va del pueblo. Rosa: "Esto se muere, y tú ayudaste." Es lo que el jugador ve:
el desierto ya no da.

## "Cole viene por ti"

**Cuándo**: la fama llega a 300, la recompensa a $900, o J.Mc. le hace creer que el Cuervo mató a tres (el tren de los
Rennick). A la mañana siguiente:

> *El diario: "El marshal federal **Reuben Cole** llega a Cardón Rojo en el de pasajeros del lunes para cazar al
> Cuervo. Cole es conocido por colgar rápido."*

> **Frank** (bajito): —Cole. Lo conozco de nombre, jefe. En la guerra era capitán. No pierde a nadie que persigue.

Y la carta de J.Mc. *(Santi, 2026-11-22: "que John sea un poco más directo para que mate al Marshal")*:

> *McCoy: te dije que vendría. El lunes, en el de pasajeros, viaja Reuben Cole. Es el hombre que emboscó a tu padre.
> Lo vas a tener a tres pasos. Mátalo: te lo debes a ti, y a él. Después, la banda se va al norte: en Vacas Gordas el
> ganado viaja con la paga de las estancias, y nadie sabe lo que es un asalto. — J.Mc.*

(J.Mc. tira hacia el norte porque allá, en la montaña, tiene al padre de James. Nadie lo sabe.)

**Lo pendiente**: entre esta carta y el tren de Cole quedan unos 4 días para cerrar lo que quedó abierto (encargos sin
hacer, la parte del capataz). Lo que no se cierra, se pierde.

## Santiago no quiere ir al norte

**Cuándo**: a la mañana siguiente de "Cole viene".

> **Santiago**: —McCoy. Al norte no. Mi gente está al sur. Del otro lado. Cada día al norte es un día más para volver.

- **"Es la orden. Y la plata está allá."** (convencerlo) → *Santiago fue al norte por la plata*. Queja.
- **Adelantarle $80 para mandar a su familia** → *Lo ayudaste antes de irse*. Favor (doble si ya lo ayudaste con la
  plata para casa).
- **"Te prometo que volvemos."** → *Le prometiste volver al sur*. Favor ahora; es **tu palabra**: si al final no
  vuelven, queja doble, y pesa en su final.

## El Marshal en el tren, y la salida

**El tren de Cole** (pasajeros; el mapa lo marca: "COLE"). Si el capataz te vendió, **la ley ya está adentro**: más
guardias. En el vagón de primera, un hombre de 50 años, con un parche en un ojo y la estrella en el chaleco. Cuando te
ve, no saca el arma: mira el pañuelo.

> **Cole**: —¿De dónde sacaste eso, muchacho?

- **Matarlo** → *Mataste al Marshal*. Se pierde el único aliado posible contra J.Mc.; la ley sigue con otro marshal
  sin historia, y Kate llega antes a la pradera. J.Mc., en la próxima carta: *"Bien."*
- **Dejarlo vivo** → *Le perdonaste la vida al Marshal*. J.Mc., en la próxima carta: *"Te lo puse a tres pasos."*
  *J.Mc. desconfía*.
- **Dejarlo vivo y contestarle: "Era de mi padre."** → *Cole vio el pañuelo*: Cole se queda con eso, y empieza a atar
  cabos antes.

**Si el tren de Cole pasa sin ti**: Cole llega a Cardón Rojo y pregunta. *No fuiste a buscar a Cole*: J.Mc. desconfía,
y la salida es con la ley atrás.

**La salida** (la noche que vuelves del tren de Cole, o la noche que ese tren pasa sin ti; Cole ya sabe dónde está el
campamento):
- **Si Rosa te debe una** → te esconde una noche en el sótano de la cantina, y salen al norte sin que nadie los vea.
- **Si no** → salen con la ley atrás: **la primera huida de la pradera arranca con jinetes**.
- **Si Dagget te persigue** (el pañuelo o el sobrino) → él solo, con la escopeta, en el camino.
- **Santiago**, mirando al sur mientras cargan los caballos. Lo que le dijiste está en su cara.

---

## Lo que flota

**El pañuelo y Dagget** (desde que "El Cuervo" salió en el diario): si James baja al pueblo con el pañuelo puesto,
Dagget lo ve de cerca:

> *Dagget se queda mirando el pañuelo. Se le va el color de la cara.*
> **Dagget**: —Ese pájaro… Los Cuervos quemaron mi pueblo. Yo tenía nueve años.

→ *Dagget vio el pañuelo*: deja de venderse y **te persigue él mismo**: en la huida del golpe siguiente hay un jinete
más, que no se compra. **A menos que** te hayas guardado el pañuelo para bajar.

**El cartel de Santiago** (la primera vez que Frank baja al pueblo después de que "El Cuervo" salió en el diario:
Dagget empieza a colgar carteles): *"SE BUSCA: SANTIAGO JIMÉNEZ, por el asesinato del ranger Cal Hollister."* (El
ranger muerto es **el hermano de Walt Hollister**: si respetaste a Walt, la escena pesa más.)

> *Frank vuelve del pueblo sin la botella. No hace chistes. Esa noche no se sienta cerca del fuego.*

→ *Frank sabe lo del ranger*. Esa noche, Frank y Santiago, frente a frente:
- **Si estaban enemigos** en la fogata → pelean de verdad. **A menos que** te metas: le das la razón a uno (el otro,
  queja doble), o los separas (queja chica a cada uno).
- **Si estaban con roces o bien** → Frank no dice nada. Se lo guarda.

**La emboscada de los Rennick** (la noche que vuelves del segundo tren de los Rennick): disparos desde las piedras.

> **Eli Rennick** (de lejos): —¡Cuervo! ¡Te dije una vez!

Por ahora se resuelve con un cartel (⚠️ la pelea en el campamento es mecánica nueva). Puede quedar alguien herido. Y si
el Rennick más chico cae vivo frente a ti:
- **Perdonarle la vida a Abel** → *Le perdonaste la vida a un Rennick*: en la pradera, Clay te busca.
- **Matarlo** → *Murió Abel*: no hay paz posible, nunca.

**Las cartas de la fama** (arriba, "Cuando la fama sube, y cuando no").

**Las ofertas a la banda** 🔁 *(reemplazan a "una oferta cada 4 golpes", que Santi no quería)*: a uno de la banda lo
tientan otras bandas **cuando la fama del Cuervo no sube**: la misma condición de la carta "que sean efectivos" (6 días
sin que suba), al que esté dudoso o menos. Con fama alta, nadie se quiere ir de la banda del Cuervo. Y el aviso dice
claro qué hacer: *"Frank pasó la noche hablando con unos jinetes que no son de aquí. Habla con él antes de salir al
próximo golpe, o no va a estar."*

✅ Hecho (2026-11-23, `ofertasSinFama` en systems/tentacion.js; números en data/historia.js, `ofertas`): a los **6 y
a los 12 días** sin que el Cuervo suene (la misma cuenta de J.Mc.: vuelve a empezar cuando suena), una oferta al que
**menos te quiere** de los dudosos o peor (nunca al Honorable ni al que ya tiene la señal): +1 de tentación, y si le
alcanza, sale su señal con el aviso de siempre. Si ese día nadie duda, esa oferta no pasa. En el desierto ya no hay
"una oferta cada 4 golpes". El libro de James lo avisa antes: *"Frank duda. Si el Cuervo no suena en 6 días, otra
banda lo va a tentar."*

---

## Los hechos que deja el desierto

Lo que el juego anota y las regiones siguientes leen:

| Hecho | Lo lee |
|---|---|
| *Les mostraste la carta* / *Mandaste a la fuerza* / *Lo tomaste en broma* | Bosque (el pedido de J.Mc. a Santiago) |
| *Santiago y Tommy* (el lazo) | Bosque (Tommy pregunta) |
| *Lo ayudaste con su familia* / *Le negaste lo de su familia* / *Lo ayudaste antes de irse* / *Le prometiste volver al sur* | Pradera (la carta de su familia), final de Santiago |
| *Abriste el maletín* / *J.Mc. desconfía* / *Vendiste lo de J.Mc.* | Bosque (la pista del ferrocarril) |
| *"El Cuervo" en los diarios* | Pradera (Wes) |
| *Viste a Tommy escribir* | Bosque (J.Mc. no era la ley) |
| *El veterano habló de Barranca Yaco* / *Tommy sabe que su padre no abrió la puerta* / *Le mentiste a Tommy* | Montaña (Brittle), bosque |
| *Les pisaste un tren a los Rennick* / *dos trenes* / *Le perdonaste la vida a un Rennick* / *Murió Abel* | Pradera (Clay), montaña |
| *Viste el anillo de Frank* | Bosque (el pistolero) |
| *Respetaste a Hollister* / *Mataste a Hollister* / *Frank sabe lo del ranger* | Bosque (el caso cerrado de arriba), la fogata |
| *Rosa te debe una* / *Dagget te debe una* / *Dagget vio el pañuelo* / *Mataste al sobrino de Dagget* | La salida |
| *Hablaste con el hombre de J.Mc.* / *Mataste al hombre de J.Mc.* | Bosque |
| *Liberaste a Barba Roja* / *Viste colgado a Barba Roja* / *Liberaste al ladrón de caballos* | Montaña (la mina), etapa 6 (contratado) |
| *Asaltaste la paga dos veces* / *Le diste su parte al capataz* | La salida (la ley adentro) |
| *Mataste al Marshal* / *Le perdonaste la vida al Marshal* / *Cole vio el pañuelo* / *No fuiste a buscar a Cole* | Pradera (Kate, Cole), bosque, montaña |
| La fama y la recompensa con que sales del desierto | Pradera (cómo te reciben en Vacas Gordas) |
