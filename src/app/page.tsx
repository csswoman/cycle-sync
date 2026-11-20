import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Landing from '@/features/landing/Landing';

export const metadata: Metadata = {
  title: 'CycleSync - Tu ciclo, nutrición y PMOS en sincronía',
  description:
    'Registro diario del ciclo con nutrición, ejercicio y bienestar por fase, y soporte específico para PMOS. Funciona sin conexión y prioriza tu privacidad.',
  alternates: { languages: { es: '/', en: '/?lang=en' } },
};

export default async function RootPage() {
  // The landing page is for visitors; signed-in users go straight to the app.
  // Supabase stores the session in a cookie named sb-*-auth-token.
  const cookieStore = await cookies();
  const hasSession = cookieStore.getAll().some((c) => c.name.includes('-auth-token') && !c.name.endsWith('-code-verifier') && Boolean(c.value?.trim()));
  if (hasSession) redirect('/dashboard');

  return <Landing />;
}
