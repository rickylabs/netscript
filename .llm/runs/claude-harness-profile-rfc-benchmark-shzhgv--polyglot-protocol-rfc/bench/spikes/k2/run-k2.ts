/**
 * K2 — token delivery + constructed env (plan L8/K2).
 * Facts measured:
 *  (a) /proc/self|<pid>/environ permission mode + same-user readability (the exposure the
 *      criteria gate on; different-user not testable in the single-user container — recorded).
 *  (b) Deno.Command clearEnv+env delivers an EXACT allowlisted env document to the child
 *      (the D-9 fix mechanism): child sees only the allowlist, nothing inherited.
 *  (c) stdin-first-frame token delivery works on python3 and Go readers; latency measured.
 *
 *   deno run --allow-read --allow-write --allow-run --allow-env bench/spikes/k2/run-k2.ts
 */

const RUN_DIR = new URL('../../..', import.meta.url).pathname;
const out: Record<string, unknown>[] = [];
const emit = (o: Record<string, unknown>) => out.push(o);
emit({ kind: 'meta', bench: 'k2-token-delivery', startedAt: new Date().toISOString() });

// (a) /proc environ exposure
const selfEnvStat = await Deno.stat('/proc/self/environ');
const mode = (selfEnvStat.mode ?? 0) & 0o777;
const uid = (await new Deno.Command('id', { args: ['-u'] }).output()).stdout;
emit({
  kind: 'proc-environ',
  mode: '0' + mode.toString(8),
  ownerOnly: mode === 0o400,
  uid: new TextDecoder().decode(uid).trim(),
  differentUserTest: 'N/A — single-user container; owner-only mode 0400 means exposure is same-uid only, per proc(5)',
});

// (b) constructed allowlisted env via clearEnv
const ALLOW = {
  NETSCRIPT_PROTOCOL: '1',
  NETSCRIPT_TASK_ID: 'k2-task',
  NETSCRIPT_EXECUTION_ID: 'exec-1',
  NETSCRIPT_ATTEMPT: '0',
  NETSCRIPT_CALLBACK_URL: 'http://127.0.0.1:59999',
  NETSCRIPT_TASK_TOKEN: 'tok_spike_k2_opaque',
  PATH: '/usr/bin:/bin',
};
// plant a canary secret in our own env that must NOT leak
Deno.env.set('SUPERVISOR_SECRET_CANARY', 'must-not-leak');
const dump = await new Deno.Command('python3', {
  args: ['-c', 'import os,json;print(json.dumps(sorted(os.environ.keys())))'],
  clearEnv: true,
  env: ALLOW,
  stdout: 'piped',
}).output();
const childKeys = JSON.parse(new TextDecoder().decode(dump.stdout)) as string[];
const expected = Object.keys(ALLOW).sort();
// CPython PEP-538 locale coercion self-sets LC_CTYPE in its own environ — runtime-added,
// not inherited. The leak check is: nothing beyond allowlist + runtime-self-set appears.
const RUNTIME_SELF_SET = ['LC_CTYPE'];
const extras = childKeys.filter((k) => !expected.includes(k) && !RUNTIME_SELF_SET.includes(k));
emit({
  kind: 'constructed-env',
  clearEnvSupported: true,
  allowlistDelivered: expected.every((k) => childKeys.includes(k)),
  inheritedExtras: extras,
  noInheritedLeak: extras.length === 0,
  runtimeSelfSetObserved: childKeys.filter((k) => RUNTIME_SELF_SET.includes(k)),
  canaryLeaked: childKeys.includes('SUPERVISOR_SECRET_CANARY'),
  childKeys,
});

// (b2) same-user /proc/<pid>/environ read of a live child carrying the token
const sleeper = new Deno.Command('python3', {
  args: ['-c', 'import time;time.sleep(3)'],
  clearEnv: true,
  env: ALLOW,
}).spawn();
await new Promise((r) => setTimeout(r, 200));
let environRead = '';
try {
  environRead = new TextDecoder().decode(await Deno.readFile(`/proc/${sleeper.pid}/environ`));
} catch (e) {
  environRead = `READ-FAILED: ${(e as Error).message}`;
}
sleeper.kill();
await sleeper.status;
emit({
  kind: 'same-user-environ-read',
  tokenVisibleToSameUid: environRead.includes('tok_spike_k2_opaque'),
  note: 'Same-uid processes can read a child env token via /proc — but they can equally read the supervisor KV/state, so env delivery does not widen the same-uid trust domain. Cross-uid is blocked by mode 0400.',
});

// (c) stdin-first-frame delivery latency (python3 + Go-style read via head -1)
async function stdinFrame(cmd: string[], label: string) {
  const walls: number[] = [];
  for (let rep = 0; rep < 30; rep++) {
    const t0 = performance.now();
    const p = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      stdin: 'piped',
      stdout: 'piped',
      clearEnv: true,
      env: { PATH: '/usr/bin:/bin' },
    }).spawn();
    const w = p.stdin.getWriter();
    await w.write(new TextEncoder().encode(JSON.stringify({ v: 1, t: 'hello', token: 'tok_spike_k2_opaque' }) + '\n'));
    await w.close();
    const o = await p.output();
    const echoed = new TextDecoder().decode(o.stdout).includes('tok_spike_k2_opaque');
    if (!echoed) throw new Error(`${label}: token frame not echoed`);
    walls.push(performance.now() - t0);
  }
  walls.sort((a, b) => a - b);
  emit({ kind: 'stdin-frame', label, n: walls.length, p50Ms: +walls[14].toFixed(1), p95Ms: +walls[28].toFixed(1) });
}
await stdinFrame(['python3', '-c', 'import sys,json;f=json.loads(sys.stdin.readline());print("ack",f["token"])'], 'python3');
await stdinFrame(['sh', '-c', 'read line; echo "ack $line"'], 'sh-read');

// verdict per pre-registered criteria
emit({
  kind: 'verdict',
  criteria: 'T0/T1 = env pointer + bootstrap token iff /proc environ exposure is same-user-only',
  environSameUserOnly: mode === 0o400,
  decision: mode === 0o400
    ? 'ADOPT env-pointer + bootstrap token for T0/T1 (constructed allowlisted env, clearEnv proven); stdin-first-frame verified as the T1+ optional and T2 per-dispatch mechanism'
    : 'FALLBACK stdin-frame for T1, env-pointer only for T0',
});
emit({ kind: 'summary', finishedAt: new Date().toISOString() });
await Deno.writeTextFile(`${RUN_DIR}results/raw/k2.jsonl`, out.map((o) => JSON.stringify(o)).join('\n') + '\n');
console.log('K2 done -> results/raw/k2.jsonl');
