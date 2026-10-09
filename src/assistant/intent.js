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

function hasPhrase(text, pattern) {
  return pattern.test(text);
}

function colorFrom(text) {
  const candidates = Object.keys(COLOR_TOKENS).join('|');
  const match = text.match(new RegExp('(?:\\b(?:color|colour|blue|red|green|purple|violet|pink|orange|yellow|teal|cyan|white|black|gray|grey|navy)\\b[^.]{0,32}?\\b)(' + candidates + ')\\b'));
  if (match) return COLOR_TOKENS[match[1]];
  const direct = text.match(new RegExp('\\b(' + candidates + ')\\b'));
  return direct ? COLOR_TOKENS[direct[1]] : null;
}

function operationsFor(text) {
  const operations = [];
  const add = (property, value) => {
    if (operations.some(item => item.css?.[property] !== undefined)) return;
    operations.push({ type: 'style', css: { [property]: value } });
  };

  const unsafeCssIntent = /\\b(?:url|expression)\\s*\\(|javascript\\s*:|<\\/?script\\b|\\beval\\s*\\(/i.test(text);
  if (unsafeCssIntent) return operations;

  const wantsBackground = /\\b(?:background|background[- ]color|backdrop)\\b/.test(text);
  const color = colorFrom(text);
  if (color && /\\b(?:color|colour|background|blue|red|green|purple|violet|pink|orange|yellow|teal|cyan|white|black|gray|grey|navy)\\b/.test(text)) {
    add(wantsBackground ? 'backgroundColor' : 'color', color);
  }

  if (hasPhrase(text, /\\b(?:bigger|larger|increase(?:d)?(?: the)? (?:font|text|size)|make (?:the )?(?:text|font) bigger|increase (?:the )?(?:text|font) size)\\b/)) {
    add('fontSize', '1.25rem');
  } else if (hasPhrase(text, /\\b(?:smaller|reduce(?:d)?(?: the)? (?:font|text|size)|make (?:the )?(?:text|font) smaller|decrease (?:the )?(?:text|font) size)\\b/)) {
    add('fontSize', '0.875rem');
  }

  if (hasPhrase(text, /\\b(?:centered|center(?: it)?|align(?: it)? center|text[- ]align center)\\b/)) add('textAlign', 'center');
  else if (hasPhrase(text, /\\b(?:align(?: it)? left|left[- ]aligned|text[- ]align left)\\b/)) add('textAlign', 'left');
  else if (hasPhrase(text, /\\b(?:align(?: it)? right|right[- ]aligned|text[- ]align right)\\b/)) add('textAlign', 'right');

  if (hasPhrase(text, /\\b(?:bold|heavier|make (?:it|this|the text) bold)\\b/)) add('fontWeight', '700');
  else if (hasPhrase(text, /\\b(?:normal weight|not bold|lighter font)\\b/)) add('fontWeight', '400');

  if (hasPhrase(text, /\\b(?:rounded|round the corners|rounded corners|more rounded)\\b/)) add('borderRadius', /\\b(?:pill|fully rounded|circle|circular)\\b/.test(text) ? '999px' : '12px');
  else if (hasPhrase(text, /\\b(?:square corners|remove rounded corners|not rounded)\\b/)) add('borderRadius', '0');

  return operations;
}

/**
 * Converts a narrow set of natural-language design requests into safe CSS edits.
 * This is deliberately a deterministic parser, not a general command executor.
 */
export function classifyAssistantRequest(request) {
  const original = String(request ?? '').replace(CONTROL_CHARS, ' ').trim().slice(0, 2000);
  const normalized = original.toLowerCase().replace(/[^a-z0-9#()., _-]+/g, ' ').replace(/\\s+/g, ' ').trim();
  const operations = normalized ? operationsFor(normalized) : [];
  return {
    intent: operations.length ? 'visual_style_edit' : 'none',
    matched: operations.length > 0,
    operations,
  };
}

export const VISUAL_EDIT_COLOR_TOKENS = COLOR_TOKENS;
