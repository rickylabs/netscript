# Drift Log: published JSDoc internal-codename cleanup

Drift is append-only.

## 2026-08-12 — Broader JSDoc census than dispatch examples

- **What:** The exact JSDoc-block census found 26 tokens in 14 files across two packages: nine
  `Group X` and seventeen `Tn` tokens.
- **Source:** Comment-block scan of non-generated `.ts`/`.tsx` under `packages/*/src` and
  `plugins/*/src`.
- **Expected:** Dispatch measured six `Group X` files across three packages and ten trigger-core
  tokens, while warning that the broader `Tn` pattern needed classification.
- **Actual:** Published saga-core subpath JSDoc contains additional planning-tier prose; CLI's match
  is not JSDoc.
- **Severity:** minor
- **Action:** fix every JSDoc occurrence within scope and report exact package/token counts.
- **Evidence:** `research.md` baseline census.

## 2026-08-12 — Executable-string matches excluded by hard boundary

- **What:** Two raw codename matches are not comments:
  `packages/plugin-sagas-core/src/contracts/v1/sagas.contract.ts` describes `T1` deduplication in a
  Zod schema string, and
  `packages/cli/src/maintainer/features/release/eject/producer-root-files.ts` emits `Group B` in a
  generated CONTRIBUTING file.
- **Source:** Raw repo-wide source grep followed by context inspection.
- **Expected:** Scope is prose inside comments only; any executable-statement change under
  `packages/**` is a hard stop.
- **Actual:** Fully eliminating raw codenames would require executable-statement changes.
- **Severity:** significant
- **Action:** defer to the orchestrator for an explicitly authorized follow-up/rescope; leave both
  statements unchanged and exclude them from the JSDoc-only negative test.
- **Evidence:** Exact paths above; final raw census will preserve these two deliberate exclusions.
