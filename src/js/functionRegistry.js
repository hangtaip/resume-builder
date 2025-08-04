class FunctionRegistry {
  constructor() {
    this.registry = {};
  }

  register(event, name, fn) {
    this.registry[event] ||= {};
    this.registry[event][name] = fn;
  }

  get(event, name) {
    return this.registry[event][name];
  }

  execute(event, name, ...args) {
    const func = this.get(event, name);
    if (func) return func(...args);
    throw new Error(`Function "${event}:${name}" not found`);
  }

  attachTo(event, name, target) {
    const methodName = `handle${event.charAt(0).toUpperCase()}${event.slice(1)}`;

    if (this.registry[event][name]) {
      target[methodName] = this.registry[event][name];
    }
  }
}

export const registry = new FunctionRegistry();

export default FunctionRegistry;
