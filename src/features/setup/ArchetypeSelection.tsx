import React, { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { onboardingText } from '@/i18n/onboardingText';
import {
  ONBOARDING_QUESTIONS, isQuestionAnswered, usesHormonalContraception,
  type OnboardingAnswers,
} from './onboarding';

interface ArchetypeSelectionProps {
  onComplete: (answers: OnboardingAnswers) => void | Promise<void>;
  initialAnswers?: OnboardingAnswers;
  saving?: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ArchetypeSelection: React.FC<ArchetypeSelectionProps> = ({ onComplete, initialAnswers, saving = false, isDarkMode, toggleDarkMode }) => {
  const { language, setLanguage } = useLanguage();
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

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  return (
    <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full overflow-y-auto transition-colors duration-300">
      <header className="w-full border-b border-border bg-background z-10 sticky top-0">
        <div className="px-4 md:px-10 py-3 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>local_florist</span>
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-tight">CycleSync</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 bg-secondary hover:bg-surface-hover transition-all rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground border border-border/50"
            >
              <span className="material-symbols-outlined text-[18px]">language</span>
              <span className="font-bold">{language.toUpperCase()}</span>
            </button>

            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2 bg-secondary hover:bg-surface-hover transition-all rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground border border-border/50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-[760px] mx-auto flex flex-col gap-8 py-10 px-6">
        {index === 0 && (
          <div className="flex flex-col gap-3 text-center items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight max-w-2xl text-foreground">{text.title}</h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-xl">{text.subtitle}</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm font-medium text-muted-foreground">
            <span>{text.questionOf(index + 1, ONBOARDING_QUESTIONS.length)}</span>
            <span>{question.multi ? text.chooseAny : text.chooseOne}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${((index + 1) / ONBOARDING_QUESTIONS.length) * 100}%` }} />
          </div>
        </div>
        <div key={question.id} className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl md:text-3xl font-black text-foreground">{copy.title}</h2>
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
                  className={`flex items-center gap-4 text-left rounded-xl border-2 p-4 transition-all ${selected ? 'border-primary bg-card shadow-lg shadow-primary/5' : 'border-border bg-card/50 hover:border-primary/60'}`}
                >
                  <span className={`size-11 shrink-0 rounded-full flex items-center justify-center ${selected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                    <span className="material-symbols-outlined text-[24px]">{opt.icon}</span>
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-bold text-foreground">{o.label}</span>
                    {o.description && <span className="text-sm text-muted-foreground leading-snug">{o.description}</span>}
                  </span>
                </button>
              );
            })}
          </div>
          {note && (
            <div className="flex gap-3 rounded-xl bg-amber-500/10 text-foreground p-4 text-sm">
              <span className="material-symbols-outlined text-amber-500">info</span>
              <p>{note}</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setIndex(Math.max(0, index - 1))}
            disabled={index === 0 || saving}
            className="px-6 py-3 rounded-lg text-sm font-bold text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-0"
          >
            {text.back}
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!isQuestionAnswered(question, answers) || saving}
            className="px-8 h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? text.saving : isLast ? text.finish : text.next}
          </button>
        </div>
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium bg-secondary px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            <span>{text.privacy}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ArchetypeSelection;
