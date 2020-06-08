import './util.js'
import moment from 'moment'

function ParseTimestamp(str) {
    if (str.includes('T')) {
        return moment(str, 'YYYY-MM-DDTHH:mm:ss', true)
    } else {
        return moment(str, 'HH:mm:ss DD.MM.YYYY', true)
    }
}

function StripTime(event) {
    if (Number.isFinite(Number(event[0]))) {
        event.splice(0, 1)
    }
}

function ParseTimestampedHumanReadable(event, data) {
    if (event.length > 1 || !event[0].endsWith('--')) { return null }

    let parse = event[0].replace(/--/g, '').split(' ')

    let type = null
    if (parse[3] === "JOINED") {
        type = 'join'
    } else if (parse[3] === "LEFT") {
        type = 'leave'
    } else if (event[0].endsWith("--LOGGING STARTED--")) {
        type = 'logging-started'
    } else if (event[0].endsWith("--LOGGING ENDED--")) {
        type = 'logging-ended'
    }
    let player = parse[2]
    let timestamp = ParseTimestamp(`${parse[0]} ${parse[1]}`)

    if (!type) {
        return null
    }
    if (!timestamp.isValid()) {
        console.log(`Failed to parse timestamp in ${event.join(',')}`)
        return null
    }

    if (type === 'join') {
        data.players.set(player, {
            id: player
        })
    }

    return {
        type: type,
        category: 'joinleave',
        player: player,
        timestamp: timestamp
    }
}

function ParseJoinLeaveStandardized(event, data) {
    if (event[0] !== 'join' && event[0] !== 'leave' && !event[0].startsWith('afk')) { return null }

    let expectedTimestamp = ParseTimestamp(event[1])
    let expectedPlayer = event[2]
    if (!expectedTimestamp.isValid()) {
        expectedTimestamp = ParseTimestamp(event[2])
        expectedPlayer = event[1]
    }

    if (!expectedTimestamp.isValid()) {
        console.log(`Failed to parse timestamp in ${event.join(',')}`)
        return null
    }

    if (event[0] === 'join') {
        data.players.set(expectedPlayer, {
            id: expectedPlayer
        })
    }

    return {
        type: event[0],
        category: 'joinleave',
        player: expectedPlayer,
        timestamp: expectedTimestamp
    }
}

function ParseLoggingStandardized(event, data) {
    if (!event[0].startsWith('logging')) { return null }

    let expectedTimestamp = ParseTimestamp(event[1])
    if (!expectedTimestamp.isValid()) {
        expectedTimestamp = ParseTimestamp(event[2])
    }

    if (!expectedTimestamp.isValid()) {
        console.log(`Failed to parse timestamp in ${event.join(',')}`)
        return null
    }

    return {
        type: event[0],
        category: 'logging',
        timestamp: expectedTimestamp
    }
}

const parseFuncs = [StripTime, ParseJoinLeaveStandardized, ParseTimestampedHumanReadable, ParseLoggingStandardized]

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