/**
 * Build Vibe versioned, renderer-neutral scene document contract.
 * This module intentionally has no renderer dependency and never executes user-authored code.
 */
export const SCENE_SCHEMA_VERSION = 1;
export const SCENE_LIMITS = Object.freeze({ nodes: 250, idLength: 80, textLength: 240, assetUrlLength: 2048 });

const NODE_TYPES = new Set(['group', 'box', 'sphere', 'plane', 'text', 'image', 'video', 'model', 'light']);
const EDITABLE_FIELDS = Object.freeze({
  name: value => typeof value === 'string' && value.trim().length > 0 && value.length <= SCENE_LIMITS.textLength,
  visible: value => typeof value === 'boolean',
  position: vector3,
  rotation: vector3,
  scale: value => vector3(value) && value.every(n => Math.abs(n) <= 100 && Math.abs(n) >= 0.001),
  color: value => typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value),
  assetUrl: value => typeof value === 'string' && value.length <= SCENE_LIMITS.assetUrlLength && safeAssetUrl(value),
  text: value => typeof value === 'string' && value.length <= SCENE_LIMITS.textLength
});

function vector3(value) {
  return Array.isArray(value) && value.length === 3 && value.every(n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 10000);
}

function safeAssetUrl(value) {
  if (value.startsWith('blob:')) return true; // local-session preview URLs only; persistence layer must replace these.
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

/** Normalize only the supported document envelope; reject unknown fields instead of silently dropping intent. */
export function validateSceneDocument(input) {
  const errors = [];
  if (!plainObject(input)) return { ok: false, errors: ['document must be a plain object'] };
  const allowedRoot = new Set(['schemaVersion', 'id', 'name', 'nodes', 'metadata']);
  for (const key of Object.keys(input)) if (!allowedRoot.has(key)) errors.push(`unsupported root field: ${key}`);
  if (input.schemaVersion !== SCENE_SCHEMA_VERSION) errors.push(`schemaVersion must be ${SCENE_SCHEMA_VERSION}`);
  if (typeof input.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(input.id)) errors.push('id must be a short stable identifier');
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > SCENE_LIMITS.textLength) errors.push('name must be non-empty and bounded');
  if (!Array.isArray(input.nodes) || input.nodes.length > SCENE_LIMITS.nodes) errors.push(`nodes must be an array of at most ${SCENE_LIMITS.nodes}`);
  const nodes = Array.isArray(input.nodes) ? input.nodes : [];
  const ids = new Set();
  const parents = new Map();
  for (const [index, node] of nodes.entries()) {
    const at = `nodes[${index}]`;
    if (!plainObject(node)) { errors.push(`${at} must be an object`); continue; }
    const allowed = new Set(['id', 'type', 'name', 'parentId', 'visible', 'position', 'rotation', 'scale', 'color', 'assetUrl', 'text']);
    for (const key of Object.keys(node)) if (!allowed.has(key)) errors.push(`${at} has unsupported field ${key}`);
    if (typeof node.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(node.id)) errors.push(`${at}.id is invalid`);
    else if (ids.has(node.id)) errors.push(`duplicate node id: ${node.id}`);
    else ids.add(node.id);
    if (!NODE_TYPES.has(node.type)) errors.push(`${at}.type is unsupported`);
    for (const field of ['name', 'visible', 'position', 'rotation', 'scale', 'color', 'assetUrl', 'text']) {
      if (node[field] !== undefined && !EDITABLE_FIELDS[field](node[field])) errors.push(`${at}.${field} is invalid`);
    }
    if (node.parentId !== undefined && (typeof node.parentId !== 'string' || node.parentId === node.id)) errors.push(`${at}.parentId is invalid`);
    parents.set(node.id, node.parentId);
  }
  for (const [id, parentId] of parents) if (parentId && !ids.has(parentId)) errors.push(`node ${id} references missing parent ${parentId}`);
  for (const id of parents.keys()) {
    const visited = new Set([id]);
    let cursor = parents.get(id);
    while (cursor) {
      if (visited.has(cursor)) { errors.push(`parent cycle detected at node ${id}`); break; }
      visited.add(cursor);
      cursor = parents.get(cursor);
    }
  }
  if (input.metadata !== undefined && !plainObject(input.metadata)) errors.push('metadata must be a plain object');
  return errors.length ? { ok: false, errors } : { ok: true, value: structuredClone(input), errors: [] };
}

/**
 * Apply one explicit, allowlisted edit operation. No expressions, scripts, selectors, or arbitrary paths.
 * Operation: {op:'set', nodeId, field, value}
 */
export function applySceneOperation(document, operation) {
  const validated = validateSceneDocument(document);
  if (!validated.ok) return { ok: false, errors: validated.errors };
  if (!plainObject(operation) || !['set', 'unset'].includes(operation.op) || Object.keys(operation).some(key => !['op', 'nodeId', 'field', 'value'].includes(key)) || (operation.op === 'unset' && Object.hasOwn(operation, 'value'))) {
    return { ok: false, errors: ['operation must be a supported set operation'] };
  }
  if (typeof operation.nodeId !== 'string' || typeof operation.field !== 'string' || !Object.hasOwn(EDITABLE_FIELDS, operation.field)) {
    return { ok: false, errors: ['operation target field is not editable'] };
  }
  if (operation.op === 'set' && !EDITABLE_FIELDS[operation.field](operation.value)) return { ok: false, errors: [`invalid value for ${operation.field}`] };
  const index = validated.value.nodes.findIndex(node => node.id === operation.nodeId);
  if (index < 0) return { ok: false, errors: [`node not found: ${operation.nodeId}`] };
  const before = structuredClone(validated.value);
  if (operation.op === 'unset') delete validated.value.nodes[index][operation.field];
  else validated.value.nodes[index][operation.field] = structuredClone(operation.value);
  const afterValidation = validateSceneDocument(validated.value);
  if (!afterValidation.ok) return { ok: false, errors: afterValidation.errors };
  return {
    ok: true,
    document: afterValidation.value,
    change: { nodeId: operation.nodeId, field: operation.field, before: before.nodes[index][operation.field] ?? null, after: structuredClone(operation.value) },
    undo: Object.hasOwn(before.nodes[index], operation.field)
      ? { op: 'set', nodeId: operation.nodeId, field: operation.field, value: structuredClone(before.nodes[index][operation.field]) }
      : { op: 'unset', nodeId: operation.nodeId, field: operation.field }
  };
}

function defaultValue(field) {
  if (field === 'visible') return true;
  if (field === 'position' || field === 'rotation') return [0, 0, 0];
  if (field === 'scale') return [1, 1, 1];
  if (field === 'color') return '#ffffff';
  if (field === 'name' || field === 'text' || field === 'assetUrl') return '';
  return null;
}
