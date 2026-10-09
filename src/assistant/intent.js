const COLOR_TOKENS = Object.freeze({
  blue: '#3b82f6',
  navy: '#1e3a8a',
  red: '#ef4444',
  green: '#22c55e',
  purple: '#8b5cf6',
  violet: '#8b5cf6',
  pink: '#ec4899',
  orange: '#f97316',
  yellow: '#eab308',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  white: '#ffffff',
  black: '#111827',
  gray: '#6b7280',
  grey: '#6b7280',
});
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
const UNSAFE_CSS_INTENT = /\b(?:url|expression)\s*\(|javascript\s*:|<\/?script\b|\beval\s*\(/i;
const NAMED_COLOR_PATTERN = /\b(blue|navy|red|green|purple|violet|pink|orange|yellow|teal|cyan|white|black|gray|grey)\b/;

function colorFrom(text) {
  const hex = text.match(/#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/i);
  if (hex) return hex[0];
  const named = text.match(NAMED_COLOR_PATTERN);
  return named ? COLOR_TOKENS[named[1]] : null;
}

function operationsFor(text) {
  const operations = [];
  const add = (property, value) => {
    if (operations.some(item => item.css?.[property] !== undefined)) return;
    operations.push({ type: 'style', css: { [property]: value } });
  };
  // Do not reinterpret CSS injection payloads as harmless style instructions.
  if (UNSAFE_CSS_INTENT.test(text)) return operations;

  const wantsBackground = /\b(?:background|background[- ]color|backdrop)\b/.test(text);
  const color = colorFrom(text);
  if (color && /\b(?:color|colour|background|blue|navy|red|green|purple|violet|pink|orange|yellow|teal|cyan|white|black|gray|grey|#[0-9a-f]{3,8})\b/i.test(text)) {
    add(wantsBackground ? 'backgroundColor' : 'color', color);
  }

  if (/\b(?:bigger|larger|increase(?:d)?(?: the)? (?:font|text|size)|make (?:the )?(?:text|font) bigger|increase (?:the )?(?:text|font) size)\b/.test(text)) {
    add('fontSize', '1.25rem');
  } else if (/\b(?:smaller|reduce(?:d)?(?: the)? (?:font|text|size)|make (?:the )?(?:text|font) smaller|decrease (?:the )?(?:text|font) size)\b/.test(text)) {
    add('fontSize', '0.875rem');
  }

  if (/\b(?:centered|center(?: it)?|align(?: it)? center|text[- ]align center)\b/.test(text)) add('textAlign', 'center');
  else if (/\b(?:align(?: it)? left|left[- ]aligned|text[- ]align left)\b/.test(text)) add('textAlign', 'left');
  else if (/\b(?:align(?: it)? right|right[- ]aligned|text[- ]align right)\b/.test(text)) add('textAlign', 'right');

  if (/\b(?:bold|heavier|make (?:it|this|the text) bold)\b/.test(text)) add('fontWeight', '700');
  else if (/\b(?:normal weight|not bold|lighter font)\b/.test(text)) add('fontWeight', '400');

  if (/\b(?:rounded|round the corners|rounded corners|more rounded)\b/.test(text)) {
    add('borderRadius', /\b(?:pill|fully rounded|circle|circular)\b/.test(text) ? '999px' : '12px');
  } else if (/\b(?:square corners|remove rounded corners|not rounded)\b/.test(text)) {
    add('borderRadius', '0');
  }
  return operations;
}

/**
 * Convert a narrow, deterministic subset of natural-language design requests
 * into CSS edits. Unsupported requests are no-ops, never arbitrary execution.
 */
export function classifyAssistantRequest(request) {
  const original = String(request ?? '').replace(CONTROL_CHARS, ' ').trim().slice(0, 2000);
  const normalized = original.toLowerCase().replace(/\s+/g, ' ').trim();
  const operations = normalized ? operationsFor(normalized) : [];
  return { intent: operations.length ? 'visual_style_edit' : 'none', matched: operations.length > 0, operations };
}

export const VISUAL_EDIT_COLOR_TOKENS = COLOR_TOKENS;
