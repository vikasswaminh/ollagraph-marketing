// Docs page: category tabs, scroll buttons, copy buttons, sidebar sync, search filter, and mobile drawer.
(function () {
  // Prevent browser from prematurely restoring scroll position on initial short DOM and clamping to footer
  if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
    try {
      history.scrollRestoration = 'manual';
    } catch (e) {}
  }

  var sidebar = document.getElementById('docs-sidebar');
  var search = document.getElementById('ds-search');
  var nav = document.getElementById('ds-nav');
  var toggle = document.getElementById('ds-mobile-toggle');
  var tabBarWrap = document.getElementById('ds-tab-bar-wrap');
  var tabBar = document.getElementById('ds-tab-bar');
  var moreWrap = document.getElementById('ds-more-wrap');
  var moreBtn = document.getElementById('ds-more-btn');
  var moreMenu = document.getElementById('ds-more-menu');
  var moreLabel = document.getElementById('ds-more-label');
  var moreCount = document.getElementById('ds-more-count');
  var panels = document.querySelectorAll('[data-tab-panel]');
  var tabBtns = tabBar ? tabBar.querySelectorAll('.ds-tab:not(.ds-tab-more)') : [];
  var moreItems = moreMenu ? moreMenu.querySelectorAll('.ds-more-item') : [];
  var defaultMoreCount = String(moreItems.length);

  var NAV_HEIGHT = 64;

  if (!sidebar || !nav) return;

  var links = {};
  nav.querySelectorAll('.ds-link').forEach(function (a) {
    var h = a.getAttribute('href');
    if (h && h.charAt(0) === '#') links[h.slice(1)] = a;
  });
  var current = null;

  var sidebarScrollTicking = false;
  function scrollActiveLinkIntoSidebarView(linkEl) {
    if (!sidebar || !linkEl) return;
    if (sidebarScrollTicking) return;

    sidebarScrollTicking = true;
    window.requestAnimationFrame(function () {
      sidebarScrollTicking = false;

      var sidebarRect = sidebar.getBoundingClientRect();
      var linkRect = linkEl.getBoundingClientRect();

      var searchWrap = sidebar.querySelector('.ds-search-wrap');
      var topStickyBound = searchWrap ? searchWrap.getBoundingClientRect().bottom : (sidebarRect.top + 70);

      // Safe visible padding margins within the sidebar
      var minVisibleTop = topStickyBound + 12;
      var maxVisibleBottom = sidebarRect.bottom - 24;

      if (linkRect.top < minVisibleTop) {
        var diff = linkRect.top - minVisibleTop;
        sidebar.scrollBy({ top: diff, behavior: 'smooth' });
      } else if (linkRect.bottom > maxVisibleBottom) {
        var diff = linkRect.bottom - maxVisibleBottom;
        sidebar.scrollBy({ top: diff, behavior: 'smooth' });
      }
    });
  }

  // --- Category Tab Switching ---
  function activateTab(tag, shouldScrollToTab) {
    if (!tag) return;

    var isOverview = tag.toLowerCase() === 'overview';

    // Switch top visible tab buttons
    var isTopActive = false;
    tabBtns.forEach(function (btn) {
      var isActive = (btn.dataset.tab || '').toLowerCase() === tag.toLowerCase();
      btn.classList.toggle('active', isActive);
      if (isActive) isTopActive = true;
    });

    // Switch More dropdown items and update More button state
    var isMoreActive = false;
    var activeMoreName = '';
    var activeMoreCount = '';
    moreItems.forEach(function (item) {
      var isActive = (item.dataset.tab || '').toLowerCase() === tag.toLowerCase();
      item.classList.toggle('active', isActive);
      if (isActive) {
        isMoreActive = true;
        activeMoreName = item.dataset.tab || '';
        var countEl = item.querySelector('.ds-more-item-count');
        activeMoreCount = countEl ? countEl.textContent : '';
      }
    });

    if (moreBtn) {
      moreBtn.classList.toggle('active', isMoreActive);
      if (moreLabel && moreCount) {
        if (isMoreActive) {
          moreLabel.textContent = activeMoreName;
          moreCount.textContent = activeMoreCount;
        } else {
          moreLabel.textContent = 'More';
          moreCount.textContent = defaultMoreCount;
        }
      }
    }

    // If opening a new tab, immediately reset page scroll to top so it doesn't open at the previous scroll offset
    if (shouldScrollToTab) {
      window.scrollTo(0, 0);
    }

    // Switch content panels
    panels.forEach(function (panel) {
      var panelTag = panel.dataset.tabPanel || '';
      var isActive = panelTag.toLowerCase() === tag.toLowerCase();
      panel.classList.toggle('ds-section--hidden', !isActive);
      panel.classList.toggle('ds-section--active', isActive);
    });

    if (shouldScrollToTab) {
      window.scrollTo(0, 0);
    }

    // Persist active tab and scroll offset in sessionStorage
    try {
      sessionStorage.setItem('ollagraph_docs_tab', tag);
      if (shouldScrollToTab) {
        sessionStorage.setItem('ollagraph_docs_scroll', '0');
      }
    } catch (e) {}

    // Update URL hash cleanly without cluttering history
    if (shouldScrollToTab) {
      var newHash = isOverview ? '' : '#tag-' + tag.toLowerCase();
      if (window.location.hash !== newHash) {
        if (newHash) {
          history.replaceState(null, '', newHash);
        } else if (window.location.hash) {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }

    // Update sidebar styling
    if (!isOverview) {
      nav.querySelectorAll('.ds-top').forEach(function (topLink) {
        topLink.classList.remove('active');
      });
    } else {
      updateOverviewScrollspy();
    }

    var q = search ? search.value.trim() : '';
    if (!q) {
      nav.querySelectorAll('.ds-group').forEach(function (g) {
        var isMatch = (g.dataset.tag || '').toLowerCase() === tag.toLowerCase();
        g.style.opacity = isOverview ? '0.6' : (isMatch ? '1' : '0.45');
        g.classList.toggle('ds-group--active', isMatch);
      });
    }

    // Scroll sidebar to matching category
    if (sidebar) {
      if (isOverview) {
        sidebar.scrollTo({ top: 0, behavior: 'smooth' });
        if (current) current.classList.remove('active');
        current = null;
      } else {
        var targetGroup = null;
        var groups = nav.querySelectorAll('.ds-group');
        for (var i = 0; i < groups.length; i++) {
          if ((groups[i].dataset.tag || '').toLowerCase() === tag.toLowerCase()) {
            targetGroup = groups[i];
            break;
          }
        }
        if (targetGroup) {
          var searchWrap = sidebar.querySelector('.ds-search-wrap');
          var searchBottom = searchWrap ? searchWrap.getBoundingClientRect().bottom : sidebar.getBoundingClientRect().top + 70;
          var groupTop = targetGroup.getBoundingClientRect().top;
          var delta = (groupTop - searchBottom) - 18;
          var targetTop = Math.max(0, sidebar.scrollTop + delta);
          sidebar.scrollTo({ top: targetTop, behavior: 'smooth' });

          var firstLink = targetGroup.querySelector('.ds-link');
          if (firstLink && shouldScrollToTab) {
            if (current) current.classList.remove('active');
            firstLink.classList.add('active');
            current = firstLink;
          }
        }
      }
    }
  }

  // Tab button click listeners
  if (tabBar) {
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activateTab(btn.dataset.tab, true);
      });
    });
  }

  // More dropdown open / close and click handlers
  if (moreBtn && moreMenu) {
    function openMoreMenu() {
      moreMenu.classList.add('open');
      if (moreWrap) moreWrap.classList.add('open');
      moreBtn.setAttribute('aria-expanded', 'true');
    }

    function closeMoreMenu() {
      moreMenu.classList.remove('open');
      if (moreWrap) moreWrap.classList.remove('open');
      moreBtn.setAttribute('aria-expanded', 'false');
    }

    moreBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (moreMenu.classList.contains('open')) {
        closeMoreMenu();
      } else {
        openMoreMenu();
      }
    });

    document.addEventListener('click', function (e) {
      if (!moreWrap || !moreWrap.contains(e.target)) {
        closeMoreMenu();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && moreMenu.classList.contains('open')) {
        closeMoreMenu();
      }
    });

    moreItems.forEach(function (item) {
      item.addEventListener('click', function () {
        closeMoreMenu();
        activateTab(item.dataset.tab, true);
      });
    });
  }

  var isProgrammaticScrolling = false;

  // Sidebar top links (Overview, Quickstart, Authentication)
  nav.querySelectorAll('.ds-top').forEach(function (topLink) {
    topLink.addEventListener('click', function (e) {
      var targetId = (topLink.getAttribute('href') || '').replace(/^#/, '');
      isProgrammaticScrolling = true;
      nav.querySelectorAll('.ds-top').forEach(function (tl) {
        tl.classList.remove('active');
      });
      topLink.classList.add('active');
      activateTab('Overview', false);
      var targetEl = document.getElementById(targetId);
      if (targetEl) {
        var rect = targetEl.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + rect.top - NAV_HEIGHT - 20, behavior: 'smooth' });
      }
      setTimeout(function () {
        isProgrammaticScrolling = false;
      }, 700);
    });
  });

  // Keyboard shortcut ('/' to focus search, 'Esc' to blur/clear)
  if (search) {
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== search && !e.ctrlKey && !e.metaKey && !e.altKey) {
        var tag = document.activeElement ? document.activeElement.tagName : '';
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          search.focus();
          search.select();
        }
      } else if (e.key === 'Escape' && document.activeElement === search) {
        search.value = '';
        search.dispatchEvent(new Event('input'));
        search.blur();
      }
    });
  }

  // Sidebar category headers
  nav.querySelectorAll('.ds-group-h').forEach(function (h) {
    h.addEventListener('click', function () {
      var group = h.closest('.ds-group');
      if (group && group.dataset.tag) {
        activateTab(group.dataset.tag, true);
      }
    });
  });

  // Sidebar endpoint links
  nav.querySelectorAll('.ds-link').forEach(function (link) {
    link.addEventListener('click', function () {
      var group = link.closest('.ds-group');
      if (group && group.dataset.tag) {
        activateTab(group.dataset.tag, false);
      }
      if (current) current.classList.remove('active');
      link.classList.add('active');
      current = link;
      scrollActiveLinkIntoSidebarView(link);
      var targetId = (link.getAttribute('href') || '').replace(/^#/, '');
      if (targetId) {
        var targetEl = document.getElementById(targetId);
        if (targetEl) {
          setTimeout(function () {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 15);
        }
      }
    });
  });

  // --- Copy Buttons (cURL, JSON, and path) ---
  function registerCopyButtons() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.ep-copy-btn, .ep-copy-path-btn');
      if (!btn) return;
      var textToCopy = btn.getAttribute('data-copy');
      if (!textToCopy) return;

      function showCopied() {
        var originalHtml = btn.innerHTML;
        btn.classList.add('copied');
        btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>';
        setTimeout(function () {
          btn.classList.remove('copied');
          btn.innerHTML = originalHtml;
        }, 1800);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(showCopied).catch(function () {
          fallbackCopy(textToCopy, showCopied);
        });
      } else {
        fallbackCopy(textToCopy, showCopied);
      }
    });
  }

  function fallbackCopy(text, cb) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      if (cb) cb();
    } catch (err) {}
    document.body.removeChild(ta);
  }

  registerCopyButtons();

  // --- Track Scroll Position to Preserve It on Refresh ---
  var saveScrollTimeout = null;
  window.addEventListener('scroll', function () {
    if (!saveScrollTimeout) {
      saveScrollTimeout = setTimeout(function () {
        saveScrollTimeout = null;
        try {
          sessionStorage.setItem('ollagraph_docs_scroll', String(window.scrollY));
        } catch (e) {}
      }, 150);
    }
  }, { passive: true });

  window.addEventListener('beforeunload', function () {
    try {
      sessionStorage.setItem('ollagraph_docs_scroll', String(window.scrollY));
    } catch (e) {}
  });

  // --- Initial Deep Link / Hash / Refresh State Handling ---
  var savedTab = null;
  var savedScroll = null;
  try {
    savedTab = sessionStorage.getItem('ollagraph_docs_tab');
    savedScroll = sessionStorage.getItem('ollagraph_docs_scroll');
  } catch (e) {}

  if (window.location.hash) {
    var hashId = window.location.hash.slice(1);
    if (hashId === 'overview' || hashId === 'quickstart' || hashId === 'auth') {
      activateTab('Overview', false);
      var target = document.getElementById(hashId);
      if (target) {
        setTimeout(function () {
          var rect = target.getBoundingClientRect();
          window.scrollTo({ top: window.scrollY + rect.top - NAV_HEIGHT - 20, behavior: 'smooth' });
        }, 30);
      }
    } else {
      var targetEl = document.getElementById(hashId);
      if (targetEl) {
        var panel = targetEl.closest('[data-tab-panel]');
        if (panel && panel.dataset.tabPanel) {
          activateTab(panel.dataset.tabPanel, false);
          if (targetEl.classList.contains('ds-section')) {
            // Category section anchor e.g. #tag-conversion
            if (savedScroll && parseInt(savedScroll, 10) > 0) {
              window.scrollTo(0, parseInt(savedScroll, 10));
            } else {
              window.scrollTo(0, 0);
            }
          } else {
            // Specific endpoint card
            setTimeout(function () {
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 40);
          }
        }
      } else if (savedTab) {
        activateTab(savedTab, false);
        if (savedScroll && parseInt(savedScroll, 10) > 0) {
          window.scrollTo(0, parseInt(savedScroll, 10));
        }
      }
    }
  } else if (savedTab && savedTab.toLowerCase() !== 'overview') {
    // User was on a specific category tab before refreshing!
    activateTab(savedTab, false);
    if (savedScroll && parseInt(savedScroll, 10) > 0) {
      window.scrollTo(0, parseInt(savedScroll, 10));
    } else {
      window.scrollTo(0, 0);
    }
  } else {
    // Default initial state (Overview at top)
    if (savedTab && savedTab.toLowerCase() === 'overview' && savedScroll && parseInt(savedScroll, 10) > 0) {
      window.scrollTo(0, parseInt(savedScroll, 10));
    } else {
      window.scrollTo(0, 0);
    }
    nav.querySelectorAll('.ds-group').forEach(function (g) {
      g.style.opacity = '0.6';
    });
  }

  // Handle browser Back / Forward buttons
  window.addEventListener('popstate', function () {
    if (window.location.hash) {
      var hId = window.location.hash.slice(1);
      var el = document.getElementById(hId);
      if (el) {
        var p = el.closest('[data-tab-panel]');
        if (p && p.dataset.tabPanel) {
          activateTab(p.dataset.tabPanel, false);
          if (!el.classList.contains('ds-section')) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    } else {
      activateTab('Overview', true);
    }
  });

  // --- Search Filtering ---
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
        if (q) {
          g.style.opacity = '1';
        }
      });
      if (!q) {
        var activeBtn = tabBar ? tabBar.querySelector('.ds-tab.active') : null;
        var activeTag = activeBtn ? activeBtn.dataset.tab : 'Overview';
        var isOverview = activeTag.toLowerCase() === 'overview';
        nav.querySelectorAll('.ds-group').forEach(function (g) {
          var isMatch = (g.dataset.tag || '').toLowerCase() === activeTag.toLowerCase();
          g.style.opacity = isOverview ? '0.6' : (isMatch ? '1' : '0.42');
        });
      }
    });
  }

  // --- Scrollspy ---
  var topLinks = {};
  nav.querySelectorAll('.ds-top').forEach(function (a) {
    var h = a.getAttribute('href');
    if (h && h.charAt(0) === '#') topLinks[h.slice(1)] = a;
  });

  function updateOverviewScrollspy() {
    if (isProgrammaticScrolling) return;
    var overviewPanel = document.querySelector('.ds-overview-panel.ds-section--active');
    if (!overviewPanel) return;

    var secOverview = document.getElementById('overview');
    var secQuickstart = document.getElementById('quickstart');
    var secAuth = document.getElementById('auth');

    var currentSection = 'overview';
    var trigger = Math.min(320, window.innerHeight * 0.42);

    var atBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 90);
    if (atBottom) {
      currentSection = 'auth';
    } else if (secAuth && secAuth.getBoundingClientRect().top <= trigger) {
      currentSection = 'auth';
    } else if (secQuickstart && secQuickstart.getBoundingClientRect().top <= trigger) {
      currentSection = 'quickstart';
    } else {
      currentSection = 'overview';
    }

    ['overview', 'quickstart', 'auth'].forEach(function (secId) {
      var link = topLinks[secId];
      if (link) {
        link.classList.toggle('active', secId === currentSection);
      }
    });
  }

  function checkBottomEndpoint() {
    var atBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 60);
    if (!atBottom) return;

    var activePanel = document.querySelector('.ds-section--active[data-tab-panel]');
    if (!activePanel || (activePanel.dataset.tabPanel || '').toLowerCase() === 'overview') return;

    var endpoints = activePanel.querySelectorAll('.ep-detail');
    if (endpoints.length > 0) {
      var lastEp = endpoints[endpoints.length - 1];
      var lastLink = links[lastEp.id];
      if (lastLink && lastLink !== current) {
        if (current) current.classList.remove('active');
        lastLink.classList.add('active');
        current = lastLink;
        scrollActiveLinkIntoSidebarView(lastLink);
      }
    }
  }

  var overviewTicking = false;
  window.addEventListener('scroll', function () {
    if (!overviewTicking) {
      window.requestAnimationFrame(function () {
        updateOverviewScrollspy();
        checkBottomEndpoint();
        overviewTicking = false;
      });
      overviewTicking = true;
    }
  }, { passive: true });

  // Initial check
  updateOverviewScrollspy();

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var a = links[e.target.id];
        if (a && a !== current) {
          if (current) current.classList.remove('active');
          a.classList.add('active');
          current = a;
          scrollActiveLinkIntoSidebarView(a);
        }
      });
    }, { rootMargin: '0px 0px -75% 0px', threshold: 0 });
    document.querySelectorAll('.ep-detail').forEach(function (el) { io.observe(el); });
  }

  // --- Mobile Drawer ---
  if (toggle) {
    toggle.addEventListener('click', function () { sidebar.classList.toggle('open'); });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) sidebar.classList.remove('open');
    });
  }
})();
