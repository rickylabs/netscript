# S5 concurrent-start — static plugin inventory (no runtime)

Canonical fixture confirmed buildable: `netscript init --db postgres --cache --cache-backend redis`
then `netscript plugin install {workers,sagas,triggers,streams} --project-root <root> --no-samples --ci`
(all four `exit 0`). Static resource set present in the generated
`aspire/.helpers/register-plugins.mts` (`addExecutable` calls, plugin `Map` keys):

- `workers`, `workers-api`
- `sagas`, `sagas-api`
- `triggers`, `triggers-api`
- `streams`
- plus the default `postgres`/`redis`/`<app>-web` resources from `init`.

This is the **one project** #1717 box 4 requires: `aspire start --isolated` twice against this
single generated project (not two distinct roots — corrected reading, D-83) should reach all of
these healthy concurrently. Ready for the receipt on the next authorized lease.
