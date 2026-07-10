/** Credential-free Codex profile-file materialization for OpenRouter routes. */

import type { RouteIdentity, RuntimeDiagnostic } from '../contract.ts';
import { OPENROUTER_RESPONSES_BASE_URL } from '../provider-profiles.ts';

export const CODEX_OPENROUTER_PROFILE_NAME = 'netscript-openrouter' as const;
export const CODEX_OPENROUTER_PROFILE_FILE: 'netscript-openrouter.config.toml' =
  'netscript-openrouter.config.toml';

export interface CodexProfileReference {
  readonly name: typeof CODEX_OPENROUTER_PROFILE_NAME;
  readonly home: string;
  readonly path: string;
}

export interface CodexProfileFilePort {
  ensureDirectory(path: string): Promise<void>;
  writeTextFile(path: string, content: string, mode: number): Promise<void>;
}

export interface CodexProfileMaterialization {
  readonly reference: CodexProfileReference | null;
  readonly diagnostic: RuntimeDiagnostic | null;
}

const denoProfileFiles: CodexProfileFilePort = {
  ensureDirectory: (path) => Deno.mkdir(path, { recursive: true, mode: 0o700 }),
  writeTextFile: (path, content, mode) => Deno.writeTextFile(path, content, { mode }),
};

function safeTomlString(value: string): string | null {
  return /^[A-Za-z0-9._~:/-]+$/.test(value) ? JSON.stringify(value) : null;
}

/** Renders a credential-free Codex profile using the supported Responses provider contract. */
export function renderCodexOpenRouterProfile(route: RouteIdentity): string | null {
  if (
    route.agent !== 'codex' || route.provider !== 'openrouter' ||
    route.profileId !== 'codex-openrouter'
  ) return null;
  const model = safeTomlString(route.model);
  if (!model) return null;
  return [
    `model = ${model}`,
    'model_provider = "netscript_openrouter"',
    `model_reasoning_effort = ${JSON.stringify(route.effort)}`,
    '',
    '[model_providers.netscript_openrouter]',
    'name = "OpenRouter"',
    `base_url = ${JSON.stringify(OPENROUTER_RESPONSES_BASE_URL)}`,
    'env_key = "OPENROUTER_API_KEY"',
    'wire_api = "responses"',
    '',
  ].join('\n');
}

/** Writes only credential-free profile metadata beneath an isolated child CODEX_HOME. */
export async function materializeCodexOpenRouterProfile(
  home: string,
  route: RouteIdentity,
  files: CodexProfileFilePort = denoProfileFiles,
): Promise<CodexProfileMaterialization> {
  const content = renderCodexOpenRouterProfile(route);
  if (!home.startsWith('/home/') || !content) {
    return {
      reference: null,
      diagnostic: {
        code: 'unsupported_route',
        category: 'provider',
        retryable: false,
        message: 'Codex OpenRouter profile identity or isolated profile home is invalid',
      },
    };
  }
  const path = `${home.replace(/\/$/, '')}/${CODEX_OPENROUTER_PROFILE_FILE}`;
  try {
    await files.ensureDirectory(home);
    await files.writeTextFile(path, content, 0o600);
    return {
      reference: { name: CODEX_OPENROUTER_PROFILE_NAME, home, path },
      diagnostic: null,
    };
  } catch {
    return {
      reference: null,
      diagnostic: {
        code: 'state_write_failed',
        category: 'state',
        retryable: false,
        message: 'credential-free Codex provider profile could not be materialized',
      },
    };
  }
}
