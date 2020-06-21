import type { JoinLeaveEvent, GenericTimestampedEvent, LoggingEvent, KillEvent, UnknownEvent, FreebuyEvent } from './ParsedLog'
import type ParsedLog from './ParsedLog'
import { ParseTimestamp, ParseDeath, ParseBuy, ParseBailout, ParseDestroy, ParseReset, ParseFallback, ParseCity, ParseTeam, ParseFreebuy, ParseMessage } from './currentparsefuncs'

export function ParseTimestampedHumanReadable(event: any[], data: ParsedLog): JoinLeaveEvent | LoggingEvent | FreebuyEvent | (GenericTimestampedEvent & UnknownEvent) {
    if (!event[1].endsWith('--')) { return null }

    const parse: string = event[1].split('--')
    const rawplayer = parse[1].substring(0, parse[1].lastIndexOf(' '))

    let type: string = null
    let category: 'joinleave' | 'logging' | 'freebuy' | 'unknown' = null
    if (parse[1].endsWith(" JOINED")) {
        type = 'join'
        category = 'joinleave'
    } else if (parse[1].endsWith(" LEFT")) {
        type = 'leave'
        category = 'joinleave'
    } else if (parse[1] === "LOGGING STARTED") {
        type = 'logging-started'
        category = 'logging'
    } else if (parse[1] === "LOGGING ENDED") {
        type = 'logging-ended'
        category = 'logging'
    } else if (parse[1] === "FREEBUY ENABLED") {
        type = 'freebuy-enabled'
        category = 'freebuy'
    } else if (parse[1] === "FREEBUY DISABLED") {
        type = 'freebuy-disabled'
        category = 'freebuy'
    } else {
        console.log(`Unparsed human readable event '${parse[1]}'`)
        type = event[1].split('--')[1]
        category = 'unknown'
    }
    const timestamp = ParseTimestamp(parse[0].split(' ').slice(0, 2).join(' '))

    if (!timestamp.isValid()) {
        console.log(`Failed to parse timestamp '${parse[0].split(' ').slice(0, 2).join(' ')}' in '${event.join(',')}'`)
        return null
    }

    if (type === 'join') {
        data.players.set(rawplayer, {
            id: rawplayer
        })
    }

    const genericEvent = {
        time: event[0],
        type: type,
        timestamp: timestamp
    }
    if (category === 'joinleave') {
        return {
            ...genericEvent,
            category: 'joinleave',
            player: rawplayer
        }
    } else if (category === 'unknown') {
        return {
            ...genericEvent,
            category: 'unknown',
            data: event
        }
    } else {
        return {
            ...genericEvent,
            category: category
        }
    }
    
}

export function ParseLoggingStandardized(event: any[], data: ParsedLog): LoggingEvent {
    if (!event[1].startsWith('logging')) { return null }

    let expectedTimestamp = ParseTimestamp(event[2])
    if (!expectedTimestamp.isValid()) {
        expectedTimestamp = ParseTimestamp(event[3])
    }

    if (!expectedTimestamp.isValid()) {
        console.log(`Failed to parse timestamp in ${event.join(',')}`)
        return null
    }

    return {
        time: event[0],
        type: event[1],
        category: 'logging',
        timestamp: expectedTimestamp
    }
}

export function ParseJoinLeaveStandardized(event: any[], data: ParsedLog): JoinLeaveEvent {
    if (event[1] !== 'join' && event[1] !== 'leave' && !event[1].startsWith('afk')) { return null }

    let expectedTimestamp = ParseTimestamp(event[2])
    let expectedPlayer = event[3]
    if (!expectedTimestamp.isValid()) {
        expectedTimestamp = ParseTimestamp(event[3])
        expectedPlayer = event[2]
    }

    if (!expectedTimestamp.isValid()) {
        console.log(`Failed to parse timestamp in ${event.join(',')}`)
        return null
    }

    if (event[1] === 'join') {
        data.players.set(expectedPlayer, {
            id: expectedPlayer
        })
    }

    return {
        time: event[0],
        type: event[1],
        category: 'joinleave',
        player: expectedPlayer,
        timestamp: expectedTimestamp
    }
}

export function ParseKillStandardized(event: any[]): KillEvent {
    if (event[1] !== 'kill' && event[1] !== 'kill-penalty') { return null }
    return {
        time: event[0],
        type: event[2] === event[3] || event[5] < 0 ? 'kill-penalty' : event[1],
        player: event[2],
        deltamoney: event[5],
        money: event[4],
        category: 'kill',
        victim: event[3] || event[2],
        weapon: event[6]
    }
}

export const legacyParseFuncs = [ParseJoinLeaveStandardized, ParseTimestampedHumanReadable, ParseLoggingStandardized]

export const legacyFullParseFuncs = [ParseTimestampedHumanReadable, ParseJoinLeaveStandardized, ParseLoggingStandardized, ParseKillStandardized, ParseDeath, ParseBuy, ParseBailout, ParseDestroy, ParseCity, ParseTeam, ParseReset, ParseFreebuy, ParseMessage, ParseFallback]