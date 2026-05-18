/**
 * Per-shot ordered contact log for foul detection (R2/R4).
 * Records the first ball the cue ball contacts in each shot.
 */
export class CollisionLog {
  constructor() {
    this._entries = []
    this._seen = new Set() // de-duplicate ballId within a shot
  }

  /** Call at the start of each shot (applyImpulse). */
  start() {
    this._entries = []
    this._seen.clear()
  }

  /**
   * Record a cue-ball contact.
   * Only the first contact with each ballId is kept (iterative solver may
   * process the same pair multiple times, but we only want the first detection).
   */
  record(ballId) {
    if (this._seen.has(ballId)) return
    this._seen.add(ballId)
    this._entries.push(ballId)
  }

  /** Returns the id of the first ball contacted, or null if no contact occurred. */
  getFirstContact() {
    return this._entries.length > 0 ? this._entries[0] : null
  }
}
