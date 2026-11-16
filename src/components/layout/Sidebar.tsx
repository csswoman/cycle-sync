'use client';

import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAppStore } from '@/stores/appStore';
import { isGuestRoute } from '@/lib/guestAccess';
import { Icon } from '@/components/ui/Icon';
import { Flower } from '@/components/ui/Flower';

interface SidebarProps {
  onClose?: () => void;
}

interface NavItemProps {
  href: string;
  label: string;
  icon: string;
  locked?: boolean;
  onClose?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ href, label, icon, locked, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const setSignupPromptOpen = useAppStore((s) => s.setSignupPromptOpen);
  const isActive = pathname === href || pathname.startsWith(href + '/');

  const handleClick = () => {
    if (locked) {
      setSignupPromptOpen(true);
      onClose?.();
      return;
    }
    router.push(href);
    onClose?.();
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-full transition-all cursor-pointer group ${
        isActive
          ? 'bg-blossom-soft text-foreground'
          : 'hover:bg-card text-muted-foreground hover:text-foreground'
      } ${locked ? 'opacity-60' : ''}`}
      aria-disabled={locked || undefined}
    >
      <Icon
        name={icon}
        size={20}
        weight={isActive ? 'duotone' : 'regular'}
        className={isActive ? 'text-blossom' : 'text-muted-foreground group-hover:text-foreground'}
      />
      <p className={`text-sm flex-1 ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</p>
      {locked && <Icon name="lock" size={16} className="text-muted-foreground" />}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const { user, authReady, setSignupPromptOpen } = useAppStore();
  const isGuest = authReady && !user;

  const navGroups = [
    {
      label: t.navToday,
      items: [
        { href: '/dashboard', label: t.overview, icon: 'dashboard' },
        { href: '/log', label: t.dailyLog, icon: 'edit_calendar' },
      ],
    },
    {
      label: t.navCycle,
      items: [
        { href: '/period-history', label: t.periodHistory, icon: 'history' },
        { href: '/trends', label: t.trends, icon: 'trending_up' },
      ],
    },
    {
      label: t.navPlan,
      items: [
        { href: '/routines', label: t.routines, icon: 'fitness_center' },
        { href: '/nutrition', label: t.mealIdeas, icon: 'restaurant' },
        { href: '/planner', label: t.weeklyPlanner, icon: 'calendar_month' },
      ],
    },
    {
      label: t.navHealth,
      items: [
        { href: '/pmos', label: t.pmosToolkit, icon: 'spa' },
        { href: '/habits', label: t.habits, icon: 'check_circle' },
        { href: '/articles', label: t.articles, icon: 'menu_book' },
        { href: '/export', label: t.exportReport, icon: 'download' },
      ],
    },
  ];

  return (
    <aside className={`relative z-10 w-64 h-full flex-shrink-0 border-r border-border/60 bg-card/70 backdrop-blur-xl flex flex-col justify-between p-4 transition-colors duration-300 ${onClose ? 'flex' : 'hidden md:flex'}`}>
      {/* Top Section: Branding */}
      <div className="flex items-center justify-between px-2 pb-4 border-b border-border/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Flower
            petal="var(--blossom-soft)"
            center="var(--sun)"
            outline="var(--blossom)"
            rotate={15}
            className="size-10 drop-shadow-sm"
          />
          <div className="flex flex-col">
            <h1 className="text-foreground text-xl font-bold tracking-tight">CycleSync</h1>
            <p className="text-muted-foreground text-xs font-normal">Holistic Health</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-card transition-colors"
            aria-label="Close menu"
          >
            <Icon name="close" size={20} />
          </button>
        )}
      </div>

      {/* Nav Menu with independent scroll */}
      <nav className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-1 py-3 scrollbar-hide my-1 pr-1">
        {navGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1 mb-2">
            <p className="px-4 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">{group.label}</p>
            {group.items.map((item) => (
              <NavItem key={item.href} {...item} locked={isGuest && !isGuestRoute(item.href)} onClose={onClose} />
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom Pinned Controls */}
      <div className="flex flex-col gap-1.5 pt-3 border-t border-border/40 flex-shrink-0">
        <button
          onClick={() => {
            if (isGuest) {
              setSignupPromptOpen(true);
            } else {
              router.push('/archetype');
            }
            onClose?.();
          }}
          className="w-full bg-gradient-to-r from-blossom via-blossom to-coral text-primary-foreground text-sm font-bold py-2.5 rounded-full shadow-md shadow-blossom/20 mb-1 transition-all transform hover:scale-[1.02] hover:brightness-105 active:scale-95"
        >
          {t.personalizeExperience}
        </button>

        <NavItem href="/settings" label={t.settings} icon="settings" locked={isGuest} onClose={onClose} />

        <button
          onClick={() => (isGuest ? router.push('/login') : supabase.auth.signOut())}
          className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all cursor-pointer group w-full text-muted-foreground ${isGuest ? 'hover:bg-card hover:text-foreground' : 'hover:bg-destructive/10 hover:text-destructive'}`}
        >
          <Icon
            name={isGuest ? 'login' : 'logout'}
            size={20}
            className={isGuest ? 'group-hover:text-foreground' : 'group-hover:text-destructive'}
          />
          <p className="text-sm font-medium">{isGuest ? t.guestSignIn : 'Logout'}</p>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
