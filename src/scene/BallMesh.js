import * as THREE from 'three'
import { BALL_RADIUS, BALL_COLORS } from '../constants.js'

const GEO = new THREE.SphereGeometry(BALL_RADIUS, 32, 32) // shared geometry

/**
 * Create a Three.js mesh for a single billiard ball.
 * Uses MeshStandardMaterial so envMap reflections apply automatically.
 */
export function createBallMesh(ballId) {
  const color = BALL_COLORS[ballId] ?? 0xffffff
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.05,
    metalness: 0.0,
    envMapIntensity: 1.5,
  })
  const mesh = new THREE.Mesh(GEO, mat)
  mesh.castShadow = false
  mesh.userData.ballId = ballId
  return mesh
}
