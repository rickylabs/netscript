// authored stories for "pagination"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    // ns-cluster--between gives the row its space-between layout on the canvas
    // closure, which ships ns-* layout objects rather than the block's utilities.
    Default: function () {
      return h(NS.Pagination, { class: 'ns-cluster ns-cluster--between' }, [
        h(NS.Pagination.Meta, { key: 'm' }, 'Page 3 of 12 · 1,204 runs'),
        h(NS.Pagination.Actions, { key: 'a' }, [
          h(NS.Button, { key: 'p', variant: 'outline', size: 'sm', icon: '←' }, 'Previous'),
          h(
            NS.Button,
            { key: 'n', variant: 'outline', size: 'sm', icon: '→', iconPosition: 'right' },
            'Next',
          ),
        ]),
      ]);
    },
    FirstPage: function () {
      return h(NS.Pagination, { class: 'ns-cluster ns-cluster--between' }, [
        h(NS.Pagination.Meta, { key: 'm' }, 'Page 1 of 12 · 1,204 runs'),
        h(NS.Pagination.Actions, { key: 'a' }, [
          h(
            NS.Button,
            { key: 'p', variant: 'outline', size: 'sm', icon: '←', disabled: true },
            'Previous',
          ),
          h(
            NS.Button,
            { key: 'n', variant: 'outline', size: 'sm', icon: '→', iconPosition: 'right' },
            'Next',
          ),
        ]),
      ]);
    },
  };
})();
