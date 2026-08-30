# Tier-A review — #1466 cycle 4 (IMPL-EVAL `FAIL_FIX` repair), PR #1731

| Field | Value |
| --- | --- |
| Reviewer | features topic supervisor, native Claude Opus 5 · high · Remote Control (PID `5495`) |
| Author | Codex `gpt-5.6-sol` · medium, thread `01a051d1-e622-74c1-8b2f-1ad80a540c29` |
| Content head | `42874803e572a5746834880e387501f0948c7362` |
| Evidence head | `dd2018166e70c2b638e106d6c52e2bb16e5a23a2` — local == `origin` == PR head, clean |
| Review worktree | `/home/agent/projects/netscript/worktrees/ns1466-tiera-c4`, detached — **never** the author's (D-19) |
| Scope | IMPL-EVAL findings F-1…F-5 and the archive/recut. No ruling of R-1/R-2/R-3 reopened. |

Every number below was **re-measured in my own worktree**. Where I quote the evaluator or the author,
I say so and I say whether my measurement agreed.

## F-1 — withdraw the published mutable singleton. **Closed.**

`contract-primitives.ts:123` now reads `MergedErrorMap<Record<never, never>, CommonErrorMap>`; the
`commonErrorMap` value export is gone from `src/public/mod.ts`; the docs row is deleted and row 29's
signature updated. The value was not frozen as a workaround — it was withdrawn, which is what R-2
ruled.

**The binding constraint held, and it was the one worth checking.** The whole risk of F-1 was that
withdrawing a public export to satisfy doctrine would move the `public-doc-lint` finding set that
R-1 pinned at delta 0. I ran the receipt's exact 16-entrypoint argv at both ends:

- `main` `13878a80a`: exit 1, **12** findings.
- head `dd201816`: exit 1, **12** findings.
- Sorted set diff, ANSI-stripped: **9 identical**; `main`-only = `BaseContractRoute→BaseContractErrors`,
  `BaseContractOutputRoute→BaseContractErrors`, `baseContract→oc`; head-only =
  `BaseContractErrors→MergedErrorMap`, `baseContract→ContractBuilder`, `baseContract→Schema`.

That is **exactly** the three-way set the IMPL-EVAL recorded in R-1, reproduced independently. R-1's
condition — "any future head of this branch must keep the count at 12 and the set identical" — is
satisfied at the cycle-4 head. No upstream type was re-exported to achieve it (AP-14 holds).

**Withdrawal is safe for consumers, verified rather than assumed.** `grep -rn commonErrorMap` across
`packages`, `plugins`, `templates` outside `packages/contracts/` returns **zero** matches, and the
`check` receipt is exit 0 over the `packages` + `plugins` roots, which is what would catch a broken
import. Nothing in the workspace consumed the value through the public specifier.

## F-2 — pin the real initializer. **Closed, and I broke it to prove it.**

The new `assertion-budget_test.ts` case asserts the stripped source of `contract-primitives.ts`
contains `oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap)` exactly once.

I did not take that on trust, because the whole reason F-2 exists is that the *previous* guard was
accepted and turned out not to guard:

| Probe | Result |
| --- | --- |
| Suite at head, unmodified | 5 passed / 0 failed |
| **Perturbation B** — real initializer → `oc.$meta<Record<never, never>>({})` (the exact mutation that defeated the old probe, all three guards at exit 0) | **RED** — `base contract initializer remains pinned…` fails at `:127` |
| **Forgery attempt** — perturb the real initializer *and* plant the correct text in a trailing `//` comment | **still RED** — `stripCommentsAndStrings` removes it |

So this is a real tripwire and it cannot be satisfied by a comment. Worktree reverted clean after
each perturbation (`git status` empty).

D-5 is amended honestly: it now states the probe pins the alias spelling against oRPC's inference for
the contracted expression, explicitly says it does **not** observe `baseContract`'s initializer, and
names the assertion-budget pin as what closes the residual. The overclaim the evaluator flagged is
gone.

## F-3, F-4, F-5

- **F-3 closed.** One-line header on `procedure-meta-inference_test.ts` stating why the test reaches
  into `src/`. After F-1 the internal import is the only route to the real value, so the header is the
  correct resolution rather than switching to a public import that no longer exists.
