# S8b worklog

## Owner routing grant

"Run PLAN-EVAL and IMPL-EVAL with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Fix once."

This explicit owner override selects native Claude over the feature matrix evaluator cells, preserves session and vendor independence, and caps repair at one. The pinned matrix was inspected with `deno task agentic:matrix --tier feature --json` before implementation. Implementer is the dispatched Codex session at requested high effort.

## Preflight

No duplicate PR found for #2436. Source specification PR #2427 is merged. Initial worktree was shallow and older than main; fetched history and fast-forwarded without rewriting commits. Consulted existing project memory (public docs prose, Utility default, dark scheme design). RTK is absent: underlying commands will be used. No exposed memory or NetScript MCP tool is attached; inspect the configured stdio source before planning.

## Design

1. Public surface: /design-system/, /guidelines/, /token-contract/, /create-your-own-theme/ beneath that root, and /themes/<id>/ for all eleven themes, with local section navigation and links from the existing reference.
2. Vocabulary: theme = visual language; flavor = one of Studio's seven presets; scheme = light/dark; value tables = complete source front matter rendered as inspectable data; no new framework token names.
3. Ports: source text reader (Deno readFile/readDir), Markdown rendering callback (Lume configured renderer), YAML parser (upstream), generated page records (Lume).
4. Constants: section/source/asset roots, required metadata groups, supported schemes; infer theme ids and Studio flavor labels from canonical content rather than duplicating the specification.
5. Commit slices: bootstrap run record (this directory; file review); complete generated section + canonical image import (~10 executable/presentation files plus 34 immutable assets; fixture/corpus tests and Pages gates); final evaluator/gate/browser evidence (run directory only; review exact diff/head). Update worklog/context pack in every slice. Publish a per-slice PR comment with hashes and results.
6. Deferred scope: shared S8 layouts/styles/navigation, S1 token runtime, S2/S9 registry distribution; no duplicated specification prose or API inventory.
7. Contributor path: docs/site/_plugins/design-system/README.md (generator source and extending guidance); maintainers add/edit canonical docs/design-system files and gallery pairs.
