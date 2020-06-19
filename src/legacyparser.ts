import './util'

function generateStateBlocks(eventlist, player) {
    const ret = []
    
    let lastState = 'offline'
    let lastTeam = 'Unassigned'
    let lastTime = 0
    const appendEvent = (curTime, curState, curTeam) => {
        if (lastState !== 'offline') {
            ret.push({
                start: lastTime,
                end: curTime,
                state: lastState,
                team: lastTeam
            })
        }
        lastTime = curTime
        lastTeam = curTeam || lastTeam
        lastState = curState || lastState
    }

    for (const event of eventlist) {
        if (event.player === player && (event.category === 'joinleave' || event.category === 'team')) {
            if (event.type === 'join') {
                if (lastState === 'offline') {
                    appendEvent(event.timestamp, 'active', null)
                }
            } else if (event.type === 'leave') {
                appendEvent(event.timestamp, 'offline', null)
            } else if (event.type === 'afk-enter') {
                appendEvent(event.timestamp, 'afk', null)
            } else if (event.type === 'afk-leave') {
                appendEvent(event.timestamp, 'active', null)
            } else if (event.type === 'team-join') {
                appendEvent(event.timestamp, null, event.team)
            } else {
                console.log(`Unknown player state change event '${event.type} (${event.category})'`)
            }
        }
    }
    appendEvent(eventlist[eventlist.length-1].timestamp, 'offline', null)

    return ret
}

export function parse(rawlog, data, parseFuncs) {
    data.log = []
    data.players = new Map()

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
    /* data.players.forEach((info, id) => {
        addKillCount(data.log, id)
    }) */
}