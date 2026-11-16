'use client';
import React, { useEffect, useState } from 'react';
import { parseLocalDate } from '@/lib/cycle/cycleEngine';
import type { CycleSign } from '@/lib/cycle/fertilitySigns';
import { FlowFields, type FlowValue } from './FlowFields';
type Lang = 'es' | 'en';
/** Shortcut under the calendar: flow, clots and pain for a tapped bleeding day. */
export const FlowQuickEditor: React.FC<{
  lang: Lang;
  sign: CycleSign;
  onSave: (sign: CycleSign) => Promise<boolean>;
  onClose: () => void;
}> = ({ lang, sign, onSave, onClose }) => {
  const es = lang === 'es';
  const [draft, setDraft] = useState<FlowValue>({ flow: sign.flow ?? null, clots: !!sign.clots, pain: sign.pain ?? null });
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  useEffect(() => {
    setDraft({ flow: sign.flow ?? null, clots: !!sign.clots, pain: sign.pain ?? null });
    setStatus('idle');
  }, [sign.date]); // eslint-disable-line react-hooks/exhaustive-deps
  const label = new Intl.DateTimeFormat(es ? 'es' : 'en', { weekday: 'long', day: 'numeric', month: 'long' }).format(parseLocalDate(sign.date));
  const save = async () => {
    setStatus('saving');
    const ok = await onSave({ ...sign, flow: draft.flow ?? null, clots: !!draft.clots, pain: draft.pain ?? null });
    if (ok) onClose(); else setStatus('error');
  };
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-foreground capitalize">{label}</h4>
        <button type="button" onClick={onClose} aria-label={es ? 'Cerrar' : 'Close'} className="text-muted-foreground hover:text-foreground">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
      <FlowFields lang={lang} value={draft} onChange={(patch) => { setDraft((d) => ({ ...d, ...patch })); setStatus('idle'); }} />
      {status === 'error' && <p className="text-xs font-semibold text-destructive" role="alert">{es ? 'No se pudo guardar.' : 'Could not save.'}</p>}
      <button type="button" onClick={save} disabled={status === 'saving'}
        className="w-full bg-primary text-primary-foreground font-bold h-10 rounded-xl disabled:opacity-50">
        {status === 'saving' ? (es ? 'Guardando...' : 'Saving...') : (es ? 'Guardar' : 'Save')}
      </button>
    </div>
  );
};
export default FlowQuickEditor;
