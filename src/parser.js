import './util.js'

function generateStateBlocks(eventlist, endTimestamp, player) {
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
                    appendEvent(event.time, 'active', null)
                }
            } else if (event.type === 'leave') {
                appendEvent(event.time, 'offline', null)
            } else if (event.type === 'afk-enter') {
                appendEvent(event.time, 'afk', null)
            } else if (event.type === 'afk-leave') {
                appendEvent(event.time, 'active', null)
            } else if (event.type === 'team-join') {
                appendEvent(event.time, null, event.team)
            } else {
                console.log(`Unknown player state change event '${event.type} (${event.category})'`)
            }
        }
    }
    appendEvent(eventlist[eventlist.length-1].time, 'offline', null)

    return ret
}

function addKillCount(eventlist, player) {
    let count = 0
    for (const event of eventlist) {
        if (event.type === 'kill' && event.player === player) {
            count += 1
            event.killcount = count
        }        
    }
}

function determineStartTimestamp(data) {
    if (data.log[0].type === 'logging-started') {
        return data.log[0].timestamp
    } else {
        const timestampevent = data.log.find(e => e.timestamp)
        if (timestampevent) {
            //console.log('WARNING: No logging started event. Logging start timestamp may be incorrect.')
            return timestampevent.timestamp
        } else {
            //console.log('WARNING: No timestamped events. Logging start timestamp could not be determined')
            return undefined
        }
    }
}

function determineEndTimestamp(data) {
    if (data.log[data.log.length - 1].type === 'logging-ended') {
        return data.log[data.log.length - 1].timestamp
    } else {
        const timestampevent = data.log.findLast(e => e.timestamp)
        if (timestampevent) {
            console.log('WARNING: No logging ended event. Logging end timestamp may be incorrect.')
            return timestampevent.timestamp
        } else {
            console.log('WARNING: No timestamped events. Logging end timestamp could not be determined')
            return undefined
        }
    }
}

export function parse(rawlog, parseFuncs, extrainfo) {
    const data = {}
    data.log = []
    data.players = new Map()
    data.validtime = rawlog.length > 0 && Number.isFinite(Number(rawlog[0][0]))

    let index = 0
    for (const event of rawlog) {
        if (!data.validtime) {
            event.unshift(index)
        }
        for (const func of parseFuncs) {
            const ret = func(event, data)
            if (ret) {
                data.log.push(ret)
                break
            }
        }
        index += 1
    }

    data.logstart = data.log[0].time
    data.logend = data.log[data.log.length - 1].time
    data.starttimestamp = determineStartTimestamp(data)
    data.endtimestamp = determineEndTimestamp(data)

    data.playerlist = Array.from(data.players.keys())
    if (extrainfo) {
        data.players.forEach((info, id) => {
            info.stateblocks = generateStateBlocks(data.log, data.endtimestamp, id)
        })
        data.players.forEach((info, id) => {
            addKillCount(data.log, id)
        })
    }

    //console.log(data.log.filter(e => e.category === 'joinleave'))

    return data
}