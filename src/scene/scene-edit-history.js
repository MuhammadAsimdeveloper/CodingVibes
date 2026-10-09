import { applySceneOperation, validateSceneDocument } from './scene-document.js';
import { commitSceneEditPreview } from './scene-edit-transaction.js';

export const SCENE_HISTORY_LIMIT = 50;

/**
 * In-memory scene edit history for a single editor session.
 * Persistence and cross-user concurrency belong to the project repository layer.
 */
export class SceneEditHistory {
  #document;
  #past = [];
  #future = [];
  #limit;

  constructor(document, { limit = SCENE_HISTORY_LIMIT } = {}) {
    const valid = validateSceneDocument(document);
    if (!valid.ok) throw new TypeError('Cannot create scene history from an invalid document: ' + valid.errors.join('; '));
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new RangeError('history limit must be an integer between 1 and 500');
    this.#document = valid.value;
    this.#limit = limit;
  }

  get document() {
    return structuredClone(this.#document);
  }

  getState() {
    return {
      document: this.document,
      canUndo: this.#past.length > 0,
      canRedo: this.#future.length > 0,
      undoCount: this.#past.length,
      redoCount: this.#future.length,
      limit: this.#limit
    };
  }

  commit(preview) {
    const result = commitSceneEditPreview(this.#document, preview);
    if (!result.ok) return result;
    const entry = {
      before: this.#document,
      after: result.document,
      undoOperations: structuredClone(result.undoOperations),
      redoOperations: structuredClone(preview.operations),
      changes: structuredClone(result.changes),
      prompt: preview.prompt
    };
    this.#past.push(entry);
    if (this.#past.length > this.#limit) this.#past.shift();
    this.#future = [];
    this.#document = result.document;
    return { ...result, history: this.getState() };
  }

  undo() {
    const entry = this.#past.at(-1);
    if (!entry) return { ok: false, status: 'nothing_to_undo', errors: ['there are no scene edits to undo'] };
    if (JSON.stringify(this.#document) !== JSON.stringify(entry.after)) {
      return { ok: false, status: 'history_conflict', errors: ['scene no longer matches the last edit; refusing unsafe undo'] };
    }
    let candidate = this.#document;
    for (const operation of entry.undoOperations) {
      const result = applySceneOperation(candidate, operation);
      if (!result.ok) return { ok: false, status: 'history_conflict', errors: result.errors };
      candidate = result.document;
    }
    this.#past.pop();
    this.#future.push(entry);
    this.#document = candidate;
    return { ok: true, status: 'undone', document: this.document, history: this.getState() };
  }

  redo() {
    const entry = this.#future.at(-1);
    if (!entry) return { ok: false, status: 'nothing_to_redo', errors: ['there are no scene edits to redo'] };
    if (JSON.stringify(this.#document) !== JSON.stringify(entry.before)) {
      return { ok: false, status: 'history_conflict', errors: ['scene no longer matches the expected state; refusing unsafe redo'] };
    }
    let candidate = this.#document;
    for (const operation of entry.redoOperations) {
      const result = applySceneOperation(candidate, operation);
      if (!result.ok) return { ok: false, status: 'history_conflict', errors: result.errors };
      candidate = result.document;
    }
    this.#future.pop();
    this.#past.push(entry);
    this.#document = candidate;
    return { ok: true, status: 'redone', document: this.document, history: this.getState() };
  }
}
