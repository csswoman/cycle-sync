import { createHash } from 'crypto';

/** Server-only. Webhook secrets are stored as SHA-256 hex so a database leak does not expose working tokens. */
export function hashWebhookSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}
