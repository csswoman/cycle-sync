'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import Sidebar from '@/components/layout/Sidebar';
import SmartAssistant from '@/features/assistant/SmartAssistant';
import { useAppStore } from '@/stores/appStore';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/i18n/LanguageContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { language, setLanguage, t } = useLanguage();
  const {
    mobileMenuOpen,
    setMobileMenuOpen,
    isAssistantOpen,
    toggleAssistant,
    setAssistantOpen,
    user,
    setUser,
  } = useAppStore();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) router.push('/login');
    });
    return () => subscription.unsubscribe();
  }, []);

  const toggleLanguage = () => setLanguage(language === 'en' ? 'es' : 'en');

  return (
    <div className="flex h-screen w-full bg-background text-foreground font-display overflow-hidden relative transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="absolute inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-64 h-full bg-background border-r border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-background">
        {/* TOP NAVBAR */}
        <header className="flex items-center justify-between border-b border-border bg-background/95 backdrop-blur z-20 px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-foreground p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 bg-secondary hover:bg-surface-hover transition-all rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm border border-border/50 group"
            >
              <span className="material-symbols-outlined text-[20px]">language</span>
              <span className="hidden sm:inline font-bold">{language.toUpperCase()}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
              className="flex items-center gap-2 bg-secondary hover:bg-surface-hover transition-all rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm border border-border/50 group"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:rotate-12">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
              <span className="hidden sm:inline">{isDarkMode ? t.lightMode : t.darkMode}</span>
            </button>

            {/* User Info */}
            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <div className="text-right hidden sm:block">
                <p className="text-foreground text-sm font-bold">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-muted-foreground text-xs font-medium">{t.powerhouseArchetype}</p>
              </div>
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full size-11 border-2 border-border shadow-xl shadow-primary/10 ring-2 ring-primary/5 flex items-center justify-center bg-secondary"
                style={
                  user?.user_metadata?.avatar_url
                    ? { backgroundImage: `url("${user.user_metadata.avatar_url}")` }
                    : {}
                }
              >
                {!user?.user_metadata?.avatar_url && (
                  <span className="material-symbols-outlined text-muted-foreground">person</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </main>

      {/* Floating AI Assistant Button */}
      <button
        onClick={toggleAssistant}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center size-14 md:size-16 rounded-full shadow-2xl shadow-primary/30 transition-all duration-300 hover:scale-110 active:scale-95 ${
          isAssistantOpen
            ? 'bg-secondary text-foreground rotate-45'
            : 'bg-primary text-primary-foreground'
        }`}
      >
        <span className="material-symbols-outlined text-[32px]">
          {isAssistantOpen ? 'add' : 'smart_toy'}
        </span>
      </button>

      {/* Floating AI Window */}
      {isAssistantOpen && (
        <div className="fixed bottom-24 right-4 md:right-6 w-[calc(100%-32px)] md:w-[450px] h-[600px] max-h-[80vh] z-40 animate-in fade-in slide-in-from-bottom-10 zoom-in-95 duration-300 origin-bottom-right">
          <SmartAssistant onClose={() => setAssistantOpen(false)} />
        </div>
      )}
    </div>
  );
}
