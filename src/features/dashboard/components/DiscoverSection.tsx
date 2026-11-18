'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { IN_APP_ARTICLES } from '@/data/articlesData';

const COPY = {
    es: {
        read: 'Lectura del día',
        minutes: (n: number) => `${n} min de lectura`,
        open: 'Leer artículo',
    },
    en: {
        read: 'Read of the day',
        minutes: (n: number) => `${n} min read`,
        open: 'Read article',
    },
};

/** Day number since epoch in local time, so the pick changes once a day. */
function dayIndex(): number {
    const d = new Date();
    return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86_400_000);
}

/** Bottom of the home: one article that rotates daily. */
export const DiscoverSection: React.FC<{ lang: 'es' | 'en' }> = ({ lang }) => {
    const c = COPY[lang];
    const article = useMemo(() => IN_APP_ARTICLES[dayIndex() % IN_APP_ARTICLES.length], []);
    const content = article?.[lang];

    return (
        <div className="flex flex-col">
            {content && (
                <Link
                    href={`/articles?id=${article.id}`}
                    className="group bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition-shadow"
                >
                    <div className="relative sm:w-1/3 aspect-[16/9] sm:aspect-auto bg-muted overflow-hidden shrink-0">
                        <img
                            src={article.imageUrl}
                            alt=""
                            loading="lazy"
                            style={{ filter: 'grayscale(1) contrast(1.05)' }}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <span aria-hidden className="absolute inset-0 bg-blossom mix-blend-color opacity-80" />
                    </div>
                    <div className="p-5 flex flex-col gap-2 min-w-0">
                        <p className="text-sm font-semibold text-blossom">{c.read}</p>
                        <h3 className="text-foreground text-lg font-semibold leading-snug text-balance line-clamp-2">{content.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{content.summary}</p>
                        <div className="mt-auto pt-1 flex items-center justify-between gap-2 text-sm">
                            <span className="text-sm text-muted-foreground">{c.minutes(article.readTimeMinutes)}</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-primary">
                                {c.open}<Icon name="arrow_forward" size={14} />
                            </span>
                        </div>
                    </div>
                </Link>
            )}

        </div>
    );
};
