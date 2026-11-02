**S1 re-review: PASS** — F1 is fixed, and nothing else in S1 blocks.

This review covers S1 code and the four gate files only. It doesn't certify the browser render matrix that is still running, and it isn't the final IMPL-EVAL. S2 (live clients, plugin discovery from metadata, record detail) has not been assessed.

## F1 is resolved
- **Fix** (`packages/cli/src/kernel/assets/app/lib/scaffold-capabilities.ts.template:15-50`):
  - The workspace-root lookup, the `appsettings.json` read, the JSON parse, the schema parse and the auth-route check all sit inside one `try`.
  - On any failure the reader logs `console.error` on the server only. It returns all five capabilities (service, auth, workers, streams, ai) as `state: 'unavailable'`, with the same fixed safe description and no command.
  - The returned objects carry no path or raw error text, so nothing sensitive can reach a view or island.
- **Test** (`packages/cli/src/kernel/application/scaffold/writers/workspace-pages_test.ts:104-152`):
  - It renders the real template and runs it against a temporary root.
  - It covers a missing file, invalid JSON (with secret-like content) and an invalid schema (`Services: 42`).
  - For each case it asserts the five ids in order, `unavailable` for every one, no `command`, and that neither the temp root path nor the file contents appear in the returned props.
  - It also asserts three server-side error logs.
  - The case where the workspace root itself is not found is stubbed out, not exercised. The lookup is inside the same `try`, so it fails the same way, but the test doesn't hit it directly.

## Evidence
| Gate | Result |
| --- | --- |
| `s1-tests.json` | `workspace-pages_test.ts` + `write-app-files_test.ts`: 11 passed, 0 failed, exit 0 (up from 10, so the new test is included) |
| `s1-app-check.json` | Generated-app check: 47 files, 0 diagnostics |
| `s1-lint.json` | 5 files, exit 0, 0 findings |
| `s1-fmt.json` | 5 files, 0 findings |

The app-check file is not timestamped, so I can't confirm it ran after the F1 change. The fallback's return type is compatible with `ScaffoldCapability`, so I expect no new diagnostics. If that file predates the fix, re-run it before supervisor sign-off.

## Carried to S2/S3 (not blocking)
1. Resolve the auth route path from the app's actual working directory instead of hardcoding `apps/{{appName}}`.
2. Detect plugins by `canonicalName`/`resourceConfigKey` instead of literal keys.
3. Fix the hardcoded `aria-current` on the settings section rail and on the dashboard tab when it renders at `/`.
4. Show the platform-appropriate shortcut hint instead of `⌘K` everywhere.
5. Use `appRoutes.signIn.href()` instead of the literal `'/sign-in'` in settings.
6. Add behavioral tests for the absent, installed-unwired and auth-ready states, plus the planned lifecycle transitions.
7. Record the render-matrix results (no service, with a service, with plugins; light and dark; 1440 and 390 widths) once the current run finishes. That evidence wasn't available for this review.
