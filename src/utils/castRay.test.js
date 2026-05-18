import { describe, it, expect } from 'vitest'
import { castRay } from './castRay.js'
import { Vector2D } from './Vector2D.js'
import { BALL_RADIUS } from '../constants.js'

describe('castRay', () => {
  it('returns null when no obstacle in path', () => {
    const result = castRay(new Vector2D(0, 0), 0, [], 0.5)
    // Straight right for only 0.5m in empty space — hits right wall
    // Actually maxDist=0.5 is less than wall distance, so null... no wait wall check ignores maxDist
    // Let's use a very short maxDist
    const result2 = castRay(new Vector2D(0, 0), 0, [], 0.001)
    expect(result2).toBeNull()
  })

  it('detects ball in direct path (swept circle)', () => {
    // Ball at (1, 0), cue at (0, 0), shooting right (angle=0)
    const target = { id: 1, pos: new Vector2D(0.5, 0) }
    const hit = castRay(new Vector2D(0, 0), 0, [target], 2)
    expect(hit).not.toBeNull()
    expect(hit.type).toBe('ball')
    expect(hit.id).toBe(1)
    // Contact at t = 0.5 - 2*BALL_RADIUS (approximately)
    expect(hit.t).toBeCloseTo(0.5 - 2 * BALL_RADIUS, 3)
  })

  it('detects wall when no balls in path', () => {
    // Shoot right from origin — should hit right wall
    const hit = castRay(new Vector2D(0, 0), 0, [], 10)
    expect(hit).not.toBeNull()
    expect(hit.type).toBe('wall')
  })

  it('ignores ball behind origin (negative t)', () => {
    // Ball behind cue ball
    const behind = { id: 2, pos: new Vector2D(-0.5, 0) }
    const hit = castRay(new Vector2D(0, 0), 0, [behind], 10)
    expect(hit?.type).toBe('wall') // should hit wall, not the behind ball
  })

  it('detects ball offset from center line (swept circle check)', () => {
    // Ball slightly offset from direct line — still hit by fat ray
    const offset = BALL_RADIUS * 1.5 // less than 2*BALL_RADIUS so should still hit
    const target = { id: 3, pos: new Vector2D(0.3, offset) }
    const hit = castRay(new Vector2D(0, 0), 0, [target], 2)
    expect(hit).not.toBeNull()
    expect(hit.type).toBe('ball')
  })

  it('misses ball that is just outside swept circle', () => {
    // Ball far from line — should NOT be hit
    const farOffset = BALL_RADIUS * 2.5 // greater than 2*BALL_RADIUS
    const target = { id: 4, pos: new Vector2D(0.3, farOffset) }
    const hit = castRay(new Vector2D(0, 0), 0, [target], 2)
    expect(hit?.type).toBe('wall') // hits wall instead
  })
})
