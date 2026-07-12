**Superseded-in-execution** (owner-ratified, 2026-07-06).

This slice's scope has been expanded and is being executed by a dedicated design run — see tracking issue #507 (Backlog / Triage) and draft PR branch `feat/dashboard-design-prototype` (run dir `.llm/runs/feat-dashboard-design-prototype--design/`).

Scope changes vs the filed DDX-15:

- Expanded from ".design-sync artifact + Fresh panel-shell prototype" to a **full E2E Claude Design prototype** (shell + 7 panels + 4 capability sections, light/dark) on a **new** design system synced at 100% parity from current fresh-ui, plus a **production-grade reusable sync system** at `tools/design-sync/`.
- The DDX-0 → DDX-15 dependency is **inverted**: prototype pass 1 validates/amends the DDX-0 L3 promote-set before DDX-0 is implemented (eis-chat two-pass loop).
- Artifacts land at `resources/design/dashboard/` and migrate to `plugins/dashboard/.design-sync/` when DDX-2/DDX-4 create the plugin.

This issue stays open as the beta.6 tracking point; the run's PR carries `Closes #425` and resolves it on merge. **DDX-5 (#415) and all panel slices are blocked on that delivery.**
