export type Language = 'en' | 'es';

export interface Translations {
    // Navigation
    overview: string;
    dailyLog: string;
    trends: string;
    settings: string;
    personalizeExperience: string;
    setupProfile: string;
    pcosToolkit: string;
    routines: string;
    mealIdeas: string;

    // Theme
    lightMode: string;
    darkMode: string;

    // Language
    language: string;

    // Common
    comingSoon: string;
    thisFeatureIsComingSoon: string;

    // User
    powerhouseArchetype: string;

    // SmartAssistant
    chat: string;
    image: string;
    video: string;
    typeMessage: string;
    send: string;

    // API Quota
    quotaExceeded: string;
    quotaExceededMessage: string;
    quotaResetTime: string;
    usingFallbackData: string;
}

export const translations: Record<Language, Translations> = {
    en: {
        // Navigation
        overview: 'Overview',
        dailyLog: 'Daily Log',
        trends: 'Trends',
        settings: 'Settings',
        personalizeExperience: 'Personalize Experience',
        setupProfile: 'Setup Profile',
        pcosToolkit: 'PCOS Toolkit',
        routines: 'Workouts',
        mealIdeas: 'Meal Ideas',

        // Theme
        lightMode: 'Light Mode',
        darkMode: 'Dark Mode',

        // Language
        language: 'Language',

        // Common
        comingSoon: 'Coming Soon',
        thisFeatureIsComingSoon: 'This feature is coming soon.',

        // User
        powerhouseArchetype: 'Powerhouse Archetype',

        // SmartAssistant
        chat: 'Chat',
        image: 'Image',
        video: 'Video',
        typeMessage: 'Type your message...',
        send: 'Send',

        // API Quota
        quotaExceeded: 'Daily Limit Reached',
        quotaExceededMessage: 'You\'ve reached the daily limit for detailed recipes. Tomorrow you\'ll have more!',
        quotaResetTime: 'Resets at midnight',
        usingFallbackData: 'Showing curated recipes',
    },
    es: {
        // Navigation
        overview: 'Resumen',
        dailyLog: 'Registro Diario',
        trends: 'Tendencias',
        settings: 'Configuración',
        personalizeExperience: 'Personalizar Experiencia',
        setupProfile: 'Configurar Perfil',
        pcosToolkit: 'Kit de PCOS',
        routines: 'Entrenamientos',
        mealIdeas: 'Ideas de Comidas',

        // Theme
        lightMode: 'Modo Claro',
        darkMode: 'Modo Oscuro',

        // Language
        language: 'Idioma',

        // Common
        comingSoon: 'Próximamente',
        thisFeatureIsComingSoon: 'Esta función estará disponible pronto.',

        // User
        powerhouseArchetype: 'Arquetipo Powerhouse',

        // SmartAssistant
        chat: 'Chat',
        image: 'Imagen',
        video: 'Video',
        typeMessage: 'Escribe tu mensaje...',
        send: 'Enviar',

        // API Quota
        quotaExceeded: 'Límite Diario Alcanzado',
        quotaExceededMessage: 'Has alcanzado el límite diario de recetas detalladas. ¡Mañana tendrás más!',
        quotaResetTime: 'Se reinicia a medianoche',
        usingFallbackData: 'Mostrando recetas seleccionadas',
    },
};
