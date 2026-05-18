import { describe, it, expect, beforeEach } from 'vitest'
import { ShotCalculator } from './ShotCalculator.js'
import { Vector2D } from '../utils/Vector2D.js'
import { BALL_RADIUS } from '../constants.js'

function makeActiveBalls(list) {
  return list.map(([id, x, z]) => ({ id, pos: new Vector2D(x, z), isActive: true }))
}

describe('ShotCalculator', () => {
  let sc

  beforeEach(() => { sc = new ShotCalculator() })

  it('findDirectShot valid when no obstacles between cue and target', () => {
    const cue = new Vector2D(0, 0)
    const target = { id: 1, pos: new Vector2D(0.5, 0) }
    const balls = makeActiveBalls([[0, 0, 0], [1, 0.5, 0]])
    const result = sc.findDirectShot(cue, target, balls)
    expect(result.valid).toBe(true)
  })

  it('findDirectShot invalid when another ball blocks the path', () => {
    const cue = new Vector2D(0, 0)
    const blocker = { id: 2, pos: new Vector2D(0.25, 0) }
    const target = { id: 1, pos: new Vector2D(0.5, 0) }
    const balls = makeActiveBalls([[0, 0, 0], [2, 0.25, 0], [1, 0.5, 0]])
    const result = sc.findDirectShot(cue, target, balls)
    expect(result.valid).toBe(false)
  })

  it('calculateTolerance returns non-zero positive value', () => {
    const cue = new Vector2D(0, 0)
    const t = { id: 1, pos: new Vector2D(0.5, 0) }
    const tol = sc.calculateTolerance(cue, t)
    expect(tol).toBeGreaterThan(0)
    expect(tol).toBeLessThan(Math.PI / 2)
  })

  it('calculateTolerance distance=0 returns fallback (no NaN)', () => {
    const cue = new Vector2D(0, 0)
    const t = { id: 1, pos: new Vector2D(0, 0) }
    const tol = sc.calculateTolerance(cue, t)
    expect(isNaN(tol)).toBe(false)
    expect(tol).toBeGreaterThan(0)
  })

  it('addError stays within tolerance range', () => {
    const base = 0.5
    const tol = 0.2
    for (let i = 0; i < 50; i++) {
      const result = sc.addError(base, tol)
      expect(Math.abs(result - base)).toBeLessThanOrEqual(tol * 0.5 + 1e-9)
    }
  })

  it('findBestShot always returns non-null result', () => {
    // Even with a clustered table, fallback ensures a shot
    const cue = new Vector2D(0, 0)
    const target = { id: 1, pos: new Vector2D(0.5, 0) }
    const balls = makeActiveBalls([
      [0, 0, 0], [1, 0.5, 0],
      [2, 0.25, 0], // blocker for direct
    ])
    const shot = sc.findBestShot(cue, target, balls)
    expect(shot).not.toBeNull()
    expect(typeof shot.angle).toBe('number')
    expect(shot.speed).toBeGreaterThan(0)
  })
})
