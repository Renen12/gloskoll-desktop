import {$, createNewElementWithAttributes} from "./renWorks.js";
const invoke = window.__TAURI__.core.invoke;
window.onbeforeunload = (event) => {
    event.preventDefault();
}
invoke("start_pb");
const url = "http://127.0.0.1:8090";
const pb = new PocketBase(url);
pb.autoCancellation(false);
async function load() {
    /**
     * @type {HTMLDialogElement}
     */
    let dialogue = createNewElementWithAttributes("dialog", {
        style: "border-color: purple;"
    }, null);
    let data = await pb.collection("encrypted_gloskoll").getFullList({
        sort: "-created",
    });
    if (data.length === 0) {
        alert("Det finns inga sparade samlingar!");
        return;
    }
    let titles = [];
    for (let i = 0; i < data.length; i++) {
        titles.push(data[i].title)
    }
    for (let i = 0; i < titles.length; i++) {
        dialogue.appendChild(document.createElement("br"));
        let button = createNewElementWithAttributes("button", {}, titles[i]);
        button.onclick = async () => {
            for (const element of $("innerTable").querySelectorAll("tr")) {
                if (element.querySelector("th").innerText !== "" && element.querySelector("th").innerText !== "+") {
                    element.remove();
                }
            }
            /**
             *
             * @type {HTMLDialogElement}
             */
            let decrypt_dialogue = createNewElementWithAttributes("dialog", {
                style: "border-color: black;",
            }, null)
            let input = createNewElementWithAttributes("input", {
                type: "password",
            }, null);
            let confirm = createNewElementWithAttributes("button", {}, "Bekräfta");
            let text_info = createNewElementWithAttributes("p", {}, "Vad är lösenordet för denna samling?");
            let decrypted_list = [];
            confirm.onclick = async () => {
                if (input.value === "") {
                    alert("Du kan inte ha ett tomt lösenord!");
                    return;
                }
                for (const obj of data) {
                    try {
                        let decrypted = CryptoJS.AES.decrypt(obj.value, input.value).toString(CryptoJS.enc.Utf8)
                        decrypted_list.push(decrypted);
                    } catch (error) {
                        console.log(error);
                    }
                }
                let objects = JSON.parse(`
                [${decrypted_list[0]}]
                `);
                for (let t = 0; t < objects.length; t++) {
                    if (objects[t].name === "+") {
                        objects.splice(t, 1)
                    }
                }
                console.log(objects)
                await render_main(objects);
                decrypt_dialogue.close();
                dialogue.close();
            }
            decrypt_dialogue.appendChild(text_info);
            decrypt_dialogue.appendChild(input);
            decrypt_dialogue.appendChild(confirm)
            decrypt_dialogue.showModal();
        }
        dialogue.appendChild(button);
    }
    dialogue.showModal();
}

async function add_new_pupil() {
    let dialog = createNewElementWithAttributes("dialog", {
        style: "border-color: blue;",
    }, null);
    let textInput = createNewElementWithAttributes("input", {
        type: "text",
    }, null);
    let info = createNewElementWithAttributes("p", {}, "Vad ska eleven heta?");
    let confirm = createNewElementWithAttributes("button", {}, "Bekräfta");
    confirm.onclick = () => {
        let elev = textInput.value;
        let tr = createNewElementWithAttributes("tr", {}, null)
        let elev_element = document.createElement("th");
        elev_element.scope = "row";
        elev_element.innerText = elev;
        elev_element.style = "border-right-style: solid; border-color: black;"
        tr.appendChild(elev_element);
        let times = 0;
        while (times < 3) {
            let check = createNewElementWithAttributes("input", {
                type: "radio", required: true, name: "select" + elev
            }, null)
            let cell = document.createElement("td");
            cell.appendChild(check);
            tr.appendChild(cell)
            times++;
        }
        $("innerTable").querySelector("tbody").appendChild(tr)
        dialog.remove();
    }
    dialog.appendChild(info);
    dialog.appendChild(textInput);
    dialog.appendChild(confirm)
    dialog.showModal();
}

