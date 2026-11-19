'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import Sidebar from '@/components/layout/Sidebar';
import SmartAssistant from '@/features/assistant/SmartAssistant';
import { useAppStore } from '@/stores/appStore';
import { supabase } from '@/lib/supabase';
import { ensureProfileLoaded, resetProfile } from '@/stores/profileStore';
import { useLanguage } from '@/i18n/LanguageContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useMedicationReminders } from '@/hooks/useMedicationReminders';
import { Flower } from '@/components/ui/Flower';
import GuestSignupModal from '@/components/layout/GuestSignupModal';
import { isGuestRoute } from '@/lib/guestAccess';
import { Icon } from '@/components/ui/Icon';
import PinLock from '@/components/layout/PinLock';
import AiConsentDialog from '@/components/layout/AiConsentDialog';
import { clearSyncedLocalData } from '@/lib/signOut';

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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
    authReady,
    setAuthReady,
    setSignupPromptOpen,
  } = useAppStore();
  const isGuest = authReady && !user;

  useOfflineSync();
  useMedicationReminders();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_IN') void ensureProfileLoaded();
      if (_event === 'SIGNED_OUT') {
        resetProfile();
        // Covers sign-outs that don't go through signOutAndClearDevice (expired session, other tab).
        void clearSyncedLocalData();
        router.push('/login');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const toggleLanguage = () => setLanguage(language === 'en' ? 'es' : 'en');

  const getPageTitle = (path: string) => {
    if (path.startsWith('/dashboard')) return t.overview;
    if (path.startsWith('/log')) return t.dailyLog;
    if (path.startsWith('/period-history')) return t.periodHistory;
    if (path.startsWith('/routines')) return t.routines;
    if (path.startsWith('/nutrition')) return t.mealIdeas;
    if (path.startsWith('/trends')) return t.trends;
    if (path.startsWith('/pmos')) return t.pmosToolkit;
    if (path.startsWith('/articles')) return t.healthLibrary;
    if (path.startsWith('/habits')) return t.habits;
    if (path.startsWith('/medications')) return t.medications;
    if (path.startsWith('/export')) return t.exportReport;
    if (path.startsWith('/settings')) return t.settings;
    if (path.startsWith('/archetype')) return t.personalizeExperience;
    if (path.startsWith('/cycle-setup')) return t.setupProfile;
    return 'CycleSync';
  };

  // Guests get the pages they can open, so the bar shows content instead of locks.
  const bottomNavItems = isGuest
    ? [
        { href: '/dashboard', label: t.overview, icon: 'dashboard' },
        { href: '/routines', label: t.routines, icon: 'fitness_center' },
        { href: '/nutrition', label: t.mealIdeas, icon: 'restaurant' },
        { href: '/articles', label: t.articles, icon: 'menu_book' },
      ]
    : [
        { href: '/dashboard', label: t.overview, icon: 'dashboard' },
        { href: '/log', label: t.dailyLog, icon: 'edit_calendar' },
        { href: '/habits', label: t.habits, icon: 'check_circle' },
        { href: '/nutrition', label: t.mealIdeas, icon: 'restaurant' },
      ];

  const currentTitle = getPageTitle(pathname);

  return (
    <div className="garden-canvas flex h-screen w-full text-foreground font-display overflow-clip relative transition-colors duration-300">
      {/* Background doodles */}
      <Flower
        petal="var(--leaf-soft)"
        center="var(--blossom-soft)"
        petals={5}
        rotate={12}
        className="absolute -left-24 top-1/3 size-[420px] opacity-60 dark:opacity-[0.14] pointer-events-none"
      />
      <Flower
        petal="var(--blossom-soft)"
        center="var(--sun)"
        petals={7}
        rotate={-20}
        className="absolute -right-20 -bottom-24 size-[360px] opacity-70 dark:opacity-[0.16] pointer-events-none"
      />

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] h-full bg-background border-r border-border shadow-2xl animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative z-10 overflow-clip min-w-0">
        {/* TOP NAVBAR */}
        <header className="flex items-center justify-between border-b border-border/60 bg-background/50 backdrop-blur-xl z-20 px-4 sm:px-6 py-3 sm:py-3.5 transition-colors">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-foreground p-1.5 -ml-1 min-h-10 min-w-10 inline-flex items-center justify-center rounded-full hover:bg-card/70 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={language === 'es' ? 'Abrir menú' : 'Open menu'}
            >
              <Icon name="menu" size={24} />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg sm:text-xl text-foreground tracking-tight">
                {currentTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 bg-card/70 hover:bg-card backdrop-blur transition-all rounded-full px-3 sm:px-4 min-h-10 py-2 text-xs sm:text-sm font-semibold text-foreground shadow-sm border border-border/60 group"
              title="Cambiar idioma / Change language"
            >
              <Icon name="language" size={18} />
              <span className="font-bold">{language.toUpperCase()}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
              className="flex items-center gap-1.5 bg-card/70 hover:bg-card backdrop-blur transition-all rounded-full px-3 sm:px-4 min-h-10 py-2 text-xs sm:text-sm font-semibold text-foreground shadow-sm border border-border/60 group"
              title={isDarkMode ? t.lightMode : t.darkMode}
            >
              <Icon
                name={isDarkMode ? 'light_mode' : 'dark_mode'}
                size={18}
                className="transition-transform group-hover:rotate-12"
              />
              <span className="hidden xl:inline">{isDarkMode ? t.lightMode : t.darkMode}</span>
            </button>

            {/* User Info */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-border/60">
              <div className="text-right hidden lg:block">
                <p className="text-foreground text-xs sm:text-sm font-bold truncate max-w-[140px]">
                  {isGuest ? t.guestUser : user?.user_metadata?.full_name || (language === 'es' ? 'Usuaria' : 'User')}
                </p>
                <p className="text-muted-foreground text-[11px] font-medium leading-none">{isGuest ? t.guestBrowsing : t.powerhouseArchetype}</p>
              </div>
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full size-9 sm:size-10 border-2 border-card shadow-sm ring-2 ring-blossom-soft flex items-center justify-center bg-blossom-soft flex-shrink-0"
                style={
                  user?.user_metadata?.avatar_url
                    ? { backgroundImage: `url("${user.user_metadata.avatar_url}")` }
                    : {}
                }
              >
                {!user?.user_metadata?.avatar_url && (
                  <Icon name="person" size={20} className="text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden relative">{children}</div>
      </main>
      <PinLock />
      <AiConsentDialog />

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/90 backdrop-blur-xl border-t border-border/60 py-1 px-2 flex justify-around items-center shadow-lg transition-colors">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <button
              key={item.href}
              onClick={() =>
                isGuest && !isGuestRoute(item.href) ? setSignupPromptOpen(true) : router.push(item.href)
              }
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl min-w-[56px] transition-all ${
                isGuest && !isGuestRoute(item.href) ? 'opacity-50' : ''
              } ${

                isActive
                  ? 'text-blossom font-bold scale-105'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon
                name={item.icon}
                size={22}
                weight={isActive ? 'duotone' : 'regular'}
                className={isActive ? 'text-blossom' : ''}
              />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl min-w-[56px] text-muted-foreground hover:text-foreground transition-all"
        >
          <Icon name="more_horiz" size={22} />
          <span className="text-[10px] tracking-tight">{language === 'es' ? 'Más' : 'More'}</span>
        </button>
      </nav>

      {/* Floating AI Assistant Button */}
      <button
        onClick={() => (isGuest ? setSignupPromptOpen(true) : toggleAssistant())}
        aria-label={language === 'es' ? 'Abrir asistente' : 'Toggle assistant'}
        className={`fixed bottom-20 right-3 md:bottom-6 md:right-6 z-40 flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group ${
          isAssistantOpen
            ? 'bg-secondary text-foreground rotate-90 shadow-secondary/30'
            : 'bg-primary text-primary-foreground shadow-primary/35 hover:shadow-primary/50'
        }`}
      >
        {isAssistantOpen ? (
          <Icon name="close" size={26} weight="bold" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Icon name="chat_circle_dots" size={32} weight="duotone" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sun opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sun border-2 border-primary"></span>
            </span>
          </div>
        )}
      </button>

      {/* Floating AI Window */}
      {isAssistantOpen && (
        <div className="fixed bottom-36 md:bottom-24 right-3 md:right-6 left-3 md:left-auto md:w-[460px] h-[600px] max-h-[76vh] md:max-h-[82vh] z-50 animate-in fade-in slide-in-from-bottom-8 zoom-in-95 duration-300 origin-bottom-right">
          <SmartAssistant onClose={() => setAssistantOpen(false)} />
        </div>
      )}
      <GuestSignupModal />
    </div>
  );
}
