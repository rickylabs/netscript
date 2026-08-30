use harness

## SKILL

Load `netscript-harness`, `netscript-doctrine`, `netscript-tools`, `netscript-deno-toolchain`,
`netscript-cli`, and `netscript-pr`. Read `.llm/harness/evaluator/` and
`.llm/harness/gates/static-gates.md`.

# PLAN-EVAL cycle 2 — #1732 / PR #1747 (Aspire background reference-name validation & source safety)

You are the **independent adversarial plan evaluator**, and you are a **different session from cycle
1**. Do not assume cycle 1 was right; do not assume it was thorough. Re-derive what matters.

## Identity and scope

| Field | Value |
| --- | --- |
| Evaluated head | `e0186bbd4cee9d60425129818fe74437974eb48a` |
| Branch | `fix/aspire-reference-name-validation` |
| Your worktree | `/home/agent/projects/netscript/worktrees/007-eval-1732-c2` (detached at that head, clean) |
| Base | `13878a80a50c55b9662099fed64555f2310ae4a3` (live `main`) |
| Cycle-1 head (`FAIL_FIX`) | `fddcb833ba5e49466ac942112b41bd7712aa7c17` |
| Cycle-1 verdict commit | `1f52d5e2b6b35e204167686714fe3ad72f4fafae` |
| Issue | #1732 (p1, `0.0.7`) · draft PR **#1747** at `status:plan` |

**This is cycle 2 of 2 — the last granted plan cycle.** A `PASS` unblocks the RED slice; a failure
sends the leaf to the coordinator, not to a cycle 3.

**Artifact-only.** Write exactly one new file,
`.llm/runs/fix-aspire-reference-name-validation--1732-source-safety/plan-eval-cycle-2.md`, and
preserve cycle 1's `plan-eval.md` **bit-identical**. Touch no source, no test, no other artifact, no
PR body, no label, no draft state, no milestone, no issue. Commit and push with an explicit refspec
only: `git push origin HEAD:refs/heads/fix/aspire-reference-name-validation`. You are on a
**detached** worktree — commit onto the branch tip you evaluated, never a stray head. Never
force-push.

Post exactly one PR comment on #1747: `[PHASE: PLAN-EVAL] [VERDICT: PASS|FAIL_PLAN|FAIL_FIX]`.
**Post it yourself.**

**No implementation exists and none may be written by you.**

## What cycle 1 found

Read `plan-eval.md` in full. Verdict `FAIL_FIX`, two required fixes:

- **F1** — D1 over-claimed. `safeIdentifier` is `name.replace(/-/g, '_')`, so `JSON.stringify` covers
  string-literal positions only and the **identifier seam** was uncovered. `class` / `await` pass
  both the scaffold validator and the D2 Aspire grammar and emit unparseable bindings; `builder` /
  `config` parse and then shadow the generator's own bindings (runtime `ReferenceError`).
- **F2** — the escaping enumeration was organized by name-origin rather than emission site, missing
  the resolved `entrypoint`, `workdir`, and `ConcurrencyEnvVar` literals.
- Advisory: D4 must stay a composed-level `superRefine`; a `.regex()` on `ReferenceFields` or the
  record key would surface in `z.toJSONSchema(AppSettingsSchema)` and change the published JSON
  schema for every section.

The supervisor authorized F1 **option (a)** — generator-local safe bindings — and explicitly
**rejected** option (b) (rejecting reserved words at the config boundary), because that would make
the rule stricter than Aspire's: the self-inflicted breaking change D1–D3 exist to prevent.

## What changed at this head

The amendment went **further than option (a) as authorized**: instead of prefixing
`safeIdentifier(name)`, it removes user-supplied text from identifiers entirely — processor bindings
are `bg_${processorIndex}`, references are `ref_service_${i}_${j}` / `ref_plugin_${i}_${j}`. Shared
`safeIdentifier` is left untouched. F2 is re-enumerated by emission site; the advisory, the missing
risk row, the corrected open-decision sweep, the JSR-reachability condition, and the PR DoD wording
are all claimed addressed.

## Your job

Judge the **amended plan on its own merits at this head**. Cycle 1's `PASS` items are not inherited
— spot-check the ones that the amendment could have disturbed.

1. **Does the new derivation actually close F1 — and what did it break?** No user text in identifiers
   makes reserved words and shadowing structurally impossible, which is stronger than a prefix. But
   check the consequences: are the ordinals **stable and unique** across processors *and* across both
   reference lists on the same processor (cycle 1 observed a fixture declaring one name as both a
   service and a plugin reference — do `ref_service_0_0` and `ref_plugin_0_0` stay distinct)? Does
   any existing test pin the old identifier text? Does the background generator still import
   `safeIdentifier`, and if not, is the now-unused import handled? Does dropping the name from
   identifiers cost anything the plan should have declared — traceability in generated source, for
   instance — and is that acknowledged?
2. **Is the discovery-key contract still intact?** `services__<ref>__http__0` is a **string literal**,
   not an identifier, and was runtime-verified in #1371. Confirm the amendment did not move it and
   that positive **and** negative assertions still cover both reference kinds.
3. **Is F2 now complete by emission site?** Read
   `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts` end to
   end and find any interpolation the amended enumeration still misses. One missed site means the
   load-bearing property is still not load-bearing.
4. **Re-check D2 against the platform.** Cycle 1 verified it against upstream `ModelName.cs`. Verify
   independently rather than inheriting the claim; if you disagree with cycle 1, say so.
5. **Re-check D5's blast radius** the same way — can anything in this tree (scaffold, template,
   fixture, doc example, existing test) produce a name the amended plan rejects?
6. **Did the amendment quietly widen scope or narrow a claim to fit the code?** Diff
   `fddcb833..e0186bbd` and read what actually changed. A DoD box reworded to become trivially true is
   not the same as a defect fixed.
7. **JSR reachability condition** — the plan now forbids slice 3 from re-exporting the rule through
   `src/domain/mod.ts` or typing any exported symbol with it. Is that condition sufficient and
   verifiable, and do the recorded doc-lint / JSR-audit baselines still hold at **this** head?
8. **Scope discipline** — diff versus base outside `.llm/runs/` must still be empty. No source may
   have leaked ahead of the gate.
9. **Receipt honesty** — every SHA in the plan, PR body, and comments must resolve to a real commit.
10. **GitHub surface** — `Closes #1732`, exactly one `status:` label, milestone `0.0.7`, still draft.

## Host conditions — record honestly, never launder, never charge them to the plan

~7,700 PID-1-owned zombie processes that no agent can reap. **Do not run root `deno task test`** — it
is not a usable signal here. **`rtk` is not installed on this host**; call the underlying commands
directly and do not install anything. Record any host-caused failure with evidence as a host
condition, outside the scope diff. Do not stop any process you did not start — other lanes share this
host. Not run and not findings: Aspire, Docker, browser, `scaffold.runtime`, `e2e:cli`; this leaf
holds no runtime lease, which is exactly why D1 exists.

## Verdict rules

- **`PASS`** — the amended plan is sound, correctly scoped, and its gates would actually prove it.
  Say what you attacked and failed to break; a `PASS` with no attack narrative is not a `PASS`.
- **`FAIL_FIX`** — bounded corrections; name each and what would satisfy it.
- **`FAIL_PLAN`** — the approach or scope is wrong and must be re-planned.

State the evaluated head, assert local == remote == PR head yourself before judging, and scope your
verdict to that head. This being the last granted cycle is **not** a reason to soften a real finding,
and equally not a reason to manufacture one. If the plan is ready, say so plainly.
