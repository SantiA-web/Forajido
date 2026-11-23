# El desierto en detalle: Cardón Rojo

*(Santi, 2026-11-22: "vamos con el desierto en detalle"; eligió la D para irse al norte y los encargos concretos.)*
El esqueleto de todo el viaje está en **HISTORIA.md**; quiénes son, en **PERSONAJES.md**. Esta página es el guion del
desierto: qué pasa en cada asalto, qué dice cada uno y qué puedes elegir.

- **14 asaltos**, unos **35 días** de juego y unas **2 horas y media** de partida (cuenta mía, sin medir).
- Los textos de diálogo están en la voz de cada uno (VOCES.md): Tommy le habla de usted a James; los textos del juego,
  en neutro con tuteo. **Los montos en dólares son provisorios**: se miden en el simulador antes de construir.
- ⚠️ **Las mecánicas nuevas del tren se producen después** *(Santi: "dejemos lo de producirlas para después")*:
  traer algo, no matar a alguien, hablar con alguien y liberar a un preso (el preso usa el código del compañero que te
  acompaña por el tren, `src/systems/companero.js`, *Santi*). Mientras tanto, lo que pasa adentro del tren se puede
  probar con carteles.

## Antes del asalto 1: la historia de James

*(Santi, 2026-11-22: "el jugador juega con James, por lo que tiene que conocer la historia de él desde el principio,
porque es su historia. Se podría hacer con algo estilo prólogo, backstory o a través de cinemática y narración".)*
⚠️ **La forma está por decidir** (ver abajo); lo que cuenta, no.

**Lo que el jugador sabe desde el principio** (lo que James sabe):
1. **1865.** James tiene 13 años. Su padre se fue a la guerra con una guerrilla del Sur. Un día llega la noticia: lo
   mataron en una emboscada, y **el que la mandaba era un capitán del Norte, Reuben Cole**. La madre no llora delante
   de los chicos.
2. **1877.** La madre y el hermano se van a México. James se queda. En un baúl que ella dejó encuentra **el pañuelo de
   su padre**, bordado con un pájaro negro, con la punta quemada. Se lo queda.
3. **Los años de la plata sucia.** Roba ganado, cambia marcas, lo cruza por la frontera. Le pisa un negocio grande a
   **los hermanos Rennick**.
4. **1878 a 1882.** Se casa. Un hijo. Una noche entran a su casa unos hombres. **Matan al chico.** James está seguro de
   que fueron los Rennick, por lo del ganado: la culpa es suya.
5. **1884.** Su mujer no aguanta. **El entierro.** Esa misma tarde, un chico le trae **una carta firmada "J.Mc."**: la
   primera carta del juego.

**Lo que el jugador NO sabe** (lo va descubriendo, igual que James): que su padre está vivo; quién es J.Mc.; qué pasó
en Barranca Yaco; que los Rennick no mataron a su hijo.

**Las formas posibles** (Santi elige):
- **A. Cuadros con narración** (recomendada): 5 cuadros dibujados en pixel art, uno por momento de arriba, con el texto
  abajo, leído por James en primera persona ("Tenía trece años cuando me dijeron que a mi padre lo había matado un
  capitán del Norte…"). Se pasa con una tecla; se puede saltar. Es lo que mejor sale con lo que ya tenemos (el dibujo
  quieto), y es lo que hacen muchos juegos de pixel art.
- **B. Jugable**: el entierro como primera escena que se camina (el cementerio, la gente, el chico con la carta), y lo
  anterior contado en la fogata de a poco. Más fuerte, pero hay que dibujar un lugar nuevo, y lo viejo se entera tarde.
- **C. Sólo texto**: una página escrita, como el principio de una novela. Lo más rápido, lo más pobre.

## Los encargos

*(Santi: "John debería hacer pedidos concretos a la banda (cómo hicimos con el maletín antes)… también podría pedirle
que libere a alguien en el tren, o que hable con un guardia… o gente del pueblo… o algún miembro de la banda… también
los contratados".)* Un encargo es una cadena que pasa por adentro del tren:
1. **Quién lo pide**: J.Mc. por carta, alguien del pueblo, uno de la banda o (desde la etapa 6) un contratado.
2. **Qué, en qué tren y para cuándo.** Lo aceptas o no.
3. **En el tren**: traer algo, no matar a alguien, hablar con alguien, liberar a alguien o dejar algo.
4. **Con lo que traes**: entregarlo, **abrirlo y ver qué era** (rompe el lacre: el que lo pidió se entera), venderlo
   al perista o dárselo a otro que lo quiere.

Los contratados llegan con la cantina (etapa 6): cada uno con un pedido suyo ("en el vagón de presos va mi hermano").
Si se lo cumples, es leal de verdad y entra en la historia; si no, cobra y nada más.

## Los 14 asaltos

| Asalto | En el tren | En el campamento y el pueblo |
|---|---|---|
| 1 | El primero, suelto | De noche: **"¿Por qué él manda?"** |
| 2 | Suelto | **Las latas** (Santiago y Tommy). Carta de J.Mc.: **el maletín** |
| 3 | ✉️ **El maletín** (de carga) | **"El Cuervo" en el diario.** El capataz ofrece la paga |
| 4 | Suelto | **La plata para casa** (Santiago). Tommy escribe de noche. Tommy pide: **el veterano** |
| 5 | Elegir: ✉️ **el veterano** (pasajeros) o **el tren de los Rennick** (carga) | |
| 6 | Suelto | **El anillo** (Frank). Rosa pide: **el libro de la mina** |
| 7 | **La primera paga** de la mina; ✉️ **el libro** | Carta de J.Mc.: **el guardia del pañuelo amarillo** |
| 8 | ✉️ **El guardia** (pasajeros) | **El aviso de Eli** (si les pisaste el tren). Frank pide: **el ranger viejo** |
| 9 | ✉️ **El ranger viejo** (carga). Otro tren de los Rennick, si hay | Carta de J.Mc.: **el preso de la barba roja** |
| 10 | ✉️ **El preso** (carga) | Dagget pide: **su sobrino** |
| 11 | **La segunda paga**; ✉️ **el sobrino de Dagget** | De noche: **la carta "al norte"** |
| 12 | Suelto | **Santiago no quiere ir al norte.** El pueblo se seca |
| 13 | Suelto | Lo que quedó pendiente; **"Cole viene por ti"** |
| 14 | **El Marshal en el tren** | **La salida**: Rosa, el capataz, la huida |

Lo que flota (pasa cuando se da, no en un asalto fijo): **el pañuelo y Dagget** (desde el 3), **el cartel de Santiago
que lee Frank** (desde el 6), **la emboscada de los Rennick** (si les pisaste dos trenes).

Las **Diarias** corren todo el desierto y cada una tiene su contador: los civiles muertos (Tommy), la botella (Frank),
el reparto (todos).

---

## Asalto 1: "¿Por qué él manda?"

**Cuándo**: la noche del primer asalto con botín, en la fogata.

> **Frank**: —Una pregunta, jefe, sin ofender. Yo hace treinta años que ando a caballo, el mexicano tira mejor que
> los dos juntos, y el chico… bueno, el chico corre. ¿Por qué el que manda es usted?
> **Santiago**: —Es buena pregunta, McCoy.
> **Tommy** no dice nada; te mira.

- **"Porque me eligió J.Mc. Lean."** (Muestras la carta.) → *Les mostraste la carta*. Cada uno sabe que J.Mc. te
  eligió a ti: en el bosque, cuando J.Mc. le pida a Santiago que te entregue, sabe que te traiciona a ti y no a
  cualquiera. Tommy, favor ("confió en nosotros").
- **"Porque el que no esté de acuerdo puede irse."** → *Mandaste a la fuerza*. Santiago, favor (le gusta lo claro);
  Frank, queja chica.
- **"Porque alguien tiene que hacerlo. Mañana cocina Frank."** (Un chiste.) → *Lo tomaste en broma*. Frank, favor;
  Santiago, queja chica ("no contestó").

*(Esto reemplaza a "mostrar o guardar la primera carta" de hoy, `bandaSabeLaPromesa`: mostrarla ahora es una de las
tres opciones.)*

## Asalto 2: las latas, y el primer encargo de J.Mc.

**Las latas** (a la mañana, en el campamento). Santiago puso latas sobre una piedra y le enseña a tirar a Tommy.

> **Santiago**: —No cierres el ojo. Si cierras el ojo, el otro te ve primero.
> **Tommy**: —¿Señor McCoy, quiere probar?

- **Sumarte** → *Santiago y Tommy* (el lazo crece, +1). Tommy, favor.
- **Dejarlos** → *Santiago y Tommy* (+1). Nada más.
- **"No gasten balas."** → Tommy, queja chica; el lazo no crece.

**La carta de J.Mc.** (llega esa noche):

> *McCoy: el jueves pasa el de carga de las 14:00. En el furgón de cola, en el escritorio del encargado, hay un
> maletín de cuero con lacre rojo. Tráemelo cerrado. Paso por el campamento la noche del sábado. — J.Mc.*

Es el maletín de hoy, en el tren de carga del asalto 3. Lo que haces con él, abajo.

## Asalto 3: el maletín, "El Cuervo" y el capataz

**El maletín** (de vuelta en el campamento, si lo trajiste):
- **Entregarlo cerrado** la noche del sábado → J.Mc. paga la deuda (como hoy). *Cumpliste con J.Mc.*
- **Abrirlo** → adentro: **horarios de trenes con el sello de la compañía del ferrocarril**, y un sobre con plata que
  dice "para los de la mina". *Abriste el maletín*: es una pista de que J.Mc. es del ferrocarril (en el bosque se junta
  con lo de Tommy). Rompiste el lacre: J.Mc. se entera, y la carta siguiente empieza con *"Te dije cerrado."* →
  *J.Mc. desconfía*. La plata del sobre, la puedes sacar o no.
- **Venderlo al perista** → $150 (provisorio). La carta siguiente: *"La próxima vez que vendas lo mío, el cartel va a
  tener tu nombre."* La recompensa por tu cabeza sube $200. *Vendiste lo de J.Mc.*
- **Guardarlo** (no ir la noche del sábado) → como "no cumplir" hoy.

**"El Cuervo" en el diario** (la mañana siguiente a un asalto con mucho botín; si no, en el próximo que lo tenga):

> **EL CUERVO ASALTA EL DE LAS 14:00.** *Testigos describen a un bandido con un pañuelo negro bordado con un pájaro.
> El sheriff Dagget, de Cardón Rojo, ofrece $100 por su captura.*

> **Frank**: —¡Jefe, salió en el diario! "El Cuervo". Suena a novela.
> **Santiago**: —Suena a horca.

→ *"El Cuervo" en los diarios* (lo lee Wes, en la pradera). Desde acá, **el pañuelo y Dagget** puede pasar.

**El capataz** (en el pueblo, al que baja a la cantina):

> *Un hombre con polvo de mina en la ropa se sienta al lado. "La Viuda paga a su gente cada tanto, en un tren que
> nadie anuncia. Yo sé cuándo. Cuarenta dólares, y cuando cobres, mi parte."*

- **Pagarle $40** → la paga sale en el horario del asalto 7 (y la del 11, cuando llegue). *Trato con el capataz*.
- **No** → la paga del 7 llega como rumor de la cantina, sin saber cuál es.

## Asalto 4: la plata para casa, y Tommy escribe

**La plata para casa** (después de un golpe con botín, en el reparto):

> **Santiago**: —McCoy. Adelántame sesenta. Es para mandar.
> (No dice a quién. No hace falta.)

- **Dárselos ($60)** → *Lo ayudaste con su familia*. Santiago, favor (lo que más pesa en su libreta).
- **"Después del reparto, como todos."** → *Le negaste lo de su familia*. No dice nada: se calla. (Nada en la
  libreta; lo anota la historia.)

**Tommy escribe** (de noche, si James se acerca a la fogata):

> *Tommy escribe a la luz del fuego. Cuando te ve, dobla el papel.*
> **Tommy**: —Es para mi padre, señor McCoy. Para que sepa que estoy bien.

- **Creerle** → *Viste a Tommy escribir*.
- **"¿Tu padre sabe leer de noche?"** (apretarlo) → *Viste a Tommy escribir* y Tommy queja chica. Miente mal: "Es un
  amigo. De mi padre."
(Él cree que le manda informes a la ley; se los manda a J.Mc.)

**El pedido de Tommy**:

> **Tommy**: —Señor McCoy, en el de pasajeros del martes viaja un veterano. Del Norte, como mi padre. Dicen que estuvo
> en Barranca Yaco. ¿Le podría preguntar… por el tren del oro? Yo no puedo subir. Usted sí.

- **Aceptar** → el encargo del veterano (asalto 5).
- **"No vamos a ese tren."** → Tommy, queja chica.

## Asalto 5: el veterano o el tren de los Rennick

Los dos trenes salen el mismo día: **hay que elegir uno**.

- **El de pasajeros, con el veterano** (✉️ hablar con alguien): un viejo con una pierna de palo, en el segundo vagón.
  Te acercas, [E]:
  > **El veterano**: —¿Barranca Yaco? Yo era cabo en ese tren, muchacho. Dijeron que el teniente Kennedy abrió la
  > puerta. Mentira. Kennedy estaba conmigo, en el vagón de adelante. **Alguien abrió desde adentro.** Uno de los
  > nuestros, o uno que se vistió de nuestro.

  → *El veterano habló de Barranca Yaco*. Es la primera vez que James oye ese nombre. Esa noche:
  - **Contarle a Tommy todo** → Tommy, favor doble. *Tommy sabe que su padre no abrió la puerta*.
  - **"No dijo nada."** → Tommy, queja. *Le mentiste a Tommy* (en el bosque, si se entera, pesa).
  - Si **mataste civiles en ese tren**, el veterano puede ser uno: Tommy no te pregunta más.
- **El de carga, que era de los Rennick** (un rumor de la cantina: mucha plata, ninguna pista de que es de otros).
  → *Les pisaste un tren a los Rennick*. En 3 golpes, el aviso de Eli.

## Asalto 6: el anillo, y el pedido de Rosa

**El anillo** (de noche, si Frank tomó: la Diaria de la botella):

> *Frank no duerme. Le da vueltas a un anillo chico entre los dedos gordos.*
> **Frank**: —Era de ella. ¿Sabe cómo me llegó, jefe? En una carta. Como un regalo. —Se ríe, y no es una risa.— Un
> amigo. Un amigo que me va a dar un nombre.

- **"¿Qué amigo?"** → *Viste el anillo de Frank*. Frank: "Uno que firma con iniciales, como el suyo." (Frank no sabe
  que es el mismo J.Mc.; tú tampoco, todavía.)
- **Sacarle la botella** → *Viste el anillo de Frank*, y la Diaria de la botella cuenta (lo enoja o lo cuida, según
  cuántas veces).
- **Dejarlo** → nada.

**El pedido de Rosa** (en la cantina):

> **Rosa**: —A mi marido lo aplastó La Viuda, en el pozo tres. Dicen que fue culpa suya, que estaba borracho. No
> tomaba. En el tren de la paga va el libro de la mina, el del pagador. Ahí está lo que pasó en el pozo tres.
> Tráemelo y no te vas a olvidar de Rosa.

- **Aceptar** → el encargo del libro (asalto 7).

## Asalto 7: la primera paga, y el libro

**La paga** (de carga, poca guardia, mucha plata). Si hiciste trato con el capataz, después espera **su parte**
($60, provisorio) en el pueblo:
- **Dársela** → *Le diste su parte al capataz*.
- **No** → nada… por ahora.
→ *Asaltaste la paga* (una vez).

**El libro** (✉️ traer algo, en el furgón de cola):
- **Dárselo a Rosa** → *Rosa te debe una*: al final, te esconde.
- **Vendérselo al capataz** → $120; él lo quema. Rosa se entera en 2 golpes: deja de hablarte.
- **Dárselo a Dagget** → Dagget lo usa para apretar a la mina (le suben el sueldo). *Dagget te debe una*: una fianza
  gratis.
- **Abrirlo** → lees lo del pozo tres: no fue culpa del marido; La Viuda ahorró en vigas. Después puedes elegir igual.

**La carta de J.Mc.**:

> *McCoy: el martes, en el de pasajeros de las 8:00, el guardia del vagón correo lleva un pañuelo amarillo. No lo
> toques. Dile "Barranca". Te va a dar una llave. — J.Mc.*

## Asalto 8: el guardia del pañuelo amarillo, y el aviso de Eli

**El guardia** (✉️ no matar y hablar con alguien):
- **Hablar con él** ([E], "Barranca") → te da **la llave de la caja fuerte** del correo (botín mayor) y dice:
  > **El guardia**: —El jefe dice que no te saques el pañuelo. Que te queda bien.

  → *Hablaste con el hombre de J.Mc.* James no sabe por qué J.Mc. quiere que el Cuervo se vea.
- **Matarlo** → *Mataste al hombre de J.Mc.* La carta siguiente: *"Mataste a uno de los míos. Eso se paga."* La deuda
  con J.Mc. sube $150.
- **Ni una cosa ni la otra** → sin llave.

**El aviso de Eli** (si les pisaste el tren en el asalto 5; aparece clavado en un poste del camino):

> *Un cuchillo atraviesa un papel: "EL CUERVO: ESA PLATA ERA NUESTRA. UNA VEZ SE PERDONA. — E. RENNICK."*

> **Santiago**: —Rennick. Conozco el nombre. No perdonan dos veces.

**James sí conoce el nombre**: les pisó un negocio de ganado hace años, y cree que ellos mataron a su hijo. **Sin
opciones**: lo que se decide es si vuelves a asaltar uno de sus trenes.

**El pedido de Frank**:

> **Frank**: —Jefe, en el de carga del jueves va de custodio un ranger viejo, Walt Hollister. Fuimos compañeros. Si
> lo encuentra… no lo mate. Ya está viejo para morirse de un tiro.

- **Aceptar** → el encargo del ranger viejo (asalto 9). Primera vez que el jugador oye que **Frank fue ranger**.

## Asalto 9: el ranger viejo (y otro tren de los Rennick)

**El ranger viejo** (✉️ no matar a alguien; un guardia de barba blanca, el que más tira del vagón):
- **Lo dejas vivo** → *Respetaste a Hollister*. Frank, favor doble. Si le hablas ([E]), Hollister dice:
  > **Hollister**: —¿Monroe está contigo? Dile que el caso de su mujer lo cerraron de arriba. No fuimos nosotros.

  Frank, esa noche, no hace chistes. (🌱 para el bosque: alguien con poder cerró el caso.)
- **Lo matas** → *Mataste a Hollister*. Frank, queja grave, y la botella gana una vuelta.

**Otro tren de los Rennick** (sólo si ya les pisaste uno): un rumor de mucha plata. Si lo asaltas → *Les pisaste dos
trenes*: **esa misma noche emboscan el campamento** (ver abajo, "La emboscada").

**La carta de J.Mc.**:

> *McCoy: el viernes, en el de carga de las 22:00, van dos presos para la horca de Fuerte Riley. Saca al de la barba
> roja. No preguntes. — J.Mc.*

## Asalto 10: el preso de la barba roja, y el sobrino de Dagget

**Los presos** (✉️ liberar a alguien; en un vagón cerrado, encadenados, con un guardia):

> **El de la barba roja**: —¿Te manda el jefe? Ya era hora.
> **El otro**, un muchacho flaco: —Señor, a mí también. Me robé un caballo, nada más. Me van a colgar por un caballo.

- **Sacar al de la barba roja** → *Liberaste a Barba Roja*. Te sigue hasta que saltan. No dice su nombre. Antes de
  irse: "Dile al jefe que estamos a mano." **Lo que nadie sabe**: es uno de los que entraron a la casa de James en
  1882. En la montaña está entre los hombres de J.Mc. en la mina, y James lo reconoce (o lo reconoce antes, si Wes se
  lo dice).
- **Sacar a los dos** → lo de arriba, y *Liberaste al ladrón de caballos* (en la etapa 6 puede volver como contratado,
  y es leal: le salvaste la vida). Seguirte dos es más difícil.
- **Sacar sólo al muchacho** → *Le fallaste a J.Mc.* y *Liberaste al ladrón de caballos*. Barba Roja cuelga: en la
  pradera lo ves en un cartel de ahorcado, y James lo reconoce (*Viste colgado a Barba Roja*). J.Mc., furioso.
- **Ninguno** → *Le fallaste a J.Mc.* Barba Roja cuelga igual.

**El pedido de Dagget** (lo cruzas en el pueblo; si todavía se vende):

> **Dagget**: —Mi sobrino Lyle es guardia en el tren de la paga. El muchacho no sirve para esto, pero es mi sangre.
> Si vuelve vivo, te olvido una fianza. Si no, te olvido a ti… colgado.

- **Aceptar** → el encargo del sobrino (asalto 11).

## Asalto 11: la segunda paga, el sobrino y la carta "al norte"

**La paga** → *Asaltaste la paga dos veces*. Si **no** le diste su parte al capataz las dos veces, **en 3 golpes te
vende a Dagget** (o sea, en el 14, el tren del Marshal). La mina, sin plata dos veces, empieza a cerrar pozos.

**El sobrino** (✉️ no matar; el guardia joven al que le tiemblan las manos):
- **Vuelve vivo** → *Dagget te debe una* (una fianza gratis).
- **Lo matas** → *Mataste al sobrino de Dagget*: Dagget deja de venderse y **te persigue él mismo**, como con el
  pañuelo.

**La carta "al norte"** (esa noche):

> *McCoy: el desierto ya dio lo que tenía. En Vacas Gordas el ganado viaja con la paga de las estancias, y nadie allá
> sabe lo que es un asalto. Quiero a la banda en la pradera antes de que termine el mes. — J.Mc.*

(J.Mc. tira hacia el norte porque allá, en la montaña, tiene al padre de James. Nadie lo sabe.)

## Asalto 12: Santiago no quiere ir al norte, y el pueblo se seca

**Santiago** (a la mañana):

> **Santiago**: —McCoy. Al norte no. Mi gente está al sur. Del otro lado. Cada día al norte es un día más para volver.

- **"Es la orden. Y la plata está allá."** (convencerlo) → *Santiago fue al norte por la plata*. Queja.
- **Adelantarle $80 para mandar a su familia** → *Lo ayudaste antes de irse*. Favor. (Si ya lo ayudaste en el 4,
  vale doble: en la pradera, la carta de su familia lo encuentra más leal.)
- **"Te prometo que volvemos."** → *Le prometiste volver al sur*. Favor ahora; es **tu palabra**: si al final no
  vuelven, queja doble, y pesa en su final.

**El pueblo se seca** (si asaltaste la paga dos veces, o mucho en Cardón Rojo): La Viuda cierra pozos, el almacén
sube los precios, el perista se va del pueblo. Rosa: "Esto se muere, y tú ayudaste." Es lo que el jugador ve: el
desierto ya no da.

## Asalto 13: lo pendiente, y "Cole viene por ti"

Un asalto suelto para cerrar lo que quedó abierto (encargos sin hacer, la parte del capataz). Esa noche:

> *El diario: "El marshal federal **Reuben Cole** llega a Cardón Rojo en el de pasajeros del lunes para cazar al
> Cuervo. Cole es conocido por colgar rápido."*

> **Frank** (bajito): —Cole. Lo conozco de nombre, jefe. En la guerra era capitán. No pierde a nadie que persigue.

James conoce el nombre: es **el oficial que emboscó a la guerrilla de su padre**. Creció odiándolo.

Y una carta de J.Mc. 🔁 *(Santi, 2026-11-22: "que John sea un poco más directo para que mate al Marshal así el
jugador puede saber algo más")*:

> *McCoy: el lunes, en el de pasajeros, viaja Reuben Cole. Es el hombre que emboscó a tu padre. Lo vas a tener a
> tres pasos. Mátalo: te lo debes a ti, y a él. — J.Mc.*

Lo que el jugador aprende: **J.Mc. sabe quién era su padre.** Nunca se lo dijo. ¿Cómo lo sabe? (J.Mc. quiere muerto al
único hombre que podría descubrirlo, y usa al padre para que James lo haga.)

## Asalto 14: el Marshal en el tren, y la salida

**El tren de Cole** (pasajeros). Si el capataz te vendió, **la ley ya está adentro**: más guardias. En el vagón de
primera, un hombre de 50 años, con un parche en un ojo y la estrella en el chaleco. Cuando te ve, no saca el arma:
mira el pañuelo.

> **Cole**: —¿De dónde sacaste eso, muchacho?

- **Matarlo** → *Mataste al Marshal*. Se pierde el único aliado posible contra J.Mc.; la ley sigue con otro marshal
  sin historia, y Kate llega antes a la pradera. J.Mc., en la próxima carta: *"Bien."*
- **Dejarlo vivo** → *Le perdonaste la vida al Marshal*. J.Mc., en la próxima carta: *"Te lo puse a tres pasos."*
  *J.Mc. desconfía*.
- **Dejarlo vivo y contestarle: "Era de mi padre."** → *Cole vio el pañuelo*: Cole se queda con eso, y empieza a atar
  cabos antes (en la pradera lo sigue de cerca, pero no te tira a matar).

**La salida** (esa noche; Cole, vivo o muerto, ya sabe dónde está el campamento):
- **Si Rosa te debe una** → te esconde una noche en el sótano de la cantina, y salen al norte sin que nadie los vea.
- **Si no** → salen con la ley atrás: **la primera huida de la pradera arranca con jinetes**.
- **Si Dagget te persigue** (el pañuelo o el sobrino) → él solo, con la escopeta, en el camino. Una huida más, o un
  duelo (cuando existan los duelos).
- **Santiago**, mirando al sur mientras cargan los caballos. Lo que le dijiste en el 12 está en su cara.

---

## Lo que flota

**El pañuelo y Dagget** (desde que "El Cuervo" salió en el diario): si James baja al pueblo con el pañuelo puesto
(en vez de mandar a otro), Dagget lo ve de cerca:

> *Dagget se queda mirando el pañuelo. Se le va el color de la cara.*
> **Dagget**: —Ese pájaro… Los Cuervos quemaron mi pueblo. Yo tenía nueve años.

→ *Dagget vio el pañuelo*: deja de venderse (no hay fianza que alcance) y **te persigue él mismo, día y noche**, con
la escopeta de dos caños: en la huida del próximo golpe hay un jinete más, que no se compra. **A menos que** te hayas
sacado el pañuelo para bajar (una opción al bajar al pueblo, que aparece cuando "El Cuervo" ya salió en el diario).

**El cartel de Santiago** (desde el asalto 6, la primera vez que Frank baja al pueblo): en la oficina de Dagget, un
cartel viejo: *"SE BUSCA: SANTIAGO JIMÉNEZ, por el asesinato del ranger Cal Hollister."* (🔁 El ranger muerto es **el
hermano de Walt Hollister**, el del asalto 9: si respetaste a Walt, la escena pesa más.)

> *Frank vuelve del pueblo sin la botella. No hace chistes. Esa noche no se sienta cerca del fuego.*

→ *Frank sabe lo del ranger*. Esa noche, Frank y Santiago, frente a frente:
- **Si estaban enemigos** en la fogata → pelean de verdad. **A menos que** te metas: le das la razón a uno (el otro,
  queja doble), o los separas y los dos quedan heridos de orgullo (queja chica a cada uno).
- **Si estaban con roces o bien** → Frank no dice nada. Se lo guarda: en el bosque te pregunta qué haría un jefe.

**La emboscada de los Rennick** (si les pisaste dos trenes): esa noche, en el campamento, disparos desde las piedras.

> **Eli Rennick** (de lejos): —¡Cuervo! ¡Te dije una vez!

Es una pelea en el campamento (⚠️ mecánica nueva: por ahora, se resuelve con un cartel según quién estaba de guardia
y con qué armas). Puede quedar alguien herido. Y si el Rennick más chico cae vivo frente a ti:
- **Perdonarle la vida a Abel** → *Le perdonaste la vida a un Rennick*: en la pradera, Clay te busca.
- **Matarlo** → *Murió Abel*: no hay paz posible, nunca. El último tiroteo, en la montaña.

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
| *Mataste al Marshal* / *Le perdonaste la vida al Marshal* / *Cole vio el pañuelo* | Pradera (Kate, Cole), bosque, montaña |
