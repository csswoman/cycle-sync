'use client';

import { supabase } from '@/lib/supabase';
import { AI_CONSENT_KEY } from './consentKey';

/**
 * Client side of the AI data notice. Every request that sends user data to Google Gemini
 * goes through aiFetch(), which asks once for consent (stored in the user's metadata,
 * so it follows the account across devices). The server checks the same flag.
 */

export const AI_CONSENT_EVENT = 'cyclesync:ai-consent-request';

export class AiConsentDeclinedError extends Error {
  constructor() {
    let es = true;
    try { es = (window.localStorage.getItem('language') ?? 'es') === 'es'; } catch { /* storage blocked */ }
    // Callers show error.message as-is, so keep it readable.
    super(es
      ? 'Para usar esta función necesitas aceptar el aviso sobre la IA.'
      : 'To use this feature you need to accept the AI notice.');
    this.name = 'AiConsentDeclinedError';
  }
}

let waiting: Array<(ok: boolean) => void> = [];

export async function hasAiConsent(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return Boolean(session?.user.user_metadata?.[AI_CONSENT_KEY]);
}

/** Resolves true once the user has consented (asking if needed), false if they decline. */
export async function ensureAiConsent(): Promise<boolean> {
  if (await hasAiConsent()) return true;
  return new Promise<boolean>((resolve) => {
    waiting.push(resolve);
    if (waiting.length === 1) window.dispatchEvent(new Event(AI_CONSENT_EVENT));
  });
}

/** Called by the consent dialog. Saves the choice and wakes every waiting request. */
export async function answerAiConsent(accepted: boolean): Promise<void> {
  if (accepted) {
    const { error } = await supabase.auth.updateUser({ data: { [AI_CONSENT_KEY]: new Date().toISOString() } });
    if (error) accepted = false;
  }
  const pending = waiting;
  waiting = [];
  pending.forEach((resolve) => resolve(accepted));
}

/** Withdraws consent: AI features will ask again before sending anything. */
export async function revokeAiConsent(): Promise<boolean> {
  const { error } = await supabase.auth.updateUser({ data: { [AI_CONSENT_KEY]: null } });
  return !error;
}

/** fetch() for AI endpoints: asks for consent first and throws AiConsentDeclinedError if refused. */
export async function aiFetch(input: string, init?: RequestInit): Promise<Response> {
  if (!(await ensureAiConsent())) throw new AiConsentDeclinedError();
  const res = await fetch(input, init);
  if (res.status === 403) {
    // Consent was withdrawn on another device: ask again once.
    const data = await res.clone().json().catch(() => ({}));
    if (data?.code === 'ai_consent_required') {
      await supabase.auth.refreshSession().catch(() => undefined);
      if (!(await ensureAiConsent())) throw new AiConsentDeclinedError();
      return fetch(input, init);
    }
  }
  return res;
}
