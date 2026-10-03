const DEFAULT_MODEL = process.env.CODINGVIBES_VIDEO_MODEL || 'gen4_turbo';
const DEFAULT_RATIO = process.env.CODINGVIBES_VIDEO_RATIO || '1280:720';
const DEFAULT_DURATION = Number(process.env.CODINGVIBES_VIDEO_DURATION || 5);
const ALLOWED_MODELS = new Set(String(process.env.CODINGVIBES_VIDEO_ALLOWED_MODELS || DEFAULT_MODEL).split(',').map(x => x.trim()).filter(Boolean));
const MAX_PROMPT = 4000;
const MAX_DURATION = 10;
const API = 'https://api.dev.runwayml.com/v1';

function headers() {
  const key = process.env.RUNWAYML_API_SECRET || process.env.RUNWAY_API_KEY;
  if (!key) throw new Error('Runway video is not configured. Set RUNWAYML_API_SECRET.');
  return {
    'content-type': 'application/json',
    authorization: `Bearer ${key}`,
    'X-Runway-Version': '2024-11-06',
  };
}

export function normalizeVideoRequest(body = {}) {
  const prompt = String(body.prompt || '').trim();
  if (!prompt) throw Object.assign(new Error('video_prompt_required'), { status: 400 });
  if (prompt.length > MAX_PROMPT) throw Object.assign(new Error('video_prompt_too_long'), { status: 413 });
  const duration = Number(body.duration || DEFAULT_DURATION);
  if (![5, 10].includes(duration) || duration > MAX_DURATION) throw Object.assign(new Error('video_duration_must_be_5_or_10'), { status: 400 });
  const ratio = ['1280:720', '720:1280', '960:960'].includes(String(body.ratio || DEFAULT_RATIO)) ? String(body.ratio || DEFAULT_RATIO) : DEFAULT_RATIO;
  const requestedModel = String(body.model || DEFAULT_MODEL).slice(0, 80);
  const model = ALLOWED_MODELS.has(requestedModel) ? requestedModel : DEFAULT_MODEL;
  return { prompt, duration, ratio, model };
}

export async function createVideoTask({ prompt, duration = DEFAULT_DURATION, ratio = DEFAULT_RATIO, model = DEFAULT_MODEL } = {}) {
  const input = { promptText: prompt, model, ratio, duration };
  const response = await fetch(`${API}/text_to_video`, { method: 'POST', headers: headers(), body: JSON.stringify(input) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error || data?.message || `Runway video request failed: HTTP ${response.status}`);
    error.status = response.status >= 500 ? 503 : 400;
    error.details = data;
    throw error;
  }
  const taskId = data.id || data.taskId;
  if (!taskId) throw new Error('Runway did not return a task id');
  return { taskId, raw: data };
}

export async function getVideoTask(taskId) {
  const response = await fetch(`${API}/tasks/${encodeURIComponent(taskId)}`, { headers: headers() });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data?.error || data?.message || `Runway task lookup failed: HTTP ${response.status}`), { status: response.status >= 500 ? 503 : 400, details: data });
  const status = String(data.status || '').toUpperCase();
  const url = data.output?.[0] || data.output?.video || null;
  return { taskId, status, url, raw: data, error: data.failure || data.error || null };
}

export async function downloadVideo(url, outputPath, { maxBytes = 180 * 1024 * 1024 } = {}) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Video download failed: HTTP ${response.status}`);
  const length = Number(response.headers.get('content-length') || 0);
  if (length && length > maxBytes) throw new Error('generated_video_too_large');
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > maxBytes) throw new Error('generated_video_too_large');
  const fs = await import('node:fs');
  const path = await import('node:path');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
  return { size: buffer.length };
}
