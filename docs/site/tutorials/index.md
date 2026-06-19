---
layout: layouts/base.vto
title: Tutorials
---

Tutorials are **learning-oriented**: hands-on lessons that take a newcomer from nothing to
a first working NetScript result. They are concrete and reliable — follow the steps and you
will succeed. If you instead need to accomplish a specific task you already understand, see
the [how-to guides](/how-to/); to look up an exact API, use the [reference](/reference/); to
understand the reasoning behind the design, read the [explanation](/explanation/).

## The tutorial ladder

Five lessons that build **one continuous application**. Start at the top; each rung assumes the
workspace and code from the rung before it.

1. [Your first workspace](/tutorials/first-workspace/) — scaffold a NetScript workspace, add your
   first plugin, and type-check it from zero.
2. [Build a service](/tutorials/build-a-service/) — add a typed `list` procedure to the `users`
   service through the contract → `implement()` → router flow.
3. [Add background jobs](/tutorials/background-jobs/) — write a `create-user-settings` worker job
   that publishes a `UserSettingsCreated` event.
4. [A durable workflow](/tutorials/durable-workflow/) — handle that event in a saga with state,
   correlation, and compensation, then emit `sagaComplete`.
5. [Ingest a webhook](/tutorials/ingest-webhook/) — accept an external event on a Hono route and
   `enqueueJob` a worker job to close the loop.
