# Drift Log: fresh-ui desktop components

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-07-18 — Integration ref moved after worktree creation

- **What:** The worktree branch initially pointed at the earlier #841 integration commit and did not
  contain #842.
- **Source:** `git rev-parse`/remote fetch comparison.
- **Expected:** The supplied integration base contains both #841 and #842.
- **Actual:** Remote `feat/desktop-frontend` had advanced to `637c3915`; the worktree was
  `e6e1be08`.
- **Severity:** significant
- **Action:** fix
- **Evidence:** Clean rebase onto `origin/feat/desktop-frontend` @ `637c3915` before artifact
  creation.

## 2026-07-18 — Fresh UI JSR audit baseline is broader than generic rubric expectation

- **What:** The current package has existing diagnostics outside the new desktop surface.
- **Source:** `deno task doc:lint --root packages/fresh-ui --pretty`; rubric audit; raw package
  publish dry-run.
- **Expected:** The generic audit guidance anticipates few or no existing private-type findings.
- **Actual:** `./interactive` has 96 private-type and 27 missing-doc diagnostics; registry rubric
  warnings also pre-exist. Raw `deno publish --dry-run --allow-dirty` succeeds and reports no actual
  slow-type diagnostic.
- **Severity:** significant
- **Action:** accept
- **Evidence:** `research.md` baseline. #843 requires zero diagnostics on `./desktop` and no
  worsening of package totals; unrelated cleanup is non-scope.

## 2026-07-18 — Integration advanced during Plan checkpoint publication

- **What:** The integration branch merged the independent #456 packaging lane after the plan commit
  was pushed.
- **Source:** Draft PR base SHA and `git fetch origin feat/desktop-frontend`.
- **Expected:** The plan checkpoint is based on the current integration ref.
- **Actual:** Integration advanced from `637c3915` to `1709dcba`.
- **Severity:** minor
- **Action:** fix
- **Evidence:** The intervening diff changes desktop packaging/release CLI code and its run
  artifacts, not `packages/fresh-ui` or scaffold design-gallery templates. The plan commit was
  rebased and its baseline metadata updated; no design decision changed.

## 2026-07-18 — Root architecture gate blocked by integration-base dependency ranges

- **What:** Slice 1's required root `arch:check` stops in `deps:check` before doctrine checks.
- **Source:** `rtk proxy deno task arch:check`.
- **Expected:** Root architecture gate passes for the slice.
- **Actual:** The scanner reports divergent `@netscript/sdk` JSR ranges: CLI uses `^0.0.1-beta.10`,
  while Fresh uses `0.0.1-beta.10`.
- **Severity:** significant
- **Action:** defer
- **Evidence:**
  `git diff origin/feat/desktop-frontend -- packages/cli/deno.json packages/fresh/deno.json` is
  empty, proving slice 1 did not introduce the violation. A focused Fresh UI doctrine scan has zero
  failures. Changing dependency policy is outside #843 and requires supervisor disposition.
