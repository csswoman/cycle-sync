'use client';
import React, { useEffect, useId, useState } from 'react';

export interface DashTab {
    id: string;
    label: string;
    /** Short pending/progress marker shown next to the label, e.g. "2" or "3/5". */
    badge?: string;
    content: React.ReactNode;
}

/**
 * Tab bar for dashboard cards. All panels stay mounted (hidden when inactive) so
 * hooks keep their state and nothing refetches when switching. The last tab used is remembered.
 */
export const DashTabs: React.FC<{ tabs: DashTab[]; storageKey: string; label: string; header?: React.ReactNode | ((activeId: string) => React.ReactNode); stretch?: boolean }> = ({ tabs, storageKey, label, header, stretch }) => {
    const uid = useId();
    const [active, setActive] = useState(tabs[0].id);
    useEffect(() => {
        const saved = window.localStorage.getItem(storageKey);
        if (saved && tabs.some((t) => t.id === saved)) setActive(saved);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey]);
    const select = (id: string) => { setActive(id); window.localStorage.setItem(storageKey, id); };
    const onKey = (e: React.KeyboardEvent, i: number) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        select(next.id);
        document.getElementById(`${uid}-tab-${next.id}`)?.focus();
    };
    return (
        <div className="flex flex-col gap-3 min-w-0 flex-1">
            <div className={header ? 'flex items-center justify-between gap-3 flex-wrap' : undefined}>
            {typeof header === 'function' ? header(active) : header}
            <div role="tablist" aria-label={label} className={`flex gap-1 p-1 rounded-xl bg-secondary/50 max-w-full overflow-x-auto scrollbar-hide ${stretch ? 'w-full sm:w-auto sm:self-start' : 'self-start'}`}>
                {tabs.map((t, i) => {
                    const on = t.id === active;
                    return (
                        <button
                            key={t.id}
                            id={`${uid}-tab-${t.id}`}
                            type="button"
                            role="tab"
                            aria-selected={on}
                            aria-controls={`${uid}-panel-${t.id}`}
                            tabIndex={on ? 0 : -1}
                            onClick={() => select(t.id)}
                            onKeyDown={(e) => onKey(e, i)}
                            className={`px-3.5 min-h-11 sm:min-h-9 ${stretch ? 'flex-1 justify-center sm:flex-none' : ''} rounded-lg text-sm font-semibold whitespace-nowrap inline-flex items-center gap-2 transition-colors cursor-pointer ${on ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {t.label}
                            {t.badge && <span className="text-xs font-semibold tabular-nums rounded-full px-1.5 min-w-5 text-center bg-blossom/15 text-blossom">{t.badge}</span>}
                        </button>
                    );
                })}
            </div>
            </div>
            <div className="grid flex-1">
            {tabs.map((t) => (
                <div key={t.id} id={`${uid}-panel-${t.id}`} role="tabpanel" aria-labelledby={`${uid}-tab-${t.id}`} aria-hidden={t.id !== active} className={`min-w-0 col-start-1 row-start-1 ${t.id !== active ? 'max-lg:hidden invisible' : ''}`}>
                    {t.content}
                </div>
            ))}
            </div>
        </div>
    );
};
