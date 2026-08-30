# PLAN-EVAL cycle 2 — fix-aspire-reference-name-validation--1732-source-safety

- Plan evaluator session: Claude Fable 5 (native opposite-family evaluator), **cycle 2 of 2**,
  2026-08-30. Separate session from cycle 1; cycle-1 findings were re-derived, not inherited.
- Run: `fix-aspire-reference-name-validation--1732-source-safety`
- Surface / archetype: `packages/aspire` config boundary (Archetype 2, Keep) + `packages/cli`
  background AppHost generator (Archetype 6, dominant)
- Scope overlays: none
- Evaluated head: `e0186bbd4cee9d60425129818fe74437974eb48a` (branch
  `fix/aspire-reference-name-validation`, base `13878a80a50c55b9662099fed64555f2310ae4a3`)
- Head assertion: local detached worktree `e0186bbd` == `git fetch origin` →
  `origin/fix/aspire-reference-name-validation` `e0186bbd` == PR #1747 `headRefOid` `e0186bbd`.
  Verdict is scoped to this head only.
- Cycle-1 artifact: `plan-eval.md` is bit-identical between `1f52d5e2` and this head
  (`git diff 1f52d5e2 e0186bbd -- plan-eval.md` = 0 bytes). Untouched by this cycle.
- Scope discipline: `git diff --stat 13878a80..e0186bbd -- . ':!.llm/runs'` is empty. No source,
  test, lock, asset, or doc change has leaked ahead of the gate.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                         |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` re-baselined at `13878a80`; the cycle-1 spot-checks re-verified here (grammar vs upstream, D5 sweep, discovery key).                                                                                                          |
| Decisions locked                        | PASS   | D1–D5 with rationale; option (a) adopted as authorized, then strengthened to ordinal bindings. Ordering (escaping before grammar) still sound.                                                                                              |
| Open-decision sweep                     | FAIL   | One undeclared consumer of the exact generated text shape lives in the merge-readiness E2E suite and is broken by slice 2 as planned (F1). One enumerated emission site is mis-covered by the chosen mechanism (F2). Evaluator sweep below. |
| Commit slices (< 30, gate + files each) | PASS*  | 4 implementation slices, ordered, each with proof/gate/files. *Slice 2's file list is incomplete (F1).                                                                                                                                      |
| Risk register                           | PASS   | 12 rows incl. the identifier-seam row cycle 1 required; mitigations concrete. The F1 fixture is not a risk-register gap so much as a files-touched gap.                                                                                     |
| Gate set selected                       | PASS   | 14-row wrapper-sourced table; root test honestly `NOT FIRED`; `check:assets-barrel`, `quality:scan --max-allow 7`, both red-baseline comparisons still relevant.                                                                            |
| Deferred scope explicit                 | PASS   | "Deliberately Untouched" enumerates scaffold grammar, `_utils.ts`, siblings, `src/domain/mod.ts`, runtime/E2E _activity_. It does not claim E2E _fixtures_ are untouched — which is why F1 is a bounded fix, not a rescope.                 |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Reachability condition is sufficient and verifiable; both red baselines re-measured identical at this head (below).                                                                                                                         |

## Verdict

**`FAIL_FIX`** — the amended approach is sound and the F1/F2 corrections from cycle 1 are genuinely
closed (not reworded around). Two new bounded corrections to the plan text are required before the
RED slice; neither changes a locked decision, the archetype, or the scope position. Under
`plan-protocol.md` vocabulary this maps to `FAIL_PLAN` on the single unchecked box; the dispatch
authorized `FAIL_FIX` for bounded corrections, and that is the honest size. This was the last
granted cycle; the leaf goes to the coordinator with the two items below.

### Required fixes

1. **F1 — an undeclared consumer of the generated text shape sits in the merge-readiness gate and
   slice 2 breaks it.** `packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts`
   (l.212–252) reads the scaffolded `aspire/.helpers/register-background.mts` and hardcodes three
   things the amended plan changes:
   - the block marker `'  // --- workers ---'` (l.214) — slice 2 group 1 stringifies the comment
     label, so it becomes `// --- "workers" ---` and `indexOf` returns −1 →
     `throw new Error('generated
     register-background.mts did not contain the workers resource block')`;
   - the replace anchor `"    backgroundProcessors.set('workers', workers);"` (l.243–244) — becomes
     `backgroundProcessors.set("workers", bg_<n>);` (quote style _and_ binding change), so the
     `String.replace` is a no-op and the guard on l.246 throws;
   - the injected code `await workers.withEnvironment('services__users__http__0', usersEndpoint);`
     (l.235) — references a binding that no longer exists; even if the two guards were patched, the
     scaffolded AppHost would fail to type-check/run on `workers`.

   This fixture is wired into the `scaffold.runtime` suite
   (`packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts:197`), which `AGENTS.md` names
   as the required pre-merge gate and `.github/workflows/e2e-cli-prod.yml:128` runs. The plan says
   E2E is _not run_ in this leaf (correct — no lease) but its per-path table, slice-2 file list, and
   "Deliberately Untouched" section never name this file, so the break would surface only at
   merge-readiness, after IMPL-EVAL. Cycle 1's attack 8/"no test pins the old identifier text" only
   swept unit tests; that was a cycle-1 miss and I am recording it as such.

   **Satisfies F1:** add the fixture to slice 2's files-touched with a stated update contract: (i)
   locate the `workers` block by a name-derived anchor that survives slice 2 (e.g. the stringified
   `builder.addExecutable("workers",` call or the stringified
   `config.BackgroundProcessors["workers"]` lookup) rather than the comment marker; (ii) derive the
   binding from the block (`const (bg_\d+) =
   builder.addExecutable("workers"`) instead of
   hardcoding `workers` or an ordinal — the ordinal depends on the scaffolded processor order and
   must not be pinned; (iii) update the `.set(...)` anchor to the stringified form. State that this
   is a fixture edit, not E2E execution, and that the gate still runs only at merge-readiness.
   Alternatively, if the coordinator prefers, keep the exact `// --- ${name} ---` comment text raw
   (see F2 for why that is only safe with line-terminator neutralization) and still do (ii) and
   (iii) — the binding rename alone breaks the fixture.

