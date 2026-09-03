# S5 expensive-gate failure

## Lease and execution identity

- Central lease checkpoint: `32df87c7c`
- Product content head: `193e665ba0592273622253e3e9a1ebfc019b1be9`
- Clean suite execution head: `ab78eaa35c1753f9e8c526dbd234c7073758008b`
- Content-to-execution delta: committed run artifacts only
- Command: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`
- Release-gate verdict: **FAIL**, raw exit code 1
- Suite summary: `passed=20 failed=1 skipped=0`
- Suite-owned raw JSONL output:
  `reports/s5-scaffold-runtime-20260815-184907.log`
- Raw-log SHA-256: `e45934adc737626e6b5d05dc1c8dccbb8fb7c2cab0bab76b828520150206d225`

No catalog entry or `run-gate.ts` receipt was created for `scaffold.runtime`.

## Exact failure

The failing suite gate is `generated.service-client-contract` — "Prove idempotent two-service
client and cache-key output". Its command exited 1 because the probe required the later
`service generate` invocation to report `Wrote 0 Aspire helper files.` but observed:

```text
Wrote 0 service client modules.
Skipped 2 current service client modules.
Wrote 3 Aspire helper files.
```

The two earlier leaf gates passed against the real generated project:
`scaffold.service-client-add` and `scaffold.service-client-generate`. The latter reported zero
client writes and zero Aspire-helper writes before the intervening plugin/runtime-schema/database
gates. The later static probe then failed on the three helper writes. That sequence is recorded as
observed evidence; no product-cause or repair is inferred under the lease.

## Attribution

This exact failure does **not** reproduce at pre-implementation commit `c53726c69`: the
`generated.service-client-contract` gate and `service-client-runtime-probe.ts` do not exist there,
and the old `service generate` command only regenerates Aspire helpers; it has no client-generation,
idempotency, `--dry-run`, or `--force` contract. The failing assertion and execution path were added
by this leaf, so the failure is leaf-caused and cannot be carried as a pre-existing baseline.

No product repair or retry followed.

## Mandatory cleanup proof

Suite-owned `cleanup.aspire-stop` passed. The run-owned teardown then reported:

```json
{
  "applied": true,
  "stoppedAppHosts": [],
  "removedContainers": [],
  "escalated": []
}
```

The required post-runtime `agentic:leak-check` returned exit 0 at
`2026-08-15T16:49:46.397Z`:

```json
{
  "probes": {
    "aspire": { "state": "ok" },
    "docker": { "state": "ok" }
  },
  "survivors": []
}
```

The host is empty. Because `scaffold.runtime` failed, the conditional inter-gate audit was not
eligible and `fresh-browser` was **NOT_RUN**. No Fresh browser receipt exists.
