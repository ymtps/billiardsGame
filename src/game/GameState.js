export const State = {
  IDLE: 'IDLE',
  RACK: 'RACK',
  PLAYER_AIMING: 'PLAYER_AIMING',
  PLAYER_BIH: 'PLAYER_BIH',      // ball-in-hand placement mode
  SIMULATING: 'SIMULATING',
  // RESULT_CHECK is a synchronous sub-step inside onSimulationComplete,
  // not a stable state value — kept as a comment only to match the diagram
  AI_THINKING: 'AI_THINKING',
  GAME_OVER: 'GAME_OVER',
}

export class GameState {
  constructor() {
    this.current = State.IDLE
    this.currentTurn = 'player' // 'player' | 'ai'
    this.winner = null           // null | 'player' | 'ai'
    this._onChange = null
  }

  onStateChange(fn) { this._onChange = fn }

  transition(next) {
    const prev = this.current
    this.current = next
    if (this._onChange) this._onChange(prev, next)
  }

  isPlayerTurn() { return this.currentTurn === 'player' }
  isSimulating() { return this.current === State.SIMULATING }
}
