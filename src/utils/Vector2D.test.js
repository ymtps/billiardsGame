import { describe, it, expect } from 'vitest'
import { Vector2D } from './Vector2D.js'

describe('Vector2D', () => {
  it('add returns sum of two vectors', () => {
    const result = new Vector2D(1, 2).add(new Vector2D(3, 4))
    expect(result.x).toBe(4)
    expect(result.z).toBe(6)
  })

  it('sub returns difference', () => {
    const result = new Vector2D(5, 3).sub(new Vector2D(2, 1))
    expect(result.x).toBe(3)
    expect(result.z).toBe(2)
  })

  it('scale multiplies by scalar', () => {
    const result = new Vector2D(2, 3).scale(2)
    expect(result.x).toBe(4)
    expect(result.z).toBe(6)
  })

  it('dot product is correct', () => {
    const result = new Vector2D(1, 2).dot(new Vector2D(3, 4))
    expect(result).toBe(11) // 1*3 + 2*4
  })

  it('length of (3, 4) is 5', () => {
    expect(new Vector2D(3, 4).length()).toBeCloseTo(5, 5)
  })

  it('normalize produces unit vector', () => {
    const n = new Vector2D(3, 4).normalize()
    expect(n.length()).toBeCloseTo(1.0, 5)
  })

  it('normalize of zero vector returns zero (no NaN)', () => {
    const n = new Vector2D(0, 0).normalize()
    expect(n.x).toBe(0)
    expect(n.z).toBe(0)
  })

  it('distanceTo is symmetric', () => {
    const a = new Vector2D(0, 0)
    const b = new Vector2D(3, 4)
    expect(a.distanceTo(b)).toBeCloseTo(5, 5)
    expect(b.distanceTo(a)).toBeCloseTo(5, 5)
  })

  it('clone creates independent copy', () => {
    const a = new Vector2D(1, 2)
    const b = a.clone()
    b.x = 99
    expect(a.x).toBe(1) // original unchanged
  })
})
