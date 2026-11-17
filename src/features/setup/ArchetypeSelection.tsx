import React, { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { onboardingText } from '@/i18n/onboardingText';
import { Bloom } from '@/components/ui/Bloom';
import { Flower } from '@/components/ui/Flower';
import { GardenCorner } from '@/components/ui/Botanical';
import {
  ONBOARDING_QUESTIONS, isQuestionAnswered, usesHormonalContraception,
  type OnboardingAnswers,
} from './onboarding';

interface ArchetypeSelectionProps {
  onComplete: (answers: OnboardingAnswers) => void | Promise<void>;
  initialAnswers?: OnboardingAnswers;
  saving?: boolean;
}

/** Language and theme toggles live in the app top bar, so this page has no header of its own. */
const ArchetypeSelection: React.FC<ArchetypeSelectionProps> = ({ onComplete, initialAnswers, saving = false }) => {
  const { language } = useLanguage();
  const text = onboardingText[language].archetype;
  const [answers, setAnswers] = useState<OnboardingAnswers>(initialAnswers ?? {});
  const [index, setIndex] = useState(0);
  const question = ONBOARDING_QUESTIONS[index];
  const isLast = index === ONBOARDING_QUESTIONS.length - 1;
  const copy = text.questions[question.id];
  const current = answers[question.id];
  const isSelected = (id: string) => (Array.isArray(current) ? current.includes(id) : current === id);
  const choose = (id: string) => {
    if (question.multi) {
      const list = (Array.isArray(current) ? current : []) as string[];
      setAnswers({ ...answers, [question.id]: list.includes(id) ? list.filter((v) => v !== id) : [...list, id] });
    } else {
      setAnswers({ ...answers, [question.id]: id });
    }
  };
  const note =
    question.id === 'contraception' && usesHormonalContraception(answers) ? text.notes.hormonalContraception
    : question.id === 'regularity' && answers.regularity === 'irregular' ? text.notes.irregular
    : null;
  const handleNext = () => {
    if (isLast) void onComplete(answers);
    else setIndex(index + 1);
  };

  const total = ONBOARDING_QUESTIONS.length;
  // The plant grows with each question: a seed at the start, in bloom at the end.
  const growth = 0.1 + (index / Math.max(1, total - 1)) * 0.9;

  return (
    <div className="flex-1 h-full overflow-y-auto relative scrollbar-hide">
      <div className="w-full max-w-[760px] mx-auto flex flex-col gap-6 py-6 sm:py-10 px-4 sm:px-6 pb-32">
        {index === 0 && (
          <section className="relative overflow-hidden rounded-3xl garden-wash border border-border/80 shadow-sm p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <GardenCorner variant="blossom" className="size-32 sm:size-48 opacity-70" />
            <div className="relative flex flex-col gap-2 pr-16 sm:pr-28">
              <span className="inline-flex w-fit items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-leaf bg-leaf-soft px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-[15px]">local_florist</span>
                {language === 'es' ? 'Tu experiencia' : 'Your experience'}
              </span>
              <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight text-foreground">{text.title}</h1>
              <p className="text-muted-foreground text-base leading-relaxed max-w-xl">{text.subtitle}</p>
            </div>
          </section>
        )}

        <section className="relative overflow-hidden rounded-3xl bg-card/85 backdrop-blur-sm border border-border/80 shadow-sm p-5 sm:p-7 flex flex-col gap-6">
          {/* Progress: one dot per question plus the growing plant. */}
          <div className="flex items-center gap-4">
            <div className="flex-1 flex flex-col gap-2.5">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>{text.questionOf(index + 1, total)}</span>
                <span>{question.multi ? text.chooseAny : text.chooseOne}</span>
              </div>
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {ONBOARDING_QUESTIONS.map((q, i) => (
                  <span
                    key={q.id}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      i < index ? 'flex-1 bg-leafy' : i === index ? 'flex-[2] bg-bloom' : 'flex-1 bg-secondary'
                    }`}
                  />
                ))}
              </div>
            </div>
            <Bloom growth={growth} tone={isLast ? 'ovulation' : 'follicular'} className="h-16 sm:h-20 w-auto shrink-0 -my-2" />
          </div>

          <div key={question.id} className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">{copy.title}</h2>
              <p className="text-muted-foreground">{copy.hint}</p>
            </div>
            <div className={`grid gap-3 ${question.multi ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'}`}>
              {question.options.map((opt) => {
                const o = text.options[`${question.prefix}_${opt.id}`];
                const selected = isSelected(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => choose(opt.id)}
                    aria-pressed={selected}
                    className={`relative flex items-center gap-4 text-left rounded-2xl border p-4 transition-all ${
                      selected
                        ? 'garden-wash border-blossom/50 shadow-md shadow-blossom/10'
                        : 'border-border bg-card/60 hover:border-leaf/50 hover:bg-leaf-soft/40'
                    }`}
                  >
                    <span
                      className={`size-11 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                        selected ? 'bg-bloom text-primary-foreground shadow-sm' : 'bg-leaf-soft text-leaf'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[24px]">{opt.icon}</span>
                    </span>
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-bold text-foreground">{o.label}</span>
                      {o.description && <span className="text-sm text-muted-foreground leading-snug">{o.description}</span>}
                    </span>
                    {selected && (
                      <Flower petal="var(--petal)" center="var(--sun)" petals={5} rotate={18} className="absolute top-2 right-2 size-5" />
                    )}
                  </button>
                );
              })}
            </div>
            {note && (
              <div className="flex gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-foreground p-4 text-sm">
                <span className="material-symbols-outlined text-amber-500">info</span>
                <p>{note}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
            <button
              type="button"
              onClick={() => setIndex(Math.max(0, index - 1))}
              disabled={index === 0 || saving}
              className="px-5 h-11 rounded-full text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-leaf-soft/60 transition-colors disabled:opacity-0"
            >
              {text.back}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!isQuestionAnswered(question, answers) || saving}
              className="cta-bloom px-8 h-12 rounded-full font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {saving ? text.saving : isLast ? text.finish : text.next}
            </button>
          </div>
        </section>

        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-leaf text-xs font-semibold bg-leaf-soft px-3.5 py-1.5 rounded-full">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            <span>{text.privacy}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ArchetypeSelection;
