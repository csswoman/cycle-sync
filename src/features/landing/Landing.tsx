'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { useTheme } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { Flower } from '@/components/ui/Flower';
import { Bloom } from '@/components/ui/Bloom';
import { GrowingBloom } from '@/components/ui/GrowingBloom';
import { GardenCorner, PetalDrift } from '@/components/ui/Botanical';
import { landingText, type LandingFeature, type PhaseKey } from './landingText';

const PHASES: { key: PhaseKey; growth: number }[] = [
  { key: 'menstrual', growth: 0.48 },
  { key: 'follicular', growth: 0.32 },
  { key: 'ovulation', growth: 1 },
  { key: 'luteal', growth: 0.88 },
];

const ctaPrimary =
  'cta-bloom inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold no-underline transition-transform hover:-translate-y-0.5';
const ctaSecondary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-semibold text-foreground no-underline transition-colors hover:bg-surface-hover';
const iconButton =
  'inline-flex size-10 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition-colors hover:bg-surface-hover';

export default function Landing() {
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [moreFeatures, setMoreFeatures] = React.useState(false);
  const t = landingText[language];

  // Shareable links: /?lang=en opens the English version.
  useEffect(() => {
    const lang = new URLSearchParams(window.location.search).get('lang');
    if (lang === 'en' || lang === 'es') setLanguage(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <div className="garden-canvas h-dvh w-full overflow-y-auto overflow-x-hidden scroll-smooth text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2.5 md:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-foreground no-underline">
            <Flower petal="var(--blossom-soft)" center="var(--sun)" outline="var(--blossom)" rotate={15} className="size-9" />
            <span className="text-lg font-semibold tracking-tight">CycleSync</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label="Main">
            <a href="#features" className="text-muted-foreground no-underline hover:text-foreground">{t.nav.features}</a>
            <a href="#pmos" className="text-muted-foreground no-underline hover:text-foreground">{t.nav.pmos}</a>
            <a href="#privacy" className="text-muted-foreground no-underline hover:text-foreground">{t.nav.privacy}</a>
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 sm:px-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
              aria-label={t.toggleLanguage}
              title={t.toggleLanguage}
            >
              <Icon name="language" size={18} />
              {language === 'es' ? 'EN' : 'ES'}
            </button>
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={iconButton}
              aria-label={t.toggleTheme}
              title={t.toggleTheme}
            >
              <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size={18} />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={`${iconButton} md:hidden`}
              aria-label={t.nav.menu}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <Icon name={menuOpen ? 'close' : 'menu'} size={20} />
            </button>
            <Link
              href="/login"
              className="hidden h-10 items-center rounded-full px-4 text-sm font-semibold text-primary no-underline hover:bg-primary/10 sm:inline-flex"
            >
              {t.nav.login}
            </Link>
          </div>
        </div>
        {menuOpen && (
          <nav id="mobile-menu" className="mx-auto flex max-w-6xl flex-col px-4 pb-3 text-base font-medium md:hidden" aria-label="Main">
            {[['#features', t.nav.features], ['#pmos', t.nav.pmos], ['#privacy', t.nav.privacy]].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="inline-flex min-h-11 items-center text-muted-foreground no-underline hover:text-foreground">{label}</a>
            ))}
            <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-primary no-underline">{t.nav.login}</Link>
          </nav>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-8 md:px-8 md:pb-24 md:pt-20 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-blossom/10 px-3 py-1.5 text-sm font-medium text-primary">
                <Icon name="pmos" size={16} />
                {t.hero.eyebrow}
                <InfoTooltip label={t.tips.more} className="shrink-0">{t.tips.pmos}</InfoTooltip>
              </p>
              <h1 className="m-0 text-[1.75rem] leading-[1.1] min-[400px]:text-4xl sm:text-5xl lg:text-6xl">
                {t.hero.title} <span className="text-gradient-bloom">{t.hero.titleAccent}</span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed sm:mt-6 sm:text-lg text-muted-foreground">{t.hero.subtitle}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className={ctaPrimary}>
                  {t.hero.primaryCta}
                  <Icon name="arrow_forward" size={18} weight="bold" />
                </Link>
                <Link href="/dashboard" className={ctaSecondary}>
                  {t.hero.secondaryCta}
                </Link>
              </div>
              <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="shield_lock" size={18} className="text-leaf" />
                {t.hero.note}
              </p>
            </div>

            <HeroMock t={t.mock} />
          </div>
        </section>

        {/* Phases */}
        <section className="border-y border-border/60 bg-card/50 py-10 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <SectionHeading title={t.phases.title} subtitle={t.phases.subtitle} />
            <ol className="-mx-4 mt-6 flex sm:mt-10 list-none snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
              {PHASES.map(({ key, growth }, i) => {
                const p = t.phases.items[key];
                return (
                  <li key={key} data-phase={key} className="phase-wash relative w-[68%] max-w-64 shrink-0 snap-start rounded-3xl border border-border/70 p-4 sm:w-auto sm:p-5 sm:max-w-none">
                    <div className="flex items-end justify-between">
                      <Bloom growth={growth} tone={key} className="h-16 w-auto sm:h-24" />
                      <span className="text-sm font-medium text-muted-foreground">0{i + 1}</span>
                    </div>
                    <h3 className="mb-1 mt-2 flex items-center gap-1 text-base text-phase sm:text-lg sm:mt-4">
                      {p.name}
                      <InfoTooltip label={`${t.tips.more}: ${p.name}`}>{t.tips.phases[key]}</InfoTooltip>
                    </h3>
                    <p className="m-0 text-[15px] font-medium text-foreground sm:text-base">{p.season}</p>
                    <p className="mb-0 mt-2 text-[15px] leading-relaxed text-muted-foreground sm:text-base">{p.desc}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 py-10 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <SectionHeading title={t.features.title} subtitle={t.features.subtitle} />
            <div className="-mx-4 mt-6 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:mt-10 sm:grid sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-3 [&::-webkit-scrollbar]:hidden">
              {t.features.items.slice(0, 3).map((f, fi) => (
                <article
                  key={f.title}
                  className="w-[82%] max-w-80 shrink-0 snap-start rounded-3xl border border-border/70 bg-card p-4 shadow-[var(--shadow-low)] sm:w-auto sm:max-w-none sm:p-6"
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-blossom/10 text-primary sm:size-12">
                    <Icon name={f.icon} size={24} />
                  </span>
                  <h3 className="mb-2 mt-4 text-lg sm:mt-5 sm:text-xl">{f.title}</h3>
                  <p className="m-0 text-[15px] leading-relaxed text-muted-foreground sm:text-base">{f.desc}</p>
                  <FeaturePoints f={f} fi={fi} t={t} className="mt-4" />
                </article>
              ))}
            </div>
            <div className={`${moreFeatures ? 'flex' : 'hidden'} -mx-4 mt-3 snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:mt-12 sm:!grid sm:gap-8 sm:overflow-visible sm:border-t sm:border-border/60 sm:px-0 sm:pb-0 sm:pt-10 md:grid-cols-3 [&::-webkit-scrollbar]:hidden`}>
              {t.features.items.slice(3).map((f, i) => (
                <article key={f.title} className="w-[82%] max-w-80 shrink-0 snap-start rounded-3xl border border-border/70 bg-card/60 p-5 sm:w-auto sm:max-w-none sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
                  <h3 className="m-0 flex items-center gap-2.5 text-base sm:text-lg">
                    <Icon name={f.icon} size={22} className="text-primary" />
                    {f.title}
                  </h3>
                  <p className="m-0 mt-2 text-[15px] leading-relaxed text-muted-foreground sm:text-base">{f.desc}</p>
                  <FeaturePoints f={f} fi={i + 3} t={t} className="mt-3" />
                </article>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setMoreFeatures((v) => !v)}
              aria-expanded={moreFeatures}
              className="mx-auto mt-2 flex min-h-11 w-fit items-center gap-1 rounded-full px-4 text-sm font-semibold text-primary hover:bg-primary/10 sm:hidden"
            >
              {moreFeatures ? t.features.less : t.features.more}
              <Icon name={moreFeatures ? 'expand_less' : 'expand_more'} size={16} />
            </button>
          </div>
        </section>

        {/* PMOS */}
        <section id="pmos" className="scroll-mt-20 pb-10 md:pb-24">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <div className="garden-wash relative overflow-hidden rounded-[2rem] border border-border/70 p-5 sm:p-10 md:p-14">
              <GardenCorner variant="blossom" side="left" className="hidden size-48 opacity-90 lg:block xl:size-56" />
              <div className="relative grid gap-6 sm:gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
                <div>
                  <h2 className="m-0 text-2xl sm:text-4xl">{t.pmos.title}</h2>
                  <p className="mb-0 mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground sm:text-base">{t.pmos.body}</p>
                  <Link href="/pmos" className={`${ctaSecondary} mt-5 sm:mt-8`}>
                    {t.pmos.cta}
                    <Icon name="arrow_forward" size={18} />
                  </Link>
                </div>
                <dl className="-mx-5 m-0 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:block sm:divide-y sm:divide-border/70 sm:overflow-visible sm:rounded-2xl sm:border sm:border-border/70 sm:bg-card/80 sm:px-0 sm:pb-0 sm:backdrop-blur-sm [&::-webkit-scrollbar]:hidden">
                  {t.pmos.points.map((p, pi) => (
                    <div key={p.title} className="w-[78%] max-w-72 shrink-0 snap-start rounded-2xl border border-border/70 bg-card/80 p-4 sm:w-auto sm:max-w-none sm:rounded-none sm:border-0 sm:bg-transparent sm:p-5">
                      <dt className="text-base font-semibold sm:text-lg">
                        {p.title}
                        {t.tips.pmosPoints[pi] && (
                          <InfoTooltip label={`${t.tips.more}: ${p.title}`} className="ml-1">{t.tips.pmosPoints[pi]}</InfoTooltip>
                        )}
                      </dt>
                      <dd className="m-0 mt-1 text-[15px] leading-relaxed text-muted-foreground sm:text-base">{p.desc}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>
        {/* Steps */}
        <section className="py-10 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <SectionHeading title={t.steps.title} />
            <ol className="mt-6 grid list-none gap-6 sm:mt-10 sm:gap-8 p-0 md:grid-cols-3">
              {t.steps.items.map((s, i) => (
                <li key={s.title} className="flex gap-3 sm:gap-4">
                  <span className="bg-bloom flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold sm:size-11 sm:text-base text-primary-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="m-0 text-base sm:text-lg">{s.title}</h3>
                    <p className="mb-0 mt-1.5 text-[15px] leading-relaxed text-muted-foreground sm:text-base">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/register" className={`${ctaPrimary} mt-6 w-full sm:mt-10 sm:w-auto`}>
              {t.hero.primaryCta}
              <Icon name="arrow_forward" size={18} weight="bold" />
            </Link>
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy" className="scroll-mt-20 border-y border-border/60 bg-card/50 py-10 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <SectionHeading title={t.privacy.title} subtitle={t.privacy.subtitle} />
            <div className="mt-6 divide-y divide-border/70 overflow-hidden rounded-3xl border border-border/70 bg-card sm:mt-10 sm:grid sm:grid-cols-2 sm:gap-5 sm:divide-y-0 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent lg:grid-cols-4">
              {t.privacy.items.map((p) => (
                <div key={p.title} className="flex items-start gap-3 p-4 sm:block sm:rounded-3xl sm:border sm:border-border/70 sm:bg-card sm:p-6">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-leaf-soft text-leaf sm:size-11 sm:rounded-2xl">
                    <Icon name={p.icon} size={20} />
                  </span>
                  <div>
                    <h3 className="mb-1 mt-0 text-base sm:mb-1.5 sm:mt-4 sm:text-lg">{p.title}</h3>
                    <p className="m-0 text-[15px] leading-relaxed text-muted-foreground sm:text-base">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-10 md:px-8 md:py-24">
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="relative mx-auto mb-3 flex h-24 w-48 items-end justify-center">
              <PetalDrift falling className="absolute inset-x-4 -top-6 h-14 w-40" />
              <GrowingBloom className="relative h-20 w-auto" />
            </div>
            <h2 className="m-0 text-2xl sm:text-4xl">{t.finalCta.title}</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">{t.finalCta.body}</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:mt-8 sm:flex-row">
              <Link href="/register" className={ctaPrimary}>
                {t.finalCta.primary}
                <Icon name="arrow_forward" size={18} weight="bold" />
              </Link>
              <Link href="/dashboard" className={ctaSecondary}>
                {t.finalCta.secondary}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center text-sm text-muted-foreground md:flex-row md:justify-between md:gap-4 md:px-8 md:py-8 md:text-left">
          <div className="flex items-center gap-2.5">
            <Flower petal="var(--blossom-soft)" center="var(--sun)" outline="var(--blossom)" rotate={-10} className="anim-sway size-7" style={{ '--dur': '5s' } as React.CSSProperties} />
            <span className="font-semibold text-foreground">CycleSync</span>
          </div>
          <p className="m-0 max-w-md text-[13px] leading-snug md:text-sm">{t.footer.disclaimer}</p>
          <div className="flex gap-2 sm:gap-5">
            <Link href="/privacy" className="inline-flex min-h-11 items-center px-1 text-muted-foreground hover:text-foreground">{t.footer.privacy}</Link>
            <Link href="/terms" className="inline-flex min-h-11 items-center px-1 text-muted-foreground hover:text-foreground">{t.footer.terms}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="m-0 text-2xl sm:text-4xl">{title}</h2>
      {subtitle && <p className="mb-0 mt-3 text-[15px] leading-relaxed text-muted-foreground sm:text-base">{subtitle}</p>}
    </div>
  );
}

/** Illustrative preview of the dashboard. Decorative content, not real data. */
function HeroMock({ t }: { t: (typeof landingText)['es']['mock'] }) {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="absolute -right-6 -top-10 size-40 opacity-70 anim-spin-slow">
        <Flower petal="var(--blossom-soft)" center="var(--sun)" petals={7} className="size-full" />
      </div>
      <div data-phase="follicular" className="phase-wash relative rounded-[2rem] border border-border/70 p-4 shadow-[var(--shadow-high)] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="m-0 text-sm text-muted-foreground">{t.day}</p>
            <p className="text-gradient-phase m-0 mt-1 text-xl font-semibold min-[400px]:whitespace-nowrap min-[400px]:text-2xl">{t.phase}</p>
            <p className="m-0 mt-2 inline-flex items-center gap-1.5 rounded-full bg-phase-soft min-[400px]:whitespace-nowrap px-2.5 py-1 text-xs font-medium text-phase">
              <Icon name="calendar" size={14} />
              {t.nextPeriod}
            </p>
          </div>
          <GrowingBloom className="h-24 w-auto shrink-0 sm:h-28" />
        </div>

        <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4">
          <p className="m-0 mb-3 text-sm font-semibold">{t.todayTitle}</p>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {t.items.map((item, i) => (
              <li key={item} className="flex items-center gap-2.5 text-sm">
                <span
                  className={`inline-flex size-5 items-center justify-center rounded-full ${
                    i < 2 ? 'bg-leaf text-background' : 'border border-border'
                  }`}
                >
                  {i < 2 && <Icon name="check" size={12} weight="bold" />}
                </span>
                <span className={i < 2 ? 'text-muted-foreground line-through' : ''}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="m-0 mt-4 flex items-start gap-2 rounded-2xl bg-sun/15 p-3 text-sm text-foreground">
          <Icon name="lightbulb" size={18} className="mt-0.5 text-sun-ink" />
          {t.suggestion}
        </p>
      </div>
    </div>
  );
}

function FeaturePoints({ f, fi, t, className = '' }: { f: LandingFeature; fi: number; t: (typeof landingText)['es']; className?: string }) {
  return (
    <ul className={`mb-0 flex list-none flex-col gap-2 p-0 ${className}`}>
      {f.points.map((pt, pi) => {
        const tip = t.tips.points[`${fi}-${pi}`];
        return (
        <li key={pt} className="flex items-start gap-2 text-[15px] text-foreground sm:text-base">
          <Icon name="check" size={16} weight="bold" className="mt-0.5 text-leaf" />
          <span>
            {tip ? (
              <>
                {pt.slice(0, pt.lastIndexOf(' ') + 1)}
                {/* Keep the "?" glued to the last word so it never wraps onto its own line. */}
                <span className="whitespace-nowrap">
                  {pt.slice(pt.lastIndexOf(' ') + 1)}
                  <InfoTooltip label={`${t.tips.more}: ${pt}`} className="ml-1">{tip}</InfoTooltip>
                </span>
              </>
            ) : (
              pt
            )}
          </span>
        </li>
        );
      })}
    </ul>
  );
}
