export class GameOverScreen {
  init() {
    this._el = document.getElementById('game-over-screen')
    this._msgEl = document.getElementById('result-message')
    this._restartBtn = document.getElementById('restart-btn')
    this._onRestart = null
    this._restartBtn?.addEventListener('click', () => {
      this.hide()
      this._onRestart?.()
    })
  }

  onRestart(fn) { this._onRestart = fn }

  show(winner) {
    if (!this._el) return
    this._msgEl.textContent = winner === 'player' ? 'あなたの勝ち！' : 'CPU の勝ち'
    this._el.style.display = 'block'
  }

  showBasic(playerScore, aiScore, winner) {
    if (!this._el) return
    const label = winner === 'player' ? 'あなたの勝ち！'
                : winner === 'ai'     ? 'CPU の勝ち'
                : '引き分け'
    this._msgEl.textContent = `${label}  (あなた ${playerScore} / CPU ${aiScore})`
    this._el.style.display = 'block'
  }

  hide() {
    if (this._el) this._el.style.display = 'none'
  }
}
