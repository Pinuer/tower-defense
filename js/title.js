/* Pantalla de inicio: fondo animado con el mapa real y enemigos marchando. */
(function () {
  const el = document.getElementById("title");
  const cv = document.getElementById("tcv");
  const tx = cv.getContext("2d");
  const meta = document.getElementById("tmeta");
  const COLORS = ["#c0584a", "#d9a441", "#6fa86a", "#5b8fb9"];
  let t0 = performance.now(),
    raf = 0;

  meta.textContent =
    "5 niveles · 20 oleadas · Niveles desbloqueados: " + (typeof unlocked === "number" ? unlocked : 1) + "/" + MAPS.length;

  // posición a lo largo del camino (en píxeles)
  const seg = [];
  let total = 0;
  for (let i = 1; i < WP.length; i++) {
    const l = Math.hypot(WP[i][0] - WP[i - 1][0], WP[i][1] - WP[i - 1][1]);
    seg.push(l);
    total += l;
  }
  function at(d) {
    d = ((d % total) + total) % total;
    for (let i = 0; i < seg.length; i++) {
      if (d <= seg[i]) {
        const f = d / seg[i];
        return [WP[i][0] + (WP[i + 1][0] - WP[i][0]) * f, WP[i][1] + (WP[i + 1][1] - WP[i][1]) * f];
      }
      d -= seg[i];
    }
    return WP[WP.length - 1];
  }

  function frame(now) {
    const s = (now - t0) / 1000;
    tx.imageSmoothingEnabled = false;
    tx.drawImage(MAP, 0, 0);
    // enemigos en fila
    for (let i = 0; i < 9; i++) {
      const [x, y] = at(s * 55 - i * 46);
      const c = COLORS[i % COLORS.length];
      tx.fillStyle = "rgba(0,0,0,.35)";
      tx.fillRect(x - 8, y + 6, 16, 4);
      tx.fillStyle = c;
      tx.fillRect(x - 8, y - 8 + Math.round(Math.sin(s * 8 + i) * 1.5), 16, 16);
      tx.fillStyle = "#1c211d";
      tx.fillRect(x - 4, y - 4, 3, 3);
      tx.fillRect(x + 2, y - 4, 3, 3);
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  let started = false;
  function begin(e) {
    if (started) return;
    started = true;
    if (e) e.stopPropagation();
    TITLE = false;
    SFX.start();
    el.classList.add("out");
    cancelAnimationFrame(raf);
    setTimeout(() => el.remove(), 500);
    document.removeEventListener("keydown", onKey, true);
  }
  function onKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      begin();
    }
  }
  el.addEventListener("click", begin);
  document.addEventListener("keydown", onKey, true);
  document.getElementById("play").focus();
})();
