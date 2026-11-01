# Gate evidence

| Gate | Result |
| --- | --- |
| Structured tests: three Fresh files + public CLI route command | 50 pass,0 fail,0 ignored |
| Guard-reverted negative control | Exit1,9 intended assertion failures,3 pass |
| Restored focused tests | 50 pass,0 fail |
| Independent reviewer three Fresh files | 43 pass,0 fail |
| Actual generated workspace + ui:add + CLI | PASS, repeated generation preserves all page bytes |
| Actual generated Vite dev + full production build | PASS,10 bound pages unchanged,one binding each |
| Structured check | 15 files,0 occurrences |
| Structured lint/fmt | 15 selected,15 processed,0 findings,0 coverage refusals |
| quality:gate (quality:scan + arch:check) | PASS,existing accepted advisories retained |
| Changed-source quality scan | PASS,0 findings/allowances |
| JSR audit | PASS,baseline AI folder cardinality advisory and slow-type banner advisory |
| Fresh native publish --dry-run --allow-dirty | Exit0,Success Dry run complete |
| Full export-map structured doclint | Exit1,45 diagnostics,baseline identical28 private refs/17 missing JSDoc |
| deps:audit --level critical | PASS,no critical advisories; lower severity advisories remain |
| Native agent docs prose generation/check | PASS,only two changed docs pages embedded |
| Native export corpus generation/check | PASS,read-set clean after source commit;no output changes |
| Native publish assets generation/check | PASS |
| Full scaffold.runtime CI | Required,awaiting coordinator scheduling;never run locally |

Wrapper invocations are in memory-validation.md. Raw logs remain outside Git; public CI/review links
will supply immutable final-head evidence without moving the reviewed head. No lock/dependency change.
