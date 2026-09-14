import { assert, assertEquals } from '@std/assert';
import { OPENROUTER_MODEL_IDS } from '../config/models.ts';
import { CODEX_OPENROUTER_PROFILE_NAME } from '../runtime/adapters/codex-profile-adapter.ts';
import { compareLaunchIdentity } from '../runtime/launch-route-identity.ts';
import { newSenderOwnershipRecord } from '../runtime/sender-ownership.ts';
import { existingSenderLaunchBlocker, clientCliPath } from './launch-codex-slice.ts';
import { launcherExitCode, planLauncherProfile } from './launcher-route.ts';

const requested = {
  provider: 'openrouter',
  model: OPENROUTER_MODEL_IDS.designGlm,
  effort: 'xhigh',
} as const;

Deno.test('OpenRouter launcher materializes supported named and app-server configs', () => {
  const plan = planLauncherProfile(requested, {
    profile: CODEX_OPENROUTER_PROFILE_NAME,
    profileHome: '/home/codex/.cache/netscript-openrouter-test',
    worktree: '/home/codex/repos/worktree',
  });
  assert(plan);
  assertEquals(plan.namedPath, `${plan.home}/${CODEX_OPENROUTER_PROFILE_NAME}.config.toml`);
  assertEquals(plan.appServerPath, `${plan.home}/config.toml`);
  assert(plan.content.includes('wire_api = "responses"'));
  assert(!plan.content.includes('wire_api = "chat"'));
  assert(!plan.content.includes('[profiles.'));
});

Deno.test('OpenRouter launcher rejects arbitrary profile names and non-native homes', () => {
  for (
    const options of [
      {
        profile: 'legacy-profile',
        profileHome: '/home/codex/.cache/profile',
        worktree: '/home/codex/repos/worktree',
      },
      {
        profile: CODEX_OPENROUTER_PROFILE_NAME,
        profileHome: '/tmp/profile',
        worktree: '/home/codex/repos/worktree',
      },
    ]
  ) {
    let rejected = false;
    try {
      planLauncherProfile(requested, options);
    } catch {
      rejected = true;
    }
    assert(rejected);
  }
});

Deno.test('native app-server launches reject rather than silently ignore named profiles', () => {
  let rejected = false;
  try {
    planLauncherProfile({ ...requested, provider: 'openai' }, {
      profile: CODEX_OPENROUTER_PROFILE_NAME,
      profileHome: '/home/codex/.cache/profile',
      worktree: '/home/codex/repos/worktree',
    });
  } catch {
    rejected = true;
  }
  assert(rejected);
});

Deno.test('successful sends stay successful without identity but route mismatches fail closed', () => {
  const pending = compareLaunchIdentity(requested, {
    provider: null,
    model: null,
    effort: null,
  });
  assertEquals(launcherExitCode(0, pending, false), 0);
  assertEquals(launcherExitCode(1, pending, false), 1);
  const mismatch = compareLaunchIdentity(requested, {
    provider: 'openrouter',
    model: requested.model,
    effort: 'low',
  });
  assertEquals(launcherExitCode(0, mismatch, false), 1);
  assertEquals(launcherExitCode(0, mismatch, true), 0);
});

Deno.test('launcher distinguishes repair-required ownership without evicting it', () => {
  const worktree = '/home/codex/repos/worktree';
  const record = newSenderOwnershipRecord({
    worktree,
    ownerPid: 93,
    leaseToken: 'stale-lease',
    now: '2026-07-10T20:00:00.000Z',
    profileHome: '/home/codex/.codex',
  });
  const blocker = existingSenderLaunchBlocker(worktree, {
    record,
    ownerProcessAlive: false,
    sessionActive: false,
  });
  assertEquals(blocker?.code, 'duplicate_sender_risk');
  assertEquals(blocker?.ownershipKind, 'repair-required');
  assertEquals(blocker?.ownershipReason, 'owner_inactive');
  assertEquals(
    blocker?.operatorAction,
    `run deno task agentic:runtime repair sender-lease --worktree ${worktree}`,
  );

  const foreign = existingSenderLaunchBlocker('/home/codex/repos/other', {
    record,
    ownerProcessAlive: false,
    sessionActive: false,
  });
  assertEquals(foreign?.code, 'ownership_conflict');
  assertEquals(foreign?.ownershipKind, 'blocked');
  assertEquals(foreign?.ownershipReason, 'ownership_conflict');
  assertEquals(
    foreign?.operatorAction,
    'run deno task agentic:runtime repair sender-lease --worktree /home/codex/repos/other',
  );
});

Deno.test('clientCliPath resolves beside the launcher, not inside the target worktree', () => {
  // The launcher is routinely pointed at worktrees that are NOT netscript
  // checkouts — another repository's slice worktree has no `.llm/tools`. The
  // client ships with the launcher, so its path must come from the launcher's
  // own module URL. Previously it was built from `--worktree`, and every safety
  // check passed before the launch died on a missing file.
  const resolved = clientCliPath('file:///opt/netscript/.llm/tools/agentic/codex/launch-codex-slice.ts');
  assertEquals(resolved, '/opt/netscript/.llm/tools/agentic/codex/app-server-message-cli.ts');
  assert(!resolved.includes('worktree'), 'must not be derived from the target worktree');
});
