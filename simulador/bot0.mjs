import { correr, JUGADORES } from 'file:///C:/dev/forajido/simulador/banda3.js';
const P=800; for (const b of [0,0.5,1]) { const r=correr({...JUGADORES.cuidadoso, botella:b},P); console.log('botella',b,(100*r.pierde[0]/P).toFixed(0)+'%',Math.round(r.plata/P)); }
for (const c of [0,0.8]) { const r=correr({...JUGADORES.cuidadoso, calma:c},P); console.log('calma',c,(100*r.pierde[0]/P).toFixed(0)+'%',Math.round(r.plata/P), (r.peleas/P).toFixed(1)); }
