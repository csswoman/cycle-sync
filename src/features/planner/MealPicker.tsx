'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { LibraryRecipe } from '@/types/recipes';
import { slotsOf } from '@/lib/planner/fromRecipes';
import type { MealSlot } from '@/lib/planner/week';
import { Chip, Glyph } from './WorkoutPicker';

type Scope = 'slot' | 'all' | 'favorites';

const PAGE = 12;

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

interface Props {
    /** Which slot is being filled; null keeps the dialog closed. */
    target: { slot: MealSlot; slotLabel: string; dayLabel: string; currentTitle?: string; currentIngredients?: string[] } | null;
    recipes: LibraryRecipe[];
    onPick: (recipe: LibraryRecipe) => void;
    /** Opens the free-text editor (title + ingredients). */
    onCustom: () => void;
    onRemove?: () => void;
    /** Other days of the week this dish can be copied to (same slot). */
    copyDays?: { date: string; label: string; occupied: boolean }[];
    onCopy?: (date: string) => void;
    onClose: () => void;
}

const MealPicker: React.FC<Props> = ({ target, recipes, onPick, onCustom, onRemove, copyDays, onCopy, onClose }) => {
    const [query, setQuery] = useState('');
    const [scope, setScope] = useState<Scope>('slot');
    const [visible, setVisible] = useState(PAGE);
    const searchRef = useRef<HTMLInputElement>(null);
    const slot = target?.slot;

    useEffect(() => {
        if (!target) return;
        setQuery('');
        setScope('slot');
        setVisible(PAGE);
        searchRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target?.slot, target?.dayLabel, !!target]);

    useEffect(() => setVisible(PAGE), [query, scope]);

    const results = useMemo(() => {
        if (!slot) return [];
        const q = fold(query.trim());
        return recipes
            .filter((r) => (scope === 'slot' ? slotsOf(r).includes(slot) : scope === 'favorites' ? r.isFavorite : true))
            .filter((r) => !q || fold(`${r.title} ${r.ingredients.join(' ')} ${r.tags.join(' ')}`).includes(q))
            .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || a.title.localeCompare(b.title));
    }, [recipes, query, scope, slot]);

    if (!target) return null;

    return (
        <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="meal-picker-title"
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:max-w-4xl h-[92vh] sm:h-auto sm:max-h-[88vh] bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
                <header className="flex flex-col gap-3 p-4 sm:p-5 border-b border-border">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h2 id="meal-picker-title" className="text-lg font-semibold text-foreground text-balance">
                                Elegir {target.slotLabel.toLowerCase()}
                            </h2>
                            <p className="text-sm text-muted-foreground capitalize">
                                {target.dayLabel}
                                {target.currentTitle ? <span className="normal-case"> · ahora: {target.currentTitle}</span> : null}
                            </p>
                            {target.currentIngredients && target.currentIngredients.length > 0 && (
                                <p className="text-sm text-muted-foreground mt-1 text-pretty">{target.currentIngredients.join(', ')}</p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Cerrar"
                            className="size-10 -mr-2 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shrink-0"
                        >
                            <Glyph name="close" className="text-xl" />
                        </button>
                    </div>

                    <label className="relative block">
                        <span className="sr-only">Buscar receta</span>
                        <Glyph name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-muted-foreground pointer-events-none" />
                        <input
                            ref={searchRef}
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por nombre, ingrediente o etiqueta"
                            className="w-full min-h-11 rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </label>

                    <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-0.5 scrollbar-hide" role="group" aria-label="Mostrar">
                        <Chip active={scope === 'slot'} onClick={() => setScope('slot')}>
                            <Glyph name="restaurant" className="text-lg" />
                            Para {target.slotLabel.toLowerCase()}
                        </Chip>
                        <Chip active={scope === 'all'} onClick={() => setScope('all')}>
                            <Glyph name="grid_view" className="text-lg" />
                            Todas
                        </Chip>
                        <Chip active={scope === 'favorites'} onClick={() => setScope('favorites')}>
                            <Glyph name="favorite" className="text-lg" />
                            Favoritas
                        </Chip>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={onCustom}
                            className="inline-flex items-center gap-1.5 min-h-10 px-3 rounded-xl border border-border text-sm font-medium text-foreground hover:border-primary/40 cursor-pointer transition-colors"
                        >
                            <Glyph name="edit" className="text-lg" />
                            {target.currentTitle ? 'Editar a mano' : 'Escribir mi propio plato'}
                        </button>
                        {onRemove && (
                            <button
                                type="button"
                                onClick={onRemove}
                                className="inline-flex items-center gap-1.5 min-h-10 px-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                            >
                                <Glyph name="delete" className="text-lg" />
                                Quitar plato
                            </button>
                        )}
                    </div>

                    {onCopy && copyDays && copyDays.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Copiar este plato a otro día">
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                                <Glyph name="content_copy" className="text-lg" />
                                Copiar a
                            </span>
                            {copyDays.map((d) => (
                                <button
                                    key={d.date}
                                    type="button"
                                    disabled={d.occupied}
                                    title={d.occupied ? 'Ya hay un plato en ese día' : undefined}
                                    onClick={() => onCopy(d.date)}
                                    className="min-h-10 px-3 rounded-xl border border-border text-sm font-medium capitalize text-foreground hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    )}
                    <p className="text-sm text-muted-foreground" aria-live="polite">
                        {results.length} {results.length === 1 ? 'receta' : 'recetas'}
                    </p>

                    {results.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-12 text-center">
                            <Glyph name="search_off" className="text-4xl text-muted-foreground/60" />
                            <p className="text-sm text-muted-foreground text-pretty max-w-xs">
                                Ninguna receta coincide. Prueba con &quot;Todas&quot; o escribe tu propio plato.
                            </p>
                        </div>
                    ) : (
                        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {results.slice(0, visible).map((r) => {
                                const selected = fold(r.title) === fold(target.currentTitle ?? '');
                                return (
                                    <li key={r.id}>
                                        <button
                                            type="button"
                                            onClick={() => onPick(r)}
                                            aria-pressed={selected}
                                            className={`group w-full h-full text-left flex flex-col gap-2 rounded-2xl border p-2 transition-colors cursor-pointer ${
                                                selected ? 'border-primary ring-2 ring-primary/40' : 'border-border hover:border-primary/40'
                                            }`}
                                        >
                                            <span className="relative block aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                                                {r.imageUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={r.imageUrl}
                                                        alt=""
                                                        loading="lazy"
                                                        className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <span className="absolute inset-0 flex items-center justify-center text-muted-foreground/60">
                                                        <Glyph name="restaurant" className="text-4xl" />
                                                    </span>
                                                )}
                                                {r.isFavorite && (
                                                    <span className="absolute top-2 left-2 size-7 rounded-full bg-card/90 text-primary flex items-center justify-center">
                                                        <Glyph name="favorite" className="text-base" />
                                                    </span>
                                                )}
                                                {r.readyInMinutes ? (
                                                    <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 text-white text-xs font-medium tabular-nums">
                                                        <Glyph name="schedule" className="text-sm" />
                                                        {r.readyInMinutes} min
                                                    </span>
                                                ) : null}
                                            </span>
                                            <span className="px-1 pb-1 text-sm font-medium text-foreground leading-snug line-clamp-2">{r.title}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {results.length > visible && (
                        <button
                            type="button"
                            onClick={() => setVisible((n) => n + PAGE)}
                            className="self-center min-h-10 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:border-primary/40 cursor-pointer transition-colors"
                        >
                            Ver más
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MealPicker;
