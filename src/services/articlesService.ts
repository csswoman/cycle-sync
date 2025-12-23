import { Article, ArticleFilters } from '@/types/articles';

const NEWSAPI_KEY = import.meta.env.VITE_NEWSAPI_KEY || '';
const NEWSAPI_BASE_URL = 'https://newsapi.org/v2';

// Topic to search query mapping
const TOPIC_QUERIES = {
    'PCOS': 'PCOS OR polycystic ovary syndrome',
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
            pageSize: '10',
            apiKey: NEWSAPI_KEY
        });

        const response = await fetch(`${NEWSAPI_BASE_URL}/everything?${params}`);

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
            pageSize: '10',
            apiKey: NEWSAPI_KEY
        });

        const response = await fetch(`${NEWSAPI_BASE_URL}/everything?${params}`);
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
 * Fallback articles when API fails or quota exceeded
 */
const getFallbackArticles = (language: 'en' | 'es'): Article[] => {
    const articlesEN = [
        {
            id: 'fallback-1',
            title: 'Understanding Your Menstrual Cycle: A Complete Guide',
            description: 'Learn about the four phases of your menstrual cycle and how to sync your lifestyle with each phase for optimal health.',
            url: 'https://www.healthline.com/health/womens-health/stages-of-menstrual-cycle',
            imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400',
            source: 'Healthline',
            publishedAt: new Date().toISOString(),
            author: 'Health Team'
        },
        {
            id: 'fallback-2',
            title: 'PCOS: Symptoms, Causes, and Natural Management',
            description: 'Discover evidence-based strategies for managing PCOS through nutrition, exercise, and lifestyle modifications.',
            url: 'https://www.healthline.com/health/polycystic-ovary-disease',
            imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400',
            source: 'Medical News',
            publishedAt: new Date().toISOString(),
            author: 'Dr. Sarah Johnson'
        },
        {
            id: 'fallback-3',
            title: 'Cycle Syncing Your Workouts for Better Results',
            description: 'Optimize your fitness routine by aligning your workouts with your hormonal fluctuations throughout the month.',
            url: 'https://www.womenshealthmag.com/fitness/a19966121/menstrual-cycle-workout-plan/',
            imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
            source: "Women's Health",
            publishedAt: new Date().toISOString(),
            author: 'Fitness Team'
        }
    ];

    const articlesES = [
        {
            id: 'fallback-1',
            title: 'Entendiendo tu Ciclo Menstrual: Guía Completa',
            description: 'Aprende sobre las cuatro fases de tu ciclo menstrual y cómo sincronizar tu estilo de vida con cada fase para una salud óptima.',
            url: 'https://www.healthline.com/health/womens-health/stages-of-menstrual-cycle',
            imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400',
            source: 'Healthline',
            publishedAt: new Date().toISOString(),
            author: 'Equipo de Salud'
        },
        {
            id: 'fallback-2',
            title: 'SOP: Síntomas, Causas y Manejo Natural',
            description: 'Descubre estrategias basadas en evidencia para manejar el SOP a través de nutrición, ejercicio y modificaciones del estilo de vida.',
            url: 'https://www.healthline.com/health/polycystic-ovary-disease',
            imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400',
            source: 'Noticias Médicas',
            publishedAt: new Date().toISOString(),
            author: 'Dra. Sarah Johnson'
        },
        {
            id: 'fallback-3',
            title: 'Sincroniza tus Entrenamientos con tu Ciclo',
            description: 'Optimiza tu rutina de ejercicios alineando tus entrenamientos con tus fluctuaciones hormonales durante el mes.',
            url: 'https://www.womenshealthmag.com/fitness/a19966121/menstrual-cycle-workout-plan/',
            imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
            source: 'Salud Femenina',
            publishedAt: new Date().toISOString(),
            author: 'Equipo Fitness'
        }
    ];

    return language === 'es' ? articlesES : articlesEN;
};
