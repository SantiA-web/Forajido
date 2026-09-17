# Los sprites del caballo

Acá van los sprites y las animaciones de caballo que consiguió Santi.

**Poné los archivos tal como los bajaste.** Si vienen en `.zip` los abro yo; si
vienen en `.rar` hace falta descomprimirlos antes (en esta máquina no hay nada
que lea `.rar`).

## Qué me sirve de cada paquete

- **Los PNG**, sobre todo la **hoja de sprites** (el archivo con todos los
  cuadros en una grilla). Es lo que se usa.
- **El archivo de licencia o el LEEME del paquete**, si trae. No es un trámite:
  decide si el dibujo puede ir DENTRO del juego o sólo servir de referencia, y
  si hay que poner el crédito del autor en algún lado.
- El `.aseprite` no hace falta (no lo puedo abrir), pero si viene no molesta.

## Qué se mira antes de usarlos

1. **La vista.** Nuestro caballo se ve en tres cuartos, de costado y corriendo
   hacia la derecha. Un sprite de vista cenital (desde arriba) no sirve.
2. **El tamaño.** El nuestro mide unos 86 puntos de cuerpo por 68 de alzada.
   Un sprite de 64×64 entra pero se ve más chico; uno de 32×32 queda muy por
   debajo de la resolución del resto del juego.
3. **Los cuadros del galope.** Si tiene un ciclo de carrera, se puede enganchar
   al reloj del sonido para que cada casco pise cuando suena su golpe — que es
   lo que ya hace el caballo dibujado.
4. **Si trae jinete propio.** Conviene que NO lo traiga, o poder separarlo: el
   nuestro cambia de ropa, de estado y de postura, y tiene que ser nuestra
   gente la que va montada.
