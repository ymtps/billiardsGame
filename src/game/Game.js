import * as THREE from 'three'
import { SceneManager } from '../scene/SceneManager.js'
import { TableMesh } from '../scene/TableMesh.js'
import { createBallMesh } from '../scene/BallMesh.js'
import { AimLine } from '../scene/AimLine.js'
import { PhysicsEngine } from '../physics/PhysicsEngine.js'
import { GameState, State } from './GameState.js'
import { BallManager } from './BallManager.js'
import { RulesEngine } from './RulesEngine.js'
import { generateRackPositions } from './RackSetup.js'
import { AIPlayer } from '../ai/AIPlayer.js'
import { DragShot } from '../input/DragShot.js'
import { BallInHand } from '../input/BallInHand.js'
import { InputHandler } from '../input/InputHandler.js'
import { HUD } from '../ui/HUD.js'
import { FoulNotification } from '../ui/FoulNotification.js'
import { GameOverScreen } from '../ui/GameOverScreen.js'
import { physicsToThree } from '../constants.js'

export class Game {
  constructor(container) {
    this._container = container
    this._prevTime = null
    this._settledHandled = false
    this._foulTimeoutId = null

    // Core systems
    this.sceneManager = new SceneManager()
    this.physicsEngine = new PhysicsEngine()
    this.gameState = new GameState()
    this.ballManager = new BallManager()
    this.rulesEngine = new RulesEngine()
    this.aiPlayer = new AIPlayer()

    // Input
    this.dragShot = new DragShot()
    this.ballInHand = new BallInHand()

    // UI
    this.hud = new HUD()
    this.foulNotification = new FoulNotification()
    this.gameOverScreen = new GameOverScreen()

    // Ball meshes map: id → THREE.Mesh
    this._ballMeshes = new Map()
    this._aimLine = null
  }

  init() {
    this.sceneManager.init(this._container)

    // Table
    const table = new TableMesh()
    table.addToScene(this.sceneManager.scene)

    // Aim line
    this._aimLine = new AimLine()
    this._aimLine.addToScene(this.sceneManager.scene)

    // UI
    this.hud.init()
    this.foulNotification.init()
    this.gameOverScreen.init()
    this.gameOverScreen.onRestart(() => this.startGame())

    // Input handler
    const inputHandler = new InputHandler(
      this.sceneManager.renderer,
      this.sceneManager.camera,
      this.gameState,
    )
    inputHandler.setup({
      onShot: (vx, vz) => this._executePlayerShot(vx, vz),
      onBIHPlace: (pos) => this._executeBIH(pos),
      onAimUpdate: (angle) => {
        if (!this._aimLine) return
        const cueBall = this._getCueBallPhys()
        if (cueBall) {
          this._aimLine.update(
            cueBall.pos,
            angle,
            this.physicsEngine.balls.filter(b => b.isActive),
          )
          this._aimLine.setVisible(true)
        }
      },
      getBallManager: () => this.ballManager,
      getActivePosMap: () => this._buildActivePosMap(),
      getCueBallPos: () => this._getCueBallPhys()?.pos,
      dragShot: this.dragShot,
      ballInHand: this.ballInHand,
    })

    // Listen to state changes for HUD updates
    this.gameState.onStateChange((prev, next) => this._onStateChange(prev, next))

    // Start render loop
    this.sceneManager.startLoop((time) => this._tick(time))
  }

  startGame() {
    this._settledHandled = false
    this.gameOverScreen.hide()
    this._aimLine?.setVisible(false)
    this.ballInHand.deactivate()

    // Generate rack
    const rackPos = generateRackPositions()
    this.ballManager.reset(rackPos)
    this.physicsEngine.resetBalls(rackPos)

    // Create / recreate ball meshes
    this._ballMeshes.forEach(m => this.sceneManager.remove(m))
    this._ballMeshes.clear()
    for (const b of this.physicsEngine.balls) {
      const mesh = createBallMesh(b.id)
      const p = physicsToThree(b.pos.x, b.pos.z)
      mesh.position.set(p.x, p.y, p.z)
      this.sceneManager.add(mesh)
      this._ballMeshes.set(b.id, mesh)
    }

    this.gameState.currentTurn = 'player'
    this.gameState.winner = null
    this.gameState.transition(State.PLAYER_AIMING)
  }

  _tick(nowMs) {
    if (this._prevTime === null) { this._prevTime = nowMs; return }
    const deltaMs = Math.min(nowMs - this._prevTime, 250)
    this._prevTime = nowMs

    // Physics update
    if (this.gameState.isSimulating()) {
      this.physicsEngine.update(deltaMs)
      this._syncBallMeshes()

      if (!this._settledHandled && this.physicsEngine.isSettled()) {
        this._settledHandled = true
        this._onSimulationComplete()
      }
    }
  }

  _syncBallMeshes() {
    for (const ball of this.physicsEngine.balls) {
      const mesh = this._ballMeshes.get(ball.id)
      if (!mesh) continue
      if (!ball.isActive) { mesh.visible = false; continue }
      const p = physicsToThree(ball.pos.x, ball.pos.z)
      mesh.position.set(p.x, p.y, p.z)
      mesh.visible = true
    }
  }

