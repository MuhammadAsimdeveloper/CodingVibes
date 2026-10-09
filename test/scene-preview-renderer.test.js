import test from 'node:test';
import assert from 'node:assert/strict';
import { createScenePreviewRenderer } from '../public/scene/scene-preview-renderer.js';

class Object3D {
  constructor() {
    this.children = []; this.parent = null; this.visible = true; this.userData = {};
    this.position = this.rotation = this.scale = { set: (...values) => { this.values = values; } };
  }
  add(child) { child.parent?.remove?.(child); child.parent = this; this.children.push(child); }
  remove(child) { this.children = this.children.filter(item => item !== child); child.parent = null; }
  clear() { for (const child of this.children) child.parent = null; this.children = []; }
  traverse(callback) { callback(this); for (const child of this.children) child.traverse(callback); }
}
class Scene extends Object3D {}
class Group extends Object3D {}
class Mesh extends Object3D { constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; } }
class Geometry { dispose() { this.disposed = true; } }
class Material { constructor(options) { Object.assign(this, options); } dispose() { this.disposed = true; } }
class Color { constructor(value) { this.value = value; } }
class Camera extends Object3D { constructor() { super(); this.aspect = 1; } updateProjectionMatrix() {} lookAt() {} }
class Renderer {
  constructor() { this.renders = 0; this.disposed = false; }
  setPixelRatio() {} setSize() {} render() { this.renders += 1; } dispose() { this.disposed = true; }
}
class Light extends Object3D { constructor(color, intensity) { super(); this.color = color; this.intensity = intensity; } }
class GridHelper extends Object3D {}
const fakeThree = {
  Scene, PerspectiveCamera: Camera, WebGLRenderer: Renderer, Color,
  AmbientLight: Light, DirectionalLight: Light, Group, Mesh,
  BoxGeometry: Geometry, SphereGeometry: Geometry, PlaneGeometry: Geometry,
  MeshStandardMaterial: Material, GridHelper, CanvasTexture: class {},
  DoubleSide: 2, SRGBColorSpace: 'srgb'
};
function fakeCanvas() {
  const listeners = new Map();
  return {
    listeners, width: 640, height: 300,
    addEventListener(name, handler) { listeners.set(name, handler); },
    removeEventListener(name) { listeners.delete(name); },
    getBoundingClientRect() { return { width: 640, height: 300 }; }
  };
}

test('Three.js adapter renders supported scene nodes with hierarchy and transforms', () => {
  const canvas = fakeCanvas();
  const statuses = [];
  const renderer = createScenePreviewRenderer({ canvas, THREE: fakeThree, onStatus: value => statuses.push(value) });
  renderer.render({
    schemaVersion: 1, id: 'test-scene', name: 'Test', nodes: [
      { id: 'root', type: 'group', name: 'Root', position: [0, 0, 0] },
      { id: 'hero', type: 'box', name: 'Hero', parentId: 'root', position: [1, 2, 3], color: '#ff0000' },
      { id: 'orb', type: 'sphere', name: 'Orb', parentId: 'root', visible: false, position: [0, 1, 0] }
    ]
  });
  assert.equal(renderer !== null, true);
  assert.equal(statuses.at(-1), 'Rendered 3 scene nodes.');
  assert.equal(canvas.listeners.has('pointerdown'), true);
  renderer.dispose();
  assert.equal(canvas.listeners.size, 0);
});

test('Three.js adapter rejects missing canvas or Three.js namespace', () => {
  assert.throws(() => createScenePreviewRenderer({ canvas: null, THREE: fakeThree }), /required/);
  assert.throws(() => createScenePreviewRenderer({ canvas: fakeCanvas() }), /required/);
});
