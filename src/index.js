import { parse } from 'csv-es';
import ChartManager from './ChartManager'

function doUpdate() {
    console.log('Updating data visualization values')

    dataManager.setFilename(document.querySelector("#logselect").value)
    dataManager.setStart(parseFloat(document.querySelector("#start").value))
    dataManager.setEnd(parseFloat(document.querySelector("#end").value))
    dataManager.setMeta(document.querySelector("#meta").value)

    dataManager.update()
}

function setupEnterDetect(input) {
    input.addEventListener("keyup", (event) => {
        if (event.keyCode === 13) {
            event.preventDefault();
            document.getElementById("updatebutton").click();
        }
    });
}

async function initInputs() {
    const logselect = document.querySelector('#logselect')
    const startbound = document.querySelector('#start')
    const endbound = document.querySelector('#end')
    const meta = document.querySelector('#meta')

    setupEnterDetect(startbound)
    setupEnterDetect(endbound)
    setupEnterDetect(meta)

    const updatebutton = document.querySelector('#updatebutton')

    const loglistStr = await (await fetch(`loglist.txt`)).text()
    const loglist = parse(loglistStr, { typed: false })
    loglist.forEach(([opt]) => {
        logselect.add(new Option(opt, opt));
    })
    console.log(loglist)

    logselect.value = dataManager.filename
    startbound.value = dataManager.start
    endbound.value = dataManager.end
    meta.value = dataManager.metaString

    updatebutton.addEventListener("click", doUpdate)
}

async function Execute() {
    window.dataManager = new ChartManager()

    await initInputs()
}

Execute()
