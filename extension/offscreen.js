chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message.target !== 'offscreen' || sender.id !== chrome.runtime.id) return;
  readQR(message.imageUrl).then(
    url => respond({ url }),
    error => respond({ error: error.message || 'Could not read this image.' })
  );
  return true;
});
