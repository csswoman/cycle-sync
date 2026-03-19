'use client';

import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/i18n/LanguageContext';

interface SidebarProps {
  onClose?: () => void;
}

interface NavItemProps {
  href: string;
  label: string;
  icon: string;
  onClose?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ href, label, icon, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  const handleClick = () => {
    router.push(href);
    onClose?.();
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer group ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
      }`}
    >
      <span
        className={`material-symbols-outlined ${
          isActive ? 'text-primary fill-1' : 'text-muted-foreground group-hover:text-foreground'
        }`}
      >
        {icon}
      </span>
      <p className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</p>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const router = useRouter();

  const navItems = [
    { href: '/dashboard', label: t.overview, icon: 'dashboard' },
    { href: '/log', label: t.dailyLog, icon: 'edit_calendar' },
    { href: '/period-history', label: t.periodHistory, icon: 'history' },
    { href: '/routines', label: t.routines, icon: 'fitness_center' },
    { href: '/nutrition', label: t.mealIdeas, icon: 'restaurant' },
    { href: '/trends', label: t.trends, icon: 'trending_up' },
    { href: '/pcos', label: t.pcosToolkit, icon: 'spa' },
    { href: '/habits', label: t.habits, icon: 'check_circle' },
    { href: '/export', label: t.exportReport, icon: 'download' },
  ];

  return (
    <aside className={`w-64 flex-shrink-0 border-r border-border bg-card flex-col justify-between p-4 transition-colors duration-300 ${onClose ? 'flex' : 'hidden md:flex'}`}>
      <div className="flex flex-col gap-8">
        {/* Branding */}
        <div className="flex items-center gap-3 px-2">
          <div
            className="bg-center bg-no-repeat bg-cover rounded-full size-10 shadow-lg"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAocgLUy_bp-dtx4_UsakO7oMmO9SwWvxFL5p5ctYuNGWccWPUdzIe_LFZz1iBmXjm1jgPvUXGoUU-tq6F4mz663g9rbkRt69-9JgsbYCx5BBX6pgqaOezDy6JXTv7c5Jqcev7JcAB6HfRpKsCdHp7Ly5LsBOZM-u61nwmQTBpW4lBOuVopOg7Pz_gyRrO8PVV4oLjzUxa3RnNk_ECfTF0icJkyT_yfas5keNw9n6YLbX2mDRCY8g367Xn7eTiT9qrSRe0FRiUR4nc")',
            }}
          />
          <div className="flex flex-col">
            <h1 className="text-foreground text-lg font-bold leading-normal">CycleSync</h1>
            <p className="text-muted-foreground text-xs font-normal">Holistic Health</p>
          </div>
        </div>

        {/* Nav Menu */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} onClose={onClose} />
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-2">
        {/* Personalize Button */}
        <button
          onClick={() => {
            router.push('/archetype');
            onClose?.();
          }}
          className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary-hover hover:to-purple-700 text-primary-foreground text-sm font-bold py-3 rounded-xl shadow-lg mb-2 transition-all transform hover:scale-[1.02]"
        >
          {t.personalizeExperience}
        </button>

        <NavItem href="/settings" label={t.settings} icon="settings" onClose={onClose} />

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
