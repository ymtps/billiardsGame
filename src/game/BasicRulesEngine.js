export class BasicRulesEngine {
  evaluateShot(collisionLog, pocketedThisShot, ballManager, currentTurn) {
    const cueBallWasPocketed = pocketedThisShot.includes(0)
    const firstContact = collisionLog.getFirstContact()

    if (cueBallWasPocketed) {
      return { foul: true, foulType: 'SCRATCH', winner: null, pocketedCount: 0 }
    }
    if (firstContact === null) {
      return { foul: true, foulType: 'NO_CONTACT', winner: null, pocketedCount: 0 }
    }

    const pocketedCount = pocketedThisShot.filter(id => id !== 0).length
    return { foul: false, foulType: null, winner: null, pocketedCount }
  }

  isValidBIHPosition(pos, activePosMap, ballManager) {
    return ballManager.isValidBIHPosition(pos, activePosMap)
  }
}
