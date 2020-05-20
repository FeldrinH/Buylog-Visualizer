import * as Util from './util.js'

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

export function generateMatchupRadar(eventlist, player) {
    const data = []
    const matches = new Map()
    for (const e of eventlist) {
        if (e.type === 'kill' && (e.player === player || e.victim === player)) {
            const ourwin = e.player === player
            const opponent = ourwin ? e.victim : e.player
            const hist = matches.getset(opponent, { wins: 0, total: 0 })
            hist.wins += ourwin ? 1 : 0
            hist.total += 1
        }
    }

    return matches.map((key, value) => ({
        x: key,
        y: Math.round(value.wins / value.total * 1000) / 10,
        info: value
    }))
}