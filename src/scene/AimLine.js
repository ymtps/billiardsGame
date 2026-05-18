import * as THREE from 'three'
import { BALL_RADIUS } from '../constants.js'
import { castRay } from '../utils/castRay.js'

const Y_OFFSET = BALL_RADIUS + 0.005 // float above table to avoid z-fighting

/**
 * Aim line rendered as a Three.js Line in world space.
 * The endpoint is computed via swept-circle castRay.
 */
export class AimLine {
  constructor() {
    const pts = [
      new THREE.Vector3(0, Y_OFFSET, 0),
      new THREE.Vector3(1, Y_OFFSET, 0),
    ]
    this._geo = new THREE.BufferGeometry().setFromPoints(pts)
    this._mat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.75, transparent: true })
    this.line = new THREE.Line(this._geo, this._mat)
    this.line.visible = false
    this.line.frustumCulled = false
  }

  /**
   * Update aim line from start toward angle direction.
   * Computes endpoint via castRay (swept circle) for accuracy.
   *
   * @param {Vector2D} cueBallPos - physics position
   * @param {number} angle - radians
   * @param {Array} activeBalls - physics balls (excluding cue)
   */
  update(cueBallPos, angle, activeBalls) {
    const nonCue = activeBalls.filter(b => b.id !== 0)
    const hit = castRay(cueBallPos, angle, nonCue)
    const endX = hit ? hit.point.x : cueBallPos.x + Math.cos(angle) * 3
    const endZ = hit ? hit.point.z : cueBallPos.z + Math.sin(angle) * 3

    const pos = this._geo.attributes.position
    pos.setXYZ(0, cueBallPos.x, Y_OFFSET, cueBallPos.z)
    pos.setXYZ(1, endX, Y_OFFSET, endZ)
    pos.needsUpdate = true
  }

  setVisible(v) { this.line.visible = v }

  addToScene(scene) { scene.add(this.line) }
}
