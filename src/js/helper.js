export function isNullUndefinedOrEmpty(value) {
  return value == null || (typeof value === "string" && value.trim().length === 0);
}

export function loadComponent(list) {
  const promises = [];

  if (!list || list.length === 0) {
    console.warn("Please provide an array of an object like { path: path-to-module, tagName: custom-comp, folderType: components }");
    return promises;
  }

  list.forEach(componentDetail => {
    const folderType = componentDetail.folderType;
    let importPromise; 

    const promise = new Promise((resolve, reject) => {
      switch(folderType) {
        case "components":
          importPromise = import(
            /* webpackChunkNames: "[request]" */
            /* webpackPrefetch: true */
            `../components/${componentDetail.path}`
          );
          break;
        case "pages":
          importPromise = import(
            /* webpackChunkNames: "[request]" */
            /* webpackPrefetch: true */
            `../pages/${componentDetail.path}`
          );
          break;
        default:
          console.error(`Error: unknown folder type ${folderType}`);
          return reject(new Error(`Invalid folder type: ${folderType}`));
      }

      importPromise
      .then(() => {
          customElements.whenDefined(componentDetail.tagName)
            .then(() => {
              resolve();
            }).catch((err) => {
              console.error(`Error defining custom element ${componentDetail.tagName}:`, err);
              reject(err);
            });
      }).catch((err) => {
        console.error(`Failed to load component module from ${componentDetail.tagName}:`, err);
        reject(err);
      });
    }) 


    promises.push(promise)
  });

  return promises;
}
