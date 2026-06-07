---
package: '@netscript/prisma-adapter-mysql'
title: 'Concepts'
---

# Concepts

## Adapter Factory

`PrismaMySql` is the root factory export.

It is passed to `PrismaClient` as the `adapter` option.

## Connected Adapter

The connected adapter is created by Prisma when it opens the database connection.

Consumers normally do not call `connect()` directly.

## Capability Detection

The factory reads the server version through the driver and infers relation-join support.

Unknown versions use conservative defaults.

## Conversion

Conversion maps MySQL field metadata and values to Prisma's transport format.

Date, time, binary, decimal, JSON, and BigInt values receive explicit handling.

## Error Mapping

MySQL driver errors are converted to Prisma driver error kinds where possible.

Unknown MySQL errors preserve their code and message.
