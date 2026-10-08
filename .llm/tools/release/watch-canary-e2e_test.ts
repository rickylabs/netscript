import { assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join } from '@std/path';

const watch = fromFileUrl(new URL('./watch-canary-e2e.sh', import.meta.url));
const describe = fromFileUrl(new URL('./canary-failure-description.sh', import.meta.url));

async function observe(scenarios: string[]) {
  const dir = await Deno.makeTempDir();
  const id = String(crypto.getRandomValues(new Uint32Array(1))[0]);
  try {
    await Deno.writeTextFile(join(dir, 'scenarios'), scenarios.join('\n') + '\n');
    await Deno.writeTextFile(join(dir, 'calls'), '');
    await Deno.writeTextFile(join(dir, 'delays'), '');
    await Deno.writeTextFile(join(dir, 'output'), '');
    await Deno.writeTextFile(
      join(dir, 'gh'),
      `#!/usr/bin/env bash
set -eu
[[ "$1" == run && "$3" == "$EXPECTED_ID" ]] || exit 99
printf '%s\\n' "$*" >> "$CALLS"
index=0
[[ ! -f "$COUNTER" ]] || index="$(cat "$COUNTER")"
if [[ "$2" == watch ]]; then
  index=$((index+1)); printf '%s' "$index" > "$COUNTER"
elif [[ "$2" != view ]]; then
  exit 99
fi
IFS=, read -r watch_code view_code state conclusion < <(sed -n "\${index}p" "$SCENARIOS")
if [[ "$2" == watch ]]; then
  [[ "$watch_code" == 0 ]] || echo 'HTTP 504' >&2
  exit "$watch_code"
fi
if [[ "$view_code" != 0 ]]; then echo 'HTTP 504' >&2; exit "$view_code"; fi
printf '%s\\t%s\\n' "$state" "$conclusion"
`,
    );
    await Deno.writeTextFile(
      join(dir, 'sleep'),
      '#!/usr/bin/env bash\nprintf "%s\\n" "$1" >> "$DELAYS"\n',
    );
    await Deno.chmod(join(dir, 'gh'), 0o700);
    await Deno.chmod(join(dir, 'sleep'), 0o700);
    const result = await new Deno.Command('bash', {
      args: [watch, id],
      clearEnv: true,
      env: {
        PATH: `${dir}:${Deno.env.get('PATH')}`,
        EXPECTED_ID: id,
        CALLS: join(dir, 'calls'),
        COUNTER: join(dir, 'counter'),
        SCENARIOS: join(dir, 'scenarios'),
        DELAYS: join(dir, 'delays'),
        GITHUB_OUTPUT: join(dir, 'output'),
      },
    }).output();
    const calls = (await Deno.readTextFile(join(dir, 'calls'))).trim().split('\n');
    for (const call of calls) {
      const args = call.split(' ');
      assertEquals(args[0], 'run');
      assertEquals(['watch', 'view'].includes(args[1]), true, 'observation must never dispatch');
      assertEquals(args[2], id, 'every retry must observe the same immutable child');
    }
    return {
      code: result.code,
      calls,
      output: await Deno.readTextFile(join(dir, 'output')),
      delays: (await Deno.readTextFile(join(dir, 'delays'))).trim(),
    };
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

Deno.test('canary API 504 retries observation of the same child until terminal success', async () => {
  const result = await observe(['1,1,,', '1,0,in_progress,', '0,0,completed,success']);
  assertEquals(result.code, 0);
  assertEquals(result.output, 'state=success\nconclusion=success\n');
  assertEquals(result.calls.length, 6);
  assertEquals(result.delays, '1\n2');
});

Deno.test('observed canary terminal failures stop immediately and retain actual conclusion', async () => {
  for (
    const conclusion of [
      'failure',
      'cancelled',
      'timed_out',
      'skipped',
      'neutral',
      'action_required',
      'startup_failure',
      'stale',
    ]
  ) {
    const result = await observe([`1,0,completed,${conclusion}`]);
    assertEquals(result.code, 1);
    assertEquals(result.output, `state=failure\nconclusion=${conclusion}\n`);
    assertEquals(result.calls.length, 2);
    assertEquals(result.delays, '');
  }
});

Deno.test('exhausted canary observation fails closed as unknown without inventing child failure', async () => {
  const result = await observe(Array(5).fill('1,1,,'));
  assertEquals(result.code, 1);
  assertEquals(result.output, 'state=unknown\nconclusion=\n');
  assertEquals(result.calls.length, 10);
  assertEquals(result.delays, '1\n2\n4\n8');
});

Deno.test('successful watcher exit without a known terminal child verdict never grants green', async () => {
  for (
    const observation of ['in_progress,', 'completed,unrecognized', 'completed,success\tunexpected']
  ) {
    const result = await observe(Array(5).fill(`0,0,${observation}`));
    assertEquals(result.code, 1);
    assertEquals(result.output, 'state=unknown\nconclusion=\n');
  }
});

Deno.test('failed-pair descriptions distinguish actual conclusions from unknown observation', async () => {
  for (
    const [state, conclusion, expected] of [
      ['failure', 'failure', 'concluded failure'],
      ['failure', 'cancelled', 'concluded cancelled'],
      ['unknown', '', 'observation unknown'],
      ['success', '', 'observation unknown'],
      ['success', 'failure', 'observation unknown'],
      ['unknown', 'success', 'observation unknown'],
      ['failure', 'unrecognized', 'observation unknown'],
      ['', '', 'observation unknown'],
    ]
  ) {
    const result = await new Deno.Command('bash', {
      args: [describe],
      clearEnv: true,
      env: { E2E_STATE: state, E2E_CONCLUSION: conclusion },
    }).output();
    assertEquals(result.code, 0);
    assertStringIncludes(new TextDecoder().decode(result.stdout), expected);
  }
});

Deno.test('failed-pair description preserves confirmed E2E success after a later step fails', async () => {
  const expected = 'Canary publish complete; pinned production E2E succeeded; a later step failed';
  const result = await new Deno.Command('bash', {
    args: [describe],
    clearEnv: true,
    env: { E2E_STATE: 'success', E2E_CONCLUSION: 'success' },
  }).output();
  assertEquals(result.code, 0);
  assertEquals(new TextDecoder().decode(result.stdout), `${expected}\n`);
  assertEquals(expected.length <= 140, true, 'GitHub status descriptions must fit 140 characters');
});
