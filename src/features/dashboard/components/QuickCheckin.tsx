'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { useGuest } from '@/hooks/useGuest';
import type { TodayCheckinState, StoredLog } from '@/hooks/useTodayCheckin';
import type { CravingKind } from '@/lib/today/dailyPlan';

type Lang = 'es' | 'en';

const COPY = {
    es: {
        title: '¿Cómo vas hoy?',
        hint: 'Un toque por fila. Se guarda solo y puedes dejar filas vacías.',
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
        body: { Bloating: 'Hinchazón', 'Mild Cramps': 'Cólicos', Headache: 'Dolor de cabeza', Anxiety: 'Ansiedad', 'Energy Crash After Meals': 'Bajón después de comer', 'Acne Flare': 'Brote de acné' } as Record<string, string>,
    },
    en: {
        title: 'How are you today?',
        hint: 'One tap per row. It saves on its own and rows can stay empty.',
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
        className={`min-h-10 px-3.5 rounded-full text-sm font-medium border transition-colors cursor-pointer active:scale-[0.98] ${selected
            ? 'bg-primary/15 border-primary/40 text-primary'
            : 'bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
    >
        {children}
    </button>
);

const Row: React.FC<{ label: string; icon: string; children: React.ReactNode; multi?: boolean }> = ({ label, icon, children, multi }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <p className="flex items-center gap-2 text-sm text-foreground font-medium sm:w-40 shrink-0">
            <Icon name={icon} size={18} weight="duotone" className="text-blossom" />{label}
        </p>
        <div role={multi ? 'group' : 'radiogroup'} aria-label={label} className="flex flex-wrap gap-2">{children}</div>
    </div>
);

/** One-tap daily check-in: energy, motivation, sleep, cravings and a few body signals. */
export const QuickCheckin: React.FC<{ state: TodayCheckinState; lang: Lang }> = ({ state, lang }) => {
    const copy = COPY[lang];
    const router = useRouter();
    const { isGuest, promptSignup } = useGuest();
    const [moreOpen, setMoreOpen] = useState(false);
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
        return <div className="h-40 rounded-2xl bg-secondary/40 animate-pulse" aria-hidden />;
    }

    return (
        <section aria-labelledby="quick-checkin-title" className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 id="quick-checkin-title" className="text-foreground text-base font-semibold flex items-center gap-2">
                        {copy.title}
                        {logged && (
                            <span className="inline-flex items-center gap-1 text-leaf text-sm font-medium" role="status">
                                <Icon name="check_circle" size={16} weight="fill" />{copy.done}
                            </span>
                        )}
                    </h3>
                    <p className="text-sm text-muted-foreground">{copy.hint}</p>
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

            <div className="flex flex-col gap-3">
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
                    <Row label={copy.intensity} icon="flame">
                        {copy.intensityOpts.map((o, i) => (
                            <Chip key={o} selected={log.cravingIntensity === i + 1} onClick={() => set({ cravingIntensity: i + 1 })}>{o}</Chip>
                        ))}
                    </Row>
                )}
                {moreOpen && (
                    <Row label={copy.more} icon="monitor_heart" multi>
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
                    className="inline-flex items-center gap-1 min-h-10 text-sm font-semibold text-blossom hover:text-blossom/80 cursor-pointer"
                >
                    <Icon name={moreOpen ? 'remove' : 'add'} size={14} />{moreOpen ? copy.less : copy.more}
                </button>
                <button
                    type="button"
                    onClick={() => (isGuest ? promptSignup() : router.push('/log'))}
                    className="inline-flex items-center gap-1 min-h-10 text-sm font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                    {copy.full}<Icon name="arrow_forward" size={14} />
                </button>
            </div>
        </section>
    );
};
