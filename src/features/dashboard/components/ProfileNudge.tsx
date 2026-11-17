'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { profileNudge, type ProfileNudge as NudgeKind } from '@/features/setup/onboarding';
import { persistOnboardingAnswers } from '@/stores/profileStore';
import type { CycleOverview } from '@/hooks/useCycleOverview';

const DISMISS_KEY = 'cs_profile_nudge_dismissed';
/** A dismissed suggestion comes back after this many days if it still applies. */
const SNOOZE_DAYS = 60;

const COPY = {
  es: {
    cyclesChanged: {
      title: 'Tus últimos ciclos han variado',
      body: 'Nos dijiste que tus ciclos son regulares, pero tu registro muestra cambios. Puede ser algo pasajero (estrés, viajes, dejar el anticonceptivo). Si quieres, actualiza tu perfil para ver herramientas para ciclos irregulares.',
      action: 'Actualizar mi perfil',
    },
    review: {
      title: '¿Algo ha cambiado?',
      body: 'Han pasado unos meses desde tu cuestionario. Un embarazo, un cambio de anticonceptivo o un diagnóstico nuevo cambian lo que la app te muestra.',
      action: 'Revisar mi perfil',
    },
    keep: 'Sigue igual', later: 'Ahora no',
  },
  en: {
    cyclesChanged: {
      title: 'Your recent cycles have varied',
      body: 'You told us your cycles are regular, but your log shows changes. It may be temporary (stress, travel, stopping contraception). If you like, update your profile to see tools for irregular cycles.',
      action: 'Update my profile',
    },
    review: {
      title: 'Has anything changed?',
      body: 'It has been a few months since your questionnaire. A pregnancy, a change of contraception or a new diagnosis changes what the app shows you.',
      action: 'Review my profile',
    },
    keep: 'Nothing changed', later: 'Not now',
  },
};

function readDismissed(): { kind: string; date: string } | null {
  try {
    return JSON.parse(window.localStorage.getItem(DISMISS_KEY) ?? 'null');
  } catch {
    return null;
  }
}

/** Suggests updating the profile when the log contradicts it or it is old. Never changes it by itself. */
export const ProfileNudge: React.FC<{ overview: CycleOverview; lang: 'es' | 'en' }> = ({ overview, lang }) => {
  const [hidden, setHidden] = useState(true);
  const kind: NudgeKind | null = overview.loading || overview.paused
    ? null
    : profileNudge(overview.answers, { irregular: !!overview.estimate?.irregular, flags: overview.flags });

  useEffect(() => {
    if (!kind) return;
    const d = readDismissed();
    const snoozed = d && d.kind === kind && (Date.now() - new Date(d.date).getTime()) / 86_400_000 < SNOOZE_DAYS;
    setHidden(!!snoozed);
  }, [kind]);

  if (!kind || hidden) return null;
  const c = COPY[lang];
  const t = c[kind];
  const dismiss = () => {
    try { window.localStorage.setItem(DISMISS_KEY, JSON.stringify({ kind, date: new Date().toISOString() })); } catch { /* storage blocked */ }
    setHidden(true);
  };
  // "Nothing changed" restarts the review clock instead of snoozing.
  const keep = async () => {
    setHidden(true);
    await persistOnboardingAnswers({ ...overview.answers, answeredAt: new Date().toISOString() });
  };

  return (
    <section className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-leaf/30 bg-leaf-soft/40 p-4">
      <span className="material-symbols-outlined text-leaf shrink-0">{kind === 'review' ? 'update' : 'event_repeat'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">{t.title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{t.body}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button type="button" onClick={kind === 'review' ? keep : dismiss} className="px-3 h-9 rounded-full text-xs font-bold text-muted-foreground hover:text-foreground">
          {kind === 'review' ? c.keep : c.later}
        </button>
        <Link href="/archetype" className="px-4 h-9 inline-flex items-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
          {t.action}
        </Link>
      </div>
    </section>
  );
};
