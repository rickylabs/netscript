## Slice 0 — canvas pre-flight: PASS ✅ (commit 9a881908)

**Gate:** manual round-trip smoke against the Claude Design surface (worklog § Runtime Gates).

- PLAN-EVAL **PASS** landed first (`plan-eval.md` @ dfd9d8ca, minimax-M3) — implementation began only after the Plan-Gate cleared.
- Mechanism upgrade (recorded in `drift.md`): the canvas lane runs on Claude Code's **native `DesignSync` tool** (claude.ai-login auth, `localPath` disk uploads that bypass model context, `finalize_plan` write boundary) instead of the raw `claude-design` MCP the plan assumed. This retires the top risk-register entry (MCP 404/401 flakiness).
- Round-trip evidence: `create_project` → new project **`NetScript — NS One`** (`ec262e10-d4ad-451f-9aeb-e51955db3634`) → `finalize_plan` → `write_files` (smoke card with `@dsCard` marker) → `get_file` read back **byte-identical** → `delete_files` cleanup. Project left empty by design until slice 3 seeding; the stale `eis-chat — NS One` project is untouched (LD-2).
- PLAN-EVAL's non-blocking note fixed: plan.md/pr-body now say "fresh-ui at baseline `317e4b50`" instead of the stale `0.0.1-beta.4` label.

**Next:** slice 1 — `tools/design-sync/` v1 (converter + CSS closure + conventions + previews + trap checks + idempotence), gated by scoped check/lint/fmt wrappers + `design:sync --check` self-test.
