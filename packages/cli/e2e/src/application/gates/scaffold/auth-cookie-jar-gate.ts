import { GATE, GATE_PHASE } from '../../../domain/cli-surface.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';

/** Execute the documented curl recipe with the generated workspace's auth packages. */
export function createAuthCookieJarGate(): GateDefinition {
  return {
    id: GATE.BEHAVIOR_AUTH_COOKIE_JAR,
    title: 'Resolve and revoke a generated auth session using the documented cookie jar',
    phase: GATE_PHASE.BEHAVIOR,
    kind: 'command',
    critical: true,
    command: (context) => [
      'deno',
      'run',
      '-A',
      new URL('./probe-auth-cookie-jar.ts', import.meta.url).href,
      context.project.projectRoot,
      context.project.repoRoot,
    ],
    cwd: (context) => context.project.repoRoot,
    outputMode: 'capture',
    timeoutMs: 120_000,
    failureHint:
      'The documented transaction/session cookies must work with generated package resolution; callback JSON must not expose sessionId.',
  };
}
