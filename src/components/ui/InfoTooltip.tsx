'use client';
import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

interface InfoTooltipProps {
    /** Accessible name for the "?" button. */
    label: string;
    children: React.ReactNode;
    className?: string;
}

const WIDTH = 320;
const GAP = 8;
const MARGIN = 12;

/**
 * A "?" button that reveals longer explanatory text. Opens on hover, focus or
 * tap; closes on Escape, outside click or leaving. Rendered in a portal so card
 * `overflow-hidden` never clips it.
 */
export const InfoTooltip: React.FC<InfoTooltipProps> = ({ label, children, className = '' }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState<{ top: number; left: number; above: boolean } | null>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const tipRef = useRef<HTMLDivElement>(null);
    const closeTimer = useRef<number | undefined>(undefined);
    const id = useId();

    const place = useCallback(() => {
        const btn = btnRef.current;
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        const w = Math.min(WIDTH, window.innerWidth - MARGIN * 2);
        const left = Math.max(MARGIN, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - MARGIN));
        const h = tipRef.current?.offsetHeight ?? 0;
        const above = r.bottom + GAP + h > window.innerHeight - MARGIN && r.top - GAP - h > MARGIN;
        setPos({ top: above ? r.top - GAP - h : r.bottom + GAP, left, above });
    }, []);

    useLayoutEffect(() => {
        if (open) place();
    }, [open, place]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        const onDown = (e: MouseEvent) => {
            const t = e.target as Node;
            if (!btnRef.current?.contains(t) && !tipRef.current?.contains(t)) setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onDown);
        window.addEventListener('scroll', place, true);
        window.addEventListener('resize', place);
        return () => {
            window.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onDown);
            window.removeEventListener('scroll', place, true);
            window.removeEventListener('resize', place);
        };
    }, [open, place]);

    useEffect(() => () => window.clearTimeout(closeTimer.current), []);

    const show = () => {
        window.clearTimeout(closeTimer.current);
        setOpen(true);
    };
    const hide = () => {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => setOpen(false), 120);
    };

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                aria-label={label}
                aria-expanded={open}
                aria-describedby={open ? id : undefined}
                onClick={() => setOpen((v) => !v)}
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={show}
                onBlur={hide}
                className={`relative inline-flex items-center justify-center size-6 rounded-full align-middle text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring before:absolute before:-inset-2 before:content-[''] ${open ? 'bg-secondary text-foreground' : ''} ${className}`}
            >
                <Icon name="help" size={16} />
            </button>
            {open && typeof document !== 'undefined' && createPortal(
                <div
                    ref={tipRef}
                    id={id}
                    role="tooltip"
                    onMouseEnter={show}
                    onMouseLeave={hide}
                    style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: `min(${WIDTH}px, calc(100vw - ${MARGIN * 2}px))` }}
                    className="fixed z-50 rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground shadow-xl text-pretty flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150"
                >
                    {children}
                </div>,
                document.body,
            )}
        </>
    );
};
