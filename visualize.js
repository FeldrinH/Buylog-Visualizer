import { parse } from './csv-es.min.js';
import ApexCharts from './apexcharts.esm.js';

function GetWithDefault(dict, key) {
    if (!dict[key]) {
        dict[key] = {}
    }
    return dict[key]
}

function FindFirstMatching(iterlist, start, step, filter, inLimit) {
    for (let i = start; i >= 0 && i < iterlist.length; i += step) {
        if (!inLimit(iterlist[i])) {
            break
        } else if (filter(iterlist[i])) {
            return iterlist[i]
        }
    }
    return null
}

function FindLastMatching(iterlist, start, step, filter, inLimit) {
    let lastMatching = null
    for (let i = start; i >= 0 && i < iterlist.length; i += step) {
        if (!inLimit(iterlist[i])) {
            break
        } else if (filter(iterlist[i])) {
            lastMatching = iterlist[i]
        }
    }
    return lastMatching
}

function FindInRange(iterlist, start, end, isbackwards, filter) {
    let rangeReached = false
    for (let i = isbackwards ? iterlist.length-1 : 0; i >= 0 && i < iterlist.length; i += isbackwards ? -1 : 1) {
        const event = iterlist[i]
        if (event.time >= start && event.time <= end) {
            if (filter(event)) {
                return event
            }
            rangeReached = true
        } else if (rangeReached) {
            return null
        }
    }
    return null
}

function ParseKill(event) {
    if (event[1] !== 'kill') { return null }
    return {
        time: event[0],
        type: event[1],
        category: 'kill',
        player: event[2],
        victim: event[3],
        weapon: event[6],
        deltamoney: event[5],
        money: event[4]
    }
}

function ParseDeath(event) {
    if (event[1] !== 'death') { return null }
    return {
        time: event[0],
        type: event[1],
        category: 'death',
        player: event[2],
        killer: event[3],
        weapon: event[6],
        deltamoney: event[5],
        money: event[4]
    }
}

function ParseJoinLeave(event, data) {
    if (event[1] !== 'join' && event[1] !== 'leave' && !event[1].startsWith('afk')) { return null }
    data.playerset.add(event[2])
    return {
        time: event[0],
        type: event[1],
        category: 'joinleave',
        player: event[2]
    }
}

function ParseBuy(event) {
    if (!event[1].startsWith('buy')) { return null }
    return {
        time: event[0],
        type: event[1],
        category: 'buy',
        player: event[2],
        class: event[3],
        price: -event[5],
        deltamoney: event[5],
        money: event[4]
    }
}

function ParseFallback(event) {
    if (event[0] === 'action') { return null }
    console.log(`Unparsed event: '${event[1]}'`)
    return {
        time: event[0],
        type: event[1],
        data: event
    }
}

const ParseFuncs = [ParseKill, ParseDeath, ParseJoinLeave, ParseBuy, ParseFallback]

function AddKillCount(eventlist, player) {
    let count = 0
    for (const event of eventlist) {
        if (event.type === 'kill' && event.player === player) {
            count += Math.sign(event.deltamoney)
            event.killcount = count
        }        
    }
}

async function LoadData(filename) {
    const dataStr = await (await fetch(`/logs/${filename}.txt`)).text()
    const log = parse(dataStr, { typed: true })
    //console.log(log)

    const data = {}
    data.log = []
    data.playerset = new Set()
    data.starttime = log[1][0]
    data.endtime = log[log.length - 1][0]

    for (const event of log) {
        for (const func of ParseFuncs) {
            const ret = func(event, data)
            if (ret) {
                data.log.push(ret)
                break
            }
        }
    }

    data.players = Array.from(data.playerset)
    data.players.forEach(player => {
        AddKillCount(data.log, player)
    })

    return data
}

function CountMovingAverage(eventlist, player, start, end, duration, step) {
    const filter = x => x.player === player && x.type === 'kill'
    const ret = []
    console.log(start, end, step)
    for (let j = start; j <= end; j += step) {
        const start = FindInRange(eventlist, j - duration, j, false, filter)
        const end = FindInRange(eventlist, j - duration, j, true, filter)
        if (start) {
            ret.push({
                x: j,
                y: (end.killcount - start.killcount) / duration * 60
            })
        }
    }
    return ret
}

function ProcessData(data) {
    window.out = window.out || {}
    
    //data.killsendmarked = data.log.filter(event => )

    out.KillCount = data.players.map(player => ({
        name: player,
        data: CountMovingAverage(data.log, player, data.starttime, data.endtime, 1200, 60)
    }))
}

function CreateCharts() {
    console.log(out.KillCount)
    const options = {
        series: out.KillCount,
        chart: {
            type: 'line',
            zoom: {
                enabled: true
            }
        },
        dataLabels: {
            enabled: false
        },
        tooltip: {
            shared: false
        },
        stroke: {
            curve: 'smooth'
        },
        title: {
            text: 'Product Trends by Month',
            align: 'left'
        },
        grid: {
            row: {
                colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
                opacity: 0.5
            },
        },
        xaxis: {
            type: 'numeric'
        }
    };
    
    var testChart = new ApexCharts(document.querySelector("#chart"), options);
    testChart.render();

    console.log("Done")
}

async function Execute() {
    const data = await LoadData('2020.05.17-20.24-gm_pit_5')
    ProcessData(data)
    CreateCharts()
}

Execute()
