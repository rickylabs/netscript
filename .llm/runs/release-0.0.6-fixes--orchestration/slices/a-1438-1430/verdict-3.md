# IMPL-EVAL Verdict (cycle 3) — Slice A / PR #1539 / issues #1438 + #1430

**VERDICT: PASS**

Fresh evaluator: Claude · Fable 5 · medium. Worktree `/home/codex/repos/ns006-f-a-impleval3`
(detached `2a4102600`). Diffed against **merge-base `01aa12b67`**, not `origin/main`. No publication,
tag, canary, push, commit, or merge. Generator worktree `ns006-f-a-release-tooling` untouched
(still `2a4102600`, clean). My worktree ends clean; `deno.lock` unchanged. I did not inherit cycles
1–2's verdicts — every claim below is from a command I ran this session.

---

## Headline answer — can any non-version-bump content be admitted for canary-pair inheritance, through any writer-declared path?

**NO — I could not admit any non-version content through any writer-declared path.** The two prior
holes (prose blob, provenance) are both closed, and I found **no third instance** of the class. I
drove the **real** `verifyGreenCanaryPair` (real git file reads; `generatedOutputsFresh` stubbed —
disclosed below) against seven attack shapes and two fail-closed edge probes:

```
{"scenario":"1-legit-bump","result":"ADMITTED","inheritedSha":"PARENT"}
{"scenario":"2-prose-injection","result":"REJECTED","message":"...agent-docs prose contains non-version changes..."}
{"scenario":"3-provenance-extra-field","result":"REJECTED","message":"...agent-docs provenance contains non-version changes..."}
{"scenario":"4-provenance-sourcecommit-tamper","result":"REJECTED","message":"...agent-docs provenance contains non-version changes..."}
{"scenario":"5-provenance-timestamp-tamper","result":"REJECTED","message":"...agent-docs provenance contains non-version changes..."}
{"scenario":"6-provenance-samever-inject","result":"REJECTED","message":"...changed release manifests beyond the exact coordinated version replacement..."}
{"scenario":"7-provenance-files-tamper","result":"REJECTED","message":"...agent-docs provenance contains non-version changes..."}
{"scenario":"8-prose-new-at-head","result":"REJECTED","message":"git show <parent>:.../prose.json.gz: fatal: ... not in <parent>"}
{"scenario":"9-provenance-new-at-head","result":"REJECTED","message":"git show <parent>:.../provenance.json: fatal: ... not in <parent>"}
```

The cycle-2 shape (provenance-only change, prose untouched, version bumped) is scenarios 3/4/5/7 —
all REJECTED. Same-version provenance injection is scenario 6 — REJECTED. Absent-at-parent for each
anchored input is fail-closed (8/9).

---

## Independent verdict on the 21-row audit table

I read every named writer function in `.llm/tools/generate-publish-assets.ts`,
`.llm/tools/generate-cli-assets-barrel.ts`, and
`.llm/tools/docs/generate-export-surface-corpus.ts`, and traced each output's derivation source.

**The categorisation is correct. I agree with all 21 rows.** The generalised defect class —
*a writer whose `--check` re-reads its own committed output, making the check a tautology* — applies
to exactly two paths, and both are separately anchored to the canary parent.

