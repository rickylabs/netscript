use harness

# Slice: OMB wave-0 proofs — #1127 (P1, arbitrates F1), #1128 (P2), #1129 (P3)

You are the implementation supervisor for one PR closing #1127, #1128, #1129 — the three wave-0
proof slices of epic #1126 (OpenAPI→MCP), design source RFC #1123. Read all three issue bodies and
RFC #1123 §4 Wave 0 + §9 before writing anything.

## SKILL

`.agents/skills/netscript-harness`, `.agents/skills/netscript-pr`, `.agents/skills/netscript-cli`,
`.agents/skills/netscript-doctrine` (for reading the generated Aspire surface — this slice must
not change `packages/**` public surface).

## Deliverable = the gates

Three committed verdict artifacts, exactly as the RFC specifies (`proofs/P1-verdict.md`,
`P2-verdict.md`, `P3-verdict.md` at the RFC's stated location):

- **P1 (#1127):** demonstrate (or refute) a post-allocation Aspire lifecycle seam writing
  `.netscript/run/endpoints.json` with real allocated ports + identity binding. The verdict names
  the F1 outcome — **(a) or (b). A FAIL is a legitimate verdict**, not a failure of this slice;
  it must carry measured evidence either way, and it updates epic #1126 + RFC #1123 §9.
- **P2 (#1128):** measured spec fidelity/size against a real scaffolded app (operationId shapes,
  row/schema sizes vs truncation budget, error-envelope presence incl. the no-database template,
  observed OpenAPI keyword subset).
- **P3 (#1129):** auth-guarded spec fixture; committed verdict + ratified `spec_unavailable`
  wording.

**A skipped proof must be indistinguishable from a failed one, never from a passed one.**

## Anticipated files

`proofs/P{1,2,3}-verdict.md` (location per RFC); disposable fixture/experiment code under the
RFC's designated experiment area (NOT under `packages/**`); scaffolded-app scratch in `.llm/tmp/`
or per-CLI conventions. Archetype: proof/measurement slice — no published-surface change, no
doctrine debt touched. If P1's experiment requires touching generated-template code to test the
seam, that is experiment scope only; template productization is S7 (#1133), not yours.

## Environmental hazards (pre-empted)

- Scaffold + Aspire runs are expensive: serialize them; never run two AppHosts concurrently; stop
  via verified process-tree death, not exit codes (`aspire stop --all` lies).
- Never kill `aspire mcp start` processes; never kill by pattern.
- The machine is shared — check `docker ps`/ports before starting resources; run
  `deno task agentic:leak-check -- --slice-dir <this dir> --worktree <your worktree>` before
  finishing; declare clean-clone dirs with `--owned-root`.

## PR contract

Branch `test/openapi-mcp-wave0-proofs` (already created, worktree provided), target `main`.
Draft PR early per `.agents/skills/netscript-pr`; body carries `Closes #1127`, `Closes #1128`,
`Closes #1129` **only if every box on each is truthfully ticked** (a FAIL P1 verdict still ticks
#1127's boxes — the deliverable is the verdict, not a PASS). Labels: `type:test`,
`area:tooling`, `area:service`, `epic:openapi-mcp`, exactly one `status:`; milestone `0.0.5`.
Gates before ready: scoped check/lint/fmt wrappers on files you touched; no new lint-ignores; do
NOT run `deno task e2e:cli` (merge-readiness is the orchestrator's call). Do not commit
`deno.lock` churn. Record drift in this slice dir's `drift.md`; keep a `worklog.md` here as you
go — the orchestrator wakes on it.
