use harness

## SKILL

Read `AGENTS.md`, then the `netscript-harness`, `netscript-tools`, `netscript-pr`,
`netscript-doctrine`, `netscript-deno-toolchain`, and `jsr-audit` skills. Then read issue **#1296**
in full. You are the implementation author for a new internals leaf.

## Identity

- Leaf: `reference-export-drift-gate`, wave 2, internals lane
- Worktree: `/home/codex/repos/netscript-007-reference-export` (already created, clean)
- Branch: `fix/reference-export-drift-gate`, based on `origin/main` `baf1cdf67`
- Run dir: `.llm/runs/release-0.0.7-internals--orchestration/slices/reference-export-drift-gate/`
- Closes exactly **#1296**
- Archetype `6-cli-tooling`, overlays `frontend` + `docs`

## This pass: research and plan only. No implementation.

Produce `research.md` and `plan.md`, commit, push, open the PR as **draft**, comment, then **stop**.
I run Tier-A on your exact pushed head. State explicitly in `plan.md` whether a fresh PLAN-EVAL is
required and why — that gate is the coordinator's to grant, not yours to assume.

## Authorized file surface — exactly nine paths, from the frozen leaf contract

```
.github/workflows/
.llm/tools/docs/check-accuracy-and-discoverability.ts
.llm/tools/docs/check-exports-drift.ts
deno.json
docs/exports
docs/site/reference/fresh-ui/index.md
packages/contracts/src/application/contract-primitives.ts
packages/contracts/src/application/paginated-query.ts
packages/contracts/src/public/mod.ts
```

Narrow this with per-path justification and name what you deliberately will **not** touch. A tenth
path is rescope: stop and ask me. Note `docs/exports` **does not exist** on baseline — see A2 below.

## Ground truth I measured before briefing you — verify each, do not trust it

**A1 — the drift gate is real, passing, and wired to nothing.**
`deno run --no-lock --allow-read --allow-env --allow-run .llm/tools/docs/check-exports-drift.ts`
returns **raw exit 0** and prints `Exports & Symbols drift check: PASS`. But
`grep -rn 'check-exports-drift\|exports-drift' deno.json .github/workflows/` returns **zero hits**.
The tool exists, works, and **guards nothing** — no task, no workflow, not in `docs:maintenance`
(which is `docs:links && docs:accuracy && docs:contract-derivation && agentic:sync-claude:check &&
agentic:check-claude`). This is the live core of acceptance row 5, and it is the same
coverage-versus-compliance defect this lane keeps finding: a green that proves nothing because
nobody runs it. Re-derive this yourself; do not cite my measurement as your evidence.

**A2 — a contracted surface does not exist.** `docs/exports` is in the frozen contract but is absent
on baseline `baf1cdf67`. Determine whether it is a path you are expected to *create* (a generated
export inventory) or a stale contract entry, and say which in `research.md`. Do not invent a
directory just to satisfy the contract, and do not silently drop it.

**A3 — acceptance row 1 is already satisfied on baseline.** The coordinator's Step-0 synthesis
found: `baseContract`, `BaseContractRoute`, `BaseContractOutputRoute`, and
`OffsetPaginationQuerySchema` are all re-exported from the root (`src/public/mod.ts:2-6,65`) and the
JSDoc at `contract-primitives.ts:72,112,144` already imports correctly. **Four rows remain live.**
Verify this independently. If it holds, reconcile the issue row **honestly and visibly** — state in
the PR that it was already satisfied at baseline rather than ticking a box you did not earn. If your
measurement contradicts Step-0, say so with evidence; that is a finding, not a problem.

**A4 — the #1112 / MySQL half is not yours.** #1296's body defers it to **#1293**, which is still
`OPEN` / `status:impl`. The frozen surface contains no `prisma-adapter-mysql` path, confirming the
split. Do not touch it and do not block on it.

## The four live acceptance rows

1. Contracts reference inventory advertises no non-exports.
2. Fresh UI reference surface repaired to match its published exports.
3. Intentional omissions expressed **machine-readably** rather than being silently incomplete.
4. Maintainer regeneration runbook documented **and** the drift check wired into the documentation
   verification path.

Row 3 is the design decision in this leaf — choose the machine-readable format deliberately and
justify it against how the existing checkers consume data. Row 4 is where A1 lands: pick the wiring
point (task graph, `docs:maintenance`, CI workflow, or a combination) and defend it. Wiring a gate
that then fails on baseline is a legitimate outcome — report it, do not tune the gate until it goes
quiet.

## Proving gates from the contract

`check`, `test`, `publish-dry-run`, `quality-job`, `arch-check`, `docs-source-format`,
`docs-accuracy` — plus **`fresh-browser`**, which **this lane may not execute**. Plan for
`fresh-browser`, classify it, and **ask, not take**: state in `plan.md` what it would prove and
whether it is genuinely required for this surface. Do not run Aspire, Docker, browsers, or
`e2e:cli`. `jsrAudit` is **applicable**: audit public exports and exact `@netscript` dependency pins
for every touched publishable member, and plan an isolated-declaration `publish:dry-run`.
`packages/contracts` is a **published** member — if you change its public surface or JSDoc that
ships, say so in the JSR table honestly. The #1663 leaf was failed by its evaluator for claiming
"no publish delta" over a surface it had not examined; do not repeat that.

## Evidence discipline

- Read raw exit codes **unpiped** (`"${PIPESTATUS[0]}"` or no pipe). A masked exit is a false green;
  this exact trap has bitten this lane.
- An empty selection is a **refusal**, not a pass.
- A command that did not fire is NOT FIRED — never infer a result.
- Scratch belongs in `.llm/tmp/`, never inside a measured selection root.
- Prefer `deno doc` over broad source reads for public surfaces.

## Boundaries

Do not merge, publish, flip ready, relabel beyond the leaf's own `status:`, close issues, alter
milestone scope, mutate central cluster state, or touch another lane's worktree. PR targets `main`
and stays **draft**.

Commit, push, open the draft PR with `Closes #1296` in the body and the namespaced labels, post the
structured `[PHASE: RESEARCH]` / `[PHASE: PLAN]` comment, then **stop**. If a proof comes out red,
report it red — an honest red is worth more than a green I have to disbelieve.
