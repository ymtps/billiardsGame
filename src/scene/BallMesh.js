import * as THREE from 'three'
import { BALL_RADIUS, BALL_COLORS } from '../constants.js'

const GEO = new THREE.SphereGeometry(BALL_RADIUS, 32, 32)

const STRIPE_IDS = new Set([])

/** Colored sphere texture — no number (number is on a separate top-facing plane) */
function createBallTexture(ballId) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const color = '#' + (BALL_COLORS[ballId] ?? 0xffffff).toString(16).padStart(6, '0')

  ctx.fillStyle = color
  ctx.fillRect(0, 0, size, size)

  if (STRIPE_IDS.has(ballId)) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, size * 0.32, size, size * 0.36)
    ctx.restore()
  }

  return new THREE.CanvasTexture(canvas)
}

/** Flat number label placed on top of the ball, always facing upward */
function createNumberLabel(ballId) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, size, size)

  // White circle badge
  const r = size * 0.44
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth = size * 0.04
  ctx.stroke()

  // Bold number
  const fontSize = Math.round(size * 0.52)
  ctx.font = `900 ${fontSize}px Arial Black, Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#111111'
  ctx.fillText(String(ballId), size / 2, size / 2 + size * 0.025)

  const tex = new THREE.CanvasTexture(canvas)
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  })
  const plane = new THREE.Mesh(new THREE.CircleGeometry(BALL_RADIUS * 0.9, 24), mat)
  plane.rotation.x = -Math.PI / 2          // face upward
  plane.position.y = BALL_RADIUS + 0.001   // just above sphere top
  plane.renderOrder = 1
  return plane
}

export function createBallMesh(ballId) {
  const group = new THREE.Group()
  group.frustumCulled = false
  group.userData.ballId = ballId

  // Sphere body
  const tex = createBallTexture(ballId)
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.08,
    metalness: 0.0,
    envMapIntensity: 1.2,
  })
  const sphere = new THREE.Mesh(GEO, mat)
  sphere.castShadow = false
  group.add(sphere)

  // Number label on top (cue ball has no number)
  if (ballId !== 0) {
    group.add(createNumberLabel(ballId))
  }

  return group
}
