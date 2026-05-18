import { ShotCalculator } from './ShotCalculator.js'
import { State } from '../game/GameState.js'

/**
 * AI player controller.
 * Computes shot, waits for a short "thinking" delay, then fires.
 */
export class AIPlayer {
  constructor() {
    this._calculator = new ShotCalculator()
    this._thinkTimer = null
  }

  /**
   * Execute AI turn.
   *
   * @param {object} params
   *   - gameState: GameState
   *   - physicsEngine: PhysicsEngine
   *   - ballManager: BallManager
   *   - activePosMap: Map<id, Vector2D>
   *   - onShot: (vx, vz) => void
   *   - onBIHReady: () => void — called when AI needs to execute BIH
   *   - needsBIH: boolean
   */
  takeTurn({ gameState, physicsEngine, ballManager, activePosMap, onShot, needsBIH }) {
    gameState.transition(State.AI_THINKING)

    // Clear any pending timer
    if (this._thinkTimer) clearTimeout(this._thinkTimer)

    const delay = 600 + Math.random() * 400 // 0.6–1.0s

    this._thinkTimer = setTimeout(() => {
      // BIH: place cue ball at best computed position
      if (needsBIH) {
        const targetId = ballManager.getTargetBallId()
        const activeBalls = physicsEngine.balls.filter(b => b.isActive)
        const targetBall = activeBalls.find(b => b.id === targetId)
        if (targetBall) {
          const bestPos = this._calculator.findBestCueBallPosition(
            { id: targetId, pos: targetBall.pos },
            activeBalls,
            ballManager,
            activePosMap,
          )
          // Apply BIH: update cue ball position in physics engine
          const cueBall = physicsEngine.balls.find(b => b.id === 0)
          if (cueBall) {
            cueBall.pos.x = bestPos.x
            cueBall.pos.z = bestPos.z
            cueBall.vel.x = 0
            cueBall.vel.z = 0
            cueBall.isActive = true
            cueBall.isPocketed = false
          }
        }
      }

      // Find and execute best shot
      const cueBallPhys = physicsEngine.balls.find(b => b.id === 0 && b.isActive)
      if (!cueBallPhys) return

      const targetId = ballManager.getTargetBallId()
      const activeBalls = physicsEngine.balls.filter(b => b.isActive)
      const targetBall = activeBalls.find(b => b.id === targetId)
      if (!targetBall) return

      const shot = this._calculator.findBestShot(cueBallPhys.pos, targetBall, activeBalls)
      const vx = Math.cos(shot.angle) * shot.speed
      const vz = Math.sin(shot.angle) * shot.speed
      onShot(vx, vz)
    }, delay)
  }

  cancelThinking() {
    if (this._thinkTimer) {
      clearTimeout(this._thinkTimer)
      this._thinkTimer = null
    }
  }
}
