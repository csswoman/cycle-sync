'use client';
import React, { useEffect, useState } from 'react';
import { usePMOSSymptoms } from '@/hooks/usePMOSSymptoms';
import SymptomCardWithFAQ from '@/features/health/pmos/SymptomCardWithFAQ';
import { PMOS_SYMPTOM_CONFIGS } from '@/features/health/pmos/symptomFaqData';

export interface SymptomSummary { total: number; max: number }

interface SymptomCheckinProps {
  lang: 'es' | 'en';
  configured: string[];
  setConfigured: (next: string[]) => void;
  onSummary?: (summary: SymptomSummary) => void;
}

/** Daily hormonal symptom check-in for every profile (rate each symptom 0-3 and save for today). */
export const SymptomCheckin: React.FC<SymptomCheckinProps> = ({ lang, configured: configuredSymptoms, setConfigured: setConfiguredSymptoms, onSummary }) => {
  const { todayEntry, saving, saveToday, SYMPTOM_KEYS } = usePMOSSymptoms();
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [tempConfigured, setTempConfigured] = useState<string[]>(configuredSymptoms);
  const [expandedSymptoms, setExpandedSymptoms] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, number>>({
    acne: 0, fatigue: 0, hirsutism: 0, hair_loss: 0, mood_swings: 0, bloating: 0,
  });
  const [saved, setSaved] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Sync today's existing entry values
  useEffect(() => {
    if (!todayEntry) return;
    setValues({
      acne: todayEntry.acne ?? 0,
      fatigue: todayEntry.fatigue ?? 0,
      hirsutism: todayEntry.hirsutism ?? 0,
      hair_loss: todayEntry.hair_loss ?? 0,
      mood_swings: todayEntry.mood_swings ?? 0,
      bloating: todayEntry.bloating ?? 0,
    });
    if (todayEntry.id) setSaved(true);
    // Symptoms with a recorded value today must be part of the routine
    const nonZero = SYMPTOM_KEYS.filter((k) => (todayEntry[k] ?? 0) > 0);
    const merged = Array.from(new Set([...configuredSymptoms, ...nonZero]));
    if (merged.length !== configuredSymptoms.length) setConfiguredSymptoms(merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayEntry, SYMPTOM_KEYS]);

  const handleToggleExpand = (key: string) => {
    setExpandedSymptoms((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };
  const handleExpandAll = () => setExpandedSymptoms([...configuredSymptoms]);
  const handleCollapseAll = () => setExpandedSymptoms([]);
  const handleSymptomChange = (key: string, val: number) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
    setSaveSuccessNotice(false);
  };
  const handleSave = async () => {
    await saveToday(values as any);
    setSaved(true);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 4000);
  };
  const handleReset = () => {
    const resetVals: Record<string, number> = {};
    for (const key of SYMPTOM_KEYS) resetVals[key] = 0;
    setValues(resetVals);
    setSaved(false);
  };
  const handleOpenConfigModal = () => {
    setTempConfigured([...configuredSymptoms]);
    setIsConfigModalOpen(true);
  };
  const handleSaveConfig = () => {
    const finalSelection = tempConfigured.length > 0 ? tempConfigured : ['acne', 'fatigue'];
    setConfiguredSymptoms(finalSelection);
    setIsConfigModalOpen(false);
    setValues((prev) => {
      const updated = { ...prev };
      for (const k of SYMPTOM_KEYS) if (!finalSelection.includes(k)) updated[k] = 0;
      return updated;
    });
  };
  const handleRemoveFromRoutine = (key: string) => {
    const next = configuredSymptoms.filter((k) => k !== key);
    setConfiguredSymptoms(next.length > 0 ? next : ['acne']);
    setExpandedSymptoms((prev) => prev.filter((k) => k !== key));
    setValues((v) => ({ ...v, [key]: 0 }));
    setSaved(false);
  };

  const total = configuredSymptoms.reduce((sum, key) => sum + (values[key] ?? 0), 0);
  const max = Math.max(configuredSymptoms.length, 1) * 3;
  useEffect(() => {
    onSummary?.({ total, max });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, max]);

  const es = lang === 'es';
  const withSymptoms = configuredSymptoms.filter((k) => (values[k] ?? 0) > 0).length;
  const allExpanded = expandedSymptoms.length >= configuredSymptoms.length;
  const quietBtn = 'min-h-10 px-3 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary inline-flex items-center gap-1.5 transition-colors';
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-6">
        <section className="lg:col-span-8 flex flex-col gap-4" aria-labelledby="symptom-checkin-title">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div>
              <h2 id="symptom-checkin-title" className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight text-balance">
                {es ? 'Síntomas de hoy' : 'Today’s symptoms'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-prose text-pretty">
                {es
                  ? 'Abre un síntoma para marcar cómo lo sientes hoy. El signo de interrogación explica qué lo causa y qué suele ayudar.'
                  : 'Open a symptom to rate how it feels today. The question mark explains its causes and what often helps.'}
              </p>
            </div>
            <div className="flex items-center gap-1 -mr-3">
              <button type="button" onClick={allExpanded ? handleCollapseAll : handleExpandAll} className={quietBtn}>
                {allExpanded ? (es ? 'Contraer todos' : 'Collapse all') : (es ? 'Expandir todos' : 'Expand all')}
              </button>
              <button type="button" onClick={handleReset} className={quietBtn}>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">restart_alt</span>
                {es ? 'Poner todo en 0' : 'Reset to 0'}
              </button>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border py-1">
            {configuredSymptoms.map((key) => (
              <SymptomCardWithFAQ
                key={key}
                symptomKey={key}
                value={values[key] ?? 0}
                onChange={(newVal) => handleSymptomChange(key, newVal)}
                isExpanded={expandedSymptoms.includes(key)}
                onToggleExpand={() => handleToggleExpand(key)}
                onRemoveFromRoutine={() => handleRemoveFromRoutine(key)}
                lang={lang}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleOpenConfigModal}
            className="self-start min-h-11 px-4 rounded-full border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary inline-flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">tune</span>
            {es ? 'Elegir qué síntomas registrar' : 'Choose which symptoms to track'}
          </button>
        </section>
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-6 bg-card/70 border border-border rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
            <div>
              <h3 className="text-lg font-semibold text-foreground tracking-tight">{es ? 'Tu registro de hoy' : 'Today’s check-in'}</h3>
              <p className="text-sm text-muted-foreground mt-1 text-pretty">
                {withSymptoms === 0
                  ? (es ? 'Todo en 0 por ahora.' : 'Everything at 0 for now.')
                  : es
                  ? `${withSymptoms} de ${configuredSymptoms.length} con algún nivel.`
                  : `${withSymptoms} of ${configuredSymptoms.length} with some level.`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || (saved && !saveSuccessNotice)}
              className="w-full min-h-12 px-6 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-full transition-colors flex items-center justify-center gap-2.5 disabled:opacity-60 text-base"
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                {saving ? 'sync' : saved ? 'check_circle' : 'save'}
              </span>
              {saving ? (es ? 'Guardando…' : 'Saving…') : saved ? (es ? 'Guardado para hoy' : 'Saved for today') : (es ? 'Guardar registro' : 'Save check-in')}
            </button>
            <p className="text-sm text-muted-foreground flex items-start gap-2" role="status" aria-live="polite">
              <span className={`material-symbols-outlined text-[20px] shrink-0 ${saved ? 'text-leaf' : 'text-muted-foreground'}`} aria-hidden="true">
                {saved ? 'cloud_done' : 'edit_note'}
              </span>
              <span>
                {saveSuccessNotice
                  ? (es ? 'Guardado con éxito.' : 'Saved successfully.')
                  : saved
                  ? (es ? 'Tus síntomas están guardados para hoy.' : 'Your symptoms are saved for today.')
                  : (es ? 'Tienes cambios sin guardar.' : 'You have unsaved changes.')}
              </span>
            </p>
          </div>
        </aside>
      </div>
        {/* Modal: Personalizar qué síntomas registrar (tucked away, doesn't take up space) */}
        {isConfigModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl p-6 sm:p-7 flex flex-col gap-5 text-left animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between border-b border-border/70 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">tune</span>
                  </div>
                  <div>
                    <h3 className="text-foreground text-lg sm:text-xl font-bold">
                      {lang === 'es' ? 'Personalizar mis síntomas' : 'Customize My Symptoms'}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      {lang === 'es'
                        ? 'Elige qué síntomas forman parte de tu rutina. Tu configuración se guardará y los no seleccionados se ocultarán.'
                        : 'Choose which symptoms belong in your routine. Unselected symptoms will stay hidden.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              {/* Checkboxes list */}
              <div className="flex flex-col gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {SYMPTOM_KEYS.map((key) => {
                  const cfg = PMOS_SYMPTOM_CONFIGS[key];
                  if (!cfg) return null;
                  const isChecked = tempConfigured.includes(key);

                  return (
                    <label
                      key={key}
                      onClick={() => {
                        setTempConfigured((prev) =>
                          prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
                        );
                      }}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-primary/10 border-primary/40 text-foreground shadow-2xs'
                          : 'bg-secondary/30 border-border/70 text-muted-foreground hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.accentBg} ${cfg.accentBorder} border`}
                        >
                          <span className={`material-symbols-outlined text-xl ${cfg.color}`}>
                            {cfg.icon}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm sm:text-base font-bold text-foreground">
                            {cfg.name[lang]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {cfg.tagline[lang]}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-primary border-primary text-primary-foreground font-bold'
                            : 'border-border bg-card'
                        }`}
                      >
                        {isChecked && (
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border/70">
                <button
                  type="button"
                  onClick={() => {
                    if (tempConfigured.length === SYMPTOM_KEYS.length) {
                      setTempConfigured(['acne', 'fatigue']);
                    } else {
                      setTempConfigured([...SYMPTOM_KEYS]);
                    }
                  }}
                  className="text-xs sm:text-sm font-semibold text-primary hover:underline"
                >
                  {tempConfigured.length === SYMPTOM_KEYS.length
                    ? lang === 'es'
                      ? 'Desmarcar todos'
                      : 'Clear all'
                    : lang === 'es'
                    ? 'Seleccionar todos'
                    : 'Select all'}
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsConfigModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    {lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all"
                  >
                    {lang === 'es' ? 'Guardar configuración' : 'Save configuration'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default SymptomCheckin;
