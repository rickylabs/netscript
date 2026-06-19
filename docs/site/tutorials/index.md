---
layout: layouts/base.vto
title: Tutorials
---

Tutorials are for learning by building. Start here if NetScript is new to you:
each lesson gives you a small, working result and leaves the workspace ready for
the next one.

If you already know the shape of the task, use the [how-to guides](/how-to/).
For exact symbols and signatures, go to the [reference](/reference/). For design
background, read the [explanation](/explanation/) pages.

## The tutorial ladder

These five lessons build **one continuous application**. Start at the top; each
lesson assumes the workspace and code from the one before it.

1. [Your first workspace](/tutorials/first-workspace/) — scaffold a NetScript
   workspace, add your first plugin, and type-check it from zero.
2. [Build a service](/tutorials/build-a-service/) — add a typed `list` procedure
   to the `users` service through the contract → `implement()` → router flow.
3. [Add background jobs](/tutorials/background-jobs/) — write a
   `create-user-settings` worker job that publishes a `UserSettingsCreated`
   event.
4. [A durable workflow](/tutorials/durable-workflow/) — handle that event in a
   saga with state, correlation, and compensation, then emit `sagaComplete`.
5. [Ingest a webhook](/tutorials/ingest-webhook/) — accept an external event on
   a Hono route and `enqueueJob` a worker job to close the loop.
