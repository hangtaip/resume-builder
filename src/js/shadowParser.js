export default class ShadowParser {
  constructor() {
    this.fragment = document.createDocumentFragment();
    this.nodeMap = new Map();
    this.template;
    this.sheet = new CSSStyleSheet();
    this.css = [];
    this.mediaCss = {}; 
    this.foundNode;
  }

  cloneNode(node) {
    this.template = document.createElement("template");
    this.walkNode(node);
    this.arrangeNode(node);
    this.applySheet();

    return this.template.content;
  }

  walkNode(node, depth = 0) {
    if (node.shadowRoot) {
      const styleSheets = node.shadowRoot.adoptedStyleSheets;
      styleSheets.forEach(sheet => {
        const rules = [...sheet.cssRules].map(rule => {
          return this.prependToSelectors(rule.cssText, node.tagName.toLowerCase());
        }).join("\n");
        this.css.push(rules);
        // console.log(rules);
      });
      node.shadowRoot.childNodes.forEach((child) => {
        if (node.dataset?.printDisable || child.dataset?.printDisable) {
          return;
        }
        if (child.nodeType == 1) {
          // const shell = new DOMParser().parseFromString(
          //   node.outerHTML,
          //   "text/html",
          // ).body.firstChild;

          if (child.tagName.toLowerCase() == "style") {
            const styleSheet = node.shadowRoot.styleSheets;
            // for <style> usage
            this.nodeMap.set(`${node.tagName.toLowerCase()}-style`, styleSheet);
            // for CSSStyleSheet usage - current
            this.addSheet(node.tagName.toLowerCase(), styleSheet, depth);
          } else if (!this.nodeMap.get(node.tagName.toLowerCase())) {
            this.nodeMap.set(node.tagName.toLowerCase(), child);
          }
        }
      });

      this.walkNode(node.shadowRoot, depth + 1);
    } else {
      if (node.childNodes.length) {
        node.childNodes.forEach((child) => {
          this.walkNode(child, depth + 1);
        });
      }
    }
  }

  arrangeNode(node) {
    if (node.shadowRoot) {
      node.shadowRoot.childNodes.forEach((child) => {
        if (node.dataset?.printDisable || child.dataset?.printDisable) {
          return;
        }
        if (child.nodeType == 1) {
          if (child.tagName.toLowerCase() != "style") {
            const elTag = node.tagName.toLowerCase();
            const newNode = this.nodeMap.get(elTag);
            // TODO: can be replaced with simple div -> move the nodeId here, add to our element, then pass to addSheet
            const shell = new DOMParser().parseFromString(
              node.outerHTML,
              "text/html",
            ).body.firstChild;

            if (this.template.content.querySelector(elTag)) {
              this.template.content
                .querySelector(elTag)
                .replaceWith(shell.cloneNode(true));
              this.template.content
                .querySelector(elTag)
                .append(newNode.cloneNode(true));
            } else {
              this.template.content.append(shell.cloneNode(true));
              this.template.content
                .querySelector(elTag)
                .append(newNode.cloneNode(true));
            }
          } else if (!this.nodeMap.get(node.tagName.toLowerCase())) {
          }
        }
      });

      this.arrangeNode(node.shadowRoot);
    } else {
      if (node.childNodes.length) {
        node.childNodes.forEach((child) => {
          // console.log('lightDom');
          // console.log(child);
          this.arrangeNode(child);
        });
      }
    }
  }

  // TODO: use regex for (.#[])
  searchNode(node, key, value) {
    if (node.shadowRoot) {
      node.shadowRoot.childNodes.forEach((child) => {
        if (child.nodeType == 1) {
          if (child.tagName.toLowerCase() != "style") {
            switch (key) {
              case "attr" || "attribute":
                if (child.hasAttribute(value)) {
                  this.foundNode = child;
                }
                break;
              case "class":
                if (child.classList.contains(value)) {
                  this.foundNode = child;
                }
                break;
              case "dataset":
                if (child.dataset[value]) {
                  this.foundNode = child;
                }
                break;
              case "id":
                if (child.id == value) {
                  this.foundNode = child;
                }
                break;
              case "tagName":
                if (child.tagName.toLowerCase() == value.toLowerCase()) {
                  this.foundNode = child;
                }
                break;
            }
          }
        }
      });

      this.searchNode(node.shadowRoot, key, value);
    } else {
      if (node.childNodes.length) {
        node.childNodes.forEach((child) => {
          if (child.nodeType == 1) {
            switch (key) {
              case "attr" || "attribute":
                if (child.hasAttribute(value)) {
                  this.foundNode = child;
                }
                break;
              case "class":
                if (child.classList.contains(value)) {
                  this.foundNode = child;
                }
                break;
              case "dataset":
                if (child.dataset[value]) {
                  this.foundNode = child;
                }
                break;
              case "id":
                if (child.id == value) {
                  this.foundNode = child;
                }
                break;
              case "tagName":
                if (child.tagName.toLowerCase() == value.toLowerCase()) {
                  this.foundNode = child;
                }
                break;
            }

             this.searchNode(child, key, value);
          }
        });
      }
    }

    return this.foundNode;
  }

  addSheet(tagName, style, depth) {
    const nodeId = `${tagName}-${depth}-${crypto.randomUUID().substring(0, 8)}`;

    const allCSS = [...style]
      .map((styleSheet) => {
        return [...styleSheet.cssRules].map((rule) => {
          return `.${nodeId} ${rule.cssText}`;
        });
      })
      .filter(Boolean)
      .join("\n");

    this.css.push(allCSS);
    // const allCSS = [...style[0].cssRules].map((rule) => {
    //     const newRule = `.${nodeId} ${rule.cssText}`;
    //     return newRule;
    //   })
    //   .filter(Boolean)
    //   .join('\n');
  }

  // because we use CSSStyleSheet for our components and we reuse the tag, existing style will still apply
  // TODO: for different design, we have to either:
  // 1. use simple div -> attach nodeID -> apply style
  // 2. create multiple stylesheet or scss file, import at our components
  async applySheet() {
    const baseCss = this.css.join("\n");
    const mediaCss = Object.keys(this.mediaCss)
                        .map(condition => {
                          return `${condition} { ${this.mediaCss[condition]} }`;
                        })
                        .join("\n");
    const finalCss = `${baseCss}\n${mediaCss}`;
    await this.sheet.replace(finalCss);
    this.template.content.adoptedStyleSheets = [this.sheet];
  }

  prependToSelectors(cssText, elementSelector) {
    const trimmedCss = cssText.trim();

    if (trimmedCss.startsWith("@media")) {
      const mediaRegex = /(@media[^{]+)\s*\{([\s\S]*?)\s*\}/;
      const match = trimmedCss.match(mediaRegex);

      if (!match) {
        return "";
      }

      const [, mediaCondition, innerRule] = match;

      const [selectorsPart, rulesPart] = innerRule.trim().split(/\s*{\s*/);

      const modifiedSelectors = selectorsPart
        .split(/\s*,\s*/)
        .map(selector => {
            const trimmedSelector = selector.trim();
            
            if (trimmedSelector.startsWith(".container")) {
              return `${elementSelector} > ${trimmedSelector}`;
            } else {
              return `${elementSelector} ${trimmedSelector}`;
            }
        })
        .join(", ");

      const modifiedInnerRule = `${modifiedSelectors} { ${rulesPart} }`;

      this.mediaCss[mediaCondition] = (this.mediaCss[mediaCondition] || "") + ` ${modifiedInnerRule}`;
      // handle media queries here
      // i have a this.mediaCss planned for this 
      return "";
    }

    const [selectorsPart, rulesPart] = cssText.split(/\s*{\s*/);

    const selectors = selectorsPart.split(/\s*,\s*/)
      .map(selector => {
        if (selector.trim().startsWith(".container")) {
          return `${elementSelector} > ${selector}`
        } else {
          return `${elementSelector} ${selector}`
        }
      })
      .join(', ');

    return `${selectors} { ${rulesPart}`;
  }

  // showPrint() {
  //   const dialog = document.createElement('dialog');
  //   dialog.style.height = '400px';
  //   dialog.style.width = '800px';
  //   document.body.append(dialog);
  //   dialog.append(this.template.content);
  //   // this.applySheet()
  //   dialog.showModal();
  // }
}
