import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { SceneManager } from '../scene/SceneManager.js'
import { TableMesh } from '../scene/TableMesh.js'
import { createBallMesh } from '../scene/BallMesh.js'
import { AimLine } from '../scene/AimLine.js'
import { CueMesh } from '../scene/CueMesh.js'
import { PhysicsEngine } from '../physics/PhysicsEngine.js'
import { GameState, State } from './GameState.js'
import { BallManager } from './BallManager.js'
import { RulesEngine } from './RulesEngine.js'
import { BasicRulesEngine } from './BasicRulesEngine.js'
import { generateRackPositions } from './RackSetup.js'
import { generateBasicRackPositions } from './BasicRackSetup.js'
import { AIPlayer } from '../ai/AIPlayer.js'
import { DragShot } from '../input/DragShot.js'
import { BallInHand } from '../input/BallInHand.js'
import { InputHandler } from '../input/InputHandler.js'
import { HUD } from '../ui/HUD.js'
import { FoulNotification } from '../ui/FoulNotification.js'
import { GameOverScreen } from '../ui/GameOverScreen.js'
import { TurnNotification } from '../ui/TurnNotification.js'
import {
  physicsToThree,
  BALL_RADIUS,
  REST_THRESH,
  MAX_SPEED,
  MAX_DRAG_PIXELS,
  WALL_XMIN,
  WALL_XMAX,
  WALL_ZMIN,
  WALL_ZMAX,
} from '../constants.js'
import { SoundManager } from '../audio/SoundManager.js'

// Reusable temps for ball-roll animation
const _rollAxis = new THREE.Vector3()
const _rollQuat = new THREE.Quaternion()

export class Game {
  constructor(container) {
    this._container = container
    this._prevTime = null
    this._settledHandled = false
    this._foulTimeoutId = null

    // Game mode
    this._mode = 'nine-ball' // 'nine-ball' | 'basic'
    this._playerScore = 0
    this._aiScore = 0

    // Camera pan state
    this._isSpaceHeld = false
    this._panDragActive = false
    this._panDragLastX = 0
    this._panDragLastY = 0
    this._arrowKeysHeld = { left: false, right: false, up: false, down: false }

    // Core systems
    this.sceneManager = new SceneManager()
    this.physicsEngine = new PhysicsEngine()
    this.gameState = new GameState()
    this.ballManager = new BallManager()
    this._nineBallRulesEngine = new RulesEngine()
    this._basicRulesEngine = new BasicRulesEngine()
    this._rulesEngine = this._nineBallRulesEngine
    this.aiPlayer = new AIPlayer()

    // Input
    this.dragShot = new DragShot()
    this.ballInHand = new BallInHand()

    // UI
    this.hud = new HUD()
    this.foulNotification = new FoulNotification()
    this.gameOverScreen = new GameOverScreen()
    this.turnNotification = new TurnNotification()
    this._soundManager = new SoundManager()
    this._lastNotifiedTurn = null

    // Ball meshes map: id → THREE.Mesh
    this._ballMeshes = new Map()
    this._aimLine = null
    this._cueMesh = null
    this._orbitControls = null

    // Camera / aim state
    this._aimAngle = Math.PI / 2
    this._isAimMode = false

    // Power meter DOM refs (set in init)
    this._shotHintEl = null
    this._aimHintEl = null
    this._powerMeterEl = null
    this._powerFillEl = null
  }

