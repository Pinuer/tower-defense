/* Lógica del juego: estado, oleadas, torres, daño y entrada del usuario. */
const C = document.getElementById("c"),
  X = C.getContext("2d");
const T = 40,
  W = 16,
  H = 12,
  MAXW = 20,
  WAIT = 20;
let MI = 0,
  WP,
  ROUTES,
  path;
function setMap(i) {
  MI = i;
  const m = MAPS[i];
  ROUTES = (m.routes || [m.wp]).map((w) => {
    const pts = w.map((p) => [p[0] * T + T / 2, p[1] * T + T / 2]),
      sg = [];
    let total = 0;
    for (let j = 1; j < pts.length; j++) {
      const l = Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]);
      sg.push(l);
      total += l;
    }
    return { pts, sg, total };
  });
  WP = ROUTES[0].pts;
  path = new Set();
  for (const R of ROUTES)
    for (let j = 1; j < R.pts.length; j++) {
      const a = R.pts[j - 1],
        b = R.pts[j],
        n = Math.round(R.sg[j - 1] / T);
      for (let k = 0; k <= n; k++)
        path.add(
          Math.floor((a[0] + ((b[0] - a[0]) * k) / n) / T) +
            "," +
            Math.floor((a[1] + ((b[1] - a[1]) * k) / n) / T),
        );
    }
}
let unlocked = 1;
try {
  unlocked = Math.min(MAPS.length, Math.max(1, +localStorage.getItem("td_unlocked") || 1));
} catch (e) {}
function unlock(n) {
  n = Math.min(MAPS.length, n);
  if (n > unlocked) {
    unlocked = n;
    try {
      localStorage.setItem("td_unlocked", n);
    } catch (e) {}
  }
}
setMap(unlocked - 1);
function pos(d, rt) {
  const R = ROUTES[rt || 0],
    w = R.pts;
  for (let i = 0; i < R.sg.length; i++) {
    if (d <= R.sg[i]) {
      const t = d / R.sg[i];
      return [w[i][0] + (w[i + 1][0] - w[i][0]) * t, w[i][1] + (w[i + 1][1] - w[i][1]) * t];
    }
    d -= R.sg[i];
  }
  return w[w.length - 1];
}
const pg = (e) => e.d / ROUTES[e.rt || 0].total;
let S;
function reset() {
  S = {
    fx: [],
    pt: [],
    cd: WAIT,
    gold: MAPS[MI].gold,
    lives: 20,
    wave: 0,
    towers: [],
    enemies: [],
    shots: [],
    queue: [],
    spawnT: 0,
    active: false,
    over: null,
    speed: 1,
    bt: 9,
    hurt: 0,
    arcs: [],
    born: [],
    rings: [],
    paused: false,
    rr: 0,
    pick: "arrow",
    sel: null,
    mx: -1,
    my: -1,
  };
  $("speed").textContent = "Velocidad x1";
  if ($("pause")) $("pause").textContent = "Pausa";
  $("mapbtn").textContent = "Nivel " + (MI + 1) + ": " + MAPS[MI].name;
  ui();
}
const $ = (id) => document.getElementById(id);
function ui() {
  $("gold").textContent = S.gold;
  $("lives").textContent = S.lives;
  $("wave").textContent = S.wave;
  $("start").disabled = S.active || !!S.over;
  $("mapbtn").textContent =
    S.over === "win" && MI + 1 < MAPS.length
      ? "Siguiente nivel →"
      : "Nivel " + (MI + 1) + ": " + MAPS[MI].name;
  document.querySelectorAll("#shop button").forEach((b) => {
    const d = TYPES[b.dataset.k],
      lock = (d.lvl || 1) > MI + 1;
    b.classList.toggle("sel", b.dataset.k === S.pick);
    b.classList.toggle("poor", S.gold < d.cost);
    b.hidden = lock;
    b.textContent =
      Object.keys(TYPES).indexOf(b.dataset.k) + 1 + ". " + d.name + " (" + d.cost + ")";
  });
  const t = S.sel;
  $("sel").hidden = !t;
  if (t) {
    const maxed = t.lv >= 3;
    const P = TYPES[t.k].paths,
      two = t.lv === 2;
    $("up").textContent = maxed
      ? "Nivel máximo" + (t.path != null ? ": " + P[t.path].n : "")
      : two
        ? P[0].n + " (" + upCost(t) + ")"
        : "Mejorar (" + upCost(t) + ")";
    $("up").title = two ? pathDesc(P[0]) : "";
    $("up").disabled = maxed || S.gold < upCost(t);
    up2.hidden = !two;
    if (two) {
      up2.textContent = P[1].n + " (" + upCost(t) + ")";
      up2.title = pathDesc(P[1]);
      up2.disabled = S.gold < upCost(t);
    }
    $("sell").textContent = "Vender (+" + Math.floor(t.spent * 0.7) + ")";
  }
}
const upCost = (t) => Math.round(TYPES[t.k].cost * 0.8 * t.lv);
const shop = $("shop");
for (const k in TYPES) {
  const b = document.createElement("button");
  b.dataset.k = k;
  b.style.setProperty("--c", TYPES[k].col);
  b.textContent = TYPES[k].name + " (" + TYPES[k].cost + ")";
  b.onclick = () => {
    S.pick = k;
    S.sel = null;
    ui();
  };
  shop.appendChild(b);
}
function startWave() {
  if (S.active || S.over) return;
  S.wave++;
  S.active = true;
  SFX.wave(S.wave === MAXW);
  S.bt = 0;
  const n = 6 + S.wave * 2;
  for (let i = 0; i < n; i++) {
    let k = "normal";
    if (S.wave % 5 === 0 && i % 4 === 3) k = "tank";
    else if (S.wave % 3 === 0 && i % 2 === 1) k = "fast";
    else if (S.wave >= 3 && i % 5 === 2 && MAPS[MI].foe) k = MAPS[MI].foe;
    S.queue.push(k);
  }
  if (S.wave === MAXW) S.queue.push("boss");
  S.spawnT = 0;
  ui();
}
$("start").onclick = startWave;
$("mapbtn").onclick = () => {
  const inGame = S.wave > 0 && !S.over;
  if (inGame && !confirm("Hay una partida en curso. ¿Cambiar de nivel y perder el progreso?"))
    return;
  const n = S.over === "win" && MI + 1 < MAPS.length ? MI + 1 : (MI + 1) % unlocked;
  setMap(n);
  drawMap();
  reset();
  const nt = Object.values(TYPES).find((d) => d.lvl === MI + 1);
  $("info").textContent =
    "Nivel " +
    (MI + 1) +
    ": " +
    MAPS[MI].name +
    "." +
    (nt ? " Torre nueva: " + nt.name + "." : "") +
    (ROUTES.length > 1 ? " Los enemigos llegan por dos caminos." : "");
};
$("speed").onclick = () => {
  S.speed = (S.speed % 3) + 1;
  $("speed").textContent = "Velocidad x" + S.speed;
};
$("restart").onclick = () => {
  reset();
  $("info").textContent = "Partida nueva.";
};
function pathDesc(p) {
  const o = [];
  if (p.d) o.push("daño x" + p.d);
  if (p.r) o.push("alcance +" + p.r);
  if (p.rm) o.push(p.rm < 1 ? "dispara más rápido" : "dispara más lento");
  if (p.sx) o.push("área +" + p.sx);
  if (p.sl) o.push("ralentiza más tiempo");
  if (p.ch) o.push("+" + p.ch + " saltos");
  return o.join(", ");
}
function upgrade(i) {
  const t = S.sel,
    c = t && upCost(t);
  if (S.paused || !t || t.lv >= 3 || S.gold < c) return;
  S.gold -= c;
  SFX.upgrade();
  t.spent += c;
  if (t.lv === 2) {
    const p = TYPES[t.k].paths[i];
    t.dmg *= 1.25 * (p.d || 1);
    t.range += 5 + (p.r || 0);
    t.rm = (t.rm || 1) * (p.rm || 1);
    t.sx = (t.sx || 0) + (p.sx || 0);
    t.ch = (t.ch || 0) + (p.ch || 0);
    if (p.sl) t.sl = p.sl;
    t.path = i;
    $("info").textContent = "Mejora elegida: " + p.n + ".";
  } else {
    t.dmg *= 1.5;
    t.range += 10;
  }
  t.lv++;
  ui();
}
const up2 = document.createElement("button");
up2.id = "up2";
up2.hidden = true;
$("sel").insertBefore(up2, $("sell"));
up2.onclick = () => upgrade(1);
$("up").onclick = () => upgrade(0);
$("sell").onclick = () => {
  const t = S.sel;
  if (!t || S.paused) return;
  S.gold += Math.floor(t.spent * 0.7);
  SFX.sell();
  S.towers.splice(S.towers.indexOf(t), 1);
  S.sel = null;
  ui();
};
function cell(e) {
  const r = C.getBoundingClientRect(),
    s = C.width / r.width;
  return [(e.clientX - r.left) * s, (e.clientY - r.top) * s];
}
let tapCell = null;
C.addEventListener("pointermove", (e) => {
  [S.mx, S.my] = cell(e);
});
C.addEventListener("pointerdown", (e) => {
  [S.mx, S.my] = cell(e);
});
C.addEventListener("pointerleave", (e) => {
  if (e.pointerType === "mouse") S.mx = S.my = -1;
});
C.addEventListener("pointercancel", () => {
  S.mx = S.my = -1;
});
C.addEventListener("click", (e) => {
  if (S.over || S.paused) return;
  const [px, py] = cell(e),
    cx = Math.floor(px / T),
    cy = Math.floor(py / T);
  const ex = S.towers.find((t) => t.cx === cx && t.cy === cy);
  if (ex) {
    S.sel = ex;
    ui();
    return;
  }
  S.sel = null;
  if (path.has(cx + "," + cy)) {
    $("info").textContent = "No se puede construir sobre el camino.";
    ui();
    return;
  }
  const d = TYPES[S.pick];
  if (S.gold < d.cost) {
    $("info").textContent = "Oro insuficiente.";
    ui();
    return;
  }
  /* En pantalla táctil: el primer toque muestra el alcance, el segundo construye */
  if (e.pointerType === "touch") {
    const key = cx + "," + cy;
    if (tapCell !== key) {
      tapCell = key;
      $("info").textContent = "Toca de nuevo el mismo casillero para construir.";
      ui();
      return;
    }
    tapCell = null;
    S.mx = S.my = -1;
  }
  S.gold -= d.cost;
  SFX.build();
  S.towers.push({
    k: S.pick,
    cx,
    cy,
    x: cx * T + T / 2,
    y: cy * T + T / 2,
    range: d.range,
    dmg: d.dmg,
    cd: 0,
    lv: 1,
    spent: d.cost,
    born: performance.now() / 1000,
  });
  $("info").textContent = "";
  ui();
});
function hit(e, dmg, slow, burn, poison) {
  if (e.dead) return;
  e.hp -= dmg;
  if (slow && !KINDS[e.kind].noSlow && !e.noSlow) e.slow = slow;
  if (burn && !KINDS[e.kind].noBurn && !e.noBurn) {
    e.burn = 2;
    e.bd = Math.max(e.bd || 0, dmg * 1.5);
  }
  if (poison && !KINDS[e.kind].noPoison && !e.noPoison) {
    e.psn = 4;
    e.pst = Math.min((e.pst || 0) + poison, poison * 6);
  }
  if (e.hp <= 0) {
    e.dead = true;
    SFX.kill(e.kind === "boss");
    S.gold += e.rw;
    const q = pos(e.d, e.rt);
    if (e.kind === "magma" || e.ab === "rage")
      for (let i = 0, n = e.kind === "boss" ? 4 : 2; i < n; i++) {
        const k = KINDS.ember,
          hp = Math.min(e.max * 0.25, 300);
        S.born.push({
          kind: "ember",
          rt: e.rt,
          d: e.d + i * 8,
          hp,
          max: hp,
          sp: k.sp * (1 + S.wave * 0.01),
          col: k.col,
          r: k.r,
          slow: 0,
          rw: 2,
        });
      }
    S.fx.push({ x: q[0], y: q[1] - 12, t: 0, txt: "+" + e.rw });
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * 6.28;
      S.pt.push({ x: q[0], y: q[1], vx: Math.cos(a) * 55, vy: Math.sin(a) * 55, t: 0, c: e.col });
    }
    ui();
  }
}
function chain(t, first) {
  const d = TYPES[t.k],
    pts = [[t.x, t.y]],
    done = new Set(),
    n = d.chain + t.lv - 1 + (t.ch || 0);
  let cur = first,
    dmg = t.dmg;
  for (let i = 0; i < n && cur; i++) {
    const p = pos(cur.d, cur.rt);
    done.add(cur);
    pts.push(p);
    hit(cur, dmg);
    dmg *= 0.75;
    let nxt = null,
      nd = 75;
    for (const e of S.enemies) {
      if (e.dead || done.has(e)) continue;
      const q = pos(e.d, e.rt),
        dd = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (dd < nd) {
        nd = dd;
        nxt = e;
      }
    }
    cur = nxt;
  }
  S.arcs.push({ pts, t: 0, j: pts.map(() => (Math.random() - 0.5) * 14) });
}
function mk(kn, d, rt) {
  const k = KINDS[kn],
    hp = 20 * Math.pow(1.19, S.wave) * k.hp * MAPS[MI].hpm;
  return {
    kind: kn,
    d,
    rt: rt || 0,
    hp,
    max: hp,
    sp: k.sp * (1 + S.wave * 0.01),
    col: k.col,
    r: k.r,
    slow: 0,
    rw: Math.floor(6 + S.wave / 2),
  };
}
function update(dt) {
  for (const f of S.fx) {
    f.t += dt;
    f.y -= 24 * dt;
  }
  for (const q of S.pt) {
    q.t += dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
  }
  S.fx = S.fx.filter((f) => f.t < 0.9);
  S.pt = S.pt.filter((q) => q.t < 0.4);
  S.rings.forEach((r) => (r.t += dt));
  S.rings = S.rings.filter((r) => r.t < 0.25);
  S.arcs.forEach((a) => (a.t += dt));
  S.arcs = S.arcs.filter((a) => a.t < 0.18);
  S.bt += dt;
  S.hurt = Math.max(0, S.hurt - dt);
  if (S.over) return;
  if (!S.active) {
    S.cd -= dt;
    if (S.cd <= 0) startWave();
  }
  if (S.queue.length) {
    S.spawnT -= dt;
    if (S.spawnT <= 0) {
      const kn = S.queue.shift(),
        en = mk(kn, 0, S.rr++ % ROUTES.length);
      if (kn === "boss") {
        SFX.wave(true);
        const B = MAPS[MI].boss;
        Object.assign(en, {
          ab: B.ab,
          col: B.col,
          name: B.name,
          noSlow: B.noSlow,
          noBurn: B.noBurn,
          noPoison: B.noPoison,
          t: 0,
          rw: 150,
        });
      }
      S.enemies.push(en);
      S.spawnT = 0.8;
    }
  }
  for (const e of S.enemies) {
    if (e.kind === "healer")
      for (const o of S.enemies)
        if (o !== e && !o.dead && (o.rt || 0) === (e.rt || 0) && Math.abs(o.d - e.d) < 60)
          o.hp = Math.min(o.max, o.hp + o.max * 0.05 * dt);
    e.slow = Math.max(0, e.slow - dt);
    if (e.psn > 0) {
      e.psn -= dt;
      hit(e, e.pst * dt);
      if (e.psn <= 0) e.pst = 0;
    }
    if (e.burn > 0) {
      e.burn -= dt;
      hit(e, e.bd * dt);
    }
    if (e.kind === "boss") {
      e.t += dt;
      if (e.ab === "summon" && e.t >= 5) {
        e.t = 0;
        for (let i = 0; i < 2; i++)
          S.born.push(mk("normal", Math.max(0, e.d - 14 * (i + 1)), e.rt));
      }
      if (e.ab === "freeze" && e.t >= 6) {
        e.t = 0;
        const p = pos(e.d, e.rt);
        for (const t of S.towers)
          if (Math.hypot(t.x - p[0], t.y - p[1]) < 130) {
            t.cd = Math.max(t.cd, 2);
            t.fz = 2;
          }
      }
      if (e.ab === "dash") {
        e.dash = (e.dash || 0) - dt;
        if (e.t >= 5) {
          e.t = 0;
          e.dash = 1.2;
        }
      }
      if (e.ab === "rage" && e.hp < e.max * 0.5) e.rage = 1;
      if (e.ab === "regen") e.hp = Math.min(e.max, e.hp + e.max * 0.012 * dt);
    }
    e.d += e.sp * (e.slow > 0 ? 0.5 : 1) * (e.dash > 0 ? 2.5 : 1) * (e.rage ? 1.6 : 1) * dt;
    if (e.d >= ROUTES[e.rt || 0].total && !e.dead) {
      e.dead = true;
      S.lives = Math.max(0, S.lives - (e.kind === "boss" ? 5 : 1));
      S.hurt = 0.35;
      SFX.hurt();
      ui();
      if (S.lives <= 0) {
        S.over = "lose";
        SFX.lose();
      }
    }
  }
  for (const t of S.towers) {
    t.cd -= dt;
    if (t.fz > 0) t.fz -= dt;
    if (t.cd > 0) continue;
    let best = null;
    for (const e of S.enemies) {
      if (e.dead) continue;
      const p = pos(e.d, e.rt);
      if (Math.hypot(p[0] - t.x, p[1] - t.y) <= t.range && (!best || pg(e) > pg(best))) best = e;
    }
    if (best) {
      const q = pos(best.d, best.rt);
      t.ang = Math.atan2(q[1] - t.y, q[0] - t.x);
      t.cd = TYPES[t.k].rate * (t.rm || 1);
      SFX.shoot(t.k);
      if (TYPES[t.k].chain) chain(t, best);
      else S.shots.push({ x: t.x, y: t.y, tg: best, t, a: t.ang });
    }
  }
  for (const s of S.shots) {
    if (s.tg.dead) {
      s.gone = true;
      continue;
    }
    const p = pos(s.tg.d, s.tg.rt),
      dx = p[0] - s.x,
      dy = p[1] - s.y,
      dist = Math.hypot(dx, dy),
      step = (TYPES[s.t.k].sp || 320) * dt;
    if (dist <= step) {
      const d = TYPES[s.t.k];
      if (d.splash) {
        S.rings.push({ x: p[0], y: p[1], r: d.splash + (s.t.sx || 0), t: 0 });
        for (const e of S.enemies) {
          const q = pos(e.d, e.rt);
          if (Math.hypot(q[0] - p[0], q[1] - p[1]) <= d.splash + (s.t.sx || 0)) hit(e, s.t.dmg);
        }
      } else hit(s.tg, s.t.dmg, d.slow ? s.t.sl || 1.5 : 0, d.burn, d.poison ? s.t.dmg * 0.7 : 0);
      s.gone = true;
    } else {
      s.a = Math.atan2(dy, dx);
      s.x += (dx / dist) * step;
      s.y += (dy / dist) * step;
    }
  }
  S.shots = S.shots.filter((s) => !s.gone);
  S.enemies = S.enemies.filter((e) => !e.dead);
  if (S.born.length) {
    S.enemies.push(...S.born);
    S.born = [];
  }
  if (!S.over && S.active && !S.queue.length && !S.enemies.length) {
    S.active = false;
    S.cd = WAIT;
    S.gold += 15 + S.wave * 2;
    if (S.wave >= MAXW) {
      S.over = "win";
      SFX.win();
      unlock(MI + 2);
    }
    ui();
  }
}
/* Mapa (se dibuja una sola vez)  */
const MAP = document.createElement("canvas");
MAP.width = W * T;
MAP.height = H * T;
drawMap();

let TITLE = true;
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!S.paused && !TITLE) for (let i = 0; i < S.speed; i++) update(dt);
  draw();
  const lbl =
    S.over || S.active
      ? S.active
        ? "Oleada en curso"
        : "Iniciar oleada"
      : "Iniciar oleada (" + Math.ceil(S.cd) + "s)";
  if ($("start").textContent !== lbl) $("start").textContent = lbl;
  requestAnimationFrame(loop);
}
function togglePause() {
  if (S.over) return;
  S.paused = !S.paused;
  if ($("pause")) $("pause").textContent = S.paused ? "Reanudar" : "Pausa";
}
if ($("pause")) $("pause").onclick = togglePause;
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (TITLE) return;
  const k = e.key.toLowerCase();
  if (k === " ") {
    e.preventDefault();
    if (document.activeElement) document.activeElement.blur();
    if (!S.paused) startWave();
    return;
  }
  if (k === "p") {
    togglePause();
    return;
  }
  const key = Object.keys(TYPES)[+k - 1];
  if (key && +k >= 1 && (TYPES[key].lvl || 1) <= MI + 1) {
    S.pick = key;
    S.sel = null;
    ui();
  }
});
reset();
requestAnimationFrame(loop);
