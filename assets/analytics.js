/* ============================================================
   애착유형검사.com — GA4 공통 추적 (G-VHW289SRWM)
   모든 페이지 <head>에서 gtag.js 다음에 동기 로드한다.
   - track(name, params): 앱 코드에서 호출하는 이벤트 헬퍼 (GA 미로드 시 무시)
   - 자동 추적: 콘텐츠 그룹, 스크롤 깊이, 체류 시간, 섹션 노출, 링크·CTA 클릭
   개인정보: 사용자가 입력한 이름 등 개인 식별 정보는 절대 전송하지 않는다.
   ============================================================ */
(function () {
  var GA_ID = 'G-VHW289SRWM';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  var path = location.pathname;
  function pageType(p) {
    if (p === '/' || p === '/index.html') return 'test';
    if (p === '/types/' || p === '/types/index.html') return 'type_hub';
    if (p.indexOf('/types/') === 0) return 'type_detail';
    if (p.indexOf('/guide/') === 0) return 'guide';
    if (p.indexOf('/privacy') === 0) return 'privacy';
    return 'other';
  }
  var PAGE_TYPE = pageType(path);
  var PAGE_SLUG = (path.split('/').pop() || '').replace('.html', '') || (PAGE_TYPE === 'type_hub' ? 'hub' : 'home');

  gtag('js', new Date());
  gtag('config', GA_ID, { content_group: PAGE_TYPE, page_type: PAGE_TYPE, page_slug: PAGE_SLUG });

  var pageStart = Date.now();
  window.track = function (name, params) {
    try {
      var p = params || {};
      p.page_type = PAGE_TYPE;
      p.page_slug = PAGE_SLUG;
      p.ms_since_page_load = Date.now() - pageStart;
      gtag('event', name, p);
    } catch (e) {}
  };
  // 이탈 시점처럼 페이지가 닫히는 순간에도 전송되도록 beacon 사용
  window.trackBeacon = function (name, params) {
    var p = params || {};
    p.transport_type = 'beacon';
    window.track(name, p);
  };

  function textOf(el) { return ((el && (el.innerText || el.textContent)) || '').replace(/\s+/g, ' ').trim().slice(0, 80); }

  // ── 스크롤 깊이 (10% 단위) ────────────────────────────────
  var scrollMarks = [10, 25, 50, 75, 90, 100], scrollSent = {};
  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    var pct = Math.round((window.scrollY / max) * 100);
    scrollMarks.forEach(function (m) {
      if (pct >= m && !scrollSent[m]) { scrollSent[m] = 1; window.track('scroll_depth', { percent: m }); }
    });
  }
  // 퀴즈 화면 전환 시 다시 측정할 수 있도록 초기화 함수 노출
  window.resetScrollDepth = function () { scrollSent = {}; };
  window.addEventListener('scroll', function () { clearTimeout(onScroll._t); onScroll._t = setTimeout(onScroll, 200); }, { passive: true });

  // ── 실제로 보고 있는 시간 (탭이 보일 때만 누적) ───────────
  var visibleMs = 0, lastVisible = document.visibilityState === 'visible' ? Date.now() : null;
  var timeMarks = [10, 30, 60, 120, 180, 300, 600], timeSent = {};
  function tick() {
    var now = Date.now();
    var total = visibleMs + (lastVisible ? now - lastVisible : 0);
    timeMarks.forEach(function (s) {
      if (total >= s * 1000 && !timeSent[s]) { timeSent[s] = 1; window.track('time_on_page', { seconds: s }); }
    });
  }
  setInterval(tick, 2000);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      if (lastVisible) { visibleMs += Date.now() - lastVisible; lastVisible = null; }
      window.trackBeacon('page_hidden', { visible_seconds: Math.round(visibleMs / 1000) });
    } else {
      lastVisible = Date.now();
      window.track('page_visible_again', { visible_seconds: Math.round(visibleMs / 1000) });
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    // ── 섹션(h2) 노출 — 어디까지 읽었는지 ──────────────────
    if ('IntersectionObserver' in window) {
      var seen = {};
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var name = en.target.getAttribute('data-track-section') || textOf(en.target);
          if (seen[name]) return;
          seen[name] = 1;
          window.track('section_view', { section_name: name, section_index: +en.target.getAttribute('data-section-index') });
          io.unobserve(en.target);
        });
      }, { threshold: 0.6 });
      // 테스트 페이지는 앱 화면 안의 h2는 제외하고 SEO 섹션만
      var heads = document.querySelectorAll(PAGE_TYPE === 'test' ? '.seo-content h2' : 'h2');
      heads.forEach(function (h, i) { h.setAttribute('data-section-index', i + 1); io.observe(h); });
      // FAQ 항목 각각
      document.querySelectorAll('.faq-item .faq-q').forEach(function (q, i) {
        q.setAttribute('data-track-section', 'FAQ: ' + textOf(q));
        q.setAttribute('data-section-index', 100 + i);
        io.observe(q);
      });
      // 페이지 끝(푸터) 도달
      var footer = document.querySelector('.site-footer');
      if (footer && PAGE_TYPE !== 'test') { footer.setAttribute('data-track-section', '(page end)'); io.observe(footer); }
    }

    // ── 모든 링크 클릭 (위임) ─────────────────────────────
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      var url;
      try { url = new URL(href, location.href); } catch (err) { return; }
      var internal = url.host === location.host;
      var area =
        a.closest('.cta-wrap') ? 'floating_cta' :
        a.closest('.breadcrumb') ? 'breadcrumb' :
        a.closest('.other-types-grid') ? 'other_types' :
        a.closest('.link-row') ? 'link_row' :
        a.closest('.type-card') ? 'type_card' :
        a.closest('.site-footer') ? 'footer' :
        a.closest('.faq-item') ? 'faq' :
        a.closest('#s-result') ? 'result' :
        a.closest('.seo-content') ? 'seo_content' : 'body';
      var h2 = null, node = a;
      // 링크가 속한 섹션 제목 찾기
      while (node && node !== document.body) {
        var prev = node.previousElementSibling;
        while (prev) { if (prev.tagName === 'H2') { h2 = prev; break; } prev = prev.previousElementSibling; }
        if (h2) break;
        node = node.parentElement;
      }
      var params = {
        link_url: internal ? url.pathname + url.hash : url.href,
        link_text: textOf(a),
        link_area: area,
        section_name: h2 ? textOf(h2) : '(none)',
        is_internal: internal ? 'yes' : 'no'
      };
      if (internal && (url.pathname === '/' || url.pathname === '/index.html')) {
        window.trackBeacon('cta_to_test_click', params);
      } else if (internal) {
        window.trackBeacon('internal_link_click', params);
      }
      // 외부 링크는 GA 향상된 측정(outbound click)이 처리
    }, true);
  });
})();
