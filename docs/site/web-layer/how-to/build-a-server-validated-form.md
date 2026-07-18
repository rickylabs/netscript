---
layout: layouts/base.vto
title: Build a server-validated form
templateEngine: [vento, md]
order: 103
oldUrl: /how-to/build-a-server-validated-form/
---

# Build a server-validated form

Use `definePage().withForm()` when a Fresh page needs route-bound form state, server validation,
mutation, and redirect or same-page success handling in one typed page definition.

## Prerequisites

- A Fresh route that can render a NetScript page definition.
- A schema object accepted by the form runtime.
- A server mutation that receives validated input.
- A component that receives `RuntimeFormState` props.

## Define the form

`withForm(id, component, config)` registers a typed layer and a method handler. The config surface
includes `schema`, `initial`, `mutate`, `onIntent`, `redirectTo`, `onSuccess`, `invalidate`, `csrf`,
`method`, and `spanName`.

```tsx
import { definePage } from '@netscript/fresh';
import { z } from 'zod';

const ContactSchema = z.object({
  email: z.string().email(),
  message: z.string().min(10),
});

function ContactForm(props: {
  values: Record<string, unknown>;
  errors?: Record<string, readonly string[]>;
  message?: string;
}) {
  return (
    <form method="post">
      <input name="email" value={String(props.values.email ?? '')} />
      <textarea name="message">{String(props.values.message ?? '')}</textarea>
      <button type="submit">Send</button>
    </form>
  );
}

export const contactPage = definePage()
  .withForm('contact', ContactForm, {
    schema: ContactSchema,
    method: 'POST',
    csrf: true,
    initial: () => ({ email: '', message: '' }),
    mutate: async (input) => {
      const ticket = await createSupportTicket(input);
      return { ticketId: ticket.id };
    },
    redirectTo: (output) => `/support/thanks?id=${output.ticketId}`,
    spanName: 'form.contact',
  })
  .build('/contact');
```

## Render validation errors

Validation failures stay on the form layer. Keep field rendering defensive: read `values`, show
field errors when present, and avoid assuming the mutation ran.

```tsx
function FieldError(props: { errors?: readonly string[] }) {
  if (!props.errors?.length) return null;
  return <p class="field-error">{props.errors[0]}</p>;
}
```

## Test the page definition

Keep one unit test around the builder chain so method, schema, and layer IDs stay wired.

```ts
import { assertEquals } from '@std/assert';
import { contactPage } from './contact.page.tsx';

Deno.test('contact page registers the route pattern', () => {
  assertEquals(contactPage.routePattern, '/contact');
});
```

## Failure modes

- Missing `schema`: the form has no server validation boundary.
- `mutate` throws: the form runtime returns an error state instead of running `redirectTo`.
- `redirectTo` and `onSuccess` both exist: `redirectTo` takes precedence.
- CSRF is enabled by default; disable it only for a route that has another verified protection.

## Next steps

- Use the page-builder model from [Fresh meta-framework](/capabilities/fresh-framework/).
- Connect the page to typed data with [Live Dashboard, chapter 04](/tutorials/live-dashboard/04-definePage-QueryIsland/).
- Look up the builder surface in [fresh reference](/reference/fresh/).

{{ comp.nextPrev({
  prev: { label: "Add a task runtime adapter", href: "/how-to/add-a-task-runtime-adapter/" },
  next: { label: "Build a validated ingestion queue", href: "/how-to/build-a-validated-ingestion-queue/" }
}) }}
