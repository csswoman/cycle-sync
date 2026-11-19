'use client';

import React, { useState } from 'react';
import type { BodyProfile } from '@/hooks/useBodyProfile';
import { FOCUS_HABITS, weightGoalProgress, type FocusHabitKey } from '@/lib/body/goals';
import { Icon } from '@/components/ui/Icon';
import { parseNum } from '@/features/health/pmos/shared';

interface BodyGoalsProps {
  isEn: boolean;
  profile: BodyProfile;
  saveProfile: (patch: Partial<BodyProfile>) => Promise<boolean>;
  /** Starting and latest weight, when there is at least one entry. */
  startKg: number | null;
  currentKg: number | null;
}

const fieldClass =
  'w-32 min-h-11 bg-background border border-border rounded-xl px-3 text-base text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-primary';

export const BodyGoals: React.FC<BodyGoalsProps> = ({ isEn, profile, saveProfile, startKg, currentKg }) => {
  const lang = isEn ? 'en' : 'es';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const goal = profile.goalWeightKg;
  const progress = goal && startKg && currentKg ? weightGoalProgress(startKg, currentKg, goal) : null;
  const focus = new Set(profile.focusHabits);

  const saveGoal = async () => {
    const kg = parseNum(draft);
    if (kg == null || kg < 30 || kg > 250) {
      setMsg(isEn ? 'Enter a weight between 30 and 250 kg.' : 'Escribe un peso entre 30 y 250 kg.');
      return;
    }
    setMsg(null);
    const ok = await saveProfile({ goalWeightKg: kg });
    if (!ok) setMsg(isEn ? 'Saved on this device only for now.' : 'Por ahora se guardó solo en este dispositivo.');
    setEditing(false);
  };

  const toggleFocus = (key: FocusHabitKey) => {
    const next = focus.has(key) ? profile.focusHabits.filter((k) => k !== key) : [...profile.focusHabits, key];
    void saveProfile({ focusHabits: next });
  };

  return (
    <section aria-labelledby="goals-title" className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-sm flex flex-col gap-6">
      <div>
        <h3 id="goals-title" className="text-foreground text-lg font-semibold text-balance">
          {isEn ? 'My goals' : 'Mis metas'}
        </h3>
        <p className="text-sm text-muted-foreground text-pretty max-w-prose">
          {isEn
            ? 'A number to aim for and the habits that get you there. With PMOS the scale moves slowly; habits are what you control every day.'
            : 'Un número al que apuntar y los hábitos que te llevan ahí. Con PMOS la báscula se mueve lento; los hábitos son lo que controlas cada día.'}
        </p>
      </div>

      {/* Weight goal */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="size-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Icon name="flag" size={18} weight="bold" />
          </span>
          <h4 className="text-base font-semibold text-foreground">{isEn ? 'Weight goal' : 'Meta de peso'}</h4>
        </div>

        {editing || !goal ? (
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm text-muted-foreground">
              {isEn ? 'Goal weight (kg)' : 'Peso meta (kg)'}
              <input
                inputMode="decimal"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={startKg ? String(Math.round(startKg * 0.95)) : ''}
                className={fieldClass}
              />
            </label>
            <button type="button" onClick={saveGoal} className="min-h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
              {isEn ? 'Save goal' : 'Guardar meta'}
            </button>
            {goal && (
              <button type="button" onClick={() => setEditing(false)} className="min-h-11 px-3 text-sm text-muted-foreground hover:text-foreground">
                {isEn ? 'Cancel' : 'Cancelar'}
              </button>
            )}
            {!goal && startKg && (
              <p className="basis-full text-sm text-muted-foreground text-pretty">
                {isEn
                  ? `Tip: losing 5% (${Math.round(startKg * 0.95)} kg for you) already improves cycles and insulin. Start there.`
                  : `Tip: bajar un 5% (${Math.round(startKg * 0.95)} kg en tu caso) ya mejora los ciclos y la insulina. Empieza por ahí.`}
              </p>
            )}
          </div>
        ) : (
          <>
            {progress ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="text-3xl font-semibold text-foreground tabular-nums">
                    {progress.percent}%
                    <span className="ml-2 text-sm font-normal text-muted-foreground">{isEn ? 'of the way' : 'del camino'}</span>
                  </p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {progress.reached
                      ? (isEn ? 'Goal reached' : 'Meta alcanzada')
                      : (isEn ? `${progress.remaining} kg to go` : `Te faltan ${progress.remaining} kg`)}
                  </p>
                </div>

                <div className="relative pt-1">
                  <div
                    className="h-3 rounded-full bg-secondary overflow-hidden"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress.percent}
                    aria-label={isEn ? 'Progress toward goal weight' : 'Avance hacia tu peso meta'}
                  >
                    <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${Math.max(progress.percent, 2)}%` }} />
                  </div>
                  {progress.firstMilestoneKg != null && startKg && goal && (
                    <span
                      aria-hidden
                      className={`absolute top-0 h-5 w-0.5 rounded-full ${progress.firstMilestoneReached ? 'bg-leaf' : 'bg-muted-foreground/60'}`}
                      style={{ left: `${Math.min(100, ((startKg - progress.firstMilestoneKg) / (startKg - goal)) * 100)}%` }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-sm text-muted-foreground tabular-nums">
                  <span>{isEn ? 'Start' : 'Inicio'} {startKg} kg</span>
                  <span className="text-foreground font-medium">{isEn ? 'Now' : 'Ahora'} {currentKg} kg</span>
                  <span>{isEn ? 'Goal' : 'Meta'} {goal} kg</span>
                </div>

                {progress.firstMilestoneKg != null && (
                  <p className={`rounded-2xl px-4 py-3 text-sm text-pretty ${progress.firstMilestoneReached ? 'bg-leaf-soft/60' : 'bg-secondary'} text-foreground`}>
                    <Icon name={progress.firstMilestoneReached ? 'verified' : 'flag'} size={16} weight="bold" className="inline -mt-0.5 mr-1.5 text-leaf" />
                    {progress.firstMilestoneReached
                      ? (isEn
                          ? `You passed the first milestone (${progress.firstMilestoneKg} kg, 5% less). That is when cycles and insulin start to improve.`
                          : `Pasaste el primer hito (${progress.firstMilestoneKg} kg, 5% menos). Ahí es cuando los ciclos y la insulina empiezan a mejorar.`)
                      : (isEn
                          ? `First milestone: ${progress.firstMilestoneKg} kg (5% less). Even that improves cycles and insulin.`
                          : `Primer hito: ${progress.firstMilestoneKg} kg (5% menos). Solo con eso ya mejoran los ciclos y la insulina.`)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isEn ? `Goal: ${goal} kg. Log your weight to see your progress.` : `Meta: ${goal} kg. Registra tu peso para ver tu avance.`}
              </p>
            )}
            <button
              type="button"
              onClick={() => { setDraft(String(goal)); setEditing(true); }}
              className="self-start min-h-10 text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              {isEn ? 'Change my goal' : 'Cambiar mi meta'}
            </button>
          </>
        )}
        {msg && <p role="status" className="text-sm text-destructive">{msg}</p>}
      </div>

      {/* Habit goals */}
      <div className="flex flex-col gap-4 border-t border-border pt-5">
        <div>
          <h4 className="text-base font-semibold text-foreground">{isEn ? 'Habits I want to build' : 'Hábitos que quiero construir'}</h4>
          <p className="text-sm text-muted-foreground text-pretty">
            {isEn ? 'Pick the ones that matter to you now. You can change them anytime.' : 'Elige los que te importan ahora. Puedes cambiarlos cuando quieras.'}
          </p>
        </div>
        <div role="group" aria-label={isEn ? 'Habit goals' : 'Metas de hábitos'} className="flex flex-wrap gap-2">
          {FOCUS_HABITS.map((h) => {
            const on = focus.has(h.key);
            return (
              <button
                key={h.key}
                type="button"
                aria-pressed={on}
                title={h.why[lang]}
                onClick={() => toggleFocus(h.key)}
                className={`min-h-10 px-4 rounded-full text-sm font-medium inline-flex items-center gap-2 border transition-colors ${
                  on ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon name={on ? 'check' : h.icon} size={16} weight="bold" />
                {h.label[lang]}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
