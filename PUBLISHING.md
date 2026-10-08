# Package and publish QR Code Reader

## Create the upload ZIP

Run from the repository root:

```sh
cd extension
zip -r ../qr-code-reader-1.0.0.zip . -x '*.DS_Store'
cd ..
```

Upload this ZIP, not the entire repository or a CRX from Chrome's **Pack extension** button. `manifest.json` must be at the ZIP root. The package includes the bundled decoder and its license, but excludes tests, documentation, and Git files. No build is needed.

For later updates, increase the version in `extension/manifest.json`, create a new ZIP, and upload it to the existing store item.

## Submit to the Chrome Web Store

1. Register at the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole), pay the one-time registration fee, and complete the account setup requested by Google.
2. Choose **Add new item** and upload the ZIP.
3. Complete **Store listing**: name, description, category, language, icon, screenshots demonstrating the right-click action, and any required promotional image. Use the current dimensions displayed by the dashboard. The extension's 128px icon is `extension/icon.png`.
4. Complete **Privacy practices**, including single purpose, permission explanations, remote-code declaration, data disclosures, and a publicly accessible privacy-policy URL. [PRIVACY.md](PRIVACY.md) supplies policy text you can host on your website or another public page. This GitHub repository is private, so its file URL cannot serve as a public privacy-policy link.
5. Complete **Distribution** and any requested publisher/contact details. Public distribution lets everyone find it; unlisted distribution lets people install through its link.
6. Submit for review. You can choose to publish automatically after approval or publish manually afterward. Uploading a ZIP alone does not publish it.

## Suggested listing text

**Single purpose:** Read a QR code from a user-selected image and open its HTTP or HTTPS link in a new tab.

**Description:** Right-click a QR-code image and choose Open QR link. QR Code Reader decodes the image locally and opens its web link in a new tab. No settings, history, tracking, or remote decoding service.

## Permission explanations

| Permission | Suggested explanation |
| --- | --- |
| `contextMenus` | Adds the Open QR link command to the image right-click menu. |
| `offscreen` | Uses a hidden extension document and canvas to decode the selected image locally. |
| `notifications` | Displays an error when an image cannot be read or contains no supported QR web link. |
| HTTP/HTTPS host access | Downloads only the image selected through the context-menu command, including images hosted on a different domain from the page. Arbitrary image hosts are necessary for the extension's single purpose. There is no automatic page scanning. |

**Remote code:** No. All JavaScript, including jsQR, is bundled in the ZIP.

**Data practices:** The selected image URL, image pixels, and decoded text are processed temporarily on the user's computer. No data is sent to the developer or an analytics/decoding service and no results are stored. Fetching the image contacts its original host, and opening the link contacts the destination website. Make the dashboard declarations match this behavior and the public policy.

Broad host access requires a clear justification and may receive additional review. Approval is Google's decision.

## Official instructions

- [Prepare the extension and ZIP](https://developer.chrome.com/docs/webstore/prepare)
- [Register a developer account](https://developer.chrome.com/docs/webstore/register)
- [Publish an item](https://developer.chrome.com/docs/webstore/publish)
- [Complete privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
