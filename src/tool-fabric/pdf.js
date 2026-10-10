import { PDFDocument, degrees } from 'pdf-lib';

const MAX_INPUT_BYTES = 1_000_000;
const MAX_OUTPUT_BYTES = 2_000_000;
const MAX_DOCUMENTS = 10;
const MAX_PAGES = 200;
const MAX_IMAGE_COUNT = 20;
const MAX_IMAGE_BYTES = 1_000_000;
const MAX_IMAGE_TOTAL_BYTES = 1_000_000;
const MAX_IMAGE_EDGE = 10_000;
const MAX_IMAGE_PIXELS = 20_000_000;
const A4_PORTRAIT = [595.28, 841.89];
const A4_LANDSCAPE = [841.89, 595.28];
const JPEG_SOF_MARKERS = new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);

class PdfToolError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function decodePdfBase64(value, label = 'PDF') {
  if (typeof value !== 'string' || value.length < 8 || value.length > Math.ceil(MAX_INPUT_BYTES * 4 / 3) + 8) {
    throw new PdfToolError(value?.length > Math.ceil(MAX_INPUT_BYTES * 4 / 3) + 8 ? 'INPUT_TOO_LARGE' : 'INVALID_INPUT', label + ' must be a Base64-encoded PDF within the 1 MB limit.');
  }
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new PdfToolError('INVALID_INPUT', label + ' is not canonical Base64.');
  }
  const bytes = Buffer.from(value, 'base64');
  if (bytes.length > MAX_INPUT_BYTES) throw new PdfToolError('INPUT_TOO_LARGE', label + ' exceeds the 1 MB limit.');
  if (bytes.toString('base64') !== value || bytes.length < 8 || bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new PdfToolError('INVALID_INPUT', label + ' is not a valid PDF payload.');
  }
  return bytes;
}

async function loadPdf(value, label) {
  const bytes = decodePdfBase64(value, label);
  let document;
  try {
    document = await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
  } catch {
    throw new PdfToolError('INVALID_INPUT', label + ' could not be parsed. Encrypted or malformed PDFs are not supported.');
  }
  const pageCount = document.getPageCount();
  if (pageCount < 1 || pageCount > MAX_PAGES) throw new PdfToolError('INVALID_INPUT', label + ' must contain between 1 and 200 pages.');
  return document;
}

function pageInfo(page) {
  const size = page.getSize();
  const rotation = page.getRotation();
  return { width: Math.round(size.width * 100) / 100, height: Math.round(size.height * 100) / 100, rotation: ((rotation.angle % 360) + 360) % 360 };
}

async function encodePdf(document) {
  let bytes;
  try { bytes = await document.save({ useObjectStreams: false }); }
  catch { throw new PdfToolError('INVALID_INPUT', 'The PDF could not be serialized safely.'); }
  if (bytes.byteLength > MAX_OUTPUT_BYTES) throw new PdfToolError('OUTPUT_TOO_LARGE', 'Generated PDF exceeds the 2 MB output limit.');
  return Buffer.from(bytes).toString('base64');
}

function decodeImageBase64(value, label) {
  if (typeof value !== 'string' || value.length < 16 ||
      value.length > Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 8) {
    throw new PdfToolError(
      value?.length > Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 8 ? 'INPUT_TOO_LARGE' : 'INVALID_INPUT',
      label + ' must be a Base64-encoded PNG or JPEG within the 1 MB per-image limit.'
    );
  }
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new PdfToolError('INVALID_INPUT', label + ' is not canonical Base64.');
  }
  const bytes = Buffer.from(value, 'base64');
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new PdfToolError('INPUT_TOO_LARGE', label + ' exceeds the 1 MB per-image limit.');
  }
  if (bytes.toString('base64') !== value) {
    throw new PdfToolError('INVALID_INPUT', label + ' is not canonical Base64.');
  }
  return bytes;
}

function pngDimensions(bytes, label) {
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  if (bytes.byteLength < 24 || !bytes.subarray(0,8).equals(signature) ||
      bytes.readUInt32BE(8) !== 13 || bytes.toString('ascii',12,16) !== 'IHDR') {
    throw new PdfToolError('INVALID_INPUT', label + ' does not contain a valid PNG header.');
  }
  return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
}

function jpegDimensions(bytes, label) {
  if (bytes.byteLength < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new PdfToolError('INVALID_INPUT', label + ' does not contain a valid JPEG signature.');
  }
  let offset = 2;
  while (offset < bytes.byteLength) {
    if (bytes[offset] !== 0xff) {
      throw new PdfToolError('INVALID_INPUT', label + ' contains a malformed JPEG marker sequence.');
    }
    while (offset < bytes.byteLength && bytes[offset] === 0xff) offset++;
    if (offset >= bytes.byteLength) break;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.byteLength) break;
    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.byteLength) {
      throw new PdfToolError('INVALID_INPUT', label + ' contains a malformed JPEG segment.');
    }
    if (JPEG_SOF_MARKERS.has(marker)) {
      if (segmentLength < 7) throw new PdfToolError('INVALID_INPUT', label + ' has an incomplete JPEG frame header.');
      return {height:bytes.readUInt16BE(offset + 3),width:bytes.readUInt16BE(offset + 5)};
    }
    offset += segmentLength;
  }
  throw new PdfToolError('INVALID_INPUT', label + ' has no supported JPEG frame header.');
}

