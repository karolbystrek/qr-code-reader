# Open QR link — extension design

## Goal
Right-click a QR-code image, choose **Open QR link**, and open its HTTP or HTTPS destination in a new tab. Decode on the user's computer. No popup, settings, history, telemetry, or remote decoding service.

## User behavior
- Add one context-menu entry for images. It appears on all images; decoding starts only when selected.
- Read the selected image, decode one QR code, validate its text as an absolute HTTP or HTTPS URL, and open a new tab.
- Show a short failure notification for an unreadable image, missing QR code, or a QR code containing non-web content. Never open executable or other URL schemes.
- Leave the original tab intact. Do not store the image or decoded text.

## Implementation
Use a Manifest V3 extension with a service worker for menu registration and opening tabs, and an offscreen document for image loading, canvas pixels, and decoding. Bundle a small established QR decoder and its license, avoiding reliance on platform-dependent native detection. No build system or runtime downloads.

The service worker passes the clicked image URL to the offscreen document. The document loads the image with a timeout and bounded image size, decodes its pixels, and returns a URL or a failure result. The worker independently validates the returned URL before navigation. Serialize decoding requests so replies cannot open the wrong destination.

Permissions: `contextMenus`, `offscreen`, and `notifications`. HTTP and HTTPS host access is needed to load images served by other sites; explain that permission in the installation guide. It grants broad potential access, but the extension only loads the selected image following the user's menu click. Data URLs are handled locally. Image loading may contact the original image server; there is no decoding server.

## Deliverables
An unpacked extension folder and ZIP, install instructions for Chrome's **Load unpacked** feature, bundled third-party license, and a small test fixture page. No store publication or GitHub repository is requested.

## Validation
Check successful decoding of a known URL QR image, inverted QR support if supplied by the decoder, a non-QR image, a non-URL QR code, HTTP/HTTPS URL acceptance, unsafe scheme rejection, loading failure, and repeated menu clicks. Verify manifest and JavaScript syntax. Exercise the extension in Chrome if browser tooling permits; otherwise clearly label browser integration as unverified.

## Limits
Initial support is for image elements, including image-only pages. Canvas, video, CSS backgrounds, screenshot scanning, and QR generation are outside scope. Images requiring special authentication, expired URLs, or protected browser pages may fail; report that failure without silently scanning something else. If an image contains several codes, use the single result returned by the decoder.
