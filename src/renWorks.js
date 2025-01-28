// Build

/**
 *
 * @param {string} component
 */
async function addNewComponent(component) {
    if (component != "") {
        await fetch(`components/${component + ".html"}`).then((response) => {
            if (!response.ok) {
                let errorDialogue = document.createElement("dialog");
                errorDialogue.innerText = `(SOFTWARE ERROR): Component ${component} is not available.`
                errorDialogue.style.color = "red"
                document.body.appendChild(errorDialogue);
                errorDialogue.showModal();
                throw new Error(`Component ${component} is not available.`)
            }
            response.text().then((HTML) => {
                document.body.innerHTML = document.body.innerHTML + HTML;
                loadStyleMacros();
            });
        });
    } else {
        loadStyleMacros();
    }

}

// Extra functions
/**
 *
 * @param {string} id
 */
export function $(id) {
    let element = document.getElementById(id);
    if (element == null) {
        throw new Error(`Element with id ${id} does not exist or has not loaded yet.`);
    }
    return element;
}

/**
 *
 * @param {string} type
 */
export function createNewElementWithAttributes(type, attributes, optionalTextContent) {
    let element = document.createElement(type);
    if (optionalTextContent != null) {
        element.innerText = optionalTextContent;
    }
    for (let i = 0; i < Object.keys(attributes).length; i++) {
        element.setAttribute(Object.keys(attributes)[i], Object.values(attributes)[i]);
    }
    document.body.appendChild(element);
    loadStyleMacros();
    return element;
}

// Styling macros
export function loadStyleMacros() {
    let bodyChildren = document.body.getElementsByTagName("*");
    for (const child of bodyChildren) {

        if (child.getAttribute("centered") == "true" || child.getAttribute("centered") == "") {
            if (child.getAttribute("class") == null) {
                throw new Error("The element to center needs a class name.");
            }
            let renWorksStyling = document.createElement("style");
            renWorksStyling.innerHTML = `.${child.className} {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }`;
            for (const style of document.querySelectorAll("style")) {
                if (style.innerHTML == renWorksStyling.innerHTML) {
                    return;
                }
            }
            document.body.appendChild(renWorksStyling);
        }

        if (child.getAttribute("flex-centered") == "true" || child.getAttribute("flex-centered") == "") {
            if (child.parentElement.getAttribute("class") == null) {
                throw new Error("The parent element to center needs a class name.");
            }
            let renWorksStyling = document.createElement("style");
            renWorksStyling.innerHTML = `.${child.parentElement.className} {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
            }`
            for (const style of document.querySelectorAll("style")) {
                if (style.innerHTML == renWorksStyling.innerHTML) {
                    return;
                }
            }
            document.body.appendChild(renWorksStyling);
        }
        if (child.getAttribute("color") != null) {
            if (child.getAttribute("class") == null) {
                throw new Error("Give the to-be colored element a class.");
            }
            let renWorksStyling = document.createElement("style");
            renWorksStyling.innerHTML = `.${child.className} {
                color: ${child.getAttribute("color")}
            }`;
            for (const style of document.querySelectorAll("style")) {
                if (style.innerHTML == renWorksStyling.innerHTML) {
                    return;
                }
            }
            document.body.appendChild(renWorksStyling)
        }
        if (child.getAttribute("bgcolor") != null) {
            if (child.getAttribute("class") == null) {
                throw new Error("Give the to-be colored element a class.");
            }
            let renWorksStyling = document.createElement("style");
            renWorksStyling.innerHTML = `.${child.className} {
                background-color: ${child.getAttribute("bgcolor")}
            }`;
            for (const style of document.querySelectorAll("style")) {
                if (style.innerHTML == renWorksStyling.innerHTML) {
                    return;
                }
            }
            document.body.appendChild(renWorksStyling)
        }
    }
}

// Additional macros
let children = document.body.getElementsByTagName("*")
for (let i = 0; i < children.length; i++) {
    let child = children[i];
    if (child.getAttribute("quickAttributes") != null) {
        let quickAttributesContents = child.getAttribute("quickAttributes");
        let quickAttributesStatements = quickAttributesContents.split(",");
        for (let i = 0; i < quickAttributesStatements.length; i++) {
            let attribute = quickAttributesStatements[i].split("=")[0];
            let attributeValue = quickAttributesStatements[i].split("=")[1];
            child.setAttribute(attribute, attributeValue);
            child.removeAttribute("quickAttributes");
        }
    }
}
let script = document.getElementById("renWorks");
if (script == null) {
    throw new Error("Please give the renWorks script an id of \"renWorks\".");
}
let componentsAttribute = script.getAttribute("components");
if (componentsAttribute == null) {
    throw new Error("Please specify a list of components(separated by commas) in the components attribute of the renWorks script tag.");
}
let splitComponents = componentsAttribute.split(",");
splitComponents.forEach((component) => {
    addNewComponent(component.replace(" ", ""));
});
