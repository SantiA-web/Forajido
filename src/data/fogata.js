/**
 * 🔥 LA FOGATA — LOS NÚMEROS (BANDA-NUEVA.md, "Las relaciones" y "La noche del golpe", paso 5; etapa 4) *(Santi,
 * 2026-11-20: "seguí con la etapa 4")*. Las reglas, en systems/fogata.js; los momentos, en data/momentos.js
 * (`discusion` y `pelea`).
 *
 * Cada par de la banda está **bien**, con **roces** o **enemigos**. Frank y Santiago arrancan con roces.
 *  - **Se empeora** (bien → roces → enemigos): el reparto desparejo (a uno un cuarto más de lo que esperaba y al otro lo
 *    esperado o menos), o `choque` de cada 100 golpes por par, porque chocan por cómo son.
 *  - **La noche del golpe**, el par que peor se lleva hace algo (si empatan, el que suma menos lealtad):
 *    - con roces, **discuten**: darle la razón a uno (él, favor; el otro, queja doble), **calmarlos** (`calmar`, o
 *      gratis si un tercero tiene Labia: vuelven a estar bien) o **dejarlo** (pasan a enemigos; si hay un Divertido que
 *      no es ninguno de los dos, según su fuerza no pasa a mayores, pero los dos quedan con "nadie nos escuchó").
 *    - con enemigos, **pelean**: **pararlos** (`parar`) o no meterse: queda herido `herida` días el de menos lealtad
 *      (el Buen cuchillero nunca: el herido es el otro), con queja chica, y vuelven a roces (se desahogaron).
 *  - Con enemigos, si los dos van al golpe, cada uno va un paso abajo (ver `pronostico`, data/banda.js).
 *  - El **Divertido** en la fogata, según su fuerza, le borra una queja chica a otro (al Serio no), una vez por golpe.
 * Medido (simulador v19, el que cuida): unas 6,5 discusiones por partida y 0,3 peleas.
 */
export const FOGATA = {
  /** 🔑 La llave: con false no hay relaciones ni fogata. */
  activa: true,
  inicio: { 'frank-santiago': 'roces', 'frank-tommy': 'bien', 'santiago-tommy': 'bien' },
  choque: 0.05,
  calmar: 40,
  parar: 80,
  herida: 2,
};
