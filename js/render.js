/* Dibujo: torres, enemigos y escena (draw). Usa S, X, C, T y TYPES de game.js/data.js. */
/* Torres */
function diamond(r) {
  X.beginPath();
  X.moveTo(0, -r);
  X.lineTo(r * 0.7, 0);
  X.lineTo(0, r);
  X.lineTo(-r * 0.7, 0);
  X.closePath();
}
const OUT = "#1c211d";
function drawTower(t, t0) {
  const x = t.x,
    y = t.y,
    k = t.born ? Math.min(1, (t0 - t.born) * 6) : 1,
    c = TYPES[t.k].col,
    rec = Math.max(0, Math.min(1, t.cd / TYPES[t.k].rate));
  const rect = (a, b, w, h, f) => {
    X.fillStyle = f;
    X.fillRect(a, b, w, h);
    X.strokeRect(a, b, w, h);
  };
  X.save();
  X.translate(x, y);
  X.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
  X.lineJoin = "round";
  X.strokeStyle = OUT;
  X.lineWidth = 2;
  rect(-16, -16, 32, 32, ["#8d9096", "#9fb3c8", "#d4b25c"][t.lv - 1]);
  X.fillStyle = "rgba(255,255,255,.18)";
  X.fillRect(-12, -12, 24, 24);
  X.fillStyle = OUT;
  for (const [a, b] of [
    [-14, -14],
    [11, -14],
    [-14, 11],
    [11, 11],
  ])
    X.fillRect(a, b, 3, 3);
  X.save();
  X.rotate(t.ang || 0);
  X.lineWidth = 1.5;
  if (t.k === "arrow") {
    const px = 9.5 - (1 - rec) * 6;
    rect(-6, -2.5, 20, 5, c);
    rect(8, -9, 3, 18, "#7a5a30");
    X.lineWidth = 1;
    X.beginPath();
    X.moveTo(9.5, -9);
    X.lineTo(px, 0);
    X.lineTo(9.5, 9);
    X.stroke();
    if (rec < 0.5) {
      X.lineWidth = 1.5;
      rect(px, -1, 15, 2, "#e8e2cf");
      X.fillStyle = "#cfd5da";
      X.beginPath();
      X.moveTo(px + 15, -3);
      X.lineTo(px + 21, 0);
      X.lineTo(px + 15, 3);
      X.closePath();
      X.fill();
      X.stroke();
    }
  } else if (t.k === "cannon") {
    rect(-7, -11, 9, 4, "#4a4f58");
    rect(-7, 7, 9, 4, "#4a4f58");
    X.translate(-rec * 3, 0);
    rect(-5, -6, 20, 12, c);
    rect(13, -8, 5, 16, "#4a4f58");
    X.fillStyle = OUT;
    X.fillRect(17, -3, 1.5, 6);
  } else if (t.k === "fire") {
    const fl = 4 + rec * 5 + Math.sin(t0 * 20) * 1.2;
    rect(2, -3.5, 13, 7, "#5a3523");
    rect(13, -5, 4, 10, "#3a2a22");
    X.fillStyle = "#b5432a";
    X.beginPath();
    X.arc(-4, 0, 7, 0, 7);
    X.fill();
    X.stroke();
    rect(-6, -2, 4, 4, "#c9a24a");
    X.fillStyle = c;
    X.beginPath();
    X.moveTo(17, -4);
    X.lineTo(17 + fl * 2.2, 0);
    X.lineTo(17, 4);
    X.closePath();
    X.fill();
    X.stroke();
    X.fillStyle = "#ffd24a";
    X.beginPath();
    X.moveTo(17, -2);
    X.lineTo(17 + fl * 1.2, 0);
    X.lineTo(17, 2);
    X.closePath();
    X.fill();
  } else if (t.k === "mortar") {
    X.translate(-rec * 4, 0);
    rect(-8, -9, 18, 18, "#4a4f58");
    rect(-4, -6, 13, 12, c);
    rect(9, -10, 5, 20, "#33373f");
    X.fillStyle = OUT;
    X.fillRect(13, -5, 1.8, 10);
  }
  X.restore();
  if (t.k === "frost") {
    X.save();
    X.rotate(t0 * 0.5);
    X.lineWidth = 1.5;
    rect(-9, -9, 18, 18, c);
    rect(-5, -5, 10, 10, "#e6f8ff");
    for (const [a, b] of [
      [11, -2],
      [-15, -2],
      [-2, 11],
      [-2, -15],
    ])
      rect(a, b, 4, 4, c);
    X.restore();
  }
  if (t.k === "bolt") {
    X.save();
    X.rotate(t0 * 0.8);
    X.lineWidth = 1.5;
    for (const [a, b] of [
      [9, -2],
      [-13, -2],
      [-2, 9],
      [-2, -13],
    ])
      rect(a, b, 4, 4, "#6a5a8a");
    X.restore();
    X.fillStyle = c;
    X.beginPath();
    X.arc(0, 0, 9, 0, 7);
    X.fill();
    X.stroke();
    X.fillStyle = "#7a5fb0";
    X.beginPath();
    X.arc(0, 0, 5.5, 0, 7);
    X.fill();
    X.stroke();
    X.fillStyle = rec > 0.6 ? "#ffffff" : "#e9dcff";
    X.beginPath();
    X.arc(0, 0, 2.8, 0, 7);
    X.fill();
  }
  if (t.k === "poison") {
    X.fillStyle = "#3d3a33";
    X.beginPath();
    X.arc(0, 0, 11, 0, 7);
    X.fill();
    X.stroke();
    X.fillStyle = c;
    X.beginPath();
    X.arc(0, 0, 8, 0, 7);
    X.fill();
    X.stroke();
    X.fillStyle = "#d8f5b0";
    for (let i = 0; i < 3; i++) {
      const a = t0 * 1.3 + i * 2.1,
        rr = 3 + Math.sin(t0 * 3 + i) * 2;
      X.beginPath();
      X.arc(Math.cos(a) * rr, Math.sin(a) * rr, 1.8 + ((i + 1) % 2), 0, 7);
      X.fill();
    }
  }
  if (t.fz > 0) {
    X.fillStyle = "rgba(124,196,224,.6)";
    X.fillRect(-16, -16, 32, 32);
  }
  X.lineWidth = 1;
  for (let i = 0; i < t.lv; i++) rect(-10 + i * 7, 10, 5, 4, t.path === 1 ? "#9fd8ff" : "#f4efe0");
  X.restore();
}

