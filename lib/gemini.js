const ENHANCE_TIMEOUT_MS = 2500;

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, timer };
}

async function postJSON(path, payload, timeoutMs) {
  const { controller, timer } = withTimeout(timeoutMs);
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (_err) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function isValidEnhancement(value) {
  return Boolean(
    value &&
    typeof value.prescription === 'string' &&
    value.prescription.trim() &&
    Array.isArray(value.finaleSegments) &&
    value.finaleSegments.length === 6
  );
}

export async function fetchEnhancement(payload) {
  const data = await postJSON('/api/enhance', payload, ENHANCE_TIMEOUT_MS);
  return isValidEnhancement(data) ? data : null;
}
