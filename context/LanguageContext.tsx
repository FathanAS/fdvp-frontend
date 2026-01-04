"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { dictionary, Locale } from '@/lib/dictionary';

interface LanguageContextType {
    language: Locale;
    setLanguage: (lang: Locale) => void;
    t: typeof dictionary['en']; // Type inferensi dari dictionary default (en)
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Locale>('en');

    useEffect(() => {
        // Cek localStorage saat mount
        const savedLang = localStorage.getItem('fdvp_language') as Locale;
        if (savedLang && ['en', 'id'].includes(savedLang)) {
            setLanguageState(savedLang);
        }
    }, []);

    const setLanguage = (lang: Locale) => {
        setLanguageState(lang);
        localStorage.setItem('fdvp_language', lang);
    };

    const t = dictionary[language];

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
