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
  '처방전(prescription)은 1~2문장, finale 본문(finaleSegments)은 6개 단락 구조를 유지해라.',
  '기기명이 있으면 자연스럽게 끼워 넣고 없으면 일반어로 풀어라.',
  'finaleSegments[0]은 h2 제목, 나머지는 p 문단이다. lines는 각 문단 1~3줄로 짧게 써라.',
].join(' ');

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    prescription: { type: 'string' },
    finaleSegments: {
      type: 'array',
      minItems: 6,
      maxItems: 6,
      items: {
        type: 'object',
        properties: {
          tag: { type: 'string', enum: ['h2', 'p'] },
          className: { type: 'string' },
          lines: {
            type: 'array',
            minItems: 1,
            maxItems: 3,
            items: { type: 'string' },
          },
        },
        required: ['tag', 'className', 'lines'],
      },
    },
  },
  required: ['prescription', 'finaleSegments'],
};

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

function parseEnhancement(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_err) {
    return null;
  }

  const prescription = trimText(parsed.prescription, 180);
  const finaleSegments = normalizeSegments(parsed.finaleSegments);
  if (!prescription || !finaleSegments) return null;

  return { prescription, finaleSegments };
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
      contents: JSON.stringify(payload),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        maxOutputTokens: 900,
        temperature: 0.85,
      },
    });

    const enhancement = parseEnhancement(aiResponse.text || '');
    if (!enhancement) {
      sendJson(response, { error: 'SCHEMA_MISMATCH' }, 502);
      return;
    }

    sendJson(response, enhancement);
  } catch (_err) {
    sendJson(response, { error: 'GEMINI_REQUEST_FAILED' }, 502);
  }
}
