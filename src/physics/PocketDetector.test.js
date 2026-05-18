import { describe, it, expect } from 'vitest'
import { checkPocket } from './PocketDetector.js'
import { Vector2D } from '../utils/Vector2D.js'
import { POCKET_RADIUS, POCKET_POSITIONS } from '../constants.js'

function makeBall(x, z) {
  return { id: 1, pos: new Vector2D(x, z), isActive: true }
}

describe('PocketDetector', () => {
  it('detects pocket when ball center is within POCKET_RADIUS', () => {
    const pocket = POCKET_POSITIONS[0] // top-left corner
    const ball = makeBall(pocket.x, pocket.z)
    const result = checkPocket(ball)
    expect(result).not.toBeNull()
    expect(result.pocketed).toBe(true)
    expect(result.pocketId).toBe(0)
  })

  it('returns null when ball is outside all pockets', () => {
    const ball = makeBall(0, 0) // table center
    expect(checkPocket(ball)).toBeNull()
  })

  it('returns null when ball is just outside pocket radius', () => {
    const pocket = POCKET_POSITIONS[0]
    const ball = makeBall(pocket.x + POCKET_RADIUS + 0.001, pocket.z)
    expect(checkPocket(ball)).toBeNull()
  })

  it('detects side pocket', () => {
    const sidePocket = POCKET_POSITIONS[1] // top side
    const ball = makeBall(sidePocket.x, sidePocket.z)
    const result = checkPocket(ball)
    expect(result).not.toBeNull()
    expect(result.pocketId).toBe(1)
  })
})