/*Enemigos*/
const sh = (c, f) => {
  const n = parseInt(c.slice(1), 16),
    a = (v) => Math.round(v * f);
  return "rgb(" + a(n >> 16) + "," + a((n >> 8) & 255) + "," + a(n & 255) + ")";
};
function drawEnemy(e, t0) {
  const p = pos(e.d, e.rt),
    q = pos(e.d + 2, e.rt),
    r = e.r,
    x = p[0],
    y = p[1],
    k = e.kind,
    an = Math.atan2(q[1] - p[1], q[0] - p[0]);
  const ph = e.d * 0.16,
    sw = Math.sin(t0 * 8 + e.d * 0.05),
    bob = Math.abs(Math.sin(ph)) * 1.3;
  const body = e.slow > 0 ? "#7cc4e0" : e.burn > 0 ? "#ff9a4a" : e.psn > 0 ? "#8bd45a" : e.col,
    dk = sh(body, 0.72);
  const STEEL = "#dfe4e6",
    WOOD = "#8a5a2b",
    BOOT = "#3a2a22",
    HELM = "#8a8f99",
    RED = "#d9674f";
  const rect = (a, b, w, h, c) => {
    X.fillStyle = c;
    X.fillRect(a, b, w, h);
    X.strokeRect(a, b, w, h);
  };
  const dot = (a, b, rr, c) => {
    X.fillStyle = c;
    X.beginPath();
    X.arc(a, b, rr, 0, 7);
    X.fill();
  };
  const poly = (pts, c) => {
    X.fillStyle = c;
    X.beginPath();
    pts.forEach((v, i) => (i ? X.lineTo(v[0], v[1]) : X.moveTo(v[0], v[1])));
    X.closePath();
    X.fill();
    X.stroke();
  };
  const disc = (rr, c) => {
    X.lineWidth = 2;
    X.fillStyle = c || body;
    X.beginPath();
    X.arc(0, 0, rr || r, 0, 7);
    X.fill();
    X.stroke();
    X.lineWidth = 1.5;
  };
  const eyes = (ex, sp, rr) => {
    for (const s of [-1, 1]) {
      dot(ex, s * sp, rr, "#fff");
      dot(ex + rr * 0.35, s * sp, rr * 0.5, OUT);
    }
  };
  const feet = () => {
    for (const s of [-1, 1]) {
      X.fillStyle = BOOT;
      X.beginPath();
      X.ellipse(
        Math.sin(ph + (s > 0 ? 0 : Math.PI)) * r * 0.5,
        s * r * 0.8,
        r * 0.32,
        r * 0.22,
        0,
        0,
        7,
      );
      X.fill();
      X.stroke();
    }
  };
  const arm = (len, tip, swing) => {
    X.save();
    X.translate(r * 0.35, r * 0.9);
    X.rotate(sw * swing - 0.15);
    rect(0, -1.5, len, 3, WOOD);
    tip();
    X.restore();
  };
  X.save();
  X.translate(x, y);
  X.fillStyle = "rgba(0,0,0,.25)";
  X.beginPath();
  X.ellipse(0, r * 0.85, r * 0.95, r * 0.38, 0, 0, 7);
  X.fill();
  X.translate(0, -bob);
  X.rotate(an);
  X.lineJoin = "round";
  X.strokeStyle = OUT;
  X.lineWidth = 1.5;
  if (k === "fast") {
    feet();
    for (const s of [-1, 1]) {
      X.save();
      X.translate(r * 0.2, s * r * 0.9);
      X.rotate(sw * 0.4 * s);
      rect(0, -1.5, 5, 3, WOOD);
      rect(5, -1.5, 9, 3, STEEL);
      X.restore();
    }
    poly(
      [
        [-r * 0.6, -2],
        [-r - 9 - sw * 2, -6],
        [-r - 6, 0],
        [-r - 9 + sw * 2, 6],
        [-r * 0.6, 2],
      ],
      RED,
    );
    disc();
    X.save();
    X.translate(-r * 0.2, 0);
    disc(r * 0.7, dk);
    X.restore();
    eyes(r * 0.55, r * 0.35, r * 0.22);
  } else if (k === "tank") {
    feet();
    arm(r + 4, () => rect(r + 3, -4, 6, 8, "#7b7f88"), 0.3);
    X.lineWidth = 2;
    X.fillStyle = body;
    X.fillRect(-r, -r, r * 2, r * 2);
    X.strokeRect(-r, -r, r * 2, r * 2);
    X.lineWidth = 1.5;
    rect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2, dk);
    for (const [a, b] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ])
      dot(a * r * 0.8, b * r * 0.8, 1.4, STEEL);
    X.save();
    X.translate(r * 0.1, 0);
    disc(r * 0.55, "#9aa0aa");
    X.restore();
    rect(r * 0.4, -1.5, r * 0.35, 3, OUT);
    rect(-r * 0.9, -2, r * 0.5, 4, RED);
    rect(r - 1, -r * 0.85, 5, r * 1.7, "#9aa0aa");
    rect(r + 1, -2, 3, 4, RED);
  } else if (k === "healer") {
    feet();
    arm(r + 6, () => dot(r + 8, 0, 3.5 + Math.sin(t0 * 5) * 0.8, "#8bf0a0"), 0.25);
    disc();
    X.strokeStyle = "#f0d070";
    X.lineWidth = 2;
    X.beginPath();
    X.arc(0, 0, r + 3, 0, 7);
    X.stroke();
    X.strokeStyle = OUT;
    X.lineWidth = 1.5;
    X.fillStyle = "#fff";
    X.fillRect(-r * 0.55, -1.8, r * 0.9, 3.6);
    X.fillRect(-r * 0.35 - 1.8, -r * 0.55, 3.6, r * 1.1);
    eyes(r * 0.58, r * 0.34, r * 0.22);
  } else if (k === "yeti") {
    feet();
    arm(r + 6, () => rect(r + 4, -5, 8, 10, "#9fd0e6"), 0.3);
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5;
      poly(
        [
          [Math.cos(a - 0.2) * r * 0.9, Math.sin(a - 0.2) * r * 0.9],
          [Math.cos(a) * (r + 4), Math.sin(a) * (r + 4)],
          [Math.cos(a + 0.2) * r * 0.9, Math.sin(a + 0.2) * r * 0.9],
        ],
        dk,
      );
    }
    disc();
    eyes(r * 0.55, r * 0.38, r * 0.26);
    X.lineWidth = 2;
    for (const s of [-1, 1]) {
      X.beginPath();
      X.moveTo(r * 0.3, s * r * 0.65);
      X.lineTo(r * 0.85, s * r * 0.2);
      X.stroke();
    }
  } else if (k === "scorpion") {
    X.lineWidth = 2;
    for (const s of [-1, 1])
      for (let i = 0; i < 3; i++) {
        const bx = -r * 0.4 + i * r * 0.45;
        X.beginPath();
        X.moveTo(bx, s * r * 0.5);
        X.lineTo(bx + 3, s * (r + 5 + Math.sin(ph + i * 2) * 2));
        X.stroke();
      }
    X.lineWidth = 1.5;
    [
      [-r, 0, 3.6],
      [-r - 6, -5, 3.2],
      [-r - 8, -11, 2.8],
      [-r - 4, -16, 2.4],
    ].forEach((v) => {
      X.fillStyle = body;
      X.beginPath();
      X.arc(v[0], v[1], v[2], 0, 7);
      X.fill();
      X.stroke();
    });
    poly(
      [
        [-r - 4, -16],
        [-r + 2, -21],
        [-r + 1, -13],
      ],
      "#e0b84f",
    );
    for (const s of [-1, 1]) {
      rect(r - 3, s * (r - 1) - 1.5, 8, 3, body);
      poly(
        [
          [r + 5, s * (r - 1) - 3],
          [r + 11, s * (r - 1)],
          [r + 5, s * (r - 1) + 3],
        ],
        STEEL,
      );
    }
    X.lineWidth = 2;
    X.fillStyle = body;
    X.beginPath();
    X.ellipse(0, 0, r + 1, r - 2, 0, 0, 7);
    X.fill();
    X.stroke();
    X.lineWidth = 1.5;
    rect(-r * 0.2, -r * 0.5, 3, r, dk);
    eyes(r * 0.55, r * 0.3, r * 0.2);
  } else if (k === "magma") {
    feet();
    arm(r + 4, () => rect(r + 3, -6, 9, 12, "#4a3a38"), 0.25);
    poly(
      [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i * Math.PI) / 4,
          m = [1, 0.88, 1.05, 0.9, 1, 0.86, 1.06, 0.92][i];
        return [Math.cos(a) * r * m, Math.sin(a) * r * m];
      }),
      body,
    );
    X.strokeStyle = "#ffd24a";
    X.lineWidth = 1.5;
    X.beginPath();
    X.moveTo(-r * 0.6, -r * 0.3);
    X.lineTo(0, r * 0.1);
    X.lineTo(r * 0.3, -r * 0.5);
    X.moveTo(0, r * 0.1);
    X.lineTo(-r * 0.2, r * 0.7);
    X.stroke();
    X.strokeStyle = OUT;
    X.fillStyle = "#ffd24a";
    X.fillRect(r * 0.45, -r * 0.45, 3, 2.4);
    X.fillRect(r * 0.45, r * 0.2, 3, 2.4);
  } else if (k === "ember") {
    poly(
      [
        [r + 3, 0],
        [0, -r],
        [-r - 4, 0],
        [0, r],
      ],
      body,
    );
    poly(
      [
        [r * 0.5, 0],
        [0, -r * 0.45],
        [-r * 0.7, 0],
        [0, r * 0.45],
      ],
      "#ffd24a",
    );
    dot(r * 0.3, -r * 0.3, 1.2, OUT);
    dot(r * 0.3, r * 0.3, 1.2, OUT);
  } else if (k === "cieno") {
    const rr = r * (1 + Math.sin(t0 * 6 + e.d * 0.1) * 0.06);
    arm(
      r + 8,
      () =>
        poly(
          [
            [r + 8, -4],
            [r + 15, 0],
            [r + 8, 4],
          ],
          STEEL,
        ),
      0.3,
    );
    disc(rr);
    dot(-r * 0.3, -r * 0.3, 2, "#a8c97f");
    dot(-r * 0.1, r * 0.35, 1.6, "#a8c97f");
    dot(-r * 0.55, r * 0.1, 1.4, "#a8c97f");
    eyes(r * 0.5, r * 0.34, r * 0.3);
  } else if (k === "boss") {
    poly(
      [
        [-r * 0.5, -r * 0.9],
        [-r - 10 - sw * 2, -r * 0.6],
        [-r - 12, r * 0.6],
        [-r * 0.5, r * 0.9],
      ],
      dk,
    );
    feet();
    arm(r + 8, () => rect(r + 6, -8, 10, 16, "#7b7f88"), 0.25);
    disc();
    for (const s of [-1, 1]) {
      X.fillStyle = "#9aa0aa";
      X.beginPath();
      X.arc(0, s * r * 0.95, 4.5, 0, 7);
      X.fill();
      X.stroke();
      poly(
        [
          [r * 0.3, s * r * 0.5],
          [r * 0.95, s * r * 0.95],
          [r * 0.8, s * r * 0.3],
        ],
        "#d8c9a8",
      );
    }
    for (const s of [-1, 0, 1])
      poly(
        [
          [r * 0.15, s * r * 0.5 - 4],
          [r * 0.15 + 7, s * r * 0.5],
          [r * 0.15, s * r * 0.5 + 4],
        ],
        "#e0b84f",
      );
    for (const s of [-1, 1]) {
      dot(r * 0.55, s * r * 0.35, 3.2, "#fff");
      dot(r * 0.62, s * r * 0.35, 1.8, "#d9322a");
    }
  } else {
    feet();
    arm(
      5,
      () => {
        rect(3, -4, 2.5, 8, "#c9a96b");
        rect(5.5, -1.5, r + 6, 3, STEEL);
      },
      0.35,
    );
    disc();
    X.save();
    X.translate(-r * 0.1, 0);
    disc(r * 0.66, HELM);
    X.restore();
    rect(-r * 0.95, -2, r * 0.5, 4, RED);
    eyes(r * 0.62, r * 0.36, r * 0.24);
  }
  if (k !== "tank" && k !== "ember") {
    X.rotate(-an);
    dot(-r * 0.35, -r * 0.4, r * 0.2, "rgba(255,255,255,.3)");
  }
  X.restore();
  if (e.hp < e.max) {
    X.fillStyle = OUT;
    X.fillRect(x - 13, y - r - 11, 26, 5);
    X.fillStyle = e.hp / e.max > 0.4 ? "#6fcf7a" : "#e0b84f";
    X.fillRect(x - 12, y - r - 10, 24 * Math.max(0, e.hp / e.max), 3);
  }
}

