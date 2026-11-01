# Streams raw routes need the native guard prefix

Native auth defaults protect `/api`; streams routes live under `/v1/stream`. A streams host
recipe must explicitly set `auth.authn.protect: ['/']` (or the desired raw stream prefix)
when supplying its authenticator. Passing an authenticator alone retains native `/api` scope
and does not guard raw streams. The factory forwards the policy unchanged; do not silently
copy/rewrite it. Correct the adopted streams factory JSDoc examples and the new host guide,
and prove missing/wrong credentials on raw routes with the explicit native guard policy.
Default anonymous health and immediate service-info remain documented public surfaces.
