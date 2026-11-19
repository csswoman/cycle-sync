'use client';
import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/offlineDb';
import { hasAiConsent, revokeAiConsent } from '@/lib/ai/consent';
import { SettingsSection } from './components/SettingsComponents';
import { PIN_CHANGED_EVENT } from '@/components/layout/PinLock';
import { EXPORT_TABLES, buildExport } from '@/lib/privacy/export';
import {
  DEFAULT_IDLE_MINUTES, IDLE_OPTIONS, PIN_PATTERN, clearPinRecord, createPinRecord, loadPinRecord, savePinRecord,
} from '@/lib/privacy/pin';

const PAGE = 1000;
const inputCls = 'w-full bg-secondary border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all';

async function fetchAll(table: string, userId: string): Promise<unknown[] | null> {
  const rows: unknown[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select('*').eq('user_id', userId).range(from, from + PAGE - 1);
    if (error) return null; // table missing (migration not applied) or not readable
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

const PrivacySettings: React.FC = () => {
  const { language } = useLanguage();
  const es = language === 'es';
  const [hasPin, setHasPin] = useState(() => loadPinRecord() !== null);
  const [idle, setIdle] = useState<number>(() => loadPinRecord()?.idleMinutes ?? DEFAULT_IDLE_MINUTES);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [word, setWord] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const confirmWord = es ? 'BORRAR' : 'DELETE';
  const [aiConsent, setAiConsent] = useState<boolean | null>(null);
  useEffect(() => { void hasAiConsent().then(setAiConsent).catch(() => setAiConsent(false)); }, []);
  const withdrawAi = async () => {
    const ok = await revokeAiConsent();
    if (ok) setAiConsent(false);
    setMsg(ok
      ? { ok: true, text: es ? 'Permiso de IA retirado.' : 'AI permission withdrawn.' }
      : { ok: false, text: es ? 'No se pudo retirar el permiso. Inténtalo de nuevo.' : 'Could not withdraw the permission. Try again.' });
  };

  const savePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!PIN_PATTERN.test(pin)) return setMsg({ ok: false, text: es ? 'El PIN debe tener de 4 a 8 dígitos.' : 'The PIN must be 4 to 8 digits.' });
    if (pin !== pin2) return setMsg({ ok: false, text: es ? 'Los PIN no coinciden.' : 'The PINs do not match.' });
    savePinRecord(await createPinRecord(pin, idle));
    setHasPin(true); setPin(''); setPin2('');
    window.dispatchEvent(new Event(PIN_CHANGED_EVENT));
    setMsg({ ok: true, text: es ? 'PIN guardado en este dispositivo.' : 'PIN saved on this device.' });
  };
  const removePin = () => {
    clearPinRecord(); setHasPin(false);
    window.dispatchEvent(new Event(PIN_CHANGED_EVENT));
    setMsg({ ok: true, text: es ? 'PIN eliminado.' : 'PIN removed.' });
  };
  const changeIdle = async (minutes: number) => {
    setIdle(minutes);
    const rec = loadPinRecord();
    if (rec) { savePinRecord({ ...rec, idleMinutes: minutes }); window.dispatchEvent(new Event(PIN_CHANGED_EVENT)); }
  };

  const exportData = async () => {
    setExporting(true); setMsg(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('no user');
      const results: Record<string, unknown[] | null> = {};
      // 4 workers pull from a shared index so at most 4 tables are fetched at once.
      let next = 0;
      await Promise.all(Array.from({ length: 4 }, async () => {
        while (next < EXPORT_TABLES.length) { const t = EXPORT_TABLES[next++]; results[t] = await fetchAll(t, user.id); }
      }));
      const out = buildExport({ id: user.id, email: user.email }, results);
      const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url; a.download = `cyclesync-data-${out.exportedAt.slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMsg({ ok: false, text: es ? 'No se pudieron descargar tus datos.' : 'Could not download your data.' });
    } finally { setExporting(false); }
  };

  const deleteAccount = async () => {
    setDeleting(true); setMsg(null);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: true }),
      });
      if (!res.ok) throw new Error(String(res.status));
      // Local copies: browser storage and the offline queue.
      window.localStorage.clear();
      window.sessionStorage.clear();
      db.close();
      await db.delete().catch(() => undefined);
      await supabase.auth.signOut().catch(() => undefined);
      // Full reload: db is an in-memory singleton and is now closed/deleted.
      window.location.href = '/login';
    } catch {
      setMsg({ ok: false, text: es ? 'No se pudo borrar la cuenta. No se perdió nada; inténtalo de nuevo.' : 'Could not delete the account. Nothing was lost; try again.' });
      setDeleting(false);
    }
  };

  return (
    <SettingsSection quiet title={es ? 'Privacidad y datos' : 'Privacy and data'} icon="lock">
      <div className="flex flex-col gap-8">
        {msg && (
          <div role="status" className={`p-3 rounded-xl border text-sm ${msg.ok ? 'bg-leaf/10 border-leaf/20 text-leaf' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>{msg.text}</div>
        )}

        <div className="flex flex-col gap-3">
          <h3 className="text-foreground font-semibold">{es ? 'Bloqueo con PIN' : 'PIN lock'}</h3>
          <p className="text-sm text-muted-foreground">
            {es ? 'Oculta la app al abrirla y tras un rato sin usarla. Se guarda solo en este dispositivo. Es una pantalla de privacidad, no cifra tus datos.'
              : 'Hides the app when you open it and after a while unused. Stored only on this device. It is a privacy screen and does not encrypt your data.'}
          </p>
          <form onSubmit={savePin} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="password" inputMode="numeric" maxLength={8} autoComplete="off" className={inputCls} value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder={hasPin ? (es ? 'Nuevo PIN (4 a 8 dígitos)' : 'New PIN (4 to 8 digits)') : (es ? 'PIN (4 a 8 dígitos)' : 'PIN (4 to 8 digits)')} aria-label="PIN" />
            <input type="password" inputMode="numeric" maxLength={8} autoComplete="off" className={inputCls} value={pin2}
              onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))} placeholder={es ? 'Repite el PIN' : 'Repeat the PIN'} aria-label={es ? 'Repite el PIN' : 'Repeat the PIN'} />
            <div className="flex gap-3 sm:col-span-2 items-center flex-wrap">
              <button type="submit" className="px-6 h-11 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20">
                {hasPin ? (es ? 'Cambiar PIN' : 'Change PIN') : (es ? 'Activar PIN' : 'Turn on PIN')}
              </button>
              {hasPin && <button type="button" onClick={removePin} className="px-6 h-11 rounded-xl border border-border text-foreground font-bold">{es ? 'Quitar PIN' : 'Remove PIN'}</button>}
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                {es ? 'Bloquear tras' : 'Lock after'}
                <select value={idle} onChange={(e) => void changeIdle(Number(e.target.value))} className="bg-secondary border border-border rounded-xl px-3 min-h-10 text-foreground">
                  {IDLE_OPTIONS.map((m) => <option key={m} value={m}>{m} min</option>)}
                </select>
              </label>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-foreground font-semibold">{es ? 'Funciones de IA (Google Gemini)' : 'AI features (Google Gemini)'}</h3>
          <p className="text-sm text-muted-foreground">
            {es ? 'El asistente, la lectura de análisis, el análisis de fotos y videos, y la generación de recetas y planes envían a Google Gemini tus mensajes, archivos y un resumen de tus registros de salud. Si retiras el permiso, se te preguntará otra vez antes de usar la IA.'
              : 'The assistant, lab report reading, photo and video analysis, and recipe and plan generation send Google Gemini your messages, files and a summary of your health records. If you withdraw permission, you will be asked again before AI is used.'}
          </p>
          <p className="text-sm text-foreground">
            {aiConsent === null ? '...' : aiConsent
              ? (es ? 'Estado: permitido.' : 'Status: allowed.')
              : (es ? 'Estado: no permitido.' : 'Status: not allowed.')}
          </p>
          {aiConsent && (
            <button type="button" onClick={() => void withdrawAi()} className="w-fit px-6 h-11 rounded-xl border border-border text-foreground font-bold">
              {es ? 'Retirar permiso' : 'Withdraw permission'}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-foreground font-semibold">{es ? 'Descargar mis datos' : 'Download my data'}</h3>
          <p className="text-sm text-muted-foreground">
            {es ? 'Un archivo JSON con todos tus registros. Las fotos de progreso no van en el archivo; solo sus fechas y notas.'
              : 'A JSON file with all your records. Progress photo files are not included, only their dates and notes.'}
          </p>
          <button type="button" onClick={() => void exportData()} disabled={exporting} className="w-fit px-6 h-11 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 disabled:opacity-50">
            {exporting ? '...' : (es ? 'Descargar JSON' : 'Download JSON')}
          </button>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-6">
          <h3 className="text-destructive font-semibold">{es ? 'Borrar mi cuenta' : 'Delete my account'}</h3>
          <p className="text-sm text-muted-foreground">
            {es ? 'Borra tu cuenta, todos tus registros y tus fotos. No se puede deshacer. Descarga tus datos antes si los quieres.'
              : 'Deletes your account, all your records and your photos. This cannot be undone. Download your data first if you want a copy.'}
          </p>
          <label className="flex flex-col gap-1 text-sm text-foreground">
            <span>{es ? <>Escribe <strong>{confirmWord}</strong> para confirmar</> : <>Type <strong>{confirmWord}</strong> to confirm</>}</span>
            <input className={inputCls} value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" />
          </label>
          <button type="button" onClick={() => void deleteAccount()} disabled={deleting || word.trim() !== confirmWord}
            className="w-fit px-6 h-11 rounded-xl bg-destructive text-destructive-foreground font-bold disabled:opacity-50">
            {deleting ? '...' : (es ? 'Borrar cuenta definitivamente' : 'Delete account permanently')}
          </button>
        </div>
      </div>
    </SettingsSection>
  );
};

export default PrivacySettings;
