'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { Icon } from '@/components/ui/Icon';
import { AI_CONSENT_EVENT, answerAiConsent } from '@/lib/ai/consent';

/** Asks once before any AI feature sends the user's data to Google Gemini. */
export default function AiConsentDialog() {
  const { language } = useLanguage();
  const es = language === 'es';
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(AI_CONSENT_EVENT, show);
    return () => window.removeEventListener(AI_CONSENT_EVENT, show);
  }, []);

  if (!open) return null;

  const answer = async (accepted: boolean) => {
    setSaving(true);
    await answerAiConsent(accepted);
    setSaving(false);
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-consent-title"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <Icon name="shield_lock" size={40} weight="duotone" className="text-primary" />
        <h2 id="ai-consent-title" className="mt-2 text-lg font-bold text-foreground">
          {es ? 'Antes de usar la IA' : 'Before you use AI'}
        </h2>
        <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            {es
              ? 'Las funciones de IA (asistente, lectura de análisis, análisis de fotos y videos, y generación de recetas y planes) envían a Google Gemini lo necesario para responderte:'
              : 'AI features (assistant, lab report reading, photo and video analysis, and recipe and plan generation) send Google Gemini what it needs to answer you:'}
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{es ? 'Tus mensajes y un resumen de tu ciclo, síntomas, estado de ánimo y bienestar, embarazos, medicación, análisis y métricas (peso, glucosa, presión).' : 'Your messages and a summary of your cycle, symptoms, mood and wellbeing, pregnancies, medication, labs and metrics (weight, glucose, blood pressure).'}</li>
            <li>{es ? 'Las fotos, videos o PDF que elijas analizar.' : 'The photos, videos or PDFs you choose to analyze.'}</li>
          </ul>
          <p>
            {es
              ? 'Nunca se envían tu actividad sexual ni tus fotos de progreso. Puedes retirar este permiso en Ajustes → Privacidad.'
              : 'Your sexual activity and progress photos are never sent. You can withdraw this permission in Settings → Privacy.'}{' '}
            <Link href="/privacy" target="_blank" className="font-semibold text-primary hover:underline">
              {es ? 'Política de privacidad' : 'Privacy policy'}
            </Link>
          </p>
        </div>
        <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={() => answer(false)}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
          >
            {es ? 'No, gracias' : 'No, thanks'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => answer(true)}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {es ? 'Acepto' : 'I agree'}
          </button>
        </div>
      </div>
    </div>
  );
}
