# La lámina del caballo (etapa 5b)

**Doble clic en `Prueba-caballo.html`** (o abrilo desde el servidor). Dibuja las
**nueve poses** del caballo en fila, tres veces:

- **sin jinete** — el animal solo, para mirar la silueta.
- **con jinete, a fondo** — como se ve galopando a tope.
- **con jinete, al trote** — con menos esfuerzo: la crin y la cola vuelan menos.

## Por qué hacía falta

En el juego **nunca se ven las nueve juntas**: van pasando de a una mientras
doblás con W o S. Así es imposible saber si el giro se lee o no, y era
justamente lo que había que arreglar *(Santi: "cuando dobla con W o S, es como
que solo mueve el cuello el caballo cuando en realidad debería mover todo el
cuerpo")*.

Mirándolas en fila saltan las cosas que de a una no se notan: que el cuerpo casi
no se acortaba, que las patas quedaban clavadas en el mismo lugar, que la cabeza
subía cuando el caballo venía hacia la cámara en vez de bajar, y que con un
escorzo demasiado fuerte el animal desaparece atrás del jinete.

Es la misma prueba aparte que usamos para la gente (`prototipos/gente-80px/`) y
para el vagón (`prototipos/vagon/`).

## Cómo está hecho

Importa `entities/caballo.js` y `entities/figura.js` **del juego de verdad** —no
hay copias— y les pasa un renderer mínimo con la misma lupa de ×4. Todo se mide
en **puntos de dibujo** (1 punto = un cuarto de unidad).

Abajo de todo dice cuántas láminas quedaron guardadas y cuánto ocupan: son dos
por pose (el cuerpo y la cabeza van separadas porque no siempre se dibujan en el
mismo orden), o sea **18 y unos 386 KB**.
