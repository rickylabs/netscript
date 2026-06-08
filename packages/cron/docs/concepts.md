---
title: Cron Concepts
description: Glossary for @netscript/cron.
package: '@netscript/cron'
order: 2
---

# Cron Concepts

## CronScheduler

The runtime-agnostic port for scheduling, listing, enabling, disabling, triggering, and stopping
jobs.

## CronProvider

The provider identifier used by `createScheduler` to choose a scheduler implementation.

## MemoryCronAdapter

The in-memory scheduler used for tests and local workflows where native scheduler infrastructure is
not available.

## SchedulerEvent

The event names emitted by scheduler adapters for job execution and lifecycle changes.
