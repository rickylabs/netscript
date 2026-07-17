# oRPC + Fresh live-doc extracts (fetched 2026-07-18)

These extracts preserve the load-bearing parts of the live documentation used by
`research/orpc-fresh.md`. URLs are the citation authority; wording below is a concise extract,
not a verbatim archive.

## oRPC H3 adapter

Source: https://orpc.dev/docs/adapters/h3

- The page currently carries an “oRPC v2 public beta” banner.
- The H3 example imports `H3`/`serve` from `h3` and `RPCHandler` from
  `@orpc/server/fetch`.
- It installs an H3 route at `/rpc/**`, passes `event.req` to
  `handler.handle(..., { prefix: "/rpc", context: {} })`, and returns the adapter response when
  the handler reports a match.

## oRPC Fetch/HTTP adapter

Source: https://orpc.dev/docs/adapters/http

- The Fetch adapter targets Fetch-API runtimes including browsers, Bun, Deno, and Cloudflare
  Workers.
- `RPCHandler` accepts a Web `Request` through `handler.handle(request, options)` and yields a
  response/match result; the Deno example passes that bridge directly to `Deno.serve`.

## Fresh App

Source: https://usefresh.dev/docs/concepts/app

- Fresh applies middleware and routes in registration order, from top to bottom.
- `mountApp()` composes one Fresh application into another.
- `app.handler()` converts the application into a Web `Request` → `Response` handler; the docs
  explicitly identify embedding Fresh in another framework as a use case.
- `app.listen()` starts `Deno.serve`; the docs warn not to use it together with the default
  Vite/`deno serve` startup because that would start a second listener.
