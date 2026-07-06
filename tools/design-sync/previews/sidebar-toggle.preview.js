// authored stories for "sidebar-toggle"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Default: function () {
      return h(NS.SidebarToggle, {
        openLabel: 'Open navigation',
        closeLabel: 'Close navigation',
        openIcon: '☰',
        closeIcon: '✕',
      });
    },
  };
})();
