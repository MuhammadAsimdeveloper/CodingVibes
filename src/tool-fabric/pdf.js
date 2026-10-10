import { PDFDocument, degrees } from 'pdf-lib';

const MAX_INPUT_BYTES = 1_000_000;
const MAX_OUTPUT_BYTES = 2_000_000;
const MAX_DOCUMENTS = 10;
const MAX_PAGES = 200;

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
      default: throw new PdfToolError('UNKNOWN_TOOL', 'Unknown PDF tool.');
    }
    return output;
  } catch (error) {
    if (error instanceof PdfToolError) throw error;
    throw new PdfToolError('INVALID_INPUT', 'The PDF operation failed validation or parsing.');
  }
}
