import * as Util from './util.js'
import Counter from './Counter'

export function eventPoints(eventlist, player) {
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

export function weaponCounts(eventlist, player, eventtypes) {
    const counts = new Counter()
    for (const e of eventlist) {
        if (e.player === player && eventtypes.has(e.type)) {
            const weapon = e.weapon || e.class
            counts.increment(weapon)
        }
    }

    console.log(counts)

    return counts.map((weapon, value) => ({
        weapon: weapon,
        count: value.get('')
        /*percent: Math.round(value.total / counts.total * 1000) / 10*/
    }))
}

export function countMovingAverage(eventlist, player, start, end, duration, step) {
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

export function teamTimes(eventlist, team) {
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

export function stateTimeline(players) {
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

export function calculateMatchupsInfo(eventlist, player) {
    const data = []
    const matches = new Counter()
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