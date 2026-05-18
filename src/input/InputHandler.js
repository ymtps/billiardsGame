import * as THREE from 'three'
import { Vector2D } from '../utils/Vector2D.js'
import { State } from '../game/GameState.js'

/**
 * Captures mouse events and translates them to table-plane coordinates.
 *
 * Delegates to DragShot (PLAYER_AIMING) or BallInHand (PLAYER_BIH) based on GameState.
 * Null-guards: if mouse is off-canvas, getTablePosition returns null; callers
 * are protected since all delegations check for null tablePos first.
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

    this._onShot = null      // (vx, vz) => void
    this._onBIHPlace = null  // (Vector2D) => void
    this._onAimUpdate = null // (angle) => void
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
    this._getBallManager = opts.getBallManager
    this._getActivePosMap = opts.getActivePosMap
    this._getCueBallPos = opts.getCueBallPos
    this._dragShot = opts.dragShot
    this._ballInHand = opts.ballInHand

    const canvas = this._renderer.domElement
    canvas.addEventListener('mousedown', e => this._onMouseDown(e))
    canvas.addEventListener('mousemove', e => this._onMouseMove(e))
    canvas.addEventListener('mouseup', e => this._onMouseUp(e))
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
    const tablePos = this.getTablePosition(e)
    if (!tablePos) return

    if (state === State.PLAYER_AIMING) {
      const cueBallPos = this._getCueBallPos?.()
      if (cueBallPos) this._dragShot?.startDrag(tablePos, cueBallPos)
    }
    // PLAYER_BIH clicks are handled on mouseup
  }

  _onMouseMove(e) {
    const state = this._gameState.current
    const tablePos = this.getTablePosition(e)
    if (!tablePos) return

    if (state === State.PLAYER_AIMING && this._dragShot?.isDragging) {
      const angle = this._dragShot.updateDrag(tablePos)
      if (angle !== null) this._onAimUpdate?.(angle)
    }
    if (state === State.PLAYER_BIH) {
      const bm = this._getBallManager?.()
      const posMap = this._getActivePosMap?.()
      if (bm && posMap) this._ballInHand?.moveTo(tablePos, posMap, bm)
    }
  }

  _onMouseUp(e) {
    const state = this._gameState.current
    const tablePos = this.getTablePosition(e)

    if (state === State.PLAYER_AIMING) {
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
