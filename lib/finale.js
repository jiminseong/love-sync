/* =============================================================
   뽀뽀뽀 · lib/finale.js
   "서비스 의도 확인하기" 클릭 후 등장하는 감동(?)적인 피날레.
   - 리포트 페이드아웃 → 베이지 배경 페이드인
   - BGM 자동 재생 (클릭 핸들러 안에서 호출되어야 autoplay 통과)
   - 캡처된 사용자 얼굴(흑백·블러·10% opacity)을 배경에 깔기
   - 본문 타자기 효과
   - 모든 텍스트 끝나면 1.5초 뒤 공유 버튼 페이드인
   ============================================================= */

const FINALE_BGM_PATH = 'ppoppoppo.mp3';
const FINALE_BGM_TARGET_VOLUME = 0.55;
const FINALE_BGM_FADEIN_MS = 4000;

const FADE_OUT_MS = 1500;
const TYPEWRITER_CHAR_MS = 65;       // 50~80ms 사이
const TYPEWRITER_PUNCT_PAUSE_MS = 180;
const PARAGRAPH_DELAY_MS = 1000;
const SHARE_BTN_DELAY_MS = 1500;

/**
 * 본문 세그먼트 정의.
 * lines: 줄바꿈으로 분리된 라인 배열 (HTML 안전한 텍스트)
 * tag:   감싸는 태그 (h2 / p)
 * className: 추가 클래스
 */
const FINALE_SEGMENTS = [
  {
    tag: 'h2',
    className: 'finale-title',
    lines: ['차가운 유리 액정에 진심으로 입맞춤하신 당신에게.'],
  },
  {
    tag: 'p',
    className: 'finale-para',
    lines: [
      "방금 당신은 'AI 애정도 분석'이라는 그럴싸한 포장에 속아,",
      '차가운 스마트폰 액정을 향해 정성스럽게 입술을 내밀고 소리를 냈습니다.',
    ],
  },
  {
    tag: 'p',
    className: 'finale-para',
    lines: [
      '우리는 하루 평균 2,600번 이상 스마트폰을 어루만집니다.',
      '하지만 마지막으로 부모님의 거칠어진 볼에',
      '온기가 담긴 뽀뽀를 해드린 적은 언제인가요?',
    ],
  },
  {
    tag: 'p',
    className: 'finale-para',
    lines: [
      "프로젝트 '뽀뽀뽀'는 기기를 위로하기 위한 기술이 아닙니다.",
      '곁에 있는 사람에게 온기를 전하는 법을 잊어가는',
      '우리들의 모습을 비춰보기 위한 짓궂은 거울입니다.',
    ],
  },
  {
    tag: 'p',
    className: 'finale-para',
    lines: [
      '오늘 하루, 스마트폰은 잠시 내려놓고',
      '부모님께 쑥스럽지만 따뜻한 뽀뽀 한 번 전해보세요.',
    ],
  },
  {
    tag: 'p',
    className: 'finale-para finale-para--strong',
    lines: [
      '일단, 이 서비스를 만든 저부터',
      '오늘 집에 가서 부모님께 볼 뽀뽀를 하겠습니다.',
    ],
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function applyShameBackground(shameImageUrl) {
  const layer = document.querySelector('.finale-shame');
  if (!layer) return;
  if (shameImageUrl) {
    layer.style.backgroundImage = `url("${shameImageUrl}")`;
    layer.dataset.hasImage = 'true';
  } else {
    layer.dataset.hasImage = 'false';
  }
}

function startBgm() {
  let audio;
  try {
    audio = new Audio(FINALE_BGM_PATH);
  } catch (_err) {
    return null;
  }
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0;

  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch((err) => {
      // autoplay 실패: 사용자가 사운드를 명시적으로 켜야 하는 환경
      console.warn('[finale] BGM autoplay blocked', err);
    });
  }

  // 볼륨 페이드인 (0 → target)
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / FINALE_BGM_FADEIN_MS);
    audio.volume = Math.min(FINALE_BGM_TARGET_VOLUME, t * FINALE_BGM_TARGET_VOLUME);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  return audio;
}

