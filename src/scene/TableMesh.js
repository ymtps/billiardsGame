import * as THREE from 'three'
import { TABLE_W, TABLE_H } from '../constants.js'

const RAIL_W = 0.15
const TABLE_THICKNESS = 0.12
const APRON_DROP = 0.075
const CUSHION_W = 0.035
const POCKET_R = 0.074
const CORNER_CUT = 0.115
const SIDE_GAP = 0.17
const RAIL_COLOR = 0xaa846b
const FELT_COLOR = 0x2fcf55
const CUSHION_COLOR = 0x27b84b
const CUSHION_SHADOW = 0x1b8d3c
const POCKET_BASE = 0xb8b8b8
const POCKET_HOLE = 0x4d4d4d
const BODY_COLOR = 0x6b4a33
const APRON_COLOR = 0x4b3324
const SURFACE_Y = 0.001

function _material(color) {
  return new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
}

function _rect(width, height, color, y = SURFACE_Y) {
  const geo = new THREE.PlaneGeometry(width, height)
  geo.rotateX(-Math.PI / 2)
  const mesh = new THREE.Mesh(geo, _material(color))
  mesh.position.y = y
  return mesh
}

function _box(width, height, depth, color) {
  const geo = new THREE.BoxGeometry(width, height, depth)
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color }))
  mesh.position.y = -height / 2
  return mesh
}

function _circle(radius, color, y = SURFACE_Y, segments = 48) {
  const geo = new THREE.CircleGeometry(radius, segments)
  geo.rotateX(-Math.PI / 2)
  const mesh = new THREE.Mesh(geo, _material(color))
  mesh.position.y = y
  return mesh
}

function _roundedRect(width, height, radius, color, y = SURFACE_Y) {
  const hw = width / 2
  const hh = height / 2
  const r = Math.min(radius, hw, hh)
  const shape = new THREE.Shape()

  shape.moveTo(-hw + r, -hh)
  shape.lineTo(hw - r, -hh)
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r)
  shape.lineTo(hw, hh - r)
  shape.quadraticCurveTo(hw, hh, hw - r, hh)
  shape.lineTo(-hw + r, hh)
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r)
  shape.lineTo(-hw, -hh + r)
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh)

  const geo = new THREE.ShapeGeometry(shape)
  geo.rotateX(-Math.PI / 2)
  const mesh = new THREE.Mesh(geo, _material(color))
  mesh.position.y = y
  return mesh
}

function _feltShape(width, height) {
  const hw = width / 2
  const hh = height / 2
  const c = CORNER_CUT
  const shape = new THREE.Shape()

  shape.moveTo(-hw + c, -hh)
  shape.lineTo(hw - c, -hh)
  shape.lineTo(hw, -hh + c)
  shape.lineTo(hw, hh - c)
  shape.lineTo(hw - c, hh)
  shape.lineTo(-hw + c, hh)
  shape.lineTo(-hw, hh - c)
  shape.lineTo(-hw, -hh + c)
  shape.lineTo(-hw + c, -hh)

  const geo = new THREE.ShapeGeometry(shape)
  geo.rotateX(-Math.PI / 2)
  const mesh = new THREE.Mesh(geo, _material(FELT_COLOR))
  mesh.position.y = SURFACE_Y + 0.002
  return mesh
}

export class TableMesh {
  constructor() {
    this._group = new THREE.Group()
    this._build()
  }

  _build() {
    const feltW = TABLE_W
    const feltH = TABLE_H
    const outerW = feltW + RAIL_W * 2
    const outerH = feltH + RAIL_W * 2

    this._addTableBody(outerW, outerH)
    this._addPocketBases(feltW, feltH)
    this._addRails(feltW, feltH)
    this._group.add(_feltShape(feltW, feltH))
    this._addCushions(feltW, feltH)
    this._addPockets(feltW, feltH)
    this._addRailSights(outerW, outerH)
  }

  _addTableBody(outerW, outerH) {
    const body = _box(outerW, TABLE_THICKNESS, outerH, BODY_COLOR)
    body.position.y = -TABLE_THICKNESS / 2 - 0.004
    this._group.add(body)

    const front = _box(outerW, APRON_DROP, RAIL_W * 0.42, APRON_COLOR)
    front.position.set(0, -APRON_DROP / 2 - 0.035, outerH / 2 - RAIL_W * 0.2)
    this._group.add(front)

    const back = _box(outerW, APRON_DROP, RAIL_W * 0.42, APRON_COLOR)
    back.position.set(0, -APRON_DROP / 2 - 0.035, -outerH / 2 + RAIL_W * 0.2)
    this._group.add(back)

    const left = _box(RAIL_W * 0.42, APRON_DROP, outerH, APRON_COLOR)
    left.position.set(-outerW / 2 + RAIL_W * 0.2, -APRON_DROP / 2 - 0.035, 0)
    this._group.add(left)

    const right = _box(RAIL_W * 0.42, APRON_DROP, outerH, APRON_COLOR)
    right.position.set(outerW / 2 - RAIL_W * 0.2, -APRON_DROP / 2 - 0.035, 0)
    this._group.add(right)
  }

