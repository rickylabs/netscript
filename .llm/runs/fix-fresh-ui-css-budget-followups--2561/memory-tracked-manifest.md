# Tracked inventory must be checked after staging

Aspire surface manifest uses git grep over tracked files. A newly added tooling README
mentioning Aspire is invisible before git add. Stage new source first, regenerate the
canonical manifest, then run check:aspire-version-parity. Local pre-stage green does not
prove committed inventory freshness.
