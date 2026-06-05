/**
 * @module
 *
 * Shared NetScript contracts, validation helpers, and diagnostics.
 *
 * `@netscript/shared` is the foundation package for framework-neutral primitives that several
 * NetScript packages consume. It intentionally keeps the published surface small: common contract
 * schemas, the oRPC base contract primitive, validation helper factories, typed error helpers, and a
 * JSON-stable inspector.
 *
 * @example Basic contract composition
 * ```ts
 * import { baseContract, OffsetPaginationQuerySchema } from "@netscript/shared";
 * import { z } from "zod";
 *
 * export const listItems = baseContract
 *   .route({ method: "GET", path: "/items" })
 *   .input(OffsetPaginationQuerySchema)
 *   .output(z.object({ items: z.array(z.unknown()) }));
 * ```
 *
 * @example Inspect shared values
 * ```ts
 * import { inspectShared, positiveInt } from "@netscript/shared";
 *
 * const report = inspectShared(positiveInt({ description: "Resource ID" }));
 * console.log(report.status);
 * ```
 */

export * from './src/public/mod.ts';
