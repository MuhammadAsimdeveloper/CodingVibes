const COLORS = Object.freeze({
  blue: '#3b82f6', green: '#22c55e', red: '#ef4444', orange: '#f97316',
  purple: '#8b5cf6', pink: '#ec4899', black: '#111827', white: '#ffffff',
  yellow: '#eab308', teal: '#14b8a6', gray: '#6b7280', grey: '#6b7280'
});

const RULES = [
  { pattern: /\b(background|background color|background colour)\s+(blue|green|red|orange|purple|pink|black|white|yellow|teal|gray|grey)\b/i, value: m => ({ backgroundColor: COLORS[m[2].toLowerCase()] }) },
  { pattern: /\b(blue|green|red|orange|purple|pink|black|white|yellow|teal|gray|grey)\b/i, value: m => ({ color: COLORS[m[1].toLowerCase()] }) },
  { pattern: /\b(bigger|larger|increase (?:the )?size|make (?:it|this) bigger)\b/i, value: () => ({ fontSize: '1.25em' }) },
  { pattern: /\b(smaller|reduce (?:the )?size|make (?:it|this) smaller)\b/i, value: () => ({ fontSize: '0.875em' }) },
  { pattern: /\b(centered|centred|center|centre|align(?:ed)? center)\b/i, value: () => ({ textAlign: 'center' }) },
  { pattern: /\b(left aligned|align(?:ed)? left)\b/i, value: () => ({ textAlign: 'left' }) },
  { pattern: /\b(right aligned|align(?:ed)? right)\b/i, value: () => ({ textAlign: 'right' }) },
  { pattern: /\bbold\b/i, value: () => ({ fontWeight: '700' }) },
  { pattern: /\b(thin|lighter font)\b/i, value: () => ({ fontWeight: '300' }) },
  { pattern: /\b(rounded|round the corners|rounder)\b/i, value: () => ({ borderRadius: '12px' }) },
  { pattern: /\b(square corners|not rounded)\b/i, value: () => ({ borderRadius: '0' }) },
  { pattern: /\b(add|more) padding\b/i, value: () => ({ padding: '1.25rem' }) },
  { pattern: /\b(less|reduce) padding\b/i, value: () => ({ padding: '0.5rem' }) },
  { pattern: /\b(add|more) shadow\b/i, value: () => ({ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' }) },
  { pattern: /\b(remove|no) shadow\b/i, value: () => ({ boxShadow: 'none' }) }
];

function operationFor(css, reason) {
  return Object.freeze({ type: 'set-style', target: 'selected', css: Object.freeze(css), reason });
}

/**
 * Convert natural-language design requests to allow-listed style operations.
 * This returns data only; it never evaluates code or chooses an arbitrary selector.
 */
export function classifyAssistantRequest(request) {
  const text = String(request ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 2000);
  const operations = [];
  const usedProperties = new Set();

  for (const rule of RULES) {
    const match = text.match(rule.pattern);
    if (!match) continue;
    for (const [property, value] of Object.entries(rule.value(match))) {
      if (usedProperties.has(property)) continue;
      usedProperties.add(property);
      operations.push(operationFor({ [property]: value }, match[0]));
    }
  }

  return Object.freeze({
    intent: operations.length ? 'visual_edit' : 'general',
    operations: Object.freeze(operations),
    requiresSelection: operations.length > 0,
    confidence: operations.length ? Math.min(0.98, 0.58 + operations.length * 0.08) : 0.25
  });
}
