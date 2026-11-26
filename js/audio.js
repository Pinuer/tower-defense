/* Audio: música chiptune y efectos generados con Web Audio (sin archivos). */
const SFX = (function () {
  let ctx, master, mus, fx, noiseBuf, timer;
  let muted = false;
  try {
    muted = localStorage.getItem("td_mute") === "1";
  } catch (e) {}
  const last = {};
  const gate = (k, ms) => {
    const n = performance.now();
    if (last[k] && n - last[k] < ms) return false;
    last[k] = n;
    return true;
  };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function tone(f, t, d, type, v, dest, f2) {
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g);
    g.connect(dest || fx);
    o.start(t);
    o.stop(t + d + 0.03);
  }
  function noise(t, d, v, freq, type, dest) {
    const s = ctx.createBufferSource(),
      fl = ctx.createBiquadFilter(),
      g = ctx.createGain();
    s.buffer = noiseBuf;
    fl.type = type || "highpass";
    fl.frequency.value = freq;
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(fl);
    fl.connect(g);
    g.connect(dest || fx);
    s.start(t);
    s.stop(t + d + 0.03);
  }
  const seq = (notes, gap, type, v, d) => {
    const t = ctx.currentTime;
    notes.forEach((f, i) => tone(f, t + i * gap, d || gap * 1.6, type, v));
  };

  /* ---------- Música ---------- */
  // Un tema por nivel: tónica (MIDI), escala, progresión (semitonos), tempo y timbre.
  const THEMES = [
    { root: 60, sc: [0, 2, 4, 5, 7, 9, 11], prog: [0, 7, 9, 5], bpm: 112, lead: "square", seed: 11 }, // Valle
    { root: 57, sc: [0, 2, 3, 5, 7, 8, 10], prog: [0, 8, 3, 10], bpm: 94, lead: "triangle", seed: 23 }, // Nieve
    { root: 62, sc: [0, 1, 4, 5, 7, 8, 10], prog: [0, 1, 0, 10], bpm: 104, lead: "sawtooth", seed: 37 }, // Desierto
    { root: 52, sc: [0, 2, 3, 5, 7, 8, 11], prog: [0, 0, 8, 7], bpm: 128, lead: "square", seed: 41 }, // Volcán
    { root: 55, sc: [0, 2, 3, 5, 7, 9, 10], prog: [0, 3, 5, 3], bpm: 88, lead: "triangle", seed: 59 }, // Pantano
  ];
  function nearest(sc, semis) {
    let b = 0;
    for (let i = 0; i < sc.length; i++) if (Math.abs(sc[i] - semis) < Math.abs(sc[b] - semis)) b = i;
    return b;
  }
  // Genera 8 compases (64 corcheas): 4 compases + variación de esos mismos.
  function compose(th) {
    let s = th.seed;
    const rnd = () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const sc = th.sc,
      n = sc.length;
    const note = (p) => th.root + 12 + 12 * Math.floor(p / n) + sc[((p % n) + n) % n];
    const clamp = (p) => Math.max(n - 2, Math.min(2 * n + 3, p));
    const A = [];
    let p = n + 2;
    for (let bar = 0; bar < 4; bar++) {
      const ci = nearest(sc, th.prog[bar]),
        tones = [ci, ci + 2, ci + 4],
        row = [];
      for (let st = 0; st < 8; st++) {
        if (st % 4 === 0) {
          p = clamp(tones[Math.floor(rnd() * 3)] + (rnd() < 0.35 ? n : 0));
          row.push(note(p));
        } else if (rnd() < 0.22) row.push(null);
        else {
          p = clamp(p + (rnd() < 0.5 ? -1 : 1) * (rnd() < 0.7 ? 1 : 2));
          row.push(note(p));
        }
      }
      A.push(row);
    }
    const mel = [];
    for (let rep = 0; rep < 2; rep++)
      for (let bar = 0; bar < 4; bar++) {
        const row = A[bar].slice();
        if (rep === 1 && bar === 3) {
          row[6] = note(nearest(sc, 0) + n);
          row[7] = null;
        }
        mel.push(...row);
      }
    return mel;
  }
  const cache = [];
  const melody = (i) => cache[i] || (cache[i] = compose(THEMES[i]));

  let step = 0,
    next = 0;
  function play(i, t, dur, th, active, hot) {
    const st = i % 8,
      bar = Math.floor(i / 8) % 8,
      cr = th.prog[bar % 4];
    const m = melody(THEMES.indexOf(th))[i % 64];
    if (m != null) tone(mtof(m), t, dur * 1.7, th.lead, th.lead === "sawtooth" ? 0.09 : 0.14, mus);
    if (st % 2 === 0) {
      const b = th.root - 12 + cr + (st === 4 && bar % 2 ? 7 : 0);
      tone(mtof(b), t, dur * 1.9, "triangle", 0.34, mus);
    }
    if (!active) return; // entre oleadas: solo melodía y bajo
    if (st === 0 || st === 4 || (hot && (st === 2 || st === 6))) tone(150, t, 0.13, "sine", 0.55, mus, 42);
    if (st === 2 || st === 6) {
      noise(t, 0.1, 0.22, 1800, "highpass", mus);
      tone(210, t, 0.07, "triangle", 0.12, mus, 120);
    }
    noise(t, st === 7 ? 0.08 : 0.03, st % 2 ? 0.07 : 0.045, 7000, "highpass", mus);
  }
  function tick() {
    if (!ctx) return;
    let hold = false,
      active = false,
      hot = false,
      mi = 0;
    try {
      hold = TITLE || S.paused || !!S.over;
      active = S.active;
      hot = S.active && S.wave >= MAXW;
      mi = MI;
    } catch (e) {}
    if (hold || ctx.state !== "running") {
      next = ctx.currentTime + 0.05;
      return;
    }
    const th = THEMES[mi % THEMES.length],
      dur = 60 / (th.bpm * (hot ? 1.2 : 1)) / 2;
    if (next < ctx.currentTime) next = ctx.currentTime + 0.05;
    while (next < ctx.currentTime + 0.18) {
      play(step % 64, next, dur, th, active, hot);
      next += dur;
      step++;
    }
  }

  /* ---------- Control ---------- */
  function applyMute() {
    if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.02);
    const b = document.getElementById("mute");
    if (b) b.textContent = muted ? "Sonido: no" : "Sonido: sí";
  }
  function start() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      master = ctx.createGain();
      mus = ctx.createGain();
      fx = ctx.createGain();
      mus.gain.value = 0.28;
      fx.gain.value = 0.5;
      mus.connect(master);
      fx.connect(master);
      master.connect(comp);
      comp.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      timer = setInterval(tick, 50);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) ctx.suspend();
        else ctx.resume();
      });
    }
    ctx.resume();
    applyMute();
  }
  function toggle() {
    muted = !muted;
    try {
      localStorage.setItem("td_mute", muted ? "1" : "0");
    } catch (e) {}
    applyMute();
  }
  const ok = () => ctx && !muted && ctx.state === "running";

  /* ---------- Efectos ---------- */
  const api = {
    start,
    toggle,
    blip() {
      if (ok() && gate("blip", 30)) tone(660, ctx.currentTime, 0.05, "square", 0.12);
    },
    shoot(k) {
      if (!ok() || !gate("s" + k, 45)) return;
      const t = ctx.currentTime;
      if (k === "arrow") tone(900, t, 0.07, "square", 0.1, fx, 420);
      else if (k === "cannon") {
        tone(130, t, 0.18, "sine", 0.4, fx, 45);
        noise(t, 0.12, 0.18, 300, "lowpass");
      } else if (k === "frost") {
        tone(1300, t, 0.1, "triangle", 0.12, fx, 2000);
        tone(1900, t + 0.04, 0.08, "sine", 0.07);
      } else if (k === "fire") {
        noise(t, 0.16, 0.14, 900, "bandpass");
        tone(320, t, 0.12, "sawtooth", 0.06, fx, 140);
      } else if (k === "bolt") {
        tone(1600, t, 0.1, "sawtooth", 0.09, fx, 180);
        tone(900, t + 0.03, 0.06, "square", 0.06, fx, 1500);
      } else if (k === "poison") {
        tone(380, t, 0.09, "sine", 0.16, fx, 640);
        tone(520, t + 0.07, 0.08, "sine", 0.1, fx, 800);
      } else if (k === "mortar") {
        tone(95, t, 0.3, "sine", 0.5, fx, 32);
        noise(t, 0.2, 0.2, 250, "lowpass");
      } else tone(700, t, 0.06, "square", 0.08);
    },
    kill(boss) {
      if (!ok()) return;
      const t = ctx.currentTime;
      if (boss) {
        tone(180, t, 0.6, "sawtooth", 0.25, fx, 30);
        noise(t, 0.5, 0.3, 400, "lowpass");
        seq([523, 659, 784, 1047], 0.09, "square", 0.12);
        return;
      }
      if (!gate("kill", 40)) return;
      tone(520, t, 0.08, "square", 0.08, fx, 180);
      tone(1319, t + 0.05, 0.07, "triangle", 0.06);
    },
    build() {
      if (ok()) seq([392, 587], 0.07, "square", 0.13);
    },
    upgrade() {
      if (ok()) seq([523, 659, 784, 1047], 0.06, "square", 0.12);
    },
    sell() {
      if (ok()) seq([1319, 988, 659], 0.06, "triangle", 0.14);
    },
    wave(boss) {
      if (!ok()) return;
      if (boss) seq([196, 185, 175], 0.28, "sawtooth", 0.22, 0.5);
      else seq([220, 330, 440], 0.1, "sawtooth", 0.12, 0.25);
    },
    hurt() {
      if (!ok()) return;
      const t = ctx.currentTime;
      tone(220, t, 0.3, "sawtooth", 0.25, fx, 55);
      noise(t, 0.15, 0.15, 600, "lowpass");
    },
    win() {
      if (ok()) seq([523, 659, 784, 1047, 784, 1047, 1319], 0.12, "square", 0.14, 0.3);
    },
    lose() {
      if (ok()) seq([392, 330, 262, 196], 0.3, "triangle", 0.25, 0.5);
    },
  };

  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("button");
    if (b && b.id !== "mute" && b.id !== "play") api.blip();
  });
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.toLowerCase() === "m" && ctx) toggle();
  });
  const mb = document.getElementById("mute");
  if (mb) {
    mb.onclick = () => {
      start();
      toggle();
    };
    mb.textContent = muted ? "Sonido: no" : "Sonido: sí";
  }
  return api;
})();
