export type ArticleCategory = 'training' | 'nutrition' | 'pmos' | 'recovery' | 'tracking';
export type ArticleAudience = 'all' | 'pmos' | 'regular';

export interface InAppArticleContent {
    title: string;
    summary: string;
    keyTakeaway: string;
    regularCycleTips: string;
    pmosTips: string;
    appAction: string;
    fullText: string[];
}

export interface InAppArticle {
    id: string;
    category: ArticleCategory;
    targetAudience: ArticleAudience;
    readTimeMinutes: number;
    imageUrl: string;
    tags: string[];
    es: InAppArticleContent;
    en: InAppArticleContent;
}

export interface Article {
    id: string;
    title: string;
    description: string;
    url: string;
    imageUrl: string;
    source: string;
    publishedAt: string;
    author?: string;
}

export interface ArticleFilters {
    topic?: 'PMOS' | 'wellness' | 'nutrition' | 'menstrual-health';
    language?: 'en' | 'es';
}
