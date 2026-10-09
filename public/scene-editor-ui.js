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
  let previewRenderer = null;
  let previewRendererLoading = false;
  let sceneProjectId = null;
  let sceneSavedRevision = 0;
  let sceneDirty = false;
  let sceneAssetsByPath = new Map();

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

  async function loadProjectAssets(projectId) {
    const response = await fetch('/api/projects/' + encodeURIComponent(projectId) + '/assets', { headers: { accept: 'application/json' } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Could not load project assets (HTTP ' + response.status + ').');
    const next = new Map();
    for (const asset of payload.assets || []) {
      const publicPath = asset.public_path || asset.publicPath;
      if (typeof publicPath === 'string' && /^\/assets\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,240}$/.test(publicPath) && !publicPath.includes('..')) {
        next.set(publicPath, { id: asset.id, name: asset.name, mime: asset.mime, kind: asset.kind, publicPath });
      }
    }
    sceneAssetsByPath = next;
  }

  async function uploadAssetForNode(file, node) {
    if (!sceneProjectId) throw new Error('Select a project and load its scene before uploading media.');
    if (!file || !node || !['image', 'video', 'model'].includes(node.type)) return;
    const maxBytes = 100 * 1024 * 1024;
    if (!file.size || file.size > maxBytes) throw new Error('Choose a non-empty media file smaller than 100 MB.');
    const nodeId = node.id, projectId = sceneProjectId, fileName = encodeURIComponent(file.name);
    const role = node.type === 'image' ? 'texture' : node.type === 'video' ? 'scene-video' : 'scene-model';
    const fallbackMime = ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif', svg: 'image/svg+xml', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', glb: 'model/gltf-binary', gltf: 'model/gltf+json', obj: 'model/obj', fbx: 'application/octet-stream' })[file.name.split('.').pop().toLowerCase()] || 'application/octet-stream';
    const response = await fetch('/api/projects/' + encodeURIComponent(projectId) + '/assets', {
      method: 'POST',
      headers: { 'content-type': file.type || fallbackMime, 'x-asset-name': fileName, 'x-asset-role': role, 'x-asset-meta': JSON.stringify({ source: 'scene-editor', nodeId }) },
      body: file
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.asset?.publicPath) throw new Error(payload.error || 'Media upload failed (HTTP ' + response.status + ').');
    const asset = payload.asset;
    sceneAssetsByPath.set(asset.publicPath, { id: asset.id, name: asset.name, mime: asset.mime, kind: asset.kind, publicPath: asset.publicPath });
    const result = session.applyOperation({ op: 'set', nodeId, field: 'assetUrl', value: asset.publicPath });
    if (!result.ok) throw new Error('Uploaded media but could not attach it to the selected scene node: ' + (result.errors || []).join('; '));
    sceneDirty = true;
    status('Uploaded ' + file.name + ' and attached it to ' + (node.name || node.id) + '. Save the scene to persist the asset reference.', 'success');
    renderAll();
  }

  function renderHierarchy() {
    const list = $('#sceneHierarchy');
    if (!list) return;
    list.replaceChildren();
    const controls = document.createElement('div'); controls.className = 'scene-node-actions';
    const typeSelect = document.createElement('select'); typeSelect.setAttribute('aria-label', 'New scene node type');
    for (const type of ['group', 'box', 'sphere', 'plane', 'text', 'image', 'video', 'model', 'light']) {
      const option = document.createElement('option'); option.value = type; option.textContent = type[0].toUpperCase() + type.slice(1); typeSelect.append(option);
    }
    const add = button('Add node', () => {
      const type = typeSelect.value;
      const token = globalThis.crypto?.randomUUID?.().replaceAll('-', '').slice(0, 12) || String(Date.now());
      const selected = selectedNode();
      const parentId = selected?.type === 'group' ? selected.id : selected?.parentId;
      const node = { id: type + '-' + token, type, name: type[0].toUpperCase() + type.slice(1) + ' node', visible: true, position: [0, 1, 0], scale: [1, 1, 1], color: '#ffffff' };
      if (parentId) node.parentId = parentId;
      if (type === 'text') node.text = 'Edit this text';
      const result = session.applyOperation({ op: 'addNode', node });
      if (!result.ok) { status((result.errors || []).join('; ') || 'Could not add node.', 'error'); return; }
      selectedId = node.id; sceneDirty = true; status('Added ' + node.name + '. Save the scene to keep it.', 'success'); renderAll();
    });
    const remove = button('Remove selected', () => {
      const node = selectedNode(); if (!node) { status('Select a scene node first.', 'error'); return; }
      const result = session.applyOperation({ op: 'removeNode', nodeId: node.id });
      if (!result.ok) { status((result.errors || []).join('; ') || 'Could not remove node.', 'error'); return; }
      selectedId = session.document.nodes.find(item => item.id !== node.id)?.id || '';
      sceneDirty = true; status('Removed ' + (node.name || node.id) + '. Undo remains available until the scene is reloaded.', 'success'); renderAll();
    });
    controls.append(typeSelect, add, remove); list.append(controls);
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
    if (['image', 'video', 'model'].includes(node.type)) {
      const upload = document.createElement('input'); upload.type = 'file'; upload.accept = node.type === 'image'
        ? '.png,.jpg,.jpeg,.webp,.gif,.avif,.svg,image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml'
        : node.type === 'video' ? '.mp4,.webm,.mov,video/mp4,video/webm,video/quicktime'
          : '.glb,.gltf,.obj,.fbx,model/gltf-binary,model/gltf+json';
      upload.addEventListener('change', async () => {
        const file = upload.files?.[0]; if (!file) return;
        upload.disabled = true;
        try { await uploadAssetForNode(file, node); }
        catch (error) { status('Media upload failed: ' + error.message, 'error'); }
        finally { upload.disabled = false; upload.value = ''; }
      });
      root.append(field('Upload ' + node.type + ' asset', upload));
      const assetState = document.createElement('p'); assetState.className = 'cv-muted';
      const stored = node.assetUrl && sceneAssetsByPath.get(node.assetUrl);
      assetState.textContent = stored ? 'Attached: ' + stored.name : node.assetUrl ? 'Attached URL: ' + node.assetUrl : 'No media attached yet.';
      root.append(assetState);
      if (node.assetUrl) {
        const clear = button('Remove media reference', () => applyDirect('assetUrl', '', 'Removed media reference.'));
        root.append(clear);
      }
    }
    const hint = document.createElement('p'); hint.className = 'cv-muted'; hint.textContent = 'Edits update the live preview. Save to the active project to persist changes; export JSON for a portable backup.';
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
      sceneDirty = true;
      status('Edit applied to the local scene session.', 'success'); renderAll();
    }, 'cv-primary'));
    root.append(button('Cancel preview', () => { session.cancel(); status('Preview cancelled; scene unchanged.'); renderAll(); }));
  }

  function renderAll() {
    renderHierarchy(); renderInspector(); renderPreview();
    if (previewRenderer) {
      try {
        const previewDocument = structuredClone(session.document);
        for (const node of previewDocument.nodes) {
          if (typeof node.assetUrl !== 'string' || !node.assetUrl.startsWith('/assets/')) continue;
          const asset = sceneAssetsByPath.get(node.assetUrl);
          if (asset && sceneProjectId) node.assetUrl = '/api/projects/' + encodeURIComponent(sceneProjectId) + '/assets/' + encodeURIComponent(asset.id) + '/preview';
        }
        previewRenderer.render(previewDocument);
      }
      catch (error) { const message = $('#scenePreviewStatus'); if (message) message.textContent = 'Preview update failed: ' + error.message; }
    }
    const state = session.getState();
    $('#sceneUndo').disabled = !state.canUndo;
    $('#sceneRedo').disabled = !state.canRedo;
    const statusNode = $('#sceneEditorStatus');
    if (statusNode && statusNode.dataset.kind !== 'error') statusNode.textContent = sceneProjectId
      ? (sceneDirty ? 'Unsaved project scene changes · revision ' + sceneSavedRevision : 'Project scene · revision ' + sceneSavedRevision)
      : (importedDocument ? 'Imported scene · local session only · export to preserve changes' : 'Starter scene · local session only · export to preserve changes');
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
      sceneDirty = true;
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
    else { sceneDirty = true; status('Undid the last scene edit.'); }
    renderAll();
  });
  $('#sceneRedo')?.addEventListener('click', () => {
    const result = session.redo();
    if (!result.ok) status(result.errors?.join(' ') || result.status, 'error');
    else { sceneDirty = true; status('Redid the last scene edit.'); }
    renderAll();
  });
  $('#sceneReset')?.addEventListener('click', () => {
    session = new SceneEditorSession(starterScene()); selectedId = 'hero'; importedDocument = false; sceneDirty = true;
    status('Starter scene restored. Save to project to preserve it.'); renderAll();
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
      session = new SceneEditorSession(checked.value); selectedId = checked.value.nodes[0]?.id || ''; importedDocument = true; sceneDirty = true;
      status('Scene imported and validated. Save to project to preserve it.'); renderAll();
    } catch (error) { status('Import rejected: ' + error.message, 'error'); }
    finally { event.target.value = ''; }
  });
  async function loadProjectScene(projectId) {
    if (!projectId) return;
    if (sceneDirty && !window.confirm('Discard unsaved scene edits before switching projects?')) {
      status('Project switch kept the current scene open. Save it before switching.', 'error');
      return;
    }
    try {
      const response = await fetch('/api/projects/' + encodeURIComponent(projectId) + '/scene', { headers: { accept: 'application/json' } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'HTTP ' + response.status);
      sceneProjectId = projectId;
      sceneSavedRevision = Number(payload.revision || 0);
      let assetWarning = '';
      try { await loadProjectAssets(projectId); } catch (assetError) { assetWarning = ' Asset previews could not be refreshed: ' + assetError.message; sceneAssetsByPath = new Map(); }
      if (payload.scene) {
        const checked = validateSceneDocument(payload.scene);
        if (!checked.ok) throw new Error('Saved scene failed validation: ' + checked.errors.join('; '));
        session = new SceneEditorSession(checked.value);
        selectedId = checked.value.nodes[0]?.id || '';
        importedDocument = true;
      } else {
        session = new SceneEditorSession(starterScene());
        selectedId = 'hero';
        importedDocument = false;
      }
      sceneDirty = false;
      status((payload.scene ? 'Loaded saved scene revision ' + sceneSavedRevision + '.' : 'No saved scene yet. Save this scene to create project revision 1.') + assetWarning, assetWarning ? 'error' : 'success');
      renderAll();
    } catch (error) {
      status('Could not load project scene: ' + error.message, 'error');
    }
  }

  async function saveProjectScene() {
    if (!sceneProjectId) {
      status('Select a project in Build Vibe before saving the scene.', 'error');
      return;
    }
    const saveButton = $('#sceneSaveProject');
    if (saveButton) saveButton.disabled = true;
    try {
      const response = await fetch('/api/projects/' + encodeURIComponent(sceneProjectId) + '/scene', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ scene: session.document, expectedRevision: sceneSavedRevision })
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 409) {
        status('Save conflict: project scene is now revision ' + Number(payload.currentRevision || 0) + '. Reload the project scene before retrying.', 'error');
        return;
      }
      if (!response.ok) throw new Error(payload.error || 'HTTP ' + response.status);
      sceneSavedRevision = Number(payload.revision);
      sceneDirty = false;
      status('Saved project scene revision ' + sceneSavedRevision + '.', 'success');
      renderAll();
    } catch (error) {
      status('Could not save project scene: ' + error.message, 'error');
    } finally {
      if (saveButton) saveButton.disabled = false;
    }
  }
  $('#sceneLoadProject')?.addEventListener('click', () => loadProjectScene(window.cvProjectId || sceneProjectId));
  $('#sceneSaveProject')?.addEventListener('click', saveProjectScene);
  window.addEventListener('buildvibe:project-changed', event => {
    if (event.detail?.projectId) loadProjectScene(event.detail.projectId);
  });
  if (window.cvProjectId) loadProjectScene(window.cvProjectId);

  async function initializePreviewRenderer() {
    if (previewRenderer || previewRendererLoading) return;
    previewRendererLoading = true;
    const statusNode = $('#scenePreviewStatus');
    try {
      const canvas = $('#scenePreviewCanvas');
      if (!canvas) return;
      const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js';
      const [{ createScenePreviewRenderer }, THREE] = await Promise.all([
        import('./scene/scene-preview-renderer.js'),
        import(THREE_URL)
      ]);
      let GLTFLoader = null;
      try {
        ({ GLTFLoader } = await import('https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/loaders/GLTFLoader.js'));
      } catch { /* Keep primitive and image/video scene editing available if the optional model loader fails. */ }
      previewRenderer = createScenePreviewRenderer({
        canvas,
        THREE,
        GLTFLoader,
        onStatus: message => { if (statusNode) statusNode.textContent = message; }
      });
      renderAll();
    } catch (error) {
      if (statusNode) statusNode.textContent = '3D preview unavailable. Check WebGL support and network access; scene editing and JSON export still work.';
      status('3D preview could not initialize: ' + error.message, 'error');
    } finally {
      previewRendererLoading = false;
    }
  }
  window.addEventListener('beforeunload', () => previewRenderer?.dispose(), { once: true });
  renderAll();
  initializePreviewRenderer();
}
