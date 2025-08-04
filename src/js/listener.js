const delegates = new WeakSet;

export default class DelegatedListener{
  constructor(delegated) {
    this.delegated = delegated;
  }

  // TODO: i forgot what is obj
  getDelegates(obj) {
    return delegates.has(obj);
  }

  setDelegates(obj) {
    delegates.add(obj);
  }

  checkDelegates() {
    return delegates;
  }

  handleEvent(event) {
    const eventType = `${event.type.slice(0,1).toUpperCase()}${event.type.slice(1)}`;
    this.delegated[`handle${eventType}`](event, this);
  }
}
