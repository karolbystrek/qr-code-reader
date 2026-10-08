# Test before pushing

## Automated checks

From the repository root, with Node.js 20 or newer:

```sh
npm test
for file in extension/*.js; do node --check "$file" || exit 1; done
git diff --check
```

All tests should pass and syntax/diff checks should print no errors. Tests cover QR decoding, URL validation, image limits, error handling, and request ordering. Chrome API mocks do not replace the manual integration checks below.

## Manual Chrome checks

1. Load `extension/` using **Load unpacked** at `chrome://extensions`. Confirm there are no errors on the extension card.
2. Allow notifications from Chrome in your OS settings.
3. Serve the test page from the repository root:

   ```sh
   python3 -m http.server 8000 --bind 127.0.0.1
   ```

4. Open `http://127.0.0.1:8000/tests/test-page.html` in Chrome.
5. Right-click the HTTPS, HTTP, and inverted QR images. Select **Open QR link**. Each click should open one new tab with the encoded URL. The HTTP server may redirect to HTTPS.
6. Try the text, JavaScript, and blank images. Expect a short error notification and no new tab. The JavaScript code must never execute.
7. Select the command twice quickly on different QR images. Both destinations should open once each. After an error, try a valid QR again to check recovery.
8. Open a QR PNG directly in its own tab and repeat. Test a QR image served from a different host than the page and a data-URL image. Both should decode without page scripts or server-side CORS headers.
9. Test an unavailable image URL and an image above the documented size limits. Expect an error, no destination tab, and a subsequent valid request to work. For unavailable URLs, load an image, remove the file from a temporary server directory, then right-click the already displayed image.
10. Inspect the service worker and offscreen document from `chrome://extensions` for uncaught errors. Close those inspectors and repeat after the service worker has gone idle to check restart behavior.
11. Stop the temporary HTTP server with Ctrl+C. Reload the extension after making fixes and repeat the affected checks.

## Review and push only after testing

```sh
git status --short
git diff --check
git add extension tests README.md TESTING.md PUBLISHING.md package.json .gitignore docs
git diff --cached --stat
git diff --cached --check
git commit -m "Add minimal QR link reader Chrome extension"
git push origin main
```

Work is on `main`. If there are no new changes to commit, skip the add/commit commands. These commands do not publish to the Chrome Web Store. Testing on a real page is sufficient for checking the core action; the fixture page provides optional known success and failure cases.