| # | Path | Audit category | My verdict | Basis |
| ---: | --- | --- | --- | --- |
| 1 | prose.json.gz | Preserved | **agree** | `rebaseAgentDocsProse` reads the committed gzip; anchored by `isExactAgentDocsVersionReplacement` (decompressed == version-rewrite(parent)). |
| 2 | provenance.json | Preserved | **agree** | `refreshAgentDocsProvenance`/`rebaseAgentDocsProse` read committed metadata; closed 8-field schema (`closeAgentDocsProvenance`/`parseAgentDocsProvenance`) + parent-derived equality (`isExactAgentDocsProvenanceReplacement`). |
| 3 | agent-tools.generated.ts | Re-derived | **agree** | `renderAgentToolEmbeddedContent` reads `.llm/tools/consumer-*`, tool sources, cli manifest — all outside the release set → tamper makes the diff non-version-only. |
| 4 | agent-docs.generated.ts | Re-derived from validated inputs | **agree** | `renderAgentDocsEmbeddedContent`→`readAgentDocsEmbeddedBundle` reads prose + provenance (rows 1/2, anchored) + deno.json export map (exact-version). Its `--check` reads OTHER files, not itself — **not tautological** (proven: direct tamper → exit 1). |
| 5 | cli embedded.generated.ts | Re-derived | **agree** | `renderCliEmbeddedContent` from `TEMPLATE_MANIFEST` + `packages/cli` template sources (outside release set). |
| 6 | cli skills.generated.ts | Re-derived | **agree** | `renderSkillEmbeddedContent` from `skills/manifest.json` + skill files (outside release set). |
| 7 | plugin embedded.generated.ts | Re-derived | **agree** | `renderPluginEmbeddedContent` from `PLUGIN_SKELETON_TEMPLATES` + skeleton sources (outside release set). |
| 8 | fresh-ui registry.generated.ts | Re-derived | **agree** | `renderFreshUiRegistryContent` from `freshUiRegistryManifest` + registry files (outside release set). |
| 9 | service scalar.generated.ts | Re-derived | **agree** | `renderServiceEmbeddedContent` from `assets/scalar.min.js` (outside release set). |
| 10 | mcp publish-assets.generated.ts | Re-derived from validated inputs | **agree** | `generateMcpAssets`→`buildMcpEmbeddedDocs` from provenance/prose (rows 1/2) + `packages/mcp/README.md` (outside release set) + mcp manifest. `--check` reads OTHER files — **not tautological** (proven: direct tamper → exit 1). |
| 11 | cli publish-assets.generated.ts | Re-derived | **agree** | `generateCliAssets` from cli manifest + `config-file.v1.json` (outside release set); version-only delta is exact-replacement. |
| 12 | fresh-ui package-metadata | Re-derived | **agree** | `generateFreshUiMetadata` embeds only the version → version delta is an exact replacement, caught before the inexact branch. |
| 13–14 | plugin-sagas/streams-core package-metadata | Re-derived | **agree** | `generateCorePackageMetadata`; version-only embed → exact replacement. |
| 15–20 | plugins/{ai,auth,sagas,streams,triggers,workers} package-metadata | Re-derived | **agree** | `generatePluginMetadata`; version-only embed → exact replacement. |
| 21 | export-surface-corpus.generated.ts | Re-derived | **agree** | `buildExportSurfaceCorpus` from publishable manifests + `deno doc --json` over `packages/**`/`plugins/**` export entrypoints (outside release set). See B-2. |

**Rows 4 and 10 (the flagged "depends on other paths' guards") hold.** Their `--check` re-reads
prose/provenance, never their own output, so the check is a genuine reproduction, not a
self-consistency loop. If prose/provenance *change*, their anchors fire (they are in the changed
set); if they do not change, rows 4/10 reproduce from the already-canary-verified committed inputs.
Confirmed empirically: tampering the committed barrel and mcp asset each fails their `--check`
(exit 1).

**No third instance exists.** The only way a `--check` becomes a tautology is a writer reading its
own committed output; grep/read of all three writer files shows exactly two such writers (prose,
provenance). Every other output derives from either (a) a manifest guarded by exact-version
replacement, or (b) a tracked source **outside** `discoverPreparedReleaseFiles`, whose mutation
makes the diff non-version-only and is rejected before `assertFresh`. Direct tamper of any generated
output is caught by its non-tautological `--check`.

---

## Why the provenance closure is sound (cycle-2 vector)

- Injected extra field: `parseAgentDocsProvenance` requires the key set to equal exactly the eight
  schema keys → returns `undefined` → equality returns `false` → REJECTED (scenario 3). The writer
  `closeAgentDocsProvenance` also drops the field, so `gen:publish-assets --check` independently
  reports the path stale.
- `sourceCommit` / `extractionTimestamp`: `deriveAgentDocsProvenance` builds the expected HEAD
  provenance from the **parent's** `sourceCommit`/`extractionTimestamp`, so any tamper mismatches →
  REJECTED (scenarios 4, 5).
- `files`: must equal both the HEAD prose payload keys **and** the parent's `files` → phantom entry
  REJECTED (scenario 7).
- Integrity fields (`uncompressedBytes`/`compressedBytes`/`sha256`): re-derived from the actual HEAD
  prose bytes, not trusted from the file.
- Same-version tree: `previousVersion === nextVersion` short-circuits both anchors to `false`;
  provenance-only same-version change is rejected upstream as "manifests beyond exact replacement"
  (scenario 6).

## Legitimate v0.0.5-shaped cut still inherits (feature not inert)

Real measured cut `6ec75573d` (0.0.4→0.0.5, 62 changed files incl. prose + provenance + agent-docs
barrel), driven end-to-end through the **real** `verifyGreenCanaryPair` with real git reads over the
worktree's own history (parent `89a4e5f4`, granted green pair):

```
{"result":"ADMITTED","inheritedSha":"89a4e5f4ef169da274e55e20eca54e2b039741bc"}
```

