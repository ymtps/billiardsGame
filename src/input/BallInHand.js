import * as THREE from 'three'
import { Vector2D } from '../utils/Vector2D.js'
import { BALL_RADIUS } from '../constants.js'

/**
 * Ball-in-hand placement UI.
 * Shows a ghost cue ball that follows the cursor.
 * Valid position → white ghost, invalid → red ghost.
 */
export class BallInHand {
  constructor() {
    this._active = false
    this._ghost = null
    this._scene = null
    // Colors for valid/invalid
    this._validColor = new THREE.Color(0xffffff)
    this._invalidColor = new THREE.Color(0xff3333)
  }

  activate(scene) {
    if (this._active) return
    this._active = true
    this._scene = scene
    const geo = new THREE.SphereGeometry(BALL_RADIUS, 24, 24)
    const mat = new THREE.MeshStandardMaterial({
      color: this._validColor,
      opacity: 0.6,
      transparent: true,
      roughness: 0.1,
      metalness: 0,
    })
    this._ghost = new THREE.Mesh(geo, mat)
    this._ghost.visible = false
    scene.add(this._ghost)
  }

  /**
   * Move ghost to tablePos and update color based on validity.
   * @param {Vector2D|null} tablePos
   * @param {Map} activePosMap - active ball positions from physics
   * @param {BallManager} ballManager
   */
  moveTo(tablePos, activePosMap, ballManager) {
    if (!this._active || !this._ghost || !tablePos) return
    this._ghost.visible = true
    this._ghost.position.set(tablePos.x, BALL_RADIUS, tablePos.z)
    const valid = ballManager.isValidBIHPosition(tablePos, activePosMap)
    this._ghost.material.color.set(valid ? this._validColor : this._invalidColor)
  }

  /**
   * Confirm placement if position is valid.
   * @returns {Vector2D|null} confirmed position or null
   */
  confirm(tablePos, activePosMap, ballManager) {
    if (!tablePos) return null
    if (!ballManager.isValidBIHPosition(tablePos, activePosMap)) return null
    return tablePos.clone()
  }

  deactivate() {
    if (this._ghost && this._scene) {
      this._scene.remove(this._ghost)
      this._ghost.geometry.dispose()
      this._ghost.material.dispose()
      this._ghost = null
    }
    this._active = false
    this._scene = null
  }

  get isActive() { return this._active }
}
