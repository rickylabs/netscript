// authored stories for "skeleton"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Table: function () {
      return h(NS.Skeleton, { variant: 'table', rows: 5, columns: 4 });
    },
    Stats: function () {
      return h(NS.Skeleton, { variant: 'stats', cards: 4 });
    },
    Form: function () {
      return h(NS.Skeleton, { variant: 'form', rows: 4 });
    },
  };
})();
