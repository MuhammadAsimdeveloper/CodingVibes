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

## Module reuse constraints for Build Vibe

For modules reused by Build Vibe, follow [BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md](BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md): inspect source and license, verify dependencies/contracts, adapt into the Build Vibe codebase, and test locally. The generated product must not require a runtime call to Asim Tools or another repository merely to load a copied module unless a genuine external service is an explicit feature.
