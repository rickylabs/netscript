# IMPL-EVAL — release-blocking harness hardening (#1087, #1084, #1080, #1083)

- Evaluator session: Claude Code + OpenRouter / `qwen/qwen3.7-max` / high
- Run: `fix-1087-harness-hardening--release-blockers`
- Branch: `fix/1087-harness-hardening`
- Baseline: `4833a1676f672aa3e4cf970d05afbcf17a57629b` from `origin/main`, 2026-08-03
- Surface / archetype: 6 — CLI / Tooling
- Scope overlays: docs (for #1083 release intro and harness guidance)
- Date: 2026-08-03

## Verdict: PASS

## Severity-ordered findings

None release-blocking. Two informational notes follow the boundary assessment.

## Boundary assessment

### 1. #1087 cost safety — PASS

The formal evaluator launch route remains open-model-only, and the spawned evaluator environment
enforces `OPEN_EVALUATOR_MODEL_IDS` at every model-bearing child request. A prohibited or missing
model produces 403, credential-blind model+requesting-session audit, process termination/escalation,
and non-zero exit. The Gemini documentation-authoring generator lane remains rejected. Ordinary
Claude routes are not accidentally changed.

**Evidence inspected:**

- `evaluator-model-guard.ts`: loopback `Deno.serve` proxy substitutes `ANTHROPIC_BASE_URL` in the
  spawned evaluator environment. Every model-bearing POST request is checked against
  `OPEN_EVALUATOR_MODEL_IDS` (imported from `config/models.ts`, the single authority). Denied models
  return 403 before any upstream forward. The audit event carries only event name, model (or
  `<missing>`), requesting session, and timestamp — no headers, body, or credentials. The abort
  callback runs before the audit write (remediation finding 2), so the violation flag, kill, and
  exit 78 hold even when the durable write fails.
- `claude-print.ts`: spawns Claude with `ANTHROPIC_BASE_URL: guard.baseUrl` when
  `enforceOpenEvaluatorModels` is true. The guard is activated only when
  `matchOpenRouterPreset(route)?.purpose === 'evaluation'` (`claude-adapter.ts:157`), which requires
  exact profile+model+effort match. SIGTERM is sent on violation with a 1-second SIGKILL escalation
  timer (remediation finding 1); the timer is cleared in `finally`. Exit code is overridden to
  `EVALUATOR_MODEL_GUARD_EXIT_CODE` (78) even if the child exits 0 after receiving the denial.
- `claude-adapter.ts`: the `--allow-write` and `--allow-net` flags are scoped and conditional on
  `enforceOpenEvaluatorModels` (remediation finding 3). The `--session-id` flag is conditional on
  the same flag (remediation finding 4). Ordinary presets receive neither the guard nor the extra
  permissions.
- `config/models.ts`: `OPEN_EVALUATOR_MODEL_IDS` is the single typed authority, containing only
  `minimax/minimax-m3` and `qwen/qwen3.7-max`. No other model list exists.
- `routing-policy.ts`: `formalEvaluatorRoute` validates only the launched route and rejects paid
  closed-model routes. The Gemini rejection test remains intact (reviewer reproduced it).
- `evaluator-model-guard_test.ts`: covers approved forward, prohibited reject+audit+abort,
  missing-model fail-closed, audit-write-failure abort, and audit-path traversal prevention.
- `runner-provider-profiles_test.ts`: new test
  `formal evaluator routes alone receive the child-model request guard` proves the GLM design route
  does not carry the guard.
- `claude-print_test.ts`: new tests prove launch identity assignment and ordinary-launch behavior
  preservation.
- Remediation pass resolved all six reviewer findings (SIGKILL escalation, audit-before-abort
  ordering, scoped permissions, conditional session-id, preset-keyed attach, raw session-id
  sanitization).
- Tests: 50 focused, 332 complete suite, scoped check/lint/fmt all green.
- README (`.llm/tools/agentic/README.md:288-292`) documents the child-surface policy as
  configuration, not prompt guidance.

**Gemini lane rejection verified:** The
`formal evaluator rejects the Gemini documentation-authoring generator lane` test passes (reviewer
reproduced it). The Gemini preset has `purpose: 'design'`, not `'evaluation'`, so it does not
receive the guard and is not a formal-evaluator route.

**Ordinary routes unchanged:** The enforce flag is emitted only for `purpose === 'evaluation'`; the
new test proves the GLM design route does not carry it. The `--session-id` argv addition is
conditional on `enforceOpenEvaluatorModels`, so ordinary launches retain the implicit fresh-session
argv (test-covered).

### 2. #1084 publication ownership — PASS

`agentic:gh-pr` stages every body into a collision-free invocation/session directory, records
owner+digest metadata, verifies exact ownership and bytes immediately before payload construction,
and rejects cross-session, tampered, reused, or inherited unsafe artifacts. Active guidance no
longer advertises shared publication filenames.

**Evidence inspected:**

- `publication-body.ts`: stages to `.llm/tmp/agentic/gh-pr/<uuid>/body.md` with `createNew: true`,
  0600 mode, 0700 directory mode. The root is tightened to 0700 on every staging call (remediation
  finding L2). Metadata records `ownerSession`, `fingerprint` (SHA-256), `schemaVersion`,
  `bodyFile`.
- `readOwnedPublicationBody`: re-reads from disk, verifies session identity (artifact + metadata
  `ownerSession`), and double SHA-256 match (in-memory artifact fingerprint AND on-disk metadata
  fingerprint). Cross-session reuse, metadata owner swap, and body swap each throw before any
  `githubRequest`.
- `gh-pr.ts`: calls `stagePublicationBody(suppliedBody, crypto.randomUUID())` then
  `readOwnedPublicationBody(artifact, publicationSession)` immediately before
  `buildPullRequestBody`. The payload body comes exclusively from the verified re-read.
- `publication-body_test.ts`: covers concurrent collision-free paths, cross-session rejection,
  body+metadata tamper rejection, session-directory reuse refusal, and pre-existing root mode
  tightening.
- `deno.json`: adds `--allow-write=.llm/tmp/agentic/gh-pr` to the `agentic:gh-pr` task — correctly
  scoped to the staging root.
- `seed-run.md:136-139`: now mandates `.llm/tmp/<run-id>/<session-id>/...` scratch, explicitly
  forbids workspace-shared filenames, and preserves durable reviewed run-dir bodies.
- `README.md:210-221`: documents the staging/verification pipeline.
- Active guidance grep: the only remaining `pr-body.md` reference is the seed-run template path
  `.llm/tmp/<run-id>/<session-id>/pr-body.md` which is the intended per-session pattern, not a
  shared filename. The reviewer's I1 note about `netscript-release/SKILL.md:32` mentioning
  `--body-file` is informational — it names no shared filename.
- Tests: 5 focused (8 in wider compat set), 337 complete suite, scoped check/lint/fmt all green.
- Dry-run stays network- and token-free and redacts the body (`payload.body` printed as
  `<N chars>`).

### 3. #1080 Redis execution — PASS

Hosted CI provisions healthy Redis and sets the required URL; the gate fails closed without it;
observes both exact real-Redis test names with `ok`; the permanent negative control mechanically
removes only #1075 serialization, requires each exact regression to report `FAILED`, restores
source, and cannot pass from an unrelated error.

**Evidence inspected:**

- `.github/workflows/ci.yml`: `check-test` declares a `redis:7-alpine` service with a
  `redis-cli ping` health check (interval 5s, 10 retries) and job-level
  `NETSCRIPT_TEST_REDIS_URL: redis://127.0.0.1:6379`. Steps order: check → required gate → negative
  control → repo-wide test (a SIGKILL'd negative control would leave a broken adapter that makes the
  later repo-wide test red, never green — fail-safe direction).
- `redis-regression-gate.ts`: `requireRedisRegressionUrl` throws before any test launch when the env
  var is missing or uses a non-Redis protocol. The gate requires exit success AND a per-line
  observation of each exact test name with `ok`. The two constants match the `Deno.test` names
  verbatim; neither name contains the substring `ok`, so the line match cannot be satisfied
  spuriously.
- Negative control: `removeRedisAtomicSerialization` removes exactly the #1075 `atomicTail` field
  and the serialization wrapper via `replaceExactlyOnce`, which throws if the source has drifted (0
  or >1 matches). Each file is run individually and its own named test must report `FAILED`.
  Restoration is in `finally`, covering thrown paths inside the process. The task restricts writes
  to `--allow-write=packages/kv/adapters/redis.adapter.ts` only.
- `REDIS_REGRESSIONS` paired-record structure (remediation of reviewer Info finding) prevents
  file↔name drift by independent reordering.
- The negative control requires the _named_ test to report `FAILED` — an unrelated failure cannot
  satisfy it. The required gate additionally requires overall exit 0, so an unrelated failure cannot
  pass it either.
- `atomicTail` field confirmed present in the current source at
  `packages/kv/adapters/redis.adapter.ts:75,451,453` — the exact locations expected by the negative
  control.
- Hosted CI evidence (run `30808236575`, job `91668504084`) recorded in worklog: healthy Redis, both
  exact tests `ok`, both `FAILED` under pre-fix behavior with 16 winners vs 1, outer negative
  control PASS. I cannot independently verify the hosted CI run from this evaluator session, but the
  mechanics are verified by code inspection and the reviewer's independent reproduction of the
  fail-closed behavior.
- `redis-regression-gate_test.ts`: covers fail-closed env check, exact source mutation, and drift
  refusal.
- Tests: 3 focused, 151 affected package suite, scoped check/lint/fmt all green.

### 4. #1083 release note — PASS

The tracked 0.0.4 `--notes-file` intro has an explicit Breaking Changes entry naming
`ServiceStreamProducerOptions.assertResolvable`, tells consumers to remove it, and states fail-fast
startup resolution behavior. No live docs/generated/source residue remains; historical run evidence
need not be rewritten. No release was published.

**Evidence inspected:**

- `release-notes-0.0.4-intro.md`: opens with `## Breaking Changes` and names
  `ServiceStreamProducerOptions.assertResolvable` on `@netscript/plugin-streams-core` exactly.
  Instructs consumers to remove the option, states "there is no replacement flag", and describes the
  fail-fast-at-startup replacement behavior.
- Wording remediated from "no reachable streams URL is configured" to "no streams URL can be
  resolved" per reviewer feedback — this is more accurate (the construction-time check is
  configuration/discovery resolution, not a network reachability probe).
