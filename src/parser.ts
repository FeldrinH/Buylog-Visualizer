import { GenericEvent, GenericPlayerEvent, GenericTimestampedEvent, KillEvent, TeamEvent, StateBlock } from './ParsedLog'
import ParsedLog from './ParsedLog'
import { assume } from './util'

function generateStateBlocks(eventlist: GenericEvent[], endTimestamp, player: string) {
    const ret: StateBlock[] = []
    
    let lastState = 'offline'
    let lastTeam = 'Unassigned'
    let lastTime = 0
    const appendEvent = (curTime: number, curState: string | null, curTeam: string | null) => {
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

    for (const e of eventlist) {
        if ((e.category === 'joinleave' || e.category === 'team') && (<GenericPlayerEvent>e).player === player) {
            if (e.type === 'join') {
                if (lastState === 'offline') {
                    appendEvent(e.time, 'active', null)
                }
            } else if (e.type === 'leave') {
                appendEvent(e.time, 'offline', null)
            } else if (e.type === 'afk-enter') {
                appendEvent(e.time, 'afk', null)
            } else if (e.type === 'afk-leave') {
                appendEvent(e.time, 'active', null)
            } else if (e.type === 'team-join') {
                appendEvent(e.time, null, (<TeamEvent>e).team)
            } else {
                console.log(`Unknown player state change event '${e.type} (${e.category})'`)
            }
        }
    }
    appendEvent(eventlist[eventlist.length-1].time, 'offline', null)

    return ret
}

function addKillCount(eventlist: GenericEvent[], player: string) {
    let count = 0
    for (const e of eventlist) {
        if (e.type === 'kill' && assume<KillEvent>(e) && e.player === player) {
            count += 1;
            e.killcount = count
        }
    }
}

function determineStartTimestamp(data: ParsedLog) {
    if (data.log[0].type === 'logging-started') {
        return (<GenericTimestampedEvent>data.log[0]).timestamp
    } else {
        const timestampevent = <GenericTimestampedEvent>data.log.find(e => (<GenericTimestampedEvent>e).timestamp)
        if (timestampevent) {
            //console.log('WARNING: No logging started event. Logging start timestamp may be incorrect.')
            return timestampevent.timestamp
        } else {
            //console.log('WARNING: No timestamped events. Logging start timestamp could not be determined')
            return undefined
        }
    }
}

function determineEndTimestamp(data: ParsedLog) {
    if (data.log[data.log.length - 1].type === 'logging-ended') {
        return (<GenericTimestampedEvent>data.log[data.log.length - 1]).timestamp
    } else {
        const timestampevent = <GenericTimestampedEvent>data.log.findLast(e => (<GenericTimestampedEvent>e).timestamp) 
        if (timestampevent) {
            console.log('WARNING: No logging ended event. Logging end timestamp may be incorrect.')
            return timestampevent.timestamp
        } else {
            console.log('WARNING: No timestamped events. Logging end timestamp could not be determined')
            return undefined
        }
    }
}

export function parse(rawlog: any[][], parseFuncs: ((event: any[], data: ParsedLog) => GenericEvent)[], extrainfo: boolean, forcedetectplayers: boolean = false) {
    const data = new ParsedLog()
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

    data.start = data.log[0].time
    data.end = data.log[data.log.length - 1].time
    data.starttimestamp = determineStartTimestamp(data)
    data.endtimestamp = determineEndTimestamp(data)

    if (data.players.size === 0 || forcedetectplayers) {
        data.log.forEach((e: GenericPlayerEvent) => {
            if (e.player && !data.players.has(e.player)) {
                data.players.set(e.player, {
                    id: e.player
                })
            }
        })
    }

    data.playerlist = Array.from(data.players.keys())
    if (extrainfo) {
        data.players.forEach((info, id) => {
            info.stateblocks = generateStateBlocks(data.log, data.endtimestamp, id)
        })
        data.players.forEach((info, id) => {
            addKillCount(data.log, id)
        })
    }

    //console.log(data.log)

    return data
}