# IMPL-EVAL (delta2) — FAIL_FIX

Head `cf43a85c4` = `pr/1949` (confirmed). Delta `be6a4d471..cf43a85c4` is exactly one commit touching only `packages/cli/CHANGELOG.md` (+4/−1), extending the #1759 bullet. Mechanical gates all pass; one clause of the new sentence overclaims receipt-backed re-verification.

## Findings

1. **OVERSTATED — `aspire mcp tools` / `aspire mcp call` listed as re-verified** (`packages/cli/CHANGELOG.md:103-106`). The sentence folds both into the "re-verified against Aspire CLI 13.5.3 (…)" parenthetical and asserts "receipt keys linking each re-verified command to its smoke evidence." Neither command carries an S2/S9 evidence key anywhere in the shipped skill — `skills/aspire/SKILL.md:45` (table row, untagged) and `:233` (behavioral description, untagged) — and the skill's own scoping rule (`skills/aspire/SKILL.md:12-13`: only S2/S9-keyed statements are re-verified) therefore excludes them. No receipt in the tree at `88fc6d69d` exercises either subcommand: the S9 receipt `aspire-13.5.3-mcp-tools-static.json` has `entryPoint.args: ["agent","mcp"]` (i.e. it captures the `agent mcp` server surface, not the `mcp tools`/`mcp call` CLI subcommands), and `git grep 'aspire mcp (tools|call)'` over `88fc6d69d:.llm/runs/` and `skills/` returns nothing outside the skill prose. Minimal fix: drop the pair from the re-verified parenthetical, or reword them as documented/named rather than re-verified (e.g. "…re-verified against Aspire CLI 13.5.3 (`aspire agent mcp`, the `aspire resources` alias, `healthReports` as an object)…; `aspire mcp tools` / `aspire mcp call` are documented but unreceipted" — the skill itself draws exactly this line at `:233`).

2. **VERIFIED — re-verification claim for the shipped pair.** `skills/aspire/SKILL.md:12` ("…re-verified against **Aspire CLI 13.5.3**") and `skills/help.md:7` ("Aspire-specific commands here were re-verified against **Aspire CLI 13.5.3**; see the receipt index in `aspire/SKILL.md`") at `88fc6d69d`. The skill scopes the claim to S2/S9-tagged statements, which the changelog's parenthetical respects for the other items.

3. **VERIFIED — `aspire agent mcp`.** `skills/aspire/SKILL.md:207-211` (AppHost-mode argv observed in the 13.5.3 JSON-RPC capture, keyed S9-STATIC + S9-AGENT-MCP-HELP); `skills/help.md:50`. Receipts committed at `88fc6d69d`: `.llm/runs/fix-aspire-13-5-s9-skills-mcp-alignment--impl/receipts/aspire-13.5.3-agent-mcp-help.json` and `aspire-13.5.3-mcp-tools-static.json` (`cliVersion: 13.5.3`), plus S2-V8 (`aspire-13.5-verification.md:15`).

4. **VERIFIED — `aspire resources` alias.** `skills/aspire/SKILL.md:30` (table row tagged S2-V11) and `:48-49` ("`aspire resources` is a 13.5.3 alias of `aspire describe`… (S2-V11)"); receipt `03-v11-resources-alias.json` exists and is indexed at `skills/aspire/SKILL.md:306-307`.

5. **VERIFIED — `healthReports` as an object.** `skills/help.md:25` ("`healthStatus: Healthy` with an empty `healthReports` object…"; also :30, :35); `skills/aspire/SKILL.md:57-71` (`.healthReports|length`; "`healthReports: {}` means no check ran").

6. **VERIFIED — receipt-key mechanism (for the genuinely keyed commands).** All 11 keys used in the body (S2-V2/V4/V6/V7/V8/V9/V10/V11, S9-STATIC, S9-DOCS-API-HELP, S9-AGENT-MCP-HELP) resolve in the "13.5.3 evidence" index at `skills/aspire/SKILL.md:286-312`, and the referenced receipt files are committed (S9 trio confirmed via `cat-file`; the S2 run dir is committed at `88fc6d69d`). Caveat folded into finding 1: the sentence's own parenthetical would count `aspire mcp tools`/`mcp call` as "re-verified commands," and they have no keys.

## Gates

- Scope: delta touches only `packages/cli/CHANGELOG.md` — PASS
- Lines ≤ 100 cols: zero lines > 100 in the file at head — PASS
- `git diff --check be6a4d471 cf43a85c4`: clean — PASS
- `deno task check:publish-assets` on `cf43a85c4`: exit 0 — PASS

Scratch worktree `/tmp/ns-1949-delta2` removed.
