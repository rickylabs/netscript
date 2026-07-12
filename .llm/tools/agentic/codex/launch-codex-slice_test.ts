import { assert, assertEquals } from '@std/assert';
import { OPENROUTER_MODEL_IDS } from '../config/models.ts';
import { CODEX_OPENROUTER_PROFILE_NAME } from '../runtime/adapters/codex-profile-adapter.ts';
import { compareLaunchIdentity } from '../runtime/launch-route-identity.ts';
import { launcherExitCode, planLauncherProfile } from './launch-codex-slice.ts';

const requested = {
  provider: 'openrouter',
  model: OPENROUTER_MODEL_IDS.glm,
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
