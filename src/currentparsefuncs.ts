import type { UnknownEvent, KillEvent, DeathEvent, JoinLeaveEvent, BuyEvent, BailoutEvent, DestroyEvent, CityEvent, TeamEvent, ResetEvent } from './ParsedLog.js'
import moment from 'moment'

export function ParseTimestamp(str: string): moment.Moment {
    if (str.includes('T')) {
        return moment(str, 'YYYY-MM-DDTHH:mm:ss', true)
    } else {
        return moment(str, 'HH:mm:ss DD.MM.YYYY', true)
    }
}

export function ParseGeneric(event: any[]) {
    return {
        time: event[0],
        type: event[1]
    }
}

export function ParseGenericTransaction(event: any[]) {
    return {
        time: event[0],
        type: event[1],
        player: event[2],
        deltamoney: event[5],
        money: event[4]
    }
}

export function ParseGenericTimestamped(event: any[]) {
    return {
        time: event[0],
        type: event[1],
        timestamp: ParseTimestamp(event[2])
    }
}

export function ParseKill(event: any[]): KillEvent {
    if (event[1] !== 'kill' && event[1] !== 'kill-penalty') { return null }
    return {
        ...ParseGenericTransaction(event),
        category: 'kill',
        victim: event[3],
        weapon: event[6],
    }
}

export function ParseDeath(event: any[]): DeathEvent {
    if (event[1] !== 'death') { return null }
    return {
        ...ParseGenericTransaction(event),
        category: 'death',
        killer: event[3],
        weapon: event[6]
    }
}

export function ParseJoinLeave(event, data): JoinLeaveEvent {
    if (event[1] !== 'join' && event[1] !== 'leave' && !event[1].startsWith('afk')) { return null }
    if (event[1] === 'join') {
        data.players.set(event[3], {
            id: event[3],
            name: event[4],
            steamid: event[5]
        })
    }
    return {
        ...ParseGenericTimestamped(event),
        category: 'joinleave',
        player: event[3],
        name: event[4],
        steamid: event[5]
    }
}

export function ParseBuy(event): BuyEvent {
    if (!event[1].startsWith('buy')) { return null }
    return {
        ...ParseGenericTransaction(event),
        category: 'buy',
        class: event[3],
        price: -event[5]
    }
}

export function ParseBailout(event): BailoutEvent {
    if (event[1] !== 'bailout' && event[1] !== 'bailout-start') { return null }
    return {
        ...ParseGenericTransaction(event),
        category: 'bailout'
    }
}

export function ParseDestroy(event, data): DestroyEvent {
    if (event[1] !== 'destroy') { return null }
    return {
        ...ParseGenericTransaction(event),
        category: 'destroy',
        victim: event[3]
    }
}

export function ParseCity(event): CityEvent {
    if (event[1] === 'city-take') {
        return {
            ...ParseGeneric(event),
            category: 'city',
            team: event[2],
            player: event[3],
            teamtime: event[4]
        }
    } else if (event[1] === 'city-lose' || event[1] === 'city-reset') {
        return {
            ...ParseGeneric(event),
            category: 'city',
            team: event[2],
            teamtime: event[4]
        }
    }
    return null
}

export function ParseTeam(event, data): TeamEvent {
    if (event[1] !== 'team-join') { return null }
    return {
        ...ParseGeneric(event),
        category: 'team',
        player: event[2],
        team: event[3]
    }
}

export function ParseReset(event, data): ResetEvent {
    if (!event[1].startsWith('reset-')) { return null }
    if (Number.isNaN(event[2])) {
        console.log(`${event[1]}  ${event[0]}`)
    }
    return {
        ...ParseGeneric(event),
        category: 'reset',
        target: event[2]
    }
}

export function ParseFallback(event): UnknownEvent {
    //if (event[0] === 'action' || event[0] === 'time') { return null }
    console.log(`Unparsed event: '${event[1]}'`)
    return {
        ...ParseGeneric(event),
        category: 'unknown',
        data: event
    }
}

export const currentParseFuncs = [ParseKill, ParseDeath, ParseBuy, ParseBailout, ParseDestroy, ParseJoinLeave, ParseCity, ParseTeam, ParseReset, ParseFallback]