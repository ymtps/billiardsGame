import { describe, it, expect, beforeEach } from 'vitest'
import { RulesEngine } from './RulesEngine.js'
import { BallManager } from './BallManager.js'

// Minimal CollisionLog stub
function makeLog(firstContactId) {
  return { getFirstContact: () => firstContactId }
}

describe('RulesEngine.evaluateShot', () => {
  let re, bm

  beforeEach(() => {
    re = new RulesEngine()
    bm = new BallManager()
    // Set up 10 active balls (0=cue, 1-9 numbered)
    bm.reset(
      Array.from({ length: 10 }, (_, i) => ({ id: i, x: i * 0.1, z: 0 }))
    )
  })

  it('valid shot with no pocket returns foul=false, winner=null', () => {
    const log = makeLog(1) // hit ball 1 first (correct)
    const result = re.evaluateShot(log, [], bm, 'player')
    expect(result.foul).toBe(false)
    expect(result.winner).toBeNull()
  })

  it('cue ball pocketed → SCRATCH', () => {
    const log = makeLog(1)
    const result = re.evaluateShot(log, [0], bm, 'player') // cue pocketed
    expect(result.foul).toBe(true)
    expect(result.foulType).toBe('SCRATCH')
  })

  it('no ball contact → NO_CONTACT', () => {
    const log = makeLog(null)
    const result = re.evaluateShot(log, [], bm, 'player')
    expect(result.foul).toBe(true)
    expect(result.foulType).toBe('NO_CONTACT')
  })

  it('wrong ball first → WRONG_BALL', () => {
    const log = makeLog(3) // target is 1, hit 3 first
    const result = re.evaluateShot(log, [], bm, 'player')
    expect(result.foul).toBe(true)
    expect(result.foulType).toBe('WRONG_BALL')
  })

  it('valid shot + 9-ball pocketed → winner', () => {
    // Remove balls 1-8 first so target is 9
    for (let i = 1; i <= 8; i++) bm.pocket(i)
    const log = makeLog(9)
    const result = re.evaluateShot(log, [9], bm, 'player')
    expect(result.foul).toBe(false)
    expect(result.winner).toBe('player')
  })

  it('foul shot + 9-ball pocketed → respotNine=true, no winner (P1 fix)', () => {
    const log = makeLog(null) // no contact (foul)
    const result = re.evaluateShot(log, [9], bm, 'player')
    expect(result.foul).toBe(true)
    expect(result.respotNine).toBe(true)
    expect(result.winner).toBeNull()
  })

  it('SCRATCH + 9-ball pocketed → respotNine=true (P1 fix: cross-cutting)', () => {
    // Cue pocketed AND 9-ball pocketed in same shot
    const log = makeLog(1)
    const result = re.evaluateShot(log, [0, 9], bm, 'player')
    expect(result.foul).toBe(true)
    expect(result.foulType).toBe('SCRATCH')
    expect(result.respotNine).toBe(true) // P1 fix: must be true even on SCRATCH
  })
})