The closed schema and new equality accept a genuine cut; #1438 is not fixed-on-paper. (`scenario
1-legit-bump` above is the synthetic control, also ADMITTED.)

---

## Findings

### Non-blocking N-1 — B-2 corpus determinism carries forward unchanged

`deno task check:mcp-export-corpus` still exits 1 on the clean committed HEAD here:

```
corpus-check-exit=1
```

Cause is the same as cycle 2: mid-milestone source drift (the committed corpus reflects the 0.0.5
cut; `packages/**`/`plugins/**` have since changed on this dev branch), **not** `deno doc`
non-determinism. A real `release:cut` regenerates the corpus, so `assertFresh` would see it fresh.
It is fail-closed (safe) and orthogonal to provenance. I still cannot certify cross-environment
`deno doc` determinism outside pinned deno 2.9.5 linux. Not blocking; does not gate this verdict.

### Non-blocking N-2 — doc-set-changing cuts are conservatively rejected (by design)

`isExactAgentDocsProvenanceReplacement` requires `before.files === after.files`, and the prose
anchor requires HEAD prose == version-rewrite(parent prose). A cut that **adds or removes** an
agent-docs document (rather than only version-rewriting existing ones) would be rejected and would
need its own canary pair. This is the intended "annoying but safe" posture, not a defect — flagged
only so the orchestrator knows a doc-set change cannot inherit.

---

## Gates executed (mine, this worktree)

```
deno test --allow-all .llm/tools/release/                     -> ok | 103 passed | 0 failed
deno test --allow-all .llm/tools/generate-publish-assets_test.ts -> ok | 4 passed | 0 failed
rtk proxy deno task test (full repo)                          -> ok | 3190 passed (617 steps) | 0 failed | 17 ignored
rtk proxy deno task check   (packages/plugins)               -> 2876 files, failedBatches:0, exit 0
rtk proxy deno task lint    (packages/plugins)               -> 0 findings, exit 0
rtk proxy deno task fmt:check(packages/plugins)              -> 0 findings, exit 0
run-deno-check.ts --root .llm/tools/release                  -> 40 files, 0 errors
run-deno-check.ts --root generate-cli-assets-barrel/publish-assets -> 2 files, 0 errors
run-deno-lint.ts  (.llm/tools/release + 2 writers)           -> 42 files, 0 findings
run-deno-fmt.ts   (.llm/tools/release + 2 writers)           -> 42 files, 0 findings
gen:assets-barrel --check (clean)                            -> exit 0 ; (tampered agent-docs barrel) -> exit 1
gen:publish-assets --check (tampered mcp asset)              -> exit 1
check:mcp-export-corpus (clean HEAD)                         -> exit 1 (N-1 source drift, fail-closed)
git status --porcelain                                       -> empty (all tampers restored)
git diff 01aa12b67 HEAD -- deno.lock                         -> empty (lock unchanged)
HEAD                                                         -> 2a4102600 (unchanged)
```

## What I stubbed / could NOT verify

- **`generatedOutputsFresh` stubbed to resolve** in the attack/legit driver (scenarios 1–9 and the
  `6ec75573d` run). Justified: every rejection I claim is produced by the prose/provenance
  **parent-anchor** guards, which run *before* `assertFresh`; and I separately proved the two
  non-tautological components of the real `assertFresh` reject direct tamper against the real
  worktree (barrel `--check` exit 1, publish-assets `--check` exit 1). Reconstructing the full
  three-command `assertFresh` inside a scratch repo needs the whole workspace tree; the real
  worktree's `assertFresh` cannot reproduce a historical tree's outputs (hence the stub, matching
  cycle 2's disclosed method).
- Cross-environment `deno doc` determinism for the export corpus (N-1) — only same-environment
  (deno 2.9.5 linux) is observable here.
- Live GitHub API behaviour of `resolvePreviousTag`/`collectReleaseNotes`/canary-status lookup —
  exercised via injected transports and real git only; no network by constraint.

## #1430 (spot-check) — correct and complete

Unchanged since cycle 2 (no diff to `collectReleaseNotes`/`resolvePreviousTag` this cycle). The
focused suite still passes: `--prev-tag resolves a dated window and queries closed issues`,
`known previous tag with empty since fails loudly before reporting closed issues`,
`explicit previous tag uses release date with commit-date fallback` — all green in the 103-test
release suite.

## Verdict rationale

`PASS`. The audit table is independently correct row-by-row; the two preserved paths (prose,
provenance) are the only tautology-prone writers and both are anchored to the canary parent.
Cycle-1's prose vector and cycle-2's provenance vector (and four further provenance variants) are
all rejected through the real inheritance path; rows 4 and 10 are genuinely re-derived (direct
tamper caught); no third instance of the defect class exists; and the legitimate measured v0.0.5 cut
still inherits — so #1438 is effective, not inert. #1430 is correct and complete. Remaining items
(N-1 corpus determinism, N-2 doc-set-change conservatism) are fail-closed and non-blocking.
```