function validateImageDimensions(dimensions, label) {
  const {width,height} = dimensions;
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
      width < 1 || height < 1 || width > MAX_IMAGE_EDGE || height > MAX_IMAGE_EDGE ||
      width * height > MAX_IMAGE_PIXELS) {
    throw new PdfToolError('INVALID_INPUT', label + ' dimensions exceed the 10000-pixel edge or 20-megapixel safety limit.');
  }
  return {width,height};
}

async function imageToPdf(input) {
  const images = input.images;
  if (!Array.isArray(images) || images.length < 1 || images.length > MAX_IMAGE_COUNT) {
    throw new PdfToolError('INVALID_INPUT', 'Provide between 1 and 20 PNG or JPEG images.');
  }
  const parsed = [];
  let totalBytes = 0;
  for (const [index,item] of images.entries()) {
    const label = 'Image ' + (index + 1);
    if (!item || typeof item !== 'object' || Array.isArray(item) ||
        !['image/png','image/jpeg'].includes(item.mimeType)) {
      throw new PdfToolError('INVALID_INPUT', label + ' must declare image/png or image/jpeg.');
    }
    const bytes = decodeImageBase64(item.imageBase64, label);
    totalBytes += bytes.byteLength;
    if (totalBytes > MAX_IMAGE_TOTAL_BYTES) {
      throw new PdfToolError('INPUT_TOO_LARGE', 'Combined image inputs exceed the 1 MB budget.');
    }
    const dimensions = item.mimeType === 'image/png'
      ? pngDimensions(bytes,label)
      : jpegDimensions(bytes,label);
    validateImageDimensions(dimensions,label);
    parsed.push({bytes,mimeType:item.mimeType,dimensions,label});
  }

  const document = await PDFDocument.create({updateMetadata:false});
  const pageSizes = [];
  for (const item of parsed) {
    let embedded;
    try {
      embedded = item.mimeType === 'image/png'
        ? await document.embedPng(item.bytes)
        // pdf-lib's JPEG parser reads DataView(imageData.buffer) without byteOffset, so copy Node Buffer views into a zero-offset Uint8Array.
        : await document.embedJpg(Uint8Array.from(item.bytes));
    } catch {
      throw new PdfToolError('INVALID_INPUT', item.label + ' could not be decoded as a supported PNG or JPEG.');
    }
    validateImageDimensions({width:embedded.width,height:embedded.height},item.label);
    const pageSize = embedded.width >= embedded.height ? A4_LANDSCAPE : A4_PORTRAIT;
    const [pageWidth,pageHeight] = pageSize;
    const margin = 24;
    const scale = Math.min((pageWidth - 2 * margin) / embedded.width,(pageHeight - 2 * margin) / embedded.height);
    const width = embedded.width * scale;
    const height = embedded.height * scale;
    const page = document.addPage(pageSize);
    page.drawImage(embedded,{x:(pageWidth-width)/2,y:(pageHeight-height)/2,width,height});
    pageSizes.push({width:pageWidth,height:pageHeight});
  }
  return {
    pdfBase64: await encodePdf(document),
    pageCount: parsed.length,
    imageCount: parsed.length,
    pageSizes,
    networkUsed: false
  };
}

function normalizePages(pages, pageCount, optional = false) {
  if (pages === undefined && optional) return Array.from({length:pageCount},(_,i)=>i+1);
  if (!Array.isArray(pages) || pages.length < 1 || pages.length > pageCount || pages.some(n=>!Number.isInteger(n)||n<1||n>pageCount) || new Set(pages).size !== pages.length) {
    throw new PdfToolError('INVALID_INPUT', 'Page selections must contain unique, valid 1-based page numbers.');
  }
  return pages;
}

async function inspect(input) {
  const pdf = await loadPdf(input.pdfBase64);
  const pages = pdf.getPages();
  return {
    pageCount: pages.length,
    metadata: {
      title: pdf.getTitle() || '',
      author: pdf.getAuthor() || '',
      subject: pdf.getSubject() || '',
      creator: pdf.getCreator() || '',
      producer: pdf.getProducer() || ''
    },
    pageSizes: pages.map(page=>{const s=page.getSize();return {width:Math.round(s.width*100)/100,height:Math.round(s.height*100)/100};}),
    pageRotations: pages.map(page=>((page.getRotation().angle%360)+360)%360),
    encrypted: false,
    networkUsed: false
  };
}

