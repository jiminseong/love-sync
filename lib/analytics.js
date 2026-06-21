// GA4(gtag.js) 이벤트 헬퍼. gtag()가 떠 있으면 그걸 우선 쓰고,
// 아직 안 떠 있으면(스니펫 미로드 / GTM 단독 환경) dataLayer 큐에 흘려 둔다.
// — 처음 도입 때 dataLayer.push({event, ...}) 형태만 썼다가 GA4가 커스텀
//   이벤트를 하나도 못 잡는 이슈가 있었다. gtag.js는 arguments 시그니처
//   (gtag('event', name, params))로 push해야 인식한다.
export function track(event, params = {}) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') {
    window.gtag('event', event, params);
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}
