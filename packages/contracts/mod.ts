/**
 * Root contract vocabulary for NetScript packages and plugins.
 *
 * `@netscript/contracts` owns the common contract primitives that must stay
 * identical across package boundaries: the oRPC base contract, shared error
 * data, pagination schemas, result types, and schema helper factories.
 *
 * @example
 * ```typescript
 * import { baseContract, OffsetPaginationQuerySchema } from "@netscript/contracts";
 * import { z } from "zod";
 *
 * export const listItems = baseContract
 *   .route({ method: "GET", path: "/items" })
 *   .input(OffsetPaginationQuerySchema)
 *   .output(z.object({ items: z.array(z.unknown()) }));
 * ```
 *
 * @module
 */

export * from './src/public/mod.ts';
