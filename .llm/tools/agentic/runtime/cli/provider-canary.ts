/** Static-by-default preset validation with explicit opt-in live provider canaries. */

import { ProviderCanaryAdapter } from '../adapters/provider-canary-adapter.ts';
import {
  CODEX_OPENROUTER_PROFILE_FILE,
  CODEX_OPENROUTER_PROFILE_NAME,
} from '../adapters/codex-profile-adapter.ts';
import { AGENT_KINDS, EFFORTS, PROVIDER_KINDS, type RouteIdentity } from '../contract.ts';
import { evaluateOpenRouterPresetCanaries } from '../preset-canary.ts';
import { PROVIDER_PROFILE_IDS } from '../provider-profiles.ts';

export type ProviderCanaryCliOptions =
  | { readonly mode: 'static'; readonly worktree: string }
  | {
    readonly mode: 'live';
    readonly route: RouteIdentity;
    readonly codexProfileHome?: string;
  };

function usage(): string {
  return [
    'Usage:',
    '  deno task agentic:provider-canary [--all] [--worktree <native-ext4-path>]',
    '  deno task agentic:provider-canary --live --profile <id> --model <id> --effort <effort>',
    '    --worktree <native-ext4-path> [--base-url <https-url>] [--codex-profile-home <path>]',
    '',
    'Default/--all is credential-free static validation of every OpenRouter preset.',
    'Provider calls require --live. Exit: 0 passed · 4 blocked · 5 failed · 2 usage.',
  ].join('\n');
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

/** Parses static-all or explicit-live mode; no provider call is implicit. */
export function parseProviderCanaryArgs(
  args: readonly string[],
  cwd: string = Deno.cwd(),
): ProviderCanaryCliOptions {
  const values = new Map<string, string>();
  let live = false;
  let all = false;
  const valueFlags = new Set([
    '--profile',
    '--model',
    '--effort',
    '--worktree',
    '--base-url',
    '--codex-profile-home',
  ]);
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (flag === '--live') {
      if (live) throw new Error(usage());
      live = true;
      continue;
    }
    if (flag === '--all') {
      if (all) throw new Error(usage());
      all = true;
      continue;
    }
    if (!valueFlags.has(flag) || values.has(flag)) throw new Error(usage());
    const value = args[++index];
    if (!value || value.startsWith('--')) throw new Error(usage());
    values.set(flag, value);
  }
  if (!live) {
    if (
      [...values.keys()].some((flag) => flag !== '--worktree') ||
      values.has('--codex-profile-home')
    ) throw new Error(usage());
    return { mode: 'static', worktree: values.get('--worktree') ?? cwd };
  }
  if (all) throw new Error(usage());
  const selected = route(values);
  return {
    mode: 'live',
    route: selected,
    ...(values.has('--codex-profile-home')
      ? { codexProfileHome: values.get('--codex-profile-home') }
      : {}),
  };
}

async function main(): Promise<number> {
  if (Deno.args.includes('--help')) {
    console.log(usage());
    return 0;
  }
  try {
    const options = parseProviderCanaryArgs(Deno.args);
    if (options.mode === 'static') {
      const result = evaluateOpenRouterPresetCanaries(options.worktree);
      console.log(JSON.stringify(result));
      return result.status === 'passed' ? 0 : 5;
    }
    const home = options.codexProfileHome;
    const profile = home && options.route.profileId === 'codex-openrouter'
      ? {
        name: CODEX_OPENROUTER_PROFILE_NAME,
        home,
        path: `${home.replace(/\/$/, '')}/${CODEX_OPENROUTER_PROFILE_FILE}`,
      }
      : undefined;
    const result = await new ProviderCanaryAdapter().run(options.route, profile);
    console.log(JSON.stringify(result));
    return result.status === 'passed' ? 0 : result.status === 'blocked' ? 4 : 5;
  } catch (error) {
    console.error(error instanceof Error ? error.message : usage());
    return 2;
  }
}

if (import.meta.main) Deno.exit(await main());
