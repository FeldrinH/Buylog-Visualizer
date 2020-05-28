import * as Util from './util'

function ParseKill(event) {
    if (event[1] !== 'kill' && event[1] !== 'kill-penalty') { return null }
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
    if (event[1] === 'join') {
        data.players.set(event[3], {
            id: event[3],
            name: event[4],
            steamid: event[5]
        })
    }
    return {
        time: event[0],
        type: event[1],
        category: 'joinleave',
        player: event[3],
        timestamp: new Date(event[2])
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

function ParseBailout(event) {
    if (event[1] !== 'bailout' && event[1] !== 'bailout-start') { return null }
    return {
        time: event[0],
        type: event[1],
        category: 'bailout',
        player: event[2],
        deltamoney: event[5],
        money: event[4]
    }
}

function ParseDestroy(event, data) {
    if (event[1] !== 'destroy') { return null }
    return {
        time: event[0],
        type: event[1],
        category: 'destroy',
        player: event[2],
        victim: event[3],
        deltamoney: event[5],
        money: event[4]
    }
}

function ParseCity(event) {
    if (event[1] === 'city-take') {
        return {
            time: event[0],
            type: event[1],
            category: 'city',
            team: event[2],
            player: event[3],
            teamtime: event[4]
        }
    } else if (event[1] === 'city-lose' || event[1] === 'city-reset') {
        return {
            time: event[0],
            type: event[1],
            category: 'city',
            team: event[2],
            teamtime: event[4]
        }
    }
    return null
}

function ParseReset(event, data) {
    if (!event[1].startsWith('reset-')) { return null }
    if (Number.isNaN(event[2])) {
        console.log(`${event[1]}  ${event[0]}`)
    }
    return {
        time: event[0],
        type: event[1],
        category: 'reset',
        target: event[2]
    }
}

function ParseFallback(event) {
    if (event[0] === 'action' || event[0] === 'time') { return null }
    console.log(`Unparsed event: '${event[1]}'`)
    return {
        time: event[0],
        type: event[1],
        data: event
    }
}

const parseFuncs = [ParseKill, ParseDeath, ParseBuy, ParseBailout, ParseDestroy, ParseJoinLeave, ParseCity, ParseReset, ParseFallback]

function generateStateBlocks(eventlist, player) {
    const ret = []
    
    let lastState = 'offline'
    let lastTime = 0
    const appendEvent = (curState, curTime) => {
        if (lastState !== 'offline') {
            ret.push({
                start: lastTime,
                end: curTime,
                state: lastState
            })
        }
        lastTime = curTime
        lastState = curState
    }

    for (const event of eventlist) {
        if (event.player === player && event.category === 'joinleave') {
            if (event.type === 'join') {
                if (lastState === 'offline') {
                    appendEvent('active', event.time)
                }
            } else if (event.type === 'leave') {
                appendEvent('offline', event.time)
            } else if (event.type === 'afk-enter') {
                appendEvent('afk', event.time)
            } else if (event.type === 'afk-leave') {
                appendEvent('active', event.time)
            } else {
                console.log(`Unknown joinleave event '${event.type}'`)
            }
        }
    }
    appendEvent('offline', eventlist[eventlist.length-1].time)

    return ret
}

function addKillCount(eventlist, player) {
    let count = 0
    for (const event of eventlist) {
        if (event.type === 'kill' && event.player === player) {
            count += Math.sign(event.deltamoney)
            event.killcount = count
        }        
    }
}

export function parse(rawlog, data) {
    data.log = []
    data.players = new Map()
    data.logstart = rawlog[1][0]
    data.logend = rawlog[rawlog.length - 1][0]

    for (const event of rawlog) {
        for (const func of parseFuncs) {
            const ret = func(event, data)
            if (ret) {
                data.log.push(ret)
                break
            }
        }
    }

    data.playerlist = Array.from(data.players.keys())
    data.players.forEach((info, id) => {
        info.stateblocks = generateStateBlocks(data.log, id)
    })
    data.players.forEach((info, id) => {
        addKillCount(data.log, id)
    })

    //console.log(data.log.filter(e => e.category === 'joinleave'))
}