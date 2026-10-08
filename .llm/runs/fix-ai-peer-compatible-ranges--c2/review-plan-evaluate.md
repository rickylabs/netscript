# Final review/CI follow-up PLAN-EVAL — B1–B3 amendment (issue #2036 / PR #2087)

- Evaluator: fresh independent session, owner-directed GLM max route
  (`opencode-go/glm-5.3-flash`, max), per brief and `supervisor.md`. The earlier reused evaluator
  session was discarded per brief; no session reuse. Generator family (`gpt-6.1-sol` lane) differs —
  session and vendor-family separation satisfied. No delegation used.
- Exact HEAD at evaluation: `f9ba4e3515000c45f2ac7ec0456fe06ad8fe4590`, branch
  `fix/ai-peer-compatible-ranges`, working tree clean. That HEAD touches only the run-dir
  `plan.md` (+8) and this brief (+3) — **"no source edits yet" verified**: the B1–B3 source edits
  are not landed. Prior identities retained: A-round source `f413a1f612683f054d44d74297627129987feff9`
  (IMPL-EVAL PASS head `d5c07c0874eb561f130957d1867bd84ff2c5dd6d`), amendment PLAN-EVAL PASS
  `46ec3293b5f5474ab7816786d5221af536cae50f`, baseline `872df8e21e0a8bf06cd0796c7808068dd67e2c4e`.
- Mode: PLAN-EVAL only for the "Final review/CI follow-up amendment" (plan.md lines 45–50).
  Implementation hard stop honored. No source/config/lock/history/public writes; no branch switch;
  no delegation, CI polling, or sleeps; no broad gates — only the three briefed source surfaces,
  one narrowed existing-test run, and bounded read-only npm metadata probes.

## Findings verified against the tree (all three confirmed at HEAD)