async function merge(input) {
  if (!Array.isArray(input.documents) || input.documents.length < 2 || input.documents.length > MAX_DOCUMENTS) {
    throw new PdfToolError('INVALID_INPUT', 'Provide between 2 and 10 PDF documents.');
  }
  let totalBytes = 0;
  const sources = [];
  let totalPages = 0;
  for (const [index, item] of input.documents.entries()) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new PdfToolError('INVALID_INPUT', 'Each document must include pdfBase64.');
    const bytes = decodePdfBase64(item.pdfBase64, 'Document ' + (index + 1));
    totalBytes += bytes.byteLength;
    if (totalBytes > MAX_INPUT_BYTES) throw new PdfToolError('INPUT_TOO_LARGE', 'Combined source PDFs exceed the 1 MB input budget.');
    const document = await loadPdf(item.pdfBase64, 'Document ' + (index + 1));
    totalPages += document.getPageCount();
    if (totalPages > MAX_PAGES) throw new PdfToolError('INVALID_INPUT', 'Merged output cannot exceed 200 pages.');
    sources.push(document);
  }
  const merged = await PDFDocument.create({ updateMetadata: false });
  for (const source of sources) {
    const pages = await merged.copyPages(source, source.getPageIndices());
    for (const page of pages) merged.addPage(page);
  }
  return { pdfBase64: await encodePdf(merged), pageCount: totalPages, documentCount: sources.length, networkUsed: false };
}

async function split(input) {
  const source = await loadPdf(input.pdfBase64);
  const selected = normalizePages(input.pages, source.getPageCount());
  const documents = [];
  let outputBytes = 0;
  for (const pageNumber of selected) {
    const result = await PDFDocument.create({ updateMetadata: false });
    const [page] = await result.copyPages(source, [pageNumber - 1]);
    result.addPage(page);
    const pdfBase64 = await encodePdf(result);
    outputBytes += Buffer.byteLength(pdfBase64, 'base64');
    if (outputBytes > MAX_OUTPUT_BYTES) throw new PdfToolError('OUTPUT_TOO_LARGE', 'Combined split output exceeds the 2 MB limit.');
    documents.push({ page: pageNumber, filename: 'page-' + pageNumber + '.pdf', pdfBase64 });
  }
  return { documents, pageCount: selected.length, networkUsed: false };
}

function normalizePageOrder(pages, pageCount) {
  if (!Array.isArray(pages) || pages.length !== pageCount ||
      pages.some(n => !Number.isInteger(n) || n < 1 || n > pageCount) ||
      new Set(pages).size !== pageCount) {
    throw new PdfToolError('INVALID_INPUT', 'Page order must be a complete permutation of all one-based page numbers.');
  }
  return pages;
}

async function reorder(input) {
  const source = await loadPdf(input.pdfBase64);
  const pageOrder = normalizePageOrder(input.pages, source.getPageCount());
  const output = await PDFDocument.create({ updateMetadata: false });
  const pages = await output.copyPages(source, pageOrder.map(page => page - 1));
  for (const page of pages) output.addPage(page);
  for (const [getter, setter] of [
    ['getTitle', 'setTitle'],
    ['getAuthor', 'setAuthor'],
    ['getSubject', 'setSubject'],
    ['getCreator', 'setCreator'],
    ['getProducer', 'setProducer']
  ]) {
    const value = source[getter]();
    if (value) output[setter](value);
  }
  const creationDate = source.getCreationDate();
  const modificationDate = source.getModificationDate();
  if (creationDate instanceof Date && Number.isFinite(creationDate.getTime())) output.setCreationDate(creationDate);
  if (modificationDate instanceof Date && Number.isFinite(modificationDate.getTime())) output.setModificationDate(modificationDate);
  return {
    pdfBase64: await encodePdf(output),
    pageCount: pageOrder.length,
    pageOrder: [...pageOrder],
    networkUsed: false
  };
}

async function rotate(input) {
  const source = await loadPdf(input.pdfBase64);
  const angle = input.angle;
  if (![-270,-180,-90,90,180,270].includes(angle)) throw new PdfToolError('INVALID_INPUT', 'Rotation angle must be a non-zero right-angle multiple.');
  const selected = normalizePages(input.pages, source.getPageCount(), true);
  const selectedSet = new Set(selected);
  for (let i = 0; i < source.getPageCount(); i++) {
    if (!selectedSet.has(i + 1)) continue;
    const page = source.getPage(i);
    const current = page.getRotation().angle;
    page.setRotation(degrees(((current + angle) % 360 + 360) % 360));
  }
  return { pdfBase64: await encodePdf(source), pageCount: source.getPageCount(), rotatedPages: selected, networkUsed: false };
}

export async function runPdfTool(id, input = {}) {
  try {
    let output;
    switch (id) {
      case 'pdf.info': output = await inspect(input); break;
      case 'pdf.merge': output = await merge(input); break;
      case 'pdf.split': output = await split(input); break;
      case 'pdf.rotate': output = await rotate(input); break;
      case 'pdf.reorder': output = await reorder(input); break;
      case 'image.to_pdf': output = await imageToPdf(input); break;
      default: throw new PdfToolError('UNKNOWN_TOOL', 'Unknown PDF tool.');
    }
    return output;
  } catch (error) {
    if (error instanceof PdfToolError) throw error;
    throw new PdfToolError('INVALID_INPUT', 'The PDF operation failed validation or parsing.');
  }
}
