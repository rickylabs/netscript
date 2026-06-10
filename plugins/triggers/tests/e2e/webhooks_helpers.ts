import { assert, assertEquals, assertExists } from '@std/assert';

export const TRIGGERS_API: string = Deno.env.get('TRIGGERS_API_URL') ?? 'http://localhost:8093';
export const WEBHOOKS_BASE: string = `${TRIGGERS_API}/api/v1/webhooks`;
export const REST_BASE: string = `${TRIGGERS_API}/api/v1/triggers`;
export const EXPORT_WEBHOOK_SECRET: string = Deno.env.get('WEBHOOK_EXPORT_SECRET') ??
  'dev-export-secret-change-me';

export function webhookE2eEnabled(): boolean {
  return Deno.env.get('NETSCRIPT_RUN_WEBHOOK_E2E') === '1';
}

export function webhookE2eTest(
  name: string,
  fn: () => Promise<void>,
): void {
  Deno.test({
    name,
    ignore: !webhookE2eEnabled(),
    sanitizeOps: false,
    sanitizeResources: false,
    fn,
  });
}

export async function computeHmac(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const hex = [...new Uint8Array(signatureBytes)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `sha256=${hex}`;
}

export async function fetchJson(
  url: string,
  init?: RequestInit,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await fetch(url, init);
  let body: Record<string, unknown>;
  try {
    body = await response.json() as Record<string, unknown>;
  } catch {
    body = { raw: await response.text() };
  }
  return { status: response.status, body };
}

export function assertAccepted(body: Record<string, unknown>): void {
  assertEquals(body.accepted, true);
  assertExists(body.eventId);
  assertExists(body.triggerId);
}

export function assertRejected(
  status: number,
  body: Record<string, unknown>,
  expectedStatus: number,
): void {
  assertEquals(status, expectedStatus);
  assert(body.accepted !== true);
}
