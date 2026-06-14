import { definePage } from '../../../builders/mod.ts';
import type { RuntimeFormState } from '../../../form/mod.ts';
import { z } from 'zod';

const schema = z.object({ name: z.string().min(1) });

function DemoForm(_props: RuntimeFormState<z.input<typeof schema>>) {
  return <form />;
}

const page = definePage<{ requestId: string }>()
  .withForm('form', DemoForm, {
    schema,
    csrf: false,
    initial: () => ({ name: 'Ada' }),
    mutate: (input) => ({ greeting: `Hello ${input.name}` }),
  })
  .withLayout((slots) => <main>{slots.form()}</main>)
  .build({ routePattern: '/playground/builders/form-page' });

export const handler = page.handler;
export default page.default;
