# Research

- Main and branch baseline: `2f426b970d7a00bdbeb09c59b72b49478b839a5a`; fetched main before planning.
- Issue #2385 remains open. Its body uses prose requirements, with no Acceptance checkboxes. No orchid-triage comment or competing fix PR was found; PR #2292 returned by issue search is an unrelated workers contract change.
- Consulted prior run memories for docs build, validation wrappers, and environment limitations before code inspection. RTK is unavailable; Deno 2.9.7 and Claude CLI are available.
- NetScript MCP `find_guidance` called with this docs correction intent, then `search_docs` for `plugin update`. Guide/reference source plus the public CLI implementation provide the exact command contract.
- `packages/cli/src/public/features/plugins/update/update-plugin-command.ts` declares `<name:string>`, re-pins through installPlugin, walks contributions, stages writes, regenerates registries, then commits. It is host-owned installed-name behavior, not published-plugin CLI dispatch.
- Complete `docs/site` search finds the rejected package-specifier example and misleading `<pkg>` wording only in `orchestration-runtime/how-to/add-a-plugin.md`. `reference/cli/commands.md` and `cli-reference.md` already use `<name>`.
- Existing `docs:snippets` walks Markdown and Vento source via snippet-policy.ts, excluding generated/ignored directories. It currently checks TypeScript fences, so merely checking shell fences would miss the actual HTML table regression.
- Pages CI runs `docs:snippets` before build/link checks. Extend this gate without a new workflow or root task.
- Lume emits page Markdown twins and llms-full.txt through docs/site/_plugins/ai-tooling.ts; the docs bundle consumes these. Correct CLI guidance in source propagates to both outputs.
- The stored CLI docs carrier is generated under packages/cli, outside the owner's docs-only write surface. Required quality checks can expose this existing workflow/scope conflict. Do not exempt freshness or modify packages; record any unproven check honestly.
