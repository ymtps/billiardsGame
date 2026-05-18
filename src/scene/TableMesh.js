import * as THREE from 'three'
import { TABLE_W, TABLE_H, POCKET_POSITIONS, POCKET_RADIUS } from '../constants.js'

const CUSHION_THICKNESS = 0.055 // 55mm rail width
const CUSHION_HEIGHT = 0.045    // 45mm rail height

export class TableMesh {
  constructor() {
    this._group = new THREE.Group()
    this._build()
  }

  _build() {
    // Felt surface
    const feltGeo = new THREE.PlaneGeometry(TABLE_W, TABLE_H)
    feltGeo.rotateX(-Math.PI / 2)
    const feltMat = new THREE.MeshLambertMaterial({ color: 0x1a7c3e })
    this._group.add(new THREE.Mesh(feltGeo, feltMat))

    // Wood cushions (4 rails)
    const cushionMat = new THREE.MeshLambertMaterial({ color: 0x6b3a1c })
    const hw = TABLE_W / 2
    const hh = TABLE_H / 2
    const rails = [
      // [width, depth, x, z]
      [TABLE_W + CUSHION_THICKNESS * 2, CUSHION_THICKNESS, 0, -(hh + CUSHION_THICKNESS / 2)], // top
      [TABLE_W + CUSHION_THICKNESS * 2, CUSHION_THICKNESS, 0,  (hh + CUSHION_THICKNESS / 2)], // bottom
      [CUSHION_THICKNESS, TABLE_H, -(hw + CUSHION_THICKNESS / 2), 0], // left
      [CUSHION_THICKNESS, TABLE_H,  (hw + CUSHION_THICKNESS / 2), 0], // right
    ]
    for (const [w, d, x, z] of rails) {
      const geo = new THREE.BoxGeometry(w, CUSHION_HEIGHT, d)
      const mesh = new THREE.Mesh(geo, cushionMat)
      mesh.position.set(x, CUSHION_HEIGHT / 2, z)
      this._group.add(mesh)
    }

    // Pocket holes (visual circles slightly above felt)
    const pocketMat = new THREE.MeshLambertMaterial({ color: 0x050505 })
    for (const p of POCKET_POSITIONS) {
      const geo = new THREE.CircleGeometry(POCKET_RADIUS * 1.1, 16)
      geo.rotateX(-Math.PI / 2)
      const mesh = new THREE.Mesh(geo, pocketMat)
      mesh.position.set(p.x, 0.001, p.z)
      this._group.add(mesh)
    }
  }

  addToScene(scene) { scene.add(this._group) }
}