async function save() {
    let obj_list = [];
    let trs = $("innerTable").querySelector("tbody").querySelectorAll("tr");
    for (let i = 0; i < trs.length; i++) {
        let tr = trs[i];
        if (tr.querySelector("th").innerText !== "") {
            // PROCEED
            /**
             *
             * @type {boolean[]}
             */
            let checked_list = [];
            let name = tr.querySelector("th").innerText
            let checkboxes = tr.querySelectorAll("input");
            for (let i = 0; i < checkboxes.length; i++) {
                let checkbox = checkboxes[i];
                checked_list.push(checkbox.checked);
            }
            let final = {
                name: name, checked_items: checked_list,
            }
            let final_string = JSON.stringify(final);
            obj_list.push(final_string)
        }
        let dialog = createNewElementWithAttributes("dialog", {
            style: "border-color: green",
        }, null);
        let text = createNewElementWithAttributes("p", {}, "Vad ska lösenordet för denna samling vara?");
        let input = createNewElementWithAttributes("input", {
            type: "password",
        }, null)
        let confirm = createNewElementWithAttributes("button", {}, "Bekräfta");
        dialog.appendChild(text)
        dialog.appendChild(input);
        dialog.appendChild(confirm);
        confirm.onclick = () => {
            let password = input.value;
            if (password === "") {
                alert("Du kan inte ha ett tomt lösenord!");
                return
            }
            let encrypted = CryptoJS.AES.encrypt(obj_list.toString(), password).toString();
            text.innerText = "Vad ska denna samling heta?";
            input.type = "text";
            input.value = "";
            confirm.onclick = async () => {
                let name = input.value;
                if (name == null) {
                    name = "Ny samling " + Math.round(Math.random() * 100);
                }
                let data = await pb.collection("encrypted_gloskoll").getFullList({
                    sort: "-created",
                });
                for (const item of data) {
                    console.log(name)
                    if (name === item.title) {
                        if (window.confirm(`Vill du spara över ${name}?`)) {
                            await pb.collection("encrypted_gloskoll").update(item.id, {
                                "value": encrypted,
                                "name": name,
                            })
                            for (const dialog of document.querySelectorAll("dialog")) {
                                dialog.remove()
                            }
                            return;
                        }
                    }
                }
                await pb.collection("encrypted_gloskoll").create({
                    "value": encrypted,
                    "title": name,
                })
                for (const dialog of document.querySelectorAll("dialog")) {
                    dialog.remove()
                }
            }
        }
        dialog.showModal();
    }
}

/**
 *
 * @param {({     checked_items: boolean[],     name: string } | {})[]} objects
 * @returns {Promise<void>}
 */
async function render_main(objects) {
    let table = $("innerTable");
    if (objects == null) {
        throw new Error("Main objects can't be null")
    }
    for (let i = 0; i < objects.length; i++) {
        let elev = objects[i];
        let tr = createNewElementWithAttributes("tr", {}, null)
        let elev_element = document.createElement("th");
        elev_element.scope = "row";
        elev_element.innerText = elev.name;
        elev_element.style = "border-right-style: solid; border-color: black;"
        elev_element.oncontextmenu = async (event) => {
            event.preventDefault();
            elev_element.parentElement.remove();
        }
        tr.appendChild(elev_element);
        let times = 0;
        while (times < 3) {
            let check = createNewElementWithAttributes("input", {
                type: "radio", required: true, name: "select" + elev.name,
            }, null)
            let cell = document.createElement("td");
            cell.appendChild(check);
            tr.appendChild(cell)
            times++;
        }
        table.querySelector("tbody").appendChild(tr)
    }
    let main = table.querySelector("tbody");
    /**
     *
     * @type {HTMLTableRowElement[]}
     */
    let valid = [];
    for (const t of main.querySelectorAll("tr")) {
        if (t.id !== "avoid") {
            valid.push(t);
        }
    }
    for (const object of objects) {
        for (const elev_element of valid) {
            let nameCell = elev_element.querySelector("th");
            if (object.name === nameCell.innerText) {
                let checks = elev_element.querySelectorAll("td");
                for (let i = 0; i < checks.length; i++) {
                    if (object.checked_items[i] === true) {
                        checks[i].querySelector("input").checked = true;
                    }
                }
            }
        }
    }
    $("spara").onclick = () => {
        save()
    }
    $("new").onclick = () => {
        add_new_pupil();
    }
    $("ladda").onclick = () => {
        load();
    }
}

render_main([{
    checked_items: [false, false, true],
    name: "Ralsei",
}, {
    checked_items: [false, true, false],
    name: "Kris"
}, {
    checked_items: [true, false, false],
    name: "Susie",
}]).then(() => {
    console.log("Finished loading!");
})