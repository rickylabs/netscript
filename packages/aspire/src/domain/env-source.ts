/** Source for an environment variable value in an AppHost composition. */
export type EnvSource =
  | { readonly kind: 'literal'; readonly value: string }
  | { readonly kind: 'resource'; readonly resource: string; readonly key: string }
  | { readonly kind: 'secret'; readonly name: string };
