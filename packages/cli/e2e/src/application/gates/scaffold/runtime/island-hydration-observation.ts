/** Browser observation shared by the runtime probe and real-DOM contract tests. */
export function islandHydrationObservationExpression(queryModulePath: string): string {
  return `(async () => {
    const surface = document.querySelector('main [data-query-result]');
    const { getIslandQueryClient } = await import(${JSON.stringify(queryModulePath)});
    const queryClient = getIslandQueryClient();
    const queries = queryClient.getQueryCache().getAll();
    const listQuery = queries.find((query) =>
      Array.isArray(query.queryKey) && query.queryKey[0] === 'users' && query.queryKey[1] === 'list'
    );
    return {
      queryClientFound: queryClient !== null,
      listQueryFound: listQuery !== undefined,
      freshIslandElement: surface?.tagName.toLowerCase() ?? null,
    };
  })()`;
}
