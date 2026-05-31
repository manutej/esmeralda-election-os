/**
 * Spanish-optimized research helpers for Colombia election monitoring.
 * Use these patterns for web searches, news monitoring, and X queries
 * when the dashboard language is set to 'es'.
 *
 * This enables proper Spanish web searches and context for x.ai calls.
 */

export const SPANISH_ELECTION_QUERIES = {
  // Core candidate + election day searches (use with lang:es)
  national: [
    'Cepeda OR "Iván Cepeda" (elecciones OR presidencia OR voto OR mesa) lang:es since:2026-05-31',
    '"de la Espriella" OR "El Tigre" OR "Abelardo" (elecciones OR voto) lang:es since:2026-05-31',
    '(Valencia OR "Paloma Valencia") (elecciones OR "Centro Democrático") lang:es since:2026-05-31',
  ],

  // Turnout and primary signals (very important for X primary sources)
  turnout: [
    '(participación OR turnout OR "larga fila" OR "mesas cerradas" OR testigos) Colombia elecciones lang:es since:2026-05-31',
    '(preconteo OR escrutinio OR "testigo electoral") (fraude OR irregularidad OR "no cuadra" OR "mesa") lang:es since:2026-05-31 min_faves:3',
  ],

  // Department / hotspot specific
  departments: {
    antioquia: '(Antioquia OR Medellín OR Rionegro) (Cepeda OR Espriella) lang:es since:2026-05-31',
    valle: '(Cali OR "Valle del Cauca" OR Jamundí) (Cepeda OR Espriella) lang:es since:2026-05-31',
    bogota: '(Bogotá OR Suba OR "Cundinamarca") (Cepeda OR "Pacto Histórico") lang:es since:2026-05-31',
    atlantico: '(Barranquilla OR Atlántico) (Cepeda OR Espriella) lang:es since:2026-05-31',
  },

  // Web search friendly patterns (for future news / official scraping augmentation)
  webSpanish: [
    'resultados elecciones Colombia 2026 Cepeda "de la Espriella" preconteo',
    'Iván Cepeda vs Abelardo de la Espriella 31 mayo 2026',
    'participación electoral hoy Colombia Bogotá Medellín Cali',
    'testigos electorales mesas Colombia 2026',
  ],
};

/**
 * Returns the best set of Spanish queries for the current region focus.
 * Use this when building ingestion or "Deep Research" requests in Spanish mode.
 */
export function getSpanishResearchQueries(focus: 'national' | 'hotspots' | 'all' = 'all') {
  const queries: string[] = [];

  if (focus === 'national' || focus === 'all') {
    queries.push(...SPANISH_ELECTION_QUERIES.national, ...SPANISH_ELECTION_QUERIES.turnout);
  }
  if (focus === 'hotspots' || focus === 'all') {
    Object.values(SPANISH_ELECTION_QUERIES.departments).forEach(q => queries.push(q));
  }

  return queries;
}

/**
 * Example: How to use with web_search tool or future backend web augmentation.
 * These queries are already tuned for high-signal Spanish results on election day.
 */
export const WEB_SEARCH_EXAMPLES_ES = [
  'elecciones presidenciales Colombia 2026 resultados en vivo Cepeda Espriella',
  'preconteo Registraduría hoy 31 mayo 2026',
  '"Iván Cepeda" OR "Abelardo de la Espriella" participación OR colas OR testigos',
];
