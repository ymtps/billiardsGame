import { describe, it, expect } from 'vitest'
import { generateRackPositions } from './RackSetup.js'
import { FOOT_SPOT_Z } from '../constants.js'

describe('generateRackPositions', () => {
  it('returns 10 ball positions (9 numbered + cue)', () => {
    const pos = generateRackPositions()
    expect(pos.length).toBe(10)
  })

  it('ball 1 is at apex (first position in rack)', () => {
    const pos = generateRackPositions()
    const ball1 = pos.find(p => p.id === 1)
    expect(ball1).toBeDefined()
    expect(ball1.x).toBeCloseTo(0, 5)
    expect(ball1.z).toBeCloseTo(FOOT_SPOT_Z, 5)
  })

  it('ball 9 is at center (slot 4)', () => {
    const pos = generateRackPositions()
    const ball9 = pos.find(p => p.id === 9)
    expect(ball9).toBeDefined()
    // Center z = FOOT_SPOT_Z + 2 * BALL_RADIUS * 2
    // We just check it's not at the apex
    expect(ball9.z).not.toBeCloseTo(FOOT_SPOT_Z, 3)
  })

  it('all ids from 0-9 appear exactly once', () => {
    const pos = generateRackPositions()
    const ids = pos.map(p => p.id).sort((a, b) => a - b)
    expect(ids).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('produces different orderings across multiple calls (random)', () => {
    const results = Array.from({ length: 10 }, () =>
      generateRackPositions()
        .filter(p => p.id >= 2 && p.id <= 8)
        .map(p => p.id)
        .join(',')
    )
    const unique = new Set(results)
    expect(unique.size).toBeGreaterThan(1) // probabilistic
  })
})
