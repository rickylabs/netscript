/**
 * Transform utilities for mapping between data shapes.
 *
 * @example
 * ```typescript
 * import { createTransformer } from '@netscript/contracts';
 *
 * const userTransformer = createTransformer((dbUser) => ({
 *   id: dbUser.id,
 *   name: dbUser.name,
 *   email: dbUser.email,
 *   // Exclude sensitive fields like password
 * }));
 *
 * const user = userTransformer.one(dbUser);
 * const users = userTransformer.many(dbUsers);
 * const maybeUser = userTransformer.optional(dbUser); // null-safe
 * ```
 *
 * @module
 */

// ============================================================================
// TRANSFORM TYPES
// ============================================================================

/**
 * Transform function type.
 */
export type TransformFn<TInput, TOutput> = (input: TInput) => TOutput;

/**
 * Transformer interface with helper methods.
 */
export interface Transformer<TInput, TOutput> {
  /** Transform a single item */
  one: (input: TInput) => TOutput;
  /** Transform an array of items */
  many: (inputs: TInput[]) => TOutput[];
  /** Transform a potentially null/undefined item */
  optional: (input: TInput | null | undefined) => TOutput | null;
}

/** Curried factory returned by pick-transformer creation. */
export type PickTransformerFactory<T extends Record<string, unknown>> = <
  K extends keyof T,
>(
  ...keys: K[]
) => Transformer<T, Pick<T, K>>;

/** Curried factory returned by omit-transformer creation. */
export type OmitTransformerFactory<T extends Record<string, unknown>> = <
  K extends keyof T,
>(
  ...keys: K[]
) => Transformer<T, Omit<T, K>>;

// ============================================================================
// TRANSFORMER FACTORY
// ============================================================================

/**
 * Creates a transformer with helper methods for common use cases.
 *
 * @example
 * ```typescript
 * // Define transform once
 * const userTransformer = createTransformer((dbUser: DbUser) => ({
 *   id: dbUser.id,
 *   displayName: `${dbUser.firstName} ${dbUser.lastName}`,
 *   email: dbUser.email,
 *   createdAt: dbUser.createdAt.toISOString(),
 * }));
 *
 * // Use in handlers
 * const user = userTransformer.one(dbUser);
 * const users = userTransformer.many(dbUsers);
 * const maybeUser = userTransformer.optional(await db.user.findUnique(...));
 * ```
 */
export function createTransformer<TInput, TOutput>(
  transform: TransformFn<TInput, TOutput>,
): Transformer<TInput, TOutput> {
  return {
    one: (input: TInput): TOutput => transform(input),
    many: (inputs: TInput[]): TOutput[] => inputs.map(transform),
    optional: (input: TInput | null | undefined): TOutput | null =>
      input != null ? transform(input) : null,
  };
}

// ============================================================================
// UTILITY TRANSFORMS
// ============================================================================

/**
 * Creates a pick transformer that only includes specified fields.
 *
 * @example
 * ```typescript
 * const publicUserTransformer = createPickTransformer<User>()('id', 'name', 'email');
 * const publicUser = publicUserTransformer.one(user);
 * // { id: 1, name: 'John', email: 'john@example.com' }
 * ```
 */
export function createPickTransformer<T extends Record<string, unknown>>(): PickTransformerFactory<
  T
> {
  return <K extends keyof T>(...keys: K[]): Transformer<T, Pick<T, K>> => {
    return createTransformer((input: T) => {
      const result = {} as Pick<T, K>;
      for (const key of keys) {
        result[key] = input[key];
      }
      return result;
    });
  };
}

/**
 * Creates an omit transformer that excludes specified fields.
 *
 * @example
 * ```typescript
 * const safeUserTransformer = createOmitTransformer<User>()('password', 'secretKey');
 * const safeUser = safeUserTransformer.one(user);
 * // { id: 1, name: 'John', email: 'john@example.com' } (no password/secretKey)
 * ```
 */
export function createOmitTransformer<T extends Record<string, unknown>>(): OmitTransformerFactory<
  T
> {
  return <K extends keyof T>(...keys: K[]): Transformer<T, Omit<T, K>> => {
    const keysSet = new Set(keys);
    return createTransformer((input: T) => {
      const result = {} as Omit<T, K>;
      for (const key of Object.keys(input) as (keyof T)[]) {
        if (!keysSet.has(key as K)) {
          // deno-lint-ignore no-explicit-any
          (result as any)[key] = input[key];
        }
      }
      return result;
    });
  };
}

/**
 * Composes multiple transformers into one.
 *
 * @example
 * ```typescript
 * const transformer = composeTransformers(
 *   (user: DbUser) => ({ ...user, fullName: `${user.firstName} ${user.lastName}` }),
 *   (user) => ({ ...user, createdAt: user.createdAt.toISOString() }),
 * );
 * ```
 */
export function composeTransformers<A, B, C>(
  t1: TransformFn<A, B>,
  t2: TransformFn<B, C>,
): Transformer<A, C>;
/** Compose three transform functions into one transformer. */
export function composeTransformers<A, B, C, D>(
  t1: TransformFn<A, B>,
  t2: TransformFn<B, C>,
  t3: TransformFn<C, D>,
): Transformer<A, D>;
/** Compose four transform functions into one transformer. */
export function composeTransformers<A, B, C, D, E>(
  t1: TransformFn<A, B>,
  t2: TransformFn<B, C>,
  t3: TransformFn<C, D>,
  t4: TransformFn<D, E>,
): Transformer<A, E>;
// deno-lint-ignore no-explicit-any
export function composeTransformers(...transforms: TransformFn<any, any>[]): Transformer<any, any> {
  return createTransformer((input) =>
    // deno-lint-ignore no-explicit-any
    transforms.reduce((acc, transform) => transform(acc), input as any)
  );
}