function buildSegmentNodes(host) {
  host.innerHTML = '';
  return FINALE_SEGMENTS.map((seg) => {
    const el = document.createElement(seg.tag);
    el.className = seg.className;
    el.dataset.typewriting = 'pending';
    host.appendChild(el);
    return { config: seg, el };
  });
}

function isPunctuation(ch) {
  return /[.!?,…—]/.test(ch);
}

async function typeLine(targetEl, text, charDelay) {
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    targetEl.appendChild(document.createTextNode(ch));
    const pause = isPunctuation(ch) ? charDelay + TYPEWRITER_PUNCT_PAUSE_MS : charDelay;
    await sleep(pause);
  }
}

async function typeSegment({ config, el }) {
  el.dataset.typewriting = 'active';
  for (let i = 0; i < config.lines.length; i++) {
    if (i > 0) {
      el.appendChild(document.createElement('br'));
    }
    await typeLine(el, config.lines[i], TYPEWRITER_CHAR_MS);
  }
  el.dataset.typewriting = 'done';
}

async function runTypewriter(host) {
  const nodes = buildSegmentNodes(host);
  for (let i = 0; i < nodes.length; i++) {
    if (i > 0) await sleep(PARAGRAPH_DELAY_MS);
    await typeSegment(nodes[i]);
  }
}

function bindShareButton(btn) {
  if (!btn || btn.dataset.bound === 'true') return;
  btn.dataset.bound = 'true';
  btn.addEventListener('click', async () => {
    const shareData = {
      title: '뽀뽀뽀 · 너의 사랑을 측정해줄게',
      text: "나만 당할 수 없지, 너도 한번 당해봐 ♥",
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch (_err) {
      // 공유 취소 또는 실패 → fallback
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareData.url);
        flashShareToast(btn, '링크 복사 완료 ♥');
        return;
      }
    } catch (_err) {
      // ignore
    }
    flashShareToast(btn, '공유를 지원하지 않는 환경이야');
  });
}

function flashShareToast(btn, message) {
  const original = btn.dataset.originalLabel || btn.textContent;
  btn.dataset.originalLabel = original;
  btn.textContent = message;
  setTimeout(() => {
    btn.textContent = original;
  }, 1800);
}

async function revealShareButton() {
  const wrap = document.querySelector('#finale-actions');
  const btn = document.querySelector('#share-btn');
  if (!wrap || !btn) return;
  bindShareButton(btn);
  await sleep(SHARE_BTN_DELAY_MS);
  wrap.hidden = false;
  requestAnimationFrame(() => {
    wrap.classList.add('is-visible');
  });
}

/**
 * 피날레 시퀀스 진입.
 * 반드시 사용자 클릭 이벤트 핸들러 안에서 호출되어야 BGM 자동재생이 통과한다.
 *
 * @param {Object} opts
 * @param {string|null} opts.shameImageUrl  웹캠에서 캡처한 dataURL (없으면 배경 생략)
 * @param {() => void} [opts.onSwitchScreen] 페이드아웃 끝나고 화면 전환할 때 호출
 */
export async function runFinale({ shameImageUrl = null, onSwitchScreen } = {}) {
  // 0. 수치심 배경 미리 셋업 (애니메이션 시작 전 그릴 준비)
  applyShameBackground(shameImageUrl);

  // 1. BGM은 클릭 직후 즉시 시작 (autoplay 정책 통과)
  const bgm = startBgm();

  // 2. 리포트 페이드아웃
  const root = document.querySelector('main');
  if (root) {
    root.dataset.finaleFading = 'out';
  }

  await sleep(FADE_OUT_MS);

  // 3. 화면 전환
  if (typeof onSwitchScreen === 'function') {
    onSwitchScreen();
  }
  if (root) {
    root.dataset.finaleFading = 'in';
  }

  // 4. 페이드인 살짝 기다린 뒤 타자기 시작
  await sleep(700);

  const host = document.querySelector('#finale-text');
  if (!host) return;

  await runTypewriter(host);

  // 5. 공유 버튼 등장
  await revealShareButton();

  // 페이드 상태 정리 (배경은 그대로 유지)
  if (root) {
    delete root.dataset.finaleFading;
  }

  return { bgm };
}
