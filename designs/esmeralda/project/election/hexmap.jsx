/* ───────────────────────────────────────────────────────────────
   ESMERALDA — department hex-tile cartogram
   Expert tile-grid map: 1 hexagon per department, geographic-ish
   placement, color = leading party, fill intensity = margin.
   window.EVTHexMap
   ─────────────────────────────────────────────────────────────── */
(function () {
  const S = 22;                       // hex size (center → vertex)
  const W = Math.sqrt(3) * S;         // hex width (pointy-top)
  const H = 2 * S;                    // hex height
  const VSTEP = 0.75 * H;             // row vertical step

  function hexPoints(cx, cy, size) {
    const s = size || S;
    let p = "";
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 90);   // pointy-top
      p += (cx + s * Math.cos(a)).toFixed(1) + "," + (cy + s * Math.sin(a)).toFixed(1) + " ";
    }
    return p.trim();
  }

  function EVTHexMap({ region, selected, onSelect, compact, maxMargin = 14 }) {
    const cells = region.deptsHex || [];
    if (!cells.length) return React.createElement("div", { style: { color: "var(--dim)", fontSize: 13, padding: 24, textAlign: "center" } }, "—");

    // positions
    const placed = cells.map((d) => {
      const cx = d.col * W + (d.row % 2 ? W / 2 : 0);
      const cy = d.row * VSTEP;
      return { ...d, cx, cy };
    });
    const xs = placed.map((p) => p.cx), ys = placed.map((p) => p.cy);
    const pad = S + 6;
    const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
    const vb = [minX, minY, maxX - minX, maxY - minY].map((n) => n.toFixed(1)).join(" ");

    const intensity = (m) => 0.28 + Math.min(1, m / maxMargin) * 0.6;

    return React.createElement("svg", {
      viewBox: vb, width: "100%", height: "100%",
      preserveAspectRatio: "xMidYMid meet", style: { display: "block" },
    },
      placed.map((d) => {
        const col = window.EVT.parties[d.lead].color;
        const isSel = selected === d.id;
        const op = intensity(d.margin);
        return React.createElement("g", {
          key: d.id, style: { cursor: "pointer", transition: "transform .15s" },
          onClick: () => onSelect && onSelect(isSel ? null : d.id),
          transform: isSel ? `translate(${d.cx} ${d.cy}) scale(1.12) translate(${-d.cx} ${-d.cy})` : undefined,
        },
          React.createElement("title", null, `${d.name} · ${window.EVT.parties[d.lead].abbr} +${d.margin} · ${d.rep}%`),
          // live pulse ring (slightly larger outline, fades in place)
          d.live && React.createElement("polygon", { points: hexPoints(d.cx, d.cy, S + 4), fill: "none", stroke: col, strokeWidth: 1.5 },
            React.createElement("animate", { attributeName: "stroke-opacity", values: "0.85;0;0.85", dur: "2.2s", repeatCount: "indefinite" })
          ),
          // hex fill
          React.createElement("polygon", {
            points: hexPoints(d.cx, d.cy),
            fill: col, fillOpacity: isSel ? Math.min(0.95, op + 0.2) : op,
            stroke: isSel ? "var(--gold-bright)" : col,
            strokeOpacity: isSel ? 1 : 0.85,
            strokeWidth: isSel ? 2 : 1.1,
            style: { transition: "fill-opacity .3s" },
          }),
          // label
          !compact && React.createElement("text", {
            x: d.cx, y: d.cy - 1, textAnchor: "middle",
            fontFamily: "var(--f-mono)", fontSize: 8.5, fontWeight: 700,
            fill: "var(--ink)", style: { pointerEvents: "none", paintOrder: "stroke" },
            stroke: "var(--bg)", strokeWidth: 2.2, strokeLinejoin: "round",
          }, d.abbr),
          !compact && React.createElement("text", {
            x: d.cx, y: d.cy + 9, textAnchor: "middle",
            fontFamily: "var(--f-mono)", fontSize: 6.5, fontWeight: 700,
            fill: "var(--ink)", fillOpacity: 0.7, style: { pointerEvents: "none", paintOrder: "stroke" },
            stroke: "var(--bg)", strokeWidth: 1.8, strokeLinejoin: "round",
          }, "+" + d.margin)
        );
      })
    );
  }

  window.EVTHexMap = EVTHexMap;
})();
