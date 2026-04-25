import { GoogleGenAI } from '@google/genai';

const PERSONALITIES = new Set(['sincere', 'performative', 'dependent', 'avoidant']);
const SEGMENT_CLASSES = [
  'finale-title',
  'finale-para',
  'finale-para',
  'finale-para',
  'finale-para',
  'finale-para finale-para--strong',
];

const SYSTEM_INSTRUCTION = [
  '뽀뽀뽀라는 풍자 웹 장난감의 결과 텍스트를 짧고 가볍게 한국어 반말로 써라.',
  "사용자는 화면에 뽀뽀했고, finale에서 '사람 대신 기기에 뽀뽀했다'는 풍자를 듣게 된다.",
  '처방전(prescription)은 절대 비우지 말고 1~2문장으로 써라.',
  'finaleLines는 정확히 6개 문자열로 써라. 첫 줄은 제목, 나머지 5줄은 본문이다.',
  '기기명이 있으면 자연스럽게 끼워 넣고 없으면 일반어로 풀어라.',
  '마크다운이나 코드펜스 없이 JSON만 반환해라.',
].join(' ');

function sendJson(response, data, status = 200) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(data));
}

async function readJsonBody(request) {
  if (request.body && typeof request.body === 'object' && !Buffer.isBuffer(request.body)) {
    return request.body;
  }

  if (typeof request.body === 'string' || Buffer.isBuffer(request.body)) {
    return JSON.parse(String(request.body));
  }

  let raw = '';
  for await (const chunk of request) {
    raw += chunk;
  }
  return JSON.parse(raw || '{}');
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function trimText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validatePayload(input) {
  if (!input || typeof input !== 'object') return null;

  const score = Math.round(Number(input.score));
  const distanceStability = Number(input.distanceStability);
  const audioPeakDb = Number(input.audioPeakDb);
  const personality = String(input.personality || '');

  if (!Number.isInteger(score) || score < 0 || score > 100) return null;
  if (!PERSONALITIES.has(personality)) return null;
  if (!isFiniteNumber(distanceStability) || distanceStability < 0 || distanceStability > 1) return null;
  if (!isFiniteNumber(audioPeakDb) || audioPeakDb < -120 || audioPeakDb > 20) return null;

  const deviceName = trimText(input.deviceName, 24);

  return {
    score,
    personality,
    distanceStability: Number(distanceStability.toFixed(3)),
    audioPeakDb: Number(audioPeakDb.toFixed(1)),
    deviceName: deviceName || null,
  };
}

function normalizeSegments(segments) {
  if (!Array.isArray(segments) || segments.length !== 6) return null;

  const normalized = segments.map((segment, index) => {
    if (!segment || typeof segment !== 'object') return null;
    const expectedTag = index === 0 ? 'h2' : 'p';
    if (segment.tag !== expectedTag) return null;
    if (!Array.isArray(segment.lines) || segment.lines.length < 1 || segment.lines.length > 3) return null;

    const lines = segment.lines
      .map((line) => trimText(line, 90))
      .filter(Boolean);

    if (!lines.length) return null;

    return {
      tag: expectedTag,
      className: SEGMENT_CLASSES[index],
      lines,
    };
  });

  return normalized.every(Boolean) ? normalized : null;
}

function splitTitleLine(line) {
  if (line.includes('액정에 ')) {
    return line.replace('액정에 ', '액정에\n').split('\n');
  }
  return [line];
}

function segmentsFromFinaleLines(lines) {
  if (!Array.isArray(lines) || lines.length !== 6) return null;

  const cleaned = lines.map((line) => trimText(line, 120)).filter(Boolean);
  if (cleaned.length !== 6) return null;

  return cleaned.map((line, index) => ({
    tag: index === 0 ? 'h2' : 'p',
    className: SEGMENT_CLASSES[index],
    lines: (index === 0 ? splitTitleLine(line) : line.split(/\n+/))
      .map((part) => trimText(part, 90))
      .filter(Boolean)
      .slice(0, 3),
  }));
}

function buildFallbackEnhancement(payload) {
  const deviceWord = payload.deviceName || null;
  const coldLcdLine = deviceWord
    ? `차가운 ${deviceWord} 액정을 향해 정성스럽게 입술을 내밀고 소리를 냈습니다.`
    : '차가운 액정을 향해 정성스럽게 입술을 내밀고 소리를 냈습니다.';

  return {
    prescription: `${payload.score}점이면 꽤 진심이야. 다만 오늘 제일 설렌 상대가 사람이 아니라 ${deviceWord ? `${deviceWord} 화면` : '기기 화면'}이었다는 건 잠깐 생각해보자.`,
    finaleSegments: [
      {
        tag: 'h2',
        className: SEGMENT_CLASSES[0],
        lines: ['차가운 유리 액정에', '진심으로 입맞춤하신 당신에게.'],
      },
      {
        tag: 'p',
        className: SEGMENT_CLASSES[1],
        lines: [
          "방금 당신은 'AI 애정도 분석'이라는 그럴싸한 포장에 속아,",
          coldLcdLine,
        ],
      },
      {
        tag: 'p',
        className: SEGMENT_CLASSES[2],
        lines: [
          '우리는 하루에도 수없이 기기를 만지고 확인합니다.',
          '그런데 곁에 있는 사람에게 온기를 전한 순간은 얼마나 있었나요?',
        ],
      },
      {
        tag: 'p',
        className: SEGMENT_CLASSES[3],
        lines: [
          '방금 액정에 입맞춤하던 자신이 조금 부끄러웠다면,',
          '그보다 훨씬 덜 부끄럽고 훨씬 따뜻한 일이 있습니다.',
        ],
      },
      {
        tag: 'p',
        className: SEGMENT_CLASSES[4],
        lines: [
          '오늘 하루, 스마트폰은 잠시 내려놓고',
          '곁에 있는 사람에게 마음을 한 조각 전해보세요.',
        ],
      },
      {
        tag: 'p',
        className: SEGMENT_CLASSES[5],
        lines: [
          '일단, 이 서비스를 만든 저부터',
          '오늘 집에 가서 부모님께 볼 뽀뽀를 하겠습니다.',
        ],
      },
    ],
  };
}

function parseJsonObject(text) {
  try {
    return JSON.parse(text);
  } catch (_err) {
    const match = String(text || '').match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch (_nestedErr) {
      return null;
    }
  }
}

function parseEnhancement(text, payload) {
  const fallback = buildFallbackEnhancement(payload);
  let parsed;
  parsed = parseJsonObject(text);
  if (!parsed) return fallback;

  const prescription = trimText(parsed.prescription, 180) || fallback.prescription;
  const finaleSegments =
    normalizeSegments(parsed.finaleSegments) ||
    segmentsFromFinaleLines(parsed.finaleLines) ||
    fallback.finaleSegments;

  return { prescription, finaleSegments };
}

function buildUserPrompt(payload) {
  return [
    `입력 JSON: ${JSON.stringify(payload)}`,
    '출력 JSON 형식:',
    '{"prescription":"1~2문장","finaleLines":["제목","본문1","본문2","본문3","본문4","본문5"]}',
    'finaleLines[0] 제목은 "차가운 유리 액정에 진심으로 입맞춤한 당신"의 느낌을 담아라.',
    "finaleLines[1]에는 사용자가 AI 분석이라는 포장에 속아 기기 액정에 뽀뽀했다는 사실을 넣어라.",
    'finaleLines 전체는 장난스럽지만 마지막에는 가족이나 곁의 사람에게 온기를 전하자는 방향으로 마무리해라.',
  ].join('\n');
}

export default async function handler(request, response) {
  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method !== 'POST') {
    sendJson(response, { error: 'METHOD_NOT_ALLOWED' }, 405);
    return;
  }

  if (!process.env.GOOGLE_API_KEY) {
    sendJson(response, { error: 'SERVER_NOT_CONFIGURED' }, 500);
    return;
  }

  let body;
  try {
    body = await readJsonBody(request);
  } catch (_err) {
    sendJson(response, { error: 'INVALID_JSON' }, 400);
    return;
  }

  const payload = validatePayload(body);
  if (!payload) {
    sendJson(response, { error: 'INVALID_PAYLOAD' }, 400);
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: buildUserPrompt(payload),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        maxOutputTokens: 900,
        temperature: 0.7,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    const enhancement = parseEnhancement(aiResponse.text || '', payload);
    sendJson(response, enhancement);
  } catch (_err) {
    sendJson(response, buildFallbackEnhancement(payload));
  }
}
