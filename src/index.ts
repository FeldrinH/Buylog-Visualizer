import loglist from './loglist'
import DashboardManager from './DashboardManager';

const logselect = <HTMLSelectElement>document.querySelector('#logselect')
const startbound = <HTMLInputElement>document.querySelector('#start')
const endbound = <HTMLInputElement>document.querySelector('#end')
const meta = <HTMLInputElement>document.querySelector('#meta')
const updatebutton = <HTMLButtonElement>document.querySelector('#updatebutton')

const dataManager = new DashboardManager()

function doUpdate() {
    dataManager.setFilename(logselect.value)
    dataManager.setStart(parseFloat(startbound.value))
    dataManager.setEnd(parseFloat(endbound.value))
    dataManager.setMeta(meta.value)

    dataManager.update()
}

function doGameUpdate() {
    const opt = this.options[this.selectedIndex]
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
    startbound.value = <any>dataManager.start || ''
    endbound.value = <any>dataManager.end || ''
    meta.value = dataManager.metaString

    updatebutton.addEventListener("click", doUpdate)
    logselect.addEventListener("change", doGameUpdate)
}

initInputs()

