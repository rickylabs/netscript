// authored stories for "breadcrumb"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Default: function () {
      return h(NS.Breadcrumb, {
        items: [
          { label: 'Dashboard', href: '/' },
          { label: 'Services', href: '/services' },
          { label: 'workers', href: '/services/workers' },
          { label: 'Run 4f2a' },
        ],
      });
    },
    Shallow: function () {
      return h(NS.Breadcrumb, {
        items: [
          { label: 'Runs', href: '/runs', icon: '▤' },
          { label: 'order.fulfillment' },
        ],
      });
    },
  };
})();
