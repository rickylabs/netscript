/** App-owned view for unknown query payloads: semantic lists and fields, never a JSON dump. */
export const QUERY_RESULT_TEMPLATE: string = `
/** Replace this generic field view with your domain's columns and actions. */
function QueryResult({ value }: { value: unknown }): VNode {
  if (value === null || value === undefined) {
    return <p class='text-ns-muted-fg'>No value</p>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <p role='status'>No records yet.</p>;
    return (
      <ol class='ns-stack ns-stack--md' aria-label='Records'>
        {value.map((item, index) => (
          <li key={index} class='min-w-0 border border-ns-border p-4'>
            <QueryResult value={item} />
          </li>
        ))}
      </ol>
    );
  }
  if (typeof value === 'object') {
    const fields = Object.entries(value);
    if (fields.length === 0) return <p role='status'>No details available.</p>;
    return (
      <dl class='ns-stack ns-stack--sm'>
        {fields.map(([label, field]) => (
          <div key={label} class='min-w-0'>
            <dt class='font-mono text-xs text-ns-muted-fg'>{label}</dt>
            <dd class='m-0 min-w-0 [overflow-wrap:anywhere]'>
              <QueryResult value={field} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  return <span>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</span>;
}
`;

/** Query-state presentation keeps stale data visible while a background refresh runs. */
export const QUERY_RESULT_RETURN: string =
  `  if (query.isLoading) return <p role='status'>Loading records…</p>;
  if (query.isError) return <p role='alert'>Unable to load records. Please try again.</p>;
  return <QueryResult value={query.data} />;`;
