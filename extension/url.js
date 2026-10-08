function webUrl(text) {
  let url;
  try { url = new URL(text.trim()); } catch { throw new Error('The QR code does not contain a web link.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('The QR code does not contain a supported web link.');
  }
  return url.href;
}
