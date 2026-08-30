use harness

## SKILL

Load `netscript-harness`, `netscript-doctrine`, `netscript-tools`, `netscript-deno-toolchain`,
`netscript-cli`, and `netscript-pr`. Read `.llm/harness/evaluator/` and
`.llm/harness/gates/static-gates.md`.

# PLAN-EVAL cycle 1 — #1732 / PR #1747 (Aspire background reference-name validation & source safety)

You are the **independent adversarial plan evaluator**. You did not write this plan and you are not
its supervisor. Judge the plan, not the supervisor who approved its decisions — including where you
think that approval was wrong.

## Identity and scope

| Field | Value |
| --- | --- |
| Evaluated head | `fddcb833ba5e49466ac942112b41bd7712aa7c17` |
| Branch | `fix/aspire-reference-name-validation` |
| Your worktree | `/home/agent/projects/netscript/worktrees/007-eval-1732` (detached at that head, clean) |
| Base | `13878a80a50c55b9662099fed64555f2310ae4a3` (live `main`) |
| Issue | #1732 (p1, `0.0.7`) · draft PR **#1747** at `status:plan` |
| Plan | `.llm/runs/fix-aspire-reference-name-validation--1732-source-safety/plan.md` |
| Research | `research.md` in the same directory — read it, the whole compatibility decision rests on it |

**Artifact-only.** Write exactly one new file,
`.llm/runs/fix-aspire-reference-name-validation--1732-source-safety/plan-eval.md`. Touch no source,
no test, no other artifact, no PR body, no label, no draft state, no milestone, no issue. Commit it
and push with an explicit refspec only —
`git push origin HEAD:refs/heads/fix/aspire-reference-name-validation`. You are on a **detached**
worktree; commit onto the branch tip you evaluated, never a stray head. Never force-push.

Post exactly one PR comment on #1747: `[PHASE: PLAN-EVAL] [VERDICT: PASS|FAIL_PLAN|FAIL_FIX]`.
**Post it yourself.**

**No implementation exists yet and none may be written by you.** The RED slice is blocked on your
verdict.

## The decision you are auditing

The issue's acceptance offers two routes: lock the name grammar at the config parse boundary, or use
a source-safe representation with an explicit compatibility decision. The author researched, hit a
mandatory stop, and the supervisor authorized **both**, in a specific order:

- **D1** — `JSON.stringify` on every emitted name literal is the **load-bearing** property, done
  first. Rationale: the grammar is derived from upstream Aspire source, release notes, and a
  maintainer discussion — **not from executing Aspire**; this leaf has no runtime lease. If a
  documentation-derived grammar is the only defence and is wrong in the loose direction, the original
  syntax-error defect survives. With escaping underneath, a wrong grammar degrades to a wrong
  diagnostic, never to unparseable generated TypeScript.
- **D2** — exact Aspire default grammar layered on top: 1–64 chars, leading ASCII letter, then ASCII
  letters/digits/hyphens, no consecutive hyphen, no trailing hyphen.
- **D3** — a **new, separate** constant, deliberately not `SCAFFOLD_VALIDATION.NAME_PATTERN`, which is
  `[a-z]`-only and would reject uppercase names Aspire accepts.
- **D5** — compatibility position: `a--b`, `a-`, and >64-char names become rejected at parse; they are
  not runnable Aspire resource names today, so this moves an existing failure earlier rather than
  removing working behaviour. Stated as a deliberate fail-fast correction, never as a no-op.

**Attack the reasoning, not just the paperwork.** If you think the ordering is wrong, that the
grammar is still stricter or looser than the platform's, that D5 understates the blast radius, or
that doing both routes is over-engineering where one would do — say so. A supervisor's approval is
not evidence.

## Disclosure — one finding is already mine, do not credit it as yours

I raised, before dispatching you, that `research.md` had recorded the jsr-audit surface scan as
**N/A** on the premise that no published symbol would change, while D3 planned an exported constant
in `packages/aspire/constants.ts` — which `packages/aspire/deno.json` publishes as the `./constants`
subpath. The author resolved it by moving the rule to
`packages/aspire/src/domain/aspire-resource-name.ts` as package-private and adding doc-lint and
JSR-audit **baseline comparison** gates.

Your job is to check whether that resolution actually holds, not to re-report the original gap:

