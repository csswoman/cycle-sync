'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { useLanguage } from '@/i18n/LanguageContext';
import { CardFlowers } from '@/components/ui/CardFlowers';
import { useWeeklySummary } from '@/hooks/useWeeklySummary';

export const WeeklySummaryCard: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
    const { language } = useLanguage();
    const lang = language === 'es' ? 'es' : 'en';
    const { summary, loading } = useWeeklySummary(lang);

    // Signed out (guest), still loading or failed: nothing to show.
    if (loading || !summary || summary.loggedDays < 3) return null;

    const es = lang === 'es';
    return (
        <Card hoverable={false} className={embedded ? '!border-transparent !shadow-none !bg-transparent !p-0' : 'relative isolate overflow-hidden rounded-3xl !border-transparent bg-secondary/40 !shadow-none p-5'}>
            {!embedded && <CardFlowers variant="weekly" />}
            <CardHeader icon="insights" title={es ? 'Resumen de tu semana' : 'Your week in review'} />
            <CardContent>
                {summary.loggedDays < 3 ? (
                    <p className="text-sm text-muted-foreground">
                        {es
                            ? 'Registra al menos 3 días en la semana para ver patrones de energía, sueño y síntomas.'
                            : 'Log at least 3 days this week to see patterns in energy, sleep and symptoms.'}
                    </p>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground mb-2">
                            {es ? `${summary.loggedDays} días registrados` : `${summary.loggedDays} days logged`}
                            {summary.avgEnergy != null && ` · ${es ? 'energía' : 'energy'} ${summary.avgEnergy}/10`}
                            {summary.avgSleep != null && ` · ${es ? 'sueño' : 'sleep'} ${summary.avgSleep} h`}
                        </p>
                        {summary.insights.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {es ? 'Sin cambios marcados respecto a la semana anterior.' : 'No marked changes compared with last week.'}
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-2 text-sm list-disc pl-4">
                                {summary.insights.map((text) => (
                                    <li key={text}>{text}</li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};
