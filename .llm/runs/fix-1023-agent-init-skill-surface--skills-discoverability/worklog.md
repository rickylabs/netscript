# Worklog: agent init skill discoverability

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1023-agent-init-skill-surface--skills-discoverability` |
| Branch | `fix/1023-agent-init-skill-surface` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Design

### Public Surface

- `netscript agent init` installed Claude skill bundle.
- The marked `AGENTS.md` NetScript guidance block.
- Root `skills/manifest.json` and generated embedded barrel.

### Domain Vocabulary

- installed skill — one name in `manifest.skills` backed by `<name>/SKILL.md`.
- companion playbook — installed `help.md`, routed from AGENTS/skills but not itself a skill.
- skill reference — explicit hand-off wording that must resolve to an installed skill name.

### Ports

- Existing `AgentInitFileSystem` only; no new port.

### Constants

- `AGENTS_SECTION` — one marked, deterministic block naming all five skills and `help.md`.
- Manifest `skills` — the finite allowed route targets.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove the source bundle is complete, symptom-routed, documented, and semantically tested. | focused init tests + review | `skills/**`, installer/test, docs, `deno.json`, run artifacts |
| 2 | Prove the embedded artifact matches source and the requested gate set passes. | generator + four requested validations + quality/arch checks + temp install | `skills.generated.ts`, run artifacts |

### Deferred Scope

- Installer architecture and scaffold/runtime E2E are unchanged/N/A.

### Contributor Path

Add or edit a source skill under `skills/`, register it in `skills/manifest.json`, regenerate with `deno task gen:assets-barrel`, and prove route integrity through `init-agent_test.ts` plus `check:assets-barrel`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 | plan | repro | Actual contributor binary reproduced exactly three skills and 164 lines; requested entry path/flag are stale. |
| 2026-08-01 | plan-eval | PASS | Separate OpenHands/Qwen session passed every Plan-Gate box; run 30714594170. |
| 2026-08-01 | S1 | source/content complete | Adapted the three supplied drafts; manifest now names five skills plus `help.md`; dangling specialist routes removed; plugin symptom added to help/build/operate; AGENTS, tests, docs, and freshness task updated. |
| 2026-08-01 | S2 | generated + validated | Regenerated hash `71a86900a53bb52eb6e3ba974426fb66657aa50b433586c522ab55b621487264`; narrowed the route parser after its first run exposed false positives for ordinary “use CLI/help” prose. |

## Gate Results

PLAN-EVAL passed before implementation began.

### Slice 1 review

- Source manifest is the finite route authority: `netscript`, `netscript-operate`,
  `netscript-build`, `aspire`, `deno`.
- Focused grep found no `deno-fresh`, `netscript-deno-toolchain`, or Deno-doc-only handoff in
  source skills.
- Symptom-first occurrences of `netscript plugin doctor` exist in `help.md`, `netscript-build`, and
  `netscript-operate`; the Aspire/Deno drafts retain the required symptom anchors.
- Generated artifact and executable tests intentionally remain S2, after regeneration.

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Type check | `deno run -A .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS | 742 files, 7 batches, 0 failed, 0 diagnostics |
| Lint | `deno lint packages/cli` | PASS | Checked 107 files |
| Init tests | `deno test -A packages/cli/src/public/features/agent/init/` | PASS | 4 passed, 0 failed |
| Asset freshness | `deno task check:assets-barrel` | PASS | post-commit generator produced no diff; the task now includes `skills.generated.ts` |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Code-quality scan | PASS | `deno task quality:scan` | no findings; 7 pre-existing allowances reported |
| Architecture check | PASS | `deno task arch:check` | exit 0; repository warnings are pre-existing and outside this slice |
| Docs overlay | PASS | source/installed grep + semantic test | enumerations aligned; symptom routes present; no dangling installed skill reference |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Fresh Claude install | PASS | temp artifact `/tmp/tmp.nsCKv5AcJh` | five `SKILL.md` files + `help.md`, 863 lines; AGENTS names all routes |

## Handoff Notes

- Inspect the route parser and generated hash first.
- `scaffold.runtime` is N/A by explicit owner instruction and the release-gate matrix: no scaffold,
  plugin scaffold, DB wiring, or Aspire helper generation changed.

## 2026-08-01 Owner Review Follow-up

- Owner waiver: supervisor PLAN-EVAL/IMPL-EVAL; no further external evaluator is required.
- Re-baseline: local and remote branch tip are both
  `cc238e27badf775f460daf50c8e0cb923c3f8e04`; worktree contains only the supervisor-provided
  untracked `implement.md`, which is preserved and excluded from commits.
- Aspire CLI verification: installed `13.4.6+87fe259e`; top-level help exposes `ps`, `stop`,
  `resource`, `describe`, `doctor`, and `cache`; `aspire cache --help` exposes exactly `clear`.
- Container-removal decision: ship no Docker removal command. There is no need to start an AppHost
  or infer a label filter when the Aspire CLI owns lifecycle cleanup; unproven removal filters are
  intentionally absent.

### Load-bearing route test proof

Temporarily added `For phantom cleanup failures, use the \`ghost-cleaner\` skill.` to installed
`help.md`, regenerated the embedded barrel, and ran the focused route test. It failed as required:

```text
EXIT=1
agent init installs the diagnostic surface with no dangling skill routes ... FAILED (38ms)
[Diff] Actual / Expected
- [
-   "help.md -> ghost-cleaner",
- ]
+ []
FAILED | 0 passed | 1 failed | 3 filtered out (47ms)
error: Test failed
```

After reverting only that temporary route and regenerating the barrel, the same test passed:

```text
EXIT=0
agent init installs the diagnostic surface with no dangling skill routes ... ok (23ms)
ok | 1 passed | 0 failed | 3 filtered out (30ms)
```

The test also asserts its ordered scanned-path set equals all manifest skill `SKILL.md` paths plus
`help.md`, so future regression to a skills-only loop is explicit rather than a silent no-op.

### Destructive-command audit

Command: `rg -n -i 'docker|rm -rf|rm -f|kill|pkill|killall|xargs' skills --glob '*.md'`.
No `rm -rf`, `rm -f`, `pkill`, `killall`, `xargs`, or Docker removal command survives. Every match:

- `skills/help.md:44`: protective prohibition never to kill `aspire mcp start`.
- `skills/help.md:175`: tells agents to re-check slow `dcp` exits instead of killing them.
- `skills/aspire/SKILL.md:3`: routes container-only, non-Aspire work to Docker/Podman; no command.
- `skills/aspire/SKILL.md:163`: explains observed `exitCode: -1` state; no kill instruction.
- `skills/aspire/SKILL.md:183`: read-only `docker ps` after Aspire CLI diagnostics.
- `skills/aspire/SKILL.md:248`: protective prohibition never to kill Aspire MCP servers.
- `skills/aspire/SKILL.md:255-256`: Aspire CLI performs cleanup; read-only `docker ps` verifies it,
  and slow helpers are re-checked instead of killed.
- `skills/deno/SKILL.md:79`: explains timeout exit status `137`/SIGKILL; no kill instruction.

The NetScript/build/operate matches printed by the broad regex are words such as `skill`, not
destructive commands. `netscript-build` had no bare `help.md` reference; the bare references in
`netscript` and `netscript-operate` now name `.claude/skills/help.md` consistently.

### Exact shipped cleanup section

```markdown
## Cleaning up after yourself

\`\`\`sh
aspire ps --format Json --non-interactive --nologo           # inspect before stopping anything
aspire describe --format Json --non-interactive --nologo     # inspect runtime/resource state
aspire resource <resource> stop                              # targeted stop when the whole stack should stay up
aspire stop --all --non-interactive --nologo                 # only after confirming every listed AppHost is yours
\`\`\`

Re-run \`aspire ps\` and \`aspire describe\` after stopping. Aspire's \`dcp\` helper processes can take
about 20 seconds to exit, so re-check rather than killing them. Leaving AppHosts running is how the
*next* run gets a port conflict it cannot explain; leftover containers are Aspire's to reclaim. If
cleanup still looks wrong, use \`aspire doctor --format Json --non-interactive --nologo\` to diagnose
the container runtime, SDK, and certificates.

\`aspire cache clear\` clears only the Aspire CLI's disk cache. It does **not** stop AppHosts or remove
containers, so use it only for a CLI-cache problem—not as runtime cleanup.
```

### Final validation output

All owner-specified commands passed against implementation commit `707e8d235`:

```text
$ deno run -A .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
EXIT=0
{"source":{"mode":"selection","cwd":"/home/codex/repos/fix-1023"},"command":"deno check --quiet --unstable-kv <files>","selection":{"filesSelected":742,"batches":7,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}

$ deno lint packages/cli
EXIT=0
Checked 107 files

$ deno test -A packages/cli/src/public/features/agent/init/
EXIT=0
agent init writes Claude config, skills, and marked AGENTS section idempotently ... ok (60ms)
agent init selects VS Code and detect-or-all host table ... ok (55ms)
agent init rejects a bundle whose manifest hash does not match ... ok (2ms)
agent init installs the diagnostic surface with no dangling skill routes ... ok (31ms)
ok | 4 passed | 0 failed (176ms)

$ deno task check:assets-barrel
EXIT=0
Task check:assets-barrel deno task gen:assets-barrel && git diff --exit-code -- packages/cli/src/kernel/assets/embedded.generated.ts packages/cli/src/kernel/assets/skills.generated.ts packages/plugin/src/kernel/assets/embedded.generated.ts packages/fresh-ui/registry.generated.ts packages/service/src/primitives/scalar.generated.ts
Task gen:assets-barrel deno run --no-lock --allow-read --allow-write --allow-run=deno .llm/tools/generate-cli-assets-barrel.ts

$ deno task quality:scan
EXIT=0
Task quality:scan deno run --allow-read .llm/tools/quality/scan-code-quality.ts
Parsed verdict: {"ok":true,"mode":"repository","scanned":["packages/cli/src","plugins"],"findings":[],"allowCount":7}

$ deno task arch:check
EXIT=0
```

The `quality:scan` verdict above records its material result; the emitted JSON additionally listed
the seven existing allowance records. `arch:check` retained the repository's existing
dependency-catalog and doctrine warnings (README
example counts, file/directory size advisories, and default-export advisories), with no failures.
This follow-up changes shipped guidance and its CLI test only; it introduces no package or plugin
architecture finding.

### Post-slice reconcile

- PR #1034 remains the sole resolving PR with `Closes #1023`, milestone `0.0.3`, the requested area/
  priority/type labels, and exactly one lifecycle status.
- No new reviewer comments require implementation changes. PLAN-EVAL remains PASS.
- No plan or doctrine drift beyond the already-recorded stale repro entry/flag.
