# Full-export documentation lint comparison

Compared the saga packages with an isolated detached checkout of baseline main `204a71b1ef0133faa07ce5c191e4170b5cb76171` using the same `deno task doc:lint --root <package> --pretty` wrapper. The owned baseline checkout was removed after verification.

| Package | Baseline | Final | Interpretation |
| --- | --- | --- | --- |
| database | MigrationOptions lacked a summary in main (source comparison) | 0 | Added the missing summary; clean |
| plugin-sagas-core | 7 private type references | 7 identical findings | Existing telemetry/contract references, unchanged |
| plugin-sagas | 30 private type references | 30 identical findings | Existing downstream references, unchanged |

An additional new retention-result reference was caught and repaired by exporting CommandOutboxRetentionResult from the saga stores subpath. No introduced doc-lint findings remain. Full saga doc-lint is still red for the inherited findings; it is not reported as a pass. JSR package audits and native dry-runs are clean apart from existing warnings; all 475 public JSDoc examples compile.
