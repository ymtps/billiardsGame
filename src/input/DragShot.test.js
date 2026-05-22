import { describe, it, expect } from 'vitest'
import { DragShot } from './DragShot.js'
import { Vector2D } from '../utils/Vector2D.js'
import {
  MIN_DRAG_PIXELS,
  MAX_DRAG_PIXELS,
  MAX_SPEED,
  PLAYER_SHOT_POWER_SCALE,
} from '../constants.js'

describe('DragShot', () => {
  it('endDrag returns null when pixel drag is less than MIN_DRAG_PIXELS', () => {
    const ds = new DragShot()
    const cueBall = new Vector2D(0, 0)
    ds.startDrag(new Vector2D(0, 0), cueBall, 0, 0)
    // tiny pixel drag — below threshold
    const result = ds.endDrag(new Vector2D(-0.5, 0), MIN_DRAG_PIXELS * 0.5, 0)
    expect(result).toBeNull()
  })

  it('endDrag returns velocity when pixel drag exceeds MIN_DRAG_PIXELS', () => {
    const ds = new DragShot()
    const cueBall = new Vector2D(0, 0)
    ds.startDrag(new Vector2D(0, 0), cueBall, 0, 0)
    // drag left in world space, sufficient pixel distance
    const result = ds.endDrag(new Vector2D(-0.5, 0), MIN_DRAG_PIXELS * 2, 0)
    expect(result).not.toBeNull()
    expect(result.vx).toBeGreaterThan(0) // shooting right
    expect(result.vz).toBeCloseTo(0, 3)
  })

  it('drag direction is reversed: pull back to shoot forward', () => {
    const ds = new DragShot()
    const cueBall = new Vector2D(0, 0)
    ds.startDrag(new Vector2D(0, 0), cueBall, 0, 0)
    // drag downward in world space (positive z) → cue ball shoots upward (negative z)
    const result = ds.endDrag(new Vector2D(0, 0.3), 0, MIN_DRAG_PIXELS * 2)
    expect(result.vz).toBeLessThan(0)
  })

  it('speed is capped at the player shot speed', () => {
    const ds = new DragShot()
    const cueBall = new Vector2D(0, 0)
    ds.startDrag(new Vector2D(0, 0), cueBall, 0, 0)
    // very long pixel drag
    const result = ds.endDrag(new Vector2D(-100, 0), MAX_DRAG_PIXELS * 10, 0)
    const speed = Math.sqrt(result.vx ** 2 + result.vz ** 2)
    expect(speed).toBeCloseTo(MAX_SPEED * PLAYER_SHOT_POWER_SCALE, 3)
  })

  it('cancel stops dragging', () => {
    const ds = new DragShot()
    const cueBall = new Vector2D(0, 0)
    ds.startDrag(new Vector2D(0, 0), cueBall, 0, 0)
    ds.cancel()
    const result = ds.endDrag(new Vector2D(-0.5, 0), MIN_DRAG_PIXELS * 2, 0)
    expect(result).toBeNull()
  })

  it('updateDrag returns { angle, dist } in pixels when dragging', () => {
    const ds = new DragShot()
    const cueBall = new Vector2D(0, 0)
    ds.startDrag(new Vector2D(0, 0), cueBall, 0, 0)
    const result = ds.updateDrag(new Vector2D(-0.3, 0), 30, 0)
    // drag left → atan2(0, 0.3) = 0 (rightward angle)
    expect(result.angle).toBeCloseTo(0, 1)
    expect(result.dist).toBeCloseTo(30, 3)
  })
})
