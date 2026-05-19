import * as THREE from 'three'
import { BALL_RADIUS } from '../constants.js'

const CUE_LENGTH = 1.45
const TIP_R = 0.0058
const BUTT_R = 0.0148
const GAP = BALL_RADIUS + 0.025 // tip-to-ball gap

export class CueMesh {
  constructor() {
    this._group = new THREE.Group()
    this._group.frustumCulled = false

    // Shaft: tapered cylinder, rotateZ(-PI/2) puts narrow end (tip) at +X
    const shaftGeo = new THREE.CylinderGeometry(TIP_R, BUTT_R, CUE_LENGTH, 16)
    shaftGeo.rotateZ(-Math.PI / 2)
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0xd4a040,
      roughness: 0.45,
      metalness: 0.0,
    })
    this._group.add(new THREE.Mesh(shaftGeo, shaftMat))

    // Blue chalk tip sphere at +X end
    const tipGeo = new THREE.SphereGeometry(TIP_R * 1.5, 8, 6)
    const tipMesh = new THREE.Mesh(tipGeo, new THREE.MeshStandardMaterial({ color: 0x2255bb, roughness: 0.65 }))
    tipMesh.position.x = CUE_LENGTH / 2
    this._group.add(tipMesh)

    this._group.visible = false
    this._angle = 0
  }

  /**
   * Position and orient the cue behind the cue ball.
   *
   * @param {Vector2D} cueBallPos - physics XZ position
   * @param {number} angle - shot direction angle in radians
   * @param {number} pullback - extra pull-back distance in meters
   */
  update(cueBallPos, angle, pullback) {
    this._angle = angle

    // Group centre is placed so that tip (+X end) lands at: cueBall - shotDir*(GAP+pullback)
    // ∴ centre = cueBall - shotDir*(GAP + pullback + CUE_LENGTH/2)
    const dist = GAP + pullback + CUE_LENGTH / 2
    this._group.position.set(
      cueBallPos.x - Math.cos(angle) * dist,
      BALL_RADIUS,
      cueBallPos.z - Math.sin(angle) * dist,
    )
    // rotation.y = -angle aligns local +X with the shot direction vector (cos,0,sin)
    this._group.rotation.set(0, -angle, 0)
    this._group.visible = true
  }

  setVisible(v) { this._group.visible = v }
  addToScene(scene) { scene.add(this._group) }
}
