/**
 * Golden NetScript reference for `t1-storefront-api` — the typed HTTP contract
 * and its handlers.
 *
 * Design notes (positioning-relevant; see reference/README.md):
 *   - Procedures are built on `os.errors(...)` from `@orpc/server` — the exact
 *     primitive `@netscript/contracts` uses internally for its `baseContract`.
 *     The public `baseContract` export is intentionally type-erased (its
 *     procedures expose only an opaque `~orpc` marker), so binding a sound
 *     `.handler()` to it is not possible without a cast. The reference declares
 *     a minimal local error map whose codes/statuses are identical to the
 *     framework's shared map (`NOT_FOUND` 404, `VALIDATION_ERROR` 422) and
 *     raises through the shared `notFound()` / `validationFailed()` factories,
 *     so the wire-level error vocabulary is the framework's, not ad-hoc strings.
 *   - Contract inputs are permissive; business rules are validated *inside* the
 *     handler and surfaced as a typed `VALIDATION_ERROR`. A strict contract
 *     input schema would make oRPC reject invalid bodies with `BAD_REQUEST`
 *     (400) *before* the handler runs, which is the wrong typed code for this
 *     contract. Validation uses zod `safeParse`, so the success branch is
 *     type-narrowed with no cast.
 *
 * @module
 */

import { os } from '@orpc/server';
import { z } from 'zod';
import { notFound, validationFailed } from '@netscript/contracts';
import {
  deleteProduct,
  getOrder,
  getProduct,
  listProducts,
  putOrder,
  putProduct,
} from './store.ts';

/** Wire shape of a persisted product. */
const productShape = z.object({
  id: z.string(),
  name: z.string(),
  priceCents: z.number(),
  sku: z.string(),
});

/** Wire shape of a persisted order. */
const orderShape = z.object({
  id: z.string(),
  productId: z.string(),
  quantity: z.number(),
});

/** A persisted product. */
export type Product = z.infer<typeof productShape>;
/** A persisted order. */
export type Order = z.infer<typeof orderShape>;

/** Field rules for creating a product (name/sku non-empty, priceCents >= 0). */
const productDraft = z.object({
  name: z.string().trim().min(1),
  priceCents: z.number().int().nonnegative(),
  sku: z.string().trim().min(1),
});

/** Field rules for a partial product update. */
const productPatch = z.object({
  name: z.string().trim().min(1).optional(),
  priceCents: z.number().int().nonnegative().optional(),
});

/** Field rules for creating an order (quantity a positive integer). */
const orderDraft = z.object({
  productId: z.string().trim().min(1),
  quantity: z.number().int().positive(),
});

/** Permissive contract inputs: shape only, so business rules run in-handler. */
const createProductInput = z.object({
  name: z.string().optional(),
  priceCents: z.number().optional(),
  sku: z.string().optional(),
});
const updateProductInput = z.object({
  id: z.string(),
  name: z.string().optional(),
  priceCents: z.number().optional(),
});
const createOrderInput = z.object({
  productId: z.string().optional(),
  quantity: z.number().optional(),
});
const idInput = z.object({ id: z.string() });

/** Flatten zod issues into the shared `fieldErrors` shape. */
function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.') || '_root';
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

/**
 * oRPC builder carrying the framework's shared error codes. `notFound()` and
 * `validationFailed()` consume the `errors` object these constructors expose.
 */
const base = os.errors({
  NOT_FOUND: { status: 404, message: 'Resource not found' },
  VALIDATION_ERROR: { status: 422, message: 'Validation failed' },
});

const createProduct = base
  .route({ method: 'POST', path: '/products', successStatus: 201 })
  .input(createProductInput)
  .output(productShape)
  .handler(async ({ input, errors }) => {
    const parsed = productDraft.safeParse(input);
    if (!parsed.success) {
      validationFailed({
        errors,
        message: 'Invalid product',
        fieldErrors: toFieldErrors(parsed.error),
      });
    }
    const product: Product = { id: crypto.randomUUID(), ...parsed.data };
    await putProduct(product);
    return product;
  });

const getProductById = base
  .route({ method: 'GET', path: '/products/{id}' })
  .input(idInput)
  .output(productShape)
  .handler(async ({ input, errors }) => {
    const product = await getProduct(input.id);
    if (product === null) {
      notFound({ errors, path: ['products'], resourceId: input.id });
    }
    return product;
  });

const listAllProducts = base
  .route({ method: 'GET', path: '/products' })
  .output(z.object({ items: z.array(productShape) }))
  .handler(async () => ({ items: await listProducts() }));

const updateProduct = base
  .route({ method: 'PATCH', path: '/products/{id}' })
  .input(updateProductInput)
  .output(productShape)
  .handler(async ({ input, errors }) => {
    const existing = await getProduct(input.id);
    if (existing === null) {
      notFound({ errors, path: ['products'], resourceId: input.id });
    }
    const patch = productPatch.safeParse({ name: input.name, priceCents: input.priceCents });
    if (!patch.success) {
      validationFailed({
        errors,
        message: 'Invalid product update',
        fieldErrors: toFieldErrors(patch.error),
      });
    }
    const updated: Product = {
      ...existing,
      ...(patch.data.name !== undefined ? { name: patch.data.name } : {}),
      ...(patch.data.priceCents !== undefined ? { priceCents: patch.data.priceCents } : {}),
    };
    await putProduct(updated);
    return updated;
  });

const deleteProductProc = base
  .route({ method: 'DELETE', path: '/products/{id}' })
  .input(idInput)
  .output(z.object({ id: z.string(), deleted: z.boolean() }))
  .handler(async ({ input, errors }) => {
    const existing = await getProduct(input.id);
    if (existing === null) {
      notFound({ errors, path: ['products'], resourceId: input.id });
    }
    await deleteProduct(input.id);
    return { id: input.id, deleted: true };
  });

const createOrder = base
  .route({ method: 'POST', path: '/orders', successStatus: 201 })
  .input(createOrderInput)
  .output(orderShape)
  .handler(async ({ input, errors }) => {
    const parsed = orderDraft.safeParse(input);
    if (!parsed.success) {
      validationFailed({
        errors,
        message: 'Invalid order',
        fieldErrors: toFieldErrors(parsed.error),
      });
    }
    const product = await getProduct(parsed.data.productId);
    if (product === null) {
      validationFailed({
        errors,
        message: `Unknown product '${parsed.data.productId}'`,
        fieldErrors: { productId: ['referenced product does not exist'] },
      });
    }
    const order: Order = {
      id: crypto.randomUUID(),
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
    };
    await putOrder(order);
    return order;
  });

const getOrderById = base
  .route({ method: 'GET', path: '/orders/{id}' })
  .input(idInput)
  .output(orderShape)
  .handler(async ({ input, errors }) => {
    const order = await getOrder(input.id);
    if (order === null) {
      notFound({ errors, path: ['orders'], resourceId: input.id });
    }
    return order;
  });

/** The storefront oRPC router mounted by {@link file://./main.ts}. */
export const router = {
  products: {
    create: createProduct,
    getById: getProductById,
    list: listAllProducts,
    update: updateProduct,
    delete: deleteProductProc,
  },
  orders: {
    create: createOrder,
    getById: getOrderById,
  },
};
