// authored stories for "search"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Default: function () {
      return h(NS.Search, {
        placeholder: 'Search runs, services, flows…',
        shortcut: '⌘K',
      });
    },
    NoShortcut: function () {
      return h(NS.Search, { placeholder: 'Search the dashboard…' });
    },
  };
})();