1. **B1 — published-version equals form broken, no strict parsing.**
   `check-ai-peers.ts:129-133` uses `Deno.args.indexOf('--published-version')` + positional
   successor. `--published-version=0.65.0` parses as one token, the value is never read (surfacing
   as a spurious "Pass an exact published package version." error), unknown flags are silently
   ignored (a typo'd flag silently falls back to workspace mode — the "selects workspace by
   accident" risk), and duplicates take the first silently. Worklog gates `published-negative-guard`
   / `amendment-published-negative` exercised only the space form — consistent with the equals form
   never being usable. Confirmed.
2. **B2 — combined npm multi-field output on a declared range is shape-fragile.**
   `registryVersions()` (`check-ai-peers.ts:45-73`) issues one combined
   `npm view <range> version peerDependencies --json`. Probes (npm 12.1.0, read-only): for
   `@tanstack/ai-mcp@^0.3.0` (12 matched releases) the output degraded to a **versions-only array —
   all peer data omitted**; for `@tanstack/ai-anthropic@^0.18.0` (all rows have peers) it emitted
   clean object-per-version rows; output shape therefore depends on row composition and npm
   version — exactly the "combined npm field output can lose peers" class. Exact-release queries are
   unambiguous by construction (`@tanstack/ai-mcp@0.8.0` peers → empty; `@tanstack/ai@0.49.1`-style
   rows → single object). The cold path (`check-ai-peers.ts:103-119`) already enumerates exact
   releases with batch-8 subprocesses and stays name-independent — B2 leaves it intact and applies
   the same bounded exact-release discipline to the declared-range path. Confirmed; planned fix
   removes the failure class by construction.
3. **B3 — CLI MCP constant stale; owning-pin assertion fails.**
   `import-resolver.ts:18` is still `npm:@tanstack/ai-mcp@^0.3.8` (sole CLI constant; consumed via
   `PACKAGE_TO_JSR` and `EXTERNAL_DEPS`, and via `resolveNetScriptImports('jsr')` into ai-kind root
   imports at `workspace-mutator.ts:22,406,438`) while the owning manifest pins exact
   `npm:@tanstack/ai-mcp@0.8.0` (`packages/ai/deno.json:33`, the qualified A-round family whose core
   arrives via dependency `^0.65.0` — prior PASS fact). The existing regression
   `root-level scaffold runtime imports resolve in both package-source modes`
   (`workspace-mutator_test.ts:261-368`) reads the real owning manifest and asserts both the
   resolver map and the real generated root map in `jsr` **and** `local` modes — I reran it narrowed:
   **exit 1**, diff `npm:@tanstack/ai-mcp@^0.3.8` vs expected `npm:@tanstack/ai-mcp@0.8.0`, exactly
   the reported full-CI owning-pin failure. Its four adjacent assertions in
   `import-resolver_test.ts:26,42,61,80` still pin `^0.3.8` and are covered by B3's "existing
   assertions" update. Confirmed; B3's minimal one-constant-plus-assertions fix is correct and
   self-enforcing (the regression compares against the live owning manifest).

## Checklist results (plan-gate, B1–B3 amendment, box by box)

| Plan-Gate item | Result | Evidence / location |
| -------------- | ------ | ------------------- |
| Research present and current | PASS | `research.md` present; B amendment re-baselines onto the later review/CI findings, each of which I verified live against HEAD (findings 1–3 above); prior qualified-family PASS retained as context per brief, used for identity not precedent. |
| Decisions locked | PASS | B1 strict `@std/cli` parseArgs with unknown/missing/duplicate rejection before workspace validation (plan.md:47); B2 enumerate version-only metadata per declared range, then per-exact-release peer queries, ≤8 subprocess batches, cold inventory unchanged and name-independent; B3 sole constant + existing assertions to exact `0.8.0`; no other family/lock/bridge change. Each with rationale (plan.md:47-50). |
| Open-decision sweep | PASS | Plan states "Open decisions none" (plan.md:50). Evaluator sweep found only mechanical implementation notes (below), none rework-forcing, none must-resolve-now. |
| Commit slices | PASS | B1–B2 guard + two adjacent regressions, each causal mutation/restored pass; B3 one resolver constant + existing test assertions; changed source under 10 files; every slice names what it proves and its gate (plan.md:49). Ordered, all far under 30 files. |
| Risk register | PASS | npm output omission → exact-release queries; equals/typo workspace selection → strict parser; CLI pin travels only in a coordinated release, source unreleased, published-consumer claim stays open; baseline docs explicitly adjudicated, new CLI doc findings fixed (plan.md:50). Matches the three findings. |
| Gate set selected | PASS | Archetype 2: universal F-* family via structured scoped check/test/lint/fmt, `quality:scan`/`arch:check` and carrier freshness; consumer import validation (required for Arch 2) via live cold guard + genuine published-negative probes for **both** argument forms; release-gate class triggered because generated scaffold output changes — mandatory one-pass `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` per `gates/release-gates.md:35-37` ("full one-pass command, not split gates"), adopted verbatim in plan.md:49 with raw failed gate names preserved if unavailable. Runtime/Aspire optional for Arch 2 and covered inside that one-pass smoke. No release dispatch; `e2e-cli-prod` post-publish authority remains owner work. |
| Deferred scope explicit | PASS | "No other family/lock/bridge change" (plan.md:47); no merge/publication/release claim; owner retains post-publish verification (plan.md:49-50). |
| jsr-audit (package/plugin waves) | PASS (N/A-delta, reasoned) | No planned public-surface delta: B3 is a non-exported constant string plus its test assertions; CLI JSR/doc/publish audits run with the qualified baseline and "any new CLI doc findings fixed" (plan.md:49); `.llm/tools` surfaces are internal and unpublished; no slow-type/surface risk to name beyond the baseline already adjudicated (F-7 rows remain DEBT-accepted by prior independent evaluation). |

## Open-decision sweep (evaluator-run, notes for implementation — none blocking)

- **Empty exact-release peer output:** `npm view <name>@<exact> peerDependencies --json` returns
  blank stdout for peer-less releases (e.g. `ai-mcp@0.8.0`); `JSON.parse('')` throws. The planned
  "no-peer first release" fixture forces treating blank/absent output as "no peers". Mechanical,
  forced by the fixture — record the behavior in the regression.
- **Argument-test unit:** the parser must be exported (like `findAiPeerConflicts` /
  `resolvedNpmSpecifiers`) or harnessed via subprocess for "Argument test covers both forms and
  rejects unsafe fallback cases". Mechanical.
- **`@std/cli` availability:** locked at `1.0.30` (`jsr:@std/cli@1` and `jsr:@std/cli@^1.0.30` in
  `deno.lock:51,53`); 1.0.30 `parseArgs` provides `string`/`collect` plus an `unknown` callback that
  can throw — equals form, space form, unknown/missing/duplicate rejection are all implementable.
  Direct `jsr:@std/cli@^1.0.0/parse-args` import matches sibling-tool precedent (e.g.
  `.llm/tools/fitness/audit-jsr-package.ts:30`) with no lock churn. Mechanical.
- None found that would force rework when deferred.

## Verdict

`PASS` — the B1–B3 amendment (plan.md lines 45–50 at HEAD `f9ba4e3515000c45f2ac7ec0456fe06ad8fe4590`)
satisfies the Plan-Gate. All three findings are real, verified against the tree at HEAD, and the
planned repairs (strict std parser, bounded enumerate-then-exact-release peer queries with the cold
inventory unchanged, minimal constant/assertion correction under the mandatory one-pass
`scaffold.runtime` gate) are sound, bounded, and regression-pinned. Source implementation of
B1–B3 may begin.

Conditions carried into implementation/IMPL-EVAL (obligations, not new findings): causal mutation/
restored-pass pairs for both adjacent regressions (metadata-loss fixture and argument-form test);
blank-output-as-no-peers handling recorded in the B2 regression; owning-pin workspace-mutator
regression rerun green post-B3 in both modes; the full one-pass `scaffold.runtime --cleanup
--format pretty` gate executed for the scaffold-output change with raw failed gate names preserved
if unavailable; unchanged doc-baseline rows remain DEBT-accepted only by independent evaluator
adjudication; no family/lock/API adaptation beyond the named edits; no merge, publication, or
release claim; `Refs #2036` stays until a fixed published consumer exists; post-publish
`e2e-cli-prod` authority remains owner work.

No release, merge, or publication is authorized or implied by this evaluation.
