import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';

class LocalStorageMock {
  constructor() {
    this.map = new Map();
  }

  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }

  setItem(key, value) {
    this.map.set(String(key), String(value));
  }

  removeItem(key) {
    this.map.delete(String(key));
  }

  clear() {
    this.map.clear();
  }
}

class WindowMock extends EventEmitter {
  addEventListener(type, listener) {
    this.on(type, listener);
  }

  removeEventListener(type, listener) {
    this.off(type, listener);
  }

  dispatchEvent(event) {
    this.emit(event.type, event);
    return true;
  }
}

if (!globalThis.localStorage) {
  globalThis.localStorage = new LocalStorageMock();
}

if (!globalThis.window) {
  globalThis.window = new WindowMock();
}

if (!globalThis.CustomEvent) {
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  };
}

const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : String(input?.url || '');
  if (url.startsWith('/assets/mock/')) {
    const absolute = path.resolve(process.cwd(), `src${url}`);
    if (!fs.existsSync(absolute)) {
      return new Response('Not Found', { status: 404 });
    }
    return new Response(fs.readFileSync(absolute, 'utf8'), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  return nativeFetch(input, init);
};
