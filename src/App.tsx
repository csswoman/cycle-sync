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
import { View } from '@/types';

function App() {
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
              {currentView === View.DASHBOARD && 'Overview'}
              {currentView === View.LOG && 'Daily Log'}
              {currentView === View.TRENDS && 'Trends'}
              {currentView === View.SETTINGS && 'Settings'}
              {currentView === View.ARCHETYPE_SELECTION && 'Personalize Experience'}
              {currentView === View.CYCLE_SETUP && 'Setup Profile'}
              {currentView === View.PCOS && 'PCOS Toolkit'}
              {currentView === View.ROUTINES && 'Entrenamientos'}
              {currentView === View.NUTRITION && 'Meal Ideas'}
              {/* Fallback for other views if needed */}
              {(currentView !== View.DASHBOARD && currentView !== View.LOG && currentView !== View.TRENDS && currentView !== View.SETTINGS && currentView !== View.ARCHETYPE_SELECTION && currentView !== View.CYCLE_SETUP && currentView !== View.PCOS && currentView !== View.ROUTINES && currentView !== View.NUTRITION) && 'CycleSync'}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2 bg-secondary hover:bg-surface-hover transition-all rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm border border-border/50 group"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:rotate-12">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
              <span className="hidden sm:inline">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-border">
              <div className="text-right hidden sm:block">
                <p className="text-foreground text-sm font-bold">Elena R.</p>
                <p className="text-muted-foreground text-xs font-medium">Powerhouse Archetype</p>
              </div>
              <div className="bg-center bg-no-repeat bg-cover rounded-full size-11 border-2 border-border shadow-xl shadow-primary/10 ring-2 ring-primary/5"
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDsvySV6JHheB_2QTPrBxRW-WlPhII5ihPXtZ2SqR5vH__HjdCIoXlg4RBVuiMjUJha1iy3-K9NkNDQ1CxG4KKvsX_FZREjkfrapXJnVo0SBCzf4It_WPpVEv-VVa2yUaJW8wdnBPZZ7jOLxqycpnqA1FnmDOtVQL5m425jGmxqs5fXaeIJsf3h0JJRa5X2PZ05aJc5wKTudNG6YUveRY7twSunxCalqn3X2-wpQvlaVz2DeQ5SqfMo8x-MrPI_JLz7jro6j8aJaCQ")' }}>
              </div>
            </div>
          </div>
        </header>

        {/* View Switcher */}
        {currentView === View.DASHBOARD && <Dashboard onNavigate={setCurrentView} />}
        {currentView === View.LOG && <DailyLog />}
        {currentView === View.TRENDS && <Trends />}
        {currentView === View.ARCHETYPE_SELECTION && <ArchetypeSelection onComplete={() => setCurrentView(View.CYCLE_SETUP)} />}
        {currentView === View.CYCLE_SETUP && <CycleSetup onNavigate={setCurrentView} />}
        {currentView === View.PCOS && <PCOSCare />}
        {currentView === View.ROUTINES && <Routines />}
        {currentView === View.NUTRITION && <Nutrition />}
        {(currentView !== View.DASHBOARD && currentView !== View.LOG && currentView !== View.TRENDS && currentView !== View.ARCHETYPE_SELECTION && currentView !== View.CYCLE_SETUP && currentView !== View.PCOS && currentView !== View.ROUTINES && currentView !== View.NUTRITION) && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-50">construction</span>
              <p>This feature is coming soon.</p>
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