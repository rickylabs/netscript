use harness

## SKILL

Load `netscript-harness`, `netscript-doctrine`, `netscript-cli`, `netscript-tools`,
`netscript-deno-toolchain`, `netscript-pr`, and `rtk`. Read `.llm/harness/gates/implementation-gate.md`.

# Brief — #1371 emitted fail-fast for declared background references

## Standing

Worktree `/home/codex/repos/netscript-007-leaf-1371`, branch
`fix/aspire-declared-reference-fail-fast`, base **`3b32d1628584749af4dd6e97fd331c24e84f0b9e`** (main).

PLAN-EVAL is **N/A** — this is a bounded correction with an admitted design, not a decision-heavy
plan. Your work is reviewed by a fresh internals Tier-A and then by an **independent IMPL-EVAL** in
a separate opposite-family session. You do not issue your own verdict.

## What was verified, so you do not re-litigate it

A verification run on the published canary `0.0.7-canary.1` (issue #1371 comment `5462080110`)
established, with runtime evidence:

- `ServiceReferences` **are** injected — the wave-6 "parsed but never injected" claim is refuted.
- Aspire exports the **raw** resource name, hyphens verbatim: `services__workers-api__http__0`. The
  emitted key, the Aspire-exported key, and the key `packages/sdk/src/discovery/service-url.ts:55-61`
  reads are the same string. **Do not change key shape. Do not normalize anything.**
- The one real gap: a **declared but unresolvable** reference is silently dropped — no env var, no
  log line, no failure. The child starts and reports healthy while a declared dependency is absent.

## The admitted contract — implement exactly this

**Emitted fail-fast.** In the emitted AppHost helper, for every **declared** entry of
`ServiceReferences` and `PluginReferences`:

- if `_services.get(ref)` / `_plugins.get(ref)` is absent, **or** its `http` endpoint cannot
  resolve, **throw a deterministic configuration error**;
- the error message names the **background processor**, the **reference kind** (service vs plugin),
  and the **reference name**;
- the throw occurs **before that processor is registered** — a misconfigured processor must never
  reach a running state;
- on the resolvable path, behaviour is unchanged: `await <id>.withEnvironment('services__<ref>__http__0', <ref>Endpoint)`.

Deterministic means: same inputs produce the same message, with no timestamps, no ordering
dependence, and no interpolated object identity. The message is asserted by tests, so it is part of
the contract.

## Exact surface

Primary: `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts`

At base, the service block emits the silent guard around `:185-197`, and the `PluginReferences`
block repeats the identical pattern immediately below. **Both** must be corrected — the gap is not
service-specific.

Tests: `packages/cli/src/kernel/templates/aspire/helpers/tests/` — follow the existing
`generate-register-infrastructure_test.ts` for placement and style.

`packages/cli/src/kernel/assets/generated/aspire/helpers/generate-register-background-1.ts.template`
is a **slotted scaffold**, not a snapshot of the per-reference emission, so it is not expected to
change. Verify that rather than assume it: if `deno task check:assets-barrel` goes red, regenerate
canonically with `deno task gen:assets-barrel` and never hand-edit generated output.

Anything beyond these is a **rescope stop**: report, do not widen.

## Required tests — RED first, boxes 4 and 6 together

Write the failing tests first and record their RED output in your worklog before implementing.

**Box 4 — the key cannot drift.** Pin the emitted env key exactly, for both reference kinds and for
a **hyphenated** reference name (`workers-api`): the emitted string must be
`services__workers-api__http__0`, hyphens preserved. Assert against the *consumer-read* shape too,
so the emitted key and the read key are pinned in one place and cannot drift apart silently — that
is the whole point of the box.

**Box 6 — unresolved is visibly fatal.** Focused runtime-style tests over the **emitted module**:
build the emitted helper text, load it, and drive `registerBackgroundProcessors` with stub
`_services` / `_plugins` maps.

- resolvable service reference → env var set, no throw
- resolvable plugin reference → env var set, no throw
- **missing** service reference → throws, message names processor + kind + name
- **missing** plugin reference → throws, message names processor + kind + name
- reference present in the map but whose `http` endpoint does not resolve → throws the same way
- the throw happens **before** the processor is added to the returned map

Keep the positive cases; do not replace them with negative ones.

## Gates — static only

**No runtime lease is granted.** `scaffold.runtime`, `e2e:cli`, Aspire, Docker, browser/Playwright
are unavailable and must not be requested or attempted. Keep Docker and Aspire empty.

Run, through the structured wrappers rather than raw CLI:

- focused test over your new/changed test files, and focused `check` over the changed files
- `deno task check`, `deno task test`
- `deno task lint`, `deno task fmt:check`
- `deno task quality:scan` — **`allowCount` must stay 7**; no new allowance, inline ignore, or rule weakening
- `deno task arch:check`
- `deno task check:assets-barrel`
- CLI publish dry run and per-member CLI JSR audit — disclose the existing WARN baseline as
  baseline, never as warning-free

## Delivery

1. Commit in slices with the RED-first evidence visible in the history.
2. **Atomic clean explicit push** to `fix/aspire-declared-reference-fail-fast`; local == remote.
3. Open a **draft PR** against `main` with `Closes #1371` in the body, labels
   `type:fix`, `area:cli`, `area:aspire`, `priority:p1`, exactly one `status:` label
   (`status:impl`), milestone `0.0.7`. Include a Definition-of-Done checklist and record that
   `scaffold.runtime`/`e2e:cli`/Aspire/Docker are N/A with no runtime lease.
4. **Every receipt must be produced at the final pushed head**, not an intermediate commit. State
   the exact 40-character SHA in your handoff.
5. Record drift honestly. If the emitted-module test cannot be built without a seventh file, if
   `check:assets-barrel` moves, or if the fail-fast breaks an existing consumer expectation — stop
   and report rather than absorbing it.

## Bounds

- **Background registration only.** Do not touch apps or plugins registration, `#1365`, the browser
  `build-vite-env-var-name.ts` normalization, or `packages/sdk` discovery.
- Do not merge, flip `status:ready-merge`, mark the PR ready for review, close #1371, publish, or
  take a runtime lease. Marking the PR ready is this repo's IMPL-EVAL dispatch trigger — leave it
  draft.
- Do not issue an evaluator verdict; an independent opposite-family IMPL-EVAL follows your push.
