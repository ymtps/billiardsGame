import { describe, it, expect, beforeEach } from 'vitest'
import { BallManager } from './BallManager.js'
import { Vector2D } from '../utils/Vector2D.js'
import { FOOT_SPOT_Z, BALL_RADIUS, WALL_XMIN, WALL_XMAX } from '../constants.js'

function makePositions(n = 10) {
  return Array.from({ length: n }, (_, i) => ({ id: i, x: i * 0.1, z: 0 }))
}

function makeActivePosMap(balls) {
  const m = new Map()
  balls.forEach(b => m.set(b.id, new Vector2D(b.x * 0.1, 0)))
  return m
}

describe('BallManager', () => {
  let bm

  beforeEach(() => {
    bm = new BallManager()
    bm.reset(makePositions())
  })

  it('getTargetBallId returns 1 initially', () => {
    expect(bm.getTargetBallId()).toBe(1)
  })

  it('after pocketing 1, target becomes 2', () => {
    bm.pocket(1)
    expect(bm.getTargetBallId()).toBe(2)
  })

  it('isNineOnTable is true initially', () => {
    expect(bm.isNineOnTable()).toBe(true)
  })

  it('isNineOnTable false after pocketing 9', () => {
    bm.pocket(9)
    expect(bm.isNineOnTable()).toBe(false)
  })

  it('respotNineBall sets 9 back to active', () => {
    bm.pocket(9)
    const posMap = new Map([[1, new Vector2D(0.1, 0)]]) // only ball 1 active
    bm.respotNineBall(posMap)
    expect(bm.isNineOnTable()).toBe(true)
  })

  it('respotNineBall uses foot spot when free', () => {
    bm.pocket(9)
    const posMap = new Map() // no active balls
    const pos = bm.respotNineBall(posMap)
    expect(pos.z).toBeCloseTo(FOOT_SPOT_Z, 3)
  })

  it('isValidBIHPosition returns true for table center', () => {
    const posMap = new Map() // no obstacles
    expect(bm.isValidBIHPosition(new Vector2D(0, 0), posMap)).toBe(true)
  })

  it('isValidBIHPosition returns false outside table', () => {
    const posMap = new Map()
    expect(bm.isValidBIHPosition(new Vector2D(WALL_XMAX + 0.1, 0), posMap)).toBe(false)
  })

  it('isValidBIHPosition returns false when overlapping a ball', () => {
    const posMap = new Map([[1, new Vector2D(0, 0)]]) // ball 1 at center
    expect(bm.isValidBIHPosition(new Vector2D(0, 0), posMap)).toBe(false)
  })
})
