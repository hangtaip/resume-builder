import Listener from '../js/listener.js';
import { defaults } from './defaults.js';

class Router {
  constructor() {
    console.log(`${this.constructor.name}: loaded`);
    this.dir = "pages";
    this.routes = {};
    this.basePath = document.querySelector("base")?.getAttribute("href") || "/";
    this.listeners;
    this.context = {
      pages: require.context('../pages', true, /\.\/([^\/]+)\/\1\.js$/),
    };
    this.container = document.body;
    //this.handlePopState = this.handlePopState.bind(this);
  }

  init() {
    this.constructRoutes(this.dir);
    this.setupEventListeners();
  }

  // importAll(r) {
  //   r.keys().forEach((key) => (this.page[key] = r( key )));
  // }

  constructRoutes() {
    const context = this.context[this.dir];
    const folderNames = context.keys().map(path => {
      const match = path.match(/\.\/([^\/]+)\/\1\.js$/);
      return match ? match[1] : null;
    }).filter(name => name !== null);

    let currentPath = "";
    if (window.location.host.includes("github")) {
      currentPath += `${defaults.projectName}/`;
    }

    this.routes = folderNames.map(name => {
      return {
        path: `/${currentPath}${name == "home" ? "" : name}`,
        component: `resume-${name}`,
        folder: name,
        file: name, 
      }
    });
  }

  setupEventListeners() {
    this.listeners = new Listener(this);
    this.listeners.setDelegates(this);

    window.addEventListener("popstate", this.listeners);
    document.addEventListener("DOMContentLoaded", this.listeners);
  }

  handleDOMContentLoaded(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      const redirectPath = sessionStorage.getItem("redirect");

      if (redirectPath) {
        sessionStorage.removeItem("redirect");
        thin.navigate(redirectPath);
      } else {
        this.render();
      }
    } else {
      console.log("external");
    }
  }

  handlePopstate(event, delegated) {
    console.log(event);
  }

  render() {
    const currentPath = window.location.pathname;
    const relativePath = currentPath.startsWith(this.basePath) ? currentPath.substring(this.basePath.length - 1) : currentPath;
     
    const route = this.routes.find(r => r.path === relativePath);
    let page;

    this.container.innerHTML = ""; 

    if (route) {
      this.importPage(route);
      page = document.createElement(route.component);
    } else {
      this.importPage({
        component: "not-found",
        folder: "home",
        file: "notFound",
      });
      page = document.createElement("not-found");
    }

    this.container.append(page);
  }

  async importPage(route) {
    if (!customElements.get(route.component)) {
      await import(
        /* webpackChunkNames: "[request]" */
        /* webpackPrefetch: true */
        `../pages/${route.folder}/${route.file}.js`
      )
    }
  } 

  // setupEventListeners(obj, dom) {
  //   this.listenerFrom = new Listener(obj);
  //   this.listenerFrom.setDelegates(this.listenerFrom); 
  //
  //   this.listener = new Listener(this);
  //
  //   //window.addEventListener('popstate', this.handlePopState);
  //   window.addEventListener('popstate', this.listener);
  //
  //   Array.from(dom).forEach((el) => {
  //     el.addEventListener('click', this.listenerFrom);
  //   });
  // }

  async handlepopstate(event) {
    const path = window.location.pathname.slice(1) || 'home';
    if (path != this.currentPath) {
      await this.loadPage(path);
    }
  }

  navigate(path) {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      this.render();
    }
  }
}

export default new Router();
