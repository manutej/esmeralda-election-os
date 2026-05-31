/**
 * Palantir-style Ontology Store — powered by Vercel KV
 * Every enriched signal gets lineage + audit
 */

import { kv } from '@vercel/kv';

export interface ElectionSnapshot {
  region: string;
  timestamp: string;
  metrics: {
    turnout_x: number;
    leader: string;
    lead_percent: number;
    x_sentiment: string;
    confidence: number;
  };
  x_predicted: Record<string, number>;
  trust_score: number;
  hotspots: Array<{ name: string; x_activity: number; x_pred: number; trust: number }>;
  discrepancies: string[];
  enriched_posts: Array<{
    id: string;
    text: string;
    author: string;
    trust: number;
    claims: any[];
  }>;
  lineage: {
    grok_call_id: string;
    posts_analyzed: number;
  };
}

export interface AuditLog {
  id: string;
  action: 'VERIFY' | 'REGION_SWITCH' | 'INGEST' | 'MANUAL_OVERRIDE';
  user_hash?: string; // X token hash or session
  payload: any;
  timestamp: string;
}

const SNAPSHOT_KEY = (region: string) => `election:snapshot:${region}`;
const AUDIT_KEY = 'election:audit';
const FEED_KEY = (region: string) => `election:feed:${region}`;

export async function saveSnapshot(snapshot: ElectionSnapshot) {
  await kv.set(SNAPSHOT_KEY(snapshot.region), snapshot, { ex: 60 * 60 * 6 }); // 6h TTL
  // Also keep a short history
  await kv.lpush(`election:history:${snapshot.region}`, JSON.stringify({
    ts: snapshot.timestamp,
    leader: snapshot.metrics.leader,
    lead: snapshot.metrics.lead_percent,
    trust: snapshot.trust_score
  }));
  await kv.ltrim(`election:history:${snapshot.region}`, 0, 47);
}

export async function getLatestSnapshot(region = 'colombia'): Promise<ElectionSnapshot | null> {
  return await kv.get(SNAPSHOT_KEY(region));
}

export async function saveEnrichedFeed(region: string, posts: any[]) {
  await kv.set(FEED_KEY(region), posts, { ex: 60 * 60 * 3 });
}

export async function getEnrichedFeed(region: string) {
  return (await kv.get(FEED_KEY(region))) || [];
}

export async function logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
  const full: AuditLog = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString()
  };
  await kv.lpush(AUDIT_KEY, JSON.stringify(full));
  await kv.ltrim(AUDIT_KEY, 0, 199); // keep last 200
  return full;
}

export async function getRecentAudit(limit = 20): Promise<AuditLog[]> {
  const raw = await kv.lrange(AUDIT_KEY, 0, limit - 1);
  return raw.map(r => JSON.parse(r as string));
}