  _addRails(feltW, feltH) {
    const topZ = -feltH / 2 - RAIL_W / 2
    const bottomZ = feltH / 2 + RAIL_W / 2
    const leftX = -feltW / 2 - RAIL_W / 2
    const rightX = feltW / 2 + RAIL_W / 2
    const longRail = (feltW - SIDE_GAP) / 2
    const longCenters = [-(SIDE_GAP / 2 + longRail / 2), SIDE_GAP / 2 + longRail / 2]

    for (const z of [topZ, bottomZ]) {
      for (const x of longCenters) {
        const rail = _rect(longRail, RAIL_W, RAIL_COLOR, SURFACE_Y)
        rail.position.set(x, rail.position.y, z)
        this._group.add(rail)
      }
    }

    for (const x of [leftX, rightX]) {
      const rail = _rect(RAIL_W, feltH - CORNER_CUT * 1.2, RAIL_COLOR, SURFACE_Y)
      rail.position.set(x, rail.position.y, 0)
      this._group.add(rail)
    }
  }

  _addPocketBases(feltW, feltH) {
    const outerW = feltW + RAIL_W * 2
    const outerH = feltH + RAIL_W * 2
    const frame = _roundedRect(outerW, outerH, 0.09, POCKET_BASE, SURFACE_Y - 0.001)
    this._group.add(frame)
  }

  _addCushions(feltW, feltH) {
    const zTop = -feltH / 2 + CUSHION_W / 2
    const zBottom = feltH / 2 - CUSHION_W / 2
    const xLeft = -feltW / 2 + CUSHION_W / 2
    const xRight = feltW / 2 - CUSHION_W / 2
    const longSegment = (feltW - SIDE_GAP - CORNER_CUT * 2) / 2
    const longCenters = [-(SIDE_GAP / 2 + longSegment / 2), SIDE_GAP / 2 + longSegment / 2]
    const shortSegment = feltH - CORNER_CUT * 2

    for (const z of [zTop, zBottom]) {
      for (const x of longCenters) {
        const cushion = _rect(longSegment, CUSHION_W, CUSHION_COLOR, SURFACE_Y + 0.004)
        cushion.position.set(x, cushion.position.y, z)
        this._group.add(cushion)

        const shadow = _rect(longSegment, 0.008, CUSHION_SHADOW, SURFACE_Y + 0.005)
        shadow.position.set(x, shadow.position.y, z + (z < 0 ? CUSHION_W * 0.32 : -CUSHION_W * 0.32))
        this._group.add(shadow)
      }
    }

    for (const x of [xLeft, xRight]) {
      const cushion = _rect(CUSHION_W, shortSegment, CUSHION_COLOR, SURFACE_Y + 0.004)
      cushion.position.set(x, cushion.position.y, 0)
      this._group.add(cushion)

      const shadow = _rect(0.008, shortSegment, CUSHION_SHADOW, SURFACE_Y + 0.005)
      shadow.position.set(x + (x < 0 ? CUSHION_W * 0.32 : -CUSHION_W * 0.32), shadow.position.y, 0)
      this._group.add(shadow)
    }
  }

  _addPockets(feltW, feltH) {
    const positions = [
      { x: -feltW / 2, z: -feltH / 2, holeX: -feltW / 2 + 0.01, holeZ: -feltH / 2 + 0.01 },
      { x: 0, z: -feltH / 2 - RAIL_W * 0.18, holeX: 0, holeZ: -feltH / 2 - RAIL_W * 0.1 },
      { x: feltW / 2, z: -feltH / 2, holeX: feltW / 2 - 0.01, holeZ: -feltH / 2 + 0.01 },
      { x: -feltW / 2, z: feltH / 2, holeX: -feltW / 2 + 0.01, holeZ: feltH / 2 - 0.01 },
      { x: 0, z: feltH / 2 + RAIL_W * 0.18, holeX: 0, holeZ: feltH / 2 + RAIL_W * 0.1 },
      { x: feltW / 2, z: feltH / 2, holeX: feltW / 2 - 0.01, holeZ: feltH / 2 - 0.01 },
    ]

    for (const p of positions) {
      const base = _circle(POCKET_R * 1.28, POCKET_BASE, SURFACE_Y + 0.001)
      base.position.set(p.x, base.position.y, p.z)
      this._group.add(base)

      const hole = _circle(POCKET_R, POCKET_HOLE, SURFACE_Y + 0.007)
      hole.position.set(p.holeX, hole.position.y, p.holeZ)
      this._group.add(hole)
    }
  }

  _addRailSights(outerW, outerH) {
    const sightPositions = [
      [-outerW * 0.32, -outerH / 2 + RAIL_W * 0.52],
      [outerW * 0.32, -outerH / 2 + RAIL_W * 0.52],
      [-outerW * 0.32, outerH / 2 - RAIL_W * 0.52],
      [outerW * 0.32, outerH / 2 - RAIL_W * 0.52],
      [-outerW / 2 + RAIL_W * 0.52, -outerH * 0.25],
      [-outerW / 2 + RAIL_W * 0.52, outerH * 0.25],
      [outerW / 2 - RAIL_W * 0.52, -outerH * 0.25],
      [outerW / 2 - RAIL_W * 0.52, outerH * 0.25],
    ]

    for (const [x, z] of sightPositions) {
      const sight = _circle(0.009, 0xf3f3f3, SURFACE_Y + 0.008, 12)
      sight.position.set(x, sight.position.y, z)
      this._group.add(sight)
    }
  }

  addToScene(scene) { scene.add(this._group) }
}
