import * as Util from './util'
import './utilfuncs'
import * as Info from './metainfo'
import Counter from './Counter'
import MultiCounter from './MultiCounter'
import type { GenericEvent, KillEvent, GenericPlayerEvent, GenericTransactionEvent, CityEvent, GenericWeaponEvent, JoinLeaveEvent } from './ParsedLog.js'

export function stateTimelineSeries(players) {
    const ret = []
    players.forEach((info, player) => {
        info.stateblocks.forEach(({start, end, state, team}) => {
            ret.push({
                x: player,
                y: [
                    start,
                    end
                ],
                fillColor: Info.getTeamColor(team, state === 'afk'),
                state: state,
                team: team.toLowerCase()
            })
        })
    })
    return ret
}

export function eventPointSeries(eventlist: (GenericEvent | GenericTransactionEvent)[], player: string) {
    const ret = []
    for (const e of eventlist) {
        if ((e as GenericTransactionEvent).player === player && ((e.category === 'buy' && e.type !== 'buy-ammo') || e.category === 'kill')) {
            ret.push({
                x: e.time,
                y: Math.abs((e as GenericTransactionEvent).deltamoney),
                event: e
            })
        }
    }
    return ret
}

export function cityTimeSeries(eventlist: (GenericEvent | CityEvent)[], team: string) {
    const ret = []
    for (const e of eventlist) {
        if (e.category === 'city' && (e as CityEvent).team === team) {
            ret.push({
                x: e.time,
                y: (e as CityEvent).teamtime,
                event: e
            })
        }
    }
    return ret
}

export function eventCountMovingAverageSeries(eventlist, player, start, end, duration, step) {
    const filter = x => x.player === player && x.type === 'kill'
    const ret = []
    for (let j = start; j <= end; j += step) {
        const start = Util.findInRange(eventlist, j - duration, j, false, filter)
        const end = Util.findInRange(eventlist, j - duration, j, true, filter)
        if (start) {
            ret.push({
                x: j,
                y: Math.round((end.killcount - start.killcount) / duration * 6000) / 100
            })
        }
    }
    return ret
}

export function weaponCounts(eventlist: (GenericEvent | (GenericWeaponEvent & GenericPlayerEvent))[], player, eventtypes: Set<string>) {
    const counts = new Counter()
    for (const e of eventlist) {
        if (((e as GenericPlayerEvent).player === player || player === null) && eventtypes.has(e.type)) {
            const weapon = (e as GenericWeaponEvent).weapon || (e as GenericWeaponEvent).class
            counts.increment(weapon)
        }
    }

    return counts.map((weapon, value) => ({
        weapon: weapon,
        count: value
    })).sort((a,b) => a.weapon.localeCompare(b.weapon))
}

export function conflictBreakdown(eventlist: (GenericEvent | KillEvent)[], player) {
    const matches = new MultiCounter()
    for (const e of eventlist) {
        if (e.type === 'kill' && ((e as KillEvent).player === player || (e as KillEvent).victim === player)) {
            const ourwin = (e as KillEvent).player === player
            const opponent = ourwin ? (e as KillEvent).victim : (e as KillEvent).player
            matches.increment(opponent, 'wins', ourwin ? 1 : 0)
            matches.increment(opponent, 'total')
        }
    }

    return matches.map((player, value) => ({
        opponent: player,
        wins: value.get('wins'),
        losses: value.get('total') - value.get('wins'),
        percent: Math.round(value.get('wins') / value.get('total') * 1000) / 10,
    })).sort((a,b) => a.opponent.localeCompare(b.opponent))
}

export function maxConcurrent(eventlist: (GenericEvent | JoinLeaveEvent)[]) {
    let maxcount = 0
    let curcount = 0
    for (const e of eventlist) {
        if (e.category === 'joinleave') {
            if (e.type === 'join' || e.type === 'afk-leave') {
                curcount += 1
            } else if (e.type === 'leave' || e.type === 'afk-enter') {
                curcount -= 1
            }
            if (curcount > maxcount) {
                maxcount = curcount
            }
        }
    }
    return maxcount
}

export function maxStreak(eventlist, player, streakevent, endevent) {
    let maxstreak = 0
    let curstreak = 0
    for (const e of eventlist) {
        if (e.player === player) {
            if (e.type === streakevent) {
                curstreak += 1
            } else if (e.type === endevent) {
                if (curstreak > maxstreak) {
                    maxstreak = curstreak
                }
                curstreak = 0
            }
        }
    }
    if (curstreak > maxstreak) {
        maxstreak = curstreak
    }
    return maxstreak
}

export function killsBreakdown(eventlist, playerlist) {
    return playerlist.map(player => {
        const kills = eventlist.count(e => e.type === 'kill' && e.player === player)
        const deaths = eventlist.count(e => e.type === 'death' && e.player === player)
        const killstreak = maxStreak(eventlist, player, 'kill', 'death')
        const deathstreak = maxStreak(eventlist, player, 'death', 'kill')
        const moneyspent = -eventlist.filter(e => e.category === 'buy' && e.player === player).reduce((acc, e) => acc + e.deltamoney, 0)
        const moneylost = -eventlist.filter(e => e.category === 'death' && e.player === player).reduce((acc, e) => acc + e.deltamoney, 0)
        const moneybailed = eventlist.filter(e => e.category === 'bailout' && e.player === player).reduce((acc, e) => acc + e.deltamoney, 0)
        const moneymade = eventlist.filter(e => (e.type === 'kill' || e.type === 'destroy') && e.player === player).reduce((acc, e) => acc + e.deltamoney, 0)
        return {
            player: player,
            kills: kills,
            deaths: deaths,
            kdr: Util.round(kills / deaths, 2),
            killstreak: killstreak,
            deathstreak: deathstreak,
            moneyspent: moneyspent,
            moneylost: moneylost,
            moneymade: moneymade,
            moneybailed: moneybailed
        }
    })
}