'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, Translations } from './translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('es');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const explicit = localStorage.getItem('user_explicit_language');
        if (explicit === 'en' || explicit === 'es') {
            setLanguageState(explicit);
        } else {
            setLanguageState('es');
            localStorage.setItem('language', 'es');
        }
        setMounted(true);
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
        localStorage.setItem('user_explicit_language', lang);
    };

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('language', language);
        }
    }, [language, mounted]);

    const value: LanguageContextType = {
        language,
        setLanguage,
        t: translations[language],
    };

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
