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
 * 본문 세그먼트를 deviceName에 맞춰 동적으로 만든다.
 * '{device}' 자리는 userAgent로 매핑한 이름(예: 아이폰, 맥북, 갤럭시)으로 치환된다.
 * deviceName이 없으면 자연스러운 fallback 문구로 대체된다.
 *
 * lines: 줄바꿈으로 분리된 라인 배열 (HTML 안전한 텍스트)
 * tag:   감싸는 태그 (h2 / p)
 * className: 추가 클래스
 */
function buildFinaleSegments(deviceName) {
  const hasDevice = Boolean(deviceName) && deviceName !== '네 기기';
  const deviceWord = hasDevice ? deviceName : null;

  // "차가운 X 액정" — 기기 이름이 있으면 끼워 넣고, 없으면 그냥 "차가운 액정"으로
  const coldLcdLine = deviceWord
    ? `차가운 ${deviceWord} 액정을 향해 정성스럽게 입술을 내밀고 소리를 냈습니다.`
    : '차가운 액정을 향해 정성스럽게 입술을 내밀고 소리를 냈습니다.';

  return [
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
        coldLcdLine,
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
        '방금 액정에 입맞춤하던 자신이 조금 부끄러우셨다면,',
        '그것보다 훨씬 덜 부끄럽고, 훨씬 따뜻한 일이 있습니다.',
        '곁에 있는 사람에게 온기를 한 조각 전해보는 일이요.',
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
}

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

function buildSegmentNodes(host, segments) {
  host.innerHTML = '';
  return segments.map((seg) => {
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

async function runTypewriter(host, segments) {
  const nodes = buildSegmentNodes(host, segments);
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

function revealPrivacyNote() {
  const note = document.querySelector('.privacy-note--finale');
  if (!note) return;
  // 다음 프레임에 클래스 토글 → CSS transition 발동
  requestAnimationFrame(() => {
    note.classList.add('is-visible');
  });
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

// 모듈 스코프에 BGM 핸들 보관 — 다시하기 등에서 정지 가능하도록.
let activeBgm = null;

/**
 * 피날레 시퀀스 진입.
 * 반드시 사용자 클릭 이벤트 핸들러 안에서 호출되어야 BGM 자동재생이 통과한다.
 *
 * @param {Object} opts
 * @param {string|null} opts.shameImageUrl  웹캠에서 캡처한 dataURL (없으면 배경 생략)
 * @param {string|null} opts.deviceName     userAgent로 매핑한 기기 이름 (예: 아이폰)
 * @param {() => void} [opts.onSwitchScreen] 페이드아웃 끝나고 화면 전환할 때 호출
 */
export async function runFinale({
  shameImageUrl = null,
  deviceName = null,
  onSwitchScreen,
} = {}) {
  // 0. 수치심 배경 미리 셋업 (애니메이션 시작 전 그릴 준비)
  applyShameBackground(shameImageUrl);

  // 1. BGM은 클릭 직후 즉시 시작 (autoplay 정책 통과)
  if (activeBgm) {
    try { activeBgm.pause(); } catch (_e) { /* ignore */ }
    activeBgm = null;
  }
  activeBgm = startBgm();

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

  const segments = buildFinaleSegments(deviceName);
  await runTypewriter(host, segments);

  // 5. 프라이버시 안내 슬쩍 페이드인 (공유 버튼보다 먼저)
  revealPrivacyNote();

  // 6. 공유 버튼 등장
  await revealShareButton();

  // 페이드 상태 정리 (배경은 그대로 유지)
  if (root) {
    delete root.dataset.finaleFading;
  }

  return { bgm: activeBgm };
}

/**
 * 피날레를 강제 종료한다 — BGM을 끄고, 배경 이미지를 비우고,
 * 프라이버시 노트/공유 버튼의 visibility 상태도 리셋한다.
 * "다시 하기" 버튼처럼 finale을 빠져나가는 흐름에서 호출.
 */
export function stopFinale() {
  if (activeBgm) {
    try {
      activeBgm.pause();
      activeBgm.currentTime = 0;
    } catch (_e) {
      // ignore
    }
    activeBgm = null;
  }

  const layer = document.querySelector('.finale-shame');
  if (layer) {
    layer.style.backgroundImage = '';
    layer.dataset.hasImage = 'false';
  }

  const note = document.querySelector('.privacy-note--finale');
  if (note) note.classList.remove('is-visible');

  const wrap = document.querySelector('#finale-actions');
  if (wrap) {
    wrap.classList.remove('is-visible');
    wrap.hidden = true;
  }

  const host = document.querySelector('#finale-text');
  if (host) host.innerHTML = '';

  const root = document.querySelector('main');
  if (root) delete root.dataset.finaleFading;
}
