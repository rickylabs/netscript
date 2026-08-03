use harness

# Slice: scaffold hygiene (#1016, #1021, #1039)

Worktree: `/home/codex/repos/ns004-hygiene` · branch `fix/1016-scaffold-hygiene` · base
`origin/main` @ `f663fe0e4`.

## SKILL

Load, in order:

- `.agents/skills/netscript-harness` — run loop, slice contract, commit trail.
- `.agents/skills/netscript-cli` — scaffold output, plugin install classification, fixture tests.
- `.agents/skills/netscript-pr` — branch/PR/label/milestone rules. `Closes #N` goes in the PR
  **body**; every `gh` call passes `--repo rickylabs/netscript`.
- `.agents/skills/netscript-tools` — scoped check/lint/fmt wrappers.
- `.agents/skills/rtk` — prefix read-heavy `git`/`gh`/`grep` with `rtk`.

## Scope

Three small, independent scaffold-correctness defects. Read the issue bodies in full.

- **#1016 (p2)** generated projects ship no `tsconfig`, so a parent config breaks Prisma generate
  and Vite SSR. A generated project must be correct regardless of what sits above it on disk.
- **#1021 (p3)** the documented clean-clone order depends on a **gitignored** generated route
  manifest — so the documented order cannot work from a clean clone, which is the one case it exists
  to describe.
- **#1039 (p3)** ai plugin starters are not classified for `--no-samples`.

## Rules

- These are small. Do not gold-plate them, and do not expand into adjacent scaffold work — the
  scaffold agent-surface slice (`/home/codex/repos/ns004-scaffold`) and the plugin-wiring slice
  (`/home/codex/repos/ns004-plugins`) own neighbouring surfaces. #1039 in particular is adjacent to
  #1017 (`plugin install` ignores `--no-samples`) which the plugin-wiring slice owns: if you find
  they share a root cause, **say so in the PR and coordinate rather than fixing it in both places**.
- #1021 must be proven from an actual clean clone, not from this worktree.

## Gates

`deno task check` · `deno task test` · scoped lint/fmt wrappers · `deno task e2e:cli run
scaffold.static` or the narrower gate that proves the generated output. Verify the artefact, never
the exit code.

## Deliverable

One draft PR closing #1016, #1021, #1039, driven to ready-for-merge. Commit per slice; push and
comment commit hash + gate evidence on the draft PR before the next slice.

---

## Supervisor addendum (read this — it narrows the work)

Worktree is rebased onto `origin/main` @ `4634afe56` (post PR-G).

### #1016 — mostly landed already; ONLY the test remains
PR #1038 (`6e8c95277 fix(scaffold): terminate parent tsconfig lookup`) already added:
- `packages/cli/src/kernel/templates/workspace/tsconfig.ts` → root `{"files": []}`
- `packages/cli/src/kernel/adapters/templates/app/generate-app-tsconfig.ts` → app-local boundary

The first two acceptance boxes on #1016 are already ticked. **Box 3 is the outstanding work**:
a test that places a `tsconfig.json` with an unresolvable `extends`
(`{ "extends": "astro/tsconfigs/strict" }`) in the PARENT directory of a scaffolded project and
proves `netscript db generate` and the dev server still succeed.
- First: **verify the two ticked boxes are actually true** of current `main` output — if the
  generated project does not in fact emit both files at the right paths, say so, do not assume.
- The test must genuinely fail against pre-#1038 behaviour (i.e. if you delete the generated
  tsconfig, the test must go red). Prove that and record the output — an assertion that passes
  either way is a review-blocking finding.
- Prefer the existing E2E/fixture harness over a new bespoke script.

### #1039 — follow the #1017 pattern exactly
Reference implementation: `plugins/workers/src/adapter/plugin.ts` lines ~28-40 use
`samples: { kind: 'omit' }` and an `alternate` scaffolder on the barrel. Contract lives at
`packages/plugin/src/adapter/contract.ts:45` (`InstallStarterSamplesPolicy`).
The seven `ai` starters are at `plugins/ai/src/adapter/plugin.ts:35-45`:
`models, barrel, tool, agent, mcp-registry, streamProxy, chatRoute`.
Classify EVERY one explicitly (either a `samples` policy or a code comment stating it is
structural). If the barrel imports the suppressed tool/agent, it needs an `alternate` empty-barrel
form — otherwise `--no-samples` ships a workspace that does not type-check, which is the exact
failure #1039 warns about. **Prove the generated `--no-samples` workspace type-checks.**
Do NOT touch the transport in `packages/plugin` or the `plugin install --no-samples` plumbing —
#1017 owns that and a concurrent slice is in it. If you believe the fix requires a change there,
STOP and report it instead of making it.

