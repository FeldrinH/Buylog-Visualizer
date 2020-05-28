import { parse } from 'csv-es';
import DashboardManager from './DashboardManager';

const logselect = document.querySelector('#logselect')
const startbound = document.querySelector('#start')
const endbound = document.querySelector('#end')
const meta = document.querySelector('#meta')
const updatebutton = document.querySelector('#updatebutton')

function doUpdate() {
    dataManager.setFilename(logselect.value)
    dataManager.setStart(parseFloat(startbound.value))
    dataManager.setEnd(parseFloat(endbound.value))
    dataManager.setMeta(meta.value)

    console.log(`${dataManager.filename},NAME,${isFinite(dataManager.start) ? dataManager.start : ''},${isFinite(dataManager.end) ? dataManager.end : ''},${dataManager.metaString}`)

    dataManager.update()
}

function doGameUpdate() {
    const opt = this.options[this.selectedIndex]
    console.log(opt)
    startbound.value = opt.dataset.start || ''
    endbound.value = opt.dataset.end || ''
    meta.value = opt.dataset.meta || ''
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
    setupEnterDetect(startbound)
    setupEnterDetect(endbound)
    setupEnterDetect(meta)

    const loglistStr = await (await fetch(`loglist.txt`)).text()
    const loglist = parse(loglistStr, { typed: false })
    const gamelistStr = await (await fetch(`gamelist.txt`)).text()
    const gamelist = parse(gamelistStr, { typed: false })

    let i = 0
    loglist.forEach(([opt]) => {
        const [ date, time, mapstr ] = opt.split('-')
        const [ map, ext ] = mapstr.split('.')

        logselect.add(new Option(`${date} ${time.replace('.', ':')} ${map}`, opt));

        while (i < gamelist.length && gamelist[i][0] === opt) {
            const gameOpt = new Option(`└ ${gamelist[i][1]}`, opt)
            gameOpt.dataset.start = gamelist[i][2]
            gameOpt.dataset.end = gamelist[i][3]
            gameOpt.dataset.meta = gamelist[i][4]
            logselect.add(gameOpt);
            i += 1
        }
    })
    if (i !== gamelist.length) {
        console.log('UNPARSED GAMELIST VALUES. CHECK GAMELIST ORDERING!')
    }
    //console.log(loglist)

    logselect.value = dataManager.filename
    startbound.value = dataManager.start
    endbound.value = dataManager.end
    meta.value = dataManager.metaString

    updatebutton.addEventListener("click", doUpdate)
    logselect.addEventListener("change", doGameUpdate)
}

async function Execute() {
    window.dataManager = new DashboardManager()

    await initInputs()
}

Execute()
