---
layout: layouts/base.vto
title: NetScript vs Next.js, Nuxt, SvelteKit, and TanStack Start
description: Compare one streamed detail page in NetScript with four leading frontend frameworks.
templateEngine: [vento, md]
order: 2
---

# NetScript vs frontend frameworks

## NetScript makes the whole page legible at its entry point

The route, shared read, two streamed regions, skeletons, layout, refresh decision, and metadata are
one typed chain. Pick a competitor; the NetScript side stays put because the argument does too.

{{ comp.comparisonTabs({
  ours: {
    lang: "tsx",
    code: "import { definePage } from '@netscript/fresh/builders';\nimport { appRoutes } from '../../.netscript/routes.ts';\nimport { ProductLayout } from '../../components/ProductLayout.tsx';\nimport { Overview, OverviewSkeleton } from '../../components/Overview.tsx';\nimport { Stock, StockSkeleton } from '../../components/Stock.tsx';\n\nconst page = definePage()\n  .withRoute(appRoutes.products.$product.$route)\n  .withStreaming()\n  .withResource('product', (ctx) => {\n    const product = productCache.require(ctx.path.product);\n    void productCache.revalidate(ctx.path.product);\n    return product;\n  })\n  .withLayer('overview', Overview, {\n    loader: async (ctx) => ({\n      product: await ctx.resource('product'),\n      reviews: await loadReviews(ctx.path.product),\n    }),\n    fallback: <OverviewSkeleton />,\n    delivery: 'stream',\n  })\n  .withLayer('stock', Stock, {\n    loader: async (ctx) => ({\n      product: await ctx.resource('product'),\n      stock: await loadStock(ctx.path.product),\n    }),\n    fallback: <StockSkeleton />,\n    delivery: 'stream',\n  })\n  .withLayout((slots) => (\n    <ProductLayout overview={slots.overview()} stock={slots.stock()} />\n  ))\n  .withMeta(async (ctx) => {\n    const product = await ctx.resource('product');\n    return { title: product.name, description: product.summary };\n  })\n  .build();\n\nexport default page.default;"
  },
  competitors: [
    {
      key: "nextjs",
      label: "Next.js",
      summary: "React Server Components stream well, but the page contract is distributed across the page, parallel-route slots, loading and error files, metadata, and cache declarations.",
      lang: "tsx",
      code: "// app/products/[product]/data.ts\nimport { cache } from 'react';\nexport const getProduct = cache((id: string) =>\n  fetch(`${API}/products/${id}`, { next: { revalidate: 30 } }).then(r => r.json())\n);\n\n// app/products/[product]/page.tsx\nexport const generateMetadata = async ({ params }: PageProps<'/products/[product]'>) => {\n  const { product } = await params;\n  const item = await getProduct(product);\n  return { title: item.name, description: item.summary };\n};\nconst Page = ({ overview, stock }: {\n  overview: React.ReactNode; stock: React.ReactNode;\n}) => <ProductLayout overview={overview} stock={stock} />;\nexport default Page;\n\n// app/products/[product]/@overview/page.tsx\nconst OverviewSlot = async ({ params }: PageProps<'/products/[product]'>) => {\n  const { product } = await params;\n  return <Overview product={await getProduct(product)} reviews={await loadReviews(product)} />;\n};\nexport default OverviewSlot;\n\n// app/products/[product]/@stock/page.tsx\nconst StockSlot = async ({ params }: PageProps<'/products/[product]'>) => {\n  const { product } = await params;\n  return <Stock product={await getProduct(product)} stock={await loadStock(product)} />;\n};\nexport default StockSlot;\n\n// @overview/loading.tsx and @stock/loading.tsx export the skeletons.\n// Each slot adds error.tsx when its failure must stay local."
    },
    {
      key: "nuxt",
      label: "Nuxt",
      summary: "Nuxt keeps this compact in one Vue page and shares keyed async data cleanly; its lazy regions become client loading states, so the refresh and region policy stay imperative.",
      lang: "text",
      code: "<!-- app/pages/products/[product].vue -->\n<script setup lang='ts'>\nconst route = useRoute();\nconst key = `product:${route.params.product}`;\nconst { data: product, refresh } = await useAsyncData(\n  key,\n  () => $fetch(`/api/products/${route.params.product}`),\n);\nconst { data: reviews, status: reviewsStatus } = useLazyAsyncData(\n  `${key}:reviews`,\n  () => $fetch(`/api/products/${route.params.product}/reviews`),\n);\nconst { data: stock, status: stockStatus } = useLazyAsyncData(\n  `${key}:stock`,\n  () => $fetch(`/api/products/${route.params.product}/stock`),\n);\nuseSeoMeta({\n  title: () => product.value?.name,\n  description: () => product.value?.summary,\n});\nlet timer: ReturnType<typeof setInterval>;\nonMounted(() => { timer = setInterval(refresh, 30_000); });\nonUnmounted(() => clearInterval(timer));\n</script>\n\n<template>\n  <ProductLayout>\n    <OverviewSkeleton v-if='reviewsStatus === `pending`' />\n    <Overview v-else :product :reviews />\n    <StockSkeleton v-if='stockStatus === `pending`' />\n    <Stock v-else :product :stock />\n  </ProductLayout>\n</template>"
    },
    {
      key: "sveltekit",
      label: "SvelteKit",
      summary: "SvelteKit streams unresolved server-load promises with very little ceremony; the boundary is split between the server load and the page component, and client invalidation owns refresh.",
      lang: "text",
      code: "// routes/products/[product]/+page.server.ts\nexport const load = async ({ params, depends }) => {\n  depends(`product:${params.product}`);\n  const product = await getProduct(params.product);\n  return {\n    product,\n    reviews: loadReviews(params.product),\n    stock: loadStock(params.product),\n  };\n};\n\n<!-- routes/products/[product]/+page.svelte -->\n<script lang='ts'>\n  import { invalidate } from '$app/navigation';\n  import { onMount } from 'svelte';\n  let { data } = $props();\n  onMount(() => {\n    const timer = setInterval(() => invalidate(`product:${data.product.id}`), 30_000);\n    return () => clearInterval(timer);\n  });\n</script>\n\n<svelte:head><title>{data.product.name}</title></svelte:head>\n<ProductLayout>\n  {#await data.reviews}<OverviewSkeleton />{:then reviews}<Overview product={data.product} {reviews} />{/await}\n  {#await data.stock}<StockSkeleton />{:then stock}<Stock product={data.product} {stock} />{/await}\n</ProductLayout>"
    },
    {
      key: "tanstack",
      label: "TanStack Start",
      summary: "TanStack Start gives streamed promises and typed route data a strong home; caching, head metadata, Suspense resolution, and error boundaries remain separate concepts you assemble.",
      lang: "tsx",
      code: "import { Await, createFileRoute } from '@tanstack/react-router';\nimport { queryOptions } from '@tanstack/react-query';\n\nconst productOptions = (id: string) => queryOptions({\n  queryKey: ['product', id],\n  queryFn: () => getProduct(id),\n  staleTime: 30_000,\n});\n\nexport const Route = createFileRoute('/products/$product')({\n  loader: async ({ params, context }) => {\n    const product = await context.queryClient.ensureQueryData(\n      productOptions(params.product),\n    );\n    return {\n      product,\n      reviews: loadReviews(params.product),\n      stock: loadStock(params.product),\n    };\n  },\n  head: ({ loaderData }) => ({\n    meta: [{ title: loaderData?.product.name }],\n  }),\n  component: ProductPage,\n});\n\nconst ProductPage = () => {\n  const { product, reviews, stock } = Route.useLoaderData();\n  return <ProductLayout>\n    <Await promise={reviews} fallback={<OverviewSkeleton />}>\n      {(value) => <Overview product={product} reviews={value} />}\n    </Await>\n    <Await promise={stock} fallback={<StockSkeleton />}>\n      {(value) => <Stock product={product} stock={value} />}\n    </Await>\n  </ProductLayout>;\n};"
    }
  ]
}) }}

## NetScript can say who owns the I/O in one line

When a region has no authoritative cache timestamp, make its typed partial own the read and keep the
page out of its critical path:

```tsx
.withLayer("livePrice", LivePrice, {
  loader: () => undefined,
  partial: (ctx) => appRoutes.productPricePartial.href({ path: ctx.path }),
  partialName: "product-price",
  fallback: <PriceSkeleton />,
  staleTime: 30_000,
  staleReloadMode: "background",
})
```

## NetScript exposes more of the architecture where you enter the route

These are architectural estimates for this generic product page, not benchmark results.

| Architectural estimate | NetScript composition | Convention-split equivalent |
| --- | ---: | ---: |
| Route-specific orchestration | ~175 LOC | ~190–225 LOC |
| Files needed to see page behaviour | 1 | ~5–8 |
| Architectural surface visible at entry | ~87–93% | ~40–53% |

{{ comp.nextPrev({ prev: { label: "Comparisons", href: "/comparisons/" }, next: { label: "Backend frameworks", href: "/comparisons/backend/" } }) }}
