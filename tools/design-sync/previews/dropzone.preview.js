// authored stories for "dropzone"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Default: function () {
      return h(NS.Dropzone, {
        label: 'Drop a seed file or click to upload',
        hint: 'CSV or JSON · up to 10 MB',
        accept: '.csv,.json',
      });
    },
    Active: function () {
      return h(NS.Dropzone, {
        active: true,
        label: 'Release to import runs.json',
        hint: 'Parsing on drop — 1 file at a time',
        icon: '↓',
      });
    },
  };
})();
