import React from 'react';
import { View } from '@/types';
import { supabase } from '@/lib/supabase';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

interface NavItemProps {
  view: View;
  label: string;
  icon: string;
  currentView: View;
  onViewChange: (view: View) => void;
}

const NavItem: React.FC<NavItemProps> = ({ view, label, icon, currentView, onViewChange }) => {
  const isActive = currentView === view;
  return (
    <div
      onClick={() => onViewChange(view)}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer group ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
        }`}
    >
      <span className={`material-symbols-outlined ${isActive ? 'text-primary fill-1' : 'text-muted-foreground group-hover:text-foreground'}`}>
        {icon}
      </span>
      <p className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</p>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { view: View.DASHBOARD, label: 'Dashboard', icon: 'dashboard' },
    { view: View.LOG, label: 'Daily Log', icon: 'edit_calendar' },
    { view: View.ROUTINES, label: 'Rutinas', icon: 'fitness_center' },
    { view: View.NUTRITION, label: 'Nutrición', icon: 'restaurant' },
    { view: View.TRENDS, label: 'Trends', icon: 'trending_up' },
    { view: View.PCOS, label: 'PCOS Care', icon: 'spa' },
  ];


  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-card hidden md:flex flex-col justify-between p-4 transition-colors duration-300">
      <div className="flex flex-col gap-8">
        {/* Branding */}
        <div className="flex items-center gap-3 px-2">
          <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 shadow-lg"
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAocgLUy_bp-dtx4_UsakO7oMmO9SwWvxFL5p5ctYuNGWccWPUdzIe_LFZz1iBmXjm1jgPvUXGoUU-tq6F4mz663g9rbkRt69-9JgsbYCx5BBX6pgqaOezDy6JXTv7c5Jqcev7JcAB6HfRpKsCdHp7Ly5LsBOZM-u61nwmQTBpW4lBOuVopOg7Pz_gyRrO8PVV4oLjzUxa3RnNk_ECfTF0icJkyT_yfas5keNw9n6YLbX2mDRCY8g367Xn7eTiT9qrSRe0FRiUR4nc")' }}>
          </div>
          <div className="flex flex-col">
            <h1 className="text-foreground text-lg font-bold leading-normal">CycleSync</h1>
            <p className="text-muted-foreground text-xs font-normal">Holistic Health</p>
          </div>
        </div>

        {/* Nav Menu */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavItem key={item.view} {...item} currentView={currentView} onViewChange={onViewChange} />
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-2">
        {/* Custom Experience Button */}
        <button
          onClick={() => onViewChange(View.ARCHETYPE_SELECTION)}
          className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary-hover hover:to-purple-700 text-primary-foreground text-sm font-bold py-3 rounded-xl shadow-lg mb-2 transition-all transform hover:scale-[1.02]"
        >
          Personalize Experience
        </button>

        <NavItem view={View.SETTINGS} label="Settings" icon="settings" currentView={currentView} onViewChange={onViewChange} />
        
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer group hover:bg-destructive/10 text-muted-foreground hover:text-destructive w-full mt-2"
        >
          <span className="material-symbols-outlined text-muted-foreground group-hover:text-destructive">
            logout
          </span>
          <p className="text-sm font-medium">Logout</p>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;