class EventManager {
  constructor() {
    this.listeners = new Map();
    this.domListeners = new Map();
  }

  subscribe(eventType, delegatedListener) {
    if (Array.isArray(eventType)) {
      eventType.forEach((eType) => {
        if (!this.listeners.has(eType)) {
          const domListener = (e) => {
            this.listeners.get(eType)?.forEach((item) => {
              if (typeof item == "function") {
                item(e.detail);
              } else if (item.handleEvent) {
                item.handleEvent(e);
              }
            });
          };
          document.addEventListener(eType, domListener);
          this.domListeners.set(eType, domListener);
          this.listeners.set(eType, new Set());
        }

        this.listeners.get(eType).add(delegatedListener);
      });
    } else {
      if (!this.listeners.has(eventType)) {
        const domListener = (e) => {
          this.listeners.get(eventType)?.forEach((item) => {
            if (typeof item == "function") {
              item(e.detail);
            } else if (item.handleEvent) {
              item.handleEvent(e);
            }
          });
        };
        document.addEventListener(eventType, domListener);
        this.domListeners.set(eventType, domListener);
        this.listeners.set(eventType, new Set());
      }
      // console.log(this.listeners);
      this.listeners.get(eventType).add(delegatedListener);
    }

    return () => this.unsubscribe(eventType, delegatedListener);
  }

  unsubscribe(eventType, delegatedListener) {
    let listeners;

    if (Array.isArray(eventType)) {
      eventType.forEach((eType) => {
        listeners = this.listeners.get(eType);
        if (!listeners) return;

        listeners.delete(delegatedListener);

        if (listeners.size === 0) {
          document.removeEventListener(eType, this.domListeners.get(eType));
          this.domListeners.delete(eType);
          this.listeners.delete(eType);
        }
      });

    } else {
      listeners = this.listeners.get(eventType);
      if (!listeners) return;

      listeners.delete(delegatedListener);

      if (listeners.size === 0) {
        document.removeEventListener(eventType, this.domListeners.get(eventType));
        this.domListeners.delete(eventType);
        this.listeners.delete(eventType);
      }
    }
  }

  dispatch(eventType, detail) {
    document.dispatchEvent(new CustomEvent(eventType, detail));
  }

  destroy() {
    this.listeners.forEach((_, eventType) => {
      document.removeEventListener(eventType);
    });

    this.listeners.clear();
  }
}

export default new EventManager();
