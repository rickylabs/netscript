# PLAN-EVAL — #1102 intent-aware MCP capability discovery (PR #1404)

| Field     | Value                                                                 |
| --------- | --------------------------------------------------------------------- |
| Verdict   | **FAIL_PLAN** (cycle 1 of 2)                                          |
| Evaluator | Claude · Fable 5 · medium — separate session (`formal_plan_evaluation`) |
| Generator | Codex · GPT-5.6 Sol · medium (PR #1404, `c0bdb02c3` + `59ac3b9b2`)    |
| Baseline  | `origin/main@3f41a3639`, branch `fix/mcp-intent-aware-discovery`      |
| Date      | 2026-08-09                                                            |

One-line verdict: the plan is research-sound — every load-bearing claim I opened held, byte-exactly —
but it locks `llms#task-router` as an evaluation rank-1 while leaving undecided how the filesystem
corpus can ever index `llms.txt`, an open decision that conflicts with the plan's own non-scope and
would force cross-slice rework or ship a filesystem/embedded behavioral divergence the issue forbids.

All evidence below was gathered against `origin/main@3f41a3639` via `git show` extraction (the
evaluator's local checkout predates #1375 and was not used as evidence).

## Findings

### Major

**M1 — Open, unflagged decision: how does the filesystem corpus index `llms.txt`?**

- Evidence:
  - `packages/mcp/src/infrastructure/filesystem-docs-corpus.ts` at `3f41a3639`: `walkMarkdown` /
    `walkMarkdownSync` admit only `extname(entry.name).toLowerCase() === '.md'` (lines 137, 177);
    `normalizeSlug` strips only `.md` (line ~350). `grep -n "llms\|txt"` over the file: zero hits.
  - The installed docs root (`agent init --with-docs` → `<project>/.netscript/docs`, the
    `resolveDocsRoot` probe target) contains `llms.txt` as a root-level `.txt` file
    (`init-agent.ts` line 27: "start at `.netscript/docs/llms.txt`"; bundle contains
    `llms.txt` — verified by decompressing `.llm/assets/agent-docs/prose.json.gz`, 166 files).
  - `plan.md` "Expected evaluation destinations" locks `llms#task-router` as rank-1 for
    "build a real service-backed UI"; D9 runs the evaluation "against the generated release
    selection" — i.e. the embedded corpus, where the generator can assign slug `llms`.
  - `plan.md` Non-scope: "No rewrite or semantic change to `search_docs`, `get_doc`,
    corpus-root precedence".
  - Issue #1102, Retrieval requirements: "filesystem and embedded corpora must behave the same";
    Summary: "The task router … should become input to this flow, not remain a separate text
    artifact agents must happen to read."
- Why this fails the gate: with the `.md`-only walker, the filesystem corpus — the primary real
  deployment after `agent init --with-docs` — can never return `llms#task-router`, while the
  embedded fallback can. Every planned gate can go green anyway: the D9 evaluation is embedded-only,
  and the S3 parity test on "identical real release sources" either silently drops `llms.txt`
  (walker skips it, parity trivially compares 12 docs) or fails outright — the plan does not say
  which. Fixing it means the filesystem adapter indexes a `.txt` file with a generator-consistent
  slug, which changes `list_docs.documentCount` and `search_docs` results for filesystem corpora —
  colliding with the plan's stated non-scope. This is exactly an open decision that forces rework
  when deferred (Plan-Gate: open-decision sweep → `FAIL_PLAN`), and none of `plan.md`'s six
  open-decision rows names it.
- Required change (one plan amendment, no new research needed):
  1. Add a locked decision (D12) naming the mechanism by which `llms.txt` becomes a corpus document
     in **both** adapters (e.g. the walker additionally admits a root-level `llms.txt` with slug
     `llms`, matching the generator's embedded slug), or explicitly scope task-router routing as
     embedded-only with a stated justification against issue row 5 and the task-router-as-input
     requirement.
  2. Amend Non-scope with the corresponding carve-out (indexing `llms.txt` is a deliberate,
     bounded surface change to `list_docs`/`search_docs` for filesystem corpora — name the tests
     that lock it).
  3. Extend the S3 parity/evaluation gates so the `llms#task-router` row is exercised against the
     filesystem adapter too (write the release sources including `llms.txt` to a temp root), so the
     divergence class cannot pass silently.

### Minor

**m2 — F4's evidence pointer is broken (results themselves verified true).**
`research.md` F4 says "Run the recorded `deno eval --unstable-kv` query sweep in this worklog" —
no such command is recorded in `worklog.md` or anywhere in the run dir; only the results table
exists. I reproduced the sweep independently (faithful replica of `rankDocument`'s ×12/×5/×1
occurrence scoring over the 166-document mirror): all six rows confirm — e.g.
"add a capability NetScript does not ship" → `reference/workers | reference/fresh |
durable-workflows/sagas | explanation/aspire | observability/telemetry` (matches recorded row
exactly); "avoid hitting my service every render" → `web-layer/query` absent from top five
(confirmed). Fix: check the actual sweep command into the run dir so IMPL-EVAL can rerun it.

**m3 — The Prisma intent's expected top-3 are nested, content-overlapping sections.**
`parseSections` ends a section at the next heading of equal-or-lower level, so the h3
"Unsupported by NetScript…" (source line 245) contains the full text of its h4 children
"3. Application-owned responsibilities" (291) and "4. Decision rule…" (301). The locked order
(parent first, children after) is fragile under the locked BM25 length normalization
(`b = 0.75` penalizes the longest section, which is the parent). Not a falsity — the plan's
drift rule covers a defensible re-ordering — but the plan should either acknowledge this row as
the one most likely to trigger that drift procedure or justify the parent-first expectation.

## Verified true (do not re-litigate in cycle 2)

Each verified by opening the file at `origin/main@3f41a3639` or by execution:

- **Acceptance rows**: `gh issue view 1102` live body matches the plan's seven quoted rows verbatim.
- **F1**: `docs-corpus-port.ts` — port has only `list`/`search`/`get`; `DocsSection` has no
  code/link fields.
- **F2/F3**: `filesystem-docs-corpus.ts` — `processDocsSources` (184), `rankDocument` (327):
  flat whole-document occurrence counting, title ×12 / headings ×5 / body ×1, one snippet;
  embedded adapter imports the shared functions.
- **F4**: pre-fix sweep independently reproduced; the evaluation corpus is a real discriminator —
  four issue intents miss their destinations in the current top five, and expectations were fixed
  from source reading, not runtime output (D9 + drift rule bind this).
- **F5/F13**: `MCP_EMBEDDED_DOC_PATHS` (5 paths) and `MCP_EMBEDDED_DOCS_MAX_BYTES = 262_144` at
  `generate-publish-assets.ts:12-21`; provenance records `sourceBytes: 79292`, `documentCount: 5`.
  Decompressed the checked-in mirror: the second-database twin **lacks** the
  "Unsupported by NetScript, supported by Prisma" heading present in current source (line 245) —
  the staleness claim is true. Byte projection reproduced exactly: 13-doc mirror total 236,997;
  +6,225 source growth → 243,222; 18,922 under budget.
- **F12**: `/home/codex/repos/.briefing/build-docs-bundle.sh` exists (executable);
  `.llm/tools/docs/build-agent-docs-bundle.ts` validates `llms.txt` presence, the `## Task router`
  marker, and MANIFEST provenance before writing prose + provenance.
- **F6**: task router is generated into `llms.txt` (`ai-tooling.ts:468-480`, "## Task router").
- **F7**: `MCP_AGENT_INSTRUCTIONS` routes `search_docs` only for hang symptoms; generated
  `AGENTS.md` section is symptom-routed; no intent-guidance instruction exists — the activation
  REDs are behavioral and real.
- **F8**: `TOOL_NAMES` has exactly 21 entries; `stdio_test.ts:44` and
  `agent-mcp-stdio_test.ts:128` assert 21; README says "21 token-bounded tools" — the count-lock
  REDs are real.
- **F9**: `scan-code-quality.ts:18` `DEFAULT_ROOTS = ['packages/cli/src', 'plugins']`; root
  `arch:check` root list contains no `packages/mcp`. The plan correctly names package-scoped
  commands decisive and aggregates non-decisive (#1403 honored).
- **15 destinations**: all 14 file-backed headings exist in current source with slugs matching
  `slugifyDocsHeading` (em-dash, commas, parens, `/`, backticks all verified against the actual
  regex); built twins preserve the headings (spot-checked 5, including "Step 2 — Add the
  cache-first query factory"); `llms#task-router` exists in generated output.
- **D5 substrate**: mirror pages contain 18 Prerequisites / 11 Next steps / 12 Related /
  15 See also / 38 "Before …" headings — relation inference has real material.
- **D6 substrate**: source pages use raw `{{ comp.tabbedCode({ tabs: [...] }}` (e.g.
  `use-a-second-database.md:67`) while built twins render the same content as plain fences
  (verified in the mirror twin) — the dual-form parsing rationale is coherent.
- **Failure matrix**: every row is labelled behavioral or compile-time; each behavioral row's
  pre-fix state was confirmed against the tree (no double-counted REDs; 13 distinct tests, 13
  distinct pre-fix states).
- **Row-7 boundary**: Non-scope, pr-body, and risk register all state retrieval-quality-only;
  no #1090 row is claimed.

## Plan-Gate checklist

- [x] Research present and current — re-baselined at `3f41a3639`; spot-checks above all held.
- [x] Decisions locked — D1–D11 with rationale; numeric policy and bounds locked in `worklog.md`.
- [ ] **Open-decision sweep — FAILED.** The `llms.txt` filesystem-indexing decision (M1) is open,
      unlisted, and forces rework when deferred.
- [x] Commit slices — 5 ordered slices, each with proof, gate, and files.
- [x] Risk register — present with mitigations.
- [x] Gate set selected — package-scoped decisive commands; aggregates recorded non-decisive;
      `doc:lint` over all three exports; package + root `publish:dry-run`; docs overlay gates;
      serialized `scaffold.runtime` by token request only, with the 2026-08-09 any-AppHost-or-
      container clarification stated.
- [x] Deferred scope explicit — embeddings, multi-hop, adoption (#1090), corpus plumbing (#1375/#1376).
- [x] jsr-audit — surface scan over all three exports; cardinality 14/16 and slow-types banner
      named as baseline with a folder-grouping mitigation; no closure claim.

## Verdict

`FAIL_PLAN` — return to Plan & Design for the M1 amendment (plus the two minors at the generator's
discretion). Cycle 1 of 2. The research base, discriminator design, failure matrix, gate selection,
and boundary handling all held under adversarial checking; the required fix is one contained design
decision and its test consequence, not a re-plan.

## Cycle 2

| Field     | Value                                                                    |
| --------- | ------------------------------------------------------------------------ |
| Verdict   | **PASS**                                                                 |
| Evaluator | Claude · Fable 5 · medium — same separate session as cycle 1             |
| Repair    | `271428de5` (plan repair), `7ab78fbef` (handoff); run-dir files only     |
| Date      | 2026-08-09                                                               |

One-line verdict: D12 closes M1 with a rule both adapters and the generator share, every repair
claim I opened or executed held — including running the checked-in sweep against the production
adapter and reproducing the recorded table row-for-row — and the loosened Prisma expectation is
still a discriminator; the plan passes.

Evidence discipline: the evaluator checkout still predates #1375, so as in cycle 1 no worktree file
was used as evidence — everything below is from `git show` extraction at `origin/main@3f41a3639` or
from the PR branch, with the sweep executed against a `git archive` extraction of `origin/main`.
`git diff --stat c0bdb02c3..271428de5` confirms the repair touches only
`.llm/runs/.../w3-b1-1102/` — no product source changed.

### Disposition of cycle-1 findings

| Finding | Disposition | Evidence |
| ------- | ----------- | -------- |
| **M1** (open `llms.txt` filesystem decision) | **Closed by D12.** | Plan locks admission of `.md` plus exactly `relativePath === "llms.txt"`; one shared normalizer strips `.md`/`.txt` so both adapters address `llms`; the publish generator mirrors the rule (S3 gate: "generator emits `llms` from `llms.txt`"). New research F14 documents the pre-fix divergence with correct cites — verified: `slugFromPath`/`normalizeSlug` at `filesystem-docs-corpus.ts:380-388` strip only `.md`; `docsSlugFromPath` at `generate-publish-assets.ts:224-226` strips only `.md`, so `llms.txt` would today become embedded slug `llms.txt`. The Non-scope carve-out is stated, not implied: "Narrow exception: `search_docs`' filesystem source universe intentionally gains root `llms.txt`, canonicalized as `llms`". Open-decision sweep gains a Resolved row; drift watch gains the disagreement trigger; drift.md records the cycle-1 defect append-only. |
| **m2** (F4 evidence pointer broken) | **Closed by execution.** | `pre-fix-query-sweep.ts` is checked into the run dir and imports the production `FilesystemDocsCorpus` (not a replica). I ran the exact recorded command against a `git archive` extraction of `origin/main`: exit 0, six JSON rows, matching the recorded table row-for-row (e.g. Prisma intent: `reference/workers 3523, reference/fresh 3247, durable-workflows/sagas 3119, explanation/aspire 2346, data-persistence/database 2345`; "avoid hitting my service every render" top five contains no `web-layer/query`). |
| **m3** (nested Prisma sections, fragile exact order) | **Closed by constraint change, discriminator preserved.** | D9 now requires the Prisma row's three named sections as an **unordered required top-three set** — i.e. the top three must be exactly that set, so any regression admitting a foreign section still fails; only the internal order of the three overlapping sections is freed, which is precisely the part BM25 length normalization could not justify. The other four rows keep exact order; per-adapter byte-for-byte repeatability is retained. |

### Coordinator questions, answered with evidence

1. **D12 closes M1** — yes; same slug from both adapters via the shared `.md`/`.txt` normalizer
   plus generator mirroring, carve-out explicit (verified above).
2. **Semantic change honestly declared** — yes; the Non-scope narrow exception names the
   `search_docs` filesystem source-universe change. `list_docs.documentCount` moves as a derived
   consequence and is not named verbatim; non-blocking, because the count-locked tests that would
   move are inside the plan's own slice files (F14 cites `init-agent_test.ts:655-678`;
   `packages/mcp/tests/` is S1–S3 scope), so the shift cannot land silently. Recommend the S2
   slice comment name the `documentCount` change explicitly.
3. **Negative controls are real** — the rule is positive exact-path admission, so exclusion is by
   construction, and the controls are not fixture inventions: verified at
   `init-agent_test.ts:655-678` that every installed root really contains `llms-full.txt` and
   nested `deno-doc/config.txt`, so the installed-corpus smoke exercises the exclusions in the
   real deployment; S2's `docs-source-policy_test.ts` covers async and sync walkers.
4. **The stdio smoke exercises the deployment path and can fail** — S4's gate runs real
   `agent init --with-docs`, then a real `agent mcp` stdio process against `.netscript/docs`
   (no AppHost/container), requiring rank-1 `llms#task-router`. Concrete pre-fix failure verified:
   today's `agent-mcp-stdio_test.ts` hand-writes a single `workers.md` (lines 42-45), asserts
   `docs.count === 1` / slug `workers` (138-139), and never calls `find_guidance`; and the
   pre-D12 filesystem walker cannot see `llms.txt` at all, so the smoke cannot return the required
   rank-1 before the fix.
5. **Byte-identical release files** — D9: "Every row runs against both filesystem and embedded
   adapters over the same release files"; S3: "run both adapters over byte-identical real files"
   with the materialized-filesystem run listed in the proving gate. The claim is stated as a locked
   gate condition, and slug equality across the two paths is what D12's shared normalizer
   guarantees, so parity is a comparison of the same corpus, not two corpora agreeing by luck.
6. **Prisma row still discriminates** — see m3 disposition; a genuine retrieval regression
   (foreign section entering the top three, or a required section falling out) still fails the row.
7. **Nothing broken** — the repair strengthened validation rows 1–2 (dual-adapter + installed-
   corpus expectations), added the source-policy failure-matrix row with a real behavioral RED,
   left the settled cycle-1 facts (15 citations, gate table rows 3–16, token language, counts,
   row-7/#1090 boundary) untouched, and honestly recorded in the worklog that the cycle-1
   evaluator artifact was not on the PR branch rather than fabricating it.

### Plan-Gate checklist (cycle 2)

- [x] Research present and current — F14 added with verified cites; sweep now reproducible and
      reproduced.
- [x] Decisions locked — D1–D12.
- [x] **Open-decision sweep — now passes.** The cycle-1 gap is a Resolved row; no remaining open
      decision forces rework.
- [x] Commit slices — 5 ordered slices; S2–S4 updated coherently with the new policy and gates.
- [x] Risk register — new `.txt`-broadening risk row with async/sync walker-test mitigation.
- [x] Gate set selected — unchanged where settled; rows 1–2 strengthened.
- [x] Deferred scope explicit — unchanged.
- [x] jsr-audit — unchanged; no new public-surface consequence from D12 (source policy is
      adapter-internal; the normalizer ships inside existing modules).

### Verdict

`PASS` — implementation may begin at S1. Binding conditions carried to IMPL-EVAL: the four exact
orderings and the Prisma unordered set may not be rewritten to match observed output without
recorded drift and evaluator approval; the `llms#task-router` row must pass embedded, materialized-
filesystem, and real `agent init --with-docs` stdio paths; aggregates remain non-decisive for
`packages/mcp`; no AppHost/container run before a token grant.
