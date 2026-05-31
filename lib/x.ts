/**
 * X API v2 client for election signal ingestion
 * Heavy multi-query research for Colombia 2026
 * 
 * Spanish support: Uses optimized Spanish queries from spanish-research.ts
 * when lang='es' (the default for this Colombia election project).
 */
import { getSpanishResearchQueries } from './spanish-research';

export interface XPost {
  id: string;
  text: string;
  author: string;
  handle: string;
  created_at: string;
  likes: number;
  retweets?: number;
  region_hint?: string;
  geo?: string;
}

const X_BASE = 'https://api.twitter.com/2';

function getBearer() {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) throw new Error('X_BEARER_TOKEN not set');
  return token;
}

async function xFetch(endpoint: string, params: Record<string, string>) {
  const url = new URL(`${X_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${getBearer()}`,
      'User-Agent': 'X-Election-OS-Colombia/1.0'
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`X API ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * Core multi-query heavy research fetcher for Colombia election day
 * Now fully Spanish-enabled via getSpanishResearchQueries when lang='es'.
 */
export async function fetchColombiaElectionSignals(limitPerQuery = 8, lang: 'es' | 'en' = 'es'): Promise<XPost[]> {
  const since = '2026-05-31'; // election day

  // Use the centralized Spanish research helpers for proper election-day Spanish queries
  const queries = lang === 'es' 
    ? getSpanishResearchQueries('all')
    : [
        // Fallback English-leaning variants (kept for flexibility)
        `(Cepeda OR "Iván Cepeda") (election OR vote) -is:retweet since:${since}`,
        `("de la Espriella" OR "El Tigre") (election OR vote) -is:retweet since:${since}`,
        `(participation OR turnout OR "long lines" OR witnesses) Colombia election lang:es -is:retweet since:${since}`,
        `(Antioquia OR Medellin OR Cali OR Barranquilla) (Cepeda OR Espriella) lang:es -is:retweet since:${since}`,
      ];

  const allPosts: XPost[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    try {
      const data = await xFetch('/tweets/search/recent', {
        query: q,
        max_results: String(Math.min(limitPerQuery, 10)),
        'tweet.fields': 'created_at,public_metrics,geo,lang',
        'user.fields': 'username,name,verified',
        expansions: 'author_id'
      });

      const users = new Map((data.includes?.users || []).map((u: any) => [u.id, u]));

      (data.data || []).forEach((t: any) => {
        if (seen.has(t.id)) return;
        seen.add(t.id);

        const author = users.get(t.author_id) || { name: 'X User', username: 'unknown' };
        allPosts.push({
          id: t.id,
          text: t.text,
          author: author.name,
          handle: `@${author.username}`,
          created_at: t.created_at,
          likes: t.public_metrics?.like_count || 0,
          retweets: t.public_metrics?.retweet_count,
          region_hint: inferRegionFromText(t.text)
        });
      });
    } catch (e) {
      console.error('X query failed:', q.substring(0, 60), e);
      // Continue with other queries
    }
  }

  // Sort newest first, cap total
  return allPosts
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 42);
}

function inferRegionFromText(text: string): string | undefined {
  const t = text.toLowerCase();
  if (t.includes('medellín') || t.includes('antioquia')) return 'antioquia';
  if (t.includes('cali') || t.includes('valle')) return 'valle';
  if (t.includes('barranquilla') || t.includes('atlántico')) return 'atlantico';
  if (t.includes('bogotá') || t.includes('cundinamarca')) return 'cundinamarca';
  if (t.includes('bucaramanga') || t.includes('santander')) return 'santander';
  if (t.includes('palmira') || t.includes('pasto') || t.includes('nariño')) return 'narino';
  return undefined;
}

/**
 * Lightweight single-claim fetch for on-demand VERIFY
 */
export async function fetchPostsForClaim(claim: string, max = 12): Promise<XPost[]> {
  try {
    const since = '2026-05-30';
    const q = `${claim} lang:es -is:retweet since:${since} min_faves:2`;
    const data = await xFetch('/tweets/search/recent', {
      query: q,
      max_results: String(max),
      'tweet.fields': 'created_at,public_metrics',
      'user.fields': 'username,name',
      expansions: 'author_id'
    });
    const users = new Map((data.includes?.users || []).map((u: any) => [u.id, u]));
    return (data.data || []).map((t: any) => {
      const author = users.get(t.author_id) || { name: 'Citizen', username: 'x' };
      return {
        id: t.id,
        text: t.text,
        author: author.name,
        handle: `@${author.username}`,
        created_at: t.created_at,
        likes: t.public_metrics?.like_count || 0
      };
    });
  } catch {
    return [];
  }
}
