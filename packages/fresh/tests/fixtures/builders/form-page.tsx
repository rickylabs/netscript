import { definePage } from '../../../src/application/builders/mod.ts';
import type {
  PageHandlers,
  RoutedPageDefinition,
  RuntimeFormState,
} from '../../../src/application/builders/mod.ts';
import { z } from 'zod';

const schema: z.ZodObject<{ name: z.ZodString }> = z.object({ name: z.string().min(1) });

function DemoForm(_props: RuntimeFormState<z.input<typeof schema>>) {
  return <form />;
}

type FormPageState = { requestId: string };
type FormPageDefinition = RoutedPageDefinition<
  FormPageState,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  { form: RuntimeFormState<z.input<typeof schema>> }
>;

const page: FormPageDefinition = definePage<FormPageState>()
  .withForm('form', DemoForm, {
    schema,
    csrf: false,
    initial: () => ({ name: 'Ada' }),
    mutate: (input) => ({ greeting: `Hello ${input.name}` }),
  })
  .withLayout((slots) => <main>{slots.form()}</main>)
  .build({ routePattern: '/playground/builders/form-page' });

export const handler: PageHandlers<FormPageState> | undefined = page.handler;
const defaultPage: FormPageDefinition['default'] = page.default;
export default defaultPage;
