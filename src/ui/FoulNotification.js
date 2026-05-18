const FOUL_MESSAGES = {
  SCRATCH: '手玉落ち',
  NO_CONTACT: '空振り',
  WRONG_BALL: '先当たり違反',
  FOUL_NINE: '9番ファウル（リスポット）',
}

export class FoulNotification {
  init() {
    this._el = document.getElementById('foul-notification')
    this._timer = null
  }

  /**
   * Show foul notification.
   * @param {string} foulType - SCRATCH | NO_CONTACT | WRONG_BALL | FOUL_NINE
   * @param {boolean} opponentGetsBIH - true when the OTHER player gets ball-in-hand
   *   (i.e., the player who DIDN'T foul gets BIH)
   */
  show(foulType, opponentGetsBIH) {
    if (!this._el) return
    clearTimeout(this._timer) // P1 fix: reset timer on second call
    const msg = FOUL_MESSAGES[foulType] ?? 'ファウル'
    // Only append BIH note when the UI reader (the player) receives BIH
    // opponentGetsBIH=true means opponent (not current reader) gets BIH → player sees "→ BIH"
    const bihNote = opponentGetsBIH ? '' : ' → ボール・イン・ハンド'
    this._el.textContent = `ファウル: ${msg}${bihNote}`
    this._el.style.display = 'block'
    this._timer = setTimeout(() => this.hide(), 2000)
  }

  hide() {
    if (!this._el) return
    this._el.style.display = 'none'
  }
}
