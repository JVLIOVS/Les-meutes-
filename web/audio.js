/** Original 86 BPM instrumental score, synthesized locally. No recordings or samples. */
export class AudioFx {
  constructor(sound = true, music = true) {
    this.enabled = sound;
    this.music = music;
    this.ctx = null;
    this.last = 0;
    this.step = 0;
    this.next = 0;
    this.mood = 'prepare';
    this.timer = null;
  }
  unlock() {
    try {
      this.ctx ??= new (window.AudioContext || window.webkitAudioContext)();
      if (!this.master) {
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.18;
        this.master.connect(this.ctx.destination);
        this.bus = this.ctx.createGain();
        this.bus.gain.value = 0;
        this.lastMusic = null;
        this.bus.connect(this.master);
        this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.3, this.ctx.sampleRate);
        const a = this.noise.getChannelData(0);
        for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
        this.timer = setInterval(() => this.schedule(), 100);
      }
      this.ctx.resume();
      if (this.next < this.ctx.currentTime) this.next = this.ctx.currentTime + 0.08;
    } catch {}
  }
  setMood(mood) {
    const changed = this.mood !== mood || this.lastMusic !== this.music;
    this.mood = mood;
    this.lastMusic = this.music;
    if (!changed) return;
    if (this.ctx && this.bus)
      this.bus.gain.setTargetAtTime(this.music && mood !== 'pause' ? 0.7 : 0, this.ctx.currentTime, 0.16);
  }
  tone(freq, time, len, vol, type = 'sine', end) {
    const o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, time);
    if (end) o.frequency.exponentialRampToValueAtTime(end, time + len);
    g.gain.setValueAtTime(0.001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, time + len);
    o.connect(g);
    g.connect(this.bus);
    o.start(time);
    o.stop(time + len + 0.02);
  }
  hiss(time, len, vol, cut) {
    const n = this.ctx.createBufferSource(),
      f = this.ctx.createBiquadFilter(),
      g = this.ctx.createGain();
    n.buffer = this.noise;
    f.type = 'highpass';
    f.frequency.value = cut;
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + len);
    n.connect(f);
    f.connect(g);
    g.connect(this.bus);
    n.start(time);
    n.stop(time + len);
  }
  schedule() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (this.next < now - 0.2) this.next = now + 0.04;
    while (this.next < now + 0.2) {
      if (this.music && this.mood !== 'pause') this.beat(this.step, this.next);
      this.step = (this.step + 1) % 128;
      this.next += 60 / 86 / 4;
    }
  }
  beat(step, t) {
    const s = step % 16,
      bar = Math.floor(step / 16),
      tense = ['wave', 'breach'].includes(this.mood),
      roots = [55, 43.654, 48.999, 41.203],
      root = roots[Math.floor(bar / 2) % 4];
    // Half-time hip-hop drums, sub bass and a minor cinematic motif.
    if ([0, 6, 10].includes(s) || (tense && s === 14)) this.tone(115, t, 0.23, 0.8, 'sine', 38);
    if (s === 4 || s === 12) {
      this.hiss(t, 0.13, 0.24, 1100);
      this.tone(180, t, 0.07, 0.1, 'triangle', 130);
    }
    if (s % 2 === 0 || (tense && s >= 12)) this.hiss(t, 0.035, s % 4 === 0 ? 0.12 : 0.07, 6500);
    if ([0, 6, 10].includes(s)) this.tone(root * (s === 10 ? 2 : 1), t, 0.39, 0.34, 'sine', root * 0.96);
    if (s === 0) {
      for (const ratio of [1, 1.189207, 1.498307])
        this.tone(root * 4 * ratio, t, 2.6, tense ? 0.025 : 0.038, 'triangle');
    }
    if (tense && [0, 3, 7, 10, 14].includes(s)) {
      const motif = [1, 1.5, 1.7818, 1.4983, 1.1892];
      this.tone(root * 8 * motif[[0, 3, 7, 10, 14].indexOf(s)], t, 0.28, 0.045, 'triangle');
    }
    if (this.mood === 'breach' && s % 4 === 0) this.tone(root * 2, t, 0.5, 0.2, 'sawtooth', root);
  }
  play(type) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (type === 'hit' && now - this.last < 0.09) return;
    this.last = now;
    const o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type === 'wave' ? 'sine' : 'triangle';
    o.frequency.setValueAtTime(type === 'wave' ? 240 : type === 'place' ? 640 : 150, now);
    o.frequency.exponentialRampToValueAtTime(type === 'wave' ? 330 : type === 'place' ? 310 : 55, now + 0.13);
    g.gain.setValueAtTime(type === 'hit' ? 0.06 : 0.11, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    o.connect(g);
    g.connect(this.master);
    o.start(now);
    o.stop(now + 0.17);
  }
}
