# Local PDF.js distribution

Pinned version: pdfjs-dist **5.6.205**, sourced from the installed Codex runtime dependency. All runtime resources are local. This directory does not contain textbooks.

Upstream: [Mozilla PDF.js](https://mozilla.github.io/pdf.js/), [API documentation](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html). Exact API behavior was checked against the installed `legacy/build/pdf.mjs` source rather than assuming the latest draft docs match this version.

License files: `LICENSE` (Apache-2.0), `cmaps-LICENSE`, `standard_fonts-LICENSE_FOXIT`, `standard_fonts-LICENSE_LIBERATION` are included with the applicable resources. Upstream copyright banners remain in both scripts.

Rebuild: `node scripts/vendor-pdfjs.cjs /path/to/pdfjs-dist`. Only version 5.6.205 is accepted. `manifest.json` records source and output hashes. The build wraps the self-contained ESM bundles as classic scripts, removes the final export declaration and captures `import.meta.url` from the script URL. It preserves the upstream global API. Character maps and standard fonts are base64 bundled in `binary-data.js` and provided by a custom binary-data factory.

The application loads these assets only when a PDF is opened, supplies local file bytes, disables evaluation, XFA, annotations and WASM decoding, and uses the bundled main-thread worker handler. It never exposes PDF links or executes PDF actions. No external fetch is needed for the verified textbook pages. Unsupported image encodings can still fail and must not be labeled supported.

This is a desktop capability prototype, not a claim of broad mobile compatibility or acceptable worst-case memory/performance. Future work must benchmark a worker-based/native adapter and real Android/iPad devices before freezing platform support.
