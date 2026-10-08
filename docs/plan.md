# Open QR link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native execution, or superpowers:subagent-driven-development if the user selects delegation. Steps use checkbox syntax for tracking.

**Goal:** Right-click an image and open its QR web link in a new tab.

**Architecture:** A Manifest V3 service worker manages the menu, serializes requests, validates destinations, and opens tabs. An offscreen document loads and decodes the selected image using a bundled decoder.

**Tech Stack:** Plain JavaScript, Chrome extension APIs, bundled jsQR with license; Node's built-in test runner.

**Spec:** [design.md](design.md)

**Implementation note:** This is the original approved plan. The user subsequently requested a GitHub repository and a clone in `~/Projects/qr-code-reader`; actual runtime files are in `extension/`, and tests are in `tests/`. Execution and manual testing are complete. Package instructions are in `../PUBLISHING.md`.

## Global Constraints
- One image menu command: **Open QR link**.
- HTTP/HTTPS destinations only; decode locally without storage or telemetry.
- No popup, settings, history, remote decoder, runtime downloads, or build system.
- Permissions: `contextMenus`, `offscreen`, `notifications`, and HTTP/HTTPS host access.
- Deliver an unpacked folder, ZIP, installation guide, third-party license, and fixture page.

## Review Focus
- Repeated clicks: requests must retain their own image and destination.
- Oversized images: bound decoded dimensions and fail with a clear message.
- Slow image server: timeout and let subsequent requests proceed.
- Protected or expired image URLs: report failure and open no destination.
- Multiple codes: use one decoder result; do not open several tabs.

## Task 1: Decode and validate a selected image

**Files:** `outputs/qr-link/offscreen.html`, `offscreen.js`, `url.js`, `vendor/jsQR.js`, `vendor/LICENSE`; `work/tests/decode.test.mjs`; QR fixtures in `work/fixtures/`.

**Interfaces:** `webUrl(text)` returns a normalized HTTP/HTTPS URL or throws. Offscreen messages consume `{target: 'offscreen', imageUrl}` and return `{url}` or `{error}`. No other message target is processed.

- [ ] Write failing tests asserting HTTP and HTTPS acceptance; rejection of relative URLs, malformed URLs, `javascript:`, `data:`, and non-URL content; known and inverted QR decoding; no result on a blank image.
- [ ] Run `node --test work/tests/decode.test.mjs`; confirm failure before implementation.
- [ ] Bundle a pinned jsQR release and its license. Implement `webUrl(text)` in `url.js`, shared by worker and offscreen document.
- [ ] Implement offscreen image loading with a 15-second timeout, maximum 16 million pixels, and maximum 4096 pixels per dimension. Decode one result and convert loading/decoding failures into short messages. Test timeout, load rejection, dimension limits, and result selection with controlled image/canvas mocks.
- [ ] Run the decoder tests; require all assertions to pass.

## Task 2: Wire Chrome behavior and deliver the extension

**Files:** `outputs/qr-link/manifest.json`, `background.js`, icon assets, `README.md`, `test-page.html`, test images; `work/tests/background.test.mjs`; `outputs/qr-link.zip`.

**Interfaces:** Worker consumes Chrome `contextMenus.onClicked` events and the offscreen reply from Task 1. It invokes `webUrl(text)` again before `chrome.tabs.create({url})`.

- [ ] Write failing worker tests with mocked Chrome APIs: one image menu is registered; URL success opens exactly one tab; unsafe reply and decoder failure open no tab and notify; two concurrent clicks receive their own destinations; offscreen creation failure reports an error; failure does not block the next request.
- [ ] Run `node --test work/tests/background.test.mjs`; confirm failure before implementation.
- [ ] Implement the worker with top-level event listeners and a request queue. Reuse one offscreen document. Add the Manifest V3 manifest and notification icon.
- [ ] Create a fixture page with URL, non-URL, blank, and inverted QR images. Write installation instructions and document permissions, server image fetching, unsupported image contexts, and authenticated-image limitations.
- [ ] Run `node --test work/tests/*.test.mjs`, syntax checks for authored JavaScript, and manifest/package checks. Require all checks to pass.
- [ ] Try loading unpacked in Chrome and exercising the fixture page if available tools allow extension management. Report explicitly if this cannot be verified.
- [ ] ZIP only the installable extension directory and inspect its file list, including the decoder license.

## Repository handling
The workspace has no Git repository. Keep deliverables in `outputs/` and tests/scratch files in `work/`; do not create a GitHub repository or initialize Git just to commit planning artifacts.
