# Drift Log: listener readiness diagnostics

## 2026-09-02 — Service overlay references absent

- **What:** The selected service overlay names `.claude/04-services.md` and `.claude/06-infrastructure.md`, but this baseline has no `.claude/` directory.
- **Source:** filesystem read during harness bootstrap.
- **Expected:** Both overlay references exist.
- **Actual:** Neither path exists; the checked-in Aspire skill and focused code are available.
- **Severity:** minor
- **Action:** accept for this slice; do not expand scope to documentation repair.
- **Evidence:** `.llm/harness/archetypes/SCOPE-service.md`; `test ! -e .claude`.

## 2026-09-02 — Emitted helper source path differs from ceiling wording

- **What:** The brief groups the emitted listener helper under `templates/aspire/helpers/**`, while its source is the existing asset `packages/cli/src/kernel/assets/aspire/helpers/_aspire-compat.ts.template` and canonical generation may update `embedded.generated.ts`.
- **Source:** `rg _aspire-compat.ts.template packages/cli/src`.
- **Expected:** Helper implementation beneath the templates helper subtree.
- **Actual:** Tests/generator live beneath templates; emitted helper source and carrier live beneath assets.
- **Severity:** minor
- **Action:** treat the existing helper asset and its mechanically generated carrier as the intended helper scope; do not add files.
- **Evidence:** `packages/cli/src/kernel/assets/aspire/helpers/_aspire-compat.ts.template`; `gen:assets-barrel` task references.

