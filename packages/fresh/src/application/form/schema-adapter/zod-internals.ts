import { z } from 'zod';

type ZodDefWithInner = {
  readonly innerType?: z.ZodTypeAny;
  readonly schema?: z.ZodTypeAny;
  readonly in?: z.ZodTypeAny;
  readonly out?: z.ZodTypeAny;
  readonly items?: readonly z.ZodTypeAny[];
};

export function isRequired(schema: z.ZodTypeAny): boolean {
  if (schema instanceof z.ZodDefault || schema instanceof z.ZodPrefault) {
    return false;
  }

  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return false;
  }

  if (
    schema instanceof z.ZodCatch || schema instanceof z.ZodReadonly ||
    schema instanceof z.ZodNonOptional || schema instanceof z.ZodPipe ||
    schema instanceof z.ZodTransform
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
      current instanceof z.ZodTransform || current instanceof z.ZodDefault ||
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
  const def = schema._def as ZodDefWithInner;

  return def.schema ?? def.innerType ?? def.in ?? def.out ?? schema;
}

export function readTupleItems(schema: z.ZodTuple): readonly z.ZodTypeAny[] {
  const def = schema._def as unknown as ZodDefWithInner;
  return Array.isArray(def.items) ? def.items : [];
}

export function unwrapOptionalLike(schema: z.ZodOptional | z.ZodNullable): z.ZodTypeAny {
  const def = schema._def as unknown as ZodDefWithInner;
  return def.innerType ?? schema;
}
