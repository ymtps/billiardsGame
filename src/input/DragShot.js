import { Vector2D } from '../utils/Vector2D.js'
import {
  MIN_DRAG_PIXELS,
  MAX_DRAG_PIXELS,
  MAX_SPEED,
  PLAYER_SHOT_POWER_SCALE,
} from '../constants.js'

/**
 * Handles drag-and-release shot input.
 * Direction: world-space drag vector (pull back to shoot forward).
 * Power: screen-pixel distance, independent of camera zoom.
 */
export class DragShot {
  constructor() {
    this._dragging = false
    this._dragStart = null
    this._cueBallPos = null
    this._startScreenX = 0
    this._startScreenY = 0
  }

  /**
   * @param {Vector2D} tablePos - mouse position on table plane (world)
   * @param {Vector2D} cueBallPos - cue ball physics position (world)
   * @param {number} screenX - client pixel X
   * @param {number} screenY - client pixel Y
   */
  startDrag(tablePos, cueBallPos, screenX = 0, screenY = 0) {
    if (!tablePos) return false
    this._dragging = true
    this._dragStart = tablePos.clone()
    this._cueBallPos = cueBallPos.clone()
    this._startScreenX = screenX
    this._startScreenY = screenY
    return true
  }

  /**
   * Update aim during drag.
   * @returns {{ angle: number, dist: number } | null} dist in pixels, null if not dragging
   */
  updateDrag(tablePos, screenX = 0, screenY = 0) {
    if (!this._dragging || !tablePos) return null
    const dx = screenX - this._startScreenX
    const dy = screenY - this._startScreenY
    const pixelDist = Math.sqrt(dx * dx + dy * dy)
    if (pixelDist < MIN_DRAG_PIXELS) return null
    const dragVec = this._cueBallPos.sub(tablePos)
    return { angle: Math.atan2(dragVec.z, dragVec.x), dist: pixelDist }
  }

  /**
   * End drag and compute shot velocity.
   * @returns {{ vx: number, vz: number } | null} null if drag too short
   */
  endDrag(tablePos, screenX = 0, screenY = 0) {
    if (!this._dragging) return null
    this._dragging = false
    if (!tablePos) return null

    const dx = screenX - this._startScreenX
    const dy = screenY - this._startScreenY
    const pixelDist = Math.sqrt(dx * dx + dy * dy)
    if (pixelDist < MIN_DRAG_PIXELS) return null

    const dragVec = this._cueBallPos.sub(tablePos)
    if (dragVec.length() < 0.0001) return null
    const dir = dragVec.normalize()
    const maxShotSpeed = MAX_SPEED * PLAYER_SHOT_POWER_SCALE
    const speed = Math.min((pixelDist / MAX_DRAG_PIXELS) * maxShotSpeed, maxShotSpeed)
    return { vx: dir.x * speed, vz: dir.z * speed }
  }

  cancel() {
    this._dragging = false
    this._dragStart = null
  }

  get isDragging() { return this._dragging }
}
