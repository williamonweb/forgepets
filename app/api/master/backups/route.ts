import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NEON_API_BASE = 'https://console.neon.tech/api/v2';

async function requireMaster() {
  const session = await getSession();
  return session?.role === 'MASTER' ? session : null;
}

function neonConfig() {
  return {
    apiKey: String(process.env.NEON_API_KEY || '').trim(),
    projectId: String(process.env.NEON_PROJECT_ID || '').trim(),
    branchId: String(process.env.NEON_BRANCH_ID || '').trim()
  };
}

async function neonRequest(path: string, init: RequestInit = {}) {
  const config = neonConfig();
  if (!config.apiKey || !config.projectId || !config.branchId) {
    throw new Error('Configure NEON_API_KEY, NEON_PROJECT_ID e NEON_BRANCH_ID na Vercel.');
  }

  const response = await fetch(`${NEON_API_BASE}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${config.apiKey}`,
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...(init.headers || {})
    },
    cache: 'no-store'
  });

  const text = await response.text();
  let payload: any = {};
  try { payload = text ? JSON.parse(text) : {}; } catch { payload = { message: text }; }

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Neon respondeu com status ${response.status}.`);
  }
  return payload;
}

function normalizeSnapshots(payload: any) {
  const source = Array.isArray(payload) ? payload : payload?.snapshots || payload?.data || [];
  return source.map((snapshot: any) => ({
    id: snapshot.id || snapshot.snapshot_id || '',
    name: snapshot.name || 'Snapshot sem nome',
    createdAt: snapshot.created_at || snapshot.createdAt || null,
    expiresAt: snapshot.expires_at || snapshot.expiresAt || null,
    sourceBranchId: snapshot.source_branch_id || snapshot.sourceBranchId || null,
    status: snapshot.status || 'ready'
  }));
}

export async function GET() {
  const session = await requireMaster();
  if (!session) return NextResponse.json({ message: 'Acesso restrito ao Master.' }, { status: 403 });

  try {
    const config = neonConfig();
    if (!config.apiKey || !config.projectId || !config.branchId) {
      return NextResponse.json({ configured: false, snapshots: [] });
    }
    const payload = await neonRequest(`/projects/${encodeURIComponent(config.projectId)}/snapshots`);
    return NextResponse.json({ configured: true, snapshots: normalizeSnapshots(payload) });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Não foi possível consultar os snapshots.' }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireMaster();
  if (!session) return NextResponse.json({ message: 'Acesso restrito ao Master.' }, { status: 403 });

  try {
    const body = await request.json().catch(() => ({}));
    const config = neonConfig();
    const fallbackName = `ForgePets-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
    const name = String(body.name || fallbackName).trim().slice(0, 120) || fallbackName;
    const query = new URLSearchParams({ name });

    const payload = await neonRequest(
      `/projects/${encodeURIComponent(config.projectId)}/branches/${encodeURIComponent(config.branchId)}/snapshot?${query.toString()}`,
      { method: 'POST' }
    );

    const snapshot = payload?.snapshot || payload;
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'NEON_SNAPSHOT_CREATED',
        entity: 'DatabaseBackup',
        entityId: snapshot?.id || snapshot?.snapshot_id || null,
        metadata: { name, source: 'MASTER_PANEL' }
      }
    });

    return NextResponse.json({ ok: true, message: 'Snapshot criado no Neon.', snapshot });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Não foi possível criar o snapshot.' }, { status: 502 });
  }
}