  _onSimulationComplete() {
    this._aimLine?.setVisible(false)

    const pocketed = this.physicsEngine.getPocketedThisShot()
    const result = this.rulesEngine.evaluateShot(
      this.physicsEngine.collisionLog,
      pocketed,
      this.ballManager,
      this.gameState.currentTurn,
    )

    // Sync pocketed state to BallManager
    for (const id of pocketed) {
      if (id !== 0) this.ballManager.pocket(id)
    }
    // Sync cue ball
    if (pocketed.includes(0)) {
      const cueBall = this.physicsEngine.balls.find(b => b.id === 0)
      if (cueBall) { cueBall.isActive = false; cueBall.isPocketed = true }
    }

    // Respot 9-ball if needed
    if (result.respotNine) {
      const posMap = this._buildActivePosMap()
      const newPos = this.ballManager.respotNineBall(posMap)
      if (newPos) {
        const nine = this.physicsEngine.balls.find(b => b.id === 9)
        if (nine) { nine.pos.x = newPos.x; nine.pos.z = newPos.z; nine.vel.x = 0; nine.vel.z = 0; nine.isActive = true; nine.isPocketed = false }
        const mesh = this._ballMeshes.get(9)
        if (mesh) { const p = physicsToThree(newPos.x, newPos.z); mesh.position.set(p.x, p.y, p.z); mesh.visible = true }
      }
    }

    if (result.winner) {
      this.gameState.winner = result.winner
      this.gameState.transition(State.GAME_OVER)
      this.gameOverScreen.show(result.winner)
      return
    }

    const wasFoul = result.foul
    const turn = this.gameState.currentTurn

    if (wasFoul) {
      this.foulNotification.show(result.foulType, turn === 'player')
      // After foul: other side gets BIH
      this._foulTimeoutId = setTimeout(() => {
        if (turn === 'player') {
          // AI gets BIH → AI thinks with BIH
          this._executeAITurn(true)
        } else {
          // Player gets BIH
          this.gameState.transition(State.PLAYER_BIH)
          this._restoreCueBall()
          this.ballInHand.activate(this.sceneManager.scene)
        }
      }, 2000)
      return
    }

    // No foul
    if (result.pocketedCount > 0) {
      // Continuing turn
      if (turn === 'player') {
        this._restoreCueBall()
        this.gameState.transition(State.PLAYER_AIMING)
      } else {
        this._executeAITurn(false)
      }
    } else {
      // Switch turns
      this.gameState.currentTurn = turn === 'player' ? 'ai' : 'player'
      if (this.gameState.currentTurn === 'ai') {
        this._executeAITurn(false)
      } else {
        this._restoreCueBall()
        this.gameState.transition(State.PLAYER_AIMING)
      }
    }
  }

  _restoreCueBall() {
    // Ensure cue ball is active (after scratch, it starts hidden)
    const cueBall = this.physicsEngine.balls.find(b => b.id === 0)
    if (cueBall && cueBall.isPocketed) {
      cueBall.isActive = true
      cueBall.isPocketed = false
      cueBall.vel.x = 0
      cueBall.vel.z = 0
      // Already handled by BIH or AI placement
    }
  }

  _executePlayerShot(vx, vz) {
    if (this.gameState.current !== State.PLAYER_AIMING) return
    this._settledHandled = false
    this._aimLine?.setVisible(false)
    this.physicsEngine.applyImpulse(0, vx, vz)
    this.gameState.transition(State.SIMULATING)
  }

  _executeBIH(pos) {
    // Player places cue ball, then transition to aiming
    const cueBall = this.physicsEngine.balls.find(b => b.id === 0)
    if (cueBall) { cueBall.pos.x = pos.x; cueBall.pos.z = pos.z; cueBall.vel.x = 0; cueBall.vel.z = 0; cueBall.isActive = true; cueBall.isPocketed = false }
    const mesh = this._ballMeshes.get(0)
    if (mesh) { const p = physicsToThree(pos.x, pos.z); mesh.position.set(p.x, p.y, p.z); mesh.visible = true }
    this.ballInHand.deactivate()
    this.gameState.transition(State.PLAYER_AIMING)
  }

  _executeAITurn(needsBIH) {
    this.aiPlayer.takeTurn({
      gameState: this.gameState,
      physicsEngine: this.physicsEngine,
      ballManager: this.ballManager,
      activePosMap: this._buildActivePosMap(),
      needsBIH,
      onShot: (vx, vz) => {
        this._settledHandled = false
        this._syncBallMeshes()
        this.physicsEngine.applyImpulse(0, vx, vz)
        this.gameState.transition(State.SIMULATING)
      },
    })
  }

  _onStateChange(prev, next) {
    if (next === State.PLAYER_AIMING || next === State.PLAYER_BIH || next === State.AI_THINKING) {
      const targetId = this.ballManager.getTargetBallId()
      this.hud.update(this.gameState.currentTurn, targetId ?? 9)
    }
  }

  _buildActivePosMap() {
    const map = new Map()
    for (const b of this.physicsEngine.balls) {
      if (b.isActive) map.set(b.id, b.pos)
    }
    return map
  }

  _getCueBallPhys() {
    return this.physicsEngine.balls.find(b => b.id === 0 && b.isActive) ?? null
  }
}
