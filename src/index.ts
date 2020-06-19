import loglist from './loglist.js'
import DashboardManager from './DashboardManager.js';

const logselect = document.querySelector('#logselect') as HTMLSelectElement
const startbound = document.querySelector('#start') as HTMLInputElement
const endbound = document.querySelector('#end') as HTMLInputElement
const meta = document.querySelector('#meta') as HTMLInputElement
const updatebutton = document.querySelector('#updatebutton') as HTMLButtonElement

declare var dataManager: DashboardManager
dataManager = new DashboardManager()

function doUpdate() {
    dataManager.setFilename(logselect.value)
    dataManager.setStart(parseFloat(startbound.value))
    dataManager.setEnd(parseFloat(endbound.value))
    dataManager.setMeta(meta.value)

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

function initInputs() {
    setupEnterDetect(startbound)
    setupEnterDetect(endbound)
    setupEnterDetect(meta)

    loglist.forEach(({ log, plys, games }) => {
        const [ date, time, mapstr ] = log.split('-')
        const [ map ] = mapstr.split('.')

        logselect.add(new Option(`${date} ${time.replace('.', ':')} ${map} [${plys}]`, log));

        games.forEach(game => {
            const gameOpt = new Option(`└ ${game.name}`, log)
            gameOpt.dataset.start = game.start
            gameOpt.dataset.end = game.end
            gameOpt.dataset.meta = game.meta
            logselect.add(gameOpt);
        })
    })

    logselect.value = dataManager.filename
    startbound.value = dataManager.start as any
    endbound.value = dataManager.end as any
    meta.value = dataManager.metaString

    updatebutton.addEventListener("click", doUpdate)
    logselect.addEventListener("change", doGameUpdate)
}

initInputs()

