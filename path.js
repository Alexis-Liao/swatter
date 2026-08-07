(function () {
  var base = './';
  if (location.hostname.endsWith('github.io')) {
    var repo = location.pathname.split('/').filter(Boolean)[0];
    if (repo && repo.indexOf('.') === -1) base = '/' + repo + '/';
  }
  if (document.querySelector('base')) return;
  var el = document.createElement('base');
  el.href = base;
  document.head.insertBefore(el, document.head.firstChild);
})();