2. **F2 — the comment-label emission site is enumerated but not actually covered by
   `JSON.stringify`.** D1 group 1 lists "comment label" among the sites stringified.
   `JSON.stringify` is the wrong tool for a `//` comment position: it escapes `\n`/`\r` but **not**
   U+2028/U+2029, which are ECMAScript LineTerminators and end a line comment. Probe at this head:
   `// --- ${JSON.stringify('a b')} ---` → `SyntaxError: Expected ';', '}' or <eof>` on import,
   while the same value in string-literal position imports fine (ES2019 allows LS/PS in literals).
   Under the plan's own framing — "if the grammar is loose, escaping still guarantees parseable
   TypeScript" — this is the one enumerated site where that guarantee is false. The exposure is
   remote (D2, the scaffold validator, and Aspire all reject non-ASCII), but the plan asserts a
   mechanism that does not hold at this site and the matrix has no row that would catch it.

   **Satisfies F2:** decide one of: (a) omit user text from the comment (e.g.
   `// --- processor
   <ordinal> ---`) and rely on the stringified `addExecutable`/lookup literals
   for traceability; or (b) keep the name in the comment but neutralize all four line terminators
   (`\n`, `\r`, U+2028, U+2029) for that site only. Add one direct-generator matrix row (name
   containing U+2028) under "parseable when generator is invoked directly". Choose in concert with
   F1(i), since the fixture anchor currently _is_ the comment.

### Advisory (not blocking)

- **Unused import.** After slice 2 the background generator no longer calls `safeIdentifier`; the
  import on `generate-register-background.ts:19` must be dropped or the scoped lint gate
  (`no-unused-vars`) goes red. The plan says `_utils.ts` stays untouched (correct) but does not say
  the import goes; a one-line note avoids an IMPL-EVAL nit.
- **Enumeration completeness by emission site.** Four further config-derived values reach the
  emitted source and are _already safe_, but a by-emission-site enumeration should say so:
  `entryPermissions`/`defaultPermissions` (l.64/68, already `JSON.stringify`), `sagaStoreBackend`
  (l.136, already `JSON.stringify`), `watchMode` (l.69, boolean), and `entry.Concurrency` (l.167,
  code position, `z.number().int().positive()` at the boundary — do **not** stringify;
  `JSON.stringify` of a non-finite number is `null`).
