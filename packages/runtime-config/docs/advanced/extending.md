---
title: Extending Runtime Config
description: Extension axes for adding runtime override topics and fields.
package: '@netscript/runtime-config'
order: 30
---

# Extending

Runtime config extension should start with a named domain concept.

## Add A Field

Add optional fields to the relevant domain interface when the topic already exists. Keep the field
plain data and let the consumer package own behavior.

## Add A Topic

Adding a topic requires:

1. Add the domain type in `src/domain/types.ts`.
2. Add the pointer field and loader read in `src/application/loader.ts`.
3. Add accessors only when callers need named lookup behavior.
4. Add README, docs, and tests for the new topic.

Do not add ports or adapters until a second runtime config backend exists.
