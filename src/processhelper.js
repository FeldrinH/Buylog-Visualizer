import * as Util from './util'
import * as Info from './metainfo'
import Counter from './Counter'
import MultiCounter from './MultiCounter'

export function stateTimelineSeries(players) {
    const ret = []
    players.forEach((info, player) => {
        info.stateblocks.forEach(({start, end, state}) => {
            ret.push({
                x: player,
                y: [
                    start,
                    end
                ],
                fillColor: state === 'afk' ? '#aaaaff' : '#0000ff',
                state: state
            })
        })
    })
    return ret
}

export function eventPointSeries(eventlist, player) {
    const ret = []
    for (const e of eventlist) {
        if (e.player === player && ((e.category === 'buy' && e.type !== 'buy-ammo') || e.category === 'kill')) {
            ret.push({
                x: e.time,
                y: Math.abs(e.deltamoney),
                event: e
            })
        }
    }
    return ret
}

export function cityTimeSeries(eventlist, team) {
    const ret = []
    for (const e of eventlist) {
        if (e.category === 'city' && e.team === team) {
            ret.push({
                x: e.time,
                y: e.teamtime,
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

export function weaponCounts(eventlist, player, eventtypes) {
    const counts = new Counter()
    for (const e of eventlist) {
        if (e.player === player && eventtypes.has(e.type)) {
            const weapon = e.weapon || e.class
            counts.increment(weapon)
        }
    }

    return counts.map((weapon, value) => ({
        weapon: weapon,
        count: value
    })).sort((a,b) => a.weapon.localeCompare(b.weapon))
}

export function conflictBreakdown(eventlist, player) {
    const data = []
    const matches = new MultiCounter()
    for (const e of eventlist) {
        if (e.type === 'kill' && (e.player === player || e.victim === player)) {
            const ourwin = e.player === player
            const opponent = ourwin ? e.victim : e.player
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

export function killsBreakdown(eventlist, playerlist) {
    return playerlist.map(player => {
        const kills = eventlist.count(e => e.type === 'kill' && e.player === player)
        const deaths = eventlist.count(e => e.type === 'death' && e.player === player)
        const moneyspent = -eventlist.filter(e => e.category === 'buy' && e.player === player).reduce((acc, e) => acc + e.deltamoney, 0)
        const moneylost = -eventlist.filter(e => e.category === 'death' && e.player === player).reduce((acc, e) => acc + e.deltamoney, 0)
        const moneybailed = eventlist.filter(e => e.category === 'bailout' && e.player === player).reduce((acc, e) => acc + e.deltamoney, 0)
        const moneymade = eventlist.filter(e => (e.type === 'kill' || e.type === 'destroy') && e.player === player).reduce((acc, e) => acc + e.deltamoney, 0)
        return {
            player: player,
            kills: kills,
            deaths: deaths,
            kdr: Util.round(kills / deaths, 2),
            moneyspent: moneyspent,
            moneylost: moneylost,
            moneymade: moneymade,
            moneybailed: moneybailed
        }
    })
}