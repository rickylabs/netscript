// authored stories for "filter-form"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    RunFilters: function () {
      return h(NS.FilterForm, null, [
        h(
          NS.FilterForm.Body,
          { key: 'body', class: 'ns-stack ns-stack--sm' },
          [
            h(
              NS.FormField,
              { key: 'svc', label: 'Service', name: 'service' },
              h(NS.Select, {
                name: 'service',
                value: 'sagas',
                options: [
                  { value: '', label: 'All services' },
                  { value: 'api', label: 'api' },
                  { value: 'workers', label: 'workers' },
                  { value: 'sagas', label: 'sagas' },
                  { value: 'triggers', label: 'triggers' },
                ],
              }),
            ),
            h(
              NS.FormField,
              { key: 'state', label: 'State', name: 'state' },
              h(NS.Select, {
                name: 'state',
                value: 'failed',
                options: [
                  { value: '', label: 'Any state' },
                  { value: 'running', label: 'running' },
                  { value: 'completed', label: 'completed' },
                  { value: 'failed', label: 'failed' },
                  { value: 'retrying', label: 'retrying' },
                ],
              }),
            ),
            h(
              NS.FormField,
              { key: 'q', label: 'Flow or trace id', name: 'q' },
              h(NS.Input, { name: 'q', type: 'search', placeholder: 'order.* or tr_…' }),
            ),
          ],
        ),
        h(NS.FilterForm.Actions, { key: 'actions', class: 'ns-cluster' }, [
          h(NS.Button, { key: 'a', type: 'submit', variant: 'primary' }, 'Apply filters'),
          h(NS.Button, { key: 'r', type: 'reset', variant: 'ghost' }, 'Reset'),
        ]),
      ]);
    },
  };
})();
