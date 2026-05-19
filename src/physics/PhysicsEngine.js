import { Vector2D } from '../utils/Vector2D.js'
import { CollisionLog } from './CollisionLog.js'
import { resolveCircleCircle, resolveCircleWall } from './Collision.js'
import { checkPocket } from './PocketDetector.js'
import {
  FIXED_DT, MAX_CATCHUP, SOLVER_ITER,
  DECEL, REST_THRESH, MAX_SPEED,
} from '../constants.js'

/**
 * Fixed-timestep 2D physics engine with accumulator pattern.
 *
 * Ball state: { id, pos: Vector2D, vel: Vector2D, isActive, isPocketed }
 */
export class PhysicsEngine {
  constructor() {
    this.balls = []
    this.collisionLog = new CollisionLog()
    this._accumulator = 0
    this._pocketedThisShot = []
    // Sound callbacks (optional)
    this.onBallCollision = null  // (speed) => void
    this.onWallCollision = null  // (speed) => void
    this.onPocket        = null  // () => void
  }

  /** Apply cue ball impulse. Starts a new shot. */
  applyImpulse(cueBallId, vx, vz) {
    const cueBall = this.balls.find(b => b.id === cueBallId)
    if (!cueBall) return
    this.collisionLog.start()
    this._pocketedThisShot = []
    cueBall.vel.x = vx
    cueBall.vel.z = vz
  }

  /** Returns all balls pocketed since the last applyImpulse(). */
  getPocketedThisShot() {
    return [...this._pocketedThisShot]
  }

  /** True when all active balls are effectively stopped. */
  isSettled() {
    for (const b of this.balls) {
      if (!b.isActive) continue
      if (b.vel.x * b.vel.x + b.vel.z * b.vel.z > REST_THRESH * REST_THRESH) return false
    }
    return true
  }

  /** Drive the physics loop from the render loop delta (ms). */
  update(elapsedMs) {
    let dt = Math.min(elapsedMs / 1000, MAX_CATCHUP)
    this._accumulator += dt
    while (this._accumulator >= FIXED_DT) {
      this._step(FIXED_DT)
      this._accumulator -= FIXED_DT
    }
  }

  _step(dt) {
    const active = this.balls.filter(b => b.isActive)

    // 1. Apply rolling friction + velocity cap
    for (const ball of active) {
      const speed = Math.sqrt(ball.vel.x * ball.vel.x + ball.vel.z * ball.vel.z)
      if (speed < REST_THRESH) {
        ball.vel.x = 0
        ball.vel.z = 0
        continue
      }
      const newSpeed = Math.max(0, speed - DECEL * dt)
      if (newSpeed === 0) {
        ball.vel.x = 0
        ball.vel.z = 0
      } else {
        const scale = newSpeed / speed
        ball.vel.x *= scale
        ball.vel.z *= scale
      }
      // Velocity cap
      const cappedSpeed = Math.min(newSpeed, MAX_SPEED)
      if (cappedSpeed < newSpeed) {
        const scale2 = cappedSpeed / newSpeed
        ball.vel.x *= scale2
        ball.vel.z *= scale2
      }
    }

    // 2. Integrate positions
    for (const ball of active) {
      ball.pos.x += ball.vel.x * dt
      ball.pos.z += ball.vel.z * dt
    }

    // 3. Resolve wall collisions
    for (const ball of active) {
      const wallImpact = resolveCircleWall(ball)
      if (wallImpact > 0.08 && this.onWallCollision) this.onWallCollision(wallImpact)
    }

    // 4. Resolve ball-ball collisions (iterative, ascending id order)
    for (let iter = 0; iter < SOLVER_ITER; iter++) {
      const isFirst = (iter === 0)
      for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
          const [a, b] = active[i].id < active[j].id
            ? [active[i], active[j]]
            : [active[j], active[i]]
          const ballImpact = resolveCircleCircle(a, b, this.collisionLog, isFirst)
          if (ballImpact > 0.05 && this.onBallCollision) this.onBallCollision(ballImpact)
        }
      }
    }

    // 5. Check pockets
    const toRemove = []
    for (const ball of active) {
      const result = checkPocket(ball)
      if (result) {
        ball.isActive = false
        ball.isPocketed = true
        this._pocketedThisShot.push(ball.id)
        toRemove.push(ball.id)
        if (this.onPocket) this.onPocket()
      }
    }
  }

  /** Reset all balls with new positions/velocities. */
  resetBalls(ballData) {
    this.balls = ballData.map(d => ({
      id: d.id,
      pos: new Vector2D(d.x, d.z),
      vel: new Vector2D(0, 0),
      isActive: true,
      isPocketed: false,
    }))
    this.collisionLog.start()
    this._pocketedThisShot = []
  }
}
