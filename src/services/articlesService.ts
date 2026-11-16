import { Article, ArticleFilters, InAppArticle, ArticleCategory, ArticleAudience } from '@/types/articles';
import { IN_APP_ARTICLES } from '@/data/articlesData';

// Requests go through /api/articles, which adds the NewsAPI key on the server.

// Topic to search query mapping
const TOPIC_QUERIES = {
    'PMOS': 'PMOS OR PCOS OR polyendocrine metabolic ovarian syndrome OR polycystic ovary syndrome',
    'wellness': 'women wellness OR women health',
    'nutrition': 'women nutrition OR healthy eating',
    'menstrual-health': 'menstrual cycle OR period health OR hormonal health'
};

/**
 * Fetch health and wellness articles from NewsAPI
 */
export const fetchHealthArticles = async (
    filters: ArticleFilters = {}
): Promise<Article[]> => {
    try {
        const { topic = 'wellness', language = 'en' } = filters;
        const query = TOPIC_QUERIES[topic] || TOPIC_QUERIES.wellness;

        const params = new URLSearchParams({
            q: query,
            language,
            sortBy: 'publishedAt',
        });

        const response = await fetch(`/api/articles?${params}`);

        if (!response.ok) {
            throw new Error(`NewsAPI error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'error') {
            throw new Error(data.message || 'NewsAPI request failed');
        }

        return data.articles.map((article: any, index: number) => ({
            id: `${article.publishedAt}-${index}`,
            title: article.title,
            description: article.description || article.content?.substring(0, 150) + '...',
            url: article.url,
            imageUrl: article.urlToImage || '/exercise-fallback.png',
            source: article.source.name,
            publishedAt: article.publishedAt,
            author: article.author
        }));
    } catch (error) {
        console.error('Error fetching articles:', error);
        // Return fallback articles if API fails
        return getFallbackArticles(filters.language || 'en');
    }
};

/**
 * Search articles by custom query
 */
export const searchArticles = async (
    query: string,
    language: 'en' | 'es' = 'en'
): Promise<Article[]> => {
    try {
        const params = new URLSearchParams({
            q: query,
            language,
            sortBy: 'relevancy',
        });

        const response = await fetch(`/api/articles?${params}`);
        const data = await response.json();

        if (data.status === 'error') {
            throw new Error(data.message);
        }

        return data.articles.map((article: any, index: number) => ({
            id: `${article.publishedAt}-${index}`,
            title: article.title,
            description: article.description || article.content?.substring(0, 150) + '...',
            url: article.url,
            imageUrl: article.urlToImage || '/exercise-fallback.png',
            source: article.source.name,
            publishedAt: article.publishedAt,
            author: article.author
        }));
    } catch (error) {
        console.error('Error searching articles:', error);
        return [];
    }
};

/**
 * Get in-app educational articles with dual language and PMOS/Regular cycle perspectives
 */
export const getInAppArticles = (
    language: 'en' | 'es' = 'es',
    options?: {
        category?: ArticleCategory | 'all';
        audience?: ArticleAudience | 'all';
        query?: string;
    }
): InAppArticle[] => {
    let result = [...IN_APP_ARTICLES];

    if (options?.category && options.category !== 'all') {
        result = result.filter(a => a.category === options.category);
    }

    if (options?.audience && options.audience !== 'all') {
        result = result.filter(a => a.targetAudience === options.audience || a.targetAudience === 'all');
    }

    if (options?.query && options.query.trim()) {
        const q = options.query.toLowerCase().trim();
        result = result.filter(a => {
            const content = a[language];
            return (
                content.title.toLowerCase().includes(q) ||
                content.summary.toLowerCase().includes(q) ||
                content.keyTakeaway.toLowerCase().includes(q) ||
                a.tags.some(t => t.toLowerCase().includes(q))
            );
        });
    }

    return result;
};

/**
 * Get a single in-app article by ID
 */
export const getInAppArticleById = (id: string): InAppArticle | undefined => {
    return IN_APP_ARTICLES.find(a => a.id === id);
};

/**
 * Fallback articles when API fails or quota exceeded (backed by our in-app clinical library)
 */
const getFallbackArticles = (language: 'en' | 'es'): Article[] => {
    return IN_APP_ARTICLES.map(a => {
        const content = a[language];
        return {
            id: a.id,
            title: content.title,
            description: content.summary,
            url: `/articles?id=${a.id}`,
            imageUrl: a.imageUrl,
            source: 'CycleSync Health Library',
            publishedAt: new Date().toISOString(),
            author: 'Dra. CycleSync & Medical Team'
        };
    });
};