- **F-4 closed, verified against the tool.** `deno doc --filter BaseContract` reports
  `type BaseContract = typeof baseContract`; the docs row now says exactly that. I checked the tool
  output, not the diff.
- **F-5 delivered but defective — see AF-1.**

## Receipts and archive

All eight contracted receipts exist at the **content** head with `gitHead == actualGitHead ==
42874803e`, named explicitly, never a glob:

`check` 0 · `lint` 0 · `fmt-check` 0 · `quality-gate` 0 · `arch-check` 0 · `publish-dry-run` 0 ·
`public-doc-lint` **1** (baseline-red, delta 0, R-1) · `test` **SKIPPED**.

The `test` receipt records `outcome: SKIPPED` with `reason: "R-1 forbids retry on this host;
frozen-235482767/test-final.json retains the terminal host-baseline FAIL"`. **I accept this.** R-1
forbade further retries, the terminal FAIL is retained in the archive, and the author declined to
fabricate a number — which is the behaviour this lane wants. The residual risk that root `test` never
ran at the new content head is covered independently: `check` is exit 0 across both roots, the new
assertion is exercised by the focused contracts suite, and the only public-surface change has zero
workspace consumers. Whether a `SKIPPED` receipt satisfies the contracted set is an **evaluator
ruling**, not mine; it is routed to IMPL-EVAL rather than decided here.

Archives are append-only and intact: `frozen-c9a391811` 8 files, `frozen-235482767` 8 files. Nothing
was overwritten.

Supplemental evidence at the head, independently re-run by me:

- `deno test --allow-all packages/contracts` → **16 passed / 0 failed** (15 before, +1 for the new pin).
- `deno task docs:exports-drift` → **PASS, exit 0**. The withdrawn export's docs row was removed, so
  the `mode=complete` contracts inventory is consistent again.

Sufficiency is `INSUFFICIENT` with reasons `public-doc-lint did not pass (FAIL)` and `test did not
pass (SKIPPED)`. That is the honest mechanical answer and both reasons are external per R-1.

The evidence commit `dd201816` touches **zero** files under `packages/`, `plugins/`, or `docs/` —
verified by `git diff --name-only`. Content head is genuinely unmoved.

## Finding

**AF-1 (low, corrected in cycle 5) — the file written to close F-5 misstates its own route.**

`supervisor.md` records `Model: Codex · OpenAI · GPT-5.6 Sol · high` and files **both** repair cycles
under a `complex_implementation` · Sol · **high** row. The measured routes, from the launcher's own
verdicts: the original slice-1 implementation ran `complex_implementation` · high; repair cycles 1–3
(`01a0515c`) and cycle 4 (`01a051d1`) all ran `normal_implementation` · Sol · **medium**. Every repair
cycle is attributed to a lane and an effort none of them used.

This is not pedantry. `supervisor.md` exists — and says so in its own header — so other supervisors
can discover a run's operating identity without chat memory, and the IMPL-EVAL session reads it next.
A run-identity file that misreports its own route is the same error class this leaf was corrected for
one cycle ago: **evidence written from the claim rather than from the artifact**. It is also exactly
the blind spot D-25 records, where route identity cannot be verified after the fact.

Bounded correction dispatched as cycle 5 (`slices/impl-1466-repair-5-identity.md`): one file,
evidence-only, content head unchanged at `42874803`, no recut — the same evidence-head pattern as
`fc81e652` and `74483f02`.

## Verdict

**`ACCEPTED_WITH_FINDINGS`** at content head `42874803`.

All five IMPL-EVAL findings are closed on substance. The two claims that could have been quietly
wrong — that F-1 does not move the R-1 pinned set, and that the F-2 pin actually fails — were both
re-measured and both hold, the second by breaking it two different ways. AF-1 is a documentation
accuracy defect in a run artifact, not a product defect; it is corrected in cycle 5 before IMPL-EVAL
reads it. No ruling of R-1, R-2, or R-3 is reopened, and no plan amendment is made.

Not on this lane's authority and withheld: merge, publish, ready-flip, relabel (#1731 still carries a
stale `status:plan`), milestone change, issue close, `#1348`/cluster-state mutation, gate lease, and
adding `docs-exports-drift` to the gate catalog (R-3 routes that to the coordinator).
