import { SceneEditorSession } from './scene/scene-editor-session.js';
import { SCENE_SCHEMA_VERSION, validateSceneDocument } from './scene/scene-document.js';

const $ = (selector) => document.querySelector(selector);
const panel = $('#sceneEditor');
if (panel) {
  const starterScene = () => ({
    schemaVersion: SCENE_SCHEMA_VERSION,
    id: 'scene-studio-demo',
    name: 'Studio scene',
    nodes: [
      { id: 'root', type: 'group', name: 'Scene root', visible: true, position: [0, 0, 0] },
      { id: 'hero', type: 'box', name: 'Hero', parentId: 'root', visible: true, position: [0, 1, 0], color: '#8b7dff', scale: [1, 1, 1] },
      { id: 'accent', type: 'sphere', name: 'Accent orb', parentId: 'root', visible: true, position: [2, 1, 0], color: '#69d9ff', scale: [1, 1, 1] },
      { id: 'caption', type: 'text', name: 'Caption', parentId: 'root', visible: true, position: [0, 2.5, 0], text: 'Build Vibe', color: '#ffffff' }
    ]
  });
  let session = new SceneEditorSession(starterScene());
  let selectedId = 'hero';
  let importedDocument = false;

  const status = (message, kind = '') => {
    const node = $('#sceneEditorStatus');
    if (node) { node.textContent = message; node.dataset.kind = kind; }
  };
  const button = (label, handler, className = 'cv-secondary') => {
    const el = document.createElement('button');
    el.type = 'button'; el.className = className; el.textContent = label; el.addEventListener('click', handler);
    return el;
  };
  const field = (labelText, control) => {
    const wrap = document.createElement('label'); wrap.className = 'scene-field';
    const label = document.createElement('span'); label.textContent = labelText;
    wrap.append(label, control); return wrap;
  };
  const input = (value, type = 'text') => {
    const el = document.createElement('input'); el.type = type; el.value = value ?? ''; return el;
  };
  const selectedNode = () => session.document.nodes.find(node => node.id === selectedId) || null;

  function renderHierarchy() {
    const list = $('#sceneHierarchy');
    if (!list) return;
    list.replaceChildren();
    for (const node of session.document.nodes) {
      const row = button((node.visible === false ? '◌ ' : '● ') + (node.name || node.id) + ' · ' + node.type, () => {
        selectedId = node.id; renderInspector(); renderHierarchy();
      }, 'scene-node' + (node.id === selectedId ? ' active' : ''));
      row.setAttribute('aria-pressed', String(node.id === selectedId));
      list.append(row);
    }
    $('#sceneNodeCount').textContent = session.document.nodes.length + ' nodes';
  }

  function renderInspector() {
    const root = $('#sceneInspector');
    if (!root) return;
    root.replaceChildren();
    const node = selectedNode();
    if (!node) { root.textContent = 'Select a scene node to inspect its properties.'; return; }
    const name = input(node.name || node.id);
    name.maxLength = 240;
    name.addEventListener('change', () => applyDirect('name', name.value.trim(), 'Renamed node.'));
    root.append(field('Name', name));

    const visible = document.createElement('input'); visible.type = 'checkbox'; visible.checked = node.visible !== false;
    visible.addEventListener('change', () => applyDirect('visible', visible.checked, 'Updated visibility.'));
    root.append(field('Visible', visible));

    const color = input(node.color || '#ffffff', 'text'); color.maxLength = 7; color.placeholder = '#ffffff';
    color.addEventListener('change', () => {
      if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color.value)) { status('Use a valid hex color such as #8b7dff.', 'error'); return; }
      applyDirect('color', color.value, 'Updated node color.');
    });
    root.append(field('Color', color));

    for (const [label, axis, index] of [['X', 'position', 0], ['Y', 'position', 1], ['Z', 'position', 2]]) {
      const position = Array.isArray(node.position) ? node.position : [0, 0, 0];
      const control = input(String(position[index] ?? 0), 'number'); control.step = '0.1';
      control.addEventListener('change', () => {
        const value = Number(control.value);
        if (!Number.isFinite(value) || Math.abs(value) > 10000) { status('Position must be a finite value within ±10000.', 'error'); return; }
        const next = [...position]; next[index] = value;
        applyDirect(axis, next, 'Updated position.');
      });
      root.append(field('Position ' + label, control));
    }

    if (node.type === 'text') {
      const text = input(node.text || ''); text.maxLength = 240;
      text.addEventListener('change', () => applyDirect('text', text.value, 'Updated text.'));
      root.append(field('Text', text));
    }
    const hint = document.createElement('p'); hint.className = 'cv-muted'; hint.textContent = 'Edits are kept in this browser session until exported; renderer and project persistence are not connected yet.';
    root.append(hint);
  }

  function renderPreview() {
    const root = $('#sceneEditPreview');
    if (!root) return;
    root.replaceChildren();
    const pending = session.getState().pendingPreview;
    if (!pending) { root.textContent = 'No pending edit. Describe a change below to review it before applying.'; return; }
    const title = document.createElement('strong'); title.textContent = 'Proposed changes';
    const summary = document.createElement('p'); summary.textContent = pending.changes.map(change => {
      const node = pending.after.nodes.find(item => item.id === change.nodeId);
      return (node?.name || change.nodeId) + ': ' + change.field + ' · ' + JSON.stringify(change.before) + ' → ' + JSON.stringify(change.after);
    }).join(' | ');
    root.append(title, summary);
    root.append(button('Confirm edit', () => {
      const result = session.confirm();
      if (!result.ok) { status(result.errors?.join(' ') || result.status, 'error'); return; }
      status('Edit applied to the local scene session.', 'success'); renderAll();
    }, 'cv-primary'));
    root.append(button('Cancel preview', () => { session.cancel(); status('Preview cancelled; scene unchanged.'); renderAll(); }));
  }

  function renderAll() {
    renderHierarchy(); renderInspector(); renderPreview();
    const state = session.getState();
    $('#sceneUndo').disabled = !state.canUndo;
    $('#sceneRedo').disabled = !state.canRedo;
    $('#sceneEditorStatus').textContent = importedDocument
      ? 'Imported scene · local session only · export to preserve changes'
      : 'Starter scene · local session only · export to preserve changes';
  }

  function applyDirect(fieldName, value, message) {
    const node = selectedNode();
    if (!node) return;
    const position = ['X', 'Y', 'Z'].includes(fieldName);
    const field = position ? 'position' : fieldName;
    const nextValue = position ? value : value;
    const op = { op: 'set', nodeId: node.id, field, value: nextValue };
    // Direct inspector edits are translated to the same allowlisted scene contract via a one-operation preview path.
    try {
      const result = session.applyOperation(op);
      if (!result.ok) throw new Error(result.errors.join('; '));
      status(message, 'success');
      renderAll();
    } catch (error) { status(error.message, 'error'); renderInspector(); }
  }

  $('#sceneEditPrompt')?.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); $('#scenePreviewButton').click(); }
  });
  $('#scenePreviewButton')?.addEventListener('click', () => {
    const prompt = $('#sceneEditPrompt').value.trim();
    if (!prompt) { status('Describe a scene change first.', 'error'); return; }
    const result = session.preview(prompt);
    if (!result.ok) { status(result.errors?.join(' ') || result.status, 'error'); renderPreview(); return; }
    status('Preview ready. Confirm to apply or cancel to discard.', 'success'); renderPreview();
  });
  $('#sceneUndo')?.addEventListener('click', () => {
    const result = session.undo();
    if (!result.ok) status(result.errors?.join(' ') || result.status, 'error');
    else status('Undid the last prompt-based edit.');
    renderAll();
  });
  $('#sceneRedo')?.addEventListener('click', () => {
    const result = session.redo();
    if (!result.ok) status(result.errors?.join(' ') || result.status, 'error');
    else status('Redid the last prompt-based edit.');
    renderAll();
  });
  $('#sceneReset')?.addEventListener('click', () => {
    session = new SceneEditorSession(starterScene()); selectedId = 'hero'; importedDocument = false;
    status('Starter scene restored.'); renderAll();
  });
  $('#sceneExport')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(session.document, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = (session.document.name || 'scene').toLowerCase().replace(/[^a-z0-9_-]+/g, '-') + '.scene.json';
    anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
    status('Scene JSON exported. Store it with your project to preserve it.');
  });
  $('#sceneImportFile')?.addEventListener('change', async event => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('Scene file must be 1 MB or smaller.');
      const parsed = JSON.parse(await file.text());
      const checked = validateSceneDocument(parsed);
      if (!checked.ok) throw new Error(checked.errors.join('; '));
      session = new SceneEditorSession(checked.value); selectedId = checked.value.nodes[0]?.id || ''; importedDocument = true;
      status('Scene imported and validated.'); renderAll();
    } catch (error) { status('Import rejected: ' + error.message, 'error'); }
    finally { event.target.value = ''; }
  });
  renderAll();
}