/* Dibujo */
function draw() {
  X.drawImage(MAP, 0, 0);
  const t0 = performance.now() / 1000;
  const hx = Math.floor(S.mx / T),
    hy = Math.floor(S.my / T);
  if (S.mx >= 0 && !S.over) {
    const d = TYPES[S.pick],
      onP = path.has(hx + "," + hy),
      bad = onP || S.gold < d.cost || S.towers.some((t) => t.cx === hx && t.cy === hy);
    X.fillStyle = bad ? "rgba(217,103,79,.3)" : "rgba(255,255,255,.2)";
    X.fillRect(hx * T, hy * T, T, T);
    if (!onP) {
      X.fillStyle = "rgba(255,255,255,.06)";
      X.strokeStyle = bad ? "rgba(217,103,79,.6)" : "rgba(255,255,255,.5)";
      X.lineWidth = 1.5;
      X.beginPath();
      X.arc(hx * T + T / 2, hy * T + T / 2, d.range, 0, 7);
      X.fill();
      X.stroke();
    }
  }
  for (const t of S.towers) {
    if (t === S.sel) {
      X.fillStyle = "rgba(255,255,255,.08)";
      X.strokeStyle = "#fff";
      X.lineWidth = 1.5;
      X.beginPath();
      X.arc(t.x, t.y, t.range, 0, 7);
      X.fill();
      X.stroke();
    }
    drawTower(t, t0);
  }
  for (const e of S.enemies) drawEnemy(e, t0);
  const bs = S.enemies.find((e) => e.kind === "boss");
  if (bs) {
    const bx = C.width / 2 - 150;
    X.fillStyle = OUT;
    X.fillRect(bx - 2, 10, 304, 20);
    X.fillStyle = "#d9674f";
    X.fillRect(bx, 12, 300 * Math.max(0, bs.hp / bs.max), 16);
    X.fillStyle = "#fff";
    X.font = "bold 12px sans-serif";
    X.textAlign = "center";
    X.fillText(bs.name, C.width / 2, 24);
  }
  for (const s of S.shots) {
    X.fillStyle = TYPES[s.t.k].col;
    X.strokeStyle = OUT;
    X.lineWidth = 1.5;
    const z = s.t.k === "mortar" ? 5 : 3;
    X.fillRect(s.x - z, s.y - z, z * 2, z * 2);
    X.strokeRect(s.x - z, s.y - z, z * 2, z * 2);
  }
  for (const r of S.rings) {
    X.strokeStyle = "rgba(255,255,255," + (1 - r.t / 0.25) * 0.8 + ")";
    X.lineWidth = 3;
    X.beginPath();
    X.arc(r.x, r.y, r.r * (0.4 + (r.t / 0.25) * 0.6), 0, 7);
    X.stroke();
  }
  for (const a of S.arcs) {
    for (const w of [
      [OUT, 5],
      ["#e9dcff", 2.5],
    ]) {
      X.strokeStyle = w[0];
      X.lineWidth = w[1];
      X.lineJoin = "round";
      X.beginPath();
      a.pts.forEach((p, i) => {
        if (!i) {
          X.moveTo(p[0], p[1]);
          return;
        }
        const o = a.pts[i - 1],
          j = a.j[i];
        X.lineTo((o[0] + p[0]) / 2 + j, (o[1] + p[1]) / 2 - j);
        X.lineTo(p[0], p[1]);
      });
      X.stroke();
    }
  }
  for (const q of S.pt) {
    X.globalAlpha = 1 - q.t / 0.4;
    X.fillStyle = q.c;
    X.beginPath();
    X.arc(q.x, q.y, 3, 0, 7);
    X.fill();
  }
  X.font = "bold 14px sans-serif";
  X.textAlign = "center";
  X.lineWidth = 3;
  X.strokeStyle = "#10191a";
  for (const f of S.fx) {
    X.globalAlpha = 1 - f.t / 0.9;
    X.strokeText(f.txt, f.x, f.y);
    X.fillStyle = "#ffd24a";
    X.fillText(f.txt, f.x, f.y);
  }
  X.globalAlpha = 1;
  if (S.hurt > 0) {
    X.fillStyle = "rgba(217,103,79," + S.hurt * 0.7 + ")";
    X.fillRect(0, 0, C.width, C.height);
  }
  if (S.bt < 1.8) {
    const a = Math.min(1, S.bt / 0.3, (1.8 - S.bt) / 0.5),
      sub =
        S.wave === MAXW
          ? "¡Jefe: " + MAPS[MI].boss.name + "!"
          : S.wave % 5 === 0
            ? "¡Llegan los acorazados!"
            : S.wave % 3 === 0
              ? "¡Enemigos veloces!"
              : S.wave >= 3 && MAPS[MI].foe
                ? "Refuerzo: " + KINDS[MAPS[MI].foe].lbl
                : "";
    X.globalAlpha = a;
    X.textAlign = "center";
    X.lineJoin = "round";
    X.lineWidth = 5;
    X.strokeStyle = "#10191a";
    X.font = "bold 38px sans-serif";
    X.strokeText("Oleada " + S.wave, C.width / 2, 56);
    X.fillStyle = "#e0b84f";
    X.fillText("Oleada " + S.wave, C.width / 2, 56);
    if (sub) {
      X.font = "italic 17px sans-serif";
      X.lineWidth = 4;
      X.strokeText(sub, C.width / 2, 82);
      X.fillStyle = "#e8e2cf";
      X.fillText(sub, C.width / 2, 82);
    }
    X.globalAlpha = 1;
  }
  if (S.paused && !S.over) {
    X.fillStyle = "rgba(16,25,26,.6)";
    X.fillRect(0, 0, C.width, C.height);
    X.fillStyle = "#e8e2cf";
    X.font = "bold 36px sans-serif";
    X.textAlign = "center";
    X.fillText("Pausa", C.width / 2, C.height / 2);
    X.font = "16px sans-serif";
    X.fillText("Pulsa P para continuar", C.width / 2, C.height / 2 + 30);
  }
  if (S.over) {
    X.fillStyle = "rgba(16,25,26,.8)";
    X.fillRect(0, 0, C.width, C.height);
    X.fillStyle = S.over === "win" ? "#e0b84f" : "#d9674f";
    X.font = "bold 36px sans-serif";
    X.textAlign = "center";
    X.fillText(S.over === "win" ? "¡Nivel superado!" : "Derrota", C.width / 2, C.height / 2);
    X.fillStyle = "#e8e2cf";
    X.font = "16px sans-serif";
    X.fillText(
      S.over === "win"
        ? MI + 1 < MAPS.length
          ? 'Pulsa "Siguiente nivel" para continuar'
          : "¡Completaste todos los niveles!"
        : "Pulsa Reiniciar para reintentar",
      C.width / 2,
      C.height / 2 + 30,
    );
  }
}
