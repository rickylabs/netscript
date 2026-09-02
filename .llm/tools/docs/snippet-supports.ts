import { dirname, join, toFileUrl } from '@std/path';

export interface JsdocScaffoldAliasRule {
  readonly prefix: string;
  readonly scaffoldKind: 'app' | 'service' | 'workspace';
  readonly allowedMemberNames: readonly string[];
}

/** Generator-aligned alias families accepted by the published JSDoc gate. */
export const JSDOC_SCAFFOLD_ALIAS_RULES: readonly JsdocScaffoldAliasRule[] = [
  {
    prefix: '@app/',
    scaffoldKind: 'app',
    allowedMemberNames: ['@netscript/fresh', '@netscript/sdk'],
  },
  {
    prefix: '@database',
    scaffoldKind: 'service',
    allowedMemberNames: [
      '@netscript/contracts',
      '@netscript/database',
      '@netscript/prisma-adapter-mysql',
      '@netscript/service',
    ],
  },
] as const;

/** Reject a generated alias when its documented owner is not a matching scaffold context. */
export function scaffoldAliasViolation(
  specifier: string,
  memberName: string,
): string | undefined {
  const rule = JSDOC_SCAFFOLD_ALIAS_RULES.find((candidate) =>
    specifier.startsWith(candidate.prefix)
  );
  if (!rule || rule.allowedMemberNames.includes(memberName)) return undefined;
  return `${rule.scaffoldKind}-generated alias ${
    JSON.stringify(specifier)
  } is not generated for ${memberName}`;
}

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
    '@database': join(supportRoot, 'database.ts'),
    '@database/zod': join(supportRoot, 'database-zod.ts'),
    '@playground/contracts': join(supportRoot, 'playground-contracts.ts'),
    '@my-app/contracts': join(supportRoot, 'my-app-contracts.ts'),
    '@app/utils.ts': join(supportRoot, 'app-utils.ts'),
    '@app/lib/contacts.ts': join(supportRoot, 'contacts.ts'),
    '@app/lib/orders.ts': join(supportRoot, 'orders.ts'),
    '@app/streams/schemas.ts': join(supportRoot, 'app-stream-schemas.ts'),
  };

  await writeSnippetFile(
    supports['@database'],
    `export class PrismaClient {
  constructor(_options?: unknown) {}
  readonly sagaInstance = {
    async create(input: unknown): Promise<unknown> { return input; },
    async findFirst(): Promise<{ state: Record<string, unknown> }> { return { state: {} }; },
  };
  async $queryRawUnsafe(_query: string): Promise<unknown> { return undefined; }
  async $disconnect(): Promise<void> {}
  $extends(_extension: unknown): PrismaClient { return this; }
}
export const Prisma = {
  defineExtension<T>(config: T): T { return config; },
};
export const db: any = {};
`,
  );
  await writeSnippetFile(
    supports['@database/zod'],
    `import { z } from 'zod';
export const UserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const UpdateUserSchema = CreateUserSchema;
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

export const ordersContract = {
  get: oc.route({ method: 'POST' })
    .input(z.object({ id: z.string() }))
    .output(z.object({ id: z.string() })),
  list: oc.route({ method: 'POST' })
    .input(z.object({ offset: z.number(), limit: z.number() }))
    .output(z.array(z.object({ id: z.string() }))),
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
  await writeSnippetFile(
    supports['@app/lib/orders.ts'],
    `import { createServiceClient } from '@netscript/sdk/client';
import { ordersContract } from '@my-app/contracts';
export const ordersClient = createServiceClient({
  contract: ordersContract,
  serviceName: 'orders',
});
`,
  );
  await writeSnippetFile(
    supports['@app/streams/schemas.ts'],
    `import { createStateSchema } from '@durable-streams/state';
import { z } from 'zod';
export const myStreamSchema = createStateSchema({
  myEntity: {
    schema: z.object({ id: z.string() }),
    type: 'my-entity',
    primaryKey: 'id',
  },
});
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
    join(pageRoot, 'apps/dashboard/lib/orders.ts'),
    `import { oc } from '@orpc/contract';
import { z } from 'zod';
import { createServiceClient } from '@netscript/sdk/client';
import { createQueryFactories } from '@netscript/sdk/query';

const OrdersContract = {
  list: oc.route({ method: 'POST' })
    .input(z.object({ limit: z.number().int().positive() }))
    .output(z.array(z.object({ id: z.string(), reference: z.string() }))),
};
const ordersClient = createServiceClient({ contract: OrdersContract, serviceName: 'orders' });
export const ordersQueries = createQueryFactories({
  orders: { contract: OrdersContract, client: ordersClient },
}).orders;
`,
  );
  await writeSnippetFile(
    join(pageRoot, 'apps/dashboard/lib/widgets.ts'),
    `import { oc } from '@orpc/contract';
import { z } from 'zod';
import { createServiceClient } from '@netscript/sdk/client';
import { createQueryFactories } from '@netscript/sdk/query';

const WidgetsContract = {
  list: oc.route({ method: 'POST' })
    .input(z.object({}))
    .output(z.array(z.object({ id: z.string(), name: z.string() }))),
};
const widgetsClient = createServiceClient({ contract: WidgetsContract, serviceName: 'widgets' });
export const widgetsQueries = createQueryFactories({
  widgets: { contract: WidgetsContract, client: widgetsClient },
}).widgets;
`,
  );
  await writeSnippetFile(
    join(pageRoot, 'routes/(_components)/ContactForm.tsx'),
    `export default function ContactForm() { return null; }
`,
  );
}
