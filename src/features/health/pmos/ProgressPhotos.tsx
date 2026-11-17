'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { supabase } from '@/lib/supabase';
import { toLocalISO, parseLocalDate } from '@/lib/medications/schedule';

type Lang = 'es' | 'en';
type Area = 'face' | 'chin' | 'scalp' | 'body' | 'other';
interface Photo { id: string; date: string; area: Area; path: string; note: string | null; url?: string }

const BUCKET = 'progress-photos';
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_SIDE = 1600;

const T = {
  es: {
    title: 'Fotos de progreso', sub: 'Privadas: solo tú puedes verlas, nunca se incluyen en reportes ni en el asistente. Toma la foto con la misma luz y el mismo ángulo cada mes.',
    areas: { face: 'Cara (acné)', chin: 'Mentón y cuello', scalp: 'Cuero cabelludo', body: 'Cuerpo', other: 'Otra' } as Record<Area, string>,
    add: 'Agregar foto', uploading: 'Subiendo…', note: 'Nota (opcional)', first: 'Primera', latest: 'Más reciente', none: 'Aún no hay fotos de esta zona.',
    reveal: 'Toca para ver', hide: 'Ocultar',
    del: 'Eliminar', confirmDel: '¿Eliminar esta foto?', error: 'No se pudo subir. Revisa que sea JPG, PNG o WebP y que esté aplicada la migración.', all: (n: number) => `Ver todas (${n})`,
  },
  en: {
    title: 'Progress photos', sub: 'Private: only you can see them; they are never included in reports or the assistant. Take them in the same light and angle each month.',
    areas: { face: 'Face (acne)', chin: 'Chin and neck', scalp: 'Scalp', body: 'Body', other: 'Other' } as Record<Area, string>,
    add: 'Add photo', uploading: 'Uploading…', note: 'Note (optional)', first: 'First', latest: 'Latest', none: 'No photos of this area yet.',
    reveal: 'Tap to view', hide: 'Hide',
    del: 'Delete', confirmDel: 'Delete this photo?', error: 'Upload failed. Use JPG, PNG or WebP and make sure the migration is applied.', all: (n: number) => `See all (${n})`,
  },
};

/** Downscales large photos in the browser before upload (keeps storage small and strips EXIF). */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.85));
}

export const ProgressPhotos: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = T[lang];
  const [area, setArea] = useState<Area>('face');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data, error: err } = await supabase.from('progress_photos').select('*').eq('user_id', session.user.id).order('date', { ascending: true });
    if (err || !data) return;
    const rows = data as Photo[];
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(rows.map((r) => r.path), 60 * 30);
    setPhotos(rows.map((r, i) => ({ ...r, url: signed?.[i]?.signedUrl ?? undefined })));
  }, []);
  useEffect(() => { load(); }, [load]);

  const upload = async (file: File) => {
    setBusy(true); setError(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const blob = await compress(file);
      if (blob.size > MAX_BYTES) throw new Error('too big');
      const path = `${session.user.id}/${area}/${Date.now()}.jpg`;
      const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (up.error) throw up.error;
      const ins = await supabase.from('progress_photos').insert({ user_id: session.user.id, date: toLocalISO(new Date()), area, path, note: note.trim() || null });
      if (ins.error) { await supabase.storage.from(BUCKET).remove([path]); throw ins.error; }
      setNote('');
      await load();
    } catch (e) {
      console.error('progress photo upload', e);
      setError(true);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const remove = async (p: Photo) => {
    if (!window.confirm(t.confirmDel)) return;
    await supabase.storage.from(BUCKET).remove([p.path]);
    await supabase.from('progress_photos').delete().eq('id', p.id);
    setPhotos((prev) => prev.filter((x) => x.id !== p.id));
  };

  const toggle = (id: string) => setRevealed((prev) => {
    const next = new Set(prev);
    if (!next.delete(id)) next.add(id);
    return next;
  });
  const inArea = photos.filter((p) => p.area === area);
  const first = inArea[0];
  const latest = inArea.length > 1 ? inArea[inArea.length - 1] : null;
  const fmt = (iso: string) => parseLocalDate(iso).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  const Tile: React.FC<{ p: Photo; label?: string }> = ({ p, label }) => (
    <figure className="relative flex flex-col gap-1">
      {p.url
        ? (
          <button type="button" onClick={() => toggle(p.id)} aria-label={revealed.has(p.id) ? t.hide : t.reveal}
            className="relative block w-full aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <img src={p.url} alt={`${t.areas[p.area]} · ${fmt(p.date)}`}
              className={`w-full h-full object-cover transition-[filter] ${revealed.has(p.id) ? '' : 'blur-2xl scale-110'}`} />
            {!revealed.has(p.id) && <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-sm font-semibold text-foreground bg-background/40"><Icon name="visibility" size={22} />{t.reveal}</span>}
          </button>
        )
        : <div className="w-full aspect-[3/4] rounded-2xl bg-secondary" />}
      <figcaption className="text-sm text-muted-foreground text-pretty">
        {label && <strong className="text-foreground">{label} · </strong>}{fmt(p.date)}{p.note ? ` · ${p.note}` : ''}
      </figcaption>
      <button onClick={() => remove(p)} aria-label={t.del} className="absolute top-1.5 right-1.5 size-10 inline-flex items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-white">
        <Icon name="delete" size={18} />
      </button>
    </figure>
  );

  return (
    <section className="bg-card rounded-3xl border border-border shadow-[var(--shadow-low)] p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="size-10 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <Icon name="photo_camera" size={20} />
        </div>
        <div>
          <h2 className="text-foreground text-lg font-semibold tracking-tight text-balance">{t.title}</h2>
          <p className="text-sm text-muted-foreground text-pretty">{t.sub}</p>
        </div>
      </div>

      <div role="radiogroup" aria-label={t.title} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {(Object.keys(t.areas) as Area[]).map((a) => (
          <button key={a} type="button" role="radio" aria-checked={area === a} onClick={() => { setArea(a); setShowAll(false); }}
            className={`inline-flex items-center min-h-10 px-4 rounded-full text-sm font-semibold whitespace-nowrap border transition-colors ${area === a ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-foreground border-border'}`}>
            {t.areas[a]}
          </button>
        ))}
      </div>

      {inArea.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 text-center rounded-2xl border border-dashed border-border bg-secondary/30 aspect-[16/9] min-h-40 p-6 text-muted-foreground">
          <Icon name="photo_camera" size={28} />
          <p className="text-sm text-pretty max-w-[32ch]">{t.none}</p>
        </div>
      ) : showAll ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{inArea.map((p) => <Tile key={p.id} p={p} />)}</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Tile p={first} label={t.first} />
          {latest && <Tile p={latest} label={t.latest} />}
        </div>
      )}
      {inArea.length > 2 && !showAll && (
        <button onClick={() => setShowAll(true)} className="self-start inline-flex items-center min-h-10 text-sm font-semibold text-primary hover:underline">{t.all(inArea.length)}</button>
      )}

      <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-border">
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder={t.note}
          className="flex-1 min-w-0 bg-secondary text-foreground rounded-full px-4 min-h-11 text-sm border border-border" />
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
        <button onClick={() => input.current?.click()} disabled={busy}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground min-h-11 px-6 rounded-full font-semibold text-sm disabled:opacity-60">
          <Icon name="add_a_photo" size={16} /> {busy ? t.uploading : t.add}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{t.error}</p>}
    </section>
  );
};

export default ProgressPhotos;
