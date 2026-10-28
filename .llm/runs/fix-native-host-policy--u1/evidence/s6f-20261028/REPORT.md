# S6f streams storage source gate complete

Exactly two editable owners, under the root-reviewed81-line proposal6059a0e8:

- `service-storage_test.ts`: **230/260 lines**,11335 bytes, SHA256
  `16e377abc328f0255a12e8ec40a707d415376e53e1f5b22db7495de690b7a42c`.
- `tests/test_utils/service-runtime-fixture.ts`: **295/300 lines**,12047 bytes, SHA256
  `52de7cb52753ede9437e01ddbb53205a2f1ca8823b3cf79ab58bc95bbfce13d5`.

Fixture changes are exactly the new readonly denyWrite boolean and native --deny-write substitution
when true. Reconstructing those two edits from accepted HEAD reproduces the final bytes exactly.
All369 other protected bindings match. `storage.final.ts`/`fixture.final.ts` are complete sources;
`source.diff` is the complete two-owner diff. No production or broader authority changed.

## Actual eight-row native evidence

All calls go through the public factory; no store injection/private close/kill-as-success. Synthetic
storage directories live inside the existing owned scratch. Explicit public auth reasons, front
loopback/port0 (known selected front port for failure rows), frozen/cached checked children and
existing addon/sys/read/net/run authority remain. Installed MCP literal docs lookup and exact native
durability/proxy/bounded-store/restart sources were used. Native behavior is source-qualified.

| Row | Actual native result | Rebound upstream/front ports |
| --- | --- | --- |
| file writer | PUT201/POST204; front and upstream200 exact12 bytes `before\|after` | 57539 /63336 |
| file fresh reader | same12 bytes/final offset; first-offset tail200 exact5 bytes `after` | 63339 /61306 |
| memory writer | PUT201/POST204 and matching real200 bytes/offset | 61311 /58921 |
| memory fresh reader | front/upstream404, consumed `Stream not found`, offset null | 58924 /50248 |
| empty configured path | Error: STREAMS_DATA_DIR must name an existing directory. | 50251 /50252 |
| missing configured path | same exact Error, retained native NotFound cause | 57885 /57886 |
| regular-file path | same exact Error; no memory fallback | 59822 /59823 |
| explicit write denial | native Deno.errors.NotCapable at the owned probe path | 50074 /50075 |

Writer first offset is `0000000000000000_0000000000000012`; final offset is
`0000000000000000_0000000000000022`. These opaque native values pass unchanged via validated parent
receipt/checked stdin to the fresh reader; no offset arithmetic is assumed. Both file health
responses are healthy200, mode file/durable true/probe passed, with no dataDir key. Both memory
health responses are mode memory/durable false/probe not-applicable, also with no dataDir key.
File writer91964 settles before reader76584 starts; memory writer86680 settles before reader57936
starts. Each pair shares only its owned sandbox directory. `fresh-process-pairs.json` verifies the
distinct process identifiers, ordered settlement and same scratch. This is orderly restart only.

The denied child actual native message identifies write access to
`data/.netscript-storage-probe-00813de6-b7ef-47f9-a070-9d886bd97bbd` inside its owned scratch.
The complete native absolute path/message is preserved in its raw result. The oracle checks exact
NotCapable class, write operation, normalized configured parent directory and UUID probe basename.
No compiler/module/cache write was needed. The data directory remains empty. Configured failure
rows return no running handle and never emit the ephemeral-storage warning; exact native errors
are caught/asserted, so their qualification children correctly exit0 after independent rebinds.

## Actual gates and hygiene

- Owning **12 passed /0 failed /0 ignored**,36,928ms; existing10 unchanged,2 new parent tests.
  Both new tests explicitly enable resource/operation/exit sanitizers.
- Eight selected files pass types/lint/fmt with no dropped files, refusals or failed batches.
  Both changed owners pass quality with0 findings/0 allowances. No whole-architecture repeat.
- Twenty runtime argv comparisons pass: existing12 match prior default argv after replacing only
  dynamic owned scratch/allocator port values; all8 storage rows match that same authority shape,
  with only write-denied replacing the one write grant. Actual omitted/false branches retain the
  exact allow-write scratch argument; one true branch has --deny-write and no write grant.
- All56 captured runtime-fixture child results settle status/stdout/stderr/stdin. All19 owned
  scratch/profile paths are verified absent;36 native addon hash comparisons match. Runtime
  children required no timeout/overflow kill; frozen S4 watchdog/output controls remain separate.
- The first evidence-preparation script failed after writing the correct gate driver due to an
  out-of-scope variable. PREPARATION_FAILURE.md and the original script retain that actual failure.
  Separate prepare-bindings.ts repaired only the evidence baseline; native source/gates were not
  rerun or altered. The one actual owning suite passed; this is not a preparation PASS claim.

`source-proof.json` binds complete owners, sole fixture exception,369 protected paths, all8 rows,
argv and cleanup, SHA256 `123afc364c965ae68832a76cc75f7a339e28e5ee4d4aea5cdaa61751e08bfca5`.
`gates/execution.json` records actual commands/process results; `gate-hashes.json` binds reports.
Windows only; Linux, legacy/delegation, required retained/CI/publication gates and independent IMPL
remain open. No S6f checkpoint/push or later source scope before root's complete source review.