### #1021 — reproduce before you fix
Do not guess which README. Find the exact documented sequence that fails, from an ACTUAL clean
clone (`git clone` into a fresh directory outside this worktree), following the doc verbatim.
Record the literal command and literal failure output. The likely locus is the SCAFFOLDED
project's README (`packages/cli/src/kernel/templates/workspace/generate-readme.ts`), whose
Commands table documents `deno task check` — which may require Fresh/Vite-generated, gitignored
route-manifest output that does not exist on a fresh clone. Confirm or refute that.
The minimum fix is either (a) reorder the documented sequence so the build/generate step precedes
the check, or (b) state the prerequisite on the step that needs it. Acceptance box 2 asks for a
clean-clone CI job — if you add one, keep it minimal; if you judge it out of scope, say so
explicitly in your worklog and leave that box unticked rather than pretending.
If you start containers/services from the clean clone, tell the supervisor its absolute path so it
can be declared with `--owned-root`. Delete the clone when done.

### Non-negotiables
- Commit per issue, push after each, so the draft PR commit list is live.
- Every `gh` call passes `--repo rickylabs/netscript`.
- No new `// deno-lint-ignore` or `as unknown as` to green a gate — that is a review-blocking
  finding, not a pass.
- Verify artefacts, never exit codes. Never pipe a gate through `tail` and call it green.
- Report honestly in the worklog. A criterion you could not meet is a legitimate outcome; a
  criterion you claim without evidence is not.

---

## Orchestrator addendum (2026-08-03) — the slice was never implemented

The previous supervisor opened draft PR **#1081** (branch `fix/1016-scaffold-hygiene`), committed
only `dacbf603f plan(harness): lock scaffold hygiene slices`, and then died. **No implementation
exists.** Do not open another PR — push to this branch and comment on #1081.

Base is now `origin/main` @ `2d58481e4` (PR #1075 and #1077 merged). Rebase before you start.

### The six outstanding acceptance boxes — these are the definition of done

- **#1016** — a test that places a `tsconfig.json` with an unresolvable `extends` in the **parent**
  directory of a scaffolded project and proves `netscript db generate` and the dev server both still
  succeed. It must go **red** when the generated tsconfig is removed; an assertion that passes either
  way is a review-blocking finding.
- **#1021** — (a) the documented clean-clone sequence succeeds on a fresh clone with no prior build,
  or the step requiring the generated manifest states its prerequisite; (b) a clean-clone CI job
  follows the README verbatim from an empty checkout and passes. If you judge (b) out of scope, say
  so explicitly, leave it unticked, and drop `Closes #1021` in favour of stated remaining scope.
- **#1039** — every `ai` starter classified with an explicit `samples` policy or documented as
  structural; an `alternate` empty-barrel scaffolder if the barrel references suppressed samples; and
  a black-box assertion that `plugin install ai --no-samples` emits no sample tool/agent **and the
  generated workspace type-checks**.

### close-gate is part of the work, not an afterthought

`close-gate` reads these `- [ ]` boxes on #1016, #1021 and #1039 and fails the PR until each is
ticked. Four PRs in this release stalled by discovering that at the end. Verify each criterion as you
land it, tick it on the issue, and post the evidence — command, observed output, and for tests, proof
they fail against pre-fix behaviour. **Tick nothing you cannot evidence.** A criterion you could not
meet is a legitimate outcome; drop that closing keyword and state the remaining scope.

### Boundaries

Do **not** touch the transport in `packages/plugin` or the `plugin install --no-samples` plumbing —
#1017 owns that and landed in a concurrent slice. If you believe the fix requires a change there,
stop and report rather than making it.

Clean up the clean clone when done, and report `agentic:leak-check` clean. If you start resources
from the clone, it needs `--owned-root <path>`.
