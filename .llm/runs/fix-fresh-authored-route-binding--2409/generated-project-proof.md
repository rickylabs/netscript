# Actual generated-project proof

Maintainer init generated a local-source workspace with db:none, no Aspire, editor:none and no Git.
Public ui:add page notes and generate routes succeeded. Copied Fresh rewriter bytes match reviewed
source. Against its actual generated Vite config, real createServer (middleware, no listener) and
full production build succeeded. Ten bound scaffold/ui:add pages remain byte-identical and each
contains exactly one withRoute call after CLI generation, dev initialization and production build.
A repeated CLI command exits0 and preserves every route TSX byte. The local Vite server was closed.

This is focused frontend acceptance, not the full scaffold.runtime suite. No containers/AppHost
started. Full repository runtime CI remains coordinator-owned and explicitly required before merge.

Probe invocation must run with the generated app as cwd. Running its absolute script from monorepo
cwd made upstream Fresh's resolver miss fresh/runtime-client; the same untouched config succeeds
from the correct app cwd. No source/dependency workaround or alias patch was applied.
