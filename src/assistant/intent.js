const COLORS = [
  { names: ['blue'], value: '#3b82f6' },
  { names: ['red'], value: '#ef4444' },
  { names: ['green'], value: '#22c55e' },
  { names: ['purple', 'violet'], value: '#8b5cf6' },
  { names: ['pink'], value: '#ec4899' },
  { names: ['orange'], value: '#f97316' },
  { names: ['yellow', 'gold'], value: '#eab308' },
  { names: ['teal', 'turquoise'], value: '#14b8a6' },
  { names: ['white'], value: '#ffffff' },
  { names: ['black'], value: '#111827' },
  { names: ['gray', 'grey'], value: '#6b7280' }
];

const SELECTORS = [
  { names: ['heading', 'headline', 'title'], selector: 'h1, h2, h3' },
  { names: ['button', 'buttons', 'cta'], selector: 'button, .primary-link, [role="button"]' },
  { names: ['card', 'cards'], selector: '.card, .content-card, .product-card' },
  { names: ['paragraph', 'body text', 'description'], selector: 'p' },
  { names: ['navigation', 'navbar', 'nav bar', 'menu'], selector: 'header, nav' },
  { names: ['background', 'page background'], selector: 'body' },
  { names: ['image', 'images', 'photo'], selector: 'img' }
];

const normalizePhrase = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const hasPhrase = (text, phrases) => {
  const haystack = ' ' + normalizePhrase(text) + ' ';
  return phrases.some(phrase => haystack.includes(' ' + normalizePhrase(phrase) + ' '));
};

function targetFor(text) {
  return SELECTORS.find(item => hasPhrase(text, item.names))?.selector || 'main';
}

function addOperation(operations, selector, css, reason) {
  operations.push({ selector, css, reason });
}

export function classifyAssistantRequest(request) {
  const text = String(request ?? '').trim().slice(0, 2000);
  const lower = text.toLowerCase();
  const selector = targetFor(lower);
  const operations = [];

  const hexColor = lower.match(/#[0-9a-f]{8}(?![a-z0-9])|#[0-9a-f]{6}(?![a-z0-9])|#[0-9a-f]{4}(?![a-z0-9])|#[0-9a-f]{3}(?![a-z0-9])/i)?.[0];
  const namedColor = COLORS.find(color => hasPhrase(lower, color.names));
  const selectedColor = hexColor ? hexColor.toLowerCase() : namedColor?.value;
  if (selectedColor) {
    const paintTarget = hasPhrase(lower, ['background', 'page background', 'background color', 'button', 'buttons', 'card', 'cards', 'cta']);
    const css = paintTarget ? { backgroundColor: selectedColor } : { color: selectedColor };
    addOperation(operations, selector, css, paintTarget ? 'Set background color' : 'Set text color');
  }

  if (hasPhrase(lower, ['bigger', 'larger', 'increase size', 'make it large', 'make it larger', 'increase font'])) {
    addOperation(operations, selector, { fontSize: 'clamp(1.25rem, 2.4vw, 2.25rem)' }, 'Increase text size');
  } else if (hasPhrase(lower, ['smaller', 'shrink', 'reduce size', 'decrease font'])) {
    addOperation(operations, selector, { fontSize: '0.9em' }, 'Reduce text size');
  }

  if (hasPhrase(lower, ['centered', 'center align', 'center it', 'align center'])) {
    addOperation(operations, selector, { textAlign: 'center' }, 'Center content');
  } else if (hasPhrase(lower, ['left aligned', 'align left'])) {
    addOperation(operations, selector, { textAlign: 'left' }, 'Left-align content');
  } else if (hasPhrase(lower, ['right aligned', 'align right'])) {
    addOperation(operations, selector, { textAlign: 'right' }, 'Right-align content');
  }

  if (hasPhrase(lower, ['bold', 'heavier', 'stronger font'])) {
    addOperation(operations, selector, { fontWeight: '700' }, 'Emphasize typography');
  } else if (hasPhrase(lower, ['lighter font', 'less bold'])) {
    addOperation(operations, selector, { fontWeight: '400' }, 'Lighten typography');
  }

  if (hasPhrase(lower, ['rounded', 'rounder', 'round corners', 'more rounded'])) {
    addOperation(operations, selector, { borderRadius: '16px' }, 'Round corners');
  } else if (hasPhrase(lower, ['square corners', 'less rounded', 'sharp corners'])) {
    addOperation(operations, selector, { borderRadius: '4px' }, 'Sharpen corners');
  }

  if (hasPhrase(lower, ['more spacing', 'increase spacing', 'roomier'])) {
    addOperation(operations, selector, { gap: '1.5rem', padding: '1.5rem' }, 'Increase spacing');
  }
  if (hasPhrase(lower, ['less spacing', 'reduce spacing', 'tighter'])) {
    addOperation(operations, selector, { gap: '0.5rem', padding: '0.75rem' }, 'Reduce spacing');
  }

  if (hasPhrase(lower, ['hide it', 'hide this', 'remove from view'])) {
    addOperation(operations, selector, { display: 'none' }, 'Hide selected content');
  } else if (hasPhrase(lower, ['show it', 'show this', 'make it visible'])) {
    addOperation(operations, selector, { display: 'revert' }, 'Show selected content');
  }

  return {
    intent: operations.length ? 'visual_edit' : 'unclassified',
    original: text,
    target: selector,
    operations
  };
}
