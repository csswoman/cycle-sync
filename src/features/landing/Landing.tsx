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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-foreground no-underline">
            <Flower petal="var(--blossom-soft)" center="var(--sun)" outline="var(--blossom)" rotate={15} className="size-9" />
            <span className="text-lg font-semibold tracking-tight">CycleSync</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label="Main">
            <a href="#features" className="text-muted-foreground no-underline hover:text-foreground">{t.nav.features}</a>
            <a href="#pmos" className="text-muted-foreground no-underline hover:text-foreground">{t.nav.pmos}</a>
            <a href="#privacy" className="text-muted-foreground no-underline hover:text-foreground">{t.nav.privacy}</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
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
            <Link
              href="/login"
              className="hidden h-10 items-center rounded-full px-4 text-sm font-semibold text-primary no-underline hover:bg-primary/10 sm:inline-flex"
            >
              {t.nav.login}
            </Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl items-center gap-3 overflow-x-auto px-4 pb-2 text-[13px] font-medium min-[380px]:gap-5 min-[380px]:text-sm md:hidden" aria-label="Main">
          <a href="#features" className="inline-flex min-h-11 items-center text-muted-foreground no-underline hover:text-foreground">{t.nav.features}</a>
          <a href="#pmos" className="inline-flex min-h-11 items-center text-muted-foreground no-underline hover:text-foreground">{t.nav.pmos}</a>
          <a href="#privacy" className="inline-flex min-h-11 items-center text-muted-foreground no-underline hover:text-foreground">{t.nav.privacy}</a>
          <Link href="/login" className="ml-auto inline-flex min-h-11 items-center whitespace-nowrap font-semibold text-primary no-underline sm:hidden">{t.nav.login}</Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 md:px-8 md:pb-24 md:pt-20 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-blossom/10 px-3 py-1.5 text-sm font-medium text-primary">
                <Icon name="pmos" size={16} />
                {t.hero.eyebrow}
                <InfoTooltip label={t.tips.more} className="shrink-0">{t.tips.pmos}</InfoTooltip>
              </p>
              <h1 className="m-0 text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
                {t.hero.title} <span className="text-gradient-bloom">{t.hero.titleAccent}</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{t.hero.subtitle}</p>
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
        <section className="border-y border-border/60 bg-card/50 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <SectionHeading title={t.phases.title} subtitle={t.phases.subtitle} />
            <ol className="mt-10 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {PHASES.map(({ key, growth }, i) => {
                const p = t.phases.items[key];
                return (
                  <li key={key} data-phase={key} className="phase-wash relative rounded-3xl border border-border/70 p-5">
                    <div className="flex items-end justify-between">
                      <Bloom growth={growth} tone={key} className="h-24 w-auto" />
                      <span className="text-sm font-medium text-muted-foreground">0{i + 1}</span>
                    </div>
                    <h3 className="mb-1 mt-4 flex items-center gap-1 text-lg text-phase">
                      {p.name}
                      <InfoTooltip label={`${t.tips.more}: ${p.name}`}>{t.tips.phases[key]}</InfoTooltip>
                    </h3>
                    <p className="m-0 text-base font-medium text-foreground">{p.season}</p>
                    <p className="mb-0 mt-2 text-base leading-relaxed text-muted-foreground">{p.desc}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <SectionHeading title={t.features.title} subtitle={t.features.subtitle} />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {t.features.items.slice(0, 3).map((f, fi) => (
                <article
                  key={f.title}
                  className="rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-low)]"
                >
                  <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-blossom/10 text-primary">
                    <Icon name={f.icon} size={24} />
                  </span>
                  <h3 className="mb-2 mt-5 text-xl">{f.title}</h3>
                  <p className="m-0 text-base leading-relaxed text-muted-foreground">{f.desc}</p>
                  <FeaturePoints f={f} fi={fi} t={t} className="mt-4" />
                </article>
              ))}
            </div>
            <div className="mt-12 grid gap-8 border-t border-border/60 pt-10 md:grid-cols-3">
              {t.features.items.slice(3).map((f, i) => (
                <article key={f.title}>
                  <h3 className="m-0 flex items-center gap-2.5 text-lg">
                    <Icon name={f.icon} size={22} className="text-primary" />
                    {f.title}
                  </h3>
                  <p className="m-0 mt-2 text-base leading-relaxed text-muted-foreground">{f.desc}</p>
                  <FeaturePoints f={f} fi={i + 3} t={t} className="mt-3" />
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* PMOS */}
        <section id="pmos" className="scroll-mt-20 pb-16 md:pb-24">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <div className="garden-wash relative overflow-hidden rounded-[2rem] border border-border/70 p-6 sm:p-10 md:p-14">
              <GardenCorner variant="blossom" side="left" className="hidden size-48 opacity-90 lg:block xl:size-56" />
              <div className="relative grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
                <div>
                  <h2 className="m-0 text-3xl sm:text-4xl">{t.pmos.title}</h2>
                  <p className="mb-0 mt-4 max-w-md text-base leading-relaxed text-muted-foreground">{t.pmos.body}</p>
                  <Link href="/pmos" className={`${ctaSecondary} mt-8`}>
                    {t.pmos.cta}
                    <Icon name="arrow_forward" size={18} />
                  </Link>
                </div>
                <dl className="m-0 divide-y divide-border/70 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm">
                  {t.pmos.points.map((p, pi) => (
                    <div key={p.title} className="p-5">
                      <dt className="text-lg font-semibold">
                        {p.title}
                        {t.tips.pmosPoints[pi] && (
                          <InfoTooltip label={`${t.tips.more}: ${p.title}`} className="ml-1">{t.tips.pmosPoints[pi]}</InfoTooltip>
                        )}
                      </dt>
                      <dd className="m-0 mt-1 text-base leading-relaxed text-muted-foreground">{p.desc}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>
        {/* Steps */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <SectionHeading title={t.steps.title} />
            <ol className="mt-10 grid list-none gap-8 p-0 md:grid-cols-3">
              {t.steps.items.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="bg-bloom flex size-11 shrink-0 items-center justify-center rounded-full text-base font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="m-0 text-lg">{s.title}</h3>
                    <p className="mb-0 mt-1.5 text-base leading-relaxed text-muted-foreground">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/register" className={`${ctaPrimary} mt-10`}>
              {t.hero.primaryCta}
              <Icon name="arrow_forward" size={18} weight="bold" />
            </Link>
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy" className="scroll-mt-20 border-y border-border/60 bg-card/50 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <SectionHeading title={t.privacy.title} subtitle={t.privacy.subtitle} />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {t.privacy.items.map((p) => (
                <div key={p.title} className="rounded-3xl border border-border/70 bg-card p-6">
                  <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-leaf-soft text-leaf">
                    <Icon name={p.icon} size={22} />
                  </span>
                  <h3 className="mb-1.5 mt-4 text-lg">{p.title}</h3>
                  <p className="m-0 text-base leading-relaxed text-muted-foreground">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-16 md:px-8 md:py-24">
          <div className="relative mx-auto max-w-3xl text-center">
            <PetalDrift className="mx-auto mb-4 h-12 w-40" />
            <h2 className="m-0 text-3xl sm:text-4xl">{t.finalCta.title}</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">{t.finalCta.body}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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

      <footer className="border-t border-border/60 bg-background/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-2.5">
            <Flower petal="var(--blossom-soft)" center="var(--sun)" outline="var(--blossom)" rotate={-10} className="size-7" />
            <span className="font-semibold text-foreground">CycleSync</span>
          </div>
          <p className="m-0 max-w-md">{t.footer.disclaimer}</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground">{t.footer.privacy}</Link>
            <Link href="/terms" className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground">{t.footer.terms}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="m-0 text-3xl sm:text-4xl">{title}</h2>
      {subtitle && <p className="mb-0 mt-3 text-base leading-relaxed text-muted-foreground">{subtitle}</p>}
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
      <div data-phase="follicular" className="phase-wash relative rounded-[2rem] border border-border/70 p-6 shadow-[var(--shadow-high)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="m-0 text-sm text-muted-foreground">{t.day}</p>
            <p className="text-gradient-phase m-0 mt-1 text-2xl font-semibold">{t.phase}</p>
            <p className="m-0 mt-2 inline-flex items-center gap-1.5 rounded-full bg-phase-soft px-2.5 py-1 text-xs font-medium text-phase">
              <Icon name="calendar" size={14} />
              {t.nextPeriod}
            </p>
          </div>
          <GrowingBloom className="h-28 w-auto shrink-0" />
        </div>

        <div className="mt-5 rounded-2xl border border-border/70 bg-card p-4">
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
        <li key={pt} className="flex items-start gap-2 text-base text-foreground">
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