- Independent `grep -rn assertResolvable` across the repo (excluding `.git`, `node_modules`,
  `.llm/runs`) returned zero matches — no live residue in `packages/`, `plugins/`, `docs/`, root
  README, root configuration, or generated surfaces.
- The `release:publish` task was not invoked — confirmed by the worklog and the absence of a
  published release.
- The release parser `notes-file` contract test passed.
- The intro is a valid `--notes-file` input for `github-release.ts`, which requires
  `--notes-file <path>` or `--message` and composes the file content as the `intro` section ahead of
  generated `## What's Changed` and `## Closed Issues` sections.
- Reviewer verified against code: `DurableStreamProducer` construction calls
  `resolveRequiredStreamUrl` and throws when the streams URL does not resolve;
  `ServiceStreamProducerOptions` is now a bare alias of `DurableStreamProducerOptions` with no
  `assertResolvable` member.

### 5. Process/gates — PASS

**Evidence inspected:**

- **Commit trail:** 7 commits total: `45fe70010` (plan lock), `410b90e87` (plan approved),
  `2f3e49456` (#1087), `3f3cc6cb8` (#1084), `1921a106c` (#1080), `5efcaf770` (hosted mixed-type
  remediation — `setTimeout` typing portability), `e7dabae7d` (#1083). The commits map exactly to
  the claimed issue-to-commit relationship, in issue priority order as planned.
- **PLAN-EVAL:** PASS in separate session (`e52d58f7-9130-4c7b-af67-2e975edcb1e5`) before
  implementation. The `plan-eval.md` is present with checklist results and spot-check verification
  of load-bearing findings.
- **Opposite-family reviews:** Each of the 4 slices has a separate Claude (Fable 5) reviewer
  session, with findings and remediation verification. All returned PASS after remediation. Reviewer
  sessions recorded: `7a34e115` (#1087), `064bce5b` (#1084), `d49c38bc` (#1080), `0512c736` (#1083).
  Remediation continuations recorded and verified.
- **Root check:** `deno task check` — 2526 files, 22 batches, 0 findings (worklog claim;
  author-reported).
- **Full agentic guards:** 337 passed, 0 failed (worklog claim; author-reported, reviewer
  independently reproduced 332 for #1087 and the focused sets for each slice).
- **Full-repository tests:** 2548 passed (564 steps), 0 failed, 16 ignored in 5m10s (worklog claim,
  after timer remediation; author-reported).
- **Scoped lint/fmt:** Each slice has scoped check/lint/fmt evidence from both author and reviewer.
  The reviewer independently reproduced scoped wrappers for each slice.
- **Lock/source hygiene:** `deno.lock` untouched across all diffs (confirmed by my diff inspection).
  No source churn outside the planned scope.
- **Close-gate:** Referenced in worklog as hosted run `30808935212`, both `success`. I cannot
  independently verify this from the evaluator session, but the worklog records it with a specific
  run ID and the harness protocol requires it.
- **Review-thread gate:** Same hosted run, referenced as `success`. I cannot independently verify
  this from the evaluator session.
- **Hosted CI remediation:** `5efcaf770` changed `setTimeout` typing to
  `ReturnType<typeof setTimeout>` for cross-platform portability — this is a minimal, correct fix
  (one line changed).
- **Drift log:** Three significant drift entries recorded (owner-assigned supervisor, bootstrap
  evaluator Agent deny, #1087 review route reclassification). All are justified and documented.
- **Supervisor sign-off:** Each slice has a supervisor sign-off entry in the worklog before commit,
  consistent with the slice review gate (A1 invariant).

## Informational notes

1. **Hosted evidence reliance:** The close-gate, review-thread gate, and hosted CI run evidence (run
   `30808236575`, job `91668504084` for #1080; run `30808935212` for close-gate/review-thread) are
   author-reported and cannot be independently verified from this evaluator session. However, the
   mechanics are verified by code inspection, the reviewer's independent reproduction of focused
   suites, and the harness protocol's requirement for evidence-backed acceptance ticks. The worklog
   records specific run IDs consistent with the harness protocol.

2. **IMPL-EVAL timing:** The worklog's last entry records "Remaining implementation gate: separate
   IMPL-EVAL `NOT_RUN`; final hosted `check-test` in progress." This IMPL-EVAL is the current
   evaluation pass. The full-repository test count (2548 passed) and root check (2526 files) are
   author-reported; the reviewer independently reproduced the focused suites and scoped wrappers but
   not the full repo suite. This is acceptable for the evaluator protocol, which requires evidence
   inspection rather than full independent reproduction of every gate.

## Checks/evidence independently inspected

- Read harness skill, evaluator protocol, plan, worklog, supervisor identity, drift log, context
  pack, plan-eval verdict.
- Inspected full diff stat from baseline to HEAD and per-commit diff stats.
- Read `evaluator-model-guard.ts`, `evaluator-model-guard_test.ts`, `claude-print.ts`,
  `claude-print_test.ts`, `claude-adapter.ts` diff, `runner-provider-profiles_test.ts` diff,
  `config/models.ts`, `config/endpoints.ts` diff, `README.md` diff.
- Read `publication-body.ts`, `publication-body_test.ts`, `gh-pr.ts`, `deno.json` diff,
  `seed-run.md` diff.
- Read `redis-regression-gate.ts`, `redis-regression-gate_test.ts`, `.github/workflows/ci.yml` diff.
- Read `release-notes-0.0.4-intro.md`, `review-1087.md`, `review-1084.md`, `review-1080.md`,
  `review-1083.md`.
- Verified `matchOpenRouterPreset` exists and checks exact profile+model+effort match.
- Verified `purpose: 'evaluation'` tag in provider profiles.
- Verified `formalEvaluatorRoute` in routing policy.
- Independently grepped for `assertResolvable` live residue — zero matches outside `.llm/runs/`.
- Independently verified `atomicTail` field presence in Redis adapter at expected locations.
- Independently verified active guidance for shared publication filename — only per-session pattern
  remains.
- Verified commit-to-issue mapping and commit ordering.
- Verified lock hygiene (no `deno.lock` changes in any diff).

## Conclusion

All five release-blocking boundaries are met. The implementation is thorough, well-tested,
well-reviewed, and follows the harness protocol. The evidence is extensive and internally
consistent. No release-blocking or required remediation remains. The two informational notes (hosted
evidence reliance and IMPL-EVAL timing) are acceptable within the evaluator protocol's evidence
standard.

**Verdict: PASS**
