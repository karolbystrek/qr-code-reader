const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function loader({ response = new Response(new Uint8Array(100)), width = 100, decodeError, timeout = false, stallDecode = false } = {}) {
  let allocated = false, revoked = false, aborted = false;
  class Image {
    naturalWidth = width;
    naturalHeight = 100;
    set src(value) { if (value) queueMicrotask(() => decodeError ? this.onerror?.() : this.onload?.()); }
    async decode() {
      if (stallDecode) return new Promise(() => {});
      if (decodeError) throw decodeError;
    }
  }
  class TestURL extends URL {
    static createObjectURL() { return 'blob:test'; }
    static revokeObjectURL() { revoked = true; }
  }
  const ctx = vm.createContext({
    URL: TestURL, AbortController, Image, TypeError, Blob,
    setTimeout: fn => setTimeout(fn, timeout ? 0 : 1000), clearTimeout,
    fetch: async (url, { signal, credentials }) => {
      assert.equal(credentials, 'omit');
      signal.addEventListener('abort', () => { aborted = true; });
      if (timeout) return new Promise(() => {});
      if (response instanceof Error) throw response;
      return response;
    },
    document: { createElement: () => {
      allocated = true;
      return { getContext: () => ({ fillRect() {}, drawImage() {}, getImageData: () => ({ data: [] }) }) };
    } }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../extension/decode.js'), 'utf8'), ctx);
  ctx.jsQR = () => ({ data: 'https://example.com/' });
  ctx.webUrl = text => new URL(text).href;
  return { read: () => ctx.readQR('https://images.example.test/qr.png'), state: () => ({ allocated, revoked, aborted }), ctx };
}

test('successful image loading decodes and releases the temporary URL', async () => {
  const fixture = loader();
  assert.equal(await fixture.read(), 'https://example.com/');
  assert.deepEqual(fixture.state(), { allocated: true, revoked: true, aborted: false });
});

test('oversized dimensions reject before canvas allocation and release the image', async () => {
  const fixture = loader({ width: 5000 });
  await assert.rejects(fixture.read(), /too large/);
  assert.deepEqual(fixture.state(), { allocated: false, revoked: true, aborted: false });
});

test('network failure and non-image content return a readable error', async () => {
  await assert.rejects(loader({ response: new TypeError('fetch failed') }).read(), /protected or unavailable/);
  await assert.rejects(loader({ decodeError: { name: 'EncodingError' } }).read(), /protected or unavailable/);
  await assert.rejects(loader({ response: { ok: false } }).read(), /Could not load/);
  await assert.rejects(loader({ response: new Response(new Uint8Array(10000001)) }).read(), /too large/);
});

test('slow loads time out and abort the request', async () => {
  const fixture = loader({ timeout: true });
  await assert.rejects(fixture.read(), /timed out/);
  assert.equal(fixture.state().aborted, true);
});

test('unsupported image schemes never load', async () => {
  const fixture = loader();
  await assert.rejects(fixture.ctx.readQR('file:///tmp/qr.png'), /not supported/);
  await assert.rejects(fixture.ctx.readQR('blob:https://example.com/abc'), /not supported/);
});

test('large streamed responses are cancelled before buffering the full body', async () => {
  let cancelled = false;
  const response = {
    ok: true, headers: { get: () => 'image/png' },
    blob: async () => ({ size: 100 }),
    body: { getReader: () => ({
      read: async () => ({ value: new Uint8Array(6000000), done: false }),
      cancel: async () => { cancelled = true; },
      releaseLock() {}
    }) }
  };
  await assert.rejects(loader({ response }).read(), /too large/);
  assert.equal(cancelled, true);
});

test('image load events work when decode() stalls in a hidden document', async () => {
  assert.equal(await loader({ stallDecode: true }).read(), 'https://example.com/');
});
