import * as THREE from 'three'
import { Vector2D } from '../utils/Vector2D.js'
import { State } from '../game/GameState.js'

/**
 * Captures mouse events and translates them to table-plane coordinates.
 *
 * Flow (PLAYER_AIMING):
 *  - overview mode (!isAimMode): left-click → enter aim mode
 *  - aim mode (isAimMode): left-drag → DragShot, release → shoot
 *  - right-click or Escape in aim mode → cancel back to overview
 */
export class InputHandler {
  constructor(renderer, camera, gameState) {
    this._renderer = renderer
    this._camera = camera
    this._gameState = gameState
    this._raycaster = new THREE.Raycaster()
    this._mouse = new THREE.Vector2()
    this._tablePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    this._intersection = new THREE.Vector3()

    this._onShot = null
    this._onBIHPlace = null
    this._onAimUpdate = null
    this._onEnterAimMode = null
    this._onCancelAimMode = null
    this._getIsAimMode = null
    this._getBallManager = null
    this._getActivePosMap = null
    this._getCueBallPos = null
    this._dragShot = null
    this._ballInHand = null
  }

  setup(opts) {
    this._onShot = opts.onShot
    this._onBIHPlace = opts.onBIHPlace
    this._onAimUpdate = opts.onAimUpdate
    this._onEnterAimMode = opts.onEnterAimMode
    this._onCancelAimMode = opts.onCancelAimMode
    this._getIsAimMode = opts.getIsAimMode
    this._getBallManager = opts.getBallManager
    this._getActivePosMap = opts.getActivePosMap
    this._getCueBallPos = opts.getCueBallPos
    this._dragShot = opts.dragShot
    this._ballInHand = opts.ballInHand

    const canvas = this._renderer.domElement
    canvas.addEventListener('mousedown', e => this._onMouseDown(e))
    canvas.addEventListener('mousemove', e => this._onMouseMove(e))
    canvas.addEventListener('mouseup', e => this._onMouseUp(e))
    canvas.addEventListener('contextmenu', e => e.preventDefault())

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this._gameState.current === State.PLAYER_AIMING) {
        this._onCancelAimMode?.()
      }
    })
  }

  getTablePosition(event) {
    const rect = this._renderer.domElement.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return null
    this._mouse.x =  ((event.clientX - rect.left) / rect.width)  * 2 - 1
    this._mouse.y = -((event.clientY - rect.top)  / rect.height) * 2 + 1
    this._raycaster.setFromCamera(this._mouse, this._camera)
    const hit = this._raycaster.ray.intersectPlane(this._tablePlane, this._intersection)
    if (!hit) return null
    return new Vector2D(this._intersection.x, this._intersection.z)
  }

  _onMouseDown(e) {
    const state = this._gameState.current

    if (state === State.PLAYER_AIMING) {
      if (e.button === 2 && this._getIsAimMode?.()) {
        // Right-click in aim mode → cancel
        this._onCancelAimMode?.()
        return
      }
      if (e.button !== 0) return

      const tablePos = this.getTablePosition(e)
      if (!tablePos) return

      // Enter aim mode if not already in it, then immediately start drag
      if (!this._getIsAimMode?.()) this._onEnterAimMode?.()
      const cueBallPos = this._getCueBallPos?.()
      if (cueBallPos) this._dragShot?.startDrag(tablePos, cueBallPos)
      return
    }
    // PLAYER_BIH clicks are handled on mouseup
  }

  _onMouseMove(e) {
    const state = this._gameState.current
    const tablePos = this.getTablePosition(e)
    if (!tablePos) return

    if (state === State.PLAYER_AIMING && this._getIsAimMode?.() && this._dragShot?.isDragging) {
      const result = this._dragShot.updateDrag(tablePos)
      if (result !== null) this._onAimUpdate?.(result.angle, result.dist)
    }
    if (state === State.PLAYER_BIH) {
      const bm = this._getBallManager?.()
      const posMap = this._getActivePosMap?.()
      if (bm && posMap) this._ballInHand?.moveTo(tablePos, posMap, bm)
    }
  }

  _onMouseUp(e) {
    if (e.button !== 0) return
    const state = this._gameState.current
    const tablePos = this.getTablePosition(e)

    if (state === State.PLAYER_AIMING && this._getIsAimMode?.()) {
      const velocity = this._dragShot?.endDrag(tablePos)
      if (velocity) {
        this._onShot?.(velocity.vx, velocity.vz)
      }
    }
    if (state === State.PLAYER_BIH && tablePos) {
      const bm = this._getBallManager?.()
      const posMap = this._getActivePosMap?.()
      if (bm && posMap) {
        const placed = this._ballInHand?.confirm(tablePos, posMap, bm)
        if (placed) this._onBIHPlace?.(placed)
      }
    }
  }
}
