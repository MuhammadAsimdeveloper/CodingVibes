import { validateSceneDocument } from './scene-document.js';

const COLORS = new Map([
  ['white', '#ffffff'], ['black', '#000000'], ['blue', '#3b82f6'], ['red', '#ef4444'],
  ['green', '#22c55e'], ['purple', '#8b5cf6'], ['orange', '#f97316'], ['pink', '#ec4899'],
  ['yellow', '#eab308'], ['teal', '#14b8a6']
]);

/**
 * Convert a deliberately small set of transparent English instructions into typed scene operations.
 * Unknown or ambiguous requests are returned as unsupported; callers must not claim they were applied.
 */
export function parseSceneEditIntent(prompt, document) {
  const valid = validateSceneDocument(document);
  if (!valid.ok) return { ok: false, intent: 'invalid_scene', operations: [], errors: valid.errors };
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 500) {
    return { ok: false, intent: 'invalid_prompt', operations: [], errors: ['prompt must be a non-empty string of at most 500 characters'] };
  }

  const text = prompt.trim().toLowerCase();
  const operations = [];
  const target = resolveTarget(text, valid.value.nodes);
  if (!target) return { ok: false, intent: 'unsupported', operations, errors: ['Could not identify one unambiguous scene node. Select a node or name it in the request.'] };

  const colorMatch = text.match(/\b(?:make|set|change|turn)\b.*?\b(white|black|blue|red|green|purple|orange|pink|yellow|teal)\b/);
  if (colorMatch && ['box', 'sphere', 'plane', 'text', 'image', 'video', 'model', 'light'].includes(target.type)) {
    operations.push({ op: 'set', nodeId: target.id, field: 'color', value: COLORS.get(colorMatch[1]) });
  }
  if (/\b(hide|make invisible)\b/.test(text)) operations.push({ op: 'set', nodeId: target.id, field: 'visible', value: false });
  else if (/\b(show|make visible)\b/.test(text)) operations.push({ op: 'set', nodeId: target.id, field: 'visible', value: true });

  const move = text.match(/\bmove\b.*?\b(x|y|z)\s*(?:to|=|by)\s*(-?\d+(?:\.\d+)?)/);
  if (move) {
    const position = Array.isArray(target.position) ? [...target.position] : [0, 0, 0];
    const axis = { x: 0, y: 1, z: 2 }[move[1]];
    const value = Number(move[2]);
    if (!Number.isFinite(value) || Math.abs(value) > 10000) return { ok: false, intent: 'invalid_value', operations: [], errors: ['position is outside supported bounds'] };
    position[axis] = value;
    operations.push({ op: 'set', nodeId: target.id, field: 'position', value: position });
  }

  const rename = text.match(/\brename\b.*?\bto\s+["']?([a-z0-9 _-]{1,80})["']?$/i);
  if (rename) operations.push({ op: 'set', nodeId: target.id, field: 'name', value: rename[1].trim() });

  if (!operations.length) return { ok: false, intent: 'unsupported', operations: [], errors: ['This request is not supported yet. Try changing a named node color, visibility, position, or name.'] };
  return { ok: true, intent: 'scene_edit', target: { id: target.id, name: target.name ?? target.id }, operations, errors: [] };
}

function resolveTarget(text, nodes) {
  const quoted = text.match(/["']([^"']{1,80})["']/);
  if (quoted) {
    const name = quoted[1].toLowerCase();
    const matches = nodes.filter(node => node.name?.toLowerCase() === name || node.id.toLowerCase() === name);
    return matches.length === 1 ? matches[0] : null;
  }
  const named = nodes.filter(node => node.name && new RegExp(`\\b${escapeRegExp(node.name.toLowerCase())}\\b`).test(text));
  if (named.length === 1) return named[0];
  if (named.length > 1) return null;
  if (/\b(selected|this|it)\b/.test(text) && nodes.length === 1) return nodes[0];
  return nodes.length === 1 ? nodes[0] : null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
