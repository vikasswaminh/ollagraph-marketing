// ASCII art renderer — Variant 1 "ASCII Web Section"
// Draws a shaded globe + horizon entirely from monospace characters.
// Pure vanilla JS, no dependencies. Static output (crisp, selectable-free).

(function () {
  const RAMP = " .·:;=+*x#%@"; // light → dense
  const W = 66;
  const H = 33;

  function shadeGlobe() {
    const rows = [];
    const R = 14.5;
    const cx = W / 2 - 0.5;
    const cy = H / 2 - 0.5;
    // light from upper-left
    const L = { x: -0.55, y: -0.6, z: 0.58 };

    for (let y = 0; y < H; y++) {
      let row = "";
      for (let x = 0; x < W; x++) {
        const dx = (x - cx) / R;
        const dy = (y - cy) / (R * 0.52); // slight elliptical squash
        const d2 = dx * dx + dy * dy;
        if (d2 > 1) {
          // outside sphere: sparse starfield dots
          const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
          row += (s - Math.floor(s) > 0.985) ? "·" : " ";
          continue;
        }
        const nz = Math.sqrt(1 - d2);
        // lambert
        let lum = dx * L.x + dy * L.y + nz * L.z;
        lum = Math.max(0, lum);
        // meridians / parallels (lat-long wireframe)
        const lon = Math.atan2(dy, dx);
        const lat = Math.asin(Math.max(-1, Math.min(1, dy)));
        const mLon = Math.abs(Math.sin(lon * 6));
        const mLat = Math.abs(Math.sin(lat * 7));
        const wire = (mLon > 0.94 || mLat > 0.94) ? 0.28 : 0;
        // rim darkening at edge
        const rim = d2 > 0.92 ? -0.18 : 0;
        const v = Math.min(1, Math.max(0, lum * 0.85 + wire + rim * -1 * -1));
        const idx = Math.round(v * (RAMP.length - 1));
        row += RAMP[Math.max(1, idx)];
      }
      rows.push(row);
    }
    return rows.join("\n");
  }

  function horizon(width) {
    // a tiny ASCII landscape strip: ridgeline + water ticks
    const lines = [];
    const ridge = "      .=-              .-==-.        :=-.           .-=:      ";
    const water = "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~";
    lines.push(ridge.slice(0, width));
    lines.push(water.slice(0, width));
    return lines.join("\n");
  }

  function mount(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
  }

  function init() {
    mount("ascii-globe", shadeGlobe());
    const strip = document.getElementById("ascii-strip");
    if (strip) mount("ascii-strip", horizon(Math.min(72, Math.floor(strip.clientWidth / 6.4))));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();