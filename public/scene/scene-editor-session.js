import { SceneEditHistory } from './scene-edit-history.js';
import { previewSceneEdit } from './scene-edit-transaction.js';

/**
 * UI-facing session facade for the safe scene-edit pipeline.
 * It deliberately owns no renderer, storage, network, or DOM side effects.
 */
export class SceneEditorSession {
  #history;
  #pending = null;
  #revision = 0;

  constructor(document, options = {}) {
    this.#history = new SceneEditHistory(document, options);
  }

  getState() {
    const history = this.#history.getState();
    return {
      ...history,
      revision: this.#revision,
      pendingPreview: this.#pending ? structuredClone(this.#pending) : null,
      canConfirm: Boolean(this.#pending?.ok && this.#pending.status === 'preview')
    };
  }

  preview(prompt) {
    const result = previewSceneEdit(prompt, this.#history.document);
    this.#pending = result.ok ? structuredClone(result) : null;
    return { ...result, session: this.getState() };
  }

  confirm() {
    if (!this.#pending) {
      return { ok: false, status: 'no_pending_preview', errors: ['create a valid preview before confirming an edit'] };
    }
    const result = this.#history.commit(this.#pending);
    this.#pending = null;
    if (result.ok) this.#revision += 1;
    return { ...result, session: this.getState() };
  }

  cancel() {
    const hadPreview = Boolean(this.#pending);
    this.#pending = null;
    return { ok: true, status: hadPreview ? 'preview_cancelled' : 'no_pending_preview', session: this.getState() };
  }

  applyOperation(operation) {
    this.#pending = null;
    const result = this.#history.applyOperation(operation);
    if (result.ok) this.#revision += 1;
    return { ...result, session: this.getState() };
  }

  undo() {
    this.#pending = null;
    const result = this.#history.undo();
    if (result.ok) this.#revision += 1;
    return { ...result, session: this.getState() };
  }

  redo() {
    this.#pending = null;
    const result = this.#history.redo();
    if (result.ok) this.#revision += 1;
    return { ...result, session: this.getState() };
  }

  get document() {
    return this.#history.document;
  }
}
