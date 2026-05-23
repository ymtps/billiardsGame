import { BALL_RADIUS } from '../constants.js'

const SQRT3 = Math.sqrt(3)
const FOOT_SPOT_X = 0.55

export function generateBasicRackPositions() {
  const R = BALL_RADIUS

  // 15-ball triangle: row i has i+1 balls, close-packed along +X axis
  const slots = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      slots.push({
        x: FOOT_SPOT_X + row * R * SQRT3,
        z: (-row + 2 * col) * R,
      })
    }
  }

  const ids = Array.from({ length: 15 }, (_, i) => i + 1)
  shuffle(ids)

  const result = slots.map((s, i) => ({ id: ids[i], x: s.x, z: s.z }))
  result.push({ id: 0, x: -FOOT_SPOT_X, z: 0 })
  return result
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}
