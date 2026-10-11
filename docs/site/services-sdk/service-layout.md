---
layout: layouts/base.vto
title: Service layout
templateEngine: [vento, md]
---

# Service layout

Keep routers thin; place service logic behind repository ports.

## Generated single-entity layout

The CLI emits one application file per entity and keeps its repository interface in that file.
This is the **collapsed** shape: operations share one application module and the port does not yet
need a separate directory. Pure policy and technology adapters remain explicit. For a database
service named `users` with model `User`, the tree is:

```text
services/users/
├── deno.json
└── src/
    ├── main.ts                       # compose the repository and start defineService
    ├── router.ts                     # compose use-cases and aggregate version bindings
    ├── application/user.ts           # use-cases and the repository interface
    ├── domain/user.ts                # pure sort and pagination policy
    ├── domain/user_test.ts           # executable policy test
    ├── adapters/prisma-user-repository.ts
    └── routers/
        ├── v1.ts                     # bind procedures and map typed transport errors
        └── health.ts
```

Without a database, filenames use the service name: `application/users.ts`, `domain/users.ts`,
`adapters/memory-users-repository.ts`, and `application/users_test.ts`. The memory adapter owns
seeded records per instance; list results are snapshots. Its existing offset/search and status
contract differs from the Prisma CRUD contract, while the dependency direction stays the same.
Run `deno task test` inside either generated service; its test module needs no running database.

## Vocabulary and dependency direction

| Folder             | Responsibility                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `src/domain/`      | Entity vocabulary, invariants and pure policy. No IO or adapter imports.                               |
| `src/application/` | Use-cases orchestrating a port; no ORM or concrete adapter imports.                                    |
| `src/ports/`       | Repository, clock and outbound-client interfaces consumed by use-cases.                                |
| `src/adapters/`    | Named technology implementations, such as Prisma repositories or HTTP clients.                         |
| `src/routers/`     | Contract procedure bindings and transport error mapping. No ORM, sort policy or pagination arithmetic. |
| `src/auth/`        | Service-local authenticator and authorizer composition.                                                |
| `tests/`           | Cross-module suites; single-module tests may be colocated as `*_test.ts`.                              |

A router depends on the application; the application depends on domain policy and ports. An adapter
implements a port and imports its types. `main.ts` selects the concrete repository once, passes it
to `createRouter(repository)`, and starts `defineService`. The repository port is type-only in the
collapsed application module, so adapter imports do not reverse that dependency.

## Collapse decision table

| Role        | Small single-entity service                                                                          | Expand when                                                                                        | Must not collapse into                              |
| ----------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Domain      | Keep policy in one `src/domain/<entity>.ts`; trivial entity types can live alongside their use-case. | Policy is reused or entities have distinct invariants.                                             | IO adapters or transport handlers.                  |
| Application | One `src/application/<entity>.ts` holds cohesive use-cases.                                          | Operations have separate dependencies or multiple entities emerge.                                 | A router carrying business logic.                   |
| Ports       | Keep one small repository interface in its application file.                                         | Multiple use-cases share it or there are several outbound dependencies; move to `src/ports/`.      | Concrete technology code.                           |
| Adapters    | One technology file under `src/adapters/`.                                                           | Add a sibling adapter when another technology is needed.                                           | `src/routers/`; persistence stays outside handlers. |
| Routers     | One version binding file and a health binding.                                                       | Add a version or an independent resource namespace.                                                | Application or persistence modules.                 |
| Auth        | Compose simple auth options in `src/main.ts`.                                                        | Auth wiring becomes reusable or needs independent tests.                                           | Domain policy.                                      |
| Tests       | Colocate a module test as `*_test.ts`.                                                               | A suite crosses several modules; place it in `tests/` and include that directory in the test task. | An empty test target.                               |

The generator currently emits the single-entity shape. Expanded multi-entity generation and
`service add-handler` use-case generation are tracked in
[#2113](https://github.com/rickylabs/netscript/issues/2113) for 0.0.9. Today, place a new operation's
logic in the application module and bind it from the router manually.

## Migrate an existing service

1. Keep `contracts/versions/v1/` and its exports intact so clients retain their existing API.
2. Move sort allow-lists and pagination arithmetic from `routers/v1.ts` into a pure domain module.
3. Define the repository interface beside the application use-cases. Move Prisma delegate calls
   into a named adapter implementing that interface; retain the existing missing-record behavior.
4. Have `main.ts` create the adapter and pass it to `createRouter`. Have `router.ts` compose the
   application and version bindings. Bind procedures to use-cases and map transport errors in
   `routers/v1.ts`.
5. Add a policy or application test module before running the service's `deno task test`, then
   run its check, lint and formatting gates.
6. To expand a collapsed service, move the interface to `src/ports/<entity>-repository.ts`, split
   application operations or entities into cohesive modules, and update the type imports in both
   application and adapters. Split domain modules only where policy warrants it. Keep routers thin
   and leave the public contract unchanged.

See [Add a service](/services-sdk/how-to/add-a-service/) for CLI commands and
[Services & contracts](/services-sdk/services/) for contract binding and bootstrap options.
