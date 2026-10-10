# Local PDF and image-to-PDF Tool Fabric

Build Vibe exposes six bounded local document operations through the canonical Tool Fabric. All PDF page numbers are one-based. The PDF and image inputs are processed locally by the server process; no network requests or external upload service are used.

## Tools

- `pdf.info`: inspect page count, document metadata, page sizes and page rotations.
- `pdf.merge`: combine 2 to 10 PDFs in the supplied order.
- `pdf.split`: extract selected pages into separate PDF files in the requested order.
- `pdf.rotate`: rotate all pages or a selected set by a right-angle multiple.
- `pdf.reorder`: reorder every page using a complete permutation of unique one-based page numbers; page dimensions, rotation, and core document metadata are preserved.
- `image.to_pdf`: create one PDF page per supplied PNG or JPEG image, fit to a portrait or landscape A4 page while preserving the image aspect ratio.

## Safety and current limits

### PDF input

- Each source PDF is limited to 1 MB, merged inputs are limited to 1 MB total, and outputs are limited to 2 MB.
- At most 10 source documents and 200 total pages are accepted.
- `pdf.reorder` requires every page exactly once; missing, duplicate, zero, negative, fractional and out-of-range page numbers are rejected.
- Base64 must be canonical and the payload must start with a PDF signature.
- Malformed or encrypted PDFs are rejected. Page numbers must be unique and in range.

### Image-to-PDF input

- Accepts 1 to 20 images per request, with only `image/png` and `image/jpeg` MIME types.
- Each image is limited to 1 MB and all images combined are limited to 1 MB.
- Base64 must be canonical. Declared MIME type must match the expected PNG/JPEG signature and parsable image header.
- Width and height must be positive and at most 10,000 pixels per edge; images are capped at 20 megapixels.
- The PDF contains one centered image per A4 page, using the matching page orientation and a 24-point margin. Images are scaled down to fit and are not stretched.
- Output remains subject to the Tool Fabric's 2 MB PDF output limit. Inputs that cannot be decoded or serialized within the limits fail explicitly rather than returning a partial PDF.

## Explicit exclusions

PDF compression, PDF-to-image rendering, text extraction, OCR, redaction and decryption are not implemented by this suite. Re-saving a PDF is not represented as meaningful compression, and metadata inspection is not text extraction.

Processing runs in the current server process. Before accepting high-volume untrusted documents in production, move parsing/conversion to a resource-isolated worker with hard execution and memory limits.

## Verification

`test/tool-fabric-pdf.test.js` covers real PDF fixtures, metadata/page sizes, merge, split, rotation, page reordering with page-property preservation, PNG/JPEG image-to-PDF conversion, malformed/MIME-mismatched inputs, dimension/count limits, invalid page ranges/permutations and input limits. The exact PR head must pass Build Vibe CI, CodeQL and Dependency Review before this tranche is merged.
