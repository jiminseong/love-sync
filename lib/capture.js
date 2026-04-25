const HTML2CANVAS_ESM = 'https://esm.sh/html2canvas@1.4.1';

let html2canvasPromise = null;

function loadHtml2Canvas() {
  if (!html2canvasPromise) {
    html2canvasPromise = import(HTML2CANVAS_ESM)
      .then((mod) => mod.default ?? mod)
      .catch((err) => {
        html2canvasPromise = null;
        throw err;
      });
  }
  return html2canvasPromise;
}

function readCssVar(name, fallback) {
  const root = document.documentElement;
  const v = getComputedStyle(root).getPropertyValue(name).trim();
  return v || fallback;
}

function triggerDownload(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function captureReportCard({
  selector = '#report-capture',
  filename = 'love-sync.png',
} = {}) {
  const target = document.querySelector(selector);
  if (!target) throw new Error(`capture target not found: ${selector}`);

  const html2canvas = await loadHtml2Canvas();
  const bg = readCssVar('--bg', '#0b0b0b');

  const canvas = await html2canvas(target, {
    backgroundColor: bg,
    scale: Math.min(window.devicePixelRatio || 1, 2),
    useCORS: true,
    logging: false,
  });

  const dataUrl = canvas.toDataURL('image/png');
  triggerDownload(dataUrl, filename);
  return dataUrl;
}
