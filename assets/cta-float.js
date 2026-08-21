/* ============================================================
   애착유형검사.com — CTA 플로팅→도킹 스크립트
   .cta-wrap 안의 .cta-anchor(원래 위치 표시용, 높이 0)와
   .cta-float(실제 버튼)를 찾아서, 스크롤이 원래 위치에 도달하면
   버튼을 fixed(하단 고정)에서 static(제자리)으로 전환한다.
   /types/*.html, /guide/*.html 전체가 이 파일 하나를 공유한다.
   ============================================================ */
function updateCtaDock() {
  document.querySelectorAll('.cta-wrap').forEach(function (wrap) {
    var anchor = wrap.querySelector('.cta-anchor');
    var btn = wrap.querySelector('.cta-float');
    if (!anchor || !btn) return;
    var rect = anchor.getBoundingClientRect();
    var gap = window.innerHeight - rect.bottom;
    btn.classList.toggle('docked', gap >= 40);
  });
}
window.addEventListener('scroll', updateCtaDock);
window.addEventListener('resize', updateCtaDock);
window.addEventListener('DOMContentLoaded', updateCtaDock);
