/**
 * Procedural sound effects via Web Audio API.
 * All sounds are synthesized — no external files required.
 */
export class SoundManager {
  constructor() {
    this._ctx = null
    this._master = null
    this._enabled = true
    this._lastBallHit = -1
    this._lastCushion = -1
  }

  get enabled() { return this._enabled }

  toggle() {
    this._enabled = !this._enabled
    return this._enabled
  }

  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)()
      this._master = this._ctx.createGain()
      this._master.gain.value = 0.62

      const compressor = this._ctx.createDynamicsCompressor()
      compressor.threshold.value = -16
      compressor.knee.value = 8
      compressor.ratio.value = 4
      compressor.attack.value = 0.003
      compressor.release.value = 0.12

      this._master.connect(compressor)
      compressor.connect(this._ctx.destination)
    }
    if (this._ctx.state === 'suspended') this._ctx.resume()
    return this._ctx
  }

  _noise(ctx, sec) {
    const n = Math.floor(ctx.sampleRate * sec)
    const buf = ctx.createBuffer(1, n, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buf
    return src
  }

  _hitBand(ctx, frequency, q, gain, start, decay) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(frequency, start)
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.86, start + decay)

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = frequency
    filter.Q.value = q

    const amp = ctx.createGain()
    amp.gain.setValueAtTime(gain, start)
    amp.gain.exponentialRampToValueAtTime(0.0001, start + decay)

    osc.connect(filter)
    filter.connect(amp)
    amp.connect(this._master)
    osc.start(start)
    osc.stop(start + decay + 0.01)
  }

  /** Ball-to-ball collision — crisp clack */
  playBallHit(speed = 2) {
    if (!this._enabled) return
    const ctx = this._getCtx()
    const t = ctx.currentTime
    if (t - this._lastBallHit < 0.028) return
    this._lastBallHit = t

    const impact = Math.min(Math.max(speed / 3.2, 0.08), 1)
    const body = 0.35 + impact * 0.65

    const tick = this._noise(ctx, 0.014)
    const hpf = ctx.createBiquadFilter()
    hpf.type = 'highpass'
    hpf.frequency.value = 1800
    const tickGain = ctx.createGain()
    tickGain.gain.setValueAtTime(impact * 0.42, t)
    tickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.018)
    tick.connect(hpf)
    hpf.connect(tickGain)
    tickGain.connect(this._master)
    tick.start(t)
    tick.stop(t + 0.018)

    this._hitBand(ctx, 1450, 8, body * 0.22, t, 0.055)
    this._hitBand(ctx, 2550, 10, body * 0.18, t + 0.001, 0.04)
    this._hitBand(ctx, 4100, 7, body * 0.11, t + 0.002, 0.028)
    this._hitBand(ctx, 620, 5, impact * 0.08, t, 0.075)
  }

  /** Ball-to-cushion — dull thud */
  playCushion(speed = 2) {
    if (!this._enabled) return
    const ctx = this._getCtx()
    const t = ctx.currentTime
    if (t - this._lastCushion < 0.06) return
    this._lastCushion = t

    const vol = Math.min(speed / 4, 1)

    const noise = this._noise(ctx, 0.14)
    const bpf = ctx.createBiquadFilter()
    bpf.type = 'bandpass'
    bpf.frequency.value = 700
    bpf.Q.value = 2
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(vol * 0.4, t)
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
    noise.connect(bpf); bpf.connect(ng); ng.connect(this._master)
    noise.start(t); noise.stop(t + 0.18)

    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(180, t)
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.22)
    const og = ctx.createGain()
    og.gain.setValueAtTime(vol * 0.3, t)
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.24)
    osc.connect(og); og.connect(this._master)
    osc.start(t); osc.stop(t + 0.25)
  }

  /** Ball pocketed — descending plop */
  playPocket() {
    if (!this._enabled) return
    const ctx = this._getCtx()
    const t = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(260, t)
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.38)
    const og = ctx.createGain()
    og.gain.setValueAtTime(0.65, t)
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.48)
    osc.connect(og); og.connect(this._master)
    osc.start(t); osc.stop(t + 0.5)

    const noise = this._noise(ctx, 0.12)
    const lpf = ctx.createBiquadFilter()
    lpf.type = 'lowpass'
    lpf.frequency.value = 350
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.28, t)
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
    noise.connect(lpf); lpf.connect(ng); ng.connect(this._master)
    noise.start(t); noise.stop(t + 0.15)
  }

  /** Cue stick strike */
  playCueHit(speed = 4) {
    if (!this._enabled) return
    const ctx = this._getCtx()
    const t = ctx.currentTime

    const vol = Math.min(speed / 7, 1)

    const noise = this._noise(ctx, 0.04)
    const hpf = ctx.createBiquadFilter()
    hpf.type = 'highpass'
    hpf.frequency.value = 3500
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(vol * 0.7, t)
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
    noise.connect(hpf); hpf.connect(ng); ng.connect(this._master)
    noise.start(t); noise.stop(t + 0.05)

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(480, t)
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.09)
    const og = ctx.createGain()
    og.gain.setValueAtTime(vol * 0.5, t)
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.11)
    osc.connect(og); og.connect(this._master)
    osc.start(t); osc.stop(t + 0.12)
  }
}