- Is `packages/aspire/src/domain/` genuinely unpublished? Read the export map yourself.
- Can the rule still reach the published API surface indirectly — re-exported, or referenced in the
  type of anything `config.ts` / `mod.ts` exposes? "Not an export entrypoint" is not the same as "not
  in the public surface"; `deno doc --lint` already reports private-type references in this package.
- Are the recorded pre-change baselines (doc-lint exit 1 with zero missing-JSDoc; JSR audit exit 1
  with four `F-JSR-2` + one `F-JSR-7`) **true at this head**? Re-measure them. A baseline nobody
  verified is how a regression gets attributed to "inherited".

## Attack list — a floor, not a ceiling

1. **Is the grammar right?** Verify Aspire's actual default resource-name policy from the sources
   `research.md` cites. Is the plan's rule stricter than the platform anywhere (that is a
   self-inflicted breaking change) or looser (that is a defect that survives)? Uppercase, digits,
   dots, length boundary, leading/trailing characters.
2. **Does D5 understate the change?** The claim is that newly-rejected names are already broken at
   Aspire. Test that claim against the repo: can a scaffold, template, fixture, doc example, or
   existing test in this tree produce a name the new rule rejects? A currently-green test that starts
   failing is evidence D5 is wrong, and it is cheap to look for.
3. **Is the escaping enumeration complete?** The plan lists config lookup, comment label, executable
   name, OTEL service-name argument, result-map key, name-derived default entrypoint, both reference
   lookups, and the discovery key. Read
   `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts` and
   find an interpolation site the plan missed. One missed site means the load-bearing property is not
   actually load-bearing.
4. **Discovery-key contract.** `services__<ref>__http__0` was runtime-verified in #1371 and must not
   move. The plan asserts it positively *and* negatively (rejecting the normalized
   `services__workers_api__http__0`). Is that sufficient, and is it applied to plugin references too?
5. **Validation placement.** D4 validates only background processor keys and their two reference
   arrays, at the composed config boundary. Is that the right seam, and does scoping it to background
   entries leave the same defect reachable through a neighbouring generator the plan declares out of
   scope? If so, say whether that is acceptable scoping or a hole.
6. **Test matrix adequacy.** Would the matrix actually go red before the fix and green after, for
   each row? Note the plan's own caveat that some inputs are already safe individually. Is a
   64/65-character boundary, uppercase, and both reference kinds genuinely covered?
7. **Gate set sufficiency.** `check:assets-barrel` is claimed relevant — is it? Root `deno task test`
   is recorded **NOT FIRED**; confirm that is honestly represented rather than a green in disguise.
8. **Scope discipline.** Diff versus base at this head must be **run artifacts only** — no
   `packages/` change may have leaked in ahead of the gate. Verify it.
9. **Receipt honesty.** Every SHA cited in the plan, PR body, and comments must resolve to a real
   commit. A leaf in this lane once cited fabricated SHA suffixes; check, do not assume.
10. **`Closes #1732`** must be present in the PR body, exactly one `status:` label, milestone `0.0.7`.

## Host conditions — record honestly, never launder, never charge them to the plan

This machine carries roughly **7,700 PID-1-owned zombie processes** that no agent can reap,
exhausting per-process descriptors and PID slots.

- **Do not run root `deno task test`.** It is not a usable signal here.
- **`rtk` is not installed on this host** despite `AGENTS.md` mandating it. Call the underlying
  commands directly; do not try to install it.
- If you observe host-caused failures, record them with evidence as host conditions and say plainly
  they are outside the scope diff. Do not stop any process you did not start — other lanes share
  this host.
- Not run and not findings: Aspire, Docker, browser, `scaffold.runtime`, `e2e:cli`. This leaf holds
  no runtime lease, which is precisely why D1 exists.

## Verdict rules

- **`PASS`** — the plan is sound, correctly scoped, and its gates would actually prove it. Say what
  you attacked and failed to break; a `PASS` with no attack narrative is not a `PASS`.
- **`FAIL_FIX`** — bounded corrections to the plan; name each one and what would satisfy it.
- **`FAIL_PLAN`** — the approach or scope is wrong and must be re-planned.

State the evaluated head, assert local == remote == PR head yourself before judging, and scope your
verdict to that head. If you find nothing, say so plainly — do not manufacture a finding to look
thorough.
