import type moment from 'moment'

export interface StateBlock {
    start: number,
    end: number,
    state: string,
    team: string
}

export interface PlayerInfo {
    readonly id: string,
    name?: string,
    steamid?: string,
    stateblocks?: StateBlock[]
}

export interface GenericEvent {
    readonly time: number,
    readonly type: string,
    readonly category: string
}

export interface GenericTimestampedEvent extends GenericEvent {
    readonly timestamp: moment.Moment
}

export interface GenericPlayerEvent extends GenericEvent {
    readonly player: string
}

export interface GenericTransactionEvent extends GenericPlayerEvent {
    readonly player: string,
    readonly deltamoney: number,
    readonly money: number
}

export interface GenericWeaponEvent extends GenericEvent {
    readonly weapon?: string,
    readonly class?: string
}

export interface KillEvent extends GenericTransactionEvent {
    readonly category: 'kill',
    readonly victim: string,
    readonly weapon: string,
    killcount?: number
}

export interface DeathEvent extends GenericTransactionEvent {
    readonly category: 'death',
    readonly killer: string,
    readonly weapon: string
}

export interface JoinLeaveEvent extends GenericTimestampedEvent {
    readonly category: 'joinleave',
    readonly player: string,
    readonly name?: string,
    readonly steamid?: string
}

export interface BuyEvent extends GenericTransactionEvent {
    readonly category: 'buy',
    readonly class: string,
    readonly price: number
}

export interface BailoutEvent extends GenericTransactionEvent {
    readonly category: 'bailout'
}

export interface DestroyEvent extends GenericTransactionEvent {
    readonly category: 'destroy',
    readonly victim: string
}

export interface CityEvent extends GenericEvent {
    readonly category: 'city',
    readonly team: string,
    readonly teamtime: number,
    readonly player?: string
}

export interface TeamEvent extends GenericEvent {
    readonly category: 'team',
    readonly player: string,
    readonly team: string
}

export interface ResetEvent extends GenericEvent {
    readonly category: 'reset',
    readonly target: string
}

export interface LoggingEvent extends GenericTimestampedEvent {
    readonly category: 'logging'
}

export interface UnknownEvent extends GenericEvent {
    readonly category: 'unknown',
    readonly data: any[]
}

export default class ParsedLog {
    log: GenericEvent[]
    filteredlog: GenericEvent[]
    players: Map<string, PlayerInfo>
    playerlist: string[]

    validtime: boolean
    filtered: boolean
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
        this.filtered = this.filteredlog.length < this.log.length 
    }
}