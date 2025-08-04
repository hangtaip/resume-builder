class ObjectRegistry {
  constructor() {
    this.registry = new Map();
  }

  set(key, value) {
    this.registry.set(key, value);
  }

  get(key) {
    return this.registry.get(key);
  }

  clear() {
    this.registry.forEach((_, key) => this.registry.delete(key));
  }
}

export default new ObjectRegistry();
