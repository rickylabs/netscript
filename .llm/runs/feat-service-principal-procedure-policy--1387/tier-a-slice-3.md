# Tier-A — #1387 Slice 3 (typed context runtime composition)

**Content head:** `c297064aa76ca1b2b790f399adfb899e95c03920`
**Evidence head:** `08488e600` — product-neutral, `git diff --stat <content>..<evidence> -- packages plugins docs templates` empty
**Base:** `8e1d639d2` · **Verdict:** ACCEPTED (see § Verdict)

## Ceiling

Exactly the four authorized files — `service-builder-impl.ts` and the three named test files. Nothing
else. `deno.lock` byte-identical at `edfa0c24…`, matching the base.

## Substance — the composition is right

`buildRpcContext` no longer mutates the caller's object. It returns a fresh
`ServiceHandlerContext<TCustom>` built by spread:

```ts
return {
  ...this.contextFactory(c),
  ...(this.database ? { db: this.database } : {}),
  ...(traceHeaders ? { traceHeaders } : {}),
  ...(principal ? { principal } : {}),
};
```

Every framework field is conditionally spread, so **no key is ever created with an `undefined`
value** — which resolves **D-8** in the runtime direction. `traceHeaders` is likewise assembled from
only the headers actually present, so the published `Readonly<Record<string, string>>` is now **true
of the runtime** rather than aspirational, and the internal `| undefined` annotation is gone. This is
the third door the previous dispatch was not offered; it needed no ceiling amendment and no owner
ruling.

## The proofs are real, not acceptance-only

The tests freeze the factory result (`Object.freeze`) and assert the composed context is a different
object (`assertNotStrictEquals`) — so non-mutation is proved, not assumed. Trace behaviour is checked
with `Object.hasOwn`, which is the only assertion that can distinguish "absent" from "present and
`undefined`"; an `assertEquals` on the value alone would have passed against the old defect. Four
cases: parent-only, state-only, `traceContext: false`, and no headers at all.

## Gate results — all at content head `c297064aa`, `gitHead == actualGitHead`

| Gate | Receipt | Outcome | Duration |
| --- | --- | --- | --- |
| `check` (scoped) | `check.json` | PASS | 2 949 ms |
| `lint` (scoped) | `lint.json` | PASS | 548 ms |
| `fmt:check` (scoped) | `fmt-check.json` | PASS | 538 ms |
| `test` (service) | `test-service.json` | PASS | 6 891 ms |
| `quality-gate` | `quality-gate.json` | PASS | 8 436 ms |
| `mcp-export-corpus` | `mcp-export-corpus.json` | PASS | 8 998 ms |
| `exports-drift` | `exports-drift.json` | PASS | 3 407 ms |

Evidence set **SUFFICIENT**, zero reasons. Slice 2's eleven receipts remain frozen under
`receipts/slice-2-f9b32b4f/`; the top level holds only this slice's set — the D-6 discipline held.

**`mcp-export-corpus` carries a receipt for the first time**, which is the D-5 catalog fix paying
off: the corpus gate was contracted at every slice but until now could produce only prose. It passes
unchanged, which is the expected result for a behaviour-only slice — a moved corpus would have meant
a public signature changed, i.e. out of scope.

## Findings

- **F-1 (observation, non-blocking).** The behaviour proofs reach the **private** `buildRpcContext`
  through `as unknown as RpcContextBuilder`. That is the only seam available — no public API exposes
  the composed context — so the cast buys real coverage that would otherwise be unreachable. Worth
  noting rather than fixing here: a test that must cast away privacy is evidence the composition has
  no public observation point, which is the same surface question as #1787.
- **F-2 (carried, unchanged).** `TCustom` remains a phantom parameter on the public `ServiceBuilder`.
  Untouched by this slice by design; tracked as **#1787**, not as slice work.

## Verdict

**ACCEPTED.** The contracted gate set is green at `c297064aa`, the ceiling was respected exactly, the
lock is byte-identical, D-8 is resolved in the correct direction, and non-mutation is proved rather
than asserted. F-1 is an observation; F-2 is out of scope by ruling.
