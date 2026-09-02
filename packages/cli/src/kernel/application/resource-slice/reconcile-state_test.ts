import { assertEquals, assertStringIncludes } from '@std/assert';
import { reconcileState } from './reconcile-state.ts';

const REQUIREMENT = {
  resource: 'orders',
  property: 'ordersRequest',
  type: 'OrdersRequestState',
} as const;

Deno.test('converts the empty Record State alias to a marked interface once', () => {
  const source = `import type { Session } from './session.ts';

export type State = Record<string, never>;

export const define = createDefine<State>();
`;
  const result = reconcileState(source, REQUIREMENT);
  assertEquals(result.status, 'insert');
  if (result.status !== 'insert') return;
  assertStringIncludes(
    result.content,
    `export interface State {
  /** @netscript/resource-slice orders */
  readonly ordersRequest: OrdersRequestState;
}`,
  );
  assertStringIncludes(result.content, "import type { Session } from './session.ts';");
  assertEquals(reconcileState(result.content, REQUIREMENT), {
    status: 'exact',
    content: result.content,
  });
});

Deno.test('inserts into an existing State interface while preserving unrelated members', () => {
  const source = `export interface State {
  readonly session: {
    readonly userId: string;
  };
}
`;
  const result = reconcileState(source, REQUIREMENT);
  assertEquals(result.status, 'insert');
  if (result.status !== 'insert') return;
  assertStringIncludes(result.content, 'readonly userId: string;');
  assertStringIncludes(result.content, 'readonly ordersRequest: OrdersRequestState;');
});

Deno.test('skips an exact pre-existing property even without a generator marker', () => {
  const source = `export interface State {
  readonly ordersRequest: OrdersRequestState;
}
`;
  assertEquals(reconcileState(source, REQUIREMENT), { status: 'exact', content: source });
});

Deno.test('does not mistake a same-named declaration outside State for a State member', () => {
  const source = `const unrelated = {
  ordersRequest: OrdersRequestState,
};

export interface State {
  /** A brace in a comment must not terminate the interface: } */
  readonly session: Session;
}
`;
  const result = reconcileState(source, REQUIREMENT);
  assertEquals(result.status, 'insert');
  if (result.status !== 'insert') return;
  assertStringIncludes(result.content, 'readonly session: Session;');
  assertStringIncludes(result.content, 'readonly ordersRequest: OrdersRequestState;');
});

Deno.test('fails closed for conflicting, extended, aliased, intersected, duplicate, or missing State', () => {
  const fixtures = [
    'export interface State {\n  readonly ordersRequest: OtherState;\n}\n',
    'export interface State extends BaseState {}\n',
    'export type State = { readonly userId: string };\n',
    'export type State = BaseState & { readonly userId: string };\n',
    'export interface State {}\nexport interface State {}\n',
    'export const define = createDefine();\n',
  ];
  for (const source of fixtures) {
    assertEquals(reconcileState(source, REQUIREMENT).status, 'conflict');
  }
});
