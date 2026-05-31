/* ───────────────────────────────────────────────────────────────
   ESMERALDA — Colombia geographic pulse map (choropleth + activity)
   window.EVTMap
   ─────────────────────────────────────────────────────────────── */
(function () {
  // recognizable stylized Colombia silhouette in a 360×440 viewBox
  const COLOMBIA =
    "M232 34 L246 26 L251 40 L240 52 " +            /* La Guajira tip */
    "C214 58 186 60 158 70 " +                       /* Caribbean coast */
    "C140 76 128 86 118 98 " +
    "L108 92 L104 104 " +                            /* Urabá notch */
    "C96 116 86 126 80 142 " +                       /* Pacific NW */
    "C72 168 68 196 68 224 " +                       /* Pacific coast */
    "C68 256 64 284 70 308 " +
    "C74 328 84 344 100 356 " +                      /* SW / Nariño */
    "C128 372 150 380 172 392 " +
    "C196 404 214 408 226 396 " +                    /* Amazon tail */
    "C236 386 240 366 250 344 " +
    "C264 314 276 286 280 252 " +                    /* eastern Llanos bulge */
    "C283 224 280 196 272 170 " +
    "C264 142 256 118 248 96 " +
    "C242 78 236 60 232 46 Z";

  function deptColor(lead) {
    const p = (window.EVT.parties[lead] || {});
    return p.color || "var(--p-otros)";
  }

  function EVTMap({ region, lang, onSelect, selected, compact }) {
    const depts = region.depts || [];
    return (
      React.createElement("svg", {
        viewBox: "0 0 360 440", width: "100%", height: "100%",
        preserveAspectRatio: "xMidYMid meet",
        style: { display: "block", maxHeight: "100%" },
      },
        // faint coordinate grid
        React.createElement("defs", null,
          React.createElement("pattern", { id: "evtgrid", width: "30", height: "30", patternUnits: "userSpaceOnUse" },
            React.createElement("path", { d: "M30 0H0V30", fill: "none", stroke: "var(--grid-line)", strokeWidth: "1" })
          ),
          React.createElement("filter", { id: "evtsoft", x: "-50%", y: "-50%", width: "200%", height: "200%" },
            React.createElement("feGaussianBlur", { stdDeviation: "6" })
          )
        ),
        React.createElement("rect", { x: 0, y: 0, width: 360, height: 440, fill: "url(#evtgrid)", opacity: 0.6 }),

        // silhouette
        React.createElement("path", {
          d: COLOMBIA, fill: "var(--emerald-bg)", stroke: "var(--emerald)",
          strokeWidth: "1.6", strokeLinejoin: "round", opacity: 0.95,
        }),
        React.createElement("path", {
          d: COLOMBIA, fill: "none", stroke: "var(--gold)",
          strokeWidth: "0.6", strokeLinejoin: "round", opacity: 0.4,
          strokeDasharray: "2 4",
        }),

        // departments
        depts.map((d) => {
          const col = deptColor(d.lead);
          const isSel = selected === d.id;
          return React.createElement("g", {
            key: d.id, style: { cursor: "pointer" },
            onClick: () => onSelect && onSelect(d.id),
          },
            // soft glow blob
            React.createElement("circle", {
              cx: d.x, cy: d.y, r: d.r + 6, fill: col, opacity: isSel ? 0.35 : 0.18,
              filter: "url(#evtsoft)",
            }),
            // territory disc
            React.createElement("circle", {
              cx: d.x, cy: d.y, r: d.r, fill: col,
              opacity: isSel ? 0.9 : 0.7,
              stroke: isSel ? "var(--gold-bright)" : "rgba(255,255,255,0.5)",
              strokeWidth: isSel ? 2 : 1,
            }),
            // expanding activity ring
            React.createElement("circle", { cx: d.x, cy: d.y, r: 4, fill: "none", stroke: col, strokeWidth: 1.4 },
              React.createElement("animate", { attributeName: "r", from: d.r, to: d.r + 16, dur: "2.4s", repeatCount: "indefinite", begin: (d.x % 7) / 3 + "s" }),
              React.createElement("animate", { attributeName: "opacity", from: 0.7, to: 0, dur: "2.4s", repeatCount: "indefinite", begin: (d.x % 7) / 3 + "s" })
            ),
            // share label
            !compact && React.createElement("text", {
              x: d.x, y: d.y + 3, textAnchor: "middle",
              fontFamily: "var(--f-mono)", fontSize: "8.5", fontWeight: "700",
              fill: "#fff", style: { pointerEvents: "none" },
            }, d.share + "%"),
            // city name
            !compact && React.createElement("text", {
              x: d.x, y: d.y - d.r - 4, textAnchor: "middle",
              fontFamily: "var(--f-sans)", fontSize: "8", fontWeight: "600",
              fill: "var(--ink-2)", style: { pointerEvents: "none" },
            }, d.city)
          );
        })
      )
    );
  }

  window.EVTMap = EVTMap;
})();
