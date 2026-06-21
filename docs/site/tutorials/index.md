---
layout: layouts/base.vto
title: Tutorials
templateEngine: [vento, md]
prev: null
next:
  label: "1 · Your first workspace"
  href: "/tutorials/first-workspace/"
---

Tutorials are for **learning by building**. Start here if NetScript is new to
you: every lesson hands you a small, working result and leaves the workspace
ready for the next one. You don't need to understand the whole framework before
you begin — each rung introduces exactly one new capability and proves it with a
real command or endpoint.

Unlike the [how-to guides](/how-to/), which assume you already know the shape of
the task, tutorials follow a fixed path and never skip a step. By the time you
reach the last rung you'll have a single application that scaffolds cleanly,
serves a typed service, runs background jobs, coordinates a durable workflow, and
ingests an external webhook — the spine of a real NetScript backend.

{{ comp callout { type: "tip", title: "How the four lanes fit together" } }}
Tutorials teach you the path. When you already know the path and just need the
recipe, use the <a href="/how-to/">how-to guides</a>. For exact symbols and
signatures, go to the <a href="/reference/">reference</a>. For the design
reasoning behind durability, contracts, and plugins, read the
<a href="/explanation/">explanation</a> pages.
{{ /comp }}

## One application, five rungs

These five lessons build **one continuous application** — a user-onboarding
backend. Start at the top and work down: each rung assumes the workspace, code,
and running services from the one before it, so the value compounds instead of
resetting between lessons.

{{ comp.learningPath({ steps: [
  { label: "1 · Your first workspace", href: "/tutorials/first-workspace/" },
  { label: "2 · Build a service", href: "/tutorials/build-a-service/" },
  { label: "3 · Add background jobs", href: "/tutorials/background-jobs/" },
  { label: "4 · A durable workflow", href: "/tutorials/durable-workflow/" },
  { label: "5 · Ingest a webhook", href: "/tutorials/ingest-webhook/" }
] }) }}

## What each rung adds

Each lesson is short, ends with a verification step, and adds exactly one new
capability to the same app. Follow them in order.

{{ comp.featureGrid({ items: [
  {
    title: "1 · Your first workspace",
    body: "Scaffold a NetScript workspace, tour every generated directory, bring up Postgres and Garnet with <code>cd aspire &amp;&amp; aspire run</code>, and type-check the project from zero. Ends at the Aspire dashboard on :18888.",
    href: "/tutorials/first-workspace/"
  },
  {
    title: "2 · Build a service",
    body: "Add a typed <code>list</code> procedure to the <code>users</code> service through the contract &rarr; <code>implement()</code> &rarr; router flow, then call it over <code>/api/rpc/*</code> with a fully typed client.",
    href: "/tutorials/build-a-service/"
  },
  {
    title: "3 · Add background jobs",
    body: "Add the workers plugin and author a <code>create-user-settings</code> job that runs off the request path and publishes a <code>UserSettingsCreated</code> event. Dispatch and watch it on :8091.",
    href: "/tutorials/background-jobs/"
  },
  {
    title: "4 · A durable workflow",
    body: "Handle that event in a saga with state, correlation, and compensation, then emit <code>sagaComplete</code>. Your onboarding flow survives restarts and partial failures.",
    href: "/tutorials/durable-workflow/"
  },
  {
    title: "5 · Ingest a webhook",
    body: "Accept an external event on a raw Hono trigger route and <code>enqueueJob</code> a worker job to close the loop — wiring the outside world back into the durable core.",
    href: "/tutorials/ingest-webhook/"
  }
] }) }}

## Before you start

The tutorials assume a working local toolchain. If you have never run NetScript
on this machine, the [quickstart](/quickstart/) installs the CLI and gets a
project up in a few commands; the first rung then re-grounds you from the
scaffold so you can start either place.

{{ comp callout { type: "note", title: "What you'll need" } }}
A recent <a href="https://deno.com/">Deno</a> and the
<a href="https://learn.microsoft.com/dotnet/aspire/">.NET Aspire</a> CLI on your
PATH. Install the NetScript CLI with
<code>deno install --global --allow-all --name netscript jsr:@netscript/cli/bin/netscript.ts</code>.
Each rung lists its own prerequisite state so you always know which earlier
lessons it builds on.
{{ /comp }}

## When you finish

Once you've walked the ladder, branch out into the rest of the docs:

{{ comp.featureGrid({ items: [
  {
    title: "How-to guides",
    body: "Task-focused recipes for things the tutorials don't cover — adding plugins, wiring databases, configuring queue backends, and production pitfalls.",
    href: "/how-to/"
  },
  {
    title: "Capabilities",
    body: "One hub per capability (services, workers, sagas, triggers, streams, auth) with the headline API, ports, and endpoints in one screen.",
    href: "/capabilities/"
  },
  {
    title: "Reference",
    body: "Generated, always-current API surface for every <code>@netscript/*</code> unit — exact symbols, signatures, and types.",
    href: "/reference/"
  },
  {
    title: "Explanation",
    body: "The design reasoning behind contracts-first services, durable execution, and the plugin model.",
    href: "/explanation/"
  }
] }) }}
