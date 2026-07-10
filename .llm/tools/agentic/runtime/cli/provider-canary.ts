/** Read-only CLI edge for structured provider compatibility canaries. */

import { ProviderCanaryAdapter } from '../adapters/provider-canary-adapter.ts';
import {
  CODEX_OPENROUTER_PROFILE_FILE,
  CODEX_OPENROUTER_PROFILE_NAME,
} from '../adapters/codex-profile-adapter.ts';
import { AGENT_KINDS, EFFORTS, PROVIDER_KINDS, type RouteIdentity } from '../contract.ts';
import { PROVIDER_PROFILE_IDS } from '../provider-profiles.ts';

function usage(): string {
  return [
    'Usage: deno task agentic:provider-canary --profile <id> --model <id> --effort <effort>',
    '  --worktree <native-ext4-path> [--base-url <https-url>] [--codex-profile-home <path>]',
    '',
    'Prints structured non-secret JSON. Exit: 0 passed · 4 blocked · 5 failed · 2 usage.',
  ].join('\n');
}

function values(args: readonly string[]): ReadonlyMap<string, string> {
  const parsed = new Map<string, string>();
  const allowed = [
    '--profile',
    '--model',
    '--effort',
    '--worktree',
    '--base-url',
    '--codex-profile-home',
  ];
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!allowed.includes(key) || !value || value.startsWith('--') || parsed.has(key)) {
      throw new Error(usage());
    }
    parsed.set(key, value);
  }
  return parsed;
}

function route(input: ReadonlyMap<string, string>): RouteIdentity {
  const profileId = input.get('--profile');
  const model = input.get('--model');
  const effort = input.get('--effort');
  const worktree = input.get('--worktree');
  if (
    !profileId || !PROVIDER_PROFILE_IDS.includes(profileId as never) || !model || !effort ||
    !EFFORTS.includes(effort as never) || !worktree
  ) throw new Error(usage());
  const [agent, provider] = profileId === 'claude-anthropic-native'
    ? ['claude', 'anthropic']
    : profileId === 'codex-openai-native'
    ? ['codex', 'openai']
    : profileId === 'claude-custom'
    ? ['claude', 'custom']
    : profileId.startsWith('claude-')
    ? ['claude', 'openrouter']
    : ['codex', 'openrouter'];
  if (!AGENT_KINDS.includes(agent as never) || !PROVIDER_KINDS.includes(provider as never)) {
    throw new Error(usage());
  }
  return {
    agent: agent as RouteIdentity['agent'],
    provider: provider as RouteIdentity['provider'],
    profileId: profileId as RouteIdentity['profileId'],
    model,
    effort: effort as RouteIdentity['effort'],
    worktree,
    mobileRequired: false,
    baseUrl: input.get('--base-url'),
  };
}

async function main(): Promise<number> {
  try {
    const parsed = values(Deno.args);
    const selected = route(parsed);
    const home = parsed.get('--codex-profile-home');
    const profile = home && selected.profileId === 'codex-openrouter'
      ? {
        name: CODEX_OPENROUTER_PROFILE_NAME,
        home,
        path: `${home.replace(/\/$/, '')}/${CODEX_OPENROUTER_PROFILE_FILE}`,
      }
      : undefined;
    const result = await new ProviderCanaryAdapter().run(selected, profile);
    console.log(JSON.stringify(result));
    return result.status === 'passed' ? 0 : result.status === 'blocked' ? 4 : 5;
  } catch (error) {
    console.error(error instanceof Error ? error.message : usage());
    return 2;
  }
}

if (import.meta.main) Deno.exit(await main());
