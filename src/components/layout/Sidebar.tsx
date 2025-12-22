import React from 'react';
import { View } from '@/types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const getLinkClass = (view: View) => {
    const base = "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors cursor-pointer group";
    if (currentView === view) {
      return `${base} bg-primary/20 text-white`;
    }
    return `${base} hover:bg-surface-dark text-text-secondary hover:text-white`;
  };

  const getIconClass = (view: View) => {
    if (currentView === view) {
      return "material-symbols-outlined text-primary fill-1";
    }
    return "material-symbols-outlined text-text-secondary group-hover:text-white";
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-surface-dark bg-background-dark hidden md:flex flex-col justify-between p-4">
      <div className="flex flex-col gap-8">
        {/* Branding */}
        <div className="flex items-center gap-3 px-2">
          <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 shadow-lg"
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAocgLUy_bp-dtx4_UsakO7oMmO9SwWvxFL5p5ctYuNGWccWPUdzIe_LFZz1iBmXjm1jgPvUXGoUU-tq6F4mz663g9rbkRt69-9JgsbYCx5BBX6pgqaOezDy6JXTv7c5Jqcev7JcAB6HfRpKsCdHp7Ly5LsBOZM-u61nwmQTBpW4lBOuVopOg7Pz_gyRrO8PVV4oLjzUxa3RnNk_ECfTF0icJkyT_yfas5keNw9n6YLbX2mDRCY8g367Xn7eTiT9qrSRe0FRiUR4nc")' }}>
          </div>
          <div className="flex flex-col">
            <h1 className="text-white text-lg font-bold leading-normal">CycleSync</h1>
            <p className="text-text-secondary text-xs font-normal">Holistic Health</p>
          </div>
        </div>

        {/* Nav Menu */}
        <nav className="flex flex-col gap-2">
          <div onClick={() => onViewChange(View.DASHBOARD)} className={getLinkClass(View.DASHBOARD)}>
            <span className={getIconClass(View.DASHBOARD)}>dashboard</span>
            <p className={`text-sm ${currentView === View.DASHBOARD ? 'font-bold' : 'font-medium'}`}>Dashboard</p>
          </div>

          <div onClick={() => onViewChange(View.LOG)} className={getLinkClass(View.LOG)}>
            <span className={getIconClass(View.LOG)}>edit_calendar</span>
            <p className={`text-sm ${currentView === View.LOG ? 'font-bold' : 'font-medium'}`}>Daily Log</p>
          </div>

          <div onClick={() => onViewChange(View.ROUTINES)} className={getLinkClass(View.ROUTINES)}>
            <span className={getIconClass(View.ROUTINES)}>fitness_center</span>
            <p className={`text-sm ${currentView === View.ROUTINES ? 'font-bold' : 'font-medium'}`}>Rutinas</p>
          </div>

          <div onClick={() => onViewChange(View.NUTRITION)} className={getLinkClass(View.NUTRITION)}>
            <span className={getIconClass(View.NUTRITION)}>restaurant</span>
            <p className={`text-sm ${currentView === View.NUTRITION ? 'font-bold' : 'font-medium'}`}>Nutrición</p>
          </div>

          <div onClick={() => onViewChange(View.TRENDS)} className={getLinkClass(View.TRENDS)}>
            <span className={getIconClass(View.TRENDS)}>trending_up</span>
            <p className={`text-sm ${currentView === View.TRENDS ? 'font-bold' : 'font-medium'}`}>Trends</p>
          </div>

          <div onClick={() => onViewChange(View.PCOS)} className={getLinkClass(View.PCOS)}>
            <span className={getIconClass(View.PCOS)}>spa</span>
            <p className={`text-sm ${currentView === View.PCOS ? 'font-bold' : 'font-medium'}`}>PCOS Care</p>
          </div>
        </nav>
      </div>

      <div className="flex flex-col gap-2">
        {/* Custom Experience Button */}
        <button
          onClick={() => onViewChange(View.ARCHETYPE_SELECTION)}
          className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary-hover hover:to-purple-700 text-white text-sm font-bold py-3 rounded-xl shadow-lg mb-2 transition-all transform hover:scale-[1.02]"
        >
          Personalize Experience
        </button>

        <div onClick={() => onViewChange(View.SETTINGS)} className={getLinkClass(View.SETTINGS)}>
          <span className={getIconClass(View.SETTINGS)}>settings</span>
          <p className={`text-sm ${currentView === View.SETTINGS ? 'font-bold' : 'font-medium'}`}>Settings</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;