import type { JoinLeaveEvent, GenericTimestampedEvent, LoggingEvent } from './ParsedLog.js'
import type ParsedLog from './ParsedLog.js'
import { ParseTimestamp, ParseKill, ParseDeath, ParseBuy, ParseBailout, ParseDestroy, ParseReset, ParseFallback } from './currentparsefuncs.js'

export function ParseTimestampedHumanReadable(event: any[], data: ParsedLog): GenericTimestampedEvent | JoinLeaveEvent {
    if (!event[1].endsWith('--')) { return null }

    const parse = event[1].split('--')
    const rawplayer = parse[1].substring(0, parse[1].lastIndexOf(' '))

    let type = null
    let category = null
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

    return {
        time: event[0],
        type: type,
        category: category,
        player: category === 'joinleave' ? rawplayer : undefined,
        timestamp: timestamp
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

export const legacyParseFuncs = [ParseJoinLeaveStandardized, ParseTimestampedHumanReadable, ParseLoggingStandardized]

export const legacyFullParseFuncs = [ParseTimestampedHumanReadable, ParseJoinLeaveStandardized, ParseLoggingStandardized, ParseKill, ParseDeath, ParseBuy, ParseBailout, ParseDestroy, ParseReset, ParseFallback]