/* ───────────────────────────────────────────────────────────────
   ESMERALDA — shared component library + live-data provider
   Exports to window: EVTProvider, useEVT, and all module components.
   Load AFTER data.js and map.jsx.
   ─────────────────────────────────────────────────────────────── */
(function () {
  const { useState, useEffect, useRef, useContext, createContext, useCallback } = React;
  const Ctx = createContext(null);
  const useEVT = () => useContext(Ctx);

  // locale-aware number → string (Spanish uses comma decimal)
  const fmt = (n, dec, lang) => {
    const s = Number(n).toFixed(dec);
    return lang === "es" ? s.replace(".", ",") : s;
  };

  // extra sample posts to inject as the night progresses
  const POOL = [
    { author: "Conteo Rápido", handle: "@conteorapido", v: true,
      en: "Cundinamarca boxes flipping in: Pacto extends lead to +7 with urban Bogotá fully counted.",
      es: "Entran urnas de Cundinamarca: el Pacto amplía la ventaja a +7 con Bogotá urbana totalmente escrutada." },
    { author: "Observador Andino", handle: "@obs_andino", v: false,
      en: "Santander surprise — CD lead narrows to under a point as Bucaramanga metro reports.",
      es: "Sorpresa en Santander — la ventaja del CD baja de un punto al reportar el área metropolitana de Bucaramanga." },
    { author: "Pacífico Noticias", handle: "@pacifico_n", v: true,
      en: "Valle del Cauca: Verde coalition holding the lead, strongest youth turnout in the country.",
      es: "Valle del Cauca: la coalición Verde mantiene la ventaja, la mayor participación joven del país." },
    { author: "Datos Electorales", handle: "@datos_elec", v: true,
      en: "National projection stable: trace engine flags no anomaly between primary clips and official tally.",
      es: "Proyección nacional estable: el motor de traza no detecta anomalías entre los videos primarios y el conteo oficial." },
  ];

  // ─────────────── Provider ───────────────
  function EVTProvider({ children }) {
    const [lang, setLang] = useState("es");
    const [theme, setTheme] = useState("dark");
    const [regionKey, setRegionKey] = useState("colombia");
    const [tick, setTick] = useState(0);
    const [feed, setFeed] = useState(() => EVT.regions.colombia.posts.map((p) => ({ ...p })));
    const [lastUpdate, setLastUpdate] = useState(0);
    const poolIdx = useRef(0);
    const newId = useRef(1000);

    // reset feed when region changes
    useEffect(() => {
      setFeed(EVT.regions[regionKey].posts.map((p) => ({ ...p })));
      setLastUpdate(0);
    }, [regionKey]);

    // live-sim loop
    useEffect(() => {
      const iv = setInterval(() => {
        EVT.nudge(EVT.regions[regionKey]);
        setTick((t) => t + 1);
        setLastUpdate(0);
        // every ~2 ticks inject a fresh post (Colombia only — others sparse)
        if (regionKey === "colombia" && Math.random() < 0.6) {
          const base = POOL[poolIdx.current % POOL.length];
          poolIdx.current++;
          const np = { ...base, id: newId.current++, v: base.v, isNew: true };
          setFeed((f) => [np, ...f.map((x) => ({ ...x, isNew: false }))].slice(0, 6));
        }
      }, 2600);
      return () => clearInterval(iv);
    }, [regionKey]);

    // seconds-since-update counter
    useEffect(() => {
      const iv = setInterval(() => setLastUpdate((s) => s + 1), 1000);
      return () => clearInterval(iv);
    }, []);

    const t = useCallback((k) => (EVT.i18n[lang] || EVT.i18n.en)[k] || k, [lang]);
    const region = EVT.regions[regionKey];
    const val = { lang, setLang, theme, setTheme, regionKey, setRegionKey, region, tick, feed, lastUpdate, t, fmt: (n, d) => fmt(n, d, lang) };
    return React.createElement(Ctx.Provider, { value: val }, children);
  }

  // ─────────────── AnimatedNumber ───────────────
  function AnimatedNumber({ value, dec = 1, className, style }) {
    const { lang } = useEVT();
    const [disp, setDisp] = useState(value);
    const from = useRef(value);
    const raf = useRef(0);
    const flashRef = useRef(null);
    useEffect(() => {
      cancelAnimationFrame(raf.current);
      const start = performance.now();
      const a = from.current, b = value;
      const dur = 900;
      const step = (now) => {
        const k = Math.min(1, (now - start) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        setDisp(a + (b - a) * e);
        if (k < 1) raf.current = requestAnimationFrame(step);
        else { from.current = b; }
      };
      raf.current = requestAnimationFrame(step);
      if (flashRef.current) { flashRef.current.classList.remove("flash"); void flashRef.current.offsetWidth; flashRef.current.classList.add("flash"); }
      return () => cancelAnimationFrame(raf.current);
    }, [value]);
    return React.createElement("span", { ref: flashRef, className: "num " + (className || ""), style },
      lang === "es" ? disp.toFixed(dec).replace(".", ",") : disp.toFixed(dec));
  }

  // ─────────────── Logo / wordmark ───────────────
  function Logo({ size = 34 }) {
    return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 11 } },
      React.createElement("svg", { width: size, height: size, viewBox: "0 0 40 40", style: { flex: "0 0 auto", filter: "var(--glow)" } },
        // emerald-cut gem
        React.createElement("polygon", { points: "20,3 33,11 33,29 20,37 7,29 7,11", fill: "var(--emerald-bg)", stroke: "var(--emerald)", strokeWidth: "1.6", strokeLinejoin: "round" }),
        React.createElement("polygon", { points: "20,3 33,11 26,15 14,15 7,11", fill: "var(--emerald)", opacity: "0.35" }),
        React.createElement("path", { d: "M14 15 L26 15 L29 28 L20 34 L11 28 Z", fill: "none", stroke: "var(--gold)", strokeWidth: "1", opacity: "0.8" }),
        React.createElement("path", { d: "M20 15 L20 34 M14 15 L11 28 M26 15 L29 28", stroke: "var(--emerald-bright)", strokeWidth: "0.8", opacity: "0.7" })
      ),
      React.createElement("div", { style: { lineHeight: 1 } },
        React.createElement("div", { style: { fontFamily: "var(--f-display)", fontStyle: "italic", fontWeight: 300, fontSize: size * 0.62, color: "var(--ink)", letterSpacing: "-0.02em" } }, "Esmeralda"),
        React.createElement("div", { className: "eyebrow", style: { fontSize: 8, marginTop: 2 } }, "ELECTION OS")
      )
    );
  }

  // ─────────────── small bits ───────────────
  function LiveBadge() {
    const { t, lastUpdate } = useEVT();
    return React.createElement("div", { className: "chip", style: { borderColor: "var(--border-2)", color: "var(--ink)" } },
      React.createElement("span", { className: "livedot" }),
      React.createElement("span", { style: { color: "var(--bad)", fontWeight: 700 } }, t("live")),
      React.createElement("span", { style: { opacity: 0.4 } }, "·"),
      React.createElement("span", { style: { color: "var(--dim)", fontWeight: 500 } }, t("updated") + " " + lastUpdate + "s " + t("ago"))
    );
  }

  function SectionLabel({ children, accent }) {
    return React.createElement("div", { className: "eyebrow", style: { display: "flex", alignItems: "center", gap: 8, color: accent ? "var(--gold)" : "var(--dim)" } },
      React.createElement("span", { style: { width: 14, height: 2, background: accent ? "var(--gold)" : "var(--emerald)", borderRadius: 2 } }),
      children
    );
  }

  function RegionSwitcher() {
    const { regionKey, setRegionKey, lang } = useEVT();
    return React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
      Object.keys(EVT.regions).map((k) => {
        const r = EVT.regions[k]; const on = k === regionKey;
        return React.createElement("button", {
          key: k, onClick: () => setRegionKey(k),
          style: {
            display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
            padding: "7px 13px", borderRadius: 999, fontFamily: "var(--f-sans)",
            fontSize: 12.5, fontWeight: 600,
            border: "1px solid " + (on ? "var(--emerald)" : "var(--border)"),
            background: on ? "var(--emerald-bg)" : "transparent",
            color: on ? "var(--ink)" : "var(--dim)",
            boxShadow: on ? "var(--glow)" : "none",
            transition: "all .2s",
          },
        },
          React.createElement("span", { style: { fontSize: 14 } }, r.flag),
          r.name[lang]
        );
      })
    );
  }

  // ─────────────── Projected leader (big moment) ───────────────
  function ProjectedLeader({ big }) {
    const { region, t, lang } = useEVT();
    const p = EVT.parties[region.leader];
    const top = region.results.find((x) => x.party === region.leader);
    const sorted = [...region.results].filter(x=>x.party!=="otros").sort((a,b)=>b.xProj-a.xProj);
    const margin = sorted.length>1 ? (sorted[0].xProj - sorted[1].xProj) : 0;
    const close = margin < 2;
    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: big ? 6 : 4 } },
      React.createElement(SectionLabel, { accent: true }, t("projectedWinner")),
      React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 14, marginTop: 4 } },
        React.createElement("div", { style: { width: big ? 10 : 6, alignSelf: "stretch", borderRadius: 4, background: p.color, boxShadow: "var(--glow)" } }),
        React.createElement("div", { style: { flex: 1 } },
          React.createElement("div", { className: "display", style: { fontSize: big ? 52 : 34, color: "var(--ink)" } }, p.full[lang]),
          React.createElement("div", { style: { color: "var(--dim)", fontSize: 13, marginTop: 2 } }, top.cand !== "—" ? top.cand + " · " : "", p.side[lang])
        ),
        React.createElement("div", { style: { textAlign: "right" } },
          React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 2 } },
            React.createElement(AnimatedNumber, { value: top.xProj, dec: 1, style: { fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: big ? 56 : 38, color: p.color } }),
            React.createElement("span", { style: { fontFamily: "var(--f-mono)", fontSize: big ? 22 : 16, color: p.color, opacity: 0.7 } }, "%")
          ),
          React.createElement("div", { className: "eyebrow", style: { marginTop: 2 } }, t("xProj"))
        )
      ),
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 4 } },
        React.createElement("span", { className: "chip", style: { color: close ? "var(--warn)" : "var(--good)", borderColor: "var(--border-2)" } },
          close ? t("tooClose") : "+" + fmt(margin, 1, lang) + " " + t("lead")),
        React.createElement("span", { className: "mono", style: { fontSize: 11, color: "var(--dim)" } },
          React.createElement(AnimatedNumber, { value: region.confidence, dec: 0 }), "% ", t("confidence"))
      )
    );
  }

  // ─────────────── Vote bars ───────────────
  function VoteBars({ metric = "xProj" }) {
    const { region, lang, t } = useEVT();
    const rows = [...region.results].sort((a, b) => b[metric] - a[metric]);
    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 13 } },
      rows.map((r) => {
        const p = EVT.parties[r.party];
        return React.createElement("div", { key: r.party },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 } },
              React.createElement("span", { style: { width: 9, height: 9, borderRadius: 3, background: p.color, flex: "0 0 auto" } }),
              React.createElement("span", { style: { fontWeight: 600, fontSize: 13.5, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, p.full[lang]),
              r.cand !== "—" && React.createElement("span", { style: { fontSize: 11.5, color: "var(--dim)" } }, r.cand)
            ),
            React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 2, flex: "0 0 auto" } },
              React.createElement(AnimatedNumber, { value: r[metric], dec: 1, style: { fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 16, color: "var(--ink)" } }),
              React.createElement("span", { style: { fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--dim)" } }, "%")
            )
          ),
          React.createElement("div", { className: "bar-track", style: { height: 9 } },
            React.createElement("div", { className: "bar-fill", style: { width: r[metric] + "%", background: p.color, boxShadow: "var(--glow)" } })
          )
        );
      })
    );
  }

  // ─────────────── Turnout + sentiment metrics ───────────────
  function Metrics({ stacked }) {
    const { region, t, lang } = useEVT();
    const Stat = (label, node, sub) => React.createElement("div", { style: { flex: 1, minWidth: 0 } },
      React.createElement("div", { className: "eyebrow", style: { marginBottom: 4 } }, label),
      node,
      sub && React.createElement("div", { style: { fontSize: 11, color: "var(--dim)", marginTop: 2 } }, sub)
    );
    return React.createElement("div", { style: { display: "flex", flexDirection: stacked ? "column" : "row", gap: stacked ? 16 : 20 } },
      Stat(t("reporting"),
        React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 1 } },
          React.createElement(AnimatedNumber, { value: region.reporting, dec: 0, style: { fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 26, color: "var(--gold)" } }),
          React.createElement("span", { style: { fontFamily: "var(--f-mono)", color: "var(--gold)", opacity: 0.6 } }, "%")
        ),
        t("precincts")
      ),
      Stat(t("turnout"),
        React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 1 } },
          React.createElement(AnimatedNumber, { value: region.turnout, dec: 1, style: { fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 26, color: "var(--ink)" } }),
          React.createElement("span", { style: { fontFamily: "var(--f-mono)", color: "var(--dim)" } }, "%")
        )
      ),
      Stat(t("sentiment"),
        React.createElement("div", { style: { fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 26, color: region.sentiment >= 0 ? "var(--good)" : "var(--bad)" } },
          (region.sentiment >= 0 ? "+" : "") + region.sentiment + "%")
      )
    );
  }

  // ─────────────── Key races ───────────────
  function KeyRaces() {
    const { region, t, lang } = useEVT();
    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 0 } },
      region.keyRaces.map((r, i) => {
        const p = EVT.parties[r.lead];
        return React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: i < region.keyRaces.length - 1 ? "1px solid var(--border)" : "none" } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
            React.createElement("span", { style: { width: 7, height: 7, borderRadius: 2, background: p.color } }),
            React.createElement("span", { style: { fontWeight: 600, fontSize: 13 } }, r.name),
            React.createElement("span", { className: "chip", style: { fontSize: 8.5, padding: "2px 7px", color: p.color, borderColor: "var(--border)" } }, r.status[lang])
          ),
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--f-mono)", fontSize: 12 } },
            React.createElement("span", { style: { color: "var(--ink)" } }, r.pct + "%"),
            React.createElement("span", { style: { color: "var(--dim)", fontSize: 11 } }, r.vol)
          )
        );
      })
    );
  }

  // ─────────────── Results table ───────────────
  function ResultsTable({ onVerify }) {
    const { region, t, lang } = useEVT();
    const rows = [...region.results].sort((a, b) => b.xProj - a.xProj);
    const th = (txt, align) => React.createElement("th", { style: { textAlign: align || "left", padding: "0 0 10px", fontFamily: "var(--f-mono)", fontSize: 9.5, letterSpacing: "0.12em", color: "var(--dim)", fontWeight: 700 } }, txt);
    return React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } },
      React.createElement("thead", null, React.createElement("tr", { style: { borderBottom: "1px solid var(--border-2)" } },
        th(t("candidate")), th(t("official"), "right"), th(t("xProj"), "right"), th(t("variance"), "right"), th(t("trust"), "center"), th(""))),
      React.createElement("tbody", null,
        rows.map((r) => {
          const p = EVT.parties[r.party];
          const v = r.xProj - r.official;
          return React.createElement("tr", { key: r.party, style: { borderBottom: "1px solid var(--border)" } },
            React.createElement("td", { style: { padding: "11px 0" } },
              React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9 } },
                React.createElement("span", { style: { width: 10, height: 10, borderRadius: 3, background: p.color, flex: "0 0 auto" } }),
                React.createElement("div", null,
                  React.createElement("div", { style: { fontWeight: 600 } }, p.full[lang]),
                  r.cand !== "—" && React.createElement("div", { style: { fontSize: 11, color: "var(--dim)" } }, r.cand)
                )
              )
            ),
            React.createElement("td", { style: { textAlign: "right", fontFamily: "var(--f-mono)" } }, React.createElement(AnimatedNumber, { value: r.official, dec: 1 })),
            React.createElement("td", { style: { textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 700, color: p.color } }, React.createElement(AnimatedNumber, { value: r.xProj, dec: 1 })),
            React.createElement("td", { style: { textAlign: "right", fontFamily: "var(--f-mono)", color: Math.abs(v) < 0.5 ? "var(--dim)" : (v > 0 ? "var(--good)" : "var(--bad)") } }, (v >= 0 ? "+" : "") + fmt(v, 1, lang)),
            React.createElement("td", { style: { textAlign: "center" } },
              React.createElement("div", { style: { display: "inline-flex", alignItems: "center", gap: 5 } },
                React.createElement("div", { style: { width: 34, height: 4, borderRadius: 2, background: "var(--surface-2)", overflow: "hidden" } },
                  React.createElement("div", { style: { width: r.trust + "%", height: "100%", background: r.trust > 85 ? "var(--good)" : "var(--warn)" } })),
                React.createElement("span", { className: "mono", style: { fontSize: 10.5, color: "var(--dim)" } }, r.trust)
              )
            ),
            React.createElement("td", { style: { textAlign: "right" } },
              React.createElement("button", { onClick: () => onVerify && onVerify(r), style: { cursor: "pointer", fontFamily: "var(--f-mono)", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", padding: "4px 9px", borderRadius: 6, border: "1px solid var(--border-2)", background: "transparent", color: "var(--emerald)" } }, t("verify"))
            )
          );
        })
      )
    );
  }

  // ─────────────── X feed ───────────────
  function XFeed({ max = 6 }) {
    const { feed, t, lang } = useEVT();
    return React.createElement("div", { className: "scroll", style: { display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 } },
      feed.slice(0, max).map((post) =>
        React.createElement("div", { key: post.id, className: "card-raised" + (post.isNew ? " post-new" : ""), style: { border: "1px solid " + (post.isNew ? "var(--emerald)" : "var(--border)"), borderRadius: 12, padding: 13, boxShadow: post.isNew ? "var(--glow)" : "none" } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 } },
              React.createElement("div", { style: { width: 26, height: 26, borderRadius: 999, background: "var(--emerald-bg)", border: "1px solid var(--border-2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--f-display)", fontStyle: "italic", color: "var(--emerald)", fontSize: 13, flex: "0 0 auto" } }, post.author[0]),
              React.createElement("div", { style: { minWidth: 0 } },
                React.createElement("div", { style: { fontWeight: 600, fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, post.author),
                React.createElement("div", { style: { fontSize: 11, color: "var(--dim)" } }, post.handle)
              )
            ),
            React.createElement("span", { className: "chip", style: { fontSize: 8, padding: "2px 6px", color: post.v ? "var(--good)" : "var(--dim)", borderColor: "var(--border)" } }, post.v ? t("verified") : t("unverified"))
          ),
          React.createElement("div", { style: { fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)" } }, post[lang]),
          post.isNew && React.createElement("div", { style: { marginTop: 7, display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--f-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "var(--emerald)" } },
            React.createElement("span", { className: "livedot", style: { background: "var(--emerald)", width: 6, height: 6 } }), t("newPost").toUpperCase())
        )
      )
    );
  }

  // ─────────────── Ticker ───────────────
  function Ticker() {
    const { lang, tick } = useEVT();
    const items = EVT.tickerSeed[lang];
    const run = [...items, ...items];
    return React.createElement("div", { className: "ticker-wrap", style: { overflow: "hidden", width: "100%", maskImage: "linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent)", WebkitMaskImage: "linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent)" } },
      React.createElement("div", { className: "ticker-track" },
        run.map((it, i) => React.createElement("span", { key: i, style: { display: "inline-flex", alignItems: "center", gap: 10, padding: "0 22px", fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--ink-2)", borderRight: "1px solid var(--border)" } },
          React.createElement("span", { className: "livedot", style: { width: 6, height: 6 } }), it))
      )
    );
  }

  // ─────────────── Source-trace / reasoning panel ───────────────
  function ReasoningPanel() {
    const { t, lang } = useEVT();
    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 9 } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
        React.createElement(SectionLabel, null, t("reasoning")),
        React.createElement("span", { className: "chip", style: { fontSize: 8.5, color: "var(--gold)" } }, t("protocol") + " v3.1")
      ),
      React.createElement("div", { style: { fontSize: 12.5, lineHeight: 1.55, color: "var(--ink-2)" } },
        React.createElement("span", { style: { color: "var(--good)", fontWeight: 700, fontFamily: "var(--f-mono)", fontSize: 11 } }, t("verified") + " · "),
        lang === "es"
          ? "234 posts en X · 47 videos primarios · 12 titulares tradicionales contrastados. La proyección del Pacto excede el conteo oficial por 1,7 pts; sin evidencia de inflación de narrativa."
          : "234 X posts · 47 primary clips · 12 traditional headlines cross-checked. Pacto projection exceeds official tally by 1.7 pts; no narrative-inflation detected."
      ),
      React.createElement("div", { style: { fontSize: 11, color: "var(--dim)", lineHeight: 1.5 } }, t("traceNote")),
      React.createElement("button", { style: { alignSelf: "flex-start", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--f-mono)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--emerald)", background: "transparent", border: "none", padding: 0 } },
        t("runProtocol"), React.createElement("span", null, "→"))
    );
  }

  Object.assign(window, { EVTProvider, useEVT, AnimatedNumber, Logo, LiveBadge, SectionLabel, RegionSwitcher, ProjectedLeader, VoteBars, Metrics, KeyRaces, ResultsTable, XFeed, Ticker, ReasoningPanel });
})();
