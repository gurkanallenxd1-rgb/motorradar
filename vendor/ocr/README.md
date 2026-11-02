# Local OCR assets

- Tesseract.js 6.0.1 and tesseract.js-core 6.0.0 (Apache-2.0), pinned in package-lock.json. Licenses are included here.
- Turkish fast LSTM model: https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0_fast/tur.traineddata.gz (Apache-2.0, see LICENSE-core).
- `node scripts/vendor-ocr.cjs` refreshes the engine files from `npm ci`. It applies one documented worker-factory hook (`onWorker`) so cancellation and startup failures terminate the underlying worker before initialization completes. No recognition logic is modified.
- The non-SIMD LSTM build is intentional for mobile Safari compatibility. All paths are relative to the application origin, including on GitHub Pages subpaths. No CDN is used at runtime.
- Keep these files in deployments. The service worker caches the engine and Turkish data alongside the application shell (~9 MB uncompressed total assets).

Turkish model SHA-256: `9e60b54f226a708cddb15b64521abb2d77f06072b2f7d4be5bb9c7638eb4e4b5`.
