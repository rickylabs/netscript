# IMPL-EVAL — fix-1023-agent-init-skill-surface--skills-discoverability

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

Implementation: Codex · gpt-5.6-sol · low. Commits inspected directly with `git show`/`git diff`;
every gate below was re-run by this evaluator in `/home/codex/repos/fix-1023`, not taken from the
slice's report.

## Commits verified

| SHA | What the diff actually does |
| --- | --- |
| `e42070ec0` | Harness plan/research/drift/worklog only. No source. |
| `5f497a85a` | `skills/aspire/SKILL.md` (+270), `skills/deno/SKILL.md` (+248), `skills/help.md` (+170); manifest → 5 skills + `help.md`, version `0.2.0`; route fixes in `netscript`, `netscript-build`, `netscript-operate`; `AGENTS_SECTION` rewritten; `check:assets-barrel` gains `skills.generated.ts`; docs (`README.md`, `docs/site/reference/ai/skills.md`, `docs/site/reference/cli/commands.md`); +80-line route-integrity test. |
| `9fcd1044f` | Regenerated `skills.generated.ts` (content + hash); **tightened the skill-reference extractor** (see finding 1). |
| `05c86f51d` | Run-artefact gate evidence only. No source. |

## The PLAN-EVAL condition — discharged

PLAN-EVAL required the route-integrity check be *demonstrated* red on pre-fix content. I extracted
`origin/main`'s `skills/` into a scratch tree and ran the **shipped** extractor over it:

```
=== PRE-FIX (origin/main) ===
installed: netscript, netscript-operate, netscript-build
DANGLING ROUTES: netscript -> aspire | netscript-operate -> aspire | netscript-build -> aspire
exit=1

=== POST-FIX (HEAD) ===
installed: netscript, netscript-operate, netscript-build, aspire, deno
DANGLING ROUTES: (none)
exit=0
```

The check is genuinely red before and green after. Acceptance box 6 is evidenced.

## Finding 1 — the extractor was tightened in slice 2; I verified this is not a weakening

`9fcd1044f` narrowed the prose pattern from `use (the )?X( skill)?` to require the literal word
`skill`, plus a separate `(use the X)` parenthesised form. This is the exact risk PLAN-EVAL row 12
flagged. I checked whether it hides real routes:

- What it stopped matching: `` Use `help.md` when you do not yet know… `` (a playbook file, not a
  skill) and "the Aspire **CLI**" (a tool, not a skill). Both are genuine false positives.
- What it still matches: all three `use the aspire skill` routes on pre-fix content — proven above —
  and the `DO NOT USE FOR: … (use the aspire skill)` frontmatter form.
- The routing-table scanner is independent and unchanged.

Legitimate false-positive fix, not a loosened assertion.

## Acceptance criteria — each independently evidenced

| Issue box | Verdict | My evidence |
| --- | --- | --- |
| 1. installs an `aspire` and a `deno` skill alongside the existing ones | MET | Fresh `agent init --host claude` into a clean temp dir installed `aspire/SKILL.md`, `deno/SKILL.md`, `help.md`, `netscript/`, `netscript-build/`, `netscript-operate/` — 6 files, **863 lines** vs 164 on main. |
| 2. no installed skill routes to a skill `agent init` does not install | MET | Shipped extractor over installed content: `DANGLING ROUTES: (none)`, exit 0. Also `grep` for `deno-fresh\|netscript-deno-toolchain\|netscript-cli\|netscript-tools\|netscript-doctrine\|netscript-pr\|netscript-harness` across `skills/` returns nothing — the draft's own dangling routes were rewritten to domain guidance. |
| 3. symptom-indexed troubleshooting document ships | MET | `skills/help.md` installs to `.claude/skills/help.md`; organised by symptom (`Healthy` is not proof / dangling AppHost / Vite hangs / event never fires / browser console / plugin not wired / API unknown / exit-code trap). |
| 4. AGENTS.md block names all installed skills and directs to Aspire and Deno | MET | Installed block reads: "Use the installed `netscript`, `netscript-build`, `netscript-operate`, `aspire`, and `deno` skills … Start with `.claude/skills/help.md` when a symptom is unclear; use `aspire` for orchestration and runtime-state problems, and `deno` for runtime and toolchain problems." Idempotency preserved — existing second-run `changedFiles: []` test still green. |
| 5. skills surface `netscript plugin doctor`, `aspire otel`, `aspire logs`, `deno info` **from the symptom** | MET, structurally | `plugin doctor` — the command measured at **0 uses** — is now reachable from three symptoms: `help.md` "A plugin install succeeded, but nothing is wired"; `netscript-build` "install seemed to work but the boundary never runs"; `netscript-operate` "a plugin's boundary never runs". `aspire otel`/`aspire logs` anchor the `Healthy`-is-not-proof and event-never-fires symptoms; `deno info` anchors resolution/stale-cache. **See the caveat below — this is structural, not behavioural, proof.** |
| 6. test that every routing reference resolves to an installed skill | MET | New test `agent init installs the diagnostic surface with no dangling skill routes`, proven red on pre-fix content above. |

## Gates — re-run by me, real output

| Gate | Result | Output |
| --- | --- | --- |
| `run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS | `filesSelected: 742, failedBatches: 0, totalOccurrences: 0`, exit 0 |
| `deno lint packages/cli` | PASS | `Checked 107 files`, exit 0 |
| `deno test -A packages/cli/src/public/features/agent/init/` | PASS | `4 passed \| 0 failed (267ms)` — includes the three pre-existing tests (idempotency, host table, hash mismatch) |
| `deno task check:assets-barrel` | PASS | exit 0, tree clean after regeneration — and it now covers `skills.generated.ts`, which it did not before this PR |
| `e2e:cli run scaffold.runtime` | N/A | Correctly skipped: no scaffold output, plugin scaffolding, DB wiring, or Aspire helper generation changed. |

## Caveat that must not be lost at merge

Acceptance box 5 is satisfied **structurally**: the commands are now reachable from the symptom
rather than only from a capability table. That is the right fix for the diagnosed defect — "a
mention in a capability table is not enough to change behaviour" — but it is not a measurement.
Whether `plugin doctor` and `aspire otel` actually get invoked can only be confirmed by another
instrumented build round against 0.0.3. The PR should not be read as behavioural proof, and the
zero-invocation metric should be re-measured next round.

## Verdict

**PASS** — ready for merge.
