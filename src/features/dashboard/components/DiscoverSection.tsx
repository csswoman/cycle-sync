'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { CardFlowers } from '@/components/ui/CardFlowers';
import { IN_APP_ARTICLES } from '@/data/articlesData';
import { useGuest } from '@/hooks/useGuest';
import { usePmosToolsVisible } from '@/hooks/useOnboardingAnswers';

const COPY = {
    es: {
        read: 'Lectura del día',
        minutes: (n: number) => `${n} min de lectura`,
        open: 'Leer artículo',
        explore: 'Explora',
        links: {
            recipes: { label: 'Recetas', desc: 'Ideas por fase' },
            routines: { label: 'Rutinas', desc: 'Ejercicio a tu ritmo' },
            articles: { label: 'Artículos', desc: 'Aprende de tu ciclo' },
            pmos: { label: 'Cuidado SOP', desc: 'Herramientas PMOS' },
            trends: { label: 'Tendencias', desc: 'Tus patrones' },
            planner: { label: 'Planner', desc: 'Organiza tu semana' },
        },
    },
    en: {
        read: 'Read of the day',
        minutes: (n: number) => `${n} min read`,
        open: 'Read article',
        explore: 'Explore',
        links: {
            recipes: { label: 'Recipes', desc: 'Ideas by phase' },
            routines: { label: 'Routines', desc: 'Move at your pace' },
            articles: { label: 'Articles', desc: 'Learn about your cycle' },
            pmos: { label: 'PMOS care', desc: 'PMOS tools' },
            trends: { label: 'Trends', desc: 'Your patterns' },
            planner: { label: 'Planner', desc: 'Plan your week' },
        },
    },
};

type LinkKey = keyof typeof COPY.es.links;
const LINKS: Record<LinkKey, { href: string; icon: string; tint: string }> = {
    recipes: { href: '/nutrition?tab=recipes', icon: 'restaurant', tint: 'bg-peach text-coral' },
    routines: { href: '/routines', icon: 'fitness_center', tint: 'bg-leaf-soft text-leaf' },
    articles: { href: '/articles', icon: 'menu_book', tint: 'bg-blossom-soft text-blossom' },
    pmos: { href: '/pmos', icon: 'spa', tint: 'bg-secondary text-bud' },
    trends: { href: '/trends', icon: 'trending_up', tint: 'bg-secondary text-bud' },
    planner: { href: '/planner', icon: 'calendar_month', tint: 'bg-sun/25 text-sun-ink' },
};

/** Day number since epoch in local time, so the pick changes once a day. */
function dayIndex(): number {
    const d = new Date();
    return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86_400_000);
}

/** Bottom of the home: one article that rotates daily and shortcuts to the rest of the app. */
export const DiscoverSection: React.FC<{ lang: 'es' | 'en' }> = ({ lang }) => {
    const c = COPY[lang];
    const { isGuest } = useGuest();
    const pmos = usePmosToolsVisible();
    const article = useMemo(() => IN_APP_ARTICLES[dayIndex() % IN_APP_ARTICLES.length], []);
    const content = article?.[lang];

    // Guests only reach content pages; signed-in users get their own tools instead of articles/routines.
    const keys: LinkKey[] = isGuest
        ? ['recipes', 'routines', 'articles', 'pmos']
        : ['recipes', 'routines', 'trends', pmos ? 'pmos' : 'planner'];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {content && (
                <Link
                    href={`/articles?id=${article.id}`}
                    className="group lg:col-span-7 bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition-shadow"
                >
                    <div className="relative sm:w-2/5 aspect-[16/9] sm:aspect-auto bg-muted overflow-hidden shrink-0">
                        <img
                            src={article.imageUrl}
                            alt=""
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    </div>
                    <div className="p-5 flex flex-col gap-2 min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-blossom">{c.read}</p>
                        <h3 className="text-foreground text-lg font-semibold leading-snug text-balance line-clamp-2">{content.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{content.summary}</p>
                        <div className="mt-auto pt-1 flex items-center justify-between gap-2 text-sm">
                            <span className="text-xs text-muted-foreground">{c.minutes(article.readTimeMinutes)}</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-primary">
                                {c.open}<Icon name="arrow_forward" size={14} />
                            </span>
                        </div>
                    </div>
                </Link>
            )}

            <nav aria-label={c.explore} className={`${content ? 'lg:col-span-5' : 'lg:col-span-12'} relative isolate overflow-hidden bg-card rounded-3xl border border-border shadow-sm p-5 flex flex-col gap-3`}>
                <CardFlowers variant="explore" />
                <h3 className="text-foreground text-base font-semibold">{c.explore}</h3>
                <ul className="grid grid-cols-2 gap-2 flex-1">
                    {keys.map((k) => (
                        <li key={k}>
                            <Link
                                href={LINKS[k].href}
                                className="h-full rounded-2xl bg-secondary/40 hover:bg-secondary/70 transition-colors p-3 flex flex-col gap-2 min-h-24"
                            >
                                <span className={`size-9 rounded-full flex items-center justify-center ${LINKS[k].tint}`}>
                                    <Icon name={LINKS[k].icon} size={18} weight="duotone" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-sm font-semibold text-foreground truncate">{c.links[k].label}</span>
                                    <span className="block text-xs text-muted-foreground truncate">{c.links[k].desc}</span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};
