export class StartScreen {
  init() {
    this._el = document.getElementById('start-screen')
    this._nineBallBtn = document.getElementById('btn-nine-ball')
    this._basicBtn = document.getElementById('btn-basic')
    this._onSelect = null

    this._nineBallBtn?.addEventListener('click', () => this._onSelect?.('nine-ball'))
    this._basicBtn?.addEventListener('click', () => this._onSelect?.('basic'))
  }

  onSelect(fn) { this._onSelect = fn }

  hide() {
    if (this._el) this._el.style.display = 'none'
  }
}
