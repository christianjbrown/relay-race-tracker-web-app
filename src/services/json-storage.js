/**
 * JSON in and out of browser storage. Storage can be missing, full or
 * refused (private browsing), and none of that should stop the page: a
 * failed read is null and a failed write is simply not kept.
 */
export class JsonStorage {
  constructor(backend) {
    this.backend = backend;
  }

  read(key) {
    try {
      return JSON.parse(this.backend.getItem(key));
    } catch {
      return null;
    }
  }

  write(key, value) {
    try {
      this.backend.setItem(key, JSON.stringify(value));
    } catch {
      // Not kept; it is only a cache.
    }
  }
}
