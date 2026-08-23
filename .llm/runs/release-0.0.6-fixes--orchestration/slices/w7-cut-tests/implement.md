use harness

# Slice W7 — coordinated bump fails check-test (#1629)

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-w7` |
| Branch | `fix/1629-cut-version-derived-tests` |
| Base | `origin/main@bf4b877f17` |
| Route | Codex · OpenAI · GPT-5.6 Sol · **medium** |
| Priority | **P0 — blocks the 0.0.6 stable cut** |
| PLAN-EVAL | N/A — the failures and required properties are enumerated below |
| IMPL-EVAL | Normal **automatic** evaluator, exactly once, on draft → ready. **Do not flip; I flip it.** |

## SKILL

- `netscript-harness` · `netscript-cli` (**authority on plugin install flows and closure verification**)
- `netscript-release` (why the bump→publish window exists) · `netscript-tools` · `netscript-pr` · `rtk`

## The defect

`deno task test` fails on a coordinated release-cut commit. Release PR #1627
(`chore(release): cut 0.0.6`, head `9400e613e`, base `bf4b877f17`), job `94290346159`:

```
FAILED | 3379 passed (619 steps) | 9 failed (5 steps) | 14 ignored (3m20s)
```

The same suite is green on `main`. **The bump itself makes it red** — so every release is blocked by
tests that cannot survive the version they are releasing.

Read the full issue: `gh issue view 1629`.

### Cause 1 — assertions hardcode the previous release version

```
Release version coherence: FAIL (expected 0.0.5; 3 of 3 manifests mismatch)
... to contain: "@netscript/fresh@0.0.5".
... to contain: "@netscript/fresh uses non-exact version "^0.0.5"".
```

Failing: `first-party control-plane modules are import-safe and preserve application barrels`,
`rejects a split root and subpath with every involved version`, `fails closed on a non-exact closure
member`, `rejects an incoherent resolver result before serializing the app manifest`, `rejects a
non-exact closure member at init`, `generateAppDenoJson`, `generated closure verifier rejects split
JSR identities with version-bearing output`, `generated closure verifier fails closed on a range pin`.

### Cause 2 — AI plugin install tests resolve the newly bumped, unpublished version

After the bump the tree is `0.0.6`, unpublished during the cut, so installs resolving
`@netscript/config@0.0.6` and siblings fail against the registry.

Failing: `installs the AI markdown registry closure into its generated namespace`, `keeps the
configured AI module resolvable across a forced reinstall`, `keeps the plugin-owned AI namespace
configured in local-source installs`, `plugin install ai --no-samples omits samples and type-checks
the generated workspace`, `public install plugin flow`, `local contributor install plugin flow`.

### Explicitly out of scope

This is **not** #1597 (E2E gate `behavior.package-backed-plugin-doctor`) and **not** #1625 (CLI plugin
doctor service entrypoints). Both are already fixed and their scaffold tiers passed on this very cut
commit. Do not touch either path. Do not touch the agent-docs corpus — a separate slice owns that.

## Required properties

1. **Version-bearing assertions derive the active tree version** instead of hardcoding a literal. A
   coordinated bump must not fail them by construction. Read the version from the workspace the test
   is exercising; do not introduce a second source of truth.
2. **Pre-publish cut CI resolves first-party packages from local workspace sources**, or handles the
   unpublished-version case in an explicitly bounded way. **A registry 404 for the version being
   released is never an acceptable outcome during a cut.**
3. **Published-consumer behaviour stays strict.** A genuinely non-exact pin, a split JSR identity, or
   a real missing package must still fail. The fix must not degrade into a blanket "unpublished is
   fine" that hides real defects — that is the failure class this milestone exists to remove, and it
   would be worse than the bug you are fixing.

## Discriminating tests — required

Each must **fail against current code**:

1. A simulated coordinated bump to an arbitrary next version leaves the version-coherence and closure
   assertions green — proving they derive rather than hardcode.
2. An unpublished first-party version resolves through local workspace sources during a cut-like run,
   instead of producing a registry 404.
3. **The strictness guard**: with a *published* version, a non-exact pin / split identity / missing
   package still fails. State plainly in `evidence.md` which assertion fails on the pre-fix code for
   each.

A test that only proves the bump case passes is insufficient; without (3) you cannot tell a fix from a
disabled check.

## Gates

```
rtk proxy deno task check · test · lint · fmt:check
rtk proxy deno task quality:gate        # required — you will touch packages/**
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
```

**Decisive proof:** in a **disposable copy** (not this worktree), run
`deno task release:cut -- 0.0.7 --dry-run` and then a **full `deno task test`** on the bumped tree,
showing all 9 previously-failing tests green. Use `0.0.7` deliberately — `0.0.6` is the live release
target and must not be minted or pushed by you.

## Hazards

- Never wrap an attached session in a shell `timeout` — it kills the turn ~25s later.
- `deno fmt` rewraps; re-read after formatting.
- Explicit-path `git add`; assert `git diff --stat -- deno.lock packages/fresh-ui/deno.lock` empty.
- **No publication, no real `release:cut`, no tag, no `release/cut-0.0.6` branch.** I own the release
  train.
- Write evidence to `.llm/runs/fix-1629-cut-version-derived-tests--w7/evidence.md`. Do **not** create
  a repository-root `slices/` directory.

## Deliverables

1. The fix on `fix/1629-cut-version-derived-tests`.
2. `.llm/runs/fix-1629-cut-version-derived-tests--w7/evidence.md` — untruncated gate output, the
   pre-fix red for each discriminating test, and the disposable 0.0.7 dry-run + full-test proof.
3. A **draft PR against `main`**: `Closes #1629` in the **body**; labels `type:fix`, `area:release`,
   `area:cli`, `priority:p0`, exactly one `status:`; milestone `0.0.6`. #1629 has acceptance
   checkboxes — match each evidence entry's text to the checkbox line **verbatim** or use
   `box-index`; one character of drift makes the mirror throw.
4. Report the PR number and stop. Do not merge, do not flip to ready, do not touch labels.