- **Existing single-quote pins in the matrix file itself.** `generate-register-background_test.ts`
  l.220 (`withEnvironment('${DISCOVERY_KEY}'` count) and l.319
  (`builder.addExecutable('${PROCESSOR_NAME}'`) pin single-quote spelling and will flip after
  slice 2. The risk row "update narrow assertions in both generator test files" covers it, but the
  per-path row for this file says only "Add"; make the update explicit so the positive discovery-key
  count is not silently rewritten to a weaker assertion.
- **Ordinal churn.** Renumbering when a processor is inserted mid-config produces diff noise in
  user-committed generated helpers. Acceptable and consistent with the no-user-text decision, but
  undeclared; one sentence in D1 or the risk register.

## Attack narrative — what I tried to break

1. **Ordinal identifiers (F1 closure).** `bg_<i>` / `ref_service_<i>_<j>` / `ref_plugin_<i>_<j>`:
   distinct prefixes keep `ref_service_0_0` and `ref_plugin_0_0` apart for the fixture that declares
   one name as both kinds; derived suffixes (`bg_0_perms`, `bg_0_workdir`, `bg_0_otel`,
   `bg_0_sqliteDatabase`, `bg_0_databaseBinding`, `bg_0_triggerRegistryModule`) cannot collide with
   another ordinal because suffixes are alphabetic; each processor block is its own `if {}` scope
   anyway. None can equal `builder`, `config`, `infrastructure`, `_services`, `_plugins`,
   `appHostDir`, `backgroundProcessors`, `databaseProviderEnv`, `databaseEnvKey`. `Object.entries`
   order is deterministic per input. Reserved words and shadowing are structurally impossible.
   **Attack failed** — the amendment is stronger than the prefix I recommended in cycle 1.
2. **Discovery-key contract.** Both loops still emit `'services__${ref}__http__0'` as a string
   literal (l.219, l.231); `JSON.stringify('services__workers-api__http__0')` is byte-identical
   apart from the quote character; the negative assertion (`services__workers_api__http__0` absent)
   can no longer false-match anything since no `workers_api` identifier is emitted at all.
   Positive + negative on both kinds is retained in the matrix and DoD. **Attack failed.**
3. **Emission-site enumeration.** Read the generator end to end (262 lines). Config-derived text in
   string-literal position: l.59, 74, 90, 101, 111 (×2), 147, 167, 219, 231, 237 — all enumerated.
   Comment position: l.56 — enumerated but mis-covered (**F2**). Already-safe/typed sites listed in
   advisory. **One site broke.**
4. **D2 vs platform.** Fetched upstream `src/Aspire.Hosting/ApplicationModel/ModelName.cs` myself:
   "between 1 and 64 characters", "must start with an ASCII letter", "only ASCII letters, digits,
   and hyphens", "cannot contain consecutive hyphens", "cannot end with a hyphen", `IsAsciiLetter`
   (uppercase accepted). D2 is exactly that. I agree with cycle 1. **Attack failed.**
5. **D5 blast radius.** Deno sweep of every `*.json` in the tree containing `BackgroundProcessors`
   (keys + both reference arrays) against the D2 grammar: only
   `packages/aspire/tests/_fixtures/appsettings.json` (`workers,sagas,triggers,benchmark`), zero
   rejects. Every reference literal in `packages/`, `plugins/`, `docs/` TS/MD:
   `auth billing-worker-api nonexistent products sagas-api streams users workers-api` — all valid.
   Scaffold `generate-appsettings.ts:314` starts `BackgroundProcessors: {}`; plugin install names
   are validated by `validateResourceName` (`a--b`/`a-` still producible, as D5 discloses). **Attack
   failed.**
