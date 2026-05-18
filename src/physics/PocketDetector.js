import { POCKET_RADIUS, POCKET_POSITIONS } from '../constants.js'

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
    if (dx * dx + dz * dz < POCKET_RADIUS * POCKET_RADIUS) {
      return { pocketed: true, pocketId: i }
    }
  }
  return null
}
