# Las referencias del caballo

Acá van las imágenes de caballos que se usan como referencia para la silueta.
**No son del juego y no se copian al juego**: son de otra gente. De acá sale
sólo el **contorno y las proporciones**, que es lo que estaba fallando; el
pelaje, la montura y la paleta son nuestros.

`medir-referencia.js` las carga, las achica al tamaño exacto del juego, les
saca la silueta y escupe el contorno columna por columna. Esos números entran
en `LOMO` y `PANZA` (en `src/entities/caballo.js`) **en lugar de los que yo
estimé a ojo con datos de anatomía** — que es como salió el zorro.

Nombres esperados (poné el que corresponda, los que falten se saltean):

- `perfil.png`  — de perfil, galopando. **La más importante**: de ella sale el contorno maestro.
- `escala.png`  — varios caballos chicos parados. Es la vara: cuánto detalle entra a nuestro tamaño.
- `atras.png`   — visto desde atrás (la pose de la tecla W).
- `frente.png`  — viniendo de frente (la pose de la tecla S).
- `jinete.png`  — un jinete en tres cuartos. Es nuestra cámara.
- `montura.png` — de perfil con montura western, para la montura y las proporciones.
