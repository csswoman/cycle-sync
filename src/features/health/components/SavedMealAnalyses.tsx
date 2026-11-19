'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/ui/Icon';
import { MealAnalysisResult } from './MealAnalysisResult';
import { parseMealAnalysis } from '@/lib/nutrition/mealAnalysis';
import type { SavedMealAnalysis } from '@/hooks/useMealAnalyses';

interface SavedMealAnalysesProps {
  items: SavedMealAnalysis[];
  isEs: boolean;
  pmos: boolean;
  onRemove: (id: string) => void;
}

const formatWhen = (iso: string, isEs: boolean) =>
  new Date(iso).toLocaleString(isEs ? 'es-MX' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });

// "Carne de res salteada con verduras (cebolla, tomate)" -> "Carne de res salteada"
const shortName = (name: string) => name.replace(/\s*\(.*?\)/g, '').split(/\s+(?:con|with|and|y|en|in)\s+/i)[0].trim();
/** History of saved meal photo analyses; each one opens to show the full result. */
export const SavedMealAnalyses: React.FC<SavedMealAnalysesProps> = ({ items, isEs, pmos, onRemove }) => {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = items.find((i) => i.id === openId) ?? null;
  const close = () => { setOpenId(null); setConfirmId(null); };
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const detail = (item: SavedMealAnalysis) => {
    const result = item.result ?? (item.raw ? parseMealAnalysis(item.raw) : null);
    return (
    <div className="flex flex-col gap-4">
      {item.thumbnail && (
        <img src={item.thumbnail} alt={isEs ? 'Foto del plato analizado' : 'Photo of the analyzed meal'} className="w-full max-h-64 rounded-xl object-cover" />
      )}
      {result ? (
        <MealAnalysisResult result={result} isEs={isEs} pmos={pmos} />
      ) : (
        <p className="text-sm text-muted-foreground whitespace-pre-line text-pretty">{item.raw}</p>
      )}
      {confirmId === item.id ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-foreground">{isEs ? '¿Borrar este análisis?' : 'Delete this analysis?'}</span>
          <button type="button" onClick={() => { onRemove(item.id); close(); }} className="min-h-10 px-4 rounded-full bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90">
            {isEs ? 'Sí, borrar' : 'Yes, delete'}
          </button>
          <button type="button" onClick={() => setConfirmId(null)} className="min-h-10 px-4 rounded-full bg-secondary text-foreground text-sm font-medium hover:bg-accent">
            {isEs ? 'Cancelar' : 'Cancel'}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirmId(item.id)} className="self-start inline-flex items-center gap-1.5 min-h-10 px-4 rounded-full text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10">
          <Icon name="delete" size={16} /> {isEs ? 'Borrar' : 'Delete'}
        </button>
      )}
    </div>
  );
  };

  return (
    <section aria-labelledby="saved-analyses-title" className="bg-card rounded-xl border border-border p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Icon name="history" size={20} className="text-primary shrink-0" />
        <h3 id="saved-analyses-title" className="text-foreground text-lg font-semibold text-balance">
          {isEs ? 'Mis análisis guardados' : 'My saved analyses'}
        </h3>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-pretty">
          {isEs
            ? 'Cada foto que analices se guarda aquí para que puedas volver a verla.'
            : 'Every photo you analyze is saved here so you can look at it again.'}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {items.map((item) => {
            const r = item.result ?? (item.raw ? parseMealAnalysis(item.raw) : null);
            const title = r?.foods.length ? r.foods.map((f) => shortName(f.name)).join(' · ') : r?.summary || item.raw || '';
            return (
              <li key={item.id} className="py-1">
                <button type="button" onClick={() => setOpenId(item.id)} className="w-full text-left flex items-center gap-3 min-h-16 py-1 cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-primary">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt="" className="size-14 rounded-lg object-cover shrink-0 bg-secondary" />
                    ) : (
                      <span className="size-14 rounded-lg bg-secondary inline-flex items-center justify-center shrink-0">
                        <Icon name="bowl_food" size={22} className="text-muted-foreground" />
                      </span>
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-muted-foreground">{formatWhen(item.created_at, isEs)}</span>
                      <span className="block text-sm font-semibold text-foreground line-clamp-2 text-pretty">{title}</span>
                    </span>
                    {r?.score && (
                      <span className="shrink-0 text-sm font-semibold text-foreground bg-secondary rounded-full px-2.5 py-1">
                        {r.score.value}/10
                      </span>
                    )}
                    <Icon name="chevron_right" size={18} weight="bold" className="text-muted-foreground shrink-0" />
                  </button>
              </li>
            );
          })}
        </ul>
      )}
      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="saved-analysis-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-card w-full sm:max-w-2xl max-h-[92dvh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-border shadow-xl"
          >
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border shrink-0">
              <h3 id="saved-analysis-modal-title" className="text-foreground text-base sm:text-lg font-semibold">{formatWhen(open.created_at, isEs)}</h3>
              <button type="button" onClick={close} aria-label={isEs ? 'Cerrar' : 'Close'} className="shrink-0 size-11 -mr-2 inline-flex items-center justify-center rounded-full hover:bg-secondary">
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain p-4 sm:p-6 [scrollbar-gutter:stable]">
              {detail(open)}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
};
