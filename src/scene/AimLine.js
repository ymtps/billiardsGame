import * as THREE from 'three'
import { BALL_RADIUS } from '../constants.js'
import { castRay } from '../utils/castRay.js'

const Y_OFFSET = BALL_RADIUS + 0.005

/**
 * Aim line + ghost ball at impact point.
 * Line color shifts green→yellow→red with shot power (0–1).
 */
export class AimLine {
  constructor() {
    const pts = [
      new THREE.Vector3(0, Y_OFFSET, 0),
      new THREE.Vector3(1, Y_OFFSET, 0),
    ]
    this._geo = new THREE.BufferGeometry().setFromPoints(pts)
    this._mat = new THREE.LineBasicMaterial({ color: 0x00e676, opacity: 0.85, transparent: true })
    this.line = new THREE.Line(this._geo, this._mat)
    this.line.visible = false
    this.line.frustumCulled = false

    // Ghost ball shown at cue-ball impact point
    const ghostGeo = new THREE.SphereGeometry(BALL_RADIUS, 16, 16)
    this._ghostMat = new THREE.MeshBasicMaterial({
      color: 0x00e676,
      opacity: 0.28,
      transparent: true,
      depthWrite: false,
    })
    this._ghostBall = new THREE.Mesh(ghostGeo, this._ghostMat)
    this._ghostBall.visible = false
    this._ghostBall.frustumCulled = false
  }

  update(cueBallPos, angle, activeBalls) {
    const nonCue = activeBalls.filter(b => b.id !== 0)
    const hit = castRay(cueBallPos, angle, nonCue)
    const endX = hit ? hit.point.x : cueBallPos.x + Math.cos(angle) * 3
    const endZ = hit ? hit.point.z : cueBallPos.z + Math.sin(angle) * 3

    const pos = this._geo.attributes.position
    pos.setXYZ(0, cueBallPos.x, Y_OFFSET, cueBallPos.z)
    pos.setXYZ(1, endX, Y_OFFSET, endZ)
    pos.needsUpdate = true

    if (hit) {
      this._ghostBall.position.set(hit.point.x, BALL_RADIUS, hit.point.z)
      this._ghostBall.visible = true
    } else {
      this._ghostBall.visible = false
    }
  }

  /** power: 0–1 — shifts line/ghost color from green through yellow to red */
  setPower(power) {
    const t = Math.max(0, Math.min(1, power))
    const r = t < 0.5 ? Math.round(t * 2 * 255) : 255
    const g = t < 0.5 ? 255 : Math.round((1 - (t - 0.5) * 2) * 255)
    const col = new THREE.Color(r / 255, g / 255, 0)
    this._mat.color.copy(col)
    this._ghostMat.color.copy(col)
  }

  setVisible(v) {
    this.line.visible = v
    if (!v) this._ghostBall.visible = false
  }

  addToScene(scene) {
    scene.add(this.line)
    scene.add(this._ghostBall)
  }
}
