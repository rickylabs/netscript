/** Route/profile planning and evidence rendering for the compatibility launcher. */

import { sq, type ThreadInfo, wsl } from '../lib/agentic-lib.ts';
import {
  compareLaunchIdentity,
  type LaunchIdentityEvidence,
  type RequestedLaunchIdentity,
} from '../runtime/launch-route-identity.ts';
import {
  CODEX_OPENROUTER_PROFILE_FILE,
  CODEX_OPENROUTER_PROFILE_NAME,
  renderCodexOpenRouterProfile,
} from '../runtime/adapters/codex-profile-adapter.ts';

export interface LauncherProfilePlan {
  readonly home: string;
  readonly name: string;
  readonly namedPath: string;
  readonly appServerPath: string;
  readonly content: string;
}

export interface LauncherThreadRecordOptions {
  readonly slug?: string;
  readonly worktree?: string;
  readonly branch?: string;
  readonly expectBase?: string;
}

/** Plans the isolated named profile and equivalent app-server base config. */
export function planLauncherProfile(
  requested: RequestedLaunchIdentity,
  options: Readonly<{
    profile?: string;
    profileHome?: string;
    worktree?: string;
  }>,
): LauncherProfilePlan | null {
  if (requested.provider !== 'openrouter') {
    if (options.profile || options.profileHome) {
      throw new Error('named launcher profiles are supported only for the Codex OpenRouter route');
    }
    return null;
  }
  if (
    options.profile !== CODEX_OPENROUTER_PROFILE_NAME ||
    !options.profileHome?.startsWith('/home/') || !options.worktree
  ) {
    throw new Error(
      `OpenRouter launches require --profile ${CODEX_OPENROUTER_PROFILE_NAME} and a native /home profile directory`,
    );
  }
  const home = options.profileHome.replace(/\/$/, '');
  const content = renderCodexOpenRouterProfile({
    agent: 'codex',
    provider: 'openrouter',
    profileId: 'codex-openrouter',
    model: requested.model,
    effort: requested.effort,
    worktree: options.worktree,
    mobileRequired: false,
  });
  if (!content) throw new Error('OpenRouter profile could not be rendered');
  return {
    home,
    name: options.profile,
    namedPath: `${home}/${CODEX_OPENROUTER_PROFILE_FILE}`,
    // app-server does not accept top-level --profile. Its isolated CODEX_HOME
    // therefore consumes the exact same supported profile as base config.
    appServerPath: `${home}/config.toml`,
    content,
  };
}

/** Materializes only credential-free profile content with private modes. */
export async function materializeLauncherProfile(
  user: string,
  plan: LauncherProfilePlan,
): Promise<boolean> {
  const encoded = new TextEncoder().encode(plan.content).toBase64();
  const result = await wsl(
    user,
    `install -d -m 700 ${sq(plan.home)} && ` +
      `printf %s ${sq(encoded)} | base64 -d > ${sq(plan.namedPath)} && ` +
      `cp ${sq(plan.namedPath)} ${sq(plan.appServerPath)} && ` +
      `chmod 600 ${sq(plan.namedPath)} ${sq(plan.appServerPath)}`,
  );
  return result.code === 0;
}

/** Keeps successful process outcome truthful while still failing route mismatches. */
export function launcherExitCode(
  processCode: number,
  evidence: LaunchIdentityEvidence,
  allowRouteMismatch: boolean,
): number {
  if (processCode !== 0) return 1;
  if (evidence.status === 'mismatch' && !allowRouteMismatch) return 1;
  return 0;
}

/** Renders the durable, secret-free thread and route identity record. */
export function renderThreadRecord(
  options: LauncherThreadRecordOptions,
  info: ThreadInfo,
  dest: string,
  requested: RequestedLaunchIdentity,
): string {
  const evidence = compareLaunchIdentity(requested, {
    provider: info.provider,
    model: info.model,
    effort: info.effort,
  });
  return [
    `# ${options.slug ?? 'slice'} — Codex implementation thread`,
    '',
    `- **Thread / session id:** \`${info.threadId ?? 'UNKNOWN'}\``,
    info.rollout ? `- **Rollout:** \`${info.rollout}\`` : '',
    `- **Worktree:** \`${options.worktree}\``,
    `- **Branch:** \`${options.branch}\`${
      options.expectBase ? ` @ \`${options.expectBase}\`` : ''
    } (NO upstream by design).`,
    `- **Push rule:** explicit refspec only — \`git push origin HEAD:refs/heads/${options.branch}\`.`,
    `- **Requested route:** provider=${requested.provider} · model=${requested.model} · effort=${requested.effort}`,
    `- **Observed route:** provider=${info.provider ?? 'pending'} · model=${
      info.model ?? 'pending'
    } · effort=${info.effort?.toLowerCase() ?? 'pending'}`,
    `- **Route verdict:** ${evidence.status}${
      evidence.mismatches.length ? ` (${evidence.mismatches.join(', ')})` : ''
    }`,
    '- **Runtime:** approval=never · sandbox=dangerFullAccess',
    `- **Brief (staged):** \`${dest}\``,
    '',
    '## Steering (same thread — never a second send-message-v2 at this worktree)',
    '```bash',
    `codex exec resume ${info.threadId ?? '<thread-id>'} -- "<follow-up>"`,
    '```',
    '',
    '_Written by `.llm/tools/agentic/codex/launch-codex-slice.ts`._',
    '',
  ].filter((line) => line !== '').join('\n');
}
