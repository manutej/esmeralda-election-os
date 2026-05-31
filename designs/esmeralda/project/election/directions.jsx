/* ───────────────────────────────────────────────────────────────
   ESMERALDA — three layout directions
   window.{ DirControlRoom, DirBroadsheet, DirAtlas }
   Each reads the shared provider (theme + lang + live data).
   ─────────────────────────────────────────────────────────────── */
(function () {
  const { useEVT, Logo, LiveBadge, SectionLabel, RegionSwitcher, ProjectedLeader,
          VoteBars, Metrics, KeyRaces, ResultsTable, XFeed, Ticker, ReasoningPanel } = window;
  const h = React.createElement;

  // theme/lang frame — every direction renders inside this
  function Frame({ children, style }) {
    const { theme, lang } = useEVT();
    return h("div", { className: "evt", "data-theme": theme, lang,
      style: { width: "100%", height: "100%", background: "var(--bg)", color: "var(--ink)", overflow: "hidden", position: "relative", ...style } }, children);
  }

  const Card = ({ children, pad = 20, style, raised }) =>
    h("div", { className: "card" + (raised ? " card-raised" : ""), style: { padding: pad, display: "flex", flexDirection: "column", ...style } }, children);

  const CardHead = ({ label, accent, right }) =>
    h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 } },
      h(SectionLabel, { accent }, label), right);

  function PartyLegend({ showScale }) {
    const { lang } = useEVT();
    return h("div", { style: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" } },
      ["pacto", "centro", "verde", "radical", "otros"].map((k) => {
        const p = window.EVT.parties[k];
        return h("span", { key: k, style: { display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--ink-2)" } },
          h("span", { style: { width: 10, height: 10, borderRadius: 3, background: p.color } }),
          p.full[lang].length > 14 ? p.abbr : p.full[lang]);
      }),
      showScale && h("span", { style: { display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", fontSize: 10, color: "var(--dim)", fontFamily: "var(--f-mono)" } },
        "+2",
        h("span", { style: { width: 50, height: 8, borderRadius: 2, background: "linear-gradient(90deg, color-mix(in srgb, var(--ink) 22%, transparent), var(--ink))" } }),
        "+14")
    );
  }

  function MapBlock({ height, compact }) {
    const { region, t, lang } = useEVT();
    const [sel, setSel] = React.useState(null);
    const cells = region.deptsHex || [];
    const selD = cells.find((d) => d.id === sel);
    return h("div", { style: { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 } },
      h(CardHead, { label: t("pulseMap"),
        right: h("span", { className: "mono", style: { fontSize: 11, color: "var(--dim)" } }, cells.length + " " + t("hotspots")) }),
      h("div", { style: { flex: 1, minHeight: height || 240, position: "relative", overflow: "hidden" } },
        h("div", { style: { position: "absolute", inset: 0 } },
          h(window.EVTHexMap, { region, selected: sel, onSelect: setSel, compact }))
      ),
      !compact && h("div", { style: { marginTop: 12, display: "flex", flexDirection: "column", gap: 9 } },
        h("div", { style: { display: "flex", alignItems: "center", minHeight: 18 } },
          selD
            ? h("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12 } },
                h("span", { style: { width: 9, height: 9, borderRadius: 2, background: window.EVT.parties[selD.lead].color, flex: "0 0 auto" } }),
                h("span", { style: { fontWeight: 700 } }, selD.name),
                h("span", { style: { color: "var(--dim)" } }, window.EVT.parties[selD.lead].full[lang] + " · +" + selD.margin + " · " + selD.rep + "% " + t("reporting")))
            : h("span", { style: { fontSize: 11, color: "var(--dim)" } }, lang === "es" ? "Toca un departamento para ver el detalle" : "Tap a department for detail")
        ),
        h(PartyLegend, { showScale: true })
      )
    );
  }

  function TopBar({ showSwitch }) {
    const { region, lang, t } = useEVT();
    return h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 } },
      h(Logo, { size: 34 }),
      showSwitch && h("div", { style: { flex: 1, display: "flex", justifyContent: "center" } }, h(RegionSwitcher)),
      h("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
        h("div", { style: { textAlign: "right" } },
          h("div", { className: "eyebrow" }, t("focus")),
          h("div", { style: { fontFamily: "var(--f-display)", fontStyle: "italic", fontWeight: 300, fontSize: 19, color: "var(--emerald)", lineHeight: 1 } }, region.flag + " " + region.name[lang])
        ),
        h(LiveBadge)
      )
    );
  }

  const SampleTag = () => {
    const { t } = useEVT();
    return h("span", { className: "chip", style: { fontSize: 8, color: "var(--gold)", borderColor: "var(--gold)" } }, t("sampleData"));
  };

  /* ═══════════════ A · CONTROL ROOM ═══════════════ */
  function DirControlRoom() {
    const { t, lang, region } = useEVT();
    return h(Frame, null,
      h("div", { style: { padding: 30, display: "flex", flexDirection: "column", gap: 18, height: "100%" } },
        h(TopBar, { showSwitch: true }),
        // ticker strip
        h("div", { style: { display: "flex", alignItems: "center", gap: 14, padding: "10px 16px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" } },
          h("span", { className: "eyebrow", style: { color: "var(--gold)", flex: "0 0 auto" } }, t("ticker")),
          h(Ticker)
        ),
        // hero band
        h("div", { style: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 } },
          h(Card, { pad: 24, raised: true, style: { justifyContent: "center" } }, h(ProjectedLeader, { big: true })),
          h(Card, { pad: 24, style: { justifyContent: "center", gap: 16 } },
            h(CardHead, { label: t("results"), right: h(SampleTag) }),
            h(Metrics, { stacked: false })
          )
        ),
        // main grid
        h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", gap: 18, flex: 1, minHeight: 0 } },
          h(Card, { pad: 22, style: { gap: 16 } },
            h(CardHead, { label: t("keyRaces") }),
            h(KeyRaces),
            h("div", { style: { marginTop: 4 } }, h(CardHead, { label: t("xActivity") }), h(VoteBars, { metric: "xProj" }))
          ),
          h(Card, { pad: 20, style: { overflow: "hidden" } }, h(MapBlock, { height: 320 })),
          h(Card, { pad: 20, style: { minHeight: 0 } },
            h(CardHead, { label: t("primaryFeed"),
              right: h("span", { className: "chip", style: { fontSize: 8.5 } }, "X · ⟳") }),
            h("div", { style: { flex: 1, minHeight: 0, overflow: "hidden" } }, h(XFeed, { max: 6 }))
          )
        ),
        // results + reasoning
        h("div", { style: { display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18 } },
          h(Card, { pad: 22 }, h(CardHead, { label: t("results"), right: h(LiveBadge) }), h(ResultsTable)),
          h(Card, { pad: 22, raised: true }, h(ReasoningPanel))
        )
      )
    );
  }

  /* ═══════════════ B · BROADSHEET ═══════════════ */
  function DirBroadsheet() {
    const { t, lang, region } = useEVT();
    return h(Frame, null,
      h("div", { style: { padding: "34px 40px", display: "flex", flexDirection: "column", gap: 20, height: "100%" } },
        // masthead
        h("div", { style: { borderBottom: "3px double var(--border-2)", paddingBottom: 16 } },
          h("div", { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between" } },
            h("div", null,
              h("div", { className: "eyebrow", style: { color: "var(--gold)", marginBottom: 6 } }, "ESMERALDA · ELECTION OS"),
              h("div", { className: "display", style: { fontSize: 46 } }, region.name[lang]),
              h("div", { style: { fontSize: 14, color: "var(--dim)", marginTop: 4 } }, region.sub[lang])
            ),
            h("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 } },
              h(LiveBadge), h(SampleTag)
            )
          ),
          h("div", { style: { marginTop: 14 } }, h(RegionSwitcher))
        ),
        // body: 2 columns with editorial rule
        h("div", { style: { display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 0, flex: 1, minHeight: 0 } },
          // left editorial column
          h("div", { style: { paddingRight: 28, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 22 } },
            h(Card, { pad: 24, raised: true }, h(ProjectedLeader, { big: true })),
            h("div", null, h(CardHead, { label: t("xProj"), accent: true }), h(VoteBars, { metric: "xProj" })),
            h("div", { style: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } },
              h(CardHead, { label: t("results"), right: h("span", { className: "mono", style: { fontSize: 11, color: "var(--dim)" } }, region.reporting.toFixed(0) + "% " + t("reporting")) }),
              h(ResultsTable))
          ),
          // right rail
          h("div", { style: { paddingLeft: 28, display: "flex", flexDirection: "column", gap: 22, minHeight: 0 } },
            h("div", null, h(CardHead, { label: t("results") }), h(Metrics, { stacked: true })),
            h("div", { style: { height: 210 } }, h(MapBlock, { height: 150, compact: true })),
            h("div", null, h(CardHead, { label: t("keyRaces") }), h(KeyRaces)),
            h("div", { style: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } },
              h(CardHead, { label: t("primaryFeed") }),
              h("div", { style: { flex: 1, minHeight: 0, overflow: "hidden" } }, h(XFeed, { max: 4 })))
          )
        )
      )
    );
  }

  /* ═══════════════ C · ATLAS (map hero) ═══════════════ */
  function DirAtlas() {
    const { t, lang, region } = useEVT();
    const glass = { background: "color-mix(in srgb, var(--surface) 82%, transparent)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "1px solid var(--border-2)", borderRadius: 16, boxShadow: "var(--shadow-lg)" };
    return h(Frame, null,
      // map hero (hex cartogram) centered between rails
      h("div", { style: { position: "absolute", left: 282, right: 432, top: 100, bottom: 96, display: "flex", flexDirection: "column" } },
        h("div", { className: "eyebrow", style: { marginBottom: 8, display: "flex", justifyContent: "space-between" } },
          h("span", null, t("pulseMap")),
          h("span", { style: { color: "var(--dim)" } }, (region.deptsHex || []).length + " " + t("hotspots"))),
        h("div", { style: { flex: 1, minHeight: 0, position: "relative" } },
          h("div", { style: { position: "absolute", inset: 0 } }, h(window.EVTHexMap, { region }))),
        h("div", { style: { paddingTop: 12 } }, h(PartyLegend, { showScale: true }))
      ),
      // top bar overlay
      h("div", { style: { position: "absolute", top: 0, left: 0, right: 0, padding: "26px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 } },
        h(Logo, { size: 32 }),
        h("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, h(RegionSwitcher), h(LiveBadge))
      ),
      // floating right rail
      h("div", { style: { position: "absolute", top: 92, right: 32, bottom: 110, width: 380, display: "flex", flexDirection: "column", gap: 16 } },
        h("div", { style: { ...glass, padding: 22 } },
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 } },
            h("div", null, h("div", { className: "eyebrow", style: { color: "var(--gold)" } }, region.name[lang]),
              h("div", { style: { fontSize: 12, color: "var(--dim)", marginTop: 3 } }, region.sub[lang])),
            h(SampleTag)),
          h(ProjectedLeader, { big: false })
        ),
        h("div", { style: { ...glass, padding: 20 } }, h(CardHead, { label: t("xProj"), accent: true }), h(VoteBars, { metric: "xProj" })),
        h("div", { style: { ...glass, padding: 20, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } },
          h(CardHead, { label: t("primaryFeed") }),
          h("div", { style: { flex: 1, minHeight: 0, overflow: "hidden" } }, h(XFeed, { max: 5 }))
        )
      ),
      // floating left metrics
      h("div", { style: { position: "absolute", left: 32, top: 100, width: 230, display: "flex", flexDirection: "column", gap: 16 } },
        h("div", { style: { ...glass, padding: 20 } }, h(CardHead, { label: t("results") }), h(Metrics, { stacked: true }))
      ),
      // bottom ticker bar
      h("div", { style: { position: "absolute", left: 32, right: 32, bottom: 30, display: "flex", alignItems: "center", gap: 14, padding: "12px 18px", ...glass } },
        h("span", { className: "eyebrow", style: { color: "var(--gold)", flex: "0 0 auto" } }, t("ticker")),
        h(Ticker)
      )
    );
  }

  Object.assign(window, { DirControlRoom, DirBroadsheet, DirAtlas });
})();
