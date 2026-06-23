# AS7 JSR Scorecard

Source-controllable target: 8/9 factors. Provenance/SLSA is publish-time only and is currently
deferred because `.github/workflows/ci.yml` explicitly says OIDC publish is out of scope.

| Package | Full export `deno doc --lint` | `deno publish --dry-run` | Slow types | Description <=250 | Runtime markers | Projected source-controllable score |
| --- | --- | --- | --- | --- | --- | --- |
| `@netscript/plugin-auth-core` | PASS, 8 files | PASS | 0 | PASS | Deno via JSR metadata | 8/8 |
| `@netscript/auth-workos` | PASS | PASS | 0 | PASS | Deno/Node-compat tests | 8/8 |
| `@netscript/auth-better-auth` | PASS | PASS | 0 | PASS | Deno/Node-compat tests | 8/8 |
| `@netscript/auth-kv-oauth` | PASS, 8 files | PASS | 0 | PASS | Deno KV/OAuth docs | 8/8 |
| `@netscript/plugin-auth` | PASS, 7 files; npm `@types/node` warnings only | PASS | 0 | PASS | Deno plugin/service docs | 8/8 |
| `@netscript/service` auth seam | PASS, root + `src/auth/mod.ts` | PASS without `--allow-slow-types` | 0 for checked surface | PASS | Deno service docs | 8/8 for auth seam |

## Notes

- `plugins/auth` dry-run reports one `unanalyzable-dynamic-import` warning for runtime bootstrap
  loading in `services/src/main.ts`; Deno exits 0 and includes the file list.
- `plugins/auth` doc-lint emits external npm `@types/node` resolution warnings from cached
  dependency types; Deno exits 0.
- Provenance is not claimed. Debt entry: `release provenance — OIDC publish workflow deferred`.
