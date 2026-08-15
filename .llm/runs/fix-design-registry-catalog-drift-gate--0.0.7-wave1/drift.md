# Drift Log: generated design registry catalog drift gate

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-15 — frontend overlay legacy pointer absent

- **What:** The frontend overlay's additional-read list names `.claude/05-frontend.md`, which does
  not exist in this checkout.
- **Source:** `rg --files . | rg '/05-frontend\\.md$|frontend\\.md$'` returned no matching
  authority file.
- **Expected:** `.llm/harness/archetypes/SCOPE-frontend.md` lists the file as an additional input.
- **Actual:** Fresh 2.x guidance and the fresh-ui L0/theme authority chain are present and were read.
- **Severity:** minor
- **Action:** accept for this leaf; no implementation decision depends on the missing pointer.
- **Evidence:** `.agents/skills/deno-fresh/SKILL.md`,
  `.agents/skills/fresh-ui-horizontal/l0-conventions.md`,
  `.agents/skills/fresh-ui-horizontal/theme-authoring.md`, `packages/fresh-ui/README.md`.

## Significant — coordinator contract amendment for Tier-A finding T-3

Severity: **significant**. Recorded by topic orchestrator `topic-fixes-0.0.7` on coordinator
disposition, at leaf head `5fe60023530d89b888a028d5269909636ac03b8a`.

### Why the frozen surface could not express the fix

Tier-A finding T-3 established that the landed drift gate never runs on CLI-side edits. Traced end
to end:

1. `packages/fresh-ui/tests/registry-doc-drift.test.ts` executes **only** through
   `.github/workflows/fresh-ui-quality.yml`. `.github/workflows/ci.yml` contains no reference to
   `fresh-ui` at all.
2. That workflow's `pull_request` and `push` `paths:` filters cover `packages/fresh-ui/**` plus a
   few tool/config paths, and do **not** include
   `packages/cli/src/kernel/assets/app/routes/(design)/**`.
3. `.github/scripts/ci-classify-changes.ts` sets `freshUi: path.startsWith('packages/fresh-ui/')`,
   so a CLI design-asset path classifies as `desktop`/`surface`, never `freshUi`.
4. The root `deno task test` cannot compensate: `packages/fresh-ui` is **not** a member of the root
   workspace (it carries its own lock, which is why its suite runs with
   `--lock=packages/fresh-ui/deno.lock --frozen`).

Consequence: a later PR editing only the generated catalog template re-introduces exactly the
50-of-66 drift this leaf exists to eliminate, with no CI signal — on the very surface that drifted.

### Why this is an amendment rather than a re-scope

Issue #1358's acceptance carries a **close-gated** `gate:` box requiring the drift gate to run on
changes to the manifest **or the CLI design assets**, and PR #1657's body carries `Closes #1358`.
The coordinator explicitly declined to weaken or re-scope the box, drop the closing keyword, or
defer a knowingly false CI surface. The gate must therefore genuinely cover both sides.

### Amended surface — exactly three files, nothing else

The original four product surfaces remain in force and unchanged in ownership. Added:

1. `.github/workflows/fresh-ui-quality.yml`
2. `.github/scripts/ci-classify-changes.ts`
3. `.github/scripts/ci-classify-changes.test.ts`

No other file enters the contract. The repair is bounded to CI-ownership wiring plus its focused
tests; it must not touch the four product files, the locks, the issue closing semantics, the
draft/`status:impl` lifecycle, or any prior evidence.

### Gate proportionality for the repair

Cheap classifier/workflow-structure tests plus the existing drift/check/quality/arch gates only.
`fresh-browser`, Aspire, Docker, and any expensive lease are **explicitly out of scope** — the
singleton lease is consumed and its `PASS` receipt at product head `4a3c40321` remains valid because
the repair changes no product file.
