# QR Code Reader

A minimal Chrome extension to open QR links from the right-click menu.

Right-click an image, choose **Open QR link**, and its HTTP or HTTPS destination opens in a new tab. All decoding happens locally. No popup, settings, history, analytics, or QR decoding service.

## Install locally

Requires desktop Chrome 116 or newer. No build or package installation needed.

1. Clone: `git clone https://github.com/karolbystrek/qr-code-reader.git`
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select `qr-code-reader/extension`.
4. Right-click a QR image and choose **Open QR link**.

After editing extension files, click **Reload** on its card in `chrome://extensions`.

## Permissions and limitations

HTTP/HTTPS website access allows fetching the selected image even when its server differs from the page's server. Fetching contacts the original image server, without cookies or authentication credentials. The extension does not read your browsing history, scan pages automatically, send images to a decoder service, or store results.

`contextMenus` adds the command, `offscreen` supplies a hidden canvas for local decoding, and `notifications` displays errors. Allow Chrome notifications in your operating system to see these errors.

The command appears on all images: Chrome cannot know which images contain QR codes before decoding them. Non-QR images and non-web QR content produce a brief error. Only HTTP/HTTPS destinations without embedded usernames/passwords are opened; the extension does not judge whether a destination website is trustworthy.

Canvas, video, CSS backgrounds, screenshots, local files, and page-bound `blob:` images are outside this version's scope. Protected, expired, or authenticated image URLs may fail. Images are limited to 10 MB, 4096 pixels per dimension, and 16 million pixels; loading times out after 15 seconds. If an image contains several codes, only the first decoder result is used.

## Test before pushing

See [TESTING.md](TESTING.md) for automated checks and the manual Chrome checklist. No package installation or build step is required; `npm test` uses Node's built-in test runner.

## Decoder

Includes jsQR 1.4.0, obtained from its published npm package. Its Apache-2.0 license is in [extension/vendor/LICENSE](extension/vendor/LICENSE). Runtime code is bundled; it is never downloaded during use.
