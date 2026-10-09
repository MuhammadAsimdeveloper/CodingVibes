/**
 * Browser-local image optimization adapter.
 * Canonical Asim Tools source id: image-compressor.
 * No file bytes are sent over the network.
 */
export async function optimizeImageInBrowser(file, options = {}) {
  if (typeof createImageBitmap !== 'function' || typeof Blob === 'undefined') {
    const error = new Error('BROWSER_REQUIRED: Canvas and ImageBitmap support are required.');
    error.code = 'BROWSER_REQUIRED';
    throw error;
  }
  if (!(file instanceof Blob) || !String(file.type || '').startsWith('image/')) {
    const error = new Error('INVALID_INPUT: Supply a local image File or Blob.');
    error.code = 'INVALID_INPUT';
    throw error;
  }
  const type = options.type || 'image/webp';
  if (!['image/webp','image/jpeg','image/png'].includes(type)) {
    const error = new Error('INVALID_INPUT: Format must be WebP, JPEG or PNG.');
    error.code = 'INVALID_INPUT';
    throw error;
  }
  const quality = options.quality === undefined ? 0.82 : Number(options.quality);
  const maxWidth = options.maxWidth === undefined ? 1920 : Number(options.maxWidth);
  const maxHeight = options.maxHeight === undefined ? 1920 : Number(options.maxHeight);
  if (!Number.isFinite(quality) || quality < 0.1 || quality > 1 ||
      !Number.isInteger(maxWidth) || maxWidth < 64 || maxWidth > 8192 ||
      !Number.isInteger(maxHeight) || maxHeight < 64 || maxHeight > 8192) {
    const error = new Error('INVALID_INPUT: Quality must be 0.1–1 and dimensions 64–8192 pixels.');
    error.code = 'INVALID_INPUT';
    throw error;
  }
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = typeof OffscreenCanvas === 'function'
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement('canvas'), {width, height});
    const context = canvas.getContext('2d', {alpha: type !== 'image/jpeg'});
    if (!context) throw new Error('BROWSER_REQUIRED: A 2D Canvas context is unavailable.');
    context.drawImage(bitmap, 0, 0, width, height);
    let blob;
    if (typeof canvas.convertToBlob === 'function') {
      blob = await canvas.convertToBlob({type,quality});
    } else {
      blob = await new Promise((resolve,reject) => canvas.toBlob(
        value => value ? resolve(value) : reject(new Error('BROWSER_REQUIRED: This browser cannot encode the chosen image format.')),
        type, quality
      ));
    }
    if (!blob) throw new Error('BROWSER_REQUIRED: The browser returned no encoded image.');
    return {
      blob,
      fileName: String(file.name || 'image').replace(/\.[^.]+$/, '') + (type === 'image/png' ? '.png' : type === 'image/jpeg' ? '.jpg' : '.webp'),
      mimeType: blob.type || type,
      originalBytes: file.size,
      optimizedBytes: blob.size,
      width,
      height,
      networkUsed: false
    };
  } finally {
    if (typeof bitmap.close === 'function') bitmap.close();
  }
}
