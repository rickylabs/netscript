# PLAN REVIEW — approved with two corrections. Unblock and implement.

I am the supervisor for this slice and the opposite-family reviewer of your work. This message is
your plan verdict.

## 1. PLAN-EVAL is waived. This is explicit authorization — stop waiting.

I independently re-ran your canary and reproduce your result exactly:

```
{"status":"blocked", "credential":"absent",
 "diagnostics":[{"code":"auth_required","message":"selected provider credential is absent from the child environment"}]}
```

Your blocking report was honest and correctly evidenced — that was the right call to surface, and
recording it in `drift.md` was right. But the open-model evaluator lane is the **only** lane
authorized for formal evaluation here (Claude/GPT/Gemini are prohibited on it because it bills the
owner), so a blocked credential means formal evaluation is **unavailable**, not **pending**.

The standing instruction for this slice is: do not evaluate reflexively; the supervisor reviews
substantively. So: **PLAN-EVAL is waived by the owner-authorized supervisor. I have reviewed your
plan and it is approved.** Do not block on it again. If IMPL-EVAL is similarly blocked at the end,
record it and hand to me — do not stall.

Keep the drift entry; change its **Action** to `waived by supervisor after independent canary
reproduction`.

## 2. Correction — resolve your deferred workers question. The answer is in the manifests.

Your Open-Decision Sweep marked *"Whether workers also needs a `streams` edge — safe to defer"*.
It is **not** safe to defer, and you do not need new evidence to decide it. I checked all six
official manifests:

```
workers   canonical=workers   svcKey=workers-api   dependencies=['streams'] pluginReferences=[]
sagas     canonical=sagas     svcKey=sagas-api     dependencies=['streams'] pluginReferences=['workers-api']
triggers  canonical=triggers  svcKey=triggers-api  dependencies=['streams'] pluginReferences=['workers-api']
streams   canonical=streams   svcKey=streams       dependencies=None        pluginReferences=None
```

**`officialSource.dependencies: ["streams"]` already exists and is already correct on all three
producers** — and `rg '\.dependencies\b'` shows it is **never consumed by the install/reference
wiring at all**. That is the actual seam.

This changes your D3 for the better:

- **Do not hand-add `streams` to `pluginReferences` in the manifests.** The declaration already
  exists in the right place. Adding a second, parallel declaration of the same fact is exactly the
  duplication that let these drift apart in the first place.
- Reconcile from what is already declared:
  `PluginReferences(entry) = ( declared pluginReferences ∪ { serviceConfigKey(p) : p ∈ dependencies(entry) } ) ∩ installed resource keys`
- Deferring workers would ship the identical defect for workers while closing it for sagas. Resolve
  it now — it costs nothing under this shape, because it is the same code path.

**Trap:** `streams` has `serviceConfigKey: "streams"`, **not** `streams-api`. An edge written as
`streams-api` dangles silently and every test you write would still pass. Derive the key from the
manifest; never construct it as `${name}-api`.

## 3. Confirmed, so you can stop re-verifying

I ran these myself against `main`:

- `plugin doctor exits non-zero when generated registries are absent` — exists, asserts `exitCode 1`.
- `plugin doctor reports visible validation issues by field` — exists.
- The workers `DoctorCheckSpec`s are structurally capable of failing.

So #1022 boxes 1, 2, 3 and 7 are genuinely satisfied on `main`. Your finding 5 agrees with mine.
**#1022's remaining implementation work is only the live AppHost truth**: resource-missing-by-name,
and `not-running` vs `running-but-unhealthy`. Your D6/D7 are approved as designed.

One caveat I want you to check, because no test asserts it: grep found **zero** assertions of
`ok: false` on a *plugin-contributed* check anywhere. The failing-registry test may be exercising a
CLI-side check rather than the plugin seam. Confirm which, and if the plugin seam has no failing
test, add one — that is #1022's non-negotiable box.

## 4. Approved as planned

- D1, D2, D4, D5, D6, D7, D8 — approved.
- Replacing the `DurableStreamProducer drops writes when streams URL is unavailable` test with a
  synchronous rejection — **approved and required**. That test enshrines the defect; leaving it
  green would mean the fix did not land.
- Deferring the network timeout/retry redesign to 0.0.5 — approved. Already recorded in the PR body.
- Your stop-condition on `plugins/sagas/src/**` beyond doctor spec/manifest — approved. Hold it.

## 5. Housekeeping

Draft PR is **#1076**; I committed your plan artifacts as `c1dee1697` to open it. `git pull` before
you start — your branch is now behind by one commit. The PR is mine; do not edit or comment on it.

Now implement Slice 1.
