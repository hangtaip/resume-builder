class EventHandler {
  constructor() {
    this.handlers = {};
  }

  addHandler(eventType, fn) {
    if (!this.handlers[eventType]) {
      this.handlers[eventType] = [];
    }
    this.handlers[eventType].push(fn)
    this.handlers[eventType] = fn;
  }

  attachTo(target) {
    Object.entries(this.handlers).forEach(([eventName, handlers]) => {
      const methodName = `handle${eventName.charAt(0).toUpperCase() + eventType.slice(1)}`;

      target[methodName] = (...args) => {
        handlers.forEach(handler => handler.call(target, ...args));
      };
    });
  }
}

export default new EventHandler();
