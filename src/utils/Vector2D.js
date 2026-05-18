/**
 * 2D vector for billiard physics (x-z plane).
 * Properties are named x and z to match Three.js world coordinates.
 */
export class Vector2D {
  constructor(x = 0, z = 0) {
    this.x = x
    this.z = z
  }

  add(v) { return new Vector2D(this.x + v.x, this.z + v.z) }
  sub(v) { return new Vector2D(this.x - v.x, this.z - v.z) }
  scale(s) { return new Vector2D(this.x * s, this.z * s) }
  dot(v) { return this.x * v.x + this.z * v.z }
  clone() { return new Vector2D(this.x, this.z) }

  lengthSq() { return this.x * this.x + this.z * this.z }
  length() { return Math.sqrt(this.lengthSq()) }

  normalize() {
    const len = this.length()
    if (len === 0) return new Vector2D(0, 0)
    return this.scale(1 / len)
  }

  distanceTo(v) { return this.sub(v).length() }
  distanceToSq(v) { return this.sub(v).lengthSq() }

  /** Mutate in-place — use sparingly */
  set(x, z) { this.x = x; this.z = z; return this }
  addInPlace(v) { this.x += v.x; this.z += v.z; return this }
  scaleInPlace(s) { this.x *= s; this.z *= s; return this }
}
