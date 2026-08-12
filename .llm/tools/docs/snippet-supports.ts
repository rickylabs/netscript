import { dirname, join, toFileUrl } from '@std/path';

/** Write a generated support/module file after creating its parent directory. */
export async function writeSnippetFile(path: string, content: string): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, content);
}

/** Materialize strongly typed shared aliases used by checked Tier-1 examples. */
export async function materializeSharedSupports(
  tempRoot: string,
): Promise<Record<string, string>> {
  const supportRoot = join(tempRoot, '_support');
  const supports: Record<string, string> = {
    '@database/zod': join(supportRoot, 'database-zod.ts'),
    '@playground/contracts': join(supportRoot, 'playground-contracts.ts'),
    '@my-app/contracts': join(supportRoot, 'my-app-contracts.ts'),
    '@app/utils.ts': join(supportRoot, 'app-utils.ts'),
    '@app/lib/contacts.ts': join(supportRoot, 'contacts.ts'),
  };

  await writeSnippetFile(
    supports['@database/zod'],
    `import { z } from 'zod';
export const UserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
`,
  );
  await writeSnippetFile(
    supports['@playground/contracts'],
    `import { oc } from '@orpc/contract';
import { z } from 'zod';
export const ordersContract = {
  list: oc.route({ method: 'POST' })
    .input(z.object({ limit: z.number().int().positive().optional() }))
    .output(z.array(z.object({ id: z.string(), total: z.number() }))),
};
`,
  );
  await writeSnippetFile(
    supports['@my-app/contracts'],
    `import { oc } from '@orpc/contract';
import { implement } from '@orpc/server';
import { z } from 'zod';

export const WidgetsContractV1 = {
  list: oc.route({ method: 'POST' })
    .input(z.object({}))
    .output(z.array(z.object({ id: z.string(), name: z.string() }))),
};

const UsersContractV1 = {
  health: {
    check: oc.route({ method: 'GET' })
      .input(z.object({}).optional())
      .output(z.object({ status: z.literal('healthy'), service: z.string() })),
  },
  list: oc.route({ method: 'POST' })
    .input(z.object({ limit: z.number().int().positive().optional() }))
    .output(z.object({ items: z.array(z.object({ id: z.number(), name: z.string() })) })),
};
export const v1 = { users: implement(UsersContractV1) };
`,
  );
  await writeSnippetFile(
    supports['@app/utils.ts'],
    `export { definePage } from '@netscript/fresh/builders';
`,
  );
  await writeSnippetFile(
    supports['@app/lib/contacts.ts'],
    `export const contactsClient = {
  async create(input: { email: string; message: string }) {
    return { id: 'contact-1', ...input };
  },
  async invalidateList(): Promise<void> {},
};
`,
  );

  return Object.fromEntries(
    Object.entries(supports).map(([alias, path]) => [alias, toFileUrl(path).href]),
  );
}

/** Materialize page-relative, public-factory-derived support modules for complete examples. */
export async function materializePageSupports(pageRoot: string): Promise<void> {
  await writeSnippetFile(
    join(pageRoot, 'lib/docs.ts'),
    `import { oc } from '@orpc/contract';
import { z } from 'zod';
import { createServiceClient } from '@netscript/sdk/client';
import { createQueryFactories } from '@netscript/sdk/query';

export const DocsContract = {
  getById: oc.route({ method: 'POST' })
    .input(z.object({ id: z.string() }))
    .output(z.object({ status: z.enum(['pending', 'embedding', 'ready']) })),
};
export const docsClient = createServiceClient({ contract: DocsContract, serviceName: 'docs' });
export const docsQueries = createQueryFactories({
  docs: { contract: DocsContract, client: docsClient },
}).docs;
`,
  );
  await writeSnippetFile(
    join(pageRoot, 'apps/dashboard/lib/todos.ts'),
    `import { oc } from '@orpc/contract';
import { z } from 'zod';
import { createServiceClient } from '@netscript/sdk/client';
import { createQueryFactories } from '@netscript/sdk/query';

const Todo = z.object({ id: z.string(), title: z.string(), done: z.boolean() });
const TodosContract = {
  list: oc.route({ method: 'POST' }).input(z.object({})).output(z.array(Todo)),
  update: oc.route({ method: 'POST' })
    .input(z.object({ id: z.string(), done: z.boolean() }))
    .output(Todo),
};
const todosClient = createServiceClient({ contract: TodosContract, serviceName: 'todos' });
export const todosQueries = createQueryFactories({
  todos: { contract: TodosContract, client: todosClient },
}).todos;
`,
  );
  await writeSnippetFile(
    join(pageRoot, 'routes/(_components)/ContactForm.tsx'),
    `export default function ContactForm() { return null; }
`,
  );
}
