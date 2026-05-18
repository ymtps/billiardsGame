import { describe, it, expect, beforeEach } from 'vitest'
import { BallInHand } from './BallInHand.js'
import { BallManager } from '../game/BallManager.js'
import { Vector2D } from '../utils/Vector2D.js'
import { WALL_XMAX, BALL_RADIUS } from '../constants.js'

describe('BallInHand', () => {
  let bih, bm

  beforeEach(() => {
    bih = new BallInHand()
    bm = new BallManager()
    bm.reset(Array.from({ length: 10 }, (_, i) => ({ id: i, x: i * 0.2, z: 0 })))
  })

  it('confirm returns position when placement is valid', () => {
    const posMap = new Map() // no obstacles
    const pos = new Vector2D(0, 0)
    const result = bih.confirm(pos, posMap, bm)
    expect(result).not.toBeNull()
    expect(result.x).toBe(0)
  })

  it('confirm returns null when overlapping another ball', () => {
    // Ball 1 at (0.2, 0), place cue at same spot
    const posMap = new Map([[1, new Vector2D(0.2, 0)]])
    const result = bih.confirm(new Vector2D(0.2, 0), posMap, bm)
    expect(result).toBeNull()
  })

  it('confirm returns null when outside table boundary', () => {
    const posMap = new Map()
    const result = bih.confirm(new Vector2D(WALL_XMAX + 0.1, 0), posMap, bm)
    expect(result).toBeNull()
  })

  it('confirm returns null when tablePos is null', () => {
    const posMap = new Map()
    const result = bih.confirm(null, posMap, bm)
    expect(result).toBeNull()
  })
})
