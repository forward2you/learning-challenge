(function (root) {
  'use strict';
  function create(getStorage) {
    return {
      read(key, cleaner) {
        let raw;
        try { raw = getStorage().getItem(key); }
        catch { return { value: [], status: 'unavailable' }; }
        if (raw === null) return { value: [], status: 'ok' };
        try {
          const parsed = JSON.parse(raw), value = cleaner(parsed);
          const validCount = Array.isArray(parsed) ? parsed.reduce((count, entry) => count + cleaner([entry]).length, 0) : 0;
          return { value, status: Array.isArray(parsed) && validCount === parsed.length ? 'ok' : 'recovered' };
        } catch { return { value: [], status: 'recovered' }; }
      },
      write(key, value) {
        try { getStorage().setItem(key, JSON.stringify(value)); return { saved: true }; }
        catch { return { saved: false }; }
      }
    };
  }
  const api = { create };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StorageAdapter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
