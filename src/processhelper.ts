import type { GenericEvent, KillEvent, GenericPlayerEvent, GenericTransactionEvent, CityEvent, GenericWeaponEvent, JoinLeaveEvent, DeathEvent, BuyEvent, BailoutEvent, PlayerInfo, DestroyEvent } from './ParsedLog.js'
import './utilfuncs'
import * as Util from './util'
import * as Info from './metainfo'
import Counter from './Counter'
import MultiCounter from './MultiCounter'

export function stateTimelineSeries(players: Map<string, PlayerInfo>) {
    const ret: {
        x: string,
        y: number[],
        fillColor: string,
        state: string,
        team: string
    }[] = []
    players.forEach((info, player) => {
        info.stateblocks.forEach(({ start, end, state, team }) => {
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

export function eventPointSeries(eventlist: GenericEvent[], player: string) {
    const ret: {
        x: number,
        y: number,
        event: GenericTransactionEvent
    }[] = []
    for (const e of eventlist) {
        if ((<GenericTransactionEvent>e).player === player && ((e.category === 'buy' && e.type !== 'buy-ammo') || e.category === 'kill')) {
            ret.push({
                x: e.time,
                y: Math.abs((<GenericTransactionEvent>e).deltamoney),
                event: <GenericTransactionEvent>e 
            })
        }
    }
    return ret
}

export function cityTimeSeries(eventlist: GenericEvent[], team: string) {
    const ret: {
        x: number,
        y: number,
        event: CityEvent
    }[] = []
    for (const e of eventlist) {
        if (e.category === 'city' && (<CityEvent>e).team === team) {
            ret.push({
                x: e.time,
                y: (<CityEvent>e).teamtime,
                event: <CityEvent>e
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

export function weaponCounts(eventlist: GenericEvent[], player: string, eventtypes: Set<string>) {
    const counts = new Counter()
    for (const e of eventlist) {
        if (((<GenericPlayerEvent>e).player === player || player === null) && eventtypes.has(e.type)) {
            const weapon = (<GenericWeaponEvent>e).weapon || (<GenericWeaponEvent>e).class
            counts.increment(weapon)
        }
    }

    return counts.map((weapon, value) => ({
        weapon: weapon,
        count: value
    })).sort((a,b) => a.weapon.localeCompare(b.weapon))
}

export function conflictBreakdown(eventlist: GenericEvent[], player: string) {
    const matches = new MultiCounter()
    for (const e of eventlist) {
        if (e.type === 'kill' && ((<KillEvent>e).player === player || (<KillEvent>e).victim === player)) {
            const ourwin = (<KillEvent>e).player === player
            const opponent = ourwin ? (<KillEvent>e).victim : (<KillEvent>e).player
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

export function maxConcurrent(eventlist: GenericEvent[]) {
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

export function maxStreak(eventlist: GenericEvent[], player: string, streakevent: string, endevent: string) {
    let maxstreak = 0
    let curstreak = 0
    for (const e of eventlist) {
        if ((<GenericPlayerEvent>e).player === player) {
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

export function killsBreakdown(eventlist: GenericEvent[], playerlist: string[]) {
    return playerlist.map(player => {
        const kills = eventlist.count(e => e.type === 'kill' && (<KillEvent>e).player === player)
        const deaths = eventlist.count(e => e.type === 'death' && (<DeathEvent>e).player === player)
        const killstreak = maxStreak(eventlist, player, 'kill', 'death')
        const deathstreak = maxStreak(eventlist, player, 'death', 'kill')
        const moneyspent = -eventlist.filter(e => e.category === 'buy' && (<BuyEvent>e).player === player).sum(e => (<BuyEvent>e).deltamoney)
        const moneylost = -eventlist.filter(e => e.category === 'death' && (<DeathEvent>e).player === player).sum(e => (<DeathEvent>e).deltamoney)
        const moneybailed = eventlist.filter(e => e.category === 'bailout' && (<BailoutEvent>e).player === player).sum(e => (<BailoutEvent>e).deltamoney)
        const moneymade = eventlist.filter(e => (e.type === 'kill' || e.type === 'destroy') && (<KillEvent | DestroyEvent>e).player === player).sum(e => (<KillEvent | DestroyEvent>e).deltamoney)
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