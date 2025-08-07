import DOMPurify from "dompurify";
import Listener from "../../../../js/listener.js";
// import yaml from "../../data/data.yaml";
import country_codes from "../../../../data/country_codes.yaml";
import { registerCustomElement } from "../../../../js/registerComponent.js";
// import styles from "./details.shadow.scss";
import { icon, library } from "@fortawesome/fontawesome-svg-core";
import {
  faCalendarDays,
  faDoorOpen,
  faEnvelope,
  faHouseUser,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { faGithub, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import eventManager from "../../../../js/eventManager.js";
import objectRegistry from "../../../../js/objectRegistry.js";

export default class UserDetails extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.isReadyPromise = new Promise(resolve => {
      this.resolveReady = resolve;
    });
    this.formRequestPromise = new Promise(resolve => {
      this.resolveFormRequestReady = resolve;
    });
    this.listener;
    this.styleType = this.dataset.style || "default";
    this.handleFillResumeComponent = this.handleFillResumeComponent.bind(this);
    this.unsubscribe;
    library.add(
      faCalendarDays,
      faEnvelope,
      faGithub,
      faHouseUser,
      faUser,
      faWhatsapp,
    ); 
  }

  connectedCallback() {
    this.setupEventListener();
    // this.testRender();
    this.render().then(() => {
      this.resolveReady();
    });
    this.styling();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  async render() {
    const calendar = icon(faCalendarDays, { classes: ["fa-calender", "icon"] });
    const github = icon(faGithub, { classes: ["fa-github", "icon"] });
    const house = icon(faHouseUser, { classes: ["fa-house", "icon"] });
    const mail = icon(faEnvelope, { classes: ["fa-envelope", "icon"] });
    const rezeki = icon(faDoorOpen, { classes: ["fa-doorOpen", "icon"] });
    const user = icon(faUser, { classes: ["fa-user", "icon"] });
    const whatsapp = icon(faWhatsapp, { classes: ["fa-whatsapp", "icon"] });
    // const getCC = (obj) => {
    //   return `+${country_codes[obj]}`;
    // };

    const dom = `
      <div class="container">
        <div class="pic">
          <user-pic></user-pic>
        </div>
        <div class="info">
          <div class="attr">
            <div class="field">
              ${user.node[0].outerHTML}
              <span class="data" data-attr="name"></span>
            </div>
          </div>
          <div class="attr">
            <div class="field">
              ${calendar.node[0].outerHTML}
              <span class="data" data-attr="yob"></span>
            </div>
          </div>
          <div class="attr">
            <div class="field">
              ${whatsapp.node[0].outerHTML}
              <span class="data" data-attr="contact"></span>
            </div>
          </div>
          <div class="attr">
            <div class="field">
              ${mail.node[0].outerHTML}
              <span class="data" data-attr="email"></span>
            </div>
          </div>
          <div class="attr">
            <div class="field">
              ${github.node[0].outerHTML}
              <span class="data" data-attr="github"></span>
            </div>
          </div>
          <div class="attr">
            <div class="field">
              ${house.node[0].outerHTML}
              <span class="data" data-attr="location"></span>
            </div>
          </div>
          <div class="attr">
            <div class="field">
              ${rezeki.node[0].outerHTML}
              <span class="data" data-attr="seek"></span>
            </div>
          </div>
        </div>
        <div class="motto">
          <div class="field">
            <p class="data" data-attr="motto"></p>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.innerHTML = DOMPurify.sanitize(dom);

    const images = this.shadowRoot.querySelectorAll("img");
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => { 
        img.onload = resolve; 
        img.onerror = resolve; 
      });
    });

    await Promise.all(imagePromises);
    await new Promise(resolve => requestAnimationFrame(() => resolve()));
  }

  async styling() {
    const sheet = new CSSStyleSheet();
    // sheet.replaceSync(styles);
    //const cssModule = import('./details.shadow.scss');
    // sheet.replaceSync(styles.toString());
    // styles.use({ target: this.shadowRoot });
    const style = await import(`./details-${this.styleType}.shadow.scss`);
    sheet.replaceSync(style.default);
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  setupEventListener() {
    this.listener = new Listener(this);
    this.listener.setDelegates(this);
    this.unsubscribe = eventManager.subscribe("fillResumeComponent", this.listener);
  }

  async handleFillResumeComponent(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      let contact = [];

      this.shadowRoot.querySelectorAll(".field").forEach(node => { 
        node.querySelector(".data").textContent = event.detail.data.owner[node.querySelector(".data").dataset.attr];
      });

      this.shadowRoot.querySelector(`.field [data-attr="contact"]`).textContent = `${this.getCC(event.detail.data.owner.country_code)} ${event.detail.data.owner.tel}`;

      if (Object.values(event.detail.data.owner.skills).length > 9) {
        this.shadowRoot.querySelector(".container").classList.add("all-fullWidth");
      }

      await new Promise(resolve => requestAnimationFrame(() => resolve())).then(() => {
        this.resolveFormRequestReady();
      });
    } else {
      console.log("external");
    } 
  }

  // testRender() {
  //   const calendar = icon(faCalendarDays, { classes: ["fa-calender", "icon"] });
  //   const github = icon(faGithub, { classes: ["fa-github", "icon"] });
  //   const house = icon(faHouseUser, { classes: ["fa-house", "icon"] });
  //   const mail = icon(faEnvelope, { classes: ["fa-envelope", "icon"] });
  //   const rezeki = icon(faDoorOpen, { classes: ["fa-doorOpen", "icon"] });
  //   const user = icon(faUser, { classes: ["fa-user", "icon"] });
  //   const whatsapp = icon(faWhatsapp, { classes: ["fa-whatsapp", "icon"] });
  //   const getCC = (obj) => {
  //     return `+${country_codes[obj]}`;
  //   };
  //
  //   const dom = `
  //     <div class="container">
  //       <div class="pic">
  //         <user-pic></user-pic>
  //       </div>
  //       <div class="info">
  //         <div class="attr">
  //           <div class="field">
  //             ${user.node[0].outerHTML}
  //             <span class="data" data-attr="name">${yaml.owner.name}</span>
  //           </div>
  //         </div>
  //         <div class="attr">
  //           <div class="field">
  //             ${calendar.node[0].outerHTML}
  //             <span class="data" data-attr="yob">${yaml.owner.yob}</span>
  //           </div>
  //         </div>
  //         <div class="attr">
  //           <div class="field">
  //             ${whatsapp.node[0].outerHTML}
  //             <span class="data" data-attr="contact">${this.getCC(yaml.owner.country_code)} ${yaml.owner.tel}</span>
  //           </div>
  //         </div>
  //         <div class="attr">
  //           <div class="field">
  //             ${mail.node[0].outerHTML}
  //             <span class="data" data-attr="email">${yaml.owner.email}</span>
  //           </div>
  //         </div>
  //         <div class="attr">
  //           <div class="field">
  //             ${github.node[0].outerHTML}
  //             <span class="data" data-attr="github">${yaml.owner.github}</span>
  //           </div>
  //         </div>
  //         <div class="attr">
  //           <div class="field">
  //             ${house.node[0].outerHTML}
  //             <span class="data" data-attr="location">${yaml.owner.location}</span>
  //           </div>
  //         </div>
  //         <div class="attr">
  //           <div class="field">
  //             ${rezeki.node[0].outerHTML}
  //             <span class="data" data-attr="seek">${yaml.owner.seek}</span>
  //           </div>
  //         </div>
  //       </div>
  //       <div class="motto">
  //         <div>
  //           <p data-attr="motto">
  //             ${yaml.owner.motto}
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //   `;
  //
  //   this.shadowRoot.innerHTML = DOMPurify.sanitize(dom)
  // }

  getCC(obj) {
      return country_codes[obj] ? `+${country_codes[obj]}` : "";
  }; 

  async publishCustomEvent(data) {
    try {
      if (data.await) {
        await data.awaitDetail();
      }

      const eventDetail = {
        bubbles: true,
        composed: true,
        detail: data.details,
      };

      eventManager.publish(data.eventName, eventDetail);
    } catch (err) {
      console.error(`Failed to publish ${data.eventName} : ${err}`);
    }
  }
}

//customElements.define('user-details', UserDetails);
registerCustomElement("user-details", UserDetails);
