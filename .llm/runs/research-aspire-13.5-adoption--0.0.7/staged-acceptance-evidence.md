# Staged acceptance evidence — text ready, blocks NOT yet postable

**Why nothing is posted yet.** `validateEvidenceMapping` requires an entry for **every unchecked
close-gated box** on an issue — *"unchecked box … has no matching evidence entry"*. A partial
```acceptance-evidence``` block therefore **fails validation**, so these cannot be posted until each
issue's remaining boxes are evidenced. What is staged here is the *evidence text*, so the block is
assembled at ready-flip rather than composed under time pressure.

**Order of operations, unchanged:** evaluator PASS → post the complete block → apply exactly
`status:ready-merge` → `gh run rerun <run-id>` on the **unchanged head** so the mirror's live reads see
the label. Never hand-tick; never push to re-trigger CI (that moves the head and voids the exact-head
verdict).

## #1720 (S8, PR #1754) — 6 boxes: 2 ready, 4 lease-gated

| Box | State | Evidence text |
| --- | ----- | ------------- |
| A1 `aspire resource <db>-cli --help` lists typed commands | **lease** | — |
| A2 `migrate --timeout 60` succeeds; `reset` refuses without `--confirm true` | **lease** | — |
| A3 `.excludeFromMcp()` exactly on the `<db>-cli` resources | **READY** | `generate-db-cli-mode_test.ts` — exact-count assertion `output.match(/\.excludeFromMcp\(\)/g)?.length` plus a placement check via `output.indexOf`; corroborated by `generated-helpers-compile_test.ts` and `generators-tools-db-index_test.ts` |
| A4 `netscript db init` against Unhealthy-but-Running Postgres exits bounded | **lease** | verifier repaired to the canonical `db init --project-root <root> --db <db> --name init`; IMPL-EVAL confirmed it routes through `executeOnAppHost → waitForDatabase` |
| A5 `scaffold.runtime` green both tiers; no second AppHost during `db` ops | **lease** | — |
| A6 `PROCESS_COMMANDS_FLAG` seam + its version comment removed | **READY** | grep at head: `PROCESS_COMMANDS_FLAG` → **0** files in `packages/cli/src`; `maybeWithProcessCommand` → **0** files in `packages/cli`. The lone `Aspire 13.4` hit is `render-ts-apphost.ts:81`, a tsconfig-validation comment, not the seam's |

## #1719 (S7, PR #1744) — 3 boxes: 1 ready, 2 must be RE-TAKEN

| Box | State | Evidence text |
| --- | ----- | ------------- |
| Reproduction from #1429 (kill CLI, leave descendants) | **lease — re-take** | previously captured at `bd3dbc843`; **that head has moved**, so the manifest's "re-verify only if the head moves" condition is met |
| Foreign AppHost reported, never mutated | **lease — re-take** | same |
| `Will close (via its PR) #1429` | **READY** | #1744 body line 11 carries `Closes #1429`; its DoD records the close-gate verification for both #1719 and #1429 |

## #1721 (S9, PR #1759) — 6 boxes: 1 ready

| Box | State | Evidence text |
| --- | ----- | ------------- |
| `git grep '13\.4\.6'` over skills / `.agents/skills` / `.claude/skills` / CLI assets → 0 | **READY** | **0** hits at the slice head |
| `agent.aspire-mcp-smoke` green both tiers | **lease** | — |
| `receipts/aspire-13.5-mcp-smoke.json` committed | **lease-produced** | gate implementation exists (`run-aspire-mcp-smoke.ts`, `aspire-mcp-smoke.ts`, `aspire-mcp-smoke_test.ts`); the receipt does not |
| check tasks green / `agent init` / docs_audit | pending | — |

## #1723 + #1642 (S11, PR #1771) — 8 boxes total; **counting only #1723's four understates it by half**

| Issue | Box | State | Evidence text |
| ----- | --- | ----- | ------------- |
| #1723 | `Closes #1642` present; #1000 **not** a closing target | **READY** | #1771 body line 11 carries `Closes #1642`; no closing keyword for #1000 anywhere in the body |
| #1723 | `doc:lint` green against the named roots | **READY** | root-scoped: `packages/cli` exit **0**; `packages/aspire` `totalErrors: 0` / `combinedExitCode: 0` — its process exit 1 comes from per-entrypoint `privateTypeRef` counts that reproduce **byte-identically on `origin/main`**, i.e. pre-existing main debt, and this slice touches no `packages/aspire` source |
| #1723 | `doc:*` manifest rows edited or listed with "no change needed" | pending | — |
| #1723 | docs_audit log + docs_polish recorded | pending | — |
| #1642 | ×4 documentation boxes | pending | non-TTY/detached live state, dashboard-token discovery, `aspire ps --format Json` as canonical inventory, both paths proven from the published surface |

## #1724 (S13, PR #1779) — 5 boxes: 2 verified, 1 evidenced, 2 blocked on S9

| Box | State | Evidence text |
| --- | ----- | ------------- |
| Phase-2 sweep clean | **blocked (S9)** | residual hits are the skills/dogfood-bundle corpus — S9's surface |
| Parity gate green in `ci.yml` | **blocked (S9)** | same dependency |
| Manifest re-run yields no diff | **VERIFIED** | re-run reports `rows=822 unmatched=0`; committed TSV byte-identical; zero worktree modification. *(Re-verify after each convergence — main gaining Aspire-mentioning paths legitimately moves this count; it went 815 → 822.)* |
| Template tests updated | **evidenced** | `deploy-compose-ghcr` pinned-install across 6 files; D-17 telemetry resolution in 3 including the Windows env-file path; `aspire ps` resolver exercised by 7 test/gate files |
| `check:assets-barrel`, `agentic:sync-claude:check` green | **HALF** | `check:assets-barrel` exit **0**. `agentic:sync-claude:check` exit **1** (`stale: .claude/skills/netscript-harness/SKILL.md`) — **reproduces identically on a clean worktree at `origin/main`**, so it is pre-existing main debt, not this slice's, and must not be absorbed into its scope |

## #1732 (PR #1747) — all 5 boxes already checked

Close-gate reports **0** blocking issue boxes. Only a **PR-body** DoD box remains: hosted
`scaffold.runtime` evidence for the head, gated on the same baseline.
