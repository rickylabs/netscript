// authored stories for "empty-state"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  // The block styles its dashed frame with `rounded-md border-dashed` utilities
  // absent from the canvas closure; an inline border keeps the framed look.
  var frame = 'border:1px dashed var(--ns-border);border-radius:8px;padding:1.25rem';
  window.__dsPreview = {
    NoRuns: function () {
      return h(
        NS.EmptyState,
        { heading: 'No runs match these filters', style: frame },
        h('div', { class: 'ns-stack ns-stack--sm' }, [
          h(
            'p',
            { key: 't', class: 'ns-text-sm ns-muted-fg' },
            'Try widening the state filter or clearing the flow search.',
          ),
          h(
            'div',
            { key: 'a', class: 'ns-cluster' },
            h(NS.Button, { variant: 'outline', size: 'sm' }, 'Clear filters'),
          ),
        ]),
      );
    },
    NoPlugins: function () {
      return h(
        NS.EmptyState,
        { heading: 'No plugins installed', style: frame },
        h('div', { class: 'ns-stack ns-stack--sm' }, [
          h(
            'p',
            { key: 't', class: 'ns-text-sm ns-muted-fg' },
            'Add workers, sagas, triggers, or streams to start processing background work.',
          ),
          h(
            'div',
            { key: 'a', class: 'ns-cluster' },
            h(NS.Button, { variant: 'primary', size: 'sm', icon: '+' }, 'Add a plugin'),
          ),
        ]),
      );
    },
  };
})();
