import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireUser } from '@/lib/api/requireUser';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** Removes every file under `prefix/` in a bucket, including subfolders. */
async function removeFolder(admin: SupabaseClient, bucket: string, prefix: string): Promise<void> {
  const files: string[] = [];
  const pending = [prefix];
  while (pending.length) {
    const dir = pending.pop()!;
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await admin.storage.from(bucket).list(dir, { limit: 100, offset });
      if (error) throw error;
      if (!data?.length) break;
      for (const item of data) {
        // Folders come back without an id.
        if (item.id) files.push(`${dir}/${item.name}`);
        else pending.push(`${dir}/${item.name}`);
      }
      if (data.length < 100) break;
    }
  }
  for (let i = 0; i < files.length; i += 100) {
    const { error } = await admin.storage.from(bucket).remove(files.slice(i, i + 100));
    if (error) throw error;
  }
}

/** Avatars are flat files named "<user_id>-<random>.<ext>". */
async function removeAvatars(admin: SupabaseClient, userId: string): Promise<void> {
  const { data, error } = await admin.storage.from('avatars').list('', { limit: 100, search: userId });
  if (error) throw error;
  const names = (data ?? []).filter((f) => f.name.startsWith(`${userId}-`)).map((f) => f.name);
  if (names.length) {
    const { error: rmError } = await admin.storage.from('avatars').remove(names);
    if (rmError) throw rmError;
  }
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  if (body?.confirm !== true) {
    return NextResponse.json({ error: 'Confirmation required' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const userId = auth.user.id;
    // Files first: if this fails the account is still there and the user can retry.
    await removeFolder(admin, 'progress-photos', userId);
    await removeAvatars(admin, userId);
    // Tables go away through ON DELETE CASCADE from auth.users.
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('account delete failed', e);
    return NextResponse.json({ error: 'Could not delete the account' }, { status: 500 });
  }
}
