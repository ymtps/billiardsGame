export class HUD {
  init() {
    this._turnEl = document.getElementById('turn-indicator')
    this._targetEl = document.getElementById('target-ball')
    this._scoreEl = document.getElementById('score-display')
  }

  update(turn, targetBallId) {
    if (this._turnEl) this._turnEl.textContent = turn === 'player' ? 'あなたのターン' : 'CPU のターン'
    if (this._targetEl) { this._targetEl.style.display = 'block'; this._targetEl.textContent = targetBallId != null ? `${targetBallId}番を狙え` : '9番を狙え' }
    if (this._scoreEl) this._scoreEl.style.display = 'none'
  }

  updateBasic(turn, playerScore, aiScore) {
    if (this._turnEl) this._turnEl.textContent = turn === 'player' ? 'あなたのターン' : 'CPU のターン'
    if (this._targetEl) this._targetEl.style.display = 'none'
    if (this._scoreEl) { this._scoreEl.style.display = 'block'; this._scoreEl.textContent = `あなた: ${playerScore} | CPU: ${aiScore}` }
  }

  hide() {
    if (this._turnEl) this._turnEl.textContent = ''
    if (this._targetEl) this._targetEl.textContent = ''
    if (this._scoreEl) this._scoreEl.style.display = 'none'
  }
}
