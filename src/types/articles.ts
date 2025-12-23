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
    topic?: 'PCOS' | 'wellness' | 'nutrition' | 'menstrual-health';
    language?: 'en' | 'es';
}
