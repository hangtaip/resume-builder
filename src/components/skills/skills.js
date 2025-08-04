import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
// import yaml from "../../data/data.yaml";
import { registerCustomElement } from "../../js/registerComponent.js";
import { toDataURL } from "../../js/dataURL.js";
// import styles from "./skills.shadow.scss";
import { icon, library } from "@fortawesome/fontawesome-svg-core";
import { faCode } from "@fortawesome/free-solid-svg-icons";
import eventManager from "../../js/eventManager.js";
import { isNullUndefinedOrEmpty } from "../../js/helper.js";
import objectRegistry from "../../js/objectRegistry.js";

export default class UserSkills extends HTMLElement {
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
    this.customEventData = {
      await: false,
      awaitDetail() {
        return 0;
      },
      eventName: "handleCustomEvent",
      details: "",
    };
    this.styleType = this.dataset.style || "default";
    this.handleCompleteFormRequest = this.handleCompleteFormRequest.bind(this);
    this.unsubscribe;
    library.add(faCode);
  }

  async connectedCallback() {
    this.setupEventListener();
    // await this.testRender();
    this.render().then(() => {
      this.resolveReady();
    });
    this.styling();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  // TODO:
  // - logoColor to handle more languages
  // - labelName to handle more languages
  // - have a list to match them
  async render() { 
    const i = icon(faCode, {
      classes: ["fa-code"],
    });

    const dom = `
      <div class="container">
        <h3 class="header">
          ${i.node[0].outerHTML}
          <span class="title">Skills</span>
        </h3>
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

  async appendData(data) {
    const skills = data;
    const logoColor = (obj) =>
      obj.name.toLowerCase() == "javascript" ? "black" : "white";
    const labelName = (obj) =>
      obj.name.toLowerCase() == "csharp" ? "C%23" : obj.name;
    const skillImg = async (obj) => {
      if (isNullUndefinedOrEmpty(obj.name)) { return }

      if (Object.hasOwn(obj, "icon")) {
        const badgeUrl = await toDataURL(obj.icon).then((dataURL) => {
          const part = dataURL.split(",");
          const mimeType = part[0].split(":")[1].split(";")[0];
          const startMime = part[0].split("/").shift();
          const endMime = part[0].split(";").pop();
          const fileType = mimeType.split("/").pop();
          const encodedFileType = encodeURIComponent(fileType);
          const encodedData = encodeURIComponent(part[1]);
          const badgeUrl = `https://img.shields.io/badge/${labelName(
            obj,
          )}-%23${obj.color}?style=for-the-badge&logo=${startMime}/${encodedFileType};${endMime},${encodedData}&logoColor=${logoColor(
            obj,
          )}`;

          return badgeUrl;
        });

        return new Promise((resolve) => {
          resolve(`
            <img alt="${obj.name}" src="${badgeUrl}" class="badge">
          `);
        });
      } else {
        return new Promise((resolve) => {
          resolve(`
            <img alt="Static Badge" src="https://img.shields.io/badge/${labelName(
              obj,
            )}-%23${obj.color.toString().replace(/^#/, "")}?style=for-the-badge&logo=${obj.name}&logoColor=${logoColor(
              obj,
            )}" class="badge">
          `);
        });
      }
    };
    const imgPromises = Object.values(skills).map((skill) => skillImg(skill));
    const skillDom = await Promise.all(imgPromises);
    this.skillsCount = imgPromises.length;
    // const skillDom = Object.values(skills).map((skill) => {
    //   //<img class="img" src="${skill.icon}" alt="${skill.name.toLowerCase()}" />
    //   {/* <div class="card"> */}
    //   {/*   <span class="body">${skill.name}</span> */}
    //   {/* </div> */}
    //
    //   return `
    //     <img alt="Static Badge" src="https://img.shields.io/badge/${
    //     labelName(skill)
    //   }-%23${skill.color}?style=for-the-badge&logo=${skill.name}&logoColor=${
    //     logoColor(skill)
    //   }">
    //   `;
    // });

    skillDom.unshift('<div class="body">');
    skillDom.push("</div>");

    const container = new DOMParser().parseFromString(DOMPurify.sanitize(skillDom.join(" ")), "text/html");
    const fragments = new DocumentFragment();
    while(container.body.firstChild) {
      fragments.append(container.body.firstChild);
    }

    this.shadowRoot.querySelector(".container").append(fragments); 
  }

  async styling() {
    const sheet = new CSSStyleSheet();
    // sheet.replaceSync(styles);
    // sheet.replaceSync(styles.toString());
    // styles.use({ target: this.shadowRoot });
    const style = await import(`./skills-${this.styleType}.shadow.scss`);
    sheet.replaceSync(style.default);
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  setupEventListener() {
    this.listener = new Listener(this);
    this.listener.setDelegates(this);
    this.unsubscribe = eventManager.subscribe("completeFormRequest", this.listener);
  }

  async handleCompleteFormRequest(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      // this.render(event.detail.data.owner.skills);
      this.appendData(event.detail.data.owner.skills);

      await new Promise(resolve => requestAnimationFrame(() => resolve())).then(() => {
        this.resolveFormRequestReady();
      });
    } else {
      console.log("external");
    }
  } 

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

  // async testRender() {
  //   const skills = yaml.owner.skills;
  //   const logoColor = (obj) =>
  //     obj.name.toLowerCase() == "javascript" ? "black" : "white";
  //   const labelName = (obj) =>
  //     obj.name.toLowerCase() == "csharp" ? "C%23" : obj.name;
  //   const skillImg = async (obj) => {
  //     if (Object.hasOwn(obj, "icon")) {
  //       const badgeUrl = await toDataURL(obj.icon).then((dataURL) => {
  //         const part = dataURL.split(",");
  //         const mimeType = part[0].split(":")[1].split(";")[0];
  //         const startMime = part[0].split("/").shift();
  //         const endMime = part[0].split(";").pop();
  //         const fileType = mimeType.split("/").pop();
  //         const encodedFileType = encodeURIComponent(fileType);
  //         const encodedData = encodeURIComponent(part[1]);
  //         const badgeUrl = `https://img.shields.io/badge/${labelName(
  //           obj,
  //         )}-%23${obj.color}?style=for-the-badge&logo=${startMime}/${encodedFileType};${endMime},${encodedData}&logoColor=${logoColor(
  //           obj,
  //         )}`;
  //
  //         return badgeUrl;
  //       });
  //
  //       return new Promise((resolve) => {
  //         resolve(`
  //           <img alt="${obj.name}" src="${badgeUrl}" class="badge">
  //         `);
  //       });
  //     } else {
  //       return new Promise((resolve) => {
  //         resolve(`
  //           <img alt="Static Badge" src="https://img.shields.io/badge/${labelName(
  //             obj,
  //           )}-%23${obj.color}?style=for-the-badge&logo=${obj.name}&logoColor=${logoColor(
  //             obj,
  //           )}" class="badge">
  //         `);
  //       });
  //     }
  //   };
  //   const imgPromises = Object.values(skills).map((skill) => skillImg(skill));
  //   const skillDom = await Promise.all(imgPromises);
  //   // const skillDom = Object.values(skills).map((skill) => {
  //   //   //<img class="img" src="${skill.icon}" alt="${skill.name.toLowerCase()}" />
  //   //   {/* <div class="card"> */}
  //   //   {/*   <span class="body">${skill.name}</span> */}
  //   //   {/* </div> */}
  //   //
  //   //   return `
  //   //     <img alt="Static Badge" src="https://img.shields.io/badge/${
  //   //     labelName(skill)
  //   //   }-%23${skill.color}?style=for-the-badge&logo=${skill.name}&logoColor=${
  //   //     logoColor(skill)
  //   //   }">
  //   //   `;
  //   // });
  //
  //   skillDom.unshift('<div class="body">');
  //   skillDom.push("</div>");
  //
  //   const i = icon(faCode, {
  //     classes: ["fa-code"],
  //   });
  //
  //   const dom = `
  //     <div class="container">
  //       <h3 class="header">
  //         ${i.node[0].outerHTML}
  //         <span class="title">Skills</span>
  //       </h3>
  //       ${skillDom.join(" ")} 
  //     </div>
  //   `;
  //
  //   this.shadowRoot.innerHTML = DOMPurify.sanitize(dom);
  // } 
}

registerCustomElement("user-skills", UserSkills);
