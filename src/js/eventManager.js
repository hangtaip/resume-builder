class EventManager {
  constructor() {
    this.listeners = new Map();
  }

  subscribe(eventType, delegatedListener) {
    const subscribeSingleType = (type) => {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, new Set());
      }
      this.listeners.get(type).add(delegatedListener);
    };

    if (Array.isArray(eventType)) {
      eventType.forEach(subscribeSingleType);
    } else {
      subscribeSingleType(eventType);
    }

    return () => this.unsubscribe(eventType, delegatedListener);
  }

  unsubscribe(eventType, delegatedListener) {
    const unsubscribeSingleType = (type) => {
      if (this.listeners.has(type)) {
        this.listeners.get(type).delete(delegatedListener);

        if (this.listeners.get(type).size === 0) {
          this.listeners.delete(type);
        }
      }
    };

    if (Array.isArray(eventType)) {
      eventType.forEach(unsubscribeSingleType);
    } else {
      unsubscribeSingleType(eventType);
    }
  }

  publish(eventType, data) {
    if (this.listeners.has(eventType)) {
      const customEvent = new CustomEvent(eventType, data);
      const currentListeners = [...this.listeners.get(eventType)];

      currentListeners.forEach(listener => {
        try {
          if (typeof listener === "function") {
            listener(customEvent);
          } else if (listener && typeof listener.handleEvent === "function") {
            listener.handleEvent(customEvent);
          }
        } catch(error) {
          console.error(`Error in listener for event '${eventType}':`, error);
        }
      });
    }
  }

  destroy() {
    this.listeners.forEach((_, eventType) => {
      this.listeners.delete(eventType);
    });

    this.listeners.clear();
  }
}

export default new EventManager();
