# chore(quality): `quality:scan` cannot see an `any` in an exported type, an unbudgeted allowance, or a docs snippet — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T6-01 · **Proposed milestone:** 0.0.6 · **Labels:** `type:chore` `area:tooling`
`area:packages` `area:docs` `priority:p1` `status:triage` · **Depends on:** none (Part of #1278 —
this is Inventory C filed as its own trackable child)

## Summary

#1278 Inventory C asks for a fail-closed gate on new `as any` / `as unknown as` / `@ts-ignore`
"outside an allowlist that requires a linked issue id", covering docs snippets and not only source.
None of those three properties exists today. `quality:scan` is a line-regex scanner whose
`explicit-any` rule cannot distinguish an exported type from a local one, whose `quality-allow:`
suppression accepts any free-text reason with no issue id and no budget, and whose file filter never
opens a Markdown file. The type-soundness selling point is therefore defended by a gate that a
single trailing comment disables. Now: #1278 is milestoned 0.0.6 and its other inventories are
nearly discharged (see Evidence), so the guard rail is the remaining durable value.

## Evidence

Executed at baseline `fac9e339042c` on 2026-08-08; corpus refs
`research/repo-audit/web-layer.md` §11, `research/github-board-open.md` §6.4 (#1278 Inventory C/D,
#1276 tranche T6).

- **Scope.** `.llm/tools/quality/scan-code-quality.ts:18` — `DEFAULT_ROOTS =
  ['packages/cli/src', 'plugins']`. `deno.json:50-52` defines `quality:scan` (defaults),
  `quality:scan:repo` (`--root packages --root plugins`), `quality:gate`.
  **Corpus correction:** #1276 T6 states `quality:scan` "covers `packages/cli/src` + `plugins`
  only". That is true of the *default* task; `quality:scan:repo` already covers all of
  `packages/` + `plugins/` and runs on push-to-main and a Monday 07:17 UTC cron
  (`.github/workflows/code-quality.yml:50-59`). The PR gate scans only changed files
  (`code-quality.yml:36-42`). Root scope is **not** the gap; rule power and suppression discipline
  are.
- **Exported types are invisible.** `scan-code-quality.ts:51` — `explicit-any` is
  `/(?:<|:\s*)any(?:\s*[,>;)\]}]|\b)/` against a raw line. It has no notion of `export`.
- **A rule that does know about exports exists and never fails.**
  `.llm/tools/fitness/check-doctrine.ts:467-484` emits `A1/F-5: 'any' in exported declaration` — but
  at `WARN` level only, matching only `export function` / `export type` / `export interface` line
  starts (not `export const`, class members, generic defaults, or re-exports), and only under the
  16 roots `arch:check` names (`deno.json:155`).
- **Allowances are unbudgeted and unlinked.** `scan-code-quality.ts:136` accepts
  `// quality-allow: <any non-empty text>`. `--max-allow` exists (`:173-181`) and is passed by
  **no** task and **no** workflow (grep over `deno.json` + `.github/workflows/`). Executed counts:
  `deno task quality:scan` → `findings: []`, `allowCount: 7`; `--root packages --root plugins` →
  `ok: true`, `findings: 0`, `allowCount: 10`. So the repo-wide surface already carries **3
  allowances beyond the 7 that #1276 ratified**, and nothing reports the delta.
- **Docs snippets are never opened.** `scan-code-quality.ts:87` — `isScannable` matches only
  `/\.[cm]?[jt]sx?$/`. No `.md`, and no `.template` (so scaffold templates are unscanned too).
  `scan-code-quality.ts:47` additionally skips any line beginning with a quote or backtick.
- **What is actually left in docs (re-measured, contradicts #1278 Inventory A).** The only real
  hit repo-wide is `docs/site/reference/triggers/index.md:310` `const observedEvents: any[] = [];`
  with its executable twin `docs/site/reference/triggers/examples_test.ts:65`.
  `docs/site/web-layer/query-bridge.md` no longer contains `as unknown as`, and `~orpc` /
  `BaseContractProcedure = Readonly<{ ~orpc: any }>` no longer appears in
  `docs/site/reference/contracts/index.md` (grep returns nothing at this baseline).
- **Inventory D is already satisfied and must stay that way.** `scan-code-quality.ts:87` excludes
  `_test.ts` / `.test.ts` / `.spec.ts`, so soundness tests are exempt by construction. There are
  **6**, not "~19": `packages/plugin-{workers,sagas,triggers,auth,ai}-core/tests/contracts/
  *-contract-soundness_test.ts` and `plugins/workers/services/src/routers/health-soundness_test.ts`.

## Current surface

`quality:scan` reports five rules (`explicit-any-ignore`, `unsafe-cast`, `explicit-any`,
`plugin-name-check`, `ts-error-suppression`), all line-regex, over `.ts/.tsx/.js/.jsx` non-test,
non-`.generated.ts` files. Any finding is silenced by appending `// quality-allow: <text>`. The scan
is green today at 0 findings / 7 default / 10 repo-wide allowances. `check-doctrine.ts` carries a
separate, warn-only, export-aware `any` rule over a hand-listed 16-root subset.

## Target contract

One gate, three added properties, no third scanner:

1. **Export-aware severity.** An `any` reachable from a package's published entrypoints is a
   failure, not a warning. Reuse and generalize `check-doctrine.ts:467-484` (or drive it from
   `deno doc --json` on each package's `exports` map, which already answers "is this symbol
   published") rather than adding a fourth regex pass. Non-exported `any` keeps its current
   severity.
2. **Registered allowances.** `// quality-allow:` requires a linked issue reference (`#<n>`) that
   is open and milestoned; a reason without one is a finding. The allowance list is budgeted with
   `--max-allow` wired into `quality:scan` and `quality:scan:repo`, so the count can only fall.
3. **Docs snippets in scope.** Fenced TypeScript blocks under `docs/site/**` are extracted and
   scanned by the same rule set; `*_test.ts` companions under `docs/site/**` are treated as docs
   fixtures, not exempt tests.

Exempt by explicit rule, asserted by test: the 6 `*-soundness_test.ts` files whose
`@ts-expect-error` lines *are* the assertion.

## Acceptance

- [ ] A new `any` in an exported type fails `quality:scan` on a red-first fixture.
- [ ] A new `as unknown as` without a linked open issue id fails `quality:scan`.
- [ ] An `as any` inside a fenced TS block under `docs/site/**` fails `quality:scan`.
- [ ] The 6 `*-soundness_test.ts` files stay green with their `@ts-expect-error` lines unchanged.
- [ ] `--max-allow` is wired into `quality:scan` and `quality:scan:repo` at the measured count.
- [ ] The allowance budget cannot be raised without an accompanying issue link in the same PR.
- [ ] `docs/site/reference/triggers/index.md:310` and `examples_test.ts:65` are typed, not `any`.
- [ ] Tests cover: exported vs local `any`, linked vs unlinked allowance, docs fence, soundness-test
      exemption, and budget overflow.
- [ ] `gate:` `deno task quality:scan:repo` and `deno task arch:check` are green after the change.

## Boundaries

- Do **not** re-file #1278; this is its Inventory C child and carries `Part of #1278`.
- Do **not** absorb #1278 Inventory B (the 12 production assertion sites) or #1276's tranches
  T1–T5 — this issue only builds the rail that keeps them from regrowing.
- Do **not** touch #1245 (island query types) or #1249 (`controlProps` / Zod 4 constraints); both
  are `packages/fresh` source defects with their own owners.
- Do **not** change `arch:check`'s root list here — that is T6-03's `arch:check:repo` closure plan.
- Do **not** extend `quality:scan` into `packages/fresh-ui` before T6-02 decides its lock policy.

## Docs/consumer proof

The scanned corpus is the published docs corpus: after this lands, no page under `docs/site/**`
can teach a cast, and the "documented cast is a framework bug with a paragraph attached" claim in
#1278 becomes machine-enforced rather than editorial. The consumer-visible proof is that
`docs/site/reference/triggers/index.md` and its `examples_test.ts` compile with real types, so an
agent copying the triggers reference no longer inherits `any[]`.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Drafted from
`research/github-board-open.md` §6.4 and `research/repo-audit/web-layer.md` §11, with every count
re-measured at `fac9e339042c` because the #1278/#1276 inventories were measured 2026-08-04 and are
stale in three places (docs items discharged, soundness-test count, allowance count).
