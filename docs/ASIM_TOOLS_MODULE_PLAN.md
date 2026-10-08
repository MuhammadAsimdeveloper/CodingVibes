# Asim Tools Module Plan — CodingVibes

Date: 2026-10-08

## Role
developer/web/SEO/app-builder backend

## Integration rule
Use **local copied modules** from `MuhammadAsimdeveloper/Our-Tools-`. Do not call Asim Tools at runtime, do not link to tool pages for execution, and do not add a standalone Tools section to this product.

Copy the smallest required implementation plus its focused tests into this repository's existing backend/service structure. Preserve validation, privacy boundaries and explicit network behavior.

## Assigned modules
### Text


### Developer


### SEO & Web


### Calculators


### Security


### Design


### Images


### Time


### Data & Developer


### Converters


### Generators


### API & Testing


### Networking & Web


### AI & Agents


### Build & Package


## Implementation order
1. Extract/copy deterministic core modules first.
2. Add host-native tests before wiring the module into product code.
3. Add advanced/network modules only when the product feature requires them.
4. For any **EXTRACT-FIRST** tool, wait for the Asim Tools backend extraction rather than copying UI logic from `src/app.js`.
5. Keep user-facing UX in this product; Asim Tools is only the source library.
