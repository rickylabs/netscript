# Context Pack: #1373

Planning, S1 service-derived symbols, S2 published-doc convergence/negative guards, and S3 static
and fitness gates are complete on `fix/golden-path-single-client-dialect` at `main@2e7379b40`.
The draft PR is #1424 and remains draft for the owner's opposite-family IMPL-EVAL.

The locked outcome is one per-service module, `createQueryFactories` on the golden path,
`createServiceQueryUtils` explained only in the SDK reference, service-derived template exports,
and negative docs guards. Owner controls IMPL-EVAL, CI, and merge.

Decisive evidence includes the non-default `orders` scaffold pre-fix RED, both docs-policy mutation
REDs, 192-source clean sweep, full docs build/link/caveat gates, focused CLI tests, scoped
check/lint/format, `quality:scan`, and `arch:check`. No runtime/AppHost gate was authorized or run.

Post-IMPL-EVAL CI found the quickstart executable-command mirror stale after `--with-client` was
documented. The branch now updates both the mirror and the separately built service-add gate, with
an assertion that the executable command contains the flag. The focused presentation suite is
green; the real Aspire-backed `quickstart.walk` still requires an explicit serialized grant.
