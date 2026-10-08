const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function worker(replies = [], creationError = false) {
  const opened = [], notifications = [], menus = [], sent = [];
  const listeners = {};
  let exists = false;
  const chrome = {
    runtime: {
      id: 'test', getURL: name => 'chrome-extension://test/' + name,
      onInstalled: { addListener: fn => { listeners.install = fn; } },
      getContexts: async () => exists ? [{}] : [],
      sendMessage: async message => {
        sent.push(message.imageUrl);
        const reply = replies.shift();
        if (reply instanceof Error) throw reply;
        return reply;
      }
    },
    contextMenus: {
      removeAll: async () => {},
      create: (menu, callback) => { menus.push(menu); callback?.(); },
      onClicked: { addListener: fn => { listeners.click = fn; } }
    },
    offscreen: { createDocument: async () => {
      if (creationError) throw new Error('Cannot create decoder.');
      exists = true;
    } },
    tabs: { create: async ({ url }) => { opened.push(url); } },
    notifications: { create: async notification => { notifications.push(notification); } }
  };
  const ctx = vm.createContext({ chrome, URL, console });
  ctx.importScripts = (...files) => {
    for (const file of files) vm.runInContext(fs.readFileSync(path.join(__dirname, '../extension', file), 'utf8'), ctx);
  };
  const filename = path.join(__dirname, '../extension/background.js');
  if (fs.existsSync(filename)) vm.runInContext(fs.readFileSync(filename, 'utf8'), ctx);
  return { listeners, opened, notifications, menus, sent };
}

test('registers exactly one image command', async () => {
  const state = worker();
  assert.equal(typeof state.listeners.install, 'function');
  await state.listeners.install();
  assert.equal(state.menus.length, 1);
  assert.equal(state.menus[0].title, 'Open QR link');
  assert.deepEqual(Array.from(state.menus[0].contexts), ['image']);
});

test('concurrent clicks open their own URLs in order', async () => {
  const state = worker([{ url: 'https://example.com/one' }, { url: 'http://example.com/two' }]);
  assert.equal(typeof state.listeners.click, 'function');
  await Promise.all(['first', 'second'].map(srcUrl => state.listeners.click({ menuItemId: 'open-qr-link', srcUrl })));
  assert.deepEqual(state.opened, ['https://example.com/one', 'http://example.com/two']);
  assert.deepEqual(state.sent, ['first', 'second']);
});

test('invalid decoder replies and loading failures notify without navigation; queue recovers', async () => {
  const state = worker([{ url: 'javascript:alert(1)' }, { error: 'No QR code found.' }, new Error('Decoder unavailable.'), { url: 'https://example.com/' }]);
  assert.equal(typeof state.listeners.click, 'function');
  for (let i = 0; i < 4; i++) await state.listeners.click({ menuItemId: 'open-qr-link', srcUrl: 'image' });
  assert.deepEqual(state.opened, ['https://example.com/']);
  assert.equal(state.notifications.length, 3);
});

test('offscreen creation failure produces a notification', async () => {
  const state = worker([], true);
  assert.equal(typeof state.listeners.click, 'function');
  await state.listeners.click({ menuItemId: 'open-qr-link', srcUrl: 'image' });
  assert.equal(state.opened.length, 0);
  assert.equal(state.notifications.length, 1);
});

test('unrelated menu events do nothing', async () => {
  const state = worker();
  assert.equal(typeof state.listeners.click, 'function');
  await state.listeners.click({ menuItemId: 'other', srcUrl: 'image' });
  assert.equal(state.sent.length, 0);
  assert.equal(state.notifications.length, 0);
});
