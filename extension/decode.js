function checkDimensions(width, height) {
  if (!width || !height || width > 4096 || height > 4096 || width * height > 16000000) {
    throw new Error('This image is too large or has invalid dimensions.');
  }
}

function decodePixels(pixels, width, height) {
  const code = jsQR(pixels, width, height, { inversionAttempts: 'attemptBoth' });
  if (!code) throw new Error('No QR code found in this image.');
  return webUrl(code.data);
}

async function imageBlob(response) {
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 10000000) {
        await reader.cancel();
        throw new Error('This image file is too large.');
      }
      chunks.push(value);
    }
    return new Blob(chunks, { type: response.headers.get('content-type') || '' });
  } finally { reader.releaseLock(); }
}

async function readQR(imageUrl) {
  const source = new URL(imageUrl);
  if (!['http:', 'https:', 'data:'].includes(source.protocol)) {
    throw new Error('This image source is not supported.');
  }
  const controller = new AbortController();
  const image = new Image();
  let objectUrl;
  let timer;
  try {
    return await Promise.race([
      (async () => {
        const response = await fetch(source.href, { signal: controller.signal, credentials: 'omit' });
        if (!response.ok) throw new Error('Could not load this image.');
        const blob = await imageBlob(response);
        if (controller.signal.aborted) throw new Error('Loading this image timed out.');
        objectUrl = URL.createObjectURL(blob);
        // Image.decode() can stall in an offscreen document; load events still fire.
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = () => reject(new Error('Could not read this image. It may be protected or unavailable.'));
          image.src = objectUrl;
        });
        if (controller.signal.aborted) throw new Error('Loading this image timed out.');
        checkDimensions(image.naturalWidth, image.naturalHeight);
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        return decodePixels(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error('Loading this image timed out.'));
        }, 15000);
      })
    ]);
  } catch (error) {
    if (error instanceof TypeError || error.name === 'EncodingError') {
      throw new Error('Could not read this image. It may be protected or unavailable.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
    image.onload = null;
    image.onerror = null;
    image.src = '';
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
