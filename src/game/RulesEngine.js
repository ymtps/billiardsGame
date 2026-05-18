/**
 * Evaluates a completed shot for fouls and win conditions.
 *
 * P1 fixes applied:
 * - SCRATCH + 9-ball pocketed: respotNine=true is added as a cross-cutting check
 *   regardless of specific foul type (scope-guardian finding)
 * - evaluateShot returns {foul, foulType, winner, respotNine, pocketedCount}
 */
export class RulesEngine {
  /**
   * @param {CollisionLog} collisionLog
   * @param {number[]} pocketedThisShot - ball ids pocketed during this shot
   * @param {BallManager} ballManager
   * @param {string} currentTurn - 'player' | 'ai'
   * @returns {{ foul: boolean, foulType?: string, winner?: string, respotNine: boolean, pocketedCount: number }}
   */
  evaluateShot(collisionLog, pocketedThisShot, ballManager, currentTurn) {
    const firstContact = collisionLog.getFirstContact()
    const targetBallId = ballManager.getTargetBallId()
    const nineWasPocketed = pocketedThisShot.includes(9)
    const cueBallWasPocketed = pocketedThisShot.includes(0)

    let foul = false
    let foulType = null

    // Priority 1: cue ball pocketed (SCRATCH)
    if (cueBallWasPocketed) {
      foul = true; foulType = 'SCRATCH'
    }
    // Priority 2: no ball contact
    else if (firstContact === null) {
      foul = true; foulType = 'NO_CONTACT'
    }
    // Priority 3: wrong ball first contact
    else if (targetBallId !== null && firstContact !== targetBallId) {
      foul = true; foulType = 'WRONG_BALL'
    }

    // Cross-cutting: any foul + 9-ball pocketed → respot (P1 fix)
    const respotNine = foul && nineWasPocketed

    if (foul) {
      if (nineWasPocketed && !cueBallWasPocketed) foulType = 'FOUL_NINE'
      return { foul: true, foulType, winner: null, respotNine, pocketedCount: 0 }
    }

    // Valid shot: check win condition
    if (nineWasPocketed) {
      return { foul: false, foulType: null, winner: currentTurn, respotNine: false, pocketedCount: pocketedThisShot.length }
    }

    return {
      foul: false, foulType: null, winner: null, respotNine: false,
      pocketedCount: pocketedThisShot.filter(id => id !== 0).length,
    }
  }

  /** Check if a BIH position is valid (delegates to BallManager). */
  isValidBIHPosition(pos, activePosMap, ballManager) {
    return ballManager.isValidBIHPosition(pos, activePosMap)
  }
}
