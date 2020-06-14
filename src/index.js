import loglist from './loglist'
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
        const [ map, ext ] = mapstr.split('.')

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
    startbound.value = dataManager.start
    endbound.value = dataManager.end
    meta.value = dataManager.metaString

    updatebutton.addEventListener("click", doUpdate)
    logselect.addEventListener("change", doGameUpdate)
}

function execute() {
    window.dataManager = new DashboardManager()

    initInputs()
}

execute()
