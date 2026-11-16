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

/** Daily PMOS symptom check-in (rate each symptom 0-3 and save for today). */
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

  return (
    <>
        {/* Daily Symptom Check-in Section with Expand-on-Click Layout */}
        <section className="bg-card rounded-2xl border border-border shadow-sm">
          {/* Header & Controls bar */}
          <div className="p-5 sm:p-6 border-b border-border bg-secondary/15 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">monitor_heart</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-foreground text-lg sm:text-xl font-bold">
                    {lang === 'es' ? 'Registro Diario de Síntomas' : 'Daily Symptom Check-in'}
                  </h3>
                  <span className="text-xs sm:text-sm font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {configuredSymptoms.length} {lang === 'es' ? 'en tu rutina' : 'in routine'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {lang === 'es'
                    ? 'Haz clic en cualquier síntoma para expandirlo y registrar tu nivel de hoy. Pasa el cursor por (?) para ver su FAQ.'
                    : 'Click any symptom to expand and rate your intensity today. Hover (?) for quick FAQs.'}
                </p>
              </div>
            </div>

            {/* Actions: Customize routine, Expand all / Collapse, Reset */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenConfigModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-all shadow-2xs"
                title={lang === 'es' ? 'Elegir qué síntomas deseo registrar' : 'Customize symptoms in routine'}
              >
                <span className="material-symbols-outlined text-[17px]">tune</span>
                <span>{lang === 'es' ? 'Personalizar síntomas' : 'Customize symptoms'}</span>
              </button>

              {expandedSymptoms.length < configuredSymptoms.length ? (
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all"
                >
                  {lang === 'es' ? 'Expandir todos' : 'Expand all'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all"
                >
                  {lang === 'es' ? 'Contraer todos' : 'Collapse all'}
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary border border-border transition-all"
                title={lang === 'es' ? 'Restablecer niveles a 0' : 'Reset all values to 0'}
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span className="hidden sm:inline">{lang === 'es' ? 'Limpiar a 0' : 'Reset to 0'}</span>
              </button>
            </div>
          </div>

          {/* Symptom Cards Grid (2 spacious columns, expand on click) */}
          <div className="p-5 sm:p-6 bg-secondary/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {configuredSymptoms.map((key) => {
                const val = values[key] ?? 0;
                const isExpanded = expandedSymptoms.includes(key);

                return (
                  <SymptomCardWithFAQ
                    key={key}
                    symptomKey={key}
                    value={val}
                    onChange={(newVal) => handleSymptomChange(key, newVal)}
                    isExpanded={isExpanded}
                    onToggleExpand={() => handleToggleExpand(key)}
                    onRemoveFromRoutine={() => handleRemoveFromRoutine(key)}
                    lang={lang}
                  />
                );
              })}
            </div>
          </div>

          {/* Save Action Footer */}
          <div className="p-5 sm:p-6 border-t border-border bg-secondary/15 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <span className="material-symbols-outlined text-lg text-primary">cloud_done</span>
              <span>
                {saved
                  ? lang === 'es'
                    ? 'Tus síntomas están guardados para el día de hoy.'
                    : 'Your symptoms are saved for today.'
                  : lang === 'es'
                  ? 'Tienes cambios pendientes de guardar.'
                  : 'You have unsaved changes.'}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {saveSuccessNotice && (
                <span className="text-xs sm:text-sm font-semibold text-emerald-500 flex items-center gap-1.5 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  {lang === 'es' ? '¡Guardado con éxito!' : 'Saved successfully!'}
                </span>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || (saved && !saveSuccessNotice)}
                className="w-full sm:w-auto px-7 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 shadow-lg shadow-primary/20 text-sm sm:text-base"
              >
                <span className="material-symbols-outlined text-xl">
                  {saving ? 'sync' : saved ? 'check_circle' : 'save'}
                </span>
                <span>
                  {saving
                    ? lang === 'es'
                      ? 'Guardando...'
                      : 'Saving...'
                    : saved
                    ? lang === 'es'
                      ? 'Guardado para hoy'
                      : 'Saved for Today'
                    : lang === 'es'
                    ? 'Guardar Registro Diario'
                    : 'Log Symptoms'}
                </span>
              </button>
            </div>
          </div>
        </section>

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
