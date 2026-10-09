import { applySceneOperation, validateSceneDocument } from './scene-document.js';
import { parseSceneEditIntent } from './prompt-operations.js';

/**
 * Create a side-effect-free preview. The snapshot binds confirmation to the exact scene
 * the user reviewed; callers must not persist or render this as an applied edit.
 */
export function previewSceneEdit(prompt, document) {
  const valid = validateSceneDocument(document);
  if (!valid.ok) return { ok: false, status: 'invalid_scene', errors: valid.errors };
  const parsed = parseSceneEditIntent(prompt, valid.value);
  if (!parsed.ok) return { ok: false, status: parsed.intent, errors: parsed.errors };

  let candidate = structuredClone(valid.value);
  const changes = [];
  const inverses = [];
  for (const operation of parsed.operations) {
    const result = applySceneOperation(candidate, operation);
    if (!result.ok) return { ok: false, status: 'rejected', errors: result.errors };
    candidate = result.document;
    changes.push(result.change);
    inverses.unshift(result.undo);
  }

  return {
    ok: true,
    status: 'preview',
    sceneId: valid.value.id,
    prompt: prompt.trim(),
    baseSnapshot: JSON.stringify(valid.value),
    operations: structuredClone(parsed.operations),
    changes,
    before: valid.value,
    after: candidate,
    undoOperations: inverses
  };
}

/**
 * Apply a previously previewed edit only if the scene is unchanged and the operations
 * still match the current parser output. Returns a new document; never mutates the input.
 */
export function commitSceneEditPreview(document, preview) {
  if (!preview || preview.ok !== true || preview.status !== 'preview' ||
      typeof preview.prompt !== 'string' || typeof preview.baseSnapshot !== 'string') {
    return { ok: false, status: 'invalid_preview', errors: ['a valid scene edit preview is required'] };
  }
  const valid = validateSceneDocument(document);
  if (!valid.ok) return { ok: false, status: 'invalid_scene', errors: valid.errors };
  if (valid.value.id !== preview.sceneId || JSON.stringify(valid.value) !== preview.baseSnapshot) {
    return { ok: false, status: 'stale_preview', errors: ['scene changed after preview; create a new preview before applying'] };
  }

  const currentParse = parseSceneEditIntent(preview.prompt, valid.value);
  if (!currentParse.ok || JSON.stringify(currentParse.operations) !== JSON.stringify(preview.operations)) {
    return { ok: false, status: 'invalid_preview', errors: ['preview operations do not match the current parsed intent'] };
  }

  let candidate = valid.value;
  const changes = [];
  const inverses = [];
  for (const operation of currentParse.operations) {
    const result = applySceneOperation(candidate, operation);
    if (!result.ok) return { ok: false, status: 'rejected', errors: result.errors };
    candidate = result.document;
    changes.push(result.change);
    inverses.unshift(result.undo);
  }
  return { ok: true, status: 'applied', document: candidate, changes, undoOperations: inverses };
}
