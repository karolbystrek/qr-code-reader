importScripts('url.js');

chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.contextMenus.removeAll();
    chrome.contextMenus.create({ id: 'open-qr-link', title: 'Open QR link', contexts: ['image'] }, () => {
      if (chrome.runtime.lastError) console.error(chrome.runtime.lastError.message);
    });
  } catch (error) { console.error(error); }
});

let queue = Promise.resolve();
function handleClick(info) {
  if (info.menuItemId !== 'open-qr-link') return;
  queue = queue.then(async () => {
    try {
      const contexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [chrome.runtime.getURL('offscreen.html')]
      });
      if (!contexts.length) {
        await chrome.offscreen.createDocument({
          url: 'offscreen.html', reasons: ['BLOBS'],
          justification: 'Load the selected image into a canvas and decode its QR code locally.'
        });
      }
      const result = await chrome.runtime.sendMessage({ target: 'offscreen', imageUrl: info.srcUrl });
      if (result?.error) throw new Error(result.error);
      await chrome.tabs.create({ url: webUrl(result?.url) });
    } catch (error) {
      try {
        await chrome.notifications.create({
          type: 'basic', iconUrl: 'icon.png', title: 'QR Code Reader',
          message: error.message || 'Could not read this image.'
        });
      } catch (notificationError) { console.error(notificationError); }
    }
  });
  return queue;
}
chrome.contextMenus.onClicked.addListener(handleClick);
