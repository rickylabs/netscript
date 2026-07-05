# F-ai research corpus — index

NetScript's AI suite already has a substantial in-repo surface: a standalone, zero-`@netscript/*`
-dependency engine core (`@netscript/ai`, six self-registering provider/capability adapters,
capability-port composition), a fully-typed Archetype-1 oRPC contract package
(`@netscript/plugin-ai-core`, the `/v1/ai` route family), a thin unpublished scaffolder/connector
plugin (`plugins/ai`), and a durable-chat runtime UI subpath (`@netscript/fresh/ai`, FA0–FA2
landed, FA3 skeleton). The originally-assumed "6-slice migration plan" is a mischaracterization —
the real architecture (GitHub Epic #238, anchor #219) is a five-home split carved into a ~30-item
sub-issue DAG (E/FA/FB/P clusters), of which 21 sub-issues are closed and 18 remain open. The
single highest-signal open item is #388, a 2026-07-04 owner ruling that corrects `plugins/ai`'s
"deliberately thin" framing into a flagship-parity mandate — grounded in a concrete, source-verified
defect (the scaffolded stream-proxy handler bypasses the `plugin-ai-core` contract entirely).

- `01-plugin-ai-current-surface-inventory.md` — full public-surface inventory of `packages/ai`,
  `packages/plugin-ai-core`, `plugins/ai`, and `packages/fresh/src/runtime/ai`, with `deno doc` and
  direct-source citations; six provider/capability adapters mapped; archetype assignment per
  package.
- `02-ai-stack-architecture-and-migration-delta.md` — corrects the "6-slice #219 plan" premise to
  the real five-home architecture / ~30-item sub-issue DAG (GitHub Epic #238); current-vs-target
  delta (top 7 gaps) including the contract-bypass defect and the GenAI-telemetry/dashboard seam
  cross-reference.
- `03-flagship-quality-and-archetype-grounding.md` — the flagship-quality mandate's actual source
  (GitHub Epic #238 comment 10 / Issue #388, 2026-07-04 — not a doctrine file), cross-checked
  against `docs/architecture/doctrine/11-plugin-thinness-and-base-seams.md` (confirms the mandate is
  NOT yet reflected in doctrine — a Stage-C gap).
- `04-github-ai-program-state.md` — Epic #238 + #388 deep read, full open-AI-issue map (18 open
  under `epic:ai-stack` + cross-ref `#387`), supersede/keep candidates, and the netscript-pr
  taxonomy observed on these issues. (Stage-B GitHub program-state cell.)

See also: `context/F-ai/` (eis-chat real-usage extraction + AI telemetry/dashboard seam note) and
`matrix/F-ai/` (external AI-landscape wrap-vs-reinvent verdicts — TanStack AI, MCP, OTel GenAI
semconv) for the sibling Stage-B cells this corpus was produced alongside.
