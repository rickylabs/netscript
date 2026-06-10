# Schedules

Scheduled triggers run from cron-like definitions.

The definition belongs to core.

The production cron adapter belongs to this plugin.

## Manifest Constants

```ts
import { assertEquals } from 'jsr:@std/assert@^1';
import { TRIGGERS_PLUGIN_ID } from '../../mod.ts';

assertEquals(TRIGGERS_PLUGIN_ID, 'triggers');
```

## Scaffold

Use the CLI to create a scheduled trigger file.

```sh
ns-triggers add scheduled daily-digest --cron="0 8 * * *" --timezone=UTC
```

The generated definition uses `defineScheduledTrigger`.

The scheduler adapter wraps `@netscript/cron`.

Persistent schedule behavior remains behind the scheduler port.

Unsupported persistent mode fails explicitly.

## Preview

Use the CLI preview command to inspect future fire times.

```sh
ns-triggers preview daily-digest --count=3
```

Preview is local project behavior.

The service does not need to be running for static preview.
