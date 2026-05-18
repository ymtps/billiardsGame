import { describe, it, expect } from 'vitest'
import { CollisionLog } from './CollisionLog.js'

describe('CollisionLog', () => {
  it('getFirstContact returns null initially', () => {
    const log = new CollisionLog()
    expect(log.getFirstContact()).toBeNull()
  })

  it('records first contact and returns its id', () => {
    const log = new CollisionLog()
    log.start()
    log.record(3)
    expect(log.getFirstContact()).toBe(3)
  })

  it('ignores duplicate ballId in same shot', () => {
    const log = new CollisionLog()
    log.start()
    log.record(2)
    log.record(2) // duplicate
    log.record(5)
    expect(log.getFirstContact()).toBe(2) // first is still 2
  })

  it('start() clears previous shot data', () => {
    const log = new CollisionLog()
    log.start()
    log.record(1)
    log.start()
    expect(log.getFirstContact()).toBeNull()
  })

  it('two different balls in one shot: first processed is returned', () => {
    const log = new CollisionLog()
    log.start()
    log.record(4) // lower id first
    log.record(7)
    expect(log.getFirstContact()).toBe(4)
  })
})
