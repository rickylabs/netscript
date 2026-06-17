---
title: SQL JSON Fields
description: Configure the SQL JSON extension for fields stored as text.
package: '@netscript/database'
order: 2
---

# SQL JSON Fields

## Goal

Serialize object fields when the selected SQL backend stores JSON as text.

```ts
import { sqlJsonExtension } from 'jsr:@netscript/database@^0.0.1-alpha.0/extensions';

const extension = sqlJsonExtension(Prisma, {
  databaseType: 'mssql',
  jsonFields: {
    SagaInstance: ['state'],
  },
});
```

## Pitfalls

Keep the field registry close to the Prisma schema owner. This package provides the mechanism, not
the user schema.
