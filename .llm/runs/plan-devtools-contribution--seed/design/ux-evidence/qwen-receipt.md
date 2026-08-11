# Stage-D2 launch receipt — Qwen 3.8 Max adversarial design pass

Owner-approved route override, recorded at `drift.md` **D-15** and `supervisor.md` § Routes in force.

## Authorization

| Field | Value |
| --- | --- |
| Authorization | **Explicit owner instruction, 2026-08-11** — declined to waive the design pass; directed this substitute route |
| Supersedes | GLM 5.2 via `claude-design-glm-5-2` (unlaunchable — drift D-10) |
| Scope | **Stage D2 only.** Does **not** touch the formal evaluator lane |
| Formal evaluator | **Unchanged** — Codex GPT-5.6 Sol PLAN-EVAL remains the separate verdict of record |
| Standing of this pass | **Advisory design evidence.** Not a Plan-Gate verdict |

## Requested identity

| Field | Requested |
| --- | --- |
| Transport | OpenCode (native WSL) → OpenRouter |
| Provider / model | `openrouter/qwen/qwen3.8-max` |
| Variant (reasoning effort) | `max` |
| Model-id source | `.llm/tools/agentic/config/models.ts:52` (`qwen: 'qwen/qwen3.8-max'`) — resolved from config, **not hardcoded** |
| Launch tool | `deno task agentic:opencode` → `.llm/tools/agentic/opencode/opencode-run.ts` |

## Evaluator surface

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns-devtools-d2-qwen` — **fresh, dedicated, detached** |
| Commit under review | `b47f575719eac2ee55f0cbe506740f93521fe51a` (immutable for this pass) |
| Baseline | `main` @ `2256a67bf` |
| Write posture | **Read-only.** `docs/` and `packages/` chmod'd `a-w` (`dr-xr-xr-x` verified); the prompt forbids all edits and all GitHub mutation |
| Separation | Distinct from every authoring lane — Opus 5 (supervisor), Fable 5 (packs/sections), Sonnet 5 (stage F), Codex Sol (PLAN-EVAL) |

## Review surface handed to it

The complete RFC-0002 (15 sections); all **eight** design packs; the three prior contribution
RFCs — #890 (frontend contribution layer), RFC-0001/#1446 (runtime-versioned automation, which
stages this RFC as P-6), RFC-A/#1390 (typed SDK client contributions); plus `research.md`,
`plan.md`, `drift.md`, and `decision-brief.md`.

Eight named attack areas, findings-only output, **exact anchors required** (section + line or
quoted phrase), and a `## Strongest part` section so the supervisor knows what not to break while
fixing the rest.

## Observed identity

_Filled from the launch transcript once the run returns; a mismatch between requested and observed
is itself a finding and would be recorded as drift._

| Field | Observed |
| --- | --- |
| Provider / model | _pending_ |
| Variant | _pending_ |
| Session | _pending_ |

## Artifacts

| Artifact | Path |
| --- | --- |
| Prompt | `design/ux-evidence/qwen-prompt.md` |
| Raw output | `design/ux-evidence/qwen-findings.md` |
| This receipt | `design/ux-evidence/qwen-receipt.md` |
| Superseded GLM attempts | `design/ux-evidence/glm-attempt-{1,2}-FAILED.jsonl` (kept as evidence) |
