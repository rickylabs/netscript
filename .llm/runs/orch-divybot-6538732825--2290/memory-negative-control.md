# Negative-control recipe — 2026-10-31

To prove availability regressions, revert only contract-authorizer.ts and auth-middleware.ts to
baseline contents in a try/finally while retaining new types and tests. The structured test wrapper
with filter `/procedure availability: (authenticated unknown|declared retired)/` selects exactly
two tests. Both must fail on 403 versus 404/410, not on missing types or zero selection. Restore
byte-for-byte, then rerun the real service suite. All steps fit in one synchronous launcher.
