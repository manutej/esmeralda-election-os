import { NextRequest, NextResponse } from 'next/server';
import { getLatestSnapshot, getEnrichedFeed } from '@/lib/store';
import heavySeed from '../../../data/colombia-heavy-seed-2026-05-31-es-updated.json';

export async function GET(req: NextRequest) {
  const region = req.nextUrl.searchParams.get('region') || 'colombia';
  const forceLive = req.nextUrl.searchParams.get('force') === 'live';

  // Default: serve the high-quality, zero-cost heavy synthesis I (Grok) performed right now.
  // This is the creative solution for speed + cost on election day.
  if (!forceLive) {
    const seed = heavySeed as any;
    return NextResponse.json({
      ...seed.national,
      region,
      source: 'heavy-grok-spanish-synthesis',
      synthesized_at: seed.meta.timestamp,
      lineage: seed.meta.lineage,
      hotspots: seed.departments.map((d: any) => ({
        name: d.name,
        x_activity: d.x_activity,
        x_pred: d.x_pred,
        trust: d.trust
      })),
      discrepancies: seed.national.discrepancies,
      enriched_posts: seed.primary_signals.map((s: any) => ({
        id: s.id,
        author: s.author,
        text: s.text_es,           // default Spanish for Colombian context
        text_en: s.text_en,
        likes: s.likes,
        trust: s.trust,
        claim: s.claim
      })),
      departments: seed.departments,
      recommended_action: seed.national.recommended_action,
      is_heavy_seed: true,
      spanish_enabled: true
    });
  }

  // Only when explicitly requested (?force=live) do we hit the expensive live path
  const snapshot = await getLatestSnapshot(region);
  const feed = await getEnrichedFeed(region);

  if (!snapshot) {
    return NextResponse.json({
      region,
      bootstrap: true,
      message: 'No KV snapshot. Heavy seed is the recommended default for speed/cost. Use ?force=live only for real API runs.',
      ... (heavySeed as any).national
    });
  }

  return NextResponse.json({ ...snapshot, feed, source: 'kv-live' });
}
