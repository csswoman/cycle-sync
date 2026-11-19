'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { useGuest } from '@/hooks/useGuest';
import type { TodayCheckinState, StoredLog } from '@/hooks/useTodayCheckin';
import type { CravingKind } from '@/lib/today/dailyPlan';

type Lang = 'es' | 'en';

const COPY = {
    es: {
        title: '¿Cómo vas hoy?',
        hint: 'Un toque por fila. Se guarda solo y puedes dejar filas vacías.',
        hintLabel: 'Cómo funciona el check-in',
        done: 'Guardado',
        same: 'Igual que ayer',
        energy: 'Energía',
        energyOpts: ['Baja', 'Media', 'Alta'],
        motivation: 'Ganas de moverme',
        motivationOpts: ['Nada', 'Poquitas', 'Con todo'],
        sleep: 'Dormí',
        sleepOpts: ['< 6 h', '6–7 h', '7–8 h', '8 h +'],
        cravings: 'Antojos',
        none: 'Ninguno',
        cravingOpts: { sweet: 'Dulce', salty: 'Salado', carbs: 'Carbohidratos' } as Record<CravingKind, string>,
        intensity: '¿Qué tan fuerte?',
        intensityOpts: ['Leve', 'Medio', 'Fuerte'],
        more: 'Algo más en el cuerpo',
        less: 'Ocultar',
        full: 'Registro completo',
        step: (n: number, total: number) => `Pregunta ${n} de ${total}`,
        prev: 'Pregunta anterior',
        next: 'Siguiente pregunta',
        close: 'Volver a tus datos',
        body: { Bloating: 'Hinchazón', 'Mild Cramps': 'Cólicos', Headache: 'Dolor de cabeza', Anxiety: 'Ansiedad', 'Energy Crash After Meals': 'Bajón después de comer', 'Acne Flare': 'Brote de acné' } as Record<string, string>,
    },
    en: {
        title: 'How are you today?',
        hint: 'One tap per row. It saves on its own and rows can stay empty.',
        hintLabel: 'How the check-in works',
        done: 'Saved',
        same: 'Same as yesterday',
        energy: 'Energy',
        energyOpts: ['Low', 'Medium', 'High'],
        motivation: 'Up for moving',
        motivationOpts: ['Not at all', 'A little', 'All in'],
        sleep: 'Slept',
        sleepOpts: ['< 6 h', '6–7 h', '7–8 h', '8 h +'],
        cravings: 'Cravings',
        none: 'None',
        cravingOpts: { sweet: 'Sweet', salty: 'Salty', carbs: 'Carbs' } as Record<CravingKind, string>,
        intensity: 'How strong?',
        intensityOpts: ['Mild', 'Medium', 'Strong'],
        more: 'Anything else in your body',
        less: 'Hide',
        full: 'Full log',
        step: (n: number, total: number) => `Question ${n} of ${total}`,
        prev: 'Previous question',
        next: 'Next question',
        close: 'Back to your data',
        body: { Bloating: 'Bloating', 'Mild Cramps': 'Cramps', Headache: 'Headache', Anxiety: 'Anxiety', 'Energy Crash After Meals': 'Crash after meals', 'Acne Flare': 'Acne flare' } as Record<string, string>,
    },
};

/** Energy is stored 1-10 (same scale as the full log); the card offers three buckets. */
const ENERGY_VALUES = [3, 6, 9];
const energyBucket = (v: number | null) => (v == null ? -1 : v <= 3 ? 0 : v <= 6 ? 1 : 2);
const SLEEP_VALUES = [5.5, 6.5, 7.5, 8.5];
const sleepBucket = (v: number | null) => (v == null ? -1 : v < 6 ? 0 : v < 7 ? 1 : v < 8 ? 2 : 3);
const CRAVINGS: CravingKind[] = ['sweet', 'salty', 'carbs'];

interface ChipProps {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
    role?: 'radio' | 'checkbox';
}
const Chip: React.FC<ChipProps> = ({ selected, onClick, children, role = 'radio' }) => (
    <button
        type="button"
        role={role}
        aria-checked={selected}
        onClick={onClick}
        className={`min-h-8 px-2.5 rounded-full text-[13px] font-medium whitespace-nowrap border transition-colors cursor-pointer active:scale-[0.98] ${selected
            ? 'bg-primary/15 border-primary/40 text-primary'
            : 'bg-card border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
            }`}
    >
        {children}
    </button>
);

