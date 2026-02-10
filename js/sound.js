const Sound = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctx;
  }

  function playTone(freq, duration, type, volume) {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume || 0.15, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  }

  function hit() {
    playTone(220, 0.15, 'square', 0.2);
    setTimeout(() => playTone(160, 0.2, 'sawtooth', 0.15), 80);
    setTimeout(() => playTone(100, 0.3, 'square', 0.1), 160);
  }

  function miss() {
    playTone(300, 0.12, 'sine', 0.1);
    setTimeout(() => playTone(200, 0.15, 'sine', 0.07), 60);
  }

  function sunk() {
    playTone(180, 0.15, 'square', 0.2);
    setTimeout(() => playTone(140, 0.15, 'sawtooth', 0.2), 100);
    setTimeout(() => playTone(100, 0.2, 'sawtooth', 0.15), 200);
    setTimeout(() => playTone(70, 0.4, 'square', 0.12), 300);
  }

  function place() {
    playTone(600, 0.06, 'square', 0.08);
    setTimeout(() => playTone(800, 0.06, 'square', 0.08), 50);
  }

  function victory() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => {
      setTimeout(() => playTone(n, 0.25, 'square', 0.15), i * 150);
    });
  }

  function defeat() {
    const notes = [400, 350, 300, 200];
    notes.forEach((n, i) => {
      setTimeout(() => playTone(n, 0.3, 'sawtooth', 0.12), i * 200);
    });
  }

  function click() {
    playTone(1000, 0.03, 'square', 0.06);
  }

  return { hit, miss, sunk, place, victory, defeat, click };
})();
