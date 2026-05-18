import { describe, it, expect } from 'vitest'
import { DragShot } from './DragShot.js'
import { Vector2D } from '../utils/Vector2D.js'
import { MIN_DRAG_DISTANCE, MAX_SPEED } from '../constants.js'

describe('DragShot', () => {
  it('endDrag returns null when drag distance is less than MIN_DRAG_DISTANCE', () => {
    const ds = new DragShot()
    const cueBall = new Vector2D(0, 0)
    ds.startDrag(new Vector2D(0, 0), cueBall)
    // tiny drag — below threshold
    const result = ds.endDrag(new Vector2D(MIN_DRAG_DISTANCE * 0.5, 0))
    expect(result).toBeNull()
  })

  it('endDrag returns velocity when drag exceeds MIN_DRAG_DISTANCE', () => {
    const ds = new DragShot()
    const cueBall = new Vector2D(0, 0)
    ds.startDrag(new Vector2D(0, 0), cueBall)
    // drag left (cue ball shoots right)
    const result = ds.endDrag(new Vector2D(-0.5, 0))
    expect(result).not.toBeNull()
    expect(result.vx).toBeGreaterThan(0) // shooting right
    expect(result.vz).toBeCloseTo(0, 3)
  })

  it('drag direction is reversed: pull back to shoot forward', () => {
    const ds = new DragShot()
    const cueBall = new Vector2D(0, 0)
    ds.startDrag(new Vector2D(0, 0), cueBall)
    // drag downward (positive z) → cue ball shoots upward (negative z)
    const result = ds.endDrag(new Vector2D(0, 0.3))
    expect(result.vz).toBeLessThan(0)
  })

  it('speed is capped at MAX_SPEED', () => {
    const ds = new DragShot()
    const cueBall = new Vector2D(0, 0)
    ds.startDrag(new Vector2D(0, 0), cueBall)
    // very long drag
    const result = ds.endDrag(new Vector2D(-100, 0))
    const speed = Math.sqrt(result.vx ** 2 + result.vz ** 2)
    expect(speed).toBeCloseTo(MAX_SPEED, 3)
  })

  it('cancel stops dragging', () => {
    const ds = new DragShot()
    const cueBall = new Vector2D(0, 0)
    ds.startDrag(new Vector2D(0, 0), cueBall)
    ds.cancel()
    const result = ds.endDrag(new Vector2D(-0.5, 0))
    expect(result).toBeNull()
  })

  it('updateDrag returns angle when dragging', () => {
    const ds = new DragShot()
    const cueBall = new Vector2D(0, 0)
    ds.startDrag(new Vector2D(0, 0), cueBall)
    const angle = ds.updateDrag(new Vector2D(-0.3, 0))
    // drag left → atan2(0, 0.3) = 0 (rightward angle)
    expect(angle).toBeCloseTo(0, 1)
  })
})
