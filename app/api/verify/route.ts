import { NextRequest, NextResponse } from 'next/server';
import { fetchPostsForClaim } from '@/lib/x';
import { runBetterSearch } from '@/lib/grok';
import { logAudit } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { postId, claim, author, region = 'colombia', lang = 'es' } = body;

  if (!claim) {
    return NextResponse.json({ error: 'claim required' }, { status: 400 });
  }

  // Fetch fresh primary sources around this exact claim for the protocol
  const supporting = await fetchPostsForClaim(claim, 10);

  // Pass lang so x.ai calls use Spanish prompts/instructions when UI is in ES
  const analysis = await runBetterSearch(
    region,
    [
      { id: postId || 'manual', text: claim, author: author || 'User', created_at: new Date().toISOString(), likes: 0 },
      ...supporting.map(p => ({ id: p.id, text: p.text, author: p.author, created_at: p.created_at, likes: p.likes }))
    ],
    `Targeted verification of single primary claim during Colombia 2026 first round. High scrutiny.`,
    lang
  );

  await logAudit({
    action: 'VERIFY',
    payload: { postId, claim: claim.substring(0, 120), trust: analysis.trust_score, grok: analysis.lineage.grok_call_id }
  });

  return NextResponse.json({
    ...analysis,
    supporting_posts: supporting.length,
    verified_at: new Date().toISOString()
  });
}
