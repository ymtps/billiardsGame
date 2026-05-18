import { BALL_RADIUS, E_BALL, E_WALL, SLOP, WALL_XMIN, WALL_XMAX, WALL_ZMIN, WALL_ZMAX } from '../constants.js'

/**
 * Resolve elastic collision between two balls.
 * Mutates ball positions and velocities in-place.
 *
 * @param {Object} a  - ball state: { id, pos: Vector2D, vel: Vector2D }
 * @param {Object} b  - ball state
 * @param {CollisionLog} log - pass when `a` is the cue ball (id===0)
 * @param {boolean} isFirstIteration - record to log only on first solver pass
 */
export function resolveCircleCircle(a, b, log = null, isFirstIteration = true) {
  const dx = b.pos.x - a.pos.x
  const dz = b.pos.z - a.pos.z
  const distSq = dx * dx + dz * dz
  const minDist = 2 * BALL_RADIUS

  if (distSq >= minDist * minDist || distSq === 0) return // no contact

  const dist = Math.sqrt(distSq)
  const nx = dx / dist
  const nz = dz / dist

  // 1. Position correction (depenetration)
  const overlap = minDist - dist
  const correction = Math.max(0, overlap - SLOP) * 0.4 // 0.8 / 2
  a.pos.x -= correction * nx
  a.pos.z -= correction * nz
  b.pos.x += correction * nx
  b.pos.z += correction * nz

  // 2. Velocity impulse — skip if already separating
  const dvn = (b.vel.x - a.vel.x) * nx + (b.vel.z - a.vel.z) * nz
  if (dvn >= 0) return

  const j = -(1 + E_BALL) * dvn / 2
  a.vel.x -= j * nx
  a.vel.z -= j * nz
  b.vel.x += j * nx
  b.vel.z += j * nz

  // 3. Log cue ball contact (first iteration only, ascending id order)
  if (log && isFirstIteration) {
    if (a.id === 0) log.record(b.id)
    else if (b.id === 0) log.record(a.id)
  }
}

/**
 * Resolve ball vs. axis-aligned wall collision.
 * Mutates ball position and velocity in-place.
 */
export function resolveCircleWall(ball) {
  if (ball.pos.x < WALL_XMIN) {
    ball.pos.x = WALL_XMIN
    ball.vel.x = Math.abs(ball.vel.x) * E_WALL
  }
  if (ball.pos.x > WALL_XMAX) {
    ball.pos.x = WALL_XMAX
    ball.vel.x = -Math.abs(ball.vel.x) * E_WALL
  }
  if (ball.pos.z < WALL_ZMIN) {
    ball.pos.z = WALL_ZMIN
    ball.vel.z = Math.abs(ball.vel.z) * E_WALL
  }
  if (ball.pos.z > WALL_ZMAX) {
    ball.pos.z = WALL_ZMAX
    ball.vel.z = -Math.abs(ball.vel.z) * E_WALL
  }
}
