import { BALL_RADIUS, FOOT_SPOT_Z } from '../constants.js'

const SQRT3 = Math.sqrt(3)

/**
 * Generates the 9-ball diamond rack positions.
 * Ball 1 at apex (row 0), ball 9 at center (row 2, position 1).
 * Balls 2-8 shuffled into remaining 7 positions.
 *
 * Diamond layout (row: positions):
 *   0:  [center]
 *   1:  [left, right]
 *   2:  [left, CENTER, right]   ← ball 9 in CENTER
 *   3:  [left, right]
 *   4:  [center]
 */
export function generateRackPositions() {
  const R = BALL_RADIUS
  const dx = R * SQRT3 // horizontal spacing between rows
  const dz = R * 2     // row-to-row depth

  // Base positions in diamond (9 slots: row 0 to row 4)
  // All x,z relative to rack apex at (0, FOOT_SPOT_Z)
  const slots = [
    { x: 0,        z: 0 },        // slot 0 — apex (ball 1 here)
    { x: -dx,      z: dz },       // slot 1
    { x:  dx,      z: dz },       // slot 2
    { x: -dx * 2,  z: dz * 2 },   // slot 3
    { x:  0,       z: dz * 2 },   // slot 4 — center (ball 9 here)
    { x:  dx * 2,  z: dz * 2 },   // slot 5
    { x: -dx,      z: dz * 3 },   // slot 6
    { x:  dx,      z: dz * 3 },   // slot 7
    { x:  0,       z: dz * 4 },   // slot 8 — tail
  ]

  // Fixed positions
  const fixed = { 0: 1, 4: 9 } // slotIndex → ballId

  // Remaining balls 2-8 shuffled
  const remaining = [2, 3, 4, 5, 6, 7, 8]
  shuffle(remaining)

  const result = []
  let rIdx = 0
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i]
    const id = fixed[i] !== undefined ? fixed[i] : remaining[rIdx++]
    result.push({ id, x: s.x, z: FOOT_SPOT_Z + s.z })
  }

  // id=0 is cue ball — place it at head string center
  result.push({ id: 0, x: 0, z: -FOOT_SPOT_Z })

  return result
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}
