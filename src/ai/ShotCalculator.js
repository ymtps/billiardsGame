import { castRay } from '../utils/castRay.js'
import { Vector2D } from '../utils/Vector2D.js'
import { BALL_RADIUS, WALL_XMIN, WALL_XMAX, WALL_ZMIN, WALL_ZMAX } from '../constants.js'

/**
 * Computes optimal shot angles for the AI.
 *
 * P1 fixes:
 * - findDirectShot uses castRay which is already swept-circle (ghost ball method)
 * - findBankShot validates BOTH legs: cueBall→bounce AND bounce→target
 * - findBestCueBallPosition: new method for AI BIH placement
 */
export class ShotCalculator {
  /**
   * Find a direct shot angle.
   * @param {Vector2D} cueBall
   * @param {Object} targetBall - { id, pos: Vector2D }
   * @param {Array} activeBalls - all active balls (used for obstruction check)
   * @returns {{ valid: boolean, angle: number }}
   */
  findDirectShot(cueBall, targetBall, activeBalls) {
    const dir = targetBall.pos.sub(cueBall)
    const baseAngle = Math.atan2(dir.z, dir.x)
    // Cast swept-circle ray; skip target ball if it happens to be in the way detection
    const obstacles = activeBalls.filter(b => b.id !== 0 && b.id !== targetBall.id)
    const hit = castRay(cueBall, baseAngle, [...obstacles, { id: targetBall.id, pos: targetBall.pos }])
    return {
      valid: hit !== null && hit.type === 'ball' && hit.id === targetBall.id,
      angle: baseAngle,
    }
  }

  /**
   * Find a bank shot angle (single rail only).
   * Validates both legs: cueBall→rail bounce AND rail bounce→target.
   * P1 fix: second-leg validation added.
   */
  findBankShot(cueBall, targetBall, activeBalls) {
    const t = targetBall.pos
    const obstacles = activeBalls.filter(b => b.id !== 0)

    // 4 rails: TOP, BOTTOM, LEFT, RIGHT (using wall center lines)
    const rails = [
      { axis: 'z', val: WALL_ZMIN, mirror: (p) => new Vector2D(p.x, 2 * WALL_ZMIN - p.z) },
      { axis: 'z', val: WALL_ZMAX, mirror: (p) => new Vector2D(p.x, 2 * WALL_ZMAX - p.z) },
      { axis: 'x', val: WALL_XMIN, mirror: (p) => new Vector2D(2 * WALL_XMIN - p.x, p.z) },
      { axis: 'x', val: WALL_XMAX, mirror: (p) => new Vector2D(2 * WALL_XMAX - p.x, p.z) },
    ]

    for (const rail of rails) {
      const virtualTarget = rail.mirror(t)
      const bankAngle = Math.atan2(virtualTarget.z - cueBall.z, virtualTarget.x - cueBall.x)

      // Leg 1: cueBall → bounce point on rail
      const leg1Hit = castRay(cueBall, bankAngle, obstacles, 6)
      if (!leg1Hit || leg1Hit.type !== 'wall') continue // first hit must be a wall

      const bouncePoint = leg1Hit.point

      // Leg 2 (P1 fix): bounce point → target ball
      const leg2Angle = Math.atan2(t.z - bouncePoint.z, t.x - bouncePoint.x)
      const obsBeyond = obstacles.filter(b => b.id !== targetBall.id)
      const leg2Hit = castRay(bouncePoint, leg2Angle,
        [...obsBeyond, { id: targetBall.id, pos: t }], 6)
      if (leg2Hit && leg2Hit.type === 'ball' && leg2Hit.id === targetBall.id) {
        return { valid: true, angle: bankAngle }
      }
    }
    return { valid: false, angle: 0 }
  }

  /**
   * Tolerance: maximum angle error that still results in contact with target ball.
   */
  calculateTolerance(cueBall, targetBall) {
    const dist = cueBall.distanceTo(targetBall.pos)
    if (dist <= 0) return Math.PI / 4
    return Math.atan2(BALL_RADIUS, dist)
  }

  /** Add random error bounded to ±50% of tolerance. */
  addError(baseAngle, tolerance) {
    const errorRange = tolerance * 0.5
    return baseAngle + (Math.random() * 2 - 1) * errorRange
  }

  /**
   * Find the best shot (direct → bank → fallback).
   * Always returns a non-null result.
   */
  findBestShot(cueBall, targetBall, activeBalls) {
    const tolerance = this.calculateTolerance(cueBall, targetBall)

    const direct = this.findDirectShot(cueBall, targetBall, activeBalls)
    if (direct.valid) {
      return { angle: this.addError(direct.angle, tolerance), speed: 3.0 }
    }

    const bank = this.findBankShot(cueBall, targetBall, activeBalls)
    if (bank.valid) {
      return { angle: this.addError(bank.angle, tolerance * 0.5), speed: 4.0 }
    }

    // Fallback: aim toward target with minimum speed (accepts foul)
    const fallbackAngle = Math.atan2(
      targetBall.pos.z - cueBall.z,
      targetBall.pos.x - cueBall.x,
    )
    return { angle: fallbackAngle, speed: 1.0 }
  }

  /**
   * Find the best cue ball position for BIH.
   * Scans a grid of candidate positions and returns the first from which
   * findDirectShot is valid. Falls back to a simple clear spot.
   * P1 fix: this method was missing from the plan.
   *
   * @param {Object} targetBall - { id, pos }
   * @param {Array} activeBalls - all active balls
   * @param {BallManager} ballManager
   * @param {Map} activePosMap
   */
  findBestCueBallPosition(targetBall, activeBalls, ballManager, activePosMap) {
    // Try positions along a line from center toward target (opposite side)
    const tx = targetBall.pos.x
    const tz = targetBall.pos.z
    const candidates = [
      new Vector2D(-tx * 0.5, -tz * 0.5),  // opposite quadrant
      new Vector2D(0, 0),                    // center
      new Vector2D(-tx * 0.3, 0),
      new Vector2D(0, -tz * 0.3),
    ]
    // Add grid search
    for (let gx = -1; gx <= 1; gx += 0.5) {
      for (let gz = -0.4; gz <= 0.4; gz += 0.4) {
        candidates.push(new Vector2D(gx, gz))
      }
    }

    for (const pos of candidates) {
      if (!ballManager.isValidBIHPosition(pos, activePosMap)) continue
      const fakeCue = { id: 0, pos }
      const shot = this.findDirectShot(pos, targetBall, [...activeBalls.filter(b => b.id !== 0), { id: targetBall.id, pos: targetBall.pos }])
      if (shot.valid) return pos
    }

    // Last resort: any valid spot
    for (let gx = -1; gx <= 1; gx += 0.2) {
      for (let gz = -0.4; gz <= 0.4; gz += 0.2) {
        const pos = new Vector2D(gx, gz)
        if (ballManager.isValidBIHPosition(pos, activePosMap)) return pos
      }
    }

    return new Vector2D(0, -0.3) // absolute fallback
  }
}
