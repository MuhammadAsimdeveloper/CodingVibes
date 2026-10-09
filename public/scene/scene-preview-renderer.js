/**
 * Three.js adapter for the validated renderer-neutral Build Vibe scene document.
 * It accepts a Three.js namespace from the caller so unit tests do not need WebGL or network access.
 */
export function createScenePreviewRenderer({ canvas, THREE, GLTFLoader = null, onStatus = () => {} }) {
  if (!canvas || !THREE) throw new TypeError('canvas and Three.js are required');
  const {
    Scene, PerspectiveCamera, WebGLRenderer, Color, AmbientLight, DirectionalLight,
    Group, Mesh, BoxGeometry, SphereGeometry, PlaneGeometry, MeshStandardMaterial,
    GridHelper, CanvasTexture, TextureLoader, VideoTexture, SRGBColorSpace, PointLight, SpotLight
  } = THREE;
  const scene = new Scene();
  scene.background = new Color('#080f1b');
  const camera = new PerspectiveCamera(42, 1, 0.1, 1000);
  camera.position.set(8, 6, 10);
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 1.5));
  scene.add(new AmbientLight(0xffffff, 1.8));
  const key = new DirectionalLight(0xffffff, 2.2);
  key.position.set(5, 9, 7);
  scene.add(key);
  const grid = new GridHelper(20, 20, 0x384763, 0x202d42);
  grid.position.y = -0.015;
  scene.add(grid);
  const root = new Group();
  scene.add(root);
  let animationFrame = 0;
  let buildVersion = 0;
  let disposed = false;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let yaw = Math.atan2(camera.position.x, camera.position.z);
  let pitch = 0.35;
  let distance = camera.position.length();
  const owned = [];
  const mediaElements = new Set();
  const geometryFor = (node) => {
    if (node.type === 'sphere') return new SphereGeometry(0.7, 24, 16);
    if (node.type === 'plane' || node.type === 'image' || node.type === 'video') return new PlaneGeometry(1.5, 1.5);
    return new BoxGeometry(1.2, 1.2, 1.2);
  };
  function makeTextTexture(text, color) {
    const label = document.createElement('canvas');
    label.width = 512; label.height = 128;
    const ctx = label.getContext('2d');
    ctx.clearRect(0, 0, label.width, label.height);
    ctx.fillStyle = color || '#ffffff';
    ctx.font = '600 42px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(text || '').slice(0, 100), 256, 64, 480);
    const texture = new CanvasTexture(label);
    if (SRGBColorSpace) texture.colorSpace = SRGBColorSpace;
    owned.push(texture);
    return texture;
  }
  function disposeTree(object) {
    const textures = new Set();
    object.traverse?.(part => {
      part.geometry?.dispose?.();
      const materials = Array.isArray(part.material) ? part.material : (part.material ? [part.material] : []);
      materials.forEach(material => {
        for (const value of Object.values(material || {})) if (value?.isTexture) textures.add(value);
        material.dispose?.();
      });
    });
    for (const texture of textures) texture.dispose?.();
  }
  function releaseMediaElements() {
    for (const element of mediaElements) {
      element.pause?.();
      element.removeAttribute?.('src');
      element.load?.();
    }
    mediaElements.clear();
  }
  function attachAssetTexture(node, material) {
    if (!node.assetUrl || typeof TextureLoader !== 'function') return;
    const url = node.assetUrl;
    new TextureLoader().load(url, texture => {
      if (disposed || !root.getObjectByName?.(node.id)) { texture.dispose?.(); return; }
      if (SRGBColorSpace) texture.colorSpace = SRGBColorSpace;
      owned.push(texture);
      material.map = texture;
      material.needsUpdate = true;
      draw();
    }, undefined, () => onStatus('Could not load media for scene node "' + (node.name || node.id) + '". Check the asset URL and CORS policy.'));
  }
  function build(document) {
    const buildToken = ++buildVersion;
    for (const child of [...root.children]) disposeTree(child);
    root.clear();
    releaseMediaElements();
    owned.splice(0).forEach(texture => texture.dispose?.());
    const objects = new Map();
    for (const node of document.nodes) {
      let object;
      if (node.type === 'group') object = new Group();
      else if (node.type === 'model' && node.assetUrl && typeof GLTFLoader === 'function') {
        object = new Group();
        const url = node.assetUrl;
        new GLTFLoader().load(url, gltf => {
          if (disposed || buildToken !== buildVersion) { disposeTree(gltf.scene); return; }
          queueMicrotask(() => {
            const target = root.getObjectByName?.(node.id);
            if (disposed || buildToken !== buildVersion || !target) { disposeTree(gltf.scene); return; }
            target.add(gltf.scene);
            draw();
          });
        }, undefined, () => {
          if (!disposed && buildToken === buildVersion) onStatus('Could not load 3D model for scene node "' + (node.name || node.id) + '". Check the model file and asset URL.');
        });
      }
      else if (node.type === 'light') {
        object = typeof PointLight === 'function'
          ? new PointLight(node.color || '#ffffff', 1.5)
          : typeof SpotLight === 'function' ? new SpotLight(node.color || '#ffffff', 1.5) : new Group();
      } else {
        const mediaNode = node.type === 'image' || node.type === 'video';
        const material = new MeshStandardMaterial({
          color: mediaNode && node.assetUrl ? '#ffffff' : (node.color || '#8b7dff'),
          roughness: 0.65,
          transparent: node.type === 'text',
          map: node.type === 'text' ? makeTextTexture(node.text || node.name, node.color) : null,
          side: THREE.DoubleSide
        });
        object = new Mesh(node.type === 'text' ? new PlaneGeometry(2.8, 0.7) : geometryFor(node), material);
        if (node.type === 'image') attachAssetTexture(node, material);
        if (node.type === 'video' && node.assetUrl && typeof globalThis.document?.createElement === 'function' && typeof VideoTexture === 'function') {
          const video = globalThis.document.createElement('video');
          video.crossOrigin = 'anonymous'; video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'metadata'; video.src = node.assetUrl;
          mediaElements.add(video);
          const texture = new VideoTexture(video);
          if (SRGBColorSpace) texture.colorSpace = SRGBColorSpace;
          owned.push(texture); material.map = texture; material.needsUpdate = true;
          video.play?.().catch?.(() => onStatus('Video is ready but autoplay was blocked; use a browser that permits muted preview playback.'));
        }
      }
      object.name = node.id;
      object.userData.sceneNodeName = node.name || node.id;
      object.visible = node.visible !== false;
      object.position.set(...(node.position || [0, 0, 0]));
      object.rotation.set(...(node.rotation || [0, 0, 0]));
      object.scale.set(...(node.scale || [1, 1, 1]));
      object.userData.sceneNodeId = node.id;
      objects.set(node.id, object);
    }
    for (const node of document.nodes) {
      const object = objects.get(node.id);
      const parent = node.parentId ? objects.get(node.parentId) : root;
      (parent || root).add(object);
    }
    onStatus('Rendered ' + document.nodes.length + ' scene nodes.');
    draw();
  }
  function updateCamera() {
    const safePitch = Math.max(-1.2, Math.min(1.2, pitch));
    camera.position.set(
      Math.sin(yaw) * Math.cos(safePitch) * distance,
      Math.sin(safePitch) * distance + 1,
      Math.cos(yaw) * Math.cos(safePitch) * distance
    );
    camera.lookAt(0, 0.8, 0);
  }
  function resize() {
    if (disposed) return;
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    draw();
  }
  function draw() {
    if (disposed) return;
    updateCamera();
    renderer.render(scene, camera);
  }
  function onPointerDown(event) {
    dragging = true; lastX = event.clientX; lastY = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
  }
  function onPointerMove(event) {
    if (!dragging) return;
    yaw -= (event.clientX - lastX) * 0.008;
    pitch += (event.clientY - lastY) * 0.008;
    lastX = event.clientX; lastY = event.clientY;
    draw();
  }
  function onPointerUp() { dragging = false; }
  function onWheel(event) {
    event.preventDefault();
    distance = Math.max(3, Math.min(35, distance + Math.sign(event.deltaY) * 0.8));
    draw();
  }
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(canvas);
  if (!resizeObserver) globalThis.addEventListener?.('resize', resize);
  resize();
  return {
    render(document) { build(document); },
    dispose() {
      disposed = true;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      if (!resizeObserver) globalThis.removeEventListener?.('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      disposeTree(root);
      releaseMediaElements();
      owned.forEach(texture => texture.dispose?.());
      renderer.dispose();
    }
  };
}
