# La lámina del vagón (etapa 3)

**Doble clic en `Prueba-vagon.html`** (o abrilo desde el servidor). Dibuja el
mismo pedazo de tren tres veces, una debajo de la otra:

- **HOY** — lo que dibuja el juego ahora mismo, copiado de `world/train.js`.
- **A** — el mismo vagón con el detalle de la gente nueva, sobrio.
- **B** — lo mismo, más gastado: nudos, manchas, remiendos, la marca del correo.

No hay jugabilidad acá: es sólo dibujo, para poder elegir el estilo **antes** de
tocar el código del tren. Es la misma prueba aparte que usamos para la gente
(`prototipos/gente-80px/`).

## Por qué hacía falta

Una casilla del tren mide 16 unidades del mundo, o sea **64 puntos de dibujo**
con la lupa de ×4. Hoy el piso de esa casilla son **dos rectángulos**: un color
plano y una raya. Al lado de una persona de 80 puntos, dibujada punto por punto,
el vagón quedó liso.

## Cómo está hecho

Todo se mide en **puntos de dibujo** (1 punto = un cuarto de unidad), igual que
la gente. La veta de la madera y las manchas NO son azar: salen de un número
fijo por casilla (`sorteo`), porque si fueran azar de verdad el piso titilaría
en cada cuadro.

Los colores son **los de hoy** (`data/config.js`) a propósito: esto es una
prueba de detalle, no de paleta. Si cambiáramos las dos cosas de una no
sabríamos cuál de las dos mejoró.
