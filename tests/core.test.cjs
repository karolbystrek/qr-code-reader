const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function context(files, extras = {}) {
  const ctx = vm.createContext({ URL, AbortController, setTimeout, clearTimeout, ...extras });
  for (const file of files) {
    const filename = path.join(__dirname, '../extension', file);
    if (fs.existsSync(filename)) vm.runInContext(fs.readFileSync(filename, 'utf8'), ctx);
  }
  return ctx;
}

test('only absolute HTTP and HTTPS destinations can be opened', () => {
  const ctx = context(['url.js']);
  assert.equal(typeof ctx.webUrl, 'function');
  assert.equal(ctx.webUrl(' https://example.com/path?q=1 '), 'https://example.com/path?q=1');
  assert.equal(ctx.webUrl('http://example.com'), 'http://example.com/');
  for (const text of ['javascript:alert(1)', 'data:text/html,test', 'file:///tmp/test', '/relative', 'hello', '', 'https://', 'https://user:password@example.com']) {
    assert.throws(() => ctx.webUrl(text));
  }
});

test('selected image decodes locally and rejects blank and non-web QR content', () => {
  const ctx = context(['vendor/jsQR.js', 'url.js', 'decode.js']);
  assert.equal(typeof ctx.decodePixels, 'function');
  for (const name of ['url', 'inverted', 'http']) {
    const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name + '.json')));
    assert.equal(ctx.decodePixels(new Uint8ClampedArray(Buffer.from(fixture.rgba, 'base64')), fixture.width, fixture.height), fixture.url);
  }
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/text.json')));
  assert.throws(() => ctx.decodePixels(new Uint8ClampedArray(Buffer.from(fixture.rgba, 'base64')), fixture.width, fixture.height), /web link/);
  assert.throws(() => ctx.decodePixels(new Uint8ClampedArray(100 * 100 * 4).fill(255), 100, 100), /No QR/);
});

test('image limits are enforced before allocating a canvas', () => {
  const ctx = context(['decode.js']);
  assert.equal(typeof ctx.checkDimensions, 'function');
  assert.doesNotThrow(() => ctx.checkDimensions(100, 100));
  for (const size of [[0, 100], [5000, 100], [4096, 4096]]) assert.throws(() => ctx.checkDimensions(...size));
});