/** Mini dashboard tile: tinted icon + label inline, chips below. `wide` spans both columns. */
const Row: React.FC<{ label: string; icon: string; children: React.ReactNode; multi?: boolean; wide?: boolean }> = ({ label, icon, children, multi, wide }) => (
    <div className={`flex flex-col gap-2 min-w-0 rounded-xl bg-card/70 border border-border/50 p-2.5 ${wide ? 'col-span-2' : ''}`}>
        <p className="flex items-center gap-2 text-[13px] text-foreground font-semibold">
            <span className="grid place-items-center size-6 rounded-lg bg-blossom/10 text-blossom shrink-0">
                <Icon name={icon} size={14} weight="duotone" />
            </span>{label}
        </p>
        <div role={multi ? 'group' : 'radiogroup'} aria-label={label} className="flex flex-wrap gap-1.5">{children}</div>
    </div>
);
/**
 * One-tap daily check-in: energy, motivation, sleep, cravings and a few body signals.
 * `paged` shows one question at a time (for the dashboard's body tab); picking a single answer moves on.
 */
export const QuickCheckin: React.FC<{ state: TodayCheckinState; lang: Lang; paged?: boolean; onClose?: () => void }> = ({ state, lang, paged = false, onClose }) => {
    const copy = COPY[lang];
    const router = useRouter();
    const { isGuest, promptSignup } = useGuest();
    const [moreOpen, setMoreOpen] = useState(false);
    const [page, setPage] = useState(0);
    const { log, logged, yesterday, save } = state;

    const set = (patch: Partial<StoredLog>) => {
        if (isGuest || !state.userId) { promptSignup(); return; }
        void save(patch);
    };
    const toggleCraving = (k: CravingKind) => {
        const cravings = log.cravings.includes(k) ? log.cravings.filter((c) => c !== k) : [...log.cravings, k];
        set({ cravings, cravingIntensity: cravings.length ? log.cravingIntensity ?? 1 : null });
    };
    const toggleSymptom = (s: string) =>
        set({ symptoms: log.symptoms.includes(s) ? log.symptoms.filter((x) => x !== s) : [...log.symptoms, s] });
    const sameAsYesterday = () => {
        if (!yesterday) return;
        set({
            energyLevel: yesterday.energyLevel, motivation: yesterday.motivation, sleepHours: yesterday.sleepHours,
            mood: yesterday.mood, cravings: yesterday.cravings, cravingIntensity: yesterday.cravingIntensity,
            symptoms: yesterday.symptoms,
        });
    };

    if (state.loading) {
        return <div className={`${paged ? 'h-28' : 'h-40'} rounded-2xl bg-secondary/40 animate-pulse`} aria-hidden />;
    }

    if (paged) {
        const signedIn = !isGuest && !!state.userId;
        const last = 4;
        /** Saves a single-choice answer and, when it saved, moves to the next question. */
        const pick = (patch: Partial<StoredLog>) => {
            set(patch);
            if (signedIn) setPage((p) => Math.min(p + 1, last));
        };
        const steps: { id: string; label: string; icon: string; multi?: boolean; body: React.ReactNode }[] = [
            {
                id: 'energy', label: copy.energy, icon: 'bolt',
                body: copy.energyOpts.map((o, i) => (
                    <Chip key={o} selected={energyBucket(log.energyLevel) === i} onClick={() => pick({ energyLevel: ENERGY_VALUES[i] })}>{o}</Chip>
                )),
            },
            {
                id: 'motivation', label: copy.motivation, icon: 'walk',
                body: copy.motivationOpts.map((o, i) => (
                    <Chip key={o} selected={log.motivation === i + 1} onClick={() => pick({ motivation: i + 1 })}>{o}</Chip>
                )),
            },
            {
                id: 'sleep', label: copy.sleep, icon: 'bedtime',
                body: copy.sleepOpts.map((o, i) => (
                    <Chip key={o} selected={sleepBucket(log.sleepHours) === i} onClick={() => pick({ sleepHours: SLEEP_VALUES[i] })}>{o}</Chip>
                )),
            },
            {
                id: 'cravings', label: copy.cravings, icon: 'local_fire_department', multi: true,
                body: (
                    <>
                        <Chip role="checkbox" selected={logged && log.cravings.length === 0} onClick={() => pick({ cravings: [], cravingIntensity: null })}>{copy.none}</Chip>
                        {CRAVINGS.map((k) => (
                            <Chip key={k} role="checkbox" selected={log.cravings.includes(k)} onClick={() => toggleCraving(k)}>{copy.cravingOpts[k]}</Chip>
                        ))}
                        {log.cravings.length > 0 && (
                            <span role="radiogroup" aria-label={copy.intensity} className="flex items-center gap-1.5 pl-2 ml-0.5 border-l border-border">
                                <span className="text-[13px] text-muted-foreground mr-0.5 whitespace-nowrap">{copy.intensity}</span>
                                {copy.intensityOpts.map((o, i) => (
                                    <Chip key={o} selected={log.cravingIntensity === i + 1} onClick={() => pick({ cravingIntensity: i + 1 })}>{o}</Chip>
                                ))}
                            </span>
                        )}
                    </>
                ),
            },
            {
                id: 'body', label: copy.more, icon: 'monitor_heart', multi: true,
                body: Object.entries(copy.body).map(([key, label]) => (
                    <Chip key={key} role="checkbox" selected={log.symptoms.includes(key)} onClick={() => toggleSymptom(key)}>{label}</Chip>
                )),
            },
        ];
        const at = Math.min(page, steps.length - 1);
        const current = steps[at];
        const go = (d: number) => setPage((p) => Math.max(0, Math.min(last, p + d)));
        const navBtn = 'grid place-items-center size-8 rounded-lg text-muted-foreground hover:bg-card hover:text-foreground transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none';
        // Compact panel the size of the three body tiles: question + steps on top, answers below.
        return (
            <section aria-labelledby="quick-checkin-title" className="h-full rounded-2xl border border-border/70 bg-secondary/40 px-3 py-2.5 flex flex-col justify-center gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="grid place-items-center size-7 rounded-lg bg-blossom/10 text-blossom shrink-0">
                        <Icon name={current.icon} size={16} weight="duotone" />
                    </span>
                    <p className="min-w-0 flex-1 truncate leading-tight" aria-live="polite">
                        <span id="quick-checkin-title" className="block text-xs text-muted-foreground">
                            {copy.title} · {at + 1}/{steps.length}
                            {logged && <span className="text-leaf font-medium"> · {copy.done}</span>}
                        </span>
                        <span className="block text-sm font-semibold text-foreground truncate">{current.label}</span>
                    </p>
                    {!logged && yesterday && (
                        <button
                            type="button"
                            onClick={sameAsYesterday}
                            title={copy.same}
                            className="shrink-0 inline-flex items-center gap-1 px-2.5 min-h-8 rounded-full text-xs font-semibold bg-card hover:bg-card/70 text-foreground transition-colors cursor-pointer"
                        >
                            <Icon name="history" size={14} /><span className="hidden sm:inline">{copy.same}</span>
                        </button>
                    )}
                    <div className="flex items-center shrink-0">
                        <button type="button" onClick={() => go(-1)} disabled={at === 0} aria-label={copy.prev} className={navBtn}>
                            <Icon name="chevron_left" size={16} />
                        </button>
                        <div className="flex items-center gap-1" aria-hidden>
                            {steps.map((st, i) => (
                                <span
                                    key={st.id}
                                    onClick={() => setPage(i)}
                                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === at ? 'w-4 bg-blossom' : 'w-1.5 bg-foreground/20 hover:bg-foreground/40'}`}
                                />
                            ))}
                        </div>
                        <button type="button" onClick={() => go(1)} disabled={at === last} aria-label={copy.next} className={navBtn}>
                            <Icon name="chevron_right" size={16} />
                        </button>
                    </div>
                    {onClose && (
                        <button type="button" onClick={onClose} aria-label={copy.close} title={copy.close} className={`${navBtn} -mr-1`}>
                            <Icon name="close" size={16} />
                        </button>
                    )}
                </div>

                <div
                    key={current.id}
                    role={current.multi ? 'group' : 'radiogroup'}
                    aria-label={current.label}
                    className="flex flex-nowrap items-center gap-1.5 overflow-x-auto scrollbar-hide [&>*]:shrink-0"
                >
                    {current.body}
                </div>
            </section>
        );
    }

    return (
        <section aria-labelledby="quick-checkin-title" className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 min-h-9">
                    <h3 id="quick-checkin-title" className="text-foreground text-base font-semibold">{copy.title}</h3>
                    <InfoTooltip label={copy.hintLabel}><p>{copy.hint}</p></InfoTooltip>
                    {logged && (
                        <span className="ml-1 inline-flex items-center gap-1 text-leaf text-sm font-medium" role="status">
                            <Icon name="check_circle" size={16} weight="fill" />{copy.done}
                        </span>
                    )}
                </div>
                {!logged && yesterday && (
                    <button
                        type="button"
                        onClick={sameAsYesterday}
                        className="shrink-0 inline-flex items-center gap-1 px-3.5 min-h-10 rounded-full text-sm font-semibold bg-secondary hover:bg-secondary/70 text-foreground transition-colors cursor-pointer"
                    >
                        <Icon name="history" size={16} />{copy.same}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2">
                <Row label={copy.energy} icon="bolt">
                    {copy.energyOpts.map((o, i) => (
                        <Chip key={o} selected={energyBucket(log.energyLevel) === i} onClick={() => set({ energyLevel: ENERGY_VALUES[i] })}>{o}</Chip>
                    ))}
                </Row>
                <Row label={copy.motivation} icon="walk">
                    {copy.motivationOpts.map((o, i) => (
                        <Chip key={o} selected={log.motivation === i + 1} onClick={() => set({ motivation: i + 1 })}>{o}</Chip>
                    ))}
                </Row>
                <Row label={copy.sleep} icon="bedtime">
                    {copy.sleepOpts.map((o, i) => (
                        <Chip key={o} selected={sleepBucket(log.sleepHours) === i} onClick={() => set({ sleepHours: SLEEP_VALUES[i] })}>{o}</Chip>
                    ))}
                </Row>
                <Row label={copy.cravings} icon="local_fire_department" multi>
                    <Chip role="checkbox" selected={logged && log.cravings.length === 0} onClick={() => set({ cravings: [], cravingIntensity: null })}>{copy.none}</Chip>
                    {CRAVINGS.map((k) => (
                        <Chip key={k} role="checkbox" selected={log.cravings.includes(k)} onClick={() => toggleCraving(k)}>{copy.cravingOpts[k]}</Chip>
                    ))}
                </Row>
                {log.cravings.length > 0 && (
                    <Row label={copy.intensity} icon="flame" wide>
                        {copy.intensityOpts.map((o, i) => (
                            <Chip key={o} selected={log.cravingIntensity === i + 1} onClick={() => set({ cravingIntensity: i + 1 })}>{o}</Chip>
                        ))}
                    </Row>
                )}
                {moreOpen && (
                    <Row label={copy.more} icon="monitor_heart" multi wide>
                        {Object.entries(copy.body).map(([key, label]) => (
                            <Chip key={key} role="checkbox" selected={log.symptoms.includes(key)} onClick={() => toggleSymptom(key)}>{label}</Chip>
                        ))}
                    </Row>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <button
                    type="button"
                    onClick={() => setMoreOpen((v) => !v)}
                    aria-expanded={moreOpen}
                    className="inline-flex items-center gap-1 min-h-8 text-[13px] font-semibold text-blossom hover:text-blossom/80 cursor-pointer"
                >
                    <Icon name={moreOpen ? 'remove' : 'add'} size={14} />{moreOpen ? copy.less : copy.more}
                </button>
                <button
                    type="button"
                    onClick={() => (isGuest ? promptSignup() : router.push('/log'))}
                    className="inline-flex items-center gap-1 min-h-8 text-[13px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                    {copy.full}<Icon name="arrow_forward" size={14} />
                </button>
            </div>
        </section>
    );
};
