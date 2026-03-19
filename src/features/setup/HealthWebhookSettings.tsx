'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function HealthWebhookSettings() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [secretPrefix, setSecretPrefix] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health/token');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setConfigured(!!data.configured);
      setWebhookUrl(data.webhookUrl ?? null);
      setSecretPrefix(data.secretPrefix ?? null);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/health/token', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setWebhookUrl(data.webhookUrl);
      setConfigured(true);
      setSecretPrefix(null);
      setMessage({ type: 'success', text: t.healthWebhookTokenCreated });
      await navigator.clipboard.writeText(data.webhookUrl).catch(() => {});
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setGenerating(false);
    }
  };

  const copyUrl = () => {
    if (webhookUrl) void navigator.clipboard.writeText(webhookUrl);
    setMessage({ type: 'success', text: t.healthWebhookCopied });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">{t.healthWebhookLoading}</div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t.healthWebhookDescription}</p>

      {message && (
        <div
          className={`p-3 rounded-xl text-sm border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          {message.text}
        </div>
      )}

      {configured && webhookUrl && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t.healthWebhookUrlLabel}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <code className="flex-1 text-xs p-3 rounded-xl bg-secondary border border-border break-all text-foreground">
              {webhookUrl}
            </code>
            <button
              type="button"
              onClick={copyUrl}
              className="px-4 h-auto min-h-12 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 shrink-0"
            >
              {t.healthWebhookCopy}
            </button>
          </div>
          {secretPrefix && (
            <p className="text-xs text-muted-foreground">
              {t.healthWebhookSecretHint}: {secretPrefix}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={generating}
          onClick={handleGenerate}
          className="px-6 h-11 rounded-xl bg-[#4285F4] text-white font-bold text-sm hover:bg-[#3367d6] disabled:opacity-50"
        >
          {configured ? t.healthWebhookRotate : t.healthWebhookGenerate}
        </button>
      </div>

      <ol className="text-xs text-muted-foreground space-y-2 list-decimal pl-4">
        <li>{t.healthWebhookStep1}</li>
        <li>{t.healthWebhookStep2}</li>
        <li>{t.healthWebhookStep3}</li>
        <li>{t.healthWebhookStep4}</li>
      </ol>
    </div>
  );
}
