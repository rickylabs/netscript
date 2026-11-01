/** App-owned view for unknown query payloads: semantic lists and fields, never a JSON dump. */
export const QUERY_RESULT_TEMPLATE: string = `
function fieldLabel(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ');
}
function isFieldRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) &&
    !(value instanceof Date);
}
/** Amount units are explicit; unknown service contracts retain their raw numeric value. */
type AmountUnit = 'minor' | 'major';
function RichRecordValue(
  { row, field, amountUnit }: {
    row: Record<string, unknown>;
    field: string;
    amountUnit?: AmountUnit;
  },
): VNode {
  if (field === 'amount' && typeof row.amount === 'number' && typeof row.currency === 'string') {
    if (amountUnit && /^[A-Z]{3}$/.test(row.currency)) {
      try {
        const format = new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: row.currency,
        });
        const divisor = amountUnit === 'minor'
          ? 10 ** (format.resolvedOptions().maximumFractionDigits ?? 2)
          : 1;
        return <span class='workspace-money'>{format.format(row.amount / divisor)}</span>;
      } catch { /* Unsupported currencies retain the actual value and unit below. */ }
    }
    return <span class='workspace-money'>{String(row.amount)} {row.currency}</span>;
  }
  if (field === 'ownerName') {
    return (
      <div class='workspace-owner'>
        <span class='workspace-avatar' aria-hidden='true'>
          {String(row.ownerName).split(/\\s+/).slice(0, 2).map((part) => part[0]).join('')}
        </span>
        <span>
          {String(row.ownerName)}
          <small class='workspace-record-description'>{String(row.ownerEmail ?? '')}</small>
        </span>
      </div>
    );
  }
  if (field === 'reference') {
    return (
      <span class='workspace-record-link'>
        {String(row.reference)}
        <small class='workspace-record-description'>{String(row.name ?? '')}</small>
      </span>
    );
  }
  return <QueryResult value={row[field]} amountUnit={amountUnit} />;
}
/** Tables preserve the actual payload fields; dates are values rather than empty objects. */
function QueryResult({ value, amountUnit }: { value: unknown; amountUnit?: AmountUnit }): VNode {
  if (value === null || value === undefined) return <span class='text-ns-muted-fg'>—</span>;
  if (value instanceof Date || (typeof value === 'string' && /^\\d{4}-\\d{2}-\\d{2}T/.test(value))) {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime())
      ? (
        <time dateTime={date.toISOString()}>
          {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
            date,
          )}
        </time>
      )
      : <span>—</span>;
  }
  if (Array.isArray(value)) {
    if (!value.length) {
      return (
        <div class='workspace-empty' role='status'>
          <h3>No records yet</h3>
          <p>New records will appear here when your service returns them.</p>
        </div>
      );
    }
    if (value.every(isFieldRecord)) {
      const rich = value.every((row) =>
        typeof row.reference === 'string' && typeof row.ownerName === 'string' &&
        typeof row.currency === 'string' && typeof row.amount === 'number' &&
        (row.name === undefined || typeof row.name === 'string') &&
        (row.ownerEmail === undefined || typeof row.ownerEmail === 'string')
      );
      const mappedFields = new Set([
        'reference',
        'name',
        'ownerName',
        'ownerEmail',
        'status',
        'amount',
        'currency',
        'createdAt',
      ]);
      const extraFields = rich
        ? [...new Set(value.flatMap((row) => Object.keys(row)))].filter((field) =>
          !mappedFields.has(field)
        )
        : [];
      const fields = rich
        ? ['reference', 'ownerName', 'status', 'amount', 'createdAt']
        : [...new Set(value.flatMap((row) => Object.keys(row)))];
      return (
        <div class='workspace-query-scroll' role='region' aria-label='Service results' tabIndex={0}>
          <table class='workspace-query-table'>
            <thead>
              <tr>
                {fields.map((field) => (
                  <th key={field} scope='col'>
                    {field === 'ownerName' ? 'Owner' : fieldLabel(field)}
                  </th>
                ))}
                {extraFields.length > 0 && <th scope='col'>Details</th>}
              </tr>
            </thead>
            <tbody>
              {value.map((row, index) => (
                <tr key={typeof row.id === 'string' || typeof row.id === 'number' ? row.id : index}>
                  {fields.map((field) => (
                    <td key={field}>
                      {rich && field !== 'status'
                        ? <RichRecordValue row={row} field={field} amountUnit={amountUnit} />
                        : field === 'status' && typeof row[field] === 'string'
                        ? (
                          <span
                            class='ns-badge'
                            data-variant={row[field] === 'paid' || row[field] === 'completed'
                              ? 'success'
                              : row[field] === 'cancelled' || row[field] === 'failed'
                              ? 'destructive'
                              : row[field] === 'pending' || row[field] === 'awaiting_payment'
                              ? 'warning'
                              : 'muted'}
                          >
                            {fieldLabel(row[field])}
                          </span>
                        )
                        : <QueryResult value={row[field]} amountUnit={amountUnit} />}
                    </td>
                  ))}
                  {extraFields.length > 0 && (
                    <td>
                      <details>
                        <summary>More fields</summary>
                        <QueryResult
                          value={Object.fromEntries(
                            extraFields.filter((field) => Object.hasOwn(row, field)).map((
                              field,
                            ) => [field, row[field]]),
                          )}
                          amountUnit={amountUnit}
                        />
                      </details>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return (
      <ul class='ns-stack ns-stack--sm'>
        {value.map((item, index) => (
          <li key={index}>
            <QueryResult value={item} amountUnit={amountUnit} />
          </li>
        ))}
      </ul>
    );
  }
  if (isFieldRecord(value)) {
    const pagination = typeof value.page === 'number' && typeof value.total === 'number' &&
      typeof value.totalPages === 'number';
    const fields = Object.entries(value).filter(([key]) =>
      !pagination ||
      !['page', 'total', 'totalPages'].includes(key) &&
        !(key === 'limit' && typeof value.limit === 'number')
    );
    if (!fields.length && !pagination) return <p role='status'>No fields returned.</p>;
    return (
      <div class='workspace-query-fields'>
        {pagination && (
          <p class='workspace-query-pagination'>
            Page {String(value.page)} of {Math.max(1, Number(value.totalPages))} ·{' '}
            {String(value.total)} {value.total === 1 ? 'record' : 'records'}
            {typeof value.limit === 'number' && <>· {value.limit} per page</>}
          </p>
        )}
        {fields.map(([label, field]) =>
          Array.isArray(field)
            ? (
              <section key={label}>
                <h3 class='workspace-query-label'>{fieldLabel(label)}</h3>
                <QueryResult value={field} amountUnit={amountUnit} />
              </section>
            )
            : (
              <dl key={label} class='workspace-query-field'>
                <dt>{fieldLabel(label)}</dt>
                <dd>
                  <QueryResult value={field} amountUnit={amountUnit} />
                </dd>
              </dl>
            )
        )}
      </div>
    );
  }
  return <span>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</span>;
}
`;

/** Shared successful result surface for page and resource-island generators. */
export const QUERY_RESULT_SUCCESS_RETURN: string = `  return (
    <div data-query-result>
      <QueryResult value={query.data} />
    </div>
  );`;

/** Query-state presentation keeps stale data visible while a background refresh runs. */
export const QUERY_RESULT_RETURN: string =
  `  if (query.isLoading) return <p role='status'>Loading records…</p>;
  if (query.isError) return <p role='alert'>Unable to load records. Please try again.</p>;
${QUERY_RESULT_SUCCESS_RETURN}`;