  init() {
    this.sceneManager.init(this._container)

    // OrbitControls for overview camera (right-click drag to rotate)
    this._orbitControls = new OrbitControls(
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement,
    )
    this._orbitControls.target.set(0, 0, 0)
    this._orbitControls.enablePan = false
    this._orbitControls.minDistance = 0.6
    this._orbitControls.maxDistance = 4.5
    this._orbitControls.maxPolarAngle = Math.PI / 2 - 0.04
    this._orbitControls.mouseButtons = {
      LEFT: null,           // left-click handled by game logic
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    }
    this._orbitControls.enabled = false

    // Table
    const table = new TableMesh()
    table.addToScene(this.sceneManager.scene)

    // Aim line + ghost ball
    this._aimLine = new AimLine()
    this._aimLine.addToScene(this.sceneManager.scene)

    // Cue stick
    this._cueMesh = new CueMesh()
    this._cueMesh.addToScene(this.sceneManager.scene)

    // UI
    this.hud.init()
    this.foulNotification.init()
    this.gameOverScreen.init()
    this.turnNotification.init()
    this.gameOverScreen.onRestart(() => this.startGame())

    // Power meter / hint DOM refs
    this._shotHintEl   = document.getElementById('shot-hint')
    this._aimHintEl    = document.getElementById('aim-hint')
    this._powerMeterEl = document.getElementById('power-meter')
    this._powerFillEl  = document.getElementById('power-fill')

    // Input handler
    const inputHandler = new InputHandler(
      this.sceneManager.renderer,
      this.sceneManager.camera,
      this.gameState,
    )
    inputHandler.setup({
      onShot: (vx, vz) => this._executePlayerShot(vx, vz),
      onBIHPlace: (pos) => this._executeBIH(pos),
      onEnterAimMode: () => this._enterAimMode(),
      onCancelAimMode: () => this._cancelAimMode(),
      getIsAimMode: () => this._isAimMode,
      getIsSpaceHeld: () => this._isSpaceHeld,
      onAimUpdate: (angle, dragDist = 0) => {
        if (!this._aimLine) return
        this._aimAngle = angle
        const cueBall = this._getCueBallPhys()
        if (cueBall) {
          this._aimLine.update(
            cueBall.pos,
            angle,
            this.physicsEngine.balls.filter(b => b.isActive),
          )
          this._aimLine.setVisible(true)
          const pullback = Math.min(dragDist / MAX_DRAG_PIXELS * 0.22, 0.22)
          this._cueMesh?.update(cueBall.pos, angle, pullback)
          const power = Math.min(dragDist / MAX_DRAG_PIXELS, 1)
          this._aimLine.setPower(power)
          if (this._powerFillEl) this._powerFillEl.style.width = `${Math.round(power * 100)}%`
        }
      },
      getBallManager: () => this.ballManager,
      getActivePosMap: () => this._buildActivePosMap(),
      getCueBallPos: () => this._getCueBallPhys()?.pos,
      dragShot: this.dragShot,
      ballInHand: this.ballInHand,
    })

    this.gameState.onStateChange((prev, next) => this._onStateChange(prev, next))

    // Sound callbacks
    this.physicsEngine.onBallCollision = (s) => this._soundManager.playBallHit(s)
    this.physicsEngine.onWallCollision = (s) => this._soundManager.playCushion(s)
    this.physicsEngine.onPocket        = ()  => this._soundManager.playPocket()

    // Sound toggle button
    const soundBtn = document.getElementById('sound-btn')
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const on = this._soundManager.toggle()
        soundBtn.textContent = on ? '🔊' : '🔇'
      })
    }

    // Camera pan: Space + drag or Space + arrow keys
    const canvas = this.sceneManager.renderer.domElement
    const ARROW_CODES = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        this._isSpaceHeld = true
        canvas.style.cursor = 'grab'
      }
      if (this._isSpaceHeld && ARROW_CODES.includes(e.code)) {
        e.preventDefault()
        if (e.code === 'ArrowLeft')  this._arrowKeysHeld.left  = true
        if (e.code === 'ArrowRight') this._arrowKeysHeld.right = true
        if (e.code === 'ArrowUp')    this._arrowKeysHeld.up    = true
        if (e.code === 'ArrowDown')  this._arrowKeysHeld.down  = true
      }
    })
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this._isSpaceHeld = false
        this._panDragActive = false
        canvas.style.cursor = ''
        this._arrowKeysHeld = { left: false, right: false, up: false, down: false }
      }
      if (e.code === 'ArrowLeft')  this._arrowKeysHeld.left  = false
      if (e.code === 'ArrowRight') this._arrowKeysHeld.right = false
      if (e.code === 'ArrowUp')    this._arrowKeysHeld.up    = false
      if (e.code === 'ArrowDown')  this._arrowKeysHeld.down  = false
    })

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this._isSpaceHeld) {
        this._panDragActive = true
        this._panDragLastX = e.clientX
        this._panDragLastY = e.clientY
        canvas.style.cursor = 'grabbing'
      }
    })
    canvas.addEventListener('mousemove', (e) => {
      if (this._panDragActive) {
        this._applyPanDelta(e.clientX - this._panDragLastX, e.clientY - this._panDragLastY)
        this._panDragLastX = e.clientX
        this._panDragLastY = e.clientY
      }
    })
    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0 && this._panDragActive) {
        this._panDragActive = false
        canvas.style.cursor = this._isSpaceHeld ? 'grab' : ''
      }
    })

    this.sceneManager.startLoop((time) => this._tick(time))
    this._setOverheadCamera()
  }

  startGame(mode) {
    if (mode) this._mode = mode
    this._rulesEngine = this._mode === 'basic'
      ? this._basicRulesEngine
      : this._nineBallRulesEngine
    this._playerScore = 0
    this._aiScore = 0
    this._lastNotifiedTurn = null
    this._isSpaceHeld = false
    this._panDragActive = false
    this._arrowKeysHeld = { left: false, right: false, up: false, down: false }

    this._settledHandled = false
    this._isAimMode = false
    this.gameOverScreen.hide()
    this._aimLine?.setVisible(false)
    this._cueMesh?.setVisible(false)
    this._aimAngle = Math.PI / 2
    this.ballInHand.deactivate()
    this._hideShotUI()

    const rackPos = this._mode === 'basic'
      ? generateBasicRackPositions()
      : generateRackPositions()
    this.ballManager.reset(rackPos)
    this.physicsEngine.resetBalls(rackPos)

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

    if (this.gameState.isSimulating()) {
      this.physicsEngine.update(deltaMs)
      this._syncBallMeshes(deltaMs / 1000)

      if (!this._settledHandled && this.physicsEngine.isSettled()) {
        this._settledHandled = true
        this._onSimulationComplete()
      }
    }

    this._applyArrowKeyPan(deltaMs / 1000)
    this._updateCamera()
    this._updateBillboards()
  }

  _syncBallMeshes(dtSec = 0) {
    for (const ball of this.physicsEngine.balls) {
      const group = this._ballMeshes.get(ball.id)
      if (!group) continue
      if (!ball.isActive) { group.visible = false; continue }
      const p = physicsToThree(ball.pos.x, ball.pos.z)
      group.position.set(p.x, p.y, p.z)
      group.visible = true

      // Roll the sphere (children[0]) based on velocity — number label stays horizontal
      if (dtSec > 0) {
        const sphere = group.children[0]
        _rollAxis.set(ball.vel.z, 0, -ball.vel.x)
        const speed = _rollAxis.length()
        if (speed > REST_THRESH) {
          _rollAxis.multiplyScalar(1 / speed)
          _rollQuat.setFromAxisAngle(_rollAxis, (speed * dtSec) / BALL_RADIUS)
          sphere.quaternion.premultiply(_rollQuat)
        }
      }
    }
  }

  _onSimulationComplete() {
    if (this._mode === 'basic') {
      this._onSimulationCompleteBasic()
    } else {
      this._onSimulationCompleteNineBall()
    }
  }

  _onSimulationCompleteNineBall() {
    this._setBallLabelsVisible(true)
    this._aimLine?.setVisible(false)

    const pocketed = this.physicsEngine.getPocketedThisShot()
    const result = this._rulesEngine.evaluateShot(
      this.physicsEngine.collisionLog,
      pocketed,
      this.ballManager,
      this.gameState.currentTurn,
    )

    for (const id of pocketed) {
      if (id !== 0) this.ballManager.pocket(id)
    }
    if (pocketed.includes(0)) {
      const cueBall = this.physicsEngine.balls.find(b => b.id === 0)
      if (cueBall) { cueBall.isActive = false; cueBall.isPocketed = true }
    }

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
      this.gameState.currentTurn = turn === 'player' ? 'ai' : 'player'
      const bihTurn = this.gameState.currentTurn
      this._foulTimeoutId = setTimeout(() => {
        if (bihTurn === 'ai') {
          this._executeAITurn(true)
        } else {
          this.gameState.transition(State.PLAYER_BIH)
          this._restoreCueBall()
          this.ballInHand.activate(this.sceneManager.scene)
        }
      }, 2000)
      return
    }

    if (result.pocketedCount > 0) {
      if (turn === 'player') {
        this._restoreCueBall()
        this.gameState.transition(State.PLAYER_AIMING)
      } else {
        this._executeAITurn(false)
      }
    } else {
      this.gameState.currentTurn = turn === 'player' ? 'ai' : 'player'
      if (this.gameState.currentTurn === 'ai') {
        this._executeAITurn(false)
      } else {
        this._restoreCueBall()
        this.gameState.transition(State.PLAYER_AIMING)
      }
    }
  }

  _onSimulationCompleteBasic() {
    this._setBallLabelsVisible(true)
    this._aimLine?.setVisible(false)

    const pocketed = this.physicsEngine.getPocketedThisShot()
    const result = this._rulesEngine.evaluateShot(
      this.physicsEngine.collisionLog,
      pocketed,
      this.ballManager,
      this.gameState.currentTurn,
    )

    for (const id of pocketed) {
      if (id !== 0) this.ballManager.pocket(id)
    }
    if (pocketed.includes(0)) {
      const cueBall = this.physicsEngine.balls.find(b => b.id === 0)
      if (cueBall) { cueBall.isActive = false; cueBall.isPocketed = true }
    }

    const turn = this.gameState.currentTurn

    if (!result.foul && result.pocketedCount > 0) {
      if (turn === 'player') this._playerScore += result.pocketedCount
      else this._aiScore += result.pocketedCount
    }

    // Check if all numbered balls are cleared
    const remaining = this.ballManager.activeBalls.filter(b => b.id >= 1).length
    if (remaining === 0) {
      const winner = this._playerScore > this._aiScore ? 'player'
                   : this._aiScore > this._playerScore ? 'ai'
                   : 'draw'
      this.gameState.winner = winner === 'draw' ? null : winner
      this.gameState.transition(State.GAME_OVER)
      this.gameOverScreen.showBasic(this._playerScore, this._aiScore, winner)
      return
    }

    if (result.foul) {
      // Respot non-cue balls pocketed during this foul shot
      for (const id of pocketed) {
        if (id !== 0) this._respotBallRandom(id)
      }
      this.foulNotification.show(result.foulType, turn === 'player')
      this.gameState.currentTurn = turn === 'player' ? 'ai' : 'player'
      const bihTurn = this.gameState.currentTurn
      this._foulTimeoutId = setTimeout(() => {
        if (bihTurn === 'ai') {
          this._executeAITurn(true)
        } else {
          this.gameState.transition(State.PLAYER_BIH)
          this._restoreCueBall()
          this.ballInHand.activate(this.sceneManager.scene)
        }
      }, 2000)
      return
    }

    if (result.pocketedCount > 0) {
      if (turn === 'player') {
        this._restoreCueBall()
        this.gameState.transition(State.PLAYER_AIMING)
      } else {
        this._executeAITurn(false)
      }
    } else {
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
    const cueBall = this.physicsEngine.balls.find(b => b.id === 0)
    if (cueBall && cueBall.isPocketed) {
      cueBall.isActive = true
      cueBall.isPocketed = false
      cueBall.vel.x = 0
      cueBall.vel.z = 0
    }
  }

  _executePlayerShot(vx, vz) {
    if (this.gameState.current !== State.PLAYER_AIMING) return
    this._settledHandled = false
    this._aimLine?.setVisible(false)
    this._cueMesh?.setVisible(false)
    this._soundManager.playCueHit(Math.sqrt(vx * vx + vz * vz))
    this.physicsEngine.applyImpulse(0, vx, vz)
    this.gameState.transition(State.SIMULATING)
    this._hideShotUI()
  }

  _executeBIH(pos) {
    const cueBall = this.physicsEngine.balls.find(b => b.id === 0)
    if (cueBall) { cueBall.pos.x = pos.x; cueBall.pos.z = pos.z; cueBall.vel.x = 0; cueBall.vel.z = 0; cueBall.isActive = true; cueBall.isPocketed = false }
    const mesh = this._ballMeshes.get(0)
    if (mesh) { const p = physicsToThree(pos.x, pos.z); mesh.position.set(p.x, p.y, p.z); mesh.visible = true }
    this._cueMesh?.setVisible(false)
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
    if (next === State.PLAYER_AIMING) {
      this._isAimMode = false
      this._aimLine?.setVisible(false)
      this._cueMesh?.setVisible(false)
      // Reset camera to overhead and re-enable orbit
      this._setOverheadCamera()
      this._orbitControls.target.set(0, 0, 0)
      this._orbitControls.update()
      // Show camera hint
      this._hideShotUI()
      if (this._shotHintEl) this._shotHintEl.style.display = 'block'
    }
    if (next === State.SIMULATING || next === State.GAME_OVER || next === State.AI_THINKING) {
      this._hideShotUI()
    }
    if (next === State.SIMULATING) {
      this._setBallLabelsVisible(false)
    }
    if (next === State.PLAYER_AIMING || next === State.PLAYER_BIH || next === State.AI_THINKING) {
      const turn = this.gameState.currentTurn
      if (this._mode === 'basic') {
        this.hud.updateBasic(turn, this._playerScore, this._aiScore)
      } else {
        const targetId = this.ballManager.getTargetBallId()
        this.hud.update(turn, targetId ?? 9)
      }
      if (turn !== this._lastNotifiedTurn) {
        this._lastNotifiedTurn = turn
        this.turnNotification.show(turn)
      }
    }
  }

  // ── Aim mode ────────────────────────────────────────────────────────────────

  _enterAimMode() {
    this._isAimMode = true
    this._orbitControls.enabled = false
    // Show aim line at current angle
    const cueBall = this._getCueBallPhys()
    if (cueBall) {
      this._aimLine.update(cueBall.pos, this._aimAngle, this.physicsEngine.balls.filter(b => b.isActive))
      this._aimLine.setVisible(true)
      this._cueMesh?.update(cueBall.pos, this._aimAngle, 0)
    }
    if (this._shotHintEl) this._shotHintEl.style.display = 'none'
    if (this._aimHintEl) this._aimHintEl.style.display = 'block'
    if (this._powerMeterEl) this._powerMeterEl.style.display = 'block'
    if (this._powerFillEl) this._powerFillEl.style.width = '0%'
    this._aimLine.setPower(0)
  }

  _cancelAimMode() {
    if (!this._isAimMode) return
    this._isAimMode = false
    this.dragShot.cancel()
    this._aimLine?.setVisible(false)
    this._cueMesh?.setVisible(false)
    // カメラ位置はそのまま、オービットだけ再同期
    this._orbitControls.update()
    if (this._aimHintEl) this._aimHintEl.style.display = 'none'
    if (this._powerMeterEl) this._powerMeterEl.style.display = 'none'
    if (this._shotHintEl) this._shotHintEl.style.display = 'block'
  }

  _hideShotUI() {
    if (this._shotHintEl) this._shotHintEl.style.display = 'none'
    if (this._aimHintEl) this._aimHintEl.style.display = 'none'
    if (this._powerMeterEl) this._powerMeterEl.style.display = 'none'
  }

  // ── Camera control ──────────────────────────────────────────────────────────

  _updateCamera() {
    if (this.gameState.isSimulating()) {
      this._orbitControls.enabled = true
      this._orbitControls.update()
      return
    }

    if (this.gameState.current === State.PLAYER_AIMING && !this._isAimMode) {
      this._orbitControls.enabled = true
      this._orbitControls.update()
      return
    }

    this._orbitControls.enabled = false

    if (this.gameState.current === State.PLAYER_AIMING && this._isAimMode) {
      return // カメラはオービット位置のまま維持
    }
    this._setOverheadCamera()
  }

  _setAimCamera(cueBallPos, angle) {
    const DIST = 0.9
    const HEIGHT = 0.20
    const LOOK = 0.85
    const cam = this.sceneManager.camera
    cam.position.set(
      cueBallPos.x - Math.cos(angle) * DIST,
      HEIGHT,
      cueBallPos.z - Math.sin(angle) * DIST,
    )
    cam.lookAt(
      cueBallPos.x + Math.cos(angle) * LOOK,
      0,
      cueBallPos.z + Math.sin(angle) * LOOK,
    )
  }

  _setOverheadCamera() {
    const cam = this.sceneManager.camera
    cam.position.set(0, 2.0, 0.5)
    cam.lookAt(0, 0, 0)
  }

  _applyArrowKeyPan(dtSec) {
    if (!this._isSpaceHeld) return
    const { left, right, up, down } = this._arrowKeysHeld
    if (!left && !right && !up && !down) return
    const PAN_SPEED = 1.5 // m/s
    const dx = ((right ? 1 : 0) - (left ? 1 : 0)) * PAN_SPEED * dtSec
    const dz = ((down  ? 1 : 0) - (up   ? 1 : 0)) * PAN_SPEED * dtSec
    const cam = this.sceneManager.camera
    cam.position.x += dx
    cam.position.z += dz
    this._orbitControls.target.x += dx
    this._orbitControls.target.z += dz
    this._orbitControls.update()
  }

  _applyPanDelta(dxPx, dyPx) {
    const cam = this.sceneManager.camera
    const target = this._orbitControls.target
    const dist = cam.position.distanceTo(target)
    const worldPerPx = (2 * Math.tan((cam.fov * Math.PI / 180) / 2) * dist) / window.innerHeight

    // Camera right and forward projected onto the XZ ground plane
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrix, 0)
    const forward = new THREE.Vector3().setFromMatrixColumn(cam.matrix, 1)
    right.y = 0; right.normalize()
    forward.y = 0; forward.normalize()

    const delta = new THREE.Vector3()
      .addScaledVector(right, -dxPx * worldPerPx)
      .addScaledVector(forward, -dyPx * worldPerPx)

    cam.position.add(delta)
    target.add(delta)
    this._orbitControls.update()
  }

  // ── Ball billboard ───────────────────────────────────────────────────────────

  _updateBillboards() {
    // Number labels are horizontal planes on top of each ball — no per-frame update needed
  }

  _setBallLabelsVisible(visible) {
    for (const group of this._ballMeshes.values()) {
      const label = group.children[1]
      if (label) label.visible = visible
    }
  }

  _respotBallRandom(ballId) {
    // Build map of active balls before re-activating this one (excludes itself)
    const activePosMap = this._buildActivePosMap()

    // Find a random non-overlapping position within table bounds
    let pos = { x: 0, z: 0 }
    for (let attempt = 0; attempt < 100; attempt++) {
      const x = WALL_XMIN + Math.random() * (WALL_XMAX - WALL_XMIN)
      const z = WALL_ZMIN + Math.random() * (WALL_ZMAX - WALL_ZMIN)
      let overlap = false
      for (const p of activePosMap.values()) {
        const dx = p.x - x
        const dz = p.z - z
        if (dx * dx + dz * dz < (2.4 * BALL_RADIUS) ** 2) { overlap = true; break }
      }
      if (!overlap) { pos = { x, z }; break }
    }

    const bm = this.ballManager.balls.find(b => b.id === ballId)
    if (bm) { bm.isActive = true; bm.isPocketed = false }

    const physBall = this.physicsEngine.balls.find(b => b.id === ballId)
    if (physBall) {
      physBall.pos.x = pos.x; physBall.pos.z = pos.z
      physBall.vel.x = 0; physBall.vel.z = 0
      physBall.isActive = true; physBall.isPocketed = false
    }

    const mesh = this._ballMeshes.get(ballId)
    if (mesh) {
      const p = physicsToThree(pos.x, pos.z)
      mesh.position.set(p.x, p.y, p.z)
      mesh.visible = true
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
