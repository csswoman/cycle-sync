import { useState, useEffect } from 'react';
import { Article, ArticleFilters } from '@/types/articles';
import { fetchHealthArticles, searchArticles } from '@/services/articlesService';

export const useArticles = (initialFilters: ArticleFilters = {}) => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadArticles = async (filters: ArticleFilters = initialFilters) => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchHealthArticles(filters);
            setArticles(data);
        } catch (err) {
            setError(err as Error);
            console.error('Error loading articles:', err);
        } finally {
            setLoading(false);
        }
    };

    const search = async (query: string, language: 'en' | 'es' = 'en') => {
        try {
            setLoading(true);
            setError(null);
            const data = await searchArticles(query, language);
            setArticles(data);
        } catch (err) {
            setError(err as Error);
            console.error('Error searching articles:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadArticles();
    }, []);

    return {
        articles,
        loading,
        error,
        refreshArticles: loadArticles,
        searchArticles: search
    };
};
