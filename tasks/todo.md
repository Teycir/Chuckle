# Task: Browser Distribution Folder

## Plan
- [x] Add a browser compatibility shim for extension APIs used by UI pages.
- [x] Include the shim in build output and load it before app bundles.
- [x] Add a browser entry page and copy it into `dist/`.
- [x] Add an explicit browser build script.
- [x] Verify build output contains browser-ready artifacts.

## Review
- `npm run build` succeeds.
- `dist/` now contains `index.html` and `browser-shim.js`.
- `popup.html` and `viewer.html` load `browser-shim.js` before app bundles.
