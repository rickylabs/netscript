/** Enforces the formal-evaluator child-model allowlist at the HTTP request boundary. */

import {
  LOOPBACK_HOST,
  LOOPBACK_HTTP_PROTOCOL,
  OPENROUTER_ANTHROPIC_BASE_URL,
} from '../config/endpoints.ts';
import { OPEN_EVALUATOR_MODEL_IDS } from '../config/models.ts';

export const EVALUATOR_MODEL_GUARD_EXIT_CODE = 78;
export const EVALUATOR_MODEL_AUDIT_ROOT = '.llm/tmp/agentic/evaluator-policy';

export interface EvaluatorModelAttempt {
  readonly event: 'evaluator_model_request_denied';
  readonly model: string;
  readonly requestingSession: string;
  readonly timestamp: string;
}

export interface EvaluatorModelGuardPorts {
  readonly fetch: (request: Request) => Promise<Response>;
  readonly audit: (attempt: EvaluatorModelAttempt) => Promise<void>;
  readonly abortEvaluation: (attempt: EvaluatorModelAttempt) => void;
  readonly now: () => string;
}

export interface EvaluatorModelGuard {
  readonly baseUrl: string;
  readonly auditPath: string;
  readonly violation: () => EvaluatorModelAttempt | null;
  readonly close: () => Promise<void>;
}

/** Keeps even an externally supplied resume identity inside the audit root. */
export function evaluatorModelAuditPath(requestingSession: string): string {
  const fileName = requestingSession.replace(/[^A-Za-z0-9._-]/g, '_');
  return `${EVALUATOR_MODEL_AUDIT_ROOT}/${fileName || 'missing-session'}.jsonl`;
}

function upstreamUrl(requestUrl: string, upstreamBaseUrl: string): string {
  const incoming = new URL(requestUrl);
  return `${upstreamBaseUrl.replace(/\/$/, '')}${incoming.pathname}${incoming.search}`;
}

async function requestedModel(request: Request): Promise<string | null> {
  if (request.method === 'GET' || request.method === 'HEAD') return null;
  try {
    const value = await request.clone().json() as { readonly model?: unknown };
    return typeof value.model === 'string' && value.model.trim() ? value.model : '';
  } catch {
    return '';
  }
}

function deniedResponse(): Response {
  return Response.json(
    { error: { type: 'evaluator_model_policy_violation', message: 'model denied' } },
    { status: 403 },
  );
}

/** Builds the credential-blind proxy handler used by both the server and focused tests. */
export function createEvaluatorModelGuardHandler(
  requestingSession: string,
  upstreamBaseUrl: string,
  ports: EvaluatorModelGuardPorts,
): (request: Request) => Promise<Response> {
  const allowed = new Set<string>(OPEN_EVALUATOR_MODEL_IDS);
  return async (request) => {
    const model = await requestedModel(request);
    if (model !== null && !allowed.has(model)) {
      const attempt: EvaluatorModelAttempt = {
        event: 'evaluator_model_request_denied',
        model: model || '<missing>',
        requestingSession,
        timestamp: ports.now(),
      };
      ports.abortEvaluation(attempt);
      await ports.audit(attempt);
      return deniedResponse();
    }
    return await ports.fetch(new Request(upstreamUrl(request.url, upstreamBaseUrl), request));
  };
}

async function appendAudit(path: string, attempt: EvaluatorModelAttempt): Promise<void> {
  await Deno.mkdir(EVALUATOR_MODEL_AUDIT_ROOT, { recursive: true, mode: 0o700 });
  await Deno.writeTextFile(path, `${JSON.stringify(attempt)}\n`, {
    append: true,
    create: true,
    mode: 0o600,
  });
}

/** Starts a loopback-only guard and returns the base URL for the evaluator child environment. */
export function startEvaluatorModelGuard(
  requestingSession: string,
  onViolation: (attempt: EvaluatorModelAttempt) => void = () => undefined,
): EvaluatorModelGuard {
  const auditPath = evaluatorModelAuditPath(requestingSession);
  const controller = new AbortController();
  let violation: EvaluatorModelAttempt | null = null;
  const handler = createEvaluatorModelGuardHandler(
    requestingSession,
    OPENROUTER_ANTHROPIC_BASE_URL,
    {
      fetch: (request) => fetch(request),
      audit: (attempt) => appendAudit(auditPath, attempt),
      abortEvaluation: (attempt) => {
        violation = attempt;
        onViolation(attempt);
      },
      now: () => new Date().toISOString(),
    },
  );
  const server = Deno.serve({
    hostname: LOOPBACK_HOST,
    port: 0,
    signal: controller.signal,
    onListen() {},
  }, handler);
  const address = server.addr as Deno.NetAddr;
  return {
    baseUrl: `${LOOPBACK_HTTP_PROTOCOL}//${address.hostname}:${address.port}`,
    auditPath,
    violation: () => violation,
    close: async () => {
      controller.abort();
      await server.finished.catch(() => undefined);
    },
  };
}
