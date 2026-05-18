import { describe, it, expect } from 'vitest'
import { resolveCircleCircle, resolveCircleWall } from './Collision.js'
import { CollisionLog } from './CollisionLog.js'
import { Vector2D } from '../utils/Vector2D.js'
import { BALL_RADIUS, E_BALL, E_WALL, WALL_XMIN, WALL_XMAX, WALL_ZMIN, WALL_ZMAX } from '../constants.js'

function makeBall(id, x, z, vx = 0, vz = 0) {
  return { id, pos: new Vector2D(x, z), vel: new Vector2D(vx, vz), isActive: true }
}

describe('resolveCircleCircle', () => {
  it('head-on collision: velocities transfer correctly with COR=0.95', () => {
    const a = makeBall(0, 0, 0, 1, 0) // cue ball moving right at 1 m/s
    // Place b slightly overlapping so collision fires (> SLOP tolerance)
    const b = makeBall(1, 2 * BALL_RADIUS - 0.003, 0, 0, 0) // stationary
    resolveCircleCircle(a, b, null, true)
    // With COR=0.95, equal mass: v1' = (1-e)/2 = 0.025, v2' = (1+e)/2 = 0.975
    expect(a.vel.x).toBeCloseTo((1 - E_BALL) / 2, 2) // ~0.025
    expect(b.vel.x).toBeCloseTo((1 + E_BALL) / 2, 2) // ~0.975
    expect(b.vel.x).toBeGreaterThan(a.vel.x) // b moves faster than a
  })

  it('does not apply impulse when balls are separating', () => {
    // Balls moving away from each other
    const a = makeBall(0, 0, 0, -1, 0)
    const b = makeBall(1, 2 * BALL_RADIUS, 0, 1, 0)
    const bVelBefore = b.vel.x
    resolveCircleCircle(a, b, null, true)
    expect(b.vel.x).toBeCloseTo(bVelBefore, 5)
  })

  it('depenetrates overlapping balls', () => {
    // Balls placed exactly on top of each other (maximal overlap)
    const a = makeBall(0, 0, 0)
    const b = makeBall(1, 0.001, 0) // barely separated
    resolveCircleCircle(a, b, null, true)
    const dist = Math.sqrt((b.pos.x - a.pos.x) ** 2 + (b.pos.z - a.pos.z) ** 2)
    expect(dist).toBeGreaterThan(0)
  })

  it('records cue ball contact in CollisionLog on first iteration', () => {
    const log = new CollisionLog()
    log.start()
    const cue = makeBall(0, 0, 0, 1, 0)
    const target = makeBall(1, 2 * BALL_RADIUS - 0.001, 0) // slight overlap
    resolveCircleCircle(cue, target, log, true)
    expect(log.getFirstContact()).toBe(1)
  })

  it('does not record to CollisionLog on subsequent iterations', () => {
    const log = new CollisionLog()
    log.start()
    const cue = makeBall(0, 0, 0, 1, 0)
    const target = makeBall(1, 2 * BALL_RADIUS, 0)
    resolveCircleCircle(cue, target, log, false) // not first iteration
    expect(log.getFirstContact()).toBeNull()
  })
})

describe('resolveCircleWall', () => {
  it('reflects x velocity at right wall', () => {
    const ball = makeBall(0, WALL_XMAX + 0.01, 0, 1, 0)
    resolveCircleWall(ball)
    expect(ball.vel.x).toBeLessThan(0)
    expect(ball.pos.x).toBeCloseTo(WALL_XMAX, 5)
  })

  it('reflects x velocity at left wall', () => {
    const ball = makeBall(0, WALL_XMIN - 0.01, 0, -1, 0)
    resolveCircleWall(ball)
    expect(ball.vel.x).toBeGreaterThan(0)
  })

  it('reflects z velocity at bottom wall', () => {
    const ball = makeBall(0, 0, WALL_ZMAX + 0.01, 0, 1)
    resolveCircleWall(ball)
    expect(ball.vel.z).toBeLessThan(0)
  })

  it('applies E_WALL coefficient to reflected velocity', () => {
    const ball = makeBall(0, WALL_XMAX + 0.01, 0, 2, 0)
    resolveCircleWall(ball)
    expect(Math.abs(ball.vel.x)).toBeCloseTo(2 * E_WALL, 3)
  })
})
