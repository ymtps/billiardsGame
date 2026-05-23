export class TurnNotification {
  init() {
    this._el = document.getElementById('turn-notification')
    this._timeoutId = null
  }

  show(turn) {
    if (!this._el) return
    if (this._timeoutId) clearTimeout(this._timeoutId)
    this._el.textContent = turn === 'player' ? 'あなたのターン' : 'CPU のターン'
    this._el.style.display = 'block'
    this._timeoutId = setTimeout(() => {
      if (this._el) this._el.style.display = 'none'
    }, 1500)
  }

  hide() {
    if (this._el) this._el.style.display = 'none'
    if (this._timeoutId) clearTimeout(this._timeoutId)
  }
}
