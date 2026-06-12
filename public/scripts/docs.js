// Docs page: sidebar search filter, scrollspy active state, mobile toggle.
// Vanilla, no deps. Degrades gracefully if elements are missing.
(function () {
  var sidebar = document.getElementById('docs-sidebar');
  var search = document.getElementById('ds-search');
  var nav = document.getElementById('ds-nav');
  var toggle = document.getElementById('ds-mobile-toggle');
  if (!sidebar || !nav) return;

  // --- Search: filter endpoint links, hide empty groups ---
  if (search) {
    search.addEventListener('input', function () {
      var q = search.value.trim().toLowerCase();
      nav.querySelectorAll('.ds-group').forEach(function (g) {
        var any = false;
        g.querySelectorAll('.ds-link').forEach(function (a) {
          var hit = !q || (a.getAttribute('data-s') || '').indexOf(q) !== -1;
          a.style.display = hit ? '' : 'none';
          if (hit) any = true;
        });
        g.style.display = any ? '' : 'none';
      });
    });
  }

  // --- Scrollspy: highlight the sidebar link for the endpoint in view ---
  var links = {};
  nav.querySelectorAll('.ds-link').forEach(function (a) {
    var h = a.getAttribute('href');
    if (h && h.charAt(0) === '#') links[h.slice(1)] = a;
  });
  var current = null;
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var a = links[e.target.id];
        if (a && a !== current) {
          if (current) current.classList.remove('active');
          a.classList.add('active');
          current = a;
        }
      });
    }, { rootMargin: '0px 0px -78% 0px', threshold: 0 });
    document.querySelectorAll('.ep-detail').forEach(function (el) { io.observe(el); });
  }

  // --- Mobile drawer ---
  if (toggle) {
    toggle.addEventListener('click', function () { sidebar.classList.toggle('open'); });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) sidebar.classList.remove('open');
    });
  }
})();
