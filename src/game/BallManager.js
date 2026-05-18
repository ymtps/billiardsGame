import { Vector2D } from '../utils/Vector2D.js'
import { WALL_XMIN, WALL_XMAX, WALL_ZMIN, WALL_ZMAX, BALL_RADIUS, FOOT_SPOT_Z } from '../constants.js'

/**
 * Manages game-level ball state (identity, active/pocketed status).
 * Physics engine holds the simulation state; BallManager holds game state.
 */
export class BallManager {
  constructor() {
    this.balls = [] // [{id, isActive, isPocketed}]
  }

  /** Initialize 10 balls from rack positions [{id,x,z}]. */
  reset(rackPositions) {
    this.balls = rackPositions.map(p => ({
      id: p.id,
      isActive: true,
      isPocketed: false,
    }))
  }

  pocket(ballId) {
    const b = this.balls.find(b => b.id === ballId)
    if (b) { b.isActive = false; b.isPocketed = true }
  }

  get activeBalls() { return this.balls.filter(b => b.isActive) }

  /** Lowest-id numbered ball on table (not cue). */
  getTargetBallId() {
    const numbered = this.activeBalls.filter(b => b.id >= 1)
    if (numbered.length === 0) return null
    return Math.min(...numbered.map(b => b.id))
  }

  isNineOnTable() { return this.balls.some(b => b.id === 9 && b.isActive) }

  /**
   * Re-spot the 9-ball.
   * Tries foot spot, then head spot, then center.
   * activePosMap: Map<id, Vector2D> — current positions from physics engine
   */
  respotNineBall(activePosMap) {
    const nine = this.balls.find(b => b.id === 9)
    if (!nine) return null
    nine.isActive = true
    nine.isPocketed = false

    const candidates = [
      new Vector2D(0, FOOT_SPOT_Z),       // foot spot
      new Vector2D(0, -FOOT_SPOT_Z),      // head spot
      new Vector2D(0, 0),                  // center
    ]
    for (const pos of candidates) {
      if (!this._overlapsAny(pos, activePosMap, 9)) return pos
    }
    // Last resort: small offset from foot spot
    return new Vector2D(BALL_RADIUS * 3, FOOT_SPOT_Z)
  }

  _overlapsAny(pos, activePosMap, excludeId) {
    for (const [id, p] of activePosMap) {
      if (id === excludeId) continue
      const dx = p.x - pos.x
      const dz = p.z - pos.z
      if (dx * dx + dz * dz < (2.2 * BALL_RADIUS) ** 2) return true
    }
    return false
  }

  /**
   * Check if a BIH placement position is valid.
   * activePosMap: Map<id, Vector2D>
   */
  isValidBIHPosition(pos, activePosMap) {
    if (pos.x < WALL_XMIN || pos.x > WALL_XMAX ||
        pos.z < WALL_ZMIN || pos.z > WALL_ZMAX) return false
    for (const [id, p] of activePosMap) {
      if (id === 0) continue // skip cue ball itself
      const dx = p.x - pos.x
      const dz = p.z - pos.z
      if (dx * dx + dz * dz < (2.2 * BALL_RADIUS) ** 2) return false
    }
    return true
  }
}
