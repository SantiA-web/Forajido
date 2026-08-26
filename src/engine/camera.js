/**
 * Cámara: decide qué parte del mundo se ve, y sacude la pantalla.
 *
 * El "screen shake" parece un detalle tonto, pero es de las cosas que más
 * hacen que disparar se sienta bien. Cuesta 15 líneas.
 */

export function createCamera(viewWidth, viewHeight) {
  return {
    x: 0,
    y: 0,
    shakeTime: 0,
    shakeMagnitude: 0,
    offsetX: 0,
    offsetY: 0,

    /** Sigue a un punto con suavizado, sin salirse de los límites del mapa. */
    follow(targetX, targetY, bounds, dt, smoothing = 8) {
      let desiredX = targetX - viewWidth / 2;
      let desiredY = targetY - viewHeight / 2;

      // Si el mapa es más chico que la pantalla, lo centramos.
      if (bounds.width <= viewWidth) desiredX = (bounds.width - viewWidth) / 2;
      else desiredX = clamp(desiredX, 0, bounds.width - viewWidth);

      if (bounds.height <= viewHeight) desiredY = (bounds.height - viewHeight) / 2;
      else desiredY = clamp(desiredY, 0, bounds.height - viewHeight);

      const t = Math.min(1, smoothing * dt);
      this.x += (desiredX - this.x) * t;
      this.y += (desiredY - this.y) * t;
    },

    snap(targetX, targetY, bounds) {
      this.follow(targetX, targetY, bounds, 1, 1);
    },

    /** Una sacudida más fuerte pisa a una más débil que esté en curso. */
    shake(magnitude, duration = 0.18) {
      if (magnitude >= this.shakeMagnitude || this.shakeTime <= 0) {
        this.shakeMagnitude = magnitude;
        this.shakeTime = duration;
        this.shakeDuration = duration;
      }
    },

    update(dt, rng) {
      if (this.shakeTime > 0) {
        this.shakeTime -= dt;
        const fade = Math.max(0, this.shakeTime / (this.shakeDuration || 0.18));
        this.offsetX = rng.spread(this.shakeMagnitude) * fade;
        this.offsetY = rng.spread(this.shakeMagnitude) * fade;
      } else {
        this.offsetX = 0;
        this.offsetY = 0;
      }
    },

    /** Lo que hay que restar para pasar de coordenadas de mundo a pantalla. */
    get renderX() { return Math.round(this.x + this.offsetX); },
    get renderY() { return Math.round(this.y + this.offsetY); },
  };
}

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}
