# Local PDF Tool Fabric

Build Vibe exposes five bounded local PDF operations through the existing canonical Tool Fabric. All page numbers are one-based. These tools do not upload files or make network requests.

## Tools

- `pdf.info`: inspect page count, document metadata, page sizes and page rotations.
- `pdf.merge`: combine 2 to 10 PDFs in the supplied order.
- `pdf.split`: extract selected pages into separate PDF files in the requested order.
- `pdf.rotate`: rotate all pages or a selected set by a right-angle multiple.
- `pdf.reorder`: reorder every page using a complete permutation of unique one-based page numbers; page dimensions, rotation, and core document metadata are preserved.

## Safety and current limits

- Each source PDF is limited to 1 MB, merged inputs are limited to 1 MB total, and outputs are limited to 2 MB.
- At most 10 source documents and 200 total pages are accepted.
- `pdf.reorder` requires every page exactly once; missing, duplicate, zero, negative, fractional and out-of-range page numbers are rejected.
- Base64 must be canonical and the payload must start with a PDF signature.
- Malformed or encrypted PDFs are rejected. Page numbers must be unique and in range.
- No text extraction, OCR, compression, redaction, or decryption is claimed.
- Processing is local to the server process and bounded by the existing Tool Fabric's 1 MB JSON input limit. A dedicated worker with a hard execution timeout and memory isolation is recommended before accepting untrusted, high-volume production traffic.

## Verification

Real PDF fixture tests cover metadata/page size, merge, split, rotation, page reordering with page-property preservation, invalid input, page-range/permutation validation and input limits. CI must pass the exact PR head before this capability is considered complete.
