export class HUD {
  init() {
    this._turnEl = document.getElementById('turn-indicator')
    this._targetEl = document.getElementById('target-ball')
  }

  update(turn, targetBallId) {
    if (this._turnEl) {
      this._turnEl.textContent = turn === 'player' ? 'あなたのターン' : 'AI のターン'
    }
    if (this._targetEl) {
      this._targetEl.textContent = targetBallId != null
        ? `${targetBallId}番を狙え`
        : '9番を狙え'
    }
  }

  hide() {
    if (this._turnEl) this._turnEl.textContent = ''
    if (this._targetEl) this._targetEl.textContent = ''
  }
}
