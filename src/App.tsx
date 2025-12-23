import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Dashboard from '@/features/dashboard/Dashboard';
import DailyLog from '@/features/cycle/DailyLog';
import Trends from '@/features/cycle/Trends';
import SmartAssistant from '@/features/assistant/SmartAssistant';
import ArchetypeSelection from '@/features/setup/ArchetypeSelection';
import CycleSetup from '@/features/setup/CycleSetup';
import PCOSCare from '@/features/health/PCOSCare';
import Routines from '@/features/health/Routines';
import Nutrition from '@/features/health/Nutrition';
import Login from '@/features/auth/Login';
import Register from '@/features/auth/Register';
import CheckEmail from '@/features/auth/CheckEmail';
import Settings from '@/features/setup/Settings';
import { View } from '@/types';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Language } from '@/i18n/translations';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

enum AuthState {
  LOGIN,
  REGISTER,
  CHECK_EMAIL,
  PERSONALIZE,
  AUTHENTICATED
}

function App() {
  const { language, setLanguage, t } = useLanguage();
  const [authState, setAuthState] = useState<AuthState>(AuthState.LOGIN);
  const [session, setSession] = useState<any>(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setAuthState(AuthState.AUTHENTICATED);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setAuthState(AuthState.AUTHENTICATED);
      } else {
        setAuthState(AuthState.LOGIN);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  const getViewTitle = () => {
    switch (currentView) {
      case View.DASHBOARD: return t.overview;
      case View.LOG: return t.dailyLog;
      case View.TRENDS: return t.trends;
      case View.SETTINGS: return t.settings;
      case View.ARCHETYPE_SELECTION: return t.personalizeExperience;
      case View.CYCLE_SETUP: return t.setupProfile;
      case View.PCOS: return t.pcosToolkit;
      case View.ROUTINES: return t.routines;
      case View.NUTRITION: return t.mealIdeas;
      default: return 'CycleSync';
    }
  };

  if (authState === AuthState.LOGIN) {
    return (
      <Login 
        onLogin={() => setAuthState(AuthState.AUTHENTICATED)} 
        onSignUp={() => setAuthState(AuthState.REGISTER)}
        onUnconfirmedEmail={() => setAuthState(AuthState.CHECK_EMAIL)}
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
      />
    );
  }

  if (authState === AuthState.REGISTER) {
    return (
      <Register 
        onRegister={() => setAuthState(AuthState.CHECK_EMAIL)}
        onBackToLogin={() => setAuthState(AuthState.LOGIN)}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />
    );
  }

  if (authState === AuthState.CHECK_EMAIL) {
    return (
      <CheckEmail 
        onBackToLogin={() => setAuthState(AuthState.LOGIN)}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />
    );
  }

  if (authState === AuthState.PERSONALIZE) {
    return (
      <ArchetypeSelection 
        onComplete={() => setAuthState(AuthState.AUTHENTICATED)} 
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground font-display overflow-hidden relative transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="absolute inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 h-full bg-background border-r border-border" onClick={e => e.stopPropagation()}>
            <Sidebar currentView={currentView} onViewChange={(view) => { setCurrentView(view); setMobileMenuOpen(false); }} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-background">
        {/* TOP NAVBAR */}
        <header className="flex items-center justify-between border-b border-border bg-background/95 backdrop-blur z-20 px-6 py-4">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-foreground p-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-foreground text-xl font-bold tracking-tight">
              {getViewTitle()}
            </h2>
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
              onClick={toggleDarkMode}
              className="flex items-center gap-2 bg-secondary hover:bg-surface-hover transition-all rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm border border-border/50 group"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:rotate-12">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
              <span className="hidden sm:inline">{isDarkMode ? t.lightMode : t.darkMode}</span>
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <div className="text-right hidden sm:block">
                <p className="text-foreground text-sm font-bold">
                  {session?.user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-muted-foreground text-xs font-medium">{t.powerhouseArchetype}</p>
              </div>
              <div className="bg-center bg-no-repeat bg-cover rounded-full size-11 border-2 border-border shadow-xl shadow-primary/10 ring-2 ring-primary/5 flex items-center justify-center bg-secondary"
                style={session?.user?.user_metadata?.avatar_url ? { backgroundImage: `url("${session.user.user_metadata.avatar_url}")` } : {}}>
                {!session?.user?.user_metadata?.avatar_url && (
                  <span className="material-symbols-outlined text-muted-foreground">person</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* View Switcher */}
        {currentView === View.DASHBOARD && (
          <Dashboard 
            onNavigate={setCurrentView} 
            userName={session?.user?.user_metadata?.full_name}
          />
        )}
        {currentView === View.LOG && <DailyLog />}
        {currentView === View.TRENDS && <Trends />}
        {currentView === View.ARCHETYPE_SELECTION && (
          <ArchetypeSelection 
            onComplete={() => setCurrentView(View.CYCLE_SETUP)} 
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          />
        )}
        {currentView === View.CYCLE_SETUP && <CycleSetup onNavigate={setCurrentView} />}
        {currentView === View.PCOS && <PCOSCare />}
        {currentView === View.ROUTINES && <Routines />}
        {currentView === View.NUTRITION && <Nutrition />}
        {currentView === View.SETTINGS && <Settings />}
        {(currentView !== View.DASHBOARD && currentView !== View.LOG && currentView !== View.TRENDS && currentView !== View.ARCHETYPE_SELECTION && currentView !== View.CYCLE_SETUP && currentView !== View.PCOS && currentView !== View.ROUTINES && currentView !== View.NUTRITION && currentView !== View.SETTINGS) && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-50">construction</span>
              <p>{t.thisFeatureIsComingSoon}</p>
            </div>
          </div>
        )}
      </main>

      {/* FLOATING AI ASSISTANT BUTTON */}
      <button
        onClick={() => setIsAssistantOpen(!isAssistantOpen)}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center size-14 md:size-16 rounded-full shadow-2xl shadow-primary/30 transition-all duration-300 hover:scale-110 active:scale-95 ${isAssistantOpen ? 'bg-secondary text-foreground rotate-45' : 'bg-primary text-primary-foreground'}`}
      >
        <span className="material-symbols-outlined text-[32px]">{isAssistantOpen ? 'add' : 'smart_toy'}</span>
      </button>

      {/* FLOATING AI WINDOW */}
      {isAssistantOpen && (
        <div className="fixed bottom-24 right-4 md:right-6 w-[calc(100%-32px)] md:w-[450px] h-[600px] max-h-[80vh] z-40 animate-in fade-in slide-in-from-bottom-10 zoom-in-95 duration-300 origin-bottom-right">
          <SmartAssistant onClose={() => setIsAssistantOpen(false)} />
        </div>
      )}
    </div>
  );
}

export default App;
