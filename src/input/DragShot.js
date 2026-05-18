import { Vector2D } from '../utils/Vector2D.js'
import { MIN_DRAG_DISTANCE, DRAG_SCALE, MAX_SPEED } from '../constants.js'

/**
 * Handles drag-and-release shot input.
 * Direction: drag away from cue ball → shoot that way.
 * Power: proportional to drag distance.
 */
export class DragShot {
  constructor() {
    this._dragging = false
    this._dragStart = null
    this._cueBallPos = null
  }

  /**
   * Start a drag if the click landed within the cue ball radius.
   * @param {Vector2D} tablePos - mouse position on table plane
   * @param {Vector2D} cueBallPos - cue ball physics position
   * @returns {boolean} true if drag started
   */
  startDrag(tablePos, cueBallPos) {
    if (!tablePos) return false
    const dist = tablePos.distanceTo(cueBallPos)
    // Allow drag start if clicking near cue ball (2x radius for usability)
    if (dist > MIN_DRAG_DISTANCE * 20) return false
    this._dragging = true
    this._dragStart = tablePos.clone()
    this._cueBallPos = cueBallPos.clone()
    return true
  }

  /**
   * Update aim direction during drag.
   * @returns {number|null} angle in radians or null if not dragging
   */
  updateDrag(tablePos) {
    if (!this._dragging || !tablePos) return null
    const dragVec = this._cueBallPos.sub(tablePos) // reversed: pull back = shoot forward
    const dist = dragVec.length()
    if (dist < MIN_DRAG_DISTANCE) return null
    return Math.atan2(dragVec.z, dragVec.x)
  }

  /**
   * End drag and compute shot velocity.
   * @returns {{ vx: number, vz: number } | null} null if drag too short
   */
  endDrag(tablePos) {
    if (!this._dragging) return null
    this._dragging = false
    if (!tablePos) return null

    const dragVec = this._cueBallPos.sub(tablePos)
    const dragDist = dragVec.length()
    if (dragDist < MIN_DRAG_DISTANCE) return null

    const dir = dragVec.normalize()
    const speed = Math.min(dragDist * DRAG_SCALE, MAX_SPEED)
    return { vx: dir.x * speed, vz: dir.z * speed }
  }

  cancel() {
    this._dragging = false
    this._dragStart = null
  }

  get isDragging() { return this._dragging }
}
