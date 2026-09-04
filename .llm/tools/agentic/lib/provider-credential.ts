/** Provider-specific OpenCode credential isolation without value-bearing diagnostics. */

import { OPENCODE_TOOL } from '../config/versions.ts';

export const OPENCODE_CREDENTIAL_PROVIDERS = [
  'opencode_go',
  'ollama',
  'openrouter',
] as const;
export type OpenCodeCredentialProvider = typeof OPENCODE_CREDENTIAL_PROVIDERS[number];

interface CredentialPolicy {
  readonly provider: OpenCodeCredentialProvider;
  readonly modelPrefix: string;
  readonly envKey: 'OPENCODE_API_KEY' | 'OLLAMA_API_KEY' | 'OPENROUTER_API_KEY';
  readonly envRelativePath: string;
}

const CREDENTIAL_POLICIES: readonly CredentialPolicy[] = [
  {
    provider: 'opencode_go',
    modelPrefix: 'opencode-go/',
    envKey: 'OPENCODE_API_KEY',
    envRelativePath: OPENCODE_TOOL.openCodeGoEnvRelativePath,
  },
  {
    provider: 'ollama',
    modelPrefix: 'ollama-cloud/',
    envKey: 'OLLAMA_API_KEY',
    envRelativePath: OPENCODE_TOOL.ollamaEnvRelativePath,
  },
  {
    provider: 'openrouter',
    modelPrefix: 'openrouter/',
    envKey: 'OPENROUTER_API_KEY',
    envRelativePath: OPENCODE_TOOL.openRouterEnvRelativePath,
  },
] as const;

export type Environment = Readonly<Record<string, string | undefined>>;

export function openCodeCredentialProviderForModel(
  model: string,
): OpenCodeCredentialProvider | null {
  return CREDENTIAL_POLICIES.find((entry) => model.startsWith(entry.modelPrefix))?.provider ?? null;
}

export function parseCredentialAssignment(source: string, envKey: string): string | undefined {
  const escaped = envKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^\\s*(?:export\\s+)?${escaped}\\s*=\\s*(.*?)\\s*$`);
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(pattern);
    if (!match) continue;
    let value = match[1].trim();
    if (
      value.length >= 2 &&
      ((value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"')))
    ) value = value.slice(1, -1);
    return value || undefined;
  }
  return undefined;
}

function policyForModel(model: string): CredentialPolicy | null {
  return CREDENTIAL_POLICIES.find((entry) => model.startsWith(entry.modelPrefix)) ?? null;
}

async function resolveCredential(
  policy: CredentialPolicy,
  env: Environment,
  readTextFile: (path: string) => Promise<string>,
  stat: ((path: string) => Promise<Pick<Deno.FileInfo, 'mode'>>) | undefined,
): Promise<string> {
  const existing = env[policy.envKey]?.trim();
  if (existing) return existing;
  const home = env.HOME?.trim();
  if (!home) throw new Error(`${policy.envKey} is missing and HOME is unavailable`);
  const path = `${home.replace(/\/$/, '')}/${policy.envRelativePath}`;
  if (stat) {
    let mode: number | null;
    try {
      mode = (await stat(path)).mode;
    } catch {
      throw new Error(`${policy.envKey} is missing and its credential file is unreadable`);
    }
    if (mode !== null && (mode & 0o077) !== 0) {
      throw new Error(`${policy.envKey} credential file permissions must be 0600`);
    }
  }
  let source: string;
  try {
    source = await readTextFile(path);
  } catch {
    throw new Error(`${policy.envKey} is missing and its credential file is unreadable`);
  }
  const credential = parseCredentialAssignment(source, policy.envKey);
  if (!credential) throw new Error(`${policy.envKey} is missing from its credential file`);
  return credential;
}

/**
 * Supplies only the selected provider credential and clears every rival key.
 * Models outside paid OpenCode providers inherit no API-key mutation.
 */
export async function environmentWithOpenCodeCredential(
  model: string,
  env: Environment = Deno.env.toObject(),
  readTextFile: (path: string) => Promise<string> = Deno.readTextFile,
  stat: ((path: string) => Promise<Pick<Deno.FileInfo, 'mode'>>) | undefined = Deno.stat,
): Promise<Record<string, string>> {
  const result = Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
  const policy = policyForModel(model);
  if (!policy) return result;
  for (const candidate of CREDENTIAL_POLICIES) delete result[candidate.envKey];
  result[policy.envKey] = await resolveCredential(policy, env, readTextFile, stat);
  return result;
}
