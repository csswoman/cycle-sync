'use client';
import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAppointments } from '@/hooks/useAppointments';
import { daysUntil, nextAppointment, showAppointmentBanner } from '@/lib/pmos/appointments';
import { toLocalISO } from '@/lib/medications/schedule';
/** Shows from 3 days before the next appointment. Renders nothing without data or table. */
export const AppointmentBanner: React.FC = () => {
  const { language } = useLanguage();
  const es = language === 'es';
  const { items, available } = useAppointments();
  const today = toLocalISO(new Date());
  const next = available ? nextAppointment(items, today) : null;
  if (!next || !showAppointmentBanner(next.date, today)) return null;
  const n = daysUntil(next.date, today);
  const when = n === 0 ? (es ? 'hoy' : 'today') : n === 1 ? (es ? 'mañana' : 'tomorrow') : es ? `en ${n} días` : `in ${n} days`;
  return (
    <Link href="/pmos?tab=visit" className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 hover:border-primary/60">
      <Icon name="event" size={22} className="text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground">{es ? `Tu cita es ${when}` : `Your appointment is ${when}`}{next.time ? ` · ${next.time}` : ''}</p>
        <p className="text-sm text-muted-foreground">{es ? 'Revisa qué llevar: análisis pendientes y tus preguntas.' : 'Check what to bring: pending tests and your questions.'}</p>
      </div>
      <Icon name="chevron_right" size={20} className="text-muted-foreground shrink-0" />
    </Link>
  );
};
export default AppointmentBanner;
