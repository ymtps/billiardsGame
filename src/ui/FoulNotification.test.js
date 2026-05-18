import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FoulNotification } from './FoulNotification.js'

function setupDOM() {
  document.body.innerHTML = `<div id="foul-notification" style="display:none"></div>`
}

describe('FoulNotification', () => {
  let fn

  beforeEach(() => {
    setupDOM()
    fn = new FoulNotification()
    fn.init()
    vi.useFakeTimers()
  })

  it('show makes element visible', () => {
    fn.show('WRONG_BALL', false)
    expect(document.getElementById('foul-notification').style.display).toBe('block')
  })

  it('show displays correct foul message', () => {
    fn.show('WRONG_BALL', false)
    expect(document.getElementById('foul-notification').textContent).toContain('先当たり違反')
  })

  it('auto-hides after 2000ms', () => {
    fn.show('SCRATCH', false)
    vi.advanceTimersByTime(2000)
    expect(document.getElementById('foul-notification').style.display).toBe('none')
  })

  it('hide() immediately hides element', () => {
    fn.show('NO_CONTACT', false)
    fn.hide()
    expect(document.getElementById('foul-notification').style.display).toBe('none')
  })

  it('second show() resets timer (no early hide)', () => {
    fn.show('SCRATCH', false)
    vi.advanceTimersByTime(1500)
    fn.show('WRONG_BALL', false) // reset timer
    vi.advanceTimersByTime(1500) // total 3s but second show at 1.5s → hides at 1.5+2=3.5s
    // Should still be visible at 3s total
    expect(document.getElementById('foul-notification').style.display).toBe('block')
    vi.advanceTimersByTime(500) // 3.5s → hides
    expect(document.getElementById('foul-notification').style.display).toBe('none')
  })

  it('show with opponentGetsBIH=true omits BIH note (opponent gets BIH, not player)', () => {
    fn.show('SCRATCH', true) // player fouled, AI gets BIH
    const text = document.getElementById('foul-notification').textContent
    expect(text).not.toContain('ボール・イン・ハンド')
  })

  it('show with opponentGetsBIH=false includes BIH note (player gets BIH)', () => {
    fn.show('SCRATCH', false) // AI fouled, player gets BIH
    const text = document.getElementById('foul-notification').textContent
    expect(text).toContain('ボール・イン・ハンド')
  })
})
