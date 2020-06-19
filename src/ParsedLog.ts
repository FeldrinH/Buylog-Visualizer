import type moment from 'moment'

export interface PlayerInfo {
    id: string,
    name?: string,
    steamid?: string,
    stateblocks?: any[]
}

export interface GenericEvent {
    time: number,
    type: string,
    category: string
}

export interface GenericTimestampedEvent extends GenericEvent {
    timestamp: moment.Moment
}

export interface GenericPlayerEvent extends GenericEvent {
    player: string
}

export interface GenericTransactionEvent extends GenericPlayerEvent {
    player: string,
    deltamoney: number,
    money: number
}

export interface GenericWeaponEvent extends GenericEvent {
    weapon?: string,
    class?: string
}

export interface KillEvent extends GenericTransactionEvent {
    category: 'kill',
    victim: string,
    weapon: string
}

export interface DeathEvent extends GenericTransactionEvent {
    category: 'death',
    killer: string,
    weapon: string
}

export interface JoinLeaveEvent extends GenericTimestampedEvent {
    category: 'joinleave',
    player: string,
    name?: string,
    steamid?: string
}

export interface BuyEvent extends GenericTransactionEvent {
    category: 'buy',
    class: string,
    price: number
}

export interface BailoutEvent extends GenericTransactionEvent {
    category: 'bailout'
}

export interface DestroyEvent extends GenericTransactionEvent {
    category: 'destroy',
    victim: string
}

export interface CityEvent extends GenericEvent {
    category: 'city',
    team: string,
    teamtime: string,
    player?: string
}

export interface TeamEvent extends GenericEvent {
    category: 'team',
    player: string,
    team: string
}

export interface ResetEvent extends GenericEvent {
    category: 'reset',
    target: string
}

export interface LoggingEvent extends GenericTimestampedEvent {
    category: 'logging'
}

export interface UnknownEvent extends GenericEvent {
    category: 'unknown',
    data: any[]
}

export default class ParsedLog {
    log: GenericEvent[]
    filteredlog: GenericEvent[]
    players: Map<string, PlayerInfo>
    playerlist: string[]

    validtime: boolean
    start: number
    end: number
    filteredstart: number
    filteredend: number
    filteredduration: number
    starttimestamp: moment.Moment
    endtimestamp: moment.Moment

    constructor() {
        this.log = []
        this.players = new Map()
    }

    filter(start: number, end: number) {
        this.filteredlog = this.log.filter(e => e.time >= start && e.time <= end)
        this.filteredstart = start
        this.filteredend = end
        this.filteredduration = end - start
    }
}