6. **Quiet widening / narrowing (`fddcb833..e0186bbd`).** Read the full diff. DoD went from
   "Accepted generated source remains parseable" to "Every config-accepted matrix name generates a
   module that both parses and executes without reserved-word or generator-binding collisions" plus
   a separate direct-generator literal box — stronger, not trivially true. Slice 2 gained
   `generators-background-app_test.ts` (necessary, declared). Research/worklog/drift/context-pack
   changes are bookkeeping and two honest drift entries. No scope widened beyond the F1(a)
   authorization except that ordinals replace the prefix — which the supervisor should note as
   stronger-than-authorized but within option (a)'s intent (generator-local, `_utils.ts` untouched,
   grammar not narrowed). **Attack failed.**
7. **JSR reachability.** No exported entrypoint (`mod.ts`, `config.ts`, `types.ts`, `constants.ts`,
   `schema.ts`, `src/{public,application,adapters,testing}/mod.ts`) imports `src/domain/` today;
   `src/domain/mod.ts` exports types + two error classes. A `RegExp`/string used inside a
   `superRefine` closure appears in no exported type, so `deno doc` cannot see it; `publish.include`
   ships the bytes, which is unavoidable and harmless. The condition (no barrel, no export-map
   entry, no exported-symbol type) is sufficient and is verifiable by grep of `src/domain/mod.ts` +
   the two baseline comparisons. Re-measured at `e0186bbd`: `doc:lint --root packages/aspire` exit
   1, `combinedMissingJSDoc 0`, private-type refs 2/9/52/2/19 per entrypoint; JSR audit exit 1, four
   `F-JSR-2` + one `F-JSR-7`, `dry-run: OK slowTypeWarnings=1`. Identical to the recorded baseline.
   **Attack failed.**
8. **Scope discipline.** Empty diff outside `.llm/runs/`. **Attack failed.**
9. **Receipt honesty.** Every 40-char SHA in the run dir (`13878a80…`, `1f52d5e2…`, `21760411…`,
   `fddcb833…`) and in the PR body + all three comments (adds `e0186bbd…`) resolves to a commit.
   **Attack failed.**
10. **GitHub surface.** PR #1747: `Closes #1732` in body; labels `type:fix`, `area:cli`,
    `area:aspire`, `priority:p1`, exactly one `status:` = `status:plan`; milestone `0.0.7`; draft;
    base `main`. Issue #1732 open, `0.0.7`, same single status. **Attack failed.**
11. **Existing pins on old identifier text.** Unit tests: `generators-background-app_test.ts`
    (`workers_workdir`, `workers.withEnvironment('WORKERS_CONCURRENCY'…`, `workers_sqliteDatabase`,
    `triggers_triggerRegistryModule`) — declared in slice 2. `generate-register-background_test.ts`
    l.220/319 — single-quote pins, advisory above. `generators-tools-db-index_test.ts:271` only pins
    the import line — unaffected. `docs/` — only file names, no identifier text. E2E fixture — **F1,
    attack succeeded.**

## Open-decision sweep (evaluator-run)

- **E2E fixture update contract** — must resolve now (F1). Deferring it means the first signal is a
  red `scaffold.runtime` at merge-readiness, after IMPL-EVAL has passed on unit evidence.
- **Comment-label mechanism** — must resolve now but trivially (F2); it couples to F1's anchor
  choice.
- Everything else (identifier seam, non-name literals, schema placement, JSR reachability, sibling
  deferral): resolved and correctly marked.

## Host conditions (recorded, not charged to the plan)

- `rtk` not installed on this host; raw `git`/`gh`/`grep` used directly. `gh` _is_ on PATH here and
  was used read-only for PR/issue state.
- ~7.7k unreapable PID-1 zombies: root `deno task test` not run and not a usable signal. `doc:lint`,
  the JSR audit, the Deno sweep, and the LS/PS probe all completed normally; no host-caused failure
  observed.
- Not run and not findings: Aspire, Docker, browser, `scaffold.runtime`, `e2e:cli`. No runtime
  lease. F1 is a static read of a fixture, not an E2E execution result.

## Notes

- Nothing in this evaluation touched source, tests, `plan-eval.md`, other run artifacts, PR body,
  labels, draft state, milestone, or the issue. Probe scripts lived under the job tmp dir and are
  not committed.
- For the coordinator: both fixes are plan-text edits (slice 2 files + one D1 sentence + one matrix
  row). The locked decisions, ordering, grammar, private-module placement, and compatibility
  position are ready; nothing here argues for re-planning.
