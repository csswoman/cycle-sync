'use client';
import React, { useRef, useState } from 'react';
import { aiFetch, AiConsentDeclinedError } from '@/lib/ai/consent';
import { markerInfo, markerLabel, markerStatus } from '@/lib/pmos/metrics';
import type { ExtractedLab } from '@/lib/pmos/labExtract';
import { todayLocal } from './shared';

type Lang = 'es' | 'en';

const T = {
  es: {
    upload: 'Subir análisis', reading: 'Leyendo el archivo…', choose: 'Foto o PDF de tu análisis',
    note: 'El archivo se envía para leerlo y no se guarda. Revisa cada fila antes de guardar.',
    errType: 'Sube una imagen o un PDF.', errSize: 'El archivo pesa más de 4 MB.', errRead: 'No se pudo leer el archivo.',
    empty: 'No se encontraron resultados que la app reconozca.',
    original: 'En el archivo', converted: 'Se guardará', doubtful: 'Revisar: unidad, fecha o prueba dudosa',
    save: 'Guardar seleccionados', saving: 'Guardando…', cancel: 'Cancelar', close: 'Cerrar',
    footer: 'Comprueba los valores con tu informe. El rango de tu laboratorio tiene prioridad.',
    status: { ok: 'En rango', low: 'Bajo', high: 'Alto', none: 'Sin rango' },
  },
  en: {
    upload: 'Upload results', reading: 'Reading the file…', choose: 'Photo or PDF of your lab report',
    note: 'The file is sent to be read and is not stored. Review every row before saving.',
    errType: 'Upload an image or a PDF.', errSize: 'The file is larger than 4 MB.', errRead: 'Could not read the file.',
    empty: 'No results the app recognizes were found.',
    original: 'In the file', converted: 'Will be saved', doubtful: 'Check: unit, date or test is uncertain',
    save: 'Save selected', saving: 'Saving…', cancel: 'Cancel', close: 'Close',
    footer: "Check the values against your report. Your lab's own range takes priority.",
    status: { ok: 'In range', low: 'Below range', high: 'Above range', none: 'No range' },
  },
};

const MAX_BYTES = 4 * 1024 * 1024;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/** Shrinks big photos so phone pictures stay under the upload limit. Falls back to the original. */
async function prepareImage(file: File): Promise<string> {
  const original = await readAsDataUrl(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = original;
    });
    const scale = Math.min(1, 1800 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return original;
  }
}

interface Row extends ExtractedLab { on: boolean }

interface Props {
  lang: Lang;
  saving: boolean;
  onSave: (rows: { marker: ExtractedLab['marker']; value: number; date: string }[]) => Promise<boolean>;
}

const LabScanDialog: React.FC<Props> = ({ lang, saving, onSave }) => {
  const t = T[lang];
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);

  const reset = () => { setOpen(false); setRows(null); setError(null); setBusy(false); };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setRows(null);
    setOpen(true);
    const isPdf = file.type === 'application/pdf';
    if (!isPdf && !file.type.startsWith('image/')) { setError(t.errType); return; }
    setBusy(true);
    try {
      const media = isPdf ? await readAsDataUrl(file) : await prepareImage(file);
      // Base64 adds a third; the server limit is on the encoded string.
      if (media.length * 0.75 > MAX_BYTES) { setError(t.errSize); return; }
      const res = await aiFetch('/api/labs/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media, today: todayLocal() }),
      });
      if (!res.ok) { setError(res.status === 413 ? t.errSize : t.errRead); return; }
      const data = (await res.json()) as { rows?: ExtractedLab[] };
      setRows((data.rows ?? []).map((r) => ({ ...r, on: !r.doubtful })));
    } catch (e) {
      if (e instanceof AiConsentDeclinedError) { reset(); return; }
      setError(t.errRead);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const selected = rows?.filter((r) => r.on) ?? [];
  const handleSave = async () => {
    if (await onSave(selected.map(({ marker, value, date }) => ({ marker, value, date })))) reset();
  };
  const toggle = (i: number) => setRows((prev) => prev && prev.map((r, k) => (k === i ? { ...r, on: !r.on } : r)));

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])} aria-label={t.choose} />
      <button type="button" onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/70 text-foreground font-semibold text-sm min-h-11 px-5 rounded-full border border-border">
        <span className="material-symbols-outlined text-base">upload_file</span>
        {t.upload}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label={t.upload}>
          <div className="bg-card border border-border rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90dvh] sm:max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-border flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-foreground text-balance">{t.upload}</h2>
              <button type="button" onClick={reset} className="size-11 -mr-2 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary" aria-label={t.close}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex flex-col gap-3">
              <p className="text-sm text-muted-foreground text-pretty">{t.note}</p>
              {busy && <p className="text-sm text-muted-foreground">{t.reading}</p>}
              {error && <p className="text-sm text-destructive">{error}</p>}
              {rows && rows.length === 0 && <p className="text-sm text-muted-foreground">{t.empty}</p>}
              {rows && rows.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {rows.map((r, i) => {
                    const info = markerInfo(r.marker);
                    const status = markerStatus(info, r.value);
                    return (
                      <li key={`${r.marker}-${r.date}-${i}`} className="flex items-start gap-3 border border-border rounded-2xl p-3 sm:p-4">
                        <input type="checkbox" className="size-5 shrink-0 accent-primary" checked={r.on} onChange={() => toggle(i)}
                          aria-label={`${markerLabel(info, lang)} ${r.value} ${r.unit}`} />
                        <div className="flex-1 min-w-0 text-sm text-muted-foreground">
                          <p className="font-semibold text-foreground">{markerLabel(info, lang)} · {r.value} {r.unit}</p>
                          <p>{t.original}: {r.rawLabel} · {r.date}</p>
                          <p>{t.status[status]}</p>
                          {r.doubtful && <p className="text-sun-ink">{t.doubtful}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {rows && rows.length > 0 && <p className="text-sm text-muted-foreground text-pretty">{t.footer}</p>}
            </div>
            <div className="p-4 sm:p-5 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={reset} className="min-h-11 px-5 rounded-full text-sm font-semibold text-foreground border border-border hover:bg-secondary">{t.cancel}</button>
              {rows && rows.length > 0 && (
                <button type="button" onClick={handleSave} disabled={saving || selected.length === 0}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm min-h-11 px-6 rounded-full disabled:opacity-60">
                  {saving ? t.saving : `${t.save} (${selected.length})`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LabScanDialog;
