/* ───────────────────────────────────────────────────────────────
   ESMERALDA — election data + i18n + live-sim helpers
   window.EVT.{ i18n, parties, regions, sim }
   All figures are SAMPLE data for design; wire to the live X feed later.
   ─────────────────────────────────────────────────────────────── */
(function () {
  // ── bilingual UI strings ────────────────────────────────────
  const i18n = {
    en: {
      live: "LIVE", updated: "updated", ago: "ago", reporting: "reporting",
      projectedWinner: "PROJECTED LEADER", firstRound: "First round",
      turnout: "Turnout", sentiment: "X sentiment", confidence: "confidence",
      keyRaces: "KEY RACES", xActivity: "X ACTIVITY", primaryFeed: "X PRIMARY FEED",
      aggregated: "Aggregated from primary sources", sync: "SYNC", nextSync: "Next sync",
      pulseMap: "GEOGRAPHIC PULSE", hotspots: "departments reporting",
      results: "LIVE RESULTS", official: "OFFICIAL", xProj: "X-PROJECTED",
      variance: "VAR", trust: "SOURCE", verify: "VERIFY", verified: "VERIFIED",
      unverified: "UNVERIFIED", reasoning: "SOURCE-TRACE ENGINE",
      runProtocol: "Run full source trace", protocol: "PROTOCOL",
      votes: "votes counted", precincts: "precincts", lead: "lead",
      sampleData: "SAMPLE DATA", region: "REGION", focus: "CURRENT FOCUS",
      ticker: "RESULTS TICKER", candidate: "CANDIDATE / PARTY",
      seats: "seats", swing: "swing", call: "CALL", tooClose: "TOO CLOSE TO CALL",
      newPost: "new", likes: "likes", traceNote: "Variance from 1,284 X posts + 89 eyewitness clips, weighted by primary-source density.",
      poweredX: "Primary sources · cross-checked",
    },
    es: {
      live: "EN VIVO", updated: "actualizado", ago: "atrás", reporting: "escrutado",
      projectedWinner: "LÍDER PROYECTADO", firstRound: "Primera vuelta",
      turnout: "Participación", sentiment: "Sentimiento X", confidence: "confianza",
      keyRaces: "CARRERAS CLAVE", xActivity: "ACTIVIDAD X", primaryFeed: "FUENTE PRIMARIA X",
      aggregated: "Agregado de fuentes primarias", sync: "SINCR.", nextSync: "Próxima sincr.",
      pulseMap: "PULSO GEOGRÁFICO", hotspots: "departamentos reportando",
      results: "RESULTADOS EN VIVO", official: "OFICIAL", xProj: "PROYECCIÓN X",
      variance: "VAR", trust: "FUENTE", verify: "VERIFICAR", verified: "VERIFICADO",
      unverified: "SIN VERIFICAR", reasoning: "MOTOR DE TRAZA DE FUENTES",
      runProtocol: "Ejecutar traza completa", protocol: "PROTOCOLO",
      votes: "votos escrutados", precincts: "mesas", lead: "ventaja",
      sampleData: "DATOS DE MUESTRA", region: "REGIÓN", focus: "FOCO ACTUAL",
      ticker: "TELETIPO DE RESULTADOS", candidate: "CANDIDATO / PARTIDO",
      seats: "curules", swing: "variación", call: "ADJUDIC.", tooClose: "DEMASIADO REÑIDO",
      newPost: "nuevo", likes: "me gusta", traceNote: "Varianza de 1.284 posts en X + 89 videos de testigos, ponderada por densidad de fuente primaria.",
      poweredX: "Fuentes primarias · contrastadas",
    },
  };

  // ── party metadata (CSS var keyed) ──────────────────────────
  const parties = {
    pacto:   { abbr: "Pacto", full: { en: "Pacto Histórico", es: "Pacto Histórico" }, side: { en: "Left coalition", es: "Coalición de izquierda" }, color: "var(--p-pacto)" },
    centro:  { abbr: "CD",    full: { en: "Centro Democrático", es: "Centro Democrático" }, side: { en: "Right", es: "Derecha" }, color: "var(--p-centro)" },
    verde:   { abbr: "Verde", full: { en: "Coalición Verde Esperanza", es: "Coalición Verde Esperanza" }, side: { en: "Centre-green", es: "Centro-verde" }, color: "var(--p-verde)" },
    radical: { abbr: "CR",    full: { en: "Cambio Radical", es: "Cambio Radical" }, side: { en: "Centre-right", es: "Centro-derecha" }, color: "var(--p-radical)" },
    otros:   { abbr: "Otros", full: { en: "Others / blank", es: "Otros / en blanco" }, side: { en: "—", es: "—" }, color: "var(--p-otros)" },
  };

  // ── Colombia departments for the choropleth pulse map ───────
  // x,y are placement in a 360×440 viewBox; r = activity radius.
  const coDepts = [
    { id: "atlantico", name: "Atlántico",      x: 150, y: 72,  r: 11, lead: "pacto",   share: 41, city: "Barranquilla", lpos: "above" },
    { id: "santander", name: "Santander",      x: 212, y: 130, r: 12, lead: "centro",  share: 36, city: "Bucaramanga",  lpos: "right" },
    { id: "antioquia", name: "Antioquia",      x: 114, y: 152, r: 16, lead: "centro",  share: 38, city: "Medellín",     lpos: "left" },
    { id: "cundi",     name: "Cundinamarca",   x: 160, y: 214, r: 16, lead: "pacto",   share: 44, city: "Bogotá D.C.",  lpos: "above" },
    { id: "meta",      name: "Meta",           x: 234, y: 236, r: 11, lead: "radical", share: 33, city: "Villavicencio", lpos: "right" },
    { id: "valle",     name: "Valle del Cauca", x: 90, y: 250, r: 14, lead: "verde",   share: 35, city: "Cali",         lpos: "left" },
    { id: "narino",    name: "Nariño",         x: 94,  y: 326, r: 11, lead: "pacto",   share: 47, city: "Pasto",        lpos: "left" },
    { id: "amazonas",  name: "Amazonas",       x: 212, y: 372, r: 10, lead: "verde",   share: 31, city: "Leticia",      lpos: "right" },
  ];

  // ── department hex-tile cartogram (expert tile-grid map) ────
  // col/row = roughly geographic placement (odd-r offset);
  // margin (pts) → fill intensity; rep = % precincts reporting.
  const coHex = [
    { id: "guajira",      abbr: "LAG", name: "La Guajira",       col: 6, row: 0, lead: "pacto",   margin: 12, rep: 58 },
    { id: "atlantico",    abbr: "ATL", name: "Atlántico",        col: 4, row: 1, lead: "pacto",   margin: 11, rep: 71, live: true },
    { id: "magdalena",    abbr: "MAG", name: "Magdalena",        col: 5, row: 1, lead: "pacto",   margin: 9,  rep: 61 },
    { id: "cesar",        abbr: "CES", name: "Cesar",            col: 6, row: 1, lead: "pacto",   margin: 6,  rep: 55 },
    { id: "nsantander",   abbr: "NSA", name: "N. de Santander",  col: 7, row: 1, lead: "centro",  margin: 5,  rep: 49 },
    { id: "cordoba",      abbr: "COR", name: "Córdoba",          col: 2, row: 2, lead: "radical", margin: 5,  rep: 52 },
    { id: "sucre",        abbr: "SUC", name: "Sucre",            col: 3, row: 2, lead: "pacto",   margin: 7,  rep: 57 },
    { id: "bolivar",      abbr: "BOL", name: "Bolívar",          col: 4, row: 2, lead: "pacto",   margin: 8,  rep: 60 },
    { id: "santander",    abbr: "SAN", name: "Santander",        col: 6, row: 2, lead: "centro",  margin: 3,  rep: 53, live: true },
    { id: "antioquia",    abbr: "ANT", name: "Antioquia",        col: 2, row: 3, lead: "centro",  margin: 6,  rep: 64, live: true },
    { id: "boyaca",       abbr: "BOY", name: "Boyacá",           col: 5, row: 3, lead: "pacto",   margin: 2,  rep: 50 },
    { id: "arauca",       abbr: "ARA", name: "Arauca",           col: 7, row: 3, lead: "pacto",   margin: 3,  rep: 44 },
    { id: "choco",        abbr: "CHO", name: "Chocó",            col: 1, row: 4, lead: "pacto",   margin: 14, rep: 47 },
    { id: "caldas",       abbr: "CAL", name: "Caldas",           col: 3, row: 4, lead: "centro",  margin: 3,  rep: 58 },
    { id: "cundinamarca", abbr: "CUN", name: "Cundinamarca",     col: 4, row: 4, lead: "pacto",   margin: 5,  rep: 66 },
    { id: "casanare",     abbr: "CAS", name: "Casanare",         col: 6, row: 4, lead: "radical", margin: 5,  rep: 46 },
    { id: "vichada",      abbr: "VIC", name: "Vichada",          col: 8, row: 4, lead: "radical", margin: 6,  rep: 38 },
    { id: "risaralda",    abbr: "RIS", name: "Risaralda",        col: 2, row: 5, lead: "centro",  margin: 2,  rep: 60 },
    { id: "quindio",      abbr: "QUI", name: "Quindío",          col: 3, row: 5, lead: "verde",   margin: 2,  rep: 62 },
    { id: "tolima",       abbr: "TOL", name: "Tolima",           col: 4, row: 5, lead: "pacto",   margin: 3,  rep: 55 },
    { id: "bogota",       abbr: "BOG", name: "Bogotá D.C.",      col: 5, row: 5, lead: "pacto",   margin: 8,  rep: 71, live: true },
    { id: "meta",         abbr: "MET", name: "Meta",             col: 6, row: 5, lead: "radical", margin: 4,  rep: 49 },
    { id: "valle",        abbr: "VAC", name: "Valle del Cauca",  col: 1, row: 6, lead: "verde",   margin: 4,  rep: 58 },
    { id: "huila",        abbr: "HUI", name: "Huila",            col: 4, row: 6, lead: "centro",  margin: 2,  rep: 53 },
    { id: "guaviare",     abbr: "GUV", name: "Guaviare",         col: 6, row: 6, lead: "radical", margin: 3,  rep: 35 },
    { id: "guainia",      abbr: "GNA", name: "Guainía",          col: 8, row: 6, lead: "verde",   margin: 2,  rep: 31 },
    { id: "cauca",        abbr: "CAU", name: "Cauca",            col: 2, row: 7, lead: "pacto",   margin: 9,  rep: 50 },
    { id: "caqueta",      abbr: "CAQ", name: "Caquetá",          col: 4, row: 7, lead: "pacto",   margin: 3,  rep: 42 },
    { id: "vaupes",       abbr: "VAU", name: "Vaupés",           col: 6, row: 7, lead: "verde",   margin: 2,  rep: 33 },
    { id: "narino",       abbr: "NAR", name: "Nariño",           col: 1, row: 8, lead: "pacto",   margin: 12, rep: 66 },
    { id: "putumayo",     abbr: "PUT", name: "Putumayo",         col: 3, row: 8, lead: "pacto",   margin: 6,  rep: 44 },
    { id: "amazonas",     abbr: "AMA", name: "Amazonas",         col: 5, row: 9, lead: "verde",   margin: 3,  rep: 31 },
  ];

  // ── sample X posts ──────────────────────────────────────────
  const coPosts = [
    { id: 1, author: "Registraduría Nacional", handle: "@Registraduria", v: true,
      en: "Polls closed in 18 departments. Preliminary count underway. National reporting at 62% of precincts.",
      es: "Cerradas las urnas en 18 departamentos. Conteo preliminar en curso. Reporte nacional al 62% de las mesas." },
    { id: 2, author: "La Silla Vacía", handle: "@lasillavacia", v: true,
      en: "Bogotá breaks turnout record: long but orderly queues across the city. Youth participation visibly up.",
      es: "Bogotá rompe récord de participación: filas largas pero ordenadas en toda la ciudad. Voto joven al alza." },
    { id: 3, author: "Pulso Electoral", handle: "@pulso_co", v: false,
      en: "Antioquia tightening — CD margin slips as urban Medellín boxes report. Watch the next 30 minutes.",
      es: "Antioquia se aprieta — la ventaja del CD baja con el reporte de las urnas urbanas de Medellín. Atentos a los próximos 30 minutos." },
    { id: 4, author: "Misión de Observación", handle: "@moecolombia", v: true,
      en: "No material incidents reported in 1,420 monitored stations. Two delayed openings resolved before noon.",
      es: "Sin incidentes materiales en 1.420 puestos observados. Dos aperturas tardías resueltas antes del mediodía." },
    { id: 5, author: "Caribe Político", handle: "@caribe_pol", v: false,
      en: "Atlántico coast swinging Pacto by double digits vs 2022 — coastal turnout the story of the night.",
      es: "La costa de Atlántico se inclina al Pacto por doble dígito frente a 2022 — la participación costeña, la historia de la noche." },
  ];

  // ── regions (Colombia hero + framework switchers) ───────────
  const regions = {
    colombia: {
      id: "colombia",
      flag: "🇨🇴",
      name: { en: "COLOMBIA 2026", es: "COLOMBIA 2026" },
      sub: { en: "Presidential · First round · 31 May 2026", es: "Presidencial · Primera vuelta · 31 may 2026" },
      reporting: 62,
      turnout: 58.7,
      sentiment: +21,
      confidence: 88,
      leader: "pacto",
      results: [
        { party: "pacto",   cand: "A. Moreno",   official: 32.4, xProj: 34.1, trust: 92 },
        { party: "centro",  cand: "F. Cárdenas", official: 27.9, xProj: 26.3, trust: 89 },
        { party: "verde",   cand: "L. Sanín",    official: 18.6, xProj: 19.4, trust: 84 },
        { party: "radical", cand: "J. Ospina",   official: 12.1, xProj: 11.7, trust: 80 },
        { party: "otros",   cand: "—",            official: 9.0,  xProj: 8.5,  trust: 71 },
      ],
      keyRaces: [
        { name: "Bogotá D.C.", lead: "pacto",  status: { en: "PACTO LEAD", es: "VENTAJA PACTO" }, pct: 44, vol: "182k" },
        { name: "Antioquia",   lead: "centro", status: { en: "CD HOLD", es: "CD MANTIENE" }, pct: 38, vol: "131k" },
        { name: "Valle",       lead: "verde",  status: { en: "VERDE GAIN", es: "VERDE GANA" }, pct: 35, vol: "97k" },
        { name: "Costa Caribe",lead: "pacto",  status: { en: "TOO CLOSE", es: "REÑIDO" }, pct: 33, vol: "88k" },
      ],
      depts: coDepts,
      deptsHex: coHex,
      posts: coPosts,
    },
    us: {
      id: "us", flag: "🇺🇸",
      name: { en: "US MIDTERMS 2026", es: "LEGISLATIVAS EE.UU. 2026" },
      sub: { en: "Senate & House · 3 Nov 2026", es: "Senado y Cámara · 3 nov 2026" },
      reporting: 47, turnout: 51.8, sentiment: +8, confidence: 84, leader: "centro",
      results: [
        { party: "centro",  cand: "Republicans", official: 49.1, xProj: 49.6, trust: 86 },
        { party: "pacto",   cand: "Democrats",   official: 47.4, xProj: 46.9, trust: 85 },
        { party: "otros",   cand: "Independents", official: 3.5, xProj: 3.5, trust: 70 },
      ],
      keyRaces: [
        { name: "Senate", lead: "centro", status: { en: "TOSS-UP", es: "EMPATE" }, pct: 50, vol: "312k" },
      ],
      depts: [], posts: [],
    },
    brazil: {
      id: "brazil", flag: "🇧🇷",
      name: { en: "BRAZIL MUNICIPAL", es: "MUNICIPALES BRASIL" },
      sub: { en: "Mayoral runoffs · 2026", es: "Segunda vuelta alcaldías · 2026" },
      reporting: 71, turnout: 64.2, sentiment: +14, confidence: 81, leader: "verde",
      results: [
        { party: "verde",   cand: "Coalition A", official: 41.2, xProj: 42.0, trust: 83 },
        { party: "radical", cand: "Coalition B", official: 38.7, xProj: 38.1, trust: 82 },
        { party: "otros",   cand: "Others",      official: 20.1, xProj: 19.9, trust: 74 },
      ],
      keyRaces: [], depts: [], posts: [],
    },
  };

  // ── live-sim: nudge numbers, normalize, emit ticker + posts ─
  const tickerSeed = {
    en: [
      "Bogotá D.C. · 71% reporting · Pacto +6.2",
      "Antioquia · 64% reporting · CD +2.1",
      "Valle del Cauca · 58% reporting · Verde +1.4",
      "Atlántico · 49% reporting · Pacto +9.8",
      "Santander · 53% reporting · CD +0.7",
      "Nariño · 66% reporting · Pacto +12.0",
    ],
    es: [
      "Bogotá D.C. · 71% escrutado · Pacto +6,2",
      "Antioquia · 64% escrutado · CD +2,1",
      "Valle del Cauca · 58% escrutado · Verde +1,4",
      "Atlántico · 49% escrutado · Pacto +9,8",
      "Santander · 53% escrutado · CD +0,7",
      "Nariño · 66% escrutado · Pacto +12,0",
    ],
  };

  function nudge(region) {
    // random-walk the projections, renormalize to 100
    const r = region.results.map((x) => ({ ...x }));
    let total = 0;
    r.forEach((x) => {
      if (x.party === "otros") return;
      x.xProj = Math.max(2, x.xProj + (Math.random() - 0.48) * 0.5);
      total += x.xProj;
    });
    const others = r.find((x) => x.party === "otros");
    const rest = Math.max(2, 100 - total);
    if (others) others.xProj = rest;
    // official creeps toward xProj as precincts report
    r.forEach((x) => { x.official += (x.xProj - x.official) * 0.06; });
    region.results = r;
    region.reporting = Math.min(99, region.reporting + Math.random() * 0.7);
    region.turnout = Math.min(85, region.turnout + Math.random() * 0.15);
    region.confidence = Math.min(97, region.confidence + (Math.random() - 0.4) * 0.4);
    // recompute leader
    let best = r[0];
    r.forEach((x) => { if (x.party !== "otros" && x.xProj > best.xProj) best = x; });
    region.leader = best.party;
    return region;
  }

  window.EVT = { i18n, parties, regions, tickerSeed, nudge };
})();
