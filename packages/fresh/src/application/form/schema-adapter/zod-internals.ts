import { z } from 'zod';

export function isRequired(schema: z.ZodTypeAny): boolean {
  if (schema instanceof z.ZodDefault || schema instanceof z.ZodPrefault) {
    return false;
  }

  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return false;
  }

  if (
    schema instanceof z.ZodCatch || schema instanceof z.ZodReadonly ||
    schema instanceof z.ZodNonOptional || schema instanceof z.ZodPipe
  ) {
    return isRequired(innerTypeOf(schema));
  }

  return true;
}

export function unwrapSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current = schema;

  while (true) {
    if (
      current instanceof z.ZodCatch || current instanceof z.ZodReadonly ||
      current instanceof z.ZodNonOptional || current instanceof z.ZodPipe ||
      current instanceof z.ZodDefault ||
      current instanceof z.ZodPrefault
    ) {
      current = innerTypeOf(current);
      continue;
    }

    if (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
      current = unwrapOptionalLike(current);
      continue;
    }

    return current;
  }
}

export function innerTypeOf(schema: z.ZodTypeAny): z.ZodTypeAny {
  if (schema instanceof z.ZodPipe) {
    const input = schema._zod.def.in;
    return input instanceof z.ZodType ? input : schema;
  }

  if (
    schema instanceof z.ZodCatch || schema instanceof z.ZodReadonly ||
    schema instanceof z.ZodNonOptional || schema instanceof z.ZodDefault ||
    schema instanceof z.ZodPrefault
  ) {
    const inner = schema.unwrap();
    return inner instanceof z.ZodType ? inner : schema;
  }

  return schema;
}

export function readTupleItems(schema: z.ZodTuple): readonly z.ZodTypeAny[] {
  return schema._zod.def.items.filter((item): item is z.ZodTypeAny => item instanceof z.ZodType);
}

export function unwrapOptionalLike(schema: z.ZodOptional | z.ZodNullable): z.ZodTypeAny {
  const inner = schema.unwrap();
  return inner instanceof z.ZodType ? inner : schema;
}
