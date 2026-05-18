import { Vector2D } from './Vector2D.js'
import { BALL_RADIUS, WALL_XMIN, WALL_XMAX, WALL_ZMIN, WALL_ZMAX } from '../constants.js'

/**
 * 2D swept-circle ray cast.
 *
 * Casts a "fat ray" of width = 2 * BALL_RADIUS from `origin` in `direction`.
 * Returns the first object hit (ball surface or wall), or null if nothing found
 * within `maxDist`.
 *
 * Uses the "ghost ball" approach: checks whether the cue ball (radius BALL_RADIUS)
 * traveling from origin would contact any obstacle ball (radius BALL_RADIUS) —
 * i.e., the minimum distance from obstacle center to the ray segment is < 2 * BALL_RADIUS.
 *
 * @param {Vector2D} origin - cue ball start position
 * @param {number} angle - travel angle in radians
 * @param {Array} activeBalls - array of {id, pos: Vector2D} to check (exclude cue ball)
 * @param {number} maxDist - maximum ray length (defaults to table diagonal)
 * @returns {{ type: 'ball'|'wall', id?: number, t: number, point: Vector2D } | null}
 */
export function castRay(origin, angle, activeBalls, maxDist = 6) {
  const dir = new Vector2D(Math.cos(angle), Math.sin(angle))
  let bestT = maxDist
  let bestHit = null

  // --- Ball-ball (swept-circle) check ---
  for (const ball of activeBalls) {
    const dx = ball.pos.x - origin.x
    const dz = ball.pos.z - origin.z
    // Project ball center onto ray
    const tProj = dx * dir.x + dz * dir.z
    if (tProj <= 0) continue // behind origin
    // Perpendicular distance from ball center to ray line
    const perpSq = (dx * dx + dz * dz) - tProj * tProj
    const contactDist = 2 * BALL_RADIUS
    if (perpSq >= contactDist * contactDist) continue // no hit
    // t at which cue ball center reaches contact distance
    const t = tProj - Math.sqrt(contactDist * contactDist - perpSq)
    if (t > 0 && t < bestT) {
      bestT = t
      bestHit = { type: 'ball', id: ball.id, t, point: new Vector2D(origin.x + dir.x * t, origin.z + dir.z * t) }
    }
  }

  // --- Wall check ---
  // Left wall (x = WALL_XMIN)
  if (dir.x < 0) {
    const t = (WALL_XMIN - origin.x) / dir.x
    if (t > 0 && t < bestT) { bestT = t; bestHit = { type: 'wall', t, point: new Vector2D(WALL_XMIN, origin.z + dir.z * t) } }
  }
  // Right wall (x = WALL_XMAX)
  if (dir.x > 0) {
    const t = (WALL_XMAX - origin.x) / dir.x
    if (t > 0 && t < bestT) { bestT = t; bestHit = { type: 'wall', t, point: new Vector2D(WALL_XMAX, origin.z + dir.z * t) } }
  }
  // Top wall (z = WALL_ZMIN)
  if (dir.z < 0) {
    const t = (WALL_ZMIN - origin.z) / dir.z
    if (t > 0 && t < bestT) { bestT = t; bestHit = { type: 'wall', t, point: new Vector2D(origin.x + dir.x * t, WALL_ZMIN) } }
  }
  // Bottom wall (z = WALL_ZMAX)
  if (dir.z > 0) {
    const t = (WALL_ZMAX - origin.z) / dir.z
    if (t > 0 && t < bestT) { bestT = t; bestHit = { type: 'wall', t, point: new Vector2D(origin.x + dir.x * t, WALL_ZMAX) } }
  }

  return bestHit
}
