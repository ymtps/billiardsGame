import { BALL_RADIUS } from '../constants.js'

const SQRT3 = Math.sqrt(3)

// Foot spot along the long (X) axis — 1/4 of table length from foot rail
const FOOT_SPOT_X = 0.55

/**
 * Generates the 9-ball diamond rack positions.
 * The rack extends along the +X axis (long axis of the table).
 * Ball 1 at apex, ball 9 at center, cue ball at head end (-X).
 *
 * Diamond layout (viewed from above, X = depth into rack):
 *        1          ← apex (x = FOOT_SPOT_X)
 *       * *
 *      * 9 *        ← ball 9 at center
 *       * *
 *        *          ← tail
 */
export function generateRackPositions() {
  const R = BALL_RADIUS
  const dd = R * SQRT3  // depth step along X (touching balls)
  const dl = R          // lateral step along Z (touching balls)

  // Slot positions relative to apex, rack extends along +X
  const slots = [
    { x: 0,       z:  0  },   // slot 0 — apex (ball 1)
    { x: dd,      z: -dl },   // slot 1
    { x: dd,      z:  dl },   // slot 2
    { x: dd * 2,  z: -dl * 2 }, // slot 3
    { x: dd * 2,  z:  0  },   // slot 4 — center (ball 9)
    { x: dd * 2,  z:  dl * 2 }, // slot 5
    { x: dd * 3,  z: -dl },   // slot 6
    { x: dd * 3,  z:  dl },   // slot 7
    { x: dd * 4,  z:  0  },   // slot 8 — tail
  ]

  const fixed = { 0: 1, 4: 9 }
  const remaining = [2, 3, 4, 5, 6, 7, 8]
  shuffle(remaining)

  const result = []
  let rIdx = 0
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i]
    const id = fixed[i] !== undefined ? fixed[i] : remaining[rIdx++]
    result.push({ id, x: FOOT_SPOT_X + s.x, z: s.z })
  }

  // Cue ball at head spot (negative X end)
  result.push({ id: 0, x: -FOOT_SPOT_X, z: 0 })

  return result
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}
