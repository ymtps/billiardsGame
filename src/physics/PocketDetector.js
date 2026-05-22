import { BALL_RADIUS, POCKET_RADIUS, POCKET_POSITIONS } from '../constants.js'

const HALF_BALL_OVERLAP_RADIUS = POCKET_RADIUS + BALL_RADIUS * 0.5

/**
 * Check if a ball has entered any pocket.
 * @param {Object} ball - { id, pos: Vector2D, isActive }
 * @returns {{ pocketed: true, pocketId: number } | null}
 */
export function checkPocket(ball) {
  for (let i = 0; i < POCKET_POSITIONS.length; i++) {
    const p = POCKET_POSITIONS[i]
    const dx = ball.pos.x - p.x
    const dz = ball.pos.z - p.z
    if (dx * dx + dz * dz < HALF_BALL_OVERLAP_RADIUS * HALF_BALL_OVERLAP_RADIUS) {
      return { pocketed: true, pocketId: i }
    }
  }
  return null
}
