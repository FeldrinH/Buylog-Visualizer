import type { GenericEvent, KillEvent, BuyEvent, DeathEvent, DestroyEvent, BailoutEvent, TeamEvent, JoinLeaveEvent, CityEvent, GenericTimestampedEvent, GenericPlayerEvent, LoggingEvent, GenericWeaponEvent, GenericTransactionEvent } from "./ParsedLog"
import type { Duration } from "moment"

export const palette = [
    '#ff0029', '#377eb8', '#66a61e', '#984ea3', '#00d2d5', '#ff7f00', '#af8d00',
    '#7f80cd', '#b3e900', '#c42e60', '#a65628', '#f781bf', '#8dd3c7', '#bebada',
    '#fb8072', '#80b1d3', '#fdb462', '#fccde5', '#bc80bd', '#ffed6f', '#c4eaff',
    '#cf8c00', '#1b9e77', '#d95f02', '#e7298a', '#e6ab02', '#a6761d', '#0097ff',
    '#00d067', '#737373',
    '#f43600', '#4ba93b', '#5779bb', '#927acc', '#97ee3f', '#bf3947', '#9f5b00',
    '#f48758', '#8caed6', '#f2b94f', '#eff26e', '#e43872', '#d9b100', '#9d7a00',
    '#698cff', '#d9d9d9', '#00d27e', '#d06800', '#009f82', '#c49200', '#cbe8ff',
    '#fecddf', '#c27eb6', '#8cd2ce', '#c4b8d9', '#f883b0', '#a49100', '#f48800',
    '#27d0df', '#a04a9b'
]

/*export function assume<T extends GenericEvent>(value: GenericEvent): value is T {
    return true
}*/

export function isType<T extends KillEvent>(event: GenericEvent, type: 'kill' | 'kill-penalty'): event is T
export function isType<T extends BuyEvent>(event: GenericEvent, type: 'buy-weapon' | 'buy-weapon-drop' | 'buy-entity' | 'buy-vehicle' | 'buy-ammo'): event is T
export function isType<T extends DeathEvent>(event: GenericEvent, type: 'death'): event is T;
export function isType<T extends DestroyEvent>(event: GenericEvent, type: 'destroy'): event is T;
export function isType<T extends BailoutEvent>(event: GenericEvent, type: 'bailout' | 'bailout-start'): event is T;
export function isType<T extends TeamEvent>(event: GenericEvent, type: 'team-join'): event is T;
export function isType<T extends JoinLeaveEvent>(event: GenericEvent, type: 'join' | 'leave' | 'afk-enter' | 'afk-leave'): event is T;
export function isType<T extends LoggingEvent>(event: GenericEvent, type: 'logging-started' | 'logging-ended'): event is T;
export function isType<T extends GenericEvent>(event: GenericEvent, type: string): event is T
export function isType<T extends GenericEvent>(event: GenericEvent, type: string): event is T {
    return event.type === type
}

export function isCategory<T extends KillEvent>(event: GenericEvent, category: 'kill'): event is T;
export function isCategory<T extends BuyEvent>(event: GenericEvent, category: 'buy'): event is T;
export function isCategory<T extends DeathEvent>(event: GenericEvent, category: 'death'): event is T;
export function isCategory<T extends DestroyEvent>(event: GenericEvent, category: 'destroy'): event is T;
export function isCategory<T extends BailoutEvent>(event: GenericEvent, category: 'bailout'): event is T;
export function isCategory<T extends TeamEvent>(event: GenericEvent, category: 'team'): event is T;
export function isCategory<T extends CityEvent>(event: GenericEvent, category: 'city'): event is T;
export function isCategory<T extends JoinLeaveEvent>(event: GenericEvent, category: 'joinleave'): event is T;
export function isCategory<T extends LoggingEvent>(event: GenericEvent, category: 'logging'): event is T;
export function isCategory<T extends GenericEvent>(event: GenericEvent, category: string): event is T;
export function isCategory<T extends GenericEvent>(event: GenericEvent, category: string): event is T {
    return event.category === category
}

export function hasProperty(event: GenericEvent, property: 'class'): event is GenericWeaponEvent
export function hasProperty(event: GenericEvent, property: 'weapon'): event is GenericWeaponEvent
export function hasProperty(event: GenericEvent, property: 'timestamp'): event is GenericTimestampedEvent
export function hasProperty(event: GenericEvent, property: 'player'): event is GenericPlayerEvent
export function hasProperty(event: GenericEvent, property: 'deltamoney'): event is GenericTransactionEvent
export function hasProperty(event: GenericEvent, property: 'money'): event is GenericTransactionEvent
export function hasProperty<K extends string>(event: GenericEvent, property: K): event is GenericEvent & { [P in K]: any }
export function hasProperty<K extends string, T>(event: GenericEvent, property: K): event is GenericEvent & { [P in K]: T }
export function hasProperty(event: GenericEvent, property: string): event is GenericEvent {
    return event[property] != undefined
}

export function mod(n: number, m: number) {
    return ((n % m) + m) % m
}

export function round(number: number, decimals: number) {
    const exp = 10 ** decimals
    return Math.round((number + Number.EPSILON) * exp) / exp
}

export function formatDuration(duration: Duration) {
    const hours = Math.floor(duration.asHours())
    const minutes = duration.minutes()
    return `${hours > 0 ? `${hours} hour${hours === 1 ? '' : 's'}` : ''} ${minutes} minutes`
}

// isObject() and extend() taken from ApexCharts /utils/Utils.js (https://github.com/apexcharts/apexcharts.js/blob/master/src/utils/Utils.js) and optimized for a more restricted use case

function isObject(item: any) {
    return item && typeof item === 'object' && !Array.isArray(item) && item != null
}

// credit: http://stackoverflow.com/questions/27936772/deep-object-merging-in-es6-es7#answer-34749873
export function extend(target: any, source: any) {
    let output = target; //Object.assign({}, target)
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key) => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, {
                        [key]: source[key]
                    })
                } else {
                    output[key] = extend(target[key], source[key])
                }
            } else {
                Object.assign(output, {
                    [key]: source[key]
                })
            }
        })
    }
    return output
}

export function findFirstMatching(iterlist, start, step, filter, inLimit) {
    for (let i = start; i >= 0 && i < iterlist.length; i += step) {
        if (!inLimit(iterlist[i])) {
            break
        } else if (filter(iterlist[i])) {
            return iterlist[i]
        }
    }
    return null
}

export function findLastMatching(iterlist, start, step, filter, inLimit) {
    let lastMatching = null
    for (let i = start; i >= 0 && i < iterlist.length; i += step) {
        if (!inLimit(iterlist[i])) {
            break
        } else if (filter(iterlist[i])) {
            lastMatching = iterlist[i]
        }
    }
    return lastMatching
}

export function findInRange(iterlist, start, end, isbackwards, filter) {
    let rangeReached = false
    for (let i = isbackwards ? iterlist.length-1 : 0; i >= 0 && i < iterlist.length; i += isbackwards ? -1 : 1) {
        const event = iterlist[i]
        if (event.time >= start && event.time <= end) {
            if (filter(event)) {
                return event
            }
            rangeReached = true
        } else if (rangeReached) {
            return null
        }
    }
    return null
}

export function getLoopingPaletteGenerator() {
    const cache = new Map<string, string>()
    let index = 0
    return (id: string) => {
        let ret = cache.get(id)
        if (ret) {
            return ret
        }
        ret = palette[index % palette.length]
        cache.set(id, ret)
        index += 1
        return ret
    }
}